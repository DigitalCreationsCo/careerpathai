import { auth } from "@/auth";
import { checkpointerManager } from "@/lib/deepResearcher/checkpointer";
import { deepResearcher } from "@/lib/deepResearcher/deepResearcher";
import { sessionManager } from "@/lib/deepResearcher/sessionManager";
import { AIMessage, AIMessageChunk, filterMessages } from "@langchain/core/messages";

export interface StartResearchRequest {
  message: string
  chatId?: string
  configuration?: Record<string, any>
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
    console.log('request body: ', JSON.stringify(body));

    const session = await sessionManager.getOrCreateSession(user.id, body.chatId, body.configuration)
    const config = sessionManager.createRunnableConfig(session)
    
    const checkpointer = await checkpointerManager.getCheckpointer() as any;
    const existingCheckpoint = await checkpointerManager.loadCheckpoint(config);

    console.log('Session:', session.id, 'ThreadId:', session.threadId);
    console.log('Existing checkpoint:', existingCheckpoint ? 'Found' : 'None');

    const graph = deepResearcher.compile({ checkpointer })

    const input = existingCheckpoint && !body.message 
    ? null 
    : { messages: [{ role: 'user', content: body.message }] };
    console.log('Starting graph with input:', input ? 'New message' : 'Resume from checkpoint');

    const stream = await graph.stream(input,
      { 
        ...config,
        streamMode: ['values', 'updates', 'checkpoints', 'debug', 'messages', 'tasks'] as const
      },
    )

    const textStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isFirst = true;
        
        try {
          while (true) {
            const { value: chunk, done } = await stream.reader.read();
            if (done) break;

            console.log('Graph chunk:', JSON.stringify(chunk, null, 2));
            
            const aiMessages = filterMessages(chunk, { includeTypes: [AIMessage, AIMessageChunk]});

            for (const message of aiMessages) {
              const dataLine = `0:${JSON.stringify(message)}\n`;
              controller.enqueue(encoder.encode(dataLine));
            }

            if (isFirst && chunk?.researchBrief) {
              await sessionManager.updateSessionStatus(
                session.id,
                user.id!,
                'active',
                chunk.researchBrief
              );
              isFirst = false;
            }
          }

          // Mark session as completed
          await sessionManager.updateSessionStatus(
            session.id,
            user.id!,
            'completed'
          );

          console.log('Stream completed successfully');
        } catch (err) {
          console.error("Streaming error:", err);

          await sessionManager.updateSessionStatus(
            session.id,
            user.id!,
            'error'
          );

          controller.error(err);
        } finally {
          controller.close();
          stream.reader.releaseLock();
        }
      }
    });

    return new Response(textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Session-Id": session.id,
        "X-Thread-Id": session.threadId,
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
