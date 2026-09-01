const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const normalizeAmount = (value) => {
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const ensureBookingIsPayable = async ({ bookingId, userId, amount, listingId }) => {
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

  if (booking.paymentStatus === 'paid' || booking.status === 'confirmed') {
    return { status: 409, error: 'This booking is already paid and confirmed' };
  }

  if (amount === null) {
    return { status: 400, error: 'Valid payment amount is required' };
  }

  const expectedAmount = Number(booking.totalPrice);
  if (Math.abs(expectedAmount - amount) > 0.01) {
    return { status: 400, error: 'Payment amount does not match the booking total' };
  }

  return { booking };
};

const createPayment = async (req, res) => {
  try {
    const { bookingId, listingId, amount, currency = 'USD', idempotencyKey } = req.body;
    const normalizedAmount = normalizeAmount(amount);

    const validation = await ensureBookingIsPayable({
      bookingId,
      userId: req.user._id,
      amount: normalizedAmount,
      listingId
    });

    if (validation.status) {
      return res.status(validation.status).json({
        success: false,
        message: validation.error
      });
    }

    const { booking } = validation;
    const provider = process.env.PAYMENT_PROVIDER || 'mock';
    const payment = await Payment.findOne({ booking: booking._id, idempotencyKey: idempotencyKey || { $exists: false } });

    if (payment && payment.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        data: {
          paymentId: payment._id,
          provider: payment.provider,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          providerPaymentId: payment.providerPaymentId
        }
      });
    }

    const key = idempotencyKey || `${booking._id.toString()}:${Date.now()}`;
    const newPayment = await Payment.findOneAndUpdate(
      { booking: booking._id, idempotencyKey: key },
      {
        booking: booking._id,
        listing: booking.listing._id,
        payer: req.user._id,
        amount: normalizedAmount,
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
        amount: Math.round(normalizedAmount * 100),
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
        status: 'processing'
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
          amount: normalizedAmount,
          currency: String(currency || 'USD').toUpperCase()
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment initialized securely on the server',
      data: {
        paymentId: newPayment._id,
        provider: 'mock',
        status: 'pending',
        amount: normalizedAmount,
        currency: String(currency || 'USD').toUpperCase()
      }
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

    const payment = await Payment.findById(paymentId).populate('booking');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

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

    if (payment.provider === 'stripe') {
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

const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
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

module.exports = {
  createPayment,
  verifyPayment,
  getPaymentStatus
};
