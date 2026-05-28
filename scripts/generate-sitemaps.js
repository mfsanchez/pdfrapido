#!/usr/bin/env node
/**
 * generate-sitemaps.js — Phase 2 SEO Architecture
 * Generates sitemap-index.xml, sitemap-pages.xml, sitemap-tools.xml, sitemap-blog.xml
 *
 * Usage: node scripts/generate-sitemaps.js
 */

const fs = require('fs');
const path = require('path');

const BASE = 'https://pdfrapido.eu';
const ROOT = path.resolve(__dirname, '..');
const TODAY = new Date().toISOString().split('T')[0];

/* ─── CONFIG ─── */
const EXCLUDE_DIRS = new Set([
  'api', 'css', 'js', 'scripts', '.git', '.well-known', '.assets', '.claude', '.agents',
  'node_modules', 'tmp', 'admin', 'sobre-nosotros', 'guia-completa-pdf', 'categoria', 'sobre-pdfrapido', 'sobre-mf-sanchez', 'product-hunt', 'prensa', 'alternativas', 'estadisticas-pdf',
  // Structural pages belong in sitemap-pages.xml, not tools
  'contacto', 'cookies', 'privacidad', 'terminos', 'marca'
]);

const PAGES = [
  { loc: '/',           priority: '1.0',  changefreq: 'weekly' },
  { loc: '/sobre-pdfrapido/', priority: '0.7', changefreq: 'monthly' },
  { loc: '/sobre-mf-sanchez/', priority: '0.6', changefreq: 'monthly' },
  { loc: '/marca/',     priority: '0.6',  changefreq: 'monthly' },
  { loc: '/contacto/',  priority: '0.5',  changefreq: 'yearly' },
  { loc: '/privacidad/',priority: '0.3',  changefreq: 'yearly' },
  { loc: '/terminos/',  priority: '0.3',  changefreq: 'yearly' },
  { loc: '/cookies/',   priority: '0.3',  changefreq: 'yearly' },
  { loc: '/product-hunt/', priority: '0.5', changefreq: 'monthly' },
  { loc: '/prensa/', priority: '0.5', changefreq: 'monthly' },
  { loc: '/alternativas/', priority: '0.6', changefreq: 'monthly' },
  { loc: '/estadisticas-pdf/', priority: '0.6', changefreq: 'monthly' },
  { loc: '/blog/',      priority: '0.8',  changefreq: 'weekly' },
  { loc: '/guia-completa-pdf/', priority: '0.9', changefreq: 'monthly' },
  { loc: '/categoria/organizar-pdf/', priority: '0.7', changefreq: 'monthly' },
  { loc: '/categoria/optimizar-pdf/', priority: '0.7', changefreq: 'monthly' },
  { loc: '/categoria/convertir-pdf/', priority: '0.7', changefreq: 'monthly' },
  { loc: '/categoria/editar-pdf/', priority: '0.7', changefreq: 'monthly' },
  { loc: '/categoria/seguridad-pdf/', priority: '0.7', changefreq: 'monthly' },
];

/* ─── HELPERS ─── */
function xmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildUrlset(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const u of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${xmlEscape(BASE + u.loc)}</loc>\n`;
    xml += `    <lastmod>${u.lastmod || TODAY}</lastmod>\n`;
    if (u.changefreq) xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
    if (u.priority)   xml += `    <priority>${u.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  xml += '</urlset>\n';
  return xml;
}

function buildSitemapIndex(sitemaps) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const s of sitemaps) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${xmlEscape(BASE + s.loc)}</loc>\n`;
    xml += `    <lastmod>${s.lastmod || TODAY}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  xml += '</sitemapindex>\n';
  return xml;
}

function getDirs(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function getSubdirs(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch {
    return [];
  }
}

/* ─── TOOLS ─── */
const allDirs = getDirs(ROOT);
const toolDirs = allDirs
  .filter(d => !EXCLUDE_DIRS.has(d) && !d.startsWith('.') && d !== 'blog')
  .sort();

const toolUrls = toolDirs.map(d => ({
  loc: `/${d}/`,
  priority: '0.9',
  changefreq: 'monthly',
  lastmod: TODAY,
}));

/* ─── BLOG ─── */
const blogPosts = getSubdirs(path.join(ROOT, 'blog'))
  .filter(d => d !== 'index.html')
  .sort();

const blogUrls = blogPosts.map(d => ({
  loc: `/blog/${d}/`,
  priority: '0.7',
  changefreq: 'monthly',
  lastmod: TODAY,
}));

/* ─── WRITE ─── */
const sitemapTools   = buildUrlset(toolUrls);
const sitemapBlog    = buildUrlset(blogUrls);
const sitemapPages   = buildUrlset(PAGES);
const sitemapIndex   = buildSitemapIndex([
  { loc: '/sitemap-pages.xml', lastmod: TODAY },
  { loc: '/sitemap-tools.xml', lastmod: TODAY },
  { loc: '/sitemap-blog.xml',  lastmod: TODAY },
]);

fs.writeFileSync(path.join(ROOT, 'sitemap-tools.xml'), sitemapTools, 'utf8');
fs.writeFileSync(path.join(ROOT, 'sitemap-blog.xml'),  sitemapBlog,  'utf8');
fs.writeFileSync(path.join(ROOT, 'sitemap-pages.xml'), sitemapPages, 'utf8');
fs.writeFileSync(path.join(ROOT, 'sitemap-index.xml'), sitemapIndex, 'utf8');

console.log(`✅ sitemap-index.xml  → 3 child sitemaps`);
console.log(`✅ sitemap-pages.xml  → ${PAGES.length} pages`);
console.log(`✅ sitemap-tools.xml  → ${toolUrls.length} tools`);
console.log(`✅ sitemap-blog.xml   → ${blogUrls.length} posts`);
