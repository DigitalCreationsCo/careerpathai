import util from "util";
import { checkpointerManager } from "@/lib/deepResearcher/checkpointer";
import { sessionManager } from "@/lib/deepResearcher/sessionManager";
import { ResearchSession } from "@/lib/types";
import { UIMessage } from "ai";
import { ChatMessage } from "@langchain/core/messages";
import { roleMap } from "../utils";

/**
 * Check if a session has an active checkpoint that can be resumed
 */
export async function hasResumableCheckpoint(session: ResearchSession): Promise<boolean> {
  try {
    const config = sessionManager.createRunnableConfig(session);
    const checkpoint = await checkpointerManager.loadCheckpoint(config);
    
    // A checkpoint exists and session is not completed
    return checkpoint !== undefined && session.status !== 'completed';
  } catch (error) {
    console.error('Error checking for resumable checkpoint:', error);
    return false;
  }
}

/**
 * Get checkpoint metadata for a session
 */
export async function getCheckpointMetadata(session: ResearchSession) {
  try {
    const config = sessionManager.createRunnableConfig(session);
    const checkpoint = await checkpointerManager.loadCheckpoint(config);
    
    if (!checkpoint) {
      return null;
    }
    
    return {
      exists: true,
      channelValues: checkpoint.channel_values,
      parentConfig: (checkpoint as any).parent_config,
      // Add any other useful metadata
    };
  } catch (error) {
    console.error('Error getting checkpoint metadata:', error);
    return null;
  }
}

/**
 * List all checkpoints for a session (for debugging)
 */
export async function listSessionCheckpoints(session: ResearchSession) {
  try {
    const config = sessionManager.createRunnableConfig(session);
    const checkpoints: any[] = [];
    await checkpointerManager.listCheckpoints(config);
    return checkpoints;
  } catch (error) {
    console.error('Error listing checkpoints:', error);
    return [];
  }
}

/**
 * Format graph state for frontend display
 */
export function formatGraphStateForUI(state: any) {
  // Extract only UI-relevant information from graph state
  return {
    messages: state.messages || [],
    researchBrief: state.researchBrief || null,
    currentNode: state.current_node || null,
    status: state.status || 'unknown',
    // Add other fields as needed
  };
}

export const getThreadId = (userId: string, chatId: string) => {
  return `${userId}-${chatId}`;
};

/**
 * Get final saved state from completed graph
 * This is NOT resuming execution - just reading saved data
 */
export async function getGraphFinalState(chatId: string, userId: string): Promise<CheckpointChannelValues | null> {
  const checkpointer = await checkpointerManager.getCheckpointer();
  
  const config = {
    configurable: {
      thread_id: getThreadId(userId, chatId),
      userId,
      chatId,
    }
  };
  
  try {
    const checkpoint = await checkpointer!.get(config);
    console.log("getGraphFinalState loaded checkpoint:", JSON.stringify(checkpoint));

    return (checkpoint?.channel_values) as any || null;
  } catch (error) {
    console.error('Error loading graph state:', error);
    return null;
  }
}

export type CheckpointChannelValues = {
  messages?: ChatMessage[];
  // Add other channels if present
  [key: string]: any;
};

/**
 * Convert graph channel_values.messages (serialized LC messages)
 * into an array of UIMessage (for frontend/UI use).
 * @param channelValues channel_values from checkpoint
 * @returns Array<UIMessage>
 */
export function convertGraphMessagesToUIMessages(channelValues: CheckpointChannelValues): UIMessage[] {
  if (!channelValues?.messages || !Array.isArray(channelValues.messages)) {
    return [];
  }
  return channelValues.messages.map((raw) => {
    // Determine role
    let role: 'user' | 'assistant' | 'system' = "user";
    if (raw.id && Array.isArray(raw.id)) {
      const t = raw.id[2];
      if (t === "AIMessage") {
        role = "assistant";
      } else if (t === "HumanMessage") {
        role = "user";
      } else if (typeof t === "string") {
        if (t.toLowerCase().includes("system")) {
          role = "system";
        } else if (t.toLowerCase().includes("tool")) {
          role = "assistant";
        } else {
          role = t.endsWith("Message")
            ? (t.slice(0, -"Message".length).toLowerCase() as typeof role)
            : (t.toLowerCase() as typeof role);
        }
      }
    } else {
      role = roleMap[raw.type];
    }

    const parts = [];
    const tool_calls: any[] = [];

    // Always push text part
    parts.push({
      type: 'text',
      text: raw.lc_kwargs?.content ?? "",
    });

    // Future: handle experimental_attachments here if present in raw.kwargs

    // Tool calls (OpenAI/function call format)
    if (Array.isArray(raw.lc_kwargs?.tool_calls)) {
      for (const toolCall of raw.lc_kwargs.tool_calls) {
        tool_calls.push(toolCall);
      }
    }

    // Always ensure metadata has the right shape, tool_calls/invalid_tool_calls as array, etc.
    let metadata: Record<string, any> = {
      response_metadata: raw.lc_kwargs?.response_metadata,
      tool_calls: Array.isArray(raw.lc_kwargs?.tool_calls) ? raw.lc_kwargs?.tool_calls : [],
      invalid_tool_calls: Array.isArray(raw.lc_kwargs?.invalid_tool_calls) ? raw.lc_kwargs?.invalid_tool_calls : [],
      ...raw.lc_kwargs?.additional_kwargs
    };

    return {
      role,
      parts,
      id: raw.lc_kwargs?.id!,
      metadata
    } as UIMessage;
  });
}

/**
 * Check if graph execution is complete
 */
export async function isGraphComplete(chatId: string, userId: string) {
  const state = await getGraphFinalState(chatId, userId);
  
  // Graph is complete if finalReport exists
  return !!state?.finalReport;
}

/**
 * Initialize a new research session with checkpoint support
 */
export async function initializeResearchSession(
  userId: string,
  chatId: string,
  configuration?: Record<string, any>
) {
  // Create session (generates new threadId for checkpointing)
  const session = await sessionManager.createSession(userId, chatId, configuration);
  
  // Verify checkpointer is ready
  const checkpointer = await checkpointerManager.getCheckpointer();
  if (!checkpointer) {
    throw new Error("Checkpointer initialization failed");
  }
  
  console.log('Initialized research session:', {
    sessionId: session.id,
    threadId: session.threadId,
    chatId: session.chatId,
  });
  
  return session;
}

/**
 * Resume research session from checkpoint
 */
export async function resumeResearchSession(sessionId: string, userId: string) {
  const session = await sessionManager.getSession(sessionId, userId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  // Check if checkpoint exists
  const hasCheckpoint = await hasResumableCheckpoint(session);
  
  if (!hasCheckpoint) {
    throw new Error(`No resumable checkpoint found for session ${sessionId}`);
  }
  
  console.log('Resuming research session:', {
    sessionId: session.id,
    threadId: session.threadId,
    status: session.status,
  });
  
  return session;
}