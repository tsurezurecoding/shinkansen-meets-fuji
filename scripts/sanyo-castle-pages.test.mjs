import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { SANYO_DETAIL_CASTLES } from './shared/sanyo-castles.mjs';
const root = new URL('../', import.meta.url);
const renderer = fs.readFileSync(new URL('spot-page-shared.js', root), 'utf8');
const mapScript = fs.readFileSync(new URL('spot-map.js', root), 'utf8');
function page(id, lang, embedded = false) {
  const route = `${lang === 'en' ? 'en/' : ''}spots/${id}.html`;
  const dom = new JSDOM(fs.readFileSync(new URL(route, root), 'utf8'), { url: `https://www.michikusa-travel.com/${route}`, runScripts: 'outside-only' });
  dom.window.MADO_EMBEDDED_WEB = embedded;
  dom.window.eval(renderer);
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
    assert.equal(doc.querySelectorAll('.spot-page-inline-zoom').length, castle.detail.photos.length);
    assert.equal(doc.querySelectorAll('.sanyo-photo-list figcaption a').length, castle.detail.photos.length);
    assert.equal(doc.querySelectorAll('[data-spot-page-shared-module="rail"], .spot-page-stamp').length, 0);
    assert.ok(!doc.querySelector('.spot-page-facts').textContent.includes('東京から'));
    assert.equal(doc.querySelector('link[rel="canonical"]').href, dom.window.location.href);
    dom.window.close();
  });
  test(`${castle.id}/${lang}: photo enlargement and map viewpoint switching`, () => {
    const dom = page(castle.id, lang), doc = dom.window.document;
    const zoom = doc.querySelector('.spot-page-inline-zoom'), box = doc.querySelector('#spotPageLightbox');
    zoom.click();
    assert.equal(box.hidden, false);
    assert.equal(box.querySelector('img').getAttribute('src'), zoom.getAttribute('data-zoom-src'));
    doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(box.hidden, true);
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
    assert.equal(doc.querySelector('h1').textContent, castle.name[lang]);
    doc.querySelector('.spot-page-inline-zoom').click();
    assert.equal(doc.querySelector('#spotPageLightbox').hidden, false);
    doc.querySelector('[data-mini-map-mode="viewpoint"]').click();
    assert.equal(doc.querySelector('[data-mini-map-mode="viewpoint"]').getAttribute('aria-pressed'), 'true');
    dom.window.close();
  });
}
