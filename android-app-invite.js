/* Generated from scripts/shared/android-app-invite-* sources. Do not edit. */
(function () {
  'use strict';
  const copies = {"ja":{"label":"Androidアプリのご案内","title":"画面を消して、車窓へ","body":"画面を消しても乗車中の音声案内。","free":"無料・登録不要。","play":"Google Playで見る","playLabel":"Google Playで見る (新しいタブで開きます)","close":"案内を閉じて14日間表示しない","closed":"案内を閉じました。14日間表示しません。","failed":"案内を閉じました。保存できませんでした。","generalTitle":"車窓図鑑をアプリでも","generalBody":"図鑑や旅の案内をアプリで。音声案内は東京〜新大阪に対応。"},"en":{"label":"Android app","title":"Screen off. Listen on.","body":"Ride audio continues with the screen off.","free":"Free, no sign-up.","play":"View on Google Play","playLabel":"View on Google Play (opens a new tab)","close":"Dismiss invitation for 14 days","closed":"Invitation hidden for 14 days.","failed":"Dismissed here; saving failed.","generalTitle":"Explore the views in the app","generalBody":"Explore the field guide in the app. Audio guidance covers Tokyo–Shin-Osaka."},"fr":{"label":"Application Android","title":"Écran éteint, écoutez","body":"Le guidage audio continue même écran éteint.","free":"Gratuit, sans inscription.","play":"Voir sur Google Play","playLabel":"Voir sur Google Play (ouvre un nouvel onglet)","close":"Masquer cette invitation pendant 14 jours","closed":"Invitation masquée pendant 14 jours.","failed":"Invitation fermée ; enregistrement impossible.","generalTitle":"Les paysages dans l’application","generalBody":"Explorez le guide dans l’application. Guidage audio de Tokyo à Shin-Osaka."},"de":{"label":"Android-App","title":"Bildschirm aus, weiterhören","body":"Die Audioführung läuft bei ausgeschaltetem Bildschirm weiter.","free":"Kostenlos, ohne Anmeldung.","play":"Bei Google Play ansehen","playLabel":"Bei Google Play ansehen (öffnet einen neuen Tab)","close":"Einladung für 14 Tage ausblenden","closed":"Einladung für 14 Tage ausgeblendet.","failed":"Geschlossen; Speichern fehlgeschlagen.","generalTitle":"Die Aussicht in der App","generalBody":"Entdecken Sie den Reiseführer in der App. Audioführung: Tokio–Shin-Osaka."},"es":{"label":"Aplicación Android","title":"Apaga la pantalla y escucha","body":"La guía de audio continúa con la pantalla apagada.","free":"Gratis, sin registro.","play":"Ver en Google Play","playLabel":"Ver en Google Play (abre una pestaña nueva)","close":"Ocultar la invitación durante 14 días","closed":"Invitación oculta durante 14 días.","failed":"Cerrado; no se pudo guardar.","generalTitle":"Descubre las vistas en la app","generalBody":"Explora la guía en la app. Audio entre Tokio y Shin-Osaka."},"ko":{"label":"Android 앱","title":"화면을 꺼도 음성 안내","body":"화면을 꺼도 승차 중 음성 안내가 계속됩니다.","free":"무료·가입 불필요.","play":"Google Play에서 보기","playLabel":"Google Play에서 보기 (새 탭에서 열림)","close":"14일 동안 안내 숨기기","closed":"14일 동안 안내를 표시하지 않습니다.","failed":"안내를 닫았습니다. 저장하지 못했습니다.","generalTitle":"앱에서도 차창 도감을","generalBody":"앱에서 차창 도감을 둘러보세요. 음성 안내는 도쿄~신오사카 구간을 지원합니다."},"zh-Hant":{"label":"Android 應用程式","title":"關閉螢幕，繼續聆聽","body":"關閉螢幕後，乘車語音導覽仍會繼續。","free":"免費，無需註冊。","play":"在 Google Play 查看","playLabel":"在 Google Play 查看 (在新分頁開啟)","close":"隱藏此提示14天","closed":"已隱藏提示14天。","failed":"已關閉提示，但無法儲存。","generalTitle":"在應用程式探索車窗圖鑑","generalBody":"在應用程式瀏覽圖鑑。語音導覽支援東京至新大阪。"},"zh-Hans":{"label":"Android 应用","title":"关闭屏幕，继续聆听","body":"关闭屏幕后，乘车语音导览仍会继续。","free":"免费，无需注册。","play":"在 Google Play 查看","playLabel":"在 Google Play 查看 (在新标签页打开)","close":"隐藏此提示14天","closed":"已隐藏提示14天。","failed":"已关闭提示，但无法保存。","generalTitle":"在应用中探索车窗图鉴","generalBody":"在应用中浏览图鉴。语音导览支持东京至新大阪。"}};
  const css = "#android-app-invite{--safe-top:env(safe-area-inset-top,0px);--safe-bottom:env(safe-area-inset-bottom,0px);--safe-left:env(safe-area-inset-left,0px);--safe-right:env(safe-area-inset-right,0px);position:fixed;z-index:90;width:min(310px,calc(100vw - 24px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px)));margin:0;padding:10px 12px;border:1px solid #d7e5ef;border-radius:14px;background:linear-gradient(120deg,#fff,#f0f7fc);box-shadow:0 5px 24px #15375230;color:#193c52;font:13px/1.5 system-ui,sans-serif;text-align:left;box-sizing:border-box;max-height:40dvh;overflow:auto}\n#android-app-invite[hidden]{display:none!important}#android-app-invite .context-label{display:block;color:#486b82;font-size:10px;line-height:12px}#android-app-invite h2{font:600 14px/20px system-ui,sans-serif;margin:0}#android-app-invite p{font:12px/1.45 system-ui,sans-serif;margin:4px 0 0}\n#android-app-invite .context-heading{display:flex;align-items:center;gap:8px;padding-right:34px;min-height:32px}#android-app-invite .context-heading>div{min-width:0}#android-app-invite .context-app-icon{flex:none;width:32px;height:32px;border-radius:7px;display:block}\n#android-app-invite .context-play{position:relative;display:block;width:176px;min-height:77.92px;padding:8px;margin:2px 0 0;background:transparent;text-decoration:none;box-sizing:border-box}\n#android-app-invite .context-play-badge{display:block;width:160px;height:61.92px;visibility:hidden;object-fit:contain}#android-app-invite .context-badge-loaded .context-play-badge{visibility:visible}#android-app-invite .context-play-fallback{position:absolute;inset:8px;display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:7px;background:#193c52;color:white;font:12px/1.5 system-ui,sans-serif}#android-app-invite .context-badge-loaded .context-play-fallback{display:none}\n#android-app-invite-close{position:absolute;right:2px;top:2px;width:44px;height:44px;min-height:44px;border:0;border-radius:50%;padding:0;background:transparent;color:#486b82;font:24px/1 system-ui,sans-serif;cursor:pointer}#android-app-invite-close:hover{background:#e5f0f8}\n#android-app-invite a:focus-visible,#android-app-invite-close:focus-visible{outline:3px solid #27678e;outline-offset:2px}\n#android-app-invite-announcement{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media print{#android-app-invite{display:none!important}}\n#android-app-invite .context-nowrap{white-space:nowrap}\n";
  function readInviteConfig() {
    const element = document.getElementById('mado-android-invite-config');
    if (!element || element.getAttribute('type') !== 'application/json') return null;
    let page;
    try { page = JSON.parse(element.textContent); } catch (error) { return null; }
    if (!page || typeof page !== 'object' || Array.isArray(page) || Object.keys(page).length !== 4 ||
        typeof page.language !== 'string' || !Object.prototype.hasOwnProperty.call(copies, page.language) ||
        !['landing', 'fuji_guide', 'train_search', 'live', 'gallery', 'collection', 'spot', 'feature'].includes(page.pageContext) ||
        typeof page.assetPrefix !== 'string' || !/^(?:\.\.\/)*$/.test(page.assetPrefix) ||
        typeof page.general !== 'boolean') return null;
    const localized = copies[page.language];
    return { language: page.language, pageContext: page.pageContext, assetPrefix: page.assetPrefix,
      dismissDays: 14, unknownPolicy: "show-eligible", css,
      copy: { ...localized, title: page.general ? localized.generalTitle : localized.title,
        body: page.general ? localized.generalBody : localized.body } };
  }
/* Shared browser runtime. No preview controls or install-click persistence. */
(function () {
  'use strict';
  const config = readInviteConfig();
  if (!config || document.getElementById('android-app-invite')) return;
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
  if (config.css && !document.getElementById('android-app-invite-style')) {
    const style = document.createElement('style'); style.id = 'android-app-invite-style';
    style.textContent = config.css; document.head.append(style);
  }
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
  let pointerBusy=false, controlsDirty=true, controlElements=[];
  function controls(){
    if(controlsDirty){
      controlElements=[...document.querySelectorAll('a[href],button,input,select,textarea,summary,nav,[role=button],.lang-landing-prompt,iframe,video,[data-android-invite-protect]')].filter(el=>!card.contains(el)&&!(el.matches('a:not([role=button]):not([data-cta-track]):not([data-cta-id]):not([data-android-invite-protect])')&&el.querySelector('img,picture')));
      controlsDirty=false;
    }
    return controlElements;
  }
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
    const protectedRects=[];
    for(const el of controls()){
      const t=el.getBoundingClientRect();
      if(t.width&&t.height&&t.right>ox&&t.left<ox+vw&&t.bottom>oy&&t.top<oy+vh&&(el.checkVisibility?el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}):getComputedStyle(el).visibility!=='hidden'))protectedRects.push(t);
    }
    const bar=document.querySelector('.topbar,.lp-header,header')?.getBoundingClientRect();
    const top=Math.max(oy+12+inset('top'),bar&&bar.bottom>oy&&bar.bottom<oy+vh/2?bar.bottom+10:oy+12);
    let good;
    const bottom=oy+vh-r.height-12-inset('bottom');
    for(const y of [bottom,top,(top+bottom)/2]){
      if(y<top||y+r.height>oy+vh-12-inset('bottom'))continue;
      for(const x of [ox+vw-r.width-12-inset('right'),ox+12+inset('left')])if(!protectedRects.some(t=>overlap({left:x-4,right:x+r.width+4,top:y-4,bottom:y+r.height+4},t))){good={x,y};break;}
      if(good)break;
    }
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
  // Scroll/resize only place the card: no storage probe or eligibility recheck.
  function schedule(){if(!card.isConnected||pageAway||frame)return;frame=requestAnimationFrame(()=>{frame=0;place();});}
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
  function pointerEnd(){if(pointerBusy){pointerBusy=false;schedule();}}
  window.addEventListener('pointerup',pointerEnd,{passive:true});
  window.addEventListener('pointercancel',pointerEnd,{passive:true});
  new MutationObserver(records=>{if(records.some(r=>r.target!==card&&!card.contains(r.target)&&r.target!==live)){controlsDirty=true;schedule();}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','class','open','href'],childList:true});
  document.addEventListener('fullscreenchange',schedule);
  document.addEventListener('focusin',e=>{if(!card.contains(e.target))lastFocus=e.target;schedule();});document.addEventListener('focusout',schedule);
  window.addEventListener('scroll',schedule,{passive:true,capture:true});window.addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  window.addEventListener('storage',e=>{if(e.key===key||e.key===null){localClosed=false;refresh();}});
  window.addEventListener('pagehide',()=>{pageAway=true;++generation;clearTimeout(detectionTimer);clearTimeout(timer);cancelAnimationFrame(frame);frame=0;card.hidden=true;});
  window.addEventListener('pageshow',e=>{const returning=pageAway;pageAway=false;if(e.persisted||returning)detect();else refresh();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')detect();else refresh();});
  modes.forEach(m=>{if(m&&m.addEventListener)m.addEventListener('change',refresh);else if(m&&m.addListener)m.addListener(refresh);});
  detect();
})();
})();
