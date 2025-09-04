const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'Listing is required']
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Guest is required']
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  guests: {
    adults: {
      type: Number,
      required: true,
      min: 1
    },
    children: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  priceBreakdown: {
    basePrice: Number,
    cleaningFee: Number,
    serviceFee: Number,
    taxes: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String, // External payment processor ID
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkInTime: String,
  checkOutTime: String,
  guestNotes: String,
  hostNotes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
bookingSchema.index({ guest: 1, createdAt: -1 });
bookingSchema.index({ host: 1, createdAt: -1 });
bookingSchema.index({ listing: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

// Virtual for number of nights
bookingSchema.virtual('nights').get(function() {
  const timeDiff = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for total guests
bookingSchema.virtual('totalGuests').get(function() {
  return this.guests.adults + this.guests.children;
});

// Validation: End date must be after start date
bookingSchema.pre('validate', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

// Validation: Booking dates cannot be in the past
bookingSchema.pre('validate', function(next) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  
  if (this.startDate < now) {
    next(new Error('Booking dates cannot be in the past'));
  } else {
    next();
  }
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const timeDiff = this.startDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // Can cancel if booking is pending/confirmed and at least 1 day before check-in
  return ['pending', 'confirmed'].includes(this.status) && daysDiff >= 1;
};

// Method to calculate refund amount based on cancellation policy
bookingSchema.methods.calculateRefund = function(cancellationPolicy = 'moderate') {
  if (!this.canBeCancelled()) return 0;
  
  const now = new Date();
  const timeDiff = this.startDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  switch (cancellationPolicy) {
    case 'flexible':
      return daysDiff >= 1 ? this.totalPrice : 0;
    case 'moderate':
      if (daysDiff >= 5) return this.totalPrice;
      if (daysDiff >= 1) return this.totalPrice * 0.5;
      return 0;
    case 'strict':
      if (daysDiff >= 7) return this.totalPrice;
      if (daysDiff >= 3) return this.totalPrice * 0.5;
      return 0;
    default:
      return 0;
  }
};

module.exports = mongoose.model('Booking', bookingSchema);