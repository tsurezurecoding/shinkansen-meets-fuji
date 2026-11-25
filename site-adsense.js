(function (root) {
  'use strict';
  var doc = root.document;
  if (!doc) return;
  if (root.self !== root.top || root.MADO_EMBEDDED_WEB || root.MADO_NATIVE_APP ||
      (doc.documentElement && (doc.documentElement.classList.contains('mado-embedded-web') || doc.documentElement.classList.contains('is-native-app'))) ||
      (root.Capacitor && ((typeof root.Capacitor.isNativePlatform === 'function' && root.Capacitor.isNativePlatform()) ||
        (typeof root.Capacitor.getPlatform === 'function' && root.Capacitor.getPlatform() !== 'web')))) return;

  var CLIENT = 'ca-pub-5756673901202661';
  var SLOT = '6439684093';
  var LABELS = {
    ja: '広告',
    en: 'Advertisement',
    'zh-Hant': '廣告',
    'zh-Hans': '广告',
    ko: '광고',
    fr: 'Publicité',
    de: 'Anzeige',
    es: 'Publicidad',
    it: 'Pubblicità',
    th: 'โฆษณา'
  };

  function adLabel() {
    var raw = (doc.documentElement && doc.documentElement.lang) || '';
    if (LABELS[raw]) return LABELS[raw];
    var base = raw.split('-')[0];
    return LABELS[base] || LABELS.en;
  }

  function ensureStyle() {
    if (doc.getElementById('mado-site-ad-style') || !doc.head) return;
    var style = doc.createElement('style');
    style.id = 'mado-site-ad-style';
    style.textContent =
      '.site-ad-rail{width:100%;max-width:234px;margin:18px auto;padding:14px 0 16px;border-top:1px solid var(--line,#e2e8f0);border-bottom:1px solid var(--line,#e2e8f0);text-align:center;box-sizing:border-box}' +
      '.site-ad-rail>small,.site-ad-showcase>small{display:block;margin-bottom:8px;color:var(--muted,#6b7280);font-size:11px;letter-spacing:.08em;text-align:center}' +
      '.site-ad-rail .site-ad-space{min-height:200px}' +
      '.site-ad-rail .site-ad-unit{display:block;width:200px;height:200px;margin:0 auto}' +
      '.site-ad-showcase{width:100%;max-width:760px;margin:32px auto;padding:0 16px;box-sizing:border-box;text-align:center}' +
      '.site-ad-showcase .site-ad-space{min-height:250px}' +
      '.site-ad-showcase .site-ad-unit{display:block;width:100%;height:250px}' +
      '@media(min-width:768px){.site-ad-showcase .site-ad-space{min-height:90px}.site-ad-showcase .site-ad-unit{height:90px}}' +
      '@media(min-width:1100px){.site-ad-mobile-only{display:none}}' +
      '.site-ad-rail:has(ins[data-ad-status="unfilled"]),.site-ad-showcase:has(ins[data-ad-status="unfilled"]){display:none}' +
      'html.mado-embedded-web .site-ad-rail,html.mado-embedded-web .site-ad-showcase,html.is-native-app .site-ad-rail,html.is-native-app .site-ad-showcase{display:none!important}';
    doc.head.appendChild(style);
  }

  function isLiveHost() {
    return !!(root.location && root.location.protocol === 'https:' && /^(www\.)?michikusa-travel\.com$/.test(root.location.hostname));
  }

  function createBox(id, className, position) {
    var labelText = adLabel();
    var box = doc.createElement('aside');
    box.id = id;
    box.className = className;
    box.setAttribute('data-site-ad-position', position);
    box.setAttribute('aria-label', labelText);
    var label = doc.createElement('small');
    label.textContent = labelText;
    box.appendChild(label);
    var space = doc.createElement('div');
    space.className = 'site-ad-space';
    box.appendChild(space);
    return box;
  }

  function createUnit() {
    var unit = doc.createElement('ins');
    unit.className = 'adsbygoogle site-ad-unit';
    unit.setAttribute('data-ad-client', CLIENT);
    unit.setAttribute('data-ad-slot', SLOT);
    unit.setAttribute('data-full-width-responsive', 'false');
    return unit;
  }

  function observeBox(box) {
    // Previews, local files and non-production hosts never request live ads.
    if (!isLiveHost()) return;
    var observer;
    function request() {
      if (box.getAttribute('data-site-ad-requested') === '1' || !box.getBoundingClientRect().width) return;
      box.setAttribute('data-site-ad-requested', '1');
      if (observer) observer.disconnect();
      var space = box.querySelector('.site-ad-space');
      if (space && !space.querySelector('ins.adsbygoogle')) space.appendChild(createUnit());
      if (!doc.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
        var sdk = doc.createElement('script');
        sdk.async = true;
        sdk.crossOrigin = 'anonymous';
        sdk.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CLIENT;
        doc.head.appendChild(sdk);
      }
      (root.adsbygoogle = root.adsbygoogle || []).push({});
    }
    if (root.IntersectionObserver) {
      observer = new root.IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) request();
      }, { rootMargin: '300px 0px' });
      observer.observe(box);
    } else {
      request();
    }
  }

  function visibleCandidate(selector) {
    var list = doc.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      if (!list[i].closest || !list[i].closest('[hidden]')) return list[i];
    }
    return null;
  }

  function findBottomAnchor() {
    var showcase = visibleCandidate('.spot-page-showcase');
    if (showcase) return { node: showcase, position: 'before-showcase' };
    var content = visibleCandidate('.content-rail-section');
    if (content) return { node: content, position: 'before-content-rail' };
    var footer = visibleCandidate('footer.footer, footer');
    if (footer) return { node: footer, position: 'before-footer' };
    return null;
  }

  function mount() {
    var rail = visibleCandidate('.spot-page-rail');
    var bottom = findBottomAnchor();
    if (!rail && (!bottom || bottom.position !== 'before-showcase')) return;
    ensureStyle();
    if (rail && !doc.getElementById('mado-site-ad-rail')) {
      var railList = rail.querySelector('.spot-page-rail-list-wrap');
      var railHead = rail.querySelector('.spot-page-rail-head');
      var railBox = createBox('mado-site-ad-rail', 'site-ad-rail', railList || railHead ? 'rail-after-head' : 'rail-bottom');
      if (railList) railList.before(railBox);
      else if (railHead) railHead.after(railBox);
      else rail.appendChild(railBox);
      observeBox(railBox);
    }
    if (bottom && !doc.getElementById('mado-site-ad-showcase')) {
      var cls = rail ? 'site-ad-showcase site-ad-mobile-only' : 'site-ad-showcase';
      var bottomBox = createBox('mado-site-ad-showcase', cls, bottom.position);
      bottom.node.before(bottomBox);
      observeBox(bottomBox);
    }
  }

  if (root.MADO_SITE_RUNTIME_READY && typeof root.MADO_SITE_RUNTIME_READY.then === 'function') {
    root.MADO_SITE_RUNTIME_READY.then(mount, function () {});
  }
  doc.addEventListener('mado:shared-ui-ready', mount, { once: true });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount, { once: true });
  mount();
}(window));
