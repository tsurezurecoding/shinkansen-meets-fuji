(() => {
  'use strict';
  const catalog = document.querySelector('#catalog');
  const list = document.querySelector('#factory-list');
  if (!catalog || !list) return;
  const groups = Array.from(list.children);
  const route = catalog.querySelector('.ff-route');
  const controls = catalog.querySelector('.ff-controls');
  const countLabel = number => catalog.dataset.count.replace('{n}', number);
  const button = (attribute, value) => controls.querySelector('[data-' + attribute + '="' + value + '"]');
  function render() {
    const query = new URLSearchParams(location.search);
    const direction = query.get('direction') === 'up' ? 'up' : 'down';
    const side = ['A','E'].includes(query.get('side')) ? query.get('side') : 'all';
    const down = direction === 'down';
    controls.querySelectorAll('[data-direction]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.direction === direction)));
    controls.querySelectorAll('[data-side-filter]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.sideFilter === side)));
    let count = 0;
    const fits = letter => side === 'all' || letter === side;
    for (const group of down ? groups : groups.slice().reverse()) {
      let visible = 0;
      for (const card of group.querySelectorAll('.ff-card')) {
        card.hidden = !fits(card.dataset.side);
        if (!card.hidden) visible++;
        const onLeft = (card.dataset.side === 'A') === down;
        card.querySelector('[data-relative]').textContent = onLeft ? catalog.dataset.left : catalog.dataset.right;
      }
      group.hidden = visible === 0;
      group.querySelector('[data-group-count]').textContent = countLabel(visible);
      group.querySelector('.ff-grid').dataset.count = visible;
      const link = route.querySelector('[data-route-group="' + group.id + '"]');
      link.hidden = group.hidden;
      link.querySelector('span').textContent = visible;
      route.append(link);
      const stations = [group.dataset.east, group.dataset.west];
      group.querySelector('[data-interval]').textContent = (down ? stations : stations.reverse()).join(' → ');
      list.append(group);
      count += visible;
    }
    catalog.querySelector('#guide-status').textContent = [button('direction', direction).textContent, button('side-filter', side).textContent, countLabel(count)].join(' · ');
  }
  function save(key, value, defaultValue) {
    const url = new URL(location.href);
    if (value === defaultValue) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    // file:// browsers can disallow same-file history edits with a changed query.
    try { history.replaceState(history.state, '', url.href); }
    catch { location.assign(url.href); return; }
    render();
  }
  controls.addEventListener('click', event => {
    const choice = event.target.closest('button');
    if (choice?.dataset.direction) save('direction', choice.dataset.direction, 'down');
    if (choice?.dataset.sideFilter) save('side', choice.dataset.sideFilter, 'all');
  });
  // The shared menu is mounted independently. Reflect the latest filters and
  // the current place, including a fragment reached after the menu was built.
  document.addEventListener('click', event => {
    const link = event.target.closest('.article-lang-menu a[lang],.lang-switch a[lang]');
    if (!link) return;
    const target = new URL(link.href);
    target.search = location.search;
    target.searchParams.set('lang', link.lang);
    target.hash = location.hash;
    link.href = target.href;
  }, true);
  window.addEventListener('popstate', render);
  controls.hidden = false;
  render();
})();
