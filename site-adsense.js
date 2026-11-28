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
      '.site-ad-rail>small,.site-ad-article>small,.site-ad-showcase>small,.site-ad-journey-rail>small,.site-ad-timeline>small,.site-ad-top>small{display:block;margin-bottom:8px;color:var(--muted,#6b7280);font-size:11px;letter-spacing:.08em;text-align:center}' +
      '.site-ad-rail .site-ad-space{min-height:200px}' +
      '.site-ad-rail .site-ad-unit{display:block;width:200px;height:200px;margin:0 auto}' +
      '.site-ad-article{width:100%;max-width:728px;margin:32px auto;padding:14px 0 16px;border-top:1px solid var(--line,#e2e8f0);border-bottom:1px solid var(--line,#e2e8f0);box-sizing:border-box;text-align:center}' +
      '.site-ad-showcase{width:100%;max-width:760px;margin:32px auto;padding:14px 16px 16px;border-top:1px solid var(--line,#e2e8f0);border-bottom:1px solid var(--line,#e2e8f0);box-sizing:border-box;text-align:center}' +
      '.site-ad-article .site-ad-space,.site-ad-showcase .site-ad-space{min-height:250px}' +
      '.site-ad-article .site-ad-unit,.site-ad-showcase .site-ad-unit{display:block;width:100%;height:250px}' +
      '@media(min-width:768px){.site-ad-article .site-ad-space,.site-ad-showcase .site-ad-space{min-height:90px}.site-ad-article .site-ad-unit,.site-ad-showcase .site-ad-unit{height:90px}}' +
      '.site-ad-journey-rail{display:none}' +
      '@media(min-width:900px){.site-ad-journey-rail{display:block;width:100%;max-width:320px;margin:20px auto 0;padding:14px 0 16px;border-top:1px solid var(--line,#e2e8f0);border-bottom:1px solid var(--line,#e2e8f0);text-align:center;box-sizing:border-box}.site-ad-journey-rail .site-ad-space{min-height:250px}.site-ad-journey-rail .site-ad-unit{display:block;width:300px;height:250px;margin:0 auto}}' +
      '@media(min-width:900px) and (max-height:1060px){.journey-form-pane:has(.site-ad-journey-rail){position:static}}' +
      '.site-ad-timeline{width:100%;max-width:620px;margin:28px auto 0;padding:14px 0 16px;border-top:1px solid var(--line,#e2e8f0);border-bottom:1px solid var(--line,#e2e8f0);text-align:center;box-sizing:border-box}' +
      '.site-ad-timeline .site-ad-space{min-height:250px}' +
      '.site-ad-timeline .site-ad-unit{display:block;width:100%;height:250px}' +
      '@media(min-width:768px) and (max-width:899px){.site-ad-timeline .site-ad-space{min-height:90px}.site-ad-timeline .site-ad-unit{height:90px}}' +
      '@media(min-width:900px){.site-ad-timeline{display:none}}' +
      '.site-ad-top-band{width:100%;padding:0 15px 32px;background:var(--white,#fffdf8);box-sizing:border-box}' +
      '.site-ad-top{width:100%;max-width:728px;margin:0 auto;padding:14px 0 16px;border-top:1px solid var(--line,rgba(18,35,52,0.14));border-bottom:1px solid var(--line,rgba(18,35,52,0.14));text-align:center;box-sizing:border-box}' +
      '.site-ad-top .site-ad-space{min-height:250px}' +
      '.site-ad-top .site-ad-unit{display:block;width:100%;height:250px}' +
      '@media(min-width:768px){.site-ad-top-band{padding:0 20px 40px}.site-ad-top .site-ad-space{min-height:90px}.site-ad-top .site-ad-unit{height:90px}}' +
      '.site-ad-rail:has(ins[data-ad-status="unfilled"]),.site-ad-article:has(ins[data-ad-status="unfilled"]),.site-ad-showcase:has(ins[data-ad-status="unfilled"]),.site-ad-journey-rail:has(ins[data-ad-status="unfilled"]),.site-ad-timeline:has(ins[data-ad-status="unfilled"]),.site-ad-top-band:has(ins[data-ad-status="unfilled"]),.site-ad-top:has(ins[data-ad-status="unfilled"]){display:none}' +
      'html.mado-embedded-web .site-ad-rail,html.mado-embedded-web .site-ad-article,html.mado-embedded-web .site-ad-showcase,html.mado-embedded-web .site-ad-journey-rail,html.mado-embedded-web .site-ad-timeline,html.mado-embedded-web .site-ad-top-band,html.mado-embedded-web .site-ad-top,html.is-native-app .site-ad-rail,html.is-native-app .site-ad-article,html.is-native-app .site-ad-showcase,html.is-native-app .site-ad-journey-rail,html.is-native-app .site-ad-timeline,html.is-native-app .site-ad-top-band,html.is-native-app .site-ad-top{display:none!important}';
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
      if (box.getAttribute('data-site-ad-requested') === '1' || !box.isConnected || !box.getBoundingClientRect().width) return;
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

  function findArticleAnchor() {
    var article = visibleCandidate('article.spot-page-article') ||
                  visibleCandidate('.spot-page-shell > article') ||
                  visibleCandidate('main article');
    if (article) {
      var map = article.querySelector('.spot-static-map');
      if (map && (!map.closest || !map.closest('[hidden]'))) {
        return { node: map, insert: 'before', position: 'before-map', inArticle: true };
      }
      var sections = [];
      for (var i = 0; i < article.children.length; i++) {
        var child = article.children[i];
        if (child.tagName === 'SECTION' && (!child.closest || !child.closest('[hidden]'))) {
          sections.push(child);
        }
      }
      if (sections.length >= 3) {
        var articleTop = article.getBoundingClientRect().top;
        var chosen = sections[0];
        for (var j = 0; j < sections.length - 1; j++) {
          var rect = sections[j].getBoundingClientRect();
          if (rect.height <= 0) break;
          chosen = sections[j];
          if ((rect.bottom - articleTop) >= 1200) break;
        }
        return { node: chosen, insert: 'after', position: 'after-chapter', inArticle: true };
      }
    }
    var showcase = visibleCandidate('.spot-page-showcase');
    if (showcase) return { node: showcase, insert: 'before', position: 'before-showcase', inArticle: false };
    var content = visibleCandidate('.content-rail-section');
    if (content) return { node: content, insert: 'before', position: 'before-content-rail', inArticle: false };
    var footer = visibleCandidate('footer.footer, footer');
    if (footer) return { node: footer, insert: 'before', position: 'before-footer', inArticle: false };
    return null;
  }

  function mountJourney() {
    var formPane = visibleCandidate('.journey-desktop-grid .journey-form-pane');
    if (!formPane) return false;
    ensureStyle();
    if (!doc.getElementById('mado-site-ad-journey-rail')) {
      var railBox = createBox('mado-site-ad-journey-rail', 'site-ad-journey-rail', 'journey-rail-bottom');
      formPane.appendChild(railBox);
      observeBox(railBox);
    }
    var timelineHost = doc.querySelector('.journey-desktop-grid #timelineSection') ||
                       doc.querySelector('.journey-desktop-grid .journey-timeline-pane');
    if (timelineHost && !doc.getElementById('mado-site-ad-article')) {
      var timelineBox = createBox('mado-site-ad-article', 'site-ad-timeline', 'timeline-after');
      timelineHost.appendChild(timelineBox);
      observeBox(timelineBox);
    }
    return true;
  }

  function mountTop() {
    var enjoy = visibleCandidate('main.top-redesign .enjoy-window');
    if (!enjoy) return false;
    ensureStyle();
    if (!doc.getElementById('mado-site-ad-top-band')) {
      var band = doc.createElement('div');
      band.id = 'mado-site-ad-top-band';
      band.className = 'site-ad-top-band';
      var box = createBox('mado-site-ad-article', 'site-ad-top', 'top-before-enjoy');
      band.appendChild(box);
      enjoy.before(band);
      observeBox(box);
    }
    return true;
  }

  function mount() {
    if (mountJourney()) return;
    if (mountTop()) return;
    var rail = visibleCandidate('.spot-page-rail');
    var anchor = findArticleAnchor();
    if (!rail && (!anchor || anchor.position !== 'before-showcase')) return;
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
    // Existing 6 Japanese pilot spots already mount #mado-spot-ad before .spot-static-map via spot-adsense.js.
    var hasExistingSpotAd = !!(doc.getElementById('mado-spot-ad') || doc.getElementById('mado-spot-ad-config'));
    if (anchor && !hasExistingSpotAd && !doc.getElementById('mado-site-ad-article')) {
      var cls = anchor.inArticle ? 'site-ad-article' : 'site-ad-showcase';
      var articleBox = createBox('mado-site-ad-article', cls, anchor.position);
      if (anchor.insert === 'after') anchor.node.after(articleBox);
      else anchor.node.before(articleBox);
      observeBox(articleBox);
    }
  }

  if (root.MADO_SITE_RUNTIME_READY && typeof root.MADO_SITE_RUNTIME_READY.then === 'function') {
    root.MADO_SITE_RUNTIME_READY.then(mount, function () {});
  }
  doc.addEventListener('mado:shared-ui-ready', mount, { once: true });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount, { once: true });
  mount();
}(window));
