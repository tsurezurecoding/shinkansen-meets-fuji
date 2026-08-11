import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SHARED_SPOT_LANGUAGES, SPOTS as GENERATED_SPOTS, generateSpotPage, generateSpotPages, spotPageHTML } from "./generate-spot-pages.mjs";

await runThinValidator();
process.exit(0);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const failures = [];
const SHOWCASE_SPOT_IDS = [
  "fuji",
  "hamanako",
  "odawara",
  "toji",
  "nagoya-station-skyline",
  "kirin-beer-factory",
  "kiyosu",
  "solar-ark",
  "727-board",
];
const PILOT_SPOT_PAGE = "spots/ibuki.html";
const IBUKI_X_POST_URL = "https://x.com/730AEVA/status/1838917502124056760";
const IBUKI_YOUTUBE_VIDEOS = [
  { id: "yQKej6npo8g", url: "https://www.youtube.com/watch?v=yQKej6npo8g" },
  { id: "puK5Tr_2Sxo", url: "https://www.youtube.com/watch?v=puK5Tr_2Sxo" },
];

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
  const showcase = SHOWCASE_SPOT_IDS.map((id) => {
    const spot = source.SPOTS.find((item) => item.id === id);
    const credit = spot?.photoCredit || {};
    return {
      id: String(spot.id),
      icon: String(spot.icon || ""),
      name: { ja: String(spot.ja?.name || spot.en?.name || spot.id), en: String(spot.en?.name || spot.ja?.name || spot.id) },
      hook: { ja: String(spot.ja.hook), en: String(spot.en.hook) },
      thumb: thumbnailSrc(spot.image),
      credit: { ja: String(credit.ja || credit.en || ""), en: String(credit.en || credit.ja || "") },
      creditUrl: typeof credit.url === "string" ? credit.url : "",
      creditDate: typeof credit.date === "string" ? credit.date : "",
    };
  });
  return {
    version: 1,
    affiliatesEnabled: false,
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
    showcase,
  };
}

const sourceContext = {};
vm.runInNewContext(`${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\nglobalThis.__SOURCE = { SPOTS, ROUTE };`, sourceContext, { filename: path.join(appDir, "data.js") });
const source = sourceContext.__SOURCE;
if (!source || !Array.isArray(source.SPOTS) || !source.ROUTE) throw new Error("Could not read data.js");

const generatedContext = {};
const sharedDataPath = path.join(appDir, "spot-page-shared-data.js");
const sharedRendererPath = path.join(appDir, "spot-page-shared.js");
const stylesheetPath = path.join(appDir, "style.css");
const sharedDataCode = fs.readFileSync(sharedDataPath, "utf8");
const sharedRendererCode = fs.readFileSync(sharedRendererPath, "utf8");
const stylesheetCode = fs.readFileSync(stylesheetPath, "utf8");
vm.runInNewContext(sharedDataCode, generatedContext, { filename: sharedDataPath });
const generated = generatedContext.MADO_SPOT_PAGE_SHARED_DATA;
const expected = projection(source);
const expectedLanguages = ["ja", "en"];
const expectedSpotCount = expected.spots.length;
const expectedStationCount = expected.stations.length;
const expectedPageCount = expectedSpotCount * expectedLanguages.length;
if (JSON.stringify(generated) !== JSON.stringify(expected)) fail("spot-page-shared-data.js does not match the data.js projection");
if (generated.affiliatesEnabled !== false || JSON.stringify(generated.showcase.map((item) => item.id)) !== JSON.stringify(SHOWCASE_SPOT_IDS)) {
  fail("spot-page-shared-data.js does not keep the affiliate-off and TOP showcase contracts");
}
if (!sharedRendererCode.includes("data.affiliatesEnabled !== true") || !sharedRendererCode.includes("function showcaseHTML")) {
  fail("spot-page-shared.js is missing the explicit affiliate or shared showcase contract");
}
if (!stylesheetCode.includes(":where([data-affiliate-module], .spot-page-mobile-affiliate)") || !stylesheetCode.includes("display: none !important")) {
  fail("style.css is missing the global affiliate presentation kill switch");
}
if (!stylesheetCode.includes("body[data-spot-page-shared-id] .spot-page-rail-spot.is-current .spot-page-shared-preview {") || !stylesheetCode.includes("body[data-spot-page-shared-id] .spot-page-rail-spot.is-current .spot-page-rail-thumb {") || !stylesheetCode.includes("position: static;") || !stylesheetCode.includes("body[data-spot-page-shared-id] .spot-page-rail-spot.is-current .spot-page-shared-seat-group")) {
  fail("style.css is missing the persistent current-rail preview contract");
}
if (!stylesheetCode.includes(".spot-page-rail-link:hover .spot-page-shared-preview") || !stylesheetCode.includes(".spot-page-rail-link:focus-visible .spot-page-shared-preview")) {
  fail("style.css no longer preserves non-current rail hover/focus previews");
}
if (!sharedDataCode.includes('"showcase"') || !sharedDataCode.includes('"icon"')) fail("spot-page-shared-data.js is missing projected showcase fields");
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
if (typeof generateSpotPage !== "function") fail("generate-spot-pages.mjs is missing the targeted single-page helper");

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
  if (options.includeShowcase) hosts.showcase = makeHost();
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
    showcase: hosts.showcase ? hosts.showcase.outerHTML : "",
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

