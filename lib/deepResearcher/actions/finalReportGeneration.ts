
// ============================================
// finalReportGeneration.ts - FIXED
// ============================================
import {
    getTodayStr,
    isTokenLimitExceeded,
    getApiKeyForModel,
    getModelTokenLimit,
    createMessageFromMessageType,
  } from '@/lib/deepResearcher/llmUtils'
  import {
    configurableModel,
    Configuration,
  } from '../configuration'
  // Remove direct imports of HumanMessage, AIMessage
  import { getBufferString } from '../../messageUtils';
  import { RunnableConfig } from '@langchain/core/runnables'
  import { 
    AgentState,
    FinalReportOutput,
  } from '../state';
  import { 
    finalReportGenerationPrompt,
  } from '../prompts';
import { generateUUID } from '@/lib/utils';
import { Command, END } from '@langchain/langgraph';
  
export async function finalReportGeneration(
    state: AgentState, 
    config: RunnableConfig
): Promise<Command> {
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
            state.researchOutline || "", 
            getBufferString(state.messages || []),
            findings,
            getTodayStr()
            );
            
            console.log('Generating final report...');
            
            const reportModel = await configurableModel
            .withConfig(writerModelConfig)
            .withStructuredOutput(FinalReportOutput)

            const reportOutput = await reportModel.invoke([
                createMessageFromMessageType("human", finalReportPrompt)
            ]) as unknown as FinalReportOutput

            if (!reportOutput.reportPreview || !reportOutput.finalReport) {
                throw new Error('Invalid report structure: missing reportPreview or finalReport');
            }
            
            const previewTokenCount = reportOutput.reportPreview ? reportModel.getNumTokens(reportOutput.reportPreview) : 0;
            const finalReportTokenCount = reportOutput.finalReport ? reportModel.getNumTokens(reportOutput.finalReport) : 0;

            console.log('Report generated successfully:', {
                hasPreview: !!reportOutput.reportPreview,
                previewLength: reportOutput.reportPreview?.length || 0,
                previewTokenCount,
                hasFinalReport: !!reportOutput.finalReport,
                finalReportLength: reportOutput.finalReport?.length || 0,
                finalReportTokenCount
            });
        
            return new Command({
                goto: END,
                update: {
                    finalReport: reportOutput.finalReport,
                    reportPreview: reportOutput.reportPreview,
                    messages: [
                        createMessageFromMessageType(
                            "ai",
                            `# 📝 Report Preview\n\n${reportOutput.reportPreview}`
                        )
                    ],
                    notes: []
                }
            });
            
        } catch (e: any) {
            console.error('Final report generation error:', {
                retry: currentRetry,
                error: e.message
              });
            
            if (isTokenLimitExceeded(e, configurable.finalReportModel)) {
                currentRetry++
                
                if (currentRetry === 1) {
                    const modelTokenLimit = getModelTokenLimit(configurable.finalReportModel)
                    if (!modelTokenLimit) {
                        return new Command({
                            update: {
                                finalReport: `Error: Token limit exceeded.`,
                                messages: [
                                    createMessageFromMessageType(
                                    "ai",
                                    "Report generation failed due to token limits.",
                                    )
                                ],
                                notes: []
                            }
                        });
                    }
                    findingsTokenLimit = modelTokenLimit * 4
                } else {
                    findingsTokenLimit = Math.floor((findingsTokenLimit || 0) * 0.9)
                }
                
                findings = findings.substring(0, findingsTokenLimit || 0)
                continue
            } else {
                return new Command({
                    goto: END,
                    update: {
                        finalReport: `Error: ${e.message || e}`,
                        messages: [
                            createMessageFromMessageType(
                                "ai",
                                `Error generating report: ${e.message || 'Unknown error'}`,
                            )
                        ],
                        notes: []
                    }
                });
            }
        }
    }
      
    return new Command({
        goto: END,
        update: {
            finalReport: "Error: Maximum retries exceeded",
            messages: [
                createMessageFromMessageType(
                "ai",
                "Report generation failed after multiple attempts.",
                )
            ],
            notes: []
        }
    });
}