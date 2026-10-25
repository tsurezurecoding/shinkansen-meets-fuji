import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const languages = ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko'];

async function fixture({ lang = 'ja', hash = '' } = {}) {
  const events = [], errors = [], navigation = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error));
  const route = lang === 'ja' ? 'zukan.html' : `${lang}/zukan.html`;
  const dom = new JSDOM('<!doctype html><html><head><base href="https://www.michikusa-travel.com/"></head><body data-page="field_guide"><div id="galleryGrid"></div></body></html>', {
    url: `https://www.michikusa-travel.com/${route}${hash}`,
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc,
  });
  const w = dom.window;
  await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
  w.gtag = (...args) => events.push(args);
  const context = dom.getInternalVMContext();
  const runtime = ['locales.js', 'data/timetable.js', 'data-runtime.js'];
  if (!['ja', 'en'].includes(lang)) runtime.push(`${lang}/utility-data.js`, 'utility-locale-runtime.js');
  runtime.push('track.js', 'train-select.js', 'app.js');
  for (const file of runtime) vm.runInContext(read(file), context, { filename: file });
  const run = expression => vm.runInContext(expression, context);
  run('renderGallery()');
  // Observe cancellation after product handlers, then suppress JSDOM's unsupported navigation.
  for (const type of ['click', 'auxclick']) w.document.addEventListener(type, event => {
    if (!event.target.closest('a')) return;
    navigation.push({ type, defaultPrevented: event.defaultPrevented, href: event.target.closest('a').href });
    event.preventDefault();
  });
  return { w, events, errors, navigation, run, close: () => w.close() };
}

