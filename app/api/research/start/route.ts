import { auth } from "@/auth";
import { getOrCreateChat, updateChatTitle } from "@/lib/db/queries/chat";
import { checkpointerManager } from "@/lib/deepResearcher/checkpointer";
import { deepResearcher } from "@/lib/deepResearcher/deepResearcher";
import { sessionManager } from "@/lib/deepResearcher/sessionManager";
import { createAISDKStream } from "@/lib/streamingUtils";

export interface StartResearchRequest {
  message: string;
  chatId?: string;
  configuration?: Record<string, any>;
}

export async function POST(req: Request) {
  const user = (await auth())?.user;
  console.log('API: Research/start, user: ', JSON.stringify(user, null, 2));
  
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  try {
    const body: StartResearchRequest = await req.json();
    console.log('Request body: ', JSON.stringify(body));
    
    const validChatId = await getOrCreateChat(user.id, body.chatId);

    const session = await sessionManager.getOrCreateSession(user.id, body.chatId, body.configuration);
    const config = sessionManager.createRunnableConfig(session);
    
    const checkpointer = await checkpointerManager.getCheckpointer();
    if (!checkpointer) {
      throw new Error("Failed to initialize checkpointer");
    }
    
    // Check for existing checkpoint
    const existingCheckpoint = await checkpointerManager.loadCheckpoint(config);
    const shouldResume = existingCheckpoint && (!body.message || body.message.trim() === '');
    
    console.log('Session:', {
      id: session.id,
      threadId: session.threadId,
      status: session.status,
      hasCheckpoint: !!existingCheckpoint,
      shouldResume,
    });
    
    // Compile graph with checkpointer
    const graph = deepResearcher.compile({ checkpointer });
    
    // Determine input: null to resume, or new message
    const input = shouldResume 
      ? null 
      : { 
          messages: [{ 
            role: 'user',
            content: body.message,
            // Add timestamp for tracking
            timestamp: new Date().toISOString(),
          }] 
        };
    
        console.log('Starting graph with config:', {
          mode: shouldResume ? 'Resume' : 'New',
          threadId: config.configurable?.threadId,
          userId: config.configurable?.userId,
          hasConfigurable: !!config.configurable,
        });
    
    // Create async generator for streaming
    const streamGraph = async function*() {
      let isFirst = true;
      
      try {
        console.log('Pre-stream validation:', {
          sessionThreadId: session.threadId,
          configThreadId: config.configurable?.thread_id,
          configKeys: Object.keys(config.configurable || {}),
        });
        
        const streamConfig = { ...config, streamMode: 'values' as const };
        const stream = await graph.stream(input, streamConfig);
        
        for await (const chunk of stream) {
          console.log('Graph state update:', {
            hasMessages: !!chunk.messages,
            messageCount: chunk.messages?.length,
            researchBrief: !!chunk.researchBrief,
            node: chunk.current_node,
          });
          
          // Update session on first meaningful chunk
          if (isFirst && chunk.researchBrief) {
            await sessionManager.updateSessionStatus(
              session.id,
              user.id!,
              'active',
              chunk.researchBrief
            );

            // Update chat title with research brief
            if (session.chatId) {
              await updateChatTitle(
                session.chatId,
                user.id!,
                chunk.researchBrief.substring(0, 100) // Truncate for title
              );
            }
            
            isFirst = false;
          }
          
          yield chunk;
        }
        
        // Mark session as completed
        console.log('Graph execution completed');
        await sessionManager.updateSessionStatus(
          session.id,
          user.id!,
          'completed'
        );
        
      } catch (error) {
        console.error('Graph execution error:', error);
        
        // Update session to error state
        await sessionManager.updateSessionStatus(
          session.id,
          user.id!,
          'error'
        );
        
        throw error;
      }
    };
    
    // Convert to AI SDK compatible stream
    const aiStream = createAISDKStream(streamGraph());
    
    return new Response(aiStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Content-Type-Options": "nosniff",
        "X-Session-Id": session.id,
        "X-Thread-Id": session.threadId,
        "X-Resume-Mode": shouldResume ? "true" : "false",
      },
    });
    
  } catch (error) {
    console.error('Research start error:', error);
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
