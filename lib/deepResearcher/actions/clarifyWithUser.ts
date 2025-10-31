// ============================================
// lib/deepResearcher/actions/clarifyWithUser.ts
// ============================================

import {
  getTodayStr,
  getApiKeyForModel,
  createMessageFromMessageType,
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

/**
 * clarifyWithUser composes message history and ensures message accumulation.
 * 
 * Each new message is appended to the prior message array, preserving chat context.
 */
export async function clarifyWithUser(
    state: AgentState,
    config: RunnableConfig
  ): Promise<Partial<AgentState> | Command> {
    const configurable = config.configurable as Configuration;
    const messages = state.messages || [];
    
    if (!configurable.allowClarification) {
      return new Command({
        goto: 'writeResearchBrief',
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
      }) as unknown as ClarifyWithUser;
    } catch(error) {
      console.error('[LLM ERROR] clarifyWithUser:', error);
      
      return new Command({
        goto: 'writeResearchBrief',
        update: {
          messages: [
            createMessageFromMessageType(
              "ai",
              '[LLM Error during clarification. Proceeding to research brief.]'
            ),
          ]
        }
      });
    }

    if (response.needClarification) {
      return new Command({
        update: {
          messages: [
            createMessageFromMessageType(
              "ai",
              response.question || 'Could you please provide more details?',
            )
          ]
        }
      });
    }
    
    return new Command({
      goto: 'writeResearchBrief',
      update: {
        messages: [
          createMessageFromMessageType(
            "ai",
            response.verification || 'Understood. Proceeding with research.',
          )
        ]
      }
    });
}