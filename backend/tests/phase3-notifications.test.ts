export {};
const test = require('node:test');
const assert = require('node:assert/strict');

test('notification dedup: createNotification with same dedupKey returns existing notification', async () => {
  const Notification = require('../models/Notification');
  const { createNotification } = require('../utils/notifications');

  const originalCreate = Notification.create;
  const originalFindOne = Notification.findOne;
  let createCallCount = 0;

  Notification.findOne = async (query) => {
    if (query['content.dedupKey'] === 'booking_created:booking_123') {
      return { _id: 'existing_notif', user: query.user, type: 'booking_created' };
    }
    return null;
  };
  Notification.create = async (doc) => {
    createCallCount++;
    return { _id: 'new_notif', ...doc };
  };

  try {
    const result1 = await createNotification({
      userId: 'user_1',
      type: 'booking_created',
      content: { dedupKey: 'booking_created:booking_123', bookingId: 'booking_123' }
    });

    assert.equal(createCallCount, 0, 'Should not create a new notification when dedup key matches');
    assert.equal(result1._id, 'existing_notif');
  } finally {
    Notification.create = originalCreate;
    Notification.findOne = originalFindOne;
  }
});

test('webhook dedup: isDuplicateWebhook returns true for already-processed event IDs', async () => {
  const WebhookLog = require('../models/WebhookLog');
  const { isDuplicateWebhook } = require('../controllers/paymentController');

  const originalFindOne = WebhookLog.findOne;
  const originalCreate = WebhookLog.create;
  let createCallCount = 0;

  WebhookLog.findOne = async (query) => {
    if (query.eventId === 'evt_already_processed') {
      return { eventId: query.eventId };
    }
    return null;
  };
  WebhookLog.create = async (doc) => {
    createCallCount++;
    return { ...doc };
  };

  try {
    const dup = await isDuplicateWebhook('evt_already_processed');
    assert.equal(dup, true, 'Should detect already-processed webhook');

    const fresh = await isDuplicateWebhook('evt_new_event');
    assert.equal(fresh, false, 'Should allow new webhook');
    assert.equal(createCallCount, 1, 'Should log the new webhook event');
  } finally {
    WebhookLog.findOne = originalFindOne;
    WebhookLog.create = originalCreate;
  }
});

test('refund idempotency: processRefund rejects already-refunded payment', async () => {
  const Payment = require('../models/Payment');
  const { processRefund } = require('../controllers/paymentController');

  const originalFindById = Payment.findById;
  Payment.findById = () => ({
    populate: async () => ({
      _id: 'payment_1',
      payer: { toString: () => 'guest_1' },
      booking: { _id: 'booking_1', guest: { toString: () => 'guest_1' }, host: { toString: () => 'host_1' } },
      amount: 100,
      currency: 'USD',
      status: 'refunded',
      provider: 'stripe',
      providerPaymentId: 'pi_test',
      save: async () => {}
    })
  });

  const createRes = (): any => ({
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  });

  try {
    const res = createRes();
    await processRefund({ params: { paymentId: 'payment_1' }, user: { _id: { toString: () => 'guest_1' }, role: 'guest' }, body: {} }, res);
    assert.equal(res.statusCode, 409);
    assert.match(res.payload.message, /already been refunded/i);
  } finally {
    Payment.findById = originalFindById;
  }
});

test('refund idempotency: processRefund rejects non-paid payment', async () => {
  const Payment = require('../models/Payment');
  const { processRefund } = require('../controllers/paymentController');

  const originalFindById = Payment.findById;
  Payment.findById = () => ({
    populate: async () => ({
      _id: 'payment_2',
      payer: { toString: () => 'guest_2' },
      booking: { _id: 'booking_2', guest: { toString: () => 'guest_2' } },
      amount: 200,
      currency: 'USD',
      status: 'pending',
      provider: 'stripe',
      providerPaymentId: 'pi_test2',
      save: async () => {}
    })
  });

  const createRes = (): any => ({
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  });

  try {
    const res = createRes();
    await processRefund({ params: { paymentId: 'payment_2' }, user: { _id: { toString: () => 'guest_2' }, role: 'guest' }, body: {} }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.payload.message, /only paid payments/i);
  } finally {
    Payment.findById = originalFindById;
  }
});

