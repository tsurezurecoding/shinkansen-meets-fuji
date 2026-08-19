import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(appDir, relativePath), "utf8");
const context = {};
vm.runInNewContext(`${read("data.js")}\n;globalThis.__collection = BOARD_COLLECTION; globalThis.__spots = SPOTS;`, context);
const collection = context.__collection;
// データ件数(27)と、実際に集められる地点数(26)は別。撤去・確認できずの地点は後者から外す。
const collectableCount = collection.filter((point) => !["not-found", "removed"].includes(point.siteStatus)).length;
const spots = context.__spots;
const app = read("app.js");
const page = read("727-collection.html");
const script = read("727-collection.js");
const shared = read("spot-page-shared.js");
const sharedDataContext = {};
vm.runInNewContext(read("spot-page-shared-data.js"), sharedDataContext);
const sharedData = sharedDataContext.MADO_SPOT_PAGE_SHARED_DATA;
const styles = read("style.css");
const manifest = JSON.parse(read("content-manifest.json"));
const assertIncludes = (value, needle, message) => assert.ok(value.includes(needle), message);
const thumbnailPath = (src) => String(src || "").replace(/^images\/(.+)\.(jpe?g|png)$/i, "images/thumbs/$1.webp");

assert.equal(collection.length, 27, "expected 27 dedicated collection items");
assert.equal(new Set(collection.map((point) => point.id)).size, 27, "collection IDs must be unique");
const signs727 = collection.filter((point) => point.collectionKind === "727");
assert.equal(signs727.length, 27, "must retain all 27 727 source points");
assert.equal(signs727.map((point) => point.sourceNo).join(","), Array.from({ length: 27 }, (_, index) => index + 19).join(","), "727 source numbering must remain stable");
assert.equal(collection.find((point) => point.sourceNo === 19)?.stampId, "727-board", "representative keeps old stamp state");
assert.equal(collection.find((point) => point.sourceNo === 22)?.stampId, "putiputi-sign", "Oiso point must share the Who-am-I stamp state");
assert.equal(collection.find((point) => point.sourceNo === 22)?.legacyStampIds?.[0], "727-companion-putiputi", "Oiso point must preserve the removed companion-row state");
assert.equal(collection.find((point) => point.sourceNo === 34)?.siteStatus, "removed", "Hagiwara point must preserve the removed status");
assert.match(collection.find((point) => point.sourceNo === 34)?.collectionNote || "", /撤去済み/, "Hagiwara removal note missing");
assert.ok(!collection.some((point) => point.collectionKind === "companion"), "companion signs must not appear as separate collection rows");
assert.equal(
  collection.slice(0, 4).map((point) => point.collectionNote).join("|"),
  ["となりには248看板", "となりにはきぬた歯科", "727看板がひとつだけ", "となりには私は誰でしょう看板"].join("|"),
  "first four collection notes must stay attached to the correct points",
);
for (const [sourceNo, note, image] of [
  [44, "田んぼの奥にぽつんと", "images/20260803_727_board_karasakiminami_michikusa.jpg"],
  [45, "大阪中央卸売市場をバックに", "images/20260803_727_board_torikaihachicho_michikusa.jpg"],
]) {
  const point = collection.find((item) => item.sourceNo === sourceNo);
  assert.equal(point?.collectionNote, note, `source No.${sourceNo} list note missing`);
  assert.equal(point?.photo?.src, image, `source No.${sourceNo} photo missing`);
  assert.ok(fs.existsSync(path.join(appDir, image)), `source No.${sourceNo} image file missing`);
}
for (const [sourceNo, minutes, image] of [
  [23, 76, "images/20260704_727_board_haracho_michikusa.jpg"],
  [27, 87, "images/20260816_727_board_amakusa_michikusa.jpg"],
  [35, 107, "images/20260704_727_board_osawa_michikusa.jpg"],
  [36, 108, "images/20260704_727_board_miyashiro_a_michikusa.jpg"],
  [39, 113, "images/20260704_727_board_fuse_michikusa.jpg"],
]) {
  const point = collection.find((item) => item.sourceNo === sourceNo);
  assert.equal(point?.minutesFromTokyo, minutes, `source No.${sourceNo} timing mismatch`);
  assert.equal(point?.photo?.src, image, `source No.${sourceNo} primary photo missing`);
  assert.ok(fs.existsSync(path.join(appDir, image)), `source No.${sourceNo} primary image file missing`);
}
assert.match(collection.find((point) => point.sourceNo === 35)?.photo?.note || "", /宮代A席の約30秒前/, "Osawa photo timing note missing");
assert.equal(collection.find((point) => point.sourceNo === 39)?.collectionPhotos?.[0]?.src, "images/20260704_727_board_fuse_2_michikusa.jpg", "Fuse secondary photo missing");
assert.ok(fs.existsSync(path.join(appDir, "images/20260704_727_board_fuse_2_michikusa.jpg")), "Fuse secondary image file missing");
for (const point of collection) {
  for (const photo of [point.photo, ...(point.collectionPhotos || [])].filter(Boolean)) {
    assert.ok(fs.existsSync(path.join(appDir, photo.src)), `${point.id} image file missing: ${photo.src}`);
    const thumb = thumbnailPath(photo.src);
    assert.ok(fs.existsSync(path.join(appDir, thumb)), `${point.id} thumbnail missing: ${thumb}`);
  }
}
assert.ok(collection.filter((point) => !point.photo).every((point) => point.image === "images/stamps/stamp_727-board.svg"), "no-photo items must use 727 SVG fallback");

