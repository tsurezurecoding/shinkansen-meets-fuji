// 静的な山陽記事。東海道のSPOTS・payload・通過時刻には接続しない。
import fs from 'node:fs';
import vm from 'node:vm';
import { castleCollectionFor } from './shared/castle-reading-collection.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SANYO_DETAIL_CASTLES } from './shared/sanyo-castles.mjs';
import { thumbnailSrc, miniMapZoomForViewpoint } from './shared/geo.mjs';
import { assetVersion } from './shared/asset-version.mjs';
import { ANALYTICS } from './shared/feature-page.mjs';
import { GOOGLE_MAPS_EMBED_API_KEY } from './shared/map-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'spot-page-shared.js'), 'utf8'), sharedContext);
const origin = 'https://www.michikusa-travel.com';
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const localized = (value, lang) => typeof value === 'string' ? value : value[lang];
function footer(lang, dest) {
  const source = path.join(root, lang === 'en' ? 'en/yakei.html' : 'yakei.html');
  const html = fs.readFileSync(source, 'utf8').match(/<footer class="footer">[\s\S]*?<\/footer>/)?.[0];
  if (!html) throw Error('Shared footer not found');
  return html.replace(/href="([^"#]+)"/g, (whole, url) => {
    if (/^(?:https?:|mailto:)/.test(url)) return whole;
    return `href="${path.relative(path.dirname(dest), path.resolve(path.dirname(source), url)).replaceAll('\\', '/')}"`;
  });
}
function mapUrl(detail, lang, viewpoint = false) {
  const point = viewpoint ? detail.viewpoint : detail.castle;
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY, q: `${point.lat},${point.lng}`,
    center: `${detail.castle.lat},${detail.castle.lng}`,
    zoom: String(miniMapZoomForViewpoint({ map: detail.castle }, detail.viewpoint, NaN)),
    maptype: 'satellite', language: lang
  });
  return `https://www.google.com/maps/embed/v1/place?${params}`;
}
function render(castle, lang, dest) {
  const en = lang === 'en', prefix = en ? '../../' : '../', route = `spots/${castle.id}.html`;
  const local = en ? 'en/' : '', detail = castle.detail;
  const pick = (ja, english) => en ? english : ja;
  const heading = value => en ? esc(value.en) : value.ja.split(/(?<=、)/).map(chunk => `<span class="copy-chunk">${esc(chunk)}</span>`).join('');
  const title = detail.title[lang];
  const description = detail.description[lang], url = `${origin}/${local}${route}`;
  const css = file => `<link rel="stylesheet" href="${prefix}${file}?v=${assetVersion(file)}">`;
  const script = file => `<script src="${prefix}${file}?v=${assetVersion(file)}"></script>`;
  const mapExternal = `https://www.google.com/maps/search/?api=1&query=${detail.castle.lat},${detail.castle.lng}`;
  const photos = detail.photos.map((photo, index) => {
    for (const file of [photo.src, thumbnailSrc(photo.src)]) if (!fs.existsSync(path.join(root, file))) throw Error(`Missing photograph: ${file}`);
    return `<button type="button" class="spot-photo-thumb${index === 0 ? ' active' : ''}" data-gallery-thumb data-gallery-src="${prefix}${photo.src}" data-gallery-alt="${esc(photo.alt[lang])}" data-gallery-note="${esc(photo.caption[lang])}" data-gallery-credit="${esc(photo.credit)}" data-gallery-credit-href="${esc(photo.sourceUrl)}" data-gallery-date="" aria-label="${esc(pick(photo.caption.ja + 'を表示', 'Show ' + photo.caption.en))}" aria-pressed="${index === 0}"><img src="${prefix}${thumbnailSrc(photo.src)}" alt="" loading="eager" decoding="async"></button>`;
  }).join('\n');
  const first = detail.photos[0];
  const gallery = `<div class="spot-page-media-gallery" data-spot-media-gallery>
    <div class="spot-photo-thumbs" role="group" aria-label="${esc(pick(castle.name.ja + 'の写真を選ぶ', 'Choose a photo of ' + castle.name.en))}">${photos}</div>
    <figure class="spot-page-figure spot-page-media-gallery-active">
      <a data-gallery-image-link class="spot-page-gallery-image-link" href="${esc(first.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${pick('元の投稿を見る', 'View original post')}"><img data-gallery-image src="${prefix}${first.src}" alt="${esc(first.alt[lang])}" decoding="async" fetchpriority="high"></a>
      <figcaption aria-live="polite"><strong data-gallery-note-output>${esc(first.caption[lang])}</strong><span data-gallery-credit-output><a href="${esc(first.sourceUrl)}" target="_blank" rel="noopener">${esc(first.credit)}</a></span><span data-gallery-date-output></span><a data-gallery-source-output class="spot-page-gallery-source" href="${esc(first.sourceUrl)}" target="_blank" rel="noopener noreferrer">${pick('元の投稿を見る', 'View original post')}</a></figcaption>
    </figure>
  </div>`;
  const json = { '@context': 'https://schema.org', '@type': 'Article', headline: title, description, inLanguage: lang, url, image: `${origin}/images/og-shinkansen-window.png`, isPartOf: { '@type': 'WebSite', name: pick('新幹線の窓', 'Shinkansen Window'), url: origin } };
  return `<!doctype html>
<!-- Generated by scripts/generate-sanyo-castle-pages.mjs; edit scripts/shared/sanyo-castles.mjs. -->
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${script('app-embedded.js')}
  ${css('app-embedded.css')}
  <title>${esc(title)} | ${pick('新幹線の窓', 'Shinkansen Window')}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="ja" href="${origin}/${route}">
  <link rel="alternate" hreflang="en" href="${origin}/en/${route}">
  <link rel="alternate" hreflang="x-default" href="${origin}/en/${route}">
  ${css('style.css')}
  ${css('spot-media-gallery.css')}
  ${css('sanyo-castles.css')}
  <link rel="icon" href="${prefix}favicon.ico" sizes="any">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${pick('新幹線の窓', 'Shinkansen Window')}">
  <meta property="og:locale" content="${pick('ja_JP', 'en_US')}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${origin}/images/og-shinkansen-window.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${origin}/images/og-shinkansen-window.png">
  <script type="application/ld+json">${JSON.stringify(json)}</script>
  ${script('language-router.js')}
  ${ANALYTICS.withEmbeddedGuard}
</head>
<body class="spot-page sanyo-castle-page" data-page="spot-detail" data-spot-page-shared-context="sanyo" data-spot-page-shared-id="${castle.id}" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${prefix}" data-spot-page-shared-route="${route}">
  <div data-spot-page-shared-module="topbar"></div>
  <main class="spot-reading-layout">
    <header class="spot-page-article spot-page-hero">
      <p class="eyebrow">SHINKANSEN WINDOW VIEW</p>
      <div class="spot-page-heading-row"><h1>${en ? esc(detail.heading.en) : detail.heading.ja.map(chunk => `<span class="copy-chunk">${esc(chunk)}</span>`).join('')}</h1></div>
      <p class="spot-page-lead">${esc(castle.hook[lang])}</p>
    </header>
    <div class="spot-page-shell">
    <aside data-spot-page-shared-module="rail"></aside>
    <article class="spot-page-article">
      ${gallery}
      <dl class="spot-page-facts">
        <div><dt>${pick('エリア', 'Area')}</dt><dd>${castle.id === 'himeji-castle' ? pick('兵庫県姫路市', 'Himeji, Hyogo') : pick('岡山県岡山市', 'Okayama, Okayama')}</dd></div>
        <div><dt>${pick('席側', 'Seat side')}</dt><dd>${esc(detail.seat[lang])}<small>${esc(detail.seatNote[lang])}</small></dd></div>
        <div><dt>${pick('探す場所', 'Where to look')}</dt><dd>${esc(castle.station[lang])}</dd></div>
        <div><dt>${pick('見え方', 'Visibility')}</dt><dd>${pick('見え隠れ', 'Interrupted by buildings')}<small>${pick('列車や沿線の状況で変わります。', 'The view varies with the train and surroundings.')}</small></dd></div>
      </dl>
      <section class="spot-page-section">
        <p class="spot-reading-eyebrow">THE STORY</p>
        <h2>${heading(detail.storyHeading)}</h2>
        ${detail.story[lang].map(text => `<p>${esc(text)}</p>`).join('\n')}
      </section>
      <section class="spot-page-section">
        <p class="spot-reading-eyebrow">WHAT TO SEE</p>
        <h2>${pick('窓から探すには', 'Finding it from the window')}</h2>
        ${detail.looking[lang].map(text => `<p>${esc(text)}</p>`).join('\n')}
      </section>
      <section class="spot-page-section spot-page-phototip">
        <p class="spot-reading-eyebrow">PHOTO TIPS</p>
        <h2>${heading(detail.photoTip.heading)}</h2>
        ${detail.photoTip.paragraphs[lang].map(text => `<p>${esc(text)}</p>`).join('\n')}
      </section>
      <section class="spot-page-section spot-static-map">
        <p class="spot-reading-eyebrow">ON THE MAP</p>
        <div class="spot-static-map-head"><h2>${pick('城と線路の位置', 'The castle and the railway')}</h2></div>
        <div class="spot-map-modebar" role="group" aria-label="${pick('地図の視点', 'Map viewpoint')}">
          <button type="button" class="spot-map-mode is-active" data-mini-map-mode="spot" data-map-src="${esc(mapUrl(detail, lang))}" aria-pressed="true">${pick('城の位置', 'Castle')}</button>
          <button type="button" class="spot-map-mode" data-mini-map-mode="viewpoint" data-map-src="${esc(mapUrl(detail, lang, true))}" aria-pressed="false">${pick('新幹線の視点', 'Train viewpoint')}</button>
        </div>
        <iframe class="spot-google-map-frame" src="${esc(mapUrl(detail, lang))}" title="${esc(castle.name[lang])} ${pick('の地図', 'map')}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
        <p class="spot-mini-map-note">${pick('新幹線の視点は線路上の代表位置です。写真ごとの撮影位置や、見える範囲を示すものではありません。', 'The train viewpoint is a representative point on the railway, rather than the exact location of each photograph or a visibility boundary.')}</p>
        <a class="map-link" href="${mapExternal}" target="_blank" rel="noopener noreferrer">${pick('Googleマップで開く', 'Open in Google Maps')} ↗</a>
      </section>
      ${sharedContext.window.MADO_SPOT_PAGE_COMPONENTS.readingCollectionHTML({ readingLayout: { collection: castleCollectionFor(lang) } }, prefix, lang)}
      <section class="spot-page-section spot-reading-sources">
        <h2>${pick('参考リンク', 'Further reading')}</h2>
        <ul>${detail.references.map(ref => `<li><a href="${esc(localized(ref.url, lang))}" target="_blank" rel="noopener noreferrer">${esc(ref[lang])}</a></li>`).join('')}</ul>
      </section>
    </article>
    </div>
    <section data-spot-page-shared-module="mobile-promos"></section>
    <section data-spot-page-shared-module="showcase"></section>
    <section data-spot-page-shared-module="content-rail"></section>
  </main>
  ${footer(lang, dest)}
  <div class="spot-page-lightbox" id="spotPageLightbox" hidden><button type="button" class="spot-page-lightbox-close" aria-label="${pick('閉じる', 'Close')}">&times;</button><figure><img alt=""><figcaption></figcaption></figure></div>
  ${script('spot-page-shared-data.js')}
  ${script('spot-page-shared.js')}
  ${script('spot-media-gallery.js')}
  ${script('spot-map.js')}
</body>
</html>
`;
}
for (const castle of SANYO_DETAIL_CASTLES) for (const lang of ['ja', 'en']) {
  const dest = path.join(root, lang === 'en' ? 'en' : '', 'spots', `${castle.id}.html`);
  const html = render(castle, lang, dest);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error(`Sanyo castle page is stale: ${dest}`);
  } else fs.writeFileSync(dest, html, 'utf8');
}
console.log(`Sanyo castle pages: ${SANYO_DETAIL_CASTLES.length} Japanese/English pairs.`);
