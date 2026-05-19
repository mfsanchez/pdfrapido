#!/bin/bash
# new-page.sh — crea una nueva página de herramienta en pdfrapido.eu
# Uso: sudo ./new-page.sh <nombre-slug>
# Ejemplo: sudo ./new-page.sh comprimir-pdf

set -euo pipefail

WEBROOT="/var/www/pdfrapido"
OWNER="caddy:caddy"
DIR_PERMS="755"
FILE_PERMS="644"

# --- Validación ---
if [[ $# -ne 1 ]]; then
    echo "Uso: sudo $0 <nombre-slug>"
    echo "Ejemplo: sudo $0 mi-nueva-herramienta"
    exit 1
fi

SLUG="$1"

if [[ ! "$SLUG" =~ ^[a-z0-9-]+$ ]]; then
    echo "Error: el slug solo puede contener letras minúsculas, números y guiones."
    exit 1
fi

TARGET="$WEBROOT/$SLUG"

if [[ -d "$TARGET" ]]; then
    echo "Error: el directorio '$TARGET' ya existe."
    exit 1
fi

# --- Crear directorio e index.html con template base ---
mkdir -p "$TARGET"

cat > "$TARGET/index.html" << 'TEMPLATE'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDFRápido</title>
    <link rel="stylesheet" href="/css/styles.css">
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-93B5VKXW7W"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-93B5VKXW7W');
    </script>
</head>
<body>
    <header></header>
    <main></main>
    <footer></footer>
    <script src="/js/main.js"></script>
</body>
</html>
TEMPLATE

# --- Aplicar permisos ---
chown -R "$OWNER" "$TARGET"
find "$TARGET" -type d -exec chmod "$DIR_PERMS" {} \;
find "$TARGET" -type f -exec chmod "$FILE_PERMS" {} \;

echo "Creada: $TARGET"
echo "Propietario: $OWNER"
echo "Permisos: dirs=$DIR_PERMS, archivos=$FILE_PERMS"
echo ""
echo "Ahora edita: $TARGET/index.html"
