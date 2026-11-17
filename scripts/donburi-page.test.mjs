import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {languages, supported} from './shared/locales.mjs';
import {CONTENT_METADATA, metadataProblems} from './shared/content-metadata.mjs';
import {expandDeliveredSiteChromeHTML} from './shared/site-runtime-validation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.michikusa-travel.com/';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const edition = lang => `${lang === 'ja' ? '' : lang + '/'}donburi.html`;
const documentFor = file => new JSDOM(expandDeliveredSiteChromeHTML({appDir: root, html: read(file), relative: file}), {url: site + file});
const photos = JSON.parse(read('data/donburi-photo-sources.json'));
const photoPaths = photos.map(photo => photo.filename).sort();

for (const lang of languages) test(`${edition(lang)}: complete travel article, locale routes and licensed photos`, () => {
  const file = edition(lang), dom = documentFor(file), doc = dom.window.document;
  const copy = JSON.parse(read(`data/donburi/${lang}.json`));
  assert.equal(copy.lang, lang);
  assert.equal(doc.documentElement.lang, lang);
  assert.equal(doc.querySelector('link[rel="canonical"]').href, site + file);
  assert.deepEqual([...doc.querySelectorAll('link[rel="alternate"]')].map(link => [link.hreflang, link.href]).sort(),
    [...languages.map(code => [code, site + edition(code)]), ['x-default', site + edition('en')]].sort());
  const robots = doc.querySelector('meta[name="robots"]').content;
  assert.match(robots, lang === 'ja' ? /(?:^|,)noindex(?:,|$)/ : /(?:^|,)index(?:,|$)/);
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.ok(doc.querySelector('.topbar') && doc.querySelector('footer'), 'Use the current common chrome');
  assert.ok(doc.querySelector('.food-hero') && doc.querySelector('.spot-page-shell .food-article') && doc.querySelector('.food-chapters'), 'Use the Everyday Japan article layout');
  for (const id of ['chains', 'order', 'everyday', 'special']) assert.ok(doc.querySelector('#' + id), id);
  for (const anchor of doc.querySelectorAll('a[href^="#"]')) {
    const id = anchor.getAttribute('href').slice(1);
    if (id) assert.ok(doc.getElementById(id), `${file}: missing local destination ${id}`);
  }
  assert.equal(doc.querySelectorAll('.don-sign-card').length, 3);
  assert.equal(doc.querySelectorAll('.don-order-words dt').length, 3);
  for (const word of ['つゆだく', '肉だく']) assert.ok(doc.querySelector('.don-order-words').textContent.includes(word), word);
  const tuna = doc.querySelector('[aria-labelledby="tuna-title"]').textContent;
  assert.match(tuna, /Tsukiji|築地|筑地|츠키지|쓰키지|สึกิจิ|ซึกิจิ/i, 'Explain the neighbourhood around Seagen');
  assert.match(tuna, /Toyosu|豊洲|豐洲|丰洲|도요스|토요스|โทโยสุ/i, 'Distinguish Tsukiji from Toyosu');
  assert.ok(doc.querySelector('a[href="https://seagen.tokyo/"]'));
  const images = [...doc.querySelectorAll('main img')].filter(img => new URL(img.src).pathname.includes('/images/donburi/'));
  assert.equal(images.length, 11);
  assert.deepEqual(images.map(img => new URL(img.src).pathname.slice(1)).sort(), photoPaths);
  for (const img of images) {
    assert.ok(img.alt.trim(), 'Every article photo needs a localized description');
    assert.ok(fs.existsSync(path.join(root, new URL(img.src).pathname.slice(1))), img.src);
    assert.ok(Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('height')) > 0);
    const button = img.closest('[data-photo]');
    assert.ok(button && button.getAttribute('aria-label')?.trim(), 'Every photo must retain its enlargement action');
    assert.equal(new URL(button.dataset.photo, site + file).href, img.src);
    const caption = img.closest('figure').querySelector('figcaption');
    assert.match(caption.textContent, /michikusa|Ocdp|Asanagi|IXTA9839/);
    if (img.src.includes('storefront-sukiya')) {
      assert.match(caption.textContent, /IXTA9839/);
      assert.ok(caption.querySelector('a[href*="creativecommons.org/licenses/by-sa/4.0"]'), 'Share-alike licence remains available beside the image');
    }
  }
  for (const code of languages) {
    const link = [...doc.querySelectorAll('a[lang]')].find(a => a.lang === code && new URL(a.href).pathname.endsWith('/donburi.html'));
    assert.ok(link, `${file}: language ${code} is missing`);
    assert.equal(new URL(link.href).pathname, '/' + edition(code));
    assert.equal(new URL(link.href).searchParams.get('lang'), code, 'An explicit language selection must survive saved preference routing');
  }
  assert.equal(doc.querySelector('[aria-current="page"][lang]')?.lang, lang);
  assert.equal(doc.querySelector('.don-close').getAttribute('aria-label'), copy.closePhoto);
  assert.ok(copy.marketNote.title.trim() && copy.marketNote.html.trim(), 'Use a reviewed regional introduction');
  for (const source of copy.marketNote.sources) {
    assert.match(source.url, /^https?:\/\//);
    assert.match(source.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(CONTENT_METADATA[file].published, undefined, 'An unpublished article cannot claim a publication date');
  assert.equal(doc.querySelector('meta[property="og:image"]').content, site + 'images/donburi/gyudon-basic.webp');
  if (lang !== 'ja') assert.equal(doc.querySelectorAll('.copy-chunk').length, 0, 'Japanese line-break chunks must not constrain other languages');
  dom.window.close();
});

test('Everyday Japan articles link to donburi in nine languages without duplicate or self-recommendations', () => {
  assert.deepEqual(supported('donburi.html'), languages);
  const routes = ['everyday-japan.html', 'foods.html', 'drinks.html', 'beer-on-shinkansen.html', 'countryside.html', 'spots/gamagori-greenhouses.html', 'omamori.html'];
  for (const lang of languages.filter(code => code !== 'ja')) for (const route of routes) {
    const file = `${lang}/${route}`, dom = documentFor(file), doc = dom.window.document;
    const cards = [...doc.querySelectorAll('a[href]')].filter(a => new URL(a.href).pathname === '/' + edition(lang));
    assert.equal(cards.length, 1, `${file}: provide one localized entry`);
    const copy = JSON.parse(read(`data/donburi/${lang}.json`));
    assert.ok(cards[0].textContent.includes(copy.entry.title), `${file}: translated title`);
    const image = cards[0].querySelector('img');
    assert.ok(image && fs.existsSync(path.join(root, new URL(image.src).pathname.slice(1))), `${file}: card image`);
    if (route === 'everyday-japan.html') assert.ok(cards[0].closest('#taste'), 'Place the article among food stories');
    else assert.ok(cards[0].closest('.everyday-related-grid'), `${file}: use the shared related-story grid`);
    for (const card of doc.querySelectorAll('.everyday-story-card')) {
      assert.notEqual(new URL(card.href).pathname, '/' + file, `${file}: do not recommend the article already being read`);
    }
    dom.window.close();
  }
  for (const file of ['foods.html', 'index.html', 'zukan.html', 'countryside.html', 'omamori.html']) {
    const dom = documentFor(file);
    assert.equal([...dom.window.document.querySelectorAll('a[href]')].filter(a => a.href.split('?')[0] === site + 'donburi.html').length, 0,
      `${file}: Japanese is reached through language switching, not an article card`);
    dom.window.close();
  }
  assert.deepEqual(metadataProblems(), []);
});

test('donburi ends with six localized photo stories, an all-stories link and the required photo credits', () => {
  const relatedRoutes = ['foods.html', 'drinks.html', 'beer-on-shinkansen.html', 'countryside.html', 'spots/gamagori-greenhouses.html', 'omamori.html', 'ramen.html'];
  for (const lang of languages) {
    const file = edition(lang), dom = documentFor(file), doc = dom.window.document;
    const section = doc.querySelector('main > .everyday-related');
    assert.ok(section, `${file}: use the same full-width related section as other Everyday Japan articles`);
    assert.ok(section.querySelector('h2')?.textContent.trim(), `${file}: related heading`);
    const targetLang = lang === 'ja' ? 'en' : lang;
    const allStories = section.querySelector('.everyday-all-stories');
    assert.equal(new URL(allStories.href).pathname, `/${targetLang}/everyday-japan.html`);
    const cards = [...section.querySelectorAll('.everyday-story-card')];
    const destinations = cards.map(card => new URL(card.href).pathname);
    assert.equal(cards.length, relatedRoutes.length, `${file}: all six companion stories`);
    assert.equal(new Set(destinations).size, destinations.length, `${file}: no repeated destination`);
    assert.deepEqual(destinations.sort(), relatedRoutes.map(route => `/${targetLang}/${route}`).sort());
    for (const card of cards) {
      const image = card.querySelector('img');
      assert.ok(image && fs.existsSync(path.join(root, new URL(image.src).pathname.slice(1))), `${file}: related photo exists`);
      assert.ok(card.querySelector('strong')?.textContent.trim(), `${file}: related title`);
      assert.notEqual(new URL(card.href).pathname, '/' + file, `${file}: no self-recommendation`);
      if (lang === 'ja') assert.equal(card.closest('[lang]')?.lang, 'en', 'English destinations are marked for Japanese readers');
    }
    assert.match(section.textContent, /Ocdp/);
    assert.ok(section.querySelector('a[href*="creativecommons.org/publicdomain/zero/1.0"]'));
    assert.match(section.textContent, /Leongboy1/);
    assert.ok(section.querySelector('a[href="https://commons.wikimedia.org/wiki/File:Variousomamori.jpg"]'));
    dom.window.close();
  }
});

test('Web distribution contains ten editions and all photos, while search discovery excludes Japanese', () => {
  const manifest = read('content-manifest.json');
  for (const asset of [...languages.map(edition), 'donburi.css', 'donburi.js', 'data/donburi-photo-sources.json', ...photoPaths])
    assert.ok(manifest.includes('"' + asset + '"'), asset);
  const sitemap = new JSDOM(read('sitemap.xml'), {contentType: 'text/xml'}).window.document;
  const locations = [...sitemap.querySelectorAll('loc')].map(loc => loc.textContent);
  for (const lang of languages.filter(code => code !== 'ja')) assert.ok(locations.includes(site + edition(lang)), lang);
  assert.ok(!locations.includes(site + 'donburi.html'));
  assert.equal(photos.length, 11);
  for (const photo of photos) {
    assert.ok(photo.candidateId && photo.permission.includes('approved'), photo.filename);
    if (photo.credit !== 'michikusa') assert.match(photo.licenseUrl, /^https?:\/\/creativecommons\.org\//);
  }
});
