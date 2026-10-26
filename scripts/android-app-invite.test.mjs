import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {inviteRuntime,withAndroidAppInvite,withPageAndroidAppInvite,invitePageConfig} from './shared/android-app-invite.mjs';
import {INVITE_COPY,inviteCopy} from './shared/android-app-invite-copy.mjs';
const DAY=86400000,KEY='mado-android-app-invite-v2';
const sharedRuntime=fs.readFileSync(new URL('../android-app-invite.js',import.meta.url),'utf8');
const ua='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
async function fixture({agent=ua,apps=[],api=true,state,language='ja',general=false,assetPrefix='',inline=false,disabled=false,url='https://michikusa-travel.com/',native=false,standalone=false,throwStorage=false}={}){
 const dom=new JSDOM('<html><body><main><h1>Title</h1><input id="edit"></main></body></html>',{url,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let now=1700000000000,callback;const events=[],styleBeforeCard=[];
 const createElement=w.document.createElement.bind(w.document);w.document.createElement=tag=>{if(tag==='aside')styleBeforeCard.push(!!w.document.getElementById('android-app-invite-style')?.textContent);return createElement(tag);};
 Object.defineProperty(w.navigator,'userAgent',{value:agent});Object.defineProperty(w,'isSecureContext',{value:true});
 w.matchMedia=()=>({matches:standalone,addEventListener(){}});w.MADO_NATIVE_APP=native;
 w.IntersectionObserver=class{constructor(cb){callback=cb;}observe(){}disconnect(){}};
 w.HTMLElement.prototype.getBoundingClientRect=function(){return this.id==='android-app-invite'?{left:0,right:310,top:0,bottom:173,width:310,height:173}:{left:0,right:0,top:0,bottom:0,width:0,height:0};};
 w.Date.now=()=>now;w.MADO_ANALYTICS_DISABLED=disabled;w.gtag=(...args)=>events.push(args);
 if(api)w.navigator.getInstalledRelatedApps=async()=>{if(apps instanceof Error)throw apps;return apps;};
 if(state!==undefined)w.localStorage.setItem(KEY,typeof state==='string'?state:JSON.stringify(state));
 if(throwStorage)w.Storage.prototype.setItem=()=>{throw Error('denied');};
 if(inline)w.eval(inviteRuntime({language,pageContext:'landing',assetPrefix,general}));
 else{const config=w.document.createElement('script');config.type='application/json';config.id='mado-android-invite-config';config.textContent=JSON.stringify({language,pageContext:'landing',assetPrefix,general});w.document.body.append(config);w.eval(sharedRuntime);}
 await new Promise(r=>setTimeout(r,5));
 return {w,dom,events,styleBeforeCard,card:w.document.querySelector('#android-app-invite'),seen:(ratio=1)=>callback([{isIntersecting:ratio>0,intersectionRatio:ratio}]),now:v=>{now=v;},refresh:()=>w.dispatchEvent(new w.StorageEvent('storage',{key:KEY})),close:()=>w.close()};
}
test('shared bundle uses all locale/general copy and inserts styles once before the card',async()=>{
 for(const language of Object.keys(INVITE_COPY))for(const general of [false,true]){
  const f=await fixture({language,general,assetPrefix:'../../',url:'https://michikusa-travel.com/'+language+'/spots/example.html'});
  try{const copy=inviteCopy(language,general);assert.equal(f.card.querySelector('h2').textContent,copy.title);assert.ok(f.card.textContent.includes(copy.body));assert.deepEqual(f.styleBeforeCard,[true]);assert.equal(f.w.document.querySelectorAll('#android-app-invite-style').length,1);assert.equal(f.card.querySelector('.context-app-icon').src,'https://michikusa-travel.com/images/android/app-icon-192.webp');f.w.eval(sharedRuntime);assert.equal(f.w.document.querySelectorAll('#android-app-invite').length,1);assert.equal(f.w.document.querySelectorAll('#android-app-invite-style').length,1);}finally{f.close();}
 }
});
test('legacy inline test helper remains behaviorally compatible',async()=>{const f=await fixture({inline:true});try{assert.equal(f.card.hidden,false);assert.deepEqual(f.styleBeforeCard,[true]);f.card.querySelector('button').click();assert.equal(f.card.hidden,true);assert.equal(JSON.parse(f.w.localStorage.getItem(KEY)).v,2);}finally{f.close();}});
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
test('JA/EN integration keeps only page context and one stable loader in HTML',()=>{for(const [file,lang,context] of [['index.html','ja','landing'],['en/index.html','en','landing'],['guide.html','ja','fuji_guide'],['en/guide.html','en','fuji_guide']]){const html=withAndroidAppInvite(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),lang,context);assert.equal((html.match(/ANDROID_APP_INVITE_START/g)||[]).length,1);assert.equal(withAndroidAppInvite(html,lang,context),html);const config=JSON.parse(html.match(/id="mado-android-invite-config">([^<]+)<\/script>/)[1]);assert.deepEqual(Object.keys(config).sort(),['assetPrefix','general','language','pageContext']);assert.equal(config.language,lang);assert.equal(config.pageContext,context);assert.equal(config.general,false);assert.equal((html.match(/src="[^"]*site-runtime-loader\.js\?v=[a-f0-9]{8}" defer/g)||[]).length,1);assert.ok(!html.includes('"dismissDays":14'));assert.ok(!html.includes("const key = 'mado-android-app-invite-v2'"));assert.ok(!html.includes('android-app-invite.js?v='));assert.ok(!html.includes('<style>#android-app-invite'));assert.ok(html.includes('manifest.json'));assert.ok(!html.includes('android-context-review'));}});
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
 for(const file of ['privacy.html','contact.html','references.html','early-access.html','android-app.html','v0/index.html','v1/spots/fuji.html'])assert.equal(withPageAndroidAppInvite(source,file),source);
 const general=withPageAndroidAppInvite(source,'en/spots/himeji-castle.html');assert.ok(general.includes('"general":true'));assert.ok(!general.includes('Audio guidance covers Tokyo–Shin-Osaka.'));
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

test('maps and linked photos may overlap; direct controls and map interaction remain protected',async()=>{
 const f=await fixture();try{
  const map=f.w.document.createElement('div');map.id='map';map.innerHTML='<a href="#photo"><img alt="Photo"></a>';f.w.document.body.append(map);
  for(const el of [map,...map.querySelectorAll('*')])el.getBoundingClientRect=()=>({left:0,top:0,right:1024,bottom:768,width:1024,height:768});
  await new Promise(r=>setTimeout(r,30));assert.equal(f.card.inert,false);
  map.dispatchEvent(new f.w.Event('pointerdown',{bubbles:true}));await new Promise(r=>setTimeout(r,25));assert.equal(f.card.inert,true);
  f.w.dispatchEvent(new f.w.Event('pointerup'));await new Promise(r=>setTimeout(r,25));assert.equal(f.card.inert,false);
  const button=f.w.document.createElement('button');button.textContent='Map action';button.getBoundingClientRect=()=>({left:0,top:560,right:1024,bottom:768,width:1024,height:208});map.append(button);
  await new Promise(r=>setTimeout(r,25));assert.equal(f.card.inert,false);assert.equal(f.card.style.top,'12px','move to a top corner instead of covering the button');
 }finally{f.close();}
});

test('scroll bursts coalesce placement without storage writes or repeated control discovery',async()=>{
 const f=await fixture();try{
  await new Promise(r=>setTimeout(r,25));let writes=0,queries=0,frames=0;
  const set=f.w.Storage.prototype.setItem,query=f.w.document.querySelectorAll.bind(f.w.document),raf=f.w.requestAnimationFrame.bind(f.w);
  f.w.Storage.prototype.setItem=function(...args){writes++;return set.apply(this,args);};
  f.w.document.querySelectorAll=function(selector){if(selector.startsWith('a[href]'))queries++;return query(selector);};
  f.w.requestAnimationFrame=callback=>{frames++;return raf(callback);};
  for(let i=0;i<100;i++)f.w.dispatchEvent(new f.w.Event('scroll'));
  await new Promise(r=>setTimeout(r,30));assert.equal(writes,0);assert.equal(queries,0);assert.equal(frames,1);assert.equal(f.card.inert,false);
 }finally{f.close();}
});

test('image CTA links and explicitly protected image links remain protected',async()=>{
 const f=await fixture();try{
  for(const attributes of ['data-cta-track="android_app_guide_click" data-cta-id="spot_rail_android"','data-cta-track="live_guide_entry_click" data-cta-id="spot_rail_live"','data-android-invite-protect','role="button"']){
   const link=f.w.document.createElement('a');link.href='#action';link.innerHTML='<img alt=""><span>Action</span>';
   const holder=f.w.document.createElement('div');holder.innerHTML='<a '+attributes+'></a>';for(const a of holder.firstChild.attributes)link.setAttribute(a.name,a.value);
   link.getBoundingClientRect=()=>({left:0,top:0,right:1024,bottom:768,width:1024,height:768});f.w.document.body.append(link);
   await new Promise(r=>setTimeout(r,25));assert.equal(f.card.inert,true,attributes);link.remove();
   await new Promise(r=>setTimeout(r,25));assert.equal(f.card.inert,false);
  }
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
