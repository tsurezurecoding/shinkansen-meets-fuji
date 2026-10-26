import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RUNTIME_SCHEMA = 'mado-spot-page-runtime';
export const RUNTIME_VERSION = 1;
export const RUNTIME_BYTE_BUDGET = 5 * 1024;
export const RUNTIME_ASSETS = Object.freeze([
  'style.css',
  'spot-media-gallery.css',
  'spot-page-shared-data.js',
  'spot-page-shared.js',
  'spot-media-gallery.js',
  'spot-map.js',
]);

// Pure input -> manifest projection. Paths never come from content-manifest.json
// or from a caller-supplied URL: this fixed list is the runtime loading contract.
export function createSpotPageRuntime(contents) {
  if (!contents || typeof contents !== 'object' || Array.isArray(contents) ||
      Object.keys(contents).length !== RUNTIME_ASSETS.length) {
    throw new Error('Runtime contents must contain exactly the allowlisted assets');
  }
  const assets = {};
  for (const asset of RUNTIME_ASSETS) {
    if (!Object.hasOwn(contents, asset) ||
        (typeof contents[asset] !== 'string' && !Buffer.isBuffer(contents[asset]))) {
      throw new Error(`Missing or invalid runtime asset: ${asset}`);
    }
    assets[asset] = createHash('sha256').update(contents[asset]).digest('hex');
  }
  return { schema: RUNTIME_SCHEMA, version: RUNTIME_VERSION, assets };
}

export function serializeSpotPageRuntime(contents) {
  const output = `${JSON.stringify(createSpotPageRuntime(contents), null, 2)}\n`;
  if (Buffer.byteLength(output, 'utf8') > RUNTIME_BYTE_BUDGET) {
    throw new Error(`Runtime manifest exceeds its ${RUNTIME_BYTE_BUDGET} byte budget`);
  }
  return output;
}

export async function generateSpotPageRuntime({
  appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  check = false,
} = {}) {
  const contents = Object.fromEntries(await Promise.all(RUNTIME_ASSETS.map(async (asset) => [
    asset, await readFile(path.join(appDir, asset)),
  ])));
  const output = serializeSpotPageRuntime(contents);
  const outputPath = path.join(appDir, 'spot-page-runtime.json');
  const current = await readFile(outputPath, 'utf8').catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  const changed = current !== output;
  if (changed && !check) await writeFile(outputPath, output, 'utf8');
  return { changed, bytes: Buffer.byteLength(output, 'utf8'), outputPath };
}

// Importing the pure helpers must not inspect or rewrite repository files.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const result = await generateSpotPageRuntime({ check });
  console.log(`Spot page runtime: ${result.changed ? (check ? 'stale' : 'written') : 'unchanged'} (${result.bytes} bytes, ${RUNTIME_ASSETS.length} assets).`);
  if (check && result.changed) process.exitCode = 1;
}
