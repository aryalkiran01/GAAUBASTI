export {};
const aiService = require('../services/ai/aiService');
const {
  listingDescriptionPrompt,
  helpAssistantPrompt,
  pricingPrompt,
  messageReplyPrompt,
  moderationPrompt,
  reviewSummaryPrompt,
  semanticSearchPrompt,
  translationPrompt,
} = require('../services/ai/prompts/index');
const {
  LISTING_GENERATION_SCHEMA,
  HELP_ASSISTANT_SCHEMA,
  PRICING_SCHEMA,
  MESSAGE_REPLY_SCHEMA,
  MODERATION_SCHEMA,
  REVIEW_SUMMARY_SCHEMA,
  SEMANTIC_SEARCH_SCHEMA,
  TRANSLATION_SCHEMA,
} = require('../services/ai/schemas/index');
const Listing = require('../models/Listing');
const Article = require('../models/Article');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const handleAIError = (res, error, defaultMessage) => {
  const message = error.message || defaultMessage;
  if (message.includes('not configured')) {
    return res.status(503).json({ success: false, message: 'AI service is not configured. Set AI_PROVIDER and corresponding credentials.' });
  }
  if (message.includes('timed out')) {
    return res.status(504).json({ success: false, message: 'AI request timed out. Please try again.' });
  }
  if (message.includes('All AI providers failed')) {
    return res.status(502).json({ success: false, message: 'AI service is currently unavailable. Please try again later.' });
  }
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === 'development' ? message : undefined,
  });
};

// GET /api/ai/health
const getHealth = async (req, res) => {
  try {
    const health = await aiService.checkHealth();
    const config = aiService.getConfig();
    res.json({
      success: true,
      data: { configured: aiService.isAIConfigured(), provider: config.provider, fallbackEnabled: config.fallbackEnabled, ...health },
    });
  } catch (error) {
    handleAIError(res, error, 'AI health check failed');
  }
};

// GET /api/ai/config
const getConfig = async (req, res) => {
  try {
    res.json({ success: true, data: aiService.getConfig() });
  } catch (error) {
    handleAIError(res, error, 'Failed to get AI config');
  }
};

// POST /api/ai/test
const testProvider = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const response = await aiService.testGeneration();
    res.json({ success: true, data: { provider: response.provider, content: response.content, latencyMs: response.latencyMs, tokensUsed: response.tokensUsed } });
  } catch (error) {
    handleAIError(res, error, 'AI test generation failed');
  }
};

// POST /api/ai/listing-description
// Auth: host or admin only
const generateListingDescription = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const prompt = listingDescriptionPrompt(req.body);
    const response = await aiService.generate({
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      maxTokens: 512,
      temperature: 0.7,
      jsonMode: true,
      jsonSchema: LISTING_GENERATION_SCHEMA,
      timeoutMs: 20000,
    });
    res.json({ success: true, data: { title: response.parsedJson.title, description: response.parsedJson.description, provider: response.provider } });
  } catch (error) {
    handleAIError(res, error, 'Failed to generate listing description');
  }
};

// POST /api/ai/help-assistant
// Auth: any authenticated user
const helpAssistant = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const { question } = req.body;
    if (!question || question.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'A question of at least 3 characters is required.' });
    }
    const articles = await Article.find({ published: true }).select('title content slug').limit(20).lean();
    const prompt = helpAssistantPrompt({ question, articles });
    const response = await aiService.generate({
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      maxTokens: 512,
      temperature: 0.3,
      jsonMode: true,
      jsonSchema: HELP_ASSISTANT_SCHEMA,
      timeoutMs: 20000,
    });
    res.json({ success: true, data: { answer: response.parsedJson.answer, articleIds: response.parsedJson.articleIds || [], found: response.parsedJson.found, provider: response.provider } });
  } catch (error) {
    handleAIError(res, error, 'Failed to get help assistant response');
  }
};

