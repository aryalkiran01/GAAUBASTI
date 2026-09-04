import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getConversations, getOrCreateConversation, getMessages, sendMessage } from '../controllers/conversationController.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getConversations);
router.post('/', getOrCreateConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

export default router;