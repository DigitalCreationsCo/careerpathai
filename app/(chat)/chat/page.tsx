import ClientChatWrapper from "@/components/chat-client-wrapper";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function NewChatPage() {
  const user = (await auth())?.user;
  if (!user?.id) {
    redirect('/login');
  }
  return (
    <div className="relative bg-gradient-primary-glow">
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background animate-gradient" />
      <ClientChatWrapper initialMessages={[]} />
    </div>
  );
}