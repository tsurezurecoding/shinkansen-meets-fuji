import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const dataPath = path.join(appDir, "data.js");
const trackPath = path.join(appDir, "track.js");
const siteRoot = "https://www.michikusa-travel.com";
const today = "2026-07-25";
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
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "東京 → 新大阪の車窓",
    railCountSuffix: " の見どころ",
    railNowLabel: (name, min, seat) => `<b>${name}</b>東京から約${min}分 ・ ${seat}`,
    railCta: "乗る列車でガイドを作る",
    railFoot: "車窓図鑑で写真から探す →",
    railStationSuffix: "分",
    zoomHint: "クリックで拡大",
    lightboxClose: "閉じる",
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
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "Tokyo → Shin-Osaka window",
    railCountSuffix: " views",
    railNowLabel: (name, min, seat) => `<b>${name}</b>About ${min} min from Tokyo · ${seat}`,
    railCta: "Build my guide by train",
    railFoot: "Browse by photo →",
    railStationSuffix: " min",
    zoomHint: "click to enlarge",
    lightboxClose: "Close",
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
  return area.replace(/^(Around|Just before|Just after)\s+/i, "");
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
  return lang === "en" ? `${prefix}en/${hash}` : `${prefix}index.html${hash}`;
}

function liveHref(lang, prefix = "../") {
  return lang === "en" ? `${prefix}en/live/` : `${prefix}live/`;
}

function languageSwitchHref(lang, spotId) {
  return lang === "ja" ? `../en/spots/${spotId}.html` : `../../spots/${spotId}.html`;
}

