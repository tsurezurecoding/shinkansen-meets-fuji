import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

export const articleRegistryPath = 'scripts/editorial-release-articles.json';
export const articleReleaseHelper = 'scripts/shared/editorial-release.mjs';
export const editions = ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko', 'it', 'th'];
const relatedRoutes = ['foods.html', 'drinks.html', 'beer-on-shinkansen.html', 'countryside.html',
  'spots/gamagori-greenhouses.html', 'omamori.html', 'everyday-japan.html'];
const castleRoutes = ['foods.html', 'countryside.html', 'spots/gamagori-greenhouses.html', 'everyday-japan.html'];
const seriesTests = ['food-country-locales', 'omamori-page', 'drinks-locales'];
const commonInputs = ['scripts/generate-everyday-page.mjs', 'scripts/shared/everyday-related.mjs', 'scripts/generate-foods-page.mjs',
  'scripts/generate-castle-locales.mjs', 'scripts/generate-drinks-locales.mjs', 'scripts/generate-omamori-page.mjs',
  'scripts/generate-content-manifest.mjs', 'scripts/validate-language-pages.mjs',
  'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs', 'scripts/locales-contract.test.mjs',
  'site-runtime.json', 'spot-page-runtime.json', 'content-manifest.json', 'sitemap.xml'];
const slug = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const list = values => Array.isArray(values) && new Set(values).size === values.length
  && values.every(v => typeof v === 'string' && slug.test(v));
const ownGenerator = id => 'scripts/generate-' + id + '-page.mjs';
const ownTest = id => 'scripts/' + id + '-page.test.mjs';

export function validateArticleRegistry(registry) {
  const fields = ['sitemapDate', 'previousLocaleRoutes', 'photos', 'companionArticles', 'clientScript', 'sourceReadme'];
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) throw Error('Invalid editorial article registry');
  for (const [id, article] of Object.entries(registry)) {
    if (!slug.test(id) || !article || typeof article !== 'object' || Object.keys(article).some(key => !fields.includes(key))
      || !/^\d{4}-\d{2}-\d{2}$/.test(article.sitemapDate) || !list(article.photos) || !article.photos.length
      || !list(article.previousLocaleRoutes) || article.previousLocaleRoutes[0] !== 'guide'
      || article.previousLocaleRoutes[1] !== 'omamori' || article.previousLocaleRoutes.includes(id)
      || !list(article.companionArticles) || article.companionArticles.some(key => key === id || !Object.hasOwn(registry, key))
      || ['clientScript', 'sourceReadme'].some(key => Object.hasOwn(article, key) && typeof article[key] !== 'boolean'))
      throw Error('Invalid editorial release declaration: ' + id);
  }
  return registry;
}
export const articleRegistry = validateArticleRegistry(JSON.parse(fs.readFileSync(new URL('../editorial-release-articles.json', import.meta.url), 'utf8')));

const guards = new Map([['scripts/generate-spot-pages.mjs', 'SitemapOnly'], ['locales.js', 'LocalesOnly'],
  ['language-router.js', 'RouterOnly'], ['scripts/content-metadata.json', 'MetadataOnly']]);

export function onlyArticleRegistrationChanged(id, file, before, after, article = articleRegistry[id]) {
  if (!article || before === after) return false;
  if (file === 'scripts/content-metadata.json') {
    try {
      const a = JSON.parse(before), b = JSON.parse(after);
      const allowed = new Set(editions.map(lang => (lang === 'ja' ? '' : lang + '/') + id + '.html'));
      const changed = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(key => !isDeepStrictEqual(a[key], b[key]));
      return changed.length > 0 && changed.every(key => allowed.has(key) && !Object.hasOwn(a, key) && b[key]
        && typeof b[key] === 'object' && !Array.isArray(b[key]));
    } catch { return false; }
  }
  if (file === 'locales.js') {
    const literal = routes => '[' + routes.map(route => "'" + route + ".html'").join(', ') + ']';
    const old = literal(article.previousLocaleRoutes);
    return before.split(old).length === 2 && before.replace(old, literal([...article.previousLocaleRoutes, id])) === after;
  }
  let addition;
  if (file === 'language-router.js') addition = '    "/' + id + '.html": "en/' + id + '.html",\n';
  else if (file === 'scripts/generate-spot-pages.mjs') addition = "    ...languages.filter(lang=>lang!=='ja').map(lang=>({loc:`${siteRoot}/${lang}/" + id + ".html`,priority:'0.7',changefreq:'monthly',lastmod:'" + article.sitemapDate + "'})),\n";
  else return false;
  return after.split(addition).length === 2 && after.replace(addition, '') === before;
}

