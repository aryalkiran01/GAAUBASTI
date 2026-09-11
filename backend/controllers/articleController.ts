export {};
const Article = require('../models/Article');

const escapeRegex = (str: any) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, (m) => "\\" + m);
};

const getArticles = async (req, res) => {
  try {
    const { category, search, published, isFeatured, villageSlug, limit = 50 } = req.query;
    const filter: Record<string, any> = {};

    if (category && category !== 'all') filter.category = category;
    if (published !== undefined) filter.published = String(published) === 'true';
    if (isFeatured !== undefined) filter.isFeatured = String(isFeatured) === 'true';
    if (villageSlug) filter.villageSlug = String(villageSlug).toLowerCase();

    if (search) {
      const escaped = escapeRegex(String(search));
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { content: { $regex: escaped, $options: 'i' } },
        { summary: { $regex: escaped, $options: 'i' } },
        { tags: { $in: [new RegExp(escaped, 'i')] } }
      ];
    }

    const articles = await Article.find(filter)
      .sort({ isFeatured: -1, createdAt: -1, lastUpdated: -1 })
      .limit(Number(limit) || 50);

    res.json({ success: true, data: { articles } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch articles', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getArticleBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, published: true });
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Fetch related articles (same category or shared tags)
    const relatedArticles = await Article.find({
      _id: { $ne: article._id },
      published: true,
      $or: [
        { category: article.category },
        { villageSlug: article.villageSlug || '__none__' }
      ]
    }).limit(3).lean();

    res.json({ success: true, data: { article, relatedArticles } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch article', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const createArticle = async (req, res) => {
  try {
    const { title, category, slug, content, published = true } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const articleSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const article = await Article.create({
      title,
      category: category || 'general',
      slug: articleSlug,
      content,
      published
    });

    res.status(201).json({ success: true, data: { article } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create article', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const { title, category, slug, content, published } = req.body;
    if (title) article.title = title;
    if (category) article.category = category;
    if (slug) article.slug = slug;
    if (content) article.content = content;
    if (typeof published === 'boolean') article.published = published;
    article.lastUpdated = new Date();

    await article.save();
    res.json({ success: true, data: { article } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update article', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete article', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  getArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle
};
