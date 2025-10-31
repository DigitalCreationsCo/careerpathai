import { END } from '@langchain/langgraph'
import {
  isTokenLimitExceeded,
  getApiKeyForModel,
  thinkTool,
  getNotesFromToolCalls,
  createMessageFromMessageType,
  getTodayStr,
} from '@/lib/deepResearcher/llmUtils'
import {
    configurableModel,
  Configuration,
} from '../configuration'
import {
    AIMessage,
  ToolMessage,
} from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { Command } from '@langchain/langgraph'
import { 
  ConductResearch,
  ResearchComplete,
  SupervisorState,
} from '../state';
import { researcherSubgraph } from '../nodes/researchSubgraph';
import { supervisorSystemPrompt } from '../prompts'

/**
 * Lead research supervisor that plans research strategy and delegates to researchers.
 * 
 * The supervisor analyzes the research brief and decides how to break down the research
 * into manageable tasks. It can use thinkTool for strategic planning, ConductResearch
 * to delegate tasks to sub-researchers, or ResearchComplete when satisfied with findings.
 * 
 * Args:
 *     state: Current supervisor state with messages and research context
 *     config: Runtime configuration with model settings
 *     
 * Returns:
 *     Command to proceed to supervisorTools for tool execution
 */
export async function supervisor(
    state: SupervisorState, 
    config: RunnableConfig
): Promise<Command> {
    const configurable = Configuration.fromRunnableConfig(config)
    const researchModelConfig = {
        model: configurable.researchModel,
        maxTokens: configurable.researchModelMaxTokens,
        apiKey: getApiKeyForModel(configurable.researchModel, config),
        tags: ["langsmith:nostream"]
    };
    
    const researchModel = (await configurableModel)
        .bindTools([ConductResearch, ResearchComplete, thinkTool])
        .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })
        .withConfig(researchModelConfig)
    
    let supervisorMessages = state.supervisorMessages || []
    
    if (supervisorMessages.length === 0) {
        const systemPrompt = supervisorSystemPrompt(
          configurable.maxResearcherIterations,
          configurable.maxConcurrentResearchUnits,
          getTodayStr()
        );
        
        supervisorMessages = [
          createMessageFromMessageType("system", systemPrompt)
        ];
    }

    const response = await researchModel.invoke(supervisorMessages)
    console.log('Supervisor response:', {
        hasToolCalls: !!response.tool_calls,
        toolCallCount: response.tool_calls?.length || 0,
        toolNames: response.tool_calls?.map((tc: any) => tc.name) || [],
        contentPreview: response.content?.toString().substring(0, 100)
    });

    return new Command({
        goto: "supervisorTools",
        update: {
            supervisorMessages: [response],
            researchIterations: (state.researchIterations || 0) + 1
        }
    });
}

/**
 * Execute tools called by the supervisor, including research delegation and strategic thinking.
 * 
 * This function handles three types of supervisor tool calls:
 * 1. thinkTool - Strategic reflection that continues the conversation
 * 2. ConductResearch - Delegates research tasks to sub-researchers
 * 3. ResearchComplete - Signals completion of research phase
 * 
 * Args:
 *     state: Current supervisor state with messages and iteration count
 *     config: Runtime configuration with research limits and model settings
 *     
 * Returns:
 *     Command to either continue supervision loop or end research phase
 */
