/* Generated from scripts/shared/android-app-invite-* sources. Do not edit. */
(function () {
  'use strict';
  const copies = {"ja":{"label":"Androidアプリのご案内","title":"アプリなら案内ももっと便利に","body":"見どころを通知や音声でお知らせ。","free":"無料・登録不要。","play":"Google Playで見る","playLabel":"Google Playで見る (新しいタブで開きます)","close":"案内を閉じて14日間表示しない","closed":"案内を閉じました。14日間表示しません。","failed":"案内を閉じました。保存できませんでした。","generalTitle":"車窓図鑑をアプリでも","generalBody":"図鑑や旅の案内をアプリで。音声案内は東京〜新大阪に対応。"},"en":{"label":"Android app","title":"Better guidance with the app","body":"Get notifications or audio for sights along the way.","free":"Free, no sign-up.","play":"View on Google Play","playLabel":"View on Google Play (opens a new tab)","close":"Dismiss invitation for 14 days","closed":"Invitation hidden for 14 days.","failed":"Dismissed here; saving failed.","generalTitle":"Explore the views in the app","generalBody":"Explore the field guide in the app. Audio guidance covers Tokyo–Shin-Osaka."},"fr":{"label":"Application Android","title":"Un guidage plus pratique avec l’application","body":"Recevez des notifications ou des annonces audio pour les sites à voir.","free":"Gratuit, sans inscription.","play":"Voir sur Google Play","playLabel":"Voir sur Google Play (ouvre un nouvel onglet)","close":"Masquer cette invitation pendant 14 jours","closed":"Invitation masquée pendant 14 jours.","failed":"Invitation fermée ; enregistrement impossible.","generalTitle":"Les paysages dans l’application","generalBody":"Explorez le guide dans l’application. Guidage audio de Tokyo à Shin-Osaka."},"de":{"label":"Android-App","title":"Noch bequemer mit der App","body":"Benachrichtigungen oder Audiohinweise zu den Sehenswürdigkeiten unterwegs.","free":"Kostenlos, ohne Anmeldung.","play":"Bei Google Play ansehen","playLabel":"Bei Google Play ansehen (öffnet einen neuen Tab)","close":"Einladung für 14 Tage ausblenden","closed":"Einladung für 14 Tage ausgeblendet.","failed":"Geschlossen; Speichern fehlgeschlagen.","generalTitle":"Die Aussicht in der App","generalBody":"Entdecken Sie den Reiseführer in der App. Audioführung: Tokio–Shin-Osaka."},"es":{"label":"Aplicación Android","title":"Una guía más cómoda con la app","body":"Recibe avisos o indicaciones de audio sobre los lugares de interés.","free":"Gratis, sin registro.","play":"Ver en Google Play","playLabel":"Ver en Google Play (abre una pestaña nueva)","close":"Ocultar la invitación durante 14 días","closed":"Invitación oculta durante 14 días.","failed":"Cerrado; no se pudo guardar.","generalTitle":"Descubre las vistas en la app","generalBody":"Explora la guía en la app. Audio entre Tokio y Shin-Osaka."},"ko":{"label":"Android 앱","title":"앱으로 더 편리하게 안내받으세요","body":"볼거리를 알림이나 음성으로 안내해 드려요.","free":"무료·가입 불필요.","play":"Google Play에서 보기","playLabel":"Google Play에서 보기 (새 탭에서 열림)","close":"14일 동안 안내 숨기기","closed":"14일 동안 안내를 표시하지 않습니다.","failed":"안내를 닫았습니다. 저장하지 못했습니다.","generalTitle":"앱에서도 차창 도감을","generalBody":"앱에서 차창 도감을 둘러보세요. 음성 안내는 도쿄~신오사카 구간을 지원합니다."},"zh-Hant":{"label":"Android 應用程式","title":"用 App，導覽更方便","body":"透過通知或語音提醒沿途看點。","free":"免費，無需註冊。","play":"在 Google Play 查看","playLabel":"在 Google Play 查看 (在新分頁開啟)","close":"隱藏此提示14天","closed":"已隱藏提示14天。","failed":"已關閉提示，但無法儲存。","generalTitle":"在應用程式探索車窗圖鑑","generalBody":"在應用程式瀏覽圖鑑。語音導覽支援東京至新大阪。"},"zh-Hans":{"label":"Android 应用","title":"用 App，导览更方便","body":"通过通知或语音提醒沿途看点。","free":"免费，无需注册。","play":"在 Google Play 查看","playLabel":"在 Google Play 查看 (在新标签页打开)","close":"隐藏此提示14天","closed":"已隐藏提示14天。","failed":"已关闭提示，但无法保存。","generalTitle":"在应用中探索车窗图鉴","generalBody":"在应用中浏览图鉴。语音导览支持东京至新大阪。"}};
  const trainCopies = {"ja":{"label":"Androidアプリのご案内","title":"画面を消しても車窓案内","body":"案内を始めると、見どころを通知や音声でお知らせします。","free":"無料・登録不要。","play":"Google Playで見る","playLabel":"Google Playで見る (新しいタブで開きます)","close":"案内を閉じて14日間表示しない","closed":"案内を閉じました。14日間表示しません。","failed":"案内を閉じました。保存できませんでした。","learn":"Web版との違い・使い方","notice":""},"en":{"label":"Android app","title":"Guidance with your screen off","body":"Turn on guidance to get notifications or audio for sights along the way.","free":"Free, no sign-up.","play":"View on Google Play","playLabel":"View on Google Play (opens a new tab)","close":"Dismiss invitation for 14 days","closed":"Invitation hidden for 14 days.","failed":"Dismissed here; saving failed.","learn":"App features and setup","notice":""},"fr":{"label":"Application Android","title":"Le guidage, même écran éteint","body":"Activez le guidage pour recevoir des notifications ou des annonces audio aux points d’intérêt.","free":"Gratuit, sans inscription.","play":"Voir sur Google Play","playLabel":"Voir sur Google Play (ouvre un nouvel onglet)","close":"Masquer cette invitation pendant 14 jours","closed":"Invitation masquée pendant 14 jours.","failed":"Invitation fermée ; enregistrement impossible.","learn":"Fonctionnalités et utilisation (anglais)","notice":""},"de":{"label":"Android-App","title":"Hinweise bei ausgeschaltetem Bildschirm","body":"Aktivieren Sie die Begleitung, um Hinweise zu Sehenswürdigkeiten als Benachrichtigung oder Audio zu erhalten.","free":"Kostenlos, ohne Anmeldung.","play":"Bei Google Play ansehen","playLabel":"Bei Google Play ansehen (öffnet einen neuen Tab)","close":"Einladung für 14 Tage ausblenden","closed":"Einladung für 14 Tage ausgeblendet.","failed":"Geschlossen; Speichern fehlgeschlagen.","learn":"Funktionen und Nutzung (Englisch)","notice":""},"es":{"label":"Aplicación Android","title":"Avisos con la pantalla apagada","body":"Activa la guía para recibir notificaciones o avisos de audio sobre los lugares de interés.","free":"Gratis, sin registro.","play":"Ver en Google Play","playLabel":"Ver en Google Play (abre una pestaña nueva)","close":"Ocultar la invitación durante 14 días","closed":"Invitación oculta durante 14 días.","failed":"Cerrado; no se pudo guardar.","learn":"Funciones y uso de la app (inglés)","notice":""},"ko":{"label":"Android 앱","title":"화면을 꺼도 차창 안내","body":"안내를 시작하면 볼거리를 알림이나 음성으로 알려 드려요.","free":"무료·가입 불필요.","play":"Google Play에서 보기","playLabel":"Google Play에서 보기 (새 탭에서 열림)","close":"14일 동안 안내 숨기기","closed":"14일 동안 안내를 표시하지 않습니다.","failed":"안내를 닫았습니다. 저장하지 못했습니다.","learn":"앱 기능과 사용법 (영어)","notice":""},"zh-Hant":{"label":"Android 應用程式","title":"關閉螢幕，也不錯過風景","body":"開始導覽後，透過通知或語音提醒沿途看點。","free":"免費，無需註冊。","play":"在 Google Play 查看","playLabel":"在 Google Play 查看 (在新分頁開啟)","close":"隱藏此提示14天","closed":"已隱藏提示14天。","failed":"已關閉提示，但無法儲存。","learn":"App 功能與使用方式（英文）","notice":""},"zh-Hans":{"label":"Android 应用","title":"关闭屏幕，也不错过风景","body":"开始导览后，通过通知或语音提醒沿途看点。","free":"免费，无需注册。","play":"在 Google Play 查看","playLabel":"在 Google Play 查看 (在新标签页打开)","close":"隐藏此提示14天","closed":"已隐藏提示14天。","failed":"已关闭提示，但无法保存。","learn":"App 功能与使用方式（英文）","notice":""},"it":{"label":"App Android","free":"Gratis, senza registrazione.","play":"Visualizza su Google Play","playLabel":"Visualizza su Google Play (si apre in una nuova scheda)","title":"Avvisi anche a schermo spento","body":"Avvia la guida per ricevere notifiche o avvisi audio sui luoghi lungo il percorso.","learn":"Funzioni e utilizzo dell’app (inglese)","notice":"La guida audio è disponibile in inglese e nelle altre lingue supportate dall’app."},"th":{"label":"แอป Android","free":"ฟรี ไม่ต้องลงทะเบียน","play":"ดูใน Google Play","playLabel":"ดูใน Google Play (เปิดแท็บใหม่)","title":"ปิดหน้าจอก็ไม่พลาดวิว","body":"เริ่มการนำทางเพื่อรับการแจ้งเตือนหรือเสียงบรรยายเมื่อถึงจุดชมวิวระหว่างทาง","learn":"ฟังก์ชันและวิธีใช้แอป (ภาษาอังกฤษ)","notice":"เสียงบรรยายในแอปรองรับภาษาอังกฤษและภาษาอื่นที่มีให้บริการ"}};
  const css = "#android-app-invite{--safe-top:env(safe-area-inset-top,0px);--safe-bottom:env(safe-area-inset-bottom,0px);--safe-left:env(safe-area-inset-left,0px);--safe-right:env(safe-area-inset-right,0px);position:fixed;z-index:90;width:min(310px,calc(100vw - 24px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px)));margin:0;padding:10px 12px;border:1px solid #d7e5ef;border-radius:14px;background:linear-gradient(120deg,#fff,#f0f7fc);box-shadow:0 5px 24px #15375230;color:#193c52;font:13px/1.5 system-ui,sans-serif;text-align:left;box-sizing:border-box;max-height:40dvh;overflow:auto}\n#android-app-invite[hidden]{display:none!important}#android-app-invite .context-label{display:block;color:#486b82;font-size:10px;line-height:12px}#android-app-invite h2{font:600 14px/20px system-ui,sans-serif;margin:0}#android-app-invite p{font:12px/1.45 system-ui,sans-serif;margin:4px 0 0}\n#android-app-invite .context-heading{display:flex;align-items:center;gap:8px;padding-right:34px;min-height:32px}#android-app-invite .context-heading>div{min-width:0}#android-app-invite .context-app-icon{flex:none;width:32px;height:32px;border-radius:7px;display:block}\n#android-app-invite .context-play{position:relative;display:block;width:176px;min-height:77.92px;padding:8px;margin:2px 0 0;background:transparent;text-decoration:none;box-sizing:border-box}\n#android-app-invite .context-play-badge{display:block;width:160px;height:61.92px;visibility:hidden;object-fit:contain}#android-app-invite .context-badge-loaded .context-play-badge{visibility:inherit}#android-app-invite .context-play-fallback{position:absolute;inset:8px;display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:7px;background:#193c52;color:white;font:12px/1.5 system-ui,sans-serif}#android-app-invite .context-badge-loaded .context-play-fallback{display:none}\n#android-app-invite-close{position:absolute;right:2px;top:2px;width:44px;height:44px;min-height:44px;border:0;border-radius:50%;padding:0;background:transparent;color:#486b82;font:24px/1 system-ui,sans-serif;cursor:pointer}#android-app-invite-close:hover{background:#e5f0f8}\n#android-app-invite a:focus-visible,#android-app-invite-close:focus-visible{outline:3px solid #27678e;outline-offset:2px}\n#android-app-invite-announcement{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media print{#android-app-invite{display:none!important}}\n#android-app-invite .context-nowrap{white-space:nowrap}\n#android-app-invite.android-app-invite-inline{position:static;z-index:auto;width:auto;max-width:none;max-height:none;margin:14px 0;padding:16px;background:linear-gradient(120deg,#fff,#edf7f8);border-color:#cfdee3;box-shadow:none;overflow:visible;font:inherit}\n#android-app-invite.android-app-invite-inline .context-heading{padding-right:0;gap:10px}\n#android-app-invite.android-app-invite-inline .context-app-icon{width:40px;height:40px;border-radius:9px}\n#android-app-invite.android-app-invite-inline .context-label{font-size:10px;line-height:1.5;letter-spacing:.06em}\n#android-app-invite.android-app-invite-inline h3{font:600 18px/1.5 system-ui,sans-serif;margin:0;overflow-wrap:anywhere}\n#android-app-invite.android-app-invite-inline p{font:14px/1.7 system-ui,sans-serif;margin:10px 0 0;overflow-wrap:anywhere}\n#android-app-invite.android-app-invite-inline .context-free{display:inline-block}\n#android-app-invite.android-app-invite-inline .context-notice{font-size:12px;color:#486b82}\n#android-app-invite.android-app-invite-inline .context-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;margin-top:12px}\n#android-app-invite.android-app-invite-inline .context-play{position:static;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:auto;min-width:0;min-height:44px;max-width:100%;margin:0;padding:10px 16px;border-radius:10px;background:#193c52;color:#fff;text-align:center;font:600 14px/1.5 system-ui,sans-serif;box-sizing:border-box;overflow-wrap:anywhere}\n#android-app-invite.android-app-invite-inline .context-learn{display:inline-flex;align-items:center;min-height:44px;color:#26566d;font:14px/1.6 system-ui,sans-serif;overflow-wrap:anywhere}\n";
  function readInviteConfig() {
    const element = document.getElementById('mado-android-invite-config');
    if (!element || element.getAttribute('type') !== 'application/json') return null;
    let page;
    try { page = JSON.parse(element.textContent); } catch (error) { return null; }
    if (!page || typeof page !== 'object' || Array.isArray(page) || Object.keys(page).length !== 4 ||
        typeof page.language !== 'string' || !Object.prototype.hasOwnProperty.call(trainCopies, page.language) ||
        !['landing', 'fuji_guide', 'train_search', 'live', 'gallery', 'collection', 'spot', 'feature'].includes(page.pageContext) ||
        typeof page.assetPrefix !== 'string' || !/^(?:\.\.\/)*$/.test(page.assetPrefix) ||
        typeof page.general !== 'boolean') return null;
    const train = page.pageContext === 'train_search';
    const localized = train ? trainCopies[page.language] : copies[page.language];
    if (!localized) return null;
    return { language: page.language, pageContext: page.pageContext, assetPrefix: page.assetPrefix,
      dismissDays: 14, unknownPolicy: "show-eligible", css,
      copy: train ? localized : { ...localized, title: page.general ? localized.generalTitle : localized.title,
        body: page.general ? localized.generalBody : localized.body } };
  }
/* Shared browser runtime. No preview controls or install-click persistence. */
(function () {
  'use strict';
  const config = readInviteConfig();
  if (!config || document.getElementById('android-app-invite')) return;
  const inline = config.pageContext === 'train_search';
  const entrySource = inline ? 'android_browser_train_inline' : 'android_browser_floating';
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
  const floatingHTML='<button id="android-app-invite-close" type="button" aria-label="'+escape(c.close)+'" title="'+escape(c.close)+'"><span aria-hidden="true">×</span></button><div class="context-heading"><img class="context-app-icon" width="32" height="32" alt=""><div><span class="context-label">'+escape(c.label)+'</span><h2 id="android-app-invite-title">'+escape(c.title)+'</h2></div></div><p>'+escape(c.body)+' <span>'+escape(c.free)+'</span></p><a class="context-play" aria-label="'+escape(c.playLabel||c.play)+' ↗" href="https://play.google.com/store/apps/details?id='+pkg+'&amp;utm_source=shinkansen_window_web&amp;utm_medium=android_browser_floating&amp;utm_campaign=android_app_invite" target="_blank" rel="noopener noreferrer"><img class="context-play-badge" width="646" height="250" alt=""><span class="context-play-fallback">'+escape(c.play)+' ↗</span></a>';
  const title = config.language==='ja' ? '<span class="copy-chunk">画面を消しても</span><span class="copy-chunk">車窓案内</span>' : escape(c.title);
  const trainHTML = inline ? '<div class="context-heading"><img class="context-app-icon" width="40" height="40" alt=""><div><span class="context-label">'+escape(c.label)+'</span><h3 id="android-app-invite-title">'+title+'</h3></div></div><p>'+escape(c.body)+' <span class="context-free">'+escape(c.free)+'</span></p>'+(c.notice?'<p class="context-notice">'+escape(c.notice)+'</p>':'')+'<div class="context-actions"><a class="context-play" aria-label="'+escape(c.playLabel)+'" href="https://play.google.com/store/apps/details?id='+pkg+'&amp;utm_source=shinkansen_window_web&amp;utm_medium='+entrySource+'&amp;utm_campaign=android_app_invite" target="_blank" rel="noopener noreferrer">'+escape(c.play)+' <span aria-hidden="true">↗</span></a><a class="context-learn" hreflang="'+(config.language==='ja'?'ja':'en')+'" href="'+asset((config.language==='ja'?'':'en/')+'android-app.html#eaWhyTitle')+'">'+escape(c.learn)+' <span aria-hidden="true">›</span></a></div>' : '';
  card.classList.toggle('android-app-invite-inline',inline);
  card.innerHTML=inline?trainHTML:floatingHTML;
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
    try { window.gtag('event',name,{entry_source:entrySource,language:config.language,page_context:config.pageContext,variant:inline?'train_inline_v1':'floating_v2_14d',cta_id:'android_app_invite',install_status:status}); return true; } catch(e) { return false; }
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
    if(inline){card.style.visibility='visible';card.inert=false;viewed();return;}
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
  function mountInline(){
    const section=document.getElementById('timelineSection'),answer=document.getElementById('fujiTrainAnswer');
    // app.js owns this classic-script lexical state in every edition. The Japanese scenery preview is optional.
    let selected=false;
    try{selected=typeof journey!=='undefined'&&journey?.mode==='train'&&journey.preview!==true;}catch(error){return false;}
    if(!selected||!section||section.hidden)return false;
    const anchor=answer&&!answer.hidden?answer:section.querySelector('.section-head');
    if(!anchor)return false;
    if(anchor.nextElementSibling!==card)anchor.after(card);
    return true;
  }
  function refresh(){
    clearTimeout(timer);let s,available=true;
    try{s=read();storageReady();}catch(e){available=false;}
    const canShow=status!=='checking'&&status!=='installed'&&config.unknownPolicy==='show-eligible';
    const visible=!pageAway&&available&&browser()&&canShow&&!localClosed&&(!s||s.dismissedAt+dismissMs<=Date.now())&&(!inline||mountInline());
    const focused=card.contains(document.activeElement);card.hidden=!visible;if(!visible&&focused)focusBack();
    if(visible){
      const icon=card.querySelector('.context-app-icon');if(!icon.hasAttribute('src'))icon.src=asset('images/android/app-icon-192.webp');
      if(!inline){const badge=card.querySelector('.context-play-badge');if(!badge.hasAttribute('src')){badge.addEventListener('load',()=>{badge.parentElement.classList.add('context-badge-loaded');schedule();},{once:true});badge.src=asset('images/google-play/'+(config.language==='ja'?'ja':'en')+'-badge.png');}}
      place();
    }
    if(available&&s&&s.dismissedAt+dismissMs>Date.now()&&!localClosed)timer=setTimeout(refresh,Math.min(s.dismissedAt+dismissMs-Date.now(),2147483647));
  }
  // Floating scroll/resize only place the card; inline updates follow train-result DOM changes.
  function schedule(){if(!card.isConnected||pageAway||frame)return;frame=requestAnimationFrame(()=>{frame=0;inline?refresh():place();});}
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
  const closeButton=card.querySelector('button');
  if(closeButton)closeButton.onclick=()=>{
    let saved=true;try{localStorage.setItem(key,JSON.stringify({v:2,dismissedAt:Date.now()}));}catch(e){saved=false;}
    localClosed=!saved;track('android_app_invite_dismiss');focusBack();refresh();
    live.textContent=saved?c.closed:c.failed;
  };
  card.querySelector('a').addEventListener('click',()=>track('android_app_invite_play_click')); // Click is not installation; no persistent stop.
  if(inline)card.querySelector('.context-learn').addEventListener('click',()=>track('android_app_guide_click'));
  window.addEventListener('mado:android-invite-state',schedule);
  document.addEventListener('pointerdown',e=>{if(!card.contains(e.target)&&e.target.closest('.leaflet-container,#map,[data-train-picker],.train-results,[data-android-invite-protect]')){pointerBusy=true;schedule();}},{passive:true});
  function pointerEnd(){if(pointerBusy){pointerBusy=false;schedule();}}
  window.addEventListener('pointerup',pointerEnd,{passive:true});
  window.addEventListener('pointercancel',pointerEnd,{passive:true});
  new MutationObserver(records=>{if(records.some(r=>r.target!==card&&!card.contains(r.target)&&r.target!==live)){controlsDirty=true;schedule();}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','class','open','href',...(inline?['data-state']:[])],childList:true});
  document.addEventListener('fullscreenchange',schedule);
  document.addEventListener('focusin',e=>{if(!card.contains(e.target))lastFocus=e.target;schedule();});document.addEventListener('focusout',schedule);
  if(inline){document.addEventListener('input',schedule);document.addEventListener('change',schedule);}
  if(!inline){
    window.addEventListener('scroll',schedule,{passive:true,capture:true});window.addEventListener('resize',schedule);
    window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  }
  window.addEventListener('storage',e=>{if(e.key===key||e.key===null){localClosed=false;refresh();}});
  window.addEventListener('pagehide',()=>{pageAway=true;++generation;clearTimeout(detectionTimer);clearTimeout(timer);cancelAnimationFrame(frame);frame=0;card.hidden=true;});
  window.addEventListener('pageshow',e=>{const returning=pageAway;pageAway=false;if(e.persisted||returning)detect();else refresh();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')detect();else refresh();});
  modes.forEach(m=>{if(m&&m.addEventListener)m.addEventListener('change',refresh);else if(m&&m.addListener)m.addListener(refresh);});
  detect();
})();
})();
