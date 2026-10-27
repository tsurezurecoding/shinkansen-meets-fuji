import {withPageAndroidAppInvite} from './shared/android-app-invite.mjs';
// Source of truth: the overseas-traveler English edition plus reviewed translations.
// Snapshot only first-party rendering, preserving photographs, credits and DOM behavior.
import fs from 'node:fs';
import { enOnly, episodes, supported, editions, languages, stripEdition } from './shared/locales.mjs';
import { YAMAZAKI_TRANSLATIONS } from './shared/yamazaki-locales.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { englishSnapshot, textNodes, TRANSLATABLE_ATTRIBUTES } from './shared/castle-localization.mjs';
import { CASTLE_LOCALE_LANGS, CASTLE_LOCALE_ROUTES, withArticleLocales } from './shared/castle-locales.mjs';
import { assetVersion } from './shared/asset-version.mjs';
import { appendArticleEditorialNote } from './shared/editorial-notes.mjs';
import { UTILITY_ROUTES } from './shared/utility-locales.mjs';
import { EXTRA_LOCALE_ROUTES } from './shared/extra-locale-routes.mjs';
import { CONTENT_METADATA, enhanceContentHead } from './shared/content-metadata.mjs';
import { finalizeSiteChrome } from './shared/site-chrome.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.michikusa-travel.com';
const check = process.argv.includes('--check');
const missing = new Set();
const requestedLang = process.argv.includes('--lang') ? process.argv[process.argv.indexOf('--lang') + 1] : null;
if (requestedLang && !CASTLE_LOCALE_LANGS.includes(requestedLang)) throw Error('Unknown castle locale: ' + requestedLang);
for (const lang of requestedLang ? [requestedLang] : CASTLE_LOCALE_LANGS) {
  const episodeFile = path.join(root, 'scripts/locales', `episode-${lang}.json`);
  let dictionary = { ...JSON.parse(fs.readFileSync(path.join(root, 'scripts/locales', `utility-${lang}.json`), 'utf8')), ...JSON.parse(fs.readFileSync(path.join(root, 'scripts/locales', `castle-${lang}.json`), 'utf8')), ...(fs.existsSync(episodeFile) ? JSON.parse(fs.readFileSync(episodeFile, 'utf8')) : {}) };
  const sceneryFile = path.join(root, 'scripts/locales', `scenery-${lang}.json`);
  const sceneryDictionary = fs.existsSync(sceneryFile) ? JSON.parse(fs.readFileSync(sceneryFile, 'utf8')) : {};
  const commonDictionary = dictionary;
  const everydayDictionaries = Object.fromEntries([['foods.html','foods'],['countryside.html','countryside'],['spots/gamagori-greenhouses.html','greenhouses']].map(([route,name]) => { const file=path.join(root,`scripts/shared/${name}-locales.json`); return [route, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8'))[lang] || {} : {}]; }));
  function tr(value) {
    const key = value.trim();
    if (!key) return value;
    let result = dictionary[key];
    if (result === undefined && key.endsWith(' | Shinkansen Window')) result = tr(key.slice(0, -' | Shinkansen Window'.length)) + ' | Shinkansen Window';
    if (typeof result !== 'string' || !result.trim()) { missing.add(`${lang}: ${key}`); return value; }
    return value.replace(key, () => result);
  }
  for (const route of [...CASTLE_LOCALE_ROUTES, ...Object.keys(episodes).filter(route => episodes[route].includes(lang) && !enOnly.includes(route))]) {
    const sceneryRoute = /^spots\/(?:fujikawa-bridge|fuji-paper-mills|ibuki(?:-seat-a)?)\.html$/.test(route);
    dictionary = route === 'spots/yamazaki-distillery.html' ? { ...commonDictionary, ...sceneryDictionary, ...YAMAZAKI_TRANSLATIONS[lang] } : sceneryRoute ? { ...commonDictionary, ...sceneryDictionary } : everydayDictionaries[route] ? { ...commonDictionary, ...everydayDictionaries[route] } : commonDictionary;
    const dom = englishSnapshot(root, route);
    const doc = dom.window.document;
    // These editions ship a static article. Keep images usable without JS,
    // with responsive candidates and native lazy loading at their final layout.
    for (const image of doc.querySelectorAll('[data-photo-deferred]')) {
      image.setAttribute('src', image.getAttribute('data-photo-display-src') || image.getAttribute('data-photo-original-src'));
      if (image.getAttribute('data-photo-srcset')) {
        image.setAttribute('srcset', image.getAttribute('data-photo-srcset'));
        image.setAttribute('sizes', dom.window.MADO_SPOT_PHOTOS.sizes);
      }
      image.setAttribute('loading', 'lazy');
      image.removeAttribute('data-photo-deferred');
      image.removeAttribute('data-photo-observed');
    }
    doc.querySelectorAll('[data-article-connections]').forEach(el => el.remove());
    const prefix = route.startsWith('spots/') ? '../../' : '../';
    const file = `${lang}/${route}`;
    // The translated snapshot is already rendered. Reuse common interaction scripts.
    doc.querySelectorAll('script[src]').forEach(el => {
      if (/spot-page-(?:shared-data|loader)|data\/spot-pages\/|platform.twitter.com/.test(el.getAttribute('src'))) el.remove();
    });
    doc.querySelectorAll('[data-spot-page-shared-module]').forEach(el => el.removeAttribute('data-spot-page-shared-module'));
    doc.body.setAttribute('data-article-localized', '');
    doc.body.setAttribute('data-spot-page-shared-lang', lang);
    doc.documentElement.lang = lang;
    if (route === 'yakei.html') {
      // Retain the existing night-view calculator; the utility adapter supplies
      // the translated station/spot names and the shared eight-language picker.
      for (const script of doc.querySelectorAll('script:not([src])')) {
        script.textContent = script.textContent.replace('window.YAKEI_LANG = "en";', `window.YAKEI_LANG = ${JSON.stringify(lang)};`);
      }
      const runtime = doc.querySelector('script[src*="data-runtime.js"]');
      let runtimeAnchor = runtime;
      for (const asset of [`${lang}/utility-data.js`, 'utility-locale-runtime.js']) {
        const script = doc.createElement('script');
        script.src = `${prefix}${asset}?v=${assetVersion(asset)}`;
        // Insert in source order: data, payload, adapter, then train picker.
        runtimeAnchor.after(script);
        runtimeAnchor = script;
      }
    }
    doc.querySelectorAll('[lang="en"]').forEach(el => el.lang = lang);
    for (const node of textNodes(doc)) if (!node.parentElement.closest('.brand-mark, .show-credit, figcaption a:not([data-gallery-source-output])')) node.textContent = tr(node.textContent);
    for (const el of doc.querySelectorAll('*')) for (const attr of TRANSLATABLE_ATTRIBUTES) {
      if (el.hasAttribute(attr) && el.getAttribute(attr).trim()) el.setAttribute(attr, tr(el.getAttribute(attr)));
    }
    doc.title = tr(doc.title);
    if (lang === 'zh-Hant' && route === 'castles.html') {
      const title = doc.querySelector('h1');
      const text = title.textContent;
      title.replaceChildren();
      for (const chunk of [text.slice(0, -4), text.slice(-4)]) {
        const span = doc.createElement('span'); span.className = 'article-title-chunk'; span.textContent = chunk; title.appendChild(span);
      }
    }
    for (const el of doc.querySelectorAll('meta')) {
      const key = el.getAttribute('name') || el.getAttribute('property') || '';
      if (/(?:description|title|image:alt)$/.test(key)) el.setAttribute('content', tr(el.content));
      if (key === 'og:locale') el.content = editions[lang].og;
      if (key === 'og:url') el.content = `${origin}/${file}`;
      if (/article:(?:published|modified)_time/.test(key)) el.remove();
    }
    const canonicalRoute = stripEdition(new URL(doc.querySelector('link[rel="canonical"]').href).pathname.slice(1));
    doc.querySelector('link[rel="canonical"]').href = `${origin}/${lang}/${canonicalRoute}`;
    const ogUrl = doc.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = doc.querySelector('link[rel="canonical"]').href;
    // Known translated destinations remain in this edition. Keep the English
    // fallback routes, without repeating a visible language label on every link.
    for (const el of doc.querySelectorAll('a[href]')) {
      if (el.closest('.lang-switch')) continue;
      const href = el.getAttribute('href');
      if (/^(?:https?:|\/\/|mailto:|tel:|#)/.test(href)) continue;
      const url = new URL(href, `${origin}/en/${route}`);
      let target = url.pathname.slice(1).replace(/^en\//, '').replace(/^$/, 'index.html');
      if (target === 'spots/hamanako-fuji.html') { target = 'spots/hamanako.html'; url.hash = 'hamanako-fuji'; }
      if (supported(target).includes(lang)) {
        el.setAttribute('href', prefix + lang + '/' + (target === 'index.html' ? '' : target) + url.search + url.hash);
      } else if (url.pathname.startsWith('/en/') && !el.closest('.lang-switch')) {
        el.setAttribute('href', prefix + 'en/' + target + url.search + url.hash);
        el.setAttribute('hreflang', 'en');
        if (el.matches('.content-rail-discovery .content-rail-card')) {
          const note = doc.createElement('small'); note.className = 'discovery-language'; note.lang = 'en'; note.textContent = 'English';
          el.querySelector('.content-rail-card-body').append(note);
        }
      }
    }
    for (const host of doc.querySelectorAll('.lang-switch')) {
      const menu = doc.createElement('details');
      menu.className = 'guide-lang-menu article-lang-menu';
      const summary = doc.createElement('summary');
      summary.textContent = editions[lang].label;
      summary.setAttribute('aria-label', editions[lang].prompt);
      const options = doc.createElement('div');
      options.className = 'guide-lang-options';
      for (const [edition, label] of supported(canonicalRoute).map(edition => [edition, editions[edition].label])) {
        const a = doc.createElement('a');
        a.href = prefix + (edition === 'ja' ? '' : edition + '/') + canonicalRoute + (edition === 'ja' ? '?lang=ja' : '');
        a.lang = edition; a.textContent = label;
        if (edition === lang) a.setAttribute('aria-current','page');
        options.appendChild(a);
      }
      menu.append(summary, options);
      host.replaceWith(menu);
    }
    for (const el of doc.querySelectorAll('[data-map-src],iframe[src*="google.com/maps"]')) {
      const attr = el.hasAttribute('data-map-src') ? 'data-map-src' : 'src';
      const url = new URL(el.getAttribute(attr)); url.searchParams.set('language', editions[lang].map); el.setAttribute(attr, url.href);
    }
    for (const el of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const rewrite = (value, key = '') => {
        if (Array.isArray(value)) return value.map(item => rewrite(item));
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([k]) => !['datePublished','dateModified'].includes(k)).map(([k,v]) => [k,rewrite(v,k)]));
        if (key === 'inLanguage') return lang;
        if (typeof value !== 'string') return value;
        if (value.startsWith(origin + '/en/')) {
          const rest = value.slice((origin + '/en/').length).split('#')[0];
          if (supported(rest).includes(lang)) return value.replace('/en/', `/${lang}/`);
        }
        return ['name','headline','description','caption'].includes(key) && dictionary[value] ? dictionary[value] : value;
      };
      el.textContent = JSON.stringify(rewrite(JSON.parse(el.textContent)), null, 2);
    }
    for (const asset of ['style.css','spot-media-gallery.css','article-locales.css']) {
      if (!doc.querySelector(`link[href*="${asset}"]`)) {
        const link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = `${prefix}${asset}?v=${assetVersion(asset)}`; doc.head.appendChild(link);
      }
    }
    for (const asset of ['spot-page-shared.js','spot-media-gallery.js','spot-map.js']) {
      if (!doc.querySelector(`script[src*="${asset}"]`)) {
        const script = doc.createElement('script'); script.src = `${prefix}${asset}?v=${assetVersion(asset)}`; doc.body.appendChild(script);
      }
    }
    // Hash existing shared dependencies too, so regeneration equals sync:versions.
    for (const el of doc.querySelectorAll('script[src],link[href]')) {
      const attr = el.tagName === 'SCRIPT' ? 'src' : 'href';
      const value = el.getAttribute(attr);
      if (/^(?:https?:|\/\/)/.test(value) || !/\.(?:js|css)\?v=/.test(value)) continue;
      const url = new URL(value, `${origin}/en/${route}`);
      const asset = url.pathname.slice(1);
      el.setAttribute(attr, value.replace(/\?v=[^&#]+/, `?v=${assetVersion(asset)}`));
    }
    doc.querySelectorAll('noscript').forEach(el => { if (el.textContent.includes('data-spot-page-shared-static')) el.remove(); });
    appendArticleEditorialNote(doc, lang, route);
    let html = dom.serialize().replace(/^[ \t]+$/gm, '').replace(/<!-- Generated by [^>]+-->/, '<!-- Generated by scripts/generate-castle-locales.mjs from the English edition; edit scripts/locales. -->');
    html = html.replace(/<head[\s\S]*?<\/head>/, head => withArticleLocales(head, file, assetVersion('article-locales.js')));
    if (CONTENT_METADATA[file]) html = enhanceContentHead(html, file, root, {lang});
    html = withPageAndroidAppInvite(html,file);
    html = finalizeSiteChrome(html,file,root);
    const dest = path.join(root, file);
    if (check) { if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error(`Localized article stale: ${file}`); }
    else { fs.mkdirSync(path.dirname(dest), {recursive:true}); fs.writeFileSync(dest, html); }
    dom.window.close();
  }
}
if (missing.size) throw Error(`Translation missing:\n${[...missing].join('\n')}`);
console.log(`Castle/companion localized articles: ${CASTLE_LOCALE_LANGS.length * CASTLE_LOCALE_ROUTES.length} pages, English source.`);
