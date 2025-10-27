import { END } from '@langchain/langgraph'
import {
  isTokenLimitExceeded,
  getApiKeyForModel,
  thinkTool,
  getNotesFromToolCalls,
} from '@/lib/deepResearcher/llmUtils'
import {
    configurableModel,
  Configuration,
} from '../configuration'
import {
  AIMessage,
  HumanMessage,
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

export async function supervisor(state: SupervisorState, config: RunnableConfig): Promise<Command> {
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
    // Step 1: Configure the supervisor model with available tools
    const configurable = Configuration.fromRunnableConfig(config)
    const researchModelConfig = {
        model: configurable.researchModel,
        maxTokens: configurable.researchModelMaxTokens,
        apiKey: getApiKeyForModel(configurable.researchModel, config),
        tags: ["langsmith:nostream"]
    }
    
    // Available tools: research delegation, completion signaling, and strategic thinking
    const leadResearcherTools = [ConductResearch, ResearchComplete, thinkTool]
    
    // Configure model with tools, retry logic, and model settings
    const researchModel = (await configurableModel)
        .bindTools(leadResearcherTools)
        .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })
        .withConfig(researchModelConfig)
    
    // Step 2: Generate supervisor response based on current context
    const supervisorMessages = state.supervisorMessages || []
    
    const response = await researchModel.invoke(supervisorMessages)
    
    // Step 3: Update state and proceed to tool execution
    return new Command({
        goto: "supervisorTools",
        update: {
            supervisorMessages: [response],
            researchIterations: (state.researchIterations || 0) + 1
        }
    });
    // return {
    //   messages: [
    //     new AIMessage({
    //       content: 'Supervisor: Coordinating research tasks...'
    //     })
    //   ],
    //   // Add any notes found
    //   notes: ['Research finding 1', 'Research finding 2']
    // };
     
}

export async function supervisorTools(state: SupervisorState, config: RunnableConfig): Promise<Command> {
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
    // Step 1: Extract current state and check exit conditions
    const configurable = Configuration.fromRunnableConfig(config)
    const supervisorMessages = state.supervisorMessages || []
    const researchIterations = state.researchIterations || 0
    const mostRecentMessage = supervisorMessages[supervisorMessages.length - 1]
    
    // Define exit criteria for research phase
    const exceededAllowedIterations = researchIterations > configurable.maxResearcherIterations
    const noToolCalls = mostRecentMessage.type !== "tool"
    const researchCompleteToolCall = (mostRecentMessage as any).toolCalls?.some(
        (toolCall: any) => toolCall.name === "ResearchComplete"
    ) || false
    
    // Exit if any termination condition is met
    if (exceededAllowedIterations || noToolCalls || researchCompleteToolCall) {
        return new Command({
            goto: END,
            graph: Command.PARENT,
            update: {
                researchBrief: state.researchBrief || "",
                notes: getNotesFromToolCalls(supervisorMessages),
                messages: [
                  new AIMessage({
                    content: "Writing your career path report..."
                  })
                ],
            }
        });
    }
    
    // Step 2: Process all tool calls together (both thinkTool and ConductResearch)
    const allToolMessages: ToolMessage[] = []
    const updatePayload: any = { supervisorMessages: [] }
    
    // Handle thinkTool calls (strategic reflection)
    const thinkToolCalls = (mostRecentMessage as any).toolCalls?.filter(
        (toolCall: any) => toolCall.name === "thinkTool"
    ) || []
    
    for (const toolCall of thinkToolCalls) {
        const reflectionContent = toolCall.args.reflection
        allToolMessages.push(new ToolMessage({
            content: `Reflection recorded: ${reflectionContent}`,
            name: "thinkTool",
            tool_call_id: toolCall.id
        }))
    }
    
    // Handle ConductResearch calls (research delegation)
    const conductResearchCalls = (mostRecentMessage as any).toolCalls?.filter(
        (toolCall: any) => toolCall.name === "ConductResearch"
    ) || []
    
    if (conductResearchCalls.length > 0) {
        try {
            // Limit concurrent research units to prevent resource exhaustion
            const allowedConductResearchCalls = conductResearchCalls.slice(0, configurable.maxConcurrentResearchUnits)
            const overflowConductResearchCalls = conductResearchCalls.slice(configurable.maxConcurrentResearchUnits)
            
            // Execute research tasks in parallel
            const researchTasks = allowedConductResearchCalls.map((toolCall: any) =>
                researcherSubgraph.invoke({
                    researcherMessages: [
                        new HumanMessage({ content: toolCall.args.researchTopic })
                    ],
                    researchTopic: toolCall.args.researchTopic
                }, config)
            )
            
            const toolResults = await Promise.all(researchTasks)
            
            // Create tool messages with research results
            for (let i = 0; i < toolResults.length; i++) {
                const observation = toolResults[i]
                const toolCall = allowedConductResearchCalls[i]
                allToolMessages.push(new ToolMessage({
                    content: observation.compressedResearch || "Error synthesizing research report: Maximum retries exceeded",
                    name: toolCall.name,
                    tool_call_id: toolCall.id
                }))
            }
            
            // Handle overflow research calls with error messages
            for (const overflowCall of overflowConductResearchCalls) {
                allToolMessages.push(new ToolMessage({
                    content: `Error: Did not run this research as you have already exceeded the maximum number of concurrent research units. Please try again with ${configurable.maxConcurrentResearchUnits} or fewer research units.`,
                    name: "ConductResearch",
                    tool_call_id: overflowCall.id
                }))
            }
            
            // Aggregate raw notes from all research results
            const rawNotesConcat = toolResults
                .map(observation => observation.rawNotes?.join("\n") || "")
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
                        researchBrief: state.researchBrief || ""
                    }
                });
            }
        }
    }
    
    // Step 3: Return command with all tool results
    updatePayload.supervisorMessages = allToolMessages
    return new Command({
        goto: "supervisor",
        update: updatePayload
    });
}

