export {};
    import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth';
import { getNotifications, markNotificationRead } from '../controllers/notificationController';

router.use(authenticate);
router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
