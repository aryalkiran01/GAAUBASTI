const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: String,
    country: {
      type: String,
      default: 'Nepal'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // For Cloudinary
    caption: String
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  maxGuests: {
    type: Number,
    required: [true, 'Maximum guests is required'],
    min: [1, 'Must accommodate at least 1 guest']
  },
  bedrooms: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Bedrooms cannot be negative']
  },
  bathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Bathrooms cannot be negative']
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host is required']
  },
  category: {
    type: String,
    enum: ['homestay', 'cottage', 'villa', 'traditional', 'treehouse', 'cabin'],
    default: 'homestay'
  },
  houseRules: [{
    type: String,
    trim: true
  }],
  checkInTime: {
    type: String,
    default: '15:00'
  },
  checkOutTime: {
    type: String,
    default: '11:00'
  },
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'moderate'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Availability calendar
  unavailableDates: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],
  // Statistics
  totalBookings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
listingSchema.index({ 'location.city': 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ averageRating: -1 });
listingSchema.index({ host: 1 });
listingSchema.index({ isActive: 1, isVerified: 1 });
listingSchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries

// Virtual for reviews
listingSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'listing'
});

// Virtual for bookings
listingSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'listing'
});

// Method to check availability for given dates
listingSchema.methods.isAvailable = function(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return !this.unavailableDates.some(unavailable => {
    const unavailableStart = new Date(unavailable.startDate);
    const unavailableEnd = new Date(unavailable.endDate);
    
    return (start <= unavailableEnd && end >= unavailableStart);
  });
};

// Method to add unavailable dates
listingSchema.methods.addUnavailableDates = function(startDate, endDate, reason = 'Booked') {
  this.unavailableDates.push({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    reason
  });
  return this.save();
};

// Update average rating when reviews change
listingSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { listing: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    this.reviewCount = stats[0].reviewCount;
  } else {
    this.averageRating = 0;
    this.reviewCount = 0;
  }
  
  return this.save();
};

module.exports = mongoose.model('Listing', listingSchema);