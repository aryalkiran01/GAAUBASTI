export {};
const AuditLog = require('../models/AuditLog');

const MAX_FAILED_PAYMENTS_PER_HOUR = 5;
const MAX_CANCELLATIONS_PER_DAY = 3;
const MAX_MESSAGES_PER_MINUTE = 10;
const MAX_LISTINGS_PER_DAY = 5;
const MAX_REVIEWS_PER_DAY = 10;

const checkRepeatedFailedPayments = async (userId: string): Promise<{ flagged: boolean; reason?: string }> => {
  const Payment = require('../models/Payment');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const failedCount = await Payment.countDocuments({
    payer: userId,
    status: 'failed',
    createdAt: { $gte: oneHourAgo },
  });

  if (failedCount >= MAX_FAILED_PAYMENTS_PER_HOUR) {
    await logFraudEvent({ userId, action: 'repeated_failed_payments', details: { failedCount } });
    return { flagged: true, reason: `Excessive failed payments: ${failedCount} in the last hour` };
  }
  return { flagged: false };
};

const checkCancellationAbuse = async (userId: string): Promise<{ flagged: boolean; reason?: string }> => {
  const Booking = require('../models/Booking');
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const cancelCount = await Booking.countDocuments({
    guest: userId,
    status: 'cancelled',
    cancelledAt: { $gte: oneDayAgo },
  });

  if (cancelCount >= MAX_CANCELLATIONS_PER_DAY) {
    await logFraudEvent({ userId, action: 'cancellation_abuse', details: { cancelCount } });
    return { flagged: true, reason: `Excessive cancellations: ${cancelCount} in 24 hours` };
  }
  return { flagged: false };
};

const checkReviewAbuse = async (userId: string): Promise<{ flagged: boolean; reason?: string }> => {
  const Review = require('../models/Review');
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const reviewCount = await Review.countDocuments({
    guest: userId,
    createdAt: { $gte: oneDayAgo },
  });

  if (reviewCount >= MAX_REVIEWS_PER_DAY) {
    await logFraudEvent({ userId, action: 'review_abuse', details: { reviewCount } });
    return { flagged: true, reason: `Excessive reviews: ${reviewCount} in 24 hours` };
  }
  return { flagged: false };
};

const checkListingSpam = async (userId: string): Promise<{ flagged: boolean; reason?: string }> => {
  const Listing = require('../models/Listing');
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const listingCount = await Listing.countDocuments({
    host: userId,
    createdAt: { $gte: oneDayAgo },
  });

  if (listingCount >= MAX_LISTINGS_PER_DAY) {
    await logFraudEvent({ userId, action: 'listing_spam', details: { listingCount } });
    return { flagged: true, reason: `Excessive listing creation: ${listingCount} in 24 hours` };
  }
  return { flagged: false };
};

const checkSuspiciousBookingPattern = async (userId: string, listingId: string): Promise<{ flagged: boolean; reason?: string }> => {
  const Booking = require('../models/Booking');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentBookings = await Booking.countDocuments({
    guest: userId,
    createdAt: { $gte: oneHourAgo },
  });

  if (recentBookings >= 5) {
    await logFraudEvent({ userId, action: 'suspicious_booking_pattern', details: { recentBookings, listingId } });
    return { flagged: true, reason: `Suspicious booking pattern: ${recentBookings} bookings in 1 hour` };
  }
  return { flagged: false };
};

const checkMessageSpam = async (userId: string): Promise<{ flagged: boolean; reason?: string }> => {
  const Message = require('../models/Message');
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const messageCount = await Message.countDocuments({
    sender: userId,
    createdAt: { $gte: oneMinuteAgo },
  });

  if (messageCount >= MAX_MESSAGES_PER_MINUTE) {
    await logFraudEvent({ userId, action: 'message_spam', details: { messageCount } });
    return { flagged: true, reason: `Excessive messages: ${messageCount} in 1 minute` };
  }
  return { flagged: false };
};

const logFraudEvent = async ({ userId, action, details }: { userId: string; action: string; details?: Record<string, any> }) => {
  try {
    await AuditLog.create({
      actor: userId,
      action: `fraud_${action}`,
      targetType: 'User',
      targetId: userId,
      after: details || {},
    });
  } catch (err: any) {
    console.error('Failed to log fraud event:', err.message);
  }
};

module.exports = {
  checkRepeatedFailedPayments,
  checkCancellationAbuse,
  checkReviewAbuse,
  checkListingSpam,
  checkSuspiciousBookingPattern,
  checkMessageSpam,
  logFraudEvent,
  MAX_FAILED_PAYMENTS_PER_HOUR,
  MAX_CANCELLATIONS_PER_DAY,
  MAX_MESSAGES_PER_MINUTE,
  MAX_LISTINGS_PER_DAY,
  MAX_REVIEWS_PER_DAY,
};
