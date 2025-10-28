// === Vitest Unit Tests ===
import { Configuration, McpConfig, ModelSelector, removeVendorPrefix, RunnableConfig, SearchApi } from '@/lib/deepResearcher/configuration';
import { getApiKeyForModel, getTodayStr, MODEL_TOKEN_LIMITS } from '@/lib/deepResearcher/llmUtils';
import { clarifyWithUserInstructions } from '@/lib/deepResearcher/prompts';
import { ClarifyWithUser } from '@/lib/deepResearcher/state';
import { getBufferString } from '@/lib/messageUtils';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configDotenv } from "dotenv";

// Helper to clear all environment variables for full isolation
function clearProcessEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
}

const messages = [
  new HumanMessage({ content: '' })
]
describe('Configuration', () => {
  beforeEach(() => {
    clearProcessEnv();
  });

  it('should use defaults when constructed without args', () => {
    const c = new Configuration();
    const defaultFinalReportModelMaxTokens = MODEL_TOKEN_LIMITS[removeVendorPrefix(c.finalReportModel)];
    expect(c.maxStructuredOutputRetries).toBe(3);
    expect(c.allowClarification).toBe(true);
    expect(c.maxConcurrentResearchUnits).toBe(5);
    expect(c.searchApi).toBe(SearchApi.Tavily);
    expect(c.maxResearcherIterations).toBe(6);
    expect(c.summarizationModel).toBe("openai:gpt-4.1-mini");
    expect(c.finalReportModelMaxTokens).toBe(defaultFinalReportModelMaxTokens);
    expect(c.mcpConfig).toBeNull();
    expect(c.mcpPrompt).toBeNull();
  });

  it('should apply any overrides from constructor data', () => {
    const c = new Configuration({
      maxStructuredOutputRetries: 10,
      allowClarification: false,
      maxConcurrentResearchUnits: 99,
      maxResearcherIterations: 88,
      researchModel: "fake-test-model"
    });
    expect(c.maxStructuredOutputRetries).toBe(10);
    expect(c.allowClarification).toBe(false);
    expect(c.maxConcurrentResearchUnits).toBe(99);
    expect(c.maxResearcherIterations).toBe(88);
    expect(c.researchModel).toBe("fake-test-model");
  });

  it('getSchema() returns correct zod schema with defaults', () => {
    const schema = Configuration.getSchema();
    const parsed = schema.parse({});
    expect(parsed.maxConcurrentResearchUnits).toBe(5);
    expect(parsed.allowClarification).toBe(true);
    expect(parsed.finalReportModelMaxTokens).toBe(10000);
    expect(parsed.mcpPrompt).toBeNull();
  });

  it('fromRunnableConfig: prefers env over configurable, configurable over default', () => {
    clearProcessEnv();
    process.env.ALLOW_CLARIFICATION = "false";
    process.env.MAX_CONCURRENT_RESEARCH_UNITS = "7";
    const config = {
      configurable: {
        ALLOW_CLARIFICATION: true,
        MAX_CONCURRENT_RESEARCH_UNITS: 888,
        EXTRA_FIELD: 42
      }
    };
    const cfg = Configuration.fromRunnableConfig(config as RunnableConfig);
    expect(cfg.allowClarification).toBe(false);
    expect(cfg.maxConcurrentResearchUnits).toBe(7); 
    clearProcessEnv();
  });
});

