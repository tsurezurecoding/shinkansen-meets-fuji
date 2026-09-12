(function () {
  "use strict";

  // 観覧車コレクションの記録とメダル。727コレクションと同じ「mado-stamps」に保存する。
  // ひらかたパークはスポットのスタンプIDをそのまま使うので、スタンプ帖の記録と共有される。
  var page = document.querySelector(".ferris-wheels-page");
  var config = window.FERRIS_WHEEL_COLLECTION;
  if (!page || !config || !Array.isArray(config.items)) return;

  var text = config.text;
  var stamps = loadStamps();
  var MEDAL_ICON = "<svg class=\"fw-medal-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"10\" r=\"7.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"/><path d=\"M12 2.5v15M4.5 10h15M6.7 4.7l10.6 10.6M17.3 4.7 6.7 15.3\" stroke=\"currentColor\" stroke-width=\"1\"/><path d=\"M8 22l4-12 4 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>";

  function loadStamps() {
    try {
      var parsed = JSON.parse(localStorage.getItem("mado-stamps") || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) { return {}; }
  }
  function saveStamps() {
    try { localStorage.setItem("mado-stamps", JSON.stringify(stamps)); } catch (error) { /* storage is optional */ }
  }
  function isFound(item) { return Boolean(stamps[item.stampId]); }
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function fill(template, values) {
    return String(template).replace(/\{(\w+)\}/g, function (whole, key) { return values[key] == null ? whole : values[key]; });
  }

  function renderProgress() {
    var total = config.items.length;
    var found = config.items.filter(isFound).length;
    var progress = document.getElementById("wheelProgress");
    if (progress) {
      progress.innerHTML = "<div class=\"collection-progress-copy\"><strong>" + escapeHTML(fill(text.progress, { found: found, total: total })) + "</strong><span>" + escapeHTML(text.progressNote) + "</span></div><div class=\"collection-progress-bar\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"" + total + "\" aria-valuenow=\"" + found + "\"><span style=\"width:" + Math.round((found / total) * 100) + "%\"></span></div>";
    }
    var medals = document.getElementById("wheelMedals");
    if (!medals) return;
    medals.innerHTML = config.stages.map(function (stage) {
      var achieved = found >= stage.threshold;
      return "<article class=\"collection-stage-card" + (achieved ? " is-achieved" : "") + "\"><div class=\"collection-stage-medal medal-" + escapeHTML(stage.className) + "\" aria-hidden=\"true\"><span class=\"collection-medal-ribbon\"></span>" + MEDAL_ICON + "</div><div><h3>" + escapeHTML(stage.title) + "</h3><p>" + escapeHTML(stage.body) + "</p><span class=\"collection-stage-state\">" + escapeHTML(achieved ? text.achieved : text.notAchieved) + "</span></div></article>";
    }).join("");
  }

  function renderCards() {
    config.items.forEach(function (item) {
      var found = isFound(item);
      var card = page.querySelector("[data-wheel-card=\"" + item.id + "\"]");
      if (card) card.classList.toggle("is-found", found);
      var button = page.querySelector("[data-wheel-stamp=\"" + item.id + "\"]");
      if (button) {
        button.setAttribute("aria-pressed", String(found));
        button.innerHTML = "<span aria-hidden=\"true\">" + (found ? "✓" : "○") + "</span>" + escapeHTML(found ? text.found : text.record);
      }
      var state = page.querySelector("[data-wheel-state=\"" + item.id + "\"]");
      if (state) state.textContent = found ? text.foundState : text.emptyState;
    });
  }

  page.addEventListener("click", function (event) {
    var button = event.target.closest("[data-wheel-stamp]");
    if (!button) return;
    event.preventDefault();
    var id = button.getAttribute("data-wheel-stamp");
    var item = config.items.filter(function (candidate) { return candidate.id === id; })[0];
    if (!item) return;
    // 別タブのスタンプ帖で押した記録を上書きしないよう、押す直前に読み直す。
    stamps = loadStamps();
    if (isFound(item)) delete stamps[item.stampId];
    else stamps[item.stampId] = Date.now();
    saveStamps();
    renderProgress();
    renderCards();
  });

  renderProgress();
  renderCards();
})();
