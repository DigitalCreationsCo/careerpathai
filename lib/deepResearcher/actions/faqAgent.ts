import { Command } from "@langchain/langgraph"
import { configurableModel, Configuration, RunnableConfig } from "../configuration"
import { AgentState } from "../state"
import { createMessageFromMessageType, getApiKeyForModel, getTodayStr } from "../llmUtils"
import { AIMessage, filterMessages, getBufferString } from "@langchain/core/messages";
import { buildFAQPrompt } from "../prompts";

export async function faqAgent(
    state: AgentState,
    config: RunnableConfig
) {

    const configurable = Configuration.fromRunnableConfig(config);
    const messages = state.messages || [];

    const lastUserMessage = filterMessages(messages, { includeTypes: ["human"] });
    
    if (!lastUserMessage) {
        console.log('No user question found, ending FAQ');
        return {};
    }

    const userQuestion = getBufferString(lastUserMessage);
    
    // Build context-aware prompt
    const faqPrompt = buildFAQPrompt(
        userQuestion,
        state.researchBrief || "",
        state.reportPreview || "",
        getTodayStr()
    );

    const faqModelConfig = {
        model: configurable.researchModel,
        maxTokens: configurable.researchModelMaxTokens,
        apiKey: getApiKeyForModel(configurable.researchModel, config),
    };

    const faqModel = (await configurableModel)
        .withRetry({ stopAfterAttempt: configurable.maxStructuredOutputRetries })
        .withConfig(faqModelConfig);

    try {
        const response = await faqModel.invoke([
            createMessageFromMessageType("system", faqPrompt),
            createMessageFromMessageType("human", userQuestion)
        ]) as AIMessage;

        return new Command ({
            update: {
                messages: [response]
            }
        });

    } catch (error) {
        return new Command({
            update: {
                messages: [
                    createMessageFromMessageType(
                        "ai",
                        "I apologize, but I encountered an error processing your question. Could you please rephrase it?"
                    )
                ]
            }
        });
    }
}