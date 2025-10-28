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

function getEnv(): Record<string, string | undefined> {
  return process.env as Record<string, string | undefined>;
}

/**
 * parseValue:
 * - If key related to known booleans or numbers: cast appropriately.
 * - Otherwise, return the string as is.
 */
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

export function removeVendorPrefix(modelKey: string): string {
  if (!modelKey) return modelKey;
  return modelKey.replace(/^(openai:|anthropic:|google:)/, "");
}

// Strip vendor prefix and lookup token limit, fallback to default for missing keys.
function getDefaultModelTokenLimitByFullMatch(modelKey: string, fallback: number): number {
  if (!modelKey) return fallback;
  let key = removeVendorPrefix(modelKey);
  if (MODEL_TOKEN_LIMITS && MODEL_TOKEN_LIMITS[key] !== undefined) {
    return MODEL_TOKEN_LIMITS[key];
  }
  return fallback;
}

export enum SearchApi {
  Anthropic = "anthropic",
  Openai = "openai",
  Tavily = "tavily",
  None = "none",
}

/**
 * McpConfig value object. Accepts absent or null values cleanly.
 */
export class McpConfig {
  url?: string | null;
  tools?: string[] | null;
  authRequired?: boolean;

  constructor(data?: Partial<McpConfig>) {
    this.url = data?.url ?? null;
    this.tools = data?.tools ?? null;
    this.authRequired = data?.authRequired ?? false;
  }
}

export class Configuration {
  // General Configuration
  maxStructuredOutputRetries: number = 3;
  allowClarification: boolean = true;
  maxConcurrentResearchUnits: number = 5;

  // Research Configuration
  searchApi: SearchApi = SearchApi.Tavily;
  maxResearcherIterations: number = 6;
  maxReactToolCalls: number = 10;

  // Model Configuration
  summarizationModel: string = "openai:gpt-4.1-mini";
  summarizationModelMaxTokens!: number;
  maxContentLength: number = 50000;
  researchModel: string = "openai:gpt-4.1";
  researchModelMaxTokens!: number;
  compressionModel: string = "openai:gpt-4.1";
  compressionModelMaxTokens!: number;
  finalReportModel: string = "openai:gpt-4.1";
  finalReportModelMaxTokens!: number;

  // MCP server configuration
  mcpConfig: McpConfig | null = null;
  mcpPrompt: string | null = null;

