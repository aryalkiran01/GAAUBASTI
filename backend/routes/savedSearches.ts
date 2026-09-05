import express from 'express';
import { authenticate } from '../middlewares/auth';
import { validateObjectId } from '../middlewares/validation';
import {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch
} from '../controllers/savedSearchController';

const router = express.Router();

router.use(authenticate);

router.get('/', getSavedSearches);
router.post('/', createSavedSearch);
router.delete('/:id', validateObjectId('id'), deleteSavedSearch);

export default router;
