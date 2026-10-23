import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync(new URL('../727-collection.js', import.meta.url), 'utf8');

function mount({ disabled = false } = {}) {
  const dom = new JSDOM('<!doctype html><html lang="en"><body><main class="collection-727-page"><div id="collectionProgress"></div><div id="collectionMedals"></div><div id="collectionList"></div><div id="collectionMap"></div></main></body></html>', { url: 'https://example.test/en/727-collection.html', runScripts: 'outside-only' });
  const { window } = dom;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  const events = [];
  const markerHandlers = [];
  window.MADO_ANALYTICS_DISABLED = disabled;
  window.gtag = (...args) => events.push(args);
  window.BOARD_COLLECTION = [{ id: 'point-a', ja: '地点A', en: 'Point A', segment: '東京 → 品川', side: 'E', minutesFromTokyo: 10, lat: 35.5, lng: 139.5 }];
  window.ROUTE = { refStations: [{ ja: '東京', en: 'Tokyo' }, { ja: '品川', en: 'Shinagawa' }] };
  const map = { setView() { return this; }, fitBounds() {}, invalidateSize() {} };
  const leaflet = {
    map: () => map,
    tileLayer: () => ({ addTo() {} }),
    marker: () => ({ addTo() { return this; }, bindPopup() {}, setPopupContent() {}, on(name, fn) { markerHandlers.push(fn); } }),
    latLngBounds: (points) => points,
  };
  window.MADO_LEAFLET = { load: async () => leaflet };
  window.eval(source);
  return { dom, window, events, markerHandlers };
}

test('each 727 user action sends one named event; opening a card programmatically adds none', async () => {
  const f = mount();
  try {
    await new Promise((resolve) => setTimeout(resolve, 0));
    f.markerHandlers[0]();
    assert.deepEqual(f.events.map((event) => event[1]), ['map_selection']);
    // Marker focus opens the card programmatically, so that focus itself must not count as a card-open event.
    const filter = f.window.document.createElement('button'); filter.setAttribute('data-collection-filter', 'seat-e'); f.window.document.querySelector('main').append(filter); filter.click();
    assert.deepEqual(f.events.map((event) => event[1]), ['map_selection', 'regionfilter']);
    const card = f.window.document.querySelector('[data-point-accordion]'); card.click(); card.click();
    assert.deepEqual(f.events.map((event) => event[1]), ['map_selection', 'regionfilter', 'cardopen']);
    f.window.document.querySelector('[data-point-stamp]').click();
    assert.deepEqual(f.events.map((event) => event[1]), ['map_selection', 'regionfilter', 'cardopen', 'stamp_operation']);
    assert.equal(f.events.at(-1)[2].operation, 'add');
  } finally { f.dom.window.close(); }
});

test('ga=off state suppresses all 727 analytics events while interactions still work', async () => {
  const f = mount({ disabled: true });
  try {
    await new Promise((resolve) => setTimeout(resolve, 0));
    f.markerHandlers[0]();
    const filter = f.window.document.createElement('button'); filter.setAttribute('data-collection-filter', 'seat-e'); f.window.document.querySelector('main').append(filter); filter.click();
    f.window.document.querySelector('[data-point-accordion]').click();
    f.window.document.querySelector('[data-point-stamp]').click();
    assert.equal(f.events.length, 0);
    assert.equal(f.window.document.querySelector('[data-point-stamp]').getAttribute('aria-pressed'), 'true');
  } finally { f.dom.window.close(); }
});
