export {};
const {
  getAIProvider,
  isFallbackEnabled,
  getAIConfig,
  isAIConfigured,
} = require('./config');
const geminiProvider = require('./providers/geminiProvider');
const ollamaProvider = require('./providers/ollamaProvider');

const providers: Record<string, any> = {
  gemini: geminiProvider,
  ollama: ollamaProvider,
};

const FALLBACK_ORDER: string[] = ['gemini', 'ollama'];

const validateJsonResponse = (
  content: string,
  schema?: Record<string, any>
): Record<string, any> | null => {
  if (!content || typeof content !== 'string') {
    return null;
  }

  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    cleaned = cleaned.trim();
  }

  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  if (schema && schema.required) {
    for (const field of schema.required as string[]) {
      if (!(field in parsed)) {
        return null;
      }
    }
  }

  return parsed;
};

const getProvider = (name: string): any => {
  return providers[name] || null;
};

const generate = async (request: any): Promise<any> => {
  if (!isAIConfigured()) {
    throw new Error('AI service is not configured. Set AI_PROVIDER and corresponding credentials.');
  }

  const providerName = getAIProvider();
  const fallbackEnabled = isFallbackEnabled();
  const primaryProvider = getProvider(providerName);
  if (!primaryProvider) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }

  const errors: string[] = [];

  try {
    const response = await primaryProvider.generate(request);

    if (request.jsonMode) {
      const parsed = validateJsonResponse(response.content, request.jsonSchema);
      if (!parsed) {
        errors.push(`${providerName}: returned invalid JSON`);
        throw new Error(`${providerName}: returned invalid JSON`);
      }
      response.parsedJson = parsed;
    }

    return response;
  } catch (err: any) {
    errors.push(`${providerName}: ${err.message}`);

    if (!fallbackEnabled) {
      throw new Error(`AI generation failed: ${err.message}`);
    }
  }

  for (const fallbackName of FALLBACK_ORDER) {
    if (fallbackName === providerName) continue;

    const fallbackProvider = getProvider(fallbackName);
    if (!fallbackProvider || !fallbackProvider.isConfigured()) continue;

    try {
      const response = await fallbackProvider.generate(request);

      if (request.jsonMode) {
        const parsed = validateJsonResponse(response.content, request.jsonSchema);
        if (!parsed) {
          errors.push(`${fallbackName}: returned invalid JSON`);
          continue;
        }
        response.parsedJson = parsed;
      }

      return response;
    } catch (err: any) {
      errors.push(`${fallbackName}: ${err.message}`);
    }
  }

  throw new Error(`All AI providers failed: ${errors.join('; ')}`);
};

const checkHealth = async (): Promise<any> => {
  const providerName = getAIProvider();
  const fallbackEnabled = isFallbackEnabled();
  const primaryProvider = getProvider(providerName);
  if (!primaryProvider) {
    return {
      primary: {
        provider: providerName,
        configured: false,
        available: false,
        error: `Unknown provider: ${providerName}`,
      },
      fallback: null,
    };
  }

  const primaryHealth = await primaryProvider.healthCheck();

  let fallbackHealth: any = null;
  if (fallbackEnabled) {
    for (const fallbackName of FALLBACK_ORDER) {
      if (fallbackName === providerName) continue;

      const fallbackProvider = getProvider(fallbackName);
      if (!fallbackProvider || !fallbackProvider.isConfigured()) continue;

      fallbackHealth = await fallbackProvider.healthCheck();
      break;
    }
  }

  return {
    primary: primaryHealth,
    fallback: fallbackHealth,
  };
};

const testGeneration = async (): Promise<any> => {
  const { HEALTH_CHECK_PROMPT } = require('./prompts/index');

  const request = {
    messages: [
      { role: 'system', content: HEALTH_CHECK_PROMPT.system },
      { role: 'user', content: HEALTH_CHECK_PROMPT.user },
    ],
    maxTokens: 50,
    temperature: 0.1,
    timeoutMs: 10000,
  };

  return generate(request);
};

const getConfig = (): any => {
  const config = getAIConfig();
  return {
    provider: config.provider,
    fallbackEnabled: config.fallbackEnabled,
    timeoutMs: config.timeoutMs,
    rateLimitWindowMs: config.rateLimitWindowMs,
    rateLimitMax: config.rateLimitMax,
    gemini: {
      model: config.gemini.model,
      apiBase: config.gemini.apiBase,
      configured: config.gemini.apiKey.length > 0,
    },
    ollama: {
      baseUrl: config.ollama.baseUrl,
      model: config.ollama.model,
      configured: isAIConfigured() && config.provider === 'ollama',
    },
  };
};

module.exports = {
  generate,
  checkHealth,
  testGeneration,
  getConfig,
  validateJsonResponse,
  getProvider,
  isAIConfigured,
};
