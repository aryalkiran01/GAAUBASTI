export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { createPayment, verifyPayment, getPaymentStatus, handleStripeWebhook, processRefund } = require('../controllers/paymentController');
const { createEsewaPayment, verifyEsewaPayment } = require('../controllers/esewaController');

router.post('/webhook', handleStripeWebhook);

router.use(authenticate);
router.post('/create-intent', createPayment);
router.post('/create', createPayment);
router.post('/esewa/create', createEsewaPayment);
router.post('/esewa/:paymentId/verify', verifyEsewaPayment);
router.post('/:paymentId/verify', verifyPayment);
router.post('/:paymentId/refund', processRefund);
router.get('/:paymentId', getPaymentStatus);

module.exports = router;

