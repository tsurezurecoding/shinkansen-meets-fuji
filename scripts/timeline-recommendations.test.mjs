import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
async function fixture({ language = 'ja', saved, savedFilters, blockedStorage = false } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const route = language === 'ja' ? 'start.html' : `${language}/start.html`;
  const dom = new JSDOM(read(route), {
    url: 'https://www.michikusa-travel.com/' + route,
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc,
  });
  const w = dom.window;
  await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (saved) w.localStorage.setItem('mado-timeline-selection-ja', saved);
  if (savedFilters !== undefined) w.localStorage.setItem('mado-timeline-filters-v1', Array.isArray(savedFilters) ? JSON.stringify(savedFilters) : savedFilters);
  if (blockedStorage) Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
  const context = dom.getInternalVMContext();
  const files = ['locales.js', 'data/timetable.js', 'data-runtime.js'];
  if (!['ja', 'en'].includes(language)) files.push(`${language}/utility-data.js`, 'utility-locale-runtime.js');
  files.push('track.js', 'train-select.js', 'app.js');
  for (const file of files) {
    vm.runInContext(read(file), context, { filename: file });
  }
  const run = code => vm.runInContext(code, context);
  run('bindTimelineControls(); renderInitialTimelinePreview(); updateTimelineFilterButtons()');
  const click = filter => w.document.querySelector(`[data-timeline-filter="${filter}"]`).click();
  const ids = () => [...w.document.querySelectorAll('#timeline .tl-item')].map(el => el.dataset.spot);
  return { w, run, click, ids, errors, close: () => w.close() };
}

