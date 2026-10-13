import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync(new URL('../app-embedded.js', import.meta.url), 'utf8');
const origin = 'https://www.michikusa-travel.com';
const languages = ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko'];
const prefix = language => language === 'ja' ? '/' : `/${language}/`;
const capabilities = language => ({
  source: 'michikusa-native-host', version: 1, type: 'capabilities',
  payload: { navigationVersion: 2, language },
});

function fixture({ language = 'ja', embedded = true, host = true, path = 'spots/kiyosu.html' } = {}) {
  const url = `${origin}${prefix(language)}${path}${embedded ? '?from=android-app&madoBuild=test' : ''}`;
  const dom = new JSDOM('<!doctype html><html><body><main><h1>Article</h1><section id="photos"></section></main></body></html>', { url, runScripts: 'outside-only' });
  const w = dom.window;
  const messages = [];
  const shares = [];
  const parent = { postMessage(message, targetOrigin) { messages.push({ message: JSON.parse(JSON.stringify(message)), targetOrigin }); } };
  if (host) Object.defineProperty(w, 'parent', { value: parent, configurable: true });
  Object.defineProperty(w.document, 'readyState', { value: 'complete', configurable: true });
  w.navigator.share = data => { shares.push(JSON.parse(JSON.stringify(data))); return Promise.resolve(); };
  w.Capacitor = { Plugins: {} };
  w.eval(source);
  const send = (data, { origin = 'https://localhost', sender = parent } = {}) => {
    // postMessage's structured clone creates records in the receiving realm.
    const cloned = w.JSON.parse(JSON.stringify(data));
    w.dispatchEvent(new w.MessageEvent('message', { origin, source: sender, data: cloned }));
  };
  function click(href, attrs = {}) {
    const link = w.document.createElement('a');
    link.href = href;
    link.textContent = 'Link';
    for (const [name, value] of Object.entries(attrs)) link.setAttribute(name, value);
    w.document.querySelector('main').appendChild(link);
    return clickElement(link);
  }
  function clickElement(link) {
    let handled = false;
    link.addEventListener('click', event => { handled = event.defaultPrevented; event.preventDefault(); }, { once: true });
    link.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
    return { handled, link };
  }
  return {
    w, messages, shares, parent, send, click, clickElement,
    ready: language => send(capabilities(language)),
    navigation: () => messages.filter(entry => entry.message.type === 'navigation').map(entry => entry.message.payload),
    external: () => messages.filter(entry => entry.message.type === 'external').map(entry => entry.message.payload),
    notice: () => w.document.getElementById('mado-embedded-navigation-notice'),
    close: () => w.close(),
  };
}

test('ordinary Web keeps its navigation, analytics, Capacitor and share behavior', async () => {
  const f = fixture({ embedded: false });
  try {
    assert.equal(f.w.MADO_EMBEDDED_WEB, undefined);
    assert.equal(f.w.document.documentElement.classList.contains('mado-embedded-web'), false);
    assert.ok(f.w.Capacitor);
    f.ready('ko');
    assert.equal(f.click('/ko/start.html').handled, false);
    assert.equal(f.messages.length, 0);
    const url = `${origin}/spots/kiyosu.html?from=android-app&madoBuild=test`;
    await f.w.navigator.share({ url });
    assert.equal(f.shares[0].url, url);
  } finally { f.close(); }
});

