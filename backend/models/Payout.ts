export {};
  import mongoose from 'mongoose';

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
  period: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  payoutMethod: {
    type: String,
    default: 'manual'
  },
  reference: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Payout', payoutSchema);
