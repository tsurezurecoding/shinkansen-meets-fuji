import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const normalize = (value) => value.replace(/\s+/g, " ").trim();

// Review content changes, not builds, CSS, asset versions or common navigation.
export function liveHtmlContent(html) {
  const metadata = [...html.matchAll(/<title>([\s\S]*?)<\/title>|<(?:meta|link)\b[^>]*(?:name="(?:description|robots)"|rel="canonical")[^>]*>/g)]
    .map((match) => normalize(match[0]));
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)?.[1];
  if (!body || !html.includes('id="idle-panel"') || metadata.length !== 4) {
    throw new Error("Live HTML content contract changed: review the lastmod fingerprint extraction.");
  }
  const content = body
    .replace(/<(script|style|header|nav)\b[^>]*>[\s\S]*?<\/\1>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  return {
    metadata,
    text: normalize(content.replace(/<[^>]*>/g, " ")),
    links: [...content.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]),
  };
}

export function narrationContent(source, lang) {
  const context = {};
  vm.runInNewContext(`${source}\n;globalThis.__narrations = NARRATIONS;`, context, { timeout: 1000 });
  if (!context.__narrations || !Object.keys(context.__narrations).length) throw new Error("Missing narration content.");
  return Object.keys(context.__narrations).sort().flatMap((id) =>
    ["down", "up"].flatMap((direction) => {
      const item = context.__narrations[id][direction]?.[lang];
      return item ? [[id, direction, item.text || "", item.speechText || "", item.audio === false]] : [];
    })
  );
}

export function liveFingerprints(appDir) {
  const narration = fs.readFileSync(path.join(appDir, "live/narration.js"), "utf8");
  return Object.fromEntries(["ja", "en"].map((lang) => [lang, {
    html: hash(liveHtmlContent(fs.readFileSync(path.join(appDir, lang === "ja" ? "live/index.html" : "en/live/index.html"), "utf8"))),
    narration: hash(narrationContent(narration, lang)),
  }]));
}

export function readLiveSitemapState(appDir) {
  const state = JSON.parse(fs.readFileSync(path.join(appDir, "scripts/live-sitemap-state.json"), "utf8"));
  const actual = liveFingerprints(appDir);
  for (const lang of ["ja", "en"]) {
    const entry = state[lang];
    if (!entry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod) || !entry.reason?.trim()) {
      throw new Error(`Invalid live lastmod review for ${lang}.`);
    }
    for (const part of ["html", "narration"]) {
      if (entry.fingerprints?.[part] !== actual[lang][part]) {
        throw new Error(`/${lang === "ja" ? "" : "en/"}live/: ${part} changed since lastmod review. Review the significant update date, then record it with check:live-sitemap. See scripts/live-sitemap.md.`);
      }
    }
  }
  return state;
}
