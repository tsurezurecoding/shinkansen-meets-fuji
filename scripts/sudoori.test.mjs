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
 assert.equal(w.document.getElementById('focus-name').textContent,'島本町');assert.equal(w.document.querySelector('.preview-number').textContent,'STORY 01');assert.equal(w.document.querySelector('.preview-picture img').getAttribute('src'),'../images/sudoori/shimamoto.jpg');
 const i=w.ROUTE.runs.findIndex(r=>r.key==='静岡県函南町');w.document.dispatchEvent(new w.CustomEvent('time-seek',{detail:{index:i}}));assert.equal(w.document.getElementById('focus-name').textContent,'函南町');assert(w.document.querySelector('.preview-go').href.endsWith('/stories/tanna.html'));assert.equal(JSON.parse(w.sessionStorage.getItem('sudoori-portal-v2')).id,'tanna');
 w.document.getElementById('time-toggle').click();assert(!w.document.getElementById('time-panel').hidden);w.document.getElementById('play').click();assert.equal(w.document.getElementById('follow').getAttribute('aria-pressed'),'true');w.document.getElementById('play').click();dom.window.close();
});
