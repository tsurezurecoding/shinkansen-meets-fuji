import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SHARED_SPOT_LANGUAGES, SPOTS as GENERATED_SPOTS, spotPageHTML } from "./generate-spot-pages.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

function parseCLIArgs(args) {
  if (args.length === 0) return { baselineSelector: null };
  if (args.length === 2 && args[0] === "--baseline" && args[1] && !args[1].startsWith("-")) {
    return { baselineSelector: args[1] };
  }
  throw new Error("Usage: node scripts/validate-spot-page-shared.mjs [--baseline <git-ref>]");
}

function assertCLIContract() {
  if (parseCLIArgs([]).baselineSelector !== null) throw new Error("CLI contract: default mode must not select a baseline");
  if (parseCLIArgs(["--baseline", "7d061f7"]).baselineSelector !== "7d061f7") throw new Error("CLI contract: explicit baseline was not selected");
  for (const invalidArgs of [
    ["--baseline"],
    ["--baseline", "7d061f7", "extra"],
    ["--baseline", "7d061f7", "--baseline", "HEAD"],
    ["--unknown"],
    ["--baseline", "--unknown"],
  ]) {
    let rejected = false;
    try {
      parseCLIArgs(invalidArgs);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error(`CLI contract: invalid args were accepted: ${invalidArgs.join(" ")}`);
  }
}

assertCLIContract();
const { baselineSelector } = parseCLIArgs(process.argv.slice(2));
const baselineAuditEnabled = baselineSelector !== null;
const baselineCommit = baselineAuditEnabled
  ? execFileSync("git", ["rev-parse", "--verify", `${baselineSelector}^{commit}`], { cwd: appDir, encoding: "utf8" }).trim()
  : null;
const baselineLabel = baselineAuditEnabled ? `${baselineSelector} (${baselineCommit})` : null;

function localized(value, lang) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[lang] || value.ja || value.en || "";
}

function thumbnailSrc(src) {
  return String(src || "").replace(/^images\/(.+)\.(jpe?g|png)$/i, "images/thumbs/$1.webp");
}

function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function projection(source) {
  const sideLabels = {
    ja: { A: "A席・海側", E: "E席・山側", both: "左右両側", hamanako: "A席・海側 / E席・山側" },
    en: { A: "Seat A · sea side", E: "Seat E · mountain side", both: "Both sides", hamanako: "Seat A · sea side / Seat E · mountain side" },
  };
  const sideLabel = (spot, lang) => spot.id === "hamanako"
    ? sideLabels[lang].hamanako
    : localized(spot.sideLabel, lang) || sideLabels[lang][spot.side] || sideLabels[lang].both;
  const seats = (spot) => {
    const japaneseSide = sideLabel(spot, "ja");
    if (japaneseSide.includes("A席") && japaneseSide.includes("E席")) return ["A", "E"];
    if (spot.side === "A" || spot.side === "E") return [spot.side];
    throw new Error(`Spot ${spot.id} has no canonical A/E seat`);
  };
  return {
    version: 1,
    stations: source.ROUTE.refStations.map((station) => ({
      id: String(station.id),
      name: { ja: String(station.ja || station.en || station.id), en: String(station.en || station.ja || station.id) },
      minutes: Number(station.min),
      major: !!station.major,
    })),
    spots: source.SPOTS.map((spot) => ({
      id: String(spot.id),
      name: { ja: String(spot.ja?.name || spot.en?.name || spot.id), en: String(spot.en?.name || spot.ja?.name || spot.id) },
      minutes: Number.isFinite(Number(spot.minutesFromTokyo)) ? Number(spot.minutesFromTokyo) : null,
      side: typeof spot.side === "string" ? spot.side : "",
      sideLabel: { ja: sideLabel(spot, "ja"), en: sideLabel(spot, "en") },
      seats: seats(spot),
      thumb: spot.image ? thumbnailSrc(spot.image) : "",
    })),
  };
}

const sourceContext = {};
vm.runInNewContext(`${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\nglobalThis.__SOURCE = { SPOTS, ROUTE };`, sourceContext, { filename: path.join(appDir, "data.js") });
const source = sourceContext.__SOURCE;
if (!source || !Array.isArray(source.SPOTS) || !source.ROUTE) throw new Error("Could not read data.js");

