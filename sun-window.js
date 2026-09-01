/*
 * sun-window.js — 日の出・日の入りの季節近似と、明暗3+1段階の判定。
 *
 * 同じ式が app.js（seasonalDaylightWindow / isClearlyDark）と yakei.js に
 * それぞれ実装されている。train-select.js と同じ理由で、これ以上コピーを
 * 増やさないための正本として切り出した。新規のページはここを使う。
 * app.js と yakei.js の移行は未実施（別途）。
 *
 * 素のブラウザスクリプト。const はトップレベルでも window に載らないため、
 * 公開は window.MADO_SUN への明示代入で行う。
 */
(function (root) {
  "use strict";

  function dayOfYear(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  /* app.js / yakei.js と同一式。新富士付近の緯度を前提にした季節近似で、
     天文計算ではない。分単位、0時からの経過分で返す。 */
  function daylightWindow(date) {
    var season = Math.cos(((dayOfYear(date) - 172) * 2 * Math.PI) / 365);
    return { sunrise: 342 - 72 * season, sunset: 1075 + 95 * season };
  }

  /* yakei.js は薄明薄暮をまとめて "dusk" と呼ぶが、こちらは朝と夕を分ける。
     ±25分の幅は app.js の isClearlyDark に合わせている。 */
  var TWILIGHT = 25;

  function classify(clock, date) {
    var w = daylightWindow(date || new Date());
    var m = ((clock % 1440) + 1440) % 1440;
    if (m > w.sunset + TWILIGHT || m < w.sunrise - TWILIGHT) return "night";
    if (m <= w.sunrise + TWILIGHT) return "dawn";
    if (m >= w.sunset - TWILIGHT) return "dusk";
    return "day";
  }

  root.MADO_SUN = {
    daylightWindow: daylightWindow,
    classify: classify,
    TWILIGHT: TWILIGHT,
  };
})(typeof window !== "undefined" ? window : this);
