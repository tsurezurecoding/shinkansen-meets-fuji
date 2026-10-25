import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
async function fixture({ language = 'ja', saved, blockedStorage = false } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const route = language === 'ja' ? 'start.html' : 'en/start.html';
  const dom = new JSDOM(read(route), {
    url: 'https://www.michikusa-travel.com/' + route,
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc,
  });
  const w = dom.window;
  await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (saved) w.localStorage.setItem('mado-timeline-selection-ja', saved);
  if (blockedStorage) Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
  const context = dom.getInternalVMContext();
  for (const file of ['locales.js', 'data/timetable.js', 'data-runtime.js', 'track.js', 'train-select.js', 'app.js']) {
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
    for (const id of ['fuji', 'ibuki', 'ibuki-seat-a', 'ferris-wheel-laguna', 'nichiban-anjo']) assert(f.ids().includes(id), id);
    assert(!f.ids().includes('hirakata-park-wheel'));
    assert(f.w.document.querySelector('#timelineRecommendationSummary').textContent.includes('おすすめ 17件'));
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
    const recommended = f.ids().length;
    f.w.document.querySelector('#timelineRecommendationMore button').click();
    assert(f.ids().length > recommended);
    assert(f.run('activeTimelineFilters.has("seat-a")'));
    saved = f.w.localStorage.getItem('mado-timeline-selection-ja');
    assert.equal(saved, 'all');
    assert.equal(f.w.document.querySelector('#timelineRecommendationMore').hidden, true);
    f.click('recommended');
    f.click('night');
    assert.deepEqual(f.ids().sort(), ['hirakata-park-wheel', 'toji']);
    f.click('sign');
    assert.equal(f.run('timelineSelection'), 'all');
    f.click('recommended');
    assert.equal(f.run('activeTimelineFilters.has("sign")'), false);
    assert.equal(f.run('activeTimelineFilters.has("seat-a")'), true);
  } finally { f.close(); }
  const reload = await fixture({ saved });
  try {
    assert.equal(reload.run('timelineSelection'), 'all');
    assert(reload.ids().length > 17);
  } finally { reload.close(); }
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
    assert(f.w.document.querySelector('#timelineRecommendationMore p').textContent.includes('おすすめはありません'));
    f.w.document.querySelector('#timelineRecommendationMore button').click();
    assert.deepEqual(f.ids(), ['hinataoka']);
  } finally { f.close(); }
});

test('English keeps its existing complete timeline even when a Japanese preference was saved', async () => {
  const f = await fixture({ language: 'en', saved: 'recommended' });
  try {
    assert.equal(f.run('hasTimelineRecommendations()'), false);
    assert(f.ids().length > 17);
    assert.equal(f.w.document.querySelector('[data-timeline-filter="recommended"]'), null);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});
