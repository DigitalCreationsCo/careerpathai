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
import { tool } from "@langchain/core/tools";
import { ResearchComplete } from "./researcher/state";
import { Configuration, SearchApi } from "./researcher/configuration";
import { Message } from "./researcher/deepResearcher";
import { AIMessage, BaseMessage, ChatMessage, FunctionMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
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
      (toolInvocation) =>
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

export function convertToUIMessages(messages: any[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

export function messageFromDict(message) {
  const type = message.type;
  const data = message.data || {};
  switch(type) {
    case "human": return new HumanMessage(data);
    case "ai": return new AIMessage(data);
    case "system": return new SystemMessage(data);
    case "chat": return new ChatMessage(data);
    case "function": return new FunctionMessage(data);
    case "tool": return new ToolMessage(data);
    default: throw new Error(`Got unexpected message type: ${type}`);
  }
}

export function messagesFromDict(messages) {
  return messages.map(m => messageFromDict(m));
}

// MessageLikeRepresentation: One of: BaseMessage | [role, content] | string | object
export function createMessageFromMessageType(messageType, content, opts={}) {
  const {name, tool_call_id, tool_calls, id, ...additional_kwargs} = opts;
  const kwargs = {};
  if (name) kwargs.name = name;
  if (tool_call_id) kwargs.tool_call_id = tool_call_id;
  if (id) kwargs.id = id;
  if (tool_calls) kwargs.tool_calls = tool_calls;
  if (Object.keys(additional_kwargs).length > 0) kwargs.additional_kwargs = additional_kwargs;

  if (messageType === "human" || messageType === "user")
    return new HumanMessage({content, ...kwargs});
  if (messageType === "ai" || messageType === "assistant")
    return new AIMessage({content, ...kwargs});
  if (messageType === "system" || messageType === "developer")
    return new SystemMessage({content, ...kwargs});
  if (messageType === "function")
    return new FunctionMessage({content, ...kwargs});
  if (messageType === "tool")
    return new ToolMessage({content, ...kwargs});
  throw new Error(
    `Unexpected message type: '${messageType}'. Use one of 'human', 'user', 'ai', 'assistant', 'function', 'tool', 'system', or 'developer'.`
  );
}

export function convertToMessage(message) {
  if (message instanceof BaseMessage) return message;
  if (typeof message === "string") return createMessageFromMessageType("human", message);
  if (Array.isArray(message) && message.length === 2) {
    const [type, template] = message;
    return createMessageFromMessageType(type, template);
  }
  if (typeof message === "object" && message !== null) {
    const objectCopy = {...message};
    let msgType, msgContent;
    if ('role' in objectCopy) {
      msgType = objectCopy.role;
      msgContent = objectCopy.content ?? "";
      delete objectCopy.role;
      delete objectCopy.content;
      return createMessageFromMessageType(msgType, msgContent, objectCopy);
    } else if ('type' in objectCopy) {
      msgType = objectCopy.type;
      msgContent = objectCopy.content ?? "";
      delete objectCopy.type;
      delete objectCopy.content;
      return createMessageFromMessageType(msgType, msgContent, objectCopy);
    }
    throw new Error(`Message dict must contain 'role' or 'type' and 'content' keys, got ${JSON.stringify(message)}`);
  }
  throw new Error(`Unsupported message type: ${typeof message}`);
}

export function convertToMessages(messages) {
  if (typeof messages?.to_messages === "function") return messages.to_messages();
  return Array.from(messages).map(m => convertToMessage(m));
}

function filterMessages(
  messages,
  {
    include_names, // array or undefined
    exclude_names, // array or undefined
    include_types, // array or undefined
    exclude_types, // array or undefined
    include_ids,
    exclude_ids,
  } = {}
) {
  messages = convertToMessages(messages);
  const filtered = [];
  for (const msg of messages) {
    // Exclusion
    if (
      (exclude_names && exclude_names.includes(msg.name)) ||
      (exclude_types && isMessageType(msg, exclude_types)) ||
      (exclude_ids && exclude_ids.includes(msg.id))
    ) continue;

    // Inclusion (if no include_* given, default include)
    if (
      !(include_types || include_ids || include_names) ||
      (include_names && include_names.includes(msg.name)) ||
      (include_types && isMessageType(msg, include_types)) ||
      (include_ids && include_ids.includes(msg.id))
    ) filtered.push(msg);
  }
  return filtered;
}

// Convenience: role string mapping for OpenAI API
export function getMessageOpenAIRole(message) {
  if (message instanceof AIMessage) return "assistant";
  if (message instanceof HumanMessage) return "user";
  if (message instanceof ToolMessage) return "tool";
  if (message instanceof SystemMessage) return message.additional_kwargs?.__openai_role__ || "system";
  if (message instanceof FunctionMessage) return "function";
  if (message instanceof ChatMessage) return message.role;
  throw new Error(`Unknown BaseMessage type ${message.constructor.name}.`);
}

export function countTokensApproximately(
  messages,
  {
    chars_per_token = 4,
    extra_tokens_per_message = 3,
    count_name = true
  } = {}
) {
  let token_count = 0;
  for (const message of convertToMessages(messages)) {
    let message_chars = 0;
    if (typeof message.content === "string")
      message_chars += message.content.length;
    else if (message.content)
      message_chars += JSON.stringify(message.content).length;

    if (
      message instanceof AIMessage &&
      !Array.isArray(message.content) &&
      message.tool_calls
    ) {
      message_chars += JSON.stringify(message.tool_calls).length;
    }

    if (message instanceof ToolMessage && typeof message.tool_call_id === "string")
      message_chars += message.tool_call_id.length;

    message_chars += getMessageOpenAIRole(message).length;
    if (message.name && count_name) message_chars += message.name.length;

    // ceil per message
    token_count += Math.ceil(message_chars / chars_per_token);
    token_count += extra_tokens_per_message;
  }
  return Math.ceil(token_count);
}

// Utility: message type filter
export function isMessageType(message, typeOrArr) {
  const arr = Array.isArray(typeOrArr) ? typeOrArr : [typeOrArr];
  for (const t of arr) {
    if (typeof t === "string" && (message.type === t || message.role === t)) return true;
    if (typeof t === "function" && message instanceof t) return true;
  }
  return false;
}

// Returns current date formatted for display in prompts and outputs, e.g., "Mon Jan 15, 2024"
export function getTodayStr() {
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

// Extract value from configuration, handling objects and null values.
export function getConfigValue<T = any>(value: any): T | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    return value as any;
  }
  if (typeof value === "object") {
    if ("value" in value) {
      return value.value;
    }
    return value;
  }
  return value;
}

// Get API key for a specific model from environment or config.
export function getApiKeyForModel(modelName, config) {
  const shouldGetFromConfig = (process.env.GET_API_KEYS_FROM_CONFIG || "false").toLowerCase();
  modelName = (modelName || "").toLowerCase();
  if (shouldGetFromConfig === "true") {
    const apiKeys = (config?.configurable?.apiKeys) || {};
    if (!apiKeys) return null;
    if (modelName.startsWith("openai:")) {
      return apiKeys.OPENAI_API_KEY || null;
    } else if (modelName.startsWith("anthropic:")) {
      return apiKeys.ANTHROPIC_API_KEY || null;
    } else if (modelName.startsWith("google")) {
      return apiKeys.GOOGLE_API_KEY || null;
    }
    return null;
  } else {
    if (modelName.startsWith("openai:")) {
      return process.env.OPENAI_API_KEY || null;
    } else if (modelName.startsWith("anthropic:")) {
      return process.env.ANTHROPIC_API_KEY || null;
    } else if (modelName.startsWith("google")) {
      return process.env.GOOGLE_API_KEY || null;
    }
    return null;
  }
}

// Get Tavily API key from environment or config.
export function getTavilyApiKey(config) {
  const shouldGetFromConfig = (process.env.GET_API_KEYS_FROM_CONFIG || "false").toLowerCase();
  if (shouldGetFromConfig === "true") {
    const apiKeys = (config?.configurable?.apiKeys) || {};
    if (!apiKeys) return null;
    return apiKeys.TAVILY_API_KEY || null;
  } else {
    return process.env.TAVILY_API_KEY || null;
  }
}

// Convert messages (array of AIMessage-like objects) to OpenAI message format.
export function convertToOpenaiMessages(messages) {
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

    export async function tavilySearch({
      queries,
      maxResults = 5,
      topic = "general",
      config,
      summarizeWebpage,
      Configuration,
      getApiKeyForModel,
      initChatModel,
      Summary,
      summarizeWebpagePrompt
    }: {
      queries: string[],
      maxResults?: number,
      topic?: "general" | "news" | "finance",
      config: any,
      summarizeWebpage: Function,
      Configuration: any,
      getApiKeyForModel: Function,
      initChatModel: Function,
      Summary: any,
      summarizeWebpagePrompt: any
    }): Promise<string> {
      // Execute search queries asynchronously, using tavilySearchAsync (see below)
      const results = await tavilySearchAsync({
        searchQueries: queries,
        maxResults,
        topic,
        includeRawContent: true,
        config
      });
      // Deduplicate by URL
      const uniqueResults: Record<string, any> = {};
      for (const response of results) {
        for (const result of response.results) {
          const url = result.url;
          if (!(url in uniqueResults)) {
            uniqueResults[url] = { ...result, query: response.query };
          }
        }
      }
    
      // Get summarization settings & model
      const configurable = Configuration.fromRunnableConfig(config);
      const maxCharToInclude = configurable.max_content_length;
      const modelApiKey = getApiKeyForModel(configurable.summarization_model, config);
      const summarizationModel = initChatModel({
        model: configurable.summarization_model,
        maxTokens: configurable.summarization_model_max_tokens,
        apiKey: modelApiKey,
        tags: ["langsmith:nostream"]
      }).withStructuredOutput(Summary).withRetry({
        stopAfterAttempt: configurable.max_structured_output_retries
      });
    
      // Create summarization tasks. If result has no raw_content, use original content.
      const summaries: Array<string | null> = await Promise.all(
        Object.values(uniqueResults).map(async (result: any) =>
          result.raw_content
            ? await summarizeWebpage(
                summarizationModel,
                result.raw_content.slice(0, maxCharToInclude),
                summarizeWebpagePrompt
              )
            : null
        )
      );
    
      // Attach summaries to results
      const summarizedResults: Record<string, any> = {};
      let i = 0;
      for (const [url, result] of Object.entries(uniqueResults)) {
        summarizedResults[url] = {
          title: result.title,
          content: summaries[i] === null ? result.content : summaries[i]
        };
        i += 1;
      }
    
      // Format final output
      if (Object.keys(summarizedResults).length === 0) {
        return "No valid search results found. Please try different search queries or use a different search API.";
      }
      let formatted_output = "Search results: \n\n";
      let idx = 1;
      for (const [url, result] of Object.entries(summarizedResults)) {
        formatted_output += `\n\n--- SOURCE ${idx}: ${result.title} ---\n`;
        formatted_output += `URL: ${url}\n\n`;
        formatted_output += `SUMMARY:\n${result.content}\n\n`;
        formatted_output += "\n\n" + "-".repeat(80) + "\n";
        idx++;
      }
    
      return formatted_output;
    }
    
    export async function tavilySearchAsync({
      searchQueries,
      maxResults = 5,
      topic = "general",
      includeRawContent = true,
      config,
      AsyncTavilyClient,
      getTavilyApiKey
    }: {
      searchQueries: string[],
      maxResults?: number,
      topic?: string,
      includeRawContent?: boolean,
      config: any,
      AsyncTavilyClient: any,
      getTavilyApiKey: Function
    }) {
      const apiKey = getTavilyApiKey(config);
      const tavilyClient = new AsyncTavilyClient(apiKey);
    
      // Run search for each query in parallel
      const tasks = searchQueries.map(query =>
        tavilyClient.search(query, {
          maxResults,
          includeRawContent,
          topic
        })
      );
      // Wait for all results
      const searchResults = await Promise.all(tasks);
      return searchResults;
    }
    
    export async function summarizeWebpage(
      model: any,
      webpageContent: string,
      summarizeWebpagePrompt: any
    ): Promise<string> {
      try {
        // Compose prompt
        const promptContent = summarizeWebpagePrompt.format({
          webpage_content: webpageContent,
          date: getTodayStr()
        });
        // Await model (with timeout)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout during summarization")), 60000)
        );
        const summary: any = await Promise.race([
          model.ainvoke([new HumanMessage({ content: promptContent })]),
          timeoutPromise
        ]);
        // Format summary output
        return `<summary>\n${summary.summary}\n</summary>\n\n<key_excerpts>\n${summary.key_excerpts}\n</key_excerpts>`;
      } catch (e) {
        // Timeout or other error: return the original content
        console.warn(
          "Summarization timed out or failed, returning original content",
          (e as Error).toString()
        );
        return webpageContent;
      }
    }
    
    export async function getCurrentWeather(latitude: number, longitude: number): Promise<any> {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`;
    
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Weather API request failed: ${response.status}`);
        }
        return await response.json();
      } catch (e) {
        console.error("Error fetching weather data:", e);
        return null;
      }
    }
    
    export function thinkTool(reflection: string): string {
      // Simulates strategic reflection tool
      return `Reflection recorded: ${reflection}`;
    }
    
    // --- MCP utility functions: We'll need to use async/await and fetch (and implement storage as needed) ---
    
    export async function getMcpAccessToken(
      supabaseToken: string,
      baseMcpUrl: string
    ): Promise<Record<string, any> | null> {
      const formData = new URLSearchParams({
        "client_id": "mcp_default",
        "subject_token": supabaseToken,
        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
        "resource": `${baseMcpUrl.replace(/\/$/, "")}/mcp`,
        "subject_token_type": "urn:ietf:params:oauth:token-type:access_token"
      }).toString();
      try {
        const response = await fetch(`${baseMcpUrl.replace(/\/$/, "")}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData
        });
        if (response.ok) {
          return await response.json();
        } else {
          const txt = await response.text();
          console.error("Token exchange failed:", txt);
          return null;
        }
      } catch (err) {
        console.error("Error during token exchange:", err);
        return null;
      }
    }
    
    // Storage layer for tokens: replace with your own as needed
    const _TOKENS_STORE: Record<string, { value: any, createdAt: Date }> = {};
    
    export async function getTokens(config: any): Promise<any> {
      const threadId = config?.configurable?.thread_id;
      const userId = config?.metadata?.owner;
      if (!threadId || !userId) return null;
      const key = `${userId}:tokens`;
      const tokens = _TOKENS_STORE[key];
      if (!tokens) return null;
    
      const expiresIn = tokens.value?.expires_in;
      const createdAt = tokens.createdAt;
      const expirationTime = new Date(createdAt.getTime() + expiresIn * 1000);
      if (new Date() > expirationTime) {
        delete _TOKENS_STORE[key];
        return null;
      }
      return tokens.value;
    }
    
    export async function setTokens(config: any, tokens: any) {
      const threadId = config?.configurable?.thread_id;
      const userId = config?.metadata?.owner;
      if (!threadId || !userId) return;
      const key = `${userId}:tokens`;
      _TOKENS_STORE[key] = { value: tokens, createdAt: new Date() };
    }
    
    export async function fetchTokens(config: any): Promise<any> {
      // Try getTokens first
      const currentTokens = await getTokens(config);
      if (currentTokens) return currentTokens;
      // Get supabase token and mcp config
      const supabaseToken = config?.configurable?.["x-supabase-access-token"];
      const mcpConfig = config?.configurable?.["mcp_config"];
      if (!supabaseToken || !mcpConfig?.url) return null;
      const mcpTokens = await getMcpAccessToken(supabaseToken, mcpConfig.url);
      if (!mcpTokens) return null;
      await setTokens(config, mcpTokens);
      return mcpTokens;
    }
    
    // Simplified "wrap" pattern for tool error handling
    export function wrapMcpAuthenticateTool(tool: any): any {
      const originalCoroutine = tool.coroutine;
      tool.coroutine = async function (...args: any[]) {
        try {
          return await originalCoroutine.apply(tool, args);
        } catch (originalError) {
          // Recursively walk the error chain for .code, .error, .data, .url as in Python
          let e: any = originalError;
          while (e) {
            if (e?.error?.code === -32003) {
              let msg = "Required interaction";
              const payload = e?.error?.data?.message;
              if (typeof payload === "object" && payload.text) msg = payload.text;
              if (e?.error?.data?.url) msg = `${msg} ${e.error.data.url}`;
              throw new Error(msg);
            }
            e = e.cause;
          }
          throw originalError;
        }
      };
      return tool;
    }
    
    // Load MCP tools: depends on your client
    export async function loadMcpTools({
      config,
      existingToolNames,
      Configuration,
      fetchTokens,
      MultiServerMCPClient,
      wrapMcpAuthenticateTool
    }: {
      config: any,
      existingToolNames: Set<string>,
      Configuration: any,
      fetchTokens: Function,
      MultiServerMCPClient: any,
      wrapMcpAuthenticateTool: Function
    }): Promise<any[]> {
      const configurable = Configuration.fromRunnableConfig(config);
    
      let mcpTokens = null;
      if (configurable.mcp_config && configurable.mcp_config.auth_required)
        mcpTokens = await fetchTokens(config);
    
      // Validate requirements
      if (!(configurable.mcp_config &&
            configurable.mcp_config.url &&
            configurable.mcp_config.tools &&
            (mcpTokens || !configurable.mcp_config.auth_required))
      ) return [];
    
      const serverUrl = configurable.mcp_config.url.replace(/\/$/, "") + "/mcp";
      let authHeaders = null;
      if (mcpTokens)
        authHeaders = { Authorization: `Bearer ${mcpTokens['access_token']}` };
      const mcpServerConfig = {
        server_1: {
          url: serverUrl,
          headers: authHeaders,
          transport: "streamable_http"
        }
      };
    
      let availableMcpTools: any[] = [];
      try {
        const client = new MultiServerMCPClient(mcpServerConfig);
        availableMcpTools = await client.getTools();
      } catch (e) {
        return [];
      }
      // Filter and configure
      const configuredTools = [];
      for (const mcpTool of availableMcpTools) {
        if (existingToolNames.has(mcpTool.name)) {
          // warnings.warn(...)
          continue;
        }
        if (!configurable.mcp_config.tools.includes(mcpTool.name)) continue;
        const enhancedTool = wrapMcpAuthenticateTool(mcpTool);
        configuredTools.push(enhancedTool);
      }
      return configuredTools;
    }
    
    // Tool utilities for search tool composition
    export async function getSearchTool({
      searchApi,
      tavilySearch,
      SearchApi
    }: {
      searchApi: any,
      tavilySearch: any,
      SearchApi: any
    }): Promise<any[]> {
      if (searchApi === SearchApi.ANTHROPIC) {
        return [{
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5
        }];
      } else if (searchApi === SearchApi.OPENAI) {
        return [{ type: "web_search_preview" }];
      } else if (searchApi === SearchApi.TAVILY) {
        tavilySearch.metadata = { ...(tavilySearch.metadata || {}), type: "search", name: "web_search" };
        return [tavilySearch];
      } else if (searchApi === SearchApi.NONE) {
        return [];
      }
      return [];
    }
    
    export async function getAllTools(
      config: any): Promise<any[]> {
      const tools = [tool({} as any, { name: 'ResearchComplete', schema: ResearchComplete }), thinkTool];
      const configurable = Configuration.fromRunnableConfig(config);
      const searchApi: SearchApi = SearchApi[getConfigValue<SearchApi>(configurable.searchApi)! as unknown as keyof typeof SearchApi];
      const searchTools = await getSearchTool({ searchApi, tavilySearch, SearchApi });
      tools.push(...searchTools);
    
      const existingToolNames = new Set(
        tools.map(
          tool => (typeof tool.name !== "undefined" ? tool.name : (tool.get && tool.get("name", "web_search")))
        )
      );
    
      const mcpTools = await loadMcpTools({
        config,
        existingToolNames,
        Configuration,
        fetchTokens,
        MultiServerMCPClient: null, // Provide concrete client instance in actual code.
        wrapMcpAuthenticateTool
      });
      tools.push(...mcpTools);
    
      return tools;
    }
    
    export function getNotesFromToolCalls(messages: any[]): any[] {
      return filterMessages(messages, { include_types: "tool" }).map(toolMsg => toolMsg.content);
    }
    
    // Model Provider Native Websearch Utilities
    export function anthropicWebsearchCalled(response: any): boolean {
      try {
        const usage = response?.response_metadata?.usage;
        if (!usage) return false;
        const serverToolUse = usage.server_tool_use;
        if (!serverToolUse) return false;
        const webSearchRequests = serverToolUse.web_search_requests;
        if (webSearchRequests == null) return false;
        return webSearchRequests > 0;
      } catch (e) {
        return false;
      }
    }
    
    export function openaiWebsearchCalled(response: any): boolean {
      const toolOutputs = response?.additional_kwargs?.tool_outputs;
      if (!toolOutputs) return false;
      return toolOutputs.some((out: any) => out.type === "web_search_call");
    }
    
    // Token Limit Exceeded Utilities
    export function isTokenLimitExceeded(exception: any, modelName?: string): boolean {
      const errorStr = String(exception).toLowerCase();
      let provider: string | null = null;
      if (modelName) {
        const modelStr = String(modelName).toLowerCase();
        if (modelStr.startsWith('openai:')) provider = 'openai';
        else if (modelStr.startsWith('anthropic:')) provider = 'anthropic';
        else if (modelStr.startsWith('gemini:') || modelStr.startsWith('google:')) provider = 'gemini';
      }
      if (provider === 'openai') return _checkOpenaiTokenLimit(exception, errorStr);
      if (provider === 'anthropic') return _checkAnthropicTokenLimit(exception, errorStr);
      if (provider === 'gemini') return _checkGeminiTokenLimit(exception, errorStr);
    
      // Unknown: try all
      return (
        _checkOpenaiTokenLimit(exception, errorStr) ||
        _checkAnthropicTokenLimit(exception, errorStr) ||
        _checkGeminiTokenLimit(exception, errorStr)
      );
    }
    function _checkOpenaiTokenLimit(exception: any, errorStr: string): boolean {
      const exceptionType = String(exception?.constructor?.name || "");
      const moduleName = exception?.constructor?.module || "";
      const isOpenaiException = (exceptionType.toLowerCase().includes('openai') || moduleName.toLowerCase().includes('openai'));
      const isRequestError = ["BadRequestError", "InvalidRequestError"].includes(exceptionType);
    
      if (isOpenaiException && isRequestError) {
        const tokenKeywords = ['token', 'context', 'length', 'maximum context', 'reduce'];
        if (tokenKeywords.some(keyword => errorStr.includes(keyword))) return true;
      }
      if ((exception?.code === 'context_length_exceeded') || (exception?.type === 'invalid_request_error')) return true;
      return false;
    }
    function _checkAnthropicTokenLimit(exception: any, errorStr: string): boolean {
      const exceptionType = String(exception?.constructor?.name || "");
      const moduleName = exception?.constructor?.module || "";
      const isAnthropicException = (exceptionType.toLowerCase().includes('anthropic') || moduleName.toLowerCase().includes('anthropic'));
      const isBadRequest = exceptionType === 'BadRequestError';
      if (isAnthropicException && isBadRequest) {
        if (errorStr.includes('prompt is too long')) return true;
      }
      return false;
    }
    function _checkGeminiTokenLimit(exception: any, errorStr: string): boolean {
      const exceptionType = String(exception?.constructor?.name || "");
      const moduleName = exception?.constructor?.module || "";
      const isGoogleException = (exceptionType.toLowerCase().includes('google') || moduleName.toLowerCase().includes('google'));
      const isResourceExhausted = ['ResourceExhausted', 'GoogleGenerativeAIFetchError'].includes(exceptionType);
      if (isGoogleException && isResourceExhausted) return true;
      if ((exceptionType || '').toLowerCase().includes('google.api_core.exceptions.resourceexhausted')) return true;
      return false;
    }
    
    export const MODEL_TOKEN_LIMITS: Record<string, number> = {
      "openai:gpt-4.1-mini": 1047576,
      "openai:gpt-4.1-nano": 1047576,
      "openai:gpt-4.1": 1047576,
      "openai:gpt-4o-mini": 128000,
      "openai:gpt-4o": 128000,
      "openai:o4-mini": 200000,
      "openai:o3-mini": 200000,
      "openai:o3": 200000,
      "openai:o3-pro": 200000,
      "openai:o1": 200000,
      "openai:o1-pro": 200000,
      "anthropic:claude-opus-4": 200000,
      "anthropic:claude-sonnet-4": 200000,
      "anthropic:claude-3-7-sonnet": 200000,
      "anthropic:claude-3-5-sonnet": 200000,
      "anthropic:claude-3-5-haiku": 200000,
      "google:gemini-1.5-pro": 2097152,
      "google:gemini-1.5-flash": 1048576,
      "google:gemini-pro": 32768,
      "cohere:command-r-plus": 128000,
      "cohere:command-r": 128000,
      "cohere:command-light": 4096,
      "cohere:command": 4096,
      "mistral:mistral-large": 32768,
      "mistral:mistral-medium": 32768,
      "mistral:mistral-small": 32768,
      "mistral:mistral-7b-instruct": 32768,
      "ollama:codellama": 16384,
      "ollama:llama2:70b": 4096,
      "ollama:llama2:13b": 4096,
      "ollama:llama2": 4096,
      "ollama:mistral": 32768,
      "bedrock:us.amazon.nova-premier-v1:0": 1000000,
      "bedrock:us.amazon.nova-pro-v1:0": 300000,
      "bedrock:us.amazon.nova-lite-v1:0": 300000,
      "bedrock:us.amazon.nova-micro-v1:0": 128000,
      "bedrock:us.anthropic.claude-3-7-sonnet-20250219-v1:0": 200000,
      "bedrock:us.anthropic.claude-sonnet-4-20250514-v1:0": 200000,
      "bedrock:us.anthropic.claude-opus-4-20250514-v1:0": 200000,
      "anthropic.claude-opus-4-1-20250805-v1:0": 200000,
    };
    
    export function getModelTokenLimit(modelString: string): number | null {
      for (const [modelKey, tokenLimit] of Object.entries(MODEL_TOKEN_LIMITS)) {
        if (modelString.includes(modelKey)) return tokenLimit;
      }
      return null;
    }
    
export async function defaultTavilySearchAsync({
  queries,
  maxResults = 5,
  topic = "general",
  config,
  AsyncTavilyClient,
  getTavilyApiKey,
}: any) {
  // User must provide AsyncTavilyClient (e.g. from deps)
  if (!AsyncTavilyClient || !getTavilyApiKey) throw new Error("Provide AsyncTavilyClient and getTavilyApiKey");
  const apiKey = getTavilyApiKey(config);
  const tavilyClient = new AsyncTavilyClient(apiKey);
  const tasks = queries.map(query =>
    tavilyClient.search(query, {
      maxResults,
      includeRawContent: true,
      topic,
    })
  );
  return await Promise.all(tasks);
}
