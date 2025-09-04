const express = require('express');
const router = express.Router();
const {
  createReview,
  getListingReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  respondToReview,
  flagReview
} = require('../controllers/reviewController');
const { authenticate, requireHost } = require('../middlewares/auth');
const {
  validateReview,
  validateObjectId
} = require('../middlewares/validation');

// Public routes
router.get('/listing/:listingId', validateObjectId('listingId'), getListingReviews);

// Protected routes
router.use(authenticate);

router.post('/', validateReview, createReview);
router.get('/my-reviews', getUserReviews);
router.put('/:id', validateObjectId('id'), validateReview, updateReview);
router.delete('/:id', validateObjectId('id'), deleteReview);
router.post('/:id/flag', validateObjectId('id'), flagReview);

// Host routes
router.post('/:id/respond', requireHost, validateObjectId('id'), respondToReview);

module.exports = router;