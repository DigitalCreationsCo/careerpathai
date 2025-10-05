import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "auth";

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const messagesFromCookie = cookieStore.get("chat-messages");
  if (messagesFromCookie) {
    const initialMessages = messagesFromCookie as any;
    return (
        <Chat
            autoResume={false}
            id={id}
            initialChatModel={DEFAULT_CHAT_MODEL}
            initialMessages={initialMessages}
            key={id}
        />
    );
  }

  return (
    <Chat
        autoResume={false}
        id={id}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialMessages={[]}
        key={id}
    />
  );
}