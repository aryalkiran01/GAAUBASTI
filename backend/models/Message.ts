export {};
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  body: {
    type: String,
    trim: true,
    maxlength: [4000, 'Message cannot exceed 4000 characters']
  },
  attachments: [{
    type: String,
    trim: true
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deliveredAt: {
    type: Date,
    default: Date.now
  },
  systemType: {
    type: String,
    enum: ['booking_created', 'booking_confirmed', 'booking_cancelled', 'system'],
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
