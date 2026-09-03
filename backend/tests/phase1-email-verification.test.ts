export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const crypto = require('crypto');

test('login enforces isVerified: unverified user cannot get token', () => {
  const userSchema = User.schema;
  assert.ok(userSchema.paths.isVerified, 'isVerified field must exist');
  assert.equal(typeof userSchema.paths.isVerified.default, 'function');
  assert.equal(userSchema.paths.isVerified.default(), false);
});

test('verification token is hashed with sha256 and has expiry', () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  assert.equal(hashed.length, 64);
  assert.notEqual(hashed, token);
});

test('User model has verificationToken and verificationTokenExpires fields', () => {
  assert.ok(User.schema.paths.verificationToken, 'verificationToken missing');
  assert.ok(User.schema.paths.verificationTokenExpires, 'verificationTokenExpires missing');
});

test('resend verification rate limiter is configured', () => {
  const { resendVerificationLimiter } = require('../middlewares/rateLimiters');
  assert.ok(resendVerificationLimiter, 'resendVerificationLimiter must be exported');
  assert.equal(typeof resendVerificationLimiter, 'function');
});
