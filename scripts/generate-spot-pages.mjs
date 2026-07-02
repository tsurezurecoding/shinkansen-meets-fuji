import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const dataPath = path.join(appDir, "data.js");
const siteRoot = "https://www.michikusa-travel.com";
const today = "2026-07-01";

const dataCode = fs.readFileSync(dataPath, "utf8");
const { SPOTS } = vm.runInNewContext(`${dataCode}\n;({ SPOTS });`, {}, { filename: dataPath });

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
    titleQuestion: (name) => `${name}は新幹線から見える？`,
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
    guideTitle: "新幹線から富士山を見るには？ | 新幹線の窓",
    guideLead: "東海道新幹線から富士山を見るための席側、見えるタイミング、左富士、富士山以外の車窓をまとめました。",
    guideHeading: "新幹線から富士山を見るには？",
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
    titleQuestion: (name) => `Can you see ${name} from the Shinkansen?`,
    searchCta: "Find your train",
    appCta: "Open this view in the app",
    sectionHow: (name) => `How to find ${name}`,
    sectionPoint: "Why this view matters",
    sectionPhotos: (name) => `${name} in photos`,
    sectionRefs: "References",
    sectionRelated: "Nearby window views",
    facts: ["Section", "Seat side", "Timing", "Photos"],
    photoUnit: "photos",
    routeNote: (area, side) => `If you are traveling from Tokyo toward Shin-Osaka, start watching the ${side} window as you approach ${area || "this section"}. If you are traveling toward Tokyo, the order is reversed.`,
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
    guideTitle: "How to see Mt. Fuji from the Shinkansen | Shinkansen Window",
    guideLead: "Seat side, timing, Left-Side Fuji, and other Tokaido Shinkansen window views.",
    guideHeading: "How to see Mt. Fuji from the Shinkansen",
    guideBack: "Find your train in the app",
    guideQuestions: [
      {
        q: "Which side of the Shinkansen is Mt. Fuji on?",
        a: "On the Tokaido Shinkansen, Mt. Fuji is mainly on the Seat E, mountain-side window in both directions. There is also a brief Left-Side Fuji moment near Shin-Fuji to Shizuoka, when Fuji can appear on Seat A.",
        link: "spots/left-fuji.html",
        linkText: "See Left-Side Fuji",
      },
      {
        q: "When can you see Mt. Fuji from the Shinkansen?",
        a: "The biggest view is around Mishima to Shin-Fuji. On clear days, you may also glimpse Fuji closer to Tokyo, around Shinagawa to Shin-Yokohama, or farther west near Lake Hamana.",
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

function languageSwitchHref(lang, spotId) {
  return lang === "ja" ? `../en/spots/${spotId}.html` : `../../spots/${spotId}.html`;
}

function siteHeaderHTML(lang, prefix, jaHref, enHref) {
  const ui = UI[lang];
  const homeHref = `${prefix}index.html${lang === "en" ? "?lang=en" : ""}#top`;
  const jaActive = lang === "ja" ? " active" : "";
  const enActive = lang === "en" ? " active" : "";
  return `<header class="topbar">
    <a class="brand" href="${homeHref}">
      <span class="brand-mark">窓</span>
      <span class="brand-text">
        <span class="brand-name">${escapeHTML(ui.brand)}</span>
        <small>${lang === "ja" ? "旅の瞬間を見逃さない" : "Do not miss the moment"}</small>
      </span>
    </a>
    <nav class="top-nav" aria-label="Primary">
      <a href="${prefix}index.html${lang === "en" ? "?lang=en" : ""}#quick-intro">${lang === "ja" ? "新幹線の窓とは？" : "About"}</a>
      <a href="${prefix}index.html${lang === "en" ? "?lang=en" : ""}#journey">${escapeHTML(ui.navSearch)}</a>
      <a href="${prefix}index.html${lang === "en" ? "?lang=en" : ""}#gallery">${escapeHTML(ui.navGallery)}</a>
      <a href="${prefix}index.html${lang === "en" ? "?lang=en" : ""}#memories">${lang === "ja" ? "メダルを見る" : "Medals"}</a>
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

function absoluteImageUrl(spot) {
  const image = spot.image || spot.photos?.[0]?.src || "images/og-shinkansen-window.png";
  return `${siteRoot}/${image}`;
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
  const firstSentence = rawText(data.story).split(lang === "ja" ? "。" : ".").filter(Boolean)[0] || data.hook || "";
  const suffix = lang === "ja" ? "。" : ".";
  if (lang === "ja") {
    return text(`${data.name}は東海道新幹線の車窓から見えるスポットです。${sideLabel(spot, lang)}、${data.area}付近。${firstSentence}${suffix}`);
  }
  return text(`${data.name} is a Tokaido Shinkansen window view around ${data.area}. Watch from ${sideLabel(spot, lang)}. ${firstSentence}${suffix}`);
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
        <img loading="${index === 0 ? "eager" : "lazy"}" src="${prefix}${escapeHTML(item.src)}" alt="${escapeHTML(localized(item.alt, lang) || ui.photoAlt(data.name))}">
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
  const routeSpots = [...SPOTS].sort((a, b) => Number(a.minutesFromTokyo || 0) - Number(b.minutesFromTokyo || 0));
  const index = routeSpots.findIndex((item) => item.id === spot.id);
  const candidates = [
    index > 0 ? { label: ui.relatedPrev, spot: routeSpots[index - 1] } : null,
    index >= 0 && index < routeSpots.length - 1 ? { label: ui.relatedNext, spot: routeSpots[index + 1] } : null,
    ...routeSpots
      .filter((item) => item.id !== spot.id && item.category === spot.category)
      .slice(0, 3)
      .map((item) => ({ label: ui.relatedCategory, spot: item })),
  ].filter(Boolean);
  const unique = [];
  for (const item of candidates) {
    if (!unique.some((entry) => entry.spot.id === item.spot.id)) unique.push(item);
  }
  if (!unique.length) return "";
  const links = unique.slice(0, 5).map(({ label, spot: item }) => {
    const data = item[lang] || item.ja;
    return `<a href="${item.id}.html">
        <small>${escapeHTML(label)}</small>
        <strong>${escapeHTML(data.name)}</strong>
        <span>${escapeHTML(data.area)}</span>
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

function spotPageHTML(spot, lang) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const otherLang = lang === "ja" ? "en" : "ja";
  const title = lang === "ja"
    ? `${data.name}は新幹線から見える？ ${data.area}${ui.titleSuffix}`
    : `${data.name} ${ui.titleSuffix}`;
  const desc = description(spot, lang);
  const url = pageUrl(lang, spot.id);
  const prefix = lang === "ja" ? "../" : "../../";
  const appUrl = appHref(lang, spot.id, prefix);
  const photos = photoItems(spot, lang);
  const photoCount = photos.length;
  const heroSrc = photos[0]?.src || spot.image || "images/og-shinkansen-window.png";
  const heroCredit = creditText(photos[0]?.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
  const refs = referencesHTML(spot, lang);
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
  <link rel="stylesheet" href="${prefix}style.css?v=20260701-spot-pages">
  <meta property="og:title" content="${text(title)}">
  <meta property="og:description" content="${text(desc)}">
  <meta property="og:image" content="${absoluteImageUrl(spot)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
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
        <img src="${prefix}${escapeHTML(heroSrc)}" alt="${escapeHTML(ui.photoAlt(data.name))}">
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
        <p>${escapeHTML(data.story || "")}</p>
        <p>${escapeHTML(ui.routeNote(data.area, sideLabel(spot, lang)))}</p>
      </section>
      <section class="spot-page-section">
        <h2>${escapeHTML(ui.sectionPoint)}</h2>
        <p>${escapeHTML(ui.pointText(data.name))}</p>
      </section>
      ${photoGalleryHTML(spot, lang, prefix)}
      ${refs ? `<section class="spot-page-section"><h2>${escapeHTML(ui.sectionRefs)}</h2><ul class="spot-page-refs">${refs}</ul></section>` : ""}
      ${routeRelatedHTML(spot, lang)}
      <div class="spot-page-actions">
        <a class="btn btn-primary" href="${appUrl}">${escapeHTML(ui.appCta)}</a>
        <a class="btn btn-ghost" href="${appHref(lang, "", prefix)}">${escapeHTML(ui.searchCta)}</a>
      </div>
    </article>
  </main>
</body>
</html>
`;
}

function englishIndexHTML() {
  const ui = UI.en;
  const cards = SPOTS.filter((spot) => featuredIds.includes(spot.id)).map((spot) => {
    const data = spot.en || spot.ja;
    return `<a href="spots/${spot.id}.html">
        <strong>${escapeHTML(data.name)}</strong>
        <span>${escapeHTML(data.area)}</span>
      </a>`;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(ui.homeTitle)}</title>
  <meta name="description" content="${escapeHTML(ui.homeLead)}">
  <link rel="canonical" href="${pageUrl("en")}">
  <link rel="alternate" hreflang="ja" href="${pageUrl("ja")}">
  <link rel="alternate" hreflang="en" href="${pageUrl("en")}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl("ja")}">
  <link rel="stylesheet" href="../style.css?v=20260701-spot-pages">
  ${analyticsSnippet()}
</head>
<body class="spot-page">
  ${siteHeaderHTML("en", "../", "../", "index.html")}
  <main>
    <article class="spot-page-article">
      <p class="eyebrow">TOKAIDO SHINKANSEN WINDOW GUIDE</p>
      <h1>${escapeHTML(ui.homeTitle)}</h1>
      <p class="spot-page-lead">${escapeHTML(ui.homeLead)}</p>
      <div class="spot-page-actions spot-page-actions-top">
        <a class="btn btn-primary" href="../index.html?lang=en#journey">${escapeHTML(ui.homeCta)}</a>
        <a class="btn btn-ghost" href="../index.html?lang=en#gallery">${escapeHTML(ui.navGallery)}</a>
      </div>
      <section class="spot-page-section">
        <h2>Major window views</h2>
        <div class="spot-page-related">${cards}</div>
      </section>
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
    const href = lang === "ja" ? item.link : (item.link.startsWith("index") ? `../index.html?lang=en#gallery` : item.link);
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
  <link rel="stylesheet" href="${prefix}style.css?v=20260701-spot-pages">
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
        <a class="btn btn-ghost" href="${lang === "ja" ? "spots/fuji.html" : "spots/fuji.html"}">${escapeHTML(ui.guideQuestions[1].linkText)}</a>
      </div>
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
    { loc: pageUrl("en"), priority: "0.8", changefreq: "weekly" },
    { loc: `${siteRoot}/guide.html`, priority: "0.8", changefreq: "monthly" },
    { loc: `${siteRoot}/en/guide.html`, priority: "0.7", changefreq: "monthly" },
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
fs.writeFileSync(path.join(appDir, "guide.html"), guideHTML("ja"), "utf8");
fs.writeFileSync(path.join(appDir, "en", "guide.html"), guideHTML("en"), "utf8");
fs.writeFileSync(path.join(appDir, "sitemap.xml"), sitemapXML(), "utf8");

console.log(`Generated ${SPOTS.length} Japanese spot pages, ${SPOTS.length} English spot pages, /en/, and sitemap.xml`);
