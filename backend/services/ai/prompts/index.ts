export {};

/**
 * Shared prompt templates for AI features.
 * Each function returns a system message and user message pair.
 * Future features (listing generation, chatbot, etc.) will add their own prompt builders here.
 */

// Base system prompt that all AI features share
export const BASE_SYSTEM_PROMPT =
  'You are an AI assistant for Gau Basti, a platform for authentic Nepali homestays, cottages, and unique stays in rural Nepal. ' +
  'Always respond in a helpful, professional, and culturally respectful manner. ' +
  'When asked to return JSON, return ONLY valid JSON with no markdown formatting, no code blocks, and no extra text.';

// Health check prompt — a simple test prompt to verify provider connectivity
export const HEALTH_CHECK_PROMPT = {
  system: BASE_SYSTEM_PROMPT,
  user: 'Respond with exactly: "AI service is operational."',
};

// Placeholder for future prompt builders — not yet implemented per Phase 5 Step 1 instructions
// export const listingGenerationPrompt = (data: any) => { ... };
// export const chatbotPrompt = (data: any) => { ... };
// export const pricingOptimizationPrompt = (data: any) => { ... };
// export const messageAssistancePrompt = (data: any) => { ... };
// export const moderationPrompt = (data: any) => { ... };
// export const semanticSearchPrompt = (data: any) => { ... };
// export const summaryPrompt = (data: any) => { ... };
// export const translationPrompt = (data: any) => { ... };
