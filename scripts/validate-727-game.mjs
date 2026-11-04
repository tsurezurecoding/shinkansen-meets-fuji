import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const route='artworks/727-hunt/index.html',dir=path.dirname(route);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context={window:{}};vm.runInNewContext(read(`${dir}/targets.js`),context);
const targets=context.window.TARGETS;
assert.equal(targets.length,25);assert.equal(new Set(targets.map(t=>t.id)).size,25);
const required=new Set([route,`${dir}/game.js`,`${dir}/game.css`,`${dir}/targets.js`,`${dir}/media/journey.mp4`]);
let end=0;
for(const t of targets){
 assert(t.sceneStart>=end-.001&&t.sceneEnd>t.sceneStart,`scene order: ${t.id}`);end=t.sceneEnd;
 assert(t.start>=t.sceneStart&&t.end<=t.sceneEnd&&t.end>t.start,`active interval: ${t.id}`);
 assert(t.track.length>=2&&t.track.every(f=>f.length===5&&f.every(Number.isFinite)&&f[3]>0&&f[4]>0),`trajectory: ${t.id}`);
 assert(t.track.every((f,i)=>i===0||f[0]>t.track[i-1][0]),`monotonic trajectory: ${t.id}`);
 for(const [a,b]of t.occluded||[])assert(b>a&&a>=t.sceneStart&&b<=t.sceneEnd);
 assert(/^media\/poster-\d{2}\.jpg$/.test(t.poster));required.add(`${dir}/${t.poster}`);
}
assert(Math.abs(end-150.3)<.001);
const html=read(route);assert(!html.includes('.codex-local')&&!html.includes('sign-hunt-727-long'));
assert.match(html,/href="\.\.\/\.\.\/727-collection\.html#collectionListTitle"/);
assert.match(html,/id="show-hitbox"/);assert.match(html,/preload="metadata"/);
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 const ref=match[1];if(/^(?:https?:|data:|#)/.test(ref))continue;
 const resolved=path.resolve(root,dir,ref.split(/[?#]/)[0]);
 assert(resolved.startsWith(root+path.sep)&&fs.existsSync(resolved),`missing page dependency: ${ref}`);
}
const manifest=JSON.parse(read('content-manifest.json'));
const files=new Set(manifest.files.map(f=>typeof f==='string'?f:f.path));
for(const p of required){assert(fs.statSync(path.join(root,p)).size>0,`empty: ${p}`);assert(files.has(p),`not distributed: ${p}`);}
assert.match(read('727-collection.html'),/artworks\/727-hunt\/index\.html/);
assert.match(read('window-artworks.html'),/data-artwork="727-hunt"/);
const work=JSON.parse(read('data/window-artworks.json')).works.find(w=>w.id==='727-hunt');
assert.equal(work.route,route);assert.deepEqual(work.languages,['ja']);assert.equal(work.webOnly,true);
assert(!read('en/window-artworks.html').includes('data-artwork="727-hunt"'));
console.log('727 game: 25 trajectories, media inventory, local dependencies, collection/artworks entries and Japanese Web-only scope passed.');
