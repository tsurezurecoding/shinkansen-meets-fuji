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

console.log(`Language pages valid: ${pairs.length} Japanese/English pairs`);
