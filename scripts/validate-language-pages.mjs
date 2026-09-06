import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://www.michikusa-travel.com";
const dataContext = {};
vm.runInNewContext(`${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\nglobalThis.__SPOTS = SPOTS;\nglobalThis.__SPOT_COUNT = SPOTS.length;`, dataContext);
const spots = dataContext.__SPOTS;
const spotCount = dataContext.__SPOT_COUNT;
const spotIds = spots.map((spot) => spot.id);
// 本文をホスト側ページの章として持つスポットは、自分ではなくホストを代表URLにする。
// 同じクエリで自社2ページが並ぶ状態を避けるための、意図的な非自己canonical。
const canonicalSpotIdOf = (id) => {
  const spot = spots.find((item) => item.id === id);
  return spot && spot.guidePageId && spot.guidePageId !== spot.id ? spot.guidePageId : id;
};
const pairs = [
  ["/", "/en/"],
  ["/zukan.html", "/en/zukan.html"],
  ["/journal.html", "/en/journal.html"],
  ["/mieru.html", "/en/mieru.html"],
  ["/sumie.html", "/en/sumie.html"],
  ["/somato.html", "/en/somato.html"],
  ["/guide.html", "/en/guide.html"],
  ["/contact.html", "/en/contact.html"],
  ["/references.html", "/en/references.html"],
  ["/privacy.html", "/en/privacy.html"],
  ["/live/", "/en/live/"],
  ["/sparkling-dreams.html", "/en/sparkling-dreams.html"],
  ["/hanabi.html", "/en/hanabi.html"],
  ["/yakei.html", "/en/yakei.html"],
  ["/window-moments.html", "/en/window-moments.html"]
];

function diskPath(urlPath) {
  if (urlPath === "/") return path.join(appDir, "index.html");
  if (urlPath.endsWith("/")) return path.join(appDir, urlPath, "index.html");
  return path.join(appDir, urlPath);
}

function hasAlternate(html, language, urlPath) {
  const expected = `${origin}${urlPath}`;
  const pattern = new RegExp(
    `<link\\s+rel=["']alternate["']\\s+hreflang=["']${language}["']\\s+href=["']${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
    "i"
  );
  return pattern.test(html);
}

function hasCanonical(html, urlPath) {
  const expected = `${origin}${urlPath}`;
  const pattern = new RegExp(
    `<link\\s+rel=["']canonical["']\\s+href=["']${expected.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}["']`,
    "i"
  );
  return pattern.test(html);
}

const errors = [];
const expectedSpotIds = new Set(spotIds);
if (expectedSpotIds.size !== spotCount) {
  errors.push(`data.js: duplicate spot IDs found (${spotCount} spots, ${expectedSpotIds.size} unique IDs)`);
}

function collectSpotPageIds(directory) {
  if (!fs.existsSync(directory)) return new Set();
  return new Set(
    fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) => entry.name.slice(0, -".html".length))
  );
}

const spotPageDirectories = [
  ["spots", path.join(appDir, "spots")],
  ["en/spots", path.join(appDir, "en", "spots")]
];
for (const [label, directory] of spotPageDirectories) {
  const actualIds = collectSpotPageIds(directory);
  for (const id of expectedSpotIds) {
    if (!actualIds.has(id)) errors.push(`${label}/${id}.html: missing generated spot page`);
  }
  for (const id of actualIds) {
    if (!expectedSpotIds.has(id)) errors.push(`${label}/${id}.html: unexpected generated spot page`);
  }
}

