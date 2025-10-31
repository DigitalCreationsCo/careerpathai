import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { ArrowDownIcon } from "lucide-react";
import { memo, useEffect } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { ChatMessage } from "@/lib/types";
import { Conversation, ConversationContent } from "./conversation";
import { PreviewMessage, ThinkingMessage } from "./message";
import { useGoldenRatio } from "@/hooks/use-golden-ratio";

type MessagesProps = {
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
};

function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  regenerate,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
  } = useMessages({
    status,
  });
  const isShowingGreeting = messages.every((msg: any) => msg.isGreeting);
  const greetingDelays = useGoldenRatio(1.0, 1.7, messages.length);

  useEffect(() => {
    if (status === "submitted") {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  }, [status, messagesContainerRef]);

  return (
    <div
      className="overscroll-behavior-contain -webkit-overflow-scrolling-touch flex-1 touch-pan-y overflow-y-scroll"
      ref={messagesContainerRef}
      style={{ overflowAnchor: "none" }}
    >
      <Conversation className="mx-auto flex w-full min-w-0 flex-col gap-4 md:gap-6">
        <ConversationContent className="mx-auto flex flex-col max-w-4xl gap-4 px-2 py-4 md:gap-4 md:px-4">
          {messages.map((message, index) => {
            const greetingIndex = (message as any).greetingIndex ?? index;
            return (
            <PreviewMessage
              chatId={chatId}
              isLoading={
                status === "streaming" && messages.length - 1 === index
              }
              msgIndex={index}
              isGreeting={isShowingGreeting}
              delay={greetingDelays[greetingIndex]}
              key={message.id}
              message={message}
              regenerate={regenerate}
              requiresScrollPadding={
                hasSentMessage && index === messages.length - 1
              }
              setMessages={setMessages}
            />);
            })}

          {status === "submitted" &&
            messages.length > 0 &&
            messages.at(-1)?.role === "user" && <ThinkingMessage />}

          <div
            className="min-h-[24px] min-w-[24px] shrink-0"
            ref={messagesEndRef}
          />
        </ConversationContent>
      </Conversation>

      {!isAtBottom && (
        <button
          aria-label="Scroll to bottom"
          className="-translate-x-1/2 absolute bottom-40 left-1/2 z-10 rounded-full border border-muted-foreground bg-background p-2 shadow-lg transition-colors hover:bg-muted"
          onClick={() => scrollToBottom("smooth")}
          type="button"
        >
          <ArrowDownIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) {
    return false;
  }
  // if (prevProps.selectedModelId !== nextProps.selectedModelId) {
  //   return false;
  // }
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  if (!equal(prevProps.messages, nextProps.messages)) {
    return false;
  }
  // if (!equal(prevProps.votes, nextProps.votes)) {
  //   return false;
  // }

  return false;
});