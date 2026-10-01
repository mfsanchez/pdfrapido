# Redirects 301 — PDFRápido

Registro de consolidaciones de artículos del blog (canibalización de keywords / duplicados)
resueltas mediante redirect 301 en Caddy.

> **Dónde se aplican:** los `redir … 301` viven en `/etc/caddy/Caddyfile`, que **NO** está
> en este repo ni se sincroniza con `sync-pdfrapido.sh` (ese solo propaga contenido web).
> Por eso cada regla debe aplicarse en **DOS** sitios:
> - **Oracle** (`130.110.235.10`, host de edición) — `/etc/caddy/Caddyfile`
> - **VPS de producción** (Tailscale `cloud` = `100.98.161.69` = `136.144.209.14`, `mfvirtual`) — `/etc/caddy/Caddyfile`
>
> Procedimiento por host: backup → editar → `caddy validate` → `systemctl reload caddy` → verificar `curl -I`.
> El que sirve tráfico real (Cloudflare → VPS) es el **VPS**.

## Redirects activos

| Origen (deprecado) | → Destino (canónico) | Motivo | Oracle | VPS | Fuera de sitemap |
|---|---|---|---|---|---|
| `/blog/unir-pdf-online/` | `/unir-pdf/` | Huérfano, duplicaba "unir PDF online" (destino final desde 2026-10, antes `/blog/como-unir-pdf-online/`) | ⏳ | ⏳ | ✅ |
| `/blog/como-comprimir-pdf-gratis/` | `/blog/como-comprimir-pdf-sin-perder-calidad/` | Huérfano, duplicaba "comprimir PDF" | ✅ | ✅ | ✅ |
| `/blog/convertir-imagenes-a-pdf-guia-completa/` | `/jpg-a-pdf/` | **Conflicto jpg-a-pdf RESUELTO** (ver abajo); destino final desde 2026-10 | ⏳ | ⏳ | ✅ |
| `/editar-pdf/` | `/categoria/editar-pdf/` | Categoría inventada en breadcrumbs JSON-LD (nunca existió) | ✅ | ✅ | ✅ (nunca estuvo) |
| `/optimizar-pdf/` | `/categoria/optimizar-pdf/` | Categoría inventada en breadcrumbs JSON-LD (nunca existió) | ✅ | ✅ | ✅ (nunca estuvo) |
| `/convertir-desde-pdf/` | `/categoria/convertir-pdf/` | Categoría inventada en breadcrumbs JSON-LD (nunca existió) | ✅ | ✅ | ✅ (nunca estuvo) |
| `/convertir-a-pdf/` | `/categoria/convertir-pdf/` | Categoría inventada en breadcrumbs JSON-LD (nunca existió) | ✅ | ✅ | ✅ (nunca estuvo) |
| `/seguridad-pdf/` | `/categoria/seguridad-pdf/` | Categoría inventada en breadcrumbs JSON-LD (nunca existió) | ✅ | ✅ | ✅ (nunca estuvo) |
| `/blog/como-unir-pdf-online/` | `/unir-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/unir-pdf-en-el-movil/` | `/unir-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/como-resumir-pdf-gratis-ia/` | `/resumir-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/chat-pdf-preguntar-documentos-ia/` | `/chat-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/traducir-pdf-gratis/` | `/traducir-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/convertir-jpg-a-pdf/` | `/jpg-a-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/como-analizar-contrato-con-ia/` | `/analizar-contrato/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/crear-formulario-pdf-rellenable/` | `/crear-formulario-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/marca-de-agua-pdf/` | `/marca-agua/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/como-anotar-pdf-online/` | `/anotar-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/como-dividir-pdf-online/` | `/dividir-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/numerar-paginas-pdf/` | `/numerar-paginas/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/convertir-excel-a-pdf/` | `/excel-a-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/editar-metadatos-pdf/` | `/editar-metadatos-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/convertir-pdf-a-csv/` | `/pdf-a-csv/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/firmar-pdf-online/` | `/firmar-pdf/` | Consolidación GSC 2026-10: post fusionado en su herramienta | ⏳ | ⏳ | ✅ |
| `/blog/como-analizar-un-contrato-con-ia/` | `/analizar-contrato/` | Tanda 1 (2026-07-07); reapuntada en 2026-10 al destino final | ⏳ | ⏳ | ✅ |
| `/blog/como-resumir-pdf-con-ia/` | `/resumir-pdf/` | Tanda 1 (2026-07-07); reapuntada en 2026-10 al destino final | ⏳ | ⏳ | ✅ |
| `/blog/como-chatear-con-un-pdf/` | `/chat-pdf/` | Tanda 1 (2026-07-07); reapuntada en 2026-10 al destino final | ⏳ | ⏳ | ✅ |
| `/blog/como-traducir-un-pdf-gratis/` | `/traducir-pdf/` | Tanda 1 (2026-07-07); reapuntada en 2026-10 al destino final | ⏳ | ⏳ | ✅ |

