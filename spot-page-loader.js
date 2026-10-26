(function () {
  'use strict';
  // Stable entry point: shared rendering/style updates change the manifest, not every page.
  var base = new URL(document.currentScript.src).href.replace(/[^/]+$/, '');
  var styles = ['style.css', 'spot-media-gallery.css'];
  var scripts = ['spot-page-shared-data.js', 'spot-page-shared.js', 'spot-media-gallery.js', 'spot-map.js'];
  var assets = styles.concat(scripts);
  function readVersions(data) {
    if (!data || data.schema !== 'mado-spot-page-runtime' || data.version !== 1 ||
        !data.assets || typeof data.assets !== 'object' || Array.isArray(data.assets) ||
        Object.keys(data.assets).length !== assets.length) throw new Error('Invalid runtime manifest');
    var versions = {};
    assets.forEach(function (file) {
      if (!Object.prototype.hasOwnProperty.call(data.assets, file) ||
          typeof data.assets[file] !== 'string' || !/^[a-f0-9]{64}$/.test(data.assets[file])) {
        throw new Error('Invalid runtime asset hash');
      }
      versions[file] = data.assets[file].slice(0, 8);
    });
    return versions;
  }
  function revealShell() {
    var bootStyle = document.getElementById('spot-page-boot-style');
    if (bootStyle) bootStyle.remove();
  }
  function load(file, versions) {
    return new Promise(function (resolve, reject) {
      var css = /\.css$/.test(file), el = document.createElement(css ? 'link' : 'script');
      var url = base + file + (versions[file] ? '?v=' + versions[file] : '');
      if (css) { el.rel = 'stylesheet'; el.href = url; } else { el.src = url; el.async = false; }
      el.onload = function () { resolve(); };
      el.onerror = function () { reject(new Error('Could not load ' + file)); };
      document.head.appendChild(el);
    });
  }
  var manifest = location.protocol === 'file:' ? Promise.resolve({}) : fetch(base + 'spot-page-runtime.json', { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error('Manifest unavailable');
    return r.json();
  }).then(readVersions).catch(function () { return {}; });
  window.MADO_SPOT_PAGE_READY = manifest.then(function (versions) {
    var cssReady = Promise.all(styles.map(function (file) { return load(file, versions); }));
    // Append ordered classic scripts together: their downloads overlap, but async=false
    // keeps catalog -> renderer -> gallery -> map execution order in the browser.
    var scriptReady = scripts.map(function (file) {
      if (file === 'spot-page-shared-data.js' && window.MADO_SPOT_PAGE_SHARED_DATA) return Promise.resolve();
      return load(file, versions);
    });
    var articleReady = Promise.all([scriptReady[0], scriptReady[1]]).then(function () {
      if (window.MADO_SPOT_PAGE_RENDERED !== true) throw new Error('Article rendering failed');
    });
    // Enhancements may fail independently; keep the usable article and navigation.
    scriptReady.slice(2).forEach(function (ready) { ready.catch(function () {}); });
    return Promise.all([cssReady, articleReady]).then(function () {
      revealShell();
    });
  }).catch(function () {
    // A required-asset failure must leave the title, article or fallback links
    // readable, including the degraded case where a stylesheet is unavailable.
    revealShell();
    var host = document.querySelector('[data-spot-page-shared-module="page"]');
    if (host) {
      var message = document.createElement('p');
      message.className = 'spot-page-load-error';
      message.textContent = document.documentElement.lang === 'ja' ? 'ページを読み込めませんでした。再読み込みしてください。' : 'Unable to load this page. Please reload.';
      host.appendChild(message);
    }
  });
}());
