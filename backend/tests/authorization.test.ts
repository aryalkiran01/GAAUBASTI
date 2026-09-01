export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const { requireAdmin, requireOwnership } = require('../middlewares/roleAuth');
const { requireOwnershipOrAdmin } = require('../middlewares/auth');

const createRes = () => ({
  code: null,
  payload: null,
  status(code) {
    this.code = code;
    return this;
  },
  json(payload) {
    this.payload = payload;
    return this;
  }
});

test('admin role rejects guest access', () => {
  let nextCalled = false;
  const req = { user: { role: 'guest' } };
  const res = createRes();

  requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(res.code, 403);
  assert.equal(nextCalled, false);
});

test('admin role allows admin access', () => {
  let nextCalled = false;
  const req = { user: { role: 'admin' } };
  const res = createRes();

  requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(res.code, null);
  assert.equal(nextCalled, true);
});

test('ownership check allows resource owner', async () => {
  let nextCalled = false;
  const req = {
    user: { _id: 'host-1', role: 'host' },
    params: { id: 'listing-1' }
  };
  const res = createRes();
  const Model = {
    findById: async () => ({ _id: 'listing-1', host: 'host-1' })
  };

  await requireOwnership(Model, 'host')(req, res, () => { nextCalled = true; });

  assert.equal(res.code, null);
  assert.equal(nextCalled, true);
});

test('ownership check blocks another host', async () => {
  let nextCalled = false;
  const req = {
    user: { _id: 'host-2', role: 'host' },
    params: { id: 'listing-1' }
  };
  const res = createRes();
  const Model = {
    findById: async () => ({ _id: 'listing-1', host: 'host-1' })
  };

  await requireOwnership(Model, 'host')(req, res, () => { nextCalled = true; });

  assert.equal(res.code, 403);
  assert.equal(nextCalled, false);
});

test('self-ownership middleware ignores forged userId in body', () => {
  let nextCalled = false;
  const req = {
    user: { _id: 'user-1', role: 'guest' },
    params: { id: 'user-1' },
    body: { user: 'user-2' }
  };
  const res = createRes();

  requireOwnershipOrAdmin('user')(req, res, () => { nextCalled = true; });

  assert.equal(res.code, null);
  assert.equal(nextCalled, true);
});

test('self-ownership middleware rejects forged ownership attempts', () => {
  let nextCalled = false;
  const req = {
    user: { _id: 'user-1', role: 'guest' },
    params: { id: 'user-2' },
    body: { user: 'user-2' }
  };
  const res = createRes();

  requireOwnershipOrAdmin('user')(req, res, () => { nextCalled = true; });

  assert.equal(res.code, 403);
  assert.equal(nextCalled, false);
});
