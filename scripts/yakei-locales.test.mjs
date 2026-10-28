import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {YAKEI_SPOT_IDS} from './shared/yakei-spots.mjs';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const names={de:['Dunkel','Dämmerung','Noch hell'],fr:['Nuit','Crépuscule','Encore jour'],'zh-Hant':['天黑','晨昏微光','天還亮'],es:['Noche','Crepúsculo','Todavía de día'],'zh-Hans':['天黑','晨昏微光','天还亮'],ko:['밤','어스름','아직 밝음'],it:['Buio','Crepuscolo','Ancora chiaro'],th:['มืด','แสงสนธยา','ยังสว่าง']};
function calculator(lang){
 const dom=new JSDOM('<input id="ykDate" value="2026-10-20"><div data-train-picker></div><div id="ykResult"></div><p id="ykSummary"></p>');
 Object.defineProperty(dom.window.document,'readyState',{value:'complete'});
 let options;
 const root={document:dom.window.document,YAKEI_LANG:lang,YAKEI_SPOT_IDS:[...YAKEI_SPOT_IDS],MADO_ANALYTICS_DISABLED:true,MADO_TRAIN_PICKER:{mount(el,opts){options=opts;}}};root.window=root;
 const context=vm.createContext(root);
 for(const file of ['data-runtime.js','data/timetable.js','train-select.js',`${lang}/utility-data.js`,'utility-locale-runtime.js','yakei.js'])vm.runInContext(read(file),context,{filename:file});
 return{root,dom,options};
}
test('night-view results keep localized names, badges and summary across directions and daylight changes',()=>{
 for(const lang of Object.keys(names)){
  const{root,dom,options}=calculator(lang),doc=dom.window.document;assert.equal(options.lang,lang);
  assert.ok(doc.querySelector('#ykSummary').textContent.length>10);
  for(const direction of ['west','east']){
   const boardId=direction==='west'?'Tokyo':'Shin-Osaka';
   const trains=root.SHINKANSEN_TIMETABLE.trains.filter(t=>t.direction===direction&&t.times[boardId]);
   for(const targetHour of [6,17,21]){
    const train=trains.reduce((best,t)=>Math.abs(parseInt(t.times[boardId])-targetHour)<Math.abs(parseInt(best.times[boardId])-targetHour)?t:best,trains[0]);
    options.onSelect({tr:train},{boardId});
    const rows=[...doc.querySelectorAll('.yk-row')];assert.equal(rows.length,YAKEI_SPOT_IDS.length);
    for(const row of rows){assert.ok(names[lang].includes(row.querySelector('.yk-row-badge').textContent));assert.match(row.querySelector('.yk-row-time').textContent,/^\d{2}:\d{2}$/);assert.ok(row.querySelector('.yk-row-name').textContent);if(lang==='it')assert.match(row.querySelector('.yk-row-side').textContent,/^Lato del posto [AE]$/);if(lang==='th')assert.match(row.querySelector('.yk-row-side').textContent,/^ฝั่งที่นั่ง [AE]$/);}
    assert.ok(!/Sunset is|日の入り|Seat |Pick your train/.test(doc.querySelector('#ykSummary').textContent));
    doc.querySelector('#ykDate').value='2026-06-21';doc.querySelector('#ykDate').dispatchEvent(new dom.window.Event('change'));
    assert.equal(doc.querySelectorAll('.yk-row').length,YAKEI_SPOT_IDS.length);
    options.onChange();assert.equal(doc.querySelectorAll('.yk-row').length,0);
   }
  }
  dom.window.close();
 }
});

test('Italian and Thai night-view summaries cover daylight, darkness, transition and cleared selection',()=>{
 for(const [lang,copy] of Object.entries({it:{need:'Scegli il treno',light:'A quest’ora',dark:'L’intero tratto',mixed:'in poi viaggerai al buio'},th:{need:'เลือกขบวนรถไฟ',light:'ในเวลานี้',dark:'ตลอดช่วงทาง',mixed:'เป็นต้นไป จะเดินทางในช่วงฟ้ามืด'}})){
  const {root,dom,options}=calculator(lang),doc=dom.window.document;
  const train=root.SHINKANSEN_TIMETABLE.trains.find(t=>t.direction==='west'&&t.times.Tokyo);
  assert.ok(doc.querySelector('#ykSummary').textContent.includes(copy.need));
  for(const state of ['light','dark','mixed']){
   let index=0;
   // Isolate wording branches with daytime/nighttime passage times. The test
   // above retains real timetable interpolation and date-change coverage.
   root.MADO_TRAIN_SELECT.interpolateSpot=()=>state==='light'?720:state==='dark'?1260:(index++===0?720:1260);
   options.onSelect({tr:train},{boardId:'Tokyo'});
   const summary=doc.querySelector('#ykSummary');
   assert.ok(summary.textContent.includes(copy[state]),`${lang}/${state}: localized summary`);
   assert.match(summary.textContent,/\d{2}:\d{2}/);
   if(state==='dark')assert.ok(summary.textContent.includes(String(YAKEI_SPOT_IDS.length)));
   if(state==='mixed')assert.ok(summary.querySelector('strong'));
  }
  options.onChange();
  assert.ok(doc.querySelector('#ykSummary').textContent.includes(copy.need));
  assert.equal(doc.querySelectorAll('.yk-row').length,0);
  dom.window.close();
 }
});
