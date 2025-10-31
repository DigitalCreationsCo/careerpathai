import { ChatMessage } from "@/lib/types";
import ClientChatWrapper from "@/components/chat-client-wrapper";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getChatById, saveChat } from "@/lib/db/queries/chat";
import { convertGraphMessagesToUIMessages, getGraphFinalState } from "@/lib/deepResearcher/checkpointerUtils";

export default async function ChatPage({
  params 
}: { 
  params: Promise<{ chatId: string }>
}) {
  const user = (await auth())?.user;
  if (!user?.id) {
    redirect('/login');
  }
  
  const chatId = (await params).chatId;
  let chat = await getChatById(chatId, user.id);
  if (!chat) {
    chat = await saveChat({
      id: chatId,
      userId: user.id,
      title: "Research Session",
    });
  }

  const savedState = await getGraphFinalState(chatId, user.id);

  //   let initialMessages: ChatMessage[] = [
//     //     {
//     //       id: generateUUID(),
//     //       role: "user",
//     //       parts: [{ 
//     //         type: "text", 
//     //         text: `SOFTWARE ENGINEER.
//     // 5 years in financial services, ecommerce, and tech enablement.
//     // Leadership and mentoring, project management, full stack web development, agentic AI development, cloud infrastructure, LLM use.
//     // San Francisco, NYC, Seattle, or Europe.
//     // 169k salary.
//     // Growth, ownership, equity shares, in-office work, account management.
//     // `
//     //       }]
//     //     }
//   ];
  let initialMessages: ChatMessage[] = [];
  if (savedState && typeof savedState === "object") {
    initialMessages = convertGraphMessagesToUIMessages(savedState as any) as any;
    console.log('initialMessages: ', JSON.stringify(initialMessages));
  }

  return (
    <div className="relative bg-gradient-primary-glow">
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background animate-gradient" />
      <ClientChatWrapper initialMessages={initialMessages} />
    </div>
  );
}