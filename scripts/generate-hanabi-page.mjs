import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetVersion } from './shared/asset-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.michikusa-travel.com';

// 花火特集の日英ページを1つの雛形から出す。2026-09-22までは手書きの2ファイルで、
// 同じマークアップが両方に重複していた（FEATURE-GEN-0922）。
//
// **COPY は日英で別々に持つ。片方を訳してもう片方にしない。**
// 文章を直すときは、直す言語の側だけを直す。対で並べ直すと、次の修正で片方が訳へ戻る。
const COPY = {
 "ja": {
  "copy": "<title>新幹線から見える花火｜長岡・戸田橋・いたばし・淀川・熱海・安倍川など7大会 | 新幹線の窓</title>",
  "copy2": "<meta name=\"description\" content=\"走る新幹線の車窓から花火が見えた、という投稿を大会ごとに集めました。長岡まつり、いたばし・戸田橋、北國花火、なにわ淀川、熱海海上、安倍川、弁天島の7大会。夜の窓で花火を探すコツと、各大会の公式案内へのリンクつき。\">",
  "copy3": "<meta property=\"og:site_name\" content=\"新幹線の窓\">",
  "copy4": "<meta property=\"og:locale\" content=\"ja_JP\">",
  "copy5": "<meta property=\"og:title\" content=\"新幹線から見える花火\">",
  "copy6": "<meta property=\"og:description\" content=\"走る新幹線の車窓から花火が見えた、という投稿を大会ごとに集めました。開催日と時刻は各大会の公式案内へ。\">",
  "copy7": "<meta property=\"og:image:alt\" content=\"夜空に大きく開いた花火\">",
  "copy8": "<meta name=\"twitter:title\" content=\"新幹線から見える花火\">",
  "copy9": "<meta name=\"twitter:description\" content=\"走る新幹線の車窓から花火が見えた、という投稿を大会ごとに集めました。開催日と時刻は各大会の公式案内へ。\">",
  "copy10": "<meta name=\"twitter:image:alt\" content=\"夜空に大きく開いた花火\">",
  "copy11": ".hb-hero::before { content: \"\"; position: absolute; inset: 0; z-index: -2; background-image: url(\"images/hanabi-hero-pd.jpg\"); background-size: cover; background-position: center 42%; }",
  "hanabi_page": "<body class=\"hanabi-page spot-page spot-page-utility\" data-page=\"hanabi\" data-spot-page-shared-context=\"utility\" data-spot-page-shared-lang=\"ja\" data-spot-page-shared-root=\"./\" data-spot-page-shared-route=\"hanabi.html\">",
  "hbTitle": "<h1 id=\"hbTitle\">新幹線から見える花火</h1>",
  "hb_hero_lead": "<p class=\"hb-hero-lead\">狙って見るのは難しいけれど、運がいいと出会えます。「新幹線から花火が見えた」という投稿を、大会ごとに集めました。</p>",
  "hb_hero_stat": "<p class=\"hb-hero-stat\">7大会 ／ 24件の投稿・動画</p>",
  "hb_jump": "<nav class=\"hb-jump\" aria-label=\"花火大会一覧\">",
  "copy12": "<a href=\"#hb-nagaoka\">長岡まつり大花火大会</a>",
  "copy13": "<a href=\"#hb-itabashi-toda\">いたばし花火大会・戸田橋花火大会</a>",
  "copy14": "<a href=\"#hb-hokkoku\">北國花火</a>",
  "copy15": "<a href=\"#hb-yodogawa\">なにわ淀川花火大会</a>",
  "copy16": "<a href=\"#hb-atami\">熱海海上花火大会</a>",
  "copy17": "<a href=\"#hb-abekawa\">安倍川花火大会</a>",
  "copy18": "<a href=\"#hb-bentenjima\">弁天島花火大会</a>",
  "eyebrow": "<p class=\"eyebrow\">東北・上越・北陸新幹線</p>",
  "east_title": "<h2 id=\"east-title\">東北・上越・北陸新幹線から</h2>",
  "hb_section_lead": "<p class=\"hb-section-lead\">東京を出て大宮までは、東北・上越・北陸・山形・秋田が同じ線路を走ります。その先は信濃川の長岡へ、日本海側の金沢へ。</p>",
  "hb_nagaoka_title": "<h3 id=\"hb-nagaoka-title\">長岡まつり大花火大会</h3>",
  "hb_place": "<p class=\"hb-place\">信濃川／長岡駅周辺</p>",
  "copy19": "<p>信濃川の両岸を使って開かれる、日本を代表する花火大会です。正三尺玉、そして川幅いっぱいに広がる復興祈願花火「フェニックス」。規模でいえば、このページで一番大きな花火です。</p>",
  "copy20": "<p>上越新幹線は長岡駅を通ります。会場が駅からそう遠くないため、走行中の車窓からのものと、駅・ホーム・沿線からのものが混ざって投稿されています。同じ花火が、乗っている人と待っている人の両方から撮られています。</p>",
  "hb_official_label": "<p class=\"hb-official-label\">開催日・打上時刻・観覧情報は公式へ</p>",
  "copy21": "<a href=\"https://nagaokamatsuri.com/\" target=\"_blank\" rel=\"noopener noreferrer\">長岡花火 公式ウェブサイト（長岡花火財団）</a>",
  "hb_media_frame": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">長岡まつり大花火大会の投稿 <a href=\"https://x.com/TohruIshizaki/status/1819351426700882177\">元投稿を見る</a></p>&mdash; @TohruIshizaki <a href=\"https://x.com/TohruIshizaki/status/1819351426700882177\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/TohruIshizaki/status/1819351426700882177\" target=\"_blank\" rel=\"noopener noreferrer\">@TohruIshizaki／元投稿を見る</a></p>",
  "hb_media_frame2": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">長岡まつり大花火大会の投稿 <a href=\"https://x.com/tak860/status/1951976006895673813\">元投稿を見る</a></p>&mdash; @tak860 <a href=\"https://x.com/tak860/status/1951976006895673813\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit2": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/tak860/status/1951976006895673813\" target=\"_blank\" rel=\"noopener noreferrer\">@tak860／元投稿を見る</a></p>",
  "hb_media_frame3": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">長岡まつり大花火大会の投稿 <a href=\"https://x.com/yk11rr16/status/1951973598698303887\">元投稿を見る</a></p>&mdash; @yk11rr16 <a href=\"https://x.com/yk11rr16/status/1951973598698303887\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit3": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/yk11rr16/status/1951973598698303887\" target=\"_blank\" rel=\"noopener noreferrer\">@yk11rr16／元投稿を見る</a></p>",
  "hb_media_frame4": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">長岡まつり大花火大会の投稿 <a href=\"https://x.com/eruyon_gen/status/2084235458931044713\">元投稿を見る</a></p>&mdash; @eruyon_gen <a href=\"https://x.com/eruyon_gen/status/2084235458931044713\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit4": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/eruyon_gen/status/2084235458931044713\" target=\"_blank\" rel=\"noopener noreferrer\">@eruyon_gen／元投稿を見る</a></p>",
  "hb_media_frame5": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">長岡まつり大花火大会の投稿 <a href=\"https://x.com/travelinNiigata/status/1554787647805018118\">元投稿を見る</a></p>&mdash; @travelinNiigata <a href=\"https://x.com/travelinNiigata/status/1554787647805018118\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit5": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/travelinNiigata/status/1554787647805018118\" target=\"_blank\" rel=\"noopener noreferrer\">@travelinNiigata／元投稿を見る</a></p>",
  "hb_media_frame6": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">長岡まつり大花火大会の投稿 <a href=\"https://x.com/T_KAWAI_SANGIIN/status/1687101353280389120\">元投稿を見る</a></p>&mdash; @T_KAWAI_SANGIIN <a href=\"https://x.com/T_KAWAI_SANGIIN/status/1687101353280389120\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit6": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/T_KAWAI_SANGIIN/status/1687101353280389120\" target=\"_blank\" rel=\"noopener noreferrer\">@T_KAWAI_SANGIIN／元投稿を見る</a></p>",
  "hb_itabashi_toda_title": "<h3 id=\"hb-itabashi-toda-title\">いたばし花火大会・戸田橋花火大会</h3>",
  "hb_place2": "<p class=\"hb-place\">荒川／東京 → 大宮</p>",
  "copy22": "<p>荒川をはさんで、東京都板橋区側が「いたばし花火大会」、埼玉県戸田市側が「戸田橋花火大会」。別々の主催者が同じ日・同じ時刻に開き、両岸あわせて一つの大きな花火大会になります。</p>",
  "copy23": "<p>東京から大宮へ向かう新幹線は、この荒川を渡ります。東北・上越・北陸・山形・秋田のどれに乗っていても通る区間なので、対象になる列車の幅がいちばん広い花火です。</p>",
  "hb_official_label2": "<p class=\"hb-official-label\">開催日・打上時刻・観覧情報は公式へ</p>",
  "copy24": "<a href=\"https://itabashihanabi.jp/\" target=\"_blank\" rel=\"noopener noreferrer\">いたばし花火大会 公式サイト</a>",
  "copy25": "<a href=\"https://www.city.toda.saitama.jp/\" target=\"_blank\" rel=\"noopener noreferrer\">戸田市公式サイト（戸田橋花火大会）</a>",
  "hb_media_frame7": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">いたばし花火大会・戸田橋花火大会の投稿 <a href=\"https://x.com/Y_Tomekiti/status/2083515853098901508\">元投稿を見る</a></p>&mdash; @Y_Tomekiti <a href=\"https://x.com/Y_Tomekiti/status/2083515853098901508\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit7": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/Y_Tomekiti/status/2083515853098901508\" target=\"_blank\" rel=\"noopener noreferrer\">@Y_Tomekiti／元投稿を見る</a></p>",
  "hb_media_frame8": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">いたばし花火大会・戸田橋花火大会の投稿 <a href=\"https://x.com/otatama_anime/status/2083497139674743126\">元投稿を見る</a></p>&mdash; @otatama_anime <a href=\"https://x.com/otatama_anime/status/2083497139674743126\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit8": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/otatama_anime/status/2083497139674743126\" target=\"_blank\" rel=\"noopener noreferrer\">@otatama_anime／元投稿を見る</a></p>",
  "hb_media_frame9": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">いたばし花火大会・戸田橋花火大会の投稿 <a href=\"https://x.com/kamofuru334/status/2083503760480022644\">元投稿を見る</a></p>&mdash; @kamofuru334 <a href=\"https://x.com/kamofuru334/status/2083503760480022644\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit9": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/kamofuru334/status/2083503760480022644\" target=\"_blank\" rel=\"noopener noreferrer\">@kamofuru334／元投稿を見る</a></p>",
  "hb_media_frame10": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">いたばし花火大会・戸田橋花火大会の投稿 <a href=\"https://x.com/miyu_tsubuki/status/1819742476909052349\">元投稿を見る</a></p>&mdash; @miyu_tsubuki <a href=\"https://x.com/miyu_tsubuki/status/1819742476909052349\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit10": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/miyu_tsubuki/status/1819742476909052349\" target=\"_blank\" rel=\"noopener noreferrer\">@miyu_tsubuki／元投稿を見る</a></p>",
  "hb_media_frame11": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">いたばし花火大会・戸田橋花火大会の投稿 <a href=\"https://x.com/yanochem/status/1819697407300440492\">元投稿を見る</a></p>&mdash; @yanochem <a href=\"https://x.com/yanochem/status/1819697407300440492\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit11": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/yanochem/status/1819697407300440492\" target=\"_blank\" rel=\"noopener noreferrer\">@yanochem／元投稿を見る</a></p>",
  "hb_hokkoku_title": "<h3 id=\"hb-hokkoku-title\">北國花火</h3>",
  "hb_place3": "<p class=\"hb-place\">犀川緑地・手取川河川敷／金沢 → 小松</p>",
  "copy26": "<p>北國新聞社が主催する石川県の花火大会です。金沢市の犀川緑地周辺で開かれる金沢大会と、川北町の手取川河川敷で開かれる川北大会があります。</p>",
  "copy27": "<p>北陸新幹線は金沢駅を通り、その先で小松・加賀温泉へ向かいます。どちらの会場も、この区間の沿線からそう遠くない場所にあります。</p>",
  "hb_official_label3": "<p class=\"hb-official-label\">開催日・打上時刻・観覧情報は公式へ</p>",
  "copy28": "<a href=\"http://hk-event.jp/hanabi/\" target=\"_blank\" rel=\"noopener noreferrer\">北國花火 公式サイト</a>",
  "hb_media_frame12": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">北國花火の投稿 <a href=\"https://x.com/sugipi04/status/2081011458998210577\">元投稿を見る</a></p>&mdash; @sugipi04 <a href=\"https://x.com/sugipi04/status/2081011458998210577\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit12": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/sugipi04/status/2081011458998210577\" target=\"_blank\" rel=\"noopener noreferrer\">@sugipi04／元投稿を見る</a></p>",
  "eyebrow2": "<p class=\"eyebrow\">東海道新幹線</p>",
  "tokaido_title": "<h2 id=\"tokaido-title\">東海道新幹線から</h2>",
  "hb_section_lead2": "<p class=\"hb-section-lead\">東京〜新大阪。海沿い、大きな川、湖と、夏の花火が上がる場所を何度も通ります。</p>",
  "hb_yodogawa_title": "<h3 id=\"hb-yodogawa-title\">なにわ淀川花火大会</h3>",
  "hb_place4": "<p class=\"hb-place\">淀川河川敷／京都 → 新大阪</p>",
  "copy29": "<p>大阪・淀川の河川敷で開かれる花火大会です。東海道新幹線は新大阪に着く直前に淀川を渡ります。終点間際、まさに降りようとしている時間帯に、窓の外で上がっていることになります。</p>",
  "copy30": "<p>このページで最も投稿が集まったのがこの大会でした。新幹線、在来線、高層階と、大阪の街のいろいろな高さから撮られています。</p>",
  "hb_official_label4": "<p class=\"hb-official-label\">開催日・打上時刻・観覧情報は公式へ</p>",
  "copy31": "<a href=\"https://www.yodohanabi.com/\" target=\"_blank\" rel=\"noopener noreferrer\">なにわ淀川花火大会 公式サイト</a>",
  "hb_media_frame13": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">なにわ淀川花火大会の投稿 <a href=\"https://x.com/CALSEED1/status/1819691501435367749\">元投稿を見る</a></p>&mdash; @CALSEED1 <a href=\"https://x.com/CALSEED1/status/1819691501435367749\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit13": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/CALSEED1/status/1819691501435367749\" target=\"_blank\" rel=\"noopener noreferrer\">@CALSEED1／元投稿を見る</a></p>",
  "hb_media_frame14": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">なにわ淀川花火大会の投稿 <a href=\"https://x.com/shogo_aida/status/1563772668108627969\">元投稿を見る</a></p>&mdash; @shogo_aida <a href=\"https://x.com/shogo_aida/status/1563772668108627969\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit14": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/shogo_aida/status/1563772668108627969\" target=\"_blank\" rel=\"noopener noreferrer\">@shogo_aida／元投稿を見る</a></p>",
  "hb_media_frame15": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">なにわ淀川花火大会の投稿 <a href=\"https://x.com/muucha28/status/1979508895048699977\">元投稿を見る</a></p>&mdash; @muucha28 <a href=\"https://x.com/muucha28/status/1979508895048699977\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit15": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/muucha28/status/1979508895048699977\" target=\"_blank\" rel=\"noopener noreferrer\">@muucha28／元投稿を見る</a></p>",
  "hb_media_frame16": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">なにわ淀川花火大会の投稿 <a href=\"https://x.com/taketakeyosi/status/1687791775912718336\">元投稿を見る</a></p>&mdash; @taketakeyosi <a href=\"https://x.com/taketakeyosi/status/1687791775912718336\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit16": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/taketakeyosi/status/1687791775912718336\" target=\"_blank\" rel=\"noopener noreferrer\">@taketakeyosi／元投稿を見る</a></p>",
  "hb_media_frame17": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">なにわ淀川花火大会の投稿 <a href=\"https://x.com/kannma13_crz/status/1979531116848799804\">元投稿を見る</a></p>&mdash; @kannma13_crz <a href=\"https://x.com/kannma13_crz/status/1979531116848799804\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit17": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/kannma13_crz/status/1979531116848799804\" target=\"_blank\" rel=\"noopener noreferrer\">@kannma13_crz／元投稿を見る</a></p>",
  "hb_media_frame18": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">なにわ淀川花火大会の投稿 <a href=\"https://x.com/Tama_BuriBuri/status/1687777523978186752\">元投稿を見る</a></p>&mdash; @Tama_BuriBuri <a href=\"https://x.com/Tama_BuriBuri/status/1687777523978186752\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit18": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/Tama_BuriBuri/status/1687777523978186752\" target=\"_blank\" rel=\"noopener noreferrer\">@Tama_BuriBuri／元投稿を見る</a></p>",
  "hb_media_frame19": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">なにわ淀川花火大会の投稿 <a href=\"https://x.com/bizen_akasaki/status/1687783339934068737\">元投稿を見る</a></p>&mdash; @bizen_akasaki <a href=\"https://x.com/bizen_akasaki/status/1687783339934068737\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit19": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/bizen_akasaki/status/1687783339934068737\" target=\"_blank\" rel=\"noopener noreferrer\">@bizen_akasaki／元投稿を見る</a></p>",
  "hb_atami_title": "<h3 id=\"hb-atami-title\">熱海海上花火大会</h3>",
  "hb_place5": "<p class=\"hb-place\">熱海湾（相模湾）／小田原 → 熱海</p>",
  "copy32": "<p>熱海湾の海上から打ち上がる花火大会です。東海道新幹線は小田原を出ると相模湾側へ出て、熱海駅に着きます。海と街のあいだを走る、線路としてはかなり海に近い区間です。</p>",
  "copy33": "<p>この大会がほかと違うのは、<strong>夏だけではない</strong>ことです。多くの花火大会が7月・8月に集中するのに対し、熱海は秋から冬にかけても開催され、年に十数回あります。打上時間も夏とそれ以外で変わります。旅の予定が夏でなくても、日程が重なる可能性があるということです。</p>",
  "copy34": "<p>当サイトの車窓スポット「熱海と相模湾」は<strong>A席側</strong>（東京発の進行左）に登録しています。海の方角の目安として使ってください。</p>",
  "hb_related": "<p class=\"hb-related\"><a href=\"spots/odawara.html\">車窓スポット「熱海と相模湾」を見る</a></p>",
  "hb_official_label5": "<p class=\"hb-official-label\">開催日・打上時刻・観覧情報は公式へ</p>",
  "copy35": "<a href=\"https://www.ataminews.gr.jp/event/8/\" target=\"_blank\" rel=\"noopener noreferrer\">あたみニュース（熱海市観光協会）｜熱海海上花火大会</a>",
  "k3iH_NC9h_xg": "<div class=\"hb-embed\" data-embed=\"youtube\" data-video-id=\"3iH_NC9h-xg\" data-video-title=\"熱海海上花火大会の動画（YouTube）\">",
  "hb_media_frame20": "<div class=\"hb-media-frame\" data-placeholder=\"YouTubeの動画\">",
  "hb_facade": "<button class=\"hb-facade\" type=\"button\"><span class=\"hb-facade-play\" aria-hidden=\"true\"></span><span class=\"hb-facade-label\">熱海海上花火大会の動画（YouTube）を読み込む</span></button>",
  "hb_credit20": "<p class=\"hb-credit\">YouTube：<a href=\"https://www.youtube.com/watch?v=3iH_NC9h-xg\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る</a></p>",
  "hb_media_frame21": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">熱海海上花火大会の投稿 <a href=\"https://x.com/tokyootkinchan/status/2048583311069761559\">元投稿を見る</a></p>&mdash; @tokyootkinchan <a href=\"https://x.com/tokyootkinchan/status/2048583311069761559\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit21": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/tokyootkinchan/status/2048583311069761559\" target=\"_blank\" rel=\"noopener noreferrer\">@tokyootkinchan／元投稿を見る</a></p>",
  "hb_abekawa_title": "<h3 id=\"hb-abekawa-title\">安倍川花火大会</h3>",
  "hb_place6": "<p class=\"hb-place\">安倍川河川敷／静岡 → 掛川</p>",
  "copy36": "<p>静岡市の安倍川河川敷で開かれる花火大会です。東海道新幹線は静岡駅を出てすぐ安倍川を渡るため、打上会場と線路の距離が近い部類に入ります。</p>",
  "copy37": "<p>川を渡る一瞬は左右どちらの窓からも川面が見えます。渡る前後で見える方角が入れ替わる点だけ頭に入れておくと探しやすくなります。</p>",
  "hb_official_label6": "<p class=\"hb-official-label\">開催日・打上時刻・観覧情報は公式へ</p>",
  "copy38": "<a href=\"https://www.abekawa-hanabi.com/\" target=\"_blank\" rel=\"noopener noreferrer\">安倍川花火大会 公式ウェブサイト</a>",
  "mmrTfBbwW_I": "<div class=\"hb-embed\" data-embed=\"youtube\" data-video-id=\"mmrTfBbwW-I\" data-video-title=\"安倍川花火大会の動画（YouTube）\">",
  "hb_media_frame22": "<div class=\"hb-media-frame\" data-placeholder=\"YouTubeの動画\">",
  "hb_facade2": "<button class=\"hb-facade\" type=\"button\"><span class=\"hb-facade-play\" aria-hidden=\"true\"></span><span class=\"hb-facade-label\">安倍川花火大会の動画（YouTube）を読み込む</span></button>",
  "hb_credit22": "<p class=\"hb-credit\">YouTube：<a href=\"https://www.youtube.com/watch?v=mmrTfBbwW-I\" target=\"_blank\" rel=\"noopener noreferrer\">元動画を見る</a></p>",
  "hb_media_frame23": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">安倍川花火大会の投稿 <a href=\"https://x.com/koo_pcengine/status/2078448699014074615\">元投稿を見る</a></p>&mdash; @koo_pcengine <a href=\"https://x.com/koo_pcengine/status/2078448699014074615\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit23": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/koo_pcengine/status/2078448699014074615\" target=\"_blank\" rel=\"noopener noreferrer\">@koo_pcengine／元投稿を見る</a></p>",
  "hb_bentenjima_title": "<h3 id=\"hb-bentenjima-title\">弁天島花火大会</h3>",
  "hb_place7": "<p class=\"hb-place\">浜名湖・弁天島／浜松 → 豊橋</p>",
  "copy39": "<p>浜名湖の弁天島周辺で打ち上がる花火大会です。東海道新幹線は浜松を出ると浜名湖の上を橋で渡ります。湖面が開けるぶん、視界をさえぎるものが少ない区間です。</p>",
  "copy40": "<p>当サイトの車窓スポット「浜名湖」は<strong>E席側</strong>（東京発の進行右）に登録しています。</p>",
  "hb_related2": "<p class=\"hb-related\"><a href=\"spots/hamanako.html\">車窓スポット「浜名湖」を見る</a></p>",
  "hb_official_label7": "<p class=\"hb-official-label\">開催日・打上時刻・観覧情報は公式へ</p>",
  "copy41": "<a href=\"https://jp-hamamatsu.com/\" target=\"_blank\" rel=\"noopener noreferrer\">浜松市観光協会 公式サイト</a>",
  "hb_media_frame24": "<div class=\"hb-media-frame\" data-placeholder=\"X（旧Twitter）の投稿\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"ja\" dir=\"ltr\">弁天島花火大会の投稿 <a href=\"https://x.com/sh_ka1974/status/2073360185918365881\">元投稿を見る</a></p>&mdash; @sh_ka1974 <a href=\"https://x.com/sh_ka1974/status/2073360185918365881\">元投稿を見る</a></blockquote></template></div>",
  "hb_credit24": "<p class=\"hb-credit\">投稿：<a href=\"https://x.com/sh_ka1974/status/2073360185918365881\" target=\"_blank\" rel=\"noopener noreferrer\">@sh_ka1974／元投稿を見る</a></p>",
  "hbTipsTitle": "<h2 id=\"hbTipsTitle\">夜の窓で、花火を探すときのこと</h2>",
  "copy42": "<li><strong>いちばんの敵は、車内の照明</strong>夜の新幹線の窓は、外より車内のほうが明るいため鏡のように反射します。花火が見えない原因の多くは、距離ではなくこの映り込みです。顔と手で窓のまわりを覆って影をつくると、外が見えるようになります。</li>",
  "copy43": "<li><strong>撮るなら、レンズを窓にぴったりつける</strong>スマホやカメラを窓から離すほど、車内の光がそのまま写り込みます。レンズを窓ガラスに密着させると映り込みがぐっと減ります。それでも走行中の夜間撮影は難しいので、まずは肉眼で見ておくのが確実です。</li>",
  "hbDisclaimerTitle": "<h2 id=\"hbDisclaimerTitle\">掲載について</h2>",
  "copy44": "<p>動画・写真は転載していません。XとYouTubeの公式な埋め込み機能で表示し、それぞれの投稿者・元投稿へのリンクを添えています。投稿者ご本人から掲載の取り下げのご希望があれば、お問い合わせから連絡をいただき次第、削除します。</p>",
  "copy45": "<p>掲載している投稿の撮影年は同一ではありません。過去の回のものを含みます。線路と会場の位置関係についての記述は地理的な説明であり、見えることを保証するものではありません。開催日・打上時刻は年によって変わり、中止や順延もあります。各大会の公式案内をご確認ください。</p>",
  "copy46": "<p>各花火大会の名称・開催情報の権利は、それぞれの主催者に帰属します。ヒーローの背景写真は Jon Sullivan 氏によるパブリックドメイン画像です。</p>",
  "footer_brand": "<p class=\"footer-brand\">新幹線の窓 <span>旅の瞬間を見逃さない</span></p>",
  "copy47": "<p>時刻は目安です。列車・天候・座席位置により見え方は変わります。</p>",
  "footer_links": "<p class=\"footer-links\"><a href=\"index.html\">TOP</a> · <a href=\"guide.html\">富士山の見方</a> · <a href=\"references.html\">車窓リンク集</a> · <a href=\"contact.html\">お問い合わせ</a> · <a href=\"privacy.html\">プライバシーポリシー</a></p>",
  "footer_credit": "<p class=\"footer-credit\">道草 / Michikusa — 急がない旅と、偶然の発見を。</p>"
 },
 "en": {
  "copy": "<title>Fireworks Seen from the Shinkansen | 7 festivals along Japan's bullet train lines | Shinkansen Window</title>",
  "copy2": "<meta name=\"description\" content=\"Passengers really do catch fireworks from the window of a moving Shinkansen. Posts collected festival by festival: Nagaoka, Itabashi and Todabashi, Hokkoku, Naniwa Yodogawa, Atami, Abekawa and Bentenjima. Plus how to beat window reflections at night, and links to every organizer.\">",
  "copy3": "<meta property=\"og:site_name\" content=\"Shinkansen Window\">",
  "copy4": "<meta property=\"og:locale\" content=\"en_US\">",
  "copy5": "<meta property=\"og:title\" content=\"Fireworks Seen from the Shinkansen\">",
  "copy6": "<meta property=\"og:description\" content=\"Posts from passengers who caught fireworks from a moving Shinkansen, gathered festival by festival. Dates and launch times are on each organizer's official site.\">",
  "copy7": "<meta property=\"og:image:alt\" content=\"A large firework bursting in the night sky\">",
  "copy8": "<meta name=\"twitter:title\" content=\"Fireworks Seen from the Shinkansen\">",
  "copy9": "<meta name=\"twitter:description\" content=\"Posts from passengers who caught fireworks from a moving Shinkansen, gathered festival by festival. Dates and launch times are on each organizer's official site.\">",
  "copy10": "<meta name=\"twitter:image:alt\" content=\"A large firework bursting in the night sky\">",
  "copy11": ".hb-hero::before { content: \"\"; position: absolute; inset: 0; z-index: -2; background-image: url(\"../images/hanabi-hero-pd.jpg\"); background-size: cover; background-position: center 42%; }",
  "hanabi_page": "<body class=\"hanabi-page spot-page spot-page-utility\" data-page=\"hanabi\" data-spot-page-shared-context=\"utility\" data-spot-page-shared-lang=\"en\" data-spot-page-shared-root=\"../\" data-spot-page-shared-route=\"hanabi.html\">",
  "hbTitle": "<h1 id=\"hbTitle\">Fireworks Seen from the Shinkansen</h1>",
  "hb_hero_lead": "<p class=\"hb-hero-lead\">You cannot really plan for it, but with a little luck it happens. Here are posts from people who caught fireworks from the window, gathered festival by festival.</p>",
  "hb_hero_stat": "<p class=\"hb-hero-stat\">7 festivals · 24 posts and videos</p>",
  "hb_jump": "<nav class=\"hb-jump\" aria-label=\"Festivals on this page\">",
  "copy12": "<a href=\"#hb-nagaoka\">Nagaoka Festival Grand Fireworks</a>",
  "copy13": "<a href=\"#hb-itabashi-toda\">Itabashi and Todabashi Fireworks</a>",
  "copy14": "<a href=\"#hb-hokkoku\">Hokkoku Fireworks</a>",
  "copy15": "<a href=\"#hb-yodogawa\">Naniwa Yodogawa Fireworks</a>",
  "copy16": "<a href=\"#hb-atami\">Atami Sea Fireworks</a>",
  "copy17": "<a href=\"#hb-abekawa\">Abekawa Fireworks</a>",
  "copy18": "<a href=\"#hb-bentenjima\">Bentenjima Fireworks</a>",
  "eyebrow": "<p class=\"eyebrow\">Tohoku, Joetsu and Hokuriku Shinkansen</p>",
  "east_title": "<h2 id=\"east-title\">Tohoku, Joetsu and Hokuriku Shinkansen</h2>",
  "hb_section_lead": "<p class=\"hb-section-lead\">Between Tokyo and Omiya the Tohoku, Joetsu, Hokuriku, Yamagata and Akita lines all share one track. Beyond that they run on to Nagaoka on the Shinano River, and to Kanazawa on the Japan Sea coast.</p>",
  "hb_nagaoka_title": "<h3 id=\"hb-nagaoka-title\">Nagaoka Festival Grand Fireworks</h3>",
  "hb_place": "<p class=\"hb-place\">Shinano River, near Nagaoka Station</p>",
  "copy19": "<p>One of Japan's great fireworks festivals, staged along both banks of the Shinano River. It is known for its enormous shakudama shells and for &ldquo;Phoenix&rdquo;, a recovery-prayer sequence that spreads across roughly two kilometres of riverfront. In sheer scale this is the largest festival on this page.</p>",
  "copy20": "<p>The Joetsu Shinkansen calls at Nagaoka, and the launch site is not far from the station. That is why the posts here mix two viewpoints: passengers filming from a moving train, and people waiting on the platform or standing along the line.</p>",
  "hb_official_label": "<p class=\"hb-official-label\">Dates, launch times and viewing info are on the official sites</p>",
  "copy21": "<a href=\"https://nagaokamatsuri.com/\" target=\"_blank\" rel=\"noopener noreferrer\">Nagaoka Fireworks official site (Nagaoka Fireworks Foundation)</a>",
  "hb_media_frame": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Nagaoka Festival Grand Fireworks post <a href=\"https://x.com/TohruIshizaki/status/1819351426700882177\">see the original post</a></p>&mdash; @TohruIshizaki <a href=\"https://x.com/TohruIshizaki/status/1819351426700882177\">see the original post</a></blockquote></template></div>",
  "hb_credit": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/TohruIshizaki/status/1819351426700882177\" target=\"_blank\" rel=\"noopener noreferrer\">@TohruIshizaki／see the original post</a></p>",
  "hb_media_frame2": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Nagaoka Festival Grand Fireworks post <a href=\"https://x.com/tak860/status/1951976006895673813\">see the original post</a></p>&mdash; @tak860 <a href=\"https://x.com/tak860/status/1951976006895673813\">see the original post</a></blockquote></template></div>",
  "hb_credit2": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/tak860/status/1951976006895673813\" target=\"_blank\" rel=\"noopener noreferrer\">@tak860／see the original post</a></p>",
  "hb_media_frame3": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Nagaoka Festival Grand Fireworks post <a href=\"https://x.com/yk11rr16/status/1951973598698303887\">see the original post</a></p>&mdash; @yk11rr16 <a href=\"https://x.com/yk11rr16/status/1951973598698303887\">see the original post</a></blockquote></template></div>",
  "hb_credit3": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/yk11rr16/status/1951973598698303887\" target=\"_blank\" rel=\"noopener noreferrer\">@yk11rr16／see the original post</a></p>",
  "hb_media_frame4": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Nagaoka Festival Grand Fireworks post <a href=\"https://x.com/eruyon_gen/status/2084235458931044713\">see the original post</a></p>&mdash; @eruyon_gen <a href=\"https://x.com/eruyon_gen/status/2084235458931044713\">see the original post</a></blockquote></template></div>",
  "hb_credit4": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/eruyon_gen/status/2084235458931044713\" target=\"_blank\" rel=\"noopener noreferrer\">@eruyon_gen／see the original post</a></p>",
  "hb_media_frame5": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Nagaoka Festival Grand Fireworks post <a href=\"https://x.com/travelinNiigata/status/1554787647805018118\">see the original post</a></p>&mdash; @travelinNiigata <a href=\"https://x.com/travelinNiigata/status/1554787647805018118\">see the original post</a></blockquote></template></div>",
  "hb_credit5": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/travelinNiigata/status/1554787647805018118\" target=\"_blank\" rel=\"noopener noreferrer\">@travelinNiigata／see the original post</a></p>",
  "hb_media_frame6": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Nagaoka Festival Grand Fireworks post <a href=\"https://x.com/T_KAWAI_SANGIIN/status/1687101353280389120\">see the original post</a></p>&mdash; @T_KAWAI_SANGIIN <a href=\"https://x.com/T_KAWAI_SANGIIN/status/1687101353280389120\">see the original post</a></blockquote></template></div>",
  "hb_credit6": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/T_KAWAI_SANGIIN/status/1687101353280389120\" target=\"_blank\" rel=\"noopener noreferrer\">@T_KAWAI_SANGIIN／see the original post</a></p>",
  "hb_itabashi_toda_title": "<h3 id=\"hb-itabashi-toda-title\">Itabashi and Todabashi Fireworks</h3>",
  "hb_place2": "<p class=\"hb-place\">Arakawa River, Tokyo to Omiya</p>",
  "copy22": "<p>Two festivals, one river. On the Tokyo bank it is the Itabashi Fireworks Festival; on the Saitama bank, the Todabashi Fireworks Festival. Separate organizers hold them on the same evening at the same hour, so the two banks together read as one very large display.</p>",
  "copy23": "<p>Every Shinkansen leaving Tokyo for Omiya crosses this stretch of the Arakawa. Whichever line you are on &mdash; Tohoku, Joetsu, Hokuriku, Yamagata or Akita &mdash; you pass it, which gives this festival the widest range of possible trains.</p>",
  "hb_official_label2": "<p class=\"hb-official-label\">Dates, launch times and viewing info are on the official sites</p>",
  "copy24": "<a href=\"https://itabashihanabi.jp/\" target=\"_blank\" rel=\"noopener noreferrer\">Itabashi Fireworks Festival official site (Japanese)</a>",
  "copy25": "<a href=\"https://www.city.toda.saitama.jp/\" target=\"_blank\" rel=\"noopener noreferrer\">Toda City official site, for the Todabashi festival (Japanese)</a>",
  "hb_media_frame7": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Itabashi and Todabashi Fireworks post <a href=\"https://x.com/Y_Tomekiti/status/2083515853098901508\">see the original post</a></p>&mdash; @Y_Tomekiti <a href=\"https://x.com/Y_Tomekiti/status/2083515853098901508\">see the original post</a></blockquote></template></div>",
  "hb_credit7": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/Y_Tomekiti/status/2083515853098901508\" target=\"_blank\" rel=\"noopener noreferrer\">@Y_Tomekiti／see the original post</a></p>",
  "hb_media_frame8": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Itabashi and Todabashi Fireworks post <a href=\"https://x.com/otatama_anime/status/2083497139674743126\">see the original post</a></p>&mdash; @otatama_anime <a href=\"https://x.com/otatama_anime/status/2083497139674743126\">see the original post</a></blockquote></template></div>",
  "hb_credit8": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/otatama_anime/status/2083497139674743126\" target=\"_blank\" rel=\"noopener noreferrer\">@otatama_anime／see the original post</a></p>",
  "hb_media_frame9": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Itabashi and Todabashi Fireworks post <a href=\"https://x.com/kamofuru334/status/2083503760480022644\">see the original post</a></p>&mdash; @kamofuru334 <a href=\"https://x.com/kamofuru334/status/2083503760480022644\">see the original post</a></blockquote></template></div>",
  "hb_credit9": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/kamofuru334/status/2083503760480022644\" target=\"_blank\" rel=\"noopener noreferrer\">@kamofuru334／see the original post</a></p>",
  "hb_media_frame10": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Itabashi and Todabashi Fireworks post <a href=\"https://x.com/miyu_tsubuki/status/1819742476909052349\">see the original post</a></p>&mdash; @miyu_tsubuki <a href=\"https://x.com/miyu_tsubuki/status/1819742476909052349\">see the original post</a></blockquote></template></div>",
  "hb_credit10": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/miyu_tsubuki/status/1819742476909052349\" target=\"_blank\" rel=\"noopener noreferrer\">@miyu_tsubuki／see the original post</a></p>",
  "hb_media_frame11": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Itabashi and Todabashi Fireworks post <a href=\"https://x.com/yanochem/status/1819697407300440492\">see the original post</a></p>&mdash; @yanochem <a href=\"https://x.com/yanochem/status/1819697407300440492\">see the original post</a></blockquote></template></div>",
  "hb_credit11": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/yanochem/status/1819697407300440492\" target=\"_blank\" rel=\"noopener noreferrer\">@yanochem／see the original post</a></p>",
  "hb_hokkoku_title": "<h3 id=\"hb-hokkoku-title\">Hokkoku Fireworks</h3>",
  "hb_place3": "<p class=\"hb-place\">Saigawa and Tedorigawa riverbeds, Kanazawa to Komatsu</p>",
  "copy26": "<p>An Ishikawa Prefecture festival run by the Hokkoku Shimbun newspaper. It comes in two parts: the Kanazawa event beside the Saigawa greenbelt, and the Kawakita event on the Tedorigawa riverbed.</p>",
  "copy27": "<p>The Hokuriku Shinkansen calls at Kanazawa and continues toward Komatsu and Kaga-Onsen. Neither venue sits far from that stretch of line.</p>",
  "hb_official_label3": "<p class=\"hb-official-label\">Dates, launch times and viewing info are on the official sites</p>",
  "copy28": "<a href=\"http://hk-event.jp/hanabi/\" target=\"_blank\" rel=\"noopener noreferrer\">Hokkoku Fireworks official site (Japanese)</a>",
  "hb_media_frame12": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Hokkoku Fireworks post <a href=\"https://x.com/sugipi04/status/2081011458998210577\">see the original post</a></p>&mdash; @sugipi04 <a href=\"https://x.com/sugipi04/status/2081011458998210577\">see the original post</a></blockquote></template></div>",
  "hb_credit12": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/sugipi04/status/2081011458998210577\" target=\"_blank\" rel=\"noopener noreferrer\">@sugipi04／see the original post</a></p>",
  "eyebrow2": "<p class=\"eyebrow\">Tokaido Shinkansen</p>",
  "tokaido_title": "<h2 id=\"tokaido-title\">Tokaido Shinkansen</h2>",
  "hb_section_lead2": "<p class=\"hb-section-lead\">Tokyo to Shin-Osaka. The route runs past coastline, wide rivers and a lagoon &mdash; the kinds of places summer fireworks go up.</p>",
  "hb_yodogawa_title": "<h3 id=\"hb-yodogawa-title\">Naniwa Yodogawa Fireworks</h3>",
  "hb_place4": "<p class=\"hb-place\">Yodo River, Kyoto to Shin-Osaka</p>",
  "copy29": "<p>Held on the Yodo River flats in Osaka. The Tokaido Shinkansen crosses the Yodo just before pulling into Shin-Osaka, so the shells go up outside the window exactly when you are gathering your bags to get off.</p>",
  "copy30": "<p>This festival drew more posts than any other on this page &mdash; filmed from Shinkansen, from local trains, and from high floors around the city.</p>",
  "hb_official_label4": "<p class=\"hb-official-label\">Dates, launch times and viewing info are on the official sites</p>",
  "copy31": "<a href=\"https://www.yodohanabi.com/\" target=\"_blank\" rel=\"noopener noreferrer\">Naniwa Yodogawa Fireworks official site (Japanese)</a>",
  "hb_media_frame13": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Naniwa Yodogawa Fireworks post <a href=\"https://x.com/CALSEED1/status/1819691501435367749\">see the original post</a></p>&mdash; @CALSEED1 <a href=\"https://x.com/CALSEED1/status/1819691501435367749\">see the original post</a></blockquote></template></div>",
  "hb_credit13": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/CALSEED1/status/1819691501435367749\" target=\"_blank\" rel=\"noopener noreferrer\">@CALSEED1／see the original post</a></p>",
  "hb_media_frame14": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Naniwa Yodogawa Fireworks post <a href=\"https://x.com/shogo_aida/status/1563772668108627969\">see the original post</a></p>&mdash; @shogo_aida <a href=\"https://x.com/shogo_aida/status/1563772668108627969\">see the original post</a></blockquote></template></div>",
  "hb_credit14": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/shogo_aida/status/1563772668108627969\" target=\"_blank\" rel=\"noopener noreferrer\">@shogo_aida／see the original post</a></p>",
  "hb_media_frame15": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Naniwa Yodogawa Fireworks post <a href=\"https://x.com/muucha28/status/1979508895048699977\">see the original post</a></p>&mdash; @muucha28 <a href=\"https://x.com/muucha28/status/1979508895048699977\">see the original post</a></blockquote></template></div>",
  "hb_credit15": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/muucha28/status/1979508895048699977\" target=\"_blank\" rel=\"noopener noreferrer\">@muucha28／see the original post</a></p>",
  "hb_media_frame16": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Naniwa Yodogawa Fireworks post <a href=\"https://x.com/taketakeyosi/status/1687791775912718336\">see the original post</a></p>&mdash; @taketakeyosi <a href=\"https://x.com/taketakeyosi/status/1687791775912718336\">see the original post</a></blockquote></template></div>",
  "hb_credit16": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/taketakeyosi/status/1687791775912718336\" target=\"_blank\" rel=\"noopener noreferrer\">@taketakeyosi／see the original post</a></p>",
  "hb_media_frame17": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Naniwa Yodogawa Fireworks post <a href=\"https://x.com/kannma13_crz/status/1979531116848799804\">see the original post</a></p>&mdash; @kannma13_crz <a href=\"https://x.com/kannma13_crz/status/1979531116848799804\">see the original post</a></blockquote></template></div>",
  "hb_credit17": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/kannma13_crz/status/1979531116848799804\" target=\"_blank\" rel=\"noopener noreferrer\">@kannma13_crz／see the original post</a></p>",
  "hb_media_frame18": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Naniwa Yodogawa Fireworks post <a href=\"https://x.com/Tama_BuriBuri/status/1687777523978186752\">see the original post</a></p>&mdash; @Tama_BuriBuri <a href=\"https://x.com/Tama_BuriBuri/status/1687777523978186752\">see the original post</a></blockquote></template></div>",
  "hb_credit18": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/Tama_BuriBuri/status/1687777523978186752\" target=\"_blank\" rel=\"noopener noreferrer\">@Tama_BuriBuri／see the original post</a></p>",
  "hb_media_frame19": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Naniwa Yodogawa Fireworks post <a href=\"https://x.com/bizen_akasaki/status/1687783339934068737\">see the original post</a></p>&mdash; @bizen_akasaki <a href=\"https://x.com/bizen_akasaki/status/1687783339934068737\">see the original post</a></blockquote></template></div>",
  "hb_credit19": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/bizen_akasaki/status/1687783339934068737\" target=\"_blank\" rel=\"noopener noreferrer\">@bizen_akasaki／see the original post</a></p>",
  "hb_atami_title": "<h3 id=\"hb-atami-title\">Atami Sea Fireworks</h3>",
  "hb_place5": "<p class=\"hb-place\">Atami Bay on Sagami Bay, Odawara to Atami</p>",
  "copy32": "<p>Shells are fired from barges out on Atami Bay. After Odawara the Tokaido Shinkansen swings toward the Sagami Bay coast before reaching Atami &mdash; a stretch where the track runs unusually close to the water, threaded between the sea and the town.</p>",
  "copy33": "<p>What sets Atami apart is that it is <strong>not only a summer festival</strong>. Where most Japanese fireworks cluster into July and August, Atami holds displays through autumn and winter too, a dozen or more times a year, with different start times outside summer. Even a trip in a colder month can fall on a display night.</p>",
  "copy34": "<p>Our window spot for this stretch, &ldquo;Atami and Sagami Bay&rdquo;, is listed on the <strong>Seat A side</strong> &mdash; the left of the train when leaving Tokyo. Use it as a rough guide to which way the sea lies.</p>",
  "hb_related": "<p class=\"hb-related\"><a href=\"spots/odawara.html\">See the window spot: Atami and Sagami Bay</a></p>",
  "hb_official_label5": "<p class=\"hb-official-label\">Dates, launch times and viewing info are on the official sites</p>",
  "copy35": "<a href=\"https://www.ataminews.gr.jp/event/8/\" target=\"_blank\" rel=\"noopener noreferrer\">Atami City Tourist Association: Atami Sea Fireworks (Japanese)</a>",
  "k3iH_NC9h_xg": "<div class=\"hb-embed\" data-embed=\"youtube\" data-video-id=\"3iH_NC9h-xg\" data-video-title=\"Atami Sea Fireworks video (YouTube)\">",
  "hb_media_frame20": "<div class=\"hb-media-frame\" data-placeholder=\"YouTube video\">",
  "hb_facade": "<button class=\"hb-facade\" type=\"button\"><span class=\"hb-facade-play\" aria-hidden=\"true\"></span><span class=\"hb-facade-label\">Atami Sea Fireworks video (YouTube) — tap to load</span></button>",
  "hb_credit20": "<p class=\"hb-credit\">YouTube: <a href=\"https://www.youtube.com/watch?v=3iH_NC9h-xg\" target=\"_blank\" rel=\"noopener noreferrer\">watch the original video</a></p>",
  "hb_media_frame21": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Atami Sea Fireworks post <a href=\"https://x.com/tokyootkinchan/status/2048583311069761559\">see the original post</a></p>&mdash; @tokyootkinchan <a href=\"https://x.com/tokyootkinchan/status/2048583311069761559\">see the original post</a></blockquote></template></div>",
  "hb_credit21": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/tokyootkinchan/status/2048583311069761559\" target=\"_blank\" rel=\"noopener noreferrer\">@tokyootkinchan／see the original post</a></p>",
  "hb_abekawa_title": "<h3 id=\"hb-abekawa-title\">Abekawa Fireworks</h3>",
  "hb_place6": "<p class=\"hb-place\">Abe River, Shizuoka to Kakegawa</p>",
  "copy36": "<p>Held on the Abe River flats in Shizuoka City. The Tokaido Shinkansen crosses the Abe almost immediately after leaving Shizuoka Station, which puts the launch site among the closest to the track on this page.</p>",
  "copy37": "<p>For the moment you are on the bridge the water is visible from both sides of the carriage. Just remember that the direction to look flips as you cross.</p>",
  "hb_official_label6": "<p class=\"hb-official-label\">Dates, launch times and viewing info are on the official sites</p>",
  "copy38": "<a href=\"https://www.abekawa-hanabi.com/\" target=\"_blank\" rel=\"noopener noreferrer\">Abekawa Fireworks official site (Japanese)</a>",
  "mmrTfBbwW_I": "<div class=\"hb-embed\" data-embed=\"youtube\" data-video-id=\"mmrTfBbwW-I\" data-video-title=\"Abekawa Fireworks video (YouTube)\">",
  "hb_media_frame22": "<div class=\"hb-media-frame\" data-placeholder=\"YouTube video\">",
  "hb_facade2": "<button class=\"hb-facade\" type=\"button\"><span class=\"hb-facade-play\" aria-hidden=\"true\"></span><span class=\"hb-facade-label\">Abekawa Fireworks video (YouTube) — tap to load</span></button>",
  "hb_credit22": "<p class=\"hb-credit\">YouTube: <a href=\"https://www.youtube.com/watch?v=mmrTfBbwW-I\" target=\"_blank\" rel=\"noopener noreferrer\">watch the original video</a></p>",
  "hb_media_frame23": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Abekawa Fireworks post <a href=\"https://x.com/koo_pcengine/status/2078448699014074615\">see the original post</a></p>&mdash; @koo_pcengine <a href=\"https://x.com/koo_pcengine/status/2078448699014074615\">see the original post</a></blockquote></template></div>",
  "hb_credit23": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/koo_pcengine/status/2078448699014074615\" target=\"_blank\" rel=\"noopener noreferrer\">@koo_pcengine／see the original post</a></p>",
  "hb_bentenjima_title": "<h3 id=\"hb-bentenjima-title\">Bentenjima Fireworks</h3>",
  "hb_place7": "<p class=\"hb-place\">Lake Hamana at Bentenjima, Hamamatsu to Toyohashi</p>",
  "copy39": "<p>Fired over the water around Bentenjima on Lake Hamana. Leaving Hamamatsu, the Tokaido Shinkansen crosses the lagoon on a bridge, and with open water on either side there is very little to block the view.</p>",
  "copy40": "<p>Our window spot &ldquo;Lake Hamana&rdquo; is listed on the <strong>Seat E side</strong> &mdash; the right of the train when leaving Tokyo.</p>",
  "hb_related2": "<p class=\"hb-related\"><a href=\"spots/hamanako.html\">See the window spot: Lake Hamana</a></p>",
  "hb_official_label7": "<p class=\"hb-official-label\">Dates, launch times and viewing info are on the official sites</p>",
  "copy41": "<a href=\"https://jp-hamamatsu.com/\" target=\"_blank\" rel=\"noopener noreferrer\">Hamamatsu Tourism Bureau official site (Japanese)</a>",
  "hb_media_frame24": "<div class=\"hb-media-frame\" data-placeholder=\"Post on X (formerly Twitter)\"><template><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"en\" dir=\"ltr\">Bentenjima Fireworks post <a href=\"https://x.com/sh_ka1974/status/2073360185918365881\">see the original post</a></p>&mdash; @sh_ka1974 <a href=\"https://x.com/sh_ka1974/status/2073360185918365881\">see the original post</a></blockquote></template></div>",
  "hb_credit24": "<p class=\"hb-credit\">Posted by <a href=\"https://x.com/sh_ka1974/status/2073360185918365881\" target=\"_blank\" rel=\"noopener noreferrer\">@sh_ka1974／see the original post</a></p>",
  "hbTipsTitle": "<h2 id=\"hbTipsTitle\">Looking for fireworks through a night window</h2>",
  "copy42": "<li><strong>Your real enemy is the cabin light</strong>At night the inside of a Shinkansen is brighter than the world outside, so the window behaves like a mirror. Most of the time you cannot see the fireworks it is that reflection, not the distance. Cup your hands around your face against the glass to make a patch of shadow, and the outside appears.</li>",
  "copy43": "<li><strong>To film it, press the lens against the glass</strong>The further your phone is from the window, the more cabin light lands in the shot. Holding the lens flat against the glass cuts the reflection dramatically. Even then, filming at night from a moving train is hard &mdash; watching with your own eyes is the surer bet.</li>",
  "hbDisclaimerTitle": "<h2 id=\"hbDisclaimerTitle\">About what is shown here</h2>",
  "copy44": "<p>Nothing is re-hosted. Videos and photos appear through the official embed features of X and YouTube, each credited to its poster with a link to the original. If you posted something shown here and would like it removed, contact us and we will take it down.</p>",
  "copy45": "<p>The posts were not all filmed in the same year; some are from earlier editions. Notes on where the track sits relative to a venue are geographic description, not a promise that you will see anything. Dates and launch times change from year to year, and events are sometimes cancelled or postponed. Always check the organizer's official information.</p>",
  "copy46": "<p>Festival names and event information belong to their respective organizers. The hero photograph is a public domain image by Jon Sullivan.</p>",
  "footer_brand": "<p class=\"footer-brand\">Shinkansen Window <span>Catch the moment from your window</span></p>",
  "copy47": "<p>Times are estimates. Trains, weather and seat position all change what you see.</p>",
  "footer_links": "<p class=\"footer-links\"><a href=\"./\">Home</a> · <a href=\"guide.html\">Seeing Mt. Fuji</a> · <a href=\"references.html\">Window links</a> · <a href=\"contact.html\">Contact</a> · <a href=\"privacy.html\">Privacy</a></p>",
  "footer_credit": "<p class=\"footer-credit\">Michikusa — unhurried travel, and the things you find by chance.</p>"
 }
};

