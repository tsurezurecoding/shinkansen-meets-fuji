import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { TOKYO_SCENES, tokyoSightlineHead, tokyoSightlineHTML } from './shared/tokyo-sightline.mjs';

const code = fs.readFileSync(new URL('../tokyo-sightline.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

async function setup(t, factory, { connection, intersectionObserver = true } = {}) {
  const article = '<div class="spot-page-shell"><article><section id="story">本文</section><section class="spot-static-map">地図</section><section id="references">出典</section></article></div>';
  const html = article + tokyoSightlineHTML({ id: 'tokyo-tower' }, 'ja', '../');
  const dom = new JSDOM(html, {
    runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'https://example.com/spots/tokyo-tower.html'
  });
  t.after(() => dom.window.close());
  let observerCallback;
  if (intersectionObserver) {
    dom.window.IntersectionObserver = class {
      constructor(callback) { observerCallback = callback; }
      observe() {}
      disconnect() {}
    };
  }
  if (connection) Object.defineProperty(dom.window.navigator, 'connection', { value: connection });
  if (factory) dom.window.createTokyoStage = factory;
  dom.window.MADO_SPOT_PAGE_READY = Promise.resolve();
  dom.window.eval(code);
  await tick();
  return {
    dom,
    find: selector => dom.window.document.querySelector(selector),
    all: selector => Array.from(dom.window.document.querySelectorAll(selector)),
    near: async value => { observerCallback([{ isIntersecting: value }]); await tick(); },
    hidden: value => {
      Object.defineProperty(dom.window.document, 'hidden', { value, configurable: true });
      dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
    }
  };
}

test('the supplement and its assets are emitted only for the Japanese Tokyo article', () => {
  for (const [spot, lang] of [
    [{ id: 'tokyo-tower' }, 'en'], [{ id: 'tokyo-tower' }, 'zh-TW'],
    [{ id: 'tokyo-tower' }, 'fr'], [{ id: 'edo-castle-fujimi-yagura' }, 'ja'],
    [{ id: 'mount-fuji' }, 'ja']
  ]) {
    assert.equal(tokyoSightlineHTML(spot, lang, '../../'), '');
    assert.equal(tokyoSightlineHead(spot, lang, '../../'), '');
  }
  assert.match(tokyoSightlineHead({ id: 'tokyo-tower' }, 'ja', '../'), /href="\.\.\/tokyo-sightline\.css\?v=[a-f0-9]+"/);
  assert.deepEqual(TOKYO_SCENES.map(scene => scene.id), ['tower', 'bridge', 'station', 'toranomon']);
  for (const scene of TOKYO_SCENES) {
    const image = new URL('../images/' + scene.photo, import.meta.url);
    const stat = fs.statSync(image);
    assert(stat.isFile() && stat.size > 0, `${scene.id}: the selected photo must exist`);
    assert(scene.alt.trim(), `${scene.id}: the photo needs alternative text`);
  }
});

test('mounting and scrolling never load the engine; an explicit click opens the model', async t => {
  let calls = 0;
  const { dom, find, near } = await setup(t, async () => {
    calls++;
    return { destroy() {}, setScene() {}, setActive() {} };
  });
  assert.equal(find('[data-tokyo-sightline]').nextElementSibling, find('.spot-static-map'));
  assert.equal(find('#story').textContent, '本文');
  assert.equal(find('#references').textContent, '出典');
  assert.equal(find('#tokyo-sightline-model').hidden, true);
  assert.equal(find('[data-tokyo-open]').getAttribute('aria-expanded'), 'false');
  assert.match(find('#tokyo-sightline-traffic').textContent, /通信/);
  await near(true); await near(false); await near(true);
  assert.equal(calls, 0);
  assert.equal(dom.window.document.head.querySelector('script'), null);
  find('[data-tokyo-open]').click();
  await tick();
  assert.equal(calls, 1);
  assert.equal(find('#tokyo-sightline-model').hidden, false);
  assert.equal(find('[data-tokyo-open]').getAttribute('aria-expanded'), 'true');
  assert.equal(find('[data-tokyo-reset]').disabled, false);
});

test('all four scenes update the photo, explanatory text and pressed state before loading 3D', async t => {
  let calls = 0, initialScene;
  const { find, all } = await setup(t, async (_host, options) => {
    calls++; initialScene = options.scene.id;
    return { destroy() {}, setScene() {} };
  });
  for (const index of [0, 1, 2, 3]) {
    const scene = TOKYO_SCENES[index];
    find(`[data-tokyo-scene="${index}"]`).click();
    assert.equal(find('[data-tokyo-photo]').src, `https://example.com/images/${scene.photo}`);
    assert.equal(find('[data-tokyo-photo]').alt, scene.alt);
    assert.equal(find('[data-tokyo-caption]').textContent, `${scene.date}・${scene.seat}／撮影：道草`);
    assert.equal(find('[data-tokyo-note]').textContent, scene.note);
    assert.equal(find('[data-tokyo-distance]').textContent, `推定撮影位置から約${scene.distanceKm}km`);
    assert.deepEqual(all('[data-tokyo-scene]').map(button => button.getAttribute('aria-pressed')),
      TOKYO_SCENES.map((_scene, i) => String(i === index)));
    assert.equal(calls, 0);
    assert.equal(find('#tokyo-sightline-model').hidden, true);
  }
  find('[data-tokyo-open]').click();
  await tick();
  assert.equal(initialScene, 'toranomon');
});

test('changing scenes reuses the existing stage through setScene', async t => {
  let calls = 0, destroyed = 0;
  const selected = [];
  const { find } = await setup(t, async () => {
    calls++;
    return { destroy() { destroyed++; }, setScene(scene) { selected.push(scene.id); } };
  });
  find('[data-tokyo-open]').click(); await tick();
  for (const index of [1, 2, 0]) find(`[data-tokyo-scene="${index}"]`).click();
  assert.equal(calls, 1);
  assert.equal(destroyed, 0);
  assert.deepEqual(selected, ['tower', 'bridge', 'station', 'tower']);
});

test('a pending factory applies the most recently selected scene when it resolves', async t => {
  let finish, calls = 0, initialScene;
  const selected = [];
  const { find } = await setup(t, (_host, options) => {
    calls++; initialScene = options.scene.id;
    return new Promise(resolve => { finish = resolve; });
  });
  find('[data-tokyo-open]').click(); await tick();
  assert.equal(find('[data-tokyo-open]').disabled, true);
  find('[data-tokyo-scene="2"]').click();
  find('[data-tokyo-scene="1"]').click();
  finish({ destroy() {}, setScene(scene) { selected.push(scene.id); } });
  await tick();
  assert.equal(initialScene, 'tower');
  assert.equal(calls, 1);
  assert.deepEqual(selected, ['bridge']);
  assert.equal(find('[data-tokyo-scene="1"]').getAttribute('aria-pressed'), 'true');
  assert.equal(find('[data-tokyo-photo]').alt, TOKYO_SCENES[1].alt);
  assert.equal(find('[data-tokyo-open]').hidden, true);
});

test('a factory resolving after pagehide is destroyed without attaching or enabling controls', async t => {
  let finish, destroyed = 0, scenesApplied = 0;
  const { dom, find } = await setup(t, () => new Promise(resolve => { finish = resolve; }));
  find('[data-tokyo-open]').click(); await tick();
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));
  finish({ destroy() { destroyed++; }, setScene() { scenesApplied++; } });
  await tick();
  assert.equal(destroyed, 1);
  assert.equal(scenesApplied, 0);
  assert.equal(find('#tokyo-sightline-model').hidden, true);
  assert.equal(find('[data-tokyo-open]').getAttribute('aria-expanded'), 'false');
  assert.equal(find('[data-tokyo-open]').hidden, false);
  assert.equal(find('[data-tokyo-open]').disabled, false);
  assert.equal(find('[data-tokyo-reset]').disabled, true);
});

