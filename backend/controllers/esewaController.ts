export {};
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');
const { notifyPaymentConfirmed } = require('../utils/notifications');

const ESEWA_ENDPOINTS = {
  sandbox: 'https://uat.esewa.com.np',
  production: 'https://esewa.com.np'
};

const getEsewaConfig = () => {
  const merchantId = process.env.ESEWA_MERCHANT_ID;
  const secretKey = process.env.ESEWA_SECRET_KEY;
  const environment = (process.env.ESEWA_ENVIRONMENT || 'sandbox').toLowerCase();

  if (!merchantId || !secretKey) {
    throw new Error('eSewa credentials are not configured. Set ESEWA_MERCHANT_ID and ESEWA_SECRET_KEY in the backend environment.');
  }

  return { merchantId, secretKey, environment, baseUrl: ESEWA_ENDPOINTS[environment] || ESEWA_ENDPOINTS.sandbox };
};

const generateEsewaSignature = (totalAmount, transactionUuid, productCode, secretKey) => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
};

const createEsewaPayment = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const normalizedAmount = Number(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId).populate('listing');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot pay for this booking' });
    }

    if (booking.paymentStatus === 'paid' || booking.status === 'confirmed') {
      return res.status(409).json({ success: false, message: 'This booking is already paid' });
    }

    if (Math.abs(Number(booking.totalPrice) - normalizedAmount) > 0.01) {
      return res.status(400).json({ success: false, message: 'Payment amount does not match the booking total' });
    }

    let config;
    try { config = getEsewaConfig(); } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }

    const transactionUuid = `esewa_${booking._id}_${Date.now()}`;
    const existingPayment = await Payment.findOne({ booking: booking._id, payer: req.user._id, status: { $in: ['pending', 'processing', 'paid'] } });
    if (existingPayment && existingPayment.status === 'paid') {
      return res.status(200).json({ success: true, message: 'Payment already processed', data: { paymentId: existingPayment._id, status: 'paid' } });
    }

    const payment = existingPayment || new Payment({
      booking: booking._id,
      listing: booking.listing._id,
      payer: req.user._id,
      amount: normalizedAmount,
      currency: 'NPR',
      provider: 'esewa',
      idempotencyKey: transactionUuid,
      status: 'pending'
    });
    payment.providerPaymentId = transactionUuid;
    await payment.save();

    return res.status(200).json({
      success: true,
      message: 'eSewa payment initiated',
      data: {
        paymentId: payment._id,
        transactionUuid,
        amount: normalizedAmount,
        merchantId: config.merchantId,
        environment: config.environment,
        baseUrl: config.baseUrl,
        successUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment/esewa-success`,
        failureUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment/esewa-failure`
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to initiate eSewa payment' });
  }
};

const verifyEsewaPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { transactionUuid, totalAmount, productCode, signature } = req.body || {};

    if (!transactionUuid || !totalAmount || !productCode || !signature) {
      return res.status(400).json({ success: false, message: 'Missing eSewa verification parameters' });
    }

    const payment = await Payment.findById(paymentId).populate('booking');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.payer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You do not own this payment' });
    }

    if (payment.status === 'paid') {
      return res.status(200).json({ success: true, message: 'Payment already verified', data: { paymentId: payment._id, status: 'paid' } });
    }

    let config;
    try { config = getEsewaConfig(); } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }

    if (productCode !== config.merchantId) {
      return res.status(400).json({ success: false, message: 'Merchant ID mismatch' });
    }

    const expectedSignature = generateEsewaSignature(totalAmount, transactionUuid, productCode, config.secretKey);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return res.status(400).json({ success: false, message: 'Invalid eSewa signature' });
    }

    if (Math.abs(Number(payment.amount) - Number(totalAmount)) > 0.01) {
      return res.status(400).json({ success: false, message: 'Amount mismatch' });
    }

    if (payment.providerPaymentId !== transactionUuid) {
      return res.status(400).json({ success: false, message: 'Transaction UUID mismatch' });
    }

    const verifyUrl = `${config.baseUrl}/api/epay/verify/`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_uuid: transactionUuid, product_code: productCode, total_amount: totalAmount })
    });

    if (!verifyResponse.ok) {
      return res.status(400).json({ success: false, message: 'eSewa server verification failed' });
    }

    const verifyData: any = await verifyResponse.json();
    if (verifyData.status !== 'COMPLETE') {
      return res.status(400).json({ success: false, message: 'eSewa payment not completed' });
    }

    payment.status = 'paid';
    await payment.save();

    const booking = payment.booking;
    if (booking && booking.status !== 'confirmed') {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      booking.paymentId = payment._id.toString();
      await booking.save();
    }

    const existingTxn = await Transaction.findOne({ type: 'payment', payment: payment._id });
    if (!existingTxn) {
      const commissionRate = 0.10;
      const commissionAmount = Math.round(payment.amount * commissionRate * 100) / 100;
      const hostEarnings = Math.round((payment.amount - commissionAmount) * 100) / 100;

      await Transaction.create({
        type: 'payment',
        booking: booking ? booking._id : undefined,
        payment: payment._id,
        user: payment.payer,
        amount: payment.amount,
        currency: payment.currency,
        direction: 'credit',
        status: 'completed',
        description: 'eSewa payment received',
        reference: transactionUuid
      });

      await Transaction.create({
        type: 'commission',
        booking: booking ? booking._id : undefined,
        payment: payment._id,
        user: booking ? booking.host : undefined,
        amount: commissionAmount,
        currency: payment.currency,
        direction: 'debit',
        commissionRate,
        commissionAmount,
        hostEarnings,
        status: 'completed',
        description: 'Platform commission deducted',
        reference: `commission_${transactionUuid}`
      });
    }

    const populatedBooking = await Booking.findById(booking._id).populate([
      { path: 'listing', select: 'title' },
      { path: 'guest', select: 'name email' },
      { path: 'host', select: 'name email' }
    ]);

    notifyPaymentConfirmed({
      booking: populatedBooking,
      guest: populatedBooking.guest,
      host: populatedBooking.host,
      payment
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'eSewa payment verified successfully',
      data: { paymentId: payment._id, bookingId: booking._id, status: 'paid' }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to verify eSewa payment' });
  }
};

module.exports = { createEsewaPayment, verifyEsewaPayment, getEsewaConfig };
