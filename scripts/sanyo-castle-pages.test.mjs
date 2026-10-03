import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { SANYO_DETAIL_CASTLES } from './shared/sanyo-castles.mjs';
const root = new URL('../', import.meta.url);
const renderer = fs.readFileSync(new URL('spot-page-shared.js', root), 'utf8');
const mapScript = fs.readFileSync(new URL('spot-map.js', root), 'utf8');
const galleryScript = fs.readFileSync(new URL('spot-media-gallery.js', root), 'utf8');
function page(id, lang, embedded = false) {
  const route = `${lang === 'en' ? 'en/' : ''}spots/${id}.html`;
  const dom = new JSDOM(fs.readFileSync(new URL(route, root), 'utf8'), { url: `https://www.michikusa-travel.com/${route}`, runScripts: 'outside-only' });
  dom.window.MADO_EMBEDDED_WEB = embedded;
  dom.window.eval(fs.readFileSync(new URL("spot-page-shared-data.js", root), "utf8"));
  dom.window.eval(renderer);
  dom.window.eval(galleryScript);
  dom.window.eval(mapScript);
  return dom;
}
for (const castle of SANYO_DETAIL_CASTLES) for (const lang of ['ja', 'en']) {
  test(`${castle.id}/${lang}: static article, language round-trip and source links`, () => {
    const dom = page(castle.id, lang), doc = dom.window.document;
    assert.equal(doc.querySelectorAll('.topbar').length, 1);
    assert.equal(doc.querySelectorAll('[data-spot-page-shared-module]').length, 0);
    const switches = doc.querySelectorAll('.lang-switch a');
    assert.equal(switches.length, 2);
    assert.equal(new URL(switches[0].href).pathname, `/spots/${castle.id}.html`);
    assert.equal(new URL(switches[1].href).pathname, `/en/spots/${castle.id}.html`);
    if (lang === 'en') assert.equal(new URL(switches[0].href).searchParams.get('lang'), 'ja');
    assert.equal(doc.querySelectorAll('[data-gallery-thumb]').length, castle.detail.photos.length);
    assert.equal(doc.querySelectorAll('.spot-page-hero .spot-page-heading-row h1').length, 1);
    assert.equal(doc.querySelectorAll('.spot-page-facts > div').length, 4);
    assert.equal(doc.querySelector('[data-gallery-source-output]').href, castle.detail.photos[0].sourceUrl);
    assert.equal(doc.querySelectorAll('[data-mini-map-mode="live"], .spot-reading-actions, .spot-train-picker').length, 0);
    assert.equal(doc.querySelectorAll('.spot-page-rail').length, 1);
    assert.equal(doc.querySelectorAll('.spot-page-rail-list, .spot-page-rail-live, .spot-reading-actions, .spot-page-stamp').length, 0);
    assert.equal(doc.querySelectorAll('.spot-reading-related .spot-reading-photos img').length, 2);
    assert.equal(new URL(doc.querySelector('.spot-reading-related a').href).pathname, lang === 'en' ? '/en/castles.html' : '/castles.html');
    assert.equal(doc.querySelectorAll('.spot-page-showcase a').length > 0, true);
    assert.ok(!doc.querySelector('.spot-page-facts').textContent.includes('東京から'));
    assert.equal(doc.querySelector('link[rel="canonical"]').href, dom.window.location.href);
    dom.window.close();
  });
  test(`${castle.id}/${lang}: gallery selection, credits, history and map viewpoint switching`, () => {
    const dom = page(castle.id, lang), doc = dom.window.document;
    const thumbs = doc.querySelectorAll('[data-gallery-thumb]');
    thumbs[1].click();
    assert.equal(doc.querySelector('[data-gallery-image]').getAttribute('src'), thumbs[1].getAttribute('data-gallery-src'));
    assert.equal(doc.querySelector('[data-gallery-image]').alt, castle.detail.photos[1].alt[lang]);
    assert.equal(doc.querySelector('[data-gallery-credit-output]').textContent, castle.detail.photos[1].credit);
    assert.equal(doc.querySelector('[data-gallery-source-output]').href, castle.detail.photos[1].sourceUrl);
    assert.equal(dom.window.location.hash, `#spot-${castle.id}/photo-2`);
    dom.window.history.replaceState({}, '', `#spot-${castle.id}`);
    dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
    assert.equal(thumbs[0].getAttribute('aria-pressed'), 'true');
    const viewpoint = doc.querySelector('[data-mini-map-mode="viewpoint"]');
    viewpoint.click();
    const actual = new URL(doc.querySelector('iframe').src);
    assert.equal(actual.searchParams.get('q'), `${castle.detail.viewpoint.lat},${castle.detail.viewpoint.lng}`);
    assert.equal(viewpoint.getAttribute('aria-pressed'), 'true');
    const target = doc.querySelector('[data-mini-map-mode="spot"]');
    target.click();
    assert.equal(new URL(doc.querySelector('iframe').src).searchParams.get('q'), `${castle.detail.castle.lat},${castle.detail.castle.lng}`);
    assert.equal(target.getAttribute('aria-pressed'), 'true');
    dom.window.close();
  });
  test(`${castle.id}/${lang}: embedded chrome removal keeps photos and map working`, () => {
    const dom = page(castle.id, lang, true), doc = dom.window.document;
    assert.equal(doc.querySelector('.topbar'), null);
    assert.equal(doc.querySelector('[data-spot-page-shared-module]'), null);
    assert.equal(doc.querySelector('h1').textContent, lang === 'ja' ? castle.detail.heading.ja.join('') : castle.detail.heading.en);
    doc.querySelectorAll('[data-gallery-thumb]')[1].click();
    assert.equal(doc.querySelectorAll('[data-gallery-thumb]')[1].getAttribute('aria-pressed'), 'true');
    doc.querySelector('[data-mini-map-mode="viewpoint"]').click();
    assert.equal(doc.querySelector('[data-mini-map-mode="viewpoint"]').getAttribute('aria-pressed'), 'true');
    dom.window.close();
  });
}

for (const lang of ['ja', 'en']) test(`Sanyo/${lang}: collection card stays identical to Kiyosu`, () => {
  const route = `${lang === 'en' ? 'en/' : ''}spots/kiyosu.html`;
  const kiy = new JSDOM(fs.readFileSync(new URL(route, root), 'utf8'), { url: `https://www.michikusa-travel.com/${route}`, runScripts: 'outside-only' });
  kiy.window.eval(fs.readFileSync(new URL('spot-page-shared-data.js', root), 'utf8'));
  kiy.window.eval(fs.readFileSync(new URL(`data/spot-pages/kiyosu.${lang}.js`, root), 'utf8'));
  kiy.window.eval(renderer);
  const expected = kiy.window.document.querySelector('.spot-reading-related').outerHTML;
  for (const castle of SANYO_DETAIL_CASTLES) {
    const dom = page(castle.id, lang);
    assert.equal(dom.window.document.querySelector('.spot-reading-related').outerHTML, expected);
    dom.window.close();
  }
  kiy.window.close();
});
