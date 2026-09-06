export {};
const AuditLog = require('../models/AuditLog');

const SENSITIVE_KEYS = ['password', 'token', 'jwt', 'secret', 'apiKey', 'authorization', 'stripeKey', 'privateKey', 'otp'];

const sanitizeMetadata = (metadata: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata || {})) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 500) {
      cleaned[key] = value.slice(0, 500) + '...[truncated]';
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

const logSecurityEvent = async (params: {
  category: string;
  event: string;
  userId?: string;
  ip?: string;
  metadata?: Record<string, any>;
}): Promise<void> => {
  try {
    const { category, event, userId, ip, metadata } = params;
    await AuditLog.create({
      actor: userId || null,
      action: `security_${category}_${event}`,
      targetType: 'System',
      targetId: userId || null,
      after: {
        category,
        event,
        ip: ip || null,
        ...sanitizeMetadata(metadata || {}),
      },
    });
  } catch (err: any) {
    console.error('Failed to log security event:', err.message);
  }
};

const logAuthFailure = (userId: string | null, reason: string, ip?: string) =>
  logSecurityEvent({ category: 'auth', event: 'failure', userId: userId || undefined, ip, metadata: { reason } });

const logPaymentFailure = (userId: string, bookingId: string, reason: string, metadata?: Record<string, any>) =>
  logSecurityEvent({ category: 'payment', event: 'failure', userId, metadata: { bookingId, reason, ...metadata } });

const logBookingFailure = (userId: string, listingId: string, reason: string, metadata?: Record<string, any>) =>
  logSecurityEvent({ category: 'booking', event: 'failure', userId, metadata: { listingId, reason, ...metadata } });

const logWebhookFailure = (event: string, reason: string, metadata?: Record<string, any>) =>
  logSecurityEvent({ category: 'webhook', event: 'failure', metadata: { event, reason, ...metadata } });

const logAIFailure = (userId: string | null, feature: string, reason: string, metadata?: Record<string, any>) =>
  logSecurityEvent({ category: 'ai', event: 'failure', userId: userId || undefined, metadata: { feature, reason, ...metadata } });

const logNotificationFailure = (userId: string, channel: string, reason: string, metadata?: Record<string, any>) =>
  logSecurityEvent({ category: 'notification', event: 'failure', userId, metadata: { channel, reason, ...metadata } });

const logImageUploadFailure = (userId: string, reason: string, metadata?: Record<string, any>) =>
  logSecurityEvent({ category: 'image_upload', event: 'failure', userId, metadata: { reason, ...metadata } });

const logServerError = (error: Error, context?: Record<string, any>) =>
  logSecurityEvent({ category: 'server', event: 'error', metadata: { message: error.message, stack: error.stack?.slice(0, 500), ...context } });

module.exports = {
  logSecurityEvent,
  logAuthFailure,
  logPaymentFailure,
  logBookingFailure,
  logWebhookFailure,
  logAIFailure,
  logNotificationFailure,
  logImageUploadFailure,
  logServerError,
  sanitizeMetadata,
  SENSITIVE_KEYS,
};
