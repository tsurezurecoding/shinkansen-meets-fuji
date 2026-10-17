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
 assert(right.contains(doc.querySelector('#timelineSection')));
 assert.equal(doc.querySelector('#timeline').nextElementSibling.id,'timeline-calculation-note');
 assert(!left.querySelector('.train-entry-help'));
 assert(doc.querySelector('.sp-map-column').compareDocumentPosition(doc.querySelector('.sp-window-column'))&4);
 assert.equal(doc.querySelector('link[rel=canonical]').href,'https://www.michikusa-travel.com/start.html');
 assert(!/noindex/.test(doc.querySelector('meta[name=robots]')?.content||''));
});
test('JA-only markup and dependencies are removed before translating the existing shell',()=>{
 const stripped=stripJaTrainWindow(read('start.html'));
 assert(!stripped.includes('id="sp-view"'));
 assert(!stripped.includes('train-window-preview.js'));
 assert(!stripped.includes('timeline-calculation-note'));
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
