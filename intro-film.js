/* Load the film only after the visitor chooses to watch it. */
(() => {
  'use strict';
  const trigger=document.querySelector('[data-intro-film]');
  if(!trigger||typeof HTMLDialogElement==='undefined'||!HTMLDialogElement.prototype.showModal)return;
  const en=document.documentElement.lang==='en';
  const copy=en?{title:'Discover Shinkansen Window',close:'Close',loading:'Preparing your window journey…',error:'The film could not load. You can open it separately below.',browse:'Explore the views',preview:'Try a preview ride',separate:'Open the film separately',frame:'Shinkansen Window introduction film'}:{title:'新幹線の窓を知る',close:'閉じる',loading:'旅の準備をしています…',error:'PVを読み込めませんでした。下のリンクから別画面でも開けます。',browse:'車窓図鑑を見る',preview:'乗車プレビューで試す',separate:'PVを別画面で開く',frame:'新幹線の窓 紹介PV'};
  let dialog,frame,launch;
  const fitFilm=()=>frame?.contentWindow?.postMessage({type:'intro-film-viewport',height:Math.max(120,innerHeight*.92-320)},location.protocol==='file:'?'*':location.origin);
  addEventListener('resize',fitFilm);
  const track=(event,extra={})=>{if(typeof window.gtag==='function')window.gtag('event',event,{language:en?'en':'ja',placement:'top_hero',film:'cinema',...extra});};
  function close(){if(dialog?.open)dialog.close();}
  function create(){
    dialog=document.createElement('dialog');dialog.className='intro-film-dialog';dialog.setAttribute('aria-labelledby','intro-film-title');
    const header=document.createElement('div');header.className='intro-film-head';
    const heading=document.createElement('h2');heading.id='intro-film-title';heading.textContent=copy.title;
    const button=document.createElement('button');button.type='button';button.className='intro-film-close';button.textContent=copy.close+' ×';button.autofocus=true;button.addEventListener('click',close);
    header.append(heading,button);
    const status=document.createElement('p');status.className='intro-film-status';status.setAttribute('role','status');status.textContent=copy.loading;
    frame=document.createElement('iframe');frame.className='intro-film-frame';frame.title=copy.frame;frame.allow='autoplay; fullscreen';
    frame.addEventListener('load',fitFilm);
    const actions=document.createElement('div');actions.className='intro-film-actions';
    for(const [route,label,kind] of [[(en?'en/':'')+'zukan.html',copy.browse,'browse'],[(en?'en/':'')+'live/',copy.preview,'preview'],[trigger.getAttribute('href'),copy.separate,'separate']]){
      const a=document.createElement('a');a.href=new URL(route,document.baseURI).href;a.textContent=label;
      if(kind==='separate'){a.className='intro-film-separate';a.target='_blank';a.rel='noopener';}
      a.addEventListener('click',()=>{track('intro_film_cta',{destination:kind});close();});actions.append(a);
    }
    dialog.append(header,status,frame,actions);document.body.append(dialog);
    dialog.addEventListener('close',()=>{
      frame.removeAttribute('src');frame.remove();dialog.remove();dialog=null;frame=null;
      document.documentElement.classList.remove('intro-film-open');launch?.focus();track('intro_film_close');
    });
    dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close();}});
  }
  trigger.addEventListener('click',e=>{
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
    e.preventDefault();launch=trigger;if(dialog?.open)return;create();
    document.documentElement.classList.add('intro-film-open');dialog.showModal();
    const url=new URL(trigger.href);url.searchParams.set('play','1');frame.src=url.href;track('intro_film_open');
  });
  window.addEventListener('message',e=>{
    const ownOrigin=location.protocol==='file:'?['null','file://'].includes(e.origin):e.origin===location.origin;
    if(!frame||e.source!==frame.contentWindow||!ownOrigin||e.data?.type!=='intro-film')return;
    const d=e.data,status=dialog.querySelector('.intro-film-status');
    if(d.action==='close')close();
    else if(d.action==='height'&&Number.isFinite(d.height))frame.style.height=Math.max(240,Math.min(6000,d.height))+'px';
    else if(d.action==='ready'){status.hidden=true;fitFilm();}
    else if(d.action==='error'){status.hidden=false;status.textContent=copy.error;}
    else if(['start','half','complete','browse'].includes(d.action))track('intro_film_'+d.action);
  });
})();

/* A silent, fifteen-second hero digest; no film engine or audio is loaded. */
(() => {
  const reel=document.querySelector('.hero-reel');if(!reel)return;
  const stage=reel.querySelector('.hero-reel-stage'),button=reel.querySelector('button');
  const en=document.documentElement.lang==='en',motion=matchMedia('(prefers-reduced-motion: reduce)');
  const connection=navigator.connection;
  let ready=false,loading=false,failed=false,manual=false,visible=false,time=0,last=0,raf=0;
  const suppressed=()=>motion.matches||connection?.saveData;
  const permitted=()=>ready&&!manual&&!suppressed()&&visible&&!document.hidden&&!document.documentElement.classList.contains('intro-film-open')&&time<15000;
  function label(){button.textContent=time>=15000?(en?'Replay scenes':'もう一度見る'):manual||suppressed()?(en?'Play scenes':'映像を再生'):(en?'Pause scenes':'映像を停止');button.setAttribute('aria-label',button.textContent);}
  function draw(){const index=Math.min(2,Math.floor(time/5000));[...stage.children].forEach((s,i)=>s.classList.toggle('is-active',i===index));}
  function tick(now){if(!permitted()){raf=0;last=0;return;}if(last)time=Math.min(15000,time+now-last);last=now;draw();label();raf=time<15000?requestAnimationFrame(tick):0;}
  function sync(){button.hidden=!ready||suppressed();cancelAnimationFrame(raf);raf=0;last=0;if(suppressed()){time=0;}draw();label();if(permitted())raf=requestAnimationFrame(tick);else if(!ready&&!loading&&!failed&&!suppressed()&&visible)load();}
  async function load(){
    loading=true;
    const guide=document.createElement('div');guide.className='hero-reel-scene reel-guide';
    const night=document.createElement('div');night.className='hero-reel-scene';
    const image=name=>{const im=new Image();im.alt='';im.decoding='async';im.src=new URL('promo/assets/'+name,document.baseURI).href;return im;};
    const title=(node,text)=>{const s=document.createElement('span');s.textContent=text;node.append(s);};
    guide.append(image('ui/'+(en?'en':'ja')+'-live-fuji-eta03.webp'));title(guide,en?'Know when to look up.':'見える時刻が、わかる。');
    const grid=document.createElement('div');grid.className='hero-reel-night';
    for(const [file,name] of [['tower-night-alt',en?'Tokyo Tower':'東京タワー'],['castle-night',en?'Kiyosu Castle':'清洲城'],['chikyu-night',en?'Chikyu':'ちきゅう']]){const figure=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent=name;figure.append(image('photos/'+file+'.webp'),caption);grid.append(figure);}
    night.append(grid);title(night,en?'The journey continues after dark.':'夜にも、見たい景色がある。');
    try{await Promise.all([...guide.querySelectorAll('img'),...night.querySelectorAll('img')].map(i=>i.decode()));stage.append(guide,night);ready=true;button.hidden=false;sync();}catch{failed=true;}finally{loading=false;}
  }
  button.addEventListener('click',()=>{if(time>=15000){time=0;manual=false;}else manual=!manual;sync();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.15}).observe(reel);
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  motion.addEventListener('change',sync);connection?.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  addEventListener('pagehide',()=>cancelAnimationFrame(raf));addEventListener('pageshow',sync);
})();
