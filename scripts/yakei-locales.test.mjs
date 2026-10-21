import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {YAKEI_SPOT_IDS} from './shared/yakei-spots.mjs';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const names={de:['Dunkel','Dämmerung','Noch hell'],fr:['Nuit','Crépuscule','Encore jour'],'zh-Hant':['天黑','晨昏微光','天還亮'],es:['Noche','Crepúsculo','Todavía de día'],'zh-Hans':['天黑','晨昏微光','天还亮'],ko:['밤','어스름','아직 밝음']};
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
    for(const row of rows){assert.ok(names[lang].includes(row.querySelector('.yk-row-badge').textContent));assert.match(row.querySelector('.yk-row-time').textContent,/^\d{2}:\d{2}$/);assert.ok(row.querySelector('.yk-row-name').textContent);}
    assert.ok(!/Sunset is|日の入り|Seat |Pick your train/.test(doc.querySelector('#ykSummary').textContent));
    doc.querySelector('#ykDate').value='2026-06-21';doc.querySelector('#ykDate').dispatchEvent(new dom.window.Event('change'));
    assert.equal(doc.querySelectorAll('.yk-row').length,YAKEI_SPOT_IDS.length);
    options.onChange();assert.equal(doc.querySelectorAll('.yk-row').length,0);
   }
  }
  dom.window.close();
 }
});