assertIncludes(app, 'spot.collectionKind === "727" && spot.sourceNo !== 19 && spot.sourceNo !== 22', "TOP split must omit synthetic source 19 and 22");
assertIncludes(app, 'id === "727-board"', "TOP must retain the 727-board representative");
assertIncludes(app, 'minutesFromTokyo: [20, 21].includes(spot.sourceNo) ? representative.minutesFromTokyo', "Yoda pair must share representative time");
assertIncludes(app, "function timeline727Order", "TOP must keep deterministic representative/Yoda order");
assertIncludes(app, 'image: "images/stamps/stamp_727-board.svg"', "TOP no-photo visual must use SVG fallback");
assertIncludes(app, 'spot?.is727Collection || ["727-board", "putiputi-sign"].includes(spot?.id)', "all split 727 modals must link to the collection page");
assertIncludes(read("data.js"), "大阪の化粧品メーカー、セブンツーセブン", "synthetic 727 copy must be 727-only");
assert.equal(spots.find((spot) => spot.id === "727-board")?.ja?.name, "727看板と248看板", "representative name must remain unchanged");
assert.equal(spots.find((spot) => spot.id === "putiputi-sign")?.ja?.name, "727看板と私は誰でしょう看板", "putiputi representative must remain unchanged");

assertIncludes(shared, "727看板コレクション", "detail card title missing");
assertIncludes(script, 'point.siteStatus === "removed"', "removed collection points must be excluded from the count");
assertIncludes(shared, '"東京〜新大阪の沿線、全" + count + "地点を集める"', "rail card copy must build its count from the shared data");
assertIncludes(shared, '設置場所の全" + escapeHTML(count) + "地点を見る', "detail card copy must build its count from the shared data");
assert.equal(sharedData.collection727Count, collection.length, "generated shared data must carry the live collection count");
assert.ok(!shared.includes("代表地点から始めて、沿線の27地点"), "old verbose detail card must be removed");
assertIncludes(read("spots/727-board.html"), "spot-page-shared.js", "727 board page must load shared CTA renderer");
assertIncludes(read("spots/putiputi-sign.html"), "spot-page-shared.js", "putiputi page must load shared CTA renderer");

