import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireRole, requireOwnership } from '../middlewares/roleAuth.ts';
import Listing from '../models/Listing.ts';

const createReq = (user: any) => ({ user, params: {}, body: {} } as any);
const createRes = () => {
  let statusCode: number | null = null;
  let payload: any = null;
  return {
    get statusCode() { return statusCode; },
    get payload() { return payload; },
    status(code: number) { statusCode = code; return this; },
    json(p: any) { payload = p; return this; }
  };
};

test('admin role rejects guest access', () => {
  const req = createReq({ role: 'guest', _id: 'u1' });
  const res = createRes();
  const middleware = requireRole(['admin']);
  let called = false;
  middleware(req, res as any, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('admin role allows admin access', () => {
  const req = createReq({ role: 'admin', _id: 'u1' });
  const res = createRes();
  const middleware = requireRole('admin');
  let called = false;
  middleware(req, res as any, () => { called = true; });
  assert.equal(called, true);
});

test('ownership check allows resource owner', async () => {
  const req = createReq({ role: 'host', _id: 'u1' });
  req.params.id = 'listing1';
  const res = createRes();
  const mockModel = {
    findById: async () => ({ host: 'u1', toObject() { return { host: 'u1' }; } })
  };
  const middleware = requireOwnership(mockModel, 'host');
  let called = false;
  await middleware(req, res as any, () => { called = true; });
  assert.equal(called, true);
});

test('ownership check blocks another host', async () => {
  const req = createReq({ role: 'host', _id: 'u1' });
  req.params.id = 'listing2';
  const res = createRes();
  const mockModel = {
    findById: async () => ({ host: 'u2', toObject() { return { host: 'u2' }; } })
  };
  const middleware = requireOwnership(mockModel, 'host');
  let called = false;
  await middleware(req, res as any, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('self-ownership middleware ignores forged userId in body', async () => {
  const req = createReq({ role: 'host', _id: 'u1' });
  req.params.id = 'listing3';
  req.body.userId = 'u1';
  const res = createRes();
  const mockModel = {
    findById: async () => ({ host: 'u2', toObject() { return { host: 'u2' }; } })
  };
  const middleware = requireOwnership(mockModel, 'host');
  let called = false;
  await middleware(req, res as any, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('self-ownership middleware rejects forged ownership attempts', async () => {
  const req = createReq({ role: 'guest', _id: 'u1' });
  req.params.id = 'listing4';
  const res = createRes();
  const mockModel = {
    findById: async () => ({ host: 'u2', toObject() { return { host: 'u2' }; } })
  };
  const middleware = requireOwnership(mockModel, 'host');
  let called = false;
  await middleware(req, res as any, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('listing updates strip mass-assignment and privileged fields', () => {
  const updates: Record<string, any> = {};
  const restrictedFields = ['role', 'isVerified', 'isActive', 'verifiedBy', 'verifiedAt', 'adminNotes'];
  const input: Record<string, any> = {
    title: 'Updated',
    price: 100,
    role: 'admin',
    isVerified: true,
    isActive: false,
    verifiedBy: 'u3',
    verifiedAt: new Date(),
    adminNotes: 'secret'
  };
  for (const [key, value] of Object.entries(input)) {
    if (!restrictedFields.includes(key)) {
      updates[key] = value;
    }
  }
  assert.equal(updates.title, 'Updated');
  assert.equal(updates.price, 100);
  assert.equal(updates.role, undefined);
  assert.equal(updates.isVerified, undefined);
  assert.equal(updates.isActive, undefined);
  assert.equal(updates.verifiedBy, undefined);
  assert.equal(updates.adminNotes, undefined);
});
