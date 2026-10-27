(function () {
  'use strict';
  var section = document.querySelector('[data-tokyo-sightline]');
  if (!section) return;
  var open = section.querySelector('[data-tokyo-open]');
  var host = section.querySelector('[data-tokyo-stage]');
  var status = section.querySelector('[data-tokyo-status]');
  var controls = Array.from(section.querySelectorAll('[data-tokyo-reset], [data-tokyo-zoom]'));
  var model = section.querySelector('#tokyo-sightline-model');
  var preview = section.querySelector('[data-tokyo-preview]');
  var previewCredit = section.querySelector('[data-tokyo-preview-credit]');
  var interaction = section.querySelector('[data-tokyo-interaction]');
  var scenes = JSON.parse(section.dataset.scenes), selected = 0;
  var photo = section.querySelector('[data-tokyo-photo]');
  var photoOverlay = section.querySelector('[data-tokyo-photo-overlay]');
  var photoToggle = section.querySelector('[data-tokyo-photo-toggle]');
  var photoURL = new URL(photo.getAttribute('data-photo-original-src') || photo.src, document.baseURI).href;
  var photoBase = photoURL.slice(0, photoURL.lastIndexOf('/') + 1);
  var clip = section.querySelector('[data-tokyo-clip]'), video = section.querySelector('[data-tokyo-video]');
  function stopClip() {
    if (video.hasAttribute('src')) { video.pause(); video.removeAttribute('src'); video.load(); }
    clip.open = false;
  }
  clip.addEventListener('toggle', function() {
    if (!clip.open) { if (video.hasAttribute('src')) video.pause(); return; }
    var scene = scenes[selected];
    if (scene.clip) video.poster = photoBase + scene.photo;
    if (scene.clip && !video.hasAttribute('src')) video.src = new URL('../' + scene.clip, photoBase).href;
  });
  function sizePhoto() {
    var sizes = Math.max(1, Math.ceil(photo.getBoundingClientRect().width)) + 'px';
    photo.setAttribute('data-photo-sizes', sizes);
    if (photo.hasAttribute('srcset')) photo.sizes = sizes;
  }
  window.addEventListener('resize', sizePhoto, { passive: true });
  function expandPhoto(value) {
    photoOverlay.classList.toggle('is-expanded', value);
    photo.toggleAttribute('data-photo-expanded', value);
    sizePhoto();
    if (window.MADO_SPOT_PHOTOS) window.MADO_SPOT_PHOTOS.apply(photo, photoBase + scenes[selected].photo);
    else photo.src = photoBase + scenes[selected].photo;
    photoToggle.setAttribute('aria-expanded', String(value));
    photoToggle.setAttribute('aria-label', value ? '車窓写真を元の大きさに戻す' : '車窓写真を拡大');
    section.querySelector('[data-tokyo-photo-action]').textContent = value ? '写真を戻す' : '写真を拡大';
  }
  photoToggle.addEventListener('click', function () { expandPhoto(photoToggle.getAttribute('aria-expanded') !== 'true'); });
  photoToggle.addEventListener('keydown', function (event) { if (event.key === 'Escape') { expandPhoto(false); event.preventDefault(); } });
  var stage, epoch = 0, loader, observer, near = false, loading = false, ready = false;
  function active() { return near && !document.hidden; }
  function reveal() {
    if (!stage || !ready) return;
    preview.hidden = true; previewCredit.hidden = true; interaction.hidden = false;
    model.dataset.tokyoState = 'ready';
    host.setAttribute('aria-hidden', 'false'); host.tabIndex = 0;
    controls.forEach(function (button) { button.disabled = false; });
    open.hidden = true; open.setAttribute('aria-expanded', 'true');
    if (document.activeElement === open) host.focus({preventScroll:true});
  }
  function reset(message) {
    epoch++; loading = false; ready = false;
    stage?.destroy(); stage = null;
    controls.forEach(function (button) { button.disabled = true; });
    preview.hidden = false; previewCredit.hidden = false; interaction.hidden = true;
    model.dataset.tokyoState = 'preview';
    host.setAttribute('aria-hidden', 'true'); host.tabIndex = -1;
    open.setAttribute('aria-expanded', 'false');
    open.hidden = false; open.disabled = false; open.textContent = '3Dを再読み込み';
    status.textContent = message;
  }
  function loadEngine() {
    if (window.createTokyoStage) return Promise.resolve();
    if (!loader) loader = new Promise(function (resolve, reject) {
      var script = document.createElement('script'); script.src = section.dataset.engine;
      var timer = setTimeout(function () { script.remove(); reject(new Error('engine timeout')); }, 20000);
      script.onload = function () { clearTimeout(timer); window.createTokyoStage ? resolve() : reject(new Error('engine unavailable')); };
      script.onerror = function () { clearTimeout(timer); script.remove(); reject(new Error('engine network')); };
      document.head.append(script);
    }).catch(function (error) { loader = null; throw error; });
    return loader;
  }
  async function start() {
    if (loading || stage) return;
    var token = ++epoch; loading = true; ready = false; open.disabled = true;
    open.textContent = '3Dを読み込んでいます…'; model.dataset.tokyoState = 'loading';
    status.textContent = '3Dを読み込んでいます…';
    function current() { return epoch === token; }
    function fail() { if (current()) reset('3Dを読み込めませんでした。写真と記事は引き続き読めます。ボタンで再試行できます。'); }
    try {
      await loadEngine(); if (!current()) return;
      var next = await window.createTokyoStage(host, {
        scene: scenes[selected], isCurrent: current,
        onStatus: function (message) { if (current()) status.textContent = message; },
        onReady: function () { if (current()) { ready = true; reveal(); } }, onError: fail
      });
      if (!current()) { next?.destroy(); return; }
      if (!next) { fail(); return; }
      stage = next; stage.setScene?.(scenes[selected]); loading = false;
      stage.setActive?.(active()); reveal();
    } catch (error) { fail(); }
  }
  section.querySelectorAll('[data-tokyo-scene]').forEach(function(button) {
    button.addEventListener('click', function() {
      stopClip();
      expandPhoto(false);
      selected = Number(button.dataset.tokyoScene); var scene = scenes[selected];
      clip.hidden = !scene.clip;
      video.removeAttribute('poster');
      section.querySelectorAll('[data-tokyo-scene]').forEach(function(b) { b.setAttribute('aria-pressed', String(b === button)); });
      if (window.MADO_SPOT_PHOTOS) window.MADO_SPOT_PHOTOS.apply(photo, photoBase + scene.photo);
      else photo.src = photoBase + scene.photo;
      photo.alt = scene.alt;
      section.querySelector('[data-tokyo-caption]').textContent = scene.date + '・' + scene.seat + '／撮影：道草';
      section.querySelector('[data-tokyo-note]').textContent = scene.note;
      section.querySelector('[data-tokyo-distance]').textContent = '推定撮影位置から約' + scene.distanceKm + 'km';
      stage?.setScene(scene);
    });
  });
  open.addEventListener('click', start);
  section.querySelector('[data-tokyo-reset]').addEventListener('click', function () { stage?.resetView(); });
  section.querySelectorAll('[data-tokyo-zoom]').forEach(function (button) {
    button.addEventListener('click', function () { stage?.zoom(button.dataset.tokyoZoom === 'in' ? 1 : -1); });
  });
  host.addEventListener('keydown', function (event) { if (stage?.key(event.key)) event.preventDefault(); });
  document.addEventListener('visibilitychange', function () { stage?.setActive?.(active()); if (document.hidden && video.hasAttribute('src')) video.pause(); });
  window.addEventListener('pagehide', function () { stopClip(); observer?.disconnect(); reset('ボタンを押すと3Dを読み込み、街を動かせます。'); open.textContent = '3Dで位置を見る'; });
  window.addEventListener('pageshow', function (event) { if (event.persisted) watch(); });
  function watch() {
    if (!window.IntersectionObserver) { near = true; open.hidden = false; return; }
    observer?.disconnect();
    observer = new IntersectionObserver(function (entries) {
      near = entries[0].isIntersecting; stage?.setActive?.(active());
    }, {rootMargin:'160px 0px'});
    observer.observe(host);
  }
  function mount() {
    var map = document.querySelector('.spot-page-shell article .spot-static-map');
    if (map) map.before(section);
    sizePhoto();
    if (window.MADO_SPOT_PHOTOS) window.MADO_SPOT_PHOTOS.observe(section);
    watch();
  }
  if (window.MADO_SPOT_PAGE_READY) window.MADO_SPOT_PAGE_READY.then(mount); else mount();
}());
