import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('wheel points join the default timeline and field guide once, using their stable collection IDs',()=>{
 const dataContext={};vm.createContext(dataContext);
 vm.runInContext(read('data.js')+';globalThis.source={SPOTS,WHEEL_COLLECTION}',dataContext);
 const app=read('app.js');
 const wheelSource=app.slice(app.indexOf('function wheelCollectionSpots('),app.indexOf('function isWheelCollectionSpot('));
 const timelineSource=app.slice(app.indexOf('function collectionTimelineSpots('),app.indexOf('function seatTags('));
 const gallerySource=app.slice(app.indexOf('function gallerySpots('),app.indexOf('// 「曇りでも見える」'));
 const galleryFilterSource=app.slice(app.indexOf('const galleryTagGroups ='),app.indexOf('function galleryTagBadgesHTML('))
  +app.slice(app.indexOf('function matchesGalleryFilters('),app.indexOf('function updateGalleryFilterButtons('));
 const hirakata=dataContext.source.SPOTS.find(spot=>spot.id==='hirakata-park-wheel');
 const ctx={WHEEL_COLLECTION:dataContext.source.WHEEL_COLLECTION,SPOTS:dataContext.source.SPOTS,
  boardCollectionExpanded:false,journey:{mode:'estimate',depMin:0,spots:[{sp:hirakata,clock:139,seq:139}]},
  direction:'west',boardId:'Tokyo',REF:{Tokyo:0},boardCollectionSpots:()=>[],
  timelinePoint:(sp,clock)=>({sp,clock:clock(sp.minutesFromTokyo),seq:sp.minutesFromTokyo}),
  activeTimelineFilters:new Set(),activeGalleryFilters:new Set(),favorites:{},
  is727CollectionSpot:()=>false,seatTags:spot=>new Set([spot.side==='A'?'seat-a':'seat-e']),
  spotHasTimeOfDay:(spot,mode)=>mode==='day'?true:(spot.photos||[]).some(photo=>photo.timeOfDay===mode)};
 vm.createContext(ctx);
 vm.runInContext(wheelSource+';'+timelineSource+';'+gallerySource+';'+galleryFilterSource+';globalThis.result={wheels:wheelCollectionSpots(),timeline:currentTimelineSpotCandidates(),gallery:gallerySpots()}',ctx);
 const expected=Array.from(dataContext.source.WHEEL_COLLECTION.filter(w=>w.isWheelCollection),w=>w.stampId);
 assert.deepEqual(Array.from(ctx.result.wheels,w=>w.id),expected);
 assert.deepEqual(Array.from(ctx.result.timeline.filter(x=>x.sp.isWheelCollection),x=>x.sp.id),expected);
 assert.deepEqual(Array.from(ctx.result.gallery.filter(x=>x.isWheelCollection),x=>x.id),expected);
 assert.equal(ctx.result.timeline.filter(x=>x.sp.id==='hirakata-park-wheel').length,1);
 assert.equal(ctx.result.gallery.filter(x=>x.id==='hirakata-park-wheel').length,1);

 ctx.activeTimelineFilters=new Set(['seat-e']);
 const eastTimeline=Array.from(ctx.result.timeline.filter(x=>ctx.matchesTimelineFilters(x.sp)&&x.sp.isWheelCollection),x=>x.sp.id);
 ctx.activeGalleryFilters=new Set(['seat-e']);
 const eastGallery=Array.from(ctx.result.gallery.filter(x=>ctx.matchesGalleryFilters(x)&&x.isWheelCollection),x=>x.id);
 assert.deepEqual(eastTimeline,expected.filter(id=>ctx.result.wheels.find(w=>w.id===id).side==='E'));
 assert.deepEqual(eastGallery,eastTimeline);

 ctx.activeTimelineFilters=new Set(['industry']);
 assert.equal(ctx.result.timeline.filter(x=>x.sp.isWheelCollection&&ctx.matchesTimelineFilters(x.sp)).length,0);
 ctx.activeGalleryFilters=new Set(['industry']);
 assert.equal(ctx.result.gallery.filter(x=>x.isWheelCollection&&ctx.matchesGalleryFilters(x)).length,0);
 ctx.favorites={[expected[0]]:1};
 ctx.activeTimelineFilters=new Set(['favorites']);
 assert.deepEqual(Array.from(ctx.result.timeline.filter(x=>x.sp.isWheelCollection&&ctx.matchesTimelineFilters(x.sp)),x=>x.sp.id),[expected[0]]);
});

test('a collapsed 727 collection still reports reachable points and keeps its toggle enabled',()=>{
 const app=read('app.js');
 const timelineSource=app.slice(app.indexOf('function collectionTimelineSpots('),app.indexOf('function seatTags('));
 const toggleSource=app.slice(app.indexOf('// 727だけは既存の代表＋展開方式を維持する。'),app.indexOf('function renderGallery('));
 const boardPoint={id:'727-added-point',is727Collection:true,minutesFromTokyo:25,sourceNo:20};
 const toggle={disabled:true,attributes:{},setAttribute(name,value){this.attributes[name]=value;},
  closest:()=>({classList:{toggle(){}}})};
 const ctx={boardCollectionExpanded:false,journey:{mode:'estimate',depMin:0,direction:'west',boardId:'Tokyo',spots:[]},
  direction:'west',boardId:'Tokyo',REF:{Tokyo:0},boardCollectionSpots:()=>[boardPoint],wheelCollectionSpots:()=>[],
  timelinePoint:(sp,clock)=>({sp,clock:clock(sp.minutesFromTokyo),seq:sp.minutesFromTokyo}),
  matchesTimelineFilters:()=>true,$$:()=>[toggle]};
 vm.createContext(ctx);
 vm.runInContext(timelineSource+toggleSource+';globalThis.result=reachableCollectionCandidates("727");syncCollectionToggleUI()',ctx);
 assert.equal(ctx.result.length,1);
 assert.equal(ctx.result[0].sp.id,'727-added-point');
 assert.equal(toggle.disabled,false);
 assert.equal(toggle.checked,false);
});

test('wheel cards link to their Ferris Wheels page anchor and generated editions keep the anchor',()=>{
 const app=read('app.js');
 const hrefSource=app.slice(app.indexOf('function spotPageHref('),app.indexOf('function liveMapHref('));
 const ctx={utilityHref:route=>route,lang:'ja'};vm.createContext(ctx);
 vm.runInContext(hrefSource+';globalThis.href=spotPageHref({isWheelCollection:true,collectionPointId:"fuji-sky-view",id:"ferris-wheel-fuji-sky-view"})',ctx);
 assert.equal(ctx.href,'ferris-wheels.html#fuji-sky-view');
 const generator=read('scripts/generate-ferris-wheel-page.mjs');
 assert(generator.includes('id="${item.id}" data-wheel-card="${item.id}"'));
 for(const file of ['ferris-wheels.html','en/ferris-wheels.html']) assert(read(file).includes('id="fuji-sky-view" data-wheel-card="fuji-sky-view"'));
});

test('the train selector keeps the 727 collection toggle but removes the Ferris wheel expansion toggle',()=>{
 const html=read('start.html');
 assert(html.includes('data-727-collection-toggle'));
 assert(!html.includes('data-wheel-collection-toggle'));
 const app=read('app.js');
 assert(!app.includes('wheelCollectionExpanded'));
});
