import test from 'node:test';
import assert from 'node:assert/strict';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import { validateBookingDates, checkListingAvailability, canTransitionStatus, validateGuestCount, overlappingDateWindow } from '../services/bookingAvailability.js';


const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfterTomorrow = new Date();
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
const inThreeDays = new Date();
inThreeDays.setDate(inThreeDays.getDate() + 3);

const iso = (date) => date.toISOString().slice(0, 10);

test('availability: no existing booking is available', async () => {
  const originalFindOne = Booking.findOne;
  const originalFindById = Listing.findById;
  Booking.findOne = async () => null;
  Listing.findById = async () => ({ unavailableDates: [] });

  try {
    const availability = await checkListingAvailability({
      listingId: '507f1f77bcf86cd799439011',
      startDate: iso(tomorrow),
      endDate: iso(dayAfterTomorrow)
    });

    assert.equal(availability.available, true);
  } finally {
    Booking.findOne = originalFindOne;
    Listing.findById = originalFindById;
  }
});

test('availability: exact same dates conflict', async () => {
  const originalFindOne = Booking.findOne;
  const originalFindById = Listing.findById;
  Booking.findOne = async () => ({
    _id: '1',
    listing: '507f1f77bcf86cd799439011',
    status: 'confirmed',
    startDate: new Date(tomorrow),
    endDate: new Date(dayAfterTomorrow)
  });
  Listing.findById = async () => ({ unavailableDates: [] });

  try {
    const availability = await checkListingAvailability({
      listingId: '507f1f77bcf86cd799439011',
      startDate: iso(tomorrow),
      endDate: iso(dayAfterTomorrow)
    });

    assert.equal(availability.available, false);
    assert.equal(availability.blockedBy, 'booking_conflict');
  } finally {
    Booking.findOne = originalFindOne;
    Listing.findById = originalFindById;
  }
});

test('date validation rejects invalid ranges', () => {
  const result = validateBookingDates(iso(dayAfterTomorrow), iso(tomorrow));
  assert.equal(result.valid, false);
  assert.match(result.message, /after check-in/i);
});

test('valid status transitions succeed', () => {
  assert.equal(canTransitionStatus('pending', 'confirmed'), true);
  assert.equal(canTransitionStatus('confirmed', 'completed'), true);
});

test('invalid status transitions are rejected', () => {
  assert.equal(canTransitionStatus('cancelled', 'confirmed'), false);
  assert.equal(canTransitionStatus('completed', 'pending'), false);
});

test('guest count validation rejects zero adults', () => {
  const result = validateGuestCount({ adults: 0, children: 0 }, 2);
  assert.equal(result.valid, false);
  assert.match(result.message, /At least 1 adult/i);
});

test('guest count validation rejects over max guests', () => {
  const result = validateGuestCount({ adults: 3, children: 1 }, 3);
  assert.equal(result.valid, false);
  assert.match(result.message, /Maximum 3 guests allowed/i);
});

test('half-open interval allows checkout on same day as next check-in', () => {
  const startA = new Date(tomorrow);
  const endA = new Date(dayAfterTomorrow);
  const startB = new Date(dayAfterTomorrow);
  const endB = new Date(inThreeDays);

  const result = overlappingDateWindow(startA, endA, startB, endB);
  assert.equal(result, false);
});
