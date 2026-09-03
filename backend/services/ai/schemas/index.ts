export {};

/**
 * Shared JSON schemas for AI structured output validation.
 * Future features will add their own schemas here.
 */

// Example schema for health check — validates a simple status response
export const HEALTH_CHECK_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['operational', 'degraded', 'down'] },
  },
  required: ['status'],
  additionalProperties: false,
};

// Placeholder schemas for future features — not yet implemented per Phase 5 Step 1 instructions
// export const LISTING_GENERATION_SCHEMA = { ... };
// export const CHATBOT_RESPONSE_SCHEMA = { ... };
// export const PRICING_OPTIMIZATION_SCHEMA = { ... };
// export const MESSAGE_ASSISTANCE_SCHEMA = { ... };
// export const MODERATION_SCHEMA = { ... };
// export const SEMANTIC_SEARCH_SCHEMA = { ... };
// export const SUMMARY_SCHEMA = { ... };
// export const TRANSLATION_SCHEMA = { ... };
