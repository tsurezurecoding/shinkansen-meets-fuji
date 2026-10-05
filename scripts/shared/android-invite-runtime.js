/* Inlined at build time: no extra request, bridge, SDK or install detection. */
(function () {
  "use strict";
  var key = "mado-android-invite-v1", root = document.documentElement, claim, card, observer, ratio = 0, pending = false;
  // browser=false is not proof of an installed app: unsupported/unknown modes exist.
  var modeNames = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay", "picture-in-picture", "tabbed"];
  var modes = modeNames.map(function (name) {
    try { return typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: " + name + ")") : null; }
    catch (error) { return null; }
  });
  function browser() {
    var ua = navigator.userAgent || "";
    return /Android/i.test(ua) && /(?:Chrome|Firefox|SamsungBrowser|EdgA|OPR)\//i.test(ua)
      && !/(?:Googlebot|GoogleOther|bingbot|Applebot|DuckDuckBot|crawler|spider|\bwv\b|Version\/4\.0|FBAN|FBAV|Instagram|Line\/|GSA\/|Twitter|TikTok|MicroMessenger|DuckDuckGo)/i.test(ua)
      && !modes.some(function (mode) { return mode && mode.matches; }) && !navigator.standalone && window.self === window.top
      && !window.Capacitor && !window.MADO_NATIVE_APP && !window.MADO_EMBEDDED_WEB
      && new URLSearchParams(location.search).get("from") !== "android-app";
  }
  function read() {
    var raw = localStorage.getItem(key);
    if (raw === null) return null;
    var value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)
        || (!value.stop && (!Number.isFinite(value.until) || value.until < 0))) throw new Error("invalid invite state");
    return value;
  }
  try {
    if (!browser() || !("IntersectionObserver" in window)) return;
    var prior = read();
    // Corrupt or unrecognised state also suppresses the invitation.
    if (prior && (prior.stop || typeof prior.until !== "number" || prior.until > Date.now())) return;
    // Check storage writes without claiming an invitation before it is seen.
    var probe = key + "-probe-" + Math.random();
    try {
      localStorage.setItem(probe, "1");
      if (localStorage.getItem(probe) !== "1") return;
    } finally { localStorage.removeItem(probe); }
    root.classList.add("android-invite-eligible");
  } catch (error) { return; } // Storage unavailable: never show a repeatable prompt.

  function hide() {
    if (!card) return;
    // Keep the footprint in this document: dismissal/storage/BFCache cause no shift.
    card.style.visibility = "hidden";
    card.setAttribute("aria-hidden", "true");
    card.inert = true;
    root.classList.remove("android-invite-eligible");
  }
  function refresh() {
    try {
      var state = read();
      if (!browser() || (state && (state.stop || (state.until > Date.now() && (!claim || state.token !== claim.token))))
          || (claim && (!state || state.token !== claim.token))) hide();
    }
    catch (error) { hide(); }
  }
  function stop() {
    try { localStorage.setItem(key, JSON.stringify({ stop: true })); }
    catch (error) { /* This document still stays hidden. Future storage failure fails closed. */ }
  }
  function track(name) {
    // Use only the site's existing analytics gate; never initialise analytics here.
    if (window.MADO_ANALYTICS_DISABLED === false && typeof window.gtag === "function") {
      window.gtag("event", name, {
        entry_source: "android_browser_inline", language: root.lang,
        cta_id: "android_browser_inline", page_context: /guide\.html$/.test(location.pathname) ? "fuji_guide" : "landing"
      });
    }
  }
  function seen() {
    if (claim || pending || !card || card.inert || ratio < 0.5 || document.visibilityState !== "visible") return;
    pending = true;
    function commit() {
      // Recheck after waiting for another tab. Locks serialize claims where supported.
      refresh();
      if (card.inert || ratio < 0.5 || document.visibilityState !== "visible") return;
      var next = { until: Date.now() + 7 * 86400000, token: Date.now() + ":" + Math.random() };
      localStorage.setItem(key, JSON.stringify(next));
      if (read().token !== next.token) { hide(); return; }
      claim = next;
      track("android_app_invite_view");
      observer.disconnect();
    }
    if (navigator.locks && typeof navigator.locks.request === "function") {
      try {
        navigator.locks.request(key + "-view", commit).then(function () { pending = false; }, function () { pending = false; hide(); });
      } catch (error) { pending = false; hide(); }
    } else {
      // Storage recheck/write/verify is best effort; storage alone is not atomic across tabs.
      try { commit(); } catch (error) { hide(); }
      pending = false;
    }
  }
  document.addEventListener("DOMContentLoaded", function () {
    card = document.querySelector(".android-invite");
    if (!card) return;
    // Retain space even when another tab dismisses between head parsing and DOM ready.
    card.classList.add("android-invite-reserved");
    refresh();
    card.querySelector("button").addEventListener("click", function () {
      stop(); track("android_app_invite_dismiss");
      var section = card.nextElementSibling;
      var next = section && section.querySelector("h2");
      if (next) next.setAttribute("tabindex", "-1");
      else next = document.querySelector(".footer a");
      if (next) next.focus({ preventScroll: true });
      hide();
    });
    card.querySelector("a").addEventListener("click", function () {
      stop(); track("android_install_click");
      // Preserve the link until the ordinary navigation completes; no redirect or popup.
    });
    observer = new IntersectionObserver(function (entries) {
      ratio = entries[0].isIntersecting ? entries[0].intersectionRatio : 0;
      seen();
    }, { threshold: 0.5 });
    observer.observe(card);
  }, { once: true });
  window.addEventListener("storage", function (event) { if (event.key === key || event.key === null) refresh(); });
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", function () { refresh(); seen(); });
  modes.forEach(function (mode) {
    if (mode && mode.addEventListener) mode.addEventListener("change", refresh);
    else if (mode && mode.addListener) mode.addListener(refresh);
  });
}());
