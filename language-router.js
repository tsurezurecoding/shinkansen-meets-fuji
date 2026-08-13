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
    "/sparkling-dreams.html": "en/sparkling-dreams.html",
    "/hanabi.html": "en/hanabi.html",
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

  // 利用者が明示的に選んだ時だけ英語版へ移す。
  if (requested === "en" || saved === "en") {
    try { localStorage.setItem("mado-lang", "en"); } catch (error) {}
    location.replace(new URL(targetRoute, document.baseURI).href);
    return;
  }

  // ブラウザの言語設定だけを根拠にした自動リダイレクトはしない。
  // Googlebot は英語相当の言語設定でクロールしJSも実行するため、以前ここで
  // navigator.language を見て英語版へ飛ばしていた結果、日本語URLが英語版の
  // タイトル・説明文でインデックスされ、日本語クエリで出なくなっていた
  // （2026-07-28に /spots/kiyosu.html で発覚）。
  // 代わりに、英語ブラウザには「英語版がある」ことを知らせるだけにして、
  // 移動するかどうかは利用者に委ねる。クローラーは何も起きないので索引は日本語のまま。
  if (saved) return;

  var languages = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ""];
  var prefersEnglish = languages.some(function (value) {
    return /^en\b/i.test(String(value));
  }) && !languages.some(function (value) {
    return /^ja\b/i.test(String(value));
  });
  if (!prefersEnglish) return;

  try {
    if (sessionStorage.getItem("mado-en-landing-prompt-dismissed") === "1") return;
  } catch (error) { return; }

  function track(name) {
    if (window.MADO_ANALYTICS_DISABLED) return;
    if (typeof window.gtag === "function") {
      window.gtag("event", name, {
        language: "ja",
        page_context: spotMatch ? "spot_page" : "page",
        source: "lang_router"
      });
    }
  }

  function showNotice() {
    // index.html は app.js 側が同じ案内を出すので、二重に出さない
    if (document.querySelector(".lang-landing-prompt")) return;
    var href = new URL(targetRoute, document.baseURI).href;
    var prompt = document.createElement("aside");
    prompt.className = "lang-landing-prompt";
    prompt.setAttribute("aria-label", "English version");

    var text = document.createElement("div");
    var strong = document.createElement("strong");
    strong.textContent = "English version available";
    var span = document.createElement("span");
    span.textContent = "This page is also available in English.";
    text.appendChild(strong);
    text.appendChild(span);

    var link = document.createElement("a");
    link.href = href;
    link.textContent = "Open English";
    link.addEventListener("click", function () {
      try { localStorage.setItem("mado-lang", "en"); } catch (error) {}
      track("english_landing_prompt_click");
    });

    var close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss English version prompt");
    close.innerHTML = "&times;";
    close.addEventListener("click", function () {
      try { sessionStorage.setItem("mado-en-landing-prompt-dismissed", "1"); } catch (error) {}
      prompt.remove();
    });

    prompt.appendChild(text);
    prompt.appendChild(link);
    prompt.appendChild(close);
    document.body.prepend(prompt);
    track("english_landing_prompt_shown");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showNotice);
  } else {
    showNotice();
  }
})();
