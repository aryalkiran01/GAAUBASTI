export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { createPayment, verifyPayment, getPaymentStatus, handleStripeWebhook } = require('../controllers/paymentController');

router.post('/webhook', handleStripeWebhook);
router.post('/create-intent', createPayment);

router.use(authenticate);
router.post('/create', createPayment);
router.post('/:paymentId/verify', verifyPayment);
router.get('/:paymentId', getPaymentStatus);

module.exports = router;

