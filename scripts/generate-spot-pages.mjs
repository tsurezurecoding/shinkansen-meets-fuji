import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const dataPath = path.join(appDir, "data.js");
const trackPath = path.join(appDir, "track.js");
const siteRoot = "https://www.michikusa-travel.com";
const today = "2026-07-09";
const GOOGLE_MAPS_EMBED_API_KEY = "AIzaSyDE3UdN_9m9cK5sLTlfuc7KElsfceYNwrs";

const dataCode = fs.readFileSync(dataPath, "utf8");
const { SPOTS, ROUTE } = vm.runInNewContext(`${dataCode}\n;({ SPOTS, ROUTE });`, {}, { filename: dataPath });
const trackContext = { window: { ROUTE }, ROUTE };
vm.runInNewContext(fs.readFileSync(trackPath, "utf8"), trackContext, { filename: trackPath });
const TRACK = trackContext.window.MADO_TRACK;

const featuredIds = [
  "fuji",
  "left-fuji",
  "hamanako",
  "odawara",
  "odawara-castle",
  "toji",
  "torikai-train-depot",
  "kiyosu",
  "hikone-castle",
  "solar-ark",
  "shimizu-port-chikyu",
  "shizuoka-tea-fields",
  "kakegawa",
  "ibuki",
  "seta-karahashi",
];

const UI = {
  ja: {
    brand: "新幹線の窓",
    navSearch: "列車検索へ",
    navGallery: "車窓図鑑へ",
    langSwitch: "English",
    eyebrow: "TOKAIDO SHINKANSEN WINDOW VIEW",
    titleSuffix: "の車窓ガイド | 新幹線の窓",
    titleQuestion: (name) => `${name}はいつ見える？座席側は？`,
    searchCta: "トップで列車検索する",
    appCta: "この見どころをアプリで開く",
    sectionHow: (name) => `${name}の見つけ方`,
    sectionPoint: "東海道新幹線の車窓としてのポイント",
    sectionPhotos: (name) => `写真で見る${name}`,
    sectionRefs: "参考リンク",
    sectionRelated: "近くの車窓も見る",
    facts: ["見える区間", "座席側", "タイミング", "写真"],
    photoUnit: "枚",
    routeNote: (area, side) => `東京から新大阪方面へ向かう場合は、${area || "この区間"}が近づいたら${side}の窓を少し早めに見てください。新大阪から東京方面へ向かう場合は、通過順が逆になります。`,
    pointText: (name) => `${name}は、富士山だけではない東海道新幹線の車窓を楽しむための見どころです。列車の速度が速いため、見える時間は短く、天気や座席位置によって見え方が変わります。`,
    sideA: "A席・海側",
    sideE: "E席・山側",
    sideBoth: "左右両側",
    hamanakoSide: "A席・海側 / E席・山側",
    minutes: (m) => Number.isFinite(Number(m)) ? `東京発のぞみ基準で約${Math.round(m)}分後` : "通過時刻は列車により変わります",
    relatedPrev: "ひとつ前",
    relatedNext: "つぎ",
    relatedCategory: "関連",
    fallbackCredit: "新幹線の窓",
    photoAlt: (name) => `${name}の新幹線車窓写真`,
    photoFallback: (name, index) => `${name}の車窓写真 ${index + 1}`,
    homeTitle: "Tokaido Shinkansen 車窓ガイド | 新幹線の窓",
    homeLead: "東海道新幹線から見える富士山、浜名湖、城、東寺、車両基地などを、写真と席側で確認できます。",
    homeCta: "アプリで列車検索する",
    guideTitle: "新幹線から富士山はいつ見える？どっち側？E席と時刻のFAQ | 新幹線の窓",
    guideLead: "東海道新幹線から富士山はいつ見える？のぞみなら東京から約40〜45分後、三島→新富士で約3〜4分。座席はE席側です。",
    guideHeading: "新幹線から富士山はいつ見える？どっち側？",
    guideBack: "アプリで列車検索する",
    guideQuestions: [
      {
        q: "新幹線から富士山はどちら側に見えますか？",
        a: "東海道新幹線では、東京から新大阪へ向かう場合も、新大阪から東京へ向かう場合も、富士山は主にE席側に見えます。ただし新富士から静岡付近では、短い時間だけA席側に見える「左富士」もあります。",
        link: "spots/left-fuji.html",
        linkText: "左富士を見る",
      },
      {
        q: "新幹線から富士山はいつ見えますか？",
        a: "いちばん大きく見えるのは三島から新富士付近です。天気がよければ品川から新横浜のあたりや、浜名湖付近など、離れた場所から見えることもあります。",
        link: "spots/fuji.html",
        linkText: "富士山の見どころを見る",
      },
      {
        q: "富士山以外に東海道新幹線の車窓で何が見えますか？",
        a: "相模湾、熱海、浜名湖、城、東寺、山、工場、看板などが次々に現れます。新幹線の窓は、富士山だけでなく移動そのものを楽しむための車窓ガイドです。",
        link: "index.html#gallery",
        linkText: "車窓図鑑を見る",
      },
    ],
  },
  en: {
    brand: "Shinkansen Window",
    navSearch: "Find my train",
    navGallery: "Field guide",
    langSwitch: "日本語",
    eyebrow: "TOKAIDO SHINKANSEN WINDOW VIEW",
    titleSuffix: "from the Tokaido Shinkansen | Shinkansen Window",
    titleQuestion: (name) => `When can you see ${name} from the Shinkansen?`,
    searchCta: "Find your train",
    appCta: "Open this view in the app",
    sectionHow: (name) => `How to find ${name}`,
    sectionPoint: "Why this view matters",
    sectionPhotos: (name) => `${name} in photos`,
    sectionRefs: "References",
    sectionRelated: "Nearby window views",
    facts: ["Section", "Seat side", "Timing", "Photos"],
    photoUnit: "photos",
    routeNote: (area, side) => `If you are traveling from Tokyo toward Shin-Osaka, start watching the ${side} window as you approach ${enApproachArea(area)}. If you are traveling toward Tokyo, the order is reversed.`,
    pointText: (name) => `${name} is one of the window views that make the Tokaido Shinkansen more than a transfer. The train moves fast, so visibility depends on weather, seat position, and timing.`,
    sideA: "Seat A · sea side",
    sideE: "Seat E · mountain side",
    sideBoth: "Both sides",
    hamanakoSide: "Seat A · sea side / Seat E · mountain side",
    minutes: (m) => Number.isFinite(Number(m)) ? `About ${Math.round(m)} minutes after leaving Tokyo on a Nozomi train` : "Timing varies by train",
    relatedPrev: "Previous",
    relatedNext: "Next",
    relatedCategory: "Related",
    fallbackCredit: "Shinkansen Window",
    photoAlt: (name) => `${name} from the Shinkansen window`,
    photoFallback: (name, index) => `${name} window photo ${index + 1}`,
    homeTitle: "Tokaido Shinkansen Window Views | Shinkansen Window",
    homeLead: "A field guide to Mt. Fuji, Lake Hamana, castles, To-ji Temple, train depots, and other views from the Tokaido Shinkansen.",
    homeCta: "Find your train in the app",
    guideTitle: "When can you see Mt. Fuji from the Shinkansen? Seat side and timing FAQ | Shinkansen Window",
    guideLead: "On a Nozomi, start watching about 40-45 minutes after Tokyo, between Mishima and Shin-Fuji. Sit in Seat E.",
    guideHeading: "When can you see Mt. Fuji from the Shinkansen?",
    guideBack: "Find your train in the app",
    guideQuickFacts: [
      { label: "Best seat", value: "Seat E", detail: "The mountain-side window on the Tokaido Shinkansen." },
      { label: "From Tokyo", value: "40-45 min", detail: "Start looking before Mishima and Shin-Fuji." },
      { label: "View time", value: "About 3 min", detail: "Weather, speed, and seat position change the exact window." },
    ],
    guidePracticalTitle: "The short answer",
    guidePracticalBody: "Reserve Seat E, keep your camera ready before Shin-Fuji, and do not wait until Fuji is already beside you. The famous view is short. That is what makes it feel like a small event inside the journey.",
    guideFeaturedTitle: "Make the ride worth watching",
    guideFeaturedLead: "Fuji is the headline, but the Tokaido Shinkansen window keeps changing: sea, lakes, castles, factories, tiny signs, and Kyoto's pagoda. These are the kinds of views that make you look up again.",
    guideBeyondTitle: "Turn the window into a route",
    guideBeyondBody: "Choose your train in Shinkansen Window and the app lines up the views in time order. It is less a list of landmarks than a companion for the minutes between stations.",
    guideQuestions: [
      {
        q: "Which side of the Shinkansen is Mt. Fuji on?",
        a: "For the standard Tokaido Shinkansen Mt. Fuji view, choose Seat E. Seat E is the mountain-side window and works in both directions between Tokyo and Kyoto or Shin-Osaka. There is also a short Left-Side Fuji moment near Shin-Fuji to Shizuoka, when Fuji can appear on Seat A.",
        link: "spots/left-fuji.html",
        linkText: "See Left-Side Fuji",
      },
      {
        q: "When can you see Mt. Fuji from the Shinkansen?",
        a: "From Tokyo, start watching about 40-45 minutes after departure on a Nozomi train. The biggest view is around Mishima to Shin-Fuji and usually lasts only a few minutes. On clear days, you may also glimpse Fuji closer to Tokyo or farther west near Lake Hamana.",
        link: "spots/fuji.html",
        linkText: "See the Mt. Fuji view",
      },
      {
        q: "What else can you see from the Tokaido Shinkansen window?",
        a: "Sagami Bay, Atami, Lake Hamana, castles, To-ji Temple, mountains, factories, signs, and other short-lived views make the ride itself part of the journey.",
        link: "index.html#gallery",
        linkText: "Browse the field guide",
      },
    ],
  },
};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(value) {
  return escapeHTML(value).replace(/\s+/g, " ").trim();
}

