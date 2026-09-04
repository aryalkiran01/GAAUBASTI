import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth.js';
import { getMyPayouts } from '../controllers/payoutController.js';

router.use(authenticate);
router.get('/', getMyPayouts);

export default router;
