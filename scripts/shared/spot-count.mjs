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

/** Total window views. Same value as app.js MADO_SPOT_COUNT. */
export const SPOT_COUNT = SPOTS.length;

/** "Mt. Fuji, plus N more views" — the whole set minus Fuji itself. */
export const SPOT_COUNT_BESIDES_FUJI = SPOT_COUNT - 1;

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

// Claims that mean "besides Mt. Fuji", so they resolve to SPOT_COUNT - 1.
// "#" stands for the number. Everything else that matches a unit is the full set.
// These need listing because some languages reuse one unit for both meanings
// (ko writes "#개의 차창 풍경" for the full set AND for the besides-Fuji count).
const BESIDES_FUJI_CLAIMS = [
  "富士山だけじゃない、東京〜新大阪のおすすめ車窓#景",
  "Mt. Fuji and # more views",
  "Mt. Fuji and # other window views",
  "The other # window views",
  "plus # more views",
  "Le mont Fuji et # autres paysages",
  "후지산 외에도 도쿄에서 신오사카까지 #개의 차창 풍경",
  "除了富士山，东京到新大阪还有#个车窗景色",
  "富士山之外，東京到新大阪還有#個車窗景色",
  "جبل فوجي، إلى جانب # مشهدًا آخر",
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
 * Every spot-count claim in the page, with the number it should be showing.
 * Returns [{ index, raw, unit, actual, expected, kind }].
 */
export function scanSpotCountClaims(html) {
  const besides = digitOffsets(html, BESIDES_FUJI_CLAIMS);
  const ignored = digitOffsets(html, NOT_A_CLAIM);

  // Candidates come from two directions. The unit list catches "39景" / "39 views",
  // but a claim can put words between the number and the unit ("37 other window views"),
  // which the unit list alone walks straight past. Seed from the registered phrases too.
  const candidates = new Map();
  for (const match of html.matchAll(unitPattern)) {
    candidates.set(match.index, { digits: match[1], raw: match[0], unit: match[2] });
  }
  for (const offset of besides) {
    if (candidates.has(offset)) continue;
    const digits = /^\d{1,3}/.exec(html.slice(offset))?.[0];
    if (digits) candidates.set(offset, { digits, raw: digits, unit: "(phrase)" });
  }

  const claims = [];
  for (const index of [...candidates.keys()].sort((a, b) => a - b)) {
    if (ignored.has(index)) continue;
    const { digits, raw, unit } = candidates.get(index);
    const kind = besides.has(index) ? "besidesFuji" : "total";
    claims.push({
      index,
      raw,
      unit,
      actual: Number(digits),
      expected: kind === "besidesFuji" ? SPOT_COUNT_BESIDES_FUJI : SPOT_COUNT,
      kind,
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
