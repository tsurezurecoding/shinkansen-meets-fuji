(() => {
 const strip=document.querySelector('.scenery-strip');if(!strip)return;
 const lang=document.documentElement.lang,controls=document.querySelector('.scenery-strip-controls');
 const originals=[...strip.children],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let speed=1,pauseUntil=0,dragging=false,visible=false,hovered=false,focused=false,overflow=false,cycle=0,last=0,position=0;
 const stripLabels={ja:'景色の写真帯。横にスワイプ、または左右キーで移動。',en:'Scenery photo strip. Swipe or use arrow keys.',fr:'Bande de photos. Balayez ou utilisez les flèches du clavier.','zh-Hant':'風景照片帶。可左右滑動，或使用方向鍵瀏覽。'};
 strip.tabIndex=0;strip.setAttribute('aria-label',stripLabels[lang]||stripLabels.en);
 for(const card of originals){const clone=card.cloneNode(true);clone.dataset.stripClone='';clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;clone.removeAttribute('data-lp-cta');strip.append(clone);}
 const resize=()=>{
  strip.dataset.overflow='false';
  const first=originals[0].getBoundingClientRect(),end=originals.at(-1).getBoundingClientRect();
  overflow=end.right-first.left>strip.clientWidth+1;strip.dataset.overflow=String(overflow);controls.hidden=!overflow;
  cycle=overflow?strip.querySelector('[data-strip-clone]').offsetLeft-originals[0].offsetLeft:0;
  if(!overflow)strip.scrollLeft=0;
 };
 const pause=()=>{pauseUntil=performance.now()+3000;};
 const move=direction=>{pause();const step=originals[0].getBoundingClientRect().width+parseFloat(getComputedStyle(strip).columnGap||12);strip.scrollBy({left:direction*step,behavior:reduced.matches?'instant':'smooth'});};
 controls.querySelector('[data-strip-prev]')?.addEventListener('click',()=>move(-1));
 controls.querySelector('[data-strip-next]')?.addEventListener('click',()=>move(1));
 strip.addEventListener('pointerdown',()=>{dragging=true;pause();});
 const release=()=>{if(dragging){dragging=false;pause();}};
 window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
 strip.addEventListener('wheel',pause,{passive:true});
 strip.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hovered=true;});strip.addEventListener('pointerleave',()=>{hovered=false;});
 strip.addEventListener('focusin',()=>{focused=true;});strip.addEventListener('focusout',()=>{focused=false;});
 controls.addEventListener('focusin',()=>{focused=true;});controls.addEventListener('focusout',()=>{focused=false;});
 strip.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();move(e.key==='ArrowRight'?1:-1);});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:0}).observe(strip);
 new ResizeObserver(resize).observe(strip);resize();
 const frame=now=>{
  const delta=last?Math.min(now-last,60):0;last=now;
  const keyboardFocus=focused&&(document.activeElement!==strip||strip.matches(':focus-visible'));
  if(overflow&&visible&&now>=pauseUntil&&!dragging&&!reduced.matches&&!keyboardFocus&&!document.hidden&&cycle>0){
   // under a mouse the strip eases to a slow drift instead of stopping, so cards stay easy to click
   speed+=((hovered?.35:1)-speed)*Math.min(1,delta/240);
   const next=position+delta*.026*speed;position=next>=cycle?next-cycle:next;strip.scrollLeft=position;
  }else position=strip.scrollLeft;
  requestAnimationFrame(frame);
 };
 requestAnimationFrame(frame);
})();
