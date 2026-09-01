(function () {
  "use strict";

  // 外部動画は保存せず、X / YouTube の公式埋め込みだけを使う。
  // YouTube はクリックされたときに、X は画面に近づいたときに読み込む。

  var xScriptPromise = null;

  function loadXScript() {
    if (window.twttr && window.twttr.widgets) return Promise.resolve(window.twttr);
    if (xScriptPromise) return xScriptPromise;

    xScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      script.onload = function () { resolve(window.twttr); };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return xScriptPromise;
  }

  function activateXCard(card) {
    if (!card || card.dataset.activated === "true") return;
    card.dataset.activated = "true";

    var frame = card.querySelector(".wm-x");
    var template = frame && frame.querySelector("template");
    if (!frame || !template) return;

    frame.classList.add("is-loading");
    frame.appendChild(template.content.cloneNode(true));
    template.remove();

    loadXScript().then(function (twttr) {
      if (!twttr || !twttr.widgets) throw new Error("X widgets unavailable");
      return twttr.widgets.load(frame);
    }).then(function () {
      frame.classList.remove("is-loading");
      frame.classList.add("is-loaded");
    }).catch(function () {
      frame.classList.remove("is-loading");
    });
  }

  function activateYoutubeCard(card) {
    var facade = card.querySelector(".wm-facade");
    if (!facade || facade.dataset.activated === "true") return;
    facade.dataset.activated = "true";

    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(card.dataset.videoId) + "?autoplay=1";
    iframe.title = card.dataset.videoTitle || "YouTube動画";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    facade.replaceChildren(iframe);
  }

  document.querySelectorAll('[data-embed="youtube"]').forEach(function (card) {
    var button = card.querySelector(".wm-facade button");
    if (button) button.addEventListener("click", function () { activateYoutubeCard(card); });
  });

  var xCards = Array.prototype.slice.call(document.querySelectorAll('[data-embed="x"]'));
  if (!("IntersectionObserver" in window)) {
    xCards.forEach(activateXCard);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      activateXCard(entry.target);
    });
  }, { rootMargin: "320px 0px" });

  xCards.forEach(function (card) { observer.observe(card); });
})();
