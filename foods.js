document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const fillings = {
    salmon:'Salmon: savoury flakes of fish tucked into the rice.',
    tuna:'Tuna mayo: tuna mixed with creamy mayonnaise. Look for ツナマヨ on the label.',
    ume:'Ume: pickled plum with a tangy taste. Look for 梅; the full ingredients depend on the product.'
  };
  const buttons = [...document.querySelectorAll('[data-filling]')];
  const output = document.getElementById('filling-description');
  buttons.forEach(button => button.addEventListener('click', () => {
    if (!fillings[button.dataset.filling]) return;
    buttons.forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    output.textContent = fillings[button.dataset.filling];
  }));

  const sourceDetails = document.getElementById('source-details');
  const revealCredit = () => {
    if (location.hash.startsWith('#credit-') || location.hash === '#sources') sourceDetails.open = true;
  };
  document.querySelectorAll('[data-credit],[data-open-sources]').forEach(a => a.addEventListener('click', () => { sourceDetails.open = true; }));
  window.addEventListener('hashchange',revealCredit);
  revealCredit();

  const menu = document.querySelector('.top-nav-more');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('click',event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; });

  const header = document.querySelector('.topbar');
  const updateHeader = () => document.documentElement.style.setProperty('--food-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
  if ('ResizeObserver' in window) new ResizeObserver(updateHeader).observe(header);
  window.addEventListener('resize',updateHeader);
  updateHeader();
  const links = [...document.querySelectorAll('.food-chapters a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  const updateChapter = () => {
    const threshold = header.getBoundingClientRect().height + 110;
    let active = 0;
    sections.forEach((s,i) => { if (s.getBoundingClientRect().top <= threshold) active = i; });
    links.forEach((a,i) => { if (i === active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
  };
  window.addEventListener('scroll',updateChapter,{passive:true});
  updateChapter();
});
