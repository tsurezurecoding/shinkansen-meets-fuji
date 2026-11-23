(() => {
  'use strict';
  if (window.MadoContentNews) return;

  const copy = {
    ja: ['新着', 'すべての新着を見る', '閉じる', '未読', '特集', '新スポット', 'スポット更新', '機能', '読み物', '作品', '新着を表示できません'],
    en: ['What’s new', 'See all updates', 'Close', 'Unread', 'Feature', 'New spot', 'Spot update', 'New function', 'Story', 'Artwork', 'Updates are unavailable'],
    'zh-Hant': ['最新內容', '查看所有更新', '關閉', '未讀', '專題', '新景點', '景點更新', '新功能', '故事', '作品', '無法顯示更新'],
    fr: ['Nouveautés', 'Voir toutes les nouveautés', 'Fermer', 'Non lu', 'Dossier', 'Nouveau site', 'Site mis à jour', 'Fonctionnalité', 'Récit', 'Œuvre', 'Nouveautés indisponibles'],
    de: ['Neuigkeiten', 'Alle Neuigkeiten ansehen', 'Schließen', 'Ungelesen', 'Thema', 'Neuer Aussichtspunkt', 'Aussichtspunkt aktualisiert', 'Neue Funktion', 'Geschichte', 'Werk', 'Neuigkeiten nicht verfügbar'],
    es: ['Novedades', 'Ver todas las novedades', 'Cerrar', 'Sin leer', 'Especial', 'Nuevo lugar', 'Lugar actualizado', 'Nueva función', 'Historia', 'Obra', 'Novedades no disponibles'],
    'zh-Hans': ['最新内容', '查看全部更新', '关闭', '未读', '专题', '新景点', '景点更新', '新功能', '故事', '作品', '无法显示更新'],
    ko: ['새 소식', '새 소식 모두 보기', '닫기', '읽지 않음', '특집', '새 명소', '명소 업데이트', '새 기능', '이야기', '작품', '새 소식을 불러올 수 없습니다'],
    it: ['Novità', 'Tutte le novità', 'Chiudi', 'Da leggere', 'Speciale', 'Nuovo luogo', 'Luogo aggiornato', 'Nuova funzione', 'Storia', 'Opera', 'Novità non disponibili'],
    th: ['มาใหม่', 'ดูรายการล่าสุดทั้งหมด', 'ปิด', 'ยังไม่ได้อ่าน', 'บทความพิเศษ', 'จุดชมวิวใหม่', 'อัปเดตจุดชมวิว', 'ฟังก์ชันใหม่', 'เรื่องเล่า', 'ผลงาน', 'ไม่สามารถแสดงรายการล่าสุดได้']
  };
  const kinds = ['feature', 'spot', 'spot-update', 'function', 'story', 'artwork'];
  const jstDate = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Tokyo'});
  const buttonIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>';

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  const labels = lang => copy[lang] || copy.en;
  const kindLabel = (lang, kind) => kinds.includes(kind) ? labels(lang)[4 + kinds.indexOf(kind)] : '';
  function dateLabel(lang, date) {
    const now = Date.now();
    const offset = date === jstDate.format(now) ? 0 : date === jstDate.format(now - 86400000) ? -1 : null;
    const stamp = new Intl.DateTimeFormat(lang, {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'}).format(new Date(date));
    return offset === null ? stamp : new Intl.RelativeTimeFormat(lang, {numeric: 'auto'}).format(offset, 'day') + ' · ' + stamp;
  }

  function renderList(target, items, {lang, isUnread, markRead, createLink}) {
    target.replaceChildren();
    let previousDate;
    let list;
    for (const item of items) {
      if (previousDate !== item.date) {
        const date = node('time', 'news-date', dateLabel(lang, item.date));
        date.dateTime = item.date;
        list = node('ul', 'news-rows');
        target.append(date, list);
        previousDate = item.date;
      }
      const row = node('li', 'news-row');
      const link = createLink(item);
      link.classList.add('news-item');
      const dot = node('small', 'news-dot', labels(lang)[3]);
      const line = node('span', 'news-copy');
      const kind = kindLabel(lang, item.kind);
      if (kind) line.append(node('span', 'news-kind', kind));
      line.append(node('strong', 'news-title', item.title));
      const chevron = node('span', 'news-chevron', '›');
      chevron.setAttribute('aria-hidden', 'true');
      link.append(dot, line, chevron);
      if (isUnread(item.id)) link.classList.add('is-unread');
      const open = event => {
        if (event.type !== 'auxclick' || event.button === 1) markRead(item.id);
      };
      link.addEventListener('click', open);
      link.addEventListener('auxclick', open);
      row.append(link);
      list.append(row);
    }
  }

  function createBell({lang, guideUrl, createLink, isUnread, markRead}) {
    const [title, all, close, unread] = labels(lang);
    const dialog = node('dialog', 'news-drawer');
    dialog.id = 'header-news-drawer';
    dialog.setAttribute('aria-labelledby', 'header-news-title');
    const head = node('header', 'news-drawer-head');
    const heading = node('h2', '', title);
    heading.id = 'header-news-title';
    const status = node('span', 'news-status');
    const dismiss = node('button', 'news-close', '×');
    dismiss.type = 'button';
    dismiss.autofocus = true;
    dismiss.setAttribute('aria-label', close);
    head.append(heading, status, dismiss);
    const list = node('div', 'news-drawer-list');
    const more = node('a', 'news-more', all);
    more.href = guideUrl;
    dialog.append(head, list, more);
    const bell = node('button', 'news-bell');
    bell.type = 'button';
    bell.innerHTML = buttonIcon;
    bell.setAttribute('aria-haspopup', 'dialog');
    bell.setAttribute('aria-controls', dialog.id);
    bell.setAttribute('aria-expanded', 'false');
    const badge = node('span', 'news-count');
    badge.setAttribute('aria-hidden', 'true');
    bell.append(badge);
    const entry = {lang, isUnread, markRead(id) {
      markRead(id);
      if (dialog.open) dialog.close();
    }, createLink};
    let items = [];

    function draw() {
      if (items.length) renderList(list, items.slice(0, 5), entry);
      else list.replaceChildren(node('p', 'news-empty', labels(lang)[10]));
    }

    function place() {
      const rect = bell.getBoundingClientRect();
      const width = Math.min(416, window.innerWidth - 16);
      dialog.style.setProperty('--news-left', Math.min(window.innerWidth - width - 8, Math.max(8, rect.right - width)) + 'px');
      dialog.style.setProperty('--news-top', Math.max(8, rect.bottom + 7) + 'px');
    }

    bell.addEventListener('click', () => {
      if (dialog.open) return;
      draw();
      place();
      dialog.showModal();
      bell.setAttribute('aria-expanded', 'true');
    });
    window.addEventListener('resize', () => { if (dialog.open) place(); });
    dismiss.addEventListener('click', () => dialog.close());
    more.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      bell.setAttribute('aria-expanded', 'false');
      bell.focus({preventScroll: true});
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });

    function mount() {
      const header = document.querySelector('.topbar, .live-header');
      if (!header || header.contains(bell)) return;
      const menu = header.querySelector(':scope > :is(.lang-switch, .guide-lang-menu, .article-lang-menu, .live-lang-switch)');
      const actions = node('div', 'news-header-actions');
      actions.append(bell);
      if (menu) {
        menu.before(actions);
        actions.append(menu);
      } else {
        header.append(actions);
      }
      if (!dialog.isConnected) document.body.append(dialog);
    }

    function update(next) {
      const changed = items !== next;
      items = next;
      mount();
      const count = items.filter(item => isUnread(item.id)).length;
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.hidden = count === 0;
      status.textContent = count ? unread + ' ' + count : '';
      bell.setAttribute('aria-label', count ? title + ' · ' + status.textContent : title);
      if (changed && dialog.open) draw();
    }

    document.addEventListener('mado:shared-ui-ready', mount);
    return update;
  }

  window.MadoContentNews = {createBell, renderList, kindLabel};
  const section = document.querySelector('#content-news.content-news');
  const native = window.Capacitor;
  if (window.MADO_EMBEDDED_WEB || window.MADO_NATIVE_APP || native?.isNativePlatform?.() || (native?.getPlatform && native.getPlatform() !== 'web')) {
    if (section) section.hidden = true;
    return;
  }

  const lang = Object.hasOwn(copy, document.documentElement.lang) ? document.documentElement.lang : 'en';
  const currentScript = document.currentScript;
  const root = currentScript ? new URL('.', currentScript.src) : null;
  const prefix = lang === 'ja' ? '' : lang + '/';
  const baselineKey = 'mado-content-news.baseline.v1';
  const readPrefix = 'mado-content-news.read.';
  const readHere = new Set();
  const links = [...(section?.querySelectorAll('a[data-news-id]') || [])];
  const baselineIds = section?.dataset.newsBaseline?.split(' ').filter(Boolean) || [];
  let items = links.map(link => {
    const title = link.querySelector('.content-news-text').cloneNode(true);
    title.querySelector('[data-news-unread]').remove();
    return {id: link.dataset.newsId, kind: link.dataset.newsKind, path: link.href,
      date: link.querySelector('time').dateTime, title: title.textContent.trim()};
  });

  let baseline;
  try {
    const stored = JSON.parse(localStorage.getItem(baselineKey));
    if (Array.isArray(stored) && stored.every(id => typeof id === 'string')) baseline = new Set(stored);
  } catch { /* Headlines remain available without browser storage. */ }
  function establishBaseline(ids) {
    if (baseline || !ids.length) return;
    baseline = new Set(ids);
    try { localStorage.setItem(baselineKey, JSON.stringify(ids)); } catch { /* Use the current page state. */ }
  }
  establishBaseline(baselineIds);
  function isUnread(id) {
    if (!baseline || baseline.has(id) || readHere.has(id)) return false;
    try { return localStorage.getItem(readPrefix + id) !== '1'; } catch { return true; }
  }
  function markRead(id) {
    readHere.add(id);
    try { localStorage.setItem(readPrefix + id, '1'); } catch { /* Use the current page state. */ }
    refresh();
  }
  const updateBell = root && createBell({lang, guideUrl: new URL(prefix + 'index.html#content-news', root).href,
    createLink(item) {
      const a = node('a');
      a.href = new URL(location.protocol === 'file:' ? item.path.replace(/^\//, '') : item.path, root).href;
      return a;
    }, isUnread, markRead});

  function refresh() {
    for (const link of links) link.querySelector('[data-news-unread]').hidden = !isUnread(link.dataset.newsId);
    if (updateBell) updateBell(items);
  }
  for (const link of links) {
    function activate(event) {
      if (event.type !== 'auxclick' || event.button === 1) markRead(link.dataset.newsId);
    }
    link.addEventListener('click', activate);
    link.addEventListener('auxclick', activate);
  }
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => { if (event.key?.startsWith(readPrefix)) refresh(); });
  refresh();

  if (root && location.protocol === 'file:') {
    const fallback = document.createElement('script');
    fallback.src = new URL('data/discovery/local-news.js', root).href;
    fallback.onload = () => {
      const data = window.MADO_LOCAL_NEWS;
      if (!Array.isArray(data?.editions?.[lang])) return;
      items = data.editions[lang];
      establishBaseline(Array.isArray(data.newsBaseline) ? data.newsBaseline : items.map(item => item.id));
      refresh();
    };
    document.head.append(fallback);
  } else if (root) {
    fetch(new URL('data/discovery/' + lang + '.json', root), {cache: 'no-cache'})
      .then(response => response.ok ? response.json() : null)
      .then(feed => {
        if (feed?.schema !== 1 || feed.language !== lang || !Array.isArray(feed.news)) return;
        items = feed.news;
        establishBaseline(Array.isArray(feed.newsBaseline) ? feed.newsBaseline : feed.news.map(item => item.id));
        refresh();
      }).catch(() => { /* Keep any news already rendered in the page. */ });
  }
})();
