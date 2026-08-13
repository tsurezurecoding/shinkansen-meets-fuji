/* 新幹線の窓 — 花火キュレーションページ
 *
 * 埋め込みが20件を超えるため、初期表示では1件もDOMへ入れない。
 * - X（旧Twitter）: blockquote を <template> に保持し、交差したものだけ複製して widgets.js に描画させる
 * - YouTube: クリックするまで iframe を作らない（サードパーティ通信も発生させない）
 * JSが無効でも、各カードのクレジット行が元投稿への通常リンクとして機能する。
 */
(function (root) {
  "use strict";
  if (!root || !root.document) return;
  var doc = root.document;

  var X_SCRIPT = "https://platform.twitter.com/widgets.js";
  var ROOT_MARGIN = "300px 0px";

  function ensureXWidgets(callback) {
    if (root.twttr && root.twttr.widgets && typeof root.twttr.widgets.load === "function") {
      callback(root.twttr.widgets);
      return;
    }
    var queue = root.__MADO_X_QUEUE;
    if (!queue) {
      queue = root.__MADO_X_QUEUE = [];
      var script = doc.createElement("script");
      script.async = true;
      script.charset = "utf-8";
      script.src = X_SCRIPT;
      script.onload = function () {
        var widgets = root.twttr && root.twttr.widgets;
        var pending = root.__MADO_X_QUEUE || [];
        root.__MADO_X_QUEUE = null;
        if (!widgets || typeof widgets.load !== "function") {
          pending.forEach(function (fn) { fn(null); });
          return;
        }
        pending.forEach(function (fn) { fn(widgets); });
      };
      script.onerror = function () {
        var pending = root.__MADO_X_QUEUE || [];
        root.__MADO_X_QUEUE = null;
        pending.forEach(function (fn) { fn(null); });
      };
      doc.head.appendChild(script);
    }
    queue.push(callback);
  }

  function settle(embed, frame) {
    embed.classList.remove("is-loading");
    embed.setAttribute("aria-busy", "false");
    if (frame.querySelector("twitter-widget, iframe, .twitter-tweet-rendered")) {
      embed.classList.add("has-widget");
    }
  }

  function activateX(embed) {
    var frame = embed.querySelector(".hb-media-frame");
    var template = frame && frame.querySelector("template");
    if (!frame || !template) return;

    frame.appendChild(template.content.cloneNode(true));
    template.remove();
    embed.classList.add("is-loading");
    embed.setAttribute("aria-busy", "true");

    ensureXWidgets(function (widgets) {
      if (!widgets) {
        settle(embed, frame);
        return;
      }
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        settle(embed, frame);
      };
      // widgets.load は Promise を返さない環境があるため、DOM変化と時間切れの両方で確定させる
      var observer = new root.MutationObserver(function () {
        if (frame.querySelector("twitter-widget, iframe, .twitter-tweet-rendered")) {
          observer.disconnect();
          finish();
        }
      });
      observer.observe(frame, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      root.setTimeout(function () { observer.disconnect(); finish(); }, 6000);
      try {
        widgets.load(frame);
      } catch (error) {
        observer.disconnect();
        finish();
      }
    });
  }

  function activateYouTube(embed) {
    var frame = embed.querySelector(".hb-media-frame");
    var button = embed.querySelector(".hb-facade");
    var videoId = embed.getAttribute("data-video-id");
    if (!frame || !button || !videoId) return;
    button.addEventListener("click", function () {
      var iframe = doc.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?autoplay=1";
      iframe.title = embed.getAttribute("data-video-title") || "YouTubeの動画";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      button.remove();
      frame.appendChild(iframe);
      embed.classList.add("has-widget");
    });
  }

  function init() {
    var embeds = Array.prototype.slice.call(doc.querySelectorAll(".hb-embed"));
    if (!embeds.length) return;

    embeds.forEach(function (embed) {
      if (embed.getAttribute("data-embed") === "youtube") activateYouTube(embed);
    });

    var lazy = embeds.filter(function (embed) { return embed.getAttribute("data-embed") === "x"; });
    if (!lazy.length) return;

    if (typeof root.IntersectionObserver !== "function") {
      lazy.forEach(activateX);
      return;
    }

    var observer = new root.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && !(entry.intersectionRatio > 0)) return;
        observer.unobserve(entry.target);
        activateX(entry.target);
      });
    }, { rootMargin: ROOT_MARGIN });

    lazy.forEach(function (embed) { observer.observe(embed); });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
}(typeof window !== "undefined" ? window : globalThis));
