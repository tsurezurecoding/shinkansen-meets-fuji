'use strict';
(() => {
  const script=document.currentScript;
  const photoLabel=script?.dataset.photoLabel||'';
  const trailerLabel=script?.dataset.trailerLabel||'';
  const dialog=document.querySelector('#photo-dialog');
  if(dialog){
    for(const link of document.querySelectorAll('.photo-open'))link.addEventListener('click',event=>{
      if(!dialog.showModal||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();const holder=dialog.querySelector('.photo-dialog-content');holder.replaceChildren();
      const map=link.querySelector('.story-map-visual');
      if(map){holder.append(map.cloneNode(true));dialog.classList.add('is-map');}
      else{const image=document.createElement('img');image.src=link.href;image.alt=link.querySelector('img')?.alt||photoLabel;holder.append(image);dialog.classList.remove('is-map');}
      dialog.querySelector('p').textContent=link.closest('figure')?.querySelector('figcaption')?.textContent||photoLabel;dialog.showModal();
    });
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  }
  for(const player of document.querySelectorAll('.trailer-player'))player.querySelector('button')?.addEventListener('click',()=>{
    const frame=document.createElement('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${player.dataset.videoId}?autoplay=1&rel=0`;
    frame.title=player.dataset.videoTitle||player.querySelector('button').getAttribute('aria-label')||trailerLabel;
    frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allowFullscreen=true;player.replaceChildren(frame);
  });
  for(const link of document.querySelectorAll('a[href^="#source-"]'))link.addEventListener('click',()=>{const sources=document.getElementById(link.hash.slice(1))?.closest('details');if(sources)sources.open=true;});
})();

'use strict';
(() => {
  const rail = document.querySelector('.picker-list');
  const selected = rail?.querySelector('[aria-current="page"]');
  if (!rail || !selected) return;
  const media = window.matchMedia('(max-width: 760px)');
  const revealSelected = () => {
    if (!media.matches) return;
    const railRect = rail.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    rail.scrollLeft += selectedRect.left - railRect.left - (rail.clientWidth - selectedRect.width) / 2;
  };
  revealSelected();
  media.addEventListener('change', revealSelected);
})();