for (const language of languages) {
  test(`${language}: native destinations use the host's selected language and bounded hashes`, () => {
    const f = fixture({ language });
    try {
      f.ready(language === 'ko' ? 'fr' : 'ko');
      const routes = [
        ['index.html#journey', 'home', '#journey'],
        ['start.html#journey', 'train', '#journey'],
        ['start.html#timelineSection', 'train', '#timelineSection'],
        ['zukan.html', 'gallery', ''],
        ['journal.html#stampboard', 'journal', '#stampboard'],
        ['live/index.html', 'live', ''],
        ['live/', 'live', ''],
        ['start.html?lang=ja&url=https://example.com#untrusted', 'train', ''],
      ];
      for (const [route] of routes) assert.equal(f.click(`${prefix(language)}${route}`).handled, true);
      assert.deepEqual(f.navigation(), routes.map(([, screen, hash]) => ({ kind: 'native', screen, hash })));
      assert.equal(f.click(prefix(language)).handled, true);
      assert.deepEqual(f.navigation().at(-1), { kind: 'native', screen: 'home', hash: '' });
      assert.equal(f.click('#', { 'data-native-route': 'settings' }).handled, true);
      assert.deepEqual(f.navigation().at(-1), { kind: 'native', screen: 'settings', hash: '' });
      assert.equal(f.click('/guide.html', { 'data-native-route': `${language === 'ja' ? '' : language + '/'}journal.html#stampboard` }).handled, true);
      assert.deepEqual(f.navigation().at(-1), { kind: 'native', screen: 'journal', hash: '#stampboard' });
      assert.equal(f.notice(), null);
    } finally { f.close(); }
  });

  test(`${language}: old hosts and standalone marked URLs explain native actions without switching language`, () => {
    for (const host of [true, false]) {
      const f = fixture({ language, host });
      try {
        const before = f.w.location.href;
        assert.equal(f.click(`${prefix(language)}journal.html#stampboard`).handled, true);
        assert.deepEqual(f.navigation(), []);
        assert.deepEqual(f.external(), []);
        assert.equal(f.w.location.href, before);
        assert.equal(f.notice().lang, language);
        assert.equal(f.notice().getAttribute('role'), 'status');
        assert.equal(f.notice().getAttribute('aria-live'), 'polite');
        assert.ok(f.notice().textContent.length > 20);
        assert.equal(f.notice().querySelector('a'), null);
        f.notice().querySelector('button').click();
        assert.equal(f.notice().hidden, true);
        if (host) {
          f.ready(language);
          f.click(`${prefix(language)}journal.html#stampboard`);
          assert.deepEqual(f.navigation(), [{ kind: 'native', screen: 'journal', hash: '#stampboard' }]);
        }
      } finally { f.close(); }
    }
  });

  test(`${language}: supported article families stay inside the capable app and announce the correct edition`, () => {
    const f = fixture({ language });
    try {
      const ready = f.messages.find(entry => entry.message.type === 'content-ready').message.payload;
      assert.equal(ready.language, language);
      assert.equal(ready.content_id, 'kiyosu');
      assert.equal(ready.content_type, 'spot_detail');
      assert.equal(ready.page_location, `${origin}${prefix(language)}spots/kiyosu.html`);
      f.ready('ko');
      const paths = ['spots/fuji.html', 'sparkling-dreams.html', 'hanabi.html', 'yakei.html', '727-collection.html', 'castles.html', 'ferris-wheels.html', 'window-moments.html'];
      for (const path of paths) assert.equal(f.click(`${prefix(language)}${path}?view=photo#gallery`).handled, true);
      assert.deepEqual(f.navigation(), paths.map(path => ({ kind: 'web', path: `${prefix(language)}${path}`, search: '?view=photo', hash: '#gallery' })));
      assert.deepEqual(f.external(), []);
    } finally { f.close(); }
  });
}

test('legacy JA/EN related article support agrees with Android 1.0.27', () => {
  const f = fixture();
  try {
    for (const language of ['ja', 'en']) {
      for (const path of ['spots/fuji.html', 'sparkling-dreams.html', 'hanabi.html', 'yakei.html', 'castles.html', 'ferris-wheels.html', 'window-moments.html']) {
        f.click(`${prefix(language)}${path}`);
        assert.deepEqual(f.navigation().at(-1), { kind: 'web', path: `${prefix(language)}${path}`, search: '', hash: '' });
      }
    }
    f.click('/727-collection.html');
    assert.equal(f.navigation().at(-1).path, '/727-collection.html');
    assert.equal(f.notice(), null);
    f.click('/en/727-collection.html');
    assert.equal(f.notice().hidden, false);
    assert.deepEqual(f.external(), []);
  } finally { f.close(); }
});

test('older hosts explain additional editions and only leave the app on an explicit browser action', () => {
  for (const language of languages.slice(2)) {
    const f = fixture({ language });
    try {
      f.click(`${prefix(language)}castles.html?from=android-app&madoBuild=old&lang=ja#photos`);
      assert.deepEqual(f.navigation(), []);
      assert.deepEqual(f.external(), []);
      assert.equal(f.notice().hidden, false);
      assert.equal(f.notice().lang, language);
      const browserLink = f.notice().querySelector('a');
      assert.equal(browserLink.href, `${origin}${prefix(language)}castles.html#photos`);
      assert.equal(f.clickElement(browserLink).handled, true);
      assert.deepEqual(f.external(), [{ url: browserLink.href, forceBrowser: true }]);
    } finally { f.close(); }
  }
});

test('standalone marker links show article fallback and preserve ordinary external navigation', () => {
  const f = fixture({ host: false });
  try {
    f.click('/castles.html');
    assert.equal(f.notice().hidden, false);
    assert.equal(f.clickElement(f.notice().querySelector('a')).handled, false);
    assert.equal(f.click('https://example.com/reference').handled, false);
    assert.deepEqual(f.navigation(), []);
    assert.deepEqual(f.external(), []);
  } finally { f.close(); }
});

test('relative links follow the document base and invalid explicit app URLs remain ordinary links', () => {
  const f = fixture({ language: 'ko' });
  try {
    f.ready('ko');
    const base = f.w.document.createElement('base');
    base.href = `${origin}/fr/`;
    f.w.document.head.appendChild(base);
    f.click('journal.html#stampboard');
    assert.deepEqual(f.navigation(), [{ kind: 'native', screen: 'journal', hash: '#stampboard' }]);
    f.click('castles.html');
    assert.deepEqual(f.navigation().at(-1), { kind: 'web', path: '/fr/castles.html', search: '', hash: '' });
    f.click('https://example.com/source', { 'data-native-route': 'https://attacker.example/start.html' });
    assert.deepEqual(f.external(), [{ url: 'https://example.com/source' }]);
  } finally { f.close(); }
});

