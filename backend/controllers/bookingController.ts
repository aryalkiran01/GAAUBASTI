export {};
  import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Listing from '../models/Listing';
import User from '../models/User';
import { validateGuestCount, validateBookingDates, canTransitionStatus, checkListingAvailability } from '../services/bookingAvailability';
import { createSystemMessage } from '../services/systemMessages';

// Create new booking
const createBooking = async (req, res) => {
  try {
    const { listing: listingId, startDate, endDate, guests, specialRequests, idempotencyKey } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: 'Listing is required'
      });
    }

    const normalizedKey = typeof idempotencyKey === 'string' && idempotencyKey.trim() ? idempotencyKey.trim() : undefined;
    if (normalizedKey) {
      const existingBooking = await Booking.findOne({
        guest: req.user._id,
        idempotencyKey: normalizedKey
      }).populate([
        { path: 'listing', select: 'title location images' },
        { path: 'guest', select: 'name email' },
        { path: 'host', select: 'name email' }
      ]);

      if (existingBooking) {
        return res.status(200).json({
          success: true,
          message: 'Booking already exists for this request',
          data: { booking: existingBooking }
        });
      }
    }

    const listing = await Listing.findById(listingId).populate('host');
    if (!listing || !listing.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or not available'
      });
    }

    const guestValidation = validateGuestCount(guests, listing.maxGuests);
    if (!guestValidation.valid) {
      return res.status(400).json({
        success: false,
        message: guestValidation.message
      });
    }

    const dateValidation = validateBookingDates(startDate, endDate);
    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message
      });
    }

    const session = await mongoose.startSession();
    let createdBooking: any = null;

    try {
      await session.withTransaction(async () => {
        const activeListing = await Listing.findById(listingId).session(session).populate('host');
        if (!activeListing || !activeListing.isActive) {
          const error: any = new Error('Listing not found or not available');
          error.statusCode = 404;
          throw error;
        }

        const availability = await checkListingAvailability({
          listingId,
          startDate: dateValidation.start,
          endDate: dateValidation.end,
          excludeBookingId: null
        });

        if (!availability.available) {
          const error: any = new Error(availability.reason || 'Selected dates are unavailable');
          error.statusCode = 409;
          throw error;
        }

        if (normalizedKey) {
          const duplicateBooking = await Booking.findOne({
            guest: req.user._id,
            idempotencyKey: normalizedKey
          }).session(session);

          if (duplicateBooking) {
            createdBooking = duplicateBooking;
            return;
          }
        }

        const bookingStart = new Date(String(startDate));
        const bookingEnd = new Date(String(endDate));
        const nights = Math.ceil((Number(bookingEnd) - Number(bookingStart)) / (1000 * 60 * 60 * 24));
        const basePrice = activeListing.price * nights;
        const cleaningFee = 25;
        const serviceFee = Math.round(basePrice * 0.1);
        const taxes = Math.round(basePrice * 0.05);
        const totalPrice = basePrice + cleaningFee + serviceFee + taxes;

        const booking = new Booking({
          listing: listingId,
          guest: req.user._id,
          host: activeListing.host._id,
          startDate: bookingStart,
          endDate: bookingEnd,
          guests: {
            adults: guestValidation.adults,
            children: guestValidation.children
          },
          totalPrice,
          priceBreakdown: {
            basePrice,
            cleaningFee,
            serviceFee,
            taxes
          },
          specialRequests,
          idempotencyKey: normalizedKey,
          status: 'pending'
        });

        await booking.save({ session });
        createdBooking = booking;
      });
    } finally {
      session.endSession();
    }

    if (!createdBooking) {
      return res.status(200).json({
        success: true,
        message: 'Booking already exists for this request',
        data: { booking: await Booking.findOne({ guest: req.user._id, idempotencyKey: normalizedKey }).populate([
          { path: 'listing', select: 'title location images' },
          { path: 'guest', select: 'name email' },
          { path: 'host', select: 'name email' }
        ]) }
      });
    }

    const populatedBooking = await Booking.findById(createdBooking._id).populate([
      { path: 'listing', select: 'title location images' },
      { path: 'guest', select: 'name email' },
      { path: 'host', select: 'name email' }
    ]);

    if (populatedBooking) {
      createSystemMessage(populatedBooking._id.toString(), 'booking_created', req.user._id.toString());
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: populatedBooking }
    });
  } catch (error: any) {
    const isDuplicateKey = error && error.code === 11000;
    const statusCode = error.statusCode || (isDuplicateKey ? 409 : 500);
    const safeErrorMessage = error && error.message ? error.message : 'Failed to create booking';
    const message = statusCode === 409 ? (safeErrorMessage || 'Selected dates are unavailable') : 'Failed to create booking';
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? safeErrorMessage : undefined
    });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter: any = { guest: req.user._id };
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
  } catch (error: any) {
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

    const filter: any = { host: req.user._id };
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
  } catch (error: any) {
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
  } catch (error: any) {
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

    const listing = await Listing.findById(booking.listing);
    const isHost = req.user.role === 'host' && listing && listing.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the listing host or admin can update booking status'
      });
    }

    if (!canTransitionStatus(booking.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    if (status === 'confirmed') {
      const availability = await checkListingAvailability({
        listingId: booking.listing,
        startDate: booking.startDate,
        endDate: booking.endDate,
        excludeBookingId: booking._id
      });

      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: 'Cannot confirm this booking because the requested dates are unavailable.'
        });
      }
    }

    const previousStatus = booking.status;

    booking.status = status;
    if (hostNotes) booking.hostNotes = hostNotes;

    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user._id;
    }

    await booking.save();

    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      const listingForDates = await Listing.findById(booking.listing);
      if (listingForDates) {
        const matches = listingForDates.unavailableDates.some((unavailable) => {
          const start = new Date(unavailable.startDate);
          const end = new Date(unavailable.endDate);
          return start.getTime() === new Date(booking.startDate).getTime() && end.getTime() === new Date(booking.endDate).getTime();
        });

        if (!matches) {
          await (listingForDates as any).addUnavailableDates(booking.startDate, booking.endDate, 'Booked');
        }
      }
    }

    if (status === 'cancelled' && previousStatus === 'confirmed') {
      const listingForDates = await Listing.findById(booking.listing);
      if (listingForDates) {
        listingForDates.unavailableDates = listingForDates.unavailableDates.filter((unavailable) => {
          const blockStart = new Date(unavailable.startDate);
          const blockEnd = new Date(unavailable.endDate);
          const bookingStart = new Date(booking.startDate);
          const bookingEnd = new Date(booking.endDate);
          return !(blockStart <= bookingEnd && blockEnd >= bookingStart);
        });
        await listingForDates.save();
      }
    }

    await booking.populate([
      { path: 'listing', select: 'title location' },
      { path: 'guest', select: 'name email' }
    ]);

    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      createSystemMessage(booking._id.toString(), 'booking_confirmed', req.user._id.toString());
    }
    if (status === 'cancelled') {
      createSystemMessage(booking._id.toString(), 'booking_cancelled_host', req.user._id.toString());
    }

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: { booking }
    });
  } catch (error: any) {
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

    if (booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings'
      });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking status ${booking.status} cannot be cancelled`
      });
    }

    if (!(booking as any).canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled at this time'
      });
    }

    const refundAmount = (booking as any).calculateRefund((booking.listing as any)?.cancellationPolicy);

    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user._id;

    await booking.save();

    const listingForDates = await Listing.findById(booking.listing);
    if (listingForDates) {
      listingForDates.unavailableDates = listingForDates.unavailableDates.filter((unavailable) => {
        const blockStart = new Date(unavailable.startDate);
        const blockEnd = new Date(unavailable.endDate);
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        return !(blockStart <= bookingEnd && blockEnd >= bookingStart);
      });
      await listingForDates.save();
    }

    createSystemMessage(booking._id.toString(), 'booking_cancelled_guest', req.user._id.toString());

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        refundAmount
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  createBooking,
  getUserBookings,
  getHostBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking
};
