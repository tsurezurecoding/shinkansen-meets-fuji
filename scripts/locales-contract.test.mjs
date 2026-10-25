import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import locales from '../locales.js';
import { withLocaleRegistry } from './shared/locales.mjs';
import { withArticleLocales } from './shared/castle-locales.mjs';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
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
test('English visitor articles expose seven real editions without a Japanese destination', () => {
  const dom = new JSDOM('<html lang="en"><head><link rel="canonical" href="https://www.michikusa-travel.com/en/drinks.html"></head><body><header class="topbar"></header></body></html>', {url:'https://www.michikusa-travel.com/en/drinks.html?train=Nozomi-1#tea',runScripts:'outside-only'});
  dom.window.eval(read('locales.js')); dom.window.eval(read('article-locales.js'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const menu = dom.window.document.querySelector('.article-lang-menu');
  assert.equal(menu.querySelectorAll('a').length,7);
  assert.equal(menu.querySelector('a[lang="ja"]'),null);
  const target = new URL(menu.querySelector('a[lang="fr"]').href);
  assert.equal(target.pathname,'/fr/drinks.html'); assert.equal(target.searchParams.get('train'),'Nozomi-1'); assert.equal(target.hash,'#tea');
  dom.window.close();
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
  for (const route of locales.routes) for (const lang of ['de','es','zh-Hans','ko']) assert.ok(locales.supported(route).includes(lang), lang + '/' + route);
  assert.ok(locales.supported('guide.html').includes('ar'));
  assert.ok(!locales.supported('start.html').includes('ar'));
  assert.deepEqual(locales.supported('drinks.html'), ['en', ...locales.translated]);
  assert.deepEqual(locales.supported('beer-on-shinkansen.html'), ['en', ...locales.translated]);
});
test('PR96 Japanese map entry is retained without untranslated cards in other editions', () => {
  assert.ok(read('index.html').includes('data-lp-cta="scenery-card-window-trip"'));
  assert.ok(read('scripts/generate-content-manifest.mjs').includes('images/window-trip-card.webp'));
  for (const lang of ['en','de','es','fr','zh-Hans','zh-Hant','ko']) {
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
