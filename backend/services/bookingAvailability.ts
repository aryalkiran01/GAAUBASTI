export {};
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const BookingNight = require('../models/BookingNight');

const BLOCKING_BOOKING_STATUSES = ['pending', 'confirmed'];

const parseDate = (dateValue, label = 'Date') => {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${label} is invalid`);
  }

  return parsedDate;
};

const validateBookingDates = (startDate, endDate) => {
  try {
    const start = parseDate(startDate, 'Check-in');
    const end = parseDate(endDate, 'Check-out');

    if (end <= start) {
      return {
        valid: false,
        message: 'Check-out date must be after check-in date'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return {
        valid: false,
        message: 'Booking dates cannot be in the past'
      };
    }

    return {
      valid: true,
      start,
      end
    };
  } catch (error) {
    return {
      valid: false,
      message: error.message || 'Invalid date provided'
    };
  }
};

const validateGuestCount = (guests, maxGuests) => {
  if (!guests || typeof guests !== 'object') {
    return {
      valid: false,
      message: 'Guest details are required'
    };
  }

  const adults = Number(guests.adults);
  const children = Number(guests.children || 0);

  if (!Number.isInteger(adults) || adults < 1) {
    return {
      valid: false,
      message: 'At least 1 adult guest is required'
    };
  }

  if (!Number.isInteger(children) || children < 0) {
    return {
      valid: false,
      message: 'Guest counts must be valid integers'
    };
  }

  const totalGuests = adults + children;

  if (totalGuests > maxGuests) {
    return {
      valid: false,
      message: `Maximum ${maxGuests} guests allowed`
    };
  }

  return {
    valid: true,
    adults,
    children,
    totalGuests
  };
};

const overlappingDateWindow = (startA, endA, startB, endB) => {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
};

const getAllowedStatusTransitions = (currentStatus) => {
  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    cancelled: [],
    completed: [],
    refunded: []
  };

  return transitions[currentStatus] || [];
};

const canTransitionStatus = (currentStatus, nextStatus) => {
  return getAllowedStatusTransitions(currentStatus).includes(nextStatus);
};

const findConflictingBooking = async ({ listingId, startDate, endDate, excludeBookingId = null, session = null }) => {
  const query = {
    listing: listingId,
    status: { $in: BLOCKING_BOOKING_STATUSES },
    startDate: { $lt: new Date(endDate) },
    endDate: { $gt: new Date(startDate) }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  let bookingQuery = Booking.findOne(query);
  if (session) {
    bookingQuery = bookingQuery.session(session);
  }
  if (typeof bookingQuery.sort === 'function') {
    bookingQuery = bookingQuery.sort({ startDate: 1 });
  }

  const result = await bookingQuery;
  return result && typeof result.toObject === 'function' ? result.toObject() : result;
};

const checkListingAvailability = async ({ listingId, startDate, endDate, excludeBookingId = null, session = null }) => {
  const dateValidation = validateBookingDates(startDate, endDate);

  if (!dateValidation.valid) {
    return {
      available: false,
      reason: dateValidation.message,
      conflictingBooking: null,
      blockedBy: 'invalid_date_range'
    };
  }

  let listingQuery = Listing.findById(listingId);
  if (session) {
    listingQuery = listingQuery.session(session);
  }
  let listing = await listingQuery;
  listing = listing && typeof listing.toObject === 'function' ? listing.toObject() : listing;

  if (!listing) {
    return {
      available: false,
      reason: 'Listing not found',
      conflictingBooking: null,
      blockedBy: 'listing_not_found'
    };
  }

  const requestStart = dateValidation.start;
  const requestEnd = dateValidation.end;

  const hasManualBlock = Array.isArray(listing.unavailableDates) && listing.unavailableDates.some((unavailableDate) => {
    if (!unavailableDate || !unavailableDate.startDate || !unavailableDate.endDate) {
      return false;
    }

    return overlappingDateWindow(
      requestStart,
      requestEnd,
      unavailableDate.startDate,
      unavailableDate.endDate
    );
  });

  if (hasManualBlock) {
    return {
      available: false,
      reason: 'Selected dates are unavailable for this listing.',
      conflictingBooking: null,
      blockedBy: 'manual_unavailable_dates'
    };
  }

  const conflictingBooking = await findConflictingBooking({
    listingId,
    startDate: requestStart,
    endDate: requestEnd,
    excludeBookingId,
    session
  });

  if (conflictingBooking) {
    return {
      available: false,
      reason: 'Selected dates are already booked.',
      conflictingBooking,
      blockedBy: 'booking_conflict'
    };
  }

  return {
    available: true,
    reason: 'Dates are available.',
    conflictingBooking: null,
    blockedBy: null
  };
};

const generateNights = (startDate, endDate) => {
  const nights = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return nights;
};

const lockBookingNights = async ({ listingId, bookingId, startDate, endDate, session = null }) => {
  const nights = generateNights(startDate, endDate);
  const docs = nights.map((date) => ({
    listing: listingId,
    date,
    booking: bookingId
  }));

  if (session) {
    await BookingNight.insertMany(docs, { session, ordered: true });
  } else {
    await BookingNight.insertMany(docs, { ordered: true });
  }
};

const releaseBookingNights = async ({ bookingId, session = null }) => {
  const filter = { booking: bookingId };
  if (session) {
    await BookingNight.deleteMany(filter).session(session);
  } else {
    await BookingNight.deleteMany(filter);
  }
};

const isListingAvailableForDates = async ({ listingId, startDate, endDate, excludeBookingId = null }) => {
  const dateValidation = validateBookingDates(startDate, endDate);
  if (!dateValidation.valid) {
    return { available: false, reason: dateValidation.message };
  }

  const availability = await checkListingAvailability({
    listingId,
    startDate: dateValidation.start,
    endDate: dateValidation.end,
    excludeBookingId
  });

  return { available: availability.available, reason: availability.reason };
};

module.exports = {
  BLOCKING_BOOKING_STATUSES,
  parseDate,
  validateBookingDates,
  validateGuestCount,
  overlappingDateWindow,
  getAllowedStatusTransitions,
  canTransitionStatus,
  findConflictingBooking,
  checkListingAvailability,
  generateNights,
  lockBookingNights,
  releaseBookingNights,
  isListingAvailableForDates
};
