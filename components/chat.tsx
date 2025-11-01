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
import { DownloadReportButton } from "./download-report-button";

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
  console.log('[Chat] Chat component mounted', { chatId, initialMessages, autoResume, initialLastContext });
  
  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [isResuming, setIsResuming] = useState(false);

  const allInitialMessages = createGreetingMessages().concat(filterEmptyMessages(initialMessages));
  console.log('[Chat] allInitialMessages:', allInitialMessages);
  const [rawMessages, setRawMessages] = useState<ChatMessage[]>(allInitialMessages);
  const [status, setStatus] = useState<"submitted" | "streaming" | "error" | "ready">("ready");
  const abortControllerRef = useRef<AbortController | null>(null);

  const isNewChat = initialMessages.length === 0;
  const [greetingComplete, setGreetingComplete] = useState(false);

  const greetingDelays = useGoldenRatio(1.0, 1.7, greetingMessageParts.length);
  console.log('[Chat] greetingDelays:', greetingDelays);
  const greetingAnimationDuration = greetingDelays[greetingDelays.length - 1] + 1;
  console.log('[Chat] greetingAnimationDuration:', greetingAnimationDuration);

  const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);
  const [finalReport, setFinalReport] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Chat/useEffect:greetingAnimationDuration] effect fired');
    if (greetingAnimationDuration > 0) {
      const timer = setTimeout(() => {
        console.log('[Chat/useEffect:greetingAnimationDuration] greetingComplete set true');
        setGreetingComplete(true);
      }, greetingAnimationDuration * 1000);
      return () => {
        console.log('[Chat/useEffect:greetingAnimationDuration] cleanup/clearTimeout');
        clearTimeout(timer);
      };
    }
  }, [greetingAnimationDuration]);
  
  const fetchResearchStream = useCallback(
    async ({ message, resume = false }: { message?: ChatMessage; resume?: boolean }) => {
      console.log('[Chat/fetchResearchStream] called', { chatId, message, resume });
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
        console.log('[Chat/fetchResearchStream] Sending fetch to /api/research/start', body);
        const res = await fetch("/api/research/start", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
        });

        console.log('[Chat/fetchResearchStream] Response status:', res.status);

        if (!res.ok) {
          setStatus("error");
          const json = await res.json().catch(() => ({}));
          console.error('[Chat/fetchResearchStream] Research fetch not OK!', json);
          throw new Error(json.error || "Internal error");
        }

        setStatus("streaming");
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[Chat/fetchResearchStream] Stream done');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const chunk = JSON.parse(line);
              console.log('[Chat/fetchResearchStream] Chunk arrived:', chunk);

              if (chunk.type === 'error') {
                console.error('[Chat/fetchResearchStream] Chunk error:', chunk.error);
                throw new Error(chunk.error);
              }

              if (chunk.type === 'update') {
                if (chunk.data.messages && Array.isArray(chunk.data.messages)) {
                  console.log('[Chat/fetchResearchStream] Processing update messages:', chunk.data.messages);
                  const convertedMessages: ChatMessage[] = chunk.data.messages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role === 'human' ? 'user' : msg.role === 'ai' ? 'assistant' : msg.role,
                    parts: [{
                      type: 'text',
                      text: msg.content || ''
                    }],
                    createdAt: msg.timestamp
                  }));
                  setRawMessages((prevMessages) => {
                    const newMessages = [
                      ...prevMessages,
                      ...convertedMessages.filter(
                        (msg) => !prevMessages.some((prev) => prev.id === msg.id)
                      )
                    ];
                    console.log('[Chat/fetchResearchStream] setRawMessages (update)', newMessages);
                    return newMessages;
                  });
                }
              }

              if (chunk.type === 'final') {
                if (chunk.finalReport) {
                  if ((chunk.finalReport as string).startsWith("Error")) {
                    throw new Error("An unexpected finalReport was received.");
                  } else {
                    console.log('[Chat/fetchResearchStream] Received final report:', chunk.finalReport);
                    setFinalReport(chunk.finalReport);
                  }
                }
                setStatus("ready");
                console.log('[Chat/fetchResearchStream] Status set to ready');
              }

            } catch (parseError) {
              console.error('[Chat/fetchResearchStream] Failed to parse chunk:', line, parseError);
            }
          }
        }

        setIsResuming(false);
        console.log('[Chat/fetchResearchStream] setIsResuming(false)');

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn('[Chat/fetchResearchStream] Aborted');
          setStatus("ready");
          return;
        }
        console.error('[Chat/fetchResearchStream] Error during streaming:', error);
        setStatus("error");
        setIsResuming(false);
        toast.error(error?.message || "An error occurred during research");
      }
    },
    [chatId]
  );

  const sendMessage = useCallback(
    async (msgInput: { role: "user"; parts: { type: "text"; text: string }[] }) => {
      console.log('[Chat/sendMessage] called', msgInput);
      // Prevent sending if a stream is already active
      if (status === "streaming" || status === "submitted") {
        console.warn("[Chat/sendMessage] Tried to send while busy. Status:", status);
        toast.info("Please wait for the current response to finish.");
        return;
      }
      setInput("");
      const userMsg: ChatMessage = {
        id: generateUUID(),
        role: "user",
        parts: msgInput.parts,
      };
      console.log('[Chat/sendMessage] Generated userMsg:', userMsg);

      setRawMessages((prev) => {
        const newMsgs = [...prev, userMsg];
        console.log('[Chat/sendMessage] setRawMessages', newMsgs);
        return newMsgs;
      });
      await fetchResearchStream({ message: userMsg });
    },
    [fetchResearchStream, status]
  );

  const stop = useCallback(() => {
    console.log('[Chat/stop] called');
    abortControllerRef.current?.abort();
    setStatus("ready");
    console.log('[Chat/stop] Status set to ready');
  }, []);

  const regenerate = useCallback(async () => {
    console.log('[Chat/regenerate] called');
    const lastUserMsg = [...rawMessages].reverse().find((msg) => msg.role === "user");
    if (lastUserMsg) {
      console.log('[Chat/regenerate] Last user message found:', lastUserMsg);
      const lastUserIndex = rawMessages.findIndex(m => m.id === lastUserMsg.id);
      setRawMessages(rawMessages.slice(0, lastUserIndex + 1));
      console.log('[Chat/regenerate] setRawMessages up to lastUserIndex:', lastUserIndex + 1);
      fetchResearchStream({ message: lastUserMsg });
    } else {
      console.log('[Chat/regenerate] No previous user message found.');
    }
  }, [rawMessages, fetchResearchStream]);

  const resumeStream = useCallback(async () => {
    console.log('[Chat/resumeStream] called');
    await fetchResearchStream({ resume: true });
  }, [fetchResearchStream]);

  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  console.log('[Chat] useSearchParams query:', query);

  const handleResume = useCallback(async () => {
    console.log('[Chat/handleResume] Resuming from checkpoint...');
    setIsResuming(true);
    try {
      await resumeStream();
      console.log('[Chat/handleResume] Resume stream finished successfully');
    } catch (error) {
      console.error("[Chat/handleResume] Resume error:", error);
      toast.error("Failed to resume research");
      setIsResuming(false);
    }
  }, [resumeStream]);

  const { hasCheckpoint, session, willResume } = useAutoResumeFromCheckpoint(
    chatId,
    handleResume,
    autoResume
  );
  console.log('[Chat/useAutoResumeFromCheckpoint]', { hasCheckpoint, session, willResume });

  const hasSentInitialRef = useRef(false);
  useEffect(() => {
    console.log('[Chat/useEffect:initialMessage] fired', { already: hasSentInitialRef.current, willResume, query, initialMessagesLen: initialMessages.length });
    if (hasSentInitialRef.current || willResume || query || initialMessages.length > 0) {
      return;
    }
    hasSentInitialRef.current = true;
    const sendInitial = async () => {
      const emptyMessage = {
        id: generateUUID(),
        role: "user",
        parts: [{ type: "text", text: "" }],
      } as any;
      console.log('[Chat/useEffect:initialMessage] sending initial empty message:', emptyMessage);
      await fetchResearchStream({ message: emptyMessage });
    };
    sendInitial();
  }, [willResume, query, initialMessages.length]);

  const shouldShowResumeBanner = hasCheckpoint 
    && session?.status === 'active' 
    && !isResuming 
    && rawMessages.length > 2;
  console.log('[Chat] shouldShowResumeBanner:', shouldShowResumeBanner);

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

      {finalReport && (
        <div className="fixed top-4 right-4 z-10 bg-background rounded-md">
          <DownloadReportButton markdownContent={finalReport} />
        </div>
      )}

      <Messages
        chatId={chatId}
        messages={rawMessages}
        regenerate={regenerate}
        setMessages={setRawMessages}
        status={status}
        isShowingGreeting={!greetingComplete}
      />

      <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 px-2 pb-3 md:px-4 md:pb-4">
        <MultimodalInput
          chatId={chatId}
          input={input}
          messages={rawMessages}
          sendMessage={sendMessage}
          setInput={setInput}
          setMessages={setRawMessages}
          status={status}
          stop={stop}
          usage={usage}
        />
      </div>

      {isResuming && !finalReport && (
        <div className="fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          <span>Resuming research...</span>
        </div>
      )}
    </div>
  );
}

export function isEmptyMessage(message: ChatMessage): boolean {
  console.log('[Chat/isEmptyMessage] called with message:', message);
  const text = message.parts
    ?.map(part => part.type === "text" ? part.text : '')
    .join('')
    .trim();
  const result = text === '' || text.length === 0;
  console.log('[Chat/isEmptyMessage] result:', result, '| text:', text);
  return result;
}

export function filterEmptyMessages(messages: ChatMessage[]): ChatMessage[] {
  console.log('[Chat/filterEmptyMessages] called with messages:', messages);
  const filtered = messages.filter(msg => !isEmptyMessage(msg));
  console.log('[Chat/filterEmptyMessages] filtered result:', filtered);
  return filtered;
}

function createGreetingMessages(): ChatMessage[] {
  console.log('[Chat/createGreetingMessages] called');
  const greetings = greetingMessageParts.map((text, index) => ({
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
  console.log('[Chat/createGreetingMessages] returning greetings:', greetings);
  return greetings;
}