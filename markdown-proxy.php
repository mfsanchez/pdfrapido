<?php
// Serves HTML pages as Markdown when Accept: text/markdown is requested
$path = $_GET['_path'] ?? '/';
$path = '/' . ltrim(parse_url($path, PHP_URL_PATH), '/');

// Map path to filesystem file
$base = __DIR__;
$candidates = [
    $base . $path,
    $base . $path . '/index.html',
    $base . $path . '.html',
];

$file = null;
foreach ($candidates as $c) {
    if (is_file($c) && str_ends_with($c, '.html')) {
        $file = $c;
        break;
    }
}

if (!$file) {
    http_response_code(404);
    header('Content-Type: text/plain');
    echo "# 404 Not Found\n\nNo se encontró la página solicitada.";
    exit;
}

$html = file_get_contents($file);

// Extract title
preg_match('/<title[^>]*>(.*?)<\/title>/si', $html, $m);
$title = html_entity_decode(strip_tags($m[1] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
$title = trim(preg_replace('/\s*[|—–-]\s*PDFRápido.*$/u', '', $title));

// Extract meta description
preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i', $html, $m2);
$description = html_entity_decode($m2[1] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8');

// Extract seo-content section (richest text content)
preg_match('/<div[^>]+class=["\'][^"\']*seo-content[^"\']*["\'][^>]*>(.*?)<\/div>\s*<\/main>/si', $html, $ms);
$seoHtml = $ms[1] ?? '';

// Also grab the first <p> in <main> for the intro
preg_match('/<main[^>]*>.*?<h1[^>]*>(.*?)<\/h1>.*?<p[^>]*>(.*?)<\/p>/si', $html, $mp);
$intro = isset($mp[2]) ? html_entity_decode(strip_tags($mp[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8') : '';

function html_to_markdown(string $html): string {
    // Headings
    $html = preg_replace_callback('/<h([1-6])[^>]*>(.*?)<\/h\1>/si', function($m) {
        $level = (int)$m[1];
        $text = trim(strip_tags($m[2]));
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return "\n" . str_repeat('#', $level) . ' ' . $text . "\n";
    }, $html);

    // Bold / italic
    $html = preg_replace('/<strong[^>]*>(.*?)<\/strong>/si', '**$1**', $html);
    $html = preg_replace('/<b[^>]*>(.*?)<\/b>/si', '**$1**', $html);
    $html = preg_replace('/<em[^>]*>(.*?)<\/em>/si', '*$1*', $html);
    $html = preg_replace('/<i[^>]*>(.*?)<\/i>/si', '*$1*', $html);

    // Links
    $html = preg_replace_callback('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/si', function($m) {
        $href = $m[1];
        $text = trim(strip_tags($m[2]));
        if (empty($text)) return '';
        if (str_starts_with($href, '/')) $href = 'https://pdfrapido.eu' . $href;
        return "[$text]($href)";
    }, $html);

    // Lists
    $html = preg_replace_callback('/<ul[^>]*>(.*?)<\/ul>/si', function($m) {
        $items = [];
        preg_match_all('/<li[^>]*>(.*?)<\/li>/si', $m[1], $li);
        foreach ($li[1] as $item) {
            $text = trim(html_entity_decode(strip_tags($item), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if ($text) $items[] = "- $text";
        }
        return "\n" . implode("\n", $items) . "\n";
    }, $html);

    $html = preg_replace_callback('/<ol[^>]*>(.*?)<\/ol>/si', function($m) {
        $items = [];
        preg_match_all('/<li[^>]*>(.*?)<\/li>/si', $m[1], $li);
        foreach ($li[1] as $i => $item) {
            $text = trim(html_entity_decode(strip_tags($item), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if ($text) $items[] = ($i + 1) . ". $text";
        }
        return "\n" . implode("\n", $items) . "\n";
    }, $html);

    // Paragraphs
    $html = preg_replace('/<p[^>]*>(.*?)<\/p>/si', "\n$1\n", $html);
    $html = preg_replace('/<br\s*\/?>/i', "\n", $html);

    // Strip remaining tags
    $html = strip_tags($html);
    $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    // Normalize whitespace
    $html = preg_replace('/\n{3,}/', "\n\n", $html);
    return trim($html);
}

$md = '';
$md .= "# $title\n\n";
if ($description) $md .= "> $description\n\n";
if ($intro && $intro !== $description) $md .= "$intro\n\n";
if ($seoHtml) {
    $md .= "---\n\n";
    $md .= html_to_markdown($seoHtml);
}
$md .= "\n\n---\n\n";
$md .= "*Fuente: [pdfrapido.eu](https://pdfrapido.eu) — Herramientas PDF online gratis*\n";

$tokens = str_word_count($md);

header('Content-Type: text/markdown; charset=utf-8');
header('Vary: Accept');
header("x-markdown-tokens: $tokens");
echo $md;
