import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { liveHtmlContent, narrationContent } from "./live-sitemap.mjs";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const html = fs.readFileSync(path.join(appDir, "live/index.html"), "utf8");
const narration = fs.readFileSync(path.join(appDir, "live/narration.js"), "utf8");

test("live review detects explanation, metadata and content-link changes", () => {
  for (const changed of [
    html.replace("乗車中はGPSで現在地に合わせてガイド", "新しい使い方"),
    html.replace('<meta name="robots" content="index,follow', '<meta name="robots" content="noindex,follow'),
    html.replace('href="../guide.html" data-live-link data-live-copy="idleLinkGuide"', 'href="../guide-v2.html" data-live-link data-live-copy="idleLinkGuide"'),
  ]) assert.notDeepEqual(liveHtmlContent(changed), liveHtmlContent(html));
});

test("live review ignores CSS, asset versions, common navigation and JS implementation", () => {
  const changed = html.replace(/\?v=[a-f0-9]+/g, "?v=changed")
    .replace('class="idle-actions"', 'class="new-layout" style="padding:20px"')
    .replace('data-live-copy="navStart">列車選択', 'data-live-copy="navStart">変更した共通ナビ')
    .replace("var measurementId", "var harmlessImplementationChange; var measurementId");
  assert.deepEqual(liveHtmlContent(changed), liveHtmlContent(html));
});

test("narration review detects per-language script changes but ignores duration/formatting", () => {
  const changed = narration.replace("まもなく東京タワーです。", "東京タワーをご覧ください。");
  assert.notDeepEqual(narrationContent(changed, "ja"), narrationContent(narration, "ja"));
  assert.deepEqual(narrationContent(changed, "en"), narrationContent(narration, "en"));
  assert.deepEqual(narrationContent(narration.replace('"durationSec": 12', '"durationSec": 13'), "ja"), narrationContent(narration, "ja"));
});

test("CLI catches stale content and stale sitemap; explicit language review repairs only that language", () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "mado-live-sitemap-test-"));
  try {
    for (const file of ["scripts/validate-live-sitemap.mjs", "scripts/shared/live-sitemap.mjs", "scripts/live-sitemap-state.json", "live/index.html", "en/live/index.html", "live/narration.js", "sitemap.xml"]) {
      const target = path.join(temporaryDirectory, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(appDir, file), target);
    }
    const run = (...args) => spawnSync(process.execPath, [path.join(temporaryDirectory, "scripts/validate-live-sitemap.mjs"), ...args], { encoding: "utf8" });
    assert.equal(run().status, 0);
    fs.writeFileSync(path.join(temporaryDirectory, "live/index.html"), html.replace("乗車中はGPSで現在地に合わせてガイド", "新しい使い方"));
    const stale = run();
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /html changed since lastmod review/);
    const stateFile = path.join(temporaryDirectory, "scripts/live-sitemap-state.json");
    const before = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    assert.equal(run("--record", "2026-10-08", "--reason", "Updated landing explanation", "--lang", "ja").status, 0);
    const after = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    assert.deepEqual(after.en, before.en);
    assert.match(run().stderr, /sitemap lastmod does not match/);
    const sitemapFile = path.join(temporaryDirectory, "sitemap.xml");
    fs.writeFileSync(sitemapFile, fs.readFileSync(sitemapFile, "utf8").replace(/(<loc>https:\/\/www\.michikusa-travel\.com\/live\/<\/loc>\s*<lastmod>)2026-10-07/, "$12026-10-08"));
    assert.equal(run().status, 0);
    assert.notEqual(run("--record", "2026-08-16", "--reason", "Wrong earlier date").status, 0);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
