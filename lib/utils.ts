import type {
  UIMessage,
  UIMessagePart,
  AssistantModelMessage,
  ToolModelMessage
} from "ai";
import { formatISO } from 'date-fns';
import { ChatSDKError, type ErrorCode } from './errors';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChatMessage, Message } from "@langchain/core/messages";
import { ChatTools, CustomUIDataTypes } from "./types";

export function camelCaseToUpperCaseSnakeCase(camelCaseString: string) {
  // 1. Insert an underscore before each uppercase letter (except the first one)
  // 2. Convert the entire string to uppercase
  return camelCaseString
    .replace(/([A-Z])/g, '_$1') // Adds underscore before uppercase letters
    .toUpperCase()              // Converts to uppercase
    .replace(/^_/, '');         // Removes leading underscore if present (for cases like "FirstName")
}

export function sanitizeUIMessages(messages: Array<ChatMessage & any>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== "assistant") return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === "result") {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation: any) =>
        toolInvocation.state === "result" ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const launch = new Date(2025, 7, 14, 0, 0, 0);
export const calculateTimeRemaining = (launch: Date): { days: number; hours: number } => {
    const now = new Date();
    const diffMs = launch.getTime() - now.getTime();
  
    if (diffMs <= 0) {
      return { days: 0, hours: 0 };
    }
  
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
  
    return { days, hours };
};   
  
export const numJobsDisplaced = '85M';
export const dateJobsDisplaced = 2027;

export const copyright = `© ${new Date().getFullYear()} GoCareerPath. All rights reserved.`

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


type ResponseMessageWithoutId = ToolModelMessage | AssistantModelMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: any[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: ResponseMessage[];
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) { return null; }
 
  return trailingMessage.id;
}

/**
 * Truncate message history by removing up to the last AI message.
 * This is useful for handling token limit exceeded errors by removing recent context.
 *
 * @param messages Array of message objects to truncate
 * @returns Truncated message list up to (but not including) the last AI message
 */
export function removeUpToLastAIMessage<T extends { role: string }>(messages: T[]): T[] {
  // Search backwards through messages to find the last AI message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'ai' || messages[i].role === 'assistant') {
      // Return everything up to (but not including) the last AI message
      return messages.slice(0, i);
    }
  }
  // No AI messages found, return original list
  return messages;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export const roleMap: Record<string, 'user' | 'assistant' | 'system'> = {
  human: 'user',
  user: 'user',
  ai: 'assistant',
  assistant: 'assistant',
  system: 'system',
  tool: 'assistant', // Tool responses shown as assistant
};

export function convertToUIMessage(graphMessage: any): {
  role: 'user' | 'assistant' | 'system';
  parts: Array<{ type: 'text'; text: string }>;
  id?: string;
  metadata?: any;
} {
  return {
    role: roleMap[graphMessage.role] || 'assistant',
    parts: [
      {
        type: 'text',
        text: graphMessage.content || '',
      },
    ],
    id: graphMessage.id,
    metadata: graphMessage.metadata, // Retain metadata object
  };
}

export function convertToUIMessages(messages: any[]): Partial<ChatMessage>[] {
  return messages.map(convertToUIMessage)
}

export function getTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

// Convert messages (array of AIMessage-like objects) to OpenAI message format.
export function convertToOpenaiMessages(messages: any[]) {
  const openaiMessages = [];
  for (const message of messages) {
    const parts = [];
    const tool_calls = [];

    parts.push({
      type: 'text',
      text: message.content
    });

    if (message.experimental_attachments) {
      for (const attachment of message.experimental_attachments) {
        if (typeof attachment.contentType === "string" && attachment.contentType.startsWith('image')) {
          parts.push({
            type: 'image_url',
            image_url: {
              url: attachment.url
            }
          });
        } else if (typeof attachment.contentType === "string" && attachment.contentType.startsWith('text')) {
          parts.push({
            type: 'text',
            text: attachment.url
          });
        }
      }
    }

    if (message.toolInvocations) {
      for (const toolInvocation of message.toolInvocations) {
        tool_calls.push({
          id: toolInvocation.toolCallId,
          type: "function",
          function: {
            name: toolInvocation.toolName,
            arguments: JSON.stringify(toolInvocation.args)
          }
        });
      }
    }

    // OpenAI expects tool_calls=null if tool_calls are not present
    const tool_calls_dict = tool_calls.length > 0 ? { tool_calls } : { tool_calls: null };

    openaiMessages.push({
      role: message.role,
      content: parts,
      ...tool_calls_dict
    });

    if (message.toolInvocations) {
      for (const toolInvocation of message.toolInvocations) {
        const toolMessage = {
          role: "tool",
          tool_call_id: toolInvocation.toolCallId,
          content: JSON.stringify(toolInvocation.result)
        };
        openaiMessages.push(toolMessage);
      }
    }
  }
  return openaiMessages;
}