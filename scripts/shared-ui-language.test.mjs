import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const origin = 'https://www.michikusa-travel.com';
const query = '?train=Nozomi-1&board=Shinagawa&dir=west&focus=fuji&lang=en#journey';
const ready = window => window.document.dispatchEvent(new window.Event('mado:shared-ui-ready'));

test('shared chrome preserves the observed header element when filling its content', () => {
  const dom = new JSDOM('<html><body><header class="topbar" data-site-chrome-host="header" data-fallback="true">Fallback</header><script id="mado-shared-ui-config" type="application/json">{"root":"","mounts":[{"host":"header","kind":"header","component":"header"}]}</script></body></html>', { url: origin, runScripts: 'outside-only' });
  const w = dom.window;
  try {
    const header = w.document.querySelector('.topbar');
    let notifications = 0, clicks = 0;
    header.addEventListener('click', () => clicks++);
    w.document.addEventListener('mado:shared-ui-ready', () => notifications++);
    w.MADO_SHARED_UI = { version: 1, components: { header: '<header class="topbar" role="banner"><nav><a href="start.html">Start</a></nav></header>' }, menus: {} };
    w.eval(read('site-chrome.js'));
    assert.equal(w.MADO_SHARED_UI_RENDERED, true);
    assert.equal(w.document.querySelector('.topbar'), header);
    assert.equal(header.isConnected, true);
    assert.equal(header.hasAttribute('data-fallback'), false);
    assert.equal(header.hasAttribute('data-site-chrome-host'), false);
    assert.equal(header.getAttribute('role'), 'banner');
    header.querySelector('nav').click();
    assert.equal(clicks, 1);
    assert.equal(notifications, 1);
  } finally { dom.window.close(); }
});

test('foods: late chrome reconnects header height, chapter offsets and overflow menu', async () => {
  const dom = new JSDOM('<html><body><header class="topbar"></header><details id="source-details"></details><nav class="food-chapters"><a href="#first">First</a><a href="#second">Second</a></nav><section id="first"></section><section id="second"></section></body></html>', { url: origin + '/foods.html', runScripts: 'outside-only' });
  const w = dom.window;
  try {
    await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
    const observed = new Set();
    w.ResizeObserver = class { observe(node) { observed.add(node); } disconnect() { observed.clear(); } };
    const old = w.document.querySelector('.topbar');
    old.getBoundingClientRect = () => ({ height: old.isConnected ? 36 : 0 });
    w.document.getElementById('first').getBoundingClientRect = () => ({ top: 0 });
    w.document.getElementById('second').getBoundingClientRect = () => ({ top: 160 });
    w.eval(read('foods.js'));
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    assert.equal(w.document.documentElement.style.getPropertyValue('--food-header-height'), '36px');
    old.outerHTML = '<header class="topbar"><details class="top-nav-more"><summary>More</summary><a href="start.html">Start</a></details></header>';
    const header = w.document.querySelector('.topbar');
    header.getBoundingClientRect = () => ({ height: 72 });
    ready(w); ready(w);
    w.dispatchEvent(new w.Event('resize'));
    assert.equal(w.document.documentElement.style.getPropertyValue('--food-header-height'), '72px');
    assert.deepEqual([...observed], [header]);
    assert.equal(w.document.querySelector('.food-chapters a[href="#second"]').getAttribute('aria-current'), 'location');
    const menu = header.querySelector('details');
    menu.open = true;
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(menu.open, false);
    assert.equal(w.document.activeElement, menu.querySelector('summary'));
    menu.open = true;
    w.document.body.click();
    assert.equal(menu.open, false);
  } finally { dom.window.close(); }
});

function countClickListeners(window) {
  const counts = new WeakMap();
  const original = window.EventTarget.prototype.addEventListener;
  window.EventTarget.prototype.addEventListener = function (type, callback, options) {
    if (type === 'click') counts.set(this, (counts.get(this) || 0) + 1);
    return original.call(this, type, callback, options);
  };
  return element => counts.get(element) || 0;
}