export async function supervisorTools(
    state: SupervisorState, 
    config: RunnableConfig
): Promise<Command> {
    const configurable = Configuration.fromRunnableConfig(config)
    const supervisorMessages = state.supervisorMessages || []
    const researchIterations = state.researchIterations || 0
    const lastMessage = supervisorMessages[supervisorMessages.length - 1] as AIMessage;
    
    const exceededIterations = researchIterations > configurable.maxResearcherIterations
    const noToolCalls = !lastMessage.tool_calls || lastMessage.tool_calls.length === 0
    const isResearchComplete = lastMessage.tool_calls?.some(
        (toolCall: any) => toolCall.name === "ResearchComplete"
    ) || false
    
    if (exceededIterations || noToolCalls || isResearchComplete) {
        return new Command({
            goto: END,
            graph: Command.PARENT,
            update: {
                researchOutline: state.researchOutline || "",
                notes: getNotesFromToolCalls(supervisorMessages),
                messages: [
                  createMessageFromMessageType("ai", "Research complete. Writing your report...",)
                ],
            }
        });
    }
    
    const toolMessages: ToolMessage[] = []
    const updatePayload: any = { supervisorMessages: [] }
    
    const thinkToolCalls = lastMessage.tool_calls?.filter(
        (toolCall: any) => toolCall.name === "thinkTool"
    ) || []
    const conductResearchCalls = lastMessage.tool_calls?.filter(
        (toolCall: any) => toolCall.name === "ConductResearch"
    ) || []
    
    for (const toolCall of thinkToolCalls) {
        const reflection = toolCall.args.reflection;
        console.log('Think tool reflection:', reflection.substring(0, 100));

        toolMessages.push(
            createMessageFromMessageType(
                "tool",
                `Reflection recorded: ${reflection}`,
                {
                    name: "thinkTool",
                    tool_call_id: toolCall.id,
                }
            )
        );
        
        if (conductResearchCalls.length > 0) {
            try {
                const allowedCalls = conductResearchCalls.slice(0, configurable.maxConcurrentResearchUnits)
                const overflowCalls = conductResearchCalls.slice(configurable.maxConcurrentResearchUnits)
                console.log('Executing research tasks:', {
                    allowed: allowedCalls.length,
                    overflow: overflowCalls.length
                });
            
                const researchTasks = allowedCalls.map((toolCall: any) =>
                    researcherSubgraph.invoke({
                        researcherMessages: [
                            createMessageFromMessageType("human", toolCall.args.researchTopic)
                        ],
                        researchTopic: toolCall.args.researchTopic
                    }, config)
                )
                
                const results = await Promise.all(researchTasks)
                
                for (let i = 0; i < results.length; i++) {
                    const result = results[i]
                    const toolCall = allowedCalls[i]
                    console.log('Research result:', {
                        topic: toolCall.args.researchTopic.substring(0, 50),
                        hasCompressedResearch: !!result.compressedResearch,
                        notesCount: result.rawNotes?.length || 0
                    });

                    toolMessages.push(
                        createMessageFromMessageType(
                            "tool",
                            result.compressedResearch || "Error: No research findings",
                            {
                                name: "ConductResearch",
                                tool_call_id: toolCall.id
                            }
                        )
                    )
                }
                
                // Handle overflow research calls with error messages
                for (const overflowCall of overflowCalls) {
                    toolMessages.push(
                        createMessageFromMessageType(
                            "tool",
                            `Error: Exceeded maximum concurrent research units (${configurable.maxConcurrentResearchUnits}). This task was not executed.`,
                            {
                                name: "ConductResearch",
                                tool_call_id: overflowCall.id
                            }
                        )
                    )
                }
                
                // Aggregate raw notes from all research results
                const rawNotesConcat = results
                    .map(r => r.rawNotes?.join("\n") || "")
                    .join("\n")
                
                if (rawNotesConcat) {
                    updatePayload.rawNotes = [rawNotesConcat]
                }
                    
            } catch (e: any) {
                // Handle research execution errors
                if (isTokenLimitExceeded(e, configurable.researchModel) || true) {
                    // Token limit exceeded or other error - end research phase
                    return new Command({
                        goto: END,
                        graph: Command.PARENT,
                        update: {
                            notes: getNotesFromToolCalls(supervisorMessages),
                            researchOutline: state.researchOutline || "",
                            messages: [
                                createMessageFromMessageType("ai", "Token limit reached. Proceeding with available findings...")
                            ]
                        }
                    });
                }
            }
        }   
    }
    updatePayload.supervisorMessages = toolMessages;
    
    return new Command({
        goto: "supervisor",
        update: updatePayload
    });
}
