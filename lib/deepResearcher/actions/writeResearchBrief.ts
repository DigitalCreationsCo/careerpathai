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
  filterMessages,
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
  transformMessagesIntoResearchTopicPrompt,
} from '../prompts';
import { RunnableConfig } from '@langchain/core/runnables';

export async function writeResearchBrief(
    state: AgentState,
    config: RunnableConfig
  ): Promise<Partial<AgentState> | Command> {
    console.log('writeResearchBrief: Starting', {
      messageCount: state.messages?.length
    }); 
    
    const configurable = config.configurable as Configuration
    const messages = state.messages || []
    // main research question prompt 
    // Why? to ask one deep question which will guide the goal of research
    const researchTopicPrompt = transformMessagesIntoResearchTopicPrompt(
      getBufferString(messages), 
      getTodayStr()
    );
  
    const briefModel = (await configurableModel)
      .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries });
  
    try {
      const response = await briefModel.invoke(researchTopicPrompt, {
        configurable: {
          model: configurable.researchModel,
          maxTokens: configurable.researchModelMaxTokens,
          apiKey: getApiKeyForModel(configurable.researchModel, config),
        }
      });
      
      const researchBrief = typeof response === 'string' 
        ? response 
        : (response as any).researchBrief || response.content?.toString() || '';
      
      console.log('Research brief generated:', researchBrief.substring(0, 100));
      
      // Add brief as message that supervisor will see
      return new Command({
        goto: 'writeResearchOutline',
        update: {
          researchBrief: researchBrief,
          messages: [
            new AIMessage({ 
              content: `${researchBrief}` 
            }),
          ],
        }
      });
      
    } catch (error) {
      console.error('[LLM ERROR] writeResearchBrief:', error);
      
      return new Command({
        goto: END,
        update: {
          messages: [
            new AIMessage({ 
              content: "Error generating research brief. Please try rephrasing your question." 
            })
          ]
        }
      });
    }
}

