export {};

const {
  authorize,
  requireRole,
  requireAdmin,
  requireHost,
  requireGuest,
  requireTraveler,
  requireOwnership,
  requireOwnershipOrAdmin
} = require('./auth');

module.exports = {
  authorize,
  requireRole,
  requireAdmin,
  requireHost,
  requireGuest,
  requireTraveler,
  requireOwnership,
  requireOwnershipOrAdmin
};
