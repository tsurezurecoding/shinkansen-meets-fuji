import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assetVersion } from "./shared/asset-version.mjs";
import { SPOT_COUNT } from "./shared/spot-count.mjs";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = "https://www.michikusa-travel.com";

// Spot counts in title/description must never be hand-typed here. They are the only
// count strings on the English field guide that reach the SERP, and hand-typed ones
// silently go stale every time a spot is added (this file claimed 37 while data.js
// held 40). SPOT_COUNT comes from shared/spot-count.mjs, which reads data.js.

const pages = [
  {
    source: "zukan.html",
    output: "en/zukan.html",
    title: `Tokaido Shinkansen Bullet Train Field Guide | ${SPOT_COUNT} Day and Night Views`,
    description: `Browse ${SPOT_COUNT} window views from the Tokaido Shinkansen bullet train for clear, cloudy, and night rides, including Mt. Fuji, lakes, castles, cities, signs, and family spotting ideas.`,
  },
  // journal.html is a hand-authored bilingual landing page; keep it out of the
  // generic mirror pass so its localized hero, metadata, and interactive copy survive regeneration.
];

function localizeEnglishRail(html) {
  const copy = [
    ["車窓メダル帖", "Window Medal Book"],
    ["新幹線の窓とは？", "About Shinkansen Window"],
    ["車窓をもっと楽しむ", "More ways to enjoy the window"],
    ["富士山FAQ", "Mt. Fuji FAQ"],
    ["見える時刻、座席側、曇りの日の答えを確認。", "Check the timing, seat side, and what to expect on cloudy days."],
    ["見える予報β", "Visibility β"],
    ["今日の富士山 見える予報", "Today's Mt. Fuji Visibility Forecast"],
    ["今日の空で富士山が見えそうかを確認。", "Check how likely Mt. Fuji is to appear in today's sky."],
    ["墨絵車窓", "Ink-Wash Window"],
    ["東海道新幹線の車窓を、静かな墨絵で。", "See the Tokaido Shinkansen window as a quiet ink-wash journey."],
    ["車窓走馬灯", "Window Revue"],
    ["実際の車窓写真で、旅を短くめぐる。", "Take a short journey through real window photographs."],
    ["スタンプ帖", "Window Stamps"],
    ["見つけた景色をスタンプとメダルで記録。", "Record each view with Window Stamps and medals."],
    ["新幹線の窓とは", "About Shinkansen Window"],
    ["使い方と楽しみ方を30秒で紹介。", "See how the guide works in 30 seconds."],
    ["車窓リンク集", "Window View Links"],
    ["出典や参考記事をまとめて読む。", "Browse sources and useful articles about the route."],
    ["お問い合わせ", "Contact"],
    ["写真提供、情報の訂正、ご感想はこちら。", "Send a photo, suggest a correction, or share feedback."],
    ["富士山の見方", "How to See Mt. Fuji"],
    ["プライバシーポリシー", "Privacy Policy"],
    ["時刻はのぞみ基準の目安で、列車・天候・座席位置により見え方は変わります。少し早めに窓の外を見てください。", "Times are Nozomi-based estimates; visibility varies by train, weather, and seat. Start watching a little early."],
  ];
  const routes = [
    ["start.html", "en/start.html"],
    ["guide.html", "en/guide.html"],
    ["mieru.html", "en/mieru.html"],
    ["hanabi.html", "en/hanabi.html"],
    ["yakei.html", "en/yakei.html"],
    ["sparkling-dreams.html", "en/sparkling-dreams.html"],
    ["sumie.html", "en/sumie.html"],
    ["somato.html", "en/somato.html"],
    ["journal.html", "en/journal.html"],
    ["lp.html", "en/lp.html"],
    ["references.html", "en/references.html"],
    ["contact.html", "en/contact.html"],
    ["privacy.html", "en/privacy.html"],
  ];
  let result = html;
  copy.forEach(([ja, en]) => { result = result.replaceAll(ja, en); });
  routes.forEach(([ja, en]) => { result = result.replaceAll(`href="${ja}"`, `href="${en}"`); });
  result = result
    .replaceAll('href="guide.html#', 'href="en/guide.html#')
    .replaceAll('href="zukan.html?filter=', 'href="en/zukan.html?filter=')
    // 727-collection.html は日本語のみ。英語版はスポットページへ案内する。
    .replaceAll('href="727-collection.html"', 'href="en/spots/727-board.html"');
  return result;
}