describe('ModelSelector', () => {
  let DummyModel: any;

  beforeEach(() => {
    clearProcessEnv();
    DummyModel = class { static calls: any[] = [];
      constructor(opts: any) { (this as any).opts = opts; DummyModel.calls.push(['ctor', opts]); }
      static reset() { DummyModel.calls = []; }
      withStructuredOutput(schema: any) { DummyModel.calls.push(['withStructuredOutput', schema]); (this as any)._outSchema = schema; return this; }
      withRetry(cfg: any) { DummyModel.calls.push(['withRetry', cfg]); return this; }
      withConfig(cfg: any) { DummyModel.calls.push(['withConfig', cfg]); return this; }
      async invoke(input:any, config?:any) { 
        DummyModel.calls.push(['invoke', input, config]); 
        // Simulate model output that matches the clarifyWithUser schema,
        // ignore input/config for the test, in real case LLM output parsed.
        return { 
          needClarification: false,
          question: '',
          verification: 'Understood. Proceeding with research.'
        }; 
      }
      async stream(input:any, config?:any) { DummyModel.calls.push(['stream', input, config]); return 'streamed'; }
      async batch(inputs:any[], config?:any) { DummyModel.calls.push(['batch', inputs, config]); return 'batched'; }
    };

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("ChatOpenAI", DummyModel);
    vi.stubGlobal("ChatGoogleGenerativeAI", DummyModel);
    vi.stubGlobal("ChatAnthropic", DummyModel);
  });

  afterEach(() => {
    clearProcessEnv();
    DummyModel.reset();
    vi.restoreAllMocks();
  });

  it('should use correct underlying model for openai, gemini, anthropic, and error on unknown', () => {
    // openai:
    let ms = new ModelSelector();
    expect(() =>
      ms['createModelInstance']({model: 'foo-bar'})
    ).toThrow(/Unsupported model/);

    expect(() =>
      ms['createModelInstance']()
    ).toThrow(/must be provided/);

    expect(() =>
      ms['createModelInstance']({model: 'openai:gpt-4.1', apiKey: 'x', maxTokens: 3})
    ).not.toThrow();

    expect(() =>
      ms['createModelInstance']({model: 'gemini-very', apiKey: 'y', maxTokens: 2})
    ).not.toThrow();

    expect(() =>
      ms['createModelInstance']({model: 'anthropic:claude-3', apiKey: 'abc', maxTokens: 22})
    ).not.toThrow();
  });

  it('throws errors if required model keys are missing or model is not recognized', () => {
    const ms = new ModelSelector();
    expect(() => ms['createModelInstance']({})).toThrow(/must be provided/);
    expect(() => ms['createModelInstance']({model: 'badstuff'})).toThrow(/Unsupported model/);
  });

  it('can invoke a model response with clarifyWithUser structured output', async () => {
    process.env = { ...process.env, ...configDotenv({ path: '.env.local' }).parsed! }
    
    const model = new ModelSelector().withStructuredOutput(ClarifyWithUser);
    const configurable = new Configuration();

    const messageBuffer = getBufferString(messages);
    const clarifyWithUserPrompt = clarifyWithUserInstructions(
      messageBuffer,
      getTodayStr()
    );
    const apiKey = getApiKeyForModel(configurable.researchModel, configurable);

    const result = await model.invoke(clarifyWithUserPrompt, {
      configurable: {
        model: configurable.researchModel,
        maxTokens: configurable.researchModelMaxTokens,
        apiKey,
      }
    });

    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(['needClarification', 'question', 'verification'])
    );
  });
});


describe('SearchApi enum', () => {
  beforeEach(() => {
    clearProcessEnv();
  });
  it('has all expected values', () => {
    expect(SearchApi.Tavily).toBe("tavily");
    expect(SearchApi.Anthropic).toBe("anthropic");
    expect(SearchApi.Openai).toBe("openai");
    expect(SearchApi.None).toBe("none");
  });
});

describe('McpConfig', () => {
  beforeEach(() => {
    clearProcessEnv();
  });
  it('should allow url/tools undefined/null/values and set authRequired as false by default', () => {
    const mc1 = new McpConfig();
    expect(mc1.url).toBeNull();
    expect(mc1.tools).toBeNull();
    expect(mc1.authRequired).toBe(false);

    const mc2 = new McpConfig({ url: "http://test", tools: ["foo", "bar"], authRequired: true });
    expect(mc2.url).toBe("http://test");
    expect(mc2.tools).toEqual(["foo", "bar"]);
    expect(mc2.authRequired).toBe(true);

    const mc3 = new McpConfig({url: undefined, tools: undefined, authRequired: undefined});
    expect(mc3.url).toBeNull();
    expect(mc3.tools).toBeNull();
    expect(mc3.authRequired).toBe(false);
  });
});

function resetEnv(keys: string[]) {
  for (const k of keys) {
    delete process.env[k];
  }
}

