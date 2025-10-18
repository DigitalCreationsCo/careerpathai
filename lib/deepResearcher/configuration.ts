import { initChatModel } from "langchain/chat_models/universal";
import { z } from "zod";

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

export interface RunnableConfig {
  configurable?: Record<string, any>;
}

export const configurableModel = initChatModel(undefined, {configurableFields: ['model', 'maxTokens', 'apiKey']});

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
    const fieldNames = Object.keys(new Configuration());

    const values: Record<string, any> = {};
    for (const fieldName of fieldNames) {
      const envValue = env[fieldName.toUpperCase()];
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