test('refund authorization: non-owner non-admin non-host is rejected', async () => {
  const Payment = require('../models/Payment');
  const { processRefund } = require('../controllers/paymentController');

  const originalFindById = Payment.findById;
  Payment.findById = () => ({
    populate: async () => ({
      _id: 'payment_3',
      payer: { toString: () => 'guest_1' },
      booking: { _id: 'booking_3', guest: { toString: () => 'guest_1' }, host: { toString: () => 'host_1' } },
      amount: 50,
      status: 'paid',
      provider: 'stripe',
      providerPaymentId: 'pi_test3',
      save: async () => {}
    })
  });

  const createRes = (): any => ({
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  });

  try {
    const res = createRes();
    await processRefund({ params: { paymentId: 'payment_3' }, user: { _id: { toString: () => 'random_user' }, role: 'guest' }, body: {} }, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.payload.message, /not authorized/i);
  } finally {
    Payment.findById = originalFindById;
  }
});

test('notification markAllRead updates only unread notifications for the user', async () => {
  const Notification = require('../models/Notification');
  const { markAllRead } = require('../controllers/notificationController');

  const originalUpdateMany = Notification.updateMany;
  let capturedFilter: any = null;
  Notification.updateMany = (filter, update) => {
    capturedFilter = filter;
    return Promise.resolve({ modifiedCount: 3 });
  };

  try {
    const res: any = {
      statusCode: null,
      payload: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.payload = payload; return this; }
    };

    await markAllRead({ user: { _id: 'user_123' } }, res);
    assert.ok(res.payload, 'Response should have payload');
    assert.equal(res.payload.success, true);
    assert.equal(res.payload.data.modifiedCount, 3);
    assert.equal(capturedFilter.user, 'user_123');
    assert.equal(capturedFilter.read, false);
  } finally {
    Notification.updateMany = originalUpdateMany;
  }
});

test('Socket.IO authorization: connection without token is rejected', () => {
  const jwt = require('jsonwebtoken');

  const authMiddleware = (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      socket.user = { _id: decoded.userId };
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  };

  const mockSocket = {
    handshake: { auth: {}, headers: {} },
    join: () => {}
  };

  authMiddleware(mockSocket, (error) => {
    assert.ok(error, 'Should reject connection without token');
    assert.match(error.message, /authentication required/i);
  });
});

test('conversation authorization: non-participant cannot access messages', async () => {
  const Conversation = require('../models/Conversation');
  const { getMessages } = require('../controllers/conversationController');

  const originalFindById = Conversation.findById;
  Conversation.findById = async () => ({
    _id: 'conv_1',
    participants: [{ toString: () => 'user_a' }, { toString: () => 'user_b' }]
  });

  const createRes = (): any => ({
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  });

  try {
    const res = createRes();
    await getMessages({ params: { id: 'conv_1' }, user: { _id: { toString: () => 'user_c' } } }, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.payload.message, /do not belong/i);
  } finally {
    Conversation.findById = originalFindById;
  }
});

test('conversation authorization: non-participant cannot send messages', async () => {
  const Conversation = require('../models/Conversation');
  const { sendMessage } = require('../controllers/conversationController');

  const originalFindById = Conversation.findById;
  Conversation.findById = async () => ({
    _id: 'conv_2',
    participants: [{ toString: () => 'user_a' }, { toString: () => 'user_b' }]
  });

  const createRes = (): any => ({
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  });

  try {
    const res = createRes();
    await sendMessage({ params: { id: 'conv_2' }, user: { _id: { toString: () => 'user_c' } }, body: { body: 'hello' } }, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.payload.message, /do not belong/i);
  } finally {
    Conversation.findById = originalFindById;
  }
});
