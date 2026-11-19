import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const layoutPath = 'scripts/pages-layout.json';
const packageScript = 'scripts/pages-package.mjs';

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

function publicPath(path, layout) {
  const [root, child] = path.split('/');
  if (child) {
    if (layout.publicDirectories.includes(root)) return true;
    if (layout.sourceDirectories.includes(root)) return false;
  } else {
    if (layout.sourceFiles.includes(root)) return false;
    if (layout.publicRootFiles.includes(root) || layout.publicRootExtensions.includes(posix.extname(root))) return true;
  }
  throw new Error(`Classify ${root} in ${layoutPath} before packaging Pages`);
}

export function pagesInventory(ref, cwd = process.cwd()) {
  const sha = git(cwd, 'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`).trim();
  const records = git(cwd, 'ls-tree', '--full-tree', '-rlz', sha).split('\0').filter(Boolean);
  const files = new Map();
  for (const record of records) {
    const tab = record.indexOf('\t');
    const [mode, , , size] = record.slice(0, tab).trim().split(/\s+/);
    files.set(record.slice(tab + 1), { mode, bytes: Number(size) });
  }
  const layout = files.has(layoutPath) ? JSON.parse(git(cwd, 'show', `${sha}:${layoutPath}`)) : null;
  if (!layout && files.has(packageScript)) throw new Error(`Missing Pages layout at ${sha}`);
  const selected = new Map();
  const required = new Set();
  let totalBytes = 0;
  let publicBytes = 0;
  for (const [path, entry] of files) {
    totalBytes += entry.bytes;
    if (layout && !publicPath(path, layout)) continue;
    if (layout && !/^100(?:644|755)$/.test(entry.mode)) throw new Error(`Pages requires a regular file: ${path}`);
    if (/[\r\n\\]/.test(path)) throw new Error(`Unsupported Pages filename: ${JSON.stringify(path)}`);
    selected.set(path, entry.bytes);
    publicBytes += entry.bytes;
    // Legacy upload-pages-artifact versions differ in how they treat dotfiles.
    if (layout || !path.split('/').some(part => part.startsWith('.'))) required.add(path);
  }
  if (layout) {
    for (const path of layout.requiredFiles) {
      if (!selected.has(path)) throw new Error(`Missing required Pages file: ${path}`);
    }
    const manifest = JSON.parse(git(cwd, 'show', `${sha}:content-manifest.json`));
    const assets = [...manifest.files, ...manifest.audioPacks.flatMap(pack => pack.items), ...manifest.thumbnails.items];
    for (const { path, bytes } of assets) {
      if (selected.get(path) !== bytes) throw new Error(`Pages inventory differs from content manifest: ${path}`);
    }
  }
  return { sha, legacy: !layout, selected, required, totalFiles: files.size, totalBytes, publicBytes };
}

export function verifyPagesEntries(inventory, listing) {
  const seen = new Set();
  for (const line of listing.split(/\r?\n/)) {
    const path = line.replace(/^\.\//, '');
    if (!path || path === '.' || path.endsWith('/')) continue;
    if (!inventory.selected.has(path)) throw new Error(`Unexpected Pages file: ${path}`);
    if (seen.has(path)) throw new Error(`Duplicate Pages file: ${path}`);
    seen.add(path);
  }
  for (const path of inventory.required) {
    if (!seen.has(path)) throw new Error(`Missing Pages file: ${path}`);
  }
  return seen.size;
}

function main([command, ref, listing]) {
  if (!ref || !['check', 'roots', 'verify'].includes(command) || (command === 'verify') !== Boolean(listing)) {
    throw new Error('Usage: pages-package.mjs check|roots <commit> or verify <commit> <entry-list>');
  }
  const inventory = pagesInventory(ref);
  if (command !== 'verify' && inventory.legacy) throw new Error('A Pages layout is required to stage a new candidate');
  if (command === 'roots') {
    const roots = new Set([...inventory.selected.keys()].map(path => path.split('/')[0]));
    process.stdout.write([...roots].join('\0') + '\0');
  } else if (command === 'verify') {
    const count = verifyPagesEntries(inventory, readFileSync(listing, 'utf8'));
    console.log(`Verified ${count} Pages files at ${inventory.sha}${inventory.legacy ? ' (legacy full checkout)' : ''}.`);
  } else {
    console.log(`Pages: ${inventory.selected.size}/${inventory.totalFiles} files, ${inventory.publicBytes}/${inventory.totalBytes} source bytes at ${inventory.sha}.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2));
