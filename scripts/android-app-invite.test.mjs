import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {inviteRuntime,withAndroidAppInvite,withPageAndroidAppInvite,invitePageConfig} from './shared/android-app-invite.mjs';
const DAY=86400000,KEY='mado-android-app-invite-v2';
const ua='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
async function fixture({agent=ua,apps=[],api=true,state,language='ja',disabled=false,url='https://michikusa-travel.com/',native=false,standalone=false,throwStorage=false}={}){
 const dom=new JSDOM('<html><body><main><h1>Title</h1><input id="edit"></main></body></html>',{url,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let now=1700000000000,callback;const events=[];
 Object.defineProperty(w.navigator,'userAgent',{value:agent});Object.defineProperty(w,'isSecureContext',{value:true});
 w.matchMedia=()=>({matches:standalone,addEventListener(){}});w.MADO_NATIVE_APP=native;
 w.IntersectionObserver=class{constructor(cb){callback=cb;}observe(){}disconnect(){}};
 w.HTMLElement.prototype.getBoundingClientRect=function(){return this.id==='android-app-invite'?{left:0,right:310,top:0,bottom:173,width:310,height:173}:{left:0,right:0,top:0,bottom:0,width:0,height:0};};
 w.Date.now=()=>now;w.MADO_ANALYTICS_DISABLED=disabled;w.gtag=(...args)=>events.push(args);
 if(api)w.navigator.getInstalledRelatedApps=async()=>{if(apps instanceof Error)throw apps;return apps;};
 if(state!==undefined)w.localStorage.setItem(KEY,typeof state==='string'?state:JSON.stringify(state));
 if(throwStorage)w.Storage.prototype.setItem=()=>{throw Error('denied');};
 w.eval(inviteRuntime({language,pageContext:'landing',assetPrefix:''}));
 await new Promise(r=>setTimeout(r,5));
 return {w,dom,events,card:w.document.querySelector('#android-app-invite'),seen:(ratio=1)=>callback([{isIntersecting:ratio>0,intersectionRatio:ratio}]),now:v=>{now=v;},refresh:()=>w.dispatchEvent(new w.StorageEvent('storage',{key:KEY})),close:()=>w.close()};
}
for(const [label,apps,api,expected] of [['empty',[],true,'not-detected'],['other package',[{platform:'play',id:'other'}],true,'not-detected'],['unsupported',[],false,'unsupported'],['exception',new Error('failure'),true,'error'],['invalid',null,true,'error']])test('unknown eligible: '+label,async()=>{const f=await fixture({apps,api});try{assert.equal(f.card.hidden,false);f.seen();assert.equal(f.events[0][2].install_status,expected);assert.equal(f.w.localStorage.getItem(KEY),null);}finally{f.close();}});
test('positive installation hidden without flash or persistence',async()=>{const f=await fixture({apps:[{platform:'play',id:'com.michikusatravel.shinkansenwindow'}]});try{assert.equal(f.card.hidden,true);f.seen();assert.equal(f.events.length,0);assert.equal(f.w.localStorage.getItem(KEY),null);}finally{f.close();}});
for(const agent of ['Mozilla/5.0 Windows Chrome/130.0','iPhone Safari/17.0',ua+' wv',ua+' Version/4.0',ua+' Instagram'])test('browser exclusion '+agent,async()=>{const f=await fixture({agent});try{assert.equal(f.card,null);}finally{f.close();}});
for(const opts of [{native:true},{standalone:true},{url:'https://michikusa-travel.com/?from=android-app'},{throwStorage:true},{state:'{'},{state:{v:2,dismissedAt:Infinity}}])test('exclusion/storage safety '+JSON.stringify(opts),async()=>{const f=await fixture(opts);try{assert.equal(f.card,null);}finally{f.close();}});
test('dismiss immediately, reload, shared pages/tabs and exact 14-day boundary',async()=>{
 const f=await fixture();try{f.card.querySelector('button').click();assert.equal(f.card.hidden,true);const state=JSON.parse(f.w.localStorage.getItem(KEY));assert.deepEqual(state,{v:2,dismissedAt:1700000000000});assert.match(f.w.document.querySelector('[role=status]').textContent,/14/);
 const reload=await fixture({state,language:'en',url:'https://michikusa-travel.com/en/guide.html'});try{assert.equal(reload.card.hidden,true);reload.now(state.dismissedAt+14*DAY-1);reload.refresh();assert.equal(reload.card.hidden,true);reload.now(state.dismissedAt+14*DAY);reload.refresh();assert.equal(reload.card.hidden,false);reload.w.localStorage.setItem(KEY,JSON.stringify({v:2,dismissedAt:state.dismissedAt+14*DAY}));reload.refresh();assert.equal(reload.card.hidden,true);reload.w.localStorage.removeItem(KEY);reload.refresh();assert.equal(reload.card.hidden,false);}finally{reload.close();}
 }finally{f.close();}
});
test('Play click is not install, view once, consent gate and fixed bounded metadata',async()=>{
 const f=await fixture({url:'https://michikusa-travel.com/?invite=force&email=secret'});try{f.seen(.4);assert.equal(f.events.length,0);f.seen();f.seen();assert.equal(f.events.length,1);f.card.querySelector('a').dispatchEvent(new f.w.MouseEvent('click',{bubbles:true,cancelable:true}));assert.equal(f.w.localStorage.getItem(KEY),null);assert.equal(f.card.hidden,false);f.card.querySelector('button').click();assert.deepEqual(f.events.map(e=>e[1]),['android_app_invite_view','android_app_invite_play_click','android_app_invite_dismiss']);assert.ok(!JSON.stringify(f.events).includes('secret'));assert.deepEqual(Object.keys(f.events[0][2]).sort(),['cta_id','entry_source','install_status','language','page_context','variant']);}finally{f.close();}
 const off=await fixture({disabled:true});try{off.seen();off.card.querySelector('button').click();assert.equal(off.events.length,0);}finally{off.close();}
});
test('keyboard input hides/inerts; close returns focus; no preview controls',async()=>{const f=await fixture();try{const input=f.w.document.querySelector('input');input.focus();await new Promise(r=>setTimeout(r,25));assert.equal(f.card.inert,true);f.seen();assert.equal(f.events.length,0);input.blur();await new Promise(r=>setTimeout(r,25));assert.equal(f.card.inert,false);f.card.querySelector('button').focus();f.card.querySelector('button').click();assert.equal(f.w.document.activeElement,input);assert.equal(f.w.document.querySelector('#android-context-review'),null);}finally{f.close();}});
test('JA/EN integration idempotent and canonical generator persists all four targets',()=>{for(const [file,lang,context] of [['index.html','ja','landing'],['en/index.html','en','landing'],['guide.html','ja','fuji_guide'],['en/guide.html','en','fuji_guide']]){const html=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');assert.equal((html.match(/ANDROID_APP_INVITE_START/g)||[]).length,1);assert.equal(withAndroidAppInvite(html,lang,context),html);assert.ok(html.includes('"dismissDays":14'));assert.ok(html.includes('"unknownPolicy":"show-eligible"'));assert.ok(html.includes('"language":"'+lang+'"'));assert.ok(html.includes('manifest.json'));assert.ok(!html.includes('android-context-review'));}});
test('legacy seen/Play/preview state and force-query do not override production',async()=>{const f=await fixture({url:'https://michikusa-travel.com/?invite=installed&invite_reset=1'});try{f.w.localStorage.setItem('mado-android-context-invite-preview-v1',JSON.stringify({dismissedUntil:9999999999999}));f.refresh();assert.equal(f.card.hidden,false);f.card.querySelector('button').click();const before=f.w.localStorage.getItem(KEY);f.w.history.replaceState(null,'','?invite=force&invite_reset=1');f.refresh();assert.equal(f.w.localStorage.getItem(KEY),before);assert.equal(f.card.hidden,true);}finally{f.close();}});
test('BFCache rechecks installed status; background views are not counted',async()=>{const f=await fixture();try{Object.defineProperty(f.w.document,'visibilityState',{value:'hidden',configurable:true});f.seen();assert.equal(f.events.length,0);f.w.navigator.getInstalledRelatedApps=async()=>[{platform:'play',id:'com.michikusatravel.shinkansenwindow'}];f.w.dispatchEvent(new f.w.PageTransitionEvent('pageshow',{persisted:true}));assert.equal(f.card.hidden,true);await new Promise(r=>setTimeout(r,5));assert.equal(f.card.hidden,true);assert.equal(f.events.length,0);}finally{f.close();}});
test('API timeout is eligible error without persistent install state',async()=>{const f=await fixture();try{f.w.navigator.getInstalledRelatedApps=()=>new Promise(()=>{});f.w.dispatchEvent(new f.w.PageTransitionEvent('pageshow',{persisted:true}));assert.equal(f.card.hidden,true);await new Promise(r=>setTimeout(r,1550));assert.equal(f.card.hidden,false);f.seen();assert.equal(f.events[0][2].install_status,'error');assert.equal(f.w.localStorage.getItem(KEY),null);}finally{f.close();}});
test('visual viewport constrains card width during magnification',async()=>{const f=await fixture();try{f.w.visualViewport={width:260,height:500,offsetLeft:0,offsetTop:0};f.refresh();assert.equal(f.card.style.maxWidth,'236px');}finally{f.close();}});
const installed=[{platform:'play',id:'com.michikusatravel.shinkansenwindow'}];
test('expanded pages resolve deep assets, contexts, languages and retained exclusions',()=>{
 const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const file of ['spots/solar-ark.html','en/spots/solar-ark.html','live/index.html','fr/live/index.html','zh-Hant/zukan.html','de/spots/himeji-castle.html']){
  const html=withPageAndroidAppInvite(source,file),cfg=invitePageConfig(file);
  assert.equal(withPageAndroidAppInvite(html,file),html);
  assert.equal((html.match(/ANDROID_APP_INVITE_START/g)||[]).length,1);
  assert.ok(html.includes('"assetPrefix":"'+'../'.repeat(file.split('/').length-1)+'"'));
  assert.ok(html.includes('"language":"'+cfg.language+'"'));
  assert.ok(html.includes('"pageContext":"'+cfg.pageContext+'"'));
 }
 for(const file of ['privacy.html','contact.html','references.html','early-access.html','v0/index.html','v1/spots/fuji.html'])assert.equal(withPageAndroidAppInvite(source,file),source);
 const general=withPageAndroidAppInvite(source,'en/spots/himeji-castle.html');assert.ok(general.includes('Audio guidance covers Tokyo–Shin-Osaka.'));
 const plain=source.replace('if (window.MADO_EMBEDDED_WEB) return;','');assert.ok(withPageAndroidAppInvite(plain,'zukan.html').includes('ANDROID_APP_INVITE_RESET_START'));
});
test('live state suppression is temporary and shared dismissal survives it',async()=>{
 const f=await fixture();try{
  f.w.MADO_ANDROID_INVITE_BUSY=true;f.refresh();assert.equal(f.card.inert,true);f.seen();assert.equal(f.events.length,0);
  f.w.MADO_ANDROID_INVITE_BUSY=false;f.refresh();assert.equal(f.card.inert,false);f.seen();assert.equal(f.events.length,1);
  f.card.querySelector('button').click();const saved=f.w.localStorage.getItem(KEY);
  f.w.MADO_ANDROID_INVITE_BUSY=true;f.refresh();f.w.MADO_ANDROID_INVITE_BUSY=false;f.refresh();assert.equal(f.card.hidden,true);assert.equal(f.w.localStorage.getItem(KEY),saved);
 }finally{f.close();}
});
test('visible unselected train candidates suppress, selection and empty results permit placement',async()=>{
 const f=await fixture();try{
  const box=f.w.document.createElement('div');box.setAttribute('data-train-picker','');box.innerHTML='<div class="train-results"><button class="train-chip">Train</button></div>';f.w.document.body.append(box);
  const results=box.firstElementChild;results.getClientRects=()=>[{}];f.refresh();assert.equal(f.card.inert,true);
  results.querySelector('button').classList.add('active');f.refresh();assert.equal(f.card.inert,false);
  results.innerHTML='<p>No trains</p>';f.refresh();assert.equal(f.card.inert,false);
 }finally{f.close();}
});
test('all analytics bootstrap variants insert reset before GA without changing their consent gates',()=>{
 for(const [variable,gate] of [['measurementId','isLocalPreview || storageOptedOut'],['id','local || optedOut']]){
  const html='<html><head><script>(function () { var '+variable+' = "G-C2ESB694FV"; window.MADO_ANALYTICS_DISABLED = '+gate+'; })();</script></head><body></body></html>';
  const actual=withPageAndroidAppInvite(html,'ko/guide.html');assert(actual.indexOf('ANDROID_APP_INVITE_RESET_START')<actual.indexOf('var '+variable+' ='));
  assert(actual.includes(gate+' || window.MADO_ANDROID_INVITE_TEST_GA_DISABLED === true'));
 }
});
const settle=()=>new Promise(r=>setTimeout(r,5));
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function redetect(f,request){f.w.navigator.getInstalledRelatedApps=()=>request.promise;f.w.dispatchEvent(new f.w.PageTransitionEvent('pageshow',{persisted:true}));}
test('soft deadline shows unknown then late installed hides immediately without duplicate view',async()=>{
 const f=await fixture();try{const request=deferred();redetect(f,request);assert.equal(f.card.hidden,true);await new Promise(r=>setTimeout(r,1550));assert.equal(f.card.hidden,false);f.seen();assert.equal(f.events[0][2].install_status,'error');request.resolve(installed);await settle();assert.equal(f.card.hidden,true);f.seen();assert.equal(f.events.length,1);assert.equal(f.w.localStorage.getItem(KEY),null);
 const next=deferred();redetect(f,next);next.resolve([]);await settle();assert.equal(f.card.hidden,false);f.seen();assert.equal(f.events.length,1);
 }finally{f.close();}
});
test('late installed or unknown resolution preserves explicit 14-day dismissal',async()=>{
 for(const apps of [installed,[]]){const f=await fixture();try{const request=deferred();redetect(f,request);await new Promise(r=>setTimeout(r,1550));f.card.querySelector('button').click();const state=f.w.localStorage.getItem(KEY);request.resolve(apps);await settle();assert.equal(f.card.hidden,true);assert.equal(f.w.localStorage.getItem(KEY),state);assert.equal(JSON.parse(state).dismissedAt,1700000000000);}finally{f.close();}}
});
test('older positive/error/empty response cannot overwrite a newer detection',async()=>{
 for(const oldResult of ['positive','error','empty']){const f=await fixture();try{const old=deferred(),current=deferred();redetect(f,old);redetect(f,current);current.resolve(oldResult==='positive'?[]:installed);await settle();const expected=oldResult!=='positive';assert.equal(f.card.hidden,expected);if(oldResult==='error')old.reject(Error('late'));else old.resolve(oldResult==='positive'?installed:[]);await settle();assert.equal(f.card.hidden,expected);assert.equal(f.w.localStorage.getItem(KEY),null);}finally{f.close();}}
});
test('departure invalidates late answers; BFCache return checks anew',async()=>{
 for(const answer of ['positive','error']){const f=await fixture();try{const old=deferred();redetect(f,old);f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide',{persisted:true}));assert.equal(f.card.hidden,true);if(answer==='error')old.reject(Error('away'));else old.resolve(installed);await settle();assert.equal(f.card.hidden,true);assert.equal(f.events.length,0);const current=deferred();redetect(f,current);current.resolve([]);await settle();assert.equal(f.card.hidden,false);f.seen();assert.equal(f.events.length,1);}finally{f.close();}}
});
