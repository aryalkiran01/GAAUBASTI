import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth.js';
import { createReport } from '../controllers/reportController.js';

router.use(authenticate);
router.post('/', createReport);

export default router;
