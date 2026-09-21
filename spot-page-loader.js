(function () {
  'use strict';
  // Stable entry point: shared rendering/style updates change the manifest, not every page.
  var base = new URL(document.currentScript.src).href.replace(/[^/]+$/, '');
  var styles = ['style.css', 'spot-media-gallery.css'];
  var scripts = ['spot-page-shared.js', 'spot-media-gallery.js', 'spot-map.js'];
  function load(file, versions) {
    return new Promise(function (resolve, reject) {
      var css = /\.css$/.test(file), el = document.createElement(css ? 'link' : 'script');
      var url = base + file + (versions[file] ? '?v=' + versions[file] : '');
      if (css) { el.rel = 'stylesheet'; el.href = url; } else { el.src = url; el.async = false; }
      el.onload = resolve;
      el.onerror = function () { reject(new Error('Could not load ' + file)); };
      document.head.appendChild(el);
    });
  }
  var manifest = location.protocol === 'file:' ? Promise.resolve({}) : fetch(base + 'content-manifest.json', { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error('Manifest unavailable');
    return r.json();
  }).then(function (data) {
    var versions = {};
    (data.files || []).forEach(function (entry) {
      if (styles.concat(scripts).indexOf(entry.path) !== -1 && /^[a-f0-9]{64}$/.test(entry.sha256)) versions[entry.path] = entry.sha256.slice(0, 8);
    });
    return versions;
  }).catch(function () { return {}; });
  window.MADO_SPOT_PAGE_READY = manifest.then(function (versions) {
    return Promise.all(styles.map(function (file) { return load(file, versions); })).then(function () {
      return scripts.reduce(function (ready, file) { return ready.then(function () { return load(file, versions); }); }, Promise.resolve());
    });
  }).catch(function () {
    var host = document.querySelector('[data-spot-page-shared-module="page"]');
    if (host) host.textContent = document.documentElement.lang === 'ja' ? 'ページを読み込めませんでした。再読み込みしてください。' : 'Unable to load this page. Please reload.';
  });
}());
