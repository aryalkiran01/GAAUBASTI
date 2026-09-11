const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  createPayment,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
  handleStripeWebhook,
  handleUniversalWebhook,
  processRefund
} = require('../controllers/paymentController');

// Webhook endpoints
router.post('/webhook', handleStripeWebhook);
router.post('/webhook/:provider', (req: any, res: any) => {
  const provider = req.params.provider;
  return handleUniversalWebhook(provider, req, res);
});

// Authenticated payment operations
router.use(authenticate);
router.post('/create', createPayment);
router.get('/history', getPaymentHistory);
router.post('/:paymentId/verify', verifyPayment);
router.post('/:paymentId/refund', processRefund);
router.get('/:paymentId', getPaymentStatus);

export default router;
