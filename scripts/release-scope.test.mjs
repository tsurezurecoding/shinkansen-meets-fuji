import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { YAKEI_SPOT_COUNT } from './shared/yakei-spots.mjs';
import { articleRegistryPath, articleReleaseHelper, articleRegistry, editions, validateArticleRegistry } from './shared/editorial-release.mjs';
import { onlyFactoryJpegMetadataRemoved } from './release-scope.mjs';
import { onlyMikawaPhotoBatchDataChanged } from './release-scope.mjs';
import { onlyRamenSitemapChanged, onlyRamenLocaleRouteChanged, onlyRamenLanguageRouteChanged, onlyRamenAssetReferencesChanged, onlyRamenMetadataAdded, onlyRamenEnglishCardAddedToJapaneseDonburi } from './release-scope.mjs';
import { onlyDonburiSitemapChanged, onlyDonburiLocaleRouteChanged, onlyDonburiLanguageRouteChanged, onlyDonburiAssetReferencesChanged, onlyDonburiEverydayLayoutChanged } from './release-scope.mjs';
import { chooseReleaseScope, onlyArtworkSitemapChanged, onlyCatalogManifestVersionChanged, onlyAssetVersionReferencesChanged, onlyRideBudgetChanged, onlyRideMediaDataChanged, onlyVersionReferenceChanged, onlyMarukoLocaleLinkChanged, onlyPreservedChromeMenuChanged, onlyPreservedArtworkChromeExtraction, assertReusableVerification, assertReleasePlanContract, classifyPackageChange, needsPagesCandidate } from './release-scope.mjs';

const change = path => ({ path, status: 'M' });

test('news registrations check both client projections and embedded articles add bridge validation', () => {
  const files = ['scripts/content-news.json', 'data/discovery/ja.json', 'index.html', 'en/zukan.html', 'content-manifest.json'].map(change);
  const news = chooseReleaseScope(files);
  assert.equal(news.scope, 'content-news');
  assert.ok(news.commands.some(args => args.includes('scripts/content-news.test.mjs')));
  assert.ok(news.commands.some(args => args.includes('scripts/check-content-manifest.mjs')));
  assert.ok(!news.commands.some(args => args.includes('scripts/generate-rivers-page.mjs')));
  const combined = [...files, ...['app-embedded.js', 'scripts/generate-rivers-page.mjs', 'it/rivers.html', 'spots/fuji.html'].map(change)];
  assert.equal(chooseReleaseScope(combined).scope, 'unmapped');
  const articles = chooseReleaseScope(combined, {assetVersionOnly:file => file === 'spots/fuji.html'});
  assert.equal(articles.scope, 'content-news');
  assert.ok(articles.commands.some(args => args.includes('scripts/app-embedded.test.mjs')));
  assert.equal(chooseReleaseScope([...files, change('app.js')]).scope, 'unmapped');
  const sharedHeader = chooseReleaseScope([...files, change('site-runtime-loader.js'), change('spots/fuji.html')], {
    assetVersionOnly: file => file === 'spots/fuji.html',
  });
  assert.equal(sharedHeader.scope, 'content-news');
  assert.ok(sharedHeader.commands.some(args => args.includes('scripts/site-runtime-loader.test.mjs')));
});

test('feature media releases only the opted-in articles and version-only changes in other routes', () => {
  const files = [{ path: 'feature-media.js', status: 'A' }, change('stories/shogun.html'), change('fr/guide.html')];
  const options = { assetVersionOnly: file => file === 'fr/guide.html' };
  const plan = chooseReleaseScope(files, options);
  assert.equal(plan.scope, 'feature-media');
  assert.ok(needsPagesCandidate(plan));
  assert.ok(plan.commands.some(command => command.includes('scripts/feature-media.test.mjs')));
  assert.notEqual(chooseReleaseScope(files, { assetVersionOnly: () => false }).scope, plan.scope);
  assert.notEqual(chooseReleaseScope([...files, change('data.js')], options).scope, plan.scope);
});

test('river and factory photo updates check both guides and keep unrelated assets and metadata out of scope', () => {
  const files = ['data/rivers/route.json', 'scripts/factory-windows.json', 'scripts/content-metadata.json',
    'en/rivers.html', 'de/factories.html', 'content-manifest.json'].map(change);
  files.push({ path: 'images/rivers/sakawa.jpg', status: 'A' }, { path: 'images/factories/meiji-pharmatech.webp', status: 'A' });
  const before = Object.fromEntries(editions.flatMap(lang => ['rivers.html', 'factories.html'].map(route =>
    [lang === 'ja' ? route : lang + '/' + route, { modified: '2026-11-18', modifiedEvidence: 'first edition' }])));
  const after = structuredClone(before);
  after['en/factories.html'].modified = '2026-11-19';
  const select = (entries, metadata = after) => chooseReleaseScope(entries, { fileContents: () => [JSON.stringify(before), JSON.stringify(metadata)] });
  const plan = select(files);
  assert.equal(plan.scope, 'river-factory-photos');
  for (const generator of ['scripts/generate-rivers-page.mjs', 'scripts/generate-factories-page.mjs']) {
    assert.ok(plan.commands.some(command => command.includes(generator) && command.includes('--check')));
  }
  assert.notEqual(select([...files, change('app.js')]).scope, plan.scope);
  assert.notEqual(select(files, { ...after, 'start.html': { modified: '2026-11-19' } }).scope, plan.scope);
  assert.notEqual(select([...files, {path: 'images/rivers/tama.jpg', status: 'D'}]).scope, plan.scope);
});

test('spot video loading checks both runtime manifests and accepts only version changes on other pages', () => {
  const files = ['spots/solar-ark.html', 'spot-page-shared.js', 'spot-media-gallery.css', 'scripts/generate-spot-pages.mjs',
    'site-runtime.json', 'spot-page-runtime.json', 'en/spots/solar-ark.html', 'de/727-collection.html'].map(change);
  const references = new Set(['en/spots/solar-ark.html', 'de/727-collection.html']);
  const options = {assetVersionOnly: file => references.has(file)};
  const plan = chooseReleaseScope(files, options);
  assert.equal(plan.scope, 'spot-video-loading');
  assert.ok(needsPagesCandidate(plan));
  for (const generator of ['generate-site-runtime', 'generate-spot-page-runtime']) {
    assert.ok(plan.commands.some(command => command.includes('scripts/' + generator + '.mjs') && command.includes('--check')));
  }
  assert.notEqual(chooseReleaseScope(files, {assetVersionOnly: () => false}).scope, plan.scope);
  assert.notEqual(chooseReleaseScope([...files, change('data.js')], options).scope, plan.scope);
  const expansion = ['spot-page-shared.js', 'spot-media-gallery.css', 'scripts/validate-spot-page-shared.mjs',
    'scripts/generate-spot-pages.test.mjs', 'en/spots/solar-ark.html'].map(change);
  assert.equal(chooseReleaseScope(expansion, options).scope, plan.scope);
  assert.notEqual(chooseReleaseScope([...expansion, change('spots/solar-ark.html')], options).scope, plan.scope);
});

test('Solar Ark section selects its projections and excludes timing, other spots and page edits', () => {
  const files = ['data.js', 'data-runtime.js', 'spots/solar-ark.html', 'de/spots/solar-ark.html',
    'data/spot-pages/solar-ark.en.js', 'scripts/locales/castle-de.json', 'de/utility-data.js',
    'artworks/window-trip/window-trip-data.js', 'content-manifest.json', 'start.html'].map(change);
  const data = (ja, en, minutesFromTokyo) => 'const ROUTE = {}, BOARD_COLLECTION = [], WHEEL_COLLECTION = [], SPOTS = ' + JSON.stringify([
    { id: 'solar-ark', ja: { area: ja }, en: { area: en }, side: 'E', minutesFromTokyo },
  ]) + ';';
  const before = data('名古屋 → 岐阜羽島', 'Nagoya → Gifu-Hashima', 103);
  const after = data('岐阜羽島 → 米原', 'Gifu-Hashima → Maibara', 103);
  const plan = (input, code = after) => chooseReleaseScope(input, {
    fileContents: () => [before, code], assetVersionOnly: file => file === 'start.html',
  });
  const selected = plan(files);
  assert.equal(selected.scope, 'solar-ark-section');
  assert(selected.pagesCandidate && selected.needsDependencies);
  assert(selected.commands.some(command => command.includes('scripts/generate-window-trip-data.mjs')));
  assert.notEqual(plan(files, after.replace('103', '104')).scope, selected.scope);
  assert.notEqual(plan([...files, change('data/spot-pages/kiyosu.ja.js')]).scope, selected.scope);
  assert.notEqual(plan([...files, change('guide.html')]).scope, selected.scope);
});

test('guide and journal checks accept body copy and timetable removal while rejecting dependency and route changes', () => {
  const files = ['scripts/templates/site-source/zukan.html.tpl', 'scripts/templates/site-source/en/journal.html.tpl',
    'zukan.html', 'fr/journal.html', 'content-manifest.json', 'scripts/release-scope.mjs', 'scripts/stamp-store.test.mjs'];
  const tag = '  <script src="data/timetable.js?v=89e78630"></script>\n';
  const body = '<html><head><link rel="stylesheet" href="guide.css"></head><body><p>View</p>\n';
  const end = '<script>init()</script></body></html>';
  const changes = files.map(change);
  const plan = (input, before, after) => chooseReleaseScope(input, {fileContents: () => [before + end, after + end]});
  const selected = plan(changes, body + tag, body);
  assert.equal(selected.scope, 'guide-and-journal');
  assert(selected.pagesCandidate && selected.needsDependencies);
  for (const name of ['zukan.html', 'journal.html']) assert(selected.commands.some(c => c.includes('--check') && c.includes(name)));
  assert(selected.commands.some(c => c.includes('scripts/stamp-store.test.mjs') && c.includes('scripts/train-result.test.mjs')));
  assert.equal(plan(changes, body, body.replace('View', 'Views from the train')).scope, selected.scope);
  for (const rejected of [plan(changes, body, body + '<script src="https://cdn.example/guide.js"></script>'),
    plan(changes, body, body.replace('guide.css', 'other.css')), plan(changes, body + '<script>a()</script>', body + '<script>b()</script>'),
    plan(changes, body + '<style>.a{color:red}</style>', body + '<style>.a{color:blue}</style>'), plan(changes, body + tag + tag, body),
    plan([...changes, change('en/start.html')], body + tag, body), plan([...changes, {path: 'it/zukan.html', status: 'D'}], body + tag, body),
    plan([...changes, {path: 'de/journal.html', status: 'A'}], body, body.replace('View', 'Train')),
    plan(changes, body + tag.replace('data/timetable.js', 'data-runtime.js'), body)]) {
    assert.notEqual(rejected.scope, selected.scope);
  }
});

test('metadata and spot rendering checks follow their inputs across release scopes', () => {
  const metadata = 'scripts/generate-spot-pages.test.mjs', validator = 'scripts/validate-spot-page-shared.mjs';
  const generator = 'scripts/generate-spot-pages.mjs', registry = 'scripts/content-metadata.json';
  const commandsFor = (files, options) => chooseReleaseScope(files.map(change), options).commands;
  const metadataChecks = commands => commands.filter(c => c.includes('--test') && c.includes(metadata));
  const spotChecks = commands => commands.filter(c => c[1] === validator);
  const ramen = commandsFor(['scripts/generate-ramen-page.mjs', generator, registry],
    { ramenMetadataOnly: true, ramenSitemapOnly: true });
  assert.equal(metadataChecks(ramen).length, 1);
  assert(metadataChecks(ramen)[0].includes('editorial metadata'));
  assert.equal(spotChecks(ramen).length, 0);
  const scopeFiles = ['scripts/generate-omamori-page.mjs', generator, registry];
  const original = 'function sitemapXML() {\n  return [];\n}\nfunction planSpotPage() { return 1; }';
  const sitemapEdit = original.replace('return [];', 'return routes;');
  assert.equal(spotChecks(commandsFor(scopeFiles, { fileContents: () => [original, sitemapEdit] })).length, 0);
  const sharedRender = sitemapEdit.replace('return 1;', 'return 2;');
  assert.equal(spotChecks(commandsFor(scopeFiles, { fileContents: () => [original, sharedRender] })).length, 1);
  const pilot = commandsFor(['spot-adsense.js', 'spots/kakegawa.html', 'scripts/spot-adsense.test.mjs', 'scripts/shared/spot-ad-placements.mjs']);
  assert.equal(spotChecks(pilot).length, 1);
  assert.equal(pilot.filter(c => c.includes('--test') && c.includes('scripts/spot-adsense.test.mjs')).length, 1);
  const full = commandsFor([registry, 'package-lock.json', 'scripts/shared/spot-ad-placements.mjs']);
  assert(full.some(c => c.includes('verify')));
  assert.equal(metadataChecks(full).length + spotChecks(full).length, 0);
});

test('timetable changes check schedule consumers and reject unrelated edits', () => {
  const files = ['data/timetable.js', 'sparkling-dreams.js', 'fr/sparkling-dreams.html', 'en/start.html'].map(change);
  const options = { assetVersionOnly: file => file === 'en/start.html' };
  const plan = chooseReleaseScope(files, options);
  assert.equal(plan.scope, 'train-timetable');
  assert(plan.pagesCandidate && plan.needsDependencies);
  for (const file of ['validate-timetable', 'validate-train-select', 'validate-sparkling-dreams', 'validate-sparkling-locales',
    'generate-inbound-tables', 'sync-asset-versions', 'check-content-manifest']) {
    assert(plan.commands.some(args => args.includes('scripts/' + file + '.mjs')), file);
  }
  assert.equal(chooseReleaseScope(files).scope, 'unmapped');
  assert.equal(chooseReleaseScope([...files, change('style.css')], options).scope, 'unmapped');
});

