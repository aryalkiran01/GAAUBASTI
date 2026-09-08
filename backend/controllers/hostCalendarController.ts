export {};
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const BookingNight = require('../models/BookingNight');
const { checkListingAvailability } = require('../services/bookingAvailability');

const getHostCalendar = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { month, year } = req.query;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the listing host can view the calendar' });
    }

    const now = new Date();
    const calYear = year ? parseInt(year) : now.getFullYear();
    const calMonth = month ? parseInt(month) : now.getMonth();
    const startDate = new Date(calYear, calMonth, 1);
    const endDate = new Date(calYear, calMonth + 1, 0, 23, 59, 59);

    const [bookings, bookingNights] = await Promise.all([
      Booking.find({
        listing: listingId,
        status: { $in: ['pending', 'confirmed'] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      })
        .populate('guest', 'name avatar')
        .select('startDate endDate status guests bookingReference')
        .sort({ startDate: 1 }),
      BookingNight.find({
        listing: listingId,
        date: { $gte: startDate, $lte: endDate },
      }).populate({
        path: 'booking',
        select: 'status startDate endDate guest',
        populate: { path: 'guest', select: 'name' },
      }),
    ]);

    const manualBlocks = (listing.unavailableDates || []).filter((d: any) => {
      const bs = new Date(d.startDate);
      const be = new Date(d.endDate);
      return bs <= endDate && be >= startDate;
    });

    const bookedDates = new Set<string>();
    for (const bn of bookingNights) {
      const dateStr = new Date(bn.date).toISOString().slice(0, 10);
      bookedDates.add(dateStr);
    }

    res.json({
      success: true,
      data: {
        listingId,
        listingTitle: listing.title,
        month: calMonth,
        year: calYear,
        bookings: bookings.map((b: any) => ({
          id: b._id,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status,
          bookingReference: b.bookingReference,
          guestName: b.guest?.name || 'Unknown',
          guestAvatar: b.guest?.avatar || null,
          totalGuests: b.guests ? b.guests.adults + b.guests.children : 0,
        })),
        bookedDates: [...bookedDates],
        manualBlocks: manualBlocks.map((b: any) => ({
          startDate: b.startDate,
          endDate: b.endDate,
          reason: b.reason || 'Blocked',
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch calendar', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const blockDates = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the listing host can block dates' });
    }

    const availability = await checkListingAvailability({
      listingId,
      startDate: start,
      endDate: end,
    });

    if (!availability.available && availability.blockedBy === 'booking_conflict') {
      return res.status(409).json({ success: false, message: 'Cannot block dates with existing bookings' });
    }

    listing.unavailableDates.push({
      startDate: start,
      endDate: end,
      reason: reason || 'Manually blocked by host',
    });
    await listing.save();

    res.json({ success: true, message: 'Dates blocked successfully', data: { listing } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to block dates', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const unblockDates = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the listing host can unblock dates' });
    }

    listing.unavailableDates = listing.unavailableDates.filter((d: any) => {
      const bs = new Date(d.startDate);
      const be = new Date(d.endDate);
      return !(bs.getTime() === start.getTime() && be.getTime() === end.getTime());
    });
    await listing.save();

    res.json({ success: true, message: 'Dates unblocked successfully', data: { listing } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unblock dates', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  getHostCalendar,
  blockDates,
  unblockDates,
};
