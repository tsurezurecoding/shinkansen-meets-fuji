(() => {
  'use strict';
  addEventListener('message',e=>{
    const ownOrigin=location.protocol==='file:'?['null','file://'].includes(e.origin):e.origin===location.origin;
    if(e.source!==parent||!ownOrigin||e.data?.type!=='intro-film-viewport'||!Number.isFinite(e.data.height))return;
    document.documentElement.style.setProperty('--film-screen-height',Math.max(120,Math.min(900,e.data.height))+'px');
  });
  // Keep the film and controls visible; supplementary reading remains available.
  const details=document.createElement('details');details.className='film-details';
  const summary=document.createElement('summary');summary.textContent=PV_FILM.lang==='en'?'Scenes, transcript & credits':'シーン説明・文字起こし・クレジット';
  details.append(summary);
  const main=document.querySelector('main');
  for(const node of main.querySelectorAll('.caption,.motion-note,.transcript,.credits'))details.append(node);
  main.append(details);
  const send=(action,data={})=>{if(parent!==window)parent.postMessage({type:'intro-film',action,...data},location.protocol==='file:'?'*':location.origin);};
  addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();send('close');}});
  let lastHeight=0;
  const fit=()=>{const height=Math.ceil(document.querySelector('main').getBoundingClientRect().height);if(height!==lastHeight){lastHeight=height;send('height',{height});}};
  new ResizeObserver(fit).observe(document.querySelector('main'));
  PV_PLAYER.ready.then(()=>{send('ready');fit();}).catch(()=>send('error'));
  for(const id of ['visit','end-link'])document.getElementById(id).addEventListener('click',()=>send('browse'));
  // Accumulate genuine forward playback; seeks do not count as watched time.
  let previous=null,watched=0,started=false,half=false,complete=false;
  const timer=setInterval(()=>{
    const s=PV_PLAYER.state;
    if(s.playing&&!started){started=true;send('start');}
    if(previous?.playing&&s.renderedTime>previous.renderedTime){const delta=s.renderedTime-previous.renderedTime;if(delta<=.8)watched+=delta;}
    if(!half&&watched>=24.5){half=true;send('half');}
    if(!complete&&watched>=47&&s.time>=49){complete=true;send('complete');}
    previous=s;
  },250);
  addEventListener('pagehide',()=>clearInterval(timer),{once:true});
})();