  constructor(data?: Partial<Configuration>) {
    // Start with all defaults (already set by property initializers above)
    // Step 1: Overlay passed-in (data) model fields first, since max tokens depend on them.
    if (data?.summarizationModel !== undefined)
      this.summarizationModel = data.summarizationModel;
    if (data?.researchModel !== undefined)
      this.researchModel = data.researchModel;
    if (data?.compressionModel !== undefined)
      this.compressionModel = data.compressionModel;
    if (data?.finalReportModel !== undefined)
      this.finalReportModel = data.finalReportModel;

    // Step 2: Resolve token limits using current model values (see note: order matters).
    // These are subject to override by env/data/env again below.
    const env = getEnv();

    // Read in order: ENV, config value, MODEL_TOKEN_LIMITS, fallback.
    const resolveLimit = (
      envKey: string,
      modelKey: string,
      fallback: number,
      configValue?: number
    ) => {
      if (env[envKey] !== undefined) return parseValue(envKey, env[envKey]);
      if (configValue !== undefined) return configValue;
      return getDefaultModelTokenLimitByFullMatch(modelKey, fallback);
    };

    this.summarizationModelMaxTokens = resolveLimit(
      "SUMMARIZATION_MODEL_MAX_TOKENS",
      this.summarizationModel,
      8192,
      data?.summarizationModelMaxTokens
    );
    this.researchModelMaxTokens = resolveLimit(
      "RESEARCH_MODEL_MAX_TOKENS",
      this.researchModel,
      10000,
      data?.researchModelMaxTokens
    );
    this.compressionModelMaxTokens = resolveLimit(
      "COMPRESSION_MODEL_MAX_TOKENS",
      this.compressionModel,
      8192,
      data?.compressionModelMaxTokens
    );
    this.finalReportModelMaxTokens = resolveLimit(
      "FINAL_REPORT_MODEL_MAX_TOKENS",
      this.finalReportModel,
      10000,
      data?.finalReportModelMaxTokens
    );

    // Step 3: Overlay remaining user data fields (EXCEPT for special-cased above) on top.
    if (data && typeof data === "object") {
      for (const key in data) {
        // Special case disables
        if (
          [
            "summarizationModelMaxTokens",
            "researchModelMaxTokens",
            "compressionModelMaxTokens",
            "finalReportModelMaxTokens",
            "summarizationModel",
            "researchModel",
            "compressionModel",
            "finalReportModel",
          ].includes(key)
        )
          continue;
        if (data[key as keyof Configuration] !== undefined) {
          (this as any)[key] = data[key as keyof Configuration];
        }
      }
    }

    // Step 4: Overlay ENV (UPPER_SNAKE, always wins, except for _MAX_TOKENS handled next)
    for (const k in this) {
      if (Object.prototype.hasOwnProperty.call(this, k)) {
        const envKey = camelCaseToUpperCaseSnakeCase(k);
        if (
          env[envKey] !== undefined &&
          ![
            "SUMMARIZATION_MODEL_MAX_TOKENS",
            "RESEARCH_MODEL_MAX_TOKENS",
            "COMPRESSION_MODEL_MAX_TOKENS",
            "FINAL_REPORT_MODEL_MAX_TOKENS",
          ].includes(envKey)
        ) {
          (this as any)[k] = parseValue(k, env[envKey]);
        }
      }
    }

    // Step 5: Overlay ENV on *_MAX_TOKENS fields AGAIN (so ENV always has highest precedence)
    if (env["SUMMARIZATION_MODEL_MAX_TOKENS"] !== undefined) {
      this.summarizationModelMaxTokens = parseValue(
        "summarizationModelMaxTokens",
        env["SUMMARIZATION_MODEL_MAX_TOKENS"]
      );
    }
    if (env["RESEARCH_MODEL_MAX_TOKENS"] !== undefined) {
      this.researchModelMaxTokens = parseValue(
        "researchModelMaxTokens",
        env["RESEARCH_MODEL_MAX_TOKENS"]
      );
    }
    if (env["COMPRESSION_MODEL_MAX_TOKENS"] !== undefined) {
      this.compressionModelMaxTokens = parseValue(
        "compressionModelMaxTokens",
        env["COMPRESSION_MODEL_MAX_TOKENS"]
      );
    }
    if (env["FINAL_REPORT_MODEL_MAX_TOKENS"] !== undefined) {
      this.finalReportModelMaxTokens = parseValue(
        "finalReportModelMaxTokens",
        env["FINAL_REPORT_MODEL_MAX_TOKENS"]
      );
    }
  }

  /**
   * Create a Configuration from a RunnableConfig (for chain usage, etc).
   * Precedence (lowest ⟶ highest):
   *   - (1) current property defaults
   *   - (2) withConfig() passed values (.configurable)
   *   - (3) ENV
   * For maxToken fields, their value depends on which model was resolved at the time, ENV always wins.
   */
  static fromRunnableConfig(config?: RunnableConfig): Configuration {
    const configurable = config?.configurable ?? {};
    const env = getEnv();

    // Find all field names (from instance's own keys).
    const instance = new Configuration();
    const fieldNames = Object.keys(instance);

    // Step 1: assign all available config values to values, including *MaxTokens fields.
    const values: Record<string, any> = {};
    for (const fieldName of fieldNames) {
      const envField = camelCaseToUpperCaseSnakeCase(fieldName);
      if (env[envField] !== undefined) {
        // ENV always wins
        values[fieldName] = parseValue(fieldName, env[envField]);
      } else if (configurable[fieldName] !== undefined) {
        // fallback to config if present, even for *MaxTokens
        values[fieldName] = configurable[fieldName];
      }
      // else: property default handled by Configuration constructor
    }

    // Return Configuration using all combined values
    return new Configuration(values);
  }

  static getSchema() {
    // Use static defaults to satisfy interface; runtime constructor chooses precedence!
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
      mcpPrompt: z.string().optional().nullable().default(null),
    });
  }
}

