import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// The override lets this regression run against a candidate before installation.
const appRoot = process.env.MADO_TEST_ROOT
  ? path.resolve(process.env.MADO_TEST_ROOT)
  : fileURLToPath(new URL("../", import.meta.url));
const requireFromApp = createRequire(path.join(appRoot, "package.json"));
const { JSDOM } = requireFromApp("jsdom");
const read = (file) => fs.readFileSync(path.join(appRoot, file), "utf8");
const sharedSource = read("spot-map.js");
const collectionSource = read("727-collection.js");
const leafletSource = read("vendor/leaflet/leaflet.js");
const leafletStyles = read("vendor/leaflet/leaflet.css");
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

function observe(promise) {
  const state = { status: "pending" };
  promise.then(
    (value) => { state.status = "fulfilled"; state.value = value; },
    (error) => { state.status = "rejected"; state.error = error; },
  );
  return state;
}

function fakeLeaflet() {
  const calls = { map: 0 };
  const map = {
    setView() { return this; },
    invalidateSize() {},
    fitBounds() {},
  };
  return {
    calls,
    map() { calls.map += 1; return map; },
    tileLayer() { return { addTo() {} }; },
  };
}

function harness(t, { lang = "ja", collection = false, dpr = 1 } = {}) {
  const pageUrl = `https://example.test/${lang === "en" ? "en/" : ""}727-collection.html`;
  const dom = new JSDOM(
    `<!doctype html><html lang="${lang}"><head></head><body class="collection-727-page"><div id="collectionMap"></div></body></html>`,
    { url: pageUrl, runScripts: "outside-only" },
  );
  t.after(() => dom.window.close());
  const { window } = dom;
  const { document } = window;
  Object.defineProperty(window, "devicePixelRatio", { value: dpr, configurable: true });
  window.requestAnimationFrame = (callback) => callback();
  window.BOARD_COLLECTION = [];
  const scriptUrl = collection
    ? "https://example.test/727-collection.js?v=fixture"
    : "https://example.test/assets/spot-map.js?v=fixture";
  const currentScript = document.createElement("script");
  currentScript.src = scriptUrl;
  Object.defineProperty(document, "currentScript", { get: () => currentScript });
  const context = dom.getInternalVMContext();
  function evaluate(source, filename) {
    vm.runInContext(source, context, { filename });
  }
  function link() { return document.querySelector('link[rel="stylesheet"]'); }
  function script() { return document.querySelector('script[src*="leaflet.js"]'); }
  function finishCss({ fail = false } = {}) {
    assert.ok(link(), "loader must request its stylesheet");
    if (!fail) {
      // JSDOM does not resolve CSS-relative background URLs as browsers do.
      // Absolutize the actual vendored stylesheet before applying its load event.
      const style = document.createElement("style");
      style.textContent = leafletStyles.replace(/url\(([^)]+)\)/g, (match, value) => {
        const relative = value.trim().replace(/^['"]|['"]$/g, "");
        return `url("${new URL(relative, link().href).href}")`;
      });
      document.head.appendChild(style);
    }
    link().dispatchEvent(new window.Event(fail ? "error" : "load"));
  }
  function finishJs({ fail = false, real = false, value = fakeLeaflet() } = {}) {
    assert.ok(script(), "loader must request its script");
    if (!fail) {
      if (real) evaluate(leafletSource, "vendor/leaflet/leaflet.js");
      else window.L = value;
    }
    script().dispatchEvent(new window.Event(fail ? "error" : "load"));
    return window.L;
  }
  return {
    window, document, evaluate, link, script, finishCss, finishJs,
    startShared() {
      evaluate(sharedSource, "spot-map.js");
      return window.MADO_LEAFLET.load();
    },
    startCollection() { evaluate(collectionSource, "727-collection.js"); },
  };
}

test("shared loader waits for CSS after JS and reuses readiness while L is already global", async (t) => {
  const h = harness(t);
  const ready = h.startShared();
  const state = observe(ready);
  const L = h.finishJs();
  await nextTurn();
  assert.equal(state.status, "pending", "JS availability alone must not permit marker creation");
  assert.strictEqual(h.window.MADO_LEAFLET.load(), ready, "a global L must not bypass the CSS readiness promise");
  assert.equal(h.document.querySelectorAll('link[rel="stylesheet"]').length, 1);
  assert.equal(h.document.querySelectorAll('script[src*="leaflet.js"]').length, 1);
  h.finishCss();
  assert.strictEqual(await ready, L);
});

test("shared loader waits for JS when CSS arrives first", async (t) => {
  const h = harness(t);
  const ready = h.startShared();
  const state = observe(ready);
  h.finishCss();
  await nextTurn();
  assert.equal(state.status, "pending");
  const L = h.finishJs();
  assert.strictEqual(await ready, L);
});

test("shared loader rejects a stylesheet failure instead of returning a usable map API", async (t) => {
  const h = harness(t);
  const ready = h.startShared();
  const rejected = assert.rejects(ready);
  h.finishCss({ fail: true });
  h.finishJs();
  await rejected;
  assert.strictEqual(h.window.MADO_LEAFLET.load(), ready, "an available L must not hide a cached CSS failure");
});

test("shared loader rejects a script failure after CSS succeeds", async (t) => {
  const h = harness(t);
  const ready = h.startShared();
  const rejected = assert.rejects(ready);
  h.finishCss();
  h.finishJs({ fail: true });
  await rejected;
});

test("727 honors shared readiness even when the Leaflet global already exists", async (t) => {
  const h = harness(t, { collection: true });
  const L = fakeLeaflet();
  h.window.L = L;
  let release;
  let sharedCalls = 0;
  const readiness = new Promise((resolve) => { release = resolve; });
  h.window.MADO_LEAFLET = { load() { sharedCalls += 1; return readiness; } };
  h.startCollection();
  await nextTurn();
  assert.equal(sharedCalls, 1, "727 must defer to the shared loader's readiness contract");
  assert.equal(L.calls.map, 0, "727 must not initialize its map while shared CSS is pending");
  release(L);
  await nextTurn();
  assert.equal(L.calls.map, 1);
  assert.equal(h.document.getElementById("collectionMap").classList.contains("is-map-fallback"), false);
});

for (const lang of ["ja", "en"]) {
  test(`727 standalone ${lang} loader uses root assets and waits for CSS`, async (t) => {
    const h = harness(t, { lang, collection: true });
    h.startCollection();
    assert.equal(h.link()?.href, "https://example.test/vendor/leaflet/leaflet.css");
    assert.equal(h.script()?.src, "https://example.test/vendor/leaflet/leaflet.js");
    const L = h.finishJs();
    await nextTurn();
    assert.equal(L.calls.map, 0, "standalone JS arrival must not start the map before CSS");
    h.finishCss();
    await nextTurn();
    assert.equal(L.calls.map, 1);
    assert.equal(h.document.getElementById("collectionMap").classList.contains("is-map-fallback"), false);
  });
}

for (const dpr of [1, 2]) {
  test(`real Leaflet DPR ${dpr} resolves canonical marker and shadow images after delayed CSS`, async (t) => {
    const h = harness(t, { dpr });
    const ready = h.startShared();
    let images;
    const created = ready.then((L) => {
      const icon = new L.Icon.Default();
      images = { icon: icon.createIcon().src, shadow: icon.createShadow().src };
    });
    h.finishJs({ real: true });
    await nextTurn();
    assert.equal(images, undefined, "callers must not reach Icon.Default before its path CSS is ready");
    h.finishCss();
    await created;
    const base = "https://example.test/assets/vendor/leaflet/images/";
    assert.equal(images.icon, `${base}marker-icon${dpr === 2 ? "-2x" : ""}.png`);
    assert.equal(images.shadow, `${base}marker-shadow.png`);
  });
}
