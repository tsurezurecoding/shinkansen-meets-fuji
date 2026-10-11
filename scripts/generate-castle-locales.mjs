// Source of truth: the overseas-traveler English edition plus reviewed translations.
// Snapshot only first-party rendering, preserving photographs, credits and DOM behavior.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { englishSnapshot, textNodes, TRANSLATABLE_ATTRIBUTES } from './shared/castle-localization.mjs';
import { CASTLE_LOCALE_LANGS, CASTLE_LOCALE_ROUTES, withArticleLocales } from './shared/castle-locales.mjs';
import { assetVersion } from './shared/asset-version.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.michikusa-travel.com';
const check = process.argv.includes('--check');
const missing = new Set();
for (const lang of CASTLE_LOCALE_LANGS) {
  const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'scripts/locales', `castle-${lang}.json`), 'utf8'));
  function tr(value) {
    const key = value.trim();
    if (!key) return value;
    let result = dictionary[key];
    if (result === undefined && key.endsWith(' | Shinkansen Window')) result = tr(key.slice(0, -' | Shinkansen Window'.length)) + ' | Shinkansen Window';
    if (result === undefined) { missing.add(`${lang}: ${key}`); return value; }
    return value.replace(key, () => result);
  }
  for (const route of CASTLE_LOCALE_ROUTES) {
    const dom = englishSnapshot(root, route);
    const doc = dom.window.document;
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
    doc.querySelectorAll('[lang="en"]').forEach(el => el.lang = lang);
    for (const node of textNodes(doc)) if (!node.parentElement.closest('.show-credit, figcaption a:not([data-gallery-source-output])')) node.textContent = tr(node.textContent);
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
      if (key === 'og:locale') el.content = lang === 'fr' ? 'fr_FR' : 'zh_TW';
      if (key === 'og:url') el.content = `${origin}/${file}`;
      if (/article:(?:published|modified)_time/.test(key)) el.remove();
    }
    doc.querySelector('link[rel="canonical"]').href = `${origin}/${file}`;
    // Known translated destinations remain in this edition. Other site tools are
    // explicitly labelled English until the separately scheduled TOP/search work.
    for (const el of doc.querySelectorAll('a[href]')) {
      if (el.closest('.lang-switch')) continue;
      const href = el.getAttribute('href');
      if (/^(?:https?:|\/\/|mailto:|tel:|#)/.test(href)) continue;
      const url = new URL(href, `${origin}/en/${route}`);
      let target = url.pathname.slice(1).replace(/^en\//, '');
      if (CASTLE_LOCALE_ROUTES.includes(target) || target === 'guide.html') {
        el.setAttribute('href', prefix + lang + '/' + target + url.search + url.hash);
      } else if (url.pathname.startsWith('/en/') && !el.closest('.lang-switch')) {
        el.setAttribute('href', prefix + 'en/' + target + url.search + url.hash);
        el.setAttribute('hreflang', 'en');
        const badge = doc.createElement('small'); badge.className = 'article-language-hint';
        badge.textContent = lang === 'fr' ? ' (anglais)' : '（英文）'; el.appendChild(badge);
      }
    }
    for (const host of doc.querySelectorAll('.lang-switch')) {
      host.replaceChildren();
      for (const [edition, label] of [['ja','日本語'],['en','EN'],['zh-Hant','繁體中文'],['fr','Français']]) {
        const a = doc.createElement('a');
        a.href = prefix + (edition === 'ja' ? '' : edition + '/') + route + (edition === 'ja' ? '?lang=ja' : '');
        a.lang = edition; a.textContent = label;
        if (edition === lang) { a.className = 'active'; a.setAttribute('aria-current','page'); }
        host.appendChild(a);
      }
    }
    for (const el of doc.querySelectorAll('[data-map-src],iframe[src*="google.com/maps"]')) {
      const attr = el.hasAttribute('data-map-src') ? 'data-map-src' : 'src';
      const url = new URL(el.getAttribute(attr)); url.searchParams.set('language', lang === 'zh-Hant' ? 'zh-TW' : 'fr'); el.setAttribute(attr, url.href);
    }
    for (const el of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const rewrite = (value, key = '') => {
        if (Array.isArray(value)) return value.map(item => rewrite(item));
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([k]) => !['datePublished','dateModified'].includes(k)).map(([k,v]) => [k,rewrite(v,k)]));
        if (key === 'inLanguage') return lang;
        if (typeof value !== 'string') return value;
        if (value.startsWith(origin + '/en/')) {
          const rest = value.slice((origin + '/en/').length).split('#')[0];
          if (CASTLE_LOCALE_ROUTES.includes(rest)) return value.replace('/en/', `/${lang}/`);
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
    let html = dom.serialize().replace(/^[ \t]+$/gm, '').replace(/<!-- Generated by [^>]+-->/, '<!-- Generated by scripts/generate-castle-locales.mjs from the English edition; edit scripts/locales. -->');
    html = html.replace(/<head[\s\S]*?<\/head>/, head => withArticleLocales(head, file, assetVersion('article-locales.js')));
    const dest = path.join(root, file);
    if (check) { if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error(`Localized article stale: ${file}`); }
    else { fs.mkdirSync(path.dirname(dest), {recursive:true}); fs.writeFileSync(dest, html); }
    dom.window.close();
  }
}
if (missing.size) throw Error(`Translation missing:\n${[...missing].join('\n')}`);
console.log('Castle/companion localized articles: 32 pages, English source, zh-Hant/fr.');
