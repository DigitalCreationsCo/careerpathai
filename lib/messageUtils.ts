/**
 * Message conversion utilities for LangChain/LangGraph
 */

import { 
    BaseMessage, 
    HumanMessage, 
    AIMessage, 
    SystemMessage,
    ToolMessage,
    FunctionMessage 
  } from "@langchain/core/messages";
  import { getBufferString as langchainGetBufferString } from "@langchain/core/messages";
  
  /**
   * Convert plain message object to LangChain message instance
   */
  export function convertToLangChainMessage(message: any): BaseMessage {
    // If already a LangChain message, return as-is
    if (message instanceof BaseMessage) {
      return message;
    }
    
    // Handle different role types
    const role = message.role?.toLowerCase() || message._type || 'human';
    const content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
    
    switch (role) {
      case 'human':
      case 'user':
        return new HumanMessage({ content, ...message });
      
      case 'ai':
      case 'assistant':
        return new AIMessage({ 
          content,
          tool_calls: message.tool_calls || message.toolCalls,
          ...message 
        });
      
      case 'system':
        return new SystemMessage({ content, ...message });
      
      case 'tool':
        return new ToolMessage({ 
          content,
          tool_call_id: message.tool_call_id || message.toolCallId || '',
          ...message 
        });
      
      case 'function':
        return new FunctionMessage({ 
          content,
          name: message.name || '',
          ...message 
        });
      
      default:
        // Default to HumanMessage for unknown types
        console.warn(`Unknown message role: ${role}, defaulting to HumanMessage`);
        return new HumanMessage({ content });
    }
  }
  
  /**
   * Convert array of plain messages to LangChain messages
   */
  export function convertMessagesToLangChain(messages: any[]): BaseMessage[] {
    if (!Array.isArray(messages)) {
      console.warn('convertMessagesToLangChain: messages is not an array', messages);
      return [];
    }
    
    return messages.map(convertToLangChainMessage);
  }
  
  /**
   * Safe version of getBufferString that handles plain objects
   */
  export function getBufferString(messages: any[]): string {
    try {
      // Convert to LangChain messages first
      const langchainMessages = convertMessagesToLangChain(messages);
      
      // Use LangChain's getBufferString
      return langchainGetBufferString(langchainMessages);
    } catch (error) {
      console.error('Error in getBufferString:', error);
      
      // Fallback: manually format messages
      return messages
        .map((m) => {
          const role = m.role || m._type || 'unknown';
          const content = typeof m.content === 'string' 
            ? m.content 
            : JSON.stringify(m.content);
          return `${role}: ${content}`;
        })
        .join('\n\n');
    }
  }
  
  /**
   * Extract text content from message (handles both string and object content)
   */
  export function extractMessageContent(message: any): string {
    if (typeof message.content === 'string') {
      return message.content;
    }
    
    if (Array.isArray(message.content)) {
      // Handle multi-part content (text + images, etc.)
      return message.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text || part.content || '')
        .join('\n');
    }
    
    if (typeof message.content === 'object' && message.content !== null) {
      // Handle object content
      return JSON.stringify(message.content);
    }
    
    return '';
  }
  
  /**
   * Format messages for prompt template (more readable than getBufferString)
   */
  export function formatMessagesForPrompt(messages: any[]): string {
    return messages
      .map((msg) => {
        const role = msg.role || msg._type || 'unknown';
        const content = extractMessageContent(msg);
        
        // Format based on role
        switch (role.toLowerCase()) {
          case 'human':
          case 'user':
            return `User: ${content}`;
          case 'ai':
          case 'assistant':
            return `Assistant: ${content}`;
          case 'system':
            return `System: ${content}`;
          case 'tool':
            return `Tool (${msg.name || 'unknown'}): ${content}`;
          default:
            return `${role}: ${content}`;
        }
      })
      .join('\n\n');
  }