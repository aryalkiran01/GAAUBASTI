const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isBlacklisted } = require('../controllers/authController');

const toUserId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value._id) return value._id.toString();
  return value.toString();
};

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }

  throw new Error('JWT_SECRET environment variable is required');
};

const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      acc[name.trim()] = decodeURIComponent(rest.join('='));
    }
    return acc;
  }, {} as Record<string, string>);
};

// Verify JWT token from cookie or Authorization header
const authenticate = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.cookie) {
      const parsed = parseCookies(req.headers.cookie);
      token = parsed.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please log in again.'
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

const requireAdmin = authorize('admin');
const requireHost = authorize('host', 'admin');

const requireOwnershipOrAdmin = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const resourceIdentifier = req.resource && typeof req.resource === 'object'
      ? toUserId(req.resource[resourceField])
      : toUserId(req.params.id || req.params.userId);

    const userId = toUserId(req.user._id);

    if (!resourceIdentifier || userId !== resourceIdentifier) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

const authModule = {
  authenticate,
  authorize,
  requireAdmin,
  requireHost,
  requireOwnershipOrAdmin
};

module.exports = authModule;
module.exports.default = authModule;

export {
  authenticate,
  authorize,
  requireAdmin,
  requireHost,
  requireOwnershipOrAdmin
};
