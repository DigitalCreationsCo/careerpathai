import { StateGraph, START, END } from '@langchain/langgraph'
import { initChatModel } from "langchain/chat_models/universal";
import {
  getTodayStr,
  removeUpToLastAIMessage,
  isTokenLimitExceeded,
  getApiKeyForModel,
  getModelTokenLimit,
  getAllTools,
  thinkTool,
  getNotesFromToolCalls,
  openaiWebsearchCalled,
  anthropicWebsearchCalled
} from '@/lib/utils'
import {
  Configuration,
} from './configuration'
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  filterMessages,
  getBufferString
} from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { Command } from '@langchain/langgraph'
import { 
  ClarifyWithUser,
  SupervisorState, 
  ResearcherState, 
  ResearcherOutputState,
  ConductResearch,
  ResearchComplete,
  AgentState,
} from './state';
import { 
  researchSystemPrompt,
  compressResearchSimpleHumanMessage,
  compressResearchSystemPrompt,
  finalReportGenerationPrompt,
} from './prompts';

export type Message = {
  role: 'human' | 'ai' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  name: string
  id: string
  args: any
}

const configurableModel = initChatModel(undefined, {configurableFields: ['model', 'maxTokens', 'apiKey']});

async function clarifyWithUser(
  state: AgentState,
  config: Configuration
): Promise<Command> {
  const configurable = config
  if (!configurable.allowClarification) {
    return { goto: 'writeResearchBrief' }
  }

  const messages = state.messages || []

  const clarificationModel = (await configurableModel)
    .withStructuredOutput(ClarifyWithUser)
    .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })

  const promptContent = `Messages: ${getBufferString(messages)}\nDate: ${getTodayStr()}`

  const response = await clarificationModel.invoke(promptContent, {
    configurable: {
      model: configurable.researchModel,
      maxTokens: configurable.researchModelMaxTokens,
      apiKey: getApiKeyForModel(configurable.researchModel, config),
    }
  })

  if (response.needClarification) {
    return {
      goto: 'END',
      update: {
        messages: [
          ...messages,
          { role: 'ai', content: response.question || '' }
        ]
      }
    }
  } else {
    return {
      goto: 'writeResearchBrief',
      update: {
        messages: [
          ...messages,
          { role: 'ai', content: response.verification || '' }
        ]
      }
    }
  }
}

