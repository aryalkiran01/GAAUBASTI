export {};

const SENSITIVE_KEYS = [
  'password',
  'token',
  'jwt',
  'secret',
  'apikey',
  'auth',
  'authorization',
  'stripekey',
  'privatekey',
  'otp',
  'creditcard',
  'cvv',
  'cookie'
];

/**
 * Redacts sensitive fields from metadata objects
 */
export function sanitizeLogMetadata(metadata: any): any {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  if (Array.isArray(metadata)) {
    return metadata.map(sanitizeLogMetadata);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogMetadata(value);
    } else if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.slice(0, 500) + '...[truncated]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

class StructuredLogger {
  private formatLog(level: LogLevel, message: string, context?: Record<string, any>, err?: Error): LogPayload {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? sanitizeLogMetadata(context) : undefined
    };

    if (err) {
      payload.error = {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : err.stack?.slice(0, 300)
      };
    }

    return payload;
  }

  private output(payload: LogPayload) {
    const formatted = JSON.stringify(payload);
    if (payload.level === 'error') {
      console.error(formatted);
    } else if (payload.level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Optional Sentry capture if SENTRY_DSN is configured
    if (payload.level === 'error' && process.env.SENTRY_DSN && (global as any).Sentry) {
      try {
        (global as any).Sentry.captureMessage(payload.message, {
          level: 'error',
          extra: payload.context
        });
      } catch {
        // Safe failover
      }
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.output(this.formatLog('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    this.output(this.formatLog('warn', message, context));
  }

  error(message: string, errOrContext?: Error | Record<string, any>, context?: Record<string, any>) {
    if (errOrContext instanceof Error) {
      this.output(this.formatLog('error', message, context, errOrContext));
    } else {
      this.output(this.formatLog('error', message, errOrContext));
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      this.output(this.formatLog('debug', message, context));
    }
  }

  logApiError(req: any, err: Error, statusCode = 500) {
    this.error(`API Error [${req.method}] ${req.originalUrl || req.url}`, err, {
      statusCode,
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.user?._id?.toString(),
      ip: req.ip
    });
  }

  logPaymentFailure(userId: string, bookingId: string, reason: string, details?: Record<string, any>) {
    this.error(`Payment Failure: ${reason}`, undefined, {
      category: 'payment',
      userId,
      bookingId,
      reason,
      ...details
    });
  }

  logWebhookFailure(provider: string, reason: string, details?: Record<string, any>) {
    this.error(`Webhook Failure [${provider}]: ${reason}`, undefined, {
      category: 'webhook',
      provider,
      reason,
      ...details
    });
  }

  logJobFailure(jobName: string, reason: string, details?: Record<string, any>) {
    this.error(`Background Job Failure [${jobName}]: ${reason}`, undefined, {
      category: 'background_job',
      jobName,
      reason,
      ...details
    });
  }
}

export const logger = new StructuredLogger();
module.exports = { logger, sanitizeLogMetadata, StructuredLogger };