function siteHeaderHTML(lang, prefix, jaHref, enHref) {
  const ui = UI[lang];
  const homeHref = lang === "en" ? `${prefix}en/` : `${prefix}index.html`;
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
      <a href="${lang === "en" ? `${prefix}en/#journey` : `${prefix}index.html#journey`}">${lang === "ja" ? "列車選択" : "Train Search"}</a>
      <a href="${liveHref(lang, prefix)}">${lang === "ja" ? "ライブガイド" : "Live Guide"}</a>
      <a href="${lang === "en" ? `${prefix}en/zukan.html` : `${prefix}zukan.html`}">${lang === "ja" ? "車窓図鑑" : "Field Guide"}</a>
      <a class="top-nav-overflow" href="${prefix}${lang === "en" ? "en/" : ""}guide.html">${lang === "ja" ? "FAQ" : "FAQ"}</a>
      <a href="${lang === "en" ? `${prefix}en/journal.html` : `${prefix}journal.html`}">${lang === "ja" ? "メダル帖" : "Journal"}</a>
      <details class="top-nav-more">
        <summary>${lang === "ja" ? "もっと見る" : "More"}</summary>
        <div class="top-nav-menu">
          <a class="top-nav-menu-compact" href="${prefix}${lang === "en" ? "en/" : ""}guide.html">${lang === "ja" ? "FAQ" : "FAQ"}</a>
          <a href="${lang === "en" ? `${prefix}en/lp.html` : `${prefix}lp.html`}">${lang === "ja" ? "新幹線の窓とは" : "About this app"}</a>
          <a href="${lang === "en" ? `${prefix}en/mieru.html` : `${prefix}mieru.html`}">${lang === "ja" ? "見える予報β" : "Visibility β"}</a>
          <a href="${lang === "en" ? `${prefix}en/sumie.html` : `${prefix}sumie.html`}">${lang === "ja" ? "墨絵車窓" : "Sumie Window"}</a>
          <a href="${lang === "en" ? `${prefix}en/somato.html` : `${prefix}somato.html`}">${lang === "ja" ? "車窓走馬灯" : "Window Journey"}</a>
          <a href="${lang === "en" ? `${prefix}en/references.html` : `${prefix}references.html`}">${lang === "ja" ? "リンク集" : "Links"}</a>
          <a href="${prefix}${lang === "en" ? "en/" : ""}contact.html">${lang === "ja" ? "お問い合わせ" : "Contact"}</a>
          <a href="${lang === "en" ? `${prefix}en/privacy.html` : `${prefix}privacy.html`}">${lang === "ja" ? "プライバシーポリシー" : "Privacy Policy"}</a>
        </div>
      </details>
    </nav>
    <div class="lang-switch" role="group" aria-label="Language">
      <a class="${jaActive.trim()}" href="${escapeHTML(lang === "en" ? `${jaHref}${jaHref.includes("?") ? "&" : "?"}lang=ja` : jaHref)}">日本語</a>
      <a class="${enActive.trim()}" href="${escapeHTML(enHref)}">EN</a>
    </div>
  </header>`;
}

function contentRailHTML(lang, prefix) {
  const guideHref = lang === "en" ? `${prefix}en/?intro=1` : `${prefix}lp.html`;
  const items = lang === "en" ? [
    { href: `${prefix}en/guide.html`, img: "images/thumbs/content-faq.webp", label: "FAQ", title: "Mt. Fuji FAQ", desc: "Check the timing, seat side and cloudy-day answers." },
    { href: `${prefix}en/mieru.html`, img: "images/thumbs/content-mieru.webp", label: "FORECAST", title: "Visibility β", desc: "Check whether Mt. Fuji is likely to show today." },
    { href: `${prefix}en/sumie.html`, img: "images/thumbs/content-sumie.webp", label: "EXTRA", title: "Sumie Window", desc: "Ride the route as a quiet ink-painting window." },
    { href: `${prefix}en/somato.html`, img: "images/thumbs/content-somato.webp", label: "EXTRA", title: "Window Journey", desc: "Let real window photos flow past like a short trip." },
    { href: `${prefix}en/journal.html`, img: "images/stamps/stamp_fuji.svg", label: "JOURNAL", title: "Stamps and medals", desc: "Keep the views you found during the ride." },
    { href: guideHref, img: "images/thumbs/og-shinkansen-window.webp", label: "GUIDE", title: "About this app", desc: "See how to use and enjoy it in 30 seconds." },
    { href: `${prefix}en/references.html`, img: "images/thumbs/20260616_fuji_sttraveler.webp", label: "LINKS", title: "Window links", desc: "Sources and reading for deeper window-view trips." },
    { href: `${prefix}en/contact.html`, img: "images/thumbs/content-contact.webp", label: "CONTACT", title: "Contact", desc: "Send photo suggestions, corrections or feedback." },
  ] : [
    { href: `${prefix}guide.html`, img: "images/thumbs/content-faq.webp", label: "FAQ", title: "富士山FAQ", desc: "見える時刻、座席側、曇りの日の答えを確認。" },
    { href: `${prefix}mieru.html`, img: "images/thumbs/content-mieru.webp", label: "FORECAST", title: "見える予報β", desc: "今日の空で富士山が見えそうかを確認。" },
    { href: `${prefix}sumie.html`, img: "images/thumbs/content-sumie.webp", label: "EXTRA", title: "墨絵車窓", desc: "東海道新幹線の車窓を、静かな墨絵で。" },
    { href: `${prefix}somato.html`, img: "images/thumbs/content-somato.webp", label: "EXTRA", title: "車窓走馬灯", desc: "実際の車窓写真で、旅を短くめぐる。" },
    { href: `${prefix}journal.html`, img: "images/stamps/stamp_fuji.svg", label: "JOURNAL", title: "メダル帖", desc: "見つけた景色をスタンプとメダルで記録。" },
    { href: guideHref, img: "images/thumbs/og-shinkansen-window.webp", label: "GUIDE", title: "新幹線の窓とは", desc: "使い方と楽しみ方を30秒で紹介。" },
    { href: `${prefix}references.html`, img: "images/thumbs/20260616_fuji_sttraveler.webp", label: "LINKS", title: "車窓リンク集", desc: "出典や参考記事をまとめて読む。" },
    { href: `${prefix}contact.html`, img: "images/thumbs/content-contact.webp", label: "CONTACT", title: "お問い合わせ", desc: "写真提供、情報の訂正、ご感想はこちら。" },
  ];
  return `<section class="content-rail-section" aria-labelledby="contentRailTitle">
    <div class="section-head">
      <p class="eyebrow">${lang === "en" ? "MORE TO TRY" : "MORE TO TRY"}</p>
      <h2 id="contentRailTitle">${lang === "en" ? "More ways to enjoy the window" : "車窓をもっと楽しむ"}</h2>
    </div>
    <div class="content-rail">
${items.map((item) => `      <a class="content-rail-card" href="${item.href}">
        <img src="${prefix}${item.img}" alt="" loading="lazy" decoding="async">
        <span class="content-rail-card-body">
          <small>${item.label}</small>
          <strong>${item.title}</strong>
          <span>${item.desc}</span>
        </span>
      </a>`).join("\n")}
    </div>
  </section>`;
}

function analyticsSnippet() {
  return `<script>
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

function isOwnPhotoSrc(src) {
  return typeof src === "string" && /michikusa/i.test(src);
}

function spotOgImageUrl(spot) {
  if (spot.ogImage) return `${siteRoot}/${spot.ogImage}`;
  if (isOwnPhotoSrc(spot.image)) return `${siteRoot}/${spot.image}`;
  const ownPhoto = (spot.photos || []).find((p) => isOwnPhotoSrc(p?.src));
  if (ownPhoto) return `${siteRoot}/${ownPhoto.src}`;
  return defaultOgImageUrl();
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

function ownPhotoItems(spot, lang) {
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
  return [...main, ...(spot.photos || []).filter((item) => item.role !== "reference")].filter((item) => item.src);
}

function photoItems(spot, lang) {
  const items = [...ownPhotoItems(spot, lang)];
  for (const id of spot.pagePhotoSpotIds || []) {
    const linkedSpot = SPOTS.find((item) => item.id === id);
    if (linkedSpot) items.push(...ownPhotoItems(linkedSpot, lang));
  }
  const seen = new Set();
  return items.filter((item) => {
    if (!item.src || seen.has(item.src)) return false;
    if (item.illustration) return false;
    seen.add(item.src);
    return true;
  });
}

/* ===== 左ペイン & 本文写真の差し込み =====
 *
 * PCでスポットページに着地したユーザーに、東海道新幹線の見どころ全体を
 * 意識させて列車検索・他スポットへの回遊を促す。
 * モバイルではレールを隠し、記事末尾の CTA に任せる。 */

const INLINE_PHOTO_CATEGORIES = new Set(["classic", "notable"]);
// 主画像と意味が違う写真だけを本文に差し込む。ここは spot.photos のインデックス
const CURATED_ANGLE_PHOTOS = {
  hamanako: [4], // 主画像は E 席。反対の A 席・赤鳥居を見せる
};
const RAIL_THUMB_CATEGORIES = new Set(["classic", "notable"]);

/** 本文に差し込む写真を選ぶ。主画像と別の視点（反対席側／夜景）に限定する */
function inlinePhotoIndices(spot) {
  if (!INLINE_PHOTO_CATEGORIES.has(spot.category)) return [];
  const photos = spot.photos || [];
  const picks = new Set();
  (CURATED_ANGLE_PHOTOS[spot.id] || []).forEach((i) => {
    if (photos[i]) picks.add(i);
  });
  const nightIdx = photos.findIndex((p) => p.timeOfDay === "night");
  if (nightIdx >= 0) picks.add(nightIdx);
  return [...picks].slice(0, 2);
}

/** ギャラリー用の写真リストから、本文に回した分を除外する */
function galleryItems(spot, lang) {
  const inline = new Set(inlinePhotoIndices(spot).map((i) => (spot.photos || [])[i]?.src).filter(Boolean));
  return photoItems(spot, lang).filter((item) => !inline.has(item.src));
}

/** 本文内図（クリックで拡大） */
function inlineFigureHTML(spot, lang, prefix) {
  const indices = inlinePhotoIndices(spot);
  if (!indices.length) return { first: "", second: "" };
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const render = (idx) => {
    const item = (spot.photos || [])[idx];
    if (!item?.src) return "";
    const alt = localized(item.alt, lang) || ui.photoAlt(data.name);
    const note = localized(item.note, lang);
    const credit = creditText(item.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
    const href = item.sourceUrl || item.url || "";
    const creditHTML = href
      ? `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
      : escapeHTML(credit);
    const date = item.date ? `<span>${escapeHTML(item.date)}</span>` : "";
    const zoomSrc = `${prefix}${escapeHTML(item.src)}`; // 原寸への差し替え用
    return `<figure class="spot-page-inline-figure">
        <button type="button" class="spot-page-inline-zoom" data-zoom-src="${zoomSrc}" aria-label="${escapeHTML(note || alt)}">
          <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(item.src))}" alt="${escapeHTML(alt)}">
        </button>
        <figcaption>${note ? `<strong>${escapeHTML(note)}</strong>` : ""}<span>${creditHTML}</span>${date}<span class="spot-page-zoom-hint">${escapeHTML(ui.zoomHint)}</span></figcaption>
      </figure>`;
  };
  return { first: render(indices[0]), second: render(indices[1]) };
}

/** 主画像のキャプション（説明文＋出典リンク＋撮影日） */
function heroFigcaptionHTML(spot, lang) {
  const ui = UI[lang];
  const pc = spot.photoCredit || {};
  const note = localized(pc.note, lang);
  const credit = creditText(pc, lang) || ui.fallbackCredit;
  const creditHTML = pc.url
    ? `<a href="${escapeHTML(pc.url)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
    : escapeHTML(credit);
  const bits = [];
  if (note) bits.push(`<strong>${escapeHTML(note)}</strong>`);
  bits.push(`<span>${creditHTML}</span>`);
  if (pc.date) bits.push(`<span>${escapeHTML(pc.date)}</span>`);
  return `<figcaption>${bits.join("")}</figcaption>`;
}

/** 左ペインのタイムライン。SPOTS と ROUTE をここで直接使う */
function spotRailHTML(spot, lang, prefix) {
  const ui = UI[lang];
  const currentId = spot.id;

  const rows = [];
  for (const st of ROUTE.refStations) {
    rows.push({ kind: "station", min: st.min, name: st[lang] || st.ja, major: !!st.major });
  }
  for (const sp of SPOTS) {
    if (sp.minutesFromTokyo == null) continue;
    const data = sp[lang] || sp.ja || {};
    rows.push({
      kind: "spot",
      min: sp.minutesFromTokyo,
      id: sp.id,
      name: data.name || sp.id,
      side: sp.side,
      thumb: RAIL_THUMB_CATEGORIES.has(sp.category) && sp.image ? sp.image : "",
    });
  }
  rows.sort((a, b) => a.min - b.min || (a.kind === "station" ? -1 : 1));

  const me = SPOTS.find((sp) => sp.id === currentId);
  const meData = me?.[lang] || me?.ja || {};
  const nowLabel = me
    ? ui.railNowLabel(escapeHTML(meData.name || currentId), me.minutesFromTokyo, escapeHTML(sideLabel(me, lang)))
    : "";

  const items = rows
    .map((r) => {
      if (r.kind === "station") {
        return `<li class="spot-page-rail-row spot-page-rail-station${r.major ? " is-major" : ""}">` +
          `<span class="spot-page-rail-station-name">${escapeHTML(r.name)}</span>` +
          `<span class="spot-page-rail-station-min">${r.min}${escapeHTML(ui.railStationSuffix)}</span>` +
          `</li>`;
      }
      const isCurrent = r.id === currentId;
      const seatCls = r.side === "E" ? "is-e" : r.side === "A" ? "is-a" : "";
      const seatLabel = r.side === "E" ? "E" : r.side === "A" ? "A" : "—";
      const href = `${r.id}.html`;
      const thumb = r.thumb
        ? `<span class="spot-page-rail-thumb-wrap">` +
            `<img class="spot-page-rail-thumb" src="${prefix}${escapeHTML(thumbnailSrc(r.thumb))}" alt="" loading="lazy" decoding="async" width="38" height="38">` +
            `<img class="spot-page-rail-preview" src="${prefix}${escapeHTML(thumbnailSrc(r.thumb))}" alt="" loading="lazy" decoding="async">` +
          `</span>`
        : `<span class="spot-page-rail-nothumb" aria-hidden="true"></span>`;
      return `<li class="spot-page-rail-row spot-page-rail-spot${isCurrent ? " is-current" : ""}">` +
        `<a class="spot-page-rail-link" href="${escapeHTML(href)}"${isCurrent ? ' aria-current="page"' : ""}>` +
        thumb +
        `<span class="spot-page-rail-min">${r.min}</span>` +
        `<span class="spot-page-rail-name">${escapeHTML(r.name)}</span>` +
        `<span class="spot-page-rail-seat ${seatCls}">${seatLabel}</span>` +
        `</a></li>`;
    })
    .join("");

  const spotCount = SPOTS.filter((sp) => sp.minutesFromTokyo != null).length;

  return `<aside class="spot-page-rail" aria-label="${escapeHTML(ui.railTitle)}">
        <div class="spot-page-rail-head">
          <p class="spot-page-rail-eyebrow">${escapeHTML(ui.railEyebrow)}</p>
          <p class="spot-page-rail-title">${escapeHTML(ui.railTitle)}</p>
          <p class="spot-page-rail-count"><strong>${spotCount}</strong>${escapeHTML(ui.railCountSuffix)}</p>
          ${nowLabel ? `<p class="spot-page-rail-now">${nowLabel}</p>` : ""}
          <a class="spot-page-rail-cta" href="${appHref(lang, "", prefix)}">${escapeHTML(ui.railCta)}</a>
        </div>
        <div class="spot-page-rail-list-wrap">
          <ol class="spot-page-rail-list">${items}</ol>
        </div>
        <div class="spot-page-rail-foot">
          <a href="${prefix}zukan.html">${escapeHTML(ui.railFoot)}</a>
        </div>
      </aside>`;
}

/** ライトボックスのHTMLとJS（本文写真のクリック拡大） */
function lightboxHTML(lang) {
  const ui = UI[lang];
  return `<div class="spot-page-lightbox" id="spotPageLightbox" hidden>
    <button type="button" class="spot-page-lightbox-close" aria-label="${escapeHTML(ui.lightboxClose)}">&times;</button>
    <figure><img alt=""><figcaption></figcaption></figure>
  </div>`;
}
function lightboxScript() {
  return `<script>
(function () {
  "use strict";
  var box = document.getElementById("spotPageLightbox");
  if (!box) return;
  var img = box.querySelector("img");
  var cap = box.querySelector("figcaption");
  function open(src, caption) {
    img.src = src;
    cap.textContent = caption || "";
    box.hidden = false;
    document.documentElement.style.overflow = "hidden";
  }
  function close() {
    box.hidden = true;
    img.src = "";
    document.documentElement.style.overflow = "";
  }
  box.addEventListener("click", function (e) { if (e.target === box || e.target.classList.contains("spot-page-lightbox-close")) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  document.querySelectorAll(".spot-page-inline-zoom").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var thumb = btn.querySelector("img");
      var src = btn.getAttribute("data-zoom-src") || (thumb && thumb.getAttribute("src")) || "";
      var fc = btn.parentElement.querySelector("figcaption");
      var text = fc ? fc.textContent.replace(/\\s+/g, " ").trim() : "";
      // 「クリックで拡大」を末尾から取り除く
      text = text.replace(/(?:クリックで拡大|click to enlarge)\\s*$/, "").trim();
      open(src, text);
    });
  });
})();
</script>`;
}
function explainerFigureHTML(spot, lang, prefix) {
  const figure = spot.explainerFigure;
  if (!figure?.src) return "";
  const alt = localized(figure.alt, lang) || "";
  const caption = localized(figure.caption, lang) || "";
  const credit = creditText(figure.credit, lang) || "";
  const href = figure.sourceUrl || "";
  const creditHTML = credit
    ? (href
      ? `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
      : escapeHTML(credit))
    : "";
  const captionBits = [caption ? `<strong>${escapeHTML(caption)}</strong>` : "", creditHTML ? `<span>${creditHTML}</span>` : "", figure.date ? `<span>${escapeHTML(figure.date)}</span>` : ""].filter(Boolean).join(" ");
  return `<figure class="spot-page-explainer-figure">
        <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(figure.src))}" alt="${escapeHTML(alt)}">
        ${captionBits ? `<figcaption>${captionBits}</figcaption>` : ""}
      </figure>`;
}

function photoGalleryHTML(spot, lang, prefix, itemsOverride) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const items = itemsOverride || photoItems(spot, lang);
  if (!items.length) return "";
  const cards = items.map((item, index) => {
    const note = localized(item.note, lang);
    const credit = creditText(item.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
    const href = item.sourceUrl || item.url || "";
    const creditHTML = href
      ? `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
      : escapeHTML(credit);
    const date = item.date ? `\n          <span>${escapeHTML(item.date)}</span>` : "";
    return `<figure class="spot-page-photo">
        <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(item.src))}" alt="${escapeHTML(localized(item.alt, lang) || ui.photoAlt(data.name))}">
        <figcaption>
          <strong>${note ? escapeHTML(note) : escapeHTML(ui.photoFallback(data.name, index))}</strong>
          <span>${creditHTML}</span>${date}
        </figcaption>
      </figure>`;
  }).join("");
  return `<section class="spot-page-section">
        <h2>${escapeHTML(localized(spot.photoSectionHeading, lang) || ui.sectionPhotos(data.name))}</h2>
        <div class="spot-page-photo-grid">${cards}</div>
      </section>`;
}

