import { cookies } from "next/headers";
import { Chat } from "@/components/chat";
import { generateUUID } from "@/lib/utils";
import { ChatMessage } from "@/lib/types";

export default async function Page() {
  const chatId = generateUUID();

  let initialMessages: ChatMessage[] = [
    {
      id: generateUUID(),
      role: "user",
      parts: [{ 
        type: "text", 
        text: `SOFTWARE ENGINEER.
5 years in financial services, ecommerce, and tech enablement.
Leadership and mentoring, project management, full stack web development, agentic AI development, cloud infrastructure, LLM use.
San Francisco, NYC, Seattle, or Europe.
169k salary.
Growth, ownership, equity shares, in-office work, account management.
`
      }]
    }
  ];

  const cookieStore = await cookies();
  const messagesFromCookie = cookieStore.get("chat-messages");
  if (messagesFromCookie) {
    initialMessages = messagesFromCookie as any;
  }

  return (
    <Chat
        autoResume={false}
        chatId={chatId}
        initialMessages={initialMessages}
        key={chatId}
    />
  );
}