import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/roleAuth.js';
import { validateObjectId } from '../middlewares/validation.js';
import { createTicket, getMyTickets, getTicket, addTicketResponse, getAllTickets, updateTicketStatus } from '../controllers/supportTicketController.js';

const router = express.Router();

router.use(authenticate);

// User routes
router.post('/', createTicket);
router.get('/my-tickets', getMyTickets);
router.get('/:id', validateObjectId('id'), getTicket);
router.post('/:id/responses', validateObjectId('id'), addTicketResponse);

// Admin routes
router.get('/admin/all', requireAdmin, getAllTickets);
router.patch('/admin/:id/status', requireAdmin, validateObjectId('id'), updateTicketStatus);

export default router;
