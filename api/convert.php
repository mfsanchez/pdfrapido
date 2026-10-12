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
define('OCRMYPDF_BIN', detect_ocrmypdf_bin()); // detección dinámica: las rutas/versiones difieren entre servidores (Oracle 14.x en /usr/local/bin, VPS en /usr/bin)
define('QPDF_BIN', file_exists('/usr/bin/qpdf') ? '/usr/bin/qpdf' : '/usr/local/bin/qpdf');
define('ALLOWED_ORIGINS', ['https://pdfrapido.es', 'https://www.pdfrapido.es']); // Cambiar al dominio real
define('CLEANUP_MINUTES', 10);
define('PDFRAPIDO_DEBUG', false);
define('DEBUG_LOG', '/tmp/pdfrapido_debug.log');

/**
 * Localiza el binario ocrmypdf de forma dinámica.
 * Las rutas y versiones difieren entre servidores (Oracle: 14.x en
 * /usr/local/bin; VPS Nominalia: 13.x/14.x en /usr/bin), por lo que NUNCA se
 * asume una ruta fija. Devuelve '' si no se encuentra (el llamante decide qué
 * hacer; jamás se continúa en silencio cuando hace falta OCR).
 */
function detect_ocrmypdf_bin(): string {
    $found = trim((string)@shell_exec('PATH=/usr/local/bin:/usr/bin command -v ocrmypdf 2>/dev/null'));
    if ($found !== '' && is_executable($found)) {
        return $found;
    }
    foreach (['/usr/local/bin/ocrmypdf', '/usr/bin/ocrmypdf'] as $cand) {
        if (is_executable($cand)) {
            return $cand;
        }
    }
    return '';
}

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

    $filename_original = $file['name'] ?? 'unknown';
    $filesize_bytes    = $file['size'] ?? 0;
    $pdf2docx_output   = [];
    $pdf2docx_code     = -1;
    $lo_output         = [];
    $lo_code           = -1;
    $txt_output        = [];
    $txt_code          = -1;

    // Detectar PDF escaneado y aplicar OCR (ocrmypdf) antes de convertir
    $nota = null;
    $ocr_applied = apply_ocr_if_scanned($input_path);
    if ($ocr_applied) {
        $nota = 'PDF escaneado procesado con OCR. Se ha conservado la estructura del documento. Las imágenes decorativas no se incluyen en el Word.';
        debug_log('OCR applied', [
            'file' => $filename_original,
            'size' => round($filesize_bytes / 1024 / 1024, 2) . ' MB',
        ]);
    }

    if ($format === 'docx' && $ocr_applied) {
        // PDF escaneado ya digitalizado por ocrmypdf. pdf2docx y LibreOffice sólo
        // incrustarían la imagen escaneada — ignoran la capa de texto OCR invisible.
        // El extractor PyMuPDF lee esa capa y reconstruye párrafos y títulos editables.
        $script3 = __DIR__ . '/pdftext_to_docx.py';
        exec(sprintf('timeout 60 python3 %s %s %s 2>&1',
            escapeshellarg($script3),
            escapeshellarg($input_path),
            escapeshellarg($output_path)
        ), $txt_output, $txt_code);
        debug_log('pdftext_to_docx (OCR) attempt', [
            'file'          => $filename_original,
            'exit_code'     => $txt_code,
            'output'        => $txt_output ?: ['(sin salida)'],
            'output_exists' => file_exists($output_path) ? 'yes (' . filesize($output_path) . ' bytes)' : 'no',
        ]);
    } elseif ($format === 'docx') {
        // Para archivos > 8 MB saltar pdf2docx: en PDFs complejos consume el timeout
        // completo sin producir nada, dejando sin margen al fallback de LibreOffice.
        $use_pdf2docx = $filesize_bytes <= 8 * 1024 * 1024;

        if ($use_pdf2docx) {
            $script = __DIR__ . '/pdf2docx_convert.py';
            $cmd = sprintf(
                'timeout 90 python3 %s %s %s 2>&1',
                escapeshellarg($script),
                escapeshellarg($input_path),
                escapeshellarg($output_path)
            );
            exec($cmd, $pdf2docx_output, $pdf2docx_code);
            debug_log('pdf2docx attempt', [
                'file'      => $filename_original,
                'size'      => round($filesize_bytes / 1024 / 1024, 2) . ' MB',
                'exit_code' => $pdf2docx_code,
                'output'    => $pdf2docx_output ?: ['(sin salida)'],
                'output_exists' => file_exists($output_path) ? 'yes (' . filesize($output_path) . ' bytes)' : 'no',
            ]);
        }

        // LibreOffice: para archivos grandes (skip pdf2docx) o como fallback
        if (!$use_pdf2docx || !file_exists($output_path) || filesize($output_path) < 500) {
            // Limpiar procesos LibreOffice colgados de intentos anteriores
            exec('pkill -9 -u apache soffice.bin 2>/dev/null; pkill -9 -u apache oosplash 2>/dev/null; true');
            $lo_profile = 'file://' . $workdir . 'lo_profile';
            $cmd = sprintf(
                'timeout --kill-after=5 90 env HOME=/tmp DCONF_PROFILE=/dev/null %s --headless --norestore'
                . ' -env:UserInstallation=%s --infilter="writer_pdf_import"'
                . ' --convert-to docx --outdir %s %s 2>&1',
                escapeshellarg(LIBREOFFICE_BIN),
                escapeshellarg($lo_profile),
                escapeshellarg($workdir),
                escapeshellarg($input_path)
            );
            exec($cmd, $lo_output, $lo_code);
            debug_log('LibreOffice attempt', [
                'file'      => $filename_original,
                'size'      => round($filesize_bytes / 1024 / 1024, 2) . ' MB',
                'reason'    => $use_pdf2docx ? 'fallback' : 'large-file-direct',
                'exit_code' => $lo_code,
                'output'    => $lo_output ?: ['(sin salida)'],
                'output_exists' => file_exists($output_path) ? 'yes (' . filesize($output_path) . ' bytes)' : 'no',
            ]);
        }
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
        exec($cmd, $lo_output, $lo_code);
        debug_log('LibreOffice conversion', [
            'file'      => $filename_original,
            'format'    => $format,
            'size'      => round($filesize_bytes / 1024 / 1024, 2) . ' MB',
            'exit_code' => $lo_code,
            'output'    => $lo_output ?: ['(sin salida)'],
            'output_exists' => file_exists($output_path) ? 'yes (' . filesize($output_path) . ' bytes)' : 'no',
        ]);
    }

    // Tercer motor: pdftotext + python-docx para PDFs nativos con capa de texto.
    // Se activa solo para DOCX cuando pdf2docx y LibreOffice han fallado.
    // Los PDF escaneados (OCR) ya pasaron por este extractor más arriba.
    if ($format === 'docx' && !$ocr_applied && (!file_exists($output_path) || filesize($output_path) < 500)) {
        $txt_wc = [];
        exec('pdftotext ' . escapeshellarg($input_path) . ' - 2>/dev/null | wc -c', $txt_wc);
        if ((int)($txt_wc[0] ?? 0) >= 100) {
            $script3 = __DIR__ . '/pdftext_to_docx.py';
            exec(sprintf('timeout 30 python3 %s %s %s 2>&1',
                escapeshellarg($script3),
                escapeshellarg($input_path),
                escapeshellarg($output_path)
            ), $txt_output, $txt_code);
            debug_log('pdftext_to_docx attempt', [
                'file'         => $filename_original,
                'exit_code'    => $txt_code,
                'output'       => $txt_output ?: ['(sin salida)'],
                'output_exists' => file_exists($output_path) ? 'yes (' . filesize($output_path) . ' bytes)' : 'no',
            ]);
            if ($nota === null && in_array('OCR_MODE', $txt_output)) {
                $nota = 'PDF escaneado detectado. Se ha extraído el texto limpio. El formato original no se conserva pero el contenido es totalmente editable.';
            }
        }
    }

    if (!file_exists($output_path) || filesize($output_path) < 500) {
        $all_output = array_merge($pdf2docx_output, $lo_output, $txt_output);
        $combined   = implode("\n", $all_output);
        $debug_info = [
            'file'          => $filename_original,
            'size_mb'       => round($filesize_bytes / 1024 / 1024, 2),
            'ocr_applied'   => $ocr_applied ? 'yes' : 'no',
            'pdf2docx_code' => $pdf2docx_code,
            'pdf2docx_out'  => implode("\n", $pdf2docx_output),
            'lo_code'       => $lo_code,
            'lo_out'        => implode("\n", $lo_output),
            'txt_code'      => $txt_code,
            'txt_out'       => implode("\n", $txt_output),
        ];
        cleanup_dir($workdir);
        if ($pdf2docx_code === 124 || $lo_code === 124 || $txt_code === 124) {
            debug_log('ERROR: timeout', $debug_info);
            $timeout_msg = $ocr_applied
                ? 'El PDF es muy extenso para procesarlo con OCR. Intenta con menos páginas.'
                : 'La conversión tardó demasiado. Intenta con un PDF más pequeño o con menos páginas.';
            json_error($timeout_msg, 422, $debug_info);
        }
        if (stripos($combined, 'password') !== false || stripos($combined, 'encrypt') !== false) {
            debug_log('ERROR: encrypted PDF', $debug_info);
            json_error('El PDF está protegido con contraseña. Desbloquéalo primero en /desbloquear-pdf/.', 422, $debug_info);
        }
        debug_log('ERROR: all engines failed', $debug_info);
        json_error('Error en la conversión. El PDF podría estar protegido o tener un formato incompatible.', 422, $debug_info);
    }

    $mime_map = [
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'odt'  => 'application/vnd.oasis.opendocument.text',
        'ods'  => 'application/vnd.oasis.opendocument.spreadsheet',
        'odp'  => 'application/vnd.oasis.opendocument.presentation',
    ];

    send_file($output_path, pathinfo($file['name'], PATHINFO_FILENAME) . '.' . $format, $mime_map[$format], $nota);
    cleanup_dir($workdir);
}