// Unit tests for Configuration priority/overwriting using vitest
describe("Configuration", () => {
  const ENV_KEYS = [
    "ALLOW_CLARIFICATION",
    "COMPRESSION_MODEL",
    "COMPRESSION_MODEL_MAX_TOKENS",
    "FINAL_REPORT_MODEL",
    "FINAL_REPORT_MODEL_MAX_TOKENS",
    "MAX_CONCURRENT_RESEARCH_UNITS",
    "MAX_STRUCTURED_OUTPUT_RETRIES"
  ];

  beforeEach(() => {
    clearProcessEnv();
  });
  afterEach(() => {
    clearProcessEnv();
  });

  it("should prefer env (UPPER_SNAKE) over config (camelCase) and defaults", () => {
    clearProcessEnv();
    process.env.COMPRESSION_MODEL = "gemini-2.5-flash-lite";
    process.env.COMPRESSION_MODEL_MAX_TOKENS = "20092";
    process.env.ALLOW_CLARIFICATION = "false";
    // config supplied as input:
    const config = new Configuration({
      compressionModel: "openai:gpt-3.5",
      compressionModelMaxTokens: 11111,
      allowClarification: true,
    });
    expect(config.compressionModel).toBe("gemini-2.5-flash-lite");
    expect(config.compressionModelMaxTokens).toBe(20092);
    expect(config.allowClarification).toBe(false);
  });

  it("should use config (camelCase) if env (UPPER_SNAKE) not defined", () => {
    clearProcessEnv();
    const config = new Configuration({
      compressionModel: "openai:gpt-3.5",
      compressionModelMaxTokens: 11111,
      allowClarification: false,
    });
    expect(config.compressionModel).toBe("openai:gpt-3.5");
    expect(config.compressionModelMaxTokens).toBe(11111);
    expect(config.allowClarification).toBe(false);
  });

  it("should use default if neither env nor config specified", () => {
    clearProcessEnv();
    const config = new Configuration();
    const defaultCompressionModel = "openai:gpt-4.1"
    const fallbackMaxTokens = 8192;
    const defaultMaxTokens = MODEL_TOKEN_LIMITS[removeVendorPrefix(defaultCompressionModel)] ?? fallbackMaxTokens;
    expect(config.compressionModel).toBe(defaultCompressionModel);
    expect(config.compressionModelMaxTokens).toBe(defaultMaxTokens);
    expect(config.allowClarification).toBe(true);
  });

  it("fromRunnableConfig prioritizes env (UPPER_SNAKE) over configurable/camelCase", () => {
    clearProcessEnv();
    process.env.FINAL_REPORT_MODEL = "gemini-2.5-flash-lite";
    process.env.FINAL_REPORT_MODEL_MAX_TOKENS = "20000";
    const conf = Configuration.fromRunnableConfig({
      configurable: {
        finalReportModel: "openai:gpt-3.5",
        finalReportModelMaxTokens: 7890,
      }
    });
    expect(conf.finalReportModel).toBe("gemini-2.5-flash-lite");
    expect(conf.finalReportModelMaxTokens).toBe(20000);
  });

  it("fromRunnableConfig uses configurable if env not defined", () => {
    clearProcessEnv();
    const conf = Configuration.fromRunnableConfig({
      configurable: {
        finalReportModel: "openai:gpt-3.5",
        finalReportModelMaxTokens: 7890,
      }
    });
    expect(conf.finalReportModel).toBe("openai:gpt-3.5");
    expect(conf.finalReportModelMaxTokens).toBe(7890);
  });

  it("should properly parse booleans and numbers from env", () => {
    clearProcessEnv();
    process.env.ALLOW_CLARIFICATION = "true";
    process.env.COMPRESSION_MODEL_MAX_TOKENS = "1234";
    process.env.MAX_CONCURRENT_RESEARCH_UNITS = "7";
    process.env.MAX_STRUCTURED_OUTPUT_RETRIES = "2";
    const conf = new Configuration();
    expect(conf.allowClarification).toBe(true);
    expect(conf.compressionModelMaxTokens).toBe(1234);
    expect(conf.maxConcurrentResearchUnits).toBe(7);
    expect(conf.maxStructuredOutputRetries).toBe(2);
  });

  it("should allow fallback for unknown properties", () => {
    clearProcessEnv();
    // Just confirm we're not breaking for extra fields, but nothing is set
    const conf = new Configuration({ someBogusKey: "not useful" } as any);
    expect((conf as any).someBogusKey).toBe("not useful");
  });

  it("fromRunnableConfig handles no input", () => {
    clearProcessEnv();
    expect(() => Configuration.fromRunnableConfig()).not.toThrow();
    const conf = Configuration.fromRunnableConfig();
    expect(conf).toBeInstanceOf(Configuration);
  });
});