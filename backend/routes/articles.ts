export {};
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle } = require('../controllers/articleController');

router.get('/', getArticles);
router.get('/:slug', getArticleBySlug);

router.use(authenticate);
router.post('/', requireAdmin, createArticle);
router.put('/:id', requireAdmin, updateArticle);
router.delete('/:id', requireAdmin, deleteArticle);

module.exports = router;
