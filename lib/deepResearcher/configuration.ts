// import { initChatModel } from "@/lib/deepResearcher/initChatModel";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { camelCaseToUpperCaseSnakeCase } from "../utils";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface RunnableConfig {
  configurable?: Record<string, any>;
}

export class Configuration {
  // General Configuration
  maxStructuredOutputRetries = 3;
  allowClarification = true;
  maxConcurrentResearchUnits = 5;

  // Research Configuration
  searchApi: SearchApi = SearchApi.Tavily;
  maxResearcherIterations = 6;
  maxReactToolCalls = 10;

  // Model Configuration
  summarizationModel = "openai:gpt-4.1-mini";
  summarizationModelMaxTokens = 8192;
  maxContentLength = 50000;
  researchModel = "openai:gpt-4.1";
  researchModelMaxTokens = 10000;
  compressionModel = "openai:gpt-4.1";
  compressionModelMaxTokens = 8192;
  finalReportModel = "openai:gpt-4.1";
  finalReportModelMaxTokens = 10000;

  // MCP server configuration
  mcpConfig?: McpConfig | null;
  mcpPrompt?: string | null;

  constructor(data?: Partial<Configuration>) {
    Object.assign(this, data);
  }

  static fromRunnableConfig(config?: RunnableConfig): Configuration {
    const configurable = config?.configurable ?? {};
    const env = process.env;
    const envFieldNames = Object.keys(new Configuration()).map(camelCaseToUpperCaseSnakeCase);

    const values: Record<string, any> = {};
    for (const fieldName of envFieldNames) {
      const envValue = env[fieldName];
      const confValue = configurable[fieldName];
      if (envValue !== undefined) values[fieldName] = envValue;
      else if (confValue !== undefined) values[fieldName] = confValue;
    }

    return new Configuration(values);
  }

  static getSchema() {
    return z.object({
      maxStructuredOutputRetries: z.number().default(3),
      allowClarification: z.boolean().default(true),
      maxConcurrentResearchUnits: z.number().default(5),
      searchApi: z.string().default("Tavily"),
      maxResearcherIterations: z.number().default(6),
      maxReactToolCalls: z.number().default(10),
      summarizationModel: z.string().default("openai:gpt-4.1-mini"),
      summarizationModelMaxTokens: z.number().default(8192),
      maxContentLength: z.number().default(50000),
      researchModel: z.string().default("openai:gpt-4.1"),
      researchModelMaxTokens: z.number().default(10000),
      compressionModel: z.string().default("openai:gpt-4.1"),
      compressionModelMaxTokens: z.number().default(8192),
      finalReportModel: z.string().default("openai:gpt-4.1"),
      finalReportModelMaxTokens: z.number().default(10000),
      mcpConfig: z.any().optional().nullable(),
      mcpPrompt: z.string().optional().nullable(),
    });
  }
}

/**
 * ModelSelector - Lazy model factory that supports LangChain methods
 */
class ModelSelector {
  private structuredOutputSchema?: any;
  private retryConfig?: any;
  private additionalConfig?: any;

  withStructuredOutput(schema: any) {
    const newSelector = new ModelSelector();
    newSelector.structuredOutputSchema = schema;
    newSelector.retryConfig = this.retryConfig;
    newSelector.additionalConfig = this.additionalConfig;
    return newSelector;
  }

  withRetry(config: any) {
    const newSelector = new ModelSelector();
    newSelector.structuredOutputSchema = this.structuredOutputSchema;
    newSelector.retryConfig = config;
    newSelector.additionalConfig = this.additionalConfig;
    return newSelector;
  }

  withConfig(config: any) {
    const newSelector = new ModelSelector();
    newSelector.structuredOutputSchema = this.structuredOutputSchema;
    newSelector.retryConfig = this.retryConfig;
    newSelector.additionalConfig = { ...this.additionalConfig, ...config };
    return newSelector;
  }

  /**
   * Create the actual model instance based on runtime config
   */
  private createModelInstance(runtimeConfig: RunnableConfig): BaseChatModel {
    const config = runtimeConfig.configurable || {};
    const modelName = config.model;
    const apiKey = config.apiKey;
    const maxTokens = config.maxTokens || 2048;

    if (!modelName) {
      throw new Error('Model name must be provided in configurable.model');
    }

    console.log('Creating model instance:', { modelName, hasApiKey: !!apiKey, maxTokens });

    let model: BaseChatModel;

    if (modelName.toLowerCase().includes('gemini')) {
      const cleanModel = modelName.replace(/^(google:|gemini:)/, '');
      model = new ChatGoogleGenerativeAI({
        apiKey: apiKey || process.env.GOOGLE_API_KEY,
        model: cleanModel,
        maxOutputTokens: maxTokens,
      });
    }
    else if (modelName.startsWith('openai:') || modelName.startsWith('gpt-')) {
      const cleanModel = modelName.replace('openai:', '');
      model = new ChatOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
        modelName: cleanModel,
        maxTokens,
      });
    }
    else if (modelName.startsWith('anthropic:') || modelName.startsWith('claude-')) {
      const cleanModel = modelName.replace('anthropic:', '');
      model = new ChatAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        modelName: cleanModel,
        maxTokens,
      });
    }
    else {
      throw new Error(`Unsupported model: ${modelName}`);
    }

    if (this.structuredOutputSchema) {
      model = model.withStructuredOutput(this.structuredOutputSchema) as any;
    }

    if (this.retryConfig) {
      model = model.withRetry(this.retryConfig) as any;
    }

    if (this.additionalConfig) {
      model = model.withConfig(this.additionalConfig) as any;
    }

    return model;
  }

  /**
   * Invoke the model with runtime config
   */
  async invoke(input: any, config?: RunnableConfig) {
    const model = this.createModelInstance(config || {});
    return await model.invoke(input, config);
  }

  /**
   * Stream the model with runtime config
   */
  async stream(input: any, config?: RunnableConfig) {
    const model = this.createModelInstance(config || {});
    return await model.stream(input, config);
  }

  /**
   * Batch invoke
   */
  async batch(inputs: any[], config?: RunnableConfig) {
    const model = this.createModelInstance(config || {});
    return await model.batch(inputs, config);
  }
}

/**
 * Export singleton model selector
 */
export const configurableModel = new ModelSelector();

export enum SearchApi {
  Anthropic = "anthropic",
  Openai = "openai",
  Tavily = "tavily",
  None = "none",
}

export class McpConfig {
  url?: string;
  tools?: string[];
  authRequired?: boolean;

  constructor(data?: Partial<McpConfig>) {
    this.url = data?.url ?? null;
    this.tools = data?.tools ?? null;
    this.authRequired = data?.authRequired ?? false;
  }
}