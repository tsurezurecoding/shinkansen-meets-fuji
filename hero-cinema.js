/* Product controller for the approved CINEMA hero screen. */
(() => {
  'use strict';
  const hero=document.querySelector('.hero.hv');if(!hero)return;
  const inner=hero.querySelector('.hero-inner'),screen=hero.querySelector('.hv-screen'),copy=hero.querySelector('.hv-copy');
  const en=document.documentElement.lang==='en',motion=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
  const restricted=()=>motion.matches||!!connection?.saveData;
  const labels=en?['Window time','Shinkansen Window','Before the ride','On the train','Look up','Field guide','After dark','After the ride']:['窓を見る時間','新幹線の窓','乗る前','乗車中','まず窓を','車窓図鑑','夜の車窓','降りたあと'];
  const text=en?{prev:'Previous scene',next:'Next scene',pause:'Pause',play:'Play',again:'Play again',scenes:'Scenes',top:'Home',frame:'Shinkansen Window introduction film',error:'The film could not load. You can still use the cards below.'}:{prev:'前の場面',next:'次の場面',pause:'一時停止',play:'再生',again:'もう一度見る',scenes:'場面',top:'トップ',frame:'新幹線の窓 紹介PV',error:'紹介映像を読み込めませんでした。下のカードからご利用いただけます。'};
  const rail=document.createElement('div');rail.className='hv-rail';
  rail.innerHTML=`<p class="hv-now" aria-live="polite"></p><button type="button" class="hv-arrow" data-dir="-1" aria-label="${text.prev}">‹</button><ol class="hv-chapters" aria-label="${text.scenes}" style="--n:8">${labels.map((l,i)=>`<li><button type="button" data-ch="${i}" aria-label="${String(i+1).padStart(2,'0')} ${l}"><span>${String(i+1).padStart(2,'0')}</span></button></li>`).join('')}</ol><button type="button" class="hv-arrow" data-dir="1" aria-label="${text.next}">›</button><button type="button" class="hv-toggle"></button>`;
  inner.insertBefore(rail,screen.nextSibling);
  const status=document.createElement('p');status.className='hv-status';status.setAttribute('role','status');inner.insertBefore(status,rail.nextSibling);
  const header=document.querySelector('.topbar,header'),cards=inner.querySelector('.hero-cards');
  function size(){const vw=document.documentElement.clientWidth,hh=header?.getBoundingClientRect().height||0;const below=rail.getBoundingClientRect().height+(cards?.getBoundingClientRect().height||0)+(vw>=900?16:14);const w=Math.min(vw,1680),h=Math.min(w*9/16,Math.max(vw>=900?340:180,innerHeight-hh-below));hero.style.setProperty('--hv-w',Math.round(w)+'px');hero.style.setProperty('--hv-h',Math.round(h)+'px');}
  addEventListener('resize',size);addEventListener('load',size);document.fonts.ready.then(size);size();
  const observer=new ResizeObserver(size);if(header)observer.observe(header);observer.observe(cards);observer.observe(rail);
  const chapterButtons=[...rail.querySelectorAll('[data-ch]')],now=rail.querySelector('.hv-now'),toggle=rail.querySelector('.hv-toggle');
  let frame=null,ready=false,visible=false,playing=!restricted(),finished=false,pending=null,timeout=0;
  const origin=location.protocol==='file:'?'*':location.origin;
  const trusted=e=>location.protocol==='file:'?['null','file://'].includes(e.origin):e.origin===location.origin;
  const send=data=>{if(ready)frame.contentWindow.postMessage({type:'hero-film',...data},origin);};
  const track=(event,data={})=>{if(typeof window.gtag==='function')window.gtag('event',event,{language:en?'en':'ja',placement:'top_hero',...data});};
  function label(){toggle.textContent=finished?text.again:playing?text.pause:text.play;}
  function current(i){now.replaceChildren();const n=document.createElement('span');n.className='num';n.textContent=i<0?'00':String(i+1).padStart(2,'0');now.append(n,i<0?text.top:labels[i]);chapterButtons.forEach((b,j)=>b.setAttribute('aria-current',String(i===j)));}
  function load(){if(frame)return;frame=document.createElement('iframe');frame.title=text.frame;frame.src=new URL('promo/hero-stage.html?film='+(en?'en':'ja'),document.baseURI).href;screen.prepend(frame);timeout=setTimeout(()=>{if(!ready)status.textContent=text.error;},20000);}
  function command(data){if(!ready){pending=data;load();}else send(data);}
  function visibility(){send({action:'visibility',visible:visible&&!document.hidden});}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!restricted())load();visibility();},{threshold:.1}).observe(screen);
  document.addEventListener('visibilitychange',visibility);
  function preferences(){if(restricted()){playing=false;label();}send({action:'preferences',restricted:restricted()});if(!restricted()&&visible&&!frame)load();}
  motion.addEventListener('change',preferences);connection?.addEventListener('change',preferences);
  rail.querySelectorAll('.hv-arrow').forEach(b=>b.addEventListener('click',()=>command({action:'step',dir:Number(b.dataset.dir),input:'arrow'})));
  chapterButtons.forEach(b=>b.addEventListener('click',()=>command({action:'go',chapter:Number(b.dataset.ch),input:'rail'})));
  toggle.addEventListener('click',()=>command({action:playing?'pause':'play'}));
  hero.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();command({action:'step',dir:e.key==='ArrowRight'?1:-1,input:'key'});}});
  addEventListener('message',e=>{
    if(!frame||e.source!==frame.contentWindow||!trusted(e)||e.data?.type!=='hero-film')return;
    const d=e.data;
    if(d.action==='ready'){ready=true;clearTimeout(timeout);status.textContent='';screen.dataset.ready='true';send({action:'preferences',restricted:restricted()});visibility();if(pending){send(pending);pending=null;}playing=d.playing&&!restricted();label();}
    else if(d.action==='hero')copy.dataset.hidden=String(d.value<.5);
    else if(d.action==='chapter'&&Number.isInteger(d.chapter)&&d.chapter>=-1&&d.chapter<labels.length)current(d.chapter);
    else if(d.action==='state'){playing=d.playing;finished=!!d.finished;label();}
    else if(d.action==='manual')track('hero_film_chapter',{chapter:d.chapter,input:d.input});
    else if(d.action==='complete')track('hero_film_auto_complete');
    else if(d.action==='error'){status.textContent=text.error;copy.dataset.hidden='false';screen.dataset.ready='false';playing=false;label();}
  });
  current(-1);label();
})();
