/*
 * train-picker.js — 列車選択の画面部品（列車選択・Sparkling Dreams・夜景で共通）。
 *
 * 2026-09-19: Sparkling Dreams は全列車の1つのプルダウン、夜景は東京/新大阪発の時刻だけと、
 * ページごとに列車の選び方も計算も違っていた。方向 → 乗車駅 → 出発時刻 → 5本ずつの候補、
 * という列車選択ページの操作をこの部品1つにまとめ、候補は train-select.js から取る。
 *
 * 素のブラウザスクリプト。train-select.js・data（ROUTE）・data/timetable.js の後に読む。
 * 公開は window.MADO_TRAIN_PICKER。
 *
 *   const picker = MADO_TRAIN_PICKER.mount(element, {
 *     lang: "ja", route: ROUTE, timetable: SHINKANSEN_TIMETABLE,
 *     direction: "west", boardId: "Tokyo", time: "19:00",   // time 省略時は現在時刻
 *     onChange(state) {},            // 方向・乗車駅・時刻が変わった（選択中の列車は無効）
 *     onSearch(state) {},            // 「列車をさがす」
 *     onPage(state, startMin) {},    // 候補の前後ページ
 *     onSelect({ tr, dep }, state) {},
 *     messages: { ja: { trainNone: "…" } },   // ページ固有の言い回しだけ上書き
 *   });
 */
