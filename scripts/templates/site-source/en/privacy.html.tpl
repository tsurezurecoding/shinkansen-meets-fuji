<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <title>Privacy Policy | Shinkansen Window</title>
  <meta name="description" content="The Shinkansen Window privacy policy, including how location, analytics, external map services and inquiries are handled.">
  <meta name="theme-color" content="#101c2c">
  <link rel="canonical" href="https://www.michikusa-travel.com/en/privacy.html">
  <link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/privacy.html">
  <link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/privacy.html">
  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/privacy.html">
  <link rel="icon" href="../favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
  <link rel="apple-touch-icon" href="../apple-touch-icon.png">
  <meta property="og:title" content="Privacy Policy | Shinkansen Window">
  <meta property="og:description" content="Information handled by Shinkansen Window and how it is used.">
  <meta property="og:image" content="https://www.michikusa-travel.com/images/og-shinkansen-window.png">
  <meta property="og:url" content="https://www.michikusa-travel.com/en/privacy.html">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="../style.css?v=5f3f6183">
  <script>
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
  </script>
</head>
<body>
  <header class="topbar" data-site-chrome-host="chrome-0"><a class="brand" href="../en/"><span class="brand-mark">窓</span><span class="brand-text"><span class="brand-name">Shinkansen Window</span><small class="brand-sub">Discover more through the train window.</small></span></a><nav class="top-nav" aria-label="Primary" data-site-chrome-fallback><a href="../en/start.html">Train Search</a><a href="../en/live/">Audio Guide</a><a href="../en/zukan.html">Field Guide</a></nav><div class="lang-switch" inert aria-hidden="true"><a href="../privacy.html?lang=ja">日本語</a></div></header>

  <main>
    <section class="reference-hero">
      <p class="eyebrow">PRIVACY POLICY</p>
      <h1>Privacy Policy</h1>
      <p>Last updated: August 2, 2026</p>
      <p>“Shinkansen Window” (the website https://www.michikusa-travel.com/ and the Android app; the “Service”) is operated by Michikusa. This policy explains what information the Service handles.</p>
      <p>As a principle, during normal use the Service does not collect data in a way that identifies you as an individual by linking it to your name, email address, or similar direct identifiers. If you contact us, we handle your sender email address and message content to reply and respond to your request.</p>
    </section>

    <section class="reference-section" aria-labelledby="privacyTitle">
      <div class="section-head">
        <p class="eyebrow">DATA HANDLING</p>
        <h2 id="privacyTitle">Information we handle</h2>
      </div>
      <div class="reference-grid reference-grid-single">
        <article class="reference-card">
          <h3>Location</h3>
          <p>The live map and window guide use your device's location. Precise GPS coordinates are processed on your device to show your position and detect approaching viewpoints. They are not sent to or stored on our servers and are not used for advertising or analytics.</p>
          <p>When you start approach alerts or Audio Guide in the Android app, the Service continues to access location until the ride session ends, including while another app is displayed or the screen is off, to detect approaching viewpoints and provide the alerts or audio guidance you enabled. An ongoing notification is shown during the ride session. You can stop location access, alerts, and audio guidance at any time by ending the ride in the app or using “End ride” in the notification. Location access stops when the session ends.</p>
        </article>
        <article class="reference-card">
          <h3>Analytics</h3>
          <p>We use Google Analytics (GA4), which collects page views, interaction events, approximate region derived from IP address, and device information via cookies or similar technologies. We use this information to understand and improve the Service. This does not include your name, email address, or the device GPS location described above.</p>
        </article>
        <article class="reference-card">
          <h3>Affiliate links and advertising</h3>
          <p>The Service contains affiliate links and advertising provided through Klook, ValueCommerce, and Amazon. If you make a booking or purchase through one of these links, Michikusa may receive a commission at no extra cost to you.</p>
          <p>As an Amazon Associate, Michikusa earns from qualifying purchases.</p>
          <p>When an advertisement is displayed or an affiliate link is used, technical information such as your IP address, device information, and referrer URL may be sent to the relevant provider, which may use cookies or similar technologies under its own privacy policy.</p>
        </article>
        <article class="reference-card">
          <h3>Maps</h3>
          <p>Map display may fetch data from external providers such as Google Maps and OpenStreetMap. Your device may send technical information such as IP address and the viewed map area to those providers, subject to their respective privacy policies.</p>
        </article>
        <article class="reference-card">
          <h3>Weather data</h3>
          <p>“Mt. Fuji Visibility Forecast β” fetches weather data for fixed window-view locations from Open-Meteo. Your device may send technical information such as its IP address and referrer URL to Open-Meteo. Your device GPS location is not sent. Open-Meteo handles this information under its privacy policy.</p>
        </article>
        <article class="reference-card">
          <h3>Android notifications</h3>
          <p>The Android app uses an ongoing notification to show Audio Guide status, the next viewpoint, and a stop action. These notifications are used only for ride guidance and not for advertising.</p>
        </article>
        <article class="reference-card">
          <h3>Accounts and personal data</h3>
          <p>The Service has no account system and does not ask for personal information such as name, email address, or phone number. It does not use the camera, microphone, or contacts.</p>
        </article>
        <article class="reference-card" id="data-deletion">
          <h3>Data deletion requests</h3>
          <p>The Service has no account system, so there is no in-app account to delete. If you would like to request deletion of data handled by the Service, such as analytics-related data where applicable, please contact <a href="mailto:support@michikusa-travel.com">support@michikusa-travel.com</a>.</p>
          <p>Please include the type of data you want deleted and the minimum information needed to identify the relevant data, such as your device or approximate usage period. Analytics data is not linked to your name or email address, so we may not be able to identify data for an individual user. We will respond within a reasonable scope, except where retention is required by law, security, fraud prevention, or technical constraints.</p>
        </article>
        <article class="reference-card">
          <h3>Contact</h3>
          <p>For questions about this policy or the Service, contact us at:</p>
          <p><a href="mailto:support@michikusa-travel.com">support@michikusa-travel.com</a></p>
        </article>
        <article class="reference-card">
          <h3>Changes to this policy</h3>
          <p>We may update this policy when features are added or changed. Important changes will be announced on this page.</p>
        </article>
      </div>
    </section>

    <section class="reference-policy">
      <a class="btn btn-primary" href="./">Back to Shinkansen Window</a>
    </section>
  </main>

  <section class="content-rail-section" aria-labelledby="contentRailTitle" data-site-chrome-host="chrome-1"></section>

  <footer class="footer" data-site-chrome-host="chrome-2"><nav data-site-chrome-fallback><a href="../en/guide.html">See Mt. Fuji</a> · <a href="../en/references.html">Window View Links</a> · <a href="../en/mieru.html">Visibility Forecast β</a></nav></footer>
  <script src="../track.js"></script>
<script id="mado-shared-ui-config" type="application/json">{"assets":["shared-ui/en.shell.js"],"root":"../","lang":"en","route":"privacy.html","mounts":[{"host":"chrome-0","component":"header-references","kind":"header","currentAnchors":[{"index":12,"value":"page"}],"menu":"header-android-app-menu","menuRoute":"privacy.html"},{"host":"chrome-1","component":"content-references","kind":"content"},{"host":"chrome-2","component":"footer-references","kind":"footer"}]}</script>
<script src="../site-runtime-loader.js?v=aa24d852" defer></script>
</body>
</html>
