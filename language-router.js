(function () {
  "use strict";

  var path = location.pathname.replace(/\/+$/, "/");
  if (/\/en(?:\/|$)/.test(path)) return;

  var routes = {
    "/": "en/",
    "/index.html": "en/",
    "/zukan.html": "en/zukan.html",
    "/journal.html": "en/journal.html",
    "/mieru.html": "en/mieru.html",
    "/sumie.html": "en/sumie.html",
    "/somato.html": "en/somato.html",
    "/guide.html": "en/guide.html",
    "/contact.html": "en/contact.html",
    "/references.html": "en/references.html",
    "/privacy.html": "en/privacy.html",
    "/lp.html": "en/lp.html",
    "/live/": "../en/live/",
    "/live/index.html": "../en/live/"
  };
  var key = Object.keys(routes).sort(function (a, b) {
    return b.length - a.length;
  }).find(function (candidate) {
    if (candidate === "/") return path === "/";
    return path === candidate || path.endsWith(candidate);
  });
  var spotMatch = path.match(/\/spots\/([^/]+\.html)$/);
  var targetRoute = key ? routes[key] : (spotMatch ? `../en/spots/${spotMatch[1]}` : "");
  if (!targetRoute) return;

  var requested = new URLSearchParams(location.search).get("lang");
  var saved = null;
  try { saved = localStorage.getItem("mado-lang"); } catch (error) {}
  var browserLanguages = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ""];
  var prefersEnglish = browserLanguages.some(function (value) {
    return /^en\b/i.test(String(value));
  }) && !browserLanguages.some(function (value) {
    return /^ja\b/i.test(String(value));
  });

  if (requested === "ja") {
    try { localStorage.setItem("mado-lang", "ja"); } catch (error) {}
    return;
  }
  if (requested !== "en" && saved === "ja") return;
  if (requested !== "en" && saved !== "en" && !prefersEnglish) return;

  try { localStorage.setItem("mado-lang", "en"); } catch (error) {}
  location.replace(new URL(targetRoute, document.baseURI).href);
})();
