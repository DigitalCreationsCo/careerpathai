import { Command } from "@langchain/langgraph";
import { configurableModel, Configuration, RunnableConfig } from "../configuration";
import { AgentState } from "../state";
import { createMessageFromMessageType, getApiKeyForModel, getTodayStr } from "../llmUtils";
import { AIMessage, getBufferString } from "@langchain/core/messages";
import { buildFAQPrompt } from "../prompts";

export async function faqAgent(
  state: AgentState,
  config: RunnableConfig
) {
  const configurable = Configuration.fromRunnableConfig(config);
  const messages = state.messages || [];

  // If the last message is not from the user, do nothing (await user input)
  if (messages.length === 0 || messages[messages.length - 1]?.type !== "human") {
    // Awaiting a new user question
    return new Command({});
  }

  // Get the last user ("human") message as the FAQ question
  const lastUserMessage = messages[messages.length - 1];
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

    // Update with response and stay in this node
    return new Command({
      update: {
        messages: [response]
      }
      // no 'goto' = remain in 'faqAgent'
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