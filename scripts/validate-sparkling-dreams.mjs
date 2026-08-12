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
const SECOND_VIDEO_POST_URL = "https://x.com/ron__tigger/status/2086689775923482652";
const THIRD_VIDEO_POST_URL = "https://x.com/Bowing797_10/status/2071134420992430274";
const FOURTH_VIDEO_POST_URL = "https://x.com/n_s_z__7/status/2085865232333950991";
const FIFTH_VIDEO_POST_URL = "https://x.com/47923y_PROJECT/status/2067173150417371446";
const SIXTH_VIDEO_POST_URL = "https://x.com/hashiyan84aichi/status/2081240004756381998";
const SEVENTH_VIDEO_POST_URL = "https://x.com/Tomo52dra500pon/status/2075769688886591560";
const EIGHTH_VIDEO_POST_URL = "https://x.com/7AD5IxRI1ArWckK/status/2071380845399802197";
const NINTH_VIDEO_POST_URL = "https://x.com/ninnin_2017/status/2068943872311648598";
const TENTH_VIDEO_POST_URL = "https://x.com/Takahashidaga/status/2086028890116702230";
const YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=cfK8UcZ-lmg";
const SECOND_YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=unBFVa-QnR4";
const PHOTO_BYTES = 54358;
const PHOTO_SHA256 = "4bf920d23a7513fc8560b052d3040de3bb01ef7a82fe61a8d44d9168ad3c2db9";
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const page = await readAppFile("sparkling-dreams.html");
const englishPage = await readAppFile("en/sparkling-dreams.html");
const stylesheet = await readAppFile("style.css");
const japaneseTop = await readAppFile("index.html");
const englishTop = await readAppFile("en/index.html");
const calculatorCode = await readAppFile("sparkling-dreams.js");
const generatorCode = await readAppFile("scripts/generate-spot-pages.mjs");
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
  "東京ディズニーシー25周年",
  "東京ディズニーシー25周年を記念した特別塗装列車",
  "公開ダイヤからすれ違いを探し",
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
  "元投稿を見る",
  "みんなが見つけたディズニー新幹線",
  "沿線から",
  "車内から",
  "駅から",
  "ろん.てぃが (@ron__tigger)",
  "BOWING797_10 (@Bowing797_10)",
  "neco (@n_s_z__7)",
  "sayu@Cinnamorollproject∞ (@47923y_PROJECT)",
  "はしやん＠愛知 (@hashiyan84aichi)",
  "@Tomo52dra500pon",
  "@7AD5IxRI1ArWckK",
  "@ninnin_2017",
  "@Takahashidaga",
  "鉄道チャンネルYoutube - Tetsudo(Railway) Channel, Japan-",
  "旅波-tabinami-",
  "https://recommend.jr-central.co.jp/sdshinkansen/index.html",
  "https://www.tokyodisneyresort.jp/dream/event/2026_s25_jrc.html",
];
for (const text of requiredPageText) expect(page.includes(text), `sparkling-dreams.html: missing "${text}"`);
expect(japaneseTop.includes('class="seasonal-entry"') && japaneseTop.includes('href="sparkling-dreams.html"'), "index.html: Japanese seasonal entry point is missing");
expect(/<span class="seasonal-entry-visual" aria-hidden="true">\s*<img src="images\/sparkling-dreams-window\.svg" alt="">/s.test(japaneseTop), "index.html: seasonal entry illustration is missing or not decorative");
expect(japaneseTop.includes("東京ディズニーシー25周年") && japaneseTop.includes("ディズニー新幹線と、"), "index.html: seasonal entry must identify the Disney special-livery train");
expect(!/data-i18n="seasonal(?:Kicker|Title|Body)"/.test(japaneseTop), "index.html: seasonal entry still has stale app.js translation hooks");
expect(englishTop.includes('class="seasonal-entry"') && englishTop.includes('href="en/sparkling-dreams.html"'), "en/index.html: English seasonal entry must account for the page base URL");
expect(englishTop.includes('sparkling_dreams_entry_click') && englishTop.includes('TOKYO DISNEYSEA 25TH ANNIVERSARY'), "en/index.html: English seasonal entry copy or tracking is missing");
expect(/<link rel="canonical" href="https:\/\/www\.michikusa-travel\.com\/sparkling-dreams\.html">/.test(page), "sparkling-dreams.html: canonical is missing or incorrect");
expect(/<meta name="robots" content="index,follow/.test(page), "sparkling-dreams.html: index/follow robots metadata is missing");
expect(/<link rel="alternate" hreflang="en" href="https:\/\/www\.michikusa-travel\.com\/en\/sparkling-dreams\.html">/.test(page) && /<link rel="alternate" hreflang="x-default" href="https:\/\/www\.michikusa-travel\.com\/en\/sparkling-dreams\.html">/.test(page), "sparkling-dreams.html: English or x-default language route is missing");
expect(/<link rel="stylesheet" href="style\.css/.test(page), "sparkling-dreams.html: shared site stylesheet is missing");
expect(!/<link[^>]+rel="stylesheet"[^>]+href="https?:\/\//i.test(page), "sparkling-dreams.html: external stylesheet found");
const heroFigure = page.match(/<figure class="sd-hero-media">[\s\S]*?<\/figure>/)?.[0] || "";
const heroImageTag = heroFigure.match(/<img\b[^>]*>/)?.[0] || "";
const heroCaption = heroFigure.match(/<figcaption>[\s\S]*?<\/figcaption>/)?.[0] || "";
const heroLead = page.match(/<p class="sd-hero-lead">[\s\S]*?<\/p>/)?.[0] || "";
const heroNote = page.match(/<p class="sd-hero-note">[\s\S]*?<\/p>/)?.[0] || "";
const postSectionMatch = page.match(/<section class="sd-section sd-posts" aria-labelledby="sdVideosTitle">[\s\S]*?<\/section>/);
const postSection = postSectionMatch?.[0] || "";
const postSectionIndex = postSectionMatch?.index ?? -1;
const factsSectionIndex = page.indexOf('<section class="sd-section sd-facts"');
const calculatorSectionIndex = page.indexOf('<section class="sd-section sd-calculator-section"');
const postBlocks = postSection.match(/<blockquote class="twitter-tweet" data-dnt="true" data-media-max-width="560">[\s\S]*?<\/blockquote>/g) || [];
const youtubeFrames = postSection.match(/<iframe\b[^>]*><\/iframe>/g) || [];
const widgetScripts = page.match(/<script\b(?=[^>]*\basync\b)(?=[^>]*\bsrc="https:\/\/platform\.twitter\.com\/widgets\.js")(?=[^>]*\bcharset="utf-8")[^>]*><\/script>/gi) || [];
const widgetScriptIndex = widgetScripts.length ? page.indexOf(widgetScripts[0]) : -1;
const localScriptIndex = page.indexOf('<script src="data/timetable.js');
const calculatorScriptIndex = page.indexOf('<script src="sparkling-dreams.js?v=20260812-shared-embed-top-promo">');
const embeddedPostUrls = [...new Set(
  [...postSection.matchAll(/https:\/\/x\.com\/[^/"\s]+\/status\/\d+(?:\?[^"'\s<]*)?/g)]
    .map((match) => match[0].replace(/\?.*$/, "")),
)];
expect(/src="images\/20260802_sparkling-dreams-hamanako_toshi549\.jpg"/.test(heroImageTag), "sparkling-dreams.html: local photograph is not the hero image");
expect(/width="650"/.test(heroImageTag) && /height="434"/.test(heroImageTag), "sparkling-dreams.html: hero photograph dimensions are missing or incorrect");
expect(/alt="青空の下、海上の橋を走る青と白のSparkling Dreams Shinkansen"/.test(heroImageTag), "sparkling-dreams.html: hero photograph alt text is missing, not visual, or names a location");
expect(!/alt="[^"]*浜名湖/.test(heroImageTag), "sparkling-dreams.html: hero photograph alt text must not name a location");
expect(!/\bloading\s*=/.test(heroImageTag), "sparkling-dreams.html: above-the-fold hero photograph must not be lazy-loaded");
expect(!/sparkling-dreams-window\.svg/.test(heroFigure), "sparkling-dreams.html: abstract owned SVG is still used in the hero");
expect(/<p class="sd-hero-lead"><span class="copy-chunk">東京ディズニーシー25周年を記念した特別塗装列車。<\/span><span class="copy-chunk">公開ダイヤからすれ違いを探し、<\/span><span class="copy-chunk">沿線・車内・駅から届いた動画で、その姿を見比べます。<\/span><\/p>/.test(heroLead), "sparkling-dreams.html: hero estimate sentence must use semantic chunks without splitting 調べます。");
expect((heroLead.match(/class="copy-chunk"/g) || []).length === 3 && !/<br\b/i.test(heroLead), "sparkling-dreams.html: hero estimate lead has an unexpected chunk or forced line break");
expect(/<p class="sd-hero-note"><span class="copy-chunk">運転計画は変更されることがあります。<\/span><span class="copy-chunk">最新情報は必ず公式案内をご確認ください。<\/span><\/p>/.test(heroNote), "sparkling-dreams.html: hero service-change note must use the two approved semantic sentence chunks");
expect((heroNote.match(/class="copy-chunk"/g) || []).length === 2 && !/<br\b/i.test(heroNote), "sparkling-dreams.html: hero service-change note has an unexpected chunk or forced line break");
expect(new RegExp(`<figcaption>\\s*写真：<a href="${escapeRegExp(PHOTO_POST_URL)}" target="_blank" rel="noopener noreferrer">Toshi（@toshi549）／元投稿を見る<\\/a>\\s*<\\/figcaption>`).test(heroFigure), "sparkling-dreams.html: source-linked Toshi photo credit is missing or has extra visible caption text");
expect(!/(?:2026年|浜名湖|撮影)/.test(heroCaption) && (heroCaption.match(/<a\b/g) || []).length === 1, "sparkling-dreams.html: hero caption still exposes date/location text or extra links");
expect(!/sd-hero-video-card/.test(page), "sparkling-dreams.html: obsolete hero video card is still present");
expect(/class="sd-hero-actions"[\s\S]*href="#sdCalculator"[\s\S]*>乗る列車を選ぶ<[\s\S]*href="#sdVideosTitle"[\s\S]*>みんなの動画を見る</.test(page), "sparkling-dreams.html: hero train/video CTAs are missing or target the wrong sections");
expect(!/class="sd-fact-grid"/.test(page), "sparkling-dreams.html: obsolete four-item facts strip is still present");
expect(postSectionIndex > factsSectionIndex && postSectionIndex < calculatorSectionIndex, "sparkling-dreams.html: standalone X video section is missing or in the wrong order");
expect(postSection.includes("WINDOW FINDS") && postSection.includes("みんなが見つけたディズニー新幹線") && postSection.includes("sdVideoAlong") && postSection.includes("sdVideoOnboard") && postSection.includes("sdVideoStation"), "sparkling-dreams.html: standalone X video section heading is missing");
expect(!/class="section-sub"/.test(postSection), "sparkling-dreams.html: X video section must not add editorial summary copy");
expect(postBlocks.length === 10 && (page.match(/<blockquote\b[^>]*class="twitter-tweet"/g) || []).length === 10, "sparkling-dreams.html: expected exactly ten official X video blockquotes");
expect((postSection.match(/class="sd-post-embed sd-x-embed/g) || []).length === 10, "sparkling-dreams.html: every X post must use the stable loading container");
expect(postBlocks.every((block) => /data-dnt="true"/.test(block) && /data-media-max-width="560"/.test(block)), "sparkling-dreams.html: every X video must use privacy-enhanced official embed attributes");
expect(postSection.includes("Toshi (@toshi549)") && postSection.includes("ろん.てぃが (@ron__tigger)") && postSection.includes("BOWING797_10 (@Bowing797_10)") && postSection.includes("neco (@n_s_z__7)") && postSection.includes("sayu@Cinnamorollproject∞ (@47923y_PROJECT)") && postSection.includes("はしやん＠愛知 (@hashiyan84aichi)") && postSection.includes("@Tomo52dra500pon") && postSection.includes("@7AD5IxRI1ArWckK") && postSection.includes("@ninnin_2017") && postSection.includes("@Takahashidaga"), "sparkling-dreams.html: official X embed author lines are missing");
expect(embeddedPostUrls.length === 10 && [VIDEO_POST_URL, SECOND_VIDEO_POST_URL, THIRD_VIDEO_POST_URL, FOURTH_VIDEO_POST_URL, FIFTH_VIDEO_POST_URL, SIXTH_VIDEO_POST_URL, SEVENTH_VIDEO_POST_URL, EIGHTH_VIDEO_POST_URL, NINTH_VIDEO_POST_URL, TENTH_VIDEO_POST_URL].every((url) => embeddedPostUrls.includes(url)), "sparkling-dreams.html: X video section must contain exactly the six approved video post URLs");
expect(youtubeFrames.length === 2, "sparkling-dreams.html: expected exactly two YouTube privacy-enhanced embeds");
expect([
  ["cfK8UcZ-lmg", "JR東海×東京ディズニーリゾート 「Sparkling Dreams Shinkansen（スパークリングドリーム新幹線）」の車内＆車内メロディーを特別公開！"],
  ["unBFVa-QnR4", "浜松駅　ディズニー新幹線　出発　Sparkling Dreams Shinkansen"],
].every(([id, title]) => youtubeFrames.some((frame) => frame.includes(`src="https://www.youtube-nocookie.com/embed/${id}"`) && frame.includes(`title="${title}"`) && frame.includes('loading="lazy"') && frame.includes('referrerpolicy="strict-origin-when-cross-origin"') && frame.includes("allowfullscreen"))), "sparkling-dreams.html: YouTube embeds must use the approved videos, titles, and privacy-enhanced player contract");
expect(!/honobonosun_in|uechun624|tetsudoshimbun/.test(page), "sparkling-dreams.html: removed X posts must not remain in the video section");
const postCredits = postSection.match(/<p class="sd-post-credit">[\s\S]*?<\/p>/g) || [];
expect(postCredits.length === 12, "sparkling-dreams.html: every embedded video needs its own visible poster credit line");
expect([
  [VIDEO_POST_URL, "Toshi（@toshi549）"],
  [SECOND_VIDEO_POST_URL, "ろん.てぃが（@ron__tigger）"],
  [THIRD_VIDEO_POST_URL, "BOWING797_10（@Bowing797_10）"],
  [FOURTH_VIDEO_POST_URL, "neco（@n_s_z__7）"],
  [FIFTH_VIDEO_POST_URL, "sayu@Cinnamorollproject∞（@47923y_PROJECT）"],
  [SIXTH_VIDEO_POST_URL, "はしやん＠愛知（@hashiyan84aichi）"],
  [SEVENTH_VIDEO_POST_URL, "@Tomo52dra500pon"],
  [EIGHTH_VIDEO_POST_URL, "@7AD5IxRI1ArWckK"],
  [NINTH_VIDEO_POST_URL, "@ninnin_2017"],
  [TENTH_VIDEO_POST_URL, "@Takahashidaga"],
].every(([url, name]) => postCredits.some((credit) => new RegExp(`^<p class="sd-post-credit">動画：<a href="${escapeRegExp(url)}" target="_blank" rel="noopener noreferrer">${escapeRegExp(name)}／元投稿を見る</a></p>$`).test(credit))), "sparkling-dreams.html: poster credit must link the original post with no extra caption text");
expect([
  [YOUTUBE_VIDEO_URL, "鉄道チャンネルYoutube - Tetsudo(Railway) Channel, Japan-"],
  [SECOND_YOUTUBE_VIDEO_URL, "旅波-tabinami-"],
].every(([url, name]) => postCredits.some((credit) => new RegExp(`^<p class="sd-post-credit">YouTube：<a href="${escapeRegExp(url)}" target="_blank" rel="noopener noreferrer">${escapeRegExp(name)}／元動画を見る</a></p>$`).test(credit))), "sparkling-dreams.html: YouTube credits must name the source channel and link the original video");
expect(postCredits.every((credit) => !/(?:にて|撮影|浜名湖|鳥飼)/.test(credit)), "sparkling-dreams.html: poster credit must not add editorial location or caption text");
const postIntro = page.match(/<p class="sd-post-intro">[\s\S]*?<\/p>/)?.[0] || "";
expect(postIntro === `<p class="sd-post-intro"><span class="copy-chunk">XやYouTubeに投稿されているディズニー新幹線の動画を紹介します。</span><span class="copy-chunk">転載ではなく、XやYouTubeの埋め込み機能を使っています。</span></p>`, "sparkling-dreams.html: video intro must explain the source and official embed treatment");
expect(!/(?:sd-video-card|sd-video-card-head|sd-video-fallback)/.test(page), "sparkling-dreams.html: redundant custom video card copy is still present");
expect(widgetScripts.length === 0, "sparkling-dreams.html: X widgets.js must be loaded by the page controller, not a static duplicate loader");
expect(localScriptIndex > postSectionIndex && calculatorScriptIndex > localScriptIndex, "sparkling-dreams.html: local embed-loading code must run after the video section");
expect(!/(?:<video\b|\bposter\s*=|(?:pbs|video)\.twimg\.com|i\.ytimg\.com)/i.test(page), "sparkling-dreams.html: copied thumbnail, poster, or local video markup found");
expect(!/<img\b[^>]+(?:https?:)?\/\//i.test(page), "sparkling-dreams.html: hotlinked image found");
expect(!/(?:src|srcset)=["'][^"']*(?:disney|jr-central|tokyodisney)/i.test(page), "sparkling-dreams.html: external promotional image reference found");
expect(/og-sparkling-dreams\.png/.test(page), "sparkling-dreams.html: page-specific owned OGP image is missing");
expect(!/og-shinkansen-window\.png/.test(page), "sparkling-dreams.html: generic OGP image must not be used");
expect(/<meta property="og:image:alt" content="東京ディズニーシー25周年/.test(page), "sparkling-dreams.html: OGP image alt text is missing");
const expectedMetadata = [
  `<title>ディズニー新幹線の運転日・すれ違い時刻｜Sparkling Dreams Shinkansen | 新幹線の窓</title>`,
  `<meta name="description" content="ディズニー新幹線「Sparkling Dreams Shinkansen」の運転日とA・B・Cの運転パターンを案内。乗車日と列車を選ぶと、すれ違う時刻・場所・窓側の目安を確認できます。">`,
  `<meta property="og:title" content="ディズニー新幹線の運転日・すれ違い時刻｜Sparkling Dreams Shinkansen">`,
  `<meta property="og:description" content="ディズニー新幹線「Sparkling Dreams Shinkansen」の運転日とA・B・Cの運転パターンを案内。乗車日と列車を選ぶと、すれ違う時刻・場所・窓側の目安を確認できます。">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:title" content="ディズニー新幹線の運転日・すれ違い時刻｜Sparkling Dreams Shinkansen">`,
  `<meta name="twitter:description" content="ディズニー新幹線「Sparkling Dreams Shinkansen」の運転日とA・B・Cの運転パターンを案内。乗車日と列車を選ぶと、すれ違う時刻・場所・窓側の目安を確認できます。">`,
  `<meta name="twitter:image" content="https://www.michikusa-travel.com/images/og-sparkling-dreams.png">`,
  `<meta name="twitter:image:alt" content="東京ディズニーシー25周年の特別塗装列車を紹介する、白い新幹線と光の粒のオリジナルイラスト">`,
];
for (const metadata of expectedMetadata) expect(page.includes(metadata), `sparkling-dreams.html: expected metadata changed or is missing (${metadata.slice(0, 32)}...)`);
expect(page.includes('<link rel="stylesheet" href="style.css?v=20260812-shared-embed-top-promo">'), "sparkling-dreams.html: stylesheet cache token is missing or stale");
expect(stylesheet.includes(".sd-post-grid") && stylesheet.includes("grid-template-columns: repeat(2, minmax(0, 1fr))") && stylesheet.includes(".sd-post-grid { grid-template-columns: 1fr; }"), "style.css: X videos must be two columns on desktop and one column on mobile");
expect(stylesheet.includes(".sd-post-credit") && stylesheet.includes(".sd-post-note") && stylesheet.includes(".sd-video-nav") && stylesheet.includes(".sd-video-group"), "style.css: poster credit and embed-rights note styles are missing");
expect(stylesheet.includes(".sd-youtube-frame") && stylesheet.includes("aspect-ratio: 16 / 9"), "style.css: responsive YouTube player styles are missing");
expect(stylesheet.includes(".sd-x-embed.is-loading::before") && stylesheet.includes(".sd-youtube-frame.is-loading::before") && stylesheet.includes("sd-embed-shimmer"), "style.css: loading skeleton must be opt-in");
expect(!stylesheet.includes(".sd-x-embed .twitter-tweet > * { visibility: hidden; }") && !stylesheet.includes(".sd-youtube-frame iframe { opacity: 0"), "style.css: no-JS embed fallback must remain visible by default");
expect(stylesheet.includes(".sd-hero-media figcaption") && stylesheet.includes("white-space: nowrap"), "style.css: hero photo credit must stay on one line");
expect(calculatorCode.includes("function initEmbedLoading()") && calculatorCode.includes("IntersectionObserver") && calculatorCode.includes("widgets.load") && calculatorCode.includes('stage.classList.add("is-loading")') && calculatorCode.includes('stage.classList.remove("is-loading")'), "sparkling-dreams.js: shared lazy X widget loader is missing");
expect(!/(?:\.sd-video-card|\.sd-video-card-head|\.sd-video-fallback)/.test(stylesheet), "style.css: redundant custom post-card styles are still present");
expect(!stylesheet.includes(".sd-hero-video-card"), "style.css: obsolete hero video-card rules are still present");
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
  expect(/<lastmod>2026-08-11<\/lastmod>/.test(sitemapEntry[0]), "sitemap.xml: seasonal page lastmod is incorrect");
}

const englishSeasonalUrl = "https://www.michikusa-travel.com/en/sparkling-dreams.html";
const englishSitemapEntry = sitemap.match(new RegExp(`<url>[\\s\\S]*?<loc>${englishSeasonalUrl.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}</loc>[\\s\\S]*?</url>`));
expect(englishSitemapEntry && /<lastmod>2026-08-11<\/lastmod>/.test(englishSitemapEntry[0]) && /<changefreq>weekly<\/changefreq>/.test(englishSitemapEntry[0]), "sitemap.xml: English seasonal page is missing or stale");
expect(/<html lang="en">/.test(englishPage), "en/sparkling-dreams.html: html lang must be English");
expect(englishPage.includes('<link rel="canonical" href="https://www.michikusa-travel.com/en/sparkling-dreams.html">'), "en/sparkling-dreams.html: canonical is missing");
expect(englishPage.includes('hreflang="ja" href="https://www.michikusa-travel.com/sparkling-dreams.html"') && englishPage.includes('hreflang="en" href="https://www.michikusa-travel.com/en/sparkling-dreams.html"') && englishPage.includes('hreflang="x-default" href="https://www.michikusa-travel.com/en/sparkling-dreams.html"'), "en/sparkling-dreams.html: hreflang set is incomplete");
expect(englishPage.includes("Disney Shinkansen") && englishPage.includes("Sparkling Dreams Shinkansen") && englishPage.includes("estimated passing times"), "en/sparkling-dreams.html: English SEO target is missing");
expect(englishPage.includes('data-mado-lang="en"') && englishPage.includes('localStorage.setItem("mado-lang", "en")'), "en/sparkling-dreams.html: English language state is missing");
expect(englishPage.includes('href="../style.css?v=20260812-shared-embed-top-promo"') && englishPage.includes('src="../sparkling-dreams.js?v=20260812-shared-embed-top-promo"'), "en/sparkling-dreams.html: shared embed fallback assets are stale");
expect((englishPage.match(/class="twitter-tweet"/g) || []).length === 10 && (englishPage.match(/www\.youtube-nocookie\.com\/embed\//g) || []).length === 2, "en/sparkling-dreams.html: approved embed set changed");
expect(englishPage.includes("Track the Disney Shinkansen") && englishPage.includes("Choose your train") && englishPage.includes("See everyone's videos") && englishPage.includes("sd-post-intro") && !englishPage.includes("乗る列車を選ぶ"), "en/sparkling-dreams.html: English static UI copy is incomplete or Japanese UI leaked");
expect(englishPage.includes('<p class="sd-hero-lead"><span class="copy-chunk">A special train celebrating Tokyo DisneySea\'s 25th anniversary.</span><span class="copy-chunk">Use published timetables to find a possible encounter,</span><span class="copy-chunk">then compare the train through videos found along the line, inside trains, and at stations.</span></p>'), "en/sparkling-dreams.html: hero copy chunks must be self-contained meaning units without leading-space joins");
expect(calculatorCode.includes('const uiLanguage = document.documentElement.lang === "en"') && calculatorCode.includes("function renderEnglishResult") && calculatorCode.includes("E-seat side") && calculatorCode.includes("Pattern ${result.pattern}"), "sparkling-dreams.js: localized dynamic English calculator contract is missing");
expect(generatorCode.includes("const englishSeasonalEntry") && generatorCode.includes('href="en/sparkling-dreams.html"') && generatorCode.includes("sparkling_dreams_entry_click") && generatorCode.includes("images/sparkling-dreams-window.svg") && generatorCode.includes("${englishSeasonalEntry}"), "generate-spot-pages.mjs: English TOP seasonal entry must be generated, not deleted");
expect(generatorCode.includes('loc: `${siteRoot}/sparkling-dreams.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-08-11"') && generatorCode.includes('loc: `${siteRoot}/en/sparkling-dreams.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-08-11"'), "generate-spot-pages.mjs: Japanese and English seasonal sitemap entries must be regenerated");

const manifestPaths = new Set((manifest.files || []).map((entry) => entry.path));
expect(manifestPaths.has("sparkling-dreams.html"), "content-manifest.json: sparkling-dreams.html is missing");
expect(manifestPaths.has("en/index.html"), "content-manifest.json: English top page is missing");
expect(manifestPaths.has("en/sparkling-dreams.html"), "content-manifest.json: English sparkling-dreams.html is missing");
expect(manifestPaths.has("sparkling-dreams.js"), "content-manifest.json: sparkling-dreams.js is missing");
expect(manifestPaths.has("style.css"), "content-manifest.json: shared Sparkling Dreams stylesheet is missing");
expect(!manifestPaths.has("scripts/validate-sparkling-dreams.mjs"), "content-manifest.json: validation script must not be a runtime manifest asset");
expect(manifestPaths.has(PHOTO_PATH), `content-manifest.json: ${PHOTO_PATH} is missing`);
expect(manifestPaths.has("images/sparkling-dreams-window.svg"), "content-manifest.json: sparkling-dreams-window.svg is missing");
expect(manifestPaths.has("images/og-sparkling-dreams.png"), "content-manifest.json: og-sparkling-dreams.png is missing");
const heroPhotoManifestEntry = (manifest.files || []).find((entry) => entry.path === PHOTO_PATH);
if (heroPhotoManifestEntry && heroPhoto) {
  expect(heroPhotoManifestEntry.bytes === PHOTO_BYTES, `content-manifest.json: ${PHOTO_PATH} byte count is incorrect`);
  expect(heroPhotoManifestEntry.sha256 === PHOTO_SHA256, `content-manifest.json: ${PHOTO_PATH} SHA-256 is incorrect`);
}
const pageManifestEntry = (manifest.files || []).find((entry) => entry.path === "sparkling-dreams.html");
if (pageManifestEntry) {
  expect(pageManifestEntry.bytes === Buffer.byteLength(page, "utf8"), "content-manifest.json: sparkling-dreams.html byte count is stale");
  expect(pageManifestEntry.sha256 === createHash("sha256").update(page).digest("hex"), "content-manifest.json: sparkling-dreams.html SHA-256 is stale");
}
for (const entry of manifest.files || []) {
  try {
    const buffer = await readAppBuffer(entry.path);
    expect(entry.bytes === buffer.byteLength, `content-manifest.json: ${entry.path} byte count is stale`);
    expect(entry.sha256 === createHash("sha256").update(buffer).digest("hex"), `content-manifest.json: ${entry.path} SHA-256 is stale`);
  } catch {
    failures.push(`content-manifest.json: ${entry.path} is missing on disk`);
  }
}
const expectedContentVersion = createHash("sha256")
  .update((manifest.files || []).map((entry) => entry.sha256).join(":"))
  .update((manifest.audioPacks || []).flatMap((pack) => pack.items || []).map((entry) => entry.sha256).join(":"))
  .update((manifest.thumbnails?.items || []).map((entry) => entry.sha256).join(":"))
  .digest("hex")
  .slice(0, 16);
expect(manifest.contentVersion === expectedContentVersion, "content-manifest.json: contentVersion is stale");

if (failures.length) {
  throw new Error(`Sparkling Dreams validation failed:\n- ${failures.join("\n- ")}`);
}

console.log("Validated Sparkling Dreams page, schedule maps, manifest/sitemap, and calculator fixtures.");
