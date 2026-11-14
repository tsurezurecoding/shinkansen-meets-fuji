import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import vm from 'node:vm';

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

export function chooseReleaseScope(changes, { versionOnly = () => false, assetVersionOnly = () => false, catalogManifestOnly = () => false, rideDataOnly = false, dayRideDataOnly = false, mikawaPhotoBatchDataOnly = false, rideBudgetOnly = false, addedLocaleKeysOnly = () => false, marukoLinkOnly = () => false, menuReferenceOnly = () => false, chromeExtractionOnly = () => false, artworkSitemapOnly = false, packageBefore, packageAfter } = {}) {
  const files = changes.map(change => change.path);
  const syntax = files.filter(file => /\.(?:mjs|cjs|js)$/.test(file)).map(file => node('--check', file));
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
  // A new registered window spot changes the global catalogue, runtime
  // guidance, counts, stamps and every edition's shared navigation.
  if (files.includes('data.js') && changes.some(({ path, status }) => status === 'A' && /^data\/spot-pages\/[^/]+\.ja\.js$/.test(path))) return {
    scope: 'full', needsDependencies: true, pagesCandidate: true,
    reason: 'A registered SPOTS addition affects all catalogue, runtime guidance, stamp, shared navigation and language consumers',
    commands: [['npm', 'run', 'verify'], node('--test', 'scripts/release-scope.test.mjs')],
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
  const dataChanged = changes.some(c => c.path === 'data.js' && c.status === 'M');
  const dataBefore = dataChanged ? git('show', `${base}:data.js`) : '';
  const dataAfter = dataChanged ? git('show', `${head}:data.js`) : '';
  const plan = chooseReleaseScope(changes, {
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
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `scope=${plan.scope}\nneeds_dependencies=${plan.needsDependencies}\npages_candidate=${needsPagesCandidate(plan)}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## Validation scope: ${plan.scope}\n${plan.reason}\n\n${plan.commands.map(c => '- `' + c.join(' ') + '`').join('\n')}\n`);
  } else if (mode === 'verify') runPlan(JSON.parse(fs.readFileSync(arg, 'utf8')), output);
  else throw new Error('Usage: release-scope.mjs plan <base-sha> <plan.json> | verify <plan.json> <receipt.json>');
}
