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
const { authenticate, requireHost } = require('../middlewares/auth');
const {
  validateBooking,
  validateObjectId
} = require('../middlewares/validation');

// All routes require authentication
router.use(authenticate);

// Guest routes
router.post('/', validateBooking, createBooking);
router.get('/my-bookings', getUserBookings);
router.get('/:id', validateObjectId('id'), getBooking);
router.patch('/:id/cancel', validateObjectId('id'), cancelBooking);

// Host routes
router.get('/host/bookings', requireHost, getHostBookings);
router.patch('/:id/status', requireHost, validateObjectId('id'), updateBookingStatus);

module.exports = router;