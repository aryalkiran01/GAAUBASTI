export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { getNotifications, markNotificationRead } = require('../controllers/notificationController');

router.use(authenticate);
router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
