import { editions as localeInfo, stripEdition } from './shared/locales.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { CASTLE_LOCALE_LANGS, CASTLE_LOCALE_ROUTES } from './shared/castle-locales.mjs';
import { textNodes } from './shared/castle-localization.mjs';
import { EXPANSION_ROUTES } from './shared/expansion-localization.mjs';
import { expandDeliveredSiteChromeHTML, renderSiteRuntimeForValidation } from './shared/site-runtime-validation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.michikusa-travel.com';
const editions = ['ja', 'en', ...CASTLE_LOCALE_LANGS];
// Exercise the scenery companions with the same photo, map and edition contracts.
const sceneryRoutes = ['fujikawa-bridge', 'fuji-paper-mills', 'ibuki', 'ibuki-seat-a'].map(id => `spots/${id}.html`);
const articleRoutes = [...new Set([...CASTLE_LOCALE_ROUTES, ...sceneryRoutes, ...EXPANSION_ROUTES.filter(route => route.startsWith('spots/'))])];
const errors = [];
const counts = { pages: 0, galleries: 0, maps: 0, lightboxes: 0, languageSwitches: 0 };
const assert = (ok, label, message) => { if (!ok) errors.push(`${label}: ${message}`); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const routeFor = (lang, route) => lang === 'ja' ? route : `${lang}/${route}`;
const normalizeText = value => String(value).replace(/\s+/g, ' ').trim();
const normalizedUrl = (value, base) => {
  const url = new URL(value, base);
  url.search = ''; url.hash = '';
  return url.href;
};
const imageSources = doc => Array.from(doc.querySelectorAll('img[src], img[data-photo-original-src], [data-gallery-src], [data-zoom-src]')).map(el =>
  normalizedUrl(el.getAttribute('data-photo-original-src') || el.getAttribute('src') || el.getAttribute('data-gallery-src') || el.getAttribute('data-zoom-src'), doc.baseURI));
const creditRecords = doc => [
  ...Array.from(doc.querySelectorAll('[data-gallery-credit]')).map(el => [el.getAttribute('data-gallery-credit'), el.getAttribute('data-gallery-credit-href') || '']),
  ...Array.from(doc.querySelectorAll('figcaption a[href]:not([data-gallery-source-output])')).filter(el => /^https?:/.test(el.href) && !el.href.includes('openstreetmap.org')).map(el => [normalizeText(el.textContent), el.href]),
  ...Array.from(doc.querySelectorAll('.spot-page-inline-figure figcaption > span:first-of-type, .spot-page-reference-figure figcaption > span:first-of-type, .spot-page-explainer-figure figcaption > span:first-of-type, .spot-page-story-figure figcaption > span')).map(el => [normalizeText(el.textContent), el.querySelector('a')?.href || '']),
  ...Array.from(doc.querySelectorAll('.show-credit')).map(el => [normalizeText(el.textContent), ''])
];
const compare = (actual, expected, label, description) => {
  const index = actual.findIndex((value, i) => JSON.stringify(value) !== JSON.stringify(expected[i]));
  assert(JSON.stringify(actual) === JSON.stringify(expected), label, `${description}${index >= 0 ? ` (first difference ${index}: ${JSON.stringify(actual[index])} / source ${JSON.stringify(expected[index])})` : ''}`);
};

function checkLocalFiles(doc, label) {
  for (const el of doc.querySelectorAll('a[href], link[href], script[src], img[src], [data-gallery-src], [data-zoom-src]')) {
    const value = el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('data-gallery-src') || el.getAttribute('data-zoom-src');
    if (!value || /^(?:#|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    const url = new URL(value, doc.baseURI);
    if (url.origin !== origin) continue;
    const file = decodeURIComponent(url.pathname.slice(1)) + (url.pathname.endsWith('/') ? 'index.html' : '');
    assert(fs.existsSync(path.join(root, file)), label, `missing local destination/asset ${file}`);
  }
}

function checkMetadata(doc, lang, route, label) {
  if (route === 'spots/ibuki-seat-a.html') route = 'spots/ibuki.html';
  assert(doc.documentElement.lang === lang, label, `html lang must be ${lang}`);
  assert(doc.querySelector('link[rel="canonical"]')?.href === `${origin}/${routeFor(lang, route)}`, label, 'self canonical missing');
  assert(doc.querySelector('meta[property="og:url"]')?.content === `${origin}/${routeFor(lang, route)}`, label, 'Open Graph URL must match the canonical article');
  for (const edition of [...editions, 'x-default']) {
    const links = doc.querySelectorAll(`link[rel="alternate"][hreflang="${edition}"]`);
    assert(links.length === 1 && links[0].href === `${origin}/${routeFor(edition === 'x-default' ? 'en' : edition, route)}`, label, `reciprocal hreflang ${edition} missing or duplicated`);
  }
  assert(Boolean(doc.title.trim() && doc.querySelector('meta[name="description"]')?.content.trim()), label, 'title/description missing');
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const schema = JSON.parse(script.textContent);
      const walk = value => {
        if (!value || typeof value !== 'object') return;
        if ('inLanguage' in value) assert(value.inLanguage === lang, label, 'structured data language differs');
        Object.values(value).forEach(walk);
      };
      walk(schema);
    } catch (error) { errors.push(`${label}: invalid JSON-LD (${error.message})`); }
  }
}

function checkSwitch(dom, lang, route, label) {
  if (route === 'spots/ibuki-seat-a.html') route = 'spots/ibuki.html';
  dom.window.eval(read('locales.js')); dom.window.eval(read('article-locales.js'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const switches = dom.window.document.querySelectorAll('details.guide-lang-menu.article-lang-menu');
  assert(switches.length === 1, label, 'one guide-style language menu required');
  assert(!dom.window.document.querySelector('.lang-switch'), label, 'legacy language switch remains');
  for (const host of switches) {
    const labels = Object.fromEntries(editions.map(x=>[x,localeInfo[x].label]));
    const prompts = Object.fromEntries(editions.map(x=>[x,localeInfo[x].prompt]));
    assert(host.querySelector('summary')?.textContent === labels[lang], label, 'summary must show current language');
    assert(host.querySelector('summary')?.getAttribute('aria-label') === prompts[lang], label, 'language prompt must be localized');
    assert(Boolean(host.querySelector('.guide-lang-options')), label, 'guide-style options missing');
    assert(!host.open, label, 'language menu must start closed');
    const links = Array.from(host.querySelectorAll('a'));
    assert(links.length === editions.length, label, 'language switch must offer all supported editions');
    for (const edition of editions) {
      const link = links.find(el => el.lang === edition);
      assert(link?.textContent === labels[edition], label, `language label wrong for ${edition}`);
      assert(link?.href === `${origin}/${routeFor(edition, route)}${edition === 'ja' ? '?lang=ja' : ''}`, label, `language switch destination wrong for ${edition}`);
      assert(Boolean(link?.hasAttribute('aria-current')) === (edition === lang), label, `current-language marker wrong for ${edition}`);
    }
    counts.languageSwitches++;
  }
}

function checkLocalizedLinks(doc, sourceDoc, lang, label) {
  const nativeRoute = url => url.origin === origin ? url.pathname.slice(1).replace(new RegExp('^(?:' + Object.keys(localeInfo).filter(x=>x!=='ja').join('|') + ')/'), '') : null;
  const knownSource = new Set(Array.from(sourceDoc.querySelectorAll('a[href]')).map(el => nativeRoute(new URL(el.href))).filter(route => articleRoutes.includes(route)));
  const localizedDestinations = new Set();
  for (const el of doc.querySelectorAll('a[href]')) {
    if (el.closest('.lang-switch, .article-lang-menu')) continue;
    const url = new URL(el.href);
    const route = nativeRoute(url);
    if (articleRoutes.includes(route)) {
      assert(url.pathname === `/${lang}/${route}`, label, `translated article link leaves ${lang}: ${url.pathname}`);
      localizedDestinations.add(route);
    } else if (url.origin === origin && url.pathname.startsWith('/en/')) {
      assert(el.hreflang === 'en', label, `English fallback language metadata missing: ${url.pathname}`);
    }
  }
  for (const route of knownSource) assert(localizedDestinations.has(route), label, `English source article destination missing: ${route}`);
}

function checkInteractions(dom, label) {
  const { window } = dom;
  const doc = window.document;
  const mainBefore = doc.querySelector('main')?.textContent;
  window.eval(read('spot-page-shared.js'));
  assert(doc.querySelector('main')?.textContent === mainBefore, label, 'common runtime overwrites translated body');
  assert(!doc.querySelector('.spot-page-shared-error'), label, 'common runtime rejects translated page');
  window.eval(read('spot-media-gallery.js'));
  for (const gallery of doc.querySelectorAll('[data-spot-media-gallery]')) {
    const thumbs = Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
    for (const thumb of thumbs) {
      thumb.click();
      assert(gallery.querySelector('[data-gallery-image]')?.getAttribute('src') === (thumb.getAttribute('data-gallery-display-src') || thumb.getAttribute('data-gallery-src')), label, 'gallery thumbnail does not change image');
      assert(gallery.querySelector('[data-gallery-image]')?.getAttribute('data-photo-original-src') === thumb.getAttribute('data-gallery-src'), label, 'gallery loses original photo identity');
      assert(gallery.querySelector('[data-gallery-image]')?.alt === thumb.getAttribute('data-gallery-alt'), label, 'gallery loses translated alternative text');
      assert(gallery.querySelector('[data-gallery-note-output]')?.textContent === thumb.getAttribute('data-gallery-note'), label, 'gallery loses translated caption');
      assert(gallery.querySelector('[data-gallery-credit-output]')?.textContent === thumb.getAttribute('data-gallery-credit'), label, 'gallery loses original credit');
      const sourceHref = thumb.getAttribute('data-gallery-credit-href');
      const sourceOutput = gallery.querySelector('[data-gallery-source-output]');
      if (sourceHref) {
        assert(sourceOutput?.href === sourceHref && !sourceOutput.hidden, label, 'gallery loses source credit link');
        assert(!['View original post', '元の投稿を見る'].includes(sourceOutput?.textContent), label, 'gallery source action reverts to another language');
      }
      assert(thumb.getAttribute('aria-pressed') === 'true' && thumbs.filter(el => el.getAttribute('aria-pressed') === 'true').length === 1, label, 'gallery active state broken');
    }
    counts.galleries++;
  }
  window.eval(read('spot-map.js'));
  for (const map of doc.querySelectorAll('.spot-static-map')) {
    const buttons = Array.from(map.querySelectorAll('[data-mini-map-mode]'));
    assert(buttons.length >= 2, label, 'map needs spot/viewpoint controls');
    for (const button of buttons) {
      button.click();
      assert(map.querySelector('iframe')?.getAttribute('src') === button.getAttribute('data-map-src'), label, 'map mode does not change location');
      assert(new URL(button.getAttribute('data-map-src')).searchParams.get('language') === localeInfo[doc.documentElement.lang].map, label, 'map mode loses localized map language');
      assert(button.getAttribute('aria-pressed') === 'true' && buttons.filter(el => el.getAttribute('aria-pressed') === 'true').length === 1, label, 'map mode active state broken');
    }
    counts.maps++;
  }
  for (const button of doc.querySelectorAll('.spot-page-inline-zoom')) {
    const box = doc.getElementById('spotPageLightbox');
    button.click();
    assert(box && !box.hidden && box.querySelector('img')?.getAttribute('src') === button.getAttribute('data-zoom-src'), label, 'inline photo does not open');
    doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert(box?.hidden && doc.documentElement.style.overflow === '', label, 'Escape fails to close inline photo');
    counts.lightboxes++;
  }
}

for (const lang of CASTLE_LOCALE_LANGS) {
  const guide = new JSDOM(expandDeliveredSiteChromeHTML({ appDir: root, html: read(`${lang}/guide.html`), relative: `${lang}/guide.html` }), { url: `${origin}/${lang}/guide.html` });
  let nativeLinks = 0;
  for (const el of guide.window.document.querySelectorAll('a[href]')) {
    const url = new URL(el.href);
    const route = url.pathname.slice(1).replace(new RegExp('^(?:' + Object.keys(localeInfo).filter(x=>x!=='ja').join('|') + ')/'), '');
    if (url.origin === origin && articleRoutes.includes(route)) {
      assert(url.pathname === `/${lang}/${route}`, `${lang}/guide.html`, `existing guide entry must remain in this language: ${url.pathname}`);
      nativeLinks++;
    }
  }
  assert(nativeLinks > 0, `${lang}/guide.html`, 'existing Fuji guide has no entry to localized articles');
  guide.window.close();
}

for (const route of articleRoutes) {
  const source = renderSiteRuntimeForValidation({ appDir: root, html: read(`en/${route}`), relative: `en/${route}` }).dom;
  for (const lang of editions) {
    const file = routeFor(lang, route);
    if (!fs.existsSync(path.join(root, file))) { errors.push(`${file}: missing generated edition`); continue; }
    const dom = lang === 'en' ? source : renderSiteRuntimeForValidation({ appDir: root, html: read(file), relative: file }).dom;
    const doc = dom.window.document;
    checkMetadata(doc, lang, route, file);
    checkSwitch(dom, lang, route, file);
    if (CASTLE_LOCALE_LANGS.includes(lang)) {
      assert(!doc.querySelector('.article-language-hint'), file, 'visible English fallback labels must not be added');
      assert(doc.body.hasAttribute('data-article-localized'), file, 'static localization marker missing');
      assert(Boolean(doc.querySelector('main')?.textContent.trim()), file, 'article body empty before JavaScript');
      assert(!doc.querySelector('script[src*="spot-page-loader"], script[src*="data/spot-pages/"]'), file, 'English dynamic loader remains');
      compare(imageSources(doc), imageSources(source.window.document), file, 'photograph assets/order differ from English source');
      compare(creditRecords(doc), creditRecords(source.window.document), file, 'photograph attribution/credit URLs differ from English source');
      const groups = ['utility', 'castle', 'episode', ...(sceneryRoutes.includes(route) ? ['scenery'] : []), ...(EXPANSION_ROUTES.includes(route) ? ['expansion'] : [])];
      const dictionary = Object.assign({}, ...groups.map(group => JSON.parse(read(`scripts/locales/${group}-${lang}.json`))));
      const bodyText = normalizeText(doc.body.textContent);
      for (const node of textNodes(source.window.document)) {
        const key = node.textContent.trim();
        if (key.length < 30 || node.parentElement.closest('.lang-switch')) continue;
        assert(typeof dictionary[key] === 'string' && dictionary[key].trim().length > 0, file, `translation missing: ${key.slice(0, 90)}`);
        if (dictionary[key]) assert(bodyText.includes(normalizeText(dictionary[key])), file, `translated source text missing: ${key.slice(0, 90)}`);
      }
      checkLocalizedLinks(doc, source.window.document, lang, file);
      checkLocalFiles(doc, file);
      checkInteractions(dom, file);
      counts.pages++;
    }
    if (dom !== source) dom.window.close();
  }
  source.window.close();
}
if (errors.length) {
  const uniqueErrors = Array.from(new Set(errors));
  console.error(`Castle locales: ${errors.length} failure(s)\n${uniqueErrors.slice(0, 50).join('\n')}${uniqueErrors.length > 50 ? `\n... ${uniqueErrors.length - 50} further unique failures.` : ''}`);
  process.exitCode = 1;
} else {
  console.log(`Castle locales OK: ${counts.pages} static pages; ${editions.length}-language switches ${counts.languageSwitches}; galleries ${counts.galleries}, maps ${counts.maps}, photo zooms ${counts.lightboxes}; assets, credits, translations and reciprocal metadata.`);
}
