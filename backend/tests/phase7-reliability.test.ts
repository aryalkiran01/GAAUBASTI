import test from 'node:test';
import assert from 'node:assert/strict';
import errorHandler from '../middlewares/errorHandler.js';
import { getConfiguredPaymentProvider } from '../controllers/paymentController.js';
import { createReport } from '../controllers/reportController.js';


const createRes = () => ({
  statusCode: null as number | null,
  payload: null as any,
  status(code: number) {
    this.statusCode = code;
    return this;
  },
  json(payload: any) {
    this.payload = payload;
    return this;
  }
});

test('error handler maps invalid ObjectId to a 400 safe response', () => {
  const res = createRes();
  errorHandler({ name: 'CastError', message: 'Cast to ObjectId failed' }, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.success, false);
  assert.equal(res.payload.message, 'Invalid resource identifier');
  assert.equal(res.payload.stack, undefined);
});

test('error handler maps duplicate key errors to a 409 response', () => {
  const res = createRes();
  errorHandler({ code: 11000, keyValue: { email: 'a@example.com' } }, {}, res, () => {});

  assert.equal(res.statusCode, 409);
  assert.equal(res.payload.message, 'Email already exists');
});

test('error handler sanitizes validation failures to a 422 response', () => {
  const res = createRes();
  errorHandler({
    name: 'ValidationError',
    errors: {
      price: { message: 'Price must be positive' },
      maxGuests: { message: 'Guests must be at least 1' }
    }
  }, {}, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.payload.success, false);
  assert.match(res.payload.message, /Price must be positive/i);
  assert.doesNotMatch(res.payload.message, /stack/i);
});

test('payment provider rejects a missing production configuration instead of using a mock fallback', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousProvider = process.env.PAYMENT_PROVIDER;

  process.env.NODE_ENV = 'production';
  delete process.env.PAYMENT_PROVIDER;

  assert.throws(() => getConfiguredPaymentProvider(), /PAYMENT_PROVIDER.*required/i);

  process.env.NODE_ENV = previousNodeEnv || 'test';
  if (previousProvider === undefined) {
    delete process.env.PAYMENT_PROVIDER;
  } else {
    process.env.PAYMENT_PROVIDER = previousProvider;
  }
});

test('report creation rejects incomplete payloads before writing to the database', async () => {
  const res = createRes();

  await createReport({
    user: { _id: '507f1f77bcf86cd799439011' },
    body: { reportedEntityType: 'listing' }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.success, false);
  assert.match(res.payload.message, /required/i);
});
