import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SITE_RUNTIME_ASSETS = Object.freeze([
  'style.css', 'spot-media-gallery.css', 'spot-page-shared-data.js',
  'spot-page-shared.js', 'spot-media-gallery.js', 'spot-map.js',
  'android-app-invite.js', 'site-chrome.js',
]);
export const SITE_RUNTIME_BYTE_BUDGET = 16 * 1024;
export function isSharedUiAsset(file) {
  return /^shared-ui\/[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.js$/.test(file);
}

// A bounded browser inventory, separate from the complete release inventory.
export function serializeSiteRuntime(contents) {
  if (!contents || typeof contents !== 'object' || Array.isArray(contents) ||
      SITE_RUNTIME_ASSETS.some(file => !Object.hasOwn(contents, file))) throw new Error('Missing site runtime assets');
  const files = Object.keys(contents).sort();
  const assets = {};
  for (const file of files) {
    if ((!SITE_RUNTIME_ASSETS.includes(file) && !isSharedUiAsset(file)) ||
        (typeof contents[file] !== 'string' && !Buffer.isBuffer(contents[file]))) throw new Error(`Invalid site runtime asset: ${file}`);
    // Cache identity only: URLs already use eight hex digits. Full integrity
    // hashes remain in content-manifest.json and are checked for distribution.
    assets[file] = createHash('sha256').update(contents[file]).digest('hex').slice(0, 8);
  }
  const output = `${JSON.stringify({ schema: 'mado-site-runtime', version: 1, assets }, null, 2)}\n`;
  if (Buffer.byteLength(output) > SITE_RUNTIME_BYTE_BUDGET) throw new Error('Site runtime manifest exceeds byte budget');
  return output;
}

export async function generateSiteRuntime({
  appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), check = false,
} = {}) {
  const shared = await readdir(path.join(appDir, 'shared-ui'), { withFileTypes: true });
  const files = [...SITE_RUNTIME_ASSETS, ...shared.filter(entry => entry.isFile() && isSharedUiAsset(`shared-ui/${entry.name}`)).map(entry => `shared-ui/${entry.name}`)];
  const contents = Object.fromEntries(await Promise.all(files.map(async file => [file, await readFile(path.join(appDir, file))])));
  const output = serializeSiteRuntime(contents);
  const outputPath = path.join(appDir, 'site-runtime.json');
  const current = await readFile(outputPath, 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  const changed = current !== output;
  if (changed && !check) await writeFile(outputPath, output, 'utf8');
  return { changed, outputPath, bytes: Buffer.byteLength(output), assets: files.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check');
  const result = await generateSiteRuntime({ check });
  console.log(`Site runtime: ${result.changed ? (check ? 'stale' : 'written') : 'unchanged'} (${result.bytes} bytes, ${result.assets} assets).`);
  if (check && result.changed) process.exitCode = 1;
}
