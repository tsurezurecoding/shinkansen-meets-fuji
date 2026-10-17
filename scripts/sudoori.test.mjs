import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {JSDOM} from 'jsdom';
import locales from '../locales.js';
const root=new URL('../',import.meta.url),pages=JSON.parse(fs.readFileSync(new URL('data/sudoori/pages.json',root),'utf8'));
test('Japanese municipality articles have complete public links, metadata and permissions',()=>{
 for(const p of pages){const dom=new JSDOM(fs.readFileSync(new URL(p.route,root),'utf8')),d=dom.window.document;
  assert.deepEqual(locales.supported(p.route),['ja']);assert.equal(d.querySelector('link[rel=canonical]').href,'https://www.michikusa-travel.com/'+p.route);
  assert(!d.querySelector('meta[name=robots]').content.includes('noindex'));assert(!d.querySelector('.prototype-note'));assert(!d.querySelector('.lang-switch a'));
  for(const el of d.querySelectorAll('[src],link[href],a[href]')){const h=el.getAttribute('src')||el.getAttribute('href');if(!h||/^(https?:|mailto:|data:)/.test(h))continue;const url=new URL(h,'https://www.michikusa-travel.com/'+p.route);assert(fs.existsSync(new URL(url.pathname.slice(1),root)),p.route+' missing '+h);}
  dom.window.close();
 }
 const data=JSON.parse(fs.readFileSync(new URL('data/sudoori/route.json',root),'utf8'));assert.equal(data.towns.length,75);assert.equal(data.towns.find(t=>t.key==='大阪府島本町').mascot.image,undefined);assert(!fs.existsSync(new URL('images/sudoori/mascots/mizumaro.png',root)));
});
test('Field guide priority and municipality entry are Japanese-only',()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('zukan.html',root),'utf8')),cards=[...dom.window.document.querySelectorAll('.journey-intent-card')];
 assert.deepEqual(cards.slice(0,5).map(c=>c.getAttribute('href')),['guide.html','castles.html','arenani.html','727-collection.html','yakei.html']);assert.equal(cards.at(-1).getAttribute('href'),'sudoori/index.html');dom.window.close();
 const en=fs.readFileSync(new URL('en/zukan.html',root),'utf8');assert(!en.includes('data-cta-id="sudoori"'));assert(!en.includes('素通りの街'));
});
test('Public portal starts at Shimamoto and keeps article, time and return state aligned',()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('sudoori/index.html',root),'utf8'),{url:'https://www.michikusa-travel.com/sudoori/index.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 for(const file of ['route.js','portal.js','time.js'])w.eval(fs.readFileSync(new URL('sudoori/assets/'+file,root),'utf8'));
 assert.equal(w.document.getElementById('focus-name').textContent,'島本町');assert.equal(w.document.querySelector('.preview-number').textContent,'STORY 01');assert.equal(w.document.querySelector('.preview-picture img').getAttribute('src'),'../images/20260924_yamazaki-distillery_6867_michikusa.jpg');assert(w.document.querySelector('.preview-credit').textContent.includes('michikusa'));assert(!w.document.querySelector('.preview-credit a'));
 const i=w.ROUTE.runs.findIndex(r=>r.key==='静岡県函南町');w.document.dispatchEvent(new w.CustomEvent('time-seek',{detail:{index:i}}));assert.equal(w.document.getElementById('focus-name').textContent,'函南町');assert(w.document.querySelector('.preview-go').href.endsWith('/stories/tanna.html'));assert.equal(JSON.parse(w.sessionStorage.getItem('sudoori-portal-v2')).id,'tanna');
 assert(!w.document.getElementById('time-panel').hidden);w.document.getElementById('time-toggle').click();assert(w.document.getElementById('time-panel').hidden);w.document.getElementById('time-toggle').click();assert(!w.document.getElementById('time-panel').hidden);w.document.getElementById('play').click();assert.equal(w.document.getElementById('follow').getAttribute('aria-pressed'),'true');w.document.getElementById('play').click();dom.window.close();
});

test('Overview starts wide and every municipality keeps map, card and time aligned',()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('sudoori/index.html',root),'utf8'),{url:'https://www.michikusa-travel.com/sudoori/index.html?view=time',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let zooms=0,fits=0;const layer=()=>({addTo(){return this},on(){return this},bindTooltip(){return this},setStyle(){},setLatLng(){},setIcon(){}});
 w.L={map:()=>({fitBounds(){fits++},setView(){zooms++},on(){},panTo(){}}),control:{zoom:()=>layer()},tileLayer:layer,polyline:layer,circleMarker:layer,marker:layer,divIcon:x=>x};
 for(const f of ['route.js','portal.js','time.js'])w.eval(fs.readFileSync(new URL('sudoori/assets/'+f,root),'utf8'));
 assert.equal(fits,1);assert.equal(zooms,0);assert(!d.getElementById('time-panel').hidden);
 for(const town of w.ROUTE.towns){const i=w.ROUTE.runs.findIndex(r=>r.key===town.key);d.dispatchEvent(new w.CustomEvent('time-seek',{detail:{index:i}}));assert.equal(d.getElementById('focus-name').textContent,town.name);assert.equal(d.getElementById('time-town').value,town.key);assert(d.getElementById('story-preview').textContent.includes(town.name));if(!['島本町','函南町','西尾市','関ケ原町'].includes(town.name)){assert(!d.querySelector('.preview-go'));assert(!d.querySelector('.preview-number'));}}
 const slider=d.getElementById('progress');slider.value=0;slider.dispatchEvent(new w.Event('input'));assert(d.getElementById('story-preview').textContent.includes('千代田区'));assert(!d.querySelector('.preview-number'));
 const before=zooms;d.getElementById('time-toggle').click();d.getElementById('time-toggle').click();assert.equal(zooms,before);d.getElementById('play').click();assert.equal(zooms,before+1);d.getElementById('play').click();dom.window.close();
});
