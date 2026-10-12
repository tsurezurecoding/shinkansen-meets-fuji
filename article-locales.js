// Article edition menus use the shared route contract and retain navigation state.
(function () {
  'use strict';
  function connect() {
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) return;
    var config = window.MADO_LOCALES;
    if (!config) return;
    var route = config.canonicalRoute(new URL(canonical.href).pathname.slice(1));
    var lang = document.documentElement.lang;
    var depth = route.indexOf('spots/') === 0 ? (lang === 'ja' ? '../' : '../../') : (lang === 'ja' ? './' : '../');
    document.querySelectorAll('.lang-switch, .article-lang-menu').forEach(function (host) {
      var menu = document.createElement('details');
      menu.className = 'guide-lang-menu article-lang-menu';
      var summary = document.createElement('summary');
      summary.textContent = config.editions[lang].label;
      summary.setAttribute('aria-label', config.editions[lang].prompt);
      var options = document.createElement('div');
      options.className = 'guide-lang-options';
      config.supported(route).forEach(function (edition) {
        var a = document.createElement('a');
        var url = new URL(depth + (edition === 'ja' ? '' : edition + '/') + route, location.href);
        url.search = location.search; url.hash = location.hash;
        if (edition === 'ja' || url.searchParams.has('lang')) url.searchParams.set('lang', edition);
        a.href = url.href;
        a.lang = edition; a.textContent = config.editions[edition].label;
        a.addEventListener('click', function () {
          if (lang === 'ja') {
            var source = new URL(location.href); source.searchParams.set('lang', 'ja');
            try { history.replaceState(history.state, '', source); } catch (error) {}
          }
          try { localStorage.setItem('mado-lang', edition); } catch (error) {}
        });
        if (lang === edition) a.setAttribute('aria-current', 'page');
        options.appendChild(a);
      });
      menu.append(summary, options);
      host.replaceWith(menu);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connect); else connect();
}());
