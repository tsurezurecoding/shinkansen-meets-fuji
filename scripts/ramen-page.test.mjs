import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {languages, supported} from './shared/locales.mjs';
import {expandDeliveredSiteChromeHTML} from './shared/site-runtime-validation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.michikusa-travel.com/';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const edition = lang => `${lang === 'ja' ? '' : lang + '/'}ramen.html`;
const copyFor = lang => JSON.parse(read(`data/ramen/${lang}.json`));
const documentFor = file => new JSDOM(expandDeliveredSiteChromeHTML({appDir: root, html: read(file), relative: file}), {url: site + file});
const pathname = link => new URL(link.href).pathname;
const photos = JSON.parse(read('data/ramen-photo-sources.json'));
const photoPaths = photos.map(photo => photo.filename).sort();
const chapterIds = ['styles', 'noodles', 'jiro', 'inspired', 'order'];
const tocIds = ['styles', 'noodles', 'jiro', 'order'];
const companionRoutes = ['foods.html', 'drinks.html', 'beer-on-shinkansen.html', 'countryside.html', 'spots/gamagori-greenhouses.html', 'omamori.html', 'donburi.html'];
const entryRoutes = ['everyday-japan.html', ...companionRoutes];
const saburo = /さぶ(?:郎|ろう)|サブ(?:郎|ロウ)|sabur[oō]/iu;
const price = /(?:[¥￥$€£₩฿]\s*\p{N})|(?:\p{N}[\p{N}.,\s]*\s*(?:円|圓|日元|日圓|엔|เยน))|(?:\p{N}[\p{N}.,\s]*\s*(?:yen|jpy|euros?|dollars?|usd|eur|krw|thb)\b)/iu;

