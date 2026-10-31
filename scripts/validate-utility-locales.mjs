import { episodes, supported, editions as localeInfo, stripEdition } from './shared/locales.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';
import { UTILITY_ROUTES, LOCALES, utilityAttributes, FEATURE_UTILITY_ROUTES, preservedUtilityText, collectEnglish, englishTables, englishNarrations, valueTemplate, translationKey, translatable } from './shared/utility-localization.mjs';
import { expandDeliveredSiteChromeHTML, renderSiteRuntimeForValidation } from './shared/site-runtime-validation.mjs';
import { CASTLE_LOCALE_ROUTES } from './shared/castle-locales.mjs';
import { EXTRA_LOCALE_ROUTES } from './shared/extra-locale-routes.mjs';
import { textNodes } from './shared/castle-localization.mjs';
import { liveHtmlContent } from './shared/live-sitemap.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.michikusa-travel.com';
const editions = ['ja', 'en', ...LOCALES];
const errors = [];
const counts = { pages: 0, dictionaries: 0, dynamic: 0, forecastScenarios: 0, narrationDirections: 0 };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const dataScript = () => read('data-runtime.js') + '\nObject.assign(window, { SPOTS, ROUTE, BOARD_COLLECTION, WHEEL_COLLECTION });';
const exists = file => fs.existsSync(path.join(root, file));
const assert = (ok, label, detail) => { if (!ok) errors.push(`${label}: ${detail}`); };
const fileFor = (lang, route) => (lang === 'ja' ? '' : `${lang}/`) + route;
const publicRoute = route => route === 'index.html' ? '' : route.replace('live/index.html', 'live/');
const urlFor = (lang, route) => `${origin}/${fileFor(lang, publicRoute(route))}`;
const canonicalRoute = url => url.pathname.slice(1).replace(new RegExp('^(?:' + Object.keys(localeInfo).filter(x=>x!=='ja').join('|') + ')/'), '').replace(/^live\/$/, 'live/index.html').replace(/^$/, 'index.html');
const normal = text => String(text).replace(/\s+/g, ' ').trim();
const placeholders = text => (String(text).match(/\{(?:\d+|name|hook|area)\}/g) || []).sort().join('|');
const compare = (actual, expected, label, detail) => assert(JSON.stringify(actual) === JSON.stringify(expected), label, detail);
function domFor(lang, route) {
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(`${fileFor(lang, route)}: runtime ${error.message}`));
  const file = fileFor(lang, route);
  const html = expandDeliveredSiteChromeHTML({ appDir: root, html: read(file), relative: file });
  return new JSDOM(html, { url: urlFor(lang, route), runScripts: 'outside-only', virtualConsole: console });
}
function deliveredUtilitySource(route) {
  const file = `en/${route}`;
  const dom = renderSiteRuntimeForValidation({ appDir: root, html: read(file), relative: file }).dom;
  const doc = dom.window.document;
  if (route === 'mieru.html') {
    // Retain utilitySnapshot's accepted English-only presentation boundary.
    doc.querySelectorAll('[data-mieru-en-only]').forEach(el => { if (el.previousSibling?.nodeType === 3 && !el.previousSibling.textContent.trim()) el.previousSibling.remove(); el.remove(); });
    doc.querySelectorAll('[data-mieru-locale-copy]').forEach(el => el.replaceWith(el.getAttribute('data-mieru-locale-copy')));
    doc.body.normalize();
    doc.querySelector('.mieru-note')?.removeAttribute('id');
    const status = doc.getElementById('mieruStatus');
    status?.removeAttribute('role');
    const answer = doc.querySelector('.mieru-answer');
    if (status && answer) status.before(answer);
  } else if (route === 'live/index.html') {
    doc.querySelector('#btn-settings')?.setAttribute('title', sourceTables.live.settings);
    doc.querySelector('#btn-dir')?.setAttribute('title', sourceTables.live.dirL);
  }
  return dom;
}
function failMissing() {
  const needed = ['utility-locale-runtime.js', 'utility-locales.js', 'utility-locales.css', 'content-manifest.json', 'sitemap.xml', 'scripts/utility-live-sitemap-state.json', ...LOCALES.flatMap(lang => [`scripts/locales/utility-${lang}.json`, `${lang}/utility-data.js`]), ...editions.flatMap(lang => UTILITY_ROUTES.map(route => fileFor(lang, route)))];
  const missing = needed.filter(file => !exists(file));
  if (missing.length) { console.error(`Utility locales: missing required output/assets (${missing.length}): ${missing.join(', ')}`); process.exit(1); }
}
failMissing();
const sourceTables = englishTables(root);
const sourceNarrations = englishNarrations(root);
const sourceKeys = collectEnglish(root);
const manifest = new Map(JSON.parse(read('content-manifest.json')).files.map(item => [item.path, item]));
const sitemap = new JSDOM(read('sitemap.xml'), { contentType: 'application/xml' }).window.document;
const liveState = JSON.parse(read('scripts/utility-live-sitemap-state.json'));
const hashJson = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sitemapUrls = new Set([...sitemap.querySelectorAll('url > loc')].map(node => node.textContent));
function checkManifest(file) {
  const item = manifest.get(file);
  assert(Boolean(item), file, 'content manifest registration missing');
  if (!item) return;
  const bytes = fs.readFileSync(path.join(root, file));
  assert(item.bytes === bytes.length && item.sha256 === crypto.createHash('sha256').update(bytes).digest('hex'), file, 'content manifest hash/bytes are stale');
}
function translation(dictionary, value) {
  if (!translatable(value)) return value;
  const key = translationKey(value);
  return dictionary[key] ? value.replace(key, () => dictionary[key]) : value;
}
function initAdapter(dom, lang) {
  dom.window.eval(read('locales.js')); dom.window.eval(dataScript());
  dom.window.eval(read(`${lang}/utility-data.js`));
  dom.window.eval(read('utility-locale-runtime.js'));
  return dom.window.MADO_UTILITY_LOCALE;
}
function checkDictionary(lang) {
  const label = `${lang} dictionary`;
  const dictionary = JSON.parse(read(`scripts/locales/utility-${lang}.json`));
  for (const key of sourceKeys) {
    assert(typeof dictionary[key] === 'string' && dictionary[key].trim(), label, `missing translation: ${key.slice(0, 90)}`);
    if (dictionary[key]) assert(placeholders(key) === placeholders(dictionary[key]), label, `placeholder mismatch: ${key.slice(0, 90)}`);
  }
  const context = { window: {} }; vm.runInNewContext(read(`${lang}/utility-data.js`), context);
  const payload = context.window.MADO_UTILITY_PAYLOAD;
  assert(payload?.lang === lang, label, 'payload language wrong');
  const reviewed = liveState[lang];
  assert(Boolean(reviewed && /^\d{4}-\d{2}-\d{2}$/.test(reviewed.lastmod) && reviewed.reason?.trim()), label, 'live lastmod review missing/invalid');
  assert(reviewed?.fingerprints?.html === hashJson(liveHtmlContent(read(`${lang}/live/index.html`))), label, 'live HTML changed since lastmod review');
  assert(reviewed?.fingerprints?.narration === hashJson(payload?.narrations), label, 'translated narration changed since lastmod review');
  const sitemapEntry = [...sitemap.querySelectorAll('url')].find(node => node.querySelector('loc')?.textContent === urlFor(lang, 'live/index.html'));
  assert(sitemapEntry?.querySelector('lastmod')?.textContent === reviewed?.lastmod, label, 'live sitemap lastmod differs from reviewed date');
  compare(payload?.translations, dictionary, label, 'generated dictionary stale');
  const dom = domFor(lang, 'start.html');
  const adapter = initAdapter(dom, lang);
  assert(adapter?.lang === lang, label, 'adapter failed');
  for (const [name, table] of Object.entries(sourceTables)) for (const [key, value] of Object.entries(table)) {
    const source = valueTemplate(value), actual = payload?.tables?.[name]?.[key];
    compare(actual, { ...source, text: translation(dictionary, source.text) }, label, `stale/missing runtime table ${name}.${key}`);
    const expected = translation(dictionary, source.text);
    if (source.args == null) assert(adapter.tables[name][key] === expected, label, `adapter string ${name}.${key}`);
    else {
      const args = Array.from({ length: source.args }, (_, i) => `ARG_${i}`);
      assert(adapter.tables[name][key](...args) === expected.replace(/\{(\d+)\}/g, (_, i) => args[+i]), label, `adapter function ${name}.${key}`);
    }
  }
  for (const [id, directions] of Object.entries(sourceNarrations)) for (const [direction, variants] of Object.entries(directions)) {
    if (!variants.en) continue;
    const actual = adapter.narrations?.[id]?.[direction];
    assert(actual?.text === translation(dictionary, variants.en.text), label, `missing/stale narration ${id}/${direction}`);
    if (variants.en.audio === false) assert(actual?.audio === false, label, `text-only narration gained audio ${id}/${direction}`);
    else {
      const audio = actual?.audio;
      assert(Boolean(audio), label, `missing English recording ${id}/${direction}`);
      if (audio && !/^[a-z]+:/i.test(audio)) {
        const file = `live/audio/${audio.replace(/^live\//, '').replace(/^audio\//, '')}`;
        assert(exists(file), label, `missing recording asset ${file}`);
        if (!variants.en.audio) assert(audio.endsWith('_en.mp3'), label, `recording language differs ${id}/${direction}`);
      }
    }
    counts.narrationDirections++;
  }
  for (const route of [...UTILITY_ROUTES, ...CASTLE_LOCALE_ROUTES, ...EXTRA_LOCALE_ROUTES, 'guide.html']) assert(adapter.href(route).startsWith(`${lang}/`), label, `same-language route missing ${route}`);
  for (const [route, langs] of Object.entries(episodes)) assert(adapter.href(route).startsWith((langs.includes(lang) ? lang : 'en') + '/'), label, `episode route language wrong ${route}`);
  assert(adapter.href('index.html') === `${lang}/`, label, 'TOP must use the same-language edition');
  assert(adapter.href('privacy.html') === 'en/privacy.html', label, 'untranslated route must use English fallback');
  dom.window.close(); counts.dictionaries++;
  return dictionary;
}
function checkMetadata(doc, lang, route, label) {
  assert(doc.documentElement.lang === lang, label, 'html lang differs');
  assert(doc.querySelector('link[rel=canonical]')?.href === urlFor(lang, route), label, 'self canonical differs');
  for (const edition of [...supported(route), 'x-default']) {
    const links = doc.querySelectorAll(`link[rel=alternate][hreflang="${edition}"]`);
    assert(links.length === 1 && links[0].href === urlFor(edition === 'x-default' ? 'en' : edition, route), label, `reciprocal hreflang ${edition} missing/duplicate/wrong`);
  }
  assert(Boolean(doc.title.trim() && doc.querySelector('meta[name=description]')?.content.trim()), label, 'title/description missing');
  for (const node of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const walk = value => { if (value && typeof value === 'object') { if ('inLanguage' in value) assert(value.inLanguage === lang, label, 'JSON-LD language differs'); if (route === 'index.html' && value['@type'] === 'WebApplication') assert(value['@id'] === urlFor(lang, route) + '#app', label, 'TOP JSON-LD identity differs from page language'); Object.values(value).forEach(walk); } };
      walk(JSON.parse(node.textContent));
    } catch (error) { errors.push(`${label}: invalid JSON-LD: ${error.message}`); }
  }
}
function checkFiles(doc, label) {
  for (const el of doc.querySelectorAll('a[href],link[href],script[src],img[src]')) {
    const value = el.getAttribute('href') || el.getAttribute('src');
    if (!value || /^(?:#|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    const url = new URL(value, doc.baseURI);
    if (url.origin !== origin) continue;
    const file = decodeURIComponent(url.pathname.slice(1)) + (url.pathname.endsWith('/') ? 'index.html' : '');
    assert(exists(file), label, `missing local file ${file}`);
  }
}
function checkMenu(dom, lang, route, label) {
  const { window } = dom;
  if (!window.document.querySelector('header .lang-switch,header .utility-lang-menu') && window.document.querySelector('[data-spot-page-shared-module]')) {
    window.eval(read('spot-page-shared-data.js')); window.eval(read('spot-page-shared.js'));
  }
  window.eval(read('locales.js')); window.eval(read('utility-locales.js')); window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  const doc = window.document, menus = doc.querySelectorAll('details.guide-lang-menu.utility-lang-menu');
  assert(menus.length === 1 && !doc.querySelector('.lang-switch'), label, 'one guide-style menu must replace old language buttons');
  const menuEditions = supported(route);
  const labels = Object.fromEntries(menuEditions.map(x=>[x,localeInfo[x].label]));
  const prompts = Object.fromEntries(menuEditions.map(x=>[x,localeInfo[x].prompt]));
  for (const menu of menus) {
    assert(menu.querySelector('summary')?.textContent === labels[lang] && menu.querySelector('summary')?.getAttribute('aria-label') === prompts[lang], label, 'current language/prompt differs');
    assert(menu.querySelectorAll('a').length === menuEditions.length && !menu.open, label, 'four languages and closed initial state required');
    for (const edition of menuEditions) {
      const a = [...menu.querySelectorAll('a')].find(node => node.lang === edition);
      const href = a && new URL(a.href);
      assert(a?.textContent === labels[edition] && href?.pathname === `/${fileFor(edition, route === 'index.html' ? '' : route)}`, label, `language switch differs ${edition}`);
      assert(Boolean(a?.hasAttribute('aria-current')) === (lang === edition), label, `current marker differs ${edition}`);
    }
  }
}
function checkStatic(doc, sourceDoc, dictionary, lang, label) {
  const route = stripEdition(label);
  if (['it', 'th'].includes(lang)) {
    sourceDoc = sourceDoc.cloneNode(true);
    // These editions also localize the Japanese accessibility/initial-state
    // remnants in the English shell; the content comparison must expect that.
    const labels = { 'ライブ操作': 'Live controls', '図鑑の見方': 'How to use the field guide', '車窓図鑑フィルタ': 'Field guide filters', '見どころモード': 'View mode', '座席側': 'Seat side', 'カテゴリ': 'Category' };
    for (const el of sourceDoc.querySelectorAll('[aria-label]')) {
      const key = labels[el.getAttribute('aria-label')];
      if (key) el.setAttribute('aria-label', key);
    }
    const summary = sourceDoc.querySelector('#passed-summary');
    if (summary) summary.textContent = `${translation(dictionary, sourceTables.live.passed)} (0)`;
    const help = sourceDoc.querySelector('#set-narr-help');
    if (help) help.textContent = sourceTables.live.narrModeHelpLoading;
  }
  const excluded = '.lang-switch,.utility-lang-menu,.show-credit,.utility-audio-note,.content-rail-discovery .discovery-language';
  const sourceText = textNodes(sourceDoc).filter(node => !node.parentElement.closest(excluded) && !preservedUtilityText(node, route)).map(node => normal(translation(dictionary, node.textContent)));
  const translatedText = textNodes(doc).filter(node => !node.parentElement.closest(excluded) && !preservedUtilityText(node, route)).map(node => normal(node.textContent));
  compare(translatedText, sourceText, label, 'static English-source text/translation differs');
  const attrs = document => [...document.querySelectorAll('*')].flatMap(el => utilityAttributes(el, route).filter(attr => el.hasAttribute(attr) && !el.closest(excluded)).map(attr => [el.tagName, attr, normal(el.getAttribute(attr))]));
  compare(attrs(doc), attrs(sourceDoc).map(([tag, attr, value]) => [tag, attr, normal(translation(dictionary, value))]), label, 'translated alt/title/aria/placeholder differs');
  compare([...doc.querySelectorAll('.show-credit')].map(el => normal(el.textContent)), [...sourceDoc.querySelectorAll('.show-credit')].map(el => normal(el.textContent)), label, 'photo attribution changed');
  if (FEATURE_UTILITY_ROUTES.includes(route)) {
    compare([...doc.querySelectorAll('.wm-card-by')].map(el => el.textContent), [...sourceDoc.querySelectorAll('.wm-card-by')].map(el => el.textContent), label, 'supplied author attribution changed');
    compare([...doc.querySelectorAll('template')].map(el => el.innerHTML), [...sourceDoc.querySelectorAll('template')].map(el => el.innerHTML), label, 'original external post changed');
    compare([...doc.querySelectorAll('iframe[title]')].map(el => el.title), [...sourceDoc.querySelectorAll('iframe[title]')].map(el => el.title), label, 'actual video title changed');
    compare([...doc.querySelectorAll('[data-video-title]')].map(el => el.dataset.videoTitle), [...sourceDoc.querySelectorAll('[data-video-title]')].map(el => el.dataset.videoTitle), label, 'deferred actual video title changed');
  }
  assert(!/\(anglais\)|（英文）|\(English\)/i.test(doc.querySelector('header')?.textContent || ''), label, 'header contains unnecessary English badges');
  for (const a of doc.querySelectorAll('a[href]')) {
    if (a.closest('.utility-lang-menu,.lang-switch') || a.getAttribute('href')?.startsWith('#')) continue;
    const url = new URL(a.href);
    if (url.origin !== origin) continue;
    const route = canonicalRoute(url);
    const discovery = a.closest('.content-rail-discovery');
    const japaneseOnlyRoute = discovery && a.getAttribute('hreflang') === 'ja' && ['sudoori/index.html', 'window-quiz.html'].includes(route);
    if (japaneseOnlyRoute) {
      assert(url.pathname === `/${route}`, label, `Japanese-only discovery link must use the Japanese root route: ${url.pathname}`);
      assert(url.searchParams.get('lang') === 'ja', label, `Japanese-only discovery link must identify lang=ja: ${url.href}`);
      const note = a.querySelector('.discovery-language');
      assert(Boolean(note) && normal(note?.textContent) === normal(translation(dictionary, '日本語')), label, `Japanese-only discovery link must show the Japanese note: ${route}`);
      continue;
    }
    if (supported(route).includes(lang)) assert(url.pathname.startsWith(`/${lang}/`), label, `translated link leaves page language: ${url.pathname}`);
    else {
      assert(url.pathname.startsWith('/en/'), label, `untranslated link must retain English source: ${url.pathname}`);
      if (discovery && url.pathname.startsWith('/en/')) {
        assert(a.getAttribute('hreflang') === 'en', label, `English discovery fallback must declare hreflang=en: ${url.pathname}`);
        const note = a.querySelector('.discovery-language');
        assert(Boolean(note) && note.lang === 'en' && normal(note.textContent) === 'English', label, `English discovery fallback must show the English language name: ${url.pathname}`);
      }
    }
  }
  if (label.endsWith('contact.html')) compare([...doc.querySelectorAll('a[href^="mailto:"]')].map(a => a.href), [...sourceDoc.querySelectorAll('a[href^="mailto:"]')].map(a => a.href), label, 'contact destination changed');
}
function checkHomeAndJournal(doc, lang, route, label) {
  if (route === 'journal.html') {
    const link = doc.querySelector('[data-cta-id="journal-hero-train-search"]');
    const target = link && new URL(link.href);
    assert(target?.pathname === `/${fileFor(lang, 'start.html')}` && target.hash === '#journey', label, 'journal train CTA must open the train selector directly');
    for (const id of ['journal-save-help', 'journal-storage-help', 'journal-reset-help']) assert(Boolean(doc.getElementById(id)?.textContent.trim()), label, `storage explanation missing: ${id}`);
  }
  if (route !== 'index.html') return;
  const handoff = [...doc.querySelectorAll('script:not([src]):not([type])')].find(el => el.textContent.includes('h.indexOf("#spot-")'))?.textContent;
  assert(Boolean(handoff), label, 'legacy train-entry handoff missing');
  if (!handoff) return;
  for (const hash of ['#journey', '#spot-fuji']) {
    const current = new URL(urlFor(lang, route) + '?board=Shinagawa&dir=west' + hash);
    let redirected = '';
    // The early inline handoff executes before the parser reaches <base>.
    vm.runInNewContext(handoff, { URL, URLSearchParams, document: { baseURI: current.href }, localStorage: { getItem: () => null, setItem() {} }, location: { pathname: current.pathname, href: current.href, search: current.search, hash, replace: value => { redirected = value; } } });
    assert(redirected === `${urlFor(lang, 'start.html')}?board=Shinagawa&dir=west${hash}`, label, `legacy handoff lost language or journey: ${hash}`);
  }
}
function checkDynamic(lang, route) {
  const dom = domFor(lang, route), { window } = dom;
  window.scrollTo = () => {}; window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.requestAnimationFrame = callback => window.setTimeout(callback, 0);
  window.MADO_ANALYTICS_DISABLED = true;
  const allowed = new Set(['locales.js','data/timetable.js', 'data-runtime.js', 'track.js', 'spot-map.js', 'train-select.js', 'train-picker.js', 'app.js', 'utility-locale-runtime.js', `${lang}/utility-data.js`]);
  for (const script of window.document.querySelectorAll('script[src]')) {
    const file = new URL(script.src).pathname.slice(1);
    if (allowed.has(file)) window.eval(file === 'data-runtime.js' ? dataScript() : read(file));
  }
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  assert(window.document.documentElement.lang === lang, `${lang}/${route}`, 'app runtime reverted page language');
  if (route === 'zukan.html') assert(window.document.querySelectorAll('#galleryGrid [data-spot]').length > 0, `${lang}/${route}`, 'gallery did not render');
  else assert(window.document.querySelectorAll('#timeline .tl-item').length > 0, `${lang}/${route}`, 'timeline preview did not render');
  if (route === 'start.html') {
    const locale = window.MADO_UTILITY_LOCALE;
    assert(window.document.querySelector('[data-picker-text=btnFind]')?.textContent === locale.tables.picker.btnFind, `${lang}/${route}`, 'picker did not retain translated label');
  }
  dom.window.close(); counts.dynamic++;
}
async function forecastDom(lang) {
  const dom = domFor(lang, 'mieru.html'), { window } = dom;
  const fixture = index => ({ hourly: Object.fromEntries(['cloud_cover_low','cloud_cover_mid','cloud_cover_high','visibility','relative_humidity_2m','precipitation'].map(field => [field, Array.from({ length: 48 }, (_, h) => field === 'visibility' ? 5000 + ((h + index) % 10) * 4000 : field === 'relative_humidity_2m' ? 30 + ((h * 3 + index) % 65) : field === 'precipitation' ? ((h + index) % 11 === 0 ? 0.6 : 0) : (h * 7 + index * 11) % 100)])) });
  window.fetch = async url => {
    const count = new URL(url).searchParams.get('latitude').split(',').length;
    return { ok: true, json: async () => Array.from({ length: count }, (_, i) => { const data = fixture(i); data.hourly.time = Array.from({ length: 48 }, (_, h) => new Date(Date.UTC(2026, 9, 22, h)).toISOString().slice(0, 16)); return data; }) };
  };
  window.eval(dataScript());
  if (lang !== 'en') { window.eval(read(`${lang}/utility-data.js`)); window.eval(read('utility-locale-runtime.js')); }
  window.eval(read('train-select.js'));
  const code = window.document.querySelector('script[src*="mieru.js"]') ? read('mieru.js') : null;
  assert(Boolean(code), `${lang}/mieru.html`, 'shared forecast source missing');
  if (code) window.eval(code);
  await new Promise(resolve => setImmediate(resolve));
  assert(Boolean(window.__mieru?.data.summit), `${lang}/mieru.html`, 'mock forecast fetch/render failed');
  return dom;
}
async function checkForecastParity() {
  const doms = await Promise.all(['en', ...LOCALES].map(forecastDom));
  for (const [day, time] of [[0,'06:00'],[0,'09:25'],[0,'18:10'],[1,'07:40'],[1,'12:05'],[1,'18:55']]) {
    const snapshots = doms.map(dom => {
      const { window } = dom; window.document.getElementById('mieruModeTime').click(); window.document.getElementById('mieruDay').value = String(day); window.document.getElementById('mieruDep').value = time;
      window.document.getElementById('mieruDay').dispatchEvent(new window.Event('change'));
      window.document.getElementById('mieruDep').dispatchEvent(new window.Event('input'));
      assert(Object.keys(window.__mieru.results).length === 5, 'forecast manual mode', 'five calculated results missing');
      return JSON.parse(JSON.stringify(window.__mieru.results));
    });
    for (let i = 1; i < snapshots.length; i++) compare(snapshots[i], snapshots[0], `${LOCALES[i - 1]}/mieru.html`, `forecast values differ from English (day=${day}, departure=${time})`);
    counts.forecastScenarios++;
  }
  doms.forEach(dom => dom.window.close());
}
const dictionaries = Object.fromEntries(LOCALES.map(lang => [lang, checkDictionary(lang)]));
// Translated pages must use available translated destinations, including TOP.
for (const lang of LOCALES) {
  for (const entry of fs.readdirSync(path.join(root, lang), { recursive: true })) {
    if (!entry.endsWith('.html')) continue;
    const file = `${lang}/${entry.replaceAll('\\', '/')}`, html = read(file);
    const pageUrl = `${origin}/${file}`, baseHref = html.match(/<base\b[^>]*href="([^"]+)"/i)?.[1];
    const base = baseHref ? new URL(baseHref, pageUrl).href : pageUrl;
    const content = html.replace(/<div\b[^>]*class="[^"]*guide-lang-options[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    for (const match of content.matchAll(/<a\b([^>]*?)href="([^"]+)"([^>]*)>/gi)) {
      if (/\s(?:lang|data-lang)="en"/.test(match[1] + match[3])) continue;
      const url = new URL(match[2], base);
      if (url.origin !== origin || !url.pathname.startsWith('/en/')) continue;
      const target = url.pathname.slice(4) || 'index.html';
      const local = `${lang}/${target}${url.pathname.endsWith('/') && target !== 'index.html' ? 'index.html' : ''}`;
      assert(!exists(local), file, `available localized destination bypassed: ${match[2]} -> ${local}`);
    }
  }
  const dom = new JSDOM('', { runScripts: 'outside-only' });
  dom.window.MADO_UTILITY_PAYLOAD = { lang, translations: {}, tables: {}, routes: UTILITY_ROUTES };
  dom.window.eval(read('utility-locale-runtime.js'));
  for (const route of ['', 'index.html', '?intro=1', '#journey']) {
    assert(dom.window.MADO_UTILITY_LOCALE.href(route) === `${lang}/${route === 'index.html' ? '' : route}`, lang, `TOP runtime route leaves language: ${route}`);
  }
  dom.window.close();
}
for (const file of ['utility-locale-runtime.js','utility-locales.js','utility-locales.css', ...LOCALES.map(lang => `${lang}/utility-data.js`)]) checkManifest(file);
for (const route of UTILITY_ROUTES) {
  const source = deliveredUtilitySource(route);
  for (const lang of editions) {
    const label = fileFor(lang, route), dom = domFor(lang, route), doc = dom.window.document;
    checkMetadata(doc, lang, route, label); checkFiles(doc, label); checkMenu(dom, lang, route, label); checkHomeAndJournal(doc, lang, route, label);
    assert(sitemapUrls.has(urlFor(lang, route)), label, 'sitemap registration missing');
    // Japanese/English utility HTML is bundled by the existing shell, outside the content manifest.
    if (LOCALES.includes(lang) || manifest.has(label)) checkManifest(label);
    if (LOCALES.includes(lang)) checkStatic(doc, source.window.document, dictionaries[lang], lang, label);
    dom.window.close(); counts.pages++;
  }
  source.window.close();
}
for (const lang of LOCALES) for (const route of ['start.html','zukan.html']) checkDynamic(lang, route);
await checkForecastParity();
const stale = spawnSync(process.execPath, ['scripts/generate-utility-locales.mjs', '--check'], { cwd: root, encoding: 'utf8' });
assert(stale.status === 0, 'generated outputs', `stale-check failed: ${(stale.stderr || stale.stdout || '').trim().slice(0, 600)}`);
if (errors.length) { console.error(`Utility locales: FAIL (${errors.length})\n${errors.slice(0, 60).join('\n')}`); process.exit(1); }
console.log(`Utility locales: PASS (${counts.pages} pages, ${counts.dictionaries} dictionaries, ${counts.dynamic} dynamic pages, ${counts.narrationDirections} narration directions, ${counts.forecastScenarios} forecast parity scenarios).`);
