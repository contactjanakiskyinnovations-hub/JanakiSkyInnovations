// Vercel serverless entry point.
// Vercel calls this function for every request (see vercel.json rewrites).
// The Express app already handles routes mounted under /api/*, robots.txt,
// sitemap.xml and / — exporting it directly is all Vercel needs.
const app = require('../src/server');

module.exports = app;