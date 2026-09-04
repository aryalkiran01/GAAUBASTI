import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth.js';
import { toggleWishlist, getWishlist, removeWishlistItem } from '../controllers/wishlistController.js';

router.use(authenticate);
router.post('/', toggleWishlist);
router.get('/', getWishlist);
router.delete('/:listingId', removeWishlistItem);

export default router;
