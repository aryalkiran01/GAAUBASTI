export {};
const express = require('express');
const router = express.Router();
const {
  getVillages,
  getFeaturedVillages,
  getVillageBySlug,
  createVillage,
  updateVillage,
  deleteVillage
} = require('../controllers/villageController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/roleAuth');
const { validateObjectId } = require('../middlewares/validation');

// Public routes
router.get('/', getVillages);
router.get('/featured', getFeaturedVillages);
router.get('/:slug', getVillageBySlug);

// Admin-only management routes
router.post('/', authenticate, requireAdmin, createVillage);
router.put('/:id', authenticate, requireAdmin, validateObjectId('id'), updateVillage);
router.delete('/:id', authenticate, requireAdmin, validateObjectId('id'), deleteVillage);

module.exports = router;
module.exports.default = router;
export default router;
