document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const buttons = [...document.querySelectorAll('[data-filling]')];
  const output = document.getElementById('filling-description');
  buttons.forEach(button => button.addEventListener('click', () => {
    if (!button.dataset.fillingDescription) return;
    buttons.forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    output.textContent = button.dataset.fillingDescription;
  }));

  const sourceDetails = document.getElementById('source-details');
  const revealCredit = () => {
    if (location.hash.startsWith('#credit-') || location.hash === '#sources') sourceDetails.open = true;
  };
  document.querySelectorAll('[data-credit],[data-open-sources]').forEach(a => a.addEventListener('click', () => { sourceDetails.open = true; }));
  window.addEventListener('hashchange',revealCredit);
  revealCredit();

  let menu = document.querySelector('.top-nav-more');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('click',event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; });

  let header = document.querySelector('.topbar');
  const headerHeight = () => header ? header.getBoundingClientRect().height : 0;
  const updateHeader = () => document.documentElement.style.setProperty('--food-header-height',Math.ceil(headerHeight())+'px');
  const headerObserver = 'ResizeObserver' in window ? new ResizeObserver(updateHeader) : null;
  if (header && headerObserver) headerObserver.observe(header);
  window.addEventListener('resize',updateHeader);
  updateHeader();
  const links = [...document.querySelectorAll('.food-chapters a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  const updateChapter = () => {
    const threshold = headerHeight() + 110;
    let active = 0;
    sections.forEach((s,i) => { if (s.getBoundingClientRect().top <= threshold) active = i; });
    links.forEach((a,i) => { if (i === active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
  };
  window.addEventListener('scroll',updateChapter,{passive:true});
  updateChapter();
  document.addEventListener('mado:shared-ui-ready', () => {
    if (headerObserver) headerObserver.disconnect();
    header = document.querySelector('.topbar');
    menu = document.querySelector('.top-nav-more');
    if (header && headerObserver) headerObserver.observe(header);
    updateHeader();
    updateChapter();
  });
});
