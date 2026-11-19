(() => {
  'use strict';

  const section = document.getElementById('content-news');
  const native = window.Capacitor;
  if (!section?.classList.contains('content-news')) return;
  if (window.MADO_NATIVE_APP || native?.isNativePlatform?.() || (native?.getPlatform && native.getPlatform() !== 'web')) {
    section.hidden = true;
    return;
  }

  const links = [...section.querySelectorAll('a[data-news-id]')];
  const currentIds = section.dataset.newsBaseline.split(' ');
  const baselineKey = 'mado-content-news.baseline.v1';
  const readPrefix = 'mado-content-news.read.';
  let baseline;
  try {
    const stored = JSON.parse(localStorage.getItem(baselineKey));
    if (Array.isArray(stored) && stored.every(id => typeof id === 'string')) baseline = new Set(stored);
    else localStorage.setItem(baselineKey, JSON.stringify(currentIds));
  } catch { /* The articles can also be opened with browser storage disabled. */ }
  baseline ??= new Set(currentIds);
  const readHere = new Set();
  function refresh() {
    for (const link of links) {
      const id = link.dataset.newsId;
      let read = baseline.has(id) || readHere.has(id);
      try { read ||= localStorage.getItem(readPrefix + id) === '1'; } catch { /* Use the current page state. */ }
      link.querySelector('[data-news-unread]').hidden = read;
    }
  }
  function openItem(event) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const link = event.target.closest('a[data-news-id]');
    if (!link) return;
    const id = link.dataset.newsId;
    readHere.add(id);
    try { localStorage.setItem(readPrefix + id, '1'); } catch { /* Keep the in-memory read marker. */ }
    refresh();
  }
  section.addEventListener('click', openItem);
  section.addEventListener('auxclick', openItem);
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => { if (event.key?.startsWith(readPrefix)) refresh(); });
  refresh();
})();
