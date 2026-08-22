import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// SPOTS の形を検証する。
//
// これが無かったので granship は scene を持たないまま出荷され、誰も気づかなかった。
// 写真があるあいだは表示に出ないという、いちばん見つけにくい壊れ方をしていた。
//
// 「他のスポットのページに間借りしている景色」はこのスキーマの一級市民として扱う。
// 浜名湖越しの富士山は自分のページを持たないので、ページ用の文言を要求してはいけない。
// 以前はその例外が「39/40 のフィールドが8つ並ぶ」という形でしか表現されていなかった。

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { SPOTS } = vm.runInNewContext(
  `${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\n;({ SPOTS });`,
  {},
  { filename: "data.js" },
);

// 全スポットが必ず持つもの。
const REQUIRED = [
  "id", "icon", "ja", "en", "minutesFromTokyo", "side", "category",
  "confidence", "durationSec", "spotting", "scene", "image", "photoCredit",
  "references", "map",
];

// 自分のページを持つスポットだけが必要とするもの。
const OWN_PAGE_REQUIRED = [
  "pageTitle", "pageHeading", "metaDescription", "pageStory", "explainer",
];

// 他のスポットのページに間借りしているスポットが必要とするもの。
const SHARED_PAGE_REQUIRED = ["guideAnchor", "guideNotice", "sharedGuideHeading", "sharedGuideStory"];

const ENUMS = {
  side: ["A", "E"],
  category: ["classic", "notable", "curious", "hidden"],
  confidence: ["verified", "needs-check", "source-backed"],
  spotting: ["easy", "moderate", "hard"],
};

const problems = [];
const ids = new Set();
let sharedPageCount = 0;

for (const spot of SPOTS) {
  const id = spot.id || "(no id)";
  if (ids.has(id)) problems.push(`${id}: duplicate id`);
  ids.add(id);

  for (const field of REQUIRED) {
    if (spot[field] === undefined) problems.push(`${id}: missing required field "${field}"`);
  }

  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (spot[field] !== undefined && !allowed.includes(spot[field])) {
      problems.push(`${id}: ${field} is "${spot[field]}", expected one of ${allowed.join(" / ")}`);
    }
  }

  if (typeof spot.minutesFromTokyo !== "number" || spot.minutesFromTokyo < 0 || spot.minutesFromTokyo > 200) {
    problems.push(`${id}: minutesFromTokyo out of range (${spot.minutesFromTokyo})`);
  }
  if (typeof spot.durationSec !== "number" || spot.durationSec <= 0) {
    problems.push(`${id}: durationSec must be a positive number (${spot.durationSec})`);
  }

  const sharesPage = Boolean(spot.guidePageId) && spot.guidePageId !== spot.id;
  if (sharesPage) {
    sharedPageCount += 1;
    if (!SPOTS.some((host) => host.id === spot.guidePageId)) {
      problems.push(`${id}: guidePageId "${spot.guidePageId}" does not match any spot`);
    }
    for (const field of SHARED_PAGE_REQUIRED) {
      if (spot[field] === undefined) {
        problems.push(`${id}: shares a page, so it needs "${field}"`);
      }
    }
  } else {
    for (const field of OWN_PAGE_REQUIRED) {
      if (spot[field] === undefined) problems.push(`${id}: missing "${field}" for its own page`);
    }
  }
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  console.error(`\n${problems.length} schema problem(s) in data.js.`);
  process.exit(1);
}

console.log(
  `Spot schema valid: ${SPOTS.length} spots, ${REQUIRED.length} required fields each, ` +
    `${sharedPageCount} sharing another spot's page.`,
);
