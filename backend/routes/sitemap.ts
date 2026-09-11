export {};
import express from 'express';
const router = express.Router();

const Listing = require('../models/Listing');
const Village = require('../models/Village');
const Article = require('../models/Article');

const BASE_URL = process.env.FRONTEND_URL?.split(',')[0] || 'https://gaunbasti.com';

router.get(['/sitemap.xml', '/api/sitemap.xml'], async (_req, res) => {
  try {
    const [listings, villages, articles] = await Promise.all([
      Listing.find({ isActive: true, status: 'approved' }).select('_id updatedAt').lean(),
      Village.find({ isPublished: true }).select('slug _id updatedAt').lean(),
      Article.find({ isPublished: true }).select('slug _id updatedAt').lean()
    ]);

    const staticRoutes = [
      { url: '', changefreq: 'daily', priority: '1.0' },
      { url: '/listings', changefreq: 'daily', priority: '0.9' },
      { url: '/villages', changefreq: 'weekly', priority: '0.8' },
      { url: '/articles', changefreq: 'weekly', priority: '0.8' },
      { url: '/about', changefreq: 'monthly', priority: '0.5' },
      { url: '/contact', changefreq: 'monthly', priority: '0.5' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    for (const page of staticRoutes) {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Listings
    for (const listing of listings) {
      const lastMod = listing.updatedAt ? new Date(listing.updatedAt).toISOString() : new Date().toISOString();
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/listing/${listing._id}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Villages
    for (const village of villages) {
      const slugOrId = village.slug || village._id;
      const lastMod = village.updatedAt ? new Date(village.updatedAt).toISOString() : new Date().toISOString();
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/villages/${slugOrId}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    // Articles
    for (const article of articles) {
      const slugOrId = article.slug || article._id;
      const lastMod = article.updatedAt ? new Date(article.updatedAt).toISOString() : new Date().toISOString();
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/articles/${slugOrId}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to generate sitemap', error: error.message });
  }
});

export default router;
