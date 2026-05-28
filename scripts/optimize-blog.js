#!/usr/bin/env node
/**
 * optimize-blog.js — Fase 3: Bulk blog optimization
 * Fixes Article schema, BreadcrumbList, author byline, meta tags, internal links.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const REPORT = [];

function backup(file) {
  const bak = file + '.bak-f3-' + new Date().toISOString().split('T')[0];
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
}

function hasSchema(html, type) {
  return html.includes('"@type": "' + type + '"') || html.includes('"@type":"' + type + '"');
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return m ? m[1].trim() : '';
}

function extractCanonical(html) {
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  return m ? m[1] : '';
}

function extractDesc(html) {
  const m = html.match(/<meta name="description" content="([^"]+)"/);
  return m ? m[1] : '';
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const dirs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(d => d !== 'index.html');

for (const slug of dirs) {
  const file = path.join(BLOG_DIR, slug, 'index.html');
  if (!fs.existsSync(file)) continue;

  let html = fs.readFileSync(file, 'utf8');
  const changes = [];
  const canonical = extractCanonical(html);
  const url = canonical || `https://pdfrapido.eu/blog/${slug}/`;

  // 1. Fix author URL in existing Article schema
  if (html.includes('"url": "https://mfsanchez.com"') || html.includes('"url":"https://mfsanchez.com"')) {
    html = html.replace(/"url":\s*"https:\/\/mfsanchez\.com"/g, '"url": "https://pdfrapido.eu/sobre-mf-sanchez/"');
    changes.push('fixed-author-url-in-schema');
  }

  // 2. Add BreadcrumbList if missing
  if (!hasSchema(html, 'BreadcrumbList')) {
    const breadcrumbScript = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"PDFRápido","item":"https://pdfrapido.eu/"},
    {"@type":"ListItem","position":2,"name":"Blog","item":"https://pdfrapido.eu/blog/"},
    {"@type":"ListItem","position":3,"name":"${extractH1(html).replace(/"/g, '\\"')}","item":"${url}"}
  ]
}
</script>`;
    // Insert before </head>
    html = html.replace(/<\/head>/i, breadcrumbScript + '\n</head>');
    changes.push('added-breadcrumb-schema');
  }

  // 3. Add/ensure author byline after h1 or in article header
  const h1Match = html.match(/(<h1[^>]*>[^<]+<\/h1>)/i);
  if (h1Match && !html.includes('rel="author"') && !html.includes("Por MF Sanchez")) {
    const byline = `<p class="meta">Por <a href="/sobre-mf-sanchez/" rel="author">MF Sanchez</a> · ${new Date().toISOString().split('T')[0]}</p>`;
    html = html.replace(h1Match[1], h1Match[1] + '\n' + byline);
    changes.push('added-author-byline');
  }

  // 4. Add link to guia-completa-pdf if missing
  if (!html.includes('/guia-completa-pdf/')) {
    // Insert before closing </div> of article or before first </p> after some content
    const insertPoint = html.lastIndexOf('</div>\n</main>');
    if (insertPoint > 0) {
      const cta = `\n  <div style="background:var(--gray-50);border-radius:var(--radius-lg);padding:24px;margin:32px 0;text-align:center">\n    <p style="margin:0 0 12px;font-size:15px;color:var(--gray-600)">¿Quieres dominar todas las herramientas PDF?</p>\n    <a href="/guia-completa-pdf/" style="display:inline-block;padding:10px 24px;background:var(--primary);color:#fff;border-radius:var(--radius);font-weight:600;text-decoration:none">Ver Guía Completa PDF →</a>\n  </div>`;
      html = html.slice(0, insertPoint) + cta + html.slice(insertPoint);
      changes.push('added-guia-link');
    }
  }

  // 5. Ensure title format ends with | Blog PDFRápido or | PDFRápido
  const title = extractTitle(html);
  if (title && !title.includes('| Blog PDFRápido') && !title.includes('| PDFRápido')) {
    const newTitle = title + ' | Blog PDFRápido';
    html = html.replace(/<title>[^<]+<\/title>/i, `<title>${newTitle}</title>`);
    changes.push('fixed-title-format');
  }

  // 6. Fix author URL in any other places (meta author tag)
  if (html.includes('content="MF Sanchez"') && html.includes('https://mfsanchez.com')) {
    html = html.replace(/https:\/\/mfsanchez\.com/g, 'https://pdfrapido.eu/sobre-mf-sanchez/');
    changes.push('fixed-all-mfsanchez-links');
  }

  if (changes.length > 0) {
    backup(file);
    fs.writeFileSync(file, html, 'utf8');
    REPORT.push({ slug, changes, file });
    console.log(`✅ ${slug}: ${changes.join(', ')}`);
  } else {
    console.log(`⏭️  ${slug}: no changes needed`);
  }
}

fs.writeFileSync(path.join(ROOT, 'scripts', 'optimize-blog-report.json'), JSON.stringify(REPORT, null, 2), 'utf8');
console.log(`\n📊 Done. ${REPORT.length}/${dirs.length} articles modified.`);
console.log(`📄 Report saved to scripts/optimize-blog-report.json`);
