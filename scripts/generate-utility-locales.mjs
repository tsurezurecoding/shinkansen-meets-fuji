// English traveler-facing pages are the structural/content source for these editions.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UTILITY_ROUTES, LOCALES, ATTRS, FORECAST_COPY, collectEnglish, utilitySnapshot, englishTables, englishRuntimeData, englishNarrations, valueTemplate, translationKey, translatable } from './shared/utility-localization.mjs';
import { textNodes } from './shared/castle-localization.mjs';
import { CASTLE_LOCALE_ROUTES } from './shared/castle-locales.mjs';
import { assetVersion } from './shared/asset-version.mjs';
import { withUtilityLocales, publicPath } from './shared/utility-locales.mjs';
const publicFile = file => file.replace(/(^|\/)index\.html$/, '$1').replace('live/index.html', 'live/');
import { EXTRA_LOCALE_ROUTES } from './shared/extra-locale-routes.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.michikusa-travel.com';
const check = process.argv.includes('--check');
const routes = [...UTILITY_ROUTES, ...CASTLE_LOCALE_ROUTES, ...EXTRA_LOCALE_ROUTES, 'guide.html'];
const tables = englishTables(root);
const data = englishRuntimeData(root);
const narrations = englishNarrations(root);
function write(file, value) {
  const target = path.join(root, file);
  const old = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (old === value) return;
  if (check) throw Error(`Utility locale output is stale: ${file}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}
function forecastScript(source) {
  let code = source;
  function replace(from, to) {
    if (!code.includes(from)) throw Error(`English forecast contract changed: ${from.slice(0, 60)}`);
    code = code.replace(from, to);
  }
  replace('"use strict";', '"use strict";\n  var U = window.MADO_UTILITY_LOCALE;');
  replace('(s.en && s.en.name) || id, area: (s.en && s.en.area) || ""', '(s[U.lang] && s[U.lang].name) || id, area: (s[U.lang] && s[U.lang].area) || ""');
  replace('p >= 0.8 ? "Visible" : p >= 0.55 ? "Probably visible" : p >= 0.3 ? "A chance" : "Unlikely"', 'p >= 0.8 ? U.forecast.visible : p >= 0.55 ? U.forecast.probable : p >= 0.3 ? U.forecast.chance : U.forecast.unlikely');
  replace('r.mi >= r.lo && r.mi >= r.hi ? "mid-level cloud" : (r.lo >= r.hi ? "low cloud" : "high cloud")', 'r.mi >= r.lo && r.mi >= r.hi ? U.forecast.mid : (r.lo >= r.hi ? U.forecast.low : U.forecast.high)');
  replace('"The summit is likely to be obscured by " + c + " (cloud cover: low " + Math.round(r.lo) + "%, mid " + Math.round(r.mi) + "%, high " + Math.round(r.hi) + "%)."', 'U.format("cloud", c, Math.round(r.lo), Math.round(r.mi), Math.round(r.hi))');
  replace('"Haze is limiting the view (visibility about " + Math.round(r.V) + " km; humidity " + Math.round(r.rh) + "%)."', 'U.format("haze", Math.round(r.V), Math.round(r.rh))');
  replace('"The summit is mostly clear and the air is transparent (visibility about " + Math.round(r.V) + " km)."', 'U.format("clear", Math.round(r.V))');
  replace('"Conditions are finely balanced."', 'U.forecast.balanced');
  replace('"Weather data could not be loaded. Please try again in a little while."', 'U.forecast.error');
  replace('s.name + " around " + ("0"+hh).slice(-2) + ":" + ("0"+mm).slice(-2)', 'U.format("around", s.name, ("0"+hh).slice(-2) + ":" + ("0"+mm).slice(-2))');
  replace('"Forecast for this train: "', 'U.forecast.train');
  replace("s.area + ' · about ' + s.min + ' min from Tokyo · viewing distance about ' + s.d + ' km · Seat ' + s.side", 'U.format("meta", s.area, s.min, s.d, s.side)');
  replace("'<span class=\"mieru-verdict\">Best ' + (day ? \"tomorrow\" : \"today\") + ': ' + (H0+bestI) + ':00 <b>'", "'<span class=\"mieru-verdict\">' + U.format(\"best\", day ? U.forecast.tomorrow : U.forecast.today, (H0+bestI) + ':00') + ' <b>'");
  return code;
}
const requestedLang = process.argv.includes('--lang') ? process.argv[process.argv.indexOf('--lang') + 1] : null;
if (requestedLang && !LOCALES.includes(requestedLang)) throw Error(`Unknown utility locale: ${requestedLang}`);
for (const lang of requestedLang ? [requestedLang] : LOCALES) {
  const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'scripts/locales', `utility-${lang}.json`), 'utf8'));
  const missing = collectEnglish(root).filter(key => !dictionary[key]);
  if (missing.length) throw Error(`${lang}: ${missing.length} translations missing: ${missing.slice(0, 8).join(' / ')}`);
  function tr(value) {
    if (!translatable(value)) return value;
    const key = translationKey(value);
    if (!dictionary[key]) throw Error(`${lang}: translation missing: ${key}`);
    return value.replace(key, () => dictionary[key]);
  }
  function translateObject(value) {
    if (typeof value === 'string') return translatable(value) && dictionary[translationKey(value)] ? tr(value) : value;
    if (Array.isArray(value)) return value.map(translateObject);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translateObject(item)]));
    return value;
  }
  const translatedTables = Object.fromEntries(Object.entries(tables).map(([name, table]) => [name, Object.fromEntries(Object.entries(table).map(([key, value]) => {
    const item = valueTemplate(value); item.text = tr(item.text); return [key, item];
  }))]));
  const translatedNarrations = Object.fromEntries(Object.entries(narrations).map(([id, directions]) => [id, Object.fromEntries(Object.entries(directions).filter(([, v]) => v.en).map(([direction, variants]) => {
    const item = { ...variants.en, text: tr(variants.en.text) };
    if (item.audio !== false && !item.audio) item.audio = `audio/${id}_${direction}_en.mp3`;
    return [direction, item];
  }))]));
  const payload = {
    lang, translations: dictionary, tables: translatedTables,
    spots: Object.fromEntries(data.SPOTS.map(spot => [spot.id, translateObject(spot.en)])),
    narrations: translatedNarrations,
    forecast: Object.fromEntries(Object.entries(FORECAST_COPY).map(([key, text]) => [key, tr(text)])),
    routes,
  };
  write(`${lang}/utility-data.js`, '/* Generated from English utility content; edit scripts/locales/utility-' + lang + '.json. */\nwindow.MADO_UTILITY_PAYLOAD=' + JSON.stringify(payload) + ';\n');
  for (const route of UTILITY_ROUTES) {
    const dom = utilitySnapshot(root, route);
    const doc = dom.window.document;
    const file = `${lang}/${route}`;
    doc.documentElement.lang = lang;
    doc.body.setAttribute('data-utility-localized', '');
    if (route === 'mieru.html') {
      doc.body.setAttribute('data-article-localized', '');
      doc.body.setAttribute('data-spot-page-shared-lang', lang);
      doc.querySelectorAll('[data-spot-page-shared-module]').forEach(el => el.removeAttribute('data-spot-page-shared-module'));
    }
    for (const node of textNodes(doc)) if (!node.parentElement.closest('.lang-switch,.show-credit')) node.textContent = tr(node.textContent);
    for (const el of doc.querySelectorAll('*')) for (const attr of ATTRS) if (el.getAttribute(attr)?.trim()) el.setAttribute(attr, tr(el.getAttribute(attr)));
    doc.title = tr(doc.title);
    for (const el of doc.querySelectorAll('meta')) {
      const name = el.name || el.getAttribute('property') || '';
      if (/(?:description|title|image:alt)$/.test(name)) el.content = tr(el.content);
      if (name === 'og:url') el.content = `${origin}/${publicFile(file)}`;
      if (name === 'og:locale') el.content = lang === 'fr' ? 'fr_FR' : 'zh_TW';
    }
    doc.querySelector('link[rel="canonical"]').href = `${origin}/${publicFile(file)}`;
    for (const schema of doc.querySelectorAll('script[type="application/ld+json"]')) {
      let item = translateObject(JSON.parse(schema.textContent));
      function localizeSchema(value) {
        if (!value || typeof value !== 'object') return;
        for (const [key, field] of Object.entries(value)) {
          if (key === 'inLanguage') value[key] = lang;
          else if (typeof field === 'string' && (publicPath(route) ? field.startsWith(`${origin}/en/${publicPath(route)}`) : field === `${origin}/en/`)) value[key] = field.replace(`${origin}/en/${publicPath(route)}`, `${origin}/${publicFile(file)}`);
          else localizeSchema(field);
        }
      }
      localizeSchema(item); schema.textContent = '\n' + JSON.stringify(item, null, 2) + '\n';
    }
    for (const el of doc.querySelectorAll('a[href]')) {
      if (el.closest('.lang-switch')) continue;
      const href = el.getAttribute('href');
      if (/^(?:https?:|\/\/|mailto:|tel:|#)/.test(href)) continue;
      const url = new URL(href, doc.baseURI);
      const target = url.pathname.slice(1).replace(/^en\//, '').replace(/^live\/$/, 'live/index.html').replace(/^$/, 'index.html');
      const destination = (routes.includes(target) ? `${lang}/` : 'en/') + (target === 'index.html' ? '' : target);
      const prefix = doc.querySelector('base') ? '' : '../'.repeat(file.split('/').length - 1);
      el.setAttribute('href', prefix + destination + url.search + url.hash);
    }
    for (const host of doc.querySelectorAll('.lang-switch')) {
      const prefix = doc.querySelector('base') ? '' : '../'.repeat(file.split('/').length - 1);
      const menu = doc.createElement('details'); menu.className = 'guide-lang-menu utility-lang-menu';
      const summary = doc.createElement('summary'); summary.textContent = lang === 'fr' ? 'Français' : '繁體中文';
      summary.setAttribute('aria-label', lang === 'fr' ? 'Choisir la langue' : '選擇語言');
      const options = doc.createElement('div'); options.className = 'guide-lang-options';
      for (const [edition, label] of [['ja','日本語'], ['en','English'], ['zh-Hant','繁體中文'], ['fr','Français']]) {
        const a = doc.createElement('a'); a.textContent = label; a.lang = edition;
        a.href = prefix + (edition === 'ja' ? '' : edition + '/') + route + (edition === 'ja' ? '?lang=ja' : '');
        if (edition === lang) a.setAttribute('aria-current', 'page');
        options.appendChild(a);
      }
      menu.append(summary, options); host.replaceWith(menu);
    }
    // Explicit page language replaces the English mirror's storage bootstrap.
    for (const el of doc.querySelectorAll('script:not([src]):not([type])')) {
      if (el.textContent.includes('localStorage.setItem("mado-lang", "en")')) el.textContent = el.textContent.replace('localStorage.setItem("mado-lang", "en")', `localStorage.setItem("mado-lang", "${lang}")`);
      if (route === 'mieru.html' && el.textContent.includes('var SUMMIT')) el.textContent = forecastScript(el.textContent);
    }
    const prefix = doc.querySelector('base') ? '' : '../'.repeat(file.split('/').length - 1);
    const dataScript = doc.createElement('script'); dataScript.src = prefix + lang + '/utility-data.js?v=' + assetVersion(`${lang}/utility-data.js`);
    const runtime = doc.createElement('script'); runtime.src = prefix + 'utility-locale-runtime.js?v=' + assetVersion('utility-locale-runtime.js');
    const firstParty = doc.querySelector(`script[src*="app.js"],script[src*="live/live.js"],script[src*="spot-page-shared.js"]`);
    // Data mutation must follow data-runtime.js, and precede application rendering.
    const dataSource = doc.querySelector('script[src*="data-runtime.js"]');
    if (dataSource) dataSource.after(dataScript, runtime);
    else if (firstParty) firstParty.before(dataScript, runtime);
    else doc.body.append(dataScript, runtime);
    if (route === 'live/index.html') {
      doc.querySelector('#btn-settings')?.setAttribute('title', tr(tables.live.settings));
      doc.querySelector('#btn-dir')?.setAttribute('title', tr(tables.live.dirL));
      const notice = doc.createElement('p'); notice.className = 'utility-audio-note'; notice.textContent = tr(FORECAST_COPY.audio);
      doc.querySelector('#idle-panel')?.append(notice);
    }
    for (const el of doc.querySelectorAll('script[src],link[rel="stylesheet"]')) {
      const attr = el.tagName === 'SCRIPT' ? 'src' : 'href'; const href = el.getAttribute(attr);
      if (/^(?:https?:|\/\/)/.test(href) || !/\.(?:js|css)\?v=/.test(href)) continue;
      const asset = new URL(href, doc.baseURI).pathname.slice(1).replace(/^en\/(utility-data\.js)$/, `${lang}/$1`);
      el.setAttribute(attr, href.replace(/\?v=[^&#]+/, `?v=${assetVersion(asset)}`));
    }
    let html = withUtilityLocales(dom.serialize(), file);
    write(file, html);
  }
}
// Hand-authored Japanese pages and English contact/forecast must retain these additions.
for (const route of UTILITY_ROUTES) for (const lang of ['ja', 'en']) {
  const file = (lang === 'ja' ? '' : 'en/') + route;
  write(file, withUtilityLocales(fs.readFileSync(path.join(root, file), 'utf8'), file));
}
console.log('Utility locales: 10 translated pages, shared dynamic dictionaries, four-way language routes.');
