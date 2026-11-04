import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shaPattern = /^[0-9a-f]{40}$/;
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const infra = new Set([
  '.github/workflows/quality-gate.yml', '.github/workflows/deploy-pages.yml',
  'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs',
  'scripts/release-artifact.mjs', 'scripts/release-artifact.test.mjs',
]);
const familyPage = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?727-collection\.html$/;
const localizedPage = /^(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/727-collection\.html$/;
const family = new Set(['scripts/generate-727-page.mjs', '727-collection.css', '727-collection.js', 'content-manifest.json']);
const photoDedup = new Set(['scripts/shared/responsive-photos.mjs', 'scripts/responsive-photos.test.mjs',
  'scripts/generate-gallery-thumbnails.mjs', 'images/thumbs/display/index.json', 'content-manifest.json',
  'data/spot-pages/fuji-paper-mills.ja.js', 'data/spot-pages/fuji-paper-mills.en.js',
  'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs', '.github/workflows/quality-gate.yml']);
const photoPage = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?spots\/fuji-paper-mills\.html$/;
const node = (...args) => ['node', ...args];

export function chooseReleaseScope(changes, { versionOnly = () => false } = {}) {
  const files = changes.map(change => change.path);
  const syntax = files.filter(file => /\.(?:mjs|cjs|js)$/.test(file)).map(file => node('--check', file));
  if (!files.length) return { scope: 'none', needsDependencies: false, reason: 'No changed files', commands: [] };
  if (files.every(file => infra.has(file))) return {
    scope: 'release-infrastructure', needsDependencies: false, reason: 'Only release execution and its tests changed; product content is unchanged',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/release-artifact.test.mjs')],
  };
  if (files.includes('scripts/shared/android-app-invite-copy.mjs') && changes.every(({ path, status }) =>
    status === 'M' && ['scripts/shared/android-app-invite-copy.mjs', 'android-app-invite.js',
      'site-runtime.json', 'content-manifest.json', 'scripts/release-scope.mjs', '.github/workflows/quality-gate.yml'].includes(path))) return {
    scope: 'android-invite-copy', needsDependencies: true, reason: 'Existing invitation locale copy, shared bundle and its runtime/distribution hashes only',
    commands: [...syntax, node('--test', 'scripts/android-app-invite.test.mjs', 'scripts/release-scope.test.mjs'),
      node('scripts/generate-android-app-invite-assets.mjs', '--check'),
      node('scripts/generate-site-runtime.mjs', '--check'), node('scripts/check-content-manifest.mjs')],
  };
  if (changes.every(({ path, status }) => status === 'M' && (photoDedup.has(path) || photoPage.test(path))
    || status === 'D' && /^images\/thumbs\/display\/[^/]+\.webp$/.test(path))) return {
    scope: 'responsive-photo-dedup', needsDependencies: true,
    reason: 'Responsive source alias sharing: thumbnail index, shared page payloads, Fuji paper mills editions and distribution references',
    commands: [...syntax, node('--test', 'scripts/responsive-photos.test.mjs', 'scripts/release-scope.test.mjs'),
      node('scripts/generate-gallery-thumbnails.mjs', '--check'),
      node('scripts/generate-spot-page-shared-data.mjs', '--check'),
      node('scripts/generate-spot-pages.mjs', 'fuji-paper-mills', '--check', '--defer-manifest'),
      node('scripts/generate-castle-locales.mjs', '--route', 'spots/fuji-paper-mills.html', '--check'),
      node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs')],
  };
  if (changes.every(change => change.status === 'M' && (family.has(change.path) || familyPage.test(change.path) || change.path === 'scripts/release-scope.mjs')
    || change.status === 'A' && change.path === 'images/affiliate/popondetta-8710.jpg')
    && files.filter(file => localizedPage.test(file)).every(versionOnly)) return {
    scope: '727-collection', needsDependencies: true, reason: '727 generator, page, local assets and their version references only',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs'), node('scripts/generate-727-page.mjs', '--check'),
      node('scripts/validate-727-collection.mjs'), node('scripts/sync-asset-versions.mjs', '--check'),
      node('scripts/check-content-manifest.mjs')],
  };
  if (files.every(file => /^(?:README|CHANGELOG|AGENTS)\.md$/.test(file))) return {
    scope: 'documentation', needsDependencies: false, reason: 'Repository instructions only; no product input changed', commands: [],
  };
  // A new registered window spot changes the global catalogue, runtime
  // guidance, counts, stamps and every edition's shared navigation.
  if (files.includes('data.js') && changes.some(({ path, status }) => status === 'A' && /^data\/spot-pages\/[^/]+\.ja\.js$/.test(path))) return {
    scope: 'full', needsDependencies: true,
    reason: 'A registered SPOTS addition affects all catalogue, runtime guidance, stamp, shared navigation and language consumers',
    commands: [['npm', 'run', 'verify'], node('--test', 'scripts/release-scope.test.mjs')],
  };
  // A dependency/runtime upgrade can affect every validator. Other unknown
  // changes require an impact contract, rather than silently running everything.
  if (files.some(file => ['package.json', 'package-lock.json'].includes(file))) return {
    scope: 'full', needsDependencies: true, reason: 'The package/runtime dependency contract changed; all consumers require validation',
    commands: [['npm', 'run', 'verify'], node('--test', 'scripts/release-scope.test.mjs')],
  };
  return { scope: 'unmapped', needsDependencies: false, reason: `Define affected generators, consumers and checks before execution: ${files.join(', ')}`, commands: [] };
}

export function assertReleasePlanContract(plan) {
  if (typeof plan.needsDependencies !== 'boolean') throw new Error('Release plan must explicitly declare needsDependencies');
}

export function onlyVersionReferenceChanged(before, after) {
  const normalize = text => text.replace(/(727-collection\.css\?v=)[^\s"'<>]+/g, '$1VERSION');
  return before !== after && normalize(before) === normalize(after);
}

export function createReleasePlan(base) {
  if (!shaPattern.test(base)) throw new Error('Base must be a full lowercase Git SHA');
  git('cat-file', '-e', `${base}^{commit}`);
  const head = git('rev-parse', 'HEAD');
  const fields = execFileSync('git', ['diff', '--name-status', '--no-renames', '-z', base, head], { cwd: root, encoding: 'utf8' }).split('\0');
  const changes = [];
  for (let i = 0; i + 1 < fields.length; i += 2) if (fields[i]) changes.push({ status: fields[i], path: fields[i + 1] });
  const plan = chooseReleaseScope(changes, { versionOnly: file => onlyVersionReferenceChanged(git('show', `${base}:${file}`), git('show', `${head}:${file}`)) });
  return { version: 1, base, head, tree: git('rev-parse', 'HEAD^{tree}'), changes, ...plan };
}

export function assertReusableVerification(receipt, { tree, base, head, repository }) {
  if (receipt?.version !== 1 || receipt.status !== 'success'
    || receipt.repository !== repository || receipt.tree !== tree
    || receipt.base !== base || receipt.inputHead !== head
    || !shaPattern.test(receipt.sourceSha || '')
    || !Array.isArray(receipt.sourceParents) || receipt.sourceParents.length !== 2
    || receipt.sourceParents[0] !== base || receipt.sourceParents[1] !== head) {
    throw new Error('PR verification does not match the merged content and tested parents');
  }
  return true;
}

function runPlan(plan, output) {
  assertReleasePlanContract(plan);
  if (plan.tree !== git('rev-parse', 'HEAD^{tree}') || plan.head !== git('rev-parse', 'HEAD')) throw new Error('Candidate changed after planning');
  console.log(`[release] ${plan.scope}: ${plan.reason}`);
  for (const [command, ...args] of plan.commands) {
    console.log(`[release] ${command} ${args.join(' ')}`);
    const executable = command === 'node' ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFileSync(executable, args, { cwd: root, stdio: 'inherit', shell: command === 'npm' && process.platform === 'win32' });
  }
  git('diff', '--exit-code');
  if (git('ls-files', '--others', '--exclude-standard')) throw new Error('Verification created untracked files');
  const receipt = { version: 1, status: 'success', repository: process.env.GITHUB_REPOSITORY || '',
    base: plan.base, inputHead: process.env.PR_HEAD_SHA || plan.head,
    sourceSha: plan.head, sourceParents: git('show', '-s', '--format=%P', 'HEAD').split(' '),
    tree: plan.tree, scope: plan.scope };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [mode, arg, output] = process.argv.slice(2);
  if (mode === 'plan') {
    const plan = createReleasePlan(arg);
    assertReleasePlanContract(plan);
    if (plan.scope === 'unmapped') throw new Error(plan.reason);
    fs.writeFileSync(output, JSON.stringify(plan, null, 2) + '\n');
    console.log(JSON.stringify(plan, null, 2));
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `scope=${plan.scope}\nneeds_dependencies=${plan.needsDependencies}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## Validation scope: ${plan.scope}\n${plan.reason}\n\n${plan.commands.map(c => '- `' + c.join(' ') + '`').join('\n')}\n`);
  } else if (mode === 'verify') runPlan(JSON.parse(fs.readFileSync(arg, 'utf8')), output);
  else throw new Error('Usage: release-scope.mjs plan <base-sha> <plan.json> | verify <plan.json> <receipt.json>');
}