function onlyPackageRegistration(id, beforeValue, afterValue, requireAll) {
  if (!beforeValue || !afterValue) return false;
  const before = typeof beforeValue === 'string' ? JSON.parse(beforeValue) : beforeValue;
  const after = typeof afterValue === 'string' ? JSON.parse(afterValue) : afterValue;
  if (!before.scripts || !after.scripts) return false;
  const expected = structuredClone(before);
  const generate = 'node ' + ownGenerator(id);
  for (const [key, token] of [['build:pages', generate], ['preflight:spots', generate + ' --check'], ['test:generator', ownTest(id)]]) {
    const current = before.scripts[key], next = after.scripts[key], testing = key === 'test:generator';
    if (typeof current !== 'string' || typeof next !== 'string' || testing && (!current.startsWith('node --test ') || !next.startsWith('node --test '))) return false;
    const separator = testing ? ' ' : ' && ', terms = next.split(separator);
    if (requireAll && !terms.includes(token)) return false;
    if (next === current) continue;
    if (current.split(separator).includes(token) || terms.filter(t => t === token).length !== 1 || terms.filter(t => t !== token).join(separator) !== current) return false;
    expected.scripts[key] = next;
  }
  return isDeepStrictEqual(expected, after);
}

function onlyOwnDeclaration(id, registry, statuses, versions, own, declarationOnly) {
  if (!versions) return false;
  const [before, after] = versions;
  if (!isDeepStrictEqual(after, registry) || !isDeepStrictEqual({ ...before, [id]: after[id] }, after)) return false;
  if (declarationOnly && isDeepStrictEqual(before[id], after[id])) return false;
  if (!Object.hasOwn(before, id)) {
    if (declarationOnly) return true; // The full article plan verifies the already-present sources and outputs.
    const newFiles = [ownGenerator(id), ownTest(id), id + '.html', id + '.css'];
    if (after[id].clientScript) newFiles.push(id + '.js');
    return newFiles.every(file => statuses.get(file) === 'A') && statuses.get('package.json') === 'M'
      && [...own].every(file => !statuses.has(file) || statuses.get(file) === 'A');
  }
  const previous = before[id], current = after[id];
  return isDeepStrictEqual({ ...previous, photos: current.photos, companionArticles: current.companionArticles }, current)
    && previous.photos.every(photo => current.photos.includes(photo))
    && previous.companionArticles.every(other => current.companionArticles.includes(other));
}

