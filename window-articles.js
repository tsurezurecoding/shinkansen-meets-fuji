(() => {
  'use strict';
  const box = document.getElementById('spotPageLightbox');
  if (!box) return;
  const output = box.querySelector('img');
  const caption = box.querySelector('figcaption');
  let previous;
  function close() {
    box.hidden = true;
    output.removeAttribute('src');
    document.documentElement.style.overflow = '';
    previous?.focus();
  }
  function open(src, alt, text, trigger) {
    previous = trigger;
    output.src = src;output.alt = alt;
    caption.textContent = text;
    box.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    box.querySelector('.spot-page-lightbox-close')?.focus();
  }
  document.querySelectorAll('[data-zoom-src]').forEach(button => button.addEventListener('click', () => {
    const image = button.querySelector('img');
    open(button.dataset.zoomSrc,image?.alt || '',button.parentElement.querySelector('figcaption')?.textContent || '',button);
  }));
  const galleryImage = document.querySelector('[data-gallery-image]');
  const galleryLink = document.querySelector('[data-gallery-image-link]');
  if (galleryImage && galleryLink && !galleryLink.getAttribute('href')) {
    galleryLink.removeAttribute('aria-hidden');galleryLink.tabIndex = 0;galleryLink.setAttribute('role','button');galleryLink.setAttribute('aria-label',document.documentElement.lang === 'en' ? 'Enlarge the window photograph' : '車窓写真を拡大する');
    const show = () => open(galleryImage.dataset.photoOriginalSrc || galleryImage.src,galleryImage.alt,galleryLink.parentElement.querySelector('figcaption')?.textContent || '',galleryLink);
    galleryLink.addEventListener('click',show);
    galleryLink.addEventListener('keydown',event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault();show(); } });
  }
  box.addEventListener('click',event => { if (event.target === box || event.target.closest('.spot-page-lightbox-close')) close(); });
  document.addEventListener('keydown',event => { if (event.key === 'Escape' && !box.hidden) close(); });
  box.addEventListener('keydown',event => {
    if (event.key === 'Tab') { event.preventDefault();box.querySelector('.spot-page-lightbox-close')?.focus(); }
  });
})();
