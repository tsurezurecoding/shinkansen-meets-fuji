/* Spot detail map mode switcher */
(function () {
  "use strict";

  var isAndroidShell = window.location.hostname === "localhost";
  var scriptUrl = document.currentScript && document.currentScript.src;
  var assetRoot = scriptUrl ? new URL(".", scriptUrl) : new URL("./", document.baseURI);
  var leafletPromise = null;

  function parseMapSource(src) {
    try {
      var url = new URL(src, document.baseURI);
      var point = String(url.searchParams.get("q") || "").split(",").map(Number);
      var center = String(url.searchParams.get("center") || "").split(",").map(Number);
      var zoom = Number(url.searchParams.get("zoom"));
      if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
      return {
        point: point,
        center: Number.isFinite(center[0]) && Number.isFinite(center[1]) ? center : point,
        zoom: Number.isFinite(zoom) ? zoom : 14,
      };
    } catch (error) {
      return null;
    }
  }

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = new URL("vendor/leaflet/leaflet.css", assetRoot).href;
      document.head.appendChild(css);

      var script = document.createElement("script");
      script.src = new URL("vendor/leaflet/leaflet.js", assetRoot).href;
      script.onload = function () { resolve(window.L); };
      script.onerror = function () { reject(new Error("Leaflet load failed")); };
      document.head.appendChild(script);
    });
    return leafletPromise;
  }

  function setLeafletSource(wrapper, src) {
    var config = parseMapSource(src);
    var state = wrapper && wrapper._madoLeaflet;
    if (!config || !state) return;
    state.map.setView(config.center, config.zoom);
    state.marker.setLatLng(config.point);
  }

  function replaceGoogleMap(frame) {
    if (!isAndroidShell || !frame || frame.dataset.androidMapReady === "1") return;
    frame.dataset.androidMapReady = "1";
    var wrapper = frame.closest(".spot-static-map");
    var config = parseMapSource(frame.getAttribute("src"));
    if (!wrapper || !config) return;

    var container = document.createElement("div");
    container.className = "spot-google-map-frame spot-leaflet-map";
    container.setAttribute("role", "img");
    container.setAttribute("aria-label", frame.getAttribute("title") || "Map");
    frame.replaceWith(container);

    loadLeaflet().then(function (L) {
      if (!container.isConnected) return;
      var map = L.map(container, { scrollWheelZoom: false }).setView(config.center, config.zoom);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      var marker = L.marker(config.point).addTo(map);
      wrapper._madoLeaflet = { map: map, marker: marker };
      window.setTimeout(function () { map.invalidateSize(); }, 0);
    }).catch(function () {
      container.classList.add("spot-leaflet-map-error");
      container.textContent = document.documentElement.lang === "ja"
        ? "地図を読み込めませんでした。「地図をひらく」をご利用ください。"
        : "The map could not be loaded. Use Open map instead.";
    });
  }

  function upgradeMaps(root) {
    if (!isAndroidShell) return;
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".spot-google-map-frame").forEach(replaceGoogleMap);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-mini-map-mode]");
    if (!button) return;
    var wrapper = button.closest(".spot-static-map");
    var frame = wrapper && wrapper.querySelector(".spot-google-map-frame");
    var src = button.getAttribute("data-map-src");
    if (!wrapper || !src) return;
    if (wrapper._madoLeaflet) {
      setLeafletSource(wrapper, src);
    } else if (frame && frame.tagName === "IFRAME" && frame.getAttribute("src") !== src) {
      frame.setAttribute("src", src);
    }
    wrapper.querySelectorAll("[data-mini-map-mode]").forEach(function (item) {
      var active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", active ? "true" : "false");
    });
  });

  if (isAndroidShell) {
    upgradeMaps(document);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) { upgradeMaps(node); });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
