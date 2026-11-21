/* Generated from scripts/shared/mieru-runtime.js and mieru-copy.mjs. */
var MADO_MIERU_COPY={"ja":{"visible":"見える","probable":"たぶん見える","chance":"運しだい","unlikely":"厳しい","mid":"中層の雲","low":"低い雲","high":"高い雲","cloud":"山頂が{0}に隠れがちです (雲量 低{1}% 中{2}% 高{3}%)","haze":"靄で視程が足りません (視程 約{0}km / 湿度{1}%)","clear":"山頂まわりは晴れ、空気も澄んでいます (視程 約{0}km)","balanced":"条件は五分五分です","error":"気象データの取得に失敗しました。時間をおいて再読み込みしてください。","around":"{0} {1}頃","train":"この列車での見えかた ─ ","meta":"{0} ・ 東京から約{1}分 ・ 視距離 約{2}km ・ {3}席","best":"{0}のベスト {1}","today":"今日","tomorrow":"明日","bar":"{0} {1}","forecastDate":"予報対象日 {0}（日本時間・JST）","retrievedAt":"気象データ取得 {0} {1} JST。再読み込みすると予報を取得し直します。","forecastError":"気象データを取得できなかったため、予報を表示できません。時間をおいて再読み込みしてください。","nozomi":"のぞみ","hikari":"ひかり","kodama":"こだま","departure":"{0} 発 → {1}","loadingTrains":"時刻表を読み込み中…","trainError":"列車データを読み込めませんでした。「時刻を入力」から目安時刻でお試しください。","searchHint":"「列車をさがす」を押すと、この時刻以降の列車候補を表示します。","noTrains":"この乗車駅・方向・時刻で列車が見つかりませんでした。時刻や乗車駅を変えてみてください。","noSpots":"この乗車駅・方向では対象スポットがありません。乗車駅や方向を変えてみてください。","chooseTrain":"列車を選ぶと、この列車での見えかたが分かります。","noClock":"選んだ乗車駅からは、この列車で通過時刻を計算できませんでした。","audio":"音声は現在英語でご案内します。"},"en":{"visible":"Visible","probable":"Probably visible","chance":"A chance","unlikely":"Unlikely","mid":"mid-level cloud","low":"low cloud","high":"high cloud","cloud":"The summit is likely to be obscured by {0} (cloud cover: low {1}%, mid {2}%, high {3}%).","haze":"Haze is limiting the view (visibility about {0} km; humidity {1}%).","clear":"The summit is mostly clear and the air is transparent (visibility about {0} km).","balanced":"Conditions are finely balanced.","error":"Weather data could not be loaded. Please try again in a little while.","around":"{0} around {1}","train":"Forecast for this train: ","meta":"{0} · about {1} min from Tokyo · viewing distance about {2} km · Seat {3}","best":"Best {0}: {1}","today":"today","tomorrow":"tomorrow","bar":"{0} {1}","forecastDate":"Forecast for {0} · 06:00–19:00 Japan time (JST, UTC+9).","retrievedAt":"Weather data retrieved {0}, {1} JST. Reload to retrieve the forecast again.","forecastError":"Weather data could not be loaded. No forecast is available. Please reload to try again.","nozomi":"Nozomi","hikari":"Hikari","kodama":"Kodama","departure":"{0} depart → {1}","loadingTrains":"Loading the timetable…","trainError":"Train data could not be loaded. Choose “Enter a time” to use an approximate departure time.","searchHint":"Select “Find trains” to see departures after this time.","noTrains":"No trains found for this station, direction and time. Try a different time or boarding station.","noSpots":"There are no Mt. Fuji viewpoints ahead from this station in this direction. Try a different station or direction.","chooseTrain":"Choose a train to check the forecast at its passing times.","noClock":"Passing times could not be calculated for this train from the selected station.","audio":"Audio is currently available in English."}};
(function(){
  "use strict";
  var lang = document.documentElement.lang || "ja";
  var U = window.MADO_UTILITY_LOCALE;
  var C = Object.assign({}, MADO_MIERU_COPY[lang] || MADO_MIERU_COPY.en, U && U.forecast);
  function format(key){ var args = Array.prototype.slice.call(arguments, 1); return C[key].replace(/\{(\d+)\}/g, function(_, i){ return args[Number(i)]; }); }
  var SP = (typeof SPOTS !== "undefined" && SPOTS) || window.SPOTS || [];
  var RT = (typeof ROUTE !== "undefined" && ROUTE) || window.ROUTE || null;
  var MTS = window.MADO_TRAIN_SELECT || null;
  var SUMMIT = [35.3606, 138.7274];
  var FUJI_IDS = ["ota-fuji", "sagami-fuji", "fuji", "left-fuji", "hamanako-fuji"];
  var H0 = 6, H1 = 19;
  var forecastContext = document.getElementById('mieruForecastContext');
  var forecastDates = [];
  var displayLocale = lang === 'en' ? 'en-GB' : lang;
  var dateFormat = new Intl.DateTimeFormat(displayLocale, { timeZone: 'Asia/Tokyo', day: 'numeric', month: 'long', year: 'numeric' });
  var timeFormat = new Intl.DateTimeFormat(displayLocale, { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function forecastDateLabel(day){
    return dateFormat.format(new Date(forecastDates[day] + 'T00:00:00+09:00'));
  }
  function validateForecastDates(res){
    var times = res[0].hourly && res[0].hourly.time;
    if (!Array.isArray(times) || times.length < 48 || !/^\d{4}-\d{2}-\d{2}T00:00$/.test(times[0])) throw Error('Missing forecast dates');
    var start = Date.parse(times[0] + '+09:00');
    if (!Number.isFinite(start)) throw Error('Invalid forecast date');
    var fields = ['cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high', 'visibility', 'relative_humidity_2m', 'precipitation'];
    res.forEach(function(point){
      var hourly = point.hourly;
      if (!hourly || !Array.isArray(hourly.time)) throw Error('Missing hourly data');
      for (var i = 0; i < 48; i++) {
        var expected = new Date(start + i * 3600000 + 9 * 3600000).toISOString().slice(0, 16);
        if (hourly.time[i] !== expected) throw Error('Mismatched forecast hours');
        fields.forEach(function(field){
          if (!Array.isArray(hourly[field]) || !Number.isFinite(hourly[field][i])) throw Error('Incomplete weather data');
        });
      }
    });
    forecastDates = [times[0].slice(0, 10), times[24].slice(0, 10)];
  }
  function hav(a, b){
    var R = 6371, dLa = (b[0]-a[0])*Math.PI/180, dLo = (b[1]-a[1])*Math.PI/180;
    var x = Math.sin(dLa/2)*Math.sin(dLa/2) +
            Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLo/2)*Math.sin(dLo/2);
    return Math.round(R*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x)));
  }
  // 台帳(data.js)から富士山系スポットを組み立てる — 台帳更新に自動追従
  var SPOTS_M = [];
  FUJI_IDS.forEach(function(id){
    var s = SP.find(function(x){ return x.id === id; });
    if (!s) return;
    var vp = s.viewpoint || s.map;
    if (!vp || s.minutesFromTokyo == null) return;
    SPOTS_M.push({ id: id, name: (s[lang] && s[lang].name) || (s.en && s.en.name) || id, area: (s[lang] && s[lang].area) || (s.en && s.en.area) || "",
      min: s.minutesFromTokyo, d: hav([vp.lat, vp.lng], SUMMIT),
      vp: [vp.lat, vp.lng], side: s.side || "E" });
  });

  /* ---- 実ダイヤ対応 ----
     data/timetable.js（実時刻表）と data.js の ROUTE.refStations（駅ごとの東京からの目安分数）を
     使って「どの列車に乗るか」から各スポットの実通過時刻を出す。
     tokaidoStops/interpolateSpot/trainCandidates の本体は train-select.js
     (window.MADO_TRAIN_SELECT) に一本化し、app.js と共有している（2026-08-17）。 */
  var REFMIN = {};
  RT.refStations.forEach(function(s){ REFMIN[s.id] = s.min; });

  function clockStr(minutes) {
    var time = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return String(Math.floor(time / 60)).padStart(2, "0") + ":" + String(time % 60).padStart(2, "0");
  }

  function aheadSpots(dir, board){
    var b = REFMIN[board] != null ? REFMIN[board] : 0;
    return SPOTS_M.filter(function(s){ return dir === "west" ? s.min >= b : s.min <= b; })
      .slice()
      .sort(function(x, y){ return dir === "west" ? x.min - y.min : y.min - x.min; });
  }
  function trainSpotClockFn(train, board){
    var all = MTS.tokaidoStops(RT, train);
    var bi = all.findIndex(function(s){ return s.id === board; });
    if (bi < 0) return null;
    var stops = all.slice(bi);
    return function(ref){ return MTS.interpolateSpot(ref, stops); };
  }
  function manualSpotClockFn(dir, board, depMin){
    var b = REFMIN[board] != null ? REFMIN[board] : 0;
    var sign = dir === "west" ? 1 : -1;
    return function(ref){
      if ((ref - b) * sign < 0) return null;
      return depMin + Math.abs(ref - b);
    };
  }

  function estVis(rh){ return Math.max(4, 140 * Math.pow(1 - rh/100, 1.5)); }
  function effDist(d, rh){ return d * (0.32 + 0.5 * Math.pow(rh/100, 2)); }
  function prob(su, vp, h, d){
    var lo = su.cloud_cover_low[h]||0, mi = su.cloud_cover_mid[h]||0, hi = su.cloud_cover_high[h]||0;
    var pSummit = Math.max(0, 1 - Math.max(lo*0.6, mi*0.9, hi*0.3)/100);
    var rh = vp.relative_humidity_2m[h]||70;
    var V = vp.visibility ? vp.visibility[h] : null;
    V = V ? V/1000 : null;
    if (V == null || V >= 23) V = Math.max(V||0, estVis(rh));
    var pAir = 1/(1 + Math.exp(-6*(V/effDist(d, rh) - 0.72)));
    if ((su.precipitation[h]||0) > 0.2 || (vp.precipitation[h]||0) > 0.2) pSummit = 0;
    return { p: pSummit*pAir, pSummit: pSummit, pAir: pAir, V: V, rh: rh, lo: lo, mi: mi, hi: hi };
  }
  function omAll(){
    var points = [SUMMIT].concat(SPOTS_M.map(function(s){ return s.vp; }));
    var lat = points.map(function(p){ return p[0]; }).join(",");
    var lng = points.map(function(p){ return p[1]; }).join(",");
    var vars = "cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,relative_humidity_2m,precipitation";
    return fetch("https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lng+
      "&hourly="+vars+"&forecast_days=2&timezone=Asia%2FTokyo").then(function(r){
        if (!r.ok) throw new Error("Open-Meteo HTTP " + r.status);
        return r.json();
      }).then(function(data){
        if (!Array.isArray(data) || data.length !== points.length) throw new Error("Unexpected Open-Meteo response");
        return data;
      });
  }
  function col(p){
    if (p < 0.15) return "rgba(76,90,107,.18)";
    if (p < 0.4)  return "rgba(125,155,192,.55)";   /* --fuji */
    if (p < 0.6)  return "rgba(217,164,64,.75)";    /* --gold */
    if (p < 0.8)  return "rgba(232,112,74,.8)";     /* --accent */
    return "#e8704a";
  }
  function verdictText(p){
    return p >= 0.8 ? C.visible : p >= 0.55 ? C.probable : p >= 0.3 ? C.chance : C.unlikely;
  }
  var DATA = { summit: null, vps: {} };
  var q = new URLSearchParams(location.search);
  var board = q.get("board");
  var dir = q.get("dir") === "east" ? "east" : "west";
  var requestedTrain = /^([A-Za-z]+)-(\d+)$/.exec(q.get("train") || "");
  var requestedTime = q.get("dep");
  var STATE = {
    mode: q.get("mode") === "time" && !requestedTrain ? "time" : "train",
    dir: dir,
    board: Object.hasOwn(REFMIN, board) ? board : dir === "east" ? "Shin-Osaka" : "Tokyo",
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(requestedTime || "") ? requestedTime : "09:00",
    day: q.get("day") === "1" ? 1 : 0,
    selectedTrain: null
  };
  window.__mieru = { data: DATA, spots: SPOTS_M, results: {}, state: STATE };
  var ride = document.getElementById("ride");
  var pickerHost = document.getElementById("forecast-picker");
  var rideOut = document.getElementById("mieruRide");
  var pickerStatus = document.getElementById("picker-status");
  var assetRoot = new URL("./", document.querySelector('script[src*="mieru.js"]').src);
  var trainMode = document.getElementById("mieruModeTrain");
  var timeMode = document.getElementById("mieruModeTime");
  var dateButtons = document.querySelectorAll("[data-day]");
  var picker, pickerLoading;
  var lastDrawnDay;

  function loadScript(path) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.src = new URL(path, assetRoot).href;
      script.onload = resolve;
      script.onerror = function() { script.remove(); reject(Error(path)); };
      document.head.appendChild(script);
    });
  }

  async function loadTimetable() {
    if (!window.SHINKANSEN_TIMETABLE) await loadScript("data/timetable.js?v=e093fb33");
    var timetable = window.SHINKANSEN_TIMETABLE;
    if (!timetable || !Array.isArray(timetable.trains)) throw Error("Missing timetable");
    return timetable;
  }

  function updateJourney(journey) {
    STATE.board = journey.boardId;
    STATE.dir = journey.direction;
    STATE.time = journey.time;
  }

  function mountPicker(timetable) {
    picker = window.MADO_TRAIN_PICKER.mount(pickerHost, {
      route: RT, timetable: timetable, lang: lang, direction: STATE.dir, boardId: STATE.board, time: STATE.time,
      includeTerminal: true,
      onChange: function(journey) {
        updateJourney(journey);
        STATE.selectedTrain = null;
        picker.markActive(null);
        renderRide();
      },
      onSelect: function(selection, journey) {
        updateJourney(journey);
        STATE.selectedTrain = selection;
        renderRide();
      }
    });
    if (timetable && requestedTrain) {
      var found = picker.findCandidate(STATE.dir, STATE.board, requestedTrain[1], Number(requestedTrain[2]))
        || picker.findCandidate(STATE.dir, STATE.board, requestedTrain[1], requestedTrain[2]);
      if (found) {
        STATE.selectedTrain = picker.showTrain(STATE.dir, STATE.board, found.tr);
        STATE.time = clockStr(found.dep);
      }
    }
    if (!timetable) {
      STATE.mode = "time";
      trainMode.disabled = true;
      pickerStatus.textContent = C.trainError;
    } else pickerStatus.textContent = "";
    setMode(STATE.mode);
  }

  function openPicker() {
    if (!ride.open || picker || pickerLoading) return;
    pickerStatus.textContent = C.loadingTrains;
    var script = window.MADO_TRAIN_PICKER ? Promise.resolve() : loadScript("train-picker.js?v=bc6aa299");
    pickerLoading = Promise.all([script, loadTimetable().catch(function() { return null; })])
      .then(function(loaded) { mountPicker(loaded[1]); })
      .catch(function() {
        pickerStatus.textContent = C.trainError;
        pickerLoading = null;
      });
  }

  function setMode(mode) {
    STATE.mode = mode;
    trainMode.setAttribute("aria-pressed", String(mode === "train"));
    timeMode.setAttribute("aria-pressed", String(mode === "time"));
    pickerHost.classList.toggle("manual", mode === "time");
    renderRide();
  }

  window.madoMieruPageHref = function(edition) {
    var url = new URL((edition === "ja" ? "" : edition + "/") + "mieru.html", assetRoot);
    url.search = location.search;
    url.hash = location.hash;
    if (ride.open && !url.hash) url.hash = "ride";
    url.searchParams.set("board", STATE.board);
    url.searchParams.set("dir", STATE.dir);
    url.searchParams.set("day", String(STATE.day));
    url.searchParams.set("mode", STATE.mode);
    url.searchParams.set("dep", STATE.time);
    if (STATE.mode === "train" && STATE.selectedTrain) url.searchParams.set("train", STATE.selectedTrain.tr.type + "-" + STATE.selectedTrain.tr.number);
    else url.searchParams.delete("train");
    if (edition === "ja" || url.searchParams.has("lang")) url.searchParams.set("lang", edition);
    return url.href;
  };

  function renderRide() {
    rideOut.replaceChildren();
    window.__mieru.results = {};
    if (!DATA.summit || !picker) return;
    var spots = aheadSpots(STATE.dir, STATE.board);
    if (!spots.length) { rideOut.textContent = C.noSpots; return; }
    var clockFn;
    if (STATE.mode === "train") {
      if (STATE.selectedTrain) clockFn = trainSpotClockFn(STATE.selectedTrain.tr, STATE.board);
      else { rideOut.textContent = C.chooseTrain; return; }
    } else {
      var min = picker.departMin;
      if (!Number.isFinite(min)) return;
      clockFn = manualSpotClockFn(STATE.dir, STATE.board, min);
    }
    if (!clockFn) { rideOut.textContent = C.noClock; return; }
    var list = document.createElement("ul");
    spots.forEach(function(spot) {
      var t = clockFn(spot.min);
      if (t == null) return;
      var hour = Math.min(23, Math.max(0, Math.round(t / 60)));
      var result = prob(DATA.summit, DATA.vps[spot.id], STATE.day * 24 + hour, spot.d);
      window.__mieru.results[spot.id] = result;
      var item = document.createElement("li");
      var label = document.createElement("span");
      label.textContent = format("around", spot.name, clockStr(t));
      var chance = document.createElement("b");
      chance.textContent = Math.round(result.p * 100) + "%";
      item.append(label, chance, " · " + verdictText(result.p));
      list.append(item);
    });
    if (!list.childElementCount) { rideOut.textContent = C.noClock; return; }
    var header = document.createElement("p");
    header.textContent = format("forecastDate", forecastDateLabel(STATE.day));
    rideOut.append(header, list);
  }

  function chanceAt(spot, hour) {
    return prob(DATA.summit, DATA.vps[spot.id], STATE.day * 24 + hour, spot.d).p;
  }

  function renderCharts() {
    if (!DATA.summit || lastDrawnDay === STATE.day) return;
    lastDrawnDay = STATE.day;
    var dateLabel = forecastDateLabel(STATE.day);
    document.getElementById("mieruForecastDate").textContent = dateLabel + " (JST)";
    var shinFuji = SPOTS_M.find(function(spot) { return spot.id === "fuji"; });
    document.querySelectorAll("#weather-periods [data-hour]").forEach(function(value) {
      value.textContent = Math.round(chanceAt(shinFuji, Number(value.dataset.hour)) * 100);
    });
    dateButtons.forEach(function(button) {
      var index = Number(button.dataset.day);
      button.textContent = forecastDateLabel(index);
      button.setAttribute("aria-pressed", String(index === STATE.day));
      button.parentElement.hidden = false;
    });
    SPOTS_M.forEach(function(spot) {
      var card = document.getElementById("hour-" + spot.id);
      var date = card.querySelector(".region-chart-date");
      date.textContent = dateLabel;
      date.hidden = false;
      var chart = card.querySelector(".region-hours");
      var bars = document.createDocumentFragment();
      for (var hour = H0; hour <= H1; hour++) {
        var chance = chanceAt(spot, hour);
        var cell = document.createElement("div");
        var time = document.createElement("dt");
        time.textContent = clockStr(hour * 60);
        var value = document.createElement("dd");
        value.textContent = Math.round(chance * 100) + "%";
        value.style.setProperty("--score", chance * 100 + "%");
        value.style.setProperty("--bar-color", col(chance));
        cell.append(time, value);
        bars.append(cell);
      }
      chart.replaceChildren(bars);
    });
  }

  dateButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      STATE.day = Number(button.dataset.day);
      renderCharts();
      renderRide();
    });
  });
  trainMode.addEventListener("click", function() { setMode("train"); openPicker(); });
  timeMode.addEventListener("click", function() { setMode("time"); openPicker(); });
  ride.addEventListener("toggle", openPicker);
  if (location.hash === "#ride" || requestedTrain || q.has("board") || STATE.mode === "time") ride.open = true;
  setMode(STATE.mode);
  openPicker();

  var status = document.getElementById("mieruStatus");
  omAll().then(function(response) {
    validateForecastDates(response);
    DATA.summit = response[0].hourly;
    SPOTS_M.forEach(function(spot, index) { DATA.vps[spot.id] = response[index + 1].hourly; });
    var retrieved = document.getElementById("mieruRetrievedAt");
    var now = new Date();
    retrieved.textContent = format("retrievedAt", dateFormat.format(now), timeFormat.format(now));
    retrieved.hidden = false;
    forecastContext.hidden = false;
    status.hidden = true;
    renderCharts();
    renderRide();
  }).catch(function() {
    DATA.summit = null;
    window.__mieru.results = {};
    forecastContext.hidden = true;
    document.getElementById("mieruRetrievedAt").hidden = true;
    dateButtons.forEach(function(button) { button.parentElement.hidden = true; });
    document.querySelectorAll(".region-hours").forEach(function(chart) { chart.replaceChildren(); });
    document.querySelectorAll(".region-chart-date").forEach(function(date) { date.hidden = true; });
    rideOut.replaceChildren();
    status.hidden = false;
    status.textContent = C.forecastError;
  });
})();
