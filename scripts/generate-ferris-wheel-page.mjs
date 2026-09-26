import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetVersion } from './shared/asset-version.mjs';
import { ANALYTICS } from './shared/feature-page.mjs';
import { thumbnailSrc } from './shared/geo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spots = vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + ';SPOTS');
const hirakata = spots.find(s => s.id === 'hirakata-park-wheel');
// ヒーロー背景は ferris-wheels.css が参照する夕暮れの写真。カード内は同じスポットの夜の写真。
const heroImage = 'images/20260824_hirakata_park_wheel_michikusa.jpg';
if (hirakata.image !== heroImage || !fs.existsSync(path.join(root, heroImage))) throw Error('Hero photograph changed: ' + heroImage);
const nightPhoto = hirakata.photos.find(p => p.timeOfDay === 'night' && p.credit?.ja === 'michikusa');
if (!nightPhoto) throw Error('An owner night photograph of Hirakata is required');
// 位置は track.js の線路ポリライン（実走GPX由来）へ最寄点を落として求める。
// 通過分数・線路からの距離・席側はすべてここから計算し、手で数字を書かない。
const route = vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + ';ROUTE');
const trackContext = { window: { ROUTE: route }, ROUTE: route };
trackContext.self = trackContext.window;
vm.runInNewContext(fs.readFileSync(path.join(root, 'track.js'), 'utf8'), trackContext);
const TRACK = trackContext.window.MADO_TRACK;
if (!TRACK) throw Error('Track model not found');
const toRad = d => (d * Math.PI) / 180;
const localXY = (lat, lng, refLat) => ({ x: lng * Math.cos(toRad(refLat)) * 111.32, y: lat * 110.57 });
// 進行方向（下り）の左＝A席側（南）、右＝E席側（北）。既知スポット6件で符号を確認済み。
function trackGeometry(lat, lng) {
  const km = TRACK.projectToTrack(lat, lng).km;
  const behind = TRACK.latLngAtKm(Math.max(0, km - 0.3));
  const ahead = TRACK.latLngAtKm(km + 0.3);
  const onTrack = TRACK.latLngAtKm(km);
  const p0 = localXY(behind.lat, behind.lng, lat), p1 = localXY(ahead.lat, ahead.lng, lat), pt = localXY(lat, lng, lat);
  const cross = (p1.x - p0.x) * (pt.y - p0.y) - (p1.y - p0.y) * (pt.x - p0.x);
  return { minutes: TRACK.kmToMin(km), distanceKm: TRACK.haversineKm(lat, lng, onTrack.lat, onTrack.lng), seat: cross > 0 ? 'A' : 'E' };
}
const esc = s => String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 台帳は data.js の WHEEL_COLLECTION が正本。727看板の BOARD_COLLECTION と同じく、
// 乗車ガイドのタイムラインとこのページが同じ1件のデータを読む。
const entries = vm.runInNewContext(fs.readFileSync(path.join(root, "data.js"), "utf8") + ";WHEEL_COLLECTION").map(item => ({ ...item, seat: item.side, minutes: item.minutesFromTokyo }));
// 座標は Wikipedia 日本語版の施設座標（ひらかたパークは data.js のスポット座標）。
for (const item of entries) {
  const geo = trackGeometry(item.lat, item.lng);
  const timingSpot = item.timingSpotId ? spots.find(spot => spot.id === item.timingSpotId) : null;
  if (item.timingSpotId && !timingSpot) throw Error(`Unknown timing spot: ${item.timingSpotId}`);
  // A wheel seen together with an existing landmark shares that landmark's calibrated timing.
  const viewingMinutes = timingSpot ? timingSpot.minutesFromTokyo : item.viewpoint ? TRACK.kmToMin(TRACK.projectToTrack(item.viewpoint.lat, item.viewpoint.lng).km) : geo.minutes;
  if (geo.seat !== item.seat) throw Error(`Seat side disagrees with the track geometry: ${item.id} declared ${item.seat}, computed ${geo.seat}`);
  // 台帳の宣言値を線路投影で検算する。ひらかたパークはスポットの分数をそのまま使う。
  if (item.stampId !== "hirakata-park-wheel" && Math.round(viewingMinutes) !== item.minutes) throw Error(`Minutes disagree with the track geometry: ${item.id} declared ${item.minutes}, computed ${Math.round(viewingMinutes)}`);
  item.distanceKm = geo.distanceKm;
}
if (entries.some((item, i) => i > 0 && entries[i - 1].minutes > item.minutes)) throw Error('Wheels are not in route order');
const itemPhotos = item => [...(item.photo ? [item.photo] : []), ...(item.gallery || [])];
for (const item of entries) {
  for (const photo of itemPhotos(item)) {
    photo.thumb = thumbnailSrc(photo.src);
    if (!fs.existsSync(path.join(root, photo.src))) throw Error('Missing wheel photograph: ' + photo.src);
    if (!fs.existsSync(path.join(root, photo.thumb))) throw Error('Missing wheel thumbnail: ' + photo.thumb);
  }
}
if (new Set(entries.map(item => item.stampId)).size !== entries.length) throw Error('Duplicate wheel stamp id');
if (spots.some(s => entries.some(item => item.stampId !== 'hirakata-park-wheel' && item.stampId === s.id))) throw Error('Wheel-only stamp id collides with a spot');

