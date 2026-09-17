(function () {
  "use strict";

  var page = document.querySelector(".collection-727-page");
  if (!page || typeof BOARD_COLLECTION === "undefined") return;

  // 日本語版は /727-collection.html、英語版は /en/727-collection.html に置く。
  // 画像だけはルート直下の images/ を共有するので、英語版では ../ を足す。
  var LANG = String(document.documentElement.lang || "ja").toLowerCase().indexOf("en") === 0 ? "en" : "ja";
  var ASSET_PREFIX = LANG === "en" ? "../" : "";
  var TEXT = {
    ja: {
      fallbackName: "沿線の地点", fallbackSegment: "東海道新幹線沿線",
      seatA: "A席側", seatE: "E席側",
      statusRemoved: "撤去確認", statusChecking: "確認中",
      points: function (n) { return n + "地点"; },
      records: function (n) { return " ＋ 調査記録" + n + "件"; },
      groupRecords: function (n) { return "・調査記録" + n + "件"; },
      progress: function (found, total) { return found + " / " + total + "地点を記録"; },
      progressNote: "訪問済みの地点は、この端末の車窓スタンプに保存されます。",
      stageFirstTitle: "はじめの一枚", stageFirstBody: "最初の地点を記録",
      stageBronze: "ブロンズ", stageSilver: "シルバー", stageGold: "ゴールド",
      stageBody: function (n) { return n + "地点を記録"; }, stageAllBody: "全地点を記録",
      achieved: "達成", notAchieved: "未達成",
      photoEmptyTitle: "写真はまだありません", photoEmptyBody: "自前で確認できる写真がある地点だけを掲載します。",
      detailLink: "解説を見る",
      fromTokyo: function (n) { return "東京 約" + n + "分"; },
      fromOsaka: function (n) { return "新大阪 約" + n + "分"; },
      summaryTime: function (n) { return "東京から約" + n + "分"; },
      mapAria: function (name) { return name + "のGoogleマップ"; },
      recordedState: "訪問済みとして記録中", unrecordedState: "まだ記録していません",
      recorded: "記録済み", markVisited: "訪問済みにする", unrecorded: "未記録",
      openMap: "Google マップで開く", streetView: "ストリートビューで周辺を見る",
      minutes: function (n) { return n + "分"; },
      minutesRange: function (a, b) { return a + "〜" + b + "分"; },
      segmentJoin: "〜",
      segmentTimeRange: function (range) { return "東京から約" + range; },
      popupOpen: "一覧で確認",
      mapStatusAll: function (n) { return "全" + n + "地点を表示中。マーカーを選べます。"; },
      mapStatusFail: "地図を読み込めませんでした。地点別リンクをご利用ください。",
    },
    en: {
      fallbackName: "A point along the line", fallbackSegment: "Along the Tokaido Shinkansen",
      seatA: "Seat A side", seatE: "Seat E side",
      statusRemoved: "Confirmed removed", statusChecking: "Being checked",
      points: function (n) { return n + (n === 1 ? " point" : " points"); },
      records: function (n) { return " + " + n + (n === 1 ? " research record" : " research records"); },
      groupRecords: function (n) { return " · " + n + (n === 1 ? " research record" : " research records"); },
      progress: function (found, total) { return found + " / " + total + " points recorded"; },
      progressNote: "Points you mark are saved to the window stamps on this device.",
      stageFirstTitle: "First sighting", stageFirstBody: "Record your first point",
      stageBronze: "Bronze", stageSilver: "Silver", stageGold: "Gold",
      stageBody: function (n) { return "Record " + n + " points"; }, stageAllBody: "Record every point",
      achieved: "Achieved", notAchieved: "Not yet",
      photoEmptyTitle: "No photograph yet", photoEmptyBody: "Only points we have photographed ourselves carry a picture.",
      detailLink: "Read the guide",
      fromTokyo: function (n) { return "About " + n + " min from Tokyo"; },
      fromOsaka: function (n) { return "About " + n + " min from Shin-Osaka"; },
      summaryTime: function (n) { return "About " + n + " min from Tokyo"; },
      mapAria: function (name) { return "Google map of " + name; },
      recordedState: "Recorded as visited", unrecordedState: "Not recorded yet",
      recorded: "Recorded", markVisited: "Mark as visited", unrecorded: "Not recorded",
      openMap: "Open in Google Maps", streetView: "Look around in Street View",
      minutes: function (n) { return n + " min"; },
      minutesRange: function (a, b) { return a + "-" + b + " min"; },
      segmentJoin: " - ",
      segmentTimeRange: function (range) { return "About " + range + " from Tokyo"; },
      popupOpen: "Show in the list",
      mapStatusAll: function (n) { return "Showing all " + n + " points. Select a marker for details."; },
      mapStatusFail: "The map could not be loaded. Please use the per-point links instead.",
    },
  };
  var T = TEXT[LANG];
  // 区間名は日本語の駅名で持っているので、英語ではROUTEの駅名表へ引き当てる。
  var STATION_EN = {};
  if (typeof ROUTE !== "undefined" && ROUTE && Array.isArray(ROUTE.refStations)) {
    ROUTE.refStations.forEach(function (station) { STATION_EN[station.ja] = station.en; });
  }
  function localizeSegment(segment) {
    if (LANG !== "en") return segment;
    return String(segment).split(" → ").map(function (part) { return STATION_EN[part] || part; }).join(" → ");
  }
  function assetURL(src) { return ASSET_PREFIX + String(src || ""); }

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
  // 現地で確認できなかった地点（撤去・工事など）は収集カウントから外す。
  function isMissing(point) { return point.siteStatus === "not-found" || point.siteStatus === "removed"; }
  function countablePoints() { return points.filter(function (point) { return !isMissing(point); }); }
  function stampId(point) { return point.stampId || point.id; }
  function stampIds(point) { return [stampId(point), point.id].concat(point.legacyStampIds || []); }
  function isFound(point) { return stampIds(point).some(function (id) { return Boolean(stamps[id]); }); }
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function pointName(point) {
    if (LANG === "en") return (point.en && typeof point.en === "object" ? point.en.name : point.en) || T.fallbackName;
    return point.collectionJaName || (point.ja && typeof point.ja === "object" ? point.ja.name : point.ja) || T.fallbackName;
  }
  function pointNote(point) { return LANG === "en" ? point.collectionNoteEn : point.collectionNote; }
  function sideLabel(point) { return point.side === "A" ? T.seatA : T.seatE; }
  function pointSegment(point) { return point.segment ? localizeSegment(point.segment) : T.fallbackSegment; }
  function fromShinOsaka(point) { return Math.max(0, routeMinutes - Number(point.minutesFromTokyo || 0)); }
  function mapURL(point) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(point.lat + "," + point.lng); }
  // 地点の座標から周辺のストリートビューを開く（Google Maps URLs の公式形式。画像は転載しない）。
  function streetViewURL(point) { return "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + encodeURIComponent(point.lat + "," + point.lng); }
  function googleEmbedURL(point) { return "https://www.google.com/maps?q=" + encodeURIComponent(point.lat + "," + point.lng) + "&z=15&output=embed"; }
  function statusLabel(point) { return point.siteStatus === "removed" ? T.statusRemoved : (point.confidence === "needs-check" ? T.statusChecking : ""); }
  function matchesFilter(point) {
    var seatFilters = ["seat-a", "seat-e"].filter(function (filter) { return activeFilters.has(filter); });
    var recordFilters = ["found", "unfound"].filter(function (filter) { return activeFilters.has(filter); });
    var found = isFound(point);
    if (seatFilters.length && !seatFilters.includes("seat-" + String(point.side || "").toLowerCase())) return false;
    if (recordFilters.length && !((found && activeFilters.has("found")) || (!found && activeFilters.has("unfound")))) return false;
    return true;
  }
  function updateFilterControls(visiblePoints) {
    document.querySelectorAll("[data-collection-filter]").forEach(function (button) {
      var filter = button.getAttribute("data-collection-filter");
      var selected = filter === "all" ? activeFilters.size === 0 : activeFilters.has(filter);
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    var countTarget = document.getElementById("collectionListCount");
    if (countTarget) {
      var collectable = visiblePoints.filter(function (point) { return !isMissing(point); }).length;
      var records = visiblePoints.length - collectable;
      countTarget.textContent = T.points(collectable) + (records ? T.records(records) : "");
    }
  }

  function renderProgress() {
    var countable = countablePoints();
    var found = countable.filter(isFound).length;
    var progress = document.getElementById("collectionProgress");
    if (progress) progress.innerHTML = "<div class=\"collection-progress-copy\"><strong>" + escapeHTML(T.progress(found, countable.length)) + "</strong><span>" + escapeHTML(T.progressNote) + "</span></div><div class=\"collection-progress-bar\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"" + countable.length + "\" aria-valuenow=\"" + found + "\"><span style=\"width:" + Math.round((found / countable.length) * 100) + "%\"></span></div>";
    var stageData = [
      { threshold: 1, className: "bronze", title: T.stageFirstTitle, body: T.stageFirstBody },
      { threshold: 8, className: "bronze", title: T.stageBronze },
      { threshold: 16, className: "silver", title: T.stageSilver },
      { threshold: countable.length, className: "gold", title: T.stageGold, body: T.stageAllBody },
    ];
    var medals = document.getElementById("collectionMedals");
    if (!medals) return;
    medals.innerHTML = stageData.map(function (stage) {
      var achieved = found >= stage.threshold;
      var body = stage.body || T.stageBody(stage.threshold);
      return "<article class=\"collection-stage-card" + (achieved ? " is-achieved" : "") + "\"><div class=\"collection-stage-medal medal-" + stage.className + "\" aria-hidden=\"true\"><span class=\"collection-medal-ribbon\"></span><span>727</span><i>★</i></div><div><h3>" + escapeHTML(stage.title) + "</h3><p>" + escapeHTML(body) + "</p><span class=\"collection-stage-state\">" + (achieved ? T.achieved : T.notAchieved) + "</span></div></article>";
    }).join("");
  }

  function photoMarkup(point) {
    if (!point.photo || !point.photo.src) return "<div class=\"collection-point-detail-photo collection-photo-empty\"><span class=\"eyebrow\">PHOTO</span><strong>" + escapeHTML(T.photoEmptyTitle) + "</strong><p>" + escapeHTML(T.photoEmptyBody) + "</p></div>";
    return "<div class=\"collection-point-detail-photo\">" + [point.photo].concat(point.collectionPhotos || []).map(function (photo) {
      return "<figure><img src=\"" + escapeHTML(assetURL(photo.src)) + "\" alt=\"" + escapeHTML(photo.alt || pointName(point)) + "\" loading=\"lazy\" decoding=\"async\"><figcaption>" + escapeHTML((LANG === "en" && photo.noteEn) || photo.note || "michikusa") + "</figcaption></figure>";
    }).join("") + "</div>";
  }
  function detailMarkup(point, detailId) {
    var found = isFound(point);
    var status = statusLabel(point);
    var statusMarkup = status ? "<span class=\"collection-status collection-status-checking\">" + escapeHTML(status) + "</span>" : "";
    var spotLink = point.guidePageId ? "<a class=\"collection-detail-link\" href=\"spots/" + escapeHTML(point.guidePageId) + ".html\">" + escapeHTML(T.detailLink) + "<span aria-hidden=\"true\">→</span></a>" : "";
    return "<div id=\"" + escapeHTML(detailId) + "\" class=\"collection-point-detail\" data-point-detail hidden><div class=\"collection-point-detail-meta\"><span>" + escapeHTML(pointSegment(point)) + "</span><span>" + escapeHTML(sideLabel(point)) + "</span><span>" + escapeHTML(T.fromTokyo(point.minutesFromTokyo)) + "</span><span>" + escapeHTML(T.fromOsaka(fromShinOsaka(point))) + "</span></div><div class=\"collection-point-detail-grid\"><div class=\"collection-point-google-map\" data-google-map=\"" + escapeHTML(point.id) + "\" aria-label=\"" + escapeHTML(T.mapAria(pointName(point))) + "\"></div>" + photoMarkup(point) + "</div><div class=\"collection-point-detail-footer\"><div class=\"collection-point-detail-status\">" + statusMarkup + "<span>" + escapeHTML(found ? T.recordedState : T.unrecordedState) + "</span></div><div class=\"collection-point-actions\"><button type=\"button\" class=\"collection-stamp-button\" data-point-stamp=\"" + escapeHTML(point.id) + "\" aria-pressed=\"" + found + "\"><span aria-hidden=\"true\">" + (found ? "✓" : "○") + "</span>" + escapeHTML(found ? T.recorded : T.markVisited) + "</button><a class=\"collection-map-button\" href=\"" + escapeHTML(mapURL(point)) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHTML(T.openMap) + "<span aria-hidden=\"true\">↗</span></a><a class=\"collection-map-button\" href=\"" + escapeHTML(streetViewURL(point)) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHTML(T.streetView) + "<span aria-hidden=\"true\">↗</span></a>" + spotLink + "</div></div></div>";
  }
  function destroyExpandedMap() { document.querySelectorAll("[data-google-map]").forEach(function (target) { target.innerHTML = ""; }); }
  function loadExpandedMap(point) {
    var target = Array.prototype.find.call(document.querySelectorAll("[data-google-map]"), function (item) { return item.getAttribute("data-google-map") === point.id; });
    if (target) target.innerHTML = "<iframe src=\"" + escapeHTML(googleEmbedURL(point)) + "\" title=\"" + escapeHTML(T.mapAria(pointName(point))) + "\" loading=\"lazy\" referrerpolicy=\"no-referrer-when-downgrade\"></iframe>";
  }
  function renderList() {
    var list = document.getElementById("collectionList");
    if (!list) return;
    destroyExpandedMap();
    var visiblePoints = points.filter(matchesFilter).slice().sort(function (a, b) {
      return Number(a.minutesFromTokyo || 0) - Number(b.minutesFromTokyo || 0) || Number(a.sourceNo || 0) - Number(b.sourceNo || 0);
    });
    updateFilterControls(visiblePoints);
    var segmentGroups = [];
    visiblePoints.forEach(function (point) {
      var segment = pointSegment(point);
      var group = segmentGroups.find(function (item) { return item.segment === segment; });
      if (!group) { group = { segment: segment, points: [] }; segmentGroups.push(group); }
      group.points.push(point);
    });
    function pointCard(point) {
      var found = isFound(point);
      var detailId = "collection-detail-" + point.id;
      var note = pointNote(point) ? "<small class=\"collection-point-summary-note\">" + escapeHTML(pointNote(point)) + "</small>" : "";
      var seatTag = "<span class=\"collection-seat-tag collection-seat-" + escapeHTML(String(point.side || "").toLowerCase()) + "\">" + escapeHTML(sideLabel(point)) + "</span>";
      var summaryTitle = "<span class=\"collection-point-summary-title\"><strong class=\"collection-point-summary-name\">" + escapeHTML(pointName(point)) + "</strong>" + seatTag + "</span>";
      var summaryMeta = "<span class=\"collection-point-summary-meta\"><span class=\"collection-point-summary-time\">" + escapeHTML(T.summaryTime(point.minutesFromTokyo)) + "</span><span>" + escapeHTML(pointSegment(point).replace(" → ", T.segmentJoin)) + "</span></span>";
      var thumbnail = point.photo && point.photo.src ? "<img class=\"collection-point-summary-thumb\" src=\"" + escapeHTML(assetURL(point.photo.src)) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\">" : "";
      return "<div class=\"collection-route-point" + (isMissing(point) ? " is-missing-point" : "") + "\"><article class=\"collection-point-card" + (found ? " is-found" : "") + (isMissing(point) ? " is-missing" : "") + "\" data-point-id=\"" + escapeHTML(point.id) + "\" data-point-card><button type=\"button\" class=\"collection-point-summary\" data-point-accordion aria-expanded=\"false\" aria-controls=\"" + escapeHTML(detailId) + "\"><span class=\"collection-point-summary-copy\">" + summaryMeta + summaryTitle + note + "</span>" + thumbnail + "<span class=\"collection-point-found-icon\" aria-label=\"" + escapeHTML(found ? T.recorded : T.unrecorded) + "\">" + (found ? "✓" : "○") + "</span></button>" + detailMarkup(point, detailId) + "</article></div>";
    }
    list.innerHTML = segmentGroups.map(function (group, index) {
      var stations = localizeSegment(group.segment).split(" → ");
      var minutes = group.points.map(function (point) { return Number(point.minutesFromTokyo || 0); });
      var firstMinute = Math.min.apply(Math, minutes);
      var lastMinute = Math.max.apply(Math, minutes);
      var timeRange = firstMinute === lastMinute ? T.minutes(firstMinute) : T.minutesRange(firstMinute, lastMinute);
      var collectable = group.points.filter(function (point) { return !isMissing(point); }).length;
      var records = group.points.length - collectable;
      var groupCount = T.points(collectable) + (records ? T.groupRecords(records) : "");
      var titleId = "collection-route-segment-" + index;
      return "<section class=\"collection-route-segment\" aria-labelledby=\"" + titleId + "\"><header class=\"collection-route-segment-header\"><h3 id=\"" + titleId + "\" class=\"collection-route-stations\"><span>" + escapeHTML(stations[0] || group.segment) + "</span><span class=\"collection-route-arrow\" aria-hidden=\"true\">→</span><span>" + escapeHTML(stations[1] || T.fallbackSegment) + "</span></h3><div class=\"collection-route-segment-meta\"><span>" + escapeHTML(T.segmentTimeRange(timeRange)) + "</span><span>" + groupCount + "</span></div></header><div class=\"collection-route-points\">" + group.points.map(pointCard).join("") + "</div></section>";
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
    if (isFound(point)) labels.push(T.recorded);
    return "<div class=\"collection-map-popup\"><strong>" + escapeHTML(pointName(point)) + "</strong><span>" + escapeHTML(pointSegment(point)) + " · " + escapeHTML(sideLabel(point)) + "</span>" + (labels.length ? "<span>" + escapeHTML(labels.join(" · ")) + "</span>" : "") + "<button type=\"button\" data-map-point=\"" + escapeHTML(point.id) + "\">" + escapeHTML(T.popupOpen) + "</button></div>";
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
      window.requestAnimationFrame(function () { map.invalidateSize(); fitFullMap(); setMapStatus(T.mapStatusAll(points.length)); });
    }).catch(function () { container.classList.add("is-map-fallback"); setMapStatus(T.mapStatusFail); renderFallbackLinks(); });
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
