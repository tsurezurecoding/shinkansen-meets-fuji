import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteBaseUrl = "https://www.michikusa-travel.com/";

// content-manifest.json の files は、この配列が単一ソース。
//
// content-manifest.json を直接編集して項目を足しても、このスクリプトを次に実行した瞬間に消える。
// 資産を追加するときは、かならずこの配列へ足すこと。
//
// 並び順は下の sortedContentFiles で正規化するため、ここでは意味のまとまりで並べてよい。
const contentFiles = [
  // ライブ案内・車窓データの本体
  "data.js",
  "data/timetable.js",
  "live/narration.js",

  // 期間限定ページ: Sparkling Dreams Shinkansen（日英）
  "en/index.html",
  "en/sparkling-dreams.html",
  "sparkling-dreams.html",
  "sparkling-dreams.js",
  "images/20260802_sparkling-dreams-hamanako_toshi549.jpg",
  "images/og-sparkling-dreams.png",
  "images/sparkling-dreams-window.svg",

  // 季節ページ: 新幹線から見える花火（日英）
  "hanabi.html",
  "en/hanabi.html",
  "hanabi.js",
  "images/hanabi-window.svg",
  "images/og-hanabi.jpg",
  "images/hanabi-hero-pd.jpg",

  // アプリ本体・共通スポット表示・727看板コレクション
  "app.js",
  "index.html",
  "journal.html",
  "spot-map.js",
  "spot-page-shared.js",
  "style.css",
  "727-collection.html",
  "727-collection.js",
  "images/og-727-collection.jpg",
  "images/20260629_727_board_1_4x_michikusa.jpg",
  "images/20260629_727_board_2_2x_michikusa.jpg",
  "images/20260704_727_board_kuzuhara_1_michikusa.jpg",
  "images/20260704_putiputi_sign_1_michikusa.jpg",
  "images/20260704_727_board_osawa_michikusa.jpg",
  "images/20260704_727_board_haracho_michikusa.jpg",
  "images/20260704_727_board_miyashiro_a_michikusa.jpg",
  "images/20260704_727_board_fuse_michikusa.jpg",
  "images/20260704_727_board_fuse_2_michikusa.jpg",
  "images/20260803_727_board_karasakiminami_michikusa.jpg",
  "images/20260803_727_board_torikaihachicho_michikusa.jpg",
  "images/stamps/stamp_727-board.svg",
  "vendor/leaflet/LICENSE",
  "vendor/leaflet/images/layers-2x.png",
  "vendor/leaflet/images/layers.png",
  "vendor/leaflet/images/marker-icon-2x.png",
  "vendor/leaflet/images/marker-icon.png",
  "vendor/leaflet/images/marker-shadow.png",
  "vendor/leaflet/leaflet.css",
  "vendor/leaflet/leaflet.js",
];

// contentVersion は files の並び順に依存するため、宣言順ではなくパスの昇順で正規化する。
// これで「配列のどこへ足したか」で contentVersion が変わることがなくなる。
const sortedContentFiles = [...new Set(contentFiles)].sort((a, b) => a.localeCompare(b));
if (sortedContentFiles.length !== contentFiles.length) {
  const seen = new Set();
  const duplicates = contentFiles.filter((item) => (seen.has(item) ? true : (seen.add(item), false)));
  throw new Error(`generate-content-manifest: contentFiles に重複があります: ${[...new Set(duplicates)].join(", ")}`);
}

async function fileEntry(relativePath) {
  const absolutePath = path.join(appRoot, relativePath);
  const [buffer, info] = await Promise.all([readFile(absolutePath), stat(absolutePath)]).catch((error) => {
    if (error && error.code === "ENOENT") {
      throw new Error(`generate-content-manifest: contentFiles に載っているファイルが見つかりません: ${relativePath}`);
    }
    throw error;
  });
  return {
    path: relativePath.replaceAll("\\", "/"),
    url: new URL(relativePath.replaceAll("\\", "/"), siteBaseUrl).href,
    bytes: info.size,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

async function walkFiles(directory, predicate) {
  const root = path.join(appRoot, directory);
  const results = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(target);
      } else if (entry.isFile()) {
        const relative = path.relative(appRoot, target).replaceAll("\\", "/");
        if (predicate(relative)) results.push(relative);
      }
    }
  }
  await walk(root);
  return results.sort((a, b) => a.localeCompare(b));
}

const audioPaths = await walkFiles("live/audio", (relative) => relative.endsWith(".mp3"));
const thumbPaths = await walkFiles("images/thumbs", (relative) => relative.endsWith(".webp"));

const audio = await Promise.all(audioPaths.map(fileEntry));
const thumbnails = await Promise.all(thumbPaths.map(fileEntry));
const files = await Promise.all(sortedContentFiles.map(fileEntry));

function audioPack(direction, language) {
  const suffix = `_${direction}_${language}.mp3`;
  const items = audio.filter((item) => item.path.endsWith(suffix));
  const bytes = items.reduce((sum, item) => sum + item.bytes, 0);
  return { direction, language, itemCount: items.length, bytes, items };
}

const audioPacks = [
  audioPack("down", "ja"),
  audioPack("down", "en"),
  audioPack("up", "ja"),
  audioPack("up", "en"),
];
// contentVersion は「出力したマニフェスト自身を、書かれている順に読んだハッシュ」とする。
//
// 以前はここで audio（パス昇順の平坦リスト）を使っていたが、マニフェストに実際に載るのは
// audioPacks（down/ja → down/en → up/ja → up/en の順）で、並びが一致していなかった。
// そのため validate-sparkling-dreams.mjs が読み直して再計算すると必ず値が食い違い、
// 「contentVersion is stale」で落ちていた。検証側の式（同ファイル 372-377行）と揃えてある。
const contentVersion = createHash("sha256")
  .update(files.map((item) => item.sha256).join(":"))
  .update(audioPacks.flatMap((pack) => pack.items).map((item) => item.sha256).join(":"))
  .update(thumbnails.map((item) => item.sha256).join(":"))
  .digest("hex")
  .slice(0, 16);

const manifest = {
  schemaVersion: 1,
  contentVersion,
  generatedAt: process.env.MADO_CONTENT_MANIFEST_GENERATED_AT || new Date().toISOString(),
  minShellVersion: "0.1.0",
  siteBaseUrl,
  files,
  audioPacks,
  thumbnails: {
    itemCount: thumbnails.length,
    bytes: thumbnails.reduce((sum, item) => sum + item.bytes, 0),
    items: thumbnails,
  },
};

await writeFile(
  process.env.MADO_CONTENT_MANIFEST_OUTPUT
    ? path.resolve(process.env.MADO_CONTENT_MANIFEST_OUTPUT)
    : path.join(appRoot, "content-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

console.log(`content-manifest.json generated: ${manifest.contentVersion}`);
console.log(`content files: ${files.length} (${files.map((item) => item.path).join(", ")})`);
console.log(`audio packs: ${manifest.audioPacks.map((pack) => `${pack.direction}/${pack.language} ${pack.itemCount} files ${pack.bytes} bytes`).join(", ")}`);
console.log(`thumbnails: ${manifest.thumbnails.itemCount} files ${manifest.thumbnails.bytes} bytes`);
