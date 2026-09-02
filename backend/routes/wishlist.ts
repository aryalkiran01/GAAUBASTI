export {};
    import express from 'express';
const router = express.Router();
import { authenticate } from '../middlewares/auth';
import { toggleWishlist, getWishlist, removeWishlistItem } from '../controllers/wishlistController';

router.use(authenticate);
router.post('/', toggleWishlist);
router.get('/', getWishlist);
router.delete('/:listingId', removeWishlistItem);

export default router;
