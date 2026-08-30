import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = "https://www.michikusa-travel.com/";
const legacyRoots = new Set(["v0", "v1"]);
const failures = [];
let checked = 0;

function htmlFiles(dir = appDir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) return [];
    const full = path.join(dir, entry.name);
    const relative = path.relative(appDir, full).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (legacyRoots.has(relative.split("/")[0])) return [];
      return htmlFiles(full);
    }
    return entry.isFile() && entry.name.endsWith(".html") ? [relative] : [];
  });
}

for (const relative of htmlFiles()) {
  const html = fs.readFileSync(path.join(appDir, relative), "utf8");
  const nav = html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/);
  if (!nav) continue;
  const firstLink = nav[1].match(/<a\b[^>]*href="([^"]+)"/);
  if (!firstLink) {
    failures.push(`${relative}: top navigation has no train-selection link`);
    continue;
  }
  const lang = html.match(/<html\b[^>]*lang="([^"]+)"/)?.[1] || "ja";
  const pageUrl = new URL(relative, siteRoot);
  const baseHref = html.match(/<base\b[^>]*href="([^"]+)"/)?.[1];
  const baseUrl = baseHref ? new URL(baseHref, pageUrl) : pageUrl;
  const actual = new URL(firstLink[1], baseUrl);
  const expectedPath = lang === "ja" ? "/start.html" : "/en/start.html";
  if (actual.pathname !== expectedPath || actual.hash) {
    failures.push(`${relative}: train-selection nav must resolve to ${expectedPath} without a hash, got ${actual.pathname}${actual.hash}`);
  }
  if (lang === "ja") {
    if (nav[1].includes("メダル帖")) failures.push(`${relative}: legacy header label "メダル帖" remains`);
    if (!nav[1].includes("スタンプ帖")) failures.push(`${relative}: Japanese header is missing "スタンプ帖"`);
  }
  checked += 1;
}

if (failures.length) {
  throw new Error(`Site navigation validation failed:\n- ${failures.join("\n- ")}`);
}

console.log(`Site navigation valid: ${checked} shared headers use canonical train-selection URLs and labels.`);
