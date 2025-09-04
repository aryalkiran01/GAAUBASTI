const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalListings,
      totalBookings,
      totalRevenue,
      pendingListings,
      flaggedReviews,
      recentUsers,
      recentBookings
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Listing.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Listing.countDocuments({ isVerified: false, isActive: true }),
      Review.countDocuments({ isFlagged: true }),
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt'),
      Booking.find()
        .populate('listing', 'title')
        .populate('guest', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalListings,
          totalBookings,
          totalRevenue: revenue,
          pendingListings,
          flaggedReviews
        },
        recentActivity: {
          recentUsers,
          recentBookings
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, isVerified } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive, isVerified },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all listings for admin
const getAllListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status === 'pending') filter.isVerified = false;
    if (status === 'verified') filter.isVerified = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('host', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Listing.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalListings: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify listing (admin only)
const verifyListing = async (req, res) => {
  try {
    const { isVerified, notes } = req.body;
    
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedBy: isVerified ? req.user._id : null
      },
      { new: true }
    ).populate('host', 'name email');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      message: `Listing ${isVerified ? 'verified' : 'rejected'} successfully`,
      data: { listing }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all bookings for admin
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('listing', 'title location')
        .populate('guest', 'name email')
        .populate('host', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBookings: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get flagged reviews
const getFlaggedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ isFlagged: true })
        .populate('guest', 'name email')
        .populate('listing', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ isFlagged: true })
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
      message: 'Failed to fetch flagged reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Moderate review (admin only)
const moderateReview = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve' or 'remove'
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (action === 'approve') {
      review.isFlagged = false;
      review.flagReason = null;
      review.isVerified = true;
    } else if (action === 'remove') {
      review.isPublic = false;
    }

    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    
    await review.save();

    res.json({
      success: true,
      message: `Review ${action}d successfully`,
      data: { review }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get platform analytics
const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const [
      userGrowth,
      bookingTrends,
      revenueData,
      topListings,
      locationStats
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Booking trends
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            bookings: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Revenue by status
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        }
      ]),
      
      // Top performing listings
      Listing.find({ isActive: true, isVerified: true })
        .sort({ averageRating: -1, reviewCount: -1 })
        .limit(10)
        .select('title location averageRating reviewCount totalBookings')
        .populate('host', 'name'),
      
      // Bookings by location
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $lookup: {
            from: 'listings',
            localField: 'listing',
            foreignField: '_id',
            as: 'listingData'
          }
        },
        { $unwind: '$listingData' },
        {
          $group: {
            _id: '$listingData.location.city',
            bookings: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        },
        { $sort: { bookings: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        period,
        userGrowth,
        bookingTrends,
        revenueData,
        topListings,
        locationStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Deactivate user account
const deactivateUser = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cancel all pending/confirmed bookings for this user
    await Booking.updateMany(
      {
        $or: [{ guest: req.params.id }, { host: req.params.id }],
        status: { $in: ['pending', 'confirmed'] }
      },
      {
        status: 'cancelled',
        cancellationReason: 'Account deactivated by admin',
        cancelledAt: new Date(),
        cancelledBy: req.user._id
      }
    );

    // Deactivate all listings if user is a host
    if (user.role === 'host') {
      await Listing.updateMany(
        { host: req.params.id },
        { isActive: false }
      );
    }

    res.json({
      success: true,
      message: 'User account deactivated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reactivate user account
const reactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User account reactivated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete listing (admin only)
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      listing: req.params.id,
      status: { $in: ['pending', 'confirmed'] },
      startDate: { $gte: new Date() }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete listing with active bookings'
      });
    }

    // Soft delete
    listing.isActive = false;
    await listing.save();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllBookings,
  getAllUsers,
  updateUser,
  getAllListings,
  verifyListing: require('./listingController').updateListing,
  deleteListing,
  deactivateUser,
  reactivateUser,
  getFlaggedReviews,
  moderateReview: require('./reviewController').flagReview,
  getAnalytics
};