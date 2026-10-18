import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync(new URL('../app-embedded.js', import.meta.url), 'utf8');
const embeddedCss = fs.readFileSync(new URL('../app-embedded.css', import.meta.url), 'utf8');
const localeSource = fs.readFileSync(new URL('../locales.js', import.meta.url), 'utf8');
const utilityLocaleSource = fs.readFileSync(new URL('../utility-locales.js', import.meta.url), 'utf8');
const origin = 'https://www.michikusa-travel.com';
const languages = ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko'];
const prefix = language => language === 'ja' ? '/' : `/${language}/`;
const capabilities = language => ({
  source: 'michikusa-native-host', version: 1, type: 'capabilities',
  payload: { navigationVersion: 2, language },
});

function fixture({ language = 'ja', embedded = true, host = true, path = 'spots/kiyosu.html', html = '<!doctype html><html><body><main><h1>Article</h1><section id="photos"></section></main></body></html>' } = {}) {
  const url = `${origin}${prefix(language)}${path}${embedded ? '?from=android-app&madoBuild=test' : ''}`;
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
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

test('new articles keep public URL requests compatible with old hosts before and after capabilities', () => {
  for (const language of languages) {
    const paths = ['guide.html'];
    if (['ja', 'en'].includes(language)) paths.push('arenani.html', 'reflections.html');
    for (const path of paths) {
      const f = fixture({ language, path });
      try {
        const href = `${prefix(language)}${path}?view=photo#references`;
        assert.equal(f.click(href).handled, true);
        assert.deepEqual(f.navigation(), [], `${href} is not an old host navigation route`);
        assert.deepEqual(f.external(), [{ url: origin + href }]);
        assert.equal(f.notice(), null);
        f.ready(language);
        f.click(href);
        assert.deepEqual(f.navigation(), []);
        assert.deepEqual(f.external().at(-1), { url: origin + href });
      } finally { f.close(); }
      const standalone = fixture({ language, path, host: false });
      try {
        const href = `${origin}${prefix(language)}${path}?view=photo&from=android-app&madoBuild=old#references`;
        const clicked = standalone.click(href);
        assert.equal(clicked.handled, false);
        assert.equal(clicked.link.href, `${origin}${prefix(language)}${path}?view=photo#references`);
        assert.equal(standalone.notice(), null);
        assert.deepEqual(standalone.navigation(), []);
      } finally { standalone.close(); }
    }
  }
});

test('new article families accept only their published editions', () => {
  const f = fixture();
  try {
    const unsupported = languages.slice(2).flatMap(language => ['arenani.html', 'reflections.html'].map(path => `${prefix(language)}${path}`));
    unsupported.push('/ar/guide.html');
    for (const path of unsupported) f.click(path);
    assert.deepEqual(f.navigation(), []);
    assert.deepEqual(f.external(), unsupported.map(path => ({ url: origin + path })));
    const arabicGuide = fs.readFileSync(new URL('../ar/guide.html', import.meta.url), 'utf8');
    assert.doesNotMatch(arabicGuide, /app-embedded\.(?:js|css)/);
  } finally { f.close(); }
});

for (const language of languages) {
  test(`${language}: real Fuji guide loads embedded mode before chrome and keeps article, train and language links usable`, () => {
    const route = `${language === 'ja' ? '' : language + '/'}guide.html`;
    const html = fs.readFileSync(new URL('../' + route, import.meta.url), 'utf8');
    const f = fixture({ language, path: 'guide.html', html });
    try {
      f.w.eval(localeSource);
      f.w.eval(utilityLocaleSource);
      assert.equal((html.match(/app-embedded\.js/g) || []).length, 1);
      assert.equal((html.match(/app-embedded\.css/g) || []).length, 1);
      assert.ok(html.indexOf('app-embedded.js') < html.indexOf('style.css'));
      const style = f.w.document.createElement('style');
      style.textContent = embeddedCss;
      f.w.document.head.appendChild(style);
      assert.equal(f.w.getComputedStyle(f.w.document.querySelector('.topbar')).display, 'none');
      assert.equal(f.w.getComputedStyle(f.w.document.querySelector('.footer')).display, 'none');
      assert.notEqual(f.w.getComputedStyle(f.w.document.querySelector('main')).display, 'none');
      assert.ok(f.w.document.querySelector('main h1').textContent.trim());
      const menu = f.w.document.querySelector('main .mado-embedded-guide-language .guide-lang-menu');
      assert.ok(menu, 'language menu remains visible outside the hidden header');
      assert.equal(f.w.document.querySelector('.topbar .guide-lang-menu'), null);
      assert.notEqual(f.w.getComputedStyle(menu).display, 'none');
      f.ready(language);
      const train = f.w.document.querySelector('[data-guide-cta="hero_exact_time"]');
      assert.ok(train, 'guide keeps its actual train selection CTA');
      assert.equal(f.clickElement(train).handled, true);
      assert.deepEqual(f.navigation().at(-1), { kind: 'native', screen: 'train', hash: '#journey' });
      const targetLanguage = language === 'en' ? 'ja' : 'en';
      const languageLink = [...f.w.document.querySelectorAll('.guide-lang-options a')].find(link => new URL(link.href).pathname === `${prefix(targetLanguage)}guide.html`);
      assert.ok(languageLink);
      menu.open = true;
      assert.equal(f.clickElement(languageLink).handled, true);
      // Both old and new version-2 hosts understand the public URL request.
      // The new host embeds it; older hosts fall back to the browser.
      assert.deepEqual(f.external(), [{ url: `${origin}${prefix(targetLanguage)}guide.html` }]);
      assert.deepEqual(f.navigation(), [{ kind: 'native', screen: 'train', hash: '#journey' }]);
    } finally { f.close(); }
  });
}

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

test('same-document Fuji guide anchors and Back keep the embedded article and announce its fragment', async () => {
  const html = fs.readFileSync(new URL('../fr/guide.html', import.meta.url), 'utf8');
  const f = fixture({ language: 'fr', path: 'guide.html', html });
  const canonical = `${origin}/fr/guide.html`;
  const changeHash = action => new Promise(resolve => {
    f.w.addEventListener('hashchange', resolve, { once: true });
    action();
  });
  const latestReady = () => f.messages.filter(entry => entry.message.type === 'content-ready').at(-1).message.payload;
  try {
    const anchor = f.w.document.querySelector('main a[href^="#"]');
    assert.ok(anchor && f.w.document.querySelector(anchor.getAttribute('href')));
    const firstHash = anchor.getAttribute('href');
    // The fixture cancels browser defaults; use the actual anchor's absolute URL
    // so the embedded handler performs the fragment navigation itself.
    await changeHash(() => f.click(anchor.href));
    assert.equal(latestReady().page_location, `${canonical}${firstHash}`);
    await changeHash(() => { f.w.location.hash = '#cloudy'; });
    assert.equal(latestReady().page_location, `${canonical}#cloudy`);
    await changeHash(() => f.w.history.back());
    assert.equal(f.w.location.hash, firstHash);
    assert.equal(latestReady().page_location, `${canonical}${firstHash}`);
    await changeHash(() => f.w.history.back());
    assert.equal(f.w.location.hash, '');
    assert.equal(latestReady().page_location, canonical);
    assert.equal(latestReady().content_path, '/fr/guide.html');
    assert.equal(latestReady().content_id, 'guide');
    assert.equal(latestReady().content_type, 'utility');
    assert.equal(new URL(f.w.location.href).searchParams.get('from'), 'android-app');
    assert.deepEqual(f.navigation(), []);
  } finally { f.close(); }
});
