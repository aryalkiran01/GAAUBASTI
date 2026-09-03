export {};
const http = require('http');
const https = require('https');
const { URL } = require('url');
const {
  getOllamaBaseUrl,
  getOllamaModel,
  isOllamaBaseUrlSet,
  getTimeoutMs,
} = require('../config');

interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
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
              reject(new Error(`Ollama API error (${res.statusCode}): ${parsedData.error || data}`));
              return;
            }
            resolve(parsedData);
          } catch (err: any) {
            reject(new Error(`Ollama API returned invalid JSON: ${data.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Ollama request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err: any) => {
      reject(new Error(`Ollama request failed: ${err.message}`));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

const buildOllamaRequest = (
  messages: any[],
  model: string,
  maxTokens: number,
  temperature: number,
  jsonMode: boolean
) => {
  const body: any = {
    model,
    messages,
    options: {
      num_predict: maxTokens,
      temperature,
    },
    stream: false,
  };

  if (jsonMode) {
    body.format = 'json';
  }

  return body;
};

const ollamaProvider = {
  name: 'ollama' as const,

  isConfigured(): boolean {
    return isOllamaBaseUrlSet();
  },

  async generate(request: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Ollama provider is not configured (missing OLLAMA_BASE_URL)');
    }

    const timeoutMs = request.timeoutMs || getTimeoutMs();
    const maxTokens = request.maxTokens || 1024;
    const temperature = request.temperature ?? 0.7;

    const baseUrl = getOllamaBaseUrl();
    const model = getOllamaModel();
    const body = buildOllamaRequest(
      request.messages,
      model,
      maxTokens,
      temperature,
      !!request.jsonMode
    );

    const url = `${baseUrl}/api/chat`;
    const startTime = Date.now();

    const data: OllamaChatResponse = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      timeoutMs
    );

    if (!data.message || !data.message.content) {
      throw new Error('Ollama returned empty response');
    }

    return {
      content: data.message.content,
      parsedJson: null,
      provider: 'ollama' as const,
      tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      latencyMs: Date.now() - startTime,
    };
  },

  async healthCheck(): Promise<any> {
    if (!this.isConfigured()) {
      return {
        provider: 'ollama' as const,
        configured: false,
        available: false,
        error: 'Missing OLLAMA_BASE_URL',
      };
    }

    try {
      const startTime = Date.now();
      const baseUrl = getOllamaBaseUrl();
      const url = `${baseUrl}/api/tags`;
      await fetchWithTimeout(
        url,
        { method: 'GET', headers: {} },
        5000
      );
      return {
        provider: 'ollama' as const,
        configured: true,
        available: true,
        model: getOllamaModel(),
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        provider: 'ollama' as const,
        configured: true,
        available: false,
        model: getOllamaModel(),
        error: err.message,
      };
    }
  },
};

module.exports = ollamaProvider;
