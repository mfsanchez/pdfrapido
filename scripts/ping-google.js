#!/usr/bin/env node
/**
 * ping-google.js — Ping sitemaps y URLs a motores de búsqueda
 * Uso: node scripts/ping-google.js
 */

const { execSync } = require('child_process');
const https = require('https');

const SITEMAP = 'https://pdfrapido.eu/sitemap-index.xml';
const HOST = 'pdfrapido.eu';

console.log('📡 Pinging search engines...\n');

// ─── GOOGLE ───
try {
  const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;
  execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { encoding: 'utf8' });
  console.log('✅ Google pinged');
} catch (e) {
  console.log('⚠️  Google ping failed:', e.message);
}

// ─── BING ───
try {
  const url = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;
  execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { encoding: 'utf8' });
  console.log('✅ Bing pinged');
} catch (e) {
  console.log('⚠️  Bing ping failed:', e.message);
}

// ─── INDEXNOW ───
// INSTRUCCIONES:
// 1. Genera una API key aleatoria (ej: openssl rand -hex 32)
// 2. Crea el archivo /var/www/pdfrapido/[KEY].txt con el contenido: [KEY]
// 3. Reemplaza INDEXNOW_KEY abajo con tu key real
// 4. Descomenta el bloque de IndexNow

const INDEXNOW_KEY = '[API_KEY]';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

if (INDEXNOW_KEY !== '[API_KEY]') {
  const urlsToSubmit = [
    `https://${HOST}/`,
    `https://${HOST}/guia-completa-pdf/`,
    `https://${HOST}/blog/`,
    `https://${HOST}/product-hunt/`,
    `https://${HOST}/prensa/`,
  ];

  const payload = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlsToSubmit,
  });

  const options = {
    hostname: 'api.indexnow.org',
    path: '/IndexNow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    console.log(`✅ IndexNow: ${res.statusCode}`);
    res.on('data', (d) => process.stdout.write(d));
    res.on('end', () => console.log(''));
  });

  req.on('error', (e) => console.log('⚠️  IndexNow failed:', e.message));
  req.write(payload);
  req.end();
} else {
  console.log('ℹ️  IndexNow skipped (set INDEXNOW_KEY to enable)');
}

console.log('\n📊 Done. Remember to verify your site in Google Search Console and Bing Webmaster Tools.');
