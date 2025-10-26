
// ============================================
// finalReportGeneration.ts - FIXED
// ============================================
import {
    getTodayStr,
    isTokenLimitExceeded,
    getApiKeyForModel,
    getModelTokenLimit,
  } from '@/lib/deepResearcher/llmUtils'
  import {
    configurableModel,
    Configuration,
  } from '../configuration'
  import {
    HumanMessage,
    AIMessage,
  } from '@langchain/core/messages'
  import { getBufferString } from '../../messageUtils';
  import { RunnableConfig } from '@langchain/core/runnables'
  import { 
    AgentState,
  } from '../state';
  import { 
    finalReportGenerationPrompt,
  } from '../prompts';
  
  // CRITICAL: Return Partial<AgentState>, NOT Command
  export async function finalReportGeneration(
    state: AgentState, 
    config: RunnableConfig
  ): Promise<Partial<AgentState>> {
      console.log('finalReportGeneration: Starting', {
        notesCount: state.notes?.length,
        messageCount: state.messages?.length
      });
      
      const notes = state.notes || []
      let findings = notes.join("\n")
      
      const configurable = config.configurable as Configuration;

      const writerModelConfig = {
          model: configurable.finalReportModel,
          maxTokens: configurable.finalReportModelMaxTokens,
          apiKey: getApiKeyForModel(configurable.finalReportModel, config),
          tags: ["langsmith:nostream"]
      }
      
      const maxRetries = 3
      let currentRetry = 0
      let findingsTokenLimit: number | null = null
      
      while (currentRetry <= maxRetries) {
          try {
              const finalReportPrompt = finalReportGenerationPrompt(
                  state.researchBrief || "", 
                  getBufferString(state.messages || []),
                  findings,
                  getTodayStr()
              );
              
              console.log('Generating final report...');
              
              const finalReportResponse = await (await configurableModel)
                .withConfig(writerModelConfig)
                .invoke([
                  new HumanMessage({ content: finalReportPrompt })
                ]);
              
              const reportContent = finalReportResponse.content.toString();
              
              console.log('Final report generated, length:', reportContent.length);
              
              // CRITICAL: Return state update directly (no Command)
              return {
                  finalReport: reportContent,
                  messages: [
                      new AIMessage({ 
                          content: `# Research Report Complete\n\n${reportContent}` 
                      })
                  ],
                  notes: []
              };
              
          } catch (e: any) {
              console.error('Final report generation error:', e);
              
              if (isTokenLimitExceeded(e, configurable.finalReportModel)) {
                  currentRetry++
                  
                  if (currentRetry === 1) {
                      const modelTokenLimit = getModelTokenLimit(configurable.finalReportModel)
                      if (!modelTokenLimit) {
                          return {
                              finalReport: `Error: Token limit exceeded.`,
                              messages: [
                                  new AIMessage({ 
                                      content: "Report generation failed due to token limits." 
                                  })
                              ],
                              notes: []
                          };
                      }
                      findingsTokenLimit = modelTokenLimit * 4
                  } else {
                      findingsTokenLimit = Math.floor((findingsTokenLimit || 0) * 0.9)
                  }
                  
                  findings = findings.substring(0, findingsTokenLimit || 0)
                  continue
              } else {
                  return {
                      finalReport: `Error: ${e.message || e}`,
                      messages: [
                          new AIMessage({ 
                              content: `Error generating report: ${e.message || 'Unknown error'}` 
                          })
                      ],
                      notes: []
                  };
              }
          }
      }
      
      return {
          finalReport: "Error: Maximum retries exceeded",
          messages: [
              new AIMessage({ 
                  content: "Report generation failed after multiple attempts." 
              })
          ],
          notes: []
      };
  }