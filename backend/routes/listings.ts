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
router.get('/:id', validateObjectId('id'), getListing);
router.get('/:id/availability', validateObjectId('id'), checkAvailability);

// Protected routes
router.use(authenticate);

// Host routes - multi-image upload (up to 10 files)
router.post('/', requireHost, upload.array('images', 10), validateListing, createListing);
router.get('/host/my-listings', requireHost, getHostListings);
router.put('/:id', requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), upload.array('images', 10), validateListing, updateListing);
router.delete('/:id', requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), deleteListing);
router.post('/:id/publish', requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), publishListing);
router.post('/:id/unpublish', requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), unpublishListing);

export default router;
