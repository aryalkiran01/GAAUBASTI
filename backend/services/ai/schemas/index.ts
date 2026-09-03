export {};

const HEALTH_CHECK_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['operational', 'degraded', 'down'] },
  },
  required: ['status'],
  additionalProperties: false,
};

const LISTING_GENERATION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['title', 'description'],
  additionalProperties: false,
};

const HELP_ASSISTANT_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    articleIds: { type: 'array', items: { type: 'string' } },
    found: { type: 'boolean' },
  },
  required: ['answer', 'found'],
  additionalProperties: false,
};

const PRICING_SCHEMA = {
  type: 'object',
  properties: {
    recommendedPrice: { type: 'number' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    reasoning: { type: 'string' },
    comparableCount: { type: 'number' },
  },
  required: ['recommendedPrice', 'confidence', 'reasoning'],
  additionalProperties: false,
};

const MESSAGE_REPLY_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          tone: { type: 'string', enum: ['friendly', 'concise', 'detailed'] },
        },
        required: ['text', 'tone'],
      },
    },
  },
  required: ['suggestions'],
  additionalProperties: false,
};

const MODERATION_SCHEMA = {
  type: 'object',
  properties: {
    flagged: { type: 'boolean' },
    severity: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
    categories: { type: 'array', items: { type: 'string' } },
    reason: { type: 'string' },
    suggestedAction: { type: 'string', enum: ['none', 'review', 'remove'] },
  },
  required: ['flagged', 'severity', 'reason', 'suggestedAction'],
  additionalProperties: false,
};

const REVIEW_SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    pros: { type: 'array', items: { type: 'string' } },
    cons: { type: 'array', items: { type: 'string' } },
    sentiment: { type: 'string', enum: ['positive', 'mixed', 'negative'] },
  },
  required: ['summary', 'pros', 'cons', 'sentiment'],
  additionalProperties: false,
};

const SEMANTIC_SEARCH_SCHEMA = {
  type: 'object',
  properties: {
    city: { type: 'string' },
    category: { type: 'string' },
    minPrice: { type: 'number' },
    maxPrice: { type: 'number' },
    minBedrooms: { type: 'number' },
    minBathrooms: { type: 'number' },
    minGuests: { type: 'number' },
    sortBy: { type: 'string' },
    searchTerms: { type: 'array', items: { type: 'string' } },
  },
  required: [],
  additionalProperties: false,
};

const TRANSLATION_SCHEMA = {
  type: 'object',
  properties: {
    translated: { type: 'string' },
    original: { type: 'string' },
  },
  required: ['translated', 'original'],
  additionalProperties: false,
};

module.exports = {
  HEALTH_CHECK_SCHEMA,
  LISTING_GENERATION_SCHEMA,
  HELP_ASSISTANT_SCHEMA,
  PRICING_SCHEMA,
  MESSAGE_REPLY_SCHEMA,
  MODERATION_SCHEMA,
  REVIEW_SUMMARY_SCHEMA,
  SEMANTIC_SEARCH_SCHEMA,
  TRANSLATION_SCHEMA,
};
