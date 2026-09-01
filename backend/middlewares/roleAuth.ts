export {};

const toObjectIdString = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value._id) return value._id.toString();
  return value.toString();
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
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

const requireAdmin = requireRole(['admin']);
const requireHost = requireRole(['host', 'admin']);
const requireGuest = requireRole(['guest']);
const requireTraveler = requireRole(['guest', 'host', 'admin']);

const requireOwnership = (Model, resourceField = 'host') => {
  return async (req, res, next) => {
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

      const ownerId = toObjectIdString(resource[resourceField]);
      const currentUserId = toObjectIdString(req.user._id);

      if (!ownerId || ownerId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireHost,
  requireGuest,
  requireTraveler,
  requireOwnership
};

