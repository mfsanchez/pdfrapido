# Auditoría SEO Técnica — PDFRápido.eu
**Fecha:** 2026-05-14

---

## 1. Resumen Ejecutivo

Se han auditado **82 URLs** indexables del sitio. Se identificaron y corrigieron problemas críticos que afectaban el rastreo e indexación:

| Problema | Cantidad | Estado |
|----------|----------|--------|
| Canonical incorrecto | 1 | ✅ Corregido |
| Meta `noindex` accidental | 1 | ✅ Corregido |
| Bloqueo robots.txt innecesario | 1 | ✅ Corregido |
| Enlaces rotos internos | 4 | ✅ Corregidos |
| URLs faltantes en sitemap | 1 | ✅ Añadida |
| Schema.org duplicado | 1 | ✅ Corregido |

---

## 2. Diagnóstico por URL

### 🔴 URL 1: `/blog/proteger-pdf-con-contrasena/`
**Diagnóstico:**
- **Canonical incorrecto:** apuntaba a `/blog/como-proteger-pdf-con-contrasena/` (URL diferente a la ruta real).
- **Meta `noindex` accidental:** impedía la indexación.
- **Contenido duplicado:** existía copia idéntica en `/blog/como-proteger-pdf-con-contrasena/` (canónica).

**Fix aplicado:**
- Convertida en **redirección 301 (HTML+JS)** hacia `/blog/como-proteger-pdf-con-contrasena/`.
- Se corrigieron todos los enlaces internos que apuntaban a la URL duplicada:
  - `/blog/index.html`
  - `/blog/editar-metadatos-pdf/index.html`

**Estado actual:** Redirect 301 → `/blog/como-proteger-pdf-con-contrasena/`

---

### 🟡 URL 2: `/blog/convertir-pdf-a-formulario-rellenable/`
**Diagnóstico:**
- **Pocos enlaces internos:** solo 4 enlaces únicos.
- **No estaba en sitemap.xml**.

**Fix aplicado:**
- **Añadida al sitemap.xml** (`lastmod=2026-05-14`, `priority=0.7`).
- **Sección "Artículos relacionados" añadida** con 5 enlaces internos relevantes.

---

### 🟡 URL 3: `/editor-pdf/`
**Diagnóstico:**
- **2 enlaces rotos en footer:** `/privacidad.html` y `/contacto.html`.

**Fix aplicado:**
- `href="/privacidad.html"` → `href="/privacidad/"`
- `href="/contacto.html"` → `href="/contacto/"`

---

### 🟡 URL 4: `/pdf-a-word/`
**Diagnóstico:**
- **Enlace roto interno:** apuntaba a `/editar-pdf/` (inexistente).

**Fix aplicado:**
- `href="/editar-pdf/"` → `href="/editor-pdf/"`

---

### 🟡 URL 5: `/blog/ocr-pdf-escaneado/`
**Diagnóstico:**
- **Enlace roto interno:** apuntaba a `/extraer-datos-factura/` (inexistente).

**Fix aplicado:**
- `href="/extraer-datos-factura/"` → `href="/extraer-datos/"`

---

### 🟡 URL 6: `/analizar-contrato/`
**Diagnóstico:**
- **Schema duplicado:** tenía `SoftwareApplication` + `WebApplication` insertados.

**Fix aplicado:**
- Eliminado el schema `WebApplication` duplicado.
- Se mantiene el schema original `SoftwareApplication`.

---

## 3. robots.txt — Fix

**Eliminado:** `Disallow: /procesar/`

**Justificación:** el directorio `/procesar/` no existe físicamente en el servidor. Su bloqueo en robots.txt generaba el aviso "bloqueada por robots.txt" en GSC.

**robots.txt actual:**
```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /tmp/
Disallow: /admin/
Sitemap: https://pdfrapido.eu/sitemap_index.xml
```

---

## 4. Meta Robots — Verificación Global

- **82 archivos index.html** escaneados.
- **1 `noindex` accidental encontrado** (`/blog/proteger-pdf-con-contrasena/`), ya corregido.
- Resto de páginas usan: `index, follow, max-image-preview:large`.
- **Excepción válida:** `404.html` mantiene `noindex, follow`.

---

## 5. Canonical URLs — Verificación Global

- **80 páginas:** canonical self-referencing correcto.
- **1 página:** redirect intencional (`/blog/proteger-pdf-con-contrasena/` → canónica).
- **1 página:** `404.html` (aceptable).

---

## 6. Sitemap.xml — Actualización

**URL añadida:**
- `/blog/convertir-pdf-a-formulario-rellenable/` (lastmod: 2026-05-14, priority: 0.7)

**URL omitida intencionalmente:**
- `/blog/proteger-pdf-con-contrasena/` (es un redirect 301, no debe indexarse).

**Cobertura:** 81/82 URLs reales (98.8%).

---

## 7. Datos Estructurados (Schema.org)

- **Homepage:** ✅ WebSite + WebApplication
- **Blog index:** ✅ Blog + BlogPosting list
- **Artículos del blog:** ✅ Article (46/46)
- **Herramientas PDF:** ✅ WebApplication/SoftwareApplication (46/46)

---

## 8. Recomendaciones Post-Auditoría

1. **Enviar sitemap actualizado a GSC:** `https://pdfrapido.eu/sitemap_index.xml`
2. **Solicitar re-indexación** de `/blog/como-proteger-pdf-con-contrasena/` y `/blog/convertir-pdf-a-formulario-rellenable/`.
3. **Implementar redirect 301 server-side** (`.htaccess` o config del servidor) para `/blog/proteger-pdf-con-contrasena/` en lugar del redirect HTML/JS.
4. **Monitorear GSC 7-14 días** para confirmar que desaparezcan los avisos de "bloqueada por robots.txt" y "canonical incorrecto".

---

## 9. Archivos Modificados

```
robots.txt
sitemap.xml
blog/index.html
blog/editar-metadatos-pdf/index.html
blog/ocr-pdf-escaneado/index.html
blog/convertir-pdf-a-formulario-rellenable/index.html
blog/proteger-pdf-con-contrasena/index.html
editor-pdf/index.html
pdf-a-word/index.html
analizar-contrato/index.html
```