function rawText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function localized(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.ja || value.en || "";
}

function thumbnailSrc(src) {
  return String(src || "").replace(/^images\/(.+)\.(jpe?g|png)$/i, "images/thumbs/$1.webp");
}

function jaAreaPhrase(area) {
  if (!area) return "この区間";
  return /付近|前後|あたり|区間/.test(area) ? area : `${area}付近`;
}

function enAreaPhrase(area) {
  if (!area) return "this section";
  if (/^Around\b/i.test(area)) return `around ${area.replace(/^Around\s+/i, "")}`;
  if (area.includes("→")) return `in the ${area} section`;
  return `around ${area}`;
}

function enApproachArea(area) {
  if (!area) return "this section";
  return area.replace(/^Around\s+/i, "");
}

function pagePath(lang, spotId = "") {
  if (spotId) return lang === "ja" ? `/spots/${spotId}.html` : `/en/spots/${spotId}.html`;
  return lang === "ja" ? "/" : "/en/";
}

function pageUrl(lang, spotId = "") {
  return `${siteRoot}${pagePath(lang, spotId)}`;
}

function appHref(lang, spotId = "", prefix = "../") {
  const hash = spotId ? `#spot-${spotId}` : "#journey";
  const query = lang === "en" ? "?lang=en" : "";
  return `${prefix}index.html${query}${hash}`;
}

function liveHref(lang, prefix = "../") {
  return `${prefix}live/index.html${lang === "en" ? "?lang=en" : ""}`;
}

function languageSwitchHref(lang, spotId) {
  return lang === "ja" ? `../en/spots/${spotId}.html` : `../../spots/${spotId}.html`;
}

