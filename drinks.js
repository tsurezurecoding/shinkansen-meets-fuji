// Content is static; this only enhances orientation and photo-credit links.
(() => {
  const links = [...document.querySelectorAll('[data-chapter]')];
  const sections = links.map(link => document.getElementById(link.dataset.chapter));
  const header = document.querySelector('.topbar');
  const nav = document.querySelector('.chapter-nav');
  const sizeHeader = () => { nav.style.top = Math.ceil(header.getBoundingClientRect().height) + 'px'; };
  new ResizeObserver(sizeHeader).observe(header);
  sizeHeader();
  function updateChapter() {
    const active = sections.reduce((current, section) => section.getBoundingClientRect().top <= 220 ? section : current, sections[0]);
    links.forEach(link => {
      if (link.dataset.chapter === active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  let pending = false;
  window.addEventListener('scroll', () => {
    if (!pending) requestAnimationFrame(() => { updateChapter(); pending = false; });
    pending = true;
  }, { passive: true });
  function revealCredit(hash) {
    if (!hash.startsWith('#credit-')) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    target.closest('details').open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#credit-"]');
    if (link) revealCredit(link.getAttribute('href'));
    if (!event.target.closest('.top-nav-more')) document.querySelector('.top-nav-more')?.removeAttribute('open');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelector('.top-nav-more')?.removeAttribute('open');
  });
  window.addEventListener('hashchange', () => revealCredit(location.hash));
  revealCredit(location.hash);
  updateChapter();
})();
