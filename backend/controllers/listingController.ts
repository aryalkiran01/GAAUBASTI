export {};
const Listing = require('../models/Listing');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { checkListingAvailability, validateBookingDates, isListingAvailableForDates } = require('../services/bookingAvailability');
const { moderateContent } = require('../services/moderationService');
const { deleteImage } = require('../utils/cloudinary');

const LISTING_ALLOWED_CREATE_FIELDS = [
  'title', 'description', 'location', 'price', 'images', 'amenities', 'maxGuests',
  'bedrooms', 'bathrooms', 'category', 'houseRules', 'checkInTime', 'checkOutTime',
  'cancellationPolicy'
];

const LISTING_ALLOWED_UPDATE_FIELDS = [
  'title', 'description', 'location', 'price', 'images', 'amenities', 'maxGuests',
  'bedrooms', 'bathrooms', 'category', 'houseRules', 'checkInTime', 'checkOutTime',
  'cancellationPolicy', 'isActive'
];

const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const buildAllowedListingPayload = (payload = {}, allowedFields = LISTING_ALLOWED_CREATE_FIELDS) => {
  const source = payload && typeof payload === 'object' ? payload : {};
  const safePayload = {} as any;

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      safePayload[field] = source[field];
    }
  }

  return safePayload;
};

const sanitizeListingPayloadForCreate = (payload = {}) => {
  const safePayload = buildAllowedListingPayload(payload, LISTING_ALLOWED_CREATE_FIELDS);

  if (safePayload.location && typeof safePayload.location === 'object') {
    const location = safePayload.location as any;
    const cleanedLocation = {} as any;

    if (location.address) cleanedLocation.address = location.address;
    if (location.city) cleanedLocation.city = location.city;
    if (location.state) cleanedLocation.state = location.state;
    if (location.country) cleanedLocation.country = location.country;
    if (location.coordinates) cleanedLocation.coordinates = location.coordinates;

    safePayload.location = cleanedLocation;
  }

  return safePayload;
};

const sanitizeListingPayloadForUpdate = (payload = {}) => {
  const safePayload = buildAllowedListingPayload(payload, LISTING_ALLOWED_UPDATE_FIELDS);

  if (safePayload.location && typeof safePayload.location === 'object') {
    const location = safePayload.location as any;
    const cleanedLocation = {} as any;

    if (location.address) cleanedLocation.address = location.address;
    if (location.city) cleanedLocation.city = location.city;
    if (location.state) cleanedLocation.state = location.state;
    if (location.country) cleanedLocation.country = location.country;
    if (location.coordinates) cleanedLocation.coordinates = location.coordinates;

    safePayload.location = cleanedLocation;
  }

  return safePayload;
};

