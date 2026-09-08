import type { AIProviderName } from './types';

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return fallback ?? '';
  }
  return value.trim();
};

const isEnvSet = (key: string): boolean => {
  const value = process.env[key];
  return value !== undefined && value.trim() !== '';
};

// Dynamic accessors so env changes are picked up without re-requiring the module
export const getAIProvider = (): AIProviderName => {
  const raw = getEnv('AI_PROVIDER', 'gemini').toLowerCase();
  return raw === 'ollama' ? 'ollama' : 'gemini';
};

export const isFallbackEnabled = (): boolean =>
  getEnv('AI_FALLBACK_ENABLED', 'true').toLowerCase() === 'true';

export const getTimeoutMs = (): number =>
  parseInt(getEnv('AI_TIMEOUT_MS', '30000'), 10) || 30000;

export const getRateLimitWindowMs = (): number =>
  parseInt(getEnv('AI_RATE_LIMIT_WINDOW_MS', '60000'), 10) || 60000;

export const getRateLimitMax = (): number =>
  parseInt(getEnv('AI_RATE_LIMIT_MAX', '10'), 10) || 10;

export const getGeminiApiKey = (): string => getEnv('GEMINI_API_KEY');
export const getGeminiModel = (): string => getEnv('GEMINI_MODEL', 'gemini-2.0-flash');
export const getGeminiApiBase = (): string =>
  getEnv('GEMINI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta');

export const getOllamaBaseUrl = (): string => getEnv('OLLAMA_BASE_URL', 'http://localhost:11434');
export const getOllamaModel = (): string => getEnv('OLLAMA_MODEL', 'llama3.1');
export const isOllamaBaseUrlSet = (): boolean => isEnvSet('OLLAMA_BASE_URL');

export interface AIConfig {
  provider: AIProviderName;
  fallbackEnabled: boolean;
  timeoutMs: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  gemini: {
    apiKey: string;
    model: string;
    apiBase: string;
  };
  ollama: {
    baseUrl: string;
    model: string;
  };
}

export const getAIConfig = (): AIConfig => ({
  provider: getAIProvider(),
  fallbackEnabled: isFallbackEnabled(),
  timeoutMs: getTimeoutMs(),
  rateLimitWindowMs: getRateLimitWindowMs(),
  rateLimitMax: getRateLimitMax(),
  gemini: {
    apiKey: getGeminiApiKey(),
    model: getGeminiModel(),
    apiBase: getGeminiApiBase(),
  },
  ollama: {
    baseUrl: getOllamaBaseUrl(),
    model: getOllamaModel(),
  },
});

export const isAIConfigured = (): boolean => {
  const provider = getAIProvider();
  if (provider === 'gemini') {
    return getGeminiApiKey().length > 0;
  }
  if (provider === 'ollama') {
    return isOllamaBaseUrlSet();
  }
  return false;
};

// Backward-compatible static exports for code that already uses them
export const AI_PROVIDER: AIProviderName = getAIProvider();
export const AI_FALLBACK_ENABLED = isFallbackEnabled();
export const AI_TIMEOUT_MS = getTimeoutMs();
export const AI_RATE_LIMIT_WINDOW_MS = getRateLimitWindowMs();
export const AI_RATE_LIMIT_MAX = getRateLimitMax();
export const GEMINI_API_KEY = getGeminiApiKey();
export const GEMINI_MODEL = getGeminiModel();
export const GEMINI_API_BASE = getGeminiApiBase();
export const OLLAMA_BASE_URL = getOllamaBaseUrl();
export const OLLAMA_MODEL = getOllamaModel();
export const OLLAMA_BASE_URL_SET = isOllamaBaseUrlSet();