function spotGuideHref(spot) {
  const pageId = spot.guidePageId || spot.id;
  return `${pageId}.html${spot.guideAnchor ? `#${spot.guideAnchor}` : ""}`;
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
    return `<a href="${spotGuideHref(item)}">
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
  const ui = UI[lang];
  const items = (spot.references || []).map((ref) => {
    const href = referenceUrl(ref, lang);
    const label = localized(ref?.label, lang);
    if (!href || !label) return "";
    return `<li><a href="${escapeHTML(href)}" rel="noopener" target="_blank">${text(label)}</a></li>`;
  }).filter(Boolean).join("");
  if (!items) return "";
  return `<section class="spot-page-section spot-page-refs">
        <h2>${escapeHTML(ui.sectionRefs)}</h2>
        <ul>${items}</ul>
      </section>`;
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

function sharedGuideHTML(spot, lang) {
  const chapters = (spot.sharedGuideSpotIds || [])
    .map((id) => SPOTS.find((item) => item.id === id))
    .filter(Boolean);
  return chapters.map((chapter) => {
    const data = chapter[lang] || chapter.ja || {};
    const paragraphs = localized(chapter.sharedGuideStory, lang) || [];
    const body = Array.isArray(paragraphs) && paragraphs.length
      ? paragraphs
      : [data.story || ""];
    return `<section class="spot-page-section" id="${escapeHTML(chapter.guideAnchor || chapter.id)}">
        <h2>${escapeHTML(localized(chapter.sharedGuideHeading, lang) || data.name)}</h2>
        <p><strong>${escapeHTML(data.hook || "")}</strong></p>
        ${body.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("\n        ")}
      </section>`;
  }).join("\n      ");
}

function sharedGuideNoticeHTML(spot, lang) {
  if (!spot.guidePageId || spot.guidePageId === spot.id) return "";
  const href = `${spot.guidePageId}.html${spot.guideAnchor ? `#${spot.guideAnchor}` : ""}`;
  return lang === "ja"
    ? `<section class="spot-page-section guide-answer-panel">
        <div class="guide-answer-copy">
          <h2>浜名湖の景色と一緒に見る</h2>
          <p>遠くの富士山は、湖面、養殖棚、サンマリンブリッジへと続く浜名湖の車窓の一部として現れます。</p>
          <p><a class="inline-cta" href="${escapeHTML(href)}">浜名湖の見どころと写真を見る →</a></p>
        </div>
      </section>`
    : `<section class="spot-page-section guide-answer-panel">
        <div class="guide-answer-copy">
          <h2>See it as part of the Lake Hamana crossing</h2>
          <p>Distant Fuji appears within a sequence of water, aquaculture structures and Sun Marine Bridge.</p>
          <p><a class="inline-cta" href="${escapeHTML(href)}">See Lake Hamana highlights and photographs →</a></p>
        </div>
      </section>`;
}

function articleImageHTML(spot, lang, prefix) {
  const image = spot.articleImage || (spot.photos || []).find((item) => item.role === "reference");
  if (!image?.src) return "";
  const credit = creditText(image.credit, lang);
  const source = image.sourceUrl || "";
  const creditHTML = source
    ? `<a href="${escapeHTML(source)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
    : escapeHTML(credit);
  const date = image.date ? `
            <span>${escapeHTML(image.date)}</span>` : "";
  return `<section class="spot-page-section spot-page-reference-section">
        <h2>${escapeHTML(localized(image.heading, lang))}</h2>
        <p>${escapeHTML(localized(image.intro, lang))}</p>
        <figure class="spot-page-reference-figure">
          <a href="${escapeHTML(source || `${prefix}${image.src}`)}"${source ? ' rel="noopener" target="_blank"' : ""}>
            <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(image.src))}" alt="${escapeHTML(localized(image.alt, lang))}">
          </a>
          <figcaption>
            <strong>${escapeHTML(localized(image.caption, lang))}</strong>
            <span>${creditHTML}</span>${date}
          </figcaption>
        </figure>
      </section>`;
}

