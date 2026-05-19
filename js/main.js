/* ═══════════════════════════════════════════
   PDFRápido — JS Global
   dev: MF Sanchez
   ═══════════════════════════════════════════ */

// ── NAV SCROLL EFFECT ──
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 20);
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Card reveal on scroll (index page)
    const grids = document.querySelectorAll('.tools-grid');
    if (grids.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const cards = entry.target.querySelectorAll('.tool-card');
                    cards.forEach((card, j) => {
                        card.style.animationDelay = `${j * 0.06}s`;
                        card.classList.add('visible');
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        grids.forEach(grid => observer.observe(grid));
    }
});

// ── DRAG & DROP HELPERS ──
function setupDropZone(zoneEl, fileInputEl, onFiles) {
    if (!zoneEl) return;

    zoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        zoneEl.classList.add('dragover');
    });

    zoneEl.addEventListener('dragleave', () => {
        zoneEl.classList.remove('dragover');
    });

    zoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        zoneEl.classList.remove('dragover');
        const files = [...e.dataTransfer.files];
        if (files.length) onFiles(files);
    });

    if (fileInputEl) {
        fileInputEl.addEventListener('change', (e) => {
            const files = [...e.target.files];
            if (files.length) onFiles(files);
        });
    }
}

// ── PROGRESS RING ──
function updateProgressRing(circleEl, pctEl, labelEl, pct, label) {
    const circumference = 2 * Math.PI * 44; // r=44
    if (circleEl) {
        circleEl.style.strokeDashoffset = circumference - (pct / 100) * circumference;
    }
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (labelEl && label) labelEl.textContent = label;
}

// ── FILE SIZE FORMATTING ──
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatFileSizeParts(bytes) {
    if (bytes < 1024) return { val: bytes.toString(), unit: 'B' };
    if (bytes < 1024 * 1024) return { val: (bytes / 1024).toFixed(1), unit: 'KB' };
    return { val: (bytes / (1024 * 1024)).toFixed(1), unit: 'MB' };
}

// ── DOWNLOAD BLOB ──
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── API CONVERSION (backend tools) ──
const API_BASE = '/api/convert.php';

async function apiConvert(file, action, extraData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(extraData).forEach(([k, v]) => formData.append(k, v));

    const response = await fetch(`${API_BASE}?action=${action}`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Error en la conversión');
    }

    // Decode base64 to Blob
    const byteChars = atob(result.data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
    }

    return {
        blob: new Blob([byteArray], { type: result.mime }),
        filename: result.filename,
        size: result.size,
    };
}

// ── PAGE RANGE PARSER ──
function parsePageRange(str, maxPage) {
    const pages = new Set();
    str.split(',').forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            const [a, b] = part.split('-').map(Number);
            if (!isNaN(a) && !isNaN(b)) {
                for (let i = Math.max(1, a); i <= Math.min(maxPage, b); i++) {
                    pages.add(i);
                }
            }
        } else {
            const n = parseInt(part);
            if (!isNaN(n) && n >= 1 && n <= maxPage) pages.add(n);
        }
    });
    return [...pages].sort((a, b) => a - b);
}

// ── SHOW/HIDE HELPERS ──
function showStep(id) {
    document.getElementById(id)?.classList.add('active');
}
function hideStep(id) {
    document.getElementById(id)?.classList.remove('active');
}
function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}
function hideElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}
