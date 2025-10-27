import {
  removeUpToLastAIMessage,
} from '@/lib/utils'
import {
  getTodayStr,
  getApiKeyForModel,
  getAllTools,
  openaiWebsearchCalled,
  anthropicWebsearchCalled,
  isTokenLimitExceeded,
} from '@/lib/deepResearcher/llmUtils'
import {
    configurableModel,
  Configuration,
} from '../configuration'
import {
    HumanMessage,
  SystemMessage,
  ToolMessage,
  filterMessages
} from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { Command } from '@langchain/langgraph'
import { 
  ResearcherState, 
} from '../state';
import { 
    compressResearchSimpleHumanMessage,
    compressResearchSystemPrompt,
  researchSystemPrompt,
} from '../prompts';
import { executeToolSafely } from '../toolsUtils'

export async function researcher(state: ResearcherState, config: RunnableConfig): Promise<Command> {
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
    const researcherPrompt = researchSystemPrompt(configurable.mcpPrompt || "", getTodayStr())
    
    // Configure model with tools, retry logic, and settings
    const researchModel = (await configurableModel)
        .bindTools(tools)
        .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })
        .withConfig(researchModelConfig)
    
    // Step 3: Generate researcher response with system context
    const messages = [new SystemMessage({ content: researcherPrompt }), ...researcherMessages]
    const response = await researchModel.invoke(messages)
    
    // Step 4: Update state and proceed to tool execution
    return new Command({
        goto: "researcherTools",
        update: {
            researcherMessages: [response],
            toolCallIterations: (state.toolCallIterations || 0) + 1
        }
    });
}

export async function researcherTools(state: ResearcherState, config: RunnableConfig): Promise<Command> {
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
        return new Command({ goto: "compressResearch" });
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
    const toolExecutionTasks = toolCalls.map((toolCall: any) =>
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
        (toolCall: any) => toolCall.name === "ResearchComplete"
    )
    
    if (exceededIterations || researchCompleteCalled) {
        // End research and proceed to compression
        return new Command({
            goto: "compressResearch",
            update: { researcherMessages: toolOutputs }
        });
    }
    
    // Continue research loop with tool results
    return new Command({
        goto: "researcher",
        update: { researcherMessages: toolOutputs }
    });
}

export async function compressResearch(state: ResearcherState, config: RunnableConfig): Promise<Command> {
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
    researcherMessages.push(new HumanMessage({ content: compressResearchSimpleHumanMessage() }))
    
    // Step 3: Attempt compression with retry logic for token limit issues
    let synthesisAttempts = 0
    const maxAttempts = 3
    
    while (synthesisAttempts < maxAttempts) {
        try {
            // Create system prompt focused on compression task
            const compressionPrompt = compressResearchSystemPrompt(getTodayStr());
            const messages = [new SystemMessage({ content: compressionPrompt }), ...researcherMessages]
            
            // Execute compression
            const response = await synthesizerModel.invoke(messages)
            
            // Extract raw notes from all tool and AI messages
            const rawNotesContent = filterMessages(researcherMessages as any, { includeTypes: ["tool", "ai"] })
                .map(message => message.content.toString())
                .join("\n")
            
            // Return successful compression result
            return new Command ({
                update: {
                    compressedResearch: response.content.toString(),
                    rawNotes: [rawNotesContent]
                }
            });
        } catch (e: any) {
            synthesisAttempts++
            
            // Handle token limit exceeded by removing older messages
            if (isTokenLimitExceeded(e, configurable.researchModel)) {
                researcherMessages = removeUpToLastAIMessage(researcherMessages as any)
                continue
            }
            
            // For other errors, continue retrying
            continue
        }
    }
    
    // Step 4: Return error result if all attempts failed
    const rawNotesContent = filterMessages(researcherMessages as any, { includeTypes: ["tool", "ai"] })
        .map(message => message.content.toString())
        .join("\n")
    
    return new Command({
        update: {
            compressedResearch: "Error synthesizing research report: Maximum retries exceeded",
            rawNotes: [rawNotesContent]
        }
    });
}