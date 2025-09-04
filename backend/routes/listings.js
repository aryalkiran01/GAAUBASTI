const express = require('express');
const router = express.Router();
const {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getHostListings,
  checkAvailability,
  getFeaturedListings
} = require('../controllers/listingController');
const { authenticate, requireHost } = require('../middlewares/auth');
const {
  validateListing,
  validateObjectId,
  validateListingQuery
} = require('../middlewares/validation');

// Public routes
router.get('/', validateListingQuery, getListings);
router.get('/featured', getFeaturedListings);
router.get('/:id', validateObjectId('id'), getListing);
router.get('/:id/availability', validateObjectId('id'), checkAvailability);

// Protected routes
router.use(authenticate);

// Host routes
router.post('/', requireHost, validateListing, createListing);
router.get('/host/my-listings', requireHost, getHostListings);
router.put('/:id', requireHost, validateObjectId('id'), validateListing, updateListing);
router.delete('/:id', requireHost, validateObjectId('id'), deleteListing);

module.exports = router;