const processUploadedFiles = (files) => {
  if (!Array.isArray(files) || files.length === 0) return [];

  return files.map((file) => ({
    url: file.path || file.secure_url,
    publicId: file.filename || file.public_id,
    caption: 'Uploaded image'
  }));
};

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
      sortOrder = 'desc',
      checkIn,
      checkOut
    } = req.query;

    // Build filter object
    const filter = { isActive: true, isVerified: true } as any;

    if (location) {
      const escapedLocation = escapeRegex(location);
      if (escapedLocation) {
        filter.$or = [
          { 'location.city': { $regex: escapedLocation, $options: 'i' } },
          { 'location.address': { $regex: escapedLocation, $options: 'i' } }
        ];
      }
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
    const sort = {} as any;
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let listings = await Listing.find(filter)
      .populate('host', 'name avatar hostProfile.responseRate')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    let total = await Listing.countDocuments(filter);

    // Filter by date availability if check-in/check-out provided
    if (checkIn && checkOut) {
      const dateValidation = validateBookingDates(checkIn, checkOut);
      if (dateValidation.valid) {
        const availabilityResults = await Promise.all(
          listings.map(async (listing) => {
            const result = await isListingAvailableForDates({
              listingId: listing._id,
              startDate: dateValidation.start,
              endDate: dateValidation.end,
            });
            return result.available ? listing : null;
          })
        );

        listings = availabilityResults.filter(Boolean);
        total = listings.length;
      }
    }

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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role !== 'host' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only hosts or admins can create listings' });
    }

    const payload = sanitizeListingPayloadForCreate(req.body || {});
    const normalizedPrice = Number(payload.price);
    const normalizedGuests = Number(payload.maxGuests);

    if (!payload.title || String(payload.title).trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Title must be at least 5 characters long' });
    }
    if (!payload.description || String(payload.description).trim().length < 20) {
      return res.status(400).json({ success: false, message: 'Description must be at least 20 characters long' });
    }
    if (!payload.location || !payload.location.city || !payload.location.address) {
      return res.status(400).json({ success: false, message: 'Location city and address are required' });
    }
    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
    }
    if (!Number.isInteger(normalizedGuests) || normalizedGuests < 1) {
      return res.status(400).json({ success: false, message: 'Maximum guests must be at least 1' });
    }

    const images = [] as any[];

    // Process uploaded files (multer)
    if (Array.isArray(req.files) && req.files.length > 0) {
      images.push(...processUploadedFiles(req.files));
    }

    // Also accept body-provided image URLs (for flexibility)
    const bodyImages = Array.isArray(payload.images) ? payload.images : [];
    for (const image of bodyImages) {
      if (!image || typeof image.url !== 'string' || !image.url.trim()) {
        continue;
      }
      images.push({
        url: image.url.trim(),
        publicId: typeof image.publicId === 'string' ? image.publicId.trim() : undefined,
        caption: typeof image.caption === 'string' ? image.caption.trim().slice(0, 200) : undefined
      });
    }

    if (images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const listingData = {
      ...payload,
      host: req.user._id,
      images,
      price: normalizedPrice,
      maxGuests: normalizedGuests
    };

    const listing = new Listing(listingData);
    await listing.save();

    await listing.populate('host', 'name avatar');

    // Non-blocking AI moderation of listing description
    moderateContent({
      contentType: 'listing',
      content: `${payload.title || ''} ${payload.description || ''}`,
      actorId: req.user._id,
      targetType: 'Listing',
      targetId: listing._id,
    }).catch(() => {});

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
    const listing = req.resource || await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    const updates = sanitizeListingPayloadForUpdate(req.body || {});

    // If listing is being updated by host, set verification to false
    if (req.user.role === 'host') {
      updates.isVerified = false;
      updates.verifiedAt = null;
      updates.verifiedBy = null;
    }

    // Process uploaded files
    const uploadedImages = processUploadedFiles(req.files);

    if (uploadedImages.length > 0) {
      // Delete old images from Cloudinary if new ones are uploaded
      if (Array.isArray(listing.images) && listing.images.length > 0) {
        for (const oldImage of listing.images) {
          if (oldImage.publicId) {
            deleteImage(oldImage.publicId).catch(() => {});
          }
        }
      }
      updates.images = uploadedImages;
    } else if (updates.images && Array.isArray(updates.images)) {
      // Keep body-provided images
    } else {
      delete updates.images;
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updates,
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
    const listing = req.resource || await Listing.findById(req.params.id);

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

    // Delete images from Cloudinary
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      for (const image of listing.images) {
        if (image.publicId) {
          deleteImage(image.publicId).catch(() => {});
        }
      }
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

    const dateValidation = validateBookingDates(startDate, endDate);
    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message
      });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const availability = await checkListingAvailability({
      listingId: req.params.id,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        available: availability.available,
        startDate,
        endDate,
        listingId: req.params.id,
        reason: availability.reason,
        conflictingBooking: availability.conflictingBooking ? {
          id: availability.conflictingBooking._id,
          status: availability.conflictingBooking.status,
          startDate: availability.conflictingBooking.startDate,
          endDate: availability.conflictingBooking.endDate
        } : null
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
  getFeaturedListings,
  sanitizeListingPayloadForCreate,
  sanitizeListingPayloadForUpdate,
  escapeRegex
};
