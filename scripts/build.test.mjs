import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CACHE_PATH, CACHE_VERSION, FAST_GROUPS, runBuild } from './build.mjs';

async function fixture(t, html = '<main>fixture</main>') {
  const fixtures = fileURLToPath(new URL('../.codex-local/build-fixtures/', import.meta.url));
  await mkdir(fixtures, { recursive: true });
  const root = await mkdtemp(path.join(fixtures, 'mado-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const write = async (file, text) => {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), text);
  };
  await write('input.txt', 'page source');
  await write('index.html', html);
  await write('package-lock.json', '{"fixture":1}');
  for (const group of FAST_GROUPS) for (const source of group.sources) await write(source, `source:${source}`);
  const calls = [];
  const logs = [];
  let fail = false;
  let unexpected = false;
  let omitOutput = false;
  const generateAsset = async group => {
    const sources = await Promise.all(group.sources.map(source => readFile(path.join(root, source), 'utf8').catch(() => 'deleted source')));
    for (const asset of group.assets) await write(asset, sources.join('\n'));
  };
  const generateManifest = async () => {
    const files = [];
    for (const file of [...FAST_GROUPS.flatMap(group => group.assets), 'spot-page-runtime.json', 'generated.html']) {
      const bytes = await readFile(path.join(root, file));
      files.push({ path: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    await write('content-manifest.json', JSON.stringify({ schemaVersion: 1, files, audioPacks: [], thumbnails: { items: [] } }));
  };
  const execute = async command => {
    calls.push(command.kind === 'full' ? 'full' : command.script);
    if (fail) {
      await write('android-app-invite.js', 'partial failed output');
      throw new Error('fixture failure');
    }
    if (command.kind === 'full') {
      for (const group of FAST_GROUPS) await generateAsset(group);
      await write('spot-page-runtime.json', '{}');
      await write('generated.html', await readFile(path.join(root, 'input.txt'), 'utf8').catch(() => 'deleted input'));
      await generateManifest();
      if (omitOutput) await rm(path.join(root, 'android-app-invite.js'));
    } else if (command.script === 'scripts/generate-content-manifest.mjs') await generateManifest();
    else {
      const group = FAST_GROUPS.find(item => item.generator === command.script);
      assert.ok(group, `unknown command ${command.script}`);
      await generateAsset(group);
      if (unexpected) { await write('index.html', '<main>unexpected generator write</main>'); unexpected = false; }
    }
  };
  const run = options => runBuild({ root, execute, environment: 'fixture-environment', log: line => logs.push(line), ...options });
  const cache = () => readFile(path.join(root, CACHE_PATH), 'utf8');
  return { root, write, run, cache, calls, logs, setFail: value => { fail = value; }, setUnexpected: value => { unexpected = value; }, setOmitOutput: value => { omitOutput = value; } };
}

test('cold build records successful bytes; a repeated build starts no child process', async t => {
  const f = await fixture(t);
  assert.equal((await f.run()).mode, 'full');
  const cache = await f.cache();
  f.calls.length = 0;
  const result = await f.run();
  assert.equal(result.mode, 'noop');
  assert.equal(result.commands, 0);
  assert.deepEqual(f.calls, []);
  assert.equal(await f.cache(), cache, 'noop does not rewrite the cache');
  assert.ok(result.files > 0 && result.bytes > 0 && result.fingerprintMs >= 0);
  assert.match(f.logs.at(-1), /commands 0, fingerprint \d+ms, total \d+ms/);
});

test('force ignores a matching successful cache', async t => {
  const f = await fixture(t);
  await f.run();
  f.calls.length = 0;
  assert.equal((await f.run({ force: true })).mode, 'full');
  assert.deepEqual(f.calls, ['full']);
});

for (const group of FAST_GROUPS) for (const source of group.sources) {
  test(`only the approved group and manifest run for ${source}`, async t => {
    const f = await fixture(t);
    await f.run();
    f.calls.length = 0;
    await f.write(source, 'changed approved source');
    const result = await f.run();
    assert.equal(result.mode, 'assets');
    assert.deepEqual(f.calls, [group.generator, 'scripts/generate-content-manifest.mjs']);
    assert.equal((await f.run()).mode, 'noop');
  });
}

for (const file of ['input.txt', 'package-lock.json', 'scripts/shared/android-app-invite-reset.js', 'scripts/shared/site-runtime-html.mjs']) {
  test(`unknown/source helper change requires full: ${file}`, async t => {
    const f = await fixture(t);
    await f.write(file, 'original source');
    await f.run();
    f.calls.length = 0;
    await f.write(file, 'changed source');
    assert.equal((await f.run()).mode, 'full');
    assert.deepEqual(f.calls, ['full']);
  });
}

for (const change of ['add', 'remove']) {
  test(`${change} of a source path requires full even with an approved asset change`, async t => {
    const f = await fixture(t);
    await f.write('unknown-source.txt', 'original');
    await f.run();
    f.calls.length = 0;
    await f.write(FAST_GROUPS[0].sources[0], 'changed approved source');
    if (change === 'add') await f.write('new-source.txt', 'new');
    else await rm(path.join(f.root, 'unknown-source.txt'));
    assert.equal((await f.run()).mode, 'full');
    assert.deepEqual(f.calls, ['full']);
  });
}

for (const file of ['generated.html', 'android-app-invite.js', 'content-manifest.json', 'spot-page-runtime.json']) {
  for (const change of ['missing', 'modified']) {
    test(`${change} generated output requires full repair: ${file}`, async t => {
      const f = await fixture(t);
      await f.run();
      f.calls.length = 0;
      if (change === 'missing') await rm(path.join(f.root, file));
      else await f.write(file, 'damaged output');
      assert.equal((await f.run()).mode, 'full');
      assert.deepEqual(f.calls, ['full']);
      assert.equal((await f.run()).mode, 'noop');
    });
  }
}

test('byte changes are detected despite identical size and mtime; timestamp-only changes are noop', async t => {
  const f = await fixture(t);
  await f.write('input.txt', 'first');
  await f.run();
  const target = path.join(f.root, 'input.txt');
  const original = await stat(target);
  await utimes(target, new Date(0), new Date(0));
  assert.equal((await f.run()).mode, 'noop');
  await f.write('input.txt', 'other');
  await utimes(target, original.atime, original.mtime);
  assert.equal((await f.run()).mode, 'full');
});

for (const html of [
  '<script src="android-app-invite.js?v=123"></script>',
  "<script src='android-app-invite.js?mode=demo&amp;v=123'></script>",
  '<base href="/nested/"><script src=../android-app-invite.js?v=123></script>',
  '<script src="https://www.michikusa-travel.com/android-app-invite.js?v=123"></script>',
]) {
  test(`HTML with a direct versioned asset disables fast generation: ${html}`, async t => {
    const f = await fixture(t, html);
    await f.run();
    f.calls.length = 0;
    await f.write(FAST_GROUPS[0].sources[0], 'changed approved source');
    assert.equal((await f.run()).mode, 'full');
    assert.deepEqual(f.calls, ['full']);
  });
}

test('unexpected writes during asset generation fall back to full', async t => {
  const f = await fixture(t);
  await f.run();
  f.calls.length = 0;
  await f.write(FAST_GROUPS[0].sources[0], 'changed approved source');
  f.setUnexpected(true);
  assert.equal((await f.run()).mode, 'full');
  assert.deepEqual(f.calls, [FAST_GROUPS[0].generator, 'scripts/generate-content-manifest.mjs', 'full']);
});

for (const mode of ['full', 'assets']) {
  test(`a failed ${mode} command cannot replace the previous successful cache`, async t => {
    const f = await fixture(t);
    await f.run();
    const cache = await f.cache();
    await f.write(mode === 'full' ? 'input.txt' : FAST_GROUPS[0].sources[0], 'changed source');
    f.setFail(true);
    await assert.rejects(f.run(), /fixture failure/);
    assert.equal(await f.cache(), cache);
    f.setFail(false);
    assert.equal((await f.run()).mode, 'full', 'partial output forces complete repair');
  });
}

test('a successful exit with missing output cannot seed a cache', async t => {
  const f = await fixture(t);
  f.setOmitOutput(true);
  await assert.rejects(f.run(), /Build output missing/);
  await assert.rejects(f.cache(), { code: 'ENOENT' });
});

test('a manifest describing stale output cannot seed a cache', async t => {
  const f = await fixture(t);
  await assert.rejects(f.run({ execute: async () => {
    await f.write('android-app-invite.js', 'present');
    await f.write('spot-page-runtime.json', '{}');
    await f.write('content-manifest.json', JSON.stringify({ files: [{ path: 'android-app-invite.js', bytes: 7, sha256: '0'.repeat(64) }] }));
  } }), /Build output differs from manifest/);
  await assert.rejects(f.cache(), { code: 'ENOENT' });
});

for (const change of ['version', 'environment', 'corrupt']) {
  test(`cache ${change} mismatch requires full`, async t => {
    const f = await fixture(t);
    await f.run();
    const cache = JSON.parse(await f.cache());
    if (change === 'version') cache.version = CACHE_VERSION + 1;
    if (change === 'environment') cache.environment = 'other';
    await f.write(CACHE_PATH, change === 'corrupt' ? '{broken' : JSON.stringify(cache));
    f.calls.length = 0;
    assert.equal((await f.run()).mode, 'full');
    assert.deepEqual(f.calls, ['full']);
  });
}

test('existing ignored operational caches do not become build inputs', async t => {
  const f = await fixture(t);
  await f.run();
  await f.write('.codex-local/progress.txt', 'local report');
  await f.write('node_modules/local-cache.txt', 'dependency cache');
  assert.equal((await f.run()).mode, 'noop');
});

test('CI determinism invokes the complete build twice and rejects untracked outputs', async () => {
  const workflow = await readFile(new URL('../.github/workflows/quality-gate.yml', import.meta.url), 'utf8');
  const step = workflow.match(/- name: Deterministic build([\s\S]*?)(?=\n\s+- name:|$)/)?.[1];
  assert.ok(step);
  assert.equal((step.match(/npm run build:full/g) || []).length, 2);
  assert.doesNotMatch(step, /npm run build\s*(?:\r?\n|$)/);
  assert.equal((step.match(/git ls-files --others --exclude-standard/g) || []).length, 2);
});
