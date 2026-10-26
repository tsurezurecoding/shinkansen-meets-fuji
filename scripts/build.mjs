import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CACHE_VERSION = 1;
export const CACHE_PATH = '.codex-local/build-cache.json';
// Deliberately narrow. Generator/helper edits, new files, removed files and
// changed generated assets always require the existing complete build.
export const FAST_GROUPS = Object.freeze([
  {
    name: 'android-invite',
    sources: [
      'scripts/shared/android-app-invite-runtime.js',
      'scripts/shared/android-app-invite-copy.mjs',
      'scripts/shared/android-app-invite-policy.mjs',
      'scripts/shared/android-app-invite.css',
    ],
    assets: ['android-app-invite.js'],
    generator: 'scripts/generate-android-app-invite-assets.mjs',
  },
]);
const MANIFEST_GENERATOR = 'scripts/generate-content-manifest.mjs';
const REQUIRED_OUTPUTS = ['android-app-invite.js', 'spot-page-runtime.json', 'content-manifest.json'];
const ROOT_EXCLUSIONS = new Set(['.git', '.codex-local', '.claude', '.tmp_pydeps', '.secrets', 'node_modules', 'AGENTS.md']);
const sha256 = value => createHash('sha256').update(value).digest('hex');

function excluded(relative) {
  return ROOT_EXCLUSIONS.has(relative.split('/')[0]) || /^live\/audio\/[^/]+\.wav$/.test(relative);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i'))?.slice(1).find(value => value !== undefined);
}

function decodeAttribute(value) {
  return value.replace(/&amp;/gi, '&').replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10)));
}

function versionedAssets(html, relative) {
  const origin = 'https://build.invalid';
  const page = new URL(relative, `${origin}/`);
  const baseTag = html.match(/<base\b[^>]*>/i)?.[0];
  const baseHref = baseTag && attribute(baseTag, 'href');
  let base = page;
  try { if (baseHref) base = new URL(decodeAttribute(baseHref), page); } catch { /* Invalid base cannot add a local asset reference. */ }
  const assets = [];
  for (const tag of html.matchAll(/<[a-z][^>]*>/gi)) {
    for (const name of ['src', 'href', 'poster']) {
      const value = attribute(tag[0], name);
      if (!value) continue;
      try {
        const url = new URL(decodeAttribute(value), base);
        if ([origin, 'https://www.michikusa-travel.com'].includes(url.origin) && url.searchParams.has('v')) {
          assets.push(decodeURIComponent(url.pathname).replace(/^\//, ''));
        }
      } catch { /* Invalid URLs are handled by the existing navigation validators. */ }
    }
  }
  return assets;
}

export async function fingerprint(root) {
  const started = performance.now();
  const paths = [];
  async function walk(directory = '') {
    for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
      const relative = directory ? `${directory}/${entry.name}` : entry.name;
      if (excluded(relative)) continue;
      if (entry.isDirectory()) await walk(relative);
      else if (entry.isFile()) paths.push(relative);
      else throw new Error(`Cannot safely fingerprint non-regular file: ${relative}`);
    }
  }
  await walk();
  paths.sort();
  const entries = new Array(paths.length);
  const htmlAssets = new Set();
  let cursor = 0;
  // Stream even large media, and bound concurrent handles/memory. No mtime
  // shortcut: the bytes of every included source AND output are read each run.
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (cursor < paths.length) {
      const index = cursor++;
      const relative = paths[index];
      const target = path.join(root, relative);
      const before = await stat(target);
      const hash = createHash('sha256');
      const html = relative.endsWith('.html') ? [] : null;
      let bytes = 0;
      for await (const chunk of createReadStream(target)) {
        hash.update(chunk);
        bytes += chunk.length;
        if (html) html.push(chunk);
      }
      const after = await stat(target);
      if (before.size !== bytes || after.size !== bytes || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
        throw new Error(`File changed while fingerprinting: ${relative}`);
      }
      if (html) for (const asset of versionedAssets(Buffer.concat(html).toString('utf8'), relative)) htmlAssets.add(asset);
      entries[index] = [relative, { bytes, sha256: hash.digest('hex') }];
    }
  }));
  return { files: Object.fromEntries(entries), htmlAssets, bytes: entries.reduce((total, [, entry]) => total + entry.bytes, 0), ms: performance.now() - started };
}

export function environmentFingerprint(env = process.env) {
  // Record hashes, never credentials or local environment values. Package and
  // lockfile bytes are included by fingerprint(); installed dependencies must
  // still match the lockfile, as required by the normal build/CI workflow.
  const keys = ['PATH', 'MADO_PYTHON', 'PYTHONPATH', 'PYTHONHOME', 'USERPROFILE', 'NODE_OPTIONS', 'TZ', 'LANG', 'LC_ALL', 'MADO_CONTENT_MANIFEST_OUTPUT'];
  return sha256(JSON.stringify([process.version, process.platform, process.arch, process.execPath, ...keys.map(key => [key, env[key] || ''])]));
}

function diffFiles(previous, current) {
  const added = Object.keys(current).filter(file => !Object.hasOwn(previous, file));
  const removed = Object.keys(previous).filter(file => !Object.hasOwn(current, file));
  const changed = Object.keys(current).filter(file => previous[file] && (previous[file].sha256 !== current[file].sha256 || previous[file].bytes !== current[file].bytes));
  return { added, removed, changed };
}