function siteHeaderHTML(lang, prefix, jaHref, enHref) {
  const ui = UI[lang];
  const homeHref = `${prefix}index.html${lang === "en" ? "?lang=en" : ""}`;
  const jaActive = lang === "ja" ? " active" : "";
  const enActive = lang === "en" ? " active" : "";
  return `<header class="topbar">
    <a class="brand" href="${homeHref}">
      <span class="brand-mark">窓</span>
      <span class="brand-text">
        <span class="brand-name">${escapeHTML(ui.brand)}</span>
        <small class="brand-sub">${lang === "ja" ? "旅の瞬間を見逃さない" : "Never miss a moment of the journey."}</small>
      </span>
    </a>
    <nav class="top-nav" aria-label="Primary">
      <a href="${homeHref}">${lang === "ja" ? "TOP" : "Home"}</a>
      <a href="${prefix}index.html${lang === "en" ? "?lang=en" : ""}#journey">${lang === "ja" ? "列車選択" : "Train Search"}</a>
      <a href="${liveHref(lang, prefix)}">${lang === "ja" ? "ライブガイド" : "Live Guide"}</a>
      <a href="${prefix}zukan.html${lang === "en" ? "?lang=en" : ""}">${lang === "ja" ? "車窓図鑑" : "Field Guide"}</a>
      <a href="${prefix}${lang === "en" ? "en/" : ""}guide.html">${lang === "ja" ? "FAQ" : "FAQ"}</a>
      <a href="${prefix}index.html${lang === "en" ? "?lang=en" : ""}#memories">${lang === "ja" ? "獲得メダル" : "Medals"}</a>
    </nav>
    <div class="lang-switch" role="group" aria-label="Language">
      <a class="${jaActive.trim()}" href="${escapeHTML(jaHref)}">日本語</a>
      <a class="${enActive.trim()}" href="${escapeHTML(enHref)}">EN</a>
    </div>
  </header>`;
}

function analyticsSnippet() {
  return `<script>
    (function () {
      var measurementId = "G-C2ESB694FV";
      var optoutKey = "mado-ga-optout";
      var params = new URLSearchParams(window.location.search);
      var host = window.location.hostname;
      var isLocalPreview = window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1";
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
  </script>`;
}

function referenceUrl(ref, lang) {
  return localized(ref?.url, lang) || localized(ref?.url, "ja") || ref?.url || "";
}
function bodyLinksHTML(spot, lang) {
  const sourceLinks = [...(spot.bodyLinks || []), ...(spot.references || [])];
  const seen = new Set();
  const links = sourceLinks.map((item) => {
    const ref = item.ref || item;
    const href = item.url ? (localized(item.url, lang) || localized(item.url, "ja")) : referenceUrl(ref, lang);
    const label = localized(item.label, lang) || localized(ref.label, lang);
    if (!href || !label) return "";
    if (seen.has(href)) return "";
    seen.add(href);
    return `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${text(label)}</a>`;
  }).filter(Boolean);
  const prefix = lang === "ja" ? "もっと見る:" : "More:";
  return links.length ? `<p class="spot-page-body-links"><span>${prefix}</span> ${links.join("<span aria-hidden=\"true\"> / </span>")}</p>` : "";
}

function absoluteImageUrl(spot) {
  const image = spot.image || spot.photos?.[0]?.src || "images/og-shinkansen-window.png";
  return `${siteRoot}/${image}`;
}

function defaultOgImageUrl() {
  return `${siteRoot}/images/og-shinkansen-window.png`;
}

function sideLabel(spot, lang) {
  const ui = UI[lang];
  if (spot.id === "hamanako") return ui.hamanakoSide;
  if (localized(spot.sideLabel, lang)) return localized(spot.sideLabel, lang);
  if (spot.side === "A") return ui.sideA;
  if (spot.side === "E") return ui.sideE;
  return ui.sideBoth;
}

function description(spot, lang) {
  const data = spot[lang] || spot.ja || {};
  if (lang === "ja") {
    const firstSentence = rawText(data.story).split("。").filter(Boolean)[0] || data.hook || "";
    const suffix = "。";
    return text(`${data.name}は東海道新幹線の車窓から見えるスポットです。${sideLabel(spot, lang)}、${jaAreaPhrase(data.area)}。${firstSentence}${suffix}`);
  }
  const firstSentence = rawText(data.hook || data.story || "");
  const suffix = /[.!?]$/.test(firstSentence) ? "" : ".";
  return text(`${data.name} is a Tokaido Shinkansen window view ${enAreaPhrase(data.area)}. Watch from ${sideLabel(spot, lang)}. ${firstSentence}${suffix}`);
}

function creditText(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.ja || value.en || "";
}

function photoItems(spot, lang) {
  const data = spot[lang] || spot.ja || {};
  const main = spot.image
    ? [{
        src: spot.image,
        alt: { ja: `${spot.ja.name}の新幹線車窓写真`, en: `${data.name} from the Shinkansen window` },
        credit: spot.photoCredit,
        sourceUrl: spot.photoCredit?.url,
        date: spot.photoCredit?.date,
        note: spot.photoCredit?.note,
      }]
    : [];
  return [...main, ...(spot.photos || [])].filter((item) => item.src);
}

