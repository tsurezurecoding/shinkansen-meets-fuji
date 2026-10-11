<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Is Mt. Fuji Visible from the Shinkansen Today? | Mt. Fuji Visibility Forecast</title>
  <meta name="description" content="Will Mt. Fuji be visible from the Shinkansen today? Check hourly visibility forecasts for five window views, based on cloud cover around the summit and atmospheric visibility.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="https://www.michikusa-travel.com/en/mieru.html">
  <link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/mieru.html">
  <link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/mieru.html">
  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/mieru.html">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Is Mt. Fuji Visible from the Shinkansen Today? | Mt. Fuji Visibility Forecast">
  <meta property="og:description" content="Will Mt. Fuji be visible from the Shinkansen today? Check hourly visibility forecasts for five window views, based on cloud cover around the summit and atmospheric visibility.">
  <meta property="og:image" content="https://www.michikusa-travel.com/images/og-shinkansen-window.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="https://www.michikusa-travel.com/en/mieru.html">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Is Mt. Fuji Visible from the Shinkansen Today? | Mt. Fuji Visibility Forecast">
  <meta name="twitter:description" content="Will Mt. Fuji be visible from the Shinkansen today? Check hourly visibility forecasts for five window views, based on cloud cover around the summit and atmospheric visibility.">
  <meta name="twitter:image" content="https://www.michikusa-travel.com/images/og-shinkansen-window.png">
  <meta name="twitter:image:alt" content="Shinkansen Window — another journey beyond the glass.">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Mt. Fuji Visibility Forecast Beta",
    "url": "https://www.michikusa-travel.com/en/mieru.html",
    "applicationCategory": "TravelApplication",
    "operatingSystem": "Web browser",
    "description": "A forecast tool that estimates the chance of seeing Mt. Fuji from the Tokaido Shinkansen at your train's passing time.",
    "inLanguage": "en"
  }
  </script>
  <link rel="stylesheet" href="../style.css?v=175aa59c">
  <!--MIERU:CSS-->
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
  <script defer="" src="../utility-locales.js?v=14c4adac"></script>
  <link rel="stylesheet" href="../utility-locales.css?v=269e0262">
  <link rel="alternate" hreflang="zh-Hant" href="https://www.michikusa-travel.com/zh-Hant/mieru.html">
  <link rel="alternate" hreflang="fr" href="https://www.michikusa-travel.com/fr/mieru.html">
</head>
<body class="spot-page spot-page-utility" data-spot-page-shared-context="utility" data-spot-page-shared-lang="en" data-spot-page-shared-root="../" data-spot-page-shared-route="mieru.html">
  <div data-spot-page-shared-module="topbar"></div>
  <main>
    <div class="spot-page-shell mieru-shell">
      <aside data-spot-page-shared-module="rail"></aside>
      <article class="mieru-wrap">
      <p class="eyebrow">WEATHER FROM THE WINDOW</p>
      <h1>Mt. Fuji Visibility Forecast<small style="font-size:.55em;color:var(--accent);margin-left:8px">Beta</small></h1>
      <p class="mieru-lead">Will Mt. Fuji be visible from the Shinkansen today? Compare clouds around the summit and the clarity of the air at five viewing areas. Choose your train, boarding station and direction, or enter a departure time, to check conditions when you pass each view.</p>

      <div class="mieru-depart">
        <div class="mieru-row">
          <label>Boarding station <select id="mieruBoard"></select></label>
          <label>Direction
            <select id="mieruDir">
              <option value="west">Toward Shin-Osaka / Hakata</option>
              <option value="east">Toward Tokyo</option>
            </select>
          </label>
          <label>Day <select id="mieruDay"><option value="0">Today</option><option value="1">Tomorrow</option></select></label>
        </div>
        <div class="mieru-row mieru-mode-row" role="group" aria-label="Choose how to set your departure">
          <button type="button" id="mieruModeTrain" class="mieru-mode-btn is-active" aria-pressed="true">Choose a train</button>
          <button type="button" id="mieruModeTime" class="mieru-mode-btn" aria-pressed="false">Enter a time</button>
        </div>
        <div id="mieruTrainBlock">
          <div class="mieru-train-searchbar">
            <label>Departing after <input type="time" id="mieruTrainFrom" value="09:00" step="600"></label>
            <button type="button" id="mieruTrainSearchBtn">Find trains</button>
          </div>
          <div id="mieruTrainResults" class="train-results"></div>
        </div>
        <div id="mieruTimeBlock" hidden="">
          <label>Departure time (estimate) <input type="time" id="mieruDep" value="09:00" min="00:00" max="23:50" step="600"></label>
        </div>
        <div id="mieruRide">Calculating...</div>
      </div>

      <!--MIERU:ANSWER--><div id="mieruStatus">Loading weather data...</div>
      <div id="mieruSpots"></div><!--MIERU:FACTS-->

      <p class="mieru-note">
        Forecast model beta: visibility chance = probability that the summit is not obscured by cloud
        × probability that atmospheric visibility reaches the effective viewing distance.
        Because the sightline rises diagonally through the haze layer toward the summit, the effective
        distance is shorter than the horizontal distance; higher humidity makes the haze layer thicker.
        Weather data comes from <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
        under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
        and is converted into our own probability estimate.
        In a retrospective check against window-photo records, the model classified 9 out of 10
        successful photography days as visible.
        Passing times are approximate and based on Nozomi services. Sudden weather changes may make
        the forecast inaccurate. For ideas on cloudy days, see the <a href="guide.html#cloudy">Mt. Fuji guide</a>.
      </p>
      </article>
    </div>
    <section data-spot-page-shared-module="mobile-promos"></section>
    <section data-spot-page-shared-module="showcase"></section>
    <section data-spot-page-shared-module="content-rail"></section>
  </main>
  <footer class="footer">
    <p class="footer-brand">Shinkansen Window <span>Never miss the view</span></p>
    <p class="footer-links"><a href="guide.html">See Mt. Fuji</a> · <a href="references.html">Window Resources</a> · <a href="contact.html">Contact</a> · <a href="privacy.html">Privacy Policy</a></p>
    <p class="footer-credit">Michikusa — Unhurried journeys and unexpected discoveries.</p>
  </footer>

  <script src="../spot-page-shared-data.js?v=8e3e0940"></script>
  <script src="../spot-page-shared.js?v=4ecf6548"></script>
  <script src="../data-runtime.js?v=96170e32"></script><script src="../train-select.js"></script>
  <!--MIERU:RUNTIME-->


</body></html>