function validateIbukiVideoMarkup(html, relativeFile) {
  const section = extractRegion(html, '<section class="spot-page-section spot-page-video-section" aria-labelledby="ibukiVideoTitle">', "</section>");
  if (!section) {
    fail(`${relativeFile} is missing the Ibuki video section`);
    return;
  }
  if (countMatches(section, /class="twitter-tweet"/g) !== 1 || !section.includes(`href="${IBUKI_X_POST_URL}"`) || !section.includes('class="spot-page-video-platform-note"')) {
    fail(`${relativeFile} changed or removed the existing X video embed/source link`);
  }
  if (countMatches(section, /class="spot-page-video-card"/g) !== IBUKI_YOUTUBE_VIDEOS.length + 1 || countMatches(section, /class="spot-page-video-frame"/g) !== IBUKI_YOUTUBE_VIDEOS.length + 1 || countMatches(section, /<iframe\b/g) !== IBUKI_YOUTUBE_VIDEOS.length) {
    fail(`${relativeFile} must render X and YouTube as three matching video cards`);
  }
  for (const video of IBUKI_YOUTUBE_VIDEOS) {
    const iframeStart = section.indexOf(`<iframe src="https://www.youtube-nocookie.com/embed/${video.id}"`);
    const iframeEnd = iframeStart >= 0 ? section.indexOf(">", iframeStart) + 1 : -1;
    const iframe = iframeStart >= 0 && iframeEnd > iframeStart ? section.slice(iframeStart, iframeEnd) : "";
    if (!iframe || !iframe.includes('title="伊吹山の車窓動画 ') || !iframe.includes('loading="lazy"') || !iframe.includes('referrerpolicy="strict-origin-when-cross-origin"') || !iframe.includes("allowfullscreen")) {
      fail(`${relativeFile} YouTube iframe ${video.id} is missing its generic title, lazy loading, referrer policy, or fullscreen support`);
    }
    if (countLiteral(section, `href="${video.url}"`) !== 1 || countLiteral(section, `>${video.url}</a>`) !== 1) {
      fail(`${relativeFile} is missing the visible exact source link for ${video.id}`);
    }
  }
}

function inspectShowcaseCards(markup) {
  const tagPattern = /<\/?a\b[^>]*>/gi;
  const cards = [];
  let depth = 0;
  let current = null;
  let match;
  while ((match = tagPattern.exec(markup))) {
    const tag = match[0];
    if (tag.startsWith("</")) {
      if (depth === 0) {
        fail("showcase contains an unmatched closing anchor");
        continue;
      }
      depth -= 1;
      if (depth === 0 && current) {
        current.html = markup.slice(current.start, tagPattern.lastIndex);
        cards.push(current);
        current = null;
      }
      continue;
    }
    if (depth === 0) {
      if (!/class="show-card(?:\s|\")/.test(tag)) {
        fail("showcase contains a top-level anchor that is not a show-card");
      }
      current = { start: match.index, nestedAnchors: 0, html: "" };
    } else if (current) {
      current.nestedAnchors += 1;
    }
    depth += 1;
  }
  if (depth !== 0 || current) fail("showcase contains an unclosed card anchor");
  return cards;
}

function validateShowcaseCards(markup, lang) {
  const cards = inspectShowcaseCards(markup);
  const expectedFeaturedCount = expected.showcase.length;
  if (cards.length !== expectedFeaturedCount + 1) {
    fail(`${lang} showcase expected ${expectedFeaturedCount + 1} cards, found ${cards.length}`);
    return;
  }
  const ctaCards = cards.filter((card) => card.html.includes('class="show-card show-card-cta"'));
  const featuredCards = cards.filter((card) => !card.html.includes('class="show-card show-card-cta"'));
  if (ctaCards.length !== 1 || cards[cards.length - 1] !== ctaCards[0] || featuredCards.length !== expectedFeaturedCount) {
    fail(`${lang} showcase card order or CTA count is invalid`);
  }
  for (const [index, card] of cards.entries()) {
    if (card.nestedAnchors !== 0 || countMatches(card.html, /<a\b/gi) !== 1) {
      fail(`${lang} showcase card ${index + 1} contains a nested anchor`);
    }
    if (!card.html.includes('class="show-guide-link"') || card.html.lastIndexOf('class="show-guide-link"') > card.html.lastIndexOf("</a>")) {
      fail(`${lang} showcase card ${index + 1} lost its action inside the card`);
    }
  }
  for (const [index, card] of featuredCards.entries()) {
    for (const [label, pattern] of [
      ["image", /<div class="show-media"><img\b/],
      ["name", /<strong>[^<]+<\/strong>/],
      ["credit", /<small class="show-credit">[^<]+<\/small>/],
      ["hook", /<span class="show-hook">[^<]+<\/span>/],
    ]) {
      if (!pattern.test(card.html)) fail(`${lang} showcase featured card ${index + 1} lost its ${label} inside the card`);
    }
  }
  const cta = ctaCards[0];
  if (cta && (!cta.html.includes('class="show-media show-media-cta"') || !cta.html.includes("<strong>") || !cta.html.includes('class="show-guide-link"'))) {
    fail(`${lang} showcase CTA card lost its visual or action content`);
  }
}

let baselineReadCount = 0;
let headReadCount = 0;
function readBaselineHTML(relativeFile) {
  if (!baselineAuditEnabled) throw new Error("internal validator error: baseline read attempted without --baseline");
  baselineReadCount += 1;
  return execFileSync("git", ["show", `${baselineCommit}:${relativeFile}`], { cwd: appDir, encoding: "utf8" });
}