function mirrorPage(page) {
  const jaUrl = page.source === "index.html" ? `${siteRoot}/` : `${siteRoot}/${page.source}`;
  const enUrl = `${siteRoot}/${page.output.replace(/index\.html$/, "")}`;
  return localizeEnglishRail(fs.readFileSync(path.join(appDir, page.source), "utf8")
    .replace('<html lang="ja">', '<html lang="en">')
    .replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n  <base href="../">'
    )
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${page.description}">`)
    .replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${enUrl}">`)
    .replace(/<link rel="alternate" hreflang="ja" href="[^"]+">\s*/g, "")
    .replace(/<link rel="alternate" hreflang="en" href="[^"]+">\s*/g, "")
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]+">\s*/g, "")
    .replace(
      /(<link rel="canonical"[^>]+>)/,
      `$1\n  <link rel="alternate" hreflang="ja" href="${jaUrl}">\n  <link rel="alternate" hreflang="en" href="${enUrl}">\n  <link rel="alternate" hreflang="x-default" href="${enUrl}">`
    )
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${page.title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${page.description}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${enUrl}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${page.title}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${page.description}">`)
    .replaceAll('"inLanguage": "ja"', '"inLanguage": "en"')
    .replace('<body', '<body data-language-route="en"')
    .replace('>', '>')
    .replace(/(<body[^>]*>)/, '$1\n  <script>try { localStorage.setItem("mado-lang", "en"); } catch (error) {}</script>'));
}

function writeFileIfChanged(target, content) {
  // .gitattributes declares "*.html text eol=lf". Mirror output inherits whatever line
  // endings the Japanese source happens to carry on disk, and a CRLF-contaminated source
  // silently pushes CRLF into the generated English page. git diff hides it (it normalizes
  // on read) but the content-manifest sha check fails later. Normalize on write instead.
  const normalized = content.split("\r\n").join("\n");
  if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === normalized) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, normalized, "utf8");
  return true;
}

let changedCount = 0;
for (const page of pages) {
  const target = path.join(appDir, page.output);
  if (writeFileIfChanged(target, mirrorPage(page))) changedCount += 1;
}

// live.js owns the English copy for the live guide: every [data-live-copy] node, plus a few
// id-addressed ones, gets its text from STR.en at runtime. Bake the same strings into the
// generated HTML so crawlers and no-JS readers see English rather than the Japanese source.
function liveStringTables() {
  const src = fs.readFileSync(path.join(appDir, "live", "live.js"), "utf8");
  const tables = {};
  for (const lang of ["ja", "en"]) {
    const block = src.match(new RegExp(`\\n {4}${lang}: \\{\\n([\\s\\S]*?)\\n {4}\\},`));
    if (!block) throw new Error(`live/live.js: could not locate the STR.${lang} table`);
    const strings = {};
    for (const line of block[1].split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+):\s*"((?:[^"\\]|\\.)*)",?\s*$/);
      if (m) strings[m[1]] = JSON.parse(`"${m[2]}"`);
    }
    // Fail loudly rather than silently shipping Japanese if the table is ever reshaped.
    if (Object.keys(strings).length < 80) {
      throw new Error(`live/live.js: STR.${lang} parsed as only ${Object.keys(strings).length} keys; the table shape changed`);
    }
    tables[lang] = strings;
  }
  return tables;
}