function photoGalleryHTML(spot, lang, prefix) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const items = photoItems(spot, lang);
  if (!items.length) return "";
  const cards = items.map((item, index) => {
    const note = localized(item.note, lang);
    const credit = creditText(item.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
    const href = item.sourceUrl || item.url || "";
    const creditHTML = href
      ? `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
      : escapeHTML(credit);
    const date = item.date ? `<span>${escapeHTML(item.date)}</span>` : "";
    return `<figure class="spot-page-photo">
        <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(item.src))}" alt="${escapeHTML(localized(item.alt, lang) || ui.photoAlt(data.name))}">
        <figcaption>
          <strong>${note ? escapeHTML(note) : escapeHTML(ui.photoFallback(data.name, index))}</strong>
          <span>${creditHTML}</span>
          ${date}
        </figcaption>
      </figure>`;
  }).join("");
  return `<section class="spot-page-section">
        <h2>${escapeHTML(ui.sectionPhotos(data.name))}</h2>
        <div class="spot-page-photo-grid">${cards}</div>
      </section>`;
}

function routeRelatedHTML(spot, lang) {
  const ui = UI[lang];
  const prefix = lang === "ja" ? "../" : "../../";
  const routeSpots = [...SPOTS].sort((a, b) => Number(a.minutesFromTokyo || 0) - Number(b.minutesFromTokyo || 0));
  const explicitIds = new Set(spot.relatedSpotIds || []);
  const unique = [];
  for (const id of explicitIds) {
    const item = routeSpots.find((entry) => entry.id === id);
    if (item) unique.push({ label: ui.relatedCategory, spot: item });
  }
  const scored = routeSpots
    .filter((item) => item.id !== spot.id && !explicitIds.has(item.id))
    .map((item) => {
      const minutesDiff = Math.abs(Number(item.minutesFromTokyo || 0) - Number(spot.minutesFromTokyo || 0));
      const score =
        (item.category === spot.category ? 12 : 0) +
        (item.side === spot.side ? 3 : 0) +
        Math.max(0, 8 - minutesDiff / 6);
      const label = item.category === spot.category
        ? ui.relatedCategory
        : (lang === "ja" ? "近い時間" : "Nearby");
      return { label, spot: item, score };
    })
    .sort((a, b) => b.score - a.score);
  for (const item of scored) {
    if (unique.length >= 3) break;
    if (!unique.some((entry) => entry.spot.id === item.spot.id)) unique.push(item);
  }
  if (!unique.length) return "";
  const links = unique.slice(0, 3).map(({ label, spot: item }) => {
    const data = item[lang] || item.ja;
    const image = thumbnailSrc(item.image || item.photos?.[0]?.src || "images/og-shinkansen-window.png");
    return `<a href="${item.id}.html">
        <img src="${prefix}${escapeHTML(image)}" alt="${escapeHTML(data.name)}" loading="lazy" decoding="async">
        <small>${escapeHTML(label)}</small>
        <strong>${escapeHTML(data.name)}</strong>
        <span>${escapeHTML(data.hook || data.area)}</span>
      </a>`;
  }).join("");
  return `<section class="spot-page-section">
        <h2>${escapeHTML(ui.sectionRelated)}</h2>
        <div class="spot-page-related">${links}</div>
      </section>`;
}

function referencesHTML(spot, lang) {
  const refs = (spot.references || []).map((ref) => {
    const href = referenceUrl(ref, lang);
    if (!href) return "";
    return `<li><a href="${escapeHTML(href)}" rel="noopener" target="_blank">${text(localized(ref.label, lang))}</a></li>`;
  }).join("");
  return refs;
}

function mapHref(spot, lang) {
  if (!spot?.map) return "";
  if (spot.map.lat != null && spot.map.lng != null) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.map.lat},${spot.map.lng}`)}`;
  const query = spot.map[lang] || spot.map.ja || spot.map.en;
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

function mapLinkHTML(spot, lang) {
  const href = mapHref(spot, lang);
  if (!href) return "";
  const label = lang === "ja" ? "地図をひらく" : "Open map";
  return `<a class="map-link spot-mini-map-link" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer" data-map="${escapeHTML(spot.id)}"><span class="map-link-icon" aria-hidden="true">↗</span><span>${escapeHTML(label)}</span></a>`;
}

function hasMiniMapCoordinates(spot) {
  return !!(spot?.map && typeof spot.map.lat === "number" && typeof spot.map.lng === "number" && typeof spot.minutesFromTokyo === "number");
}

function miniMapViewpoint(spot) {
  if (!hasMiniMapCoordinates(spot) || !TRACK) return null;
  if (typeof spot.viewpoint?.lat === "number" && typeof spot.viewpoint?.lng === "number") {
    return { lat: spot.viewpoint.lat, lng: spot.viewpoint.lng };
  }
  const km = TRACK.minToKm(spot.minutesFromTokyo);
  return Number.isFinite(km) ? TRACK.latLngAtKm(km) : null;
}

function mercatorPoint(lat, lng) {
  const safeLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sinLat = Math.sin((safeLat * Math.PI) / 180);
  return {
    x: (lng + 180) / 360,
    y: 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI),
  };
}

function miniMapZoomForViewpoint(spot, viewPos, distanceKm) {
  if (!viewPos) return 14;
  const spotPoint = mercatorPoint(spot.map.lat, spot.map.lng);
  const routePoint = mercatorPoint(viewPos.lat, viewPos.lng);
  const dx = Math.abs(spotPoint.x - routePoint.x);
  const dy = Math.abs(spotPoint.y - routePoint.y);
  const fitRatio = 0.3;
  const tileSize = 256;
  const zoomX = dx > 0 ? Math.floor(Math.log2((640 * fitRatio) / (dx * tileSize))) : 21;
  const zoomY = dy > 0 ? Math.floor(Math.log2((320 * fitRatio) / (dy * tileSize))) : 21;
  const fitZoom = Math.max(8, Math.min(15, zoomX, zoomY));
  if (Number.isFinite(distanceKm) && distanceKm <= 0.35) return Math.max(fitZoom, 15);
  if (Number.isFinite(distanceKm) && distanceKm <= 3) return Math.max(fitZoom, 14);
  return fitZoom;
}

