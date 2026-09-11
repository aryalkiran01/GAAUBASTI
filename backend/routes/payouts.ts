const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/roleAuth');
const { validateObjectId } = require('../middlewares/validation');
const {
  getMyPayouts,
  getAllPayouts,
  getEligibleEarnings,
  createPayout,
  approvePayout,
  markPayoutPaid,
  reconcilePayout,
  cancelPayout
} = require('../controllers/payoutController');

router.use(authenticate);

// Host-facing routes (host sees their own payouts and can request payout)
router.get('/', getMyPayouts);
router.post('/request', createPayout);

// Admin routes
router.get('/admin/all', requireAdmin, getAllPayouts);
router.get('/admin/eligible', requireAdmin, getEligibleEarnings);
router.post('/admin/create', requireAdmin, createPayout);
router.patch('/admin/:id/approve', requireAdmin, validateObjectId('id'), approvePayout);
router.patch('/admin/:id/mark-paid', requireAdmin, validateObjectId('id'), markPayoutPaid);
router.patch('/admin/:id/reconcile', requireAdmin, validateObjectId('id'), reconcilePayout);
router.patch('/admin/:id/cancel', requireAdmin, validateObjectId('id'), cancelPayout);

export default router;
