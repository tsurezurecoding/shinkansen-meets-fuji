import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { RUNTIME_ASSETS, RUNTIME_SCHEMA } from './generate-spot-page-runtime.mjs';

const loaderSource = fs.readFileSync(new URL('../spot-page-loader.js', import.meta.url), 'utf8');
const manifestFixture = () => ({
  schema: RUNTIME_SCHEMA, version: 1,
  assets: Object.fromEntries(RUNTIME_ASSETS.map((file, index) => [file, String(index + 1).repeat(64)])),
});

function createHarness({
  protocol = 'https:', manifest = manifestFixture(), manifestError,
  responseOK = true, failFiles = [], lang = 'ja', autoLoad = true,
  rendered = true, catalogLoaded = false,
  scriptSrc = 'https://example.test/assets/spot-page-loader.js',
} = {}) {
  const events = [], loaded = [], executions = [], shellReveals = [], fetchCalls = [];
  const host = {
    innerHTML: '<h1>Existing title</h1><p>Existing lead</p><a href="../start.html">Start</a>',
    children: [], appendChild(element) { this.children.push(element); },
  };
  const originalFallback = host.innerHTML;
  let bootPresent = true, executionIndex = 0;
  const pendingScripts = [];
  const context = {
    location: { protocol }, URL, Promise, console,
    window: catalogLoaded ? { MADO_SPOT_PAGE_SHARED_DATA: {} } : {},
    fetch(url, options) {
      fetchCalls.push({ url, options });
      if (manifestError) return Promise.reject(manifestError);
      return Promise.resolve({ ok: responseOK, json: () => Promise.resolve(manifest) });
    },
  };
  // Model ordered classic-script execution with independently finishing downloads.
  function flushScripts() {
    while (pendingScripts[executionIndex]?.complete) {
      const event = pendingScripts[executionIndex++];
      if (event.failed) { event.element.onerror(); continue; }
      executions.push(event.file);
      if (event.file === 'spot-page-shared-data.js') context.window.MADO_SPOT_PAGE_SHARED_DATA = {};
      if (event.file === 'spot-page-shared.js') context.window.MADO_SPOT_PAGE_RENDERED = rendered && !!context.window.MADO_SPOT_PAGE_SHARED_DATA;
      event.element.onload();
    }
  }
  function finish(file, success = !failFiles.includes(file)) {
    const event = events.find((item) => item.file === file);
    assert.ok(event, `asset was inserted: ${file}`);
    assert.equal(event.complete, false, `asset completes once: ${file}`);
    event.complete = true; event.failed = !success; loaded.push(file);
    if (event.tagName === 'script') flushScripts();
    else if (success) event.element.onload();
    else event.element.onerror();
  }
  context.document = {
    currentScript: { src: scriptSrc }, documentElement: { lang },
    getElementById(id) {
      return id === 'spot-page-boot-style' && bootPresent ? {
        remove() { bootPresent = false; shellReveals.push({ loaded: [...loaded], executed: [...executions] }); },
      } : null;
    },
    createElement(tagName) { return { tagName }; },
    head: { appendChild(element) {
      const url = element.tagName === 'link' ? element.href : element.src;
      const file = new URL(url).pathname.split('/').pop();
      const event = { tagName: element.tagName, url, file, element, complete: false };
      events.push(event);
      if (element.tagName === 'script') pendingScripts.push(event);
      if (autoLoad) Promise.resolve().then(() => finish(file));
    } },
    querySelector(selector) { return selector === '[data-spot-page-shared-module="page"]' ? host : null; },
  };
  vm.runInNewContext(loaderSource, context, { filename: 'spot-page-loader.js' });
  return { context, events, fetchCalls, host, originalFallback, shellReveals, finish, executions };
}
async function flush() { for (let index = 0; index < 12; index += 1) await Promise.resolve(); }
function assertRelativeAssets(harness, versioned = false, base = 'https://example.test/assets/') {
  assert.deepEqual(harness.events.map(({ url }) => url), RUNTIME_ASSETS.map((file, index) =>
    base + file + (versioned ? `?v=${String(index + 1).repeat(8)}` : '')));
}

test('loads only fixed assets from the small no-cache runtime manifest', async () => {
  const harness = createHarness();
  await harness.context.window.MADO_SPOT_PAGE_READY;
  assertRelativeAssets(harness, true);
  assert.deepEqual(harness.events.map(({ tagName }) => tagName), ['link', 'link', 'script', 'script', 'script', 'script']);
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.fetchCalls[0].url, 'https://example.test/assets/spot-page-runtime.json');
  assert.equal(harness.fetchCalls[0].options.cache, 'no-cache');
});

test('inserts downloads together and executes catalog, renderer, gallery, map in order', async () => {
  const harness = createHarness({ autoLoad: false });
  await flush();
  assert.equal(harness.events.length, 6, 'no completed download is needed to start the others');
  assert.ok(harness.events.filter(({ tagName }) => tagName === 'script').every(({ element }) => element.async === false));
  for (const file of ['spot-map.js', 'spot-media-gallery.js', 'spot-page-shared.js']) harness.finish(file);
  assert.deepEqual(harness.executions, [], 'later scripts wait for the catalog');
  harness.finish('spot-page-shared-data.js');
  await flush();
  assert.deepEqual(harness.executions, [...RUNTIME_ASSETS.slice(2)]);
  assert.equal(harness.shellReveals.length, 0, 'rendered article stays hidden while CSS is pending');
  harness.finish('style.css');
  await flush();
  assert.equal(harness.shellReveals.length, 0, 'both stylesheets must finish');
  harness.finish('spot-media-gallery.css');
  await harness.context.window.MADO_SPOT_PAGE_READY;
  assert.equal(harness.shellReveals.length, 1);
});

