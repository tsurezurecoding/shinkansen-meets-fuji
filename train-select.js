/*
 * train-select.js — 列車選択アルゴリズムの共有モジュール（app.js と mieru.html 共通）。
 *
 * 2026-08-17: mieru.html に列車選択を入れた際、app.js が並行編集中で触れず、
 * 同じアルゴリズム（tokaidoStops/interpolateSpot/trainCandidates）を独立実装で
 * 二重に持ってしまった。時刻表の形式や補間仕様が変わったとき片方だけ直されて
 * 予報の通過時刻がズレるのを防ぐため、ここへ一本化する。
 *
 * 素のブラウザスクリプト（<script src>で読む。ESモジュールではない）。
 * const をトップレベルで宣言しても window には載らないため、公開は
 * 明示的に window.MADO_TRAIN_SELECT へ代入する。
 *
 * 挙動は app.js 側の実装をそのまま踏襲（tokaidoStops は ja/en ラベルつき。
 * mieru.html はこのラベルを使わないが、値を無視するだけなので出力互換）。
 */
(function (root) {
  "use strict";

  function toMin(hhmm) {
    var p = String(hhmm).split(":");
    return (+p[0]) * 60 + (+p[1]);
  }

  /* 列車の東海道区間の停車駅（時刻順）。
   * clock は発時刻（終着は着時刻）。arr は途中停車駅の着時刻で、時刻表に無ければ clock と同じ。 */
  function tokaidoStops(route, train) {
    var arrivals = train.arrivals || {};
    return route.refStations
      .filter(function (s) { return train.times[s.id]; })
      .map(function (s) {
        var clock = toMin(train.times[s.id]);
        return { id: s.id, ja: s.ja, en: s.en, ref: s.min, clock: clock, arr: arrivals[s.id] ? toMin(arrivals[s.id]) : clock };
      })
      .sort(function (a, b) { return a.clock - b.clock; });
  }

  /* 実ダイヤ補間: スポットの基準分数を、前駅の発から次駅の着までで線形補間する。
   * 2026-09-19: 発時刻どうしで補間すると、こだま・ひかりの途中停車（1〜6分）が駅間の走行へ
   * 按分され、通過予測が最大5分遅れていた（実走7便で確認）。停車駅上のスポットは着時刻になる。 */
  function interpolateSpot(spotRef, stops) {
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i], b = stops[i + 1];
      var lo = Math.min(a.ref, b.ref), hi = Math.max(a.ref, b.ref);
      if (spotRef >= lo && spotRef <= hi && a.ref !== b.ref) {
        var f = Math.abs(spotRef - a.ref) / Math.abs(b.ref - a.ref);
        var bArr = b.arr != null ? b.arr : b.clock;
        return Math.round(a.clock + f * (bArr - a.clock));
      }
    }
    return null;
  }

  /* 列車検索: 方向・乗車駅に合う列車を出発時刻順に並べる */
  function trainCandidates(timetable, route, direction, boardId) {
    if (!timetable) return [];
    return timetable.trains
      .filter(function (tr) {
        if (tr.direction !== direction || !tr.times[boardId]) return false;
        // 乗車駅より先に東海道区間の停車駅があること
        var stops = tokaidoStops(route, tr);
        var idx = stops.findIndex(function (s) { return s.id === boardId; });
        return idx >= 0 && idx < stops.length - 1;
      })
      .map(function (tr) { return { tr: tr, dep: toMin(tr.times[boardId]) }; })
      .sort(function (a, b) { return a.dep - b.dep; })
      // データセット内の重複列車（同番号・同時刻）を除去
      .filter(function (x, i, arr) {
        return i === arr.findIndex(function (y) {
          return y.tr.type === x.tr.type && y.tr.number === x.tr.number && y.dep === x.dep;
        });
      });
  }

  root.MADO_TRAIN_SELECT = {
    toMin: toMin,
    tokaidoStops: tokaidoStops,
    interpolateSpot: interpolateSpot,
    trainCandidates: trainCandidates,
  };
})(typeof window !== "undefined" ? window : this);
