import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { stripJaTrainWindow } from './shared/train-window-preview.mjs';
const require=createRequire(import.meta.url);
const M=require('../journey-light-model.js');
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('ride date and midnight labels stay in JST and reject invalid calendar dates',()=>{
 assert.equal(M.dateEpoch('2026-02-30'),null);
 assert.equal(M.dateEpoch('1900-01-01'),null);
 assert.deepEqual(M.jstParts(Date.parse('2026-10-17T15:01:00Z')),{date:'2026-10-18',time:'00:01'});
 assert.equal(M.clockLabel('2026-10-17',1445),'翌日 00:05');
 assert.equal(M.clockLabel('2026-10-17',-5),'前日 23:55');
});

test('solar events follow the train position through sunset and civil twilight',()=>{
 const journey={depMin:900,stops:[{clock:900},{clock:1140,arr:1140}]};
 const trainSelect={positionAt:(_stops,minute)=>minute>=900&&minute<=1140?minute:null};
 const track={minToKm:x=>x,latLngAtKm:x=>({lat:35.68-(x-900)/240*.98,lng:139.76-(x-900)/240*4.26}),segmentAtKm:()=>({from:{ja:'東京'},to:{ja:'新大阪'}})};
 const result=M.movingSolar({journey,date:'2026-10-17',track,trainSelect});
 assert.equal(result.status,'calculated');
 const sunset=result.events.find(e=>e.kind==='sunset'),dusk=result.events.find(e=>e.kind==='civil-dusk');
 assert(sunset&&dusk&&sunset.minute<dusk.minute);
 assert(sunset.minute>1020&&sunset.minute<1110);
 assert(Math.abs(sunset.point.altitude+.833)<.01);
 assert(Math.abs(dusk.point.altitude+6)<.01);
 assert(sunset.point.lng<139.76&&sunset.point.lng>135.5);
 assert.equal(result.at(900).phase,'day');
 assert.equal(result.at(1140).phase,'night');
 assert.equal(result.at(1141),null);
});

test('unknown Disney schedules and mismatched train variants cannot become encounters',()=>{
 const journey={train:{type:'Nozomi',number:191,times:{Tokyo:960}},mode:'train',preview:false,direction:'west',boardId:'Tokyo',stops:[{clock:960},{clock:1100,arr:1100}]};
 const timetable={validFrom:'2026-10-01',datasetId:'october-2026'};
 const base={date:'2026-10-17',journey,timetable,now:Date.parse('2026-10-17T03:00:00Z')};
 const pending={calculate(){throw Error('must not calculate a pending schedule');},getScheduleState:()=>({status:'pending'})};
 assert.equal(M.disney({...base,sparkling:pending}).status,'pending');
 assert.equal(M.disney({...base,journey:{...journey,preview:true},sparkling:pending}).status,'unselected');
 const sparkling={getScheduleState:()=>({status:'known',pattern:'A'}),PATTERN_SERVICES:{A:[]},findTrain:()=>null,serviceKey:()=>'',calculate:()=>({status:'encounter',selectedTrain:{times:{Tokyo:961}},matches:[{time:1020}]})};
 assert.equal(M.disney({...base,sparkling}).status,'variant-unknown');
 assert.equal(M.disney({...base,journey:{...journey,stops:[{clock:1430},{clock:1445}]},sparkling}).status,'cross-day-unknown');
});

test('the production integration keeps SEO/analytics and excludes translated shells',()=>{
 const html=read('start.html'),doc=new JSDOM(html).window.document;
 assert(!doc.querySelector('meta[name=robots]').content.includes('noindex'));
 assert.equal(doc.querySelector('link[rel=canonical]').href,'https://www.michikusa-travel.com/start.html');
 assert(!html.includes('window.MADO_ANALYTICS_DISABLED=true'));
 assert(!html.includes('preview-hosting.js'));
 for(const asset of ['journey-light-model.js','journey-light-events.js','journey-light-events.css']){
  assert(html.includes(asset));assert(!stripJaTrainWindow(html).includes(asset));
  assert(JSON.parse(read('content-manifest.json')).files.some(f=>f.path===asset));
 }
 for(const lang of ['en','fr','zh-Hant','de','es','zh-Hans','ko'])assert(!read(lang+'/start.html').includes('journey-light-events.js'),lang);
});
