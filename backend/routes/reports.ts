import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { createReport } from '../controllers/reportController.js';

const router = express.Router();

router.use(authenticate);
router.post('/', createReport);

export default router;