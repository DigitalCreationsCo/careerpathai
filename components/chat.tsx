"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// import { useArtifactSelector } from "@/hooks/use-artifact";
// import { useAutoResume } from "@/hooks/use-auto-resume";
// import { useChatVisibility } from "@/hooks/use-chat-visibility";
// import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
// import { Artifact } from "./artifact";
// import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
// import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "sonner";
// import type { VisibilityType } from "./visibility-selector";
import { useAutoResumeFromCheckpoint } from "@/hooks/use-checkpoint";

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
  const { mutate } = useSWRConfig();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    experimental_throttle: 100,
    transport: new DefaultChatTransport({
      api: "/api/research/start",
      // fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        return {
          ...request,
          body: {
            ...request.body,
            id: request.id,
            chatId,
            message: request.messages.at(-1),
          },
        };
      },
    }),
    // generateId: generateUUID,
    onData: (dataPart) => {
      console.log('useChat onData: ', dataPart);
    },
    onFinish: (data) => {
      console.log('useChat onFinish: ', data);
      setIsResuming(false);
    },
    onError: (error) => {
      console.error('use Chat Error: ', error);
      setIsResuming(false);

      if (error instanceof ChatSDKError) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred during research");
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  const handleResume = useCallback(async () => {
    console.log('Resuming from checkpoint...');
    setIsResuming(true);
    
    try {
      // Send empty message to trigger checkpoint resume
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: "" }], // Empty signals resume from checkpoint
      });
      resumeStream();
    } catch (error) {
      console.error('Resume error:', error);
      toast.error("Failed to resume research");
      setIsResuming(false);
    }
  }, []);

  const { hasCheckpoint, session, willResume } = useAutoResumeFromCheckpoint(
    chatId,
    handleResume,
    autoResume
  );

  // Handle URL query parameter
  useEffect(() => {
    if (query && !hasAppendedQuery && !willResume) {
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      // window.history.replaceState({}, "", `/chat/${chatId}`);
    }
  }, [query, sendMessage, hasAppendedQuery, willResume, chatId]);

//   const [attachments, setAttachments] = useState<Attachment[]>([]);
//   const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

//   useAutoResume({
//     autoResume,
//     initialMessages,
//     resumeStream,
//     setMessages,
//   });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        {/* Checkpoint resume banner */}
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
            //   attachments={attachments}
              chatId={chatId}
              input={input}
              messages={messages}
              sendMessage={sendMessage}
            //   setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
            />
        </div>

         {/* Resume indicator */}
         {isResuming && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Resuming research...</span>
          </div>
        )}
      </div>

      {/* <Artifact
        attachments={attachments}
        chatId={chatId}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      /> */}

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}