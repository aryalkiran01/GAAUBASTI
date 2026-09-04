export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  toggleWishlist,
  getWishlist,
  removeWishlistItem,
  checkWishlistStatus
} = require('../controllers/wishlistController');

router.use(authenticate);
router.post('/', toggleWishlist);
router.post('/check', checkWishlistStatus);
router.get('/', getWishlist);
router.delete('/:listingId', removeWishlistItem);

module.exports = router;
