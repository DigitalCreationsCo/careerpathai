import { auth } from "@/auth";
import { checkpointerManager } from "@/lib/researcher/checkpointer";
import { deepResearcher } from "@/lib/researcher/deepResearcher";
import { sessionManager } from "@/lib/researcher/sessionManager";

export interface StartResearchRequest {
  message: string
  chat_id?: string
  configuration?: Record<string, any>
}

export async function POST(req: Request) {

  const user = (await auth())?.user;
  if (!user) {
    throw Error("No user. Unauthorized.")
  }
  
  const body: StartResearchRequest = req.body as any;
  const session = await sessionManager.createSession(user.id!, body.chat_id, body.configuration)

  const config = sessionManager.createRunnableConfig(session)
  const checkpointer = await checkpointerManager.getCheckpointer() as any;
  const graph = deepResearcher.compile({ checkpointer })

  // Stream first chunk to initialize session
  const chunks = await graph.stream(
    { messages: [{ role: 'user', content: body.message }] },
    config,
  )
  
  let isFirst = true;

  while (true) {
    const { value, done } = await chunks.getReader().read();
    if (done) {
      console.log('Stream finished.');
      break;
    }

    const chunk = value;
    console.log('Received chunk:', chunk);
    
    if (isFirst) {
      if ((chunk as any).research_brief) {
        await sessionManager.updateSessionStatus(
          session.id,
          user.id!,
          'active',
          (chunk as any).research_brief
        )
      }

      isFirst = false;
    }
  }

  return Response.json(session)
}
