import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { thumbnailSrc } from './shared/geo.mjs';
import { assetVersion } from './shared/asset-version.mjs';

// 「あれ、何？」特集（日本語のみ）。東海道新幹線のカードは castles.html と同じ形で、
// 分数・席側・写真は data.js から読む。ほかの路線は画像を転載せず、Xの動画だけを公式埋め込みで出す。
// 決定: .codex-local/company/departments/product/2026-09-14_arenani-feature-candidates.md
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spots = vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + ';SPOTS');
const esc = s => String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chunk = parts => parts.map(part => `<span class="copy-chunk">${part}</span>`).join('');
// 問いの末尾の「？」だけ橙にする
const question = text => esc(text).replace(/？$/, '<span class="an-q">？</span>');
const analytics = fs.readFileSync(path.join(root, 'zukan.html'), 'utf8').match(/<script>\s*\(function \(\) \{[\s\S]*?<\/script>/)?.[0] || '';
if (!analytics.includes('measurementId')) throw Error('Analytics source not found');

const pageUrl = 'https://www.michikusa-travel.com/arenani.html';
const title = 'あれ、何？｜新幹線と電車の車窓で気になった景色の正体';
const description = '東海道新幹線の727看板、空へ向かう線路、山際の白い観音。近鉄や東海道線の窓の金色の観音や朱色の門。車窓で一瞬見えて気になった景色の正体を、写真と投稿で確かめられます。';
const heroImage = 'images/20260904_mishima_catapult_1_michikusa.jpg';

// 東海道新幹線: [カードのid, 対象スポット(複数可), 写真src, 写真alt, 種別, 問い, 答え, 本文, リンク先, リンク文]
// 並びは東京からの時間順（複数スポットのカードは最小の分数で並べる）。
const shinkansen = [
 ['727-sign', ['727-board', '727-sign'], 'images/20260820_727_board_yoda_kinuta_michikusa.jpg', '田園に並ぶ727 COSMETICSと248の看板', '看板', '線路沿いに何度も出る「727」、何？', '727 COSMETICSと、きぬた歯科の248看板', '大阪の化粧品メーカーの広告で、沿線のあちこちに現れます。藤沢市付近では、すぐ隣に黄色い「248」も。こちらは西八王子の歯科医院の看板です。', '727-collection.html', '727看板コレクションを見る'],
 ['hinataoka', ['hinataoka'], 'images/20260530_hinataoka.jpg', '丘の斜面に並ぶカラフルな三角屋根の住宅', '街並み', '斜面いっぱいの三角屋根、あの街は何？', '平塚市の日向岡', '相模川を渡ってすぐ、丘の斜面に赤・青・緑の三角屋根が並ぶ住宅団地です。統一された家並みが等高線に沿って続き、一瞬で目に焼きつきます。', 'spots/hinataoka.html', '日向岡の車窓ページを見る'],
 ['gyoran-kannon', ['gyoran-kannon'], 'images/20260516_gyoran_kannon_michikusa.jpg', '山際に立つ白い魚籃観音像', '像', '小田原を過ぎて、山際に白い像。あれは何？', '東善院の魚籃観音像', '早川漁港のそばに立つ、高さ約10mの観音像です。手にした魚籠は漁を守る印。海上安全と大漁を願って1982年に建てられました。', 'spots/gyoran-kannon.html', '魚籃観音像の車窓ページを見る'],
 ['mishima-catapult', ['mishima-catapult'], 'images/20260904_mishima_catapult_1_michikusa.jpg', '空へ上っていくように見える三島車両所の着発線', '線路', '空へ駆け上がる線路。あれは何？', '三島車両所の着発線（通称カタパルト）', 'ロケットの発射台ではありません。車両基地へ入る列車が向きを変えるための線路です。本線が下っていく一方で高さを保つので、空へ上っていくように見えます。', 'spots/mishima-catapult.html', '三島車両所のカタパルトの車窓ページを見る'],
 ['shizuoka-tea-fields', ['shizuoka-tea-fields'], 'images/20260530_shizuoka_tea_fields_1_michikusa.jpg', '緑の畝の間に防霜ファンが何本も立つ静岡の茶畑', '農業設備', '茶畑の中に、何本もの扇風機。何のため？', '新芽を霜から守る防霜ファン', '風が弱く晴れた春先の夜、地表付近には冷たい空気がたまります。高い位置に残る比較的暖かい空気を斜め下へ送り、茶の新芽が凍霜害を受けるのを防ぐ設備です。', 'spots/shizuoka-tea-fields.html', '静岡の茶畑と防霜ファンを見る', ['A', 'E']],
 ['toyohashi-tateiwa', ['toyohashi-tateiwa'], 'images/20260628_toyohashi_tateiwa_michikusa.jpg', '林の丘から突き出す豊橋の立岩', '岩', '林の丘から、岩壁だけが突き出している？', '豊橋市雲谷町の立岩', '浜名湖を過ぎて豊橋へ向かう途中に現れる、標高約88mの岩山です。南側が最大約30m切り立った、むき出しのチャートの岩壁です。', 'spots/toyohashi-tateiwa.html', '豊橋の立岩の車窓ページを見る'],
 ['gifu-hashima-mahalo', ['gifu-hashima-mahalo'], 'images/20260816_gifu_hashima_mahalo_1_michikusa.jpg', '岐阜羽島駅のホーム越しに見えるMaHaLoの看板', '看板', '岐阜なのに、なぜハワイ語？', '岐阜羽島のマハロ看板', 'ホームの向こうの「MaHaLo」は、羽島市に本社を置く会社が販売する海洋深層水の商品名です。海から遠い田園に突然ハワイ語が現れますが、実は販売元のお膝元です。', 'spots/gifu-hashima-mahalo.html', 'マハロ看板の車窓ページを見る'],
 ['kinshozan', ['kinshozan'], 'images/20260704_kinshozan_michikusa.jpg', '山肌が白く切り取られた金生山', '山', 'ナイフで切り落としたような山。なぜあの形？', '石灰岩を掘り続けた金生山', '大垣付近の遠くに見える、全体が石灰岩の山です。江戸時代から採掘が続き、階段状の白い山肌は、もとの形ではなく掘り出した跡です。', 'spots/kinshozan.html', '金生山の車窓ページを見る'],
 ['fujitec-big-wing', ['fujitec-big-wing'], 'images/20260712_fujitec_big_wing_michikusa.jpg', '夕暮れに立つフジテック Big Wingの研究塔', '塔', '米原の近くに、窓の少ない細長い塔？', 'フジテック Big Wingのエレベータ研究塔', '高さ170m。エレベータを実物大で試験するための塔です。低い建物の向こうに立つので、米原に近づいた目印になります。', 'spots/fujitec-big-wing.html', 'フジテック Big Wingの車窓ページを見る']
];

// ほかの路線: 画像は転載せず、投稿者の動画だけを埋め込む（URL末尾 /video/1 で動画だけの表示）。
// 会長が2026-09-16に指定した投稿。削除されても本文だけで意味が通るようにする。
const otherLines = [
 { id: 'ofuna-kannon', line: 'JR東海道線・横須賀線', area: '大船駅付近', kind: '像', q: '森から顔だけ出した、白い観音は何？', a: '大船観音寺の白衣観音', body: '大船駅に近づくと、山の木々の上に大きな白い顔が現れます。高さ25mの像は、立っているのではなく胸から上だけの姿。1960年に完成しました。', links: [['https://oofuna-kannon.or.jp/about-us/', '大船観音寺 公式サイト']], x: { handle: 'tamachan16sai', name: '上野東京ライン 高槻行き', status: '2055542554482155914', text: '🐈️タマちゃんの、世界の車窓から🐈️ 上り東海道本線の電車に乗車中、左車窓に“大船観音”が見えたら『あ～、大船駅に着くなぁ…』と実感するニャッ😻' } },
 { id: 'tire-park', line: 'JR京浜東北線', area: '川崎〜蒲田', kind: '公園', q: 'タイヤでできた怪獣がいる、あの公園は何？', a: '大田区の西六郷公園（タイヤ公園）', body: '線路沿いの住宅街に、古タイヤで作られた怪獣やロボットが立つ公園です。タイヤの遊具も多く、「タイヤ公園」の名で親しまれています。', links: [['https://www.city.ota.tokyo.jp/shisetsu/park/nishirokugou.html', '大田区 西六郷公園']], x: { handle: 'tamachan16sai', name: '上野東京ライン 高槻行き', status: '1811693998974681328', text: '🐈タマちゃんの、世界の車窓から🐈 京浜東北線の南行電車に乗車中、右車窓に“タイヤ公園”が見えたら『あ〜、蒲田に来たなぁ…』と実感するニャッ😻' } },
 { id: 'heijo-palace', line: '近鉄奈良線', area: '大和西大寺〜新大宮', kind: '史跡', q: '大きな朱色の門。電車が遺跡の中を走っている？', a: '世界遺産・平城宮跡の朱雀門と大極殿', body: '奈良行きでは右に朱雀門、左の奥に大極殿。どちらも復元された建物です。1914年に開業した線路が、のちに世界遺産となる宮跡の真ん中を横切っています。', links: [['https://www.heijo-park.jp/', '国営平城宮跡歴史公園']], x: { handle: 'fuku_musuko', name: '奈良の福', status: '1762414136460464516', text: '奈良の車窓から。#平城宮跡 #朱雀門 #近鉄' } },
 { id: 'sakakibara', line: '近鉄大阪線', area: '榊原温泉口駅付近', kind: '像', q: '三重の山あいに、金色の観音とサモトラケのニケ？', a: '寶珠山大観音寺と、ルーブル彫刻美術館', body: '近鉄特急の窓から見える金色の像は、高さ33mの純金大観音。そのそばには、ニケやミロのヴィーナスの巨大な像を屋外に置いたルーブル彫刻美術館があります。どちらも榊原温泉口駅から歩ける場所です。', links: [['https://www.daikannon.or.jp/', '寶珠山大観音寺'], ['https://www.louvre-m.com/', 'ルーブル彫刻美術館']], x: { handle: 'Haatainen', name: 'Freddie池畑【公式】', status: '1771665809015750687', text: '近鉄榊原温泉口駅から見える、今日のルーブル彫刻美術館。' } }
];

// ヒーローの4枚（左上・右上・左下・右下）。観音像は写真の右端に写るので右下に置く。
const tiles = [
 ['mishima-catapult', 'images/20260904_mishima_catapult_1_michikusa.jpg', '空へ上っていくように見える三島車両所の線路', '空へ向かう線路'],
 ['727-sign', 'images/20260820_727_board_yoda_kinuta_michikusa.jpg', '田園に並ぶ727と248の看板', '727と248'],
 ['toyohashi-tateiwa', 'images/20260628_toyohashi_tateiwa_michikusa.jpg', '林から突き出す豊橋の立岩', '林から岩壁'],
 ['gyoran-kannon', 'images/20260516_gyoran_kannon_michikusa.jpg', '山際に立つ白い魚籃観音像', '山際の白い像']
];

const spotById = id => { const s = spots.find(x => x.id === id); if (!s) throw Error('Unknown spot: ' + id); return s; };
// 写真は自前撮影（クレジット michikusa）だけを使う。スポットの主画像か掲載写真のどちらかに無ければ止める。
function ownPhoto(spotIds, src) {
 const owner = spotIds.map(spotById).find(s => s.image === src || (s.photos || []).some(p => p.src === src));
 if (!owner) throw Error('Photo is not registered on ' + spotIds.join('/') + ': ' + src);
 const credit = owner.image === src ? owner.photoCredit : owner.photos.find(p => p.src === src).credit;
 if (credit?.ja !== 'michikusa') throw Error('Only own photographs may be used: ' + src);
 if (!fs.existsSync(path.join(root, src))) throw Error('Missing photograph: ' + src);
 const thumb = thumbnailSrc(src);
 if (!fs.existsSync(path.join(root, thumb))) throw Error('Missing thumbnail: ' + thumb);
 return thumb;
}
const minutesOf = ids => Math.min(...ids.map(id => spotById(id).minutesFromTokyo));

function shinkansenCard([cardId, ids, src, alt, kind, q, a, body, link, linkText, seatOverride]) {
 const thumb = ownPhoto(ids, src);
 const list = ids.map(spotById).sort((x, y) => x.minutesFromTokyo - y.minutesFromTokyo);
 const minutes = [...new Set(list.map(s => s.minutesFromTokyo))];
 const minuteText = minutes.length > 1 ? `東京から${minutes[0]}〜${minutes[minutes.length - 1]}分` : `東京から${minutes[0]}分`;
 const sides = [...new Set(seatOverride || list.map(s => s.side))].sort();
 if (sides.some(side => side !== 'A' && side !== 'E')) throw Error('Unexpected seat side on ' + cardId);
 const seat = sides.map(side => `<span class="cs-pill ${side === 'A' ? 'cs-side-a' : 'cs-side-e'}">${side}席側</span>`).join('');
 return `    <article class="cs-spot" id="${cardId}">
      <figure class="cs-figure">
        <a href="${link}"><img src="${thumb}" alt="${esc(alt)}" width="480" height="320" loading="lazy" decoding="async"></a>
        <figcaption>写真：新幹線の窓</figcaption>
      </figure>
      <div class="cs-spot-body">
        <p class="cs-spot-meta"><span class="cs-pill">${minuteText}</span>${seat}<span class="cs-pill">${esc(kind)}</span></p>
        <h3 class="an-question">${question(q)}</h3>
        <p class="an-answer">答え<strong>${esc(a)}</strong></p>
        <p>${esc(body)}</p>
        <p class="cs-more"><a href="${link}">${esc(linkText)}</a></p>
      </div>
    </article>`;
}

function otherLineCard(c) {
 const post = `https://x.com/${c.x.handle}/status/${c.x.status}`;
 if (!/^[A-Za-z0-9_]+$/.test(c.x.handle) || !/^\d+$/.test(c.x.status)) throw Error('Malformed X post on ' + c.id);
 c.links.forEach(([href]) => { if (!/^https:\/\//.test(href)) throw Error('Official link must be https: ' + href); });
 return `    <article class="an-embed-card" id="${c.id}">
      <div>
        <div class="wm-card" data-embed="x">
          <div class="wm-x" data-placeholder="Xの動画を読み込みます">
            <template><blockquote class="twitter-tweet" data-dnt="true" data-media-max-width="560"><p lang="ja" dir="ltr">${esc(c.x.text)}</p>&mdash; @${c.x.handle} <a href="${post}/video/1">元投稿</a></blockquote></template>
          </div>
        </div>
        <p class="an-embed-by">X：${esc(c.x.name)}さん · @${c.x.handle} · <a href="${post}" target="_blank" rel="noopener noreferrer">元投稿を見る ↗</a></p>
      </div>
      <div class="cs-spot-body">
        <p class="cs-spot-meta"><span class="cs-pill an-pill-line">${esc(c.line)}</span><span class="cs-pill">${esc(c.area)}</span><span class="cs-pill">${esc(c.kind)}</span></p>
        <h3 class="an-question">${question(c.q)}</h3>
        <p class="an-answer">答え<strong>${esc(c.a)}</strong></p>
        <p>${esc(c.body)}</p>
        <p class="an-links">${c.links.map(([href, label]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join('')}</p>
      </div>
    </article>`;
}

function tile([cardId, src, alt, label]) {
 const ids = shinkansen.find(entry => entry[0] === cardId)?.[1];
 if (!ids) throw Error('Hero tile must point to a card: ' + cardId);
 ownPhoto(ids, src);
 return `        <li class="an-tile"><a href="#${cardId}"><img src="${src}" alt="${esc(alt)}" width="640" height="460"${cardId === tiles[0][0] ? ' fetchpriority="high"' : ''}><span>${esc(label)}<b>？</b></span></a></li>`;
}

function featureFooter() {
 const footer = fs.readFileSync(path.join(root, 'yakei.html'), 'utf8').match(/<footer class="footer">[\s\S]*?<\/footer>/)?.[0];
 if (!footer) throw Error('Shared footer source not found');
 return footer;
}

function render() {
 const cards = [...shinkansen].sort((x, y) => minutesOf(x[1]) - minutesOf(y[1])).map(shinkansenCard).join('\n');
 const json = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: pageUrl, inLanguage: 'ja', isPartOf: { '@type': 'WebSite', name: '新幹線の窓', url: 'https://www.michikusa-travel.com/' } };
 return `<!doctype html>
<!-- Generated by scripts/generate-arenani-page.mjs; edit the generator. -->
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="app-embedded.js?v=${assetVersion('app-embedded.js')}"></script>
  <link rel="stylesheet" href="app-embedded.css?v=${assetVersion('app-embedded.css')}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <title>${title} | 新幹線の窓</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="stylesheet" href="style.css?v=${assetVersion('style.css')}">
  <link rel="stylesheet" href="castles.css?v=${assetVersion('castles.css')}">
  <link rel="stylesheet" href="arenani.css?v=${assetVersion('arenani.css')}">
  <link rel="preload" as="image" href="${heroImage}" fetchpriority="high">
  <link rel="icon" href="favicon.ico" sizes="any">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="新幹線の窓">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://www.michikusa-travel.com/${heroImage}">
  <meta property="og:image:alt" content="空へ上っていくように見える三島車両所の線路">
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://www.michikusa-travel.com/${heroImage}">
  <meta name="twitter:image:alt" content="空へ上っていくように見える三島車両所の線路">
  <script type="application/ld+json">${JSON.stringify(json)}</script>
  <script src="language-router.js?v=${assetVersion('language-router.js')}"></script>
  ${analytics}
</head>
<body class="castles-page arenani-page spot-page spot-page-utility" data-page="arenani" data-spot-page-shared-context="utility" data-spot-page-shared-lang="ja" data-spot-page-shared-root="./" data-spot-page-shared-route="arenani.html">
  <div data-spot-page-shared-module="topbar"></div>

  <main>
    <section class="cs-hero an-hero" aria-labelledby="anTitle">
      <div class="an-stage">
      <ul class="an-tiles" aria-label="このページで答える景色">
${tiles.map(tile).join('\n')}
      </ul>
      <div class="an-plaque">
        <p class="eyebrow">WHAT WAS THAT?</p>
        <p class="an-kicker">車窓で気になった</p>
        <h1 id="anTitle"><span class="an-bracket">『</span>あれ、何<span class="an-q">？</span><span class="an-bracket">』</span></h1>
        <p class="cs-hero-lead">${chunk(['窓の外に一瞬あらわれて、', '名前も分からないまま', '通り過ぎた景色。', 'その正体を、ここで。'])}</p>
        <p class="an-cta"><a class="btn btn-primary btn-small" href="#shinkansen" data-cta-track="arenani_section_click" data-cta-id="hero_shinkansen">東海道新幹線の${shinkansen.length}枚</a><a class="btn btn-ghost btn-small" href="#other-lines" data-cta-track="arenani_section_click" data-cta-id="hero_other_lines">ほかの路線の${otherLines.length}枚</a></p>
        <p class="cs-hero-credit">写真：新幹線の窓</p>
      </div>
      </div>
    </section>

    <div class="spot-page-shell cs-shell">
      <aside data-spot-page-shared-module="rail"></aside>
      <article class="spot-page-article cs-article">

  <section class="cs-section" id="shinkansen" aria-labelledby="anShinkansenTitle">
    <div class="cs-section-head">
      <p class="eyebrow">01 / SHINKANSEN</p>
      <h2 id="anShinkansenTitle">東海道新幹線の「あれ、何？」</h2>
      <p class="cs-section-lead">${chunk(['看板、塔、岩、削れた山。', '東京からの時間順です。', '席の側と通過の目安つき。'])}</p>
    </div>
${cards}
  </section>

  <section class="cs-section" id="other-lines" aria-labelledby="anOtherTitle">
    <div class="cs-section-head">
      <p class="eyebrow">02 / OTHER LINES</p>
      <h2 id="anOtherTitle">ほかの路線の「あれ、何？」</h2>
      <p class="cs-section-lead">${chunk(['在来線や私鉄の窓にも、', '気になる景色があります。', '見かけた人の投稿と、', '公式の案内を並べました。'])}</p>
    </div>
${otherLines.map(otherLineCard).join('\n')}
  </section>

  <section class="cs-next" aria-labelledby="anNextTitle">
    <div class="cs-card">
      <h2 id="anNextTitle">次の乗車で、探してみる</h2>
      <p>東海道新幹線なら、乗る列車を選ぶと通過時刻を調べられます。見つけた景色はスタンプ帖に記録できます。</p>
      <div class="cs-card-actions"><a class="btn btn-primary" href="start.html">列車を選ぶ</a><a href="zukan.html">車窓図鑑を見る</a></div>
    </div>
  </section>

  <section class="cs-about" aria-labelledby="anAboutTitle">
    <div class="cs-note-card">
      <h2 id="anAboutTitle">掲載について</h2>
      <p>東海道新幹線の写真は、すべて新幹線の車窓から撮影したものです。</p>
      <p>ほかの路線は、画像を転載せず、投稿者の元の投稿を公式の埋め込みで表示しています。再生すると、Xから読み込みます。席の側や通過時刻は案内していません。</p>
    </div>
  </section>

      </article>
    </div>

    <section data-spot-page-shared-module="mobile-promos"></section>
    <section data-spot-page-shared-module="showcase"></section>
    <section data-spot-page-shared-module="content-rail"></section>
  </main>

  ${featureFooter()}

  <script src="spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script>
  <script src="spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script>
  <script src="window-moments.js?v=${assetVersion('window-moments.js')}"></script>
</body>
</html>
`;
}

const dest = path.join(root, 'arenani.html');
const html = render();
if (process.argv.includes('--check')) {
 if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error('What-was-that page out of date: ' + dest);
} else fs.writeFileSync(dest, html);
console.log(`What-was-that page: ${shinkansen.length} Shinkansen cards from data.js, ${otherLines.length} other-line cards with X video embeds.`);
