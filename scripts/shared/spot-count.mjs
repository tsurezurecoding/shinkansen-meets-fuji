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

const { SPOTS, BOARD_COLLECTION } = vm.runInNewContext(
  `${fs.readFileSync(dataPath, "utf8")}\n;({ SPOTS, BOARD_COLLECTION });`,
  {},
  { filename: dataPath },
);

/** Total window views. Same value as app.js MADO_SPOT_COUNT. */
export const SPOT_COUNT = SPOTS.length;

/**
 * 727看板コレクションの収集対象数。撤去・未発見の地点は記録として残すが対象外。
 * 727-collection.js の countablePoints と同じ規則で、あちらが表示の正本。
 *
 * 乗車タイムラインに出る数（app.js の boardCollectionSpots）はこれより2件少ない。
 * 代表スポット 727-board と重複する葛原・寺坂を外すためで、別の数として正しい。
 * 混同しやすいので、ページが「N地点」と語るのは常に収集対象の方だと決めておく。
 */
const is727Retired = (point) =>
  point.siteStatus === "not-found" || point.siteStatus === "removed";

export const COLLECTION_727_COUNT = BOARD_COLLECTION.filter((point) => !is727Retired(point)).length;

/** 基準にした調査から状況が変わった地点数。ページ本文が「このほかにN地点」と語る。 */
export const COLLECTION_727_RETIRED = BOARD_COLLECTION.filter(is727Retired).length;

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
  "start.html",
  "guide.html",
  "zukan.html",
  "en/index.html",
  "en/start.html",
  "en/guide.html",
  "en/zukan.html",
  "en/jr-pass-fuji.html",
  "en/besides-fuji.html",
  "zh-Hant/besides-fuji.html",
  "fr/guide.html",
  "de/guide.html",
  "es/guide.html",
  "ko/guide.html",
  "zh-Hans/guide.html",
  "zh-Hant/guide.html",
  "ar/guide.html",
  "727-collection.html",
];

// 「N地点」は727コレクションの収集対象数。景の数とは別の数なので期待値を切り替える。
const COLLECTION_727_UNIT = "地点";

// Number + unit, across all seven languages. Longest first so that
// "の車窓スポット" wins over "の車窓" and "个精选车窗景色" over "个景色".
const UNITS = [
  "の車窓スポット",
  "地点",
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
  " ausgewählte Ausblicke",
  " Ausblicke",
  " paisajes",
  " vistas",
  " مشهدًا",
];

// 単位ではなく語句で期待値が決まるもの。同じ「地点」でも意味が違う数がある。
const PHRASE_CLAIMS = [
  { text: "このほかに#地点", count: () => COLLECTION_727_RETIRED },
];

// Numbers that look like a claim but are not one.
const NOT_A_CLAIM = [
  "夜だけの車窓#景", // the night-views page covers a subset, not the whole set
  // 「富士山以外の N 景」は総数ではなく、富士山の視点5つを除いた数。
  // 構造化データの説明文に出る。総数へ揃えると事実が壊れる。
  "The # window views other than Mt. Fuji itself",
  "富士山以外的#個車窗景色",
  // 727ページの「8区間に分けて」は駅間の区分数。近くに「車窓」があるだけで景の数ではない。
  "新大阪まで#区間に分けて",
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
  // 語句で期待値が決まるものを先に拾う。単位だけ見ると取り違える。
  const byPhrase = new Map();
  for (const claim of PHRASE_CLAIMS) {
    for (const offset of digitOffsets(html, [claim.text])) byPhrase.set(offset, claim.count());
  }
  const claims = [];
  for (const match of html.matchAll(unitPattern)) {
    if (ignored.has(match.index)) continue;
    const expected = byPhrase.has(match.index)
      ? byPhrase.get(match.index)
      : match[2] === COLLECTION_727_UNIT
        ? COLLECTION_727_COUNT
        : SPOT_COUNT;
    claims.push({
      index: match.index,
      raw: match[0],
      unit: match[2],
      actual: Number(match[1]),
      expected,
    });
  }
  return claims;
}

// Safety net. Any number sitting just before a counting noun is probably a claim
// about how many views the site covers. If the scanner above did not already
// classify it, it is an unregistered claim and the build should stop rather than
// let a fifth number quietly join the other four.
const COUNT_NOUNS = "views|景|風景|景色|車窓|车窗|車窗|풍경|vues|paysages|Ausblicke|vistas|مشهدًا";
// Exclusions, in order: part of an identifier such as the css class "g9-more";
// a duration ("43 min", "3分間", "147分鐘"); a step number ("2 · 主要景色");
// a date ("8月16日の車窓" — the 車窓 nearby made the day number look like a count);
// a product name ("新しい727看板や…車窓から撮影した写真" — same trap, brand instead of date).
const countLikePattern = new RegExp(
  `(?<![A-Za-z0-9])(\\d{1,3})(?!\\d)` +
    `(?!\\s*(?:分|min\\b|秒))` +
    `(?!\\s*[·・])` +
    `(?!\\s*[年月日])` +
    `(?!\\s*看板)` +
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
