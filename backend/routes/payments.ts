export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  createPayment,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
  handleStripeWebhook,
  processRefund
} = require('../controllers/paymentController');

router.post('/webhook', handleStripeWebhook);

router.use(authenticate);
router.post('/create', createPayment);
router.get('/history', getPaymentHistory);
router.post('/:paymentId/verify', verifyPayment);
router.post('/:paymentId/refund', processRefund);
router.get('/:paymentId', getPaymentStatus);

module.exports = router;
