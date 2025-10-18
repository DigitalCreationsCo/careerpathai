import { auth } from "@/auth";
import { checkpointerManager } from "@/lib/deepResearcher/checkpointer";
import { deepResearcher } from "@/lib/deepResearcher/deepResearcher";
import { sessionManager } from "@/lib/deepResearcher/sessionManager";

export interface StartResearchRequest {
  message: string
  chat_id?: string
  configuration?: Record<string, any>
}

export async function POST(req: Request) {
  
  const user = (await auth())?.user;
  console.debug('API: Research/start, user: ', JSON.stringify(user, null, 2));

  console.debug('API: Research/start, user: ', JSON.stringify(user));
  if (!user) {
    throw Error("No user found. Unauthorized.")
  }
  
  if (!user.id) {
    throw Error("User is no id. Unauthorized.")
  }
  
  
  const body: StartResearchRequest = req.body as any;

  const session = await sessionManager.createSession(user.id, body.chat_id, body.configuration)

  const config = sessionManager.createRunnableConfig(session)
  const checkpointer = await checkpointerManager.getCheckpointer() as any;
  const graph = deepResearcher.compile({ checkpointer })

  const chunks = await graph.stream(
    { messages: [{ role: 'user', content: body.message }] },
    config,
  )

  console.debug('chunks ', chunks);
  
  const reader = chunks.getReader(); // ✅ create reader ONCE
  let isFirst = true;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log('Stream finished.');
        break;
      }

      console.log('Received chunk:', value);

      if (isFirst && value?.research_brief) {
        await sessionManager.updateSessionStatus(
          session.id,
          user.id!,
          'active',
          value.research_brief
        );
        isFirst = false;
      }
    }
  } finally {
    reader.releaseLock(); // ✅ optional but clean
  }

  return Response.json(session)
}
