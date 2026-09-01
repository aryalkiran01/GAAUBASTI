export {};
  import express from 'express';
const router = express.Router();
import { getListings, getListing, createListing, updateListing, deleteListing, getHostListings, checkAvailability, getFeaturedListings } from '../controllers/listingController';
import Listing from '../models/Listing';

import { authenticate } from '../middlewares/auth';
import { requireHost, requireOwnership } from '../middlewares/roleAuth';
import { validateListing, validateObjectId, validateListingQuery } from '../middlewares/validation';

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
router.put('/:id', requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), validateListing, updateListing);
router.delete('/:id', requireHost, validateObjectId('id'), requireOwnership(Listing, 'host'), deleteListing);


module.exports = router;
