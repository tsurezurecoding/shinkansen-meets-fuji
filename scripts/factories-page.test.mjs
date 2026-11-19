import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {languages, supported} from './shared/locales.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.michikusa-travel.com/';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const edition = (lang, route = 'factories.html') => `${lang === 'ja' ? '' : lang + '/'}${route}`;
const catalog = JSON.parse(read('scripts/factory-windows.json'));
const photos = catalog.places.flatMap(place => [place.photo, ...(place.comparison ? [place.comparison] : [])]);
const photoPaths = photos.flatMap(photo => [photo.src, photo.thumb]);
const riverRoute = JSON.parse(read('data/rivers/route.json'));
const pathname = node => new URL(node.href || node.src).pathname.slice(1);

function webpChunks(bytes, label) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', label);
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', label);
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, `${label}: complete RIFF container`);
  const chunks = [];
  let offset = 12;
  while (offset < bytes.length) {
    assert.ok(offset + 8 <= bytes.length, `${label}: complete chunk header`);
    chunks.push(bytes.toString('ascii', offset, offset + 4));
    const length = bytes.readUInt32LE(offset + 4);
    offset += 8 + length + (length & 1);
    assert.ok(offset <= bytes.length, `${label}: complete chunk payload`);
  }
  return chunks;
}

test('factories retain 29 photographed places, one comparison and ten language editions', () => {
  assert.deepEqual([...languages].sort(), ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko', 'it', 'th'].sort());
  assert.deepEqual(supported('factories.html'), languages);
  assert.equal(catalog.places.length, 29);
  assert.equal(new Set(catalog.places.map(place => place.id)).size, 29);
  assert.equal(photos.length, 30);
  assert.equal(new Set(photos.map(photo => photo.src)).size, 30);
  assert.equal(new Set(photoPaths).size, 60, 'Every large photo has a distinct 640px alternative');
  assert.equal(catalog.photoCredit, 'michikusa');
  for (const photo of photos) {
    assert.match(photo.src, /^images\/factories\/[a-z0-9-]+\.webp$/);
    assert.match(photo.thumb, /^images\/factories\/[a-z0-9-]+-640\.webp$/);
    assert.ok(photo.width > 640 && photo.height > 0, photo.src);
  }
});

test('all factory photo assets and ten pages are distributed with current bytes and hashes', () => {
  const manifest = JSON.parse(read('content-manifest.json'));
  for (const file of [...photoPaths, ...languages.map(lang => edition(lang)), 'factories.css', 'factories.js']) {
    const entries = manifest.files.filter(entry => entry.path === file);
    assert.equal(entries.length, 1, `${file}: register this referenced asset once`);
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(entries[0].bytes, bytes.length, `${file}: distribution byte count`);
    assert.equal(entries[0].sha256, createHash('sha256').update(bytes).digest('hex'), `${file}: distribution hash`);
    assert.equal(entries[0].url, site + file, `${file}: production asset URL`);
  }
});

test('the two feature galleries use every photo in their respective directories', () => {
  for (const [folder, sources] of [
    ['rivers', riverRoute.items.filter(item => item.type === 'photo').map(item => item.image)],
    ['factories', photoPaths],
  ]) {
    const onDisk = fs.readdirSync(path.join(root, 'images', folder)).filter(name => /\.(jpg|webp)$/.test(name));
    assert.deepEqual(onDisk.sort(), sources.map(source => path.basename(source)).sort());
  }
});

test('factory WebP assets contain neither EXIF nor XMP metadata', () => {
  for (const file of photoPaths) {
    const chunks = webpChunks(fs.readFileSync(path.join(root, file)), file);
    assert.ok(chunks.some(chunk => chunk === 'VP8 ' || chunk === 'VP8L'), `${file}: encoded image exists`);
    assert.ok(!chunks.includes('EXIF') && !chunks.includes('XMP '), `${file}: do not distribute camera location or capture metadata`);
  }
});

function assertPhoto(img, photo, label) {
  assert.ok(img, `${label}: photo exists`);
  assert.equal(pathname(img), photo.src, `${label}: display uses the metadata-free large photo`);
  assert.ok(img.alt.trim(), `${label}: localized photo description`);
  assert.equal(Number(img.getAttribute('width')), photo.width, label);
  assert.equal(Number(img.getAttribute('height')), photo.height, label);
  const candidates = img.srcset.split(',').map(candidate => {
    const [src, width] = candidate.trim().split(/\s+/);
    return [new URL(src, img.ownerDocument.baseURI).pathname.slice(1), width];
  });
  assert.deepEqual(candidates, [[photo.thumb, '640w'], [photo.src, `${photo.width}w`]], label);
  assert.equal(pathname(img.closest('a[href]')), photo.src, `${label}: enlargement also uses the safe photo`);
  assert.equal(img.closest('figure')?.dataset.photoOwner, 'michikusa', `${label}: owner attribution`);
}

// Exercise the actual utility link pass without booting unrelated maps or GPS.
const app = read('app.js');
const applyLangTo = app.slice(app.indexOf('function applyLangTo('), app.indexOf('\nfunction applyLang()'));

for (const lang of languages) test(`${edition(lang)}: photographed cards and same-language catalogue entry`, () => {
  const file = edition(lang);
  const dom = new JSDOM(read(file), {url: site + file});
  const riverFile = edition(lang, 'rivers.html');
  const riverDOM = new JSDOM(read(riverFile), {url: site + riverFile});
  const entryFile = edition(lang, 'zukan.html');
  const entryDOM = new JSDOM(read(entryFile), {url: site + entryFile});
  try {
    const doc = dom.window.document;
    assert.equal(doc.documentElement.lang, lang);
    for (const [river, factory] of [['sakawa', 'meiji-pharmatech'], ['echigawa', 'joyson-echigawa'], ['yasu', 'qualitech-shiga']]) {
      const crossing = riverDOM.window.document.getElementById(river);
      const plant = doc.getElementById(factory);
      assert.equal(crossing.querySelector('.river-link').href, site + file + '#' + factory);
      assert.equal(plant.dataset.side, riverRoute.items.find(item => item.id === river).side);
    }
    assert.deepEqual([...doc.querySelectorAll('#factory-list .ff-card')].map(card => card.id).sort(), catalog.places.map(place => place.id).sort());
    for (const place of catalog.places) {
      const card = doc.getElementById(place.id);
      assertPhoto(card.querySelector('.ff-photo img'), place.photo, `${file}/${place.id}`);
      if (place.credit) assert.ok(card.querySelector('.ff-photo').textContent.includes(place.credit), `${file}: preserve decoration credit`);
      if (place.comparison) assertPhoto(card.querySelector('.ff-extra-photo img'), place.comparison, `${file}/${place.id} comparison`);
    }
    const copy = JSON.parse(read(`scripts/locales/factory-windows/${lang}.json`));
    assert.ok(doc.body.textContent.includes(copy.ui.photoCredit) && copy.ui.photoCredit.includes('michikusa'), `${file}: photographer credit`);

    const entryDoc = entryDOM.window.document;
    const links = entryDoc.querySelectorAll('a[data-cta-id="factories"]');
    assert.equal(links.length, 1, `${entryFile}: one factory feature entry`);
    const link = links[0];
    assert.equal(link.hreflang, lang, `${entryFile}: explicit language prevents utility fallback`);
    assert.equal(pathname(link), file, `${entryFile}: destination language`);
    assert.ok(link.textContent.includes(copy.ui.title), `${entryFile}: localized title`);
    assert.equal(pathname(link.querySelector('img')), 'images/factories/kirin-640.webp');

    const scope = entryDoc.createElement('div');
    scope.append(link.cloneNode(true));
    const probe = entryDoc.createElement('a');
    probe.href = 'factories.html';
    scope.append(probe);
    const before = scope.firstElementChild.href;
    assert.ok(applyLangTo.startsWith('function applyLangTo('), 'Locate the production language pass');
    vm.runInNewContext(`${applyLangTo}\napplyLangTo(scope);`, {
      document: entryDoc, window: entryDOM.window, URL, scope, lang,
      MSG: {en: {}}, COLLECTION_TOGGLES: [], utilityLocale: {lang},
      utilityHref: () => 'en/factories.html', annotateStarterFallbackLinks() {},
    });
    assert.equal(scope.firstElementChild.href, before, `${entryFile}: runtime preserves the reviewed language`);
    if (lang !== 'ja') assert.equal(probe.getAttribute('href'), 'en/factories.html', 'The fallback pass actually ran for an unmarked link');
  } finally {
    dom.window.close();
    riverDOM.window.close();
    entryDOM.window.close();
  }
});
