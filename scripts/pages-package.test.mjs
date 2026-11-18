import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pagesInventory, verifyPagesEntries } from './pages-package.mjs';

const cli = fileURLToPath(new URL('./pages-package.mjs', import.meta.url));
const layout = {
  publicDirectories: ['en', 'images', 'quiz', 'v0', 'v1'],
  publicRootExtensions: ['.html', '.js'],
  publicRootFiles: ['CNAME', 'content-manifest.json', 'robots.txt', 'sitemap.xml'],
  sourceDirectories: ['scripts', '.github', 'docs'],
  sourceFiles: ['.gitignore', 'package.json'],
  requiredFiles: ['index.html', 'en/index.html', 'CNAME', 'v0/index.html', 'v1/index.html']
};

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'pages-package-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  function write(path, contents) {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), contents);
  }
  function commit(files) {
    for (const [path, contents] of Object.entries(files)) write(path, contents);
    git('add', '--', ...Object.keys(files));
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture');
    return git('rev-parse', 'HEAD');
  }
  git('init', '-q');
  git('config', 'core.autocrlf', 'false');
  const manifest = {
    files: [{ path: 'en/index.html', bytes: 5 }],
    audioPacks: [{ items: [{ path: 'quiz/audio.mp3', bytes: 5 }] }],
    thumbnails: { items: [{ path: 'images/a b.webp', bytes: 5 }] }
  };
  const legacy = commit({
    'index.html': 'home', 'en/index.html': 'hello', 'CNAME': 'example.org', 'robots.txt': 'robots',
    'sitemap.xml': 'map', 'v0/index.html': 'legacy', 'v1/index.html': 'legacy', 'app.js': 'app',
    'images/a b.webp': 'thumb', 'quiz/audio.mp3': 'audio', 'quiz/video.mp4': 'movie',
    'scripts/build.mjs': 'dev', 'docs/notes.md': 'dev', 'package.json': '{}',
    '.github/workflows/test.yml': 'dev', '.gitignore': 'ignored', 'content-manifest.json': JSON.stringify(manifest)
  });
  const current = commit({ 'scripts/pages-layout.json': JSON.stringify(layout), 'scripts/pages-package.mjs': 'fixture' });
  return { cwd, git, write, commit, legacy, current, manifest };
}

test('the exact commit supplies the Pages roots, public media, legacy sites and manifest assets', t => {
  const f = fixture(t);
  f.write('index.html', 'uncommitted edit');
  f.write('images/local.webp', 'untracked');
  const inventory = pagesInventory(f.current, f.cwd);
  const rootOutput = execFileSync(process.execPath, [cli, 'roots', f.current], { cwd: f.cwd, encoding: 'utf8' });
  const roots = rootOutput.split('\0').filter(Boolean);
  for (const root of ['en', 'images', 'quiz', 'v0', 'v1', 'CNAME', 'robots.txt', 'sitemap.xml']) assert.ok(roots.includes(root));
  for (const root of ['scripts', 'docs', '.github', '.gitignore', 'package.json']) assert.ok(!roots.includes(root));
  f.git('--literal-pathspecs', 'archive', '--format=tar', '-o', 'candidate.tar', f.current, '--', ...roots);
  const listing = execFileSync('tar', ['-tf', 'candidate.tar'], { cwd: f.cwd, encoding: 'utf8' });
  assert.equal(verifyPagesEntries(inventory, listing), inventory.selected.size);
  assert.ok(inventory.publicBytes < inventory.totalBytes);
  assert.equal(inventory.selected.get('index.html'), 4);
  assert.ok(!inventory.selected.has('images/local.webp'));
  const withoutVideo = listing.split(/\r?\n/).filter(path => path !== 'quiz/video.mp4').join('\n');
  assert.throws(() => verifyPagesEntries(inventory, withoutVideo), /Missing Pages file: quiz\/video/);
  assert.throws(() => verifyPagesEntries(inventory, listing + './docs/notes.md\n'), /Unexpected Pages file/);
  assert.throws(() => verifyPagesEntries(inventory, listing + './index.html\n'), /Duplicate Pages file/);
});

test('deployment of a previous candidate uses its own layout, including legacy full archives', t => {
  const f = fixture(t);
  const old = pagesInventory(f.legacy, f.cwd);
  assert.ok(old.legacy);
  const oldListing = [...old.required].map(path => './' + path).join('\n');
  assert.equal(verifyPagesEntries(old, oldListing + '\n./.gitignore'), old.required.size + 1);
  assert.throws(() => verifyPagesEntries(old, oldListing.replace('./v0/index.html', '')), /Missing Pages file/);
  f.commit({ 'scripts/pages-layout.json': JSON.stringify({ ...layout, publicRootFiles: [...layout.publicRootFiles, 'extra.txt'] }), 'extra.txt': 'new' });
  assert.ok(pagesInventory('HEAD', f.cwd).selected.has('extra.txt'));
  assert.ok(!pagesInventory(f.current, f.cwd).selected.has('extra.txt'));
});

test('unclassified roots, lost required pages and missing manifest assets fail before upload', t => {
  const f = fixture(t);
  f.commit({ 'next/index.html': 'new' });
  assert.throws(() => pagesInventory('HEAD', f.cwd), /Classify next/);
  f.commit({ 'scripts/pages-layout.json': JSON.stringify({ ...layout, publicDirectories: [...layout.publicDirectories, 'next'], requiredFiles: ['en/lost.html'] }) });
  assert.throws(() => pagesInventory('HEAD', f.cwd), /Missing required Pages file: en\/lost/);
  f.commit({ 'scripts/pages-layout.json': JSON.stringify({ ...layout, publicDirectories: [...layout.publicDirectories, 'next'] }), 'images/a b.webp': 'changed' });
  assert.throws(() => pagesInventory('HEAD', f.cwd), /differs from content manifest: images\/a b/);
  f.manifest.thumbnails.items = [{ path: 'images/lost.webp', bytes: 5 }];
  f.commit({ 'content-manifest.json': JSON.stringify(f.manifest) });
  assert.throws(() => pagesInventory('HEAD', f.cwd), /differs from content manifest: images\/lost/);
});
