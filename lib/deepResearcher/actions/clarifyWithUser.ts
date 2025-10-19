import {
  getTodayStr,
  getApiKeyForModel,
} from '@/lib/deepResearcher/llmUtils'
import {
  configurableModel,
  Configuration,
} from '../configuration'
import { getBufferString } from '../../messageUtils';
import { Command } from '@langchain/langgraph'
import { 
  ClarifyWithUser,
  ClarifyWithUserType,
  AgentState,
} from '../state';
import { 
  clarifyWithUserInstructions,
} from '../prompts';
import { RunnableConfig } from '@langchain/core/runnables';

export async function clarifyWithUser(
    state: AgentState,
    config: RunnableConfig
  ): Promise<Command> {
    console.log('clarifyWithUser: Processing state', {
      messageCount: state.messages?.length,
      messages: state.messages,
    });

    const configurable = config.configurable as Configuration;
    const messages = state.messages || []

    if (!Array.isArray(messages)) {
      throw new Error('State.messages must be an array');
    }

    if (!configurable.allowClarification) {
      return { goto: 'writeResearchBrief' }
    }
  
    const clarificationModel = (await configurableModel)
    .withStructuredOutput(ClarifyWithUser)
    .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })
    
    const messageBuffer = getBufferString(messages);
    console.log('Message buffer:', messageBuffer.substring(0, 200) + '...');
    
    const clarifyWithUserPrompt = clarifyWithUserInstructions(
      messageBuffer,
      getTodayStr()
    );
    
    let response;
    try {
      console.log('Invoking clarification model: ', {
        model: configurable.researchModel,
        maxTokens: configurable.researchModelMaxTokens,
        apiKey: getApiKeyForModel(configurable.researchModel, config),
      });
      response = await clarificationModel.invoke(clarifyWithUserPrompt, {
        configurable: {
          model: configurable.researchModel,
          maxTokens: configurable.researchModelMaxTokens,
          apiKey: getApiKeyForModel(configurable.researchModel, config),
        }
      });

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