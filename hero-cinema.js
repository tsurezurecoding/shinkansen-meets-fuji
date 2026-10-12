/* Product controller for the approved CINEMA hero screen. */
(() => {
  'use strict';
  const hero=document.querySelector('.hero.hv');if(!hero)return;
  const inner=hero.querySelector('.hero-inner'),screen=hero.querySelector('.hv-screen'),copy=hero.querySelector('.hv-copy');
  const page=document.documentElement.lang,film=window.MADO_LOCALES?.languages.includes(page)?page:(['en','fr','zh-Hant'].includes(page)?page:'ja'),en=film!=='ja',motion=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
  const pauseKey='michikusa.heroCinema.paused';
  let userPaused=false; // no pause control any more, so an old stored pause is ignored
  const rememberPause=value=>{userPaused=value;try{sessionStorage.setItem(pauseKey,value?'1':'0');}catch{}};
  const restricted=()=>motion.matches||!!connection?.saveData;
  const text={ja:{frame:'新幹線の窓 紹介PV',error:'紹介映像を読み込めませんでした。下のリンクからご利用いただけます。'},en:{frame:'Shinkansen Window introduction film',error:'The film could not load. You can still use the links below.'},fr:{frame:'Fenêtre du Shinkansen : film de présentation',error:'Le film n’a pas pu être chargé. Les liens ci-dessous restent disponibles.'},'zh-Hant':{frame:'新幹線之窗 介紹影片',error:'無法載入介紹影片。仍可使用下方連結。'},de:{frame:'Shinkansen-Fenster: Einführung',error:'Der Film konnte nicht geladen werden. Die Links unten können Sie weiterhin nutzen.'},es:{frame:'Ventana del Shinkansen: presentación',error:'No se pudo cargar el vídeo. Puedes seguir usando los enlaces de abajo.'},'zh-Hans':{frame:'新干线之窗 介绍视频',error:'无法加载介绍视频。仍可使用下方链接。'},ko:{frame:'신칸센의 창 소개 영상',error:'소개 영상을 불러오지 못했습니다. 아래 링크는 계속 이용할 수 있습니다.'}}[film];
  // The introduction button starts immediately; otherwise it plays once, then rests on
  // the hero frame (and never autoplays with reduced motion or Save-Data).
  inner.querySelector('.hv-rail')?.remove();
  const status=document.createElement('p');status.className='hv-status';status.setAttribute('role','status');inner.insertBefore(status,screen.nextSibling);
  let frame=null,ready=false,visible=false,playing=!restricted()&&!userPaused,finished=false,pending=null,timeout=0,scheduled=false;
  const origin=location.protocol==='file:'?'*':location.origin;
  const trusted=e=>location.protocol==='file:'?['null','file://'].includes(e.origin):e.origin===location.origin;
  const send=data=>{if(ready)frame.contentWindow.postMessage({type:'hero-film',...data},origin);};
  const track=(event,data={})=>{if(typeof window.gtag==='function')window.gtag('event',event,{language:film,placement:'top_hero',...data});};
  const labels={ja:['説明を見る','もう一度見る'],en:['Watch introduction','Watch again'],fr:['Voir la présentation','Revoir'],'zh-Hant':['觀看介紹','再次觀看'],de:['Einführung ansehen','Noch einmal ansehen'],es:['Ver presentación','Volver a ver'],'zh-Hans':['观看介绍','再次观看'],ko:['소개 보기','다시 보기']}[film];
  const trigger=document.createElement('button');trigger.type='button';trigger.className='hero-film-button';
  const caption=document.createElement('span'),icon=document.createElement('span');icon.textContent=' ▶';icon.setAttribute('aria-hidden','true');trigger.append(caption,icon);copy.append(trigger);
  trigger.addEventListener('click',()=>{finished=false;track('hero_film_play',{input:'button'});command({action:'play'});});
  function label(){trigger.tabIndex=copy.dataset.hidden==='true'?-1:0;caption.textContent=labels[finished?1:0];}
  function failed(){clearTimeout(timeout);frame?.remove();frame=null;ready=false;pending=null;status.textContent=text.error;copy.dataset.hidden='false';screen.dataset.ready='false';playing=false;label();}
  function load(){if(frame)return;status.textContent='';frame=document.createElement('iframe');frame.title=text.frame;frame.src=new URL('promo/hero-stage.html?film='+film,document.baseURI).href;screen.prepend(frame);timeout=setTimeout(()=>{if(!ready)failed();},20000);}
  function schedule(){if(scheduled||frame||restricted()||userPaused||!visible||document.hidden)return;scheduled=true;const poster=screen.querySelector('.hv-poster img');Promise.resolve(poster?.decode()).catch(()=>{}).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduled=false;if(visible&&!document.hidden&&!restricted()&&!userPaused)load();})));}
  function command(data){if(data.action==='pause'){rememberPause(true);playing=false;label();if(!frame)return;}if(data.action==='play')rememberPause(false);if(!ready){pending=data;load();}else send(data);}
  function visibility(){send({action:'visibility',visible:visible&&!document.hidden});}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();visibility();},{threshold:.1}).observe(screen);
  document.addEventListener('visibilitychange',()=>{schedule();visibility();});
  addEventListener('pagehide',()=>send({action:'visibility',visible:false}));
  addEventListener('pageshow',()=>{schedule();visibility();});
  function preferences(){if(restricted()){playing=false;label();}send({action:'preferences',restricted:restricted()});schedule();}
  motion.addEventListener('change',preferences);connection?.addEventListener('change',preferences);
  hero.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();command({action:'step',dir:e.key==='ArrowRight'?1:-1,input:'key'});}});
  addEventListener('message',e=>{
    if(!frame||e.source!==frame.contentWindow||!trusted(e)||e.data?.type!=='hero-film')return;
    const d=e.data;
    if(d.action==='ready'){ready=true;clearTimeout(timeout);status.textContent='';screen.dataset.ready='true';send({action:'preferences',restricted:restricted()});if(userPaused)send({action:'pause'});visibility();if(pending){send(pending);pending=null;}playing=d.playing&&!restricted()&&!userPaused;label();}
    else if(d.action==='hero'){copy.dataset.hidden=String(d.value<.5);label();}
    else if(d.action==='state'){playing=d.playing;label();}
    else if(d.action==='manual')track('hero_film_chapter',{chapter:d.chapter,input:d.input});
    else if(d.action==='complete'){track('hero_film_auto_complete');send({action:'pause'});playing=false;finished=true;label();}
    else if(d.action==='error')failed();
  });
  label();
})();
