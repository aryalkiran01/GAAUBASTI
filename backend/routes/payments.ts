import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { createPayment, verifyPayment, getPaymentStatus, handleStripeWebhook } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/webhook', handleStripeWebhook);
router.post('/create-intent', createPayment);

router.use(authenticate);
router.post('/create', createPayment);
router.post('/:paymentId/verify', verifyPayment);
router.get('/:paymentId', getPaymentStatus);

export default router;