for (const lang of languages) test(`${lang} gallery uses article anchors, localized fallbacks and separate controls/credits`, async () => {
  const f = await fixture({ lang });
  try {
    const cards = [...f.w.document.querySelectorAll('.gal-card')];
    assert.equal(cards.length, f.run('gallerySpots().filter(matchesGalleryFilters).length'));
    const wheelIds = f.run('WHEEL_COLLECTION.filter(wheel => wheel.isWheelCollection).map(wheel => wheel.stampId)');
    for (const id of wheelIds) assert.equal(cards.filter(card => card.dataset.spot === id).length, 1, `${id} appears once without expansion`);
    assert.equal(cards.filter(card => card.dataset.spot === 'hirakata-park-wheel').length, 1, 'the existing Hirakata article remains a single card');
    assert.ok(cards.length > 40);
    for (const card of cards) {
      const link = card.querySelector('a[data-gallery-detail]');
      assert.ok(link, `${card.id} has a real article link`);
      assert.equal(link.getAttribute('href'), f.run(`spotPageHref(findSpotById(${JSON.stringify(card.dataset.spot)}))`));
      assert.ok(fs.existsSync(new URL(new URL(link.href).pathname.slice(1), root)), `${link.href} exists`);
      assert.ok(link.getAttribute('aria-label').includes(link.textContent));
      assert.equal(link.querySelector('a, button, [tabindex]'), null);
      assert.equal(card.hasAttribute('data-more'), false);
      assert.equal(card.hasAttribute('tabindex'), false);
      assert.equal(card.hasAttribute('role'), false);
      for (const other of card.querySelectorAll('.photo-credit a, [data-fav], [data-stamp]')) {
        assert.equal(other.closest('[data-gallery-detail]'), null);
      }
      assert.equal(card.querySelectorAll('[data-fav]').length, 1);
      assert.equal(card.querySelectorAll('[data-stamp]').length, 1);
    }
    const castle = f.w.document.querySelector('#spot-kiyosu [data-gallery-detail]');
    assert.equal(castle.getAttribute('href'), `${lang === 'ja' ? '' : `${lang}/`}spots/kiyosu.html`);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('ordinary, modified, keyboard and middle-button gallery activation preserve browser defaults and record once', async () => {
  const f = await fixture();
  try {
    const link = f.w.document.querySelector('#spot-kiyosu [data-gallery-detail]');
    for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      const before = f.events.length;
      link.dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...modifiers }));
      assert.equal(f.navigation.at(-1).defaultPrevented, false);
      assert.equal(f.events.length, before + 1);
      assert.equal(f.events.at(-1)[1], 'spot_detail_open');
      assert.equal(f.events.at(-1)[2].source, 'gallery');
      assert.equal(f.events.at(-1)[2].spot_id, 'kiyosu');
      assert.equal(f.w.document.querySelector('.spot-modal'), null);
    }
    const beforeKeyboard = f.events.length;
    const key = new f.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    assert.equal(link.dispatchEvent(key), true, 'native anchor keyboard activation is not intercepted');
    assert.equal(f.events.length, beforeKeyboard);
    // Browsers dispatch a click after native Enter activation; the same handler records it once.
    link.dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }));
    assert.equal(f.events.length, beforeKeyboard + 1);
    link.dispatchEvent(new f.w.MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    assert.equal(f.navigation.at(-1).defaultPrevented, false);
    assert.equal(f.events.length, beforeKeyboard + 2);
    link.dispatchEvent(new f.w.MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 2 }));
    assert.equal(f.events.length, beforeKeyboard + 2, 'opening the context menu does not count as opening an article');
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('credit links and gallery favorite/stamp buttons keep their independent behavior', async () => {
  const f = await fixture();
  try {
    const credit = f.w.document.querySelector('.gal-card .photo-credit a');
    assert.ok(credit);
    credit.dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(f.navigation.at(-1).defaultPrevented, false);
    assert.equal(f.events.filter(event => event[1] === 'spot_detail_open').length, 0);
    const card = f.w.document.querySelector('#spot-kiyosu');
    for (const [attribute, state, name] of [['data-fav', 'favorites', 'favorite_added'], ['data-stamp', 'stamps', 'stamp_added']]) {
      const button = card.querySelector(`[${attribute}]`);
      button.querySelector('svg').dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, cancelable: true }));
      assert.ok(f.run(`${state}.kiyosu`));
      assert.equal(button.getAttribute('aria-pressed'), 'true');
      assert.equal(f.events.filter(event => event[1] === name).length, 1);
    }
    assert.equal(f.events.filter(event => event[1] === 'spot_detail_open').length, 0);
    assert.equal(f.w.document.querySelector('.spot-modal'), null);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('timeline modals keep detail links, photo credits, map, related views and collection links without the reference group', async () => {
  const f = await fixture();
  try {
    const spotIds = f.run('SPOTS.map(spot => spot.id)');
    for (const id of spotIds) {
      const template = f.w.document.createElement('template');
      template.innerHTML = f.run(`spotDetailModalHTML(findSpotById(${JSON.stringify(id)}))`);
      const modal = template.content;
      const spot = `findSpotById(${JSON.stringify(id)})`;
      assert.equal(modal.querySelector('.spot-modal-body-links'), null);
      assert.equal(modal.querySelector('.spot-modal-guide-cta').getAttribute('href'), f.run(`spotPageHref(${spot})`));
      assert.equal(modal.querySelectorAll('[data-fav]').length, 1);
      assert.equal(modal.querySelectorAll('[data-stamp]').length, 1);
      assert.equal(modal.querySelector('.spot-modal-active-credit')?.innerHTML ?? '', f.run(`spotMediaItems(${spot})[0]?.creditHTML || ''`));
      if (f.run(`Boolean(miniMapDetailsHTML(${spot}))`)) assert.ok(modal.querySelector('.spot-static-map'));
      if (f.run(`Boolean(spotRelatedHTML(${spot}))`)) assert.ok(modal.querySelector('.spot-modal-related'));
      if (f.run(`Boolean(collectionGuideLinkHTML(${spot}))`)) assert.ok(modal.querySelector('.spot-modal-collection-cta'));
    }
    f.w.document.body.insertAdjacentHTML('beforeend', '<div class="tl-item" data-spot="kiyosu"><button data-more>Detail</button></div>');
    f.run('bindSpotEvents(document.querySelector(".tl-item"))');
    f.w.document.querySelector('.tl-item [data-more]').click();
    assert.ok(f.w.document.querySelector('.spot-modal'));
    assert.equal(f.w.location.hash, '#spot-kiyosu');
    assert.equal(f.events.filter(event => event[1] === 'spot_detail_open').at(-1)[2].source, 'timeline');
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('existing spot/photo hashes still open their modal and photo without replacing the deep link', async () => {
  const f = await fixture({ hash: '#spot-fuji/photo-2' });
  try {
    assert.equal(f.run('openSpotFromHash()'), true);
    assert.equal(f.w.location.hash, '#spot-fuji/photo-2');
    assert.equal(f.w.history.length, 1);
    assert.equal(f.w.document.querySelector('.spot-modal-active-photo').getAttribute('src'), f.run('thumbnailSrc(spotMediaItems(findSpotById("fuji"))[1].src)'));
    assert.equal(f.w.document.querySelector('.spot-photo-thumb.active').dataset.photoIndex, '1');
    assert.equal(f.w.document.querySelector('.spot-modal-body-links'), null);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});