function pageHeadingHTML(spot, lang, fallback) {
  const chunks = localized(spot.pageHeadingChunks, lang);
  if (Array.isArray(chunks) && chunks.length) {
    return chunks
      .map((chunk) => `<span class="copy-chunk">${escapeHTML(chunk)}</span>`)
      .join(lang === "en" ? " " : "");
  }
  return escapeHTML(localized(spot.pageHeading, lang) || fallback);
}

function durationGuideText(spot, lang) {
  const seconds = Number(spot.durationSec);
  if (!Number.isFinite(seconds)) {
    return lang === "ja"
      ? "見える時間は列車や天候で変わります。近づいてから探すより、少し前から窓の外を追う方が見つけやすくなります。"
      : "Visibility changes by train and weather. Start watching a little early instead of waiting until the view is already beside you.";
  }
  if (lang === "ja") {
    if (seconds <= 2) return "はっきり見えるのは1〜2秒ほど。ライブガイドの案内が出たら、先に窓へ目を移しておくのが現実的です。";
    if (seconds <= 8) return "はっきり見えるのは数秒ほど。案内が出てからカメラを探すより、先に座席側と窓の方向を決めておくと拾いやすくなります。";
    if (seconds <= 12) return "見えるのは10秒前後。先に座席側と窓の方向を決めておくと、景色の始まりから追いやすくなります。";
    if (seconds <= 20) return "見えるのは10数秒ほど。建物や地形で隠れることがあるため、少し前から窓を見ておくと拾いやすくなります。";
    return "この景観は区間の中で断続的に見えます。建物や地形で隠れるため、表示時間は連続して見える秒数ではなく、探し始める区間の目安です。";
  }
  if (seconds <= 2) return "The clearest view lasts only one or two seconds. Let Live Guide warn you before you look up.";
  if (seconds <= 8) return "The clearest view lasts only a few seconds. Decide the seat side and window direction before it arrives rather than reaching for your camera late.";
  if (seconds <= 12) return "The view lasts around 10 seconds. Choose the seat side and window direction early so you can follow it from the start.";
  if (seconds <= 20) return "The view lasts roughly 10 to 20 seconds, though buildings and terrain may interrupt it. Start watching a little early.";
  return "This wider view appears intermittently through the section. Buildings and terrain may block it, so the timing is a guide for when to start looking, not a continuous visibility claim.";
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

function spotGuideDepthHTML(spot, lang) {
  const data = spot[lang] || spot.ja || {};
  const title = lang === "ja" ? `${data.name}を見逃さないコツ` : `How to catch ${data.name}`;
  const seat = sideLabel(spot, lang);
  const intro = lang === "ja"
    ? `${data.area || "この区間"}が近づいたら、${seat}の窓を先に意識してください。現在地から追う場合はライブガイド、事前に確認する場合はこのページの地図が役立ちます。`
    : `As you approach ${enApproachArea(data.area)}, start watching from ${seat}. Use Live Guide while riding, or the map on this page before you board.`;
  return `<section class="spot-page-section">
        <h2>${escapeHTML(title)}</h2>
        <h3>${escapeHTML(lang === "ja" ? "1. 先に見る方向を決める" : "1. Choose the window first")}</h3>
        <p>${escapeHTML(intro)}</p>
        <p>${escapeHTML(durationGuideText(spot, lang))}</p>
        <h3>${escapeHTML(lang === "ja" ? "2. 見どころ" : "2. Highlights")}</h3>
        <p>${escapeHTML(localized(spot.guideHighlight, lang) || sceneGuideText(spot, lang, data.name))}</p>
${photoTipHTML(spot, lang)}      </section>`;
}

// 撮影のコツ。見えている時間が短く「撮れるかどうか」自体が目的になっているスポット向けの
// 任意ブロックで、spot.photoTip があるときだけ「見逃さないコツ」セクションの3番目に出る。
function photoTipHTML(spot, lang) {
  const photoTip = spot.photoTip;
  if (!photoTip) return "";
  const paras = photoTip[lang] || photoTip.ja || [];
  if (!paras.length) return "";
  const heading = localized(photoTip.heading, lang);
  if (!heading) return "";
  const prefix = lang === "ja" ? "3. " : "3. ";
  return `        <h3>${escapeHTML(prefix + heading)}</h3>
${paras.map((para) => `        <p>${escapeHTML(para)}</p>`).join("\n")}
`;
}

function spotPageHTML(spot, lang) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const otherLang = lang === "ja" ? "en" : "ja";
  const title = localized(spot.pageTitle, lang) || (lang === "ja"
    ? `${data.name}はいつ見える？座席側は？ ${data.area}${ui.titleSuffix}`
    : `When can you see ${data.name} from the Shinkansen? ${data.area} | Shinkansen Window`);
  const desc = localized(spot.metaDescription, lang) || description(spot, lang);
  const url = pageUrl(lang, spot.id);
  const prefix = lang === "ja" ? "../" : "../../";
  const appUrl = appHref(lang, spot.id, prefix);
  const photos = photoItems(spot, lang);
  // 本文へ差し込む写真はギャラリーから外す。件数はギャラリー基準で表示する
  const galleryPhotos = galleryItems(spot, lang);
  const photoCount = photos.length;
  const heroFigcaption = heroFigcaptionHTML(spot, lang);
  const inlineFigures = inlineFigureHTML(spot, lang, prefix);
  const railHTML = spotRailHTML(spot, lang, prefix);
  const lightbox = lightboxHTML(lang);
  const lightboxJs = lightboxScript();
  const routeNote = localized(spot.routeNote, lang) || ui.routeNote(data.area, sideLabel(spot, lang));
  const FUJI_FAMILY = new Set(["fuji", "ota-fuji", "sagami-fuji", "left-fuji", "hamanako-fuji"]);
  const fujiGuideLink = spot.id === "fuji"
    ? (lang === "ja"
      ? `<p>このページは三島〜新富士の写真と景色に集中しています。座席の取り方、東京・京都・新大阪からの時刻、曇りの日、左富士は、<a href="../guide.html">富士山FAQ・乗車前ガイド</a>で確認できます。</p>`
      : `<p>This page focuses on the photographs and scenery between Mishima and Shin-Fuji. For seat booking, timing from Tokyo, Kyoto or Osaka, cloudy-day advice, and Left Fuji, see the <a href="../guide.html">Mt. Fuji FAQ and pre-trip guide</a>.</p>`)
    : FUJI_FAMILY.has(spot.id)
    ? (lang === "ja"
      ? `<p>富士山が見える座席側や、東京・京都・新大阪からの時刻、曇りの日の見え方、他の富士山ビュースポットとの違いは、<a href="../guide.html">富士山FAQ・乗車前ガイド</a>にまとめています。</p>`
      : `<p>Seat side for Mt. Fuji, timing from Tokyo / Kyoto / Osaka, cloudy-day advice, and how this view compares with the other Fuji viewpoints are gathered in the <a href="../guide.html">Mt. Fuji FAQ and pre-trip guide</a>.</p>`)
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
  const explainerFigure = explainerFigureHTML(spot, lang, prefix);
  const explainerFigureAfterIndex = Number.isInteger(spot.explainerFigure?.afterParagraph)
    ? Math.min(explainerParas.length - 1, Math.max(0, spot.explainerFigure.afterParagraph))
    : 0;
  const explainer = explainerData && explainerParas.length
    ? `<section class="spot-page-section">
        <h2>${escapeHTML(localized(explainerData.heading, lang))}</h2>
        ${explainerParas.map((p, index) => {
          const paragraph = `<p>${escapeHTML(p)}</p>`;
          if (explainerFigure && index === explainerFigureAfterIndex) {
            return `${paragraph}\n        ${explainerFigure}`;
          }
          return paragraph;
        }).join("\n        ")}
      </section>`
    : "";
  const sharedGuide = sharedGuideHTML(spot, lang);
  const sharedGuideNotice = sharedGuideNoticeHTML(spot, lang);
  const articleImage = articleImageHTML(spot, lang, prefix);
  const sharedGuideNoticeBlock = sharedGuideNotice ? `      ${sharedGuideNotice}\n` : "";
  // Keep the legacy whitespace-only separator when no explainer exists so
  // regenerating one spot does not create unrelated diffs in all static pages.
  const explainerBlock = explainer ? `      ${explainer}\n` : "      \n";
  const articleImageBlock = articleImage ? `      ${articleImage}\n` : "";
  const sharedGuideBlock = sharedGuide ? `      ${sharedGuide}\n` : "";
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
        "image": spotOgImageUrl(spot),
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
  <link rel="alternate" hreflang="x-default" href="${pageUrl("en", spot.id)}">
  <script src="${prefix}language-router.js?v=20260726-language-choice"></script>
  <link rel="stylesheet" href="${prefix}style.css?v=20260727-kiyosu-challenge">
  <meta property="og:title" content="${text(title)}">
  <meta property="og:description" content="${text(desc)}">
  <meta property="og:image" content="${spotOgImageUrl(spot)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${spotOgImageUrl(spot)}">
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
    <header class="spot-page-article spot-page-hero">
      <p class="eyebrow">${escapeHTML(ui.eyebrow)}</p>
      <h1>${pageHeadingHTML(spot, lang, ui.titleQuestion(data.name))}</h1>
      <p class="spot-page-lead">${escapeHTML(data.hook || "")}</p>
    </header>
    <div class="spot-page-shell">
      ${railHTML}
      <article class="spot-page-article">
      <figure class="spot-page-figure">
        <img src="${prefix}${escapeHTML(thumbnailSrc(heroSrc))}" alt="${escapeHTML(ui.photoAlt(data.name))}" decoding="async" fetchpriority="high">
        ${heroFigcaption}
      </figure>
      <dl class="spot-page-facts">
        <div><dt>${escapeHTML(ui.facts[0])}</dt><dd>${escapeHTML(data.area || "")}</dd></div>
        <div><dt>${escapeHTML(ui.facts[1])}</dt><dd>${escapeHTML(sideLabel(spot, lang))}</dd></div>
        <div><dt>${escapeHTML(ui.facts[2])}</dt><dd>${escapeHTML(ui.minutes(spot.minutesFromTokyo))}</dd></div>
        <div><dt>${escapeHTML(ui.facts[3])}</dt><dd>${photoCount} ${escapeHTML(ui.photoUnit)}</dd></div>
      </dl>
${sharedGuideNoticeBlock}      <section class="spot-page-section">
        <h2>${escapeHTML(localized(spot.sectionHeading, lang) || ui.sectionHow(data.name))}</h2>
        <p>${escapeHTML(pageStory)}</p>
${bodyLinks ? `        ${bodyLinks}
` : ""}        <p>${escapeHTML(routeNote)}</p>
${fujiGuideBlock.trimEnd()}
        <p><a href="${liveHref(lang, prefix)}">${escapeHTML(liveMapCta)}</a></p>
      </section>
${inlineFigures.first ? `      ${inlineFigures.first}\n` : ""}${explainerBlock}${inlineFigures.second ? `      ${inlineFigures.second}\n` : ""}${articleImageBlock}${sharedGuideBlock}      ${miniMap}
      ${spotGuideDepthHTML(spot, lang)}
      ${photoGalleryHTML(spot, lang, prefix, galleryPhotos)}
      ${refs}
      ${routeRelatedHTML(spot, lang)}
      </article>
    </div>
    ${contentRailHTML(lang, prefix)}
  </main>
  ${lightbox}
  <script src="${prefix}spot-map.js?v=20260707-map-mode-switch"></script>
  ${lightboxJs}
</body>
</html>
`;
}

function englishIndexHTML() {
  const featured = ["fuji", "hamanako", "solar-ark", "torikai-train-depot"].map((id) => {
    const spot = SPOTS.find((item) => item.id === id);
    const data = spot.en || spot.ja;
    return `<a class="guide-visual-card" href="spots/${spot.id}.html">
          <img src="../${escapeHTML(thumbnailSrc(spot.image))}" alt="${escapeHTML(data.name)} from the Shinkansen window" loading="lazy" decoding="async">
          <span>${escapeHTML(data.area)}</span>
          <strong>${escapeHTML(data.name)}</strong>
          <em>${escapeHTML(data.hook)}</em>
        </a>`;
  }).join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteRoot}/en/#website`,
    "name": "Shinkansen Window",
    "url": `${siteRoot}/en/`,
    "inLanguage": "en",
    "description": UI.en.homeLead,
    "isPartOf": {
      "@type": "WebSite",
      "name": "新幹線の窓",
      "url": siteRoot,
    },
  };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(UI.en.homeTitle)}</title>
  <meta name="description" content="${escapeHTML(UI.en.homeLead)}">
  <link rel="canonical" href="${siteRoot}/en/">
  <link rel="alternate" hreflang="ja" href="${siteRoot}/">
  <link rel="alternate" hreflang="en" href="${siteRoot}/en/">
  <link rel="alternate" hreflang="x-default" href="${siteRoot}/">
  <link rel="stylesheet" href="../style.css?v=20260727-kiyosu-challenge">
  <meta property="og:title" content="${escapeHTML(UI.en.homeTitle)}">
  <meta property="og:description" content="${escapeHTML(UI.en.homeLead)}">
  <meta property="og:image" content="${defaultOgImageUrl()}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${siteRoot}/en/">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(UI.en.homeTitle)}">
  <meta name="twitter:description" content="${escapeHTML(UI.en.homeLead)}">
  <meta name="twitter:image" content="${defaultOgImageUrl()}">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  ${analyticsSnippet()}
