/* Inlined at build time: no extra request, bridge, SDK or install detection. */
(function () {
  "use strict";
  var key = "mado-android-invite-v1", root = document.documentElement, claim, card;
  var media = window.matchMedia("(display-mode: browser)");
  function browser() {
    var ua = navigator.userAgent || "";
    return /Android/i.test(ua) && /(?:Chrome|Firefox|SamsungBrowser|EdgA|OPR)\//i.test(ua)
      && !/(?:\bwv\b|Version\/4\.0|FBAN|FBAV|Instagram|Line\/|GSA\/|Twitter|TikTok|MicroMessenger|DuckDuckGo)/i.test(ua)
      && media.matches && !navigator.standalone && window.self === window.top
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
    if (!browser()) return;
    var prior = read();
    // Corrupt or unrecognised state also suppresses the invitation.
    if (prior && (prior.stop || typeof prior.until !== "number" || prior.until > Date.now())) return;
    claim = { until: Date.now() + 7 * 86400000, token: Date.now() + ":" + Math.random() };
    localStorage.setItem(key, JSON.stringify(claim));
    if (read().token !== claim.token) return;
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
    try { if (!browser() || read().token !== claim.token || read().stop) hide(); }
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
  document.addEventListener("DOMContentLoaded", function () {
    card = document.querySelector(".android-invite");
    if (!card) return;
    // Retain space even when another tab dismisses between head parsing and DOM ready.
    card.classList.add("android-invite-reserved");
    refresh();
    card.querySelector("button").addEventListener("click", function () {
      stop(); track("android_app_invite_dismiss");
      var next = document.querySelector(".footer a");
      if (next) next.focus({ preventScroll: true });
      hide();
    });
    card.querySelector("a").addEventListener("click", function () {
      stop(); track("android_install_click");
      // Preserve the link until the ordinary navigation completes; no redirect or popup.
    });
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !card.inert) {
          track("android_app_invite_view"); observer.disconnect();
        }
      }, { threshold: 0.5 });
      observer.observe(card);
    }
  }, { once: true });
  window.addEventListener("storage", function (event) { if (event.key === key || event.key === null) refresh(); });
  window.addEventListener("pageshow", refresh);
  if (media.addEventListener) media.addEventListener("change", refresh);
}());