function validCache(cache, environment) {
  return cache?.version === CACHE_VERSION && cache.environment === environment && cache.files &&
    typeof cache.files === 'object' && !Array.isArray(cache.files) && Object.keys(cache.files).length > 0 &&
    Object.values(cache.files).every(entry => entry && /^[a-f\d]{64}$/.test(entry.sha256) && Number.isSafeInteger(entry.bytes) && entry.bytes >= 0);
}

export function chooseBuild(cache, current, { force = false, environment } = {}) {
  if (force) return { mode: 'full', reason: 'forced' };
  if (!validCache(cache, environment)) return { mode: 'full', reason: 'no compatible successful cache' };
  const delta = diffFiles(cache.files, current.files);
  if (delta.added.length || delta.removed.length) return { mode: 'full', reason: 'file set changed' };
  if (!delta.changed.length) return { mode: 'noop', reason: 'all source/output bytes match' };
  const groups = FAST_GROUPS.filter(group => group.sources.some(source => delta.changed.includes(source)));
  if (!delta.changed.every(file => groups.some(group => group.sources.includes(file)))) return { mode: 'full', reason: 'source or output outside asset whitelist changed' };
  if (groups.some(group => group.assets.some(asset => current.htmlAssets.has(asset)))) return { mode: 'full', reason: 'HTML directly versions a changed asset' };
  return { mode: 'assets', reason: groups.map(group => group.name).join(', '), groups };
}

async function executeCommand(command, root) {
  const args = command.kind === 'full' ? ['run', 'build:full'] : [command.script];
  let executable = process.execPath;
  let shell = false;
  if (command.kind === 'full') {
    if (process.env.npm_execpath) args.unshift(process.env.npm_execpath);
    else { executable = process.platform === 'win32' ? 'npm.cmd' : 'npm'; shell = process.platform === 'win32'; }
  }
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: root, stdio: 'inherit', shell });
    child.on('error', reject);
    child.on('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command.kind === 'full' ? 'npm run build:full' : command.script} failed (${signal || code})`)));
  });
}

async function assertOutputs(root, snapshot) {
  for (const file of REQUIRED_OUTPUTS) if (!snapshot.files[file]) throw new Error(`Build output missing: ${file}`);
  // Reuse the bytes already hashed above to ensure the generated release
  // inventory describes existing outputs, rather than trusting exit status.
  const manifest = JSON.parse(await readFile(path.join(root, 'content-manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.files)) throw new Error('Build output content-manifest.json has no file inventory');
  const entries = [...manifest.files, ...(manifest.audioPacks || []).flatMap(pack => pack.items || []), ...(manifest.thumbnails?.items || [])];
  for (const entry of entries) {
    const actual = snapshot.files[entry.path];
    if (!actual || actual.sha256 !== entry.sha256 || actual.bytes !== entry.bytes) throw new Error(`Build output differs from manifest: ${entry.path}`);
  }
}

export async function runBuild({
  root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  force = false,
  execute = executeCommand,
  log = console.log,
  environment = environmentFingerprint(),
} = {}) {
  const started = performance.now();
  const cachePath = path.join(root, CACHE_PATH);
  let cache;
  try { cache = JSON.parse(await readFile(cachePath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
  let snapshot = await fingerprint(root);
  let fingerprintMs = snapshot.ms;
  let plan = chooseBuild(cache, snapshot, { force, environment });
  let commands = 0;
  const run = async command => { commands += 1; await execute(command, root); };
  log(`[build] ${plan.mode}: ${plan.reason}; fingerprint ${Math.round(snapshot.ms)}ms (${Object.keys(snapshot.files).length} files, ${snapshot.bytes} bytes)`);
  if (plan.mode === 'assets') {
    for (const group of plan.groups) await run({ kind: 'generator', script: group.generator });
    await run({ kind: 'generator', script: MANIFEST_GENERATOR });
    const next = await fingerprint(root);
    fingerprintMs += next.ms;
    const delta = diffFiles(snapshot.files, next.files);
    const allowed = new Set([...plan.groups.flatMap(group => group.assets), 'content-manifest.json', 'spot-page-runtime.json', 'site-runtime.json']);
    if (delta.added.length || delta.removed.length || delta.changed.some(file => !allowed.has(file))) {
      // A generator acquired an unaccounted dependency/output, or a concurrent
      // edit happened. Never bless that state as a successful asset-only build.
      plan = { mode: 'full', reason: 'asset generation changed unexpected files' };
      log(`[build] full: ${plan.reason}`);
    }
    snapshot = next;
  }
  if (plan.mode === 'full') {
    await run({ kind: 'full' });
    snapshot = await fingerprint(root);
    fingerprintMs += snapshot.ms;
  }
  if (plan.mode !== 'noop') {
    await assertOutputs(root, snapshot);
    await mkdir(path.dirname(cachePath), { recursive: true });
    const temporary = `${cachePath}.${process.pid}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify({ version: CACHE_VERSION, environment, files: snapshot.files })}\n`);
      await rename(temporary, cachePath);
    } finally { await rm(temporary, { force: true }); }
  }
  const result = { mode: plan.mode, commands, files: Object.keys(snapshot.files).length, bytes: snapshot.bytes, fingerprintMs: Math.round(fingerprintMs), totalMs: Math.round(performance.now() - started) };
  log(`[build] ${result.mode} complete; commands ${commands}, fingerprint ${result.fingerprintMs}ms, total ${result.totalMs}ms`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const flags = process.argv.slice(2);
  if (flags.some(flag => flag !== '--force')) throw new Error('Usage: node scripts/build.mjs [--force]');
  await runBuild({ force: flags.includes('--force') });
}
