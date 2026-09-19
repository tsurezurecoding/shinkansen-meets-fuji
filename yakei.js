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

  var LANG = root.YAKEI_LANG === "en" ? "en" : "ja";
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
