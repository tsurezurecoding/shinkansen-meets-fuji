import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const dataPath = path.join(appDir, "data.js");
const spotsDir = path.join(appDir, "spots");
const siteRoot = "https://tsurezurecoding.github.io/shinkansen-meets-fuji";
const today = "2026-07-01";

const dataCode = fs.readFileSync(dataPath, "utf8");
const context = {};
const { SPOTS } = vm.runInNewContext(`${dataCode}\n;({ SPOTS });`, context, { filename: dataPath });

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

function localized(value, lang = "ja") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.ja || value.en || "";
}

function referenceUrl(ref) {
  return localized(ref?.url, "ja") || localized(ref?.url, "en") || ref?.url || "";
}

function imageUrl(spot) {
  const image = spot.image || spot.photos?.[0]?.src || "";
  return image ? `../${image}` : "../images/og-shinkansen-window.png";
}

function absoluteImageUrl(spot) {
  const image = spot.image || spot.photos?.[0]?.src || "images/og-shinkansen-window.png";
  return `${siteRoot}/${image}`;
}

function minutesLabel(minutes) {
  if (!Number.isFinite(Number(minutes))) return "通過時刻は列車により変わります";
  return `東京発のぞみ基準で約${Math.round(minutes)}分後`;
}

function sideLabel(side) {
  if (side === "A") return "A席・海側";
  if (side === "E") return "E席・山側";
  return "左右両側";
}

function spotSideLabel(spot) {
  if (spot.id === "hamanako") return "A席・海側 / E席・山側";
  return localized(spot.sideLabel, "ja") || sideLabel(spot.side);
}

function description(spot) {
  const ja = spot.ja || {};
  const firstSentence = String(ja.story || "").split("。").filter(Boolean)[0] || ja.hook || "";
  return text(
    `${ja.name}は東海道新幹線の車窓から見えるスポットです。${spotSideLabel(spot)}、${ja.area}付近。${firstSentence}。`
  );
}

function pageHTML(spot) {
  const ja = spot.ja || {};
  const en = spot.en || {};
  const title = `${ja.name}は新幹線から見える？ ${ja.area}の車窓ガイド | 新幹線の窓`;
  const desc = description(spot);
  const url = `${siteRoot}/spots/${spot.id}.html`;
  const appUrl = `../index.html#spot-${spot.id}`;
  const refs = (spot.references || []).map((ref) => {
    const href = referenceUrl(ref);
    if (!href) return "";
    return `<li><a href="${escapeHTML(href)}" rel="noopener" target="_blank">${text(localized(ref.label, "ja"))}</a></li>`;
  }).join("");
  const photoCount = 1 + (spot.photos?.length || 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": title,
        "description": desc,
        "inLanguage": ["ja", "en"],
        "isPartOf": {
          "@type": "WebSite",
          "name": "新幹線の窓",
          "url": `${siteRoot}/`,
        },
      },
      {
        "@type": "TouristAttraction",
        "@id": `${url}#spot`,
        "name": ja.name,
        "alternateName": en.name || ja.name,
        "description": desc,
        "image": absoluteImageUrl(spot),
        "touristType": "Railway window view",
      },
    ],
  };

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${text(title)}</title>
  <meta name="description" content="${text(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="stylesheet" href="../style.css?v=20260701-spots">
  <meta property="og:title" content="${text(title)}">
  <meta property="og:description" content="${text(desc)}">
  <meta property="og:image" content="${absoluteImageUrl(spot)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
</head>
<body class="spot-page">
  <header class="spot-page-top">
    <a href="../index.html" class="spot-page-brand">新幹線の窓</a>
    <a href="../index.html#gallery" class="spot-page-link">車窓図鑑へ</a>
  </header>
  <main>
    <article class="spot-page-article">
      <p class="eyebrow">TOKAIDO SHINKANSEN WINDOW VIEW</p>
      <h1>${escapeHTML(ja.name)}は新幹線から見える？</h1>
      <p class="spot-page-lead">${escapeHTML(ja.hook || "")}</p>
      <figure class="spot-page-figure">
        <img src="${escapeHTML(imageUrl(spot))}" alt="${escapeHTML(`${ja.name}の新幹線車窓写真`)}">
        <figcaption>${escapeHTML(localized(spot.photoCredit?.ja || spot.photoCredit, "ja") || "新幹線の窓")}</figcaption>
      </figure>
      <dl class="spot-page-facts">
        <div><dt>見える区間</dt><dd>${escapeHTML(ja.area || "")}</dd></div>
        <div><dt>座席側</dt><dd>${spotSideLabel(spot)}</dd></div>
        <div><dt>タイミング</dt><dd>${minutesLabel(spot.minutesFromTokyo)}</dd></div>
        <div><dt>写真</dt><dd>${photoCount}枚</dd></div>
      </dl>
      <section class="spot-page-section">
        <h2>${escapeHTML(ja.name)}の見つけ方</h2>
        <p>${escapeHTML(ja.story || "")}</p>
        <p>東京から新大阪方面へ向かう場合は、${escapeHTML(ja.area || "この区間")}が近づいたら${spotSideLabel(spot)}の窓を少し早めに見てください。新大阪から東京方面へ向かう場合は、通過順が逆になります。</p>
      </section>
      <section class="spot-page-section">
        <h2>東海道新幹線の車窓としてのポイント</h2>
        <p>${escapeHTML(ja.name)}は、富士山だけではない東海道新幹線の車窓を楽しむための見どころです。列車の速度が速いため、見える時間は短く、天気や座席位置によって見え方が変わります。</p>
      </section>
      ${refs ? `<section class="spot-page-section"><h2>参考リンク</h2><ul class="spot-page-refs">${refs}</ul></section>` : ""}
      <div class="spot-page-actions">
        <a class="btn btn-primary" href="${appUrl}">アプリでこの見どころを開く</a>
        <a class="btn btn-ghost" href="../index.html#gallery">ほかの車窓を見る</a>
      </div>
      <p class="spot-page-en"><strong>English:</strong> ${escapeHTML(en.name || ja.name)} is a Tokaido Shinkansen window view around ${escapeHTML(en.area || ja.area || "")}. ${escapeHTML(en.story || "")}</p>
    </article>
  </main>
</body>
</html>
`;
}

function sitemapXML(spots) {
  const spotUrls = spots.map((spot) => `  <url>
    <loc>${siteRoot}/spots/${spot.id}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${featuredIds.includes(spot.id) ? "0.8" : "0.6"}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteRoot}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteRoot}/references.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
${spotUrls}
</urlset>
`;
}

fs.mkdirSync(spotsDir, { recursive: true });
for (const spot of SPOTS) {
  fs.writeFileSync(path.join(spotsDir, `${spot.id}.html`), pageHTML(spot), "utf8");
}
fs.writeFileSync(path.join(appDir, "sitemap.xml"), sitemapXML(SPOTS), "utf8");

console.log(`Generated ${SPOTS.length} spot pages and sitemap.xml`);
