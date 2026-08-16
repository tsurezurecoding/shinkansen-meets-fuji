(function (root) {
  "use strict";

  if (!root || !root.document || !root.location) return;

  var document = root.document;
  var EMBEDDED_QUERY = "android-app";
  var MESSAGE_VERSION = 1;
  var MESSAGE_SOURCE = "michikusa-embedded-web";
  var PUBLIC_ORIGIN = "https://www.michikusa-travel.com";
  var PUBLIC_SITE = PUBLIC_ORIGIN + "/";
  // Capacitor Android serves the local bundle from https://localhost by
  // default, while this child runs on PUBLIC_ORIGIN. The referrer is not a
  // reliable contract for a custom Capacitor host, and these messages carry
  // only public navigation/analytics metadata. Use a wildcard for outbound
  // delivery; the local parent accepts messages only after exact origin,
  // source, schema, and route validation in web-content-host.js.
  var PARENT_TARGET_ORIGIN = "*";

  var query;
  try {
    query = new URLSearchParams(root.location.search);
  } catch (error) {
    query = null;
  }
  if (!query || query.get("from") !== EMBEDDED_QUERY) return;

  root.MADO_EMBEDDED_WEB = true;
  root.MADO_EMBEDDED_WEB_VERSION = MESSAGE_VERSION;
  root.MADO_EMBEDDED_PUBLIC_ORIGIN = PUBLIC_ORIGIN;
  root.MADO_ANALYTICS_DISABLED = false;
  document.documentElement.classList.add("mado-embedded-web");
  document.documentElement.setAttribute("data-mado-embedded-version", String(MESSAGE_VERSION));

  // A Capacitor bridge belongs to the local host, never to the remote article.
  // The cross-origin iframe already prevents parent access, but removing the
  // global if a WebView injected one makes the boundary explicit on the child.
  try {
    if ("Capacitor" in root) root.Capacitor = undefined;
  } catch (error) {
    // A non-configurable bridge is still isolated by the iframe origin.
  }

  function pathName(url) {
    return String(url.pathname || "/").replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  }

  function isSupportedWebPath(path) {
    return /^\/spots\/[a-z0-9][a-z0-9-]*\.html$/i.test(path)
      || /^\/en\/spots\/[a-z0-9][a-z0-9-]*\.html$/i.test(path)
      || path === "/sparkling-dreams.html"
      || path === "/en/sparkling-dreams.html"
      || path === "/hanabi.html"
      || path === "/en/hanabi.html"
      || path === "/yakei.html"
      || path === "/en/yakei.html"
      || path === "/727-collection.html";
  }

  function cleanPublicUrl(value) {
    var url;
    try {
      url = value instanceof URL ? new URL(value.href) : new URL(String(value), root.location.href);
    } catch (error) {
      return "";
    }
    if (url.protocol !== "https:" || url.origin !== PUBLIC_ORIGIN) return "";
    url.searchParams.delete("from");
    url.searchParams.delete("madoBuild");
    if (url.searchParams.get("lang") === "ja") url.searchParams.delete("lang");
    return url.href;
  }

  function languageFor(path) {
    return /^\/en(?:\/|$)/i.test(path) ? "en" : "ja";
  }

  function contentMeta(url) {
    var path = pathName(url);
    var match = path.match(/^\/(?:en\/)?spots\/([a-z0-9][a-z0-9-]*)\.html$/i);
    var contentType = "utility";
    var contentId = path.replace(/^\/(?:en\/)?/, "").replace(/\.html$/i, "");
    if (match) {
      contentType = "spot_detail";
      contentId = match[1];
    } else if (contentId === "sparkling-dreams") {
      contentType = "sparkling_dreams";
    } else if (contentId === "hanabi") {
      contentType = "hanabi";
    } else if (contentId === "yakei") {
      contentType = "yakei";
    } else if (contentId === "727-collection") {
      contentType = "727_collection";
    }
    return {
      content_type: contentType,
      content_id: contentId,
      content_path: path,
      language: languageFor(path),
      page_location: cleanPublicUrl(url.href),
    };
  }

  function safeParams(value, depth) {
    if (depth > 3 || value === null || value === undefined) return value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.slice(0, 20).map(function (item) { return safeParams(item, depth + 1); });
    if (typeof value !== "object") return undefined;
    var result = {};
    Object.keys(value).slice(0, 60).forEach(function (key) {
      if (!/^[A-Za-z0-9_.-]{1,80}$/.test(key)) return;
      var item = safeParams(value[key], depth + 1);
      if (item !== undefined && typeof item !== "function") result[key] = item;
    });
    return result;
  }

  function post(type, payload) {
    if (!root.parent || root.parent === root) return false;
    var message = {
      source: MESSAGE_SOURCE,
      version: MESSAGE_VERSION,
      type: type,
      payload: safeParams(payload || {}, 0),
    };
    try {
      root.parent.postMessage(message, PARENT_TARGET_ORIGIN);
      return true;
    } catch (error) {
      return false;
    }
  }

  function bridgeGtag() {
    var args = Array.prototype.slice.call(arguments);
    if (args[0] !== "event" || typeof args[1] !== "string" || !args[1]) return;
    post("analytics-event", {
      name: args[1],
      params: safeParams(args[2] && typeof args[2] === "object" ? args[2] : {}, 0),
    });
  }

  root.MADO_EMBEDDED_GTAG = bridgeGtag;
  root.gtag = bridgeGtag;

  function nativeRouteFor(url) {
    var path = pathName(url);
    var hash = url.hash || "";
    if (path === "/" || path === "/index.html") return "index.html" + (hash || "#journey");
    if (path === "/en" || path === "/en/index.html") return "en/index.html" + (hash || "#journey");
    if (path === "/zukan.html") return "zukan.html";
    if (path === "/en/zukan.html") return "en/zukan.html";
    if (path === "/journal.html") return "journal.html";
    if (path === "/en/journal.html") return "en/journal.html";
    if (path === "/live" || path === "/live/index.html") return "live/index.html";
    if (path === "/en/live" || path === "/en/live/index.html") return "en/live/index.html";
    return "";
  }

  function samePageAnchor(url) {
    return url.origin === root.location.origin
      && pathName(url) === pathName(root.location)
      && url.search === root.location.search
      && Boolean(url.hash);
  }

  function handleLinkClick(event) {
    var target = event.target;
    var link = target && target.closest ? target.closest("a[href]") : null;
    if (!link || link.hasAttribute("download") || link.getAttribute("aria-disabled") === "true") return;
    var rawHref = link.getAttribute("href") || "";
    if (!rawHref || /^(?:#|mailto:|tel:|javascript:)/i.test(rawHref)) return;

    var url;
    try {
      url = new URL(rawHref, root.location.href);
    } catch (error) {
      return;
    }
    if (samePageAnchor(url)) return;

    var explicitRoute = link.getAttribute("data-native-route");
    if (explicitRoute && /^(?:settings|index\.html(?:#.*)?|en\/index\.html(?:#.*)?|zukan\.html|en\/zukan\.html|journal\.html|en\/journal\.html|live\/index\.html|en\/live\/index\.html)$/.test(explicitRoute)) {
      event.preventDefault();
      post("navigation", { kind: "native", route: explicitRoute });
      return;
    }

    if (url.origin === PUBLIC_ORIGIN) {
      var route = nativeRouteFor(url);
      if (route) {
        event.preventDefault();
        post("navigation", { kind: "native", route: route });
        return;
      }
      if (isSupportedWebPath(pathName(url))) {
        event.preventDefault();
        post("navigation", {
          kind: "web",
          path: pathName(url),
          search: url.search,
          hash: url.hash,
        });
        return;
      }
    }

    var externalUrl = cleanPublicUrl(url.href);
    if (!externalUrl && (url.protocol === "http:" || url.protocol === "https:")) externalUrl = url.href;
    if (!externalUrl) return;
    event.preventDefault();
    post("external", { url: externalUrl });
  }

  function patchShare() {
    if (!root.navigator || typeof root.navigator.share !== "function") return;
    var originalShare = root.navigator.share.bind(root.navigator);
    root.navigator.share = function (data) {
      var next = Object.assign({}, data || {});
      if (next.url) next.url = cleanPublicUrl(next.url) || next.url;
      return originalShare(next);
    };
  }

  function announceContentReady() {
    var url;
    try {
      url = new URL(root.location.href);
    } catch (error) {
      return;
    }
    var meta = contentMeta(url);
    post("content-ready", meta);
  }

  document.addEventListener("click", handleLinkClick, true);
  patchShare();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", announceContentReady, { once: true });
  else announceContentReady();
}(typeof window !== "undefined" ? window : globalThis));
