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

  if (requested === "ja") {
    try { localStorage.setItem("mado-lang", "ja"); } catch (error) {}
    return;
  }

  // ブラウザの言語設定だけを根拠にした自動リダイレクトはしない。
  // Googlebot は英語相当の言語設定でクロールしJSも実行するため、以前ここで
  // navigator.language を見て英語版へ飛ばしていた結果、日本語URLが英語版の
  // タイトル・説明文でインデックスされ、日本語クエリで出なくなっていた
  // （2026-07-27に /spots/kiyosu.html で発覚）。言語の出し分けは hreflang と
  // ヘッダの言語切替に任せ、ここは利用者が明示的に選んだ時だけ動かす。
  if (requested !== "en" && saved !== "en") return;

  try { localStorage.setItem("mado-lang", "en"); } catch (error) {}
  location.replace(new URL(targetRoute, document.baseURI).href);
})();
