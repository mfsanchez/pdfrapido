<?php
// Configuración común para los endpoints de PDFRápido
define('UPLOAD_DIR', '/tmp/pdfrapido/');
define('MAX_FILE_SIZE', 50 * 1024 * 1024);
define('CLEANUP_MINUTES', 10);

// OpenAI config
$OPENAI_API_KEY = getenv('OPENAI_API_KEY') ?: '';

function ensure_upload_dir() {
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0777, true);
    }
}

function cleanup_dir(string $dir): void {
    if (!is_dir($dir)) return;
    $files = glob($dir . '*');
    foreach ($files as $f) {
        if (is_file($f)) unlink($f);
    }
    @rmdir($dir);
}

function json_error(string $message, int $code = 400): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'detail' => $message]);
    exit;
}

function json_success(array $data): void {
    header('Content-Type: application/json');
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

function validate_file_upload(string $field): array {
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        json_error('Error al subir el archivo', 400);
    }
    if ($_FILES[$field]['size'] > MAX_FILE_SIZE) {
        json_error('El archivo supera los 50 MB', 413);
    }
    return $_FILES[$field];
}