for (const id of spotIds) {
  const canonicalId = canonicalSpotIdOf(id);
  const jaPath = `/spots/${canonicalId}.html`;
  const enPath = `/en/spots/${canonicalId}.html`;
  for (const [urlPath, language] of [[jaPath, "ja"], [enPath, "en"]]) {
    const selfPath = language === "ja" ? `/spots/${id}.html` : `/en/spots/${id}.html`;
    const file = diskPath(selfPath);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    if (!new RegExp(`<html[^>]+lang=["']${language}["']`, "i").test(html)) {
      errors.push(`${selfPath}: html lang must be ${language}`);
    }
    if (!hasCanonical(html, urlPath)) {
      errors.push(`${selfPath}: canonical must point to ${origin}${urlPath}`);
    }
    if (!hasAlternate(html, "ja", jaPath)) {
      errors.push(`${urlPath}: missing Japanese hreflang`);
    }
    if (!hasAlternate(html, "en", enPath)) {
      errors.push(`${urlPath}: missing English hreflang`);
    }
    if (!hasAlternate(html, "x-default", enPath)) {
      errors.push(`${urlPath}: x-default must point to English URL`);
    }
  }
}

for (const [jaPath, enPath] of pairs) {
  for (const [urlPath, language] of [[jaPath, "ja"], [enPath, "en"]]) {
    const file = diskPath(urlPath);
    if (!fs.existsSync(file)) {
      errors.push(`missing: ${urlPath}`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    if (!new RegExp(`<html[^>]+lang=["']${language}["']`, "i").test(html)) {
      errors.push(`${urlPath}: html lang must be ${language}`);
    }
    if (!hasAlternate(html, "ja", jaPath)) {
      errors.push(`${urlPath}: missing Japanese hreflang`);
    }
    if (!hasAlternate(html, "en", enPath)) {
      errors.push(`${urlPath}: missing English hreflang`);
    }
    if (!hasAlternate(html, "x-default", enPath)) {
      errors.push(`${urlPath}: x-default must point to English URL`);
    }
    if (language === "en" && /(?:href|action)=["'][^"']*\?lang=en(?:[&#"']|$)/i.test(html)) {
      errors.push(`${urlPath}: legacy ?lang=en internal link remains`);
    }
  }
}

for (const [jaPath, enPath] of [["/start.html", "/en/start.html"]]) {
  for (const [urlPath, language] of [[jaPath, "ja"], [enPath, "en"]]) {
    const file = diskPath(urlPath);
    if (!fs.existsSync(file)) {
      errors.push(`missing: ${urlPath}`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    if (!new RegExp(`<html[^>]+lang=["']${language}["']`, "i").test(html)) {
      errors.push(`${urlPath}: html lang must be ${language}`);
    }
    if (!/<meta name="robots" content="noindex,follow">/i.test(html)) {
      errors.push(`${urlPath}: train selector must be noindex,follow`);
    }
    if (/<link\s+rel=["']canonical["']|hreflang=|application\/ld\+json/i.test(html)) {
      errors.push(`${urlPath}: train selector must not have canonical, hreflang, or JSON-LD metadata`);
    }
    if (!html.includes('id="journey"')) {
      errors.push(`${urlPath}: train selector journey anchor is missing`);
    }
  }
}

const localizedGuidePages = [
  ["/zh-Hant/guide.html", "zh-Hant", "zh-Hant-TW"],
  ["/ko/guide.html", "ko", "ko"],
  ["/zh-Hans/guide.html", "zh-Hans", "zh-Hans-CN"],
  ["/fr/guide.html", "fr", "fr"],
  ["/de/guide.html", "de", "de"],
  ["/es/guide.html", "es", "es"]
];

const guideMobileSpotPages = [
  ["/guide.html", /^spots\/[a-z0-9-]+\.html$/],
  ["/en/guide.html", /^spots\/[a-z0-9-]+\.html$/],
  ["/zh-Hant/guide.html", /^\.\.\/en\/spots\/[a-z0-9-]+\.html$/],
  ["/ko/guide.html", /^\.\.\/en\/spots\/[a-z0-9-]+\.html$/],
  ["/zh-Hans/guide.html", /^\.\.\/en\/spots\/[a-z0-9-]+\.html$/],
  ["/fr/guide.html", /^\.\.\/en\/spots\/[a-z0-9-]+\.html$/],
  ["/de/guide.html", /^\.\.\/en\/spots\/[a-z0-9-]+\.html$/],
  ["/es/guide.html", /^\.\.\/en\/spots\/[a-z0-9-]+\.html$/],
];
const guideAlternates = [
  ["ja", "/guide.html"],
  ["en", "/en/guide.html"],
  ["zh-Hant-TW", "/zh-Hant/guide.html"],
  ["zh-Hans-CN", "/zh-Hans/guide.html"],
  ["ko", "/ko/guide.html"],
  ["fr", "/fr/guide.html"],
  ["de", "/de/guide.html"],
  ["es", "/es/guide.html"],
  ["ar", "/ar/guide.html"],
  ["x-default", "/en/guide.html"],
];
for (const [urlPath, hrefPattern] of guideMobileSpotPages) {
  const html = fs.readFileSync(diskPath(urlPath), "utf8");
  if (!html.includes('class="guide-lang-menu"') || html.includes('class="lang-switch"')) {
    errors.push(`${urlPath}: FAQ language navigation must use the compact dropdown`);
  }
  const languageOptionCount = (html.match(/class="guide-lang-options"/g) || []).length === 1
    ? ((html.match(/<a\b[^>]*>(?:日本語|English|繁體中文|简体中文|한국어|Français|Deutsch|Español|العربية)<\/a>/g) || []).length)
    : 0;
  if (languageOptionCount !== 9) {
    errors.push(`${urlPath}: guide language menu must contain all 9 languages, found ${languageOptionCount}`);
  }
  for (const [hreflang, alternatePath] of guideAlternates) {
    if (!hasAlternate(html, hreflang, alternatePath)) {
      errors.push(`${urlPath}: missing ${hreflang} guide hreflang`);
    }
  }
  if (/(?:href|src|data-affiliate-src)=["']\/\//i.test(html)) {
    errors.push(`${urlPath}: protocol-relative URL breaks local file preview`);
  }
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*data-guide-mobile-spot=["']([^"']+)["'][^>]*>/gi)];
  if (links.length !== 6) {
    errors.push(`${urlPath}: mobile guide strip must contain 6 tracked spot links, found ${links.length}`);
  }
  for (const match of links) {
    if (!hrefPattern.test(match[1])) errors.push(`${urlPath}: invalid mobile guide spot link: ${match[1]}`);
  }
  if (!html.includes('class="spot-page-section guide-mobile-timeline"') || !html.includes('"guide_mobile_spot_click"')) {
    errors.push(`${urlPath}: mobile guide timeline or analytics is missing`);
  }
  const guideLinkCount = (html.match(/class="show-guide-link"/g) || []).length;
  const metaCount = (html.match(/class="guide-mobile-spot-meta"/g) || []).length;
  if (guideLinkCount !== 6 || metaCount !== 0 || !html.includes('class="showcase-rail"')) {
    errors.push(`${urlPath}: mobile cards must match TOP card structure without timing metadata`);
  }
  // What this pins is *which* Kakegawa photo a guide may show, not how many times
  // it shows it. Requiring exactly two occurrences also froze the page layout: the
  // Japanese guide stopped listing the castle when its cloudy section was rebuilt
  // around the five stretches where Mt. Fuji is visible, and a correct page failed.
  // Keep the superseded photo banned; let each guide decide whether to show it.
  if (html.includes("20260530_kakegawa_castle.webp")) {
    errors.push(`${urlPath}: Kakegawa Castle FAQ images must use photo-2, not the superseded photo`);
  }
}

for (const [urlPath, language, hreflang] of localizedGuidePages) {
  const file = diskPath(urlPath);
  if (!fs.existsSync(file)) {
    errors.push(`missing: ${urlPath}`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  if (!new RegExp(`<html[^>]+lang=["']${language}["']`, "i").test(html)) {
    errors.push(`${urlPath}: html lang must be ${language}`);
  }
  if (!hasAlternate(html, hreflang, urlPath)) {
    errors.push(`${urlPath}: missing ${hreflang} hreflang`);
  }
  if (!hasAlternate(html, "ja", "/guide.html") || !hasAlternate(html, "en", "/en/guide.html")) {
    errors.push(`${urlPath}: missing Japanese or English hreflang`);
  }
  if (!hasAlternate(html, "x-default", "/en/guide.html")) {
    errors.push(`${urlPath}: x-default must point to English URL`);
  }
  if (!/"@type"\s*:\s*"WebPage"/.test(html) || /"@type"\s*:\s*"FAQPage"/.test(html)) {
    errors.push(`${urlPath}: structured data must use WebPage, not FAQPage`);
  }
  const railSpotLinks = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*data-guide-rail-spot=["']([^"']+)["'][^>]*>/gi)];
  if (railSpotLinks.length !== spotCount) {
    errors.push(`${urlPath}: guide rail must contain ${spotCount} tracked spot links, found ${railSpotLinks.length}`);
  }
  for (const match of railSpotLinks) {
    if (!/^\.\.\/en\/spots\/[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/.test(match[1])) {
      errors.push(`${urlPath}: localized rail link must point to an English spot page: ${match[1]}`);
    }
  }
  if (!html.includes('"guide_rail_spot_click"') || !html.includes('"guide_rail_view"')) {
    errors.push(`${urlPath}: guide rail analytics events are missing`);
  }
  if (!html.includes('"cta_train_search_click"')) {
    errors.push(`${urlPath}: train-search CTA analytics event is missing`);
  }
  if (!html.includes('class="content-rail-section"')) {
    errors.push(`${urlPath}: bottom content rail is missing`);
  }
  const articleSectionCount = (html.match(/<section class="spot-page-section/g) || []).length;
  if (articleSectionCount !== 10) {
    errors.push(`${urlPath}: localized guide must keep the 10-section article structure, found ${articleSectionCount}`);
  }
  if (html.includes("data-affiliate-module")) {
    errors.push(`${urlPath}: localized guide must not include affiliate modules during the pilot`);
  }
}

const sitemapHtml = fs.readFileSync(path.join(appDir, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemapHtml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
for (const required of [
  `${origin}/zh-Hans/guide.html`,
  `${origin}/fr/guide.html`,
  `${origin}/de/guide.html`,
  `${origin}/es/guide.html`,
  `${origin}/ar/guide.html`,
]) {
  if (!sitemapUrls.includes(required)) errors.push(`sitemap: missing ${required}`);
}
if (new Set(sitemapUrls).size !== sitemapUrls.length) {
  errors.push("sitemap: duplicate URLs found");
}

const englishHtmlFiles = [];
function collectEnglishHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectEnglishHtml(fullPath);
    else if (entry.isFile() && entry.name.endsWith(".html")) englishHtmlFiles.push(fullPath);
  }
}
collectEnglishHtml(path.join(appDir, "en"));
for (const file of englishHtmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const japaneseSwitches = html.matchAll(/<a\b([^>]*href=["']([^"']+)["'][^>]*)>\s*日本語\s*<\/a>/gi);
  for (const match of japaneseSwitches) {
    if (!/[?&]lang=ja(?:[&#]|$)/.test(match[2])) {
      errors.push(`${path.relative(appDir, file)}: Japanese language switch must explicitly set lang=ja`);
    }
  }
}

const englishLiveHtml = fs.readFileSync(path.join(appDir, "en", "live", "index.html"), "utf8");
for (const required of [
  'href="../../live/styles.css',
  'src="../../live/live.js'
]) {
  if (!englishLiveHtml.includes(required)) {
    errors.push(`/en/live/: missing shared live asset reference ${required}`);
  }
}

if (errors.length) {
  console.error(`Language page validation failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Language pages valid: ${spotCount} spot page pairs, ${pairs.length} Japanese/English pairs and ${localizedGuidePages.length} localized guides`);
