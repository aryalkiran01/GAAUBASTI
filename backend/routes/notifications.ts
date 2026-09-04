import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth.js';
import { getNotifications, getUnreadCount, markNotificationRead, markAllRead } from '../controllers/notificationController.js';

router.use(authenticate);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllRead);

export default router;