function readHeadHTML(relativeFile) {
  headReadCount += 1;
  return execFileSync("git", ["show", `HEAD:${relativeFile}`], { cwd: appDir, encoding: "utf8" });
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
    const isJapaneseIbuki = relativeFile === PILOT_SPOT_PAGE;
    const headHTML = isJapaneseIbuki ? null : readHeadHTML(relativeFile);
    if (onDiskHTML !== html) fail(`${relativeFile} does not match the in-memory generator output`);
    if (!isJapaneseIbuki && onDiskHTML !== headHTML) fail(relativeFile + " changed outside the Japanese Ibuki pilot");

    const prefix = lang === "ja" ? "../" : "../../";
    const expectedBody = `<body class="spot-page" data-spot-page-shared-lang="${lang}" data-spot-page-shared-id="${spot.id}" data-spot-page-shared-root="${prefix}">`;
    if (!html.includes(`<html lang="${lang}">`)) fail(`${relativeFile} has incorrect html lang`);
    if ((html.match(/<body[^>]*>/)?.[0] || "") !== expectedBody) fail(`${relativeFile} has incorrect shared body context`);

    for (const name of ["topbar", "rail", "content-rail"]) {
      const exactHost = new RegExp(`<div data-spot-page-shared-module="${name}"></div>`, "g");
      const anyHost = new RegExp(`<div data-spot-page-shared-module="${name}"[^>]*>`, "g");
      if (countMatches(html, exactHost) !== 1 || countMatches(html, anyHost) !== 1) fail(`${relativeFile} must have exactly one strict empty ${name} host`);
    }
    const showcaseHost = '<div data-spot-page-shared-module="showcase"></div>';
    if (isJapaneseIbuki) {
      if (countLiteral(html, showcaseHost) !== 1) fail("Japanese Ibuki must have exactly one strict empty showcase host");
      if (countMatches(html, /data-spot-page-shared-module=/g) !== 4) fail(relativeFile + " must have exactly four shared module hosts");
    } else if (html.includes(showcaseHost) || countMatches(html, /data-spot-page-shared-module=/g) !== 3) {
      fail(relativeFile + " must not opt into the Japanese Ibuki showcase pilot");
    }
    if (isJapaneseIbuki) {
      if (html.includes('<div class="spot-page-related">') || html.includes("<h2>近くの車窓も見る</h2>")) {
        fail("Japanese Ibuki still contains the legacy in-article related section");
      }
      validateIbukiVideoMarkup(html, relativeFile);
    } else if (countMatches(html, /<div class="spot-page-related">/g) !== 1) {
      fail(relativeFile + " lost its legacy related section");
    }

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

    if (baselineAuditEnabled && !isJapaneseIbuki) {
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
  if (countMatches(rail, /data-affiliate-module/g) !== 0 || countMatches(rail, /class="affiliate-card"/g) !== 0) fail(`${lang} shared rail rendered affiliate presentation while disabled`);
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

function validateCurrentRail(rail, lang, currentId) {
  const marker = '<li class="spot-page-rail-row spot-page-rail-spot is-current">';
  const start = rail.indexOf(marker);
  const end = start >= 0 ? rail.indexOf("</li>", start) : -1;
  const row = start >= 0 && end > start ? rail.slice(start, end) : "";
  if (!row || countMatches(rail, /class="spot-page-rail-row spot-page-rail-spot is-current"/g) !== 1) {
    fail(lang + " current rail row is missing or duplicated");
    return;
  }
  if (!row.includes('href="' + currentId + '.html" aria-current="page"')) fail(lang + " current rail row lost its href or aria-current state");
  if (countMatches(row, /class="spot-page-shared-preview" aria-hidden="true"/g) !== 1 || !row.includes('class="spot-page-shared-preview-copy"')) {
    fail(lang + " current rail row does not contain exactly one shared enlarged preview card");
  }
  if (!row.includes('class="spot-page-rail-min"') || !row.includes('class="spot-page-rail-name"') || !row.includes('class="spot-page-shared-seat-group"')) {
    fail(lang + " current rail row lost the compact accessible fallback content");
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
  if (countMatches(ja.rail, /data-affiliate-module/g) !== 0) fail("ja renderer rendered shared affiliate modules while presentation is disabled");
  if (!ja.rail.includes('class="spot-page-shared-preview" aria-hidden="true"') || !ja.rail.includes('class="spot-page-shared-preview-copy"') || !ja.rail.includes('東京から約43分 ・ E席・山側')) fail("ja renderer did not render contextual preview cards with localized meta");
  if (!ja.rail.includes('class="spot-page-shared-seat-group" aria-label="E席・山側"')) fail("ja renderer did not render accessible boxed seat groups");
  if (countMatches(ja.content, /class="content-rail-card"/g) !== 8) fail("ja renderer did not render all 8 content cards");

  const hamanako = runRendererSmoke("ja", "../", "hamanako");
  if (!hamanako.rail.includes('href="hamanako.html" aria-current="page"')) fail("Lake Hamana renderer did not preserve the current spot highlight");
  if (!hamanako.rail.includes('<b>浜名湖</b>東京から約73分 ・ A席・海側 / E席・山側')) fail("Lake Hamana renderer did not preserve the full both-side now line");
  if (!hamanako.rail.includes('class="spot-page-shared-seat-group" aria-label="A席・海側 / E席・山側"><span class="spot-page-shared-seat is-a">A</span><span class="spot-page-shared-seat is-e">E</span>')) fail("Lake Hamana renderer did not render both boxed seat badges");
  if (!hamanako.rail.includes('727看板と248看板') || !hamanako.rail.includes('aria-label="A席・E席"')) fail("both-side 727 seat projection is missing");

  const showcaseFailuresBefore = failures.length;
  const ibuki = runRendererSmoke("ja", "../", "ibuki", { includeShowcase: true });
  validateRenderedRail(ibuki.rail, "ja", "../");
  validateCurrentRail(ibuki.rail, "ja", "ibuki");
  validateShowcaseCards(ibuki.showcase, "ja");
  if (!ibuki.showcase.includes('aria-labelledby="spotPageShowcaseTitle"') || !ibuki.showcase.includes('<h2 id="spotPageShowcaseTitle">ほかにも、こんな車窓</h2>')) fail("Japanese Ibuki showcase title or heading association is missing");
  if (countMatches(ibuki.showcase, /class="show-card(?: |")/g) !== expected.showcase.length + 1) fail("Japanese Ibuki showcase did not render all featured cards and its field-guide CTA");
  if (!ibuki.showcase.includes('href="../spots/fuji.html"') || !ibuki.showcase.includes("日本でいちばん有名な3分間。") || !ibuki.showcase.includes('src="../images/thumbs/20210218_fuji_rumireport.webp"')) fail("Japanese Ibuki showcase did not project the TOP Fuji card through shared data");
  if (ibuki.showcase.includes("近くの車窓も見る") || ibuki.showcase.includes("data-affiliate-module")) fail("Japanese Ibuki showcase contains legacy related copy or affiliate presentation");

  const en = runRendererSmoke("en", "../../", "fuji");
  validateRenderedRail(en.rail, "en", "../../");
  if (!en.header.includes('<a href="../../en/#journey">Train Search</a>')) fail("en renderer did not preserve the exact header Train Search URL");
  if (!en.rail.includes('<a class="spot-page-rail-cta" href="../../en/#journey">')) fail("en renderer did not preserve the exact rail CTA URL");
  if (!en.header.includes('href="../../spots/fuji.html?lang=ja"')) fail("en renderer did not preserve the legacy Japanese language-switch URL");
  if (!en.content.includes('href="../../en/?intro=1"')) fail("en renderer did not preserve the About link URL");
  if (!en.rail.includes('About 43 min from Tokyo ・ Seat E · mountain side')) fail("en renderer did not localize contextual preview timing and side meta");
  if (countMatches(en.rail, /data-affiliate-module/g) !== 0 || countMatches(en.rail, /class="affiliate-card"/g) !== 0) fail("en renderer rendered shared affiliate modules while presentation is disabled");
  const enHamanako = runRendererSmoke("en", "../../", "hamanako");
  validateRenderedRail(enHamanako.rail, "en", "../../");
  validateCurrentRail(enHamanako.rail, "en", "hamanako");
  if (!enHamanako.header.includes('<a class="active" href="hamanako.html">') || !enHamanako.header.includes('href="../../spots/hamanako.html?lang=ja"')) fail("en renderer did not preserve the non-Fuji current/language-switch links");
  if (!enHamanako.rail.includes('href="hamanako.html" aria-current="page"') || !enHamanako.rail.includes('About 73 min from Tokyo ・ Seat A · sea side / Seat E · mountain side')) fail("en renderer did not preserve the non-Fuji current both-side context");
  const enShowcase = runRendererSmoke("en", "../../", "hamanako", { includeShowcase: true });
  validateShowcaseCards(enShowcase.showcase, "en");
  if (failures.length === showcaseFailuresBefore) console.log("Showcase card structure passed: ja/en 10 cards, no nested anchors, and featured image/name/credit/hook/action content remains inside each card.");
  validateNegativeSafetyFixtures();
  if (failures.length === smokeFailuresBefore) console.log("Renderer smoke passed: ja/en, affiliate-off rail, contextual cards, Fuji current state, Ibuki showcase, and Lake Hamana A+E both-side state.");
} catch (error) {
  fail(`renderer smoke failed: ${error && error.message ? error.message : error}`);
}

const legacySharedPages = allSpotPages.filter((relativeFile) => {
  const html = fs.readFileSync(path.join(appDir, relativeFile), "utf8");
  return html.includes('<header class="topbar">') || html.includes('<aside class="spot-page-rail') || html.includes('<section class="content-rail-section');
});
if (legacySharedPages.length !== 0) fail(`expected 0 legacy spot pages, found ${legacySharedPages.join(", ")}`);
if (generatedSpotPages.length !== expectedPageCount || generatedSpotPages.some((page) => {
  const expectedHostCount = page.relativeFile === PILOT_SPOT_PAGE ? 4 : 3;
  return countMatches(page.html, /data-spot-page-shared-module=/g) !== expectedHostCount;
})) fail(`not all generated spot pages contain the expected shared hosts (${expectedPageCount} expected)`);
if (baselineAuditEnabled && baselineReadCount !== expectedPageCount) fail(`baseline audit read ${baselineReadCount} pages, expected ${expectedPageCount}`);
if (!baselineAuditEnabled && baselineReadCount !== 0) fail("default validation unexpectedly read a git baseline");
if (headReadCount !== expectedPageCount - 1) fail(`HEAD scope audit read ${headReadCount} pages, expected ${expectedPageCount - 1}`);

if (failures.length) throw new Error(`Shared spot-page validation failed:\n- ${failures.join("\n- ")}`);
console.log(`Shared data matches data.js: ${expected.spots.length} spots, ${expected.stations.length} stations.`);
console.log(`Rail projection represents ${expected.spots.length} spots and ${expected.stations.length} stations (${expected.spots.length + expected.stations.length} ordered rows).`);
console.log(`In-memory spot generator regeneration test passed: all ${expectedPageCount} Japanese and English spot pages use shared chrome with 0 legacy pages.`);
console.log(`All ${expectedSpotCount} Japanese and English spot links render image, name, timing, full side label, and contextual preview copy.`);
console.log("Shared spot rails render zero affiliate modules; legacy affiliate markup remains reusable and is globally hidden.");
if (baselineAuditEnabled) {
  console.log(`Baseline audit passed: all non-pilot unique head/SEO, hero, article, lightbox, map, mobile affiliate, and tracking regions match ${baselineLabel}; Japanese Ibuki is covered by its explicit pilot parity assertions.`);
} else {
  console.log("Baseline audit skipped: no --baseline supplied; no git baseline resolution, reads, or comparisons performed.");
}

async function runThinValidator() {
  const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dataPath = path.join(appDir, "spot-page-shared-data.js");
  const rendererPath = path.join(appDir, "spot-page-shared.js");
  const stylesheetPath = path.join(appDir, "style.css");
  const sharedDataCode = fs.readFileSync(dataPath, "utf8");
  const rendererCode = fs.readFileSync(rendererPath, "utf8");
  const stylesheetCode = fs.readFileSync(stylesheetPath, "utf8");
  const sourceContext = {};
  vm.runInNewContext(`${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\nglobalThis.__SOURCE = { SPOTS, ROUTE };`, sourceContext, { filename: path.join(appDir, "data.js") });
  const source = sourceContext.__SOURCE;
  const dataContext = {};
  vm.runInNewContext(sharedDataCode, dataContext, { filename: dataPath });
  const payload = dataContext.MADO_SPOT_PAGE_SHARED_DATA;
  const errors = [];
  const fail = (message) => errors.push(message);

  function parseArgs(args) {
    if (!args.length) return null;
    if (args.length === 2 && args[0] === "--baseline" && args[1] && !args[1].startsWith("-")) return args[1];
    throw new Error("Usage: node scripts/validate-spot-page-shared.mjs [--baseline <git-ref>]");
  }

  function assertCLIContract() {
    if (parseArgs([]) !== null) throw new Error("CLI contract: default mode selected a baseline");
    for (const args of [["--unknown"], ["--baseline"], ["--baseline", "a", "b"], ["--baseline", "-HEAD"]]) {
      let rejected = false;
      try { parseArgs(args); } catch { rejected = true; }
      if (!rejected) throw new Error(`CLI contract: malformed args were accepted: ${args.join(" ")}`);
    }
  }

  assertCLIContract();

  const baselineSelector = parseArgs(process.argv.slice(2));
  let baselineCommit = null;
  if (baselineSelector) baselineCommit = execFileSync("git", ["rev-parse", "--verify", `${baselineSelector}^{commit}`], { cwd: appDir, encoding: "utf8" }).trim();

  function localizedValue(value, lang) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    return value[lang] || value.ja || value.en || "";
  }

  function escape(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function count(value, pattern) {
    return value.match(pattern)?.length || 0;
  }

  function safeAsset(value) {
    return typeof value === "string" && value.startsWith("images/") && !value.includes("..") && !value.includes("\\") && !/[?#]/.test(value);
  }

  function strictHostHTML(lang, id, rootPath) {
    return `<body class="spot-page" data-spot-page-shared-lang="${lang}" data-spot-page-shared-id="${id}" data-spot-page-shared-root="${rootPath}" data-spot-page-shared-mode="page">`;
  }

  function makeHost() {
    let rendered = "";
    const attrs = {};
    const host = {
      className: "",
      textContent: "",
      classList: { contains: (name) => host.className.split(/\s+/).includes(name) },
      setAttribute(name, value) { attrs[name] = String(value); },
      getAttribute(name) { return attrs[name] || null; },
    };
    Object.defineProperty(host, "outerHTML", { get: () => rendered, set: (value) => { rendered = String(value); } });
    return host;
  }

  function renderPage(lang, rootPath, currentId, mutateData) {
    const host = makeHost();
    const createdScripts = [];
    const lightboxImage = { src: "" };
    const lightbox = {
      hidden: true,
      __madoBound: false,
      querySelector(selector) { return selector === "img" ? lightboxImage : { textContent: "" }; },
      addEventListener() {},
    };
    const body = {
      classList: { contains: (name) => name === "spot-page" },
      getAttribute(name) {
        return { "data-spot-page-shared-lang": lang, "data-spot-page-shared-id": currentId, "data-spot-page-shared-root": rootPath, "data-spot-page-shared-mode": "page" }[name] || null;
      },
    };
    const document = {
      body,
      documentElement: { style: {} },
      head: { appendChild(script) { createdScripts.push(script); } },
      createElement() { return { async: false, src: "", charset: "" }; },
      getElementById(id) { return id === "spotPageLightbox" ? lightbox : null; },
      addEventListener() {},
      querySelectorAll(selector) {
        if (selector.includes('data-spot-page-shared-module="page"')) return [host];
        return [];
      },
    };
    const console = { error(message) { errors.push(String(message)); } };
    const context = { document, console };
    context.window = context;
    vm.runInNewContext(sharedDataCode, context, { filename: dataPath });
    if (mutateData) mutateData(context.MADO_SPOT_PAGE_SHARED_DATA);
    vm.runInNewContext(rendererCode, context, { filename: rendererPath });
    return { html: host.outerHTML, host, createdScripts, errors: errors.splice(0) };
  }

  function assertPageSafety(page, spot, lang) {
    if (!page || page.id !== spot.id || page.lang !== lang || !page.hero || !Array.isArray(page.gallery) || !page.gallery.length || typeof page.photoHeadingCustom !== "boolean") fail(`payload page missing for ${spot.id}/${lang}`);
    if (!page.stamp || !safeAsset(page.stamp.src)) fail(`${spot.id}/${lang} stamp path is unsafe`);
    for (const photo of [...(page.photos || []), ...(page.gallery || []), ...(page.inline || [])]) {
      if (!safeAsset(photo.src) || !safeAsset(photo.thumb) || (photo.sourceUrl && !/^https?:\/\/[^\s<>"']+$/i.test(photo.sourceUrl))) fail(`${spot.id}/${lang} photo path/source is unsafe`);
    }
    for (const link of [...(page.bodyLinks || []), ...(page.references || [])]) if (!/^https?:\/\/[^\s<>"']+$/i.test(link.href)) fail(`${spot.id}/${lang} external link is unsafe`);
    if (page.media) for (const video of page.media.videos) {
      if (video.kind === "x" && !/^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+(?:\/video\/\d+)?$/.test(video.url)) fail(`${spot.id}/${lang} X URL shape is unsafe`);
      if (video.kind === "youtube" && (!/^[A-Za-z0-9_-]{11}$/.test(video.id) || !/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(video.url))) fail(`${spot.id}/${lang} YouTube URL/id is unsafe`);
    }
  }

  if (!source || !Array.isArray(source.SPOTS) || !payload || payload.version !== 2 || payload.affiliatesEnabled !== false) fail("shared payload version/source/affiliate flag is invalid");
  const sourceIds = source.SPOTS.map((spot) => spot.id);
  const payloadIds = Object.keys(payload.pages || {});
  const expectedSpotCount = sourceIds.length;
  const expectedStationCount = Array.isArray(source.ROUTE?.refStations) ? source.ROUTE.refStations.length : 0;
  const expectedPageCount = expectedSpotCount * 2;
  if (GENERATED_SPOTS.length !== expectedSpotCount || JSON.stringify(GENERATED_SPOTS.map((spot) => spot.id)) !== JSON.stringify(sourceIds)) fail("generator/source spot ids are out of alignment");
  if (payloadIds.length !== expectedSpotCount || JSON.stringify(payloadIds) !== JSON.stringify(sourceIds)) fail(`payload/source spot count or order mismatch: source=${expectedSpotCount}, pages=${payloadIds.length}`);
  if (!Array.isArray(payload.stations) || payload.stations.length !== expectedStationCount) fail(`payload station count does not match data.js: source=${expectedStationCount}, payload=${payload.stations?.length || 0}`);
  const allowedVideoSpots = new Set(["ibuki", "fujitec-big-wing", "fuji", "hamanako"]);
  const expectedVideoRecords = {
    ibuki: [
      { kind: "x", url: "https://x.com/730AEVA/status/1838917502124056760", handle: "@730AEVA" },
      { kind: "youtube", url: "https://www.youtube.com/watch?v=yQKej6npo8g", id: "yQKej6npo8g" },
      { kind: "youtube", url: "https://www.youtube.com/watch?v=puK5Tr_2Sxo", id: "puK5Tr_2Sxo" },
    ],
    "fujitec-big-wing": [
      { kind: "x", url: "https://x.com/Train205turumai/status/2070756242637967619", handle: "@Train205turumai" },
    ],
    fuji: [
      { kind: "x", url: "https://x.com/cram_box/status/2013542376887984274", handle: "@cram_box" },
      { kind: "x", url: "https://x.com/fu_min_p/status/2004337753350340699/video/1", handle: "@fu_min_p" },
    ],
    hamanako: [
      { kind: "x", url: "https://x.com/KS_1013/status/2075104617000743133", handle: "@KS_1013" },
    ],
  };
  const expectedVideoPageCount = source.SPOTS.filter((spot) => allowedVideoSpots.has(spot.id)).length * 2;
  let renderedVideoPageCount = 0;
  for (const spot of source.SPOTS) {
    if (!payload.pages[spot.id] || !payload.pages[spot.id].ja || !payload.pages[spot.id].en) fail(`${spot.id} does not have both page languages`);
    for (const lang of ["ja", "en"]) {
      const page = payload.pages[spot.id][lang];
      assertPageSafety(page, spot, lang);
      const expectedGalleryCount = page.photos.length - (spot.id === "ibuki" && lang === "ja" ? 0 : page.inline.length);
      if (page.gallery.length !== expectedGalleryCount || expectedGalleryCount < 1) fail(`${spot.id}/${lang} gallery count is not derived from the structured photo source`);
      const inlineSources = new Set((page.inline || []).map((photo) => photo.src));
      const referenceSources = new Set((spot.photos || []).filter((photo) => photo.role === "reference").map((photo) => photo.src));
      if (spot.id !== "ibuki" && page.gallery.some((photo) => inlineSources.has(photo.src))) fail(`${spot.id}/${lang} inline article photo was duplicated in the hero gallery`);
      if (page.gallery.some((photo) => referenceSources.has(photo.src))) fail(`${spot.id}/${lang} reference photo was duplicated in the hero gallery`);
      if (page.media && !allowedVideoSpots.has(spot.id)) fail(`${spot.id}/${lang} unexpectedly has a video section`);
      if (page.media) renderedVideoPageCount += 1;
      if (!page.media && allowedVideoSpots.has(spot.id)) fail(`${spot.id}/${lang} is missing its structured video section`);
      const expectedVideos = expectedVideoRecords[spot.id] || [];
      const sourceVideos = Array.isArray(spot.media?.videos) ? spot.media.videos : [];
      const projectedVideos = page.media?.videos || [];
      if (sourceVideos.length !== expectedVideos.length || projectedVideos.length !== expectedVideos.length) fail(`${spot.id}/${lang} video count does not match the structured source contract`);
      expectedVideos.forEach((expectedVideo, index) => {
        const sourceVideo = sourceVideos[index];
        const projectedVideo = projectedVideos[index];
        if (!sourceVideo || sourceVideo.kind !== expectedVideo.kind || sourceVideo.url !== expectedVideo.url || (expectedVideo.handle && sourceVideo.handle !== expectedVideo.handle) || (expectedVideo.id && sourceVideo.id !== expectedVideo.id) || !projectedVideo || projectedVideo.kind !== expectedVideo.kind || projectedVideo.url !== expectedVideo.url || (expectedVideo.handle && projectedVideo.handle !== expectedVideo.handle) || (expectedVideo.id && projectedVideo.id !== expectedVideo.id)) {
          fail(`${spot.id}/${lang} video source record ${index + 1} does not match the exact URL/handle/id contract`);
        }
      });
      const stampPath = path.join(appDir, page.stamp.src);
      if (!fs.existsSync(stampPath)) fail(`${spot.id}/${lang} stamp file is missing`);
      const stampCode = fs.readFileSync(stampPath, "utf8");
      if (!stampCode.includes('id="stampInk"') || !stampCode.includes('filter="url(#stampInk)"')) fail(`${spot.id}/${lang} stamp is missing the shared distressed-ink filter`);
      for (const photo of [...page.photos, ...page.gallery, ...(page.inline || [])]) {
        if (!fs.existsSync(path.join(appDir, photo.src))) fail(`${spot.id}/${lang} gallery image is missing: ${photo.src}`);
        if (!fs.existsSync(path.join(appDir, photo.thumb))) fail(`${spot.id}/${lang} gallery thumbnail is missing: ${photo.thumb}`);
      }
    }
  }
  if (!stylesheetCode.includes(".spot-page-video-grid") || !stylesheetCode.includes("grid-template-columns: repeat(2") || !stylesheetCode.includes("grid-template-columns: 1fr") || !stylesheetCode.includes(".spot-page-heading-row") || !stylesheetCode.includes(".spot-page-stamp") || !stylesheetCode.includes("position: absolute") || !stylesheetCode.includes("mix-blend-mode: multiply") || !stylesheetCode.includes("[data-affiliate-module]") || !stylesheetCode.includes(".spot-page-rail-affiliate-group") || !stylesheetCode.includes(".spot-page-mobile-affiliate-note")) fail("shared gallery/video/stamp/affiliate CSS contract is incomplete");
  if (!rendererCode.includes("function pageGalleryHTML") || !rendererCode.includes("function pageMediaHTML") || !rendererCode.includes("ensureXWidgetsScript")) fail("shared renderer is missing the common gallery/video/X contract");

  const expectedPages = [];
  const currentPages = [];
  for (const lang of ["ja", "en"]) {
    for (const spot of GENERATED_SPOTS) {
      const relativeFile = `${lang === "ja" ? "spots" : "en/spots"}/${spot.id}.html`;
      const absoluteFile = path.join(appDir, relativeFile);
      if (!fs.existsSync(absoluteFile)) { fail(`${relativeFile} is missing`); continue; }
      const onDisk = fs.readFileSync(absoluteFile, "utf8");
      const generatedHTML = spotPageHTML(spot, lang);
      expectedPages.push(relativeFile);
      currentPages.push(relativeFile);
      if (onDisk !== generatedHTML) fail(`${relativeFile} does not match in-memory thin generation`);
      const bodyTag = onDisk.match(/<body[^>]*>/)?.[0] || "";
      const prefix = lang === "ja" ? "../" : "../../";
      if (bodyTag !== strictHostHTML(lang, spot.id, prefix)) fail(`${relativeFile} body context/mode is incorrect`);
      if (count(onDisk, /data-spot-page-shared-module=/g) !== 1 || count(onDisk, /<div data-spot-page-shared-module="page"><\/div>/g) !== 1) fail(`${relativeFile} must have exactly one strict thin page host`);
      const body = onDisk.slice(onDisk.indexOf("<body"));
      if (/<header|<main|<article|<aside|<iframe|<blockquote|<figure|data-affiliate-module|spot-page-mobile-affiliate|spotPageLightbox|affiliate\.klook|valuecommerce|amazon\.co\.jp|ad\.jp\.ap|ck\.jp\.ap|<script>/.test(body)) fail(`${relativeFile} contains legacy body markup/runtime or affiliate residue`);
      const scripts = [
        `<script src="${prefix}spot-page-shared-data.js"></script>`,
        `<script src="${prefix}spot-page-shared.js"></script>`,
        `<script src="${prefix}spot-media-gallery.js?v=20260811-ibuki-pilot"></script>`,
        `<script src="${prefix}spot-map.js?v=20260707-map-mode-switch"></script>`,
      ];
      let previous = -1;
      for (const script of scripts) {
        const index = onDisk.indexOf(script);
        if (count(onDisk, new RegExp(script.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) !== 1 || index <= previous) fail(`${relativeFile} shared script order/path is invalid`);
        previous = index;
      }
      const page = payload.pages[spot.id][lang];
      const normalizedHead = (html) => (html.match(/<head>[\s\S]*?<\/head>/i)?.[0] || "").replace(/\s*<link rel="stylesheet" href="[^"]*spot-media-gallery\.css[^"]*">/g, "").replace(/\s+/g, " ").trim();
      if (baselineCommit) {
        const baselineHTML = execFileSync("git", ["show", `${baselineCommit}:${relativeFile}`], { cwd: appDir, encoding: "utf8" });
        if (normalizedHead(onDisk) !== normalizedHead(baselineHTML)) fail(`${relativeFile} static SEO/head changed from explicit baseline ${baselineSelector} (${baselineCommit})`);
      }
      const rendered = renderPage(lang, prefix, spot.id);
      if (rendered.errors.length) fail(`${relativeFile} renderer failed: ${rendered.errors.join(" | ")}`);
      const output = rendered.html;
      if (count(output, /<h1\b/g) !== 1 || count(output, /class="spot-page-stamp"/g) !== 1 || !output.includes(`href="${lang === "ja" ? prefix + "journal.html#stampboard" : prefix + "en/journal.html#stampboard"}"`) || !output.includes(`src="${prefix}${page.stamp.src}"`)) fail(`${relativeFile} H1/stamp contract is invalid`);
      if (count(output, /data-spot-media-gallery/g) !== 1 || count(output, /data-gallery-thumb/g) !== page.gallery.length || count(output, /data-gallery-image/g) !== 1) fail(`${relativeFile} common selectable gallery count is invalid`);
      if (page.inline.length && count(output, /spot-page-inline-figure/g) !== page.inline.length) fail(`${relativeFile} inline photo module count is invalid`);
      if (page.photoHeadingCustom && !output.includes(escape(page.photoHeading))) fail(`${relativeFile} custom photo heading is missing from the shared gallery`);
      if (page.referenceImage && !output.includes("spot-page-reference-section")) fail(`${relativeFile} reference image module is missing`);
      if (page.explainer?.figure && !output.includes("spot-page-explainer-figure")) fail(`${relativeFile} explainer figure module is missing`);
      if (page.photoTip && !output.includes("spot-page-phototip")) fail(`${relativeFile} photo tip module is missing`);
      if (page.sharedGuide.length && !output.includes(page.sharedGuide[0].id)) fail(`${relativeFile} shared guide module is missing`);
      if (page.guideNotice && !output.includes("guide-answer-panel")) fail(`${relativeFile} guide alias notice is missing`);
      if (count(output, /spot-page-showcase/g) !== 1 || !output.includes("spotPageShowcaseTitle")) fail(`${relativeFile} shared full-width showcase composition is missing`);
      if (output.includes("spot-page-related") || output.includes("近くの車窓も見る") || output.includes("Nearby window views")) fail(`${relativeFile} rendered the retired in-article related section`);
      if (page.media) {
        if (count(output, /spot-page-video-section/g) !== 1 || count(output, /spot-page-video-card/g) !== page.media.videos.length || count(output, /spot-page-video-platform-note/g) !== 1) fail(`${relativeFile} shared video-card/footnote contract is invalid`);
        for (const video of page.media.videos) {
          if (!output.includes(`href="${video.url}"`) || (video.kind === "x" && !output.includes(escape(video.handle))) || (video.kind === "youtube" && !output.includes(`youtube-nocookie.com/embed/${video.id}`))) fail(`${relativeFile} video source/embed is incomplete`);
        }
        if (rendered.createdScripts.filter((script) => script.src === "https://platform.twitter.com/widgets.js").length !== (page.media.videos.some((video) => video.kind === "x") ? 1 : 0)) fail(`${relativeFile} X widgets script count is invalid`);
      } else if (["spot-page-video-section", "spot-page-video-platform-note", "spot-page-video-grid", "spot-page-video-card", "spotVideoTitle-"].some((needle) => output.includes(needle))) {
        fail(`${relativeFile} rendered a video heading, footnote, container, or card without structured videos`);
      }
      const affiliateNeedles = ["data-affiliate-module", "spot-page-mobile-affiliate", "AFFILIATE LINKS", "アフィリエイトリンク", "affiliate.klook", "valuecommerce", "amazon.co.jp", "ad.jp.ap", "ck.jp.ap", "class=\"affiliate-card\"", "spot-page-rail-affiliate"];
      if (affiliateNeedles.some((needle) => output.includes(needle))) fail(`${relativeFile} rendered affiliate residue while disabled`);
    }
  }
  if (expectedPages.length !== expectedPageCount || currentPages.length !== expectedPageCount) fail(`expected exactly ${expectedPageCount} spot pages, found ${currentPages.length}`);
  if (renderedVideoPageCount !== expectedVideoPageCount) fail(`expected ${expectedVideoPageCount} video pages from the structured source, found ${renderedVideoPageCount}`);

  const reps = [
    ["ibuki", "ja"], ["hamanako", "ja"], ["kiyosu", "ja"], ["nagoya-station-skyline", "ja"], ["gifu-castle", "ja"], ["fuji", "ja"], ["odawara-castle", "ja"], ["hamanako", "en"],
  ];
  for (const [id, lang] of reps) {
    const prefix = lang === "ja" ? "../" : "../../";
    const result = renderPage(lang, prefix, id);
    const page = payload.pages[id][lang];
    if (!result.html || result.errors.length) fail(`representative ${id}/${lang} renderer failed`);
    if (id === "ibuki" && (page.gallery.length !== 3 || page.media.videos.length !== 3 || count(result.html, /class="twitter-tweet"/g) !== 1 || count(result.html, /youtube-nocookie.com\/embed\//g) !== 2)) fail("Ibuki representative content/video contract failed");
    if (id === "hamanako" && (!page.sharedGuide.length || !page.photoHeading.includes("浜名湖") || !result.html.includes("hamanako-fuji"))) fail("Hamanako representative composition failed");
    if (id === "kiyosu" && (!page.photoTip || !result.html.includes("spot-page-phototip"))) fail("Kiyosu photoTip representative failed");
    if (id === "nagoya-station-skyline" && (!page.explainer?.figure || !result.html.includes("spot-page-explainer-figure"))) fail("Nagoya explainer-figure representative failed");
    if (id === "gifu-castle" && (!page.referenceImage || !result.html.includes("spot-page-reference-section"))) fail("Gifu reference-image representative failed");
    if (id === "fuji" && (!page.fujiGuide || !result.html.includes("guide.html"))) fail("Fuji FAQ representative failed");
    if (id === "odawara-castle" && (!page.map.viewpoint || !page.map.viewpointUrl)) fail("Odawara Castle viewpoint fallback representative failed");
  }
  if (payload.pages.hamanako.ja.sideLabel !== "A席・海側 / E席・山側" || payload.pages["727-board"].ja.sideLabel !== "A席・E席") fail("A+E side projection is missing");

  const safety = renderPage("ja", "../", "fuji", (data) => { data.pages.fuji.ja.hero.src = "images/../escape.png"; });
  if (!safety.errors.some((message) => message.includes("shared page asset path is malformed")) || safety.host.className !== "spot-page-shared-error") fail("malformed asset path fixture did not fail closed");
  const rootSafety = renderPage("ja", "https://evil.example/", "fuji");
  if (!rootSafety.errors.some((message) => message.includes("relative root is required"))) fail("malformed root fixture did not fail closed");
  const idSafety = renderPage("ja", "../", "../fuji");
  if (!idSafety.errors.some((message) => message.includes("language or current spot context is malformed"))) fail("malformed current ID fixture did not fail closed");
  const payloadSafety = renderPage("ja", "../", "fuji", (data) => { data.pages.fuji.ja.name = `<img src=x onerror=alert(1)>`; data.pages.fuji.ja.sideLabel = `\" onmouseover=alert(1) x=\"`; });
  if (payloadSafety.html.includes("<img src=x onerror=alert(1)>") || payloadSafety.html.includes("onmouseover=alert(1)")) fail("page text payload was not escaped");

  if (errors.length) throw new Error(`Thin shared spot-page validation failed:\n- ${errors.join("\n- ")}`);
  console.log(`Thin shared validator passed: ${expectedSpotCount} source spots × 2 languages = ${expectedPageCount} pages, exactly one page host each, 0 legacy body/affiliate residue.`);
  console.log(`Payload schema v${payload.version} covers ${payloadIds.length} ids × ja/en and ${expectedStationCount} stations; generated artifact bytes: ${Buffer.byteLength(sharedDataCode, "utf8")}.`);
  console.log(`Gallery contract passed for all ${expectedPageCount} pages; no-video pages omit the entire video chapter, and ${renderedVideoPageCount} structured video pages passed the shared 2-column/1-column CSS contract.`);
  console.log(`All ${expectedPageCount} pages render the shared full-width showcase, retire the in-article related block, and use one of ${expectedSpotCount} distressed-ink stamp SVGs behind an unshifted H1.`);
  console.log(baselineCommit ? `Explicit baseline audit passed against ${baselineSelector} (${baselineCommit}); default mode performs no git baseline reads.` : "Baseline audit skipped: default mode performs no git baseline resolution or reads.");
}
