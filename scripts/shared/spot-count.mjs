import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// Single build-time source for "how many window views does this site cover".
//
// The runtime already has one: app.js derives MADO_SPOT_COUNT from SPOTS and builds
// every i18n string from it, and validate-content.mjs pins that. What had no single
// source was the STATIC html — <title>, <meta description>, og/twitter cards and the
// hand-written body copy. Those are exactly the strings search engines and social
// cards read, and they had drifted to four different numbers at once (36/37/38/39
// while data.js held 40), including a page whose <title> said 37 and whose body said 39.
//
// The old mechanism (replaceSpotCountClaims in generate-spot-pages.mjs) keyed its
// replacement table on the literal "37", so the moment anyone hand-edited a number
// to 39 that string fell out of the mechanism permanently and could never be synced
// again. This module keys on the *phrase* instead and treats the number as unknown,
// so a claim can never escape by being edited.

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dataPath = path.join(appDir, "data.js");

const { SPOTS } = vm.runInNewContext(
  `${fs.readFileSync(dataPath, "utf8")}\n;({ SPOTS });`,
  {},
  { filename: dataPath },
);

/** Total window views. Same value as app.js MADO_SPOT_COUNT. The only count we state. */
export const SPOT_COUNT = SPOTS.length;

// There used to be a second derived number here, "Mt. Fuji plus N more views".
// It was wrong: five of the spots are Mt. Fuji seen from different points
// (fuji, ota-fuji, sagami-fuji, left-fuji, hamanako-fuji), so subtracting one
// counted the other four as though they were not Mt. Fuji. It was also the only
// source of ambiguity in this module — the same suffix means the full set in one
// language and the minus-one set in another, so every claim had to be classified
// before it could be checked, and a misclassification silently wrote a wrong number.
// The pages now state the total and nothing else.

/** Pages whose static HTML states a spot count. */
export const SPOT_COUNT_PAGES = [
  "index.html",
  "guide.html",
  "zukan.html",
  "en/index.html",
  "en/guide.html",
  "en/zukan.html",
  "en/jr-pass-fuji.html",
  "fr/guide.html",
  "ko/guide.html",
  "zh-Hans/guide.html",
  "zh-Hant/guide.html",
  "ar/guide.html",
];

// Number + unit, across all seven languages. Longest first so that
// "の車窓スポット" wins over "の車窓" and "个精选车窗景色" over "个景色".
const UNITS = [
  "の車窓スポット",
  "個車窗景色",
  "个精选车窗景色",
  "个车窗景色",
  "の車窓",
  "個景色",
  "个景色",
  "개의 차창 풍경",
  "개 차창 풍경",
  "개 풍경",
  "景",
  " Day and Night Views",
  " curated window views",
  " window views",
  " more views",
  " Tokaido Shinkansen",
  " views",
  " paysages",
  " vues",
  " مشهدًا",
];

// Numbers that look like a claim but are not one.
const NOT_A_CLAIM = [
  "夜だけの車窓#景", // the night-views page covers a subset, not the whole set
];

const unitPattern = new RegExp(
  `(\\d{1,3})(${UNITS.map((unit) => unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g",
);

function templateToRegExp(template) {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped.replace("#", "(\\d{1,3})"), "g");
}

/** Byte offsets of the digits inside every occurrence of the given templates. */
function digitOffsets(html, templates) {
  const offsets = new Set();
  for (const template of templates) {
    const re = templateToRegExp(template);
    for (const match of html.matchAll(re)) {
      offsets.add(match.index + match[0].indexOf(match[1]));
    }
  }
  return offsets;
}

/**
 * Every spot-count claim in the page. Each one must equal SPOT_COUNT.
 * Returns [{ index, raw, unit, actual, expected }].
 */
export function scanSpotCountClaims(html) {
  const ignored = digitOffsets(html, NOT_A_CLAIM);
  const claims = [];
  for (const match of html.matchAll(unitPattern)) {
    if (ignored.has(match.index)) continue;
    claims.push({
      index: match.index,
      raw: match[0],
      unit: match[2],
      actual: Number(match[1]),
      expected: SPOT_COUNT,
    });
  }
  return claims;
}

// Safety net. Any number sitting just before a counting noun is probably a claim
// about how many views the site covers. If the scanner above did not already
// classify it, it is an unregistered claim and the build should stop rather than
// let a fifth number quietly join the other four.
const COUNT_NOUNS = "views|景|風景|景色|車窓|车窗|車窗|풍경|vues|paysages|مشهدًا";
// Exclusions, in order: part of an identifier such as the css class "g9-more";
// a duration ("43 min", "3分間", "147分鐘"); a step number ("2 · 主要景色").
const countLikePattern = new RegExp(
  `(?<![A-Za-z0-9])(\\d{1,3})(?!\\d)` +
    `(?!\\s*(?:分|min\\b|秒))` +
    `(?!\\s*[·・])` +
    `(?=[^<>]{0,26}?(?:${COUNT_NOUNS}))`,
  "g",
);

export function findUnregisteredCountClaims(html) {
  const known = new Set(scanSpotCountClaims(html).map((claim) => claim.index));
  const ignored = digitOffsets(html, NOT_A_CLAIM);
  const found = [];
  for (const match of html.matchAll(countLikePattern)) {
    if (known.has(match.index) || ignored.has(match.index)) continue;
    found.push({
      index: match.index,
      actual: Number(match[1]),
      context: html.slice(Math.max(0, match.index - 40), match.index + 40).replace(/\s+/g, " "),
    });
  }
  return found;
}

/** Claims whose number disagrees with data.js. */
export function findSpotCountDrift(html) {
  return scanSpotCountClaims(html).filter((claim) => claim.actual !== claim.expected);
}

/** Rewrite every claim to the live count. Safe to run repeatedly. */
export function syncSpotCountClaims(html) {
  const drift = findSpotCountDrift(html);
  if (drift.length === 0) return html;
  let result = "";
  let cursor = 0;
  for (const claim of drift) {
    result += html.slice(cursor, claim.index) + String(claim.expected);
    cursor = claim.index + String(claim.actual).length;
  }
  return result + html.slice(cursor);
}
