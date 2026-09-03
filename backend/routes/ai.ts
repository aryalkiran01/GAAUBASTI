export {};
const express = require('express');
const router = express.Router();
const { getHealth, getConfig, testProvider } = require('../controllers/aiController');
const { authenticate, authorize } = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/rateLimiters');

// Public health check — no auth required so monitoring tools can probe it
router.get('/health', getHealth);

// Protected routes — require authentication
router.use(authenticate);

// Any authenticated user can see config (no secrets exposed)
router.get('/config', getConfig);

// Test endpoint — rate limited more aggressively, requires auth
router.post('/test', aiLimiter, testProvider);

module.exports = router;
