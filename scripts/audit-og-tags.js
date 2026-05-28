#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORT = [];

function backup(file) {
  const bak = file + '.bak-og-' + new Date().toISOString().split('T')[0];
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
}

function hasTag(html, tag) {
  const re = new RegExp('name="' + tag + '"|property="' + tag + '"', 'i');
  return re.test(html);
}

function addMetaBefore(html, metaTag) {
  // Insert before </head> or before the first existing twitter/og tag
  const insertPos = html.search(/<meta\s+(name|property)="(twitter|og):/i);
  if (insertPos > 0) {
    return html.slice(0, insertPos) + metaTag + '\n    ' + html.slice(insertPos);
  }
  return html.replace(/<\/head>/i, metaTag + '\n  </head>');
}

function processFile(file) {
  let html = fs.readFileSync(file, 'utf8');
  const changes = [];
  const relPath = path.relative(ROOT, file);

  if (!hasTag(html, 'twitter:card')) {
    html = addMetaBefore(html, '<meta name="twitter:card" content="summary_large_image">');
    changes.push('added-twitter-card');
  }
  if (!hasTag(html, 'twitter:creator')) {
    html = addMetaBefore(html, '<meta name="twitter:creator" content="@mfsanchez">');
    changes.push('added-twitter-creator');
  }
  if (!hasTag(html, 'twitter:site')) {
    html = addMetaBefore(html, '<meta name="twitter:site" content="@pdfrapido">');
    changes.push('added-twitter-site');
  }
  if (!hasTag(html, 'og:site_name')) {
    html = addMetaBefore(html, '<meta property="og:site_name" content="PDFRápido">');
    changes.push('added-og-site-name');
  }

  if (changes.length > 0) {
    backup(file);
    fs.writeFileSync(file, html, 'utf8');
    REPORT.push({ file: relPath, changes });
    console.log(`✅ ${relPath}: ${changes.join(', ')}`);
  }
}

// Process tool pages
const toolDirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(d => !d.startsWith('.') && !['api','css','js','scripts','blog','node_modules','tmp','admin'].includes(d));

for (const dir of toolDirs) {
  const file = path.join(ROOT, dir, 'index.html');
  if (fs.existsSync(file)) processFile(file);
}

// Process blog posts
const blogDirs = fs.readdirSync(path.join(ROOT, 'blog'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(d => d !== 'index.html');

for (const dir of blogDirs) {
  const file = path.join(ROOT, 'blog', dir, 'index.html');
  if (fs.existsSync(file)) processFile(file);
}

fs.writeFileSync(path.join(ROOT, 'scripts', 'audit-og-report.json'), JSON.stringify(REPORT, null, 2), 'utf8');
console.log(`\n📊 Done. ${REPORT.length} files modified.`);