async function writeResearchBrief(
  state: AgentState,
  config: Configuration
): Promise<Command> {
  const configurable = config
  const messages = state.messages || []
  const prompt = `Messages: ${getBufferString(messages)}\nDate: ${getTodayStr()}`

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


async function supervisor(state: SupervisorState, config: RunnableConfig): Promise<Command> {
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
    return {
        goto: "supervisorTools",
        update: {
            supervisorMessages: [response],
            researchIterations: (state.researchIterations || 0) + 1
        }
    }
}

async function supervisorTools(state: SupervisorState, config: RunnableConfig): Promise<Command> {
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
    const noToolCalls = !mostRecentMessage.toolCalls
    const researchCompleteToolCall = mostRecentMessage.toolCalls?.some(
        toolCall => toolCall.name === "ResearchComplete"
    ) || false
    
    // Exit if any termination condition is met
    if (exceededAllowedIterations || noToolCalls || researchCompleteToolCall) {
        return {
            goto: END,
            update: {
                notes: getNotesFromToolCalls(supervisorMessages),
                researchBrief: state.researchBrief || ""
            }
        }
    }
    
    // Step 2: Process all tool calls together (both thinkTool and ConductResearch)
    const allToolMessages: ToolMessage[] = []
    const updatePayload: any = { supervisorMessages: [] }
    
    // Handle thinkTool calls (strategic reflection)
    const thinkToolCalls = mostRecentMessage.toolCalls?.filter(
        toolCall => toolCall.name === "thinkTool"
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
    const conductResearchCalls = mostRecentMessage.toolCalls?.filter(
        toolCall => toolCall.name === "ConductResearch"
    ) || []
    
    if (conductResearchCalls.length > 0) {
        try {
            // Limit concurrent research units to prevent resource exhaustion
            const allowedConductResearchCalls = conductResearchCalls.slice(0, configurable.maxConcurrentResearchUnits)
            const overflowConductResearchCalls = conductResearchCalls.slice(configurable.maxConcurrentResearchUnits)
            
            // Execute research tasks in parallel
            const researchTasks = allowedConductResearchCalls.map(toolCall =>
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
                return {
                    goto: END,
                    update: {
                        notes: getNotesFromToolCalls(supervisorMessages),
                        researchBrief: state.researchBrief || ""
                    }
                }
            }
        }
    }
    
    // Step 3: Return command with all tool results
    updatePayload.supervisorMessages = allToolMessages
    return {
        goto: "supervisor",
        update: updatePayload
    }
}

// Supervisor Subgraph Construction
// Creates the supervisor workflow that manages research delegation and coordination
const supervisorBuilder = new StateGraph(SupervisorState, Configuration.getSchema())

// Add supervisor nodes for research management
supervisorBuilder.addNode("supervisor", supervisor, { ends: ["supervisorTools"] })  // Main supervisor logic
supervisorBuilder.addNode("supervisorTools", supervisorTools)                       // Tool execution handler

// Define supervisor workflow edges
supervisorBuilder.addEdge(START, "supervisor")                                      // Entry point to supervisor

// Compile supervisor subgraph for use in main workflow
const supervisorSubgraph = supervisorBuilder.compile()

async function researcher(state: ResearcherState, config: RunnableConfig): Promise<Command> {
    /**
     * Individual researcher that conducts focused research on specific topics.
     * 
     * This researcher is given a specific research topic by the supervisor and uses
     * available tools (search, thinkTool, MCP tools) to gather comprehensive information.
     * It can use thinkTool for strategic planning between searches.
     * 
     * Args:
     *     state: Current researcher state with messages and topic context
     *     config: Runtime configuration with model settings and tool availability
     *     
     * Returns:
     *     Command to proceed to researcherTools for tool execution
     */
    // Step 1: Load configuration and validate tool availability
    const configurable = Configuration.fromRunnableConfig(config)
    const researcherMessages = state.researcherMessages || []
    
    // Get all available research tools (search, MCP, thinkTool)
    const tools = await getAllTools(config)
    if (tools.length === 0) {
        throw new Error(
            "No tools found to conduct research: Please configure either your " +
            "search API or add MCP tools to your configuration."
        )
    }
    
    // Step 2: Configure the researcher model with tools
    const researchModelConfig = {
        model: configurable.researchModel,
        maxTokens: configurable.researchModelMaxTokens,
        apiKey: getApiKeyForModel(configurable.researchModel, config),
        tags: ["langsmith:nostream"]
    }
    
    // Prepare system prompt with MCP context if available
    const researcherPrompt = researchSystemPrompt.replace(
        "{mcp_prompt}", configurable.mcpPrompt || ""
    ).replace("{date}", getTodayStr())
    
    // Configure model with tools, retry logic, and settings
    const researchModel = (await configurableModel)
        .bindTools(tools)
        .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })
        .withConfig(researchModelConfig)
    
    // Step 3: Generate researcher response with system context
    const messages = [new SystemMessage({ content: researcherPrompt }), ...researcherMessages]
    const response = await researchModel.invoke(messages)
    
    // Step 4: Update state and proceed to tool execution
    return {
        goto: "researcherTools",
        update: {
            researcherMessages: [response],
            toolCallIterations: (state.toolCallIterations || 0) + 1
        }
    }
}

// Tool Execution Helper Function
async function executeToolSafely(tool: any, args: any, config: RunnableConfig): Promise<string> {
    /**
     * Safely execute a tool with error handling.
     */
    try {
        return await tool.invoke(args, config)
    } catch (e: any) {
        return `Error executing tool: ${e.toString()}`
    }
}


