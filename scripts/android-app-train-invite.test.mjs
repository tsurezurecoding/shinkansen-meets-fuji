import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {TRAIN_INVITE_COPY,trainInviteCopy} from './shared/android-app-invite-copy.mjs';
import {invitePageConfig,withPageAndroidAppInvite} from './shared/android-app-invite.mjs';

const runtime=fs.readFileSync(new URL('../android-app-invite.js',import.meta.url),'utf8');
const ua='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
const key='mado-android-app-invite-v2';
const installed=[{platform:'play',id:'com.michikusatravel.shinkansenwindow'}];
const tick=()=>new Promise(resolve=>setTimeout(resolve,40));
async function fixture({language='ja',selected=false,apps=[],api=true,agent=ua,native=false,standalone=false,state,context='train_search'}={}){
 const prefix=language==='ja'?'':language+'/';
 const dom=new JSDOM('<html><body><main><h1>Train</h1><details id="sp-view" data-state="sample"><section id="timelineSection" hidden><section id="fujiTrainAnswer" hidden>Fuji result</section><div class="section-head"><h2>Views</h2></div><ul id="timeline"><li>Existing view</li></ul></section></details></main></body></html>',{url:'https://www.michikusa-travel.com/'+prefix+'start.html?secret=private',pretendToBeVisual:true,runScripts:'outside-only'});
 const w=dom.window,events=[];let seen;
 Object.defineProperty(w.navigator,'userAgent',{value:agent});Object.defineProperty(w,'isSecureContext',{value:true});
 w.matchMedia=()=>({matches:standalone,addEventListener(){}});w.MADO_NATIVE_APP=native;
 w.IntersectionObserver=class{constructor(cb){seen=cb;}observe(){}disconnect(){}};
 w.MADO_ANALYTICS_DISABLED=false;w.gtag=(...args)=>events.push(args);
 if(api)w.navigator.getInstalledRelatedApps=typeof apps==='function'?apps:async()=>apps;
 if(state)w.localStorage.setItem(key,JSON.stringify(state));
 const view=w.document.getElementById('sp-view'),section=w.document.getElementById('timelineSection'),answer=w.document.getElementById('fujiTrainAnswer');
 if(language!=='ja')view.replaceWith(...view.childNodes);
 function select(value,fuji=true){w.journey=value?{mode:'train',preview:false}:null;view.dataset.state=value?'selected':'sample';section.hidden=!value;answer.hidden=!value||!fuji;}
 select(selected);
 const config=w.document.createElement('script');config.id='mado-android-invite-config';config.type='application/json';config.textContent=JSON.stringify({language,pageContext:context,assetPrefix:prefix?'../':'',general:false});w.document.body.append(config);
 w.document.addEventListener('click',event=>event.preventDefault());
 w.eval(runtime);await tick();
 return {w,events,view,section,answer,select,card:w.document.getElementById('android-app-invite'),seen:(ratio=1)=>seen([{isIntersecting:ratio>0,intersectionRatio:ratio}]),close:()=>w.close()};
}

test('all ten train editions show localized inline guidance and correct store/help destinations',async()=>{
 assert.equal(Object.keys(TRAIN_INVITE_COPY).length,10);
 for(const language of Object.keys(TRAIN_INVITE_COPY)){
  const f=await fixture({language,selected:true});try{
   const copy=trainInviteCopy(language);assert.equal(f.card.hidden,false);
   assert.equal(f.card.querySelector('h3').textContent,copy.title);
   for(const text of [copy.body,copy.free,copy.learn,copy.notice])assert(f.card.textContent.includes(text));
   assert.equal(f.w.getComputedStyle(f.card).position,'static');assert.equal(f.answer.nextElementSibling,f.card);
   assert.equal(f.card.querySelector('button'),null);
   const play=new URL(f.card.querySelector('.context-play').href);assert.equal(play.searchParams.get('id'),installed[0].id);assert.equal(play.searchParams.get('utm_medium'),'android_browser_train_inline');
   assert.equal(f.card.querySelector('.context-learn').pathname,language==='ja'?'/android-app.html':'/en/android-app.html');
   assert.equal(f.card.querySelector('.context-learn').hash,'#eaWhyTitle');
   assert.equal(f.card.querySelector('img').src,'https://www.michikusa-travel.com/images/android/app-icon-192.webp');
   f.w.eval(runtime);assert.equal(f.w.document.querySelectorAll('#android-app-invite').length,1);
  }finally{f.close();}
 }
});

