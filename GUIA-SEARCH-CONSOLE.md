# Guía de Verificación Post-Implementación — Google Search Console

## 📋 Checklist de Verificación (hazlo AHORA)

### 1. Validar robots.txt
- [ ] Abrir: https://pdfrapido.eu/robots.txt
- [ ] Confirmar que aparezca: `Sitemap: https://pdfrapido.eu/sitemap.xml`
- [ ] Confirmar bloqueos: `/api/`, `/procesar/`, `/tmp/`, `/admin/`

### 2. Validar sitemap.xml
- [ ] Abrir: https://pdfrapido.eu/sitemap.xml
- [ ] Confirmar 55 URLs listadas
- [ ] Verificar que no haya errores de XML (el navegador debe mostrar el árbol XML)

### 3. Test de URL en vivo (Google Search Console)
1. Ir a: https://search.google.com/search-console
2. Añadir propiedad: `pdfrapido.eu` (método de registro DNS o archivo HTML)
3. Ir a "Inspeccionar URL"
4. Probar estas URLs una por una:
   - `https://pdfrapido.eu/`
   - `https://pdfrapido.eu/comprimir-pdf/`
   - `https://pdfrapido.eu/pdf-a-word/`
   - `https://pdfrapido.eu/firmar-pdf/`
   - `https://pdfrapido.eu/unir-pdf/`
5. Para cada URL, verificar:
   - [ ] Estado: "URL está en Google" o "URL puede indexarse"
   - [ ] "Rastreo correcto" sin errores
   - [ ] "Canónica declarada por el usuario" coincide con la URL

### 4. Test de Rich Results (Schema.org)
- [ ] Ir a: https://search.google.com/test/rich-results
- [ ] Probar: `https://pdfrapido.eu/comprimir-pdf/`
- [ ] Confirmar que detecte: `FAQPage`, `BreadcrumbList`, `WebApplication`
- [ ] Probar: `https://pdfrapido.eu/`
- [ ] Confirmar que detecte: `WebSite`, `FAQPage`

### 5. Test Mobile-Friendly
- [ ] Ir a: https://search.google.com/test/mobile-friendly
- [ ] Probar: `https://pdfrapido.eu/comprimir-pdf/`
- [ ] Confirmar: "La página es apta para móviles"

### 6. PageSpeed Insights
- [ ] Ir a: https://pagespeed.web.dev/
- [ ] Probar: `https://pdfrapido.eu/`
- [ ] Probar: `https://pdfrapido.eu/comprimir-pdf/`
- [ ] Objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms

---

## 🚀 Pasos para Enviar a Google

### Paso A: Añadir propiedad en Google Search Console
1. Ve a https://search.google.com/search-console
2. Haz clic en "Añadir propiedad"
3. Selecciona "Dominio" e introduce: `pdfrapido.eu`
4. Verifica mediante registro DNS (añade el TXT que te da Google en tu DNS)
   - Alternativa: usa el método "Prefijo de URL" con `https://pdfrapido.eu/`

### Paso B: Enviar sitemap
1. En Search Console, ve a "Sitemaps" (menú lateral)
2. En "Añadir un sitemap nuevo", escribe: `sitemap.xml`
3. Haz clic en "Enviar"
4. Espera 1-7 días a que Google procese el sitemap
5. Verifica que aparezca "Correcto" con ~55 URLs descubiertas

### Paso C: Solicitar indexación manual
1. Ve a "Inspeccionar URL" en Search Console
2. Introduce cada URL y haz clic en "Solicitar indexación":
   - `https://pdfrapido.eu/` (home)
   - `https://pdfrapido.eu/comprimir-pdf/`
   - `https://pdfrapido.eu/unir-pdf/`
   - `https://pdfrapido.eu/pdf-a-word/`
   - `https://pdfrapido.eu/jpg-a-pdf/`
   - `https://pdfrapido.eu/firmar-pdf/`
3. Repite para las 10-15 herramientas principales

### Paso D: Monitorizar
1. Ve a "Rendimiento" en Search Console
2. Espera 3-7 días y verifica:
   - Impresiones (deberían empezar a aparecer)
   - Clics (puede tardar semanas)
   - Posiciones medias
3. Ve a "Cobertura" y verifica:
   - "Válidas" debería aumentar
   - "Excluidas" debería ser mínimo (solo 404, redirecciones)
   - NO debería haber errores de "Rastreo"

---

## ⚠️ Problemas Comunes y Soluciones

| Problema | Solución |
|---|---|
| "La URL no está en Google" | Solicitar indexación manual y esperar 3-7 días |
| "Página no apta para móviles" | Verificar viewport y CSS responsive |
| "Errores de sitemap" | Validar XML con https://www.xml-sitemaps.com/validate-xml-sitemap.html |
| "Canonical alternativa" | Asegurar que canonical coincida exactamente con la URL |
| "Contenido duplicado" | Verificar que cada página tenga title y description únicos |
| "Rastreo bloqueado por robots.txt" | Verificar que la URL no esté en Disallow |

---

## 📊 Expectativas de Tiempo

| Acción | Tiempo estimado |
|---|---|
| Google procesa sitemap | 1-7 días |
| Primeras impresiones en Search Console | 3-14 días |
| Primeras páginas indexadas (site:) | 7-21 días |
| Indexación masiva de herramientas | 2-8 semanas |
| Resultados SEO significativos | 3-6 meses |

---

## 🔗 Herramientas de Verificación Rápida

- **robots.txt:** https://pdfrapido.eu/robots.txt
- **sitemap.xml:** https://pdfrapido.eu/sitemap.xml
- **Rich Results Test:** https://search.google.com/test/rich-results
- **Mobile-Friendly Test:** https://search.google.com/test/mobile-friendly
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Schema Validator:** https://validator.schema.org/

---

*Guía generada el 2026-04-29 — PDFRápido SEO Implementation*
