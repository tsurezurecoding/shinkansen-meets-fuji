import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import {
  generateSpotPage,
  planSpotPage,
  writeChangedSpotPagePlans,
} from "./generate-spot-pages.mjs";

test("English Fuji train table is static, matches Japanese times and selects real services", () => {
  const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const en = new JSDOM(read("en/guide.html"), { url: "https://www.michikusa-travel.com/en/guide.html", runScripts: "outside-only" });
  const ja = new JSDOM(read("guide.html")).window.document;
  const doc = en.window.document;
  const rows = [...doc.querySelectorAll("#trainTimes tbody tr")];
  const jaRows = [...ja.querySelectorAll("#trainTimes tbody tr")];
  assert.ok(rows.length > 500, "all train types and directions must be present without JS");
  assert.equal(rows.length, jaRows.length);
  assert.equal(doc.querySelectorAll("#trainTimes details").length, 6);
  assert.equal(doc.querySelector('link[rel="canonical"]').href, doc.URL);
  assert.ok(!doc.querySelector('meta[name="robots"]')?.content.includes("noindex"));
  assert.ok(!/[\u3040-\u30ff\u3400-\u9fff]/.test(doc.querySelector("#trainTimes").textContent));
  const context = { window: {} };
  vm.runInNewContext(read("data/timetable.js"), context);
  vm.runInNewContext(read("train-select.js"), context);
  const { ROUTE } = vm.runInNewContext(read("data.js") + "\n;({ROUTE});", {});
  const table = context.window.SHINKANSEN_TIMETABLE;
  const selection = context.window.MADO_TRAIN_SELECT;
  const keys = new Set();
  rows.forEach((row, index) => {
    const link = row.querySelector("a");
    const url = new URL(link.href);
    assert.equal(url.pathname, "/en/start.html");
    assert.equal(url.search, new URL(jaRows[index].querySelector("a").getAttribute("href"), doc.URL).search);
    assert.equal(row.dataset.fujiMin, jaRows[index].dataset.fujiMin);
    assert.equal(row.lastElementChild.textContent, jaRows[index].lastElementChild.textContent);
    const [type, number] = url.searchParams.get("train").split("-");
    const direction = url.searchParams.get("dir");
    const candidates = selection.trainCandidates(table, ROUTE, direction, url.searchParams.get("board"));
    assert.ok(candidates.some(({ tr }) => tr.type === type && String(tr.number) === number), link.textContent);
    const key = `${type}-${number}-${direction}`;
    assert.ok(!keys.has(key), `duplicate service ${key}`);
    keys.add(key);
    assert.equal(link.textContent, `${type} ${number}`);
  });
  const start = new JSDOM(read("en/start.html")).window.document;
  assert.equal(start.documentElement.lang, "en");
  assert.equal(start.querySelector('meta[name="robots"]').content, "noindex,follow");
  assert.equal(start.querySelector('link[rel="canonical"]'), null);
  en.window.eval(read("sun-window.js"));
  const sunScript = [...doc.scripts].find((script) => script.textContent.includes("var sun = window.MADO_SUN"));
  en.window.eval(sunScript.textContent);
  assert.ok(doc.querySelector('#trainTimes td[aria-label*="estimated"]'), "daylight labels must work in English");
  en.window.close();
});

test("unchanged spot page plans do not invoke the writer", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const writes = [];

  const changed = writeChangedSpotPagePlans([plan], (writtenPlan) => writes.push(writtenPlan));

  assert.deepEqual(changed, []);
  assert.deepEqual(writes, []);
});

test("generateSpotPage leaves an unchanged output timestamp untouched", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const before = fs.statSync(plan.outputPath).mtimeNs;

  const outputPath = generateSpotPage("tokyo-tower", "ja", { requireExisting: true });

  assert.equal(outputPath, plan.outputPath);
  assert.equal(fs.statSync(plan.outputPath).mtimeNs, before);
});

test("changed spot page plans still invoke the writer", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const writes = [];
  const changedPlan = { ...plan, generatedHTML: `${plan.generatedHTML}\n` };

  const changed = writeChangedSpotPagePlans([changedPlan], (writtenPlan) => writes.push(writtenPlan));

  assert.equal(changed.length, 1);
  assert.deepEqual(writes, [changedPlan]);
});

function renderedArticle(id, lang, embedded = false) {
  const plan = planSpotPage(id, lang);
  const dom = new JSDOM(plan.generatedHTML, { runScripts: "outside-only", url: `https://example.test/${lang === "en" ? "en/" : ""}spots/${id}.html` });
  dom.window.MADO_EMBEDDED_WEB = embedded;
  for (const relative of ["spot-page-shared-data.js", `data/spot-pages/${id}.${lang}.js`, "spot-page-shared.js"]) {
    dom.window.eval(fs.readFileSync(new URL(`../${relative}`, import.meta.url), "utf8"));
  }
  return dom;
}

test("English article additions stay out of Japanese pages", () => {
  for (const id of ["pocari-fukuroi", "shizuoka-tea-fields"]) {
    const dom = renderedArticle(id, "ja");
    assert.equal(dom.window.document.querySelector(".spot-page-story-figure"), null);
    assert.equal(dom.window.document.querySelector(".spot-page-story-link"), null);
    assert.equal(dom.window.document.querySelector('a[href="https://www.otsuka.co.jp/en/nutraceutical/products/pocarisweat/"]'), null);
    dom.window.close();
  }
});

test("Pocari story answers the drink question before the factory and uses an uncredited owner photo", () => {
  for (const embedded of [false, true]) {
    const dom = renderedArticle("pocari-fukuroi", "en", embedded);
    const document = dom.window.document;
    const story = document.querySelector(".spot-page-story-lead").closest("section");
    assert.equal(story.querySelector("h2").textContent, "What is Pocari Sweat?");
    assert.match(story.querySelector(".spot-page-story-lead > p").textContent, /^Pocari Sweat is a Japanese sports drink/);
    const figure = story.querySelector("figure");
    assert.equal(figure.dataset.photoOwner, "michikusa");
    assert.equal(figure.querySelector("img").getAttribute("src"), "../../images/drinks/20261004-pocari-michikusa.webp");
    assert.doesNotMatch(figure.textContent, /michikusa|Credit/);
    assert.equal(story.querySelector(".spot-page-story-link a").getAttribute("href"), "../../en/drinks.html#brand-pocari");
    dom.window.close();
  }
});

test("English tea fields link reaches the tea section of the drink guide", () => {
  const dom = renderedArticle("shizuoka-tea-fields", "en");
  assert.equal(dom.window.document.querySelector(".spot-page-story-link a").getAttribute("href"), "../../en/drinks.html#tea");
  dom.window.close();
});
