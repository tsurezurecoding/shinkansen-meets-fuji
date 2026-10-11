import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const KEY='mado-android-app-invite-v2';
const pages=['index.html','en/index.html','guide.html','en/guide.html'];
const ua='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
async function page(file,{query='?ga=off&android_invite_reset=1',agent=ua,installed=false,native=false,storageFailure=false,historyFailure=false,seed,shared}={}){
 const html=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://www.michikusa-travel.com/'+file+query,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,events=[];let intersection;
 if(shared){
  w.Storage.prototype.getItem=k=>shared.values.get(String(k))??null;
  w.Storage.prototype.setItem=(k,v)=>{k=String(k);v=String(v);const oldValue=shared.values.get(k)??null;shared.values.set(k,v);shared.changes.push({key:k,oldValue,newValue:v});};
  w.Storage.prototype.removeItem=k=>{k=String(k);const oldValue=shared.values.get(k)??null;shared.values.delete(k);shared.changes.push({key:k,oldValue,newValue:null});};
 }
 Object.defineProperty(w.navigator,'userAgent',{value:agent});Object.defineProperty(w,'isSecureContext',{value:true});w.matchMedia=()=>({matches:false});w.IntersectionObserver=class{constructor(cb){intersection=cb;}observe(){}};w.MADO_NATIVE_APP=native;
 w.navigator.getInstalledRelatedApps=async()=>installed?[{platform:'play',id:'com.michikusatravel.shinkansenwindow'}]:[];
 w.gtag=(...args)=>events.push(args);
 const before=seed||{[KEY]:JSON.stringify({v:2,dismissedAt:Date.now()}),'mado-stamps-v1':'keep-stamps','mado-lang':'en','mado-android-invite-v1':'keep-legacy'};
 for(const [k,v] of Object.entries(before))w.localStorage.setItem(k,v);
 if(storageFailure){w.Storage.prototype.getItem=()=>{throw Error('denied');};w.Storage.prototype.setItem=()=>{throw Error('denied');};w.Storage.prototype.removeItem=()=>{throw Error('denied');};}
 if(historyFailure)w.history.replaceState=()=>{throw Error('history denied');};
 const headScripts=[...w.document.head.querySelectorAll('script')].filter(s=>s.textContent.includes("getAll('android_invite_reset')")||s.textContent.includes('var optoutKey = "mado-ga-optout"'));
 assert.equal(headScripts.length,2);headScripts.forEach(s=>w.eval(s.textContent));
 const runtime=[...w.document.querySelectorAll('script')].find(s=>s.textContent.includes("const key = 'mado-android-app-invite-v2'"));w.eval(runtime.textContent);
 await new Promise(r=>setTimeout(r,5));
 return {w,events,seen:()=>intersection([{isIntersecting:true,intersectionRatio:1}]),card:w.document.querySelector('#android-app-invite'),before,gtm:()=>w.document.querySelectorAll('script[src*="googletagmanager.com"]').length,close:()=>w.close()};
}
for(const file of pages)test(file+': reset consumed before GA; only invite state reset; reload × protected',async()=>{
 const f=await page(file,{query:'?lang=en&ga=off&android_invite_reset=1&campaign=test#section'});try{
  assert.equal(f.w.localStorage.getItem(KEY),null);assert.equal(f.w.localStorage.getItem('mado-stamps-v1'),'keep-stamps');assert.equal(f.w.localStorage.getItem('mado-lang'),'en');assert.equal(f.w.localStorage.getItem('mado-android-invite-v1'),'keep-legacy');assert.equal(f.w.localStorage.getItem('mado-ga-optout'),'1');
  const url=new URL(f.w.location.href);assert.equal(url.searchParams.has('android_invite_reset'),false);assert.equal(url.searchParams.get('ga'),'off');assert.equal(url.searchParams.get('lang'),'en');assert.equal(url.searchParams.get('campaign'),'test');assert.equal(url.hash,'#section');assert.equal(f.w.MADO_ANALYTICS_DISABLED,true);assert.equal(f.gtm(),0);assert.equal(f.w.dataLayer,undefined);assert.equal(f.card.hidden,false);
  f.card.querySelector('a').dispatchEvent(new f.w.MouseEvent('click',{bubbles:true,cancelable:true}));f.card.querySelector('button').click();assert.equal(f.card.hidden,true);assert.equal(f.events.length,0);const dismissed=f.w.localStorage.getItem(KEY);assert.ok(dismissed);
  const seed=Object.fromEntries(Array.from({length:f.w.localStorage.length},(_,i)=>{const k=f.w.localStorage.key(i);return [k,f.w.localStorage.getItem(k)];}));
  const reload=await page(file,{query:url.search+url.hash,seed});try{assert.equal(reload.card.hidden,true);assert.equal(reload.w.localStorage.getItem(KEY),dismissed);assert.equal(reload.gtm(),0);}finally{reload.close();}
 }finally{f.close();}
});
for(const query of ['?android_invite_reset=1','?ga=on&android_invite_reset=1','?ga=off&android_invite_reset=0','?ga=off&android_invite_reset=1&ga_optout=0','?ga=off&ga=on&android_invite_reset=1','?ga=off&android_invite_reset=1&android_invite_reset=1'])test('invalid/unprotected reset is inert: '+query,async()=>{const f=await page('index.html',{query});try{assert.equal(f.w.localStorage.getItem(KEY),f.before[KEY]);assert.equal(f.w.MADO_ANDROID_INVITE_TEST_GA_DISABLED,undefined);assert.equal(f.card.hidden,true);}finally{f.close();}});
for(const opts of [{agent:'Windows Chrome/130.0'},{agent:'iPhone Version/17.5 Safari/604.1'},{agent:ua+' wv'},{native:true},{installed:true}])test('valid reset retains eligibility exclusions '+JSON.stringify(opts),async()=>{const f=await page('guide.html',opts);try{assert.equal(f.w.localStorage.getItem(KEY),null);assert.ok(!f.card||f.card.hidden);assert.equal(f.gtm(),0);assert.equal(f.events.length,0);}finally{f.close();}});
test('storage failure cannot send GA from test URL or force invitation',async()=>{const f=await page('en/guide.html',{storageFailure:true});try{assert.equal(f.w.MADO_ANALYTICS_DISABLED,true);assert.equal(f.gtm(),0);assert.equal(f.w.dataLayer,undefined);assert.equal(f.events.length,0);assert.equal(f.card,null);assert.ok(!f.w.location.search.includes('android_invite_reset'));}finally{f.close();}});
test('failed query consumption preserves suppression and keeps GA stopped',async()=>{const f=await page('index.html',{historyFailure:true});try{assert.equal(f.w.localStorage.getItem(KEY),f.before[KEY]);assert.equal(f.card.hidden,true);assert.equal(f.gtm(),0);assert.ok(f.w.location.search.includes('android_invite_reset'));}finally{f.close();}});
test('existing persistent GA off survives ordinary reload; ga=on clears existing optout only',async()=>{
 const seed={[KEY]:JSON.stringify({v:2,dismissedAt:Date.now()}),'mado-ga-optout':'1','mado-stamps-v1':'keep'};
 const off=await page('guide.html',{query:'',seed});try{assert.equal(off.gtm(),0);assert.equal(off.w.MADO_ANALYTICS_DISABLED,true);}finally{off.close();}
 const on=await page('guide.html',{query:'?ga=on',seed});try{assert.equal(on.w.localStorage.getItem('mado-ga-optout'),null);assert.equal(on.w.MADO_ANALYTICS_DISABLED,false);assert.equal(on.gtm(),1);assert.equal(on.w.localStorage.getItem(KEY),seed[KEY]);assert.equal(on.w.localStorage.getItem('mado-stamps-v1'),'keep');}finally{on.close();}
});
test('head bootstrap precedes existing GA initializer on four generated pages',()=>{for(const file of pages){const html=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');assert.equal((html.match(/ANDROID_APP_INVITE_RESET_START/g)||[]).length,1);assert.ok(html.indexOf('ANDROID_APP_INVITE_RESET_START')<html.indexOf('var measurementId'));assert.ok(html.includes('window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut || window.MADO_ANDROID_INVITE_TEST_GA_DISABLED === true;'));}});
function sharedStore(){return {values:new Map(),changes:[]};}
function storageEvent(f,key,newValue=null){f.w.dispatchEvent(new f.w.StorageEvent('storage',{key,newValue}));}
function inviteEvents(f){return (f.w.dataLayer||[]).filter(args=>args[0]==='event'&&String(args[1]).startsWith('android_app_invite_'));}
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
test('two documents: persisted opt-out precedes dismissal deletion and stops view/Play/× in original tab',async()=>{
 const shared=sharedStore(),old=await page('guide.html',{query:'',shared});let reset;
 try{assert.equal(old.w.MADO_ANALYTICS_DISABLED,false);assert.equal(old.card.hidden,true);old.seen();shared.changes=[];
  reset=await page('index.html',{shared,seed:{}});const writes=shared.changes.filter(e=>['mado-ga-optout',KEY].includes(e.key));assert.equal(writes[0].key,'mado-ga-optout');assert.equal(writes[0].newValue,'1');assert.equal(writes[1].key,KEY);assert.equal(writes[1].newValue,null);
  // Deliberately deliver dismissal before its opt-out storage event.
  storageEvent(old,KEY);assert.equal(old.card.hidden,false);old.seen();assert.equal(old.w.MADO_ANALYTICS_DISABLED,true);assert.equal(old.w['ga-disable-G-C2ESB694FV'],true);assert.equal(inviteEvents(old).length,0);
  old.card.querySelector('a').dispatchEvent(new old.w.MouseEvent('click',{bubbles:true,cancelable:true}));old.card.querySelector('button').click();assert.equal(inviteEvents(old).length,0);assert.equal(old.card.hidden,true);assert.ok(shared.values.get(KEY));
  storageEvent(old,'mado-ga-optout','1');assert.equal(inviteEvents(old).length,0);
 }finally{reset?.close();old.close();}
});
test('track reads current shared opt-out even before storage events; no auto-opt-in on removal',async()=>{
 const shared=sharedStore(),old=await page('guide.html',{query:'',shared,seed:{}});try{
  assert.equal(old.card.hidden,false);shared.values.set('mado-ga-optout','1');
  // Neither focus nor storage events have been dispatched yet.
  old.seen();old.card.querySelector('a').dispatchEvent(new old.w.MouseEvent('click',{bubbles:true,cancelable:true}));old.card.querySelector('button').click();assert.equal(inviteEvents(old).length,0);assert.equal(old.w['ga-disable-G-C2ESB694FV'],true);
  shared.values.delete('mado-ga-optout');storageEvent(old,'mado-ga-optout');assert.equal(old.w.MADO_ANALYTICS_DISABLED,true); // Reload/explicit ga=on retains original opt-in path.
 }finally{old.close();}
});
for(const event of ['pageshow','focus','visibilitychange'])test('shared GA stop followed on '+event+' without storage notification',async()=>{
 const shared=sharedStore(),old=await page('en/guide.html',{query:'',shared});let reset;
 try{if(event==='pageshow')old.w.dispatchEvent(new old.w.PageTransitionEvent('pagehide',{persisted:true}));reset=await page('en/index.html',{shared,seed:{}});
  if(event==='pageshow')old.w.dispatchEvent(new old.w.PageTransitionEvent('pageshow',{persisted:true}));
  else if(event==='focus')old.w.dispatchEvent(new old.w.FocusEvent('focus'));
  else old.w.document.dispatchEvent(new old.w.Event('visibilitychange'));
  await tick();assert.equal(old.w.MADO_ANALYTICS_DISABLED,true);assert.equal(old.w['ga-disable-G-C2ESB694FV'],true);old.seen();assert.equal(inviteEvents(old).length,0);
 }finally{reset?.close();old.close();}
});
test('fresh stored value wins over stale opt-out event; normal consent remains active',async()=>{
 const shared=sharedStore(),old=await page('guide.html',{query:'',shared,seed:{}});try{storageEvent(old,'mado-ga-optout','1');assert.equal(old.w.MADO_ANALYTICS_DISABLED,false);old.seen();assert.equal(inviteEvents(old).length,1);}finally{old.close();}
});
test('reset cannot delete dismissal if shared opt-out cannot be saved',async()=>{
 const f=await page('index.html',{query:'',seed:{}});try{
  f.w.localStorage.setItem(KEY,JSON.stringify({v:2,dismissedAt:Date.now()}));const before=f.w.localStorage.getItem(KEY);
  const original=f.w.Storage.prototype.setItem;f.w.Storage.prototype.setItem=function(k,v){if(k==='mado-ga-optout')throw Error('opt-out quota');return original.call(this,k,v);};
  f.w.history.replaceState(null,'','?ga=off&android_invite_reset=1');const bootstrap=fs.readFileSync(new URL('./shared/android-app-invite-reset.js',import.meta.url),'utf8');f.w.eval(bootstrap);
  assert.equal(f.w.localStorage.getItem(KEY),before);assert.equal(f.w.MADO_ANDROID_INVITE_TEST_GA_DISABLED,true);assert.ok(!f.w.location.search.includes('android_invite_reset'));
 }finally{f.close();}
});
