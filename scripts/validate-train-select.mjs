// train-select.js（列車選択アルゴリズムの共有モジュール）の健全性を検証する。
//
// 背景: 2026-08-17、mieru.html に列車選択を入れた際、app.js が並行編集中で
// 触れなかったため、同じアルゴリズム（tokaidoStops/interpolateSpot/trainCandidates）が
// app.js と mieru.html に独立実装で二重に存在してしまった。train-select.js へ一本化した後、
// 将来また同じ理由で再度二重実装が生まれるのを機械的に検出するためのガード。
//
// 検証内容:
//   1. train-select.js が window.MADO_TRAIN_SELECT を公開し、期待する関数を持つこと
//   2. 実データ（data.js の ROUTE、data/timetable.js の SHINKANSEN_TIMETABLE）で
//      trainCandidates/tokaidoStops/interpolateSpot が構造的に妥当な結果を返すこと
//   3. 補間アルゴリズムの中核行が train-select.js の中にしか存在しないこと
//      （app.js / mieru.html が再度アルゴリズムを持ち込んでいないか）
//   4. app.js が directly ではなく MADO_TRAIN_SELECT 経由で呼び出していること
//   5. train-select.js を読み込むべきHTML（app.js を読む主要ページ、mieru.html）に
//      <script src="train-select.js...> が app.js / インラインscriptより前に存在すること

import { readFile } from "node:fs/promises";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => path.join(appDir, p);

function fail(msg) {
  throw new Error(`validate-train-select: ${msg}`);
}

