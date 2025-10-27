import { initChatModel as initChatModelBase } from "langchain/chat_models/universal";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const genaiCache = new Map<string, ChatGoogleGenerativeAI>();

function debugLog(...args: any[]) {
    if (process.env.LLM_DEBUG === "true") {
      const ts = new Date().toISOString();
      console.log(`[initChatModel][${ts}]`, ...args);
    }
}

export async function initChatModel(defaultConfig = {}) {
  const base = await initChatModelBase(undefined, defaultConfig);

  return {
    ...base,

    getGeminiClient(cfg: any) {
      const { model: modelName, apiKey, maxTokens } = cfg;
      const key = `${modelName}:${apiKey || process.env.GOOGLE_API_KEY}`;
      if (!genaiCache.has(key)) {
        debugLog(`Creating new Gemini client for ${modelName}`);
        const client = new ChatGoogleGenerativeAI({
          apiKey: apiKey || process.env.GOOGLE_API_KEY,
          model: modelName,
          maxOutputTokens: maxTokens || 2048,
        });
        genaiCache.set(key, client);
      } else {
        debugLog(`Using cached Gemini client for ${modelName}`);
      }
      return genaiCache.get(key)!;
    },

    async invoke(promptOrMessages: any, runtimeConfig?: any) {
      const start = performance.now();
      const cfg = { ...defaultConfig, ...(runtimeConfig?.configurable || {}) };
      const { model: modelName } = cfg;
      const lower = modelName?.toLowerCase() || "";

      if (lower.startsWith("gemini")) {
        debugLog(`Intercepted Gemini invoke: ${modelName}`);
        const genai = this.getGeminiClient(cfg);
        const messages = Array.isArray(promptOrMessages)
          ? promptOrMessages
          : [{ role: "user", content: promptOrMessages }];
        const response = await genai.invoke(messages);
        debugLog(
          `Gemini invoke complete (${(performance.now() - start).toFixed(1)}ms)`
        );
        return response;
      }

      debugLog(`Delegating invoke to LangGraph (${modelName})`);
      return await base.invoke(promptOrMessages, runtimeConfig);
    },

    async ainvoke(promptOrMessages: any, runtimeConfig?: any) {
      debugLog(`ainvoke() → forwarding to invoke()`);
      return this.invoke(promptOrMessages, runtimeConfig);
    },

    async stream(promptOrMessages: any, runtimeConfig?: any) {
      const start = performance.now();
      const cfg = { ...defaultConfig, ...(runtimeConfig?.configurable || {}) };
      const { model: modelName } = cfg;
      const lower = modelName?.toLowerCase() || "";

      if (lower.startsWith("gemini")) {
        debugLog(`Intercepted Gemini stream: ${modelName}`);
        const genai = this.getGeminiClient(cfg);
        const messages = Array.isArray(promptOrMessages)
          ? promptOrMessages
          : [{ role: "user", content: promptOrMessages }];
        const stream = await genai.stream(messages);
        debugLog(
          `Gemini stream established (${(performance.now() - start).toFixed(1)}ms)`
        );
        return stream;
      }

      debugLog(`Delegating stream to LangGraph (${modelName})`);
      return await base.stream(promptOrMessages, runtimeConfig);
    },
  };
}

export async function initConfigurableModel(config: Record<string, any> = {}) {
  const hybrid = (await initChatModel(config));

  Object.defineProperty(hybrid, "withConfigurable", {
    value: (cfg: any) => ({
      async invoke(prompt: any, runtimeConfig?: any) {
        return hybrid.invoke(prompt, {
          configurable: { ...cfg, ...(runtimeConfig?.configurable || {}) },
        });
      },
      async stream(prompt: any, runtimeConfig?: any) {
        return hybrid.stream(prompt, {
          configurable: { ...cfg, ...(runtimeConfig?.configurable || {}) },
        });
      },
    })
  });

  debugLog("Custom configurableModel initialized with config:", config);
  return hybrid;
}