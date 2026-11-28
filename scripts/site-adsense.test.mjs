import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync(new URL('../site-adsense.js', import.meta.url), 'utf8');

function harness({
  url = 'https://www.michikusa-travel.com/spots/fuji.html',
  lang = 'ja',
  rail = true,
  map = true,
  sectionCount = 0,
  sectionHeights = [],
  showcase = true,
  contentRail = false,
  footer = false,
  existingSpotAd = false,
  existingSpotAdConfig = false,
  railWidth = 234,
  articleWidth = 728,
  embedded = false,
  nativeFlag = false,
  capacitorNative = false,
  capacitorPlatform = 'web',
  iframe = false,
  ready = false,
} = {}) {
  let sectionsHtml = '';
  if (map) {
    sectionsHtml = `<section class="spot-page-section"><h2>物語</h2></section><section class="spot-static-map"><h2>位置の目安</h2></section><section class="spot-page-section"><h2>コツ</h2></section>`;
  } else if (sectionCount > 0) {
    for (let i = 0; i < sectionCount; i++) {
      sectionsHtml += `<section class="chapter" data-ch="${i}"><h2>章${i + 1}</h2></section>`;
    }
  } else {
    sectionsHtml = `<p>本文</p>`;
  }
  const html = `<!doctype html><html lang="${lang}"><head></head><body>` +
    `<div class="spot-page-shell">` +
    (rail ? `<aside class="spot-page-rail"><div class="spot-page-rail-head"><p class="spot-page-rail-title">東京 → 新大阪の車窓</p><a class="spot-page-rail-cta" href="../start.html">乗る列車でガイドを作る</a></div><div class="spot-page-rail-list-wrap"><ol class="spot-page-rail-list"></ol></div><div class="spot-page-rail-foot"><a href="../zukan.html">車窓図鑑</a></div></aside>` : '') +
    `<article class="spot-page-article">` +
    (existingSpotAd ? `<aside id="mado-spot-ad" class="spot-advertisement"><ins class="adsbygoogle spot-ad-unit" data-ad-client="ca-pub-5756673901202661" data-ad-slot="6439684093"></ins></aside>` : '') +
    sectionsHtml + `</article></div>` +
    (showcase ? `<section class="showcase spot-page-showcase" aria-labelledby="spotPageShowcaseTitle"><div class="section-head"><p class="eyebrow">MORE TO SEE</p><h2 id="spotPageShowcaseTitle">ほかにも、こんな車窓</h2></div></section>` : '') +
    (contentRail ? `<section class="content-rail-section"><div class="section-head"><p class="eyebrow">MORE TO TRY</p></div></section>` : '') +
    (footer ? `<footer class="footer"><nav><a href="index.html">TOP</a></nav></footer>` : '') +
    (existingSpotAdConfig ? `<script id="mado-spot-ad-config" type="application/json">{"version":1}</script>` : '') +
    `</body></html>`;
  const dom = new JSDOM(html, { url });
  const observers = [];
  let resolveReady;
  const root = {
    document: dom.window.document,
    location: new URL(url),
    MADO_EMBEDDED_WEB: embedded,
    MADO_NATIVE_APP: nativeFlag,
    Capacitor: {
      isNativePlatform: () => capacitorNative,
      getPlatform: () => capacitorPlatform,
    },
  };
  root.self = root;
  root.top = iframe ? {} : root;
  root.IntersectionObserver = class {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      observers.push(this);
    }
    observe(node) { this.node = node; }
    disconnect() { this.disconnected = true; }
  };
  if (ready) root.MADO_SITE_RUNTIME_READY = new Promise(resolve => { resolveReady = resolve; });
  dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.id === 'mado-site-ad-rail') return { width: railWidth, height: railWidth ? 200 : 0, top: 0, bottom: 200 };
    if (this.id === 'mado-site-ad-article') return { width: articleWidth, height: articleWidth ? 250 : 0, top: 0, bottom: 250 };
    if (this.tagName === 'ARTICLE') return { top: 400, bottom: 5000, height: 4600, width: 728 };
    if (this.hasAttribute && this.hasAttribute('data-ch') && sectionHeights.length) {
      const idx = Number(this.getAttribute('data-ch'));
      let top = 400;
      for (let k = 0; k < idx; k++) top += sectionHeights[k] || 0;
      const h = sectionHeights[idx] || 0;
      return { top, bottom: top + h, height: h, width: 728 };
    }
    return { width: 728, height: 0, top: 0, bottom: 0 };
  };
  const run = () => vm.runInNewContext(source, { window: root });
  run();
  return {
    root,
    doc: root.document,
    observers,
    run,
    resolveReady,
    intersectAll: () => observers.forEach(o => o.callback([{ isIntersecting: true }])),
    sdkCount: () => root.document.querySelectorAll('script[src*="adsbygoogle.js"]').length,
    close: () => dom.window.close(),
  };
}

