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
const requireOwnership = (resourceField = 'host') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // For other roles, check ownership
    try {
      const Model = getModelByRoute(req.route.path);
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (resource[resourceField].toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

// Helper function to get model based on route
const getModelByRoute = (routePath) => {
  if (routePath.includes('listings')) {
    return require('../models/Listing');
  }
  if (routePath.includes('bookings')) {
    return require('../models/Booking');
  }
  if (routePath.includes('reviews')) {
    return require('../models/Review');
  }
  return null;
};

module.exports = {
  requireRole,
  requireAdmin,
  requireHost,
  requireTraveler,
  requireOwnership
};