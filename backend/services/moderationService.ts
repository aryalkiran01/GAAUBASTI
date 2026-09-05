export {};
const aiService = require('./ai/aiService');
const { moderationPrompt } = require('./ai/prompts/index');
const { MODERATION_SCHEMA } = require('./ai/schemas/index');
const AuditLog = require('../models/AuditLog');

const MAX_CONTENT_LENGTH = 4000;

const sanitizeForModeration = (content: string): string => {
  if (!content || typeof content !== 'string') return '';
  return content.slice(0, MAX_CONTENT_LENGTH);
};

const moderateContent = async (params: {
  contentType: string;
  content: string;
  actorId: string;
  targetType: string;
  targetId: string;
}): Promise<{ flagged: boolean; severity: string; categories: string[]; reason: string; suggestedAction: string } | null> => {
  const { contentType, content, actorId, targetType, targetId } = params;

  if (!content || content.trim().length === 0) {
    return null;
  }

  if (!aiService.isAIConfigured()) {
    return null;
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

    await AuditLog.create({
      actor: actorId,
      action: 'ai_moderation',
      targetType,
      targetId,
      before: {},
      after: {
        flagged: result.flagged,
        severity: result.severity,
        categories: result.categories || [],
        reason: result.reason,
        suggestedAction: result.suggestedAction,
        provider: response.provider,
      },
    }).catch((err: any) => {
      console.error('Failed to log moderation result:', err.message);
    });

    return {
      flagged: result.flagged,
      severity: result.severity,
      categories: result.categories || [],
      reason: result.reason,
      suggestedAction: result.suggestedAction,
    };
  } catch (error: any) {
    console.error('AI moderation failed (non-blocking):', error.message);
    return null;
  }
};

module.exports = {
  moderateContent,
  sanitizeForModeration,
};
