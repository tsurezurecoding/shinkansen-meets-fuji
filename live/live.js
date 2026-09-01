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
    if (/\/en\/live(?:\/|\/index\.html)$/.test(window.location.pathname)) {
      localStorage.setItem("madoLive.lang", "en");
      localStorage.setItem("mado-lang", "en");
      return "en";
    }
    return "ja";
  }

  var STR = {
    ja: {
      brandName: "新幹線の窓",
      brandSub: "旅の瞬間を見逃さない",
      navQuick: "TOP",
      navStart: "列車選択",
      navLive: "音声ガイド",
      navBrowse: "車窓図鑑",
      navFaq: "FAQ",
      navMedals: "スタンプ帖",
      navMore: "もっと見る",
      navMieru: "富士山 見える予報",
      navSumie: "墨絵車窓",
      navSomato: "車窓走馬灯",
      navRefs: "リンク集",
      navLp: "30秒でわかる",
      navPrivacy: "プライバシーポリシー",
      appTitle: "音声ガイド",
      waiting: "GPS待機中",
      locating: "測位中…",
      tracking: "追跡中",
      offroute: "路線から離れています",
      gpsError: "GPSを取得できません",
      gpsDenied: "位置情報が許可されていません",
      nativeStartError: "音声ガイドを開始できません。位置情報の許可を確認してください。",
      demo: "乗車プレビュー中",
      paused: "一時停止中",
      dirAuto: "🧭 自動",
      dirDown: "🧭 →新大阪",
      dirUp: "🧭 →東京",
      pause: "⏸ 一時停止",
      resume: "▶ 再開",
      narrFeatured: "🔈 主要ガイド",
      narrAll: "🔈 すべてガイド",
      narrOff: "🔇 ガイドOFF",
      stopRun: "■ 中止",
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
      startGps: "📍 GPSで開始",
      startDemo: "▶ 乗車プレビュー（乗らずに試す）",
      idleHowTitle: "使い方",
      idleStep1: "東海道新幹線に乗ったら、このページで「GPSで開始」を押す",
      idleStep2: "現在地から次の車窓スポットを割り出し、近づくと音声とカウントダウンで知らせる",
      idleStep3: "A席側・E席側のどちらに見えるかも一緒に出るので、窓の向きを迷わない",
      idleNoGps: "乗車前でも「乗車プレビュー」で東京〜新大阪の案内をひととおり試せます。位置情報の許可は不要です。",
      idleElse: "乗る前に見どころを調べるなら、こちらから。",
      idleLinkGuide: "富士山の見方",
      idleLinkZukan: "車窓図鑑",
      idleLinkTop: "列車ごとの通過時刻を調べる",
      idleTitle: "乗車中はGPSで現在地に合わせてガイド",
      idleDesc: "音声ガイドを聞きながら乗っておくと、まもなく見える景色を先に知らせます。現在地は案内計算に使い、外部サーバー等に保存しません。",
      alphaBadge: "α",
      alphaNote: "この機能はα版です。位置と通過時刻は調整中のため、ずれることがあります。",
      idleFeature1: "次に見える車窓を現在地から予測",
      idleFeature2: "主要スポットだけ、または小ネタまで音声案内",
      idleFeature3: "地図とカウントダウンで見逃しを防止",
      eaLiveWhy: "ブラウザは画面を消したり他のアプリに切り替えると案内が止まります。乗車中はアプリ版が確実です。",
      eaLiveTitle: "Google Playでアプリ版を入手",
      eaLiveBody: "画面を消しても案内と音声が続きます。無料・登録不要。",
      settings: "設定",
      vibL: "バイブレーション",
      wakeL: "画面をスリープさせない",
      followL: "地図を現在地に追従",
      dirL: "進行方向",
      narrModeL: "車窓ガイド",
      narrModeFeatured: "主要スポットのみ",
      narrModeAll: "すべて",
      narrModeOff: "オフ",
      narrModeHelp: "主要は定番・注目スポット（{featured}件）。すべては看板などの小ネタを含む{all}件です。",
      dirOptAuto: "自動判定",
      dirOptDown: "東京 → 新大阪",
      dirOptUp: "新大阪 → 東京",
      stop: "■ GPS案内を終了",
      close: "閉じる",
      note: "現在地は車窓案内の計算に使います。外部サーバー等に保存しません。地図表示では外部の地図データを取得します。",
      privacy: "プライバシーポリシー",
      narrTag: "AI実況",
      demoTitle: "乗車プレビュー",
      demoDesc: "実際に乗らなくても、仮想の のぞみ に乗って動きを確認できます。",
      demoFrom: "出発",
      demoSpeed: "倍速",
      cancel: "キャンセル",
      depart: "▶ 出発",
      realtime: "1x（実時間）",
      noGeo: "この端末では位置情報が使えません",
      httpsNote: "GPSはHTTPS配信時のみ利用できます（乗車プレビューは可能）",
    },
    en: {
      brandName: "Shinkansen Window",
      brandSub: "Never miss a moment of the journey.",
      navQuick: "Home",
      navStart: "Train Search",
      navLive: "Audio Guide",
      navBrowse: "Field Guide",
      navFaq: "FAQ",
      navMedals: "Journal",
      navMore: "More",
      navMieru: "Visibility β",
      navSumie: "Sumie Window",
      navSomato: "Window Journey",
      navRefs: "Links",
      navLp: "30 sec guide",
      navPrivacy: "Privacy",
      appTitle: "Audio Guide",
      waiting: "Waiting for GPS",
      locating: "Locating…",
      tracking: "Tracking",
      offroute: "Away from the line",
      gpsError: "Cannot get GPS",
      gpsDenied: "Location permission denied",
      nativeStartError: "Audio Guide could not start. Check the location permission.",
      demo: "Preview ride",
      paused: "Paused",
      dirAuto: "🧭 Auto",
      dirDown: "🧭 →Osaka",
      dirUp: "🧭 →Tokyo",
      pause: "⏸ Pause",
      resume: "▶ Resume",
      narrFeatured: "🔈 Key guide",
      narrAll: "🔈 All guide",
      narrOff: "🔇 Guide OFF",
      stopRun: "■ Stop",
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
      startGps: "📍 Start with GPS",
      startDemo: "▶ Preview ride (try without boarding)",
      idleHowTitle: "How it works",
      idleStep1: "Once you are on a Tokaido Shinkansen, tap Start with GPS on this page",
      idleStep2: "It works out the next view from your location and calls it with audio and a countdown",
      idleStep3: "It also tells you whether to watch the Seat A or Seat E side, so you face the right window",
      idleNoGps: "Not on board yet? The preview ride plays the whole Tokyo-Shin-Osaka guide without asking for your location.",
      idleElse: "Planning before you ride? Start here.",
      idleLinkGuide: "How to see Mt. Fuji",
      idleLinkZukan: "Window field guide",
      idleLinkTop: "Check passing times by train",
      idleTitle: "On board, GPS guides you from where you are",
      idleDesc: "Turn on the audio guide and ride along. It tells you what is coming up before the view passes. Your location is used for guidance and is not stored on external servers.",
      alphaBadge: "α",
      alphaNote: "This feature is an alpha. Positions and timing are still being tuned and may be off.",
      idleFeature1: "Predicts the next view from your live position",
      idleFeature2: "Choose key spots only, or include small curiosities",
      idleFeature3: "Map and countdown help you avoid missing it",
      eaLiveWhy: "In a browser the guide stops when the screen turns off or you switch apps. On board, the app is the reliable one.",
      eaLiveTitle: "Get the app on Google Play",
      eaLiveBody: "Guidance and audio keep running with the screen off. Free, no sign-up.",
      settings: "Settings",
      vibL: "Vibration",
      wakeL: "Keep screen awake",
      followL: "Follow my position",
      dirL: "Direction",
      narrModeL: "Window guide",
      narrModeFeatured: "Key spots only",
      narrModeAll: "All spots",
      narrModeOff: "Off",
      narrModeHelp: "Key guide covers classic and notable spots ({featured}). All guide includes small curiosities such as signs ({all}).",
      dirOptAuto: "Auto-detect",
      dirOptDown: "Tokyo → Shin-Osaka",
      dirOptUp: "Shin-Osaka → Tokyo",
      stop: "■ End GPS guide",
      close: "Close",
      note: "Your location is used for window-view guidance and is not stored on external servers. Map display loads external map data.",
      privacy: "Privacy Policy",
      narrTag: "AI GUIDE",
      demoTitle: "Preview ride",
      demoDesc: "Ride a virtual Nozomi to see how it works — no ticket needed.",
      demoFrom: "Departure",
      demoSpeed: "Speed",
      cancel: "Cancel",
      depart: "▶ Depart",
      realtime: "1x (real time)",
      noGeo: "Geolocation is not available on this device",
      httpsNote: "GPS needs HTTPS (preview ride still works)",
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
    paused: false,
    passed: [],
    passedIds: {},
    alertedIds: {},
    alertSpotId: null,
    narratedIds: {},
    narrSpotId: null,
    runStartedAt: 0,
    lastMapFollowAt: 0,
    lastHiddenRenderAt: 0,
    suppressedDemoFirstSpotId: null,
    wakeLock: null,
    settings: loadSettings(),
  };

  function loadSettings() {
    try {
      var s = JSON.parse(localStorage.getItem("madoLive.settings") || "{}");
      var narrMode = ["featured", "all", "off"].indexOf(s.narrMode) >= 0
        ? s.narrMode
        : s.narr === false ? "off" : "featured";
      return {
        vib: s.vib !== false,
        wake: s.wake !== false,
        follow: s.follow !== false,
        narrMode: narrMode,
      };
    } catch (e) {
      return { vib: true, wake: true, follow: true, narrMode: "featured" };
    }
  }

  function saveSettings() {
    localStorage.setItem("madoLive.settings", JSON.stringify(state.settings));
  }

  var spots = SPOTS
    .filter(function (s) { return typeof s.minutesFromTokyo === "number"; })
    .map(function (s) {
      // 位置は手動補正した新幹線視点(viewpoint)を優先。GPS現在地と同じポリラインへ投影して
      // kmを測るため、ポリラインが多少ゆがんでも相対距離の誤差が相殺される。
      // viewpointが無いスポットのみ従来の分ベース(minToKm)へフォールバックする。
      var km, viewPos;
      if (s.viewpoint && typeof s.viewpoint.lat === "number" && typeof s.viewpoint.lng === "number") {
        km = T.projectToTrack(s.viewpoint.lat, s.viewpoint.lng).km;
        viewPos = { lat: s.viewpoint.lat, lng: s.viewpoint.lng };
      } else {
        km = T.minToKm(s.minutesFromTokyo);
        viewPos = T.latLngAtKm(km);
      }
      return { raw: s, id: s.id, km: km, viewPos: viewPos, marker: null };
    })
    .sort(function (a, b) { return a.km - b.km; });

  function spotName(sp) { return sp.raw[state.lang] ? sp.raw[state.lang].name : sp.raw.ja.name; }
  function spotHook(sp) { return sp.raw[state.lang] ? sp.raw[state.lang].hook : sp.raw.ja.hook; }
  function spotArea(sp) { return sp.raw[state.lang] ? sp.raw[state.lang].area : sp.raw.ja.area; }
  function spotPhoto(sp) {
    var img = sp.raw.image || (sp.raw.photos && sp.raw.photos.length ? sp.raw.photos[0].src : null);
    if (!img) return null;
    if (window.MADO_NATIVE_APP) {
      img = img.replace(/^images\/(?!thumbs\/)(.+?)\.(?:jpe?g|png)$/i, "images/thumbs/$1.webp");
    }
    try { return new URL(img, APP_ASSET_BASE).href; } catch (e) { return "../" + img; }
  }
  function t(key) { return STR[state.lang][key] || key; }
  function tFmt(key, vars) {
    return t(key).replace(/\{(\w+)\}/g, function (_, name) {
      return vars && vars[name] != null ? vars[name] : "";
    });
  }
  function sideLabel(sp) { return sp.raw.side === "E" ? t("side_E") : t("side_A"); }
  function windowLabel(sp) {
    if (!state.dir) return "";
    var isRight = (sp.raw.side === "E") === (state.dir > 0);
    return isRight ? t("windowRight") : t("windowLeft");
  }

  function isFeaturedNarrationSpot(sp) {
    return sp && sp.raw && sp.raw.category !== "curious";
  }

  var featuredNarrationCount = spots.filter(isFeaturedNarrationSpot).length;
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
        var st = ((typeof ROUTE !== "undefined" && ROUTE.refStations) || (window.ROUTE && window.ROUTE.refStations) || []).find(function (s) { return s.id === a.id; });
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

  function mapFollowIntervalMs() {
    if (document.visibilityState === "hidden") return 15000;
    if (state.mode === "gps") return 3000;
    if (state.mode === "demo" && state.demo) {
      if (state.demo.mult <= 1) return 3000;
      if (state.demo.mult <= 10) return 1500;
    }
    return 700;
  }

  function updateUserMarker(lat, lng, acc) {
    if (!map) return;
    if (document.visibilityState === "hidden") return;
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
      var now = Date.now();
      var interval = mapFollowIntervalMs();
      if (state.lastMapFollowAt && now - state.lastMapFollowAt < interval) return;
      state.lastMapFollowAt = now;
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
      if (!state.offRouteTracked) { state.offRouteTracked = true; track("live_offroute", { mode: state.mode }); }
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
          var prevDir = state.dir;
          if (state.dirAccum > 0.25) state.dir = 1;
          else if (state.dirAccum < -0.25) state.dir = -1;
          if (!prevDir && state.dir) track("live_direction_detected", { direction: state.dir > 0 ? "down" : "up", mode: state.mode });
        }
      }
    }
    if (speed != null) state.speedKmh = state.speedKmh * 0.6 + speed * 0.4;
    state.lastFix = { km: proj.km, t: now };
    if (state.mode === "gps") setStatus("ok", t("tracking") + (acc != null ? " ±" + Math.round(acc) + "m" : ""));
    render();
  }

  // 遅れ側に倒さないための早め点火マージン(秒)。カウントダウン/アラート/ナレーションを
  // この秒数だけ手前に寄せ、「まもなく」が過ぎてから0になるのを防ぐ。実車検証で調整可。
  var ETA_EARLY_BIAS_SEC = 5;

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
      if (etaSec != null) etaSec = Math.max(0, etaSec - ETA_EARLY_BIAS_SEC);
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
    "tb-status", "tb-speed", "btn-dir", "btn-pause", "btn-narr-toggle", "segband", "next-card", "nc-label", "nc-eta",
    "nc-icon", "nc-name", "nc-hook", "nc-side", "nc-dist", "nc-dur", "nc-photo",
    "upcoming", "passed-wrap", "passed-summary", "passed", "idle-panel",
    "alertbar", "al-icon", "al-count", "al-name", "al-side", "live-title",
    "narrbar", "nr-tag", "nr-name", "nr-text",
    "live-map-controls", "map-narr-toggle", "map-pause", "map-stop"
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  function setStatus(cls, text) {
    el["tb-status"].className = "tb-status " + (cls || "");
    el["tb-status"].textContent = text;
  }

  function narrationEnabled() {
    return state.settings.narrMode !== "off";
  }

  function narrationButtonText() {
    if (state.settings.narrMode === "all") return t("narrAll");
    if (state.settings.narrMode === "off") return t("narrOff");
    return t("narrFeatured");
  }

  function syncRunControls() {
    var running = state.mode !== "idle";
    var narrOn = narrationEnabled();
    el["btn-pause"].classList.toggle("hidden", !running);
    el["btn-pause"].textContent = state.paused ? t("resume") : t("pause");
    el["btn-pause"].setAttribute("aria-pressed", state.paused ? "true" : "false");
    el["btn-narr-toggle"].textContent = narrationButtonText();
    el["btn-narr-toggle"].setAttribute("aria-pressed", narrOn ? "true" : "false");
    el["btn-narr-toggle"].classList.toggle("is-off", !narrOn);
    el["live-map-controls"].classList.toggle("hidden", !running);
    el["map-pause"].textContent = state.paused ? t("resume") : t("pause");
    el["map-pause"].setAttribute("aria-pressed", state.paused ? "true" : "false");
    el["map-narr-toggle"].textContent = narrationButtonText();
    el["map-narr-toggle"].setAttribute("aria-pressed", narrOn ? "true" : "false");
    el["map-narr-toggle"].classList.toggle("is-off", !narrOn);
    el["map-stop"].textContent = t("stopRun");
  }

  function setMarkerClass(sp, cls) {
    var node = document.getElementById("mk-" + sp.id);
    if (node) node.className = "spot-marker" + (cls ? " " + cls : "");
  }

  function updateAlert(next) {
    if (next && state.mode === "demo" && state.suppressedDemoFirstSpotId === next.sp.id) {
      hideAlert();
      return;
    }
    if (next && state.suppressedDemoFirstSpotId && state.suppressedDemoFirstSpotId !== next.sp.id) {
      state.suppressedDemoFirstSpotId = null;
    }
    if (state.runStartedAt && Date.now() - state.runStartedAt < 1600) {
      hideAlert();
      return;
    }
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
    track("live_alert_shown", { spot_id: sp.id, mode: state.mode });
    if (state.settings.vib && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  function hideAlert() {
    el["alertbar"].classList.add("hidden");
    state.alertSpotId = null;
  }

  /* ---- AI車窓実況: 事前生成した台本＋音声をETA連動で再生 ---- */
  var NARR = (typeof NARRATIONS !== "undefined" && NARRATIONS) || window.NARRATIONS || {};
  var liveScript = document.currentScript;
  var LIVE_ASSET_BASE = liveScript && liveScript.src ? new URL("./", liveScript.src).href : new URL("./", document.baseURI).href;
  var APP_ASSET_BASE = new URL("../", LIVE_ASSET_BASE).href;
  var NARR_SRC = new URL("narration.js?v=20260802-en-live-assets", LIVE_ASSET_BASE).href;
  var NARR_LEAD_SEC = 90;
  var NARR_WARMUP_SEC = 180;
  var NARR_MAX_QUEUE = 3;
  var narrAudio = null;
  var narrWarmAudio = null;
  var narrWarmPath = "";
  var narrHideTimer = null;
  var narrLoadPromise = null;
  var narrQueue = [];
  var narrPlaying = false;
  var nativeGuide = window.MadoLiveGuideNative;
  var nativeSessionStarted = false;
  var nativeStartPending = false;
  var nativeStartGeneration = 0;

  function hasNarrationData() {
    return !!(NARR && Object.keys(NARR).length);
  }

  function syncNarrationData() {
    NARR = (typeof NARRATIONS !== "undefined" && NARRATIONS) || window.NARRATIONS || NARR || {};
  }

  function ensureNarrationsLoaded() {
    syncNarrationData();
    if (hasNarrationData()) return Promise.resolve(NARR);
    if (narrLoadPromise) return narrLoadPromise;
    narrLoadPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = NARR_SRC;
      script.async = true;
      script.onload = function () {
        syncNarrationData();
        render();
        resolve(NARR);
      };
      script.onerror = function () { reject(new Error("narration load failed")); };
      document.head.appendChild(script);
    });
    narrLoadPromise.catch(function () { /* fallback text remains available */ });
    return narrLoadPromise;
  }

  function explicitNarrationFor(sp) {
    syncNarrationData();
    var n = NARR[sp.id];
    if (!n) return null;
    var dirKey = state.dir < 0 ? "up" : "down";
    if (n[dirKey]) return n[dirKey][state.lang] || n[dirKey].ja || n[dirKey].en || null;
    if (n.down) return n.down[state.lang] || n.down.ja || n.down.en || null;
    return n[state.lang] || n.ja || null;
  }

  function fallbackNarrationFor(sp) {
    if (state.lang === "en") {
      return { audio: false, text: spotName(sp) + ". " + spotHook(sp) + " Look around " + spotArea(sp) + "." };
    }
    return { audio: false, text: spotName(sp) + "です。" + spotHook(sp) + " " + spotArea(sp) + "付近で見えてきます。" };
  }

  function narrationFor(sp) {
    if (state.settings.narrMode === "featured" && !isFeaturedNarrationSpot(sp)) return null;
    var explicit = explicitNarrationFor(sp);
    if (explicit) return explicit;
    if (state.settings.narrMode === "all") return fallbackNarrationFor(sp);
    return null;
  }

  function narrationAudioPath(sp, n) {
    if (!n || n.audio === false) return "";
    if (n.audio) {
      if (/^(?:[a-z]+:|\/|data:|blob:)/i.test(n.audio)) return n.audio;
      return new URL(n.audio.replace(/^live\//, ""), LIVE_ASSET_BASE).href;
    }
    var dirKey = state.dir < 0 ? "up" : "down";
    return new URL("audio/" + sp.id + "_" + dirKey + "_" + state.lang + ".mp3", LIVE_ASSET_BASE).href;
  }

  function narrationGroupKey(sp) {
    var entry = NARR[sp.id];
    return (entry && entry.group) || sp.id;
  }

  function nativeNarrationForDirection(sp, dirKey) {
    var entry = NARR[sp.id];
    var directional = entry && (entry[dirKey] || entry.down);
    var narration = directional && (directional[state.lang] || directional.ja || directional.en);
    if (!narration && state.settings.narrMode === "all") {
      narration = fallbackNarrationFor(sp);
    }
    var audio = "";
    if (narration && narration.audio !== false) {
      audio = narration.audio || (sp.id + "_" + dirKey + "_" + state.lang + ".mp3");
      if (audio.indexOf("live/") !== 0) {
        audio = "live/" + (audio.indexOf("audio/") === 0 ? audio : "audio/" + audio);
      }
    }
    return {
      name: spotName(sp),
      text: narration ? narration.text : "",
      audio: audio,
    };
  }

  function nativeGuideConfig() {
    var nativeSettings = {
      narrMode: state.settings.narrMode,
      dirMode: state.dirMode,
      lang: state.lang,
    };
    return {
      route: T.points.map(function (point) {
        return { lat: point.lat, lng: point.lng, km: point.km };
      }),
      spots: spots.map(function (sp) {
        return {
          id: sp.id,
          km: sp.km,
          side: sp.raw.side || "",
          category: sp.raw.category || "",
          group: narrationGroupKey(sp),
          down: nativeNarrationForDirection(sp, "down"),
          up: nativeNarrationForDirection(sp, "up"),
        };
      }),
      narrMode: nativeSettings.narrMode,
      dirMode: nativeSettings.dirMode,
      lang: nativeSettings.lang,
      settings: nativeSettings,
    };
  }

  function beginGpsTracking() {
    if (!nativeGuide || !nativeGuide.available) {
      startGeoWatch();
      acquireWake();
      syncRunControls();
      return;
    }
    if (nativeSessionStarted) {
      startGeoWatch();
      acquireWake();
      syncRunControls();
      return;
    }
    if (nativeStartPending || state.mode !== "gps" || state.paused) return;
    var generation = ++nativeStartGeneration;
    nativeStartPending = true;
    ensureNarrationsLoaded().then(function () {
      if (generation !== nativeStartGeneration || state.mode !== "gps" || state.paused) return;
      return nativeGuide.start(nativeGuideConfig());
    }).then(function (result) {
      if (generation !== nativeStartGeneration || state.mode !== "gps" || state.paused) {
        nativeGuide.stop();
        return;
      }
      if (result && result.available === false) throw new Error("native guide unavailable");
      nativeSessionStarted = true;
      Object.keys(state.narratedIds).forEach(markNativeNarrated);
      startGeoWatch();
      acquireWake();
      syncRunControls();
    }).catch(function () {
      if (generation !== nativeStartGeneration || state.mode !== "gps" || state.paused) return;
      stopAll();
      showIdle();
      setStatus("err", t("nativeStartError"));
    }).then(function () {
      if (generation === nativeStartGeneration) nativeStartPending = false;
    });
  }

  function updateNativeGuide() {
    if (!nativeGuide || !nativeGuide.available || !nativeSessionStarted ||
        state.mode !== "gps" || state.paused) return;
    ensureNarrationsLoaded().then(function () {
      if (nativeSessionStarted && state.mode === "gps" && !state.paused) {
        nativeGuide.update(nativeGuideConfig());
      }
    }).catch(function () {});
  }

  function stopNativeGuide() {
    nativeStartGeneration += 1;
    nativeStartPending = false;
    if (nativeGuide && nativeGuide.available) nativeGuide.stop();
    nativeSessionStarted = false;
  }

  function markNativeNarrated(group) {
    if (nativeGuide && nativeGuide.available && nativeSessionStarted) nativeGuide.markNarrated(group);
  }

  function syncNativeGuideState() {
    if (!nativeGuide || !nativeGuide.available || !nativeSessionStarted) return;
    nativeGuide.getState().then(function (nativeState) {
      if (!nativeState || state.mode !== "gps" || state.paused) return;
      (nativeState.playedGroups || []).forEach(function (group) {
        state.narratedIds[group] = true;
      });
      if (nativeState.active === false || nativeState.running === false) {
        stopAll();
        showIdle();
      }
    }).catch(function () {});
  }

  function unlockAudio() {
    if (narrAudio || typeof Audio === "undefined") return;
    try {
      narrAudio = new Audio();
      narrAudio.preload = "none";
      narrAudio.muted = true;
      var p = narrAudio.play();
      if (p && p.catch) p.catch(function () {});
      narrAudio.pause();
      narrAudio.muted = false;
    } catch (e) { narrAudio = null; }
  }

  function scheduleNarrHide(ms) {
    if (narrHideTimer) clearTimeout(narrHideTimer);
    narrHideTimer = setTimeout(function () { hideNarration(); }, ms);
  }

  function hideNarration() {
    if (narrHideTimer) { clearTimeout(narrHideTimer); narrHideTimer = null; }
    if (narrAudio) { try { narrAudio.pause(); } catch (e) { /* noop */ } }
    narrQueue = [];
    narrPlaying = false;
    state.narrSpotId = null;
    el["narrbar"].classList.add("hidden");
  }

  function renderNarrationText(sp, n) {
    el["nr-tag"].textContent = t("narrTag");
    el["nr-name"].textContent = spotName(sp);
    el["nr-text"].textContent = n.text;
  }

  function finishNarration(delayMs) {
    narrPlaying = false;
    state.narrSpotId = null;
    if (narrQueue.length && narrationEnabled() && !state.paused) {
      window.setTimeout(playNextNarration, delayMs || 700);
      return;
    }
    scheduleNarrHide(delayMs || 4000);
  }

  function startNarration(sp, n) {
    if (!n || state.paused) return;
    if (narrHideTimer) { clearTimeout(narrHideTimer); narrHideTimer = null; }
    narrPlaying = true;
    state.narrSpotId = sp.id;
    renderNarrationText(sp, n);
    el["narrbar"].classList.remove("hidden");
    track("live_narration_shown", { spot_id: sp.id, mode: state.mode, lang: state.lang });
    scheduleNarrHide(60000);
    var audioPath = narrationAudioPath(sp, n);
    if (!audioPath || typeof Audio === "undefined") {
      finishNarration(8000);
      return;
    }
    try {
      if (!narrAudio) narrAudio = new Audio();
      narrAudio.preload = "none";
      narrAudio.muted = false;
      narrAudio.src = audioPath;
      narrAudio.onended = function () { finishNarration(700); };
      narrAudio.onerror = function () { finishNarration(8000); };
      var p = narrAudio.play();
      if (p && p.catch) p.catch(function () { finishNarration(8000); });
    } catch (e) { /* noop */ }
  }

  function queueNarration(sp) {
    var key = narrationGroupKey(sp);
    if (state.narratedIds[key]) return;
    if (narrQueue.some(function (item) { return narrationGroupKey(item.sp) === key; })) return;
    if (narrQueue.length >= NARR_MAX_QUEUE) return;
    var n = narrationFor(sp);
    if (!n) return;
    state.narratedIds[key] = true;
    markNativeNarrated(key);
    narrQueue.push({ sp: sp });
  }

  function playNextNarration() {
    if (narrPlaying || state.paused || !narrationEnabled()) return;
    while (narrQueue.length) {
      var item = narrQueue.shift();
      var info = aheadInfo(item.sp);
      if (state.dir && info.dist < -2) continue;
      var n = narrationFor(item.sp);
      if (n) {
        startNarration(item.sp, n);
        return;
      }
    }
  }

  function warmNarrationAudio(candidates) {
    if (typeof Audio === "undefined" || !hasNarrationData()) return;
    var target = candidates.find(function (item) {
      return item.info.dist >= 0 && item.info.etaSec != null && item.info.etaSec <= NARR_WARMUP_SEC && narrationFor(item.sp);
    });
    if (!target) return;
    var path = narrationAudioPath(target.sp, narrationFor(target.sp));
    if (!path || path === narrWarmPath) return;
    try {
      if (!narrWarmAudio) narrWarmAudio = new Audio();
      narrWarmAudio.preload = "metadata";
      narrWarmAudio.src = path;
      narrWarmAudio.load();
      narrWarmPath = path;
    } catch (e) { /* noop */ }
  }

  function updateNarration(candidates) {
    if (!Array.isArray(candidates)) candidates = candidates ? [candidates] : [];
    if (nativeSessionStarted && document.visibilityState === "hidden") return;
    if (!narrationEnabled()) {
      if (state.narrSpotId) hideNarration();
      return;
    }
    if (state.paused || !state.dir || !candidates.length) return;
    if (!hasNarrationData()) {
      ensureNarrationsLoaded();
      return;
    }
    warmNarrationAudio(candidates);
    candidates.forEach(function (item) {
      if (!item || !item.info || item.info.etaSec == null) return;
      if (item.info.dist < -0.3 || item.info.etaSec > NARR_LEAD_SEC) return;
      queueNarration(item.sp);
    });
    playNextNarration();
  }

  function render() {
    var lightweight = document.visibilityState === "hidden";
    if (!lightweight) syncRunControls();
    var dispSpeed = state.demo ? state.speedKmh / state.demo.mult : state.speedKmh;
    if (!lightweight) {
      el["tb-speed"].textContent = state.mode === "idle" ? "--" : Math.round(dispSpeed);
      el["btn-dir"].textContent =
        state.dirMode === "down" ? t("dirDown") :
        state.dirMode === "up" ? t("dirUp") :
        state.dir > 0 ? t("dirDown") : state.dir < 0 ? t("dirUp") : t("dirAuto");
    }
    if (state.km == null) return;
    var seg = T.segmentAtKm(state.km);
    if (seg) {
      var nameOf = function (id) {
        var st = ((typeof ROUTE !== "undefined" && ROUTE.refStations) || (window.ROUTE && window.ROUTE.refStations) || []).find(function (s) { return s.id === id; });
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
          track("live_spot_passed", { spot_id: sp.id, mode: state.mode });
        }
        setMarkerClass(sp, "passed");
      } else if (info.dist >= -0.3) {
        ahead.push({ sp: sp, info: info });
      }
    });
    ahead.sort(function (a, b) { return a.info.dist - b.info.dist; });
    var next = ahead.length ? ahead[0] : null;
    // 次カードは方向確定(state.dir)後のみ表示する。方向未確定(発車直後・停車中)では
    // 次カードが出ないので、upcomingリストから先頭を省いてはいけない(最寄りが消えるバグ回避)。
    var hasNextCard = !!(next && state.dir);
    if (lightweight) {
      if (!state.paused) updateNarration(ahead.slice(0, 5));
      return;
    }
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
      el["nc-dur"].textContent = "";
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
    el["upcoming"].innerHTML = ahead.slice(hasNextCard ? 1 : 0, hasNextCard ? 6 : 5).map(function (a) {
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
    if (!state.paused) {
      updateAlert(next);
      updateNarration(ahead.slice(0, 5));
    }
  }

  function startGeoWatch() {
    state.watchId = navigator.geolocation.watchPosition(
      function (pos) {
        if (state.paused) return;
        handleFix(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.coords.speed, pos.timestamp);
      },
      function (err) {
        setStatus("err", err.code === 1 ? t("gpsDenied") : t("gpsError"));
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
    );
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
    state.paused = false;
    state.runStartedAt = Date.now();
    state.lastMapFollowAt = 0;
    document.body.classList.remove("is-idle");
    document.getElementById("idle-panel").classList.add("hidden");
    setStatus("warn", t("locating"));
    unlockAudio();
    if (narrationEnabled()) ensureNarrationsLoaded();
    track("live_gps_start", { lang: state.lang });
    beginGpsTracking();
  }

  function startDemo(dirStr, mult) {
    stopAll();
    state.mode = "demo";
    state.paused = false;
    state.runStartedAt = Date.now();
    state.lastMapFollowAt = 0;
    document.body.classList.remove("is-idle");
    document.getElementById("idle-panel").classList.add("hidden");
    unlockAudio();
    if (narrationEnabled()) ensureNarrationsLoaded();
    track("live_demo_start", { direction: dirStr, mult: mult });
    state.demo = {
      km: dirStr === "down" ? 0 : T.totalKm,
      dir: dirStr === "down" ? 1 : -1,
      mult: mult,
      lastT: Date.now(),
    };
    state.dir = state.demo.dir;
    state.dirAccum = state.demo.dir;
    state.suppressedDemoFirstSpotId = state.demo.dir > 0 ? spots[0].id : spots[spots.length - 1].id;
    setStatus("warn", t("demo") + " " + mult + "x");
    state.demoTimer = setInterval(demoTick, demoIntervalMs(mult));
    acquireWake();
    demoTick();
    syncRunControls();
  }

  function demoIntervalMs(mult) {
    if (mult <= 1) return 3000;
    if (mult <= 10) return 1500;
    return 700;
  }

  function demoTick() {
    if (state.paused) return;
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
    stopNativeGuide();
    if (state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
    if (state.demoTimer) {
      clearInterval(state.demoTimer);
      state.demoTimer = null;
    }
    state.demo = null;
    state.paused = false;
    state.mode = "idle";
    state.km = null;
    state.speedKmh = 0;
    state.dir = state.dirMode === "down" ? 1 : state.dirMode === "up" ? -1 : 0;
    state.dirAccum = 0;
    state.lastFix = null;
    state.passed = [];
    state.passedIds = {};
    state.alertedIds = {};
    state.narratedIds = {};
    state.runStartedAt = 0;
    state.lastMapFollowAt = 0;
    state.lastHiddenRenderAt = 0;
    state.suppressedDemoFirstSpotId = null;
    hideAlert();
    hideNarration();
    releaseWake();
    syncRunControls();
  }

  function pauseRun() {
    if (state.mode === "idle" || state.paused) return;
    stopNativeGuide();
    if (state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
    if (state.demoTimer) {
      clearInterval(state.demoTimer);
      state.demoTimer = null;
    }
    state.paused = true;
    hideAlert();
    hideNarration();
    releaseWake();
    setStatus("warn", t("paused"));
    track("live_paused", { mode: state.mode });
    syncRunControls();
  }

  function resumeRun() {
    if (state.mode === "idle" || !state.paused) return;
    state.paused = false;
    if (state.mode === "gps") {
      setStatus("warn", t("locating"));
      beginGpsTracking();
    } else if (state.mode === "demo" && state.demo) {
      state.demo.lastT = Date.now();
      state.demoTimer = setInterval(demoTick, demoIntervalMs(state.demo.mult));
      setStatus("warn", t("demo") + " " + state.demo.mult + "x");
      demoTick();
    }
    if (state.mode !== "gps") acquireWake();
    track("live_resumed", { mode: state.mode });
    syncRunControls();
  }

  function togglePause() {
    if (state.paused) resumeRun();
    else pauseRun();
  }

  function toggleNarration() {
    state.settings.narrMode =
      state.settings.narrMode === "featured" ? "all" :
      state.settings.narrMode === "all" ? "off" :
      "featured";
    if (!narrationEnabled()) hideNarration();
    else ensureNarrationsLoaded();
    saveSettings();
    updateNativeGuide();
    track("live_narration_toggled", { enabled: narrationEnabled() ? "1" : "0", mode: state.mode, guide_mode: state.settings.narrMode });
    syncRunControls();
  }

  function stopAndShowIdle() {
    stopAll();
    showIdle();
  }

  function showIdle() {
    document.body.classList.add("is-idle");
    document.getElementById("idle-panel").classList.remove("hidden");
    document.getElementById("next-card").classList.add("hidden");
    document.getElementById("upcoming").innerHTML = "";
    document.getElementById("passed-wrap").classList.add("hidden");
    document.getElementById("segband").classList.add("hidden");
    updateSightLine(null);
    spots.forEach(function (sp) { setMarkerClass(sp, ""); });
    setStatus("", t("waiting"));
    el["tb-speed"].textContent = "--";
    syncRunControls();
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
    if (document.visibilityState === "hidden") releaseWake();
    if (document.visibilityState === "visible" && state.mode !== "idle" && !state.paused) {
      acquireWake();
      syncNativeGuideState();
      render();
    }
  });

  setInterval(function () {
    if (state.mode !== "idle" && !state.paused && state.km != null && !state.offRoute) {
      if (document.visibilityState === "hidden") {
        var nowHidden = Date.now();
        if (state.lastHiddenRenderAt && nowHidden - state.lastHiddenRenderAt < 15000) return;
        state.lastHiddenRenderAt = nowHidden;
      }
      if (state.dir && state.speedKmh > 30 && state.lastFix) {
        var age = (Date.now() - state.lastFix.t) / 3600000;
        if (age > 0.0008 && age < 0.02 && state.mode === "gps") state.km += state.dir * state.speedKmh * 0.000278;
      }
      render();
    }
  }, 1000);

  function updateChromeLinks() {
    var links = state.lang === "en" ? {
      home: "../",
      journey: "../#journey",
      live: "./",
      zukan: "../zukan.html",
      faq: "../guide.html",
      memories: "../journal.html",
      lp: "../lp.html",
      mieru: "../mieru.html",
      sumie: "../sumie.html",
      somato: "../somato.html",
      references: "../references.html",
      privacy: "../privacy.html",
    } : {
      home: "../index.html",
      journey: "../start.html",
      live: "./",
      zukan: "../zukan.html",
      faq: "../guide.html",
      memories: "../journal.html",
      lp: "../lp.html",
      mieru: "../mieru.html",
      sumie: "../sumie.html",
      somato: "../somato.html",
      references: "../references.html",
      privacy: "../privacy.html",
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
    var _ab = document.getElementById("live-alpha-badge");
    if (_ab) { _ab.textContent = t("alphaBadge"); _ab.title = t("alphaNote"); }
    var _an = document.getElementById("idle-alpha-note"); if (_an) _an.textContent = t("alphaNote");
    var idleFeatures = document.getElementById("idle-features");
    if (idleFeatures) {
      idleFeatures.innerHTML = [t("idleFeature1"), t("idleFeature2"), t("idleFeature3")]
        .map(function (text) { return "<li>" + esc(text) + "</li>"; })
        .join("");
    }
    document.getElementById("btn-start").textContent = t("startGps");
    document.getElementById("btn-demo").textContent = t("startDemo");
    // 待機中は render() が回らず btn-dir が初期の日本語のまま残るため、ここでも合わせる
    var _bd = document.getElementById("btn-dir");
    if (_bd) {
      _bd.textContent =
        state.dirMode === "down" ? t("dirDown") :
        state.dirMode === "up" ? t("dirUp") :
        state.dir > 0 ? t("dirDown") : state.dir < 0 ? t("dirUp") : t("dirAuto");
      _bd.title = t("dirL");
    }
    document.querySelectorAll("[data-live-lang]").forEach(function (button) {
      var active = button.getAttribute("data-live-lang") === state.lang;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    syncRunControls();
    document.getElementById("set-title").textContent = t("settings");
    document.getElementById("set-vib-l").textContent = t("vibL");
    document.getElementById("set-wake-l").textContent = t("wakeL");
    document.getElementById("set-follow-l").textContent = t("followL");
    document.getElementById("set-narr-mode-l").textContent = t("narrModeL");
    document.getElementById("set-narr-help").textContent = tFmt("narrModeHelp", {
      featured: featuredNarrationCount,
      all: spots.length,
    });
    document.getElementById("set-dir-l").textContent = t("dirL");
    if (state.narrSpotId) {
      var narrSp = spots.find(function (s) { return s.id === state.narrSpotId; });
      var narrN = narrSp && narrationFor(narrSp);
      if (narrSp && narrN) renderNarrationText(narrSp, narrN);
    }
    var sd = document.getElementById("set-dir");
    sd.options[0].text = t("dirOptAuto");
    sd.options[1].text = t("dirOptDown");
    sd.options[2].text = t("dirOptUp");
    var nm = document.getElementById("set-narr-mode");
    nm.options[0].text = t("narrModeFeatured");
    nm.options[1].text = t("narrModeAll");
    nm.options[2].text = t("narrModeOff");
    document.getElementById("btn-stop").textContent = t("stop");
    document.getElementById("btn-close-settings").textContent = t("close");
    document.getElementById("set-note").textContent = t("note");
    var privacyLink = document.getElementById("set-privacy-link");
    if (privacyLink) privacyLink.textContent = t("privacy");
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
    updateNativeGuide();
    if (state.mode === "idle") setStatus("", t("waiting"));
    render();
  }

  document.querySelectorAll("[data-live-lang]").forEach(function (button) {
    button.addEventListener("click", function () {
      var nextLang = button.getAttribute("data-live-lang");
      if (nextLang === state.lang) return;
      try {
        localStorage.setItem("madoLive.lang", nextLang);
        localStorage.setItem("mado-lang", nextLang);
      } catch (error) {}
      location.href = nextLang === "en"
        ? new URL("../en/live/", document.baseURI).href
        : new URL("../../live/", document.baseURI).href;
    });
  });
  document.getElementById("btn-narr-toggle").addEventListener("click", toggleNarration);
  document.getElementById("btn-pause").addEventListener("click", togglePause);
  document.getElementById("map-narr-toggle").addEventListener("click", toggleNarration);
  document.getElementById("map-pause").addEventListener("click", togglePause);
  document.getElementById("map-stop").addEventListener("click", stopAndShowIdle);
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
    updateNativeGuide();
    render();
  });
  document.getElementById("btn-settings").addEventListener("click", function () {
    document.getElementById("set-vib").checked = state.settings.vib;
    document.getElementById("set-wake").checked = state.settings.wake;
    document.getElementById("set-follow").checked = state.settings.follow;
    document.getElementById("set-narr-mode").value = state.settings.narrMode;
    document.getElementById("set-dir").value = state.dirMode;
    document.getElementById("settings").classList.remove("hidden");
  });
  document.getElementById("btn-close-settings").addEventListener("click", function () {
    state.settings.vib = document.getElementById("set-vib").checked;
    state.settings.wake = document.getElementById("set-wake").checked;
    state.settings.follow = document.getElementById("set-follow").checked;
    state.settings.narrMode = document.getElementById("set-narr-mode").value;
    if (!narrationEnabled()) hideNarration();
    saveSettings();
    syncRunControls();
    state.dirMode = document.getElementById("set-dir").value;
    if (state.dirMode === "down") state.dir = 1;
    else if (state.dirMode === "up") state.dir = -1;
    else { state.dir = 0; state.dirAccum = 0; }
    document.getElementById("settings").classList.add("hidden");
    updateNativeGuide();
    render();
  });
  document.getElementById("btn-stop").addEventListener("click", function () {
    document.getElementById("settings").classList.add("hidden");
    stopAndShowIdle();
  });
  document.getElementById("al-close").addEventListener("click", function () {
    var id = state.alertSpotId;
    if (id) state.alertedIds[id] = true;
    hideAlert();
  });
  document.getElementById("nr-close").addEventListener("click", hideNarration);

  /* ---- GA4 計測（位置情報・緯度経度・km値は送らない） ---- */
  function track(eventName, params) {
    try {
      if (typeof window.gtag === "function") window.gtag("event", eventName, params || {});
    } catch (e) { /* noop */ }
  }

  // 2026-08-30: 導線を early-access.html 経由から Google Play 直リンクに変更したため、
  // イベントも early-access.html 側と同じ android_install_click に揃える。
  // それ以前のこのCTAは android_app_guide_click(cta_id=live_android) で記録されている。
  var androidGuide = document.querySelector("[data-android-app-guide]");
  if (androidGuide) {
    androidGuide.addEventListener("click", function () {
      track("android_install_click", {
        cta_id: "live_android",
        entry_source: "live",
        language: state.lang,
        page_context: "live",
      });
    });
  }

  createMap();
  applyLang();
  showIdle();
  track("live_view", { lang: state.lang });
})();
