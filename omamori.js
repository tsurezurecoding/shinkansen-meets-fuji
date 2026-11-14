'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const output = document.querySelector('#word-result');
  const buttons = [...document.querySelectorAll('[data-omamori-word]')];
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    output.querySelector('.om-word-label').textContent = button.dataset.kanji;
    output.querySelector('h3').textContent = button.dataset.title;
    output.querySelector('.om-word-description').textContent = button.dataset.description;
  }));
  const dialog = document.querySelector('.om-lightbox');
  let opener;
  document.querySelectorAll('[data-photo]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    dialog.querySelector('img').src = button.dataset.photo;
    dialog.querySelector('img').alt = button.querySelector('img').alt;
    dialog.querySelector('p').textContent = button.dataset.caption;
    dialog.showModal();
  }));
  dialog.querySelector('.om-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', event => {
    const b = dialog.getBoundingClientRect();
    if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();
  });
});
