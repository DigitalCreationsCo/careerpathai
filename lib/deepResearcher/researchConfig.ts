/**
 * Research configuration management with user-specific settings.
 */

import { RunnableConfig } from "./configuration";

export interface ResearchConfig {
  maxStructuredOutputRetries: number;
  allowClarification: boolean;
  maxConcurrentResearchUnits: number;
  searchApi: string;
  maxResearcherIterations: number;
  maxReactToolCalls: number;
  summarizationModel: string;
  summarizationModelMaxTokens: number;
  maxContentLength: number;
  researchModel: string;
  researchModelMaxTokens: number;
  compressionModel: string;
  compressionModelMaxTokens: number;
  finalReportModel: string;
  finalReportModelMaxTokens: number;
  [key: string]: any;
}

export class ResearchConfigManager {
  defaultConfig: ResearchConfig;

  constructor() {
    this.defaultConfig = this.loadDefaultConfig();
  }

  /** Load default configuration from environment variables */
  private loadDefaultConfig(): ResearchConfig {
    const getInt = (key: string, def: string) => parseInt(process.env[key] || def, 10);
    const getBool = (key: string, def: string) =>
      (process.env[key] || def).toLowerCase() === "true";
    const getStr = (key: string, def: string) => process.env[key] || def;

    return {
      maxStructuredOutputRetries: getInt("MAX_STRUCTURED_OUTPUT_RETRIES", "3"),
      allowClarification: getBool("ALLOW_CLARIFICATION", "true"),
      maxConcurrentResearchUnits: getInt("MAX_CONCURRENT_RESEARCH_UNITS", "5"),
      searchApi: getStr("SEARCH_API", "tavily"),
      maxResearcherIterations: getInt("MAX_RESEARCHER_ITERATIONS", "6"),
      maxReactToolCalls: getInt("MAX_REACT_TOOL_CALLS", "10"),
      summarizationModel: getStr("SUMMARIZATION_MODEL", "openai:gpt-4.1-mini"),
      summarizationModelMaxTokens: getInt("SUMMARIZATION_MODEL_MAX_TOKENS", "8192"),
      maxContentLength: getInt("MAX_CONTENT_LENGTH", "50000"),
      researchModel: getStr("RESEARCH_MODEL", "openai:gpt-4.1"),
      researchModelMaxTokens: getInt("RESEARCH_MODEL_MAX_TOKENS", "10000"),
      compressionModel: getStr("COMPRESSION_MODEL", "openai:gpt-4.1"),
      compressionModelMaxTokens: getInt("COMPRESSION_MODEL_MAX_TOKENS", "8192"),
      finalReportModel: getStr("FINAL_REPORT_MODEL", "openai:gpt-4.1"),
      finalReportModelMaxTokens: getInt("FINAL_REPORT_MODEL_MAX_TOKENS", "10000"),
    };
  }

  /** Get configuration for a specific user, merging defaults with session-specific settings */
  getUserConfig(
    userId: string,
    sessionConfig?: Record<string, any>
  ): Record<string, any> {
    const config = { ...this.defaultConfig };

    if (sessionConfig) {
      Object.assign(config, sessionConfig);
    }

    // TODO: Future implementation for loading user-specific preferences
    // const userPreferences = await this.loadUserPreferences(userId);
    // Object.assign(config, userPreferences);

    return config;
  }

  /** Create RunnableConfig for LangGraph execution */
  createRunnableConfig(
    threadId: string,
    userId: string,
    sessionConfig?: Record<string, any>
  ): RunnableConfig {
    const configurable = this.getUserConfig(userId, sessionConfig);
    configurable.threadId = threadId;

    return { configurable };
  }

  /** Get API keys for different models from environment */
  getApiKeys(): Record<string, string | undefined> {
    return {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      tavily: process.env.TAVILY_API_KEY,
    };
  }
}

// Global instance
export const configManager = new ResearchConfigManager();
