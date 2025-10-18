import { RunnableConfig } from "./configuration"

// Tool Execution Helper Function
export async function executeToolSafely(tool: any, args: any, config: RunnableConfig): Promise<string> {
    /**
     * Safely execute a tool with error handling.
     */
    try {
        return await tool.invoke(args, config)
    } catch (e: any) {
        return `Error executing tool: ${e.toString()}`
    }
}