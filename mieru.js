/* Generated from scripts/shared/mieru-runtime.js and mieru-copy.mjs. */
var MADO_MIERU_COPY={"ja":{"visible":"見える","probable":"たぶん見える","chance":"運しだい","unlikely":"厳しい","mid":"中層の雲","low":"低い雲","high":"高い雲","cloud":"山頂が{0}に隠れがちです (雲量 低{1}% 中{2}% 高{3}%)","haze":"靄で視程が足りません (視程 約{0}km / 湿度{1}%)","clear":"山頂まわりは晴れ、空気も澄んでいます (視程 約{0}km)","balanced":"条件は五分五分です","error":"気象データの取得に失敗しました。時間をおいて再読み込みしてください。","around":"{0} {1}頃","train":"この列車での見えかた ─ ","meta":"{0} ・ 東京から約{1}分 ・ 視距離 約{2}km ・ {3}席","best":"{0}のベスト {1}","today":"今日","tomorrow":"明日","bar":"{0} {1}","nozomi":"のぞみ","hikari":"ひかり","kodama":"こだま","departure":"{0} 発 → {1}","loadingTrains":"時刻表を読み込み中…","trainError":"列車データを読み込めませんでした。「時刻を入力」から目安時刻でお試しください。","searchHint":"「列車をさがす」を押すと、この時刻以降の列車候補を表示します。","noTrains":"この乗車駅・方向・時刻で列車が見つかりませんでした。時刻や乗車駅を変えてみてください。","noSpots":"この乗車駅・方向では対象スポットがありません。乗車駅や方向を変えてみてください。","chooseTrain":"列車を選ぶと、この列車での見えかたが分かります。","noClock":"選んだ乗車駅からは、この列車で通過時刻を計算できませんでした。","audio":"音声は現在英語でご案内します。"},"en":{"visible":"Visible","probable":"Probably visible","chance":"A chance","unlikely":"Unlikely","mid":"mid-level cloud","low":"low cloud","high":"high cloud","cloud":"The summit is likely to be obscured by {0} (cloud cover: low {1}%, mid {2}%, high {3}%).","haze":"Haze is limiting the view (visibility about {0} km; humidity {1}%).","clear":"The summit is mostly clear and the air is transparent (visibility about {0} km).","balanced":"Conditions are finely balanced.","error":"Weather data could not be loaded. Please try again in a little while.","around":"{0} around {1}","train":"Forecast for this train: ","meta":"{0} · about {1} min from Tokyo · viewing distance about {2} km · Seat {3}","best":"Best {0}: {1}","today":"today","tomorrow":"tomorrow","bar":"{0} {1}","nozomi":"Nozomi","hikari":"Hikari","kodama":"Kodama","departure":"{0} depart → {1}","loadingTrains":"Loading the timetable…","trainError":"Train data could not be loaded. Choose “Enter a time” to use an approximate departure time.","searchHint":"Select “Find trains” to see departures after this time.","noTrains":"No trains found for this station, direction and time. Try a different time or boarding station.","noSpots":"There are no Mt. Fuji viewpoints ahead from this station in this direction. Try a different station or direction.","chooseTrain":"Choose a train to check the forecast at its passing times.","noClock":"Passing times could not be calculated for this train from the selected station.","audio":"Audio is currently available in English."}};
(function(){
  "use strict";
  var lang = document.documentElement.lang || "ja";
  var U = window.MADO_UTILITY_LOCALE;
  var C = U ? U.forecast : MADO_MIERU_COPY[lang] || MADO_MIERU_COPY.en;
  function format(key){ var args = Array.prototype.slice.call(arguments, 1); return C[key].replace(/\{(\d+)\}/g, function(_, i){ return args[Number(i)]; }); }
  var SP = (typeof SPOTS !== "undefined" && SPOTS) || window.SPOTS || [];
  var RT = (typeof ROUTE !== "undefined" && ROUTE) || window.ROUTE || null;
  var MTS = window.MADO_TRAIN_SELECT || null;
  // data/timetable.js（約300KB）は遅延読み込み。読み込まれるまで TT は null。
  // 読み込み状態は ensureTimetableLoaded() が管理する。
  var TT = null;
  var SUMMIT = [35.3606, 138.7274];
  var FUJI_IDS = ["ota-fuji", "sagami-fuji", "fuji", "left-fuji", "hamanako-fuji"];
  var H0 = 6, H1 = 19;
  var forecastContext = lang === 'en' ? document.getElementById('mieruForecastContext') : null;
  var retrievedAt = null;
  var forecastDates = [];
  var forecastError = 'Weather data could not be loaded. No forecast is available. Please reload to try again.';
  var dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', day: 'numeric', month: 'long', year: 'numeric' });
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
  function renderForecastContext(day){
    if (!forecastContext || !retrievedAt) return;
    document.getElementById('mieruForecastDate').textContent = 'Forecast for ' + forecastDateLabel(day) + ' · 06:00–19:00 Japan time (JST, UTC+9).';
    document.getElementById('mieruRetrievedAt').textContent = 'Weather data retrieved ' + dateFormat.format(retrievedAt) + ', ' + new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(retrievedAt) + ' JST. Reload to retrieve the forecast again.';
    // Absolute dates remain accurate when a visitor leaves the page open overnight.
    Array.prototype.forEach.call(document.getElementById('mieruDay').options, function(option){ option.textContent = forecastDateLabel(Number(option.value)); });
    forecastContext.hidden = false;
  }
  var TRAIN_NAMES = { Nozomi: C.nozomi, Hikari: C.hikari, Kodama: C.kodama };

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
  var REFMIN = {}, REFJA = {}, TTJA = {};
  if (RT) RT.refStations.forEach(function(s){ REFMIN[s.id] = s.min; REFJA[s.id] = s[lang] || s.en || s.ja; });

  function toMin(hhmm){ var p = String(hhmm).split(":"); return (+p[0])*60 + (+p[1]); }
  function clockStr(t){
    var tt = ((Math.round(t) % 1440) + 1440) % 1440;
    return ("0"+Math.floor(tt/60)).slice(-2) + ":" + ("0"+(tt%60)).slice(-2);
  }
  function tokaidoStops(train){
    if (!RT || !MTS) return [];
    return MTS.tokaidoStops(RT, train);
  }
  function interpolateSpot(spotRef, stops){
    return MTS.interpolateSpot(spotRef, stops);
  }
  function trainCandidates(dir, board){
    if (!TT || !MTS) return [];
    return MTS.trainCandidates(TT, RT, dir, board);
  }
  function trainLabel(tr){ return (TRAIN_NAMES[tr.type] || tr.type) + (lang === "ja" ? "" : " ") + tr.number; }
  function stationLabel(id){ return REFJA[id] || TTJA[id] || id; }

  function aheadSpots(dir, board){
    var b = REFMIN[board] != null ? REFMIN[board] : 0;
    return SPOTS_M.filter(function(s){ return dir === "west" ? s.min >= b : s.min <= b; })
      .slice()
      .sort(function(x, y){ return dir === "west" ? x.min - y.min : y.min - x.min; });
  }
  function trainSpotClockFn(train, board){
    var all = tokaidoStops(train);
    var bi = all.findIndex(function(s){ return s.id === board; });
    if (bi < 0) return null;
    var stops = all.slice(bi);
    return function(ref){ return interpolateSpot(ref, stops); };
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
  function reason(r){
    if (!r) return "";
    if (r.pSummit < 0.4){
      var c = r.mi >= r.lo && r.mi >= r.hi ? C.mid : (r.lo >= r.hi ? C.low : C.high);
      return format("cloud", c, Math.round(r.lo), Math.round(r.mi), Math.round(r.hi));
    }
    if (r.pAir < 0.4) return format("haze", Math.round(r.V), Math.round(r.rh));
    if (r.p >= 0.55) return format("clear", Math.round(r.V));
    return C.balanced;
  }

  var DATA = { summit: null, vps: {} };
  var STATE = { mode: "train", dir: "west", board: "Tokyo", selectedTrain: null };
  window.__mieru = { data: DATA, spots: SPOTS_M, results: {}, state: STATE };

  /* ---- 時刻表の遅延読み込み ----
     data/timetable.js は約300KB（mieru.html本体の約9倍）あり、検索からの初回訪問は
     index.html を経由しないためキャッシュが効かない。静的本文とOpen-Meteoの確率表示は
     時刻表なしで成立するため、列車モードを利用者が実際に使う時点（「列車をさがす」操作、
     または ?train= 付きURLでの着地）まで読み込みを遅らせる。 */
  var timetableLoading = false;
  var timetableLoadFailed = false;
  var timetableLoadPromise = null;
  function ensureTimetableLoaded(){
    if (TT) return Promise.resolve(TT);
    if (timetableLoadPromise) return timetableLoadPromise;
    timetableLoading = true;
    timetableLoadFailed = false;
    renderTrainResults(); // 「読み込み中」表示
    timetableLoadPromise = new Promise(function(resolve){
      var s = document.createElement("script");
      s.src = new URL("data/timetable.js?v=89e78630", document.querySelector('script[src*="mieru.js"]').src).href;
      s.onload = function(){
        timetableLoading = false;
        TT = window.SHINKANSEN_TIMETABLE || null;
        if (TT && Array.isArray(TT.stations)) TT.stations.forEach(function(st){ TTJA[st.id] = lang === "ja" ? st.ja : (U ? U.stationName(st.en || st.id) : st.en || st.id); });
        if (!TT){
          // スクリプトは読み込めたが期待した形のデータが無い → 失敗扱いで静かにフォールバック
          timetableLoadFailed = true;
          setMode("time");
        }
        resolve(TT);
      };
      s.onerror = function(){
        timetableLoading = false;
        timetableLoadFailed = true;
        TT = null;
        setMode("time"); // 読み込み失敗時は時刻手入力モードへ静かにフォールバック
        resolve(null);
      };
      document.head.appendChild(s);
    });
    return timetableLoadPromise;
  }

  /* ---- URL引き継ぎ ----
     ?board=<駅ID>&dir=west|east&train=<Type>-<number>&dep=HH:MM&day=0|1 を受け取り初期化する。
     別ページの列車選択を引き継ぐ本線の仕組み（app.js側でlocalStorageに永続化予定、実装中のため
     ここでは未参照）とは接続していないが、駅IDはROUTE.refStations基準・列車表記は
     "Type-number"（例: Nozomi-5）でapp.jsのtrack("train_selected", ...)が既に送っている
     train_type/train_numberと同じ語彙なので、app.js側の永続化が固まった後にそのキーを
     読み替えてこの関数に渡す形で無理なく接続できるはず。
     ?train= が付いている場合だけ、時刻表を即座に読み込んで列車を復元する。 */
  function applyUrlParams(){
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return; }
    var board = q.get("board");
    if (board && REFMIN[board] != null) STATE.board = board;
    var dir = q.get("dir");
    if (dir === "west" || dir === "east") STATE.dir = dir;
    var day = q.get("day");
    if ((day === "0" || day === "1") && document.getElementById("mieruDay")) document.getElementById("mieruDay").value = day;
    var dep = q.get("dep");
    if (dep && /^\d{1,2}:\d{2}$/.test(dep)){
      document.getElementById("mieruDep").value = dep;
      document.getElementById("mieruTrainFrom").value = dep;
    }
    if (q.get("mode") === "time") STATE.mode = "time";
    var trainParam = q.get("train");
    if (trainParam){
      var m = /^([A-Za-z]+)-(\d+)$/.exec(trainParam);
      if (m){
        ensureTimetableLoaded().then(function(tt){
          if (!tt) return; // 失敗時はensureTimetableLoaded内で既に時刻手入力モードへフォールバック済み
          var found = trainCandidates(STATE.dir, STATE.board).find(function(x){
            return x.tr.type === m[1] && String(x.tr.number) === m[2];
          });
          if (found){
            STATE.selectedTrain = found;
            STATE.mode = "train";
            setMode("train");
            renderTrainResults();
            render();
          }
        });
      }
    }
  }

  // Carry the currently selected forecast journey through the language menu.
  window.madoMieruPageHref = function(edition){
    var assetRoot = new URL("./", document.querySelector('script[src*="mieru.js"]').src);
    var url = new URL((edition === "ja" ? "" : edition + "/") + "mieru.html", assetRoot);
    url.search = location.search;
    url.hash = location.hash;
    url.searchParams.set("board", STATE.board);
    url.searchParams.set("dir", STATE.dir);
    url.searchParams.set("day", document.getElementById("mieruDay").value);
    url.searchParams.set("mode", STATE.mode);
    url.searchParams.set("dep", document.getElementById(STATE.mode === "time" ? "mieruDep" : "mieruTrainFrom").value);
    if (STATE.mode === "train" && STATE.selectedTrain) url.searchParams.set("train", STATE.selectedTrain.tr.type + "-" + STATE.selectedTrain.tr.number);
    else url.searchParams.delete("train");
    if (edition === "ja" || url.searchParams.has("lang")) url.searchParams.set("lang", edition);
    return url.href;
  };

  function setMode(mode){
    STATE.mode = mode;
    var bt = document.getElementById("mieruModeTrain"), tt = document.getElementById("mieruModeTime");
    bt.classList.toggle("is-active", mode === "train");
    bt.setAttribute("aria-pressed", mode === "train" ? "true" : "false");
    tt.classList.toggle("is-active", mode === "time");
    tt.setAttribute("aria-pressed", mode === "time" ? "true" : "false");
    document.getElementById("mieruTrainBlock").hidden = mode !== "train";
    document.getElementById("mieruTimeBlock").hidden = mode !== "time";
  }

  function renderBoardOptions(){
    if (!RT) return;
    var sel = document.getElementById("mieruBoard");
    sel.innerHTML = RT.refStations.map(function(s){
      return '<option value="' + s.id + '"' + (s.id === STATE.board ? " selected" : "") + '>' + stationLabel(s.id) + '</option>';
    }).join("");
  }

  function renderTrainResults(){
    var box = document.getElementById("mieruTrainResults");
    if (!TT){
      if (timetableLoading){
        box.innerHTML = '<p class="mieru-train-empty">' + C.loadingTrains + '</p>';
      } else if (timetableLoadFailed){
        box.innerHTML = '<p class="mieru-train-empty">' + C.trainError + '</p>';
      } else {
        box.innerHTML = '<p class="mieru-train-empty">' + C.searchHint + '</p>';
      }
      return;
    }
    var fromVal = document.getElementById("mieruTrainFrom").value || "06:00";
    var fromMin = toMin(fromVal);
    var found = trainCandidates(STATE.dir, STATE.board).filter(function(x){ return x.dep >= fromMin; }).slice(0, 8);
    if (!found.length){
      box.innerHTML = '<p class="mieru-train-empty">' + C.noTrains + '</p>';
      return;
    }
    box.innerHTML = found.map(function(x, i){
      var active = STATE.selectedTrain && STATE.selectedTrain.tr.type === x.tr.type &&
        STATE.selectedTrain.tr.number === x.tr.number && STATE.selectedTrain.dep === x.dep;
      return '<button type="button" class="train-chip' + (active ? " active" : "") + '" data-i="' + i + '">' +
        '<strong>' + trainLabel(x.tr) + '</strong>' +
        '<span>' + format('departure', clockStr(x.dep), stationLabel(x.tr.destination)) + '</span></button>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll("[data-i]"), function(btn){
      btn.addEventListener("click", function(){
        STATE.selectedTrain = found[+btn.dataset.i];
        renderTrainResults();
        render();
      });
    });
  }

  omAll().then(function(res){
    if (forecastContext) validateForecastDates(res);
    DATA.summit = res[0].hourly;
    SPOTS_M.forEach(function(s, i){ DATA.vps[s.id] = res[i+1].hourly; });
    retrievedAt = new Date();
    document.getElementById("mieruStatus").textContent = "";
    render();
  }).catch(function(e){
    DATA.summit = null;
    window.__mieru.results = {};
    document.getElementById('mieruSpots').textContent = '';
    if (forecastContext) {
      forecastContext.hidden = true;
      document.getElementById('mieruRide').textContent = '';
    }
    document.getElementById("mieruStatus").textContent = forecastContext ? forecastError : C.error;
  });

  function render(){
    if (!DATA.summit) return;
    var day = +document.getElementById("mieruDay").value;
    renderForecastContext(day);
    var spots = aheadSpots(STATE.dir, STATE.board);
    window.__mieru.results = {};

    var clockFn = null;
    if (STATE.mode === "train"){
      if (STATE.selectedTrain) clockFn = trainSpotClockFn(STATE.selectedTrain.tr, STATE.board);
    } else {
      var dep = document.getElementById("mieruDep").value || "09:00";
      clockFn = manualSpotClockFn(STATE.dir, STATE.board, toMin(dep));
    }

    var rideEl = document.getElementById("mieruRide");
    if (!spots.length){
      rideEl.textContent = C.noSpots;
    } else if (!clockFn){
      rideEl.textContent = C.chooseTrain;
    } else {
      var lines = [];
      spots.forEach(function(s){
        var t = clockFn(s.min);
        if (t == null) return;
        var hIdx = day*24 + Math.min(23, Math.max(0, Math.round(t/60)));
        var r = prob(DATA.summit, DATA.vps[s.id], hIdx, s.d);
        window.__mieru.results[s.id] = r;
        lines.push('<span class="copy-chunk">' + format("around", s.name, clockStr(t)) + " <b>" +
          Math.round(r.p*100) + "%</b> (" + verdictText(r.p) + ")</span>");
      });
      rideEl.innerHTML = lines.length
        ? C.train + lines.join(" ／ ")
        : C.noClock;
    }

    var root = document.getElementById("mieruSpots");
    root.innerHTML = "";
    spots.forEach(function(s){
      var rows = [];
      for (var h = H0; h <= H1; h++) rows.push(prob(DATA.summit, DATA.vps[s.id], day*24 + h, s.d));
      var bestP = Math.max.apply(null, rows.map(function(r){ return r.p; }));
      var bestI = rows.findIndex(function(r){ return r.p === bestP; });
      var div = document.createElement("div");
      div.className = "mieru-spot";
      var bars = rows.map(function(r, i){
        var pct = Math.round(r.p*100);
        return '<div class="mieru-bar" title="' + format('bar', (H0+i) + ':00', pct) + '%">' +
          '<span>' + pct + '</span>' +
          '<i style="height:' + Math.max(4, r.p*100) + '%;background:' + col(r.p) + '"></i></div>';
      }).join("");
      var hl = rows.map(function(_, i){ return "<div>" + (H0+i) + "</div>"; }).join("");
      div.innerHTML =
        '<div class="mieru-head"><h2>' + s.name + '</h2>' +
        '<span class="meta">' + format('meta', s.area, s.min, s.d, s.side) + '</span>' +
        '<span class="mieru-verdict">' + format('best', forecastContext ? forecastDateLabel(day) : (day ? C.tomorrow : C.today), (H0+bestI) + ':00') + ' <b>' +
          Math.round(bestP*100) + '%</b></span></div>' +
        '<div class="mieru-bars">' + bars + '</div>' +
        '<div class="mieru-hours">' + hl + '</div>' +
        '<div class="mieru-reason">' + reason(rows[bestI]) + '</div>';
      root.appendChild(div);
    });
  }

  /* ---- イベント配線 ---- */
  renderBoardOptions();
  applyUrlParams();
  renderBoardOptions();
  document.getElementById("mieruDir").value = STATE.dir;
  setMode(STATE.mode);
  renderTrainResults();

  document.getElementById("mieruBoard").addEventListener("change", function(){
    STATE.board = this.value;
    STATE.selectedTrain = null;
    renderTrainResults();
    render();
  });
  document.getElementById("mieruDir").addEventListener("change", function(){
    STATE.dir = this.value;
    STATE.selectedTrain = null;
    renderTrainResults();
    render();
  });
  document.getElementById("mieruDay").addEventListener("change", render);
  document.getElementById("mieruDep").addEventListener("input", render);
  document.getElementById("mieruModeTrain").addEventListener("click", function(){ setMode("train"); render(); });
  document.getElementById("mieruModeTime").addEventListener("click", function(){ setMode("time"); render(); });
  document.getElementById("mieruTrainSearchBtn").addEventListener("click", function(){
    ensureTimetableLoaded().then(function(){
      renderTrainResults();
      render();
    });
  });
  })();
