import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { editorial, renderEditorialNote, appendArticleEditorialNote, utilityEditorialNotes, articleConnections, renderArticleConnections } from './shared/editorial-notes.mjs';
import { episodes, supported, translated, castles } from './shared/locales.mjs';
import { renderSiteRuntimeForValidation } from './shared/site-runtime-validation.mjs';
const read = file => fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const appDir = fileURLToPath(new URL('../',import.meta.url));
const page = relative => renderSiteRuntimeForValidation({appDir,html:read(relative),relative}).dom;
const pairs = Object.entries(editorial.notes).flatMap(([lang,notes])=>Object.entries(notes).map(([id,note])=>({lang,id,note})));
const expectedModal = {de:['fuji','fujitec-big-wing'],fr:['fuji'],'zh-Hans':['fujitec-big-wing','toji'],'zh-Hant':['fujitec-big-wing','toji'],ko:['pocari-fukuroi']};
test('seven approved stories remain nine explicitly scoped locale/spot pairs',()=>{
 assert.equal(pairs.length,9);assert.equal(new Set(pairs.map(p=>p.note.theme)).size,7);
 for(const lang of ['ja','en','es','ar']){assert.equal(renderEditorialNote(lang,'fuji'),'');assert.deepEqual(utilityEditorialNotes(lang,[]),{});}
 for(const [lang,ids] of Object.entries(expectedModal))assert.deepEqual(Object.keys(utilityEditorialNotes(lang,ids)).sort(),ids.slice().sort());
 assert.throws(()=>utilityEditorialNotes('ko',[]),/Unknown utility/);
});
test('article sections retain attribution, date and classification through regeneration',()=>{
 for(const p of pairs.filter(p=>p.note.article&&!['fujitec-big-wing','pocari-fukuroi'].includes(p.id))){
  const dom=new JSDOM('<article class="spot-page-article"><p id="original">Existing article body.</p></article>'),doc=dom.window.document;
  appendArticleEditorialNote(doc,p.lang,p.note.article);const first=doc.body.innerHTML;
  appendArticleEditorialNote(doc,p.lang,p.note.article);assert.equal(doc.body.innerHTML,first);assert.equal(doc.querySelectorAll('[data-editorial-note]').length,1);assert.equal(doc.querySelector('#original').textContent,'Existing article body.');
  const block=doc.querySelector('[data-editorial-note]');assert.equal(block.lang,p.lang);assert.ok(block.textContent.includes('2026-10-12'));assert.equal(block.querySelectorAll('[data-editorial-kind]').length,p.note.paragraphs.length);
  assert.ok([...block.querySelectorAll('a')].every(a=>a.href.startsWith('https://')&&a.rel.includes('noopener')));dom.window.close();
 }
});
test('actual generated articles and utility payloads keep notes separate from dictionaries/narrations',()=>{
 const app=read('app.js'),fn=app.slice(app.indexOf('function editorialNoteHTML('),app.indexOf('function spotDetailModalHTML('));
 for(const p of pairs.filter(p=>p.note.article)){const dom=page(p.lang+'/'+p.note.article);const block=dom.window.document.querySelector('article [data-editorial-note], article [data-article-connections]');assert.ok(block);if(block.hasAttribute('data-editorial-note')){assert.equal(block.getAttribute('data-editorial-note'),p.note.id);assert.ok(block.textContent.includes(p.note.heading));}else assert.equal(block.getAttribute('data-article-connections'),p.id);dom.window.close();}
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

test('article stories follow the photo and first chapter, and the logo retains its glyph',async()=>{
 for(const p of pairs){
  assert.ok(p.note.article, p.note.id + ' needs an article');
  const dom=page(p.lang+'/'+p.note.article),doc=dom.window.document;
  const article=doc.querySelector('article.spot-page-article'),note=article.querySelector('[data-editorial-note], [data-article-connections]');
  assert.ok(article.querySelector('.spot-page-section').compareDocumentPosition(note)&4);
  assert.equal(doc.querySelector('.brand-mark').textContent,'窓');
  dom.window.close();
 }
 for(const lang of translated)for(const route of castles){
  const dom=page(lang+'/'+route);assert.equal(dom.window.document.querySelector('.brand-mark').textContent,'窓');dom.window.close();await new Promise(setImmediate);
 }
});

test('all episode articles have matching routes, menus, reciprocal metadata and distribution',async()=>{
 const manifest=JSON.parse(read('content-manifest.json')),sitemap=read('sitemap.xml'),metadata=JSON.parse(read('scripts/content-metadata.json'));
 let count=0;
 for(const [route,langs]of Object.entries(episodes))for(const lang of langs){
  count++;
  const file=lang+'/'+route,dom=page(file),doc=dom.window.document;
  if(route==='yakei.html'){
   assert.equal(doc.querySelector('style[data-localized-night-hero]'),null);
   assert.ok(doc.querySelector('link[href*="yakei.css"]'));
   const cssDom=new JSDOM(`<style>${read('yakei.css')}</style>`);
   const heroRule=[...cssDom.window.document.styleSheets[0].cssRules].find(rule=>rule.selectorText==='.yk-hero::before');
   assert.ok(heroRule,'shared stylesheet must contain the photograph rule');
   assert.match(heroRule.style.getPropertyValue('background-image'),/20260629_2158_nagoya_station_night_michikusa\.jpg/);
   cssDom.window.close();
   assert.ok(doc.querySelector('.yk-hero-credit').textContent.includes('Shinkansen Window'));
  }
  assert.equal(doc.documentElement.lang,lang);
  if(metadata[file]?.article){
   const nodes=[...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(el=>{const json=JSON.parse(el.textContent);return json['@graph']||[json];});
   const article=nodes.find(node=>node['@type']==='Article');assert.ok(article);
   assert.equal(article.inLanguage,lang);assert.equal(article.publisher.name,'Shinkansen Window');
  }
  const canonicalRoute=route==='spots/ibuki-seat-a.html'?'spots/ibuki.html':route;
  assert.equal(doc.querySelector('link[rel="canonical"]').href,'https://www.michikusa-travel.com/'+lang+'/'+canonicalRoute);
  assert.ok(sitemap.includes('/'+lang+'/'+canonicalRoute+'</loc>'));
  if(canonicalRoute!==route)assert.ok(!sitemap.includes('/'+file+'</loc>'));
  assert.ok(manifest.files.some(f=>(typeof f==='string'?f:f.path)===file));
  dom.window.eval(read('locales.js'));dom.window.eval(read('article-locales.js'));doc.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  assert.deepEqual([...doc.querySelectorAll('.article-lang-menu a')].map(a=>a.lang),supported(route));
  for(const edition of supported(route)){
   // Metadata is enough for this reciprocal check; repeatedly constructing the
   // same large article DOM for every language exhausted the Node heap.
   const counterpart=read((edition==='ja'?'':edition+'/')+canonicalRoute);
   const links=[...counterpart.matchAll(/<link\b[^>]*>/g)].filter(match=>new RegExp(`\\bhreflang="${lang}"`).test(match[0]));
   assert.equal(links.length,1,`${file}: ${edition}/${canonicalRoute} has duplicate/missing ${lang} alternate`);
  }
  dom.window.close();await new Promise(setImmediate);
 }
 assert.equal(count,208);
});

test('Fujitec and Pocari have complete ten-language articles and worldwide chapters',()=>{
 const langs=['ja','en',...translated];
 for(const id of ['fujitec-big-wing','pocari-fukuroi']){
  assert.equal(supported('spots/'+id+'.html').length,10);
  for(const lang of langs){
   const dom=page((lang==='ja'?'':lang+'/')+'spots/'+id+'.html');
   const doc=dom.window.document,block=doc.querySelector('[data-article-connections]');
   assert.equal(block?.lang,lang);assert.equal(doc.querySelectorAll('[data-article-connections]').length,1);
   assert.equal(block.querySelector('h2').textContent,articleConnections[lang][id==='fujitec-big-wing'?'fujitec':'pocari'][0]);
   assert.ok(doc.querySelector('.spot-page-section').compareDocumentPosition(block)&4);
   const expected=new JSDOM(renderArticleConnections(lang,id));
   assert.equal(block.outerHTML,expected.window.document.body.firstElementChild.outerHTML);expected.window.close();
   if(id==='fujitec-big-wing'){assert.match(block.textContent,/1999/);assert.match(block.textContent,/2006/);assert.equal(block.querySelectorAll('h3').length,2);}
   assert.equal(doc.querySelector('.brand-mark').textContent,'窓');dom.window.close();
  }
 }
});

test('guide language menus preserve every destination independently of body link localization',()=>{
 const editions=supported('guide.html');
 for(const lang of editions){
  const file=(lang==='ja'?'':lang+'/')+'guide.html',dom=page(file);
  const links=[...dom.window.document.querySelectorAll('.guide-lang-options a')];assert.equal(links.length,editions.length,lang+': language menu count');
  const destinations=links.map(a=>a.href);assert.equal(new Set(destinations).size,editions.length,lang+': duplicate language destination');
  for(const edition of editions){
   const expectedPath='/'+(edition==='ja'?'':edition+'/')+'guide.html';
   const matches=links.filter(a=>new URL(a.href).pathname===expectedPath);assert.equal(matches.length,1,lang+'/'+edition+': destination count');
   const url=new URL(matches[0].href);if(edition==='ja')assert.equal(url.searchParams.get('lang'),'ja',lang+': Japanese route query');else assert.equal(url.search,'',lang+'/'+edition+': unexpected route query');
  }
  dom.window.close();
 }
});

test('episode articles preserve English gallery images and original attribution',async()=>{
 let images=0;
 for(const [route,langs]of Object.entries(episodes)){
  const source=page('en/'+route);
  const media=doc=>[...doc.querySelectorAll('[data-gallery-thumb]')].map(el=>Object.fromEntries(['data-gallery-src','data-gallery-credit','data-gallery-credit-href'].map(a=>[a,el.getAttribute(a)])));
  const original=media(source.window.document);
  const figures=doc=>[...doc.querySelectorAll('article img')].map(el=>({src:el.getAttribute('data-photo-original-src') || el.getAttribute('src'),width:el.getAttribute('width'),height:el.getAttribute('height')}));
  const figureCredits=doc=>[...doc.querySelectorAll('.yk-figure figcaption')].map(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('.yk-day-note').forEach(n=>n.remove());return copy.textContent.replace(/^摄影[：:]|^사진\s*[：:]|^Photo\s*:|^Foto:|^照片：|^照片:|^攝影：|^写真：|^ภาพ\s*:/,'').trim();});
  assert.ok(original.length || figures(source.window.document).length || ['everyday-japan.html','arenani.html','727-collection.html','tokyo-kyoto-stations.html'].includes(route));
  const inline=doc=>[...doc.querySelectorAll('.spot-page-inline-figure img, .spot-page-reference-figure img')].map(el=>el.getAttribute('data-photo-original-src') || el.getAttribute('src'));
  const credit=doc=>[...doc.querySelectorAll('.spot-page-inline-figure figcaption a, .spot-page-reference-figure figcaption a')].map(el=>({href:el.getAttribute('href'),label:el.textContent}));
  for(const lang of langs){const dom=page(lang+'/'+route);assert.deepEqual(media(dom.window.document),original);assert.deepEqual(inline(dom.window.document),inline(source.window.document));assert.deepEqual(credit(dom.window.document),credit(source.window.document));assert.deepEqual(figures(dom.window.document),figures(source.window.document));assert.deepEqual(figureCredits(dom.window.document),figureCredits(source.window.document));images+=original.length+figures(source.window.document).length;dom.window.close();await new Promise(setImmediate);}
  source.window.close();await new Promise(setImmediate);
 }
 assert.ok(images>=30);
});
