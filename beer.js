// Static article; progressive enhancements provide orientation and label reading.
(() => {
  const links = [...document.querySelectorAll('[data-chapter]')];
  const sections = links.map(link => document.getElementById(link.dataset.chapter));
  const header = document.querySelector('.topbar');
  const nav = document.querySelector('.chapter-nav');
  const resize = () => {
    const top = Math.ceil(header.getBoundingClientRect().height);
    nav.style.top = top + 'px';
    document.documentElement.style.setProperty('--chapter-offset', (top + nav.getBoundingClientRect().height + 18) + 'px');
  };
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(header);
  window.addEventListener('resize', resize, {passive:true});
  resize();
  function orient() {
    const threshold = header.getBoundingClientRect().height + nav.getBoundingClientRect().height + 45;
    const active = sections.reduce((current, section) => section.getBoundingClientRect().top <= threshold ? section : current, sections[0]);
    links.forEach(link => link.dataset.chapter === active.id ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
  }
  let pending = false;
  window.addEventListener('scroll', () => {
    if (!pending) requestAnimationFrame(() => { orient(); pending = false; });
    pending = true;
  }, {passive:true});
  const explanations = {
    nama: ['“Nama” can come in a can.', 'On beer, <span lang="ja">生</span> means it has not been heat-treated for pasteurisation. It can be canned or bottled; the word alone does not mean it was poured from a tap.'],
    dry: ['“Dry” is a clue to the finish.', '<span lang="ja">辛口</span> (<em>karakuchi</em>) means “dry” on a beer label. It points to a crisp character, not chilli heat. Look for it on Asahi Super Dry.'],
    black: ['Read the whole name.', '<span lang="ja">黒</span> (<em>kuro</em>) means “black”. In <span lang="ja">黒ラベル</span> (Black Label), it is part of the product name: Sapporo Black Label is a golden lager.']
  };
  const buttons = [...document.querySelectorAll('[data-label]')];
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const [title, body] = explanations[button.dataset.label];
    document.getElementById('label-answer').innerHTML = '<h4>' + title + '</h4><p>' + body + '</p>';
  }));
  function revealCredit(hash) {
    if (!hash.startsWith('#credit-')) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    target.closest('details').open = true;
    requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
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
  orient();
})();
