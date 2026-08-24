import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// 写真の出典を棚卸しする。
//
// 事故の背景: 代表写真は `image` + `photoCredit` に入り、追加写真は `photos[]` に入る。
// この二つは排他で、40件すべてで `image` は `photos[]` に含まれていない。つまり
// `photos[]` だけを数えると、代表写真が必ず一枚まるごと抜け落ちる。
// 実際これで「岐阜城は自前写真ゼロ」という誤りを二度出している。どちらも
// 書き捨ての確認スクリプトが `photos[]` しか見ていなかったことが原因だった。
// 数え方を毎回書き直すのをやめて、ここに固定する。
//
//   node scripts/audit-photo-credits.mjs           棚卸しを表示
//   node scripts/audit-photo-credits.mjs --check   構造の不変条件だけ検査（CI用）

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

const { SPOTS, BOARD_COLLECTION } = vm.runInNewContext(
  `${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\n;({ SPOTS, BOARD_COLLECTION });`,
  {},
  { filename: "data.js" },
);

const OWNER = /michikusa/i;
const text = (value) => (value == null ? "" : typeof value === "string" ? value : value.ja || value.en || "");
const isOwn = (photo) => OWNER.test(photo.credit) || OWNER.test(photo.src);

// スポット1件の写真を、代表も追加も同じ形にそろえて返す。ここが唯一の数え方。
export function photosOf(spot) {
  const list = [];
  if (spot.image) list.push({ src: spot.image, credit: text(spot.photoCredit), role: "representative" });
  for (const photo of spot.photos || []) {
    list.push({ src: photo.src, credit: text(photo.credit), role: photo.role || "gallery" });
  }
  // 同じ src が二度出たら一度にまとめる（本来 image と photos[] は排他）。
  return [...new Map(list.map((photo) => [photo.src, photo])).values()];
}

// 727コレクションは photo / collectionPhotos という別の持ち方をする。
function photosOf727(point) {
  const list = [];
  if (point.photo) list.push({ src: point.photo.src, credit: point.photo.note || "", role: "representative" });
  for (const photo of point.collectionPhotos || []) {
    list.push({ src: photo.src, credit: photo.note || "", role: "gallery" });
  }
  return list;
}

// ---- 構造の不変条件 ----
const problems = [];
for (const spot of SPOTS) {
  const gallery = (spot.photos || []).map((photo) => photo.src);
  if (spot.image && gallery.includes(spot.image)) {
    problems.push(`${spot.id}: 代表写真 ${spot.image} が photos[] にも入っている（ページに二度出る）`);
  }
  if (spot.image && !text(spot.photoCredit)) {
    problems.push(`${spot.id}: 代表写真に photoCredit が無い`);
  }
  for (const photo of spot.photos || []) {
    if (!text(photo.credit)) problems.push(`${spot.id}: ${photo.src} に credit が無い`);
  }
  for (const photo of photosOf(spot)) {
    if (!fs.existsSync(path.join(appDir, photo.src))) problems.push(`${spot.id}: ファイルが無い ${photo.src}`);
  }
}

if (checkOnly) {
  for (const problem of problems) console.error(`  ${problem}`);
  if (problems.length) {
    console.error(`photo credits: ${problems.length} problem(s) in data.js`);
    process.exit(1);
  }
  console.log(`photo credits valid: ${SPOTS.length} spots, representative and gallery kept disjoint.`);
  process.exit(0);
}

// ---- 棚卸し ----
const rows = SPOTS.map((spot) => {
  const photos = photosOf(spot);
  const own = photos.filter(isOwn);
  return { spot, photos, own };
});

const noOwn = rows.filter((row) => !row.own.length);
console.log(`スポット ${SPOTS.length}件 / 写真 ${rows.reduce((n, row) => n + row.photos.length, 0)}枚（うち自前 ${rows.reduce((n, row) => n + row.own.length, 0)}枚）`);
console.log("");
console.log(`自前写真が1枚も無いスポット: ${noOwn.length}件`);
for (const { spot, photos } of noOwn) {
  console.log(`  [${spot.side}] ${spot.ja.name}  conf=${spot.confidence}`);
  for (const photo of photos) console.log(`        ${photo.role.padEnd(14)} ${photo.credit || "(credit無)"}`);
}

const borrowedLead = rows.filter((row) => row.own.length && !isOwn(row.photos[0]));
console.log("");
console.log(`自前写真はあるが、代表が借り物のスポット: ${borrowedLead.length}件`);
for (const { spot, photos, own } of borrowedLead) {
  console.log(`  [${spot.side}] ${spot.ja.name.padEnd(14)} 代表: ${photos[0].credit}  / 自前${own.length}枚あり`);
}

const gone = BOARD_COLLECTION.filter((point) => point.siteStatus);
const collectable = BOARD_COLLECTION.filter((point) => !point.siteStatus);
const shot = collectable.filter((point) => photosOf727(point).length);
console.log("");
console.log(`727コレクション: 収集対象 ${collectable.length}件 / 写真あり ${shot.length}件 / 除外 ${gone.length}件`);
for (const point of gone) console.log(`  除外 No.${point.sourceNo} ${point.collectionJaName} (${point.siteStatus})`);
if (problems.length) {
  console.log("");
  console.log(`構造の問題 ${problems.length}件:`);
  for (const problem of problems) console.log(`  ${problem}`);
}