function googleMapsEmbedHref(spot, lang) {
  if (!hasMiniMapCoordinates(spot)) return "";
  const viewPos = miniMapViewpoint(spot);
  const distanceKm = viewPos && TRACK
    ? TRACK.haversineKm(viewPos.lat, viewPos.lng, spot.map.lat, spot.map.lng)
    : NaN;
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY,
    q: `${spot.map.lat},${spot.map.lng}`,
    center: `${spot.map.lat},${spot.map.lng}`,
    zoom: String(miniMapZoomForViewpoint(spot, viewPos, distanceKm)),
    maptype: "satellite",
    language: lang === "ja" ? "ja" : "en",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function googleMapsViewpointHref(spot, lang) {
  if (!hasMiniMapCoordinates(spot)) return "";
  const viewPos = miniMapViewpoint(spot);
  if (!viewPos) return "";
  const distanceKm = TRACK
    ? TRACK.haversineKm(viewPos.lat, viewPos.lng, spot.map.lat, spot.map.lng)
    : NaN;
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY,
    q: `${viewPos.lat},${viewPos.lng}`,
    center: `${spot.map.lat},${spot.map.lng}`,
    zoom: String(miniMapZoomForViewpoint(spot, viewPos, distanceKm)),
    maptype: "satellite",
    language: lang === "ja" ? "ja" : "en",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function miniMapDetailsHTML(spot, lang) {
  const hasCoordinates = hasMiniMapCoordinates(spot);
  const fallbackLink = mapLinkHTML(spot, lang);
  if (!hasCoordinates && !fallbackLink) return "";
  const summary = lang === "ja" ? "位置の目安" : "Location at a glance";
  const mapNote = lang === "ja"
    ? "スポット位置と、新幹線から見る位置を切り替えられます。"
    : "Switch between the spot and the Shinkansen viewpoint.";
  const fallbackNote = lang === "ja"
    ? "この地点は簡易地図の座標調整中です。外部地図で位置を確認できます。"
    : "Inline coordinates are still being tuned for this spot. You can check the location in an external map.";
  const prefix = lang === "ja" ? "../" : "../../";
  const data = spot[lang] || spot.ja || spot.en || {};
  const href = mapHref(spot, lang);
  const openMapLabel = lang === "ja"
    ? `${data.name || spot.id}をGoogle Mapsで開く`
    : `Open ${data.name || spot.id} in Google Maps`;
  const embedHref = googleMapsEmbedHref(spot, lang);
  const viewpointHref = googleMapsViewpointHref(spot, lang);
  const modebar = viewpointHref ? `<div class="spot-map-modebar" role="group" aria-label="${escapeHTML(summary)}">
          <button type="button" class="spot-map-mode is-active" data-mini-map-mode="spot" data-map-src="${escapeHTML(embedHref)}" aria-pressed="true">${escapeHTML(lang === "ja" ? "スポット" : "Spot")}</button>
          <button type="button" class="spot-map-mode" data-mini-map-mode="viewpoint" data-map-src="${escapeHTML(viewpointHref)}" aria-pressed="false">${escapeHTML(lang === "ja" ? "新幹線視点" : "Train viewpoint")}</button>
        </div>` : "";
  if (!hasCoordinates) {
    return `<section class="spot-static-map">
        <div class="spot-static-map-head">
          <h2>${escapeHTML(summary)}</h2>
        </div>
        <div class="spot-mini-map-fallback">
          <p>${escapeHTML(fallbackNote)}</p>
          ${fallbackLink}
        </div>
      </section>`;
  }
  return `<section class="spot-static-map">
        <div class="spot-static-map-head">
          <h2>${escapeHTML(summary)}</h2>
          ${fallbackLink}
        </div>
        ${modebar}
        <iframe class="spot-google-map-frame" src="${escapeHTML(embedHref)}" title="${escapeHTML(openMapLabel)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
        <p class="spot-mini-map-note">${escapeHTML(mapNote)}</p>
      </section>`;
}

function durationGuideText(spot, lang) {
  const seconds = Number(spot.durationSec);
  if (!Number.isFinite(seconds)) {
    return lang === "ja"
      ? "見える時間は列車や天候で変わります。近づいてから探すより、少し前から窓の外を追う方が見つけやすくなります。"
      : "Visibility changes by train and weather. Start watching a little early instead of waiting until the view is already beside you.";
  }
  if (lang === "ja") {
    if (seconds <= 10) return `見える時間はおよそ${seconds}秒。かなり一瞬なので、ライブガイドの案内が出たら先に窓へ目を移しておくのが現実的です。`;
    if (seconds <= 30) return `見える時間はおよそ${seconds}秒。短い車窓なので、案内が出てからカメラを探すより、先に座席側と窓の方向を決めておくと拾いやすくなります。`;
    if (seconds >= 120) return `見える時間はおよそ${Math.round(seconds / 60)}分前後あります。近づき始めから見え方が変わるので、写真だけでなく窓の景色の移り変わりも楽しめます。`;
    return `見える時間はおよそ${seconds}秒。長くはありませんが、近づく前から意識していれば肉眼でも見つけやすい車窓です。`;
  }
  if (seconds <= 10) return `The view lasts about ${seconds} seconds. It is a blink-and-you-miss-it moment, so let Live Guide warn you before you look up.`;
  if (seconds <= 30) return `The view lasts about ${seconds} seconds. Decide the seat side and window direction before it arrives rather than reaching for your camera late.`;
  if (seconds >= 120) return `The view lasts roughly ${Math.round(seconds / 60)} minutes. Watch how it changes as the train approaches, not just the single photo moment.`;
  return `The view lasts about ${seconds} seconds. It is short, but easy enough to catch if you start watching before the train reaches it.`;
}

function sceneGuideText(spot, lang, name) {
  const scene = spot.scene || "";
  if (lang === "ja") {
    if (spot.category === "curious") {
      return `${name}は、富士山や大きな城のような主役級ではなく、知っている人だけが拾えるタイプの車窓です。見つけること自体が楽しいので、旅慣れた人ほど小さな発見として効いてきます。`;
    }
    if (scene === "fuji" || scene === "leftfuji") return "富士山は区間によって大きさ、角度、手前の街並みが変わります。同じ富士山でも、どこで見るかで印象が変わるのが東海道新幹線らしい面白さです。";
    if (scene === "bay" || scene === "lake") return "水辺の車窓は、建物が詰まった区間から急に視界が開けるのが魅力です。晴天だけでなく、夕方や曇天でも水面の明るさで景色の変化に気づけます。";
    if (scene === "castle" || scene === "pagoda") return "歴史ある建物は、街の中に一瞬だけ差し込む目印として現れます。大きく眺めるというより、線路と街との距離感を味わうスポットです。";
    if (scene === "solar") return "工場や看板の車窓は、観光名所とは違う東海道らしさがあります。移動中にしか気づきにくい沿線のランドマークとして見ると面白いタイプです。";
    if (scene === "mountain" || scene === "hills") return "山や丘の車窓は、遠景の輪郭と手前の街並みが重なって見えます。季節や天候で印象が変わりやすく、同じ列車でも毎回少し違って見えるスポットです。";
    return "この車窓は、駅間の短い時間をただの移動ではなく観察の時間に変えてくれます。座席側とタイミングを知っているだけで、景色の拾い方が大きく変わります。";
  }
  if (spot.category === "curious") {
    return `This is not a headline landmark like Mt. Fuji or a major castle. It is the kind of small window view that feels rewarding precisely because you know where to look.`;
  }
  if (scene === "fuji" || scene === "leftfuji") return "Mt. Fuji changes by section: size, angle, foreground, and distance all shift along the Tokaido Shinkansen. That variety is part of the fun.";
  if (scene === "bay" || scene === "lake") return "Water views are satisfying because the scenery suddenly opens up after dense urban sections. The surface can make the change noticeable even on cloudy days.";
  if (scene === "castle" || scene === "pagoda") return "Historic buildings appear as brief markers inside the cityscape. The pleasure is less about a long panorama and more about catching the train's relationship with the town.";
  if (scene === "solar") return "Factories and signs are a different kind of Tokaido landmark: not classic sightseeing, but very much part of the view from the line.";
  if (scene === "mountain" || scene === "hills") return "Hills and mountains layer the distant outline with the towns in front of them. Weather and season change the impression from ride to ride.";
  return "This view turns a short stretch between stations into something to watch. Knowing the seat side and timing changes how much of the journey you notice.";
}

function confidenceGuideText(spot, lang) {
  const refs = Array.isArray(spot.references) ? spot.references.length : 0;
  const photos = photoItems(spot, lang).length;
  if (lang === "ja") {
    const sourceNote = refs ? "参考リンクもあわせて確認できます。" : "写真と実車での見え方をもとに案内しています。";
    if (spot.confidence === "verified") return `掲載写真または実車ログで確認済みのスポットです。${sourceNote}`;
    if (spot.confidence === "source-backed") return `参考情報と写真から案内しているスポットです。実車で見るときは、前後の位置に少し幅を持って探してください。`;
    return `位置と通過時刻は調整中です。見つけにくい場合があるので、${photos ? "写真の形を手がかりにしながら" : "周辺の地形や建物を手がかりにしながら"}少し早めに探してください。`;
  }
  const sourceNote = refs ? "Reference links are included where available." : "The guide is based on photos and ride checks.";
  if (spot.confidence === "verified") return `This spot has been checked through listed photos or ride logs. ${sourceNote}`;
  if (spot.confidence === "source-backed") return "This spot is guided from references and photos. When riding, give yourself a little margin before and after the listed timing.";
  return `The exact position and timing are still being tuned. Use ${photos ? "the listed photos" : "nearby landforms and buildings"} as clues and start watching early.`;
}

function spotGuideDepthHTML(spot, lang) {
  const data = spot[lang] || spot.ja || {};
  const title = lang === "ja" ? `${data.name}を見逃さないコツ` : `How to catch ${data.name}`;
  const seat = sideLabel(spot, lang);
  const intro = lang === "ja"
    ? `${data.area || "この区間"}が近づいたら、${seat}の窓を先に意識してください。現在地から追う場合はライブガイド、事前に確認する場合はこのページの地図が役立ちます。`
    : `As you approach ${data.area || "this section"}, start watching from ${seat}. Use Live Guide while riding, or the map on this page before you board.`;
  return `<section class="spot-page-section">
        <h2>${escapeHTML(title)}</h2>
        <h3>${escapeHTML(lang === "ja" ? "1. 先に見る方向を決める" : "1. Choose the window first")}</h3>
        <p>${escapeHTML(intro)}</p>
        <p>${escapeHTML(durationGuideText(spot, lang))}</p>
        <h3>${escapeHTML(lang === "ja" ? "2. 何を面白がるか" : "2. What makes it worth watching")}</h3>
        <p>${escapeHTML(sceneGuideText(spot, lang, data.name))}</p>
        <h3>${escapeHTML(lang === "ja" ? "3. 確度と参考" : "3. Confidence and references")}</h3>
        <p>${escapeHTML(confidenceGuideText(spot, lang))}</p>
      </section>`;
}

function spotPageHTML(spot, lang) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const otherLang = lang === "ja" ? "en" : "ja";
  const title = lang === "ja"
    ? `${data.name}はいつ見える？座席側は？ ${data.area}${ui.titleSuffix}`
    : `When can you see ${data.name} from the Shinkansen? ${data.area} | Shinkansen Window`;
  const desc = description(spot, lang);
  const url = pageUrl(lang, spot.id);
  const prefix = lang === "ja" ? "../" : "../../";
  const appUrl = appHref(lang, spot.id, prefix);
  const photos = photoItems(spot, lang);
  const photoCount = photos.length;
  const routeNote = localized(spot.routeNote, lang) || ui.routeNote(data.area, sideLabel(spot, lang));
  const fujiGuideLink = spot.id === "fuji"
    ? (lang === "ja"
      ? `<p>座席の取り方、東京発・上り列車の時刻、左富士まで含めて確認するなら、<a href="../guide.html">新幹線から富士山を見る完全ガイド</a>へ。</p>`
      : `<p>For seat booking, timing from Tokyo, timing from Kyoto or Osaka, and the hidden Left Fuji moment, see the <a href="../guide.html">complete Mt. Fuji from the Shinkansen guide</a>.</p>`)
    : "";
  const fujiGuideBlock = fujiGuideLink ? `        ${fujiGuideLink}\n` : "";
  const heroSrc = photos[0]?.src || spot.image || "images/og-shinkansen-window.png";
  const heroCredit = creditText(photos[0]?.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
  const refs = referencesHTML(spot, lang);
  const bodyLinks = bodyLinksHTML(spot, lang);
  const miniMap = miniMapDetailsHTML(spot, lang);
  const pageStory = localized(spot.pageStory, lang) || data.story || "";
  const explainerData = spot.explainer;
  const explainerParas = explainerData ? (explainerData[lang] || explainerData.ja || []) : [];
  const explainer = explainerData && explainerParas.length
    ? `<section class="spot-page-section">
        <h2>${escapeHTML(localized(explainerData.heading, lang))}</h2>
        ${explainerParas.map((p) => `<p>${escapeHTML(p)}</p>`).join("\n        ")}
      </section>`
    : "";
  const liveMapCta = lang === "ja" ? "乗車中はライブガイドで見る" : "Use Live Guide while riding";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": title,
        "description": desc,
        "inLanguage": lang,
        "isPartOf": { "@type": "WebSite", "name": ui.brand, "url": pageUrl(lang) },
      },
      {
        "@type": "TouristAttraction",
        "@id": `${url}#spot`,
        "name": data.name,
        "alternateName": localized(spot[otherLang], "name") || spot[otherLang]?.name || spot.ja.name,
        "description": desc,
        "image": absoluteImageUrl(spot),
        "touristType": "Railway window view",
      },
    ],
  };

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${text(title)}</title>
  <meta name="description" content="${text(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="ja" href="${pageUrl("ja", spot.id)}">
  <link rel="alternate" hreflang="en" href="${pageUrl("en", spot.id)}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl("ja", spot.id)}">
  <link rel="stylesheet" href="${prefix}style.css?v=20260712-live-guide-ui">
  <meta property="og:title" content="${text(title)}">
  <meta property="og:description" content="${text(desc)}">
  <meta property="og:image" content="${absoluteImageUrl(spot)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${absoluteImageUrl(spot)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  ${analyticsSnippet()}
