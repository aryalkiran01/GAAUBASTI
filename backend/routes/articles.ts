export {};
    import express from 'express';
const router = express.Router();
import { authenticate, requireAdmin } from '../middlewares/auth';
import { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle } from '../controllers/articleController';

router.get('/', getArticles);
router.get('/:slug', getArticleBySlug);

router.use(authenticate);
router.post('/', requireAdmin, createArticle);
router.put('/:id', requireAdmin, updateArticle);
router.delete('/:id', requireAdmin, deleteArticle);

module.exports = router;
