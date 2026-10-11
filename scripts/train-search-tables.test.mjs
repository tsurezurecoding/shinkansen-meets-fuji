import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { JSDOM, VirtualConsole } from "jsdom";
import { trainSearchTablesHTML } from "./shared/train-search-tables.mjs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("the bilingual number index opens real services at Fuji and preserves language", () => {
  const context = { window: {} };
  vm.runInNewContext(read("data/timetable.js"), context);
  vm.runInNewContext(read("train-select.js"), context);
  const { ROUTE } = vm.runInNewContext(read("data.js") + "\n;({ROUTE});", {});
  const timetable = context.window.SHINKANSEN_TIMETABLE;
  const selection = context.window.MADO_TRAIN_SELECT;
  const views = ["ja", "en"].map((lang) => new JSDOM(trainSearchTablesHTML(lang), {
    url: `https://www.michikusa-travel.com/${lang === "en" ? "en/" : ""}start.html`,
  }));
  try {
    const [ja, en] = views.map((view) => view.window.document);
    const jaRows = [...ja.querySelectorAll("tbody tr")];
    const enRows = [...en.querySelectorAll("tbody tr")];
    assert.ok(enRows.length > 500, "the complete existing service index remains static");
    assert.equal(jaRows.length, enRows.length);
    for (const doc of [ja, en]) {
      assert.equal(doc.querySelectorAll("details").length, 6);
      assert.equal(doc.querySelectorAll("details[open]").length, 0);
      assert.ok(doc.querySelector(".train-search-note").textContent.includes(timetable.updatedAt));
    }
    const keys = new Set();
    enRows.forEach((row, index) => {
      const link = row.querySelector("a");
      const url = new URL(link.href);
      const jaUrl = new URL(jaRows[index].querySelector("a").href);
      assert.equal(url.pathname, "/en/start.html");
      assert.equal(jaUrl.pathname, "/start.html");
      assert.equal(url.search, jaUrl.search);
      assert.equal(url.hash, "#journey");
      assert.equal(url.searchParams.get("focus"), "fuji");
      assert.equal(row.dataset.fujiMin, jaRows[index].dataset.fujiMin);
      assert.equal(row.lastElementChild.textContent, jaRows[index].lastElementChild.textContent);
      const [type, number] = url.searchParams.get("train").split("-");
      const direction = url.searchParams.get("dir");
      const candidates = selection.trainCandidates(timetable, ROUTE, direction, url.searchParams.get("board"));
      assert.ok(candidates.some(({ tr }) => tr.type === type && String(tr.number) === number), link.textContent);
      const key = `${type}-${number}-${direction}`;
      assert.ok(!keys.has(key), `duplicate service ${key}`);
      keys.add(key);
    });
  } finally {
    views.forEach((view) => view.window.close());
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

test("every static train estimate equals the actual start-page journey calculation", async () => {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error));
  const app = new JSDOM(read("start.html"), {
    url: "https://www.michikusa-travel.com/start.html?ga=off",
    runScripts: "outside-only", pretendToBeVisual: true, virtualConsole,
  });
  const index = new JSDOM(trainSearchTablesHTML("en"));
  try {
    const w = app.window;
    await new Promise((resolve) => w.document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    w.matchMedia = () => ({ matches: false, addEventListener() {} });
    w.HTMLElement.prototype.scrollIntoView = function () {};
    w.MADO_ANALYTICS_DISABLED = true;
    w.MadoStorage = {};
    const context = app.getInternalVMContext();
    for (const file of ["data/timetable.js", "data-runtime.js", "track.js", "train-select.js", "train-picker.js", "app.js"]) {
      vm.runInContext(read(file), context, { filename: file });
    }
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    assert.deepEqual(errors, [], "the real start-page runtime initializes without errors");
    const rows = [...index.window.document.querySelectorAll("tbody tr")];
    assert.ok(rows.length > 500);
    for (const row of rows) {
      const url = new URL(row.querySelector("a").getAttribute("href"), "https://www.michikusa-travel.com/en/start.html");
      const [type, number] = url.searchParams.get("train").split("-");
      w.__indexLookup = { type, number: Number(number), direction: url.searchParams.get("dir"), boardId: url.searchParams.get("board") };
      const actual = vm.runInContext(`(() => {
        direction = window.__indexLookup.direction;
        boardId = window.__indexLookup.boardId;
        const match = trainCandidates().find(({ tr }) => tr.type === window.__indexLookup.type && tr.number === window.__indexLookup.number);
        if (!match) return null;
        return computeJourney(match.tr, match.dep).spots.find(({ sp }) => sp.id === "fuji")?.clock;
      })()`, context);
      const label = `${type} ${number}, ${w.__indexLookup.direction}`;
      assert.equal(Number(row.dataset.fujiMin), actual, label);
      const time = `${String(Math.floor(actual / 60)).padStart(2, "0")}:${String(actual % 60).padStart(2, "0")}`;
      assert.equal(row.lastElementChild.textContent, time, label);
    }
    const byTrain = (id) => [...index.window.document.querySelectorAll("tbody a")].find((link) => link.getAttribute("href").includes(`train=${id}&`)).closest("tr").lastElementChild.textContent;
    assert.equal(byTrain("Nozomi-1"), "06:44", "arrival-aware regression: Nozomi 1");
    assert.equal(byTrain("Kodama-801"), "07:33", "arrival-aware regression: Kodama 801");
  } finally {
    index.window.close();
    app.window.close();
  }
});
