import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

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
const validationFiles = new Set(['scripts/shared/site-runtime-validation.mjs',
  'scripts/shared/site-runtime-validation.test.mjs', 'scripts/validate-site-navigation.mjs', 'scripts/validate-site-navigation.test.mjs']);
const storyRoutes = ['index', 'godzilla', 'shogun', 'yurucamp', 'dragonball'].map(slug => `stories/${slug}.html`);
const storyNavigation = () => node('scripts/validate-site-navigation.mjs', ...storyRoutes.flatMap(route => ['--route', route]));
const languageCommands = ['validate-castle-locales', 'validate-language-pages', 'validate-utility-locales',
  'validate-mieru', 'validate-sparkling-locales'].map(name => `node scripts/${name}.mjs`)
  .concat('node --test scripts/editorial-notes.test.mjs', 'node scripts/validate-live-sitemap.mjs');

export function classifyPackageChange(before, after) {
  if (!before || !after) return 'dependencies';
  const previous = JSON.parse(before), next = JSON.parse(after);
  const { scripts: oldScripts = {}, ...oldRuntime } = previous;
  const { scripts: newScripts = {}, ...newRuntime } = next;
  if (!isDeepStrictEqual(oldRuntime, newRuntime)) return 'dependencies';
  const allowed = new Set(['verify', 'check', 'check:site', 'check:language', 'check:language-navigation',
    'check:navigation', 'check:syntax', 'check:all-syntax']);
  const changed = [...new Set([...Object.keys(oldScripts), ...Object.keys(newScripts)])]
    .filter(key => oldScripts[key] !== newScripts[key]);
  if (changed.some(key => !allowed.has(key) || !(key in newScripts))) return 'unmapped';
  const expand = (command, scripts, seen = []) => command.split('&&').flatMap(part => {
    const value = part.trim(), alias = /^npm run ([\w:-]+)$/.exec(value)?.[1];
    if (alias) {
      if (seen.includes(alias) || typeof scripts[alias] !== 'string') throw new Error('Invalid script alias');
      return expand(scripts[alias], scripts, [...seen, alias]);
    }
    if (value === 'node scripts/validate-site-navigation.mjs --language-only') return languageCommands;
    if (value === 'node scripts/validate-site-navigation.mjs --with-language-checks')
      return [...languageCommands, 'node scripts/validate-site-navigation.mjs'];
    return value;
  });
  const canonical = (command, scripts) => {
    const commands = new Set(expand(command, scripts));
    if (commands.has('node scripts/check-first-party-syntax.mjs'))
      for (const check of expand(oldScripts['check:syntax'] || '', oldScripts)) commands.delete(check);
    return [...commands].sort();
  };
  try {
    const existing = changed.filter(key => key in oldScripts);
    if (existing.some(key => !isDeepStrictEqual(canonical(oldScripts[key], oldScripts), canonical(newScripts[key], newScripts)))) return 'unmapped';
    const covered = new Set(expand(oldScripts.verify || '', oldScripts));
    if (changed.filter(key => !(key in oldScripts)).some(key => expand(newScripts[key], newScripts).some(command => !covered.has(command)))) return 'unmapped';
    return 'validation-commands';
  } catch { return 'unmapped'; }
}

