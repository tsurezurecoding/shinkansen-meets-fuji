/* =========================================================
 * 新幹線の窓 — ミニ地図コンポーネント
 * ========================================================= */

(function () {
  "use strict";

  var LEAFLET_CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  var LEAFLET_JS_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
  var TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var leafletPromise = null;

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getSpot(spotId) {
    return (window.SPOTS || []).find(function (spot) { return spot.id === spotId; }) || null;
  }

  function getSpotLang(spot, lang) {
    return spot?.[lang] || spot?.ja || spot?.en || {};
  }

  function hasMapCoordinates(spot) {
    return !!(spot && spot.map && typeof spot.map.lat === "number" && typeof spot.map.lng === "number" && typeof spot.minutesFromTokyo === "number");
  }

  function ensureLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      if (!document.querySelector('link[data-mado-leaflet="1"]')) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS_URL;
        link.dataset.madoLeaflet = "1";
        document.head.appendChild(link);
      }
      var existing = document.querySelector('script[data-mado-leaflet="1"]');
      if (existing) {
        existing.addEventListener("load", function () { resolve(window.L); }, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = LEAFLET_JS_URL;
      script.async = true;
      script.dataset.madoLeaflet = "1";
      script.onload = function () { resolve(window.L); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return leafletPromise;
  }

  function mapTexts(lang) {
    return lang === "en"
      ? {
          enable: "Enable map interaction",
          note: "Opening the map connects to OpenStreetMap.",
          fallbackNote: "The inline map could not be loaded. Open this spot in an external map instead.",
          fallbackLink: "Open map",
          landmark: "Landmark",
          viewpoint: "Track viewpoint",
        }
      : {
          enable: "地図を操作する",
          note: "地図を開くと OpenStreetMap に接続します。",
          fallbackNote: "簡易地図を読み込めませんでした。外部地図で位置を確認できます。",
          fallbackLink: "地図で見る",
          landmark: "対象物",
          viewpoint: "線路上の視点位置",
        };
  }

  function mapHref(spot, lang) {
    if (!spot || !spot.map) return "";
    if (spot.map.lat != null && spot.map.lng != null) {
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(spot.map.lat + "," + spot.map.lng);
    }
    var query = spot.map[lang] || spot.map.ja || spot.map.en;
    return query ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query) : "";
  }

  function fallbackHTML(spot, lang) {
    var texts = mapTexts(lang);
    var href = mapHref(spot, lang);
    var link = href
      ? '<a class="map-link spot-mini-map-link" href="' + escapeHTML(href) + '" target="_blank" rel="noopener noreferrer" data-map="' + escapeHTML(spot.id) + '"><span class="map-link-icon" aria-hidden="true">↗</span><span>' + escapeHTML(texts.fallbackLink) + "</span></a>"
      : "";
    return '<div class="mini-map-fallback"><p>' + escapeHTML(texts.fallbackNote) + "</p>" + link + "</div>";
  }

  function setupInteractiveToggle(map, button) {
    var enabled = false;
    function setInteractive(next) {
      enabled = next;
      [map.dragging, map.touchZoom, map.doubleClickZoom, map.scrollWheelZoom, map.boxZoom, map.keyboard].forEach(function (handler) {
        if (!handler) return;
        handler[next ? "enable" : "disable"]();
      });
      if (map.tap) map.tap[next ? "enable" : "disable"]();
      button.hidden = next;
    }
    setInteractive(false);
    button.addEventListener("click", function () { setInteractive(true); });
  }

  function buildMiniMap(el, spot, opts) {
    var lang = opts.lang === "en" ? "en" : "ja";
    var texts = mapTexts(lang);
    var track = window.MADO_TRACK;
    var spotLang = getSpotLang(spot, lang);
    var viewpointKm = track.minToKm(spot.minutesFromTokyo);
    var viewpoint = track.latLngAtKm(viewpointKm);
    var line = track.sliceLatLngsAroundKm(viewpointKm, opts.radiusKm || 20);
    var landmark = copy(spot.map);
    el.innerHTML = [
      '<div class="mini-map-shell">',
      '<div class="mini-map-canvas" data-mini-map-canvas></div>',
      '<button type="button" class="mini-map-enable" data-mini-map-enable>',
      escapeHTML(texts.enable),
      "</button>",
      '<p class="mini-map-note">',
      escapeHTML(texts.note),
      "</p>",
      "</div>",
    ].join("");

    var canvas = el.querySelector("[data-mini-map-canvas]");
    var button = el.querySelector("[data-mini-map-enable]");
    var map = window.L.map(canvas, {
      zoomControl: false,
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      touchZoom: true,
      tap: true,
    });

    window.L.tileLayer(TILE_URL, {
      maxZoom: 17,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    window.L.control.zoom({ position: "bottomright" }).addTo(map);

    window.L.polyline(line, {
      color: "#1f4f8a",
      weight: 4,
      opacity: 0.92,
    }).addTo(map);
    window.L.circleMarker([viewpoint.lat, viewpoint.lng], {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: "#1f4f8a",
      fillOpacity: 1,
    }).addTo(map).bindTooltip(texts.viewpoint, { direction: "top", opacity: 0.92 });
    window.L.polyline(
      [[viewpoint.lat, viewpoint.lng], [landmark.lat, landmark.lng]],
      { color: "#b46a00", weight: 2, dashArray: "7 6", opacity: 0.85 }
    ).addTo(map);
    window.L.circleMarker([landmark.lat, landmark.lng], {
      radius: 7,
      color: "#b46a00",
      weight: 2,
      fillColor: "#ffd7a0",
      fillOpacity: 1,
    }).addTo(map).bindTooltip(
      escapeHTML(texts.landmark + ": " + (landmark[lang] || landmark.ja || landmark.en || spotLang.name || spot.id)),
      { direction: "top", opacity: 0.92 }
    );

    var bounds = window.L.latLngBounds([
      [viewpoint.lat, viewpoint.lng],
      [landmark.lat, landmark.lng],
    ]);
    line.forEach(function (point) { bounds.extend(point); });
    map.fitBounds(bounds.pad(0.16));
    setupInteractiveToggle(map, button);
    setTimeout(function () { map.invalidateSize(); }, 0);
    el.dataset.miniMapReady = "1";
    el._madoMiniMap = map;
    return map;
  }

  function renderMiniMap(el, spotId, opts) {
    opts = opts || {};
    var spot = getSpot(spotId);
    if (!el || !hasMapCoordinates(spot) || !window.MADO_TRACK) return Promise.resolve(false);
    if (el.dataset.miniMapReady === "1") {
      if (el._madoMiniMap) setTimeout(function () { el._madoMiniMap.invalidateSize(); }, 0);
      return Promise.resolve(el._madoMiniMap || true);
    }
    return ensureLeaflet().then(function () {
      return buildMiniMap(el, spot, opts);
    }).catch(function () {
      el.innerHTML = fallbackHTML(spot, opts.lang === "en" ? "en" : "ja");
      el.dataset.miniMapReady = "error";
      return false;
    });
  }

  function bindMiniMapDetails(root, opts) {
    var scope = root || document;
    scope.querySelectorAll("[data-mini-map-details]").forEach(function (details) {
      if (details.dataset.miniMapBound === "1") return;
      details.dataset.miniMapBound = "1";
      var spotId = details.dataset.miniMapSpot;
      var lang = details.dataset.miniMapLang || opts?.lang || document.documentElement.lang || "ja";
      var target = details.querySelector("[data-mini-map-target]");
      function onToggle() {
        if (!details.open || !target) return;
        renderMiniMap(target, spotId, { lang: lang, radiusKm: Number(details.dataset.miniMapRadius || 20) || 20 });
      }
      details.addEventListener("toggle", onToggle);
      if (details.open) onToggle();
    });
  }

  window.MADO_MINI_MAP = {
    bindMiniMapDetails: bindMiniMapDetails,
    hasMapCoordinates: hasMapCoordinates,
    renderMiniMap: renderMiniMap,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { bindMiniMapDetails(document); }, { once: true });
  } else {
    bindMiniMapDetails(document);
  }
})();
