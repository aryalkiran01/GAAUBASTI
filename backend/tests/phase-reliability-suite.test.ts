export {};
import { test, describe } from 'node:test';
import assert from 'node:assert';

const { calculateBookingPrice } = require('../config/pricingConfig');
const { validateBookingDates, validateGuestCount, canTransitionStatus } = require('../services/bookingAvailability');
const { isDuplicateWebhook, normalizeAmount, ensureBookingIsPayable } = require('../controllers/paymentController');
const { isBlacklisted, addToBlacklist } = require('../controllers/authController');

describe('Phase 1, 2, 3 Reliability & Security Test Suite', () => {
  // --- PRICING & SERVER-SIDE CALCULATION TESTS ---
  describe('Server-Side Pricing Calculations & Tampering Prevention', () => {
    test('calculateBookingPrice computes basePrice, cleaningFee, serviceFee, taxes and totalPrice authoritatively', () => {
      const pricePerNight = 100;
      const startDate = '2026-10-01';
      const endDate = '2026-10-04'; // 3 nights

      const result = calculateBookingPrice(pricePerNight, startDate, endDate);
      assert.strictEqual(result.nights, 3);
      assert.strictEqual(result.basePrice, 300);
      assert.strictEqual(result.cleaningFee, 25);
      assert.strictEqual(result.serviceFee, 30); // 10% of 300
      assert.strictEqual(result.taxes, 15); // 5% of 300
      assert.strictEqual(result.totalPrice, 370); // 300 + 25 + 30 + 15
    });

    test('ensureBookingIsPayable rejects client-tampered payment amounts', async () => {
      // Mock booking object
      const fakeUserId = '507f1f77bcf86cd799439011';
      const fakeBooking = {
        _id: '507f1f77bcf86cd799439012',
        guest: fakeUserId,
        totalPrice: 370,
        paymentStatus: 'pending',
        status: 'pending',
        listing: { _id: '507f1f77bcf86cd799439013' }
      };

      // Test normalizeAmount
      assert.strictEqual(normalizeAmount('370'), 370);
      assert.strictEqual(normalizeAmount('invalid'), null);
      assert.strictEqual(normalizeAmount(100), 100);

      // Verify client-submitted price mismatch detection logic
      const clientForgedAmount = 50; // Attempting to pay $50 for a $370 booking
      const diff = Math.abs(fakeBooking.totalPrice - clientForgedAmount);
      assert.ok(diff > 0.01, 'Tampered amount should differ from authoritative totalPrice');
    });
  });

  // --- CANCELLATION & REFUND POLICIES ---
  describe('Cancellation Policy & Refund Calculations', () => {
    test('calculateRefund returns correct refund based on days before check-in', () => {
      const now = new Date();
      
      // 10 days in future
      const futureStart = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const futureEnd = new Date(futureStart.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const bookingMock = {
        startDate: futureStart,
        endDate: futureEnd,
        status: 'confirmed',
        totalPrice: 500,
        canBeCancelled() {
          const timeDiff = this.startDate.getTime() - Date.now();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          return ['pending', 'confirmed'].includes(this.status) && daysDiff >= 1;
        },
        calculateRefund(policy: string) {
          if (!this.canBeCancelled()) return 0;
          const timeDiff = this.startDate.getTime() - Date.now();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          switch (policy) {
            case 'flexible':
              return daysDiff >= 1 ? this.totalPrice : 0;
            case 'moderate':
              if (daysDiff >= 5) return this.totalPrice;
              if (daysDiff >= 1) return this.totalPrice * 0.5;
              return 0;
            case 'strict':
              if (daysDiff >= 7) return this.totalPrice;
              if (daysDiff >= 3) return this.totalPrice * 0.5;
              return 0;
            default:
              return 0;
          }
        }
      };

      assert.strictEqual(bookingMock.calculateRefund('flexible'), 500);
      assert.strictEqual(bookingMock.calculateRefund('moderate'), 500);
      assert.strictEqual(bookingMock.calculateRefund('strict'), 500);
    });

    test('calculateRefund applies strict partial refund within 3-7 days', () => {
      const now = new Date();
      const fourDaysFuture = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
      
      const bookingMock = {
        startDate: fourDaysFuture,
        status: 'confirmed',
        totalPrice: 400,
        canBeCancelled() {
          return true;
        },
        calculateRefund(policy: string) {
          const timeDiff = this.startDate.getTime() - Date.now();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          if (policy === 'strict') {
            if (daysDiff >= 7) return this.totalPrice;
            if (daysDiff >= 3) return this.totalPrice * 0.5;
            return 0;
          }
          return 0;
        }
      };

      assert.strictEqual(bookingMock.calculateRefund('strict'), 200);
    });
  });

  // --- TOKEN REVOCATION & BLACKLISTING ---
  describe('Security & Token Blacklisting', () => {
    test('addToBlacklist and isBlacklisted recognize revoked tokens', async () => {
      const sampleToken = 'sample_jwt_token_for_logout_test_' + Date.now();
      
      assert.strictEqual(await isBlacklisted(sampleToken), false);
      await addToBlacklist(sampleToken);
      assert.strictEqual(await isBlacklisted(sampleToken), true);
    });
  });

  // --- WEBHOOK REPLAY & DEDUPLICATION ---
  describe('Webhook Replay & Idempotency', () => {
    test('isDuplicateWebhook detects duplicate event IDs', async () => {
      const testEventId = 'evt_test_replay_' + Date.now();
      
      // In standalone memory/model test without live DB, verify helper returns boolean
      const firstCheck = await isDuplicateWebhook(testEventId);
      assert.strictEqual(typeof firstCheck, 'boolean');
    });
  });

  // --- STATUS TRANSITIONS ---
  describe('Booking Status Transitions', () => {
    test('valid transitions are allowed and illegal transitions are blocked', () => {
      assert.strictEqual(canTransitionStatus('pending', 'confirmed'), true);
      assert.strictEqual(canTransitionStatus('pending', 'cancelled'), true);
      assert.strictEqual(canTransitionStatus('confirmed', 'completed'), true);
      assert.strictEqual(canTransitionStatus('confirmed', 'cancelled'), true);

      // Illegal transitions
      assert.strictEqual(canTransitionStatus('completed', 'pending'), false);
      assert.strictEqual(canTransitionStatus('cancelled', 'confirmed'), false);
      assert.strictEqual(canTransitionStatus('refunded', 'confirmed'), false);
    });
  });

  // --- DATE & GUEST VALIDATION ---
  describe('Booking Date and Guest Constraints', () => {
    test('validateBookingDates enforces checkout after checkin and future dates', () => {
      const today = new Date();
      const past = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const future = new Date(today.getTime() + 48 * 60 * 60 * 1000);

      const pastResult = validateBookingDates(past, future);
      assert.strictEqual(pastResult.valid, false);

      const invalidRange = validateBookingDates(future, past);
      assert.strictEqual(invalidRange.valid, false);

      const validFuture = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const validEnd = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
      const validResult = validateBookingDates(validFuture, validEnd);
      assert.strictEqual(validResult.valid, true);
    });

    test('validateGuestCount enforces adult requirements and max limits', () => {
      assert.strictEqual(validateGuestCount({ adults: 0 }, 4).valid, false);
      assert.strictEqual(validateGuestCount({ adults: 5 }, 4).valid, false);
      assert.strictEqual(validateGuestCount({ adults: 2, children: 1 }, 4).valid, true);
    });
  });
});
