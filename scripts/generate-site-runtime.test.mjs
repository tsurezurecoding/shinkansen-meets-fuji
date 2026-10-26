import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { SITE_RUNTIME_ASSETS, serializeSiteRuntime, generateSiteRuntime } from './generate-site-runtime.mjs';

const fixture = () => Object.fromEntries([...SITE_RUNTIME_ASSETS, 'shared-ui/fr.standard.js', 'shared-ui/zh-hant.standard.js'].map(file => [file, `asset:${file}`]));

test('site inventory is deterministic, bounded and hashes actual module bytes', () => {
  const contents = fixture();
  const output = serializeSiteRuntime(contents);
  assert.equal(output, serializeSiteRuntime(Object.fromEntries(Object.entries(contents).reverse())));
  const result = JSON.parse(output);
  assert.equal(result.schema, 'mado-site-runtime');
  assert.equal(result.version, 1);
  for (const [file, bytes] of Object.entries(contents)) assert.equal(result.assets[file], createHash('sha256').update(bytes).digest('hex').slice(0, 8));
  const changed = JSON.parse(serializeSiteRuntime({ ...contents, 'shared-ui/fr.standard.js': 'changed' }));
  assert.deepEqual(Object.keys(result.assets).filter(file => result.assets[file] !== changed.assets[file]), ['shared-ui/fr.standard.js']);
});

test('missing assets, external paths, traversal and oversized inventory fail closed', () => {
  for (const file of SITE_RUNTIME_ASSETS) {
    const contents = fixture();
    delete contents[file];
    assert.throws(() => serializeSiteRuntime(contents), /Missing/);
  }
  for (const file of ['https://example.com/run.js', '../run.js', 'shared-ui/../../run.js', 'shared-ui/fr.js', 'shared-ui/fr.standard.js?x']) {
    assert.throws(() => serializeSiteRuntime({ ...fixture(), [file]: 'x' }), /Invalid/);
  }
  assert.throws(() => serializeSiteRuntime({ ...fixture(), 'style.css': {} }), /Invalid/);
  assert.throws(() => serializeSiteRuntime({ ...fixture(), ...Object.fromEntries(Array.from({ length: 600 }, (_, i) => [`shared-ui/lang-${i}.standard.js`, 'x'])) }), /budget/);
});

test('generation discovers locale bundles and check never repairs missing or stale output', async t => {
  const base = new URL('../.codex-local/runtime-fixtures/', import.meta.url);
  await mkdir(base, { recursive: true });
  const appDir = await mkdtemp(new URL('site-', base));
  t.after(() => rm(appDir, { recursive: true, force: true }));
  await mkdir(`${appDir}/shared-ui`);
  for (const [file, bytes] of Object.entries(fixture())) await writeFile(`${appDir}/${file}`, bytes);
  const missing = await generateSiteRuntime({ appDir, check: true });
  assert.equal(missing.changed, true);
  await assert.rejects(stat(missing.outputPath), { code: 'ENOENT' });
  const generated = await generateSiteRuntime({ appDir });
  assert.equal(generated.assets, 10);
  const output = await readFile(generated.outputPath, 'utf8');
  const timestamp = (await stat(generated.outputPath)).mtimeMs;
  assert.equal((await generateSiteRuntime({ appDir })).changed, false);
  assert.equal((await stat(generated.outputPath)).mtimeMs, timestamp);
  await writeFile(`${appDir}/shared-ui/fr.standard.js`, 'updated');
  assert.equal((await generateSiteRuntime({ appDir, check: true })).changed, true);
  assert.equal(await readFile(generated.outputPath, 'utf8'), output);
});