test('ride runtime plans verify only their consumers and reject unrelated app, page and package edits', () => {
  const app = 'function nowMin() { return 10; }\nfunction otherFeature() { return 7; }\n';
  const page = '<p>A</p>\n  <script src="app.js?v=abcdef01"></script>\n';
  const wired = page.replace('  <script', '  <script src="data/stamp-store.js?v=abcdef02"></script>\n  <script')
    .replace('app.js?v=abcdef01', 'app.js?v=abcdef02');
  const packageBefore = { scripts: { 'test:generator': 'node --test scripts/existing.test.mjs' }, devDependencies: { jsdom: '1' } };
  const packageAfter = structuredClone(packageBefore);
  packageAfter.scripts['test:generator'] += ' scripts/stamp-store.test.mjs';
  const files = ['app.js', 'train-picker.js', '727-collection.js', 'scripts/validate-spot-page-shared.mjs',
    'scripts/generate-spot-pages.test.mjs', 'scripts/release-scope.test.mjs', 'package.json', 'en/start.html'].map(change);
  files.push({ path: 'data/stamp-store.js', status: 'A' }, { path: 'scripts/stamp-store.test.mjs', status: 'A' });
  const appEdit = app.replace('return 10;', 'return 11;');
  const plan = (currentApp = appEdit, currentPage = wired, extra = [], pkg = packageAfter) =>
    chooseReleaseScope([...files, ...extra], { packageBefore: JSON.stringify(packageBefore), packageAfter: JSON.stringify(pkg),
      fileContents: file => file === 'app.js' ? [app, currentApp] : [page, currentPage] });
  const combined = plan();
  assert.equal(combined.scope, 'ride-runtime');
  assert(combined.pagesCandidate && combined.needsDependencies);
  for (const file of ['scripts/train-result.test.mjs', 'scripts/stamp-store.test.mjs', 'scripts/validate-spot-page-shared.mjs',
    'scripts/release-scope.test.mjs', 'scripts/generate-spot-pages.test.mjs', 'scripts/check-content-manifest.mjs']) {
    assert.equal(combined.commands.filter(c => c.includes(file) && !c.includes('--check')).length, 1, file);
  }
  const trainOnly = chooseReleaseScope([change('train-select.js')]);
  assert.equal(trainOnly.scope, 'ride-runtime');
  assert(!trainOnly.commands.some(c => c.includes('scripts/stamp-store.test.mjs')));
  for (const edits of [[appEdit.replace('return 7;', 'return 8;')], [appEdit, wired.replace('>A<', '>B<')],
    [appEdit, wired.replace('src="app.js', 'src="other.js')], [appEdit, wired, [change('style.css')]],
    [appEdit, wired, [{ path: 'sparkling-dreams.js', status: 'D' }]]]) {
    assert.equal(plan(...edits).scope, 'unmapped');
  }
  const removedTest = structuredClone(packageAfter);
  removedTest.scripts['test:generator'] = 'node --test scripts/stamp-store.test.mjs';
  assert.equal(plan(appEdit, wired, [], removedTest).scope, 'unmapped');
});

const factoryPhoto = 'images/20260919_lotte-shiga_4190_michikusa.jpg';
function jpegSegment(marker, data) {
  const length = data.length + 2;
  return Buffer.concat([Buffer.from([0xff, marker, length >> 8, length & 0xff]), data]);
}
const factoryExif = jpegSegment(0xe1, Buffer.from('Exif\0\0private camera data'));
const factoryProfile = jpegSegment(0xe2, Buffer.from('ICC_PROFILE\0rgb'));
const factoryTables = jpegSegment(0xdb, Buffer.from([0, 3, 6, 9]));
const factoryScan = Buffer.from([0xff, 0xda, 0, 2, 8, 9, 0xff, 0xd9]);
const factoryJpeg = (...metadata) => Buffer.concat([Buffer.from([0xff, 0xd8]), ...metadata, factoryProfile, factoryTables, factoryScan]);

test('factory JPEG privacy cleanup removes only EXIF from the ten approved photographs', () => {
  const before = factoryJpeg(factoryExif), after = factoryJpeg();
  assert(onlyFactoryJpegMetadataRemoved(factoryPhoto, before, after));
  assert(!onlyFactoryJpegMetadataRemoved('images/unrelated.jpg', before, after));
  assert(!onlyFactoryJpegMetadataRemoved(factoryPhoto, after, after));
  assert(!onlyFactoryJpegMetadataRemoved(factoryPhoto, after, before));
  const changedPixels = Buffer.from(after);
  changedPixels[changedPixels.length - 3] ^= 1;
  assert(!onlyFactoryJpegMetadataRemoved(factoryPhoto, before, changedPixels));
  const changedProfile = Buffer.from(after);
  changedProfile[changedProfile.indexOf('rgb')] ^= 1;
  assert(!onlyFactoryJpegMetadataRemoved(factoryPhoto, before, changedProfile));
  const changedTables = Buffer.from(after);
  changedTables[changedTables.indexOf(factoryTables) + factoryTables.length - 1] ^= 1;
  assert(!onlyFactoryJpegMetadataRemoved(factoryPhoto, before, changedTables));
  const xmp = jpegSegment(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/\0xmp'));
  assert(!onlyFactoryJpegMetadataRemoved(factoryPhoto, factoryJpeg(xmp), after));
  assert(!onlyFactoryJpegMetadataRemoved(factoryPhoto, Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff]), after));
});

test('factory scope includes its photo tests and permits only their single package token', () => {
  const before = {scripts: {
    'build:pages': 'node scripts/generate-ramen-page.mjs && node scripts/generate-omamori-page.mjs',
    'preflight:spots': 'node scripts/generate-ramen-page.mjs --check && node scripts/generate-omamori-page.mjs --check',
    'test:generator': 'node --test scripts/ramen-page.test.mjs',
  }};
  const after = structuredClone(before);
  after.scripts['build:pages'] = after.scripts['build:pages'].replace(' && ', ' && node scripts/generate-factories-page.mjs && ');
  after.scripts['preflight:spots'] = after.scripts['preflight:spots'].replace(' && ', ' && node scripts/generate-factories-page.mjs --check && ');
  after.scripts['test:generator'] = 'node --test scripts/factories-page.test.mjs scripts/ramen-page.test.mjs';
  const files = ['scripts/generate-factories-page.mjs', 'scripts/factories-page.test.mjs', 'package.json', factoryPhoto].map(change);
  const options = {packageBefore: JSON.stringify(before), packageAfter: JSON.stringify(after),
    factoryPhotoMetadataOnly: file => onlyFactoryJpegMetadataRemoved(file, factoryJpeg(factoryExif), factoryJpeg())};
  const plan = chooseReleaseScope(files, options);
  assert.equal(plan.scope, 'factory-windows');
  assert(plan.commands.some(c => c.includes('scripts/generate-gallery-thumbnails.mjs') && c.includes('--check')));
  const textOnly = chooseReleaseScope(files.filter(c => c.path !== factoryPhoto), options);
  assert.equal(textOnly.scope, 'factory-windows');
  assert(!textOnly.commands.some(c => c.includes('scripts/generate-gallery-thumbnails.mjs')));
  assert(plan.commands.some(command => command.includes('--test') && command.includes('scripts/factories-page.test.mjs')));
  assert.notEqual(chooseReleaseScope(files, {...options, factoryPhotoMetadataOnly: () => false}).scope, 'factory-windows');
  assert.notEqual(chooseReleaseScope([...files, change('images/unrelated.jpg')], {...options, factoryPhotoMetadataOnly: () => true}).scope, 'factory-windows');
  assert.notEqual(chooseReleaseScope([...files.filter(c => c.path !== factoryPhoto), {path: factoryPhoto, status: 'A'}], options).scope, 'factory-windows');
  for (const suffix of [' scripts/unrelated.test.mjs', ' scripts/factories-page.test.mjs']) {
    const invalid = structuredClone(after);
    invalid.scripts['test:generator'] += suffix;
    assert.notEqual(chooseReleaseScope(files, {...options, packageAfter: JSON.stringify(invalid)}).scope, 'factory-windows');
  }
});

test('each declared article has a generator, tests, source copy, ten editions and every registered photograph', () => {
  const exists = file => fs.existsSync(new URL('../' + file, import.meta.url));
  for (const [id, article] of Object.entries(articleRegistry)) {
    const inputs = ['scripts/generate-' + id + '-page.mjs', 'scripts/' + id + '-page.test.mjs', id + '.css',
      ...editions.flatMap(lang => ['data/' + id + '/' + lang + '.json', (lang === 'ja' ? '' : lang + '/') + id + '.html']),
      ...article.photos.map(stem => 'images/' + id + '/' + stem + '.webp')];
    if (article.clientScript) inputs.push(id + '.js');
    for (const file of inputs) assert(exists(file), file);
    for (const own of ['data/' + id + '/fr.json', 'fr/' + id + '.html', 'images/' + id + '/' + article.photos[0] + '.webp']) {
      const plan = chooseReleaseScope([change(own)]);
      assert.equal(plan.scope, id + '-everyday');
      assert(plan.commands.some(c => c.includes('--test') && c.includes('scripts/' + id + '-page.test.mjs')));
      assert(plan.commands.some(c => c.includes('--check') && c.includes('scripts/generate-' + id + '-page.mjs')));
    }
  }
  const read = [];
  const mixed = ['ramen.html', ...Array.from({length: 40}, (_, index) => 'spots/unrelated-' + index + '.html'), 'app.js'];
  assert.equal(chooseReleaseScope(mixed.map(change), {fileContents: file => { read.push(file); return ['', '']; }}).scope, 'unmapped');
  assert.deepEqual(read.filter(file => file.startsWith('spots/unrelated-')), []);
});

test('a third Everyday Japan article registers its roles without adding a planner branch', () => {
  const udon = {sitemapDate: '2026-11-19', previousLocaleRoutes: ['guide', 'omamori', 'donburi', 'ramen', 'factories'],
    companionArticles: ['ramen'], photos: ['kitsune', 'kake']};
  const registry = {...articleRegistry, udon}, generator = 'scripts/generate-udon-page.mjs', articleTest = 'scripts/udon-page.test.mjs';
  const before = {scripts: {'build:pages': 'node existing.mjs', 'preflight:spots': 'node existing.mjs --check', 'test:generator': 'node --test scripts/existing.test.mjs'}};
  const after = {scripts: {'build:pages': 'node ' + generator + ' && node existing.mjs',
    'preflight:spots': 'node ' + generator + ' --check && node existing.mjs --check', 'test:generator': 'node --test ' + articleTest + ' scripts/existing.test.mjs'}};
  const registered = "['guide.html', 'omamori.html', 'donburi.html', 'ramen.html', 'factories.html']";
  const sitemap = 'function sitemapXML() {\n  return [\n  ];\n}';
  const line = "    ...languages.filter(lang=>lang!=='ja').map(lang=>({loc:`${siteRoot}/${lang}/udon.html`,priority:'0.7',changefreq:'monthly',lastmod:'2026-11-19'})),\n";
  const data = {
    [articleRegistryPath]: [JSON.stringify(articleRegistry), JSON.stringify(registry)],
    'scripts/generate-spot-pages.mjs': [sitemap, sitemap.replace('  ];', line + '  ];')],
    'locales.js': [registered, registered.replace(']', ", 'udon.html']")],
    'language-router.js': ['const routes = {\n};', 'const routes = {\n    "/udon.html": "en/udon.html",\n};'],
    'scripts/content-metadata.json': ['{}', '{"en/udon.html":{"title":"Udon"}}'],
  };
  const product = ['package.json', 'scripts/generate-spot-pages.mjs', 'locales.js', 'language-router.js', 'scripts/content-metadata.json',
    'en/ramen.html', 'de/everyday-japan.html', 'scripts/food-country-locales.test.mjs', 'content-manifest.json', articleRegistryPath].map(change);
  for (const path of [generator, articleTest, 'udon.html', 'udon.css', 'fr/udon.html', 'data/udon/ja.json', 'images/udon/kitsune.webp'])
    product.push({status: 'A', path});
  const run = (files = product, pkg = after, overrides = {}, spec = registry) => chooseReleaseScope(files, {articleRegistry: spec,
    packageBefore: JSON.stringify(before), packageAfter: JSON.stringify(pkg), fileContents: file => overrides[file] || data[file] || ['old\n', 'other\n']});
  const plan = run();
  assert.equal(plan.scope, 'udon-everyday');
  assert(plan.pagesCandidate && plan.needsDependencies);
  const tests = plan.commands.find(c => c.includes('--test') && c.includes(articleTest));
  for (const file of ['scripts/ramen-page.test.mjs', 'scripts/release-scope.test.mjs', 'scripts/locales-contract.test.mjs',
    'scripts/food-country-locales.test.mjs']) assert(tests.includes(file));
  for (const tool of [generator, 'scripts/generate-ramen-page.mjs', 'scripts/generate-site-runtime.mjs', 'scripts/sync-asset-versions.mjs'])
    assert(plan.commands.some(c => c.includes(tool) && c.includes('--check')), tool);
  assert(plan.commands.some(c => c.includes('scripts/validate-site-navigation.mjs') && c.includes('udon.html') && c.includes('ramen.html')));
  const declarationOnly = run([change(articleRegistryPath)]);
  assert.equal(declarationOnly.scope, 'udon-everyday');
  assert.equal(declarationOnly.pagesCandidate, false);
  assert(declarationOnly.commands.some(c => c.includes('--test') && c.includes(articleTest)));
  for (const file of ['app.js', 'ar/udon.html', 'fr/guide.html', 'images/udon/unregistered.webp'])
    assert.notEqual(run([...product, change(file)]).scope, 'udon-everyday', file);
  const hijack = {...registry, ramen: {...articleRegistry.ramen, companionArticles: []}};
  assert.notEqual(run(product, after, {[articleRegistryPath]: [JSON.stringify(articleRegistry), JSON.stringify(hijack)]}, hijack).scope, 'udon-everyday');
  for (const [file, edit] of [['scripts/content-metadata.json', '{"en/guide.html":{}}'], ['locales.js', registered + '; other()']])
    assert.notEqual(run(product, after, {[file]: [data[file][0], edit]}).scope, 'udon-everyday');
  assert.notEqual(run(product.filter(c => c.path !== articleTest)).scope, 'udon-everyday');
  for (const [key, replacement] of [['preflight:spots', after.scripts['preflight:spots'].replace(generator + ' --check', generator)],
    ['test:generator', 'node --test ' + articleTest], ['test:generator', 'node --test ' + articleTest + ' ' + articleTest + ' scripts/existing.test.mjs']]) {
    const damaged = structuredClone(after); damaged.scripts[key] = replacement;
    assert.notEqual(run(product, damaged).scope, 'udon-everyday');
  }
  for (const invalid of [{...udon, commands: []}, {...udon, photos: ['../app']}, {...udon, companionArticles: ['missing']}])
    assert.throws(() => validateArticleRegistry({...articleRegistry, udon: invalid}));
  const infrastructure = ['ARCHITECTURE.md', 'scripts/pages-package.mjs', 'scripts/pages-package.test.mjs', 'scripts/pages-layout.json',
    '.github/workflows/quality-gate.yml'].map(change);
  const combined = run([...product, ...infrastructure]);
  assert.equal(combined.scope, 'udon-everyday');
  assert(combined.commands.some(c => c.includes('--test') && c.includes('scripts/pages-package.test.mjs')));
  assert(combined.commands.some(c => c.includes('--test') && c.includes(articleTest)));
});

