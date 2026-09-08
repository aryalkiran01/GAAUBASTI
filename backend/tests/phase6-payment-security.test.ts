export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { ensureBookingIsPayable, verifyPaymentOwnership, normalizeAmount } = require('../controllers/paymentController');

test('normalizeAmount accepts numeric strings', () => {
  assert.equal(normalizeAmount('125.5'), 125.5);
  assert.equal(normalizeAmount(75), 75);
  assert.equal(normalizeAmount('abc'), null);
});

test('ensureBookingIsPayable rejects mismatched booking owner and amount', async () => {
  const originalFindById = Booking.findById;
  Booking.findById = () => ({
    populate: async () => ({
      _id: 'booking_1',
      guest: { toString: () => 'guest_1' },
      listing: { _id: { toString: () => 'listing_1' } },
      paymentStatus: 'pending',
      status: 'pending',
      totalPrice: 120.5
    })
  });

  try {
    const result = await ensureBookingIsPayable({
      bookingId: 'booking_1',
      userId: { toString: () => 'guest_2' },
      amount: 120.5,
      listingId: 'listing_1'
    });

    assert.equal(result.status, 403);
    assert.match(result.error, /cannot pay/i);
  } finally {
    Booking.findById = originalFindById;
  }
});

test('ensureBookingIsPayable rejects amount mismatch before payment initialization', async () => {
  const originalFindById = Booking.findById;
  Booking.findById = () => ({
    populate: async () => ({
      _id: 'booking_2',
      guest: { toString: () => 'guest_3' },
      listing: { _id: { toString: () => 'listing_2' } },
      paymentStatus: 'pending',
      status: 'pending',
      totalPrice: 200
    })
  });

  try {
    const result = await ensureBookingIsPayable({
      bookingId: 'booking_2',
      userId: { toString: () => 'guest_3' },
      amount: 100,
      listingId: 'listing_2'
    });

    assert.equal(result.status, 400);
    assert.match(result.error, /does not match the booking total/i);
  } finally {
    Booking.findById = originalFindById;
  }
});

test('verifyPaymentOwnership blocks forged payer and mismatched provider payment IDs', async () => {
  const originalFindById = Payment.findById;
  Payment.findById = () => ({
    populate: async () => ({
      _id: 'payment_1',
      payer: { toString: () => 'guest_4' },
      booking: { guest: { toString: () => 'guest_4' } },
      amount: 80,
      providerPaymentId: 'pi_correct'
    })
  });

  try {
    const forgedByOtherUser = await verifyPaymentOwnership({
      paymentId: 'payment_1',
      userId: { toString: () => 'guest_9' },
      providerPaymentId: 'pi_correct',
      amount: 80
    });

    assert.equal(forgedByOtherUser.status, 403);

    const providerMismatch = await verifyPaymentOwnership({
      paymentId: 'payment_1',
      userId: { toString: () => 'guest_4' },
      providerPaymentId: 'pi_wrong',
      amount: 80
    });

    assert.equal(providerMismatch.status, 400);
    assert.match(providerMismatch.error, /does not match the payment record/i);
  } finally {
    Payment.findById = originalFindById;
  }
});
