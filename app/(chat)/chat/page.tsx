import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { generateUUID } from "@/lib/utils";

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const messagesFromCookie = cookieStore.get("chat-messages");
  if (messagesFromCookie) {
    const initialMessages = messagesFromCookie as any;
    return (
        <Chat
            autoResume={false}
            chatId={id}
            initialMessages={initialMessages}
            key={id}
        />
    );
  }

  return (
    <Chat
        autoResume={false}
        chatId={id}
        initialMessages={[]}
        key={id}
    />
  );
}