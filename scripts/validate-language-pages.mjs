import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://www.michikusa-travel.com";
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
  ["/live/", "/en/live/"]
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

const errors = [];
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

const localizedGuidePages = [
  ["/zh-Hant/guide.html", "zh-Hant", "zh-Hant-TW"],
  ["/ko/guide.html", "ko", "ko"]
];

const guideMobileSpotPages = [
  ["/guide.html", /^spots\/[a-z0-9-]+\.html$/],
  ["/en/guide.html", /^spots\/[a-z0-9-]+\.html$/],
  ["/zh-Hant/guide.html", /^\.\.\/en\/spots\/[a-z0-9-]+\.html$/],
  ["/ko/guide.html", /^\.\.\/en\/spots\/[a-z0-9-]+\.html$/],
];
for (const [urlPath, hrefPattern] of guideMobileSpotPages) {
  const html = fs.readFileSync(diskPath(urlPath), "utf8");
  if (!html.includes('class="guide-lang-menu"') || html.includes('class="lang-switch"')) {
    errors.push(`${urlPath}: FAQ language navigation must use the compact dropdown`);
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
  const kakegawaPhoto2Count = (html.match(/20260712_kakegawa_castle_michikusa\.webp/g) || []).length;
  if (kakegawaPhoto2Count !== 2 || html.includes("20260530_kakegawa_castle.webp")) {
    errors.push(`${urlPath}: Kakegawa Castle FAQ images must use photo-2`);
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
  if (railSpotLinks.length !== 37) {
    errors.push(`${urlPath}: guide rail must contain 37 tracked spot links, found ${railSpotLinks.length}`);
  }
  for (const match of railSpotLinks) {
    if (!/^\.\.\/en\/spots\/[a-z0-9-]+\.html$/.test(match[1])) {
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
  if (html.includes("data-affiliate-module")) {
    errors.push(`${urlPath}: localized guide must not include affiliate modules during the pilot`);
  }
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

console.log(`Language pages valid: ${pairs.length} Japanese/English pairs and ${localizedGuidePages.length} localized guides`);