test('offscreen and hidden stages pause; BFCache return requires a fresh explicit open', async t => {
  const active = [], sessions = [];
  let destroyed = 0;
  const { dom, find, near, hidden } = await setup(t, async (_host, options) => {
    sessions.push(options);
    return { destroy() { destroyed++; }, setScene() {}, setActive(value) { active.push(value); } };
  });
  find('[data-tokyo-open]').click(); await tick();
  assert.equal(active.at(-1), false);
  await near(true); assert.equal(active.at(-1), true);
  await near(false); assert.equal(active.at(-1), false);
  await near(true); hidden(true); assert.equal(active.at(-1), false);
  hidden(false); assert.equal(active.at(-1), true);
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));
  assert.equal(destroyed, 1);
  dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pageshow', { persisted: true }));
  await near(true);
  assert.equal(sessions.length, 1);
  assert.equal(find('#tokyo-sightline-model').hidden, true);
  find('[data-tokyo-open]').click(); await tick();
  assert.equal(sessions.length, 2);
  sessions[0].onError(new Error('stale failure'));
  assert.equal(destroyed, 1);
  assert.equal(find('[data-tokyo-reset]').disabled, false);
});

test('failure preserves photos and article, retries only manually, and uses the latest scene', async t => {
  let calls = 0;
  const selected = [];
  const { find, near } = await setup(t, async (_host, options) => {
    selected.push(options.scene.id);
    if (++calls === 1) throw new Error('offline');
    return { destroy() {}, setScene() {} };
  });
  await near(true); find('[data-tokyo-open]').click(); await tick();
  assert.match(find('[data-tokyo-status]').textContent, /読み込めませんでした/);
  assert.equal(find('#story').textContent, '本文');
  assert.equal(find('[data-tokyo-photo]').alt, TOKYO_SCENES[0].alt);
  assert.equal(find('[data-tokyo-reset]').disabled, true);
  assert.equal(find('[data-tokyo-open]').disabled, false);
  await near(false); await near(true);
  find('[data-tokyo-scene="2"]').click();
  assert.equal(calls, 1);
  assert.equal(find('[data-tokyo-photo]').alt, TOKYO_SCENES[2].alt);
  find('[data-tokyo-open]').click(); await tick();
  assert.equal(calls, 2);
  assert.deepEqual(selected, ['tower', 'station']);
  assert.equal(find('[data-tokyo-reset]').disabled, false);
});

