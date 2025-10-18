/**
 * Research configuration management with user-specific settings.
 */

import { RunnableConfig } from "./configuration";

export interface ResearchConfig {
  max_structured_output_retries: number;
  allow_clarification: boolean;
  max_concurrent_research_units: number;
  search_api: string;
  max_researcher_iterations: number;
  max_react_tool_calls: number;
  summarization_model: string;
  summarization_model_max_tokens: number;
  max_content_length: number;
  research_model: string;
  research_model_max_tokens: number;
  compression_model: string;
  compression_model_max_tokens: number;
  final_report_model: string;
  final_report_model_max_tokens: number;
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
      max_structured_output_retries: getInt("MAX_STRUCTURED_OUTPUT_RETRIES", "3"),
      allow_clarification: getBool("ALLOW_CLARIFICATION", "true"),
      max_concurrent_research_units: getInt("MAX_CONCURRENT_RESEARCH_UNITS", "5"),
      search_api: getStr("SEARCH_API", "tavily"),
      max_researcher_iterations: getInt("MAX_RESEARCHER_ITERATIONS", "6"),
      max_react_tool_calls: getInt("MAX_REACT_TOOL_CALLS", "10"),
      summarization_model: getStr("SUMMARIZATION_MODEL", "openai:gpt-4.1-mini"),
      summarization_model_max_tokens: getInt("SUMMARIZATION_MODEL_MAX_TOKENS", "8192"),
      max_content_length: getInt("MAX_CONTENT_LENGTH", "50000"),
      research_model: getStr("RESEARCH_MODEL", "openai:gpt-4.1"),
      research_model_max_tokens: getInt("RESEARCH_MODEL_MAX_TOKENS", "10000"),
      compression_model: getStr("COMPRESSION_MODEL", "openai:gpt-4.1"),
      compression_model_max_tokens: getInt("COMPRESSION_MODEL_MAX_TOKENS", "8192"),
      final_report_model: getStr("FINAL_REPORT_MODEL", "openai:gpt-4.1"),
      final_report_model_max_tokens: getInt("FINAL_REPORT_MODEL_MAX_TOKENS", "10000"),
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
    configurable.thread_id = threadId;

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
