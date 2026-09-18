// data.js から、ブラウザが実際に読むフィールドだけを残した data-runtime.js を作る。
//
// 背景: data.js は編集の正本で531 KBある。うち約277 KB（半分以上）は
// explainer / pageStory / metaDescription のような、ページ生成器しか読まない
// 記事本文である。スポットページ本体は 2026-09-07 の分割で
// data/spot-pages/<id>.<lang>.js から本文を受け取るようになったため、
// これらのフィールドがブラウザへ届く必要はもうない。
//
// にもかかわらず zukan / start / live / mieru など15枚のシェルページが
// data.js を丸ごと読み込んでいる。読まれないフィールドを1文字直すだけで、
// この15枚のキャッシュが落ちる。
//
// 方針は「残すものを列挙する」ではなく「落とすものを列挙する」。
// 未知のフィールドが黙って消えるより、余分に残るほうが安全側に倒れる。
// 落とす対象がランタイムから参照されていないことは
// validate-runtime-data.mjs が機械的に確かめる。
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const dataPath = path.join(appDir, "data.js");
const outputPath = path.join(appDir, "data-runtime.js");
const CHECK_ONLY = process.argv.includes("--check");

// ページ生成器だけが読むフィールド。ブラウザへは送らない。
export const BUILD_ONLY_SPOT_FIELDS = [
  "explainer",
  "explainerFigure",
  "guideHighlight",
  "guideNotice",
  "metaDescription",
  "pageHeading",
  "pageHeadingChunks",
  "pageStory",
  "pageTitle",
  "photoSectionHeading",
  "photoTip",
  "routeNote",
  "sectionHeading",
  "sharedGuideHeading",
  "sharedGuideStory",
];

// 1ページの表示で落ちてくる量の上限。分割前の data.js は531 KBだった。
export const RUNTIME_DATA_BYTE_BUDGET = 320 * 1024;

// 観覧車コレクションのうち、ferris-wheels.html の本文・出典リンクだけが読むフィールド。
// タイムラインは ja / en の name・area・hook・story しか使わない。
export const BUILD_ONLY_WHEEL_FIELDS = [
  "body",
  "official",
  "reference",
  "referenceName",
  "seatSource",
  "seatSourceName",
  "source",
  "sourceName",
  // ja.story / en.story に展開済みなので、元の story は送らない。
  "story",
];

export function runtimeWheel(wheel) {
  const out = {};
  for (const key of Object.keys(wheel)) {
    if (BUILD_ONLY_WHEEL_FIELDS.includes(key)) continue;
    out[key] = wheel[key];
  }
  return out;
}

export function runtimeSpot(spot) {
  const out = {};
  for (const key of Object.keys(spot)) {
    if (BUILD_ONLY_SPOT_FIELDS.includes(key)) continue;
    out[key] = spot[key];
  }
  return out;
}

export function readSource() {
  const context = {};
  const code = fs.readFileSync(dataPath, "utf8");
  vm.runInNewContext(`${code}\nglobalThis.__SOURCE = { SPOTS, ROUTE, BOARD_COLLECTION, WHEEL_COLLECTION };`, context, { filename: dataPath });
  const source = context.__SOURCE;
  if (!source || !Array.isArray(source.SPOTS) || !source.ROUTE || !Array.isArray(source.BOARD_COLLECTION) || !Array.isArray(source.WHEEL_COLLECTION)) {
    throw new Error("Could not read SPOTS, ROUTE, BOARD_COLLECTION and WHEEL_COLLECTION from data.js");
  }
  return source;
}

export function runtimeDataCode(source) {
  const spots = source.SPOTS.map(runtimeSpot);
  // data.js と同じく const で宣言する。app.js は
  // (typeof SPOTS !== "undefined" && SPOTS) || window.SPOTS で拾うため、
  // var や window 代入に変えると挙動が変わる。
  return [
    "/* Generated from data.js. Do not edit this artifact by hand. */",
    "/* Browser-facing subset: article copy that only the page generators read is omitted. */",
    `const SPOTS = ${JSON.stringify(spots)};`,
    `const ROUTE = ${JSON.stringify(source.ROUTE)};`,
    `const BOARD_COLLECTION = ${JSON.stringify(source.BOARD_COLLECTION)};`,
    `const WHEEL_COLLECTION = ${JSON.stringify(source.WHEEL_COLLECTION.map(runtimeWheel))};`,
    "",
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1].split(path.sep).join("/")}` || process.argv[1]?.endsWith("generate-runtime-data.mjs")) {
  const source = readSource();
  const output = runtimeDataCode(source);
  const bytes = Buffer.byteLength(output, "utf8");
  if (bytes > RUNTIME_DATA_BYTE_BUDGET) throw new Error(`data-runtime.js is ${bytes} bytes, over the ${RUNTIME_DATA_BYTE_BUDGET} byte budget`);
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
  const changed = current !== output;
  if (!CHECK_ONLY && changed) fs.writeFileSync(outputPath, output, "utf8");
  const sourceBytes = Buffer.byteLength(fs.readFileSync(dataPath, "utf8"), "utf8");
  console.log(`${CHECK_ONLY ? "Preflight" : "Generated"} runtime data: ${changed ? (CHECK_ONLY ? "would change" : "written") : "unchanged"} (${source.SPOTS.length} spots, ${bytes} bytes from a ${sourceBytes} byte source, budget ${RUNTIME_DATA_BYTE_BUDGET}).`);
  if (CHECK_ONLY && changed) {
    console.error("data-runtime.js is stale; run npm run build");
    process.exitCode = 1;
  }
}
