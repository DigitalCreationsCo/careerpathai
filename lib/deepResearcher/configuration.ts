// import { initChatModel } from "@/lib/deepResearcher/initChatModel";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { camelCaseToUpperCaseSnakeCase } from "../utils";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { MODEL_TOKEN_LIMITS } from "./llmUtils";

export interface RunnableConfig {
  configurable?: Record<string, any>;
}

function parseValue(key: string, value: any) {
  // Provide type conversions for boolean/numbers from env
  if (
    [
      "allowClarification",
      "authRequired",
      "maxConcurrentResearchUnits",
      "maxStructuredOutputRetries",
      "maxResearcherIterations",
      "maxReactToolCalls",
      "summarizationModelMaxTokens",
      "maxContentLength",
      "researchModelMaxTokens",
      "compressionModelMaxTokens",
      "finalReportModelMaxTokens",
    ].some((field) => field.toUpperCase() === key.toUpperCase() || field === key)
  ) {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    if (!isNaN(Number(value)) && typeof value !== "boolean") return Number(value);
  }
  return value;
}

function getDefaultModelTokenLimitByFullMatch(modelKey: string, fallback: number): number {
  if (!modelKey) return fallback;
  let key = modelKey;
  if (key.startsWith("openai:")) key = key.replace(/^openai:/, "");
  if (key.startsWith("anthropic:")) key = key.replace(/^anthropic:/, "");
  if (key.startsWith("google:")) key = key.replace(/^google:/, "");
  // Prefer full match only
  if (MODEL_TOKEN_LIMITS && MODEL_TOKEN_LIMITS[key] !== undefined) {
    return MODEL_TOKEN_LIMITS[key];
  }
  return fallback;
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
  summarizationModelMaxTokens: number;
  maxContentLength = 50000;
  researchModel = "openai:gpt-4.1";
  researchModelMaxTokens: number;
  compressionModel = "openai:gpt-4.1";
  compressionModelMaxTokens: number;
  finalReportModel = "openai:gpt-4.1";
  finalReportModelMaxTokens: number;

  // MCP server configuration
  mcpConfig?: McpConfig | null;
  mcpPrompt?: string | null;

  // ----
  /**
   * Accepts various sources and merges using correct precedence:
   * 1. ENV (UPPER_SNAKE) overrides
   * 2. data (camelCase, e.g. from config/configurable)
   *
   * Numbers are converted, booleans parsed.
   */
  constructor(data?: Partial<Configuration>) {
    // 1st: start with all defaults (already in property definitions except *_MaxTokens, set below)
    // Set model fields first if given in data
    if (data?.summarizationModel) this.summarizationModel = data.summarizationModel;
    if (data?.researchModel) this.researchModel = data.researchModel;
    if (data?.compressionModel) this.compressionModel = data.compressionModel;
    if (data?.finalReportModel) this.finalReportModel = data.finalReportModel;

    // Env (resolve early so can be used below)
    const env = process?.env || {};

    // Helper for reading env, then fallback to full match for each token limit
    const resolveLimit = (envKey: string, modelKey: string, fallback: number) => {
      if (env[envKey] !== undefined) return parseValue(envKey, env[envKey]);
      return getDefaultModelTokenLimitByFullMatch(modelKey, fallback);
    };
    this.summarizationModelMaxTokens = resolveLimit("SUMMARIZATION_MODEL_MAX_TOKENS", this.summarizationModel, 8192);
    this.researchModelMaxTokens = resolveLimit("RESEARCH_MODEL_MAX_TOKENS", this.researchModel, 10000);
    this.compressionModelMaxTokens = resolveLimit("COMPRESSION_MODEL_MAX_TOKENS", this.compressionModel, 8192);
    this.finalReportModelMaxTokens = resolveLimit("FINAL_REPORT_MODEL_MAX_TOKENS", this.finalReportModel, 10000);

    // Overlay config for all other fields including user data, EXCEPT special-cased fields above
    if (data && typeof data === "object") {
      for (const key in data) {
        if (data[key as keyof Configuration] !== undefined && ![
          "summarizationModelMaxTokens",
          "researchModelMaxTokens",
          "compressionModelMaxTokens",
          "finalReportModelMaxTokens",
          "summarizationModel",
          "researchModel",
          "compressionModel",
          "finalReportModel"
        ].includes(key)
        ) {
          (this as any)[key] = data[key as keyof Configuration];
        }
      }
    }
    // 3rd: overlay environment (UPPERCASE_SNAKE overrides everything)
    for (const k in this) {
      if (!Object.prototype.hasOwnProperty.call(this, k)) continue;
      const envKey = camelCaseToUpperCaseSnakeCase(k);
      if (
        envKey in env && env[envKey] !== undefined &&
        !["SUMMARIZATION_MODEL_MAX_TOKENS", "RESEARCH_MODEL_MAX_TOKENS", "COMPRESSION_MODEL_MAX_TOKENS", "FINAL_REPORT_MODEL_MAX_TOKENS"].includes(envKey)
      ) {
        (this as any)[k] = parseValue(k, env[envKey]);
      }
    }
    // Overlay final token fields from env (again so env always wins)
    if (env["SUMMARIZATION_MODEL_MAX_TOKENS"] !== undefined) {
      this.summarizationModelMaxTokens = parseValue("summarizationModelMaxTokens", env["SUMMARIZATION_MODEL_MAX_TOKENS"]);
    }
    if (env["RESEARCH_MODEL_MAX_TOKENS"] !== undefined) {
      this.researchModelMaxTokens = parseValue("researchModelMaxTokens", env["RESEARCH_MODEL_MAX_TOKENS"]);
    }
    if (env["COMPRESSION_MODEL_MAX_TOKENS"] !== undefined) {
      this.compressionModelMaxTokens = parseValue("compressionModelMaxTokens", env["COMPRESSION_MODEL_MAX_TOKENS"]);
    }
    if (env["FINAL_REPORT_MODEL_MAX_TOKENS"] !== undefined) {
      this.finalReportModelMaxTokens = parseValue("finalReportModelMaxTokens", env["FINAL_REPORT_MODEL_MAX_TOKENS"]);
    }
  }

  static fromRunnableConfig(config?: RunnableConfig): Configuration {
    const configurable = config?.configurable ?? {};
    const env = process.env;
    // Build list of *instance* keys (not just for new Configuration() defaults) to allow custom fields too
    const instance = new Configuration();
    const fieldNames = Object.keys(instance);

    const values: Record<string, any> = {};
    // To allow proper token limit resolution, specially assign models first if present
    if (configurable.summarizationModel) values.summarizationModel = configurable.summarizationModel;
    if (configurable.researchModel) values.researchModel = configurable.researchModel;
    if (configurable.compressionModel) values.compressionModel = configurable.compressionModel;
    if (configurable.finalReportModel) values.finalReportModel = configurable.finalReportModel;
    // Continue as before
    for (const fieldName of fieldNames) {
      if ([
        "summarizationModelMaxTokens",
        "researchModelMaxTokens",
        "compressionModelMaxTokens",
        "finalReportModelMaxTokens"
      ].includes(fieldName)) {
        // token limits will be resolved in the Configuration constructor
        continue;
      }
      // Try getting UPPER_SNAKE from env first, Then camelCase from configurable, else leave default.
      const envField = camelCaseToUpperCaseSnakeCase(fieldName);
      let set = false;
      if (envField in env && env[envField] !== undefined) {
        values[fieldName] = parseValue(fieldName, env[envField]);
        set = true;
      }
      if (!set && fieldName in configurable && configurable[fieldName] !== undefined) {
        values[fieldName] = configurable[fieldName];
      }
    }
    return new Configuration(values);
  }

  static getSchema() {
    // For the token limits, use a static default; runtime will select from env/MODEL_TOKEN_LIMITS.
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
 * ModelSelector - Extended to merge and use configs from multiple sources
 *
 * This version accumulates configurations set with withConfig, withStructuredOutput,
 * withRetry, as well as arguments to invoke/stream/batch in any order. Parameters
 * provided to invoke/stream/batch override those from withConfig, and all are merged
 * for the underlying model initialization.
 */
class ModelSelector {
  private structuredOutputSchema?: any;
  private retryConfig?: any;
  private additionalConfig?: Record<string, any>;
  private toolsBinding?: any;

  constructor(
    structuredOutputSchema?: any,
    retryConfig?: any,
    additionalConfig?: Record<string, any>,
    toolsBinding?: any
  ) {
    this.structuredOutputSchema = structuredOutputSchema;
    this.retryConfig = retryConfig;
    this.additionalConfig = additionalConfig;
    this.toolsBinding = toolsBinding;
  }

  withStructuredOutput(schema: any) {
    return new ModelSelector(
      schema,
      this.retryConfig,
      this.additionalConfig,
      this.toolsBinding
    );
  }

  withRetry(config: any) {
    return new ModelSelector(
      this.structuredOutputSchema,
      config,
      this.additionalConfig,
      this.toolsBinding
    );
  }

  withConfig(config: Record<string, any>) {
    return new ModelSelector(
      this.structuredOutputSchema,
      this.retryConfig,
      { ...this.additionalConfig, ...config },
      this.toolsBinding
    );
  }

  /**
   * Binds tools to the model, which will be attached when the model instance is created.
   * Returns the new ModelSelector instance with tools bound.
   */
  bindTools(tools: any) {
    return new ModelSelector(
      this.structuredOutputSchema,
      this.retryConfig,
      this.additionalConfig,
      tools
    );
  }

  /**
   * Internal utility to merge configs in the correct precedence order:
   * - callerConfig overrides this.additionalConfig (those from withConfig chain)
   * - both override any default (empty)
   */
  private mergeConfigs(callerConfig?: RunnableConfig | Record<string, any>): Record<string, any> {
    let callerCfg: Record<string, any> = {};
    if (callerConfig && "configurable" in callerConfig && callerConfig.configurable) {
      callerCfg = { ...callerConfig.configurable };
    } else if (callerConfig) {
      callerCfg = { ...callerConfig };
    }
    return { ...(this.additionalConfig || {}), ...callerCfg };
  }

  /**
   * Build the actual LangChain chat model instance, merging all configuration sources.
   * The config argument may be a RunnableConfig or a plain object, both are supported.
   */
  private createModelInstance(callerConfig?: RunnableConfig | Record<string, any>): BaseChatModel {
    const resolvedConfig = this.mergeConfigs(callerConfig);

    const modelName = resolvedConfig.model;
    const apiKey = resolvedConfig.apiKey;

    // Model token limit logic: select the best source of truth for maxTokens/maxOutputTokens
    let maxTokens: number | undefined = resolvedConfig.maxTokens;
    if (!maxTokens) {
      maxTokens = getDefaultModelTokenLimitByFullMatch(modelName, 2048);
    }

    if (!modelName) {
      throw new Error('Model name must be provided in the config');
    }

    console.log('Creating model instance:', { modelName, hasApiKey: !!apiKey, maxTokens });

    let model: BaseChatModel;

    if (modelName.toLowerCase().includes('gemini')) {
      const cleanModel = modelName.replace(/^(google:|gemini:)/, '');
      model = new ChatGoogleGenerativeAI({
        apiKey: apiKey || process.env.GOOGLE_API_KEY,
        model: cleanModel,
        maxOutputTokens: maxTokens,
        ...(resolvedConfig.tags ? { tags: resolvedConfig.tags } : {})
      });
    }
    else if (modelName.startsWith('openai:') || modelName.startsWith('gpt-')) {
      const cleanModel = modelName.replace('openai:', '');
      model = new ChatOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
        modelName: cleanModel,
        maxTokens,
        ...(resolvedConfig.tags ? { tags: resolvedConfig.tags } : {})
      });
    }
    else if (modelName.startsWith('anthropic:') || modelName.startsWith('claude-')) {
      const cleanModel = modelName.replace('anthropic:', '');
      model = new ChatAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        modelName: cleanModel,
        maxTokens,
        ...(resolvedConfig.tags ? { tags: resolvedConfig.tags } : {})
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

    // Bind tools if provided and model has withTools method
    if (this.toolsBinding && typeof model.bindTools === "function") {
      model = model.bindTools(this.toolsBinding) as any;
    }

    // Any other config not used above gets passed in here, except 'model', 'apiKey', 'maxTokens', 'tags'
    if (this.additionalConfig) {
      const { model: _model, apiKey: _apiKey, maxTokens: _maxTokens, tags: _tags, ...otherConfig } = this.additionalConfig;
      if (Object.keys(otherConfig).length > 0) {
        model = model.withConfig(otherConfig) as any;
      }
    }
    if (callerConfig) {
      let moreOther: Record<string, any> = {};
      if ("configurable" in callerConfig && callerConfig.configurable) {
        const { model, apiKey, maxTokens, tags, ...other } = callerConfig.configurable;
        moreOther = other;
      } else if (callerConfig) {
        const { model, apiKey, maxTokens, tags, ...other } = callerConfig as any;
        moreOther = other;
      }
      if (Object.keys(moreOther).length > 0) {
        model = model.withConfig(moreOther) as any;
      }
    }

    return model;
  }

  /**
   * Invoke the model. Accepts configuration via:
   * - chained withConfig/withRetry/withStructuredOutput/bindTools
   * - the config parameter (RunnableConfig or plain object)
   * - precedence: invoke() param > .withConfig() > defaults
   */
  async invoke(input: any, config?: RunnableConfig | Record<string, any>) {
    const model = this.createModelInstance(config);
    if (config && "configurable" in config) {
      return await model.invoke(input, config);
    } else if (config) {
      return await model.invoke(input, { configurable: config });
    }
    return await model.invoke(input);
  }

  /**
   * Stream the model, supporting the same parameter merging approach.
   */
  async stream(input: any, config?: RunnableConfig | Record<string, any>) {
    const model = this.createModelInstance(config);
    if (config && "configurable" in config) {
      return await model.stream(input, config);
    } else if (config) {
      return await model.stream(input, { configurable: config });
    }
    return await model.stream(input);
  }

  /**
   * Batch invoke, merging config sources.
   */
  async batch(inputs: any[], config?: RunnableConfig | Record<string, any>) {
    const model = this.createModelInstance(config);
    if (config && "configurable" in config) {
      return await model.batch(inputs, config);
    } else if (config) {
      return await model.batch(inputs, { configurable: config });
    }
    return await model.batch(inputs);
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
    this.url = data?.url ?? undefined;
    this.tools = data?.tools ?? undefined;
    this.authRequired = data?.authRequired ?? false;
  }
}
