import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";

const appRoot = new URL("../", import.meta.url);
const readAppFile = (relativePath) => readFile(new URL(relativePath, appRoot), "utf8");
const readAppBuffer = (relativePath) => readFile(new URL(relativePath, appRoot));
const failures = [];
const PHOTO_PATH = "images/20260802_sparkling-dreams-hamanako_toshi549.jpg";
const PHOTO_POST_URL = "https://x.com/toshi549/status/2084578030442414307";
const VIDEO_POST_URL = "https://x.com/toshi549/status/2084213902188101722";
const PHOTO_BYTES = 54358;
const PHOTO_SHA256 = "4bf920d23a7513fc8560b052d3040de3bb01ef7a82fe61a8d44d9168ad3c2db9";
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const page = await readAppFile("sparkling-dreams.html");
const japaneseTop = await readAppFile("index.html");
const englishTop = await readAppFile("en/index.html");
const calculatorCode = await readAppFile("sparkling-dreams.js");
const sitemap = await readAppFile("sitemap.xml");
const manifest = JSON.parse(await readAppFile("content-manifest.json"));
const illustration = await readAppFile("images/sparkling-dreams-window.svg");
let heroPhoto = null;
try {
  heroPhoto = await readAppBuffer(PHOTO_PATH);
} catch {
  failures.push(`${PHOTO_PATH}: local hero photograph is missing`);
}
let ogImage = null;
try {
  ogImage = await readAppBuffer("images/og-sparkling-dreams.png");
} catch {
  failures.push("images/og-sparkling-dreams.png: page-specific OGP image is missing");
}

