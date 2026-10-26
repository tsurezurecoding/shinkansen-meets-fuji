import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, mkdir, stat, utimes, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { createAndroidAppInviteAsset, generateAndroidAppInviteAssets, ANDROID_INVITE_BYTE_BUDGET } from './generate-android-app-invite-assets.mjs';
import { withSiteRuntimeLoader } from './shared/site-runtime-html.mjs';

const sources = {
  runtime: await readFile(new URL('./shared/android-app-invite-runtime.js', import.meta.url), 'utf8'),
  css: await readFile(new URL('./shared/android-app-invite.css', import.meta.url), 'utf8'),
};
const bundle = createAndroidAppInviteAsset(sources);

test('shared invitation asset is deterministic, newline-independent and within budget', () => {
  assert.equal(bundle, createAndroidAppInviteAsset({ ...sources }));
  const crlf = Object.fromEntries(Object.entries(sources).map(([key, text]) => [key, text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n')]));
  assert.equal(bundle, createAndroidAppInviteAsset(crlf));
  assert.ok(Buffer.byteLength(bundle, 'utf8') <= ANDROID_INVITE_BYTE_BUDGET);
  assert.doesNotThrow(() => new vm.Script(bundle));
  assert.throws(() => createAndroidAppInviteAsset({ runtime: 'missing config', css: 'body{}' }));
  assert.throws(() => createAndroidAppInviteAsset({ runtime: '__INVITE_CONFIG____INVITE_CONFIG__', css: 'body{}' }));
  assert.throws(() => createAndroidAppInviteAsset({ ...sources, css: '' }));
  assert.notEqual(bundle, createAndroidAppInviteAsset({ ...sources, css: sources.css + '\n/* changed */' }));
});

test('missing, malformed or unsafe page config cannot start the shared invitation', () => {
  const valid = { language: 'ja', pageContext: 'spot', assetPrefix: '../', general: false };
  for (const value of [undefined, '{', 'null', '[]', JSON.stringify({ ...valid, language: '__proto__' }),
    JSON.stringify({ ...valid, language: ['ja'] }),
    JSON.stringify({ ...valid, pageContext: 'unbounded' }), JSON.stringify({ ...valid, assetPrefix: 'https://other.test/' }),
    JSON.stringify({ ...valid, general: 'true' }), JSON.stringify({ ...valid, dismissDays: 0 })]) {
    const dom = new JSDOM('<html><body><main>Preserved content</main></body></html>', { runScripts: 'outside-only', url: 'https://example.test/' });
    try {
      if (value !== undefined) {
        const config = dom.window.document.createElement('script'); config.type = 'application/json';
        config.id = 'mado-android-invite-config'; config.textContent = value; dom.window.document.body.append(config);
      }
      assert.doesNotThrow(() => dom.window.eval(bundle));
      assert.equal(dom.window.document.querySelector('#android-app-invite'), null);
      assert.equal(dom.window.document.querySelector('#android-app-invite-style'), null);
      assert.equal(dom.window.document.querySelector('main').textContent, 'Preserved content');
    } finally { dom.window.close(); }
  }
});

test('stable loader HTML updates old tags and keeps one deferred entry at the end', async () => {
  const loader = await readFile(new URL('../site-runtime-loader.js', import.meta.url));
  const hash = createHash('sha256').update(loader).digest('hex').slice(0, 8);
  const source = '<html><head></head><body><script defer src="../site-runtime-loader.js?v=old"></script><main>Keep</main><script src="site-runtime-loader.js?v=older"></script></body></html>';
  const output = withSiteRuntimeLoader(source, '../../');
  assert.equal((output.match(/site-runtime-loader\.js/g) || []).length, 1);
  assert.ok(output.endsWith(`<script src="../../site-runtime-loader.js?v=${hash}" defer></script>\n</body></html>`));
  assert.ok(output.includes('<main>Keep</main>'));
  assert.equal(withSiteRuntimeLoader(output, '../../'), output);
  assert.throws(() => withSiteRuntimeLoader(source, 'https://other.test/'));
  assert.throws(() => withSiteRuntimeLoader('<html></html>'));
});

async function fixture(t) {
  const appDir = await mkdtemp(path.join(os.tmpdir(), 'mado-invite-asset-'));
  t.after(() => rm(appDir, { recursive: true, force: true }));
  const sourceDir = path.join(appDir, 'scripts/shared'); await mkdir(sourceDir, { recursive: true });
  for (const file of ['android-app-invite-runtime.js', 'android-app-invite.css', 'android-app-invite-policy.mjs', 'android-app-invite-copy.mjs']) {
    await copyFile(new URL('./shared/' + file, import.meta.url), path.join(sourceDir, file));
  }
  return appDir;
}

test('check mode never writes and unchanged asset generation preserves mtime', async t => {
  const appDir = await fixture(t);
  const pending = await generateAndroidAppInviteAssets({ appDir, check: true });
  assert.equal(pending.changed, true);
  await assert.rejects(stat(pending.outputPath), { code: 'ENOENT' });
  const result = await generateAndroidAppInviteAssets({ appDir });
  assert.equal(result.changed, true);
  assert.equal(await readFile(result.outputPath, 'utf8'), bundle);
  await utimes(result.outputPath, new Date('2020-01-01'), new Date('2020-01-01'));
  const mtime = (await stat(result.outputPath)).mtimeMs;
  assert.equal((await generateAndroidAppInviteAssets({ appDir })).changed, false);
  assert.equal((await stat(result.outputPath)).mtimeMs, mtime);
  await writeFile(path.join(appDir, 'scripts/shared/android-app-invite.css'), sources.css + '\n/* changed */');
  assert.equal((await generateAndroidAppInviteAssets({ appDir, check: true })).changed, true);
  assert.equal((await stat(result.outputPath)).mtimeMs, mtime);
  assert.equal(await readFile(result.outputPath, 'utf8'), bundle);
});

test('CLI check detects stale assets and module import has no generation side effects', async t => {
  const appDir = await fixture(t);
  const script = path.join(appDir, 'scripts/generate-android-app-invite-assets.mjs');
  await copyFile(new URL('./generate-android-app-invite-assets.mjs', import.meta.url), script);
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(script).href)})`, '--', '--check'], { encoding: 'utf8' });
  assert.equal(imported.status, 0, imported.stderr); assert.equal(imported.stdout, '');
  const outputPath = path.join(appDir, 'android-app-invite.js');
  await assert.rejects(stat(outputPath), { code: 'ENOENT' });
  const stale = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.equal(stale.status, 1, stale.stderr); assert.match(stale.stdout, /stale/);
  await assert.rejects(stat(outputPath), { code: 'ENOENT' });
  const generated = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(generated.status, 0, generated.stderr);
  const checked = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr); assert.match(checked.stdout, /unchanged/);
});
