export {};
const aiService = require('../services/ai/aiService');

// GET /api/ai/health
// Returns the health status of the configured AI provider(s)
const getHealth = async (req, res) => {
  try {
    const health = await aiService.checkHealth();
    const config = aiService.getConfig();

    res.json({
      success: true,
      data: {
        configured: aiService.isAIConfigured(),
        provider: config.provider,
        fallbackEnabled: config.fallbackEnabled,
        ...health,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'AI health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// GET /api/ai/config
// Returns safe (non-secret) AI configuration
const getConfig = async (req, res) => {
  try {
    const config = aiService.getConfig();
    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get AI config',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// POST /api/ai/test
// Sends a minimal test prompt to verify end-to-end AI connectivity
const testProvider = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Set AI_PROVIDER and corresponding credentials.',
      });
    }

    const response = await aiService.testGeneration();

    res.json({
      success: true,
      data: {
        provider: response.provider,
        content: response.content,
        latencyMs: response.latencyMs,
        tokensUsed: response.tokensUsed,
      },
    });
  } catch (error: any) {
    res.status(502).json({
      success: false,
      message: 'AI test generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getHealth,
  getConfig,
  testProvider,
};
