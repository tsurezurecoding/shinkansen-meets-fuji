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
    for (const file of [...FAST_GROUPS.flatMap(group => group.assets), 'spot-page-runtime.json', 'en/start.html']) {
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
      await write('en/start.html', await readFile(path.join(root, 'input.txt'), 'utf8').catch(() => 'deleted input'));
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
  return { root, write, execute, run, cache, calls, logs, setFail: value => { fail = value; }, setUnexpected: value => { unexpected = value; }, setOmitOutput: value => { omitOutput = value; } };
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

test('a full build cannot cache output rendered before its source changed', async t => {
  const f = await fixture(t);
  await f.write('input.txt', 'first');
  const rendered = () => readFile(path.join(f.root, 'en/start.html'), 'utf8');
  await assert.rejects(f.run({ execute: async command => {
    await f.execute(command);
    await f.write('input.txt', 'second');
  } }), /Build input changed during full generation: input\.txt/);
  assert.equal(await rendered(), 'first');
  await assert.rejects(f.cache(), { code: 'ENOENT' });
  assert.equal((await f.run()).mode, 'full');
  assert.equal(await rendered(), 'second');
  assert.equal((await f.run()).mode, 'noop');
});

for (const change of ['added', 'removed', 'edited']) {
  test(`a source ${change} during full generation invalidates the run even when the manifest agrees`, async t => {
    const f = await fixture(t);
    if (change !== 'added') await f.write('data.js', 'first');
    await f.run();
    const oldCache = await f.cache();
    await assert.rejects(f.run({ force: true, execute: async command => {
      await f.execute(command);
      if (change === 'removed') {
        await rm(path.join(f.root, 'data.js'));
      } else {
        await f.write('data.js', 'second');
        const manifest = JSON.parse(await readFile(path.join(f.root, 'content-manifest.json'), 'utf8'));
        manifest.files.push({ path: 'data.js', bytes: 6, sha256: createHash('sha256').update('second').digest('hex') });
        await f.write('content-manifest.json', JSON.stringify(manifest));
      }
    } }), /Build input changed during full generation: data\.js/);
    assert.equal(await f.cache(), oldCache);
    assert.equal((await f.run()).mode, 'full');
  });
}

for (const file of ['article.html', 'scripts/templates/site-source/index.html.tpl']) {
  test(`full generation consumes the final contents of the in-place source ${file}`, async t => {
    const f = await fixture(t);
    await f.write(file, 'first');
    const result = await f.run({ execute: async command => {
      await f.execute(command);
      await f.write('data-runtime.js', await readFile(path.join(f.root, file)));
      if (f.calls.length === 1) await f.write(file, 'second');
    } });
    assert.equal(result.commands, 2);
    assert.equal(await readFile(path.join(f.root, 'data-runtime.js'), 'utf8'), 'second');
    assert.equal((await f.run()).mode, 'noop');
  });
}

test('an in-place rewrite that keeps changing fails after one additional pass', async t => {
  const f = await fixture(t);
  await assert.rejects(f.run({ execute: async command => {
    await f.execute(command);
    await f.write('article.html', String(f.calls.length));
  } }), /Build input changed during full generation: article\.html/);
  assert.deepEqual(f.calls, ['full', 'full']);
  await assert.rejects(f.cache(), { code: 'ENOENT' });
});

test('authored HTML skips the second pass only for verified local asset hashes', async t => {
  const digest = createHash('sha256').update('local script').digest('hex').slice(0, 8);
  for (const [base, token, body, commands] of [
    ['../', digest, 'article', 1],
    ['../', 'ffffffff', 'article', 2],
    ['../', digest, 'edited article', 2],
    ['https://example.org/', digest, 'article', 2],
    ['data:text/plain,example', digest, 'article', 2],
  ]) {
    const f = await fixture(t);
    const page = (version, copy) => `<base href="${base}"><script src="locales.js?v=${version}"></script><p>${copy}</p>`;
    await f.write('locales.js', 'local script');
    await f.write('fr/info.html', page('00000000', 'article'));
    const result = await f.run({ execute: async command => {
      await f.execute(command);
      await f.write('fr/info.html', page(token, body));
    } });
    assert.equal(result.commands, commands, `${base} ${token} ${body}`);
  }
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

for (const file of ['en/start.html', 'android-app-invite.js', 'content-manifest.json', 'spot-page-runtime.json']) {
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
    if (change === 'version') cache.version = CACHE_VERSION - 1;
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

test('CI verifies the selected scope once and rejects changed or untracked outputs', async () => {
  const workflow = await readFile(new URL('../.github/workflows/quality-gate.yml', import.meta.url), 'utf8');
  const step = workflow.match(/- name: Verify affected scope once([\s\S]*?)(?=\n\s+- name:|$)/)?.[1];
  assert.ok(step);
  assert.match(step, /steps\.reuse\.outputs\.verified != 'true'/);
  assert.equal((step.match(/node scripts\/release-scope\.mjs verify /g) || []).length, 1);
  assert.doesNotMatch(workflow, /npm run build:full/);
  const scope = await readFile(new URL('./release-scope.mjs', import.meta.url), 'utf8');
  assert.match(scope, /git\('diff', '--exit-code'\)/);
  assert.match(scope, /git\('ls-files', '--others', '--exclude-standard'\)/);
});
