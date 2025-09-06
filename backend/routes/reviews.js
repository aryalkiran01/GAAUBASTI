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
const { authenticate } = require('../middlewares/auth');
const { requireHost, requireTraveler } = require('../middlewares/roleAuth');
const {
  validateReview,
  validateObjectId
} = require('../middlewares/validation');

// Public routes
router.get('/listing/:listingId', validateObjectId('listingId'), getListingReviews);

// Protected routes
router.use(authenticate);

router.post('/', requireTraveler, validateReview, createReview);
router.get('/my-reviews', requireTraveler, getUserReviews);
router.put('/:id', requireTraveler, validateObjectId('id'), validateReview, updateReview);
router.delete('/:id', requireTraveler, validateObjectId('id'), deleteReview);
router.post('/:id/flag', requireTraveler, validateObjectId('id'), flagReview);

// Host routes
router.post('/:id/respond', requireHost, validateObjectId('id'), respondToReview);

module.exports = router;