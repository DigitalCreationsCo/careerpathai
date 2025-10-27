import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "@/lib/errors";
import type { AppUsage } from "@/lib/usage";
import { generateUUID } from "@/lib/utils";
import type { Chat, User, Message as DBMessage, NewMessage } from "@/lib/types";
import {
  chats as chatsTable,
  messages as messagesTable,
  stream as streamTable,
  users as usersTable,
} from "../schema";
import { hashPassword } from "@/lib/auth/session";
import { db } from "../drizzle";

/**
 * Get or create a chat record for the research session
 */
export async function getOrCreateChat(
  userId: string,
  chatId?: string,
  title?: string
): Promise<string> {
  // If chatId provided, verify it exists
  if (chatId) {
    const [existingChat] = await db
      .select()
      .from(chatsTable)
      .where(and(eq(chatsTable.id, chatId), eq(chatsTable.userId, userId)))
      .limit(1);

    if (existingChat) {
      console.log('Found existing chat:', chatId);
      return existingChat.id;
    }

    console.warn(`Chat ${chatId} not found for user ${userId}`);
    // Fall through to create new chat
  }

  // Create new chat record
  const newChat = await saveChat({
    id: chatId,
    userId,
    title: title || 'Research Session',
  });

  console.log('Created new chat:', newChat.id);
  return newChat.id;
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id?: string;
  userId: string;
  title: string;
}) {
  try {
    if (!id) id = generateUUID();

    const [newChat] = await db.insert(chatsTable).values({
      id,
      userId,
      title: title || 'Research Session',
      createdAt: new Date().toISOString(),
      visibility: 'private',
    }).returning();

    return newChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(messagesTable).where(eq(messagesTable.chatId, id));
    await db.delete(streamTable).where(eq(streamTable.chatId, id));

    const [chatsDeleted] = await db
      .delete(chatsTable)
      .where(eq(chatsTable.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chatsTable)
        .where(
          whereCondition
            ? and(whereCondition, eq(chatsTable.userId, id))
            : eq(chatsTable.userId, id)
        )
        .orderBy(desc(chatsTable.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chatsTable)
        .where(eq(chatsTable.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chatsTable.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chatsTable)
        .where(eq(chatsTable.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chatsTable.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chatsTable).where(eq(chatsTable.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chats by id");
  }
}

export async function saveMessages({ messages }: { messages: NewMessage[] }) {
  try {
    return await db.insert(messagesTable).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.chatId, id))
      .orderBy(asc(messagesTable.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

// Keeping commented out document/suggestion code as-is, schema reference corrections would be needed if enabled

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(messagesTable).where(eq(messagesTable.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: string;
}) {
  try {
    const messagesToDelete = await db
      .select()
      .from(messagesTable)
      .where(
        and(eq(messagesTable.chatId, chatId), gte(messagesTable.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      return await db
        .delete(messagesTable)
        .where(
          and(
            eq(messagesTable.chatId, chatId),
            inArray(messagesTable.id, messageIds)
          )
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

/**
 * Update chat title (useful after research brief is generated)
 */
export async function updateChatTitle(
  chatId: string,
  userId: string,
  title: string
): Promise<void> {
  await db
    .update(chatsTable)
    .set({ title })
    .where(and(eq(chatsTable.id, chatId), eq(chatsTable.userId, userId)));

  console.log('Updated chat title:', chatId, title);
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await db
      .update(chatsTable)
      .set({ lastContext: context })
      .where(eq(chatsTable.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(messagesTable.id) })
      .from(messagesTable)
      .innerJoin(chatsTable, eq(messagesTable.chatId, chatsTable.id))
      .where(
        and(
          eq(chatsTable.userId, id),
          gte(messagesTable.createdAt, twentyFourHoursAgo.toISOString()),
          eq(messagesTable.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(streamTable)
      .values({ id: streamId, chatId, createdAt: new Date().toISOString() });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: streamTable.id })
      .from(streamTable)
      .where(eq(streamTable.chatId, chatId))
      .orderBy(asc(streamTable.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}