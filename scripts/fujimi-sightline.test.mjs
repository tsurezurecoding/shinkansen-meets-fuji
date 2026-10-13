import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { fujimiSightlineHTML } from './shared/fujimi-sightline.mjs';

const code = fs.readFileSync(new URL('../fujimi-sightline.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(factory) {
  const dom = new JSDOM(fujimiSightlineHTML({id:'edo-castle-fujimi-yagura'},'ja','../'), {runScripts:'outside-only', url:'https://example.com/spots/edo-castle-fujimi-yagura.html'});
  dom.window.createFujimiStage = factory;
  dom.window.eval(code);
  const find = selector => dom.window.document.querySelector(selector);
  return {dom,find};
}
test('no model, engine or video request until the reader opens it', () => {
  let calls=0;
  const {dom,find}=setup(()=>{calls++;});
  assert.equal(calls,0);
  assert.equal(find('video').getAttribute('src'),null);
  assert.equal(find('#fujimi-sightline-model').hidden,true);
  assert.equal(dom.window.document.querySelector('head script'),null);
  dom.window.close();
});
test('close releases the model and a late model from a cancelled open is destroyed', async () => {
  let finish, destroyed=0;
  const {dom,find}=setup(()=>new Promise(resolve=>{finish=resolve;}));
  find('[data-fujimi-open]').click(); await tick();
  find('[data-fujimi-close]').click();
  finish({destroy(){destroyed++;}}); await tick();
  assert.equal(destroyed,1);
  assert.equal(find('#fujimi-sightline-model').hidden,true);
  assert.equal(find('[data-fujimi-open]').disabled,false);
  dom.window.close();
});
test('failed external 3D retains photo and allows retry, then close destroys the viewer', async () => {
  let calls=0,destroyed=0;
  const {dom,find}=setup(async()=>{if(++calls===1) throw new Error('offline');return {destroy(){destroyed++;},setView(){}};});
  find('[data-fujimi-open]').click();await tick();
  assert.match(find('[data-fujimi-status]').textContent,/読み込めませんでした/);
  assert.equal(find('[data-fujimi-open]').disabled,false);
  assert(find('.fujimi-sightline-photo img'));
  find('[data-fujimi-open]').click();await tick();
  assert.equal(find('[data-fujimi-view]').disabled,false);
  find('[data-fujimi-close]').click();
  assert.equal(destroyed,1);
  assert.equal(find('[data-fujimi-open]').getAttribute('aria-expanded'),'false');
  dom.window.close();
});
test('a late error from the cancelled session does not close a newer session', async () => {
  const sessions=[];
  const {dom,find}=setup(async(_host,options)=>{sessions.push(options);return {destroy(){},setView(){}};});
  find('[data-fujimi-open]').click();await tick();find('[data-fujimi-close]').click();
  find('[data-fujimi-open]').click();await tick();sessions[0].onError();
  assert.equal(find('#fujimi-sightline-model').hidden,false);
  sessions[1].onError();assert.equal(find('#fujimi-sightline-model').hidden,true);
  dom.window.close();
});
test('view buttons report their selection and unload disposes the active model', async () => {
  let selected,destroyed=0;
  const {dom,find}=setup(async()=>({setView(view){selected=view;},destroy(){destroyed++;}}));
  find('[data-fujimi-open]').click();await tick();find('[data-fujimi-view="top"]').click();
  assert.equal(selected,'top');assert.equal(find('[data-fujimi-view="top"]').getAttribute('aria-pressed'),'true');
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));assert.equal(destroyed,1);
  dom.window.close();
});
