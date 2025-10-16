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
import type { Chat, User, Message as DBMessage } from "@/lib/types";
import {
  chats,
//   document,
  messages,
//   type Suggestion,
  stream,
//   suggestion,
  users,
} from "../schema";
import { hashPassword } from "@/lib/auth/session";
import { db } from "../drizzle";

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chats).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(messages).where(eq(messages.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chats)
      .where(eq(chats.id, id))
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
        .from(chats)
        .where(
          whereCondition
            ? and(whereCondition, eq(chats.userId, id))
            : eq(chats.userId, id)
        )
        .orderBy(desc(chats.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chats.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chats.createdAt, selectedChat.createdAt));
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
    const [selectedChat] = await db.select().from(chats).where(eq(chats.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chats by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(messages).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, id))
      .orderBy(asc(messages.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

// export async function saveDocument({
//   id,
//   title,
//   kind,
//   content,
//   userId,
// }: {
//   id: string;
//   title: string;
//   kind: string;
//   content: string;
//   userId: string;
// }) {
//   try {
//     return await db
//       .insert(document)
//       .values({
//         id,
//         title,
//         kind,
//         content,
//         userId,
//         createdAt: new Date(),
//       })
//       .returning();
//   } catch (_error) {
//     throw new ChatSDKError("bad_request:database", "Failed to save document");
//   }
// }

// export async function getDocumentsById({ id }: { id: string }) {
//   try {
//     const documents = await db
//       .select()
//       .from(document)
//       .where(eq(document.id, id))
//       .orderBy(asc(document.createdAt));

//     return documents;
//   } catch (_error) {
//     throw new ChatSDKError(
//       "bad_request:database",
//       "Failed to get documents by id"
//     );
//   }
// }

// export async function getDocumentById({ id }: { id: string }) {
//   try {
//     const [selectedDocument] = await db
//       .select()
//       .from(document)
//       .where(eq(document.id, id))
//       .orderBy(desc(document.createdAt));

//     return selectedDocument;
//   } catch (_error) {
//     throw new ChatSDKError(
//       "bad_request:database",
//       "Failed to get document by id"
//     );
//   }
// }

// export async function deleteDocumentsByIdAfterTimestamp({
//   id,
//   timestamp,
// }: {
//   id: string;
//   timestamp: Date;
// }) {
//   try {
//     await db
//       .delete(suggestion)
//       .where(
//         and(
//           eq(suggestion.documentId, id),
//           gt(suggestion.documentCreatedAt, timestamp)
//         )
//       );

//     return await db
//       .delete(document)
//       .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
//       .returning();
//   } catch (_error) {
//     throw new ChatSDKError(
//       "bad_request:database",
//       "Failed to delete documents by id after timestamp"
//     );
//   }
// }

// export async function saveSuggestions({
//   suggestions,
// }: {
//   suggestions: Suggestion[];
// }) {
//   try {
//     return await db.insert(suggestion).values(suggestions);
//   } catch (_error) {
//     throw new ChatSDKError(
//       "bad_request:database",
//       "Failed to save suggestions"
//     );
//   }
// }

// export async function getSuggestionsByDocumentId({
//   documentId,
// }: {
//   documentId: string;
// }) {
//   try {
//     return await db
//       .select()
//       .from(suggestion)
//       .where(and(eq(suggestion.documentId, documentId)));
//   } catch (_error) {
//     throw new ChatSDKError(
//       "bad_request:database",
//       "Failed to get suggestions by document id"
//     );
//   }
// }

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(messages).where(eq(messages.id, id));
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
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(eq(messages.chatId, chatId), gte(messages.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      return await db
        .delete(messages)
        .where(
          and(eq(messages.chatId, chatId), inArray(messages.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
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
      .update(chats)
      .set({ lastContext: context })
      .where(eq(chats.id, chatId));
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
      .select({ count: count(messages.id) })
      .from(messages)
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .where(
        and(
          eq(chats.userId, id),
          gte(messages.createdAt, twentyFourHoursAgo),
          eq(messages.role, "user")
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
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
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
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}