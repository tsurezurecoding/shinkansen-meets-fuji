import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import vm from 'node:vm';
import { YAKEI_SPOT_COUNT } from './shared/yakei-spots.mjs';
import { SPOT_AD_PLACEMENTS } from './shared/spot-ad-placements.mjs';
import { articleRegistryPath, articleReleaseHelper, editions, onlyArticleAssetReferencesChanged, onlyArticleRegistrationChanged, selectEditorialRelease } from './shared/editorial-release.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shaPattern = /^[0-9a-f]{40}$/;
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const pagesDefinition = new Set(['scripts/pages-package.mjs', 'scripts/pages-layout.json']);
const pagesTest = 'scripts/pages-package.test.mjs';
const pagesPackaging = new Set([...pagesDefinition, pagesTest]);
const infra = new Set([
  '.github/workflows/quality-gate.yml', '.github/workflows/deploy-pages.yml',
  'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs',
  'scripts/release-artifact.mjs', 'scripts/release-artifact.test.mjs',
  articleRegistryPath, articleReleaseHelper, ...pagesPackaging,
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
const shortHash = text => createHash('sha256').update(text).digest('hex').slice(0, 8);
const rideIds = ['tokyo-tower', 'odawara-castle', 'hinataoka', 'solar-ark', 'kakegawa', 'odawara'];
const rideRelatedIds = [...rideIds, 'nagoya-station-skyline', 'kirin-beer-factory', 'kiyosu', 'kinshozan', 'sekigahara-battlefield'];
const ridePhotoStems = ['tokyo-tower_night_76831', 'odawara-castle_night_105629', 'hinataoka_night_2594',
  'solar-ark_dismantling_9859', 'solar-ark_dismantling_10810', 'kakegawa_dusk_42814', 'atami_night_11757']
  .map(stem => `20261103_${stem}_michikusa`);
const dayRideIds = ['hinataoka', 'shiraitogawa-bridge', 'shimizu-port-chikyu', 'left-fuji',
  'hamanako', 'kirin-beer-factory', 'kiyosu', 'solar-ark'];
const dayRidePhotoStems = ['hinataoka-fuji_217918', 'shiraitogawa-bridge_1528', 'chikyu_2079', 'left-fuji_43661',
  'hamanako-fuji_67049', 'kirin-beer-factory_6901', 'kiyosu-castle_5194', 'solar-ark_dismantling_4129']
  .map(stem => `20261107_${stem}_michikusa`);
export function onlyAssetVersionReferencesChanged(before, after) {
  const clean = value => value.replace(/\?v=[a-f0-9]{8}(?=["'&<\s])/g, '?v=VERSION');
  return before !== after && clean(before) === clean(after);
}
export function onlyCatalogManifestVersionChanged(before, after) {
  const normalize = text => {
    const value = JSON.parse(text);
    function visit(object) {
      if (!object || typeof object !== 'object') return;
      for (const key of Object.keys(object)) {
        if (key === 'spot-page-shared-data.js' && /^[a-f0-9]{8}(?:[a-f0-9]{56})?$/.test(object[key])) object[key] = 'CATALOG_VERSION';
        else visit(object[key]);
      }
    }
    visit(value);return value;
  };
  try { return before !== after && isDeepStrictEqual(normalize(before), normalize(after)); } catch { return false; }
}
export function onlyRideBudgetChanged(before, after) {
  return before !== after && after.includes('RUNTIME_DATA_BYTE_BUDGET = 355 * 1024') && after.replace('// November 7: seven approved ride photographs and two reference videos; projection unchanged.\n', '')
    .replace('RUNTIME_DATA_BYTE_BUDGET = 355 * 1024', 'RUNTIME_DATA_BYTE_BUDGET = 350 * 1024') === before;
}
export function onlyRideMediaDataChanged(before, after, dayRide = false) {
  const ids = dayRide ? dayRideIds : rideIds;
  const stems = dayRide ? dayRidePhotoStems : ridePhotoStems;
  const date = dayRide ? '2026-11-07' : '2026-11-03';
  const videoIds = dayRide ? ['DQqRHjNkQPI', 'ulwkEPLSBx0'] : ['ixWDozxgh_w', 'Kho1OEWqgvc'];
  function source(code) {
    const context = {};
    vm.runInNewContext(code + ';this.result = { SPOTS, ROUTE, BOARD_COLLECTION, WHEEL_COLLECTION };', context, { timeout: 5000 });
    return JSON.parse(JSON.stringify(context.result));
  }
  try {
    const previous = source(before), next = source(after);
    for (const field of ['ROUTE', 'BOARD_COLLECTION', 'WHEEL_COLLECTION']) if (!isDeepStrictEqual(previous[field], next[field])) return false;
    if (!isDeepStrictEqual(previous.SPOTS.map(s => s.id), next.SPOTS.map(s => s.id))) return false;
    for (let i = 0; i < previous.SPOTS.length; i++) {
      const a = previous.SPOTS[i], b = next.SPOTS[i];
      if (!ids.includes(a.id)) { if (!isDeepStrictEqual(a, b)) return false; continue; }
      const baselinePhotos = [a.image, ...(a.photos || []).map(p => p.src)];
      const finalPhotos = [b.image, ...(b.photos || []).map(p => p.src)];
      if (baselinePhotos.some(src => !finalPhotos.includes(src))) return false;
      if (finalPhotos.some(src => !baselinePhotos.includes(src) && !stems.some(stem => src === `images/${stem}.jpg`))) return false;
      if ((a.photos || []).some(p => !(b.photos || []).some(q => isDeepStrictEqual(p, q)))) return false;
      for (const p of b.photos || []) if (!baselinePhotos.includes(p.src) && (p.credit?.ja !== 'michikusa' || p.credit?.en !== 'michikusa' || p.date !== date)) return false;
      const oldVideos = a.media?.videos || [], newVideos = b.media?.videos || [];
      if (oldVideos.some(p => !newVideos.some(q => isDeepStrictEqual(p, q)))) return false;
      if (newVideos.some(p => !oldVideos.some(q => isDeepStrictEqual(p, q)) && !videoIds.includes(p.id))) return false;
      const fields = ['photos'];
      if (dayRide) {
        if (a.id === 'solar-ark') fields.push('media', 'pageTitle', 'metaDescription', 'explainer', 'explainerFigure');
        if (a.id === 'shiraitogawa-bridge') fields.push('media');
      } else {
        if (a.id === 'solar-ark') fields.push('media', 'pageTitle', 'pageHeading', 'pageHeadingChunks', 'metaDescription', 'pageStory', 'explainer', 'guideHighlight', 'image', 'photoCredit', 'explainerFigure');
        if (a.id === 'hinataoka') fields.push('media');
        if (a.id === 'odawara') fields.push('explainer');
      }
      for (const field of fields) { delete a[field]; delete b[field]; }
      if (!dayRide && a.id === 'solar-ark') for (const lang of ['ja', 'en']) for (const field of ['hook', 'story']) { delete a[lang][field]; delete b[lang][field]; }
      if (!isDeepStrictEqual(a, b)) return false;
    }
    return true;
  } catch { return false; }
}

export function onlyMikawaPhotoBatchDataChanged(before, after) {
  try {
    const source = code => { const context = {}; vm.runInNewContext(code + ';this.result={SPOTS,ROUTE,BOARD_COLLECTION,WHEEL_COLLECTION}', context, {timeout:5000}); return JSON.parse(JSON.stringify(context.result)); };
    const a=source(before), b=source(after);
    for (const key of ['ROUTE','BOARD_COLLECTION','WHEEL_COLLECTION']) if (!isDeepStrictEqual(a[key],b[key])) return false;
    if (!isDeepStrictEqual(a.SPOTS.map(s=>s.id), b.SPOTS.map(s=>s.id))) return false;
    const targets = {
      'mikawa-oshima': ['photos','pageTitle','pageHeading','pageHeadingChunks','metaDescription','sectionHeading','pageStory','explainer','references'],
      'kaguya-no-akari': ['photos','media'],
      'hikone-castle': ['photos'],
    };
    const images = new Set(['images/20261103_gamagori-takeshima_0_michikusa.jpg','images/20261103_mikawa-oshima_sunset_28750_michikusa.jpg','images/20261108_kaguya-no-akari_night_2305_michikusa.jpg','images/20261108_hikone-castle_night_59142_michikusa.jpg']);
    const seen = new Set();
    for (let i=0;i<a.SPOTS.length;i++) {
      const old=a.SPOTS[i], next=b.SPOTS[i], fields=targets[old.id];
      if (!fields) { if (!isDeepStrictEqual(old,next)) return false; continue; }
      for (const photo of old.photos || []) if (!(next.photos || []).some(p=>isDeepStrictEqual(p,photo))) return false;
      for (const photo of next.photos || []) if (!(old.photos || []).some(p=>isDeepStrictEqual(p,photo))) {
        if (!images.has(photo.src) || photo.credit?.ja !== 'michikusa' || photo.credit?.en !== 'michikusa') return false;
        seen.add(photo.src);
      }
      if (old.id === 'kaguya-no-akari') {
        const previous=old.media?.videos || [], videos=next.media?.videos || [];
        const added=videos.filter(v=>!previous.some(p=>isDeepStrictEqual(p,v)));
        if (previous.some(v=>!videos.some(n=>isDeepStrictEqual(v,n))) || added.length !== 1 || added[0].id !== 'MeY8wdwrs68') return false;
      }
      for (const field of fields) { delete old[field]; delete next[field]; }
      if (!isDeepStrictEqual(old,next)) return false;
    }
    return seen.size === images.size;
  } catch { return false; }
}
const validationFiles = new Set(['scripts/shared/site-runtime-validation.mjs',
  'scripts/shared/site-runtime-validation.test.mjs', 'scripts/validate-site-navigation.mjs', 'scripts/validate-site-navigation.test.mjs']);
const storyRoutes = ['index', 'godzilla', 'shogun', 'yurucamp', 'dragonball', 'shinkalion'].map(slug => `stories/${slug}.html`);
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

export function onlyArtworkSitemapChanged(before, after) {
  const migrated = before.replace(/(\$\{siteRoot\}\/(?:en\/)?)(somato|sumie|window-film|window-trip)\.html/g, '$1artworks/$2/index.html')
    .replace("sitemapXML().replace(/\\/(somato|sumie|window-trip|window-film)\\.html/g,'/artworks/$1/index.html')", 'sitemapXML()');
  return before !== after && migrated === after;
}

const registrationGuard = (id, file) => (before, after) => onlyArticleRegistrationChanged(id, file, before, after);
export const onlyDonburiSitemapChanged = registrationGuard('donburi', 'scripts/generate-spot-pages.mjs');
export const onlyDonburiLocaleRouteChanged = registrationGuard('donburi', 'locales.js');
export const onlyDonburiLanguageRouteChanged = registrationGuard('donburi', 'language-router.js');

export function onlyDonburiEverydayLayoutChanged(before, after) {
  const oldRule = '.taste-grid{grid-template-columns:repeat(3,minmax(0,1fr))}';
  const newRule = '.taste-grid{grid-template-columns:repeat(2,minmax(0,1fr))}';
  return before !== after && before.split(oldRule).length === 2 && before.replace(oldRule, newRule) === after;
}

export const onlyDonburiAssetReferencesChanged = onlyArticleAssetReferencesChanged;
export const onlyRamenSitemapChanged = registrationGuard('ramen', 'scripts/generate-spot-pages.mjs');
export const onlyRamenLocaleRouteChanged = registrationGuard('ramen', 'locales.js');
export const onlyRamenLanguageRouteChanged = registrationGuard('ramen', 'language-router.js');
export const onlyRamenMetadataAdded = registrationGuard('ramen', 'scripts/content-metadata.json');
export const onlyRamenAssetReferencesChanged = onlyArticleAssetReferencesChanged;

export function onlyRamenEnglishCardAddedToJapaneseDonburi(file, before, after) {
  if (file !== 'donburi.html') return false;
  const card = /<a class="everyday-story-card" href="en\/ramen\.html" data-edition-only="en" data-cta-track="everyday_related_click" data-cta-id="ramen" lang="en"><span class="everyday-story-photo"><img src="images\/ramen\/jiro\.webp" alt="" width="1440" height="810" loading="lazy" decoding="async"><\/span><span class="everyday-story-copy"><small>[^<]*<\/small><strong>[^<]*<\/strong><span>[^<]*<\/span><b>[^<]* <span aria-hidden="true">→<\/span><\/b><\/span><\/a>/g;
  const matches = [...after.matchAll(card)];
  if (matches.length !== 1 || before.includes('data-cta-id="ramen"')) return false;
  const navStart = after.indexOf('<nav class="everyday-related-grid"');
  const navEnd = after.indexOf('</nav>', navStart);
  if (navStart < 0 || matches[0].index < navStart || matches[0].index + matches[0][0].length > navEnd) return false;
  const restored = after.replace(matches[0][0], '');
  return restored === before || onlyRamenAssetReferencesChanged(before, restored);
}

const factoryMetadataPhotos = new Set([
  'images/20260919_lotte-shiga_4190_michikusa.jpg',
  'images/20260919_pola-fukuroi_139551_michikusa.jpg',
  'images/20260924_fuji-paper-mills_75983_michikusa.jpg',
  'images/20260924_fuji-ucc_171517_michikusa.jpg',
  'images/20260924_sapporo-shizuoka-factory_34042_michikusa.jpg',
  'images/20260930_fujitec-big-wing_michikusa.jpg',
  'images/20261010_pocari-fukuroi_80185_michikusa.jpg',
  'images/20261107_kirin-beer-factory_6901_michikusa.jpg',
  'images/20261114_yamazaki-distillery_3654_michikusa.jpg',
  'images/20261115_fuji-paper-mills_kouen_67349_michikusa.jpg',
]);

export function onlyFactoryJpegMetadataRemoved(file, before, after) {
  if (!factoryMetadataPhotos.has(file) || !Buffer.isBuffer(before) || !Buffer.isBuffer(after)
      || before.length < 4 || before[0] !== 0xff || before[1] !== 0xd8) return false;
  const kept = [before.subarray(0, 2)];
  let position = 2, removed = 0;
  while (position + 4 <= before.length) {
    if (before[position] !== 0xff) return false;
    const marker = before[position + 1], length = before.readUInt16BE(position + 2);
    if (length < 2 || position + 2 + length > before.length) return false;
    if (marker === 0xda) {
      // Preserve every scan byte, colour profile and non-EXIF segment exactly.
      kept.push(before.subarray(position));
      return removed > 0 && Buffer.concat(kept).equals(after);
    }
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x00 || marker === 0xff) return false;
    const end = position + 2 + length;
    if (marker === 0xe1 && length >= 8
        && before.subarray(position + 4, position + 10).equals(Buffer.from('Exif\0\0'))) removed += 1;
    else kept.push(before.subarray(position, end));
    position = end;
  }
  return false;
}

function onlyRiversPackageChange(beforeValue, afterValue) {
  if (!beforeValue || !afterValue) return false;
  try {
    const before = typeof beforeValue === 'string' ? JSON.parse(beforeValue) : structuredClone(beforeValue);
    const after = typeof afterValue === 'string' ? JSON.parse(afterValue) : structuredClone(afterValue);
    if (!before.scripts || !after.scripts) return false;
    const expected = structuredClone(before);
    expected.scripts['build:pages'] = expected.scripts['build:pages'].replace(
      'node scripts/generate-spot-pages.mjs --defer-manifest',
      'node scripts/generate-rivers-page.mjs && node scripts/generate-spot-pages.mjs --defer-manifest'
    );
    expected.scripts['preflight:spots'] += ' && node scripts/generate-rivers-page.mjs --check';
    return isDeepStrictEqual(expected, after);
  } catch { return false; }
}

export function onlyFactoryRegistrationChanged(file, before, after) {
  if (before === after) return false;
  if (file === 'scripts/content-metadata.json') {
    try {
      const previous = JSON.parse(before), next = JSON.parse(after);
      const routes = new Set(['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko', 'it', 'th']
        .map(lang => (lang === 'ja' ? '' : lang + '/') + 'factories.html'));
      const changed = [...new Set([...Object.keys(previous), ...Object.keys(next)])]
        .filter(route => !isDeepStrictEqual(previous[route], next[route]));
      return changed.length > 0 && changed.every(route => routes.has(route) && !Object.hasOwn(previous, route)
        && next[route] && typeof next[route] === 'object' && !Array.isArray(next[route]));
    } catch { return false; }
  }
  if (file === 'locales.js') return before.replace(
    "['guide.html', 'omamori.html', 'donburi.html', 'ramen.html']",
    "['guide.html', 'omamori.html', 'donburi.html', 'ramen.html', 'factories.html']") === after;
  if (file === 'language-router.js') {
    const addition = '    "/factories.html": "en/factories.html",\n';
    return after.split(addition).length === 2 && after.replace(addition, '') === before;
  }
  if (file === 'scripts/generate-spot-pages.mjs') {
    const addition = "    ...languages.map(lang=>({loc:`${siteRoot}/${lang==='ja'?'':lang+'/'}factories.html`,priority:'0.7',changefreq:'monthly',lastmod:'2026-11-18'})),\n";
    return after.split(addition).length === 2 && after.replace(addition, '')
      .replace('"castles", "guide", "factories", "zukan"', '"castles", "guide", "zukan"') === before;
  }
  return false;
}

function selectExistingScope(changes, options = {}) {
  const { versionOnly = () => false, assetVersionOnly = () => false, factoryRegistrationOnly = () => false,
    factoryAssetVersionOnly = () => false, factoryPhotoMetadataOnly = () => false, catalogManifestOnly = () => false,
    rideDataOnly = false, dayRideDataOnly = false, mikawaPhotoBatchDataOnly = false, rideBudgetOnly = false,
    addedLocaleKeysOnly = () => false, marukoLinkOnly = () => false, menuReferenceOnly = () => false,
    chromeExtractionOnly = () => false, artworkSitemapOnly = false, packageBefore, packageAfter } = options;
  const files = changes.map(change => change.path);
  const syntax = files.filter(file => /\.(?:mjs|cjs|js)$/.test(file)).map(file => node('--check', file));
  const spotAdRoutes = Object.keys(SPOT_AD_PLACEMENTS).filter(key => key.startsWith('ja/')).map(key => 'spots/' + key.slice(3) + '.html');
  const changedSpotAdRoutes = spotAdRoutes.filter(route => files.includes(route));
  const spotAdsenseFiles = new Set(['spot-adsense.js', ...spotAdRoutes, 'privacy.html', 'en/privacy.html',
    'scripts/shared/spot-ad-placements.mjs', 'scripts/spot-adsense.test.mjs', 'scripts/generate-spot-pages.mjs',
    'scripts/generate-content-manifest.mjs', 'content-manifest.json', 'package.json',
    'scripts/templates/site-source/privacy.html.tpl', 'scripts/templates/site-source/en/privacy.html.tpl',
    'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs']);
  let spotAdsensePackage = !files.includes('package.json');
  if (!spotAdsensePackage && packageBefore && packageAfter) {
    const before = typeof packageBefore === 'string' ? JSON.parse(packageBefore) : structuredClone(packageBefore);
    const after = typeof packageAfter === 'string' ? JSON.parse(packageAfter) : structuredClone(packageAfter);
    const command = before.scripts?.['test:generator'];
    if (command?.startsWith('node --test ') &&
        after.scripts?.['test:generator'] === command.replace('node --test ', 'node --test scripts/spot-adsense.test.mjs ')) {
      after.scripts['test:generator'] = command;
      spotAdsensePackage = isDeepStrictEqual(before, after);
    }
  }
  if (changedSpotAdRoutes.length && files.includes('scripts/spot-adsense.test.mjs') &&
      ['spot-adsense.js', 'scripts/shared/spot-ad-placements.mjs'].some(file => files.includes(file)) &&
      spotAdsensePackage && changes.every(change => ['A', 'M'].includes(change.status) && spotAdsenseFiles.has(change.path))) return {
    scope: 'spot-adsense-pilot', needsDependencies: true, pagesCandidate: true,
    reason: 'Check the configured Japanese spot placements, their generated articles, the shared loader and distribution inventory.',
    commands: [...syntax, node('--test', 'scripts/spot-adsense.test.mjs', 'scripts/generate-spot-pages.test.mjs', 'scripts/release-scope.test.mjs'),
      node('scripts/check-content-manifest.mjs'), node('scripts/validate-site-navigation.mjs', ...changedSpotAdRoutes.flatMap(route => ['--route', route]), '--route', 'privacy.html')],
  };
  const zukanAdsenseFiles = new Set(['zukan.html','privacy.html','scripts/templates/site-source/zukan.html.tpl','scripts/templates/site-source/privacy.html.tpl','scripts/generate-language-mirrors.mjs','scripts/release-scope.mjs','scripts/zukan-adsense.test.mjs']);
  if (files.includes('scripts/zukan-adsense.test.mjs') && files.includes('zukan.html') && changes.every(c => ['A','M'].includes(c.status) && zukanAdsenseFiles.has(c.path))) return {
    scope: 'zukan-adsense', needsDependencies: true, pagesCandidate: true,
    reason: 'One Japanese catalogue ad, mirror exclusion and privacy disclosure; shared chrome and other languages are unchanged.',
    commands: [...syntax, node('--test','scripts/zukan-adsense.test.mjs','scripts/release-scope.test.mjs'), node('scripts/check-content-manifest.mjs')],
  };
  const adsenseVerificationFiles = new Set(['ads.txt', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs']);
  if (files.includes('ads.txt') && changes.every(change => ['A', 'M'].includes(change.status) && adsenseVerificationFiles.has(change.path))) return {
    scope: 'adsense-verification', needsDependencies: false, pagesCandidate: true,
    reason: 'Publish the root ownership record only; no HTML, browser runtime, offline inventory or language consumers change',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs'), node('--input-type=module', '-e', "import fs from 'node:fs'; import assert from 'node:assert/strict'; assert.equal(fs.readFileSync('ads.txt','utf8'), 'google.com, pub-5756673901202661, DIRECT, f08c47fec0942fa0\\n');")],
  };

  const inviteVisibilityFiles = new Set(['scripts/shared/android-app-invite.css','scripts/android-app-invite.test.mjs',
    'scripts/release-scope.mjs','scripts/release-scope.test.mjs','android-app-invite.js','site-runtime.json','content-manifest.json']);
  if (files.includes('scripts/shared/android-app-invite.css') && files.includes('scripts/android-app-invite.test.mjs') &&
      changes.every(change=>change.status==='M' && inviteVisibilityFiles.has(change.path))) return {
    scope:'android-invite-visibility',needsDependencies:true,pagesCandidate:true,
    reason:'Store-badge visibility follows the floating panel; shared CSS, regression tests and runtime/distribution hashes only',
    commands:[...syntax,node('--test','scripts/android-app-invite.test.mjs','scripts/android-app-invite-assets.test.mjs',
      'scripts/android-app-invite-reset.test.mjs','scripts/android-app-train-invite.test.mjs','scripts/release-scope.test.mjs'),
      node('scripts/generate-android-app-invite-assets.mjs','--check'),node('scripts/generate-site-runtime.mjs','--check'),
      node('scripts/check-content-manifest.mjs')]
  };
  const trainInviteFiles = new Set(['scripts/shared/android-app-invite-runtime.js','scripts/shared/android-app-invite-copy.mjs',
    'scripts/shared/android-app-invite.css','scripts/shared/android-app-invite.mjs','scripts/generate-android-app-invite-assets.mjs',
    'scripts/generate-android-app-invites.mjs','scripts/android-app-train-invite.test.mjs','scripts/release-scope.mjs',
    'scripts/release-scope.test.mjs','package.json','android-app-invite.js','it/start.html','th/start.html','site-runtime.json','content-manifest.json']);
  let trainInvitePackage = !files.includes('package.json');
  if (!trainInvitePackage && packageBefore && packageAfter) {
    const before=JSON.parse(packageBefore),after=JSON.parse(packageAfter),command=before.scripts?.['test:android-invite'];
    if (command && after.scripts?.['test:android-invite']===command+' scripts/android-app-train-invite.test.mjs') {
      after.scripts['test:android-invite']=command;trainInvitePackage=isDeepStrictEqual(before,after);
    }
  }
  if (files.includes('scripts/shared/android-app-invite-runtime.js') && files.includes('scripts/android-app-train-invite.test.mjs') && trainInvitePackage &&
      changes.every(change=>change.status!=='D' && trainInviteFiles.has(change.path))) return {
    scope:'android-train-invite',needsDependencies:true,pagesCandidate:true,
    reason:'Train-result inline invitation in ten editions, shared installation/consent policy, retained floating behavior elsewhere, and Italian/Thai page configuration only',
    commands:[...syntax,node('--test','scripts/android-app-invite.test.mjs','scripts/android-app-invite-reset.test.mjs',
      'scripts/android-app-invite-assets.test.mjs','scripts/android-app-train-invite.test.mjs','scripts/release-scope.test.mjs',
      'scripts/site-runtime-loader.test.mjs','scripts/generate-site-runtime.test.mjs','scripts/starter-locales.test.mjs'),
      node('scripts/generate-android-app-invite-assets.mjs','--check'),node('scripts/generate-android-app-invites.mjs','--check'),
      node('scripts/generate-utility-locales.mjs','--route','start.html','--check'),node('scripts/generate-site-runtime.mjs','--check'),
      node('scripts/validate-train-select.mjs'),node('scripts/validate-site-navigation.mjs','--route','start.html'),
      node('scripts/check-content-manifest.mjs')]
  };
  const factoryFiles = new Set(['scripts/generate-factories-page.mjs', 'scripts/factories-page.test.mjs', 'scripts/factory-windows.json',
    'scripts/shared/factory-windows-links.mjs', 'scripts/shared/story-window.mjs',
    'factories.html', 'factories.css', 'factories.js', 'zukan.html', 'scripts/locales-contract.test.mjs', 'scripts/generate-spot-pages.test.mjs',
    'scripts/templates/site-source/zukan.html.tpl', 'scripts/generate-content-manifest.mjs',
    'scripts/generate-spot-pages.mjs', 'scripts/validate-language-pages.mjs',
    'scripts/content-metadata.json', 'locales.js', 'language-router.js', 'package.json',
    'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs',
    'site-runtime.json', 'spot-page-runtime.json', 'content-manifest.json', 'sitemap.xml']);
  for (const lang of ['ja', 'en', 'zh-Hant', 'fr', 'de', 'es', 'zh-Hans', 'ko', 'it', 'th']) {
    factoryFiles.add(`scripts/locales/factory-windows/${lang}.json`);
    factoryFiles.add(`shared-ui/${lang.toLowerCase()}.shell.js`);
    for (const route of ['factories', 'zukan']) {
      factoryFiles.add(`shared-ui/${lang.toLowerCase()}.rail-${route}.js`);
      if (lang !== 'ja') factoryFiles.add(`${lang}/${route}.html`);
    }
  }
  let factoryPackage = !files.includes('package.json');
  if (!factoryPackage && packageBefore && packageAfter) {
    const before = typeof packageBefore === 'string' ? JSON.parse(packageBefore) : structuredClone(packageBefore);
    const after = typeof packageAfter === 'string' ? JSON.parse(packageAfter) : structuredClone(packageAfter);
    for (const key of ['build:pages', 'preflight:spots']) if (after.scripts?.[key])
      after.scripts[key] = after.scripts[key].replace(/node scripts\/generate-factories-page\.mjs(?: --check)? && /, '');
    const previousTests = before.scripts?.['test:generator'], nextTests = after.scripts?.['test:generator'];
    const testFile = 'scripts/factories-page.test.mjs';
    if (typeof previousTests === 'string' && typeof nextTests === 'string' && !previousTests.includes(testFile)
        && nextTests.split(testFile).length === 2 && nextTests.replace(' ' + testFile, '') === previousTests)
      after.scripts['test:generator'] = previousTests;
    factoryPackage = isDeepStrictEqual(before, after);
  }
  const factoryRegistrations = ['scripts/generate-spot-pages.mjs', 'locales.js', 'language-router.js', 'scripts/content-metadata.json'];
  if (files.includes('scripts/generate-factories-page.mjs') && factoryPackage &&
      factoryRegistrations.every(file => !files.includes(file) || factoryRegistrationOnly(file)) &&
      changes.every(({path: file, status}) => ['A', 'M'].includes(status) && (factoryFiles.has(file) ||
        /^images\/factories\/[^/]+\.webp$/.test(file) ||
        status === 'M' && factoryMetadataPhotos.has(file) && factoryPhotoMetadataOnly(file) ||
        status === 'M' && file.endsWith('.html') && factoryAssetVersionOnly(file)))) return {
    scope: 'factory-windows', needsDependencies: true, pagesCandidate: true,
    reason: 'Factory guide in ten editions, catalogue cards, scoped route and sitemap additions, photographs and Web distribution. Other HTML may change only the locale/router asset versions.',
    commands: [...syntax,
      node('--test', 'scripts/release-scope.test.mjs', 'scripts/locales-contract.test.mjs', 'scripts/generate-spot-pages.test.mjs', 'scripts/factories-page.test.mjs'),
      node('scripts/generate-factories-page.mjs', '--check'),
      node('scripts/generate-utility-locales.mjs', '--route', 'zukan.html', '--check'),
      node('scripts/generate-site-chrome.mjs', '--check'), node('scripts/generate-site-runtime.mjs', '--check'),
      node('--input-type=module', '-e', "import fs from 'node:fs'; import assert from 'node:assert/strict'; import {sitemapXML} from './scripts/generate-spot-pages.mjs'; assert.equal(fs.readFileSync('sitemap.xml','utf8'),sitemapXML());"),
      node('scripts/validate-language-pages.mjs'),
      node('scripts/validate-site-navigation.mjs', '--route', 'factories.html', '--route', 'zukan.html'),
      node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs')]
  };
  const editorial = selectEditorialRelease(changes, options, syntax, (id, file) => {
    if (id === 'ramen' && file === 'donburi.html') return options.ramenJapaneseDonburiOnly ??
      (options.fileContents && onlyRamenEnglishCardAddedToJapaneseDonburi(file, ...options.fileContents(file)));
    if (id === 'donburi' && file === 'everyday.css') return options.donburiEverydayLayoutOnly ??
      (options.fileContents && onlyDonburiEverydayLayoutChanged(...options.fileContents(file)));
    return false;
  });
  if (editorial) return editorial;
  const omamoriFiles=new Set(['scripts/generate-omamori-page.mjs','scripts/omamori-page.test.mjs','scripts/shared/omamori-entry.mjs',
    'omamori.html','en/omamori.html','omamori.css','omamori.js','data/omamori/ja.json','data/omamori/en.json','data/omamori-photo-sources.json',
    'images/omamori/omamori-various.jpg','images/omamori/omamori-meiji.jpg',
    'scripts/generate-everyday-page.mjs','scripts/shared/everyday-related.mjs','scripts/shared/castle-localization.mjs',
    'scripts/generate-food-country-ja.mjs','scripts/generate-content-manifest.mjs','scripts/generate-spot-pages.mjs',
    'scripts/validate-language-pages.mjs','scripts/content-metadata.json','scripts/release-scope.mjs','scripts/release-scope.test.mjs','scripts/drinks-locales.test.mjs',
    'foods.html','countryside.html','en/foods.html','en/drinks.html','en/everyday-japan.html','language-router.js','spot-page-shared.js',
    'package.json','site-runtime.json','spot-page-runtime.json','content-manifest.json','sitemap.xml','shared-ui/ja.rail-countryside.js',
    'locales.js','scripts/generate-castle-locales.mjs','scripts/generate-drinks-locales.mjs','scripts/locales-contract.test.mjs','scripts/food-country-locales.test.mjs']);
  for(const lang of ['en','zh-Hant','fr','de','es','zh-Hans','ko','it','th']){
    omamoriFiles.add(`data/omamori/${lang}.json`);
    for(const route of ['omamori','foods','drinks','everyday-japan','jr-pass-fuji'])omamoriFiles.add(`${lang}/${route}.html`);
    omamoriFiles.add(`shared-ui/${lang.toLowerCase()}.shell.js`);
    omamoriFiles.add(`shared-ui/${lang.toLowerCase()}.rail-everyday-japan.js`);
    omamoriFiles.add(`shared-ui/${lang.toLowerCase()}.rail-foods.js`);
  }
  let omamoriPackage=!files.includes('package.json');
  if(!omamoriPackage&&packageBefore&&packageAfter){
    const before=typeof packageBefore==='string'?JSON.parse(packageBefore):structuredClone(packageBefore);
    const after=typeof packageAfter==='string'?JSON.parse(packageAfter):structuredClone(packageAfter);
    if(after.scripts){
      for(const key of ['build:pages','preflight:spots'])if(after.scripts[key])after.scripts[key]=after.scripts[key].replace(/node scripts\/generate-omamori-page\.mjs(?: --check)? && /,'');
      if(after.scripts['test:generator'])after.scripts['test:generator']=after.scripts['test:generator'].replace('scripts/omamori-page.test.mjs ','');
    }
    omamoriPackage=isDeepStrictEqual(before,after);
  }
  if(files.includes('scripts/generate-omamori-page.mjs')&&omamoriPackage&&changes.every(({path:file,status})=>status!=='D'&&(omamoriFiles.has(file)||file.endsWith('.html')&&assetVersionOnly(file))))return {
    scope:'omamori-everyday',needsDependencies:true,pagesCandidate:true,
    reason:'Omamori across ten existing languages, localized Everyday Japan/food/drink entry cards, Japanese reached only through language selection, shared chrome and Web distribution.',
    commands:[...syntax,node('--test','scripts/omamori-page.test.mjs','scripts/release-scope.test.mjs','scripts/locales-contract.test.mjs','scripts/food-country-locales.test.mjs','scripts/drinks-locales.test.mjs'),
      ...['generate-omamori-page','generate-foods-page','generate-drinks-page','generate-everyday-page','generate-food-country-ja','generate-drinks-locales','generate-site-chrome','generate-site-runtime'].map(name=>node(`scripts/${name}.mjs`,'--check')),
      node('scripts/generate-castle-locales.mjs','--route','foods.html','--check'),node('scripts/generate-castle-locales.mjs','--route','everyday-japan.html','--check'),
      node('scripts/validate-site-navigation.mjs','--route','omamori.html','--route','foods.html','--route','drinks.html','--route','everyday-japan.html','--route','jr-pass-fuji.html'),
      node('scripts/validate-language-pages.mjs'),node('scripts/sync-asset-versions.mjs','--check'),node('scripts/check-content-manifest.mjs')]
  };
  const editorialFiles=new Set(['scripts/generate-story-window-pages.mjs','scripts/shared/story-editorial.mjs','scripts/shared/story-editorial.test.mjs',
    'scripts/validate-story-window.mjs','scripts/generate-content-manifest.mjs','scripts/content-metadata.json','scripts/release-scope.mjs','scripts/release-scope.test.mjs',
    'story-window.js','story-window-editorial.css','content-manifest.json','site-runtime.json','spot-page-runtime.json','sitemap.xml']);
  const editorialPage=/^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?stories\/(?:index|godzilla|shogun|yurucamp|dragonball|shinkalion)\.html$/;
  const editorialInput=/^data\/story-window\/(?:ja|en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/(?:ui\.json|(?:godzilla|shogun|yurucamp|dragonball|shinkalion)\.html)$/;
  if(files.some(file=>file==='story-window-editorial.css'||file==='scripts/shared/story-editorial.mjs')&&changes.every(({path:file,status})=>status!=='D'&&
    (editorialFiles.has(file)||editorialPage.test(file)||editorialInput.test(file)||/^images\/story-window\/display\/[a-zA-Z0-9_-]+\.webp$/.test(file))))return {
      scope:'story-editorial',needsDependencies:true,pagesCandidate:true,
      reason:'Approved story design in ten editions: article bodies, source-media covers, photo navigation/cards, responsive image assets and search metadata; other product families are unchanged.',
      commands:[...syntax,node('--test','scripts/release-scope.test.mjs','scripts/shared/story-editorial.test.mjs','scripts/shared/story-routing.test.mjs'),
        node('scripts/generate-story-window-pages.mjs','--check'),node('scripts/validate-story-window.mjs','--pages-only'),storyNavigation(),
        node('scripts/sync-asset-versions.mjs','--check'),node('scripts/check-content-manifest.mjs')]
    };
  const seoSources = new Set([
    'scripts/generate-inbound-tables.mjs', 'scripts/generate-spot-pages.mjs',
    'scripts/generate-guide-locale-routes.mjs', 'scripts/generate-starter-locales.mjs',
    'scripts/generate-utility-locales.mjs', 'scripts/generate-drinks-locales.mjs',
    'scripts/generate-sparkling-locales.mjs', 'scripts/shared/mieru-copy.mjs',
    'scripts/shared/mieru-runtime.js', 'scripts/shared/utility-localization.mjs',
    'scripts/templates/mieru-ja.html.tpl', 'scripts/templates/window-trip.html.template',
    'scripts/validate-mieru.mjs', 'scripts/validate-train-select.mjs',
    'scripts/validate-utility-locales.mjs', 'data/story-window/ja/shogun.html',
    'data/sudoori/pages.json', 'mieru.js', 'site-runtime.json', 'content-manifest.json',
    'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs', 'scripts/starter-locales.test.mjs', 'scripts/sudoori.test.mjs',
  ]);
  const seoPage = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?(?:(?:index|start|guide|mieru|zukan|contact|journal|reflections|window-moments|sparkling-dreams|drinks|beer-on-shinkansen|jr-pass-fuji)\.html|live\/index\.html|stories\/(?:index|shogun|godzilla|dragonball|yurucamp|shinkalion)\.html)$/;
  const seoGenerated = file => seoPage.test(file)
    || ['artworks/window-trip/index.html', 'sudoori/index.html'].includes(file)
    || /^scripts\/locales\/expansion-(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\.json$/.test(file)
    || /^scripts\/templates\/site-source\/(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?(?:guide|en\/jr-pass-fuji)\.html\.tpl$/.test(file)
    || /^(?:shared-ui\/|scripts\/templates\/site-chrome\/)[a-z-]+\.[a-z0-9-]+\.(?:js|tpl)$/.test(file);
  if (files.includes('scripts/generate-inbound-tables.mjs') && changes.every(({ path: file, status }) =>
    status === 'M' && (seoSources.has(file) || seoGenerated(file)))) return {
    scope: 'seo-navigation-forecast', needsDependencies: true, pagesCandidate: true,
    reason: 'JR Pass forms and nine-language copy, shared hourly forecast context, existing article entries and canonical live navigation. Timetable data and visibility calculations are unchanged.',
    commands: [...syntax,
      node('--test', 'scripts/release-scope.test.mjs', 'scripts/locales-contract.test.mjs', 'scripts/starter-locales.test.mjs', 'scripts/sudoori.test.mjs', 'scripts/drinks-locales.test.mjs'),
      node('scripts/generate-inbound-tables.mjs', '--check'),
      node('scripts/generate-castle-locales.mjs', '--route', 'jr-pass-fuji.html', '--check'),
      node('scripts/generate-mieru-page.mjs', '--check'),
      node('scripts/generate-spot-pages.mjs', '--start-only', '--check'),
      ...['generate-sudoori-pages', 'generate-utility-locales', 'generate-starter-locales',
        'generate-guide-locale-routes', 'generate-drinks-locales', 'generate-sparkling-locales', 'generate-story-window-pages',
        'generate-window-trip-page', 'generate-site-chrome', 'generate-site-runtime']
        .map(name => node(`scripts/${name}.mjs`, '--check')),
      node('scripts/validate-train-select.mjs'), node('scripts/validate-mieru.mjs'),
      node('scripts/validate-castle-locales.mjs', '--route', 'jr-pass-fuji.html'),
      node('scripts/validate-utility-locales.mjs'), node('scripts/validate-story-window.mjs'), node('scripts/validate-sparkling-locales.mjs'),
      node('scripts/validate-site-navigation.mjs'), node('scripts/validate-live-sitemap.mjs'),
      node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs')],
  };
  const mikawaInputs = new Set(['data.js','data-runtime.js','locales.js','site-runtime.json','sitemap.xml','content-manifest.json','scripts/generate-runtime-data.mjs','scripts/generate-site-chrome.test.mjs','scripts/locales-contract.test.mjs','scripts/shared/expansion-localization.mjs','scripts/shared/site-chrome.mjs','scripts/shared/utility-localization.mjs','scripts/validate-castle-locales.mjs','scripts/release-scope.mjs','scripts/release-scope.test.mjs','images/thumbs/display/index.json','images/thumbs/gallery/index.json']);
  const mikawaPhoto = /^(?:images\/|images\/thumbs\/|images\/thumbs\/display\/|images\/thumbs\/gallery\/)(?:20261103_gamagori-takeshima_0|20261103_mikawa-oshima_sunset_28750|20261108_kaguya-no-akari_night_2305|20261108_hikone-castle_night_59142)_michikusa(?:-[a-f0-9]+-\d+)?\.(?:jpg|webp)$/;
  if (mikawaPhotoBatchDataOnly && files.includes('locales.js') && changes.some(c=>c.status==='A' && c.path==='fr/spots/mikawa-oshima.html') && changes.every(({path:file,status}) => status !== 'D' && (mikawaInputs.has(file) || mikawaPhoto.test(file) || /^data\/spot-pages\/(?:mikawa-oshima|kaguya-no-akari|hikone-castle)\.(?:ja|en)\.js$/.test(file) || /^(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/utility-data\.js$/.test(file) || /^scripts\/locales\/(?:castle|expansion|utility)-(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\.json$/.test(file) || /^scripts\/templates\/site-(?:source|chrome)\/.+\.tpl$/.test(file) || /^shared-ui\/[a-z-]+\.[a-z0-9-]+\.js$/.test(file) || /\.html$/.test(file)))) return {
    scope:'mikawa-photo-locales', needsDependencies:true, pagesCandidate:true,
    reason:'Three approved photo/video updates, Mikawa article in eight editions, shared navigation and its versioned consumers',
    commands:[...syntax, node('--test','scripts/release-scope.test.mjs','scripts/locales-contract.test.mjs','scripts/generate-site-chrome.test.mjs','scripts/responsive-photos.test.mjs'),
      node('scripts/generate-spot-page-shared-data.mjs','--check'), node('scripts/generate-spot-pages.mjs','--check'),
      node('scripts/generate-castle-locales.mjs','--route','spots/mikawa-oshima.html','--check'), node('scripts/generate-castle-locales.mjs','--route','spots/hikone-castle.html','--check'),
      node('scripts/generate-utility-locales.mjs','--route','zukan.html','--check'), node('scripts/generate-site-chrome.mjs','--check'), node('scripts/generate-site-runtime.mjs','--check'),
      node('scripts/validate-spot-page-shared.mjs'), node('scripts/validate-spot-schema.mjs'), node('scripts/validate-content.mjs'), node('scripts/audit-photo-credits.mjs','--check'),
      node('scripts/generate-gallery-thumbnails.mjs','--check'), node('scripts/generate-runtime-data.mjs','--check'), node('scripts/validate-runtime-data.mjs'), node('scripts/generate-inbound-tables.mjs','--check'),
      node('scripts/validate-castle-locales.mjs','--route','spots/mikawa-oshima.html'), node('scripts/validate-castle-locales.mjs','--route','spots/hikone-castle.html'),
      node('scripts/validate-site-navigation.mjs'), node('scripts/validate-live-sitemap.mjs'), node('scripts/sync-asset-versions.mjs','--check'), node('scripts/check-content-manifest.mjs')],
  };
  if (artworkSitemapOnly && files.includes('scripts/generate-spot-pages.mjs') && changes.every(({path, status}) => status === 'M' &&
    ['scripts/generate-spot-pages.mjs', 'scripts/artwork-layout.test.mjs', 'sitemap.xml', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs'].includes(path))) return {
    scope: 'artwork-sitemap', needsDependencies: true, pagesCandidate: true,
    reason: 'Only seven migrated artwork sitemap locations and the obsolete CLI-only rewrite change; page rendering and all other generators are unchanged.',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/artwork-layout.test.mjs', 'scripts/shared/live-sitemap.test.mjs'), node('scripts/validate-live-sitemap.mjs')],
  };
  const rideSources = new Set(['data.js', 'data-runtime.js', 'spot-page-shared-data.js', 'scripts/generate-yakei-page.mjs',
    'scripts/shared/yakei-spots.mjs', 'scripts/yakei-locales.test.mjs', 'yakei.css', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs', 'scripts/generate-spot-pages.test.mjs',
    'content-manifest.json', 'images/thumbs/display/index.json', 'images/thumbs/gallery/index.json']);
  const rideLocale = /^scripts\/locales\/(?:castle|expansion|utility|episode)-(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\.json$/;
  const dayRideSources = new Set(['data.js', 'data-runtime.js', 'content-manifest.json',
    'images/thumbs/display/index.json', 'images/thumbs/gallery/index.json', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs']);
  const dayRideLocaleRoutes = dayRideIds.filter(id => !['hinataoka', 'shiraitogawa-bridge'].includes(id));
  if (files.includes('data.js') && dayRideDataOnly && changes.every(({path: file, status}) => ['A', 'M'].includes(status) &&
    (dayRideSources.has(file)
      || dayRideIds.some(id => file === `data/spot-pages/${id}.ja.js` || file === `data/spot-pages/${id}.en.js`
        || new RegExp(`^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)/)?spots/${id}\\.html$`).test(file))
      || dayRidePhotoStems.some(stem => file === `images/${stem}.jpg` || file === `images/thumbs/${stem}.webp`
        || file === `images/thumbs/gallery/${stem}.webp` || new RegExp(`^images/thumbs/display/${stem}-[a-f0-9]{8}-(640|960|1920)\\.webp$`).test(file))
      || rideLocale.test(file) && addedLocaleKeysOnly(file)
      || file.endsWith('.html') && status === 'M' && assetVersionOnly(file)))) return {
    scope: 'owned-ride-day-content', needsDependencies: true, pagesCandidate: true,
    reason: 'Eight approved ride photographs and two reference videos; spot pages, generated language editions and runtime/distribution assets. Other HTML changes only asset versions.',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/responsive-photos.test.mjs', 'scripts/generate-spot-pages.test.mjs'),
      ...['validate-content', 'validate-spot-schema', 'validate-runtime-data', 'validate-spot-page-shared'].map(name => node(`scripts/${name}.mjs`)),
      node('scripts/audit-photo-credits.mjs', '--check'),
      ...['generate-spot-page-shared-data', 'generate-gallery-thumbnails', 'generate-runtime-data', 'sync-asset-versions']
        .map(name => node(`scripts/${name}.mjs`, '--check')),
      ...dayRideLocaleRoutes.map(id => node('scripts/generate-castle-locales.mjs', '--route', `spots/${id}.html`, '--check')),
      node('scripts/check-content-manifest.mjs')],
  };
  const ridePage = file => /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?yakei\.html$/.test(file)
    || rideRelatedIds.some(id => new RegExp(`^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)/)?spots/${id}\\.html$`).test(file));
  const ridePayload = file => rideRelatedIds.some(id => file === `data/spot-pages/${id}.ja.js` || file === `data/spot-pages/${id}.en.js`);
  const rideImage = file => ridePhotoStems.some(stem => file === `images/${stem}.jpg` || file === `images/thumbs/${stem}.webp`
    || file === `images/thumbs/gallery/${stem}.webp` || new RegExp(`^images/thumbs/display/${stem}-[a-f0-9]{8}-(640|960|1920)\\.webp$`).test(file));
  if (files.includes('data.js') && rideDataOnly && changes.every(({path: file, status}) => ['A', 'M'].includes(status) &&
    (rideSources.has(file) || ridePayload(file) || rideImage(file) || ridePage(file)
      || ['site-runtime.json', 'spot-page-runtime.json'].includes(file) && catalogManifestOnly(file)
      || file === 'scripts/generate-runtime-data.mjs' && rideBudgetOnly
      || rideLocale.test(file) && addedLocaleKeysOnly(file)
      || file.endsWith('.html') && status === 'M' && assetVersionOnly(file)))) return {
    scope: 'owned-ride-night-content', needsDependencies: true, pagesCandidate: true,
    reason: 'Approved ride photographs, two reference videos and night/article families; semantic spot guard preserves other content, positions, retained credits and media. Collateral HTML changes only asset versions.',
    commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/yakei-locales.test.mjs', 'scripts/responsive-photos.test.mjs', 'scripts/generate-spot-pages.test.mjs'),
      ...['validate-content', 'validate-spot-schema', 'validate-runtime-data', 'validate-spot-page-shared'].map(name => node(`scripts/${name}.mjs`)),
      node('scripts/audit-photo-credits.mjs', '--check'),
      ...['generate-spot-page-shared-data', 'generate-gallery-thumbnails', 'generate-runtime-data', 'generate-yakei-page', 'sync-asset-versions'].map(name => node(`scripts/${name}.mjs`, '--check')),
      node('scripts/generate-site-runtime.mjs', '--check'), node('scripts/generate-spot-page-runtime.mjs', '--check'),
      ...['yakei.html', 'spots/solar-ark.html', 'spots/kakegawa.html', 'spots/odawara.html', 'spots/tokyo-tower.html', 'spots/odawara-castle.html']
        .map(route => node('scripts/generate-castle-locales.mjs', '--route', route, '--check')),
      node('scripts/check-content-manifest.mjs')],
  };
  // Existing article layout and night-feature photographs; no spot positions or locale routes change.
  const nightArticleSources = new Set(['scripts/generate-kyoto-window-page.mjs', 'scripts/generate-yakei-page.mjs',
    'scripts/shared/yakei-spots.mjs', 'scripts/yakei-locales.test.mjs', 'scripts/window-articles.test.mjs', 'yakei.css',
    'scripts/generate-spot-pages.test.mjs', 'scripts/content-metadata.json',
    'scripts/templates/site-source/index.html.tpl', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs',
    'content-manifest.json', 'site-runtime.json', 'spot-page-runtime.json', 'sitemap.xml']);
  const nightArticlePage = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?(?:kyoto-station-views|yakei|index)\.html$/;
  const nightArticleLocale = /^scripts\/locales\/(?:episode|utility)-(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\.json$/;
  const nightArticlePayload = /^(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/utility-data\.js$/;
  if (files.some(file => ['scripts/generate-kyoto-window-page.mjs','scripts/generate-yakei-page.mjs','scripts/shared/yakei-spots.mjs'].includes(file))
    && changes.every(({path:file,status}) => status === 'M' && (nightArticleSources.has(file) || nightArticlePage.test(file)
      || nightArticleLocale.test(file) || nightArticlePayload.test(file) || file.endsWith('.html') && assetVersionOnly(file)))) return {
    scope:'night-article-followup', needsDependencies:true, pagesCandidate:true,
    reason:'Existing Kyoto article and night-feature cards, their localized editions and calculator destinations, landing counts and locale-payload cache references; registered spots, routes and shared UI remain unchanged.',
    commands:[...syntax, node('--test','scripts/release-scope.test.mjs','scripts/window-articles.test.mjs','scripts/yakei-locales.test.mjs','scripts/generate-spot-pages.test.mjs'),
      node('scripts/generate-kyoto-window-page.mjs','--check'),node('scripts/generate-yakei-page.mjs','--check'),
      node('scripts/generate-utility-locales.mjs','--route','index.html','--check'),
      ...['kyoto-station-views.html','yakei.html'].flatMap(route=>[
        node('scripts/generate-castle-locales.mjs','--route',route,'--check'),
        ...(route==='kyoto-station-views.html'?[node('scripts/validate-castle-locales.mjs','--route',route)]:[]),
        node('scripts/validate-site-navigation.mjs','--route',route)]),
      node('scripts/validate-spot-counts.mjs'),node('scripts/audit-photo-credits.mjs','--check'),
      node('scripts/sync-asset-versions.mjs','--check'),node('scripts/check-content-manifest.mjs'),node('scripts/audit-site.mjs')],
  };
  if (files.includes('data/rivers/route.json') && files.includes('scripts/factory-windows.json')) {
    const routes = ['rivers.html', 'factories.html'];
    const pages = editions.flatMap(lang => routes.map(route => lang === 'ja' ? route : lang + '/' + route));
    const sources = new Set(['data/rivers/route.json', 'scripts/factory-windows.json', 'scripts/factories-page.test.mjs',
      'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs', 'content-manifest.json', 'sitemap.xml', ...pages,
      ...editions.flatMap(lang => [`data/rivers/${lang}.json`, `scripts/locales/factory-windows/${lang}.json`])]);
    const withinFeatures = changes.every(({ path: file, status }) => {
      if (status === 'A') return /^(?:images\/rivers\/[a-z0-9-]+\.jpg|images\/factories\/[a-z0-9-]+\.webp)$/.test(file);
      if (status !== 'M') return false;
      if (file !== 'scripts/content-metadata.json') return sources.has(file);
      if (!options.fileContents) return false;
      const [before, after] = options.fileContents(file).map(text => JSON.parse(text));
      for (const page of pages) {
        if (!before[page] || !after[page]) return false;
        before[page].modified = after[page].modified;
        before[page].modifiedEvidence = after[page].modifiedEvidence;
      }
      return isDeepStrictEqual(before, after);
    });
    if (withinFeatures) return {
      scope: 'river-factory-photos', needsDependencies: true, pagesCandidate: true,
      reason: 'Check the river crossings and nearby factories in ten editions, their photo links, sitemap and distributed assets.',
      commands: [...syntax, node('--test', 'scripts/release-scope.test.mjs', 'scripts/factories-page.test.mjs'),
        node('scripts/generate-rivers-page.mjs', '--check'), node('scripts/generate-factories-page.mjs', '--check'),
        node('scripts/validate-site-navigation.mjs', '--route', 'rivers.html', '--route', 'factories.html'),
        node('--input-type=module', '-e', "import assert from 'node:assert/strict'; import fs from 'node:fs'; import {sitemapXML} from './scripts/generate-spot-pages.mjs'; assert.equal(fs.readFileSync('sitemap.xml','utf8'),sitemapXML());"),
        node('scripts/check-content-manifest.mjs')],
    };
  }
  const riversSources = new Set(['locales.js','language-router.js','package.json','scripts/generate-rivers-page.mjs',
    'scripts/validate-language-pages.mjs','scripts/generate-content-manifest.mjs','scripts/generate-spot-pages.mjs',
    'scripts/generate-language-mirrors.mjs','scripts/generate-utility-locales.mjs','scripts/templates/site-source/zukan.html.tpl',
    'scripts/content-metadata.json','scripts/locales-contract.test.mjs','scripts/release-scope.mjs','scripts/release-scope.test.mjs',
    'content-manifest.json','sitemap.xml']);
  const riversOutput = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?rivers\.html$/;
  const riversZukanOutput = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?zukan\.html$/;
  const riversLocaleDictionary = /^scripts\/locales\/utility-(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\.json$/;
  const riversLocalePayload = /^(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/utility-data\.js$/;
  const riversInput = file => file.startsWith('data/rivers/') || /^images\/rivers\/.+\.jpg$/i.test(file)
    || ['rivers.css','rivers.js'].includes(file);
  let riversPackage = !files.includes('package.json');
  if (!riversPackage) riversPackage = onlyRiversPackageChange(packageBefore, packageAfter);
  const riversChange = files.some(file => file === 'scripts/generate-rivers-page.mjs' || file.startsWith('data/rivers/'));
  if (riversChange && riversPackage && changes.every(({path:file,status}) => status !== 'D'
    && (riversSources.has(file) || riversOutput.test(file) || riversZukanOutput.test(file)
      || riversLocaleDictionary.test(file) || riversLocalePayload.test(file) || riversInput(file)
      || file.endsWith('.html') && status === 'M' && assetVersionOnly(file)))) return {
    scope:'rivers-feature', needsDependencies:true, pagesCandidate:true,
    reason:'Rivers feature editions, the field-guide entry, route registration, sitemap and offline Web manifest; unrelated page families remain unchanged.',
    commands:[...syntax,node('--test','scripts/release-scope.test.mjs','scripts/locales-contract.test.mjs'),
      node('scripts/generate-rivers-page.mjs','--check'),node('scripts/generate-utility-locales.mjs','--route','zukan.html','--check'),
      node('scripts/validate-language-pages.mjs'),node('scripts/validate-site-navigation.mjs','--route','rivers.html'),
      node('scripts/validate-site-navigation.mjs','--route','zukan.html'),node('scripts/sync-asset-versions.mjs','--check'),
      node('scripts/check-content-manifest.mjs')],
  };
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
  // A fifth article changes the story registry and navigation, not the unrelated
  // castle, utility or forecast language families. Keep their version-only
  // consumers, but prove the new route and existing five-story outputs directly.
  const extensionFiles = new Set(['locales.js','language-router.js','story-window.css',
    'scripts/generate-story-window-pages.mjs','scripts/shared/story-window.mjs',
    'scripts/validate-story-window.mjs','scripts/validate-language-pages.mjs',
    'scripts/generate-content-manifest.mjs','scripts/content-metadata.json',
    'scripts/locales-contract.test.mjs','scripts/shared/story-routing.test.mjs',
    'scripts/release-scope.mjs','scripts/release-scope.test.mjs',
    'content-manifest.json','sitemap.xml','site-runtime.json','spot-page-runtime.json']);
  const extensionBody = /^data\/story-window\/(?:ja|en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/shinkalion\.html$/;
  const extensionUI = /^data\/story-window\/(?:ja|en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/ui\.json$/;
  const extensionPage = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?(?:stories\/(?:index|godzilla|shogun|yurucamp|dragonball|shinkalion)\.html|zukan\.html)$/;
  const extensionPhoto = /^images\/story-window\/(?:20260712_n700a_michikusa|20160321_scmaglev-railway-park_abasaa|20260930_kyoto-railway-museum_48790_michikusa)\.jpg$/;
  if(files.some(file=>extensionBody.test(file)||extensionUI.test(file))&&changes.every(({path:file,status})=>status!=='D'&&
    (extensionFiles.has(file)||extensionBody.test(file)||extensionUI.test(file)||extensionPage.test(file)||extensionPhoto.test(file)||
      /^shared-ui\/(?:ja|en|zh-hant|zh-hans|ko|th|fr|de|es|it)\.shell\.js$/.test(file)||
      /\.(?:html|tpl)$/.test(file)&&status==='M'&&versionOnly(file))))return{
    scope:'story-extension',needsDependencies:true,pagesCandidate:true,
    reason:'Shinkalion, the fifth story in ten editions; story navigation, localized catalogue entries and locale registry cache consumers. Other editorial families are unchanged.',
    commands:[...syntax,node('--test','scripts/release-scope.test.mjs','scripts/locales-contract.test.mjs','scripts/shared/story-routing.test.mjs'),
        node('scripts/generate-story-window-pages.mjs','--check'),node('scripts/validate-story-window.mjs'),
        node('scripts/validate-site-navigation.mjs',...[...storyRoutes,'zukan.html'].flatMap(route=>['--route',route])),
        node('scripts/sync-asset-versions.mjs','--check'),
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
  const buildDriver = ['scripts/build.mjs', 'scripts/build.test.mjs'];
  const htmlReview = ['scripts/release-html-summary.mjs', 'scripts/release-html-summary.test.mjs'];
  const testHtmlReview = files.some(file => htmlReview.includes(file));
  const reviewTests = testHtmlReview ? ['scripts/release-html-summary.test.mjs'] : [];
  // A new registered window spot changes the global catalogue, runtime
  // guidance, counts, stamps and every edition's shared navigation.
  if (files.includes('data.js') && changes.some(({ path, status }) => status === 'A' && (/^data\/spot-pages\/[^/]+\.ja\.js$/.test(path) || /^images\/stamps\/stamp_[^/]+\.svg$/.test(path)))) return {
    scope: 'full', needsDependencies: true, pagesCandidate: true,
    reason: 'A registered SPOTS addition affects all catalogue, runtime guidance, stamp, shared navigation and language consumers',
    commands: [['npm', 'run', 'verify'], node('--test', 'scripts/release-scope.test.mjs', ...reviewTests)],
  };
  const packageKind = files.includes('package.json') ? classifyPackageChange(packageBefore, packageAfter) : null;
  if (packageKind === 'unmapped') return { scope: 'unmapped', needsDependencies: false, pagesCandidate: false,
    reason: 'Define affected checks for the changed npm command behavior; a script edit is not a dependency upgrade', commands: [] };
  const checkFiles = files.filter(file => file !== 'package.json' || packageKind !== 'validation-commands');
  if (!files.length) return { scope: 'none', needsDependencies: false, pagesCandidate: false, reason: 'No changed files', commands: [] };
  if (files.every(file => /^(?:README|CHANGELOG|AGENTS|ARCHITECTURE)\.md$/.test(file))) return {
    scope: 'documentation', needsDependencies: false, pagesCandidate: false, reason: 'Repository documentation only', commands: [],
  };
  if (checkFiles.every(file => infra.has(file) || buildDriver.includes(file) || htmlReview.includes(file) || file === 'ARCHITECTURE.md')) {
    const declaration = changes.find(c => c.path === articleRegistryPath);
    if (declaration && declaration.status !== 'A') {
      const pair = declaration.status === 'M' && options.fileContents?.(articleRegistryPath);
      if (!pair || !isDeepStrictEqual(...pair.map(text => JSON.parse(text)))) return {
        scope: 'unmapped', needsDependencies: false, pagesCandidate: false,
        reason: 'Verify an altered editorial declaration with its article sources', commands: [],
      };
    }
    const testFiles = ['scripts/release-scope.test.mjs', 'scripts/release-artifact.test.mjs', ...reviewTests];
    if (checkFiles.some(file => buildDriver.includes(file))) testFiles.push('scripts/build.test.mjs');
    return {
      scope: 'release-infrastructure', needsDependencies: testHtmlReview, pagesCandidate: false,
      reason: 'Check the affected build and release tools and their workflow contracts',
      commands: [...syntax, node('--test', ...testFiles)],
    };
  }
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
  // A dependency/runtime upgrade can affect every validator. Other unknown
  // changes require an impact contract, rather than silently running everything.
  if (files.some(file => ['package.json', 'package-lock.json'].includes(file))) return {
    scope: 'full', needsDependencies: true, pagesCandidate: true, reason: 'The package/runtime dependency contract changed; all consumers require validation',
    commands: [['npm', 'run', 'verify'], node('--test', 'scripts/release-scope.test.mjs', 'scripts/release-html-summary.test.mjs')],
  };
  return { scope: 'unmapped', needsDependencies: false, pagesCandidate: false, reason: `Define affected generators, consumers and checks before execution: ${files.join(', ')}`, commands: [] };
}

const spotGenerator = 'scripts/generate-spot-pages.mjs';
const metadataTests = 'scripts/generate-spot-pages.test.mjs';
const adTests = 'scripts/spot-adsense.test.mjs';
const spotValidator = 'scripts/validate-spot-page-shared.mjs';
const trainScripts = ['train-select.js', 'train-picker.js', 'journey-light-events.js', 'sparkling-dreams.js', 'yakei.js'];
const stampScripts = ['data/stamp-store.js', '727-collection.js', 'ferris-wheels.js'];
const stampGenerators = ['scripts/generate-727-page.mjs', 'scripts/generate-ferris-wheel-page.mjs'];
const trainTests = ['train-result', 'journey-light-events', 'yakei-locales', 'train-search-tables'];
const stampTests = ['stamp-store', '727-collection-analytics', 'ferris-wheels-common-display', 'timeline-recommendations'];
const browserTest = name => `scripts/${name}.test.mjs`;
const runtimeTests = new Set([...trainTests, ...stampTests, 'leaflet-loader', 'locales-contract', 'shared-ui-language'].map(browserTest));
const stampTemplate = /^scripts\/templates\/site-source\/(?:start|zukan|(?:en\/)?journal)\.html\.tpl$/;

function onlyRuntimeReferencesChanged(before, after) {
  const version = /(\bsrc=["'](?:\.\.\/)*(?:app|train-select|train-picker|journey-light-events|sparkling-dreams|yakei|727-collection|ferris-wheels|data\/stamp-store)\.js\?v=)[a-f0-9]{8}(?=["'])/g;
  const normalize = html => html.replace(version, '$1VERSION');
  const addition = /<script src="((?:\.\.\/)*)data\/stamp-store\.js\?v=(?:VERSION|source)"><\/script>\s*(?=(?:<script>window\.MADO_727_LOCALE = [^\r\n]*?<\/script>\s*)?<script src="\1(?:app|727-collection|ferris-wheels)\.js\?v=)/;
  const old = normalize(before), next = normalize(after);
  return before !== after && (old === next || !old.includes('data/stamp-store.js') && next.replace(addition, '') === old);
}

function onlyRideAppChanged(before, after) {
  // app.js also owns unrelated home, gallery and analytics behavior. Scope only its ride and stamp functions.
  const body = /^function (?:loadStamps|fmtClock|nowMin|timelinePoint|computeJourney|collectionTimelineSpots|updateLive|toggleStamp|refreshStampDisplay|bindJournalControls)\([^\n]*?\) \{(?:[^\n]*\}$|[\s\S]*?^\})\n?/gm;
  const normalize = code => code.replace(body, '')
    .replace(/^let stamps = (?:loadStamps\(\)|window\.MadoStamps\.read\(\));\n/m, '')
    .replace(/^window\.MadoStamps\.onChange\(\(updated\) => \{\n  stamps = updated;\n  refreshStampDisplay\(\);\n\}\);\n/m, '');
  return before !== after && normalize(before) === normalize(after);
}

function addsOnlyRuntimeTests(beforeValue, afterValue, changed) {
  if (!beforeValue || !afterValue) return false;
  const read = value => typeof value === 'string' ? JSON.parse(value) : structuredClone(value);
  const before = read(beforeValue), after = read(afterValue);
  const old = before.scripts?.['test:generator'], next = after.scripts?.['test:generator'];
  if (!old?.startsWith('node --test ') || !next?.startsWith('node --test ')) return false;
  const previous = old.split(' '), args = next.split(' ');
  const extra = args.filter(arg => !previous.includes(arg));
  if (!extra.length || extra.length !== new Set(extra).size || !extra.every(arg => runtimeTests.has(arg) && changed.has(arg))) return false;
  after.scripts['test:generator'] = args.filter(arg => !extra.includes(arg)).join(' ');
  return isDeepStrictEqual(before, after);
}

function runtimeScope(changes, options) {
  const files = new Set(changes.map(change => change.path));
  const train = trainScripts.some(file => files.has(file));
  const stamps = stampScripts.some(file => files.has(file));
  if (!train && !stamps && !files.has('app.js')) return null;
  const proof = (file, check) => options.fileContents && check(...options.fileContents(file));
  const runtime = new Set([...trainScripts, ...stampScripts, ...runtimeTests, 'scripts/release-scope.mjs',
    'scripts/release-scope.test.mjs', metadataTests, spotValidator, 'content-manifest.json']);
  const allowed = changes.every(({ path: file, status }) => {
    if (status === 'A') return runtimeTests.has(file) || file === 'data/stamp-store.js';
    if (status !== 'M') return false;
    if (runtime.has(file)) return true;
    if (file === 'app.js') return proof(file, onlyRideAppChanged);
    if (file === 'package.json') return addsOnlyRuntimeTests(options.packageBefore, options.packageAfter, files);
    if (file === 'scripts/generate-content-manifest.mjs') return proof(file, (old, next) =>
      next !== old && next.replace(/^  "data\/stamp-store\.js",\n/m, '') === old);
    if (stampGenerators.includes(file)) return proof(file, (old, next) =>
      next !== old && next.replace(/^  <script src="\$\{(?:p|prefix)\}data\/stamp-store\.js\?v=\$\{assetVersion\('data\/stamp-store\.js'\)\}"><\/script>\n/m, '') === old);
    return (stampTemplate.test(file) || file.endsWith('.html') && !/^v[01]\//.test(file)) && proof(file, onlyRuntimeReferencesChanged);
  });
  if (!allowed) return null;
  const tests = new Set([...files].filter(file => runtimeTests.has(file) || file === 'scripts/release-scope.test.mjs' || file === metadataTests));
  if (train || files.has('app.js')) for (const name of trainTests) tests.add(browserTest(name));
  if (stamps || files.has('app.js')) for (const name of stampTests) tests.add(browserTest(name));
  const commands = [...files].filter(file => file.endsWith('.js')).map(file => node('--check', file));
  commands.push(node('--test', ...tests));
  if (train || files.has('app.js')) commands.push(node('scripts/validate-train-select.mjs'));
  if (files.has('sparkling-dreams.js') || files.has('train-picker.js')) commands.push(node('scripts/validate-sparkling-dreams.mjs'));
  for (const file of stampGenerators) if (files.has(file)) commands.push(node(file, '--check'));
  if (files.has('727-collection.js')) commands.push(node('scripts/validate-727-collection.mjs'));
  commands.push(node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs'));
  return { scope: 'ride-runtime', needsDependencies: true, pagesCandidate: true,
    reason: 'Ride and stamp consumers, their runtime tests, versioned script references and distribution inventory.', commands };
}

const galleryIndex = 'images/thumbs/gallery/index.json';
const displayIndex = 'images/thumbs/display/index.json';
const castleGenerator = 'scripts/generate-castle-locales.mjs';
const utilityGenerator = 'scripts/generate-utility-locales.mjs';
const utilityLocalization = 'scripts/shared/utility-localization.mjs';
const localeContract = 'scripts/locales-contract.test.mjs';

function onlyFactoryIndexChanges(file, before, after) {
  const onlyKnown = (a, b, sourceOf) => [...new Set([...Object.keys(a), ...Object.keys(b)])].every(key =>
    isDeepStrictEqual(a[key], b[key]) || [a[key], b[key]].filter(value => value !== undefined)
      .every(value => value && factoryMetadataPhotos.has(sourceOf(key, value))));
  if (isDeepStrictEqual(before, after)) return false;
  if (file === galleryIndex) return onlyKnown(before, after, (_, entry) => entry.source);
  return isDeepStrictEqual({ ...before, sources: after.sources, files: after.files }, after)
    && onlyKnown(before.sources, after.sources, key => key)
    && onlyKnown(before.files, after.files, (_, entry) => entry.source);
}

function factoryPhotoScope(changes, options) {
  const files = new Set(changes.map(c => c.path));
  const photoInputs = changes.filter(c => factoryMetadataPhotos.has(c.path));
  const indices = changes.filter(c => c.path === galleryIndex || c.path === displayIndex);
  if (!photoInputs.length && !indices.length) return null;
  if (photoInputs.some(c => c.status !== 'M' || !options.factoryPhotoMetadataOnly?.(c.path))) return null;
  const indexVersions = new Map();
  for (const c of indices) {
    if (c.status !== 'M' || !options.fileContents) return null;
    const versions = options.fileContents(c.path).map(text => JSON.parse(text));
    if (!onlyFactoryIndexChanges(c.path, ...versions)) return null;
    indexVersions.set(c.path, versions);
  }

  const verified = new Set(indices.map(c => c.path));
  const replacements = new Map(), payloadIds = new Set();
  if (indexVersions.has(displayIndex)) {
    const [before, after] = indexVersions.get(displayIndex).map(index => index.files);
    const renamed = new Map(Object.entries(after).filter(([target, entry]) => !before[target] && factoryMetadataPhotos.has(entry.source))
      .map(([target, entry]) => [entry.source + '/' + entry.width, target]));
    for (const [old, entry] of Object.entries(before)) {
      if (after[old]) continue;
      const target = renamed.get(entry.source + '/' + entry.width);
      if (!target || !entry.sha256 || after[target].sha256 !== entry.sha256) return null;
      replacements.set(old, target);
    }
    if (renamed.size !== replacements.size) return null;
    const statuses = new Map(changes.map(c => [c.path, c.status]));
    for (const [old, target] of replacements) {
      if (statuses.get(old) !== 'D' || statuses.get(target) !== 'A') return null;
      verified.add(old); verified.add(target);
    }
  }
  const applyReferences = text => text.replace(/images\/thumbs\/display\/[\w.-]+\.webp|data\/spot-pages\/[\w-]+\.(?:ja|en)\.js\?v=[a-f0-9]{8}/g,
    reference => replacements.get(reference) ?? reference);
  for (const { path: file, status } of changes) {
    const payload = file.match(/^data\/spot-pages\/([\w-]+)\.(?:ja|en)\.js$/);
    if (!payload) continue;
    if (status !== 'M' || !options.fileContents) return null;
    const [before, after] = options.fileContents(file);
    if (before === after || applyReferences(before) !== after) return null;
    replacements.set(file + '?v=' + shortHash(before), file + '?v=' + shortHash(after));
    payloadIds.add(payload[1]); verified.add(file);
  }
  for (const { path: file, status } of changes) {
    const page = file.match(/^(?:(?:en|fr|de|es|it|ko|th|zh-Hans|zh-Hant)\/)?spots\/([\w-]+)\.html$/);
    if (!page || !payloadIds.has(page[1]) || status !== 'M') continue;
    const [before, after] = options.fileContents(file);
    if (before !== after && applyReferences(before) === after) verified.add(file);
  }
  const generators = [castleGenerator, utilityGenerator, utilityLocalization];
  if (files.has(castleGenerator) || files.has(utilityLocalization)) generators.push(localeContract);
  const remaining = changes.filter(c => !verified.has(c.path) && !(c.status === 'M' && generators.includes(c.path)));
  let plan;
  if (files.has('scripts/generate-factories-page.mjs')) {
    plan = selectExistingScope(remaining, { ...options, factoryPhotoMetadataOnly: file => factoryMetadataPhotos.has(file) });
    if (plan.scope !== 'factory-windows') return null;
  } else {
    if (remaining.some(c => !factoryMetadataPhotos.has(c.path) &&
      !(c.status === 'M' && ['content-manifest.json', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs'].includes(c.path)))) return null;
    const tests = ['scripts/release-scope.test.mjs', 'scripts/responsive-photos.test.mjs'];
    if (files.has(utilityLocalization)) tests.push(localeContract);
    plan = { scope: 'factory-photo-derivatives', needsDependencies: true, pagesCandidate: true,
      reason: 'Verify factory thumbnail generation, spot photo references and their Web distribution',
      commands: [node('--test', ...tests)] };
  }
  const checks = [node('scripts/generate-gallery-thumbnails.mjs', '--check'), node('scripts/generate-spot-page-shared-data.mjs', '--check')];
  if (files.has(castleGenerator)) checks.push(node(castleGenerator, '--check'));
  else for (const id of payloadIds) checks.push(node(castleGenerator, '--route', 'spots/' + id + '.html', '--check'));
  if (files.has(utilityGenerator) || files.has(utilityLocalization)) checks.push(node(utilityGenerator, '--check'));
  if (files.has(utilityLocalization)) {
    const [before, after] = options.fileContents(utilityLocalization);
    const collectEnglish = /^export function collectEnglish\([\s\S]*?^}/m;
    if (!collectEnglish.test(before) || !collectEnglish.test(after) || before.replace(collectEnglish, '') !== after.replace(collectEnglish, ''))
      checks.push(node('scripts/generate-starter-locales.mjs', '--check'));
  }
  checks.push(node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs'));
  return { ...plan, commands: [...plan.commands, ...checks.filter(c => !plan.commands.some(other => isDeepStrictEqual(c, other)))] };
}

const nightSpotList = 'scripts/shared/yakei-spots.mjs';
const momentsPage = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?window-moments\.html$/;
function onlyWindowNightCount(file, read, changedPayloads) {
  const [source, after] = read(file);
  if (source === after) return false;
  const payload = file.split('/')[0] + '/utility-data.js';
  let before = source;
  if (changedPayloads?.has(payload)) {
    const [oldTag, newTag] = read(payload).map(text => '<script src="../' + payload + '?v=' + shortHash(text) + '"></script>');
    before = before.replace(oldTag, newTag);
    if (before === after) return true;
  }
  const label = /(<a class="wm-special-card" href="(?:\.\.\/[\w-]+\/)?yakei\.html">\s*<img\b[^>]*>\s*<span class="wm-special-copy"><small>[^<\d]*)\d+(?=[^<\d]*<\/small>)/g;
  return [...before.matchAll(label)].length === 1
    && before.replace(label, (_, prefix) => prefix + YAKEI_SPOT_COUNT) === after;
}

// Only body copy can vary. Keep the entire head, markup, attributes and executable or inert code blocks verbatim.
function guidePageStructure(html) {
  const head = html.match(/^[\s\S]*?<\/head>\s*<body\b(?:[^<>"']|"[^"]*"|'[^']*')*>/i)?.[0];
  if (!head) return null;
  const tags = /<!--[\s\S]*?-->|<(script|style|template|textarea|noscript|iframe|pre|code)\b[^>]*>[\s\S]*?<\/\1\s*>|<(?:"[^"]*"|'[^']*'|[^<>"'])+>/gi;
  return [head, ...(html.slice(head.length).match(tags) || [])];
}

function guidePageScope(changes, { fileContents }) {
  const templates = new Set(['zukan.html', 'journal.html', 'en/journal.html'].map(file => `scripts/templates/site-source/${file}.tpl`));
  const page = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?(?:zukan|journal)\.html$/;
  if (!fileContents || !changes.some(({path}) => templates.has(path) || page.test(path))) return null;
  const controls = new Set(['content-manifest.json', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs', 'scripts/stamp-store.test.mjs']);
  const tag = /^[ \t]*<script src="data\/timetable\.js\?v=[a-f0-9]{8}"><\/script>\r?\n/gm;
  if (!changes.every(({path: file, status}) => {
    if (status !== 'M') return false;
    if (controls.has(file)) return true;
    if (!templates.has(file) && !page.test(file)) return false;
    const [before, after] = fileContents(file);
    const withoutTimetable = !after.match(tag) && [...before.matchAll(tag)].length === 1 ? before.replace(tag, '') : before;
    const structure = guidePageStructure(withoutTimetable);
    return structure !== null && isDeepStrictEqual(structure, guidePageStructure(after));
  })) return null;
  return { scope: 'guide-and-journal', needsDependencies: true, pagesCandidate: true,
    reason: 'Field guide and stamp book copy, editions and their ride-page dependency boundary',
    commands: [node('--test', 'scripts/stamp-store.test.mjs', 'scripts/train-result.test.mjs', 'scripts/release-scope.test.mjs'),
      node('scripts/generate-language-mirrors.mjs'), node(utilityGenerator, '--check', '--route', 'zukan.html'),
      node(utilityGenerator, '--check', '--route', 'journal.html'), node('scripts/check-content-manifest.mjs')],
  };
}

function timetableScope(changes, options) {
  const sources = new Set([
    'data/timetable.js', 'sparkling-dreams.js', 'journey-light-model.js', 'journey-light-events.js',
    'scripts/generate-sparkling-dreams-page.mjs', 'scripts/shared/sparkling-localization.mjs',
    'scripts/validate-sparkling-dreams.mjs', 'scripts/validate-sparkling-locales.mjs',
    'scripts/templates/site-source/en/jr-pass-fuji.html.tpl',
    'scripts/locales/utility-it.json', 'scripts/locales/utility-th.json',
    'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs', 'content-manifest.json',
  ]);
  const changed = new Set(changes.map(change => change.path));
  if (!changed.has('data/timetable.js') && !changed.has('sparkling-dreams.js')) return null;
  const page = /^(?:(?:en|de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/)?(?:sparkling-dreams|jr-pass-fuji)\.html$/;
  const translation = /^(?:scripts\/locales\/sparkling-(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\.json|(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)\/(?:sparkling|utility)-data\.js)$/;
  const dateTranslation = /^scripts\/locales\/(?:castle-(?:de|es|fr|ko|zh-Hans|zh-Hant)|expansion-(?:it|th))\.json$/;
  const allowed = changes.every(({ path: file, status }) => {
    if (status !== 'M') return false;
    if (sources.has(file) || page.test(file) || translation.test(file)) return true;
    if (dateTranslation.test(file)) {
      const pair = options.fileContents?.(file);
      if (!pair) return false;
      const [before, after] = pair.map(source => JSON.parse(source));
      const stableEntries = Object.entries(after).filter(([key, value]) =>
        Object.hasOwn(before, key) || key !== value || !/^\d{4}-\d{2}-\d{2}$/.test(key));
      return isDeepStrictEqual(Object.fromEntries(stableEntries), before);
    }
    if (file === 'scripts/generate-spot-pages.mjs' || file === 'sitemap.xml') {
      const pair = options.fileContents?.(file);
      if (!pair) return false;
      const normalize = file.endsWith('.mjs')
        ? source => source.replace(/(\/sparkling-dreams\.html[^{}\n]+lastmod: ")\d{4}-\d{2}-\d{2}/g, '$1DATE')
          .replace(/route === 'sparkling-dreams\.html' \? '\d{4}-\d{2}-\d{2}' : /g, '')
        : source => source.replace(/(\/sparkling-dreams\.html<\/loc>\s*<lastmod>)\d{4}-\d{2}-\d{2}/g, '$1DATE');
      return normalize(pair[0]) === normalize(pair[1]);
    }
    return file.endsWith('.html') && options.assetVersionOnly?.(file);
  });
  if (!allowed) return null;
  return {
    scope: 'train-timetable', needsDependencies: true, pagesCandidate: true,
    reason: 'Validate the timetable, Disney operating calendar, train selection, localized pages and distribution references.',
    commands: [
      ...['data/timetable.js', 'sparkling-dreams.js', 'journey-light-model.js', 'journey-light-events.js'].map(file => node('--check', file)),
      node('--test', 'scripts/release-scope.test.mjs', 'scripts/journey-light-events.test.mjs',
        'scripts/train-search-tables.test.mjs', 'scripts/train-result.test.mjs', 'scripts/yakei-locales.test.mjs'),
      node('scripts/validate-timetable.mjs'), node('scripts/validate-train-select.mjs'),
      node('scripts/generate-sparkling-dreams-page.mjs', '--check'),
      node('scripts/validate-sparkling-dreams.mjs'), node('scripts/validate-sparkling-locales.mjs'),
      node('scripts/generate-inbound-tables.mjs', '--check'),
      node('scripts/generate-utility-locales.mjs', '--route', 'start.html', '--check'),
      node('scripts/generate-castle-locales.mjs', '--route', 'jr-pass-fuji.html', '--check'),
      node('scripts/sync-asset-versions.mjs', '--check'), node('scripts/check-content-manifest.mjs'),
    ],
  };
}

function solarArkSectionScope(changes, { fileContents, assetVersionOnly }) {
  const route = 'spots/solar-ark.html';
  if (!fileContents || !['data.js', 'data/spot-pages/solar-ark.en.js']
    .every(file => changes.some(change => change.path === file && change.status === 'M'))) return null;
  const locale = '(?:de|es|fr|it|ko|th|zh-Hans|zh-Hant)';
  const localized = new RegExp(`^(?:scripts/locales/castle-${locale}\\.json|${locale}/utility-data\\.js|(?:en|${locale})/${route.replace('.', '\\.')}|data/spot-pages/solar-ark\\.(?:ja|en)\\.js)$`);
  const outputs = new Set([route, 'data.js', 'data-runtime.js', 'content-manifest.json',
    'artworks/window-trip/index.html', 'artworks/window-trip/window-trip-data.js',
    'data/window-trip-photo-sources.json', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs']);
  if (!changes.every(({ path: file, status }) => status === 'M' && (outputs.has(file) || localized.test(file)
    || file.endsWith('.html') && assetVersionOnly?.(file)))) return null;

  const normalize = code => {
    const context = {};
    vm.runInNewContext(code + ';this.data = JSON.stringify({ SPOTS, ROUTE, BOARD_COLLECTION, WHEEL_COLLECTION });', context, { timeout: 5000 });
    const data = JSON.parse(context.data);
    const spot = data.SPOTS.find(item => item.id === 'solar-ark');
    const areas = [spot.ja.area, spot.en.area];
    delete spot.ja.area;
    delete spot.en.area;
    delete spot.routeNote;
    delete spot.guideIntro;
    return { areas, data };
  };
  let before, after;
  try { [before, after] = fileContents('data.js').map(normalize); } catch { return null; }
  if (!isDeepStrictEqual(before.areas, ['名古屋 → 岐阜羽島', 'Nagoya → Gifu-Hashima'])
    || !isDeepStrictEqual(after.areas, ['岐阜羽島 → 米原', 'Gifu-Hashima → Maibara'])
    || !isDeepStrictEqual(before.data, after.data)) return null;
  return {
    scope: 'solar-ark-section', needsDependencies: true, pagesCandidate: true,
    reason: 'Check the Solar Ark section and its article, locale, window trip and distribution projections.',
    commands: [
      node('--check', 'data.js'), node('--test', 'scripts/release-scope.test.mjs', 'scripts/spot-page-loader.test.mjs'),
      node('scripts/validate-spot-schema.mjs'), node('scripts/generate-spot-page-shared-data.mjs', '--check'),
      node('scripts/validate-spot-page-shared.mjs'), node('scripts/generate-runtime-data.mjs', '--check'),
      node('scripts/validate-runtime-data.mjs'), node(utilityGenerator, '--route', 'reflections.html', '--check'),
      node(castleGenerator, '--route', route, '--check'), node('scripts/generate-window-trip-data.mjs', '--check'),
      node('scripts/generate-window-trip-page.mjs', '--check'), node('scripts/sync-asset-versions.mjs', '--check'),
      node('scripts/check-content-manifest.mjs'),
    ],
  };
}

function spotVideoLoadingScope(changes, { assetVersionOnly }) {
  const route = 'spots/solar-ark.html';
  const renderer = 'spot-page-shared.js';
  const galleryStyles = 'spot-media-gallery.css';
  const files = new Set(changes.map(change => change.path));
  const generator = 'scripts/generate-spot-pages.mjs';
  const pilot = [route, renderer, galleryStyles, generator].every(file => files.has(file));
  if (!pilot && ![renderer, spotValidator, 'scripts/generate-spot-pages.test.mjs'].every(file => files.has(file))) return null;
  const inputs = new Set([...(pilot ? [route, generator] : []), renderer, galleryStyles, spotValidator,
    'scripts/generate-spot-pages.test.mjs', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs',
    'site-runtime.json', 'spot-page-runtime.json', 'content-manifest.json']);
  if (!changes.every(({path: file, status}) => status === 'M' &&
      (inputs.has(file) || (file.endsWith('.html') && assetVersionOnly?.(file))))) return null;
  return {
    scope: 'spot-video-loading', needsDependencies: true, pagesCandidate: true,
    reason: 'Check Japanese multi-video controls, the Solar Ark stylesheet preload, and asset-only references in other pages.',
    commands: [
      node('--check', renderer), node('--test', 'scripts/generate-spot-pages.test.mjs', 'scripts/release-scope.test.mjs'),
      node('--input-type=module', '-e', "import fs from 'node:fs'; import assert from 'node:assert/strict'; import {planSpotPage, finalPageOutput} from './scripts/generate-spot-pages.mjs'; for (const lang of ['ja', 'en']) {const p=planSpotPage('solar-ark', lang, {requireExisting:true, preserveHead:true}); assert.equal(fs.readFileSync(p.outputPath,'utf8'), finalPageOutput(p.outputPath,p.generatedHTML));}"),
      node('scripts/validate-spot-page-shared.mjs'), node('scripts/generate-site-runtime.mjs', '--check'),
      node('scripts/generate-spot-page-runtime.mjs', '--check'), node('scripts/sync-asset-versions.mjs', '--check'),
      node('scripts/check-content-manifest.mjs'),
    ],
  };
}

function featureMediaScope(changes, { assetVersionOnly }) {
  const controllers = ['feature-media.js', 'feature-media.css', 'scripts/shared/feature-media.mjs', 'scripts/shared/x-video-thumbnails.mjs'];
  if (!changes.some(change => controllers.includes(change.path))) return null;
  const generated = ['727', 'arenani', 'hanabi', 'sparkling-dreams', 'window-moments', 'yakei'];
  const articles = ['727-collection', 'arenani', 'hanabi', 'sparkling-dreams', 'window-moments', 'yakei', 'reflections',
    'stories/shinkalion', 'stories/shogun', 'stories/godzilla'].map(route => route + '.html');
  const inputs = new Set([...controllers, ...articles, ...generated.map(name => 'scripts/generate-' + name + '-page.mjs'),
    'spot-page-shared.js', 'sparkling-dreams.js', spotValidator, 'scripts/validate-sparkling-dreams.mjs',
    'scripts/generate-spot-pages.mjs', 'scripts/generate-spot-page-shared-data.mjs',
    'scripts/generate-story-window-pages.mjs', 'scripts/generate-content-manifest.mjs',
    'scripts/feature-media.test.mjs', 'scripts/generate-spot-pages.test.mjs', 'scripts/release-scope.mjs',
    'scripts/release-scope.test.mjs', 'site-runtime.json', 'spot-page-runtime.json', 'content-manifest.json']);
  if (!changes.every(change => ['A', 'M'].includes(change.status) && (inputs.has(change.path) ||
    (change.status === 'M' && (/^data\/spot-pages\/[\w-]+\.ja\.js$/.test(change.path) ||
      (change.path.endsWith('.html') && assetVersionOnly?.(change.path))))))) return null;
  return {
    scope: 'feature-media', needsDependencies: true, pagesCandidate: true,
    reason: 'Validate Japanese on-demand embeds, common spot photos, generated editions and distribution assets.',
    commands: [
      node('--check', 'feature-media.js'), node('--check', 'sparkling-dreams.js'), node('--check', 'spot-page-shared.js'),
      node('--test', 'scripts/feature-media.test.mjs', 'scripts/generate-spot-pages.test.mjs', 'scripts/release-scope.test.mjs'),
      ...generated.map(name => node('scripts/generate-' + name + '-page.mjs', '--check')),
      node('scripts/generate-story-window-pages.mjs', '--lang', 'ja', '--check'), node('scripts/validate-story-window.mjs'),
      node('scripts/validate-sparkling-dreams.mjs'), node('scripts/generate-spot-page-shared-data.mjs', '--check'),
      node(spotValidator), node('scripts/generate-site-runtime.mjs', '--check'),
      node('scripts/generate-spot-page-runtime.mjs', '--check'), node('scripts/sync-asset-versions.mjs', '--check'),
      node('scripts/check-content-manifest.mjs'),
    ],
  };
}

export function chooseReleaseScope(changes, options = {}) {
  const select = inputs => {
    const existing = featureMediaScope(inputs, options) || spotVideoLoadingScope(inputs, options) || solarArkSectionScope(inputs, options) || guidePageScope(inputs, options) || timetableScope(inputs, options)
      || factoryPhotoScope(inputs, options) || selectExistingScope(inputs, options);
    return existing.scope === 'unmapped' ? runtimeScope(inputs, options) || existing : existing;
  };
  let plan = select(changes);
  const files = new Set(changes.map(change => change.path));
  let checkMoments = files.has(nightSpotList);
  const outputs = changes.filter(c => momentsPage.test(c.path));
  if (outputs.length && plan.scope === 'unmapped' && options.fileContents) {
    const rest = changes.filter(c => !momentsPage.test(c.path));
    const correction = rest.every(c => c.status === 'M' && ['content-manifest.json', 'scripts/release-scope.mjs', 'scripts/release-scope.test.mjs'].includes(c.path));
    const payloads = checkMoments ? new Set(rest.filter(c => c.status === 'M' && c.path.endsWith('/utility-data.js')).map(c => c.path)) : null;
    if (outputs.every(c => c.status === 'M' && onlyWindowNightCount(c.path, options.fileContents, payloads))) {
      const other = correction ? { scope: 'window-moments-count', needsDependencies: true, pagesCandidate: true,
        reason: 'Night-scene count in the Window Moments editions', commands: [node('--test', 'scripts/release-scope.test.mjs')] } : select(rest);
      if (other.pagesCandidate) {
        plan = correction ? other : { ...other, reason: other.reason + ' Also verify the Window Moments night-scene count.' };
        checkMoments = true;
      }
    }
  }
  const packageEdits = changes.filter(c => pagesPackaging.has(c.path));
  if (plan.scope === 'unmapped' && packageEdits.length) {
    const product = select(changes.filter(c => !pagesPackaging.has(c.path) && !c.path.startsWith('.github/workflows/')
      && !(c.path === 'ARCHITECTURE.md' && c.status === 'M')));
    const workflows = changes.filter(c => c.path.startsWith('.github/workflows/'));
    if (!['unmapped', 'none'].includes(product.scope) && workflows.every(c => infra.has(c.path) && c.status === 'M')) {
      const workflowTests = workflows.length && !product.commands.some(c => c.includes('--test') && c.includes('scripts/release-artifact.test.mjs'))
        ? [node('--test', 'scripts/release-artifact.test.mjs')] : [];
      plan = { ...product, commands: [...product.commands, ...workflowTests] };
    }
  }
  if (plan.scope !== 'unmapped' && packageEdits.length) {
    plan = { ...plan, pagesCandidate: plan.pagesCandidate || packageEdits.some(c => pagesDefinition.has(c.path)),
      commands: [...plan.commands, node('--test', pagesTest)] };
  }
  if (plan.scope === 'unmapped' || plan.scope === 'full') return plan;
  const hasFullTest = file => plan.commands.some(command => command[1] === '--test' && command.includes(file)
    && !command.some(arg => arg.startsWith('--test-name-pattern')));
  const extra = [];
  if (checkMoments) {
    extra.push(node('scripts/generate-window-moments-page.mjs', '--check'), node(utilityGenerator, '--route', 'window-moments.html', '--check'));
    if (!plan.commands.some(c => c[1] === 'scripts/check-content-manifest.mjs')) extra.push(node('scripts/check-content-manifest.mjs'));
  }
  if (files.has(castleGenerator)) {
    if (!hasFullTest(localeContract)) extra.push(node('--test', localeContract));
    const riverGenerator = 'scripts/generate-rivers-page.mjs';
    if (!plan.commands.some(command => command[1] === riverGenerator && command.includes('--check')))
      extra.push(node(riverGenerator, '--check'));
  }
  if ((files.has('scripts/content-metadata.json') || files.has(metadataTests)) && !hasFullTest(metadataTests)) {
    extra.push(node('--test', '--test-name-pattern', 'editorial metadata', metadataTests));
  }
  const adPolicy = files.has('scripts/shared/spot-ad-placements.mjs') || files.has('spot-adsense.js');
  let spotRendering = files.has(spotGenerator) && !(options.donburiSitemapOnly || options.ramenSitemapOnly || options.artworkSitemapOnly);
  if (spotRendering && options.fileContents && changes.some(change => change.path === spotGenerator && change.status === 'M')) {
    const [before, after] = options.fileContents(spotGenerator);
    const sitemap = /^function sitemapXML\(\) \{\n[\s\S]*?^\}/m;
    spotRendering = !(sitemap.test(before) && sitemap.test(after) && before.replace(sitemap, '') === after.replace(sitemap, ''));
  }
  if (adPolicy && !hasFullTest(adTests)) extra.push(node('--test', adTests));
  if ((adPolicy || spotRendering || files.has(spotValidator)) && !plan.commands.some(command => command[1] === spotValidator)) extra.push(node(spotValidator));
  return extra.length ? { ...plan, needsDependencies: true, commands: [...plan.commands, ...extra] } : plan;
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
  const dataChanged = changes.some(c => c.path === 'data.js' && c.status === 'M');
  const dataBefore = dataChanged ? git('show', `${base}:data.js`) : '';
  const dataAfter = dataChanged ? git('show', `${head}:data.js`) : '';
  const plan = chooseReleaseScope(changes, {
    fileContents: file => [base, head].map(rev => execFileSync('git', ['show', `${rev}:${file}`],
      { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })),
    factoryRegistrationOnly: file => changes.some(c => c.path === file && c.status === 'M') &&
      onlyFactoryRegistrationChanged(file, git('show', `${base}:${file}`), git('show', `${head}:${file}`)),
    factoryAssetVersionOnly: file => onlyDonburiAssetReferencesChanged(git('show', `${base}:${file}`), git('show', `${head}:${file}`)),
    factoryPhotoMetadataOnly: file => onlyFactoryJpegMetadataRemoved(file,
      execFileSync('git', ['show', `${base}:${file}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 }),
      execFileSync('git', ['show', `${head}:${file}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 })),
    artworkSitemapOnly: changes.some(c => c.path === 'scripts/generate-spot-pages.mjs' && c.status === 'M') && onlyArtworkSitemapChanged(git('show', `${base}:scripts/generate-spot-pages.mjs`), git('show', `${head}:scripts/generate-spot-pages.mjs`)),
    rideDataOnly: dataChanged && onlyRideMediaDataChanged(dataBefore, dataAfter),
    dayRideDataOnly: dataChanged && onlyRideMediaDataChanged(dataBefore, dataAfter, true),
    mikawaPhotoBatchDataOnly: dataChanged && onlyMikawaPhotoBatchDataChanged(dataBefore, dataAfter),
    rideBudgetOnly: changes.some(c => c.path === 'scripts/generate-runtime-data.mjs') && onlyRideBudgetChanged(git('show', `${base}:scripts/generate-runtime-data.mjs`), git('show', `${head}:scripts/generate-runtime-data.mjs`)),
    assetVersionOnly: file => onlyAssetVersionReferencesChanged(git('show', `${base}:${file}`), git('show', `${head}:${file}`)),
    catalogManifestOnly: file => onlyCatalogManifestVersionChanged(git('show', `${base}:${file}`), git('show', `${head}:${file}`)),
    addedLocaleKeysOnly: file => {
      const before = JSON.parse(git('show', `${base}:${file}`)), after = JSON.parse(git('show', `${head}:${file}`));
      return Object.keys(before).every(key => before[key] === after[key]);
    },
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
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `scope=${plan.scope}\nneeds_dependencies=${plan.needsDependencies}\npages_candidate=${needsPagesCandidate(plan)}\nreview_html=${plan.changes.some(change => change.path.endsWith('.html'))}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## Validation scope: ${plan.scope}\n${plan.reason}\n\n${plan.commands.map(c => '- `' + c.join(' ') + '`').join('\n')}\n`);
  } else if (mode === 'verify') runPlan(JSON.parse(fs.readFileSync(arg, 'utf8')), output);
  else throw new Error('Usage: release-scope.mjs plan <base-sha> <plan.json> | verify <plan.json> <receipt.json>');
}
