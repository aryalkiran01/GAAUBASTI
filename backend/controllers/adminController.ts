import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';
import Transaction from '../models/Transaction.js';
import { getSuspiciousListings, moderateListing, getPendingHostVerifications, reviewHostVerification } from '../services/suspiciousListingService.js';
import { logAdminAction } from '../middlewares/auditLogger.js';


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
  } catch (error: any) {
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

    const filter: any = {};
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
  } catch (error: any) {
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

    const before = await User.findById(req.params.id).select('name email role isActive isVerified');

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

    await logAdminAction({
      actor: req.user._id,
      action: 'user_update',
      targetType: 'User',
      targetId: user._id,
      before: before ? before.toObject() : {},
      after: { name, email, role, isActive, isVerified }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error: any) {
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

    const filter: any = {};
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
  } catch (error: any) {
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

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVerified must be a boolean'
      });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const before = { isVerified: listing.isVerified, verifiedAt: listing.verifiedAt, verifiedBy: listing.verifiedBy };

    listing.isVerified = isVerified;
    listing.verifiedAt = isVerified ? new Date() : null;
    listing.verifiedBy = isVerified ? req.user._id : null;
    if (notes) listing.adminNotes = notes;

    await listing.save();
    await listing.populate('host', 'name email');

    await logAdminAction({
      actor: req.user._id,
      action: isVerified ? 'listing_verify' : 'listing_reject',
      targetType: 'Listing',
      targetId: listing._id,
      before,
      after: { isVerified, verifiedAt: listing.verifiedAt, verifiedBy: listing.verifiedBy }
    });

    res.json({
      success: true,
      message: `Listing ${isVerified ? 'verified' : 'rejected'} successfully`,
      data: { listing }
    });
  } catch (error: any) {
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

    const filter: any = {};
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
  } catch (error: any) {
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
  } catch (error: any) {
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
    const { action, reason } = req.body;

    if (!['approve', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be approve or remove'
      });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (action === 'approve') {
      review.isFlagged = false;
      review.flagReason = reason || null;
      review.isVerified = true;
      review.isPublic = true;
    } else if (action === 'remove') {
      review.isPublic = false;
      review.isFlagged = false;
      review.flagReason = reason || null;
    }

    const before = { isFlagged: review.isFlagged, isPublic: review.isPublic, flagReason: review.flagReason };

    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();

    await review.save();

    await logAdminAction({
      actor: req.user._id,
      action: `review_${action}`,
      targetType: 'Review',
      targetId: review._id,
      before,
      after: { isFlagged: review.isFlagged, isPublic: review.isPublic, flagReason: review.flagReason }
    });

    res.json({
      success: true,
      message: `Review ${action}d successfully`,
      data: { review }
    });
  } catch (error: any) {
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
  } catch (error: any) {
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

    await logAdminAction({
      actor: req.user._id,
      action: 'user_deactivate',
      targetType: 'User',
      targetId: user._id,
      before: { isActive: true },
      after: { isActive: false, reason: reason || '' }
    });

    res.json({
      success: true,
      message: 'User account deactivated successfully',
      data: { user }
    });
  } catch (error: any) {
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
  } catch (error: any) {
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

    await logAdminAction({
      actor: req.user._id,
      action: 'listing_delete',
      targetType: 'Listing',
      targetId: listing._id,
      before: { isActive: true },
      after: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { actor, action, targetType, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (actor) filter.actor = actor;
    if (action) filter.action = { $regex: String(action), $options: 'i' };
    if (targetType) filter.targetType = targetType;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalLogs: total
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getReportsForAdmin = async (req, res) => {
  try {
    const { status, reportedEntityType, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (reportedEntityType) filter.reportedEntityType = reportedEntityType;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Report.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalReports: total
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { getDashboardStats, getAllBookings, getAllUsers, updateUser, getAllListings, verifyListing, deleteListing, deactivateUser, reactivateUser, getFlaggedReviews, moderateReview, getAnalytics, getAuditLogs, getReportsForAdmin, getSuspiciousListingsHandler, moderateListingHandler, getPendingHostVerificationsHandler, reviewHostVerificationHandler, getFinancialRecords };

// Get suspicious listings with risk scores
const getSuspiciousListingsHandler = async (req, res) => {
  try {
    const { page = 1, limit = 20, minScore, status } = req.query;
    const result = await getSuspiciousListings({
      page: parseInt(page),
      limit: parseInt(limit),
      minScore: minScore ? parseInt(minScore) : 20,
      status: status as string | undefined
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suspicious listings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Moderate a flagged listing (approve/reject/flag)
const moderateListingHandler = async (req, res) => {
  try {
    const { action, notes } = req.body;

    if (!['approve', 'reject', 'flag'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be approve, reject, or flag'
      });
    }

    const listing = await moderateListing(req.params.id, req.user._id, action, notes);

    res.json({
      success: true,
      message: `Listing ${action}d successfully`,
      data: { listing }
    });
  } catch (error: any) {
    const status = error.message === 'Listing not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to moderate listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get pending host verification requests
const getPendingHostVerificationsHandler = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await getPendingHostVerifications({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending host verifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Approve or reject a host verification request
const reviewHostVerificationHandler = async (req, res) => {
  try {
    const { decision, notes } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be approved or rejected'
      });
    }

    const user = await reviewHostVerification(req.params.id, req.user._id, decision, notes);

    res.json({
      success: true,
      message: `Host verification ${decision} successfully`,
      data: { user }
    });
  } catch (error: any) {
    const status = error.message === 'User not found' ? 404 : error.message.includes('No pending') ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to review host verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get financial records (transactions) with filtering
const getFinancialRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, direction, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (direction) filter.direction = direction;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total, summary] = await Promise.all([
      Transaction.find(filter)
        .populate('user', 'name email')
        .populate('booking', 'listing')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCommission: { $sum: '$commissionAmount' },
            totalHostEarnings: { $sum: '$hostEarnings' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const summaryData = summary.length > 0 ? summary[0] : { totalAmount: 0, totalCommission: 0, totalHostEarnings: 0, count: 0 };

    res.json({
      success: true,
      data: {
        transactions,
        summary: summaryData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTransactions: total
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};