const requiredPageText = [
  "2026-06-19",
  "2027年3月ごろ",
  "1編成",
  "東京 ⇄ 新大阪",
  "東京ディズニーシー25周年",
  "東京ディズニーシー25周年を記念した特別塗装列車",
  "自分の列車と、いつ・どこですれ違いそうか",
  "通常の公開ダイヤ",
  "8つのテーマポート",
  "25周年の装いをしたディズニーキャラクター",
  "公式ガイドの代わりではありません",
  "車窓向けに整理",
  "JR東海 公式サイト",
  "運転計画は変更されることがあります",
  "最新情報は必ず公式案内をご確認ください",
  "±5分を目安",
  "PATTERN A",
  "PATTERN B",
  "PATTERN C",
  "Toshi（@toshi549）",
  "元の写真投稿",
  "13秒動画",
  "X投稿を見る（外部サイト）",
  "https://recommend.jr-central.co.jp/sdshinkansen/index.html",
  "https://www.tokyodisneyresort.jp/dream/event/2026_s25_jrc.html",
];
for (const text of requiredPageText) expect(page.includes(text), `sparkling-dreams.html: missing "${text}"`);
expect(japaneseTop.includes('class="seasonal-entry"') && japaneseTop.includes('href="sparkling-dreams.html"'), "index.html: Japanese seasonal entry point is missing");
expect(/<span class="seasonal-entry-visual" aria-hidden="true">\s*<img src="images\/sparkling-dreams-window\.svg" alt="">/s.test(japaneseTop), "index.html: seasonal entry illustration is missing or not decorative");
expect(japaneseTop.includes("東京ディズニーシー25周年") && japaneseTop.includes("ディズニー新幹線と、"), "index.html: seasonal entry must identify the Disney special-livery train");
expect(!/data-i18n="seasonal(?:Kicker|Title|Body)"/.test(japaneseTop), "index.html: seasonal entry still has stale app.js translation hooks");
expect(!englishTop.includes('class="seasonal-entry"'), "en/index.html: Japanese seasonal entry point must not be copied");
expect(!englishTop.includes('href="sparkling-dreams.html"'), "en/index.html: Japanese seasonal route must not be copied");
expect(/<link rel="canonical" href="https:\/\/www\.michikusa-travel\.com\/sparkling-dreams\.html">/.test(page), "sparkling-dreams.html: canonical is missing or incorrect");
expect(/<meta name="robots" content="index,follow/.test(page), "sparkling-dreams.html: index/follow robots metadata is missing");
expect(/<link rel="alternate" hreflang="x-default" href="https:\/\/www\.michikusa-travel\.com\/sparkling-dreams\.html">/.test(page), "sparkling-dreams.html: x-default language route is missing");
expect(/<link rel="stylesheet" href="style\.css/.test(page), "sparkling-dreams.html: shared site stylesheet is missing");
expect(!/<link[^>]+rel="stylesheet"[^>]+href="https?:\/\//i.test(page), "sparkling-dreams.html: external stylesheet found");
const heroFigure = page.match(/<figure class="sd-hero-media">[\s\S]*?<\/figure>/)?.[0] || "";
const heroImageTag = heroFigure.match(/<img\b[^>]*>/)?.[0] || "";
const videoCard = heroFigure.match(/<a class="sd-hero-video-card"[\s\S]*?<\/a>/)?.[0] || "";
expect(/src="images\/20260802_sparkling-dreams-hamanako_toshi549\.jpg"/.test(heroImageTag), "sparkling-dreams.html: local photograph is not the hero image");
expect(/width="650"/.test(heroImageTag) && /height="434"/.test(heroImageTag), "sparkling-dreams.html: hero photograph dimensions are missing or incorrect");
expect(/alt="[^"]*浜名湖[^\"]+"/.test(heroImageTag), "sparkling-dreams.html: hero photograph alt text is missing or not meaningful");
expect(!/\bloading\s*=/.test(heroImageTag), "sparkling-dreams.html: above-the-fold hero photograph must not be lazy-loaded");
expect(!/sparkling-dreams-window\.svg/.test(heroFigure), "sparkling-dreams.html: abstract owned SVG is still used in the hero");
expect(new RegExp(`<figcaption>[\\s\\S]*href="${escapeRegExp(PHOTO_POST_URL)}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>[\\s\\S]*Toshi（@toshi549）[\\s\\S]*元の写真投稿[\\s\\S]*<\\/a>[\\s\\S]*<\\/figcaption>`).test(heroFigure), "sparkling-dreams.html: source-linked Toshi photo credit is missing");
expect(new RegExp(`href="${escapeRegExp(VIDEO_POST_URL)}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"`).test(videoCard), "sparkling-dreams.html: 13-second video card must link to the approved external X post");
expect(/13秒動画/.test(videoCard) && /X投稿を見る（外部サイト）/.test(videoCard), "sparkling-dreams.html: video card must identify 13 seconds, X, and the external site");
expect(!/(?:twitter-tweet|platform\.twitter\.com|twitframe\.com|<iframe\b|<video\b|\bposter=)/i.test(page), "sparkling-dreams.html: X embed, video embed, poster, or third-party media markup found");
expect(!/<img\b[^>]+(?:https?:)?\/\//i.test(page), "sparkling-dreams.html: hotlinked image found");
expect(!/(?:src|srcset)=["'][^"']*(?:disney|jr-central|tokyodisney)/i.test(page), "sparkling-dreams.html: external promotional image reference found");
expect(/og-sparkling-dreams\.png/.test(page), "sparkling-dreams.html: page-specific owned OGP image is missing");
expect(!/og-shinkansen-window\.png/.test(page), "sparkling-dreams.html: generic OGP image must not be used");
expect(/<meta property="og:image:alt" content="東京ディズニーシー25周年/.test(page), "sparkling-dreams.html: OGP image alt text is missing");
const preservedMetadata = [
  `<title>Sparkling Dreams Shinkansenを車窓から｜運転日とすれ違い時刻 | 新幹線の窓</title>`,
  `<meta name="description" content="2026年6月19日から2027年3月ごろまで走るSparkling Dreams Shinkansenの運転パターンと、選んだ列車とのすれ違い時刻を車窓の目安として調べます。">`,
  `<meta property="og:title" content="Sparkling Dreams Shinkansenを車窓から｜運転日とすれ違い時刻">`,
  `<meta property="og:description" content="特別塗装列車の運転日と、あなたの列車がすれ違う時刻の目安を確認できます。">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:title" content="Sparkling Dreams Shinkansenを車窓から｜運転日とすれ違い時刻">`,
  `<meta name="twitter:description" content="特別塗装列車の運転日と、あなたの列車がすれ違う時刻の目安を確認できます。">`,
  `<meta name="twitter:image" content="https://www.michikusa-travel.com/images/og-sparkling-dreams.png">`,
];
for (const metadata of preservedMetadata) expect(page.includes(metadata), `sparkling-dreams.html: preserved metadata changed or is missing (${metadata.slice(0, 32)}...)`);
expect(illustration.trim().startsWith("<svg") && /viewBox="0 0 1200 630"/.test(illustration), "images/sparkling-dreams-window.svg: original illustration contract is missing");
expect(!/<image\b|(?:href|xlink:href)=["']https?:\/\//i.test(illustration), "images/sparkling-dreams-window.svg: external image reference found");
expect(createHash("sha256").update(illustration).digest("hex") === "dfac0a4ba1a75bf94e09b8f7048b59da1b43fec55088a0a42ba1c2edee9f2ad5", "images/sparkling-dreams-window.svg: existing owned SVG was changed");
if (ogImage) {
  expect(ogImage.length > 32 && ogImage.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "images/og-sparkling-dreams.png: PNG signature is invalid");
  expect(ogImage.readUInt32BE(16) === 1200 && ogImage.readUInt32BE(20) === 630, "images/og-sparkling-dreams.png: expected 1200x630 dimensions");
  expect(createHash("sha256").update(ogImage).digest("hex") === "26a4b53b680a7ec3cea2df8ec2d1b2464dcd40403d0ca1e696a3fd1b85989130", "images/og-sparkling-dreams.png: existing owned OGP was changed");
}
if (heroPhoto) {
  expect(heroPhoto.length === PHOTO_BYTES, `${PHOTO_PATH}: expected ${PHOTO_BYTES} bytes`);
  expect(heroPhoto.subarray(0, 2).equals(Buffer.from([0xff, 0xd8])), `${PHOTO_PATH}: JPEG signature is invalid`);
  expect(createHash("sha256").update(heroPhoto).digest("hex") === PHOTO_SHA256, `${PHOTO_PATH}: SHA-256 does not match the approved source photograph`);
}

const expectedPatterns = {
  A: [
    { type: "Hikari", number: 636, direction: "east" },
    { type: "Kodama", number: 815, direction: "west" },
    { type: "Kodama", number: 836, direction: "east" },
    { type: "Hikari", number: 659, direction: "west" },
  ],
  B: [
    { type: "Hikari", number: 636, direction: "east" },
    { type: "Kodama", number: 815, direction: "west" },
  ],
  C: [
    { type: "Hikari", number: 636, direction: "east" },
    { type: "Hikari", number: 659, direction: "west" },
  ],
};

const expectedDatePatterns = {};
const addExpectedMonth = (month, values) => values.forEach((pattern, index) => {
  expectedDatePatterns[`2026-${month}-${String(index + 1).padStart(2, "0")}`] = pattern;
});
addExpectedMonth("08", [
  "B", "A", "C", "B", "B", "B", "A", "A", "A", "A", "A", "pending", "A", "A", "A", "A", "A", "A", "pending", "B", "A", "A", "A", "C", "pending", "pending", "pending", "A", "A", "A", "B",
]);
addExpectedMonth("09", [
  "B", "pending", "B", "A", "A", "A", "B", "C", "pending", "B", "A", "A", "A", "B", "B", "pending", "A", "A", "A", "A", "A", "A", "pending", "B", "A", "A", "A", "C", "pending", "pending",
]);

expect(/PATTERN_SERVICES/.test(calculatorCode), "sparkling-dreams.js: pattern service definitions are missing");
expect(/DATE_PATTERNS/.test(calculatorCode), "sparkling-dreams.js: date pattern definitions are missing");
expect(/SHINKANSEN_TIMETABLE/.test(calculatorCode), "sparkling-dreams.js: timetable dataset is not loaded");
expect(/timetable\.stations/.test(calculatorCode), "sparkling-dreams.js: timetable station names are not loaded");
expect(/refStations/.test(calculatorCode) && /intersections/.test(calculatorCode), "sparkling-dreams.js: route reference-station interpolation is missing");
expect(calculatorCode.includes("E席側") && calculatorCode.includes("A席側") && calculatorCode.includes("±5分"), "sparkling-dreams.js: seat-side guidance or tolerance caveat is missing");

const context = { window: {}, console };
context.window.window = context.window;
vm.runInNewContext(await readAppFile("data/timetable.js"), context, { filename: "data/timetable.js" });
vm.runInNewContext(`${await readAppFile("data.js")}\nglobalThis.__ROUTE = ROUTE;`, context, { filename: "data.js" });
vm.runInNewContext(calculatorCode, context, { filename: "sparkling-dreams.js" });
const api = context.window.SPARKLING_DREAMS_CALCULATOR;
expect(api && typeof api.calculate === "function", "sparkling-dreams.js: calculator API was not initialized");

if (api) {
  expect(JSON.stringify(api.PATTERN_SERVICES) === JSON.stringify(expectedPatterns), "sparkling-dreams.js: A/B/C service patterns do not match the approved schedule");
  expect(JSON.stringify(api.DATE_PATTERNS) === JSON.stringify(expectedDatePatterns), "sparkling-dreams.js: August/September 2026 date map does not match the approved schedule");
  expect(api.START_DATE === "2026-06-19" && api.END_DATE === "2027-03-15", "sparkling-dreams.js: operation range is incorrect");

  const expectedServiceTimes = [
    { type: "Hikari", number: 636, direction: "east", originStation: "Shin-Osaka", destination: "Tokyo", originTime: "06:42", destinationTime: "09:42" },
    { type: "Kodama", number: 815, direction: "west", originStation: "Tokyo", destination: "Shin-Osaka", originTime: "09:57", destinationTime: "13:51" },
    { type: "Kodama", number: 836, direction: "east", originStation: "Shin-Osaka", destination: "Tokyo", originTime: "14:54", destinationTime: "18:48" },
    { type: "Hikari", number: 659, direction: "west", originStation: "Tokyo", destination: "Shin-Osaka", originTime: "19:03", destinationTime: "22:03" },
  ];
  for (const service of expectedServiceTimes) {
    const train = api.findTrain(service);
    expect(train, `data/timetable.js: missing ${service.type} ${service.number} ${service.direction} service`);
    if (train) {
      expect(train.times?.[service.originStation] === service.originTime && train.times?.[service.destination] === service.destinationTime, `data/timetable.js: ${service.type} ${service.number} endpoint times do not match the approved schedule`);
    }
  }

  const westTrain = api.getWindowTrains("west").find((train) => train.type === "Nozomi" && train.number === 1);
  const eastTrain = api.getWindowTrains("east").find((train) => train.type === "Nozomi" && train.number === 2);
  const specialEast = api.findTrain({ type: "Hikari", number: 636, direction: "east" });
  expect(typeof api.trainStaticLine === "function", "calculator fixture: train static-line formatter is missing");
  expect(westTrain, "calculator fixture: Nozomi 1 westbound option is missing");
  expect(eastTrain, "calculator fixture: Nozomi 2 eastbound option is missing");
  expect(specialEast, "calculator fixture: Hikari 636 eastbound service is missing");
  if (westTrain && typeof api.trainStaticLine === "function") {
    expect(api.trainStaticLine(westTrain).includes("東京 06:00 → 博多 10:52"), "calculator fixture: Nozomi 1 must display Tokyo-to-Hakata endpoints in Japanese");
  }

  if (westTrain && eastTrain && specialEast) {
    const westKey = api.serviceKey(westTrain);
    const eastKey = api.serviceKey(eastTrain);
    const specialKey = api.serviceKey(specialEast);
    const selfMatch = api.calculate("2026-08-08", "east", specialKey);
    const westEncounter = api.calculate("2026-08-08", "west", westKey);
    const eastEncounter = api.calculate("2026-08-08", "east", eastKey);
    const pending = api.calculate("2026-08-12", "west", westKey);
    const outsideRange = api.calculate("2026-03-01", "west", westKey);
    expect(selfMatch.status === "self-match", "calculator fixture: special-train self-match did not resolve");
    expect(westEncounter.status === "encounter" && westEncounter.matches?.length > 0, "calculator fixture: westbound encounter did not resolve");
    expect(eastEncounter.status === "encounter" && eastEncounter.matches?.length > 0, "calculator fixture: eastbound encounter did not resolve");
    expect(pending.status === "pending", "calculator fixture: pending date did not resolve as pending");
    expect(outsideRange.status === "outside-range", "calculator fixture: outside-range date did not resolve as outside-range");
    for (const match of [...(westEncounter.matches || []), ...(eastEncounter.matches || [])]) {
      expect(/^\d{2}:\d{2}$/.test(match.clock), "calculator fixture: encounter clock is not formatted as HH:MM");
      expect(match.segment?.from && match.segment?.to, "calculator fixture: route segment is missing");
    }
  }
}

const seasonalUrl = "https://www.michikusa-travel.com/sparkling-dreams.html";
const sitemapEntry = sitemap.match(new RegExp(`<url>[\\s\\S]*?<loc>${seasonalUrl.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}</loc>[\\s\\S]*?</url>`));
expect(sitemapEntry, "sitemap.xml: seasonal page is missing");
if (sitemapEntry) {
  expect(/<changefreq>weekly<\/changefreq>/.test(sitemapEntry[0]), "sitemap.xml: seasonal page must be weekly");
  expect(/<lastmod>2026-08-08<\/lastmod>/.test(sitemapEntry[0]), "sitemap.xml: seasonal page lastmod is incorrect");
}

const manifestPaths = new Set((manifest.files || []).map((entry) => entry.path));
expect(manifestPaths.has("sparkling-dreams.html"), "content-manifest.json: sparkling-dreams.html is missing");
expect(manifestPaths.has("sparkling-dreams.js"), "content-manifest.json: sparkling-dreams.js is missing");
expect(manifestPaths.has(PHOTO_PATH), `content-manifest.json: ${PHOTO_PATH} is missing`);
expect(manifestPaths.has("images/sparkling-dreams-window.svg"), "content-manifest.json: sparkling-dreams-window.svg is missing");
expect(manifestPaths.has("images/og-sparkling-dreams.png"), "content-manifest.json: og-sparkling-dreams.png is missing");
const heroPhotoManifestEntry = (manifest.files || []).find((entry) => entry.path === PHOTO_PATH);
if (heroPhotoManifestEntry && heroPhoto) {
  expect(heroPhotoManifestEntry.bytes === PHOTO_BYTES, `content-manifest.json: ${PHOTO_PATH} byte count is incorrect`);
  expect(heroPhotoManifestEntry.sha256 === PHOTO_SHA256, `content-manifest.json: ${PHOTO_PATH} SHA-256 is incorrect`);
}

if (failures.length) {
  throw new Error(`Sparkling Dreams validation failed:\n- ${failures.join("\n- ")}`);
}

console.log("Validated Sparkling Dreams page, schedule maps, manifest/sitemap, and calculator fixtures.");
