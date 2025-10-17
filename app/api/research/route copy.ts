import { NextApiRequest, NextApiResponse } from 'next'
import { EventEmitter } from 'events'
import { generateUUID } from "@/lib/utils";
import { sessionManager } from '@/lib/researcher/sessionManager'
import { checkpointerManager } from '@/lib/researcher/checkpointerManager'
import { deepResearcher } from '@/lib/researcher/deepResearcher'
import { auth } from '@/auth';


export interface SendMessageRequest {
  message: string
}

export interface ResearchSessionResponse {
  id: string
  user_id: string
  chat_id?: string
  thread_id: string
  status: string
  research_brief?: string
  configuration?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ResearchSessionsResponse {
  sessions: ResearchSessionResponse[]
  total: number
}

function modelFlagName(modelEnvName: string): string {
  const flag = `${modelEnvName.toUpperCase()}_OPENAI_COMPATIBLE`
  console.debug(`[modelFlagName] ${modelEnvName} -> ${flag}`)
  return flag
}

function isModelOpenAICompatibleFromEnv(modelEnvName: string): boolean {
  const flagKey = modelFlagName(modelEnvName)
  const val = process.env[flagKey]?.toLowerCase()
  const compatible = val === '1' || val === 'true' || val === 'yes'
  console.debug(`[isModelOpenAICompatibleFromEnv] ${flagKey}=${process.env[flagKey]}, compatible=${compatible}`)
  return compatible
}

function setModelOpenAICompatibleFlag(modelEnvName: string, value: boolean) {
  const flagKey = modelFlagName(modelEnvName)
  process.env[flagKey] = value ? 'true' : 'false'
  console.info(`Set ${flagKey} = ${process.env[flagKey]}`)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const session = await auth();
  const user = session?.user;
  const { method, query } = req
  const path = (query.research as string[] || []).join('/')

  try {
    if (method === 'GET' && path === 'sessions') {
      const { status_filter, limit = 50, offset = 0 } = req.query
      const sessions = await sessionManager.getUserSessions({
        user_id: user.id,
        status: status_filter as string,
        limit: Number(limit),
        offset: Number(offset),
      })
      const response: ResearchSessionsResponse = {
        sessions,
        total: sessions.length,
      }
      return res.status(200).json(response)
    }

    if (method === 'GET' && path.startsWith('session/')) {
      const sessionId = path.split('/')[1]
      const session = await sessionManager.getSession(sessionId, user.id)
      if (!session) return res.status(404).json({ error: 'Session not found' })
      return res.status(200).json(session)
    }

    if (method === 'POST' && path.startsWith('session/') && path.endsWith('/message')) {
      const sessionId = path.split('/')[1]
      const body: SendMessageRequest = req.body
      const session = await sessionManager.getSession(sessionId, user.id)
      if (!session) return res.status(404).json({ error: 'Session not found' })
      if (!['active', 'clarification_needed'].includes(session.status))
        return res.status(400).json({ error: 'Session is not active' })

      const config = sessionManager.createRunnableConfig(session)
      const checkpointer = await checkpointerManager.getCheckpointer()
      const graph = deepResearcher.compile({ checkpointer })

      const chunks = await graph.astream({ messages: [{ role: 'user', content: body.message }] }, config, 'updates')
      for (const chunk of chunks) {
        if (chunk?.research_brief) {
          await sessionManager.updateSessionStatus(sessionId, user.id, 'active', chunk.research_brief)
        }
      }

      return res.status(200).json({ status: 'message_sent', session_id: sessionId })
    }

    if (method === 'GET' && path.startsWith('stream/')) {
      const sessionId = path.split('/')[1]
      const session = await sessionManager.getSession(sessionId, user.id)
      if (!session) return res.status(404).json({ error: 'Session not found' })

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })

      const config = sessionManager.createRunnableConfig(session)
      const checkpointer = await checkpointerManager.getCheckpointer()
      const graph = deepResearcher.compile({ checkpointer })

      const emitter = new EventEmitter()

      ;(async () => {
        const currentState = graph.getState(config)
        const chunks = await graph.astream({ messages: [] }, config, 'updates')
        for (const chunk of chunks) {
          res.write(`event: research_update\ndata: ${JSON.stringify({ type: 'update', data: chunk, timestamp: generateUUID() })}\n\n`)
          if (chunk.final_report) {
            await sessionManager.completeSession(sessionId, user.id, session.research_brief)
            res.write(`event: research_complete\ndata: ${JSON.stringify({ type: 'completion', final_report: chunk.final_report, session_id: sessionId })}\n\n`)
            break
          }
          if (chunk.messages?.some((m: any) => m.includes('clarification'))) {
            await sessionManager.updateSessionStatus(sessionId, user.id, 'clarification_needed')
            res.write(`event: clarification_needed\ndata: ${JSON.stringify({ type: 'clarification', session_id: sessionId })}\n\n`)
          }
        }
        res.end()
      })()

      return
    }

    if (method === 'DELETE' && path.startsWith('session/')) {
      const sessionId = path.split('/')[1]
      const success = await sessionManager.deleteSession(sessionId, user.id)
      if (!success) return res.status(404).json({ error: 'Session not found' })
      return res.status(200).json({ status: 'deleted', session_id: sessionId })
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).end(`Method ${method} Not Allowed`)
  } catch (e: any) {
    console.error(`[research API] Error: ${e.message}`)
    return res.status(500).json({ error: e.message })
  }
}
