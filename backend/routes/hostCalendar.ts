export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireHost } = require('../middlewares/roleAuth');
const { validateObjectId } = require('../middlewares/validation');
const { getHostCalendar, blockDates, unblockDates } = require('../controllers/hostCalendarController');

router.use(authenticate);
router.get('/:listingId', validateObjectId('listingId'), getHostCalendar);
router.post('/:listingId/block', validateObjectId('listingId'), requireHost, blockDates);
router.post('/:listingId/unblock', validateObjectId('listingId'), requireHost, unblockDates);

module.exports = router;
