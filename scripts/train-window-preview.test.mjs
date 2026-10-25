import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { stripJaTrainWindow } from './shared/train-window-preview.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('JA route/window remains below the existing picker; timeline warning follows the list',()=>{
 const doc=new JSDOM(read('start.html')).window.document,left=doc.querySelector('.journey-form-pane'),right=doc.querySelector('.journey-timeline-pane');
 assert.equal(doc.querySelectorAll('[data-train-picker]').length,1);
 assert(left.contains(doc.querySelector('#sp-view')));
 const timelineSection=doc.querySelector('#timelineSection'),timeline=doc.querySelector('#timeline'),more=doc.querySelector('#timelineRecommendationMore'),warning=doc.querySelector('#timeline-calculation-note');
 assert(right.contains(timelineSection));
 assert.equal(timeline.parentElement,timelineSection);
 assert.equal(more.parentElement,timelineSection);
 assert.equal(warning.parentElement,timelineSection);
 assert.equal(timeline.nextElementSibling,more);
 assert.equal(more.nextElementSibling,warning);
 assert(!left.querySelector('.train-entry-help'));
 assert(doc.querySelector('.sp-map-column').compareDocumentPosition(doc.querySelector('.sp-window-column'))&4);
 assert.equal(doc.querySelector('link[rel=canonical]').href,'https://www.michikusa-travel.com/start.html');
 assert(!/noindex/.test(doc.querySelector('meta[name=robots]')?.content||''));
});
test('JA-only markup and dependencies are removed before translating the existing shell',()=>{
 const stripped=stripJaTrainWindow(read('start.html'));
 assert(!stripped.includes('id="sp-view"'));
 assert(!stripped.includes('train-window-preview.js'));
 assert(stripped.includes('timeline-calculation-note'));
 assert(stripped.includes('TRAIN-ENTRY-HELP:START'));
 for(const locale of ['en','fr','zh-Hant','de','es','zh-Hans','ko']){
  const shell=read(locale+'/start.html');
  assert(!shell.includes('id="sp-view"'),locale);
  assert(!shell.includes('train-window-stage.js'),locale);
 }
});
test('current geometry covers every registered scene and all station anchors',()=>{
 const ctx={window:{}};vm.createContext(ctx);
 vm.runInContext(read('data.js')+';globalThis.sourceSpots=SPOTS;globalThis.refs=ROUTE.refStations;',ctx);
 vm.runInContext(read('train-window-geometry.js'),ctx);
 const data=ctx.window.MADO_TRAIN_WINDOW;
 assert.deepEqual(Array.from(data.spots,s=>s.id).sort(),Array.from(ctx.sourceSpots,s=>s.id).sort());
 assert.deepEqual(Array.from(data.stations,s=>s.id),Array.from(ctx.refs,s=>s.id));
 assert(data.line.length>50);
 assert(data.spots.every(s=>Number.isFinite(s.km)&&['A','E','AE'].includes(s.s)));
 assert(!read('train-window-geometry.js').includes('images/'));
});
test('integration retains native saved journeys and live state, without prototype network interception',()=>{
 const js=read('train-window-preview.js');
 assert(!/startLive\s*=/.test(js));assert(!/restoreLastJourney\s*=/.test(js));
 assert(!/window\.open\(/.test(js));assert(!/location\.(?:href|assign)\s*=/.test(js));
});

test('combined day/night route filters retain both day-only and night media',()=>{
 const runtime=read('train-window-preview.js');
 const source=runtime.slice(runtime.indexOf('function items('),runtime.indexOf('function baselineLabels('));
 const spot=(id,media)=>({sp:{id,media},clock:1200});
 const day={src:'day.webp',timeOfDay:'day',index:0},night={src:'night.webp',timeOfDay:'night',index:1};
 const ctx={activeTimelineFilters:new Set(['day','night']),activeTimelineTimeOfDayFilter:()=> 'night',matchesTimelineFilters:()=>true,isClearlyDark:()=>true,
  spotHasTimeOfDay:(s,mode)=>s.media.some(m=>m.timeOfDay===mode),preferredSpotMedia:(s,mode)=>s.media.find(m=>m.timeOfDay===mode)||s.media[0]};
 vm.createContext(ctx);vm.runInContext(source+';globalThis.makeItems=items',ctx);
 const journey={spots:[spot('day-only',[day]),spot('both',[day,night]),spot('night-only',[night])]};
 const combined=ctx.makeItems(journey,true);
 assert.deepEqual(Array.from(combined,x=>x.sp.id),['day-only','both','night-only']);
 assert.deepEqual(Array.from(combined,x=>x.timeOfDay),['day','night','night']);
 ctx.activeTimelineFilters.delete('day');
 assert.deepEqual(Array.from(ctx.makeItems(journey,true),x=>x.sp.id),['both','night-only']);
});

test('baseline timeline labels use the visible candidates, including expanded collections',()=>{
 const runtime=read('train-window-preview.js');
 const source=runtime.slice(runtime.indexOf('function baselineLabels('),runtime.indexOf('function render('));
 const rows=['ordinary','727','wheel'].map(id=>{const time={textContent:''};return{dataset:{spot:id},querySelector:()=>time,time};});
 const candidates=[
  {sp:{id:'ordinary'},clock:72.4},
  {sp:{id:'727'},clock:88.2},
  {sp:{id:'wheel'},clock:94.7},
 ];
 const ctx={state:{actual:false},$:()=>null,currentTimelineSpotCandidates:()=>candidates,
  document:{querySelectorAll:selector=>selector==='#timeline [data-spot]'?rows:[]}};
 vm.createContext(ctx);vm.runInContext(source+';globalThis.run=baselineLabels',ctx);
 ctx.run({preview:true,boardId:'Tokyo',spots:[candidates[0]]});
 assert.deepEqual(rows.map(row=>row.time.textContent),['約72分','約88分','約95分']);
});