test('a changed Pages package definition validates the package and builds a main deployment candidate', () => {
  const testFile = 'scripts/pages-package.test.mjs';
  for (const [file, candidate] of [['scripts/pages-layout.json', true], ['scripts/pages-package.mjs', true], [testFile, false]]) {
    const files = [{status: 'A', path: articleRegistryPath}, change(articleReleaseHelper), change('scripts/release-scope.mjs'),
      change('ARCHITECTURE.md'), change(file)];
    const plan = chooseReleaseScope(files);
    assert.equal(plan.scope, 'release-infrastructure');
    assert.equal(plan.pagesCandidate, candidate);
    assert.equal(plan.needsDependencies, false);
    assert.equal(plan.commands.filter(c => c.includes('--test') && c.includes(testFile)).length, 1);
    assert(!plan.commands.some(c => c[1] === 'scripts/pages-package.mjs' && c.includes('check')));
    assert.equal(chooseReleaseScope([...files, change('app.js')]).scope, 'unmapped');
  }
});

test('ramen scope covers ten editions, eleven photographs and only nine entry languages', () => {
  const files = ['scripts/generate-ramen-page.mjs', 'scripts/ramen-page.test.mjs', 'scripts/shared/ramen-entry.mjs',
    'data/ramen/ja.json', 'data/ramen/en.json', 'ramen.html', 'en/ramen.html', 'th/ramen.html', 'ramen.css',
    'images/ramen/jiro.webp', 'images/ramen/jiro-detail.webp', 'images/ramen/aburasoba.webp',
    'shared-ui/ja.shell.js', 'shared-ui/th.rail-ramen.js', 'content-manifest.json'];
  const plan = chooseReleaseScope(files.map(change));
  assert.equal(plan.scope, 'ramen-everyday');
  assert(plan.needsDependencies && plan.pagesCandidate);
  assert(plan.commands.some(command => command.includes('scripts/ramen-page.test.mjs')));
  assert(plan.commands.some(command => command.includes('scripts/check-content-manifest.mjs')));
  assert(!plan.commands.some(command => command.includes('verify') || command.includes('build:full')));
  for (const unrelated of ['app.js', 'data.js', 'style.css', 'everyday.css', 'donburi.css', 'donburi.js',
    'foods.html', 'en/guide.html', 'ar/ramen.html', 'data/ramen/ar.json', 'images/ramen/unrelated.webp',
    'images/ramen/jiro.jpg', 'shared-ui/en.rail-castles.js'])
    assert.notEqual(chooseReleaseScope([...files, unrelated].map(change)).scope, 'ramen-everyday', unrelated);
  assert.notEqual(chooseReleaseScope([...files.map(change), {path: 'en/ramen.html', status: 'D'}]).scope, 'ramen-everyday');
});

test('ramen reciprocal links check only the affected series generators and localized consumers', () => {
  const routes = ['ramen.html', 'donburi.html', 'foods.html', 'drinks.html', 'beer-on-shinkansen.html',
    'countryside.html', 'spots/gamagori-greenhouses.html', 'omamori.html', 'everyday-japan.html'];
  const languages = ['en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko', 'it', 'th'];
  const files = ['scripts/generate-ramen-page.mjs', 'scripts/shared/everyday-related.mjs',
    'scripts/generate-castle-locales.mjs', 'scripts/generate-drinks-locales.mjs', 'scripts/generate-omamori-page.mjs',
    'scripts/donburi-page.test.mjs', 'scripts/omamori-page.test.mjs', 'scripts/drinks-locales.test.mjs',
    ...languages.flatMap(lang => routes.map(route => lang + '/' + route))];
  const plan = chooseReleaseScope(files.map(change));
  assert.equal(plan.scope, 'ramen-everyday');
  for (const testFile of ['ramen-page', 'donburi-page', 'omamori-page', 'drinks-locales', 'locales-contract', 'food-country-locales'])
    assert(plan.commands.some(command => command.includes('scripts/' + testFile + '.test.mjs')), testFile);
  for (const generator of ['generate-ramen-page', 'generate-donburi-page', 'generate-everyday-page', 'generate-foods-page',
    'generate-drinks-page', 'generate-beer-page', 'generate-countryside-page', 'generate-drinks-locales',
    'generate-omamori-page', 'generate-site-chrome', 'generate-site-runtime'])
    assert(plan.commands.some(command => command.includes('scripts/' + generator + '.mjs') && command.includes('--check')), generator);
  const navigation = plan.commands.find(command => command.includes('scripts/validate-site-navigation.mjs'));
  for (const route of routes) assert(navigation.includes(route), route);
  assert(plan.commands.some(command => command.some(argument => argument.includes("planSpotPage('gamagori-greenhouses','en'"))));
  assert(plan.commands.some(command => command.some(argument => argument.includes("readFileSync('sitemap.xml','utf8'),sitemapXML()"))));
  assert(!plan.commands.some(command => command.includes('scripts/generate-spot-pages.mjs')), 'Do not generate or check unrelated spot articles');
  for (const unrelated of ['en/spots/fuji.html', 'fr/guide.html', 'shared-ui/en.rail-castles.js'])
    assert.notEqual(chooseReleaseScope([...files, unrelated].map(change)).scope, 'ramen-everyday', unrelated);
});

test('Japanese companion-card promotion cannot enter the ramen reciprocal-link scope', () => {
  const files = ['scripts/generate-ramen-page.mjs', 'en/omamori.html'].map(change);
  const before = '<script src="locales.js?v=01234567"></script><main><p>Existing content</p></main>';
  const after = before.replace('</main>', '<a href="ramen.html">New Japanese promotion</a></main>');
  for (const route of ['donburi.html', 'foods.html', 'drinks.html', 'countryside.html', 'spots/gamagori-greenhouses.html', 'omamori.html'])
    assert.notEqual(chooseReleaseScope([...files, change(route)], {
      ramenAssetVersionOnly: () => onlyRamenAssetReferencesChanged(before, after)
    }).scope, 'ramen-everyday', route);
});

test('Japanese donburi permits one English ramen card and preserves its existing article', () => {
  const before = '<script src="locales.js?v=01234567"></script><main>Existing Japanese article</main><nav class="everyday-related-grid" aria-label="English stories"><a href="en/foods.html">Existing English food story</a></nav>';
  const card = '<a class="everyday-story-card" href="en/ramen.html" data-edition-only="en" data-cta-track="everyday_related_click" data-cta-id="ramen" lang="en"><span class="everyday-story-photo"><img src="images/ramen/jiro.webp" alt="" width="1440" height="810" loading="lazy" decoding="async"></span><span class="everyday-story-copy"><small>A BOWL ALONG THE WAY</small><strong>Find your ramen</strong><span>A new bowl for your trip.</span><b>Read the story <span aria-hidden="true">→</span></b></span></a>';
  const after = before.replace('</nav>', card + '</nav>').replace('01234567', 'abcdef12');
  assert(onlyRamenEnglishCardAddedToJapaneseDonburi('donburi.html', before, after));
  assert(!onlyRamenEnglishCardAddedToJapaneseDonburi('foods.html', before, after));
  assert(!onlyRamenEnglishCardAddedToJapaneseDonburi('donburi.html', before, after.replace('en/ramen.html', 'ramen.html')));
  assert(!onlyRamenEnglishCardAddedToJapaneseDonburi('donburi.html', before, after.replace('Existing Japanese article', 'Unrelated edit')));
  assert(!onlyRamenEnglishCardAddedToJapaneseDonburi('donburi.html', before, after.replace('jiro.webp', 'other.webp')));
  assert(!onlyRamenEnglishCardAddedToJapaneseDonburi('donburi.html', before, after.replace('</nav>', card + '</nav>')));
  assert(!onlyRamenEnglishCardAddedToJapaneseDonburi('donburi.html', before, before + card));
  const files = ['scripts/generate-ramen-page.mjs', 'donburi.html'].map(change);
  assert.notEqual(chooseReleaseScope(files).scope, 'ramen-everyday');
  assert.equal(chooseReleaseScope(files, {ramenJapaneseDonburiOnly: onlyRamenEnglishCardAddedToJapaneseDonburi('donburi.html', before, after)}).scope, 'ramen-everyday');
});

test('ramen collateral HTML accepts only the existing locale-route version proof', () => {
  const before = '<script src="../../locales.js?v=01234567"></script><script src="language-router.js?v=89abcdef"></script><p>Original article</p>';
  const after = before.replace('01234567', 'abcdef12').replace('89abcdef', '23456789');
  assert(onlyRamenAssetReferencesChanged(before, after));
  assert(!onlyRamenAssetReferencesChanged(before, before));
  assert(!onlyRamenAssetReferencesChanged(before, after.replace('Original article', 'Unrelated change')));
  for (const asset of ['app.js', 'style.css', 'donburi.js'])
    assert(!onlyRamenAssetReferencesChanged('<script src="' + asset + '?v=01234567"></script>', '<script src="' + asset + '?v=abcdef12"></script>'));
  const files = ['scripts/generate-ramen-page.mjs', 'en/guide.html'].map(change);
  assert.notEqual(chooseReleaseScope(files, {assetVersionOnly: () => true}).scope, 'ramen-everyday');
  assert.equal(chooseReleaseScope(files, {ramenAssetVersionOnly: () => onlyRamenAssetReferencesChanged(before, after)}).scope, 'ramen-everyday');
  assert.notEqual(chooseReleaseScope(files, {ramenAssetVersionOnly: () => onlyRamenAssetReferencesChanged(before, after + '<p>New text</p>')}).scope, 'ramen-everyday');
  assert.notEqual(chooseReleaseScope([{path: 'scripts/generate-ramen-page.mjs', status: 'A'}, {path: 'unrelated.html', status: 'A'}],
    {ramenAssetVersionOnly: () => true}).scope, 'ramen-everyday');
});

test('ramen source guards allow one route addition without unrelated sitemap or routing edits', () => {
  const addition = "    ...languages.filter(lang=>lang!=='ja').map(lang=>({loc:`${siteRoot}/${lang}/ramen.html`,priority:'0.7',changefreq:'monthly',lastmod:'2026-11-17'})),\n";
  const beforeMap = 'function sitemapXML() {\n  return [\n  ];\n}\n';
  const afterMap = beforeMap.replace('  ];', addition + '  ];');
  assert(onlyRamenSitemapChanged(beforeMap, afterMap));
  assert(!onlyRamenSitemapChanged(beforeMap, beforeMap));
  assert(!onlyRamenSitemapChanged(beforeMap, afterMap.replace("lang!=='ja'", "lang==='ja'")));
  assert(!onlyRamenSitemapChanged(beforeMap, afterMap.replace('  ];', addition + '  ];')));
  assert(!onlyRamenSitemapChanged(beforeMap, afterMap + 'unrelated'));
  const beforeLocale = "var routes = utility.concat(castles, extra, ['guide.html', 'omamori.html', 'donburi.html'], storyRoutes);";
  const afterLocale = beforeLocale.replace("'donburi.html'", "'donburi.html', 'ramen.html'");
  assert(onlyRamenLocaleRouteChanged(beforeLocale, afterLocale));
  assert(!onlyRamenLocaleRouteChanged(beforeLocale, beforeLocale));
  assert(!onlyRamenLocaleRouteChanged(beforeLocale, afterLocale.replace('guide.html', 'changed.html')));
  const beforeRouter = 'var routes = {\n    "/donburi.html": "en/donburi.html",\n};';
  const afterRouter = beforeRouter.replace('\n};', '\n    "/ramen.html": "en/ramen.html",\n};');
  assert(onlyRamenLanguageRouteChanged(beforeRouter, afterRouter));
  assert(!onlyRamenLanguageRouteChanged(beforeRouter, beforeRouter));
  assert(!onlyRamenLanguageRouteChanged(beforeRouter, afterRouter.replace('en/donburi.html', 'en/changed.html')));
  assert(!onlyRamenLanguageRouteChanged(beforeRouter, afterRouter.replace('\n};', '\n    "/ramen.html": "en/ramen.html",\n};')));
  const files = ['scripts/generate-ramen-page.mjs', 'scripts/generate-spot-pages.mjs', 'locales.js', 'language-router.js'].map(change);
  const options = {ramenSitemapOnly: true, ramenLocalesOnly: true, ramenRouterOnly: true};
  assert.equal(chooseReleaseScope(files, options).scope, 'ramen-everyday');
  for (const key of Object.keys(options)) assert.notEqual(chooseReleaseScope(files, {...options, [key]: false}).scope, 'ramen-everyday');
});