const generatedContext = {};
const sharedDataPath = path.join(appDir, "spot-page-shared-data.js");
const sharedRendererPath = path.join(appDir, "spot-page-shared.js");
const sharedDataCode = fs.readFileSync(sharedDataPath, "utf8");
const sharedRendererCode = fs.readFileSync(sharedRendererPath, "utf8");
vm.runInNewContext(sharedDataCode, generatedContext, { filename: sharedDataPath });
const generated = generatedContext.MADO_SPOT_PAGE_SHARED_DATA;
const expected = projection(source);
const expectedLanguages = ["ja", "en"];
const expectedSpotCount = expected.spots.length;
const expectedStationCount = expected.stations.length;
const expectedPageCount = expectedSpotCount * expectedLanguages.length;
if (JSON.stringify(generated) !== JSON.stringify(expected)) fail("spot-page-shared-data.js does not match the data.js projection");
if (sharedDataCode.includes('"icon"') || sharedDataCode.includes('"category"')) fail("spot-page-shared-data.js contains unused icon or category fields");
for (const spot of expected.spots) {
  if (!spot.thumb || !spot.thumb.endsWith(".webp")) fail(`${spot.id} is missing a generated .webp thumbnail path`);
  if (!fs.existsSync(path.join(appDir, spot.thumb))) fail(`${spot.id} thumbnail does not exist: ${spot.thumb}`);
}
if (GENERATED_SPOTS.length !== expected.spots.length || GENERATED_SPOTS.some((spot, index) => spot.id !== source.SPOTS[index]?.id)) {
  fail("generate-spot-pages.mjs spot source does not match data.js");
}
if (JSON.stringify([...SHARED_SPOT_LANGUAGES].sort()) !== JSON.stringify([...expectedLanguages].sort())) {
  fail("generate-spot-pages.mjs shared language contract changed unexpectedly");
}

function makeHost() {
  let rendered = "";
  const attributes = {};
  const host = {
    className: "",
    textContent: "",
    classList: {
      contains(value) {
        return host.className.split(/\s+/).includes(value);
      },
    },
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    getAttribute(name) {
      return attributes[name] || null;
    },
  };
  Object.defineProperty(host, "outerHTML", {
    get() {
      return rendered;
    },
    set(value) {
      rendered = String(value);
    },
  });
  return host;
}

function runRendererSmoke(lang, rootPath, currentId, options = {}) {
  const hosts = {
    topbar: makeHost(),
    rail: makeHost(),
    "content-rail": makeHost(),
  };
  const body = {
    classList: {
      contains(value) {
        return value === "spot-page";
      },
    },
    getAttribute(name) {
      return {
        "data-spot-page-shared-lang": lang,
        "data-spot-page-shared-id": currentId,
        "data-spot-page-shared-root": rootPath,
      }[name] || null;
    },
  };
  const document = {
    body,
    querySelectorAll(selector) {
      const match = selector.match(/data-spot-page-shared-module="([^"]+)"/);
      return match && hosts[match[1]] ? [hosts[match[1]]] : [];
    },
  };
  const errors = [];
  const console = { error(message) { errors.push(String(message)); } };
  const window = { console };
  const context = { document, window, console };
  vm.runInNewContext(sharedDataCode, context, { filename: sharedDataPath });
  if (typeof options.mutateData === "function") options.mutateData(window.MADO_SPOT_PAGE_SHARED_DATA);
  vm.runInNewContext(sharedRendererCode, context, { filename: sharedRendererPath });
  if (errors.length && !options.allowErrors) throw new Error(`${lang} renderer reported: ${errors.join(" | ")}`);
  return {
    header: hosts.topbar.outerHTML,
    rail: hosts.rail.outerHTML,
    content: hosts["content-rail"].outerHTML,
    errors,
    hostStates: Object.fromEntries(Object.entries(hosts).map(([name, host]) => [name, {
      className: host.className,
      textContent: host.textContent,
      role: host.getAttribute("role"),
    }])),
  };
}

function countMatches(value, pattern) {
  return value.match(pattern)?.length || 0;
}

