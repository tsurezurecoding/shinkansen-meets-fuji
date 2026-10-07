import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { liveFingerprints, readLiveSitemapState } from "./shared/live-sitemap.mjs";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (args.includes("--record")) {
  const date = args[args.indexOf("--record") + 1];
  const reason = args[args.indexOf("--reason") + 1];
  const langs = args.includes("--lang") ? [args[args.indexOf("--lang") + 1]] : ["ja", "en"];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date || !args.includes("--reason") || !reason?.trim() || langs.some(lang => !["ja", "en"].includes(lang))) {
    throw new Error("Supply a reviewed date, --reason TEXT and optional --lang ja|en; never use the build date automatically.");
  }
  const statePath = path.join(appDir, "scripts/live-sitemap-state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const fingerprints = liveFingerprints(appDir);
  for (const lang of langs) {
    if (date < state[lang].lastmod) throw new Error(`Do not move ${lang} live lastmod backwards.`);
    state[lang] = { lastmod: date, reason, fingerprints: fingerprints[lang] };
  }
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  console.log("Recorded explicit live content review. Regenerate sitemap before validation.");
} else {
  const state = readLiveSitemapState(appDir);
  const sitemap = fs.readFileSync(path.join(appDir, "sitemap.xml"), "utf8");
  for (const lang of ["ja", "en"]) {
    const url = `https://www.michikusa-travel.com/${lang === "ja" ? "" : "en/"}live/`;
    const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].filter((match) => match[1].includes(`<loc>${url}</loc>`));
    if (entries.length !== 1 || !entries[0][1].includes(`<lastmod>${state[lang].lastmod}</lastmod>`)) {
      throw new Error(`${url}: sitemap lastmod does not match the reviewed source. Regenerate pages.`);
    }
  }
  console.log("Live sitemap dates match reviewed Japanese/English content and narration.");
}