test('ramen metadata adds only the new ten-edition route records', () => {
  const before = JSON.stringify({'en/foods.html': {title: 'Existing food story', lastmod: '2026-10-23'}});
  const addition = {'en/ramen.html': {title: 'Ramen in Japan', lastmod: '2026-11-17'},
    'ramen.html': {title: 'Ramen', lastmod: '2026-11-17'}};
  const after = JSON.stringify({...JSON.parse(before), ...addition});
  assert(onlyRamenMetadataAdded(before, after));
  assert(!onlyRamenMetadataAdded(before, before));
  assert(!onlyRamenMetadataAdded(before, after.replace('Existing food story', 'Unrelated article')));
  assert(!onlyRamenMetadataAdded(before, JSON.stringify(addition)));
  assert(!onlyRamenMetadataAdded(before, JSON.stringify({...JSON.parse(after), 'ar/ramen.html': {title: 'Unregistered language'}})));
  assert(!onlyRamenMetadataAdded(before, JSON.stringify({...JSON.parse(after), 'en/guide.html': {title: 'Unrelated route'}})));
  const files = ['scripts/generate-ramen-page.mjs', 'scripts/content-metadata.json'].map(change);
  assert.notEqual(chooseReleaseScope(files).scope, 'ramen-everyday');
  assert.equal(chooseReleaseScope(files, {ramenMetadataOnly: onlyRamenMetadataAdded(before, after)}).scope, 'ramen-everyday');
});

test('ramen package extension preserves the existing generator, test and dependency commands', () => {
  const before = {scripts: {'build:pages': 'node scripts/generate-donburi-page.mjs && node scripts/generate-omamori-page.mjs',
    'preflight:spots': 'node scripts/generate-donburi-page.mjs --check && node scripts/generate-omamori-page.mjs --check',
    'test:generator': 'node --test scripts/donburi-page.test.mjs scripts/omamori-page.test.mjs'}, devDependencies: {jsdom: '30.0.1'}};
  const after = structuredClone(before);
  after.scripts['build:pages'] = after.scripts['build:pages'].replace(' && ', ' && node scripts/generate-ramen-page.mjs && ');
  after.scripts['preflight:spots'] = after.scripts['preflight:spots'].replace(' && ', ' && node scripts/generate-ramen-page.mjs --check && ');
  after.scripts['test:generator'] = after.scripts['test:generator'].replace('node --test ', 'node --test scripts/ramen-page.test.mjs ');
  const files = ['scripts/generate-ramen-page.mjs', 'package.json'].map(change);
  const options = {packageBefore: JSON.stringify(before), packageAfter: JSON.stringify(after)};
  assert.equal(chooseReleaseScope(files, options).scope, 'ramen-everyday');
  const weakened = structuredClone(after);
  weakened.scripts['preflight:spots'] = 'node scripts/generate-ramen-page.mjs --check && node replacement.mjs';
  assert.notEqual(chooseReleaseScope(files, {...options, packageAfter: JSON.stringify(weakened)}).scope, 'ramen-everyday');
  const dependency = structuredClone(after);
  dependency.devDependencies.jsdom = '99.0.0';
  assert.equal(chooseReleaseScope(files, {...options, packageAfter: JSON.stringify(dependency)}).scope, 'full');
  const arbitrary = structuredClone(after);
  arbitrary.scripts.other = 'node unregistered.mjs';
  assert.notEqual(chooseReleaseScope(files, {...options, packageAfter: JSON.stringify(arbitrary)}).scope, 'ramen-everyday');
});

