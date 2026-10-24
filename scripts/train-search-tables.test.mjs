import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("all start editions keep selection and canonical without a static train URL directory", () => {
  for (const lang of ["ja", "en", "zh-Hant", "fr", "es", "de", "zh-Hans", "ko"]) {
    const prefix = lang === "ja" ? "" : lang + "/";
    const url = "https://www.michikusa-travel.com/" + prefix + "start.html";
    const view = new JSDOM(read(prefix + "start.html"), { url });
    try {
      const doc = view.window.document;
      assert.equal(doc.querySelectorAll(".train-search-directory, .ja-train-table").length, 0, lang);
      const trainLinks = [...doc.querySelectorAll("a[href]")].filter(a => new URL(a.href).searchParams.has("train"));
      assert.equal(trainLinks.length, 0, lang + ": no static train-parameter links");
      assert.ok(doc.getElementById("journey"), lang);
      assert.ok(doc.querySelector("[data-train-picker]"), lang);
      for (const file of ["app.js", "train-picker.js", "train-select.js"]) assert.ok([...doc.scripts].some(script => new URL(script.src, url).pathname.endsWith("/" + file)), lang + ": " + file);
      assert.equal(doc.querySelector('link[rel="canonical"]').href, url, lang);
      assert.ok(!doc.querySelector('meta[name="robots"][content*="noindex"]'), lang);
      assert.ok(!doc.querySelector("noscript").textContent.includes("list below"), lang);
    } finally { view.window.close(); }
  }
});

test("Fuji guides keep old timing anchors and send timing readers to the train selector", () => {
  for (const lang of ["ja", "en"]) {
    const prefix = lang === "en" ? "en/" : "";
    const view = new JSDOM(read(`${prefix}guide.html`), { url: `https://www.michikusa-travel.com/${prefix}guide.html` });
    try {
      const doc = view.window.document;
      assert.ok(doc.getElementById("trainTimes"));
      assert.ok(doc.getElementById("train-times"));
      assert.equal(doc.querySelectorAll("#trainTimes table").length, 0);
      for (const cta of ["hero_exact_time", "rail_exact_time", "rail_exact_time_bottom", "train_times_picker"]) {
        const link = doc.querySelector(`[data-guide-cta="${cta}"]`);
        assert.ok(link, `${lang}: ${cta}`);
        const url = new URL(link.href);
        assert.equal(url.pathname, `/${prefix}start.html`);
        assert.equal(url.searchParams.get("focus"), "fuji");
        assert.equal(url.hash, "#journey");
      }
    } finally {
      view.window.close();
    }
  }
});
