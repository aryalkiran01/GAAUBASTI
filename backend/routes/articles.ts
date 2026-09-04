import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle } from '../controllers/articleController.js';

const router = express.Router();

router.get('/', getArticles);
router.get('/:slug', getArticleBySlug);

router.use(authenticate);
router.post('/', requireAdmin, createArticle);
router.put('/:id', requireAdmin, updateArticle);
router.delete('/:id', requireAdmin, deleteArticle);

export default router;