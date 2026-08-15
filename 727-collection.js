(function () {
  "use strict";

  var page = document.querySelector(".collection-727-page");
  if (!page || typeof BOARD_COLLECTION === "undefined") return;

  var points = BOARD_COLLECTION.slice();
  var routeMinutes = 147;
  var stamps = loadStamps();
  var mapState = null;
  var leafletPromise = null;
  var openPointId = "";
  var activeFilters = new Set();

  function loadStamps() {
    try {
      var parsed = JSON.parse(localStorage.getItem("mado-stamps") || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) { return {}; }
  }
  function saveStamps() {
    try { localStorage.setItem("mado-stamps", JSON.stringify(stamps)); } catch (error) { /* storage is optional */ }
  }
  function stampId(point) { return point.stampId || point.id; }
  function stampIds(point) { return [stampId(point), point.id].concat(point.legacyStampIds || []); }
  function isFound(point) { return stampIds(point).some(function (id) { return Boolean(stamps[id]); }); }
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function pointName(point) { return point.collectionJaName || (point.ja && typeof point.ja === "object" ? point.ja.name : point.ja) || "沿線の地点"; }
  function sideLabel(point) { return point.side === "A" ? "A席側" : "E席側"; }
  function pointSegment(point) { return point.segment || "東海道新幹線沿線"; }
  function fromShinOsaka(point) { return Math.max(0, routeMinutes - Number(point.minutesFromTokyo || 0)); }
  function mapURL(point) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(point.lat + "," + point.lng); }
  function googleEmbedURL(point) { return "https://www.google.com/maps?q=" + encodeURIComponent(point.lat + "," + point.lng) + "&z=15&output=embed"; }
  function statusLabel(point) { return point.confidence === "needs-check" ? "確認中" : ""; }
  function matchesFilter(point) {
    var seatFilters = ["seat-a", "seat-e"].filter(function (filter) { return activeFilters.has(filter); });
    var photoFilters = ["photo", "no-photo"].filter(function (filter) { return activeFilters.has(filter); });
    var recordFilters = ["found", "unfound"].filter(function (filter) { return activeFilters.has(filter); });
    var hasPhoto = Boolean(point.photo && point.photo.src);
    var found = isFound(point);
    if (seatFilters.length && !seatFilters.includes("seat-" + String(point.side || "").toLowerCase())) return false;
    if (photoFilters.length && !((hasPhoto && activeFilters.has("photo")) || (!hasPhoto && activeFilters.has("no-photo")))) return false;
    if (recordFilters.length && !((found && activeFilters.has("found")) || (!found && activeFilters.has("unfound")))) return false;
    return true;
  }
  function updateFilterControls(count) {
    document.querySelectorAll("[data-collection-filter]").forEach(function (button) {
      var filter = button.getAttribute("data-collection-filter");
      var selected = filter === "all" ? activeFilters.size === 0 : activeFilters.has(filter);
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    var countTarget = document.getElementById("collectionListCount");
    if (countTarget) countTarget.textContent = count + "地点";
  }

  function renderProgress() {
    var found = points.filter(isFound).length;
    var progress = document.getElementById("collectionProgress");
    if (progress) progress.innerHTML = "<div class=\"collection-progress-copy\"><strong>" + found + " / " + points.length + "地点を記録</strong><span>訪問済みの地点は、この端末の車窓スタンプに保存されます。</span></div><div class=\"collection-progress-bar\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"" + points.length + "\" aria-valuenow=\"" + found + "\"><span style=\"width:" + Math.round((found / points.length) * 100) + "%\"></span></div>";
    var stageData = [
      { threshold: 1, className: "bronze", title: "はじめの一枚", body: "最初の地点を記録" },
      { threshold: 8, className: "bronze", title: "ブロンズ" },
      { threshold: 16, className: "silver", title: "シルバー" },
      { threshold: points.length, className: "gold", title: "ゴールド", body: "全地点を記録" },
    ];
    var medals = document.getElementById("collectionMedals");
    if (!medals) return;
    medals.innerHTML = stageData.map(function (stage) {
      var achieved = found >= stage.threshold;
      var body = stage.body || (stage.threshold + "地点を記録");
      return "<article class=\"collection-stage-card" + (achieved ? " is-achieved" : "") + "\"><div class=\"collection-stage-medal medal-" + stage.className + "\" aria-hidden=\"true\"><span class=\"collection-medal-ribbon\"></span><span>727</span><i>★</i></div><div><h3>" + escapeHTML(stage.title) + "</h3><p>" + escapeHTML(body) + "</p><span class=\"collection-stage-state\">" + (achieved ? "達成" : "未達成") + "</span></div></article>";
    }).join("");
  }

  function photoMarkup(point) {
    if (!point.photo || !point.photo.src) return "<div class=\"collection-point-detail-photo collection-photo-empty\"><span class=\"eyebrow\">PHOTO</span><strong>写真はまだありません</strong><p>自前で確認できる写真がある地点だけを掲載します。</p></div>";
    return "<div class=\"collection-point-detail-photo\">" + [point.photo].concat(point.collectionPhotos || []).map(function (photo) {
      return "<figure><img src=\"" + escapeHTML(photo.src) + "\" alt=\"" + escapeHTML(photo.alt || pointName(point)) + "\" loading=\"lazy\" decoding=\"async\"><figcaption>" + escapeHTML(photo.note || "michikusa") + "</figcaption></figure>";
    }).join("") + "</div>";
  }
  function detailMarkup(point, detailId) {
    var found = isFound(point);
    var status = statusLabel(point);
    var statusMarkup = status ? "<span class=\"collection-status collection-status-checking\">" + escapeHTML(status) + "</span>" : "";
    var spotLink = point.guidePageId ? "<a class=\"collection-detail-link\" href=\"spots/" + escapeHTML(point.guidePageId) + ".html\">解説を見る<span aria-hidden=\"true\">→</span></a>" : "";
    return "<div id=\"" + escapeHTML(detailId) + "\" class=\"collection-point-detail\" data-point-detail hidden><div class=\"collection-point-detail-meta\"><span>" + escapeHTML(pointSegment(point)) + "</span><span>" + escapeHTML(sideLabel(point)) + "</span><span>東京 約" + escapeHTML(point.minutesFromTokyo) + "分</span><span>新大阪 約" + escapeHTML(fromShinOsaka(point)) + "分</span></div><div class=\"collection-point-detail-grid\"><div class=\"collection-point-google-map\" data-google-map=\"" + escapeHTML(point.id) + "\" aria-label=\"" + escapeHTML(pointName(point) + "のGoogleマップ") + "\"></div>" + photoMarkup(point) + "</div><div class=\"collection-point-detail-footer\"><div class=\"collection-point-detail-status\">" + statusMarkup + "<span>" + (found ? "訪問済みとして記録中" : "まだ記録していません") + "</span></div><div class=\"collection-point-actions\"><button type=\"button\" class=\"collection-stamp-button\" data-point-stamp=\"" + escapeHTML(point.id) + "\" aria-pressed=\"" + found + "\"><span aria-hidden=\"true\">" + (found ? "✓" : "○") + "</span>" + (found ? "記録済み" : "訪問済みにする") + "</button><a class=\"collection-map-button\" href=\"" + escapeHTML(mapURL(point)) + "\" target=\"_blank\" rel=\"noopener\">Google マップで開く<span aria-hidden=\"true\">↗</span></a>" + spotLink + "</div></div></div>";
  }
  function destroyExpandedMap() { document.querySelectorAll("[data-google-map]").forEach(function (target) { target.innerHTML = ""; }); }
  function loadExpandedMap(point) {
    var target = Array.prototype.find.call(document.querySelectorAll("[data-google-map]"), function (item) { return item.getAttribute("data-google-map") === point.id; });
    if (target) target.innerHTML = "<iframe src=\"" + escapeHTML(googleEmbedURL(point)) + "\" title=\"" + escapeHTML(pointName(point) + "のGoogleマップ") + "\" loading=\"lazy\" referrerpolicy=\"no-referrer-when-downgrade\"></iframe>";
  }
  function renderList() {
    var list = document.getElementById("collectionList");
    if (!list) return;
    destroyExpandedMap();
    var visiblePoints = points.filter(matchesFilter);
    updateFilterControls(visiblePoints.length);
    list.innerHTML = visiblePoints.map(function (point) {
      var found = isFound(point);
      var detailId = "collection-detail-" + point.id;
      var note = point.collectionNote ? "<small class=\"collection-point-summary-note\">" + escapeHTML(point.collectionNote) + "</small>" : "";
      var seatTag = "<span class=\"collection-seat-tag collection-seat-" + escapeHTML(String(point.side || "").toLowerCase()) + "\">" + escapeHTML(sideLabel(point)) + "</span>";
      var summaryTitle = "<span class=\"collection-point-summary-title\"><strong class=\"collection-point-summary-name\">" + escapeHTML(pointName(point)) + "</strong>" + seatTag + "</span>";
      var thumbnail = point.photo && point.photo.src ? "<img class=\"collection-point-summary-thumb\" src=\"" + escapeHTML(point.photo.src) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\">" : "";
      return "<article class=\"collection-point-card" + (found ? " is-found" : "") + "\" data-point-id=\"" + escapeHTML(point.id) + "\" data-point-card><button type=\"button\" class=\"collection-point-summary\" data-point-accordion aria-expanded=\"false\" aria-controls=\"" + escapeHTML(detailId) + "\"><span class=\"collection-point-summary-copy\">" + summaryTitle + note + "</span>" + thumbnail + "<span class=\"collection-point-found-icon\" aria-label=\"" + (found ? "記録済み" : "未記録") + "\">" + (found ? "✓" : "○") + "</span></button>" + detailMarkup(point, detailId) + "</article>";
    }).join("");
    if (openPointId) setAccordion(openPointId, true, false);
  }
  function setAccordion(id, open, scroll) {
    var nextId = open ? id : "";
    destroyExpandedMap();
    document.querySelectorAll("[data-point-card]").forEach(function (card) {
      var current = nextId && card.getAttribute("data-point-id") === nextId;
      var summary = card.querySelector("[data-point-accordion]");
      var detail = card.querySelector("[data-point-detail]");
      card.classList.toggle("is-open", Boolean(current));
      if (summary) summary.setAttribute("aria-expanded", String(Boolean(current)));
      if (detail) detail.hidden = !current;
    });
    openPointId = nextId;
    var point = points.find(function (item) { return item.id === nextId; });
    if (point) loadExpandedMap(point);
    if (scroll) {
      var card = document.querySelector('[data-point-id="' + id + '"]');
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  function toggleStamp(point) {
    var id = stampId(point);
    if (isFound(point)) {
      stampIds(point).forEach(function (storedId) { delete stamps[storedId]; });
    } else {
      stamps[id] = Date.now();
    }
    saveStamps(); renderProgress(); renderList();
    if (mapState && mapState.markers.has(point.id)) updateMarkerPopup(point);
  }
  function setMapStatus(message) { var status = document.getElementById("collectionMapStatus"); if (status) status.textContent = message; }
  function popupHTML(point) {
    var labels = [];
    if (statusLabel(point)) labels.push(statusLabel(point));
    if (isFound(point)) labels.push("記録済み");
    return "<div class=\"collection-map-popup\"><strong>" + escapeHTML(pointName(point)) + "</strong><span>" + escapeHTML(pointSegment(point)) + " · " + escapeHTML(sideLabel(point)) + "</span>" + (labels.length ? "<span>" + escapeHTML(labels.join(" · ")) + "</span>" : "") + "<button type=\"button\" data-map-point=\"" + escapeHTML(point.id) + "\">一覧で確認</button></div>";
  }
  function updateMarkerPopup(point) { var marker = mapState && mapState.markers.get(point.id); if (marker) marker.setPopupContent(popupHTML(point)); }
  function renderFallbackLinks() {
    var fallback = document.getElementById("collectionMapFallback"); var links = document.getElementById("collectionMapFallbackLinks");
    if (!fallback || !links) return;
    fallback.hidden = false;
    links.innerHTML = points.map(function (point) { return "<a href=\"" + escapeHTML(mapURL(point)) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHTML(pointName(point)) + "</a>"; }).join("");
  }
  function fitFullMap() { if (mapState && mapState.bounds) mapState.map.fitBounds(mapState.bounds, { padding: [20, 20], maxZoom: 9 }); }
  function focusPoint(id) { if (points.some(function (point) { return point.id === id; })) setAccordion(id, true, true); }
  function loadLocalLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    return new Promise(function (resolve, reject) {
      var css = document.createElement("link"); css.rel = "stylesheet"; css.href = new URL("vendor/leaflet/leaflet.css", document.baseURI).href; document.head.appendChild(css);
      var script = document.createElement("script"); script.src = new URL("vendor/leaflet/leaflet.js", document.baseURI).href;
      script.onload = function () { window.L ? resolve(window.L) : reject(new Error("Leaflet global missing")); }; script.onerror = function () { reject(new Error("Local Leaflet load failed")); }; document.head.appendChild(script);
    });
  }
  function getLeaflet() { if (window.L) return Promise.resolve(window.L); if (!leafletPromise) leafletPromise = window.MADO_LEAFLET && typeof window.MADO_LEAFLET.load === "function" ? window.MADO_LEAFLET.load() : loadLocalLeaflet(); return leafletPromise; }
  function initMap() {
    var container = document.getElementById("collectionMap"); if (!container) return;
    getLeaflet().then(function (L) {
      var map = L.map(container, { scrollWheelZoom: false }).setView([35.25, 137.1], 7);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
      var markers = new Map(); var bounds = [];
      points.forEach(function (point) {
        var marker = L.marker([point.lat, point.lng], { title: pointName(point) }).addTo(map);
        marker.bindPopup(popupHTML(point)); marker.on("click", function () { focusPoint(point.id); }); markers.set(point.id, marker); bounds.push([point.lat, point.lng]);
      });
      mapState = { map: map, markers: markers, bounds: bounds.length ? L.latLngBounds(bounds) : null };
      window.requestAnimationFrame(function () { map.invalidateSize(); fitFullMap(); setMapStatus("全" + points.length + "地点を表示中。マーカーを選べます。"); });
    }).catch(function () { container.classList.add("is-map-fallback"); setMapStatus("地図を読み込めませんでした。地点別リンクをご利用ください。"); renderFallbackLinks(); });
  }
  page.addEventListener("click", function (event) {
    var filterButton = event.target.closest("[data-collection-filter]");
    if (filterButton) {
      event.preventDefault();
      var filter = filterButton.getAttribute("data-collection-filter") || "all";
      if (filter === "all") activeFilters.clear();
      else if (activeFilters.has(filter)) activeFilters.delete(filter);
      else activeFilters.add(filter);
      openPointId = "";
      renderList();
      return;
    }
    var stampButton = event.target.closest("[data-point-stamp]");
    if (stampButton) { event.preventDefault(); var stampPoint = points.find(function (point) { return point.id === stampButton.getAttribute("data-point-stamp"); }); if (stampPoint) toggleStamp(stampPoint); return; }
    var accordionButton = event.target.closest("[data-point-accordion]");
    if (accordionButton) { event.preventDefault(); var id = accordionButton.closest("[data-point-card]").getAttribute("data-point-id"); setAccordion(id, openPointId !== id, true); return; }
    var mapButton = event.target.closest("[data-map-point]");
    if (mapButton) { event.preventDefault(); focusPoint(mapButton.getAttribute("data-map-point")); }
  });
  renderProgress(); renderList(); initMap();
})();