test('Japanese preview defaults to the proposed day selection, including both seat variants and one wheel', async () => {
  const f = await fixture();
  try {
    assert.equal(f.ids().length, 17);
    assert.equal(f.w.document.querySelectorAll('#timeline .tl-recommended-badge').length, 17);
    for (const id of ['fuji', 'ibuki', 'ibuki-seat-a', 'ferris-wheel-laguna', 'nichiban-anjo']) assert(f.ids().includes(id), id);
    assert(!f.ids().includes('hirakata-park-wheel'));
    assert.equal(f.w.document.querySelector('#timelineRecommendationSummary').textContent, `絞り込み中：定番 ／ 区間内の全${f.run('collectionTimelineSpots().length')}件中17件を表示`);
    assert.equal(f.w.document.querySelector('[data-timeline-filter="classic"]'), null);
    assert.equal(f.w.document.querySelector('.tl-recommended-badge').textContent, '定番');
    assert.equal(f.w.document.querySelector('[data-timeline-filter="recommended"]').getAttribute('aria-pressed'), 'true');
    assert.equal(f.w.document.querySelector('#timelineRecommendationMore').hidden, false);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('all selection persists, while seat and night conditions remain usable and discovery remains reachable', async () => {
  const f = await fixture();
  let saved;
  try {
    f.click('seat-a');
    assert(f.ids().includes('hamanako'));
    assert(!f.ids().includes('fuji'));
    assert(f.w.document.querySelector('#timelineRecommendationSummary').textContent.includes(`全${f.run('collectionTimelineSpots().length')}件中${f.ids().length}件`));
    const recommended = f.ids().length;
    f.w.document.querySelector('#timelineRecommendationMore button').click();
    assert(f.ids().length > recommended);
    assert.equal(f.run('activeTimelineFilters.size'), 0);
    assert.equal(f.w.document.querySelectorAll('#timeline .tl-recommended-badge').length, 17);
    assert(f.ids().length > f.w.document.querySelectorAll('#timeline .tl-recommended-badge').length);
    saved = f.w.localStorage.getItem('mado-timeline-selection-ja');
    assert.equal(saved, 'all');
    assert.equal(f.w.document.querySelector('#timelineRecommendationMore').hidden, true);
    f.click('recommended');
    f.click('seat-a');
    f.click('night');
    assert.deepEqual(f.ids().sort(), ['hirakata-park-wheel', 'toji']);
    f.click('sign');
    assert.equal(f.run('timelineSelection'), 'recommended');
    f.click('recommended');
    assert.equal(f.run('timelineSelection'), 'all');
    assert.equal(f.run('activeTimelineFilters.has("sign")'), true);
    assert.equal(f.run('activeTimelineFilters.has("seat-a")'), true);
    f.click('all');
    assert.equal(f.run('activeTimelineFilters.size'), 0);
    assert(f.ids().includes('fuji'));
    assert(f.ids().includes('hinataoka'));
    assert(f.w.document.querySelector('#timelineRecommendationSummary').textContent.startsWith('すべて表示中'));
  } finally { f.close(); }
  const reload = await fixture({ saved });
  try {
    assert.equal(reload.run('timelineSelection'), 'all');
    assert(reload.ids().length > 17);
  } finally { reload.close(); }
});

test('localized seat and category filters remain selected after reload', async () => {
  const f = await fixture({ language: 'fr', savedFilters: [] });
  let savedFilters;
  let beforeReload;
  try {
    f.click('seat-a');
    f.click('nature');
    beforeReload = f.ids();
    savedFilters = JSON.parse(f.w.localStorage.getItem('mado-timeline-filters-v1'));
    assert(f.w.document.querySelector('[data-timeline-filter="seat-a"]').classList.contains('active'));
    assert(f.w.document.querySelector('[data-timeline-filter="nature"]').classList.contains('active'));
  } finally { f.close(); }
  const reload = await fixture({ language: 'fr', savedFilters });
  try {
    assert.deepEqual(reload.ids(), beforeReload);
    assert(reload.w.document.querySelector('[data-timeline-filter="seat-a"]').classList.contains('active'));
    assert(reload.w.document.querySelector('[data-timeline-filter="nature"]').classList.contains('active'));
  } finally { reload.close(); }
});

test('clearing localized filters stays clear after reload', async () => {
  const f = await fixture({ language: 'fr', savedFilters: [] });
  let saved;
  try {
    f.click('seat-a');
    f.click('industry');
    f.click('all');
    assert.equal(f.w.localStorage.getItem('mado-timeline-filters-v1'), '[]');
    assert.equal(f.run('activeTimelineFilters.size'), 0);
    saved = f.w.localStorage.getItem('mado-timeline-selection-ja');
  } finally { f.close(); }
  const reload = await fixture({ language: 'fr', saved, savedFilters: [] });
  try {
    assert.equal(reload.run('activeTimelineFilters.size'), 0);
    assert.equal(reload.run('timelineSelection'), 'all');
    assert(reload.ids().length > 17);
    assert.equal(reload.w.localStorage.getItem('mado-timeline-filters-v1'), '[]');
  } finally { reload.close(); }
});

test('malformed and unavailable filter storage leave the localized timeline usable', async () => {
  const malformed = await fixture({ language: 'fr', savedFilters: '{bad json' });
  try {
    assert.equal(malformed.run('activeTimelineFilters.size'), 0);
    malformed.click('seat-e');
    assert(malformed.ids().length > 0);
    assert.deepEqual(malformed.errors, []);
  } finally { malformed.close(); }
  const blocked = await fixture({ language: 'fr', blockedStorage: true });
  try {
    assert.equal(blocked.run('activeTimelineFilters.size'), 0);
    blocked.click('seat-e');
    assert(blocked.ids().length > 0);
    assert.deepEqual(blocked.errors, []);
  } finally { blocked.close(); }
});

test('727 remains selected when another category is added', async () => {
  const f = await fixture({ language: 'fr', savedFilters: [] });
  try {
    f.click('727');
    f.click('nature');
    assert(f.w.document.querySelector('[data-timeline-filter="727"]').classList.contains('active'));
    assert(f.w.document.querySelector('[data-timeline-filter="nature"]').classList.contains('active'));
    assert.deepEqual(JSON.parse(f.w.localStorage.getItem('mado-timeline-filters-v1')).sort(), ['727', 'nature']);
  } finally { f.close(); }
});

test('selected train times choose night candidates per spot, while a timetable-free preview stays daytime', async () => {
  const f = await fixture();
  try {
    const result = f.run(`(() => {
      const spots = ["fuji", "toji", "musashi-kosugi-towers"].map(id => ({sp: SPOTS.find(s => s.id === id), clock:1200}));
      journey = {mode:"train",preview:false};
      isClearlyDark = () => true;
      const night = recommendedTimelineCandidates(spots).map(x => x.sp.id);
      journey.preview = true;
      return {night,day:recommendedTimelineCandidates(spots).map(x => x.sp.id)};
    })()`);
    assert.deepEqual(Array.from(result.night), ['toji', 'musashi-kosugi-towers']);
    assert.deepEqual(Array.from(result.day), ['fuji', 'toji']);
  } finally { f.close(); }
});

test('a short interval with no recommendation offers the other available spot without fabricating a recommendation', async () => {
  const f = await fixture();
  try {
    f.run('journey.spots = journey.spots.filter(x => x.sp.id === "hinataoka"); wheelCollectionSpots = () => []; renderTimeline()');
    assert.equal(f.ids().length, 0);
    assert(f.w.document.querySelector('#timelineRecommendationMore p').textContent.includes('定番スポットはありません'));
    f.w.document.querySelector('#timelineRecommendationMore button').click();
    assert.deepEqual(f.ids(), ['hinataoka']);
  } finally { f.close(); }
});

test('English shows the classic default with no saved Japanese or filter state', async () => {
  const f = await fixture({ language: 'en', savedFilters: [] });
  try {
    assert.equal(f.run('hasTimelineRecommendations()'), true);
    assert.equal(f.ids().length, 17);
    assert.equal(f.w.document.querySelectorAll('#timeline .tl-recommended-badge').length, 17);
    assert.equal(f.w.document.querySelector('[data-timeline-filter="recommended"]').getAttribute('aria-pressed'), 'true');
    assert.equal(f.w.localStorage.getItem('mado-timeline-selection-ja'), null);
    assert.equal(f.w.localStorage.getItem('mado-timeline-filters-v1'), '[]');
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});
