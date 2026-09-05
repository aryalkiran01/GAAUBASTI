export {};
const aiService = require('./ai/aiService');
const { moderationPrompt } = require('./ai/prompts/index');
const { MODERATION_SCHEMA } = require('./ai/schemas/index');
const AuditLog = require('../models/AuditLog');

const MAX_CONTENT_LENGTH = 4000;

const sanitizeForModeration = (content) => {
  if (!content || typeof content !== 'string') return '';
  return content.slice(0, MAX_CONTENT_LENGTH);
};

// Deterministic fallback moderation for obvious prohibited content
const PROHIBITED_PATTERNS = [
  /\b(https?:\/\/[^\s]+)/gi, // URLs
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gi, // Email addresses
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone numbers
  /\b(buy|sell|purchase|discount|coupon|promo|free\s+shipping|limited\s+offer|click\s+here|visit\s+my)\b/gi, // Spam/commercial
  /\b(porn|xxx|adult\s+content|escort|prostitution)\b/gi, // Adult content
  /\b(gambling|casino|bet\s+now|sports\s+bet)\b/gi, // Gambling
  /\b(weapons?|firearm|ammunition|explosive)\b/gi, // Weapons
  /\b(illegal\s+drug|marijuana|cocaine|heroin|meth)\b/gi, // Drugs
  /\b(hate\s+speech|racial\s+slur|discriminat)\b/gi, // Hate speech
  /\b(kill\s+yourself|suicide\s+method|self-harm)\b/gi, // Self-harm
];

const runFallbackModeration = (content) => {
  const sanitized = sanitizeForModeration(content);
  if (!sanitized) {
    return { flagged: false, severity: 'none', categories: [], reason: 'Empty content', suggestedAction: 'allow' };
  }

  const matchedCategories = [];
  let maxSeverity = 'none';

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(sanitized)) {
      if (/porn|xxx|escort|prostitution/i.test(pattern.source)) {
        matchedCategories.push('adult_content');
        maxSeverity = 'high';
      } else if (/gambling|casino|bet/i.test(pattern.source)) {
        matchedCategories.push('gambling');
        maxSeverity = 'medium';
      } else if (/weapons?|firearm|explosive/i.test(pattern.source)) {
        matchedCategories.push('weapons');
        maxSeverity = 'high';
      } else if (/drug|marijuana|cocaine|heroin|meth/i.test(pattern.source)) {
        matchedCategories.push('drugs');
        maxSeverity = 'high';
      } else if (/hate|slur|discriminat/i.test(pattern.source)) {
        matchedCategories.push('hate_speech');
        maxSeverity = 'high';
      } else if (/kill|suicide|self-harm/i.test(pattern.source)) {
        matchedCategories.push('self_harm');
        maxSeverity = 'high';
      } else if (/buy|sell|purchase|discount|coupon|promo|free\s+shipping|limited\s+offer|click\s+here|visit\s+my/i.test(pattern.source)) {
        matchedCategories.push('spam');
        maxSeverity = 'medium';
      } else if (/https?|@|phone/i.test(pattern.source)) {
        matchedCategories.push('contact_info');
        maxSeverity = 'low';
      }
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
  }

  const flagged = matchedCategories.length > 0;
  return {
    flagged,
    severity: flagged ? maxSeverity : 'none',
    categories: [...new Set(matchedCategories)],
    reason: flagged ? 'Content matched prohibited patterns in fallback moderation' : 'No prohibited content detected',
    suggestedAction: flagged ? (maxSeverity === 'high' ? 'block' : 'flag') : 'allow'
  };
};

const logModerationResult = async ({ actorId, targetType, targetId, result, provider, aiAvailable }) => {
  try {
    await AuditLog.create({
      actor: actorId,
      action: aiAvailable ? 'ai_moderation' : 'fallback_moderation',
      targetType,
      targetId,
      before: {},
      after: {
        ...result,
        provider: provider || 'fallback',
        aiAvailable,
      },
    });
  } catch (err) {
    console.error('Failed to log moderation result:', err.message);
  }
};

const moderateContent = async (params) => {
  const { contentType, content, actorId, targetType, targetId } = params;

  if (!content || content.trim().length === 0) {
    return null;
  }

  if (!aiService.isAIConfigured()) {
    // AI unavailable — run deterministic fallback
    const fallbackResult = runFallbackModeration(content);
    console.log('[moderation] AI unavailable — fallback moderation applied');
    await logModerationResult({
      actorId,
      targetType,
      targetId,
      result: fallbackResult,
      provider: 'fallback',
      aiAvailable: false
    });
    return fallbackResult;
  }

  try {
    const prompt = moderationPrompt({ contentType, content: sanitizeForModeration(content) });
    const response = await aiService.generate({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      maxTokens: 256,
      temperature: 0.2,
      jsonMode: true,
      jsonSchema: MODERATION_SCHEMA,
      timeoutMs: 15000,
    });

    const result = response.parsedJson;

    await logModerationResult({
      actorId,
      targetType,
      targetId,
      result,
      provider: response.provider,
      aiAvailable: true
    });

    return {
      flagged: result.flagged,
      severity: result.severity,
      categories: result.categories || [],
      reason: result.reason,
      suggestedAction: result.suggestedAction,
    };
  } catch (error) {
    // AI failed — run fallback instead of returning null
    console.error('AI moderation failed, running fallback:', error.message);
    const fallbackResult = runFallbackModeration(content);
    await logModerationResult({
      actorId,
      targetType,
      targetId,
      result: fallbackResult,
      provider: 'fallback',
      aiAvailable: false
    });
    return fallbackResult;
  }
};

module.exports = {
  moderateContent,
  sanitizeForModeration,
  runFallbackModeration,
};