// POST /api/ai/pricing-recommendation
// Auth: host or admin only
const pricingRecommendation = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ success: false, message: 'listingId is required.' });
    }
    const listing = await Listing.findById(listingId).lean();
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }
    // Only the listing owner or an admin can request pricing recommendations
    if (req.user.role !== 'admin' && listing.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only get pricing for your own listings.' });
    }

    // Gather real marketplace data: comparable listings in same city
    const comparables = await Listing.find({
      _id: { $ne: listing._id },
      isActive: true,
      isVerified: true,
      'location.city': listing.location?.city,
      price: { $gt: 0 },
    }).select('price bedrooms bathrooms category averageRating location.city').limit(15).lean();

    const prices = comparables.map((c) => c.price);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : listing.price;
    const sortedPrices = prices.sort((a, b) => a - b);
    const medianPrice = sortedPrices.length > 0 ? sortedPrices[Math.floor(sortedPrices.length / 2)] : listing.price;
    const minPrice = sortedPrices.length > 0 ? sortedPrices[0] : listing.price;
    const maxPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : listing.price;

    const locStr = listing.location ? `${listing.location.city}, ${listing.location.country}` : 'Nepal';
    const prompt = pricingPrompt({
      listing: { ...listing, location: locStr },
      comparables,
      stats: { avgPrice: Math.round(avgPrice), medianPrice, minPrice, maxPrice },
    });

    const response = await aiService.generate({
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      maxTokens: 256,
      temperature: 0.3,
      jsonMode: true,
      jsonSchema: PRICING_SCHEMA,
      timeoutMs: 20000,
    });
    res.json({ success: true, data: { ...response.parsedJson, provider: response.provider, comparableCount: comparables.length } });
  } catch (error) {
    handleAIError(res, error, 'Failed to get pricing recommendation');
  }
};

// POST /api/ai/message-replies
// Auth: any authenticated user (must be conversation participant)
const suggestMessageReplies = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'conversationId is required.' });
    }
    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    const participantIds = (conversation.participants || []).map((p) => (typeof p === 'object' ? p._id?.toString() : p.toString()));
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a participant in this conversation.' });
    }

    const messages = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 }).limit(20).populate('sender', 'name').lean();
    const listing = conversation.listing ? await Listing.findById(conversation.listing).select('title').lean() : null;

    const prompt = messageReplyPrompt({
      messages,
      listingTitle: listing?.title,
      currentUserRole: req.user.role,
    });

    const response = await aiService.generate({
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      maxTokens: 256,
      temperature: 0.6,
      jsonMode: true,
      jsonSchema: MESSAGE_REPLY_SCHEMA,
      timeoutMs: 15000,
    });
    res.json({ success: true, data: { suggestions: response.parsedJson.suggestions, provider: response.provider } });
  } catch (error) {
    handleAIError(res, error, 'Failed to generate message replies');
  }
};

// POST /api/ai/moderate
// Auth: host or admin only
const moderateContent = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const { contentType, content } = req.body;
    if (!contentType || !content) {
      return res.status(400).json({ success: false, message: 'contentType and content are required.' });
    }
    if (content.length > 4000) {
      return res.status(400).json({ success: false, message: 'Content exceeds maximum length of 4000 characters.' });
    }
    const prompt = moderationPrompt({ contentType, content });
    const response = await aiService.generate({
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      maxTokens: 256,
      temperature: 0.2,
      jsonMode: true,
      jsonSchema: MODERATION_SCHEMA,
      timeoutMs: 15000,
    });
    res.json({ success: true, data: { ...response.parsedJson, provider: response.provider } });
  } catch (error) {
    handleAIError(res, error, 'Failed to moderate content');
  }
};