function extractRegion(html, startToken, endToken) {
  const start = html.indexOf(startToken);
  const end = start >= 0 ? html.indexOf(endToken, start) + endToken.length : -1;
  return start >= 0 && end > start ? html.slice(start, end) : null;
}

function extractScriptContaining(html, needle) {
  return (html.match(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g) || []).find((script) => script.includes(needle)) || null;
}

function compareBaselineRegion(relativeFile, currentHTML, baselineHTML, label, startToken, endToken) {
  const current = extractRegion(currentHTML, startToken, endToken);
  const baseline = extractRegion(baselineHTML, startToken, endToken);
  if (current === null || baseline === null || current !== baseline) fail(`${relativeFile} unique ${label} region changed from baseline ${baselineLabel}`);
}

function compareOptionalBaselineRegion(relativeFile, currentHTML, baselineHTML, label, startToken, endToken) {
  const current = extractRegion(currentHTML, startToken, endToken);
  const baseline = extractRegion(baselineHTML, startToken, endToken);
  if (current !== baseline) fail(`${relativeFile} unique ${label} region changed from baseline ${baselineLabel}`);
}

function extractPattern(html, pattern) {
  return html.match(pattern)?.[0] || null;
}

function compareBaselinePattern(relativeFile, currentHTML, baselineHTML, label, pattern) {
  const current = extractPattern(currentHTML, pattern);
  const baseline = extractPattern(baselineHTML, pattern);
  if (current === null || baseline === null || current !== baseline) fail(`${relativeFile} unique ${label} region changed from baseline ${baselineLabel}`);
}

function compareBaselineScript(relativeFile, currentHTML, baselineHTML, label, needle) {
  const current = extractScriptContaining(currentHTML, needle);
  const baseline = extractScriptContaining(baselineHTML, needle);
  if (current === null || baseline === null || current !== baseline) fail(`${relativeFile} existing ${label} script changed from baseline ${baselineLabel}`);
}

function countLiteral(value, needle) {
  return needle ? value.split(needle).length - 1 : 0;
}

let baselineReadCount = 0;
function readBaselineHTML(relativeFile) {
  if (!baselineAuditEnabled) throw new Error("internal validator error: baseline read attempted without --baseline");
  baselineReadCount += 1;
  return execFileSync("git", ["show", `${baselineCommit}:${relativeFile}`], { cwd: appDir, encoding: "utf8" });
}

const expectedRelativeFiles = new Set([
  ...GENERATED_SPOTS.map((spot) => `spots/${spot.id}.html`),
  ...GENERATED_SPOTS.map((spot) => `en/spots/${spot.id}.html`),
]);
const japanesePages = fs.readdirSync(path.join(appDir, "spots")).filter((name) => name.endsWith(".html"));
const englishPages = fs.readdirSync(path.join(appDir, "en", "spots")).filter((name) => name.endsWith(".html"));
const allSpotPages = japanesePages
  .map((name) => path.join("spots", name).replaceAll("\\", "/"))
  .concat(englishPages.map((name) => path.join("en", "spots", name).replaceAll("\\", "/")));
const missingSpotPages = [...expectedRelativeFiles].filter((file) => !allSpotPages.includes(file));
const unexpectedSpotPages = allSpotPages.filter((file) => !expectedRelativeFiles.has(file));
if (japanesePages.length !== expectedSpotCount || englishPages.length !== expectedSpotCount || allSpotPages.length !== expectedPageCount || missingSpotPages.length || unexpectedSpotPages.length) {
  fail(`expected ${expectedSpotCount} Japanese and ${expectedSpotCount} English spot pages (${expectedPageCount} total) from data.js; found ${japanesePages.length} ja, ${englishPages.length} en, missing ${missingSpotPages.join(", ") || "none"}, unexpected ${unexpectedSpotPages.join(", ") || "none"}`);
}

