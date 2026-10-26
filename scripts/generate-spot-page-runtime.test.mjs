import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, stat, utimes, rm, copyFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  RUNTIME_ASSETS, RUNTIME_BYTE_BUDGET, RUNTIME_SCHEMA, RUNTIME_VERSION,
  createSpotPageRuntime, serializeSpotPageRuntime, generateSpotPageRuntime,
} from './generate-spot-page-runtime.mjs';

const contentsFixture = () => Object.fromEntries(RUNTIME_ASSETS.map((file) => [file, `/* ${file} */\n`]));

async function fixtureDirectory(t) {
  const appDir = await mkdtemp(path.join(os.tmpdir(), 'mado-spot-runtime-'));
  t.after(() => rm(appDir, { recursive: true, force: true }));
  await Promise.all(Object.entries(contentsFixture()).map(([file, contents]) => writeFile(path.join(appDir, file), contents)));
  return appDir;
}

test('projects exactly the six fixed assets with deterministic full SHA-256 hashes', () => {
  const contents = contentsFixture();
  const result = createSpotPageRuntime(contents);
  assert.equal(result.schema, RUNTIME_SCHEMA);
  assert.equal(result.version, RUNTIME_VERSION);
  assert.deepEqual(Object.keys(result.assets), [...RUNTIME_ASSETS]);
  for (const file of RUNTIME_ASSETS) {
    assert.equal(result.assets[file], createHash('sha256').update(contents[file]).digest('hex'));
  }
  const text = serializeSpotPageRuntime(contents);
  assert.ok(Buffer.byteLength(text) <= RUNTIME_BYTE_BUDGET);
  assert.equal(text, serializeSpotPageRuntime({ ...contents }));
  assert.ok(text.endsWith('\n'));
});

test('changes only the modified asset hash and rejects missing or caller-defined paths', () => {
  const contents = contentsFixture();
  const before = createSpotPageRuntime(contents);
  const after = createSpotPageRuntime({ ...contents, 'style.css': Buffer.from('updated') });
  assert.notEqual(before.assets['style.css'], after.assets['style.css']);
  for (const file of RUNTIME_ASSETS.slice(1)) assert.equal(before.assets[file], after.assets[file]);
  assert.throws(() => createSpotPageRuntime(null));
  assert.throws(() => createSpotPageRuntime({ ...contents, 'https://evil.test/a.js': 'x' }));
  delete contents['style.css'];
  assert.throws(() => createSpotPageRuntime(contents));
  assert.throws(() => createSpotPageRuntime({ ...contents, '../style.css': 'x' }));
  assert.throws(() => createSpotPageRuntime({ ...contents, 'style.css': {} }));
});

test('check mode never writes and unchanged generation preserves the file timestamp', async (t) => {
  const appDir = await fixtureDirectory(t);
  const pending = await generateSpotPageRuntime({ appDir, check: true });
  assert.equal(pending.changed, true);
  await assert.rejects(stat(pending.outputPath), { code: 'ENOENT' });
  const generated = await generateSpotPageRuntime({ appDir });
  assert.equal(generated.changed, true);
  const original = await readFile(generated.outputPath, 'utf8');
  await utimes(generated.outputPath, new Date('2020-01-01'), new Date('2020-01-01'));
  const beforeTime = (await stat(generated.outputPath)).mtimeMs;
  assert.equal((await generateSpotPageRuntime({ appDir })).changed, false);
  assert.equal((await stat(generated.outputPath)).mtimeMs, beforeTime);
  await writeFile(path.join(appDir, 'spot-page-shared.js'), 'changed renderer');
  assert.equal((await generateSpotPageRuntime({ appDir, check: true })).changed, true);
  assert.equal(await readFile(generated.outputPath, 'utf8'), original);
  assert.equal((await stat(generated.outputPath)).mtimeMs, beforeTime);
});

test('CLI --check reports stale output and importing the module has no generation side effects', async (t) => {
  const appDir = await fixtureDirectory(t);
  const scriptsDir = path.join(appDir, 'scripts');
  await mkdir(scriptsDir);
  const script = path.join(scriptsDir, 'generate-spot-page-runtime.mjs');
  await copyFile(new URL('./generate-spot-page-runtime.mjs', import.meta.url), script);
  const importOnly = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(script).href)})`, '--', '--check'], { encoding: 'utf8' });
  assert.equal(importOnly.status, 0, importOnly.stderr);
  assert.equal(importOnly.stdout, '');
  const outputPath = path.join(appDir, 'spot-page-runtime.json');
  await assert.rejects(stat(outputPath), { code: 'ENOENT' });
  const stale = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.equal(stale.status, 1, stale.stderr);
  assert.match(stale.stdout, /stale/);
  await assert.rejects(stat(outputPath), { code: 'ENOENT' });
  const generate = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(generate.status, 0, generate.stderr);
  const check = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /unchanged/);
});
