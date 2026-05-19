<?php
/**
 * PDFRápido - API de conversión de documentos
 * Backend PHP para conversiones Office <-> PDF usando LibreOffice headless
 * dev: MF Sanchez
 * 
 * Endpoints:
 *   POST /api/convert.php?action=office-to-pdf   (Word/Excel/PPT → PDF)
 *   POST /api/convert.php?action=pdf-to-office    (PDF → Word/Excel/PPT)
 *   POST /api/convert.php?action=html-to-pdf      (HTML → PDF)
 *   POST /api/convert.php?action=unlock-pdf       (Desbloquear PDF)
 *   POST /api/convert.php?action=protect-pdf      (Proteger PDF con contraseña AES-256)
 *   POST /api/convert.php?action=repair-pdf       (Reparar PDF)
 */

// ── CONFIG ──
define('UPLOAD_DIR', '/tmp/pdfrapido/');
define('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50 MB
define('LIBREOFFICE_BIN', '/usr/bin/libreoffice');
define('QPDF_BIN', file_exists('/usr/bin/qpdf') ? '/usr/bin/qpdf' : '/usr/local/bin/qpdf');
define('ALLOWED_ORIGINS', ['https://pdfrapido.es', 'https://www.pdfrapido.es']); // Cambiar al dominio real
define('CLEANUP_MINUTES', 10);

// ── CORS ──
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// En desarrollo permitir todo, en producción filtrar
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Método no permitido', 405);
}

// ── INIT ──
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
} elseif (!is_writable(UPLOAD_DIR)) {
    chmod(UPLOAD_DIR, 0777);
}

// Limpieza de archivos antiguos
cleanup_old_files();

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'office-to-pdf':
            handle_office_to_pdf();
            break;
        case 'pdf-to-office':
            handle_pdf_to_office();
            break;
        case 'html-to-pdf':
            handle_html_to_pdf();
            break;
        case 'unlock-pdf':
            handle_unlock_pdf();
            break;
        case 'protect-pdf':
            handle_protect_pdf();
            break;
        case 'repair-pdf':
            handle_repair_pdf();
            break;
        case 'pdf-to-pdfa':
            handle_pdf_to_pdfa();
            break;
        default:
            json_error('Acción no válida', 400);
    }
} catch (Exception $e) {
    error_log('PDFRápido error: ' . $e->getMessage());
    json_error('Error interno del servidor', 500);
}

// ── HANDLERS ──

function handle_office_to_pdf() {
    $file = validate_upload('file', [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation',
    ]);

    $id = uniqid('conv_');
    $workdir = UPLOAD_DIR . $id . '/';
    mkdir($workdir, 0755, true);

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $input_path = $workdir . 'input.' . $ext;
    move_uploaded_file($file['tmp_name'], $input_path);

    // Convertir con LibreOffice
    // -env:UserInstallation necesario para que apache pueda escribir su perfil de LO
    $lo_profile = 'file://' . $workdir . 'lo_profile';
    $cmd = sprintf(
        'HOME=/tmp DCONF_PROFILE=/dev/null %s --headless --norestore -env:UserInstallation=%s --convert-to pdf --outdir %s %s 2>&1',
        escapeshellarg(LIBREOFFICE_BIN),
        escapeshellarg($lo_profile),
        escapeshellarg($workdir),
        escapeshellarg($input_path)
    );

    $output = [];
    $return_code = 0;
    exec($cmd, $output, $return_code);

    $pdf_path = $workdir . 'input.pdf';
    if (!file_exists($pdf_path)) {
        cleanup_dir($workdir);
        json_error('Error en la conversión. Verifica que el archivo no esté dañado.', 422);
    }

    send_file($pdf_path, pathinfo($file['name'], PATHINFO_FILENAME) . '.pdf', 'application/pdf');
    cleanup_dir($workdir);
}

