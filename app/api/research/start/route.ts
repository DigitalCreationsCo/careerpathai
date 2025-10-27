import { auth } from "@/auth";
import { getOrCreateChat, updateChatTitle } from "@/lib/db/queries/chat";
import { checkpointerManager } from "@/lib/deepResearcher/checkpointer";
import { deepResearcher } from "@/lib/deepResearcher/deepResearcher";
import { sessionManager } from "@/lib/deepResearcher/sessionManager";
import { HumanMessage } from "@langchain/core/messages";

export interface StartResearchRequest {
  message: any;
  chatId?: string;
  configuration?: Record<string, any>;
  messageId?: string; // For explicitness if client sends one
}

export async function POST(req: Request) {
  const user = (await auth())?.user;

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: StartResearchRequest = await req.json();
    const validChatId = await getOrCreateChat(user.id, body.chatId);
    const session = await sessionManager.getOrCreateSession(user.id, validChatId, body.configuration);
    const config = sessionManager.createRunnableConfig(session);

    const checkpointer = await checkpointerManager.getCheckpointer();
    if (!checkpointer) {
      throw new Error("Failed to initialize checkpointer");
    }

    const existingCheckpoint = await checkpointerManager.loadCheckpoint(config);
    let text = body.message?.parts?.[0]?.text;
    const shouldResume = existingCheckpoint && (!text || text?.trim() === "");

    // Choose or generate persistent message id
    // 1. Prefer explicit messageId in request, 
    // 2. Then check for id inside message object,
    // 3. Then fall back to a generated value.
    let persistantMessageId: string | undefined;
    if (body.messageId) {
      persistantMessageId = body.messageId;
    } else if (body.message?.id) {
      persistantMessageId = body.message.id;
    } else {
      // Fallback, not ideal: generate random string. For reliability, client should send message id.
      persistantMessageId = (
        "msg_" +
        Math.random().toString(36).substring(2, 10) +
        "_" +
        Date.now().toString()
      );
    }

    // Compile graph with checkpointer
    const graph = deepResearcher.compile({ checkpointer });

    // Determine input, now with id (tracked)
    const input = shouldResume
      ? null
      : {
          messages: [
            new HumanMessage({
              id: persistantMessageId,
              content: text || body.message?.content,
              additional_kwargs: { timestamp: new Date().toISOString() },
            }),
          ],
        };

    // Create ReadableStream for NDJSON streaming
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isFirst = true;

        try {
          // Use 'values' mode to get complete state after each node
          const streamConfig = {
            ...config,
            streamMode: "updates" as const,
          };

          const graphStream = await graph.stream(input, streamConfig as any);

          for await (const update of graphStream) {
            // Extract messages from the update
            // update format: { [nodeName]: { messages: [...], otherState: ... } }
            const nodeNames = Object.keys(update as any);

            for (const nodeName of nodeNames) {
              const nodeUpdate = (update as any)[nodeName];

              console.log("Node update:", {
                node: nodeName,
                hasMessages: !!nodeUpdate.messages,
                messageCount: nodeUpdate.messages?.length,
                hasBrief: !!nodeUpdate.researchBrief,
              });

              // Handle research brief for title
              if (isFirst && nodeUpdate.researchBrief) {
                await sessionManager.updateSessionStatus(
                  session.id,
                  user.id!,
                  "active",
                  nodeUpdate.researchBrief
                );

                if (session.chatId) {
                  await updateChatTitle(
                    session.chatId,
                    user.id!,
                    nodeUpdate.researchBrief.substring(0, 100)
                  );
                }
                isFirst = false;
              }

              // Convert LangChain messages to serializable format, include id
              const serializedData = {
                ...nodeUpdate,
                messages: nodeUpdate.messages?.map((msg: any) => ({
                  id: msg.id, // should propagate id from input user message
                  role: msg.type,
                  content: msg.content,
                  timestamp:
                    msg.additional_kwargs?.timestamp ||
                    new Date().toISOString(),
                })),
              };

              // Stream the update as NDJSON, also send userMessageId for tracking
              const chunk = {
                type: "update",
                node: nodeName,
                data: serializedData,
                timestamp: new Date().toISOString(),
                userMessageId: persistantMessageId, // <--- sent on each update event
              };

              controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
            }
          }

          // Get final state to send complete messages
          const finalState = await graph.getState(config);

          // Serialize final messages; also include ids
          const serializedMessages = (finalState.values.messages || []).map(
            (msg: any) => ({
              id: msg.id,
              role: msg.type,
              content: msg.content,
              timestamp:
                msg.additional_kwargs?.timestamp || new Date().toISOString(),
            })
          );

          const finalChunk = {
            type: "final",
            messages: serializedMessages,
            finalReport: finalState.values.finalReport,
            timestamp: new Date().toISOString(),
            userMessageId: persistantMessageId, // <--- continue id tracking in output
          };

          controller.enqueue(encoder.encode(JSON.stringify(finalChunk) + "\n"));

          await sessionManager.updateSessionStatus(
            session.id,
            user.id!,
            "completed"
          );

          controller.close();
        } catch (error) {
          console.error("Graph execution error:", error);

          await sessionManager.updateSessionStatus(
            session.id,
            user.id!,
            "error"
          );

          const errorChunk = {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
            userMessageId: persistantMessageId, // Include on errors also for UI
          };

          controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + "\n"));
          controller.close();
        }
      },
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      "X-Session-Id": session.id,
      "X-Thread-Id": session.threadId,
      "X-Resume-Mode": shouldResume ? "true" : "false",
    };
    if (persistantMessageId) headers["X-User-Message-Id"] = persistantMessageId;

    return new Response(stream, {
      headers,
    });
  } catch (error) {
    console.error("Research start error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}