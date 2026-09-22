import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetVersion } from './shared/asset-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.michikusa-travel.com';

// 夜景特集の日英ページを1つの雛形から出す。2026-09-22までは手書きの2ファイルで、
// 同じマークアップが両方に重複していた（FEATURE-GEN-0922）。
//
// **COPY は日英で別々に持つ。片方を訳してもう片方にしない。**
// 文章を直すときは、直す言語の側だけを直す。対で並べ直すと、次の修正で片方が訳へ戻る。
const COPY = {
 "ja": {
  "copy": "<title>新幹線の夜景｜車窓から見えるライトアップと、暗くなる時刻 | 新幹線の窓</title>",
  "copy2": "<meta name=\"description\" content=\"東海道新幹線の夜景を、車窓から見える15か所で紹介。東京タワーと小田原城のライトアップ、清洲城・掛川城の期間限定ライトアップ、武蔵小杉・名古屋の街あかり、鳥飼車両基地まで。出発時刻を入れると、どこから暗くなるかがわかります。\">",
  "copy3": "<meta property=\"og:site_name\" content=\"新幹線の窓\">",
  "copy4": "<meta property=\"og:locale\" content=\"ja_JP\">",
  "copy5": "<meta property=\"og:title\" content=\"新幹線の夜景｜車窓から見えるライトアップと、暗くなる時刻\">",
  "copy6": "<meta property=\"og:description\" content=\"夜の車窓は鏡になる。その対処と、ライトアップ・街の光・車両基地まで。出発時刻から暗くなる区間を計算します。\">",
  "copy7": "<meta property=\"og:image:alt\" content=\"夜の新幹線から見える名古屋駅前の光\">",
  "copy8": "<meta name=\"twitter:title\" content=\"新幹線の夜景｜車窓から見えるライトアップと、暗くなる時刻\">",
  "copy9": "<meta name=\"twitter:description\" content=\"夜の車窓は鏡になる。その対処と、ライトアップ・街の光・車両基地まで。出発時刻から暗くなる区間を計算します。\">",
  "copy10": "<meta name=\"twitter:image:alt\" content=\"夜の新幹線から見える名古屋駅前の光\">\n  <script type=\"application/ld+json\">{\n  \"@context\": \"https://schema.org\",\n  \"@graph\": [\n    {\n      \"@type\": \"WebPage\",\n      \"@id\": \"https://www.michikusa-travel.com/yakei.html#webpage\",\n      \"url\": \"https://www.michikusa-travel.com/yakei.html\",\n      \"name\": \"新幹線の夜景｜車窓から見えるライトアップと、暗くなる時刻 | 新幹線の窓\",\n      \"description\": \"東海道新幹線の夜景を、車窓から見える15か所で紹介。東京タワーと小田原城のライトアップ、清洲城・掛川城の期間限定ライトアップ、武蔵小杉・名古屋の街あかり、鳥飼車両基地まで。出発時刻を入れると、どこから暗くなるかがわかります。\",\n      \"inLanguage\": \"ja\",\n      \"datePublished\": \"2026-08-14\",\n      \"dateModified\": \"2026-08-17\",\n      \"isPartOf\": {\n        \"@type\": \"WebSite\",\n        \"name\": \"新幹線の窓\",\n        \"url\": \"https://www.michikusa-travel.com/\"\n      }\n    }\n  ]\n}</script>\n  <script src=\"language-router.js?v=a8d4ab78\"></script>",
  "copy11": ".yk-hero::before { content: \"\"; position: absolute; inset: 0; z-index: -2; background-image: url(\"images/20260629_2158_nagoya_station_night_michikusa.jpg\"); background-size: cover; background-position: center 55%; }",
  "yakei_page": "<body class=\"yakei-page spot-page spot-page-utility\" data-page=\"yakei\" data-spot-page-shared-context=\"utility\" data-spot-page-shared-lang=\"ja\" data-spot-page-shared-root=\"./\" data-spot-page-shared-route=\"yakei.html\">",
  "ykTitle": "<h1 id=\"ykTitle\">新幹線の夜景</h1>",
  "yk_hero_lead": "<p class=\"yk-hero-lead\"><span class=\"copy-chunk\">夜の窓に映るのは、たいてい自分の顔です。</span><span class=\"copy-chunk\">外が暗いからではなく、</span><span class=\"copy-chunk\">車内のほうが明るいから。</span><span class=\"copy-chunk\">手で影をつくると、</span><span class=\"copy-chunk\">そこにちゃんと景色があります。</span><span class=\"copy-chunk\">東海道新幹線の夜景を、</span><span class=\"copy-chunk\">帰りの車窓のために。</span></p>",
  "yk_hero_credit": "<p class=\"yk-hero-credit\">写真：新幹線の窓（名古屋駅前）</p>",
  "ykToolTitle": "<h2 id=\"ykToolTitle\"><span class=\"copy-chunk\">その列車、</span><span class=\"copy-chunk\">どこから暗くなるか</span></h2>",
  "yk_tool_note": "<p class=\"yk-tool-note\"><span class=\"copy-chunk\">日の入りは季節で1時間以上ずれます。</span><span class=\"copy-chunk\">12月なら小田原の手前でもう暗く、</span><span class=\"copy-chunk\">7月なら名古屋を過ぎてもまだ明るい。</span><span class=\"copy-chunk\">東海道新幹線の東京〜新大阪について、</span><span class=\"copy-chunk\">乗る日と列車を選んでください。</span></p>",
  "setup_label": "<label class=\"setup-label\" for=\"ykDate\">乗車日</label>",
  "yk_tool_disclaimer": "<p class=\"yk-tool-disclaimer\">通過時刻は、選んだ列車の公式ダイヤ（各駅の着発）から計算した目安です。遅れがあるとずれます。日の入りは東海道沿線の平均で近似した簡易計算で、実際の空の明るさは天候にも左右されます。</p>",
  "color_title": "<h2 id=\"color-title\">今夜、何色か — 日替わりのライトアップ</h2>",
  "yk_section_lead": "<p class=\"yk-section-lead\"><span class=\"copy-chunk\">照明の色が日によって変わる車窓です。</span><span class=\"copy-chunk\">同じ列車に乗っても、</span><span class=\"copy-chunk\">乗る日が違えば違う色が見えます。</span></p>",
  "copy12": "<img src=\"images/thumbs/20260629_tokyo_tower_night_michikusa.webp\" alt=\"夜の新幹線から見える東京タワー\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy13": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から3分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy14": "<h3>東京タワー</h3>",
  "yk_spot_lead": "<p class=\"yk-spot-lead\">その日の色が決まっている</p>",
  "copy15": "<p>東京駅を出て3分。ビルの切れ間に、赤い塔が立っています。</p>",
  "copy16": "<p>東京タワーの照明は毎日同じではありません。通常の「ランドマークライト」は夏が白色、冬が暖色。記念日やイベントの日は「ダイヤモンドヴェール」でピンクや虹色に変わります。<strong>乗る日によって色が違う</strong>、という意味では、このページで最初に出会う「今日だけの車窓」です。</p>",
  "copy17": "<p>発車直後で、まだ荷物を片付けている時間帯です。座ってすぐ右を見る、と決めておかないと通り過ぎます。</p>",
  "yk_more": "<p class=\"yk-more\"><a href=\"spots/tokyo-tower.html\">東京タワーの車窓ページを見る</a></p>",
  "copy18": "<img src=\"images/thumbs/20250526_odawara_castle_letus10.webp\" alt=\"新幹線のA席側から見える小田原城\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "yk_day_note": "<figcaption>写真：<a href=\"https://cotetu.seesaa.net/article/516754194.html\" target=\"_blank\" rel=\"noopener noreferrer\">新幹線の車窓から</a><span class=\"yk-day-note\">これは昼の写真です。夜の車窓写真はまだ集まっていません。</span></figcaption>",
  "yk_spot_meta2": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から31分</span><span class=\"yk-side yk-side-a\">A席側</span></p>",
  "copy19": "<h3>小田原城</h3>",
  "yk_spot_lead2": "<p class=\"yk-spot-lead\">その日の色が決まっている</p>",
  "copy20": "<p>小田原城の天守閣は、公式案内によれば<strong>毎日、日没から21時までライトアップ</strong>されています。さらに、啓発事業などに合わせて色を変える「カラーライトアップ」があり、その月ごとの予定が公式サイトで公開されています。</p>",
  "copy21": "<p>つまり東京タワーと同じで、<strong>その日に何色かが決まっている</strong>車窓です。しかもこちらはA席側。東京を出て最初の30分のあいだに、右に東京タワー、左に小田原城と、色の決まった建物が続けて現れることになります。</p>",
  "yk_official": "<p class=\"yk-official\"><a href=\"https://odawaracastle.com/\" target=\"_blank\" rel=\"noopener noreferrer\">小田原城 公式サイト（カラーライトアップ予定）</a></p>",
  "yk_more2": "<p class=\"yk-more\"><a href=\"spots/odawara-castle.html\">小田原城の車窓ページを見る</a></p>",
  "lightup_title": "<h2 id=\"lightup-title\">時期が合えば光る — 期間限定のライトアップ</h2>",
  "yk_section_lead2": "<p class=\"yk-section-lead\"><span class=\"copy-chunk\">通年ではなく、</span><span class=\"copy-chunk\">季節やイベントに合わせて点灯する城と塔です。</span><span class=\"copy-chunk\">日程は年によって変わるので、</span><span class=\"copy-chunk\">公式案内へのリンクを置いています。</span></p>",
  "copy22": "<img src=\"images/thumbs/20250309_kiyosu_castle_lightup_asami_k920.webp\" alt=\"ライトアップされた清洲城\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy23": "<figcaption>写真：<a href=\"https://x.com/asami_k920/status/1898673771084492889\" target=\"_blank\" rel=\"noopener noreferrer\">@asami_k920</a></figcaption>",
  "yk_spot_meta3": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から99分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy24": "<h3>清洲城</h3>",
  "yk_spot_lead3": "<p class=\"yk-spot-lead\">期間限定のライトアップ</p>",
  "copy25": "<p>名古屋を出てすぐ、五条川のそばに朱色の天守が立っています。線路との距離が近く、昼でもよく目立つスポットです。</p>",
  "copy26": "<p>夜のライトアップは通年ではなく、冬の「きよすイルミ」や春の清洲城桜まつりなど<strong>時期を区切って</strong>行われます。開催時期は年によって変わるので、公式案内で確認してください。</p>",
  "yk_official2": "<p class=\"yk-official\"><a href=\"https://kiyosu-kanko.org/\" target=\"_blank\" rel=\"noopener noreferrer\">清須市観光協会（きよすイルミ等）</a></p>",
  "yk_more3": "<p class=\"yk-more\"><a href=\"spots/kiyosu.html\">清洲城の車窓ページを見る</a></p>",
  "copy27": "<img src=\"images/thumbs/20260911_kakegawa_castle_night_michikusa.webp\" alt=\"夜の車窓からライトアップされて見える掛川城の天守\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy28": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta4": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から64分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy29": "<h3>掛川城</h3>",
  "yk_spot_lead4": "<p class=\"yk-spot-lead\">点いていれば、駅のそばに白く浮かぶ</p>",
  "copy30": "<p>掛川城は線路のすぐ近くに建っていて、昼はよく見えるスポットです。夜のライトアップは、掛川桜の時期（2月下旬〜3月中旬）や、8月の「水の週間」に合わせた青色の点灯など、<strong>期間を区切って行われるもの</strong>が確認できました。</p>",
  "copy31": "<p>これとは別に、2026年9月11日の夜にも下りの車窓から点灯を確認しました（上の写真）。ただし通年で毎晩点灯しているかどうかは一次情報で確認できていないので、夜に狙うなら公式案内を見てください。</p>",
  "yk_official3": "<p class=\"yk-official\"><a href=\"https://kakegawajo.com/\" target=\"_blank\" rel=\"noopener noreferrer\">掛川城 公式サイト</a></p>",
  "yk_more4": "<p class=\"yk-more\"><a href=\"spots/kakegawa.html\">掛川城の車窓ページを見る</a></p>",
  "copy32": "<img src=\"images/thumbs/20260906_toji_night_michikusa.webp\" alt=\"夜の京都に浮かぶ東寺の五重塔\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy33": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta5": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から131分</span><span class=\"yk-side yk-side-a\">A席側</span></p>",
  "copy34": "<h3>東寺 五重塔</h3>",
  "yk_spot_lead5": "<p class=\"yk-spot-lead\">京都の手前、金色に光る塔</p>",
  "copy35": "<p>「京都に来た」が一瞬でわかる塔です。夜は金色の光をまとって、街の明かりより一段高いところに浮かびます。京都駅が近づいたら、A席側の窓を早めに見ておいてください。</p>",
  "copy36": "<p>金堂・講堂の夜間特別拝観は春と秋の期間限定ですが、<strong>2026年9月6日の車窓では、その期間外でも塔が光っていました</strong>。拝観の日程と時間は公式案内で確認してください。</p>",
  "yk_official4": "<p class=\"yk-official\"><a href=\"https://toji.or.jp/\" target=\"_blank\" rel=\"noopener noreferrer\">東寺 公式サイト</a></p>",
  "yk_more5": "<p class=\"yk-more\"><a href=\"spots/toji.html\">東寺 五重塔の車窓ページを見る</a></p>",
  "citylight_title": "<h2 id=\"citylight-title\">光の海 — 街あかりの夜景</h2>",
  "yk_section_lead3": "<p class=\"yk-section-lead\"><span class=\"copy-chunk\">街そのものが車窓になる区間です。</span><span class=\"copy-chunk\">昼は建物、夜は明かりの数。</span></p>",
  "copy37": "<img src=\"images/thumbs/20260629_musashi_kosugi_towers_night_michikusa.webp\" alt=\"夜の新幹線から見える武蔵小杉のタワマン群\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy38": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta6": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から14分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy39": "<h3>武蔵小杉のタワマン群</h3>",
  "yk_spot_lead6": "<p class=\"yk-spot-lead\">窓明かりが積み上がる</p>",
  "copy40": "<p>多摩川を渡った直後、高層マンションの群れが近づきます。昼はグレーの塊ですが、夜はひとつひとつの窓の明かりが縦に積み上がって見えます。</p>",
  "copy41": "<p>誰かの生活の数だけ光がある、という見方をすると、同じ建物がまったく違って見えます。</p>",
  "yk_more6": "<p class=\"yk-more\"><a href=\"spots/musashi-kosugi-towers.html\">武蔵小杉のタワマン群の車窓ページを見る</a></p>",
  "copy42": "<img src=\"images/thumbs/20260629_2158_nagoya_station_night_michikusa.webp\" alt=\"夜の新幹線から見える名古屋駅前\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy43": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta7": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から94分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy44": "<h3>名古屋駅前</h3>",
  "yk_spot_lead7": "<p class=\"yk-spot-lead\">光の塊が近づく</p>",
  "copy45": "<p>名古屋に着く手前、駅前の高層ビル群がまとまった光の塊として近づいてきます。減速しながら近づくので、東京や新大阪の到着前より見ている時間が長く取れます。</p>",
  "copy46": "<p>降りる人は席を立ちたくなる時間ですが、あと1分だけ窓を見る価値があります。</p>",
  "yk_more7": "<p class=\"yk-more\"><a href=\"spots/nagoya-station-skyline.html\">名古屋駅前の車窓ページを見る</a></p>",
  "onlyatnight_title": "<h2 id=\"onlyatnight-title\">夜のほうが面白いもの — 定番ではない夜景</h2>",
  "yk_section_lead4": "<p class=\"yk-section-lead\"><span class=\"copy-chunk\">観光地の夜景ではありません。</span><span class=\"copy-chunk\">昼は素通りしているのに、</span><span class=\"copy-chunk\">暗くなると急に主役になるものたちです。</span></p>",
  "copy47": "<img src=\"images/thumbs/20260629_2320_maruko_bridge_night_michikusa.webp\" alt=\"夜の新幹線から見える丸子橋付近\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy48": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta8": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から13分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy49": "<h3>丸子橋</h3>",
  "yk_spot_lead8": "<p class=\"yk-spot-lead\">多摩川に伸びる灯り</p>",
  "copy50": "<p>多摩川を渡る短い時間に、下流側へ橋の灯りが一列に伸びます。昼は川と橋というだけの景色ですが、夜は光の線だけが残ります。</p>",
  "copy51": "<p>川の上は建物がないので、車窓としては視界がいちばん開けるポイントのひとつです。</p>",
  "yk_more8": "<p class=\"yk-more\"><a href=\"spots/maruko-bridge.html\">丸子橋の車窓ページを見る</a></p>",
  "copy52": "<img src=\"images/thumbs/20260629_2242_shimizu_port_chikyu_night_michikusa.webp\" alt=\"夜の新幹線から見える清水港とちきゅう\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy53": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta9": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から50分</span><span class=\"yk-side yk-side-a\">A席側</span></p>",
  "copy54": "<h3>清水港とちきゅう</h3>",
  "yk_spot_lead9": "<p class=\"yk-spot-lead\">港の作業灯</p>",
  "copy55": "<p>海側の遠くに、港の照明がまとまって見えます。停泊していれば地球深部探査船「ちきゅう」の櫓も、細い光の柱として見分けられることがあります。</p>",
  "copy56": "<p>観光地の夜景ではなく、夜も動いている場所の灯りです。</p>",
  "yk_more9": "<p class=\"yk-more\"><a href=\"spots/shimizu-port-chikyu.html\">清水港とちきゅうの車窓ページを見る</a></p>",
  "copy57": "<img src=\"images/thumbs/20260629_nichiban_anjo_night_michikusa.webp\" alt=\"夜の新幹線から見えるセロテープの壁看板\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy58": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta10": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から88分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy59": "<h3>セロテープの壁看板</h3>",
  "yk_spot_lead10": "<p class=\"yk-spot-lead\">夜のほうが目立つ</p>",
  "copy60": "<p>工場の壁に描かれた大きな看板です。昼は壁の一部として流れていきますが、夜は照明が当たって暗闇に文字だけが浮かびます。</p>",
  "copy61": "<p><strong>昼より夜のほうが見つけやすい、数少ない車窓</strong>です。</p>",
  "yk_more10": "<p class=\"yk-more\"><a href=\"spots/nichiban-anjo.html\">セロテープの壁看板の車窓ページを見る</a></p>",
  "copy62": "<img src=\"images/thumbs/20260911_sennenq_sign_night_michikusa.webp\" alt=\"夜の車窓に赤く光るせんねん灸の看板\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy63": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta11": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から112分</span><span class=\"yk-side yk-side-a\">A席側</span></p>",
  "copy64": "<h3>せんねん灸の看板</h3>",
  "yk_spot_lead11": "<p class=\"yk-spot-lead\">暗い山際に、赤い文字だけ</p>",
  "copy65": "<p>米原の前後、A席側の山際に「せんねん灸」の文字が並びます。昼は白い看板ですが、夜は赤い文字だけが残ります。</p>",
  "copy66": "<p>2026年9月6日と9月11日、どちらの夜も点いていました。<strong>看板そのものが光るので、夜のほうが見つけやすい側の車窓です。</strong></p>",
  "yk_more11": "<p class=\"yk-more\"><a href=\"spots/sennenq-sign.html\">せんねん灸の看板の車窓ページを見る</a></p>",
  "copy67": "<img src=\"images/thumbs/20260906_lotte_shiga_night_michikusa.webp\" alt=\"夜の車窓に光るロッテ滋賀工場のお菓子看板\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy68": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta12": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から119分</span><span class=\"yk-side yk-side-a\">A席側</span></p>",
  "copy69": "<h3>ロッテ滋賀工場の菓子看板</h3>",
  "yk_spot_lead12": "<p class=\"yk-spot-lead\">夜も明るいお菓子の名前</p>",
  "copy70": "<p>米原を過ぎて京都方面へ進むと、A席側に雪見だいふくなどの菓子看板が並びます。工場の看板なので夜も明るく、名前が読める状態で流れていきます。</p>",
  "copy71": "<p>1枚ずつ読もうとすると間に合いません。<strong>色と形の連なりとして追うほうが、夜は速い</strong>です。</p>",
  "yk_more12": "<p class=\"yk-more\"><a href=\"spots/lotte-shiga.html\">ロッテ滋賀工場の菓子看板の車窓ページを見る</a></p>",
  "copy72": "<img src=\"images/thumbs/20260629_2125_seta_karahashi_night_michikusa.webp\" alt=\"夜の新幹線から見える瀬田の唐橋付近\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy73": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta13": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から127分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy74": "<h3>瀬田の唐橋</h3>",
  "yk_spot_lead13": "<p class=\"yk-spot-lead\">水面に落ちる光</p>",
  "copy75": "<p>瀬田川を渡る一瞬に、橋の灯りと、それが水面に落ちた光が見えます。</p>",
  "copy76": "<p>「唐橋を制する者は天下を制す」と言われた橋ですが、夜はそういう歴史よりも、静かな水面のほうが記憶に残ります。</p>",
  "yk_more13": "<p class=\"yk-more\"><a href=\"spots/seta-karahashi.html\">瀬田の唐橋の車窓ページを見る</a></p>",
  "copy77": "<img src=\"images/thumbs/20260906_hirakata_park_wheel_night_michikusa.webp\" alt=\"夜の淀川越しに青白く光るひらパーの観覧車\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy78": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta14": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から139分</span><span class=\"yk-side yk-side-a\">A席側</span></p>",
  "copy79": "<h3>ひらパーの観覧車</h3>",
  "yk_spot_lead14": "<p class=\"yk-spot-lead\">昼は骨組み、夜は光る輪</p>",
  "copy80": "<p>京都を出て高槻を過ぎたころ、A席側の屋根の少し上に輪がひとつ浮かびます。線路から約2.3km離れた、最頂部80mの観覧車スカイウォーカーです。</p>",
  "copy81": "<p>昼は白い骨組みで見つけにくい相手ですが、<strong>光れば輪の形がそのまま出るので、夜のほうが成功率は高い</strong>です。イルミネーション「光の遊園地」は11月から4月の開催ですが、2026年9月6日の車窓でも輪は光っていました。点灯時間は公式案内で確認してください。</p>",
  "yk_official5": "<p class=\"yk-official\"><a href=\"https://www.hirakatapark.co.jp/attractions/skywalker/\" target=\"_blank\" rel=\"noopener noreferrer\">ひらかたパーク: スカイウォーカー</a></p>",
  "yk_more14": "<p class=\"yk-more\"><a href=\"spots/hirakata-park-wheel.html\">ひらパーの観覧車の車窓ページを見る</a></p>",
  "copy82": "<img src=\"images/thumbs/20260629_torikai_train_depot_night_michikusa.webp\" alt=\"夜の新幹線から見える鳥飼車両基地\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy83": "<figcaption>写真：新幹線の窓</figcaption>",
  "yk_spot_meta15": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">東京から141分</span><span class=\"yk-side yk-side-e\">E席側</span></p>",
  "copy84": "<h3>鳥飼車両基地</h3>",
  "yk_spot_lead15": "<p class=\"yk-spot-lead\">眠る新幹線の列</p>",
  "copy85": "<p>新大阪の手前、車両基地に何本もの新幹線が並んで停まっています。夜は照明の下に白い車体が並び、昼とはまったく違う迫力になります。</p>",
  "copy86": "<p>自分が乗っている車両と同じものが、明かりの中で休んでいる。<strong>旅の終わりに見るものとして、これ以上ないと思います。</strong></p>",
  "yk_more15": "<p class=\"yk-more\"><a href=\"spots/torikai-train-depot.html\">鳥飼車両基地の車窓ページを見る</a></p>",
  "ykTipsTitle": "<h2 id=\"ykTipsTitle\">夜の車窓の見方</h2>",
  "yk_tips_lead": "<p class=\"yk-tips-lead\">ここがこのページでいちばん実用的な部分だと思っています。</p>",
  "copy87": "<li><strong>敵は距離ではなく、車内の照明</strong>夜の車窓が見えない原因のほとんどは、外の暗さではなく車内の光の映り込みです。窓は鏡になっています。顔と両手で窓のまわりを囲って影をつくると、数秒で目が慣れて外が見えてきます。座ったまま、周りに気づかれずにできます。</li>",
  "copy88": "<li><strong>暗い席を探すより、影をつくる</strong>客室の照明は基本的に落ちません。空いている暗い席を探して移動するより、いま座っている窓に影をつくるほうが確実で早いです。</li>",
  "copy89": "<li><strong>撮るなら、レンズを窓ガラスに密着させる</strong>スマホを窓から離すほど車内の光が写り込みます。レンズを直接ガラスに当てると映り込みがほぼ消えます。走行中の夜間撮影はぶれやすいので、まず肉眼で見ておくのが確実です。</li>",
  "copy90": "<li><strong>暗い側と明るい側がある</strong>市街地を抜けると、片側だけ真っ暗ということが起こります。E席側とA席側で見えるものが違うので、上の判定で席側も確認してください。</li>",
  "ykNoteTitle": "<h2 id=\"ykNoteTitle\">掲載について</h2>",
  "copy91": "<p>ライトアップの実施日・点灯時間・色は、年や事情によって変わります。このページでは日付を断定せず、各施設の公式案内へのリンクを置いています。乗車前に必ず公式でご確認ください。</p>",
  "copy92": "<p>小田原城と掛川城は、当サイトがまだ夜の車窓写真を持っていません。そのため昼の写真を掲載しています。ライトアップが行われていることと、走行中の新幹線から見えることは別の話なので、「見える」とは書いていません。夜の車窓から撮れた写真をお持ちの方は、お問い合わせからご連絡いただけると助かります。</p>",
  "copy93": "<p>写真のうち清洲城は @asami_k920 さん、小田原城はブログ「新幹線の車窓から」の許諾済み写真です。それ以外は当サイトの撮影です。通過時刻と日の入りはいずれも目安の計算で、実際の見え方は列車・天候・座席位置によって変わります。</p>",
  "footer_brand": "<p class=\"footer-brand\">新幹線の窓 <span>旅の瞬間を見逃さない</span></p>",
  "copy94": "<p>時刻は目安です。列車・天候・座席位置により見え方は変わります。</p>",
  "footer_links": "<p class=\"footer-links\"><a href=\"index.html\">TOP</a> · <a href=\"guide.html\">富士山の見方</a> · <a href=\"zukan.html\">車窓図鑑</a> · <a href=\"contact.html\">お問い合わせ</a> · <a href=\"privacy.html\">プライバシーポリシー</a></p>",
  "footer_credit": "<p class=\"footer-credit\">道草 / Michikusa — 急がない旅と、偶然の発見を。</p>",
  "copy95": "window.YAKEI_LANG = \"ja\";"
 },
 "en": {
  "copy": "<title>Night Views from the Shinkansen | Illuminations from the window, and when it gets dark | Shinkansen Window</title>",
  "copy2": "<meta name=\"description\" content=\"Night views from the Tokaido Shinkansen window: the Tokyo Tower and Odawara Castle illuminations, seasonal castle and pagoda light-ups, lit signs, city lights, and a depot of sleeping trains. Enter your departure time to find where your train goes dark.\">",
  "copy3": "<meta property=\"og:site_name\" content=\"Shinkansen Window\">",
  "copy4": "<meta property=\"og:locale\" content=\"en_US\">",
  "copy5": "<meta property=\"og:title\" content=\"Night Views from the Shinkansen\">",
  "copy6": "<meta property=\"og:description\" content=\"At night the window becomes a mirror. How to see past it, and the eleven things worth looking for. Enter a departure time to find where darkness starts.\">",
  "copy7": "<meta property=\"og:image:alt\" content=\"The lights of Nagoya Station seen from a Shinkansen at night\">",
  "copy8": "<meta name=\"twitter:title\" content=\"Night Views from the Shinkansen\">",
  "copy9": "<meta name=\"twitter:description\" content=\"At night the window becomes a mirror. How to see past it, and the eleven things worth looking for. Enter a departure time to find where darkness starts.\">",
  "copy10": "<meta name=\"twitter:image:alt\" content=\"The lights of Nagoya Station seen from a Shinkansen at night\">\n  <script src=\"../language-router.js?v=a8d4ab78\"></script>",
  "copy11": ".yk-hero::before { content: \"\"; position: absolute; inset: 0; z-index: -2; background-image: url(\"../images/20260629_2158_nagoya_station_night_michikusa.jpg\"); background-size: cover; background-position: center 55%; }",
  "yakei_page": "<body class=\"yakei-page spot-page spot-page-utility\" data-page=\"yakei\" data-spot-page-shared-context=\"utility\" data-spot-page-shared-lang=\"en\" data-spot-page-shared-root=\"../\" data-spot-page-shared-route=\"yakei.html\">",
  "ykTitle": "<h1 id=\"ykTitle\">Night Views from the Shinkansen</h1>",
  "yk_hero_lead": "<p class=\"yk-hero-lead\">What you usually see in a night window is your own face &mdash; not because it is dark outside, but because it is brighter inside. Cup your hands against the glass and the view is still there. Night views along the Tokaido Shinkansen, for the ride home.</p>",
  "yk_hero_credit": "<p class=\"yk-hero-credit\">Photo: Shinkansen Window (Nagoya Station)</p>",
  "ykToolTitle": "<h2 id=\"ykToolTitle\">Where does your train go dark?</h2>",
  "yk_tool_note": "<p class=\"yk-tool-note\">Sunset moves by more than an hour across the year. In December it is already dark before Odawara; in July it is still light past Nagoya. For the Tokaido Shinkansen between Tokyo and Shin-Osaka, choose your date and train.</p>",
  "setup_label": "<label class=\"setup-label\" for=\"ykDate\">Date of travel</label>",
  "yk_tool_disclaimer": "<p class=\"yk-tool-disclaimer\">Passing times are estimates from your train's published timetable, including its station stops. Any delay will shift them. Sunset is a simplified calculation averaged along the Tokaido corridor, and how bright the sky actually looks also depends on the weather.</p>",
  "color_title": "<h2 id=\"color-title\">What colour is it tonight — nightly illuminations</h2>",
  "yk_section_lead": "<p class=\"yk-section-lead\">Two views whose lighting changes from day to day. Take the same train a week later and the colour is different.</p>",
  "copy12": "<img src=\"../images/thumbs/20260629_tokyo_tower_night_michikusa.webp\" alt=\"Tokyo Tower seen from the Shinkansen at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy13": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">3 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy14": "<h3>Tokyo Tower</h3>",
  "yk_spot_lead": "<p class=\"yk-spot-lead\">Its colour is decided for the day</p>",
  "copy15": "<p>Three minutes out of Tokyo Station, a red tower stands in a gap between the buildings.</p>",
  "copy16": "<p>Tokyo Tower is not lit the same way every night. The standard &ldquo;Landmark Light&rdquo; is white in summer and a warm amber in winter, and on anniversaries and event days the &ldquo;Diamond Veil&rdquo; turns it pink, blue or rainbow. <strong>The colour depends on the day you travel</strong> &mdash; the first view on this page that belongs only to tonight.</p>",
  "copy17": "<p>It comes while you are still stowing your bag. Decide before you board that you will look right as soon as you sit down, or you will miss it.</p>",
  "yk_more": "<p class=\"yk-more\"><a href=\"spots/tokyo-tower.html\">Open the window page for Tokyo Tower</a></p>",
  "copy18": "<img src=\"../images/thumbs/20250526_odawara_castle_letus10.webp\" alt=\"Odawara Castle from the Seat A side of the Shinkansen\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "yk_day_note": "<figcaption>Photo: <a href=\"https://cotetu.seesaa.net/article/516754194.html\" target=\"_blank\" rel=\"noopener noreferrer\">Shinkansen window blog</a><span class=\"yk-day-note\">A daytime photo. We do not have a night shot from the train yet.</span></figcaption>",
  "yk_spot_meta2": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">31 min from Tokyo</span><span class=\"yk-side yk-side-a\">Seat A side</span></p>",
  "copy19": "<h3>Odawara Castle</h3>",
  "yk_spot_lead2": "<p class=\"yk-spot-lead\">Its colour is decided for the day</p>",
  "copy20": "<p>According to the castle's own guide, the Odawara Castle keep is <strong>lit every evening from sunset until 21:00</strong>. On top of that there is a &ldquo;colour light-up&rdquo; tied to awareness campaigns, and the schedule for each month is published on the official site.</p>",
  "copy21": "<p>So, like Tokyo Tower, <strong>its colour is already decided for the night you travel</strong> &mdash; but this one is on the Seat A side. In the first thirty minutes out of Tokyo you pass a colour-of-the-day building on your right, then another on your left.</p>",
  "yk_official": "<p class=\"yk-official\"><a href=\"https://odawaracastle.com/\" target=\"_blank\" rel=\"noopener noreferrer\">Odawara Castle official site (colour light-up schedule, Japanese)</a></p>",
  "yk_more2": "<p class=\"yk-more\"><a href=\"spots/odawara-castle.html\">Open the window page for Odawara Castle</a></p>",
  "lightup_title": "<h2 id=\"lightup-title\">If your timing is right — seasonal illuminations</h2>",
  "yk_section_lead2": "<p class=\"yk-section-lead\">These keeps and the pagoda are not lit every night. They come on for a season or an event, and the dates move each year, so each one links to its official information.</p>",
  "copy22": "<img src=\"../images/thumbs/20250309_kiyosu_castle_lightup_asami_k920.webp\" alt=\"Kiyosu Castle lit up at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy23": "<figcaption>Photo: <a href=\"https://x.com/asami_k920/status/1898673771084492889\" target=\"_blank\" rel=\"noopener noreferrer\">@asami_k920</a></figcaption>",
  "yk_spot_meta3": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">99 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy24": "<h3>Kiyosu Castle</h3>",
  "yk_spot_lead3": "<p class=\"yk-spot-lead\">Lit only in season</p>",
  "copy25": "<p>Just after Nagoya, a vermilion keep stands beside the Gojo River. It is close to the track and easy to spot even in daylight.</p>",
  "copy26": "<p>The night light-up is <strong>not year-round</strong>: it runs during the winter &ldquo;Kiyosu Illumi&rdquo; and the spring cherry blossom festival. Dates move from year to year, so check the official information before you count on it.</p>",
  "yk_official2": "<p class=\"yk-official\"><a href=\"https://kiyosu-kanko.org/\" target=\"_blank\" rel=\"noopener noreferrer\">Kiyosu City Tourism Association (Japanese)</a></p>",
  "yk_more3": "<p class=\"yk-more\"><a href=\"spots/kiyosu.html\">Open the window page for Kiyosu Castle</a></p>",
  "copy27": "<img src=\"../images/thumbs/20260911_kakegawa_castle_night_michikusa.webp\" alt=\"Kakegawa Castle's keep lit up, seen from the train at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy28": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta4": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">64 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy29": "<h3>Kakegawa Castle</h3>",
  "yk_spot_lead4": "<p class=\"yk-spot-lead\">White above the town when it is lit</p>",
  "copy30": "<p>Kakegawa Castle stands very close to the track and is one of the clearest daytime views on the route. For the evening, what we could confirm are <strong>limited-period light-ups</strong>: the Kakegawa cherry blossom season from late February to mid-March, and a blue illumination during Water Week in early August.</p>",
  "copy31": "<p>Separately, we saw the keep lit from a westbound train on the night of 11 September 2026 (the photo above). Whether it is lit every night year-round is still unconfirmed by a primary source, so check the official site before counting on it.</p>",
  "yk_official3": "<p class=\"yk-official\"><a href=\"https://kakegawajo.com/\" target=\"_blank\" rel=\"noopener noreferrer\">Kakegawa Castle official site (Japanese)</a></p>",
  "yk_more4": "<p class=\"yk-more\"><a href=\"spots/kakegawa.html\">Open the window page for Kakegawa Castle</a></p>",
  "copy32": "<img src=\"../images/thumbs/20260906_toji_night_michikusa.webp\" alt=\"To-ji's five-story pagoda glowing over Kyoto at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy33": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta5": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">131 min from Tokyo</span><span class=\"yk-side yk-side-a\">Seat A side</span></p>",
  "copy34": "<h3>To-ji's five-story pagoda</h3>",
  "yk_spot_lead5": "<p class=\"yk-spot-lead\">Gold above the city, just before Kyoto</p>",
  "copy35": "<p>The one silhouette that tells you instantly you have reached Kyoto. After dark it carries a gold light and sits a level above the surrounding streets. Start watching the Seat A side before Kyoto Station.</p>",
  "copy36": "<p>Night viewing of the Kondo and Kodo halls runs only in spring and autumn, but <strong>from the train on 6 September 2026 the pagoda was lit outside those periods</strong>. Check the official site for dates and hours.</p>",
  "yk_official4": "<p class=\"yk-official\"><a href=\"https://toji.or.jp/\" target=\"_blank\" rel=\"noopener noreferrer\">To-ji official site (Japanese)</a></p>",
  "yk_more5": "<p class=\"yk-more\"><a href=\"spots/toji.html\">Open the window page for To-ji's five-story pagoda</a></p>",
  "citylight_title": "<h2 id=\"citylight-title\">A sea of lights — city night views</h2>",
  "yk_section_lead3": "<p class=\"yk-section-lead\">Stretches where the city itself becomes the view. Buildings by day; by night, a count of lit windows.</p>",
  "copy37": "<img src=\"../images/thumbs/20260629_musashi_kosugi_towers_night_michikusa.webp\" alt=\"The Musashi-Kosugi high-rise cluster at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy38": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta6": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">14 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy39": "<h3>Musashi-Kosugi towers</h3>",
  "yk_spot_lead6": "<p class=\"yk-spot-lead\">Window lights, stacked</p>",
  "copy40": "<p>Just after the river, a cluster of residential towers closes in. By day they are a grey mass; at night each lit window stacks into a vertical grid.</p>",
  "copy41": "<p>Count them as households rather than windows and the same buildings look completely different.</p>",
  "yk_more6": "<p class=\"yk-more\"><a href=\"spots/musashi-kosugi-towers.html\">Open the window page for Musashi-Kosugi towers</a></p>",
  "copy42": "<img src=\"../images/thumbs/20260629_2158_nagoya_station_night_michikusa.webp\" alt=\"The towers in front of Nagoya Station at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy43": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta7": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">94 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy44": "<h3>The Nagoya Station skyline</h3>",
  "yk_spot_lead7": "<p class=\"yk-spot-lead\">A block of light, closing in</p>",
  "copy45": "<p>On the approach to Nagoya, the towers around the station arrive as one solid block of light. Because the train is already slowing, you get longer with it than with the skylines before Tokyo or Shin-Osaka.</p>",
  "copy46": "<p>It lands exactly when people start standing up. It is worth staying in your seat one more minute.</p>",
  "yk_more7": "<p class=\"yk-more\"><a href=\"spots/nagoya-station-skyline.html\">Open the window page for The Nagoya Station skyline</a></p>",
  "onlyatnight_title": "<h2 id=\"onlyatnight-title\">Better after dark — the night views nobody lists</h2>",
  "yk_section_lead4": "<p class=\"yk-section-lead\">Not scenic night views. Things you slide past without noticing in daylight, which become the main event once it is dark.</p>",
  "copy47": "<img src=\"../images/thumbs/20260629_2320_maruko_bridge_night_michikusa.webp\" alt=\"Maruko Bridge area from the Shinkansen at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy48": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta8": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">13 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy49": "<h3>Maruko Bridge</h3>",
  "yk_spot_lead8": "<p class=\"yk-spot-lead\">Lights strung across the Tama River</p>",
  "copy50": "<p>For the few seconds you are over the Tama River, the bridge lights run downstream in a single line. By day it is a river and a bridge; at night only the line of light is left.</p>",
  "copy51": "<p>Nothing is built on the water, so this is one of the most open views on the whole route.</p>",
  "yk_more8": "<p class=\"yk-more\"><a href=\"spots/maruko-bridge.html\">Open the window page for Maruko Bridge</a></p>",
  "copy52": "<img src=\"../images/thumbs/20260629_2242_shimizu_port_chikyu_night_michikusa.webp\" alt=\"Shimizu Port and the drilling vessel CHIKYU at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy53": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta9": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">50 min from Tokyo</span><span class=\"yk-side yk-side-a\">Seat A side</span></p>",
  "copy54": "<h3>Shimizu Port and CHIKYU</h3>",
  "yk_spot_lead9": "<p class=\"yk-spot-lead\">A working harbour, still lit</p>",
  "copy55": "<p>Far out on the sea side, the harbour lights gather into one patch. If the deep-sea drilling vessel CHIKYU is in port, its derrick sometimes reads as a thin column of light.</p>",
  "copy56": "<p>This is not a scenic night view. It is the glow of a place that is still working.</p>",
  "yk_more9": "<p class=\"yk-more\"><a href=\"spots/shimizu-port-chikyu.html\">Open the window page for Shimizu Port and CHIKYU</a></p>",
  "copy57": "<img src=\"../images/thumbs/20260629_nichiban_anjo_night_michikusa.webp\" alt=\"The CELLOTAPE wall sign glowing at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy58": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta10": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">88 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy59": "<h3>The CELLOTAPE wall sign</h3>",
  "yk_spot_lead10": "<p class=\"yk-spot-lead\">Easier to find after dark</p>",
  "copy60": "<p>A large sign painted on a factory wall. In daylight it slides past as part of the building; at night it is lit, and only the letters float in the dark.</p>",
  "copy61": "<p><strong>One of the very few views on this route that is easier to catch at night than by day.</strong></p>",
  "yk_more10": "<p class=\"yk-more\"><a href=\"spots/nichiban-anjo.html\">Open the window page for The CELLOTAPE wall sign</a></p>",
  "copy62": "<img src=\"../images/thumbs/20260911_sennenq_sign_night_michikusa.webp\" alt=\"The Sennen Kyu sign glowing red from the train at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy63": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta11": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">112 min from Tokyo</span><span class=\"yk-side yk-side-a\">Seat A side</span></p>",
  "copy64": "<h3>The Sennen Kyu sign</h3>",
  "yk_spot_lead11": "<p class=\"yk-spot-lead\">Red letters on a dark hillside</p>",
  "copy65": "<p>Around Maibara, the characters for Sennen Kyu stand along the hillside on the Seat A side. By day it is a white board; at night only the red letters are left.</p>",
  "copy66": "<p>It was lit on the nights of both 6 and 11 September 2026. <strong>The sign is its own light source, which puts it among the views that are easier to catch after dark.</strong></p>",
  "yk_more11": "<p class=\"yk-more\"><a href=\"spots/sennenq-sign.html\">Open the window page for The Sennen Kyu sign</a></p>",
  "copy67": "<img src=\"../images/thumbs/20260906_lotte_shiga_night_michikusa.webp\" alt=\"Lotte Shiga's sweets billboards lit at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy68": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta12": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">119 min from Tokyo</span><span class=\"yk-side yk-side-a\">Seat A side</span></p>",
  "copy69": "<h3>The Lotte Shiga sweets signs</h3>",
  "yk_spot_lead12": "<p class=\"yk-spot-lead\">Factory signs that stay bright</p>",
  "copy70": "<p>Past Maibara toward Kyoto, a run of billboards for Yukimi Daifuku and other sweets lines the Seat A side. They belong to the factory, so they stay lit and the names remain readable as they pass.</p>",
  "copy71": "<p>Reading them one by one does not work at this speed. <strong>Follow them as a run of colours and shapes instead.</strong></p>",
  "yk_more12": "<p class=\"yk-more\"><a href=\"spots/lotte-shiga.html\">Open the window page for The Lotte Shiga sweets signs</a></p>",
  "copy72": "<img src=\"../images/thumbs/20260629_2125_seta_karahashi_night_michikusa.webp\" alt=\"The Seta no Karahashi area at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy73": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta13": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">127 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy74": "<h3>Seta no Karahashi</h3>",
  "yk_spot_lead13": "<p class=\"yk-spot-lead\">Light falling on water</p>",
  "copy75": "<p>In the instant you cross the Seta River, you get the bridge lights and their reflection on the water at once.</p>",
  "copy76": "<p>This is the bridge of the old saying, &ldquo;hold the Karahashi and you hold the country&rdquo;. At night the history matters less than how still the water is.</p>",
  "yk_more13": "<p class=\"yk-more\"><a href=\"spots/seta-karahashi.html\">Open the window page for Seta no Karahashi</a></p>",
  "copy77": "<img src=\"../images/thumbs/20260906_hirakata_park_wheel_night_michikusa.webp\" alt=\"The Hirakata Park ferris wheel glowing across the Yodo River at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy78": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta14": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">139 min from Tokyo</span><span class=\"yk-side yk-side-a\">Seat A side</span></p>",
  "copy79": "<h3>The Hirakata Park ferris wheel</h3>",
  "yk_spot_lead14": "<p class=\"yk-spot-lead\">A bare frame by day, a ring of light at night</p>",
  "copy80": "<p>After Kyoto, once you are past Takatsuki, a single ring rises just above the rooftops on the Seat A side. It is Sky Walker, 80 m at the top, about 2.3 km from the track.</p>",
  "copy81": "<p>By day it is a pale frame and easy to miss; <strong>lit, the ring reads as a ring, so your odds are better after dark</strong>. The park's Hikari no Yuenchi illumination runs November to April, but the wheel was still glowing from the train on 6 September 2026. Check the official site for lighting hours.</p>",
  "yk_official5": "<p class=\"yk-official\"><a href=\"https://www.hirakatapark.co.jp/attractions/skywalker/\" target=\"_blank\" rel=\"noopener noreferrer\">Hirakata Park: Sky Walker (Japanese)</a></p>",
  "yk_more14": "<p class=\"yk-more\"><a href=\"spots/hirakata-park-wheel.html\">Open the window page for The Hirakata Park ferris wheel</a></p>",
  "copy82": "<img src=\"../images/thumbs/20260629_torikai_train_depot_night_michikusa.webp\" alt=\"Shinkansen parked at the Torikai depot at night\" width=\"480\" height=\"320\" loading=\"lazy\" decoding=\"async\">",
  "copy83": "<figcaption>Photo: Shinkansen Window</figcaption>",
  "yk_spot_meta15": "<p class=\"yk-spot-meta\"><span class=\"yk-min\">141 min from Tokyo</span><span class=\"yk-side yk-side-e\">Seat E side</span></p>",
  "copy84": "<h3>Torikai rolling stock depot</h3>",
  "yk_spot_lead15": "<p class=\"yk-spot-lead\">A row of sleeping trains</p>",
  "copy85": "<p>Before Shin-Osaka, rows of Shinkansen sit parked in the depot. Under the floodlights the white bodies line up with a weight they never have in daylight.</p>",
  "copy86": "<p>The same train you are riding, resting in the light. <strong>There is no better thing to see at the end of a journey.</strong></p>",
  "yk_more15": "<p class=\"yk-more\"><a href=\"spots/torikai-train-depot.html\">Open the window page for Torikai rolling stock depot</a></p>",
  "ykTipsTitle": "<h2 id=\"ykTipsTitle\">How to see night views through the window</h2>",
  "yk_tips_lead": "<p class=\"yk-tips-lead\">This is the most useful part of the page.</p>",
  "copy87": "<li><strong>Your enemy is the cabin light, not the distance</strong>Almost every time you cannot see out at night, the cause is the cabin lighting reflecting off the glass, not the darkness outside. The window is behaving like a mirror. Cup your face and both hands against it to make a patch of shadow, give your eyes a few seconds, and the outside appears. You can do it from your seat without anyone noticing.</li>",
  "copy88": "<li><strong>Make shade rather than hunt for a dark seat</strong>Cabin lights stay on. Making shade at the window you already have is faster and more reliable than moving to find a darker seat.</li>",
  "copy89": "<li><strong>To film it, press the lens flat against the glass</strong>The further your phone is from the window, the more cabin light lands in the shot. Holding the lens directly against the glass removes almost all of it. Night video from a moving train still blurs easily, so watch with your eyes first.</li>",
  "copy90": "<li><strong>One side is dark, the other is not</strong>Once you are past the built-up areas, it is common for one side of the train to be completely black. Seat E and Seat A see different things, so check the side column in the tool above.</li>",
  "ykNoteTitle": "<h2 id=\"ykNoteTitle\">About what is shown here</h2>",
  "copy91": "<p>Light-up dates, hours and colours change from year to year. This page does not state dates; it links to each site's official information instead. Please check there before you travel.</p>",
  "copy92": "<p>For Odawara Castle and Kakegawa Castle we do not yet have a night photo taken from the train, so a daytime photo is shown. A castle being lit and a castle being visible from a moving Shinkansen are two different claims, and we only make the first. If you have a night shot from the window, we would be glad to hear from you.</p>",
  "copy93": "<p>The Kiyosu Castle photo is used with permission from @asami_k920, and the Odawara Castle photo from the Shinkansen window blog. The rest are our own. Passing times and sunset are both estimates, and what you actually see depends on the train, the weather and where you are sitting.</p>",
  "footer_brand": "<p class=\"footer-brand\">Shinkansen Window <span>Catch the moment from your window</span></p>",
  "copy94": "<p>Times are estimates. Trains, weather and seat position all change what you see.</p>",
  "footer_links": "<p class=\"footer-links\"><a href=\"./\">Home</a> · <a href=\"guide.html\">Seeing Mt. Fuji</a> · <a href=\"zukan.html\">Window field guide</a> · <a href=\"contact.html\">Contact</a> · <a href=\"privacy.html\">Privacy</a></p>",
  "footer_credit": "<p class=\"footer-credit\">Michikusa — unhurried travel, and the things you find by chance.</p>",
  "copy95": "window.YAKEI_LANG = \"en\";"
 }
};

