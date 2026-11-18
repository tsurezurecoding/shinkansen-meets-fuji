import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {assetVersion} from './shared/asset-version.mjs';
import {enhanceContentHead, imageDimensions, SITE} from './shared/content-metadata.mjs';
import {ANALYTICS} from './shared/feature-page.mjs';
import {editions, languages, withLocaleRegistry} from './shared/locales.mjs';
import {readSiteSource} from './shared/site-chrome.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const readCopy = name => JSON.parse(fs.readFileSync(path.join(root, 'data/rivers', name + '.json'), 'utf8'));
const route = readCopy('route');
const pageName = route.slug + '.html';
const pagePath = (lang, file = pageName) => (lang === 'ja' ? '' : lang + '/') + file;
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
const versioned = (prefix, asset) => prefix + asset + '?v=' + assetVersion(asset);

function heroText(text, lang) {
  if (lang !== 'ja') return escape(text);
  return text.split(/(?<=[、。])/u).filter(Boolean).map(chunk => `<span class="copy-chunk">${escape(chunk)}</span>`).join('');
}

// The rail, navigation and footer match the other train-window features in each edition.
function featureChrome(lang, prefix) {
  const peer = pagePath(lang, 'ferris-wheels.html');
  const dom = new JSDOM(readSiteSource(root, peer), {url: SITE + '/' + peer, runScripts: 'outside-only'});
  const doc = dom.window.document;
  if (!doc.querySelector('.topbar')) {
    for (const script of ['spot-page-shared-data.js', 'spot-page-shared.js']) {
      dom.window.eval(fs.readFileSync(path.join(root, script), 'utf8'));
    }
  }
  const header = doc.querySelector('.topbar');
  const menu = doc.createElement('div');
  menu.className = 'lang-switch';
  menu.innerHTML = languages.map(code => `<a lang="${code}" href="${prefix}${pagePath(code)}?lang=${code}"${code === lang ? ' aria-current="page"' : ''}>${escape(editions[code].label)}</a>`).join('');
  header.querySelector('.lang-switch, .guide-lang-menu').replaceWith(menu);
  const chrome = {
    brand: header.querySelector('.brand-name').textContent,
    header: header.outerHTML,
    rail: doc.querySelector('.spot-page-rail').outerHTML,
    more: doc.querySelector('.content-rail-section').outerHTML,
    footer: doc.querySelector('footer').outerHTML
  };
  dom.window.close();
  return chrome;
}

function detailLink(item, copy, lang, prefix) {
  const target = route.links[item.id];
  if (!target) return '';
  const url = new URL(target, SITE);
  if (url.origin !== SITE) return `<a class="river-link" href="${escape(url.href)}">${escape(copy.link)} <span aria-hidden="true">↗</span></a>`;
  const file = url.pathname.slice(1);
  const edition = fs.existsSync(path.join(root, pagePath(lang, file))) ? lang : 'en';
  if (!fs.existsSync(path.join(root, pagePath(edition, file)))) throw Error('Missing river detail page: ' + file);
  const suffix = edition !== lang ? ' <span lang="en">(English)</span>' : '';
  return `<a class="river-link" hreflang="${edition}" href="${prefix}${pagePath(edition, file)}${escape(url.hash)}">${escape(copy.link)}${suffix} <span aria-hidden="true">→</span></a>`;
}

function riverList(copy, lang, prefix) {
  let number = 0;
  return route.items.map(item => {
    if (item.type === 'note') return `<p class="river-comparison-note">${escape(copy.compare)}</p>`;
    const photo = item.type === 'photo';
    const row = (photo ? copy.photos : copy.stops)[item.id];
    const title = escape(row.name);
    const side = item.side ? ` <span class="river-side">${escape(copy['side' + item.side])}</span>` : '';
    const segment = [item.from, item.to].map(key => escape(copy.stations[key])).join(lang === 'ja' ? '〜' : ' – ');
    const place = `<p class="river-place">${segment}${side}</p>`;
    const link = detailLink(item, row, lang, prefix);
    if (!photo) return `<aside class="river-waypoint" id="${item.id}" aria-labelledby="${item.id}-title">
  ${place}<h2 id="${item.id}-title">${title}</h2><p>${escape(row.body)}</p>${link}
</aside>`;
    number++;
    const sub = row.sub ? `<small>${escape(row.sub)}</small>` : '';
    const {width, height} = imageDimensions(item.image, root);
    const label = escape(copy.enlarge.replace('{name}', row.name));
    return `<section class="river-entry" id="${item.id}" aria-labelledby="${item.id}-title">
  <header class="river-entry-head"><span class="river-number" aria-hidden="true">${String(number).padStart(2,'0')}</span><div>${place}<h2 id="${item.id}-title"><span>${title}</span>${sub}</h2></div></header>
  <div class="river-entry-body"><figure class="river-photo" data-photo-owner="michikusa"><button type="button" data-photo="${title}${row.sub ? ' · ' + escape(row.sub) : ''}" aria-haspopup="dialog" aria-label="${label}"><img src="${prefix}${item.image}" width="${width}" height="${height}"${number > 1 ? ' loading="lazy"' : ''} decoding="async" alt="${escape(row.alt)}"></button><figcaption>${escape(row.caption)}</figcaption></figure>
  <div class="river-entry-copy"><p>${escape(row.body)}</p>${link}</div></div>
</section>`;
  }).join('\n');
}

