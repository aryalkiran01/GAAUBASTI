import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/roleAuth.js';
import { validateObjectId } from '../middlewares/validation.js';
import { createDispute, getMyDisputes, getDispute, addDisputeResponse, getAllDisputes, resolveDispute } from '../controllers/disputeController.js';

const router = express.Router();

router.use(authenticate);

// User routes
router.post('/', createDispute);
router.get('/my-disputes', getMyDisputes);
router.get('/:id', validateObjectId('id'), getDispute);
router.post('/:id/responses', validateObjectId('id'), addDisputeResponse);

// Admin routes
router.get('/admin/all', requireAdmin, getAllDisputes);
router.patch('/admin/:id/resolve', requireAdmin, validateObjectId('id'), resolveDispute);

export default router;
