import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import locales from '../locales.js';
import { withLocaleRegistry } from './shared/locales.mjs';
import { withArticleLocales } from './shared/castle-locales.mjs';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('Italian and Thai share every regular translated route and leave limited editions behind', () => {
  const routes = [...new Set([...locales.routes, ...Object.keys(locales.episodes)])];
  assert.equal(routes.length, 57, '56 canonical pages and the Ibuki A-seat alias');
  assert.deepEqual(locales.starter, []);
  for (const lang of ['it', 'th']) {
    assert.ok(locales.coreLanguages.includes(lang));
    assert.ok(locales.translated.includes(lang));
    for (const route of routes) assert.ok(locales.supported(route).includes(lang), `${lang}/${route}`);
  }
  assert.deepEqual(locales.supported('727-collection.html'), locales.coreLanguages);
});
test('scenery editions retain companion canonical targets and guide-only Arabic', () => {
  for (const id of ['fujikawa-bridge', 'fuji-paper-mills', 'ibuki', 'ibuki-seat-a']) {
    assert.deepEqual(locales.supported(`spots/${id}.html`), locales.coreLanguages);
  }
  const head = '<head><link rel="canonical" href="https://www.michikusa-travel.com/en/spots/ibuki.html"></head>';
  const html = withArticleLocales(head, 'en/spots/ibuki-seat-a.html', 'test');
  assert.ok(html.includes('hreflang="fr" href="https://www.michikusa-travel.com/fr/spots/ibuki.html"'));
  assert.ok(!html.includes('/fr/spots/ibuki-seat-a.html'));
  const unregistered = '<head><link rel="canonical" href="https://www.michikusa-travel.com/en/spots/hamanako.html"></head>';
  assert.equal(withArticleLocales(unregistered, 'en/spots/hamanako-fuji.html', 'test'), unregistered);
});
test('English visitor articles expose all translated editions without a Japanese destination', () => {
  const dom = new JSDOM('<html lang="en"><head><link rel="canonical" href="https://www.michikusa-travel.com/en/drinks.html"></head><body><header class="topbar"></header></body></html>', {url:'https://www.michikusa-travel.com/en/drinks.html?train=Nozomi-1#tea',runScripts:'outside-only'});
  dom.window.eval(read('locales.js')); dom.window.eval(read('article-locales.js'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const menu = dom.window.document.querySelector('.article-lang-menu');
  assert.equal(menu.querySelectorAll('a').length, locales.supported('drinks.html').length);
  assert.equal(menu.querySelector('a[lang="ja"]'),null);
  const target = new URL(menu.querySelector('a[lang="fr"]').href);
  assert.equal(target.pathname,'/fr/drinks.html'); assert.equal(target.searchParams.get('train'),'Nozomi-1'); assert.equal(target.hash,'#tea');
  dom.window.close();
});

test('delayed shared headers connect article editions once and preserve navigation state in both directions', () => {
  for (const lang of ['ja', 'en']) {
    const route = 'spots/fuji.html';
    const pathname = '/' + (lang === 'ja' ? '' : 'en/') + route;
    const dom = new JSDOM(`<html lang="${lang}"><head><link rel="canonical" href="https://www.michikusa-travel.com${pathname}"></head><body><div data-spot-page-shared-module="topbar"></div></body></html>`, { url: `https://www.michikusa-travel.com${pathname}?train=Nozomi-1&board=Shinagawa&dir=west&focus=fuji#viewpoint`, runScripts: 'outside-only' });
    const { document, Event } = dom.window;
    dom.window.eval(read('locales.js'));
    dom.window.eval(read('article-locales.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    assert.equal(document.querySelector('.article-lang-menu'), null);
    document.querySelector('[data-spot-page-shared-module="topbar"]').outerHTML = '<header class="topbar"><div class="lang-switch"></div></header>';
    document.dispatchEvent(new Event('mado:shared-ui-ready'));
    const menu = document.querySelector('.article-lang-menu');
    assert.ok(menu, `${lang}: late header gets its language menu`);
    assert.equal(menu.querySelectorAll('a').length, locales.supported(route).length);
    menu.open = true;
    document.dispatchEvent(new Event('mado:shared-ui-ready'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    assert.equal(document.querySelectorAll('.article-lang-menu').length, 1);
    assert.equal(document.querySelector('.article-lang-menu'), menu, 'reconnection preserves the existing menu and listeners');
    assert.equal(menu.open, true);
    const destination = lang === 'ja' ? 'en' : 'ja';
    const link = menu.querySelector(`a[lang="${destination}"]`);
    const target = new URL(link.href);
    assert.equal(target.pathname, '/' + (destination === 'ja' ? '' : destination + '/') + route);
    for (const [key, value] of [['train', 'Nozomi-1'], ['board', 'Shinagawa'], ['dir', 'west'], ['focus', 'fuji']]) assert.equal(target.searchParams.get(key), value);
    assert.equal(target.hash, '#viewpoint');
    if (destination === 'ja') assert.equal(target.searchParams.get('lang'), 'ja');
    link.addEventListener('click', event => event.preventDefault());
    link.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(dom.window.localStorage.getItem('mado-lang'), destination);
    if (lang === 'ja') assert.equal(new URL(dom.window.location.href).searchParams.get('lang'), 'ja');
    dom.window.close();
  }
});
test('edition registry loads before synchronous routing and after the base URL', () => {
  for (const base of ['', '<base href="../">']) {
    const source = `<html><head><meta charset="utf-8">${base}<script src="language-router.js"></script><script src="../locales.js?v=old"></script></head></html>`;
    const html = withLocaleRegistry(source, '../');
    assert.equal((html.match(/src="\.\.\/locales\.js/g) || []).length, 1);
    assert.ok(html.indexOf('src="../locales.js') < html.indexOf('src="language-router.js'));
    if (base) assert.ok(html.indexOf('<base') < html.indexOf('src="../locales.js'));
    assert.equal(withLocaleRegistry(html, '../'), html);
  }
});
test('new editions match the 25 active pages and Arabic stays guide-only', () => {
  assert.equal(locales.routes.length, 25);
  assert.equal(new Set(locales.routes).size, 25);
  for (const route of locales.routes) for (const lang of locales.translated) assert.ok(locales.supported(route).includes(lang), lang + '/' + route);
  assert.ok(locales.supported('guide.html').includes('ar'));
  assert.ok(!locales.supported('start.html').includes('ar'));
  assert.deepEqual(locales.supported('drinks.html'), ['en', ...locales.translated]);
  assert.deepEqual(locales.supported('beer-on-shinkansen.html'), ['en', ...locales.translated]);
});
test('PR96 Japanese map entry is retained without untranslated cards in other editions', () => {
  assert.ok(read('index.html').includes('data-lp-cta="scenery-card-window-trip"'));
  assert.ok(read('scripts/generate-content-manifest.mjs').includes('images/window-trip-card.webp'));
  for (const lang of ['en', ...locales.translated]) {
    assert.ok(!read(lang + '/index.html').includes('data-lp-cta="scenery-card-window-trip"'));
    for (const route of ['start.html','zukan.html']) assert.ok(!read(lang+'/'+route).includes('写真や墨絵で、車窓の別の表現を楽しむ。'));
  }
});
test('Chinese scripts, regions and exact path editions remain distinct', () => {
  for (const code of ['zh','zh-CN','zh-SG','zh-Hans','zh-Hans-CN','zh_hans']) assert.equal(locales.normalize(code), 'zh-Hans');
  for (const code of ['zh-TW','zh-HK','zh-MO','zh-Hant','zh-Hant-TW','zh_hant']) assert.equal(locales.normalize(code), 'zh-Hant');
  assert.equal(locales.routeLanguage('/zh-Hans/start.html'), 'zh-Hans');
  assert.equal(locales.routeLanguage('/zh-Hant/start.html'), 'zh-Hant');
  assert.equal(locales.routeLanguage('/spots/hamanako.html'), null);
});
function route({ requested, saved, browser = 'zh-CN' }) {
  const url = new URL('https://www.michikusa-travel.com/start.html?train=Nozomi-1&board=Shinagawa&dir=west&focus=fuji#journey');
  if (requested) url.searchParams.set('lang', requested);
  const dom = new JSDOM('<html lang="ja"><head></head><body></body></html>', { url: url.href, runScripts:'outside-only' });
  if (saved) dom.window.localStorage.setItem('mado-lang', saved);
  Object.defineProperty(dom.window.navigator, 'languages', { value: [browser] });
  let target = '';
  dom.window.eval(read('locales.js'));
  // Read-only location interception for the redirect contract.
  const code = read('language-router.js').replace('location.replace(destination.href);', 'window.__target = destination.href;');
  dom.window.eval(code);
  target = dom.window.__target;
  dom.window.close();
  return target;
}
test('explicit and saved editions preserve train/station/direction/queries/hash', () => {
  for (const lang of ['de','es','zh-Hans','zh-Hant','ko','fr','en','it','th']) for (const input of [{requested:lang},{saved:lang}]) {
    const target = new URL(route(input));
    assert.equal(target.pathname, '/' + lang + '/start.html');
    assert.equal(target.searchParams.get('train'), 'Nozomi-1');
    assert.equal(target.searchParams.get('board'), 'Shinagawa');
    assert.equal(target.searchParams.get('dir'), 'west');
    assert.equal(target.searchParams.get('focus'), 'fuji');
    assert.equal(target.hash, '#journey');
  }
  assert.equal(route({requested:'ja',saved:'zh-Hant'}), undefined);
  assert.equal(route({browser:'zh-CN'}), undefined);
  assert.equal(route({browser:'zh-TW'}), undefined);
  assert.equal(route({requested:'unknown'}), undefined);
});


test('727 and wheel collection runtime copies retain localized templates after interaction', async () => {
  const { englishSnapshot } = await import('./shared/castle-localization.mjs');
  const { expansionRuntimeStrings, localizeExpansionRuntime } = await import('./shared/expansion-localization.mjs');
  const { fileURLToPath } = await import('node:url');
  const root = fileURLToPath(new URL('../',import.meta.url));
  for (const route of ['727-collection.html','ferris-wheels.html']) {
    const dom=englishSnapshot(root,route),doc=dom.window.document;
    const keys=expansionRuntimeStrings(root,route,doc);
    assert.ok(keys.length>10);
    localizeExpansionRuntime(root,route,doc,'fr',value=>'FR '+value);
    doc.documentElement.lang='fr';
    if(route==='727-collection.html') {
      dom.window.eval(read('data.js')+';window.BOARD_COLLECTION=BOARD_COLLECTION;window.ROUTE=ROUTE;');
      dom.window.eval(read('locales.js'));
      const config=[...doc.querySelectorAll('script:not([src])')].find(el=>el.textContent.startsWith('window.MADO_727_LOCALE ='));
      dom.window.eval(config.textContent);
      dom.window.MADO_LEAFLET={load:()=>Promise.reject(new Error('offline'))};
      dom.window.eval(read('727-collection.js'));
      assert.match(doc.querySelector('#collectionProgress').textContent,/FR/);
      assert.ok(!doc.querySelector('#collectionProgress').textContent.includes('{found}'));
      const button=doc.querySelector('[data-point-stamp]');button.click();
      assert.match(doc.querySelector('[data-point-card]').textContent,/FR Recorded/);
      assert.equal(doc.querySelector('[data-point-card] .collection-detail-link').getAttribute('href'),'../fr/spots/727-board.html');
    } else {
      const config=[...doc.querySelectorAll('script:not([src])')].find(el=>el.textContent.startsWith('window.FERRIS_WHEEL_COLLECTION ='));
      dom.window.eval(config.textContent);dom.window.eval(read('ferris-wheels.js'));
      assert.match(doc.querySelector('#wheelProgress').textContent,/FR/);
      doc.querySelector('[data-wheel-stamp]').click();
      assert.match(doc.querySelector('[data-wheel-state]').textContent,/FR Tap again/);
    }
    await new Promise(setImmediate);
    dom.window.close();
  }
});


test('station dome marker retains translated labels after show and hide', async () => {
  const {englishSnapshot}=await import('./shared/castle-localization.mjs');
  const {localizeExpansionRuntime}=await import('./shared/expansion-localization.mjs');
  const {fileURLToPath}=await import('node:url');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const dom=englishSnapshot(root,'tokyo-kyoto-stations.html');
  localizeExpansionRuntime(root,'tokyo-kyoto-stations.html',dom.window.document,'fr',value=>'FR '+value);
  dom.window.ResizeObserver=class {observe(){}};
  dom.window.eval(read('stations.js'));
  const button=dom.window.document.querySelector('.clue-toggle');
  button.click();assert.equal(button.textContent,'FR Hide the dome marker');assert.equal(button.getAttribute('aria-pressed'),'true');
  button.click();assert.equal(button.textContent,'FR Show the dome in this photo');assert.equal(button.getAttribute('aria-pressed'),'false');
  dom.window.close();
});
