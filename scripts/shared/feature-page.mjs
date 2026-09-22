// 特集ページの共通部品。各生成器が同じ塊を持たないようにする（FEATURE-GEN-0922）。

// GAの読み込みブロック。**2種類あるのは現状の写しで、意図的な差ではない。**
// `withEmbeddedGuard` は Android シェル（`MADO_EMBEDDED_WEB`）の中では自前のGAを読まない。
// 花火・夜景・一度きりの車窓・ディズニー・727・TOP・列車選択はこちら。
// `plain` はガードが無い古い写しで、城・観覧車・あれ何？・図鑑・富士山ガイドがこちら
// （これらは生成時に zukan.html からこのブロックを読んでいた）。
// どちらに揃えるかはアプリ内計測の扱いの判断なので、ここでは現状を保つ。
export const ANALYTICS = {
  withEmbeddedGuard: `  <script>
    (function () {
      if (window.MADO_EMBEDDED_WEB) return;
      var measurementId = "G-C2ESB694FV";
      var optoutKey = "mado-ga-optout";
      var params = new URLSearchParams(window.location.search);
      var host = window.location.hostname;
      var isNativeApp = !!(window.Capacitor && ((typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) || (typeof window.Capacitor.getPlatform === "function" && window.Capacitor.getPlatform() !== "web")));
      var isLocalPreview = !isNativeApp && (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1");
      var storageOptedOut = false;

      try {
        if (params.get("ga") === "off" || params.get("ga_optout") === "1") localStorage.setItem(optoutKey, "1");
        if (params.get("ga") === "on" || params.get("ga_optout") === "0") localStorage.removeItem(optoutKey);
        storageOptedOut = localStorage.getItem(optoutKey) === "1";
      } catch (error) {
        storageOptedOut = false;
      }

      window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut;
      window["ga-disable-" + measurementId] = window.MADO_ANALYTICS_DISABLED;
      if (window.MADO_ANALYTICS_DISABLED) return;

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      var script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", measurementId);
    })();
  </script>`,
  plain: `  <script>
    (function () {
      var measurementId = "G-C2ESB694FV";
      var optoutKey = "mado-ga-optout";
      var params = new URLSearchParams(window.location.search);
      var host = window.location.hostname;
      var isNativeApp = !!(window.Capacitor && ((typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) || (typeof window.Capacitor.getPlatform === "function" && window.Capacitor.getPlatform() !== "web")));
      var isLocalPreview = !isNativeApp && (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1");
      var storageOptedOut = false;

      try {
        if (params.get("ga") === "off" || params.get("ga_optout") === "1") {
          localStorage.setItem(optoutKey, "1");
        }
        if (params.get("ga") === "on" || params.get("ga_optout") === "0") {
          localStorage.removeItem(optoutKey);
        }
        storageOptedOut = localStorage.getItem(optoutKey) === "1";
      } catch (error) {
        storageOptedOut = false;
      }

      window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut;
      window["ga-disable-" + measurementId] = window.MADO_ANALYTICS_DISABLED;
      if (window.MADO_ANALYTICS_DISABLED) return;

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      var script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", measurementId);
    })();
  </script>`,
};

