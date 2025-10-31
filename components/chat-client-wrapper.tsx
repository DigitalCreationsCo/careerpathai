"use client";
import { generateUUID } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import { Chat } from "@/components/chat";
import { ChatMessage } from "@/lib/types";
import { useEffect, useState } from "react";

/**
 * Handles chatId for the chat session.
 * - If paramChatId is present, sync it to localStorage and use it.
 * - If paramChatId is not present, generate on the fly, sync to storage, and push to the route.
 * - Ensures chatId is available and won't break initial load or navigation between chats.
 */
export default function ClientChatWrapper({
  initialMessages,
}: {
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const params = useParams();
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    // Get chatId from param and from localStorage
    const paramChatId = (params?.chatId as string) || null;
    const storedChatId = typeof window !== 'undefined' ? localStorage.getItem("chatId") : null;

    // Case 1: URL has chat id (paramChatId)
    if (paramChatId) {
      // If localStorage doesn't match, sync it
      if (storedChatId !== paramChatId) {
        localStorage.setItem("chatId", paramChatId);
      }
      setChatId(paramChatId);
    } else {
      // Case 2: No chat id in URL: create or use local one and update URL
      let resolvedChatId = storedChatId;
      if (!resolvedChatId) {
        resolvedChatId = generateUUID();
        localStorage.setItem("chatId", resolvedChatId);
      }
      router.replace(`/chat/${resolvedChatId}`, { scroll: false });
    }
    // params.chatId, router as deps (avoid exhaustive-deps warning)
  }, [params?.chatId, router]);

  // Don't render Chat until chatId is set (avoids flicker or hydration mismatch)
  if (!chatId) return null;

  return (
    <Chat
      autoResume={false}
      chatId={chatId}
      initialMessages={initialMessages}
      key={chatId}
    />
  );
}