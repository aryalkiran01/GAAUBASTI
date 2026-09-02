export {};
    import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth';
import { createReport } from '../controllers/reportController';

router.use(authenticate);
router.post('/', createReport);

export default router;
