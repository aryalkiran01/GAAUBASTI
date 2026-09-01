export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { getConversations, getOrCreateConversation, getMessages, sendMessage } = require('../controllers/conversationController');

router.use(authenticate);
router.get('/', getConversations);
router.post('/', getOrCreateConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;