</head>
<body class="spot-page">
  ${siteHeaderHTML(
    lang,
    prefix,
    lang === "ja" ? `${spot.id}.html` : `../../spots/${spot.id}.html`,
    lang === "ja" ? `../en/spots/${spot.id}.html` : `${spot.id}.html`,
  )}
  <main>
    <article class="spot-page-article">
      <p class="eyebrow">${escapeHTML(ui.eyebrow)}</p>
      <h1>${escapeHTML(ui.titleQuestion(data.name))}</h1>
      <p class="spot-page-lead">${escapeHTML(data.hook || "")}</p>
      <div class="spot-page-actions spot-page-actions-top">
        <a class="btn btn-primary" href="${appHref(lang, "", prefix)}">${escapeHTML(ui.searchCta)}</a>
        <a class="btn btn-ghost" href="${appUrl}">${escapeHTML(ui.appCta)}</a>
      </div>
      <figure class="spot-page-figure">
        <img src="${prefix}${escapeHTML(thumbnailSrc(heroSrc))}" alt="${escapeHTML(ui.photoAlt(data.name))}" decoding="async" fetchpriority="high">
        <figcaption>${escapeHTML(heroCredit)}</figcaption>
      </figure>
      <dl class="spot-page-facts">
        <div><dt>${escapeHTML(ui.facts[0])}</dt><dd>${escapeHTML(data.area || "")}</dd></div>
        <div><dt>${escapeHTML(ui.facts[1])}</dt><dd>${escapeHTML(sideLabel(spot, lang))}</dd></div>
        <div><dt>${escapeHTML(ui.facts[2])}</dt><dd>${escapeHTML(ui.minutes(spot.minutesFromTokyo))}</dd></div>
        <div><dt>${escapeHTML(ui.facts[3])}</dt><dd>${photoCount} ${escapeHTML(ui.photoUnit)}</dd></div>
      </dl>
      <section class="spot-page-section">
        <h2>${escapeHTML(ui.sectionHow(data.name))}</h2>
        <p>${escapeHTML(pageStory)}</p>
