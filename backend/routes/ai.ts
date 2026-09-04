import express from 'express';
const router = express.Router();
import {
  getHealth,
  getConfig,
  testProvider,
  generateListingDescription,
  helpAssistant,
  pricingRecommendation,
  suggestMessageReplies,
  moderateContent,
  reviewSummary,
  semanticSearch,
  translate,
} from '../controllers/aiController.js';
import { authenticate, requireHost } from '../middlewares/auth.js';
import { aiLimiter } from '../middlewares/rateLimiters.js';

// Public health check — no auth required so monitoring tools can probe it
router.get('/health', getHealth);

// Protected routes — require authentication
router.use(authenticate);

// Any authenticated user
router.get('/config', getConfig);
router.post('/test', aiLimiter, testProvider);
router.post('/help-assistant', aiLimiter, helpAssistant);
router.post('/message-replies', aiLimiter, suggestMessageReplies);
router.post('/review-summary', aiLimiter, reviewSummary);
router.post('/semantic-search', aiLimiter, semanticSearch);
router.post('/translate', aiLimiter, translate);

// Host or admin only
router.post('/listing-description', aiLimiter, requireHost, generateListingDescription);
router.post('/pricing-recommendation', aiLimiter, requireHost, pricingRecommendation);
router.post('/moderate', aiLimiter, requireHost, moderateContent);

export default router;
