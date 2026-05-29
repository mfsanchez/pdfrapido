/* ═══════════════════════════════════════════
   PDFRápido — Consentimiento de Cookies (RGPD/EU + Google AdSense)
   dev: MF Sanchez  |  v2.0  |  2026-05-29
   ═══════════════════════════════════════════ */

(function () {
    'use strict';

    var STORAGE_KEY = 'cookie_consent_v2';
    var STORAGE_DATE = 'cookie_consent_date';
    var GA_ID = 'G-93B5VKXW7W';
    var ADSENSE_CLIENT = 'ca-pub-7923775430516782';

    function getConsent() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function setConsent(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
            localStorage.setItem(STORAGE_DATE, new Date().toISOString());
        } catch (e) {}
    }

    function removeBanner() {
        var banner = document.getElementById('ck-banner');
        if (!banner) return;
        banner.style.animation = 'none';
        banner.style.transform = 'translateY(100%)';
        banner.style.transition = 'transform .35s ease';
        setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 350);
    }

    function deleteGoogleCookies() {
        var domains = ['', '.' + location.hostname, location.hostname];
        var paths = ['/', ''];
        document.cookie.split(';').forEach(function (c) {
            var name = c.split('=')[0].trim();
            if (/^(_ga|_gid|_gat|__g|IDE|NID|CONSENT)/.test(name)) {
                domains.forEach(function (dom) {
                    paths.forEach(function (pth) {
                        var cookieStr = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=' + pth;
                        if (dom) cookieStr += ';domain=' + dom;
                        document.cookie = cookieStr;
                    });
                });
            }
        });
    }

    function loadScript(src, attrs) {
        var s = document.createElement('script');
        s.async = true;
        s.src = src;
        if (attrs) {
            Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
        }
        var first = document.getElementsByTagName('script')[0];
        if (first && first.parentNode) {
            first.parentNode.insertBefore(s, first);
        } else {
            document.head.appendChild(s);
        }
    }

    function loadGA() {
        if (window.__gaLoaded) return;
        window.__gaLoaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', GA_ID, { 'anonymize_ip': true });
        loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
    }

    function loadAdSense() {
        if (window.__adsenseLoaded) return;
        window.__adsenseLoaded = true;
        loadScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT, {
            crossorigin: 'anonymous'
        });
    }

    function enableServices() {
        loadGA();
        loadAdSense();
    }

    function disableServices() {
        window['ga-disable-' + GA_ID] = true;
        deleteGoogleCookies();
    }

    function buildBanner() {
        if (document.getElementById('ck-banner')) return;

        var css = document.createElement('style');
        css.textContent = '#ck-banner{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1B2A4A;color:#fff;padding:18px 24px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;font-family:"DM Sans",-apple-system,sans-serif;font-size:14px;line-height:1.55;box-shadow:0 -4px 24px rgba(0,0,0,.25);animation:ckSlideUp .45s ease-out}#ck-banner a{color:#F5913E;text-decoration:underline}#ck-banner a:hover{color:#ffad66}#ck-banner .ck-text{flex:1;min-width:260px}#ck-banner .ck-text strong{display:block;margin-bottom:4px;font-size:15px}#ck-banner .ck-btns{display:flex;gap:10px;flex-shrink:0}#ck-banner button{padding:10px 22px;border-radius:8px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;border:none;min-width:120px}#ck-banner .ck-accept{background:#34A853;color:#fff}#ck-banner .ck-accept:hover{background:#1E7E34;transform:translateY(-1px)}#ck-banner .ck-reject{background:transparent;color:rgba(255,255,255,.85);border:2px solid rgba(255,255,255,.35)}#ck-banner .ck-reject:hover{border-color:rgba(255,255,255,.7);color:#fff;transform:translateY(-1px)}@keyframes ckSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@media(max-width:640px){#ck-banner{flex-direction:column;text-align:center;padding:16px}#ck-banner .ck-btns{width:100%;justify-content:center;flex-wrap:wrap}}';
        document.head.appendChild(css);

        var banner = document.createElement('div');
        banner.id = 'ck-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-label', 'Consentimiento de cookies');
        banner.innerHTML =
            '<div class="ck-text">' +
                '<strong>🍪 Usamos cookies</strong>' +
                'Utilizamos cookies técnicas necesarias para el funcionamiento, y cookies de <strong>Google Analytics</strong> y <strong>Google AdSense</strong> para analizar el tráfico y mostrar publicidad personalizada. ' +
                '<a href="/cookies/">Política de cookies</a> · <a href="/privacidad/">Privacidad</a>' +
            '</div>' +
            '<div class="ck-btns">' +
                '<button class="ck-reject" onclick="window.ckReject()" aria-label="Rechazar cookies no esenciales">Rechazar</button>' +
                '<button class="ck-accept" onclick="window.ckAccept()" aria-label="Aceptar cookies de analítica y publicidad">Aceptar todo</button>' +
            '</div>';
        document.body.appendChild(banner);
    }

    window.ckAccept = function () {
        setConsent('accepted');
        removeBanner();
        enableServices();
    };

    window.ckReject = function () {
        setConsent('rejected');
        removeBanner();
        disableServices();
    };

    window.ckRevokeConsent = function () {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_DATE);
        } catch (e) {}
        deleteGoogleCookies();
        location.reload();
    };

    var consent = getConsent();
    if (consent === 'accepted') {
        enableServices();
    } else if (consent === 'rejected') {
        disableServices();
    } else {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', buildBanner);
        } else {
            buildBanner();
        }
    }
})();
