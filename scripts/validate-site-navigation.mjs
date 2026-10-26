import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { languages } from './shared/locales.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = "https://www.michikusa-travel.com/";
const legacyRoots = new Set(["v0", "v1"]);
const failures = [];
let checked = 0;
let runtimeChecked = 0;
const runtimeSources = ['spot-page-shared-data.js', 'spot-page-shared.js'].map(file => fs.readFileSync(path.join(appDir, file), 'utf8'));

function renderedSpotHTML(html, relative) {
  const dom = new JSDOM(html, { url: new URL(relative, siteRoot).href, runScripts: 'outside-only' });
  try {
    const doc = dom.window.document;
    const id = doc.body.getAttribute('data-spot-page-shared-id');
    const lang = doc.body.getAttribute('data-spot-page-shared-lang');
    if (!/^[a-z0-9-]+$/.test(id || '') || !['ja', 'en'].includes(lang)) throw new Error('invalid thin spot context');
    dom.window.console.error = message => failures.push(`${relative}: ${message}`);
    dom.window.eval(runtimeSources[0]);
    dom.window.eval(fs.readFileSync(path.join(appDir, `data/spot-pages/${id}.${lang}.js`), 'utf8'));
    dom.window.eval(runtimeSources[1]);
    if (!dom.window.MADO_SPOT_PAGE_RENDERED || doc.querySelectorAll('.topbar .top-nav').length !== 1) throw new Error('rendered spot must expose exactly one shared header');
    const roots = doc.querySelectorAll('.topbar, .content-rail-section, .spot-page-rail, .spot-page-showcase, .spot-compact-guide');
    for (const root of roots) for (const element of root.querySelectorAll('a[href], img[src]')) {
      const url = new URL(element.getAttribute(element.tagName === 'A' ? 'href' : 'src'), doc.baseURI);
      if (url.origin !== new URL(siteRoot).origin) continue;
      const target = decodeURIComponent(url.pathname).replace(/^\//, '') + (url.pathname.endsWith('/') ? 'index.html' : '');
      if (!fs.existsSync(path.join(appDir, target))) failures.push(`${relative}: rendered common UI target is missing: ${url.pathname}`);
      if (lang === 'en' && !url.pathname.startsWith('/en/') && element.tagName === 'A' && url.searchParams.get('lang') !== 'ja' && fs.existsSync(path.join(appDir, 'en', target))) failures.push(`${relative}: rendered English link leaves its existing English edition: ${url.pathname}`);
    }
    runtimeChecked += 1;
    return dom.serialize();
  } finally {
    dom.window.close();
  }
}

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
  let html = fs.readFileSync(path.join(appDir, relative), "utf8");
  if (/data-spot-page-shared-mode="page"/.test(html) && !/data-article-localized(?:[\s=>])/.test(html)) {
    try { html = renderedSpotHTML(html, relative); }
    catch (error) { failures.push(`${relative}: ${error.message}`); continue; }
  }
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
  const expectedPath = lang === "ja" ? "/start.html" : `/${languages.includes(lang) ? lang : 'en'}/start.html`;
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

console.log(`Site navigation valid: ${checked} shared headers use canonical train-selection URLs and labels; ${runtimeChecked} thin spot pages render their headers, links and images.`);
