export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const errorHandler = require('../middlewares/errorHandler');

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