</head>
<body class="spot-page">
  ${siteHeaderHTML("en", "../", "../", "./")}
  <main>
    <article class="spot-page-article">
      <p class="eyebrow">TOKAIDO SHINKANSEN WINDOW GUIDE</p>
      <h1>Do not miss the view from your Shinkansen window.</h1>
      <p class="spot-page-lead">${escapeHTML(UI.en.homeLead)}</p>
      <div class="spot-page-actions spot-page-actions-top">
        <a class="btn btn-primary" href="./#journey">Find your train</a>
        <a class="btn btn-ghost" href="zukan.html">Browse the field guide</a>
      </div>
      <section class="spot-page-section guide-answer-panel" aria-label="Quick Shinkansen window guide">
        <div class="guide-answer-copy">
          <h2>Start with Seat E for Mt. Fuji.</h2>
          <p>On the Tokaido Shinkansen, the classic Mt. Fuji view is on the E-seat side. Shinkansen Window also helps you notice short views of lakes, castles, signs, train depots, and Kyoto landmarks.</p>
        </div>
        <dl class="guide-fact-grid">
          <div><dt>Best-known view</dt><dd>Mt. Fuji</dd><p>Watch around Mishima to Shin-Fuji.</p></div>
          <div><dt>Also along the route</dt><dd>37 views</dd><p>From Tokyo to Shin-Osaka.</p></div>
          <div><dt>Best use</dt><dd>Before boarding</dd><p>Pick a train and keep the timeline ready.</p></div>
        </dl>
      </section>
      <section class="spot-page-section guide-featured-panel">
        <div class="guide-section-head">
          <h2>Views worth looking up for</h2>
          <p>These views last only seconds or minutes. That is why the timing matters.</p>
        </div>
        <div class="guide-visual-grid">${featured}</div>
      </section>
      <section class="spot-page-section guide-beyond-panel">
        <h2>Plan the window side before you ride</h2>
        <p>Use the train search to build a timed window guide, or open the Live Guide while riding.</p>
        <div class="spot-page-actions">
          <a class="btn btn-primary" href="./#journey">Build my timed guide</a>
          <a class="btn btn-ghost" href="live/">Open Live Guide</a>
          <a class="btn btn-ghost" href="guide.html">Read the Mt. Fuji FAQ</a>
        </div>
      </section>
    </article>
  </main>
