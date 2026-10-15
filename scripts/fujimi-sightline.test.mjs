import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { fujimiSightlineHTML } from './shared/fujimi-sightline.mjs';
const code = fs.readFileSync(new URL('../fujimi-sightline.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
async function setup(factory, connection) {
  const html='<div class="spot-page-shell"><article><section id="story">本文</section><section class="spot-static-map">地図</section><section id="references">出典</section></article></div>'+fujimiSightlineHTML({id:'edo-castle-fujimi-yagura'},'ja','../');
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.com/spots/edo-castle-fujimi-yagura.html'});
  let callback;
  dom.window.IntersectionObserver=class {constructor(fn){callback=fn;}observe(){}disconnect(){}};
  if(connection)Object.defineProperty(dom.window.navigator,'connection',{value:connection});
  dom.window.MADO_SPOT_PAGE_READY=Promise.resolve();dom.window.createFujimiStage=factory;dom.window.eval(code);await tick();
  return {dom,find:s=>dom.window.document.querySelector(s),near:async value=>{callback([{isIntersecting:value}]);await tick();}};
}
test('3D opens only by explicit click, even after scrolling near; chapter and traffic note precede map',async()=>{
  let calls=0;
  const {dom,find,near}=await setup(async()=>{calls++;return {destroy(){},setActive(){}};});
  assert.equal(find('[data-fujimi-sightline]').nextElementSibling,find('.spot-static-map'));
  assert.equal(find('[data-fujimi-sightline] img'),null);
  assert.equal(find('#fujimi-sightline-model').hidden,true);
  assert.match(find('#fujimi-sightline-traffic').textContent,/20〜60MB/);
  assert.equal(find('[data-fujimi-view]'),null);assert.equal(calls,0);
  await near(true);await near(false);await near(true);assert.equal(calls,0);
  find('[data-fujimi-open]').click();await tick();assert.equal(calls,1);
  assert.equal(find('#fujimi-sightline-model').hidden,false);assert.equal(find('[data-fujimi-open]').getAttribute('aria-expanded'),'true');dom.window.close();
});
test('data saver and 2g keep the chapter visible but require an explicit load',async()=>{
  for(const connection of [{saveData:true},{effectiveType:'2g'},{effectiveType:'slow-2g'}]){
    let calls=0;const {dom,find,near}=await setup(async()=>{calls++;return {destroy(){}};},connection);
    await near(true);assert.equal(calls,0);assert.equal(find('[data-fujimi-open]').hidden,false);
    find('[data-fujimi-open]').click();await tick();assert.equal(calls,1);dom.window.close();
  }
});
test('network failure leaves article and chapter intact, does not repeatedly retry on scroll, and supports manual retry',async()=>{
  let calls=0;const {dom,find,near}=await setup(async()=>{if(++calls===1)throw Error('offline');return {destroy(){}};});
  await near(true);find('[data-fujimi-open]').click();await tick();assert.match(find('[data-fujimi-status]').textContent,/読み込めませんでした/);
  assert(find('#story'));assert.equal(find('#fujimi-sightline-model').hidden,false);
  await near(false);await near(true);assert.equal(calls,1);
  find('[data-fujimi-open]').click();await tick();assert.equal(calls,2);assert.equal(find('[data-fujimi-reset]').disabled,false);dom.window.close();
});
test('offscreen/background viewers pause and pagehide destroys; BFCache restores a new session safely',async()=>{
  const states=[],sessions=[];let destroyed=0;
  const {dom,find,near}=await setup(async(_host,options)=>{sessions.push(options);return {setActive:v=>states.push(v),destroy(){destroyed++;}};});
  await near(true);find('[data-fujimi-open]').click();await tick();assert.equal(states.at(-1),true);await near(false);assert.equal(states.at(-1),false);
  await near(true);Object.defineProperty(dom.window.document,'hidden',{value:true,configurable:true});dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));assert.equal(states.at(-1),false);
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));assert.equal(destroyed,1);
  Object.defineProperty(dom.window.document,'hidden',{value:false,configurable:true});
  dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pageshow',{persisted:true}));await near(true);assert.equal(sessions.length,1);assert.equal(find('#fujimi-sightline-model').hidden,true);find('[data-fujimi-open]').click();await tick();assert.equal(sessions.length,2);
  sessions[0].onError();assert.equal(destroyed,1);dom.window.close();
});
test('a model resolving after pagehide is disposed instead of attached',async()=>{
  let finish,destroyed=0;const {dom,find,near}=await setup(()=>new Promise(r=>{finish=r;}));await near(true);find('[data-fujimi-open]').click();await tick();
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));finish({destroy(){destroyed++;}});await tick();assert.equal(destroyed,1);dom.window.close();
});
test('reset, zoom and keyboard commands reach the interactive viewer',async()=>{
  let resets=0;const zooms=[],keys=[];const {dom,find,near}=await setup(async()=>({destroy(){},resetView(){resets++;},zoom:v=>zooms.push(v),key:v=>{keys.push(v);return v==='ArrowLeft';}}));
  await near(true);find('[data-fujimi-open]').click();await tick();find('[data-fujimi-reset]').click();find('[data-fujimi-zoom="in"]').click();find('[data-fujimi-zoom="out"]').click();
  const arrow=new dom.window.KeyboardEvent('keydown',{key:'ArrowLeft',cancelable:true});find('[data-fujimi-stage]').dispatchEvent(arrow);
  assert.equal(resets,1);assert.deepEqual(zooms,[1,-1]);assert.deepEqual(keys,['ArrowLeft']);assert.equal(arrow.defaultPrevented,true);dom.window.close();
});
