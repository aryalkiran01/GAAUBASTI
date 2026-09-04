import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;