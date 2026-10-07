import { enhanceContentHead } from './shared/content-metadata.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetVersion } from './shared/asset-version.mjs';
import { ANALYTICS } from './shared/feature-page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.michikusa-travel.com';

// 一度きりの車窓特集の日英ページを1つの雛形から出す。2026-09-22までは手書きの2ファイルで、
// 同じマークアップが両方に重複していた（FEATURE-GEN-0922）。
//
// **COPY は日英で別々に持つ。片方を訳してもう片方にしない。**
// 文章を直すときは、直す言語の側だけを直す。対で並べ直すと、次の修正で片方が訳へ戻る。
const COPY = {
 "ja": {
  "copy": "<title>一度きりの車窓｜虹・雪・富士山の笠雲とつるし雲・稲妻 | 新幹線の窓</title>",
  "copy2": "<meta name=\"description\" content=\"東海道新幹線で出会う、一度きりの車窓。富士山の笠雲・つるし雲の見分け方とできる条件を、実際の投稿とともに紹介。虹、関ケ原の雪、稲妻の動画・写真も、元の記録へのリンクとあわせて集めました。\">",
  "copy3": "<meta property=\"og:site_name\" content=\"新幹線の窓\">",
  "copy4": "<meta property=\"og:locale\" content=\"ja_JP\">",
  "copy5": "<meta property=\"og:title\" content=\"一度きりの車窓｜虹・雪・富士山の笠雲とつるし雲・稲妻\">",
  "copy6": "<meta property=\"og:description\" content=\"時刻表に載らない車窓があります。虹、雪、富士山の笠雲やつるし雲、雷。出会った人が残した記録を集めました。\">",
  "copy7": "<meta property=\"og:image:alt\" content=\"雪に覆われた田畑と集落を東海道新幹線の車窓から見る\">",
  "copy8": "<meta name=\"twitter:title\" content=\"一度きりの車窓｜虹・雪・富士山の笠雲とつるし雲・稲妻\">",
  "copy9": "<meta name=\"twitter:description\" content=\"時刻表に載らない車窓があります。虹、雪、富士山の笠雲やつるし雲、雷。出会った人が残した記録を集めました。\">",
  "copy10": "<meta name=\"twitter:image:alt\" content=\"雪に覆われた田畑と集落を東海道新幹線の車窓から見る\">",
  "copy11": ".wm-hero::before { content: \"\"; position: absolute; inset: 0; z-index: -2; background-image: url(\"images/wm-hero-snow.jpg\"); background-size: cover; background-position: center 46%; }",
  "window_moments_page": "<body class=\"window-moments-page spot-page spot-page-utility\" data-page=\"window-moments\" data-spot-page-shared-context=\"utility\" data-spot-page-shared-lang=\"ja\" data-spot-page-shared-root=\"./\" data-spot-page-shared-route=\"window-moments.html\">",
  "wmTitle": "<h1 id=\"wmTitle\">一度きりの車窓</h1>",
  "wm_hero_lead": "<p class=\"wm-hero-lead\"><span class=\"copy-chunk\">この路線の車窓は、</span><span class=\"copy-chunk\">たいてい時刻で決まります。</span><span class=\"copy-chunk\">何分に、どちら側に、何が見えるか。</span><span class=\"copy-chunk\">けれど空は、</span><span class=\"copy-chunk\">その日にしか出会えない</span><span class=\"copy-chunk\">景色をつくります。</span><span class=\"copy-chunk\">虹、関ケ原の雪、</span><span class=\"copy-chunk\">富士山の笠雲とつるし雲、</span><span class=\"copy-chunk\">そして稲妻。</span></p>",
  "btn": "<a class=\"btn btn-ghost btn-small\" href=\"#rainbow\">虹</a>",
  "btn2": "<a class=\"btn btn-ghost btn-small\" href=\"#snow\">雪景色</a>",
  "btn3": "<a class=\"btn btn-primary btn-small\" href=\"#clouds\">富士山の雲</a>",
  "btn4": "<a class=\"btn btn-ghost btn-small\" href=\"#lightning\">稲妻</a>",
  "wm_hero_credit": "<p class=\"wm-hero-credit\">写真：新幹線の窓（2022年2月5日・名古屋〜京都間）</p>",
  "wmRainbowTitle": "<h2 id=\"wmRainbowTitle\">同じ虹は、ひとつもない。</h2>",
  "copy_chunk": "<p><span class=\"copy-chunk\">場所も、雨の量も、光の角度も違う</span><span class=\"copy-chunk\">六つの車窓です。</span><span class=\"copy-chunk\">再生すると、撮影された方の</span><span class=\"copy-chunk\">元投稿から読み込みます。</span></p>",
  "wm_facade": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/JdnS3mlfXUE/oardefault.jpg')\"><button type=\"button\" aria-label=\"akkiihikingさんの虹の動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker": "<p class=\"wm-card-kicker\">YOUTUBE · 品川</p>",
  "copy12": "<h4>新幹線から虹が見えたよー！</h4>",
  "wm_card_by": "<span class=\"wm-card-by\">akkiihikingさん · 1月7日の記録</span>",
  "copy13": "<a href=\"https://www.youtube.com/shorts/JdnS3mlfXUE\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a>",
  "wm_facade2": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/dRPtWYYy6FI/oardefault.jpg')\"><button type=\"button\" aria-label=\"OS Vlog Channelさんの虹の動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "copy14": "<h4>新幹線の車窓から虹</h4>",
  "wm_card_by2": "<span class=\"wm-card-by\">OS Vlog Channelさん</span>",
  "copy15": "<a href=\"https://www.youtube.com/shorts/dRPtWYYy6FI\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a>",
  "wm_facade3": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/iAm15lFfZL4/oardefault.jpg')\"><button type=\"button\" aria-label=\"kaomaru42さんの虹の動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "copy16": "<h4>新幹線の車内で見えた虹</h4>",
  "wm_card_by3": "<span class=\"wm-card-by\">kaomaru42さん</span>",
  "copy17": "<a href=\"https://www.youtube.com/shorts/iAm15lFfZL4\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a>",
  "wm_x": "<div class=\"wm-x\" data-placeholder=\"Xの投稿を読み込みます\">",
  "copy18": "<h4>E席から見えた虹</h4>",
  "wm_card_by4": "<span class=\"wm-card-by\">iyorilirycoさん · @mwWCISYETxuycVj</span>",
  "copy19": "<a href=\"https://x.com/mwWCISYETxuycVj/status/1730771332407976439\" target=\"_blank\" rel=\"noopener noreferrer\">元投稿を見る ↗</a>",
  "wm_x2": "<div class=\"wm-x\" data-placeholder=\"Xの投稿を読み込みます\">",
  "copy20": "<h4>友人と見つけた虹</h4>",
  "wm_card_by5": "<span class=\"wm-card-by\">じゅんのこさん · @tag_jun29</span>",
  "copy21": "<a href=\"https://x.com/tag_jun29/status/1540760036657737728\" target=\"_blank\" rel=\"noopener noreferrer\">元投稿を見る ↗</a>",
  "wm_x3": "<div class=\"wm-x\" data-placeholder=\"Xの投稿を読み込みます\">",
  "twitter_tweet": "<template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-conversation=\"none\"><a href=\"https://x.com/pousanpoposan/status/1987711961338085529\">@pousanpoposan さんの虹の記録</a></blockquote></template>",
  "copy22": "<h4>東海道新幹線からの虹</h4>",
  "wm_card_by6": "<span class=\"wm-card-by\">矢吹丈さん · @pousanpoposan</span>",
  "copy23": "<a href=\"https://x.com/pousanpoposan/status/1987711961338085529\" target=\"_blank\" rel=\"noopener noreferrer\">元投稿を見る ↗</a>",
  "copy24": "<p>参考記録</p>",
  "copy25": "<li>小田原付近のこだまから、約40秒にわたって見えた虹の観察記録 — <a href=\"https://www2.hamajima.co.jp/~tenjin/ypc/ypc22z.htm\" target=\"_blank\" rel=\"noopener noreferrer\">浜島書店 YPC ↗</a></li>",
  "copy26": "<li>浮島の水田地帯で、虹の中をくぐるように走った車窓の記録 — <a href=\"https://fish-b.hatenablog.com/entry/2023/11/22/011520\" target=\"_blank\" rel=\"noopener noreferrer\">元の記事 ↗</a></li>",
  "wmSnowTitle": "<h2 id=\"wmSnowTitle\"><span class=\"copy-chunk\">いつもの関ケ原が、</span><span class=\"copy-chunk\">白く消える。</span></h2>",
  "copy_chunk2": "<p><span class=\"copy-chunk\">名古屋を出て京都へ向かう途中、</span><span class=\"copy-chunk\">窓の外だけが数分間、雪国に変わります。</span></p>",
  "copy27": "<a href=\"https://x.com/michikusatravel/status/2094050962164068637\" target=\"_blank\" rel=\"noopener noreferrer\"><img src=\"images/wm-snow-town.jpg\" width=\"1600\" height=\"1200\" loading=\"lazy\" decoding=\"async\" alt=\"強い雪が降る市街地を東海道新幹線の車窓から見る\"></a>",
  "copy28": "<a href=\"https://x.com/michikusatravel/status/2094050962164068637\" target=\"_blank\" rel=\"noopener noreferrer\"><img src=\"images/wm-snow-field.jpg\" width=\"1600\" height=\"1200\" loading=\"lazy\" decoding=\"async\" alt=\"雪に覆われた田畑と集落を東海道新幹線の車窓から見る\"></a>",
  "wm_photo_credit": "<p class=\"wm-photo-credit\">2022年2月5日 · 名古屋〜京都間（地点未特定） · 写真：新幹線の窓 — <a href=\"https://x.com/michikusatravel/status/2094050962164068637\" target=\"_blank\" rel=\"noopener noreferrer\">Xの投稿で拡大して見る ↗</a></p>",
  "copy29": "<h3>走るほど、雪の表情が変わる</h3>",
  "wm_facade4": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/rVMTB4qvMbY/oardefault.jpg')\"><button type=\"button\" aria-label=\"ファンキーOL奈々さんの雪景色の動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker2": "<p class=\"wm-card-kicker\">YOUTUBE · 2025.02.09</p>",
  "copy30": "<h4>品川から新大阪の途中で</h4>",
  "wm_card_by7": "<span class=\"wm-card-by\">ファンキーOL奈々さん</span>",
  "copy31": "<a href=\"https://www.youtube.com/shorts/rVMTB4qvMbY\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a>",
  "wm_facade5": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/C8EscSwjmEk/hqdefault.jpg')\"><button type=\"button\" aria-label=\"G3from1967さんの雪景色の動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker3": "<p class=\"wm-card-kicker\">YOUTUBE · 米原付近</p>",
  "copy32": "<h4>新幹線の車窓から雪景色</h4>",
  "wm_card_by8": "<span class=\"wm-card-by\">G3from1967さん · 2021年1月公開</span>",
  "copy33": "<a href=\"https://www.youtube.com/shorts/C8EscSwjmEk\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a>",
  "wm_x4": "<div class=\"wm-x\" data-placeholder=\"Xの投稿を読み込みます\">",
  "copy34": "<h4>伊吹山と、スプリンクラー</h4>",
  "wm_card_by9": "<span class=\"wm-card-by\">てらちゃんさん · @730AEVA</span>",
  "copy35": "<a href=\"https://x.com/730AEVA/status/1475790848160047104\" target=\"_blank\" rel=\"noopener noreferrer\">元投稿を見る ↗</a>",
  "wm_x5": "<div class=\"wm-x\" data-placeholder=\"Xの投稿を読み込みます\">",
  "twitter_tweet2": "<template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-conversation=\"none\"><a href=\"https://x.com/730AEVA/status/1475789639906897923\">てらちゃんさんの雪の車窓</a></blockquote></template>",
  "copy36": "<h4>同じ日の、ひとつ前の車窓</h4>",
  "wm_card_by10": "<span class=\"wm-card-by\">てらちゃんさん · @730AEVA</span>",
  "copy37": "<a href=\"https://x.com/730AEVA/status/1475789639906897923\" target=\"_blank\" rel=\"noopener noreferrer\">元投稿を見る ↗</a>",
  "copy38": "<p>参考記録</p>",
  "copy39": "<li>関ケ原地区のスプリンクラー散水と、降積雪時に速度を落とす理由 — <a href=\"https://company.jr-central.co.jp/sustainability/social/transport/\" target=\"_blank\" rel=\"noopener noreferrer\">JR東海：安定輸送への取り組み ↗</a></li>",
  "copy40": "<li>岐阜羽島〜米原、関ケ原の県境が雪景色になった沿線の記録 — <a href=\"https://rail.hobidas.com/todaysshot/533068/\" target=\"_blank\" rel=\"noopener noreferrer\">元の記録 ↗</a></li>",
  "wmCloudsTitle": "<h2 id=\"wmCloudsTitle\"><span class=\"copy-chunk\">富士山の笠雲、</span><span class=\"copy-chunk\">つるし雲。</span><span class=\"copy-chunk\">今日は、どんな帽子？</span></h2>",
  "copy_chunk3": "<p><span class=\"copy-chunk\">いつもの富士山が、</span><span class=\"copy-chunk\">今日は違う顔をしている。</span><span class=\"copy-chunk\">山頂だけでなく、</span><span class=\"copy-chunk\">その隣の空にも</span><span class=\"copy-chunk\">目を向けてみてください。</span></p>",
  "cloud_guide": "<div class=\"wm-cloud-guide\">\n        <h3>窓から見分ける</h3>\n        <dl class=\"wm-cloud-compare\">\n          <div><dt>笠雲：山頂の帽子</dt><dd>山頂を覆うように見える雲。頂上に触れる「接地笠」と、少し浮いた「離れ笠」があります。まず山の輪郭と雲の縁を見比べてみてください。</dd></div>\n          <div><dt>つるし雲：山の隣のレンズ</dt><dd>吊るし雲とも書きます。山から離れた空に、楕円や翼のような形で浮かぶレンズ雲の一種。山頂からの距離と形を合わせて見ます。離れ笠もあるため、離れているだけでは決められません。</dd></div>\n        </dl>\n        <details class=\"wm-cloud-details\"><summary>なぜできる？ 雨の前ぶれ？</summary>\n        <p>湿った空気が山を越えて上昇し、冷やされると雲ができます。つるし雲には、山を越える風がつくる大気の上下の波（山岳波）が主に関わります。筑波大学の3年間の観測では、笠雲とつるし雲は上空の風や湿度の分布が違うと分かりました。車窓から、その日の気象条件まで断定はできません。</p>\n        <p>雲が同じ場所に留まるように見えても、空気は流れています。笠雲は風上で生まれ、風下で消えることで形を保ちます。「笠雲が出たら雨」とも言われますが、晴れに向かう時に出ることもあり、必ず雨になる合図ではありません。</p>\n        <p>山頂から旗のようにたなびくのは「旗雲」。笠雲・つるし雲とは発生条件が異なります。ここに並べた3投稿は笠雲とつるし雲の記録です。</p>\n        </details>\n        <p class=\"wm-cloud-look\">窓からの楽しみは、雲と富士山の重なりが、列車の移動につれて変わること。<a href=\"guide.html\">富士山を見る区間と席側</a>を確かめたら、山頂と隣の空を一緒に眺めてみてください。</p>\n      </div>\n      <div class=\"wm-media-head\"><h3>新幹線から見た富士山の雲</h3><p>投稿文・動画タイトルをもとに紹介しています。</p></div>",
  "wm_x6": "<div class=\"wm-x\" data-placeholder=\"Xの投稿を読み込みます\">",
  "wm_card_kicker4": "<p class=\"wm-card-kicker\">X · 笠雲</p>",
  "copy41": "<h4>新幹線で出会った、天使の輪</h4>",
  "wm_card_by11": "<span class=\"wm-card-by\">荒木尚子さん · @arakihisako</span>",
  "copy42": "<a href=\"https://x.com/arakihisako/status/2016315688563179757\" target=\"_blank\" rel=\"noopener noreferrer\">元投稿を見る ↗</a><p class=\"wm-card-note\">笠雲として投稿された記録。山頂と雲の重なりに注目。</p>",
  "wm_facade6": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/umVREJ5cqHc/hqdefault.jpg')\"><button type=\"button\" aria-label=\"hiroeueharaさんのつるし雲の動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker5": "<p class=\"wm-card-kicker\">YOUTUBE · 吊るし雲</p>",
  "copy43": "<h4>富士山のつるし雲</h4>",
  "wm_card_by12": "<span class=\"wm-card-by\">hiroe ueharaさん · 2020年7月公開</span>",
  "copy44": "<a href=\"https://www.youtube.com/shorts/umVREJ5cqHc\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a><p class=\"wm-card-note\">つるし雲として紹介された動画。山の隣の空と雲の形を見比べて。</p>",
  "wm_facade7": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/g-XR980UakQ/hqdefault.jpg')\"><button type=\"button\" aria-label=\"こっとん健児チャンネルさんの笠雲の動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker6": "<p class=\"wm-card-kicker\">YOUTUBE · 笠雲</p>",
  "copy45": "<h4>帽子？　煙？　変わった富士山</h4>",
  "wm_card_by13": "<span class=\"wm-card-by\">こっとん健児チャンネルさん · 2020年12月公開</span>",
  "copy46": "<a href=\"https://www.youtube.com/shorts/g-XR980UakQ\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a><p class=\"wm-card-note\">笠雲として紹介された動画。列車が進む間の山と雲の重なりに注目。</p>",
  "copy47": "<p>参考記録</p>",
  "copy48": "<li>笠雲・つるし雲・旗雲の3年間の観測と発生条件 — <a href=\"https://www.ccs.tsukuba.ac.jp/release251126/\" target=\"_blank\" rel=\"noopener noreferrer\">筑波大学（2025年） ↗</a></li><li>笠雲の形が保たれるしくみと天気との関係 — <a href=\"https://www.cbr.mlit.go.jp/fujisabo/bosai/fuji_info/chisiki/b05/index.html\" target=\"_blank\" rel=\"noopener noreferrer\">国土交通省 富士砂防事務所 ↗</a></li>",
  "wmLightningTitle": "<h2 id=\"wmLightningTitle\"><span class=\"copy-chunk\">一秒だけ、</span><span class=\"copy-chunk\">空が割れる。</span></h2>",
  "copy_chunk4": "<p><span class=\"copy-chunk\">ここに集めたなかで、</span><span class=\"copy-chunk\">いちばん記録が少ないのが雷です。</span><span class=\"copy-chunk\">光る時間が短く、</span><span class=\"copy-chunk\">シャッターを押したときには、</span><span class=\"copy-chunk\">もう消えている。</span></p>",
  "wm_facade8": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/kuE7xshuBhk/maxresdefault.jpg')\"><button type=\"button\" aria-label=\"T.sound channelさんのスーパーセルの動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker7": "<p class=\"wm-card-kicker\">YOUTUBE · 2017.08.22 · のぞみ246号</p>",
  "copy49": "<h4>東海道新幹線から見るスーパーセル現象</h4>",
  "wm_card_by14": "<span class=\"wm-card-by\">T.sound channelさん · 岐阜羽島付近〜名古屋〜三河安城手前</span>",
  "copy50": "<a href=\"https://www.youtube.com/watch?v=kuE7xshuBhk\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a>",
  "wm_facade9": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/Npo6S4qsuqM/maxresdefault.jpg')\"><button type=\"button\" aria-label=\"kaomaru42さんの稲妻の動画を再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker8": "<p class=\"wm-card-kicker\">YOUTUBE · のぞみ54号 · 2024.07投稿</p>",
  "copy51": "<h4>のぞみ54号の車窓から　稲妻</h4>",
  "wm_card_by15": "<span class=\"wm-card-by\">kaomaru42さん</span>",
  "copy52": "<a href=\"https://www.youtube.com/watch?v=Npo6S4qsuqM\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a>",
  "wm_facade10": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/aDR9UCQt1T4/maxresdefault.jpg')\"><button type=\"button\" aria-label=\"kaomaru42さんの稲妻の動画をもう一本再生\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker9": "<p class=\"wm-card-kicker\">YOUTUBE · のぞみ54号 · 2024.07投稿</p>",
  "copy53": "<h4>のぞみ54号の車窓から　稲妻（もう一本）</h4>",
  "wm_card_by16": "<span class=\"wm-card-by\">kaomaru42さん</span>",
  "copy54": "<a href=\"https://www.youtube.com/watch?v=aDR9UCQt1T4\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る ↗</a>",
  "copy55": "<p>参考記録</p>",
  "copy56": "<li>上のスーパーセルと同じ場面を、投稿者が作り直した超スロー版 — <a href=\"https://www.youtube.com/watch?v=DbI4Bkvf-lY\" target=\"_blank\" rel=\"noopener noreferrer\">T.sound channel ↗</a></li>",
  "copy57": "<li>雷日数は日本海側で冬に、内陸部で夏に多い — <a href=\"https://www.jma.go.jp/jma/kishou/know/toppuu/thunder1-1.html\" target=\"_blank\" rel=\"noopener noreferrer\">気象庁：雷の観測と統計 ↗</a></li>",
  "copy58": "<li>1km四方・10分ごと更新で1時間先まで。乗る前に沿線の空を見る — <a href=\"https://www.jma.go.jp/jma/kishou/know/toppuu/thunder2-1.html\" target=\"_blank\" rel=\"noopener noreferrer\">気象庁：雷ナウキャスト ↗</a></li>",
  "wmRelatedTitle": "<h2 id=\"wmRelatedTitle\">日が決まっている車窓は、別の案内へ。</h2>",
  "wm_section_lead": "<p class=\"wm-section-lead\"><span class=\"copy-chunk\">天気ではなく、</span><span class=\"copy-chunk\">日と時刻で会いにいけるものは、</span><span class=\"copy-chunk\">こちらにまとめています。</span></p>",
  "copy59": "<img src=\"images/thumbs/hanabi-hero-pd.webp\" width=\"960\" height=\"720\" alt=\"夜空にひらく花火\" loading=\"lazy\" decoding=\"async\">",
  "wm_special_copy": "<span class=\"wm-special-copy\"><small>SUMMER · 7大会</small><h3>車窓の花火</h3><p>沿線の花火が、窓から見える夜。</p></span>",
  "copy60": "<img src=\"images/thumbs/20260629_2320_maruko_bridge_night_michikusa.webp\" width=\"960\" height=\"540\" alt=\"夜の車窓に見える丸子橋あたりの灯り\" loading=\"lazy\" decoding=\"async\">",
  "wm_special_copy2": "<span class=\"wm-special-copy\"><small>NIGHT · 11か所</small><h3>新幹線の夜景</h3><p>暗くなる区間を、出発時刻から。</p></span>",
  "copy61": "<img src=\"images/thumbs/20260816_sparkling_dreams_shizuoka_michikusa.webp\" width=\"900\" height=\"600\" alt=\"ラッピング車両が走る東海道新幹線の車窓\" loading=\"lazy\" decoding=\"async\">",
  "wm_special_copy3": "<span class=\"wm-special-copy\"><small>LIMITED · 期間限定のラッピング</small><h3>ディズニー新幹線</h3><p>すれ違えるかを、時刻から計算。</p></span>",
  "wmNoteTitle": "<h2 id=\"wmNoteTitle\">掲載について</h2>",
  "copy62": "<p>このページの動画・投稿は、当サイトが保存したものではありません。すべて X と YouTube の公式埋め込みで、再生すると撮影された方の元投稿から読み込まれます。各カードには元の投稿へのリンクを必ず置いています。</p>",
  "footer_brand": "<p class=\"footer-brand\">新幹線の窓 <span>旅の瞬間を見逃さない</span></p>",
  "copy63": "<p>虹・雪・富士山の雲・雷は、いずれも天候次第です。見えることを保証するページではありません。</p>",
  "footer_links": "<p class=\"footer-links\"><a href=\"index.html\">TOP</a> · <a href=\"guide.html\">富士山の見方</a> · <a href=\"zukan.html\">車窓図鑑</a> · <a href=\"contact.html\">お問い合わせ</a> · <a href=\"privacy.html\">プライバシーポリシー</a></p>",
  "footer_credit": "<p class=\"footer-credit\">道草 / Michikusa — 急がない旅と、偶然の発見を。</p>"
 },
 "en": {
  "copy": "<title>Weather from the Shinkansen | Rainbows, Snow, Mt. Fuji's Cap Clouds, Lightning | Shinkansen Window</title>",
  "copy2": "<meta name=\"description\" content=\"Some Tokaido Shinkansen window views cannot be timetabled: rainbows, snow over Sekigahara, the lenticular clouds Mt. Fuji makes — cap (kasagumo), Tsurushi and Hata clouds — and lightning. Videos and photos from the people who actually saw them, each linked to the original post.\">",
  "copy3": "<meta property=\"og:site_name\" content=\"Shinkansen Window\">",
  "copy4": "<meta property=\"og:locale\" content=\"en_US\">",
  "copy5": "<meta property=\"og:title\" content=\"Rainbows, Snow and Mt. Fuji's Lenticular Clouds from the Shinkansen\">",
  "copy6": "<meta property=\"og:description\" content=\"Some window views cannot be timetabled. Rainbows, snow, the lenticular clouds Mt. Fuji makes, and lightning, collected from the people who saw them.\">",
  "copy7": "<meta property=\"og:image:alt\" content=\"Snow-covered fields and a village seen from a Tokaido Shinkansen window\">",
  "copy8": "<meta name=\"twitter:title\" content=\"Rainbows, Snow and Mt. Fuji's Lenticular Clouds from the Shinkansen\">",
  "copy9": "<meta name=\"twitter:description\" content=\"Some window views cannot be timetabled. Rainbows, snow, the lenticular clouds Mt. Fuji makes, and lightning, collected from the people who saw them.\">",
  "copy10": "<meta name=\"twitter:image:alt\" content=\"Snow-covered fields and a village seen from a Tokaido Shinkansen window\">",
  "copy11": ".wm-hero::before { content: \"\"; position: absolute; inset: 0; z-index: -2; background-image: url(\"../images/wm-hero-snow.jpg\"); background-size: cover; background-position: center 46%; }",
  "window_moments_page": "<body class=\"window-moments-page spot-page spot-page-utility\" data-page=\"window-moments\" data-spot-page-shared-context=\"utility\" data-spot-page-shared-lang=\"en\" data-spot-page-shared-root=\"../\" data-spot-page-shared-route=\"window-moments.html\">",
  "wmTitle": "<h1 id=\"wmTitle\">Weather Seen from the Shinkansen</h1>",
  "wm_hero_lead": "<p class=\"wm-hero-lead\">Most of this route runs on a timetable. Which minute, which side, what appears at the window. The sky does not. What it makes, it makes only that day. Rainbows after the rain, snow over Sekigahara, the cap and lenticular clouds Mt. Fuji wears, and summer lightning.</p>",
  "btn": "<a class=\"btn btn-ghost btn-small\" href=\"#rainbow\">Rainbows</a>",
  "btn2": "<a class=\"btn btn-ghost btn-small\" href=\"#snow\">Snow</a>",
  "btn3": "<a class=\"btn btn-primary btn-small\" href=\"#clouds\">Fuji’s clouds</a>",
  "btn4": "<a class=\"btn btn-ghost btn-small\" href=\"#lightning\">Lightning</a>",
  "wm_hero_credit": "<p class=\"wm-hero-credit\">Photo: Shinkansen Window (5 February 2022, between Nagoya and Kyoto)</p>",
  "wmRainbowTitle": "<h2 id=\"wmRainbowTitle\">No two rainbows are the same.</h2>",
  "copy_chunk": "<p>Six windows, each with a different place, a different amount of rain, a different angle of light. Press play and the video loads from the original post.</p>",
  "wm_facade": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/JdnS3mlfXUE/oardefault.jpg')\"><button type=\"button\" aria-label=\"Play akkiihiking’s rainbow video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker": "<p class=\"wm-card-kicker\">YOUTUBE · SHINAGAWA</p>",
  "copy12": "<h4>A rainbow from the Shinkansen</h4>",
  "wm_card_by": "<span class=\"wm-card-by\">akkiihiking · filmed on 7 January</span>",
  "copy13": "<a href=\"https://www.youtube.com/shorts/JdnS3mlfXUE\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a>",
  "wm_facade2": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/dRPtWYYy6FI/oardefault.jpg')\"><button type=\"button\" aria-label=\"Play OS Vlog Channel’s rainbow video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "copy14": "<h4>A rainbow from the train window</h4>",
  "wm_card_by2": "<span class=\"wm-card-by\">OS Vlog Channel</span>",
  "copy15": "<a href=\"https://www.youtube.com/shorts/dRPtWYYy6FI\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a>",
  "wm_facade3": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/iAm15lFfZL4/oardefault.jpg')\"><button type=\"button\" aria-label=\"Play kaomaru42’s rainbow video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "copy16": "<h4>A rainbow seen from inside the train</h4>",
  "wm_card_by3": "<span class=\"wm-card-by\">kaomaru42</span>",
  "copy17": "<a href=\"https://www.youtube.com/shorts/iAm15lFfZL4\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a>",
  "wm_x": "<div class=\"wm-x\" data-placeholder=\"Loading the post from X\">",
  "copy18": "<h4>A rainbow from seat E</h4>",
  "wm_card_by4": "<span class=\"wm-card-by\">iyoriliryco · @mwWCISYETxuycVj</span>",
  "copy19": "<a href=\"https://x.com/mwWCISYETxuycVj/status/1730771332407976439\" target=\"_blank\" rel=\"noopener noreferrer\">See the original post ↗</a>",
  "wm_x2": "<div class=\"wm-x\" data-placeholder=\"Loading the post from X\">",
  "copy20": "<h4>A rainbow, seen with a friend</h4>",
  "wm_card_by5": "<span class=\"wm-card-by\">じゅんのこ · @tag_jun29</span>",
  "copy21": "<a href=\"https://x.com/tag_jun29/status/1540760036657737728\" target=\"_blank\" rel=\"noopener noreferrer\">See the original post ↗</a>",
  "wm_x3": "<div class=\"wm-x\" data-placeholder=\"Loading the post from X\">",
  "twitter_tweet": "<template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-conversation=\"none\"><a href=\"https://x.com/pousanpoposan/status/1987711961338085529\">A rainbow posted by @pousanpoposan</a></blockquote></template>",
  "copy22": "<h4>A rainbow from the Tokaido Shinkansen</h4>",
  "wm_card_by6": "<span class=\"wm-card-by\">矢吹丈 · @pousanpoposan</span>",
  "copy23": "<a href=\"https://x.com/pousanpoposan/status/1987711961338085529\" target=\"_blank\" rel=\"noopener noreferrer\">See the original post ↗</a>",
  "copy24": "<p>SOURCES</p>",
  "copy25": "<li>A rainbow that stayed in view for about 40 seconds from a Kodama near Odawara — <a href=\"https://www2.hamajima.co.jp/~tenjin/ypc/ypc22z.htm\" target=\"_blank\" rel=\"noopener noreferrer\">Hamajima Shoten YPC (Japanese) ↗</a></li>",
  "copy26": "<li>Riding through a rainbow over the Ukishima paddy fields — <a href=\"https://fish-b.hatenablog.com/entry/2023/11/22/011520\" target=\"_blank\" rel=\"noopener noreferrer\">the original article (Japanese) ↗</a></li>",
  "wmSnowTitle": "<h2 id=\"wmSnowTitle\">Sekigahara disappears into white.</h2>",
  "copy_chunk2": "<p>Between Nagoya and Kyoto, for a few minutes, the window turns into snow country.</p>",
  "copy27": "<a href=\"https://x.com/michikusatravel/status/2094050962164068637\" target=\"_blank\" rel=\"noopener noreferrer\"><img src=\"../images/wm-snow-town.jpg\" width=\"1600\" height=\"1200\" loading=\"lazy\" decoding=\"async\" alt=\"A town under heavy snowfall, seen from a Tokaido Shinkansen window\"></a>",
  "copy28": "<a href=\"https://x.com/michikusatravel/status/2094050962164068637\" target=\"_blank\" rel=\"noopener noreferrer\"><img src=\"../images/wm-snow-field.jpg\" width=\"1600\" height=\"1200\" loading=\"lazy\" decoding=\"async\" alt=\"Snow-covered fields and a village, seen from a Tokaido Shinkansen window\"></a>",
  "wm_photo_credit": "<p class=\"wm-photo-credit\">5 February 2022 · between Nagoya and Kyoto (exact point unknown) · Photo: Shinkansen Window — <a href=\"https://x.com/michikusatravel/status/2094050962164068637\" target=\"_blank\" rel=\"noopener noreferrer\">see them larger on X ↗</a></p>",
  "copy29": "<h3>The snow changes as you go</h3>",
  "wm_facade4": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/rVMTB4qvMbY/oardefault.jpg')\"><button type=\"button\" aria-label=\"Play ファンキーOL奈々’s snow video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker2": "<p class=\"wm-card-kicker\">YOUTUBE · 9 FEB 2025</p>",
  "copy30": "<h4>Somewhere between Shinagawa and Shin-Osaka</h4>",
  "wm_card_by7": "<span class=\"wm-card-by\">ファンキーOL奈々</span>",
  "copy31": "<a href=\"https://www.youtube.com/shorts/rVMTB4qvMbY\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a>",
  "wm_facade5": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/C8EscSwjmEk/hqdefault.jpg')\"><button type=\"button\" aria-label=\"Play G3from1967’s snow video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker3": "<p class=\"wm-card-kicker\">YOUTUBE · NEAR MAIBARA</p>",
  "copy32": "<h4>Snow from the train window</h4>",
  "wm_card_by8": "<span class=\"wm-card-by\">G3from1967 · published January 2021</span>",
  "copy33": "<a href=\"https://www.youtube.com/shorts/C8EscSwjmEk\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a>",
  "wm_x4": "<div class=\"wm-x\" data-placeholder=\"Loading the post from X\">",
  "copy34": "<h4>Mt. Ibuki, and the sprinklers</h4>",
  "wm_card_by9": "<span class=\"wm-card-by\">てらちゃん · @730AEVA</span>",
  "copy35": "<a href=\"https://x.com/730AEVA/status/1475790848160047104\" target=\"_blank\" rel=\"noopener noreferrer\">See the original post ↗</a>",
  "wm_x5": "<div class=\"wm-x\" data-placeholder=\"Loading the post from X\">",
  "twitter_tweet2": "<template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-conversation=\"none\"><a href=\"https://x.com/730AEVA/status/1475789639906897923\">A snowy window posted by @730AEVA</a></blockquote></template>",
  "copy36": "<h4>The window just before, on the same day</h4>",
  "wm_card_by10": "<span class=\"wm-card-by\">てらちゃん · @730AEVA</span>",
  "copy37": "<a href=\"https://x.com/730AEVA/status/1475789639906897923\" target=\"_blank\" rel=\"noopener noreferrer\">See the original post ↗</a>",
  "copy38": "<p>SOURCES</p>",
  "copy39": "<li>Why sprinklers spray the Sekigahara section, and why trains slow down in snow — <a href=\"https://company.jr-central.co.jp/sustainability/social/transport/\" target=\"_blank\" rel=\"noopener noreferrer\">JR Central on stable transport (Japanese) ↗</a></li>",
  "copy40": "<li>Gifu-Hashima to Maibara: the Sekigahara prefectural border under snow — <a href=\"https://rail.hobidas.com/todaysshot/533068/\" target=\"_blank\" rel=\"noopener noreferrer\">a lineside record (Japanese) ↗</a></li>",
  "wmCloudsTitle": "<h2 id=\"wmCloudsTitle\">Mt. Fuji puts on a hat you have never seen.</h2>",
  "copy_chunk3": "<p>Mt. Fuji can look different from one journey to the next. Look at the summit, then at the sky beside it: a cloud may sit like a cap, or hang apart from the mountain.</p>",
  "cloud_guide": "<div class=\"wm-cloud-guide\">\n        <h3>What to look for at the window</h3>\n        <dl class=\"wm-cloud-compare\">\n          <div><dt>Cap cloud: over the summit</dt><dd>Kasagumo may touch the summit or hover just above it. Compare the cloud’s edge with the mountain’s outline.</dd></div>\n          <div><dt>Tsurushi cloud: a lens beside the mountain</dt><dd>Tsurushigumo is a lens-shaped cloud, sometimes oval or wing-like. Look at both its shape and its position: separation alone is not enough, because a cap cloud can also hover.</dd></div>\n        </dl>\n        <details class=\"wm-cloud-details\"><summary>How do they form? Do they mean rain?</summary>\n        <p>Moist air rising over a mountain can cool into cloud. Tsurushi clouds mainly involve mountain waves: air moving up and down after crossing the mountain. Three years of observations by the University of Tsukuba found different wind and humidity profiles for cap and Tsurushi clouds.</p>\n        <p>A cap cloud can keep its shape as air flows through it, forming upwind and evaporating downwind. It does not guarantee rain. A flag-like Hata cloud has different formation conditions.</p>\n        </details>\n        <p class=\"wm-cloud-look\">From a moving train, watch how the cloud and mountain overlap. See the <a href=\"guide.html\">Fuji viewing guide</a> for the viewing section and seat side.</p>\n      </div>\n      <div class=\"wm-media-head\"><h3>Fuji clouds seen from the Shinkansen</h3><p>These records are introduced using the original post text and video titles.</p></div>",
  "wm_x6": "<div class=\"wm-x\" data-placeholder=\"Loading the post from X\">",
  "wm_card_kicker4": "<p class=\"wm-card-kicker\">X · CAP CLOUD</p>",
  "copy41": "<h4>An angel’s halo, from the Shinkansen</h4>",
  "wm_card_by11": "<span class=\"wm-card-by\">荒木尚子 · @arakihisako</span>",
  "copy42": "<a href=\"https://x.com/arakihisako/status/2016315688563179757\" target=\"_blank\" rel=\"noopener noreferrer\">See the original post ↗</a><p class=\"wm-card-note\">Posted as a cap cloud. Compare the cloud with the summit.</p>",
  "wm_facade6": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/umVREJ5cqHc/hqdefault.jpg')\"><button type=\"button\" aria-label=\"Play hiroe uehara’s lenticular cloud video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker5": "<p class=\"wm-card-kicker\">YOUTUBE · LENTICULAR CLOUD</p>",
  "copy43": "<h4>A lenticular cloud over Mt. Fuji</h4>",
  "wm_card_by12": "<span class=\"wm-card-by\">hiroe uehara · published July 2020</span>",
  "copy44": "<a href=\"https://www.youtube.com/shorts/umVREJ5cqHc\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a><p class=\"wm-card-note\">Presented as a Tsurushi cloud. Look beside the mountain and compare its shape.</p>",
  "wm_facade7": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/g-XR980UakQ/hqdefault.jpg')\"><button type=\"button\" aria-label=\"Play こっとん健児チャンネル’s cap cloud video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker6": "<p class=\"wm-card-kicker\">YOUTUBE · CAP CLOUD</p>",
  "copy45": "<h4>A hat? Smoke? Mt. Fuji, changed</h4>",
  "wm_card_by13": "<span class=\"wm-card-by\">こっとん健児チャンネル · published December 2020</span>",
  "copy46": "<a href=\"https://www.youtube.com/shorts/g-XR980UakQ\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a><p class=\"wm-card-note\">Presented as a cap cloud. Watch the overlap as the train moves.</p>",
  "copy47": "<p>SOURCES</p>",
  "copy48": "<li>Three years of cloud observations and their formation conditions — <a href=\"https://www.ccs.tsukuba.ac.jp/release251126/\" target=\"_blank\" rel=\"noopener noreferrer\">University of Tsukuba (2025, Japanese) ↗</a></li><li>Cap cloud shape and its relationship to weather — <a href=\"https://www.cbr.mlit.go.jp/fujisabo/bosai/fuji_info/chisiki/b05/index.html\" target=\"_blank\" rel=\"noopener noreferrer\">MLIT Fuji Sabo Office (Japanese) ↗</a></li>",
  "wmLightningTitle": "<h2 id=\"wmLightningTitle\">For one second, the sky splits.</h2>",
  "copy_chunk4": "<p>Lightning is the hardest of these to find a record of. It lasts so little that by the time the shutter opens, it is already gone.</p>",
  "wm_facade8": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/kuE7xshuBhk/maxresdefault.jpg')\"><button type=\"button\" aria-label=\"Play T.sound channel’s supercell video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker7": "<p class=\"wm-card-kicker\">YOUTUBE · 22 AUG 2017 · NOZOMI 246</p>",
  "copy49": "<h4>A supercell, seen from the Tokaido Shinkansen</h4>",
  "wm_card_by14": "<span class=\"wm-card-by\">T.sound channel · from near Gifu-Hashima through Nagoya to just before Mikawa-Anjo</span>",
  "copy50": "<a href=\"https://www.youtube.com/watch?v=kuE7xshuBhk\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a>",
  "wm_facade9": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/Npo6S4qsuqM/maxresdefault.jpg')\"><button type=\"button\" aria-label=\"Play kaomaru42’s lightning video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker8": "<p class=\"wm-card-kicker\">YOUTUBE · NOZOMI 54 · POSTED JULY 2024</p>",
  "copy51": "<h4>Lightning from the window of Nozomi 54</h4>",
  "wm_card_by15": "<span class=\"wm-card-by\">kaomaru42</span>",
  "copy52": "<a href=\"https://www.youtube.com/watch?v=Npo6S4qsuqM\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a>",
  "wm_facade10": "<div class=\"wm-facade\" style=\"--wm-thumb: url('https://i.ytimg.com/vi/aDR9UCQt1T4/maxresdefault.jpg')\"><button type=\"button\" aria-label=\"Play kaomaru42’s second lightning video\"><span aria-hidden=\"true\">▶</span></button></div>",
  "wm_card_kicker9": "<p class=\"wm-card-kicker\">YOUTUBE · NOZOMI 54 · POSTED JULY 2024</p>",
  "copy53": "<h4>Lightning from Nozomi 54 (second clip)</h4>",
  "wm_card_by16": "<span class=\"wm-card-by\">kaomaru42</span>",
  "copy54": "<a href=\"https://www.youtube.com/watch?v=aDR9UCQt1T4\" target=\"_blank\" rel=\"noopener noreferrer\">Watch the original ↗</a>",
  "copy55": "<p>SOURCES</p>",
  "copy56": "<li>The same supercell, re-cut in extreme slow motion by the same channel — <a href=\"https://www.youtube.com/watch?v=DbI4Bkvf-lY\" target=\"_blank\" rel=\"noopener noreferrer\">T.sound channel ↗</a></li>",
  "copy57": "<li>Thunder days peak in winter on the Sea of Japan side and in summer inland — <a href=\"https://www.jma.go.jp/jma/kishou/know/toppuu/thunder1-1.html\" target=\"_blank\" rel=\"noopener noreferrer\">JMA on thunder observation and statistics (Japanese) ↗</a></li>",
  "copy58": "<li>A 1 km grid, updated every 10 minutes, one hour ahead: check the sky over the route before you board — <a href=\"https://www.jma.go.jp/jma/kishou/know/toppuu/thunder2-1.html\" target=\"_blank\" rel=\"noopener noreferrer\">JMA Thunder Nowcast (Japanese) ↗</a></li>",
  "wmRelatedTitle": "<h2 id=\"wmRelatedTitle\">Views with a date are in other guides.</h2>",
  "wm_section_lead": "<p class=\"wm-section-lead\">These do not depend on the weather. You can plan for them by date and by time.</p>",
  "copy59": "<img src=\"../images/thumbs/hanabi-hero-pd.webp\" width=\"960\" height=\"720\" alt=\"Fireworks opening in the night sky\" loading=\"lazy\" decoding=\"async\">",
  "wm_special_copy": "<span class=\"wm-special-copy\"><small>SUMMER · 7 events</small><h3>Window fireworks</h3><p>Fireworks along the route, seen from the window.</p></span>",
  "copy60": "<img src=\"../images/thumbs/20260629_2320_maruko_bridge_night_michikusa.webp\" width=\"960\" height=\"540\" alt=\"Lights around Maruko Bridge after dark\" loading=\"lazy\" decoding=\"async\">",
  "wm_special_copy2": "<span class=\"wm-special-copy\"><small>NIGHT · 11 night scenes</small><h3>Tokaido Shinkansen at night</h3><p>See where night begins from your departure time.</p></span>",
  "copy61": "<img src=\"../images/thumbs/20260816_sparkling_dreams_shizuoka_michikusa.webp\" width=\"900\" height=\"600\" alt=\"A wrapped train on the Tokaido Shinkansen route\" loading=\"lazy\" decoding=\"async\">",
  "wm_special_copy3": "<span class=\"wm-special-copy\"><small>LIMITED · LIMITED-TIME WRAP</small><h3>Disney Shinkansen</h3><p>Check whether you can catch it from the timetable.</p></span>",
  "wmNoteTitle": "<h2 id=\"wmNoteTitle\">About the material on this page</h2>",
  "copy62": "<p>The videos and posts here are not stored by this site. They are official X and YouTube embeds, loaded from each creator’s own post when you play them. Every card carries a link back to the original.</p>",
  "footer_brand": "<p class=\"footer-brand\">Shinkansen Window <span>Catch the moment from your window</span></p>",
  "copy63": "<p>Rainbows, snow, Mt. Fuji's clouds and lightning all depend on the weather. This page cannot promise you will see them.</p>",
  "footer_links": "<p class=\"footer-links\"><a href=\"./\">Home</a> · <a href=\"guide.html\">Seeing Mt. Fuji</a> · <a href=\"zukan.html\">Window field guide</a> · <a href=\"contact.html\">Contact</a> · <a href=\"privacy.html\">Privacy</a></p>",
  "footer_credit": "<p class=\"footer-credit\">Michikusa — unhurried travel, and the things you find by chance.</p>"
 }
};

