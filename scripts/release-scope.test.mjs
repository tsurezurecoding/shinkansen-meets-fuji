import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chooseReleaseScope, onlyVersionReferenceChanged, assertReusableVerification } from './release-scope.mjs';

const change = path => ({ path, status: 'M' });
test('727 edits select their generator, output contract, version and manifest checks', () => {
  const plan = chooseReleaseScope(['727-collection.css', '727-collection.html', 'en/727-collection.html', 'scripts/generate-727-page.mjs', 'content-manifest.json'].map(change));
  assert.equal(plan.scope, '727-collection');
  assert(plan.commands.some(c => c.includes('scripts/generate-727-page.mjs')));
  assert(plan.commands.some(c => c.includes('scripts/check-content-manifest.mjs')));
  assert(!plan.commands.some(c => c.includes('verify') || c.includes('build:full')));
});
test('translated CSS reference updates qualify; translated body changes require wider coverage', () => {
  const changes = ['727-collection.css', 'fr/727-collection.html', 'zh-Hans/727-collection.html', 'zh-Hant/727-collection.html'].map(change);
  assert.equal(chooseReleaseScope(changes, { versionOnly: () => true }).scope, '727-collection');
  assert.equal(chooseReleaseScope(changes).scope, 'unmapped');
  assert(onlyVersionReferenceChanged('<link href="../727-collection.css?v=a">', '<link href="../727-collection.css?v=b">'));
  assert(!onlyVersionReferenceChanged('<p>A</p>', '<p>B</p>'));
  assert(!onlyVersionReferenceChanged('<p>A</p>', '<p>A</p>'));
});
for (const file of ['data.js', 'spot-page-shared.js', 'scripts/shared/content-metadata.mjs', 'scripts/generate-utility-locales.mjs']) {
  test(`shared input ${file} cannot be hidden inside a 727 change`, () => {
    assert.equal(chooseReleaseScope(['727-collection.css', file].map(change)).scope, 'unmapped');
  });
}
test('file additions/deletions do not silently qualify as an existing-page change', () => {
  for (const status of ['A', 'D']) assert.equal(chooseReleaseScope([{ status, path: '727-collection.html' }]).scope, 'unmapped');
});
test('dependency changes justify full consumer coverage explicitly', () => {
  assert.equal(chooseReleaseScope([change('package-lock.json')]).scope, 'full');
});
test('release infrastructure changes test release behavior without generating unrelated pages', () => {
  const plan = chooseReleaseScope(['.github/workflows/quality-gate.yml', 'scripts/release-scope.mjs'].map(change));
  assert.equal(plan.scope, 'release-infrastructure');
  assert(plan.commands.some(c => c.includes('scripts/release-artifact.test.mjs')));
  assert(!plan.commands.some(c => c.includes('build:full') || c.includes('verify')));
});
test('documentation and empty changes do not run product tests', () => {
  assert.deepEqual(chooseReleaseScope([change('README.md')]).commands, []);
  assert.deepEqual(chooseReleaseScope([]).commands, []);
});

test('photo alias dedup checks every consuming generator and the affected translated route', () => {
  const plan = chooseReleaseScope([
    ...['scripts/shared/responsive-photos.mjs', 'scripts/generate-gallery-thumbnails.mjs',
      'images/thumbs/display/index.json', 'data/spot-pages/fuji-paper-mills.en.js',
      'fr/spots/fuji-paper-mills.html', 'content-manifest.json', 'scripts/release-scope.mjs'].map(change),
    { status: 'D', path: 'images/thumbs/display/duplicate-640.webp' },
  ]);
  assert.equal(plan.scope, 'responsive-photo-dedup');
  for (const file of ['generate-gallery-thumbnails.mjs', 'generate-spot-page-shared-data.mjs',
    'generate-spot-pages.mjs', 'generate-castle-locales.mjs', 'check-content-manifest.mjs'])
    assert(plan.commands.some(c => c.includes(`scripts/${file}`)));
  assert(plan.commands.some(c => c.includes('--route') && c.includes('spots/fuji-paper-mills.html')));
  assert(!plan.commands.some(c => c.includes('verify') || c.includes('build:full')));
});

test('photo dedup does not cover changed content sources, other routes or original photo deletion', () => {
  for (const extra of [change('data.js'), change('en/spots/tokyo-tower.html'),
    { status: 'D', path: 'images/original.jpg' }, { status: 'A', path: 'images/thumbs/display/new.webp' }])
    assert.equal(chooseReleaseScope([change('scripts/shared/responsive-photos.mjs'), extra]).scope, 'unmapped');
});

const base = 'a'.repeat(40), head = 'b'.repeat(40), tree = 'c'.repeat(40);
const expected = { base, head, tree, repository: 'example/site' };
const receipt = { version: 1, status: 'success', repository: expected.repository, base, inputHead: head, tree, sourceSha: 'd'.repeat(40), sourceParents: [base, head] };
test('verified PR merge content is reusable for the same merged tree and inputs', () => {
  assert(assertReusableVerification(receipt, expected));
});
for (const [field, value] of [['tree', 'e'.repeat(40)], ['base', 'e'.repeat(40)], ['inputHead', 'e'.repeat(40)], ['repository', 'other/site'], ['status', 'failure'], ['version', 2], ['sourceSha', 'main'], ['sourceParents', [head, base]], ['sourceParents', [head]]]) {
  test(`verification reuse rejects changed ${field}`, () => assert.throws(() => assertReusableVerification({ ...receipt, [field]: value }, expected), /does not match/));
}
test('inline Actions scripts compile as async functions before a workflow is pushed', () => {
  const yaml = fs.readFileSync(new URL('../.github/workflows/quality-gate.yml', import.meta.url), 'utf8').replaceAll('\r', '');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const scripts = [...yaml.matchAll(/^          script: \|\n((?:            [^\n]*\n|\n)+)/gm)];
  assert.equal(scripts.length, 2);
  for (const match of scripts) new AsyncFunction('github', 'context', 'core', 'require', match[1].replace(/^            /gm, ''));
});
