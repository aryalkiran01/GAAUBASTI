import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth.js';
import { createPayment, verifyPayment, getPaymentStatus, handleStripeWebhook, processRefund } from '../controllers/paymentController.js';
import { createEsewaPayment, verifyEsewaPayment } from '../controllers/esewaController.js';

router.post('/webhook', handleStripeWebhook);

router.use(authenticate);
router.post('/create-intent', createPayment);
router.post('/create', createPayment);
router.post('/esewa/create', createEsewaPayment);
router.post('/esewa/:paymentId/verify', verifyEsewaPayment);
router.post('/:paymentId/verify', verifyPayment);
router.post('/:paymentId/refund', processRefund);
router.get('/:paymentId', getPaymentStatus);

export default router;

