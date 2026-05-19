# CLAUDE.md — PDFRápido

## Descripción del proyecto
PDFRápido (https://pdfrapido.eu/) es una plataforma web de herramientas PDF online,
gratuita, sin registro, en español. Tiene 28+ herramientas organizadas en categorías:
organizar, optimizar, convertir, editar y seguridad PDF. También incluye herramientas con IA.

## Stack técnico
- **Frontend**: HTML estático puro + CSS + JS vanilla (sin frameworks)
- **Servidor web**: Caddy
- **Servidor**: Oracle Cloud Infrastructure (OCI), Linux (Rocky Linux)
- **Usuario del sistema**: `caddy`
- **Directorio raíz**: `/var/www/pdfrapido/`
- **API propia**: carpeta `/api/` (PHP)
- **Blog**: carpeta `/blog/` con subcarpetas por artículo

## Estructura de directorios
- Cada herramienta tiene su propia carpeta con `index.html`
  - Ejemplo: `/unir-pdf/index.html`, `/comprimir-pdf/index.html`
- CSS compartido en `/css/`
- JS compartido en `/js/`
- Blog en `/blog/`
- Assets: favicon, og-image, manifest, icons

## Convenciones del proyecto
- Todo el contenido está en **español**
- URLs limpias sin extensión (gracias a Caddy)
- El script `new-page.sh` se usa para crear nuevas herramientas
- Archivos `.bak` son copias de seguridad manuales, no tocar
- SEO es prioritario: cada página tiene meta title, description, og tags, schema.org

## SEO y analítica
- **Sitemap**: `sitemap.xml` y `sitemap_index.xml` y `sitemap-paginas.xml`
- **Robots**: `robots.txt` configurado
- **Google Search Console**: integrado (archivo de verificación `c1ded451e86844a5adcc949152e9b74a.txt`)
- **Google Analytics 4**: integrado en `index.html`
- **AdSense**: `ads.txt` presente

## Archivos importantes
- `CHANGELOG.md` — historial de cambios
- `GUIA-SEARCH-CONSOLE.md` — guía de indexación
- `INFORME_SEO_INDEXACION.md` — informe SEO
- `new-page.sh` — script para crear nuevas páginas de herramientas
- `markdown-proxy.php` — proxy para renderizar markdown en el blog

## Al crear nuevas herramientas
1. Usar `new-page.sh` como base
2. Seguir la estructura HTML de páginas existentes (mismos meta tags, misma navbar, mismo footer)
3. Añadir la URL al `sitemap.xml` y `sitemap-paginas.xml`
4. Añadir el enlace en `index.html` en la sección correspondiente
5. Mantener coherencia visual y de UX con el resto de herramientas

## Al editar HTML
- No romper la estructura de meta tags SEO
- Mantener los bloques de AdSense tal como están
- Respetar el schema.org markup si existe
- Hacer copia `.bak` antes de edits mayores en `index.html`

## Monetización
- Google AdSense (publicidad no invasiva)
- `ads.txt` en raíz

## Otros proyectos relacionados
- https://humantext.es — humaniza textos de IA
- https://cryptopass.es — generador de contraseñas
- Ambos son del mismo developer: MF Sanchez
