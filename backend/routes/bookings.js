const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getHostBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');
const { authenticate } = require('../middlewares/auth');
const { requireHost, requireTraveler } = require('../middlewares/roleAuth');
const {
  validateBooking,
  validateObjectId
} = require('../middlewares/validation');

// All routes require authentication
router.use(authenticate);

// Traveler routes
router.post('/', requireTraveler, validateBooking, createBooking);
router.get('/my-bookings', requireTraveler, getUserBookings);
router.get('/:id', validateObjectId('id'), getBooking);
router.patch('/:id/cancel', requireTraveler, validateObjectId('id'), cancelBooking);

// Host routes
router.get('/host/bookings', requireHost, getHostBookings);
router.patch('/:id/status', requireHost, validateObjectId('id'), updateBookingStatus);

module.exports = router;