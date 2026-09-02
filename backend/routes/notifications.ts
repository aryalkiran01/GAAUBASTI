export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { getNotifications, getUnreadCount, markNotificationRead, markAllRead } = require('../controllers/notificationController');

router.use(authenticate);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllRead);

module.exports = router;
