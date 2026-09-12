import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { thumbnailSrc } from './shared/geo.mjs';
import { assetVersion } from './shared/asset-version.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spots = vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + ';SPOTS');
const esc = s => String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Only window photographs; reference views from conventional lines are excluded.
const analytics = fs.readFileSync(path.join(root, 'zukan.html'), 'utf8').match(/<script>\s*\(function \(\) \{[\s\S]*?<\/script>/)?.[0] || '';
if (!analytics.includes('measurementId')) throw Error('Analytics source not found');
// ヒーロー背景は castles.css が参照する清洲城の写真。
const heroImage = 'images/20260704_kiyosu_castle_michikusa.jpg';
if (!fs.existsSync(path.join(root, heroImage))) throw Error('Missing hero photograph: ' + heroImage);
// group: keep = 天守を探す、ruins = 城跡を眺める。各グループの中は東京からの時間順に並べる。
const entries = [
 ['odawara-castle', 'keep', '天守', 'Keep', '駅の近くに、白い天守', 'A white keep near the station', '小田原駅付近ではA席側へ。街並みの向こうに白い天守が現れます。見える時間は短いので、駅に近づく前から窓を見ておきましょう。', 'Watch Seat A near Odawara Station. A white keep appears beyond the buildings, briefly: start watching before you reach the station.'],
 ['kakegawa', 'keep', '天守', 'Keep', '丘の上を、一瞬だけ', 'A brief glimpse on the hill', '掛川駅の前後、E席側の小高い丘に天守があります。のぞみでは一瞬。屋根の重なりを目印に探してみてください。', 'Near Kakegawa Station, look for the keep on a low hill on the Seat E side. From a Nozomi, the glimpse is brief; look for its layered roof.'],
 ['kiyosu', 'keep', '天守', 'Keep', '線路のそばの、白と朱', 'White and vermilion by the tracks', '名古屋と岐阜羽島のあいだ、E席側の線路近くに現れる清洲城。白と朱の天守、赤い大手橋が目印です。遠くの城より見つけやすく、最初の一城に。', 'Between Nagoya and Gifu-Hashima, Kiyosu Castle stands close to the Seat E side. Its white and vermilion keep and red bridge make this a good first castle to look for.'],
 ['gifu-castle', 'keep', '遠景の天守', 'Distant keep', '山頂の、小さな点を探す', 'A tiny point on the summit', '岐阜羽島と米原のあいだ、E席側の遠くに金華山。その頂にある岐阜城は、ごく小さな点のように見えます。空気が澄んだ日向きの、難しい車窓です。', 'Between Gifu-Hashima and Maibara, Mount Kinka lies far away on the Seat E side. Gifu Castle is a tiny point on its summit: a difficult view best attempted in clear air.'],
 ['hikone-castle', 'keep', '遠景の天守', 'Distant keep', '街の奥に、天守の白', 'A white keep beyond the town', '米原と京都のあいだ、街並みの奥の小さな丘を探します。天守は遠く、ごく小さく見えます。写真で丘の位置を確かめてから探すのがおすすめです。', 'Between Maibara and Kyoto, look for a small hill beyond the town. The keep is distant and very small. Use the photographs to locate the hill before trying to spot it.'],
 ['sawayama-castle', 'ruins', '城跡', 'Castle ruins', '看板から、城の山へ', 'From the sign to the castle hill', '米原と京都のあいだ、E席側に佐和山城跡の看板と山が見えます。天守は残っていません。看板を手がかりに、かつて城があった山を眺める車窓です。', 'Between Maibara and Kyoto, a sign and hill mark Sawayama Castle Ruins on the Seat E side. No keep remains; the sign helps you identify the hill where the castle stood.'],
 ['kannonji-castle', 'ruins', '城跡', 'Castle ruins', '山の稜線が、城の面影', 'The ridge is the castle view', '米原と京都のあいだにある観音寺城跡。天守を見る場所ではなく、城が広がっていた繖山の稜線を眺める場所です。E席側、安土の手前に大きな山として現れます。', 'Kannonji Castle Ruins lie between Maibara and Kyoto. This is a view of the Kinugasa ridge where the castle stood, rather than a keep. Watch the Seat E side for a large mountain just before Azuchi.']
];
const chunk = parts => parts.map(part => `<span class="copy-chunk">${part}</span>`).join('');
function featureFooter(lang) {
 const source = fs.readFileSync(path.join(root, lang === 'en' ? 'en/yakei.html' : 'yakei.html'), 'utf8');
 const footer = source.match(/<footer class="footer">[\s\S]*?<\/footer>/)?.[0];
 if (!footer) throw Error('Shared footer source not found');
 return footer;
}

function render(lang) {
 const en = lang === 'en', prefix = en ? '../' : '', local = en ? 'en/' : '', pick = (ja, enText) => en ? enText : ja;
 const pageUrl = `https://www.michikusa-travel.com/${local}castles.html`;
 // 「新幹線から見える城」系の一覧クエリは公開中の清洲城ページが8〜12位で受けている（2026-09-09 SC）。
 // 一覧の答えはこのページなので、titleは「城」表記の一覧意図に置く。城名はtitleへ入れず、
 // 「清洲城 新幹線から見える」など単体クエリ（3位台）はスポットページに残す。
 const title = pick('新幹線から見える城｜東海道新幹線の車窓で探す天守と城跡', 'Castles from the Tokaido Shinkansen | Keeps and Castle Hills');
 const description = pick('東海道新幹線から見える城を、小田原城・掛川城・清洲城・岐阜城・彦根城の5つの天守と、佐和山・観音寺の2つの城跡で紹介。どちらの席側か、どう見つけるかを車窓写真つきで。', 'Explore seven castles and castle ruins from the Tokaido Shinkansen, in route order, with window photographs, seat sides and spotting tips.');
 const heroAlt = pick('新幹線の車窓から見える清洲城', 'Kiyosu Castle from the Shinkansen window');
 const sidePhoto = (spotId, src) => {
  const spot = spots.find(s => s.id === spotId);
  const photo = (spot.photos || []).find(p => p.src === src);
  if (!photo) throw Error('Missing photograph: ' + src);
  const thumb = thumbnailSrc(photo.src);
  if (!fs.existsSync(path.join(root, thumb))) throw Error('Missing thumbnail: ' + thumb);
  return { thumb, alt: photo.alt[lang] || photo.alt.ja };
 };
 const atami = sidePhoto('odawara', 'images/20260712_atami_castle_michikusa.jpg');
 const nagoya = sidePhoto('nagoya-station-skyline', 'images/20260530_nagoya_station_3_michikusa.jpg');
 const card = ([id, , kind, kindEn, hook, hookEn, body, bodyEn]) => {
  const s = spots.find(s => s.id === id); if (!s) throw Error(id);
  const photo = s.photos.find(p => p.role !== 'reference' && p.timeOfDay !== 'night' && p.credit?.ja === 'michikusa') || s.photos.find(p => p.role !== 'reference' && p.timeOfDay !== 'night');
  const src = thumbnailSrc(photo.src); if (!fs.existsSync(path.join(root, src))) throw Error(src);
  const ownPhoto = photo.credit?.ja === 'michikusa';
  const creditText = ownPhoto ? pick('新幹線の窓', 'Shinkansen Window') : esc(photo.credit[lang] || photo.credit.ja);
  const credit = photo.sourceUrl && !ownPhoto ? `<a href="${esc(photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">${creditText}</a>` : creditText;
  // 席側の留保は台帳の confidence と揃える（観音寺は2026-09-12にE席で確定。残るは彦根の案内文）。
  const seat = `<span class="cs-pill ${s.side === 'A' ? 'cs-side-a' : 'cs-side-e'}">${id === 'hikone-castle' ? pick('E席側（案内を確認中）', 'Seat E side (guidance under review)') : pick(`${s.side}席側`, `Seat ${s.side} side`)}</span>`;
  const href = `${prefix}${local}spots/${id}.html`;
  return `    <article class="cs-spot" id="${id}">
      <figure class="cs-figure">
        <a href="${href}"><img src="${prefix}${src}" alt="${esc(photo.alt[lang] || photo.alt.ja)}" width="480" height="320" loading="lazy" decoding="async"></a>
        <figcaption>${pick('写真：', 'Photo: ')}${credit}</figcaption>
      </figure>
      <div class="cs-spot-body">
        <p class="cs-spot-meta"><span class="cs-pill">${pick(`東京から${s.minutesFromTokyo}分`, `${s.minutesFromTokyo} min from Tokyo`)}</span>${seat}<span class="cs-pill">${pick(kind, kindEn)}</span></p>
        <h3>${esc(s[lang].name)}</h3>
        <p class="cs-spot-lead">${pick(hook, hookEn)}</p>
        <p>${pick(body, bodyEn)}</p>
        <p class="cs-more"><a href="${href}">${pick(`${esc(s.ja.name)}の車窓ページを見る`, `Open the ${esc(s.en.name)} window guide`)}</a></p>
      </div>
    </article>`;
 };
 const group = key => entries.filter(entry => entry[1] === key).sort((a, b) => spots.find(s => s.id === a[0]).minutesFromTokyo - spots.find(s => s.id === b[0]).minutesFromTokyo).map(card).join('\n');
 const json = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: pageUrl, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: pick('新幹線の窓', 'Shinkansen Window'), url: 'https://www.michikusa-travel.com/' }, mainEntity: { '@type': 'ItemList', itemListElement: entries.map(([id], i) => ({ '@type': 'ListItem', position: i + 1, url: `https://www.michikusa-travel.com/${local}spots/${id}.html` })) } };
 return `<!doctype html>
<!-- Generated by scripts/generate-castle-page.mjs; edit the generator. -->
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
  <link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/castles.html">
  <link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/castles.html">
  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/castles.html">
  <link rel="stylesheet" href="${prefix}style.css?v=${assetVersion('style.css')}">
  <link rel="stylesheet" href="${prefix}castles.css?v=${assetVersion('castles.css')}">
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
<body class="castles-page spot-page spot-page-utility" data-page="castles" data-spot-page-shared-context="utility" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${en ? '../' : './'}" data-spot-page-shared-route="castles.html">
  <div data-spot-page-shared-module="topbar"></div>

  <main>
    <section class="cs-hero" aria-labelledby="csTitle">
      <div class="cs-hero-inner">
        <p class="eyebrow">CASTLES</p>
        <h1 id="csTitle">${pick(chunk(['新幹線から', '見える城']), 'Castles from the Shinkansen')}</h1>
        <p class="cs-hero-lead">${pick(chunk(['線路のすぐそばにも。', '遠くの山の上にも。', '天守を探す5つの城と、', '山からたどる2つの城跡。', '東京から新大阪へ、', '窓の外の城めぐり。']), 'Beside the tracks. On a distant summit. Five castles with keeps and two castle hills, from Tokyo toward Shin-Osaka.')}</p>
        <p class="cs-hero-stat">${pick('天守5 ／ 城跡2 ／ 小田原城だけA席側', '5 keeps · 2 castle hills · Odawara is the only one on the A side')}</p>
        <p class="cs-hero-credit">${pick('写真：新幹線の窓（清洲城）', 'Photo: Shinkansen Window (Kiyosu Castle)')}</p>
      </div>
    </section>

    <div class="spot-page-shell cs-shell">
      <aside data-spot-page-shared-module="rail"></aside>
      <article class="spot-page-article cs-article">

  <section class="cs-tips" aria-labelledby="csTipsTitle">
    <div class="cs-section-head">
      <p class="eyebrow">HOW TO LOOK</p>
      <h2 id="csTipsTitle">${pick('城を見つけるコツ', 'How to find them')}</h2>
    </div>
    <ul class="cs-tip-list">
      <li><strong>${pick('小田原城はA席側、ほかの多くはE席側', 'Seat A for Odawara, Seat E for most others')}</strong>${pick('普通車の席記号で案内しています。東京行きでは現れる順番が逆になりますが、A席・E席の側は変わりません。', 'Seat letters refer to ordinary cars. Toward Tokyo the order reverses, but the seat side for each castle stays the same.')}</li>
      <li><strong>${pick('近い城から、遠い城へ', 'Start close, then go distant')}</strong>${pick('清洲城は線路のすぐそばで見つけやすい一城目。岐阜城と彦根城は遠景で、澄んだ日でも小さな点です。', 'Kiyosu stands right by the tracks and makes a good first castle. Gifu and Hikone are distant, tiny even in clear air.')}</li>
      <li><strong>${pick('城跡は、山の形を見る', 'For ruins, watch the hill')}</strong>${pick('佐和山城跡と観音寺城跡には天守がありません。城があった山や稜線を眺める車窓です。', 'Sawayama and Kannonji have no keep. These views are of the hills and ridges where the castles once stood.')}</li>
    </ul>
  </section>

  <section class="cs-section" id="castles" aria-labelledby="csKeepsTitle">
    <div class="cs-section-head">
      <p class="eyebrow">KEEPS</p>
      <h2 id="csKeepsTitle">${pick('天守を探す — 5つの城', 'Look for the keep — five castles')}</h2>
      <p class="cs-section-lead">${pick(chunk(['線路沿いの天守から、', '山頂の小さな点まで。', '東京からの時間順です。']), 'From a keep beside the tracks to a tiny point on a summit, in order from Tokyo.')}</p>
    </div>
${group('keep')}
  </section>

  <section class="cs-section" id="ruins" aria-labelledby="csRuinsTitle">
    <div class="cs-section-head">
      <p class="eyebrow">CASTLE HILLS</p>
      <h2 id="csRuinsTitle">${pick('山からたどる — 2つの城跡', 'Trace the hill — two castle ruins')}</h2>
      <p class="cs-section-lead">${pick(chunk(['建物は残っていなくても、', '城のあった山は車窓に残っています。']), 'The buildings are gone, but the hills where the castles stood still pass the window.')}</p>
    </div>
${group('ruins')}
  </section>

  <section class="cs-atami" aria-labelledby="csAtamiTitle">
    <div class="cs-note-card">
      <p class="eyebrow">${pick('もうひとつの城の姿', 'ANOTHER CASTLE-SHAPED VIEW')}</p>
      <h2 id="csAtamiTitle">${pick('熱海の丘にも、城の姿', 'A castle-shaped landmark in Atami')}</h2>
      <p>${pick('小田原〜熱海のA席側には、熱海城も見えます。歴史的な城郭ではなく、1959年に建てられた観光施設。海と山を眺める途中で、白い建物を探してみてください。', 'On the Seat A side between Odawara and Atami, look for Atami Castle. It is a tourist attraction built in 1959, rather than a historic fortress. Look for its white silhouette among the sea and hills.')}</p>
      <figure class="cs-note-figure">
        <img src="${prefix}${atami.thumb}" alt="${esc(atami.alt)}" width="480" height="320" loading="lazy" decoding="async">
        <figcaption>${pick('熱海の斜面に立つ熱海城 / 写真：新幹線の窓', 'Atami Castle on the hillside / Photo: Shinkansen Window')}</figcaption>
      </figure>
      <p><a href="${prefix}${local}spots/odawara.html">${pick('熱海と相模湾の車窓ページを見る', 'See the Atami and Sagami Bay window guide')}</a></p>
    </div>
  </section>

  <section class="cs-nagoya" aria-labelledby="csNagoyaTitle">
    <div class="cs-note-card">
      <p class="eyebrow">${pick('見えなくなった城', 'A CASTLE YOU CAN NO LONGER SEE')}</p>
      <h2 id="csNagoyaTitle">${pick('名古屋城は、いまは見えない', 'Nagoya Castle is no longer visible')}</h2>
      <p>${pick('名古屋駅の前後、E席側の建物の合間に、かつては名古屋城の天守が見えていました。新幹線から城を探し続けている「なごやんの旅日記」は、下り列車が名古屋駅を出てすぐ、ノリタケの森のあたりで直線距離およそ2.1km、見えるのは1秒に満たないと書いています。', 'Nagoya Castle once appeared between the buildings on the Seat E side, around Nagoya Station. A blog that has tracked castles from the train describes it just after a westbound train leaves Nagoya, near Noritake Garden: about 2.1 km away, and visible for less than a second.')}</p>
      <p>${pick('同じ記事の追記で、名古屋駅の近くからは城を見ることができなくなったと報告されています。当サイトが2026年5月に撮った下の写真でも、手前にモールなどの建物が並び、城のあった方角は塞がれています。', 'A later note on the same article reports that the castle can no longer be seen from near Nagoya Station. In our own photograph from May 2026 below, the mall and other buildings now block the direction where it stood.')}</p>
      <figure class="cs-note-figure">
        <img src="${prefix}${nagoya.thumb}" alt="${esc(nagoya.alt)}" width="480" height="320" loading="lazy" decoding="async">
        <figcaption>${pick('名古屋駅前のE席側。モールが建つ前は、この建物の合間に名古屋城が見えていました / 写真：新幹線の窓', 'The Seat E side by Nagoya Station. Before the mall was built, Nagoya Castle could be glimpsed between these buildings / Photo: Shinkansen Window')}</figcaption>
      </figure>
      <p><a href="https://ameblo.jp/new-nagoyan/entry-12671402855.html" target="_blank" rel="noopener noreferrer">${pick('なごやんの旅日記「車窓の城⑳名古屋城」', 'The blog account of Nagoya Castle from the window (Japanese)')} ↗</a></p>
      <p><a href="${prefix}${local}spots/nagoya-station-skyline.html">${pick('名古屋駅前の車窓ページを見る', 'See the Nagoya Station skyline window guide')}</a></p>
    </div>
  </section>

  <section class="cs-next" aria-labelledby="csNextTitle">
    <div class="cs-card">
      <h2 id="csNextTitle">${pick('次の乗車で、探してみる', 'Look for them on your next ride')}</h2>
      <p>${pick('乗る列車を選ぶと、城の通過時刻を調べられます。見つけた城はスタンプ帖に記録すると「城ハンター」のメダルが育ちます。', 'Choose your train for estimated passing times. Record the castles you spot in your Window Stamps to grow the Castle Hunter medal.')}</p>
      <div class="cs-card-actions"><a class="btn btn-primary" href="${prefix}${local}start.html">${pick('列車を選ぶ', 'Choose a train')}</a><a href="${prefix}${local}journal.html">${pick('スタンプ帖を見る', 'Open Window Stamps')}</a></div>
    </div>
  </section>

  <section class="cs-about" aria-labelledby="csAboutTitle">
    <div class="cs-note-card">
      <h2 id="csAboutTitle">${pick('掲載について', 'About this page')}</h2>
      <p>${pick('写真はすべて新幹線の車窓から撮影したものです。在来線など別の場所から撮った参考写真は使っていません。', 'Every photograph here was taken from the Shinkansen window; reference views from other lines are not used.')}</p>
      <p>${pick('遠景の城は天気で見え方が大きく変わり、城跡には天守がありません。彦根城の見つけ方は、次の乗車で確認を続けています。', 'Distant castles depend heavily on visibility, and the ruins have no keep. Guidance for Hikone is still being checked on upcoming rides.')}</p>
    </div>
  </section>

      </article>
    </div>

    <section data-spot-page-shared-module="mobile-promos"></section>
    <section data-spot-page-shared-module="showcase"></section>
    <section data-spot-page-shared-module="content-rail"></section>
  </main>

  ${featureFooter(lang)}

  <script src="${prefix}spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script>
  <script src="${prefix}spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script>
</body>
</html>
`;
}
for (const lang of ['ja', 'en']) { const dest = path.join(root, lang === 'ja' ? 'castles.html' : 'en/castles.html'), html = render(lang); if (process.argv.includes('--check')) { if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error('Castle page out of date: ' + dest); } else fs.writeFileSync(dest, html); }
console.log('Castle pages: 7 existing spots in keep/ruin groups, shared utility chrome.');
