export {};
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const normalizeAmount = (value) => {
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const getConfiguredPaymentProvider = () => {
  const provider = (process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();

  if (!provider) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PAYMENT_PROVIDER is required in production. Configure a real payment provider such as Stripe.');
    }

    return 'stripe';
  }

  if (provider !== 'stripe') {
    throw new Error(`Unsupported payment provider: ${provider}. Only Stripe is allowed in production.`);
  }

  return provider;
};

const ensureBookingIsPayable = async ({ bookingId, userId, listingId, amount }) => {
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

const verifyPaymentOwnership = async ({ paymentId, userId, userRole, providerPaymentId, amount }) => {
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

  if (amount !== null && payment.amount !== undefined && Math.abs(Number(payment.amount) - Number(amount)) > 0.01) {
    return { status: 400, error: 'Payment verification amount does not match the stored booking payment' };
  }

  if (providerPaymentId && payment.providerPaymentId && providerPaymentId !== payment.providerPaymentId) {
    return { status: 400, error: 'The supplied provider payment ID does not match the payment record' };
  }

  return { payment };
};

const createPayment = async (req, res) => {
  try {
    const { bookingId, listingId, currency = 'USD', idempotencyKey } = req.body;

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

    const authoritativeAmount = Number(booking.totalPrice);
    if (!Number.isFinite(authoritativeAmount) || authoritativeAmount < 0) {
      return res.status(500).json({
        success: false,
        message: 'Booking total price is not available. Cannot initialize payment.'
      });
    }

    let provider;
    try {
      provider = getConfiguredPaymentProvider();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

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

      return res.status(200).json({
        success: true,
        message: 'Payment already initialized for this booking',
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

    const key = typeof idempotencyKey === 'string' && idempotencyKey.trim() ? idempotencyKey.trim() : `${booking._id.toString()}:${Date.now()}`;
    const existingIdempotentPayment = await Payment.findOne({
      booking: booking._id,
      payer: req.user._id,
      idempotencyKey: key
    });

    if (existingIdempotentPayment) {
      return res.status(200).json({
        success: true,
        message: 'Payment already initialized for this booking',
        data: {
          paymentId: existingIdempotentPayment._id,
          provider: existingIdempotentPayment.provider,
          status: existingIdempotentPayment.status,
          amount: existingIdempotentPayment.amount,
          currency: existingIdempotentPayment.currency,
          providerPaymentId: existingIdempotentPayment.providerPaymentId,
          clientSecret: existingIdempotentPayment.provider === 'stripe' ? existingIdempotentPayment.metadata?.clientSecret || undefined : undefined
        }
      });
    }

    const newPayment = await Payment.findOneAndUpdate(
      { booking: booking._id, idempotencyKey: key },
      {
        booking: booking._id,
        listing: booking.listing._id,
        payer: req.user._id,
        amount: authoritativeAmount,
        currency,
        provider,
        idempotencyKey: key,
        status: 'pending',
        metadata: {
          bookingId: booking._id.toString(),
          listingId: booking.listing._id.toString(),
          userId: req.user._id.toString()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (provider === 'stripe') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return res.status(500).json({
          success: false,
          message: 'Stripe is configured as the payment provider but the STRIPE_SECRET_KEY is missing.'
        });
      }

      let stripe;
      try {
        stripe = require('stripe')(stripeKey);
      } catch (providerError) {
        return res.status(500).json({
          success: false,
          message: 'Stripe integration is not installed in this environment.'
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(authoritativeAmount * 100),
        currency: String(currency || 'usd').toLowerCase(),
        metadata: {
          bookingId: booking._id.toString(),
          listingId: booking.listing._id.toString(),
          userId: req.user._id.toString(),
          paymentId: newPayment._id.toString()
        },
        automatic_payment_methods: { enabled: true }
      });

      await Payment.findByIdAndUpdate(newPayment._id, {
        providerPaymentId: paymentIntent.id,
        status: 'processing',
        metadata: {
          ...newPayment.metadata?.toObject ? newPayment.metadata.toObject() : (newPayment.metadata || {}),
          clientSecret: paymentIntent.client_secret
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Payment intent created',
        data: {
          paymentId: newPayment._id,
          provider: 'stripe',
          status: 'processing',
          providerPaymentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: authoritativeAmount,
          currency: String(currency || 'USD').toUpperCase(),
          priceBreakdown: booking.priceBreakdown
        }
      });
    }

    return res.status(501).json({
      success: false,
      message: 'No supported payment provider is configured for this environment.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { providerPaymentId } = req.body || {};
    const normalizedAmount = normalizeAmount(req.body?.amount ?? null);

    const ownershipCheck = await verifyPaymentOwnership({
      paymentId,
      userId: req.user._id,
      userRole: req.user.role,
      providerPaymentId,
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
          bookingId: payment.booking._id,
          status: 'paid'
        }
      });
    }

    if (payment.provider !== 'stripe') {
      return res.status(501).json({
        success: false,
        message: 'This payment provider is not supported. Configure Stripe for production-safe verification.'
      });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is configured as the payment provider but the STRIPE_SECRET_KEY is missing.'
      });
    }

    let stripe;
    try {
      stripe = require('stripe')(stripeKey);
    } catch (providerError) {
      return res.status(500).json({
        success: false,
        message: 'Stripe integration is not installed in this environment.'
      });
    }

    const intent = await stripe.paymentIntents.retrieve(providerPaymentId || payment.providerPaymentId);
    const amountMatches = Number(intent.amount) === Math.round(Number(payment.amount) * 100);

    if (intent.status !== 'succeeded' || !amountMatches) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    payment.status = 'paid';
    payment.providerPaymentId = providerPaymentId || payment.providerPaymentId;
    await payment.save();

    const booking = payment.booking;
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

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment._id,
        bookingId: booking._id,
        status: 'paid'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const isDuplicateWebhook = async (eventId) => {
  if (!eventId) return false;
  const WebhookLog = require('../models/WebhookLog');
  const existing = await WebhookLog.findOne({ eventId });
  if (existing) return true;
  await WebhookLog.create({ eventId, processedAt: new Date() });
  return false;
};

const handleStripeWebhook = async (req, res) => {
  try {
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey || !stripeSecret) {
      return res.status(500).json({
        success: false,
        message: 'Stripe webhook configuration is missing'
      });
    }

    const configuredProvider = getConfiguredPaymentProvider();
    if (configuredProvider !== 'stripe') {
      return res.status(501).json({
        success: false,
        message: 'Stripe payment provider is not configured for this environment.'
      });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Stripe signature'
      });
    }

    const stripe = require('stripe')(stripeKey);
    const event = stripe.webhooks.constructEvent(req.body, signature, stripeSecret);

    if (await isDuplicateWebhook(event.id)) {
      return res.status(200).json({ success: true, received: true, duplicate: true });
    }

    const eventObject = event.data && event.data.object ? event.data.object : null;

    if (!eventObject) {
      return res.status(400).json({ success: false, message: 'Invalid Stripe event payload' });
    }

    const paymentIntentId = eventObject.payment_intent || eventObject.id;
    if (paymentIntentId) {
      const payment = await Payment.findOne({ providerPaymentId: paymentIntentId });

      if (payment) {
        if (event.type === 'payment_intent.succeeded') {
          if (payment.status !== 'paid') {
            payment.status = 'paid';
            await payment.save();

            const booking = await Booking.findById(payment.booking);
            if (booking && booking.status !== 'confirmed') {
              booking.paymentStatus = 'paid';
              booking.status = 'confirmed';
              booking.paymentId = payment._id.toString();
              await booking.save();
            }
          }
        }

        if (event.type === 'payment_intent.payment_failed') {
          if (payment.status !== 'failed') {
            payment.status = 'failed';
            await payment.save();

            const booking = await Booking.findById(payment.booking);
            if (booking) {
              booking.paymentStatus = 'failed';
              await booking.save();
            }
          }
        }

        if (event.type === 'charge.refunded') {
          if (payment.status !== 'refunded') {
            payment.status = 'refunded';
            await payment.save();

            const booking = await Booking.findById(payment.booking);
            if (booking && booking.status !== 'refunded') {
              booking.paymentStatus = 'refunded';
              booking.status = 'refunded';
              await booking.save();
            }

            const Transaction = require('../models/Transaction');
            const existingRefundTx = await Transaction.findOne({
              type: 'refund',
              payment: payment._id,
              reference: event.id
            });
            if (!existingRefundTx) {
              await Transaction.create({
                type: 'refund',
                booking: booking ? booking._id : undefined,
                payment: payment._id,
                user: payment.payer,
                amount: payment.amount,
                currency: payment.currency,
                direction: 'credit',
                status: 'completed',
                description: 'Stripe webhook refund',
                reference: event.id
              });
            }
          }
        }
      }
    }

    return res.status(200).json({ success: true, received: true });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Stripe webhook verification failed',
      error: process.env.NODE_ENV === 'development' && process.env.DEBUG_ERRORS === 'true' ? error.message : undefined
    });
  }
};

const getPaymentStatus = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body || {};

    const payment = await Payment.findById(paymentId).populate('booking');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const isOwner = payment.payer && payment.payer.toString() === req.user._id.toString();
    const isBookingGuest = payment.booking && payment.booking.guest && payment.booking.guest.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isHost = payment.booking && payment.booking.host && payment.booking.host.toString() === req.user._id.toString();

    if (!isOwner && !isBookingGuest && !isAdmin && !isHost) {
      return res.status(403).json({ success: false, message: 'You are not authorized to refund this payment' });
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

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ success: false, message: 'Stripe is not configured' });
    }

    let stripe;
    try {
      stripe = require('stripe')(stripeKey);
    } catch (providerError) {
      return res.status(500).json({ success: false, message: 'Stripe integration is not installed' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment.providerPaymentId,
      amount: Math.round(refundAmount * 100),
      metadata: {
        paymentId: payment._id.toString(),
        bookingId: payment.booking ? payment.booking._id.toString() : '',
        reason: reason || 'cancellation'
      }
    }, {
      idempotencyKey
    });

    payment.status = 'refunded';
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
      reference: refund.id || idempotencyKey
    });

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: { refundId: refund.id, amount: refundAmount, paymentId: payment._id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPaymentHistory = async (req, res) => {
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
  } catch (error) {
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
  getPaymentStatus,
  getPaymentHistory,
  processRefund,
  ensureBookingIsPayable,
  verifyPaymentOwnership,
  normalizeAmount,
  getConfiguredPaymentProvider,
  isDuplicateWebhook
};
