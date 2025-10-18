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
  AgentState,
} from '../state';
import { 
  transformMessagesIntoResearchTopicPrompt,
} from '../prompts';

export async function writeResearchBrief(
    state: AgentState,
    config: Configuration
  ): Promise<Command> {
    const configurable = config
    const messages = state.messages || []
    const prompt = transformMessagesIntoResearchTopicPrompt(getBufferString(messages), getTodayStr());
  
    // --- MIRRORED CONFIG MODEL BINDING ---
    const briefModel = (await configurableModel)
      .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries });
  
    const response = await briefModel.invoke(prompt, {
      configurable: {
        model: configurable.researchModel,
        maxTokens: configurable.researchModelMaxTokens,
        apiKey: getApiKeyForModel(configurable.researchModel, config),
      }
    }) as { researchBrief: string };
  
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