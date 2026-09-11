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
    village: {
      type: String,
      trim: true,
      default: ''
    },
    district: {
      type: String,
      trim: true,
      default: ''
    },
    province: {
      type: String,
      trim: true,
      default: ''
    },
    state: String,
    country: {
      type: String,
      default: 'Nepal'
    },
    geoJSON: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined
      }
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
  },
  adminNotes: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  safetyAndEmergency: {
    emergencyContactName: {
      type: String,
      trim: true,
      default: ''
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    nearbyHospital: {
      type: String,
      trim: true,
      default: ''
    },
    policeStationContact: {
      type: String,
      trim: true,
      default: ''
    },
    safetyNotes: [{
      type: String,
      trim: true
    }],
    importantLocationNotes: {
      type: String,
      trim: true,
      default: ''
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
listingSchema.index({ 'location.city': 1 });
listingSchema.index({ 'location.village': 1 });
listingSchema.index({ 'location.district': 1 });
listingSchema.index({ 'location.province': 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ averageRating: -1 });
listingSchema.index({ host: 1 });
listingSchema.index({ isActive: 1, isVerified: 1 });
listingSchema.index({ 'location.geoJSON': '2dsphere' }); // For geospatial queries

// Synchronize coordinates and geoJSON on save
listingSchema.pre('save', function(this: any, next: (err?: Error) => void) {
  if (this.location) {
    // If coordinates.latitude and longitude exist, sync to geoJSON
    if (
      this.location.coordinates &&
      typeof this.location.coordinates.latitude === 'number' &&
      typeof this.location.coordinates.longitude === 'number' &&
      !isNaN(this.location.coordinates.latitude) &&
      !isNaN(this.location.coordinates.longitude)
    ) {
      this.location.geoJSON = {
        type: 'Point',
        coordinates: [this.location.coordinates.longitude, this.location.coordinates.latitude]
      };
    } else if (
      this.location.geoJSON &&
      Array.isArray(this.location.geoJSON.coordinates) &&
      this.location.geoJSON.coordinates.length === 2 &&
      typeof this.location.geoJSON.coordinates[0] === 'number' &&
      typeof this.location.geoJSON.coordinates[1] === 'number'
    ) {
      this.location.coordinates = {
        latitude: this.location.geoJSON.coordinates[1],
        longitude: this.location.geoJSON.coordinates[0]
      };
    }
  }
  next();
});

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

// Manual blocked-date check only. Actual booking inventory is enforced by the
// centralized availability service in backend/services/bookingAvailability.js.
listingSchema.methods.isAvailable = function(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return !this.unavailableDates.some(unavailable => {
    const unavailableStart = new Date(unavailable.startDate);
    const unavailableEnd = new Date(unavailable.endDate);

    return (start < unavailableEnd && end > unavailableStart);
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

export = mongoose.model('Listing', listingSchema);
