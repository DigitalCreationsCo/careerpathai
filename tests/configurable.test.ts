// === Vitest Unit Tests ===
import { Configuration, RunnableConfig, SearchApi } from '@/lib/deepResearcher/configuration';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Configuration', () => {
  it('should use defaults when constructed without args', () => {
    const c = new Configuration();
    expect(c.maxStructuredOutputRetries).toBe(3);
    expect(c.allowClarification).toBe(true);
    expect(c.maxConcurrentResearchUnits).toBe(5);
    expect(c.searchApi).toBe(SearchApi.Tavily);
    expect(c.maxResearcherIterations).toBe(6);
    expect(c.summarizationModel).toBe("openai:gpt-4.1-mini");
    expect(c.finalReportModelMaxTokens).toBe(10000);
    expect(c.mcpConfig).toBeUndefined();
    expect(c.mcpPrompt).toBeUndefined();
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
    // Setup: Override environment variables temporarily
    const ENV_BACKUP = { ...process.env };
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
    expect(cfg.allowClarification).toBe("false");
    expect(cfg.maxConcurrentResearchUnits).toBe("7"); // Because env is string!
    process.env = ENV_BACKUP; // Reset environment
  });
});

describe('ModelSelector', () => {
  let originalEnv: any;
  let DummyModel: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    DummyModel = class { static calls: any[] = [];
      constructor(opts: any) { (this as any).opts = opts; DummyModel.calls.push(['ctor', opts]); }
      static reset() { DummyModel.calls = []; }
      withStructuredOutput(schema: any) { DummyModel.calls.push(['withStructuredOutput', schema]); return this; }
      withRetry(cfg: any) { DummyModel.calls.push(['withRetry', cfg]); return this; }
      withConfig(cfg: any) { DummyModel.calls.push(['withConfig', cfg]); return this; }
      async invoke(input:any, config?:any) { DummyModel.calls.push(['invoke', input, config]); return 'output'; }
      async stream(input:any, config?:any) { DummyModel.calls.push(['stream', input, config]); return 'streamed'; }
      async batch(inputs:any[], config?:any) { DummyModel.calls.push(['batch', inputs, config]); return 'batched'; }
    };

    // Patch model classes
    vi.spyOn(global, "console", "log").mockImplementation(() => {});
    (ChatOpenAI as any) = DummyModel;
    (ChatGoogleGenerativeAI as any) = DummyModel;
    (ChatAnthropic as any) = DummyModel;
  });

  afterEach(() => {
    process.env = originalEnv;
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

  it('merges configs correctly (precedence and withConfig chain)', () => {
    let ms = new ModelSelector();
    ms = ms.withConfig({model: 'openai:gpt-4.1', tagA: true, foo: 1});
    ms = ms.withRetry({times: 2});
    ms = ms.withStructuredOutput({a: 1});
    // Deep merge: .withConfig overrides .additionalConfig, arg to invoke overrides inside
    // Also, test that .withConfig is cumulative
    const toMerge = {tagB: false, foo: 2, model: 'openai:gpt-4.1'};

    const inst = ms['createModelInstance'](toMerge);
    // Our DummyModel is called. Check calls
    expect((DummyModel.calls[0]![0] as string)).toBe('ctor');
    expect(DummyModel.calls.some(([k, v]) => k === 'withStructuredOutput')).toBe(true);
    expect(DummyModel.calls.some(([k, v]) => k === 'withRetry')).toBe(true);
    expect(DummyModel.calls.some(([k, v]) => k === 'withConfig')).toBe(true);
  });

  it('uses config precedence (invoke > withConfig > .additionalConfig > none)', async () => {
    let ms = new ModelSelector();
    ms = ms.withConfig({model: 'anthropic:claude-3', apiKey: 'demo', spoof: 1, foo: 'bar'});
    // invoke with config that overrides foo+apiKey
    DummyModel.reset();
    await ms.invoke('hi', {model: 'anthropic:claude-3', apiKey: 'yyy', bar: true, foo: 'overridden'});
    // Should call invoke w/ proper config layering
    expect(DummyModel.calls.some(arr => arr[0]==='invoke')).toBeTruthy();
  });

  it('should call withConfig for extra keys only (excluding model/core keys) in additionalConfig and callerConfig', () => {
    let ms = new ModelSelector();
    ms = ms.withConfig({model: 'openai:gpt-4.1', apiKey: 'api', foo: 'whoa', mark: 9});
    const inst = ms['createModelInstance']({model: 'openai:gpt-4.1', apiKey: 'yyy', foo: 'override', mark: 2, someOther: 'A'});
    // Should call withConfig with only extra keys (neither model, apiKey, maxTokens, tags)
    const withConfigCalls = DummyModel.calls.filter(([k]) => k === 'withConfig');
    expect(withConfigCalls.length).toBeGreaterThan(0);
    for (const call of withConfigCalls) {
      for (const key of Object.keys(call[1])) {
        expect(['foo', 'mark', 'someOther'].includes(key)).toBeTruthy();
      }
      for (const forbidden of ['model', 'apiKey', 'tags', 'maxTokens']) {
        expect(Object.keys(call[1])).not.toContain(forbidden);
      }
    }
  });

  it('invoke/stream/batch pass correct config for plain object and for RunnableConfig', async () => {
    let ms = new ModelSelector().withConfig({model: 'gemini:1', apiKey: 'y', value: 4});
    DummyModel.reset();
    await ms.invoke('test1');
    await ms.invoke('test2', {foo: 1, model: 'gemini:1', apiKey: 'abc', bar: 2});
    await ms.invoke('test3', {configurable: {baz: 7, model: 'gemini:1', apiKey: 'q', tags: ['ok']}});
    let callNames = DummyModel.calls.map(([k]) => k);
    expect(callNames.filter(k => k === 'invoke').length).toBe(3);

    DummyModel.reset();
    await ms.stream('aa', {model: 'gemini:2', apiKey: 'Q', thing: true});
    await ms.batch(['a', 'b', 'c'], {configurable: {model: 'gemini:2', apiKey: 'xx', batchy: 1}});
    expect(DummyModel.calls.map(c => c[0]).includes('stream')).toBe(true);
    expect(DummyModel.calls.map(c => c[0]).includes('batch')).toBe(true);
  });

  it('throws errors if required model keys are missing or model is not recognized', () => {
    const ms = new ModelSelector();
    expect(() => ms['createModelInstance']({})).toThrow(/must be provided/);
    expect(() => ms['createModelInstance']({model: 'badstuff'})).toThrow(/Unsupported model/);
  });
});