const generatedSpotPages = [];
for (const lang of expectedLanguages) {
  for (const spot of GENERATED_SPOTS) {
    const relativeFile = lang === "ja" ? `spots/${spot.id}.html` : `en/spots/${spot.id}.html`;
    const html = spotPageHTML(spot, lang);
    const onDiskHTML = fs.readFileSync(path.join(appDir, relativeFile), "utf8");
    const baselineHTML = baselineAuditEnabled ? readBaselineHTML(relativeFile) : null;
    if (onDiskHTML !== html) fail(`${relativeFile} does not match the in-memory generator output`);

    const prefix = lang === "ja" ? "../" : "../../";
    const expectedBody = `<body class="spot-page" data-spot-page-shared-lang="${lang}" data-spot-page-shared-id="${spot.id}" data-spot-page-shared-root="${prefix}">`;
    if (!html.includes(`<html lang="${lang}">`)) fail(`${relativeFile} has incorrect html lang`);
    if ((html.match(/<body[^>]*>/)?.[0] || "") !== expectedBody) fail(`${relativeFile} has incorrect shared body context`);

    for (const name of ["topbar", "rail", "content-rail"]) {
      const exactHost = new RegExp(`<div data-spot-page-shared-module="${name}"></div>`, "g");
      const anyHost = new RegExp(`<div data-spot-page-shared-module="${name}"[^>]*>`, "g");
      if (countMatches(html, exactHost) !== 1 || countMatches(html, anyHost) !== 1) fail(`${relativeFile} must have exactly one strict empty ${name} host`);
    }
    if (countMatches(html, /data-spot-page-shared-module=/g) !== 3) fail(`${relativeFile} must have exactly three shared module hosts`);

    const sharedDataScript = `<script src="${prefix}spot-page-shared-data.js"></script>`;
    const sharedRendererScript = `<script src="${prefix}spot-page-shared.js"></script>`;
    const mapScript = `<script src="${prefix}spot-map.js?v=20260707-map-mode-switch"></script>`;
    const affiliateNeedle = lang === "ja" ? 'document.querySelectorAll("img[data-affiliate-src]")' : 'var modules = document.querySelectorAll("[data-affiliate-module]");';
    const dataIndex = html.indexOf(sharedDataScript);
    const rendererIndex = html.indexOf(sharedRendererScript);
    const mapIndex = html.indexOf(mapScript);
    const affiliateIndex = html.indexOf(affiliateNeedle);
    const lightboxIndex = html.indexOf('var box = document.getElementById("spotPageLightbox")');
    if (countLiteral(html, sharedDataScript) !== 1 || countLiteral(html, sharedRendererScript) !== 1 || dataIndex < 0 || rendererIndex < 0 || mapIndex < 0 || lightboxIndex < 0 || affiliateIndex < 0 || dataIndex > rendererIndex || rendererIndex > mapIndex || mapIndex > lightboxIndex || lightboxIndex > affiliateIndex) {
      fail(`${relativeFile} shared/existing script order or paths are invalid`);
    }
    const pageURL = `https://pilot.invalid/${lang === "ja" ? "spots" : "en/spots"}/${spot.id}.html`;
    if (new URL(`${prefix}spot-page-shared-data.js`, pageURL).pathname !== "/spot-page-shared-data.js" || new URL(`${prefix}spot-page-shared.js`, pageURL).pathname !== "/spot-page-shared.js") {
      fail(`${relativeFile} shared script relative URLs do not resolve to app root`);
    }
    if (html.includes('<header class="topbar">') || html.includes('<aside class="spot-page-rail') || html.includes('<section class="content-rail-section')) {
      fail(`${relativeFile} still contains legacy shared chrome`);
    }
    if (html.includes(`<script src="${prefix}data.js"`) || html.includes("generate-spot-pages.mjs")) fail(`${relativeFile} must not load generator or full data.js`);

    if (baselineAuditEnabled) {
      for (const [label, startToken, endToken] of [
        ["head/SEO", "<head>", "</head>"],
        ["hero", '<header class="spot-page-article spot-page-hero">', "</header>"],
        ["article", '<article class="spot-page-article">', "</article>"],
        ["map", '<section class="spot-static-map">', "</section>"],
      ]) compareBaselineRegion(relativeFile, html, baselineHTML, label, startToken, endToken);
      compareOptionalBaselineRegion(relativeFile, html, baselineHTML, "mobile affiliate", '<aside class="spot-page-mobile-affiliate"', "</aside>");
      compareBaselinePattern(
        relativeFile,
        html,
        baselineHTML,
        "lightbox",
        /<div class="spot-page-lightbox" id="spotPageLightbox" hidden>[\s\S]*?<\/div>/,
      );
      compareBaselineScript(relativeFile, html, baselineHTML, "spot map", "spot-map.js?v=20260707-map-mode-switch");
      compareBaselineScript(relativeFile, html, baselineHTML, "lightbox", "var box = document.getElementById(\"spotPageLightbox\")");
      compareBaselineScript(relativeFile, html, baselineHTML, "affiliate tracking", affiliateNeedle);
      if (relativeFile === "spots/fuji.html" || relativeFile === "spots/hamanako.html") {
        if (onDiskHTML !== baselineHTML) fail(`${relativeFile} must remain unchanged from baseline ${baselineLabel}`);
      }
    }
    generatedSpotPages.push({ lang, relativeFile, html });
  }
}
if (generatedSpotPages.length !== expectedPageCount) fail(`in-memory regeneration expected exactly ${expectedPageCount} shared pages, found ${generatedSpotPages.length}`);

