(function () {
  'use strict';
  var base = new URL(document.currentScript.src).href.replace(/[^/]+$/, '');
  var styles = ['style.css', 'spot-media-gallery.css'];
  var spotScripts = ['spot-page-shared-data.js', 'spot-page-shared.js', 'spot-media-gallery.js', 'spot-map.js'];
  var fixed = styles.concat(spotScripts, ['android-app-invite.js', 'site-chrome.js']);
  function allowed(file) {
    return fixed.indexOf(file) >= 0 || /^shared-ui\/[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.js$/.test(file);
  }
  function readVersions(data) {
    if (!data || data.schema !== 'mado-site-runtime' || data.version !== 1 || !data.assets || typeof data.assets !== 'object' || Array.isArray(data.assets)) throw new Error('Invalid site runtime manifest');
    if (fixed.some(function (file) { return !Object.prototype.hasOwnProperty.call(data.assets, file); })) throw new Error('Missing site runtime asset');
    var versions = {};
    Object.keys(data.assets).forEach(function (file) {
      if (!allowed(file) || typeof data.assets[file] !== 'string' || !/^[a-f0-9]{8}$/.test(data.assets[file])) throw new Error('Invalid site runtime asset');
      versions[file] = data.assets[file];
    });
    return versions;
  }
  function load(file, versions) {
    if (!allowed(file)) return Promise.reject(new Error('Unsupported site runtime asset'));
    return new Promise(function (resolve, reject) {
      var css = /\.css$/.test(file), el = document.createElement(css ? 'link' : 'script');
      var url = base + file + (versions[file] ? '?v=' + versions[file] : '');
      if (css) { el.rel = 'stylesheet'; el.href = url; }
      else { el.src = url; el.async = false; }
      el.onload = resolve;
      el.onerror = function () { reject(new Error('Could not load ' + file)); };
      document.head.appendChild(el);
    });
  }
  function reveal() {
    if (typeof window.MADO_SPOT_PAGE_BOOT_RELEASE === 'function') {
      window.MADO_SPOT_PAGE_BOOT_RELEASE();
      return;
    }
    var boot = document.getElementById('spot-page-boot-style');
    if (boot) boot.remove();
  }
  var thin = document.body && document.body.getAttribute('data-spot-page-shared-mode') === 'page' && !document.body.hasAttribute('data-article-localized');
  var boot = thin && document.getElementById('spot-page-boot-style');
  if (boot) {
    // Descendants can override inherited visibility (the current rail preview
    // does so). Keep rendered fragments hidden until their CSS is ready, while
    // preserving the original reading fallback inside the shared hosts.
    boot.textContent += '\n.spot-page > :not([data-spot-page-shared-module]), .spot-page > :not([data-spot-page-shared-module]) * { visibility:hidden !important; }';
  }
  var chromeNode = document.getElementById('mado-shared-ui-config'), chrome = null;
  try { if (chromeNode) chrome = JSON.parse(chromeNode.textContent); } catch (error) {}
  var chromeAssets = chrome && (chrome.assets || (chrome.asset ? [chrome.asset] : null));
  if (!Array.isArray(chromeAssets) || !chromeAssets.length || chromeAssets.length > 8 || chromeAssets.some(function (file, index) {
    return typeof file !== 'string' || !allowed(file) || file.indexOf('shared-ui/') !== 0 || chromeAssets.indexOf(file) !== index;
  })) chrome = null;
  // Android is a necessary platform condition, not an eligibility decision.
  // The module still owns browser, install, dismissal and privacy checks.
  var invite = document.getElementById('mado-android-invite-config') && /Android/i.test(navigator.userAgent || '');
  // One small request per document, independent of how many common modules it uses.
  var manifest = location.protocol === 'file:' || (!thin && !chrome && !invite) ? Promise.resolve({}) : fetch(base + 'site-runtime.json', { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error('Site runtime manifest unavailable');
    return r.json();
  }).then(readVersions).catch(function () { return {}; });
  window.MADO_SITE_ASSET_VERSIONS = manifest;
  var ready = manifest.then(function (versions) {
    var required = [], optional = [];
    if (thin) {
      required.push(Promise.all(styles.map(function (file) { return load(file, versions); })));
      var scripts = spotScripts.map(function (file) { return load(file, versions); });
      required.push(Promise.all(scripts.slice(0, 2)).then(function () {
        if (window.MADO_SPOT_PAGE_RENDERED !== true) throw new Error('Article rendering failed');
      }));
      optional = optional.concat(scripts.slice(2));
    }
    if (chrome) {
      required.push(Promise.all(chromeAssets.map(function (file) { return load(file, versions); }).concat([load('site-chrome.js', versions)])).then(function () {
        if (window.MADO_SHARED_UI_RENDERED !== true) throw new Error('Shared navigation rendering failed');
      }));
    }
    if (invite) optional.push(load('android-app-invite.js', versions));
    window.MADO_SITE_ENHANCEMENTS_READY = Promise.all(optional.map(function (p) { return p.catch(function () {}); }));
    return Promise.all(required).then(reveal);
  }).catch(function () {
    reveal();
    var host = document.querySelector('[data-spot-page-shared-module="page"]');
    if (host) {
      var message = document.createElement('p');
      message.className = 'spot-page-load-error';
      message.textContent = document.documentElement.lang === 'ja' ? 'ページを読み込めませんでした。再読み込みしてください。' : 'Unable to load this page. Please reload.';
      host.appendChild(message);
    }
  });
  window.MADO_SITE_RUNTIME_READY = ready;
  if (thin) window.MADO_SPOT_PAGE_READY = ready;
}());
