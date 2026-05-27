(function () {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    function sync(theme) {
        btn.setAttribute('aria-label', theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
        btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    sync(document.documentElement.getAttribute('data-theme') || 'light');
    btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        sync(next);
    });
})();
