import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteBaseUrl = "https://www.michikusa-travel.com/";

const contentFiles = [
  "data.js",
  "data/timetable.js",
  "live/narration.js",
];

async function fileEntry(relativePath) {
  const absolutePath = path.join(appRoot, relativePath);
  const [buffer, info] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
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
const files = await Promise.all(contentFiles.map(fileEntry));

function audioPack(direction, language) {
  const suffix = `_${direction}_${language}.mp3`;
  const items = audio.filter((item) => item.path.endsWith(suffix));
  const bytes = items.reduce((sum, item) => sum + item.bytes, 0);
  return { direction, language, itemCount: items.length, bytes, items };
}

const manifest = {
  schemaVersion: 1,
  contentVersion: createHash("sha256")
    .update(files.map((item) => item.sha256).join(":"))
    .update(audio.map((item) => item.sha256).join(":"))
    .update(thumbnails.map((item) => item.sha256).join(":"))
    .digest("hex")
    .slice(0, 16),
  generatedAt: new Date().toISOString(),
  minShellVersion: "0.1.0",
  siteBaseUrl,
  files,
  audioPacks: [
    audioPack("down", "ja"),
    audioPack("down", "en"),
    audioPack("up", "ja"),
    audioPack("up", "en"),
  ],
  thumbnails: {
    itemCount: thumbnails.length,
    bytes: thumbnails.reduce((sum, item) => sum + item.bytes, 0),
    items: thumbnails,
  },
};

await writeFile(
  path.join(appRoot, "content-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

console.log(`content-manifest.json generated: ${manifest.contentVersion}`);
console.log(`audio packs: ${manifest.audioPacks.map((pack) => `${pack.direction}/${pack.language} ${pack.itemCount} files ${pack.bytes} bytes`).join(", ")}`);
console.log(`thumbnails: ${manifest.thumbnails.itemCount} files ${manifest.thumbnails.bytes} bytes`);
