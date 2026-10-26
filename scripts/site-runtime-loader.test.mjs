import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { withSiteRuntimeLoader } from './shared/site-runtime-html.mjs';

const source = fs.readFileSync(new URL('../site-runtime-loader.js', import.meta.url), 'utf8');
const STYLES = ['style.css', 'spot-media-gallery.css'];
const SPOT_SCRIPTS = ['spot-page-shared-data.js', 'spot-page-shared.js', 'spot-media-gallery.js', 'spot-map.js'];
const FIXED = [...STYLES, ...SPOT_SCRIPTS, 'android-app-invite.js', 'site-chrome.js'];
const CHROME_ASSET = 'shared-ui/fr.discovery.js';
const EXTRA_ASSET = 'shared-ui/zh-hant.guide-reader.js';
const BASE = 'https://example.test/assets/';
function manifestFixture() {
  return {
    schema: 'mado-site-runtime', version: 1,
    assets: Object.fromEntries([...FIXED, CHROME_ASSET, EXTRA_ASSET].map((file, index) => [file, (index + 1).toString(16).repeat(8)])),
  };
}
const defaultChrome = { asset: CHROME_ASSET, root: '../', route: 'fr/guide.html', lang: 'fr', mounts: [] };

let thinHTMLPromise;
async function actualThinHTML() {
  thinHTMLPromise ||= import('./generate-spot-pages.mjs').then(({ spotPageHTML, SPOTS }) => spotPageHTML(SPOTS.find(spot => spot.id === 'tokyo-tower'), 'ja'));
  return thinHTMLPromise;
}
async function actualBootHTML() {
  const dom = new JSDOM(await actualThinHTML());
  try {
    const script = dom.window.document.getElementById('spot-page-boot');
    assert.ok(script, 'Thin page starts its bounded loading gate in the head');
    return dom.window.document.getElementById('spot-page-boot-style').outerHTML + script.outerHTML;
  } finally { dom.window.close(); }
}

test('generated thin fallback is readable immediately without JavaScript', async () => {
  const dom = new JSDOM(await actualThinHTML());
  try {
    const fallback = dom.window.document.querySelector('[data-spot-page-fallback]');
    assert.ok(fallback.querySelector('h1') && fallback.querySelector('p') && fallback.querySelector('a[href]'));
    assert.equal(dom.window.getComputedStyle(fallback.querySelector('h1')).visibility, 'visible');
    assert.equal(dom.window.document.documentElement.classList.contains('spot-page-loading'), false);
  } finally { dom.window.close(); }
});

test('head deadline reveals reading fallback even when the loader never executes', async () => {
  const dom = new JSDOM(await actualThinHTML(), { runScripts: 'outside-only' });
  try {
    const w = dom.window, timers = [], cleared = [];
    w.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
    w.clearTimeout = id => cleared.push(id);
    const script = w.document.getElementById('spot-page-boot');
    assert.ok(script);
    w.eval(script.textContent);
    const title = w.document.querySelector('[data-spot-page-fallback] h1');
    assert.equal(w.getComputedStyle(title).visibility, 'hidden');
    assert.equal(w.MADO_SPOT_PAGE_READY, undefined);
    assert.equal(timers.length, 1); assert.equal(timers[0].delay, 2000);
    timers[0].callback();
    assert.equal(w.getComputedStyle(title).visibility, 'visible');
    assert.equal(w.document.getElementById('spot-page-boot-style'), null);
    assert.deepEqual(cleared, [1]);
  } finally { dom.window.close(); }
});

test('thin loading gate hides fallback until readiness and cancels the head deadline', async t => {
  const h = harness(t, { autoLoad: false, bootHTML: await actualBootHTML() });
  assert.equal(h.w.getComputedStyle(h.document.querySelector('h1')).visibility, 'hidden');
  await flush();
  for (const file of [...STYLES, ...SPOT_SCRIPTS.slice(0, 2)]) h.finish(file);
  await h.w.MADO_SPOT_PAGE_READY;
  assert.equal(h.w.getComputedStyle(h.document.querySelector('h1')).visibility, 'visible');
  assert.equal(h.document.documentElement.classList.contains('spot-page-loading'), false);
  assert.deepEqual(h.clearedTimers, [1]);
  assert.equal(h.state.ready, true);
  for (const file of SPOT_SCRIPTS.slice(2)) h.finish(file);
  await h.settle();
});

