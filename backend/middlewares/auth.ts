const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isBlacklisted } = require('../controllers/authController');

const toUserId = (value: any) => {
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
const authenticate = async (req: any, res: any, next: any) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers?.cookie) {
      const parsed = parseCookies(req.headers.cookie);
      token = parsed.token;
    }

    if (!token) {
      token = req.header('Authorization')?.replace('Bearer ', '');
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

    const decoded: any = jwt.verify(token, getJwtSecret());
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
const authorize = (...rolesOrArray: any[]) => {
  const roles = (Array.isArray(rolesOrArray[0]) ? rolesOrArray[0] : rolesOrArray) as string[];
  return (req: any, res: any, next: any) => {
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

const requireRole = authorize;
const requireAdmin = authorize('admin');
const requireHost = authorize('host', 'admin');
const requireGuest = authorize('guest');
const requireTraveler = authorize('guest', 'host', 'admin');

const requireOwnership = (Model: any, resourceField: string = 'host') => {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    try {
      if (!req.params?.id) {
        return res.status(400).json({
          success: false,
          message: 'Resource identifier is required.'
        });
      }

      const resource = await Model.findById(req.params.id);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      const ownerId = toUserId(resource[resourceField]);
      const currentUserId = toUserId(req.user._id);

      if (!ownerId || ownerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch {
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

const requireOwnershipOrAdmin = (resourceField: string = 'user') => {
  return (req: any, res: any, next: any) => {
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
  requireRole,
  requireAdmin,
  requireHost,
  requireGuest,
  requireTraveler,
  requireOwnership,
  requireOwnershipOrAdmin
};

module.exports = authModule;
module.exports.default = authModule;

export {
  authenticate,
  authorize,
  requireRole,
  requireAdmin,
  requireHost,
  requireGuest,
  requireTraveler,
  requireOwnership,
  requireOwnershipOrAdmin
};
