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
    description: `Browse ${SPOT_COUNT} window views from the Tokaido Shinkansen bullet train, and jump into themed guides: fireworks, night views, the Disney train, the trackside signs, and when Mt. Fuji comes into view.`,
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
    ["メダル帖", "Window Medal Book"],
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
    ["guide.html", "en/guide.html"],
    ["mieru.html", "en/mieru.html"],
    ["hanabi.html", "en/hanabi.html"],
    ["yakei.html", "en/yakei.html"],
    ["sparkling-dreams.html", "en/sparkling-dreams.html"],
    ["spots/727-board.html", "en/spots/727-board.html"],
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
    // 727-collection.html は日本語のみ。英語版はスポットページ（727と248の看板）へ逃がす。
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

const liveSource = fs.readFileSync(path.join(appDir, "live", "index.html"), "utf8");
const liveEnglish = liveSource
  .replace('<html lang="ja">', '<html lang="en">')
  .replace(/<title>[^<]*<\/title>/, '<title>Your position, and the next window view | Live Guide (alpha) | Shinkansen Window</title>')
  .replace(
    /<meta name="description" content="[^"]*">/,
    '<meta name="description" content="From your position on board, hear how long until the next view and which side to watch, with audio and a countdown. Covers Tokyo to Shin-Osaka. A demo run works without GPS. Alpha: timings can drift.">'
  )
  .replace(
    '<link rel="canonical" href="https://www.michikusa-travel.com/live/">',
    '<link rel="canonical" href="https://www.michikusa-travel.com/en/live/">'
  )
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
  .replace('<strong data-live-copy="eaLiveTitle">Androidアプリ版（早期アクセス）</strong>', '<strong data-live-copy="eaLiveTitle">Android app (early access)</strong>')
  .replace('<small data-live-copy="eaLiveBody">乗車中はアプリの方が安定して使えます。テスト参加者を募集中です。</small>', '<small data-live-copy="eaLiveBody">The app is steadier to use while you ride. We are looking for testers.</small>')
  .replace(/(<body[^>]*>)/, '$1\n  <script>try { localStorage.setItem("mado-lang", "en"); } catch (error) {}</script>');
const liveTarget = path.join(appDir, "en", "live", "index.html");
if (writeFileIfChanged(liveTarget, liveEnglish)) changedCount += 1;

console.log(`Generated ${pages.length + 1} English app mirrors: ${changedCount} changed, ${pages.length + 1 - changedCount} unchanged.`);
