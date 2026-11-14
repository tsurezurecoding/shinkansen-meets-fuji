import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { onlyMikawaPhotoBatchDataChanged } from './release-scope.mjs';
import { chooseReleaseScope, onlyArtworkSitemapChanged, onlyCatalogManifestVersionChanged, onlyAssetVersionReferencesChanged, onlyRideBudgetChanged, onlyRideMediaDataChanged, onlyVersionReferenceChanged, onlyMarukoLocaleLinkChanged, onlyPreservedChromeMenuChanged, onlyPreservedArtworkChromeExtraction, assertReusableVerification, assertReleasePlanContract, classifyPackageChange, needsPagesCandidate } from './release-scope.mjs';

const change = path => ({ path, status: 'M' });

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
  assert.deepEqual(chooseReleaseScope([]).commands, []);
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
