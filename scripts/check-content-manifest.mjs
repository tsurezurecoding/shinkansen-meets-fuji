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
  console.log("Content manifest is deterministic and current.");
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