function validateRenderedRail(rail, lang, rootPath) {
  if (countMatches(rail, /class="spot-page-rail-row spot-page-rail-station/g) !== expectedStationCount) fail(`${lang} renderer did not render all ${expectedStationCount} station rows`);
  if (countMatches(rail, /class="spot-page-rail-row spot-page-rail-spot(?: |\")/g) !== expectedSpotCount) fail(`${lang} renderer did not render all ${expectedSpotCount} spot rows`);
  if (countMatches(rail, /class="spot-page-rail-link"/g) !== expectedSpotCount) fail(`${lang} renderer did not render all ${expectedSpotCount} spot links`);
  if (countMatches(rail, /class="spot-page-rail-thumb"/g) !== expectedSpotCount) fail(`${lang} renderer did not render all ${expectedSpotCount} thumbnail images`);
  if (countMatches(rail, /class="spot-page-shared-preview" aria-hidden="true"><img/g) !== expectedSpotCount) fail(`${lang} renderer did not render all ${expectedSpotCount} preview images`);
  if (countMatches(rail, /class="spot-page-shared-preview-copy"/g) !== expectedSpotCount) fail(`${lang} renderer did not render all ${expectedSpotCount} contextual preview copies`);
  if (countMatches(rail, /class="spot-page-shared-seat-group"/g) !== expectedSpotCount) fail(`${lang} renderer did not render all ${expectedSpotCount} seat projections`);
  for (const spot of expected.spots) {
    const rowStart = rail.indexOf(`<a class="spot-page-rail-link" href="${spot.id}.html"`);
    const rowEnd = rowStart >= 0 ? rail.indexOf("</a>", rowStart) : -1;
    const row = rowStart >= 0 && rowEnd > rowStart ? rail.slice(rowStart, rowEnd) : "";
    const name = escapeHTML(spot.name[lang]);
    const timing = lang === "ja" ? `東京から約${spot.minutes}分` : `About ${spot.minutes} min from Tokyo`;
    const side = escapeHTML(spot.sideLabel[lang]);
    if (!row || !row.includes(`src="${rootPath}${spot.thumb}"`) || !row.includes('class="spot-page-shared-preview" aria-hidden="true"') || !row.includes(`<strong>${name}</strong>`) || !row.includes(`${timing} ・ ${side}`)) {
      fail(`${lang} renderer preview is incomplete for ${spot.id}`);
    }
  }
}

function expectRendererRejection(label, rootPath, currentId, mutateData, expectedMessage) {
  const result = runRendererSmoke("ja", rootPath, currentId, { allowErrors: true, mutateData });
  if (!result.errors.some((message) => message.includes(expectedMessage))) fail(`${label} fixture was not rejected: ${result.errors.join(" | ") || "no renderer error"}`);
  for (const [name, state] of Object.entries(result.hostStates)) {
    if (state.className !== "spot-page-shared-error" || state.role !== "alert" || !state.textContent) {
      fail(`${label} fixture did not fail closed for ${name} host`);
    }
  }
}

function validateNegativeSafetyFixtures() {
  const before = failures.length;
  expectRendererRejection("malformed root", "https://evil.example/", "fuji", undefined, "relative root is required");
  expectRendererRejection("malformed current spot id", "../", "../fuji", undefined, "language or current spot context is malformed");
  expectRendererRejection("malformed asset path", "../", "fuji", (data) => {
    data.spots[0].thumb = "images/../escape.webp";
  }, "shared spot name or thumbnail is malformed");

  const payload = `<img src=x onerror="alert(1)">&'`;
  const escaped = escapeHTML(payload);
  const rendered = runRendererSmoke("ja", "../", "fuji", {
    mutateData(data) {
      const spot = data.spots.find((item) => item.id === "fuji");
      spot.name.ja = payload;
      spot.sideLabel.ja = payload;
    },
  });
  if (rendered.errors.length) fail(`HTML payload fixture unexpectedly failed: ${rendered.errors.join(" | ")}`);
  if (rendered.rail.includes(payload) || !rendered.rail.includes(`<strong>${escaped}</strong>`) || !rendered.rail.includes(`aria-label="${escaped}"`)) {
    fail("HTML payload fixture was not escaped in name/sideLabel output");
  }
  if (failures.length === before) console.log("Renderer negative safety fixtures passed: malformed root/current ID/asset rejected and name/sideLabel HTML escaped.");
}

const smokeFailuresBefore = failures.length;
try {
  const ja = runRendererSmoke("ja", "../", "fuji");
  validateRenderedRail(ja.rail, "ja", "../");
  if (!ja.header.includes('<a href="../index.html#journey">列車選択</a>')) fail("ja renderer did not preserve the exact header Train Search URL");
  if (ja.header.includes('href="../#journey"')) fail("ja renderer emitted the legacy-invalid ../#journey URL");
  if (!ja.rail.includes('<a class="spot-page-rail-cta" href="../index.html#journey">')) fail("ja renderer did not preserve the exact rail CTA URL");
  if (!ja.rail.includes('class="spot-page-rail-row spot-page-rail-spot is-current"') || !ja.rail.includes('href="fuji.html" aria-current="page"')) fail("ja renderer did not preserve the current spot highlight");
  if (!ja.rail.includes("<b>富士山</b>東京から約43分 ・ E席・山側")) fail("ja renderer did not preserve the exact ja current-spot now line");
  if (countMatches(ja.rail, /data-affiliate-module/g) !== 2) fail("ja renderer did not render exactly 2 desktop affiliate modules");
  if (!ja.rail.includes('data-affiliate-offer="nta_shinkansen_hotel"') || !ja.rail.includes('data-affiliate-offer="philips_power_bank_b0fmhz3kvp"') || ja.rail.includes("vc_pid_892671046")) fail("ja renderer did not retain only the approved affiliate offers");
  if (!ja.rail.includes('class="spot-page-shared-preview" aria-hidden="true"') || !ja.rail.includes('class="spot-page-shared-preview-copy"') || !ja.rail.includes('東京から約43分 ・ E席・山側')) fail("ja renderer did not render contextual preview cards with localized meta");
  if (!ja.rail.includes('class="spot-page-shared-seat-group" aria-label="E席・山側"')) fail("ja renderer did not render accessible boxed seat groups");
  if (countMatches(ja.content, /class="content-rail-card"/g) !== 8) fail("ja renderer did not render all 8 content cards");

  const hamanako = runRendererSmoke("ja", "../", "hamanako");
  if (!hamanako.rail.includes('href="hamanako.html" aria-current="page"')) fail("Lake Hamana renderer did not preserve the current spot highlight");
  if (!hamanako.rail.includes('<b>浜名湖</b>東京から約73分 ・ A席・海側 / E席・山側')) fail("Lake Hamana renderer did not preserve the full both-side now line");
  if (!hamanako.rail.includes('class="spot-page-shared-seat-group" aria-label="A席・海側 / E席・山側"><span class="spot-page-shared-seat is-a">A</span><span class="spot-page-shared-seat is-e">E</span>')) fail("Lake Hamana renderer did not render both boxed seat badges");
  if (!hamanako.rail.includes('727看板と248看板') || !hamanako.rail.includes('aria-label="A席・E席"')) fail("both-side 727 seat projection is missing");

  const en = runRendererSmoke("en", "../../", "fuji");
  validateRenderedRail(en.rail, "en", "../../");
  if (!en.header.includes('<a href="../../en/#journey">Train Search</a>')) fail("en renderer did not preserve the exact header Train Search URL");
  if (!en.rail.includes('<a class="spot-page-rail-cta" href="../../en/#journey">')) fail("en renderer did not preserve the exact rail CTA URL");
  if (!en.header.includes('href="../../spots/fuji.html?lang=ja"')) fail("en renderer did not preserve the legacy Japanese language-switch URL");
  if (!en.content.includes('href="../../en/?intro=1"')) fail("en renderer did not preserve the About link URL");
  if (!en.rail.includes('About 43 min from Tokyo ・ Seat E · mountain side')) fail("en renderer did not localize contextual preview timing and side meta");
  if (countMatches(en.rail, /data-affiliate-module/g) !== 1 || countMatches(en.rail, /class="affiliate-card"/g) !== 3) fail("en renderer did not render exactly 3 Klook affiliate cards");
  for (const offer of ["jr_pass", "fuji_hakone", "kyoto_nara"]) {
    if (countLiteral(en.rail, `data-affiliate-offer="${offer}"`) !== 1) fail(`en renderer did not render Klook offer ${offer}`);
  }
  const enHamanako = runRendererSmoke("en", "../../", "hamanako");
  validateRenderedRail(enHamanako.rail, "en", "../../");
  if (!enHamanako.header.includes('<a class="active" href="hamanako.html">') || !enHamanako.header.includes('href="../../spots/hamanako.html?lang=ja"')) fail("en renderer did not preserve the non-Fuji current/language-switch links");
  if (!enHamanako.rail.includes('href="hamanako.html" aria-current="page"') || !enHamanako.rail.includes('About 73 min from Tokyo ・ Seat A · sea side / Seat E · mountain side')) fail("en renderer did not preserve the non-Fuji current both-side context");
  validateNegativeSafetyFixtures();
  if (failures.length === smokeFailuresBefore) console.log("Renderer smoke passed: ja/en, 2 Japanese affiliate modules, contextual cards, Fuji current state, Lake Hamana A+E both-side state.");
} catch (error) {
  fail(`renderer smoke failed: ${error && error.message ? error.message : error}`);
}

const legacySharedPages = allSpotPages.filter((relativeFile) => {
  const html = fs.readFileSync(path.join(appDir, relativeFile), "utf8");
  return html.includes('<header class="topbar">') || html.includes('<aside class="spot-page-rail') || html.includes('<section class="content-rail-section');
});
if (legacySharedPages.length !== 0) fail(`expected 0 legacy spot pages, found ${legacySharedPages.join(", ")}`);
if (generatedSpotPages.length !== expectedPageCount || generatedSpotPages.some((page) => countMatches(page.html, /data-spot-page-shared-module=/g) !== 3)) fail(`not all generated spot pages contain exactly three shared hosts (${expectedPageCount} expected)`);
if (baselineAuditEnabled && baselineReadCount !== expectedPageCount) fail(`baseline audit read ${baselineReadCount} pages, expected ${expectedPageCount}`);
if (!baselineAuditEnabled && baselineReadCount !== 0) fail("default validation unexpectedly read a git baseline");

if (failures.length) throw new Error(`Shared spot-page validation failed:\n- ${failures.join("\n- ")}`);
console.log(`Shared data matches data.js: ${expected.spots.length} spots, ${expected.stations.length} stations.`);
console.log(`Rail projection represents ${expected.spots.length} spots and ${expected.stations.length} stations (${expected.spots.length + expected.stations.length} ordered rows).`);
console.log(`In-memory spot generator regeneration test passed: all ${expectedPageCount} Japanese and English spot pages use shared chrome with 0 legacy pages.`);
console.log(`All ${expectedSpotCount} Japanese and English spot links render image, name, timing, full side label, and contextual preview copy.`);
console.log("Japanese pages use exactly Japan Travel and Amazon affiliates; English pages use the existing 3 Klook offers.");
if (baselineAuditEnabled) {
  console.log(`Baseline audit passed: all unique head/SEO, hero, article, lightbox, map, mobile affiliate, tracking, and pilot exactness regions match ${baselineLabel}.`);
} else {
  console.log("Baseline audit skipped: no --baseline supplied; no git baseline resolution, reads, or comparisons performed.");
}