Cada entrada usa el patrón doble (sin barra y con barra):

```caddy
redir /blog/<slug>  /blog/<canonico>/ 301
redir /blog/<slug>/ /blog/<canonico>/ 301
```

## Categorías inventadas en breadcrumbs — RESUELTO (2026-07-16)

- **Origen del problema:** el commit `9d889d3` (28-may) inyectó `BreadcrumbList` JSON-LD
  en 10 fichas usando como migaja intermedia URLs de categoría que **nunca existieron**
  (`/editar-pdf/`, `/optimizar-pdf/`, `/convertir-desde-pdf/`, `/convertir-a-pdf/`,
  `/seguridad-pdf/`). Google las descubrió por el schema y las reportó como 404 en GSC
  (export 16-jul; `/seguridad-pdf/` aún no aparecía pero era el mismo defecto).
- **Corrección doble (2026-07-16):**
  1. Breadcrumbs corregidos → `/categoria/…` real en 6 fichas: `rotar-pdf`, `firmar-pdf`,
     `comprimir-pdf`, `pdf-a-word`, `word-a-pdf`, `proteger-pdf` (commit `0bec468`).
  2. Los 5 × 2 `redir … 301` de la tabla, aplicados en Oracle y VPS.
- **Verificado en producción:** las 5 URLs antiguas responden `301` a su categoría y los
  4 destinos `/categoria/…` responden `200` (2026-07-16).

## Conflicto jpg-a-pdf — RESUELTO (2026-05-30)

- **Canónico correcto:** `/blog/convertir-jpg-a-pdf/` (es el enlazado desde la herramienta `jpg-a-pdf/index.html`).
- **Problema previo:** el Caddyfile de Oracle tenía la regla en sentido **inverso**
  (`convertir-jpg-a-pdf → convertir-imagenes-a-pdf-guia-completa`), que habría rebotado
  el enlace de la herramienta. El VPS no tenía ninguna regla (por eso producción daba 200).
- **Corrección:** regla invertida en Oracle y añadida en el VPS, de modo que
  `convertir-imagenes-a-pdf-guia-completa` ahora redirige 301 → `convertir-jpg-a-pdf`.
- **Verificado en producción:** `301 → /blog/convertir-jpg-a-pdf/`; canónico responde `200`.
- `convertir-imagenes-a-pdf-guia-completa` eliminado de `sitemap-blog.xml`.

## Consolidación GSC — 2026-10-01 (rama `gsc-consolidacion`)

Search Console marcaba 24 posts como «Rastreada: actualmente sin indexar». Seis ya eran 301.
De los 18 restantes se mantienen 2 (`foto-a-pdf-desde-el-movil` y `redactar-pdf-rgpd-datos-sensibles`)
y 16 se fusionan en su herramienta: el contenido útil pasa a la ficha y el post se borra del repo.
Las 6 redirecciones antiguas que apuntaban a posts fusionados se reapuntan al destino final, sin cadenas.
⏳ = pendiente de aplicar en el Caddyfile (las reglas están en `pdfrapido-redirects-gsc.caddy`,
que se importa dentro del bloque `pdfrapido.eu {`).

## Pendientes / seguimiento

- Hay enlaces internos en otros artículos del blog que aún apuntan a
  `/blog/convertir-imagenes-a-pdf-guia-completa/` (p. ej. `blog/foto-a-pdf-desde-el-movil/`,
  `blog/index.html`). Funcionan vía 301, pero conviene actualizarlos al canónico directo
  para evitar saltos de redirect.
