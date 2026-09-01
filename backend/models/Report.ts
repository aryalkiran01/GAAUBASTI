export {};
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportedEntityType: {
    type: String,
    enum: ['listing', 'user', 'message'],
    required: true,
    trim: true
  },
  reportedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'dismissed'],
    default: 'open',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
