(function (root) {
  'use strict';
  var doc = root.document, configNode = doc.getElementById('mado-spot-ad-config'), config;
  try { config = JSON.parse(configNode.textContent); } catch (_) { return; }
  if (config.version !== 1 || config.lang !== 'ja' || !/^[a-z0-9-]+$/.test(config.spot) ||
      !/^ca-pub-\d+$/.test(config.client) || !/^\d+$/.test(config.slot) ||
      doc.body.getAttribute('data-spot-page-shared-lang') !== config.lang ||
      doc.body.getAttribute('data-spot-page-shared-id') !== config.spot ||
      root.self !== root.top || root.MADO_EMBEDDED_WEB ||
      (root.Capacitor && typeof root.Capacitor.isNativePlatform === 'function' && root.Capacitor.isNativePlatform())) return;
  function mount() {
    if (doc.getElementById('mado-spot-ad')) return;
    var article = doc.querySelector('article.spot-page-article'), map = article && article.querySelector('.spot-static-map');
    if (!article || !['before-map', 'after-map', 'article-end'].includes(config.position) ||
        (config.position !== 'article-end' && !map)) return;
    var style = doc.createElement('style');
    style.textContent = '.spot-advertisement{width:100%;max-width:728px;margin:32px auto}.spot-advertisement>small{display:block;margin-bottom:8px;color:#6b7280;font-size:11px;text-align:center}.spot-ad-space{min-height:250px}.spot-ad-unit{display:block;width:100%;height:250px}@media(min-width:768px){.spot-ad-space{min-height:90px}.spot-ad-unit{height:90px}}';
    doc.head.appendChild(style);
    var box = doc.createElement('aside'); box.id = 'mado-spot-ad'; box.className = 'spot-advertisement'; box.setAttribute('aria-label', '広告');
    var label = doc.createElement('small'); label.textContent = '広告'; box.appendChild(label);
    var space = doc.createElement('div'); space.className = 'spot-ad-space'; box.appendChild(space);
    var unit = doc.createElement('ins'); unit.className = 'adsbygoogle spot-ad-unit';
    unit.setAttribute('data-ad-client', config.client); unit.setAttribute('data-ad-slot', config.slot);
    unit.setAttribute('data-full-width-responsive', 'false'); space.appendChild(unit);
    if (config.position === 'before-map') map.before(box);
    else if (config.position === 'after-map') map.after(box);
    else article.appendChild(box);
    // Previews, packaged copies and other routes never request live ads.
    if (root.location.protocol !== 'https:' || !/^(www\.)?michikusa-travel\.com$/.test(root.location.hostname) ||
        root.location.pathname !== '/spots/' + config.spot + '.html') return;
    var requested = false, observer;
    function request() {
      if (requested || !box.getBoundingClientRect().width) return;
      requested = true; if (observer) observer.disconnect();
      if (!doc.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
        var sdk = doc.createElement('script'); sdk.async = true; sdk.crossOrigin = 'anonymous';
        sdk.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + config.client;
        doc.head.appendChild(sdk);
      }
      (root.adsbygoogle = root.adsbygoogle || []).push({});
    }
    if (root.IntersectionObserver) {
      observer = new root.IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) request();
      }, { rootMargin: '300px 0px' });
      observer.observe(box);
    } else request();
  }
  if (root.MADO_SPOT_PAGE_READY && typeof root.MADO_SPOT_PAGE_READY.then === 'function') root.MADO_SPOT_PAGE_READY.then(mount, function () {});
  else { doc.addEventListener('mado:shared-ui-ready', mount, { once: true }); mount(); }
}(window));
