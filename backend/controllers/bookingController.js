const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');

// Create new booking
const createBooking = async (req, res) => {
  try {
    const { listing: listingId, startDate, endDate, guests, specialRequests } = req.body;

    // Find listing and host
    const listing = await Listing.findById(listingId).populate('host');
    if (!listing || !listing.isActive ) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or not available'
      });
    }

    // Check if guest count exceeds maximum
    const totalGuests = guests.adults + (guests.children || 0);
    if (totalGuests > listing.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${listing.maxGuests} guests allowed`
      });
    }

    // Check availability
    const isAvailable = listing.isAvailable(startDate, endDate);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Selected dates are not available'
      });
    }

    // Check for conflicting bookings
    const conflictingBookings = await Booking.countDocuments({
      listing: listingId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });

    if (conflictingBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected dates are already booked'
      });
    }

    // Calculate pricing
    const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const basePrice = listing.price * nights;
    const cleaningFee = 25;
    const serviceFee = Math.round(basePrice * 0.1); // 10% service fee
    const taxes = Math.round(basePrice * 0.05); // 5% taxes
    const totalPrice = basePrice + cleaningFee + serviceFee + taxes;

    // Create booking
    const booking = new Booking({
      listing: listingId,
      guest: req.user._id,
      host: listing.host._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      guests,
      totalPrice,
      priceBreakdown: {
        basePrice,
        cleaningFee,
        serviceFee,
        taxes
      },
      specialRequests
    });

    await booking.save();

    // Populate booking details
    await booking.populate([
      { path: 'listing', select: 'title location images' },
      { path: 'guest', select: 'name email' },
      { path: 'host', select: 'name email' }
    ]);

    // Update listing's total bookings
    listing.totalBookings += 1;
    await listing.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { guest: req.user._id };
    if (status) {
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('listing', 'title location images price')
        .populate('host', 'name avatar')
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

// Get host's bookings
const getHostBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { host: req.user._id };
    if (status) {
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('listing', 'title location images')
        .populate('guest', 'name avatar email phone')
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
      message: 'Failed to fetch host bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single booking
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing', 'title location images price host')
      .populate('guest', 'name email phone')
      .populate('host', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check access permissions
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const isHost = booking.host._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isGuest && !isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update booking status (host or admin)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, hostNotes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    const isHost = booking.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only host or admin can update booking status'
      });
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      cancelled: [], // Cannot change from cancelled
      completed: [], // Cannot change from completed
      refunded: [] // Cannot change from refunded
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    // Update booking
    booking.status = status;
    if (hostNotes) booking.hostNotes = hostNotes;
    
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user._id;
    }

    await booking.save();

    // If confirmed, add dates to listing's unavailable dates
    if (status === 'confirmed') {
      const listing = await Listing.findById(booking.listing);
      await listing.addUnavailableDates(booking.startDate, booking.endDate, 'Booked');
    }

    await booking.populate([
      { path: 'listing', select: 'title location' },
      { path: 'guest', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: { booking }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel booking (guest)
const cancelBooking = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('listing');

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
        message: 'You can only cancel your own bookings'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled at this time'
      });
    }

    // Calculate refund
    const refundAmount = booking.calculateRefund(booking.listing.cancellationPolicy);

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user._id;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        refundAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getHostBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking
};