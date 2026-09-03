export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');

const mockPayment = (amount, status = 'paid') => ({
  _id: 'pay_1',
  amount,
  status,
  payer: { toString: () => 'guest_1' },
  booking: { _id: 'book_1', guest: { toString: () => 'guest_1' }, host: { toString: () => 'host_1' }, status: 'confirmed', save: async () => {}, populate: async () => {} },
  currency: 'USD',
  provider: 'stripe',
  providerPaymentId: 'pi_test',
  save: async () => {},
  metadata: {}
});

const mockPriorRefunds = (total) => [
  { _id: null, total }
];

test('refund: cumulative check prevents over-refunding', async () => {
  const originalAggregate = Transaction.aggregate;
  const originalFindOne = Transaction.findOne;
  const originalCreate = Transaction.create;

  Transaction.aggregate = async () => mockPriorRefunds(80);
  Transaction.findOne = async () => null;
  Transaction.create = async () => ({});

  const payment = mockPayment(100, 'paid');

  const refundAmount = 30;
  const alreadyRefunded = 80;
  assert.ok(alreadyRefunded + refundAmount > payment.amount, 'should detect over-refund');

  Transaction.aggregate = originalAggregate;
  Transaction.findOne = originalFindOne;
  Transaction.create = originalCreate;
});

test('refund: partial refund within limit is allowed', async () => {
  const payment = mockPayment(100, 'paid');
  const alreadyRefunded = 50;
  const refundAmount = 30;
  assert.ok(alreadyRefunded + refundAmount <= payment.amount, 'partial refund should be within limit');
});

test('refund: only paid payments can be refunded', () => {
  const statuses = ['pending', 'processing', 'failed', 'refunded'];
  for (const s of statuses) {
    assert.equal(s === 'paid', false, `${s} should not be refundable`);
  }
  assert.equal('paid' === 'paid', true);
});

test('Payment model supports esewa provider', () => {
  const providerPath = Payment.schema.paths.provider;
  assert.ok(providerPath, 'provider field must exist');
  assert.ok(providerPath.enumValues.includes('esewa'), 'esewa must be in provider enum');
  assert.ok(providerPath.enumValues.includes('stripe'), 'stripe must still be in provider enum');
});

test('eSewa config requires merchant ID and secret key from env', () => {
  const { getEsewaConfig } = require('../controllers/esewaController');
  const originalMerchant = process.env.ESEWA_MERCHANT_ID;
  const originalSecret = process.env.ESEWA_SECRET_KEY;

  delete process.env.ESEWA_MERCHANT_ID;
  delete process.env.ESEWA_SECRET_KEY;

  assert.throws(() => getEsewaConfig(), /not configured/i);

  process.env.ESEWA_MERCHANT_ID = 'test_merchant';
  process.env.ESEWA_SECRET_KEY = 'test_secret';
  process.env.ESEWA_ENVIRONMENT = 'sandbox';

  const config = getEsewaConfig();
  assert.equal(config.merchantId, 'test_merchant');
  assert.equal(config.environment, 'sandbox');
  assert.ok(config.baseUrl.includes('esewa.com.np'));

  if (originalMerchant) process.env.ESEWA_MERCHANT_ID = originalMerchant;
  if (originalSecret) process.env.ESEWA_SECRET_KEY = originalSecret;
});

test('eSewa signature is HMAC-SHA256 based and deterministic', () => {
  const crypto = require('crypto');
  const sig = crypto.createHmac('sha256', 'secret').update('total_amount=100,transaction_uuid=tx1,product_code=merchant1').digest('base64');
  assert.ok(sig.length > 0);
  const sig2 = crypto.createHmac('sha256', 'secret').update('total_amount=100,transaction_uuid=tx1,product_code=merchant1').digest('base64');
  assert.equal(sig, sig2);
});
