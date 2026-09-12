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
  getFeaturedListings,
  publishListing,
  unpublishListing
} = require('../controllers/listingController');
const Listing = require('../models/Listing');

const { authenticate } = require('../middlewares/auth');
const { requireHost, requireOwnership } = require('../middlewares/roleAuth');
const {
  validateListing,
  validateObjectId,
  validateListingQuery
} = require('../middlewares/validation');
const { upload } = require('../utils/cloudinary');

// Public routes
router.get('/', validateListingQuery, getListings);
router.get('/featured', getFeaturedListings);

// Host specific routes (defined before wildcard :id routes)
router.get('/host/my-listings', authenticate, requireHost, getHostListings);

// Parameterized public routes
router.get('/:id', validateObjectId('id'), getListing);
router.get('/:id/availability', validateObjectId('id'), checkAvailability);

// Protected host routes
router.post('/', authenticate, requireHost, upload.array('images', 10), validateListing, createListing);
router.put('/:id', authenticate, requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), upload.array('images', 10), validateListing, updateListing);
router.delete('/:id', authenticate, requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), deleteListing);
router.post('/:id/publish', authenticate, requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), publishListing);
router.post('/:id/unpublish', authenticate, requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), unpublishListing);

export default router;
