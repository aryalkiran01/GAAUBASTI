export {};
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { createPaymentTransaction } = require('../services/earningsService');
const { logPaymentFailure, logWebhookFailure } = require('../services/monitoringService');
const { getPaymentProvider, isSupportedProvider, convertToNpr } = require('../services/paymentProviders');

const normalizeAmount = (value: any): number | null => {
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const getConfiguredPaymentProvider = (requestedProvider?: string): string => {
  if (requestedProvider && isSupportedProvider(requestedProvider)) {
    return requestedProvider.toLowerCase().trim();
  }

  const envProvider = (process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();

  if (!envProvider) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PAYMENT_PROVIDER is required in production environment');
    }
    return 'stripe';
  }

  if (!isSupportedProvider(envProvider)) {
    throw new Error(`Unsupported payment provider: "${envProvider}". Supported providers: stripe, esewa, khalti.`);
  }

  return envProvider;
};

const ensureBookingIsPayable = async ({ bookingId, userId, listingId, amount }: any) => {
  const booking = await Booking.findById(bookingId).populate('listing');

  if (!booking) {
    return { status: 404, error: 'Booking not found' };
  }

  if (booking.guest.toString() !== userId.toString()) {
    return { status: 403, error: 'You cannot pay for this booking' };
  }

  if (listingId && booking.listing && booking.listing._id.toString() !== listingId.toString()) {
    return { status: 400, error: 'Booking does not match the selected listing' };
  }

  if (amount !== undefined && amount !== null) {
    const clientAmount = normalizeAmount(amount);
    if (clientAmount === null || Math.abs(Number(booking.totalPrice) - clientAmount) > 0.01) {
      return { status: 400, error: 'Client-provided amount does not match the booking total' };
    }
  }

  if (booking.paymentStatus === 'paid' || booking.status === 'confirmed') {
    return { status: 409, error: 'This booking is already paid and confirmed' };
  }

  return { booking };
};

const verifyPaymentOwnership = async ({ paymentId, userId, userRole, providerPaymentId, amount }: any) => {
  const payment = await Payment.findById(paymentId).populate('booking');

  if (!payment) {
    return { status: 404, error: 'Payment not found' };
  }

  const isAdmin = userRole === 'admin';

  if (!isAdmin && payment.payer && payment.payer.toString() !== userId.toString()) {
    return { status: 403, error: 'You do not own this payment' };
  }

  if (!isAdmin && payment.booking && payment.booking.guest && payment.booking.guest.toString() !== userId.toString()) {
    return { status: 403, error: 'You cannot verify this booking payment' };
  }

  if (amount !== null && amount !== undefined && payment.amount !== undefined && Math.abs(Number(payment.amount) - Number(amount)) > 0.01) {
    return { status: 400, error: 'Payment verification amount does not match the stored booking payment' };
  }

  if (providerPaymentId && payment.providerPaymentId && providerPaymentId !== payment.providerPaymentId) {
    return { status: 400, error: 'The supplied provider payment ID does not match the payment record' };
  }

  return { payment };
};

