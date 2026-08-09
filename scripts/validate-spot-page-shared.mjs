import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SHARED_JA_SPOT_IDS, SPOTS as GENERATED_SPOTS, spotPageHTML } from "./generate-spot-pages.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

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
if (JSON.stringify(generated) !== JSON.stringify(expected)) fail("spot-page-shared-data.js does not match the data.js projection");
if (sharedDataCode.includes('"icon"') || sharedDataCode.includes('"category"')) fail("spot-page-shared-data.js contains unused icon or category fields");
if (expected.spots.length !== 39 || expected.stations.length !== 17) fail(`expected 39 spots and 17 stations, found ${expected.spots.length} spots and ${expected.stations.length} stations`);
for (const spot of expected.spots) {
  if (!spot.thumb || !spot.thumb.endsWith(".webp")) fail(`${spot.id} is missing a generated .webp thumbnail path`);
  if (!fs.existsSync(path.join(appDir, spot.thumb))) fail(`${spot.id} thumbnail does not exist: ${spot.thumb}`);
}
if (GENERATED_SPOTS.length !== expected.spots.length || GENERATED_SPOTS.some((spot, index) => spot.id !== source.SPOTS[index]?.id)) {
  fail("generate-spot-pages.mjs spot source does not match data.js");
}
if (JSON.stringify([...SHARED_JA_SPOT_IDS].sort()) !== JSON.stringify(["fuji", "hamanako"])) {
  fail("generate-spot-pages.mjs shared Japanese pilot IDs changed unexpectedly");
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

function runRendererSmoke(lang, rootPath, currentId) {
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
  const context = { document, window: { console }, console };
  vm.runInNewContext(sharedDataCode, context, { filename: sharedDataPath });
  vm.runInNewContext(sharedRendererCode, context, { filename: sharedRendererPath });
  if (errors.length) throw new Error(`${lang} renderer reported: ${errors.join(" | ")}`);
  return {
    header: hosts.topbar.outerHTML,
    rail: hosts.rail.outerHTML,
    content: hosts["content-rail"].outerHTML,
  };
}

function countMatches(value, pattern) {
  return value.match(pattern)?.length || 0;
}

const generatedSpotPages = [];
for (const lang of ["ja", "en"]) {
  for (const spot of GENERATED_SPOTS) {
    const relativeFile = lang === "ja" ? `spots/${spot.id}.html` : `en/spots/${spot.id}.html`;
    const html = spotPageHTML(spot, lang);
    const onDiskHTML = fs.readFileSync(path.join(appDir, relativeFile), "utf8");
    if (onDiskHTML !== html) fail(`${relativeFile} does not match the in-memory generator output`);
    const isPilot = lang === "ja" && SHARED_JA_SPOT_IDS.has(spot.id);
    const hostPatternFor = (name) => new RegExp(`<div data-spot-page-shared-module="${name}"></div>`, "g");
    const anyHostPatternFor = (name) => new RegExp(`<div data-spot-page-shared-module="${name}"[^>]*>`, "g");
    if (isPilot) {
      for (const name of ["topbar", "rail", "content-rail"]) {
        if (countMatches(html, hostPatternFor(name)) !== 1 || countMatches(html, anyHostPatternFor(name)) !== 1) {
          fail(`${relativeFile} in-memory regeneration did not keep exactly one empty ${name} host`);
        }
      }
      const body = `<body class="spot-page" data-spot-page-shared-lang="ja" data-spot-page-shared-id="${spot.id}" data-spot-page-shared-root="../">`;
      if (!html.includes(body)) fail(`${relativeFile} in-memory regeneration lost the shared body context`);
      const dataIndex = html.indexOf('<script src="../spot-page-shared-data.js"></script>');
      const rendererIndex = html.indexOf('<script src="../spot-page-shared.js"></script>');
      const mapIndex = html.indexOf('<script src="../spot-map.js?v=20260707-map-mode-switch"></script>');
      const affiliateIndex = html.indexOf('document.querySelectorAll("img[data-affiliate-src]")');
      if (dataIndex < 0 || rendererIndex < 0 || dataIndex > rendererIndex || rendererIndex > mapIndex || rendererIndex > affiliateIndex) {
        fail(`${relativeFile} in-memory regeneration lost shared script order`);
      }
      if (html.includes('<header class="topbar">') || html.includes('<aside class="spot-page-rail')) {
        fail(`${relativeFile} in-memory regeneration reintroduced legacy shared chrome`);
      }
    } else {
      if (html.includes("data-spot-page-shared-module") || html.includes("spot-page-shared.js")) {
        fail(`${relativeFile} in-memory regeneration unexpectedly opted into shared modules`);
      }
      for (const legacy of ['<header class="topbar">', '<aside class="spot-page-rail', '<section class="content-rail-section']) {
        if (!html.includes(legacy)) fail(`${relativeFile} in-memory regeneration lost legacy ${legacy} module`);
      }
    }
    generatedSpotPages.push({ lang, relativeFile, html, isPilot });
  }
}
if (generatedSpotPages.length !== 78 || generatedSpotPages.filter((page) => page.isPilot).length !== 2) {
  fail(`in-memory regeneration expected 78 pages with 2 shared pilots, found ${generatedSpotPages.length} pages with ${generatedSpotPages.filter((page) => page.isPilot).length} pilots`);
}

function validateRenderedRail(rail, lang, rootPath) {
  if (countMatches(rail, /class="spot-page-rail-row spot-page-rail-station/g) !== 17) fail(`${lang} renderer did not render all 17 station rows`);
  if (countMatches(rail, /class="spot-page-rail-row spot-page-rail-spot(?: |\")/g) !== 39) fail(`${lang} renderer did not render all 39 spot rows`);
  if (countMatches(rail, /class="spot-page-rail-link"/g) !== 39) fail(`${lang} renderer did not render all 39 spot links`);
  if (countMatches(rail, /class="spot-page-rail-thumb"/g) !== 39) fail(`${lang} renderer did not render all 39 thumbnail images`);
  if (countMatches(rail, /class="spot-page-shared-preview" aria-hidden="true"><img/g) !== 39) fail(`${lang} renderer did not render all 39 preview images`);
  if (countMatches(rail, /class="spot-page-shared-preview-copy"/g) !== 39) fail(`${lang} renderer did not render all 39 contextual preview copies`);
  if (countMatches(rail, /class="spot-page-shared-seat-group"/g) !== 39) fail(`${lang} renderer did not render all 39 seat projections`);
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
  if (failures.length === smokeFailuresBefore) console.log("Renderer smoke passed: ja/en, 2 Japanese affiliate modules, contextual cards, Fuji current state, Lake Hamana A+E both-side state.");
} catch (error) {
  fail(`renderer smoke failed: ${error && error.message ? error.message : error}`);
}

const fujiPath = path.join(appDir, "spots", "fuji.html");
const fujiHTML = fs.readFileSync(fujiPath, "utf8");
const baseHTML = execFileSync("git", ["show", "HEAD:spots/fuji.html"], { cwd: appDir, encoding: "utf8" });
const hostPattern = (name) => new RegExp(`<div data-spot-page-shared-module="${name}"></div>`, "g");
const anyHostPattern = (name) => new RegExp(`<div data-spot-page-shared-module="${name}"[^>]*>`, "g");
for (const name of ["topbar", "rail", "content-rail"]) {
  const count = fujiHTML.match(hostPattern(name))?.length || 0;
  if (count !== 1) fail(`spots/fuji.html must have exactly one ${name} host (found ${count})`);
}

for (const required of [
  '<body class="spot-page"',
  'data-spot-page-shared-lang="ja"',
  'data-spot-page-shared-id="fuji"',
  'data-spot-page-shared-root="../"',
  '<link rel="canonical" href="https://www.michikusa-travel.com/spots/fuji.html">',
  'hreflang="ja"',
  'hreflang="en"',
  'type="application/ld+json"',
  'このページの主役は、東海道新幹線で富士山が最も大きく見える',
  'id="spotPageLightbox"',
  'src="../spot-map.js?v=20260707-map-mode-switch"',
  'class="spot-page-mobile-affiliate"',
  'data-affiliate-placement="ja_spot_article_end_mobile"',
]) {
  if (!fujiHTML.includes(required)) fail(`spots/fuji.html is missing required static content: ${required}`);
}

const sharedDataScript = '<script src="../spot-page-shared-data.js"></script>';
const sharedRendererScript = '<script src="../spot-page-shared.js"></script>';
const dataScriptIndex = fujiHTML.indexOf(sharedDataScript);
const rendererScriptIndex = fujiHTML.indexOf(sharedRendererScript);
const affiliateScriptIndex = fujiHTML.indexOf('document.querySelectorAll("img[data-affiliate-src]")');
if (dataScriptIndex < 0 || rendererScriptIndex < 0 || dataScriptIndex > rendererScriptIndex) fail("shared data and renderer scripts are missing or out of order");
if (affiliateScriptIndex < 0 || rendererScriptIndex > affiliateScriptIndex) fail("shared renderer must execute before the existing affiliate tracking script");
if (fujiHTML.includes('src="../data.js"') || fujiHTML.includes("generate-spot-pages.mjs")) fail("fuji.html must not load the full data.js or the existing generator");
if (new URL("../spot-page-shared-data.js", "https://pilot.invalid/spots/fuji.html").pathname !== "/spot-page-shared-data.js" || new URL("../spot-page-shared.js", "https://pilot.invalid/spots/fuji.html").pathname !== "/spot-page-shared.js") fail("shared script relative URLs do not resolve from spots/fuji.html");

const headStart = fujiHTML.indexOf("<head>");
const headEnd = fujiHTML.indexOf("</head>") + "</head>".length;
const articleStart = fujiHTML.indexOf('<article class="spot-page-article">');
const articleEnd = fujiHTML.indexOf("</article>", articleStart) + "</article>".length;
const baseHeadStart = baseHTML.indexOf("<head>");
const baseHeadEnd = baseHTML.indexOf("</head>") + "</head>".length;
const baseArticleStart = baseHTML.indexOf('<article class="spot-page-article">');
const baseArticleEnd = baseHTML.indexOf("</article>", baseArticleStart) + "</article>".length;
if (headStart < 0 || headEnd <= headStart || fujiHTML.slice(headStart, headEnd) !== baseHTML.slice(baseHeadStart, baseHeadEnd)) fail("unique fuji head/SEO markup changed");
if (articleStart < 0 || articleEnd <= articleStart || fujiHTML.slice(articleStart, articleEnd) !== baseHTML.slice(baseArticleStart, baseArticleEnd)) fail("unique fuji article or mobile affiliate markup changed");

const pilotFiles = ["spots/fuji.html", "spots/hamanako.html"];
for (const relativeFile of pilotFiles) {
  const html = fs.readFileSync(path.join(appDir, relativeFile), "utf8");
  const baseline = execFileSync("git", ["show", `HEAD:${relativeFile}`], { cwd: appDir, encoding: "utf8" });
  const currentId = path.basename(relativeFile, ".html");
  for (const name of ["topbar", "rail", "content-rail"]) {
    const emptyHosts = html.match(hostPattern(name))?.length || 0;
    const allHosts = html.match(anyHostPattern(name))?.length || 0;
    if (emptyHosts !== 1 || allHosts !== 1) fail(`${relativeFile} must have exactly one empty ${name} host without legacy shared markup`);
  }
  for (const required of [
    '<body class="spot-page"',
    'data-spot-page-shared-lang="ja"',
    `data-spot-page-shared-id="${currentId}"`,
    'data-spot-page-shared-root="../"',
    'id="spotPageLightbox"',
    'src="../spot-map.js?v=20260707-map-mode-switch"',
    'class="spot-page-mobile-affiliate"',
    'data-affiliate-placement="ja_spot_article_end_mobile"',
  ]) {
    if (!html.includes(required)) fail(`${relativeFile} is missing required static content: ${required}`);
  }
  const dataIndex = html.indexOf(sharedDataScript);
  const rendererIndex = html.indexOf(sharedRendererScript);
  const affiliateIndex = html.indexOf('document.querySelectorAll("img[data-affiliate-src]")');
  if (dataIndex < 0 || rendererIndex < 0 || dataIndex > rendererIndex || rendererIndex > affiliateIndex) fail(`${relativeFile} shared scripts are missing or out of order`);
  if (html.includes('src="../data.js"') || html.includes("generate-spot-pages.mjs")) fail(`${relativeFile} must not load the full data.js or the existing generator`);
  if (new URL("../spot-page-shared-data.js", `https://pilot.invalid/${relativeFile}`).pathname !== "/spot-page-shared-data.js" || new URL("../spot-page-shared.js", `https://pilot.invalid/${relativeFile}`).pathname !== "/spot-page-shared.js") fail(`${relativeFile} shared script relative URLs do not resolve`);
  const regions = [
    ["head", "<head>", "</head>"],
    ["article", '<article class="spot-page-article">', "</article>"],
  ];
  for (const [region, startToken, endToken] of regions) {
    const start = html.indexOf(startToken);
    const end = html.indexOf(endToken, start) + endToken.length;
    const baseStart = baseline.indexOf(startToken);
    const baseEnd = baseline.indexOf(endToken, baseStart) + endToken.length;
    if (start < 0 || end <= start || html.slice(start, end) !== baseline.slice(baseStart, baseEnd)) fail(`${relativeFile} unique ${region} static region changed`);
  }
}

const japanesePages = fs.readdirSync(path.join(appDir, "spots")).filter((name) => name.endsWith(".html"));
const englishPages = fs.readdirSync(path.join(appDir, "en", "spots")).filter((name) => name.endsWith(".html"));
const allSpotPages = japanesePages.map((name) => path.join("spots", name).replaceAll("\\", "/")).concat(englishPages.map((name) => path.join("en", "spots", name).replaceAll("\\", "/")));
const otherPages = allSpotPages.filter((file) => !pilotFiles.includes(file));
if (allSpotPages.length !== 78 || otherPages.length !== 76) fail(`expected 78 spot pages and 76 non-pilot pages, found ${allSpotPages.length} total`);
for (const relativeFile of otherPages) {
  const html = fs.readFileSync(path.join(appDir, relativeFile), "utf8");
  if (html.includes("data-spot-page-shared-module") || html.includes("spot-page-shared.js")) fail(`${relativeFile} is unexpectedly opted into shared modules`);
  for (const legacy of ['<header class="topbar">', '<aside class="spot-page-rail', '<section class="content-rail-section']) {
    if (!html.includes(legacy)) fail(`${relativeFile} does not retain its legacy static ${legacy} module`);
  }
}

if (failures.length) throw new Error(`Shared spot-page validation failed:\n- ${failures.join("\n- ")}`);
console.log(`Shared data matches data.js: ${expected.spots.length} spots, ${expected.stations.length} stations.`);
console.log(`Rail projection represents ${expected.spots.length} spots and ${expected.stations.length} stations (${expected.spots.length + expected.stations.length} ordered rows).`);
console.log("In-memory spot generator regeneration test passed: 2 Japanese shared pilots and 76 legacy spot pages remain separated.");
console.log("All 39 Japanese and English spot links render image, name, timing, full side label, and contextual preview copy.");
console.log("Shared modules opt into spots/fuji.html and spots/hamanako.html; the other 76 spot pages retain legacy static modules.");
console.log("Pilot static head/article/map/lightbox/mobile affiliate regions and shared-script order validated.");
