// ============================================
// components/chat.tsx
// ============================================

"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAutoResumeFromCheckpoint } from "@/hooks/use-checkpoint";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { generateUUID } from "@/lib/utils";

export function Chat({
  chatId,
  initialMessages,
  autoResume,
  initialLastContext,
}: {
  chatId: string;
  initialMessages: ChatMessage[];
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [isResuming, setIsResuming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<"submitted" | "streaming" | "error" | "ready">("ready");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchResearchStream = useCallback(
    async ({ message, resume = false }: { message?: ChatMessage; resume?: boolean }) => {
      setStatus("submitted");
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const body = {
        chatId,
        message: resume 
          ? { role: "user", parts: [{ type: "text", text: "" }] } 
          : message,
      };

      try {
        const res = await fetch("/api/research/start", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
        });

        if (!res.ok) {
          setStatus("error");
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Internal error");
        }

        setStatus("streaming");
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; 

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const chunk = JSON.parse(line);
              console.log('[Chat] Chunk arrived: ', JSON.stringify(chunk));

              if (chunk.type === 'error') {
                throw new Error(chunk.error);
              }

              if (chunk.type === 'update') {
                if (chunk.data.messages && Array.isArray(chunk.data.messages)) {
                  const convertedMessages: ChatMessage[] = chunk.data.messages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role === 'human' ? 'user' : msg.role === 'ai' ? 'assistant' : msg.role,
                    parts: [{
                      type: 'text',
                      text: msg.content || ''
                    }],
                    createdAt: msg.timestamp
                  }));
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    ...convertedMessages.filter(
                      (msg) => !prevMessages.some((prev) => prev.id === msg.id)
                    )
                  ]);
                }
              }

              if (chunk.type === 'final') {
                // if (chunk.messages && Array.isArray(chunk.messages)) {
                //   const convertedMessages: ChatMessage[] = chunk.messages.map((msg: any) => ({
                //     id: msg.id || generateUUID(),
                //     role: msg.role === 'human' ? 'user' : msg.role === 'ai' ? 'assistant' : msg.role,
                //     parts: [{
                //       type: 'text',
                //       text: msg.content || ''
                //     }],
                //     createdAt: msg.timestamp
                //   }));
                //   setMessages((prevMessages) => [
                //     ...prevMessages,
                //     convertedMessages[convertedMessages.length - 1]
                //   ]);
                // }
                setStatus("ready");
              }

            } catch (parseError) {
              console.error('Failed to parse chunk:', line, parseError);
            }
          }
        }

        setIsResuming(false);

      } catch (error: any) {
        if (error.name === 'AbortError') {
          setStatus("ready");
          return;
        }
        
        setStatus("error");
        setIsResuming(false);
        toast.error(error?.message || "An error occurred during research");
      }
    },
    [chatId]
  );

  /**
   * Sends a new user message via the streaming API, ensuring that only one stream
   * is open at a time. If a stream is already in progress (status === "streaming" or "submitted"),
   * this function does not send another request.
   */
  const sendMessage = useCallback(
    async (msgInput: { role: "user"; parts: { type: "text"; text: string }[] }) => {
      // Prevent sending if a stream is already active
      if (status === "streaming" || status === "submitted") {
        toast.info("Please wait for the current response to finish.");
        return;
      }
      setInput("");
      const userMsg: ChatMessage = {
        id: generateUUID(),
        role: "user",
        parts: msgInput.parts,
      };

      setMessages((prev) => [...prev, userMsg]);
      await fetchResearchStream({ message: userMsg });
    },
    [fetchResearchStream, status]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("ready");
  }, []);

  const regenerate = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find((msg) => msg.role === "user");
    if (lastUserMsg) {
      // Remove messages after last user message
      const lastUserIndex = messages.findIndex(m => m.id === lastUserMsg.id);
      setMessages(messages.slice(0, lastUserIndex + 1));
      fetchResearchStream({ message: lastUserMsg });
    }
  }, [messages, fetchResearchStream]);

  const resumeStream = useCallback(async () => {
    await fetchResearchStream({ resume: true });
  }, [fetchResearchStream]);

  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
  const [hasSentInitialEmptyMessage, setHasSentInitialEmptyMessage] = useState(false);

  const handleResume = useCallback(async () => {
    console.log('Resuming from checkpoint...');
    setIsResuming(true);
    try {
      await resumeStream();
    } catch (error) {
      console.error("Resume error:", error);
      toast.error("Failed to resume research");
      setIsResuming(false);
    }
  }, [resumeStream]);

  const { hasCheckpoint, session, willResume } = useAutoResumeFromCheckpoint(
    chatId,
    handleResume,
    autoResume
  );

  useEffect(() => {
    const sendInitial = async () => {
      if (!willResume && !query && !hasSentInitialEmptyMessage) {
        if (initialMessages && initialMessages.length > 0) {
          // If there are initialMessages, send the first one.
          await fetchResearchStream({ message: initialMessages[0] });
          setHasSentInitialEmptyMessage(true);
        } else {
          // Otherwise, send an empty message to begin the stream.
          const emptyMessage = {
            id: generateUUID(),
            role: "user",
            parts: [{ type: "text", text: "" }],
          } as any;
          await fetchResearchStream({ message: emptyMessage });
          setHasSentInitialEmptyMessage(true);
        }
      }
    };
    sendInitial();
  }, [willResume, query, hasSentInitialEmptyMessage, initialMessages, fetchResearchStream]);

  // // Existing: Send query from URL as a message if present (and not after resume)
  // useEffect(() => {
  //   if (query && !hasAppendedQuery && !willResume) {
  //     sendMessage({
  //       role: "user",
  //       parts: [{ type: "text", text: query }],
  //     });
  //     setHasAppendedQuery(true);
  //   }
  // }, [query, sendMessage, hasAppendedQuery, willResume, chatId]);

  return (
    <div className="border overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col">
      {hasCheckpoint && session?.status === 'active' && !isResuming && (
        <div className="border-b border-blue-200 px-4 py-2 text-sm text-primary">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span>Previous research session found. Resuming automatically...</span>
            {session.researchBrief && (
              <span className="text-xs text-blue-600 truncate ml-2 max-w-md">
                {session.researchBrief}
              </span>
            )}
          </div>
        </div>
      )}

      <Messages
        chatId={chatId}
        messages={messages}
        regenerate={regenerate}
        setMessages={setMessages}
        status={status}
      />

      <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 px-2 pb-3 md:px-4 md:pb-4">
        <MultimodalInput
          chatId={chatId}
          input={input}
          messages={messages}
          sendMessage={sendMessage}
          setInput={setInput}
          setMessages={setMessages}
          status={status}
          stop={stop}
          usage={usage}
        />
      </div>

      {isResuming && (
        <div className="fixed top-4 right-4 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          <span>Resuming research...</span>
        </div>
      )}
    </div>
  );
}