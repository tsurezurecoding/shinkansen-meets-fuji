// data-runtime.js が data.js と同値であること、落としたフィールドが
// ブラウザ側から読まれていないことを機械的に確かめる。
//
// 「落とすフィールド」は目視で選んだ一覧なので、選び間違えたときに
// 静かに壊れるのが一番こわい。ここで次の3つを見る。
//
// 1. 同値: 残したフィールドは data.js と完全に一致する（順序も含む）
// 2. 未参照: 落としたフィールドを、SPOTS を読むブラウザ側コードが参照していない
// 3. 参照先: data.js を直接読むHTMLがもう残っていない
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { BUILD_ONLY_SPOT_FIELDS, RUNTIME_DATA_BYTE_BUDGET, readSource, runtimeSpot } from "./generate-runtime-data.mjs";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimePath = path.join(appDir, "data-runtime.js");
const errors = [];
const fail = (message) => errors.push(message);

const source = readSource();
const runtimeCode = fs.readFileSync(runtimePath, "utf8");
const runtimeContext = {};
vm.runInNewContext(`${runtimeCode}\nglobalThis.__RUNTIME = { SPOTS, ROUTE, BOARD_COLLECTION };`, runtimeContext, { filename: runtimePath });
const runtime = runtimeContext.__RUNTIME;

// data.js と同じく const 宣言であること。var や window 代入にすると
// app.js の (typeof SPOTS !== "undefined" && SPOTS) 経路の意味が変わる。
for (const name of ["SPOTS", "ROUTE", "BOARD_COLLECTION"]) {
  if (!new RegExp(`^const ${name} = `, "m").test(runtimeCode)) fail(`data-runtime.js must declare ${name} with const, like data.js`);
}

// 1. 同値
if (JSON.stringify(runtime.ROUTE) !== JSON.stringify(source.ROUTE)) fail("ROUTE differs between data.js and data-runtime.js");
if (JSON.stringify(runtime.BOARD_COLLECTION) !== JSON.stringify(source.BOARD_COLLECTION)) fail("BOARD_COLLECTION differs between data.js and data-runtime.js");
if (runtime.SPOTS.length !== source.SPOTS.length) fail(`spot count differs: data.js ${source.SPOTS.length}, data-runtime.js ${runtime.SPOTS.length}`);
for (let index = 0; index < source.SPOTS.length; index += 1) {
  const expected = runtimeSpot(source.SPOTS[index]);
  const actual = runtime.SPOTS[index];
  if (!actual || actual.id !== source.SPOTS[index].id) { fail(`spot ${index} id is out of order in data-runtime.js`); continue; }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${actual.id} differs from the data.js projection`);
  for (const field of BUILD_ONLY_SPOT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(actual, field)) fail(`${actual.id} still carries the build-only field ${field}`);
  }
}

// 2. 未参照。SPOTS / ROUTE / BOARD_COLLECTION のグローバルを読むブラウザ側の
// ファイルだけを見る。spot-page-shared.js は同名フィールドをページ本文側から
// 読むため、ここに混ぜると誤検知になる。
const runtimeConsumers = ["app.js", "live/live.js", "yakei.js", "727-collection.js", "track.js", "sparkling-dreams.js", "hanabi.js", "window-moments.js", "sun-window.js", "train-select.js", "app-embedded.js"];
for (const relative of runtimeConsumers) {
  const absolute = path.join(appDir, relative);
  if (!fs.existsSync(absolute)) { fail(`runtime consumer ${relative} is missing; update this list`); continue; }
  const code = fs.readFileSync(absolute, "utf8");
  if (!/\b(SPOTS|ROUTE|BOARD_COLLECTION)\b/.test(code)) continue;
  for (const field of BUILD_ONLY_SPOT_FIELDS) {
    const pattern = new RegExp(`\\.${field}\\b|\\[\\s*["']${field}["']\\s*\\]`);
    if (pattern.test(code)) fail(`${relative} reads ${field}, which data-runtime.js drops`);
  }
}

// 3. 参照先。data.js を直接読むHTMLが残っていたら、そのページだけ531 KBのままになる。
function htmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "vendor" || entry.name === "v0" || entry.name === "v1" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}
const stillLoadingSource = htmlFiles(appDir)
  .filter((file) => /src="(?:\.\.\/)*data\.js(?:\?|")/.test(fs.readFileSync(file, "utf8")))
  .map((file) => path.relative(appDir, file).split(path.sep).join("/"));
if (stillLoadingSource.length) fail(`these pages still load the editorial data.js instead of data-runtime.js: ${stillLoadingSource.join(", ")}`);

const runtimeBytes = Buffer.byteLength(runtimeCode, "utf8");
if (runtimeBytes > RUNTIME_DATA_BYTE_BUDGET) fail(`data-runtime.js is ${runtimeBytes} bytes, over the ${RUNTIME_DATA_BYTE_BUDGET} byte budget`);

if (errors.length) throw new Error(`Runtime data validation failed:\n- ${errors.join("\n- ")}`);
const sourceBytes = Buffer.byteLength(fs.readFileSync(path.join(appDir, "data.js"), "utf8"), "utf8");
console.log(`Runtime data validation passed: ${runtime.SPOTS.length} spots equivalent to data.js minus ${BUILD_ONLY_SPOT_FIELDS.length} build-only fields; ${runtimeBytes} bytes shipped against ${sourceBytes} bytes of source, budget ${RUNTIME_DATA_BYTE_BUDGET}.`);
