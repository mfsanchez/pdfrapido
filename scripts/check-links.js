#!/usr/bin/env node
/**
 * check-links.js — Verifica enlaces internos del sitio
 * Uso: node scripts/check-links.js [baseURL]
 * Ignora: query strings, hash fragments, archivos CSS/JS estáticos
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.argv[2] || 'https://pdfrapido.eu';

const EXCLUDE = new Set(['api','css','js','scripts','.git','.well-known','.assets','.claude','.agents','node_modules','tmp','admin']);

function getDirs(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch { return []; }
}

function readHtml(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

function cleanUrl(url) {
  // Remove query string and hash
  return url.split('?')[0].split('#')[0];
}

function pathExists(urlPath) {
  const clean = cleanUrl(urlPath).replace(/^\//, '').replace(/\/$/, '');
  if (!clean) return true; // root /

  // Static assets in css/ or js/ root
  if (clean.startsWith('css/') || clean.startsWith('js/')) {
    const assetPath = path.join(ROOT, clean);
    return fs.existsSync(assetPath);
  }

  const asDir = path.join(ROOT, clean, 'index.html');
  const asFile = path.join(ROOT, clean + '.html');
  const exact = path.join(ROOT, clean);
  return fs.existsSync(asDir) || fs.existsSync(asFile) || (fs.existsSync(exact) && fs.statSync(exact).isFile());
}

const allDirs = getDirs(ROOT).filter(d => !EXCLUDE.has(d) && !d.startsWith('.'));
const blogDirs = getDirs(path.join(ROOT, 'blog')).filter(d => d !== 'index.html');

const broken = [];
const checked = new Set();
let totalLinks = 0;

function checkFile(filePath, label) {
  const html = readHtml(filePath);
  const hrefs = html.match(/href="([^"]+)"/g) || [];

  for (const h of hrefs) {
    const url = h.replace('href="', '').replace('"', '');
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('mailto:') || url.startsWith('tel:')) continue;
    if (url.startsWith('/api/') || url.startsWith('/wopi/') || url.startsWith('/.well-known/')) continue;

    totalLinks++;
    const key = `${label} -> ${url}`;
    if (checked.has(key)) continue;
    checked.add(key);

    if (!pathExists(url)) {
      broken.push({ source: label, url });
    }
  }
}

// Check tool pages
for (const dir of allDirs) {
  checkFile(path.join(ROOT, dir, 'index.html'), `/${dir}/`);
}

// Check blog posts
for (const dir of blogDirs) {
  checkFile(path.join(ROOT, 'blog', dir, 'index.html'), `/blog/${dir}/`);
}

// Check root index
if (fs.existsSync(path.join(ROOT, 'index.html'))) {
  checkFile(path.join(ROOT, 'index.html'), '/');
}

console.log(`🔗 Link Checker Report for ${BASE_URL}`);
console.log('─'.repeat(50));
console.log(`Total links checked: ${totalLinks}`);
console.log(`Unique links:        ${checked.size}`);
console.log(`Broken links:        ${broken.length}`);
console.log('─'.repeat(50));

if (broken.length > 0) {
  console.log('\n❌ Broken links:');
  for (const b of broken) {
    console.log(`  ${b.source} -> ${b.url}`);
  }
  process.exit(1);
} else {
  console.log('\n✅ All internal links are valid!');
  process.exit(0);
}