(function (root) {
  "use strict";

  var MSG = {
    ja: {
      labelDirection: "方向", dirWest: "西へ（大阪方面）", dirEast: "東へ（東京方面）",
      labelBoard: "乗車駅", labelDeparture: "出発時刻", btnNow: "これから乗る",
      btnFind: "この時間の列車をさがす", trainPrev: "前のページ", trainNext: "次のページ",
      trainNone: "この条件の列車が見つかりませんでした。時刻を変えてお試しください。",
      trainPickNote: "乗る列車をえらんでください（実ダイヤ基準）", dep: "発",
    },
    en: {
      labelDirection: "Direction", dirWest: "Westbound (for Osaka)", dirEast: "Eastbound (for Tokyo)",
      labelBoard: "Boarding at", labelDeparture: "Departure", btnNow: "Boarding soon",
      btnFind: "Find my train", trainPrev: "Previous", trainNext: "Next",
      trainNone: "No trains found for this time. Try another time.",
      trainPickNote: "Pick your train (real timetable)", dep: "dep",
    },
  };
  var TRAIN_NAMES = { Nozomi: { ja: "のぞみ", en: "Nozomi" }, Hikari: { ja: "ひかり", en: "Hikari" }, Kodama: { ja: "こだま", en: "Kodama" } };
  var PAGE_SIZE = 5;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function minToClock(min) {
    var m = ((Math.round(min) % 1440) + 1440) % 1440;
    return pad(Math.floor(m / 60)) + ":" + pad(m % 60);
  }
  function clockToMin(value) {
    var match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }
  function nowClock() {
    var d = new Date();
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function mount(element, options) {
    var MTS = root.MADO_TRAIN_SELECT;
    if (!element || !MTS) return null;
    var opts = options || {};
    var route = opts.route;
    var timetable = opts.timetable;
    var lang = opts.lang === "en" ? "en" : "ja";
    var state = {
      direction: opts.direction === "east" ? "east" : "west",
      boardId: opts.boardId || (opts.direction === "east" ? "Shin-Osaka" : "Tokyo"),
    };
    var stationNames = {};
    (timetable && timetable.stations || []).forEach(function (s) { stationNames[s.id] = s; });
    route.refStations.forEach(function (s) { if (!stationNames[s.id]) stationNames[s.id] = s; });
    var shown = null; // 表示中の候補ページ { found, startMin }
    var activeKey = null;

    // ページ固有の言い回しだけ messages: { ja: {...}, en: {...} } で上書きできる
    function t(key) {
      var own = opts.messages && opts.messages[lang];
      return own && own[key] != null ? own[key] : MSG[lang][key];
    }
    function stationLabel(id) {
      var s = stationNames[id];
      if (!s) return id;
      return lang === "ja" ? (s.ja || s.en || id) : (s.en || s.ja || id);
    }
    function trainLabel(tr) {
      return (TRAIN_NAMES[tr.type] || { ja: tr.type, en: tr.type })[lang] + tr.number;
    }
    function trainKey(tr) { return tr.type + "-" + tr.number; }
    function candidates() { return MTS.trainCandidates(timetable, route, state.direction, state.boardId); }
    function snapshot() { return { direction: state.direction, boardId: state.boardId, time: $time().value }; }
    function $(sel) { return element.querySelector(sel); }
    function $time() { return $("#departTime"); }
    function $results() { return $("#trainResults"); }

    element.innerHTML =
      '<div class="setup-row">' +
        '<span class="setup-label" data-picker-text="labelDirection"></span>' +
        '<div class="seg" role="group">' +
          '<button type="button" data-dir="west"><span data-picker-text="dirWest"></span></button>' +
          '<button type="button" data-dir="east"><span data-picker-text="dirEast"></span></button>' +
        "</div>" +
      "</div>" +
      '<div class="setup-row">' +
        '<label class="setup-label" for="boardStation" data-picker-text="labelBoard"></label>' +
        '<select id="boardStation" class="board-select"></select>' +
      "</div>" +
      '<div class="setup-row">' +
        '<label class="setup-label" for="departTime" data-picker-text="labelDeparture"></label>' +
        '<div class="depart-wrap">' +
          '<input type="time" id="departTime">' +
          '<button type="button" class="chip-btn" id="nowBtn" data-picker-text="btnNow"></button>' +
        "</div>" +
      "</div>" +
      '<button type="button" class="btn btn-primary btn-wide" id="findTrainsBtn" data-picker-text="btnFind"></button>' +
      '<div class="train-results" id="trainResults" hidden></div>';

    function renderLabels() {
      Array.prototype.forEach.call(element.querySelectorAll("[data-picker-text]"), function (el) {
        el.textContent = t(el.getAttribute("data-picker-text"));
      });
    }
    function renderDirection() {
      Array.prototype.forEach.call(element.querySelectorAll("[data-dir]"), function (b) {
        b.classList.toggle("active", b.getAttribute("data-dir") === state.direction);
      });
    }
    function renderBoard() {
      var list = state.direction === "west" ? route.refStations.slice(0, -1) : route.refStations.slice(1).reverse();
      $("#boardStation").innerHTML = list.map(function (s) {
        return '<option value="' + esc(s.id) + '"' + (s.id === state.boardId ? " selected" : "") + ">" + esc(s[lang] || s.ja) + "</option>";
      }).join("");
    }

    function changed() {
      activeKey = null;
      $results().hidden = true;
      shown = null;
      if (opts.onChange) opts.onChange(snapshot());
    }

    function renderResults(startMin) {
      var all = candidates();
      var found = all.filter(function (x) { return x.dep >= startMin; }).slice(0, PAGE_SIZE);
      shown = { found: found, startMin: startMin };
      var first = found.length ? found[0].dep : startMin;
      var last = found.length ? found[found.length - 1].dep : startMin;
      var prev = all.filter(function (x) { return x.dep < first; }).slice(-PAGE_SIZE);
      var prevStart = prev.length ? prev[0].dep : null;
      var nextItem = all.filter(function (x) { return x.dep > last; })[0];
      var nextStart = nextItem ? nextItem.dep : null;
      var controls =
        '<div class="train-shift" role="group" aria-label="' + esc(t("labelDeparture")) + '">' +
          '<button type="button" data-page-start="' + (prevStart == null ? "" : prevStart) + '"' + (prevStart == null ? " disabled" : "") + ">‹ " + esc(t("trainPrev")) + "</button>" +
          "<span>" + (found.length ? esc(minToClock(first)) + " - " + esc(minToClock(last)) : esc(minToClock(startMin))) + "</span>" +
          '<button type="button" data-page-start="' + (nextStart == null ? "" : nextStart) + '"' + (nextStart == null ? " disabled" : "") + ">" + esc(t("trainNext")) + " ›</button>" +
        "</div>";
      var box = $results();
      box.hidden = false;
      box.innerHTML = found.length
        ? controls + '<p class="train-pick-note">' + esc(t("trainPickNote")) + "</p>" + found.map(function (x, i) {
            return '<button type="button" class="train-chip' + (trainKey(x.tr) === activeKey ? " active" : "") + '" data-train="' + i + '">' +
              "<strong>" + esc(trainLabel(x.tr)) + "</strong>" +
              "<span>" + esc(minToClock(x.dep)) + " " + esc(t("dep")) + " → " + esc(stationLabel(x.tr.destination)) + "</span>" +
            "</button>";
          }).join("")
        : controls + '<p class="train-none">' + esc(t("trainNone")) + "</p>";
      Array.prototype.forEach.call(box.querySelectorAll("[data-page-start]"), function (btn) {
        btn.addEventListener("click", function () {
          var min = Number(btn.getAttribute("data-page-start"));
          $time().value = minToClock(min);
          activeKey = null;
          if (opts.onChange) opts.onChange(snapshot());
          renderResults(min);
          if (opts.onPage) opts.onPage(snapshot(), min);
        });
      });
      Array.prototype.forEach.call(box.querySelectorAll("[data-train]"), function (btn) {
        btn.addEventListener("click", function () {
          var picked = found[Number(btn.getAttribute("data-train"))];
          markActive(picked.tr);
          if (opts.onSelect) opts.onSelect(picked, snapshot());
        });
      });
    }

    function markActive(tr) {
      activeKey = tr ? trainKey(tr) : null;
      if (!shown) return;
      Array.prototype.forEach.call($results().querySelectorAll("[data-train]"), function (btn) {
        var x = shown.found[Number(btn.getAttribute("data-train"))];
        btn.classList.toggle("active", !!x && trainKey(x.tr) === activeKey);
      });
    }

    function search() {
      var min = clockToMin($time().value);
      if (min == null) min = clockToMin(nowClock());
      renderResults(min);
    }

    // 利用者の操作
    Array.prototype.forEach.call(element.querySelectorAll("[data-dir]"), function (b) {
      b.addEventListener("click", function () {
        state.direction = b.getAttribute("data-dir");
        state.boardId = state.direction === "west" ? "Tokyo" : "Shin-Osaka";
        renderDirection();
        renderBoard();
        changed();
      });
    });
    $("#boardStation").addEventListener("change", function (e) {
      state.boardId = e.target.value;
      changed();
    });
    $time().addEventListener("input", function () { activeKey = null; if (opts.onChange) opts.onChange(snapshot()); });
    $time().addEventListener("change", function () { activeKey = null; if (opts.onChange) opts.onChange(snapshot()); });
    $("#nowBtn").addEventListener("click", function () {
      $time().value = nowClock();
      activeKey = null;
      if (opts.onChange) opts.onChange(snapshot());
    });
    $("#findTrainsBtn").addEventListener("click", function () {
      if (opts.onSearch) opts.onSearch(snapshot());
      search();
    });

    $time().value = opts.time || nowClock();
    renderLabels();
    renderDirection();
    renderBoard();

    return {
      get direction() { return state.direction; },
      get boardId() { return state.boardId; },
      get departMin() { return clockToMin($time().value); },
      /* 言語を切り替える（列車選択ページの言語ボタン）。表示中の候補も描き直す */
      setLang: function (next) {
        lang = next === "en" ? "en" : "ja";
        renderLabels();
        renderBoard();
        if (shown && !$results().hidden) renderResults(shown.startMin);
      },
      /* 方向と乗車駅を外から決め、その列車の候補を表示して選択状態にする（復元・リンク） */
      showTrain: function (direction, boardId, tr) {
        state.direction = direction === "east" ? "east" : "west";
        state.boardId = boardId;
        renderDirection();
        renderBoard();
        var match = candidates().filter(function (x) { return x.tr.type === tr.type && x.tr.number === tr.number; })[0];
        if (!match) return null;
        $time().value = minToClock(match.dep);
        activeKey = trainKey(match.tr);
        renderResults(match.dep);
        return match;
      },
      /* 指定の方向・乗車駅で、列車が候補に存在するか（状態は変えない） */
      findCandidate: function (direction, boardId, type, number) {
        return MTS.trainCandidates(timetable, route, direction, boardId).filter(function (x) {
          return x.tr.type === type && x.tr.number === number;
        })[0] || null;
      },
      search: search,
      hideResults: function () { $results().hidden = true; shown = null; },
      markActive: markActive,
    };
  }

  root.MADO_TRAIN_PICKER = { mount: mount, minToClock: minToClock };
})(typeof window !== "undefined" ? window : this);
