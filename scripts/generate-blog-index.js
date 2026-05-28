#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.resolve(__dirname, '../blog');
const OUT_FILE = path.join(BLOG_DIR, 'index.html');

function getTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/\s*\|\s*PDFRápido/i, '').trim() : 'Sin título';
}
function getDesc(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  return m ? m[1] : '';
}
function getDate(html) {
  const m = html.match(/datePublished["']?\s*[:>]\s*["']([^"']+)/);
  return m ? m[1] : '2026-05-28';
}

const cats = {
  'comprimir': 'Optimizar',
  'comprimir-pdf': 'Optimizar',
  'redimensionar': 'Editar',
  'redactar': 'Seguridad',
  'proteger': 'Seguridad',
  'firmar': 'Seguridad',
  'desbloquear': 'Seguridad',
  'unir': 'Organizar',
  'dividir': 'Organizar',
  'extraer-paginas': 'Organizar',
  'eliminar-paginas': 'Organizar',
  'rotar': 'Organizar',
  'organizar': 'Organizar',
  'numerar': 'Editar',
  'editar-metadatos': 'Editar',
  'marca-de-agua': 'Editar',
  'anotar': 'Editar',
  'word-a-pdf': 'Convertir',
  'pdf-a-word': 'Convertir',
  'excel-a-pdf': 'Convertir',
  'pdf-a-excel': 'Convertir',
  'pptx-a-pdf': 'Convertir',
  'pdf-a-pptx': 'Convertir',
  'jpg-a-pdf': 'Convertir',
  'pdf-a-jpg': 'Convertir',
  'imagen-a-pdf': 'Convertir',
  'convertir-imagenes': 'Convertir',
  'convertir-word': 'Convertir',
  'convertir-excel': 'Convertir',
  'convertir-texto': 'Convertir',
  'pdf-a-texto': 'Convertir',
  'pdf-a-csv': 'Convertir',
  'pdf-a-png': 'Convertir',
  'texto-a-pdf': 'Convertir',
  'html-a-pdf': 'Convertir',
  'ocr': 'Optimizar',
  'reparar': 'Optimizar',
  'pdf-a': 'Optimizar',
  'resumir': 'IA',
  'traducir': 'IA',
  'chat-pdf': 'IA',
  'extraer-datos': 'IA',
  'generar': 'IA',
  'carta-presentacion': 'IA',
  'analizar-contrato': 'IA',
  'corregir': 'IA',
  'cv-a-carta': 'IA',
  'alternativas': 'General',
  'diferencia-pdf': 'General',
  'mejores-herramientas': 'General',
  'que-es-pdf': 'General',
  'foto-a-pdf': 'Convertir',
};

function guessCategory(slug) {
  for (const [key, val] of Object.entries(cats)) {
    if (slug.includes(key)) return val;
  }
  return 'General';
}

