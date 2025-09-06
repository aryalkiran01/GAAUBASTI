const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllBookings,
  getAllUsers,
  updateUser,
  getAllListings,
  verifyListing,
  deleteListing,
  deactivateUser,
  reactivateUser,
  getFlaggedReviews,
  moderateReview,
  getAnalytics
} = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/roleAuth');
const { validateObjectId } = require('../middlewares/validation');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard and analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', validateObjectId('id'), updateUser);
router.patch('/users/:id/deactivate', validateObjectId('id'), deactivateUser);
router.patch('/users/:id/reactivate', validateObjectId('id'), reactivateUser);

// Listing management
router.get('/listings', getAllListings);
router.get('/bookings', getAllBookings);
router.patch('/listings/:id/verify', validateObjectId('id'), verifyListing);
router.delete('/listings/:id', validateObjectId('id'), deleteListing);

// Review moderation
router.get('/reviews/flagged', getFlaggedReviews);
router.patch('/reviews/:id/moderate', validateObjectId('id'), moderateReview);

module.exports = router;