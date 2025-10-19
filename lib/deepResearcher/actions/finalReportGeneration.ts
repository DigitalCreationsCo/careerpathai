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

export async function finalReportGeneration(state: AgentState, config: RunnableConfig): Promise<{ finalReport: string; messages: AIMessage[]; notes: { type: string; value: any[] } }> {
    /**
     * Generate the final comprehensive research report with retry logic for token limits.
     * 
     * This function takes all collected research findings and synthesizes them into a 
     * well-structured, comprehensive final report using the configured report generation model.
     * 
     * Args:
     *     state: Agent state containing research findings and context
     *     config: Runtime configuration with model settings and API keys
     *     
     * Returns:
     *     Dictionary containing the final report and cleared state
     */
    // Step 1: Extract research findings and prepare state cleanup
    const notes = state.notes || []
    const clearedState = { notes: { type: "override", value: [] } }
    let findings = notes.join("\n")
    
    // Step 2: Configure the final report generation model
    const configurable = Configuration.fromRunnableConfig(config)
    const writerModelConfig = {
        model: configurable.finalReportModel,
        maxTokens: configurable.finalReportModelMaxTokens,
        apiKey: getApiKeyForModel(configurable.finalReportModel, config),
        tags: ["langsmith:nostream"]
    }
    
    // Step 3: Attempt report generation with token limit retry logic
    const maxRetries = 3
    let currentRetry = 0
    let findingsTokenLimit: number | null = null
    
    while (currentRetry <= maxRetries) {
        try {
            // Create comprehensive prompt with all research context
            const finalReportPrompt = finalReportGenerationPrompt(
                state.researchBrief || "", 
                getBufferString(state.messages || []),
                findings,
                getTodayStr()
            );
            
            // Generate the final report
            const finalReport = await (await configurableModel).withConfig(writerModelConfig).invoke([
                new HumanMessage({ content: finalReportPrompt })
            ])
            
            // Return successful report generation
            return {
                finalReport: finalReport.content.toString(), 
                messages: [finalReport as AIMessage],
                ...clearedState
            }
            
        } catch (e: any) {
            // Handle token limit exceeded errors with progressive truncation
            if (isTokenLimitExceeded(e, configurable.finalReportModel)) {
                currentRetry++
                
                if (currentRetry === 1) {
                    // First retry: determine initial truncation limit
                    const modelTokenLimit = getModelTokenLimit(configurable.finalReportModel)
                    if (!modelTokenLimit) {
                        return {
                            finalReport: `Error generating final report: Token limit exceeded, however, we could not determine the model's maximum context length. Please update the model map in deep_researcher/utils.py with this information. ${e}`,
                            messages: [new AIMessage({ content: "Report generation failed due to token limits" })],
                            ...clearedState
                        }
                    }
                    // Use 4x token limit as character approximation for truncation
                    findingsTokenLimit = modelTokenLimit * 4
                } else {
                    // Subsequent retries: reduce by 10% each time
                    findingsTokenLimit = Math.floor((findingsTokenLimit || 0) * 0.9)
                }
                
                // Truncate findings and retry
                findings = findings.substring(0, findingsTokenLimit || 0)
                continue
            } else {
                // Non-token-limit error: return error immediately
                return {
                    finalReport: `Error generating final report: ${e}`,
                    messages: [new AIMessage({ content: "Report generation failed due to an error" })],
                    ...clearedState
                }
            }
        }
    }
    
    // Step 4: Return failure result if all retries exhausted
    return {
        finalReport: "Error generating final report: Maximum retries exceeded",
        messages: [new AIMessage({ content: "Report generation failed after maximum retries" })],
        ...clearedState
    }
}

