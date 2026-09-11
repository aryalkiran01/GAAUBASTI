export {};
const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  period: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'paid', 'failed', 'approved', 'cancelled'],
    default: 'pending',
    index: true
  },
  payoutMethod: {
    type: String,
    enum: ['manual', 'bank_transfer', 'esewa', 'khalti', 'stripe_connect'],
    default: 'manual'
  },
  payoutMethodDetails: {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    branchName: { type: String, trim: true },
    esewaId: { type: String, trim: true },
    khaltiId: { type: String, trim: true }
  },
  reference: {
    type: String,
    trim: true
  },
  failureReason: {
    type: String,
    trim: true
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

payoutSchema.index({ host: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index(
  { host: 1, period: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'processing', 'approved', 'paid', 'completed'] } } }
);

module.exports = mongoose.model('Payout', payoutSchema);
