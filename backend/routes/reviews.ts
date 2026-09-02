export {};
  import express from 'express';
const router = express.Router();
import { createReview, getListingReviews, getUserReviews, updateReview, deleteReview, respondToReview, flagReview } from '../controllers/reviewController';
import { authenticate } from '../middlewares/auth';
import { requireHost, requireTraveler } from '../middlewares/roleAuth';
import { validateReview, validateObjectId } from '../middlewares/validation';

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

export default router;