test('ramen has exactly the ten reviewed language editions and eleven owner-approved photos', () => {
  assert.deepEqual([...languages].sort(), ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko', 'it', 'th'].sort());
  assert.deepEqual(supported('ramen.html'), languages);
  assert.equal(photos.length, 11);
  assert.equal(new Set(photos.map(photo => photo.id)).size, 11);
  assert.equal(new Set(photoPaths).size, 11);
  for (const photo of photos) {
    assert.equal(photo.credit, 'michikusa', photo.filename);
    assert.match(photo.permission, /approved/i, photo.filename);
    assert.ok(photo.source?.trim(), `${photo.filename}: retain its source record`);
    assert.ok(fs.existsSync(path.join(root, photo.filename)), photo.filename);
  }
  assert.doesNotMatch(JSON.stringify(photos), saburo, 'The unconfirmed Saburo restaurant remains excluded');
});

for (const lang of languages) test(`${edition(lang)}: localized travel article, ordering, photos and related stories`, () => {
  const file = edition(lang), dom = documentFor(file), doc = dom.window.document, copy = copyFor(lang);
  try {
    assert.equal(copy.lang, lang);
    assert.equal(doc.documentElement.lang, lang);
    assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1);
    assert.equal(doc.querySelector('link[rel="canonical"]').href, site + file);
    assert.deepEqual([...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => [link.hreflang, link.href]).sort(),
      [...languages.map(code => [code, site + edition(code)]), ['x-default', site + edition('en')]].sort());
    const robots = doc.querySelector('meta[name="robots"]').content.split(',').map(value => value.trim());
    assert.ok(robots.includes(lang === 'ja' ? 'noindex' : 'index'));
    assert.ok(!robots.includes(lang === 'ja' ? 'index' : 'noindex'));
    assert.equal(doc.title, copy.metaTitle);
    assert.equal(doc.querySelector('meta[name="description"]').content, copy.description);
    assert.equal(doc.querySelector('meta[property="og:image"]').content, site + 'images/ramen/jiro.webp');

    const menu = doc.querySelector('.topbar .lang-switch');
    assert.ok(menu, 'Use the current common language menu');
    const selections = [...menu.querySelectorAll('a[lang]')];
    assert.equal(selections.length, languages.length);
    for (const code of languages) {
      const links = selections.filter(link => link.lang === code);
      assert.equal(links.length, 1, `${file}: offer language ${code} once`);
      assert.equal(pathname(links[0]), '/' + edition(code));
      assert.equal(new URL(links[0].href).searchParams.get('lang'), code, 'Explicit language selection overrides a saved preference');
    }
    assert.deepEqual([...menu.querySelectorAll('[aria-current="page"]')].map(link => link.lang), [lang]);

    assert.ok(doc.querySelector('.topbar') && doc.querySelector('footer'), 'Use the current common chrome');
    const hero = doc.querySelector('main > .food-hero');
    const article = doc.querySelector('.spot-page-shell > #ramen-content.food-article');
    assert.ok(hero && article && article.querySelector('.food-chapters'), 'Use the Everyday Japan article layout');
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.ok(hero.querySelector('h1').textContent.trim());
    assert.equal(doc.querySelector('.skip-link').getAttribute('href'), '#ramen-content');
    assert.equal(doc.querySelector('.skip-link').textContent, copy.skipLink);
    assert.deepEqual([...article.querySelectorAll(':scope > section[id]')].map(section => section.id), chapterIds);
    assert.deepEqual([...article.querySelectorAll('.food-chapters a')].map(link => link.getAttribute('href')), tocIds.map(id => '#' + id));
    for (const link of doc.querySelectorAll('a[href^="#"]')) {
      const id = link.getAttribute('href').slice(1);
      if (id) assert.ok(doc.getElementById(id), `${file}: missing local destination ${id}`);
    }
    assert.equal(article.querySelectorAll('#jiro dl dt').length, 4, 'Retain the four useful Jiro ordering terms');
    assert.equal(article.querySelectorAll('#jiro dl dd').length, 4);
    const editorialText = `${hero.textContent} ${article.textContent}`.normalize('NFKC');
    assert.doesNotMatch(editorialText, price, 'Avoid dated menu prices in the travel article');
    assert.doesNotMatch(editorialText, saburo, 'The unconfirmed Saburo restaurant remains excluded');
    if (lang !== 'ja') assert.equal(doc.querySelectorAll('.copy-chunk').length, 0, 'Japanese line-break chunks must not constrain another language');

    const images = [...hero.querySelectorAll('img'), ...article.querySelectorAll('img')];
    assert.equal(images.length, 11, 'Keep all eleven selected ramen photographs');
    assert.deepEqual(images.map(img => new URL(img.src).pathname.slice(1)).sort(), photoPaths);
    const buttons = [...hero.querySelectorAll('[data-photo-id]'), ...article.querySelectorAll('[data-photo-id]')];
    assert.deepEqual(buttons.map(button => button.dataset.photoId).sort(), photos.map(photo => photo.id).sort());
    for (const img of images) {
      const asset = new URL(img.src).pathname.slice(1), photo = photos.find(record => record.filename === asset);
      assert.ok(img.alt.trim(), `${file}: every photograph needs a description`);
      assert.ok(fs.existsSync(path.join(root, asset)), asset);
      assert.equal(Number(img.getAttribute('width')), photo.width);
      assert.equal(Number(img.getAttribute('height')), photo.height);
      const button = img.closest('button[data-photo][data-photo-id]');
      assert.ok(button?.getAttribute('aria-label')?.trim(), 'Every photograph retains its enlargement action');
      assert.equal(button.dataset.photoId, photo.id);
      assert.equal(new URL(button.dataset.photo, site + file).href, img.src);
      const caption = img.closest('figure')?.querySelector('figcaption');
      assert.ok(caption?.textContent.trim(), 'Every photograph retains its caption');
      assert.match(caption.querySelector('.don-credit')?.textContent || '', /michikusa/i, 'Credit the owner beside each photograph');
    }
    assert.equal(hero.querySelector('[data-photo-id]')?.dataset.photoId, 'jiro', 'Lead with the approved Jiro photograph');
    assert.equal(article.querySelector('#jiro [data-photo-id]')?.dataset.photoId, 'jiro-detail', 'Introduce the Jiro section with its detail photograph');
    const dialog = doc.querySelector('dialog.don-lightbox');
    assert.ok(dialog?.querySelector('img') && doc.getElementById(dialog.getAttribute('aria-labelledby')));
    assert.equal(dialog.querySelector('.don-close').getAttribute('aria-label'), copy.closePhoto);

    const related = doc.querySelector('main > .everyday-related');
    assert.ok(related?.querySelector('h2')?.textContent.trim(), 'End with the common full-width related-story section');
    const targetLang = lang === 'ja' ? 'en' : lang;
    assert.equal(pathname(related.querySelector('.everyday-all-stories')), `/${targetLang}/everyday-japan.html`);
    const cards = [...related.querySelectorAll('.everyday-story-card')];
    const destinations = cards.map(pathname);
    assert.equal(cards.length, companionRoutes.length, 'Offer all seven companion articles');
    assert.equal(new Set(destinations).size, companionRoutes.length, 'Do not repeat a recommendation');
    assert.deepEqual([...destinations].sort(), companionRoutes.map(route => `/${targetLang}/${route}`).sort());
    for (const card of cards) {
      assert.notEqual(pathname(card), '/' + file, 'Do not recommend the page being read');
      assert.ok(card.querySelector('strong')?.textContent.trim(), 'Use a readable related-story title');
      const image = card.querySelector('img');
      assert.ok(image && fs.existsSync(path.join(root, new URL(image.src).pathname.slice(1))), 'Related-story photo exists');
      assert.equal(card.closest('[lang]')?.lang, targetLang, 'Mark the language of the destination');
    }
    assert.match(related.textContent, /Ocdp/);
    assert.ok(related.querySelector('a[href*="creativecommons.org/publicdomain/zero/1.0"]'), 'Retain the onigiri photograph licence');
    assert.match(related.textContent, /Leongboy1/);
    assert.ok(related.querySelector('a[href="https://commons.wikimedia.org/wiki/File:Variousomamori.jpg"]'), 'Retain the omamori photograph source');
  } finally {
    dom.window.close();
  }
});