assertIncludes(page, `全${collectableCount}地点`, `page must show the collectable total ${collectableCount}`);
assertIncludes(shared, '"727-collection.html": { en: "en/spots/727-board.html" }', "English switch must lead to the existing 727 and 248 signs guide");
assertIncludes(page, 'data-spot-page-shared-module="topbar"', "collection page must use the shared topbar so the rail context is valid");
assert.ok(!page.includes("全体地図に戻る") && !page.includes("data-map-reset"), "reset button must be removed");
assertIncludes(page, "をっつん「新幹線から見える『727看板』の設置場所はどこか」", "note attribution missing");
assertIncludes(page, "2023年の個人調査", "attribution context missing");
assert.ok(!page.includes("727の地点数に混ぜず"), "old companion exclusion copy must be removed");
assert.ok(!page.includes('id="collectionStamps"') && !page.includes('id="collectionPhotos"'), "no standalone stamp grid or gallery");
assertIncludes(script, "data-google-map", "expanded map must be Google Maps");
assertIncludes(script, "Google マップで開く", "Google Maps external CTA missing");
assertIncludes(script, "destroyExpandedMap", "expanded iframe must unload on switch");
assertIncludes(script, "collection-point-summary-note", "optional list comments must render in collapsed rows");
assertIncludes(script, "point.collectionPhotos || []", "additional collection photos must render");
assertIncludes(script, "point.legacyStampIds || []", "shared stamps must preserve removed companion-row state");
assertIncludes(script, "requestAnimationFrame", "full map must wait for layout");
assertIncludes(script, "invalidateSize", "full map must invalidate size");
assert.ok(!script.includes("initMiniMap") && !script.includes("data-mini-map"), "Leaflet mini map must be removed");
assert.ok(/\.collection-point-list\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*1fr;/.test(styles), "list must remain one column");
assertIncludes(styles, ".collection-point-google-map", "Google expanded-map styling missing");

// 静的HTMLに直接書いた地点数が、実データからずれないよう固定する。
// 「1地点だけ」のような単数の言い回しは対象外にするため2桁以上だけを見る。
// 本文に書ける地点数は、総数・写真で確認済みの数・残りの候補数の3つだけ。
const confirmedCount = collection.filter((point) => point.photo || (point.collectionPhotos || []).length).length;
const allowedCounts = new Set([collection.length, collectableCount, confirmedCount, collectableCount - confirmedCount]);
for (const [, digits] of page.matchAll(/(\d{2,})(?:地点|か所|箇所)/g)) {
  assert.ok(allowedCounts.has(Number(digits)), `727-collection.html has a stale point count: ${digits} (expected one of ${[...allowedCounts].join(", ")})`);
}
for (const point of collection) {
  const hasPhoto = Boolean(point.photo) || (point.collectionPhotos || []).length > 0;
  if (hasPhoto) assert.equal(point.confidence, "verified", `${point.id} has a photo, so it must be marked verified`);
}
for (const label of ["title", "description", "og:title", "og:description", "twitter:title", "twitter:description"]) {
  const pattern = label === "title" ? /<title>([^<]*)<\/title>/ : new RegExp(`(?:name|property)="${label}" content="([^"]*)"`);
  const value = page.match(pattern)?.[1] || "";
  assert.ok(value.includes(`${collectableCount}地点`), `727-collection.html ${label} must state ${collectableCount}地点`);
}

const manifestEntries = new Map(manifest.files.map((entry) => [entry.path, entry]));
for (const relativePath of ["app.js", "data.js", "style.css", "spot-page-shared.js", "727-collection.html", "727-collection.js"]) {
  const entry = manifestEntries.get(relativePath);
  assert.ok(entry, `manifest entry missing: ${relativePath}`);
  assert.equal(entry.sha256, createHash("sha256").update(fs.readFileSync(path.join(appDir, relativePath))).digest("hex"), `stale manifest hash: ${relativePath}`);
}
console.log("727 collection validation passed: 27 items, shared representative stamps, list notes, TOP omissions, Google map, attribution, no reset/grid.");