test('spot advertising checks only configured Japanese routes and test-only package registration', () => {
  const files = ['spot-adsense.js', 'spots/kakegawa.html', 'scripts/shared/spot-ad-placements.mjs',
    'scripts/spot-adsense.test.mjs', 'scripts/generate-spot-pages.mjs', 'scripts/generate-content-manifest.mjs',
    'content-manifest.json', 'privacy.html', 'en/privacy.html', 'scripts/templates/site-source/privacy.html.tpl',
    'scripts/templates/site-source/en/privacy.html.tpl', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs'];
  const plan = chooseReleaseScope(files.map(change));
  assert.equal(plan.scope, 'spot-adsense-pilot');
  assert(plan.commands.some(command => command.includes('scripts/generate-spot-pages.test.mjs')));
  assert(plan.commands.some(command => command.includes('scripts/check-content-manifest.mjs')));
  const routes = ['genki-sign', 'hikone-castle', 'hinataoka', 'kiyosu', 'solar-ark'].map(id => 'spots/' + id + '.html');
  const expansion = [...routes, 'scripts/shared/spot-ad-placements.mjs', 'scripts/spot-adsense.test.mjs', 'content-manifest.json'];
  const expandedPlan = chooseReleaseScope(expansion.map(change));
  assert.equal(expandedPlan.scope, 'spot-adsense-pilot');
  const navigation = expandedPlan.commands.find(command => command.includes('scripts/validate-site-navigation.mjs'));
  for (const route of routes) assert(navigation.includes(route), route);
  for (const unrelated of ['spots/727-board.html', 'spots/ibuki.html', 'en/spots/kiyosu.html'])
    assert.notEqual(chooseReleaseScope([...expansion, unrelated].map(change)).scope, 'spot-adsense-pilot', unrelated);
  for (const unrelated of ['spot-page-shared.js', 'style.css', 'zukan.html', 'spots/fuji.html', 'en/spots/kakegawa.html'])
    assert.notEqual(chooseReleaseScope([...files, unrelated].map(change)).scope, 'spot-adsense-pilot', unrelated);
  assert.notEqual(chooseReleaseScope([...files.map(change), {path:'privacy.html',status:'D'}]).scope, 'spot-adsense-pilot');
  const before = {scripts:{'test:generator':'node --test scripts/existing.test.mjs'},dependencies:{jsdom:'1'}};
  const after = structuredClone(before);
  after.scripts['test:generator'] = 'node --test scripts/spot-adsense.test.mjs scripts/existing.test.mjs';
  const changes = [...files, 'package.json'].map(change);
  assert.equal(chooseReleaseScope(changes, {packageBefore:JSON.stringify(before),packageAfter:JSON.stringify(after)}).scope, 'spot-adsense-pilot');
  after.dependencies.jsdom = '2';
  assert.notEqual(chooseReleaseScope(changes, {packageBefore:JSON.stringify(before),packageAfter:JSON.stringify(after)}).scope, 'spot-adsense-pilot');
});

test('donburi permits only the exact two-column Everyday Japan taste-card adjustment', () => {
  const rule = '.taste-grid{grid-template-columns:repeat(3,minmax(0,1fr))}';
  const before = '.everyday-grid{display:grid;gap:20px}' + rule + '.country-grid{grid-template-columns:repeat(2,minmax(0,1fr))}';
  const after = before.replace(rule, rule.replace('repeat(3,', 'repeat(2,'));
  assert(onlyDonburiEverydayLayoutChanged(before, after));
  assert(!onlyDonburiEverydayLayoutChanged(before, before));
  assert(!onlyDonburiEverydayLayoutChanged(before, after.replace('gap:20px', 'gap:30px')));
  assert(!onlyDonburiEverydayLayoutChanged(before, before.replace(rule, rule.replace('repeat(3,', 'repeat(4,'))));
  assert(!onlyDonburiEverydayLayoutChanged(before + rule, after + rule));
  const files = ['scripts/generate-donburi-page.mjs', 'everyday.css'].map(change);
  assert.notEqual(chooseReleaseScope(files).scope, 'donburi-everyday');
  assert.equal(chooseReleaseScope(files, {donburiEverydayLayoutOnly: onlyDonburiEverydayLayoutChanged(before, after)}).scope, 'donburi-everyday');
  assert.notEqual(chooseReleaseScope(files, {donburiEverydayLayoutOnly: onlyDonburiEverydayLayoutChanged(before, after + 'unrelated')}).scope, 'donburi-everyday');
});

test('donburi scope covers ten editions and only its nine non-Japanese series entry languages', () => {
  const files = ['scripts/generate-donburi-page.mjs', 'data/donburi/en.json', 'data/donburi/ja.json',
    'donburi.html', 'en/donburi.html', 'th/donburi.html', 'th/foods.html', 'de/everyday-japan.html',
    'images/donburi/storefront-sukiya.webp', 'shared-ui/ja.shell.js', 'shared-ui/th.rail-donburi.js', 'content-manifest.json'];
  const plan = chooseReleaseScope(files.map(change));
  assert.equal(plan.scope, 'donburi-everyday');
  assert(plan.needsDependencies && plan.pagesCandidate);
  assert(plan.commands.some(command => command.includes('scripts/donburi-page.test.mjs')));
  assert(plan.commands.some(command => command.includes('scripts/check-content-manifest.mjs')));
  assert(plan.commands.find(command => command.includes('scripts/validate-site-navigation.mjs')).includes('donburi.html'));
  assert(!plan.commands.some(command => command.includes('verify') || command.includes('build:full')));
  for (const unrelated of ['app.js', 'data.js', 'style.css', 'foods.html', 'en/guide.html', 'ar/donburi.html',
    'data/donburi/ar.json', 'images/donburi/unrelated.webp', 'shared-ui/en.rail-castles.js'])
    assert.notEqual(chooseReleaseScope([...files, unrelated].map(change)).scope, 'donburi-everyday', unrelated);
  assert.notEqual(chooseReleaseScope([...files.map(change), {path: 'en/foods.html', status: 'D'}]).scope, 'donburi-everyday');
});

test('donburi reciprocal links cover each companion article and only the affected localized consumers', () => {
  const routes = ['donburi.html', 'foods.html', 'drinks.html', 'beer-on-shinkansen.html', 'countryside.html',
    'spots/gamagori-greenhouses.html', 'omamori.html', 'everyday-japan.html'];
  const languages = ['en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko', 'it', 'th'];
  const files = ['scripts/generate-donburi-page.mjs', 'scripts/generate-castle-locales.mjs',
    'scripts/generate-drinks-locales.mjs', 'scripts/generate-omamori-page.mjs',
    ...languages.flatMap(lang => routes.map(route => `${lang}/${route}`))];
  const plan = chooseReleaseScope(files.map(change));
  assert.equal(plan.scope, 'donburi-everyday');
  for (const testFile of ['scripts/donburi-page.test.mjs', 'scripts/omamori-page.test.mjs', 'scripts/drinks-locales.test.mjs'])
    assert(plan.commands.some(command => command.includes(testFile)), testFile);
  for (const generator of ['generate-drinks-page', 'generate-beer-page', 'generate-countryside-page', 'generate-drinks-locales', 'generate-omamori-page'])
    assert(plan.commands.some(command => command.includes(`scripts/${generator}.mjs`) && command.includes('--check')), generator);
  const navigation = plan.commands.find(command => command.includes('scripts/validate-site-navigation.mjs'));
  for (const route of routes) assert(navigation.includes(route), route);
  assert(plan.commands.some(command => command.some(argument => argument.includes("planSpotPage('gamagori-greenhouses','en'"))), 'Check only the English greenhouse spot');
  assert(!plan.commands.some(command => command.includes('scripts/generate-spot-pages.mjs')), 'Do not generate or check unrelated spot articles');
  for (const unrelated of ['en/spots/fuji.html', 'fr/guide.html', 'shared-ui/en.rail-castles.js'])
    assert.notEqual(chooseReleaseScope([...files, unrelated].map(change)).scope, 'donburi-everyday', unrelated);
});

test('Japanese companion-card promotion cannot enter the donburi reciprocal-link scope', () => {
  const files = ['scripts/generate-donburi-page.mjs', 'en/omamori.html'].map(change);
  const before = '<script src="locales.js?v=01234567"></script><main><p>Existing content</p></main>';
  const after = before.replace('</main>', '<a href="donburi.html">New Japanese promotion</a></main>');
  for (const route of ['foods.html', 'drinks.html', 'countryside.html', 'spots/gamagori-greenhouses.html', 'omamori.html'])
    assert.notEqual(chooseReleaseScope([...files, change(route)], {
      donburiAssetVersionOnly: () => onlyDonburiAssetReferencesChanged(before, after)
    }).scope, 'donburi-everyday', route);
});

test('donburi allows only route-contract version references in other HTML pages', () => {
  const before = '<script src="../../locales.js?v=01234567"></script><script src="language-router.js?v=89abcdef"></script><p>Original article</p>';
  const after = before.replace('01234567', 'abcdef12').replace('89abcdef', '23456789');
  assert(onlyDonburiAssetReferencesChanged(before, after));
  assert(!onlyDonburiAssetReferencesChanged(before, before));
  assert(!onlyDonburiAssetReferencesChanged(before, after.replace('Original article', 'Unrelated change')));
  assert(!onlyDonburiAssetReferencesChanged('<script src="app.js?v=01234567"></script>', '<script src="app.js?v=abcdef12"></script>'));
  const files = ['scripts/generate-donburi-page.mjs', 'en/guide.html'].map(change);
  assert.notEqual(chooseReleaseScope(files, {assetVersionOnly: () => true}).scope, 'donburi-everyday');
  assert.equal(chooseReleaseScope(files, {donburiAssetVersionOnly: () => onlyDonburiAssetReferencesChanged(before, after)}).scope, 'donburi-everyday');
  assert.notEqual(chooseReleaseScope([{path: 'scripts/generate-donburi-page.mjs', status: 'A'}, {path: 'unrelated.html', status: 'A'}],
    {donburiAssetVersionOnly: () => true}).scope, 'donburi-everyday');
});

test('donburi source guards reject unrelated sitemap, locale and redirect behavior', () => {
  const addition = "    ...languages.filter(lang=>lang!=='ja').map(lang=>({loc:`${siteRoot}/${lang}/donburi.html`,priority:'0.7',changefreq:'monthly',lastmod:'2026-11-15'})),\n";
  const beforeMap = 'function sitemapXML() {\n  return [\n  ];\n}\n';
  const afterMap = beforeMap.replace('  ];', addition + '  ];');
  assert(onlyDonburiSitemapChanged(beforeMap, afterMap));
  assert(!onlyDonburiSitemapChanged(beforeMap, afterMap.replace("lang!=='ja'", "lang==='ja'")));
  assert(!onlyDonburiSitemapChanged(beforeMap, afterMap + 'unrelated'));
  const beforeLocale = "var routes = utility.concat(castles, extra, ['guide.html', 'omamori.html'], storyRoutes);";
  const afterLocale = beforeLocale.replace("'omamori.html'", "'omamori.html', 'donburi.html'");
  assert(onlyDonburiLocaleRouteChanged(beforeLocale, afterLocale));
  assert(!onlyDonburiLocaleRouteChanged(beforeLocale, afterLocale.replace('guide.html', 'changed.html')));
  const beforeRouter = 'var routes = {\n    "/omamori.html": "en/omamori.html",\n};';
  const afterRouter = beforeRouter.replace('\n};', '\n    "/donburi.html": "en/donburi.html",\n};');
  assert(onlyDonburiLanguageRouteChanged(beforeRouter, afterRouter));
  assert(!onlyDonburiLanguageRouteChanged(beforeRouter, afterRouter.replace('en/omamori.html', 'en/changed.html')));
  const files = ['scripts/generate-donburi-page.mjs', 'scripts/generate-spot-pages.mjs', 'locales.js', 'language-router.js'].map(change);
  const options = {donburiSitemapOnly: true, donburiLocalesOnly: true, donburiRouterOnly: true};
  assert.equal(chooseReleaseScope(files, options).scope, 'donburi-everyday');
  for (const key of Object.keys(options)) assert.notEqual(chooseReleaseScope(files, {...options, [key]: false}).scope, 'donburi-everyday');
});

test('donburi package extension adds its generator and tests without weakening existing checks', () => {
  const before = {scripts: {'build:pages': 'node scripts/generate-omamori-page.mjs && node other.mjs',
    'preflight:spots': 'node scripts/generate-omamori-page.mjs --check && node other.mjs --check',
    'test:generator': 'node --test scripts/omamori-page.test.mjs'}, devDependencies: {jsdom: '30.0.1'}};
  const after = structuredClone(before);
  after.scripts['build:pages'] = 'node scripts/generate-donburi-page.mjs && ' + after.scripts['build:pages'];
  after.scripts['preflight:spots'] = 'node scripts/generate-donburi-page.mjs --check && ' + after.scripts['preflight:spots'];
  after.scripts['test:generator'] = after.scripts['test:generator'].replace('node --test ', 'node --test scripts/donburi-page.test.mjs ');
  const files = ['scripts/generate-donburi-page.mjs', 'package.json'].map(change);
  const options = {packageBefore: JSON.stringify(before), packageAfter: JSON.stringify(after)};
  assert.equal(chooseReleaseScope(files, options).scope, 'donburi-everyday');
  after.scripts['preflight:spots'] = 'node scripts/generate-donburi-page.mjs --check && node replacement.mjs';
  assert.notEqual(chooseReleaseScope(files, {...options, packageAfter: JSON.stringify(after)}).scope, 'donburi-everyday');
  after.devDependencies.jsdom = '99.0.0';
  assert.equal(chooseReleaseScope(files, {...options, packageAfter: JSON.stringify(after)}).scope, 'full');
});

test('floating badge visibility scope checks both invitation modes without accepting unrelated changes',()=>{
 const files=['scripts/shared/android-app-invite.css','scripts/android-app-invite.test.mjs','android-app-invite.js','site-runtime.json','content-manifest.json'];
 const plan=chooseReleaseScope(files.map(change));assert.equal(plan.scope,'android-invite-visibility');assert.equal(plan.pagesCandidate,true);
 assert(plan.commands.some(command=>command.includes('scripts/android-app-invite.test.mjs')));
 assert(plan.commands.some(command=>command.includes('scripts/android-app-train-invite.test.mjs')));
 for(const unrelated of ['app.js','style.css','index.html','scripts/shared/android-app-invite-runtime.js'])assert.equal(chooseReleaseScope([...files,unrelated].map(change)).scope,'unmapped');
 assert.equal(chooseReleaseScope([...files.map(change),{path:'android-app-invite.js',status:'D'}]).scope,'unmapped');
});

test('train inline invitation scope covers all editions and rejects unrelated changes or dependency edits',()=>{
 const files=['scripts/shared/android-app-invite-runtime.js','scripts/shared/android-app-invite-copy.mjs',
  'scripts/android-app-train-invite.test.mjs','android-app-invite.js','it/start.html','th/start.html','site-runtime.json','content-manifest.json'];
 const plan=chooseReleaseScope(files.map(change));assert.equal(plan.scope,'android-train-invite');assert.equal(plan.pagesCandidate,true);
 assert(plan.commands.some(command=>command.includes('scripts/android-app-invite.test.mjs')));
 assert(plan.commands.some(command=>command.includes('scripts/android-app-train-invite.test.mjs')));
 const before={scripts:{'test:android-invite':'node --test scripts/android-app-invite.test.mjs'},devDependencies:{jsdom:'30.0.1'}};
 const after=structuredClone(before);after.scripts['test:android-invite']+=' scripts/android-app-train-invite.test.mjs';
 const options={packageBefore:JSON.stringify(before),packageAfter:JSON.stringify(after)};
 assert.equal(chooseReleaseScope([...files,'package.json'].map(change),options).scope,'android-train-invite');
 after.devDependencies.jsdom='99.0.0';assert.equal(chooseReleaseScope([...files,'package.json'].map(change),{...options,packageAfter:JSON.stringify(after)}).scope,'full');
 for(const unrelated of ['app.js','data.js','style.css','en/guide.html','images/new.jpg'])assert.equal(chooseReleaseScope([...files,unrelated].map(change)).scope,'unmapped');
 assert.equal(chooseReleaseScope([...files.map(change),{path:'it/start.html',status:'D'}]).scope,'unmapped');
});
test('omamori editions use focused checks and reject unrelated content or dependencies',()=>{
  const files=['scripts/generate-omamori-page.mjs','data/omamori/en.json','omamori.html','en/omamori.html','images/omamori/omamori-various.jpg','spot-page-shared.js','content-manifest.json'];
  const plan=chooseReleaseScope(files.map(change));
  assert.equal(plan.scope,'omamori-everyday');
  assert.ok(plan.commands.some(command=>command.includes('scripts/validate-language-pages.mjs')));
  assert.ok(!plan.commands.some(command=>command.includes('verify')));
  assert.equal(chooseReleaseScope([...files,'data/omamori/th.json','th/omamori.html','th/everyday-japan.html','locales.js','scripts/generate-castle-locales.mjs','scripts/generate-drinks-locales.mjs'].map(change)).scope,'omamori-everyday');
  assert.ok(plan.commands.find(command=>command.includes('scripts/validate-site-navigation.mjs')).includes('omamori.html'));
  assert.notEqual(chooseReleaseScope([...files,'data/omamori/ar.json'].map(change)).scope,'omamori-everyday');
  assert.notEqual(chooseReleaseScope([...files,'data.js'].map(change)).scope,'omamori-everyday');
  const before={scripts:{'build:pages':'node scripts/generate-foods-page.mjs'},dependencies:{jsdom:'1'}};
  const after={scripts:{'build:pages':'node scripts/generate-omamori-page.mjs && node scripts/generate-foods-page.mjs'},dependencies:{jsdom:'1'}};
  assert.equal(chooseReleaseScope([...files,'package.json'].map(change),{packageBefore:JSON.stringify(before),packageAfter:JSON.stringify(after)}).scope,'omamori-everyday');
  after.dependencies.jsdom='2';
  assert.notEqual(chooseReleaseScope([...files,'package.json'].map(change),{packageBefore:JSON.stringify(before),packageAfter:JSON.stringify(after)}).scope,'omamori-everyday');
});

test('story editorial release covers ten editions and display variants, excluding unrelated work',()=>{
  const files=['scripts/generate-story-window-pages.mjs','scripts/shared/story-editorial.mjs','story-window-editorial.css','story-window.js',
    'data/story-window/en/godzilla.html','data/story-window/th/ui.json','th/stories/shinkalion.html','stories/index.html',
    'images/story-window/display/shinjuku-street-kakidai-480.webp','scripts/content-metadata.json','sitemap.xml','content-manifest.json'];
  const plan=chooseReleaseScope(files.map(change));
  assert.equal(plan.scope,'story-editorial');assert.equal(plan.pagesCandidate,true);
  assert(plan.commands.some(command=>command.includes('scripts/shared/story-editorial.test.mjs')));
  assert.equal(plan.commands.find(command=>command.includes('scripts/validate-site-navigation.mjs')).filter(arg=>arg==='--route').length,6);
  for(const unrelated of ['data.js','app.js','style.css','en/foods.html','images/new.jpg'])assert.equal(chooseReleaseScope([...files,unrelated].map(change)).scope,'unmapped');
  assert.equal(chooseReleaseScope([...files.map(change),{path:'stories/godzilla.html',status:'D'}]).scope,'unmapped');
});

test('SEO scope covers its generated consumers and rejects unrelated product edits', () => {
  const paths = ['scripts/generate-inbound-tables.mjs', 'scripts/shared/mieru-runtime.js',
    'scripts/templates/site-source/en/jr-pass-fuji.html.tpl', 'scripts/templates/site-source/fr/guide.html.tpl',
    'fr/live/index.html', 'data/story-window/ja/shogun.html', 'sudoori/index.html',
    'shared-ui/fr.header.js', 'scripts/templates/site-chrome/fr.header.tpl', 'content-manifest.json'];
  const scope = chooseReleaseScope(paths.map(change));
  assert.equal(scope.scope, 'seo-navigation-forecast');
  assert(scope.commands.some(command => command.includes('scripts/validate-train-select.mjs')));
  assert(scope.commands.some(command => command.includes('scripts/validate-mieru.mjs')));
  for (const path of ['app.js', 'data/timetable.js', 'data.js', 'spots/fuji.html', 'images/new.jpg']) {
    assert.equal(chooseReleaseScope([...paths, path].map(change)).scope, 'unmapped');
  }
  assert.equal(chooseReleaseScope([...paths.map(change), {path:'fr/live/index.html',status:'D'}]).scope, 'unmapped');
});

test('Mikawa batch scope rejects unrelated inputs and unrelated spot changes', () => {
  const paths = [change('data.js'), change('locales.js'), {path:'fr/spots/mikawa-oshima.html',status:'A'}];
  assert.equal(chooseReleaseScope(paths,{mikawaPhotoBatchDataOnly:true}).scope,'mikawa-photo-locales');
  assert.equal(chooseReleaseScope([...paths,change('app.js')],{mikawaPhotoBatchDataOnly:true}).scope,'unmapped');
  assert.equal(chooseReleaseScope([...paths,{path:'spots/old.html',status:'D'}],{mikawaPhotoBatchDataOnly:true}).scope,'unmapped');
  const source=spots=>'const SPOTS='+JSON.stringify(spots)+';const ROUTE={};const BOARD_COLLECTION=[];const WHEEL_COLLECTION=[];';
  const before=[{id:'mikawa-oshima',photos:[]},{id:'kaguya-no-akari',photos:[],media:{videos:[]}},{id:'hikone-castle',photos:[]},{id:'other',side:'A'}];
  const after=JSON.parse(JSON.stringify(before));
  const photo=src=>({src,credit:{ja:'michikusa',en:'michikusa'}});
  after[0].photos=[photo('images/20261103_gamagori-takeshima_0_michikusa.jpg'),photo('images/20261103_mikawa-oshima_sunset_28750_michikusa.jpg')];
  after[1].photos=[photo('images/20261108_kaguya-no-akari_night_2305_michikusa.jpg')];
  after[1].media.videos.push({id:'MeY8wdwrs68'});
  after[2].photos=[photo('images/20261108_hikone-castle_night_59142_michikusa.jpg')];
  assert.ok(onlyMikawaPhotoBatchDataChanged(source(before),source(after)));
  after[3].side='E';
  assert.equal(onlyMikawaPhotoBatchDataChanged(source(before),source(after)),false);
});

test('ride photo scope rejects unrelated paths, deleted media, changed translations and changed collateral content', () => {
  const files = ['data.js', 'scripts/generate-yakei-page.mjs', 'scripts/generate-runtime-data.mjs',
    'scripts/locales/castle-fr.json', 'data/spot-pages/odawara.en.js', 'en/yakei.html', 'content-manifest.json', 'en/zukan.html'];
  const options = {rideDataOnly: true, rideBudgetOnly: true, addedLocaleKeysOnly: () => true, assetVersionOnly: () => true};
  assert.equal(chooseReleaseScope(files.map(change), options).scope, 'owned-ride-night-content');
  for (const file of ['images/unrelated.jpg', 'style.css', 'app.js', 'spots/unknown.html', 'data/spot-pages/unknown.en.js']) {
    assert.equal(chooseReleaseScope([...files, file].map(change), {...options, assetVersionOnly: () => false}).scope, 'unmapped');
  }
  assert.equal(chooseReleaseScope([...files.map(change), {path:'images/20261103_atami_night_11757_michikusa.jpg',status:'D'}], options).scope, 'unmapped');
  assert.equal(chooseReleaseScope(files.map(change), {...options, rideDataOnly:false}).scope, 'unmapped');
  assert.equal(chooseReleaseScope(files.map(change), {...options, rideBudgetOnly:false}).scope, 'unmapped');
  assert.equal(chooseReleaseScope(files.map(change), {...options, addedLocaleKeysOnly:()=>false}).scope, 'unmapped');
  assert(onlyAssetVersionReferencesChanged('<script src="data-runtime.js?v=1234abcd"></script>', '<script src="data-runtime.js?v=abcdef12"></script>'));
  assert(!onlyAssetVersionReferencesChanged('<p>Old</p>', '<p>New</p>'));
  const manifest='{"assets":{"spot-page-shared-data.js":"1234abcd","style.css":"aaaa1111"},"version":1}';
  assert(onlyCatalogManifestVersionChanged(manifest,manifest.replace('1234abcd','abcdef12')));
  assert(!onlyCatalogManifestVersionChanged(manifest,manifest.replace('aaaa1111','bbbb2222')));
  assert(!onlyCatalogManifestVersionChanged(manifest,manifest.replace('"version":1','"version":2')));
});

test('ride data guard retains existing photos, credits, media, other spots and route timing', () => {
  const spot = {id:'odawara',ja:{name:'Atami'},en:{name:'Atami'},minutesFromTokyo:36,side:'A',image:'images/old.jpg',photos:[{src:'images/extra.jpg',credit:{ja:'Creator',en:'Creator'}}]};
  const source = spots => 'const SPOTS='+JSON.stringify(spots)+';const ROUTE={};const BOARD_COLLECTION=[];const WHEEL_COLLECTION=[];';
  const before = source([spot,{id:'other',image:'images/other.jpg'}]);
  const updated = JSON.parse(JSON.stringify(spot));
  updated.photos.push({src:'images/20261103_atami_night_11757_michikusa.jpg',credit:{ja:'michikusa',en:'michikusa'},date:'2026-11-03'});
  const next = source([updated,{id:'other',image:'images/other.jpg'}]);
  assert(onlyRideMediaDataChanged(before,next));
  assert(!onlyRideMediaDataChanged(before,next.replace('minutesFromTokyo":36','minutesFromTokyo":40')));
  assert(!onlyRideMediaDataChanged(before,next.replace('images/other.jpg','images/unrelated.jpg')));
  assert(!onlyRideMediaDataChanged(before,next.replace('Creator','Someone else')));
  updated.photos.shift();assert(!onlyRideMediaDataChanged(before,source([updated,{id:'other',image:'images/other.jpg'}])));
  const oldBudget='export const RUNTIME_DATA_BYTE_BUDGET = 350 * 1024;';
  assert(onlyRideBudgetChanged(oldBudget,oldBudget.replace('350','355')));
  assert(!onlyRideBudgetChanged(oldBudget,oldBudget.replace('350','400')));
  assert(!onlyRideBudgetChanged(oldBudget,oldBudget.replace('350','355')+'\nconst unrelated = 1;'));
});
test('November 7 ride scope checks six localized families and protects existing content', () => {
  const source = spot => 'const SPOTS='+JSON.stringify([spot])+';const ROUTE={};const BOARD_COLLECTION=[];const WHEEL_COLLECTION=[];';
  const base = {id:'shiraitogawa-bridge', image:'images/old.jpg', minutesFromTokyo:32.7};
  const src = 'images/20261107_shiraitogawa-bridge_1528_michikusa.jpg';
  const updated = {...base, photos:[{src, credit:{ja:'michikusa', en:'michikusa'}, date:'2026-11-07'}],
    media:{videos:[{id:'ulwkEPLSBx0'}]}};
  assert(onlyRideMediaDataChanged(source(base), source(updated), true));
  assert(!onlyRideMediaDataChanged(source(base), source(updated)));
  assert(!onlyRideMediaDataChanged(source(base), source({...updated, minutesFromTokyo:33}), true));
  assert(!onlyRideMediaDataChanged(source(base), source({...updated, media:{videos:[{id:'unexpected'}]}}), true));
  const changes = [change('data.js'), change('fr/spots/solar-ark.html'), change('data/spot-pages/shiraitogawa-bridge.ja.js'), {path:src, status:'A'}];
  const options = {dayRideDataOnly:true};
  const plan = chooseReleaseScope(changes, options);
  assert.equal(plan.scope, 'owned-ride-day-content');
  assert.equal(plan.commands.filter(command => command.includes('scripts/generate-castle-locales.mjs')).length, 6);
  assert.equal(chooseReleaseScope([...changes, change('fr/spots/odawara.html')], options).scope, 'unmapped');
});

test('body-only story changes check all story editions without unrelated language suites', () => {
  const files = ['data/story-window/fr/godzilla.html', 'fr/stories/godzilla.html', 'content-manifest.json'];
  const plan = chooseReleaseScope(files.map(change));
  assert.equal(plan.scope, 'story-content');
  const nav = plan.commands.find(c => c.includes('scripts/validate-site-navigation.mjs'));
  assert.equal(nav.filter(arg => arg === '--route').length, 6);
  assert(!nav.includes('--with-language-checks'));
  assert(plan.commands.some(c => c.includes('scripts/generate-story-window-pages.mjs') && c.includes('--check')));
  assert(plan.commands.some(c => c.includes('scripts/validate-story-window.mjs')));
  assert(plan.commands.some(c => c.includes('scripts/check-content-manifest.mjs')));
  for (const extra of ['locales.js', 'data/story-window/fr/ui.json', 'data/story-window/fr/maruko.json', 'shared-ui/fr.shell.js', 'scripts/generate-story-window-pages.mjs', 'fr/zukan.html'])
    assert.notEqual(chooseReleaseScope([...files, extra].map(change)).scope, 'story-content', extra);
  assert.notEqual(chooseReleaseScope([{ path: files[0], status: 'D' }]).scope, 'story-content');
  assert.notEqual(chooseReleaseScope([{ path: files[0], status: 'A' }]).scope, 'story-content');
});

test('story tooling proves stable output and does not create a Pages deployment', () => {
  const files = ['scripts/generate-story-window-pages.mjs', 'scripts/shared/story-window.mjs', 'scripts/validate-site-navigation.mjs', 'scripts/validate-site-navigation.test.mjs'];
  const plan = chooseReleaseScope(files.map(change));
  assert.equal(plan.scope, 'story-validation-tooling');
  assert.equal(plan.pagesCandidate, false);
  assert(plan.commands.some(c => c.includes('scripts/generate-story-window-pages.mjs') && c.includes('--check')));
  assert.notEqual(chooseReleaseScope([...files, 'locales.js'].map(change)).scope, 'story-validation-tooling');
  assert.notEqual(chooseReleaseScope([...files, 'scripts/shared/locales.mjs'].map(change)).scope, 'story-validation-tooling');
});
test('artwork chrome extraction preserves content and is limited to the two merged pages', () => {
  const header='<header class="topbar"><a href="../../start.html">Start</a></header>',footer='<footer class="footer">Footer</footer>',before=header+'\n<main>Game</main>\n'+footer+'\n</body>';
  const shell=JSON.stringify({components:{'header-artworks-727-hunt':header.replaceAll('../../','__MADO_ROOT__'),'footer-artworks-727-hunt':footer}});
  for(const file of ['artworks/727-hunt/index.html','artworks/memory-express/index.html']){
    const config={assets:['shared-ui/ja.shell.js'],root:'../../',lang:'ja',route:file,mounts:[{host:'chrome-0',component:'header-artworks-727-hunt',kind:'header'},{host:'chrome-1',component:'footer-artworks-727-hunt',kind:'footer'}]};
    const after=before.replace(header,'<header class="topbar" data-site-chrome-host="chrome-0"></header>').replace(footer,'<footer class="footer" data-site-chrome-host="chrome-1"></footer>').replace('</body>','<script id="mado-shared-ui-config" type="application/json">'+JSON.stringify(config)+'</script>\n<script src="../../site-runtime-loader.js?v=a8ffb108" defer></script>\n</body>');
    assert(onlyPreservedArtworkChromeExtraction(file,before,after,shell));
    assert(!onlyPreservedArtworkChromeExtraction(file,before,after.replace('Game','Changed game'),shell));
    assert(!onlyPreservedArtworkChromeExtraction(file,before,after,shell.replace('Start','Changed navigation')));
    assert(!onlyPreservedArtworkChromeExtraction('artworks/unrelated/index.html',before,after,shell));
    assert.equal(chooseReleaseScope(['scripts/generate-story-window-pages.mjs',file].map(change),{chromeExtractionOnly:path=>onlyPreservedArtworkChromeExtraction(path,before,after,shell)}).scope,'story-window');
  }
});
test('story menu rebinding requires byte-identical menu content and unchanged page content', () => {
  const file='sudoori/index.html', before='<script id="mado-shared-ui-config" type="application/json">{"mounts":[{"menu":"old-menu"}]}</script>', after=before.replace('old-menu','new-menu');
  const oldShell='{"menus":{"old-menu":"Same menu"}}', nextShell='{"menus":{"new-menu":"Same menu"}}';
  assert(onlyPreservedChromeMenuChanged(file,before,after,oldShell,nextShell));
  assert(!onlyPreservedChromeMenuChanged(file,before,after,oldShell,nextShell.replace('Same','Different')));
  assert(!onlyPreservedChromeMenuChanged(file,before,after+'changed body',oldShell,nextShell));
  assert(!onlyPreservedChromeMenuChanged('en/foods.html',before,after,oldShell,nextShell));
});
test('story scope permits only the exact new Maruko destination in existing chrome', () => {
  const file='shared-ui/fr.rail-castles.js', before='href="__MADO_ROOT__en/spots/maruko-bridge.html">Bridge';
  const after=before.replace('__MADO_ROOT__en/','__MADO_ROOT__fr/');
  assert(onlyMarukoLocaleLinkChanged(file,before,after));
  assert(!onlyMarukoLocaleLinkChanged(file,before,after.replace('Bridge','Changed')));
  assert(!onlyMarukoLocaleLinkChanged('shared-ui/en.rail-castles.js',before,after));
  assert(onlyMarukoLocaleLinkChanged('fr/guide.html',before.replace('__MADO_ROOT__','../'),after.replace('__MADO_ROOT__','../')));
  assert(!onlyMarukoLocaleLinkChanged('fr/guide.html',before.replace('__MADO_ROOT__','../'),after.replace('__MADO_ROOT__','../')+'unrelated'));
  const files=['scripts/generate-story-window-pages.mjs',file].map(change);
  assert.equal(chooseReleaseScope(files,{marukoLinkOnly:path=>onlyMarukoLocaleLinkChanged(path,before,after)}).scope,'story-window');
  assert.equal(chooseReleaseScope(files,{marukoLinkOnly:path=>onlyMarukoLocaleLinkChanged(path,before,after+'unrelated')}).scope,'unmapped');
});
test('story integration maps its generators and rejects unrelated product changes', () => {
  const files=['scripts/generate-story-window-pages.mjs','data/story-window/fr/ui.json','fr/stories/index.html','fr/spots/maruko-bridge.html','locales.js','scripts/generate-utility-locales.mjs','content-manifest.json'];
  const plan=chooseReleaseScope(files.map(change));
  assert.equal(plan.scope,'story-window');
  assert(plan.commands.some(command=>command.includes('scripts/validate-story-window.mjs')));
  assert(plan.commands.some(command=>command.includes('scripts/check-content-manifest.mjs')));
  assert(!plan.commands.some(command=>command.includes('verify')||command.includes('build:full')));
  assert.equal(chooseReleaseScope([...files,'data.js'].map(change)).scope,'unmapped');
  assert.equal(chooseReleaseScope([...files,'shared-ui/en.rail-castles.js'].map(change)).scope,'unmapped');
  assert.equal(chooseReleaseScope([...files,'scripts/templates/site-chrome/en.shell/header-references.html.tpl'].map(change)).scope,'unmapped');
  assert.equal(chooseReleaseScope([...files,'en/foods.html'].map(change)).scope,'unmapped');
  assert.equal(chooseReleaseScope([...files,'en/foods.html'].map(change),{versionOnly:()=>true}).scope,'story-window');
});
test('727 game covers its media and entry pages without including unrelated products', () => {
  const changes=[{path:'artworks/727-hunt/index.html',status:'A'},
    {path:'artworks/727-hunt/media/journey.mp4',status:'A'},
    ...['727-collection.html','data/window-artworks.json','window-artworks.html',
      'scripts/generate-content-manifest.mjs','scripts/generate-window-artworks-page.mjs'].map(change)];
  const plan=chooseReleaseScope(changes);
  assert.equal(plan.scope,'727-game');assert(plan.pagesCandidate);
  assert(plan.commands.some(c=>c.includes('scripts/validate-727-game.mjs')));
  assert(plan.commands.some(c=>c.includes('scripts/check-content-manifest.mjs')));
  assert.equal(chooseReleaseScope([...changes,change('data.js')]).scope,'unmapped');
  assert.equal(chooseReleaseScope([...changes,change('en/window-artworks.html')]).scope,'unmapped');
});
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

test('a registered new spot covers global catalogue and language consumers', () => {
  const plan = chooseReleaseScope([
    change('data.js'), change('locales.js'), change('spot-page-shared.js'),
    { status: 'A', path: 'data/spot-pages/sekigahara-battlefield.ja.js' },
    { status: 'A', path: 'spots/sekigahara-battlefield.html' },
  ]);
  assert.equal(plan.scope, 'full');
  assert(plan.commands.some(c => c.includes('verify')));
  assert.equal(chooseReleaseScope([change('data.js')]).scope, 'unmapped');
});
test('release infrastructure changes test release behavior without generating unrelated pages', () => {
  const plan = chooseReleaseScope(['.github/workflows/quality-gate.yml', 'scripts/release-scope.mjs'].map(change));
  assert.equal(plan.scope, 'release-infrastructure');
  assert(plan.commands.some(c => c.includes('scripts/release-artifact.test.mjs')));
  assert(!plan.commands.some(c => c.includes('build:full') || c.includes('verify')));
});
test('documentation and empty changes do not run product tests', () => {
  assert.deepEqual(chooseReleaseScope([change('README.md')]).commands, []);
  const architecture = chooseReleaseScope([change('ARCHITECTURE.md')]);
  assert.equal(architecture.scope, 'documentation');
  assert.deepEqual(architecture.commands, []);
  assert.equal(chooseReleaseScope([change('ARCHITECTURE.md'), change('app.js')]).scope, 'unmapped');
  assert.deepEqual(chooseReleaseScope([]).commands, []);
});

test('build orchestration and HTML review changes exercise their own consumers', () => {
  const build = ['scripts/build.mjs', 'scripts/build.test.mjs'];
  const review = ['scripts/release-html-summary.mjs', 'scripts/release-html-summary.test.mjs'];
  const combined = [...build, ...review, 'scripts/release-scope.mjs', '.github/workflows/quality-gate.yml'];
  for (const [files, dependencies] of [[build, false], [review, true], [combined, true]]) {
    const plan = chooseReleaseScope(files.map(change));
    assert.equal(plan.scope, 'release-infrastructure');
    assert.equal(plan.needsDependencies, dependencies);
    assert.equal(plan.pagesCandidate, false);
    for (const file of files.filter(file => file.endsWith('.test.mjs')))
      assert.equal(plan.commands.filter(c => c.includes('--test') && c.includes(file)).length, 1);
  }
  assert.notEqual(chooseReleaseScope([...combined, 'index.html'].map(change)).scope, 'release-infrastructure');
  const upgraded = chooseReleaseScope([change('package-lock.json')]);
  assert.equal(upgraded.scope, 'full');
  assert(upgraded.commands.some(c => c.includes('--test') && c.includes('scripts/release-html-summary.test.mjs')));
  const yaml = fs.readFileSync(new URL('../.github/workflows/quality-gate.yml', import.meta.url), 'utf8');
  const install = yaml.indexOf('run: npm ci');
  const summary = yaml.indexOf('- name: Summarize HTML changes for review');
  assert(install >= 0 && install < summary);
  assert.match(yaml.slice(0, install), /github\.event_name == 'pull_request' && steps\.plan\.outputs\.review_html == 'true'/);
  assert.match(yaml.slice(summary).split(/\n      - name:/)[0], /if: github\.event_name == 'pull_request'\s+run: node scripts\/release-html-summary\.mjs "\$RUNNER_TEMP\/release-plan\.json"/);
});

test('every release scope explicitly declares whether npm dependencies are needed', () => {
  const scopeOf = changes => chooseReleaseScope(changes).needsDependencies;
  assert.equal(scopeOf([]), false, 'none');
  assert.equal(scopeOf([change('.github/workflows/quality-gate.yml')]), false, 'release infrastructure');
  assert.equal(scopeOf([change('README.md')]), false, 'documentation');
  assert.equal(scopeOf([change('unknown-input.txt')]), false, 'unmapped');
  assert.equal(scopeOf([change('727-collection.css')]), true, '727 collection');
  assert.equal(scopeOf([change('scripts/shared/responsive-photos.mjs')]), true, 'responsive photo dedup');
  assert.equal(scopeOf([change('scripts/shared/android-app-invite-copy.mjs')]), true, 'Android invitation copy');
  assert.equal(scopeOf([change('package.json')]), true, 'full dependency validation');
  assert.equal(scopeOf([change('data.js'), { status: 'A', path: 'data/spot-pages/new-spot.ja.js' }]), true, 'full catalogue validation');
});

test('release plan contract rejects an omitted dependency decision', () => {
  assert.doesNotThrow(() => assertReleasePlanContract({ needsDependencies: false, pagesCandidate: false }));
  assert.throws(() => assertReleasePlanContract({}), /explicitly declare needsDependencies/);
  assert.throws(() => assertReleasePlanContract({ needsDependencies: 'true' }), /explicitly declare needsDependencies/);
  assert.throws(() => assertReleasePlanContract({ needsDependencies: false }), /explicitly declare pagesCandidate/);
});

const currentPackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const previousPackage = structuredClone(currentPackage);
previousPackage.scripts.verify = 'npm run check && npm run preflight:spots && npm run check:manifest && npm run check:all-syntax && npm test && npm run audit:site && npm run check:diff';
previousPackage.scripts.check = 'npm run check:syntax && ' + currentPackage.scripts['check:site'].replace('npm run check:language-navigation', 'npm run check:language && npm run check:navigation');
previousPackage.scripts['check:language'] = ['validate-castle-locales', 'validate-language-pages', 'validate-utility-locales', 'validate-mieru', 'validate-sparkling-locales'].map(name => `node scripts/${name}.mjs`).join(' && ') + ' && node --test scripts/editorial-notes.test.mjs && npm run check:live-sitemap';
delete previousPackage.scripts['check:site'];
delete previousPackage.scripts['check:language-navigation'];
const commandRefactor = { packageBefore: JSON.stringify(previousPackage), packageAfter: JSON.stringify(currentPackage) };

test('the previous CI command refactor preserves checks without becoming a dependency upgrade', () => {
  assert.equal(classifyPackageChange(commandRefactor.packageBefore, commandRefactor.packageAfter), 'validation-commands');
  const plan = chooseReleaseScope([change('package.json')], commandRefactor);
  assert.equal(plan.scope, 'release-infrastructure');
  assert.equal(plan.needsDependencies, false);
  assert.equal(plan.pagesCandidate, false);
});

test('changed check behavior cannot be hidden as command reorganization', () => {
  for (const edit of [p => { p.scripts.verify = 'npm run check:syntax'; },
    p => { p.scripts['check:site'] += ' && node unexpected.mjs'; },
    p => { p.scripts['check:site'] = 'npm run check:site'; },
    p => { p.scripts['build:full'] = 'node different-generator.mjs'; }]) {
    const next = structuredClone(currentPackage); edit(next);
    assert.equal(chooseReleaseScope([change('package.json')], { ...commandRefactor, packageAfter: JSON.stringify(next) }).scope, 'unmapped');
  }
  const next = structuredClone(currentPackage); next.devDependencies.jsdom = 'changed';
  assert.equal(chooseReleaseScope([change('package.json')], { ...commandRefactor, packageAfter: JSON.stringify(next) }).scope, 'full');
});

test('validation helper edits cover their consumers without unrelated generation or distribution', () => {
  const plan = chooseReleaseScope(['package.json', 'scripts/shared/site-runtime-validation.mjs',
    'scripts/shared/site-runtime-validation.test.mjs', 'scripts/validate-site-navigation.mjs',
    '.github/workflows/quality-gate.yml', 'scripts/release-scope.mjs'].map(change), commandRefactor);
  assert.equal(plan.scope, 'validation-infrastructure');
  assert.equal(plan.needsDependencies, true);
  assert.equal(plan.pagesCandidate, false);
  for (const file of ['scripts/shared/site-runtime-validation.test.mjs', 'scripts/food-country-locales.test.mjs',
    'scripts/sanyo-castle-pages.test.mjs', 'scripts/starter-locales.test.mjs', 'scripts/validate-content.mjs',
    'scripts/validate-spot-page-shared.mjs', 'scripts/validate-727-collection.mjs',
    'scripts/validate-sparkling-dreams.mjs', 'scripts/validate-site-navigation.mjs'])
    assert(plan.commands.some(command => command.includes(file)), file);
  assert(!plan.commands.some(command => command.includes('verify') || command.includes('preflight:spots')));
  assert.equal(chooseReleaseScope([change('scripts/shared/site-runtime-validation.mjs'), change('data.js')]).scope, 'unmapped');
});

test('only product changes create a Pages candidate and both workflow steps obey that decision', () => {
  for (const files of [[], ['README.md'], ['.github/workflows/quality-gate.yml'], ['scripts/shared/site-runtime-validation.mjs']])
    assert.equal(needsPagesCandidate(chooseReleaseScope(files.map(change))), false);
  for (const file of ['727-collection.css', 'package-lock.json', 'scripts/shared/android-app-invite-copy.mjs', 'scripts/shared/responsive-photos.mjs'])
    assert.equal(needsPagesCandidate(chooseReleaseScope([change(file)])), true);
  const yaml = fs.readFileSync(new URL('../.github/workflows/quality-gate.yml', import.meta.url), 'utf8');
  for (const name of ['Stage verified checkout for Pages', 'Save verified Pages candidate']) {
    const step = yaml.split(`- name: ${name}`)[1].split(/\n      - /)[0];
    assert.match(step, /steps\.plan\.outputs\.pages_candidate == 'true'/);
  }
});

test('workflow installs from the plan dependency output without duplicating scope names', () => {
  const yaml = fs.readFileSync(new URL('../.github/workflows/quality-gate.yml', import.meta.url), 'utf8');
  const planner = fs.readFileSync(new URL('./release-scope.mjs', import.meta.url), 'utf8');
  assert.match(planner, /needs_dependencies=\$\{plan\.needsDependencies\}/);
  const installStep = yaml.match(/- name: Install dependencies for affected product checks\n([\s\S]*?)(?=\n      - name:)/)?.[1];
  assert(installStep);
  assert.match(installStep, /steps\.plan\.outputs\.needs_dependencies == 'true'/);
  for (const scope of ['full', '727-collection', 'responsive-photo-dedup', 'android-invite-copy'])
    assert(!installStep.includes(scope), `install step must not hardcode ${scope}`);
});

test('factory derivative repairs verify byte-identical image renames, payloads, localized HTML and all changed generators', () => {
  const stem = factoryPhoto.slice('images/'.length, -4);
  const display = token => 'images/thumbs/display/' + stem + '-' + token + '-640.webp';
  const gallery = 'images/thumbs/gallery/index.json', index = 'images/thumbs/display/index.json';
  const payload = 'data/spot-pages/lotte-shiga.ja.js', page = 'spots/lotte-shiga.html', fr = 'fr/' + page;
  const castle = 'scripts/generate-castle-locales.mjs', utility = 'scripts/generate-utility-locales.mjs';
  const shared = 'scripts/shared/utility-localization.mjs';
  const old = '12345678', next = 'abcdef09', tokens = [old, next];
  const indexText = token => JSON.stringify({ version: 1, sources: { [factoryPhoto]: { sha256: token } },
    files: { [display(token)]: { source: factoryPhoto, width: 640, sha256: 'same WebP bytes' } } });
  const data = token => 'window.page = { image: "' + display(token) + '", credit: "michikusa" };\n';
  const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 8);
  const common = 'export const attrs = [];\nexport function collectEnglish() {\n  return ';
  const versions = {
    [gallery]: tokens.map(token => JSON.stringify({ thumbnail: { source: factoryPhoto, sourceSha256: token } })),
    [index]: tokens.map(indexText), [payload]: tokens.map(data),
    [page]: tokens.map(token => '<script src="../' + payload + '?v=' + hash(data(token)) + '"></script>'),
    [fr]: tokens.map(token => '<img src="../../' + display(token) + '"><p>工場</p>'),
    [shared]: [common + '1;\n}', common + '2;\n}'],
  };
  const files = [...[gallery, index, payload, page, fr, 'content-manifest.json', 'scripts/release-scope.mjs'].map(change),
    { status: 'D', path: display(old) }, { status: 'A', path: display(next) }];
  const plan = (extras = [], edits = {}, selected = files) => chooseReleaseScope([...selected, ...extras.map(change)],
    { fileContents: file => edits[file] || versions[file] });
  const localeContract = 'scripts/locales-contract.test.mjs', rivers = 'scripts/generate-rivers-page.mjs';
  const simple = plan(), combined = plan([castle, utility, shared, localeContract]);
  assert.equal(simple.scope, 'factory-photo-derivatives');
  assert(simple.commands.some(c => c.includes('--route') && c.includes(page) && c.includes(castle)));
  assert(!simple.commands.some(c => c.includes(utility)));
  assert(!simple.commands.some(c => c.includes(rivers)));
  assert.equal(combined.scope, simple.scope);
  assert(combined.needsDependencies && combined.pagesCandidate);
  for (const tool of ['scripts/generate-gallery-thumbnails.mjs', 'scripts/generate-spot-page-shared-data.mjs', castle, utility, rivers,
    'scripts/sync-asset-versions.mjs', 'scripts/check-content-manifest.mjs']) {
    const commands = combined.commands.filter(c => c[1] === tool);
    assert.equal(commands.length, 1, tool);
    assert(!commands[0].includes('--route'), tool);
  }
  for (const candidate of [combined, plan([castle, localeContract])]) {
    assert.equal(candidate.commands.filter(c => c.includes('--test') && c.includes(localeContract)).length, 1);
    assert.equal(candidate.commands.filter(c => c.includes('--check') && c.includes(rivers)).length, 1);
  }
  assert(!combined.commands.some(c => c.includes('scripts/generate-starter-locales.mjs')));
  const broad = plan([shared], { [shared]: [versions[shared][0], versions[shared][1].replace('attrs = []', 'attrs = [1]')] });
  assert(broad.commands.some(c => c.includes('scripts/generate-starter-locales.mjs')));
  for (const edits of [
    { [payload]: [versions[payload][0], versions[payload][1].replace('michikusa', 'different credit')] },
    { [fr]: [versions[fr][0], versions[fr][1].replace('工場', '別の本文')] },
    { [page]: [versions[page][0], versions[page][1].replace(hash(data(next)), 'bad0cafe')] },
    { [index]: [versions[index][0], versions[index][1].replace('same WebP bytes', 'different pixels')] },
    { [gallery]: [versions[gallery][0], versions[gallery][1].replace(factoryPhoto, 'images/unrelated.jpg')] },
  ]) assert.equal(plan([], edits).scope, 'unmapped');
  assert.equal(plan(['style.css']).scope, 'unmapped');
  assert.equal(plan([], {}, files.filter(c => c.status !== 'D')).scope, 'unmapped');
});

