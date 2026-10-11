// Only articles with all four editions load this file. TOP/search keep their existing routes.
(function () {
  'use strict';
  function connect() {
    var alternate = document.querySelector('link[hreflang="zh-Hant"]');
    if (!alternate) return;
    var route = new URL(alternate.href).pathname.replace(/^\/zh-Hant\//, '');
    var lang = document.documentElement.lang;
    var depth = route.indexOf('spots/') === 0 ? (lang === 'ja' ? '../' : '../../') : (lang === 'ja' ? './' : '../');
    document.querySelectorAll('.lang-switch').forEach(function (host) {
      host.replaceChildren();
      [['ja','日本語'],['en','EN'],['zh-Hant','繁體中文'],['fr','Français']].forEach(function (edition) {
        var a = document.createElement('a');
        a.href = depth + (edition[0] === 'ja' ? '' : edition[0] + '/') + route + (edition[0] === 'ja' ? '?lang=ja' : '');
        a.lang = edition[0]; a.textContent = edition[1];
        if (lang === edition[0]) { a.className = 'active'; a.setAttribute('aria-current', 'page'); }
        host.appendChild(a);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connect); else connect();
}());