function handle_pdf_to_office() {
    $file = validate_upload('file', ['application/pdf']);
    $format = $_POST['format'] ?? 'docx';
    
    $allowed_formats = ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'];
    if (!in_array($format, $allowed_formats)) {
        json_error('Formato no soportado', 400);
    }

    $id = uniqid('conv_');
    $workdir = UPLOAD_DIR . $id . '/';
    mkdir($workdir, 0755, true);

    $input_path = $workdir . 'input.pdf';
    move_uploaded_file($file['tmp_name'], $input_path);

    // Mapear formato a filtro de LibreOffice (para formatos no-docx)
    $filter_map = [
        'xlsx' => 'xlsx',
        'pptx' => 'pptx',
        'odt'  => 'odt',
        'ods'  => 'ods',
        'odp'  => 'odp',
    ];

    $output = [];
    $return_code = 0;
    $output_path = $workdir . 'input.' . $format;

    if ($format === 'docx') {
        // pdf2docx produce formato mucho mejor que LibreOffice writer_pdf_import
        $script = __DIR__ . '/pdf2docx_convert.py';
        $cmd = sprintf(
            'python3 %s %s %s 2>&1',
            escapeshellarg($script),
            escapeshellarg($input_path),
            escapeshellarg($output_path)
        );
        exec($cmd, $output, $return_code);
    } else {
        // Para xlsx/pptx/odt usar LibreOffice
        $lo_profile = 'file://' . $workdir . 'lo_profile';
        $cmd = sprintf(
            'HOME=/tmp DCONF_PROFILE=/dev/null %s --headless --norestore -env:UserInstallation=%s --infilter="writer_pdf_import" --convert-to %s --outdir %s %s 2>&1',
            escapeshellarg(LIBREOFFICE_BIN),
            escapeshellarg($lo_profile),
            escapeshellarg($filter_map[$format]),
            escapeshellarg($workdir),
            escapeshellarg($input_path)
        );
        exec($cmd, $output, $return_code);
    }

    if (!file_exists($output_path) || filesize($output_path) < 500) {
        cleanup_dir($workdir);
        json_error('Error en la conversión. El PDF podría estar protegido o tener un formato incompatible.', 422);
    }

    $mime_map = [
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'odt'  => 'application/vnd.oasis.opendocument.text',
        'ods'  => 'application/vnd.oasis.opendocument.spreadsheet',
        'odp'  => 'application/vnd.oasis.opendocument.presentation',
    ];

    send_file($output_path, pathinfo($file['name'], PATHINFO_FILENAME) . '.' . $format, $mime_map[$format]);
    cleanup_dir($workdir);
}

function handle_html_to_pdf() {
    $url = $_POST['url'] ?? '';
    
    if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
        json_error('URL no válida', 400);
    }

    // Verificar que sea HTTP/HTTPS
    $scheme = parse_url($url, PHP_URL_SCHEME);
    if (!in_array($scheme, ['http', 'https'])) {
        json_error('Solo se permiten URLs HTTP/HTTPS', 400);
    }

    $id = uniqid('html_');
    $workdir = UPLOAD_DIR . $id . '/';
    mkdir($workdir, 0755, true);

    // Descargar HTML
    $html_content = @file_get_contents($url, false, stream_context_create([
        'http' => ['timeout' => 15, 'user_agent' => 'PDFRápido Bot/1.0']
    ]));

    if ($html_content === false) {
        cleanup_dir($workdir);
        json_error('No se pudo acceder a la URL', 422);
    }

    $html_path = $workdir . 'page.html';
    file_put_contents($html_path, $html_content);

    $lo_profile = 'file://' . $workdir . 'lo_profile';
    $cmd = sprintf(
        'HOME=/tmp DCONF_PROFILE=/dev/null %s --headless --norestore -env:UserInstallation=%s --convert-to pdf --outdir %s %s 2>&1',
        escapeshellarg(LIBREOFFICE_BIN),
        escapeshellarg($lo_profile),
        escapeshellarg($workdir),
        escapeshellarg($html_path)
    );

    exec($cmd, $output, $return_code);

    $pdf_path = $workdir . 'page.pdf';
    if (!file_exists($pdf_path)) {
        cleanup_dir($workdir);
        json_error('Error al convertir la página web', 422);
    }

    $domain = parse_url($url, PHP_URL_HOST) ?? 'pagina';
    send_file($pdf_path, $domain . '.pdf', 'application/pdf');
    cleanup_dir($workdir);
}

