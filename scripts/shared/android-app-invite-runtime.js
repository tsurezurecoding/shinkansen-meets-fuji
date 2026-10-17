/* Inlined by android-app-invite.mjs. No preview controls or install-click persistence. */
(function () {
  'use strict';
  const config = __INVITE_CONFIG__;
  const key = 'mado-android-app-invite-v2';
  const dismissMs = config.dismissDays * 86400000;
  const pkg = 'com.michikusatravel.shinkansenwindow';
  const modes = ['standalone','fullscreen','minimal-ui','window-controls-overlay','picture-in-picture','tabbed'].map(name => {
    try { return typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: '+name+')') : null; }
    catch (e) { return null; }
  });
  function browser() {
    var ua = navigator.userAgent || "";
    return /Android/i.test(ua) && /(?:Chrome|Firefox|SamsungBrowser|EdgA|OPR)\//i.test(ua)
      && !/(?:Googlebot|GoogleOther|bingbot|Applebot|DuckDuckBot|crawler|spider|\bwv\b|Version\/4\.0|FBAN|FBAV|Instagram|Line\/|GSA\/|Twitter|TikTok|MicroMessenger|DuckDuckGo)/i.test(ua)
      && !modes.some(function (mode) { return mode && mode.matches; }) && !navigator.standalone && window.self === window.top
      && !window.Capacitor && !window.MADO_NATIVE_APP && !window.MADO_EMBEDDED_WEB
      && new URLSearchParams(location.search).get("from") !== "android-app";
  }
  function read() {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 2 || !Number.isFinite(s.dismissedAt) || s.dismissedAt < 0 || s.dismissedAt > 8640000000000000-dismissMs) throw Error('invalid invite state');
    return s;
  }
  function storageReady() {
    const probe = key+'-probe-'+Math.random();
    try { localStorage.setItem(probe,'1'); if(localStorage.getItem(probe)!=='1')throw Error('storage'); }
    finally { localStorage.removeItem(probe); }
  }
  // Availability/exclusion probes do not persist view, install, or a suppression period.
  try { if (!browser() || !window.isSecureContext || !window.IntersectionObserver) return; read(); storageReady(); }
  catch(e) { return; }
  const en = config.language === 'en';
  let status = 'checking', generation = 0, localClosed = false, pageAway = false, detectionTimer, timer, frame, lastFocus, ratio = 0, viewSent = false;
  const card = document.createElement('aside'); card.id='android-app-invite';card.hidden=true;card.setAttribute('aria-labelledby','android-app-invite-title');
  const asset = path => new URL(config.assetPrefix+path,document.baseURI).href;
  const c = config.copy;
  const escape = value => String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  card.innerHTML='<button id="android-app-invite-close" type="button" aria-label="'+escape(c.close)+'" title="'+escape(c.close)+'"><span aria-hidden="true">×</span></button><div class="context-heading"><img class="context-app-icon" width="32" height="32" alt=""><div><span class="context-label">'+escape(c.label)+'</span><h2 id="android-app-invite-title">'+escape(c.title)+'</h2></div></div><p>'+escape(c.body)+' <span>'+escape(c.free)+'</span></p><a class="context-play" aria-label="'+escape(c.playLabel||c.play)+' ↗" href="https://play.google.com/store/apps/details?id='+pkg+'&amp;utm_source=shinkansen_window_web&amp;utm_medium=android_browser_floating&amp;utm_campaign=android_app_invite" target="_blank" rel="noopener noreferrer"><img class="context-play-badge" width="646" height="250" alt=""><span class="context-play-fallback">'+escape(c.play)+' ↗</span></a>';
  document.body.append(card);
  const live=document.createElement('div');live.id='android-app-invite-announcement';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');document.body.append(live);
  function track(name) {
    // Recheck shared storage before every event, even before its storage event arrives.
    try {
      if (localStorage.getItem('mado-ga-optout') === '1') {
        window.MADO_ANALYTICS_DISABLED = true;window['ga-disable-G-C2ESB694FV'] = true;
        return false;
      }
    } catch(e) { return false; }
    if (window.MADO_ANALYTICS_DISABLED !== false || typeof window.gtag !== 'function') return false;
    try { window.gtag('event',name,{entry_source:'android_browser_floating',language:config.language,page_context:config.pageContext,variant:'floating_v2_14d',cta_id:'android_app_invite',install_status:status}); return true; } catch(e) { return false; }
  }
  function viewed() {
    if(!viewSent&&!card.hidden&&!card.inert&&ratio>=0.5&&document.visibilityState==='visible'&&getComputedStyle(card).visibility==='visible')viewSent=track('android_app_invite_view');
  }
  const observer=new IntersectionObserver(entries=>{ratio=entries[0].isIntersecting?entries[0].intersectionRatio:0;viewed();},{threshold:[0,0.5,1]});observer.observe(card);
  function focusBack() {
    const target=lastFocus&&lastFocus.isConnected?lastFocus:document.querySelector('main h2,main h1,h1,h2');
    if(target){if(!target.matches('a,button,input,select,textarea,[tabindex]'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
  }
  function overlap(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
  let pointerBusy=false;
  const visibleElement=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none'&&(!el.checkVisibility||el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}));
  function interactionBusy(){
    if(pointerBusy||window.MADO_ANDROID_INVITE_BUSY===true||document.fullscreenElement)return true;
    if([...document.querySelectorAll('[data-train-picker] .train-results')].some(el=>visibleElement(el)&&el.querySelector('.train-chip')&&!el.querySelector('.train-chip.active')))return true;
    return [...document.querySelectorAll('dialog[open],[role="dialog"],.modal,.lightbox,.spot-page-lightbox')].some(visibleElement);
  }
  function place(){
    if(card.hidden)return;
    const vv=window.visualViewport,vw=vv?vv.width:innerWidth,vh=vv?vv.height:innerHeight,ox=vv?vv.offsetLeft:0,oy=vv?vv.offsetTop:0;
    if(interactionBusy()||(document.activeElement&&!card.contains(document.activeElement)&&document.activeElement.matches('input,select,textarea,[contenteditable=true],.train-chip'))){card.style.visibility='hidden';card.inert=true;return;}
    const style=getComputedStyle(card),inset=name=>parseFloat(style.getPropertyValue('--safe-'+name))||0;
    card.style.maxWidth=Math.max(0,vw-24-inset('left')-inset('right'))+'px';
    const r=card.getBoundingClientRect();
    const controls=[...document.querySelectorAll('a,button,input,select,textarea,summary,nav,[role=button],.lang-landing-prompt,.leaflet-container,#map,iframe,video,canvas,main img,[data-android-invite-protect]')].filter(el=>!card.contains(el)&&el.getClientRects().length&&(!el.checkVisibility||el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}))&&getComputedStyle(el).visibility!=='hidden').map(el=>el.getBoundingClientRect());
    const bar=document.querySelector('.topbar,.lp-header,header')?.getBoundingClientRect();
    const top=Math.max(oy+12+inset('top'),bar&&bar.bottom>oy&&bar.bottom<oy+vh/2?bar.bottom+10:oy+12);
    let good;
    for(let y=oy+vh-r.height-12-inset('bottom');y>=top&&!good;y-=12)for(const x of [ox+vw-r.width-12-inset('right'),ox+12+inset('left')])if(!controls.some(t=>overlap({left:x-4,right:x+r.width+4,top:y-4,bottom:y+r.height+4},t))){good={x,y};break;}
    card.style.visibility=good?'visible':'hidden';card.inert=!good;if(good){card.style.left=good.x+'px';card.style.top=good.y+'px';}viewed();
  }
  function refresh(){
    clearTimeout(timer);let s,available=true;
    try{s=read();storageReady();}catch(e){available=false;}
    const canShow=status!=='checking'&&status!=='installed'&&config.unknownPolicy==='show-eligible';
    const visible=!pageAway&&available&&browser()&&canShow&&!localClosed&&(!s||s.dismissedAt+dismissMs<=Date.now());
    const focused=card.contains(document.activeElement);card.hidden=!visible;if(!visible&&focused)focusBack();
    if(visible){
      const icon=card.querySelector('.context-app-icon');if(!icon.hasAttribute('src'))icon.src=asset('images/android/app-icon-192.webp');
      const badge=card.querySelector('.context-play-badge');if(!badge.hasAttribute('src')){badge.addEventListener('load',()=>{badge.parentElement.classList.add('context-badge-loaded');schedule();},{once:true});badge.src=asset('images/google-play/'+(config.language==='ja'?'ja':'en')+'-badge.png');}
      place();
    }
    if(available&&s&&s.dismissedAt+dismissMs>Date.now()&&!localClosed)timer=setTimeout(refresh,Math.min(s.dismissedAt+dismissMs-Date.now(),2147483647));
  }
  function schedule(){if(!card.isConnected||pageAway)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(refresh);}
  async function detect(){
    if(pageAway)return;
    clearTimeout(detectionTimer);
    const turn=++generation;status='checking';refresh();
    let next='unsupported',timeout;
    if(typeof navigator.getInstalledRelatedApps==='function'){
      // The deadline permits unknown UI; it does not cancel positive evidence.
      timeout=setTimeout(()=>{if(turn===generation&&!pageAway){status='error';refresh();}},1500);
      detectionTimer=timeout;
      try{
        const apps=await navigator.getInstalledRelatedApps();
        next=Array.isArray(apps)?apps.some(app=>app&&app.platform==='play'&&app.id===pkg)?'installed':'not-detected':'error';
      }catch(e){next='error';}finally{
        clearTimeout(timeout);
        if(detectionTimer===timeout)detectionTimer=undefined;
      }
    }
    if(turn===generation&&!pageAway){status=next;refresh();}
  }
  card.querySelector('button').onclick=()=>{
    let saved=true;try{localStorage.setItem(key,JSON.stringify({v:2,dismissedAt:Date.now()}));}catch(e){saved=false;}
    localClosed=!saved;track('android_app_invite_dismiss');focusBack();refresh();
    live.textContent=saved?c.closed:c.failed;
  };
  card.querySelector('a').addEventListener('click',()=>track('android_app_invite_play_click')); // Click is not installation; no persistent stop.
  window.addEventListener('mado:android-invite-state',schedule);
  document.addEventListener('pointerdown',e=>{if(!card.contains(e.target)&&e.target.closest('.leaflet-container,#map,[data-train-picker],.train-results,[data-android-invite-protect]')){pointerBusy=true;schedule();}},{passive:true});
  window.addEventListener('pointerup',()=>{pointerBusy=false;schedule();},{passive:true});
  window.addEventListener('pointercancel',()=>{pointerBusy=false;schedule();},{passive:true});
  new MutationObserver(records=>{if(records.some(r=>r.target!==card&&!card.contains(r.target)&&r.target!==live))schedule();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','class','open'],childList:true});
  document.addEventListener('focusin',e=>{if(!card.contains(e.target))lastFocus=e.target;schedule();});document.addEventListener('focusout',schedule);
  window.addEventListener('scroll',schedule,{passive:true,capture:true});window.addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  window.addEventListener('storage',e=>{if(e.key===key||e.key===null){localClosed=false;refresh();}});
  window.addEventListener('pagehide',()=>{pageAway=true;++generation;clearTimeout(detectionTimer);clearTimeout(timer);cancelAnimationFrame(frame);card.hidden=true;});
  window.addEventListener('pageshow',e=>{const returning=pageAway;pageAway=false;if(e.persisted||returning)detect();else refresh();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')detect();else refresh();});
  modes.forEach(m=>{if(m&&m.addEventListener)m.addEventListener('change',refresh);else if(m&&m.addListener)m.addListener(refresh);});
  detect();
})();