test('required failure releases the loading gate while preserving readable fallback', async t => {
  const h = harness(t, { autoLoad: false, bootHTML: await actualBootHTML() });
  await flush();
  h.finish('style.css', false); await h.w.MADO_SPOT_PAGE_READY;
  assert.equal(h.w.getComputedStyle(h.document.querySelector('h1')).visibility, 'visible');
  assertReadingEntrances(h); assert.deepEqual(h.clearedTimers, [1]);
  assert.equal(h.document.documentElement.classList.contains('spot-page-loading'), false);
  for (const file of ['spot-media-gallery.css', ...SPOT_SCRIPTS]) h.finish(file, false);
  await h.settle();
});

test('thin entry registers readiness before earlier deferred page enhancements execute', () => {
  for (const enhancement of ['tokyo-sightline.js', 'fujimi-sightline.js']) {
    const html = `<html><head></head><body class="spot-page" data-spot-page-shared-mode="page"><main>Fallback</main><script defer src="../${enhancement}"></script></body></html>`;
    const output = withSiteRuntimeLoader(html, '../');
    const dom = new JSDOM(output);
    try {
      const scripts = [...dom.window.document.scripts];
      assert.equal(scripts[0].defer, true);
      assert.match(scripts[1].src, /site-runtime-loader\.js\?v=[a-f0-9]{8}$/);
      assert.equal(scripts[1].defer, false, 'Parser execution must register READY before deferred dependents');
      assert.equal(withSiteRuntimeLoader(output, '../'), output);
    } finally { dom.window.close(); }
  }
  for (const body of ['<body>', '<body data-spot-page-shared-mode="rail">', '<body data-spot-page-shared-mode="page" data-article-localized="">']) {
    const dom = new JSDOM(withSiteRuntimeLoader(`<html><head></head>${body}<main>Static article</main></body></html>`));
    try { assert.equal(dom.window.document.scripts[0].defer, true); } finally { dom.window.close(); }
  }
});

test('thin boot keeps explicitly visible descendants hidden until required CSS finishes', async t => {
  const h = harness(t, { autoLoad: false, extraArticle: '<aside class="spot-page-rail-spot is-current"><a><span class="spot-page-shared-preview">Current spot preview</span></a></aside>' });
  assert.equal(h.w.getComputedStyle(h.document.querySelector('#article h1')).visibility, 'visible', 'Static reading fallback remains available');
  await flush();
  const css = h.document.createElement('style');
  css.textContent = '.spot-page .spot-page-rail-spot.is-current .spot-page-shared-preview { visibility:visible; }';
  h.document.head.append(css);
  h.finish('style.css');
  h.finish('spot-page-shared-data.js'); h.finish('spot-page-shared.js'); await flush();
  const preview = h.document.querySelector('.spot-page-shared-preview');
  assert.equal(h.state.ready, false);
  assert.equal(h.w.getComputedStyle(preview).visibility, 'hidden', 'Child visibility must not escape the pending CSS gate');
  h.finish('spot-media-gallery.css'); await h.w.MADO_SITE_RUNTIME_READY;
  assert.equal(h.w.getComputedStyle(preview).visibility, 'visible');
  for (const file of SPOT_SCRIPTS.slice(2)) h.finish(file);
  await h.settle();
});