function handle_unlock_pdf() {
    $file = validate_upload('file', ['application/pdf']);
    $password = $_POST['password'] ?? '';

    $id = uniqid('unlock_');
    $workdir = UPLOAD_DIR . $id . '/';
    mkdir($workdir, 0755, true);

    $input_path = $workdir . 'input.pdf';
    $output_path = $workdir . 'output.pdf';
    move_uploaded_file($file['tmp_name'], $input_path);

    // Intentar con qpdf
    $cmd_qpdf = sprintf(
        '%s --password=%s --decrypt %s %s 2>&1',
        escapeshellarg(QPDF_BIN),
        escapeshellarg($password),
        escapeshellarg($input_path),
        escapeshellarg($output_path)
    );

    exec($cmd_qpdf, $output, $return_code);

    if ($return_code !== 0 || !file_exists($output_path)) {
        // Fallback: intentar con pdftk
        $cmd_pdftk = sprintf(
            'pdftk %s input_pw %s output %s 2>&1',
            escapeshellarg($input_path),
            escapeshellarg($password),
            escapeshellarg($output_path)
        );
        exec($cmd_pdftk, $output2, $return_code2);

        if ($return_code2 !== 0 || !file_exists($output_path)) {
            cleanup_dir($workdir);
            json_error('No se pudo desbloquear el PDF. Verifica la contraseña.', 422);
        }
    }

    send_file($output_path, pathinfo($file['name'], PATHINFO_FILENAME) . '_desbloqueado.pdf', 'application/pdf');
    cleanup_dir($workdir);
}

function handle_protect_pdf() {
    $file = validate_upload('file', ['application/pdf']);
    $password = $_POST['password'] ?? '';

    if (strlen($password) < 4) {
        json_error('La contraseña debe tener al menos 4 caracteres', 400);
    }

    $id = uniqid('protect_');
    $workdir = UPLOAD_DIR . $id . '/';
    mkdir($workdir, 0755, true);

    $input_path  = $workdir . 'input.pdf';
    $output_path = $workdir . 'output.pdf';
    move_uploaded_file($file['tmp_name'], $input_path);

    // qpdf --encrypt <user-pw> <owner-pw> 256 -- input output
    $cmd = sprintf(
        '%s --encrypt %s %s 256 -- %s %s 2>&1',
        escapeshellarg(QPDF_BIN),
        escapeshellarg($password),
        escapeshellarg($password),
        escapeshellarg($input_path),
        escapeshellarg($output_path)
    );

    exec($cmd, $output, $return_code);

    // qpdf exit codes: 0 = ok, 2 = error, 3 = ok with warnings
    if (($return_code !== 0 && $return_code !== 3) || !file_exists($output_path)) {
        cleanup_dir($workdir);
        json_error('No se pudo proteger el PDF. El archivo puede ser inválido o ya está cifrado.', 422);
    }

    send_file($output_path, pathinfo($file['name'], PATHINFO_FILENAME) . '_protegido.pdf', 'application/pdf');
    cleanup_dir($workdir);
}

function handle_repair_pdf() {
    $file = validate_upload('file', ['application/pdf']);

    $id = uniqid('repair_');
    $workdir = UPLOAD_DIR . $id . '/';
    mkdir($workdir, 0755, true);

    $input_path = $workdir . 'input.pdf';
    $output_path = $workdir . 'output.pdf';
    move_uploaded_file($file['tmp_name'], $input_path);

    // Intentar reparar con qpdf
    $cmd = sprintf(
        '%s --replace-input %s 2>&1 && cp %s %s',
        escapeshellarg(QPDF_BIN),
        escapeshellarg($input_path),
        escapeshellarg($input_path),
        escapeshellarg($output_path)
    );

    exec($cmd, $output, $return_code);

    // Alternativa: usar ghostscript
    if (!file_exists($output_path)) {
        $cmd_gs = sprintf(
            'gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile=%s %s 2>&1',
            escapeshellarg($output_path),
            escapeshellarg($input_path)
        );
        exec($cmd_gs, $output2, $return_code2);
    }

    if (!file_exists($output_path)) {
        cleanup_dir($workdir);
        json_error('No se pudo reparar el PDF. El archivo podría estar demasiado dañado.', 422);
    }

    send_file($output_path, pathinfo($file['name'], PATHINFO_FILENAME) . '_reparado.pdf', 'application/pdf');
    cleanup_dir($workdir);
}

