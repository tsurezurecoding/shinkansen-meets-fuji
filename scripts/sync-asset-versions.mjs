// 手書きHTMLの ?v= トークンを、生成器と同じ assetVersion()（ファイル内容のsha256先頭8桁）に揃える。
//
// 背景: spots/*.html などの生成ページは assetVersion() を使うが、index.html や
// zukan.html のような手書きページは日付タグ（20260815-727-rail など）を手で
// 書き換える運用だった。結果、data.js を更新しても手書きページだけ古い ?v= が
// 残り、「スポットページは直ったのにトップは古い」という混在状態が起きる。
//
// 使い方:
//   node scripts/sync-asset-versions.mjs          書き換える
//   node scripts/sync-asset-versions.mjs --check  差分があれば非ゼロ終了（CI用）

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assetVersion } from "./shared/asset-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const checkOnly = process.argv.includes("--check");

function htmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "vendor" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

// 属性値に現れる「ローカル資産?v=トークン」だけを対象にする。
// 外部URL(http/https///)とYouTubeの ?v= は除外する。
const REFERENCE = /(["'(])((?:\.\.\/)*[A-Za-z0-9._\-/]+\.(?:js|css|mjs))\?v=([A-Za-z0-9._-]+)/g;

let changedFiles = 0;
let changedTokens = 0;
const missing = new Set();

for (const file of htmlFiles(appRoot)) {
  // .gitattributes declares "*.html text eol=lf". A file that reached the working tree
  // with CRLF stays CRLF through every read-modify-write, and git hides it because it
  // normalizes on read — but content-manifest.json hashes the bytes on disk, so the
  // mismatch only surfaces later as a stale-sha failure. Normalize as we pass through.
  const raw = fs.readFileSync(file, "utf8");
  const before = raw.split("\r\n").join("\n");
  // <base href="..."> があれば相対参照の基準はそちら。en/index.html は <base href="../">
  // を持つため、ファイルの所在ディレクトリ基準で解決すると参照先を取り違える。
  const baseHref = before.match(/<base\b[^>]*\bhref=["']([^"']+)["']/i)?.[1] || "./";
  const resolveRoot = path.resolve(path.dirname(file), baseHref);
  const after = before.replace(REFERENCE, (whole, quote, ref, token) => {
    // 先頭 "/" だけ app ルート基準。それ以外は <base>（既定はファイルの所在）基準。
    const absolute = ref.startsWith("/")
      ? path.join(appRoot, ref.slice(1))
      : path.resolve(resolveRoot, ref);
    const relative = path.relative(appRoot, absolute).replace(/\\/g, "/");
    if (relative.startsWith("..") || !fs.existsSync(absolute)) {
      missing.add(ref);
      return whole;
    }
    const next = assetVersion(relative);
    if (next !== token) changedTokens += 1;
    return `${quote}${ref}?v=${next}`;
  });
  if (after === raw) continue;
  changedFiles += 1;
  if (!checkOnly) fs.writeFileSync(file, after, "utf8");
  console.log(`  ${checkOnly ? "STALE" : "updated"}: ${path.relative(appRoot, file).replace(/\\/g, "/")}`);
}

for (const relative of missing) console.warn(`  warn: 参照先が見つからないためスキップ: ${relative}`);

if (checkOnly && changedFiles) {
  console.error(`asset version drift: ${changedTokens} tokens in ${changedFiles} files are stale. Run: npm run sync:versions`);
  process.exit(1);
}
console.log(`asset versions ${checkOnly ? "checked" : "synced"}: ${changedTokens} tokens in ${changedFiles} files.`);