function handle_html_to_pdf() {
    $url = trim($_POST['url'] ?? '');
    if ($url === '') json_error('URL no válida', 400);

    // Descarga validando cada salto (sin SSRF) y HTML sin recursos externos
    try {
        [$html_content, $tipo] = urlseg_descargar($url);
        $html_content = urlseg_limpiar_html($html_content, $tipo);
    } catch (RuntimeException $e) {
        json_error($e->getMessage(), 422);
    }

    $id = uniqid('html_');
    $workdir = UPLOAD_DIR . $id . '/';
    mkdir($workdir, 0755, true);
    // send_file() y json_error() hacen exit; rm -r también borra lo_profile/
    register_shutdown_function(function () use ($workdir) { exec('rm -rf ' . escapeshellarg($workdir)); });

    $html_path = $workdir . 'page.html';
    file_put_contents($html_path, $html_content);

    $lo_profile = 'file://' . $workdir . 'lo_profile';
    $pdf_path = $workdir . 'page.pdf';
    // Sin red (unshare -rn) si se puede; si así no sale el PDF, se reintenta con red:
    // el HTML ya no tiene referencias externas
    foreach (array_unique([urlseg_sin_red(), '']) as $prefijo) {
        $cmd = sprintf(
            'HOME=/tmp DCONF_PROFILE=/dev/null timeout 60 %s%s --headless --norestore -env:UserInstallation=%s --convert-to pdf --outdir %s %s 2>&1',
            $prefijo,
            escapeshellarg(LIBREOFFICE_BIN),
            escapeshellarg($lo_profile),
            escapeshellarg($workdir),
            escapeshellarg($html_path)
        );
        exec($cmd, $output, $return_code);
        if (file_exists($pdf_path)) break;
        if ($prefijo !== '') error_log('html-to-pdf: LibreOffice sin red no generó PDF (rc=' . $return_code . '); reintento con red');
    }

    if (!file_exists($pdf_path)) {
        json_error('Error al convertir la página web', 422);
    }

    $domain = parse_url($url, PHP_URL_HOST) ?? 'pagina';
    $domain = preg_replace('/[^A-Za-z0-9.-]/', '', $domain) ?: 'pagina';
    send_file($pdf_path, $domain . '.pdf', 'application/pdf');
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

    // qpdf cubre todos los esquemas de cifrado estándar (RC4 40/128, AES-128, AES-256),
    // un superconjunto de lo que manejaba el antiguo fallback pdftk (ausente en ambos
    // servidores). Si qpdf falla, la contraseña es incorrecta o el archivo es inválido.
    if ($return_code !== 0 || !file_exists($output_path)) {
        cleanup_dir($workdir);
        json_error('No se pudo desbloquear el PDF. Verifica la contraseña.', 422);
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

function send_file(string $path, string $filename, string $mime, ?string $nota = null): void {
    $data = file_get_contents($path);
    $base64 = base64_encode($data);

    header('Content-Type: application/json');
    $payload = [
        'success'  => true,
        'filename' => $filename,
        'size'     => filesize($path),
        'mime'     => $mime,
        'data'     => $base64,
    ];
    if ($nota !== null) {
        $payload['nota'] = $nota;
    }
    echo json_encode($payload);
    exit;
}

function apply_ocr_if_scanned(string $input_path): bool {
    // Contar caracteres extraíbles; si son < 100 el PDF es probablemente escaneado
    $wc = [];
    exec('pdftotext ' . escapeshellarg($input_path) . ' - 2>/dev/null | wc -c', $wc);
    $chars = (int)($wc[0] ?? 0);
    if ($chars >= 100) return false;

    // PDF escaneado: el OCR es OBLIGATORIO. Si ocrmypdf no está disponible en
    // este servidor, fallar de forma explícita (log + 503) en vez de devolver
    // un Word sin capa de texto (el fallo silencioso que rompía el VPS).
    if (OCRMYPDF_BIN === '' || !is_executable(OCRMYPDF_BIN)) {
        error_log('[PDFRAPIDO] OCR no disponible: binario ocrmypdf no encontrado '
            . '(command -v + rutas conocidas /usr/local/bin y /usr/bin fallaron). '
            . 'PDF escaneado rechazado en ' . php_uname('n') . '.');
        json_error('El servicio OCR no está disponible temporalmente en este servidor. '
            . 'Vuelve a intentarlo en unos minutos.', 503);
    }

    // PDF escaneado — incrustar capa de texto con ocrmypdf (tesseract spa+eng).
    // El PDF resultante conserva el layout original, de modo que pdf2docx
    // puede después extraer negritas, tamaños de fuente y estructura.
    $workdir    = dirname($input_path);
    $ocr_output = $workdir . '/ocr_output.pdf';
    $ocr_cmd = sprintf(
        'timeout --kill-after=10 180 env HOME=/tmp TMPDIR=%s PATH=/usr/local/bin:/usr/bin %s'
        . ' --force-ocr --optimize 0 --output-type pdf --language spa+eng %s %s 2>&1',
        escapeshellarg($workdir),
        escapeshellarg(OCRMYPDF_BIN),
        escapeshellarg($input_path),
        escapeshellarg($ocr_output)
    );
    $ocr_out  = [];
    $ocr_code = -1;
    exec($ocr_cmd, $ocr_out, $ocr_code);
    debug_log('ocrmypdf attempt', [
        'exit_code'     => $ocr_code,
        'output'        => $ocr_out ?: ['(sin salida)'],
        'output_exists' => file_exists($ocr_output) ? 'yes (' . filesize($ocr_output) . ' bytes)' : 'no',
    ]);

    if ($ocr_code === 0 && file_exists($ocr_output) && filesize($ocr_output) > 500) {
        rename($ocr_output, $input_path);
        return true;
    }
    return false;
}

function debug_log(string $label, array $context = []): void {
    if (!PDFRAPIDO_DEBUG) return;
    $line = "[PDFRAPIDO] $label";
    foreach ($context as $k => $v) {
        $val = is_array($v) ? implode(' | ', $v) : $v;
        $line .= " | $k=$val";
    }
    error_log($line);
}

function json_error(string $message, int $code = 400, array $debug = []): void {
    http_response_code($code);
    $payload = ['success' => false, 'error' => $message];
    if (PDFRAPIDO_DEBUG && !empty($debug)) {
        $payload['debug'] = $debug;
    }
    echo json_encode($payload);
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

// --- url_segura: inicio (html-to-pdf sin SSRF; se prueba con test-url-segura.php) ---
/**
 * Descarga de URLs de usuario sin SSRF (html-to-pdf).
 *
 * - Solo http/https, puertos 80/443, sin usuario:contraseña en la URL.
 * - Se resuelve el DNS y se rechaza la URL si CUALQUIER IP no es pública
 *   (privadas, loopback, link-local/metadatos, CGNAT/Tailscale, multicast,
 *   reservadas, documentación e IPv6 equivalentes, incluidas las IPv4
 *   embebidas en IPv6).
 * - curl se conecta solo a las IP ya validadas (CURLOPT_RESOLVE), así que un
 *   DNS que cambie entre la comprobación y la conexión no sirve de nada.
 * - Las redirecciones no las sigue curl: se revalida cada salto (máx. 3).
 * - Tiempo y tamaño máximos.
 * - El HTML se limpia de todo lo que LibreOffice descargaría por su cuenta
 *   (<link>, <img>, <iframe>, url() en CSS...), y LibreOffice se ejecuta sin
 *   red cuando el sistema lo permite (unshare -rn).
 */

// define() y no const: el enrutado de arriba hace exit antes de llegar aquí, y las
// funciones se declaran al compilar pero las constantes solo al ejecutarse.
function urlseg_conf(string $k) {
    static $c = ['MAX_BYTES' => 5 * 1024 * 1024, 'MAX_SALTOS' => 3, 'TIMEOUT_TOTAL' => 15,
                 'TIMEOUT_CONEX' => 5, 'PUERTOS' => [80, 443]];
    return $c[$k];
}

/** IPv4 o IPv6 que no son Internet pública. */
function urlseg_ip_bloqueada(string $ip): bool {
    $bin = @inet_pton($ip);
    if ($bin === false) return true;

    if (strlen($bin) === 4) {
        static $v4 = [
            '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16',
            '172.16.0.0/12', '192.0.0.0/24', '192.0.2.0/24', '192.88.99.0/24', '192.168.0.0/16',
            '198.18.0.0/15', '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4',
        ];
        foreach ($v4 as $cidr) if (urlseg_en_red($bin, $cidr)) return true;
        return false;
    }

    // IPv6 con una IPv4 dentro: se juzga por la IPv4
    $v4map = [
        '::ffff:0:0/96',    // IPv4 mapeada
        '::/96',            // IPv4 compatible (obsoleta)
        '64:ff9b::/96',     // NAT64
        '64:ff9b:1::/48',   // NAT64 local
    ];
    foreach ($v4map as $cidr) {
        if (urlseg_en_red($bin, $cidr)) {
            if ($cidr === '::/96' && substr($bin, 12) === "\0\0\0\0") return true; // ::
            return urlseg_ip_bloqueada(inet_ntop(substr($bin, 12)));
        }
    }
    static $v6 = [
        '::1/128', '100::/64', '2001::/23', '2001:db8::/32', '2002::/16',
        'fc00::/7',   // ULA (incluida la de Tailscale, fd7a:115c:a1e0::/48)
        'fe80::/10', 'fec0::/10', 'ff00::/8',
    ];
    foreach ($v6 as $cidr) if (urlseg_en_red($bin, $cidr)) return true;
    // Fuera de 2000::/3 no hay unicast global
    return (ord($bin[0]) & 0xE0) !== 0x20;
}

function urlseg_en_red(string $bin, string $cidr): bool {
    [$red, $bits] = explode('/', $cidr);
    $rbin = inet_pton($red);
    if (strlen($rbin) !== strlen($bin)) return false;
    $bits = (int)$bits;
    $bytes = intdiv($bits, 8);
    if (substr($bin, 0, $bytes) !== substr($rbin, 0, $bytes)) return false;
    $resto = $bits % 8;
    if ($resto === 0) return true;
    $mask = (0xFF << (8 - $resto)) & 0xFF;
    return (ord($bin[$bytes]) & $mask) === (ord($rbin[$bytes]) & $mask);
}

/** IPs a las que apunta $host (A y AAAA). Vacío si no resuelve. */
function urlseg_resolver(string $host): array {
    $h = trim($host, '[]');
    if (filter_var($h, FILTER_VALIDATE_IP)) return [$h];
    $ips = [];
    foreach ([DNS_A, DNS_AAAA] as $tipo) {
        $r = @dns_get_record($h, $tipo);
        if (!$r) continue;
        foreach ($r as $rr) {
            if (isset($rr['ip'])) $ips[] = $rr['ip'];
            if (isset($rr['ipv6'])) $ips[] = $rr['ipv6'];
        }
    }
    return array_values(array_unique($ips));
}

/**
 * Comprueba una URL. Devuelve [host, puerto, ips] o lanza RuntimeException
 * con un mensaje apto para el usuario.
 */
function urlseg_validar(string $url): array {
    if (strlen($url) > 2048 || !filter_var($url, FILTER_VALIDATE_URL)) {
        throw new RuntimeException('URL no válida');
    }
    $p = parse_url($url);
    $scheme = strtolower($p['scheme'] ?? '');
    if (!in_array($scheme, ['http', 'https'], true)) {
        throw new RuntimeException('Solo se permiten URLs HTTP/HTTPS');
    }
    if (isset($p['user']) || isset($p['pass'])) {
        throw new RuntimeException('La URL no puede incluir usuario ni contraseña');
    }
    $host = $p['host'] ?? '';
    if ($host === '') throw new RuntimeException('URL no válida');
    $puerto = $p['port'] ?? ($scheme === 'https' ? 443 : 80);
    if (!in_array($puerto, urlseg_conf('PUERTOS'), true)) {
        throw new RuntimeException('Solo se admiten URLs en los puertos habituales (80 y 443)');
    }
    $ips = urlseg_resolver($host);
    if (!$ips) throw new RuntimeException('No se pudo acceder a la URL');
    foreach ($ips as $ip) {
        if (urlseg_ip_bloqueada($ip)) {
            throw new RuntimeException('Esa dirección no es una web pública');
        }
    }
    return [trim($host, '[]'), $puerto, $ips];
}

/** Resuelve un Location relativo respecto a la URL actual. */
function urlseg_absoluta(string $base, string $loc): string {
    if (preg_match('#^[a-z][a-z0-9+.-]*:#i', $loc)) return $loc;
    $b = parse_url($base);
    $origen = $b['scheme'] . '://' . (strpos($b['host'], ':') !== false ? '[' . $b['host'] . ']' : $b['host'])
            . (isset($b['port']) ? ':' . $b['port'] : '');
    if (strpos($loc, '//') === 0) return $b['scheme'] . ':' . $loc;
    if (strpos($loc, '/') === 0) return $origen . $loc;
    $dir = preg_replace('#/[^/]*$#', '/', $b['path'] ?? '/');
    return $origen . $dir . $loc;
}

/**
 * Descarga el HTML de una URL pública. Devuelve [html, content_type].
 * Lanza RuntimeException con un mensaje para el usuario.
 */
function urlseg_descargar(string $url): array {
    $inicio = microtime(true);
    for ($salto = 0; $salto <= urlseg_conf('MAX_SALTOS'); $salto++) {
        [$host, $puerto, $ips] = urlseg_validar($url);
        $restante = urlseg_conf('TIMEOUT_TOTAL') - (microtime(true) - $inicio);
        if ($restante <= 1) throw new RuntimeException('La página tardó demasiado en responder');

        $fijar = array_map(fn($ip) => strpos($ip, ':') !== false ? "[$ip]" : $ip, $ips);
        $cuerpo = '';
        $demasiado = false;
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RESOLVE         => ["$host:$puerto:" . implode(',', $fijar)],
            CURLOPT_FOLLOWLOCATION  => false,
            CURLOPT_PROTOCOLS       => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_NOPROXY         => '*',
            CURLOPT_CONNECTTIMEOUT  => urlseg_conf('TIMEOUT_CONEX'),
            CURLOPT_TIMEOUT         => (int)ceil($restante),
            CURLOPT_USERAGENT       => 'PDFRápido Bot/1.0',
            CURLOPT_HTTPHEADER      => ['Accept: text/html,application/xhtml+xml'],
            CURLOPT_ENCODING        => '',
            CURLOPT_HEADER          => false,
            CURLOPT_WRITEFUNCTION   => function ($ch, $trozo) use (&$cuerpo, &$demasiado) {
                if (strlen($cuerpo) + strlen($trozo) > urlseg_conf('MAX_BYTES')) { $demasiado = true; return 0; }
                $cuerpo .= $trozo;
                return strlen($trozo);
            },
        ]);
        $ok = curl_exec($ch);
        $codigo = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $tipo = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $destino = (string)curl_getinfo($ch, CURLINFO_REDIRECT_URL);
        curl_close($ch);

        if ($demasiado) throw new RuntimeException('La página es demasiado grande (máximo 5 MB de HTML)');
        if ($ok === false) throw new RuntimeException('No se pudo acceder a la URL');
        if ($codigo >= 300 && $codigo < 400 && $destino !== '') {
            $url = urlseg_absoluta($url, $destino);
            continue;
        }
        if ($codigo < 200 || $codigo >= 300) throw new RuntimeException('No se pudo acceder a la URL');
        if ($tipo !== '' && !preg_match('#^\s*(text/html|application/xhtml\+xml)#i', $tipo)) {
            throw new RuntimeException('La URL no es una página web (HTML)');
        }
        return [$cuerpo, $tipo];
    }
    throw new RuntimeException('Demasiadas redirecciones');
}

/**
 * Quita del HTML todo lo que LibreOffice podría descargar por su cuenta.
 * Los enlaces <a href> se conservan (no se descargan al convertir).
 */
function urlseg_limpiar_html(string $html, string $tipo): string {
    $charset = '';
    if (preg_match('/charset=["\']?([\w-]+)/i', $tipo, $m)) $charset = $m[1];
    elseif (preg_match('/<meta[^>]+charset=["\']?([\w-]+)/i', substr($html, 0, 4096), $m)) $charset = $m[1];
    if ($charset !== '' && strcasecmp($charset, 'utf-8') !== 0 && strcasecmp($charset, 'utf8') !== 0) {
        $conv = @mb_convert_encoding($html, 'UTF-8', $charset);
        if ($conv !== false && $conv !== '') $html = $conv;
    }

    // Todo lo no ASCII como entidades: así el charset que declare la página ya no importa
    if (!mb_check_encoding($html, 'UTF-8')) $html = mb_convert_encoding($html, 'UTF-8', 'Windows-1252');
    $html = mb_encode_numericentity($html, [0x80, 0x10FFFF, 0, 0x1FFFFF], 'UTF-8');

    $doc = new DOMDocument();
    $prev = libxml_use_internal_errors(true);
    $doc->loadHTML($html, LIBXML_NONET | LIBXML_COMPACT | LIBXML_PARSEHUGE);
    libxml_clear_errors();
    libxml_use_internal_errors($prev);
    $xp = new DOMXPath($doc);

    // Fuera del todo: no tienen contenido que leer
    $fuera = '//script|//link|//base|//meta[@http-equiv]|//meta[@charset]';
    foreach (iterator_to_array($xp->query($fuera)) as $n) $n->parentNode->removeChild($n);
    // Se desenvuelven: libxml (HTML4) no siempre los cierra bien y pueden contener el resto
    // de la página; se quita la etiqueta y se conservan los hijos (sus URL se limpian abajo)
    // (embed, source, track y frame son vacíos en HTML5, pero libxml les mete dentro lo que sigue)
    $envoltorios = '//iframe|//object|//applet|//noscript|//frameset|//frame|//audio|//video|//embed|//source|//track'
                 . '|//*[local-name()="image"]|//*[local-name()="use"]|//*[local-name()="feImage"]';
    foreach (array_reverse(iterator_to_array($xp->query($envoltorios))) as $n) {
        while ($n->firstChild) $n->parentNode->insertBefore($n->firstChild, $n);
        $n->parentNode->removeChild($n);
    }

    // Imágenes externas: se sustituyen por su texto alternativo
    foreach (iterator_to_array($xp->query('//img|//input[@type="image"]')) as $img) {
        $src = trim($img->getAttribute('src'));
        if (stripos($src, 'data:image/') === 0) { $img->removeAttribute('srcset'); continue; }
        $alt = trim($img->getAttribute('alt'));
        if ($alt !== '') $img->parentNode->replaceChild($doc->createTextNode("[$alt]"), $img);
        else $img->parentNode->removeChild($img);
    }

    $attrsUrl = ['src', 'srcset', 'background', 'poster', 'data', 'lowsrc', 'dynsrc', 'longdesc',
                 'action', 'formaction', 'xlink:href', 'cite', 'codebase', 'archive', 'manifest', 'ping'];
    foreach ($xp->query('//*') as $el) {
        foreach ($attrsUrl as $a) {
            if (!$el->hasAttribute($a)) continue;
            if ($a === 'src' && $el->nodeName === 'img' && stripos(trim($el->getAttribute('src')), 'data:image/') === 0) continue;
            $el->removeAttribute($a);
        }
        if ($el->nodeName !== 'a' && $el->nodeName !== 'area' && $el->hasAttribute('href')) $el->removeAttribute('href');
        if ($el->hasAttribute('style') && preg_match('/url\s*\(|@import|expression\s*\(|image-set|-webkit-image/i', $el->getAttribute('style'))) {
            $el->removeAttribute('style');
        }
        if ($el->nodeName === 'a' && preg_match('#^\s*(javascript|file|data|vbscript):#i', $el->getAttribute('href'))) {
            $el->removeAttribute('href');
        }
    }
    foreach (iterator_to_array($xp->query('//style')) as $st) {
        $css = preg_replace('/@import[^;]*;?/i', '', $st->textContent);
        $css = preg_replace('/url\s*\([^)]*\)/i', 'none', $css);
        $css = preg_replace('/(image-set|-webkit-image-set)\s*\([^)]*\)/i', 'none', $css);
        $st->textContent = $css;
    }

    $out = $doc->saveHTML();
    $meta = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
    if (stripos($out, '<head>') !== false) return preg_replace('/<head>/i', '<head>' . $meta, $out, 1);
    return $meta . $out;
}

/** Prefijo para ejecutar un comando sin red, si el sistema lo permite. */
function urlseg_sin_red(): string {
    static $pref = null;
    if ($pref === null) {
        exec('unshare -rn true 2>/dev/null', $o, $rc);
        $pref = $rc === 0 ? 'unshare -rn ' : '';
        if ($pref === '') error_log('html-to-pdf: unshare -rn no disponible; LibreOffice se ejecuta con red (HTML ya limpiado)');
    }
    return $pref;
}
// --- url_segura: fin ---
