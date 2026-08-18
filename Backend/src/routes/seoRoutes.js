// SEO endpoints: robots.txt and a LIVE sitemap.xml generated straight from the
// database. Because products, categories and service categories are queried on
// every request, newly-added storefront content is automatically included for
// search engines without any rebuild or manual maintenance.
const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Category = require('../models/Category');
const HomeSettings = require('../models/HomeSettings');

// Public site base URL used to build absolute URLs. Set SITE_URL in .env for
// production (e.g. https://www.yourstore.com). Defaults to the dev server.
const getSiteUrl = () => (process.env.SITE_URL || 'http://localhost:5173').replace(/\/+$/, '');

// ---- Lightweight caching -------------------------------------------------
// The sitemap is regenerated from MongoDB on first request and cached in
// memory for SITEMAP_TTL_MS. Search-engine crawlers fetch sitemaps very
// frequently; this keeps DB load near-zero while new admin content still
// appears within one TTL window (no restart or rebuild needed).
const SITEMAP_TTL_MS = 5 * 60 * 1000; // 5 minutes
let sitemapCache = { xml: null, generatedAt: 0 };

const getCachedSitemap = async () => {
    const now = Date.now();
    if (sitemapCache.xml && now - sitemapCache.generatedAt < SITEMAP_TTL_MS) {
        return sitemapCache.xml;
    }
    sitemapCache = { xml: await buildSitemap(), generatedAt: now };
    return sitemapCache.xml;
};

const escapeXml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const urlEntry = (loc, lastmod, changefreq, priority) => {
    const lastmodXml = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return (
        '  <url>\n' +
        `    <loc>${escapeXml(loc)}</loc>${lastmodXml}\n` +
        `    <changefreq>${changefreq}</changefreq>\n` +
        `    <priority>${priority}</priority>\n` +
        '  </url>'
    );
};

// GET /robots.txt  (static content — safe to tell clients to cache for a day)
router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.set('Cache-Control', 'public, max-age=86400'); // 1 day
    res.send(
        'User-agent: *\n' +
        'Allow: /\n' +
        'Disallow: /admin\n' +
        'Disallow: /account\n' +
        'Disallow: /cart\n' +
        'Disallow: /wishlist\n' +
        'Disallow: /search\n' +
        `Sitemap: ${getSiteUrl()}/sitemap.xml\n`
    );
});

// Build the sitemap XML straight from MongoDB (called by getCachedSitemap).
const buildSitemap = async () => {
    const base = getSiteUrl();
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
        { path: '/', freq: 'daily', priority: '1.0' },
        { path: '/new-arrivals', freq: 'daily', priority: '0.8' },
        { path: '/best-sellers', freq: 'daily', priority: '0.8' },
        { path: '/top-rated', freq: 'daily', priority: '0.7' },
        { path: '/all-categories', freq: 'weekly', priority: '0.7' },
        { path: '/services', freq: 'weekly', priority: '0.8' },
        { path: '/offers', freq: 'weekly', priority: '0.6' },
    ];

    const [products, categories, cms] = await Promise.all([
        Product.find({}).select('updatedAt').lean(),
        Category.find({ isActive: { $ne: false } }).select('updatedAt name slug').lean(),
        HomeSettings.findOne().select('serviceCategories updatedAt').lean(),
    ]);

    const entries = [];
    const toIso = (d) => (d ? new Date(d).toISOString() : null);

    staticPages.forEach((p) => entries.push(urlEntry(base + p.path, today, p.freq, p.priority)));

    products.forEach((p) =>
        entries.push(urlEntry(`${base}/product/${p._id}`, toIso(p.updatedAt), 'weekly', '0.8'))
    );

    categories.forEach((c) => {
        const slug = c.slug || String(c.name || '').toLowerCase().replace(/\s+/g, '-');
        if (slug) {
            entries.push(urlEntry(`${base}/category/${encodeURIComponent(slug)}`, toIso(c.updatedAt), 'weekly', '0.7'));
        }
    });

    (cms?.serviceCategories || []).forEach((c) => {
        if (c && c.slug) {
            entries.push(
                urlEntry(`${base}/services?category=${encodeURIComponent(c.slug)}`, toIso(cms.updatedAt), 'weekly', '0.7')
            );
        }
    });

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        entries.join('\n') +
        '\n</urlset>'
    );
};

// GET /sitemap.xml  (served from a 5-minute in-memory cache)
router.get('/sitemap.xml', async (req, res) => {
    try {
        const xml = await getCachedSitemap();
        res.type('application/xml');
        res.set('Cache-Control', `public, max-age=${Math.floor(SITEMAP_TTL_MS / 1000)}, s-maxage=3600`);
        res.send(xml);
    } catch (err) {
        console.error('Failed to generate sitemap:', err.message);
        res.status(500).send('Failed to generate sitemap');
    }
});

module.exports = router;
