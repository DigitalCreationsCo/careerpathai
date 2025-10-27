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

// Convert LangChain message to ChatMessage
function convertMessage(lcMessage: any): ChatMessage {
  return {
    id: lcMessage.id || Math.random().toString(36).slice(2),
    role: lcMessage.role === 'user' ? 'user' : 'assistant',
    parts: [{
      type: 'text',
      text: lcMessage.content || ''
    }],
    // createdAt: lcMessage.timestamp || new Date().toISOString()
  };
}

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
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const chunk = JSON.parse(line);
              console.log('[Chat] Chunk arrived: ', JSON.stringify(chunk));

              if (chunk.type === 'error') {
                throw new Error(chunk.error);
              }

              if (chunk.type === 'update') {
                // Update from graph state - convert messages
                if (chunk.data.messages && Array.isArray(chunk.data.messages)) {
                  const convertedMessages = chunk.data.messages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role === 'human' ? 'user' : msg.role === 'ai' ? 'assistant' : msg.role,
                    parts: [{
                      type: 'text',
                      text: msg.content || ''
                    }],
                    createdAt: msg.timestamp
                  }));
                  setMessages((prev) => [...prev, ...convertedMessages]);
                }
              }

              if (chunk.type === 'final') {
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

  const sendMessage = useCallback(
    async (msgInput: { role: "user"; parts: { type: "text"; text: string }[] }) => {
      setInput("");
      const userMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: "user",
        parts: msgInput.parts,
        // createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      await fetchResearchStream({ message: userMsg });
    },
    [fetchResearchStream]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("ready");
  }, []);

  const regenerate = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find((msg) => msg.role === "user");
    if (lastUserMsg) {
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

  // Send a message with empty text to start assistant on load if nothing else triggers
  useEffect(() => {
    const sendInitalMessage = async () => {
      // Only run when: 
      // - there is no checkpoint auto-resume happening,
      // - there is no query parameter,
      // - initialMessages is empty,
      // - we haven't sent it already for this session
      if (
        !willResume
        && !query
        && !hasSentInitialEmptyMessage
        && initialMessages.length === 0
      ) {
        const initialMessage = { 
          id: generateUUID(),
          role: "user",
          parts: [{ type: "text", text: "" }],
        } as any;
        await fetchResearchStream({ message: initialMessage });
        setHasSentInitialEmptyMessage(true);
      }
    }
    sendInitalMessage();
  }, [willResume, query, hasSentInitialEmptyMessage, initialMessages, sendMessage, chatId]);

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
    <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
      {hasCheckpoint && session?.status === 'active' && !isResuming && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800">
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

      <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
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
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          <span>Resuming research...</span>
        </div>
      )}
    </div>
  );
}