for (const lang of ['ja', 'en']) {
  test(`app ${lang}: late chrome localizes and binds once without resetting journey/body state`, async () => {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', error => errors.push(error.message));
    const dom = new JSDOM(`<html lang="${lang}"><head><base href="${lang === 'ja' ? './' : '../'}"></head><body><main><p data-i18n="navStart">body</p></main><div id="late-header"></div></body></html>`, {
      url: `${origin}/${lang === 'ja' ? '' : 'en/'}start.html${query.replace('lang=en', 'lang=' + lang)}`, runScripts: 'outside-only', virtualConsole: vc,
    });
    const w = dom.window;
    try {
      await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
      const events = [];
      w.gtag = (...args) => events.push(args);
      w.__navigations = [];
      const count = countClickListeners(w);
      const context = dom.getInternalVMContext();
      for (const file of ['locales.js', 'data-runtime.js', 'track.js']) vm.runInContext(read(file), context, { filename: file });
      vm.runInContext(read('app.js').replace('location.href = localizedPageHref(nextLang);', 'window.__navigations.push(localizedPageHref(nextLang));'), context, { filename: 'app.js' });
      w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
      vm.runInContext('journey = { mode: "estimate", marker: "existing selection" }; activeGalleryFilters.clear(); activeGalleryFilters.add("night");', context);
      const before = vm.runInContext('JSON.stringify({ journey, filters: [...activeGalleryFilters], direction, boardId })', context);
      const body = w.document.querySelector('main p');
      body.textContent = 'body state after initial render';
      w.document.querySelector('#late-header').outerHTML = '<header class="topbar"><nav class="top-nav"><a href="start.html" data-i18n="navStart">stale</a><a data-guide-nav href="guide.html">guide</a><a data-live-nav href="live/">live</a></nav><div class="lang-switch"><button data-lang="ja">JA</button><button data-lang="en">EN</button></div></header>';
      ready(w); ready(w); ready(w);
      assert.equal(w.document.querySelector('[data-i18n="navStart"]').textContent, 'body state after initial render');
      assert.equal(w.document.querySelector('.topbar [data-i18n="navStart"]').textContent, lang === 'ja' ? '列車選択' : 'Train Search');
      assert.equal(w.document.querySelector('[data-guide-nav]').href, `${origin}/${lang === 'ja' ? '' : 'en/'}guide.html`);
      assert.equal(w.document.querySelector('[data-live-nav]').href, `${origin}/${lang === 'ja' ? '' : 'en/'}live/`);
      assert.equal(vm.runInContext('JSON.stringify({ journey, filters: [...activeGalleryFilters], direction, boardId })', context), before);
      assert.ok(w.document.querySelector(`[data-lang="${lang}"]`).classList.contains('active'));
      const destination = lang === 'ja' ? 'en' : 'ja';
      const button = w.document.querySelector(`[data-lang="${destination}"]`);
      assert.equal(count(button), 1);
      button.click();
      assert.equal(w.__navigations.length, 1);
      assert.equal(events.filter(event => event[1] === 'language_changed').length, 1);
      const url = new URL(w.__navigations[0]);
      assert.equal(url.pathname, `/${destination === 'ja' ? '' : 'en/'}start.html`);
      assert.equal(url.searchParams.get('train'), 'Nozomi-1');
      assert.equal(url.searchParams.get('board'), 'Shinagawa');
      assert.equal(url.searchParams.get('dir'), 'west');
      assert.equal(url.searchParams.get('lang'), destination);
      assert.equal(url.hash, '#journey');
      assert.equal(w.localStorage.getItem('mado-lang'), destination);
      assert.deepEqual(errors, []);
    } finally { w.close(); }
  });
}

for (const lang of ['ja', 'en', 'fr']) {
  test(`utility ${lang}: delayed language menu preserves its open state, route and click listener`, () => {
    const route = `${lang === 'ja' ? '' : lang + '/'}start.html`;
    const dom = new JSDOM(`<html lang="${lang}"><head><link rel="alternate" hreflang="zh-Hant" href="${origin}/zh-Hant/start.html"></head><body><div id="late-header"></div></body></html>`, { url: `${origin}/${route}${query}`, runScripts: 'outside-only' });
    const w = dom.window;
    try {
      const count = countClickListeners(w);
      w.eval(read('locales.js'));
      w.eval(read('utility-locales.js'));
      w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
      assert.equal(w.document.querySelector('.utility-lang-menu'), null);
      w.document.querySelector('#late-header').outerHTML = '<header class="topbar"><div class="lang-switch"></div></header>';
      ready(w);
      const menu = w.document.querySelector('.utility-lang-menu');
      assert.ok(menu);
      menu.open = true;
      ready(w); ready(w);
      w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
      assert.equal(w.document.querySelector('.utility-lang-menu'), menu);
      assert.equal(menu.open, true);
      assert.equal(w.document.querySelectorAll('.utility-lang-menu').length, 1);
      const destination = lang === 'ja' ? 'en' : 'ja';
      const link = menu.querySelector(`[lang="${destination}"]`);
      assert.equal(count(link), 1);
      let calls = 0;
      w.localizedPageHref = edition => {
        calls += 1;
        const target = new URL(`/${edition === 'ja' ? '' : edition + '/'}start.html`, origin);
        target.search = w.location.search;
        target.searchParams.set('lang', edition);
        target.searchParams.set('train', 'Nozomi-7');
        target.hash = w.location.hash;
        return target.href;
      };
      link.addEventListener('click', event => event.preventDefault());
      link.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
      assert.equal(calls, 1);
      const target = new URL(link.href);
      assert.equal(target.pathname, `/${destination === 'ja' ? '' : 'en/'}start.html`);
      assert.equal(target.searchParams.get('train'), 'Nozomi-7');
      assert.equal(target.searchParams.get('board'), 'Shinagawa');
      assert.equal(target.searchParams.get('lang'), destination);
      assert.equal(target.hash, '#journey');
      assert.equal(w.localStorage.getItem('mado-lang'), destination);
    } finally { w.close(); }
  });
}

