export {};
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking is required'],
    index: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'Listing is required']
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payer is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  provider: {
    type: String,
    enum: ['mock', 'stripe', 'esewa'],
    default: 'mock'
  },
  providerPaymentId: {
    type: String,
    index: true
  },
  idempotencyKey: {
    type: String,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

paymentSchema.index({ booking: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
paymentSchema.index(
  { booking: 1, payer: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'processing', 'paid'] }
    }
  }
);

module.exports = mongoose.model('Payment', paymentSchema);