function articleCommands(id, companions, routes, syntax) {
  const node = (...args) => ['node', ...args];
  const relatedGenerators = ['generate-foods-page', 'generate-everyday-page', 'generate-drinks-page', 'generate-beer-page',
    'generate-countryside-page', 'generate-drinks-locales', 'generate-omamori-page', 'generate-site-chrome', 'generate-site-runtime'];
  const spotAndMap = "import fs from 'node:fs'; import assert from 'node:assert/strict'; import {planSpotPage,finalPageOutput,sitemapXML} from './scripts/generate-spot-pages.mjs'; const page=planSpotPage('gamagori-greenhouses','en',{requireExisting:true,preserveHead:true}); assert.equal(fs.readFileSync(page.outputPath,'utf8'),finalPageOutput(page.outputPath,page.generatedHTML)); assert.equal(fs.readFileSync('sitemap.xml','utf8'),sitemapXML());";
  return [...syntax, node('--test', ...[id, ...companions].map(ownTest), 'scripts/release-scope.test.mjs', 'scripts/locales-contract.test.mjs',
    ...seriesTests.map(name => 'scripts/' + name + '.test.mjs')),
    ...[id, ...companions].map(article => node(ownGenerator(article), '--check')),
    ...relatedGenerators.map(name => node('scripts/' + name + '.mjs', '--check')),
    ...castleRoutes.map(route => node('scripts/generate-castle-locales.mjs', '--route', route, '--check')),
    node('--input-type=module', '-e', spotAndMap), node('scripts/validate-site-navigation.mjs', ...routes.flatMap(route => ['--route', route])),
    node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs')];
}

export function selectEditorialRelease(changes, options, syntax, special) {
  const registry = options.articleRegistry ? validateArticleRegistry(options.articleRegistry) : articleRegistry;
  const statuses = new Map(changes.map(change => [change.path, change.status]));
  const editedDeclaration = statuses.get(articleRegistryPath) === 'M' && options.fileContents?.(articleRegistryPath);
  const versions = editedDeclaration ? editedDeclaration.map(text => JSON.parse(text)) : null;
  const declarationOnly = Boolean(versions) && changes.every(c => [articleRegistryPath, articleReleaseHelper, 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs'].includes(c.path));
  // Reject unrelated inputs before reading hundreds of HTML blob pairs for version-only changes.
  const ordered = [...changes.filter(c => !c.path.endsWith('.html')), ...changes.filter(c => c.path.endsWith('.html'))];
  for (const [id, article] of Object.entries(registry)) {
    const companions = article.companionArticles;
    const own = new Set([ownGenerator(id), ownTest(id), 'scripts/shared/' + id + '-entry.mjs', id + '.css',
      ...editions.map(lang => (lang === 'ja' ? '' : lang + '/') + id + '.html'),
      'data/' + id + '-photo-sources.json', ...editions.map(lang => 'data/' + id + '/' + lang + '.json'),
      ...article.photos.map(photo => 'images/' + id + '/' + photo + '.webp')]);
    if (article.clientScript) own.add(id + '.js');
    if (article.sourceReadme) own.add('data/' + id + '/README.md');
    if (!declarationOnly && !changes.some(c => own.has(c.path))) continue;
    if (statuses.has(articleRegistryPath) && !onlyOwnDeclaration(id, registry, statuses, versions, own, declarationOnly)) continue;
    if (statuses.has('package.json') && (statuses.get('package.json') !== 'M'
      || !onlyPackageRegistration(id, options.packageBefore, options.packageAfter, statuses.get(ownGenerator(id)) === 'A'))) continue;

    const routes = [id + '.html', ...companions.map(article => article + '.html'), ...relatedRoutes];
    const files = new Set([...own, ...commonInputs, ...companions.map(ownTest), articleRegistryPath, 'package.json']);
    if (declarationOnly) files.add(articleReleaseHelper);
    for (const lang of editions) {
      files.add('shared-ui/' + lang.toLowerCase() + '.shell.js');
      for (const route of routes) {
        files.add('shared-ui/' + lang.toLowerCase() + '.rail-' + route.slice(0, -5).replaceAll('/', '-') + '.js');
        if (lang !== 'ja') files.add(lang + '/' + route);
      }
    }
    // Ramen's reciprocal promotion also changed the existing consumer tests; they are always run above.
    if (id === 'ramen') for (const name of seriesTests) files.add('scripts/' + name + '.test.mjs');
    const matches = ordered.every(({ path: file, status }) => {
      if (status !== 'A' && status !== 'M') return false;
      if (guards.has(file)) return status === 'M' && (options[id + guards.get(file)] ??
        (options.fileContents && onlyArticleRegistrationChanged(id, file, ...options.fileContents(file), article)));
      if (files.has(file)) return true;
      if (status !== 'M') return false;
      if (special(id, file)) return true;
      return file.endsWith('.html') && (options[id + 'AssetVersionOnly']?.(file) ??
        (options.fileContents && onlyArticleAssetReferencesChanged(...options.fileContents(file))));
    });
    if (matches) return { scope: id + '-everyday', needsDependencies: true, pagesCandidate: !declarationOnly,
      reason: 'Check the ten editions of ' + id + ', the linked Everyday Japan articles, their photographs and Web distribution.',
      commands: articleCommands(id, companions, routes, syntax) };
  }
  return null;
}

export function onlyArticleAssetReferencesChanged(before, after) {
  const clean = value => value.replace(/(["'(](?:\.\.\/)*(?:locales|language-router)\.js\?v=)[a-f0-9]{8}(?=["'&<\s])/g, '$1VERSION');
  return before !== after && clean(before) === clean(after);
}
