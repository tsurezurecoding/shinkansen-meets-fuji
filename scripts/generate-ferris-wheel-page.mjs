import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetVersion } from './shared/asset-version.mjs';
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
const analytics = fs.readFileSync(path.join(root, 'zukan.html'), 'utf8').match(/<script>\s*\(function \(\) \{[\s\S]*?<\/script>/)?.[0] || '';
if (!analytics.includes('measurementId')) throw Error('Analytics source not found');
const esc = s => String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const blog = 'https://cotetu.seesaa.net/article/516613293.html';
// Sightings, not new SPOTS. No timing estimates are created; only Hirakata has a spot page and a timed entry.
// stampId: ひらかたパークはスポットのスタンプを共有し、ほかは観覧車コレクション専用の記録にする。
const entries = [
  { id: 'nonhoi', stampId: 'ferris-wheel-nonhoi', lat: 34.72111, lng: 137.43194, name: ['のんほいパーク', 'Nonhoi Park'], area: ['浜松 → 豊橋', 'Hamamatsu → Toyohashi'], seat: 'A', hook: ['豊橋の手前で、ひとつ', 'A wheel before Toyohashi'], body: ['豊橋に着く手前、A席側。住宅や工場の屋根の向こうに、白い輪が立っています。曇りの日でも空を背にするので、形は見分けられます。', 'Just before Toyohashi, on the Seat A side, a white wheel stands beyond the roofs of houses and factories. It sits against the sky, so its shape reads even on a cloudy day.'], source: blog, sourceName: ['新幹線の車窓から 099', '新幹線の車窓から 099 (Japanese)'], official: 'https://www.nonhoi.jp/amusement/',
    photo: { src: 'images/20260904_nonhoi_wheel_michikusa.jpg', alt: ['新幹線のA席側から見えるのんほいパークの観覧車', 'The Nonhoi Park wheel seen from the Seat A side'], caption: ['家並みと鉄塔の向こうに立つ輪 / 写真：新幹線の窓', 'The wheel beyond houses and pylons / Photo: Shinkansen Window'] } },
  { id: 'laguna', stampId: 'ferris-wheel-laguna', lat: 34.807722, lng: 137.27583, name: ['ラグーナテンボス', 'Laguna Ten Bosch'], area: ['豊橋 → 三河安城', 'Toyohashi → Mikawa-Anjo'], seat: 'A', hook: ['海辺の街に、輪を探す', 'Look toward the coastal town'], body: ['蒲郡の海辺にあるラグーナテンボスの観覧車。A席側、集合住宅や畑の向こうに白い輪が立っています。まわりの建物より高く出るので、遠くても見分けやすい輪です。', 'The wheel at Laguna Ten Bosch stands in coastal Gamagori. On the Seat A side it rises white beyond apartment blocks and fields; it stands taller than the buildings around it, so it is easier to pick out than its distance suggests.'], source: blog, sourceName: ['新幹線の車窓から 099', '新幹線の車窓から 099 (Japanese)'], official: 'https://www.lagunatenbosch.co.jp/lagunasia/index.html',
    photo: { src: 'images/20260820_laguna_wheel_michikusa.jpg', alt: ['新幹線のA席側から見えるラグーナテンボスの観覧車', 'The Laguna Ten Bosch wheel seen from the Seat A side'], caption: ['街並みの向こうに立つ白い輪 / 写真：新幹線の窓', 'A white wheel beyond the town / Photo: Shinkansen Window'] } },
  { id: 'horiuchi', stampId: 'ferris-wheel-horiuchi', lat: 34.9288139, lng: 137.0912944, name: ['堀内公園', 'Horiuchi Park'], area: ['豊橋 → 三河安城', 'Toyohashi → Mikawa-Anjo'], seat: 'A', hook: ['公園の輪も、車窓の仲間', 'A park wheel joins the journey'], body: ['安城市の堀内公園にも観覧車があります。三河安城の手前、A席側の住宅地の奥に小さく見えます。ラグーナの輪より低く、建物に紛れやすい輪です。', 'Horiuchi Park in Anjo has a Ferris wheel too. It appears small beyond the houses on the Seat A side before Mikawa-Anjo. Lower than the Laguna wheel, it blends easily into the buildings.'], source: blog, sourceName: ['新幹線の車窓から 099', '新幹線の車窓から 099 (Japanese)'], official: 'https://www.city.anjo.aichi.jp/tanoshimu/koen/horiuchi.html',
    photo: { src: 'images/20260820_horiuchi_wheel_michikusa.jpg', alt: ['新幹線のA席側から見える堀内公園の観覧車', 'The Horiuchi Park wheel seen from the Seat A side'], caption: ['住宅地の奥に小さく見える輪 / 写真：新幹線の窓', 'A small wheel beyond the houses / Photo: Shinkansen Window'] } },
  { id: 'nagoya-port', stampId: 'ferris-wheel-nagoya-port', lat: 35.0935778, lng: 136.8782056, name: ['名古屋港シートレインランド', 'Nagoya Port Sea Train Land'], area: ['三河安城 → 名古屋', 'Mikawa-Anjo → Nagoya'], seat: 'A', hook: ['ずっと遠くに、小さな輪', 'A tiny ring in the distance'], body: ['堀川を渡るあたり、A席側のビルの隙間に、輪郭だけの小さな輪が現れます。6基でいちばん遠く、肉眼では見つけにくい対象です。上りは名古屋を出てすぐ。朝焼けや夜のライトアップの時間帯が見つけやすく、昼は逆光になりやすいと紹介されています。', 'Around the Horikawa River, a faint outline of a wheel appears between buildings on the Seat A side. It is the most distant of the six and hard to catch with the naked eye. On Tokyo-bound trains it comes just after Nagoya. Accounts suggest dawn light or the evening illumination make it easier to find, while daytime tends to be backlit.'], source: 'https://cotetu.seesaa.net/article/516568359.html', sourceName: ['新幹線の車窓から 115', '新幹線の車窓から 115 (Japanese)'], reference: 'https://ameblo.jp/new-nagoyan/entry-12811240802.html', referenceName: ['参考：なごやんの旅日記「車窓の観覧車⑥ 名古屋港シートレインランド」', 'Further reading: a blog account of this wheel from the window (Japanese)'], official: 'https://www.city.nagoya.jp/minato/miryoku/1023507/1036753/1023513.html',
    photo: { src: 'images/20250623_nagoya_port_wheel_letus10.jpg', width: 960, height: 720, alt: ['新幹線のA席側から遠くに見える名古屋港の観覧車', 'The distant Nagoya Port wheel seen from the Seat A side'], caption: ['左奥、街並みの上にかすかに見える輪 / 写真：新幹線の車窓から', 'A faint ring above the rooftops at the left / Photo: Shinkansen no Shaso kara'], credit: ['新幹線の車窓から', 'Shinkansen no Shaso kara'], creditUrl: 'https://cotetu.seesaa.net/article/516568359.html' } },
  { id: 'hirakata', stampId: 'hirakata-park-wheel', lat: hirakata.map.lat, lng: hirakata.map.lng, minutes: hirakata.minutesFromTokyo, name: ['ひらかたパーク', 'Hirakata Park'], area: ['京都 → 新大阪', 'Kyoto → Shin-Osaka'], seat: 'A', hook: ['淀川の向こうに、ひらパー', 'Across the Yodo River'], body: ['淀川の対岸に見える「スカイウォーカー」。街並みと鉄塔の中に、小さな輪がひとつ。夜は光る輪が、暗い対岸にぽつんと浮かびます。', 'Sky Walker appears across the Yodo River: a small ring among buildings and pylons. At night, the lit wheel floats alone on the dark far bank.'], official: 'https://www.hirakatapark.co.jp/attractions/skywalker/',
    photo: { src: heroImage, alt: ['夕暮れの新幹線から見えるひらかたパークの観覧車', 'The Hirakata Park wheel at dusk, seen from the Shinkansen'], caption: ['夕暮れに光りはじめたスカイウォーカー / 写真：新幹線の窓', 'Sky Walker lighting up at dusk / Photo: Shinkansen Window'] } },
  { id: 'osaka-wheel', stampId: 'ferris-wheel-osaka-wheel', lat: 34.80625, lng: 135.53475, name: ['エキスポシティの観覧車（OSAKA WHEEL）', 'OSAKA WHEEL at EXPOCITY'], area: ['京都 → 新大阪', 'Kyoto → Shin-Osaka'], seat: 'E', hook: ['最後の輪は、反対の窓に', 'One more wheel, on the other side'], body: ['万博記念公園のとなり、EXPOCITYに立つ日本一の高さの観覧車です。6基のうちこれだけがE席側。ブログ『ずっしー。』は車窓写真に矢印を添えて位置を示し、昼より夜のほうがライトアップで遠くからも見つけやすいと書いています。横から見るぶん輪は細く、建物に隠れることもあります。', 'Japan’s tallest Ferris wheel stands at EXPOCITY, next to the Expo park. It is the only one of the six on the Seat E side. The blog Zusshi marks its position with an arrow on a window photograph and notes it is easier to find lit up at night than by day. Seen edge-on the wheel looks narrow, and buildings can hide it.'], source: 'https://ameblo.jp/ginga03142008/entry-12194686170.html', sourceName: ['ずっしー。「新幹線から観覧車見えました！」', 'Zusshi, “I saw the Ferris wheel from the Shinkansen” (Japanese)'], seatSource: 'https://www.city.suita.osaka.jp/_res/projects/default_project/_page_/001/035/005/HP2/R6_07_tanpage.pdf', seatSourceName: ['席側の裏付け：市報すいた 2024年7月号・8ページ', 'Seat side confirmed by Suita City newsletter, July 2024, p. 8 (Japanese PDF)'], official: 'https://osaka-wheel.com/',
    photo: { src: 'images/20160904_osaka_wheel_zusshi.jpg', width: 800, height: 600, alt: ['矢印の先に小さく見えるエキスポシティの観覧車', 'An arrow marking the distant EXPOCITY wheel'], caption: ['矢印の先、街並みの向こうに立つ輪 / 写真：ずっしー。', 'The wheel beyond the rooftops, at the arrow / Photo: Zusshi'], credit: ['ずっしー。', 'Zusshi'], creditUrl: 'https://ameblo.jp/ginga03142008/entry-12194686170.html' } }
];
// 座標は Wikipedia 日本語版の施設座標（ひらかたパークは data.js のスポット座標）。
for (const item of entries) {
  const geo = trackGeometry(item.lat, item.lng);
  if (geo.seat !== item.seat) throw Error(`Seat side disagrees with the track geometry: ${item.id} declared ${item.seat}, computed ${geo.seat}`);
  // スポットページを持つひらかたパークは台帳の分数を正とし、ほかは計算値を使う。
  item.minutes = item.minutes ?? Math.round(geo.minutes);
  item.distanceKm = geo.distanceKm;
}
if (entries.some((item, i) => i > 0 && entries[i - 1].minutes > item.minutes)) throw Error('Wheels are not in route order');
for (const item of entries) {
  if (!item.photo) continue;
  item.photo.thumb = thumbnailSrc(item.photo.src);
  if (!fs.existsSync(path.join(root, item.photo.src))) throw Error('Missing wheel photograph: ' + item.photo.src);
  if (!fs.existsSync(path.join(root, item.photo.thumb))) throw Error('Missing wheel thumbnail: ' + item.photo.thumb);
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
  const value = pair => pair[en ? 1 : 0];
  const officialUrl = item => en && item.id === 'osaka-wheel' ? 'https://osaka-info.jp/en/spot/osaka-wheel/' : item.official;
  const officialLabel = item => en ? (item.id === 'osaka-wheel' ? 'Official tourism information' : 'Official visitor information (Japanese)') : '施設の公式案内';
  const pageUrl = `https://www.michikusa-travel.com/${local}ferris-wheels.html`;
  // 検索の顔は一覧の意図（「新幹線から見える観覧車」）に置く。施設名はtitleへ入れず、
  // 「ひらパー 新幹線」系の単体クエリはスポットページ hirakata-park-wheel に残す。
  const title = pick('新幹線から見える観覧車｜東海道新幹線の車窓で探す6基', 'Ferris Wheels from the Tokaido Shinkansen | Six Wheels to Spot from the Window');
  const description = pick('東海道新幹線から見える観覧車を、豊橋〜新大阪の6基で紹介。のんほいパーク、ラグーナテンボス、ひらかたパーク、EXPOCITYなどを区間・席側・車窓の記録つきで。見つけた観覧車は記録してメダルを集められます。', 'Find six Ferris wheels visible from the Tokaido Shinkansen, with seat sides, route sections and sighting sources, from Toyohashi to Osaka.');
  const heroAlt = pick('夕暮れの新幹線から見えるひらかたパークの観覧車', 'Hirakata Park Ferris wheel at dusk from the Shinkansen');
  const cards = entries.map((item, i) => {
    const seatClass = item.seat === 'E' ? 'fw-side-e' : 'fw-side-a';
    const distance = item.distanceKm < 1 ? item.distanceKm.toFixed(1) : Math.round(item.distanceKm * 10) / 10;
    const meta = `<span class="fw-pill">${esc(value(item.area))}</span><span class="fw-pill fw-pill-time">${pick(`東京から約${item.minutes}分`, `about ${item.minutes} min from Tokyo`)}</span><span class="fw-pill ${seatClass}">${pick(`${item.seat}席側`, `Seat ${item.seat} side`)}</span><span class="fw-pill">${pick(`線路から約${distance}km`, `about ${distance} km from the line`)}</span>`;
    const heading = en ? esc(value(item.name)) : value(item.name).replace('名古屋港シートレインランド', chunk(['名古屋港', 'シートレインランド']));
    const hook = en ? esc(value(item.hook)) : chunk(value(item.hook).split('、').map((part, index, all) => esc(part) + (index < all.length - 1 ? '、' : '')));
    const caption = item.photo ? (item.photo.creditUrl
      ? esc(value(item.photo.caption)).replace(esc(value(item.photo.credit)), `<a href="${esc(item.photo.creditUrl)}" target="_blank" rel="noopener noreferrer">${esc(value(item.photo.credit))}</a>`)
      : esc(value(item.photo.caption))) : '';
    const figure = item.photo ? `<figure class="fw-figure"><img src="${prefix}${item.photo.thumb}" alt="${esc(value(item.photo.alt))}" width="${item.photo.width || 960}" height="${item.photo.height || 540}" loading="lazy" decoding="async"><figcaption>${caption}</figcaption></figure>` : '';
    const caution = item.id === 'osaka-wheel' ? `<p class="fw-caution">${pick('2026年9月10日の確認時点で、公式は営業休止を案内しています。車窓からの見え方と営業・点灯状況は別です。', 'On 10 September 2026, the official website listed a suspension of operations. Visibility from the train does not imply that the attraction or its lighting is operating.')}</p>` : '';
    const links = [
      item.source ? `<a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">${pick('車窓の記録：', 'Sighting: ')}${esc(value(item.sourceName))} ↗</a>` : `<a class="fw-more" href="${prefix}${local}spots/hirakata-park-wheel.html">${pick('ひらかたパークの車窓ページを見る', 'Open the Hirakata Park window guide')}</a>`,
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
  ${analytics}
</head>
<body class="ferris-wheels-page spot-page spot-page-utility" data-page="ferris-wheels" data-spot-page-shared-context="utility" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${en ? '../' : './'}" data-spot-page-shared-route="ferris-wheels.html">
  <div data-spot-page-shared-module="topbar"></div>

  <main>
    <section class="fw-hero" aria-labelledby="fwTitle">
      <div class="fw-hero-inner">
        <p class="eyebrow">FERRIS WHEELS</p>
        <h1 id="fwTitle">${pick(chunk(['新幹線から', '見える観覧車']), 'Ferris Wheels from the Shinkansen')}</h1>
        <p class="fw-hero-lead">${pick(chunk(['街の向こうに、', '小さな輪。', '気づくと、', '次も探したくなる。', '東海道新幹線の窓の外に見える観覧車を、', '見つけた順に集めてみてください。']), 'Little rings beyond the town. Once you spot one, you start looking for the next. Collect the wheels beyond the Tokaido Shinkansen window as you find them.')}</p>
        <p class="fw-hero-stat">${pick(`${total}基 ／ A席側5・E席側1`, `${total} wheels · 5 on the A side, 1 on the E side`)}</p>
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
