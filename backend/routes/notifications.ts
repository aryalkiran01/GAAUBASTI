const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');
const { getNotifications, getUnreadCount, markNotificationRead, markAllRead } = require('../controllers/notificationController');

router.use(authenticate);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', validateObjectId('id'), markNotificationRead);

export default router;
