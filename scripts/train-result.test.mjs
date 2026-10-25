import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = new URL('../', import.meta.url);
const source = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const runtime = ['data/timetable.js', 'data-runtime.js', 'track.js', 'train-select.js', 'train-picker.js', 'app.js'];
const savedTrain = { direction: 'west', boardId: 'Tokyo', trainType: 'Nozomi', trainNumber: 1, savedAt: Date.now() };

async function fixture({ query = '', path = 'start.html', saved, disabled = false, embedded = false, loadComplete = true } = {}) {
  const errors = [], events = [], scrolls = [], scrollOptions = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (error) => errors.push(error));
  const dom = new JSDOM(source(path === 'en/start.html' ? path : 'start.html'), {
    url: `https://www.michikusa-travel.com/${path}${query}`,
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc,
  });
  const w = dom.window;
  await new Promise((resolve) => w.addEventListener('load', resolve, { once: true }));
  Object.defineProperty(w.document, 'readyState', { configurable: true, get: () => loadComplete ? 'complete' : 'interactive' });
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function (options) { scrolls.push(this.id); scrollOptions.push(options); };
  w.MADO_ANALYTICS_DISABLED = disabled;
  w.MADO_EMBEDDED_WEB = embedded;
  w.gtag = (...args) => events.push(args);
  w.MadoStorage = {};
  if (saved) w.localStorage.setItem('mado-last-journey', JSON.stringify(saved));
  const context = dom.getInternalVMContext();
  for (const file of runtime) vm.runInContext(source(file), context, { filename: file });
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  await new Promise((resolve) => w.requestAnimationFrame(resolve));
  assert.deepEqual(errors, [], 'the real start-page runtime should initialize cleanly');
  return {
    w, events, scrolls, scrollOptions, errors,
    finishLoad: async () => {
      loadComplete = true;
      w.dispatchEvent(new w.Event('load'));
      await new Promise((resolve) => w.requestAnimationFrame(resolve));
    },
    read: (expression) => vm.runInContext(expression, context),
    answer: () => w.document.querySelector('#fujiTrainAnswer'),
    close: () => dom.window.close(),
  };
}

function selectFirst(f) {
  const time = f.w.document.querySelector('#departTime');
  time.value = '06:00';
  time.dispatchEvent(new f.w.Event('change', { bubbles: true }));
  f.w.document.querySelector('#findTrainsBtn').click();
  const train = f.w.document.querySelector('#trainResults [data-train]');
  assert.ok(train, 'real timetable must supply a selectable train');
  train.click();
}

test('valid westbound deep link answers using the actual journey time and focuses Fuji', async () => {
  const f = await fixture({ query: '?train=Nozomi-1&board=Tokyo&dir=west&focus=fuji', saved: { ...savedTrain, trainNumber: 3 } });
  try {
    assert.equal(f.answer().hidden, false);
    const time = f.read('minToClock(journey.spots.find(x => x.sp.id === "fuji").clock)');
    assert.match(f.answer().textContent, /のぞみ1号/);
    assert.ok(f.answer().querySelector('.fuji-train-answer-time').textContent.includes(time));
    assert.match(f.answer().textContent, /普通車はE席・グリーン車はD席/);
    assert.match(f.answer().textContent, /京都・新大阪方面は進行方向の右側/);
    assert.match(f.answer().textContent, /目安.*天候.*日没/);
    assert.equal(f.scrolls.at(-1), 'fujiTrainAnswer');
    assert.ok(f.w.document.title.includes(`のぞみ1号 — 富士山 ${time}頃`));
    assert.equal(f.events.filter((event) => event[1] === 'journey_from_link').length, 1);
    assert.equal(f.events.some((event) => event[1] === 'journey_restored'), false);
  } finally { f.close(); }
});

test('eastbound English Fuji entry gives left side', async () => {
  const f = await fixture({ path: 'en/start.html', query: '?train=Nozomi-2&board=Shin-Osaka&dir=east&focus=fuji' });
  try {
    assert.equal(f.answer().hidden, false);
    assert.match(f.answer().textContent, /Nozomi 2/);
    assert.match(f.answer().textContent, /Look left toward Tokyo/);
    assert.match(f.answer().textContent, /Ordinary car: seat E · Green Car: seat D/);
    assert.match(f.answer().textContent, /clouds and darkness/);
    assert.equal(f.scrolls.at(-1), 'fujiTrainAnswer');
    assert.ok(f.w.document.querySelectorAll('#timeline [data-spot]').length > 10);
  } finally { f.close(); }
});

