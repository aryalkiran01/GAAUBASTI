export {};
const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

webhookLogSchema.index({ createdAt: 1 }, { expiresAfterSeconds: 86400 * 30 });

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