for (const [lang, native] of [['ja', false], ['en', false], ['fr', false], ['en', true]]) {
  test(`live ${lang}${native ? ' native' : ''}: late header retains GPS state and localized routes with one click listener`, () => {
    const dom = new JSDOM(`<html lang="${lang}"><head></head><body><main>GPS state</main><div id="late-header"></div></body></html>`, { url: `${origin}/${lang === 'ja' ? '' : lang + '/'}live/${query}`, runScripts: 'outside-only' });
    const w = dom.window;
    try {
      const count = countClickListeners(w);
      w.__navigations = [];
      w.MADO_NATIVE_APP = native;
      const state = { lang, mode: 'gps', km: 123.4, paused: false, dir: 1, narrSpotId: 'fuji' };
      w.eval(`var state = ${JSON.stringify(state)}; var APP_ASSET_BASE = new URL(${JSON.stringify(origin + '/')}); var utilityLocale = ${lang === 'fr' ? '{ lang: "fr", href: function (route) { return "fr/" + route; } }' : 'null'}; function t(key) { return state.lang + ":" + key; }`);
      // Execute the real chrome connection section without starting GPS, audio,
      // Leaflet or timers. Navigation is observed instead of leaving JSDOM.
      const full = read('live/live.js');
      const start = full.indexOf('  function updateChromeLinks()');
      const end = full.indexOf('  document.getElementById("btn-narr-toggle").addEventListener', start);
      assert.ok(start > 0 && end > start);
      w.eval(full.slice(start, end).replace('location.href = destination.href;', 'window.__navigations.push(destination.href);'));
      w.document.querySelector('#late-header').outerHTML = '<header class="topbar"><a data-live-link="journey" data-live-copy="navStart" href="#wrong">old</a><button data-live-lang="ja">JA</button><button data-live-lang="en">EN</button></header>';
      ready(w); ready(w); ready(w);
      assert.equal(w.document.querySelector('[data-live-copy]').textContent, `${lang}:navStart`);
      const journey = new URL(w.document.querySelector('[data-live-link="journey"]').href);
      assert.equal(journey.pathname, `/${lang === 'ja' ? '' : lang + '/'}start.html`);
      assert.equal(journey.hash, lang === 'en' ? '#journey' : '');
      assert.equal(w.eval('JSON.stringify(state)'), JSON.stringify(state));
      const destination = lang === 'ja' ? 'en' : 'ja';
      const button = w.document.querySelector(`[data-live-lang="${destination}"]`);
      assert.equal(count(button), 1);
      button.click();
      assert.equal(w.__navigations.length, 1);
      const target = new URL(w.__navigations[0]);
      assert.equal(target.pathname, `/${destination === 'ja' ? '' : 'en/'}live/${native ? 'index.html' : ''}`);
      assert.equal(target.searchParams.get('train'), 'Nozomi-1');
      assert.equal(target.searchParams.get('board'), 'Shinagawa');
      assert.equal(target.searchParams.get('dir'), 'west');
      assert.equal(target.searchParams.get('lang'), destination);
      assert.equal(target.hash, '#journey');
      assert.equal(w.localStorage.getItem('madoLive.lang'), destination);
      assert.equal(w.localStorage.getItem('mado-lang'), destination);
      assert.equal(w.eval('JSON.stringify(state)'), JSON.stringify(state));
    } finally { w.close(); }
  });
}
