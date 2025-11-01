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
import { Command, END } from '@langchain/langgraph'
import { 
  AgentState,
} from '../state';
import { 
  supervisorSystemPrompt,
  researchOutlineGenerationPrompt,
} from '../prompts';
import { RunnableConfig } from '@langchain/core/runnables';

export async function writeResearchOutline(
    state: AgentState,
    config: RunnableConfig
  ): Promise<Partial<AgentState> | Command> {    
    const configurable = config.configurable as Configuration

    const researchOutlinePrompt = researchOutlineGenerationPrompt(
      state.researchBrief || "", 
      getBufferString(state.messages || []),
      getTodayStr()
    )
  
    const outlineModel = (await configurableModel)
      .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries });
  
    try {
      const response = await outlineModel.invoke(researchOutlinePrompt, {
        configurable: {
          model: configurable.researchModel,
          maxTokens: configurable.researchModelMaxTokens,
          apiKey: getApiKeyForModel(configurable.researchModel, config),
        }
      });
      
      const researchOutline = typeof response === 'string' 
        ? response 
        : (response as any).researchBrief || response.content?.toString() || '';
      
      return new Command({
        goto: 'researchSupervisor',
        update: {
          researchOutline,
          supervisorMessages: [
            createMessageFromMessageType(
              "system", 
              supervisorSystemPrompt(
                state.researchBrief || "",
                state.researchOutline || "",
                configurable.maxResearcherIterations,
                configurable.maxConcurrentResearchUnits, 
                getTodayStr(),
              )),
            createMessageFromMessageType(
              "human", 
              `Please conduct research according to this outline: ${researchOutline}`
            ),
          ],
          messages: [
            createMessageFromMessageType(
              "ai",
              "Please wait while I research your career paths."
            ),
          ]
        }
      });
    } catch (error) {
      console.error('[LLM ERROR] writeResearchBrief:', error);
      return new Command({
        goto: END,
        update: {
          messages: [
            createMessageFromMessageType(
              "ai",
              "Error generating research outline. Please try rephrasing your question."
            )
          ]
        }
      });
    }
}