function render(lang) {
  const en = lang === 'en';
  const p = en ? '../' : '';
  const t = COPY[lang];
  const pageUrl = en ? `${site}/en/yakei.html` : `${site}/yakei.html`;
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
  <link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/yakei.html">
  <link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/yakei.html">
  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/yakei.html">
  <link rel="stylesheet" href="${p}style.css?v=${assetVersion('style.css')}">
  <link rel="icon" href="${p}favicon.ico" sizes="any">
  <meta property="og:type" content="article">
  ${t.copy3}
  ${t.copy4}
  ${t.copy5}
  ${t.copy6}
  <meta property="og:image" content="https://www.michikusa-travel.com/images/20260629_2158_nagoya_station_night_michikusa.jpg">
  ${t.copy7}
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  ${t.copy8}
  ${t.copy9}
  <meta name="twitter:image" content="https://www.michikusa-travel.com/images/20260629_2158_nagoya_station_night_michikusa.jpg">
  ${t.copy10}
  <link rel="stylesheet" href="${p}yakei.css?v=${assetVersion('yakei.css')}">
  <script>
    (function () {
      if (window.MADO_EMBEDDED_WEB) return;
      var measurementId = "G-C2ESB694FV";
      var optoutKey = "mado-ga-optout";
      var params = new URLSearchParams(window.location.search);
      var host = window.location.hostname;
      var isNativeApp = !!(window.Capacitor && ((typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) || (typeof window.Capacitor.getPlatform === "function" && window.Capacitor.getPlatform() !== "web")));
      var isLocalPreview = !isNativeApp && (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1");
      var storageOptedOut = false;

      try {
        if (params.get("ga") === "off" || params.get("ga_optout") === "1") localStorage.setItem(optoutKey, "1");
        if (params.get("ga") === "on" || params.get("ga_optout") === "0") localStorage.removeItem(optoutKey);
        storageOptedOut = localStorage.getItem(optoutKey) === "1";
      } catch (error) {
        storageOptedOut = false;
      }

      window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut;
      window["ga-disable-" + measurementId] = window.MADO_ANALYTICS_DISABLED;
      if (window.MADO_ANALYTICS_DISABLED) return;

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      var script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", measurementId);
    })();
  </script>
</head>
${t.yakei_page}
  <div data-spot-page-shared-module="topbar"></div>

  <main>
    <section class="yk-hero" aria-labelledby="ykTitle">
      <div class="yk-hero-inner">
        <p class="eyebrow">NIGHT WINDOW</p>
        ${t.ykTitle}
        ${t.yk_hero_lead}
        ${t.yk_hero_credit}
      </div>
    </section>

    <div class="spot-page-shell yakei-shell">
      <aside data-spot-page-shared-module="rail"></aside>
      <article class="spot-page-article yk-article">

    <section class="yk-tool" aria-labelledby="ykToolTitle">
      <div class="yk-tool-card">
        ${t.ykToolTitle}
        ${t.yk_tool_note}
        <div class="yk-setup">
          <div class="setup-row">
            ${t.setup_label}
            <input type="date" id="ykDate" class="setup-date">
          </div>
          <div data-train-picker></div>
        </div>
        <div class="yk-result" id="ykResult" aria-live="polite"></div>
        <p class="yk-summary" id="ykSummary"></p>
        ${t.yk_tool_disclaimer}
      </div>
    </section>

  <section class="yk-section" id="color" aria-labelledby="color-title">
    <div class="yk-section-head">
      <p class="eyebrow">TONIGHT'S COLOUR</p>
      ${t.color_title}
      ${t.yk_section_lead}
    </div>
    <article class="yk-spot" id="yk-tokyo-tower">
      <figure class="yk-figure">
        ${t.copy12}
        ${t.copy13}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta}
        ${t.copy14}
        ${t.yk_spot_lead}
        ${t.copy15}
        ${t.copy16}
        ${t.copy17}
        ${t.yk_more}
      </div>
    </article>
    <article class="yk-spot has-day-photo" id="yk-odawara-castle">
      <figure class="yk-figure is-day">
        ${t.copy18}
        ${t.yk_day_note}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta2}
        ${t.copy19}
        ${t.yk_spot_lead2}
        ${t.copy20}
        ${t.copy21}
      ${t.yk_official}
        ${t.yk_more2}
      </div>
    </article>
  </section>

  <section class="yk-section" id="lightup" aria-labelledby="lightup-title">
    <div class="yk-section-head">
      <p class="eyebrow">SEASONAL LIGHT-UP</p>
      ${t.lightup_title}
      ${t.yk_section_lead2}
    </div>
    <article class="yk-spot" id="yk-kiyosu">
      <figure class="yk-figure">
        ${t.copy22}
        ${t.copy23}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta3}
        ${t.copy24}
        ${t.yk_spot_lead3}
        ${t.copy25}
        ${t.copy26}
      ${t.yk_official2}
        ${t.yk_more3}
      </div>
    </article>
    <article class="yk-spot" id="yk-kakegawa">
      <figure class="yk-figure">
        ${t.copy27}
        ${t.copy28}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta4}
        ${t.copy29}
        ${t.yk_spot_lead4}
        ${t.copy30}
        ${t.copy31}
      ${t.yk_official3}
        ${t.yk_more4}
      </div>
    </article>
    <article class="yk-spot" id="yk-toji">
      <figure class="yk-figure">
        ${t.copy32}
        ${t.copy33}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta5}
        ${t.copy34}
        ${t.yk_spot_lead5}
        ${t.copy35}
        ${t.copy36}
      ${t.yk_official4}
        ${t.yk_more5}
      </div>
    </article>
  </section>

  <section class="yk-section" id="citylight" aria-labelledby="citylight-title">
    <div class="yk-section-head">
      <p class="eyebrow">SEA OF LIGHTS</p>
      ${t.citylight_title}
      ${t.yk_section_lead3}
    </div>
    <article class="yk-spot" id="yk-musashi-kosugi-towers">
      <figure class="yk-figure">
        ${t.copy37}
        ${t.copy38}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta6}
        ${t.copy39}
        ${t.yk_spot_lead6}
        ${t.copy40}
        ${t.copy41}
        ${t.yk_more6}
      </div>
    </article>
    <article class="yk-spot" id="yk-nagoya-station-skyline">
      <figure class="yk-figure">
        ${t.copy42}
        ${t.copy43}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta7}
        ${t.copy44}
        ${t.yk_spot_lead7}
        ${t.copy45}
        ${t.copy46}
        ${t.yk_more7}
      </div>
    </article>
  </section>

  <section class="yk-section" id="onlyatnight" aria-labelledby="onlyatnight-title">
    <div class="yk-section-head">
      <p class="eyebrow">BETTER AFTER DARK</p>
      ${t.onlyatnight_title}
      ${t.yk_section_lead4}
    </div>
    <article class="yk-spot" id="yk-maruko-bridge">
      <figure class="yk-figure">
        ${t.copy47}
        ${t.copy48}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta8}
        ${t.copy49}
        ${t.yk_spot_lead8}
        ${t.copy50}
        ${t.copy51}
        ${t.yk_more8}
      </div>
    </article>
    <article class="yk-spot" id="yk-shimizu-port-chikyu">
      <figure class="yk-figure">
        ${t.copy52}
        ${t.copy53}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta9}
        ${t.copy54}
        ${t.yk_spot_lead9}
        ${t.copy55}
        ${t.copy56}
        ${t.yk_more9}
      </div>
    </article>
    <article class="yk-spot" id="yk-nichiban-anjo">
      <figure class="yk-figure">
        ${t.copy57}
        ${t.copy58}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta10}
        ${t.copy59}
        ${t.yk_spot_lead10}
        ${t.copy60}
        ${t.copy61}
        ${t.yk_more10}
      </div>
    </article>
    <article class="yk-spot" id="yk-sennenq-sign">
      <figure class="yk-figure">
        ${t.copy62}
        ${t.copy63}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta11}
        ${t.copy64}
        ${t.yk_spot_lead11}
        ${t.copy65}
        ${t.copy66}
        ${t.yk_more11}
      </div>
    </article>
    <article class="yk-spot" id="yk-lotte-shiga">
      <figure class="yk-figure">
        ${t.copy67}
        ${t.copy68}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta12}
        ${t.copy69}
        ${t.yk_spot_lead12}
        ${t.copy70}
        ${t.copy71}
        ${t.yk_more12}
      </div>
    </article>
    <article class="yk-spot" id="yk-seta-karahashi">
      <figure class="yk-figure">
        ${t.copy72}
        ${t.copy73}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta13}
        ${t.copy74}
        ${t.yk_spot_lead13}
        ${t.copy75}
        ${t.copy76}
        ${t.yk_more13}
      </div>
    </article>
    <article class="yk-spot" id="yk-hirakata-park-wheel">
      <figure class="yk-figure">
        ${t.copy77}
        ${t.copy78}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta14}
        ${t.copy79}
        ${t.yk_spot_lead14}
        ${t.copy80}
        ${t.copy81}
      ${t.yk_official5}
        ${t.yk_more14}
      </div>
    </article>
    <article class="yk-spot" id="yk-torikai-train-depot">
      <figure class="yk-figure">
        ${t.copy82}
        ${t.copy83}
      </figure>
      <div class="yk-spot-body">
        ${t.yk_spot_meta15}
        ${t.copy84}
        ${t.yk_spot_lead15}
        ${t.copy85}
        ${t.copy86}
        ${t.yk_more15}
      </div>
    </article>
  </section>

    <section class="yk-tips" aria-labelledby="ykTipsTitle">
      ${t.ykTipsTitle}
      ${t.yk_tips_lead}
      <ul class="yk-tip-list">
        ${t.copy87}
        ${t.copy88}
        ${t.copy89}
        ${t.copy90}
      </ul>
    </section>

    <section class="yk-note" aria-labelledby="ykNoteTitle">
      <div class="yk-note-card">
        ${t.ykNoteTitle}
        ${t.copy91}
        ${t.copy92}
        ${t.copy93}
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
    ${t.copy94}
    ${t.footer_links}
    ${t.footer_credit}
  </footer>

  <script>
    // 載せるスポットの一覧だけ。分数・席側・名前は data.js（data-runtime.js）から読む
    window.YAKEI_SPOT_IDS = ["tokyo-tower","maruko-bridge","musashi-kosugi-towers","odawara-castle","shimizu-port-chikyu","kakegawa","nichiban-anjo","nagoya-station-skyline","kiyosu","sennenq-sign","lotte-shiga","seta-karahashi","toji","hirakata-park-wheel","torikai-train-depot"];
    ${t.copy95}
  </script>
  <script src="${p}spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script>
  <script src="${p}spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script>
  <script src="${p}data/timetable.js?v=${assetVersion('data/timetable.js')}"></script>
  <script src="${p}data-runtime.js?v=${assetVersion('data-runtime.js')}"></script>
  <script src="${p}track.js?v=${assetVersion('track.js')}"></script>
  <script src="${p}train-select.js?v=${assetVersion('train-select.js')}"></script>
  <script src="${p}train-picker.js?v=${assetVersion('train-picker.js')}"></script>
  <script src="${p}yakei.js?v=${assetVersion('yakei.js')}"></script>
</body>
</html>
`;
}

for (const lang of ['ja', 'en']) {
  const dest = path.join(root, lang === 'ja' ? 'yakei.html' : 'en/yakei.html');
  const html = render(lang);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error('yakei page out of date: ' + dest);
  } else {
    fs.writeFileSync(dest, html);
  }
}
console.log('yakei pages: ja + en from one template.');
