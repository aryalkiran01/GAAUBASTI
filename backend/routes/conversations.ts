import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth.js';
import { getConversations, getOrCreateConversation, getMessages, sendMessage, markMessagesRead, getUnreadCounts } from '../controllers/conversationController.js';

router.use(authenticate);
router.get('/', getConversations);
router.post('/', getOrCreateConversation);
router.get('/unread-counts', getUnreadCounts);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.patch('/:id/read', markMessagesRead);

export default router;