function handle_pdf_to_pdfa() {
    $file = validate_upload('file', ['application/pdf']);

    $id = uniqid('pdfa_');
    $workdir = UPLOAD_DIR . $id . '/';
    mkdir($workdir, 0755, true);

    $input_path  = $workdir . 'input.pdf';
    $output_path = $workdir . 'output.pdf';
    move_uploaded_file($file['tmp_name'], $input_path);

    // Ghostscript PDF/A-2b conversion
    $cmd = sprintf(
        'gs -dPDFA=2 -dBATCH -dNOPAUSE -dCompatibilityLevel=1.7 -sDEVICE=pdfwrite' .
        ' -dPDFACompatibilityPolicy=1 -dQUIET' .
        ' -sOutputFile=%s %s 2>&1',
        escapeshellarg($output_path),
        escapeshellarg($input_path)
    );

    exec($cmd, $output, $return_code);

    if ($return_code !== 0 || !file_exists($output_path) || filesize($output_path) < 100) {
        cleanup_dir($workdir);
        json_error('No se pudo convertir a PDF/A. El archivo puede estar protegido o dañado.', 422);
    }

    $basename = pathinfo($file['name'], PATHINFO_FILENAME);
    send_file($output_path, $basename . '_pdfa.pdf', 'application/pdf');
    cleanup_dir($workdir);
}

// ── HELPERS ──

function validate_upload(string $field, array $allowed_mimes): array {
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE   => 'El archivo supera el tamaño máximo',
            UPLOAD_ERR_FORM_SIZE  => 'El archivo supera el tamaño máximo del formulario',
            UPLOAD_ERR_PARTIAL    => 'El archivo se subió parcialmente',
            UPLOAD_ERR_NO_FILE    => 'No se ha subido ningún archivo',
        ];
        $code = $_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE;
        json_error($errors[$code] ?? 'Error al subir el archivo', 400);
    }

    $file = $_FILES[$field];

    if ($file['size'] > MAX_FILE_SIZE) {
        json_error('El archivo supera los 50 MB', 413);
    }

    // Verificar MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    // Ser flexible con MIMEs (algunos sistemas reportan diferente)
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $ext_mimes = [
        'doc'  => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls'  => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt'  => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'pdf'  => 'application/pdf',
        'odt'  => 'application/vnd.oasis.opendocument.text',
        'ods'  => 'application/vnd.oasis.opendocument.spreadsheet',
        'odp'  => 'application/vnd.oasis.opendocument.presentation',
    ];

    $valid = in_array($mime, $allowed_mimes) || 
             (isset($ext_mimes[$ext]) && in_array($ext_mimes[$ext], $allowed_mimes));

    if (!$valid) {
        json_error('Tipo de archivo no permitido: ' . $ext, 415);
    }

    return $file;
}

function send_file(string $path, string $filename, string $mime): void {
    $data = file_get_contents($path);
    $base64 = base64_encode($data);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'size' => filesize($path),
        'mime' => $mime,
        'data' => $base64,
    ]);
    exit;
}

function json_error(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

function cleanup_dir(string $dir): void {
    if (!is_dir($dir)) return;
    $files = glob($dir . '*');
    foreach ($files as $f) {
        if (is_file($f)) unlink($f);
    }
    @rmdir($dir);
}

function cleanup_old_files(): void {
    $dirs = glob(UPLOAD_DIR . '*/');
    $cutoff = time() - (CLEANUP_MINUTES * 60);
    foreach ($dirs as $dir) {
        if (filemtime($dir) < $cutoff) {
            cleanup_dir($dir);
        }
    }
}
