export {};
    import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth';
import { getConversations, getOrCreateConversation, getMessages, sendMessage } from '../controllers/conversationController';

router.use(authenticate);
router.get('/', getConversations);
router.post('/', getOrCreateConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;
