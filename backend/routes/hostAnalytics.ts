export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireHost } = require('../middlewares/roleAuth');
const { getHostAnalytics, getHostEarnings } = require('../controllers/hostAnalyticsController');

router.use(authenticate);
router.get('/', requireHost, getHostAnalytics);
router.get('/earnings', requireHost, getHostEarnings);

module.exports = router;
