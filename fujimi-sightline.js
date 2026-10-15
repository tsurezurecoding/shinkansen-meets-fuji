(function () {
  'use strict';
  var section = document.querySelector('[data-fujimi-sightline]');
  if (!section) return;
  var open = section.querySelector('[data-fujimi-open]');
  var host = section.querySelector('[data-fujimi-stage]');
  var status = section.querySelector('[data-fujimi-status]');
  var controls = Array.from(section.querySelectorAll('[data-fujimi-reset], [data-fujimi-zoom]'));
  var stage, epoch = 0, loader, observer, near = false, loading = false, attempted = false;
  var connection = navigator.connection;
  var manual = !!(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
  function active() { return near && !document.hidden; }
  function reset(message) {
    epoch++; loading = false;
    stage?.destroy(); stage = null;
    controls.forEach(function (button) { button.disabled = true; });
    open.hidden = false; open.disabled = false; open.textContent = '3Dを再読み込み';
    host.dataset.placeholder = '3Dを表示できませんでした'; status.textContent = message;
  }
  function loadEngine() {
    if (window.createFujimiStage) return Promise.resolve();
    if (!loader) loader = new Promise(function (resolve, reject) {
      var script = document.createElement('script'); script.src = section.dataset.engine;
      var timer = setTimeout(function () { script.remove(); reject(new Error('engine timeout')); }, 20000);
      script.onload = function () { clearTimeout(timer); window.createFujimiStage ? resolve() : reject(new Error('engine unavailable')); };
      script.onerror = function () { clearTimeout(timer); script.remove(); reject(new Error('engine network')); };
      document.head.append(script);
    }).catch(function (error) { loader = null; throw error; });
    return loader;
  }
  async function start() {
    if (loading || stage) return;
    var token = ++epoch; attempted = true; loading = true; open.disabled = true;
    host.dataset.placeholder = '3Dを読み込んでいます…'; status.textContent = '3Dを読み込んでいます…';
    function current() { return epoch === token; }
    function fail() { if (current()) reset('3Dを読み込めませんでした。本文と動画は引き続き読めます。ボタンで再試行できます。'); }
    try {
      await loadEngine(); if (!current()) return;
      var next = await window.createFujimiStage(host, {
        scene: JSON.parse(section.dataset.scene), isCurrent: current,
        onStatus: function (message) { if (current()) status.textContent = message; }, onError: fail
      });
      if (!current()) { next?.destroy(); return; }
      if (!next) { fail(); return; }
      stage = next; loading = false; open.hidden = true;
      controls.forEach(function (button) { button.disabled = false; }); stage.setActive?.(active());
      if (document.activeElement === open) host.focus({preventScroll:true});
    } catch (error) { fail(); }
  }
  open.addEventListener('click', start);
  section.querySelector('[data-fujimi-reset]').addEventListener('click', function () { stage?.resetView(); });
  section.querySelectorAll('[data-fujimi-zoom]').forEach(function (button) {
    button.addEventListener('click', function () { stage?.zoom(button.dataset.fujimiZoom === 'in' ? 1 : -1); });
  });
  host.addEventListener('keydown', function (event) { if (stage?.key(event.key)) event.preventDefault(); });
  document.addEventListener('visibilitychange', function () { stage?.setActive?.(active()); });
  window.addEventListener('pagehide', function () { observer?.disconnect(); reset('3Dは再読み込みできます。'); attempted = false; });
  window.addEventListener('pageshow', function (event) { if (event.persisted) watch(); });
  function watch() {
    if (!window.IntersectionObserver) { open.hidden = false; return; }
    observer?.disconnect();
    observer = new IntersectionObserver(function (entries) {
      near = entries[0].isIntersecting; stage?.setActive?.(active());
      if (near && !manual && !attempted) void start();
    }, {rootMargin:'160px 0px'});
    observer.observe(host);
  }
  function mount() {
    var map = document.querySelector('.spot-page-shell article .spot-static-map');
    if (map) map.before(section);
    if (manual) {
      open.hidden = false; host.dataset.placeholder = 'ボタンで3Dを読み込めます';
      status.textContent = '通信量を抑える設定のため、ボタンを押すと3Dを読み込みます。';
    }
    watch();
  }
  if (window.MADO_SPOT_PAGE_READY) window.MADO_SPOT_PAGE_READY.then(mount); else mount();
}());