test('general journeys show the chronological timeline without a Fuji-only result', async () => {
  for (const options of [
    { query: '?train=Nozomi-1&board=Tokyo&dir=west' },
    { path: 'en/start.html', query: '?train=Nozomi-1&board=Nagoya&dir=west' },
  ]) {
    const f = await fixture(options);
    try {
      const clear = f.w.document.querySelector('#timelineFilterbar [data-timeline-filter="all"]');
      assert.ok(clear, 'the timeline condition-clear control should be available');
      clear.click();
      assert.equal(f.answer().hidden, true);
      assert.equal(f.answer().textContent, '');
      assert.equal(f.scrolls.at(-1), 'timelineSection');
      assert.ok(f.w.document.querySelectorAll('#timeline [data-spot]').length > 10);
      const base = f.read('BASE_PAGE_TITLE');
      assert.equal(f.w.document.title, `${options.path ? 'Nozomi 1' : 'のぞみ1号'} | ${base}`);
    } finally { f.close(); }
  }
});

test('boarding beyond Fuji shows an honest out-of-section answer with no Fuji time', async () => {
  const f = await fixture({ query: '?train=Nozomi-1&board=Nagoya&dir=west&focus=fuji' });
  try {
    assert.equal(f.answer().hidden, false);
    assert.match(f.answer().textContent, /新富士付近の富士山ポイントは含まれません/);
    assert.equal(f.answer().querySelector('.fuji-train-answer-time'), null);
    assert.equal(f.answer().querySelector('.fuji-train-answer-seat'), null);
    assert.equal(f.read('journey.spots.some(x => x.sp.id === "fuji")'), false);
    assert.equal(f.scrolls.at(-1), 'fujiTrainAnswer');
  } finally { f.close(); }
});

test('invalid and incomplete links never silently restore a saved different train', async () => {
  for (const query of [
    '?train=Nozomi-9999&board=Tokyo&dir=west',
    '?train=Nozomi-1&board=Unknown&dir=west',
    '?train=Nozomi-1&board=Tokyo&dir=east',
    '?train=Nozomi-1&board=Tokyo',
    '?train=&board=Tokyo&dir=west',
    '?board=Tokyo&dir=west',
  ]) {
    const f = await fixture({ query, saved: savedTrain });
    try {
      const notice = f.w.document.querySelector('#trainLinkNotice');
      assert.equal(notice.hidden, false, query);
      assert.match(notice.textContent, /列車を選び直してください/);
      assert.equal(f.answer().hidden, true);
      assert.equal(f.read('journey.mode'), 'estimate');
      f.w.dispatchEvent(new f.w.Event('mado:storage-ready'));
      assert.equal(f.read('journey.mode'), 'estimate');
      assert.equal(f.events.some((event) => ['journey_from_link', 'journey_restored'].includes(event[1])), false);
      assert.equal(JSON.parse(f.w.localStorage.getItem('mado-last-journey')).trainNumber, 1);
    } finally { f.close(); }
  }
});

test('manual selection repairs invalid links, preserves query flags and survives a language round trip', async () => {
  const f = await fixture({ query: '?train=bad&focus=fuji&ga=off&lang=ja#journey', saved: savedTrain, disabled: true });
  let english;
  try {
    selectFirst(f);
    const url = new URL(f.w.location.href);
    assert.equal(url.searchParams.get('train'), f.read('`${journey.train.type}-${journey.train.number}`'));
    assert.equal(url.searchParams.get('board'), 'Tokyo');
    assert.equal(url.searchParams.get('dir'), 'west');
    assert.equal(url.searchParams.get('focus'), 'fuji');
    assert.equal(url.searchParams.get('ga'), 'off');
    assert.equal(url.searchParams.get('lang'), 'ja');
    assert.equal(url.hash, '#journey');
    assert.equal(f.w.document.querySelector('#trainLinkNotice').hidden, true);
    assert.equal(f.events.length, 0, 'GA opt-out must cover new and existing event paths');
    const next = new URL(f.read('localizedPageHref("en")'));
    assert.equal(next.pathname, '/en/start.html');
    assert.equal(next.searchParams.get('lang'), 'en');
    english = await fixture({ path: 'en/start.html', query: `${next.search}${next.hash}` });
    assert.equal(english.read('journey.train.number'), f.read('journey.train.number'));
    assert.match(english.answer().textContent, /Mt\. Fuji passing time/);
    const back = new URL(english.read('localizedPageHref("ja")'));
    assert.equal(back.pathname, '/start.html');
    assert.equal(back.searchParams.get('lang'), 'ja');
    assert.equal(back.searchParams.get('train'), url.searchParams.get('train'));
  } finally { english?.close(); f.close(); }
});