test('PC (>=1100px) on spot pages: mounts both left rail (after head) and before-map slot; both request once when visible', t => {
  const h = harness({ railWidth: 234, articleWidth: 728 });
  t.after(() => h.close());
  const rail = h.doc.querySelector('.spot-page-rail');
  const railHead = rail.querySelector('.spot-page-rail-head');
  const railList = rail.querySelector('.spot-page-rail-list-wrap');
  const railAd = h.doc.getElementById('mado-site-ad-rail');
  const map = h.doc.querySelector('.spot-static-map');
  const articleAd = h.doc.getElementById('mado-site-ad-article');

  assert.equal(railAd.previousElementSibling, railHead);
  assert.equal(railAd.nextElementSibling, railList);
  assert.equal(railAd.getAttribute('data-site-ad-position'), 'rail-after-head');
  assert.equal(map.previousElementSibling, articleAd);
  assert.equal(articleAd.getAttribute('data-site-ad-position'), 'before-map');
  assert.ok(h.doc.getElementById('mado-site-ad-style').textContent.includes('.site-ad-rail .site-ad-unit{display:block;width:200px;height:200px;margin:0 auto}'));
  assert.equal(railAd.querySelector('small').textContent, '広告');
  assert.equal(articleAd.querySelector('small').textContent, '広告');

  assert.equal(h.doc.querySelectorAll('ins.adsbygoogle').length, 0);
  assert.equal(h.sdkCount(), 0);
  assert.equal(h.observers.length, 2);

  h.intersectAll();
  h.intersectAll();
  assert.equal(h.sdkCount(), 1, 'Google AdSense SDK is injected once across both slots');
  assert.equal(h.root.adsbygoogle.length, 2, 'Both visible PC slots push once');
  assert.equal(railAd.querySelectorAll('ins.adsbygoogle').length, 1);
  assert.equal(articleAd.querySelectorAll('ins.adsbygoogle').length, 1);

  for (const ad of [railAd, articleAd]) {
    const ins = ad.querySelector('ins.adsbygoogle');
    assert.equal(ins.getAttribute('data-ad-client'), 'ca-pub-5756673901202661');
    assert.equal(ins.getAttribute('data-ad-slot'), '6439684093');
    assert.equal(ins.getAttribute('data-full-width-responsive'), 'false');
  }

  h.run();
  assert.equal(h.doc.querySelectorAll('#mado-site-ad-rail').length, 1);
  assert.equal(h.doc.querySelectorAll('#mado-site-ad-article').length, 1);
});

test('Mobile (<1100px): hidden left rail never adds <ins> so visible mid-article slot gets the AdSense push', t => {
  const h = harness({ railWidth: 0, articleWidth: 358 });
  t.after(() => h.close());
  assert.ok(h.doc.getElementById('mado-site-ad-rail'));
  assert.ok(h.doc.getElementById('mado-site-ad-article'));
  h.intersectAll();
  assert.equal(h.sdkCount(), 1);
  assert.equal(h.root.adsbygoogle.length, 1);
  assert.equal(h.doc.getElementById('mado-site-ad-rail').getAttribute('data-site-ad-requested'), null);
  assert.equal(h.doc.getElementById('mado-site-ad-rail').querySelectorAll('ins.adsbygoogle').length, 0);
  assert.equal(h.doc.getElementById('mado-site-ad-article').getAttribute('data-site-ad-requested'), '1');
  assert.equal(h.doc.getElementById('mado-site-ad-article').querySelectorAll('ins.adsbygoogle').length, 1);
});

test('multi-section guides and features skip short intros and mount after the first substantial chapter', t => {
  const castlesLike = harness({
    url: 'https://www.michikusa-travel.com/castles.html',
    map: false,
    sectionCount: 5,
    sectionHeights: [800, 3200, 1200, 1200, 500],
  });
  t.after(() => castlesLike.close());
  const ad = castlesLike.doc.getElementById('mado-site-ad-article');
  assert.ok(ad);
  assert.equal(ad.getAttribute('data-site-ad-position'), 'after-chapter');
  // Section 0 is 800px (<1200px), so it skips section 0 and inserts after section 1 (cumulative 4000px).
  assert.equal(ad.previousElementSibling.getAttribute('data-ch'), '1');

  const guideLike = harness({
    url: 'https://www.michikusa-travel.com/guide.html',
    map: false,
    showcase: false,
    contentRail: true,
    sectionCount: 6,
    sectionHeights: [2400, 1200, 1200, 1200, 800, 500],
  });
  t.after(() => guideLike.close());
  const guideAd = guideLike.doc.getElementById('mado-site-ad-article');
  assert.ok(guideAd);
  assert.equal(guideAd.getAttribute('data-site-ad-position'), 'after-chapter');
  // Section 0 is 2400px (>=1200px), so it inserts right after section 0.
  assert.equal(guideAd.previousElementSibling.getAttribute('data-ch'), '0');
});

