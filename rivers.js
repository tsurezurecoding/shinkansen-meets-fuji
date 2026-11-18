(function () {
  'use strict';
  const lightbox = document.getElementById('river-lightbox');
  const image = lightbox.querySelector('img');
  const title = document.getElementById('river-photo-title');
  const caption = document.getElementById('river-photo-caption');
  let opener;

  document.querySelector('.river-list').addEventListener('click', event => {
    const button = event.target.closest('button[data-photo]');
    if (!button) return;
    const source = button.querySelector('img');
    opener = button;
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    title.textContent = button.dataset.photo;
    caption.textContent = button.closest('figure').querySelector('figcaption').textContent;
    lightbox.showModal();
  });
  lightbox.querySelector('.river-lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => opener?.focus({preventScroll: true}));

  // A rider can open a different crossing after the common language menu was built.
  window.addEventListener('hashchange', () => {
    for (const link of document.querySelectorAll('.topbar .guide-lang-options a')) link.hash = location.hash;
  });
})();
