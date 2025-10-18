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
    researchBrief: state.research_brief || null,
    currentNode: state.current_node || null,
    status: state.status || 'unknown',
    // Add other fields as needed
  };
}
