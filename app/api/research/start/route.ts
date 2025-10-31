import util from "util";
import { auth } from "@/auth";
import { getOrCreateChat, updateChatTitle } from "@/lib/db/queries/chat";
import { checkpointerManager } from "@/lib/deepResearcher/checkpointer";
import { deepResearcher } from "@/lib/deepResearcher/deepResearcher";
import { sessionManager } from "@/lib/deepResearcher/sessionManager";
  import { HumanMessage } from "@langchain/core/messages";

export interface StartResearchRequest {
  message: { 
    id: string;
    role: "user";
    parts: [{ type: "text", text: string }];
  };
  chatId: string;
  configuration?: Record<string, any>;
  messageId?: string; 
}

export const runtime = 'nodejs';

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
    const validChatId = (await getOrCreateChat(user.id, body.chatId)).id;
    const session = await sessionManager.getOrCreateSession(user.id, validChatId, body.configuration);
    const config = sessionManager.createRunnableConfig(session);

    const checkpointer = await checkpointerManager.getCheckpointer();
    if (!checkpointer) {
      throw new Error("Failed to initialize checkpointer");
    }

    const existingCheckpoint = await checkpointerManager.loadCheckpoint(config);
    let text = body.message?.parts?.[0]?.text ?? ""

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

    const graph = deepResearcher.compile({ checkpointer });

    const input = shouldResume
      ? null // Running the same thread with a null input will continue from where we left off. This is enabled by LangGraph’s persistence layer.
      : ({
          messages: [
            new HumanMessage({
              id: persistantMessageId,
              content: text,
              additional_kwargs: { timestamp: new Date().toISOString() },
            }),
          ],
        });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isFirst = true;

        try {
          const streamConfig = {
            ...config,
            subgraphs: true,
            streamMode: process.env.NODE_ENV !== "production" ? [
              "values",
              "updates",
              "debug",
              "messages",
              "custom",
              "checkpoints",
              "tasks"
            ] : ["values" as const],
          };

          const graphStream = await graph.stream(input, streamConfig as any);

          for await (const streamUpdate of graphStream) {
            const [_, updateType, update] = streamUpdate as any;

            switch (updateType) {
              case "debug":
                console.debug("[DEBUG] update type:", update.type);
                console.debug("[DEBUG] payload:", update.payload);
                break;

              case "values":
                console.debug("[VALUES]:", update);
                break;

              case "updates":
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
                        nodeUpdate.researchBrief.substring(0, 30)
                      );
                    }
                    isFirst = false;
                  }
    
                  const aggregateMessages = [
                    ...(nodeUpdate.messages || []),
                    // ...(nodeUpdate.supervisorMessages || []),
                    // ...(nodeUpdate.researcherMessages || []),
                  ];
    
                  const serializedData = {
                    messages: aggregateMessages.length
                      ? aggregateMessages.map((msg: any) => ({
                          id: msg.id,
                          role: msg.type,
                          content: msg.content,
                          timestamp:
                            msg.additional_kwargs?.timestamp ||
                            new Date().toISOString(),
                        }))
                      : undefined,
                  };
    
                  const chunk = {
                    type: "update",
                    node: nodeName,
                    data: serializedData,
                    timestamp: new Date().toISOString(),
                    userMessageId: persistantMessageId, 
                  };
    
                  controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));

                  // try {
                  //   await checkpointerManager.saveCheckpoint(config);
                  //   console.debug(`[CHECKPOINT] Saved after node ${nodeName}`);
                  // } catch (persistErr) {
                  //   console.error("Checkpoint persistence failed:", persistErr);
                  // }
                }
                break;

              case "messages":
                const [msg, metadata] = update;
                console.log("[MESSAGES] update from node:", metadata.langgraph_node, `. Content: `, msg.content);
                break;

              case "custom":
                break;

              case "checkpoints":
                if (update) {
                  console.debug("[CHECKPOINTS] Checkpoint:", util.inspect(update, { depth: 2, colors: true }));
                }
                break;

              case "tasks":
                break;

              default:
                console.warn(`Unknown update type encountered in research stream: ${updateType}`);
                break;
            }
          }

          const finalState = await graph.getState(config);

          const finalAggregate = [
            ...(finalState.values.messages || []),
            // ...(finalState.values.supervisorMessages || []),
            // ...(finalState.values.researcherMessages || []),
          ];

          const serializedMessages = finalAggregate.map((msg: any) => ({
            id: msg.id,
            role: msg.type,
            content: msg.content,
            timestamp:
              msg.additional_kwargs?.timestamp || new Date().toISOString(),
          }));

          const finalChunk = {
            type: "final",
            messages: serializedMessages,
            finalReport: finalState.values.finalReport,
            timestamp: new Date().toISOString(),
            userMessageId: persistantMessageId,
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
            userMessageId: persistantMessageId, 
          };

          controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + "\n"));
        } finally {
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
      "X-Accel-Buffering": "no", 
      "Transfer-Encoding": "chunked",
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