const createPayment = async (req: any, res: any) => {
  try {
    const { bookingId, listingId, currency, provider: reqProvider, idempotencyKey, returnUrl } = req.body;

    const validation = await ensureBookingIsPayable({
      bookingId,
      userId: req.user._id,
      listingId,
      amount: undefined
    });

    if (validation.status) {
      return res.status(validation.status).json({
        success: false,
        message: validation.error
      });
    }

    const { booking } = validation;

    const authoritativeUsdAmount = Number(booking.totalPrice);
    if (!Number.isFinite(authoritativeUsdAmount) || authoritativeUsdAmount < 0) {
      return res.status(500).json({
        success: false,
        message: 'Booking total price is not available. Cannot initialize payment.'
      });
    }

    let providerName: string;
    try {
      providerName = getConfiguredPaymentProvider(reqProvider);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    const targetCurrency = providerName === 'esewa' || providerName === 'khalti'
      ? 'NPR'
      : (currency ? String(currency).toUpperCase() : 'USD');

    const authoritativeAmount = targetCurrency === 'NPR'
      ? convertToNpr(authoritativeUsdAmount)
      : authoritativeUsdAmount;

    // Check existing active payment for same booking and payer
    const activePayment = await Payment.findOne({
      booking: booking._id,
      payer: req.user._id,
      status: { $in: ['pending', 'processing', 'paid'] }
    }).sort({ createdAt: -1 });

    if (activePayment) {
      if (activePayment.status === 'paid') {
        return res.status(200).json({
          success: true,
          message: 'Payment already processed',
          data: {
            paymentId: activePayment._id,
            provider: activePayment.provider,
            status: activePayment.status,
            amount: activePayment.amount,
            currency: activePayment.currency,
            providerPaymentId: activePayment.providerPaymentId
          }
        });
      }

      if (activePayment.provider === providerName) {
        return res.status(200).json({
          success: true,
          message: 'Payment already initialized for this booking',
          data: {
            paymentId: activePayment._id,
            provider: activePayment.provider,
            status: activePayment.status,
            amount: activePayment.amount,
            currency: activePayment.currency,
            providerPaymentId: activePayment.providerPaymentId,
            clientSecret: activePayment.metadata?.get ? activePayment.metadata.get('clientSecret') : activePayment.metadata?.clientSecret
          }
        });
      }
    }

    const key = typeof idempotencyKey === 'string' && idempotencyKey.trim()
      ? idempotencyKey.trim()
      : `${booking._id.toString()}:${providerName}:${Date.now()}`;

    const newPayment = await Payment.findOneAndUpdate(
      { booking: booking._id, idempotencyKey: key },
      {
        booking: booking._id,
        listing: booking.listing._id,
        payer: req.user._id,
        amount: authoritativeAmount,
        currency: targetCurrency,
        provider: providerName,
        idempotencyKey: key,
        status: 'pending',
        metadata: {
          bookingId: booking._id.toString(),
          listingId: booking.listing._id.toString(),
          userId: req.user._id.toString(),
          authoritativeUsdAmount: String(authoritativeUsdAmount)
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const providerAdapter = getPaymentProvider(providerName);
    const initResult = await providerAdapter.initializePayment({
      payment: newPayment,
      booking,
      user: req.user,
      amount: authoritativeAmount,
      currency: targetCurrency,
      returnUrl
    });

    await Payment.findByIdAndUpdate(newPayment._id, {
      providerPaymentId: initResult.providerPaymentId,
      status: initResult.status,
      metadata: {
        ...(newPayment.metadata?.toObject ? newPayment.metadata.toObject() : (newPayment.metadata || {})),
        clientSecret: initResult.clientSecret || undefined,
        paymentUrl: initResult.paymentUrl || undefined
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        ...initResult,
        paymentId: newPayment._id.toString(),
        authoritativeUsdAmount
      }
    });
  } catch (error: any) {
    logPaymentFailure(req.user?._id?.toString() || '', req.body?.bookingId || '', error.message || 'Payment initialization failed').catch(() => {});
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifyPayment = async (req: any, res: any) => {
  try {
    const { paymentId } = req.params;
    const { providerPaymentId, data, pidx, transaction_uuid } = req.body || {};
    const normalizedAmount = normalizeAmount(req.body?.amount ?? null);

    const ownershipCheck = await verifyPaymentOwnership({
      paymentId,
      userId: req.user._id,
      userRole: req.user.role,
      providerPaymentId: providerPaymentId || pidx || transaction_uuid,
      amount: normalizedAmount
    });

    if (ownershipCheck.status) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }

    const { payment } = ownershipCheck;

    if (payment.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: {
          paymentId: payment._id,
          bookingId: payment.booking?._id || payment.booking,
          status: 'paid'
        }
      });
    }

    const providerAdapter = getPaymentProvider(payment.provider);
    const verifyResult = await providerAdapter.verifyPayment({
      payment,
      providerPaymentId: providerPaymentId || pidx || transaction_uuid,
      queryOrBody: req.body,
      amount: normalizedAmount ?? payment.amount
    });

    if (!verifyResult.success || verifyResult.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: verifyResult.error || 'Payment verification failed'
      });
    }

    payment.status = 'paid';
    payment.providerPaymentId = verifyResult.providerPaymentId || payment.providerPaymentId;
    await payment.save();

    const booking = await Booking.findById(payment.booking?._id || payment.booking);
    if (booking && booking.status !== 'confirmed') {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      booking.paymentId = payment._id.toString();
      await booking.save();
    }

    const populatedBooking = await Booking.findById(booking._id).populate([
      { path: 'listing', select: 'title' },
      { path: 'guest', select: 'name email' },
      { path: 'host', select: 'name email' }
    ]);

    const { notifyPaymentConfirmed } = require('../utils/notifications');
    notifyPaymentConfirmed({
      booking: populatedBooking,
      guest: populatedBooking.guest,
      host: populatedBooking.host,
      payment
    }).catch(() => {});

    createPaymentTransaction(populatedBooking, payment).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment._id,
        bookingId: booking._id,
        status: 'paid',
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const isDuplicateWebhook = async (eventId: string): Promise<boolean> => {
  if (!eventId) return false;
  const WebhookLog = require('../models/WebhookLog');
  try {
    const existing = await WebhookLog.findOne({ eventId });
    if (existing) return true;
    await WebhookLog.create({ eventId, processedAt: new Date() });
    return false;
  } catch (err: any) {
    if (err?.name === 'MongooseError' && err?.message?.includes('buffering')) {
      return false;
    }
    return false;
  }
};

const handleStripeWebhook = async (req: any, res: any) => {
  return handleUniversalWebhook('stripe', req, res);
};

const handleUniversalWebhook = async (providerName: string, req: any, res: any) => {
  try {
    const providerAdapter = getPaymentProvider(providerName);
    const webhookResult = await providerAdapter.handleWebhook({
      headers: req.headers,
      rawBody: req.body,
      body: req.body
    });

    if (!webhookResult.handled) {
      return res.status(400).json({ success: false, message: webhookResult.error || 'Webhook not handled' });
    }

    if (webhookResult.eventId && (await isDuplicateWebhook(webhookResult.eventId))) {
      return res.status(200).json({ success: true, received: true, duplicate: true });
    }

    if (webhookResult.providerPaymentId) {
      const payment = await Payment.findOne({
        providerPaymentId: webhookResult.providerPaymentId
      });

      if (payment) {
        if (webhookResult.status === 'paid' && payment.status !== 'paid') {
          payment.status = 'paid';
          await payment.save();

          const booking = await Booking.findById(payment.booking);
          if (booking && booking.status !== 'confirmed') {
            booking.paymentStatus = 'paid';
            booking.status = 'confirmed';
            booking.paymentId = payment._id.toString();
            await booking.save();
          }
        } else if (webhookResult.status === 'failed' && payment.status !== 'failed') {
          payment.status = 'failed';
          await payment.save();

          const booking = await Booking.findById(payment.booking);
          if (booking) {
            booking.paymentStatus = 'failed';
            await booking.save();
          }
        } else if (webhookResult.status === 'refunded' && payment.status !== 'refunded') {
          payment.status = 'refunded';
          await payment.save();

          const booking = await Booking.findById(payment.booking);
          if (booking && booking.status !== 'refunded') {
            booking.paymentStatus = 'refunded';
            booking.status = 'refunded';
            await booking.save();
          }
        }
      }
    }

    return res.status(200).json({ success: true, received: true });
  } catch (error: any) {
    logWebhookFailure(`${providerName}_webhook`, error.message || 'Webhook processing failed').catch(() => {});
    return res.status(400).json({
      success: false,
      message: `${providerName} webhook processing failed`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPaymentStatus = async (req: any, res: any) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('booking');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const isOwner = payment.payer && payment.payer.toString() === req.user._id.toString();
    const isBookingGuest = payment.booking && payment.booking.guest && payment.booking.guest.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isBookingGuest && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this payment'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const processRefund = async (req: any, res: any) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body || {};

    const payment = await Payment.findById(paymentId).populate('booking');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isHost = payment.booking && payment.booking.host && payment.booking.host.toString() === req.user._id.toString();

    if (!isAdmin && !isHost) {
      return res.status(403).json({ success: false, message: 'You are not authorized to process refunds' });
    }

    if (payment.status === 'refunded') {
      return res.status(409).json({ success: false, message: 'Payment has already been refunded' });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Only paid payments can be refunded' });
    }

    const refundAmount = amount ? Number(amount) : payment.amount;
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > payment.amount) {
      return res.status(400).json({ success: false, message: 'Invalid refund amount' });
    }

    const Transaction = require('../models/Transaction');
    const idempotencyKey = `refund:${payment._id}:${refundAmount}`;
    const existingRefund = await Transaction.findOne({ type: 'refund', payment: payment._id, reference: idempotencyKey });
    if (existingRefund) {
      return res.status(409).json({ success: false, message: 'Refund already processed for this payment' });
    }

    const providerAdapter = getPaymentProvider(payment.provider);
    let refundResult;
    try {
      refundResult = await providerAdapter.processRefund({
        payment,
        amount: refundAmount,
        reason: reason || 'cancellation',
        idempotencyKey
      });
    } catch (err: any) {
      payment.status = 'refund_failed';
      payment.notes = `Refund failed: ${err.message}`;
      await payment.save();

      logPaymentFailure('refund_error', err.message || 'Refund call failed', {
        paymentId: payment._id.toString(),
        refundAmount
      }).catch(() => {});

      return res.status(502).json({
        success: false,
        message: 'Payment processor failed to issue the refund. The failure has been logged for manual reconciliation.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    payment.status = refundAmount >= payment.amount ? 'refunded' : 'partially_refunded';
    payment.notes = null;
    await payment.save();

    const booking = payment.booking;
    if (booking && booking.status !== 'refunded') {
      booking.paymentStatus = 'refunded';
      booking.status = 'refunded';
      await booking.save();
    }

    await Transaction.create({
      type: 'refund',
      booking: booking ? booking._id : undefined,
      payment: payment._id,
      user: payment.payer,
      amount: refundAmount,
      currency: payment.currency,
      direction: 'credit',
      status: 'completed',
      description: reason || 'Refund processed',
      reference: refundResult.refundId || idempotencyKey
    });

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: { refundId: refundResult.refundId, amount: refundAmount, paymentId: payment._id }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPaymentHistory = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { payer: req.user._id };

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('booking', 'title location images startDate endDate status')
        .populate('listing', 'title location images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPayments: total
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  handleStripeWebhook,
  handleUniversalWebhook,
  getPaymentStatus,
  getPaymentHistory,
  processRefund,
  ensureBookingIsPayable,
  verifyPaymentOwnership,
  normalizeAmount,
  getConfiguredPaymentProvider,
  isDuplicateWebhook
};
