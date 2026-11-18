import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {SPOT_AD_PLACEMENTS,withSpotAdvertising} from './shared/spot-ad-placements.mjs';
import {planSpotPage,finalPageOutput} from './generate-spot-pages.mjs';
import {readSiteSource,finalizeSiteChrome} from './shared/site-chrome.mjs';
const source=fs.readFileSync('spot-adsense.js','utf8');
function harness({url='https://www.michikusa-travel.com/spots/kakegawa.html',position='before-map',lang='ja',id='kakegawa',map=true,embedded=false,native=false,iframe=false,ready=false}={}) {
 const config={version:1,spot:'kakegawa',lang:'ja',client:'ca-pub-5756673901202661',slot:'6439684093',position};
 const dom=new JSDOM('<!doctype html><body data-spot-page-shared-lang="'+lang+'" data-spot-page-shared-id="'+id+'"><script type="application/json" id="mado-spot-ad-config">'+JSON.stringify(config)+'</script><article class="spot-page-article"><section class="story">Story</section>'+(map?'<section class="spot-static-map"><button>Map control</button></section>':'')+'<section class="guide">Guide</section></article>',{url});
 const observers=[];let resolveReady;const root={document:dom.window.document,location:new URL(url),MADO_EMBEDDED_WEB:embedded,Capacitor:{isNativePlatform:()=>native}};root.self=root;root.top=iframe?{}:root;
 root.IntersectionObserver=class {constructor(callback,options){this.callback=callback;this.options=options;observers.push(this);}observe(node){this.node=node;}disconnect(){this.disconnected=true;}};
 if(ready)root.MADO_SPOT_PAGE_READY=new Promise(resolve=>{resolveReady=resolve;});
 dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return {width:728};};
 const run=()=>vm.runInNewContext(source,{window:root});run();
 return {root,doc:root.document,observers,run,resolveReady,intersect:()=>observers[0]?.callback([{isIntersecting:true}]),sdk:()=>root.document.querySelectorAll('script[src*="adsbygoogle.js"]').length};
}
test('only Japanese Kakegawa opts into one generated shared script',()=>{
 assert.deepEqual(Object.keys(SPOT_AD_PLACEMENTS),['ja/kakegawa']);
 const original='<body>article</body>',html=withSpotAdvertising(original,'kakegawa','ja');
 assert.equal(withSpotAdvertising(html,'kakegawa','ja'),html);
 assert.equal((html.match(/id="mado-spot-ad-config"/g)||[]).length,1);
 for(const [spot,lang] of [['fuji','ja'],['kakegawa','en'],['kakegawa','fr']])assert.equal(withSpotAdvertising(original,spot,lang),original);
 const plan=planSpotPage('kakegawa','ja',{requireExisting:true,preserveHead:true});
 assert.equal(fs.readFileSync('spots/kakegawa.html','utf8'),finalPageOutput(plan.outputPath,plan.generatedHTML));
 assert.ok(!planSpotPage('kakegawa','en').generatedHTML.includes('mado-spot-ad-config'));
});
test('reserves the slot before the map and defers all Google work to proximity',()=>{
 const h=harness();assert.equal(h.doc.querySelector('.spot-static-map').previousElementSibling.id,'mado-spot-ad');
 assert.equal(h.sdk(),0);assert.equal(h.root.adsbygoogle,undefined);assert.equal(h.observers[0].options.rootMargin,'300px 0px');
 h.intersect();h.intersect();assert.equal(h.sdk(),1);assert.equal(h.root.adsbygoogle.length,1);assert.equal(h.observers[0].disconnected,true);
 h.run();assert.equal(h.doc.querySelectorAll('#mado-spot-ad').length,1);assert.equal(h.sdk(),1);
 const unit=h.doc.querySelector('.spot-ad-unit');unit.setAttribute('data-ad-status','unfilled');unit.style.display='none';
 assert.ok(h.doc.querySelector('style').textContent.includes('.spot-ad-space{min-height:250px}'));
 assert.ok(h.doc.querySelector('style').textContent.includes('.spot-ad-space{min-height:90px}'));
 assert.equal(h.doc.querySelector('.spot-static-map button').textContent,'Map control');
});
test('position changes use the same implementation and missing anchors make no requests',()=>{
 let h=harness({position:'after-map'});assert.equal(h.doc.querySelector('.spot-static-map').nextElementSibling.id,'mado-spot-ad');
 h=harness({position:'article-end',map:false});assert.equal(h.doc.querySelector('article').lastElementChild.id,'mado-spot-ad');
 for(const options of [{map:false},{position:'unknown'}]){h=harness(options);assert.equal(h.doc.querySelector('#mado-spot-ad'),null);assert.equal(h.sdk(),0);}
});
test('previews never request Google and native, iframe, language or spot mismatch never mount',()=>{
 for(const url of ['http://127.0.0.1:8893/spots/kakegawa.html','file:///C:/app/spots/kakegawa.html','https://preview.example/spots/kakegawa.html','https://www.michikusa-travel.com/en/spots/kakegawa.html']){
  const h=harness({url});h.intersect();assert.equal(h.sdk(),0);assert.equal(h.root.adsbygoogle,undefined);
 }
 for(const options of [{embedded:true},{native:true},{iframe:true},{lang:'en'},{id:'fuji'}]){const h=harness(options);assert.equal(h.doc.querySelector('#mado-spot-ad'),null);assert.equal(h.sdk(),0);}
});
test('mount waits for article rendering and does not gate the article ready promise',async()=>{
 const h=harness({ready:true});assert.equal(h.doc.querySelector('#mado-spot-ad'),null);h.resolveReady();await h.root.MADO_SPOT_PAGE_READY;await Promise.resolve();assert.ok(h.doc.querySelector('#mado-spot-ad'));assert.equal(h.sdk(),0);
});
test('privacy source outputs agree in both languages and disclose the expanded scope',()=>{
 for(const file of ['privacy.html','en/privacy.html']){const html=fs.readFileSync(file,'utf8');assert.equal(finalizeSiteChrome(readSiteSource(process.cwd(),file),file,process.cwd()),html);for(const s of ['AdSense','myadcenter.google.com','aboutads.info/choices/'])assert.ok(html.includes(s));}
 const japanese=fs.readFileSync('privacy.html','utf8');
 assert.ok(japanese.includes('一部のスポットページ'));
 assert.ok(japanese.includes('selected spot pages use Google AdSense'));
 assert.equal((japanese.match(/aboutads.info\/choices\//g)||[]).length,2);
 assert.ok(japanese.includes('2026年11月17日'));
 for(const file of ['privacy.html','en/privacy.html'])assert.ok(fs.readFileSync(file,'utf8').includes('November 17, 2026'));
});
