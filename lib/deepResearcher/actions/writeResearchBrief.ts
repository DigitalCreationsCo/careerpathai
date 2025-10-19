import {
  getTodayStr,
  getApiKeyForModel,
} from '@/lib/deepResearcher/llmUtils'
import {
  configurableModel,
  Configuration,
} from '../configuration'
import {
  AIMessage,
} from '@langchain/core/messages'
import { getBufferString } from '../../messageUtils';
import { Command, END } from '@langchain/langgraph'
import { 
  AgentState,
} from '../state';
import { 
  transformMessagesIntoResearchTopicPrompt,
} from '../prompts';
import { RunnableConfig } from '@langchain/core/runnables';

export async function writeResearchBrief(
    state: AgentState,
    config: RunnableConfig
  ): Promise<Command> {
    const configurable = config.configurable as Configuration
    const messages = state.messages || []
    const prompt = transformMessagesIntoResearchTopicPrompt(getBufferString(messages), getTodayStr());
  
    // --- MIRRORED CONFIG MODEL BINDING ---
    const briefModel = (await configurableModel)
      .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries });
  
    let response;
    try {
      response = await briefModel.invoke(prompt, {
        configurable: {
          model: configurable.researchModel,
          maxTokens: configurable.researchModelMaxTokens,
          apiKey: getApiKeyForModel(configurable.researchModel, config),
        }
      }) as { researchBrief: string };
    } catch (error) {
      console.error('[LLM ERROR] writeResearchBriefa:', error);
      const clearedState = { notes: { type: "override", value: [] } }

      return {
        goto: END,
        update: {
          ...clearedState,
          messages: [new AIMessage({ content: "Error generating research brief." })],
        }
      }
    }
  
    const supervisorPrompt = `Lead researcher instructions based on brief: ${response.researchBrief}`
  
    return {
        goto: 'researchSupervisor',
        update: {
            researchBrief: response.researchBrief,
            supervisorMessages: [
            { role: 'system', content: supervisorPrompt },
            { role: 'human', content: response.researchBrief }
            ]
        }
    }
}