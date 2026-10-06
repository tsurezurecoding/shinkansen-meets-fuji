import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  generateSpotPage,
  planSpotPage,
  writeChangedSpotPagePlans,
} from "./generate-spot-pages.mjs";

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
