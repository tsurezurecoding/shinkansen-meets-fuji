import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "mado-manifest-"));
const generated = path.join(temporaryDirectory, "content-manifest.json");

try {
  execFileSync(process.execPath, [path.join(appRoot, "scripts", "generate-content-manifest.mjs")], {
    cwd: appRoot,
    env: { ...process.env, MADO_CONTENT_MANIFEST_OUTPUT: generated },
    stdio: "inherit",
  });
  const expected = fs.readFileSync(path.join(appRoot, "content-manifest.json"));
  const actual = fs.readFileSync(generated);
  if (!expected.equals(actual)) {
    throw new Error("content-manifest.json is stale. Run node scripts/generate-content-manifest.mjs.");
  }
  const manifestPaths = new Set(JSON.parse(actual).files.map(file => file.path));
  const tripPhotos = JSON.parse(fs.readFileSync(path.join(appRoot, "data/window-trip-photo-sources.json"), "utf8")).photos;
  const missing = tripPhotos.filter(photo => !manifestPaths.has(photo.src));
  if (missing.length) throw new Error(`Offline window trip photos missing from manifest: ${missing.map(photo => photo.src).join(", ")}`);
  console.log("Content manifest is deterministic and current.");
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
