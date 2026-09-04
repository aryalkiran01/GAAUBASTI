import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { toggleWishlist, getWishlist, removeWishlistItem } from '../controllers/wishlistController.js';

const router = express.Router();

router.use(authenticate);
router.post('/', toggleWishlist);
router.get('/', getWishlist);
router.delete('/:listingId', removeWishlistItem);

export default router;