async function researcherTools(state: ResearcherState, config: RunnableConfig): Promise<Command> {
    /**
     * Execute tools called by the researcher, including search tools and strategic thinking.
     * 
     * This function handles various types of researcher tool calls:
     * 1. thinkTool - Strategic reflection that continues the research conversation
     * 2. Search tools (tavilySearch, webSearch) - Information gathering
     * 3. MCP tools - External tool integrations
     * 4. ResearchComplete - Signals completion of individual research task
     * 
     * Args:
     *     state: Current researcher state with messages and iteration count
     *     config: Runtime configuration with research limits and tool settings
     *     
     * Returns:
     *     Command to either continue research loop or proceed to compression
     */
    // Step 1: Extract current state and check early exit conditions
    const configurable = Configuration.fromRunnableConfig(config)
    const researcherMessages = state.researcherMessages || []
    const mostRecentMessage = researcherMessages[researcherMessages.length - 1]
    
    // Early exit if no tool calls were made (including native web search)
    const hasToolCalls = Boolean(mostRecentMessage.toolCalls)
    const hasNativeSearch = (
        openaiWebsearchCalled(mostRecentMessage) || 
        anthropicWebsearchCalled(mostRecentMessage)
    )
    
    if (!hasToolCalls && !hasNativeSearch) {
        return { goto: "compressResearch" }
    }
    
    // Step 2: Handle other tool calls (search, MCP tools, etc.)
    const tools = await getAllTools({ config })
    const toolsByName: { [key: string]: any } = {}
    for (const tool of tools) {
        const name = tool.name || tool.name || "webSearch"
        toolsByName[name] = tool
    }
    
    // Execute all tool calls in parallel
    const toolCalls = mostRecentMessage.toolCalls || []
    const toolExecutionTasks = toolCalls.map(toolCall =>
        executeToolSafely(toolsByName[toolCall.name], toolCall.args, config)
    )
    const observations = await Promise.all(toolExecutionTasks)
    
    // Create tool messages from execution results
    const toolOutputs = observations.map((observation, index) => {
        const toolCall = toolCalls[index]
        return new ToolMessage({
            content: observation,
            name: toolCall.name,
            tool_call_id: toolCall.id
        })
    })
    
    // Step 3: Check late exit conditions (after processing tools)
    const exceededIterations = (state.toolCallIterations || 0) >= configurable.maxReactToolCalls
    const researchCompleteCalled = toolCalls.some(
        toolCall => toolCall.name === "ResearchComplete"
    )
    
    if (exceededIterations || researchCompleteCalled) {
        // End research and proceed to compression
        return {
            goto: "compressResearch",
            update: { researcherMessages: toolOutputs }
        }
    }
    
    // Continue research loop with tool results
    return {
        goto: "researcher",
        update: { researcherMessages: toolOutputs }
    }
}

