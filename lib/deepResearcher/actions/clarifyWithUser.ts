// ============================================
// clarifyWithUser.ts
// ============================================
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
  AgentState,
} from '../state';
import { 
  clarifyWithUserInstructions,
} from '../prompts';
import { RunnableConfig } from '@langchain/core/runnables';
import { AIMessage } from '@langchain/core/messages';

export async function clarifyWithUser(
    state: AgentState,
    config: RunnableConfig
  ): Promise<Partial<AgentState> | Command> {
    console.log('clarifyWithUser: Processing state', {
      messageCount: state.messages?.length,
    });
    
    const configurable = config.configurable as Configuration;
    const messages = state.messages || []
    
    if (!Array.isArray(messages)) {
      throw new Error('State.messages must be an array');
    }
    
    if (!configurable.allowClarification) {
      return new Command({
        goto: 'writeResearchBrief'
      });
    }
  
    const clarificationModel = (await configurableModel)
      .withStructuredOutput(ClarifyWithUser)
      .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })
    
    const messageBuffer = getBufferString(messages);
    const clarifyWithUserPrompt = clarifyWithUserInstructions(
      messageBuffer,
      getTodayStr()
    );
    
    let response;
    try {
      response = await clarificationModel.invoke(clarifyWithUserPrompt, {
        configurable: {
          model: configurable.researchModel,
          maxTokens: configurable.researchModelMaxTokens,
          apiKey: getApiKeyForModel(configurable.researchModel, config),
        }
      });
    } catch (error) {
      console.error('[LLM ERROR] clarifyWithUser:', error);
      
      return new Command({
        goto: 'writeResearchBrief',
        update: {
          messages: [
            new AIMessage({ 
              content: '[LLM Error during clarification. Proceeding to research brief.]' 
            })
          ]
        }
      });
    }
    
    if (response.needClarification) {
      return new Command({
        goto: 'END',
        update: {
          messages: [
            new AIMessage({ 
              content: response.question || 'Could you please provide more details?' 
            })
          ]
        }
      });
    }
    
    return new Command({
      goto: 'writeResearchBrief',
      update: {
        messages: [
          new AIMessage({ 
            content: response.verification || 'Understood. Proceeding with research.' 
          })
        ]
      }
    });
}