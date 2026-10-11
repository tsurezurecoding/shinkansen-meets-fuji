// Only articles with all four editions load this file. TOP/search keep their existing routes.
(function () {
  'use strict';
  function connect() {
    var alternate = document.querySelector('link[hreflang="zh-Hant"]');
    if (!alternate) return;
    var route = new URL(alternate.href).pathname.replace(/^\/zh-Hant\//, '');
    var lang = document.documentElement.lang;
    var depth = route.indexOf('spots/') === 0 ? (lang === 'ja' ? '../' : '../../') : (lang === 'ja' ? './' : '../');
    var labels = { ja: '日本語', en: 'English', 'zh-Hant': '繁體中文', fr: 'Français' };
    var prompts = { ja: '言語を選択', en: 'Choose language', 'zh-Hant': '選擇語言', fr: 'Choisir la langue' };
    document.querySelectorAll('.lang-switch, .article-lang-menu').forEach(function (host) {
      // Keep generated native menus intact; only legacy ja/en switches need replacing.
      if (host.matches('details.article-lang-menu')) return;
      var menu = document.createElement('details');
      menu.className = 'guide-lang-menu article-lang-menu';
      var summary = document.createElement('summary');
      summary.textContent = labels[lang];
      summary.setAttribute('aria-label', prompts[lang]);
      var options = document.createElement('div');
      options.className = 'guide-lang-options';
      Object.keys(labels).forEach(function (edition) {
        var a = document.createElement('a');
        a.href = depth + (edition === 'ja' ? '' : edition + '/') + route + (edition === 'ja' ? '?lang=ja' : '');
        a.lang = edition; a.textContent = labels[edition];
        if (lang === edition) a.setAttribute('aria-current', 'page');
        options.appendChild(a);
      });
      menu.append(summary, options);
      host.replaceWith(menu);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connect); else connect();
}());
