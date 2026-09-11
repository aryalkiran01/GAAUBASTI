const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Phase 16: Nepal Payment Providers Tests
test('Phase 16 — Universal Nepal Payment Providers Suite', async (t) => {
  const {
    getPaymentProvider,
    isSupportedProvider,
    convertToNpr,
    DEFAULT_USD_TO_NPR_RATE,
    EsewaProvider,
    KhaltiProvider,
    StripeProvider
  } = require('../services/paymentProviders');

  await t.test('Provider factory returns supported providers', () => {
    assert.equal(isSupportedProvider('stripe'), true);
    assert.equal(isSupportedProvider('esewa'), true);
    assert.equal(isSupportedProvider('khalti'), true);
    assert.equal(isSupportedProvider('unknown_provider'), false);

    const stripe = getPaymentProvider('stripe');
    assert.equal(stripe.name, 'stripe');
    const esewa = getPaymentProvider('esewa');
    assert.equal(esewa.name, 'esewa');
    const khalti = getPaymentProvider('khalti');
    assert.equal(khalti.name, 'khalti');
  });

  await t.test('Currency conversion calculates server-authoritative NPR accurately', () => {
    assert.equal(convertToNpr(100), 100 * DEFAULT_USD_TO_NPR_RATE);
    assert.equal(convertToNpr(50, 135), 6750);
  });

  await t.test('eSewa provider generates valid HMAC-SHA256 signatures and verifies them', () => {
    const esewa = new EsewaProvider();
    const sig = esewa.generateSignature('100.00', 'tx-12345', 'EPAYTEST');
    assert.equal(typeof sig, 'string');
    assert.ok(sig.length > 10);

    const isValid = esewa.verifySignature(
      'total_amount,transaction_uuid,product_code',
      { total_amount: '100.00', transaction_uuid: 'tx-12345', product_code: 'EPAYTEST' },
      sig
    );
    assert.equal(isValid, true);

    const isTampered = esewa.verifySignature(
      'total_amount,transaction_uuid,product_code',
      { total_amount: '999.00', transaction_uuid: 'tx-12345', product_code: 'EPAYTEST' },
      sig
    );
    assert.equal(isTampered, false);
  });

  await t.test('eSewa provider initializes payment parameters correctly', async () => {
    const esewa = new EsewaProvider();
    const mockPayment = { _id: new mongoose.Types.ObjectId() };
    const mockBooking = { _id: new mongoose.Types.ObjectId(), priceBreakdown: { basePrice: 100 } };
    const mockUser = { _id: new mongoose.Types.ObjectId() };

    const init = await esewa.initializePayment({
      payment: mockPayment,
      booking: mockBooking,
      user: mockUser,
      amount: 13500,
      currency: 'NPR'
    });

    assert.equal(init.provider, 'esewa');
    assert.equal(init.status, 'pending');
    assert.equal(init.currency, 'NPR');
    assert.equal(init.amount, 13500);
    assert.ok(init.formData);
    assert.equal(init.formData.product_code, 'EPAYTEST');
    assert.ok(init.formData.signature);
  });

  await t.test('Khalti provider initializes ePayment in paisa', async () => {
    const khalti = new KhaltiProvider();
    const mockPayment = { _id: new mongoose.Types.ObjectId() };
    const mockBooking = { _id: new mongoose.Types.ObjectId(), listing: { title: 'Village Stay' } };
    const mockUser = { _id: new mongoose.Types.ObjectId(), name: 'Traveler', email: 't@example.com' };

    const init = await khalti.initializePayment({
      payment: mockPayment,
      booking: mockBooking,
      user: mockUser,
      amount: 5000,
      currency: 'NPR'
    });

    assert.equal(init.provider, 'khalti');
    assert.equal(init.currency, 'NPR');
    assert.equal(init.amount, 5000);
    assert.ok(init.providerPaymentId);
  });
});

// Phase 17: Host Payouts & Notification Preferences Tests
test('Phase 17 — Host Payouts & User Notification Preferences Suite', async (t) => {
  const { shouldSendNotification } = require('../utils/notifications');

  await t.test('Notification preferences guardrail: payments and security cannot be disabled', () => {
    const userWithOptOut = {
      notificationPreferences: {
        email: { bookings: false, payments: false, messages: false },
        sms: { bookings: false, payments: false, security: false },
        inApp: { bookings: false, payments: false }
      }
    };

    // Payments and security MUST still return true
    assert.equal(shouldSendNotification(userWithOptOut, 'email', 'payments'), true);
    assert.equal(shouldSendNotification(userWithOptOut, 'sms', 'payments'), true);
    assert.equal(shouldSendNotification(userWithOptOut, 'sms', 'security'), true);
    assert.equal(shouldSendNotification(userWithOptOut, 'inApp', 'payments'), true);

    // Non-critical categories honor opt-out
    assert.equal(shouldSendNotification(userWithOptOut, 'email', 'bookings'), false);
    assert.equal(shouldSendNotification(userWithOptOut, 'email', 'messages'), false);
    assert.equal(shouldSendNotification(userWithOptOut, 'sms', 'bookings'), false);
  });

  await t.test('Payout model validates statuses and methods', () => {
    const Payout = require('../models/Payout');
    const p = new Payout({
      host: new mongoose.Types.ObjectId(),
      amount: 250,
      period: '2026-09',
      status: 'completed',
      payoutMethod: 'esewa',
      payoutMethodDetails: {
        esewaId: '9800000000'
      }
    });

    assert.equal(p.status, 'completed');
    assert.equal(p.payoutMethod, 'esewa');
    assert.equal(p.payoutMethodDetails.esewaId, '9800000000');
  });
});

// Phase 18: Observability & Structured Logging Tests
test('Phase 18 — Production Observability & Structured Logger Suite', async (t) => {
  const { sanitizeLogMetadata } = require('../utils/logger');

  await t.test('Sanitizes sensitive tokens, passwords, and keys', () => {
    const sensitive = {
      user: 'john',
      password: 'mypassword123',
      token: 'jwt_token_secret',
      stripeKey: 'sk_live_12345',
      otp: '123456',
      creditCard: '4111222233334444',
      details: {
        authHeader: 'Bearer secret_jwt',
        safeField: 'hello'
      }
    };

    const cleaned = sanitizeLogMetadata(sensitive);
    assert.equal(cleaned.password, '[REDACTED]');
    assert.equal(cleaned.token, '[REDACTED]');
    assert.equal(cleaned.stripeKey, '[REDACTED]');
    assert.equal(cleaned.otp, '[REDACTED]');
    assert.equal(cleaned.creditCard, '[REDACTED]');
    assert.equal(cleaned.details.authHeader, '[REDACTED]');
    assert.equal(cleaned.details.safeField, 'hello');
    assert.equal(cleaned.user, 'john');
  });
});