test('a live-stage error disposes that stage and does not affect the replacement session', async t => {
  const sessions = [];
  let destroyed = 0;
  const { find } = await setup(t, async (_host, options) => {
    sessions.push(options);
    return { destroy() { destroyed++; }, setScene() {} };
  });
  find('[data-tokyo-open]').click(); await tick();
  sessions[0].onError(new Error('render failure'));
  assert.equal(destroyed, 1);
  assert.equal(find('[data-tokyo-reset]').disabled, true);
  assert.equal(find('[data-tokyo-open]').hidden, false);
  find('[data-tokyo-open]').click(); await tick();
  sessions[0].onError(new Error('late error from disposed stage'));
  assert.equal(sessions.length, 2);
  assert.equal(destroyed, 1);
  assert.equal(find('[data-tokyo-reset]').disabled, false);
});

test('data saver, slow connections and missing IntersectionObserver still require an explicit open', async t => {
  for (const options of [
    { connection: { saveData: true } }, { connection: { effectiveType: '2g' } },
    { connection: { effectiveType: 'slow-2g' } }, { intersectionObserver: false }
  ]) {
    let calls = 0;
    const { find, near } = await setup(t, async () => {
      calls++;
      return { destroy() {}, setScene() {} };
    }, options);
    if (options.intersectionObserver !== false) await near(true);
    assert.equal(calls, 0);
    assert.equal(find('[data-tokyo-open]').hidden, false);
    find('[data-tokyo-open]').click(); await tick();
    assert.equal(calls, 1);
  }
});

test('reset, zoom and handled keyboard commands reach the active stage', async t => {
  let resets = 0;
  const zooms = [], keys = [];
  const { dom, find } = await setup(t, async () => ({
    destroy() {}, setScene() {}, resetView() { resets++; },
    zoom(value) { zooms.push(value); },
    key(value) { keys.push(value); return value === 'ArrowLeft'; }
  }));
  find('[data-tokyo-open]').click(); await tick();
  find('[data-tokyo-reset]').click();
  find('[data-tokyo-zoom="in"]').click();
  find('[data-tokyo-zoom="out"]').click();
  const arrow = new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true });
  const tab = new dom.window.KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
  find('[data-tokyo-stage]').dispatchEvent(arrow);
  find('[data-tokyo-stage]').dispatchEvent(tab);
  assert.equal(resets, 1);
  assert.deepEqual(zooms, [1, -1]);
  assert.deepEqual(keys, ['ArrowLeft', 'Tab']);
  assert.equal(arrow.defaultPrevented, true);
  assert.equal(tab.defaultPrevented, false);
});


test('the short Mori Tower clip loads only after its details opens, and stops on scene changes', async t => {
  const {dom,find}=await setup(t,async()=>({destroy(){},setScene(){}}));
  const video=find('[data-tokyo-video]'),clip=find('[data-tokyo-clip]');let paused=0,loads=0;
  video.pause=()=>{paused++;};video.load=()=>{loads++;};
  assert.equal(clip.hidden,true);assert.equal(video.hasAttribute('src'),false);
  find('[data-tokyo-scene="3"]').click();assert.equal(clip.hidden,false);assert.equal(video.hasAttribute('src'),false);
  clip.open=true;clip.dispatchEvent(new dom.window.Event('toggle'));
  assert.match(video.src,/videos\/20261010_toranomon-hills-mori-tower_124-128_michikusa.mp4$/);
  assert.equal(video.autoplay,false);assert.equal(video.preload,'none');
  find('[data-tokyo-scene="1"]').click();assert.equal(clip.open,false);assert.equal(clip.hidden,true);assert.equal(video.hasAttribute('src'),false);assert(paused>0);assert.equal(loads,1);
});

test('closing a clip or hiding the document pauses it, and pagehide releases its source', async t => {
  const {dom,find,hidden}=await setup(t,async()=>({destroy(){},setScene(){}}));const v=find('[data-tokyo-video]'),c=find('[data-tokyo-clip]');let pauses=0;
  v.pause=()=>{pauses++;};v.load=()=>{};
  find('[data-tokyo-scene="3"]').click();c.open=true;c.dispatchEvent(new dom.window.Event('toggle'));
  c.open=false;c.dispatchEvent(new dom.window.Event('toggle'));assert(pauses>0);
  hidden(true);assert(pauses>1);dom.window.dispatchEvent(new dom.window.Event('pagehide'));assert.equal(v.hasAttribute('src'),false);
});