</body>
</html>
`;
}

function englishAppIndexHTML() {
  const railCopy = [
    ["車窓メダル帖", "Window Medal Book"],
    ["新幹線の窓とは？", "About Shinkansen Window"],
    ["車窓をもっと楽しむ", "More ways to enjoy the window"],
    ["富士山FAQ", "Mt. Fuji FAQ"],
    ["見える時刻、座席側、曇りの日の答えを確認。", "Check the timing, seat side, and what to expect on cloudy days."],
    ["見える予報β", "Mt. Fuji Visibility Beta"],
    ["今日の空で富士山が見えそうかを確認。", "Check how likely Mt. Fuji is to appear in today's sky."],
    ["墨絵車窓", "Ink-Wash Window"],
    ["東海道新幹線の車窓を、静かな墨絵で。", "See the Tokaido Shinkansen window as a quiet ink-wash journey."],
    ["車窓走馬灯", "Window Revue"],
    ["実際の車窓写真で、旅を短くめぐる。", "Take a short journey through real window photographs."],
    ["メダル帖", "Window Medal Book"],
    ["見つけた景色をスタンプとメダルで記録。", "Record each view with Window Stamps and medals."],
    ["新幹線の窓とは", "About Shinkansen Window"],
    ["使い方と楽しみ方を30秒で紹介。", "See how the guide works in 30 seconds."],
    ["車窓リンク集", "Window View Links"],
    ["出典や参考記事をまとめて読む。", "Browse sources and useful articles about the route."],
    ["お問い合わせ", "Contact"],
    ["写真提供、情報の訂正、ご感想はこちら。", "Send a photo, suggest a correction, or share feedback."],
    ["富士山の見方", "How to See Mt. Fuji"],
    ["プライバシーポリシー", "Privacy Policy"],
    ["時刻はのぞみ基準の目安で、列車・天候・座席位置により見え方は変わります。少し早めに窓の外を見てください。", "Times are Nozomi-based estimates; visibility varies by train, weather, and seat. Start watching a little early."],
  ];
  const railRoutes = ["guide", "mieru", "sumie", "somato", "journal", "lp", "references", "contact", "privacy"];
  let html = fs.readFileSync(path.join(appDir, "index.html"), "utf8")
    .replace('<html lang="ja">', '<html lang="en">')
    .replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n  <base href="../">'
    )
    .replace(/<title>[^<]*<\/title>/, '<title>Shinkansen Window | Tokaido Shinkansen View Times and Seat Side</title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Choose your train to see when and which side to watch for Mt. Fuji, Lake Hamana, castles, To-ji Temple, train depots, and 37 Tokaido Shinkansen window views.">')
    .replace('<link rel="canonical" href="https://www.michikusa-travel.com/">', '<link rel="canonical" href="https://www.michikusa-travel.com/en/">')
    .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Shinkansen Window | Never miss the view">')
    .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Find the time and seat side for Mt. Fuji and 37 views from the Tokaido Shinkansen.">')
    .replace('<meta property="og:url" content="https://www.michikusa-travel.com/">', '<meta property="og:url" content="https://www.michikusa-travel.com/en/">')
    .replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="Shinkansen Window | Never miss the view">')
    .replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="Find the time and seat side for Mt. Fuji and 37 Tokaido Shinkansen window views.">')
    .replace(/<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="Shinkansen Window — another journey beyond the glass.">')
    .replaceAll('"inLanguage": "ja"', '"inLanguage": "en"')
    .replace('<body>', '<body>\n  <script>try { localStorage.setItem("mado-lang", "en"); } catch (error) {}</script>');
  railCopy.forEach(([ja, en]) => { html = html.replaceAll(ja, en); });
  railRoutes.forEach((route) => {
    html = html.replaceAll(`href="${route}.html"`, `href="en/${route}.html"`);
  });
  return html;
}

function guideHTML(lang) {
  const ui = UI[lang];
  const prefix = lang === "ja" ? "" : "../";
  const guideUrl = lang === "ja" ? `${siteRoot}/guide.html` : `${siteRoot}/en/guide.html`;
  const appUrl = lang === "ja" ? "index.html#journey" : "./#journey";
  const otherUrl = lang === "ja" ? "en/guide.html" : "../guide.html";
  const questions = ui.guideQuestions.map((item) => {
    const href = lang === "ja"
      ? item.link
      : (item.link.startsWith("index") ? `./#gallery` : `../${item.link}`);
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
          <a class="btn btn-primary" href="./#gallery">Browse timed window views</a>
          <a class="btn btn-ghost" href="./#journey">Find your train</a>
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
  <link rel="stylesheet" href="${prefix}style.css?v=20260727-kiyosu-challenge">
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
    { loc: pageUrl("en"), priority: "0.9", changefreq: "weekly" },
    { loc: `${siteRoot}/zukan.html`, priority: "0.8", changefreq: "weekly" },
    { loc: `${siteRoot}/en/zukan.html`, priority: "0.8", changefreq: "weekly" },
    { loc: `${siteRoot}/journal.html`, priority: "0.7", changefreq: "weekly" },
    { loc: `${siteRoot}/en/journal.html`, priority: "0.7", changefreq: "weekly" },
    { loc: `${siteRoot}/mieru.html`, priority: "0.8", changefreq: "daily" },
    { loc: `${siteRoot}/en/mieru.html`, priority: "0.8", changefreq: "daily" },
    { loc: `${siteRoot}/sumie.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/en/sumie.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/somato.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/en/somato.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/guide.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteRoot}/en/guide.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteRoot}/references.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/en/references.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/contact.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/en/contact.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/privacy.html`, priority: "0.3", changefreq: "yearly" },
    { loc: `${siteRoot}/en/privacy.html`, priority: "0.3", changefreq: "yearly" },
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
fs.writeFileSync(path.join(appDir, "en", "index.html"), englishAppIndexHTML(), "utf8");
await import("./generate-language-mirrors.mjs");
// guide.html and en/guide.html are hand-edited SEO answer pages.
// Do not regenerate them from the older lightweight template here.
fs.writeFileSync(path.join(appDir, "sitemap.xml"), sitemapXML(), "utf8");

await import("./generate-content-manifest.mjs");

console.log(`Generated ${SPOTS.length} Japanese spot pages, ${SPOTS.length} English spot pages, /en/, sitemap.xml, and content-manifest.json`);
