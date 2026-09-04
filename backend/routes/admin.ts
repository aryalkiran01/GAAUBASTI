import express from 'express';
import { getDashboardStats, getAllBookings, getAllUsers, updateUser, getAllListings, verifyListing, deleteListing, deactivateUser, reactivateUser, getFlaggedReviews, moderateReview, getAnalytics, getAuditLogs, getReportsForAdmin, getSuspiciousListingsHandler, moderateListingHandler, getPendingHostVerificationsHandler, reviewHostVerificationHandler, getFinancialRecords } from '../controllers/adminController.js';
import { updateReportStatus } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/roleAuth.js';
import { validateObjectId } from '../middlewares/validation.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard and analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', validateObjectId('id'), updateUser);
router.patch('/users/:id/deactivate', validateObjectId('id'), deactivateUser);
router.patch('/users/:id/reactivate', validateObjectId('id'), reactivateUser);

// Listing management
router.get('/listings', getAllListings);
router.get('/bookings', getAllBookings);
router.patch('/listings/:id/verify', validateObjectId('id'), verifyListing);
router.delete('/listings/:id', validateObjectId('id'), deleteListing);

// Review moderation and reports
router.get('/reviews/flagged', getFlaggedReviews);
router.patch('/reviews/:id/moderate', validateObjectId('id'), moderateReview);
router.get('/reports', getReportsForAdmin);
router.patch('/reports/:id/status', validateObjectId('id'), updateReportStatus);

// Suspicious listing detection and moderation
router.get('/listings/suspicious', getSuspiciousListingsHandler);
router.patch('/listings/:id/moderate', validateObjectId('id'), moderateListingHandler);

// Host verification
router.get('/host-verifications/pending', getPendingHostVerificationsHandler);
router.patch('/users/:id/host-verification', validateObjectId('id'), reviewHostVerificationHandler);

// Financial records
router.get('/transactions', getFinancialRecords);

export default router;