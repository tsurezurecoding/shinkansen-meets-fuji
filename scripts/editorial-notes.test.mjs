import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { editorial, renderEditorialNote, appendArticleEditorialNote, utilityEditorialNotes } from './shared/editorial-notes.mjs';
const read = file => fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const pairs = Object.entries(editorial.notes).flatMap(([lang,notes])=>Object.entries(notes).map(([id,note])=>({lang,id,note})));
const expectedModal = {de:['fuji','fujitec-big-wing'],fr:['fuji'],'zh-Hans':['fujitec-big-wing','toji'],'zh-Hant':['fujitec-big-wing','toji'],ko:['pocari-fukuroi']};
test('seven approved stories remain nine explicitly scoped locale/spot pairs',()=>{
 assert.equal(pairs.length,9);assert.equal(new Set(pairs.map(p=>p.note.theme)).size,7);
 for(const lang of ['ja','en','es','ar']){assert.equal(renderEditorialNote(lang,'fuji'),'');assert.deepEqual(utilityEditorialNotes(lang,[]),{});}
 for(const [lang,ids] of Object.entries(expectedModal))assert.deepEqual(Object.keys(utilityEditorialNotes(lang,ids)).sort(),ids.slice().sort());
 assert.throws(()=>utilityEditorialNotes('ko',[]),/Unknown utility/);
});
test('article sections retain attribution, date and classification through regeneration',()=>{
 for(const p of pairs.filter(p=>p.note.article)){
  const dom=new JSDOM('<article class="spot-page-article"><p id="original">Existing article body.</p></article>'),doc=dom.window.document;
  appendArticleEditorialNote(doc,p.lang,p.note.article);const first=doc.body.innerHTML;
  appendArticleEditorialNote(doc,p.lang,p.note.article);assert.equal(doc.body.innerHTML,first);assert.equal(doc.querySelectorAll('[data-editorial-note]').length,1);assert.equal(doc.querySelector('#original').textContent,'Existing article body.');
  const block=doc.querySelector('[data-editorial-note]');assert.equal(block.lang,p.lang);assert.ok(block.textContent.includes('2026-10-12'));assert.equal(block.querySelectorAll('[data-editorial-kind]').length,p.note.paragraphs.length);
  assert.ok([...block.querySelectorAll('a')].every(a=>a.href.startsWith('https://')&&a.rel.includes('noopener')));dom.window.close();
 }
});
test('actual generated articles and utility payloads keep notes separate from dictionaries/narrations',()=>{
 const app=read('app.js'),fn=app.slice(app.indexOf('function editorialNoteHTML('),app.indexOf('function spotDetailModalHTML('));
 for(const p of pairs.filter(p=>p.note.article)){const dom=new JSDOM(read(p.lang+'/'+p.note.article));const block=dom.window.document.querySelector('article [data-editorial-note]');assert.equal(block?.getAttribute('data-editorial-note'),p.note.id);assert.ok(block.textContent.includes(p.note.heading));dom.window.close();}
 for(const lang of ['de','es','fr','zh-Hans','zh-Hant','ko']){
  const ctx={window:{}};vm.runInNewContext(read(lang+'/utility-data.js'),ctx);const payload=ctx.window.MADO_UTILITY_PAYLOAD;
  assert.deepEqual(Object.keys(payload.editorialNotes||{}).sort(),(expectedModal[lang]||[]).slice().sort());
  assert.ok(!JSON.stringify(payload.narrations).includes('data-editorial-note'));
  const c={window:{MADO_UTILITY_LOCALE:{lang,editorialNotes:payload.editorialNotes||{}}},lang};vm.createContext(c);vm.runInContext(fn,c);
  for(const id of expectedModal[lang]||[])assert.equal(vm.runInContext('editorialNoteHTML({id:'+JSON.stringify(id)+'})',c),renderEditorialNote(lang,id));
  c.lang='ja';assert.equal(vm.runInContext('editorialNoteHTML({id:"fuji"})',c),'');
 }
});
test('historical and exhibition boundaries stay in the approved note copy',()=>{
 const de=renderEditorialNote('de','fujitec-big-wing');assert.match(de,/1999/);assert.match(de,/19 Aufzügen/);assert.match(de,/2006/);
 for(const lang of ['zh-Hans','zh-Hant']){const text=renderEditorialNote(lang,'toji');assert.match(text,/5幅/);assert.match(text,/公開時間未定|公开时间未定/);}
 assert.ok(!renderEditorialNote('ko','pocari-fukuroi').includes('1위'));
 assert.ok(renderEditorialNote('de','fuji').includes('China und den Niederlanden'));
});