test('desktop and iOS never fetch Android code or an otherwise unused manifest', async t => {
  for (const userAgent of ['Mozilla/5.0 Windows NT 10.0 Chrome/130.0', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari/604.1']) {
    const ordinary = harness(t, { mode: 'ordinary', invite: true, userAgent });
    await ordinary.settle();
    assert.deepEqual(files(ordinary), []);
    assert.equal(ordinary.fetchCalls.length, 0);
    const translated = harness(t, { mode: 'translated', invite: true, userAgent });
    await translated.settle();
    assert.deepEqual(files(translated), [CHROME_ASSET, 'site-chrome.js']);
    assert.equal(translated.fetchCalls.length, 1);
    const thin = harness(t, { mode: 'thin', invite: true, userAgent });
    await thin.settle();
    assert.deepEqual(files(thin), [...STYLES, ...SPOT_SCRIPTS]);
  }
});

test('multiple selected shared UI packs download together and execute before the renderer', async t => {
  const h = harness(t, { mode: 'translated', chromeConfig: { ...defaultChrome, assets: [CHROME_ASSET, EXTRA_ASSET] }, autoLoad: false });
  await flush();
  assertUrls(h, [CHROME_ASSET, EXTRA_ASSET, 'site-chrome.js']);
  h.finish('site-chrome.js'); h.finish(EXTRA_ASSET);
  await flush();
  assert.deepEqual(h.executions, []);
  h.finish(CHROME_ASSET);
  await h.settle();
  assert.deepEqual(h.executions, [CHROME_ASSET, EXTRA_ASSET, 'site-chrome.js']);
});

test('empty, duplicate, oversized or unsafe pack lists preserve static UI without requesting packs', async t => {
  for (const assets of [[], [CHROME_ASSET, CHROME_ASSET], [CHROME_ASSET, '../evil.js'], [null], 'shared-ui/fr.shell.js', Array(9).fill(CHROME_ASSET)]) {
    const h = harness(t, { mode: 'translated', chromeConfig: { ...defaultChrome, assets }, invite: true });
    await h.settle();
    assert.deepEqual(files(h), ['android-app-invite.js']);
  }
});
async function flush() { for (let turn = 0; turn < 16; turn += 1) await Promise.resolve(); }

function harness(t, {
  mode = 'thin', invite = false, chromeConfig = mode === 'translated' ? defaultChrome : undefined,
  manifest = manifestFixture(), manifestError, jsonError, responseOK = true,
  protocol = 'https:', scriptSrc = protocol === 'file:' ? 'file:///C:/site/site-runtime-loader.js?v=entry' : BASE + 'site-runtime-loader.js?v=entry',
  autoLoad = true, failFiles = [], spotPayloadAvailable = true, spotRendered = true,
  chromeRendered = true, lang = 'ja', userAgent = 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.0.0 Mobile Safari/537.36',
  extraArticle = '', bootHTML = '',
} = {}) {
  const attributes = mode === 'thin' ? 'data-spot-page-shared-mode="page"'
    : mode === 'translated' ? 'data-spot-page-shared-mode="page" data-article-localized="fr"'
      : mode === 'other-mode' ? 'data-spot-page-shared-mode="rail"' : '';
  const originalArticle = '<h1>Existing title</h1><p>Existing lead</p><a href="../start.html">Train search</a>' + extraArticle;
  const hostAttribute = mode === 'thin' ? ' data-spot-page-shared-module="page"' : '';
  const dom = new JSDOM(`<html lang="${lang}"><head>${bootHTML || '<style id="spot-page-boot-style">.spot-page > :not([data-spot-page-shared-module]) { visibility:hidden; }</style>'}</head><body class="${mode === 'thin' ? 'spot-page' : ''}" ${attributes}><header id="page-header"><a href="../index.html">Original navigation</a></header><main id="article"${hostAttribute}>${originalArticle}</main><footer id="page-footer"><a href="../zukan.html">Original footer</a></footer></body></html>`, {
    url: protocol === 'file:' ? 'file:///C:/site/spots/fuji.html' : 'https://example.test/spots/fuji.html',
    runScripts: 'outside-only',
  });
  t.after(() => dom.window.close());
  const w = dom.window, document = w.document;
  Object.defineProperty(w.navigator, 'userAgent', { value: userAgent, configurable: true });
  const initialArticle = document.querySelector('#article').innerHTML;
  const initialHeader = document.querySelector('#page-header').innerHTML;
  const initialFooter = document.querySelector('#page-footer').innerHTML;
  for (const [id, config] of [['mado-shared-ui-config', chromeConfig], ['mado-android-invite-config', invite ? {} : undefined]]) {
    if (config === undefined) continue;
    const element = document.createElement('script'); element.type = 'application/json'; element.id = id;
    element.textContent = typeof config === 'string' ? config : JSON.stringify(config); document.body.append(element);
  }
  Object.defineProperty(document, 'currentScript', { value: { src: scriptSrc }, configurable: true });
  const events = [], downloads = [], executions = [], reveals = [], fetchCalls = [];
  const scripts = []; let executionIndex = 0;
  const state = { ready: false };
  const timers = [], clearedTimers = [];
  if (bootHTML) {
    w.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
    w.clearTimeout = id => clearedTimers.push(id);
    w.eval(document.getElementById('spot-page-boot').textContent);
  }
  const boot = document.getElementById('spot-page-boot-style');
  const removeBoot = boot.remove.bind(boot);
  boot.remove = () => { reveals.push({ downloads: [...downloads], executions: [...executions] }); removeBoot(); };
  const append = document.head.appendChild.bind(document.head);
  document.head.appendChild = element => {
    const url = element.tagName === 'LINK' ? element.href : element.src;
    const file = new URL(url).pathname.replace(/^.*\/(shared-ui\/[^/]+)$/, '$1').replace(/^(?!shared-ui\/).*\//, '');
    const event = { file, url, element, tag: element.tagName.toLowerCase(), complete: false };
    events.push(event); if (event.tag === 'script') scripts.push(event);
    append(element);
    if (autoLoad) Promise.resolve().then(() => finish(file));
    return element;
  };
  function execute(event) {
    executions.push(event.file);
    if (event.file === 'spot-page-shared-data.js') w.MADO_SPOT_PAGE_SHARED_DATA = {};
    if (event.file === 'spot-page-shared.js') {
      w.MADO_SPOT_PAGE_RENDERED = spotRendered && spotPayloadAvailable && !!w.MADO_SPOT_PAGE_SHARED_DATA;
      if (w.MADO_SPOT_PAGE_RENDERED) document.querySelector('#article').outerHTML = `<main id="article" data-rendered>${originalArticle}<section>Rendered article details</section></main>`;
    }
    if (event.file.startsWith('shared-ui/')) w.MADO_SHARED_UI_PAYLOAD_LOADED = event.file;
    if (event.file === 'site-chrome.js') {
      w.MADO_SHARED_UI_RENDERED = chromeRendered && !!w.MADO_SHARED_UI_PAYLOAD_LOADED;
      if (w.MADO_SHARED_UI_RENDERED) {
        document.querySelector('#page-header').innerHTML = '<a href="../index.html">Rendered navigation</a>';
        document.querySelector('#page-footer').innerHTML = '<a href="../zukan.html">Rendered footer</a>';
      }
    }
    event.element.onload(new w.Event('load'));
  }
  function finish(file, success = !failFiles.includes(file)) {
    const event = events.find(row => row.file === file);
    assert.ok(event, `asset requested: ${file}`);
    assert.equal(event.complete, false, `asset completes once: ${file}`);
    event.complete = true; event.failed = !success; downloads.push(file);
    if (event.tag === 'link') {
      if (success) event.element.onload(new w.Event('load'));
      else event.element.onerror(new w.Event('error'));
      return;
    }
    // Browser classic-script ordering permits downloads to finish out of order.
    // async=false and insertion order are also asserted independently below.
    while (scripts[executionIndex]?.complete) {
      const next = scripts[executionIndex++];
      if (next.failed) next.element.onerror(new w.Event('error'));
      else execute(next);
    }
  }
  w.fetch = (url, options) => {
    fetchCalls.push({ url, options });
    if (manifestError) return Promise.reject(manifestError);
    return Promise.resolve({ ok: responseOK, json: () => jsonError ? Promise.reject(jsonError) : Promise.resolve(manifest) });
  };
  w.eval(source);
  w.MADO_SITE_RUNTIME_READY.then(() => { state.ready = true; });
  return { w, document, events, downloads, executions, reveals, fetchCalls, finish, state, timers, clearedTimers,
    initialArticle, initialHeader, initialFooter,
    async settle() { await w.MADO_SITE_RUNTIME_READY; await w.MADO_SITE_ENHANCEMENTS_READY; await flush(); },
  };
}

function files(h) { return h.events.map(event => event.file); }
function assertUrls(h, expectedFiles, { versioned = true, base = BASE } = {}) {
  const manifest = manifestFixture();
  assert.deepEqual(h.events.map(event => event.url), expectedFiles.map(file => base + file + (versioned ? '?v=' + manifest.assets[file].slice(0, 8) : '')));
}
function assertReadingEntrances(h) {
  assert.equal(h.document.querySelector('h1').textContent, 'Existing title');
  assert.equal(h.document.querySelector('#article p').textContent, 'Existing lead');
  assert.equal(h.document.querySelector('#article a').getAttribute('href'), '../start.html');
  assert.ok(h.document.querySelector('#page-header a'));
  assert.ok(h.document.querySelector('#page-footer a'));
}

test('thin pages fetch one small no-cache manifest and version only their fixed assets', async t => {
  const h = harness(t); await h.settle();
  assertUrls(h, [...STYLES, ...SPOT_SCRIPTS]);
  assert.equal(h.fetchCalls.length, 1);
  assert.equal(h.fetchCalls[0].url, BASE + 'site-runtime.json');
  assert.equal(h.fetchCalls[0].options.cache, 'no-cache');
  assert.equal(h.w.MADO_SITE_RUNTIME_READY, h.w.MADO_SPOT_PAGE_READY);
  assert.equal(h.w.MADO_SPOT_PAGE_RENDERED, true);
  assert.equal(h.reveals.length, 1); assertReadingEntrances(h);
});

test('ordinary invitation pages become ready without waiting for optional invitation download', async t => {
  const h = harness(t, { mode: 'ordinary', invite: true, autoLoad: false }); await flush();
  assertUrls(h, ['android-app-invite.js']);
  assert.equal(h.fetchCalls.length, 1);
  assert.equal(h.state.ready, true);
  assert.equal(h.w.MADO_SPOT_PAGE_READY, undefined);
  let enhanced = false; h.w.MADO_SITE_ENHANCEMENTS_READY.then(() => { enhanced = true; }); await flush();
  assert.equal(enhanced, false);
  assert.equal(h.document.querySelector('#article').innerHTML, h.initialArticle);
  h.finish('android-app-invite.js'); await h.settle(); assert.equal(enhanced, true);
});

test('localized chrome plus invitation loads payload before renderer and never activates thin-page rendering', async t => {
  const h = harness(t, { mode: 'translated', invite: true, autoLoad: false }); await flush();
  assertUrls(h, [CHROME_ASSET, 'site-chrome.js', 'android-app-invite.js']);
  assert.equal(h.fetchCalls.length, 1); assert.equal(h.w.MADO_SPOT_PAGE_READY, undefined);
  assert.equal(h.state.ready, false);
  h.finish('site-chrome.js'); await flush();
  assert.deepEqual(h.executions, []); assert.equal(h.state.ready, false);
  h.finish(CHROME_ASSET); await h.w.MADO_SITE_RUNTIME_READY;
  assert.equal(h.w.MADO_SHARED_UI_RENDERED, true);
  assert.deepEqual(h.executions, [CHROME_ASSET, 'site-chrome.js']);
  assert.equal(h.document.querySelector('#article').innerHTML, h.initialArticle);
  assert.match(h.document.querySelector('#page-header').textContent, /Rendered navigation/);
  h.finish('android-app-invite.js'); await h.settle();
});

test('thin detection requires page mode and absence of the article-localized marker', async t => {
  for (const mode of ['ordinary', 'other-mode', 'translated']) {
    const h = harness(t, { mode, invite: true, chromeConfig: undefined }); await h.settle();
    assert.deepEqual(files(h), mode === 'translated' ? [CHROME_ASSET, 'site-chrome.js', 'android-app-invite.js'] : ['android-app-invite.js']);
    assert.equal(h.w.MADO_SPOT_PAGE_READY, undefined);
    assert.equal(h.w.MADO_SPOT_PAGE_RENDERED, undefined);
  }
});

test('thin articles and invitations share one manifest and do not wait for optional assets', async t => {
  const h = harness(t, { invite: true, autoLoad: false }); await flush();
  assertUrls(h, [...STYLES, ...SPOT_SCRIPTS, 'android-app-invite.js']);
  assert.equal(h.fetchCalls.length, 1);
  for (const file of [...STYLES, ...SPOT_SCRIPTS.slice(0, 2)]) h.finish(file);
  await h.w.MADO_SITE_RUNTIME_READY;
  assert.equal(h.state.ready, true); assert.equal(h.reveals.length, 1);
  assert.deepEqual(h.executions, SPOT_SCRIPTS.slice(0, 2));
  for (const file of [...SPOT_SCRIPTS.slice(2), 'android-app-invite.js']) h.finish(file);
  await h.settle(); assertReadingEntrances(h);
});

test('asset downloads start together while classic-script execution stays ordered and CSS gates reveal', async t => {
  const h = harness(t, { invite: true, autoLoad: false }); await flush();
  assert.equal(h.events.length, 7); assert.equal(h.downloads.length, 0);
  assert.ok(h.events.filter(event => event.tag === 'script').every(event => event.element.async === false));
  for (const file of ['android-app-invite.js', 'spot-map.js', 'spot-media-gallery.js', 'spot-page-shared.js']) h.finish(file);
  assert.deepEqual(h.executions, []);
  h.finish('spot-page-shared-data.js'); await flush();
  assert.deepEqual(h.executions, [...SPOT_SCRIPTS, 'android-app-invite.js']);
  assert.equal(h.state.ready, false); assert.equal(h.reveals.length, 0);
  h.finish('style.css'); await flush(); assert.equal(h.reveals.length, 0);
  h.finish('spot-media-gallery.css'); await h.settle(); assert.equal(h.reveals.length, 1);
});

test('file URLs never fetch JSON and preserve relative fallback loading for every page profile', async t => {
  for (const mode of ['thin', 'ordinary', 'translated']) {
    const h = harness(t, { mode, invite: true, protocol: 'file:' }); await h.settle();
    const wanted = mode === 'thin' ? [...STYLES, ...SPOT_SCRIPTS, 'android-app-invite.js']
      : mode === 'translated' ? [CHROME_ASSET, 'site-chrome.js', 'android-app-invite.js'] : ['android-app-invite.js'];
    assert.equal(h.fetchCalls.length, 0); assertUrls(h, wanted, { versioned: false, base: 'file:///C:/site/' });
    assertReadingEntrances(h);
  }
});

test('fetch, HTTP and JSON parse failures recover using safe unversioned relative assets', async t => {
  for (const options of [{ manifestError: new Error('offline') }, { responseOK: false }, { jsonError: new SyntaxError('invalid JSON') }]) {
    const h = harness(t, { ...options, mode: 'translated', invite: true }); await h.settle();
    assertUrls(h, [CHROME_ASSET, 'site-chrome.js', 'android-app-invite.js'], { versioned: false });
    assert.equal(h.w.MADO_SHARED_UI_RENDERED, true); assertReadingEntrances(h);
  }
});

test('invalid schema or hashes reject the complete manifest instead of partially accepting it', async t => {
  const badHash = manifestFixture(); badHash.assets['style.css'] = 'A'.repeat(64);
  const shortHash = manifestFixture(); shortHash.assets['site-chrome.js'] = 'a'.repeat(7);
  const objectHash = manifestFixture(); objectHash.assets['android-app-invite.js'] = { url: 'https://evil.test/invite.js' };
  for (const manifest of [null, [], {}, { ...manifestFixture(), schema: 'mado-spot-page-runtime' },
    { ...manifestFixture(), version: 2 }, { ...manifestFixture(), version: '1' },
    { ...manifestFixture(), assets: [] }, badHash, shortHash, objectHash]) {
    const h = harness(t, { manifest }); await h.settle();
    assertUrls(h, [...STYLES, ...SPOT_SCRIPTS], { versioned: false });
    assert.equal(h.document.querySelector('.spot-page-load-error'), null);
  }
});

test('missing any required fixed asset invalidates all manifest hashes', async t => {
  for (const file of FIXED) {
    const manifest = manifestFixture(); delete manifest.assets[file];
    const h = harness(t, { manifest }); await h.settle();
    assertUrls(h, [...STYLES, ...SPOT_SCRIPTS], { versioned: false });
  }
});

const unsafeAssets = ['https://evil.test/a.js', '//evil.test/a.js', '/site-chrome.js', '../site-chrome.js',
  './style.css', 'style.css?next=evil', 'shared-ui/fr.discovery.js?x=1', 'shared-ui/fr.discovery.js#x',
  'shared-ui/../site-chrome.js', 'shared-ui/fr_discovery.js', 'shared-ui/FR.discovery.js',
  'shared-ui/fr.discovery/extra.js', 'shared-ui/%2e%2e.discovery.js', 'shared-ui\\fr.discovery.js', '__proto__'];

test('unsafe manifest asset keys never introduce a URL or partially version valid requests', async t => {
  for (const asset of unsafeAssets) {
    const manifest = manifestFixture(); Object.defineProperty(manifest.assets, asset, { value: 'a'.repeat(64), enumerable: true });
    const h = harness(t, { manifest, mode: 'translated', invite: true }); await h.settle();
    assertUrls(h, [CHROME_ASSET, 'site-chrome.js', 'android-app-invite.js'], { versioned: false });
  }
});

test('malformed chrome config cannot request arbitrary assets or prevent the optional invitation', async t => {
  for (const chromeConfig of ['{', 'null', '[]', '{}', ...[...unsafeAssets, 'style.css', 'site-chrome.js'].map(asset => ({ asset }))]) {
    const h = harness(t, { mode: 'translated', chromeConfig, invite: true }); await h.settle();
    assertUrls(h, ['android-app-invite.js']);
    assert.equal(h.document.querySelector('#article').innerHTML, h.initialArticle);
    assert.equal(h.document.querySelector('#page-header').innerHTML, h.initialHeader);
  }
});

test('lowercase hyphenated language and profile payload names are allowed without loading unused assets', async t => {
  const h = harness(t, { mode: 'translated', chromeConfig: { ...defaultChrome, asset: EXTRA_ASSET } }); await h.settle();
  assertUrls(h, [EXTRA_ASSET, 'site-chrome.js']);
  assert.equal(h.w.MADO_SHARED_UI_RENDERED, true);
});

test('required CSS or catalog/renderer download failures retain readable title, lead and navigation', async t => {
  for (const file of [...STYLES, ...SPOT_SCRIPTS.slice(0, 2)]) {
    const h = harness(t, { failFiles: [file] }); await h.settle();
    assertReadingEntrances(h); assert.equal(h.reveals.length, 1);
    if (SPOT_SCRIPTS.includes(file)) assert.match(h.document.querySelector('.spot-page-load-error').textContent, /再読み込み/);
  }
});

test('missing spot payload or unsuccessful renderer flag preserves fallback and appends an error', async t => {
  for (const options of [{ spotPayloadAvailable: false }, { spotRendered: false }]) {
    const h = harness(t, { ...options, lang: 'en' }); await h.settle();
    assertReadingEntrances(h);
    const host = h.document.querySelector('[data-spot-page-shared-module="page"]');
    assert.ok(host.innerHTML.startsWith(h.initialArticle));
    assert.equal(host.querySelectorAll('.spot-page-load-error').length, 1);
    assert.match(host.querySelector('.spot-page-load-error').textContent, /Unable to load/);
  }
});

test('translated payload or renderer failure leaves static article and navigation available', async t => {
  for (const options of [{ failFiles: [CHROME_ASSET] }, { failFiles: ['site-chrome.js'] }, { chromeRendered: false }]) {
    const h = harness(t, { ...options, mode: 'translated', invite: true }); await h.settle();
    assert.equal(h.document.querySelector('#article').innerHTML, h.initialArticle);
    assert.equal(h.document.querySelector('#page-header').innerHTML, h.initialHeader);
    assert.equal(h.document.querySelector('#page-footer').innerHTML, h.initialFooter);
    assert.equal(h.reveals.length, 1); assert.ok(h.executions.includes('android-app-invite.js'));
  }
});

test('optional invitation, gallery or map failures keep the rendered article and other enhancements', async t => {
  for (const file of ['android-app-invite.js', ...SPOT_SCRIPTS.slice(2)]) {
    const h = harness(t, { invite: true, failFiles: [file] }); await h.settle();
    assert.equal(h.w.MADO_SPOT_PAGE_RENDERED, true);
    assert.ok(h.document.querySelector('#article[data-rendered]'));
    assert.equal(h.document.querySelector('.spot-page-load-error'), null);
    assertReadingEntrances(h); assert.equal(h.reveals.length, 1);
    for (const other of ['android-app-invite.js', ...SPOT_SCRIPTS.slice(2)].filter(value => value !== file)) assert.ok(h.executions.includes(other));
  }
});

test('early CSS rejection handles later required and optional failures without unhandled rejections', async t => {
  const h = harness(t, { invite: true, autoLoad: false }); await flush();
  h.finish('style.css', false); await h.w.MADO_SITE_RUNTIME_READY;
  assertReadingEntrances(h); assert.equal(h.reveals.length, 1);
  h.finish('spot-media-gallery.css', false);
  for (const file of [...SPOT_SCRIPTS, 'android-app-invite.js']) h.finish(file, false);
  await h.settle();
  assert.equal(h.document.querySelectorAll('.spot-page-load-error').length, 1);
});
