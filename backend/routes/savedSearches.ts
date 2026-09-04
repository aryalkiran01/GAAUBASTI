export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');
const {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch
} = require('../controllers/savedSearchController');

router.use(authenticate);

router.get('/', getSavedSearches);
router.post('/', createSavedSearch);
router.delete('/:id', validateObjectId('id'), deleteSavedSearch);

module.exports = router;
