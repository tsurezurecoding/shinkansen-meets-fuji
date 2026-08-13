/* 新幹線の窓 — 夜景ページの「どこから暗くなるか」判定
 *
 * 日の入り・日の出のモデルは app.js の seasonalDaylightWindow() / isClearlyDark() と
 * 同一式を使っている。乗車タイムラインの昼夜判定と結果を食い違わせないため、
 * 式を変えるときは app.js 側と必ず揃えること。
 */
(function (root) {
  "use strict";
  if (!root || !root.document) return;
  var doc = root.document;

  var SPOTS = root.YAKEI_SPOTS || [];
  var NAMES = root.YAKEI_NAMES || {};
  var TOTAL = Number(root.YAKEI_TOTAL_MINUTES) || 147;
  var LANG = root.YAKEI_LANG === "en" ? "en" : "ja";
  if (!SPOTS.length) return;

  var T = {
    ja: {
      dark: "暗い", dusk: "薄暮", light: "まだ明るい",
      side: function (s) { return s + "席側"; },
      needTime: "出発時刻を入力してください。",
      allLight: function (sunset) { return "この時刻だと、掲載しているスポットはすべて明るい時間に通過します。日の入りの目安は" + sunset + "です。"; },
      allDark: function (sunset, n) { return "全区間が暗い時間帯です。<strong>窓に映り込む車内の照明さえ抑えれば</strong>、" + n + "か所すべてが夜の顔で見られます。日の入りの目安は" + sunset + "。"; },
      mixed: function (sunset, name, time) { return "日の入りの目安は" + sunset + "。<strong>" + name + "（" + time + "ごろ）から先が暗い時間帯</strong>に入ります。ここから窓が鏡になるので、下の「夜の車窓の見方」を先に読んでおくと違います。"; },
    },
    en: {
      dark: "Dark", dusk: "Twilight", light: "Still light",
      side: function (s) { return "Seat " + s; },
      needTime: "Enter a departure time.",
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

  function parseTime(value) {
    var match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    var h = Number(match[1]);
    var m = Number(match[2]);
    if (!(h >= 0 && h <= 23 && m >= 0 && m <= 59)) return null;
    return h * 60 + m;
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

  function render() {
    var dir = doc.getElementById("ykDir").value;
    var depart = parseTime(doc.getElementById("ykTime").value);
    var date = parseDate(doc.getElementById("ykDate").value) || new Date();
    var result = doc.getElementById("ykResult");
    var summary = doc.getElementById("ykSummary");
    if (depart === null) {
      result.innerHTML = "";
      summary.textContent = T.needTime;
      return;
    }

    var rows = SPOTS.map(function (spot) {
      // 下りは東京からの分、上りは新大阪からの分に読み替える
      var offset = dir === "up" ? TOTAL - spot.min : spot.min;
      var clock = depart + offset;
      return { spot: spot, offset: offset, clock: clock, state: classify(clock, date) };
    }).sort(function (a, b) { return a.offset - b.offset; });

    result.innerHTML = rows.map(function (row) {
      var name = escapeHTML(NAMES[row.spot.id] || row.spot.id);
      return '<div class="yk-row is-' + row.state + '">' +
        '<span class="yk-row-time">' + clockText(row.clock) + "</span>" +
        '<span class="yk-row-name"><a href="#yk-' + row.spot.id + '">' + name + "</a>" +
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
      summary.innerHTML = T.mixed(sunsetText, escapeHTML(NAMES[first.spot.id] || first.spot.id), clockText(first.clock));
    }

    if (!root.MADO_ANALYTICS_DISABLED && typeof root.gtag === "function") {
      root.gtag("event", "yakei_check", { direction: dir, dark_count: darkRows.length, language: LANG });
    }
  }

  function init() {
    var form = doc.getElementById("ykForm");
    var dateInput = doc.getElementById("ykDate");
    if (!form || !dateInput) return;
    if (!dateInput.value) dateInput.value = todayValue();
    form.addEventListener("change", render);
    form.addEventListener("input", render);
    form.addEventListener("submit", function (event) { event.preventDefault(); render(); });
    render();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
}(typeof window !== "undefined" ? window : globalThis));
