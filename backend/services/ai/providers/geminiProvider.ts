export {};
const http = require('http');
const https = require('https');
const { URL } = require('url');
const {
  getGeminiApiKey,
  getGeminiModel,
  getGeminiApiBase,
  getTimeoutMs,
} = require('../config');

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

const fetchWithTimeout = (url: string, options: any, timeoutMs: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.request(
      url,
      {
        method: options.method || 'POST',
        headers: options.headers || {},
        timeout: timeoutMs,
      },
      (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => (data += chunk));
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`Gemini API error (${res.statusCode}): ${parsedData.error?.message || data}`));
              return;
            }
            resolve(parsedData);
          } catch (err: any) {
            reject(new Error(`Gemini API returned invalid JSON: ${data.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Gemini request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err: any) => {
      reject(new Error(`Gemini request failed: ${err.message}`));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

const buildGeminiRequest = (messages: any[], maxTokens: number, temperature: number, jsonMode: boolean) => {
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemMessages = messages.filter((m) => m.role === 'system');
  const systemInstruction =
    systemMessages.length > 0
      ? { parts: systemMessages.map((m) => ({ text: m.content })) }
      : undefined;

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = systemInstruction;
  }

  if (jsonMode) {
    body.generationConfig.responseMimeType = 'application/json';
  }

  return body;
};

const parseGeminiResponse = (data: GeminiResponse, provider: string): any => {
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini returned no candidates');
  }

  const text = candidate.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return {
    content: text,
    parsedJson: null,
    provider,
    tokensUsed: data.usageMetadata?.totalTokenCount,
    latencyMs: 0,
  };
};

const geminiProvider = {
  name: 'gemini' as const,

  isConfigured(): boolean {
    return getGeminiApiKey().length > 0;
  },

  async generate(request: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Gemini provider is not configured (missing GEMINI_API_KEY)');
    }

    const timeoutMs = request.timeoutMs || getTimeoutMs();
    const maxTokens = request.maxTokens || 1024;
    const temperature = request.temperature ?? 0.7;

    const body = buildGeminiRequest(
      request.messages,
      maxTokens,
      temperature,
      !!request.jsonMode
    );

    const apiKey = getGeminiApiKey();
    const model = getGeminiModel();
    const apiBase = getGeminiApiBase();
    const url = `${apiBase}/models/${model}:generateContent?key=${apiKey}`;

    const startTime = Date.now();
    const data: GeminiResponse = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      timeoutMs
    );

    const result = parseGeminiResponse(data, 'gemini');
    result.latencyMs = Date.now() - startTime;
    return result;
  },

  async healthCheck(): Promise<any> {
    if (!this.isConfigured()) {
      return {
        provider: 'gemini' as const,
        configured: false,
        available: false,
        error: 'Missing GEMINI_API_KEY',
      };
    }

    try {
      const startTime = Date.now();
      const apiKey = getGeminiApiKey();
      const model = getGeminiModel();
      const apiBase = getGeminiApiBase();
      const url = `${apiBase}/models/${model}?key=${apiKey}`;
      const data = await fetchWithTimeout(
        url,
        { method: 'GET', headers: {} },
        5000
      );
      return {
        provider: 'gemini' as const,
        configured: true,
        available: true,
        model: getGeminiModel(),
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        provider: 'gemini' as const,
        configured: true,
        available: false,
        model: getGeminiModel(),
        error: err.message,
      };
    }
  },
};

module.exports = geminiProvider;
