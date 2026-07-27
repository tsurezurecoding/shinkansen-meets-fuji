/* =========================================================
 * 新幹線の窓 — 旅の瞬間を見逃さない / Shinkansen Window
 * data.js — 車窓スポットデータ（バイリンガル）
 *
 * minutesFromTokyo: のぞみ基準の東京発からの目安分数（東京→新大阪 約147分）
 * side: "E" = 山側（北側・E席） / "A" = 海側（南側・A席）
 *       東海道新幹線はどちら向きでもE席が山側になる
 * category: 車窓ガイド分類。classic/notable は主要ガイド、curious は高難度・一瞬・ニッチ枠（すべてガイドのみ）
 * confidence: "verified"（実見・写真あり） / "source-backed"（出典あり） / "needs-check"（裏取り中）
 * ========================================================= */

const ROUTE = {
  totalMinutes: 147, // のぞみ 東京→新大阪 目安
  // 全駅の「東京からの通過目安分数」(のぞみ速度基準・距離按分)。
  // 実ダイヤ接続時はこの値を使い、選択列車の停車駅時刻のあいだを線形補間する。
  refStations: [
    { id: "Tokyo", ja: "東京", en: "Tokyo", min: 0, major: true },
    { id: "Shinagawa", ja: "品川", en: "Shinagawa", min: 7, major: true },
    { id: "Shin-Yokohama", ja: "新横浜", en: "Shin-Yokohama", min: 18, major: true },
    { id: "Odawara", ja: "小田原", en: "Odawara", min: 31 },
    { id: "Atami", ja: "熱海", en: "Atami", min: 36 },
    { id: "Mishima", ja: "三島", en: "Mishima", min: 40 },
    { id: "Shin-Fuji", ja: "新富士", en: "Shin-Fuji", min: 45 },
    { id: "Shizuoka", ja: "静岡", en: "Shizuoka", min: 53 },
    { id: "Kakegawa", ja: "掛川", en: "Kakegawa", min: 64 },
    { id: "Hamamatsu", ja: "浜松", en: "Hamamatsu", min: 70 },
    { id: "Toyohashi", ja: "豊橋", en: "Toyohashi", min: 79 },
    { id: "Mikawa-Anjo", ja: "三河安城", en: "Mikawa-Anjo", min: 88 },
    { id: "Nagoya", ja: "名古屋", en: "Nagoya", min: 95, major: true },
    { id: "Gifu-Hashima", ja: "岐阜羽島", en: "Gifu-Hashima", min: 102 },
    { id: "Maibara", ja: "米原", en: "Maibara", min: 114 },
    { id: "Kyoto", ja: "京都", en: "Kyoto", min: 130, major: true },
    { id: "Shin-Osaka", ja: "新大阪", en: "Shin-Osaka", min: 147, major: true },
  ],
  get stations() { return this.refStations.filter((s) => s.major); },
};

const REFERENCES = {
  toyokeizaiWindow: {
    label: { ja: "東洋経済オンライン: 新幹線の車窓はこんなに面白い", en: "Toyo Keizai Online: Tokaido Shinkansen window views" },
    url: "https://toyokeizai.net/list/column/694384d86b208d3b9c000052",
  },
  toyokeizaiMikawa: {
    label: { ja: "東洋経済オンライン: 三河湾の車窓", en: "Toyo Keizai Online: Mikawa Bay window view" },
    url: "https://toyokeizai.net/articles/-/128329",
  },
  hinataokaRakumachi: {
    label: { ja: "楽待: 日向岡の住宅地", en: "Rakumachi: Hinataoka hillside homes (Japanese only)" },
    url: "https://www.rakumachi.jp/news/column/339459",
  },
  tokyoTowerBlog: {
    label: { ja: "@letus10: 東京タワー車窓記事", en: "@letus10: Tokyo Tower window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/507672955.html",
  },
  tokyoTowerOfficial: {
    label: { ja: "東京タワー 公式", en: "Tokyo Tower official site" },
    url: {
      ja: "https://www.tokyotower.co.jp/",
      en: "https://www.tokyotower.co.jp/en/",
    },
  },
  tokyoTowerLightup: {
    label: { ja: "東京タワー: ライトアップ情報", en: "Tokyo Tower: Illumination information" },
    url: {
      ja: "https://www.tokyotower.co.jp/lightup/",
      en: "https://www.tokyotower.co.jp/en/lightup/",
    },
  },
  atami: {
    label: { ja: "熱海市観光協会: 熱海のおすすめ観光スポット", en: "Atami Tourism: Highlights of Atami (Japanese only)" },
    url: "https://www.ataminews.gr.jp/features/42",
  },
  atamiHatsushima: {
    label: { ja: "熱海市観光協会: 初島", en: "Atami Tourism: Hatsushima Island (Japanese only)" },
    url: "https://www.ataminews.gr.jp/spot/779",
  },
  atamiCastle: {
    label: { ja: "熱海市観光協会: 熱海城", en: "Atami Tourism: Atami Castle (Japanese only)" },
    url: "https://www.ataminews.gr.jp/spot/12",
  },
  atamiCityEnvironment: {
    label: { ja: "熱海市: 熱海市の地形と環境", en: "Atami City: Geography and environment of Atami (Japanese only)" },
    url: {
      ja: "https://www.city.atami.lg.jp/_res/projects/default_project/_page_/001/007/555/202310_atami_kankyo.pdf",
      en: "https://www.city.atami.lg.jp/_res/projects/default_project/_page_/001/007/555/202310_atami_kankyo.pdf",
    },
  },
  hatsushimaBlog: {
    label: { ja: "@letus10: 初島車窓記事", en: "@letus10: Hatsushima window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/516720935.html",
  },
  atamiCastleBlog: {
    label: { ja: "@letus10: 熱海城車窓記事", en: "@letus10: Atami Castle window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/516721203.html",
  },
  weatherFuji: {
    label: { ja: "ウェザーニュース: 新幹線の富士山スポット", en: "Weathernews: Mt. Fuji from the Shinkansen" },
    url: {
      ja: "https://weathernews.jp/news/202604/240201/",
      en: "https://global.jr-central.co.jp/en/onlinebooking/featured-theme/mtfuji/",
    },
  },
  leftFujiTrafficNews: {
    label: { ja: "乗りものニュース: 左富士", en: "Traffic News: Left-side Fuji (Japanese only)" },
    url: "https://trafficnews.jp/post/62565",
  },
  odawaraCastle: {
    label: { ja: "小田原城公式", en: "Odawara Castle official site" },
    url: "https://odawaracastle.com/",
  },
  odawaraCastleBlog: {
    label: { ja: "@letus10: 小田原城車窓記事", en: "@letus10: Odawara Castle window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/516754194.html",
  },
  gyoranKannon: {
    label: { ja: "小田原市郷土文化館: 早川東善院の魚籃観音", en: "Odawara City: Gyoran Kannon at Tozen-in (Japanese only)" },
    url: "https://www.city.odawara.kanagawa.jp/public-i/facilities/kyodo/stoneworks/searchforstoneworks20191203.html",
  },
  gyoranKannonTourism: {
    label: { ja: "小田原市観光協会: 魚籃大観音（東善院）", en: "Odawara Tourism: Gyoran Dai-Kannon at Tozen-in (Japanese only)" },
    url: "https://www.odawara-kankou.com/spot/spot_area/gyokou.html",
  },
  shimizuPort: {
    label: { ja: "清水港: 地球深部探査船「ちきゅう」", en: "Port of Shimizu: Deep-sea drilling vessel CHIKYU" },
    url: "https://www.portofshimizu.com/overview/%E5%9C%B0%E7%90%83%E6%B7%B1%E9%83%A8%E6%8E%A2%E6%9F%BB%E8%88%B9-%E3%81%A1%E3%81%8D%E3%82%85%E3%81%86/",
  },
  chikyuOfficial: {
    label: { ja: "JAMSTEC: 地球深部探査船「ちきゅう」", en: "JAMSTEC: Deep-sea scientific drilling vessel CHIKYU" },
    url: "https://www.jamstec.go.jp/chikyu/j/",
  },
  shizuokaTeaTourism: {
    label: { ja: "お茶のまち静岡市: 観光", en: "Ochanomachi Shizuoka City: Tourism" },
    url: "https://www.ochanomachi-shizuokashi.jp/tourism/",
  },
  kakegawaCastle: {
    label: { ja: "掛川市: 掛川城", en: "Kakegawa City: Kakegawa Castle (Japanese only)" },
    url: "https://www.city.kakegawa.shizuoka.jp/kanko/spot-list/kakegawajyo.html",
  },
  genkiSignBlog: {
    label: { ja: "@letus10: しっぺいの応援看板車窓記事", en: "@letus10: Shippei cheer-up signs window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/516019488.html",
  },
  shippeiOfficial: {
    label: { ja: "しっぺい公式サイト", en: "Shippei official site (Japanese only)" },
    url: "https://shippei.jp/",
  },
  genkiSignStreetView: {
    label: { ja: "Google ストリートビュー: しっぺいの応援看板付近", en: "Google Street View: Shippei cheer-up signs area" },
    url: "https://www.google.com/maps/@34.7298265,137.8986674,3a,46.4y,18.58h,82.48t/data=!3m7!1e1!3m5!1sWkV2_8Z6dI0WHi46Bem_YA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D7.519999999999996%26panoid%3DWkV2_8Z6dI0WHi46Bem_YA%26yaw%3D18.58!7i16384!8i8192?entry=ttu",
  },
  hamanakoTourism: {
    label: { ja: "浜名湖観光圏", en: "Lake Hamana tourism" },
    url: {
      ja: "https://www.hamanako-tourism.com/",
      en: "https://hamanako-tourism.com/en/",
    },
  },
  hamanakoEnvironment: {
    label: { ja: "浜名湖観光圏: 海苔・牡蠣養殖と浜名湖の環境", en: "Lake Hamana tourism: Nori, oyster farming and the lake environment" },
    url: "https://hamanako-tourism.com/environment/",
  },
  hamanakoBentenjima: {
    label: { ja: "浜松市: 弁天島海浜公園", en: "Hamamatsu City: Bentenjima Seaside Park (Japanese only)" },
    url: "https://www.city.hamamatsu.shizuoka.jp/kanko/bentenjima-kaihinkouen/saiseibi.html",
  },
  hamanakoNori: {
    label: { ja: "浜松市: 浜名湖のりの歴史と養殖", en: "Hamamatsu City: Lake Hamana nori farming (Japanese only)" },
    url: "https://www.city.hamamatsu.shizuoka.jp/foodpark/hamamatsu-foods/nori.html",
  },
  hamanakoBoatRace: {
    label: { ja: "ボートレース浜名湖 公式", en: "Boat Race Hamanako official site" },
    url: {
      ja: "https://www.boatrace-hamanako.jp/modules/access/?page=index_access",
      en: "https://www.boatrace-hamanako.jp/modules/access/?lang=en&page=index_lang_traffic",
    },
  },
  sunMarineBridge: {
    label: { ja: "鹿島建設: サンマリンブリッジ", en: "Kajima: Sun Marine Bridge (Japanese only)" },
    url: "https://www.kajima.co.jp/tech/c_projects/ex/1996snmrnb/index.html",
  },
  hamanakoToriiBlog: {
    label: { ja: "@letus10: 浜名湖と弁天島鳥居の車窓記事", en: "@letus10: Lake Hamana and Bentenjima torii article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/517074141.html",
  },
  toyohashiTateiwa: {
    label: { ja: "デイリーポータルZ: 東海道本線の車窓から見える岩めぐり", en: "Daily Portal Z: Rocks visible from the Tokaido Line (Japanese only)" },
    url: "https://dailyportalz.jp/kiji/rocks-visible-from-Tokaido-Line",
  },
  toyohashiTateiwaMegalith: {
    label: { ja: "石神・磐座・奇岩研究: 立岩（愛知県豊橋市）", en: "Megalith research blog: Tateiwa in Toyohashi (Japanese only)" },
    url: "https://www.megalithmury.com/2025/10/toyohashi-tateiwa.html",
  },
  toyohashiTateiwaWizz: {
    label: { ja: "青雲のこころざし: 誰もが気になる立岩", en: "Seiun blog: The Tateiwa rock everyone notices (Japanese only)" },
    url: "https://wizzseiun.com/2020/03/15/big-stone/",
  },
  toyohashiTateiwaSazanami: {
    label: { ja: "神秘と感動の絶景を探し歩いて: 豊橋市の立岩", en: "Sazanami blog: Toyohashi Tateiwa (Japanese only)" },
    url: "https://sazanami217.blog.fc2.com/blog-entry-1896.html",
  },
  toyohashiTateiwaCity: {
    label: { ja: "豊橋市: 立岩の利用について", en: "Toyohashi City: Visiting and climbing Tateiwa (Japanese only)" },
    url: "https://www.city.toyohashi.lg.jp/53830.htm",
  },
  kirinBlog: {
    label: { ja: "@letus10: キリンビール工場車窓記事", en: "@letus10: Kirin Beer Factory window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/518214924.html",
  },
  nichibanBlog: {
    label: { ja: "@letus10: セロテープの壁看板車窓記事", en: "@letus10: CELLOTAPE Wall Sign window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/510591087.html",
  },
  nichibanPrtimes: {
    label: { ja: "ニチバン公式発表: セロテープ壁面広告リニューアル", en: "Nichiban release: CELLOTAPE wall sign renewal (Japanese only)" },
    url: "https://prtimes.jp/main/html/rd/p/000000069.000011142.html",
  },
  marukoBridgeBlog: {
    label: { ja: "@letus10: 丸子橋車窓記事", en: "@letus10: Maruko Bridge window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/515810649.html",
  },
  sevenTwoSevenNote: {
    label: { ja: "note: 727看板と新幹線の車窓", en: "note: 727 signs from the Shinkansen (Japanese only)" },
    url: "https://note.com/wotuntun/n/n3d2eceae1689",
  },
  sevenTwoSevenOfficial: {
    label: { ja: "727 セブンツーセブン化粧品", en: "727 Cosmetics official site" },
    url: "https://www.727.co.jp/concept/",
  },
  sevenTwoSevenHistory: {
    label: { ja: "727 セブンツーセブン化粧品: 沿革", en: "727 Cosmetics: Company history (Japanese only)" },
    url: "https://www.727.co.jp/company/history/",
  },
  kinutaDentist248Post: {
    label: { ja: "きぬた歯科: 248看板についての投稿", en: "Kinuta Dental: post about the 248 sign (Japanese only)" },
    url: "https://x.com/kinutashika/status/2032351774292717729",
  },
  kinutaDentist248Meaning: {
    label: { ja: "きぬた歯科: 248は「ニシハチ」", en: "Kinuta Dental: 248 means Nishi-Hachi (Japanese only)" },
    url: "https://x.com/kinutashika/status/2032372303636677124",
  },
  nagoyaCentralTowers: {
    label: { ja: "JRセントラルタワーズ 公式", en: "JR Central Towers official site" },
    url: "https://www.towers.jp/",
  },
  nagoyaSpiralTowers: {
    label: { ja: "名古屋モード学園: スパイラルタワーズ", en: "Nagoya Mode Gakuen: Spiral Towers" },
    url: "https://www.mode.ac.jp/nagoya/facilities",
  },
  nagoyaMidlandSquare: {
    label: { ja: "ミッドランドスクエア 公式", en: "Midland Square official site" },
    url: "https://www.midland-square.com/concept/",
  },
  kinshozanWiki: {
    label: { ja: "Wikipedia: 金生山", en: "Wikipedia: Mt. Kinsho (Japanese only)" },
    url: "https://ja.wikipedia.org/wiki/%E9%87%91%E7%94%9F%E5%B1%B1",
  },
  kiyosuCastle: {
    label: { ja: "清洲城", en: "Kiyosu Castle" },
    url: "http://kiyosujyo.com/",
  },
  gifuCastleBlog: {
    label: { ja: "@letus10: 岐阜城車窓記事", en: "@letus10: Gifu Castle window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/518296647.html",
  },
  zusshiCastleBlog: {
    label: { ja: "ずっしー。氏: 新幹線からお城を撮影", en: "Zusshi: Castles from the Shinkansen (Japanese only)" },
    url: "https://ameblo.jp/ginga03142008/entry-12251601639.html",
  },
  solarArkBlog: {
    label: { ja: "@letus10: ソーラーアーク車窓記事", en: "@letus10: Solar Ark from the Shinkansen" },
    url: "https://cotetu.seesaa.net/article/519526266.html",
  },
  solarArkDemolitionNews: {
    label: { ja: "共同通信: ソーラーアーク解体へ", en: "Kyodo News: Solar Ark demolition announced (Japanese only)" },
    url: "https://news.yahoo.co.jp/articles/43adce1fe2523e8a6ea1eb740a61833a832d51fb",
  },
  ibuki: {
    label: { ja: "Wikipedia: 伊吹山", en: "Japan Travel: Mt. Ibuki" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E4%BC%8A%E5%90%B9%E5%B1%B1",
      en: "https://www.japan.travel/en/sports/hiking/courses/mt-ibuki/",
    },
  },
  kojodanWindowCastles: {
    label: { ja: "攻城団: 新幹線から見える城", en: "Kojodan: Castles visible from the Shinkansen" },
    url: "https://blog.kojodan.jp/entry/2019/03/10/130620",
  },
  nanguTaisha: {
    label: { ja: "南宮大社 公式", en: "Nangu Taisha official site" },
    url: "https://www.nangu-san.com/",
  },
  hikoneCastle: {
    label: { ja: "国宝 彦根城公式", en: "Hikone Castle official site" },
    url: "https://hikonecastle.com/",
  },
  sawayama: {
    label: { ja: "彦根観光ガイド: 佐和山城跡", en: "Hikone tourism: Sawayama Castle Ruins" },
    url: "https://www.hikoneshi.com/sightseeing/article/sawayama",
  },
  sawayamaBlog: {
    label: { ja: "@letus10: 佐和山城跡と彦根城の車窓記事", en: "@letus10: Sawayama and Hikone window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/517840979.html",
  },
  kannonjiCastle: {
    label: { ja: "Wikipedia: 観音寺城", en: "Wikipedia: Kannonji Castle" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E8%A6%B3%E9%9F%B3%E5%AF%BA%E5%9F%8E",
      en: "https://en.wikipedia.org/wiki/Kannonji_Castle",
    },
  },
  omiFujiPark: {
    label: { ja: "Wikipedia: 三上山", en: "Wikipedia: Mount Mikami" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E4%B8%89%E4%B8%8A%E5%B1%B1",
      en: "https://en.wikipedia.org/wiki/Mount_Mikami",
    },
  },
  setaKarahashi: {
    label: { ja: "@letus10: 瀬田の唐橋車窓記事", en: "@letus10: Seta no Karahashi window article (Japanese only)" },
    url: "https://cotetu.seesaa.net/article/517709224.html",
  },
  toji: {
    label: { ja: "THE THOUSAND KYOTO: 東寺", en: "THE THOUSAND KYOTO: To-ji Temple" },
    url: "https://www.keihanhotels-resorts.co.jp/the-thousand-kyoto/sight/kyoto-kawaramachi/touji.html",
  },
  tojiOfficial: {
    label: { ja: "教王護国寺（東寺）公式", en: "To-ji Temple official site" },
    url: {
      ja: "https://toji.or.jp/",
      en: "https://toji.or.jp/en/",
    },
  },
  tojiPagodaBunka: {
    label: { ja: "文化庁 国指定文化財等データベース: 東寺五重塔", en: "Agency for Cultural Affairs: To-ji Five-Story Pagoda (National Treasure)" },
    url: "https://kunishitei.bunka.go.jp/heritage/detail/102/00001515",
  },
  musashiKosugiKawasaki: {
    label: { ja: "川崎市: 小杉駅周辺のまちづくり", en: "Kawasaki City: Redevelopment around Kosugi Station (Japanese only)" },
    url: "https://www.city.kawasaki.jp/580/page/0000010902.html",
  },
  musashiKosugiTowers: {
    label: { ja: "Wikipedia: 武蔵小杉駅周辺の再開発と超高層マンション", en: "Wikipedia: Musashi-Kosugi Station redevelopment and high-rises" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E6%AD%A6%E8%94%B5%E5%B0%8F%E6%9D%89%E9%A7%85#%E5%86%8D%E9%96%8B%E7%99%BA",
      en: "https://en.wikipedia.org/wiki/Musashi-Kosugi_Station",
    },
  },
  mikawaOshimaGamagori: {
    label: { ja: "蒲郡市観光協会: 三河大島", en: "Gamagori Tourism: Mikawa Oshima (Japanese only)" },
    url: "https://www.gamagori.jp/see/detail?id=00000181",
  },
  mikawaOshimaWiki: {
    label: { ja: "Wikipedia: 大島（三河大島）", en: "Wikipedia: Mikawa Oshima Island (Japanese only)" },
    url: "https://ja.wikipedia.org/wiki/%E5%A4%A7%E5%B3%B6_(%E8%92%B2%E9%83%A1%E5%B8%82)",
  },
  odawaraCastleOfficialEn: {
    label: { ja: "小田原市: 小田原城跡（史跡）", en: "Odawara City: Odawara Castle Site (Historic Site)" },
    url: "https://www.city.odawara.kanagawa.jp/kanko/rekishi/p03700.html",
  },
  kiyosuHistory: {
    label: { ja: "清須市: 清洲城と清須会議", en: "Kiyosu City: Kiyosu Castle and the Kiyosu Conference (Japanese only)" },
    url: "https://www.city.kiyosu.aichi.jp/kanko_bunka/kiyosujo/rekishi.html",
  },
  gifuCastleOfficial: {
    label: { ja: "岐阜市: 岐阜城", en: "Gifu City: Gifu Castle" },
    url: {
      ja: "https://www.city.gifu.lg.jp/kurashi/bunka/rekishi/1002269/1002270.html",
      en: "https://gifucvb.or.jp/en/sightseeing/detail_gifucastle.html",
    },
  },
  ogakiKinshozan: {
    label: { ja: "大垣市: 金生山（金生山化石館・石灰岩採掘）", en: "Ogaki City: Mt. Kinsho fossil museum and limestone quarrying (Japanese only)" },
    url: "https://www.city.ogaki.lg.jp/0000000803.html",
  },
  ogakiKinshozanFossil: {
    label: { ja: "金生山化石館", en: "Kinshozan Fossil Museum (Japanese only)" },
    url: "https://www.city.ogaki.lg.jp/0000001028.html",
  },
  ibukiMaibara: {
    label: { ja: "長浜・米原観光情報サイト: 伊吹山", en: "Kitabiwako.jp: Mt. Ibuki (Nagahama & Maibara tourism, Japanese only)" },
    url: "https://kitabiwako.jp/spot/spot_5081",
  },
  ibukiKojiki: {
    label: { ja: "Wikipedia: 伊吹山（伝承の節）", en: "Wikipedia: Mount Ibuki" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E4%BC%8A%E5%90%B9%E5%B1%B1#%E4%BC%9D%E6%89%BF",
      en: "https://en.wikipedia.org/wiki/Mount_Ibuki",
    },
  },
  nanguTaishaWiki: {
    label: { ja: "Wikipedia: 南宮大社", en: "Wikipedia: Nangu Taisha" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E5%8D%97%E5%AE%AE%E5%A4%A7%E7%A4%BE",
      en: "https://en.wikipedia.org/wiki/Nangu_Shrine",
    },
  },
  gyoranKannonWiki: {
    label: { ja: "Wikipedia: 魚籃観音", en: "Wikipedia: Gyoran Kannon" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E9%AD%9A%E7%B1%83%E8%A6%B3%E9%9F%B3",
      en: "https://en.wikipedia.org/wiki/Guanyin#Gyoran_Kannon",
    },
  },
  sawayamaIshida: {
    label: { ja: "彦根市: 佐和山城跡と石田三成", en: "Hikone City: Sawayama Castle and Ishida Mitsunari (Japanese only)" },
    url: "https://www.city.hikone.lg.jp/kakuka/toshikensetsu/rekisimatidukuri/rekishimatinami/1000073/1000075/1006168.html",
  },
  kannonjiCastleShiga: {
    label: { ja: "近江八幡市観光物産協会: 観音寺城跡", en: "Omihachiman Tourism: Kannonji Castle Ruins (Japanese only)" },
    url: "https://www.omi8.com/spot/kannonji-castle-ruin/",
  },
  omiFujiOfficial: {
    label: { ja: "野洲市観光物産協会: 三上山（近江富士）", en: "Yasu City Tourism: Mt. Mikami (Omi Fuji) (Japanese only)" },
    url: "https://www.yasu-kankou.com/spot/mikamiyama/",
  },
  shizuokaTeaGreenTeaAssoc: {
    label: { ja: "静岡県茶業会議所: 静岡茶", en: "Shizuoka Tea Council: Shizuoka green tea (Japanese only)" },
    url: "https://ochacha.jp/",
  },
  shizuokaTeaGeography: {
    label: { ja: "静岡県: 静岡茶ができるまで（産地と歴史）", en: "Shizuoka Prefecture: Shizuoka tea regions and history (Japanese only)" },
    url: "https://www.pref.shizuoka.jp/sangyoshigoto/nogyo/kayo/1030075/1055376.html",
  },
  hikoneCastleUnesco: {
    label: { ja: "国指定文化財等データベース: 彦根城", en: "Agency for Cultural Affairs: Hikone Castle (National Treasure)" },
    url: "https://kunishitei.bunka.go.jp/heritage/detail/102/00001479",
  },
  setaKarahashiOtsu: {
    label: { ja: "大津市観光協会: 瀬田の唐橋", en: "Otsu Tourism: Seta no Karahashi Bridge" },
    url: "https://otsu.or.jp/spot/detail/id/26",
  },
  setaKarahashiWiki: {
    label: { ja: "Wikipedia: 瀬田の唐橋", en: "Wikipedia: Seta no Karahashi Bridge" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E7%80%AC%E7%94%B0%E3%81%AE%E5%94%90%E6%A9%8B",
      en: "https://en.wikipedia.org/wiki/Seta_no_Karahashi",
    },
  },
  otaFujiEarlyMorning: {
    label: { ja: "東京都: 都内から見える富士山（環境局）", en: "Tokyo Metropolitan Government: Views of Mt. Fuji from the city (Japanese only)" },
    url: "https://www.metro.tokyo.lg.jp/tosei/hodohappyo/press/2024/01/12/05.html",
  },
  shinagawaSkyline: {
    label: { ja: "東京都都市整備局: 品川駅周辺のまちづくり", en: "Tokyo Bureau of Urban Development: Shinagawa Station area development (Japanese only)" },
    url: "https://www.toshiseibi.metro.tokyo.lg.jp/topics/2020/topi010.html",
  },
  marukoBridgeWiki: {
    label: { ja: "Wikipedia: 丸子橋", en: "Wikipedia: Maruko Bridge (Japanese only)" },
    url: "https://ja.wikipedia.org/wiki/%E4%B8%B8%E5%AD%90%E6%A9%8B",
  },
  kamenokoyamaKofun: {
    label: { ja: "大田区: 亀甲山古墳（多摩川台古墳群）", en: "Ota City: Kamenokoyama Kofun (Tamagawadai kofun group) (Japanese only)" },
    url: "https://www.city.ota.tokyo.jp/seikatsu/rekishitobunka/bunkazai/1shitei_shiseki/kounotoritukougouryou.html",
  },
  hiratsukaHousing: {
    label: { ja: "平塚市: 都市計画・住宅地の概要（ひなたおか）", en: "Hiratsuka City: Urban planning and residential districts (Japanese only)" },
    url: "https://www.city.hiratsuka.kanagawa.jp/toshi/index.html",
  },
  sagamiFujiTanzawa: {
    label: { ja: "神奈川県: 丹沢大山国定公園", en: "Kanagawa Prefecture: Tanzawa-Oyama Quasi-National Park (Japanese only)" },
    url: "https://www.pref.kanagawa.jp/docs/x8x/cnt/f6942/",
  },
  leftFujiWiki: {
    label: { ja: "Wikipedia: 左富士", en: "Wikipedia: Hidari-Fuji (Left-side Fuji)" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E5%B7%A6%E5%AF%8C%E5%A3%AB",
      en: "https://en.wikipedia.org/wiki/Hidari_Fuji",
    },
  },
  shimizuPortCity: {
    label: { ja: "静岡市: 清水港", en: "Shizuoka City: Port of Shimizu (Japanese only)" },
    url: "https://www.city.shizuoka.lg.jp/000_003042.html",
  },
  chikyuJamstecMissions: {
    label: { ja: "JAMSTEC: ちきゅう 主なミッション", en: "JAMSTEC: CHIKYU key missions" },
    url: {
      ja: "https://www.jamstec.go.jp/chikyu/j/CHIKYU/mission.html",
      en: "https://www.jamstec.go.jp/chikyu/e/CHIKYU/mission.html",
    },
  },
  iwataShippei: {
    label: { ja: "磐田市: 市のマスコット しっぺい", en: "Iwata City: Mascot character Shippei (Japanese only)" },
    url: "https://www.city.iwata.shizuoka.jp/kanko_bunka/kanko/shippei/index.html",
  },
  nichibanCompany: {
    label: { ja: "ニチバン株式会社 会社概要", en: "Nichiban Corporate profile" },
    url: {
      ja: "https://www.nichiban.co.jp/company/profile/",
      en: "https://www.nichiban.co.jp/english/company/",
    },
  },
  cellotapeStory: {
    label: { ja: "ニチバン: セロテープの歴史", en: "Nichiban: The story of CELLOTAPE (Japanese only)" },
    url: "https://www.nichiban.co.jp/stationery/cellotape/",
  },
  nagoyaJrGateTower: {
    label: { ja: "JRゲートタワー 公式", en: "JR Gate Tower official site" },
    url: "https://www.jrgatetower.com/",
  },
  meiekiRedevelopment: {
    label: { ja: "名古屋市: 名駅地区のまちづくり", en: "Nagoya City: Meieki district development (Japanese only)" },
    url: "https://www.city.nagoya.jp/jutakutoshi/page/0000097960.html",
  },
  kirinBrewery: {
    label: { ja: "キリンビール 名古屋工場", en: "Kirin Beer Nagoya Brewery" },
    url: {
      ja: "https://www.kirin.co.jp/experience/factory/nagoya/",
      en: "https://www.kirinholdings.com/en/",
    },
  },
  solarArkWikipedia: {
    label: { ja: "Wikipedia: ソーラーアーク", en: "Wikipedia: Solar Ark" },
    url: {
      ja: "https://ja.wikipedia.org/wiki/%E3%82%BD%E3%83%BC%E3%83%A9%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AF",
      en: "https://en.wikipedia.org/wiki/Solar_Ark",
    },
  },
  anpachiTownSolarArk: {
    label: { ja: "安八町: 太陽電池モニュメント「ソーラーアーク」", en: "Anpachi Town: Solar Ark monument (Japanese only)" },
    url: "https://www.town.anpachi.gifu.jp/",
  },
  torikaiDepotWiki: {
    label: { ja: "Wikipedia: 鳥飼車両基地", en: "Wikipedia: Torikai Rail Yard (Japanese only)" },
    url: "https://ja.wikipedia.org/wiki/%E9%B3%A5%E9%A3%BC%E8%BB%8A%E4%B8%A1%E5%9F%BA%E5%9C%B0",
  },
  kawakamiSangyo: {
    label: { ja: "川上産業: 会社案内（プチプチ®の発祥）", en: "Kawakami Sangyo: Company profile (originator of PUTIPUTI bubble wrap) (Japanese only)" },
    url: "https://www.putiputi.co.jp/company/",
  },
  hamanakoFujiVisibility: {
    label: { ja: "浜松市: 浜名湖越しに富士山が見える条件", en: "Hamamatsu City: Viewing Mt. Fuji across Lake Hamana (Japanese only)" },
    url: "https://www.city.hamamatsu.shizuoka.jp/",
  },
  hinataokaWiki: {
    label: { ja: "Wikipedia: 平塚市の住宅団地", en: "Wikipedia: Housing estates in Hiratsuka (Japanese only)" },
    url: "https://ja.wikipedia.org/wiki/%E5%B9%B3%E5%A1%9A%E5%B8%82",
  },
  setaKarahashiIsogaba: {
    label: { ja: "びわ湖コモン: 瀬田の唐橋と『急がば回れ』の由来", en: "Biwa-ko Common: The origin of the proverb 'isogaba maware' at Seta no Karahashi (Japanese only)" },
    url: "https://biwacommon.com/cat003/seta-no-karahashi/",
  },
  tokaidoShinkansen: {
    label: { ja: "JR東海: 鳥飼車両基地でのメンテナンス", en: "JR Central: Maintenance at Torikai Train Depot (Japanese only)" },
    url: "https://jr-central.co.jp/news/release/nws000645.html",
  },
};

const SPOTS = [
  {
    id: "tokyo-tower",
    icon: "🗼",
    ja: { name: "東京タワー", area: "東京 → 品川", hook: "東京の空に、赤い塔。", story: "東京駅を出て品川へ向かう数分、E席側のビルの合間に赤い東京タワーが立ちます。窓の前後には汐留・浜松町のオフィス街、増上寺の緑、その先には品川のガラス張り高層ビル群が続き、東京の中心部を横切っている感覚が短い時間に凝縮されます。夜は東京タワーそのもののライトアップが街の中で明るく浮かび、旅の入口を印象的に演出してくれます。" },
    en: { name: "Tokyo Tower", area: "Tokyo → Shinagawa", hook: "A red tower in the Tokyo skyline.", story: "In the first few minutes after leaving Tokyo Station for Shinagawa, the red Tokyo Tower slips between the buildings on the Seat E side. The window is framed by the Shiodome and Hamamatsucho office towers, the green of Zojo-ji Temple, and, beyond them, the glass high-rises around Shinagawa. It is a compressed cross-section of central Tokyo. At night, Tokyo Tower's own illumination glows warmly amid the city — a memorable curtain-up for the journey." },
    pageTitle: {
      ja: "新幹線から見える東京タワー｜E席で楽しむ都心の景色とライトアップ | 新幹線の窓",
      en: "Tokyo Tower from the Shinkansen | Central Tokyo Skyline from Seat E",
    },
    pageHeading: {
      ja: "新幹線から見える東京タワーと都心の景色",
      en: "Tokyo Tower and the central Tokyo skyline from the Shinkansen",
    },
    pageHeadingChunks: {
      ja: ["新幹線から見える、", "東京タワーと都心の景色"],
      en: ["Tokyo Tower and the central Tokyo skyline", "from the Shinkansen"],
    },
    metaDescription: {
      ja: "東京駅を出てすぐ、新幹線のE席側に見える東京タワー。周辺の汐留・浜松町・品川の街並みや、夜のライトアップの見え方まで、車窓の楽しみ方を写真付きで案内します。",
      en: "Just after leaving Tokyo Station, Tokyo Tower appears from Seat E on the Shinkansen. See how it fits with the Shiodome, Hamamatsucho and Shinagawa skyline, and how it looks when illuminated at night.",
    },
    sectionHeading: {
      ja: "東京駅を出てすぐ、車窓には何が映る？",
      en: "What do you see just after leaving Tokyo Station?",
    },
    pageStory: {
      ja: "東海道新幹線を東京駅から新大阪方面へ乗ると、まず車窓を横切るのは、有楽町・新橋のガラス張りビル群、汐留の高層オフィス街、そして芝公園の緑です。その合間、E席側のビルとビルのすきまに、赤と白の東京タワーが縦に立ちます。見えている時間はほんの数秒。品川へ近づくにつれ景色は再び高層ビルへ切り替わり、大井町付近では車両基地と京浜工業地帯の裏側も車窓に流れます。「東京タワーが見えた」という一瞬に、東京の中心部を通過している事実が凝縮されている区間です。",
      en: "Right after leaving Tokyo Station on the Tokaido Shinkansen, the window fills with the glass towers of Yurakucho and Shimbashi, the high-rise offices of Shiodome, and the green of Shiba Park. In a gap between buildings on the Seat E side, the red-and-white Tokyo Tower rises vertically for just a few seconds. As the train nears Shinagawa the view returns to high-rises, and around Oimachi you glimpse the backside of the train depots and the Keihin industrial area. Catching Tokyo Tower is really about noticing how quickly the ride crosses central Tokyo.",
    },
    explainer: {
      heading: { ja: "東京タワーはどこにある？周辺の街並みと合わせて", en: "Where is Tokyo Tower, and what surrounds it?" },
      ja: [
        "東京タワーは港区芝公園にある高さ333mの総合電波塔で、1958年に完成しました。当時は自立式鉄塔として世界一の高さで、いまでも都心に赤い塔を立たせているのは東京タワーだけです。新幹線からは線路の東側、E席から見えますが、必ずビルの合間に一瞬だけ姿を見せる形になります。",
        "周辺の景色も車窓の主役です。汐留エリアの高層ビル群、増上寺の大屋根、六本木ヒルズ・虎ノ門ヒルズの遠景、その先に続く品川の再開発ビル群。東京タワーはそれ自体が目印であると同時に、東京都心の地形の目盛りにもなっています。「今どこを通っているか」を教えてくれる存在です。",
        "夜は東京タワーの意匠がさらに際立ちます。通常は夏の白色・冬の暖色を切り替える『ランドマークライト』、季節や記念日にはピンクや虹色などの『ダイヤモンドヴェール』も点灯されます。当日のライトアップは日ごとに変わるので、公式サイトのライトアップ情報を旅の前に見ておくと予測しやすくなります（ページ末の参考リンク）。",
      ],
      en: [
        "Tokyo Tower is a 333-meter broadcasting tower in Shiba Park, Minato-ku, completed in 1958. When it opened it was the world's tallest self-supporting steel tower, and it is still the only red tower rising above central Tokyo. From the Shinkansen you see it on the east side (Seat E), always as a brief flash between buildings.",
        "The surroundings matter too. Shiodome's high-rises, the sweeping roof of Zojo-ji Temple, the distant silhouettes of Roppongi Hills and Toranomon Hills, and the redevelopment towers around Shinagawa all pass in sequence. Tokyo Tower is both the landmark itself and a compass mark that tells you which part of central Tokyo the train is crossing at that moment.",
        "At night the tower's design comes forward. Its baseline 'Landmark Light' switches between a cool summer white and a warm winter glow, while the seasonal 'Diamond Veil' illumination adds pinks, blues, or rainbow colors for events and anniversaries. The official illumination schedule is linked below the map.",
      ],
    },
    guideHighlight: {
      ja: "東京駅を出たら、まずE席側の窓を先に見ておくのがおすすめです。汐留や浜松町のビル群のすきまに、赤い縦のシルエットが一瞬だけ差し込みます。見えなくても、その先に続く品川の高層ビル街や芝公園の緑まで含めて、東京の中心部を横切っている実感を楽しんでください。夜はライトアップされた塔が特に映えます。",
      en: "As soon as the train leaves Tokyo Station, look toward the Seat E window early. A red vertical silhouette flashes through the gaps between the Shiodome and Hamamatsucho towers. Even if you miss the tower itself, the Shinagawa high-rise cluster and the green of Shiba Park make it clear you are crossing central Tokyo. At night, the illuminated tower stands out especially well.",
    },
    minutesFromTokyo: 3, side: "E", category: "classic", confidence: "verified", durationSec: 5, scene: "hills",
    image: "images/20250111_tokyo_tower_letus10.jpg",
    photoCredit: {
      ja: "@letus10 / 新幹線の車窓から",
      en: "@letus10 / Shinkansen window blog",
      url: "https://cotetu.seesaa.net/article/507672955.html",
      note: { ja: "ビルの合間に見える東京タワー", en: "Tokyo Tower between the buildings" },
    },
    photos: [
      {
        src: "images/20260712_tokyo_tower_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える東京タワー", en: "Tokyo Tower from Seat E on the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "東京を出てすぐ、ビルの間に赤い塔", en: "A red tower between buildings just after leaving Tokyo" },
      },
      {
        src: "images/20260629_tokyo_tower_night_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜の新幹線から見える東京タワー", en: "Tokyo Tower at night from the Shinkansen" },
        date: "2026-06-29",
        note: { ja: "夜の街に、東京タワー", en: "Tokyo Tower in the night city" },
      },
      {
        src: "images/20260629_tokyo_tower_night_2_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜のビルの合間に見える東京タワー", en: "Tokyo Tower between buildings at night" },
        date: "2026-06-29",
        note: { ja: "ビルの合間に光る塔", en: "A lit tower between buildings" },
      },
    ],
    references: [REFERENCES.tokyoTowerOfficial, REFERENCES.tokyoTowerLightup, REFERENCES.tokyoTowerBlog],
    map: { lat: 35.65858, lng: 139.74543, ja: "東京タワー", en: "Tokyo Tower" },
    viewpoint: { lat: 35.656460, lng: 139.757770 },
  },
  {
    id: "hinataoka",
    icon: "🏘️",
    ja: { name: "日向岡の街並み", area: "新横浜 → 小田原", hook: "斜面いっぱいに、色違いの三角屋根。", story: "日向岡（ひなたおか）は、神奈川県平塚市の北部・土屋地区の丘陵に広がる大規模住宅団地です。相模川を渡ってすぐ、E席側の丘の斜面に、赤・青・緑・灰などカラフルな三角屋根が計画的に並ぶ独特の街並みが一瞬だけ現れます。1990年代以降に開発された「日向岡タウン」を中心とした戸建て中心のニュータウンで、統一された住宅意匠が丘の等高線に沿って美しく並ぶことから、車窓の隠れた見どころとして密かに知られてきました。名所ではありませんが、「あ、あの三角屋根の丘だ」と気づく人が確実にいる、そんな景色です。" },
    en: { name: "Hinataoka Hillside Homes", area: "Shin-Yokohama → Odawara", hook: "Rows of colorful triangular roofs.", story: "Hinataoka is a large planned residential development in the Tsuchiya area of northern Hiratsuka City, Kanagawa Prefecture. Just after the train crosses the Sagami River, look on the Seat E side to see a hillside dressed in neatly aligned triangular roofs — red, blue, green and gray — climbing the contours in a distinctive pattern. Built mostly from the 1990s onward and centered on Hinataoka Town, this detached-housing new town is unusual for its coordinated architecture, which follows the shape of the hill. It is not a landmark, but many riders quietly recognize 'the colorful triangular-roof hill' from repeat trips." },
    pageTitle: {
      ja: "新幹線から見えるカラフルな三角屋根の街｜日向岡（平塚市） | 新幹線の窓",
      en: "The Colorful Triangular-Roof Hillside: Hinataoka in Hiratsuka | Shinkansen Window",
    },
    pageHeading: {
      ja: "斜面いっぱいに三角屋根——平塚・日向岡の街並み",
      en: "Triangular roofs across the hill: Hinataoka in Hiratsuka",
    },
    pageHeadingChunks: {
      ja: ["斜面いっぱいに三角屋根——", "平塚・日向岡の街並み"],
      en: ["Triangular roofs across the hill:", "Hinataoka in Hiratsuka"],
    },
    metaDescription: {
      ja: "新横浜〜小田原の間、新幹線のE席側に一瞬あらわれるカラフルな三角屋根の丘は、平塚市土屋地区の日向岡（ひなたおか）住宅団地です。景観の特徴と開発の背景、車窓での見つけ方を紹介します。",
      en: "Between Shin-Yokohama and Odawara, the hillside of colorful triangular roofs briefly visible from Seat E is Hinataoka Town in Tsuchiya, Hiratsuka City. Learn about this planned residential development and how to spot it from the Shinkansen.",
    },
    sectionHeading: {
      ja: "カラフルな三角屋根の街は何？",
      en: "What is this colorful triangular-roof neighborhood?",
    },
    pageStory: {
      ja: "日向岡（ひなたおか）は、神奈川県平塚市北部の土屋地区に広がる住宅団地の総称で、中心となる街区が「日向岡タウン」として1990年代に本格開発されました。丘陵地の斜面をなだらかに削って造成された宅地に、切妻の三角屋根と統一感のある外壁色を持つ戸建て住宅が並び、赤・青・緑・グレーなどのカラフルな屋根が等高線に沿って階段状に配置されています。日本の一般的な戸建て住宅地に比べて統一感が強く、遠景から見ると「模型のような街」に見えるのが特徴です。",
      en: "Hinataoka is the general name for a residential development in the Tsuchiya area of northern Hiratsuka City, Kanagawa Prefecture, whose core Hinataoka Town district was developed in earnest during the 1990s. Gently graded hillside lots are filled with detached homes sharing gabled triangular roofs and coordinated wall colors, with rooftops of red, blue, green and gray arranged in tiers along the contours. Compared with typical Japanese detached-housing districts, its visual consistency is unusual — from a distance, it can look like a scale model of a town.",
    },
    explainer: {
      heading: { ja: "なぜこんなに揃った街並み？", en: "Why does the neighborhood look this coordinated?" },
      ja: [
        "日本の一般的な戸建て住宅地は、施主ごとに異なるハウスメーカーが建てるため、屋根の形や外壁の色がばらばらになりがちです。それに対して日向岡タウンは、丘陵地を1つの街区として計画開発するにあたり、事業者側が屋根形状・屋根色・外壁色のパレットをある程度制限して分譲したことで、遠景から見たときの街並みの秩序を保っています。相模平野を見下ろす立地・南斜面の日照・宅地内の緑地整備など、住宅地としての快適性と、景観としての強さが両立している点が、この街の魅力です。",
        "車窓では、相模川を渡ってから丹沢山地寄りに視線を向けると、丘の斜面に赤や青の点が集まっているのが目に入ります。晴れた日ほど屋根の色がくっきりし、桜や新緑の季節には周辺の樹木の色と組み合わさって、小さなおもちゃ箱のような光景になります。",
        "同じ相模平野の車窓には、丹沢山地の背後にそびえる富士山、東名高速、進む先の小田原・箱根の山々など見どころが多く、日向岡はその中で「一瞬だけ現れるカラフルな計画住宅地」として、視覚のアクセントになっています。",
      ],
      en: [
        "Ordinary Japanese detached-housing districts tend to look visually mixed because each buyer commissions a different builder, producing varied roofs and wall colors. Hinataoka Town, by contrast, was master-planned as a single hillside district, and the developer imposed a limited palette for roof shapes, roof colors and exterior colors on the lots it sold. That coordination is why the district still reads as one composed landscape from a distance. Combined with south-facing slopes above the Sagami plain and generous internal green space, it balances comfortable living with a distinctive visual identity.",
        "From the train, after crossing the Sagami River, look toward the Tanzawa mountain foothills; you will notice a cluster of red and blue dots on a hillside. Sunny days make the roof colors especially crisp, and in cherry-blossom or fresh-green seasons the surrounding trees add to the effect, giving the hill a small toy-box quality.",
        "This stretch of Sagami plain has several highlights — Mt. Fuji rising behind the Tanzawa range, the Tomei Expressway, and the approaching Odawara and Hakone mountains — and Hinataoka fits in as 'the brief flash of a coordinated colorful hillside' that punctuates them.",
      ],
    },
    guideHighlight: {
      ja: "相模川を渡り終わって少ししたら、E席側の遠く、丹沢の裾野へ続く丘の斜面を探してください。三角屋根がカラフルに並ぶ一角があります。派手なランドマークではないので、事前に「三角屋根の丘」と頭に入れておくのが見つけるコツです。",
      en: "Shortly after crossing the Sagami River, look far off on the Seat E side, toward the foothills climbing into the Tanzawa range. Somewhere in that hillside, a patch of colorful triangular roofs stands out. It is not a bold landmark, so remembering 'the triangular-roof hill' in advance is the key to spotting it.",
    },
    minutesFromTokyo: 27, side: "E", category: "notable", confidence: "verified", durationSec: 3, scene: "hills",
    image: "images/20260530_hinataoka.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-05-30",
      note: { ja: "カラフルな三角屋根が並ぶ「日向岡住宅」", en: "Colorful triangular roofs line up in Hinataoka." },
    },
    photos: [
      {
        src: "images/20260530_hinataoka_2_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える日向岡の住宅地", en: "Hinataoka hillside homes from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
        note: { ja: "カラフルな三角屋根が並ぶ「日向岡住宅」", en: "Colorful triangular roofs line up in Hinataoka." },
      },
    ],
    references: [REFERENCES.hinataokaRakumachi, REFERENCES.hiratsukaHousing],
    map: { lat: 35.34154388360787, lng: 139.30266552622092, ja: "日向岡 住宅地 平塚", en: "Hinataoka Hiratsuka" },
    viewpoint: { lat: 35.34051032924051, lng: 139.3058437145373 },
  },
  {
    id: "ota-fuji",
    icon: "🗻",
    ja: { name: "都内からの富士山", area: "品川 → 新横浜（大田区付近）", hook: "東京を出て、最初の富士。", story: "品川を過ぎて多摩川へ向かう途中、空気が澄んだ日には大田区付近から富士山がぽつんと見えることがあります。手前には品川再開発の高層ビル、大井の車両基地、羽田の空、そして工場や住宅が広がる大田区の街並み——その向こうに小さく浮かぶ早い合図です。新富士で見る大きな富士山とは違い、都市越しに見つける富士山。見えたら、その日の旅は少し幸先がいい。" },
    en: { name: "Mt. Fuji from Ota", area: "Shinagawa → Shin-Yokohama", hook: "The first Fuji after Tokyo.", story: "After Shinagawa, on the way toward the Tama River, Mt. Fuji can appear on unusually clear days above the rooftops of Ota. The foreground is dense central Tokyo: the redevelopment towers around Shinagawa, the vast Oi train depot, the sky over Haneda Airport, and the mix of factories and housing that fills Ota. This is not the big Fuji near Shin-Fuji — it is a small, early hint of the mountain, framed by the city. If you catch it, the journey starts with a quiet reward." },
    pageTitle: {
      ja: "新幹線から見える都内の富士山｜品川〜新横浜のE席で探す | 新幹線の窓",
      en: "Mt. Fuji from Central Tokyo | Spotting Fuji from Seat E, Shinagawa to Shin-Yokohama",
    },
    pageHeading: {
      ja: "東京の街並み越しに見える、都内からの富士山",
      en: "Mt. Fuji seen across the Tokyo skyline",
    },
    pageHeadingChunks: {
      ja: ["東京の街並み越しに見える、", "都内からの富士山"],
      en: ["Mt. Fuji seen across", "the Tokyo skyline"],
    },
    metaDescription: {
      ja: "品川を過ぎて多摩川へ向かう区間で、大田区の街並み越しにぽつんと見える富士山を紹介。周辺の景色（品川の高層ビル・大井車両基地・羽田・大田区の工場地帯）と合わせて楽しむ見つけ方を解説します。",
      en: "Between Shinagawa and the Tama River, Mt. Fuji sometimes appears above Ota's rooftops. Learn where to look on Seat E and how it fits with the Shinagawa high-rises, Oi train depot, Haneda area and Ota's industrial neighborhoods.",
    },
    sectionHeading: {
      ja: "都内でも富士山は見える？どこで狙う？",
      en: "Can you really see Mt. Fuji from central Tokyo?",
    },
    pageStory: {
      ja: "品川を出て京急蒲田付近を通り、多摩川に近づくころ。東海道新幹線のE席側は、品川の再開発ビル群から一気に低い街並みへ変わります。晴れた朝や冬の乾いた空の日には、その低い屋根の遠くに小さな富士山が浮かびます。都心のビルに切り取られ、送電線と重なり、住宅街の向こうにぽつんと立つ富士山——見つけにくい代わりに、見えた瞬間の意外性はこの区間ならではです。",
      en: "After Shinagawa, as the train passes near Keikyu Kamata and approaches the Tama River, the Seat E side shifts from the redevelopment towers to a lower, denser cityscape. On clear mornings or dry winter days, a small Mt. Fuji floats far beyond those rooftops. It is a Fuji framed by city buildings, sliced by power lines, standing quietly beyond residential blocks. It is harder to find than the big Fuji later on — but the surprise of catching it in central Tokyo is unique to this stretch.",
    },
    explainer: {
      heading: { ja: "都内から富士山が見える条件と、周りの景色", en: "When can you see it, and what surrounds it?" },
      ja: [
        "都内から富士山が見える確率は、空気の乾いた冬から早春がもっとも高く、夏場は霞んでほとんど見えないのが普通です。朝は空気が澄んでいて視程が延び、午後になると都市の熱と水蒸気で見えづらくなる傾向があります。乗車前に、天気予報の湿度や視程を軽く見ておくと期待値の調整になります。",
        "手前の景色にも注目してください。品川駅周辺には近年整備された高層オフィスビルが並び、大井町付近ではJR東日本の車両基地が広がります。さらに進むと大田区の住宅地と町工場が続き、羽田空港へ向かう航空機の姿も入りやすい区間です。都会の日常のなかに、遠くの富士山が立つ——という構図そのものが、この車窓の主役です。",
        "見えなくても落ち込まないでください。この区間は「今日は都心が澄んでいるか」を確かめる指標のような場所でもあります。ここで見えなかった日でも、三島〜新富士では大きな富士山があらためて姿を見せてくれます。",
      ],
      en: [
        "Chances of seeing Mt. Fuji from central Tokyo are highest in the dry months of winter and early spring; summer is usually hazy. Mornings offer better visibility, while afternoons tend to lose it to urban heat and humidity. Glancing at the humidity and visibility forecast before you board helps set expectations.",
        "The foreground is part of the show. Around Shinagawa Station, newly built office towers line the tracks; near Oimachi, JR East's large train depots spread beside the line. Further on, Ota's residential blocks and small factories continue, and aircraft climbing from or descending to Haneda often enter the frame. A distant Fuji standing behind everyday Tokyo — that composition itself is the point of this view.",
        "Do not worry if you cannot see it. This stretch is really an indicator of how clear central Tokyo is today. Even on days when Fuji stays hidden here, the mountain fills the window again between Mishima and Shin-Fuji.",
      ],
    },
    guideHighlight: {
      ja: "品川を出たあとは、まずE席側の遠くをぼんやり見てください。近くのビルよりも「屋根の稜線の向こう」に富士山らしい輪郭を探すのがコツです。手前の景色（高層ビル・車両基地・住宅街）も一緒に眺めると、都心を横切っている実感が強くなります。",
      en: "After Shinagawa, let your eyes drift toward the far distance on Seat E. Look beyond the near buildings, along the ridge of rooftops, for a small triangular silhouette. Watching the foreground (skyscrapers, train depots, low neighborhoods) at the same time makes the sense of crossing central Tokyo much stronger.",
    },
    minutesFromTokyo: 10, side: "E", category: "notable", confidence: "needs-check", durationSec: 30, scene: "fuji",
    image: "images/20260509_ota_fuji_t_yangyang.jpg",
    photoCredit: {
      ja: "@T_Yangyang",
      en: "@T_Yangyang",
      url: "https://x.com/T_Yangyang/status/2056673343630426163",
      note: { ja: "大田区付近から見える富士山", en: "Mt. Fuji seen from around Ota." },
    },
    references: [REFERENCES.weatherFuji, REFERENCES.otaFujiEarlyMorning],
    map: { lat: 35.360625, lng: 138.727363, ja: "富士山（大田区付近からの遠望対象）", en: "Mt. Fuji, viewed from around Ota" },
    viewpoint: { lat: 35.600575, lng: 139.734265 },
  },
  {
    id: "maruko-bridge",
    icon: "🌉",
    ja: { name: "丸子橋", area: "品川 → 新横浜（多摩川付近）", hook: "多摩川に、青いアーチ橋。", story: "品川を過ぎて新横浜へ向かう途中、多摩川を渡る前後でE席側に青いアーチの丸子橋があらわれます。東京都大田区田園調布本町と、川崎市中原区上丸子八幡町を結ぶ国道1号（旧東海道の系譜を継ぐ道）の橋で、東京のビル街から一気に川の景色に切り替わる序盤の小さな節目です。現在の橋は2000年に架け替えられた2代目で、青く塗られたブレースドリブ・タイドアーチ橋という珍しい形式。映画『シン・ゴジラ』にゴジラ第2形態が上陸するシーンなど、ドラマ・映画のロケ地としても知られます。橋のすぐ手前（多摩川台）には亀甲山古墳を含む多摩川台古墳群の緑が広がり、都心近郊とは思えない古代の面影が重なります。" },
    en: { name: "Maruko Bridge", area: "Shinagawa → Shin-Yokohama, near the Tama River", hook: "A blue arch over the Tama River.", story: "After Shinagawa, as the train heads toward Shin-Yokohama, the blue-painted arch of Maruko Bridge comes into view on the Seat E side as you cross the Tama River. Carrying National Route 1 — an heir to the old Tokaido highway — the bridge links Denenchofu-honmachi in Ota, Tokyo with Kami-Maruko in Nakahara, Kawasaki. It marks a small early turning point in the ride, where central Tokyo suddenly becomes river scenery. The current bridge is a second-generation braced-rib tied-arch bridge, rebuilt in 2000 and unusual in Japan. Film fans may know it as one of the landmarks in Shin Godzilla, where Godzilla's second form crawls ashore nearby. Just before the bridge on the Tokyo side rises the green of Tamagawadai Park, home to the Kamenokoyama Kofun and several other early tumuli — an ancient presence you rarely expect this close to central Tokyo." },
    pageTitle: {
      ja: "新幹線から見える丸子橋｜多摩川の青いアーチ橋 | 新幹線の窓",
      en: "Maruko Bridge from the Shinkansen | Blue Arch over the Tama River",
    },
    pageHeading: {
      ja: "多摩川を渡る合図——青いアーチの丸子橋",
      en: "Crossing the Tama on a blue arch: Maruko Bridge",
    },
    pageHeadingChunks: {
      ja: ["多摩川を渡る合図——", "青いアーチの丸子橋"],
      en: ["Crossing the Tama on a blue arch:", "Maruko Bridge"],
    },
    metaDescription: {
      ja: "新幹線が多摩川を渡る前後、E席側に見える青いアーチ橋が丸子橋。国道1号の橋で、映画『シン・ゴジラ』のロケ地としても知られる橋の由来、アーチの構造、周辺の多摩川台古墳群まで紹介します。",
      en: "As the Shinkansen crosses the Tama River, the blue arch on the Seat E side is Maruko Bridge — a National Route 1 crossing between Ota, Tokyo and Kawasaki. Learn its history, its unusual arch design, its Shin Godzilla connection, and the ancient tumuli beside it.",
    },
    sectionHeading: {
      ja: "この青いアーチ橋は何？",
      en: "What is this blue arch bridge?",
    },
    pageStory: {
      ja: "丸子橋は多摩川の下流にかかる国道1号の橋で、東京都大田区田園調布本町側と、川崎市中原区上丸子八幡町側を結んでいます。最初の橋は1934年（昭和9年）、初代・東京五輪招致とほぼ同時期の重要インフラとして架けられました。歩道と車道を備えた鋼製アーチ橋で、多摩川下流の代表的な橋のひとつとして70年近く使われ続けたのち、老朽化と交通量増加に対応するため2000年に2代目が架け替え竣工しました。現在の橋は青色に塗られたブレースドリブ・タイドアーチ橋という珍しい形式で、初代の姿を意識した意匠のバランスが評価されています。",
      en: "Maruko Bridge is a National Route 1 crossing over the lower Tama River, linking Denenchofu-honmachi in Ota, Tokyo with Kami-Maruko in Nakahara, Kawasaki. The first bridge opened in 1934 as a key piece of infrastructure and served central-Tokyo traffic for nearly seventy years. Rising traffic and age eventually required replacement, and the current second-generation bridge was completed in 2000 as a braced-rib tied-arch bridge — an unusual form in Japan. Painted a distinctive blue, its design deliberately echoes the original's silhouette.",
    },
    explainer: {
      heading: { ja: "青いアーチと、周辺のもう一つの顔", en: "The blue arch and a second, older face of the area" },
      ja: [
        "現在の丸子橋のアーチは、上向きに湾曲した主構と斜めに交差する副材（ブレース）を組んだ「ブレースドリブ・タイドアーチ」と呼ばれる形式です。全長は約400m、中央のアーチ支間が160m以上あります。青いカラーリングは、多摩川の水色と河川敷の緑に合わせて選ばれたと言われ、対岸の武蔵小杉のタワマン群と対比する形で、都心通勤路の景観アイコンにもなっています。",
        "橋の東京側の手前、多摩川台には多摩川台公園と多摩川台古墳群があります。中でも亀甲山古墳（かめのこやまこふん）は4世紀後半に築かれた前方後円墳で、国指定史跡。都心近郊とは思えない緑の丘陵と、その中に眠る大型古墳の存在は、車窓から見えるコンクリートと川面の風景に「意外な深い時間」を差し込んでくれます。",
        "撮影スポットとしても人気で、映画『シン・ゴジラ』ではゴジラ第2形態が多摩川を遡上する場面の背景として登場しました。テレビドラマやドキュメンタリーの撮影も多く、東急東横線の多摩川鉄橋・武蔵小杉の高層ビル群と組み合わせて撮られる、川崎・大田の代表的な都市景観のひとつです。",
      ],
      en: [
        "The current arch is what engineers call a braced-rib tied-arch — a curved main rib stiffened by diagonal cross-bracing. It is roughly 400 meters long, with a central arch span of over 160 meters. The blue color was chosen to blend with the Tama River's water and the riverside greenery, and today it forms a visual counterpart to the tall towers of Musashi-Kosugi rising on the opposite bank.",
        "Just before the bridge on the Tokyo side lies Tamagawadai Park and the Tamagawadai kofun cluster. Its centerpiece, Kamenokoyama Kofun, is a keyhole-shaped tumulus built in the late 4th century and designated a National Historic Site. Finding a wooded ridge with a large ancient tumulus this close to central Tokyo adds an unexpectedly deep layer of time to a view otherwise dominated by concrete and river.",
        "The bridge is also a popular filming location. In Shin Godzilla (2016), Godzilla's second form appears crawling up the Tama River with Maruko Bridge in the background. Together with the Tokyu Toyoko Line's Tama River bridge and the Musashi-Kosugi high-rises, it is one of the most recognizable urban river scenes on the Kawasaki-Ota border.",
      ],
    },
    guideHighlight: {
      ja: "多摩川を渡る少し前、E席側の遠くに青いアーチの輪郭を探してください。渡り始める瞬間から、川面と橋、その先に武蔵小杉のタワマン群という都市景観がまとまって窓に入ります。多摩川を渡り終える前に、東京側の亀甲山古墳の緑もちらりと見えます。夜は橋の照明が川面に長く伸び、タワマンの窓明かりと合わせて、昼とはまったく違う光の景色になります。",
      en: "Just before the train crosses the Tama, look far off on the Seat E side for the blue arch. The moment you start crossing, the river surface, the arch itself, and the Musashi-Kosugi towers beyond come into the window as a single urban composition. If you glance back toward Tokyo just before finishing the crossing, you can catch the wooded hill of Kamenokoyama Kofun too. At night the bridge lights stretch out across the water and combine with the lit windows of the towers, making a completely different scene from the daytime one.",
    },
    routeNote: {
      ja: "東京から新大阪方面へ向かう場合は、品川を出て多摩川を渡る直前、E席・山側の窓を見てください。新大阪から東京方面へ向かう場合は、新横浜を出て多摩川を渡り始める直前がタイミングで、同じくE席側に青い丸子橋が見えます。",
      en: "From Tokyo toward Shin-Osaka, watch the Seat E (mountain) side just before crossing the Tama River after Shinagawa. From Shin-Osaka toward Tokyo, look for the blue arch on the same Seat E side just as the train starts crossing the Tama River after leaving Shin-Yokohama.",
    },
    minutesFromTokyo: 13, side: "E", category: "notable", confidence: "verified", durationSec: 3, scene: "bay",
    image: "images/20260704_maruko_bridge_1_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-07-04",
      note: { ja: "のぞみ27号・E席側、東京11:12発、11:25撮影", en: "Nozomi 27, Seat E side, Tokyo 11:12 departure, photographed at 11:25." },
    },
    photos: [
      {
        src: "images/20260712_maruko_bridge_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える丸子橋", en: "Maruko Bridge from Seat E on the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "多摩川にかかる青いアーチ橋", en: "The blue arch bridge over the Tama River" },
      },
      {
        src: "images/20260704_maruko_bridge_2_michikusa.jpg",
        alt: { ja: "多摩川越しに見える丸子橋", en: "Maruko Bridge seen across the Tama River" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-04",
        note: { ja: "多摩川と河川敷越しに見える丸子橋", en: "Maruko Bridge beyond the Tama River and riverside fields" },
      },
      {
        src: "images/20250531_maruko_bridge_letus10.jpg",
        alt: { ja: "新幹線のE席側から見える丸子橋", en: "Maruko Bridge from Seat E" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/515810649.html",
        date: "2025-05-31",
        note: { ja: "橋の形がわかりやすい車窓写真", en: "A window photo that clearly shows the bridge shape" },
      },
      {
        src: "images/20260629_2320_maruko_bridge_night_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜の新幹線から見える丸子橋付近", en: "Around Maruko Bridge at night from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-06-29",
        note: { ja: "夜の多摩川に続く橋の灯り", en: "Bridge lights stretching across the night Tama River" },
      },
    ],
    references: [REFERENCES.marukoBridgeWiki, REFERENCES.kamenokoyamaKofun, REFERENCES.marukoBridgeBlog],
    map: { lat: 35.58537, lng: 139.66883, ja: "丸子橋 多摩川", en: "Maruko Bridge Tama River" },
    viewpoint: { lat: 35.581074, lng: 139.670656 },
  },
  {
    id: "musashi-kosugi-towers",
    icon: "🏙️",
    ja: { name: "武蔵小杉のタワマン群", area: "品川 → 新横浜（武蔵小杉付近）", hook: "川を越えた、塔の街。", story: "東京から新大阪へ向かうと、丸子橋で多摩川を渡ってすぐ、E席側に武蔵小杉のタワーマンション群が壁のように立ち上がります。もともとは工場跡地だった一帯に、2000年代後半から次々と超高層マンションが建ち、今では駅周辺だけで20棟以上、住宅系タワーが並ぶ日本有数の集積地になりました。名所というより、首都圏の変化そのものを短い車窓に凝縮した景色です。昼は建物の高さが、夜は積み上がった窓明かりが印象に残ります。" },
    en: { name: "Musashi-Kosugi Towers", area: "Shinagawa → Shin-Yokohama, around Musashi-Kosugi", hook: "A wall of towers after the river.", story: "Heading from Tokyo toward Shin-Osaka, just after Maruko Bridge crosses the Tama River, a wall of Musashi-Kosugi high-rises rises on the Seat E side. Built mostly since the late 2000s on former factory land, over twenty residential and mixed-use towers now cluster around the station — one of Japan's densest concentrations of tall apartment buildings. It is not a classic landmark but a compact record of how Greater Tokyo has changed. By day the sheer height stands out; at night, the stacked window lights do." },
    pageTitle: {
      ja: "武蔵小杉のタワマン群｜新幹線から見える再開発の街 | 新幹線の窓",
      en: "Musashi-Kosugi Towers from the Shinkansen | Kawasaki's New Skyline",
    },
    pageHeading: {
      ja: "多摩川を越えたら、塔の街——武蔵小杉のタワマン群",
      en: "After the Tama River: the Musashi-Kosugi tower cluster",
    },
    pageHeadingChunks: {
      ja: ["多摩川を越えたら、塔の街——", "武蔵小杉のタワマン群"],
      en: ["After the Tama River:", "the Musashi-Kosugi tower cluster"],
    },
    metaDescription: {
      ja: "新幹線のE席側、多摩川を越えたすぐに現れる武蔵小杉のタワーマンション群。再開発の経緯、なぜ武蔵小杉に集中したのか、いま何棟あるのかを、車窓の見つけ方と合わせて紹介します。",
      en: "Right after crossing the Tama River, a wall of Musashi-Kosugi high-rises appears from Seat E on the Shinkansen. Learn how this redevelopment happened, why it concentrated at Kosugi, and how to spot it from the train.",
    },
    sectionHeading: {
      ja: "この塔の街は、いつからできた？",
      en: "How did this tower cluster come about?",
    },
    pageStory: {
      ja: "東海道新幹線が丸子橋で多摩川を渡ってすぐ、E席側に迫るのが武蔵小杉のタワーマンション群です。ここは川崎市中原区。もともとはNEC、三菱ふそう、日本電気硝子など大企業の工場や社宅が広がっていた地区でした。2000年代に入って生産機能が郊外や海外へ移転すると、大規模な用地転換が始まり、川崎市の「小杉駅周辺再開発」計画に沿って、住宅・オフィス・商業を積み上げた超高層タワーが次々に立ち上がっていきました。新幹線から見えるのは、その再開発が完成後に描いた新しいスカイラインそのものです。",
      en: "Right after the Shinkansen crosses the Tama River on Maruko Bridge, the Musashi-Kosugi tower cluster comes into view on the Seat E side. This is Nakahara Ward, Kawasaki City. The area was once filled with factories and company housing of major manufacturers such as NEC, Mitsubishi Fuso and Nippon Electric Glass. When those production functions moved to the suburbs or overseas in the 2000s, large plots of land opened up for redevelopment. Following Kawasaki City's plan for the Kosugi Station area, tall towers combining housing, offices and shops were built one after another. What you see from the train is the skyline this redevelopment produced.",
    },
    explainer: {
      heading: { ja: "なぜ武蔵小杉に、これだけ集まった？", en: "Why did so many towers concentrate at Musashi-Kosugi?" },
      ja: [
        "武蔵小杉駅は、JR南武線・横須賀線・湘南新宿ライン・東急東横線・目黒線が交わる交通結節点です。品川・東京・渋谷・新宿・横浜のいずれへも20〜30分圏で出られる位置にあり、東京都心・横浜の両方に通勤できる立地は、超高層マンションの需要を強く後押ししました。2010年に横須賀線武蔵小杉駅が新設されたことで交通利便がさらに底上げされ、再開発と入居のペースを一気に加速させたと言われます。",
        "供給側の条件も揃っていました。駅の南側・北側には広い工場跡地がまとまって残っており、大街区での一体的な計画開発がしやすかったこと。川崎市が容積率緩和や公開空地を組み合わせた再開発制度を活用したこと。結果として、2008年以降だけで住宅系・オフィス系を合わせて20棟以上のタワーが集積し、いまも住宅系の超高層計画が続いています。新幹線の窓から見える「塔の街」は、そのまま平成後期〜令和の都市計画の縮図です。",
        "課題も知られています。学校・保育・鉄道の混雑、2019年台風19号での多摩川氾濫による内水被害など、超高層集積の副作用は都市計画上の教材にもなりました。車窓で見えるまばゆいスカイラインの背後には、そうした議論と対策の積み重ねがあります。",
      ],
      en: [
        "Musashi-Kosugi Station is a hub where JR Nambu, Yokosuka, Shonan-Shinjuku, and the Tokyu Toyoko and Meguro lines meet. From here, Shinagawa, Tokyo, Shibuya, Shinjuku and Yokohama are all reachable in 20 to 30 minutes, making the area attractive to commuters bound for both central Tokyo and Yokohama. The 2010 opening of the Yokosuka Line platform at Musashi-Kosugi further boosted access and clearly accelerated the pace of new construction and move-ins.",
        "Supply-side conditions aligned too. Large, contiguous factory sites remained on both the north and south sides of the station, making unified large-block planning possible. Kawasaki City used redevelopment schemes that combined higher floor-area ratios with public open space. As a result, since 2008 more than twenty residential and office high-rises have been added, with more still under way. The tower cluster you see from the Shinkansen is, in effect, a compact picture of Japanese late-Heisei-to-Reiwa urban planning.",
        "The concentration has drawn known concerns as well: crowding on schools, childcare and trains, and flooding of low-lying areas during Typhoon Hagibis in 2019. The bright skyline hides an ongoing discussion about how to manage that scale. Knowing this makes the brief window view more interesting rather than less.",
      ],
    },
    guideHighlight: {
      ja: "丸子橋を渡り終える瞬間から、E席側の外を先に見ておくと迫力があります。多摩川の開けた空から、いきなり縦のスカイラインが立ち上がる切り替わりを楽しんでください。夜は窓明かりが層になって、都市の密度がいっそう強く見えます。",
      en: "The strongest moment is the second you finish crossing the Tama River. Look toward Seat E in advance and enjoy the sudden switch from open sky above the river to a vertical wall of towers. At night, the layered apartment lights show the sheer density even more clearly.",
    },
    minutesFromTokyo: 14, side: "E", category: "notable", confidence: "verified", durationSec: 8, scene: "hills",
    image: "images/20260704_musashi_kosugi_towers_1_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-07-04",
      note: { ja: "のぞみ27号・E席側、東京11:12発、11:26撮影", en: "Nozomi 27, Seat E side, Tokyo 11:12 departure, photographed at 11:26." },
    },
    photos: [
      {
        src: "images/20260712_musashi_kosugi_towers_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える武蔵小杉のタワマン群", en: "Musashi-Kosugi towers from Seat E on the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "多摩川を越えたあとに立ち上がる塔の街", en: "A vertical city rising after the Tama River" },
      },
      {
        src: "images/20260704_musashi_kosugi_towers_2_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える武蔵小杉のタワマン群", en: "Musashi-Kosugi towers from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-04",
        note: { ja: "丸子橋を過ぎてすぐに見えるタワマン群", en: "High-rise residential towers just after Maruko Bridge" },
      },
      {
        src: "images/20260629_musashi_kosugi_towers_night_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜の新幹線から見える武蔵小杉のタワマン群", en: "Musashi-Kosugi towers at night from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-06-29",
        note: { ja: "夜は窓明かりが積み重なる街並みに変わる", en: "At night, stacked apartment lights change the view" },
      },
    ],
    references: [REFERENCES.musashiKosugiKawasaki, REFERENCES.musashiKosugiTowers],
    map: { lat: 35.57563, lng: 139.661659, ja: "武蔵小杉駅周辺のタワーマンション群", en: "Musashi-Kosugi high-rise cluster" },
    viewpoint: { lat: 35.575200, lng: 139.663058 },
  },
  {
    id: "putiputi-sign",
    icon: "🫧",
    ja: { name: "私は誰でしょう看板", area: "新横浜 → 小田原（藤沢市付近）", hook: "私は誰でしょう？", story: "新横浜から小田原へ向かう途中、A席側に「私は誰でしょう」と問いかける謎の看板が見えます。右上にはQRコードもありますが、新幹線の速度では読み取るのはかなり困難。もともとはプチプチ®で知られる川上産業の広告が出ていた場所で、沿線の看板は時々変わります。隣にはおなじみの727 COSMETICS看板。短い出会いなので、少し幅を持って探してください。" },
    en: { name: "Who am I? Sign", area: "Shin-Yokohama → Odawara, around Fujisawa", hook: "Who am I?", story: "Between Shin-Yokohama and Odawara, a small mystery billboard on the Seat A side asks, 'Who am I?' There is also a QR code in the upper-right corner, but reading it from a Shinkansen window is realistically difficult. This spot previously carried an ad from Kawakami Sangyo, the company known for PUTIPUTI bubble wrap, and the trackside sign changes from time to time. Beside it is the familiar 727 COSMETICS sign, so start watching with a little margin." },
    pageTitle: {
      ja: "新幹線から見える「私は誰でしょう」看板はどこ？ | 新幹線の窓",
      en: "Who am I? Sign: A Mystery Shinkansen Billboard | Shinkansen Window",
    },
    pageHeading: {
      ja: "「私は誰でしょう」看板はどこ？",
      en: "Where is the “Who am I?” billboard seen from the Shinkansen?",
    },
    pageHeadingChunks: {
      ja: ["「私は誰でしょう」看板は、", "どこ？"],
      en: ["Where is the “Who am I?” billboard", "seen from the Shinkansen?"],
    },
    metaDescription: {
      ja: "新幹線から見える「私は誰でしょう」看板の場所と見える時刻、座席側を案内。新横浜から小田原へ向かう途中、藤沢市付近のA席側に現れる謎の看板です。もともとはプチプチ®で知られる川上産業の広告枠でした。",
      en: "The 'Who am I?' sign is a mystery trackside billboard seen from the Shinkansen near Fujisawa. Learn its seat side, timing and location, and its origin as a former PUTIPUTI bubble-wrap ad by Kawakami Sangyo.",
    },
    sectionHeading: {
      ja: "『私は誰でしょう』看板とは？",
      en: "What is the 'Who am I?' sign?",
    },
    pageStory: {
      ja: "この看板は、東京から小田原方面へ向かう新幹線のA席側、藤沢市葛原の農地に立つ複数枚の広告看板のうちのひとつです。同じ場所には長年、プチプチ®（気泡緩衝材）で知られる川上産業株式会社の広告が掲げられており、緑地帯の中でぷちっとした水色のイラストと商品名が目立つ、車窓の定番でした。2025年頃から現在のように「私は誰でしょう」というコピーとQRコードだけを掲げた匿名調の看板へ差し替えられ、SNSでも「あの謎看板は何」と話題になっています。",
      en: "This billboard is one of several roadside signs standing on farmland at Kuzuhara in Fujisawa, on the Seat A side of the Shinkansen as it heads from Tokyo toward Odawara. The same site for years carried an ad for Kawakami Sangyo Corporation, best known for its PUTIPUTI® bubble-wrap products, and the pale-blue bubble illustration was a familiar trackside sight amid the green fields. Around 2025 the sign was replaced with the current 'Who am I?' copy and a QR code alone — a deliberately anonymous look that has attracted online curiosity: what is this?",
    },
    explainer: {
      heading: { ja: "背景と楽しみ方", en: "The backstory and how to enjoy it" },
      ja: [
        "「プチプチ®」は、川上産業が1968年に日本で製造・発売を始めた気泡緩衝材の登録商標で、透明で気泡が並んだあの梱包材の代名詞として親しまれています。海外では bubble wrap が一般名詞ですが、日本語では商品名の『プチプチ』の方が生活語として定着しました。同社は長年ユーモアのある広告展開でも知られ、新幹線沿線のこの看板も、そのブランドコミュニケーションの一環として置かれていました。",
        "現在の「私は誰でしょう」看板は、あえて広告主を明示せず、QRコードでのアクセスに委ねる仕掛けです。新幹線の速度では車内からQRコードを読み取るのはほぼ不可能なので、実質的には「あの看板は何？」と気になった人が家に帰って調べる、という体験そのものが広告になっています。",
        "沿線の広告は数年単位で入れ替わることがあり、以前の姿を覚えている人にはノスタルジックな要素も。ページ内には、以前のプチプチ看板と現在の「私は誰でしょう」看板の両方の写真を掲載しています。",
      ],
      en: [
        "'PUTIPUTI®' is Kawakami Sangyo's registered trademark for the clear, air-bubble packaging material it began producing in Japan in 1968; it is the everyday Japanese word for what English speakers call bubble wrap. In Japan, the brand name has become the general term for the product. Kawakami Sangyo has long run playful advertising, and its trackside sign here was part of that brand communication.",
        "The current 'Who am I?' sign deliberately hides the advertiser's name, leaving only a QR code. At Shinkansen speeds, actually scanning the code from the train is essentially impossible — so the sign works because the very act of wondering, 'what was that?' and looking it up later is the advertisement.",
        "Trackside billboards in Japan often change every few years, so recent riders and long-time regulars may remember the spot differently. The photo gallery below includes both the earlier PUTIPUTI sign and the current 'Who am I?' one.",
      ],
    },
    guideHighlight: {
      ja: "新横浜を過ぎて藤沢市葛原付近に入ったら、A席側の田園の中を意識してください。「私は誰でしょう」と大きく書かれた白い看板と、右上にQRコードが並ぶ、少し不思議な広告が短い時間だけ現れます。同時にE席側では727看板と248看板も見え、この一帯は「沿線広告銀座」のような場所になっています。",
      en: "After Shin-Yokohama, as the train enters the Kuzuhara area of Fujisawa, watch the farmland on the Seat A side. A white sign that reads 'Who am I?' in large Japanese, with a QR code in the upper right, appears briefly. At almost the same moment, the 727 and 248 signs appear on the Seat E side — the area is something of a 'trackside billboard alley.'",
    },
    minutesFromTokyo: 29, side: "A", category: "curious", confidence: "verified", durationSec: 2, scene: "hills",
    image: "images/20260704_putiputi_sign_2_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-07-04",
      note: { ja: "のぞみ27号・A席側、東京11:12発、11:41撮影。2026年7月時点の謎看板", en: "Nozomi 27, Seat A side, Tokyo 11:12 departure, photographed at 11:41. The July 2026 mystery sign." },
    },
    photos: [
      {
        src: "images/20260704_putiputi_sign_1_michikusa.jpg",
        alt: { ja: "プチプチ系看板と727看板", en: "PUTIPUTI-like sign and a 727 sign" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-04",
        note: { ja: "A席側。となりにはおなじみの727 COSMETICS看板", en: "Seat A side. The familiar 727 COSMETICS sign sits next to it." },
      },
      {
        src: "images/20260712_who_am_i_sign_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える「私は誰でしょう」看板", en: "The 'Who am I?' sign from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "走行中はQRコードではなく、白い看板全体を目印に", en: "At speed, use the whole white sign as the marker rather than the QR code." },
      },
      {
        src: "images/20190127_putiputi_sign_putiputi0808.jpg",
        alt: { ja: "以前のプチプチ看板", en: "Earlier PUTIPUTI sign" },
        credit: { ja: "@PUTIPUTI_0808", en: "@PUTIPUTI_0808" },
        sourceUrl: "https://x.com/PUTIPUTI_0808/status/1089401678594433025",
        note: { ja: "川上産業（株）の公式アカウントより。以前の看板", en: "From Kawakami Sangyo's official account. Earlier sign." },
      },
    ],
    references: [
      REFERENCES.kawakamiSangyo,
      {
        label: { ja: "OCEANS: プチプチの話", en: "OCEANS: Story of PUTIPUTI (Japanese only)" },
        url: {
          ja: "https://oceans.tokyo.jp/article/detail/30210",
          en: "https://www.putiputi.co.jp/en/products-en/3005",
        },
      },
    ],
    map: { lat: 35.321496, lng: 139.285829, ja: "私は誰でしょう看板付近（旧プチプチ看板付近）", en: "Who am I? sign area, former PUTIPUTI sign area" },
    viewpoint: { lat: 35.322233, lng: 139.285276 },
  },
  {
    id: "727-board",
    icon: "7️⃣",
    ja: { name: "727看板と248看板", area: "新横浜 → 小田原（藤沢市付近）", hook: "あの数字、何？どこにある？", story: "新横浜を出て藤沢市へ入ると、727 COSMETICSの白い看板が沿線に何度か現れます。代表地点は葛原付近。E席側に黄色い「248」看板と並ぶ場所です。さらに小田原方面へ進むと、用田付近などではA席側にも727が見えます。727は大阪の化粧品メーカー、248は西八王子のきぬた歯科の広告です。" },
    en: { name: "727 and 248 Signs", area: "Shin-Yokohama → Odawara, around Fujisawa", hook: "What are those numbers, and where?", story: "After Shin-Yokohama, white 727 COSMETICS billboards appear several times as the train enters Fujisawa. The representative point is around Kuzuhara, where a 727 sign stands on the Seat E side beside a yellow '248' sign. Farther toward Odawara, more 727 signs appear on the Seat A side around Yoda and nearby areas. 727 is an Osaka cosmetics maker; 248 advertises Kinuta Dental in Nishi-Hachioji." },
    pageTitle: {
      ja: "新幹線から見える727・248看板はどこ？何の広告？ | 新幹線の窓",
      en: "727 and 248 Signs: Shinkansen Billboards Explained | Shinkansen Window",
    },
    pageHeading: {
      ja: "727・248看板はどこ？何の広告？",
      en: "What are the 727 and 248 billboards seen from the Shinkansen?",
    },
    pageHeadingChunks: {
      ja: ["727・248看板はどこ？", "何の広告？"],
      en: ["What are the 727 and 248 billboards", "seen from the Shinkansen?"],
    },
    metaDescription: {
      ja: "新幹線から見える727・248看板の正体と場所を解説。藤沢市葛原付近ではE席側に2つが並び、用田付近などではA席側にも727看板が見えます。",
      en: "A guide to the 727 and 248 billboards—the trackside signs seen from the Shinkansen—including what they advertise, where to find them, and which seat side to watch.",
    },
    pageStory: {
      ja: "東京から新大阪方面へ向かう場合は、新横浜を出て約8分後、藤沢市葛原付近でまずE席側を見てください。白い727看板と黄色い248看板が田園の中に並びます。これが地図で案内している代表地点です。その先、小田原方面へ進むと、用田付近や「私は誰でしょう看板」の隣など、A席側にも727が現れます。727は1か所だけではないため、「どこで見たか」によって席側が変わります。",
      en: "Heading from Tokyo toward Shin-Osaka, start watching Seat E roughly eight minutes after Shin-Yokohama. Around Kuzuhara in Fujisawa, the white 727 billboard and yellow 248 billboard stand together in the fields; this is the representative point shown on the map. Farther toward Odawara, more 727 signs appear on Seat A around Yoda and beside the 'Who am I?' sign. Because 727 has multiple locations, the correct seat side depends on which sign you are looking for.",
    },
    explainer: {
      heading: { ja: "727と248は何？ 数字の意味は？", en: "What do the 727 and 248 billboards mean?" },
      ja: [
        "727は、大阪の化粧品メーカー「セブンツーセブン」の看板です。公式沿革では1945年7月27日に創業。いちばんの特徴は「サロン専売」であることです。店頭やドラッグストアでは買えず、登録された美容室でのカウンセリングを通して販売されます。商品そのものを街で見かける機会は少ないのに、看板は新幹線沿線で何度も目に入る——この不思議さが、727が語り草になる理由です。",
        "看板のデザインも意図的です。大きく「727」、その下に小さく「COSMETICS」。高速で流れる車窓でも一瞬で「あの看板だ」と分かるようにするための見せ方です。東海道新幹線の沿線だけでも数多く点在し、乗るたびに同じ看板に出会います。富士山のような主役ではないけれど、日本の新幹線ユーザーには“おなじみの光景”。初めて乗る人にとっては、「727って何？」と気になる最初の謎かもしれません。",
        "隣の黄色い「248」看板は、西八王子の「きぬた歯科」の広告です。248を「ニシハチ」と読み、医院がある西八王子を表しています。きぬた歯科の公式アカウントもこの読み方を認めています。葛原付近では、白い727と黄色い248という数字だけの看板が並ぶため、意味を知らないといっそう謎めいて見えます。",
      ],
      en: [
        "727 is the sign of \"Seven Two Seven\" (727 COSMETICS), a cosmetics maker based in Osaka. Its official history records that the company was founded on July 27, 1945. The key thing to know is that 727 is salon-only: it is sold through registered hair salons with in-person advice, not through ordinary shops or drugstores. So the product is rarely seen around town, yet the signs repeatedly appear beside the Shinkansen. That contrast is why 727 has become such a talking point.",
        "The design is deliberate, too: a huge \"727\" with a small \"COSMETICS\" underneath, made to be recognized in a split second from a fast-moving train. There are many of these signs along the Tokaido Shinkansen, so you meet the same sign again and again. It is not a headline view like Mt. Fuji, but for Japanese riders it is a familiar part of the journey — and for first-time visitors, \"What is 727?\" is often the first little mystery of the ride.",
        "The yellow \"248\" sign beside it advertises Kinuta Dental in Nishi-Hachioji. The digits are read as \"Nishi-Hachi,\" a shorthand for Nishi-Hachioji; the clinic's official account has confirmed that reading. Around Kuzuhara, the white 727 and yellow 248 signs sit together, making the pair look even more mysterious if you do not know what the numbers mean.",
      ],
    },
    minutesFromTokyo: 26, side: "E", sideLabel: { ja: "A席・E席", en: "Seats A and E" }, category: "curious", confidence: "verified", durationSec: 2, scene: "hills",
    image: "images/20260704_727_board_kuzuhara_2_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-07-04",
      note: { ja: "のぞみ27号・E席側、東京11:12発、11:38撮影。藤沢市葛原付近", en: "Nozomi 27, Seat E side, Tokyo 11:12 departure, photographed at 11:38 near Kuzuhara, Fujisawa." },
    },
    photos: [
      {
        src: "images/20260704_727_board_kuzuhara_1_michikusa.jpg",
        alt: { ja: "248看板と並ぶ727 COSMETICS看板", en: "727 COSMETICS sign beside the 248 sign" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-04",
        note: { ja: "E席側。248看板と、みんなの介護看板の間に見える727", en: "Seat E side. 727 between the 248 sign and a care-service sign." },
      },
      {
        src: "images/20260629_727_board_2_2x_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える727 COSMETICS看板", en: "727 COSMETICS sign from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-06-29",
        note: { ja: "のぞみ99号・A席側、6:18撮影。用田付近のうち東京寄りの727看板。黄色い歯科看板の隣", en: "Nozomi 99, Seat A side, photographed at 6:18. The Tokyo-side 727 sign near Yoda, beside a yellow dental sign." },
      },
      {
        src: "images/20260629_727_board_1_4x_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える727 COSMETICS看板", en: "727 COSMETICS sign from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-06-29",
        note: { ja: "のぞみ99号・A席側、6:18撮影。藤沢市用田付近", en: "Nozomi 99, Seat A side, photographed at 6:18 near Yoda, Fujisawa." },
      },
    ],
    references: [REFERENCES.sevenTwoSevenNote, REFERENCES.sevenTwoSevenOfficial, REFERENCES.sevenTwoSevenHistory, REFERENCES.kinutaDentist248Post, REFERENCES.kinutaDentist248Meaning],
    map: { lat: 35.4167, lng: 139.428027, ja: "727看板と248看板 藤沢市葛原", en: "727 and 248 signs, Kuzuhara Fujisawa" },
    viewpoint: { lat: 35.415637, lng: 139.428588 },
  },
  {
    id: "sagami-fuji",
    icon: "🗻",
    ja: { name: "相模平野の富士山", area: "新横浜 → 小田原", hook: "丹沢山地の背後に、雄大な富士山。", story: "新横浜から小田原へ向かう途中、相模川が作り上げた広い相模平野の向こうに、丹沢山地の稜線を従えるようにして富士山がそびえます。新富士付近で窓いっぱいに迫る「主役の富士」とは違い、遠くに堂々と構える構図が特徴で、平野・丹沢の緑・箱根外輪山・その奥の富士山と、幾重にも重なる奥行きを一度に見られる区間です。空気の澄んだ冬から早春はもちろん、夏でも早朝や雨上がりなら意外と姿を見せてくれます。" },
    en: { name: "Mt. Fuji over Sagami Plain", area: "Shin-Yokohama → Odawara", hook: "Mt. Fuji rising behind the Tanzawa.", story: "Between Shin-Yokohama and Odawara, Mt. Fuji rises grandly beyond the wide Sagami Plain, framed by the ridges of the Tanzawa mountain range. Unlike the huge main-event Fuji that fills the window near Shin-Fuji, this is a Fuji seen from a distance — with the plain, the greens of Tanzawa, the outer rim of the Hakone caldera, and Mt. Fuji itself layered one behind the other. Dry winter and early-spring days give the sharpest views, but early mornings or after summer rain can also surprise you." },
    pageTitle: {
      ja: "新幹線から見える相模平野越しの富士山｜E席の遠望ポイント | 新幹線の窓",
      en: "Mt. Fuji over the Sagami Plain | Distant Fuji View from Seat E | Shinkansen Window",
    },
    pageHeading: {
      ja: "丹沢山地の背後にそびえる、相模平野越しの富士山",
      en: "Mt. Fuji beyond the Sagami Plain, rising behind the Tanzawa range",
    },
    pageHeadingChunks: {
      ja: ["丹沢山地の背後にそびえる、", "相模平野越しの富士山"],
      en: ["Mt. Fuji beyond the Sagami Plain,", "rising behind the Tanzawa range"],
    },
    metaDescription: {
      ja: "新横浜から小田原へ向かう区間、新幹線のE席側に、相模平野・丹沢山地・箱根外輪山を挟んで富士山がそびえる遠望ポイントがあります。見つけ方と最適な季節・時間帯を解説します。",
      en: "Between Shin-Yokohama and Odawara, Mt. Fuji rises behind the Tanzawa range across the wide Sagami Plain. Learn how to spot this distant Fuji from Seat E and which seasons and times give the best chance.",
    },
    sectionHeading: {
      ja: "相模平野の富士山とは？",
      en: "What is the Sagami Plain Fuji view?",
    },
    pageStory: {
      ja: "相模平野は、相模川と支流が神奈川県中央部に作った広大な沖積平野で、東を横浜方面、西を丹沢山地、南を相模湾に囲まれています。東海道新幹線は、新横浜を出てからこの平野を斜めに横切っていきます。晴れて空気が澄んでいる日、E席側の遠くには、平野の向こうに丹沢山地の緑の稜線が広がり、その奥から富士山が独立峰らしい鋭い三角形をのぞかせます。丹沢の高峰（大山・塔ノ岳・蛭ヶ岳）や箱根外輪山と重なることも多く、「あ、あそこにも富士山がある」と気づく人が多いポイントです。",
      en: "The Sagami Plain is a broad alluvial plain formed by the Sagami River and its tributaries in central Kanagawa Prefecture, bordered by the Yokohama area to the east, the Tanzawa range to the west, and Sagami Bay to the south. The Tokaido Shinkansen cuts diagonally across it after leaving Shin-Yokohama. On days with clear, dry air, look far off on the Seat E side: the plain opens toward the green ridge of the Tanzawa range, with Mt. Fuji poking out behind as a sharp independent triangle. It often overlaps visually with peaks like Mt. Oyama, Mt. To-no-dake or Mt. Hirugatake, or with the outer rim of the Hakone caldera — a favorite 'wait, there's Fuji too' moment for many riders.",
    },
    explainer: {
      heading: { ja: "見え方は季節と時間で変わる", en: "How the view changes with the season and time" },
      ja: [
        "冬から早春（12月〜3月）は空気が乾いていて視程が伸び、雪をかぶった真っ白な富士山と、まだ緑の少ない丹沢山地のコントラストがくっきり見えます。この時期は、朝から午前中にかけて特に見える確率が高いです。逆に夏は霞や積雲で見えない日が多く、たとえ姿があっても薄い水色にとけ込むように見える傾向があります。",
        "梅雨明け直後や台風後は、大気中の水蒸気が一気に洗われて突然きれいに見えることがあります。夕方は逆光でシルエット化するため、輪郭ははっきり見えても山肌のディテールは失われがちです。「見えたら幸運」と思って、期待しすぎず窓の外へ視線を送っておくのがおすすめです。",
        "この区間は東名高速や国道1号、相模川の緑の帯なども車窓に入り、富士山だけでなく神奈川西部の地形そのものを楽しめます。日向岡の三角屋根や小田原・箱根の山々といった前後の見どころとつなげて眺めると、相模平野の広がりが実感できます。",
      ],
      en: [
        "From winter through early spring (December to March), the air is dry and long-visibility days are common. Snow-covered white Fuji against the still-bare Tanzawa slopes stands out sharply. Mornings tend to give the best odds in this season. Summer is often hazy, and even when Fuji is technically visible, it can blend into the pale sky.",
        "Right after the rainy season lifts, or the day after a typhoon, atmospheric moisture is briefly cleared and unexpectedly crisp views are possible. Late in the afternoon, backlight turns the mountain into a silhouette — its outline may be sharp but its texture is lost. The best approach is to keep an eye on the window without expecting too much.",
        "This stretch of window includes the Tomei Expressway, National Route 1, and the green belt along the Sagami River, so you can enjoy the geography of western Kanagawa as a whole, not just Fuji. Pairing this scene with the triangular roofs of Hinataoka and the Odawara / Hakone mountains that follow gives a real sense of how wide the Sagami Plain is.",
      ],
    },
    guideHighlight: {
      ja: "相模川を渡る前後で、E席側の遠くに丹沢の緑の稜線を探し、その奥に「一段高くとがった白い（または灰青の）山影」を探してください。手前の丹沢と重なると分かりにくいので、視線を少し高く上げて眺めるのがコツです。冬の朝は特に見える確率が高くなります。",
      en: "As the train approaches or crosses the Sagami River, look far off on the Seat E side for the green ridge of Tanzawa; then raise your gaze a little higher for the 'sharper, taller white (or blue-gray) peak' behind it. Fuji can be hidden by overlapping Tanzawa ridges, so lifting your eyes slightly helps. Winter mornings offer the best chance.",
    },
    minutesFromTokyo: 25, side: "E", category: "notable", confidence: "verified", durationSec: 60, scene: "fuji",
    image: "images/20260530_sagami_fuji_hiratsuka_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-05-30",
      note: { ja: "平塚市内から、相模平野越しに見える富士山", en: "Mt. Fuji beyond Sagami Plain from Hiratsuka." },
    },
    photos: [
      {
        src: "images/20260530_sagami_fuji_samukawa_michikusa.jpg",
        alt: { ja: "寒川町付近から見える相模平野越しの富士山", en: "Mt. Fuji beyond Sagami Plain near Samukawa" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
        note: { ja: "丹沢・箱根の山なみの奥に富士山", en: "Mt. Fuji behind the Tanzawa and Hakone mountains" },
      },
      {
        src: "images/20240114_sagami_fuji_odawara_michikusa.jpg",
        alt: { ja: "小田原付近から見える富士山", en: "Mt. Fuji seen near Odawara" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2024-01-14",
        note: { ja: "小田原に近づくころの富士山", en: "Mt. Fuji as Odawara approaches" },
      },
    ],
    references: [REFERENCES.weatherFuji, REFERENCES.sagamiFujiTanzawa],
    map: { lat: 35.360625, lng: 138.727363, ja: "富士山（相模平野からの遠望対象）", en: "Mt. Fuji, viewed across Sagami Plain" },
    viewpoint: { lat: 35.392780295389095, lng: 139.37658144602017 },
  },
  {
    id: "odawara",
    icon: "🌊",
    ja: { name: "熱海と相模湾", area: "小田原 → 熱海", hook: "トンネルの合間、海がひらく。", story: "小田原を過ぎ、早川から熱海へ向かうA席側。トンネルの切れ目ごとに相模湾が現れ、斜面に重なる街、沖の初島、山上の熱海城へと景色が移ります。海がずっと続くのではなく、暗いトンネルのあとに青い水面が突然ひらく。その反復が、東京の都市風景から伊豆の旅へ切り替わる合図です。" },
    en: { name: "Atami & Sagami Bay", area: "Odawara → Atami", hook: "The sea opens between tunnels.", story: "After Odawara, watch Seat A from Hayakawa toward Atami. Sagami Bay flashes into view between tunnels, followed by the city climbing the slopes, Hatsushima offshore, and Atami Castle on its hill. The sea is not continuous; it opens suddenly after each stretch of darkness. That rhythm marks the shift from metropolitan scenery to the Izu coast." },
    pageTitle: {
      ja: "新幹線から見える熱海・相模湾｜初島と熱海城をA席から | 新幹線の窓",
      en: "Atami and Sagami Bay from the Shinkansen | Seat A Guide",
    },
    pageHeading: {
      ja: "トンネルの合間にひらく、熱海と相模湾",
      en: "Atami and Sagami Bay between the tunnels",
    },
    pageHeadingChunks: {
      ja: ["トンネルの合間にひらく、", "熱海と相模湾"],
      en: ["Atami and Sagami Bay", "between the tunnels"],
    },
    metaDescription: {
      ja: "小田原から熱海へ向かう新幹線のA席側では、トンネルの合間に相模湾、斜面の街、初島、熱海城が見えます。見つけ方とそれぞれの正体を写真付きで紹介します。",
      en: "Between Odawara and Atami, Seat A reveals Sagami Bay, the hillside city, Hatsushima Island, and Atami Castle in brief gaps between tunnels.",
    },
    sectionHeading: {
      ja: "新幹線から海が見えるのはどこ？",
      en: "Where does the sea appear from the Shinkansen?",
    },
    pageStory: {
      ja: "東京から新大阪方面へ向かうなら、小田原を出て魚籃観音像を過ぎたころからA席側を意識してください。早川から熱海まではトンネルが多く、相模湾は連続して見えるのではありません。窓が明るくなった一瞬に、海岸線と岬、斜面に広がる街が重なります。熱海が近づくと、沖に低く浮かぶ初島や、山の上の白い熱海城を見つけられることがあります。",
      en: "Heading from Tokyo toward Shin-Osaka, start watching Seat A after Odawara and the Gyoran Kannon statue. The Hayakawa–Atami stretch has many tunnels, so Sagami Bay appears in short openings rather than as one continuous panorama. In those bright gaps, the coastline, headlands, and hillside neighborhoods overlap. Near Atami, you may also pick out low-lying Hatsushima offshore and the white Atami Castle on the hill.",
    },
    explainer: {
      heading: { ja: "海の向こうと山の上、何が見えている？", en: "What are the island and the white castle?" },
      ja: [
        "熱海は、箱根外輪山へ続く山地から相模湾へ下る斜面に発達した街です。そのため車窓では、海だけでなく、山肌に重なる家やホテルまで一緒に見えます。平らな海辺の街ではなく、海・街・山が縦に重なることが、熱海らしい景色です。",
        "沖に低く浮かぶ島は初島です。熱海港から約10km沖にあり、周囲約4kmの有人島。大きな山には見えず、水平線の手前に細長く浮かぶ輪郭を探すのがコツです。",
        "山の上に見える白い天守風の建物は熱海城です。戦国時代から残る城ではなく、1959年に建てられた観光施設。錦ヶ浦の山上に立つため、新幹線からは熱海到着を知らせる白い目印になります。",
      ],
      en: [
        "Atami developed on steep slopes descending from the mountains toward Sagami Bay. From the train, the sea, stacked houses and hotels, and the green hills appear in layers. That vertical overlap is what makes the Atami coastline distinctive.",
        "The low island offshore is Hatsushima, an inhabited island about 10 kilometers from Atami Port and roughly 4 kilometers around. Look for a long, low outline in front of the horizon rather than a mountainous island.",
        "The white, castle-like building on the hill is Atami Castle. It is not a surviving feudal castle; it was built in 1959 as a tourist attraction. Its position above Nishikigaura makes it a useful visual marker that Atami is close.",
      ],
    },
    guideHighlight: {
      ja: "この区間の主役は、ひとつの建物ではなく景色の切り替わりです。魚籃観音像を過ぎたらA席側を見て、トンネルを抜けた瞬間の明るさに反応してください。初島は海上の低い輪郭、熱海城は山上の白い建物として探すと見つけやすくなります。",
      en: "The main attraction is the changing sequence rather than one landmark. After Gyoran Kannon, watch Seat A and react when the window brightens after a tunnel. Hatsushima is a low outline on the water; Atami Castle is the white building high on the slope.",
    },
    minutesFromTokyo: 36, side: "A", category: "classic", confidence: "verified", durationSec: 60, scene: "bay",
    image: "images/20260515_atami_sagami_bay.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-15" },
    photos: [
      {
        src: "images/20250523_hatsushima_letus10.jpg",
        alt: { ja: "新幹線のA席側から見える初島", en: "Hatsushima Island from Seat A" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/516720935.html",
        note: { ja: "初島: 静岡県唯一の有人島", en: "Hatsushima: Shizuoka's only inhabited island" },
      },
      {
        src: "images/20250524_atami_castle_letus10.jpg",
        alt: { ja: "新幹線のA席側から見える熱海城", en: "Atami Castle from Seat A" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/516721203.html",
        note: { ja: "熱海城: 1959年竣工の観光施設", en: "Atami Castle: a sightseeing facility completed in 1959" },
      },
      {
        src: "images/20260712_atami_castle_michikusa.jpg",
        alt: { ja: "夕暮れの斜面にほんのり光る熱海城", en: "Atami Castle faintly lit on the evening hillside" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "夕暮れ、山の上で白く光る熱海城", en: "At dusk, Atami Castle glows white on the hill." },
      },
    ],
    references: [REFERENCES.atami, REFERENCES.atamiHatsushima, REFERENCES.atamiCastle, REFERENCES.atamiCityEnvironment, REFERENCES.hatsushimaBlog, REFERENCES.atamiCastleBlog],
    map: { lat: 35.0864250, lng: 139.0786972, ja: "熱海城", en: "Atami Castle" },
    viewpoint: { lat: 35.100080, lng: 139.072350 },
  },
  {
    id: "odawara-castle",
    icon: "🏯",
    ja: { name: "小田原城", area: "小田原駅付近", hook: "のぞみでは、まばたきする間の城。", story: "小田原駅の前後、A席側に小田原城が一瞬だけ見えます。かつては北条五代が関東の中心として本拠を置き、豊臣秀吉の小田原征伐や幕末の攻防でも歴史の舞台になった城です。天守は明治期に廃城で失われましたが、1960年に鉄筋コンクリートで復興された白い天守が今も市街の中心にそびえます。のぞみでは本当に短い出会い。見えたら、旅の序章に小さな印がつきます。" },
    en: { name: "Odawara Castle", area: "Around Odawara Sta.", hook: "A castle in a blink.", story: "Around Odawara Station, Odawara Castle flashes by on the Seat A side. This was the stronghold of the Hojo clan, who ruled much of eastern Japan from here until Toyotomi Hideyoshi's 1590 siege ended their reign. The Edo-era keep was dismantled in the Meiji period, and the white concrete keep you can see today was rebuilt in 1960 as a museum. On Nozomi services that pass through, the moment is astonishingly short — but it marks the beginning of the journey." },
    pageTitle: {
      ja: "新幹線から見える小田原城｜北条氏の城をA席から一瞬で | 新幹線の窓",
      en: "Odawara Castle from the Shinkansen | The Hojo Fortress from Seat A",
    },
    pageHeading: {
      ja: "新幹線から一瞬だけ見える、小田原城の白い天守",
      en: "The white keep of Odawara Castle, glimpsed from the Shinkansen",
    },
    pageHeadingChunks: {
      ja: ["新幹線から一瞬だけ見える、", "小田原城の白い天守"],
      en: ["The white keep of Odawara Castle,", "glimpsed from the Shinkansen"],
    },
    metaDescription: {
      ja: "小田原駅前後、新幹線のA席側に一瞬見える白い天守は小田原城。北条五代の本拠、豊臣秀吉の小田原征伐、明治の廃城、1960年の復興天守まで、車窓と一緒に楽しむ城の背景を紹介します。",
      en: "The white keep glimpsed on Seat A around Odawara Station is Odawara Castle. Learn how it grew as the Hojo clan's stronghold, endured Toyotomi Hideyoshi's 1590 siege, was dismantled in Meiji, and was rebuilt in 1960 as today's museum keep.",
    },
    sectionHeading: {
      ja: "この白い天守は、どんな城？",
      en: "What is this white keep?",
    },
    pageStory: {
      ja: "小田原城は、15世紀後半から約100年、関東の広い範囲を治めた戦国大名・後北条氏（北条五代）の本拠です。周囲には広大な総構（そうがまえ）と呼ばれる防御ラインが張られ、当時の日本でも指折りの巨大城郭でした。1590年、豊臣秀吉が全国統一の総仕上げとして20万を超える軍勢で包囲したのが「小田原の陣」。北条氏はこの戦いで滅び、天下統一が事実上完成しました。江戸時代には稲葉氏・大久保氏の居城として整えられ、幕末には海防の要としても機能しました。",
      en: "Odawara Castle was the stronghold of the Later Hojo clan, who ruled much of eastern Japan for about a century from the late 1400s. Its outer defensive line — the so-called sogamae — was among the largest in medieval Japan. In 1590, Toyotomi Hideyoshi laid siege here with an army of more than 200,000 as the final step in unifying the country. The fall of the Hojo effectively completed that unification. In the Edo period, the castle was reorganized under the Inaba and later Okubo families, and during the closing years of the shogunate it served as a key coastal defense point.",
    },
    explainer: {
      heading: { ja: "今見えるのは、いつの天守？", en: "Which keep are you seeing today?" },
      ja: [
        "現在の天守は1960年（昭和35年）に鉄筋コンクリートで復興されたもので、江戸時代の絵図や旧模型を参考に、宝永期（18世紀初め）の姿を基本として外観復元されています。内部は歴史博物館で、北条氏の資料や小田原の街の変遷を伝える展示があり、最上階からは相模湾と箱根の山を一望できます。",
        "明治維新後、多くの城と同様に小田原城も一度は取り壊されましたが、戦後、市民の再建運動を経て天守が復興し、平成には常盤木門・銅門などの主要櫓門も伝統工法で再現されました。城址公園全体が国の史跡に指定されており、線路のすぐそばに歴史そのものが残るのは、東海道新幹線の車窓でも珍しい景色です。",
        "のぞみでは駅を通過するため見える時間は本当に一瞬です。停車するひかり・こだまでも、A席側の窓越しに樹木と街の合間から天守を探すことになります。見えたら、その日は少し運が良かったと思って良い車窓です。",
      ],
      en: [
        "The keep you see today was rebuilt in 1960 in reinforced concrete, its exterior modeled on the early-1700s (Hoei-era) form using old diagrams and models. Inside is a history museum with materials on the Hojo clan and the city's evolution; the top floor looks out over Sagami Bay and the Hakone mountains.",
        "Odawara Castle, like many others, was dismantled after the Meiji Restoration. Postwar civic campaigns rebuilt the keep, and in the Heisei era the Tokiwagi Gate and Akagane Gate were reconstructed using traditional techniques. The whole castle grounds are designated a National Historic Site — an unusually intact piece of history right beside the Shinkansen line.",
        "On a Nozomi passing through, the view is over in a moment. Even on stopping Hikari and Kodama services, you have to catch the keep between trees and buildings on the Seat A side. If you spot it, count it as a small piece of luck.",
      ],
    },
    guideHighlight: {
      ja: "駅ホームの少し手前、A席側の街並みの間に白い天守を探してください。目印は駅の北側にある小高い緑と、その上の白い建物。速度が落ちる停車列車ならより見つけやすく、通過列車では一瞬なので事前に窓の外を向いておくのがコツです。",
      en: "Look on the Seat A side a little before the station, between the buildings. Aim for the small green hill just north of the station and the white structure on top. Stopping services slow enough for a real look; on passing Nozomi, keep your eyes on the window before the station comes into sight.",
    },
    minutesFromTokyo: 31, side: "A", category: "curious", confidence: "verified", durationSec: 2, scene: "castle",
    image: "images/20251112_odawara_castle_castle_traveler.jpg",
    photoCredit: {
      ja: "@Castle_Traveler",
      en: "@Castle_Traveler",
      url: "https://x.com/Castle_Traveler/status/1992009734854218106",
      note: { ja: "のぞみではほんとに一瞬", en: "On Nozomi, it really is over in a blink." },
    },
    photos: [
      {
        src: "images/20250526_odawara_castle_letus10.jpg",
        alt: { ja: "新幹線のA席側から見える小田原城", en: "Odawara Castle from Seat A" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/516754194.html",
        note: { ja: "のぞみではほんとに一瞬", en: "On Nozomi, it really is over in a blink." },
      },
    ],
    references: [REFERENCES.odawaraCastle, REFERENCES.odawaraCastleOfficialEn, REFERENCES.odawaraCastleBlog],
    map: { lat: 35.2509722, lng: 139.1535778, ja: "小田原城", en: "Odawara Castle" },
  },
  {
    id: "gyoran-kannon",
    icon: "🙏",
    ja: { name: "魚籃観音像", area: "小田原 → 熱海（早川付近）", hook: "魚籠を持つ、白い観音。", story: "小田原を過ぎ、早川漁港のそばでA席側に一瞬あらわれる白い像は、東善院の魚籃大観音です。像の高さは約10m、蓮台まで含めると全体で13m前後。手にした魚籠（ぎょらん）は漁を守る象徴で、海上安全と大漁、そして魚介への感謝を願って1982年に建立されました。相模湾を望む早川の斜面に立ち、新幹線が海側へ景色を切り替える序章の目印になっています。" },
    en: { name: "Gyoran Kannon Statue", area: "Odawara → Atami, near Hayakawa", hook: "A white Kannon holding a fish basket.", story: "The white statue that flashes past on the Seat A side near Hayakawa Fishing Port is Gyoran Dai-Kannon at Tozen-in Temple. The image itself is about 10 meters tall — around 13 meters including its lotus pedestal — and holds a woven basket of fish, the traditional attribute of this form of Kannon. Erected in 1982 to pray for safety at sea, plentiful catches and gratitude for marine life, it stands on a slope above Sagami Bay and marks the moment the Shinkansen view opens toward the coast." },
    pageTitle: {
      ja: "小田原・早川の白い観音は何？東善院の魚籃大観音 | 新幹線の窓",
      en: "What is the white Kannon near Odawara? Gyoran Dai-Kannon | Shinkansen Window",
    },
    pageHeading: {
      ja: "小田原・早川の白い観音は何？",
      en: "What is the white Kannon near Odawara?",
    },
    pageHeadingChunks: {
      ja: ["小田原・早川の", "白い観音は何？"],
      en: ["What is the white Kannon", "near Odawara?"],
    },
    metaDescription: {
      ja: "小田原を過ぎて新幹線のA席側に一瞬見える白い観音は、早川漁港近くの東善院・魚籃大観音。高さ約10m、1982年建立。海上安全と大漁、魚介への感謝を願って建てられた像の背景と、車窓での見つけ方を紹介します。",
      en: "The white Kannon briefly seen from Seat A after Odawara is Gyoran Dai-Kannon at Tozen-in in Hayakawa: about 10 meters tall, erected in 1982 to pray for safety at sea, good catches and gratitude for marine life. Learn what it is and how to spot it from the train.",
    },
    sectionHeading: {
      ja: "魚籃観音とは？どんな信仰？",
      en: "What is Gyoran Kannon?",
    },
    pageStory: {
      ja: "魚籃観音（ぎょらんかんのん）は観音菩薩の三十三観音のうちの一体で、手に魚を入れた籠を持つ姿で表されます。中国・唐の時代に、魚を売る美しい娘に姿を変えて仏法を広めたという伝説に由来するとされ、日本では漁業関係者を中心に、魚介への慈しみと海上安全を祈る対象として信仰されてきました。早川の魚籃大観音は、この形の観音を10mを超える大きさで屋外に安置しているという点で全国的にも珍しい存在です。",
      en: "Gyoran Kannon is one of the traditional 33 forms of the Bodhisattva Kannon (Guanyin), depicted holding a basket of fish. The imagery is linked to a Tang-dynasty legend in which the bodhisattva appeared as a beautiful young woman selling fish to spread the Buddhist teaching. In Japan it has long been revered especially by people working with the sea, both as a prayer for safe voyages and good catches and as an expression of gratitude toward marine life. The 10-meter statue at Hayakawa is a rare example of this form enshrined outdoors at large scale.",
    },
    explainer: {
      heading: { ja: "早川に大きな観音が立つ理由", en: "Why a large Kannon stands at Hayakawa" },
      ja: [
        "早川はJR早川駅を中心とした小田原市南部の港町で、目の前には全国有数の水揚量を誇る早川漁港（小田原漁港）があります。定置網漁を主体に、四季を通じて多彩な魚が水揚げされる場所で、地元にとって「海の恵み」は生活そのもの。魚籃大観音は、この漁港の背後の斜面に立ち、海に出る人と海の生き物、その両方を包むように相模湾を向いています。",
        "像は東善院（真言宗）の境内にあり、正式には「魚籃大観音」と呼ばれます。台座までを含めた高さは約13m。1982年、地元の願いをまとめるかたちで建立されました。境内には水子供養の観音像も並び、静かな祈りの場になっています。",
        "新幹線からは、海側A席の窓外に、樹木のあいだから白い胴体と観音特有の穏やかな顔立ちが一瞬だけ差し込むように見えます。速度が速く、実物の大きさが直感的に伝わりにくいので、「意外と大きい」と知って眺めると印象が変わります。",
      ],
      en: [
        "Hayakawa is a fishing town at the southern edge of Odawara City, centered on Hayakawa (Odawara) Fishing Port, one of Japan's most productive coastal ports. Fixed-net fishing brings in a wide seasonal variety of fish here, so 'the bounty of the sea' has always been central to local life. The large Kannon sits on the slope behind the port, facing Sagami Bay as if watching over both the fishermen who go out and the sea life they draw on.",
        "The statue stands in the grounds of Tozen-in, a Shingon Buddhist temple, where it is formally known as Gyoran Dai-Kannon. Including the pedestal, its total height is about 13 meters. It was erected in 1982 to gather the community's prayers into one place. Nearby stand memorial statues for unborn children, adding to the quiet atmosphere of the grounds.",
        "From the train, on the Seat A side, only a brief slice of the white robe and the calm face of the bodhisattva shows through the trees. The speed makes it hard to grasp the true scale on the fly — knowing it is over ten meters tall changes how the moment reads.",
      ],
    },
    guideHighlight: {
      ja: "早川駅を通過するあたりで、A席側の斜面を見てください。海を背にした白い像は、木立の切れ間にほんの数秒だけ現れます。相模湾がA席側に開ける区間の入口の目印として覚えておくと、続く熱海・初島・熱海城の車窓もつながって楽しめます。",
      en: "Around Hayakawa Station, look toward the slope on the Seat A side. The white figure with the sea behind it shows only for a few seconds between the trees. Use it as a marker: right after the Kannon, Sagami Bay opens up on Seat A and the sequence continues with Atami, Hatsushima and Atami Castle.",
    },
    minutesFromTokyo: 33, side: "A", category: "curious", confidence: "verified", durationSec: 2, scene: "pagoda",
    image: "images/20260516_gyoran_kannon_michikusa.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-16" },
    references: [REFERENCES.gyoranKannon, REFERENCES.gyoranKannonTourism, REFERENCES.gyoranKannonWiki],
    map: { lat: 35.240947333816365, lng: 139.14421331844272, ja: "東善院 魚籃観音 小田原 早川", en: "Tozen-in Gyoran Kannon Odawara Hayakawa" },
    viewpoint: { lat: 35.24082633591658, lng: 139.14394093224604 },
  },
  {
    id: "fuji",
    icon: "🗻",
    ja: { name: "富士山", area: "三島 → 新富士", hook: "日本でいちばん有名な3分間。", story: "三島から新富士のあいだ、富士山が車窓いっぱいに迫ります。見えている時間はおよそ3〜4分。トンネルを抜けるたびに大きくなる富士山は、何度乗っても声が出ます。E席側、少し前から窓の外を。" },
    en: { name: "Mt. Fuji", area: "Mishima → Shin-Fuji", hook: "Japan's famous three minutes.", story: "Between Mishima and Shin-Fuji, Mt. Fuji fills the window — for roughly three to four minutes. It grows bigger after each tunnel, and it gets a gasp out of people every single time. Seat E side; be ready a little early." },
    pageTitle: {
      ja: "三島〜新富士の富士山｜新幹線の車窓写真と見どころ | 新幹線の窓",
      en: "Mt. Fuji between Mishima and Shin-Fuji | Shinkansen Window View",
    },
    pageHeading: {
      ja: "三島〜新富士、窓いっぱいの富士山",
      en: "Mt. Fuji filling the window between Mishima and Shin-Fuji",
    },
    pageHeadingChunks: {
      ja: ["三島〜新富士、", "窓いっぱいの富士山"],
      en: ["Mt. Fuji filling the window", "between Mishima and Shin-Fuji"],
    },
    metaDescription: {
      ja: "東海道新幹線の三島〜新富士で窓いっぱいに見える富士山を、車窓写真・地図・景色の変化で紹介。座席や列車別時刻の疑問は富士山FAQへ分けて案内します。",
      en: "See how Mt. Fuji changes between Mishima and Shin-Fuji through window photos, a map, and viewing highlights. Seat and timing questions are covered in the separate FAQ.",
    },
    sectionHeading: {
      ja: "この3〜4分で、富士山はどう見える？",
      en: "How does Mt. Fuji change during these three to four minutes?",
    },
    pageStory: {
      ja: "このページの主役は、東海道新幹線で富士山が最も大きく見える三島〜新富士の車窓です。三島を過ぎると、街並みや工場、田園の向こうに富士山が現れ、短いトンネルでいったん隠れ、抜けるたびに角度と手前の景色が変わります。冠雪した冬、雪のない夏、夕暮れの輪郭まで、同じ区間でも季節と光によって表情が大きく変わります。",
      en: "This page focuses on the classic Mishima–Shin-Fuji stretch, where Mt. Fuji appears largest from the Tokaido Shinkansen. Beyond Mishima, the mountain rises behind towns, factories, and fields, disappears in short tunnels, then returns with a different angle and foreground. Snowy winter, snowless summer, and dusk each turn the same three to four minutes into a different view.",
    },
    explainer: {
      heading: { ja: "写真で見る、三島〜新富士の変化", en: "Reading the Mishima–Shin-Fuji view through photos" },
      ja: [
        "三島寄りでは、富士山は街並みや送電線の向こうに現れます。最初から山だけが大きく見えるのではなく、日常の風景の背後から少しずつ存在感を増していくのが、この区間の面白さです。",
        "新富士へ近づくにつれて手前が田園や低い建物へ変わり、山頂から裾野までの輪郭を追いやすくなります。トンネルで何度か途切れるため、一度見えなくなっても終わりではありません。",
        "見えているあいだ、富士山の手前に横たわる低い山並みにも気づくはずです。これは愛鷹山（あしたかやま）で、富士山の南側に連なる独立した山群です。富士山の裾野の一部に見えますが別の山で、この区間では富士山の輪郭を手前から支えるように重なります。裾野がどこまで広がっているのかを目で追うとき、愛鷹山との境目が最初の手がかりになります。",
        "光の向きも覚えておくと写真が変わります。富士山は線路の北側にあり、日本では太陽が南寄りを通るため、日中はほぼ一日を通して順光です。曇りさえしなければ、朝でも午後でも山肌はしっかり見えます。朝夕の低い光の時間帯は、稜線や谷筋の陰影が濃くなって立体感が増し、輪郭がくっきりします。雪については、例年9月末から10月ごろに初冠雪が観測され、真夏の7〜8月にはほとんど消えます。同じ区間でも季節でまったく別の山に見えるのはこのためです。",
        "このページでは場所・写真・景色の変化に絞ります。E席の取り方、東京・京都・新大阪からの時刻、曇りの日、左富士については、別ページの「富士山FAQ・乗車前ガイド」でまとめて確認できます。",
      ],
      en: [
        "Near Mishima, Mt. Fuji first appears behind urban scenery and power lines. The appeal is watching it gradually gain presence behind everyday landscapes rather than beginning as an isolated mountain view.",
        "Closer to Shin-Fuji, the foreground opens into fields and lower buildings, making the summit and broad foothills easier to follow. Several tunnels interrupt the view, so its first disappearance is not the end.",
        "While Fuji is in view you will also notice a lower range lying in front of it. That is Mount Ashitaka, a separate volcanic group just south of Fuji. It looks like part of Fuji's skirt but is its own mountain, and along this stretch it overlaps the base of Fuji as though propping up the outline. When you try to trace how far the foothills spread, the seam where Ashitaka ends is the first clue.",
        "The direction of the light is worth knowing too. Mt. Fuji lies north of the tracks, and in Japan the sun tracks across the southern sky, so the mountain is front-lit for essentially the whole day. As long as it is not cloudy, the slopes read clearly in the morning and in the afternoon alike. In the low light of early morning or late afternoon, the ridges and gullies gain shadow and the outline sharpens. As for snow, the first snowcap is usually recorded in late September or October, and by midsummer it has all but vanished — which is why the same stretch of line can show what looks like an entirely different mountain depending on the season.",
        "This page is about the place, photographs, and changing scenery. Seat booking, exact timing from major stations, cloudy-day advice, and Left Fuji are collected separately in the Mt. Fuji FAQ and pre-trip guide.",
      ],
    },
    guideHighlight: {
      ja: "三島側では街の向こう、新富士側では田園の向こうへと前景が変わります。トンネルで見失っても、E席側を見続けてください。抜けるたびに富士山が近づき、裾野まで見える瞬間が増えていきます。",
      en: "The foreground shifts from city blocks near Mishima to open fields near Shin-Fuji. Keep watching Seat E even after a tunnel hides the mountain; each opening brings it closer and reveals more of its foothills.",
    },
    minutesFromTokyo: 43, side: "E", category: "classic", confidence: "verified", durationSec: 210, scene: "fuji",
    image: "images/20210218_fuji_rumireport.jpg",
    photoCredit: {
      ja: "@rumireport",
      en: "@rumireport",
      url: "https://x.com/rumireports/status/1362350607273586688",
      note: { ja: "夕暮れ時は富士山が最も美しい瞬間の一つ", en: "Dusk is one of Mt. Fuji's most beautiful moments." },
    },
    photos: [
      {
        src: "images/20240211_fuji_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える富士山", en: "Mt. Fuji from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2024-02-11",
        note: { ja: "雪化粧の富士山はいつ見ても美しい", en: "Snow-capped Mt. Fuji is beautiful every time." },
      },
      {
        src: "images/20260616_fuji_sttraveler.jpg",
        alt: { ja: "新幹線のE席側から見える富士山", en: "Mt. Fuji from Seat E" },
        credit: { ja: "@STTraveler", en: "@STTraveler" },
        sourceUrl: "https://x.com/STTraveler/status/2066661705372033042",
        note: { ja: "田んぼの緑とのコントラストが美しい", en: "The contrast with the green rice fields is beautiful." },
      },
      {
        src: "images/20260619_fuji_sttraveler.jpg",
        alt: { ja: "新幹線のE席側から見える富士山", en: "Mt. Fuji from Seat E" },
        credit: { ja: "@STTraveler", en: "@STTraveler" },
        sourceUrl: "https://x.com/STTraveler/status/2067980954287951976",
        note: { ja: "街並みの向こうにうっすらと浮かぶ幻想的な富士山", en: "A dreamlike Mt. Fuji faintly floating beyond the town." },
      },
      {
        src: "images/20230913_fuji_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える富士山", en: "Mt. Fuji from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2023-09-13",
        note: { ja: "小麦色の田んぼと雪のない富士山の対比もまた美しい", en: "The contrast between wheat-colored fields and a snowless Fuji is beautiful too." },
      },
    ],
    relatedSpotIds: ["sagami-fuji", "left-fuji", "ota-fuji", "hamanako-fuji"],
    references: [REFERENCES.weatherFuji],
    map: { lat: 35.360625, lng: 138.727363, ja: "富士山", en: "Mt. Fuji" },
    viewpoint: { lat: 35.145328, lng: 138.680677 },
  },
  {
    id: "left-fuji",
    icon: "🔭",
    ja: { name: "左富士", area: "静岡駅を過ぎ、安倍川を渡ってまもなく", hook: "海側A席に、数秒だけ富士山。", story: "東京から新大阪方面へ向かうなら、静岡駅を過ぎ、安倍川を渡ってまもなくのタイミング。ふつう富士山はE席（山側）のものですが、この短い区間だけ、線路が大きく南へ膨らむため、進行方向左手＝A席・海側に富士山が回り込みます。江戸期の東海道でも、平塚〜茅ヶ崎の「南湖の左富士」、静岡・吉原の「吉原の左富士」が旅の名所として絵に描かれ、和歌に詠まれてきました。今の新幹線からは数秒の出会いですが、A席のあなたにもちゃんと出番があります。" },
    en: { name: "Left-Side Fuji", area: "Just after Shizuoka Sta. and the Abe River", hook: "Fuji switches sides for a few seconds.", story: "Heading from Tokyo toward Shin-Osaka, start looking just after Shizuoka Station, soon after crossing the Abe River. Mt. Fuji normally belongs to Seat E (the mountain side), but in this short stretch the line curves distinctly southward, and the mountain briefly appears on the left — the Seat A / sea side. On the old Edo-period Tokaido highway, this rare geometry was famous enough that the 'Nango Left-Fuji' near Chigasaki and the 'Yoshiwara Left-Fuji' near modern Fuji City became noted travel sights, painted in woodblock prints and celebrated in poetry. Today it is a matter of seconds, but Seat A finally has its moment." },
    pageTitle: {
      ja: "新幹線から見える「左富士」｜A席から富士山が見える珍しい区間 | 新幹線の窓",
      en: "Left-Side Fuji from the Shinkansen | The Rare Seat-A View | Shinkansen Window",
    },
    pageHeading: {
      ja: "A席側にあらわれる、幸運の左富士",
      en: "The lucky Left-side Fuji from Seat A",
    },
    pageHeadingChunks: {
      ja: ["A席側にあらわれる、", "幸運の左富士"],
      en: ["The lucky Left-side Fuji", "from Seat A"],
    },
    metaDescription: {
      ja: "東海道新幹線で、静岡駅を過ぎ安倍川を渡ってまもなくのA席側に、ほんの数秒だけ富士山が見える「左富士」区間があります。歴史的な左富士の背景、見え方の条件、通過タイミングを解説します。",
      en: "On the Tokaido Shinkansen, just after Shizuoka Station and the Abe River, Mt. Fuji briefly appears on the Seat A side — the famous 'Left-side Fuji.' Learn its historical background on the old Tokaido, when it is visible, and how to spot it in a few seconds from the train.",
    },
    sectionHeading: {
      ja: "なぜ左（A席）に富士山が見える？",
      en: "Why does Fuji appear on the left (Seat A)?",
    },
    pageStory: {
      ja: "東海道新幹線は基本的に、東京と新大阪をほぼ東西に結んでいます。そのため、日本の中央に立つ富士山は、進行方向の北側＝E席（山側）から見えるのが原則です。ところが静岡駅を出て安倍川を渡ったあとの短い区間、路線が海側（南）へ大きく膨らむ形で曲がり、富士山が一時的に進行方向の左手＝A席側に回り込みます。これが車窓で言う「左富士」です。江戸期の東海道でも同じ現象が起き、平塚〜茅ヶ崎の「南湖の左富士」と、静岡吉原の「吉原の左富士」の2か所が、旅人にとって珍しい光景として名所化していました。歌川広重の浮世絵にも「東海道五拾三次之内 吉原 左富士」として描かれています。",
      en: "The Tokaido Shinkansen mostly runs east-west between Tokyo and Shin-Osaka. Since Mt. Fuji stands roughly to the north, it is normally seen from Seat E — the mountain side of the train. But in a short stretch just after Shizuoka Station and the Abe River, the line curves noticeably southward toward the sea, and Fuji briefly appears on the left side of the train — Seat A. That is the classic 'Hidari-Fuji' or Left-side Fuji. The same geometry existed on the old Edo-period Tokaido highway, where two spots became famous for this effect: 'Nango Hidari-Fuji' near Chigasaki, and 'Yoshiwara Hidari-Fuji' near today's Fuji City. Utagawa Hiroshige painted the latter as 'Yoshiwara: Left-side Fuji' in his celebrated Fifty-three Stations of the Tokaido woodblock series.",
    },
    explainer: {
      heading: { ja: "見え方のコツと、季節の話", en: "How to catch it, and how the season matters" },
      ja: [
        "新幹線での左富士は、静岡駅を出て安倍川を渡り、静岡市駿河区・清水区あたりを走るごく短い区間で発生します。時間にして数秒〜十数秒程度なので、まず「A席側に富士山が来る」と意識して窓の外を見ておかないと、あっという間に通り過ぎます。安倍川を渡り終わったら、視線を少し前方（進行方向・海側やや上）へ向けて構えるのがコツです。",
        "冬から早春は雪を戴いた富士山の輪郭がはっきり見え、A席側の街並みや工場の間からでも見つけやすくなります。雪のない夏場は空気の色に富士山が溶け込みやすく、想像以上に見つけにくいことがあります。曇りや雨、霞の日は素直に諦め、その分E席側の景色（三島〜新富士の主役の富士山）を楽しむのが現実的です。",
        "上り列車（新大阪から東京方面）でも、通過順が逆になるだけで左富士の原理は同じです。ただし進行方向が反対になるので、探すのは進行方向左手＝この場合は上りではE席側ではなくA席側で変わらず、体感としては「振り返る形で富士山を見送る」ような角度になります。慣れないと少し戸惑うポイントです。",
      ],
      en: [
        "The Shinkansen's Left Fuji occurs in a very short section that runs through Suruga and Shimizu wards of Shizuoka City, just after crossing the Abe River. The window of opportunity is only a few seconds to around 10–15 seconds, so you really need to have 'Fuji on Seat A' primed in your head. Once the train finishes crossing the Abe River, aim your gaze slightly forward, toward the sea side and a little upward.",
        "In winter and early spring, snow-capped Fuji stands out crisply and you can pick it out even between the buildings and factories on the Seat A side. In snowless summer months, Fuji melts into a similar sky color and can be surprisingly hard to find. On cloudy, rainy or hazy days, it is best to give this one up and enjoy the main-event Fuji on the Seat E side between Mishima and Shin-Fuji.",
        "The same geometry works in reverse for upbound trains (Shin-Osaka toward Tokyo): the order of passing is flipped, but the mountain still appears on the left side of the direction of travel. The perception is slightly different — you look almost backward, as if seeing Fuji off — which can be disorienting the first time.",
      ],
    },
    guideHighlight: {
      ja: "安倍川を渡ったら、A席側の海寄りの上空を意識してください。ビルや工場の合間から、富士山の頂上部だけ、あるいは輪郭全体がすっと差し込んできます。数秒で消えるので、スマホから顔を上げて窓の外へ視線を先に向けておくのが最大のコツです。",
      en: "As soon as the train finishes crossing the Abe River, focus on the sky slightly above the horizon on the Seat A (sea) side. Fuji — sometimes only the summit, sometimes the whole outline — slips into view between buildings and factories. It lasts only a few seconds, so the single best trick is to look up from your phone in advance and keep your eyes on the window.",
    },
    minutesFromTokyo: 54, side: "A", category: "notable", confidence: "verified", durationSec: 5, scene: "leftfuji",
    routeNote: {
      ja: "東京から新大阪方面へ向かう場合は、静岡駅を過ぎて安倍川を渡った直後、A席・海側の窓を見てください。新大阪から東京方面へ向かう場合は、通過順が逆になります。",
      en: "From Tokyo toward Shin-Osaka, watch the Seat A · sea side window just after Shizuoka Station and the Abe River crossing. Toward Tokyo, the order is reversed.",
    },
    image: "images/20240410_left_fuji_earlyretiremile.jpg",
    photoCredit: { ja: "@earlyretiremile", en: "@earlyretiremile", url: "https://x.com/earlyretiremile/status/1777853629682405657" },
    photos: [
      {
        src: "images/20260513_left_fuji.jpg",
        alt: { ja: "新幹線のA席側から見える左富士", en: "Left-side Fuji from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-13",
        note: { ja: "雪がないと見つけるのがさらに大変。", en: "Without snow, it is even harder to spot." },
      },
      {
        src: "images/20241212_left_fuji_kawasan3.jpg",
        alt: { ja: "新幹線のA席側から見える冬の左富士", en: "Winter Left-Side Fuji from Seat A" },
        credit: { ja: "@kawasan3", en: "@kawasan3" },
        sourceUrl: "https://x.com/kawasan3/status/1866984276581028088",
      },
    ],
    references: [REFERENCES.leftFujiTrafficNews, REFERENCES.leftFujiWiki],
    map: { lat: 35.360625, lng: 138.727363, ja: "富士山", en: "Mt. Fuji" },
    viewpoint: { lat: 34.95366971111815, lng: 138.36849158839897 },
  },
  {
    id: "shimizu-port-chikyu",
    icon: "🏗️",
    ja: { name: "清水港とちきゅう", area: "新富士 → 静岡", hook: "港にそびえる、白い掘削やぐらの船。", story: "新富士から静岡へ向かう途中、A席側の遠くに清水港のガントリークレーンが並び、その合間に、船体の中央から高さ約70mの白い掘削やぐら（デリック）を突き上げた船が見えることがあります。これが、地球深部探査船「ちきゅう」。国立研究開発法人JAMSTEC（海洋研究開発機構）が運用する日本の科学掘削船で、海底面下7,000mまでライザーで掘り進める能力を持ち、南海トラフや日本海溝の地震発生帯掘削、地球史や海底下生命の研究などで世界的な成果を挙げてきました。清水港は「ちきゅう」の母港のひとつで、航海の合間には港に戻ってメンテナンスを受けます。作業出港中は見えないので、姿があれば少し運の良い車窓です。" },
    en: { name: "Shimizu Port and CHIKYU", area: "Shin-Fuji → Shizuoka", hook: "A white drilling tower at port.", story: "Between Shin-Fuji and Shizuoka, look far off on the Seat A side for the gantry cranes of Shimizu Port. Between them, you may sometimes spot a ship with a white drilling derrick — about 70 meters tall — standing up from the middle of its hull. That is the deep-sea scientific drilling vessel CHIKYU, operated by Japan's JAMSTEC (Japan Agency for Marine-Earth Science and Technology). Equipped with a riser system, it can drill up to about 7,000 meters below the seafloor and has produced globally significant results in seismogenic-zone drilling at the Nankai Trough and Japan Trench, as well as in Earth-history and subseafloor-life research. Shimizu is one of its home ports; when it is out on a mission you will not see it, so catching it in port is a small stroke of luck." },
    pageTitle: {
      ja: "新幹線から見える清水港と「ちきゅう」｜JAMSTECの地球深部探査船 | 新幹線の窓",
      en: "Shimizu Port and CHIKYU from the Shinkansen | JAMSTEC's Deep-Sea Drilling Vessel",
    },
    pageHeading: {
      ja: "港のクレーンの中に立つ、白い掘削やぐら——清水港と「ちきゅう」",
      en: "A white drilling tower among the cranes: Shimizu Port and CHIKYU",
    },
    pageHeadingChunks: {
      ja: ["港のクレーンの中に立つ、白い掘削やぐら——", "清水港と「ちきゅう」"],
      en: ["A white drilling tower among the cranes:", "Shimizu Port and CHIKYU"],
    },
    metaDescription: {
      ja: "新富士〜静岡の新幹線A席側に見える、清水港のクレーン群と地球深部探査船「ちきゅう」。JAMSTECが運用する掘削船の能力・南海トラフや科学掘削の役割・見つけ方をまとめて紹介します。",
      en: "Between Shin-Fuji and Shizuoka, Seat A on the Shinkansen looks toward Shimizu Port and JAMSTEC's deep-sea drilling vessel CHIKYU. Learn what this scientific drilling ship does — from Nankai Trough seismogenic-zone research to subseafloor life — and how to spot it.",
    },
    sectionHeading: {
      ja: "「ちきゅう」はどんな船？",
      en: "What kind of ship is CHIKYU?",
    },
    pageStory: {
      ja: "「ちきゅう」は、JAMSTECが運航する国内唯一の大型科学掘削船です。全長210m、幅38m、船体中央から突き出す白い掘削やぐら（デリック）は基準海面上約70mに達し、海底から見た全高では120m級と、外洋船としては特異な姿をしています。石油掘削船と同じ「ライザー掘削」方式を採用し、水深2,500m級の海域で、海底面下7,000mまで掘り抜くことができます。石油探査ではなく、地球科学のための掘削を目的に設計された、世界的にも極めて数の少ない専用船です。",
      en: "CHIKYU is the only large-scale scientific drilling vessel of its kind operated in Japan, run by JAMSTEC. It is 210 meters long and 38 meters wide, and the white drilling derrick rising from its center reaches roughly 70 meters above sea level — around 120 meters top-to-keel — making it look unlike any regular ocean-going ship. Using riser drilling technology developed originally for offshore oil work, it can drill up to 7,000 meters below the seafloor in water depths of about 2,500 meters. It is one of very few vessels in the world designed specifically for scientific — rather than commercial — drilling.",
    },
    explainer: {
      heading: { ja: "何のために掘っている？", en: "What is it drilling for?" },
      ja: [
        "「ちきゅう」の代表的なミッションのひとつが、南海トラフ地震発生帯掘削計画（NanTroSEIZE）です。紀伊半島沖の海底下深部に眠るプレート境界を実際に掘り、地震のしくみを直接調べようという世界初の試みで、掘削孔内に設置した長期観測装置（LTBMS）は今もリアルタイムで地震・地殻変動データを送り続けています。東北地方太平洋沖地震（東日本大震災）の後には、日本海溝の断層帯を掘削し、巨大地震で断層がどのようにずれたかを直接調べる調査（JFAST）も実施しました。",
        "地球史の研究でも重要な成果を上げています。西部太平洋の海底下から採取した堆積物・岩石コアは、過去数千万年〜数億年の環境変動や大量絶滅の記録を保存しており、恐竜絶滅の原因となったユカタン半島沖の巨大隕石衝突クレーターの掘削にも参加しました。近年は、海底下深部に生命がどこまで存在するかを探る「深部生命圏（deep biosphere）」の研究でも先端を走っています。",
        "清水港は、こうした長期航海の合間に「ちきゅう」が寄港・整備を受ける母港のひとつです。船体のスケールと運用の規模感を、車窓から一瞬でも感じられるのは貴重な機会と言えます。",
      ],
      en: [
        "One of CHIKYU's flagship missions is the Nankai Trough Seismogenic Zone Experiment (NanTroSEIZE) off the Kii Peninsula — the first attempt in the world to drill directly into a plate-boundary fault system to study how great earthquakes originate. Long-term borehole monitoring stations (LTBMS) installed in those holes continue to transmit seismic and crustal-deformation data in near-real time. After the 2011 Tohoku earthquake, the ship carried out the Japan Trench Fast Drilling Project (JFAST), drilling into the ruptured fault of the Japan Trench to directly measure how the fault had slipped during the event.",
        "CHIKYU has produced major results in Earth-history research too. Sediment and rock cores retrieved from the western Pacific seafloor preserve records of climate change and mass extinctions across tens to hundreds of millions of years, and the ship participated in drilling the giant impact crater off the Yucatan Peninsula linked to the extinction of the dinosaurs. Recent work explores the 'deep biosphere' — how far life extends beneath the seafloor — where CHIKYU sits at the leading edge.",
        "Shimizu is one of the ports where the ship returns between long expeditions for maintenance and preparation. Being able to sense the scale of this working vessel from the train window, even for a few seconds, is a rare treat.",
      ],
    },
    guideHighlight: {
      ja: "新富士を過ぎたら、A席側の遠くに港のクレーン群を探してください。ずらりと並ぶ細長いクレーンの合間に、頭に白い格子状のやぐらを載せた船があれば、それが「ちきゅう」です。港にいない日もあるので、いなくても気を落とさず、清水の港湾工業景として楽しむのがおすすめです。夜は港全体が作業灯とクレーンの明かりに縁取られ、暗い海面を背にした「ちきゅう」のやぐらが昼よりもかえって見分けやすくなります。",
      en: "After Shin-Fuji, look far off on the Seat A side for the row of gantry cranes at Shimizu Port. If, among them, you see a ship with a tall white lattice tower rising from its middle, that is CHIKYU. It is not always in port; if it is gone, just enjoy the industrial harbor scenery of Shimizu instead. At night the whole port is outlined by work lights and crane lamps, and CHIKYU's derrick against the dark water can actually be easier to pick out than by day.",
    },
    minutesFromTokyo: 50, side: "A", category: "notable", confidence: "source-backed", durationSec: 5, scene: "bay",
    image: "images/20240119_shimizu_port_chikyu_senba16530315.jpg",
    photoCredit: {
      ja: "@senba16530315",
      en: "@senba16530315",
      url: "https://x.com/senba16530315/status/1748226462862508427",
      note: { ja: "ガントリークレーンの合間に見える、停泊中の「ちきゅう」の巨大なデリック", en: "CHIKYU's huge derrick, docked between the gantry cranes" },
    },
    photos: [
      {
        src: "images/20260712_shimizu_port_chikyu_1_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える清水港とちきゅう", en: "Shimizu Port and CHIKYU from Seat A on the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "港のクレーン越しに見える、ちきゅうのデリック", en: "CHIKYU's derrick beyond the port cranes" },
      },
      {
        src: "images/20260712_shimizu_port_chikyu_2_michikusa.jpg",
        alt: { ja: "新幹線から見える清水港のクレーンとちきゅう", en: "Port cranes and CHIKYU from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "清水港の工業景と、停泊中のちきゅう", en: "Shimizu Port industry with CHIKYU docked" },
      },
      {
        src: "images/20260629_shimizu_port_chikyu_morning_michikusa.jpg",
        alt: { ja: "朝の新幹線から見える清水港とちきゅう", en: "Shimizu Port and CHIKYU in the morning from the Shinkansen" },
        date: "2026-06-29",
        note: { ja: "朝の港に、ちきゅう", en: "CHIKYU in the morning port" },
      },
      {
        src: "images/20260629_2242_shimizu_port_chikyu_night_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜の新幹線から見える清水港とちきゅう", en: "Shimizu Port and CHIKYU at night from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-06-29",
        note: { ja: "夜の港に、ちきゅう", en: "CHIKYU in the night port" },
      },
    ],
    references: [REFERENCES.chikyuOfficial, REFERENCES.chikyuJamstecMissions, REFERENCES.shimizuPort, REFERENCES.shimizuPortCity],
    map: { lat: 35.034137, lng: 138.505989, ja: "清水港 地球深部探査船ちきゅう", en: "Shimizu Port CHIKYU" },
    viewpoint: { lat: 35.037074, lng: 138.487157 },
  },
  {
    id: "shizuoka-tea-fields",
    icon: "🍵",
    ja: { name: "静岡の茶畑", area: "静岡 → 掛川", hook: "緑の畝が、車窓を走る。", story: "掛川城の少し手前、線路の両側に緑の畝がきれいに並ぶ区間があります。ここは静岡県中西部——牧之原台地の南端から掛川・菊川へ続く、日本最大級の茶産地の入口です。細く整えられた畝、防霜ファン（大きな扇風機）が突き立った畑、緩やかな丘の連なり。富士山や城ほど派手ではないけれど、「日本を走っている」と一瞬で分かる車窓が、しばらく続きます。" },
    en: { name: "Shizuoka Tea Fields", area: "Shizuoka → Kakegawa", hook: "Rows of green tea from the window.", story: "A little before Kakegawa Castle, the tracks are lined on both sides by neatly ridged green fields. This is the entrance to one of Japan's largest tea-producing regions, stretching from the southern edge of the Makinohara Plateau across Kakegawa and Kikugawa. Look for the finely trimmed rows, tall frost-protection fans poking up over the fields, and the gentle rolling hills. It is subtler than Mt. Fuji or a castle, but you know at once you are crossing rural Japan." },
    pageTitle: {
      ja: "新幹線から見える静岡の茶畑｜牧之原・掛川の茶産地とその歴史 | 新幹線の窓",
      en: "Shizuoka Tea Fields from the Shinkansen | Makinohara and Kakegawa Tea",
    },
    pageHeading: {
      ja: "静岡の茶畑——牧之原・掛川を貫く、緑の畝",
      en: "Tea fields across Makinohara and Kakegawa, seen from the Shinkansen",
    },
    pageHeadingChunks: {
      ja: ["静岡の茶畑——", "牧之原・掛川を貫く、緑の畝"],
      en: ["Tea fields across Makinohara and Kakegawa,", "seen from the Shinkansen"],
    },
    metaDescription: {
      ja: "静岡〜掛川の車窓に広がる茶畑を、静岡茶の歴史と牧之原台地の地形から解説。畝の形、防霜ファン、季節ごとの色の違いなど、新幹線から見て楽しむポイントもまとめています。",
      en: "The tea fields between Shizuoka and Kakegawa belong to one of Japan's largest tea regions. Learn how Shizuoka tea grew on the Makinohara Plateau and what to watch for from the Shinkansen window — from ridge patterns to seasonal color.",
    },
    sectionHeading: {
      ja: "この畝の景色は、どんな茶産地？",
      en: "What kind of tea region are these ridges?",
    },
    pageStory: {
      ja: "静岡県は長年、全国の荒茶生産量の3〜4割を占めてきた、日本最大級の茶産地です。中でも新幹線が抜ける掛川・菊川・島田・牧之原一帯は、県内でもとりわけ茶園が集中する地域。畑は等高線に沿ってなめらかに並び、細く刈り込まれた畝が丘の起伏をなぞります。畝のあいだにときおり立つ縦長の柱と羽根は防霜ファン（茶園ファン）。冷え込む春先の夜、地表付近に溜まった冷気を上下の空気と混ぜて霜害から新芽を守るための設備です。",
      en: "Shizuoka Prefecture has long been Japan's largest tea-producing area, historically accounting for 30–40 percent of the country's crude tea output. The stretch through Kakegawa, Kikugawa, Shimada and Makinohara — right where the Shinkansen runs — is one of its densest tea belts. Fields curve along the contours of the land, with narrow trimmed ridges tracing every rise and dip. The tall poles topped by propellers you see poking above the ridges are frost-protection fans, used on cold spring nights to mix chilled surface air with warmer air above and protect the young buds.",
    },
    explainer: {
      heading: { ja: "なぜ静岡に、これだけ茶畑が広がる？", en: "Why is so much tea grown here?" },
      ja: [
        "静岡での茶の栽培は鎌倉時代の僧・聖一国師が持ち帰った茶の種を安倍川流域にまいたのが始まりと伝わり、江戸期には駿河茶として知られるようになりました。産地を一気に広げたのは、明治時代の牧之原台地開拓です。徳川家の旧幕臣らが失職後の生活再建のためにこの台地を開墾し、水はけの良い赤土と、日照・霜対策に適した高台の気候が茶樹に合うことを見出しました。以後、牧之原・掛川・菊川はまとまった大規模茶園として発展していきます。",
        "掛川周辺は、深く蒸して香りとコクを引き出す「深蒸し煎茶」の代表産地としても知られます。淹れると濃く緑がかった色になり、渋みが抑えられて甘味とコクが前に出るのが特徴です。「掛川茶」「牧之原茶」「川根茶」など、静岡の中でも産地ごとの個性がある点が、この一帯の魅力です。",
        "季節によって畑の表情は大きく変わります。4〜5月の一番茶シーズンは畝の先端に淡い黄緑の新芽が並び、収穫直前には防霜ファンが夜どおし回ります。夏〜秋は濃い緑、冬は落ち着いた深緑と、乗車する季節によって同じ区間でも違う車窓になります。",
      ],
      en: [
        "Tea growing in Shizuoka traditionally traces back to the Kamakura-era monk Enni, who is said to have sown seeds along the Abe River. By the Edo period, Suruga tea was already well known. What really turned the region into a major producer was the Meiji-era opening of the Makinohara Plateau: former Tokugawa retainers who had lost their positions cleared and cultivated this upland to rebuild their livelihoods, and discovered that its well-drained red soil and elevated climate suited the tea plant. Makinohara, Kakegawa and Kikugawa grew into a belt of large tea farms from that point onward.",
        "The area around Kakegawa is especially known for fukamushi sencha, a deeply steamed green tea that yields a dark green infusion with softened astringency and rich, sweet notes. Within Shizuoka itself, different districts — Kakegawa, Makinohara, Kawane and others — each have their own character, which is part of what makes this stretch of window fun.",
        "The fields also change dramatically with the season. During the ichibancha (first-flush) harvest in April–May, pale yellow-green buds line the tops of the ridges and the frost fans run through the night. Summer and autumn deepen the green, and winter settles into a calm darker green — the same stretch of window looks quite different depending on when you ride.",
      ],
    },
    guideHighlight: {
      ja: "静岡を過ぎたら、まず線路脇の緑の縞模様に注目してください。次に、畝の上に立つ縦長の柱と羽根（防霜ファン）を数えてみると、静岡茶の畑らしさが一気に見えてきます。掛川駅前の掛川城とあわせて、「城の前は茶畑」というリズムを楽しむと、この区間の記憶に残りやすくなります。",
      en: "After Shizuoka, first notice the striped green pattern beside the tracks. Then start counting the tall fans standing above the ridges — those frost-protection fans are a signature of Shizuoka tea. Pair the fields with the glimpse of Kakegawa Castle just after, and this stretch becomes easy to remember: tea fields first, castle right after.",
    },
    minutesFromTokyo: 61, side: "E", category: "notable", confidence: "verified", durationSec: 30, scene: "hills",
    image: "images/20260530_shizuoka_tea_fields_1_michikusa.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-30" },
    photos: [
      {
        src: "images/20260530_shizuoka_tea_fields_2_michikusa.jpg",
        alt: { ja: "新幹線から見える静岡の茶畑", en: "Shizuoka tea fields from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
      },
    ],
    references: [REFERENCES.shizuokaTeaTourism, REFERENCES.shizuokaTeaGreenTeaAssoc, REFERENCES.shizuokaTeaGeography],
    map: { lat: 34.774548442725724, lng: 138.099176682925, ja: "静岡の茶畑（代表通過地点）", en: "Shizuoka tea fields representative viewpoint" },
    viewpoint: { lat: 34.773971209238894, lng: 138.0997023958755 },
  },
  {
    id: "kakegawa",
    icon: "🏯",
    ja: { name: "掛川城", area: "掛川駅 前後", hook: "駅のすぐそばに、白い天守。", story: "掛川駅の北側、小高い丘に白い天守が立ちます。戦国末期、山内一豊が城郭を大改修し、城下町を整えた掛川城です。江戸時代の天守は1854年の安政東海地震で倒壊し、失われたまま長らく丘の上には何もありませんでしたが、1994年、地元の寄付を集めて日本初の本格木造復元天守として約140年ぶりに再建されました。今も残る二の丸御殿は現存四御殿のひとつで、国の重要文化財です。のぞみでは数秒しか見えないので、掛川駅が近づいたらE席側を。" },
    en: { name: "Kakegawa Castle", area: "Around Kakegawa Sta.", hook: "A white castle beside the station.", story: "Just north of Kakegawa Station, a white keep stands on a low hill. In the closing years of the Sengoku era, warlord Yamauchi Kazutoyo greatly rebuilt Kakegawa Castle and developed its castle town. The Edo-period keep collapsed in the 1854 Ansei-Tokai earthquake and the hilltop stood empty for over a century, until civic fundraising rebuilt it in 1994 as Japan's first full-scale wooden reconstruction of a castle keep. The surviving Ninomaru Palace beside it is one of only four Edo-era castle palaces remaining in Japan and is a Nationally Designated Important Cultural Property. On a passing Nozomi, watch Seat E just before the station." },
    pageTitle: {
      ja: "新幹線から見える掛川城｜山内一豊と木造復元天守 | 新幹線の窓",
      en: "Kakegawa Castle from the Shinkansen | Yamauchi Kazutoyo's Wooden Reconstruction Keep",
    },
    pageHeading: {
      ja: "駅のすぐ隣に立つ掛川城の白い天守",
      en: "Kakegawa Castle's white keep beside the station",
    },
    pageHeadingChunks: {
      ja: ["駅のすぐ隣に立つ、", "掛川城の白い天守"],
      en: ["Kakegawa Castle's white keep", "beside the station"],
    },
    metaDescription: {
      ja: "新幹線の掛川駅前で見える白い天守は掛川城。山内一豊による大改修、安政地震での倒壊、1994年の本格木造復元、そして現存御殿としての二の丸御殿まで、車窓と合わせて楽しむための背景を紹介します。",
      en: "The white keep next to Kakegawa Station is Kakegawa Castle. Learn about Yamauchi Kazutoyo's rebuilding, its collapse in the 1854 Ansei earthquake, its 1994 wooden reconstruction, and the surviving Ninomaru Palace — history you can pair with the fleeting Shinkansen view.",
    },
    sectionHeading: {
      ja: "掛川城はどんな城？",
      en: "What kind of castle is Kakegawa?",
    },
    pageStory: {
      ja: "掛川城は室町時代、駿河国守護・今川氏の重臣朝比奈氏によって築かれたのが始まりとされ、東海道の要衝を押さえる城として重視されてきました。今川氏滅亡後は徳川家康の支配下に入り、豊臣秀吉の時代に山内一豊が城主となり、天守や城下町を整えます。関ヶ原の戦い後、山内一豊が土佐へ移った後も、譜代大名の交代拠点として江戸時代を通じて維持されました。",
      en: "Kakegawa Castle was first established in the Muromachi period by the Asahina family, senior retainers of the Imagawa clan who governed Suruga Province, as a strategic hold on the Tokaido road. After the Imagawa fell, it came under Tokugawa Ieyasu's control; during Toyotomi Hideyoshi's era, Yamauchi Kazutoyo became lord and organized the keep and castle town. Even after Yamauchi moved to Tosa Province following the 1600 Battle of Sekigahara, Kakegawa served throughout the Edo period as a rotating base for hereditary daimyo of the shogunate.",
    },
    explainer: {
      heading: { ja: "今見える天守と、その下の御殿", en: "The keep you see today, and the palace below it" },
      ja: [
        "現在の天守は1994年、市民の寄付を核に約10億円を集めて再建されました。江戸期に描かれた「東海道分間延絵図」などを参考に、往時の外観を忠実に再現した本格木造復元天守で、全国の木造復元天守の先駆けとして知られます。三重四階、白漆喰の壁と黒い下見板張り、望楼型の意匠が特徴で、丘の上から掛川の街と茶畑を見下ろします。",
        "天守の南麓に残る二の丸御殿は、1861年（文久元年）に再建された江戸後期の書院造建築で、御殿としては全国に4棟しか残っていない貴重な現存例です。式台・広間・書院と続く格式ある間取りは、当時の政務空間そのままで、国指定重要文化財に指定されています。新幹線からは天守しか見えませんが、実は「本物の御殿」がその麓にある——という点は覚えておくと面白いポイントです。",
        "見つけ方は、掛川駅の少し東側からE席側の丘を意識するのがコツ。駅の北側にこんもりした緑の丘があり、その上に白い建物が立ちます。周辺は再開発でビルが増えていますが、天守は今も駅から歩いて数分の場所にあり、時間があれば掛川駅で下車して立ち寄る価値があります。",
      ],
      en: [
        "The keep you see today was reconstructed in 1994, funded largely by citizen donations totaling about a billion yen. Modeled on Edo-period pictorial records of the Tokaido, it is a full-scale wooden reconstruction — a pioneer among modern wooden castle reconstructions in Japan. It rises as a three-tier, four-story tower with white plaster walls and black wooden cladding in a watchtower (bogaku) style, looking out over Kakegawa and the surrounding tea fields.",
        "At the foot of the keep stands the Ninomaru Palace, rebuilt in 1861 in the late-Edo shoin style. Only four such castle palaces survive in Japan, making this an unusually rare example. Its arrangement — entrance hall, great hall, and inner audience rooms — preserves the layout of actual daimyo administrative space, and it is registered as a Nationally Designated Important Cultural Property. You cannot see it from the train, but it is worth knowing that the 'real' palace sits beneath the reconstructed keep.",
        "For spotting: start watching the Seat E side a little before Kakegawa Station. Look for a low green hill just north of the station with a white building on top. Newer buildings crowd the surroundings, but the castle is still only a few minutes' walk from the station — a good stop if you have time on another trip.",
      ],
    },
    guideHighlight: {
      ja: "掛川駅に近づいたら、E席側の丘の上を狙ってください。白い天守は樹木の緑を背にして立つので、影に埋もれず見つけやすい形をしています。のぞみは通過するので数秒。停車するひかり・こだまなら、駅ホームから角度を変えて眺めることもできます。",
      en: "As Kakegawa Station approaches, focus on the hill just north of the tracks from Seat E. The white keep is set against a green tree line, which makes it stand out cleanly. On a passing Nozomi you have only a few seconds; on stopping Hikari or Kodama services, you can also see it at a slightly different angle from the platform.",
    },
    minutesFromTokyo: 62, side: "E", category: "notable", confidence: "verified", durationSec: 3, scene: "castle",
    image: "images/20220312_kakegawa_castle_neoromancefan.jpg",
    photoCredit: { ja: "@NeoRomanceFan", en: "@NeoRomanceFan", url: "https://x.com/NeoRomanceFan/status/1502633820075352064" },
    photos: [
      {
        src: "images/20260712_kakegawa_castle_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える掛川城", en: "Kakegawa Castle from Seat E on the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "掛川駅の近くに一瞬見える天守", en: "The castle keep appearing briefly near Kakegawa Station" },
      },
      {
        src: "images/20260530_kakegawa_castle.jpg",
        alt: { ja: "新幹線のE席側から見える掛川城", en: "Kakegawa Castle from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
      },
    ],
    references: [REFERENCES.kakegawaCastle],
    map: { lat: 34.775417, lng: 138.0147333, ja: "掛川城", en: "Kakegawa Castle" },
    viewpoint: { lat: 34.769664, lng: 138.017389 },
  },
  {
    id: "genki-sign",
    icon: "💬",
    ja: { name: "しっぺいの応援看板", area: "掛川 → 浜松（磐田付近）", hook: "元気が出る、しっぺいの三連看板。", story: "掛川を過ぎて浜松へ向かう途中、ハウス食品静岡工場を過ぎて少ししたE席側の田園の中に、磐田市のマスコット「しっぺい」が描かれた三連続の応援看板が並びます。「いつも 応援してるよ」「みんな ありがとう」「必ず 明日があるからね」。周囲に高い建物や大きな目印が少ないので、いきなり犬のイラストとメッセージが現れる感じで、車窓で気になった人も多い名物看板です。誰が何のために建てたかは公的に明らかにされていませんが、しっぺい自身は磐田市の公式マスコットで、市内のあちこちで目にするキャラクターです。" },
    en: { name: "Shippei Cheer-up Signs", area: "Kakegawa → Hamamatsu, near Iwata", hook: "Three signs that lift the ride.", story: "After Kakegawa, heading toward Hamamatsu, three small roadside signs appear from Seat E out in the fields shortly past the House Foods Shizuoka Factory. They feature Shippei, Iwata City's white dog mascot, with three simple messages: 'I'm always rooting for you,' 'Thank you, everyone,' and 'There will always be tomorrow.' There is little else around them, so the dog illustrations and cheerful lines seem to appear out of nowhere — a small trackside cult favorite. Who put them up and why has not been publicly documented, but Shippei is the official mascot of Iwata City and turns up in many places around town." },
    pageTitle: {
      ja: "新幹線から見えるしっぺいの応援看板｜磐田市の三連看板 | 新幹線の窓",
      en: "The Shippei Cheer-up Signs on the Shinkansen | Iwata's Three-Sign Trackside Message",
    },
    pageHeading: {
      ja: "田んぼの中の応援メッセージ——しっぺいの三連看板",
      en: "Cheer-up messages in a rice field: Iwata's three Shippei signs",
    },
    pageHeadingChunks: {
      ja: ["田んぼの中の応援メッセージ——", "しっぺいの三連看板"],
      en: ["Cheer-up messages in a rice field:", "Iwata's three Shippei signs"],
    },
    metaDescription: {
      ja: "掛川から浜松へ向かう新幹線のE席側、磐田付近の田園に並ぶ「いつも 応援してるよ」の三連応援看板を紹介。磐田市マスコットのしっぺいと、看板の場所・見つけ方をまとめました。",
      en: "Between Kakegawa and Hamamatsu, three roadside signs featuring Iwata City's mascot Shippei appear on the Seat E side of the Shinkansen. Learn what they say, where they are, and how to spot them from the train.",
    },
    sectionHeading: {
      ja: "しっぺいって誰？なぜ看板が？",
      en: "Who is Shippei, and why the signs?",
    },
    pageStory: {
      ja: "しっぺいは、静岡県磐田市の公式マスコットキャラクターです。磐田市に伝わる、旅の若者を助けるために大蛇と戦ったという「悉平太郎（しっぺいたろう）」伝説をモチーフに、白い犬をベースにデザインされました。磐田市役所の公式サイトやイベントで登場し、市の広報や観光アピール、防災啓発など幅広く活躍しているキャラクターです。",
      en: "Shippei is the official mascot character of Iwata City in Shizuoka Prefecture. He is inspired by the local legend of Shippeitaro, a brave dog said to have battled a giant serpent to save a traveler. Designed as a friendly white dog, Shippei appears on Iwata's official communications, at city events, and in tourism and safety campaigns.",
    },
    explainer: {
      heading: { ja: "看板そのものについて、わかっていること", en: "What we know about the signs themselves" },
      ja: [
        "この三連看板は、磐田市の田園エリアに沿って設置されており、東海道新幹線のE席側からごく短い時間だけ視界に入ります。書かれている言葉は「いつも 応援してるよ」「みんな ありがとう」「必ず 明日があるからね」。旅の途中でも、仕事帰りでも、ちょっと疲れた日でも、この三つの言葉が窓の外から順番に届く感覚は、見るたびに小さく元気をもらえる車窓です。看板の建立主体や設置年について磐田市の公的な発表は確認できていませんが、匿名のまま静かに続いている応援だからこそ、余計に沁みる景色かもしれません。",
        "しっぺい自身は磐田市の公式マスコットなので、キャラクター使用に関しては市の許諾ルールがあります。看板の運営に磐田市がどこまで関与しているかは公表されていませんが、キャラクターの正確な描写と統一されたデザインからも、地元と何らかの形でつながっていることがうかがえます。",
        "看板の周辺は住宅と田畑がまじる場所で、道路標識や大きな目印が少ないため、Google Maps上でもピンポイントに探すのは難しいエリアです。詳細な場所は、ページ下の地図とストリートビューリンクを参照してください。",
      ],
      en: [
        "The three signs stand along the fields on the Iwata side of the tracks and are visible for just a moment from Seat E on the Shinkansen. The messages read: 'I'm always rooting for you,' 'Thank you, everyone,' and 'There will always be tomorrow.' Whether you are traveling, coming home from work, or just having a long day, watching those three lines slide past the window in order is the kind of view that lifts you a little every time. Iwata City has not publicly disclosed who put up the signs or when, and their quiet anonymity is arguably part of why they land the way they do.",
        "Because Shippei is an official Iwata City mascot, the character itself is governed by the city's usage rules. The extent of the city's direct involvement in the signs has not been made public, but the accurate character rendering and consistent design suggest at least some local connection.",
        "The area itself is a mix of homes and farmland with few road signs or obvious landmarks, so pinning it down on Google Maps is tricky. See the map and Street View link below for the precise location.",
      ],
    },
    guideHighlight: {
      ja: "掛川を出て10分弱、ハウス食品静岡工場のオレンジ色の建物を過ぎたら、E席側の田んぼの中を注意してください。しっぺい（白い犬）と大きな平仮名で書かれたメッセージ看板が、間隔をあけて三つ並びます。速いので、事前に「白い犬・三つの看板」と頭に入れておくと見つけやすくなります。",
      en: "About eight to ten minutes past Kakegawa, once you pass the orange House Foods Shizuoka Factory building, watch the fields on the Seat E side. Three signs featuring Shippei (a white dog) and large hiragana messages appear at intervals. They pass quickly, so keeping the phrase 'white dog, three signs' in mind helps.",
    },
    minutesFromTokyo: 64, side: "E", category: "curious", confidence: "verified", durationSec: 5, scene: "hills",
    image: "images/20260712_genki_sign_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-07-12",
      note: { ja: "磐田付近で見える、しっぺいの三連続応援看板", en: "Three Shippei cheer-up signs around Iwata" },
    },
    photos: [
      {
        src: "images/20250608_genki_sign_letus10.jpg",
        alt: { ja: "しっぺいの応援看板の新幹線車窓写真", en: "Shippei Cheer-up Signs from the Shinkansen window" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/516019488.html",
        note: { ja: "掛川・浜松間、山側・E席から見えるしっぺいの三連続応援看板", en: "Three Shippei cheer-up signs between Kakegawa and Hamamatsu, seen from Seat E." },
      },
    ],
    references: [REFERENCES.shippeiOfficial, REFERENCES.iwataShippei, REFERENCES.genkiSignBlog, REFERENCES.genkiSignStreetView],
    bodyLinks: [
      { ref: REFERENCES.shippeiOfficial, label: { ja: "しっぺいの公式サイトを見る", en: "Open Shippei official site" } },
      { ref: REFERENCES.genkiSignStreetView, label: { ja: "看板付近をストリートビューで見る", en: "Open the signs in Street View" } },
    ],
    map: { lat: 34.7298265, lng: 137.8986674, ja: "磐田 しっぺい 応援看板", en: "Iwata Shippei cheer-up signs" },
    viewpoint: { lat: 34.727510, lng: 137.900516 },
  },
  {
    id: "hamanako",
    icon: "🚤",
    ja: { name: "浜名湖", area: "浜松 → 豊橋", hook: "列車が、湖の上をはしる。", story: "浜松を出て街並みが途切れると、窓の両側が急に水面へ変わります。橋の上では線路脇まで水が迫り、まるで海の上を新幹線で走っているよう。A席側の赤鳥居、E席側のボートレース場や白いサンマリンブリッジ、湖面の養殖棚、条件がそろった日の富士山まで、短い間に見どころが連続します。" },
    en: { name: "Lake Hamana", area: "Hamamatsu → Toyohashi", hook: "The train runs over the water.", story: "After Hamamatsu, the city suddenly gives way to water on both sides of the train. With the lake reaching almost to the tracks, it can feel as if the Shinkansen is running over the sea. In a short sequence, look for Bentenjima's red torii from Seat A, the boat-race course and white Sun Marine Bridge from Seat E, aquaculture structures on the water, and—on exceptionally clear days—distant Mt. Fuji." },
    pageTitle: {
      ja: "新幹線から見える浜名湖｜赤鳥居・競艇場・養殖棚・富士山 | 新幹線の窓",
      en: "Lake Hamana from the Shinkansen: Torii, Boat Race and Mt. Fuji",
    },
    pageHeading: {
      ja: "海の上を走るような、浜名湖の車窓",
      en: "Lake Hamana: a Shinkansen ride that feels above the sea",
    },
    pageHeadingChunks: {
      ja: ["海の上を走るような、", "浜名湖の車窓"],
      en: ["Lake Hamana: a Shinkansen ride", "that feels above the sea"],
    },
    metaDescription: {
      ja: "浜松〜豊橋の新幹線車窓から見える浜名湖を、弁天島の赤鳥居、ボートレース浜名湖、養殖棚、サンマリンブリッジ、浜名湖越しの富士山とともに写真で案内します。",
      en: "A photo guide to Lake Hamana from the Tokaido Shinkansen, including Bentenjima's red torii, Boat Race Hamanako, aquaculture structures, Sun Marine Bridge and distant Mt. Fuji.",
    },
    sectionHeading: {
      ja: "浜名湖は、ひとつの景色ではない",
      en: "Lake Hamana is a sequence of window views",
    },
    pageStory: {
      ja: "浜松から豊橋へ向かうと、街並みの先で突然、窓のすぐ下まで水面がひろがります。東海道新幹線がこれほど水際を走る区間は珍しく、橋を渡る瞬間は、湖というより海の上を走っているような浮遊感があります。A席とE席で見えるものが違うため、往復で席を変えても楽しめる定番車窓です。",
      en: "Between Hamamatsu and Toyohashi, the cityscape suddenly opens into water almost directly below the windows. Few parts of the Tokaido Shinkansen run this close to the water, and crossing the bridges can feel less like passing a lake than gliding above the sea. Seats A and E reveal different landmarks, making the view rewarding in both directions.",
    },
    explainer: {
      heading: { ja: "数十秒に重なる、浜名湖の見どころ", en: "What appears during the Lake Hamana crossing" },
      ja: [
        "A席・海側では、弁天島に入った直後、建物の間から赤い鳥居型シンボルタワーが一瞬見えます。神社の鳥居そのものではなく、弁天島を象徴する水上のランドマークです。視界が開く前後に現れるため、湖を見てから探すと間に合わないことがあります。",
        "E席・山側では、ボートレース浜名湖の広い水面やスタンド、その西側に白いサンマリンブリッジを探せます。サンマリンブリッジは競艇場周辺の交通を支えるために架けられた斜張橋で、傾いた一本の主塔と白いケーブルが目印です。",
        "湖面に並ぶ杭や棚は、浜名湖の海苔や牡蠣などの養殖施設です。浜名湖は淡水と海水が混ざる汽水湖で、海苔養殖は200年以上の歴史があります。水面の向こうの景色だけでなく、湖の上に続く人の営みも浜名湖らしい車窓です。",
        "空気が澄んだ日には、E席側でサンマリンブリッジや湖のさらに奥に富士山を探せます。三島〜新富士の大きな富士山とは別物で、湖と空の境目に小さく現れる遠望です。「富士5景」のなかでも、見えたこと自体がうれしい一景です。",
      ],
      en: [
        "From Seat A, just after entering Bentenjima, a red torii-shaped symbol tower flashes between the buildings. It is a waterfront landmark rather than the gate of a shrine, and it can disappear before the wider lake view fully opens.",
        "From Seat E, look for the broad Boat Race Hamanako course and grandstand, followed by the white Sun Marine Bridge. The cable-stayed bridge has a distinctive leaning tower and was built to improve access and safety around the racecourse.",
        "Rows of stakes and frames on the water belong to Lake Hamana's nori seaweed and oyster farming landscape. This is a brackish lake where fresh and salt water mix, and local nori cultivation has more than two centuries of history. The working landscape on the water is as characteristic as the distant shoreline.",
        "In exceptionally clear air, Mt. Fuji may appear from Seat E beyond the bridge and lake. Unlike the large view near Mishima and Shin-Fuji, this is a tiny, distant silhouette at the edge of water and sky—perhaps the most rewarding of the Five Fuji Views simply to spot.",
      ],
    },
    guideHighlight: {
      ja: "浜名湖では、広い水面だけを眺めるのではなく、A席の赤鳥居とE席の競艇場・白い橋・養殖棚を順番に探すと、数十秒の車窓がひとつの物語になります。",
      en: "Treat Lake Hamana as a sequence: the red torii from Seat A, then the racecourse, white bridge and aquaculture landscape from Seat E. The short crossing becomes a complete window story.",
    },
    photoSectionHeading: {
      ja: "写真で見る浜名湖と、湖の向こうの富士山",
      en: "Lake Hamana and distant Mt. Fuji in photographs",
    },
    sharedGuideSpotIds: ["hamanako-fuji"],
    pagePhotoSpotIds: ["hamanako-fuji"],
    minutesFromTokyo: 73, side: "E", sideLabel: { ja: "A席・E席", en: "Seats A and E" }, category: "classic", confidence: "verified", durationSec: 90, scene: "lake",
    image: "images/20260505_hamanako_design_photosy.jpg",
    photoCredit: {
      ja: "@Design_photoSY",
      en: "@Design_photoSY",
      url: "https://x.com/Design_photoSY/status/2051484905377521740",
      note: { ja: "E席から見る浜名湖。まるで海の上を走っているかのよう", en: "Lake Hamana from Seat E, as if the train were running over the sea" },
    },
    photos: [
      {
        src: "images/20260505_hamanako_design_photosy_2.jpg",
        alt: { ja: "新幹線のE席側から見える浜名湖", en: "Lake Hamana from Seat E" },
        credit: { ja: "@Design_photoSY", en: "@Design_photoSY" },
        sourceUrl: "https://x.com/Design_photoSY/status/2051484905377521740",
        note: { ja: "E席（山側）から見える湖面", en: "Lake view from Seat E, mountain side" },
      },
      {
        src: "images/20260530_hamanako.jpg",
        alt: { ja: "新幹線のE席側から見える浜名湖", en: "Lake Hamana from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
        note: { ja: "E席（山側）から見える浜名湖", en: "Lake Hamana from Seat E, mountain side" },
      },
      {
        src: "images/20260516_hamanako_seaside_1_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える浜名湖", en: "Lake Hamana from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-16",
        note: { ja: "A席（海側）から見える浜名湖", en: "Lake Hamana from Seat A, sea side" },
      },
      {
        src: "images/20260516_hamanako_seaside_2_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える浜名湖", en: "Lake Hamana from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-16",
        note: { ja: "A席（海側）から見える水辺", en: "Waterside view from Seat A, sea side" },
      },
      {
        src: "images/20250612_hamanako_torii_letus10.jpg",
        alt: { ja: "新幹線から一瞬見える弁天島の赤鳥居", en: "Bentenjima red torii briefly visible from the Shinkansen" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/517074141.html",
        note: { ja: "A席（海側）から、ビルの谷間に一瞬だけ見える赤鳥居", en: "From Seat A, sea side: a red torii appears briefly between buildings" },
      },
      {
        src: "images/20260516_hamanako_torii_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える弁天島の赤鳥居", en: "Bentenjima red torii from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-16",
        note: { ja: "A席（海側）から、ビルの谷間に一瞬だけ見える赤鳥居", en: "From Seat A, sea side: a red torii appears briefly between buildings" },
      },
      {
        src: "images/250111_hamanako_fuji_proboffin.jpg",
        alt: { ja: "浜名湖の向こうに見える遠くの富士山", en: "A distant Mt. Fuji beyond Lake Hamana" },
        credit: { ja: "@ProBoffin", en: "@ProBoffin" },
        sourceUrl: "https://x.com/ProBoffin/status/1877874599360389543",
        note: { ja: "空気が澄んだ日にだけ、E席側の湖の奥に富士山が現れます", en: "Only when the air is clear does Mt. Fuji appear beyond the lake on the Seat E side." },
      },
    ],
    relatedSpotIds: ["toyohashi-tateiwa", "kakegawa"],
    references: [REFERENCES.hamanakoTourism, REFERENCES.hamanakoEnvironment, REFERENCES.hamanakoBentenjima, REFERENCES.hamanakoNori, REFERENCES.hamanakoBoatRace, REFERENCES.sunMarineBridge, REFERENCES.hamanakoToriiBlog],
    map: { lat: 34.741111, lng: 137.569722, ja: "浜名湖", en: "Lake Hamana" },
    viewpoint: { lat: 34.690763, lng: 137.599663 },
  },
  {
    id: "hamanako-fuji", icon: "🗻",
    ja: { name: "浜名湖越しの富士山", area: "浜松 → 豊橋", hook: "湖の向こうに、遠くの富士山。", story: "浜名湖を渡るころ、E席側の水面と空の境目に、想像より遠いところに富士山が浮かぶことがあります。浜名湖から富士山までの直線距離は約120km。新富士付近の主役級の富士山とはまったく違い、湖と空の奥に小さく探す一景です。空気が澄んだ冬の朝や、雨上がりで大気が洗われた日など、条件がそろった時だけ会える車窓です。" },
    en: { name: "Mt. Fuji beyond Lake Hamana", area: "Hamamatsu → Toyohashi", hook: "A far, tiny Fuji beyond the lake.", story: "Crossing Lake Hamana, look far off on the Seat E side toward the boundary between water and sky. Mt. Fuji is about 120 km away from here, so this is a small distant Fuji to search for—nothing like the huge main-event Fuji near Shin-Fuji. It shows itself only when conditions align, especially on crisp winter mornings or after rain has washed the air." },
    guidePageId: "hamanako",
    guideAnchor: "hamanako-fuji",
    sharedGuideHeading: {
      ja: "もうひとつの主役：浜名湖越しの富士山",
      en: "A second highlight: Mt. Fuji beyond Lake Hamana",
    },
    sharedGuideStory: {
      ja: [
        "浜名湖越しの富士山は、富士5景のなかで最も遠く、小さく探す一景です。E席側で、サンマリンブリッジの奥から湖と空の境目へ視線を移してください。冬を中心に空気が澄んだ日だけ出会いやすい、見えたこと自体がうれしい富士山です。",
        "富士山はサンマリンブリッジよりさらに奥、湖と空の境目に小さく現れます。橋を目印にして、その右奥へ視線を移すと探しやすくなります。",
      ],
      en: [
        "Mt. Fuji beyond Lake Hamana is the most distant of the Five Fuji Views. From Seat E, move your eyes from Sun Marine Bridge toward the boundary between water and sky. It is easiest to find in clear winter air, and spotting it is part of the reward.",
        "Fuji appears much farther away than Sun Marine Bridge, close to the boundary between water and sky. Use the bridge as a landmark, then move your gaze beyond its right side.",
      ],
    },
    minutesFromTokyo: 73, side: "E", category: "notable", confidence: "source-backed", durationSec: 30, scene: "fuji",
    image: "images/250111_hamanako_fuji_proboffin.jpg",
    photoCredit: {
      ja: "@ProBoffin",
      en: "@ProBoffin",
      url: "https://x.com/ProBoffin/status/1877874599360389543",
      note: { ja: "浜名湖から見える富士山", en: "Mt. Fuji from Lake Hamana" },
    },
    photos: [
      {
        src: "images/20191203_hamanako_fuji_kawasan3.jpg",
        alt: { ja: "浜名湖から見える遠くの富士山", en: "Distant Mt. Fuji seen from Lake Hamana" },
        credit: { ja: "@kawasan3", en: "@kawasan3" },
        sourceUrl: "https://x.com/kawasan3/status/2071620687626973333",
        note: { ja: "湖の向こうに小さく見える富士山", en: "A tiny Fuji beyond the lake" },
      },
      {
        src: "images/190103_hamanako_fuji_sentokia.jpg",
        alt: { ja: "浜名湖から見える富士山", en: "Mt. Fuji seen from Lake Hamana" },
        credit: { ja: "@sentokia", en: "@sentokia" },
        sourceUrl: "https://x.com/sentokia/status/1080626377701748737",
        note: { ja: "サンマリンブリッジの右奥に小さく富士山", en: "Mt. Fuji is small beyond the right side of Sun Marine Bridge" },
      },
    ],
    relatedSpotIds: ["hamanako"],
    references: [REFERENCES.hamanakoTourism, REFERENCES.weatherFuji],
    map: { lat: 35.360625, lng: 138.727363, ja: "浜名湖 富士山", en: "Lake Hamana Mt. Fuji" },
    viewpoint: { lat: 34.694152, lng: 137.580813 },
  },
  {
    id: "toyohashi-tateiwa",
    icon: "🪨",
    ja: { name: "豊橋の立岩", area: "浜松 → 豊橋", hook: "浜名湖のあと、岩が立つ。", story: "浜名湖を過ぎて豊橋へ向かう途中、E席側の林の丘から、むき出しの岩壁が突き出します。これは豊橋市雲谷町にある通称「立岩」。標高約88mの岩山で、南面が最大約30m切り立つチャート質の露岩です。" },
    en: { name: "Toyohashi Tateiwa Rock", area: "Hamamatsu → Toyohashi", hook: "A standing rock after Lake Hamana.", story: "Shortly after Lake Hamana, a bare rock face rises above a wooded hill on the Seat E side. This is Tateiwa in Unoyacho, Toyohashi: an approximately 88-meter-high rocky hill with a south face of exposed chert that rises as much as 30 meters." },
    pageTitle: {
      ja: "新幹線から見える豊橋の立岩とは？座席側と場所 | 新幹線の窓",
      en: "What Is the Upright Rock near Toyohashi? Tateiwa | Shinkansen",
    },
    pageHeading: {
      ja: "新幹線から見える豊橋の立岩とは？",
      en: "What is the upright rock seen from the Shinkansen near Toyohashi?",
    },
    pageHeadingChunks: {
      ja: ["新幹線から見える、", "豊橋の立岩とは？"],
      en: ["What is the upright rock", "seen near Toyohashi?"],
    },
    metaDescription: {
      ja: "浜名湖のあと、新幹線のE席側に見える大きな岩は豊橋市雲谷町の立岩です。標高約88m、南面が最大約30m切り立つチャート質の露岩を紹介します。",
      en: "The upright rock after Lake Hamana is Tateiwa in Toyohashi, an 88-meter rocky hill with an exposed chert face. Learn what it is and where to see it from Seat E.",
    },
    sectionHeading: {
      ja: "新幹線から見える大きな岩は何？",
      en: "What is Toyohashi Tateiwa?",
    },
    pageStory: {
      ja: "東京から新大阪方面へ向かう新幹線では、浜名湖を過ぎ、新所原付近から豊橋へ入るころにE席側を見てください。林に覆われた低い丘の上から、縦に切り立った灰色の岩壁が突然現れます。豊橋市雲谷町の通称「立岩」で、遠くからでも輪郭が際立つため、「あの岩は何？」と気になりやすい車窓です。",
      en: "On a Shinkansen from Tokyo toward Shin-Osaka, watch the Seat E side after Lake Hamana as the train passes the Shinjohara area and enters Toyohashi. A steep gray rock face suddenly rises above a low wooded hill. This is Tateiwa in Unoyacho, Toyohashi, a conspicuous landmark that often leaves passengers wondering what they just saw.",
    },
    explainer: {
      heading: { ja: "立岩はどんな岩？", en: "What kind of rock is Tateiwa?" },
      ja: [
        "立岩は標高約88mの岩山の通称です。南側にはチャート質の岩肌が最大約30m切り立ち、周囲の林から岩壁だけが大きく露出しています。この形が、高速で通過する新幹線からでも目に入りやすい理由です。",
        "麓には立岩稲荷があります。ただし、立岩と信仰の直接的な関係を示す確かな資料は確認されておらず、御神体や磐座と断定するのは避けたほうがよさそうです。",
        "現地はロッククライミングでも知られます。豊橋市は利用方法を愛知県東三河遭難対策協議会へ案内しており、現地案内では岩登りに申請が必要とされています。車窓で見る岩と、現地で登る岩では前提が異なります。",
      ],
      en: [
        "Tateiwa is the local name for an approximately 88-meter-high rocky hill. Its south face exposes as much as 30 meters of steep chert above the surrounding trees, which is why it remains conspicuous even from a fast-moving Shinkansen.",
        "Tateiwa Inari stands at the foot of the hill. Some accounts connect the rock with worship, but firm evidence of a direct religious relationship has not been established, so it is best not to describe Tateiwa definitively as a sacred object.",
        "The cliff is also known to rock climbers. Toyohashi City directs visitors to the Aichi Higashi-Mikawa Mountain Rescue Council for access information, and local guidance requires an application for climbing. Seeing it from the train and visiting the cliff are very different activities.",
      ],
    },
    guideHighlight: {
      ja: "林の輪郭から岩壁だけが縦に突き出す、不自然なほど強いシルエットが見どころです。『あれは何？』と思った瞬間に見失いやすいので、浜名湖を過ぎたら先にE席側へ目を向けてください。",
      en: "The highlight is the abrupt silhouette: a bare vertical rock face rising out of an otherwise wooded hill. It is easy to lose just as you wonder what it is, so look toward Seat E before the train reaches it.",
    },
    minutesFromTokyo: 75, side: "E", category: "curious", confidence: "verified", durationSec: 3, scene: "mountain",
    image: "images/20210923_toyohashi_tateiwa_pato727.jpg",
    photoCredit: {
      ja: "@Pato_727",
      en: "@Pato_727",
      url: "https://x.com/Pato_727/status/1443264581577502720",
      note: { ja: "2021年9月23日新幹線の車窓から撮影", en: "Shot from the Shinkansen window on September 23, 2021" },
    },
    photos: [
      {
        src: "images/20191027_toyohashi_tateiwa_aosemi1995.jpg",
        alt: { ja: "新幹線のE席側から見える豊橋の立岩", en: "Toyohashi Tateiwa Rock from Seat E" },
        credit: { ja: "@aosemi1995", en: "@aosemi1995" },
        sourceUrl: "https://x.com/aosemi1995/status/1188265245686427654",
        note: { ja: "新幹線の窓から一瞬見える不思議な岩山", en: "A mysterious rocky hill that appears briefly from the Shinkansen window" },
      },
      {
        src: "images/20220626_toyohashi_tateiwa_suyqs3wr42jnm5i.jpg",
        alt: { ja: "車窓から見える豊橋の立岩", en: "Toyohashi Tateiwa Rock from the train window" },
        credit: { ja: "@SUyqs3wR42jNm5I", en: "@SUyqs3wR42jNm5I" },
        sourceUrl: "https://x.com/SUyqs3wR42jNm5I/status/1541009819804778497",
        note: { ja: "実際に見るとその雄大さに感動", en: "Its scale is moving when seen in person" },
      },
    ],
    references: [REFERENCES.toyohashiTateiwaMegalith, REFERENCES.toyohashiTateiwaCity, REFERENCES.toyohashiTateiwaWizz, REFERENCES.toyohashiTateiwaSazanami, REFERENCES.toyohashiTateiwa],
    map: { lat: 34.7258063, lng: 137.4706861, ja: "豊橋 立岩", en: "Toyohashi Tateiwa rock" },
    viewpoint: { lat: 34.723264, lng: 137.470638 },
  },
  {
    id: "mikawa-oshima",
    icon: "🏝️",
    ja: { name: "三河大島", area: "豊橋 → 三河安城", hook: "海の向こうに、ひょうたん型の島。", story: "豊橋を過ぎたあと、A席側の遠くに三河湾と三河大島が浮かぶことがあります。ふたつの島がくびれた砂州でつながった、ひょうたん型のシルエットが特徴の無人島です。浜名湖の水面が過ぎたあとも、海側の車窓にはまだ見つける楽しみが残っている——そんな存在。見通しの良い日に、蒲郡沖の水平線を探してみてください。" },
    en: { name: "Mikawa Oshima", area: "Toyohashi → Mikawa-Anjo", hook: "A gourd-shaped island beyond the bay.", story: "After Toyohashi, Mikawa Bay and Mikawa Oshima sometimes appear far away on the Seat A side. It is an uninhabited island shaped like a gourd — two smaller islands linked by a slender sandbar. After Lake Hamana passes, this is a reminder that Seat A still has quiet discoveries. On clear days, scan the horizon off Gamagori." },
    pageTitle: {
      ja: "新幹線から見える三河大島とは？ひょうたん型の島の場所と特徴 | 新幹線の窓",
      en: "What Is Mikawa Oshima? The Gourd-Shaped Island Seen from the Shinkansen",
    },
    pageHeading: {
      ja: "海の向こうのひょうたん型——三河大島とは？",
      en: "The gourd-shaped island beyond the bay: what is Mikawa Oshima?",
    },
    pageHeadingChunks: {
      ja: ["海の向こうのひょうたん型——", "三河大島とは？"],
      en: ["The gourd-shaped island beyond the bay:", "what is Mikawa Oshima?"],
    },
    metaDescription: {
      ja: "豊橋を過ぎて新幹線のA席側、三河湾に浮かぶ三河大島の正体と場所を解説。ひょうたん型の無人島で、蒲郡市の沖合いに位置します。車窓での見つけ方や周辺情報も紹介。",
      en: "Between Toyohashi and Mikawa-Anjo, the small gourd-shaped island visible far off Seat A is Mikawa Oshima — an uninhabited island in Mikawa Bay off Gamagori. Learn what it is and how to spot it from the Shinkansen.",
    },
    sectionHeading: {
      ja: "三河大島はどんな島？",
      en: "What kind of island is Mikawa Oshima?",
    },
    pageStory: {
      ja: "三河大島は、愛知県蒲郡市の沖合いに浮かぶ無人島です。実は「ふたつの島がひとつになった」形をしていて、大きめの北側の島と小さめの南側の島が、砂州でつながっています。空から見るとまさに「ひょうたん」型。周囲約4km、面積約0.2平方kmと小さな島ですが、車窓のように遠くから見た輪郭は、そのくびれのおかげで意外と目に残ります。かつては海水浴場として夏場のみ賑わい、蒲郡港から定期船で渡ることができた時期もありましたが、現在は定期航路がなく、静かな島に戻っています。",
      en: "Mikawa Oshima is an uninhabited island lying off Gamagori City in Aichi Prefecture. It is really 'two islands in one': a larger northern island and a smaller southern island joined by a sandbar. Seen from above the shape is unmistakably a gourd. The island is small — about 4 km around and roughly 0.2 km² in area — but from far away, that pinched waist actually makes the silhouette memorable. Once a summer swim destination reached by ferry from Gamagori Port, it now has no regular passenger service and has returned to quiet.",
    },
    explainer: {
      heading: { ja: "三河湾と、車窓からの見え方", en: "Mikawa Bay and how it appears from the train" },
      ja: [
        "三河湾は、渥美半島と知多半島に囲まれた比較的浅い内湾で、東京湾や大阪湾に比べて穏やかな海面が広がるのが特徴です。牡蠣・アサリ・海苔などの養殖が盛んで、いくつもの小島が散らばっています。三河大島はその中でも蒲郡沖に浮かぶ代表的な島のひとつで、蒲郡湾沖10km前後の位置にあります。",
        "新幹線からは、豊橋を出て蒲郡・三ケ根方向へ進むにつれてA席側に海面が広がる区間があります。海がずっと開けているのではなく、市街地と丘の合間にちらちらと現れる形なので、意識せずに乗っていると通り過ぎがちです。「ひょうたん型の島」を先に頭に入れて窓の外を眺めると、うっすらとしたシルエットが視野に入ってくることがあります。",
        "この一帯は東洋経済オンラインの車窓連載でも取り上げられており、車窓から見える三河湾の風景としては数少ないランドマークのひとつです。晴天で視程が長い日、朝夕の斜光で島の輪郭が濃く出るタイミングが狙い目です。",
      ],
      en: [
        "Mikawa Bay is a relatively shallow inlet enclosed by the Atsumi and Chita peninsulas, calmer than Tokyo Bay or Osaka Bay and dotted with small islands. It is well known for oyster, clam and nori seaweed cultivation. Mikawa Oshima is one of the most recognizable islands in the bay, lying roughly 10 km offshore from Gamagori.",
        "From the Shinkansen, the Seat A side opens toward the bay in short bursts after Toyohashi as the train moves toward the Gamagori and Sangane area. The sea does not stay in view continuously; it flickers between towns and hills, so it is easy to miss without knowing where to look. Keep the 'gourd-shaped island' image in your head, and you may spot its low silhouette across the water.",
        "This stretch has been featured in Toyo Keizai's Shinkansen window column as one of the rare identifiable landmarks on the Mikawa Bay side. Best conditions: clear days with long visibility, or the angled light of early morning or late afternoon, when the island's outline becomes darker against the water.",
      ],
    },
    guideHighlight: {
      ja: "豊橋を出て蒲郡付近を進むあいだ、A席側の遠くに水平線が開ける瞬間があります。そのとき、水平線の上にごく低くひょうたん型の輪郭を探してみてください。派手なランドマークではないぶん、見つけた瞬間のちょっとした達成感がある車窓です。",
      en: "After Toyohashi, as the train passes Gamagori, watch for moments when the far horizon opens on the Seat A side. In those seconds, look for a low, gourd-shaped outline sitting just above the water. It is not a bold landmark, but exactly for that reason, spotting it feels like a small quiet win.",
    },
    minutesFromTokyo: 84, side: "A", category: "notable", confidence: "needs-check", durationSec: 5, scene: "bay",
    image: "images/20181213_mikawa_oshima_kawasan3.jpg",
    photoCredit: {
      ja: "@kawasan3",
      en: "@kawasan3",
      url: "https://x.com/kawasan3/status/1072976990150348800",
      note: { ja: "夕暮れにうかぶ三河大島", en: "Mikawa Oshima floating in the evening light." },
    },
    photos: [
      {
        src: "images/20260712_mikawa_oshima_michikusa.jpg",
        alt: { ja: "新幹線のA席側から遠くに見える三河大島", en: "Mikawa Oshima seen far away from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "夕方の三河湾に低く浮かぶ島影", en: "A low island silhouette over Mikawa Bay in the evening." },
      },
    ],
    references: [REFERENCES.toyokeizaiMikawa, REFERENCES.mikawaOshimaGamagori, REFERENCES.mikawaOshimaWiki],
    map: { lat: 34.78876767723613, lng: 137.23307674842255, ja: "三河大島", en: "Mikawa Oshima" },
    viewpoint: { lat: 34.824957815965384, lng: 137.24433532297894 },
  },
  {
    id: "nichiban-anjo",
    icon: "🟦",
    ja: { name: "セロテープの壁看板", area: "三河安城付近", hook: "工場の壁が、まるごとセロテープ。", story: "東京から名古屋方面へ向かう列車では、三河安城の少し手前のE席側で、工場の壁いっぱいに描かれた巨大な「セロテープ®」の広告看板が視界を覆います。名古屋から東京方面ならば三河安城を出てすぐ。赤・青・黒に彩られたテープ本体とロゴが原寸大どころではないスケールで貼りついているので、思わず「え、いま何？」と反応してしまう車窓です。ここはニチバン株式会社の安城工場で、日本の家庭でおなじみの粘着テープ「セロテープ」を1948年から製造してきた拠点。時々「無くしてわかる有難さ。親と健康とセロテープ」など、印象的なコピーが差し替えられます。ただの企業広告以上に、東海道新幹線らしい沿線の“発見”として愛されている看板です。" },
    en: { name: "CELLOTAPE Wall Sign", area: "Around Mikawa-Anjo", hook: "A whole factory wall as a tape ad.", story: "On trains from Tokyo toward Nagoya, a factory wall painted end-to-end with the huge red-and-blue 'CELLOTAPE®' brand mark appears on the Seat E side shortly before Mikawa-Anjo. In the opposite direction, look just after leaving Mikawa-Anjo. The scale is so exaggerated — a roll of sticky tape rendered many meters wide — that first-time riders often do a double take. This is Nichiban Corporation's Anjo Factory, which has been producing CELLOTAPE, the household clear tape known throughout Japan, since 1948. The wall copy is updated from time to time; one memorable Japanese line paired with the brand reads, 'You only appreciate their value once they're gone: parents, health, and CELLOTAPE.' It has grown into one of those loved trackside 'discoveries' that regulars watch for every trip." },
    pageTitle: {
      ja: "新幹線から見えるセロテープの壁看板｜ニチバン安城工場 | 新幹線の窓",
      en: "The Giant CELLOTAPE Wall Sign from the Shinkansen | Nichiban Anjo Factory",
    },
    pageHeading: {
      ja: "工場の壁いっぱいに広がる、セロテープの壁看板",
      en: "A factory wall painted with a giant CELLOTAPE ad",
    },
    pageHeadingChunks: {
      ja: ["工場の壁いっぱいに広がる、", "セロテープの壁看板"],
      en: ["A factory wall painted with", "a giant CELLOTAPE ad"],
    },
    metaDescription: {
      ja: "三河安城付近、新幹線のE席側で工場の壁全体に描かれた巨大なセロテープ広告は、ニチバン安城工場の壁看板。ニチバンとセロテープの歴史、印象的なコピーの背景、通過タイミングを紹介します。",
      en: "Around Mikawa-Anjo, a factory wall painted with a giant CELLOTAPE ad appears on the Seat E side of the Shinkansen. Learn the history of Nichiban and CELLOTAPE, and how to spot this beloved trackside sign.",
    },
    sectionHeading: {
      ja: "壁看板のあの工場、何を作っているの？",
      en: "What is that factory actually making?",
    },
    pageStory: {
      ja: "壁看板の主は、ニチバン株式会社の安城工場です。ニチバンは1918年（大正7年）に日絆工業所として創業した粘着テープ・救急絆創膏の老舗メーカーで、家庭で使うセロテープや「ケアリーヴ」「バトルウィン」など、日常に溶け込んだブランドを数多く展開しています。安城工場はその中でも中核工場のひとつで、1948年からセロテープを製造してきました。工場そのものは沿線に建つ普通の産業施設ですが、新幹線から見える壁面をまるごと広告として使ってきたことで、東海道新幹線の車窓に不動の存在感を持つ看板として親しまれています。",
      en: "The wall belongs to the Anjo Factory of Nichiban Corporation. Founded in 1918 as Nichi-Ban Industrial Works, Nichiban is a long-established manufacturer of adhesive tapes and first-aid dressings, whose everyday brands — CELLOTAPE, the Care Leaves bandage line, the BATTLE WIN athletic tape range and more — are familiar in almost every Japanese household. Anjo is one of Nichiban's flagship factories and has been producing CELLOTAPE here since 1948. The building itself is an ordinary industrial facility, but by using its Shinkansen-facing wall as a giant advertisement, Nichiban has turned it into one of the Tokaido Shinkansen's most recognizable trackside signs.",
    },
    explainer: {
      heading: { ja: "「セロテープ」と、あの一行コピーの話", en: "About CELLOTAPE — and that one-line copy" },
      ja: [
        "「セロテープ®」は、透明で切りやすいセロハン基材の粘着テープに対するニチバンの登録商標です。もともとは第二次世界大戦後、GHQ調達品として同種のテープが求められた際に、日本国内での供給拠点として同社が量産を始めました。文房具用の透明テープは他社製品も多く流通していますが、日本語で「セロテープ」と呼ばれることが多いのは、ニチバンのこの商標が生活語として定着しているためです。",
        "壁看板には、時代によって様々なコピーが掲げられてきました。「無くしてわかる有難さ。親と健康とセロテープ。」は、その中でも特に人気の高い一節で、家庭にあって当たり前だからこそ、その大切さを再確認させるフレーズとして車窓越しの記憶にも残ります。壁ごと差し替え可能な広告面としても、比較的頻繁にリニューアルされる看板です。",
        "沿線広告の中には、単なる企業ロゴでもなく、押しつけがましいセールストークでもない、旅の途中に見ると少し心が動く広告があります。727看板、しっぺい看板、そしてこのセロテープ看板は、その代表格。「今日はどんなコピーが出ているか」を旅の楽しみに数える人も少なくありません。",
      ],
      en: [
        "'CELLOTAPE®' is Nichiban's registered trademark for clear cellophane-based adhesive tape. After World War II, when GHQ procurement created demand for this kind of tape, Nichiban became the leading domestic supplier and volume production spread from there. In Japan, clear stationery tape is very often called serotēpu, echoing Nichiban's brand — a fixed everyday word rather than the name of one product.",
        "The wall has carried many different pieces of ad copy over the years. One of the best loved is: 'You only appreciate their value once they're gone: parents, health, and CELLOTAPE.' It flips a household staple into a small reminder of what you take for granted — an unusual tone for a trackside sign, and something riders often remember. The wall is repainted from time to time, so the exact message you see may not match the one your friend recalls.",
        "Trackside advertising in Japan sometimes reaches beyond a company logo or a straight sales pitch to say something that lightly moves a passing rider. The 727 signs, the Shippei cheer-up signs and this CELLOTAPE wall are the classic trio. Regulars quietly enjoy watching for 'today's line.'",
      ],
    },
    guideHighlight: {
      ja: "三河安城が近づいたら、E席側の遠くに工場地帯を意識してください。工場の壁面いっぱいに、太くはっきりした赤・青・白の帯が描かれた建物が見えたらそれがニチバン安城工場のセロテープ壁看板です。反対方向（上り）では、三河安城を通過した直後がタイミングです。夜は看板そのものが照明で照らされ、暗い工場地帯のなかに赤と青の帯だけが浮かび上がるので、昼より見つけやすいくらいです。",
      en: "As Mikawa-Anjo approaches, watch the industrial area far off on the Seat E side. Look for a factory whose entire wall is dressed in bold red, blue and white stripes — that is Nichiban's Anjo Factory and its CELLOTAPE wall sign. In the opposite direction (upbound), the timing is just after passing Mikawa-Anjo. At night the sign itself is lit, so the red and blue bands float out of the dark industrial belt — arguably easier to spot than in daylight.",
    },
    minutesFromTokyo: 85, side: "E", category: "curious", confidence: "source-backed", durationSec: 3, scene: "solar",
    image: "images/20250221_nichiban_anjo_letus10.jpg",
    photoCredit: {
      ja: "@letus10 / 新幹線の車窓から",
      en: "@letus10 / Shinkansen window blog",
      url: "https://cotetu.seesaa.net/article/510591087.html",
      note: { ja: "ニチバン安城工場のセロテープの壁看板", en: "CELLOTAPE wall sign at Nichiban Anjo Factory" },
    },
    photos: [
      {
        src: "images/20260629_nichiban_anjo_night_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜の新幹線から見えるセロテープの壁看板", en: "CELLOTAPE Wall Sign at night from the Shinkansen" },
        date: "2026-06-29",
        note: { ja: "夜に浮かぶセロテープ広告", en: "The CELLOTAPE ad glowing at night" },
      },
      {
        src: "images/20260704_nichiban_anjo_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見えるニチバン安城工場", en: "Nichiban Anjo Factory from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-04",
        note: { ja: "セロテープの色帯が工場壁面の目印", en: "The CELLOTAPE color bands mark the factory wall." },
      },
    ],
    references: [REFERENCES.nichibanCompany, REFERENCES.cellotapeStory, REFERENCES.nichibanPrtimes, REFERENCES.nichibanBlog],
    map: { lat: 34.972656, lng: 137.058777, ja: "ニチバン 安城工場 セロテープ 壁看板", en: "Nichiban Anjo Factory CELLOTAPE wall sign" },
    viewpoint: { lat: 34.971971, lng: 137.057485 },
  },
  {
    id: "nagoya-station-skyline",
    icon: "🏙️",
    ja: { name: "名古屋駅前", area: "名古屋到着直前", hook: "あのビル群は何？名古屋駅前。", story: "東京から新大阪方面へ向かう列車では、名古屋到着直前にE席側の景色が一気に高層ビル街へ変わります。ねじれた網目模様はモード学園スパイラルタワーズ、駅の真上に並ぶ2本の白い塔はJRセントラルタワーズ、その隣で駅ホームを覆うガラスの巨大な塔はJRゲートタワー。少し北寄りに濃い色をした四角い塔はミッドランドスクエア、少し西の白い塔は大名古屋ビルヂング……と、名古屋駅前は明確に名前の付いた高層ビルが5〜6本、密集して立つ日本屈指の駅前スカイラインです。建物の名前が分かるだけで、短い駅前風景が名古屋到着の小さな建築案内になります。" },
    en: { name: "Nagoya Station Skyline", area: "Just before Nagoya", hook: "Which towers are those?", story: "Approaching Nagoya from Tokyo, the view on the Seat E side suddenly opens onto a wall of high-rises. The twisted lattice tower is Mode Gakuen Spiral Towers. The pair of white towers directly above the station are JR Central Towers, and the huge glass tower right beside them, covering the platforms, is JR Gate Tower. The dark rectangular tower slightly to the north is Midland Square, while the light-colored slab a little to the west is Dai Nagoya Building — five or six clearly named high-rises grouped around one station, one of Japan's densest station-front skylines. Knowing the names turns the brief cityscape into a small architecture tour announcing your arrival." },
    pageTitle: {
      ja: "新幹線から見える名古屋駅前のスカイライン｜あの高層ビルの名前 | 新幹線の窓",
      en: "The Nagoya Station Skyline from the Shinkansen | Naming the Towers | Shinkansen Window",
    },
    pageHeading: {
      ja: "名古屋到着直前——駅前の高層ビル群、その正体",
      en: "Just before arriving at Nagoya — naming the station's tower cluster",
    },
    pageHeadingChunks: {
      ja: ["名古屋到着直前——", "駅前の高層ビル群、その正体"],
      en: ["Just before arriving at Nagoya —", "naming the station's tower cluster"],
    },
    metaDescription: {
      ja: "名古屋到着直前、新幹線のE席側に立ち並ぶ高層ビル群を、モード学園スパイラルタワーズ、JRセントラルタワーズ、JRゲートタワー、ミッドランドスクエアなどの名前と一緒に紹介します。",
      en: "Just before Nagoya, the Seat E window fills with a wall of high-rises. Learn to name Mode Gakuen Spiral Towers, JR Central Towers, JR Gate Tower, Midland Square and more, and how they reshape the Nagoya Station skyline.",
    },
    sectionHeading: {
      ja: "あの高層ビル、どれがどれ？",
      en: "Which tower is which?",
    },
    pageStory: {
      ja: "名古屋駅前（名駅・めいえき）エリアは、平成〜令和にかけて名古屋の顔として大きく変化してきた再開発エリアです。1999年、駅の真上にJRセントラルタワーズがオフィス・ホテル・百貨店を統合した超高層複合施設として完成し、名古屋のスカイラインを大きく塗り替えました。その後、2007年ミッドランドスクエア（トヨタ自動車グループ本社ビル）、2008年モード学園スパイラルタワーズ、2017年JRゲートタワーと、10〜20年のスパンで駅を取り囲む形で超高層ビルが積み上がっていき、駅前は日本国内でも屈指の高層ビル集積地になりました。",
      en: "The area right in front of Nagoya Station — known locally as Meieki — is one of Japan's most dramatically redeveloped station districts of the Heisei and Reiwa eras. In 1999, JR Central Towers rose directly above the station as a combined office, hotel and department-store complex, redrawing Nagoya's skyline. That was followed by Midland Square (headquarters of the Toyota Motor group) in 2007, Mode Gakuen Spiral Towers in 2008 and JR Gate Tower in 2017 — a two-decade run of skyscraper construction that has turned Meieki into one of Japan's densest concentrations of high-rise buildings.",
    },
    explainer: {
      heading: { ja: "主な高層ビル、それぞれの特徴", en: "The main towers, one by one" },
      ja: [
        "JRセントラルタワーズ（1999年）は、駅の真上に立つ双塔で、オフィス側245m、ホテル側226m。当時「駅ビル」の常識を大きく塗り替えた建築として国際的にも注目されました。名古屋駅の顔として長く親しまれる存在です。",
        "JRゲートタワー（2017年）は、セントラルタワーズと隣接して立つ約220mの複合ビル。低層部にはJR名古屋高島屋のゲートタワーモール、上層はオフィスとホテル。新幹線ホームが直接ビルの下に組み込まれた特殊な構成で、乗車したまま巨大なガラス壁の下を潜っていく感覚があります。",
        "モード学園スパイラルタワーズ（2008年）は、名駅エリアで最も目立つ独特のシルエットを持つ170mの校舎ビル。3本の光沢帯（ホワイトカーテンウォール、ダークメタリック、シルバー系ガラス）が上方向に螺旋を描く外観で、専門学校3校（HAL・モード学園・首都医校）が入居しています。日本建築学会賞など多数の受賞歴があるモダン建築です。",
        "ミッドランドスクエア（2007年）は、トヨタ自動車グループの本社ビルとして建てられた247mの複合ビル。低層階のブランドショップ、上層のオフィス、最上階には屋外展望施設「スカイプロムナード」があります。夜景スポットとしても知られる存在です。",
        "そのほか、駅の南西側には大名古屋ビルヂング（2016年建替、180m）、名古屋ルーセントタワー（2007年、180m）などが並び、車窓では複数の高層ビルが折り重なるように見えます。",
      ],
      en: [
        "JR Central Towers (1999) — the twin towers rising directly above the station, 245 m on the office side and 226 m on the hotel side. When it opened, this complex redefined what a Japanese station building could be and drew international attention.",
        "JR Gate Tower (2017) — a roughly 220 m mixed-use tower right next to JR Central Towers. Its lower floors house the JR Nagoya Takashimaya Gate Tower Mall, its upper floors host offices and a hotel. Unusually, the Shinkansen platforms slide directly beneath the tower, so trains literally arrive under a huge wall of glass.",
        "Mode Gakuen Spiral Towers (2008) — the 170 m academic building with the most distinctive silhouette in Meieki. Three vertical strips (white curtain wall, dark metallic panel and silver glass) spiral upward around the tower. It houses three vocational schools (HAL, Mode Gakuen and Shuto Iko) and has won multiple architecture awards.",
        "Midland Square (2007) — the 247 m headquarters complex of the Toyota Motor group. Boutique shops fill the lower floors, offices the middle, and an open-air observatory 'Sky Promenade' crowns the top; it is also a well-known night-view spot.",
        "Nearby stand additional towers such as the redeveloped Dai Nagoya Building (2016, 180 m) and Nagoya Lucent Tower (2007, 180 m), so from the train the skyline appears as multiple high-rises overlapping.",
      ],
    },
    guideHighlight: {
      ja: "名古屋到着の数分前から、E席側に高層ビル群が見え始めます。まずは「ねじれたスパイラル型」（モード学園）を目印に、そこから駅の方向へ視線を寄せると2本並ぶ白い塔（JRセントラルタワーズ）と、その隣のガラスの塔（JRゲートタワー）が見つかります。もっと視線を上へ振ると濃い色のミッドランドスクエア。夜はライトアップや窓明かりで層状のスカイラインが強調され、昼とは違う印象を楽しめます。",
      en: "A few minutes before arriving at Nagoya, the Seat E window starts filling with towers. Use the twisted 'spiral' outline of Mode Gakuen Spiral Towers as your first landmark, then move your gaze toward the station itself: the two matching white towers (JR Central Towers) and the glass tower right beside them (JR Gate Tower) come into focus. Look a little higher and to the side for the darker Midland Square. At night, lit windows and building illumination emphasize the layered skyline in a different way from daytime.",
    },
    explainerFigure: {
      src: "images/20160111_nagoya_station_buildings_alpsdake_cc-by-sa-4.0.jpg",
      alt: { ja: "名古屋駅前の高層ビルを建物名付きで示した参考図", en: "Labeled reference image of the high-rise buildings around Nagoya Station" },
      caption: {
        ja: "名古屋駅前の主なビル位置関係を確認するための参考図。2016年撮影のため、JRゲートタワーは建設中の状態で写っています。",
        en: "Reference image showing the relative positions of Nagoya Station's main towers. Photographed in 2016, with JR Gate Tower still under construction.",
      },
      credit: { ja: "Alpsdake / Wikimedia Commons / CC BY-SA 4.0", en: "Alpsdake / Wikimedia Commons / CC BY-SA 4.0" },
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Skyscrapers_of_Meieki_(2016-01-11_with_note).JPG",
      date: "2016-01-11",
      afterParagraph: 0,
    },
    minutesFromTokyo: 94, side: "E", category: "notable", confidence: "verified", durationSec: 30, scene: "hills",
    image: "images/20260530_nagoya_station_1_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-05-30",
      note: { ja: "ねじれた形のビルはモード学園スパイラルタワーズ", en: "The twisted tower is Mode Gakuen Spiral Towers" },
    },
    photos: [
      {
        src: "images/20260530_nagoya_station_2_michikusa.jpg",
        alt: { ja: "新幹線から見える名古屋駅前の高層ビル", en: "Nagoya Station skyline from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
        note: { ja: "中央がJRセントラルタワーズ、右手がミッドランドスクエア", en: "JR Central Towers in the center, Midland Square on the right" },
      },
      {
        src: "images/20260530_nagoya_station_3_michikusa.jpg",
        alt: { ja: "新幹線から見える名古屋駅前の都市景観", en: "Urban view around Nagoya Station from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
        note: { ja: "モールが建つ前は名古屋城が合間に見えていた", en: "Before the mall was built, Nagoya Castle could be glimpsed between the buildings" },
      },
      {
        src: "images/20260629_2158_nagoya_station_night_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜の新幹線から見える名古屋駅前", en: "Nagoya Station skyline at night from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-06-29",
        note: { ja: "夜の名古屋到着前、駅前の光が近づく", en: "City lights approach just before arriving at Nagoya at night" },
      },
    ],
    references: [REFERENCES.nagoyaCentralTowers, REFERENCES.nagoyaJrGateTower, REFERENCES.nagoyaSpiralTowers, REFERENCES.nagoyaMidlandSquare, REFERENCES.meiekiRedevelopment],
    map: { lat: 35.170693, lng: 136.881638, ja: "名古屋駅", en: "Nagoya Station" },
    viewpoint: { lat: 35.168703, lng: 136.882497 },
  },
  {
    id: "kirin-beer-factory",
    icon: "🏭",
    ja: { name: "キリンビール工場", area: "名古屋 → 岐阜羽島", hook: "巨大な生ビールが、ずらりと並ぶ。", story: "名古屋を出て庄内川を渡り、枇杷島駅の横を過ぎるころ、E席側の車窓いっぱいにキリンビール名古屋工場（キリンビバレッジ 東海工場と隣接）が広がります。工場敷地の目印になるのが、麦芽を発酵させた液を蓄える大型の発酵貯酒タンク（円筒型ステンレスタンク）。銀色で20mを超える高さがあり、遠目には「巨大な生ビールがずらりと並んでいる」ように見える独特の産業景観です。ここは中京圏の需要を支える主力工場で、清洲城のすぐ手前・線路沿いに位置する、地味だけれど記憶に残る車窓のひとつです。" },
    en: { name: "Kirin Beer Factory", area: "Nagoya → Gifu-Hashima", hook: "Rows of tanks like giant beers.", story: "After leaving Nagoya, crossing the Shonai River and passing Biwajima Station, the Kirin Beer Nagoya Factory (adjacent to Kirin Beverage's Tokai plant) fills the Seat E window. Its most distinctive feature is a row of large cylindrical stainless-steel fermentation and storage tanks — over 20 meters tall — that from a distance look uncannily like a lineup of giant draft beers, complete with silvery bodies. This is one of Kirin's main breweries serving the greater Nagoya region, sitting right beside the tracks just before Kiyosu Castle. Quiet but memorable, it is exactly the kind of industrial scenery that sticks in the mind." },
    pageTitle: {
      ja: "新幹線から見えるキリンビール工場｜名古屋工場の巨大タンク | 新幹線の窓",
      en: "Kirin Beer Nagoya Factory from the Shinkansen | The Giant Tank Line",
    },
    pageHeading: {
      ja: "線路沿いにずらり——キリンビール名古屋工場",
      en: "A wall of shiny tanks by the tracks: Kirin Beer's Nagoya Factory",
    },
    pageHeadingChunks: {
      ja: ["線路沿いにずらり——", "キリンビール名古屋工場"],
      en: ["A wall of shiny tanks by the tracks:", "Kirin Beer's Nagoya Factory"],
    },
    metaDescription: {
      ja: "名古屋を出て枇杷島付近、新幹線のE席側に広がるキリンビール名古屋工場。銀色の巨大タンクが並ぶ独特の車窓と、工場の役割・見学情報などをまとめて紹介します。",
      en: "Just after Nagoya, past Biwajima, the Kirin Beer Nagoya Factory fills the Seat E window with rows of huge silver tanks. Learn what they are, what the factory does, and how to spot it from the Shinkansen.",
    },
    sectionHeading: {
      ja: "この巨大な銀のタンク、何をしている？",
      en: "What are those giant silver tanks for?",
    },
    pageStory: {
      ja: "キリンビール名古屋工場は、愛知県清須市寺野に立地する主力工場のひとつで、ビール類の製造能力・出荷量ともに中京圏最大級です。工場敷地全体はおよそ29ヘクタール（東京ドーム約6個分）と広大で、その中にキリンビールの発酵・貯酒・パッケージング工程を担う建屋群と、キリンビバレッジ東海工場の飲料製造工程が並んでいます。新幹線からいちばん目立つのは、ずらりと並ぶ円筒形の巨大タンク群です。",
      en: "The Kirin Beer Nagoya Factory in Terano, Kiyosu, Aichi Prefecture is one of Kirin's flagship breweries, with among the largest production and shipment capacity in the greater Nagoya region. The site covers roughly 29 hectares (about six Tokyo Domes), with buildings for Kirin's fermentation, storage and packaging processes standing beside the Kirin Beverage Tokai plant that produces soft drinks. What stands out from the Shinkansen is the row of huge cylindrical tanks along the rail side.",
    },
    explainer: {
      heading: { ja: "タンクの正体と、工場の裏側", en: "What the tanks really are, and what happens inside" },
      ja: [
        "銀色の円筒タンクは、ビールを発酵・熟成させ、そのまま貯蔵する「発酵貯酒タンク」です。仕込み釜で麦芽と水から作った麦汁（ばくじゅう）に酵母を加え、糖分がアルコールと炭酸ガスに変わっていく発酵工程がここで行われます。発酵後は0℃前後の低温で数週間、酵母の働きが落ち着くまで熟成させ、味わいを整えます。1基あたり数百キロリットルの容量を持つものも多く、これが数十本並ぶスケール感が、新幹線から見る「巨大な生ビール」のイメージにそのままつながっています。",
        "工場では、原材料の受け入れから、仕込み・発酵・貯酒・ろ過・充填（缶・瓶・樽）・出荷までを一つの敷地でおこなっています。名古屋工場は「一番搾り」など主力ブランドのほか、時期によっては限定ビールも仕込む重要拠点です。",
        "見学ツアー（ブルワリーツアー）も設けられていて、事前予約でビールのできる工程を歩きながら学び、最後に淹れたてのビールを試飲することができます。新幹線で見えたあの銀色のタンクの中を、後日、目で見て体で感じる楽しみ方もあります。",
      ],
      en: [
        "The tall silver tanks are fermentation-and-conditioning tanks, where wort — the sugar-rich liquid made from malted barley and water — is combined with yeast and turned into beer. Yeast converts the sugars into alcohol and CO2 over a few days, then the beer is held at near-zero temperatures for weeks to condition and clean up the flavor. Individual tanks can hold hundreds of kiloliters, and rows of dozens of them are exactly what gives the 'giant beers' impression from the train.",
        "The site handles the whole process — raw material intake, brewing, fermentation, conditioning, filtration, canning / bottling / kegging, and shipment. The Nagoya Factory brews Kirin's flagship 'Ichiban Shibori' among other core brands, and periodically produces limited-run seasonal beers.",
        "The brewery offers reserved 'Brewery Tour' visits, walking guests through the process with a fresh-poured tasting at the end. If the giant silver tanks catch your eye from the Shinkansen, that is one way to close the loop and step inside them later.",
      ],
    },
    guideHighlight: {
      ja: "名古屋を出て庄内川を渡り、枇杷島駅の横を通ったら、E席側の窓に沿った工業地帯を見てください。ずらりと並ぶ銀色の円筒タンクとキリンのロゴが入った建物が現れます。清洲城のすぐ手前なので、キリン→清洲城→ソーラーアークと連続して短い区間で三つの見どころを楽しめます。",
      en: "After leaving Nagoya, crossing the Shonai River and passing Biwajima Station, look at the industrial area along the Seat E side. A row of silver cylindrical tanks and buildings marked with Kirin's logo appears. Kirin sits just before Kiyosu Castle, so within a short stretch you can enjoy three highlights in sequence: Kirin, Kiyosu Castle, and Solar Ark.",
    },
    minutesFromTokyo: 98, side: "E", category: "notable", confidence: "verified", durationSec: 5, scene: "solar",
    image: "images/20250920_kirin_beer_factory_letus10.jpg",
    photoCredit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog", url: "https://cotetu.seesaa.net/article/518214924.html" },
    photos: [
      {
        src: "images/20250920_kirin_beer_factory_2_letus10.jpg",
        alt: { ja: "新幹線のE席側から見えるキリンビール工場の貯蔵タンク", en: "Kirin Beer Factory storage tanks from Seat E" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/518214924.html",
      },
      {
        src: "images/20260530_kirin_beer_factory_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見えるキリンビール工場", en: "Kirin Beer Factory from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
      },
      {
        src: "images/20260629_kirin_beer_factory_michikusa.jpg",
        alt: { ja: "朝の新幹線から見えるキリンビール名古屋工場", en: "Kirin Beer Nagoya Factory from a morning Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-06-29",
        note: { ja: "朝の光で銀色のタンク列が見分けやすい写真", en: "Morning light makes the row of silver tanks easier to read." },
      },
    ],
    references: [REFERENCES.kirinBrewery, REFERENCES.kirinBlog],
    map: { lat: 35.2098489, lng: 136.8501779, ja: "キリンビール 名古屋工場", en: "Kirin Beer Nagoya Factory" },
    viewpoint: { lat: 35.208877, lng: 136.848211 },
  },
  {
    id: "kiyosu",
    icon: "🏯",
    ja: { name: "清洲城", area: "名古屋 → 岐阜羽島", hook: "信長の城が、線路のすぐ横に。", story: "名古屋を出て数分、線路のすぐ近くに朱塗りの欄干をまとった清洲城の天守があらわれます。ここは織田信長が本拠を置き、桶狭間の戦いへ出陣した城。信長の死後、後継と領地を決めた歴史的な「清洲会議」が開かれた城でもあります。江戸時代初期に名古屋城へ機能が移されて廃城となり、現在の白と朱の天守は1989年に再建された模擬天守。それでも、日本の城で新幹線が最も近くを通る城のひとつであることに変わりはありません。" },
    en: { name: "Kiyosu Castle", area: "Nagoya → Gifu-Hashima", hook: "Nobunaga's trackside castle.", story: "A few minutes out of Nagoya, Kiyosu Castle appears startlingly close to the line, its red-railed white keep coming into view. This was Oda Nobunaga's base and the castle from which he set out for the pivotal Battle of Okehazama. It is also where, after his death, the famous 1582 Kiyosu Conference decided his succession. The original was decommissioned in the early Edo period when its functions moved to Nagoya Castle; today's white-and-vermilion keep was rebuilt in 1989 as a modern reconstruction. Even so, this is arguably the closest the Shinkansen ever runs to a castle in Japan." },
    pageTitle: {
      ja: "新幹線から見える清洲城｜3秒で撮る「清洲城チャレンジ」 | 新幹線の窓",
      en: "Kiyosu Castle from the Shinkansen | Seat Side, Timing and Photo Tips",
    },
    pageHeading: {
      ja: "新幹線から見える清洲城——3秒の「清洲城チャレンジ」",
      en: "Kiyosu Castle from Seat E — a three-second window",
    },
    pageHeadingChunks: {
      ja: ["新幹線から見える清洲城——", "3秒の「清洲城チャレンジ」"],
      en: ["Kiyosu Castle from Seat E —", "a three-second window"],
    },
    metaDescription: {
      ja: "清洲城は新幹線から見えます。名古屋を出て数分、E席側のすぐ近くに白と朱の天守が現れ、見えるのは約3秒。走行中に撮る「清洲城チャレンジ」の狙い方を上り・下り別に、目印とタイミング、カメラ設定まで解説。織田信長の本拠・清洲会議の舞台としての歴史もまとめました。",
      en: "A few minutes out of Nagoya, the white-and-vermilion keep right beside the Shinkansen is Kiyosu Castle — in view for only about three seconds. Which seat to take, what to watch for in each direction, and how to photograph it from a moving train, plus its history as Oda Nobunaga's base and site of the 1582 Kiyosu Conference.",
    },
    sectionHeading: {
      ja: "清洲城はどんな城？",
      en: "What kind of castle is Kiyosu?",
    },
    pageStory: {
      ja: "清洲城は15世紀に尾張守護代の斯波氏の下で築かれ、戦国期には織田信長の本拠として大きく発展しました。信長はここから隣国駿河の今川義元を破った桶狭間の戦い（1560年）に出陣し、以降尾張を統一。清洲は東海道と美濃・伊勢を結ぶ交通の要衝でもあり、城下町として繁栄しました。信長が本能寺で倒れた1582年、羽柴（豊臣）秀吉・柴田勝家・丹羽長秀・池田恒興らが集まり、信長の後継と領地配分を決めた「清洲会議」が開かれたのもこの城です。日本史の分岐点となる会議の舞台として、名前を知る人は多いはずです。",
      en: "Kiyosu Castle was first built in the 15th century under the Shiba family, deputy governors of Owari Province, and grew dramatically as the base of Oda Nobunaga during the Sengoku era. From here Nobunaga set out to defeat the invading Imagawa Yoshimoto at the Battle of Okehazama in 1560, sealing his control of Owari. Kiyosu sat at a strategic crossroads between the Tokaido and routes to Mino and Ise provinces, and thrived as a castle town. After Nobunaga's assassination in 1582, the famous Kiyosu Conference — where Hashiba (Toyotomi) Hideyoshi, Shibata Katsuie, Niwa Nagahide and Ikeda Tsuneoki decided his succession and the division of his lands — was held at this castle, a well-known turning point in Japanese history.",
    },
    explainer: {
      heading: { ja: "今見える天守は、いつの建物？", en: "What is the keep you see today?" },
      ja: [
        "江戸時代初期の1610年、徳川家康の命で始まった「清洲越し」により、清洲の街と城の機能はまるごと新設の名古屋城下へ移されました。清洲城はこのとき廃城となり、以後、城郭建築は残っていません。現在、五条川のほとりに立つ白と朱の天守は、1989年（平成元年）に清須市が観光・地域振興のために建てた模擬天守です。史実の外観を復元したものではありませんが、鮮やかな色合いと立地の良さから、清須の新しいランドマークになっています。",
        "内部は歴史資料の展示や体験施設になっており、映像や模型で信長・秀吉・家康と清洲の関わりを学ぶことができます。天守と五条川、朱色の大手橋、周辺に整備された「清洲城信長公園」を含めた景観は、桜の季節を中心に地元でも人気です。",
        "新幹線からは、線路のすぐ北側に朱色の欄干と白い壁が突然あらわれるので、事前にE席側の窓を見ておくのがコツ。速度が出ているので数秒ですが、これだけ線路と接近して見える城は東海道新幹線でも珍しく、印象に残ります。",
      ],
      en: [
        "In 1610, under Tokugawa Ieyasu's orders, the so-called Kiyosu-goshi ('Kiyosu Move') relocated the entire town and castle functions of Kiyosu to the new Nagoya Castle town. Kiyosu Castle was decommissioned then, and no castle-era buildings survive. The white-and-vermilion keep you see today beside the Gojo River is a modern reconstruction, built by Kiyosu City in 1989 for tourism and civic revitalization. It is not a faithful restoration of the historical keep, but its vivid coloring and prominent site have made it a fresh local landmark.",
        "Inside, exhibits and interactive displays show how Nobunaga, Hideyoshi and Ieyasu were connected to Kiyosu. The keep, the river, the red Ote Bridge and the surrounding Kiyosu Castle Nobunaga Park form a scenic ensemble, especially popular in cherry-blossom season.",
        "From the train, the red railings and white walls of the keep flash into view just north of the tracks, so look toward the Seat E window in advance. At Shinkansen speed the view lasts only a few seconds — but few castles along the Tokaido line come this close to the rails, which is exactly what makes the moment memorable.",
      ],
    },
    guideHighlight: {
      ja: "名古屋と岐阜羽島のあいだ、線路のすぐ北側で朱色と白の建物を探してください。天守と五条川、朱塗りの大手橋がまとまって見えます。桜の季節や夕方は、川の流れと合わせて色鮮やかに映えます。夜はライトアップされ、暗闇に浮かぶ朱色が特に印象的です。",
      en: "Between Nagoya and Gifu-Hashima, look for a red-and-white structure just north of the tracks. The keep, the Gojo River and the vermilion Ote Bridge read as one composition. In cherry-blossom season or the evening, the vivid colors stand out against the river. At night the keep is illuminated, and the vermilion against the dark stands out especially well.",
    },
    photoTip: {
      heading: {
        ja: "「清洲城チャレンジ」——3秒で撮るには",
        en: "How to get the shot in three seconds",
      },
      ja: [
        "走行中の車内から清洲城を撮ることは「清洲城チャレンジ」と呼ばれ、何度も挑む人がいます。難しい理由ははっきりしていて、見えているのが約3秒しかないうえ、線路との距離が近いぶん流れが速く、気づいてから構えたのでは間に合わないからです。城が見えてからカメラを出すのではなく、見える前から構えて待つ——これが唯一のコツと言っていいくらいです。",
        "下り（東京 → 新大阪）は、名古屋を出たらすぐ北側の窓に構えてください。合図になるのがキリンビール名古屋工場で、銀色の巨大タンクがずらりと並ぶのが見えたら、その直後が清洲城です。名古屋発車からおよそ3分、タンク列が過ぎたら数を数えるくらいのつもりで待つと取りこぼしません。",
        "上り（新大阪 → 東京）は順番が逆で、清洲城のあとにキリン工場が来ます。手前の目印はソーラーアークで、そこから約4分。名古屋到着の車内アナウンスが流れる少し前が本番なので、アナウンスを合図にすると遅れます。減速が始まる前、まだ速度が乗っているうちに構えておいてください。",
        "設定は、シャッター速度を上げる（目安1/1000秒）か連写にしておくと、流れる景色でも天守を止めて写せます。ガラスの反射はレンズを窓に近づけるとかなり消えます。なお車内から窓越しに撮るぶんには問題ありませんが、デッキや通路で立ち止まっての撮影は他のお客さんの通行を妨げるので避けてください。",
      ],
      en: [
        "Getting a clean photo of Kiyosu Castle from a moving train is genuinely hard, and for a specific reason: it is in view for only about three seconds, and because it sits so close to the line it sweeps past fast. If you wait until you see it, you have already missed it. The one real trick is to be aimed and waiting before it appears. Japanese train fans attempt this often enough that they have a name for it — the \"Kiyosu Castle challenge\".",
        "Southbound (Tokyo → Shin-Osaka), get ready at the north-side window as soon as you leave Nagoya. Your cue is the Kirin Beer Nagoya Factory: once its row of giant silver tanks fills the window, Kiyosu Castle is next. It comes roughly three minutes after leaving Nagoya, so once the tanks have passed, hold your aim and count.",
        "Northbound (Shin-Osaka → Tokyo) the order reverses — the castle comes first, then the Kirin factory. Your earlier marker is the Solar Ark, about four minutes ahead. The castle arrives slightly before the Nagoya arrival announcement, so do not use the announcement as your cue or you will be late. Be ready while the train is still at speed, before it starts slowing.",
        "For settings, raise the shutter speed (around 1/1000s) or shoot a burst, and you can freeze the keep even at full speed. Pressing the lens close to the glass removes most of the reflections. Shooting through the window from your seat is fine, but please avoid standing in the vestibules or aisles to shoot, as it blocks other passengers.",
      ],
    },
    minutesFromTokyo: 99, side: "E", category: "notable", confidence: "verified", durationSec: 3, scene: "castle",
    image: "images/20240719_kiyosu_castle_asami_k920.jpg",
    photoCredit: { ja: "@asami_k920", en: "@asami_k920", url: "https://x.com/asami_k920/status/1814165589851795710" },
    photos: [
      {
        src: "images/20250309_kiyosu_castle_lightup_asami_k920.jpg",
        timeOfDay: "night",
        alt: { ja: "ライトアップされた清洲城", en: "Illuminated Kiyosu Castle" },
        credit: { ja: "@asami_k920", en: "@asami_k920" },
        sourceUrl: "https://x.com/asami_k920/status/1898673771084492889",
      },
      {
        src: "images/20260530_kiyosu_castle.jpg",
        alt: { ja: "新幹線のE席側から見える清洲城", en: "Kiyosu Castle from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
      },
      {
        src: "images/20260704_kiyosu_castle_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える清洲城と五条川周辺", en: "Kiyosu Castle and the Gojo River area from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-04",
        note: { ja: "名古屋を出てすぐ、線路近くに現れる白と朱の城", en: "A white-and-vermilion keep appearing close to the tracks just after Nagoya." },
      },
    ],
    references: [REFERENCES.kiyosuCastle, REFERENCES.kiyosuHistory, REFERENCES.kojodanWindowCastles],
    map: { lat: 35.2165750, lng: 136.8435972, ja: "清洲城", en: "Kiyosu Castle" },
    viewpoint: { lat: 35.215840, lng: 136.842626 },
  },
  {
    id: "solar-ark",
    icon: "☀️",
    ja: { name: "ソーラーアーク", area: "名古屋 → 岐阜羽島", hook: "もうすぐ見納め、太陽の船。", story: "名古屋を出て清洲城を過ぎ、岐阜羽島へ近づくころ、E席側の田園の上に、青くきらめく巨大な弧を描く構造物があらわれます。これがソーラーアーク。旧三洋電機（現・パナソニックホールディングス）が2001年に建設した太陽光発電モニュメントで、全長315m・最高部の高さ37m、約5,046枚の太陽電池パネルを外壁に張り巡らせた「新幹線から見える巨大な船」です。長らくPanasonicロゴを掲げていましたが、事業再編で外され、所有会社は2026年9月にも解体を始めると安八町へ伝えています。完了日は未発表ですが、四半世紀にわたって親しまれてきたこの車窓は、もうすぐ見られなくなる可能性があります。" },
    en: { name: "Solar Ark", area: "Nagoya → Gifu-Hashima", hook: "A solar ship, soon to disappear.", story: "After Nagoya and Kiyosu Castle, Solar Ark appears on the Seat E side as a huge, blue-glinting arch rising above the fields. Built in 2001 by the former Sanyo Electric (now part of Panasonic Holdings), it is a solar-power monument 315 meters long and up to 37 meters tall, its outer surface faced with roughly 5,046 photovoltaic panels — a 'giant ship you can see from the Shinkansen.' The Panasonic logo it once carried was removed after corporate restructuring, and the owner has told Anpachi Town that demolition could begin as early as September 2026. No completion date has been announced, but this quarter-century-old landmark may soon vanish from the window." },
    pageTitle: {
      ja: "新幹線から見えるソーラーアーク｜太陽電池パネルの巨大モニュメント | 新幹線の窓",
      en: "Solar Ark from the Shinkansen | The Giant Solar Monument in Anpachi",
    },
    pageHeading: {
      ja: "田園に浮かぶ、太陽電池の巨大船——ソーラーアーク",
      en: "A solar ship above the fields: Solar Ark",
    },
    pageHeadingChunks: {
      ja: ["田園に浮かぶ、太陽電池の巨大船——", "ソーラーアーク"],
      en: ["A solar ship above the fields:", "Solar Ark"],
    },
    metaDescription: {
      ja: "名古屋から岐阜羽島へ向かう新幹線のE席側に見える、全長315m・約5,000枚の太陽電池パネルを備えた巨大構造物「ソーラーアーク」。建設の背景、Panasonicロゴの経緯、解体予定までを解説します。",
      en: "Between Nagoya and Gifu-Hashima, the huge 315-meter solar monument with roughly 5,000 photovoltaic panels visible from Seat E is Solar Ark. Learn how it was built, its former Panasonic branding, and the demolition planned to begin as early as September 2026.",
    },
    sectionHeading: {
      ja: "ソーラーアークとは？",
      en: "What is Solar Ark?",
    },
    pageStory: {
      ja: "ソーラーアークは、岐阜県安八郡安八町の三洋電機（旧・岐阜工場）敷地内に、2001年12月に完成した太陽光発電モニュメントです。建設のきっかけは、三洋電機が2000年に販売していた住宅用太陽電池モジュールの一部で不具合が判明したこと。原因究明と再発防止に加え、太陽光発電への信頼回復の象徴として、当時の三洋電機が創立50周年記念事業と組み合わせて構想した、というのが公表されている経緯です。設計は谷口吉生建築設計研究所、施工は大林組。船底のようになだらかに反り上がる形状に約5,046枚の太陽電池パネルを組み込み、最大出力は約630kW、年間発電量は約53万kWh（一般家庭150世帯分程度）とされていました。",
      en: "Solar Ark stands on the grounds of Sanyo Electric's former Gifu plant in Anpachi Town, Gifu Prefecture, and was completed in December 2001. The project began after a defect was identified in some residential solar modules Sanyo had sold in 2000. As part of investigating the root cause and preventing recurrence — and rebuilding public trust in photovoltaics — Sanyo tied the effort to its 50th-anniversary commemoration, according to publicly announced background. The structure was designed by Yoshio Taniguchi and Associates and built by Obayashi Corporation. Its softly upswept ship-like form carries roughly 5,046 solar panels, with a rated peak output of about 630 kW and reported annual output of around 530,000 kWh (comparable to the electricity used by about 150 average households).",
    },
    explainer: {
      heading: { ja: "Panasonicロゴが消えた理由と、解体の話", en: "Why the Panasonic logo disappeared, and what happens next" },
      ja: [
        "2011年、三洋電機はパナソニックの完全子会社となり、その後太陽電池・二次電池事業の再編が進みました。ソーラーアークにも長らく大きな「Panasonic」ロゴが掲げられていましたが、事業体制の変化にともなって外され、いまはロゴのない状態で立っています。ページ内の掲載写真には、2017年撮影の「Panasonicロゴがあった頃」の姿も参考として残しています。",
        "所有会社は、老朽化と維持コストを理由に、安八町へソーラーアークの解体を伝えており、報道では2026年9月にも解体工事に着手する可能性があるとされています。ただし、正式な着工日・工期・跡地利用については本記事執筆時点で公式発表はありません。四半世紀にわたって東海道新幹線から見える名物景観だっただけに、地元・全国から惜しむ声が上がっています。",
        "見えるタイミングは、名古屋を出て清洲城を過ぎ、木曽三川の手前、岐阜羽島駅の少し手前くらいのE席側です。速度が出ているので数秒〜十数秒。晴天下では太陽電池パネルの青く光る反射がとても目立ち、遠くからでも「巨大な弧」の輪郭で見つけられます。",
      ],
      en: [
        "In 2011, Sanyo became a wholly owned subsidiary of Panasonic, and its solar and battery businesses were reorganized in the following years. Solar Ark carried a large 'Panasonic' logo for a long time, but as business structures shifted it was removed, and the monument now stands without branding. The photos on this page include a 2017 reference image from when the Panasonic logo was still in place.",
        "The current owner has informed Anpachi Town of plans to dismantle Solar Ark, citing aging infrastructure and maintenance costs. News reports have said demolition could start as early as September 2026, but as of writing, no official schedule, work period or post-demolition use has been announced. Given its 25-year run as a trackside icon of the Tokaido Shinkansen, many locals and long-time riders are already voicing regret.",
        "Timing-wise, Solar Ark appears on the Seat E side after passing Kiyosu Castle, a little before the Kiso Three Rivers and before Gifu-Hashima Station. At speed, it lasts only a few seconds to about ten. On sunny days, the blue glint of its panels stands out sharply, and the huge arched silhouette can be found even from a distance.",
      ],
    },
    guideHighlight: {
      ja: "清洲城を通り過ぎたら、E席側の田園の少し先を意識してください。地上から10m以上の位置に、青く光る細長い弧が突然現れます。晴れた日ほど太陽電池パネルの反射が強く、「見える限りの日数はもう限られているかもしれない」と思いながら眺めると、車窓が特別なものになります。",
      en: "Once you pass Kiyosu Castle, focus a little farther out on the Seat E side across the fields. A long blue-glinting arch appears more than 10 meters above the ground. Sunny days make the panel reflections especially sharp. Watching it while knowing 'the number of trips left to see this may be limited' turns the moment into something special.",
    },
    minutesFromTokyo: 103, side: "E", category: "notable", confidence: "verified", durationSec: 5, scene: "solar",
    image: "images/20251212_solar_ark_2_letus10.jpg",
    photoCredit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog", url: "https://cotetu.seesaa.net/article/519526266.html" },
    photos: [
      {
        src: "images/20251212_solar_ark_1_letus10.jpg",
        alt: { ja: "新幹線のE席側から見えるソーラーアーク", en: "Solar Ark from Seat E" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/519526266.html",
      },
      {
        src: "images/201707_solar_ark_letus10.jpg",
        alt: { ja: "Panasonicロゴが残っていた頃のソーラーアーク", en: "Solar Ark when the Panasonic logo was still visible" },
        note: { ja: "2017年7月に撮影。Panasonicロゴがあったころの写真", en: "Photographed in July 2017, when the Panasonic logo was still visible" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/519526266.html",
      },
      {
        src: "images/20260530_solar_ark.jpg",
        alt: { ja: "新幹線のE席側から見えるソーラーアーク", en: "Solar Ark from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
      },
    ],
    references: [REFERENCES.solarArkDemolitionNews, REFERENCES.solarArkWikipedia, REFERENCES.anpachiTownSolarArk, REFERENCES.solarArkBlog],
    map: { lat: 35.331049924069006, lng: 136.6713226517134, ja: "ソーラーアーク", en: "Solar Ark" },
    viewpoint: { lat: 35.330830, lng: 136.668781 },
  },
  {
    id: "gifu-castle",
    icon: "🏯",
    ja: { name: "岐阜城", area: "岐阜羽島 → 米原", hook: "山の上に、小さな城。", story: "岐阜羽島を過ぎ、木曽三川を渡る前後で、E席側の遠くに金華山（標高329m）が見えることがあります。その山頂に立つのが岐阜城。かつて斎藤道三が居城とし、のちに織田信長がこの城を落として「岐阜」と改名、「天下布武」の朱印を用い始めた地です。線路からは10km以上離れているため、山頂の小さな天守を車窓で見つけるには晴れた日と少しの集中力が必要。写真では橋の向こう、金華山の頂に小さく見える白い点を探してください。" },
    en: { name: "Gifu Castle", area: "Gifu-Hashima → Maibara", hook: "A tiny castle on a mountain.", story: "After Gifu-Hashima, around the Kiso Three Rivers, Mt. Kinka (329 m) may be visible far away on the Seat E side. Gifu Castle sits on its summit. This was once the mountaintop stronghold of Saito Dosan, later captured by Oda Nobunaga — who renamed the town Gifu and began using his famous 'Tenka Fubu' seal from here. The castle lies more than 10 km from the Shinkansen line, so spotting the tiny keep takes a clear day and a focused eye. In the Shinkansen photo, look beyond the bridge for the tiny white dot on top of Mt. Kinka." },
    pageTitle: {
      ja: "新幹線から見える岐阜城｜金華山の山頂に立つ信長ゆかりの城 | 新幹線の窓",
      en: "Gifu Castle from the Shinkansen | Nobunaga's Mountaintop Fortress on Mt. Kinka",
    },
    pageHeading: {
      ja: "遠くの山頂に、岐阜城——信長が「天下布武」を掲げた城",
      en: "Gifu Castle on Mt. Kinka: where Nobunaga raised 'Tenka Fubu'",
    },
    pageHeadingChunks: {
      ja: ["遠くの山頂に、岐阜城——", "信長が「天下布武」を掲げた城"],
      en: ["Gifu Castle on Mt. Kinka:", "where Nobunaga raised 'Tenka Fubu'"],
    },
    metaDescription: {
      ja: "岐阜羽島から米原へ向かう区間で、遠くのE席側に見える金華山山頂の小さな天守が岐阜城。斎藤道三、織田信長、天下布武の背景を、車窓での見つけ方と合わせて紹介します。",
      en: "Between Gifu-Hashima and Maibara, a tiny keep atop distant Mt. Kinka on the Seat E side is Gifu Castle. Learn about Saito Dosan, Oda Nobunaga, and the 'Tenka Fubu' seal — and how to find the castle from the Shinkansen window.",
    },
    sectionHeading: {
      ja: "岐阜城とは？なぜ有名？",
      en: "What is Gifu Castle and why is it famous?",
    },
    pageStory: {
      ja: "岐阜城は、長良川のほとりにそびえる金華山（旧名・稲葉山）の山頂に立つ山城です。鎌倉時代の砦を起源とし、戦国期には「美濃の蝮」と恐れられた斎藤道三が本拠として整えました。1567年、隣国尾張の織田信長がこの稲葉山城を攻略。地名を「岐阜」と改め、この城を新たな本拠として天下統一への足場としました。信長がこの時期から用い始めた「天下布武（てんかふぶ）」の朱印は、日本史のターニングポイントの象徴として広く知られています。江戸初期に廃城となりましたが、金華山と岐阜城のシルエットは、いまも岐阜市街のランドマークです。",
      en: "Gifu Castle stands on the summit of Mt. Kinka (formerly Mt. Inaba), rising sharply beside the Nagara River. Its origins trace back to a Kamakura-era fortress; in the Sengoku era Saito Dosan, feared as the 'Viper of Mino,' developed it into his main stronghold. In 1567, Oda Nobunaga of neighboring Owari captured Inabayama Castle, renamed the town 'Gifu' and made this his base for national unification. The 'Tenka Fubu' (rule the realm through military force) seal he began using around this time is one of Japanese history's most iconic emblems. Though the castle was decommissioned in the early Edo period, the silhouette of Mt. Kinka and its hilltop keep remains a landmark of the modern city.",
    },
    explainer: {
      heading: { ja: "今見える天守と、車窓での探し方", en: "The keep you see today, and how to find it" },
      ja: [
        "現在の天守は1956年（昭和31年）に鉄筋コンクリートで再建された模擬天守で、内部は資料館・展望台になっています。史実の外観そのままではありませんが、金華山山頂の位置に立つ姿は「岐阜城といえばこれ」というイメージを長く担ってきました。麓の岐阜公園から山頂まではロープウェイで結ばれ、天守からは濃尾平野・木曽三川・伊吹山まで一望できます。",
        "新幹線車窓では、岐阜羽島を出て木曽三川（木曽川・長良川・揖斐川）を渡る前後、E席側の北の方角に金華山を探すことになります。山頂に立つ天守は非常に小さく見え、周囲の建物や霞、季節の空気に埋もれやすいので、まずは「三角形に近い低い山」を見つけ、その頂に小さな白い点を探すつもりで眺めるのがコツです。曇りや黄砂・霞がある日は、山そのものはうっすら見えても天守までは判別できないことが多いです。",
        "本来は東海道本線側や、名鉄各務原線側から近く見えます。ページ内には、参考としてJR在来線側から大きく捉えた写真も添えています。新幹線からはそれよりずっと小さく、橋や市街地の向こうに見える点のような天守を探す感覚です。実際に「大きく見える岐阜城」を楽しみたい場合は、乗り継ぎで訪れる価値がある城です。",
      ],
      en: [
        "The keep you see today was rebuilt in 1956 in reinforced concrete as a modern reconstruction, housing a small museum and observation deck. It is not a faithful restoration, but its position on Mt. Kinka has long defined the popular image of Gifu Castle. A ropeway from Gifu Park at the foot of the mountain runs to the summit, from which the Nobi Plain, the Kiso Three Rivers and even Mt. Ibuki come into view.",
        "From the Shinkansen, after Gifu-Hashima and around the crossing of the Kiso Three Rivers (Kiso, Nagara and Ibi), look northward from the Seat E side for Mt. Kinka. The hilltop keep appears very small and blends easily into buildings, haze, or seasonal air. Look first for a low, near-triangular mountain, then a small white dot at its top. On cloudy, hazy or yellow-dust days, even a visible mountain may not reveal the keep itself.",
        "The castle is much more prominent from the Tokaido Main Line, other JR conventional lines, and the Meitetsu Kakamigahara Line. This page also includes a reference photo from those closer directions. From the Shinkansen it is much smaller: look for a dot-like keep beyond the bridge and the city. If you want to see Gifu Castle up close, it is well worth a connecting trip.",
      ],
    },
    guideHighlight: {
      ja: "木曽三川を渡るあたりで、E席側の北にある一番目立つ低い山を探してください。三角に近いシルエットの頂に、白い点のような天守が見えたらそれが岐阜城です。晴天・冬から早春・朝の時間帯が特に見つけやすくなります。",
      en: "Around the Kiso Three Rivers crossing, look northward on the Seat E side for the most prominent low mountain. If you can pick out a white dot at the top of its near-triangular silhouette, that is Gifu Castle. Clear days, winter to early spring, and morning light give the best chance.",
    },
    minutesFromTokyo: 106, side: "E", category: "curious", confidence: "source-backed", durationSec: 8, scene: "castle",
    image: "images/20260712_gifu_castle_michikusa.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-07-12", note: { ja: "橋の向こう、金華山の上に小さく写る岐阜城", en: "Gifu Castle appears as a tiny speck on Mt. Kinka beyond the bridge." } },
    photos: [
      {
        src: "images/20170307_gifu_castle_zusshi.jpg",
        alt: { ja: "新幹線から遠くに見える岐阜城", en: "Gifu Castle seen in the distance from the Shinkansen" },
        credit: { ja: "ずっしー。氏", en: "Zusshi" },
        sourceUrl: "https://ameblo.jp/ginga03142008/entry-12251601639.html",
        date: "2017-03-07",
        note: { ja: "晴れた日の新幹線車窓。山頂の小さな天守を探す写真", en: "A clear-day Shinkansen view; look for the tiny keep on the summit." },
      },
      {
        src: "images/20250927_gifu_castle_letus10.jpg",
        role: "reference",
        heading: { ja: "参考: 在来線側から近く見る岐阜城", en: "Reference: Gifu Castle from a closer conventional-line view" },
        intro: {
          ja: "岐阜城は新幹線からはかなり遠く、小さな点のように見えます。下の写真は参考として、JR在来線側から近く見たときの岐阜城です。新幹線車窓で探す対象がどの山・どの建物かを確かめるために添えています。",
          en: "Gifu Castle is very far from the Shinkansen and appears only as a small speck. The photo below is a closer reference view from a JR conventional-line direction, included to show which mountain and keep you are trying to identify.",
        },
        alt: { ja: "在来線側から近く見た岐阜城", en: "Gifu Castle seen closer from a conventional-line direction" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/518296647.html",
        caption: { ja: "新幹線車窓写真ではなく、場所の理解を助けるための参考写真です。", en: "This is a reference image for orientation, not a Shinkansen-window photo." },
      },
      {
        src: "images/20250927_gifu_castle_2_letus10.jpg",
        role: "reference",
        alt: { ja: "JR在来線側から見た岐阜城", en: "Gifu Castle seen from a JR conventional-line direction" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/518296647.html",
      },
    ],
    references: [REFERENCES.gifuCastleOfficial, REFERENCES.zusshiCastleBlog, REFERENCES.gifuCastleBlog],
    map: { lat: 35.4339, lng: 136.7824, ja: "岐阜城 金華山", en: "Gifu Castle Mt. Kinka" },
    viewpoint: { lat: 35.29951585953575, lng: 136.71466236318534 },
  },
  {
    id: "kinshozan",
    icon: "⛏️",
    ja: { name: "金生山", area: "岐阜羽島 → 米原（大垣付近）", hook: "あの切り取られた山は何？", story: "岐阜羽島を過ぎて大垣へ向かうころ、E席側の遠くに、まるでナイフで斜めに切り落としたような山肌がむき出しになった山が見えます。これが金生山（きんしょうざん）。全体が石灰岩でできていて、明治以降140年以上にわたって採掘され続けてきた山です。かつては「岐阜のピラミッド」と呼ばれた四角錐の山頂が新幹線からも見えましたが、その頂は今はもうありません。白い階段状の岩肌がむき出しになり、初めて見る人ほど「あの山は何？」と気になる、独特の景観になっています。" },
    en: { name: "Mt. Kinsho", area: "Gifu-Hashima → Maibara, near Ogaki", hook: "What is that carved-away mountain?", story: "After Gifu-Hashima, on the way to Ogaki, a mountain that looks as if it has been sliced diagonally with a knife appears far off on the Seat E side. This is Mt. Kinsho, a mountain made almost entirely of limestone that has been quarried for over 140 years. Its former square-pyramid peak — once famously nicknamed the 'Gifu Pyramid' from the train window — is no longer there. What remains is a stepped, chalk-white rock face, an unusual sight that often leaves first-time viewers wondering: what am I looking at?" },
    pageTitle: {
      ja: "新幹線から見える「削られた山」は何？大垣・金生山の正体 | 新幹線の窓",
      en: "What Is That Quarried White Mountain near Ogaki? Mt. Kinsho | Shinkansen Window",
    },
    pageHeading: {
      ja: "白く削られたあの山は何？——大垣の金生山",
      en: "What is that pale, carved-away mountain? Mt. Kinsho at Ogaki",
    },
    pageHeadingChunks: {
      ja: ["白く削られたあの山は何？——", "大垣の金生山"],
      en: ["What is that pale, carved-away mountain?", "Mt. Kinsho at Ogaki"],
    },
    metaDescription: {
      ja: "岐阜羽島から米原へ向かう区間、大垣付近で新幹線のE席側に見える白く削り取られた山は金生山。石灰岩の採掘で「岐阜のピラミッド」の頂が失われた背景と、その独特の景観を解説します。",
      en: "The bright, quarried mountain seen from Seat E after Gifu-Hashima near Ogaki is Mt. Kinsho, a limestone mountain whose 'Gifu Pyramid' peak has been mined away over more than 140 years. Learn what it is and why it looks the way it does today.",
    },
    sectionHeading: {
      ja: "あの切り取られた白い山は何？",
      en: "What is that pale, carved-away mountain?",
    },
    pageStory: {
      ja: "初めて新幹線の車窓から金生山を見ると、多くの人が「あの山、山頂が階段状にえぐれてる。何？」と感じます。それはあなただけの感想ではなく、この山を写した写真がSNSでも「なんだこの山」「削られすぎ」と繰り返し話題になっています。名前の「金生山」を知って調べる人よりも、白く削られた奇妙な山肌を見て後から正体を探す人のほうが多いかもしれません。答えは、大垣市赤坂町にある標高217mほどの石灰岩の山で、日本でも屈指の高純度石灰岩と大理石を産出する鉱山として、明治期から現代まで採掘が続いてきた場所です。",
      en: "First-time riders often react to Mt. Kinsho with a simple question: 'That mountain — its summit is scooped out in steps. What is it?' You are not alone in that reaction; photos of this hill regularly circulate online with reactions like 'what is that mountain' or 'quarried too much.' More people probably arrive at the name by searching for 'strange white mountain visible from the Shinkansen' than by knowing the name Mt. Kinsho in advance. The answer: a limestone hill about 217 meters high in Akasaka, Ogaki City — one of Japan's foremost sources of high-purity limestone and marble, quarried continuously from the Meiji era to today.",
    },
    explainer: {
      heading: { ja: "「岐阜のピラミッド」はどこへ？", en: "Where did the 'Gifu Pyramid' go?" },
      ja: [
        "金生山はもともと美しいピラミッド型の山頂を持ち、地元では「岐阜のピラミッド」の愛称で知られていました。四角錐に近い整った稜線が新幹線の車窓からもよく目立っていた、と昔の写真は伝えます。しかし主成分の石灰岩と大理石は、セメント・製鉄用のフラックス・化学工業向けの原料として国内でも極めて重要で、明治から一貫して山頂側から切り崩して採掘が続けられてきました。その結果、頂そのものはすでに大きく失われ、今は残された部分に階段状の採掘跡（ベンチカット）と、白い岩肌がむき出しになった側面が目立つ姿になっています。",
        "地質的にはさらに古い物語も抱えています。金生山の石灰岩層は約2億6千万年前のペルム紀の海で堆積したもので、ウミユリ・フズリナ・大型の巻貝など海の生き物の化石が豊富に含まれます。大垣市赤坂町には、これらの化石を集めた「金生山化石館」があり、削られていく山が同時に「化石の宝庫」でもあることを伝えています。",
        "つまり金生山は、単に「削られている山」ではなく、日本の産業を支え続けている石灰岩鉱山であり、太古の海を今に伝える化石の山でもあります。車窓の白い岩肌の向こうには、これから先も景観が少しずつ変わっていくという、進行中の物語が広がっています。",
      ],
      en: [
        "Mt. Kinsho once had a beautifully symmetrical, pyramid-like peak, affectionately known locally as the 'Gifu Pyramid.' Older photographs show a clean square-pyramid outline that stood out clearly even from the Shinkansen. But its limestone and marble are essential raw materials for cement, ironmaking flux and chemicals, and the mountain has been quarried from the top down ever since the Meiji era. As a result, the original peak has largely been removed. What remains are stepped quarry benches and broad white rock faces exposed along the sides.",
        "Geologically, there is a much older story too. The limestone layers of Mt. Kinsho were laid down in a shallow sea about 260 million years ago in the Permian period, and are rich in fossils of crinoids, fusulinids and large sea snails. In Akasaka, Ogaki, the Kinshozan Fossil Museum displays these fossils, reminding visitors that a mountain being quarried away is also a treasure house of ancient life.",
        "So Mt. Kinsho is not just a 'quarried mountain.' It is an active limestone mine that continues to underpin Japanese industry, and simultaneously a witness to a Permian-era sea. Behind the white rock face beyond the window is an ongoing story: the landscape here will keep changing over time.",
      ],
    },
    guideHighlight: {
      ja: "大垣付近を通るあたりで、E席側の遠くに「山頂だけ白く階段状に削られた低い山」を探してください。周囲の山と違って明らかに人の手が入った形なので、一度覚えると次からすぐ見つけられます。頂が消えていく途中の景色を見ている、という視点で眺めると印象がまた変わります。",
      en: "Around Ogaki, look far off on the Seat E side for a 'low mountain with its top scooped away in bright, stepped layers.' Its clearly man-shaped profile makes it easy to recognize once you know what to look for. Watching it as a mountain still in the process of being reshaped changes how the view lands.",
    },
    minutesFromTokyo: 106, side: "E", category: "notable", confidence: "verified", durationSec: 15, scene: "mountain",
    image: "images/20260704_kinshozan_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-07-04",
      note: { ja: "のぞみ27号、東京11:12発、13:00撮影", en: "Nozomi 27, departed Tokyo at 11:12, photographed at 13:00." },
    },
    photos: [
      {
        src: "images/20260712_kinshozan_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える金生山の白い採掘面", en: "The pale quarried face of Mt. Kinsho from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "遠景でも白く削られた山肌が目印", en: "Even from a distance, the pale quarried slope is the marker." },
      },
    ],
    references: [REFERENCES.kinshozanWiki, REFERENCES.ogakiKinshozan, REFERENCES.ogakiKinshozanFossil],
    map: { lat: 35.405612, lng: 136.57348, ja: "金生山 大垣", en: "Mt. Kinsho Ogaki" },
    viewpoint: { lat: 35.349235976987565, lng: 136.57673468445847 },
  },
  {
    id: "ibuki",
    icon: "⛰️",
    ja: { name: "伊吹山", area: "岐阜羽島 → 米原", hook: "関ヶ原の空に、雪を戴く名峰。", story: "米原の手前、関ヶ原を抜けたあたりのE席側に、どっしりと横たわる伊吹山（標高1,377m）が現れます。滋賀県と岐阜県の県境にそびえる独立峰で、古事記・日本書紀ではヤマトタケルが荒ぶる神と戦い、命を落とすきっかけとなった山として登場する、日本屈指の由緒ある名山です。冬は日本海側から吹き込む雪雲を受け止め、日本一の積雪記録（11.82m）を持つ豪雪の山でもあります。真冬の白く輝く姿から、春の雪解けで山肌の縞模様が現れる季節、夏の緑、秋の枯れ色まで、季節ごとに大きく表情が変わります。" },
    en: { name: "Mt. Ibuki", area: "Gifu-Hashima → Maibara", hook: "Snow-crowned peak of Sekigahara.", story: "Before Maibara, just past Sekigahara — the plain where the decisive 1600 battle that opened the Tokugawa shogunate was fought — Mt. Ibuki rises massive and low on the Seat E side. This 1,377-meter independent peak on the border of Shiga and Gifu Prefectures is one of Japan's oldest storied mountains: in the Kojiki and Nihon Shoki it appears as the mountain whose enraged deity ultimately caused the death of the legendary prince Yamato Takeru. In winter it catches snow clouds pouring in from the Sea of Japan and still holds Japan's official record for the deepest snowfall ever measured (11.82 m). Its face changes dramatically with the seasons — from the pure white of midwinter, to the striped bare slopes emerging with the spring thaw, to summer's deep green and autumn's russet." },
    pageTitle: {
      ja: "新幹線から見える伊吹山｜関ヶ原にそびえる雪の名峰 | 新幹線の窓",
      en: "Mt. Ibuki from the Shinkansen | The Snow Mountain above Sekigahara",
    },
    pageHeading: {
      ja: "関ヶ原の車窓を支配する、伊吹山",
      en: "Mt. Ibuki: the mountain that dominates the Sekigahara window",
    },
    pageHeadingChunks: {
      ja: ["関ヶ原の車窓を支配する、", "伊吹山"],
      en: ["Mt. Ibuki: the mountain that dominates", "the Sekigahara window"],
    },
    metaDescription: {
      ja: "岐阜羽島から米原へ向かうE席側、関ヶ原を抜けたあたりで大きく見える独立峰が伊吹山（1,377m）。日本武尊の伝説、日本一の積雪記録、季節ごとの表情の変化を、車窓での楽しみ方と合わせて紹介します。",
      en: "Between Gifu-Hashima and Maibara, the low massive mountain filling the Seat E window after Sekigahara is 1,377-meter Mt. Ibuki. Learn about its Yamato Takeru legend, Japan's record-deep snowfall here, and how its face changes through the seasons — with tips for spotting it from the Shinkansen.",
    },
    sectionHeading: {
      ja: "伊吹山とはどんな山？",
      en: "What kind of mountain is Mt. Ibuki?",
    },
    pageStory: {
      ja: "伊吹山は滋賀県米原市と岐阜県関ケ原町・揖斐川町にまたがる標高1,377mの独立峰で、伊吹山地の最高峰です。周囲に大きな山がなく、ほぼ単独で盛り上がる形をしているため、新幹線の車窓では実際の高さ以上に「どっしりとした主役」に見えます。地質は主に石灰岩で、山の西側は現在も採掘が行われている一方、山頂部には特殊な高山植物群落が広がり、深田久弥の日本百名山にも選ばれています。日本武尊（ヤマトタケル）が伊吹山の荒ぶる神と戦ったという記紀神話の舞台としても知られ、山頂には日本武尊像が立っています。",
      en: "Mt. Ibuki is a 1,377-meter independent peak straddling the border of Maibara (Shiga) and Sekigahara / Ibigawa (Gifu), the highest point of the Ibuki mountain range. With no other large peaks around it, the mountain rises almost alone from the plain, which is exactly why it looks so commanding from the Shinkansen window — larger in presence than in raw elevation. It is primarily limestone; the western flank is still being quarried, while the summit hosts a unique alpine plant community and is listed as one of Fukada Kyuya's '100 Famous Mountains of Japan.' The Kojiki and Nihon Shoki record it as the mountain where the legendary prince Yamato Takeru fought the local deity, and a statue of Yamato Takeru stands on the summit today. The narrow Sekigahara corridor at its foot is also the site of the Battle of Sekigahara, fought on 21 October 1600: Tokugawa Ieyasu's eastern coalition defeated Ishida Mitsunari's western forces here in a single day, effectively deciding the political order of Japan for the next 260 years of the Edo period.",
    },
    explainer: {
      heading: { ja: "季節でこんなに変わる、伊吹山の表情", en: "How Mt. Ibuki's face changes with the seasons" },
      ja: [
        "冬の伊吹山は、日本海側から流れ込む雪雲を全身で受け止め、山頂から中腹まで真っ白な雪化粧に変わります。1927年2月14日には11.82mの積雪が観測され、これは今も気象庁が公式に認める世界最深の記録です。もっとも寒い時期は青空を背に真っ白な稜線が浮かび、車窓に長い時間主役として居座ります。",
        "春先の伊吹山は、少し季節が進んだ時期に見ると独特の表情になります。上部の雪と、南向き斜面から溶けていく岩肌が縞模様のように交互に並び、白と灰褐色のツートンカラーが山肌全体に広がるのです。「白いだけ」「緑一色」ではない、この途中の姿は、意外と車窓で心に残る季節です。",
        "夏はスキー場跡地を含む中腹まで深い緑に覆われ、山頂周辺は貴重な高山植物が咲きます。秋は落葉樹と草原がやや赤茶けた色に変わり、輪郭がくっきりと締まって見えます。同じ山なのに、乗る季節によってこれほど印象の変わる車窓は東海道新幹線でも少数派です。",
        "西側斜面には、大手セメント会社の石灰岩採掘場が広く広がっています。近距離で見ると採掘のスケールが目を引きますが、車窓の距離では山の全体像のほうが強く印象に残ります。「使われながら守られている山」という側面を頭に入れておくと、車窓の意味が少し深まります。",
      ],
      en: [
        "In winter, Mt. Ibuki absorbs the full force of snow clouds streaming in from the Sea of Japan; its ridge and much of its middle slopes turn brilliant white. On February 14, 1927, an 11.82-meter snow depth was measured here — still officially recognized as the world's deepest snow record. In midwinter the pale ridge against a blue sky can dominate the window for a long stretch.",
        "In early spring, the mountain wears a distinctive in-between look. Snow lingers up high while the sun-facing slopes melt out first, producing alternating stripes of white and pale gray-brown across the flanks. Neither purely white nor fully green, this transitional face is quietly memorable from the train.",
        "Summer covers the middle slopes (including former ski runs) in deep green, and rare alpine plants bloom near the summit. In autumn, deciduous woods and grasslands shift to a russet, giving the mountain sharper edges. Few mountains along the Tokaido Shinkansen change this dramatically from season to season.",
        "The western slopes hold large active limestone quarries operated by a major cement company. Up close, the scale of the workings is striking; from the train, however, it is the mountain's whole silhouette that stays with you. Keeping in mind that this is a mountain both used and protected adds another layer to the view.",
      ],
    },
    guideHighlight: {
      ja: "関ヶ原を抜けたあたりから、E席側で「他の山より一段大きく、単独でどっしりしている山」を探してください。冬なら真っ白、春なら雪と岩肌の縞模様、夏は深い緑、秋は赤茶色——今日の伊吹山はどの姿か、を意識しながら眺めると印象に残ります。伊吹山が見えている間はしばらく車窓の主役なので、少し長めに視線を預けても大丈夫です。",
      en: "After passing through Sekigahara, look toward Seat E for the mountain that stands 'one size larger and clearly alone' from its neighbors. Winter brings pure white; early spring, stripes of lingering snow over pale rock; summer, deep green; autumn, russet. Deciding which Mt. Ibuki you are seeing today makes the view stick. It stays with the train for a good while, so it is fine to let your eyes rest on it.",
    },
    minutesFromTokyo: 110, side: "E", category: "classic", confidence: "verified", durationSec: 30, scene: "mountain",
    image: "images/20240114_ibukiyama.png",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2024-01-14", note: { ja: "真冬の雪化粧の伊吹山", en: "Mt. Ibuki fully cloaked in midwinter snow." } },
    photos: [
      {
        src: "images/20260530_ibukiyama.jpg",
        alt: { ja: "雪解け後、深い緑に覆われた初夏の伊吹山", en: "Mt. Ibuki in early summer, covered in fresh green after the snow has melted" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
        note: { ja: "雪のない季節は、なだらかな稜線と緑の斜面が主役", en: "In snowless months, the gentle ridge line and green slopes take center stage." },
      },
      {
        src: "images/20260530_ibukiyama_2_michikusa.jpg",
        alt: { ja: "初夏、関ヶ原の街並み越しに横たわる伊吹山", en: "Mt. Ibuki lying beyond the town of Sekigahara in early summer" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
        note: { ja: "田園と街並みの向こうに、単独で盛り上がる姿", en: "The peak rises alone beyond the fields and the town." },
      },
    ],
    references: [REFERENCES.ibuki, REFERENCES.ibukiMaibara, REFERENCES.ibukiKojiki],
    map: { lat: 35.41778, lng: 136.40611, ja: "伊吹山", en: "Mt. Ibuki" },
    viewpoint: { lat: 35.361280, lng: 136.411719 },
  },
  {
    id: "nangu-taisha",
    icon: "⛩️",
    ja: { name: "南宮大社の大鳥居", area: "岐阜羽島 → 米原", hook: "田園の向こうに、朱の大鳥居。", story: "岐阜羽島を出て関ヶ原へ向かう途中、A席側の田園の向こうに、突然大きな朱色の鳥居が姿を現します。これは南宮大社の大鳥居。石造りとしては国内でも屈指の大きさで、高さは21mを超え、道路をまたぐようにそびえています。実物の下に立つと、その巨大さに車から降りて見上げたくなるほど。車窓では一瞬ですが、周りの田園の低い景色との対比で、一度見たら忘れられない鳥居です。" },
    en: { name: "Nangu Taisha Grand Torii", area: "Gifu-Hashima → Maibara", hook: "A giant red torii in the fields.", story: "Between Gifu-Hashima and Sekigahara, a large vermilion torii suddenly rises beyond the fields on the Seat A side. This is the Grand Torii of Nangu Taisha, one of the largest stone torii gates in Japan — over 21 meters tall and striding across the road below. Seen up close, its scale makes you want to stop and look up. From the train it is only a flash, but framed against the low farmland, it is a torii you do not easily forget." },
    pageTitle: {
      ja: "新幹線から見える朱の大鳥居は何？南宮大社（美濃国一の宮） | 新幹線の窓",
      en: "What Is That Giant Red Torii from the Shinkansen? Nangu Taisha | Shinkansen Window",
    },
    pageHeading: {
      ja: "田園の向こうにそびえる、南宮大社の大鳥居",
      en: "Nangu Taisha's Grand Torii rising beyond the fields",
    },
    pageHeadingChunks: {
      ja: ["田園の向こうにそびえる、", "南宮大社の大鳥居"],
      en: ["Nangu Taisha's Grand Torii", "rising beyond the fields"],
    },
    metaDescription: {
      ja: "岐阜羽島〜米原の車窓、A席側の田園の向こうに一瞬現れる巨大な朱の鳥居は南宮大社の大鳥居です。美濃国一の宮としての由緒、鳥居の大きさ、金山彦大神と鉄・金属信仰までまとめて紹介します。",
      en: "Between Gifu-Hashima and Maibara, the giant vermilion torii that flashes beyond the fields on the Seat A side belongs to Nangu Taisha, the principal shrine of Mino Province. Learn its history, the scale of the torii, and its ties to Kanayamahiko, deity of mining and metalwork.",
    },
    sectionHeading: {
      ja: "南宮大社ってどんな神社？",
      en: "What is Nangu Taisha?",
    },
    pageStory: {
      ja: "南宮大社（なんぐうたいしゃ）は、岐阜県不破郡垂井町に鎮座する古社で、旧美濃国の一の宮です。ご祭神は金山彦命（かなやまひこのみこと）。日本神話ではイザナミの傷から生まれた神とされ、鉱山・鍛冶・金属加工を司る神として、古くから鉄鋼・金属関係者の信仰を集めてきました。全国に3,000社以上あるとも言われる鉱山・金属関連の神社の総本社的存在で、現在も金属工業関連の企業や職人からの崇敬を集めています。関ヶ原の戦い（1600年）で社殿の多くが焼失した後、江戸幕府三代将軍・徳川家光の寄進によって再建された朱塗の本殿・拝殿・楼門などは、国の重要文化財に指定されています。",
      en: "Nangu Taisha, in Tarui Town at the western edge of the Nobi Plain, is an ancient shrine and the ichinomiya (principal shrine) of the former Mino Province. Its enshrined deity, Kanayamahiko-no-Mikoto, is a god of mining, blacksmithing and metalworking, and is said in myth to have been born from the wounds of Izanami. Nangu Taisha is regarded as a kind of head shrine for the thousands of mining and metal-related shrines across Japan, and continues to be revered by metal-industry firms and craftspeople. After the shrine buildings largely burned in the Battle of Sekigahara in 1600, the third Tokugawa shogun Iemitsu funded a full reconstruction; today the vermilion main sanctuary, worship hall and tower gate are Nationally Designated Important Cultural Properties.",
    },
    explainer: {
      heading: { ja: "あの大鳥居は、実はどれくらい大きい？", en: "How big is that torii, really?" },
      ja: [
        "新幹線から見える朱の鳥居は、南宮大社の一の鳥居（大鳥居）で、県道を跨ぐ形で立っています。石造・鉄骨造の大鳥居としては国内屈指の高さで、地元資料では高さ約21m、幅約28mと紹介されます。周辺は田園と低い住宅が広がる場所なので、実際の大きさ以上に「ぽつんと現れる巨大な赤」の印象が強く残ります。",
        "この鳥居から本殿までは約1km。車窓から社殿そのものは見えませんが、大鳥居は本殿へ続く参道の入口を告げるシンボルとして機能しています。周辺には旧中山道の垂井宿があり、江戸時代の街道と、金山彦を祀る美濃国一の宮が並び立つ場所として整えられてきました。",
        "参拝すると、朱の楼門、山を背にした社殿、金属関係の奉納品、そして境内の金山神社（金物職人の信仰）など、金属をキーワードにした独自の空気を感じられます。新幹線から鳥居しか見えないのが少しもったいないくらいの神社です。",
      ],
      en: [
        "The vermilion gate you see from the train is Nangu Taisha's first torii — the Grand Torii — straddling a prefectural road. As a large-scale stone-and-steel torii, it is among the tallest in Japan; local sources give it as roughly 21 meters tall and 28 meters wide. Surrounded by low farmland and modest housing, it stands out even more than its size suggests: a sudden, isolated block of red.",
        "The main sanctuary lies about a kilometer beyond the torii, out of sight from the train. Even so, the Grand Torii clearly marks the entrance to the approach that leads there. Nearby is Tarui-juku, one of the old post-towns on the Nakasendo highway; the shrine and the old road grew up together as a hub of religious life in Mino Province.",
        "If you visit in person, you notice a distinct 'metal' theme — the vermilion tower gate, the sanctuary set against a wooded slope, votive offerings from metal-related companies, and a small Kaneyama subshrine dedicated to metal craftspeople. Seeing only the torii from the Shinkansen leaves quite a lot unseen.",
      ],
    },
    guideHighlight: {
      ja: "岐阜羽島を出て関ヶ原方向へ進む区間、A席側の田園の向こうを注意してみてください。真っ赤な柱が田畑の背後にぬっと立ち上がる瞬間があります。周りの低い景色との対比で見つけやすく、「あれ、大きい鳥居あった！」と驚く人が多いスポットです。",
      en: "Between Gifu-Hashima and Sekigahara, watch across the farmland on the Seat A side. At one point, a tall red column rises abruptly out of the fields. Its contrast with the low surroundings makes it easy to spot — and a common 'wait, that torii was huge!' moment for first-time riders.",
    },
    minutesFromTokyo: 107, side: "A", category: "curious", confidence: "verified", durationSec: 2, scene: "pagoda",
    routeNote: {
      ja: "東京から新大阪方面なら岐阜羽島を出たあと、新大阪から東京方面なら米原を出て関ヶ原を越えたあと、A席側を見てください。",
      en: "Tokyo to Shin-Osaka: watch Seat A after Gifu-Hashima. Shin-Osaka to Tokyo: watch Seat A after Maibara and Sekigahara.",
    },
    image: "images/20260629_nangu_taisha_1_michikusa.jpg",
    photoCredit: {
      ja: "michikusa",
      en: "michikusa",
      date: "2026-06-29",
      note: { ja: "のぞみ99号・A席側、7:40撮影", en: "Nozomi 99, Seat A side, photographed at 7:40." },
    },
    photos: [
      {
        src: "images/20260629_nangu_taisha_2_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える南宮大社の大鳥居", en: "Nangu Taisha torii gate from Seat A" },
        date: "2026-06-29",
        note: { ja: "田園の向こうに見える大鳥居", en: "The large torii beyond the fields" },
      },
    ],
    references: [REFERENCES.nanguTaisha, REFERENCES.nanguTaishaWiki],
    map: { lat: 35.36582150225837, lng: 136.52692401984618, ja: "南宮大社 大鳥居", en: "Nangu Taisha torii gate" },
    viewpoint: { lat: 35.365985862164244, lng: 136.52702479196853 },
  },
  {
    id: "sawayama-castle",
    icon: "🏯",
    ja: { name: "佐和山城跡", area: "米原 → 京都", hook: "石田三成の城跡を、田んぼ越しに。", story: "米原を過ぎて少し、E席側に「佐和山城跡」の看板と、その背後の緑濃い山が見えることがあります。ここは関ヶ原の戦い（1600年）で徳川家康と激突し、敗れた西軍の中心人物・石田三成の居城があった場所。三成が「三成に過ぎたるものが二つあり 島の左近と佐和山の城」と評されるほど、この城を大切にしたことでも知られています。戦後、家康方の井伊直政が入り、後に彦根城が築かれると建材まで解体されて移され、山頂に城郭建築はほとんど残っていません。それでも、山の稜線と看板を見つけると、関ヶ原→佐和山→彦根と続く天下分け目の流れが、数分の車窓に重なります。" },
    en: { name: "Sawayama Castle Ruins", area: "Maibara → Kyoto", hook: "Mitsunari's hill beyond the fields.", story: "Soon after Maibara, the 'Sawayama Castle Ruins' sign and the dark green hill behind it may appear on the Seat E side. This was the seat of Ishida Mitsunari, the central figure of the western coalition defeated by Tokugawa Ieyasu at the 1600 Battle of Sekigahara. Contemporaries reportedly said, 'Mitsunari has two possessions above his station: the retainer Shima Sakon, and Sawayama Castle' — a rare tribute to how well he maintained this stronghold. After his defeat, Ii Naomasa of the Tokugawa side took over, then dismantled Sawayama's timbers for use in building Hikone Castle. Almost no castle structure remains on the hill today, but spotting the ridge and the sign links Sekigahara, Sawayama and Hikone across a few minutes of window time." },
    pageTitle: {
      ja: "新幹線から見える佐和山城跡｜石田三成の居城の面影 | 新幹線の窓",
      en: "Sawayama Castle Ruins from the Shinkansen | Ishida Mitsunari's Lost Stronghold",
    },
    pageHeading: {
      ja: "田んぼ越しに山と看板——石田三成の佐和山城跡",
      en: "The hill and the sign: Ishida Mitsunari's Sawayama Castle Ruins",
    },
    pageHeadingChunks: {
      ja: ["田んぼ越しに山と看板——", "石田三成の佐和山城跡"],
      en: ["The hill and the sign:", "Ishida Mitsunari's Sawayama Castle Ruins"],
    },
    metaDescription: {
      ja: "米原を過ぎて新幹線のE席側、田園越しに見える緑濃い山と看板が佐和山城跡。石田三成の居城として知られ、関ヶ原後は徳川家康方に破却された城の歴史を、車窓での楽しみ方と合わせて紹介します。",
      en: "After Maibara, the dark green hill with a signpost visible from Seat E is Sawayama Castle Ruins — Ishida Mitsunari's stronghold before Sekigahara, dismantled by the Tokugawa side after his defeat. Learn its history and how to spot it from the Shinkansen.",
    },
    sectionHeading: {
      ja: "佐和山城とは？なぜ城跡になっている？",
      en: "What was Sawayama Castle, and why only ruins?",
    },
    pageStory: {
      ja: "佐和山城は、標高約232mの佐和山（滋賀県彦根市）に築かれた戦国期の山城です。中山道・北陸道・伊勢街道が交わる交通の要衝を押さえる位置にあり、六角氏、浅井氏、織田氏と時代ごとに支配者を変えながら重要視されました。豊臣秀吉の時代、五奉行のひとりとして政権を支えた石田三成が19万4千石の城主として入り、大規模な普請を行い、五層の天守と厳しい石垣を備えた城として整えたと伝わります。三成は非常に真面目な統治で知られ、居城の維持や下級家臣への待遇も含めて評価が高く、「三成に過ぎたるもの」と称される所以となりました。",
      en: "Sawayama Castle stood on the roughly 232-meter-high Mt. Sawa in what is now Hikone, Shiga Prefecture. Sitting where the Nakasendo, Hokurikudo, and Ise Kaido converged, it was strategically important through successive rulers — the Rokkaku, Azai and Oda clans. Under Toyotomi Hideyoshi, Ishida Mitsunari, one of the go-bugyo administering the regime, became lord with a nominal 194,000 koku income. He greatly expanded the castle, said to have crowned it with a five-tiered keep and reinforced it with strong stonework. Mitsunari was known for exceptionally serious, principled governance — the reason contemporaries described the castle and his retainer Shima Sakon as 'two possessions above his station.'",
    },
    explainer: {
      heading: { ja: "戦い、そして『廃城』——なにが残った？", en: "The battle, and the fall: what remains today?" },
      ja: [
        "1600年の関ヶ原の戦いで西軍が敗れると、佐和山城は東軍の攻撃を受けて陥落し、三成の父や兄など一族も命を落としました。戦後、井伊直政（徳川四天王のひとり）が旧三成領を与えられて入城しますが、まもなくの1603年、直政の跡を継いだ井伊直継（直勝）が近くの彦根山に新たな城を築くことを決定。1606年頃までに佐和山城は徹底的に取り壊され、石垣・建材の多くは彦根城の築城材として運ばれました。「三成の城の跡形も残さない」との意図が働いたとも言われ、現在は主郭跡の平坦地と、わずかな石垣、龍潭寺（りょうたんじ）などの寺社が城の痕跡を伝えるのみとなっています。",
        "彦根市の観光ページでも「石田三成の居城として名高く、関ヶ原の戦い後に廃城となった」と紹介されており、山そのものが史跡として扱われています。麓の龍潭寺は井伊家ゆかりの寺で、境内に佐和山城主・石田三成の像もあり、静かに歴史を偲ぶ場所になっています。",
        "新幹線からは、山頂の石垣や建物は当然見えません。代わりに、車窓のE席側に見える「独立した緑濃い山」と、その麓の田園に立つ大きな『佐和山城跡』の看板が目印です。看板を見つけた瞬間、この山の上で何が起きたかを思い出す——そういう楽しみ方が向いている車窓です。",
      ],
      en: [
        "When the western coalition lost at Sekigahara in 1600, Sawayama was stormed and fell to eastern forces; members of Mitsunari's family died in the attack. Ii Naomasa, one of Tokugawa Ieyasu's Four Generals, was granted Mitsunari's former lands and took the castle, but by 1603 his successor Ii Naotsugu (Naokatsu) decided to build a new castle on nearby Mt. Hikone. By around 1606, Sawayama Castle had been thoroughly dismantled, with much of its stonework and timber carried off to construct Hikone Castle. Some accounts suggest a deliberate intent to leave no trace of Mitsunari's stronghold; today only leveled ground on the main summit, a little residual stonework, and temples such as Ryotan-ji hint at what stood here.",
        "The Hikone City tourism site describes the hill as 'famous as Ishida Mitsunari's castle, dismantled after the Battle of Sekigahara.' Ryotan-ji at the foot of the mountain is a temple long associated with the Ii clan, but its grounds also include a statue of Mitsunari, making it a quiet place to reflect on this history.",
        "Nothing of the summit is visible from the train, of course. Instead, look for the distinctive dark green hill standing alone on the Seat E side, with a large 'Sawayama Castle Ruins' signpost in the fields at its foot. Spotting the sign — and remembering what happened on that hill — is the point of this brief view.",
      ],
    },
    guideHighlight: {
      ja: "米原を通過して数分、E席側の平野に「独立して盛り上がる、まとまった緑の山」を探してください。麓の田園にある大きな看板がタイミングの合図です。天守を探すのではなく、この山の上でかつて何が決まったか、を思いながら眺めるとぐっと印象が変わります。",
      en: "A few minutes past Maibara, look toward Seat E for a single, well-defined green hill rising alone from the plain. The large signpost in the fields below is the timing cue. Do not look for a keep — look at the hill knowing what was decided on it, and the view lands very differently.",
    },
    minutesFromTokyo: 115, side: "E", category: "notable", confidence: "needs-check", durationSec: 5, scene: "castle",
    image: "images/20240719_sawayama_castle_asami_k920.jpg",
    photoCredit: { ja: "@asami_k920", en: "@asami_k920", url: "https://x.com/asami_k920/status/1814165589851795710" },
    photos: [
      {
        src: "images/20250831_sawayama_castle_letus10.jpg",
        alt: { ja: "新幹線のE席側から見える佐和山城跡の看板と山", en: "Sawayama Castle Ruins sign and hill from Seat E" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/517840979.html",
      },
    ],
    references: [REFERENCES.sawayama, REFERENCES.sawayamaIshida, REFERENCES.sawayamaBlog],
    map: { lat: 35.2840, lng: 136.2770, ja: "佐和山城跡", en: "Sawayama Castle Ruins" },
    viewpoint: { lat: 35.283291, lng: 136.281051 },
  },
  {
    id: "hikone-castle",
    icon: "🏯",
    ja: { name: "彦根城", area: "米原 → 京都", hook: "国宝の天守を、街の向こうに。", story: "米原を出たあと、E席側の街並みの向こうに、こんもりとした山の上に立つ白い天守が小さく見えることがあります。それが国宝・彦根城。関ヶ原の戦い後、井伊直政・直継が徳川譜代の要として1622年頃に完成させた城で、江戸時代を通じて彦根藩井伊家35万石の本拠でした。現存12天守のひとつであり、そのうち姫路城・松本城・松江城・犬山城と並んで国宝に指定された「国宝5城」の一角。琵琶湖東岸の歴史を代表するランドマークが、車窓の街並みの上にちらりと現れます。" },
    en: { name: "Hikone Castle", area: "Maibara → Kyoto", hook: "A tiny National Treasure keep.", story: "After Maibara, a small white keep on a low green hill may appear beyond the town on the Seat E side. That is Hikone Castle — one of only twelve original castle keeps left in Japan, and one of just five designated National Treasures (alongside Himeji, Matsumoto, Matsue and Inuyama). Built for Ii Naomasa and completed around 1622 as a key Tokugawa vassal fortress, it served throughout the Edo period as the seat of the 350,000-koku Ii-family Hikone domain. A landmark of eastern Lake Biwa, briefly framed above the roofs from the train." },
    pageTitle: {
      ja: "新幹線から見える彦根城｜国宝天守を米原の車窓から探す | 新幹線の窓",
      en: "Hikone Castle from the Shinkansen | Spotting the National Treasure Keep from Seat E",
    },
    pageHeading: {
      ja: "街の向こうにちらり——国宝・彦根城",
      en: "A glimpse beyond the town: National Treasure Hikone Castle",
    },
    pageHeadingChunks: {
      ja: ["街の向こうにちらり——", "国宝・彦根城"],
      en: ["A glimpse beyond the town:", "National Treasure Hikone Castle"],
    },
    metaDescription: {
      ja: "米原を出た新幹線のE席側、街並みの向こうに小さく見える白い天守は国宝・彦根城。井伊家35万石の本拠として整えられた城の歴史と、車窓での見つけ方を紹介します。",
      en: "After Maibara, the tiny white keep glimpsed beyond the town from Seat E is National-Treasure Hikone Castle — seat of the Ii clan for over two centuries. Learn its history and how to spot it from the Shinkansen.",
    },
    sectionHeading: {
      ja: "彦根城はどんな城？",
      en: "What kind of castle is Hikone?",
    },
    pageStory: {
      ja: "彦根城は、滋賀県彦根市の彦根山（標高約136m）に立つ平山城で、井伊直政のあとを継いだ直継（直勝）が1604年に築城を開始、1622年頃に完成しました。関ヶ原以後の徳川政権にとって、京・大坂方面を睨む戦略上の要衝であったため、周辺の佐和山城・大津城・長浜城・小谷城など複数の城の建材を転用してでも急いで整えられた城です。江戸時代を通じて、井伊家が近江彦根藩の藩主として代々居城とし、幕末には大老・井伊直弼を輩出したことでも知られます。",
      en: "Hikone Castle is a hilltop-plain castle on the roughly 136-meter Mt. Hikone in Hikone City, Shiga Prefecture. Construction began in 1604 under Ii Naotsugu (Naokatsu), successor to Ii Naomasa, and was largely completed around 1622. For the post-Sekigahara Tokugawa regime, Hikone commanded a vital position facing Kyoto and Osaka, and the shogunate hurried its completion — even reusing timber and stone from nearby castles such as Sawayama, Otsu, Nagahama and Odani. Throughout the Edo period the Ii family ruled the Hikone domain from here, and in the late Edo period the castle was the home of the shogunate's chief councillor Ii Naosuke.",
    },
    explainer: {
      heading: { ja: "現存12天守、そして国宝5城のひとつ", en: "One of Japan's twelve surviving keeps — and five National Treasures" },
      ja: [
        "日本には、江戸時代までに建てられた天守が今も残る「現存12天守」があり、彦根城の三重三階の天守もそのひとつです。さらに姫路城・松本城・犬山城・松江城とあわせて、国宝に指定された「国宝5城」のひとつでもあります。屋根は入母屋・唐破風・切妻を組み合わせた複雑な意匠で、比較的小ぶりながら装飾的で美しい天守として評価が高い建物です。天守以外にも、附櫓・多聞櫓、二の丸の佐和口多聞櫓、太鼓門櫓、天秤櫓など、数多くの江戸期の建物が現存し、これらの多くも国指定重要文化財に指定されています。",
        "麓には大名庭園「玄宮園」が広がり、天守と池を組み合わせた眺めは彦根城を象徴する景観のひとつです。城下町の街並みも近世彦根の面影を残し、「夢京橋キャッスルロード」や旧町人町が今も歩いて楽しめる街として整備されています。滋賀県が世界文化遺産登録を目指している対象でもあり、日本の城郭史のなかで極めて重要な位置を占めています。",
        "新幹線からは、E席側の車窓の「街並みの向こう、小高い緑の丘の上」に白い建物を探すことになります。距離があるので大きくは見えませんが、周囲に高い山がなく彦根山だけが独立して盛り上がっているため、意識すれば意外と輪郭がわかります。米原から数十秒後、街並みの切れ間に出るタイミングを狙うのがコツです。",
      ],
      en: [
        "Japan has twelve surviving pre-modern castle keeps, known collectively as the genson junitenshu. Hikone's three-tier, three-story keep is one of them, and it is also one of the five keeps designated as National Treasures (along with Himeji, Matsumoto, Inuyama and Matsue). The relatively small tower is admired for its intricate roofline — combining hip-and-gable, kara-hafu curved gables, and standard gables — and for its refined decoration. Beyond the keep, many other Edo-era structures survive on the grounds (turrets, gates, connecting walls), most of them Nationally Designated Important Cultural Properties.",
        "At its foot, the Genkyu-en garden — a daimyo-style stroll garden combining a pond with the keep in the background — is one of Hikone's most iconic views. The old castle-town streets still evoke early-modern Hikone, and areas like Yumekyobashi Castle Road preserve a walkable feudal-period feel. Shiga Prefecture has been pursuing UNESCO World Heritage inscription for the castle, underscoring its central place in Japanese castle history.",
        "From the train, look toward Seat E for the 'small white building on a slightly higher green hill beyond the town.' At this distance it is not large, but because Mt. Hikone rises alone from the surrounding plain, the shape is surprisingly clear once you know what to look for. Aim for the moment a few tens of seconds after Maibara when the buildings briefly thin out.",
      ],
    },
    guideHighlight: {
      ja: "米原を出て少し経ったら、E席側の遠くに「街並みの上にだけ突き出た小さな緑の丘」を探してください。その頂上に白い点のような天守が見えたらそれが彦根城です。距離があるので双眼鏡や望遠が使える場合は本領を発揮します。実物の迫力を知りたい人は、いつか米原下車でぜひ寄ってみてください。",
      en: "A little after Maibara, look far off on the Seat E side for a small green hill 'poking up just above the roofs.' If you can pick out a white speck at its summit, that is Hikone Castle. Binoculars or a zoom really shine here. If you want to feel the castle's true scale, plan a stopover from Maibara on another ride.",
    },
    minutesFromTokyo: 116, side: "E", category: "curious", confidence: "needs-check", durationSec: 3, scene: "castle",
    image: "images/20170307_hikone_castle_zusshi.jpg",
    photoCredit: { ja: "ずっしー。氏", en: "Zusshi", url: "https://ameblo.jp/ginga03142008/entry-12251601639.html", date: "2017-03-07", note: { ja: "新幹線から見える彦根城。遠景でも天守の位置が比較的わかりやすい写真", en: "Hikone Castle from the Shinkansen, with the keep relatively easy to place despite the distance." } },
    photos: [
      {
        src: "images/20240719_hikone_castle_asami_k920.jpg",
        alt: { ja: "新幹線のE席側から遠くに見える彦根城", en: "Hikone Castle seen far away from Seat E" },
        credit: { ja: "@asami_k920", en: "@asami_k920" },
        sourceUrl: "https://x.com/asami_k920/status/1814165589851795710",
      },
      {
        src: "images/20260712_hikone_castle_michikusa.jpg",
        alt: { ja: "曇りの夕方、新幹線のE席側から見える彦根城", en: "Hikone Castle from Seat E on a cloudy evening" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "奥の鉄塔の後ろにごく小さく見える彦根城", en: "The keep is extremely small, behind the distant transmission tower." },
      },
    ],
    references: [REFERENCES.hikoneCastle, REFERENCES.hikoneCastleUnesco, REFERENCES.zusshiCastleBlog],
    map: { lat: 35.2765, lng: 136.2518, ja: "彦根城", en: "Hikone Castle" },
    viewpoint: { lat: 35.271532, lng: 136.263314 },
  },
  {
    id: "kannonji-castle",
    icon: "🏯",
    ja: { name: "観音寺城跡", area: "米原 → 京都", hook: "山の稜線に、六角氏の城跡を探す。", story: "安土のすぐ近く、E席側の山並みに観音寺城跡があります。天守を探す車窓ではなく、山そのものを城として読む車窓です。ここに拠った六角氏（近江源氏の名門・佐々木氏の一族）は、南近江を長く支配した戦国大名。日本屈指の巨大山城として名高く、標高432mの繖山（きぬがさやま）の全山にわたって石垣と曲輪（くるわ）を巡らせた城でした。1568年、織田信長の上洛に押されて城主・六角義賢父子は戦わずして城を捨てて逃げ、以後廃城に。翌年、信長は目の前の平地に安土城を築くことになります。" },
    en: { name: "Kannonji Castle Ruins", area: "Maibara → Kyoto", hook: "A castle ridge in the mountains.", story: "Near Azuchi, the ridge of Kannonji Castle rises on the Seat E side. This is not a view for spotting a keep — it is a view for reading a whole mountain as a fortress. The Rokkaku clan, a branch of the storied Sasaki family that traced its lineage to the Minamoto, ruled southern Omi for generations from here. Kannonji is regarded as one of Japan's largest true mountain castles: stone walls and enclosures once ringed the entire 432-meter Mt. Kinugasa. In 1568, faced with Oda Nobunaga's advance on Kyoto, lord Rokkaku Yoshikata and his son abandoned the castle without a fight, and it was decommissioned. The following year Nobunaga began building Azuchi Castle on the plain right in front of it." },
    pageTitle: {
      ja: "新幹線から見える観音寺城跡｜六角氏の巨大山城の面影 | 新幹線の窓",
      en: "Kannonji Castle Ruins from the Shinkansen | The Rokkaku Clan's Mountain Fortress",
    },
    pageHeading: {
      ja: "山そのものが城——観音寺城跡と繖山",
      en: "A mountain that was a castle: Kannonji Ruins on Mt. Kinugasa",
    },
    pageHeadingChunks: {
      ja: ["山そのものが城——", "観音寺城跡と繖山"],
      en: ["A mountain that was a castle:", "Kannonji Ruins on Mt. Kinugasa"],
    },
    metaDescription: {
      ja: "米原と京都のあいだ、安土付近でE席側に見える大きな山が観音寺城跡（繖山）。日本屈指の巨大山城として近江源氏・六角氏が本拠を置き、信長の安土城築城とセットで語られる城の背景を解説します。",
      en: "Between Maibara and Kyoto, near Azuchi, the large mountain on the Seat E side is Kannonji Castle Ruins on Mt. Kinugasa. This was one of Japan's largest true mountain castles, the base of the Rokkaku clan and paired historically with Nobunaga's Azuchi Castle right below it.",
    },
    sectionHeading: {
      ja: "観音寺城とは？なぜ有名？",
      en: "What is Kannonji Castle, and why is it famous?",
    },
    pageStory: {
      ja: "観音寺城は、滋賀県近江八幡市の繖山（きぬがさやま、標高432m）に築かれた大規模な山城です。築城の始まりは南北朝〜室町期にまで遡るとされ、以降は近江源氏の名門・佐々木氏の一族である六角氏が代々の本拠として整えました。全山にわたって尾根や谷筋に石垣が組まれ、無数の曲輪（郭）が配されているのが特徴で、日本の中世〜戦国期の山城としては最大級。日本100名城のひとつに数えられ、麓の観音正寺・桑実寺と一体になった信仰の山でもあります。",
      en: "Kannonji Castle stood on Mt. Kinugasa (432 m) in what is now Omihachiman, Shiga Prefecture. Its origins are traced to the Nanboku-cho and Muromachi periods; from then on, the Rokkaku clan — a branch of the Sasaki family, itself descended from the Minamoto — developed it as its principal seat. Ridges and valleys across the entire mountain were faced with stone walls and organized into countless enclosures (kuruwa), making Kannonji one of the largest medieval-Sengoku mountain castles in Japan. It is listed among the '100 Fine Castles of Japan' and shares the mountain with the temples Kannonshoji and Kuwanomidera, giving it a religious dimension as well.",
    },
    explainer: {
      heading: { ja: "信長と観音寺城、そして安土城", en: "Nobunaga, Kannonji, and Azuchi" },
      ja: [
        "観音寺城が広く知られるのは、織田信長の上洛戦との関係です。1568年、信長は足利義昭を奉じて上洛を目指し、南近江の六角氏に降伏を勧告しますが拒絶されました。信長軍は同年9月、支城の箕作城（みつくりじょう）を1日で攻略し、勢いに驚いた六角義賢・義治父子は本拠の観音寺城を捨てて甲賀方面へ逃亡します。事実上、戦わずに落ちた形で、六角氏の南近江支配は終わりました。",
        "翌1569年、信長はこの繖山のすぐ北西の琵琶湖畔・安土に、後の天下人の象徴となる安土城の建設を開始します。つまり車窓のこの山には、旧勢力の巨大な山城と、それを飲み込んで生まれた新しい時代の城が地形として隣り合っている、という重要な歴史地理があります。「観音寺城の裏に安土城がある」と知って見ると、車窓の景色が2つの時代の重なりに見えてきます。",
        "現在、山の稜線にはあちこちに石垣・郭跡が残り、麓の観音正寺までは徒歩やタクシーでアクセスできます。国指定史跡でもあり、遺構の保護と発掘調査が続けられています。",
      ],
      en: [
        "Kannonji Castle is best known for its role in Oda Nobunaga's advance on Kyoto. In 1568, escorting the future shogun Ashikaga Yoshiaki, Nobunaga demanded the surrender of the Rokkaku in southern Omi; they refused. His forces then took the subordinate Mitsukuri Castle in a single day. Shocked by the speed of the attack, Rokkaku Yoshikata and his son Yoshiharu abandoned Kannonji and fled toward Koga. The Rokkaku hold over southern Omi effectively ended without a real defense.",
        "The following year, 1569, Nobunaga began building Azuchi Castle on the Lake Biwa shore just northwest of Mt. Kinugasa — a symbol of the new era he was forging. Seen from the train, this landscape holds two chapters of history stacked side by side: the huge mountain castle of the old order, and the new-age lakeside castle that displaced it. Knowing that 'Azuchi Castle is right behind Kannonji' changes how the window reads.",
        "Today, remnants of stone walls and enclosures are scattered along the ridges, and Kannonshoji at the foot of the mountain can be reached on foot or by taxi. The site is a Nationally Designated Historic Site, and preservation and archaeological work continue.",
      ],
    },
    guideHighlight: {
      ja: "安土駅付近を通るあたりで、E席側の平野の中に「他より一段大きく、山の形が長く伸びた山」を探してください。天守も看板も見えませんが、その稜線こそが観音寺城の跡です。「あの山が城だった」と知って眺めるだけで、車窓の意味が変わります。",
      en: "Around Azuchi, look toward Seat E for a mountain that is 'clearly bigger and longer-shouldered' than its neighbors on the plain. There is no keep or sign, but the ridge itself is the castle site. Simply knowing that the mountain once *was* the fortress changes the meaning of the window.",
    },
    minutesFromTokyo: 120, side: "E", category: "notable", confidence: "needs-check", durationSec: 5, scene: "mountain",
    image: "images/20240719_kannonji_castle_asami_k920.jpg",
    photoCredit: { ja: "@asami_k920", en: "@asami_k920", url: "https://x.com/asami_k920/status/1814165589851795710" },
    photos: [
      {
        src: "images/20260712_kannonji_castle_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える観音寺城跡の山並み", en: "The Kannonji Castle ridge from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "天守ではなく、繖山の山並みそのものを読む車窓", en: "This is a view for reading the ridge itself, not a keep." },
      },
      {
        src: "images/20260712_kannonji_azuchi_castle_sign_michikusa.jpg",
        alt: { ja: "観音寺城跡付近から見える安土城跡案内の看板", en: "Azuchi Castle Ruins sign near the Kannonji Castle area" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "観音寺城跡の少し大阪寄りにある安土城跡案内の看板", en: "An Azuchi Castle Ruins sign slightly toward Osaka from Kannonji Castle." },
      },
    ],
    references: [REFERENCES.kannonjiCastle, REFERENCES.kannonjiCastleShiga],
    map: { lat: 35.1420, lng: 136.1510, ja: "観音寺城跡", en: "Kannonji Castle Ruins" },
    viewpoint: { lat: 35.147590, lng: 136.140183 },
  },
  {
    id: "omi-fuji",
    icon: "⛰️",
    ja: { name: "近江富士", area: "米原 → 京都", hook: "琵琶湖の手前、もうひとつの富士。", story: "米原を出てしばらく走ると、A席側に、きれいな三角形をした低い山があらわれます。標高432mの三上山（みかみやま）、通称「近江富士」。滋賀県野洲市にそびえる独立峰で、あまりに整った円錐形をしているため、古くから富士山になぞらえて呼ばれてきました。ヤマトタケルや藤原秀郷の百足退治伝説の舞台としても知られ、麓の御上神社は式内社の名神大社、本殿は国宝に指定されています。水田に映れば車窓だけの「逆さ富士」。少し早めに窓の外を見ておくと出会えます。" },
    en: { name: "Omi Fuji", area: "Maibara → Kyoto", hook: "Another Fuji, before Kyoto.", story: "After Maibara, look from Seat A for a low mountain rising in a neat triangle. This is Mt. Mikami — 432 meters tall, an independent peak in Yasu, Shiga Prefecture — long nicknamed 'Omi Fuji' for its almost perfect conical shape. Local legends associate it with the prince Yamato Takeru and with Fujiwara no Hidesato's mythical slaying of a giant centipede. At its foot stands Mikami Shrine, an ancient shrine whose main sanctuary is a National Treasure. When the surrounding rice fields fill with water, Omi Fuji can even reflect as a window-seat 'upside-down Fuji.' Start looking a little early." },
    pageTitle: {
      ja: "近江富士（三上山）とは？新幹線から見えるA席側の名峰 | 新幹線の窓",
      en: "What Is Omi Fuji (Mt. Mikami)? A Perfect Cone from the Shinkansen | Shinkansen Window",
    },
    pageHeading: {
      ja: "近江富士（三上山）——琵琶湖手前の三角形",
      en: "Omi Fuji / Mt. Mikami: a perfect triangle before Lake Biwa",
    },
    pageHeadingChunks: {
      ja: ["近江富士（三上山）——", "琵琶湖手前の三角形"],
      en: ["Omi Fuji / Mt. Mikami:", "a perfect triangle before Lake Biwa"],
    },
    metaDescription: {
      ja: "米原と京都のあいだ、新幹線のA席側に見える整った三角の山が近江富士（三上山、標高432m）。名前の由来、御上神社との関係、車窓での見つけ方や逆さ富士の楽しみ方まで紹介します。",
      en: "Between Maibara and Kyoto, the sharp triangular peak on the Seat A side is Omi Fuji (Mt. Mikami, 432 m). Learn the name's origin, the shrine at its foot, and how to spot it — and its 'upside-down Fuji' reflection — from the Shinkansen.",
    },
    sectionHeading: {
      ja: "近江富士（三上山）はどんな山？",
      en: "What is Omi Fuji (Mt. Mikami)?",
    },
    pageStory: {
      ja: "三上山は滋賀県野洲市に立つ独立峰で、標高は432mとそれほど高くはありません。それでも「近江富士」と呼ばれてきたのは、周囲に大きな山がなく、どの角度から見てもほぼ左右対称の三角形に見える、その形の美しさゆえです。江戸期の街道絵図や琵琶湖八景に類する景観の一部として描かれることも多く、「富士山ではないのに富士と呼ばれる山」の代表格として知られてきました。地元では「三上山」のほうが自然な呼び名で、観光文脈や広域向けの紹介では「近江富士」が使われることが多い、という2つの呼び方が並行しているのも特徴です。",
      en: "Mt. Mikami rises alone in Yasu City, Shiga Prefecture, to a modest 432 meters. It has been called 'Omi Fuji' for centuries because — without larger mountains around it — it appears nearly symmetrical from any angle, forming a clean triangle. Edo-era travel prints often show it as a scenic anchor along the highway, and it is one of Japan's most famous 'not-Mt.-Fuji, still called a Fuji' mountains. Locals more often use 'Mt. Mikami,' while 'Omi Fuji' turns up more in tourism materials — the two names run in parallel.",
    },
    explainer: {
      heading: { ja: "御上神社と、伝説の山", en: "Mikami Shrine and the mountain of legends" },
      ja: [
        "三上山の南麓に鎮座する御上神社（みかみじんじゃ）は、天御影命（あめのみかげのみこと）を祀る古社で、平安時代の延喜式神名帳に載る「名神大社」です。三上山そのものを神体山（ご神体としての山）とする信仰があり、山と神社が一体となった祭祀の場として、非常に古い形の日本の信仰を今に伝えています。1300年（正安2年）に再建された本殿は、鎌倉時代を代表する神社建築として、国宝に指定されています。",
        "三上山は物語の宝庫でもあります。日本武尊（ヤマトタケル）の東征伝承の一場面に登場するほか、平安中期の武将・藤原秀郷が湖に架かる瀬田橋の大蛇（実は龍神）の頼みで、三上山に住み着いていた巨大な百足を退治したという「百足退治」の伝説が特に有名です。麓に伝わる百足除けの信仰や、御上神社の伝統行事にもその名残があり、山の姿と物語がセットで語り継がれてきました。",
        "登山道は麓の御上神社側から比較的整備されていて、コースにより1〜1時間半で山頂まで登ることができます。山頂近くには奥宮や巨石群があり、車窓で見た「あの三角の山」に実際に立てるのが、この山の親しみやすさでもあります。",
      ],
      en: [
        "At the southern foot of Mt. Mikami stands Mikami Shrine, dedicated to Ame-no-Mikage-no-Mikoto. Listed as a myojin-taisha in the Heian-era Engishiki register, it is one of the oldest shrines in the region. The mountain itself is worshiped as a shintai — a divine mountain — meaning the peak and the shrine below it function as a single ritual site, preserving a very ancient form of Japanese sacred landscape. The main sanctuary, rebuilt in 1300 (Shoan 2), is designated a National Treasure as a leading example of Kamakura-period shrine architecture.",
        "The mountain is also rich in legend. It appears in tales connected with Yamato Takeru's eastern campaign, and — most famously — in the story of the Heian-era warrior Fujiwara no Hidesato. According to legend, a dragon king asked him at the Seta Bridge to kill a giant centipede living on Mt. Mikami. Traditional beliefs guarding against centipedes and rituals at Mikami Shrine preserve echoes of that story. The mountain's shape and its stories have been handed down together for centuries.",
        "Well-marked hiking trails start from the shrine side and lead to the summit in about an hour to an hour and a half, depending on the route. Near the top are subsidiary shrines and clusters of large stones. That accessibility is part of the appeal: the 'triangular mountain from the window' is one you can actually stand on.",
      ],
    },
    guideHighlight: {
      ja: "米原を出てしばらくしたら、A席側の遠くに「整った三角の低い山」を探してください。周囲に高い山がないので、意識すれば意外とすぐに見つかります。田植え直後（4〜5月）の水を張った田んぼが手前にあると、三上山が水面に映って「逆さ富士」のように見えるボーナスタイムです。",
      en: "A little after Maibara, look far off on the Seat A side for a 'neat, low triangular mountain.' With no taller peaks nearby, it stands out surprisingly quickly once you know what you are looking for. If the foreground fields are freshly flooded around rice-planting season in April–May, Mt. Mikami can reflect on the water into a small 'upside-down Fuji' — a nice bonus if you catch it.",
    },
    minutesFromTokyo: 123, side: "A", sideLabel: { ja: "A席側", en: "Seat A side" }, category: "notable", confidence: "needs-check", durationSec: 15, scene: "mountain",
    image: "images/20250523_omi_fuji_kawasan3.jpg",
    photoCredit: {
      ja: "@kawasan3",
      en: "@kawasan3",
      url: "https://x.com/kawasan3/status/1925668108024320321",
      note: { ja: "水田に映る逆さ富士", en: "Upside-down Fuji reflected in a rice field" },
    },
    photos: [
      {
        src: "images/20250523_omi_fuji_wheat_kawasan3.jpg",
        alt: { ja: "近江富士の前が小麦色になった景色", en: "Omi Fuji with golden wheat in front" },
        credit: { ja: "@kawasan3", en: "@kawasan3" },
        sourceUrl: "https://x.com/kawasan3/status/1925668834393960462",
        note: { ja: "近江富士の前が小麦色", en: "The land in front of Omi Fuji turns wheat-colored" },
      },
      {
        src: "images/20260629_omi_fuji_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える近江富士", en: "Omi Fuji from Seat A on the Shinkansen" },
        date: "2026-06-29",
        note: { ja: "田園の向こうの近江富士", en: "Omi Fuji beyond the fields" },
      },
    ],
    references: [REFERENCES.omiFujiPark, REFERENCES.omiFujiOfficial],
    map: { lat: 35.05181420454288, lng: 136.0377290179685, ja: "三上山 近江富士", en: "Mt. Mikami Omi Fuji" },
    viewpoint: { lat: 35.0575405061877, lng: 136.01790212955294 },
  },
  {
    id: "seta-karahashi",
    icon: "🌉",
    ja: { name: "瀬田の唐橋", area: "米原 → 京都", hook: "京の手前、伝説を渡る橋。", story: "京都へ近づく少し前、E席側に瀬田川と、川を渡る二連の橋が見えてきます。これが瀬田の唐橋（せたのからはし）。日本書紀にも登場する古代からの交通の要衝で、京の東の玄関口として「唐橋を制する者は天下を制す」と言われた橋です。中央の中の島を挟んで大橋・小橋が並ぶ独特の形状と、朱塗りの欄干が印象的で、日本三名橋・近江八景「瀬田の夕照」にも数えられます。俵藤太（藤原秀郷）の百足退治伝説、壬申の乱、木曽義仲の最期、本能寺の変直後の攻防など、日本史の節目にたびたび登場した舞台でもあります。" },
    en: { name: "Seta no Karahashi Bridge", area: "Maibara → Kyoto", hook: "A legendary bridge before Kyoto.", story: "A little before Kyoto, Seat E opens onto the Seta River and a distinctive two-span bridge crossing it. This is Seta no Karahashi, one of Japan's oldest strategic river crossings — mentioned already in the 8th-century Nihon Shoki as the eastern gate to the capital, and long summed up in the saying, 'whoever controls the Karahashi controls the realm.' Its unusual shape (a large and a small bridge meeting at a central islet) and vermilion railings make it easy to recognize. It is counted among Japan's Three Famous Bridges and among the Eight Views of Omi ('the Evening Glow at Seta'). Countless turning points of Japanese history — the Jinshin War of 672, the death of Kiso Yoshinaka, battles just after the Honnoji Incident, and the legend of Tawara Toda slaying a giant centipede — unfolded here." },
    pageTitle: {
      ja: "新幹線から見える瀬田の唐橋｜日本三名橋の由緒と車窓 | 新幹線の窓",
      en: "Seta no Karahashi from the Shinkansen | One of Japan's Three Famous Bridges",
    },
    pageHeading: {
      ja: "京の手前で、歴史を渡る——瀬田の唐橋",
      en: "Crossing history before Kyoto: Seta no Karahashi",
    },
    pageHeadingChunks: {
      ja: ["京の手前で、歴史を渡る——", "瀬田の唐橋"],
      en: ["Crossing history before Kyoto:", "Seta no Karahashi"],
    },
    metaDescription: {
      ja: "京都駅の手前、新幹線のE席側に一瞬見える朱の欄干の橋が瀬田の唐橋。日本三名橋・近江八景のひとつで、壬申の乱・俵藤太の百足退治・木曽義仲の最期など、多くの日本史の舞台となった橋の由緒を紹介します。",
      en: "Just before Kyoto, the vermilion-railed bridge across the Seta River on the Seat E side is Seta no Karahashi. One of Japan's Three Famous Bridges and an Eight Views of Omi scene, it has been the setting of many turning points in Japanese history — from the 7th-century Jinshin War to the death of Kiso Yoshinaka.",
    },
    sectionHeading: {
      ja: "瀬田の唐橋とはどんな橋？",
      en: "What is Seta no Karahashi?",
    },
    pageStory: {
      ja: "瀬田の唐橋は、琵琶湖から流れ出た瀬田川に架かる橋で、滋賀県大津市瀬田に位置します。橋の始まりは大化年間（7世紀）以前まで遡るとされ、以来1400年近くにわたってこの地点に橋が架け続けられてきました。京・大津側から東国へ抜けるほぼ唯一の陸路上の主要橋であり、古代から中世・近世を通じて、東国と畿内の軍勢がぶつかる戦略上の要でした。「京の東の玄関」「唐橋を制する者は天下を制す」と評される所以です。現代の橋は昭和54年（1979年）に架け替えられた鉄筋コンクリート橋ですが、木造の伝統橋を踏襲した独特のシルエットと、朱塗りの欄干は今も変わりません。",
      en: "Seta no Karahashi crosses the Seta River, which flows out of Lake Biwa, in Seta, Otsu City, Shiga Prefecture. Bridges have been recorded at this exact spot since before the mid-7th century, meaning some form of the crossing has stood here for close to 1,400 years. For most of Japanese history it was effectively the only major bridge on the land route between the capital region and the east — the natural clash point whenever eastern armies moved toward the capital or vice versa. Hence the phrase 'the eastern gate to Kyoto' and the old saying that whoever holds Karahashi holds the realm. The present bridge, reconstructed in reinforced concrete in 1979, keeps the silhouette and vermilion railings of the traditional wooden bridge.",
    },
    explainer: {
      heading: { ja: "この橋にまつわる、日本史のエピソード", en: "Famous stories tied to this bridge" },
      ja: [
        "瀬田の唐橋を語るうえで欠かせないのが、672年の壬申の乱です。天智天皇の弟・大海人皇子（後の天武天皇）と、皇子の大友皇子との皇位継承争いは、この橋を境にした瀬田川の戦いで大海人側の勝利が決定的となりました。日本古代史における最大の内乱の帰結が決した場所でもあります。",
        "平安中期には、俵藤太（たわらとうた）こと藤原秀郷が、瀬田橋で美しい姫（実は琵琶湖の龍神）に頼まれ、三上山に住む巨大な百足を退治したという「百足退治」の伝説の舞台。三上山（近江富士）の項目とも重なるエピソードで、この橋と山、湖を結ぶ物語として今も語られています。",
        "源平合戦末期の1184年、木曽義仲は京から敗走する中で瀬田橋を目指し、粟津の戦いで討たれました。義仲の腹心・今井兼平が「橋の上で名乗って戦った」場面は『平家物語』の名場面のひとつです。1582年、本能寺の変で織田信長を討った明智光秀の家臣・山岡景隆はいったんこの唐橋を焼き落として光秀の東進を阻止しようとしました。江戸期には東海道の重要な橋として絵図にも度々描かれ、歌川広重の『近江八景』にも「瀬田夕照（せたのせきしょう）」として登場します。",
        "実は日本語のことわざ「急がば回れ」も、この橋が生まれの地です。室町時代の連歌師・宗長（そうちょう）の歌「もののふの やばせの舟は 早くとも 急がば回れ 瀬田の長橋」——武士が京へ急ぐなら、比叡おろしの強風で危険な琵琶湖上の「矢橋（やばせ）の渡し」より、遠回りでも安全な瀬田の唐橋を陸路で渡れ、という意味です。この一首から「急ぐときこそ、遠回りに見えても安全確実な道を」という教訓が広まり、現代まで日常語として使われ続けています。窓から見える橋そのものが、日本人が今も口にすることわざの原風景です。",
      ],
      en: [
        "One episode that cannot be left out is the Jinshin War of 672. In the succession struggle between Emperor Tenji's younger brother Prince Oama (later Emperor Tenmu) and Tenji's son Prince Otomo, the decisive battle for the capital was fought along the Seta River right at this bridge, with victory going to Prince Oama. In effect, the outcome of ancient Japan's largest civil war was settled here.",
        "In the middle Heian period, this bridge is the setting of the legendary Fujiwara no Hidesato — known as Tawara Toda — being asked by a beautiful woman (secretly the dragon deity of Lake Biwa) to slay a giant centipede living on Mt. Mikami. The story overlaps with the Omi Fuji entry on this site: bridge, mountain and lake are bound together as a single legend.",
        "In 1184, at the tail end of the Genpei War, the warlord Kiso Yoshinaka retreated from Kyoto toward Seta Bridge and was killed at the nearby Battle of Awazu. The scene in The Tale of the Heike where his loyal retainer Imai Kanehira 'names himself on the bridge and fights to the death' is one of that epic's most famous passages. In 1582, right after Akechi Mitsuhide killed Oda Nobunaga at the Honnoji Incident, the Mitsuhide-side commander Yamaoka Kagetaka burned this bridge in an attempt to block his own former ally's eastward advance. During the Edo period the bridge appears repeatedly in Tokaido guidebooks, and Utagawa Hiroshige's woodblock series Eight Views of Omi includes it as 'Evening Glow at Seta.'",
        "The Japanese proverb 'isogaba maware' — 'if you're in a hurry, take the long way around' — was born from this bridge. The Muromachi-era renga poet Socho wrote: 'For a warrior, even if the ferry across Lake Biwa from Yabase is faster, if you are truly in a hurry, cross by the long Seta Bridge instead.' The point: the Yabase ferry was quick but exposed to sudden dangerous winds off Mt. Hiei, while the land route via Seta no Karahashi was longer but reliably safe. From that single poem grew a proverb still used every day in modern Japanese, teaching that when time really matters, the trusted route beats the shortcut. The bridge outside the window is the original scene behind an expression the whole country still speaks.",
      ],
    },
    guideHighlight: {
      ja: "京都駅が近づく前の数分、E席側の窓の外に川と橋を探してください。中の島を挟んで大橋・小橋が並ぶシルエットと、朱塗りの欄干が目印です。橋そのものは一瞬ですが、「あの下の川を、天下分け目の軍勢が何度も渡ろうとした」と思って眺めると、京都到着の直前の景色に別の重みが加わります。夜は橋の明かりが瀬田川の水面に映り、朱塗りの欄干の輪郭だけが闇に残ります。京都に着く前の、最後の見どころです。",
      en: "In the last minutes before Kyoto Station, look toward Seat E for a river and a distinctive bridge. Watch for the two-span silhouette meeting at a central islet, framed by vermilion railings. The bridge itself passes in a moment, but if you view it thinking 'countless armies fought to cross this water,' the last stretch into Kyoto carries a different kind of weight. At night the bridge lights sit on the surface of the Seta River and only the outline of the vermilion railings is left against the dark — the last thing worth watching for before Kyoto.",
    },
    minutesFromTokyo: 127, side: "E", category: "notable", confidence: "source-backed", durationSec: 3, scene: "lake",
    image: "images/20250909_seta_karahashi_c91256633.jpg",
    photoCredit: { ja: "@C91256633", en: "@C91256633", url: "https://x.com/C91256633/status/1965377316537925644" },
    photos: [
      {
        src: "images/20250820_seta_karahashi_letus10.jpg",
        alt: { ja: "晴れた日の瀬田の唐橋", en: "Seta no Karahashi Bridge on a clear day" },
        credit: { ja: "@letus10 / 新幹線の車窓から", en: "@letus10 / Shinkansen window blog" },
        sourceUrl: "https://cotetu.seesaa.net/article/517709224.html",
      },
      {
        src: "images/20260629_2125_seta_karahashi_night_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜の新幹線から見える瀬田の唐橋付近", en: "Around Seta no Karahashi at night from the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-06-29",
        note: { ja: "夜の瀬田川を渡る光", en: "Lights crossing the Seta River at night" },
      },
      {
        src: "images/20260712_seta_karahashi_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える瀬田川と瀬田の唐橋付近", en: "Seta River and the Seta no Karahashi area from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "京都到着前、川と橋が一瞬ひらく昼の車窓", en: "A daytime glimpse of the river and bridge before Kyoto." },
      },
    ],
    references: [REFERENCES.setaKarahashiOtsu, REFERENCES.setaKarahashiIsogaba, REFERENCES.setaKarahashiWiki, REFERENCES.setaKarahashi],
    map: { lat: 34.97306, lng: 135.90611, ja: "瀬田の唐橋", en: "Seta no Karahashi Bridge" },
    viewpoint: { lat: 34.969755, lng: 135.905686 },
  },
  {
    id: "toji",
    icon: "⛩️",
    ja: { name: "東寺 五重塔", area: "京都駅 前後", hook: "「京都に来た」が、一瞬でわかる。", story: "京都駅の南、A席側の街並みの向こうに、黒々とした瓦屋根を重ねた五重塔がそびえます。これが東寺（教王護国寺）の五重塔。高さ54.8mは、現存する木造塔として日本最高。平安京遷都のわずか2年後、796年に創建された東寺そのものは、平安京の正門・羅城門の東に建てられた官立の大寺で、後に空海（弘法大師）に下賜され、日本の真言密教の根本道場となりました。塔自体は落雷などで4度焼失し、現在のものは1644年、徳川家光の寄進で再建された5代目。1200年にわたって京都の南のスカイラインを守ってきた塔が、新幹線の窓から一瞬で見える——京都到着の最高の合図です。" },
    en: { name: "To-ji Pagoda", area: "Around Kyoto Sta.", hook: "One glance, and you know it's Kyoto.", story: "South of Kyoto Station, on the Seat A side, a dark-tiled tower of stacked eaves rises above the roofs. This is the five-story pagoda of To-ji Temple (Kyo-o-gokoku-ji). At 54.8 meters it is the tallest surviving wooden tower in Japan. To-ji itself was founded in 796, just two years after the capital moved to Heian-kyo (Kyoto), as an official state temple guarding the eastern side of the Rajomon capital gate. Later it was granted to the priest Kukai (Kobo Daishi) and became the head training temple of Japan's Shingon esoteric Buddhism. The pagoda has burned down four times over the centuries; the current fifth iteration was rebuilt in 1644 with funding from the third Tokugawa shogun, Iemitsu. A tower that has anchored Kyoto's southern skyline for 1,200 years — the perfect announcement, from the Shinkansen window, that you have arrived in Kyoto." },
    pageTitle: {
      ja: "新幹線から見える東寺 五重塔｜日本一高い木造塔と京都到着の合図 | 新幹線の窓",
      en: "To-ji Five-Story Pagoda from the Shinkansen | Japan's Tallest Wooden Tower",
    },
    pageHeading: {
      ja: "京都到着を告げる、東寺の五重塔",
      en: "To-ji's five-story pagoda — Kyoto's arrival signal",
    },
    pageHeadingChunks: {
      ja: ["京都到着を告げる、", "東寺の五重塔"],
      en: ["To-ji's five-story pagoda —", "Kyoto's arrival signal"],
    },
    metaDescription: {
      ja: "京都駅前後、新幹線のA席側にそびえる黒瓦の塔は東寺（教王護国寺）の五重塔。高さ54.8mの日本最高木造塔、空海ゆかりの真言密教の根本道場、江戸期に徳川家光が再建した現在の塔まで、車窓と合わせて楽しむための背景を紹介します。",
      en: "Around Kyoto Station, the dark-tiled pagoda rising on the Seat A side belongs to To-ji Temple (Kyo-o-gokoku-ji). At 54.8 meters it is Japan's tallest surviving wooden tower. Learn about its 8th-century founding, its ties to Kukai's Shingon esoteric Buddhism, and today's Edo-era rebuild by shogun Iemitsu.",
    },
    sectionHeading: {
      ja: "東寺と五重塔——どんな歴史がある？",
      en: "To-ji and its pagoda — what's the story?",
    },
    pageStory: {
      ja: "東寺（正式には教王護国寺）は、796年（延暦15年）、平安京遷都からわずか2年後に、桓武天皇の勅願で羅城門の東に建てられた官立寺院です。西の対をなす西寺とともに、新しい都を仏教で護る「王城鎮護」の役目を担っていました。ところが西寺はやがて衰えて廃絶し、東寺だけが千年以上にわたり京の南に立ち続けています。823年、嵯峨天皇はこの東寺を空海（弘法大師）に下賜し、以後、東寺は日本における真言密教の根本道場となります。金堂・講堂に安置された立体曼荼羅（21躯の仏像群）は空海の構想を今に伝える傑作として国宝・重要文化財に多数指定されています。",
      en: "To-ji — formally, Kyo-o-gokoku-ji — was founded in 796 by imperial decree of Emperor Kanmu, just two years after the capital moved to Heian-kyo (present-day Kyoto). Built to the east of the Rajomon capital gate, it was paired with a western counterpart, Sai-ji, to serve as a Buddhist guardian of the new capital. Sai-ji later declined and disappeared, leaving To-ji alone to stand on the city's southern edge for more than a thousand years. In 823, Emperor Saga entrusted To-ji to the priest Kukai (Kobo Daishi), and from then on the temple became the head training center of Shingon esoteric Buddhism in Japan. Its Kondo and Kodo halls house the famous three-dimensional mandala — a group of 21 Buddhist statues realizing Kukai's vision, many of them designated National Treasures or Important Cultural Properties.",
    },
    explainer: {
      heading: { ja: "五重塔そのものを、もう少し", en: "A closer look at the pagoda itself" },
      ja: [
        "五重塔の建設は空海の発願で826年に始まりましたが、実際の完成には数十年を要し、9世紀後半にようやく初代の塔が姿を現したと伝わります。以降、10世紀・11世紀・16世紀と落雷や兵火で四度焼失を経験し、現在の塔は1644年（寛永21年）に江戸幕府3代将軍・徳川家光の寄進で再建された5代目です。高さ54.8mは、現存する木造塔としては国内最高で、木造建築全体としても屈指の巨大な塔になります。国宝に指定されており、京都のスカイラインを東西どこから見ても目印になる、都のシンボルです。",
        "内部は通常非公開ですが、心柱を中心に密教の五智如来を配し、扉絵や板絵で構造そのものが立体曼荼羅として設計されているのが特徴です。春・秋には特別公開があり、心柱と天井まで貫く縦の空間、内部の絢爛な装飾を実際に見ることができます。",
        "東寺全体でも、金堂（国宝、豊臣秀頼が再建）、講堂（重要文化財）、南大門（重要文化財）などが並び、1994年には「古都京都の文化財」の構成資産としてユネスコ世界文化遺産に登録されました。毎月21日の「弘法市（弘法さん）」は江戸期から続く縁日で、境内が骨董・古着・食べ物の屋台でにぎわう京都名物のひとつです。",
      ],
      en: [
        "Construction of the pagoda was initiated by Kukai in 826, but the first tower is thought to have been completed only in the late 9th century. Struck by lightning and destroyed by fire on four separate occasions — in the 10th, 11th, 15th and 16th centuries — the pagoda you see today is the fifth iteration, rebuilt in 1644 with funding from the third Tokugawa shogun, Iemitsu. At 54.8 meters it is the tallest surviving wooden tower in Japan and among the tallest historical wooden structures anywhere. It is a National Treasure and a signature landmark of the Kyoto skyline in every direction.",
        "The interior is usually closed to the public, but it houses the Five Wisdom Buddhas around the central pillar, with door and panel paintings turning the structure itself into a three-dimensional mandala. Special seasonal openings in spring and autumn allow visitors to see the central pillar rising the full height of the tower and the elaborate inner decoration.",
        "The wider precinct includes the National Treasure Kondo (rebuilt by Toyotomi Hideyori), the Important Cultural Property Kodo, and the Nandaimon south gate. In 1994, To-ji was registered as part of the UNESCO World Heritage 'Historic Monuments of Ancient Kyoto.' The monthly Kobo-ichi flea market on the 21st, held here since Edo times, still fills the grounds with stalls for antiques, kimono and food — one of Kyoto's classic monthly events.",
      ],
    },
    guideHighlight: {
      ja: "京都駅に近づいたら、A席側の窓を早めに見ておくのがおすすめ。街並みの上から、他の建物より一段抜きん出た黒い塔が姿を現します。逆に京都駅を出て新大阪方向へ進む列車では、駅を出てすぐ振り返るように後方を眺めると、去っていく京都のシンボルとしての五重塔が印象的です。",
      en: "As Kyoto Station approaches, look toward Seat A a little in advance. Above the roofs, a dark tower rises noticeably higher than the surrounding buildings. On trains leaving Kyoto for Shin-Osaka, glancing back just after departure also gives you the pagoda as a fading symbol of the city you are leaving.",
    },
    minutesFromTokyo: 131, side: "A", category: "classic", confidence: "verified", durationSec: 5, scene: "pagoda",
    image: "images/20260510_toji.png",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-10" },
    photos: [
      {
        src: "images/20260712_toji_michikusa.jpg",
        alt: { ja: "新幹線のA席側から見える東寺 五重塔", en: "To-ji Pagoda from Seat A on the Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "京都駅の前後で見える五重塔", en: "The five-story pagoda seen around Kyoto Station" },
      },
    ],
    references: [REFERENCES.tojiOfficial, REFERENCES.tojiPagodaBunka, REFERENCES.toji],
    map: { lat: 34.980361, lng: 135.747694, ja: "東寺 五重塔", en: "To-ji Pagoda Kyoto" },
    viewpoint: { lat: 34.985303, lng: 135.746690 },
  },
  {
    id: "torikai-train-depot",
    icon: "🚄",
    ja: { name: "鳥飼車両基地", area: "京都 → 新大阪", hook: "白い新幹線が、ずらり整列。", story: "新大阪に近づくころ、E席側に白い新幹線が何本も並ぶ広大な車両基地が広がります。ここは鳥飼車両基地（正式名称：JR東海 大阪仕業検査車両所・大阪交番検査車両所ほか）。大阪府摂津市鳥飼西に位置し、東海道新幹線開業と同じ1964年10月に運用を開始した、東海道・山陽新幹線の運行を大阪側から支える最大級の車両基地です。総面積は約28万平方m。列車が並んで休むだけでなく、車内清掃・電気検査（交番検査）・軽微な修繕・洗車まで一体的に行われ、次の運行へ整えられていきます。速度が落ち始める区間なので、走ってきた新幹線の舞台裏をゆっくり楽しめる、貴重な車窓です。" },
    en: { name: "Torikai Train Depot", area: "Kyoto → Shin-Osaka", hook: "Rows of Shinkansen at rest.", story: "As Shin-Osaka approaches, the Seat E window opens onto a huge rail yard where dozens of white Shinkansen stand in orderly rows. This is Torikai Rail Yard (officially, JR Central's Osaka rolling-stock service and inspection facilities), located in Torikai-nishi, Settsu City, Osaka. It opened on October 1, 1964 — the same day as the Tokaido Shinkansen itself — and remains the largest depot supporting operations on the Tokaido and Sanyo Shinkansen from the Osaka side. Covering roughly 280,000 square meters, it handles not just parking but interior cleaning, electrical (kōban) inspections, minor repairs and washing, preparing each train for its next run. Because the train is already slowing here, it is one of the few window views on the whole ride where you can enjoy the 'backstage' at a relaxed pace." },
    pageTitle: {
      ja: "新幹線から見える鳥飼車両基地｜白い新幹線がずらり並ぶ拠点 | 新幹線の窓",
      en: "Torikai Rail Yard from the Shinkansen | Where the Fleet Rests and Is Serviced",
    },
    pageHeading: {
      ja: "新大阪の手前にひらける、鳥飼車両基地",
      en: "Just before Shin-Osaka: the Torikai Rail Yard opens up",
    },
    pageHeadingChunks: {
      ja: ["新大阪の手前にひらける、", "鳥飼車両基地"],
      en: ["Just before Shin-Osaka:", "the Torikai Rail Yard opens up"],
    },
    metaDescription: {
      ja: "新大阪の手前、新幹線のE席側に広がる鳥飼車両基地は、1964年の東海道新幹線開業と同時に運用開始した最大級の拠点。基地の機能、規模、車窓での見どころをまとめて紹介します。",
      en: "Just before Shin-Osaka, the huge Torikai Rail Yard opens on the Seat E side. Opened alongside the Tokaido Shinkansen in 1964, it services and prepares the fleet. Learn about the depot's role and how to enjoy this window view.",
    },
    sectionHeading: {
      ja: "鳥飼車両基地はどんな場所？",
      en: "What is Torikai Rail Yard?",
    },
    pageStory: {
      ja: "鳥飼車両基地は、大阪府摂津市鳥飼西の東海道新幹線沿線に広がる、JR東海（東海旅客鉄道）の大規模車両基地です。1964年10月1日、東海道新幹線が新幹線としてこの地に誕生したのと同じ日に運用を開始し、以来、東海道・山陽方面の車両運用を大阪側から支えてきました。総面積約28万m²、留置線・検査線・洗浄線が広く伸び、多いときには数十本のN700系・N700S・700系（過去）などが同時に並びます。夜間の留置数は特に多く、新幹線ダイヤの根本にある「早朝どこからどう発車させるか」を実際に支える現場です。",
      en: "Torikai Rail Yard is a large JR Central rolling-stock depot in Torikai-nishi, Settsu City, Osaka Prefecture, running alongside the Tokaido Shinkansen. It opened on October 1, 1964 — the very day the Tokaido Shinkansen entered service — and has since supported Tokaido / Sanyo operations from the Osaka side. The site covers about 280,000 square meters, with parking, inspection and washing tracks spreading over a wide area. Dozens of N700A, N700S and formerly 700-series trains can stand here at once. It is particularly full overnight, and effectively provides the answer to a core question of the Shinkansen timetable: 'which trains are available to depart from where at first light tomorrow.'",
    },
    explainer: {
      heading: { ja: "ここで、何が行われている？", en: "What actually happens inside" },
      ja: [
        "鳥飼車両基地では、走行後の列車に対して段階的な検査・整備が行われます。運転間の短時間で行われる仕業検査（列車の外観・機器の目視点検、走行装置の異音チェックなど）、数日〜数十日おきに実施される交番検査（車両を建屋に入れて詳細に点検）、車内清掃、パンタグラフや台車部の点検、外板の洗浄などが一体的に行われ、次の運行へ整えられます。",
        "施設内には、大屋根で覆われた検修庫、パンタ検査用の高い足場、大規模な洗車機、留置線が広い扇状に伸び、車両を切り替える大量のポイントが敷かれています。新幹線の車両基地としては東海道・山陽で最大規模で、東京の大井車両基地とセットで、東海道新幹線の運行を東西から支える車両運用の要と言えます。",
        "見学は原則として一般開放されていませんが、周辺には摂津市が整備した「安満遺跡公園」など、線路とセットで新幹線を眺められるエリアもあります。車窓では減速中の数十秒ほど、じっくりと横目で楽しんでください。",
      ],
      en: [
        "Trains here undergo a graded set of inspections. Between short-term operations, quick 'shigyo' inspections check exterior and mechanical condition, listening for irregular noises. Every few days to weeks, more thorough 'kōban' inspections take place inside the depot buildings. On top of these, interior cleaning, pantograph and bogie checks, and washing of the exterior all happen here and prepare each train for the next run.",
        "The site holds long roofed inspection sheds, elevated platforms for pantograph work, large train-wash facilities, and long yard tracks fanning out into a wide grid. Torikai is the largest Shinkansen depot on the Tokaido / Sanyo network. Together with Oi Rail Yard in Tokyo, it forms the eastern and western anchor of the fleet-management system that keeps the Tokaido Shinkansen running.",
        "The depot itself is generally not open for public tours, but nearby parks such as Ama-Yato-iseki Park in Settsu City offer good vantage points to watch Shinkansen pass in front of the tracks. From the train, the slowing speed here means you have several tens of seconds to enjoy this backstage view — take your time.",
      ],
    },
    guideHighlight: {
      ja: "京都を過ぎて新大阪の手前、列車の速度がゆっくりになり始めたら、E席側の窓の外を見てください。白い新幹線が扇のように広がった留置線と、大屋根の検修庫、洗車機や高いパンタ検査用足場が次々と現れます。夜は照明に照らされた基地の中に、静かに眠る新幹線が並ぶ幻想的な光景を楽しめます。",
      en: "After Kyoto, as the train starts to slow before Shin-Osaka, watch the Seat E window closely. Rows of white Shinkansen fan out across the yard, followed by long inspection sheds, train-wash bays and tall pantograph inspection platforms. At night, illuminated tracks and quietly resting Shinkansen turn the whole scene into a hushed, almost dreamlike view.",
    },
    minutesFromTokyo: 141, side: "E", category: "notable", confidence: "source-backed", durationSec: 10, scene: "hills",
    image: "images/20260614_torikai_train_depot_yamato160.jpg",
    photoCredit: { ja: "@yamato160", en: "@yamato160", url: "https://x.com/yamato160/status/2066003172884365364" },
    photos: [
      {
        src: "images/20260629_torikai_train_depot_michikusa.jpg",
        alt: { ja: "新幹線から見える鳥飼車両基地", en: "Torikai Train Depot from the Shinkansen" },
        date: "2026-06-29",
        note: { ja: "白い列車がずらり", en: "Rows of white trains" },
      },
      {
        src: "images/20260629_torikai_train_depot_night_michikusa.jpg",
        timeOfDay: "night",
        alt: { ja: "夜の新幹線から見える鳥飼車両基地", en: "Torikai Train Depot at night from the Shinkansen" },
        date: "2026-06-29",
        note: { ja: "夜に眠る新幹線たち", en: "Shinkansen sleeping at night" },
      },
      {
        src: "images/20260712_torikai_depot_michikusa.jpg",
        alt: { ja: "朝の新幹線から見える鳥飼車両基地", en: "Torikai Train Depot from a morning Shinkansen" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-07-12",
        note: { ja: "検修庫と留置線の広がりが見える朝の車窓", en: "A morning view showing the inspection sheds and wide yard tracks." },
      },
    ],
    references: [REFERENCES.tokaidoShinkansen, REFERENCES.torikaiDepotWiki],
    map: { lat: 34.77598, lng: 135.5704782, ja: "鳥飼車両基地", en: "Torikai Train Depot" },
    viewpoint: { lat: 34.775259, lng: 135.571088 },
  },
];
