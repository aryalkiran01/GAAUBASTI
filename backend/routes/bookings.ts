export {};
  import express from 'express';
const router = express.Router();
import { createBooking, getUserBookings, getHostBookings, getBooking, updateBookingStatus, cancelBooking } from '../controllers/bookingController';
import { authenticate } from '../middlewares/auth';
import { requireHost, requireGuest, requireTraveler } from '../middlewares/roleAuth';
import { validateBooking, validateObjectId } from '../middlewares/validation';
import { bookingCreateLimiter } from '../middlewares/rateLimiters';

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

module.exports = router;