test('selection, result replacement, no-Fuji fallback and cancellation keep one inline card and the existing timeline',async()=>{
 const f=await fixture();try{
  assert.equal(f.card.hidden,true);f.select(true);await tick();assert.equal(f.card.hidden,false);
  f.answer.textContent='A different selected train';await tick();assert.equal(f.answer.nextElementSibling,f.card);
  f.select(true,false);await tick();assert.equal(f.section.querySelector('.section-head').nextElementSibling,f.card);
  f.select(false);await tick();assert.equal(f.card.hidden,true);
  f.select(true);await tick();assert.equal(f.card.hidden,false);assert.equal(f.w.document.querySelectorAll('#android-app-invite').length,1);
  assert.equal(f.w.document.querySelector('#timeline li').textContent,'Existing view');
 }finally{f.close();}
});

test('the shared journey authority excludes previews, estimates and invalidated selections without a Japanese scenery element',async()=>{
 const f=await fixture({language:'en',selected:true});try{
  assert.equal(f.w.document.getElementById('sp-view'),null);assert.equal(f.card.hidden,false);
  for(const journey of [{mode:'train',preview:true},{mode:'estimate',preview:false},null]){
   f.w.journey=journey;f.w.document.dispatchEvent(new f.w.Event('input',{bubbles:true}));await tick();assert.equal(f.card.hidden,true);
  }
  f.select(true);f.answer.textContent='Selected again';await tick();assert.equal(f.card.hidden,false);
 }finally{f.close();}
});

test('installed apps are suppressed before rendering and after returning from the store',async()=>{
 const f=await fixture({selected:true,apps:installed});try{assert.equal(f.card.hidden,true);f.seen();assert.equal(f.events.length,0);}finally{f.close();}
 const back=await fixture({selected:true});try{
  assert.equal(back.card.hidden,false);back.w.navigator.getInstalledRelatedApps=async()=>installed;
  back.w.dispatchEvent(new back.w.PageTransitionEvent('pageshow',{persisted:true}));assert.equal(back.card.hidden,true);await tick();assert.equal(back.card.hidden,true);assert.equal(back.w.localStorage.getItem(key),null);
 }finally{back.close();}
});

test('unknown installation stays eligible, while late positive detection hides the inline card',async()=>{
 const unknown=await fixture({selected:true,api:false});try{assert.equal(unknown.card.hidden,false);}finally{unknown.close();}
 let resolve;
 const late=await fixture({selected:true,apps:()=>new Promise(done=>{resolve=done;})});try{
  assert.equal(late.card.hidden,true);await new Promise(done=>setTimeout(done,1500));assert.equal(late.card.hidden,false);
  resolve(installed);await tick();assert.equal(late.card.hidden,true);assert.equal(late.w.localStorage.getItem(key),null);
 }finally{late.close();}
});

test('desktop, iPhone, native app and standalone exclusions also apply to inline guidance',async()=>{
 for(const options of [{agent:'Windows Chrome/130.0'},{agent:'iPhone Safari/17.0'},{agent:ua+' wv'},{native:true},{standalone:true}]){
  const f=await fixture({selected:true,...options});try{assert.equal(f.card,null);}finally{f.close();}
 }
});

test('shared dismissal and opt-out remain effective without recording installation on clicks',async()=>{
 const dismissed=await fixture({selected:true,state:{v:2,dismissedAt:Date.now()}});try{assert.equal(dismissed.card.hidden,true);}finally{dismissed.close();}
 const f=await fixture({selected:true});try{
  f.seen(.4);assert.equal(f.events.length,0);f.seen();f.seen();
  f.card.querySelector('.context-play').click();f.card.querySelector('.context-learn').click();
  assert.deepEqual(f.events.map(row=>row[1]),['android_app_invite_view','android_app_invite_play_click','android_app_guide_click']);
  for(const event of f.events){assert.equal(event[2].entry_source,'android_browser_train_inline');assert.equal(event[2].variant,'train_inline_v1');}
  assert(!JSON.stringify(f.events).includes('private'));assert.equal(f.w.localStorage.getItem(key),null);
  f.w.localStorage.setItem('mado-ga-optout','1');f.card.querySelector('.context-play').click();assert.equal(f.events.length,3);
 }finally{f.close();}
});

test('Italian and Thai opt in only on train search, retaining exclusions elsewhere',async()=>{
 const html=fs.readFileSync(new URL('../start.html',import.meta.url),'utf8');
 for(const language of ['it','th']){
  assert.equal(invitePageConfig(language+'/start.html').pageContext,'train_search');
  const output=withPageAndroidAppInvite(html,language+'/start.html');assert(output.includes('"language":"'+language+'"'));assert.equal(withPageAndroidAppInvite(output,language+'/start.html'),output);
  assert.equal(invitePageConfig(language+'/guide.html'),null);
  const f=await fixture({language,context:'landing'});try{assert.equal(f.card,null);}finally{f.close();}
 }
});