const chunk = parts => parts.map(part => `<span class="copy-chunk">${part}</span>`).join('');
function featureFooter(lang) {
  const source = fs.readFileSync(path.join(root, lang === 'en' ? 'en/yakei.html' : 'yakei.html'), 'utf8');
  const footer = source.match(/<footer class="footer">[\s\S]*?<\/footer>/)?.[0];
  if (!footer) throw Error('Shared footer source not found');
  return footer;
}

function render(lang) {
  const en = lang === 'en', prefix = en ? '../' : '', local = en ? 'en/' : '';
  const pick = (ja, english) => en ? english : ja;
  const value = pair => (en ? pair.en : pair.ja);
  const officialUrl = item => en && item.id === 'osaka-wheel' ? 'https://osaka-info.jp/en/spot/osaka-wheel/' : item.official;
  const officialLabel = item => en ? (item.id === 'osaka-wheel' ? 'Official tourism information' : 'Official visitor information (Japanese)') : '施設の公式案内';
  const pageUrl = `https://www.michikusa-travel.com/${local}ferris-wheels.html`;
  // 検索の顔は一覧の意図（「新幹線から見える観覧車」）に置く。施設名はtitleへ入れず、
  // 「ひらパー 新幹線」系の単体クエリはスポットページ hirakata-park-wheel に残す。
  const title = pick(`新幹線から見える観覧車｜東海道新幹線の車窓で探す${entries.length}基`, `Ferris Wheels from the Tokaido Shinkansen | ${entries.length} Wheels to Spot from the Window`);
  const description = pick(`東海道新幹線から見える観覧車を、富士川〜新大阪の${entries.length}基で紹介。Fuji Sky View、のんほいパーク、ラグーナテンボス、ひらかたパーク、EXPOCITYなどを区間・席側・車窓の写真つきで。`, `Find ${entries.length} Ferris wheels visible from the Tokaido Shinkansen, with seat sides, route sections and window photographs, from the Fuji River to Osaka.`);
  const heroAlt = pick('夕暮れの新幹線から見えるひらかたパークの観覧車', 'Hirakata Park Ferris wheel at dusk from the Shinkansen');
  const cards = entries.map((item, i) => {
    const seatClass = item.seat === 'E' ? 'fw-side-e' : 'fw-side-a';
    const distance = item.distanceKm < 1 ? item.distanceKm.toFixed(1) : Math.round(item.distanceKm * 10) / 10;
    const meta = `<span class="fw-pill">${esc(value(item.area))}</span><span class="fw-pill fw-pill-time">${pick(`東京から約${item.minutes}分`, `about ${item.minutes} min from Tokyo`)}</span><span class="fw-pill ${seatClass}">${pick(`${item.seat}席側`, `Seat ${item.seat} side`)}</span><span class="fw-pill">${pick(`線路から約${distance}km`, `about ${distance} km from the line`)}</span>`;
    const heading = en ? esc(value(item.name)) : value(item.name).replace('名古屋港シートレインランド', chunk(['名古屋港', 'シートレインランド']));
    const hook = en ? esc(value(item.hook)) : chunk(value(item.hook).split('、').map((part, index, all) => esc(part) + (index < all.length - 1 ? '、' : '')));
    const figure = itemPhotos(item).map(photo => {
      const caption = photo.creditUrl
        ? esc(value(photo.caption)).replace(esc(value(photo.credit)), `<a href="${esc(photo.creditUrl)}" target="_blank" rel="noopener noreferrer">${esc(value(photo.credit))}</a>`)
        : esc(value(photo.caption));
      return `<figure class="fw-figure"><img src="${prefix}${photo.thumb}" alt="${esc(value(photo.alt))}" width="${photo.width || 960}" height="${photo.height || 540}" loading="lazy" decoding="async"><figcaption>${caption}</figcaption></figure>`;
    }).join('');
    const caution = item.id === 'osaka-wheel' ? `<p class="fw-caution">${pick('2026年9月10日の確認時点で、公式は営業休止を案内しています。車窓からの見え方と営業・点灯状況は別です。', 'On 10 September 2026, the official website listed a suspension of operations. Visibility from the train does not imply that the attraction or its lighting is operating.')}</p>` : '';
    const links = [
      item.source ? `<a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">${pick('車窓の記録：', 'Sighting: ')}${esc(value(item.sourceName))} ↗</a>` : `<a class="fw-more" href="${prefix}${local}spots/${item.guidePageId}.html">${pick('車窓ページを見る', 'Open the window guide')}</a>`,
      item.reference ? `<a href="${esc(item.reference)}" target="_blank" rel="noopener noreferrer">${esc(value(item.referenceName))} ↗</a>` : '',
      `<a href="https://www.google.com/maps/search/?api=1&amp;query=${item.lat},${item.lng}" target="_blank" rel="noopener noreferrer">${pick('Googleマップで位置を見る', 'Open the location in Google Maps')} ↗</a>`,
      `<a href="https://www.google.com/maps/@?api=1&amp;map_action=pano&amp;viewpoint=${item.lat},${item.lng}" target="_blank" rel="noopener noreferrer">${pick('ストリートビューで周辺を見る', 'Look around in Street View')} ↗</a>`,
      item.seatSource ? `<a href="${esc(item.seatSource)}" target="_blank" rel="noopener noreferrer">${esc(value(item.seatSourceName))} ↗</a>` : '',
      `<a href="${esc(officialUrl(item))}" target="_blank" rel="noopener noreferrer">${esc(officialLabel(item))} ↗</a>`
    ].join('');
    return `    <article class="fw-spot" id="${item.id}" data-wheel-card="${item.id}">
      <span class="fw-mark" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <div class="fw-spot-body">
        <p class="fw-spot-meta">${meta}</p>
        <h3>${heading}</h3>
        <p class="fw-spot-lead">${hook}</p>
        ${figure}<p>${esc(value(item.body))}</p>
        ${caution}<p class="fw-links">${links}</p>
        <div class="fw-spot-actions"><button type="button" class="collection-stamp-button" data-wheel-stamp="${item.id}" aria-pressed="false"><span aria-hidden="true">○</span>${pick('見つけた！', 'I spotted it')}</button><span class="fw-stamp-state" data-wheel-state="${item.id}"></span></div>
      </div>
    </article>`;
  }).join('\n');
  const total = entries.length;
  const collection = {
    lang,
    items: entries.map(item => ({ id: item.id, stampId: item.stampId })),
    stages: [
      { threshold: 1, className: 'bronze', title: pick('はじめの一輪', 'First wheel'), body: pick('最初の観覧車を記録', 'Record your first wheel') },
      { threshold: 2, className: 'bronze', title: pick('ブロンズ', 'Bronze'), body: pick('2基を記録', 'Record 2 wheels') },
      { threshold: 4, className: 'silver', title: pick('シルバー', 'Silver'), body: pick('4基を記録', 'Record 4 wheels') },
      { threshold: total, className: 'gold', title: pick('ゴールド', 'Gold'), body: pick(`全${total}基を記録`, `Record all ${total} wheels`) }
    ],
    text: {
      progress: pick('{found} / {total}基を記録', '{found} / {total} wheels recorded'),
      progressNote: pick('記録は、この端末の車窓スタンプに保存されます。', 'Records are saved as Window Stamps on this device.'),
      achieved: pick('達成', 'Earned'), notAchieved: pick('未達成', 'Not yet'),
      record: pick('見つけた！', 'I spotted it'), found: pick('記録済み', 'Recorded'),
      emptyState: pick('まだ記録していません', 'Not recorded yet'), foundState: pick('もう一度押すと取り消せます', 'Tap again to undo')
    }
  };
  const json = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, inLanguage: lang, url: pageUrl, isPartOf: { '@type': 'WebSite', name: pick('新幹線の窓', 'Shinkansen Window'), url: 'https://www.michikusa-travel.com/' }, mainEntity: { '@type': 'ItemList', itemListElement: entries.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: value(item.name), url: `${pageUrl}#${item.id}` })) } };
  return `<!doctype html>
<!-- Generated by scripts/generate-ferris-wheel-page.mjs; edit the generator. -->
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="${prefix}app-embedded.js?v=${assetVersion('app-embedded.js')}"></script>
  <link rel="stylesheet" href="${prefix}app-embedded.css?v=${assetVersion('app-embedded.css')}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <title>${title} | ${pick('新幹線の窓', 'Shinkansen Window')}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/ferris-wheels.html">
  <link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/ferris-wheels.html">
  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/ferris-wheels.html">
  <link rel="stylesheet" href="${prefix}style.css?v=${assetVersion('style.css')}">
  <link rel="stylesheet" href="${prefix}ferris-wheels.css?v=${assetVersion('ferris-wheels.css')}">
  <link rel="preload" as="image" href="${prefix}${heroImage}" fetchpriority="high">
  <link rel="icon" href="${prefix}favicon.ico" sizes="any">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${pick('新幹線の窓', 'Shinkansen Window')}">
  <meta property="og:locale" content="${pick('ja_JP', 'en_US')}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://www.michikusa-travel.com/${heroImage}">
  <meta property="og:image:alt" content="${heroAlt}">
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://www.michikusa-travel.com/${heroImage}">
  <meta name="twitter:image:alt" content="${heroAlt}">
  <script type="application/ld+json">${JSON.stringify(json)}</script>
  <script src="${prefix}language-router.js?v=${assetVersion('language-router.js')}"></script>
  ${ANALYTICS.withEmbeddedGuard}
</head>
<body class="ferris-wheels-page spot-page spot-page-utility" data-page="ferris-wheels" data-spot-page-shared-context="utility" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${en ? '../' : './'}" data-spot-page-shared-route="ferris-wheels.html">
  <div data-spot-page-shared-module="topbar"></div>

  <main>
    <section class="fw-hero" aria-labelledby="fwTitle">
      <div class="fw-hero-inner">
        <p class="eyebrow">FERRIS WHEELS</p>
        <h1 id="fwTitle">${pick(chunk(['新幹線から', '見える観覧車']), 'Ferris Wheels from the Shinkansen')}</h1>
        <p class="fw-hero-lead">${pick(chunk(['街の向こうに、', '小さな輪。', '気づくと、', '次も探したくなる。', '東海道新幹線の窓の外に見える観覧車を、', '見つけた順に集めてみてください。']), 'Little rings beyond the town. Once you spot one, you start looking for the next. Collect the wheels beyond the Tokaido Shinkansen window as you find them.')}</p>
        <p class="fw-hero-stat">${pick(`${total}基 ／ A席側${entries.filter(x => x.side === 'A').length}・E席側${entries.filter(x => x.side === 'E').length}`, `${total} wheels · ${entries.filter(x => x.side === 'A').length} on the A side, ${entries.filter(x => x.side === 'E').length} on the E side`)}</p>
        <p class="fw-hero-credit">${pick('写真：新幹線の窓（ひらかたパーク）', 'Photo: Shinkansen Window (Hirakata Park)')}</p>
      </div>
    </section>

    <div class="spot-page-shell fw-shell">
      <aside data-spot-page-shared-module="rail"></aside>
      <article class="spot-page-article fw-article">

  <section class="fw-progress-section" aria-labelledby="fwProgressTitle">
    <div class="fw-section-head">
      <p class="eyebrow">WHEEL COLLECTION</p>
      <h2 id="fwProgressTitle">${pick('観覧車コレクション', 'Ferris wheel collection')}</h2>
      <p class="fw-section-lead">${pick(chunk(['見つけた観覧車を記録すると、', '段階メダルが育ちます。']), 'Record each wheel you spot and your medal grows.')}</p>
    </div>
    <div class="fw-progress-card">
      <div id="wheelProgress" class="collection-progress" aria-live="polite"></div>
      <div id="wheelMedals" class="collection-stage-grid" aria-label="${pick('観覧車の段階メダル', 'Ferris wheel medals')}"></div>
      <p class="fw-progress-note">${pick('ひらかたパークの記録は、スタンプ帖のスタンプと共通です。', 'Hirakata Park shares its record with the stamp in your Window Stamps.')}</p>
    </div>
  </section>

  <section class="fw-section" id="collection" aria-labelledby="collection-title">
    <div class="fw-section-head">
      <p class="eyebrow">TOKYO → SHIN-OSAKA</p>
      <h2 id="collection-title">${pick('窓の外の、観覧車めぐり', 'Follow the wheels west')}</h2>
      <p class="fw-section-lead">${pick(chunk(['東京発のぞみを基準にした通過の目安と、', '線路からの距離をつけました。', '東京行きでは現れる順番が逆になりますが、', 'A席・E席の側は変わりません。', '遠くの輪は、天気や建物の重なりで見え方が変わります。']), 'Each wheel shows an estimated passing time for a Tokyo-departing Nozomi and its distance from the line. Toward Tokyo the order reverses, but the seat side stays the same. Weather and intervening buildings affect distant views.')}</p>
    </div>
${cards}
  </section>

  <section class="fw-candidate" aria-labelledby="fwCandidateTitle">
    <div class="fw-note-card">
      <p class="eyebrow">${pick('次に確かめたい輪', 'ONE TO CHECK NEXT')}</p>
      <h2 id="fwCandidateTitle">${pick('富士川SA・Fuji Sky View', 'Fuji Sky View at Fujikawa SA')}</h2>
      <p>${pick('新富士〜静岡の候補。「新幹線から見て気になっていた」という旅行記があります。車窓写真と席側を確かめてから、このコレクションに加えたい輪です。', 'A candidate between Shin-Fuji and Shizuoka. A traveller mentions noticing it from the Shinkansen. Its window view and seat side still need confirmation before it joins the collection.')}</p>
      <p><a href="https://note.com/hasiba_hn/n/n7b53a9cebd3e" target="_blank" rel="noopener noreferrer">${pick('富士川の観覧車を訪ねた旅行記', 'Read the traveller’s account (Japanese)')} ↗</a></p>
    </div>
  </section>

  <section class="fw-about" aria-labelledby="fwAboutTitle">
    <div class="fw-note-card">
      <h2 id="fwAboutTitle">${pick('掲載について', 'About this collection')}</h2>
      <p>${pick('通過の目安・席側・線路からの距離は、実走GPXから作った線路データに施設の座標を落として計算したものです。東京〜新大阪を147分とするのぞみ基準で、停車駅の多い列車や遅れがあるとずれます。', 'The estimated times, seat sides and distances are calculated by projecting each facility onto our track data, which is built from recorded GPS rides. They assume a 147-minute Nozomi between Tokyo and Shin-Osaka; trains with more stops or delays will differ.')}</p>
      <p>${pick('施設の座標はWikipedia日本語版、ひらかたパークは当サイトのスポット情報を使っています。', 'Facility coordinates come from the Japanese Wikipedia, except Hirakata Park, which uses our own spot data.')}</p>
      <p>${pick('車窓から撮れた観覧車の写真をお持ちの方は、お問い合わせからご連絡いただけると助かります。', 'If you have photographed one of these wheels from the train, we would love to hear from you.')} <a href="${prefix}${local}contact.html">${pick('お問い合わせ', 'Contact')}</a></p>
    </div>
  </section>

      </article>
    </div>

    <section data-spot-page-shared-module="mobile-promos"></section>
    <section data-spot-page-shared-module="showcase"></section>
    <section data-spot-page-shared-module="content-rail"></section>
  </main>

  ${featureFooter(lang)}

  <script>
    window.FERRIS_WHEEL_COLLECTION = ${JSON.stringify(collection)};
  </script>
  <script src="${prefix}spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script>
  <script src="${prefix}spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script>
  <script src="${prefix}ferris-wheels.js?v=${assetVersion('ferris-wheels.js')}"></script>
</body>
</html>
`;
}
for (const lang of ['ja', 'en']) {
  const dest = path.join(root, lang === 'ja' ? 'ferris-wheels.html' : 'en/ferris-wheels.html');
  const html = render(lang);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error('Ferris wheel page out of date: ' + dest);
  } else fs.writeFileSync(dest, html);
}
console.log(`Ferris wheel pages: ${entries.length} sightings with stamp medals, 1 tentative candidate, shared utility chrome.`);
