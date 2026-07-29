import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = "https://www.michikusa-travel.com";

const pages = [
  {
    source: "zukan.html",
    output: "en/zukan.html",
    title: "Tokaido Shinkansen Field Guide | 37 Day and Night Views",
    description: "Browse 37 recommended Tokaido Shinkansen views for clear, cloudy, and night rides, including Mt. Fuji, lakes, castles, cities, signs, and family spotting ideas.",
  },
  {
    source: "journal.html",
    output: "en/journal.html",
    title: "Window View Journal | Shinkansen Window",
    description: "Like collecting station stamps in Japan, record 37 views from the Tokaido Shinkansen as Window Stamps and grow four journey medals.",
  },
];

function localizeEnglishRail(html) {
  const copy = [
    ["車窓メダル帖", "Window Medal Book"],
    ["新幹線の窓とは？", "About Shinkansen Window"],
    ["車窓をもっと楽しむ", "More ways to enjoy the window"],
    ["富士山FAQ", "Mt. Fuji FAQ"],
    ["見える時刻、座席側、曇りの日の答えを確認。", "Check the timing, seat side, and what to expect on cloudy days."],
    ["見える予報β", "Mt. Fuji Visibility Beta"],
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
    .replaceAll('href="zukan.html?filter=', 'href="en/zukan.html?filter=');
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

for (const page of pages) {
  const target = path.join(appDir, page.output);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, mirrorPage(page), "utf8");
}

const liveSource = fs.readFileSync(path.join(appDir, "live", "index.html"), "utf8");
const liveEnglish = liveSource
  .replace('<html lang="ja">', '<html lang="en">')
  .replace(/<title>[^<]*<\/title>/, '<title>Live Guide | Shinkansen Window</title>')
  .replace(
    /<meta name="description" content="[^"]*">/,
    '<meta name="description" content="A GPS-powered live guide that announces upcoming views along the Tokaido Shinkansen with audio and a countdown.">'
  )
  .replace(
    '<link rel="canonical" href="https://www.michikusa-travel.com/live/">',
    '<link rel="canonical" href="https://www.michikusa-travel.com/en/live/">'
  )
  .replace('<script src="../language-router.js?v=20260726-language-choice"></script>', '')
  .replaceAll('href="../', 'href="../../')
  .replaceAll('src="../', 'src="../../')
  .replace('src="live.js', 'src="../../live/live.js')
  .replace(/(<body[^>]*>)/, '$1\n  <script>try { localStorage.setItem("mado-lang", "en"); } catch (error) {}</script>');
const liveTarget = path.join(appDir, "en", "live", "index.html");
fs.mkdirSync(path.dirname(liveTarget), { recursive: true });
fs.writeFileSync(liveTarget, liveEnglish, "utf8");

console.log(`Generated ${pages.length + 1} English app mirrors.`);
