export {};
    import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth';
import { createPayment, verifyPayment, getPaymentStatus, handleStripeWebhook } from '../controllers/paymentController';

router.post('/webhook', handleStripeWebhook);
router.post('/create-intent', createPayment);

router.use(authenticate);
router.post('/create', createPayment);
router.post('/:paymentId/verify', verifyPayment);
router.get('/:paymentId', getPaymentStatus);

module.exports = router;

