import { auth } from "@/auth";
import { sessionManager } from "@/lib/deepResearcher/sessionManager";
import { hasResumableCheckpoint, getCheckpointMetadata } from "@/lib/deepResearcher/checkpointerUtils";

/**
 * GET - Check if a chat has a resumable checkpoint
 */
export async function GET(req: Request) {
  const user = (await auth())?.user;
  
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "chatId is required" }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Find session by chatId
    const sessions = await sessionManager.getUserSessions(user.id, undefined, 1, 0);
    const session = sessions.find(s => s.chatId === chatId);
    
    if (!session) {
      return new Response(
        JSON.stringify({ 
          hasCheckpoint: false,
          session: null,
        }), 
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Check for resumable checkpoint
    const canResume = await hasResumableCheckpoint(session);
    const metadata = canResume ? await getCheckpointMetadata(session) : null;
    
    return new Response(
      JSON.stringify({
        hasCheckpoint: canResume,
        session: {
          id: session.id,
          threadId: session.threadId,
          status: session.status,
          researchBrief: session.researchBrief,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        checkpoint: metadata,
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error('Checkpoint status error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}