export {};
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Listing = require('../models/Listing');
const { notifyUsers, notifyNewMessage } = require('../utils/notifications');
const { moderateContent } = require('../services/moderationService');

const normalizeParticipants = (participants = [], currentUserId) => {
  const ids = participants
    .map((id) => String(id))
    .filter(Boolean);

  if (currentUserId) ids.push(String(currentUserId));

  return [...new Set(ids)];
};

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name avatar role')
      .populate('listing', 'title images price')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, data: { conversations } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getOrCreateConversation = async (req, res) => {
  try {
    const { listingId, bookingId, participantIds = [] } = req.body;
    const listing = listingId ? await Listing.findById(listingId) : null;

    if (listingId && !listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const participants = normalizeParticipants(participantIds, req.user._id);

    const existing = await Conversation.findOne({
      listing: listingId || undefined,
      booking: bookingId || undefined,
      participants: { $all: participants, $size: participants.length }
    }).populate('participants', 'name avatar role');

    if (existing) {
      return res.json({ success: true, data: { conversation: existing } });
    }

    const conversation = await Conversation.create({
      participants: participants.map((id) => id),
      listing: listingId,
      booking: bookingId,
      lastMessageAt: new Date()
    });

    await conversation.populate('participants', 'name avatar role');
    res.status(201).json({ success: true, data: { conversation } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create conversation', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((participant) => participant.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You do not belong to this conversation' });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: { conversation, messages } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const sendMessage = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );
    if (!isParticipant) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You do not belong to this conversation",
        });
    }

    const { body, attachments = [] } = req.body;
    if (
      (!body || !String(body).trim()) &&
      (!Array.isArray(attachments) || attachments.length === 0)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Message body or attachment is required",
        });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      body: body ? String(body).trim() : "",
      attachments: Array.isArray(attachments)
        ? attachments.filter(Boolean)
        : [],
      readBy: [req.user._id],
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Non-blocking AI moderation of message content
    if (body && String(body).trim()) {
      moderateContent({
        contentType: 'message',
        content: String(body),
        actorId: req.user._id,
        targetType: 'Message',
        targetId: message._id,
      }).catch(() => {});
    }

    await message.populate("sender", "name avatar role");
    const recipientIds = conversation.participants.filter(
      (participant) => participant.toString() !== req.user._id.toString(),
    );

    const User = require("../models/User");
    const senderUser = await User.findById(req.user._id).select("name");

    // Send individual notification with proper message field to each recipient
    for (const recipientId of recipientIds) {
      const recipient = await User.findById(recipientId).select("name email");
      if (recipient && senderUser) {
        await notifyNewMessage({
          conversation,
          sender: senderUser,
          recipient,
        }).catch((err) => {
          console.error("Failed to send notification:", err);
        });
      }
    }

    if (global.io) {
      global.io.to(conversation._id.toString()).emit("message:new", {
        conversationId: conversation._id,
        message: { ...message.toObject(), sender: message.sender },
      });
    }

    res.status(201).json({ success: true, data: { message } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to send message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage
};
