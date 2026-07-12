/* =========================================================
 * AI window guide narration review tool
 *
 * Creates a local HTML report for checking narration text and mp3 files.
 *
 * Usage:
 *   node app/scripts/review-narration.cjs
 *   node app/scripts/review-narration.cjs --out .codex-local/company/reports/narration-review.html
 *
 * The report is local-only. It is intended for human review before release.
 * ========================================================= */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..", "..");
const appDir = path.join(repoRoot, "app");
const defaultOut = path.join(repoRoot, ".codex-local", "company", "reports", "narration-review.html");

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const outPath = path.resolve(repoRoot, argValue("--out", defaultOut));

function readUtf8(file) {
  return fs.readFileSync(file, "utf8");
}

function loadGlobal(file, trailer, key) {
  const source = readUtf8(file);
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(source + "\n" + trailer, ctx, { filename: file });
  return ctx.window[key];
}

function htmlEscape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attr(value) {
  return htmlEscape(value).replace(/'/g, "&#39;");
}

function relUrl(fromFile, targetFile) {
  return path.relative(path.dirname(fromFile), targetFile).split(path.sep).map(encodeURIComponent).join("/");
}

function formatBytes(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

function formatTime(stat) {
  if (!stat) return "-";
  const date = stat instanceof Date ? stat : stat.mtime;
  return date ? date.toISOString().replace("T", " ").slice(0, 16) : "-";
}

function words(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function textMetric(lang, text) {
  return lang === "ja" ? `${String(text || "").length} chars` : `${words(text)} words`;
}

function listAudioFiles(audioDir) {
  if (!fs.existsSync(audioDir)) return [];
  return fs.readdirSync(audioDir)
    .filter((name) => /\.(mp3|wav)$/i.test(name))
    .sort();
}

const narrationPath = path.join(appDir, "live", "narration.js");
const dataPath = path.join(appDir, "data.js");
const audioDir = path.join(appDir, "live", "audio");
const NARRATIONS = loadGlobal(narrationPath, "window.__NARRATIONS = NARRATIONS;", "__NARRATIONS") || {};
const SPOTS = loadGlobal(dataPath, "window.__SPOTS = SPOTS;", "__SPOTS") || [];
const spotsById = new Map(SPOTS.map((spot) => [spot.id, spot]));
const narrationStat = fs.statSync(narrationPath);
const rows = [];
const expectedAudio = new Set();

for (const [id, entry] of Object.entries(NARRATIONS)) {
  const spot = spotsById.get(id);
  for (const dir of ["down", "up"]) {
    if (!entry[dir]) continue;
    for (const lang of ["ja", "en"]) {
      const item = entry[dir][lang];
      if (!item || !item.text) continue;
      const speechText = item.speechText || item.text;
      const primaryName = item.audio && item.audio !== false
        ? item.audio.replace(/^audio\//, "")
        : `${id}_${dir}_${lang}.mp3`;
      const fallbackName = primaryName.toLowerCase().endsWith(".mp3")
        ? primaryName.replace(/\.mp3$/i, ".wav")
        : "";
      const primaryPath = path.join(audioDir, primaryName);
      const fallbackPath = fallbackName ? path.join(audioDir, fallbackName) : "";
      const hasPrimary = fs.existsSync(primaryPath);
      const hasFallback = !hasPrimary && fallbackPath && fs.existsSync(fallbackPath);
      const expectedName = hasFallback ? fallbackName : primaryName;
      const audioPath = hasFallback ? fallbackPath : primaryPath;
      expectedAudio.add(primaryName);
      if (fallbackName) expectedAudio.add(fallbackName);
      const stat = fs.existsSync(audioPath) ? fs.statSync(audioPath) : null;
      const missing = !stat;
      const tooSmall = stat && stat.size < 1000;
      const stale = stat && stat.mtime < narrationStat.mtime;
      const fallback = !!hasFallback;
      rows.push({
        id,
        spotName: spot?.ja?.name || id,
        area: spot?.ja?.area || "",
        dir,
        lang,
        text: item.text,
        speechText,
        speechDiffers: speechText !== item.text,
        durationSec: item.durationSec || "",
        metric: textMetric(lang, speechText),
        expectedName,
        primaryName,
        fallback,
        audioPath,
        audioUrl: stat ? relUrl(outPath, audioPath) : "",
        size: stat ? stat.size : 0,
        updated: stat ? stat.mtime : null,
        status: missing ? "missing" : tooSmall ? "small" : fallback ? "fallback" : stale ? "stale" : "ok",
      });
    }
  }
}

const actualAudio = listAudioFiles(audioDir);
const extraAudio = actualAudio.filter((name) => !expectedAudio.has(name));
const counts = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

function statusLabel(status) {
  return {
    ok: "OK",
    fallback: "LOCAL WAV",
    stale: "STALE",
    missing: "MISSING",
    small: "TOO SMALL",
  }[status] || status;
}

const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
const css = `
  :root { color-scheme: dark; --bg:#0d1524; --panel:#16233a; --line:#2b3d5e; --text:#eef3fb; --sub:#a9b7cf; --ok:#7ec8a9; --warn:#ffd166; --bad:#ff6b6b; --accent:#4da3ff; }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Yu Gothic",sans-serif; background:var(--bg); color:var(--text); line-height:1.65; }
  h1 { margin:0 0 4px; font-size:26px; }
  h2 { margin:28px 0 10px; font-size:18px; }
  p { color:var(--sub); margin:0 0 16px; }
  .summary { display:flex; flex-wrap:wrap; gap:10px; margin:18px 0; }
  .pill { border:1px solid var(--line); background:var(--panel); border-radius:999px; padding:6px 12px; font-weight:700; }
  .pill.ok { color:var(--ok); } .pill.fallback,.pill.stale,.pill.small { color:var(--warn); } .pill.missing { color:var(--bad); }
  .tools { position:sticky; top:0; z-index:2; display:flex; gap:10px; flex-wrap:wrap; padding:10px 0 14px; background:linear-gradient(var(--bg), rgba(13,21,36,.92)); }
  input, select { background:var(--panel); color:var(--text); border:1px solid var(--line); border-radius:8px; padding:8px 10px; font:inherit; }
  input { min-width:min(420px, 100%); flex:1; }
  table { width:100%; border-collapse:collapse; margin-top:10px; }
  th, td { border-bottom:1px solid var(--line); padding:10px; vertical-align:top; }
  th { color:var(--sub); text-align:left; font-size:12px; letter-spacing:.04em; position:sticky; top:58px; background:var(--bg); z-index:1; }
  tr { background:rgba(255,255,255,.02); }
  tr[data-status="ok"] .status { color:var(--ok); }
  tr[data-status="fallback"] .status, tr[data-status="stale"] .status, tr[data-status="small"] .status { color:var(--warn); }
  tr[data-status="missing"] .status { color:var(--bad); }
  .spot { font-weight:800; white-space:nowrap; }
  .meta { color:var(--sub); font-size:12px; }
  .text { max-width:640px; white-space:pre-wrap; }
  .speech { margin-top:8px; padding-top:8px; border-top:1px dashed var(--line); color:#dbe8ff; }
  audio { width:240px; max-width:100%; }
  code { color:#d7e5ff; }
  .extras { border:1px solid var(--line); background:var(--panel); border-radius:10px; padding:12px 16px; }
  .extras li { margin:4px 0; }
`;

const tableRows = rows.map((row) => `
  <tr data-status="${attr(row.status)}" data-id="${attr(row.id)}" data-lang="${attr(row.lang)}" data-dir="${attr(row.dir)}">
    <td class="status"><strong>${statusLabel(row.status)}</strong><div class="meta">${htmlEscape(row.metric)}${row.durationSec ? ` / ${htmlEscape(row.durationSec)}s` : ""}</div>${row.fallback ? `<div class="meta">mp3 missing: ${htmlEscape(row.primaryName)}</div>` : ""}</td>
    <td><div class="spot">${htmlEscape(row.spotName)}</div><div class="meta">${htmlEscape(row.id)} / ${htmlEscape(row.area)}</div></td>
    <td>${htmlEscape(row.dir)}<div class="meta">${row.dir === "down" ? "東京→新大阪" : "新大阪→東京"}</div></td>
    <td>${htmlEscape(row.lang)}</td>
    <td class="text">${htmlEscape(row.text)}${row.speechDiffers ? `<div class="speech"><div class="meta">Speech text</div>${htmlEscape(row.speechText)}</div>` : ""}</td>
    <td>
      <div><code>${htmlEscape(row.expectedName)}</code></div>
      <div class="meta">${formatBytes(row.size)} / ${htmlEscape(formatTime(row.updated))}</div>
      ${row.audioUrl ? `<audio controls preload="none" src="${attr(row.audioUrl)}"></audio>` : `<div class="meta">audio file not found</div>`}
    </td>
  </tr>
`).join("");

const extrasHtml = extraAudio.length
  ? `<div class="extras"><strong>Expected by no current narration entry:</strong><ul>${extraAudio.map((name) => `<li><code>${htmlEscape(name)}</code></li>`).join("")}</ul></div>`
  : `<div class="extras"><strong>Extra audio files:</strong> none</div>`;

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI車窓ガイド 台本・音声レビュー</title>
  <style>${css}</style>
</head>
<body>
  <h1>AI車窓ガイド 台本・音声レビュー</h1>
  <p>Generated ${htmlEscape(generatedAt)}. Source: <code>app/live/narration.js</code>. Audio: <code>app/live/audio/</code>.</p>
  <div class="summary">
    <span class="pill">entries ${rows.length}</span>
    <span class="pill ok">OK ${counts.ok || 0}</span>
    <span class="pill fallback">LOCAL WAV ${counts.fallback || 0}</span>
    <span class="pill stale">STALE ${counts.stale || 0}</span>
    <span class="pill missing">MISSING ${counts.missing || 0}</span>
    <span class="pill small">TOO SMALL ${counts.small || 0}</span>
    <span class="pill">extra ${extraAudio.length}</span>
  </div>
  <p>OK means the current primary audio is available. LOCAL WAV means the high-quality mp3 is missing and the report is using a Windows local fallback file. STALE means the audio is older than <code>narration.js</code>.</p>
  <div class="tools">
    <input id="q" type="search" placeholder="Filter by spot id, name, text, or filename">
    <select id="status"><option value="">All statuses</option><option value="ok">OK</option><option value="stale">STALE</option><option value="missing">MISSING</option><option value="small">TOO SMALL</option></select>
    <select id="lang"><option value="">All languages</option><option value="ja">ja</option><option value="en">en</option></select>
    <select id="dir"><option value="">All directions</option><option value="down">down</option><option value="up">up</option></select>
  </div>
  <table>
    <thead><tr><th>Status</th><th>Spot</th><th>Dir</th><th>Lang</th><th>Narration text / speech text</th><th>Audio</th></tr></thead>
    <tbody id="rows">${tableRows}</tbody>
  </table>
  <h2>Extra Audio Files</h2>
  ${extrasHtml}
  <script>
    const q = document.getElementById("q");
    const status = document.getElementById("status");
    const lang = document.getElementById("lang");
    const dir = document.getElementById("dir");
    const rows = [...document.querySelectorAll("tbody tr")];
    function apply() {
      const needle = q.value.trim().toLowerCase();
      rows.forEach((row) => {
        const ok = (!needle || row.textContent.toLowerCase().includes(needle))
          && (!status.value || row.dataset.status === status.value)
          && (!lang.value || row.dataset.lang === lang.value)
          && (!dir.value || row.dataset.dir === dir.value);
        row.hidden = !ok;
      });
    }
    [q, status, lang, dir].forEach((el) => el.addEventListener("input", apply));
  </script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, "utf8");

console.log(`Narration entries: ${rows.length}`);
console.log(`OK: ${counts.ok || 0}`);
console.log(`LOCAL_WAV: ${counts.fallback || 0}`);
console.log(`STALE: ${counts.stale || 0}`);
console.log(`MISSING: ${counts.missing || 0}`);
console.log(`TOO_SMALL: ${counts.small || 0}`);
console.log(`EXTRA_AUDIO: ${extraAudio.length}`);
console.log(`Report: ${outPath}`);
if ((counts.missing || 0) > 0 || (counts.small || 0) > 0) process.exitCode = 1;
