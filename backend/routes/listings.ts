import express from 'express';
import Listing from '../models/Listing.js';
import { getListings, getListing, createListing, updateListing, deleteListing, getHostListings, checkAvailability, getFeaturedListings } from '../controllers/listingController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireHost, requireOwnership } from '../middlewares/roleAuth.js';
import { validateListing, validateObjectId, validateListingQuery } from '../middlewares/validation.js';

const router = express.Router();

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

export default router;