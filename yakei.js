/* 新幹線の窓 — 夜景ページの「どこから暗くなるか」判定
 *
 * 日の入り・日の出のモデルは app.js の seasonalDaylightWindow() / isClearlyDark() と
 * 同一式を使っている。乗車タイムラインの昼夜判定と結果を食い違わせないため、
 * 式を変えるときは app.js 側と必ず揃えること。
 *
 * 2026-09-19: 列車の選び方は列車選択ページと同じ部品（train-picker.js）にし、
 * 通過時刻は選んだ列車の公式の着発から train-select.js で出す（タイムラインと同じ計算）。
 * スポットの分数・席側・名前は data.js（data-runtime.js）から読む。ページが持つのは
 * 「どのスポットを載せるか」の id 一覧（window.YAKEI_SPOT_IDS）だけ。
 */
(function (root) {
  "use strict";
  if (!root || !root.document) return;
  var doc = root.document;

  var requestedLang = root.YAKEI_LANG || doc.documentElement.lang;
  var LANG = ["ja", "en", "de", "fr", "zh-Hant", "es", "zh-Hans", "ko"].indexOf(requestedLang) >= 0 ? requestedLang : "en";
  var MTS = root.MADO_TRAIN_SELECT;
  var DATA_SPOTS = typeof SPOTS !== "undefined" ? SPOTS : [];
  var DATA_ROUTE = typeof ROUTE !== "undefined" ? ROUTE : null;
  var IDS = root.YAKEI_SPOT_IDS || [];
  var YAKEI = IDS.map(function (id) {
    return DATA_SPOTS.filter(function (spot) { return spot.id === id; })[0];
  }).filter(Boolean);
  if (!YAKEI.length || !MTS || !DATA_ROUTE) return;

  var T = {
    ja: {
      dark: "暗い", dusk: "薄暮", light: "まだ明るい",
      side: function (s) { return s + "席側"; },
      needTrain: "列車を選ぶと、スポットごとの通過時刻と、その時間の明るさが出ます。",
      allLight: function (sunset) { return "この時刻だと、掲載しているスポットはすべて明るい時間に通過します。日の入りの目安は" + sunset + "です。"; },
      allDark: function (sunset, n) { return "全区間が暗い時間帯です。<strong>窓に映り込む車内の照明さえ抑えれば</strong>、" + n + "か所すべてが夜の顔で見られます。日の入りの目安は" + sunset + "。"; },
      mixed: function (sunset, name, time) { return "日の入りの目安は" + sunset + "。<strong>" + name + "（" + time + "ごろ）から先が暗い時間帯</strong>に入ります。ここから窓が鏡になるので、下の「夜の車窓の見方」を先に読んでおくと違います。"; },
    },
    en: {
      dark: "Dark", dusk: "Twilight", light: "Still light",
      side: function (s) { return "Seat " + s; },
      needTrain: "Pick your train to see each view's passing time and how dark it will be.",
      allLight: function (sunset) { return "At this time every view on the page is passed in daylight. Sunset is around " + sunset + "."; },
      allDark: function (sunset, n) { return "The whole run is after dark. <strong>Beat the reflection of the cabin lights</strong> and all " + n + " of these are available in their night form. Sunset is around " + sunset + "."; },
      mixed: function (sunset, name, time) { return "Sunset is around " + sunset + ". <strong>From " + name + " (about " + time + ") onward you are travelling in the dark.</strong> That is where the window turns into a mirror, so read &ldquo;How to see night views through the window&rdquo; below before you get there."; },
    },
    de: {
      dark: "Dunkel", dusk: "Dämmerung", light: "Noch hell",
      side: function (s) { return "Sitzseite " + s; },
      needTrain: "Wählen Sie Ihren Zug, um die voraussichtliche Vorbeifahrtszeit und die Lichtverhältnisse für jeden Ausblick zu sehen.",
      allLight: function (sunset) { return "Zu dieser Zeit passieren Sie alle hier gezeigten Ausblicke bei Tageslicht. Der Sonnenuntergang liegt ungefähr bei " + sunset + " Uhr."; },
      allDark: function (sunset, n) { return "Die gesamte Strecke liegt im Dunkeln. <strong>Wenn Sie die Spiegelung der Innenbeleuchtung abschirmen</strong>, können Sie alle " + n + " Ausblicke in ihrer nächtlichen Gestalt erleben. Sonnenuntergang ist ungefähr um " + sunset + " Uhr."; },
      mixed: function (sunset, name, time) { return "Sonnenuntergang ist ungefähr um " + sunset + " Uhr. <strong>Ab " + name + " (gegen " + time + " Uhr) reisen Sie im Dunkeln.</strong> Dann wird das Fenster zum Spiegel. Lesen Sie vorher die Tipps zum Betrachten der nächtlichen Aussicht weiter unten."; },
    },
    fr: {
      dark: "Nuit", dusk: "Crépuscule", light: "Encore jour",
      side: function (s) { return "Côté siège " + s; },
      needTrain: "Choisissez votre train pour voir l’heure de passage estimée et la luminosité de chaque paysage.",
      allLight: function (sunset) { return "À cette heure, vous passez devant tous les paysages de cette page en plein jour. Le coucher du soleil est estimé vers " + sunset + "."; },
      allDark: function (sunset, n) { return "Tout le trajet se déroule de nuit. <strong>En masquant le reflet de l’éclairage intérieur</strong>, vous pourrez découvrir ces " + n + " paysages sous leur aspect nocturne. Le coucher du soleil est estimé vers " + sunset + "."; },
      mixed: function (sunset, name, time) { return "Le coucher du soleil est estimé vers " + sunset + ". <strong>À partir de " + name + " (vers " + time + "), vous voyagez dans l’obscurité.</strong> La vitre devient alors un miroir : lisez auparavant les conseils ci-dessous pour profiter des paysages nocturnes."; },
    },
    "zh-Hant": {
      dark: "天黑", dusk: "晨昏微光", light: "天還亮",
      side: function (s) { return s + "席側"; },
      needTrain: "選擇列車，即可查看各處景色的預估通過時刻與當時的明暗程度。",
      allLight: function (sunset) { return "依此時刻出發，通過本頁所有景點時都還是白天。日落時間約為" + sunset + "。"; },
      allDark: function (sunset, n) { return "全程都在天黑後。<strong>只要遮住車廂燈光在玻璃上的倒影</strong>，就有機會看見這" + n + "處景色的夜間面貌。日落時間約為" + sunset + "。"; },
      mixed: function (sunset, name, time) { return "日落時間約為" + sunset + "。<strong>從" + name + "（約" + time + "）起，列車會進入天黑的時段。</strong>這時車窗容易像鏡子一樣反光，建議先閱讀下方的「如何欣賞夜間車窗景色」。"; },
    },
    es: {
      dark: "Noche", dusk: "Crepúsculo", light: "Todavía de día",
      side: function (s) { return "Lado de los asientos " + s; },
      needTrain: "Elige tu tren para ver la hora aproximada de paso y la luz que habrá en cada paisaje.",
      allLight: function (sunset) { return "A esta hora, el tren pasa de día por todos los paisajes de esta página. La puesta de sol es hacia las " + sunset + "."; },
      allDark: function (sunset, n) { return "Todo el recorrido transcurre de noche. <strong>Reduce el reflejo de las luces del vagón</strong> para disfrutar de estos " + n + " paisajes nocturnos. La puesta de sol es hacia las " + sunset + "."; },
      mixed: function (sunset, name, time) { return "La puesta de sol es hacia las " + sunset + ". <strong>A partir de " + name + " (hacia las " + time + "), viajarás de noche.</strong> La ventana se convierte en un espejo: lee antes los consejos para observar los paisajes nocturnos que aparecen más abajo."; },
    },
    "zh-Hans": {
      dark: "天黑", dusk: "晨昏微光", light: "天还亮",
      side: function (s) { return s + "座侧"; },
      needTrain: "选择列车，查看各处景色的预计经过时间和当时的明暗程度。",
      allLight: function (sunset) { return "按这个时刻，列车经过本页所有景色时都还是白天。日落时间约为" + sunset + "。"; },
      allDark: function (sunset, n) { return "全程都在天黑后。<strong>挡住车厢灯光在玻璃上的倒影</strong>，就有机会欣赏这" + n + "处景色的夜间面貌。日落时间约为" + sunset + "。"; },
      mixed: function (sunset, name, time) { return "日落时间约为" + sunset + "。<strong>从" + name + "（约" + time + "）起，列车进入天黑的时段。</strong>这时玻璃容易映出车厢倒影，请提前阅读下方的夜间观景提示。"; },
    },
    ko: {
      dark: "밤", dusk: "어스름", light: "아직 밝음",
      side: function (s) { return s + "석 쪽"; },
      needTrain: "열차를 선택하면 각 풍경의 예상 통과 시각과 그때의 밝기를 볼 수 있습니다.",
      allLight: function (sunset) { return "이 시각에는 이 페이지의 모든 풍경을 밝을 때 지나갑니다. 일몰은 약 " + sunset + "입니다."; },
      allDark: function (sunset, n) { return "전체 구간을 어두워진 뒤에 지납니다. <strong>유리창에 비치는 객실 조명을 가리면</strong> " + n + "곳의 야경을 감상할 수 있습니다. 일몰은 약 " + sunset + "입니다."; },
      mixed: function (sunset, name, time) { return "일몰은 약 " + sunset + "입니다. <strong>" + name + "(약 " + time + ")부터는 어두운 시간대에 들어갑니다.</strong>이때부터 창문에 객실이 비치기 쉬우니 아래의 야경 감상 요령을 미리 읽어 보세요."; },
    },
  }[LANG];

  function dayOfYear(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  // app.js と同一式
  function seasonalDaylightWindow(date) {
    var season = Math.cos(((dayOfYear(date) - 172) * 2 * Math.PI) / 365);
    return { sunrise: 342 - 72 * season, sunset: 1075 + 95 * season };
  }

  // 暗い / 薄明薄暮 / 明るい の3段階。app.js の isClearlyDark が ±25分を境にしているので、
  // その25分をそのまま「薄明薄暮」の幅として使う。
  var TWILIGHT = 25;
  function classify(clock, date) {
    var w = seasonalDaylightWindow(date);
    var m = ((clock % 1440) + 1440) % 1440;
    if (m > w.sunset + TWILIGHT || m < w.sunrise - TWILIGHT) return "dark";
    if (m >= w.sunset - TWILIGHT || m <= w.sunrise + TWILIGHT) return "dusk";
    return "light";
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clockText(minutes) {
    var m = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return pad(Math.floor(m / 60)) + ":" + pad(m % 60);
  }

  function parseDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    var d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  function todayValue() {
    var now = new Date();
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function spotName(spot) { return (spot[LANG] && spot[LANG].name) || spot.ja.name; }

  var picked = null; // { tr, boardId }

  function render() {
    var date = parseDate(doc.getElementById("ykDate").value) || new Date();
    var result = doc.getElementById("ykResult");
    var summary = doc.getElementById("ykSummary");
    if (!picked) {
      result.innerHTML = "";
      summary.textContent = T.needTrain;
      return;
    }
    var all = MTS.tokaidoStops(DATA_ROUTE, picked.tr);
    var from = all.findIndex(function (stop) { return stop.id === picked.boardId; });
    var stops = from >= 0 ? all.slice(from) : all;
    var dirSign = picked.tr.direction === "west" ? 1 : -1;
    var rows = YAKEI.map(function (spot) {
      var side = MTS.spotStationSide(spot, DATA_ROUTE, root.MADO_TRACK);
      var clock = MTS.interpolateSpot(spot.minutesFromTokyo, stops, side);
      return clock == null ? null : { spot: spot, clock: clock, seq: spot.minutesFromTokyo * dirSign, state: classify(clock, date) };
    }).filter(Boolean).sort(function (a, b) { return a.clock - b.clock || a.seq - b.seq; });

    result.innerHTML = rows.map(function (row) {
      return '<div class="yk-row is-' + row.state + '">' +
        '<span class="yk-row-time">' + clockText(row.clock) + "</span>" +
        '<span class="yk-row-name"><a href="#yk-' + row.spot.id + '">' + escapeHTML(spotName(row.spot)) + "</a>" +
        '<span class="yk-row-side">' + escapeHTML(T.side(row.spot.side)) + "</span></span>" +
        '<span class="yk-row-badge">' + T[row.state] + "</span>" +
        "</div>";
    }).join("");

    var darkRows = rows.filter(function (row) { return row.state === "dark"; });
    var sunsetText = clockText(seasonalDaylightWindow(date).sunset);

    if (!darkRows.length) {
      summary.innerHTML = T.allLight(sunsetText);
    } else if (darkRows.length === rows.length) {
      summary.innerHTML = T.allDark(sunsetText, rows.length);
    } else {
      var first = darkRows[0];
      summary.innerHTML = T.mixed(sunsetText, escapeHTML(spotName(first.spot)), clockText(first.clock));
    }

    if (!root.MADO_ANALYTICS_DISABLED && typeof root.gtag === "function") {
      root.gtag("event", "yakei_check", {
        direction: picked.tr.direction, board_station: picked.boardId,
        train_type: picked.tr.type, train_number: picked.tr.number,
        dark_count: darkRows.length, language: LANG,
      });
    }
  }

  /* 乗車日と、列車選択ページと同じ列車選択。夜の乗車を想定して出発時刻の初期値は19:00 */
  function init() {
    var dateInput = doc.getElementById("ykDate");
    var pickerRoot = doc.querySelector("[data-train-picker]");
    if (!dateInput || !pickerRoot || !root.MADO_TRAIN_PICKER) return;
    if (!dateInput.value) dateInput.value = todayValue();
    root.MADO_TRAIN_PICKER.mount(pickerRoot, {
      lang: LANG,
      route: DATA_ROUTE,
      timetable: root.SHINKANSEN_TIMETABLE,
      time: "19:00",
      onChange: function () { picked = null; render(); },
      onSelect: function (choice, state) { picked = { tr: choice.tr, boardId: state.boardId }; render(); },
    });
    dateInput.addEventListener("change", render);
    render();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
}(typeof window !== "undefined" ? window : globalThis));