// --- ModelSelector for config passthrough and config merging -------------
export class ModelSelector {
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
      { ...(this.additionalConfig || {}), ...config },
      this.toolsBinding
    );
  }

  bindTools(tools: any) {
    return new ModelSelector(
      this.structuredOutputSchema,
      this.retryConfig,
      this.additionalConfig,
      tools
    );
  }

  /**
   * Merge configs: caller config always wins over .withConfig chain.
   */
  private mergeConfigs(callerConfig?: RunnableConfig | Record<string, any>): Record<string, any> {
    let callerCfg: Record<string, any> = {};
    if (callerConfig && typeof callerConfig === "object") {
      if ("configurable" in callerConfig && callerConfig.configurable) {
        callerCfg = { ...callerConfig.configurable };
      } else {
        callerCfg = { ...callerConfig };
      }
    }
    return { ...(this.additionalConfig || {}), ...(callerCfg || {}) };
  }

  /**
   * Determine the actual model variant and settings, and construct an LLM instance.
   */
  private createModelInstance(callerConfig?: RunnableConfig | Record<string, any>): BaseChatModel {
    const resolvedConfig = this.mergeConfigs(callerConfig);

    const modelName = resolvedConfig.model;
    const apiKey = resolvedConfig.apiKey;

    let maxTokens: number | undefined = resolvedConfig.maxTokens;
    if (!maxTokens && modelName) {
      maxTokens = getDefaultModelTokenLimitByFullMatch(modelName, 2048);
    }

    if (!modelName) {
      throw new Error("Model name must be provided in the config");
    }

    // Use direct API keys or fall back to environment keys
    let model: BaseChatModel;

    if (
      typeof modelName === "string" &&
      (modelName.startsWith("google:") ||
        modelName.startsWith("gemini:") ||
        modelName.toLowerCase().includes("gemini"))
    ) {
      const cleanModel = modelName.replace(/^(google:|gemini:)/, "");
      model = new ChatGoogleGenerativeAI({
        apiKey: apiKey || getEnv().GOOGLE_API_KEY,
        model: cleanModel,
        maxOutputTokens: maxTokens,
        ...(resolvedConfig.tags ? { tags: resolvedConfig.tags } : {}),
      });
    } else if (
      typeof modelName === "string" &&
      (modelName.startsWith("openai:") || modelName.startsWith("gpt-"))
    ) {
      const cleanModel = modelName.replace(/^openai:/, "");
      model = new ChatOpenAI({
        apiKey: apiKey || getEnv().OPENAI_API_KEY,
        modelName: cleanModel,
        maxTokens,
        ...(resolvedConfig.tags ? { tags: resolvedConfig.tags } : {}),
      });
    } else if (
      typeof modelName === "string" &&
      (modelName.startsWith("anthropic:") || modelName.startsWith("claude-"))
    ) {
      const cleanModel = modelName.replace(/^anthropic:/, "");
      model = new ChatAnthropic({
        apiKey: apiKey || getEnv().ANTHROPIC_API_KEY,
        modelName: cleanModel,
        maxTokens,
        ...(resolvedConfig.tags ? { tags: resolvedConfig.tags } : {}),
      });
    } else {
      throw new Error(`Unsupported model: ${modelName}`);
    }

    if (this.structuredOutputSchema?.shape || this.structuredOutputSchema?._def) {
      model = model.withStructuredOutput(this.structuredOutputSchema) as any;
    }
    
    if (this.retryConfig) {
      model = model.withRetry(this.retryConfig) as any;
    }

    if (
      this.toolsBinding &&
      typeof (model as any).bindTools === "function"
    ) {
      model = (model as any).bindTools(this.toolsBinding);
    }

    // Attach any other config (excluding known keys)
    if (this.additionalConfig) {
      const {
        model: _model,
        apiKey: _apiKey,
        maxTokens: _maxTokens,
        tags: _tags,
        ...other
      } = this.additionalConfig;
      if (Object.keys(other).length > 0) {
        model = (model as any).withConfig(other);
      }
    }
    if (callerConfig) {
      let extra: Record<string, any> = {};
      if (
        typeof callerConfig === "object" &&
        "configurable" in callerConfig &&
        callerConfig.configurable
      ) {
        const { model, apiKey, maxTokens, tags, ...rest } = callerConfig.configurable;
        extra = rest;
      } else if (typeof callerConfig === "object") {
        const { model, apiKey, maxTokens, tags, ...rest } = callerConfig as any;
        extra = rest;
      }
      if (Object.keys(extra).length > 0) {
        model = (model as any).withConfig(extra);
      }
    }

    return model;
  }

  async invoke(input: any, config?: RunnableConfig) {
    const model = this.createModelInstance(config);
    if (config && typeof config === "object" && "configurable" in config) {
      return await model.invoke(input, config);
    } else if (config) {
      return await model.invoke(input, { configurable: config });
    }
    return await model.invoke(input);
  }

  async stream(input: any, config?: RunnableConfig | Record<string, any>) {
    const model = this.createModelInstance(config);
    if (config && typeof config === "object" && "configurable" in config) {
      return await model.stream(input, config);
    } else if (config) {
      return await model.stream(input, { configurable: config });
    }
    return await model.stream(input);
  }

  async batch(inputs: any[], config?: RunnableConfig | Record<string, any>) {
    const model = this.createModelInstance(config);
    if (config && typeof config === "object" && "configurable" in config) {
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

