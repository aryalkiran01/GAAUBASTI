import express from 'express';
import { createBooking, getUserBookings, getHostBookings, getBooking, updateBookingStatus, cancelBooking } from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireHost, requireGuest, requireTraveler } from '../middlewares/roleAuth.js';
import { validateBooking, validateObjectId } from '../middlewares/validation.js';
import { bookingCreateLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Traveler routes
router.post('/', bookingCreateLimiter, requireGuest, validateBooking, createBooking);
router.get('/my-bookings', requireTraveler, getUserBookings);
router.get('/:id', validateObjectId('id'), getBooking);
router.patch('/:id/cancel', requireTraveler, validateObjectId('id'), cancelBooking);

// Host routes
router.get('/host/bookings', requireHost, getHostBookings);
router.patch('/:id/status', requireHost, validateObjectId('id'), updateBookingStatus);

export default router;