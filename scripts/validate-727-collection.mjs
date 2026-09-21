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
  [36, 108, "images/20260820_727_board_miyashiro_a_michikusa.jpg"],
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
const minutesOf = (sourceNo) => collection.find((point) => point.sourceNo === sourceNo)?.minutesFromTokyo;
assert.ok(minutesOf(19) < minutesOf(20) && minutesOf(20) <= minutesOf(21) && minutesOf(21) < minutesOf(22), "Kuzuhara must precede Yoda, and Yoda must precede Terasaka, along the track");
assert.equal(spots.find((spot) => spot.id === "727-board")?.minutesFromTokyo, minutesOf(19), "248 spot must share the Kuzuhara collection time");
assert.ok(spots.find((spot) => spot.id === "727-board")?.minutesFromTokyo < spots.find((spot) => spot.id === "727-sign")?.minutesFromTokyo, "248 (Kuzuhara) must come before the Yoda 727 spot");
const spotMinutes = (id) => spots.find((spot) => spot.id === id)?.minutesFromTokyo;
assert.ok(spotMinutes("hinataoka") < spotMinutes("putiputi-sign") && spotMinutes("putiputi-sign") - spotMinutes("hinataoka") < 1, "putiputi must follow Hinataoka by less than a minute");
assert.equal(spotMinutes("putiputi-sign"), minutesOf(22), "putiputi spot and the Terasaka collection point must share one time");
assertIncludes(spots.find((spot) => spot.id === "727-sign")?.ja?.story || "", "用田付近では、A席側に続けて現れます", "the 727 modal must say the Yoda signs continue on Seat A");
assert.ok((spots.find((spot) => spot.id === "727-sign")?.photos || []).some((photo) => photo.src.includes("20260629_727_board")), "Yoda 727 photos belong to the 727 spot");
assert.ok(!(spots.find((spot) => spot.id === "727-board")?.photos || []).some((photo) => photo.src.includes("20260629_727_board")), "Yoda 727 photos must not stay on the 248 page");
assertIncludes(app, "spot.sourceNo !== 21", "the standalone Yoda point is the 727-sign spot, so the expanded timeline must not repeat it");
assertIncludes(app, 'spot?.id === "727-sign"', "the 727-sign spot must carry the 727 filter tag");
assertIncludes(app, `"727-board", "727-sign", "genki-sign"`, "the 727-sign spot must be in the sign filter group");
assert.ok(!(spots.find((spot) => spot.id === "putiputi-sign")?.metaDescription?.ja || "").includes("藤沢"), "putiputi search description must not place the sign in Fujisawa");
assert.ok(!page.includes("全部で27か所"), "the hero challenge must use the collectable count, not the record count");
assert.ok(!app.includes("representative.minutesFromTokyo"), "Yoda pair must not borrow the Kuzuhara representative time");
assertIncludes(app, "function timeline727Order", "TOP must keep deterministic representative/Yoda order");
assertIncludes(app, 'image: "images/stamps/stamp_727-board.svg"', "TOP no-photo visual must use SVG fallback");
assertIncludes(app, 'spot?.is727Collection || ["727-board", "putiputi-sign"].includes(spot?.id)', "all split 727 modals must link to the collection page");
assertIncludes(read("data.js"), "大阪の化粧品メーカー、セブンツーセブン", "synthetic 727 copy must be 727-only");
assert.equal(spots.find((spot) => spot.id === "727-board")?.ja?.name, "きぬた歯科の248看板", "the former combined spot must present 248 and its advertiser as its subject");
assert.equal(spots.find((spot) => spot.id === "727-sign")?.ja?.name, "727 COSMETICS看板", "the Yoda 727 spot must name its advertiser");
assertIncludes(spots.find((spot) => spot.id === "727-sign")?.ja?.story || "", "727看板コレクション", "the 727 modal copy must lead to the collection");
assert.equal(spots.find((spot) => spot.id === "putiputi-sign")?.ja?.name, "プチプチの看板", "putiputi must keep a concise primary name");
assert.equal(spots.find((spot) => spot.id === "putiputi-sign")?.pageHeadingChunks?.ja?.join("|"), "プチプチの看板|「私は誰でしょう？」", "putiputi must retain the current sign copy as a subtitle");
assertIncludes(read("data.js"), "2026年10月1日付で社名を「プチプチ株式会社」へ変更", "putiputi company-name change must remain in the page copy");
assertIncludes(read("app.js"), 'spot.sourceNo === 21', "the verified standalone 727 point must remain in the regular gallery");
assertIncludes(read("app.js"), 'spot?.is727Collection) return "727-collection.html"', "Japanese 727 entries must open the collection page");

assertIncludes(shared, "727看板コレクション", "detail card title missing");
assertIncludes(script, 'point.siteStatus === "removed"', "removed collection points must be excluded from the count");
assertIncludes(shared, '"東京〜新大阪の沿線、全" + count + "地点を集める"', "rail card copy must build its count from the shared data");
assertIncludes(shared, '設置場所の全" + escapeHTML(count) + "地点を見る', "detail card copy must build its count from the shared data");
assert.equal(sharedData.collection727Count, collection.length, "generated shared data must carry the live collection count");
assert.ok(!shared.includes("代表地点から始めて、沿線の27地点"), "old verbose detail card must be removed");
assertIncludes(read("spots/727-board.html"), "spot-page-loader.js", "727 board page must load shared CTA renderer");
assertIncludes(read("spots/putiputi-sign.html"), "spot-page-loader.js", "putiputi page must load shared CTA renderer");

assertIncludes(page, `全${collectableCount}地点`, `page must show the collectable total ${collectableCount}`);
assertIncludes(shared, '"727-collection.html": { en: true }', "English switch must lead to the English collection page");
const englishPage = read("en/727-collection.html");
assertIncludes(englishPage, '<html lang="en">', "English collection page must declare its language");
assertIncludes(englishPage, 'data-spot-page-shared-lang="en" data-spot-page-shared-root="../"', "English collection page must use the English shared chrome at the /en/ root");
assertIncludes(englishPage, 'href="https://www.michikusa-travel.com/en/727-collection.html"', "English collection page must be its own canonical");
assertIncludes(englishPage, 'src="../727-collection.js', "English collection page must load the shared collection script from the site root");
const englishProse = englishPage.replace(/https?:\/\/[^"'<>\s]+/g, "");
assert.ok(!/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(englishProse), "English collection page must not contain Japanese copy outside URLs");
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
assertIncludes(script, "collection-point-summary-time", "collapsed rows must show minutes from Tokyo");
assertIncludes(script, "segmentGroups", "collection list must group points by station segment");
assertIncludes(script, "Number(a.minutesFromTokyo || 0) - Number(b.minutesFromTokyo || 0)", "collection timeline must sort points by minutes from Tokyo");
assertIncludes(page, "東京からの時間順に、駅と駅のあいだでまとめました。", "timeline explanation missing");
assert.ok(page.indexOf('id="collectionMap"') < page.indexOf('id="collectionList"'), "full map must appear before the timeline list");
assert.ok(!page.includes('data-collection-filter="photo"') && !page.includes('data-collection-filter="no-photo"'), "photo-presence filters must stay removed");
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
