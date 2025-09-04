const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// Create new review
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, ratings } = req.body;

    // Find the booking
    const booking = await Booking.findById(bookingId).populate('listing');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the guest who made the booking
    if (booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own bookings'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed stays'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create review
    const review = new Review({
      listing: booking.listing._id,
      guest: req.user._id,
      booking: bookingId,
      rating,
      comment,
      ratings
    });

    await review.save();

    // Populate review details
    await review.populate([
      { path: 'guest', select: 'name avatar' },
      { path: 'listing', select: 'title' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get reviews for a listing
const getListingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { 
      listing: req.params.listingId,
      isPublic: true
    };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('guest', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ guest: req.user._id })
        .populate('listing', 'title location images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ guest: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update review (guest only, within 30 days)
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user can edit this review
    if (!review.canBeEdited(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews within 30 days of creation'
      });
    }

    const { rating, comment, ratings } = req.body;

    // Update review
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    if (ratings) review.ratings = { ...review.ratings, ...ratings };

    await review.save();

    await review.populate([
      { path: 'guest', select: 'name avatar' },
      { path: 'listing', select: 'title' }
    ]);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete review (guest or admin)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check permissions
    const isOwner = review.guest.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Host response to review
const respondToReview = async (req, res) => {
  try {
    const { comment } = req.body;
    const review = await Review.findById(req.params.id).populate('listing');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the host of the listing
    if (review.listing.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can respond to reviews'
      });
    }

    // Check if host has already responded
    if (review.hostResponse.comment) {
      return res.status(400).json({
        success: false,
        message: 'Host has already responded to this review'
      });
    }

    // Add host response
    review.hostResponse = {
      comment,
      respondedAt: new Date()
    };

    await review.save();

    await review.populate([
      { path: 'guest', select: 'name avatar' },
      { path: 'listing', select: 'title' }
    ]);

    res.json({
      success: true,
      message: 'Response added successfully',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to respond to review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Flag review (any authenticated user)
const flagReview = async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.isFlagged) {
      return res.status(400).json({
        success: false,
        message: 'Review is already flagged'
      });
    }

    review.isFlagged = true;
    review.flagReason = reason;
    await review.save();

    res.json({
      success: true,
      message: 'Review flagged for moderation'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to flag review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createReview,
  getListingReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  respondToReview,
  flagReview
};