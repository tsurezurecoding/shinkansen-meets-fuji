/* =========================================================
 * 新幹線の窓 — GPSライブモード
 * ========================================================= */

(function () {
  "use strict";

  var T = window.MADO_TRACK;

  function initialLang() {
    var urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang === "ja" || urlLang === "en") {
      localStorage.setItem("madoLive.lang", urlLang);
      localStorage.setItem("mado-lang", urlLang);
      return urlLang;
    }
    return localStorage.getItem("madoLive.lang") || localStorage.getItem("mado-lang") || "ja";
  }

  var STR = {
    ja: {
      brandName: "新幹線の窓",
      brandSub: "旅の瞬間を見逃さない",
      navQuick: "TOP",
      navStart: "列車選択",
      navLive: "ライブ地図",
      navBrowse: "車窓図鑑",
      navFaq: "FAQ",
      navMedals: "獲得メダル",
      appTitle: "ライブ地図",
      waiting: "GPS待機中",
      locating: "測位中…",
      tracking: "追跡中",
      offroute: "路線から離れています",
      gpsError: "GPSを取得できません",
      gpsDenied: "位置情報が許可されていません",
      demo: "デモ走行中",
      dirAuto: "🧭 自動",
      dirDown: "🧭 →新大阪",
      dirUp: "🧭 →東京",
      next: "つぎの車窓",
      side_E: "E席・山側",
      side_A: "A席・海側",
      windowRight: "進行方向 右",
      windowLeft: "進行方向 左",
      passed: "通過した車窓",
      atStation: "付近",
      between: " → ",
      km: "km",
      sec: "秒",
      viewFor: "見える時間 約",
      startGps: "📍 GPSで開始",
      startDemo: "▶ デモ走行（乗らずに試す）",
      idleTitle: "乗車したら、GPSをオンに。",
      idleDesc: "現在地から「つぎに見える車窓」を予測して、地図とカウントダウンで案内します。GPSはこの端末内でのみ使われ、送信されません。",
      settings: "設定",
      soundL: "通知音（60秒前）",
      vibL: "バイブレーション",
      wakeL: "画面をスリープさせない",
      followL: "地図を現在地に追従",
      dirL: "進行方向",
      dirOptAuto: "自動判定",
      dirOptDown: "東京 → 新大阪",
      dirOptUp: "新大阪 → 東京",
      stop: "■ 計測を停止",
      close: "閉じる",
      note: "試作版（noindex）。位置情報は端末内で処理され、外部送信されません。",
      demoTitle: "デモ走行",
      demoDesc: "実際に乗らなくても、仮想の のぞみ に乗って動きを確認できます。",
      demoFrom: "出発",
      demoSpeed: "倍速",
      cancel: "キャンセル",
      depart: "▶ 出発",
      realtime: "1x（実時間）",
      noGeo: "この端末では位置情報が使えません",
      httpsNote: "GPSはHTTPS配信時のみ利用できます（デモ走行は可能）",
    },
    en: {
      brandName: "Shinkansen Window",
      brandSub: "Never miss a moment of the journey.",
      navQuick: "Home",
      navStart: "Train Search",
      navLive: "Live Map",
      navBrowse: "Field Guide",
      navFaq: "FAQ",
      navMedals: "Medals",
      appTitle: "Live Map",
      waiting: "Waiting for GPS",
      locating: "Locating…",
      tracking: "Tracking",
      offroute: "Away from the line",
      gpsError: "Cannot get GPS",
      gpsDenied: "Location permission denied",
      demo: "Demo run",
      dirAuto: "🧭 Auto",
      dirDown: "🧭 →Osaka",
      dirUp: "🧭 →Tokyo",
      next: "NEXT VIEW",
      side_E: "Seat E · Mountain",
      side_A: "Seat A · Sea",
      windowRight: "Right window",
      windowLeft: "Left window",
      passed: "Passed views",
      atStation: "near",
      between: " → ",
      km: "km",
      sec: "s",
      viewFor: "Visible for ~",
      startGps: "📍 Start with GPS",
      startDemo: "▶ Demo run (try without riding)",
      idleTitle: "On board? Turn on GPS.",
      idleDesc: "Predicts the next window view from your live position, with a map and countdown. Location data never leaves your device.",
      settings: "Settings",
      soundL: "Alert sound (60s before)",
      vibL: "Vibration",
      wakeL: "Keep screen awake",
      followL: "Follow my position",
      dirL: "Direction",
      dirOptAuto: "Auto-detect",
      dirOptDown: "Tokyo → Shin-Osaka",
      dirOptUp: "Shin-Osaka → Tokyo",
      stop: "■ Stop tracking",
      close: "Close",
      note: "Prototype (noindex). Location is processed on-device only.",
      demoTitle: "Demo run",
      demoDesc: "Ride a virtual Nozomi to see how it works — no ticket needed.",
      demoFrom: "Departure",
      demoSpeed: "Speed",
      cancel: "Cancel",
      depart: "▶ Depart",
      realtime: "1x (real time)",
      noGeo: "Geolocation is not available on this device",
      httpsNote: "GPS needs HTTPS (demo run still works)",
    },
  };

  var state = {
    lang: initialLang(),
    mode: "idle",
    dirMode: "auto",
    dir: 0,
    dirAccum: 0,
    km: null,
    speedKmh: 0,
    lastFix: null,
    offRoute: false,
    accuracy: null,
    watchId: null,
    demoTimer: null,
    demo: null,
    passed: [],
    passedIds: {},
    alertedIds: {},
    alertSpotId: null,
    wakeLock: null,
    settings: loadSettings(),
  };

  function loadSettings() {
    try {
      var s = JSON.parse(localStorage.getItem("madoLive.settings") || "{}");
      return {
        sound: !!s.sound,
        vib: s.vib !== false,
        wake: s.wake !== false,
        follow: s.follow !== false,
      };
    } catch (e) {
      return { sound: false, vib: true, wake: true, follow: true };
    }
  }

  function saveSettings() {
    localStorage.setItem("madoLive.settings", JSON.stringify(state.settings));
  }

  var spots = SPOTS
    .filter(function (s) { return typeof s.minutesFromTokyo === "number"; })
    .map(function (s) {
      var km = T.minToKm(s.minutesFromTokyo);
      return { raw: s, id: s.id, km: km, viewPos: T.latLngAtKm(km), marker: null };
    })
    .sort(function (a, b) { return a.km - b.km; });

  function spotName(sp) { return sp.raw[state.lang] ? sp.raw[state.lang].name : sp.raw.ja.name; }
  function spotHook(sp) { return sp.raw[state.lang] ? sp.raw[state.lang].hook : sp.raw.ja.hook; }
  function spotArea(sp) { return sp.raw[state.lang] ? sp.raw[state.lang].area : sp.raw.ja.area; }
  function spotPhoto(sp) {
    var img = sp.raw.image || (sp.raw.photos && sp.raw.photos.length ? sp.raw.photos[0].src : null);
    return img ? "../" + img : null;
  }
  function t(key) { return STR[state.lang][key] || key; }
  function sideLabel(sp) { return sp.raw.side === "E" ? t("side_E") : t("side_A"); }
  function windowLabel(sp) {
    if (!state.dir) return "";
    var isRight = (sp.raw.side === "E") === (state.dir > 0);
    return isRight ? t("windowRight") : t("windowLeft");
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var map = null;
  var userMarker = null;
  var accCircle = null;
  var sightLine = null;
  var landmarkMarker = null;

  function createMap() {
    if (map) return;
    var leafletCss = document.createElement("link");
    leafletCss.rel = "stylesheet";
    leafletCss.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(leafletCss);
    var script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = function () {
      map = L.map("map", { zoomControl: false, attributionControl: true }).setView([35.2, 137.9], 7);
      L.control.zoom({ position: "topright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.polyline(T.latLngs(), { color: "#4da3ff", weight: 3, opacity: 0.8 }).addTo(map);
      T.anchors().forEach(function (a) {
        var st = (window.ROUTE?.refStations || []).find(function (s) { return s.id === a.id; });
        var major = st && st.major;
        L.circleMarker([a.lat, a.lng], {
          radius: major ? 5 : 3,
          color: "#fff",
          weight: 1.5,
          fillColor: major ? "#ffd166" : "#9fb0ca",
          fillOpacity: 1,
        }).addTo(map).bindTooltip(
          '<span class="station-label">' + (st ? (state.lang === "ja" ? st.ja : st.en) : a.id) + "</span>",
          { permanent: major, direction: "right", className: "station-tip", opacity: 0.9 }
        );
      });
      spots.forEach(function (sp) {
        var icon = L.divIcon({
          className: "",
          html: '<div class="spot-marker" id="mk-' + sp.id + '">' + (sp.raw.icon || "👀") + "</div>",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        sp.marker = L.marker([sp.viewPos.lat, sp.viewPos.lng], { icon: icon }).addTo(map);
        sp.marker.on("click", function () { openSpotPopup(sp); });
      });
    };
    document.head.appendChild(script);
  }

  function openSpotPopup(sp) {
    if (!sp.marker) return;
    var photo = spotPhoto(sp);
    var html =
      '<div style="min-width:180px;max-width:230px">' +
      '<div style="font-weight:700;font-size:0.95rem">' + (sp.raw.icon || "") + " " + esc(spotName(sp)) + "</div>" +
      '<div style="color:#555;font-size:0.78rem;margin:2px 0 6px">' + esc(spotHook(sp)) + "</div>" +
      (photo ? '<img src="' + photo + '" style="width:100%;border-radius:8px" loading="lazy">' : "") +
      '<div style="font-size:0.75rem;margin-top:6px">' + sideLabel(sp) +
      (state.dir ? " ・ " + windowLabel(sp) : "") + "</div>" +
      "</div>";
    sp.marker.bindPopup(html).openPopup();
  }

  function updateUserMarker(lat, lng, acc) {
    if (!map) return;
    if (!userMarker) {
      userMarker = L.marker([lat, lng], {
        icon: L.divIcon({ className: "", html: '<div class="user-marker pulse"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      userMarker.setLatLng([lat, lng]);
    }
    if (acc != null && acc < 3000) {
      if (!accCircle) {
        accCircle = L.circle([lat, lng], { radius: acc, color: "#4da3ff", weight: 1, fillOpacity: 0.08 }).addTo(map);
      } else {
        accCircle.setLatLng([lat, lng]).setRadius(acc);
      }
    }
    if (state.settings.follow) {
      map.panTo([lat, lng], { animate: true, duration: 0.5 });
      if (map.getZoom() < 11) map.setZoom(12);
    }
  }

  function updateSightLine(nextSp) {
    if (!map) return;
    if (sightLine) { map.removeLayer(sightLine); sightLine = null; }
    if (landmarkMarker) { map.removeLayer(landmarkMarker); landmarkMarker = null; }
    if (!nextSp) return;
    var m = nextSp.raw.map;
    if (!m || typeof m.lat !== "number") return;
    sightLine = L.polyline(
      [[nextSp.viewPos.lat, nextSp.viewPos.lng], [m.lat, m.lng]],
      { color: "#ffd166", weight: 2, dashArray: "6 6", opacity: 0.9 }
    ).addTo(map);
    landmarkMarker = L.circleMarker([m.lat, m.lng], {
      radius: 6,
      color: "#ffd166",
      weight: 2,
      fillColor: "#ffd166",
      fillOpacity: 0.6,
    }).addTo(map).bindTooltip(
      '<span class="station-label">🎯 ' + esc(state.lang === "ja" ? (m.ja || "") : (m.en || m.ja || "")) + "</span>",
      { direction: "top", opacity: 0.95 }
    );
  }

  function handleFix(lat, lng, acc, gpsSpeedMs, timestamp) {
    var now = timestamp || Date.now();
    var proj = T.projectToTrack(lat, lng);
    state.accuracy = acc;
    state.offRoute = proj.crossKm > 4;
    updateUserMarker(lat, lng, acc);
    if (state.offRoute) {
      setStatus("err", t("offroute") + " (" + proj.crossKm.toFixed(1) + t("km") + ")");
      render();
      return;
    }
    if (state.km == null) {
      state.km = proj.km;
    } else {
      state.km = state.km + 0.45 * (proj.km - state.km);
    }
    var speed = null;
    if (typeof gpsSpeedMs === "number" && !isNaN(gpsSpeedMs) && gpsSpeedMs >= 0) speed = gpsSpeedMs * 3.6;
    if (state.lastFix) {
      var dtH = (now - state.lastFix.t) / 3600000;
      if (dtH > 0.00003) {
        var dKm = proj.km - state.lastFix.km;
        var calc = Math.abs(dKm) / dtH;
        if (calc < 400) speed = speed == null ? calc : (speed * 0.5 + calc * 0.5);
        state.dirAccum = state.dirAccum * 0.85 + dKm;
        if (state.dirMode === "auto") {
          if (state.dirAccum > 0.25) state.dir = 1;
          else if (state.dirAccum < -0.25) state.dir = -1;
        }
      }
    }
    if (speed != null) state.speedKmh = state.speedKmh * 0.6 + speed * 0.4;
    state.lastFix = { km: proj.km, t: now };
    if (state.mode === "gps") setStatus("ok", t("tracking") + (acc != null ? " ±" + Math.round(acc) + "m" : ""));
    render();
  }

  function aheadInfo(sp) {
    var d = state.dir ? (sp.km - state.km) * state.dir : Math.abs(sp.km - state.km);
    var etaSec = null;
    var approx = false;
    if (state.dir && d >= 0) {
      if (state.speedKmh >= 30) etaSec = (d / state.speedKmh) * 3600;
      else {
        var curMin = T.kmToMin(state.km);
        etaSec = Math.abs(sp.raw.minutesFromTokyo - curMin) * 60;
        approx = true;
      }
    }
    return { dist: d, etaSec: etaSec, approx: approx };
  }

  function fmtEta(sec, approx) {
    if (sec == null) return "--:--";
    var s = Math.max(0, Math.round(sec));
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    return (approx ? "~" : "") + (mm < 10 ? "0" + mm : mm) + ":" + (ss < 10 ? "0" + ss : ss);
  }

  var el = {};
  [
    "tb-status", "tb-speed", "btn-dir", "segband", "next-card", "nc-label", "nc-eta",
    "nc-icon", "nc-name", "nc-hook", "nc-side", "nc-dist", "nc-dur", "nc-photo",
    "upcoming", "passed-wrap", "passed-summary", "passed", "idle-panel",
    "alertbar", "al-icon", "al-count", "al-name", "al-side", "live-title"
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  function setStatus(cls, text) {
    el["tb-status"].className = "tb-status " + (cls || "");
    el["tb-status"].textContent = text;
  }

  function setMarkerClass(sp, cls) {
    var node = document.getElementById("mk-" + sp.id);
    if (node) node.className = "spot-marker" + (cls ? " " + cls : "");
  }

  function updateAlert(next) {
    if (!next || !state.dir || next.info.etaSec == null || next.info.etaSec > 60 || next.info.dist < 0) {
      if (!next || state.alertSpotId !== (next && next.sp.id)) hideAlert();
      if (next && next.info.etaSec != null && next.info.etaSec <= 60 && state.alertSpotId === next.sp.id) {
        el["al-count"].textContent = Math.max(0, Math.round(next.info.etaSec));
      }
      return;
    }
    var sp = next.sp;
    if (state.alertSpotId === sp.id) {
      el["al-count"].textContent = Math.max(0, Math.round(next.info.etaSec));
      return;
    }
    if (state.alertedIds[sp.id]) return;
    state.alertedIds[sp.id] = true;
    state.alertSpotId = sp.id;
    el["al-icon"].textContent = sp.raw.icon || "👀";
    el["al-count"].textContent = Math.round(next.info.etaSec);
    el["al-name"].textContent = spotName(sp);
    el["al-side"].textContent = sideLabel(sp) + " · " + windowLabel(sp);
    el["al-side"].className = "side-badge " + sp.raw.side;
    el["alertbar"].classList.remove("hidden");
    if (state.settings.vib && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  function hideAlert() {
    el["alertbar"].classList.add("hidden");
    state.alertSpotId = null;
  }

  function render() {
    var dispSpeed = state.demo ? state.speedKmh / state.demo.mult : state.speedKmh;
    el["tb-speed"].textContent = state.mode === "idle" ? "--" : Math.round(dispSpeed);
    el["btn-dir"].textContent =
      state.dirMode === "down" ? t("dirDown") :
      state.dirMode === "up" ? t("dirUp") :
      state.dir > 0 ? t("dirDown") : state.dir < 0 ? t("dirUp") : t("dirAuto");
    if (state.km == null) return;
    var seg = T.segmentAtKm(state.km);
    if (seg) {
      var nameOf = function (id) {
        var st = (window.ROUTE?.refStations || []).find(function (s) { return s.id === id; });
        return st ? (state.lang === "ja" ? st.ja : st.en) : id;
      };
      var txt = seg.at
        ? "🚉 " + nameOf(seg.at.id) + " " + t("atStation")
        : state.dir < 0
          ? nameOf(seg.to.id) + t("between") + nameOf(seg.from.id)
          : nameOf(seg.from.id) + t("between") + nameOf(seg.to.id);
      el["segband"].textContent = txt;
      el["segband"].classList.remove("hidden");
    }
    var ahead = [];
    spots.forEach(function (sp) {
      var info = aheadInfo(sp);
      if (state.dir && info.dist < -0.3) {
        if (!state.passedIds[sp.id]) {
          state.passedIds[sp.id] = true;
          state.passed.push({ sp: sp, time: new Date() });
        }
        setMarkerClass(sp, "passed");
      } else if (info.dist >= -0.3) {
        ahead.push({ sp: sp, info: info });
      }
    });
    ahead.sort(function (a, b) { return a.info.dist - b.info.dist; });
    var next = ahead.length ? ahead[0] : null;
    spots.forEach(function (sp) {
      if (state.passedIds[sp.id]) return;
      setMarkerClass(sp, next && next.sp.id === sp.id ? "next" : "");
    });
    if (next && state.dir) {
      var sp = next.sp;
      var info = next.info;
      el["next-card"].classList.remove("hidden");
      el["nc-label"].textContent = t("next");
      el["nc-eta"].textContent = fmtEta(info.etaSec, info.approx);
      el["nc-icon"].textContent = sp.raw.icon || "👀";
      el["nc-name"].textContent = spotName(sp);
      el["nc-hook"].textContent = spotHook(sp);
      el["nc-side"].textContent = sideLabel(sp) + (state.dir ? " · " + windowLabel(sp) : "");
      el["nc-side"].className = "side-badge " + sp.raw.side;
      el["nc-dist"].textContent = info.dist.toFixed(1) + " " + t("km");
      el["nc-dur"].textContent = sp.raw.durationSec ? t("viewFor") + sp.raw.durationSec + t("sec") : "";
      var photo = spotPhoto(sp);
      if (photo) {
        el["nc-photo"].src = photo;
        el["nc-photo"].classList.remove("hidden");
      } else {
        el["nc-photo"].classList.add("hidden");
      }
      updateSightLine(sp);
    } else {
      el["next-card"].classList.add("hidden");
      updateSightLine(null);
    }
    el["upcoming"].innerHTML = ahead.slice(next ? 1 : 0, next ? 6 : 5).map(function (a) {
      var w = windowLabel(a.sp);
      return '<div class="up-row">' +
        '<div class="up-icon">' + (a.sp.raw.icon || "👀") + "</div>" +
        '<div class="up-info"><div class="up-name">' + esc(spotName(a.sp)) + "</div>" +
        '<div class="up-sub">' + esc(spotArea(a.sp)) + " · " + sideLabel(a.sp) + (w ? " · " + w : "") + "</div></div>" +
        '<div class="up-eta">' + (state.dir ? fmtEta(a.info.etaSec, a.info.approx) : a.info.dist.toFixed(0) + t("km")) +
        "<br><small>" + a.info.dist.toFixed(1) + t("km") + "</small></div></div>";
    }).join("");
    if (state.passed.length) {
      el["passed-wrap"].classList.remove("hidden");
      el["passed-summary"].textContent = t("passed") + " (" + state.passed.length + ")";
      el["passed"].innerHTML = state.passed.slice().reverse().map(function (p) {
        var hh = p.time.getHours();
        var mi = p.time.getMinutes();
        return '<div class="pa-row"><span class="ok">✓</span> ' + (p.sp.raw.icon || "") + " " + esc(spotName(p.sp)) +
          '<span style="margin-left:auto">' + hh + ":" + (mi < 10 ? "0" + mi : mi) + "</span></div>";
      }).join("");
    }
    updateAlert(next);
  }

  function startGps() {
    if (!navigator.geolocation) {
      setStatus("err", t("noGeo"));
      return;
    }
    if (!window.isSecureContext) {
      setStatus("err", t("httpsNote"));
      return;
    }
    stopAll();
    state.mode = "gps";
    document.getElementById("idle-panel").classList.add("hidden");
    setStatus("warn", t("locating"));
    state.watchId = navigator.geolocation.watchPosition(
      function (pos) {
        handleFix(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.coords.speed, pos.timestamp);
      },
      function (err) {
        setStatus("err", err.code === 1 ? t("gpsDenied") : t("gpsError"));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
    );
    acquireWake();
  }

  function startDemo(dirStr, mult) {
    stopAll();
    state.mode = "demo";
    document.getElementById("idle-panel").classList.add("hidden");
    state.demo = {
      km: dirStr === "down" ? 0 : T.totalKm,
      dir: dirStr === "down" ? 1 : -1,
      mult: mult,
      lastT: Date.now(),
    };
    setStatus("warn", t("demo") + " " + mult + "x");
    state.demoTimer = setInterval(demoTick, 700);
    acquireWake();
    demoTick();
  }

  function demoTick() {
    var d = state.demo;
    if (!d) return;
    var now = Date.now();
    var dtH = (now - d.lastT) / 3600000;
    d.lastT = now;
    d.km += d.dir * 250 * d.mult * dtH;
    if ((d.dir > 0 && d.km >= T.totalKm) || (d.dir < 0 && d.km <= 0)) {
      stopAll();
      showIdle();
      return;
    }
    var p = T.latLngAtKm(d.km);
    handleFix(p.lat, p.lng, 15, (250 * d.mult) / 3.6, now);
    setStatus("warn", t("demo") + " " + d.mult + "x");
  }

  function stopAll() {
    if (state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
    if (state.demoTimer) {
      clearInterval(state.demoTimer);
      state.demoTimer = null;
    }
    state.demo = null;
    state.mode = "idle";
    state.km = null;
    state.speedKmh = 0;
    state.dir = state.dirMode === "down" ? 1 : state.dirMode === "up" ? -1 : 0;
    state.dirAccum = 0;
    state.lastFix = null;
    state.passed = [];
    state.passedIds = {};
    state.alertedIds = {};
    hideAlert();
    releaseWake();
  }

  function showIdle() {
    document.getElementById("idle-panel").classList.remove("hidden");
    document.getElementById("next-card").classList.add("hidden");
    document.getElementById("upcoming").innerHTML = "";
    document.getElementById("passed-wrap").classList.add("hidden");
    document.getElementById("segband").classList.add("hidden");
    updateSightLine(null);
    spots.forEach(function (sp) { setMarkerClass(sp, ""); });
    setStatus("", t("waiting"));
    el["tb-speed"].textContent = "--";
  }

  function acquireWake() {
    if (!state.settings.wake || !("wakeLock" in navigator)) return;
    navigator.wakeLock.request("screen").then(function (wl) {
      state.wakeLock = wl;
    }).catch(function () {});
  }

  function releaseWake() {
    if (state.wakeLock) {
      state.wakeLock.release().catch(function () {});
      state.wakeLock = null;
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && state.mode !== "idle") acquireWake();
  });

  setInterval(function () {
    if (state.mode !== "idle" && state.km != null && !state.offRoute) {
      if (state.dir && state.speedKmh > 30 && state.lastFix) {
        var age = (Date.now() - state.lastFix.t) / 3600000;
        if (age > 0.0008 && age < 0.02 && state.mode === "gps") state.km += state.dir * state.speedKmh * 0.000278;
      }
      render();
    }
  }, 1000);

  function updateChromeLinks() {
    var suffix = state.lang === "en" ? "?lang=en" : "";
    var links = {
      home: "../index.html" + suffix + "#top",
      journey: "../index.html" + suffix + "#journey",
      live: "index.html" + suffix,
      zukan: "../zukan.html" + suffix,
      faq: state.lang === "en" ? "../en/guide.html" : "../guide.html",
      memories: "../index.html" + suffix + "#memories",
    };
    document.querySelectorAll("[data-live-link]").forEach(function (link) {
      var key = link.getAttribute("data-live-link");
      if (links[key]) link.setAttribute("href", links[key]);
    });
  }

  function applyLang() {
    localStorage.setItem("madoLive.lang", state.lang);
    localStorage.setItem("mado-lang", state.lang);
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-live-copy]").forEach(function (node) {
      var key = node.getAttribute("data-live-copy");
      node.textContent = t(key);
    });
    el["live-title"].textContent = t("appTitle");
    document.getElementById("idle-title").textContent = t("idleTitle");
    document.getElementById("idle-desc").textContent = t("idleDesc");
    document.getElementById("btn-start").textContent = t("startGps");
    document.getElementById("btn-demo").textContent = t("startDemo");
    document.getElementById("btn-lang").textContent = state.lang === "ja" ? "EN" : "日本語";
    document.getElementById("set-title").textContent = t("settings");
    document.getElementById("set-sound-l").textContent = t("soundL");
    document.getElementById("set-vib-l").textContent = t("vibL");
    document.getElementById("set-wake-l").textContent = t("wakeL");
    document.getElementById("set-follow-l").textContent = t("followL");
    document.getElementById("set-dir-l").textContent = t("dirL");
    var sd = document.getElementById("set-dir");
    sd.options[0].text = t("dirOptAuto");
    sd.options[1].text = t("dirOptDown");
    sd.options[2].text = t("dirOptUp");
    document.getElementById("btn-stop").textContent = t("stop");
    document.getElementById("btn-close-settings").textContent = t("close");
    document.getElementById("set-note").textContent = t("note");
    document.getElementById("demo-title").textContent = t("demoTitle");
    document.getElementById("demo-desc").textContent = t("demoDesc");
    document.getElementById("demo-from-l").textContent = t("demoFrom");
    document.getElementById("demo-speed-l").textContent = t("demoSpeed");
    var df = document.getElementById("demo-from");
    df.options[0].text = t("dirOptDown");
    df.options[1].text = t("dirOptUp");
    document.getElementById("demo-mult").options[0].text = t("realtime");
    document.getElementById("btn-demo-cancel").textContent = t("cancel");
    document.getElementById("btn-demo-start").textContent = t("depart");
    updateChromeLinks();
    if (state.mode === "idle") setStatus("", t("waiting"));
    render();
  }

  document.getElementById("btn-lang").addEventListener("click", function () {
    state.lang = state.lang === "ja" ? "en" : "ja";
    applyLang();
  });
  document.getElementById("btn-start").addEventListener("click", startGps);
  document.getElementById("btn-demo").addEventListener("click", function () {
    document.getElementById("demo-panel").classList.remove("hidden");
  });
  document.getElementById("btn-demo-cancel").addEventListener("click", function () {
    document.getElementById("demo-panel").classList.add("hidden");
  });
  document.getElementById("btn-demo-start").addEventListener("click", function () {
    document.getElementById("demo-panel").classList.add("hidden");
    startDemo(document.getElementById("demo-from").value, parseInt(document.getElementById("demo-mult").value, 10) || 20);
  });
  document.getElementById("btn-dir").addEventListener("click", function () {
    state.dirMode = state.dirMode === "auto" ? "down" : state.dirMode === "down" ? "up" : "auto";
    if (state.dirMode === "down") state.dir = 1;
    else if (state.dirMode === "up") state.dir = -1;
    else { state.dir = 0; state.dirAccum = 0; }
    document.getElementById("set-dir").value = state.dirMode;
    render();
  });
  document.getElementById("btn-settings").addEventListener("click", function () {
    document.getElementById("set-sound").checked = state.settings.sound;
    document.getElementById("set-vib").checked = state.settings.vib;
    document.getElementById("set-wake").checked = state.settings.wake;
    document.getElementById("set-follow").checked = state.settings.follow;
    document.getElementById("set-dir").value = state.dirMode;
    document.getElementById("settings").classList.remove("hidden");
  });
  document.getElementById("btn-close-settings").addEventListener("click", function () {
    state.settings.sound = document.getElementById("set-sound").checked;
    state.settings.vib = document.getElementById("set-vib").checked;
    state.settings.wake = document.getElementById("set-wake").checked;
    state.settings.follow = document.getElementById("set-follow").checked;
    saveSettings();
    state.dirMode = document.getElementById("set-dir").value;
    if (state.dirMode === "down") state.dir = 1;
    else if (state.dirMode === "up") state.dir = -1;
    else { state.dir = 0; state.dirAccum = 0; }
    document.getElementById("settings").classList.add("hidden");
    render();
  });
  document.getElementById("btn-stop").addEventListener("click", function () {
    document.getElementById("settings").classList.add("hidden");
    stopAll();
    showIdle();
  });
  document.getElementById("al-close").addEventListener("click", function () {
    var id = state.alertSpotId;
    if (id) state.alertedIds[id] = true;
    hideAlert();
  });

  createMap();
  applyLang();
  showIdle();
})();
