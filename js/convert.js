/**
 * PDFRápido - Módulo compartido para conversiones con backend
 * dev: MF Sanchez
 */
const API_BASE = '/api/convert.php';

const CONVERSION_STAGES = [
    { pct: 8,  label: 'Subiendo archivo...' },
    { pct: 22, label: 'Iniciando LibreOffice...' },
    { pct: 55, label: 'Convirtiendo documento...' },
    { pct: 80, label: 'Optimizando PDF...' },
    { pct: 92, label: 'Casi listo...' },
];

async function convertFile(file, action, extraData = {}, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(extraData).forEach(([k, v]) => formData.append(k, v));

    // Animated stage progress while fetch is pending
    let stageIdx = 0;
    let progressTimer = null;
    if (onProgress) {
        // Two rAF frames ensure the browser paints width:0% before animating to first stage
        requestAnimationFrame(() => requestAnimationFrame(() => {
            onProgress(CONVERSION_STAGES[0].pct, CONVERSION_STAGES[0].label);
        }));
        progressTimer = setInterval(() => {
            stageIdx = Math.min(stageIdx + 1, CONVERSION_STAGES.length - 1);
            onProgress(CONVERSION_STAGES[stageIdx].pct, CONVERSION_STAGES[stageIdx].label);
        }, 2500);
    }

    try {
        const abortController = new AbortController();
        const abortTimeout = setTimeout(() => abortController.abort(), 330000);
        const response = await fetch(`${API_BASE}?action=${action}`, {
            method: 'POST',
            body: formData,
            signal: abortController.signal,
        });
        clearTimeout(abortTimeout);

        if (progressTimer) clearInterval(progressTimer);
        if (onProgress) onProgress(96, 'Procesando resultado...');

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Error en la conversión');
        }

        if (onProgress) onProgress(100, '¡Listo!');

        // Decodificar base64 a Blob
        const byteChars = atob(result.data);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: result.mime });

        return { blob, filename: result.filename, size: result.size, nota: result.nota || null };

    } catch (err) {
        if (progressTimer) clearInterval(progressTimer);
        throw err;
    }
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}
