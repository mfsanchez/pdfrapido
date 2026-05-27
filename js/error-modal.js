/* PDFRápido — Modal de errores con enlace a contacto */
(function() {
  'use strict';

  // Evitar doble carga
  if (window._pdfErrorModalLoaded) return;
  window._pdfErrorModalLoaded = true;

  const CONTACT_URL = '/contacto/';
  const CONTACT_EMAIL = 'admin@pdfrapido.eu';

  function createModal() {
    if (document.getElementById('pdf-error-modal')) return;

    const style = document.createElement('style');
    style.textContent = `
      #pdf-error-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;opacity:0;transition:opacity .25s}
      #pdf-error-overlay.active{opacity:1}
      #pdf-error-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.92);background:#fff;border-radius:16px;padding:32px 28px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.2);z-index:9999;opacity:0;transition:opacity .25s,transform .25s;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'DM Sans',sans-serif}
      #pdf-error-modal.active{opacity:1;transform:translate(-50%,-50%) scale(1)}
      #pdf-error-modal h4{margin:0 0 12px;font-size:18px;color:#1B2A4A;display:flex;align-items:center;gap:10px}
      #pdf-error-modal p{margin:0 0 20px;font-size:15px;color:#4B5563;line-height:1.55;white-space:pre-wrap}
      #pdf-error-modal .btns{display:flex;gap:10px;flex-wrap:wrap}
      #pdf-error-modal a,#pdf-error-modal button{border-radius:10px;padding:11px 18px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;font-family:inherit;border:none;transition:transform .15s}
      #pdf-error-modal a:hover,#pdf-error-modal button:hover{transform:translateY(-1px)}
      #pdf-error-modal .btn-primary{background:#E8453C;color:#fff}
      #pdf-error-modal .btn-secondary{background:#F3F4F6;color:#374151}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'pdf-error-overlay';
    overlay.innerHTML = `
      <div id="pdf-error-modal" role="dialog" aria-modal="true">
        <h4><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8453C" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Ha ocurrido un problema</h4>
        <p id="pdf-error-text"></p>
        <div class="btns">
          <a class="btn-primary" href="${CONTACT_URL}">Reportar incidencia</a>
          <button class="btn-secondary" onclick="window._closePdfError()">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) window._closePdfError();
    });
  }

  window._showPdfError = function(message) {
    createModal();
    const text = document.getElementById('pdf-error-text');
    const overlay = document.getElementById('pdf-error-overlay');
    const modal = document.getElementById('pdf-error-modal');
    if (text) text.textContent = message;
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
  };

  window._closePdfError = function() {
    const overlay = document.getElementById('pdf-error-overlay');
    const modal = document.getElementById('pdf-error-modal');
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
  };

  // Interceptar alert() con mensajes de error
  const originalAlert = window.alert;
  window.alert = function(message) {
    if (typeof message === 'string' && /error|fallo|falló|dañado|protegido|no se pudo|no se pueden|no se cargó|problem/i.test(message)) {
      window._showPdfError(message);
    } else {
      originalAlert.apply(this, arguments);
    }
  };
})();