async function compressResearch(state: ResearcherState, config: RunnableConfig): Promise<{ compressedResearch: string; rawNotes: string[] }> {
    /**
     * Compress and synthesize research findings into a concise, structured summary.
     * 
     * This function takes all the research findings, tool outputs, and AI messages from
     * a researcher's work and distills them into a clean, comprehensive summary while
     * preserving all important information and findings.
     * 
     * Args:
     *     state: Current researcher state with accumulated research messages
     *     config: Runtime configuration with compression model settings
     *     
     * Returns:
     *     Dictionary containing compressed research summary and raw notes
     */
    // Step 1: Configure the compression model
    const configurable = Configuration.fromRunnableConfig(config)
    const synthesizerModel = (await configurableModel).withConfig({
        model: configurable.compressionModel,
        maxTokens: configurable.compressionModelMaxTokens,
        apiKey: getApiKeyForModel(configurable.compressionModel, config),
        tags: ["langsmith:nostream"]
    })
    
    // Step 2: Prepare messages for compression
    let researcherMessages = state.researcherMessages || []
    
    // Add instruction to switch from research mode to compression mode
    researcherMessages.push(new HumanMessage({ content: compressResearchSimpleHumanMessage }))
    
    // Step 3: Attempt compression with retry logic for token limit issues
    let synthesisAttempts = 0
    const maxAttempts = 3
    
    while (synthesisAttempts < maxAttempts) {
        try {
            // Create system prompt focused on compression task
            const compressionPrompt = compressResearchSystemPrompt.replace("{date}", getTodayStr())
            const messages = [new SystemMessage({ content: compressionPrompt }), ...researcherMessages]
            
            // Execute compression
            const response = await synthesizerModel.invoke(messages)
            
            // Extract raw notes from all tool and AI messages
            const rawNotesContent = filterMessages(researcherMessages, { includeTypes: ["tool", "ai"] })
                .map(message => message.content.toString())
                .join("\n")
            
            // Return successful compression result
            return {
                compressedResearch: response.content.toString(),
                rawNotes: [rawNotesContent]
            }
            
        } catch (e: any) {
            synthesisAttempts++
            
            // Handle token limit exceeded by removing older messages
            if (isTokenLimitExceeded(e, configurable.researchModel)) {
                researcherMessages = removeUpToLastAIMessage(researcherMessages)
                continue
            }
            
            // For other errors, continue retrying
            continue
        }
    }
    
    // Step 4: Return error result if all attempts failed
    const rawNotesContent = filterMessages(researcherMessages, { includeTypes: ["tool", "ai"] })
        .map(message => message.content.toString())
        .join("\n")
    
    return {
        compressedResearch: "Error synthesizing research report: Maximum retries exceeded",
        rawNotes: [rawNotesContent]
    }
}

// Researcher Subgraph Construction
// Creates individual researcher workflow for conducting focused research on specific topics
const researcherBuilder = new StateGraph(
    ResearcherState, ResearcherOutputState
)

// Add researcher nodes for research execution and compression
researcherBuilder.addNode("researcher", researcher, { ends: ['researcherTools'] })                 // Main researcher logic
researcherBuilder.addNode("researcherTools", researcherTools, { ends: ['researcher', 'compressResearch'] })     // Tool execution handler
researcherBuilder.addNode("compressResearch", compressResearch)   // Research compression

// Define researcher workflow edges
researcherBuilder.addEdge(START, "researcher")           // Entry point to researcher
researcherBuilder.addEdge("compressResearch", END)      // Exit point after compression

// Compile researcher subgraph for parallel execution by supervisor
const researcherSubgraph = researcherBuilder.compile()

async function finalReportGeneration(state: AgentState, config: RunnableConfig): Promise<{ finalReport: string; messages: AIMessage[]; notes: { type: string; value: any[] } }> {
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
            const finalReportPrompt = finalReportGenerationPrompt
                .replace("{research_brief}", state.researchBrief || "")
                .replace("{messages}", getBufferString(state.messages || []))
                .replace("{findings}", findings)
                .replace("{date}", getTodayStr())
            
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


const deepResearcherBuilder = new StateGraph(AgentState, Configuration.getSchema())

deepResearcherBuilder.addNode('clarifyWithUser', clarifyWithUser)              // User clarification phase
deepResearcherBuilder.addNode('writeResearchBrief', writeResearchBrief)        // Research planning phase
deepResearcherBuilder.addNode('researchSupervisor', supervisorSubgraph)        // Research execution phase
deepResearcherBuilder.addNode("finalReportGeneration", finalReportGeneration)  // Report generation phase

deepResearcherBuilder.addEdge(START, 'clarifyWithUser')                          // Entry point
deepResearcherBuilder.addEdge('researchSupervisor', 'finalReportGeneration')     // Research to report
deepResearcherBuilder.addEdge('finalReportGeneration', END)                      // Final exit point


export { deepResearcherBuilder as deepResearcher }
