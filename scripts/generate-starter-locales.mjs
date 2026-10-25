// Limited editions: English source + reviewed Italian/Thai manuscripts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import locales, { editions, supported, stripEdition, withLocaleRegistry } from './shared/locales.mjs';
import { englishSnapshot, textNodes } from './shared/castle-localization.mjs';
import { ATTRS, utilitySnapshot, englishTables, englishRuntimeData, valueTemplate, translationKey, translatable } from './shared/utility-localization.mjs';
import { assetVersion } from './shared/asset-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const report = process.argv.includes('--report-missing');
const origin = 'https://www.michikusa-travel.com';
const alternateHreflang = edition => ({ 'zh-Hant': 'zh-Hant-TW', 'zh-Hans': 'zh-Hans-CN' }[edition] || edition);
const routes = locales.starterRoutes;
const sourceTables = englishTables(root);
const tables = { app: sourceTables.app, picker: sourceTables.picker };
const data = englishRuntimeData(root);
function write(file, text) {
  text = text.replace(/^[ \t]+$/gm, "");
  if (report) return;
  const target = path.join(root, file);
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === text) return;
  if (check) throw Error('Starter locale output stale: ' + file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
}
for (const lang of locales.starter) {
  const dictionary = JSON.parse(fs.readFileSync(path.join(root, `scripts/locales/utility-${lang}.json`), 'utf8'));
  const missing = new Set();
  function tr(value) {
    if (!translatable(value)) return value;
    const key = translationKey(value);
    if (!dictionary[key]) { missing.add(key); return value; }
    return value.replace(key, () => dictionary[key]);
  }
  function translate(value) {
    if (typeof value === 'string') return tr(value);
    if (Array.isArray(value)) return value.map(translate);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, translate(child)]));
    return value;
  }
  const payload = {
    lang, translations: dictionary,
    tables: Object.fromEntries(Object.entries(tables).map(([kind, table]) => [kind, Object.fromEntries(Object.entries(table).map(([key, value]) => {
      const item = valueTemplate(value); item.text = tr(item.text); return [key, item];
    }))])),
    spots: Object.fromEntries(data.SPOTS.map(spot => [spot.id, Object.fromEntries(['name', 'area', 'hook'].filter(key => spot.en?.[key]).map(key => [key, tr(spot.en[key])]))])),
    routes, narrations: {}, forecast: {},
  };
  // Payload precedes application rendering; non-localized audio has no payload.
  write(`${lang}/utility-data.js`, '/* Generated from reviewed utility dictionary. */\nwindow.MADO_UTILITY_PAYLOAD=' + JSON.stringify(payload) + ';\n');
  if (!report) assetVersion(`${lang}/utility-data.js`, true);
  for (const route of routes) {
    const dom = route.startsWith('spots/') ? englishSnapshot(root, route) : utilitySnapshot(root, route);
    const doc = dom.window.document;
    const file = `${lang}/${route}`;
    const prefix = doc.querySelector('base') ? '' : '../'.repeat(file.split('/').length - 1);
    doc.querySelectorAll('.lang-switch,.guide-lang-menu').forEach(el => el.remove());
    if (route.startsWith('spots/')) {
      doc.querySelectorAll('script[src]').forEach(el => {
        if (/spot-page-(?:shared-data|loader)|data\/spot-pages\//.test(el.getAttribute('src'))) el.remove();
      });
      doc.querySelectorAll('[data-spot-page-shared-module]').forEach(el => el.removeAttribute('data-spot-page-shared-module'));
      doc.body.setAttribute('data-article-localized', '');
      for (const asset of ['style.css', 'article-locales.css']) {
        const present = [...doc.querySelectorAll('link[rel="stylesheet"]')].some(link => link.getAttribute('href')?.split('?')[0].endsWith('/' + asset));
        if (!present) {
          const stylesheet = doc.createElement('link'); stylesheet.rel = 'stylesheet';
          stylesheet.href = prefix + asset + '?v=' + assetVersion(asset); doc.head.append(stylesheet);
        }
      }
      const interaction = doc.createElement('script'); interaction.src = prefix + 'spot-page-shared.js?v=' + assetVersion('spot-page-shared.js'); doc.body.append(interaction);
    }
    doc.documentElement.lang = lang;
    doc.body.setAttribute('data-language-route', lang);
    doc.body.setAttribute('data-utility-localized', '');
    doc.body.setAttribute('data-spot-page-shared-lang', lang);
    for (const node of textNodes(doc)) if (!node.parentElement.closest('.brand-mark,.show-credit,code')) node.textContent = tr(node.textContent);
    for (const el of doc.querySelectorAll('*')) for (const attr of ATTRS) if (el.hasAttribute(attr)) el.setAttribute(attr, tr(el.getAttribute(attr)));
    doc.title = tr(doc.title);
    for (const el of doc.querySelectorAll('meta')) {
      const key = el.name || el.getAttribute('property') || '';
      if (/(?:description|title|image:alt)$/.test(key)) el.content = tr(el.content);
      if (key === 'og:url') el.content = `${origin}/${lang}/${route === 'index.html' ? '' : route}`;
      if (key === 'og:locale') el.content = editions[lang].og;
    }
    doc.querySelector('link[rel="canonical"]').href = `${origin}/${lang}/${route === 'index.html' ? '' : route}`;
    for (const el of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const schema = JSON.parse(el.textContent);
      function localize(value, key = '') {
        if (Array.isArray(value)) return value.map(item => localize(item, key));
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v, k)]));
        if (key === 'inLanguage') return lang;
        if (typeof value !== 'string') return value;
        if (value.startsWith(origin + '/en/')) {
          const rest = value.slice((origin + '/en/').length);
          return routes.includes(rest.split('#')[0] || 'index.html') ? value.replace('/en/', '/' + lang + '/') : value;
        }
        return ['name', 'description', 'text', 'headline', 'caption'].includes(key) ? tr(value) : value;
      }
      el.textContent = JSON.stringify(localize(schema));
    }
    for (const a of doc.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (/^(?:https?:|\/\/|mailto:|tel:|#)/.test(href)) continue;
      const url = new URL(href, doc.baseURI);
      const target = stripEdition(url.pathname.slice(1)).replace(/^live\/$/, 'live/index.html') || 'index.html';
      const available = routes.includes(target);
      const targetLang = available ? lang : a.getAttribute('hreflang') === 'ja' ? 'ja' : 'en';
      a.setAttribute('href', prefix + (targetLang === 'ja' ? '' : targetLang + '/') + (target === 'index.html' ? '' : target) + url.search + url.hash);
      if (!available && targetLang === 'en' && a.textContent.trim()) {
        a.hreflang = 'en';
        const note = doc.createElement('small'); note.className = 'discovery-language';
        note.textContent = ' (' + tr(target === 'live/index.html' ? 'English — audio also in English' : 'English') + ')';
        a.append(note);
      }
    }
    const menu = doc.createElement('details'); menu.className = 'guide-lang-menu utility-lang-menu';
    const summary = doc.createElement('summary'); summary.textContent = editions[lang].label; summary.setAttribute('aria-label', editions[lang].prompt);
    const options = doc.createElement('div'); options.className = 'guide-lang-options';
    for (const language of supported(route)) {
      const a = doc.createElement('a'); a.lang = language; a.textContent = editions[language].label;
      a.href = prefix + (language === 'ja' ? '' : language + '/') + route + (language === 'ja' ? '?lang=ja' : '');
      if (language === lang) a.setAttribute('aria-current', 'page'); options.append(a);
    }
    menu.append(summary, options);
    (doc.querySelector('.topbar,.site-header,header') || doc.body).append(menu);
    doc.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());
    for (const language of supported(route).concat('x-default')) {
      const el = doc.createElement('link'); el.rel = 'alternate'; el.hreflang = route === 'guide.html' ? alternateHreflang(language) : language;
      el.href = `${origin}/${language === 'ja' ? '' : (language === 'x-default' ? 'en' : language) + '/'}${route === 'index.html' ? '' : route}`;
      doc.head.append(el);
    }
    for (const script of doc.querySelectorAll('script:not([src]):not([type])')) {
      if (route === "index.html" && script.textContent.includes('h.indexOf("#spot-")')) script.textContent = `(function(){var h=location.hash;if(h!=="#journey"&&h.indexOf("#spot-")!==0)return;var u=new URL("${prefix}${lang}/start.html",document.baseURI);u.search=location.search;u.hash=h;location.replace(u.href)})();`;
      script.textContent = script.textContent.replaceAll('localStorage.setItem("mado-lang", "en")', `localStorage.setItem("mado-lang", "${lang}")`);
    }
    // Remove the English invitation; this edition does not offer Italian/Thai app audio.
    let html = dom.serialize().replace(/<!-- ANDROID_APP_INVITE_START -->[\s\S]*?<!-- ANDROID_APP_INVITE_END -->/g, '');
    dom.window.close();
    // All four pages receive the adapter, including guide controls and fallback links.
    const scripts = `<script src="${prefix}${lang}/utility-data.js?v=${report ? 'pending' : assetVersion(`${lang}/utility-data.js`)}"></script>\n<script src="${prefix}utility-locale-runtime.js?v=${assetVersion('utility-locale-runtime.js')}"></script>`;
    const dataTag = /<script[^>]*src="[^"]*data-runtime\.js[^"]*"[^>]*><\/script>/;
    html = dataTag.test(html) ? html.replace(dataTag, '$&\n' + scripts) : html.replace('</head>', scripts + '\n</head>');
    html = withLocaleRegistry(html, prefix);
    write(file, html);
  }
  if (missing.size) {
    console.log(JSON.stringify({lang, missing: [...missing]}, null, 2));
    if (!report) throw Error(`${lang}: ${missing.size} missing translations`);
  } else console.log(`${lang}: four starter pages and runtime dictionary ${check ? 'checked' : 'generated'}.`);
}
