import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { assetVersion } from './shared/asset-version.mjs';
import { enhanceContentHead } from './shared/content-metadata.mjs';
import { ANALYTICS } from './shared/feature-page.mjs';
import { editions, languages, supported, withLocaleRegistry } from './shared/locales.mjs';
import { readSiteSource } from './shared/site-chrome.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.michikusa-travel.com';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const catalog = JSON.parse(read('scripts/factory-windows.json'));
const fileFor = lang => (lang === 'ja' ? '' : lang + '/') + 'factories.html';
const cover = catalog.places.find(place => place.id === 'kirin');
const check = process.argv.includes('--check');
const langIndex = process.argv.indexOf('--lang');
const selected = langIndex === -1 ? languages : [process.argv[langIndex + 1]];
if (selected.some(lang => !languages.includes(lang))) throw Error('Unknown feature language');
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const href = (url, text, attrs='') => '<a href="' + e(url) + '"' + attrs + '>' + text + '</a>';
const chunks = words => words.map(word => '<span class="copy-chunk">' + e(word) + '</span>').join('');
const book = 'https://str.toyokeizai.net/books/9784492046043/';

function siteShell(lang, prefix) {
  const file = lang === 'ja' ? 'castles.html' : lang + '/foods.html';
  const dom = new JSDOM(readSiteSource(root, file), { url: site + '/' + file, runScripts: 'outside-only' });
  const doc = dom.window.document;
  if (!doc.querySelector('.topbar')) {
    for (const script of ['spot-page-shared-data.js', 'spot-page-shared.js']) dom.window.eval(read(script));
  }
  const header = doc.querySelector('.topbar');
  const menu = doc.createElement('div');
  menu.className = 'lang-switch';
  // Links also work without the shared language-menu enhancement.
  menu.innerHTML = languages.map(code => '<a lang="' + code + '" href="' + prefix + fileFor(code) + '?lang=' + code + '"' +
    (lang === code ? ' aria-current="page"' : '') + '>' + e(editions[code].label) + '</a>').join('');
  const old = header.querySelector('.article-lang-menu,.guide-lang-menu,.lang-switch');
  if (old) old.replaceWith(menu); else header.append(menu);
  const shell = {header: header.outerHTML, footer: doc.querySelector('footer').outerHTML,
    brand: header.querySelector('.brand-name').textContent, guide: header.querySelector('[data-cta-id="nav_features"]').textContent};
  dom.window.close();
  return shell;
}

