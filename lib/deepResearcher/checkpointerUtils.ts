/**
 * Helper utilities for checkpoint management
 */

import { checkpointerManager } from "@/lib/deepResearcher/checkpointer";
import { sessionManager } from "@/lib/deepResearcher/sessionManager";
import { ResearchSession } from "@/lib/types";

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
      parentConfig: checkpoint.parent_config,
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
    
    // The listCheckpoints method returns an async iterator
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

/**
 * Convert LangGraph message format to ChatMessage format
 */
export function convertToUIMessage(graphMessage: any): {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
} {
  // Map LangGraph roles to UI roles
  const roleMap: Record<string, 'user' | 'assistant' | 'system'> = {
    human: 'user',
    user: 'user',
    ai: 'assistant',
    assistant: 'assistant',
    system: 'system',
    tool: 'assistant', // Tool responses shown as assistant
  };
  
  return {
    role: roleMap[graphMessage.role] || 'assistant',
    content: graphMessage.content || '',
    id: graphMessage.id,
  };
}

/**
 * Initialize a new research session with checkpoint support
 */
export async function initializeResearchSession(
  userId: string,
  chatId?: string,
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