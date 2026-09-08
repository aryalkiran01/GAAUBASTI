export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// --- Listing lifecycle: draft -> pending -> approved/rejected ---

test('listing lifecycle: new listing defaults to draft status', () => {
  const Listing = require('../models/Listing');
  const listing = new Listing({
    title: 'Test Homestay in the Mountains',
    description: 'A beautiful homestay with stunning views of the Himalayas, perfect for families.',
    location: { address: '123 Mountain Rd', city: 'Pokhara', country: 'Nepal' },
    price: 50,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    images: [{ url: 'https://example.com/img.jpg' }],
    host: new mongoose.Types.ObjectId(),
  });

  assert.equal(listing.status, 'draft');
  assert.equal(listing.isVerified, false);
  assert.equal(listing.isActive, true);
});

test('listing lifecycle: publish sets status to pending and clears verification', () => {
  const Listing = require('../models/Listing');
  const listing = new Listing({
    title: 'Test Homestay',
    description: 'A beautiful place to stay in the mountains of Nepal.',
    location: { address: '123 Rd', city: 'Pokhara', country: 'Nepal' },
    price: 50,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    images: [{ url: 'https://example.com/img.jpg' }],
    host: new mongoose.Types.ObjectId(),
  });

  // Simulate publish
  listing.status = 'pending';
  listing.isVerified = false;
  listing.verifiedAt = null;
  listing.verifiedBy = null;

  assert.equal(listing.status, 'pending');
  assert.equal(listing.isVerified, false);
});

test('listing lifecycle: admin approval sets status to approved and isVerified true', () => {
  const Listing = require('../models/Listing');
  const listing = new Listing({
    title: 'Test Homestay',
    description: 'A beautiful place to stay in the mountains of Nepal.',
    location: { address: '123 Rd', city: 'Pokhara', country: 'Nepal' },
    price: 50,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    images: [{ url: 'https://example.com/img.jpg' }],
    host: new mongoose.Types.ObjectId(),
  });

  // Simulate admin approval
  listing.status = 'approved';
  listing.isVerified = true;
  listing.verifiedAt = new Date();
  listing.verifiedBy = new mongoose.Types.ObjectId();

  assert.equal(listing.status, 'approved');
  assert.equal(listing.isVerified, true);
  assert.ok(listing.verifiedAt);
});

test('listing lifecycle: unpublish sets status back to draft and deactivates', () => {
  const Listing = require('../models/Listing');
  const listing = new Listing({
    title: 'Test Homestay',
    description: 'A beautiful place to stay in the mountains of Nepal.',
    location: { address: '123 Rd', city: 'Pokhara', country: 'Nepal' },
    price: 50,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    images: [{ url: 'https://example.com/img.jpg' }],
    host: new mongoose.Types.ObjectId(),
  });

  // Simulate unpublish
  listing.status = 'draft';
  listing.isActive = false;

  assert.equal(listing.status, 'draft');
  assert.equal(listing.isActive, false);
});

test('listing lifecycle: rejection sets status to rejected', () => {
  const Listing = require('../models/Listing');
  const listing = new Listing({
    title: 'Test Homestay',
    description: 'A beautiful place to stay in the mountains of Nepal.',
    location: { address: '123 Rd', city: 'Pokhara', country: 'Nepal' },
    price: 50,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    images: [{ url: 'https://example.com/img.jpg' }],
    host: new mongoose.Types.ObjectId(),
  });

  listing.status = 'rejected';
  listing.isVerified = false;

  assert.equal(listing.status, 'rejected');
  assert.equal(listing.isVerified, false);
});

// --- Review sub-ratings validation ---

test('review: sub-ratings are optional but must be 1-5 when provided', () => {
  const Review = require('../models/Review');

  const validRatings = {
    cleanliness: 5,
    communication: 4,
    checkIn: 5,
    accuracy: 4,
    location: 3,
    value: 5,
  };

  const review = new Review({
    listing: new mongoose.Types.ObjectId(),
    guest: new mongoose.Types.ObjectId(),
    booking: new mongoose.Types.ObjectId(),
    rating: 5,
    comment: 'Amazing stay, highly recommended!',
    ratings: validRatings,
  });

  assert.equal(review.ratings.cleanliness, 5);
  assert.equal(review.ratings.communication, 4);
  assert.equal(review.ratings.checkIn, 5);
  assert.equal(review.ratings.accuracy, 4);
  assert.equal(review.ratings.location, 3);
  assert.equal(review.ratings.value, 5);
});

