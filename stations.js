(() => {
 const links=[...document.querySelectorAll('[data-chapter]')];
 const sections=links.map(a=>document.getElementById(a.dataset.chapter));
 const header=document.querySelector('.topbar'),nav=document.querySelector('.chapter-nav');
 if(header&&nav){const size=()=>{const height=Math.ceil(header.getBoundingClientRect().height);nav.style.top=height+'px';sections.forEach(s=>s.style.scrollMarginTop=(height+nav.getBoundingClientRect().height+18)+'px');};new ResizeObserver(size).observe(header);size();}
 const update=()=>{if(!sections.length)return;const active=sections.reduce((p,s)=>s.getBoundingClientRect().top<=220?s:p,sections[0]);links.forEach(a=>a.dataset.chapter===active.id?a.setAttribute('aria-current','location'):a.removeAttribute('aria-current'));};
 let queued=false;window.addEventListener('scroll',()=>{if(!queued)requestAnimationFrame(()=>{update();queued=false;});queued=true;},{passive:true});update();
 function credit(hash){if(!hash.startsWith('#credit-'))return;const el=document.getElementById(hash.slice(1));if(!el)return;el.closest('details').open=true;requestAnimationFrame(()=>el.scrollIntoView({block:'start'}));}
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#credit-"]');if(a)credit(a.hash);if(!e.target.closest('.top-nav-more'))document.querySelector('.top-nav-more')?.removeAttribute('open');});
 window.addEventListener('hashchange',()=>credit(location.hash));credit(location.hash);
 const dialog=document.getElementById('photo-dialog');let opener;
 document.querySelectorAll('[data-photo]').forEach(b=>b.addEventListener('click',()=>{opener=b;document.getElementById('dialog-image').src=b.dataset.photo;document.getElementById('dialog-image').alt=b.dataset.alt;document.getElementById('dialog-caption').textContent=b.closest('figure').querySelector('figcaption').textContent;dialog.showModal();}));
 dialog?.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 document.querySelector('.clue-toggle')?.addEventListener('click',e=>{const pressed=e.target.getAttribute('aria-pressed')!=='true';e.target.setAttribute('aria-pressed',String(pressed));e.target.textContent=pressed?(e.target.dataset.hideLabel||'Hide the dome marker'):(e.target.dataset.showLabel||'Show the dome in this photo');document.querySelector('.window-figure').classList.toggle('show-clue',pressed);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('.top-nav-more')?.removeAttribute('open');});
})();