const dirs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'index.html')
  .map(d => {
    const slug = d.name;
    const file = path.join(BLOG_DIR, slug, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    return {
      slug,
      title: getTitle(html),
      desc: getDesc(html),
      date: getDate(html),
      category: guessCategory(slug)
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

const articlesHtml = dirs.map(d => `
    <a href="/blog/${d.slug}/" class="article-card" data-cat="${d.category}">
      <div class="article-icon" style="background:var(--primary-light);color:var(--primary);font-size:24px;font-weight:700">${d.title.charAt(0)}</div>
      <div class="article-body">
        <span class="tag" style="background:var(--primary-light);color:var(--primary)">${d.category}</span>
        <h2>${d.title}</h2>
        <p>${d.desc.substring(0, 120)}${d.desc.length > 120 ? '...' : ''}</p>
        <div class="meta">${d.date} · Por <span rel="author">MF Sanchez</span></div>
      </div>
    </a>`).join('\n');

const blogPostingSchema = dirs.slice(0, 30).map(d =>
  `        {"@type": "BlogPosting", "headline": "${d.title.replace(/"/g, '\\"')}", "url": "https://pdfrapido.eu/blog/${d.slug}/", "datePublished": "${d.date}"}`
).join(',\n');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <script>(function(){try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Blog de PDFRápido: guías prácticas, tutoriales y consejos para trabajar con archivos PDF de forma eficiente. Más de 40 artículos gratuitos.">
    <meta name="author" content="MF Sanchez - PDFRápido">
    <title>Blog de PDFRápido — Guías y Tutoriales PDF</title>
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="https://pdfrapido.eu/blog/">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/styles.css?v=13">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-93B5VKXW7W"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-93B5VKXW7W');
</script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7923775430516782" crossorigin="anonymous"></script>
    <style>
        .blog-hero{text-align:center;padding:140px 24px 60px}
        .blog-hero h1{font-size:clamp(32px,5vw,48px);font-weight:700;color:var(--secondary);letter-spacing:-1px;margin-bottom:12px}
        .blog-hero p{font-size:17px;color:var(--gray-500);max-width:600px;margin:0 auto 16px}
        .blog-intro{max-width:800px;margin:0 auto 40px;padding:0 24px;font-size:15px;color:var(--gray-600);line-height:1.75;text-align:center}
        .filter-bar{max-width:900px;margin:0 auto 24px;padding:0 24px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
        .filter-bar button{border:none;background:var(--gray-100);color:var(--gray-600);padding:6px 14px;border-radius:100px;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s}
        .filter-bar button:hover,.filter-bar button.active{background:var(--primary);color:#fff}
        .articles{max-width:900px;margin:0 auto;padding:0 24px 80px}
        .article-card{display:flex;gap:24px;background:#fff;border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:28px;margin-bottom:20px;text-decoration:none;color:inherit;transition:all .3s}
        .article-card:hover{border-color:transparent;box-shadow:var(--shadow-hover);transform:translateY(-3px)}
        .article-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .article-body{flex:1;min-width:0}
        .article-body .tag{display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:3px 10px;border-radius:100px;margin-bottom:10px}
        .article-body h2{font-size:18px;font-weight:600;color:var(--secondary);margin-bottom:6px;letter-spacing:-.3px}
        .article-body p{font-size:14px;color:var(--gray-500);line-height:1.6}
        .article-body .meta{font-size:12px;color:var(--gray-400);margin-top:10px}
        @media(max-width:640px){.blog-hero{padding:120px 16px 40px}.articles{padding:0 16px 60px}.article-card{flex-direction:column;gap:16px;padding:20px}}
    </style>
    <link rel="canonical" href="https://pdfrapido.eu/blog/">
    <meta property="og:title" content="Blog de PDFRápido — Guías y Tutoriales PDF">
    <meta property="og:description" content="Blog de PDFRápido: guías prácticas, tutoriales y consejos para trabajar con archivos PDF de forma eficiente.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://pdfrapido.eu/blog/">
    <meta property="og:site_name" content="PDFRápido">
    <meta property="og:image" content="https://pdfrapido.eu/og-image.png">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Blog de PDFRápido — Guías y Tutoriales PDF",
      "url": "https://pdfrapido.eu/blog/",
      "description": "Guías prácticas, tutoriales paso a paso y consejos para trabajar con archivos PDF de forma eficiente.",
      "publisher": {"@type":"Organization","name":"PDFRápido","url":"https://pdfrapido.eu"},
      "inLanguage": "es"
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Blog PDFRápido",
      "url": "https://pdfrapido.eu/blog/",
      "description": "Guías prácticas, tutoriales paso a paso y consejos para trabajar con archivos PDF de forma eficiente.",
      "publisher": {"@type":"Organization","name":"PDFRápido","url":"https://pdfrapido.eu"},
      "inLanguage": "es",
      "blogPost": [
${blogPostingSchema}
      ]
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type":"ListItem","position":1,"name":"PDFRápido","item":"https://pdfrapido.eu/"},
        {"@type":"ListItem","position":2,"name":"Blog","item":"https://pdfrapido.eu/blog/"}
      ]
    }
    </script>
</head>
<body>
<nav id="nav"><div class="nav-inner">
  <a href="/" class="logo"><div class="logo-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="logo-text">PDF<span>Rápido</span></div></a>
  <button class="hamburger" aria-label="Menú" aria-expanded="false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
  <ul class="nav-links">
    <li><a href="/guia-completa-pdf/">Guía PDF</a></li>
    <li><a href="/">Herramientas</a></li>
    <li><a href="/blog/">Blog</a></li>
  </ul>
  <button class="theme-toggle" aria-label="Activar modo oscuro" aria-pressed="false"><svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></button>
</div></nav>

<main>
  <div class="blog-hero">
    <h1>Blog de PDFRápido</h1>
    <p>Guías prácticas, tutoriales y consejos para trabajar con archivos PDF de forma eficiente. Más de 40 artículos escritos por expertos.</p>
  </div>
  <div class="blog-intro">
    <p>¿Buscas una guía completa? Consulta nuestra <a href="/guia-completa-pdf/">Guía Completa de Herramientas PDF</a> con todas las herramientas explicadas paso a paso.</p>
  </div>
  <div class="filter-bar">
    <button class="active" data-filter="all">Todos</button>
    <button data-filter="Convertir">Convertir</button>
    <button data-filter="Optimizar">Optimizar</button>
    <button data-filter="Organizar">Organizar</button>
    <button data-filter="Editar">Editar</button>
    <button data-filter="Seguridad">Seguridad</button>
    <button data-filter="IA">IA</button>
    <button data-filter="General">General</button>
  </div>
  <div class="articles">
${articlesHtml}
  </div>
</main>

<footer><p>&copy; 2026 PDFRápido — dev: <a href="/sobre-mf-sanchez/" rel="author">MF Sanchez</a> &nbsp;|&nbsp; <a href="/">Inicio</a> · <a href="/guia-completa-pdf/">Guía PDF</a> · <a href="/blog/">Blog</a> · <a href="/sobre-pdfrapido/">Sobre PDFRápido</a> · <a href="/privacidad/">Privacidad</a> · <a href="/cookies/">Cookies</a> · <a href="/contacto/">Contacto</a></p></footer>

<script>
(function(){
  var buttons = document.querySelectorAll('.filter-bar button');
  var cards = document.querySelectorAll('.article-card');
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      buttons.forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');
      cards.forEach(function(card){
        card.style.display = (filter === 'all' || card.getAttribute('data-cat') === filter) ? 'flex' : 'none';
      });
    });
  });
})();
</script>
<script src="/js/cookies-banner.js"></script>
<script src="/js/error-modal.js"></script>
<script src="/js/theme-toggle.js?v=14" defer></script>
</body>
</html>`;

fs.writeFileSync(OUT_FILE, html, 'utf8');
console.log(`✅ Blog index rebuilt with ${dirs.length} articles`);
