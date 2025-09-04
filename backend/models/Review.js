const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  // Detailed ratings
  ratings: {
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    checkIn: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracy: {
      type: Number,
      min: 1,
      max: 5
    },
    location: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  images: [{
    url: String,
    publicId: String,
    caption: String
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Host response
  hostResponse: {
    comment: String,
    respondedAt: Date
  },
  // Moderation
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
reviewSchema.index({ listing: 1, createdAt: -1 });
reviewSchema.index({ guest: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ isPublic: 1, isVerified: 1 });

// Ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true });

// Virtual for helpful votes (can be implemented later)
reviewSchema.virtual('helpfulVotes').get(function() {
  return 0; // Placeholder for future implementation
});

// Update listing's average rating after review save/update/delete
reviewSchema.post('save', async function() {
  await this.constructor.updateListingRating(this.listing);
});

reviewSchema.post('remove', async function() {
  await this.constructor.updateListingRating(this.listing);
});

// Static method to update listing rating
reviewSchema.statics.updateListingRating = async function(listingId) {
  const Listing = mongoose.model('Listing');
  const listing = await Listing.findById(listingId);
  if (listing) {
    await listing.updateRating();
  }
};

// Method to check if review can be edited
reviewSchema.methods.canBeEdited = function(userId) {
  // Reviews can be edited by the guest who wrote them within 30 days
  const daysSinceCreated = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  return this.guest.toString() === userId.toString() && daysSinceCreated <= 30;
};

module.exports = mongoose.model('Review', reviewSchema);