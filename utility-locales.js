/* Guide-style language menu, retaining train/query/hash context on navigation. */
(function () {
  'use strict';
  function connect() {
    var alternate = document.querySelector('link[hreflang="zh-Hant"]');
    if (!alternate) return;
    var config = window.MADO_LOCALES;
    if (!config) return;
    var route = new URL(alternate.href).pathname.replace(/^\/zh-Hant\//, '').replace(/^live\/$/, 'live/index.html');
    var lang = document.documentElement.lang;
    var base = document.querySelector('base') ? document.baseURI : new URL('../'.repeat((lang === 'ja' ? 0 : 1) + (route.indexOf('live/') === 0 ? 1 : 0)) || './', location.href).href;
    var editions = config.supported(route);
    document.querySelectorAll('.lang-switch,.utility-lang-menu').forEach(function (host) {
      var menu = document.createElement('details'); menu.className = 'guide-lang-menu utility-lang-menu';
      var summary = document.createElement('summary'); summary.textContent = config.editions[lang].label; summary.setAttribute('aria-label', config.editions[lang].prompt);
      var options = document.createElement('div'); options.className = 'guide-lang-options';
      editions.forEach(function (edition) {
        var a = document.createElement('a');
        var url = new URL((edition === 'ja' ? '' : edition + '/') + route, base);
        url.search = location.search; url.hash = location.hash;
        if (edition === 'ja' || url.searchParams.has('lang')) url.searchParams.set('lang', edition);
        a.href = url.href; a.lang = edition; a.textContent = config.editions[edition].label;
        if (lang === edition) a.setAttribute('aria-current', 'page');
        a.addEventListener('click', function () {
          if (typeof localizedPageHref === 'function' && /(?:start|zukan)\.html$/.test(route)) a.href = localizedPageHref(edition);
          if (route === 'mieru.html' && typeof window.madoMieruPageHref === 'function') a.href = window.madoMieruPageHref(edition);
        });
        options.appendChild(a);
      });
      menu.append(summary, options); host.replaceWith(menu);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connect); else connect();
}());
