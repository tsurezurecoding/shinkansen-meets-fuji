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
  showcase = true,
  contentRail = false,
  footer = false,
  existingSpotAd = false,
  railWidth = 234,
  showcaseWidth = 0,
  embedded = false,
  nativeFlag = false,
  capacitorNative = false,
  capacitorPlatform = 'web',
  iframe = false,
  ready = false,
} = {}) {
  const html = `<!doctype html><html lang="${lang}"><head></head><body>` +
    `<div class="spot-page-shell">` +
    (rail ? `<aside class="spot-page-rail"><div class="spot-page-rail-head"><p class="spot-page-rail-title">東京 → 新大阪の車窓</p><a class="spot-page-rail-cta" href="../start.html">乗る列車でガイドを作る</a></div><div class="spot-page-rail-list-wrap"><ol class="spot-page-rail-list"></ol></div><div class="spot-page-rail-foot"><a href="../zukan.html">車窓図鑑</a></div></aside>` : '') +
    `<article class="spot-page-article">` +
    (existingSpotAd ? `<aside id="mado-spot-ad" class="spot-advertisement"><ins class="adsbygoogle spot-ad-unit" data-ad-client="ca-pub-5756673901202661" data-ad-slot="6439684093"></ins></aside>` : '') +
    `<p>本文</p></article></div>` +
    (showcase ? `<section class="showcase spot-page-showcase" aria-labelledby="spotPageShowcaseTitle"><div class="section-head"><p class="eyebrow">MORE TO SEE</p><h2 id="spotPageShowcaseTitle">ほかにも、こんな車窓</h2></div></section>` : '') +
    (contentRail ? `<section class="content-rail-section"><div class="section-head"><p class="eyebrow">MORE TO TRY</p></div></section>` : '') +
    (footer ? `<footer class="footer"><nav><a href="index.html">TOP</a></nav></footer>` : '') +
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
    if (this.id === 'mado-site-ad-rail') return { width: railWidth };
    if (this.id === 'mado-site-ad-showcase') return { width: showcaseWidth };
    return { width: 728 };
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

test('PC (>=1100px): mounts right after left rail header/CTA and hides bottom slot; only left rail requests AdSense', t => {
  const h = harness({ railWidth: 234, showcaseWidth: 0 });
  t.after(() => h.close());
  const rail = h.doc.querySelector('.spot-page-rail');
  const railHead = rail.querySelector('.spot-page-rail-head');
  const railList = rail.querySelector('.spot-page-rail-list-wrap');
  const railAd = h.doc.getElementById('mado-site-ad-rail');
  const showcase = h.doc.querySelector('.spot-page-showcase');
  const showcaseAd = h.doc.getElementById('mado-site-ad-showcase');

  assert.equal(railAd.previousElementSibling, railHead);
  assert.equal(railAd.nextElementSibling, railList);
  assert.equal(railAd.getAttribute('data-site-ad-position'), 'rail-after-head');
  assert.equal(showcase.previousElementSibling, showcaseAd);
  assert.ok(showcaseAd.classList.contains('site-ad-mobile-only'));
  assert.ok(h.doc.getElementById('mado-site-ad-style').textContent.includes('@media(min-width:1100px){.site-ad-mobile-only{display:none}}'));
  assert.ok(h.doc.getElementById('mado-site-ad-style').textContent.includes('.site-ad-rail .site-ad-unit{display:block;width:200px;height:200px;margin:0 auto}'));
  assert.equal(railAd.querySelector('small').textContent, '広告');
  assert.equal(showcaseAd.querySelector('small').textContent, '広告');

  // No <ins class="adsbygoogle"> is inserted before a visible slot actually requests an ad.
  assert.equal(h.doc.querySelectorAll('ins.adsbygoogle').length, 0);
  assert.equal(h.sdkCount(), 0);
  assert.equal(h.root.adsbygoogle, undefined);
  assert.equal(h.observers.length, 2);
  assert.equal(h.observers[0].options.rootMargin, '300px 0px');

  h.intersectAll();
  h.intersectAll();
  assert.equal(h.sdkCount(), 1, 'Google AdSense SDK is injected once');
  assert.equal(h.root.adsbygoogle.length, 1, 'Only the visible PC rail slot pushes on >=1100px');
  assert.equal(railAd.getAttribute('data-site-ad-requested'), '1');
  assert.equal(showcaseAd.getAttribute('data-site-ad-requested'), null);
  assert.equal(railAd.querySelectorAll('ins.adsbygoogle').length, 1);
  assert.equal(showcaseAd.querySelectorAll('ins.adsbygoogle').length, 0, 'Hidden bottom slot never adds <ins class="adsbygoogle">');
  const railIns = railAd.querySelector('ins.adsbygoogle');
  assert.equal(railIns.getAttribute('data-ad-client'), 'ca-pub-5756673901202661');
  assert.equal(railIns.getAttribute('data-ad-slot'), '6439684093');
  assert.equal(railIns.getAttribute('data-full-width-responsive'), 'false');

  h.run();
  assert.equal(h.doc.querySelectorAll('#mado-site-ad-rail').length, 1);
  assert.equal(h.doc.querySelectorAll('#mado-site-ad-showcase').length, 1);
});

test('Mobile (<1100px): hidden left rail never adds <ins> so visible bottom slot gets the AdSense push', t => {
  const h = harness({ railWidth: 0, showcaseWidth: 358 });
  t.after(() => h.close());
  assert.ok(h.doc.getElementById('mado-site-ad-rail'));
  assert.ok(h.doc.getElementById('mado-site-ad-showcase'));
  h.intersectAll();
  assert.equal(h.sdkCount(), 1);
  assert.equal(h.root.adsbygoogle.length, 1);
  assert.equal(h.doc.getElementById('mado-site-ad-rail').getAttribute('data-site-ad-requested'), null);
  assert.equal(h.doc.getElementById('mado-site-ad-rail').querySelectorAll('ins.adsbygoogle').length, 0);
  assert.equal(h.doc.getElementById('mado-site-ad-showcase').getAttribute('data-site-ad-requested'), '1');
  assert.equal(h.doc.getElementById('mado-site-ad-showcase').querySelectorAll('ins.adsbygoogle').length, 1);
});

test('rail pages without MORE TO SEE (e.g. ramen, Everyday Japan, factories) fall back to before-content-rail or before-footer on mobile', t => {
  const ramenLike = harness({
    lang: 'en',
    url: 'https://www.michikusa-travel.com/en/everyday-japan.html',
    rail: true,
    showcase: false,
    contentRail: true,
    footer: true,
    railWidth: 0,
    showcaseWidth: 358,
  });
  t.after(() => ramenLike.close());
  const contentAd = ramenLike.doc.getElementById('mado-site-ad-showcase');
  assert.ok(ramenLike.doc.getElementById('mado-site-ad-rail'));
  assert.ok(contentAd);
  assert.equal(contentAd.getAttribute('data-site-ad-position'), 'before-content-rail');
  assert.ok(contentAd.classList.contains('site-ad-mobile-only'));
  assert.equal(ramenLike.doc.querySelector('.content-rail-section').previousElementSibling, contentAd);
  assert.equal(contentAd.querySelector('small').textContent, 'Advertisement');

  const factoryLike = harness({
    lang: 'ja',
    url: 'https://www.michikusa-travel.com/factories.html',
    rail: true,
    showcase: false,
    contentRail: false,
    footer: true,
    railWidth: 0,
    showcaseWidth: 358,
  });
  t.after(() => factoryLike.close());
  const footerAd = factoryLike.doc.getElementById('mado-site-ad-showcase');
  assert.ok(footerAd);
  assert.equal(footerAd.getAttribute('data-site-ad-position'), 'before-footer');
  assert.equal(factoryLike.doc.querySelector('footer.footer').previousElementSibling, footerAd);

  // Stories / start / live (no rail, no showcase, even if footer exists) must mount nothing.
  const storyLike = harness({
    url: 'https://www.michikusa-travel.com/stories/godzilla.html',
    rail: false,
    showcase: false,
    contentRail: false,
    footer: true,
  });
  t.after(() => storyLike.close());
  assert.equal(storyLike.doc.getElementById('mado-site-ad-rail'), null);
  assert.equal(storyLike.doc.getElementById('mado-site-ad-showcase'), null);
  assert.equal(storyLike.doc.getElementById('mado-site-ad-style'), null);
  assert.equal(storyLike.sdkCount(), 0);
});

test('preserves existing inline spot ad without deleting or moving it, and requests only 1 shared slot per viewport', t => {
  const h = harness({ url: 'https://www.michikusa-travel.com/spots/kakegawa.html', existingSpotAd: true, railWidth: 234, showcaseWidth: 0 });
  t.after(() => h.close());
  assert.ok(h.doc.getElementById('mado-spot-ad'));
  assert.ok(h.doc.getElementById('mado-site-ad-rail'));
  assert.ok(h.doc.getElementById('mado-site-ad-showcase'));
  h.intersectAll();
  assert.equal(h.sdkCount(), 1);
  assert.equal(h.root.adsbygoogle.length, 1);
});

test('previews never request Google and native/embedded/iframe contexts never mount', t => {
  for (const url of [
    'http://127.0.0.1:8139/spots/fuji.html',
    'file:///C:/work/app/spots/fuji.html',
    'https://preview.example/spots/fuji.html',
  ]) {
    const h = harness({ url, railWidth: 234, showcaseWidth: 0 });
    t.after(() => h.close());
    assert.ok(h.doc.getElementById('mado-site-ad-rail'));
    assert.ok(h.doc.getElementById('mado-site-ad-showcase'));
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
    assert.equal(h.doc.getElementById('mado-site-ad-showcase'), null);
    assert.equal(h.sdkCount(), 0);
  }
});

test('ignores [hidden] rail and content-rail wrappers (e.g. Everyday Japan) and falls back cleanly on foods', t => {
  const hiddenEveryday = new JSDOM('<!doctype html><html lang="en"><head></head><body><main>Everyday</main><div hidden><section class="content-rail-section"></section></div><footer class="footer"></footer><div hidden><aside class="spot-page-rail"></aside></div></body></html>', { url: 'https://www.michikusa-travel.com/en/everyday-japan.html' });
  t.after(() => hiddenEveryday.window.close());
  const root1 = { document: hiddenEveryday.window.document, location: new URL('https://www.michikusa-travel.com/en/everyday-japan.html') };
  root1.self = root1; root1.top = root1;
  vm.runInNewContext(source, { window: root1 });
  assert.equal(root1.document.getElementById('mado-site-ad-rail'), null);
  assert.equal(root1.document.getElementById('mado-site-ad-showcase'), null);

  const hiddenContentWithRail = new JSDOM('<!doctype html><html lang="ja"><head></head><body><aside class="spot-page-rail"></aside><div hidden><section class="content-rail-section"></section></div><footer class="footer"></footer></body></html>', { url: 'https://www.michikusa-travel.com/foods.html' });
  t.after(() => hiddenContentWithRail.window.close());
  const root2 = { document: hiddenContentWithRail.window.document, location: new URL('https://www.michikusa-travel.com/foods.html') };
  root2.self = root2; root2.top = root2;
  vm.runInNewContext(source, { window: root2 });
  assert.ok(root2.document.getElementById('mado-site-ad-rail'));
  const bottom = root2.document.getElementById('mado-site-ad-showcase');
  assert.ok(bottom);
  assert.equal(bottom.getAttribute('data-site-ad-position'), 'before-footer');
  assert.equal(root2.document.querySelector('footer.footer').previousElementSibling, bottom);
});

test('waits for MADO_SITE_RUNTIME_READY when common components render asynchronously', async t => {
  const h = harness({ rail: false, showcase: false, ready: true, railWidth: 234, showcaseWidth: 0 });
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
  assert.ok(h.doc.getElementById('mado-site-ad-showcase'));
});