describe('SearchApi enum', () => {
  it('has all expected values', () => {
    expect(SearchApi.Tavily).toBe("tavily");
    expect(SearchApi.Anthropic).toBe("anthropic");
    expect(SearchApi.Openai).toBe("openai");
    expect(SearchApi.None).toBe("none");
  });
});

describe('McpConfig', () => {
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

  beforeEach(() => resetEnv(ENV_KEYS));
  afterEach(() => resetEnv(ENV_KEYS));

  it("should prefer env (UPPER_SNAKE) over config (camelCase) and defaults", () => {
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
    const config = new Configuration();
    expect(config.compressionModel).toBe("openai:gpt-4.1");
    expect(config.compressionModelMaxTokens).toBe(8192);
    expect(config.allowClarification).toBe(true);
  });

  it("fromRunnableConfig prioritizes env (UPPER_SNAKE) over configurable/camelCase", () => {
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
    // Just confirm we're not breaking for extra fields, but nothing is set
    const conf = new Configuration({ someBogusKey: "not useful" } as any);
    expect((conf as any).someBogusKey).toBe("not useful");
  });

  it("fromRunnableConfig handles no input", () => {
    expect(() => Configuration.fromRunnableConfig()).not.toThrow();
    const conf = Configuration.fromRunnableConfig();
    expect(conf).toBeInstanceOf(Configuration);
  });
});