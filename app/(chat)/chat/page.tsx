import { cookies } from "next/headers";
import { generateUUID } from "@/lib/utils";
import { ChatMessage } from "@/lib/types";
import ClientChatWrapper from "@/components/chat-client-wrapper";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function NewChatPage() {
  const user = (await auth())?.user;
  if (!user?.id) {
    redirect('/login');
  }
  
  let initialMessages: ChatMessage[] = [
    //     {
    //       id: generateUUID(),
    //       role: "user",
    //       parts: [{ 
    //         type: "text", 
    //         text: `SOFTWARE ENGINEER.
    // 5 years in financial services, ecommerce, and tech enablement.
    // Leadership and mentoring, project management, full stack web development, agentic AI development, cloud infrastructure, LLM use.
    // San Francisco, NYC, Seattle, or Europe.
    // 169k salary.
    // Growth, ownership, equity shares, in-office work, account management.
    // `
    //       }]
    //     }
  ];
      
  return (
    <div className="relative bg-gradient-primary-glow">
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background animate-gradient" />
      <ClientChatWrapper initialMessages={initialMessages} />
    </div>
  );
}