// Strings that are meant to stay Japanese on the English page: the brand mark glyph and the
// Japanese half of the language switcher.
const LIVE_KEEP_JAPANESE = new Set(["窓", "日本語"]);

// Placeholder text that live.js always rewrites from run state before it can be read: a
// narration toggle whose label depends on the guide mode, a counter, and a help line built
// from a template with spot counts substituted in. There is no single STR key to bake in, and
// none of it is reachable until the guide is running, so it stays as the Japanese source has it.
const LIVE_RUNTIME_TEXT = new Set([
  "🔈 実況ON",
  "通過した車窓 (0)",
  "主要は定番・注目スポット、すべては看板などの小ネタも含みます。",
]);

function localizeLiveStaticCopy(html, tables) {
  const escapeText = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const take = (key) => {
    const value = tables.en[key];
    if (typeof value !== "string") throw new Error(`live/live.js: STR.en has no "${key}"`);
    return escapeText(value);
  };
  let result = html.replace(
    /(<(\w+)\b[^>]*\bdata-live-copy="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (whole, open, tag, key, text, close) => `${open}${take(key)}${close}`
  );
  for (const [id, key] of [
    ["live-title", "appTitle"],
    ["live-alpha-badge", "alphaBadge"],
    ["idle-title", "idleTitle"],
    ["idle-desc", "idleDesc"],
    ["idle-alpha-note", "alphaNote"],
    // Toolbar controls whose initial label is a fixed string live.js also renders from STR.
    // The narration toggles are deliberately absent: their label is derived from run state
    // (narrFeatured / narrAll / narrOff) and has no single key to bake in.
    ["tb-status", "waiting"],
    ["btn-dir", "dirAuto"],
    ["btn-pause", "pause"],
    ["map-pause", "pause"],
    ["map-stop", "stopRun"],
    ["set-privacy-link", "privacy"],
  ]) {
    const pattern = new RegExp(`(<(\\w+)\\b[^>]*\\bid="${id}"[^>]*>)([^<]*)(</\\2>)`);
    if (!pattern.test(result)) throw new Error(`live/index.html: no simple-text element with id="${id}"`);
    result = result.replace(pattern, (whole, open, tag, text, close) => `${open}${take(key)}${close}`);
  }
  const features = /(<ul[^>]*\bid="idle-features"[^>]*>)([\s\S]*?)(<\/ul>)/;
  if (!features.test(result)) throw new Error("live/index.html: no ul#idle-features");
  result = result.replace(features, (whole, open, body, close) =>
    `${open}\n          <li>${take("idleFeature1")}</li>\n          <li>${take("idleFeature2")}</li>\n          <li>${take("idleFeature3")}</li>\n        ${close}`
  );

  // Sweep whatever Japanese is left by matching the text against STR.ja and swapping in the
  // English for the same key -- the id-by-id maps above cannot keep up with a page this size.
  // A Japanese string shared by several keys still resolves as long as they agree in English.
  const englishByJapanese = new Map();
  for (const [key, japanese] of Object.entries(tables.ja)) {
    if (typeof tables.en[key] !== "string") continue;
    if (!englishByJapanese.has(japanese)) englishByJapanese.set(japanese, new Set());
    englishByJapanese.get(japanese).add(tables.en[key]);
  }
  const unresolved = new Set();
  result = result
    .split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<title>[\s\S]*?<\/title>)/)
    .map((chunk, index) => {
      if (index % 2 === 1) return chunk; // script/style body and <title>: handled elsewhere
      return chunk.replace(/>([^<>]+)</g, (whole, text) => {
        const trimmed = text.trim();
        if (!trimmed || !/[぀-ヿ一-鿿]/.test(trimmed)) return whole;
        const candidates = englishByJapanese.get(trimmed);
        if (candidates && candidates.size === 1) {
          return `>${text.replace(trimmed, escapeText([...candidates][0]))}<`;
        }
        if (!LIVE_KEEP_JAPANESE.has(trimmed) && !LIVE_RUNTIME_TEXT.has(trimmed)) unresolved.add(trimmed);
        return whole;
      });
    })
    .join("");
  if (unresolved.size) {
    const shown = [...unresolved].map((s) => JSON.stringify(s.length > 40 ? `${s.slice(0, 40)}...` : s));
    console.warn(`  en/live/index.html: ${unresolved.size} Japanese string(s) have no STR mapping and ship as-is: ${shown.join(", ")}`);
  }
  return result;
}

