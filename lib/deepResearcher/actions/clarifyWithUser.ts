import {
  getTodayStr,
  getApiKeyForModel,
} from '@/lib/utils'
import {
  configurableModel,
  Configuration,
} from '../configuration'
import {
  getBufferString
} from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import { 
  ClarifyWithUser,
  AgentState,
} from '../state';
import { 
  clarifyWithUserInstructions,
} from '../prompts';

export async function clarifyWithUser(
    state: AgentState,
    config: Configuration
  ): Promise<Command> {
    const configurable = config
    if (!configurable.allowClarification) {
      return { goto: 'writeResearchBrief' }
    }
  
    const messages = state.messages || []
  
    const clarificationModel = (await configurableModel)
      .withStructuredOutput(ClarifyWithUser)
      .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })
  
    const clarifyWithUserPrompt = clarifyWithUserInstructions(getBufferString(messages), getTodayStr());
  
    let response: any;
    try {
      response = await clarificationModel.invoke(clarifyWithUserPrompt, {
        configurable: {
          model: configurable.researchModel,
          maxTokens: configurable.researchModelMaxTokens,
          apiKey: getApiKeyForModel(configurable.researchModel, config),
        }
      })
    } catch (error) {
      console.error('[LLM ERROR] clarifyWithUser:', error);
      // fallback: return to writeResearchBrief or handle as needed
      return {
        goto: 'writeResearchBrief',
        update: {
          messages: [
            ...messages,
            { role: 'ai', content: '[LLM Error during clarification. Proceeding to research brief.]' }
          ]
        }
      }
    }
  
    console.debug('[LLM RESPONSE] clarifyWithUser: ', response);
  
    if (response.needClarification) {
      return {
        goto: 'END',
        update: {
          messages: [
            ...messages,
            { role: 'ai', content: response.question || '' }
          ]
        }
      }
    }
    
    return {
      goto: 'writeResearchBrief',
      update: {
        messages: [
          ...messages,
          { role: 'ai', content: response.verification || '' }
        ]
      }
    }
  }