export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');
const { getRecommendedListings, getSimilarListings, getRecentlyViewed, trackRecentlyViewed } = require('../controllers/recommendationController');

router.get('/recommended', authenticate, getRecommendedListings);
router.get('/recently-viewed', authenticate, getRecentlyViewed);
router.get('/:listingId/similar', validateObjectId('listingId'), getSimilarListings);
router.post('/:listingId/track-view', validateObjectId('listingId'), trackRecentlyViewed);

module.exports = router;
