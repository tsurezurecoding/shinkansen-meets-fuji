import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { languages } from './shared/locales.mjs';
import { commonTargetFailures, findSiteRuntimeSnapshot, renderSiteRuntimeForValidation, withSiteRuntimeSnapshots } from './shared/site-runtime-validation.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = "https://www.michikusa-travel.com/";
const legacyRoots = new Set(["v0", "v1"]);
const failures = [];
let checked = 0;
let runtimeChecked = 0;
let thinChecked = 0;

function renderedSiteHTML(html, relative) {
  const options = { appDir, html, relative };
  const cached = findSiteRuntimeSnapshot(options);
  const rendered = cached ? null : renderSiteRuntimeForValidation(options);
  const snapshot = cached || rendered.snapshot;
  const dom = rendered?.dom || new JSDOM(snapshot.html, { url: new URL(relative, siteRoot).href });
  try {
    failures.push(...commonTargetFailures(dom.window.document, { appDir, relative }));
    runtimeChecked += 1;
    thinChecked += Number(snapshot.thin);
    return snapshot.html;
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

async function validateNavigation() {
for (const relative of htmlFiles()) {
  // Let closed JSDOM windows finish their queued cleanup before reading the next page.
  await new Promise(setImmediate);
  let html = fs.readFileSync(path.join(appDir, relative), "utf8");
  if (/data-spot-page-shared-module|mado-shared-ui-config|data-site-chrome-host|data-article-localized(?:[\s=>])/.test(html) || fs.existsSync(path.join(appDir, 'scripts/templates/site-source', `${relative}.tpl`))) {
    try { html = renderedSiteHTML(html, relative); }
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

console.log(`Site navigation valid: ${checked} shared headers use canonical train-selection URLs and labels; ${runtimeChecked} runtime/source pages (${thinChecked} thin spots) expose their common links and images.`);

}

await withSiteRuntimeSnapshots(async () => {
  if (process.argv.includes('--with-language-checks') || process.argv.includes('--language-only')) {
    for (const script of ['validate-castle-locales', 'validate-language-pages', 'validate-utility-locales', 'validate-mieru', 'validate-sparkling-locales']) {
      await import(`./${script}.mjs`);
      if (process.exitCode) throw new Error(`${script} failed`);
    }
    execFileSync(process.execPath, ['--test', 'scripts/editorial-notes.test.mjs'], { cwd: appDir, stdio: 'inherit' });
    await import('./validate-live-sitemap.mjs');
    if (process.exitCode) throw new Error('Live sitemap validation failed');
  }
  if (!process.argv.includes('--language-only')) await validateNavigation();
});
