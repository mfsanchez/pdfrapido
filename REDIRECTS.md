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
| `/blog/unir-pdf-online/` | `/blog/como-unir-pdf-online/` | Huérfano, duplicaba "unir PDF online" | ✅ | ✅ | ✅ |
| `/blog/como-comprimir-pdf-gratis/` | `/blog/como-comprimir-pdf-sin-perder-calidad/` | Huérfano, duplicaba "comprimir PDF" | ✅ | ✅ | ✅ |
| `/blog/convertir-imagenes-a-pdf-guia-completa/` | `/blog/convertir-jpg-a-pdf/` | **Conflicto jpg-a-pdf RESUELTO** (ver abajo) | ✅ | ✅ | ✅ |

Cada entrada usa el patrón doble (sin barra y con barra):

```caddy
redir /blog/<slug>  /blog/<canonico>/ 301
redir /blog/<slug>/ /blog/<canonico>/ 301
```

## Conflicto jpg-a-pdf — RESUELTO (2026-05-30)

- **Canónico correcto:** `/blog/convertir-jpg-a-pdf/` (es el enlazado desde la herramienta `jpg-a-pdf/index.html`).
- **Problema previo:** el Caddyfile de Oracle tenía la regla en sentido **inverso**
  (`convertir-jpg-a-pdf → convertir-imagenes-a-pdf-guia-completa`), que habría rebotado
  el enlace de la herramienta. El VPS no tenía ninguna regla (por eso producción daba 200).
- **Corrección:** regla invertida en Oracle y añadida en el VPS, de modo que
  `convertir-imagenes-a-pdf-guia-completa` ahora redirige 301 → `convertir-jpg-a-pdf`.
- **Verificado en producción:** `301 → /blog/convertir-jpg-a-pdf/`; canónico responde `200`.
- `convertir-imagenes-a-pdf-guia-completa` eliminado de `sitemap-blog.xml`.

## Pendientes / seguimiento

- Hay enlaces internos en otros artículos del blog que aún apuntan a
  `/blog/convertir-imagenes-a-pdf-guia-completa/` (p. ej. `blog/foto-a-pdf-desde-el-movil/`,
  `blog/index.html`). Funcionan vía 301, pero conviene actualizarlos al canónico directo
  para evitar saltos de redirect.
