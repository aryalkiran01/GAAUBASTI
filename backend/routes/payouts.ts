export {};
    import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth';
import { getMyPayouts } from '../controllers/payoutController';

router.use(authenticate);
router.get('/', getMyPayouts);

export default router;
