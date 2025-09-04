const Listing = require('../models/Listing');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Get all listings with filtering and pagination
const getListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      location,
      minPrice,
      maxPrice,
      guests,
      rating,
      category,
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true, isVerified: true };

    if (location) {
      filter.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.address': { $regex: location, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (guests) {
      filter.maxGuests = { $gte: parseInt(guests) };
    }

    if (rating) {
      filter.averageRating = { $gte: parseFloat(rating) };
    }

    if (category) {
      filter.category = category;
    }

    if (amenities) {
      const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
      filter.amenities = { $in: amenityArray };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('host', 'name avatar hostProfile.responseRate')
        .sort(sort)
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
          totalListings: total,
          hasNextPage: skip + listings.length < total,
          hasPrevPage: parseInt(page) > 1
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

// Get single listing by ID
const getListing = async (req, res) => {
  try {
    const listing = await Listing.findOne({ 
      _id: req.params.id, 
      isActive: true 
    })
      .populate('host', 'name avatar hostProfile phone email')
      .populate({
        path: 'reviews',
        populate: {
          path: 'guest',
          select: 'name avatar'
        },
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: { listing }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new listing (hosts only)
const createListing = async (req, res) => {
  try {
    const listingData = {
      ...req.body,
      host: req.user._id
    };

    const listing = new Listing(listingData);
    await listing.save();

    await listing.populate('host', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: { listing }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update listing (host or admin only)
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership (host can only update their own listings)
    if (req.user.role !== 'admin' && listing.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own listings'
      });
    }

    // If listing is being updated by host, set verification to false
    if (req.user.role === 'host') {
      req.body.isVerified = false;
      req.body.verifiedAt = null;
      req.body.verifiedBy = null;
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('host', 'name avatar');

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: { listing: updatedListing }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete listing (host or admin only)
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && listing.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own listings'
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

    // Soft delete by setting isActive to false
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

// Get host's listings
const getHostListings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [listings, total] = await Promise.all([
      Listing.find({ host: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Listing.countDocuments({ host: req.user._id })
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
      message: 'Failed to fetch host listings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check listing availability
const checkAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const isAvailable = listing.isAvailable(startDate, endDate);

    // Also check for existing bookings
    const conflictingBookings = await Booking.countDocuments({
      listing: req.params.id,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });

    const available = isAvailable && conflictingBookings === 0;

    res.json({
      success: true,
      data: {
        available,
        startDate,
        endDate,
        listingId: req.params.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get featured listings
const getFeaturedListings = async (req, res) => {
  try {
    const listings = await Listing.find({
      isActive: true,
      isVerified: true,
      averageRating: { $gte: 4.5 }
    })
      .populate('host', 'name avatar')
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(8);

    res.json({
      success: true,
      data: { listings }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured listings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getHostListings,
  checkAvailability,
  getFeaturedListings
};