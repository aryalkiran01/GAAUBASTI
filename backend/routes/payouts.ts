import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getMyPayouts } from '../controllers/payoutController.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getMyPayouts);

export default router;