// POST /api/ai/review-summary
// Auth: any authenticated user (public listing data)
const reviewSummary = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ success: false, message: 'listingId is required.' });
    }
    const listing = await Listing.findById(listingId).select('title averageRating reviewCount').lean();
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }
    const reviews = await Review.find({ listing: listingId, isPublic: true }).select('rating comment').sort({ createdAt: -1 }).limit(30).lean();
    if (reviews.length === 0) {
      return res.json({ success: true, data: { summary: 'No reviews have been submitted for this listing yet.', pros: [], cons: [], sentiment: 'mixed', provider: null } });
    }
    const prompt = reviewSummaryPrompt({
      listingTitle: listing.title,
      averageRating: listing.averageRating,
      reviewCount: listing.reviewCount,
      reviews,
    });
    const response = await aiService.generate({
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      maxTokens: 384,
      temperature: 0.3,
      jsonMode: true,
      jsonSchema: REVIEW_SUMMARY_SCHEMA,
      timeoutMs: 20000,
    });
    res.json({ success: true, data: { ...response.parsedJson, provider: response.provider } });
  } catch (error) {
    handleAIError(res, error, 'Failed to generate review summary');
  }
};

// POST /api/ai/semantic-search
// Auth: any authenticated user
const semanticSearch = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const { query } = req.body;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'A search query of at least 2 characters is required.' });
    }
    const prompt = semanticSearchPrompt({ query });
    const response = await aiService.generate({
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      maxTokens: 256,
      temperature: 0.1,
      jsonMode: true,
      jsonSchema: SEMANTIC_SEARCH_SCHEMA,
      timeoutMs: 15000,
    });

    // Apply the extracted filters to actual listing queries
    const filters = response.parsedJson;
    const dbQuery: any = { isActive: true, isVerified: true };
    if (filters.city) dbQuery['location.city'] = { $regex: filters.city, $options: 'i' };
    if (filters.category) dbQuery.category = filters.category;
    if (filters.minPrice !== undefined) dbQuery.price = { ...dbQuery.price, $gte: filters.minPrice };
    if (filters.maxPrice !== undefined) dbQuery.price = { ...dbQuery.price, $lte: filters.maxPrice };
    if (filters.minBedrooms !== undefined) dbQuery.bedrooms = { $gte: filters.minBedrooms };
    if (filters.minBathrooms !== undefined) dbQuery.bathrooms = { $gte: filters.minBathrooms };
    if (filters.minGuests !== undefined) dbQuery.maxGuests = { $gte: filters.minGuests };

    let sort: any = {};
    if (filters.sortBy === 'price_asc') sort = { price: 1 };
    else if (filters.sortBy === 'price_desc') sort = { price: -1 };
    else if (filters.sortBy === 'rating_desc') sort = { averageRating: -1 };
    else if (filters.sortBy === 'newest') sort = { createdAt: -1 };

    let listings = await Listing.find(dbQuery).sort(sort).limit(20).lean();

    // If searchTerms provided, do a text filter on title/description
    if (filters.searchTerms && filters.searchTerms.length > 0) {
      const termsRegex = filters.searchTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      if (termsRegex) {
        const regex = new RegExp(termsRegex, 'i');
        listings = listings.filter((l) => regex.test(l.title) || regex.test(l.description));
      }
    }

    res.json({ success: true, data: { filters, listings, provider: response.provider } });
  } catch (error) {
    handleAIError(res, error, 'Failed to process semantic search');
  }
};

// POST /api/ai/translate
// Auth: any authenticated user
const translate = async (req, res) => {
  try {
    if (!aiService.isAIConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }
    const { text, from, to } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Text to translate is required.' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ success: false, message: 'Text exceeds maximum length of 2000 characters.' });
    }
    const validPairs = [['en', 'ne'], ['ne', 'en']];
    const pair = [from, to];
    const isValid = validPairs.some((p) => p[0] === pair[0] && p[1] === pair[1]);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Translation is only supported between English (en) and Nepali (ne).' });
    }
    const prompt = translationPrompt({ text, from, to });
    const response = await aiService.generate({
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
      maxTokens: 1024,
      temperature: 0.2,
      jsonMode: true,
      jsonSchema: TRANSLATION_SCHEMA,
      timeoutMs: 20000,
    });
    res.json({ success: true, data: { translated: response.parsedJson.translated, original: response.parsedJson.original, provider: response.provider } });
  } catch (error) {
    handleAIError(res, error, 'Failed to translate text');
  }
};

module.exports = {
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
};