function page(lang) {
  const copy = JSON.parse(read('scripts/locales/factory-windows/' + lang + '.json'));
  const {ui} = copy;
  const prefix = lang === 'ja' ? '' : '../';
  const file = fileFor(lang);
  const shell = siteShell(lang, prefix);
  const count = n => e(ui.count.replace('{n}', n));
  const full = p => prefix + p.src;
  function photo(p, alt, hero = false) {
    return '<img src="' + full(p) + '" srcset="' + prefix + p.thumb + ' 640w, ' + full(p) + ' ' + p.width +
      'w" sizes="' + (hero ? '(max-width: 720px) 100vw, 680px' : '(max-width: 720px) 100vw, (max-width: 1050px) 50vw, 560px') +
      '" width="' + p.width + '" height="' + p.height + '" alt="' + e(alt) + '" ' +
      (hero ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"') + '>';
  }
  function photoLink(p, alt, title) {
    return href(full(p), photo(p, alt), ' target="_blank" rel="noopener" aria-label="' + e(ui.openPhoto.replace('{name}', title)) + '"');
  }
  function links(place, text) {
    if (text.sources.length !== place.sources.length) throw Error('Sources missing: ' + lang + '/' + place.id);
    let related = '';
    if (place.related) {
      const code = supported(place.related).includes(lang) ? lang : 'en';
      const route = (code === 'ja' ? '' : code + '/') + place.related;
      if (!fs.existsSync(path.join(root,route))) throw Error('Missing related feature: ' + route);
      related = href(prefix + route, e(text.related) + (code === lang ? '' : ' <small lang="' + code + '">(' + e(editions[code].label) + ')</small>') + ' →', ' hreflang="' + code + '"');
    }
    const observation = place.observation ? href(place.observation, e(ui.observation) + ' ↗') : '';
    const map = href(place.map, e(ui.map) + ' ↗', ' class="ff-map" aria-label="' + e(text.name + ' · ' + ui.map) + '"');
    const sources = place.sources.map((url, i) => '<li>' + href(url,e(text.sources[i])) + '</li>').join('');
    return '<div class="ff-links">' + related + observation + map + '<details class="ff-sources"><summary>' + e(ui.sources) +
      '</summary><ul>' + sources + '</ul>' + (text.note ? '<p>' + e(text.note) + '</p>' : '') + '</details></div>';
  }
  function card(place) {
    const t = copy.places[place.id];
    const side = place.side;
    const title = lang === 'ja' ? chunks(t.name.split(' ')) : e(t.name);
    const seat = '<span class="ff-seat ff-seat-' + side + '"><strong>' + e(ui['side' + side]) + '</strong><span data-relative>' +
      e(side === 'A' ? ui.left : ui.right) + '</span></span>';
    const comparison = place.comparison ? '<details class="ff-extra-photo"><summary>' + e(ui.comparisonTitle) +
      '</summary><figure data-photo-owner="michikusa">' + photoLink(place.comparison, ui.comparisonAlt, ui.comparisonTitle) + '<figcaption>' + e(ui.comparisonCaption) +
      '</figcaption></figure></details>' : '';
    return '<article class="ff-card" id="' + place.id + '" data-side="' + side + '" aria-labelledby="' + place.id + '-title"><figure class="ff-photo" data-photo-owner="michikusa">' +
      photoLink(place.photo, t.alt, t.name) + (place.credit ? '<figcaption class="ff-photo-credit">' + e(place.credit) + '</figcaption>' : '') +
      '</figure><div class="ff-card-body"><h3 id="' + place.id + '-title">' + seat + ' ' + title + '</h3><p class="ff-hook">' + e(t.hook) +
      '</p><p class="ff-point">' + e(t.point) + '</p>' + (t.location ? '<p class="ff-location">' + e(t.location) + '</p>' : '') +
      links(place, t) + comparison + '</div></article>';
  }
  function candidate(place) {
    const t = copy.candidates[place.id];
    return '<article id="' + place.id + '" class="ff-find" data-find-side="' + place.side + '"><p class="ff-candidate-route">' +
      e(t.interval) + ' · ' + e(ui.grounds.replace('{side}', ui['side' + place.side])) + '</p><h3>' + e(t.name) +
      '</h3><p class="ff-find-location">' + e(t.location) + '</p><p>' + e(t.point) + '</p>' + links(place, t) + '</article>';
  }
  const groupItems = id => catalog.places.filter(place => place.group === id);
  const sections = catalog.groups.map(id => {
    const [east, west, title] = copy.groups[id];
    const items = groupItems(id);
    const more = catalog.candidates.filter(place => place.group === id);
    const nearby = more.length ? '<aside class="ff-nearby" aria-label="' + e(ui.nearby) + '"><div class="ff-nearby-heading">' + e(ui.nearby) + '</div>' + more.map(candidate).join('') + '</aside>' : '';
    return '<section class="ff-group" id="' + id + '" data-east="' + e(east) + '" data-west="' + e(west) + '" aria-labelledby="' +
      id + '-title"><header class="ff-group-heading"><div><p class="ff-group-interval" data-interval>' + e(east + ' → ' + west) +
      '</p><h2 id="' + id + '-title">' + e(title) + '</h2></div><span class="ff-group-count" data-group-count>' + count(items.length) +
      '</span></header><div class="ff-grid" data-count="' + items.length + '">' + items.map(card).join('\n') + '</div>' + nearby + '</section>';
  }).join('\n');
  const remaining = catalog.candidates.filter(place => !place.group);
  const routeNav = catalog.groups.map(id => href('#' + id, e(copy.groups[id][2]) + '<span>' + groupItems(id).length + '</span>', ' data-route-group="' + id + '"')).join('');
  const buttons = (type, pairs) => pairs.map(([id, label], i) => '<button type="button" data-' + type + '="' + id +
    '" aria-pressed="' + (i === 0) + '">' + e(label) + '</button>').join('');
  const controls = '<div class="ff-controls" hidden><fieldset><legend>' + e(ui.direction) + '</legend><div class="ff-segment">' +
    buttons('direction', [['down',ui.down],['up',ui.up]]) + '</div></fieldset><fieldset><legend>' + e(ui.seat) + '</legend><div class="ff-segment">' +
    buttons('side-filter', [['all',ui.both],['A',ui.sideA],['E',ui.sideE]]) + '</div></fieldset><p class="ff-status" id="guide-status" aria-live="polite"></p></div>';
  const heroTitle = lang === 'ja' ? chunks(['窓から見える', '工場']) : lang === 'th' ? e(ui.title).replace('ชินคันเซ็น', '<wbr><span class="ff-word">ชินคันเซ็น</span>') : e(ui.title);
  const deck = lang === 'ja' ? chunks(['コーヒー、お菓子、化粧品。','いつもの「あれ」をつくる場所が、','線路のそばに並んでいる。']) : e(ui.deck);
  const photoName = copy.places[cover.id].name;
  const hero = '<header class="ff-cover"><div class="ff-cover-copy"><p class="ff-kicker">' + e(ui.route) + '</p><h1>' + heroTitle +
    '</h1><p class="ff-deck">' + deck + '</p>' + href('#catalog', e(ui.browse) + ' <span>' + count(catalog.places.length) + '</span><b aria-hidden="true">↓</b>', ' class="ff-cover-link"') +
    '</div><figure class="ff-cover-photo" data-photo-owner="michikusa">' + photo(cover.photo,copy.places[cover.id].alt,true) + '<figcaption>' + e(photoName) + '</figcaption></figure></header>';
  const data = Object.entries({left:ui.left,right:ui.right,count:ui.count}).map(([key,value]) => 'data-' + key + '="' + e(value) + '"').join(' ');
  const section = '<section id="catalog" aria-label="' + e(ui.browse) + '" ' + data + '><nav class="ff-route" aria-label="' + e(ui.route) + '">' + routeNav +
    '</nav>' + controls + '<div id="factory-list">' + sections + '</div></section>';
  const notes = '<div class="ff-reading-note"><details class="ff-seat-note"><summary>' + e(ui.seatsTitle) + '</summary><p>' + e(ui.seatsText) +
    '</p></details><details class="ff-seat-note"><summary>' + e(ui.notesTitle) + '</summary><p>' + e(ui.notesText) + '</p><p>' + e(ui.photoCredit) +
    '</p><p>' + href(book,e(ui.book),' hreflang="ja"') + '</p></details></div>';
  const ending = '<section class="ff-candidates" aria-labelledby="candidates-title"><div class="ff-candidates-heading"><h2 id="candidates-title">' + e(ui.candidates) +
    '</h2><p>' + e(ui.candidateIntro) + '</p></div><div class="ff-candidate-grid">' + remaining.map(candidate).join('') + '</div></section>' + notes +
    '<nav class="ff-bottom" aria-label="' + e(shell.guide) + '">' + href('zukan.html', '← ' + e(shell.guide)) + href('start.html', e(ui.cta) + ' →', ' class="btn btn-primary"') + '</nav>';

  const version = asset => prefix + asset + '?v=' + assetVersion(asset);
  const title = ui.title + ' | ' + shell.brand;
  const alternates = [...languages.map(code => [code,fileFor(code)]), ['x-default',fileFor('en')]].map(([code,target]) =>
    '<link rel="alternate" hreflang="' + code + '" href="' + site + '/' + target + '">').join('\n');
  const head = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + e(title) + '</title>' +
    '<meta name="description" content="' + e(ui.description) + '"><link rel="canonical" href="' + site + '/' + file + '">' + alternates +
    '<meta property="og:type" content="article"><meta property="og:title" content="' + e(title) + '"><meta property="og:description" content="' + e(ui.description) +
    '"><meta property="og:locale" content="' + editions[lang].og + '"><meta property="og:url" content="' + site + '/' + file + '"><meta property="og:image" content="' +
    site + '/' + cover.photo.src + '"><meta property="og:image:alt" content="' + e(copy.places[cover.id].alt) + '"><meta name="twitter:card" content="summary_large_image">' +
    '<link rel="icon" href="' + prefix + 'favicon.ico">' + ['style.css','article-locales.css','factories.css'].map(asset => '<link rel="stylesheet" href="' + version(asset) + '">').join('') +
    (lang === 'ja' ? '<script src="' + version('language-router.js') + '"></script>' : '') + ANALYTICS.withEmbeddedGuard;
  const html = '<!doctype html>\n<html lang="' + lang + '"><head>' + head + '</head><body id="top" class="ff-page" data-article-localized>' +
    href('#article',e(ui.browse),' class="ff-skip"') + shell.header + '<main id="article" class="ff-main">' + hero + section + ending + '</main>' + shell.footer +
    '<script defer src="' + version('article-locales.js') + '"></script><script defer src="' + version('factories.js') + '"></script></body></html>\n';
  return enhanceContentHead(withLocaleRegistry(html,prefix),file,root,{lang});
}
for (const lang of selected) {
  const name = fileFor(lang);
  const html = page(lang);
  if (check) {
    if (read(name) !== html) throw Error('Factory feature is stale: ' + name);
  } else fs.writeFileSync(path.join(root, name), html);
}
console.log('Factory guide ' + (check ? 'checked' : 'built') + ' · ' + selected.join(', '));
