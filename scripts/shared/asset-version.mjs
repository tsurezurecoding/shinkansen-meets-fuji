// Content-derived cache-bust tokens for local asset ?v= query strings.
// Replaces hand-maintained tokens (which drift and can get rolled back by
// re-running the generators) with a hash of the actual file bytes.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..", "..");

const cache = new Map();

export function assetVersion(relativePathFromAppRoot) {
  if (cache.has(relativePathFromAppRoot)) return cache.get(relativePathFromAppRoot);
  const absolutePath = path.join(appRoot, relativePathFromAppRoot);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`assetVersion: no such file "${relativePathFromAppRoot}" (resolved to ${absolutePath})`);
  }
  const bytes = fs.readFileSync(absolutePath);
  const hash = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 8);
  cache.set(relativePathFromAppRoot, hash);
  return hash;
}
