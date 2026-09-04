import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  requester: {
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
    enum: ['booking', 'payment', 'listing', 'account', 'safety', 'other'],
    default: 'other',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true,
  },
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
  },
  relatedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    default: null,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  resolvedAt: {
    type: Date,
    default: null,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

supportTicketSchema.index({ requester: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1 });

export default mongoose.model('SupportTicket', supportTicketSchema);