function render(lang) {
  const en = lang === 'en';
  const p = en ? '../' : '';
  const t = COPY[lang];
  const pageUrl = en ? `${site}/en/hanabi.html` : `${site}/hanabi.html`;
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
  <link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/hanabi.html">
  <link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/hanabi.html">
  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/hanabi.html">
  <link rel="stylesheet" href="${p}style.css?v=${assetVersion('style.css')}">
  <link rel="icon" href="${p}favicon.ico" sizes="any">
  <meta property="og:type" content="article">
  ${t.copy3}
  ${t.copy4}
  ${t.copy5}
  ${t.copy6}
  <meta property="og:image" content="https://www.michikusa-travel.com/images/og-hanabi.jpg">
  ${t.copy7}
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  ${t.copy8}
  ${t.copy9}
  <meta name="twitter:image" content="https://www.michikusa-travel.com/images/og-hanabi.jpg">
  ${t.copy10}
  <script src="${p}language-router.js?v=${assetVersion('language-router.js')}"></script>
  <link rel="stylesheet" href="${p}hanabi.css?v=${assetVersion('hanabi.css')}">
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
${t.hanabi_page}
  <div data-spot-page-shared-module="topbar"></div>

  <main>
    <section class="hb-hero" aria-labelledby="hbTitle">
      <div class="hb-hero-inner">
        <p class="eyebrow">SEASONAL WINDOW NOTE</p>
        ${t.hbTitle}
        ${t.hb_hero_lead}
        ${t.hb_hero_stat}
      </div>
    </section>

    <div class="spot-page-shell hanabi-shell">
      <aside data-spot-page-shared-module="rail"></aside>
      <article class="spot-page-article hb-article">

    ${t.hb_jump}
      <div class="hb-jump-links">
        ${t.copy12}
        ${t.copy13}
        ${t.copy14}
        ${t.copy15}
        ${t.copy16}
        ${t.copy17}
        ${t.copy18}
      </div>
    </nav>

  <section class="hb-section" id="east" aria-labelledby="east-title">
    <div class="hb-section-head">
      ${t.eyebrow}
      ${t.east_title}
      ${t.hb_section_lead}
    </div>
    <article class="hb-event" id="hb-nagaoka" aria-labelledby="hb-nagaoka-title">
      <div class="hb-event-head">
        ${t.hb_nagaoka_title}
        ${t.hb_place}
      </div>
      <div class="hb-event-body">
        ${t.copy19}
        ${t.copy20}
      </div>
      <div class="hb-official">
        ${t.hb_official_label}
        <div class="hb-official-links">
          ${t.copy21}
        </div>
      </div>
      <div class="hb-media-grid">
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame}
          ${t.hb_credit}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame2}
          ${t.hb_credit2}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame3}
          ${t.hb_credit3}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame4}
          ${t.hb_credit4}
        </div>
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame5}
          ${t.hb_credit5}
        </div>
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame6}
          ${t.hb_credit6}
        </div>
      </div>
    </article>
    <article class="hb-event" id="hb-itabashi-toda" aria-labelledby="hb-itabashi-toda-title">
      <div class="hb-event-head">
        ${t.hb_itabashi_toda_title}
        ${t.hb_place2}
      </div>
      <div class="hb-event-body">
        ${t.copy22}
        ${t.copy23}
      </div>
      <div class="hb-official">
        ${t.hb_official_label2}
        <div class="hb-official-links">
          ${t.copy24}
          ${t.copy25}
        </div>
      </div>
      <div class="hb-media-grid">
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame7}
          ${t.hb_credit7}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame8}
          ${t.hb_credit8}
        </div>
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame9}
          ${t.hb_credit9}
        </div>
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame10}
          ${t.hb_credit10}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame11}
          ${t.hb_credit11}
        </div>
      </div>
    </article>
    <article class="hb-event" id="hb-hokkoku" aria-labelledby="hb-hokkoku-title">
      <div class="hb-event-head">
        ${t.hb_hokkoku_title}
        ${t.hb_place3}
      </div>
      <div class="hb-event-body">
        ${t.copy26}
        ${t.copy27}
      </div>
      <div class="hb-official">
        ${t.hb_official_label3}
        <div class="hb-official-links">
          ${t.copy28}
        </div>
      </div>
      <div class="hb-media-grid">
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame12}
          ${t.hb_credit12}
        </div>
      </div>
    </article>
  </section>

  <section class="hb-section" id="tokaido" aria-labelledby="tokaido-title">
    <div class="hb-section-head">
      ${t.eyebrow2}
      ${t.tokaido_title}
      ${t.hb_section_lead2}
    </div>
    <article class="hb-event" id="hb-yodogawa" aria-labelledby="hb-yodogawa-title">
      <div class="hb-event-head">
        ${t.hb_yodogawa_title}
        ${t.hb_place4}
      </div>
      <div class="hb-event-body">
        ${t.copy29}
        ${t.copy30}
      </div>
      <div class="hb-official">
        ${t.hb_official_label4}
        <div class="hb-official-links">
          ${t.copy31}
        </div>
      </div>
      <div class="hb-media-grid">
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame13}
          ${t.hb_credit13}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame14}
          ${t.hb_credit14}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame15}
          ${t.hb_credit15}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame16}
          ${t.hb_credit16}
        </div>
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame17}
          ${t.hb_credit17}
        </div>
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame18}
          ${t.hb_credit18}
        </div>
        <div class="hb-embed" data-embed="x">
          ${t.hb_media_frame19}
          ${t.hb_credit19}
        </div>
      </div>
    </article>
    <article class="hb-event" id="hb-atami" aria-labelledby="hb-atami-title">
      <div class="hb-event-head">
        ${t.hb_atami_title}
        ${t.hb_place5}
      </div>
      <div class="hb-event-body">
        ${t.copy32}
        ${t.copy33}
        ${t.copy34}
        ${t.hb_related}
      </div>
      <div class="hb-official">
        ${t.hb_official_label5}
        <div class="hb-official-links">
          ${t.copy35}
        </div>
      </div>
      <div class="hb-media-grid">
        ${t.k3iH_NC9h_xg}
          ${t.hb_media_frame20}
            ${t.hb_facade}
          </div>
          ${t.hb_credit20}
        </div>
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame21}
          ${t.hb_credit21}
        </div>
      </div>
    </article>
    <article class="hb-event" id="hb-abekawa" aria-labelledby="hb-abekawa-title">
      <div class="hb-event-head">
        ${t.hb_abekawa_title}
        ${t.hb_place6}
      </div>
      <div class="hb-event-body">
        ${t.copy36}
        ${t.copy37}
      </div>
      <div class="hb-official">
        ${t.hb_official_label6}
        <div class="hb-official-links">
          ${t.copy38}
        </div>
      </div>
      <div class="hb-media-grid">
        ${t.mmrTfBbwW_I}
          ${t.hb_media_frame22}
            ${t.hb_facade2}
          </div>
          ${t.hb_credit22}
        </div>
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame23}
          ${t.hb_credit23}
        </div>
      </div>
    </article>
    <article class="hb-event" id="hb-bentenjima" aria-labelledby="hb-bentenjima-title">
      <div class="hb-event-head">
        ${t.hb_bentenjima_title}
        ${t.hb_place7}
      </div>
      <div class="hb-event-body">
        ${t.copy39}
        ${t.copy40}
        ${t.hb_related2}
      </div>
      <div class="hb-official">
        ${t.hb_official_label7}
        <div class="hb-official-links">
          ${t.copy41}
        </div>
      </div>
      <div class="hb-media-grid">
        <div class="hb-embed" data-embed="x" data-aspect="portrait">
          ${t.hb_media_frame24}
          ${t.hb_credit24}
        </div>
      </div>
    </article>
  </section>

    <section class="hb-tips" aria-labelledby="hbTipsTitle">
      ${t.hbTipsTitle}
      <ul class="hb-tip-list">
        ${t.copy42}
        ${t.copy43}
      </ul>
    </section>

    <section class="hb-disclaimer" aria-labelledby="hbDisclaimerTitle">
      <div class="hb-disclaimer-card">
        ${t.hbDisclaimerTitle}
        ${t.copy44}
        ${t.copy45}
        ${t.copy46}
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
    ${t.copy47}
    ${t.footer_links}
    ${t.footer_credit}
  </footer>

  <script src="${p}spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script>
  <script src="${p}spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script>
  <script src="${p}hanabi.js?v=${assetVersion('hanabi.js')}"></script>
</body>
</html>
`;
}

for (const lang of ['ja', 'en']) {
  const dest = path.join(root, lang === 'ja' ? 'hanabi.html' : 'en/hanabi.html');
  const html = render(lang);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error('hanabi page out of date: ' + dest);
  } else {
    fs.writeFileSync(dest, html);
  }
}
console.log('hanabi pages: ja + en from one template.');