test('nine languages each offer one ramen entry from the hub and all seven companion articles', () => {
  for (const lang of languages.filter(code => code !== 'ja')) {
    const copy = copyFor(lang);
    for (const route of entryRoutes) {
      const file = `${lang}/${route}`, dom = documentFor(file), doc = dom.window.document;
      try {
        const cards = [...doc.querySelectorAll('a[href]')].filter(link => pathname(link) === '/' + edition(lang));
        assert.equal(cards.length, 1, `${file}: provide exactly one localized ramen entry`);
        const card = cards[0];
        assert.equal(card.querySelector('strong')?.textContent, copy.entry.title, `${file}: reviewed translated title`);
        assert.ok(card.textContent.includes(copy.entry.note), `${file}: reviewed translated introduction`);
        const image = card.querySelector('img');
        assert.equal(image && new URL(image.src).pathname, '/images/ramen/jiro.webp', `${file}: use the Jiro cover photograph`);
        if (route === 'everyday-japan.html') assert.ok(card.closest('#taste'), `${file}: place ramen among the food stories`);
        else assert.ok(card.closest('.everyday-related-grid'), `${file}: use the common related-story grid`);
        const related = [...doc.querySelectorAll('.everyday-story-card')].map(pathname);
        assert.equal(new Set(related).size, related.length, `${file}: no duplicate related destination`);
        assert.ok(!related.includes('/' + file), `${file}: no self-recommendation`);
        assert.ok(!related.includes('/ramen.html'), `${file}: Japanese is available through language switching`);
      } finally {
        dom.window.close();
      }
    }
  }
});

test('Japanese ramen is not promoted by Japanese discovery pages or article cards', () => {
  const routes = ['index.html', 'zukan.html', 'castles.html', 'foods.html', 'countryside.html', 'spots/gamagori-greenhouses.html', 'omamori.html', 'donburi.html'];
  for (const file of routes) {
    const dom = documentFor(file);
    try {
      const entries = [...dom.window.document.querySelectorAll('a[href]')].filter(link => pathname(link) === '/ramen.html');
      for (const link of entries) assert.ok(link.closest('.lang-switch,.article-lang-menu,.guide-lang-menu'), `${file}: Japanese ramen is reached only by language selection`);
    } finally {
      dom.window.close();
    }
  }
});

test('Web distribution includes all ten editions and photos; search discovery lists only the nine visitor languages', () => {
  const manifest = JSON.parse(read('content-manifest.json'));
  const required = [...languages.map(edition), 'ramen.css', 'donburi.js', 'article-locales.js', 'locales.js', 'data/ramen-photo-sources.json', ...photoPaths];
  for (const asset of required) {
    const entries = manifest.files.filter(entry => entry.path === asset);
    assert.equal(entries.length, 1, `${asset}: distribute exactly once`);
    assert.equal(entries[0].url, site + asset);
    assert.ok(entries[0].bytes > 0 && fs.existsSync(path.join(root, asset)), asset);
  }
  const sitemap = new JSDOM(read('sitemap.xml'), {contentType: 'text/xml'});
  try {
    const locations = [...sitemap.window.document.querySelectorAll('loc')].map(loc => loc.textContent);
    const ramenLocations = locations.filter(location => new URL(location).pathname.endsWith('/ramen.html'));
    assert.deepEqual(ramenLocations.sort(), languages.filter(lang => lang !== 'ja').map(lang => site + edition(lang)).sort());
    assert.ok(!locations.includes(site + edition('ja')), 'Keep the Japanese language-switch edition out of the sitemap');
  } finally {
    sitemap.window.close();
  }
});
