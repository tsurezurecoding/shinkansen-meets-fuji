/* Product controller for the approved CINEMA hero screen. */
(() => {
  'use strict';
  const hero=document.querySelector('.hero.hv');if(!hero)return;
  const inner=hero.querySelector('.hero-inner'),screen=hero.querySelector('.hv-screen'),copy=hero.querySelector('.hv-copy');
  const en=document.documentElement.lang==='en',motion=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
  const pauseKey='michikusa.heroCinema.paused';
  let userPaused=false;try{userPaused=sessionStorage.getItem(pauseKey)==='1';}catch{}
  const rememberPause=value=>{userPaused=value;try{sessionStorage.setItem(pauseKey,value?'1':'0');}catch{}};
  const restricted=()=>motion.matches||!!connection?.saveData;
  const text=en?{pause:'Pause the film',play:'Play the film',again:'Play the film again',frame:'Shinkansen Window introduction film',error:'The film could not load. You can still use the links below.'}:{pause:'紹介映像を一時停止',play:'紹介映像を再生',again:'紹介映像をもう一度見る',frame:'新幹線の窓 紹介PV',error:'紹介映像を読み込めませんでした。下のリンクからご利用いただけます。'};
  // No chapter rail: one quiet icon in the corner keeps pause/replay available
  // (WCAG 2.2.2) without a second band under the film.
  inner.querySelector('.hv-rail')?.remove();
  const toggle=document.createElement('button');toggle.type='button';toggle.className='hv-toggle';screen.append(toggle);
  const status=document.createElement('p');status.className='hv-status';status.setAttribute('role','status');inner.insertBefore(status,screen.nextSibling);
  let frame=null,ready=false,visible=false,playing=!restricted()&&!userPaused,finished=false,pending=null,timeout=0,scheduled=false;
  const origin=location.protocol==='file:'?'*':location.origin;
  const trusted=e=>location.protocol==='file:'?['null','file://'].includes(e.origin):e.origin===location.origin;
  const send=data=>{if(ready)frame.contentWindow.postMessage({type:'hero-film',...data},origin);};
  const track=(event,data={})=>{if(typeof window.gtag==='function')window.gtag('event',event,{language:en?'en':'ja',placement:'top_hero',...data});};
  function label(){const k=finished?'again':playing?'pause':'play';toggle.dataset.state=k;toggle.setAttribute('aria-label',text[k]);toggle.title=text[k];}
  function failed(){clearTimeout(timeout);frame?.remove();frame=null;ready=false;pending=null;status.textContent=text.error;copy.dataset.hidden='false';screen.dataset.ready='false';playing=false;label();}
  function load(){if(frame)return;status.textContent='';frame=document.createElement('iframe');frame.title=text.frame;frame.src=new URL('promo/hero-stage.html?film='+(en?'en':'ja'),document.baseURI).href;screen.prepend(frame);timeout=setTimeout(()=>{if(!ready)failed();},20000);}
  function schedule(){if(scheduled||frame||restricted()||userPaused||!visible||document.hidden)return;scheduled=true;const poster=screen.querySelector('.hv-poster img');Promise.resolve(poster?.decode()).catch(()=>{}).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{scheduled=false;if(visible&&!document.hidden&&!restricted()&&!userPaused)load();})));}
  function command(data){if(data.action==='pause'){rememberPause(true);playing=false;label();if(!frame)return;}if(data.action==='play')rememberPause(false);if(!ready){pending=data;load();}else send(data);}
  function visibility(){send({action:'visibility',visible:visible&&!document.hidden});}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();visibility();},{threshold:.1}).observe(screen);
  document.addEventListener('visibilitychange',()=>{schedule();visibility();});
  addEventListener('pagehide',()=>send({action:'visibility',visible:false}));
  addEventListener('pageshow',()=>{schedule();visibility();});
  function preferences(){if(restricted()){playing=false;label();}send({action:'preferences',restricted:restricted()});schedule();}
  motion.addEventListener('change',preferences);connection?.addEventListener('change',preferences);
  toggle.addEventListener('click',()=>{const action=playing?'pause':'play';if(action==='play')finished=false;command({action});});
  hero.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();command({action:'step',dir:e.key==='ArrowRight'?1:-1,input:'key'});}});
  addEventListener('message',e=>{
    if(!frame||e.source!==frame.contentWindow||!trusted(e)||e.data?.type!=='hero-film')return;
    const d=e.data;
    if(d.action==='ready'){ready=true;clearTimeout(timeout);status.textContent='';screen.dataset.ready='true';send({action:'preferences',restricted:restricted()});if(userPaused)send({action:'pause'});visibility();if(pending){send(pending);pending=null;}playing=d.playing&&!restricted()&&!userPaused;label();}
    else if(d.action==='hero')copy.dataset.hidden=String(d.value<.5);
    else if(d.action==='state'){playing=d.playing;label();}
    else if(d.action==='manual')track('hero_film_chapter',{chapter:d.chapter,input:d.input});
    else if(d.action==='complete'){track('hero_film_auto_complete');send({action:'pause'});playing=false;finished=true;label();}
    else if(d.action==='error')failed();
  });
  label();
})();
