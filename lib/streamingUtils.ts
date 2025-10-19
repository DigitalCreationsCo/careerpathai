/**
 * Utilities for converting LangGraph streams to AI SDK compatible format
 */

/**
 * AI SDK Stream Protocol Format:
 * 
 * The AI SDK uses a specific streaming format where each line is prefixed with a type code:
 * - "0:" prefix for text chunks
 * - "2:" prefix for data annotations
 * - "e:" prefix for errors
 * - "d:" prefix for finish/done
 * 
 * Example: 0:{"type":"text","text":"Hello world"}\n
 */

export interface StreamChunk {
    type: 'text' | 'data' | 'tool_call' | 'finish' | 'error';
    content?: string;
    data?: any;
    toolCall?: {
      id: string;
      name: string;
      args: any;
    };
    finishReason?: 'stop' | 'length' | 'tool-calls' | 'error';
    error?: string;
  }
  
  /**
   * Convert LangGraph stream chunk to AI SDK format
   */
  export function formatForAISDK(chunk: StreamChunk): string {
    switch (chunk.type) {
      case 'text':
        return `0:${JSON.stringify({ type: 'text', text: chunk.content || '' })}\n`;
      
      case 'data':
        return `2:[${JSON.stringify(chunk.data)}]\n`;
      
      case 'tool_call':
        return `9:${JSON.stringify(chunk.toolCall)}\n`;
      
      case 'finish':
        return `d:{"finishReason":"${chunk.finishReason || 'stop'}"}\n`;
      
      case 'error':
        return `3:${JSON.stringify({ error: chunk.error })}\n`;
      
      default:
        return '';
    }
  }
  
  /**
   * Extract messages from LangGraph state
   */
  export function extractMessagesFromState(state: any): Array<{
    role: string;
    content: string;
    isNew?: boolean;
  }> {
    const messages: Array<{ role: string; content: string; isNew?: boolean }> = [];
    
    if (!state) return messages;
    
    // Handle messages array in state
    if (state.messages && Array.isArray(state.messages)) {
      for (const msg of state.messages) {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'human' ? 'user' : msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content,
            isNew: msg.isNew || false,
          });
        }
      }
    }
    
    return messages;
  }
  
  /**
   * Extract tool calls from LangGraph state
   */
  export function extractToolCalls(state: any): Array<{
    id: string;
    name: string;
    args: any;
  }> {
    const toolCalls: Array<{ id: string; name: string; args: any }> = [];
    
    if (!state) return toolCalls;
    
    // Check for tool calls in messages
    if (state.messages && Array.isArray(state.messages)) {
      for (const msg of state.messages) {
        if (msg.role === 'tool' || msg.toolCalls) {
          const calls = msg.toolCalls || [];
          toolCalls.push(...calls);
        }
      }
    }
    
    // Check for direct tool calls in state
    if (state.toolCalls && Array.isArray(state.toolCalls)) {
      toolCalls.push(...state.toolCalls);
    }
    
    return toolCalls;
  }
  
  /**
   * Detect if state represents a new AI message
   */
  export function detectNewAIMessage(
    currentState: any,
    previousState: any
  ): { hasNew: boolean; message?: string } {
    const currentMessages = extractMessagesFromState(currentState);
    const previousMessages = extractMessagesFromState(previousState);
    
    if (currentMessages.length === 0) {
      return { hasNew: false };
    }
    
    // Check if there's a new message at the end
    if (currentMessages.length > previousMessages.length) {
      const newMessage = currentMessages[currentMessages.length - 1];
      if (newMessage.role === 'assistant' || newMessage.role === 'ai') {
        return {
          hasNew: true,
          message: newMessage.content,
        };
      }
    }
    
    // Check if the last message has changed
    if (currentMessages.length === previousMessages.length && currentMessages.length > 0) {
      const currentLast = currentMessages[currentMessages.length - 1];
      const previousLast = previousMessages[previousMessages.length - 1];
      
      if (
        currentLast.content !== previousLast.content &&
        (currentLast.role === 'assistant' || currentLast.role === 'ai')
      ) {
        return {
          hasNew: true,
          message: currentLast.content,
        };
      }
    }
    
    return { hasNew: false };
  }
  
  /**
   * Stream LangGraph execution to AI SDK format
   */
  export async function* streamGraphToAISDK(
    graphStream: AsyncIterable<any>
  ): AsyncGenerator<string, void, unknown> {
    let previousState: any = null;
    const encoder = new TextEncoder();
    
    try {
      for await (const chunk of graphStream) {
        console.log('Processing graph chunk:', chunk);
        
        // Detect new AI messages
        const { hasNew, message } = detectNewAIMessage(chunk, previousState);
        
        if (hasNew && message) {
          // Stream text content
          yield formatForAISDK({
            type: 'text',
            content: message,
          });
        }
        
        // Extract and stream tool calls
        const toolCalls = extractToolCalls(chunk);
        for (const toolCall of toolCalls) {
          yield formatForAISDK({
            type: 'tool_call',
            toolCall,
          });
        }
        
        // Stream metadata as data annotations
        if (chunk.researchBrief) {
          yield formatForAISDK({
            type: 'data',
            data: {
              type: 'research_brief',
              content: chunk.researchBrief,
            },
          });
        }
        
        // Update previous state
        previousState = chunk;
      }
      
      // Send finish marker
      yield formatForAISDK({
        type: 'finish',
        finishReason: 'stop',
      });
      
    } catch (error) {
      console.error('Stream error:', error);
      yield formatForAISDK({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

/**
 * Track which messages we've already sent to avoid duplicates
 */
class StreamTracker {
  private sentMessageCount = 0;

  hasNewMessages(currentMessages: any[]): boolean {
    return currentMessages.length > this.sentMessageCount;
  }

  getNewMessages(currentMessages: any[]): any[] {
    const newMessages = currentMessages.slice(this.sentMessageCount);
    this.sentMessageCount = currentMessages.length;
    return newMessages;
  }
}

/**
 * Convert graph message to simple text
 */
function extractTextContent(message: any): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    return message.content
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text || '')
      .join('\n');
  }
  
  return '';
}

/**
 * Create AI SDK compatible stream from LangGraph
 */
export function createAISDKStream(graphStream: AsyncIterable<any>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const tracker = new StreamTracker();
  
  return new ReadableStream({
    async start(controller) {
      console.log("\n[STREAM] ===== Starting AI SDK Stream =====");

      try {
        for await (const chunk of graphStream) {  
          console.log('Stream chunk received:', {
            hasMessages: !!chunk.messages,
            messageCount: chunk.messages?.length || 0,
          });
          console.log(JSON.stringify(chunk, null, 2));
          
          // Check if there are new messages
          if (chunk.messages && tracker.hasNewMessages(chunk.messages)) {
            const newMessages = tracker.getNewMessages(chunk.messages);
            console.log(`[STREAM] ${newMessages.length} new messages detected`);

            // Stream each new AI message
            for (const message of newMessages) {
              if (message.role === 'ai' || message.role === 'assistant') {
                const content = extractTextContent(message);
                
                if (content) {
                  // AI SDK format: "0:{json}\n"
                  const textChunk = `0:${JSON.stringify(content)}\n`;
                  controller.enqueue(encoder.encode(textChunk));
                  
                  console.log('Sent text chunk:', content.substring(0, 50) + '...');
                }
              }
            }
          }
          // Log tool calls
          if (chunk.toolCalls && chunk.toolCalls.length) {
            console.log(`[STREAM] Tool calls detected: ${chunk.toolCalls.length}`);
            for (const call of chunk.toolCalls) {
              console.log(`  • Tool: ${call.name}, Args:`, call.args);
              const toolChunk = `9:${JSON.stringify(call)}\n`;
              controller.enqueue(encoder.encode(toolChunk));
            }
          }

          if (chunk.researchBrief) {
            console.log(`[STREAM] Research brief found (${chunk.researchBrief.length} chars)`);
            const dataChunk = `2:[${JSON.stringify({
              type: "research_brief",
              content: chunk.researchBrief,
            })}]\n`;
            controller.enqueue(encoder.encode(dataChunk));
          }
        }
        
        // Send done signal
        controller.enqueue(encoder.encode('d:{"finishReason":"stop"}\n'));
        console.log('Stream completed');
        
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        console.log("[STREAM] Stream finalized and controller closed.\n");
        controller.close();
      }
    }
  });
}

  