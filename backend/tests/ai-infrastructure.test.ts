export {};

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const config = require('../services/ai/config');
const aiService = require('../services/ai/aiService');

describe('AI Infrastructure', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_FALLBACK_ENABLED = 'true';
    process.env.AI_TIMEOUT_MS = '30000';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    process.env.OLLAMA_MODEL = 'llama3.1';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('validateJsonResponse', () => {
    it('should parse valid JSON string', () => {
      const result = aiService.validateJsonResponse('{"status": "ok", "count": 5}');
      assert.ok(result !== null);
      assert.strictEqual(result!.status, 'ok');
      assert.strictEqual(result!.count, 5);
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const result = aiService.validateJsonResponse('```json\n{"status": "ok"}\n```');
      assert.ok(result !== null);
      assert.strictEqual(result!.status, 'ok');
    });

    it('should parse JSON wrapped in plain code blocks', () => {
      const result = aiService.validateJsonResponse('```\n{"status": "ok"}\n```');
      assert.ok(result !== null);
      assert.strictEqual(result!.status, 'ok');
    });

    it('should return null for invalid JSON', () => {
      assert.strictEqual(aiService.validateJsonResponse('not json at all'), null);
      assert.strictEqual(aiService.validateJsonResponse('{invalid}'), null);
      assert.strictEqual(aiService.validateJsonResponse(''), null);
    });

    it('should return null for non-object JSON (arrays)', () => {
      assert.strictEqual(aiService.validateJsonResponse('[1, 2, 3]'), null);
    });

    it('should return null for non-object JSON (primitives)', () => {
      assert.strictEqual(aiService.validateJsonResponse('"just a string"'), null);
      assert.strictEqual(aiService.validateJsonResponse('42'), null);
      assert.strictEqual(aiService.validateJsonResponse('true'), null);
      assert.strictEqual(aiService.validateJsonResponse('null'), null);
    });

    it('should validate against required fields in schema', () => {
      const schema = { required: ['status'] };
      assert.ok(aiService.validateJsonResponse('{"status": "ok"}', schema) !== null);
      assert.strictEqual(aiService.validateJsonResponse('{"other": "value"}', schema), null);
    });

    it('should return null for null or undefined input', () => {
      assert.strictEqual(aiService.validateJsonResponse(null as any), null);
      assert.strictEqual(aiService.validateJsonResponse(undefined as any), null);
    });

    it('should handle JSON with extra whitespace', () => {
      const result = aiService.validateJsonResponse('  \n  {"status": "ok"}  \n  ');
      assert.ok(result !== null);
      assert.strictEqual(result!.status, 'ok');
    });
  });

  describe('Provider selection', () => {
    it('should select gemini when AI_PROVIDER=gemini', () => {
      process.env.AI_PROVIDER = 'gemini';
      assert.strictEqual(config.getAIProvider(), 'gemini');
    });

    it('should select ollama when AI_PROVIDER=ollama', () => {
      process.env.AI_PROVIDER = 'ollama';
      assert.strictEqual(config.getAIProvider(), 'ollama');
    });

    it('should default to gemini for unknown provider names', () => {
      process.env.AI_PROVIDER = 'unknown';
      assert.strictEqual(config.getAIProvider(), 'gemini');
    });

    it('should default to gemini when AI_PROVIDER is not set', () => {
      delete process.env.AI_PROVIDER;
      assert.strictEqual(config.getAIProvider(), 'gemini');
    });
  });

  describe('Configuration validation', () => {
    it('should report configured when gemini has API key', () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';
      assert.strictEqual(config.isAIConfigured(), true);
    });

    it('should report not configured when gemini API key is missing', () => {
      process.env.AI_PROVIDER = 'gemini';
      delete process.env.GEMINI_API_KEY;
      assert.strictEqual(config.isAIConfigured(), false);
    });

    it('should report configured when ollama has base URL explicitly set', () => {
      process.env.AI_PROVIDER = 'ollama';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      assert.strictEqual(config.isAIConfigured(), true);
    });

    it('should report not configured when ollama base URL is not explicitly set', () => {
      process.env.AI_PROVIDER = 'ollama';
      delete process.env.OLLAMA_BASE_URL;
      assert.strictEqual(config.isAIConfigured(), false);
    });

    it('should read custom timeout from env', () => {
      process.env.AI_TIMEOUT_MS = '5000';
      assert.strictEqual(config.getTimeoutMs(), 5000);
    });

    it('should fall back to default timeout for invalid value', () => {
      process.env.AI_TIMEOUT_MS = 'not-a-number';
      assert.strictEqual(config.getTimeoutMs(), 30000);
    });

    it('should read rate limit config from env', () => {
      process.env.AI_RATE_LIMIT_WINDOW_MS = '120000';
      process.env.AI_RATE_LIMIT_MAX = '20';
      assert.strictEqual(config.getRateLimitWindowMs(), 120000);
      assert.strictEqual(config.getRateLimitMax(), 20);
    });

    it('should not expose secrets in aiService.getConfig()', () => {
      process.env.GEMINI_API_KEY = 'secret-key-123';
      const exposed = aiService.getConfig();
      assert.strictEqual(exposed.gemini.configured, true);
      assert.strictEqual(exposed.gemini.apiKey, undefined);
      assert.strictEqual(exposed.gemini.model, 'gemini-2.0-flash');
    });
  });

  describe('Provider failure and fallback', () => {
    it('should throw when not configured', async () => {
      process.env.AI_PROVIDER = 'gemini';
      delete process.env.GEMINI_API_KEY;
      delete process.env.OLLAMA_BASE_URL;
      process.env.AI_FALLBACK_ENABLED = 'false';

      await assert.rejects(
        async () => aiService.generate({ messages: [{ role: 'user', content: 'test' }] }),
        /not configured/i
      );
    });

    it('should throw when fallback is disabled and primary fails', async () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.AI_FALLBACK_ENABLED = 'false';

      const geminiProvider = aiService.getProvider('gemini');
      const originalGenerate = geminiProvider.generate;
      geminiProvider.generate = async () => {
        throw new Error('Gemini is down');
      };

      await assert.rejects(
        async () => aiService.generate({ messages: [{ role: 'user', content: 'test' }] }),
        /AI generation failed/i
      );

      geminiProvider.generate = originalGenerate;
    });

    it('should attempt fallback provider when primary fails', async () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      process.env.AI_FALLBACK_ENABLED = 'true';

      const geminiProvider = aiService.getProvider('gemini');
      const originalGeminiGenerate = geminiProvider.generate;
      geminiProvider.generate = async () => {
        throw new Error('Gemini is down');
      };

      const ollamaProvider = aiService.getProvider('ollama');
      const originalOllamaGenerate = ollamaProvider.generate;
      const originalOllamaConfigured = ollamaProvider.isConfigured;
      ollamaProvider.isConfigured = () => true;
      ollamaProvider.generate = async () => ({
        content: 'Ollama response',
        parsedJson: null,
        provider: 'ollama',
        tokensUsed: 10,
        latencyMs: 50,
      });

      const result = await aiService.generate({
        messages: [{ role: 'user', content: 'test' }],
      });

      assert.strictEqual(result.provider, 'ollama');
      assert.strictEqual(result.content, 'Ollama response');

      geminiProvider.generate = originalGeminiGenerate;
      ollamaProvider.generate = originalOllamaGenerate;
      ollamaProvider.isConfigured = originalOllamaConfigured;
    });

    it('should throw when all providers fail', async () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      process.env.AI_FALLBACK_ENABLED = 'true';

      const geminiProvider = aiService.getProvider('gemini');
      const originalGeminiGenerate = geminiProvider.generate;
      geminiProvider.generate = async () => {
        throw new Error('Gemini is down');
      };

      const ollamaProvider = aiService.getProvider('ollama');
      const originalOllamaGenerate = ollamaProvider.generate;
      const originalOllamaConfigured = ollamaProvider.isConfigured;
      ollamaProvider.isConfigured = () => true;
      ollamaProvider.generate = async () => {
        throw new Error('Ollama is down');
      };

      await assert.rejects(
        async () => aiService.generate({ messages: [{ role: 'user', content: 'test' }] }),
        /All AI providers failed/i
      );

      geminiProvider.generate = originalGeminiGenerate;
      ollamaProvider.generate = originalOllamaGenerate;
      ollamaProvider.isConfigured = originalOllamaConfigured;
    });
  });

  describe('Structured output validation in generate', () => {
    it('should parse JSON when jsonMode is true and content is valid', async () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.AI_FALLBACK_ENABLED = 'false';

      const geminiProvider = aiService.getProvider('gemini');
      const originalGenerate = geminiProvider.generate;
      geminiProvider.generate = async () => ({
        content: '{"title": "Test", "description": "A test listing"}',
        parsedJson: null,
        provider: 'gemini',
        tokensUsed: 10,
        latencyMs: 50,
      });

      const result = await aiService.generate({
        messages: [{ role: 'user', content: 'test' }],
        jsonMode: true,
        jsonSchema: { required: ['title'] },
      });

      assert.ok(result.parsedJson !== null);
      assert.strictEqual(result.parsedJson!.title, 'Test');

      geminiProvider.generate = originalGenerate;
    });

    it('should throw when jsonMode is true and content is invalid JSON', async () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.AI_FALLBACK_ENABLED = 'false';

      const geminiProvider = aiService.getProvider('gemini');
      const originalGenerate = geminiProvider.generate;
      geminiProvider.generate = async () => ({
        content: 'This is not JSON at all',
        parsedJson: null,
        provider: 'gemini',
        tokensUsed: 10,
        latencyMs: 50,
      });

      await assert.rejects(
        async () =>
          aiService.generate({
            messages: [{ role: 'user', content: 'test' }],
            jsonMode: true,
          }),
        /AI generation failed/i
      );

      geminiProvider.generate = originalGenerate;
    });

    it('should throw when jsonMode is true and required fields are missing', async () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.AI_FALLBACK_ENABLED = 'false';

      const geminiProvider = aiService.getProvider('gemini');
      const originalGenerate = geminiProvider.generate;
      geminiProvider.generate = async () => ({
        content: '{"title": "Test"}',
        parsedJson: null,
        provider: 'gemini',
        tokensUsed: 10,
        latencyMs: 50,
      });

      await assert.rejects(
        async () =>
          aiService.generate({
            messages: [{ role: 'user', content: 'test' }],
            jsonMode: true,
            jsonSchema: { required: ['title', 'description'] },
          }),
        /AI generation failed/i
      );

      geminiProvider.generate = originalGenerate;
    });
  });

  describe('Provider health checks', () => {
    it('geminiProvider should report not configured without API key', async () => {
      process.env.AI_PROVIDER = 'gemini';
      delete process.env.GEMINI_API_KEY;

      const geminiProvider = aiService.getProvider('gemini');
      const health = await geminiProvider.healthCheck();

      assert.strictEqual(health.provider, 'gemini');
      assert.strictEqual(health.configured, false);
      assert.strictEqual(health.available, false);
      assert.ok(health.error !== undefined);
    });

    it('ollamaProvider should report not configured without base URL', async () => {
      process.env.AI_PROVIDER = 'ollama';
      delete process.env.OLLAMA_BASE_URL;

      const ollamaProvider = aiService.getProvider('ollama');
      const health = await ollamaProvider.healthCheck();

      assert.strictEqual(health.provider, 'ollama');
      assert.strictEqual(health.configured, false);
      assert.strictEqual(health.available, false);
      assert.ok(health.error !== undefined);
    });
  });
});