// ---- 1. train-select.js の公開形 ----
const trainSelectSrc = await readFile(rel("train-select.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(trainSelectSrc, context, { filename: "train-select.js" });
const MTS = context.window.MADO_TRAIN_SELECT;
if (!MTS) fail("window.MADO_TRAIN_SELECT is not defined after loading train-select.js");
for (const fn of ["tokaidoStops", "interpolateSpot", "trainCandidates"]) {
  if (typeof MTS[fn] !== "function") fail(`MADO_TRAIN_SELECT.${fn} is not a function`);
}

// ---- 2. 実データでの構造的な健全性 ----
const dataCode = await readFile(rel("data.js"), "utf8");
vm.runInNewContext(`${dataCode}\nglobalThis.__ROUTE = ROUTE;`, context, { filename: "data.js" });
const ROUTE = context.__ROUTE;
if (!ROUTE || !Array.isArray(ROUTE.refStations) || !ROUTE.refStations.length) {
  fail("data.js did not yield a usable ROUTE.refStations");
}

const timetableCode = await readFile(rel("data/timetable.js"), "utf8");
vm.runInNewContext(timetableCode, context, { filename: "data/timetable.js" });
const TT = context.window.SHINKANSEN_TIMETABLE;
if (!TT || !Array.isArray(TT.trains) || !TT.trains.length) {
  fail("data/timetable.js did not yield a usable SHINKANSEN_TIMETABLE");
}

const westFromTokyo = MTS.trainCandidates(TT, ROUTE, "west", "Tokyo");
if (!westFromTokyo.length) fail("trainCandidates(west, Tokyo) returned no trains — timetable/route shape may have changed");
for (let i = 1; i < westFromTokyo.length; i++) {
  if (westFromTokyo[i].dep < westFromTokyo[i - 1].dep) fail("trainCandidates results are not sorted by departure time");
}

const sampleTrain = westFromTokyo[0].tr;
const stops = MTS.tokaidoStops(ROUTE, sampleTrain);
if (!stops.length) fail("tokaidoStops returned no stops for a train known to serve Tokyo");
for (let i = 1; i < stops.length; i++) {
  if (stops[i].clock < stops[i - 1].clock) fail("tokaidoStops results are not sorted by clock time");
}
// 区間内のどこかの基準分数を補間できること（両端の中点で確認）
if (stops.length >= 2) {
  const midRef = (stops[0].ref + stops[1].ref) / 2;
  const interpolated = MTS.interpolateSpot(midRef, stops);
  if (interpolated == null) fail("interpolateSpot returned null for a ref inside the first two stops' range");
  const lo = Math.min(stops[0].clock, stops[1].clock), hi = Math.max(stops[0].clock, stops[1].clock);
  if (interpolated < lo || interpolated > hi) fail("interpolateSpot returned a clock outside the bounding stops");
}

// ---- 3. アルゴリズム本体の二重実装ガード ----
// interpolateSpot の中核行(線形補間の丸め込み)は train-select.js だけに存在するはず。
const CORE_LINE = "Math.round(a.clock + f * (b.clock - a.clock))";
const appJsSrc = await readFile(rel("app.js"), "utf8");
const mieruSrc = await readFile(rel("mieru.html"), "utf8");
if (appJsSrc.includes(CORE_LINE)) {
  fail("app.js appears to re-implement the interpolation algorithm locally — it should delegate to MADO_TRAIN_SELECT instead");
}
if (mieruSrc.includes(CORE_LINE)) {
  fail("mieru.html appears to re-implement the interpolation algorithm locally — it should delegate to MADO_TRAIN_SELECT instead");
}
if ((trainSelectSrc.match(new RegExp(CORE_LINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length !== 1) {
  fail("train-select.js should contain the interpolation core line exactly once");
}

// ---- 4. app.js / mieru.html が共有モジュール経由で呼んでいること ----
if (!/MTS\.trainCandidates\(/.test(appJsSrc)) fail("app.js does not appear to delegate trainCandidates() to MADO_TRAIN_SELECT (MTS)");
if (!/MTS\.tokaidoStops\(/.test(appJsSrc)) fail("app.js does not appear to delegate tokaidoStops() to MADO_TRAIN_SELECT (MTS)");
if (!/MTS\.interpolateSpot\(/.test(appJsSrc)) fail("app.js does not appear to delegate interpolateSpot() to MADO_TRAIN_SELECT (MTS)");
if (!/MTS\.trainCandidates\(/.test(mieruSrc)) fail("mieru.html does not appear to delegate trainCandidates() to MADO_TRAIN_SELECT (MTS)");
if (!/MTS\.tokaidoStops\(/.test(mieruSrc)) fail("mieru.html does not appear to delegate tokaidoStops() to MADO_TRAIN_SELECT (MTS)");
if (!/MTS\.interpolateSpot\(/.test(mieruSrc)) fail("mieru.html does not appear to delegate interpolateSpot() to MADO_TRAIN_SELECT (MTS)");

// ---- 5. train-select.js が実際に読み込まれる配線になっていること ----
const pagesLoadingAppJs = [
  "index.html", "en/index.html",
  "journal.html", "en/journal.html",
  "zukan.html", "en/zukan.html",
];
for (const page of pagesLoadingAppJs) {
  const html = await readFile(rel(page), "utf8");
  const trainSelectIdx = html.indexOf('src="train-select.js');
  const appJsIdx = html.indexOf('src="app.js');
  if (trainSelectIdx === -1) fail(`${page} loads app.js but not train-select.js`);
  if (appJsIdx === -1) continue; // app.js自体を読まないページなら対象外（想定外だが実害なし）
  if (trainSelectIdx > appJsIdx) fail(`${page} loads train-select.js after app.js — must load before`);
}

{
  const mieruTrainSelectIdx = mieruSrc.indexOf('src="train-select.js');
  const mieruInlineScriptIdx = mieruSrc.indexOf("MADO_TRAIN_SELECT");
  if (mieruTrainSelectIdx === -1) fail("mieru.html does not load train-select.js");
  if (mieruInlineScriptIdx !== -1 && mieruTrainSelectIdx > mieruInlineScriptIdx) {
    fail("mieru.html references MADO_TRAIN_SELECT before its <script src=\"train-select.js\"> tag");
  }
}

console.log(`Validated train-select.js: ${westFromTokyo.length} west/Tokyo candidates, ${stops.length} stops on sample train, wiring OK across ${pagesLoadingAppJs.length + 1} pages.`);
