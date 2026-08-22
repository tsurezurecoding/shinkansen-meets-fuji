import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// 見やすさ(spotting)の値を検証し、未評価がいくつ残っているかを見えるようにする。
//
// durationSec だけでは「近いが一瞬」と「遠くて肉眼では厳しい」が区別できない。
// 彦根城は3秒で岐阜城は8秒だが、どちらも難しい理由は距離であって長さではない。
// 逆に清洲城は5秒でも距離が近く、いちばん見つけやすい部類に入る。
// この違いは実車で見た人にしか付けられないので、未評価は推測で埋めず、
// 残数を毎回表示して埋まっていないことが分かる状態にしておく。

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEVELS = new Set(["easy", "moderate", "hard"]);

const { SPOTS } = vm.runInNewContext(
  `${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\n;({ SPOTS });`,
  {},
  { filename: "data.js" },
);

const invalid = SPOTS.filter((spot) => spot.spotting !== undefined && !LEVELS.has(spot.spotting));
if (invalid.length) {
  for (const spot of invalid) {
    console.error(`${spot.id}: invalid spotting "${spot.spotting}" (expected easy / moderate / hard)`);
  }
  process.exit(1);
}

const counts = { easy: 0, moderate: 0, hard: 0 };
const unrated = [];
for (const spot of SPOTS) {
  if (spot.spotting) counts[spot.spotting] += 1;
  else unrated.push(spot.id);
}

console.log(
  `Spotting difficulty: easy ${counts.easy} / moderate ${counts.moderate} / hard ${counts.hard}, ` +
    `${unrated.length} of ${SPOTS.length} not yet rated.`,
);
if (unrated.length) {
  console.log(`  unrated: ${unrated.join(", ")}`);
  console.log("  These need a real ride to judge; leave them unset rather than guessing.");
}