test('changing picker inputs clears the previous answer, result title and selected-train URL', async () => {
  const f = await fixture({ query: '?train=Nozomi-1&board=Tokyo&dir=west&focus=fuji' });
  try {
    f.w.document.querySelector('[data-dir="east"]').click();
    assert.equal(f.answer().hidden, true);
    assert.equal(f.w.document.title, f.read('BASE_PAGE_TITLE'));
    const url = new URL(f.w.location.href);
    assert.equal(url.searchParams.has('train'), false);
    assert.equal(url.searchParams.get('focus'), 'fuji');
  } finally { f.close(); }
});

test('manual selection emits the existing metric once and URL writes stay scoped to web start pages', async () => {
  for (const options of [{}, { embedded: true }, { path: 'other.html' }]) {
    const f = await fixture({ ...options, query: '?focus=fuji' });
    try {
      const before = f.w.location.href;
      selectFirst(f);
      assert.equal(f.events.filter((event) => event[1] === 'train_selected').length, 1);
      if (options.embedded || options.path) assert.equal(f.w.location.href, before);
      else assert.ok(new URL(f.w.location.href).searchParams.has('train'));
    } finally { f.close(); }
  }
});

test('the existing #spot-fuji hash still opens the modal without replacing the Fuji result', async () => {
  const f = await fixture({ query: '?train=Nozomi-1&board=Tokyo&dir=west&focus=fuji#spot-fuji' });
  try {
    assert.equal(f.read('activeSpotModal.spotId'), 'fuji');
    assert.equal(f.answer().hidden, false);
    assert.equal(f.w.location.hash, '#spot-fuji');
  } finally { f.close(); }
});

test('plain visits retain saved-journey restoration without rewriting the URL', async () => {
  const f = await fixture({ query: '?focus=fuji', saved: savedTrain });
  try {
    assert.equal(f.read('journey.train.number'), 1);
    assert.equal(f.answer().hidden, false);
    assert.equal(f.events.filter((event) => event[1] === 'journey_restored').length, 1);
    assert.equal(f.w.location.search, '?focus=fuji');
    assert.equal(new URL(f.read('localizedPageHref("en")')).searchParams.get('train'), 'Nozomi-1');
  } finally { f.close(); }
});

test('initial Fuji focus runs once after load and after the browser fragment navigation', async () => {
  const f = await fixture({ query: '?train=Nozomi-1&board=Tokyo&dir=west&focus=fuji#journey', loadComplete: false });
  try {
    assert.equal(f.answer().hidden, false);
    assert.equal(f.scrolls.length, 0, 'do not start an initial smooth scroll while resources are loading');
    f.w.document.querySelector('#journey').scrollIntoView({ behavior: 'auto' });
    await f.finishLoad();
    assert.deepEqual(f.scrolls, ['journey', 'fujiTrainAnswer']);
    assert.equal(f.scrollOptions.at(-1).behavior, 'instant');
    assert.equal(f.w.location.hash, '#journey');
    await f.finishLoad();
    assert.equal(f.scrolls.length, 2, 'the initial focus must not run repeatedly');
  } finally { f.close(); }
});

test('a manual selection before load cancels the older pending focus and scrolls immediately', async () => {
  const f = await fixture({ query: '?train=Nozomi-1&board=Tokyo&dir=west&focus=fuji#journey', loadComplete: false });
  try {
    selectFirst(f);
    assert.deepEqual(f.scrolls, ['fujiTrainAnswer']);
    assert.equal(f.scrollOptions.at(-1).behavior, 'smooth');
    await f.finishLoad();
    assert.deepEqual(f.scrolls, ['fujiTrainAnswer']);
  } finally { f.close(); }
});