${bodyLinks ? `        ${bodyLinks}
` : ""}        <p>${escapeHTML(routeNote)}</p>
${fujiGuideBlock.trimEnd()}
        <p><a href="${liveHref(lang, prefix)}">${escapeHTML(liveMapCta)}</a></p>
      </section>
      ${explainer}
      ${miniMap}
      ${spotGuideDepthHTML(spot, lang)}
      ${photoGalleryHTML(spot, lang, prefix)}
      ${routeRelatedHTML(spot, lang)}
      <div class="spot-page-actions">
        <a class="btn btn-primary" href="${appUrl}">${escapeHTML(ui.appCta)}</a>
        <a class="btn btn-ghost" href="${appHref(lang, "", prefix)}">${escapeHTML(ui.searchCta)}</a>
      </div>
    </article>
  </main>
  <script src="${prefix}spot-map.js?v=20260707-map-mode-switch"></script>
</body>
</html>
`;
}

function englishIndexHTML() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>How to see Mt. Fuji from the Shinkansen | Shinkansen Window</title>
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0; url=guide.html">
  <link rel="canonical" href="${siteRoot}/en/guide.html">
  <meta property="og:title" content="How to see Mt. Fuji from the Shinkansen | Shinkansen Window">
  <meta property="og:description" content="Seat E, timing, and Tokaido Shinkansen window views beyond Mt. Fuji.">
  <meta property="og:image" content="${defaultOgImageUrl()}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${siteRoot}/en/guide.html">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${defaultOgImageUrl()}">
  ${analyticsSnippet()}
</head>
<body class="spot-page">
  <main>
    <article class="spot-page-article">
      <h1>Shinkansen Window guide moved</h1>
      <p class="spot-page-lead"><a href="guide.html">Open the English Mt. Fuji guide</a>.</p>
    </article>
  </main>
</body>
</html>
`;
}