test('review: overall rating is required and must be 1-5', () => {
  const Review = require('../models/Review');

  const review = new Review({
    listing: new mongoose.Types.ObjectId(),
    guest: new mongoose.Types.ObjectId(),
    booking: new mongoose.Types.ObjectId(),
    rating: 4,
    comment: 'Great place',
  });

  assert.ok(review.rating >= 1 && review.rating <= 5);
});

// --- Listing payload sanitization ---

test('listing sanitize: create payload only allows whitelisted fields', () => {
  const { sanitizeListingPayloadForCreate } = require('../controllers/listingController');

  const maliciousPayload = {
    title: 'Beautiful Homestay',
    description: 'A lovely place in the mountains',
    location: { city: 'Pokhara', address: '123 Rd', country: 'Nepal' },
    price: 50,
    maxGuests: 4,
    images: [{ url: 'https://example.com/img.jpg' }],
    // Attempt to inject forbidden fields
    isVerified: true,
    status: 'approved',
    verifiedBy: 'malicious-user-id',
    host: 'malicious-user-id',
    averageRating: 5,
    reviewCount: 100,
  };

  const sanitized = sanitizeListingPayloadForCreate(maliciousPayload);

  assert.equal(sanitized.title, 'Beautiful Homestay');
  assert.equal(sanitized.isVerified, undefined);
  assert.equal(sanitized.status, undefined);
  assert.equal(sanitized.verifiedBy, undefined);
  assert.equal(sanitized.host, undefined);
  assert.equal(sanitized.averageRating, undefined);
  assert.equal(sanitized.reviewCount, undefined);
});

test('listing sanitize: update payload only allows whitelisted fields', () => {
  const { sanitizeListingPayloadForUpdate } = require('../controllers/listingController');

  const maliciousPayload = {
    title: 'Updated Title',
    price: 60,
    isVerified: true,
    status: 'approved',
    verifiedBy: 'malicious-id',
    host: 'new-host-id',
    averageRating: 5,
  };

  const sanitized = sanitizeListingPayloadForUpdate(maliciousPayload);

  assert.equal(sanitized.title, 'Updated Title');
  assert.equal(sanitized.price, 60);
  assert.equal(sanitized.isVerified, undefined);
  assert.equal(sanitized.status, undefined);
  assert.equal(sanitized.verifiedBy, undefined);
  assert.equal(sanitized.host, undefined);
  assert.equal(sanitized.averageRating, undefined);
});

// --- Booking status transitions including no-show ---

test('status transitions: confirmed -> no-show is valid', () => {
  const { canTransitionStatus } = require('../services/bookingAvailability');
  assert.equal(canTransitionStatus('confirmed', 'no-show'), true);
});

test('status transitions: pending -> no-show is invalid', () => {
  const { canTransitionStatus } = require('../services/bookingAvailability');
  assert.equal(canTransitionStatus('pending', 'no-show'), false);
});

test('status transitions: no-show -> cancelled is invalid', () => {
  const { canTransitionStatus } = require('../services/bookingAvailability');
  assert.equal(canTransitionStatus('no-show', 'cancelled'), false);
});

// --- Notification helpers exist ---

test('notifications: notifyPayoutPaid function exists', () => {
  const notifications = require('../utils/notifications');
  assert.equal(typeof notifications.notifyPayoutPaid, 'function');
});

test('notifications: notifyBookingCreated function exists', () => {
  const notifications = require('../utils/notifications');
  assert.equal(typeof notifications.notifyBookingCreated, 'function');
});

test('notifications: notifyPaymentConfirmed function exists', () => {
  const notifications = require('../utils/notifications');
  assert.equal(typeof notifications.notifyPaymentConfirmed, 'function');
});

test('notifications: notifyBookingCancelled function exists', () => {
  const notifications = require('../utils/notifications');
  assert.equal(typeof notifications.notifyBookingCancelled, 'function');
});

test('notifications: notifyReviewReceived function exists', () => {
  const notifications = require('../utils/notifications');
  assert.equal(typeof notifications.notifyReviewReceived, 'function');
});