test('photo alias dedup checks every consuming generator and the affected translated route', () => {
  const plan = chooseReleaseScope([
    ...['scripts/shared/responsive-photos.mjs', 'scripts/generate-gallery-thumbnails.mjs',
      'images/thumbs/display/index.json', 'data/spot-pages/fuji-paper-mills.en.js',
      'fr/spots/fuji-paper-mills.html', 'content-manifest.json', 'scripts/release-scope.mjs',
      '.github/workflows/quality-gate.yml'].map(change),
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

test('fifth story extension covers its route consumers and rejects unrelated editorial changes', () => {
  const files=['data/story-window/en/shinkalion.html','data/story-window/en/ui.json','en/stories/shinkalion.html','locales.js','story-window.css','images/story-window/20260712_n700a_michikusa.jpg','sitemap.xml'];
  const plan=chooseReleaseScope(files.map(change));
  assert.equal(plan.scope,'story-extension');
  assert.equal(plan.pagesCandidate,true);
  assert.equal(chooseReleaseScope(['data/story-window/de/ui.json','de/stories/index.html','de/stories/shinkalion.html','content-manifest.json'].map(change)).scope,'story-extension');
  assert.equal(plan.commands.find(c=>c.includes('scripts/validate-site-navigation.mjs')).filter(x=>x==='--route').length,7);
  assert(plan.commands.find(c=>c.includes('scripts/validate-site-navigation.mjs')).includes('zukan.html'));
  assert(!plan.commands.some(c=>c.includes('scripts/generate-site-chrome.mjs')));
  for(const extra of ['data.js','data/story-window/en/godzilla.html','style.css','images/unrelated.jpg'])
    assert.notEqual(chooseReleaseScope([...files,extra].map(change)).scope,'story-extension');
  assert.notEqual(chooseReleaseScope([...files,'foods.html'].map(change)).scope,'story-extension');
  assert.equal(chooseReleaseScope([...files,'foods.html'].map(change),{versionOnly:()=>true}).scope,'story-extension');
  assert.notEqual(chooseReleaseScope([{path:files[0],status:'D'}]).scope,'story-extension');
});


test('artwork sitemap scope is restricted to the exact migration and known outputs', () => {
  const files = ['scripts/generate-spot-pages.mjs', 'scripts/artwork-layout.test.mjs', 'sitemap.xml', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs'];
  assert.equal(chooseReleaseScope(files.map(change), {artworkSitemapOnly:true}).scope, 'artwork-sitemap');
  assert.equal(chooseReleaseScope(files.map(change)).scope, 'unmapped');
  assert.equal(chooseReleaseScope([...files, 'app.js'].map(change), {artworkSitemapOnly:true}).scope, 'unmapped');
  const before = '${siteRoot}/en/somato.html';
  const after = '${siteRoot}/en/artworks/somato/index.html';
  assert(onlyArtworkSitemapChanged(before, after));
  assert(!onlyArtworkSitemapChanged(before, after + 'unrelated'));
  assert(!onlyArtworkSitemapChanged(before, before));
});

test('new registered spots keep their full consumer checks when build scripts are extended',()=>{
  const changes=[change('data.js'),change('package.json'),{path:'data/spot-pages/tamaruya-wasabi-sign.ja.js',status:'A'}];
  const options={packageBefore:JSON.stringify({scripts:{'build:pages':'node scripts/generate-spot-pages.mjs'}}),packageAfter:JSON.stringify({scripts:{'build:pages':'node scripts/generate-kyoto-window-page.mjs && node scripts/generate-spot-pages.mjs'}})};
  assert.equal(chooseReleaseScope(changes,options).scope,'full');
  assert.equal(chooseReleaseScope([change('package.json')],options).scope,'unmapped');
});

test('AdSense ownership verification publishes only its root record and rejects unrelated changes', () => {
  const files = [{path:'ads.txt',status:'A'},change('scripts/release-scope.mjs'),change('scripts/release-scope.test.mjs')];
  const plan = chooseReleaseScope(files);
  assert.equal(plan.scope,'adsense-verification');
  assert.equal(plan.pagesCandidate,true);
  assert.equal(plan.needsDependencies,false);
  assert(plan.commands.some(command => command.includes('-e') && command.some(arg => arg.includes("readFileSync('ads.txt'"))));
  assert.equal(chooseReleaseScope([change('ads.txt')]).scope,'adsense-verification');
  for (const path of ['index.html','zukan.html','data.js','content-manifest.json','package.json'])
    assert.notEqual(chooseReleaseScope([...files,change(path)]).scope,'adsense-verification');
  assert.notEqual(chooseReleaseScope([{path:'ads.txt',status:'D'}]).scope,'adsense-verification');
  assert.equal(chooseReleaseScope([change('scripts/release-scope.mjs')]).scope,'release-infrastructure');
});

test('registered article-route spots retain all global consumer checks without a spot payload', () => {
  assert.equal(chooseReleaseScope([change('data.js'), {path:'images/stamps/stamp_kyoto-tower.svg',status:'A'}, {path:'kyoto-station-views.html',status:'M'}]).scope, 'full');
});

test('Kyoto layout and existing night-article additions use their bounded consumers',()=>{
 const files=['scripts/generate-kyoto-window-page.mjs','scripts/generate-yakei-page.mjs','scripts/shared/yakei-spots.mjs','scripts/locales/episode-fr.json','fr/utility-data.js','fr/yakei.html','kyoto-station-views.html','index.html','content-manifest.json'].map(change);
 const plan=chooseReleaseScope(files);
 assert.equal(plan.scope,'night-article-followup');
 assert.ok(plan.commands.some(c=>c.includes('scripts/yakei-locales.test.mjs')));
 assert.ok(plan.commands.some(c=>c.includes('scripts/validate-spot-counts.mjs')));
 assert.equal(chooseReleaseScope([...files,change('yakei.css')]).scope,'night-article-followup');
 assert.equal(chooseReleaseScope([...files,change('data.js')]).scope,'unmapped');
 assert.equal(chooseReleaseScope([...files,change('site-chrome.js')]).scope,'unmapped');
});

test('the night-list source and a count-only repair verify both Window Moments generators', () => {
  const page = 'fr/window-moments.html', source = 'scripts/shared/yakei-spots.mjs', payload = 'fr/utility-data.js';
  const script = 'scripts/generate-window-moments-page.mjs', translate = 'scripts/generate-utility-locales.mjs';
  const card = n => '<a class="wm-special-card" href="../fr/yakei.html"><img src="night.webp">' +
    '<span class="wm-special-copy"><small>NUIT · ' + n + ' vues nocturnes</small><h3>La nuit</h3></span></a>';
  const before = card(YAKEI_SPOT_COUNT - 1), after = card(YAKEI_SPOT_COUNT);
  const controls = ['content-manifest.json', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs'];
  const choose = (files, editions = [before, after]) => chooseReleaseScope(files.map(change),
    { fileContents: file => file === page ? editions : ['old-payload', 'new-payload'] });
  const simple = choose([page, ...controls]), fromSource = choose([source, page, ...controls]);
  assert.equal(simple.scope, 'window-moments-count');
  assert(simple.pagesCandidate && simple.needsDependencies);
  assert.equal(fromSource.scope, 'night-article-followup');
  const ads = ['scripts/shared/spot-ad-placements.mjs', 'scripts/spot-adsense.test.mjs', 'spots/kakegawa.html'];
  const combined = choose([page, ...controls, ...ads]);
  assert.equal(combined.scope, 'spot-adsense-pilot');
  assert.equal(combined.commands.filter(c => c.includes('--test') && c.includes(ads[1])).length, 1);
  assert.equal(combined.commands.filter(c => c[1] === 'scripts/validate-spot-page-shared.mjs').length, 1);
  assert.equal(choose([page, ...controls, ...ads], [before, after.replace('La nuit', 'Autre texte')]).scope, 'unmapped');
  for (const plan of [simple, fromSource, choose([source]), combined]) {
    assert.equal(plan.commands.filter(c => c[1] === script && c.includes('--check')).length, 1);
    assert.equal(plan.commands.filter(c => c[1] === translate && c.includes('window-moments.html') && c.includes('--check')).length, 1);
    assert(plan.commands.some(c => c.includes('scripts/check-content-manifest.mjs')));
  }
  const tags = ['old-payload', 'new-payload'].map(text => '<script src="../fr/utility-data.js?v=' +
    createHash('sha256').update(text).digest('hex').slice(0, 8) + '"></script>');
  assert.equal(choose([source, page, payload], [before + tags[0], after + tags[1]]).scope, 'night-article-followup');
  assert.equal(choose([source, page, payload], [before + tags[0], after + tags[1].replace(/\?v=[a-f0-9]{8}/, '?v=deadbeef')]).scope, 'unmapped');
  for (const edits of [[before, card(YAKEI_SPOT_COUNT + 1)], [before, after.replace('La nuit', 'Autre texte')],
    [before + before, after + after], [before.replace('yakei', 'hanabi'), after.replace('yakei', 'hanabi')], [before + tags[0], after + tags[1]]])
    assert.equal(choose([page, ...controls], edits).scope, 'unmapped');
  assert.equal(choose([page, 'data.js']).scope, 'unmapped');
  assert.equal(choose([source, page, 'style.css']).scope, 'unmapped');
  assert(!choose(['scripts/generate-yakei-page.mjs']).commands.some(c => c[1] === script));
});

test('rivers feature editions select localized routing, manifest and page checks only', () => {
  const files = ['scripts/generate-rivers-page.mjs','data/rivers/ja.json','data/rivers/en.json',
    'rivers.html','en/rivers.html','fr/rivers.html','zh-Hant/rivers.html','de/rivers.html','es/rivers.html',
    'zh-Hans/rivers.html','ko/rivers.html','it/rivers.html','th/rivers.html','rivers.css','rivers.js',
    'images/rivers/river-01.jpg','locales.js','language-router.js','scripts/validate-language-pages.mjs',
    'scripts/locales-contract.test.mjs','scripts/generate-spot-pages.mjs','scripts/generate-content-manifest.mjs',
    'scripts/generate-language-mirrors.mjs','scripts/generate-utility-locales.mjs','scripts/templates/site-source/zukan.html.tpl',
    'scripts/locales/utility-fr.json','fr/utility-data.js','zukan.html','en/zukan.html','fr/zukan.html','index.html',
    'scripts/content-metadata.json','content-manifest.json','sitemap.xml','package.json',
    'scripts/release-scope.mjs','scripts/release-scope.test.mjs'];
  const after = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const before = structuredClone(after);
  before.scripts['build:pages'] = before.scripts['build:pages'].replace(' && node scripts/generate-rivers-page.mjs', '');
  before.scripts['preflight:spots'] = before.scripts['preflight:spots'].replace(' && node scripts/generate-rivers-page.mjs --check', '');
  const packageOptions = {packageBefore: JSON.stringify(before), packageAfter: JSON.stringify(after), assetVersionOnly: file => file === 'index.html'};
  const plan = chooseReleaseScope(files.map(change), packageOptions);
  assert.equal(plan.scope, 'rivers-feature');
  assert.equal(plan.needsDependencies, true);
  assert.equal(plan.pagesCandidate, true);
  assert(plan.commands.some(command => command.includes('scripts/generate-rivers-page.mjs') && command.includes('--check')));
  assert(plan.commands.some(command => command.includes('scripts/validate-language-pages.mjs')));
  assert(plan.commands.some(command => command.includes('scripts/generate-utility-locales.mjs') && command.includes('zukan.html')));
  assert(plan.commands.some(command => command.includes('scripts/validate-site-navigation.mjs') && command.includes('zukan.html')));
  assert(plan.commands.some(command => command.includes('scripts/sync-asset-versions.mjs')));
  assert(plan.commands.some(command => command.includes('scripts/check-content-manifest.mjs')));
  assert(!plan.commands.some(command => command.includes('verify') || command.includes('build:full')));
  assert.notEqual(chooseReleaseScope([...files.map(change), change('app.js')], packageOptions).scope, 'rivers-feature');
  assert.notEqual(chooseReleaseScope([...files.map(change), {path:'th/rivers.html',status:'D'}], packageOptions).scope, 'rivers-feature');
  assert.notEqual(chooseReleaseScope([...files.map(change), change('app.js')], {packageBefore: packageOptions.packageBefore, packageAfter: packageOptions.packageAfter}).scope, 'rivers-feature');
});