function guideHTML(lang) {
  const ui = UI[lang];
  const prefix = lang === "ja" ? "" : "../";
  const guideUrl = lang === "ja" ? `${siteRoot}/guide.html` : `${siteRoot}/en/guide.html`;
  const appUrl = lang === "ja" ? "index.html#journey" : "../index.html?lang=en#journey";
  const otherUrl = lang === "ja" ? "en/guide.html" : "../guide.html";
  const questions = ui.guideQuestions.map((item) => {
    const href = lang === "ja"
      ? item.link
      : (item.link.startsWith("index") ? `../index.html?lang=en#gallery` : `../${item.link}`);
    return `<article class="faq-card">
        <h2>${escapeHTML(item.q)}</h2>
        <p>${escapeHTML(item.a)} <a href="${escapeHTML(href)}">${escapeHTML(item.linkText)}</a></p>
      </article>`;
  }).join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${guideUrl}#faq`,
    "inLanguage": lang,
    "mainEntity": ui.guideQuestions.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a },
    })),
  };
  const quickFacts = lang === "en" ? `
      <section class="spot-page-section guide-answer-panel" aria-label="Mt. Fuji quick answer">
        <div class="guide-answer-copy">
          <h2>${escapeHTML(ui.guidePracticalTitle)}</h2>
          <p>${escapeHTML(ui.guidePracticalBody)}</p>
        </div>
        <dl class="guide-fact-grid">
          ${ui.guideQuickFacts.map((fact) => `<div>
            <dt>${escapeHTML(fact.label)}</dt>
            <dd>${escapeHTML(fact.value)}</dd>
            <p>${escapeHTML(fact.detail)}</p>
          </div>`).join("")}
        </dl>
      </section>
      <section class="spot-page-section guide-featured-panel">
        <div class="guide-section-head">
          <h2>${escapeHTML(ui.guideFeaturedTitle)}</h2>
          <p>${escapeHTML(ui.guideFeaturedLead)}</p>
        </div>
        <div class="guide-visual-grid">
          ${["fuji", "hamanako", "toji"].map((id) => {
            const spot = SPOTS.find((item) => item.id === id);
            const data = spot.en || spot.ja;
            return `<a class="guide-visual-card" href="../spots/${spot.id}.html">
              <img src="../${escapeHTML(thumbnailSrc(spot.image))}" alt="${escapeHTML(data.name)}" loading="lazy" decoding="async">
              <span>${escapeHTML(data.area)}</span>
              <strong>${escapeHTML(data.name)}</strong>
              <em>${escapeHTML(data.hook)}</em>
            </a>`;
          }).join("")}
        </div>
      </section>
      <section class="spot-page-section guide-beyond-panel">
        <h2>${escapeHTML(ui.guideBeyondTitle)}</h2>
        <p>${escapeHTML(ui.guideBeyondBody)}</p>
        <div class="spot-page-actions">
          <a class="btn btn-primary" href="../index.html?lang=en#gallery">Browse timed window views</a>
          <a class="btn btn-ghost" href="../index.html?lang=en#journey">Find your train</a>
        </div>
      </section>
` : "";
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(ui.guideTitle)}</title>
  <meta name="description" content="${escapeHTML(ui.guideLead)}">
  <link rel="canonical" href="${guideUrl}">
  <link rel="alternate" hreflang="ja" href="${siteRoot}/guide.html">
  <link rel="alternate" hreflang="en" href="${siteRoot}/en/guide.html">
  <link rel="alternate" hreflang="x-default" href="${siteRoot}/guide.html">
  <link rel="stylesheet" href="${prefix}style.css?v=20260712-live-guide-ui">
  <meta property="og:title" content="${escapeHTML(ui.guideTitle)}">
  <meta property="og:description" content="${escapeHTML(ui.guideLead)}">
  <meta property="og:image" content="${defaultOgImageUrl()}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${guideUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(ui.guideTitle)}">
  <meta name="twitter:description" content="${escapeHTML(ui.guideLead)}">
  <meta name="twitter:image" content="${defaultOgImageUrl()}">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  ${analyticsSnippet()}
</head>
<body class="spot-page">
  ${siteHeaderHTML(lang, prefix, lang === "ja" ? "guide.html" : "../guide.html", lang === "ja" ? "en/guide.html" : "guide.html")}
  <main>
    <article class="spot-page-article">
      <p class="eyebrow">${escapeHTML(ui.eyebrow)}</p>
      <h1>${escapeHTML(ui.guideHeading)}</h1>
      <p class="spot-page-lead">${escapeHTML(ui.guideLead)}</p>
      <div class="spot-page-actions spot-page-actions-top">
        <a class="btn btn-primary" href="${appUrl}">${escapeHTML(ui.guideBack)}</a>
        <a class="btn btn-ghost" href="${lang === "ja" ? "spots/fuji.html" : "../spots/fuji.html"}">${escapeHTML(ui.guideQuestions[1].linkText)}</a>
      </div>${quickFacts}
      <section class="spot-page-section">
        <div class="faq-grid">${questions}</div>
      </section>
    </article>
  </main>
</body>
</html>
`;
}

function sitemapXML() {
  const baseUrls = [
    { loc: pageUrl("ja"), priority: "1.0", changefreq: "weekly" },
    { loc: `${siteRoot}/guide.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteRoot}/en/guide.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteRoot}/references.html`, priority: "0.4", changefreq: "monthly" },
  ];
  const spotUrls = SPOTS.flatMap((spot) => ["ja", "en"].map((lang) => ({
    loc: pageUrl(lang, spot.id),
    priority: featuredIds.includes(spot.id) ? "0.8" : "0.6",
    changefreq: "monthly",
  })));
  const urls = [...baseUrls, ...spotUrls].map((item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

for (const lang of ["ja", "en"]) {
  const dir = lang === "ja" ? path.join(appDir, "spots") : path.join(appDir, "en", "spots");
  fs.mkdirSync(dir, { recursive: true });
  for (const spot of SPOTS) {
    fs.writeFileSync(path.join(dir, `${spot.id}.html`), spotPageHTML(spot, lang), "utf8");
  }
}

fs.mkdirSync(path.join(appDir, "en"), { recursive: true });
fs.writeFileSync(path.join(appDir, "en", "index.html"), englishIndexHTML(), "utf8");
// guide.html and en/guide.html are hand-edited SEO answer pages.
// Do not regenerate them from the older lightweight template here.
fs.writeFileSync(path.join(appDir, "sitemap.xml"), sitemapXML(), "utf8");

console.log(`Generated ${SPOTS.length} Japanese spot pages, ${SPOTS.length} English spot pages, /en/, and sitemap.xml`);
