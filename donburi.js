(() => {
  'use strict';
  const dialog = document.querySelector('.don-lightbox');
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('p');
  let opener;
  const close = () => dialog.close();
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      image.src = button.dataset.photo;
      image.alt = button.querySelector('img').alt;
      const sourceCaption = button.closest('figure')?.querySelector('figcaption');
      if (sourceCaption) {
        caption.replaceChildren(...Array.from(sourceCaption.childNodes, node => node.cloneNode(true)));
      } else {
        caption.textContent = button.dataset.caption || image.alt;
      }
      dialog.showModal();
    });
  });
  dialog.querySelector('.don-close').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    opener?.focus({ preventScroll: true });
  });
})();