test('capabilities require the exact parent, trusted origin and supported plain schema', () => {
  const invalid = [
    [capabilities('ko'), { origin: origin }],
    [capabilities('ko'), { origin: 'http://localhost' }],
    [capabilities('ko'), { origin: 'https://localhost.attacker.example' }],
    [capabilities('ko'), { sender: {} }],
    [{ ...capabilities('ko'), source: 'other' }],
    [{ ...capabilities('ko'), version: 2 }],
    [{ ...capabilities('ko'), type: 'navigation' }],
    [{ ...capabilities('ko'), payload: [] }],
    [{ ...capabilities('ko'), payload: null }],
    [{ ...capabilities('ko'), payload: { navigationVersion: '2', language: 'ko' } }],
    [{ ...capabilities('ko'), payload: { navigationVersion: 2, language: 'ar' } }],
    [{ ...capabilities('ko'), payload: { navigationVersion: 2, language: 'ko', route: 'index.html' } }],
    [null],
  ];
  for (const [message, options] of invalid) {
    const f = fixture();
    try {
      f.send(message, options);
      f.click('/start.html');
      assert.deepEqual(f.navigation(), []);
      assert.equal(f.notice().hidden, false);
    } finally { f.close(); }
  }
});

test('same-page anchors preserve the embedded URL, while known external destinations use browser messages', () => {
  const f = fixture({ language: 'ko' });
  try {
    f.ready('ko');
    assert.equal(f.click(`${origin}/ko/spots/kiyosu.html#photos`).handled, true);
    assert.equal(f.w.location.hash, '#photos');
    assert.equal(new URL(f.w.location.href).searchParams.get('from'), 'android-app');
    assert.equal(f.click('#photos').handled, false);
    assert.deepEqual(f.navigation(), []);
    assert.deepEqual(f.external(), []);
    for (const url of [`${origin}/window-trip.html?from=android-app`, 'https://example.com/source']) f.click(url);
    assert.deepEqual(f.external(), [{ url: `${origin}/window-trip.html` }, { url: 'https://example.com/source' }]);
    const count = f.external().length;
    assert.equal(f.click('/photo.jpg', { download: '' }).handled, false);
    assert.equal(f.click('mailto:test@example.com').handled, false);
    assert.equal(f.click('tel:0123456789').handled, false);
    assert.equal(f.external().length, count);
  } finally { f.close(); }
});

test('share links are canonical, analytics remain bridged, and pageshow reannounces restored articles', async () => {
  const f = fixture({ language: 'fr' });
  try {
    assert.equal(f.w.Capacitor, undefined);
    await f.w.navigator.share({ title: 'Castle', url: `${origin}/fr/castles.html?from=android-app&madoBuild=123&lang=ja#photos` });
    assert.deepEqual(f.shares, [{ title: 'Castle', url: `${origin}/fr/castles.html#photos` }]);
    f.w.gtag('event', 'photo_open', { spot_id: 'kiyosu' });
    assert.deepEqual(f.messages.at(-1).message, { source: 'michikusa-embedded-web', version: 1, type: 'analytics-event', payload: { name: 'photo_open', params: { spot_id: 'kiyosu' } } });
    const count = f.messages.filter(entry => entry.message.type === 'content-ready').length;
    f.w.dispatchEvent(new f.w.PageTransitionEvent('pageshow', { persisted: true }));
    assert.equal(f.messages.filter(entry => entry.message.type === 'content-ready').length, count + 1);
    assert.equal(f.messages.at(-1).message.payload.content_path, '/fr/spots/kiyosu.html');
  } finally { f.close(); }
});

test('same-document hash navigation and Back announce the current article fragment', async () => {
  const f = fixture({ language: 'ko' });
  const canonical = `${origin}/ko/spots/kiyosu.html`;
  const changeHash = action => new Promise(resolve => {
    f.w.addEventListener('hashchange', resolve, { once: true });
    action();
  });
  const latestReady = () => f.messages.filter(entry => entry.message.type === 'content-ready').at(-1).message.payload;
  try {
    await changeHash(() => f.click(`${canonical}#photos`));
    assert.equal(latestReady().page_location, `${canonical}#photos`);
    await changeHash(() => { f.w.location.hash = '#references'; });
    assert.equal(latestReady().page_location, `${canonical}#references`);
    await changeHash(() => f.w.history.back());
    assert.equal(f.w.location.hash, '#photos');
    assert.equal(latestReady().page_location, `${canonical}#photos`);
    await changeHash(() => f.w.history.back());
    assert.equal(f.w.location.hash, '');
    assert.equal(latestReady().page_location, canonical);
    assert.equal(latestReady().content_path, '/ko/spots/kiyosu.html');
    assert.equal(new URL(f.w.location.href).searchParams.get('from'), 'android-app');
    assert.deepEqual(f.navigation(), []);
  } finally { f.close(); }
});