function render(lang) {
  const copy = readCopy(lang);
  const prefix = lang === 'ja' ? '' : '../';
  const file = pagePath(lang);
  const chrome = featureChrome(lang, prefix);
  const photo = route.items.find(item => item.id === 'fuji');
  const title = copy.kicker + (lang === 'ja' ? '｜' : ' | ') + chrome.brand;
  const description = copy.kicker + (lang === 'ja' ? '。' : '. ') + copy.lead;
  const alternates = [...languages, 'x-default'].map(code => `<link rel="alternate" hreflang="${code}" href="${SITE}/${pagePath(code === 'x-default' ? 'en' : code)}">`).join('\n');
  const styles = ['style.css', 'ferris-wheels.css', 'rivers.css', 'article-locales.css'];
  const sources = Object.entries(route.sources).map(([key, url]) => `<li><a hreflang="ja" href="${escape(url)}">${escape(copy.sources[key])}</a></li>`).join('\n');
  const schema = {'@context':'https://schema.org','@type':'CollectionPage','@id':SITE + '/' + file, url:SITE + '/' + file, name:copy.title, description, inLanguage:lang};
  const markup = `<!doctype html>
<html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title><meta name="description" content="${escape(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${SITE}/${file}">${alternates}
<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${SITE}/${file}">
<meta property="og:type" content="article"><meta property="og:locale" content="${editions[lang].og}"><meta property="og:image" content="${SITE}/${photo.image}"><meta property="og:image:alt" content="${escape(copy.photos.fuji.alt)}"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
<link rel="icon" href="${prefix}favicon.ico"><link rel="preload" as="image" href="${prefix}${photo.image}">
${styles.map(asset => `<link rel="stylesheet" href="${versioned(prefix, asset)}">`).join('\n')}
${lang === 'ja' ? `<script src="${versioned(prefix, 'language-router.js')}"></script>` : ''}
<script defer src="${versioned(prefix, 'article-locales.js')}"></script>
${ANALYTICS.withEmbeddedGuard}
</head><body id="top" class="spot-page spot-page-utility rivers-page" data-article-localized="" data-spot-page-shared-context="utility" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${prefix || './'}" data-spot-page-shared-route="${pageName}">
${chrome.header}
<main><section class="fw-hero river-hero" aria-labelledby="river-title"><div class="fw-hero-inner">
  <p class="eyebrow">${escape(copy.kicker)}</p>
  <h1 id="river-title">${heroText(copy.title, lang)}</h1>
  <p class="fw-hero-lead">${heroText(copy.lead, lang)}</p>
  <p class="fw-hero-credit">${escape(copy.credit)} · ${escape(copy.photos.fuji.name)}</p>
</div></section>
<div class="spot-page-shell">${chrome.rail}<article class="spot-page-article river-list">
  <p class="river-order"><strong>${escape(copy.order)}</strong> <span>${escape(copy.zoomHint)}</span></p>
  ${riverList(copy, lang, prefix)}
  <p class="river-reading-note">${escape(copy.returnTrip)}</p>
  <details class="river-sources"><summary>${escape(copy.sourcesTitle)}</summary><p>${escape(copy.credit)}${copy.sourceLanguage ? '<br>' + escape(copy.sourceLanguage) : ''}</p><ol>${sources}</ol></details>
</article></div>${chrome.more}</main>
${chrome.footer}
<dialog id="river-lightbox" class="river-lightbox" aria-labelledby="river-photo-title" aria-describedby="river-photo-caption"><div class="river-lightbox-top"><p id="river-photo-title"></p><button class="river-lightbox-close" type="button">${escape(copy.close)} ×</button></div><img alt=""><p class="river-lightbox-caption" id="river-photo-caption"></p></dialog>
<script defer src="${versioned(prefix, 'rivers.js')}"></script>
</body></html>
`;
  return enhanceContentHead(withLocaleRegistry(markup, prefix), file, root, {lang});
}

const args = process.argv.slice(2);
const selected = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;
if (args.includes('--lang') && !languages.includes(selected)) throw Error('Unknown river language: ' + selected);
const check = args.includes('--check');
for (const lang of selected ? [selected] : languages) {
  const target = path.join(root, pagePath(lang));
  const html = render(lang);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== html) throw Error('River edition differs: ' + pagePath(lang));
  } else fs.writeFileSync(target, html);
}
console.log('Rivers: ' + (check ? 'checked ' : 'generated ') + (selected || languages.join(', ')));