test('single-section list pages (e.g. factories) fall back to before-footer; stories mount nothing', t => {
  const factoryLike = harness({
    url: 'https://www.michikusa-travel.com/factories.html',
    map: false,
    sectionCount: 1,
    showcase: false,
    contentRail: false,
    footer: true,
  });
  t.after(() => factoryLike.close());
  const footerAd = factoryLike.doc.getElementById('mado-site-ad-article');
  assert.ok(footerAd);
  assert.equal(footerAd.getAttribute('data-site-ad-position'), 'before-footer');
  assert.equal(factoryLike.doc.querySelector('footer.footer').previousElementSibling, footerAd);

  const storyLike = harness({
    url: 'https://www.michikusa-travel.com/stories/godzilla.html',
    rail: false,
    map: false,
    sectionCount: 5,
    showcase: false,
    footer: true,
  });
  t.after(() => storyLike.close());
  assert.equal(storyLike.doc.getElementById('mado-site-ad-rail'), null);
  assert.equal(storyLike.doc.getElementById('mado-site-ad-article'), null);
  assert.equal(storyLike.doc.getElementById('mado-site-ad-style'), null);
});

test('existing 6 Japanese pilot spots keep their #mado-spot-ad and do not mount a duplicate map-before slot', t => {
  for (const opts of [{ existingSpotAd: true }, { existingSpotAdConfig: true }]) {
    const h = harness({ url: 'https://www.michikusa-travel.com/spots/kakegawa.html', ...opts, railWidth: 234, articleWidth: 728 });
    t.after(() => h.close());
    assert.ok(h.doc.getElementById('mado-site-ad-rail'), 'PC left rail still mounts');
    assert.equal(h.doc.getElementById('mado-site-ad-article'), null, 'No duplicate mid-article slot on pilot spots');
    h.intersectAll();
    assert.equal(h.sdkCount(), 1);
    assert.equal(h.root.adsbygoogle.length, 1);
  }
});

test('previews never request Google and native/embedded/iframe contexts never mount', t => {
  for (const url of [
    'http://127.0.0.1:8139/spots/fuji.html',
    'file:///C:/work/app/spots/fuji.html',
    'https://preview.example/spots/fuji.html',
  ]) {
    const h = harness({ url, railWidth: 234, articleWidth: 728 });
    t.after(() => h.close());
    assert.ok(h.doc.getElementById('mado-site-ad-rail'));
    assert.ok(h.doc.getElementById('mado-site-ad-article'));
    h.intersectAll();
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.root.adsbygoogle, undefined);
  }
  for (const options of [
    { embedded: true },
    { nativeFlag: true },
    { capacitorNative: true },
    { capacitorPlatform: 'android' },
    { iframe: true },
  ]) {
    const h = harness(options);
    t.after(() => h.close());
    assert.equal(h.doc.getElementById('mado-site-ad-rail'), null);
    assert.equal(h.doc.getElementById('mado-site-ad-article'), null);
    assert.equal(h.sdkCount(), 0);
  }
});

test('ignores [hidden] rail and content-rail wrappers (e.g. Everyday Japan)', t => {
  const hiddenEveryday = new JSDOM('<!doctype html><html lang="en"><head></head><body><main>Everyday</main><div hidden><section class="content-rail-section"></section></div><footer class="footer"></footer><div hidden><aside class="spot-page-rail"></aside></div></body></html>', { url: 'https://www.michikusa-travel.com/en/everyday-japan.html' });
  t.after(() => hiddenEveryday.window.close());
  const root1 = { document: hiddenEveryday.window.document, location: new URL('https://www.michikusa-travel.com/en/everyday-japan.html') };
  root1.self = root1; root1.top = root1;
  vm.runInNewContext(source, { window: root1 });
  assert.equal(root1.document.getElementById('mado-site-ad-rail'), null);
  assert.equal(root1.document.getElementById('mado-site-ad-article'), null);
});

test('waits for MADO_SITE_RUNTIME_READY when common components render asynchronously', async t => {
  const h = harness({ rail: false, map: false, showcase: false, ready: true, railWidth: 234, articleWidth: 728 });
  t.after(() => h.close());
  assert.equal(h.doc.getElementById('mado-site-ad-rail'), null);
  const rail = h.doc.createElement('aside');
  rail.className = 'spot-page-rail';
  h.doc.body.appendChild(rail);
  const showcase = h.doc.createElement('section');
  showcase.className = 'showcase spot-page-showcase';
  h.doc.body.appendChild(showcase);
  h.resolveReady();
  await h.root.MADO_SITE_RUNTIME_READY;
  await Promise.resolve();
  assert.ok(h.doc.getElementById('mado-site-ad-rail'));
  assert.ok(h.doc.getElementById('mado-site-ad-article'));
});
