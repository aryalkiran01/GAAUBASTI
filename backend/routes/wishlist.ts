export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');
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
router.delete('/:listingId', validateObjectId('listingId'), removeWishlistItem);

module.exports = router;
