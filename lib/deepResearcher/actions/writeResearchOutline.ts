import {
  getTodayStr,
  getApiKeyForModel,
  createMessageFromMessageType,
} from '@/lib/deepResearcher/llmUtils'
import {
  configurableModel,
  Configuration,
} from '../configuration'
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { getBufferString } from '../../messageUtils';
import { Command, END } from '@langchain/langgraph'
import { 
  AgentState,
} from '../state';
import { 
  leadResearcherPrompt,
  researchOutlineGenerationPrompt,
} from '../prompts';
import { RunnableConfig } from '@langchain/core/runnables';
import { generateUUID } from '@/lib/utils';

export async function writeResearchOutline(
    state: AgentState,
    config: RunnableConfig
  ): Promise<Partial<AgentState> | Command> {    
    const configurable = config.configurable as Configuration

    // research brief generation prompt
    // Why? To create a detailed outline which will be expanded by the research agent
    // Good input = good output
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
      
      // supervisor prompt
      // Why? To understand the input, understnad the tools available, and understand the desired output
      const supervisorSystemPrompt = leadResearcherPrompt(
        configurable.maxResearcherIterations,
        configurable.maxConcurrentResearchUnits, 
        getTodayStr(),
      );

      const researchOutline = typeof response === 'string' 
        ? response 
        : (response as any).researchBrief || response.content?.toString() || '';
      
      console.log('Research outline generated:', researchOutline.substring(0, 100));
      
      return new Command({
        goto: 'researchSupervisor',
        update: {
          researchOutline,
          supervisorMessages: [
            createMessageFromMessageType("system", supervisorSystemPrompt, { id: generateUUID() }),
            createMessageFromMessageType("human", `Research Outline: \n${researchOutline}`),
          ],
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
              "Error generating research brief. Please try rephrasing your question."
            )
          ]
        }
      });
    }
}

