import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    enum: ['property_misrepresentation', 'payment', 'damages', 'safety', 'host_no_show', 'guest_no_show', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'dismissed'],
    default: 'open',
    index: true,
  },
  resolution: {
    type: String,
    trim: true,
    default: '',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  responses: [
    {
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      body: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Response cannot exceed 2000 characters'],
      },
      isStaff: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, {
  timestamps: true,
});

disputeSchema.index({ booking: 1, status: 1 });

export default mongoose.model('Dispute', disputeSchema);