// ============================================
// supervisor.ts - Example of how to update it
// ============================================
// import { AIMessage } from '@langchain/core/messages';
// import { SupervisorState } from '../state';
// import { RunnableConfig } from '@langchain/core/runnables';

// export async function supervisor(
//   state: SupervisorState,
//   config: RunnableConfig
// ): Promise<Partial<SupervisorState>> {
//   console.log('supervisor: Starting', {
//     messageCount: state.messages?.length,
//     notesCount: state.notes?.length
//   });
  
//   // Your supervisor logic here...
//   // When supervisor makes decisions, add them as messages
  
//   return {
//     messages: [
//       new AIMessage({
//         content: 'Supervisor: Coordinating research tasks...'
//       })
//     ],
//     // Add any notes found
//     notes: ['Research finding 1', 'Research finding 2']
//   };
// }

// export async function supervisorTools(
//   state: SupervisorState,
//   config: RunnableConfig
// ): Promise<Partial<SupervisorState>> {
//   console.log('supervisorTools: Executing tools');
  
//   // Your tool execution logic here...
//   // Add tool results as messages
  
//   return {
//     messages: [
//       new AIMessage({
//         content: 'Tool execution completed. Found relevant information...'
//       })
//     ],
//     notes: ['Tool finding 1']
//   };
// }

// // ============================================
// // supervisorSubgraph.ts - UPDATED
// // ============================================
// import { StateGraph, START, END } from '@langchain/langgraph'
// import { Configuration } from '../configuration'
// import { SupervisorState } from '../state';
// import { supervisor, supervisorTools } from '../actions/supervisor';

// const supervisorBuilder = new StateGraph(SupervisorState, Configuration.getSchema())

// // Add supervisor nodes
// supervisorBuilder.addNode("supervisor", supervisor)
// supervisorBuilder.addNode("supervisorTools", supervisorTools)

// // Define workflow
// supervisorBuilder.addEdge(START, "supervisor")

// // Add conditional routing from supervisor
// supervisorBuilder.addConditionalEdges(
//   "supervisor",
//   (state: SupervisorState) => {
//     // Your routing logic - when to use tools vs when to finish
//     const shouldUseTool = state.notes?.length < 5; // Example condition
//     return shouldUseTool ? "supervisorTools" : END;
//   },
//   {
//     supervisorTools: "supervisorTools",
//     [END]: END
//   }
// );

// // Route from tools back to supervisor for next iteration
// supervisorBuilder.addEdge("supervisorTools", "supervisor");

// const supervisorSubgraph = supervisorBuilder.compile()

// export { supervisorSubgraph }