/* ═══════════════════════════════════════════
   PDFRápido — Banner de Cookies (RGPD/EU)
   dev: MF Sanchez
   ═══════════════════════════════════════════ */

(function() {
    if (localStorage.getItem('cookie_consent')) return;

    var css = document.createElement('style');
    css.textContent = '#ck-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1B2A4A;color:#fff;padding:18px 24px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;font-family:"DM Sans",-apple-system,sans-serif;font-size:14px;line-height:1.5;box-shadow:0 -4px 20px rgba(0,0,0,.15);animation:ckSlide .4s ease-out}#ck-banner a{color:#F5913E;text-decoration:underline}#ck-banner .ck-text{flex:1;min-width:260px}#ck-banner .ck-btns{display:flex;gap:10px;flex-shrink:0}#ck-banner button{padding:10px 22px;border-radius:8px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;border:none}#ck-banner .ck-accept{background:#34A853;color:#fff}#ck-banner .ck-accept:hover{background:#1E7E34}#ck-banner .ck-reject{background:transparent;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.25)}#ck-banner .ck-reject:hover{border-color:rgba(255,255,255,.5);color:#fff}@keyframes ckSlide{from{transform:translateY(100%)}to{transform:translateY(0)}}@media(max-width:640px){#ck-banner{flex-direction:column;text-align:center;padding:16px}#ck-banner .ck-btns{width:100%;justify-content:center}}';
    document.head.appendChild(css);

    var banner = document.createElement('div');
    banner.id = 'ck-banner';
    banner.innerHTML = '<div class="ck-text">Utilizamos cookies propias y de terceros para analizar el tráfico y mostrar publicidad. Consulta nuestra <a href="/cookies/">política de cookies</a>.</div><div class="ck-btns"><button class="ck-accept" onclick="ckAccept()">Aceptar</button><button class="ck-reject" onclick="ckReject()">Rechazar</button></div>';
    document.body.appendChild(banner);

    window.ckAccept = function() {
        localStorage.setItem('cookie_consent', 'accepted');
        banner.style.animation = 'none';
        banner.style.transform = 'translateY(100%)';
        banner.style.transition = 'transform .3s ease';
        setTimeout(function() { banner.remove(); }, 300);
    };

    window.ckReject = function() {
        localStorage.setItem('cookie_consent', 'rejected');
        banner.style.animation = 'none';
        banner.style.transform = 'translateY(100%)';
        banner.style.transition = 'transform .3s ease';
        setTimeout(function() { banner.remove(); }, 300);

        // Desactivar Google Analytics
        window['ga-disable-G-93B5VKXW7W'] = true;

        // Eliminar cookies existentes de GA y AdSense
        document.cookie.split(';').forEach(function(c) {
            var name = c.split('=')[0].trim();
            if (name.startsWith('_ga') || name.startsWith('_gid') || name.startsWith('__g')) {
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + location.hostname;
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            }
        });
    };
})();
