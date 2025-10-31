// ============================================
// components/chat.tsx
// ============================================
"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAutoResumeFromCheckpoint } from "@/hooks/use-checkpoint";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { generateUUID } from "@/lib/utils";
import { greetingMessageParts } from "./greeting";
import { useGoldenRatio } from "@/hooks/use-golden-ratio";

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
  const [rawMessages, setRawMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<"submitted" | "streaming" | "error" | "ready">("ready");
  const abortControllerRef = useRef<AbortController | null>(null);

  const [greetingComplete, setGreetingComplete] = useState(true);

  const greetingDelays = useGoldenRatio(1.0, 1.7, greetingMessageParts.length);
  const greetingAnimationDuration = greetingDelays[greetingDelays.length - 1] + 1;
  
  useEffect(() => {
    if (greetingAnimationDuration > 0) {
      const timer = setTimeout(() => {
        setGreetingComplete(true);
      }, greetingAnimationDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [greetingAnimationDuration]);

  const displayMessages = useMemo(() => {
    const filtered = filterEmptyMessages(rawMessages);
    const greetingMessages = createGreetingMessages(); 
    
    if (filtered.length === 0) {
      return greetingMessages;
    }

    if (!greetingComplete) {
      return greetingMessages;
    }
    
    return [...greetingMessages, ...filtered];
  }, [rawMessages, greetingComplete]);
  
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
                  setRawMessages((prevMessages) => [
                    ...prevMessages,
                    ...convertedMessages.filter(
                      (msg) => !prevMessages.some((prev) => prev.id === msg.id)
                    )
                  ]);
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

      setRawMessages((prev) => [...prev, userMsg]);
      await fetchResearchStream({ message: userMsg });
    },
    [fetchResearchStream, status]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("ready");
  }, []);

  const regenerate = useCallback(async () => {
    const lastUserMsg = [...rawMessages].reverse().find((msg) => msg.role === "user");
    if (lastUserMsg) {
      // Remove messages after last user message
      const lastUserIndex = rawMessages.findIndex(m => m.id === lastUserMsg.id);
      setRawMessages(rawMessages.slice(0, lastUserIndex + 1));
      fetchResearchStream({ message: lastUserMsg });
    }
  }, [rawMessages, fetchResearchStream]);

  const resumeStream = useCallback(async () => {
    await fetchResearchStream({ resume: true });
  }, [fetchResearchStream]);

  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);

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
      if (hasSentInitialMessage || willResume || query) {
        return;
      }

      if (initialMessages && initialMessages.length > 0) {
        await fetchResearchStream({ message: initialMessages[0] });
      } else {
        const emptyMessage = {
          id: generateUUID(),
          role: "user",
          parts: [{ type: "text", text: "" }],
        } as any;
        await fetchResearchStream({ message: emptyMessage });
      }
      setHasSentInitialMessage(true);
    };
    sendInitial();
  }, [hasSentInitialMessage, willResume, query, initialMessages, fetchResearchStream]);

  const shouldShowResumeBanner = hasCheckpoint 
    && session?.status === 'active' 
    && !isResuming 
    && rawMessages.length > 2;

  return (
    <div className="border overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col">
      {shouldShowResumeBanner && (
        <div className="border-b border-blue-200 px-4 py-2 text-sm text-primary">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span>Previous session found. Resuming...</span>
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
        messages={displayMessages}
        regenerate={regenerate}
        setMessages={setRawMessages}
        status={status}
      />

      <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 px-2 pb-3 md:px-4 md:pb-4">
        <MultimodalInput
          chatId={chatId}
          input={input}
          messages={displayMessages}
          sendMessage={sendMessage}
          setInput={setInput}
          setMessages={setRawMessages}
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

export function isEmptyMessage(message: ChatMessage): boolean {
  const text = message.parts
    ?.map(part => part.type === "text" ? part.text : '')
    .join('')
    .trim();
  return text === '' || text.length === 0;
}

export function filterEmptyMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(msg => !isEmptyMessage(msg));
}

function createGreetingMessages(): ChatMessage[] {
  return greetingMessageParts.map((text, index) => ({
    id: `greeting_synthetic_${index}`,
    role: 'assistant' as const,
    parts: [{
      type: 'text' as const,
      text
    }],
    createdAt: new Date().toISOString(),
    isGreeting: true,
    greetingIndex: index,
  }));
}