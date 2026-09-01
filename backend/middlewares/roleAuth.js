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

// Specific role middleware
const requireAdmin = requireRole(['admin']);
const requireHost = requireRole(['host', 'admin']);
const requireTraveler = requireRole(['guest', 'host', 'admin']);

// Resource ownership check
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
      const resource = await Model.findById(req.params.id);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      const resourceOwnerId = resource[resourceField];
      const ownerId = resourceOwnerId && typeof resourceOwnerId === 'object' && resourceOwnerId._id
        ? resourceOwnerId._id.toString()
        : resourceOwnerId?.toString?.();

      if (!ownerId || ownerId !== req.user._id.toString()) {
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
  requireTraveler,
  requireOwnership
};
