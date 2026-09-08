export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Booking = require('../models/Booking');

test('user model includes hashed verification token fields', () => {
  assert.ok(User.schema.paths.verificationToken, 'verificationToken field missing');
  assert.ok(User.schema.paths.verificationTokenExpires, 'verificationTokenExpires field missing');
  assert.equal(typeof User.schema.paths.isVerified.default, 'function');
  assert.equal(User.schema.paths.isVerified.default(), false);
});

test('booking model includes idempotency key and active-booking uniqueness guard', () => {
  assert.ok(Booking.schema.paths.idempotencyKey, 'idempotencyKey field missing');
  const indexDefinitions = Booking.schema.indexes();
  const hasOverlapIndex = indexDefinitions.some(([keys, options]) => {
    return Boolean(keys.listing) && Boolean(keys.startDate) && Boolean(keys.endDate) && Boolean(options.partialFilterExpression);
  });
  assert.equal(hasOverlapIndex, true);
});
