#!/usr/bin/env node
/**
 * seo-monitor.js — Genera reporte JSON y dashboard HTML de estado SEO del sitio
 * Uso: node scripts/seo-monitor.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TODAY = new Date().toISOString().split('T')[0];
const REPORT_PATH = `/tmp/seo-report-${TODAY}.json`;
const STATUS_PATH = path.join(ROOT, 'status', 'index.html');

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

function countMatches(html, regex) {
  const matches = html.match(regex);
  return matches ? matches.length : 0;
}

const EXCLUDE = new Set([
  'api','css','js','scripts','.git','.well-known','.assets','.claude','.agents',
  'node_modules','tmp','admin','blog','status'
]);

// ─── TOOLS ───
const allDirs = getDirs(ROOT);
const toolDirs = allDirs
  .filter(d => !EXCLUDE.has(d) && !d.startsWith('.'))
  .sort();

let toolSchemaCount = 0;
let toolTitleCount = 0;
let toolDescCount = 0;
let toolOgImageCount = 0;
let toolBreadcrumbCount = 0;
let toolErrors = [];

for (const dir of toolDirs) {
  const file = path.join(ROOT, dir, 'index.html');
  const html = readHtml(file);
  if (!html) continue;

  if (html.includes('schema.org')) toolSchemaCount++;
  if (html.includes('<title>')) toolTitleCount++;
  if (html.includes('name="description"')) toolDescCount++;
  if (html.includes('og:image')) toolOgImageCount++;
  if (html.includes('BreadcrumbList')) toolBreadcrumbCount++;

  if (!html.includes('schema.org')) toolErrors.push(`${dir}/index.html missing schema`);
}

// ─── BLOG ───
const blogDirs = getDirs(path.join(ROOT, 'blog'))
  .filter(d => d !== 'index.html');

let blogSchemaCount = 0;
let blogTitleCount = 0;
let blogDescCount = 0;
let blogOgImageCount = 0;
let blogBreadcrumbCount = 0;
let blogErrors = [];

for (const dir of blogDirs) {
  const file = path.join(ROOT, 'blog', dir, 'index.html');
  const html = readHtml(file);
  if (!html) continue;

  if (html.includes('schema.org')) blogSchemaCount++;
  if (html.includes('<title>')) blogTitleCount++;
  if (html.includes('name="description"')) blogDescCount++;
  if (html.includes('og:image')) blogOgImageCount++;
  if (html.includes('BreadcrumbList')) blogBreadcrumbCount++;
}

// ─── PAGES ───
const pageDirs = ['sobre-pdfrapido','sobre-mf-sanchez','privacidad','terminos','cookies',
  'contacto','guia-completa-pdf','product-hunt','prensa','alternativas','estadisticas-pdf',
  'marca','categoria'];

let pageSchemaCount = 0;
let pageBreadcrumbCount = 0;

for (const dir of pageDirs) {
  const file = path.join(ROOT, dir, 'index.html');
  if (!fs.existsSync(file)) {
    const subdirs = getDirs(path.join(ROOT, dir));
    for (const sub of subdirs) {
      const subfile = path.join(ROOT, dir, sub, 'index.html');
      const html = readHtml(subfile);
      if (html.includes('schema.org')) pageSchemaCount++;
      if (html.includes('BreadcrumbList')) pageBreadcrumbCount++;
    }
    continue;
  }
  const html = readHtml(file);
  if (html.includes('schema.org')) pageSchemaCount++;
  if (html.includes('BreadcrumbList')) pageBreadcrumbCount++;
}

// ─── SITEMAP ───
const sitemapFile = path.join(ROOT, 'sitemap-index.xml');
let sitemapUrls = 0;
let sitemapValid = false;
if (fs.existsSync(sitemapFile)) {
  const xml = readHtml(sitemapFile);
  sitemapUrls = countMatches(xml, /<loc>/g);
  sitemapValid = xml.includes('sitemapindex') || xml.includes('urlset');
}

// ─── INTERNAL LINKS CHECK (basic) ───
let internalLinks = 0;
let brokenLinks = [];

function cleanUrl(url) {
  return url.split('?')[0].split('#')[0];
}

function pathExists(urlPath) {
  const clean = cleanUrl(urlPath).replace(/^\//, '').replace(/\/$/, '');
  if (!clean) return true;
  if (clean.startsWith('css/') || clean.startsWith('js/')) {
    return fs.existsSync(path.join(ROOT, clean));
  }
  const asDir = path.join(ROOT, clean, 'index.html');
  const asFile = path.join(ROOT, clean + '.html');
  const exact = path.join(ROOT, clean);
  return fs.existsSync(asDir) || fs.existsSync(asFile) || (fs.existsSync(exact) && fs.statSync(exact).isFile());
}

function scanLinks(dir, subdir) {
  const base = subdir ? path.join(ROOT, dir, subdir) : path.join(ROOT, dir);
  const file = path.join(base, 'index.html');
  const html = readHtml(file);
  if (!html) return;

  const hrefs = html.match(/href="([^"]+)"/g) || [];
  for (const h of hrefs) {
    const url = h.replace('href="', '').replace('"', '');
    if (url.startsWith('//') || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) continue;
    if (url.startsWith('/api/') || url.startsWith('/wopi/') || url.startsWith('/.well-known/')) continue;
    internalLinks++;
    if (!pathExists(url)) {
      brokenLinks.push(`${dir}${subdir ? '/' + subdir : ''} -> ${url}`);
    }
  }
}

for (const dir of toolDirs) scanLinks(dir);
for (const dir of blogDirs) scanLinks('blog', dir);
for (const dir of pageDirs) scanLinks(dir);

// ─── REPORT ───
const report = {
  fecha: TODAY,
  urls_indexadas: {
    total: toolDirs.length + blogDirs.length + pageDirs.length,
    herramientas: toolDirs.length,
    blog: blogDirs.length,
    paginas: pageDirs.length,
  },
  schema_validacion: {
    herramientas: { con_schema: toolSchemaCount, total: toolDirs.length },
    blog: { con_schema: blogSchemaCount, total: blogDirs.length },
    paginas: { con_schema: pageSchemaCount, total: pageDirs.length },
    breadcrumbs: {
      herramientas: toolBreadcrumbCount,
      blog: blogBreadcrumbCount,
      paginas: pageBreadcrumbCount,
    },
    errores: toolErrors.length + blogErrors.length,
    detalles_errores: [...toolErrors, ...blogErrors].slice(0, 20),
  },
  meta_tags: {
    herramientas: {
      con_title: toolTitleCount,
      con_description: toolDescCount,
      con_og_image: toolOgImageCount,
    },
    blog: {
      con_title: blogTitleCount,
      con_description: blogDescCount,
      con_og_image: blogOgImageCount,
    },
  },
  enlaces_internos: {
    total: internalLinks,
    rotos: brokenLinks.length,
    detalles_rotos: brokenLinks.slice(0, 20),
  },
  sitemap: {
    urls: sitemapUrls,
    valido: sitemapValid,
  },
  core_web_vitals: {
    lcp: '[PENDIENTE - usar PageSpeed Insights API]',
    cls: '[PENDIENTE - usar PageSpeed Insights API]',
    inp: '[PENDIENTE - usar PageSpeed Insights API]',
    nota: 'Ejecutar: curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://pdfrapido.eu/&key=[API_KEY]"',
  },
  notas: [
    'Para Core Web Vitals reales, usa Google PageSpeed Insights API o Lighthouse CI',
    'Para indexación real, verifica en Google Search Console > Cobertura',
    'IndexNow requiere API key generada manualmente',
  ],
};

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

// ─── HTML DASHBOARD ───
const pct = (num, den) => den ? Math.round((num / den) * 100) : 0;

const statusColor = (ok, total) => ok === total ? 'var(--accent-green)' : (ok / total > 0.8 ? 'var(--accent-orange)' : 'var(--primary)');

const htmlDashboard = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Estado SEO — PDFRápido</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<style>
:root {
  --primary: #E8453C;
  --primary-light: #FFF0EF;
  --secondary: #1B2A4A;
  --accent-green: #34A853;
  --accent-green-light: #E8F5E9;
  --accent-orange: #F5913E;
  --accent-orange-light: #FFF3E0;
  --accent-blue: #4285F4;
  --accent-blue-light: #EBF2FE;
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-500: #6B7280;
  --gray-700: #374151;
  --gray-900: #111827;
  --radius: 12px;
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 25px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--gray-50);
  color: var(--gray-900);
  line-height: 1.5;
  padding: 2rem 1rem;
}
.container { max-width: 1100px; margin: 0 auto; }
header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
}
header h1 { font-size: 1.5rem; color: var(--secondary); }
header .badge {
  background: var(--secondary); color: #fff;
  padding: 0.35rem 0.75rem; border-radius: 999px;
  font-size: 0.8rem; font-weight: 500;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.card {
  background: #fff;
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.2s;
}
.card:hover { box-shadow: var(--shadow-lg); }
.card-header {
  display: flex; align-items: center; gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.03em;
  color: var(--gray-500);
}
.card-header .dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--gray-300);
}
.card-value {
  font-size: 2.25rem; font-weight: 700;
  color: var(--secondary);
  line-height: 1;
  margin-bottom: 0.5rem;
}
.card-sub {
  font-size: 0.875rem; color: var(--gray-500);
}
.bar {
  height: 6px; background: var(--gray-100);
  border-radius: 3px; overflow: hidden; margin-top: 0.75rem;
}
.bar-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.6s ease;
}
.section { margin-bottom: 2rem; }
.section h2 {
  font-size: 1.1rem; color: var(--secondary);
  margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;
}
.table-wrap {
  background: #fff; border-radius: var(--radius);
  box-shadow: var(--shadow-md); overflow: hidden;
}
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { padding: 0.85rem 1rem; text-align: left; }
th { background: var(--gray-50); font-weight: 600; color: var(--gray-700); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; }
tbody tr:not(:last-child) td { border-bottom: 1px solid var(--gray-100); }
tbody tr:hover td { background: var(--gray-50); }
.ok { color: var(--accent-green); font-weight: 600; }
.warn { color: var(--accent-orange); font-weight: 600; }
.bad { color: var(--primary); font-weight: 600; }
.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem; background: var(--gray-100);
  padding: 0.15rem 0.4rem; border-radius: 4px;
}
footer {
  text-align: center; color: var(--gray-500); font-size: 0.8rem;
  margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--gray-200);
}
.links { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem; }
.links a { color: var(--accent-blue); text-decoration: none; }
.links a:hover { text-decoration: underline; }
@media (max-width: 600px) {
  .card-value { font-size: 1.75rem; }
  body { padding: 1rem 0.75rem; }
}
</style>
</head>
<body>
<div class="container">
<header>
  <h1>📊 Estado SEO — PDFRápido</h1>
  <span class="badge">Generado: ${TODAY}</span>
</header>

<div class="grid">
  <div class="card">
    <div class="card-header">URLs Totales <span class="dot" style="background:var(--accent-green)"></span></div>
    <div class="card-value">${report.urls_indexadas.total}</div>
    <div class="card-sub">${report.urls_indexadas.herramientas} herramientas · ${report.urls_indexadas.blog} blog · ${report.urls_indexadas.paginas} páginas</div>
  </div>
  <div class="card">
    <div class="card-header">Schema.org <span class="dot" style="background:${statusColor(toolSchemaCount + blogSchemaCount + pageSchemaCount, toolDirs.length + blogDirs.length + pageDirs.length)}"></span></div>
    <div class="card-value">${pct(toolSchemaCount + blogSchemaCount + pageSchemaCount, toolDirs.length + blogDirs.length + pageDirs.length)}%</div>
    <div class="card-sub">${toolSchemaCount + blogSchemaCount + pageSchemaCount} de ${toolDirs.length + blogDirs.length + pageDirs.length} páginas con schema</div>
    <div class="bar"><div class="bar-fill" style="width:${pct(toolSchemaCount + blogSchemaCount + pageSchemaCount, toolDirs.length + blogDirs.length + pageDirs.length)}%;background:${statusColor(toolSchemaCount + blogSchemaCount + pageSchemaCount, toolDirs.length + blogDirs.length + pageDirs.length)}"></div></div>
  </div>
  <div class="card">
    <div class="card-header">Breadcrumbs <span class="dot" style="background:${statusColor(toolBreadcrumbCount + blogBreadcrumbCount + pageBreadcrumbCount, toolDirs.length + blogDirs.length + pageDirs.length)}"></span></div>
    <div class="card-value">${pct(toolBreadcrumbCount + blogBreadcrumbCount + pageBreadcrumbCount, toolDirs.length + blogDirs.length + pageDirs.length)}%</div>
    <div class="card-sub">${toolBreadcrumbCount + blogBreadcrumbCount + pageBreadcrumbCount} de ${toolDirs.length + blogDirs.length + pageDirs.length} páginas con breadcrumb</div>
    <div class="bar"><div class="bar-fill" style="width:${pct(toolBreadcrumbCount + blogBreadcrumbCount + pageBreadcrumbCount, toolDirs.length + blogDirs.length + pageDirs.length)}%;background:${statusColor(toolBreadcrumbCount + blogBreadcrumbCount + pageBreadcrumbCount, toolDirs.length + blogDirs.length + pageDirs.length)}"></div></div>
  </div>
  <div class="card">
    <div class="card-header">Enlaces Rotos <span class="dot" style="background:${brokenLinks.length === 0 ? 'var(--accent-green)' : 'var(--primary)'}"></span></div>
    <div class="card-value" style="color:${brokenLinks.length === 0 ? 'var(--accent-green)' : 'var(--primary)'}">${brokenLinks.length}</div>
    <div class="card-sub">de ${internalLinks} enlaces internos escaneados</div>
  </div>
  <div class="card">
    <div class="card-header">Sitemap <span class="dot" style="background:${sitemapValid ? 'var(--accent-green)' : 'var(--primary)'}"></span></div>
    <div class="card-value" style="color:${sitemapValid ? 'var(--accent-green)' : 'var(--primary)'}">${sitemapValid ? '✓' : '✗'}</div>
    <div class="card-sub">${sitemapUrls} URLs en sitemap-index.xml</div>
  </div>
  <div class="card">
    <div class="card-header">Meta Tags <span class="dot" style="background:${statusColor(toolTitleCount + blogTitleCount, toolDirs.length + blogDirs.length)}"></span></div>
    <div class="card-value">${pct(toolTitleCount + blogTitleCount, toolDirs.length + blogDirs.length)}%</div>
    <div class="card-sub">Title + Description + OG Image</div>
    <div class="bar"><div class="bar-fill" style="width:${pct(toolTitleCount + blogTitleCount, toolDirs.length + blogDirs.length)}%;background:${statusColor(toolTitleCount + blogTitleCount, toolDirs.length + blogDirs.length)}"></div></div>
  </div>
</div>

<div class="section">
  <h2>📋 Desglose por Sección</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Sección</th><th>URLs</th><th>Schema</th><th>Breadcrumbs</th><th>Title</th><th>Description</th><th>OG Image</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Herramientas</strong></td>
          <td>${toolDirs.length}</td>
          <td class="${toolSchemaCount === toolDirs.length ? 'ok' : 'warn'}">${toolSchemaCount}/${toolDirs.length}</td>
          <td class="${toolBreadcrumbCount === toolDirs.length ? 'ok' : 'warn'}">${toolBreadcrumbCount}/${toolDirs.length}</td>
          <td class="${toolTitleCount === toolDirs.length ? 'ok' : 'warn'}">${toolTitleCount}/${toolDirs.length}</td>
          <td class="${toolDescCount === toolDirs.length ? 'ok' : 'warn'}">${toolDescCount}/${toolDirs.length}</td>
          <td class="${toolOgImageCount === toolDirs.length ? 'ok' : 'warn'}">${toolOgImageCount}/${toolDirs.length}</td>
        </tr>
        <tr>
          <td><strong>Blog</strong></td>
          <td>${blogDirs.length}</td>
          <td class="${blogSchemaCount === blogDirs.length ? 'ok' : 'warn'}">${blogSchemaCount}/${blogDirs.length}</td>
          <td class="${blogBreadcrumbCount === blogDirs.length ? 'ok' : 'warn'}">${blogBreadcrumbCount}/${blogDirs.length}</td>
          <td class="${blogTitleCount === blogDirs.length ? 'ok' : 'warn'}">${blogTitleCount}/${blogDirs.length}</td>
          <td class="${blogDescCount === blogDirs.length ? 'ok' : 'warn'}">${blogDescCount}/${blogDirs.length}</td>
          <td class="${blogOgImageCount === blogDirs.length ? 'ok' : 'warn'}">${blogOgImageCount}/${blogDirs.length}</td>
        </tr>
        <tr>
          <td><strong>Páginas</strong></td>
          <td>${pageDirs.length}</td>
          <td class="${pageSchemaCount >= pageDirs.length ? 'ok' : 'warn'}">${pageSchemaCount}/${pageDirs.length}</td>
          <td class="${pageBreadcrumbCount >= pageDirs.length ? 'ok' : 'warn'}">${pageBreadcrumbCount}/${pageDirs.length}</td>
          <td>—</td><td>—</td><td>—</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

${brokenLinks.length > 0 ? `
<div class="section">
  <h2>❌ Enlaces Rotos Detectados (${brokenLinks.length})</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Origen</th><th>URL Rota</th></tr></thead>
      <tbody>
        ${brokenLinks.slice(0, 20).map(b => {
          const parts = b.split(' -> ');
          const source = parts[0];
          const url = parts.slice(1).join(' -> ');
          return '<tr><td class="code">/' + source + '/</td><td class="code">' + url + '</td></tr>';
        }).join('\n')}
      </tbody>
    </table>
  </div>
</div>
` : ''}

${(toolErrors.length + blogErrors.length) > 0 ? `
<div class="section">
  <h2>⚠️ Errores de Schema (${toolErrors.length + blogErrors.length})</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Archivo</th><th>Error</th></tr></thead>
      <tbody>
        ${[...toolErrors, ...blogErrors].slice(0, 20).map(e => '<tr><td colspan="2" class="bad">' + e + '</td></tr>').join('\n')}
      </tbody>
    </table>
  </div>
</div>
` : ''}

<div class="section">
  <h2>🚀 Acciones de Indexación</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Acción</th><th>Estado</th><th>Nota</th></tr></thead>
      <tbody>
        <tr><td>Sitemap enviado a Google</td><td class="warn">Pendiente manual</td><td>Usar <a href="https://search.google.com/search-console" target="_blank">Search Console</a></td></tr>
        <tr><td>Sitemap enviado a Bing</td><td class="warn">Pendiente manual</td><td>Usar <a href="https://www.bing.com/webmasters" target="_blank">Bing Webmaster</a></td></tr>
        <tr><td>IndexNow activado</td><td class="warn">Pendiente API key</td><td>Ver <span class="code">docs/indexing-actions.md</span></td></tr>
        <tr><td>Product Hunt lanzamiento</td><td class="warn">Pendiente</td><td>Planeado según <span class="code">docs/link-building-plan.md</span></td></tr>
        <tr><td>Backlinks directorios</td><td class="warn">En progreso</td><td>Ver plan de link building</td></tr>
      </tbody>
    </table>
  </div>
</div>

<footer>
  <p>PDFRápido SEO Dashboard · Generado automáticamente por <span class="code">scripts/seo-monitor.js</span></p>
  <div class="links">
    <a href="/">← Volver a PDFRápido</a>
    <a href="/sitemap-index.xml">Sitemap</a>
    <a href="/robots.txt">robots.txt</a>
    <a href="https://github.com/mfsanchez/pdfrapido" target="_blank">GitHub</a>
  </div>
</footer>
</div>
</body>
</html>`;

fs.writeFileSync(STATUS_PATH, htmlDashboard, 'utf8');

console.log('📊 SEO Monitor Report — ' + TODAY);
console.log('─'.repeat(50));
console.log('Herramientas:     ' + report.urls_indexadas.herramientas);
console.log('Blog posts:       ' + report.urls_indexadas.blog);
console.log('Páginas:          ' + report.urls_indexadas.paginas);
console.log('Total URLs:       ' + report.urls_indexadas.total);
console.log('Sitemap URLs:     ' + report.sitemap.urls);
console.log('Enlaces internos: ' + report.enlaces_internos.total);
console.log('Enlaces rotos:    ' + report.enlaces_internos.rotos);
console.log('Schema errors:    ' + report.schema_validacion.errores);
console.log('─'.repeat(50));
console.log('📄 JSON report:  ' + REPORT_PATH);
console.log('🌐 Dashboard:    ' + STATUS_PATH);
