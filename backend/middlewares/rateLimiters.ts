export {};
  import rateLimit from 'express-rate-limit';

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

export {
  globalLimiter,
  loginLimiter,
  passwordLimiter,
  bookingCreateLimiter
};