const liveSource = fs.readFileSync(path.join(appDir, "live", "index.html"), "utf8");
const liveEnTitle = "Tokaido Shinkansen audio guide | GPS calls the next view and which side to watch | Shinkansen Window";
const liveEnDescription = "GPS follows your position on board and calls the next window view with a map and audio, in English or Japanese: how long until it appears, and whether to watch the Seat A or Seat E side. Tokyo to Shin-Osaka, Mt. Fuji included. A preview ride works without boarding.";
// The Japanese page shows a screenshot of the guide running, which is the strongest possible
// preview -- but that screenshot has a Japanese interface in it, and putting it on the English
// page would tell English readers the app is Japanese-only. Fall back to the language-neutral
// site image until an English screenshot exists; then point this at it and drop the note.
const liveEnImage = `${siteRoot}/images/og-shinkansen-window.png`;
const liveEnImageAlt = "Shinkansen Window — another journey beyond the glass.";

const liveEnglish = localizeLiveStaticCopy(liveSource, liveStringTables())
  .replace('<html lang="ja">', '<html lang="en">')
  .replace(/<title>[^<]*<\/title>/, `<title>${liveEnTitle}</title>`)
  .replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${liveEnDescription}">`
  )
  .replace(
    '<link rel="canonical" href="https://www.michikusa-travel.com/live/">',
    '<link rel="canonical" href="https://www.michikusa-travel.com/en/live/">'
  )
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${liveEnTitle}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${liveEnDescription}">`)
  .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${liveEnImage}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${siteRoot}/en/live/">`)
  .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${liveEnTitle}">`)
  .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${liveEnDescription}">`)
  .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${liveEnImage}">`)
  .replace(/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${liveEnImageAlt}">`)
  .replaceAll('href="../', 'href="../../')
  // The blanket depth-bump above assumes every ../ link targets a Japanese page at the
  // app root. Whenever an English counterpart exists under en/, walk one level back so the
  // shipped HTML is already English -- live.js only fixes [data-live-link] anchors, and only
  // once it runs, which leaves crawlers and no-JS readers on the Japanese pages.
  .replace(/href="\.\.\/\.\.\/([^"#?]*)([^"]*)"/g, (whole, target, suffix) => {
    const page = target === "" || target.endsWith("/") ? `${target}index.html` : target;
    return fs.existsSync(path.join(appDir, "en", page)) ? `href="../${target}${suffix}"` : whole;
  })
  .replaceAll('src="../', 'src="../../')
  .replace('href="styles.css', 'href="../../live/styles.css')
  .replace('src="live.js', 'src="../../live/live.js')
  .replace(
    /<script src="\.\.\/\.\.\/live\/live\.js\?v=[^"]+"><\/script>/,
    `<script src="../../live/live.js?v=${assetVersion("live/live.js")}"></script>`
  )
  .replace(/(<body[^>]*>)/, '$1\n  <script>try { localStorage.setItem("mado-lang", "en"); } catch (error) {}</script>');
const liveTarget = path.join(appDir, "en", "live", "index.html");
if (writeFileIfChanged(liveTarget, liveEnglish)) changedCount += 1;

console.log(`Generated ${pages.length + 1} English app mirrors: ${changedCount} changed, ${pages.length + 1 - changedCount} unchanged.`);
