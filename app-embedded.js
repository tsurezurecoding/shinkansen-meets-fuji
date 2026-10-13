(function (root) {
  "use strict";

  if (!root || !root.document || !root.location) return;

  var document = root.document;
  var EMBEDDED_QUERY = "android-app";
  var MESSAGE_VERSION = 1;
  var MESSAGE_SOURCE = "michikusa-embedded-web";
  var HOST_MESSAGE_SOURCE = "michikusa-native-host";
  var TRUSTED_PARENT_ORIGIN = "https://localhost";
  var PUBLIC_ORIGIN = "https://www.michikusa-travel.com";
  var LANGUAGES = ["ja", "en", "zh-Hant", "fr", "de", "es", "zh-Hans", "ko"];
  var EDITION_PATTERN = /^\/(en|zh-Hant|fr|de|es|zh-Hans|ko)(?:\/|$)/i;
  var NATIVE_HASHES = {
    home: ["", "#journey"],
    train: ["", "#journey", "#timelineSection"],
    gallery: [""],
    journal: ["", "#stampboard"],
    live: [""],
    settings: [""],
  };
  var hostCapabilities = null;
  var NOTICE_COPY = {
    ja: { native: "この操作はアプリのメニューから開いてください。記事はこのまま読めます。", article: "このリンクは現在のアプリ内では開けません。ブラウザで読むことができます。", browser: "ブラウザで読む", close: "閉じる" },
    en: { native: "Use the app menu for this action. You can keep reading this article here.", article: "This link cannot open inside this version of the app. You can read it in your browser.", browser: "Read in browser", close: "Dismiss" },
    "zh-Hant": { native: "請從應用程式選單使用此功能。您可以繼續閱讀這篇文章。", article: "此版本的應用程式無法在內部開啟這個連結。您可以在瀏覽器閱讀。", browser: "在瀏覽器閱讀", close: "關閉" },
    fr: { native: "Utilisez le menu de l’application pour cette action. Vous pouvez continuer à lire cet article ici.", article: "Ce lien ne peut pas s’ouvrir dans cette version de l’application. Vous pouvez le lire dans votre navigateur.", browser: "Lire dans le navigateur", close: "Fermer" },
    de: { native: "Nutzen Sie für diese Aktion das App-Menü. Sie können den Artikel hier weiterlesen.", article: "Dieser Link lässt sich in dieser App-Version nicht öffnen. Sie können ihn im Browser lesen.", browser: "Im Browser lesen", close: "Schließen" },
    es: { native: "Utiliza el menú de la aplicación para esta acción. Puedes seguir leyendo este artículo aquí.", article: "Este enlace no se puede abrir dentro de esta versión de la aplicación. Puedes leerlo en el navegador.", browser: "Leer en el navegador", close: "Cerrar" },
    "zh-Hans": { native: "请从应用菜单使用此功能。您可以继续阅读这篇文章。", article: "此版本的应用无法在内部打开这个链接。您可以在浏览器阅读。", browser: "在浏览器阅读", close: "关闭" },
    ko: { native: "이 기능은 앱 메뉴에서 열어 주세요. 이 기사는 여기서 계속 읽을 수 있습니다.", article: "이 버전의 앱 안에서는 이 링크를 열 수 없습니다. 브라우저에서 읽을 수 있습니다.", browser: "브라우저에서 읽기", close: "닫기" },
  };
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
    var route = stripEdition(path);
    return /^\/spots\/[a-z0-9][a-z0-9-]*\.html$/i.test(route)
      || /^\/(?:sparkling-dreams|hanabi|yakei|727-collection|castles|ferris-wheels|window-moments)\.html$/.test(route);
  }

  function stripEdition(path) {
    return path.replace(EDITION_PATTERN, "/");
  }

  function legacyWebPath(path) {
    // Android 1.0.27 has these JA/EN routes. No capabilities response is an
    // old host, not permission to send it a new native navigation contract.
    return (languageFor(path) === "ja" || languageFor(path) === "en")
      && path !== "/en/727-collection.html"
      && isSupportedWebPath(path);
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
    var match = path.match(EDITION_PATTERN);
    if (!match) return "ja";
    return LANGUAGES.filter(function (language) { return language.toLowerCase() === match[1].toLowerCase(); })[0] || "ja";
  }

  function contentMeta(url) {
    var path = pathName(url);
    var route = stripEdition(path);
    var match = route.match(/^\/spots\/([a-z0-9][a-z0-9-]*)\.html$/i);
    var contentType = "utility";
    var contentId = route.replace(/^\//, "").replace(/\.html$/i, "");
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
    } else if (contentId === "castles" || contentId === "ferris-wheels" || contentId === "window-moments") {
      contentType = contentId.replace(/-/g, "_");
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

  function plainObject(value) {
    if (!value || typeof value !== "object") return false;
    var prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function handleHostMessage(event) {
    if (!root.parent || root.parent === root || event.source !== root.parent || event.origin !== TRUSTED_PARENT_ORIGIN) return;
    var message = event.data;
    if (!plainObject(message) || message.source !== HOST_MESSAGE_SOURCE || message.version !== MESSAGE_VERSION
      || message.type !== "capabilities" || !plainObject(message.payload)) return;
    var payload = message.payload;
    if (payload.navigationVersion !== 2 || LANGUAGES.indexOf(payload.language) < 0
      || Object.keys(payload).some(function (key) { return key !== "navigationVersion" && key !== "language"; })) return;
    hostCapabilities = { navigationVersion: 2, language: payload.language };
    var notice = document.getElementById("mado-embedded-navigation-notice");
    if (notice) notice.hidden = true;
  }

  function navigationNotice(kind, url) {
    if (!document.body) return;
    var language = hostCapabilities ? hostCapabilities.language : languageFor(pathName(root.location));
    var copy = NOTICE_COPY[language] || NOTICE_COPY.en;
    var notice = document.getElementById("mado-embedded-navigation-notice");
    if (!notice) {
      notice = document.createElement("aside");
      notice.id = "mado-embedded-navigation-notice";
      notice.className = "mado-embedded-navigation-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      document.body.appendChild(notice);
    }
    notice.textContent = "";
    notice.lang = language;
    var text = document.createElement("p");
    text.textContent = copy[kind];
    notice.appendChild(text);
    if (url) {
      var link = document.createElement("a");
      link.href = cleanPublicUrl(url.href);
      link.textContent = copy.browser;
      link.setAttribute("data-mado-open-browser", "true");
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
      notice.appendChild(link);
    }
    var dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = copy.close;
    dismiss.addEventListener("click", function () { notice.hidden = true; });
    notice.appendChild(dismiss);
    notice.hidden = false;
  }

  function nativeDestinationFor(url) {
    var route = stripEdition(pathName(url));
    var screens = {
      "/": "home", "/index.html": "home", "/start.html": "train", "/zukan.html": "gallery",
      "/journal.html": "journal", "/live": "live", "/live/index.html": "live",
    };
    var screen = screens[route];
    if (!screen) return null;
    var hash = url.hash || "";
    return { screen: screen, hash: NATIVE_HASHES[screen].indexOf(hash) >= 0 ? hash : "" };
  }

  function explicitNativeDestination(value) {
    if (value === "settings") return { screen: "settings", hash: "" };
    // This attribute is an app route, never an arbitrary URL or query string.
    if (!/^(?:(?:en|zh-Hant|fr|de|es|zh-Hans|ko)\/)?(?:index\.html|start\.html|zukan\.html|journal\.html|live\/index\.html)(?:#[A-Za-z0-9_-]+)?$/.test(value || "")) return null;
    return nativeDestinationFor(new URL(value, PUBLIC_ORIGIN + "/"));
  }

  function requestNativeNavigation(destination) {
    if (!hostCapabilities || !post("navigation", { kind: "native", screen: destination.screen, hash: destination.hash })) {
      navigationNotice("native");
    }
  }

  function samePageAnchor(url) {
    if (!url.hash || url.origin !== PUBLIC_ORIGIN || url.origin !== root.location.origin || pathName(url) !== pathName(root.location)) return false;
    var current = new URL(cleanPublicUrl(root.location.href));
    var target = new URL(cleanPublicUrl(url.href));
    return target.search === current.search;
  }

  function handleLinkClick(event) {
    var target = event.target;
    var link = target && target.closest ? target.closest("a[href]") : null;
    if (!link || link.hasAttribute("download") || link.getAttribute("aria-disabled") === "true") return;
    var explicitRoute = explicitNativeDestination(link.getAttribute("data-native-route"));
    if (explicitRoute) {
      event.preventDefault();
      requestNativeNavigation(explicitRoute);
      return;
    }
    var rawHref = link.getAttribute("href") || "";
    if (!rawHref || /^(?:#|mailto:|tel:|javascript:)/i.test(rawHref)) return;

    var url;
    try {
      url = new URL(rawHref, document.baseURI || root.location.href);
    } catch (error) {
      return;
    }
    if (samePageAnchor(url)) {
      event.preventDefault();
      root.location.hash = url.hash;
      return;
    }

    if (url.origin === PUBLIC_ORIGIN && !link.hasAttribute("data-mado-open-browser")) {
      var route = nativeDestinationFor(url);
      if (route) {
        event.preventDefault();
        requestNativeNavigation(route);
        return;
      }
      if (isSupportedWebPath(pathName(url))) {
        event.preventDefault();
        if (!(hostCapabilities || legacyWebPath(pathName(url))) || !post("navigation", {
          kind: "web",
          path: pathName(url),
          search: url.search,
          hash: url.hash,
        })) navigationNotice("article", url);
        return;
      }
    }

    var externalUrl = cleanPublicUrl(url.href);
    if (!externalUrl && (url.protocol === "http:" || url.protocol === "https:")) externalUrl = url.href;
    if (!externalUrl) return;
    var externalRequest = { url: externalUrl };
    if (link.getAttribute("data-mado-open-browser") === "true") externalRequest.forceBrowser = true;
    if (post("external", externalRequest)) event.preventDefault();
    else link.href = externalUrl;
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
  root.addEventListener("message", handleHostMessage);
  root.addEventListener("pageshow", announceContentReady);
  root.addEventListener("hashchange", announceContentReady);
  patchShare();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", announceContentReady, { once: true });
  else announceContentReady();
}(typeof window !== "undefined" ? window : globalThis));