function render(lang) {
  const en = lang === 'en';
  const p = en ? '../' : '';
  const t = COPY[lang];
  const pageUrl = en ? `${site}/en/window-moments.html` : `${site}/window-moments.html`;
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="${p}app-embedded.js?v=${assetVersion('app-embedded.js')}"></script>
  <link rel="stylesheet" href="${p}app-embedded.css?v=${assetVersion('app-embedded.css')}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  ${t.copy}
  ${t.copy2}
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/window-moments.html">
  <link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/window-moments.html">
  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/window-moments.html">
  <link rel="stylesheet" href="${p}style.css?v=${assetVersion('style.css')}">
  <link rel="icon" href="${p}favicon.ico" sizes="any">
  <meta property="og:type" content="article">
  ${t.copy3}
  ${t.copy4}
  ${t.copy5}
  ${t.copy6}
  <meta property="og:image" content="https://www.michikusa-travel.com/images/wm-hero-snow.jpg">
  ${t.copy7}
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  ${t.copy8}
  ${t.copy9}
  <meta name="twitter:image" content="https://www.michikusa-travel.com/images/wm-hero-snow.jpg">
  ${t.copy10}
  <script src="${p}language-router.js?v=${assetVersion('language-router.js')}"></script>
  <link rel="stylesheet" href="${p}window-moments.css?v=${assetVersion('window-moments.css')}">
${ANALYTICS.withEmbeddedGuard}
</head>
${t.window_moments_page}
  <div data-spot-page-shared-module="topbar"></div>

  <main>
    <section class="wm-hero" aria-labelledby="wmTitle">
      <div class="wm-hero-inner">
        <p class="eyebrow">WINDOW MOMENTS</p>
        ${t.wmTitle}
        ${t.wm_hero_lead}
        <div class="wm-hero-actions">
          ${t.btn3}
          ${t.btn}
          ${t.btn2}
          ${t.btn4}
        </div>
        ${t.wm_hero_credit}
      </div>
    </section>

    <div class="spot-page-shell">
      <aside data-spot-page-shared-module="rail"></aside>
      <article class="spot-page-article">

    <section class="wm-section wm-story" data-theme="cloud" id="clouds" aria-labelledby="wmCloudsTitle">
      <div class="wm-story-head">
        <p class="wm-index">01 / CLOUDS OF FUJI</p>
        ${t.wmCloudsTitle}
        ${t.copy_chunk3}
      </div>
      ${t.cloud_guide}
      <div class="wm-x-gallery is-pair">
        <article class="wm-card" data-embed="x">
          ${t.wm_x6}
            <template><blockquote class="twitter-tweet" data-dnt="true" data-conversation="none"><p lang="ja" dir="ltr">年明けお伊勢さんに向かう新幹線で出逢った素敵な富士山🗻 #富士山 #笠雲 #天使の輪</p>&mdash; 荒木尚子 (@arakihisako) <a href="https://x.com/arakihisako/status/2016315688563179757">元投稿</a></blockquote></template>
          </div>
          <div class="wm-card-body">
            ${t.wm_card_kicker4}
            ${t.copy41}
            ${t.wm_card_by11}
            ${t.copy42}
          </div>
        </article>
        <article class="wm-card is-square" data-embed="youtube" data-video-id="umVREJ5cqHc" data-video-title="富士山のつるし雲 ～新幹線の車窓から～">
          ${t.wm_facade6}
          <div class="wm-card-body">
            ${t.wm_card_kicker5}
            ${t.copy43}
            ${t.wm_card_by12}
            ${t.copy44}
          </div>
        </article>
        <article class="wm-card" data-embed="youtube" data-video-id="g-XR980UakQ" data-video-title="変わった富士山？【笠雲】新幹線からの撮影">
          ${t.wm_facade7}
          <div class="wm-card-body">
            ${t.wm_card_kicker6}
            ${t.copy45}
            ${t.wm_card_by13}
            ${t.copy46}
          </div>
        </article>
      </div>
      <div class="wm-refs">
        ${t.copy47}
        <ul>
          ${t.copy48}
        </ul>
      </div>
    </section>

    <section class="wm-section wm-story" data-theme="rainbow" id="rainbow" aria-labelledby="wmRainbowTitle">
      <div class="wm-story-head">
        <p class="wm-index">02 / RAINBOW</p>
        ${t.wmRainbowTitle}
        ${t.copy_chunk}
      </div>
      <div class="wm-grid">
        <article class="wm-card" data-embed="youtube" data-video-id="JdnS3mlfXUE" data-video-title="新幹線から虹が見えたよー！1月7日">
          ${t.wm_facade}
          <div class="wm-card-body">
            ${t.wm_card_kicker}
            ${t.copy12}
            ${t.wm_card_by}
            ${t.copy13}
          </div>
        </article>
        <article class="wm-card" data-embed="youtube" data-video-id="dRPtWYYy6FI" data-video-title="新幹線の車窓から虹">
          ${t.wm_facade2}
          <div class="wm-card-body">
            <p class="wm-card-kicker">YOUTUBE</p>
            ${t.copy14}
            ${t.wm_card_by2}
            ${t.copy15}
          </div>
        </article>
        <article class="wm-card" data-embed="youtube" data-video-id="iAm15lFfZL4" data-video-title="虹 新幹線の車内で 2024年11月29日">
          ${t.wm_facade3}
          <div class="wm-card-body">
            <p class="wm-card-kicker">YOUTUBE · 2024.11.29</p>
            ${t.copy16}
            ${t.wm_card_by3}
            ${t.copy17}
          </div>
        </article>
      </div>
      <div class="wm-x-gallery">
        <article class="wm-card" data-embed="x">
          ${t.wm_x}
            <template><blockquote class="twitter-tweet" data-dnt="true" data-conversation="none"><p lang="ja" dir="ltr">新幹線から虹が見えた🌈いいことありそう❣️E席サイコー！</p>&mdash; iyoriliryco (@mwWCISYETxuycVj) <a href="https://x.com/mwWCISYETxuycVj/status/1730771332407976439">2023年12月2日</a></blockquote></template>
          </div>
          <div class="wm-card-body">
            <p class="wm-card-kicker">X · 2023.12.02</p>
            ${t.copy18}
            ${t.wm_card_by4}
            ${t.copy19}
          </div>
        </article>
        <article class="wm-card" data-embed="x">
          ${t.wm_x2}
            <template><blockquote class="twitter-tweet" data-dnt="true" data-conversation="none"><p lang="ja" dir="ltr">新幹線から見えた虹🌈✨ お友達と大感動でした😃</p>&mdash; じゅんのこ (@tag_jun29) <a href="https://x.com/tag_jun29/status/1540760036657737728">元投稿</a></blockquote></template>
          </div>
          <div class="wm-card-body">
            <p class="wm-card-kicker">X</p>
            ${t.copy20}
            ${t.wm_card_by5}
            ${t.copy21}
          </div>
        </article>
        <article class="wm-card" data-embed="x">
          ${t.wm_x3}
            ${t.twitter_tweet}
          </div>
          <div class="wm-card-body">
            <p class="wm-card-kicker">X · 2025.11.10</p>
            ${t.copy22}
            ${t.wm_card_by6}
            ${t.copy23}
          </div>
        </article>
      </div>
      <div class="wm-refs">
        ${t.copy24}
        <ul>
          ${t.copy25}
          ${t.copy26}
        </ul>
      </div>
    </section>

    <section class="wm-section wm-story" data-theme="snow" id="snow" aria-labelledby="wmSnowTitle">
      <div class="wm-story-head">
        <p class="wm-index">03 / SNOW</p>
        ${t.wmSnowTitle}
        ${t.copy_chunk2}
      </div>
      <div class="wm-photo-pair">
        <figure class="wm-photo">
          ${t.copy27}
        </figure>
        <figure class="wm-photo">
          ${t.copy28}
        </figure>
      </div>
      ${t.wm_photo_credit}
      <div class="wm-media-head">
        ${t.copy29}
      </div>
      <div class="wm-grid">
        <article class="wm-card" data-embed="youtube" data-video-id="rVMTB4qvMbY" data-video-title="雪景色！品川から新大阪の途中3！2025.2.9">
          ${t.wm_facade4}
          <div class="wm-card-body">
            ${t.wm_card_kicker2}
            ${t.copy30}
            ${t.wm_card_by7}
            ${t.copy31}
          </div>
        </article>
        <article class="wm-card" data-embed="youtube" data-video-id="C8EscSwjmEk" data-video-title="新幹線の車窓から雪景色（米原辺り）１">
          ${t.wm_facade5}
          <div class="wm-card-body">
            ${t.wm_card_kicker3}
            ${t.copy32}
            ${t.wm_card_by8}
            ${t.copy33}
          </div>
        </article>
      </div>
      <div class="wm-x-gallery is-pair">
        <article class="wm-card" data-embed="x">
          ${t.wm_x4}
            <template><blockquote class="twitter-tweet" data-dnt="true" data-conversation="none"><p lang="ja" dir="ltr">新幹線車窓から ④ 伊吹山等々。やっぱり凄い雪です。スプリンクラーがバシバシ当たります。</p>&mdash; てらちゃん (@730AEVA) <a href="https://x.com/730AEVA/status/1475790848160047104">2021年12月28日</a></blockquote></template>
          </div>
          <div class="wm-card-body">
            <p class="wm-card-kicker">X · 2021.12.28</p>
            ${t.copy34}
            ${t.wm_card_by9}
            ${t.copy35}
          </div>
        </article>
        <article class="wm-card" data-embed="x">
          ${t.wm_x5}
            ${t.twitter_tweet2}
          </div>
          <div class="wm-card-body">
            <p class="wm-card-kicker">X · 2021.12.28</p>
            ${t.copy36}
            ${t.wm_card_by10}
            ${t.copy37}
          </div>
        </article>
      </div>
      <div class="wm-refs">
        ${t.copy38}
        <ul>
          ${t.copy39}
          ${t.copy40}
        </ul>
      </div>
    </section>

    <section class="wm-section wm-story" data-theme="lightning" id="lightning" aria-labelledby="wmLightningTitle">
      <div class="wm-story-head">
        <p class="wm-index">04 / LIGHTNING</p>
        ${t.wmLightningTitle}
        ${t.copy_chunk4}
      </div>
      <article class="wm-card wm-feature" data-embed="youtube" data-video-id="kuE7xshuBhk" data-video-title="東海道新幹線から見るスーパーセル現象">
        ${t.wm_facade8}
        <div class="wm-card-body">
          ${t.wm_card_kicker7}
          ${t.copy49}
          ${t.wm_card_by14}
          ${t.copy50}
        </div>
      </article>
      <div class="wm-grid is-wide-cards">
        <article class="wm-card is-wide" data-embed="youtube" data-video-id="Npo6S4qsuqM" data-video-title="新幹線のぞみ54号の車窓から 稲妻">
          ${t.wm_facade9}
          <div class="wm-card-body">
            ${t.wm_card_kicker8}
            ${t.copy51}
            ${t.wm_card_by15}
            ${t.copy52}
          </div>
        </article>
        <article class="wm-card is-wide" data-embed="youtube" data-video-id="aDR9UCQt1T4" data-video-title="新幹線のぞみ54号の車窓から 稲妻">
          ${t.wm_facade10}
          <div class="wm-card-body">
            ${t.wm_card_kicker9}
            ${t.copy53}
            ${t.wm_card_by16}
            ${t.copy54}
          </div>
        </article>
      </div>
      <div class="wm-refs">
        ${t.copy55}
        <ul>
          ${t.copy56}
          ${t.copy57}
          ${t.copy58}
        </ul>
      </div>
    </section>

    <section class="wm-section" id="related" aria-labelledby="wmRelatedTitle">
      <div class="wm-section-head">
        <p class="eyebrow">ANOTHER ANGLE</p>
        ${t.wmRelatedTitle}
        ${t.wm_section_lead}
      </div>
      <div class="wm-special-grid">
        <a class="wm-special-card" href="hanabi.html">
          ${t.copy59}
          ${t.wm_special_copy}
        </a>
        <a class="wm-special-card" href="yakei.html">
          ${t.copy60}
          ${t.wm_special_copy2}
        </a>
        <a class="wm-special-card" href="sparkling-dreams.html">
          ${t.copy61}
          ${t.wm_special_copy3}
        </a>
      </div>
    </section>

    <section class="wm-section" aria-labelledby="wmNoteTitle">
      <div class="wm-note">
        ${t.wmNoteTitle}
        ${t.copy62}
      </div>
    </section>

      </article>
    </div>

    <section data-spot-page-shared-module="mobile-promos"></section>
    <section data-spot-page-shared-module="showcase"></section>
    <section data-spot-page-shared-module="content-rail"></section>
  </main>

  <footer class="footer">
    ${t.footer_brand}
    ${t.copy63}
    ${t.footer_links}
    ${t.footer_credit}
  </footer>

  <script src="${p}spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script>
  <script src="${p}spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script>
  <script src="${p}window-moments.js?v=${assetVersion('window-moments.js')}"></script>
</body>
</html>
`;
}

for (const lang of ['ja', 'en']) {
  const dest = path.join(root, lang === 'ja' ? 'window-moments.html' : 'en/window-moments.html');
  const html = enhanceContentHead(render(lang), lang === 'ja' ? 'window-moments.html' : 'en/window-moments.html', root);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error('window-moments page out of date: ' + dest);
  } else {
    fs.writeFileSync(dest, html);
  }
}
console.log('window-moments pages: ja + en from one template.');