test('reveals the styled article before optional enhancement downloads finish', async () => {
  const harness = createHarness({ autoLoad: false });
  await flush();
  for (const file of RUNTIME_ASSETS.slice(0, 4)) harness.finish(file);
  await harness.context.window.MADO_SPOT_PAGE_READY;
  assert.equal(harness.shellReveals.length, 1);
  assert.deepEqual(harness.shellReveals[0].executed, ['spot-page-shared-data.js', 'spot-page-shared.js']);
  harness.finish('spot-media-gallery.js'); harness.finish('spot-map.js');
  await flush();
});

test('rejects malformed schema, hashes, and unsafe paths without loading manifest URLs', async () => {
  const missing = manifestFixture(); delete missing.assets['style.css'];
  const invalidHash = manifestFixture(); invalidHash.assets['style.css'] = 'A'.repeat(64);
  const objectHash = manifestFixture(); objectHash.assets['style.css'] = { url: 'https://evil.test/style.css' };
  const unsafe = ['https://evil.test/spot-map.js', '//evil.test/style.css', '../style.css', './style.css', 'style.css?x=1', 'style.css#x', '__proto__'];
  const fixtures = [null, [], {}, { files: [] }, { ...manifestFixture(), schema: 'wrong' },
    { ...manifestFixture(), version: 2 }, { ...manifestFixture(), assets: [] }, missing, invalidHash, objectHash,
    ...unsafe.map((file) => {
      const fixture = manifestFixture(); delete fixture.assets['spot-map.js'];
      Object.defineProperty(fixture.assets, file, { value: 'a'.repeat(64), enumerable: true });
      return fixture;
    })];
  for (const manifest of fixtures) {
    const harness = createHarness({ manifest });
    await harness.context.window.MADO_SPOT_PAGE_READY;
    assertRelativeAssets(harness);
    assert.equal(harness.host.children.length, 0);
  }
});

test('uses relative fallback assets for manifest fetch and HTTP failures', async () => {
  for (const options of [{ manifestError: new Error('offline') }, { responseOK: false }]) {
    const harness = createHarness(options);
    await assert.doesNotReject(harness.context.window.MADO_SPOT_PAGE_READY);
    assertRelativeAssets(harness);
  }
});

test('never fetches a manifest from file URLs', async () => {
  const harness = createHarness({ protocol: 'file:', scriptSrc: 'file:///C:/site/spot-page-loader.js' });
  await harness.context.window.MADO_SPOT_PAGE_READY;
  assert.equal(harness.fetchCalls.length, 0);
  assertRelativeAssets(harness, false, 'file:///C:/site/');
});

test('keeps existing fallback title, lead and navigation on required-asset failures', async () => {
  for (const file of RUNTIME_ASSETS.slice(0, 4)) {
    const harness = createHarness({ failFiles: [file] });
    await assert.doesNotReject(harness.context.window.MADO_SPOT_PAGE_READY);
    assert.equal(harness.host.innerHTML, harness.originalFallback);
    assert.equal(harness.host.children.length, 1);
    assert.match(harness.host.children[0].textContent, /再読み込み/);
    assert.equal(harness.shellReveals.length, 1);
  }
});

test('treats renderer failure as fatal even if the script downloaded successfully', async () => {
  const harness = createHarness({ rendered: false, lang: 'en' });
  await harness.context.window.MADO_SPOT_PAGE_READY;
  assert.equal(harness.host.innerHTML, harness.originalFallback);
  assert.match(harness.host.children[0].textContent, /Unable to load/);
});

test('handles later script failures after an early CSS failure without dropping fallback or rejecting readiness', async () => {
  const harness = createHarness({ autoLoad: false });
  await flush();
  harness.finish('style.css', false);
  await assert.doesNotReject(harness.context.window.MADO_SPOT_PAGE_READY);
  assert.equal(harness.host.innerHTML, harness.originalFallback);
  assert.equal(harness.shellReveals.length, 1);
  harness.finish('spot-media-gallery.css', false);
  for (const file of RUNTIME_ASSETS.slice(2)) harness.finish(file, false);
  await flush();
  assert.equal(harness.host.children.length, 1);
});

test('gallery or map failure preserves the usable article and allows the other enhancement', async () => {
  for (const file of RUNTIME_ASSETS.slice(4)) {
    const harness = createHarness({ failFiles: [file] });
    await assert.doesNotReject(harness.context.window.MADO_SPOT_PAGE_READY);
    assert.equal(harness.context.window.MADO_SPOT_PAGE_RENDERED, true);
    assert.equal(harness.host.children.length, 0);
    assert.equal(harness.shellReveals.length, 1);
    assert.ok(harness.executions.includes(file === 'spot-map.js' ? 'spot-media-gallery.js' : 'spot-map.js'));
  }
});

test('reuses an already loaded catalog on older HTML', async () => {
  const harness = createHarness({ catalogLoaded: true });
  await harness.context.window.MADO_SPOT_PAGE_READY;
  assert.deepEqual(harness.events.map(({ file }) => file), RUNTIME_ASSETS.filter((file) => file !== 'spot-page-shared-data.js'));
  assert.equal(harness.host.children.length, 0);
});
