/**
 * Session lifecycle management for research sessions (Node/Next.js version)
 */

import { researchSessions } from "@/lib/db/schema";
import { db } from "@/lib/db/drizzle";
import dayjs from "dayjs";
import { configManager } from "./researchConfig";
import { ResearchSession } from '@/lib/types';
import { and, eq, desc, lt } from "drizzle-orm";
import { generateUUID } from "../utils";

export class SessionManager {
  /** Create a new research session */
  async createSession(
    userId: string,
    chatId?: string | null,
    configuration?: Record<string, any>
  ): Promise<ResearchSession> {
    if (!userId) throw Error("User is no id. Unauthorized.");

      const threadId = generateUUID();
      
      console.debug('createSession: inserting with userId=', userId, 'chatId=', chatId);
    const [researchSession] = await db
      .insert(researchSessions)
      .values({
        userId,
        chatId: chatId || null,
        threadId,
        status: "active",
        configuration: configuration || {},
      })
      .returning();

      console.debug('inserted session:', researchSession);

    return researchSession;
  }

  /** Get a research session by ID, ensuring user ownership */
  async getSession(sessionId: string, userId: string): Promise<ResearchSession | null> {
    const [session] = await db
      .select()
      .from(researchSessions)
      .where(and(eq(researchSessions.id, sessionId), eq(researchSessions.userId, userId)))
      .limit(1);
    return session ?? null;
  }

  /** Get all research sessions for a user */
  async getUserSessions(
    userId: string,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<ResearchSession[]> {
    let q = db
      .select()
      .from(researchSessions)
      .where(eq(researchSessions.userId, userId));

    if (status) {
      q.intersect(db
        .select()
        .from(researchSessions)
        .where(and(eq(researchSessions.userId, userId), eq(researchSessions.status, status))));
    }

    return await q
      .orderBy(desc(researchSessions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get existing session by chatId or create new one
   */
  async getOrCreateSession(
    userId: string,
    chatId?: string,
    configuration?: Record<string, any>
  ) {
    // If chatId provided, try to find existing session
    if (chatId) {
      const existingSessions = await this.getUserSessions(userId, undefined, 1, 0);
      const session = existingSessions.find(s => s.chatId === chatId);
      
      if (session) {
        console.log('Found existing session for chatId:', chatId);
        return session;
      }
    }
    
    // Create new session
    console.log('Creating new session for chatId:', chatId);
    return await this.createSession(userId, chatId, configuration);
  }

  /** Update session status and optionally research brief */
  async updateSessionStatus(
    sessionId: string,
    userId: string,
    status: string,
    researchBrief?: string
  ): Promise<ResearchSession | null> {
    // Update the session
    const res = await db
      .update(researchSessions)
      .set({
        status,
        researchBrief: researchBrief ?? undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(eq(researchSessions.id, sessionId), eq(researchSessions.userId, userId))
      )
      .returning();

    if (res.length === 0) return null;

    // Return updated (should be one)
    return res[0];
  }

  /** Mark a session as completed */
  async completeSession(
    sessionId: string,
    userId: string,
    researchBrief?: string
  ): Promise<ResearchSession | null> {
    return this.updateSessionStatus(sessionId, userId, "completed", researchBrief);
  }

  /** Archive sessions older than specified days */
  async archiveOldSessions(daysOld = 30): Promise<number> {
    const cutoffDate = dayjs().subtract(daysOld, "day").toISOString();
    const res = await db
      .update(researchSessions)
      .set({ status: "archived" })
      .where(
        and(eq(researchSessions.status, "completed"), lt(researchSessions.updatedAt, cutoffDate))
      );
    // "res" on update returns array of affected records or rowCount per dialect,
    // use .rowCount if available, else .length
    // If drizzle returns nothing, assume success if not throwing.
    // if (typeof res.rowCount === "number") return res.rowCount;
    return Array.isArray(res) ? res.length : 0;
  }

  /** Delete a research session */
  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    const res = await db
      .delete(researchSessions)
      .where(
        and(eq(researchSessions.id, sessionId), eq(researchSessions.userId, userId))
      );
    // Drizzle returns { rowCount } or [deleted], check both
    // if (typeof res.rowCount === "number") return res.rowCount > 0;
    if (Array.isArray(res)) return res.length > 0;
    return false;
  }

  /** Get session by threadId (for LangGraph integration) */
  async getSessionByThreadId(threadId: string): Promise<ResearchSession | null> {
    const [session] = await db
      .select()
      .from(researchSessions)
      .where(eq(researchSessions.threadId, threadId))
      .limit(1);
    return session ?? null;
  }

  /** Create RunnableConfig for a session */
  createRunnableConfig(
    session: ResearchSession,
    additionalConfig?: Record<string, any>
  ): Record<string, any> {
    return configManager.createRunnableConfig(
      session.threadId,
      session.userId,
      session.configuration!
    );
  }
}

// Global singleton instance
export const sessionManager = new SessionManager();
