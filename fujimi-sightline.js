(function () {
  'use strict';
  var section = document.querySelector('[data-fujimi-sightline]');
  if (!section) return;
  var open = section.querySelector('[data-fujimi-open]');
  var close = section.querySelector('[data-fujimi-close]');
  var model = section.querySelector('#fujimi-sightline-model');
  var host = section.querySelector('[data-fujimi-stage]');
  var status = section.querySelector('[data-fujimi-status]');
  var views = Array.from(section.querySelectorAll('[data-fujimi-view]'));
  var stage, epoch = 0, loader;

  // The article renderer inserts the reading body asynchronously. Keep this
  // static supplement readable even if that renderer is unavailable.
  if (window.MADO_SPOT_PAGE_READY) window.MADO_SPOT_PAGE_READY.then(function () {
    var references = document.querySelector('.spot-page-shell article .spot-reading-sources, .spot-page-shell article .spot-page-refs');
    if (references) references.before(section);
  });

  function loadEngine() {
    if (window.createFujimiStage) return Promise.resolve();
    if (!loader) loader = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = section.dataset.engine;
      var timer = setTimeout(function () { script.remove(); reject(new Error('engine timeout')); }, 20000);
      script.onload = function () { clearTimeout(timer); window.createFujimiStage ? resolve() : reject(new Error('engine unavailable')); };
      script.onerror = function () { clearTimeout(timer); script.remove(); reject(new Error('engine network')); };
      document.head.append(script);
    }).catch(function (error) { loader = null; throw error; });
    return loader;
  }
  function reset(message) {
    epoch++;
    if (stage) stage.destroy();
    stage = null;
    model.hidden = true;
    close.hidden = true;
    open.hidden = false;
    open.disabled = false;
    open.setAttribute('aria-expanded', 'false');
    views.forEach(function (button) { button.disabled = true; });
    status.textContent = message;
  }
  open.addEventListener('click', async function () {
    var token = ++epoch;
    open.disabled = true;
    open.setAttribute('aria-expanded', 'true');
    close.hidden = false;
    model.hidden = false;
    status.textContent = '3Dを読み込んでいます…';
    function current() { return epoch === token; }
    try {
      await loadEngine();
      if (!current()) return;
      var next = await window.createFujimiStage(host, {
        scene: JSON.parse(section.dataset.scene),
        isCurrent: current,
        onStatus: function (message) { if (current()) status.textContent = message; },
        onError: function () { if (current()) reset('3Dを読み込めませんでした。写真と記事を引き続きご覧いただけます。ボタンで再試行できます。'); }
      });
      if (!current()) { next?.destroy(); return; }
      stage = next;
      open.hidden = true;
      views.forEach(function (button) { button.disabled = false; button.setAttribute('aria-pressed', String(button.dataset.fujimiView === 'oblique')); });
    } catch (error) {
      if (current()) reset('3Dを読み込めませんでした。写真と記事を引き続きご覧いただけます。ボタンで再試行できます。');
    }
  });
  close.addEventListener('click', function () { reset('写真の3.705秒の場面に戻りました。'); open.focus(); });
  views.forEach(function (button) { button.addEventListener('click', function () {
    if (!stage) return;
    stage.setView(button.dataset.fujimiView);
    views.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
  }); });
  window.addEventListener('pagehide', function () { reset('3Dはボタンを押すと読み込みます。'); });
}());
