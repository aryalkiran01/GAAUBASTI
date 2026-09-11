const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again later.'
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password-reset attempts. Please try again later.'
});

const bookingCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    const authHeader = req.headers.authorization || '';
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }
    return req.ip || 'anonymous';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many booking creation requests. Please try again later.'
});

const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '60000', 10) || 60000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || '10', 10) || 10,
  keyGenerator: (req) => {
    const authHeader = req.headers.authorization || '';
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }
    return req.ip || 'anonymous';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many AI requests. Please try again later.'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many registration requests from this IP. Please try again later.'
});

const limiters = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  passwordLimiter,
  bookingCreateLimiter,
  aiLimiter
};

module.exports = limiters;
module.exports.default = limiters;

export {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  passwordLimiter,
  bookingCreateLimiter,
  aiLimiter
};
