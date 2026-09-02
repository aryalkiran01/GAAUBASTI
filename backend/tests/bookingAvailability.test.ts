import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBookingDates, checkListingAvailability, canTransitionStatus, overlappingDateWindow, validateGuestCount } from '../services/bookingAvailability.ts';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfterTomorrow = new Date();
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
const inThreeDays = new Date();
inThreeDays.setDate(inThreeDays.getDate() + 3);

const iso = (date: Date) => date.toISOString().slice(0, 10);

test('availability: no existing booking is available', async () => {
  const mockBooking = { findOne: async () => null };
  const mockListing = { findById: async () => ({ unavailableDates: [] }) };

  const availability = await checkListingAvailability(
    { listingId: '507f1f77bcf86cd799439011', startDate: iso(tomorrow), endDate: iso(dayAfterTomorrow) },
    mockListing as any,
    mockBooking as any
  );

  assert.equal(availability.available, true);
});

test('availability: exact same dates conflict', async () => {
  const mockBooking = {
    findOne: async () => ({
      _id: '1',
      listing: '507f1f77bcf86cd799439011',
      status: 'confirmed',
      startDate: new Date(tomorrow),
      endDate: new Date(dayAfterTomorrow),
      toObject() { return this; }
    })
  };
  const mockListing = { findById: async () => ({ unavailableDates: [] }) };

  const availability = await checkListingAvailability(
    { listingId: '507f1f77bcf86cd799439011', startDate: iso(tomorrow), endDate: iso(dayAfterTomorrow) },
    mockListing as any,
    mockBooking as any
  );

  assert.equal(availability.available, false);
  assert.equal(availability.blockedBy, 'booking_conflict');
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
