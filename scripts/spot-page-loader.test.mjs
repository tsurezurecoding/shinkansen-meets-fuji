import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const loaderSource = fs.readFileSync(
  fileURLToPath(new URL("../spot-page-loader.js", import.meta.url)),
  "utf8",
);

function createHarness({
  protocol = "https:",
  manifest,
  manifestError,
  failFile = "",
  lang = "ja",
  scriptSrc = "https://example.test/assets/spot-page-loader.js",
} = {}) {
  const events = [];
  const shellReveals = [];
  const fetchCalls = [];
  const host = { textContent: "" };
  const document = {
    currentScript: { src: scriptSrc },
    getElementById(id) {
      return id === 'spot-page-boot-style' ? { remove() { shellReveals.push(events.map(e => new URL(e.url).pathname.split('/').pop())); } } : null;
    },
    documentElement: { lang },
    createElement(tagName) {
      return { tagName, onload: null, onerror: null };
    },
    head: {
      appendChild(element) {
        const url = element.tagName === "link" ? element.href : element.src;
        events.push({ tagName: element.tagName, url });
        const file = new URL(url).pathname.split("/").pop();
        if (file === failFile) {
          element.onerror(new Error(`failed to load ${file}`));
        } else {
          element.onload();
        }
      },
    },
    querySelector(selector) {
      return selector === '[data-spot-page-shared-module="page"]' ? host : null;
    },
  };
  const context = {
    document,
    location: { protocol },
    URL,
    Promise,
    console,
    window: {},
    fetch(url, options) {
      fetchCalls.push({ url, options });
      if (manifestError) return Promise.reject(manifestError);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(manifest || { files: [] }),
      });
    },
  };

  vm.runInNewContext(loaderSource, context, { filename: "spot-page-loader.js" });
  return { context, events, fetchCalls, host, shellReveals };
}

function assetUrls(events) {
  return events.map(({ url }) => url);
}

test("uses only allowlisted manifest hashes and loads CSS before renderer, gallery, and map", async () => {
  const validA = "a".repeat(64);
  const validB = "b".repeat(64);
  const validC = "c".repeat(64);
  const validD = "d".repeat(64);
  const harness = createHarness({
    manifest: {
      files: [
        { path: "style.css", sha256: validA },
        { path: "spot-media-gallery.css", sha256: "E".repeat(64) },
        { path: "spot-page-shared.js", sha256: validB },
        { path: "spot-media-gallery.js", sha256: validC },
        { path: "spot-map.js", sha256: validD },
        { path: "https://evil.example/spot-map.js", sha256: validA },
        { path: "../spot-page-shared.js", sha256: validA },
        { path: "./style.css", sha256: validA },
        { path: "style.css", sha256: "f".repeat(63) },
        { path: "unknown.js", sha256: validA },
      ],
    },
  });

  await harness.context.window.MADO_SPOT_PAGE_READY;

  assert.deepEqual(assetUrls(harness.events), [
    "https://example.test/assets/style.css?v=aaaaaaaa",
    "https://example.test/assets/spot-media-gallery.css",
    "https://example.test/assets/spot-page-shared.js?v=bbbbbbbb",
    "https://example.test/assets/spot-media-gallery.js?v=cccccccc",
    "https://example.test/assets/spot-map.js?v=dddddddd",
  ]);
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.fetchCalls[0].url, "https://example.test/assets/content-manifest.json");
  assert.equal(harness.fetchCalls[0].options.cache, "no-cache");
});

test("falls back to unversioned assets when the manifest fetch fails", async () => {
  const harness = createHarness({ manifestError: new Error("offline") });

  await assert.doesNotReject(harness.context.window.MADO_SPOT_PAGE_READY);

  assert.deepEqual(assetUrls(harness.events), [
    "https://example.test/assets/style.css",
    "https://example.test/assets/spot-media-gallery.css",
    "https://example.test/assets/spot-page-shared.js",
    "https://example.test/assets/spot-media-gallery.js",
    "https://example.test/assets/spot-map.js",
  ]);
  assert.equal(harness.host.textContent, "");
});

test("shows the Japanese fallback when a required script fails", async () => {
  const harness = createHarness({ failFile: "spot-page-shared.js" });

  await assert.doesNotReject(harness.context.window.MADO_SPOT_PAGE_READY);

  assert.deepEqual(assetUrls(harness.events), [
    "https://example.test/assets/style.css",
    "https://example.test/assets/spot-media-gallery.css",
    "https://example.test/assets/spot-page-shared.js",
  ]);
  assert.equal(harness.host.textContent, "ページを読み込めませんでした。再読み込みしてください。");
});

test("does not fetch the manifest for file URLs", async () => {
  const harness = createHarness({
    protocol: "file:",
    scriptSrc: "file:///C:/site/spot-page-loader.js",
  });

  await assert.doesNotReject(harness.context.window.MADO_SPOT_PAGE_READY);

  assert.equal(harness.fetchCalls.length, 0);
  assert.deepEqual(assetUrls(harness.events), [
    "file:///C:/site/style.css",
    "file:///C:/site/spot-media-gallery.css",
    "file:///C:/site/spot-page-shared.js",
    "file:///C:/site/spot-media-gallery.js",
    "file:///C:/site/spot-map.js",
  ]);
});

test("reveals static shell only once the styled article renderer has loaded", async () => {
  const harness = createHarness();
  await harness.context.window.MADO_SPOT_PAGE_READY;
  assert.deepEqual(harness.shellReveals, [['style.css', 'spot-media-gallery.css', 'spot-page-shared.js']]);
});

test("reveals fallback navigation when loading fails", async () => {
  const harness = createHarness({ failFile: 'style.css' });
  await harness.context.window.MADO_SPOT_PAGE_READY;
  assert.equal(harness.shellReveals.length, 1);
  assert.ok(harness.host.textContent.includes('再読み込み'));
});