export function chooseReleaseScope(changes, { versionOnly = () => false, marukoLinkOnly = () => false, menuReferenceOnly = () => false, chromeExtractionOnly = () => false, packageBefore, packageAfter } = {}) {
  const files = changes.map(change => change.path);
  const syntax = files.filter(file => /\.(?:mjs|cjs|js)$/.test(file)).map(file => node('--check', file));
  // Content-only edits do not change locale availability, host connections or
  // common chrome. Those inputs deliberately remain in the wider integration plan.
  const storyBody = /^data\/story-window\/(?:ja|en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/(?:godzilla|shogun|yurucamp|dragonball)\.html$/;
  const storyOutput = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?stories\/(?:index|godzilla|shogun|yurucamp|dragonball)\.html$/;
  if (files.some(file => storyBody.test(file)) && changes.every(({ path: file, status }) => status === 'M' &&
    (storyBody.test(file) || storyOutput.test(file) || file === 'content-manifest.json'))) return {
    scope: 'story-content', needsDependencies: true, pagesCandidate: true,
    reason: 'Existing story bodies and generated editions only; all story language/metadata/asset contracts remain checked without unrelated language families',
    commands: [node('scripts/generate-story-window-pages.mjs', '--check'),
      node('scripts/validate-story-window.mjs', '--pages-only'), storyNavigation(),
      node('scripts/check-content-manifest.mjs')],
  };
  const storyTooling = new Set(['scripts/release-scope.mjs', 'scripts/release-scope.test.mjs',
    'scripts/validate-site-navigation.mjs', 'scripts/validate-site-navigation.test.mjs',
    'scripts/generate-story-window-pages.mjs', 'scripts/shared/story-window.mjs', 'scripts/shared/story-routing.test.mjs']);
  if (files.length && files.some(file => storyTooling.has(file) && !infra.has(file)) &&
      changes.every(({ path: file, status }) => status !== 'D' && storyTooling.has(file))) return {
    scope: 'story-validation-tooling', needsDependencies: true, pagesCandidate: false,
    reason: 'Story routing and scoped validation only; generator checks must prove the delivered story and catalogue outputs remain unchanged',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/validate-site-navigation.test.mjs',
      'scripts/shared/story-routing.test.mjs', 'scripts/locales-contract.test.mjs'),
      node('scripts/generate-story-window-pages.mjs', '--check'),
      node('scripts/validate-story-window.mjs'), storyNavigation()],
  };
  const storyIntegrationFiles = new Set([
    'locales.js','language-router.js','package.json','sitemap.xml','content-manifest.json','site-runtime.json','spot-page-runtime.json',
    'scripts/generate-story-window-pages.mjs','scripts/shared/story-window.mjs','scripts/validate-story-window.mjs',
    'scripts/generate-spot-pages.mjs','scripts/generate-language-mirrors.mjs','scripts/generate-castle-locales.mjs','scripts/generate-utility-locales.mjs',
    'scripts/shared/castle-localization.mjs','scripts/shared/utility-localization.mjs','scripts/generate-content-manifest.mjs',
    'scripts/content-metadata.json','scripts/templates/site-source/zukan.html.tpl','scripts/validate-site-navigation.mjs','scripts/validate-language-pages.mjs','scripts/validate-castle-locales.mjs','scripts/validate-utility-locales.mjs','scripts/audit-site.mjs',
    'scripts/release-scope.mjs','scripts/release-scope.test.mjs','scripts/locales-contract.test.mjs','scripts/editorial-notes.test.mjs','scripts/shared/site-chrome.mjs','scripts/generate-site-chrome.test.mjs',
  ]);
  const storyPage = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?(?:stories\/(?:index|godzilla|shogun|yurucamp|dragonball)\.html|zukan\.html|spots\/(?:kiyosu|sekigahara-battlefield|hamanako|maruko-bridge)\.html)$/;
  const storyInput = /^(?:data\/story-window\/|images\/story-window\/|story-window(?:-[a-z]+)?\.(?:js|css)$)/;
  // The new pages reuse ten shell payloads. The four translated spot hosts
  // share one new rail variant whose Maruko destination now has a local edition.
  const storyShells = new Set([...['ja','en','zh-hant','zh-hans','ko','th','fr','de','es','it'].map(lang=>`shared-ui/${lang}.shell.js`), ...['zh-hant','zh-hans','ko','th','fr','de','es','it'].map(lang=>`shared-ui/${lang}.rail-spots-hamanako.js`)]);
  const storyChange = files.some(file => file === 'scripts/generate-story-window-pages.mjs' || file.startsWith('data/story-window/'));
  let storyPackage = !files.includes('package.json');
  if (!storyPackage && packageBefore && packageAfter) {
    const before = typeof packageBefore === 'string' ? JSON.parse(packageBefore) : packageBefore;
    const after = typeof packageAfter === 'string' ? JSON.parse(packageAfter) : packageAfter;
    const {scripts: oldScripts, ...oldRest} = before, {scripts: newScripts, ...newRest} = after;
    const allowed = new Set(['build:pages','check:stories','check:site']);
    storyPackage = isDeepStrictEqual(oldRest,newRest) && [...new Set([...Object.keys(oldScripts),...Object.keys(newScripts)])].every(key=>allowed.has(key)||oldScripts[key]===newScripts[key]);
  }
  if (storyChange && storyPackage && changes.every(({path:file,status}) => status !== 'D' && (storyIntegrationFiles.has(file) || storyPage.test(file) || storyInput.test(file) || storyShells.has(file) || /^(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/utility-data\.js$/.test(file) || /\.(?:html|tpl)$/.test(file) && versionOnly(file) || marukoLinkOnly(file) || menuReferenceOnly(file) || chromeExtractionOnly(file)))) return {
    scope:'story-window', needsDependencies:true, pagesCandidate:true,
    reason:'Localized story pages and four existing spot connections; shared asset-version consumers are checked without rerendering unrelated content',
    commands:[...syntax,node('--test','scripts/release-scope.test.mjs','scripts/locales-contract.test.mjs'),node('--test','--test-name-pattern=native Maruko','scripts/generate-site-chrome.test.mjs'),
      node('scripts/generate-story-window-pages.mjs','--check'),node('scripts/validate-story-window.mjs'),
      ...['kiyosu','sekigahara-battlefield','hamanako','maruko-bridge'].map(id=>node('scripts/generate-castle-locales.mjs','--route',`spots/${id}.html`,'--check')),
      node('scripts/generate-utility-locales.mjs','--route','zukan.html','--check'),
      node('scripts/generate-site-chrome.mjs','--check'),
      node('scripts/validate-site-navigation.mjs','--with-language-checks'),node('scripts/audit-site.mjs'),
      node('scripts/sync-asset-versions.mjs','--check'),node('scripts/check-content-manifest.mjs')],
  };
  const packageKind = files.includes('package.json') ? classifyPackageChange(packageBefore, packageAfter) : null;
  if (packageKind === 'unmapped') return { scope: 'unmapped', needsDependencies: false, pagesCandidate: false,
    reason: 'Define affected checks for the changed npm command behavior; a script edit is not a dependency upgrade', commands: [] };
  const checkFiles = files.filter(file => file !== 'package.json' || packageKind !== 'validation-commands');
  if (!files.length) return { scope: 'none', needsDependencies: false, pagesCandidate: false, reason: 'No changed files', commands: [] };
  if (checkFiles.every(file => infra.has(file))) return {
    scope: 'release-infrastructure', needsDependencies: false, pagesCandidate: false, reason: 'Only release execution and its tests changed; product content is unchanged',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/release-artifact.test.mjs')],
  };
  if (checkFiles.every(file => infra.has(file) || validationFiles.has(file))) return {
    scope: 'validation-infrastructure', needsDependencies: true, pagesCandidate: false,
    reason: 'Validation helper and its consumers only; product generators and assets are unchanged',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/release-artifact.test.mjs',
      'scripts/shared/site-runtime-validation.test.mjs', 'scripts/food-country-locales.test.mjs',
      'scripts/sanyo-castle-pages.test.mjs', 'scripts/starter-locales.test.mjs'),
      ...['validate-content', 'validate-spot-page-shared', 'validate-727-collection', 'validate-sparkling-dreams']
        .map(name => node(`scripts/${name}.mjs`)), node('scripts/validate-site-navigation.mjs', '--with-language-checks')],
  };
  if (files.includes('scripts/shared/android-app-invite-copy.mjs') && changes.every(({ path, status }) =>
    status === 'M' && ['scripts/shared/android-app-invite-copy.mjs', 'android-app-invite.js',
      'site-runtime.json', 'content-manifest.json', 'scripts/release-scope.mjs', '.github/workflows/quality-gate.yml'].includes(path))) return {
    scope: 'android-invite-copy', needsDependencies: true, pagesCandidate: true, reason: 'Existing invitation locale copy, shared bundle and its runtime/distribution hashes only',
    commands: [...syntax, node('--test', 'scripts/android-app-invite.test.mjs', 'scripts/release-scope.test.mjs'),
      node('scripts/generate-android-app-invite-assets.mjs', '--check'),
      node('scripts/generate-site-runtime.mjs', '--check'), node('scripts/check-content-manifest.mjs')],
  };
  if (changes.every(({ path, status }) => status === 'M' && (photoDedup.has(path) || photoPage.test(path))
    || status === 'D' && /^images\/thumbs\/display\/[^/]+\.webp$/.test(path))) return {
    scope: 'responsive-photo-dedup', needsDependencies: true, pagesCandidate: true,
    reason: 'Responsive source alias sharing: thumbnail index, shared page payloads, Fuji paper mills editions and distribution references',
    commands: [...syntax, node('--test', 'scripts/responsive-photos.test.mjs', 'scripts/release-scope.test.mjs'),
      node('scripts/generate-gallery-thumbnails.mjs', '--check'),
      node('scripts/generate-spot-page-shared-data.mjs', '--check'),
      node('scripts/generate-spot-pages.mjs', 'fuji-paper-mills', '--check', '--defer-manifest'),
      node('scripts/generate-castle-locales.mjs', '--route', 'spots/fuji-paper-mills.html', '--check'),
      node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs')],
  };
  const gameFiles = new Set(['scripts/validate-727-game.mjs', 'scripts/generate-content-manifest.mjs',
    'scripts/generate-window-artworks-page.mjs', 'scripts/window-artworks-page.test.mjs',
    'data/window-artworks.json', 'window-artworks.html', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs']);
  if (files.some(file => file.startsWith('artworks/727-hunt/') || file === 'scripts/validate-727-game.mjs')
    && changes.every(({path: file, status}) => status !== 'D' &&
      (/^artworks\/727-hunt\/(?:index\.html|game\.(?:js|css)|targets\.js|media\/(?:journey\.mp4|poster-\d{2}\.jpg))$/.test(file)
      || gameFiles.has(file) || family.has(file) || familyPage.test(file)))
    && files.filter(file => localizedPage.test(file)).every(versionOnly)) return {
    scope: '727-game', needsDependencies: true, pagesCandidate: true,
    reason: '727 game, Japanese collection/artworks entries, shared CSS version references and media distribution',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/window-artworks-page.test.mjs'),
      node('scripts/generate-727-page.mjs', '--check'), node('scripts/generate-window-artworks-page.mjs', '--check'),
      node('scripts/validate-727-game.mjs'), node('scripts/validate-727-collection.mjs'),
      node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs')],
  };
  if (changes.every(change => change.status === 'M' && (family.has(change.path) || familyPage.test(change.path) || change.path === 'scripts/release-scope.mjs')
    || change.status === 'A' && change.path === 'images/affiliate/popondetta-8710.jpg')
    && files.filter(file => localizedPage.test(file)).every(versionOnly)) return {
    scope: '727-collection', needsDependencies: true, pagesCandidate: true, reason: '727 generator, page, local assets and their version references only',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs'), node('scripts/generate-727-page.mjs', '--check'),
      node('scripts/validate-727-collection.mjs'), node('scripts/sync-asset-versions.mjs', '--check'),
      node('scripts/check-content-manifest.mjs')],
  };
  if (files.every(file => /^(?:README|CHANGELOG|AGENTS)\.md$/.test(file))) return {
    scope: 'documentation', needsDependencies: false, pagesCandidate: false, reason: 'Repository instructions only; no product input changed', commands: [],
  };
  // A new registered window spot changes the global catalogue, runtime
  // guidance, counts, stamps and every edition's shared navigation.
  if (files.includes('data.js') && changes.some(({ path, status }) => status === 'A' && /^data\/spot-pages\/[^/]+\.ja\.js$/.test(path))) return {
    scope: 'full', needsDependencies: true, pagesCandidate: true,
    reason: 'A registered SPOTS addition affects all catalogue, runtime guidance, stamp, shared navigation and language consumers',
    commands: [['npm', 'run', 'verify'], node('--test', 'scripts/release-scope.test.mjs')],
  };
  // A dependency/runtime upgrade can affect every validator. Other unknown
  // changes require an impact contract, rather than silently running everything.
  if (files.some(file => ['package.json', 'package-lock.json'].includes(file))) return {
    scope: 'full', needsDependencies: true, pagesCandidate: true, reason: 'The package/runtime dependency contract changed; all consumers require validation',
    commands: [['npm', 'run', 'verify'], node('--test', 'scripts/release-scope.test.mjs')],
  };
  return { scope: 'unmapped', needsDependencies: false, pagesCandidate: false, reason: `Define affected generators, consumers and checks before execution: ${files.join(', ')}`, commands: [] };
}

export function assertReleasePlanContract(plan) {
  if (typeof plan.needsDependencies !== 'boolean') throw new Error('Release plan must explicitly declare needsDependencies');
  if (typeof plan.pagesCandidate !== 'boolean') throw new Error('Release plan must explicitly declare pagesCandidate');
}

export function needsPagesCandidate(plan) {
  assertReleasePlanContract(plan);
  return plan.pagesCandidate;
}

export function onlyVersionReferenceChanged(before, after) {
  const normalize = text => text.replace(/((?:727-collection\.css|locales\.js|language-router\.js|utility-data\.js)\?v=)[^\s"'<>]+/g, '$1VERSION');
  return before !== after && normalize(before) === normalize(after);
}

export function onlyMarukoLocaleLinkChanged(file, before, after) {
  const shared = file.match(/^(?:shared-ui\/|scripts\/templates\/site-chrome\/)(de|es|fr|it|ko|th|zh-hans|zh-hant)\./);
  const page = file.match(/^(?:scripts\/templates\/site-source\/)?(de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/[^?]+\.html(?:\.tpl)?$/);
  const edition = shared?.[1] || page?.[1];
  if (!edition) return false;
  const locale = {'zh-hans':'zh-Hans','zh-hant':'zh-Hant'}[edition] || edition;
  const normalize = text => text.replace(/((?:727-collection\.css|locales\.js|language-router\.js|utility-data\.js)\?v=)[^\s"'<>]+/g, '$1VERSION');
  let expected = normalize(before);
  for(const attribute of ['href','data-site-chrome-item'])for(const prefix of ['__MADO_ROOT__','../','../../','../../../','/',''])for(const quote of ['"','\\"'])expected=expected.replaceAll(`${attribute}=${quote}${prefix}en/spots/maruko-bridge.html${quote}`,`${attribute}=${quote}${prefix}${locale}/spots/maruko-bridge.html${quote}`);
  if(expected===normalize(before))return false;
  for (const prefix of ['__MADO_ROOT__','../','../../','../../../','/','']) for (const quote of ['"', '\\"']) {
    const anchor = `href=${quote}${prefix}${locale}/spots/maruko-bridge.html${quote} hreflang=${quote}en${quote}`;
    expected = expected.replaceAll(anchor, anchor.replace(`hreflang=${quote}en${quote}`, `hreflang=${quote}${locale}${quote}`));
  }
  return before !== after && expected === normalize(after);
}

export function onlyPreservedChromeMenuChanged(file, before, after, beforeShell, afterShell) {
  if (!/^sudoori\/(?:index|stories\/(?:aisho|koura|nishio|sekigahara|shimamoto|tanna))\.html$/.test(file)) return false;
  const config = html => JSON.parse(html.match(/<script id="mado-shared-ui-config" type="application\/json">([^<]+)<\/script>/)?.[1] || '{}');
  const template = (shell, key) => {
    if (!/^[\w-]+$/.test(key || '')) return null;
    const value = shell.match(new RegExp('"' + key + '":("(?:[^"\\\\]|\\\\.)*")'))?.[1];
    return value ? JSON.parse(value) : null;
  };
  try {
    const old = config(before), next = config(after);
    let expected = before, rebound = false;
    for (let i=0;i<(old.mounts||[]).length;i++) {
      const from=old.mounts[i].menu, to=next.mounts?.[i]?.menu;
      if (from === to) continue;
      const oldTemplate=template(beforeShell,from), newTemplate=template(afterShell,to);
      if (!oldTemplate || oldTemplate !== newTemplate) return false;
      expected=expected.replaceAll(`"menu":"${from}"`, `"menu":"${to}"`);rebound=true;
    }
    return rebound && expected === after;
  } catch { return false; }
}

export function onlyPreservedArtworkChromeExtraction(file, before, after, shell) {
  if (!['artworks/727-hunt/index.html','artworks/memory-express/index.html'].includes(file) || before.includes('id="mado-shared-ui-config"')) return false;
  const configMatch=after.match(/<script id="mado-shared-ui-config" type="application\/json">([^<]+)<\/script>\n/);
  const boot=after.match(/<script src="\.\.\/\.\.\/site-runtime-loader\.js\?v=[a-f0-9]{8}" defer><\/script>\n/);
  if (!configMatch || !boot) return false;
  try {
    const expected={assets:['shared-ui/ja.shell.js'],root:'../../',lang:'ja',route:file,mounts:[{host:'chrome-0',component:'header-artworks-727-hunt',kind:'header'},{host:'chrome-1',component:'footer-artworks-727-hunt',kind:'footer'}]};
    if (!isDeepStrictEqual(JSON.parse(configMatch[1]),expected)) return false;
    let restored=after.replace(configMatch[0],'').replace(boot[0],'');
    const normalize=text=>text.replace(/>\s+</g,'><').trim();
    for (const tag of ['header','footer']) {
      const expression=new RegExp('<'+tag+'\\b[^>]*>[\\s\\S]*?</'+tag+'>'),original=before.match(expression)?.[0],replacement=restored.match(expression)?.[0];
      const encoded=shell.match(new RegExp('"'+tag+'-artworks-727-hunt":("(?:[^"\\\\]|\\\\.)*")'))?.[1];
      if (!original || !replacement || !encoded || normalize(JSON.parse(encoded).replaceAll('__MADO_ROOT__','../../'))!==normalize(original)) return false;
      restored=restored.replace(replacement,original);
    }
    return restored===before;
  } catch { return false; }
}

export function createReleasePlan(base) {
  if (!shaPattern.test(base)) throw new Error('Base must be a full lowercase Git SHA');
  git('cat-file', '-e', `${base}^{commit}`);
  const head = git('rev-parse', 'HEAD');
  const fields = execFileSync('git', ['diff', '--name-status', '--no-renames', '-z', base, head], { cwd: root, encoding: 'utf8' }).split('\0');
  const changes = [];
  for (let i = 0; i + 1 < fields.length; i += 2) if (fields[i]) changes.push({ status: fields[i], path: fields[i + 1] });
  const packageChange = changes.find(change => change.path === 'package.json');
  const plan = chooseReleaseScope(changes, {
    versionOnly: file => onlyVersionReferenceChanged(git('show', `${base}:${file}`), git('show', `${head}:${file}`)),
    marukoLinkOnly: file => changes.find(change => change.path === file)?.status === 'M' && onlyMarukoLocaleLinkChanged(file, git('show', `${base}:${file}`), git('show', `${head}:${file}`)),
    menuReferenceOnly: file => /^sudoori\//.test(file) && changes.find(change => change.path === file)?.status === 'M' && onlyPreservedChromeMenuChanged(file, git('show', `${base}:${file}`), git('show', `${head}:${file}`), git('show', `${base}:shared-ui/ja.shell.js`), git('show', `${head}:shared-ui/ja.shell.js`)),
    chromeExtractionOnly: file => ['artworks/727-hunt/index.html','artworks/memory-express/index.html'].includes(file) && changes.find(change => change.path === file)?.status === 'M' && onlyPreservedArtworkChromeExtraction(file, git('show', `${base}:${file}`), git('show', `${head}:${file}`), git('show', `${head}:shared-ui/ja.shell.js`)),
    ...(packageChange ? { packageBefore: packageChange.status === 'A' ? null : git('show', `${base}:package.json`),
      packageAfter: packageChange.status === 'D' ? null : git('show', `${head}:package.json`) } : {}),
  });
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
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `scope=${plan.scope}\nneeds_dependencies=${plan.needsDependencies}\npages_candidate=${needsPagesCandidate(plan)}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## Validation scope: ${plan.scope}\n${plan.reason}\n\n${plan.commands.map(c => '- `' + c.join(' ') + '`').join('\n')}\n`);
  } else if (mode === 'verify') runPlan(JSON.parse(fs.readFileSync(arg, 'utf8')), output);
  else throw new Error('Usage: release-scope.mjs plan <base-sha> <plan.json> | verify <plan.json> <receipt.json>');
}
