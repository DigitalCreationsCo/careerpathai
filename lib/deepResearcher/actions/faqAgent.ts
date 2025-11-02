import { Command, END } from "@langchain/langgraph"
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
    
    // if (messages[messages.length - 1]?.type !== "human") {
    //     return new Command({
    //         goto: END
    //     });
    // };
    
    const lastUserMessage = messages.slice().reverse().find(msg => msg.type === "human")!;
    const userQuestion = getBufferString([lastUserMessage]);
    
    const isSellingReport = process.env.NEXT_PUBLIC_IS_REPORT_PURCHASABLE === "true";

    const faqPrompt = buildFAQPrompt(
        userQuestion,
        state.researchBrief || "",
        state.reportPreview || "",
        isSellingReport,
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
            goto: "faqAgent",
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