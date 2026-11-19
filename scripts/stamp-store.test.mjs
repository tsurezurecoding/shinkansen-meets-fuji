import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import locales from "../locales.js";
import { readSiteSource } from "./shared/site-chrome.mjs";
import { withStoryWindowLinks } from "./shared/story-window.mjs";
import { withUtilityLocales } from "./shared/utility-locales.mjs";

const root = new URL("../", import.meta.url);
const storeScript = fs.readFileSync(new URL("data/stamp-store.js", root), "utf8");
const key = "mado-stamps";

test("field guide and stamp book authored pages agree with their templates", () => {
  const appDir = fileURLToPath(root);
  for (const file of ["zukan.html", "journal.html", "en/journal.html"]) {
    const source = withStoryWindowLinks(readSiteSource(appDir, file), file, appDir);
    assert.equal(withUtilityLocales(source, file), fs.readFileSync(new URL(file, root), "utf8"), file);
  }
});

function tab(storage, locks) {
  const window = { navigator: { locks }, localStorage: storage };
  vm.runInNewContext(storeScript, { window });
  return window.MadoStamps;
}

function sharedStorage(stamps) {
  const items = new Map([[key, JSON.stringify(stamps)]]);
  return { getItem: (name) => items.get(name) ?? null, setItem: (name, value) => items.set(name, value) };
}

const done = () => {};

test("two open tabs append and remove only their own IDs, including legacy 727 IDs", () => {
  const storage = sharedStorage({ "727-legacy": 9, kiyosu: 11 });
  const a = tab(storage), b = tab(storage);
  a.read(); b.read();
  a.toggle(["fuji"], done);
  b.toggle(["hamanako"], done);
  b.toggle(["727-board", "727-legacy"], done);
  const saved = tab(storage).read();
  assert.deepEqual(Object.keys(saved).sort(), ["fuji", "hamanako", "kiyosu"]);
  assert.equal(saved.kiyosu, 11);
  a.clear(done);
  b.toggle(["hirakata-park-wheel"], done);
  assert.deepEqual(Object.keys(tab(storage).read()), ["hirakata-park-wheel"]);
});

test("overlapping updates on two pages use the same exclusive lock and preserve both writes", async () => {
  let tail = Promise.resolve();
  const names = [];
  const locks = { request(name, write) { names.push(name); tail = tail.then(write); return tail; } };
  const storage = sharedStorage({ kiyosu: 11 });
  const a = tab(storage, locks), b = tab(storage, locks);
  await Promise.all([a.toggle(["fuji"], done), b.toggle(["hamanako"], done)]);
  assert.deepEqual(names, [key, key]);
  assert.deepEqual(Object.keys(tab(storage).read()).sort(), ["fuji", "hamanako", "kiyosu"]);
});

test("a tab can keep recording in memory when persistent storage is unavailable", () => {
  const store = tab({ getItem() { return null; }, setItem() { throw Error("unavailable"); } });
  store.toggle(["fuji"], done);
  store.toggle(["hamanako"], done);
  assert.deepEqual(Object.keys(store.read()).sort(), ["fuji", "hamanako"]);
});

test("every language loads the same local store before its stamp controls", () => {
  const consumers = { "start.html": "app.js", "journal.html": "app.js", "zukan.html": "app.js",
    "727-collection.html": "727-collection.js", "ferris-wheels.html": "ferris-wheels.js" };
  for (const lang of locales.languages) {
    for (const [route, consumer] of Object.entries(consumers)) {
      const file = new URL((lang === "ja" ? "" : lang + "/") + route, root);
      const html = fs.readFileSync(file, "utf8");
      const base = new URL(html.match(/<base\b[^>]*\bhref=["']([^"']+)["']/i)?.[1] ?? "", file);
      const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
        .map(([, src]) => new URL(src, base).pathname);
      const store = new URL("data/stamp-store.js", root).pathname;
      const consumerPath = new URL(consumer, root).pathname;
      assert.equal(scripts.filter(url => url === store).length, 1, file.pathname);
      assert.ok(scripts.indexOf(store) < scripts.indexOf(consumerPath), file.pathname);
      if (["start.html", "zukan.html", "journal.html"].includes(route)) {
        const needsTrains = route === "start.html";
        const timetable = new URL("data/timetable.js", root).pathname;
        assert.equal(/\bdata-train-picker\b/.test(html), needsTrains, file.pathname);
        assert.equal(scripts.filter(url => url === timetable).length, needsTrains ? 1 : 0, file.pathname);
      }
    }
  }
});
