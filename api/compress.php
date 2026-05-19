<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

define('UPLOAD_DIR', '/tmp/pdfrapido/');
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

// Limpiar archivos antiguos
foreach (glob(UPLOAD_DIR . '*') as $f) {
    if (filemtime($f) < time() - 600) @unlink($f);
}

if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'No se recibió archivo']); exit;
}

$level = $_POST['level'] ?? 'medium';
$file  = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'Error al subir el archivo']); exit;
}

if ($file['size'] > 50 * 1024 * 1024) {
    echo json_encode(['error' => 'Archivo demasiado grande (máx. 50MB)']); exit;
}

$id      = uniqid('pdf_', true);
$input   = UPLOAD_DIR . $id . '_input.pdf';
$output  = UPLOAD_DIR . $id . '_output.pdf';

move_uploaded_file($file['tmp_name'], $input);

// Configuración Ghostscript por nivel
$settings = [
    'low'    => '-dPDFSETTINGS=/printer',
    'medium' => '-dPDFSETTINGS=/ebook',
    'high'   => '-dPDFSETTINGS=/screen',
];
$setting = $settings[$level] ?? $settings['medium'];

$cmd = "gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 " . $setting .
    " -dNOPAUSE -dQUIET -dBATCH" .
    " -sOutputFile=" . escapeshellarg($output) .
    " " . escapeshellarg($input) . " 2>&1";

exec($cmd, $out, $code);

if ($code !== 0 || !file_exists($output)) {
    @unlink($input);
    echo json_encode(['error' => 'Error al comprimir: ' . implode(' ', $out)]); exit;
}

$origSize = filesize($input);
$compSize = filesize($output);

// Segunda pasada con qpdf para recomprimir streams (mejora texto y estructura)
$qpdf_bin = file_exists('/usr/bin/qpdf') ? '/usr/bin/qpdf' : '/usr/local/bin/qpdf';
$output2 = UPLOAD_DIR . $id . '_output2.pdf';
$cmd_qpdf = sprintf(
    '%s --compress-streams=y --recompress-flate --compression-level=9 %s %s 2>&1',
    escapeshellarg($qpdf_bin),
    escapeshellarg($output),
    escapeshellarg($output2)
);
exec($cmd_qpdf, $out2, $code2);
if (($code2 === 0 || $code2 === 3) && file_exists($output2) && filesize($output2) < $compSize) {
    @unlink($output);
    $output = $output2;
    $compSize = filesize($output);
} else {
    @unlink($output2);
}

// Si el comprimido es mayor o igual, devolver el original
if ($compSize >= $origSize) {
    $output = $input;
    $compSize = $origSize;
}

// Devolver el PDF como base64
$pdfData = base64_encode(file_get_contents($output));

@unlink($input);
@unlink($output);

echo json_encode([
    'success'      => true,
    'original_size'=> $origSize,
    'compressed_size' => $compSize,
    'savings_pct'  => round((1 - $compSize / $origSize) * 100),
    'pdf_base64'   => $pdfData,
    'filename'     => pathinfo($file['name'], PATHINFO_FILENAME) . '_comprimido.pdf'
]);
