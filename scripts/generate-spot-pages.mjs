import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { thumbnailSrc, hasMiniMapCoordinates, miniMapViewpoint, mercatorPoint, miniMapZoomForViewpoint } from "./shared/geo.mjs";
import { assetVersion } from "./shared/asset-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const dataPath = path.join(appDir, "data.js");
const trackPath = path.join(appDir, "track.js");
const siteRoot = "https://www.michikusa-travel.com";
const CHECK_ONLY = process.argv.includes("--check");
// Fixed on purpose: the sitemap is a build artifact and must stay deterministic,
// so re-running the generator never rewrites every <lastmod>. Bump deliberately,
// or give the entry its own explicit lastmod below.
const DEFAULT_LASTMOD = "2026-07-25";
const GOOGLE_MAPS_EMBED_API_KEY = "AIzaSyDE3UdN_9m9cK5sLTlfuc7KElsfceYNwrs";

const dataCode = fs.readFileSync(dataPath, "utf8");
const { SPOTS, ROUTE } = vm.runInNewContext(`${dataCode}\n;({ SPOTS, ROUTE });`, {}, { filename: dataPath });
const SPOT_COUNT = SPOTS.length;
const SHARED_SPOT_LANGUAGES = new Set(["ja", "en"]);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
const trackContext = { window: { ROUTE }, ROUTE };
vm.runInNewContext(fs.readFileSync(trackPath, "utf8"), trackContext, { filename: trackPath });
const TRACK = trackContext.window.MADO_TRACK;

const featuredIds = [
  "fuji",
  "left-fuji",
  "hamanako",
  "odawara",
  "odawara-castle",
  "toji",
  "torikai-train-depot",
  "kiyosu",
  "hikone-castle",
  "solar-ark",
  "shimizu-port-chikyu",
  "shizuoka-tea-fields",
  "kakegawa",
  "ibuki",
  "seta-karahashi",
];

const UI = {
  ja: {
    brand: "新幹線の窓",
    navSearch: "列車検索へ",
    navGallery: "車窓図鑑へ",
    langSwitch: "English",
    eyebrow: "TOKAIDO SHINKANSEN WINDOW VIEW",
    titleSuffix: "の車窓ガイド | 新幹線の窓",
    titleQuestion: (name) => `${name}はいつ見える？座席側は？`,
    searchCta: "トップで列車検索する",
    appCta: "この見どころをアプリで開く",
    sectionHow: (name) => `${name}の見つけ方`,
    sectionPoint: "東海道新幹線の車窓としてのポイント",
    sectionPhotos: (name) => `写真で見る${name}`,
    sectionRefs: "参考リンク",
    sectionRelated: "近くの車窓も見る",
    facts: ["見える区間", "座席側", "タイミング", "写真"],
    photoUnit: "枚",
    routeNote: (area, side) => `東京から新大阪方面へ向かう場合は、${area || "この区間"}が近づいたら${side}の窓を少し早めに見てください。新大阪から東京方面へ向かう場合は、通過順が逆になります。`,
    pointText: (name) => `${name}は、富士山だけではない東海道新幹線の車窓を楽しむための見どころです。列車の速度が速いため、見える時間は短く、天気や座席位置によって見え方が変わります。`,
    sideA: "A席・海側",
    sideE: "E席・山側",
    sideBoth: "左右両側",
    hamanakoSide: "A席・海側 / E席・山側",
    minutes: (m) => Number.isFinite(Number(m)) ? `東京発のぞみ基準で約${Math.round(m)}分後` : "通過時刻は列車により変わります",
    relatedPrev: "ひとつ前",
    relatedNext: "つぎ",
    relatedCategory: "関連",
    fallbackCredit: "新幹線の窓",
    photoAlt: (name) => `${name}の新幹線車窓写真`,
    photoFallback: (name, index) => `${name}の車窓写真 ${index + 1}`,
    homeTitle: "Tokaido Shinkansen 車窓ガイド | 新幹線の窓",
    homeLead: "東海道新幹線から見える富士山、浜名湖、城、東寺、車両基地などを、写真と席側で確認できます。",
    homeCta: "アプリで列車検索する",
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "東京 → 新大阪の車窓",
    railCountSuffix: " の見どころ",
    railNowLabel: (name, min, seat) => `<b>${name}</b>東京から約${min}分 ・ ${seat}`,
    railCta: "乗る列車でガイドを作る",
    railLead: `列車を選ぶと、${SPOT_COUNT}景の見える時刻を実際のダイヤに合わせて表示します。`,
    railBottomCta: `この列車の時刻で${SPOT_COUNT}景を見る`,
    railFoot: "車窓図鑑で写真から探す →",
    railStationSuffix: "分",
    mobileSpotRailLabel: "東京から新大阪までの代表的な車窓",
    mobileSpotMeta: (min, seat) => `東京から約${min}分 · ${seat}席`,
    mobileSpotAction: "ガイドを読む",
    zoomHint: "クリックで拡大",
    photoSource: "元の投稿を見る",
    lightboxClose: "閉じる",
    guideTitle: "新幹線から富士山はいつ見える？どっち側？E席と時刻のFAQ | 新幹線の窓",
    guideLead: "東海道新幹線から富士山はいつ見える？のぞみなら東京から約40〜45分後、三島→新富士で約3〜4分。座席はE席側です。",
    guideHeading: "新幹線から富士山はいつ見える？どっち側？",
    guideBack: "アプリで列車検索する",
    guideQuestions: [
      {
        q: "新幹線から富士山はどちら側に見えますか？",
        a: "東海道新幹線では、東京から新大阪へ向かう場合も、新大阪から東京へ向かう場合も、富士山は主にE席側に見えます。ただし新富士から静岡付近では、短い時間だけA席側に見える「左富士」もあります。",
        link: "spots/left-fuji.html",
        linkText: "左富士を見る",
      },
      {
        q: "新幹線から富士山はいつ見えますか？",
        a: "いちばん大きく見えるのは三島から新富士付近です。天気がよければ品川から新横浜のあたりや、浜名湖付近など、離れた場所から見えることもあります。",
        link: "spots/fuji.html",
        linkText: "富士山の見どころを見る",
      },
      {
        q: "富士山以外に東海道新幹線の車窓で何が見えますか？",
        a: "相模湾、熱海、浜名湖、城、東寺、山、工場、看板などが次々に現れます。新幹線の窓は、富士山だけでなく移動そのものを楽しむための車窓ガイドです。",
        link: "index.html#gallery",
        linkText: "車窓図鑑を見る",
      },
    ],
  },
  en: {
    brand: "Shinkansen Window",
    navSearch: "Find my train",
    navGallery: "Field guide",
    langSwitch: "日本語",
    eyebrow: "TOKAIDO SHINKANSEN WINDOW VIEW",
    titleSuffix: "from the Tokaido Shinkansen | Shinkansen Window",
    titleQuestion: (name) => `When can you see ${name} from the Shinkansen?`,
    searchCta: "Find your train",
    appCta: "Open this view in the app",
    sectionHow: (name) => `How to find ${name}`,
    sectionPoint: "Why this view matters",
    sectionPhotos: (name) => `${name} in photos`,
    sectionRefs: "References",
    sectionRelated: "Nearby window views",
    facts: ["Section", "Seat side", "Timing", "Photos"],
    photoUnit: "photos",
    routeNote: (area, side) => `If you are traveling from Tokyo toward Shin-Osaka, start watching the ${side} window as you approach ${enApproachArea(area)}. If you are traveling toward Tokyo, the order is reversed.`,
    pointText: (name) => `${name} is one of the window views that make the Tokaido Shinkansen more than a transfer. The train moves fast, so visibility depends on weather, seat position, and timing.`,
    sideA: "Seat A · sea side",
    sideE: "Seat E · mountain side",
    sideBoth: "Both sides",
    hamanakoSide: "Seat A · sea side / Seat E · mountain side",
    minutes: (m) => Number.isFinite(Number(m)) ? `About ${Math.round(m)} minutes after leaving Tokyo on a Nozomi train` : "Timing varies by train",
    relatedPrev: "Previous",
    relatedNext: "Next",
    relatedCategory: "Related",
    fallbackCredit: "Shinkansen Window",
    photoAlt: (name) => `${name} from the Shinkansen window`,
    photoFallback: (name, index) => `${name} window photo ${index + 1}`,
    homeTitle: "Tokaido Shinkansen Window Views | Shinkansen Window",
    homeLead: "A field guide to Mt. Fuji, Lake Hamana, castles, To-ji Temple, train depots, and other views from the Tokaido Shinkansen.",
    homeCta: "Find your train in the app",
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "Tokyo → Shin-Osaka window",
    railCountSuffix: " views",
    railNowLabel: (name, min, seat) => `<b>${name}</b>About ${min} min from Tokyo · ${seat}`,
    railCta: "Build my guide by train",
    railLead: `Choose your train to turn all ${SPOT_COUNT} views into expected passing times for that service.`,
    railBottomCta: `Time all ${SPOT_COUNT} views to my train`,
    railFoot: "Browse by photo →",
    railStationSuffix: " min",
    mobileSpotRailLabel: "Recommended views from Tokyo to Shin-Osaka",
    mobileSpotMeta: (min, seat) => `~${min} min · Seat ${seat}`,
    mobileSpotAction: "Read the guide",
    zoomHint: "click to enlarge",
    photoSource: "View original post",
    lightboxClose: "Close",
    guideTitle: "When can you see Mt. Fuji from the Shinkansen? Seat side and timing FAQ | Shinkansen Window",
    guideLead: "On a Nozomi, start watching about 40-45 minutes after Tokyo, between Mishima and Shin-Fuji. Sit in Seat E.",
    guideHeading: "When can you see Mt. Fuji from the Shinkansen?",
    guideBack: "Find your train in the app",
    guideQuickFacts: [
      { label: "Best seat", value: "Seat E", detail: "The mountain-side window on the Tokaido Shinkansen." },
      { label: "From Tokyo", value: "40-45 min", detail: "Start looking before Mishima and Shin-Fuji." },
      { label: "View time", value: "About 3 min", detail: "Weather, speed, and seat position change the exact window." },
    ],
    guidePracticalTitle: "The short answer",
    guidePracticalBody: "Reserve Seat E, keep your camera ready before Shin-Fuji, and do not wait until Fuji is already beside you. The famous view is short. That is what makes it feel like a small event inside the journey.",
    guideFeaturedTitle: "Make the ride worth watching",
    guideFeaturedLead: "Fuji is the headline, but the Tokaido Shinkansen window keeps changing: sea, lakes, castles, factories, tiny signs, and Kyoto's pagoda. These are the kinds of views that make you look up again.",
    guideBeyondTitle: "Turn the window into a route",
    guideBeyondBody: "Choose your train in Shinkansen Window and the app lines up the views in time order. It is less a list of landmarks than a companion for the minutes between stations.",
    guideQuestions: [
      {
        q: "Which side of the Shinkansen is Mt. Fuji on?",
        a: "For the standard Tokaido Shinkansen Mt. Fuji view, choose Seat E. Seat E is the mountain-side window and works in both directions between Tokyo and Kyoto or Shin-Osaka. There is also a short Left-Side Fuji moment near Shin-Fuji to Shizuoka, when Fuji can appear on Seat A.",
        link: "spots/left-fuji.html",
        linkText: "See Left-Side Fuji",
      },
      {
        q: "When can you see Mt. Fuji from the Shinkansen?",
        a: "From Tokyo, start watching about 40-45 minutes after departure on a Nozomi train. The biggest view is around Mishima to Shin-Fuji and usually lasts only a few minutes. On clear days, you may also glimpse Fuji closer to Tokyo or farther west near Lake Hamana.",
        link: "spots/fuji.html",
        linkText: "See the Mt. Fuji view",
      },
      {
        q: "What else can you see from the Tokaido Shinkansen window?",
        a: "Sagami Bay, Atami, Lake Hamana, castles, To-ji Temple, mountains, factories, signs, and other short-lived views make the ride itself part of the journey.",
        link: "index.html#gallery",
        linkText: "Browse the field guide",
      },
    ],
  },
  "zh-Hant": {
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "東京 → 新大阪的車窗",
    railCountSuffix: " 個景色",
    railNowLabel: (name, min, seat) => `<b>${name}</b>東京出發約${min}分鐘 · ${seat}`,
    railCta: "依你的列車建立指南",
    railLead: `選擇列車後，可依實際班次查看${SPOT_COUNT}個景色的預計通過時間。`,
    railBottomCta: `依我的列車查看${SPOT_COUNT}個景色`,
    railFoot: `從照片瀏覽${SPOT_COUNT}個景色 →`,
    railStationSuffix: "分",
    mobileSpotRailLabel: "東京至新大阪的代表車窗景色",
    mobileSpotMeta: (min, seat) => `東京出發約${min}分鐘 · ${seat}座`,
    mobileSpotAction: "閱讀指南",
    sideA: "A座 · 海側",
    sideE: "E座 · 山側",
    sideBoth: "左右兩側",
    hamanakoSide: "A座 · 海側 / E座 · 山側",
  },
  "zh-Hans": {
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "东京 → 新大阪的车窗",
    railCountSuffix: " 个景色",
    railNowLabel: (name, min, seat) => `<b>${name}</b>从东京出发约${min}分钟 · ${seat}`,
    railCta: "按我的列车生成指南",
    railLead: `选择列车后，可按实际班次查看${SPOT_COUNT}个景色的预计经过时间。`,
    railBottomCta: `按我的列车查看${SPOT_COUNT}个景色`,
    railFoot: `从照片浏览${SPOT_COUNT}个景色 →`,
    railStationSuffix: "分",
    mobileSpotRailLabel: "东京至新大阪的代表性车窗景色",
    mobileSpotMeta: (min, seat) => `从东京出发约${min}分钟 · ${seat}座`,
    mobileSpotAction: "阅读指南",
    sideA: "A座 · 海侧",
    sideE: "E座 · 山侧",
    sideBoth: "左右两侧",
    hamanakoSide: "A座 · 海侧 / E座 · 山侧",
  },
  ko: {
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "도쿄 → 신오사카 차창",
    railCountSuffix: "개 풍경",
    railNowLabel: (name, min, seat) => `<b>${name}</b>도쿄에서 약 ${min}분 · ${seat}`,
    railCta: "내 열차로 가이드 만들기",
    railLead: `열차를 선택하면 ${SPOT_COUNT}개 풍경의 예상 통과 시간을 실제 운행에 맞춰 볼 수 있습니다.`,
    railBottomCta: `내 열차 시간으로 ${SPOT_COUNT}개 풍경 보기`,
    railFoot: `사진으로 ${SPOT_COUNT}개 풍경 보기 →`,
    railStationSuffix: "분",
    mobileSpotRailLabel: "도쿄에서 신오사카까지의 대표 차창 풍경",
    mobileSpotMeta: (min, seat) => `도쿄에서 약 ${min}분 · ${seat}석`,
    mobileSpotAction: "가이드 보기",
    sideA: "A석 · 바다 쪽",
    sideE: "E석 · 산 쪽",
    sideBoth: "양쪽",
    hamanakoSide: "A석 · 바다 쪽 / E석 · 산 쪽",
  },
  fr: {
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "Vues Tokyo → Shin-Osaka",
    railCountSuffix: " vues",
    railNowLabel: (name, min, seat) => `<b>${name}</b> À environ ${min} min de Tokyo · ${seat}`,
    railCta: "Créer le guide de mon train",
    railLead: `Choisissez votre train pour connaître l'heure de passage prévue devant chacune des ${SPOT_COUNT} vues.`,
    railBottomCta: `Voir les ${SPOT_COUNT} vues à l'heure de mon train`,
    railFoot: `Parcourir les ${SPOT_COUNT} vues en photos →`,
    railStationSuffix: " min",
    mobileSpotRailLabel: "Vues emblématiques entre Tokyo et Shin-Osaka",
    mobileSpotMeta: (min, seat) => `À environ ${min} min · siège ${seat}`,
    mobileSpotAction: "Lire le guide",
    sideA: "Siège A · côté mer",
    sideE: "Siège E · côté montagne",
    sideBoth: "Des deux côtés",
    hamanakoSide: "Siège A · côté mer / siège E · côté montagne",
  },
};

const GUIDE_RAIL_LOCALIZATION = {
  "zh-Hant": {
    stations: {
      Tokyo: "東京", Shinagawa: "品川", "Shin-Yokohama": "新橫濱", Odawara: "小田原",
      Atami: "熱海", Mishima: "三島", "Shin-Fuji": "新富士", Shizuoka: "靜岡",
      Kakegawa: "掛川", Hamamatsu: "濱松", Toyohashi: "豐橋", "Mikawa-Anjo": "三河安城",
      Nagoya: "名古屋", "Gifu-Hashima": "岐阜羽島", Maibara: "米原", Kyoto: "京都", "Shin-Osaka": "新大阪",
    },
    spots: {
      "tokyo-tower": "東京鐵塔", "ota-fuji": "大田區的富士山", "maruko-bridge": "丸子橋",
      "musashi-kosugi-towers": "武藏小杉高樓群", "sagami-fuji": "相模平原遠眺富士山",
      "727-board": "727與248號看板", hinataoka: "日向岡山坡住宅區", "putiputi-sign": "「我是誰？」看板",
      "odawara-castle": "小田原城", "gyoran-kannon": "魚籃大觀音像", odawara: "熱海與相模灣",
      fuji: "富士山", "shimizu-port-chikyu": "清水港與CHIKYU深海探查船", granship: "格蘭希普", "left-fuji": "左富士",
      "shizuoka-tea-fields": "靜岡茶園", kakegawa: "掛川城", "genki-sign": "しっぺい加油看板",
      hamanako: "濱名湖", "hamanako-fuji": "濱名湖遠眺富士山", "toyohashi-tateiwa": "豐橋立岩巨石",
      "mikawa-oshima": "三河大島", "nichiban-anjo": "CELLOTAPE牆面看板",
      "nagoya-station-skyline": "名古屋站前天際線", "kirin-beer-factory": "麒麟啤酒工廠",
      kiyosu: "清洲城", "solar-ark": "Solar Ark太陽能設施", "gifu-castle": "岐阜城",
      kinshozan: "金生山", "nangu-taisha": "南宮大社大鳥居", ibuki: "伊吹山",
      "sawayama-castle": "佐和山城跡", "hikone-castle": "彦根城", "kannonji-castle": "觀音寺城跡",
      "omi-fuji": "近江富士", "seta-karahashi": "瀨田唐橋", toji: "東寺五重塔",
      "torikai-train-depot": "鳥飼新幹線車輛基地",
    },
  },
  "zh-Hans": {
    stations: {
      Tokyo: "东京", Shinagawa: "品川", "Shin-Yokohama": "新横滨", Odawara: "小田原",
      Atami: "热海", Mishima: "三岛", "Shin-Fuji": "新富士", Shizuoka: "静冈",
      Kakegawa: "挂川", Hamamatsu: "滨松", Toyohashi: "丰桥", "Mikawa-Anjo": "三河安城",
      Nagoya: "名古屋", "Gifu-Hashima": "岐阜羽岛", Maibara: "米原", Kyoto: "京都", "Shin-Osaka": "新大阪",
    },
    spots: {
      "tokyo-tower": "东京塔", "ota-fuji": "大田区远眺富士山", "maruko-bridge": "丸子桥",
      "musashi-kosugi-towers": "武藏小杉高楼群", "sagami-fuji": "相模平原远眺富士山",
      "727-board": "727与248号广告牌", hinataoka: "日向冈山坡住宅区", "putiputi-sign": "“我是谁？”广告牌",
      "odawara-castle": "小田原城", "gyoran-kannon": "鱼篮大观音像", odawara: "热海与相模湾",
      fuji: "富士山", "shimizu-port-chikyu": "清水港与CHIKYU深海钻探船", granship: "格兰希普", "left-fuji": "左富士",
      "shizuoka-tea-fields": "静冈茶园", kakegawa: "挂川城", "genki-sign": "悉平加油广告牌",
      hamanako: "滨名湖", "hamanako-fuji": "滨名湖远眺富士山", "toyohashi-tateiwa": "丰桥立岩巨石",
      "mikawa-oshima": "三河大岛", "nichiban-anjo": "CELLOTAPE墙面广告",
      "nagoya-station-skyline": "名古屋站前天际线", "kirin-beer-factory": "麒麟啤酒工厂",
      kiyosu: "清洲城", "solar-ark": "Solar Ark太阳能设施", "gifu-castle": "岐阜城",
      kinshozan: "金生山", "nangu-taisha": "南宫大社大鸟居", ibuki: "伊吹山",
      "sawayama-castle": "佐和山城遗址", "hikone-castle": "彦根城", "kannonji-castle": "观音寺城遗址",
      "omi-fuji": "近江富士", "seta-karahashi": "濑田唐桥", toji: "东寺五重塔",
      "torikai-train-depot": "鸟饲新干线车辆基地",
    },
  },
  ko: {
    stations: {
      Tokyo: "도쿄", Shinagawa: "시나가와", "Shin-Yokohama": "신요코하마", Odawara: "오다와라",
      Atami: "아타미", Mishima: "미시마", "Shin-Fuji": "신후지", Shizuoka: "시즈오카",
      Kakegawa: "가케가와", Hamamatsu: "하마마쓰", Toyohashi: "도요하시", "Mikawa-Anjo": "미카와안조",
      Nagoya: "나고야", "Gifu-Hashima": "기후하시마", Maibara: "마이바라", Kyoto: "교토", "Shin-Osaka": "신오사카",
    },
    spots: {
      "tokyo-tower": "도쿄 타워", "ota-fuji": "오타에서 보이는 후지산", "maruko-bridge": "마루코교",
      "musashi-kosugi-towers": "무사시코스기 타워맨션", "sagami-fuji": "사가미 평야 너머의 후지산",
      "727-board": "727·248 간판", hinataoka: "히나타오카 언덕 주택가", "putiputi-sign": "「나는 누구일까요?」 간판",
      "odawara-castle": "오다와라성", "gyoran-kannon": "교란 관음상", odawara: "아타미와 사가미만",
      fuji: "후지산", "shimizu-port-chikyu": "시미즈항과 CHIKYU 심해 시추선", granship: "그랜십", "left-fuji": "왼쪽 후지산",
      "shizuoka-tea-fields": "시즈오카 차밭", kakegawa: "가케가와성", "genki-sign": "싯페이 응원 간판",
      hamanako: "하마나호", "hamanako-fuji": "하마나호 너머의 후지산", "toyohashi-tateiwa": "도요하시 다테이와 바위",
      "mikawa-oshima": "미카와오시마", "nichiban-anjo": "CELLOTAPE 벽 간판",
      "nagoya-station-skyline": "나고야역 스카이라인", "kirin-beer-factory": "기린 맥주 공장",
      kiyosu: "기요스성", "solar-ark": "솔라 아크 태양광 시설", "gifu-castle": "기후성",
      kinshozan: "긴쇼산", "nangu-taisha": "난구 다이샤 대도리이", ibuki: "이부키산",
      "sawayama-castle": "사와야마성 유적", "hikone-castle": "히코네성", "kannonji-castle": "간논지성 유적",
      "omi-fuji": "오미후지", "seta-karahashi": "세타노 가라하시", toji: "도지 오층탑",
      "torikai-train-depot": "도리카이 신칸센 차량기지",
    },
  },
  fr: {
    stations: {
      Tokyo: "Tokyo", Shinagawa: "Shinagawa", "Shin-Yokohama": "Shin-Yokohama", Odawara: "Odawara",
      Atami: "Atami", Mishima: "Mishima", "Shin-Fuji": "Shin-Fuji", Shizuoka: "Shizuoka",
      Kakegawa: "Kakegawa", Hamamatsu: "Hamamatsu", Toyohashi: "Toyohashi", "Mikawa-Anjo": "Mikawa-Anjo",
      Nagoya: "Nagoya", "Gifu-Hashima": "Gifu-Hashima", Maibara: "Maibara", Kyoto: "Kyoto", "Shin-Osaka": "Shin-Osaka",
    },
    spots: {
      "tokyo-tower": "Tour de Tokyo", "ota-fuji": "Mont Fuji depuis Ota", "maruko-bridge": "Pont Maruko",
      "musashi-kosugi-towers": "Tours de Musashi-Kosugi", "sagami-fuji": "Mont Fuji au-delà de la plaine de Sagami",
      "727-board": "Panneaux 727 et 248", hinataoka: "Maisons sur la colline de Hinataoka", "putiputi-sign": "Panneau « Qui suis-je ? »",
      "odawara-castle": "Château d'Odawara", "gyoran-kannon": "Grande statue de Gyoran Kannon", odawara: "Atami et baie de Sagami",
      fuji: "Mont Fuji", "shimizu-port-chikyu": "Port de Shimizu et navire CHIKYU", granship: "Granship", "left-fuji": "Fuji côté gauche",
      "shizuoka-tea-fields": "Champs de thé de Shizuoka", kakegawa: "Château de Kakegawa", "genki-sign": "Panneau d'encouragement Shippei",
      hamanako: "Lac Hamana", "hamanako-fuji": "Mont Fuji depuis le lac Hamana", "toyohashi-tateiwa": "Rocher Tateiwa de Toyohashi",
      "mikawa-oshima": "Île de Mikawa-Oshima", "nichiban-anjo": "Façade CELLOTAPE",
      "nagoya-station-skyline": "Panorama de la gare de Nagoya", "kirin-beer-factory": "Brasserie Kirin",
      kiyosu: "Château de Kiyosu", "solar-ark": "Centrale solaire Solar Ark", "gifu-castle": "Château de Gifu",
      kinshozan: "Mont Kinshozan", "nangu-taisha": "Grand torii de Nangu Taisha", ibuki: "Mont Ibuki",
      "sawayama-castle": "Ruines du château de Sawayama", "hikone-castle": "Château de Hikone", "kannonji-castle": "Ruines du château de Kannonji",
      "omi-fuji": "Omi Fuji", "seta-karahashi": "Pont Seta no Karahashi", toji: "Pagode à cinq étages de To-ji",
      "torikai-train-depot": "Dépôt Shinkansen de Torikai",
    },
  },
};

const GUIDE_MOBILE_SPOTS = [
  { id: "tokyo-tower", min: 3, seat: "E" },
  { id: "odawara", min: 36, seat: "A" },
  { id: "fuji", min: 43, seat: "E" },
  { id: "hamanako", min: 73, seat: "E" },
  { id: "solar-ark", min: 103, seat: "E" },
  { id: "toji", min: 131, seat: "A" },
];

const GUIDE_MOBILE_SPOT_NAMES = {
  ja: {
    "tokyo-tower": "東京タワー", odawara: "熱海と相模湾", fuji: "富士山",
    hamanako: "浜名湖", "solar-ark": "ソーラーアーク", toji: "東寺五重塔",
  },
  en: {
    "tokyo-tower": "Tokyo Tower", odawara: "Atami & Sagami Bay", fuji: "Mt. Fuji",
    hamanako: "Lake Hamana", "solar-ark": "Solar Ark", toji: "Toji Five-Story Pagoda",
  },
  "zh-Hant": {
    "tokyo-tower": "東京鐵塔", odawara: "熱海與相模灣", fuji: "富士山",
    hamanako: "濱名湖", "solar-ark": "Solar Ark", toji: "東寺五重塔",
  },
  "zh-Hans": {
    "tokyo-tower": "东京塔", odawara: "热海与相模湾", fuji: "富士山",
    hamanako: "滨名湖", "solar-ark": "Solar Ark", toji: "东寺五重塔",
  },
  ko: {
    "tokyo-tower": "도쿄 타워", odawara: "아타미와 사가미만", fuji: "후지산",
    hamanako: "하마나호", "solar-ark": "솔라 아크", toji: "도지 오층탑",
  },
  fr: {
    "tokyo-tower": "Tour de Tokyo", odawara: "Atami et baie de Sagami", fuji: "Mont Fuji",
    hamanako: "Lac Hamana", "solar-ark": "Solar Ark", toji: "Pagode de To-ji",
  },
};

const GUIDE_MOBILE_SPOT_HOOKS = {
  "zh-Hant": {
    "tokyo-tower": "東京天空中的紅色高塔。", odawara: "穿過隧道，海景豁然展開。", fuji: "日本最知名的三分鐘。",
    hamanako: "列車像在湖面上奔馳。", "solar-ark": "即將告別的太陽之船。", toji: "一眼就知道，京都到了。",
  },
  "zh-Hans": {
    "tokyo-tower": "东京天空中的红色高塔。", odawara: "穿过隧道，海景豁然展开。", fuji: "日本最著名的三分钟。",
    hamanako: "列车仿佛行驶在湖面上。", "solar-ark": "即将告别的太阳之船。", toji: "一眼就知道，京都到了。",
  },
  ko: {
    "tokyo-tower": "도쿄 하늘의 붉은 타워.", odawara: "터널 사이로 바다가 열립니다.", fuji: "일본에서 가장 유명한 3분.",
    hamanako: "열차가 호수 위를 달립니다.", "solar-ark": "곧 마지막이 될 태양의 배.", toji: "교토에 왔다는 것을 단번에 알 수 있습니다.",
  },
  fr: {
    "tokyo-tower": "La tour rouge dans le ciel de Tokyo.", odawara: "Entre deux tunnels, la mer apparaît.", fuji: "Les trois minutes les plus célèbres du Japon.",
    hamanako: "Le train semble glisser sur le lac.", "solar-ark": "Le vaisseau solaire bientôt disparu.", toji: "Un seul regard suffit : vous êtes à Kyoto.",
  },
};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(value) {
  return escapeHTML(value).replace(/\s+/g, " ").trim();
}

function rawText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function localized(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.ja || value.en || "";
}

function jaAreaPhrase(area) {
  if (!area) return "この区間";
  return /付近|前後|あたり|区間/.test(area) ? area : `${area}付近`;
}

function enAreaPhrase(area) {
  if (!area) return "this section";
  if (/^Around\b/i.test(area)) return `around ${area.replace(/^Around\s+/i, "")}`;
  if (area.includes("→")) return `in the ${area} section`;
  return `around ${area}`;
}

function enApproachArea(area) {
  if (!area) return "this section";
  return area.replace(/^(Around|Just before|Just after)\s+/i, "");
}

function pagePath(lang, spotId = "") {
  if (spotId) return lang === "ja" ? `/spots/${spotId}.html` : `/en/spots/${spotId}.html`;
  return lang === "ja" ? "/" : "/en/";
}

function pageUrl(lang, spotId = "") {
  return `${siteRoot}${pagePath(lang, spotId)}`;
}

function appHref(lang, spotId = "", prefix = "../") {
  const hash = spotId ? `#spot-${spotId}` : "#journey";
  return lang === "en" ? `${prefix}en/${hash}` : `${prefix}index.html${hash}`;
}

function liveHref(lang, prefix = "../") {
  return lang === "en" ? `${prefix}en/live/` : `${prefix}live/`;
}

function languageSwitchHref(lang, spotId) {
  return lang === "ja" ? `../en/spots/${spotId}.html` : `../../spots/${spotId}.html`;
}

function siteHeaderHTML(lang, prefix, jaHref, enHref, options = {}) {
  const ui = UI[lang];
  const tag = options.tag || "header";
  const staticAttr = options.staticMarker ? ` data-spot-page-shared-static="${options.staticMarker}"` : "";
  const homeHref = lang === "en" ? `${prefix}en/` : `${prefix}index.html`;
  const jaActive = lang === "ja" ? " active" : "";
  const enActive = lang === "en" ? " active" : "";
  return `<${tag} class="topbar"${staticAttr}>
    <a class="brand" href="${homeHref}">
      <span class="brand-mark">窓</span>
      <span class="brand-text">
        <span class="brand-name">${escapeHTML(ui.brand)}</span>
        <small class="brand-sub">${lang === "ja" ? "旅の瞬間を見逃さない" : "Never miss a moment of the journey."}</small>
      </span>
    </a>
    <nav class="top-nav" aria-label="Primary">
      <a href="${lang === "en" ? `${prefix}en/#journey` : `${prefix}index.html#journey`}">${lang === "ja" ? "列車選択" : "Train Search"}</a>
      <a href="${liveHref(lang, prefix)}">${lang === "ja" ? "ライブガイド" : "Live Guide"}</a>
      <a href="${lang === "en" ? `${prefix}en/zukan.html` : `${prefix}zukan.html`}">${lang === "ja" ? "車窓図鑑" : "Field Guide"}</a>
      <a class="top-nav-overflow" href="${prefix}${lang === "en" ? "en/" : ""}guide.html">${lang === "ja" ? "FAQ" : "FAQ"}</a>
      <a href="${lang === "en" ? `${prefix}en/journal.html` : `${prefix}journal.html`}">${lang === "ja" ? "メダル帖" : "Journal"}</a>
      <details class="top-nav-more">
        <summary>${lang === "ja" ? "もっと見る" : "More"}</summary>
        <div class="top-nav-menu">
          <a class="top-nav-menu-compact" href="${prefix}${lang === "en" ? "en/" : ""}guide.html">${lang === "ja" ? "FAQ" : "FAQ"}</a>
          <a href="${lang === "en" ? `${prefix}en/lp.html` : `${prefix}lp.html`}">${lang === "ja" ? "新幹線の窓とは" : "About this app"}</a>
          <a href="${lang === "en" ? `${prefix}en/mieru.html` : `${prefix}mieru.html`}">${lang === "ja" ? "今日、富士山は見えるか" : "Visibility β"}</a>
          <a href="${lang === "en" ? `${prefix}en/sumie.html` : `${prefix}sumie.html`}">${lang === "ja" ? "墨絵車窓" : "Sumie Window"}</a>
          <a href="${lang === "en" ? `${prefix}en/somato.html` : `${prefix}somato.html`}">${lang === "ja" ? "車窓走馬灯" : "Window Journey"}</a>
          <a href="${lang === "en" ? `${prefix}en/references.html` : `${prefix}references.html`}">${lang === "ja" ? "リンク集" : "Links"}</a>
          <a href="${prefix}${lang === "en" ? "en/" : ""}contact.html">${lang === "ja" ? "お問い合わせ" : "Contact"}</a>
          <a href="${lang === "en" ? `${prefix}en/privacy.html` : `${prefix}privacy.html`}">${lang === "ja" ? "プライバシーポリシー" : "Privacy Policy"}</a>
        </div>
      </details>
    </nav>
    <div class="lang-switch" role="group" aria-label="Language">
      <a class="${jaActive.trim()}" href="${escapeHTML(lang === "en" ? `${jaHref}${jaHref.includes("?") ? "&" : "?"}lang=ja` : jaHref)}">日本語</a>
      <a class="${enActive.trim()}" href="${escapeHTML(enHref)}">EN</a>
    </div>
  </${tag}>`;
}

function contentRailHTML(lang, prefix, options = {}) {
  const staticAttr = options.staticMarker ? ` data-spot-page-shared-static="${options.staticMarker}"` : "";
  const guideHref = lang === "en" ? `${prefix}en/?intro=1` : `${prefix}lp.html`;
  const items = lang === "en" ? [
    { href: `${prefix}en/guide.html`, img: "images/thumbs/content-faq.webp", label: "FAQ", title: "Mt. Fuji FAQ", desc: "Check the timing, seat side and cloudy-day answers." },
    { href: `${prefix}en/mieru.html`, img: "images/thumbs/content-mieru.webp", label: "FORECAST", title: "Visibility β", desc: "Check whether Mt. Fuji is likely to show today." },
    { href: `${prefix}en/sumie.html`, img: "images/thumbs/content-sumie.webp", label: "EXTRA", title: "Sumie Window", desc: "Ride the route as a quiet ink-painting window." },
    { href: `${prefix}en/somato.html`, img: "images/thumbs/content-somato.webp", label: "EXTRA", title: "Window Journey", desc: "Let real window photos flow past like a short trip." },
    { href: `${prefix}en/journal.html`, img: "images/stamps/stamp_fuji.svg", label: "JOURNAL", title: "Stamps and medals", desc: "Keep the views you found during the ride." },
    { href: guideHref, img: "images/thumbs/og-shinkansen-window.webp", label: "GUIDE", title: "About this app", desc: "See how to use and enjoy it in 30 seconds." },
    { href: `${prefix}en/references.html`, img: "images/thumbs/20260616_fuji_sttraveler.webp", label: "LINKS", title: "Window links", desc: "Sources and reading for deeper window-view trips." },
    { href: `${prefix}en/contact.html`, img: "images/thumbs/content-contact.webp", label: "CONTACT", title: "Contact", desc: "Send photo suggestions, corrections or feedback." },
  ] : [
    { href: `${prefix}guide.html`, img: "images/thumbs/content-faq.webp", label: "FAQ", title: "富士山FAQ", desc: "見える時刻、座席側、曇りの日の答えを確認。" },
    { href: `${prefix}mieru.html`, img: "images/thumbs/content-mieru.webp", label: "FORECAST", title: "今日の富士山 見える予報", desc: "今日の空で富士山が見えそうかを確認。" },
    { href: `${prefix}sumie.html`, img: "images/thumbs/content-sumie.webp", label: "EXTRA", title: "墨絵車窓", desc: "東海道新幹線の車窓を、静かな墨絵で。" },
    { href: `${prefix}somato.html`, img: "images/thumbs/content-somato.webp", label: "EXTRA", title: "車窓走馬灯", desc: "実際の車窓写真で、旅を短くめぐる。" },
    { href: `${prefix}journal.html`, img: "images/stamps/stamp_fuji.svg", label: "JOURNAL", title: "メダル帖", desc: "見つけた景色をスタンプとメダルで記録。" },
    { href: guideHref, img: "images/thumbs/og-shinkansen-window.webp", label: "GUIDE", title: "新幹線の窓とは", desc: "使い方と楽しみ方を30秒で紹介。" },
    { href: `${prefix}references.html`, img: "images/thumbs/20260616_fuji_sttraveler.webp", label: "LINKS", title: "車窓リンク集", desc: "出典や参考記事をまとめて読む。" },
    { href: `${prefix}contact.html`, img: "images/thumbs/content-contact.webp", label: "CONTACT", title: "お問い合わせ", desc: "写真提供、情報の訂正、ご感想はこちら。" },
  ];
  return `<section class="content-rail-section"${staticAttr} aria-labelledby="contentRailTitle">
    <div class="section-head">
      <p class="eyebrow">${lang === "en" ? "MORE TO TRY" : "MORE TO TRY"}</p>
      <h2 id="contentRailTitle">${lang === "en" ? "More ways to enjoy the window" : "車窓をもっと楽しむ"}</h2>
    </div>
    <div class="content-rail">
${items.map((item) => `      <a class="content-rail-card" href="${item.href}">
        <img src="${prefix}${item.img}" alt="" loading="lazy" decoding="async">
        <span class="content-rail-card-body">
          <small>${item.label}</small>
          <strong>${item.title}</strong>
          <span>${item.desc}</span>
        </span>
      </a>`).join("\n")}
    </div>
  </section>`;
}

function analyticsSnippet() {
  return `<script>
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
        if (params.get("ga") === "off" || params.get("ga_optout") === "1") {
          localStorage.setItem(optoutKey, "1");
        }
        if (params.get("ga") === "on" || params.get("ga_optout") === "0") {
          localStorage.removeItem(optoutKey);
        }
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
  </script>`;
}

function embeddedHeadHTML(prefix) {
  return `<script src="${prefix}app-embedded.js?v=${assetVersion("app-embedded.js")}"></script>
  <link rel="stylesheet" href="${prefix}app-embedded.css?v=${assetVersion("app-embedded.css")}">`;
}

function referenceUrl(ref, lang) {
  return localized(ref?.url, lang) || localized(ref?.url, "ja") || ref?.url || "";
}
function bodyLinksHTML(spot, lang) {
  const sourceLinks = [...(spot.bodyLinks || []), ...(spot.references || [])];
  const seen = new Set();
  const links = sourceLinks.map((item) => {
    const ref = item.ref || item;
    const href = item.url ? (localized(item.url, lang) || localized(item.url, "ja")) : referenceUrl(ref, lang);
    const label = localized(item.label, lang) || localized(ref.label, lang);
    if (!href || !label) return "";
    if (seen.has(href)) return "";
    seen.add(href);
    return `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${text(label)}</a>`;
  }).filter(Boolean);
  const prefix = lang === "ja" ? "もっと見る:" : "More:";
  return links.length ? `<p class="spot-page-body-links"><span>${prefix}</span> ${links.join("<span aria-hidden=\"true\"> / </span>")}</p>` : "";
}

function absoluteImageUrl(spot) {
  const image = spot.image || spot.photos?.[0]?.src || "images/og-shinkansen-window.png";
  return `${siteRoot}/${image}`;
}

function defaultOgImageUrl() {
  return `${siteRoot}/images/og-shinkansen-window.png`;
}

function isOwnPhotoSrc(src) {
  return typeof src === "string" && /michikusa/i.test(src);
}

function spotOgImageUrl(spot) {
  if (spot.ogImage) return `${siteRoot}/${spot.ogImage}`;
  if (isOwnPhotoSrc(spot.image)) return `${siteRoot}/${spot.image}`;
  const ownPhoto = (spot.photos || []).find((p) => isOwnPhotoSrc(p?.src));
  if (ownPhoto) return `${siteRoot}/${ownPhoto.src}`;
  return defaultOgImageUrl();
}

function sideLabel(spot, lang) {
  const ui = UI[lang];
  if (spot.id === "hamanako") return ui.hamanakoSide;
  if (localized(spot.sideLabel, lang)) return localized(spot.sideLabel, lang);
  if (spot.side === "A") return ui.sideA;
  if (spot.side === "E") return ui.sideE;
  return ui.sideBoth;
}

function description(spot, lang) {
  const data = spot[lang] || spot.ja || {};
  if (lang === "ja") {
    const firstSentence = rawText(data.story).split("。").filter(Boolean)[0] || data.hook || "";
    const suffix = "。";
    return text(`${data.name}は東海道新幹線の車窓から見えるスポットです。${sideLabel(spot, lang)}、${jaAreaPhrase(data.area)}。${firstSentence}${suffix}`);
  }
  const firstSentence = rawText(data.hook || data.story || "");
  const suffix = /[.!?]$/.test(firstSentence) ? "" : ".";
  return text(`${data.name} is a Tokaido Shinkansen window view ${enAreaPhrase(data.area)}. Watch from ${sideLabel(spot, lang)}. ${firstSentence}${suffix}`);
}

function creditText(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.ja || value.en || "";
}

function ownPhotoItems(spot, lang) {
  const data = spot[lang] || spot.ja || {};
  const main = spot.image
    ? [{
        src: spot.image,
        alt: { ja: `${spot.ja.name}の新幹線車窓写真`, en: `${data.name} from the Shinkansen window` },
        credit: spot.photoCredit,
        sourceUrl: spot.photoCredit?.url,
        date: spot.photoCredit?.date,
        note: spot.photoCredit?.note,
      }]
    : [];
  return [...main, ...(spot.photos || []).filter((item) => item.role !== "reference")].filter((item) => item.src);
}

function photoItems(spot, lang) {
  const items = [...ownPhotoItems(spot, lang)];
  for (const id of spot.pagePhotoSpotIds || []) {
    const linkedSpot = SPOTS.find((item) => item.id === id);
    if (linkedSpot) items.push(...ownPhotoItems(linkedSpot, lang));
  }
  const seen = new Set();
  return items.filter((item) => {
    if (!item.src || seen.has(item.src)) return false;
    if (item.illustration) return false;
    seen.add(item.src);
    return true;
  });
}

/* ===== 左ペイン & 本文写真の差し込み =====
 *
 * PCでスポットページに着地したユーザーに、東海道新幹線の見どころ全体を
 * 意識させて列車検索・他スポットへの回遊を促す。
 * モバイルではレールを隠し、記事末尾の CTA に任せる。 */

const INLINE_PHOTO_CATEGORIES = new Set(["classic", "notable"]);
// 主画像と意味が違う写真だけを本文に差し込む。ファイル名の一部で指定する（インデックスだと
// spot.photos に1枚足しただけで別の写真を指してしまうため）。
const CURATED_ANGLE_PHOTOS = {
  hamanako: ["hamanako_torii_letus10"], // 主画像は E 席。反対の A 席・赤鳥居を見せる
};
const RAIL_THUMB_CATEGORIES = new Set(["classic", "notable"]);

/** 本文に差し込む写真を選ぶ。主画像と別の視点（反対席側／夜景）に限定する */
function inlinePhotoIndices(spot) {
  if (!INLINE_PHOTO_CATEGORIES.has(spot.category)) return [];
  const photos = spot.photos || [];
  const picks = new Set();
  (CURATED_ANGLE_PHOTOS[spot.id] || []).forEach((needle) => {
    const index = photos.findIndex((photo) => String(photo?.src || "").includes(needle));
    if (index >= 0) picks.add(index);
  });
  const nightIdx = photos.findIndex((p) => p.timeOfDay === "night");
  if (nightIdx >= 0) picks.add(nightIdx);
  return [...picks].slice(0, 2);
}

/** ギャラリー用の写真リストから、本文に回した分を除外する */
function galleryItems(spot, lang) {
  const inline = new Set(inlinePhotoIndices(spot).map((i) => (spot.photos || [])[i]?.src).filter(Boolean));
  return photoItems(spot, lang).filter((item) => !inline.has(item.src));
}

/** 本文内図（クリックで拡大） */
function inlineFigureHTML(spot, lang, prefix) {
  const indices = inlinePhotoIndices(spot);
  if (!indices.length) return { first: "", second: "" };
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const render = (idx) => {
    const item = (spot.photos || [])[idx];
    if (!item?.src) return "";
    const alt = localized(item.alt, lang) || ui.photoAlt(data.name);
    const note = localized(item.note, lang);
    const credit = creditText(item.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
    const href = item.sourceUrl || item.url || "";
    const creditHTML = href
      ? `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
      : escapeHTML(credit);
    const date = item.date ? `<span>${escapeHTML(item.date)}</span>` : "";
    const zoomSrc = `${prefix}${escapeHTML(item.src)}`; // 原寸への差し替え用
    return `<figure class="spot-page-inline-figure">
        <button type="button" class="spot-page-inline-zoom" data-zoom-src="${zoomSrc}" aria-label="${escapeHTML(note || alt)}">
          <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(item.src))}" alt="${escapeHTML(alt)}">
        </button>
        <figcaption>${note ? `<strong>${escapeHTML(note)}</strong>` : ""}<span>${creditHTML}</span>${date}<span class="spot-page-zoom-hint">${escapeHTML(ui.zoomHint)}</span></figcaption>
      </figure>`;
  };
  return { first: render(indices[0]), second: render(indices[1]) };
}

/** 主画像のキャプション（説明文＋出典リンク＋撮影日） */
function heroFigcaptionHTML(spot, lang) {
  const ui = UI[lang];
  const pc = spot.photoCredit || {};
  const note = localized(pc.note, lang);
  const credit = creditText(pc, lang) || ui.fallbackCredit;
  const creditHTML = pc.url
    ? `<a href="${escapeHTML(pc.url)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
    : escapeHTML(credit);
  const bits = [];
  if (note) bits.push(`<strong>${escapeHTML(note)}</strong>`);
  bits.push(`<span>${creditHTML}</span>`);
  if (pc.date) bits.push(`<span>${escapeHTML(pc.date)}</span>`);
  return `<figcaption>${bits.join("")}</figcaption>`;
}

function spotHeroGalleryHTML(spot, lang, prefix) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const items = photoItems(spot, lang);
  if (!items.length) return "";
  const first = items[0];
  const captionHTML = (item) => {
    const note = localized(item.note, lang) || ui.photoAlt(data.name);
    const credit = creditText(item.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
    const href = item.sourceUrl || item.url || "";
    const creditHTML = href
      ? `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
      : escapeHTML(credit);
    const sourceLink = href
      ? `<a data-gallery-source-output class="spot-page-gallery-source" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(ui.photoSource)}</a>`
      : `<a data-gallery-source-output class="spot-page-gallery-source" hidden></a>`;
    return `<figcaption aria-live="polite">
          <strong data-gallery-note-output>${escapeHTML(note)}</strong>
          <span data-gallery-credit-output>${creditHTML}</span>
          <span data-gallery-date-output>${escapeHTML(item.date || "")}</span>
          ${sourceLink}
        </figcaption>`;
  };
  const thumbs = items.map((item, index) => {
    const alt = localized(item.alt, lang) || ui.photoAlt(data.name);
    const note = localized(item.note, lang) || alt;
    const credit = creditText(item.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
    const href = item.sourceUrl || item.url || "";
    return `<button type="button" class="spot-photo-thumb${index === 0 ? " active" : ""}" data-gallery-thumb data-gallery-src="${prefix}${escapeHTML(item.src)}" data-gallery-alt="${escapeHTML(alt)}" data-gallery-note="${escapeHTML(note)}" data-gallery-credit="${escapeHTML(credit)}" data-gallery-credit-href="${escapeHTML(href)}" data-gallery-date="${escapeHTML(item.date || "")}" aria-label="${escapeHTML(`${note}を表示`)}" aria-pressed="${index === 0 ? "true" : "false"}">
          <img src="${prefix}${escapeHTML(thumbnailSrc(item.src))}" alt="" loading="${index === 0 ? "eager" : "lazy"}" decoding="async">
        </button>`;
  }).join("\n        ");
  const firstHref = first.sourceUrl || first.url || "";
  const firstImageLink = firstHref
    ? `<a data-gallery-image-link class="spot-page-gallery-image-link" href="${escapeHTML(firstHref)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(ui.photoSource)}">`
    : `<a data-gallery-image-link class="spot-page-gallery-image-link" aria-hidden="true" tabindex="-1">`;
  return `<div class="spot-page-media-gallery" data-spot-media-gallery>
        <div class="spot-photo-thumbs" role="group" aria-label="${escapeHTML(`${data.name}の写真を選ぶ`)}">
        ${thumbs}
        </div>
        <figure class="spot-page-figure spot-page-media-gallery-active">
          ${firstImageLink}<img data-gallery-image src="${prefix}${escapeHTML(first.src)}" alt="${escapeHTML(localized(first.alt, lang) || ui.photoAlt(data.name))}" decoding="async" fetchpriority="high"></a>
          ${captionHTML(first)}
        </figure>
      </div>`;
}

function ibukiVideoHTML() {
  const postUrl = "https://x.com/730AEVA/status/1838917502124056760";
  const youtubeVideos = [
    { id: "yQKej6npo8g", url: "https://www.youtube.com/watch?v=yQKej6npo8g" },
    { id: "puK5Tr_2Sxo", url: "https://www.youtube.com/watch?v=puK5Tr_2Sxo" },
  ];
  const youtubeCards = youtubeVideos.map((video, index) => `<article class="spot-page-video-card">
            <div class="spot-page-video-frame">
            <iframe src="https://www.youtube-nocookie.com/embed/${video.id}" title="伊吹山の車窓動画 ${index + 2}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
            <p class="spot-page-video-source">出典：<a href="${video.url}" target="_blank" rel="noopener noreferrer">${video.url}</a></p>
          </article>`).join("\n          ");
  return `<section class="spot-page-section spot-page-video-section" aria-labelledby="ibukiVideoTitle">
        <h2 id="ibukiVideoTitle">動画で見る伊吹山</h2>
        <p>新幹線の車窓を流れる伊吹山の大きさと、見えている時間の感覚を動画で確かめられます。</p>
        <div class="spot-page-video-grid" aria-label="伊吹山の投稿動画">
          <article class="spot-page-video-card">
            <div class="spot-page-video-frame">
            <blockquote class="twitter-tweet" data-dnt="true" data-media-max-width="560"><p lang="ja" dir="ltr">車窓シリーズ（新幹線編）<br>伊吹山を<br><br>2024/09/25 <a href="https://t.co/ORoIxM0lPy">pic.twitter.com/ORoIxM0lPy</a></p>&mdash; てらちゃん (@730AEVA) <a href="${postUrl}?ref_src=twsrc%5Etfw">September 25, 2024</a></blockquote>
            </div>
            <p class="spot-page-video-source">出典：<a href="${postUrl}" target="_blank" rel="noopener noreferrer">てらちゃん（@730AEVA）／元投稿を見る</a></p>
          </article>
          ${youtubeCards}
        </div>
        <p class="spot-page-video-platform-note">動画はX・YouTubeの公式埋め込みを利用しています。</p>
      </section>`;
}

/** 左ペインのタイムライン。SPOTS と ROUTE をここで直接使う */
function guideMobileSpotStripHTML(lang, prefix, spotHrefPrefix) {
  const ui = UI[lang];
  const names = GUIDE_MOBILE_SPOT_NAMES[lang];
  const cards = GUIDE_MOBILE_SPOTS.map((item) => {
    const spot = SPOTS.find((candidate) => candidate.id === item.id);
    if (!spot) throw new Error(`Guide mobile spot missing: ${item.id}`);
    const name = names[item.id];
    const image = spot.image || spot.photos?.[0]?.src || "images/og-shinkansen-window.png";
    const meta = ui.mobileSpotMeta(item.min, item.seat);
    const localizedSpot = spot[lang] || spot.en || spot.ja || {};
    const localizedName = names[item.id] || localizedSpot.name || item.id;
    const localizedHook = GUIDE_MOBILE_SPOT_HOOKS[lang]?.[item.id] || localizedSpot.hook || "";
    const rawCredit = creditText(spot.photoCredit, lang);
    const compactCredit = String(rawCredit).toLowerCase() === "michikusa"
      ? spot.photoCredit?.date || ""
      : String(rawCredit).match(/@[\w_]+/)?.[0] || rawCredit;
    const cardCredit = compactCredit ? `<small class="show-credit">${escapeHTML(compactCredit)}</small>` : "";
    const caption = `<span class="show-caption"><strong>${escapeHTML(`${spot.icon || ""} ${localizedName}`.trim())}</strong>${cardCredit}<span>${escapeHTML(localizedHook)}</span><span class="show-guide-link">${escapeHTML(ui.mobileSpotAction)}</span></span>`;
    const media = `<div class="show-media"><img src="${prefix}${escapeHTML(thumbnailSrc(image))}" alt="${escapeHTML(localizedName)}" loading="lazy" decoding="async"></div>`;
    const ariaLabel = `${localizedName}: ${ui.mobileSpotAction}`;
    return `<a class="show-card guide-mobile-spot-card" href="${escapeHTML(`${spotHrefPrefix}${item.id}.html`)}" data-guide-mobile-spot="${escapeHTML(item.id)}" aria-label="${escapeHTML(ariaLabel)}">
            ${media}
            ${caption}
          </a>`;
  }).join("\n          ");
  return `<div class="guide-mobile-spots" aria-label="${escapeHTML(ui.mobileSpotRailLabel)}">
          <div class="showcase-rail">
          ${cards}
          </div>
        </div>`;
}

function spotRailHTML(spot, lang, prefix, options = {}) {
  const ui = UI[lang];
  const currentId = spot.id;
  const spotHrefPrefix = options.spotHrefPrefix || "";
  const spotNames = options.spotNames || {};
  const stationNames = options.stationNames || {};
  const railPlacement = options.railPlacement || `${lang}_guide_rail`;

  const rows = [];
  for (const st of ROUTE.refStations) {
    rows.push({ kind: "station", min: st.min, name: stationNames[st.en] || st[lang] || st.en || st.ja, major: !!st.major });
  }
  for (const sp of SPOTS) {
    if (sp.minutesFromTokyo == null) continue;
    const data = sp[lang] || sp.ja || {};
    rows.push({
      kind: "spot",
      min: sp.minutesFromTokyo,
      id: sp.id,
      name: spotNames[sp.id] || data.name || sp.en?.name || sp.id,
      side: sp.side,
      thumb: RAIL_THUMB_CATEGORIES.has(sp.category) && sp.image ? sp.image : "",
    });
  }
  rows.sort((a, b) => a.min - b.min || (a.kind === "station" ? -1 : 1));

  const me = SPOTS.find((sp) => sp.id === currentId);
  const meData = me?.[lang] || me?.ja || {};
  const nowLabel = me
    ? ui.railNowLabel(escapeHTML(spotNames[currentId] || meData.name || me?.en?.name || currentId), me.minutesFromTokyo, escapeHTML(sideLabel(me, lang)))
    : "";

  const items = rows
    .map((r) => {
      if (r.kind === "station") {
        return `<li class="spot-page-rail-row spot-page-rail-station${r.major ? " is-major" : ""}">` +
          `<span class="spot-page-rail-station-name">${escapeHTML(r.name)}</span>` +
          `<span class="spot-page-rail-station-min">${r.min}${escapeHTML(ui.railStationSuffix)}</span>` +
          `</li>`;
      }
      const isCurrent = r.id === currentId;
      const seatCls = r.side === "E" ? "is-e" : r.side === "A" ? "is-a" : "";
      const seatLabel = r.side === "E" ? "E" : r.side === "A" ? "A" : "—";
      const href = `${spotHrefPrefix}${r.id}.html`;
      const trackingAttributes = options.trackSpotClicks
        ? ` data-guide-rail-spot="${escapeHTML(r.id)}" data-guide-rail-placement="${escapeHTML(railPlacement)}"`
        : "";
      const thumb = r.thumb
        ? `<span class="spot-page-rail-thumb-wrap">` +
            `<img class="spot-page-rail-thumb" src="${prefix}${escapeHTML(thumbnailSrc(r.thumb))}" alt="" loading="lazy" decoding="async" width="38" height="38">` +
            `<img class="spot-page-rail-preview" src="${prefix}${escapeHTML(thumbnailSrc(r.thumb))}" alt="" loading="lazy" decoding="async">` +
          `</span>`
        : `<span class="spot-page-rail-nothumb" aria-hidden="true"></span>`;
      return `<li class="spot-page-rail-row spot-page-rail-spot${isCurrent ? " is-current" : ""}">` +
        `<a class="spot-page-rail-link" href="${escapeHTML(href)}"${trackingAttributes}${isCurrent ? ' aria-current="page"' : ""}>` +
        thumb +
        `<span class="spot-page-rail-min">${r.min}</span>` +
        `<span class="spot-page-rail-name">${escapeHTML(r.name)}</span>` +
        `<span class="spot-page-rail-seat ${seatCls}">${seatLabel}</span>` +
        `</a></li>`;
    })
    .join("");

  const spotCount = SPOTS.filter((sp) => sp.minutesFromTokyo != null).length;

  const asideClass = options.asideClass || "spot-page-rail";
  const ctaHref = options.ctaHref || appHref(lang, "", prefix);
  const ctaAttributes = options.ctaAttributes ? ` ${options.ctaAttributes}` : "";
  const bottomCtaAttributes = options.bottomCtaAttributes ? ` ${options.bottomCtaAttributes}` : "";
  const railLead = options.showGuideLead ? `\n          <p class="spot-page-rail-lead">${escapeHTML(ui.railLead)}</p>` : "";
  const bottomCta = options.showBottomCta
    ? `\n        <a class="spot-page-rail-cta spot-page-rail-cta-bottom" href="${escapeHTML(ctaHref)}"${bottomCtaAttributes}>${escapeHTML(ui.railBottomCta)}</a>`
    : "";
  const footHref = options.footHref || `${prefix}zukan.html`;
  const affiliatePlacement = options.affiliatePlacement || `${lang}_spot_rail_after_route`;
  const affiliateHTML = !options.includeAffiliate ? "" : lang === "ja"
    ? `<div class="spot-page-rail-affiliate-group" id="spotRailAffiliate">
          <p class="spot-page-rail-affiliate-label">広告</p>
          <div class="spot-page-rail-affiliate" data-affiliate-module data-affiliate-partner="valuecommerce" data-affiliate-offer="nta_shinkansen_hotel" data-affiliate-placement="${escapeHTML(affiliatePlacement)}_primary" data-affiliate-language="ja" data-affiliate-context="spot">
            <div class="spot-page-rail-affiliate-banner">
              <a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=2833638&amp;pid=892671040" target="_blank" rel="sponsored nofollow noopener"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=2833638&amp;pid=892671040" alt="日本旅行 JR・新幹線とホテルのセットプラン" loading="lazy" decoding="async" fetchpriority="low" width="200" height="200"></a>
              <noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=2833638&amp;pid=892671040" rel="sponsored nofollow noopener"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=2833638&amp;pid=892671040" alt="日本旅行 JR・新幹線とホテルのセットプラン" width="200" height="200"></a></noscript>
            </div>
          </div>
          <div class="spot-page-rail-affiliate" data-affiliate-module data-affiliate-partner="valuecommerce" data-affiliate-offer="vc_pid_892671046" data-affiliate-placement="${escapeHTML(affiliatePlacement)}_secondary" data-affiliate-language="ja" data-affiliate-context="spot">
            <div class="spot-page-rail-affiliate-banner">
              <a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=2833638&amp;pid=892671046" target="_blank" rel="sponsored nofollow noopener"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=2833638&amp;pid=892671046" alt="旅行予約サービス" loading="lazy" decoding="async" fetchpriority="low" width="200" height="200"></a>
              <noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=2833638&amp;pid=892671046" rel="sponsored nofollow noopener"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=2833638&amp;pid=892671046" alt="旅行予約サービス" width="200" height="200"></a></noscript>
            </div>
          </div>
          <div class="spot-page-rail-affiliate" data-affiliate-module data-affiliate-partner="amazon" data-affiliate-offer="philips_power_bank_b0fmhz3kvp" data-affiliate-placement="${escapeHTML(affiliatePlacement)}_tertiary" data-affiliate-language="ja" data-affiliate-context="spot">
            <a class="spot-page-rail-amazon" href="https://www.amazon.co.jp/dp/B0FMHZ3KVP?pd_rd_i=B0FMHZ3KVP&amp;pd_rd_w=lU1VV&amp;content-id=amzn1.sym.69e074f9-f3fe-40fa-8127-0a0a78871637&amp;pf_rd_p=69e074f9-f3fe-40fa-8127-0a0a78871637&amp;pf_rd_r=QVE14HXSSSPKSWKTJC8W&amp;pd_rd_wg=TPiT3&amp;pd_rd_r=ee7d1a5c-feca-4385-b43b-9b771d1e485f&amp;sp_csd=d2lkZ2V0TmFtZT1zcF9kZXRhaWxfdGhlbWF0aWM&amp;th=1&amp;linkCode=ll2&amp;tag=programmasavo-22&amp;linkId=e7f7b946499962102ba2f0d6d30ffd9a&amp;ref_=as_li_ss_tl" target="_blank" rel="sponsored nofollow noopener">
              <img src="${prefix}images/affiliate/amazon-philips-power-bank.jpg" alt="Philipsのケーブル一体型モバイルバッテリー" loading="lazy" decoding="async" width="200" height="116">
              <span class="spot-page-rail-amazon-body">
                <small>Amazon.co.jp</small>
                <strong>旅先の充電を1台に</strong>
                <span>ケーブル・コンセント一体型 15000mAh</span>
                <b>Amazonで見る <span aria-hidden="true">↗</span></b>
              </span>
            </a>
          </div>
          <p class="spot-page-rail-affiliate-note">この欄にはアフィリエイトリンクが含まれます。</p>
        </div>`
    : `<div class="spot-page-rail-klook" id="spotRailAffiliate" data-affiliate-module data-affiliate-partner="klook" data-affiliate-placement="${escapeHTML(affiliatePlacement)}" data-affiliate-language="en" data-affiliate-context="${escapeHTML(options.affiliateContext || "spot")}">
          <div class="spot-page-rail-klook-heading" data-affiliate-view-target>
            <p class="spot-page-rail-affiliate-label">AFFILIATE LINKS</p>
            <p class="spot-page-rail-klook-title">Plan beyond the window</p>
            <p class="spot-page-rail-klook-note">Michikusa may earn a commission at no extra cost to you.</p>
          </div>
          <div class="affiliate-card-grid">
            <a class="affiliate-card" href="https://affiliate.klook.com/redirect?aid=129377&amp;aff_adid=1363987&amp;k_site=https%3A%2F%2Fwww.klook.com%2Fen-US%2Factivity%2F1420-7-day-whole-japan-rail-pass-jr-pass" target="_blank" rel="sponsored nofollow noopener" data-affiliate-partner="klook" data-affiliate-offer="jr_pass">
              <img src="${prefix}images/affiliate/klook-japan-rail-pass.png" alt="" loading="lazy" decoding="async" width="300" height="250">
              <span class="affiliate-card-body"><small>RAIL TRAVEL</small><strong>Whole Japan Rail Pass</strong><span>For travel beyond the Tokaido route.</span><span class="affiliate-card-action">View on Klook <span aria-hidden="true">↗</span></span></span>
            </a>
            <a class="affiliate-card" href="https://affiliate.klook.com/redirect?aid=129377&amp;aff_adid=1363993&amp;k_site=https%3A%2F%2Fwww.klook.com%2Fen-US%2Factivity%2F75806-fuji-hakone-day-tour" target="_blank" rel="sponsored nofollow noopener" data-affiliate-partner="klook" data-affiliate-offer="fuji_hakone">
              <img src="${prefix}images/affiliate/klook-fuji-hakone-tour.png" alt="" loading="lazy" decoding="async" width="300" height="250">
              <span class="affiliate-card-body"><small>FROM TOKYO</small><strong>Mt. Fuji &amp; Hakone Day Tour</strong><span>For a closer Fuji experience.</span><span class="affiliate-card-action">View on Klook <span aria-hidden="true">↗</span></span></span>
            </a>
            <a class="affiliate-card" href="https://affiliate.klook.com/redirect?aid=129377&amp;aff_adid=1363992&amp;k_site=https%3A%2F%2Fwww.klook.com%2Fen-US%2Factivity%2F110001-kyoto-nara-deer-arashiyama-train-cherry-blossom-one-day-tour" target="_blank" rel="sponsored nofollow noopener" data-affiliate-partner="klook" data-affiliate-offer="kyoto_nara">
              <img src="${prefix}images/affiliate/klook-kyoto-nara-tour.png" alt="" loading="lazy" decoding="async" width="300" height="250">
              <span class="affiliate-card-body"><small>FROM KYOTO</small><strong>Kyoto &amp; Nara Day Tour</strong><span>Continue the trip beyond Kyoto.</span><span class="affiliate-card-action">View on Klook <span aria-hidden="true">↗</span></span></span>
            </a>
          </div>
        </div>`;
  const normalizedAffiliateHTML = options.absoluteAffiliateUrls
    ? affiliateHTML.replaceAll('="//', '="https://')
    : affiliateHTML;
  const affiliateBlock = normalizedAffiliateHTML ? `\n        ${normalizedAffiliateHTML}` : "";

  return `<aside class="${escapeHTML(asideClass)}" aria-label="${escapeHTML(ui.railTitle)}">
        <div class="spot-page-rail-head">
          <p class="spot-page-rail-eyebrow">${escapeHTML(ui.railEyebrow)}</p>
          <p class="spot-page-rail-title">${escapeHTML(ui.railTitle)}</p>
          <p class="spot-page-rail-count"><strong>${spotCount}</strong>${escapeHTML(ui.railCountSuffix)}</p>${railLead}
          ${nowLabel ? `<p class="spot-page-rail-now">${nowLabel}</p>` : ""}
          <a class="spot-page-rail-cta" href="${escapeHTML(ctaHref)}"${ctaAttributes}>${escapeHTML(ui.railCta)}</a>
        </div>
        <div class="spot-page-rail-list-wrap">
          <ol class="spot-page-rail-list">${items}</ol>
        </div>
        <div class="spot-page-rail-foot">
          <a href="${escapeHTML(footHref)}">${escapeHTML(ui.railFoot)}</a>
        </div>${bottomCta}${affiliateBlock}
      </aside>`;
}

function mobileAffiliateHTML(lang) {
  if (lang !== "ja") return "";
  return `<aside class="spot-page-mobile-affiliate" id="spotMobileAffiliate" data-affiliate-module data-affiliate-partner="valuecommerce" data-affiliate-offer="nta_shinkansen_hotel" data-affiliate-placement="ja_spot_article_end_mobile" data-affiliate-language="ja" data-affiliate-context="spot" aria-label="広告">
        <p class="spot-page-mobile-affiliate-label" data-affiliate-view-target>広告</p>
        <div class="spot-page-mobile-affiliate-banner">
          <a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=2833638&amp;pid=892671044" target="_blank" rel="sponsored nofollow noopener"><span class="spot-page-mobile-affiliate-fallback"><strong>JR・新幹線＋ホテル</strong><small>日本旅行のセットプランを見る ↗</small></span><img data-affiliate-src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=2833638&amp;pid=892671044" data-affiliate-media="(max-width: 1099px)" alt="日本旅行 JR・新幹線とホテルのセットプラン" loading="lazy" decoding="async" fetchpriority="low" width="234" height="60"></a>
          <noscript><a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=2833638&amp;pid=892671044" rel="sponsored nofollow noopener"><img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=2833638&amp;pid=892671044" alt="日本旅行 JR・新幹線とホテルのセットプラン" width="234" height="60"></a></noscript>
        </div>
        <p class="spot-page-mobile-affiliate-note">アフィリエイトリンクを含みます。</p>
      </aside>`;
}

function affiliateTrackingScript(lang) {
  const deferredImageLoader = lang === "ja"
    ? `  document.querySelectorAll("img[data-affiliate-src]").forEach(function (img) {
    var media = img.getAttribute("data-affiliate-media");
    if (media && !window.matchMedia(media).matches) return;
    img.src = img.getAttribute("data-affiliate-src");
    img.removeAttribute("data-affiliate-src");
  });
`
    : "";
  return `<script>
(function () {
  "use strict";
${deferredImageLoader}  var modules = document.querySelectorAll("[data-affiliate-module]");
  if (!modules.length) return;
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("[data-affiliate-module] a");
    var module = link && link.closest("[data-affiliate-module]");
    if (!module || typeof window.gtag !== "function") return;
    window.gtag("event", "affiliate_click", {
      affiliate_partner: link.getAttribute("data-affiliate-partner") || module.getAttribute("data-affiliate-partner"),
      affiliate_offer: link.getAttribute("data-affiliate-offer") || module.getAttribute("data-affiliate-offer"),
      affiliate_placement: module.getAttribute("data-affiliate-placement"),
      language: module.getAttribute("data-affiliate-language"),
      page_context: module.getAttribute("data-affiliate-context")
    });
  });
  if (!("IntersectionObserver" in window)) return;
  modules.forEach(function (module) {
    var target = module.querySelector("[data-affiliate-view-target]") || module;
    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting && entry.intersectionRatio >= 0.5; })) return;
      observer.disconnect();
      if (typeof window.gtag !== "function") return;
      window.gtag("event", "affiliate_module_view", {
        affiliate_partner: module.getAttribute("data-affiliate-partner"),
        affiliate_offer: module.getAttribute("data-affiliate-offer") || "multiple",
        affiliate_placement: module.getAttribute("data-affiliate-placement"),
        language: module.getAttribute("data-affiliate-language"),
        page_context: module.getAttribute("data-affiliate-context")
      });
    }, { threshold: [0.5] });
    observer.observe(target);
  });
})();
</script>`;
}

/** ライトボックスのHTMLとJS（本文写真のクリック拡大） */
function lightboxHTML(lang) {
  const ui = UI[lang];
  return `<div class="spot-page-lightbox" id="spotPageLightbox" hidden>
    <button type="button" class="spot-page-lightbox-close" aria-label="${escapeHTML(ui.lightboxClose)}">&times;</button>
    <figure><img alt=""><figcaption></figcaption></figure>
  </div>`;
}
function lightboxScript() {
  return `<script>
(function () {
  "use strict";
  var box = document.getElementById("spotPageLightbox");
  if (!box) return;
  var img = box.querySelector("img");
  var cap = box.querySelector("figcaption");
  function open(src, caption) {
    img.src = src;
    cap.textContent = caption || "";
    box.hidden = false;
    document.documentElement.style.overflow = "hidden";
  }
  function close() {
    box.hidden = true;
    img.src = "";
    document.documentElement.style.overflow = "";
  }
  box.addEventListener("click", function (e) { if (e.target === box || e.target.classList.contains("spot-page-lightbox-close")) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  document.querySelectorAll(".spot-page-inline-zoom").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var thumb = btn.querySelector("img");
      var src = btn.getAttribute("data-zoom-src") || (thumb && thumb.getAttribute("src")) || "";
      var fc = btn.parentElement.querySelector("figcaption");
      var text = fc ? fc.textContent.replace(/\\s+/g, " ").trim() : "";
      // 「クリックで拡大」を末尾から取り除く
      text = text.replace(/(?:クリックで拡大|click to enlarge)\\s*$/, "").trim();
      open(src, text);
    });
  });
})();
</script>`;
}
function explainerFigureHTML(spot, lang, prefix) {
  const figure = spot.explainerFigure;
  if (!figure?.src) return "";
  const alt = localized(figure.alt, lang) || "";
  const caption = localized(figure.caption, lang) || "";
  const credit = creditText(figure.credit, lang) || "";
  const href = figure.sourceUrl || "";
  const creditHTML = credit
    ? (href
      ? `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
      : escapeHTML(credit))
    : "";
  const captionBits = [caption ? `<strong>${escapeHTML(caption)}</strong>` : "", creditHTML ? `<span>${creditHTML}</span>` : "", figure.date ? `<span>${escapeHTML(figure.date)}</span>` : ""].filter(Boolean).join(" ");
  return `<figure class="spot-page-explainer-figure">
        <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(figure.src))}" alt="${escapeHTML(alt)}">
        ${captionBits ? `<figcaption>${captionBits}</figcaption>` : ""}
      </figure>`;
}

function photoGalleryHTML(spot, lang, prefix, itemsOverride) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const items = itemsOverride || photoItems(spot, lang);
  if (!items.length) return "";
  const cards = items.map((item, index) => {
    const note = localized(item.note, lang);
    const credit = creditText(item.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
    const href = item.sourceUrl || item.url || "";
    const creditHTML = href
      ? `<a href="${escapeHTML(href)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
      : escapeHTML(credit);
    const date = item.date ? `\n          <span>${escapeHTML(item.date)}</span>` : "";
    return `<figure class="spot-page-photo">
        <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(item.src))}" alt="${escapeHTML(localized(item.alt, lang) || ui.photoAlt(data.name))}">
        <figcaption>
          <strong>${note ? escapeHTML(note) : escapeHTML(ui.photoFallback(data.name, index))}</strong>
          <span>${creditHTML}</span>${date}
        </figcaption>
      </figure>`;
  }).join("");
  return `<section class="spot-page-section">
        <h2>${escapeHTML(localized(spot.photoSectionHeading, lang) || ui.sectionPhotos(data.name))}</h2>
        <div class="spot-page-photo-grid">${cards}</div>
      </section>`;
}

function spotGuideHref(spot) {
  const pageId = spot.guidePageId || spot.id;
  return `${pageId}.html${spot.guideAnchor ? `#${spot.guideAnchor}` : ""}`;
}

function routeRelatedHTML(spot, lang) {
  const ui = UI[lang];
  const prefix = lang === "ja" ? "../" : "../../";
  const routeSpots = [...SPOTS].sort((a, b) => Number(a.minutesFromTokyo || 0) - Number(b.minutesFromTokyo || 0));
  const explicitIds = new Set(spot.relatedSpotIds || []);
  const unique = [];
  for (const id of explicitIds) {
    const item = routeSpots.find((entry) => entry.id === id);
    if (item) unique.push({ label: ui.relatedCategory, spot: item });
  }
  const scored = routeSpots
    .filter((item) => item.id !== spot.id && !explicitIds.has(item.id))
    .map((item) => {
      const minutesDiff = Math.abs(Number(item.minutesFromTokyo || 0) - Number(spot.minutesFromTokyo || 0));
      const score =
        (item.category === spot.category ? 12 : 0) +
        (item.side === spot.side ? 3 : 0) +
        Math.max(0, 8 - minutesDiff / 6);
      const label = item.category === spot.category
        ? ui.relatedCategory
        : (lang === "ja" ? "近い時間" : "Nearby");
      return { label, spot: item, score };
    })
    .sort((a, b) => b.score - a.score);
  for (const item of scored) {
    if (unique.length >= 3) break;
    if (!unique.some((entry) => entry.spot.id === item.spot.id)) unique.push(item);
  }
  if (!unique.length) return "";
  const links = unique.slice(0, 3).map(({ label, spot: item }) => {
    const data = item[lang] || item.ja;
    const image = thumbnailSrc(item.image || item.photos?.[0]?.src || "images/og-shinkansen-window.png");
    return `<a href="${spotGuideHref(item)}">
        <img src="${prefix}${escapeHTML(image)}" alt="${escapeHTML(data.name)}" loading="lazy" decoding="async">
        <small>${escapeHTML(label)}</small>
        <strong>${escapeHTML(data.name)}</strong>
        <span>${escapeHTML(data.hook || data.area)}</span>
      </a>`;
  }).join("");
  return `<section class="spot-page-section">
        <h2>${escapeHTML(ui.sectionRelated)}</h2>
        <div class="spot-page-related">${links}</div>
      </section>`;
}

function referencesHTML(spot, lang) {
  const ui = UI[lang];
  const items = (spot.references || []).map((ref) => {
    const href = referenceUrl(ref, lang);
    const label = localized(ref?.label, lang);
    if (!href || !label) return "";
    return `<li><a href="${escapeHTML(href)}" rel="noopener" target="_blank">${text(label)}</a></li>`;
  }).filter(Boolean).join("");
  if (!items) return "";
  return `<section class="spot-page-section spot-page-refs">
        <h2>${escapeHTML(ui.sectionRefs)}</h2>
        <ul>${items}</ul>
      </section>`;
}

function mapHref(spot, lang) {
  if (!spot?.map) return "";
  if (spot.map.lat != null && spot.map.lng != null) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.map.lat},${spot.map.lng}`)}`;
  const query = spot.map[lang] || spot.map.ja || spot.map.en;
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

function mapLinkHTML(spot, lang) {
  const href = mapHref(spot, lang);
  if (!href) return "";
  const label = lang === "ja" ? "地図をひらく" : "Open map";
  return `<a class="map-link spot-mini-map-link" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer" data-map="${escapeHTML(spot.id)}"><span class="map-link-icon" aria-hidden="true">↗</span><span>${escapeHTML(label)}</span></a>`;
}

function googleMapsEmbedHref(spot, lang) {
  if (!hasMiniMapCoordinates(spot)) return "";
  const viewPos = miniMapViewpoint(spot, TRACK);
  const distanceKm = viewPos && TRACK
    ? TRACK.haversineKm(viewPos.lat, viewPos.lng, spot.map.lat, spot.map.lng)
    : NaN;
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY,
    q: `${spot.map.lat},${spot.map.lng}`,
    center: `${spot.map.lat},${spot.map.lng}`,
    zoom: String(miniMapZoomForViewpoint(spot, viewPos, distanceKm)),
    maptype: "satellite",
    language: lang === "ja" ? "ja" : "en",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function googleMapsViewpointHref(spot, lang) {
  if (!hasMiniMapCoordinates(spot)) return "";
  const viewPos = miniMapViewpoint(spot, TRACK);
  if (!viewPos) return "";
  const distanceKm = TRACK
    ? TRACK.haversineKm(viewPos.lat, viewPos.lng, spot.map.lat, spot.map.lng)
    : NaN;
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY,
    q: `${viewPos.lat},${viewPos.lng}`,
    center: `${spot.map.lat},${spot.map.lng}`,
    zoom: String(miniMapZoomForViewpoint(spot, viewPos, distanceKm)),
    maptype: "satellite",
    language: lang === "ja" ? "ja" : "en",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function miniMapDetailsHTML(spot, lang) {
  const hasCoordinates = hasMiniMapCoordinates(spot);
  const fallbackLink = mapLinkHTML(spot, lang);
  if (!hasCoordinates && !fallbackLink) return "";
  const summary = lang === "ja" ? "位置の目安" : "Location at a glance";
  const mapNote = lang === "ja"
    ? "スポット位置と、新幹線から見る位置を切り替えられます。"
    : "Switch between the spot and the Shinkansen viewpoint.";
  const fallbackNote = lang === "ja"
    ? "この地点は簡易地図の座標調整中です。外部地図で位置を確認できます。"
    : "Inline coordinates are still being tuned for this spot. You can check the location in an external map.";
  const prefix = lang === "ja" ? "../" : "../../";
  const data = spot[lang] || spot.ja || spot.en || {};
  const href = mapHref(spot, lang);
  const openMapLabel = lang === "ja"
    ? `${data.name || spot.id}をGoogle Mapsで開く`
    : `Open ${data.name || spot.id} in Google Maps`;
  const embedHref = googleMapsEmbedHref(spot, lang);
  const viewpointHref = googleMapsViewpointHref(spot, lang);
  const modebar = viewpointHref ? `<div class="spot-map-modebar" role="group" aria-label="${escapeHTML(summary)}">
          <button type="button" class="spot-map-mode is-active" data-mini-map-mode="spot" data-map-src="${escapeHTML(embedHref)}" aria-pressed="true">${escapeHTML(lang === "ja" ? "スポット" : "Spot")}</button>
          <button type="button" class="spot-map-mode" data-mini-map-mode="viewpoint" data-map-src="${escapeHTML(viewpointHref)}" aria-pressed="false">${escapeHTML(lang === "ja" ? "新幹線視点" : "Train viewpoint")}</button>
        </div>` : "";
  if (!hasCoordinates) {
    return `<section class="spot-static-map">
        <div class="spot-static-map-head">
          <h2>${escapeHTML(summary)}</h2>
        </div>
        <div class="spot-mini-map-fallback">
          <p>${escapeHTML(fallbackNote)}</p>
          ${fallbackLink}
        </div>
      </section>`;
  }
  return `<section class="spot-static-map">
        <div class="spot-static-map-head">
          <h2>${escapeHTML(summary)}</h2>
          ${fallbackLink}
        </div>
        ${modebar}
        <iframe class="spot-google-map-frame" src="${escapeHTML(embedHref)}" title="${escapeHTML(openMapLabel)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
        <p class="spot-mini-map-note">${escapeHTML(mapNote)}</p>
      </section>`;
}

function sharedGuideHTML(spot, lang) {
  const chapters = (spot.sharedGuideSpotIds || [])
    .map((id) => SPOTS.find((item) => item.id === id))
    .filter(Boolean);
  return chapters.map((chapter) => {
    const data = chapter[lang] || chapter.ja || {};
    const paragraphs = localized(chapter.sharedGuideStory, lang) || [];
    const body = Array.isArray(paragraphs) && paragraphs.length
      ? paragraphs
      : [data.story || ""];
    return `<section class="spot-page-section" id="${escapeHTML(chapter.guideAnchor || chapter.id)}">
        <h2>${escapeHTML(localized(chapter.sharedGuideHeading, lang) || data.name)}</h2>
        <p><strong>${escapeHTML(data.hook || "")}</strong></p>
        ${body.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("\n        ")}
      </section>`;
  }).join("\n      ");
}

function sharedGuideNoticeHTML(spot, lang) {
  if (!spot.guidePageId || spot.guidePageId === spot.id) return "";
  const href = `${spot.guidePageId}.html${spot.guideAnchor ? `#${spot.guideAnchor}` : ""}`;
  return lang === "ja"
    ? `<section class="spot-page-section guide-answer-panel">
        <div class="guide-answer-copy">
          <h2>浜名湖の景色と一緒に見る</h2>
          <p>遠くの富士山は、湖面、養殖棚、サンマリンブリッジへと続く浜名湖の車窓の一部として現れます。</p>
          <p><a class="inline-cta" href="${escapeHTML(href)}">浜名湖の見どころと写真を見る →</a></p>
        </div>
      </section>`
    : `<section class="spot-page-section guide-answer-panel">
        <div class="guide-answer-copy">
          <h2>See it as part of the Lake Hamana crossing</h2>
          <p>Distant Fuji appears within a sequence of water, aquaculture structures and Sun Marine Bridge.</p>
          <p><a class="inline-cta" href="${escapeHTML(href)}">See Lake Hamana highlights and photographs →</a></p>
        </div>
      </section>`;
}

function articleImageHTML(spot, lang, prefix) {
  const image = spot.articleImage || (spot.photos || []).find((item) => item.role === "reference");
  if (!image?.src) return "";
  const credit = creditText(image.credit, lang);
  const source = image.sourceUrl || "";
  const creditHTML = source
    ? `<a href="${escapeHTML(source)}" rel="noopener" target="_blank">${escapeHTML(credit)}</a>`
    : escapeHTML(credit);
  const date = image.date ? `
            <span>${escapeHTML(image.date)}</span>` : "";
  return `<section class="spot-page-section spot-page-reference-section">
        <h2>${escapeHTML(localized(image.heading, lang))}</h2>
        <p>${escapeHTML(localized(image.intro, lang))}</p>
        <figure class="spot-page-reference-figure">
          <a href="${escapeHTML(source || `${prefix}${image.src}`)}"${source ? ' rel="noopener" target="_blank"' : ""}>
            <img loading="lazy" decoding="async" src="${prefix}${escapeHTML(thumbnailSrc(image.src))}" alt="${escapeHTML(localized(image.alt, lang))}">
          </a>
          <figcaption>
            <strong>${escapeHTML(localized(image.caption, lang))}</strong>
            <span>${creditHTML}</span>${date}
          </figcaption>
        </figure>
      </section>`;
}

function pageHeadingHTML(spot, lang, fallback) {
  const chunks = localized(spot.pageHeadingChunks, lang);
  if (Array.isArray(chunks) && chunks.length) {
    return chunks
      .map((chunk) => `<span class="copy-chunk">${escapeHTML(chunk)}</span>`)
      .join(lang === "en" ? " " : "");
  }
  return escapeHTML(localized(spot.pageHeading, lang) || fallback);
}

function durationGuideText(spot, lang) {
  const seconds = Number(spot.durationSec);
  if (!Number.isFinite(seconds)) {
    return lang === "ja"
      ? "見える時間は列車や天候で変わります。近づいてから探すより、少し前から窓の外を追う方が見つけやすくなります。"
      : "Visibility changes by train and weather. Start watching a little early instead of waiting until the view is already beside you.";
  }
  if (lang === "ja") {
    if (seconds <= 2) return "はっきり見えるのは1〜2秒ほど。ライブガイドの案内が出たら、先に窓へ目を移しておくのが現実的です。";
    if (seconds <= 8) return "はっきり見えるのは数秒ほど。案内が出てからカメラを探すより、先に座席側と窓の方向を決めておくと拾いやすくなります。";
    if (seconds <= 12) return "見えるのは10秒前後。先に座席側と窓の方向を決めておくと、景色の始まりから追いやすくなります。";
    if (seconds <= 20) return "見えるのは10数秒ほど。建物や地形で隠れることがあるため、少し前から窓を見ておくと拾いやすくなります。";
    return "この景観は区間の中で断続的に見えます。建物や地形で隠れるため、表示時間は連続して見える秒数ではなく、探し始める区間の目安です。";
  }
  if (seconds <= 2) return "The clearest view lasts only one or two seconds. Let Live Guide warn you before you look up.";
  if (seconds <= 8) return "The clearest view lasts only a few seconds. Decide the seat side and window direction before it arrives rather than reaching for your camera late.";
  if (seconds <= 12) return "The view lasts around 10 seconds. Choose the seat side and window direction early so you can follow it from the start.";
  if (seconds <= 20) return "The view lasts roughly 10 to 20 seconds, though buildings and terrain may interrupt it. Start watching a little early.";
  return "This wider view appears intermittently through the section. Buildings and terrain may block it, so the timing is a guide for when to start looking, not a continuous visibility claim.";
}

function sceneGuideText(spot, lang, name) {
  const scene = spot.scene || "";
  if (lang === "ja") {
    if (spot.category === "curious") {
      return `${name}は、富士山や大きな城のような主役級ではなく、知っている人だけが拾えるタイプの車窓です。見つけること自体が楽しいので、旅慣れた人ほど小さな発見として効いてきます。`;
    }
    if (scene === "fuji" || scene === "leftfuji") return "富士山は区間によって大きさ、角度、手前の街並みが変わります。同じ富士山でも、どこで見るかで印象が変わるのが東海道新幹線らしい面白さです。";
    if (scene === "bay" || scene === "lake") return "水辺の車窓は、建物が詰まった区間から急に視界が開けるのが魅力です。晴天だけでなく、夕方や曇天でも水面の明るさで景色の変化に気づけます。";
    if (scene === "castle" || scene === "pagoda") return "歴史ある建物は、街の中に一瞬だけ差し込む目印として現れます。大きく眺めるというより、線路と街との距離感を味わうスポットです。";
    if (scene === "solar") return "工場や看板の車窓は、観光名所とは違う東海道らしさがあります。移動中にしか気づきにくい沿線のランドマークとして見ると面白いタイプです。";
    if (scene === "mountain" || scene === "hills") return "山や丘の車窓は、遠景の輪郭と手前の街並みが重なって見えます。季節や天候で印象が変わりやすく、同じ列車でも毎回少し違って見えるスポットです。";
    return "この車窓は、駅間の短い時間をただの移動ではなく観察の時間に変えてくれます。座席側とタイミングを知っているだけで、景色の拾い方が大きく変わります。";
  }
  if (spot.category === "curious") {
    return `This is not a headline landmark like Mt. Fuji or a major castle. It is the kind of small window view that feels rewarding precisely because you know where to look.`;
  }
  if (scene === "fuji" || scene === "leftfuji") return "Mt. Fuji changes by section: size, angle, foreground, and distance all shift along the Tokaido Shinkansen. That variety is part of the fun.";
  if (scene === "bay" || scene === "lake") return "Water views are satisfying because the scenery suddenly opens up after dense urban sections. The surface can make the change noticeable even on cloudy days.";
  if (scene === "castle" || scene === "pagoda") return "Historic buildings appear as brief markers inside the cityscape. The pleasure is less about a long panorama and more about catching the train's relationship with the town.";
  if (scene === "solar") return "Factories and signs are a different kind of Tokaido landmark: not classic sightseeing, but very much part of the view from the line.";
  if (scene === "mountain" || scene === "hills") return "Hills and mountains layer the distant outline with the towns in front of them. Weather and season change the impression from ride to ride.";
  return "This view turns a short stretch between stations into something to watch. Knowing the seat side and timing changes how much of the journey you notice.";
}

function spotGuideDepthHTML(spot, lang) {
  const data = spot[lang] || spot.ja || {};
  const title = lang === "ja" ? `${data.name}を見逃さないコツ` : `How to catch ${data.name}`;
  const seat = sideLabel(spot, lang);
  const journeyUrl = lang === "ja" ? "../index.html#journey" : "../../en/#journey";
  const intro = lang === "ja"
    ? `${data.area || "この区間"}が近づいたら、${seat}の窓を先に意識してください。現在地から追う場合はライブガイド、事前に確認する場合はこのページの地図が役立ちます。`
    : `As you approach ${enApproachArea(data.area)}, start watching from ${seat}. Use Live Guide while riding, or the map on this page before you board.`;
  const timingLead = lang === "ja"
    ? "乗る列車が決まっているなら、列車選択で実際のダイヤに合わせた見える時刻を調べられます。"
    : "Know your train? Select it to see this view's estimated time on the actual timetable.";
  const timingCta = lang === "ja"
    ? "列車を選んで、見える時刻を調べる"
    : "Select my train and check the time";
  return `<section class="spot-page-section">
        <h2>${escapeHTML(title)}</h2>
        <h3>${escapeHTML(lang === "ja" ? "1. 先に見る方向を決める" : "1. Choose the window first")}</h3>
        <p>${escapeHTML(intro)}</p>
        <p>${escapeHTML(durationGuideText(spot, lang))}</p>
        <aside class="spot-page-timing-cta">
          <p>${escapeHTML(timingLead)}</p>
          <a class="btn btn-primary" href="${journeyUrl}" data-cta-track="cta_train_search_click" data-cta-id="spot_guide_timing">${escapeHTML(timingCta)}</a>
        </aside>
        <h3>${escapeHTML(lang === "ja" ? "2. 見どころ" : "2. Highlights")}</h3>
        <p>${escapeHTML(localized(spot.guideHighlight, lang) || sceneGuideText(spot, lang, data.name))}</p>
      </section>`;
}

// 撮影のコツ。見えている時間が短く「撮れるかどうか」自体が目的になっているスポット向けの
// 任意セクション。そういうスポットでは撮り方こそが読者の探しているものなので、歴史や解説より
// 前、事実一覧の直後に置く。spot.photoTip があるときだけ出る。
function photoTipHTML(spot, lang) {
  const photoTip = spot.photoTip;
  if (!photoTip) return "";
  const paras = photoTip[lang] || photoTip.ja || [];
  if (!paras.length) return "";
  const heading = localized(photoTip.heading, lang);
  if (!heading) return "";
  return `      <section class="spot-page-section spot-page-phototip">
        <h2>${escapeHTML(heading)}</h2>
${paras.map((para) => `        <p>${escapeHTML(para)}</p>`).join("\n")}
      </section>
`;
}

function thinSpotPageHTML(spot, lang) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const otherLang = lang === "ja" ? "en" : "ja";
  const title = localized(spot.pageTitle, lang) || (lang === "ja"
    ? `${data.name}はいつ見える？座席側は？ ${data.area}${ui.titleSuffix}`
    : `When can you see ${data.name} from the Shinkansen? ${data.area} | Shinkansen Window`);
  const desc = localized(spot.metaDescription, lang) || description(spot, lang);
  const url = pageUrl(lang, spot.id);
  const prefix = lang === "ja" ? "../" : "../../";
  // Static link graph (2026-08-17): nav / content-rail / related-spot links are
  // baked directly into the HTML so search engines do not depend on
  // spot-page-shared.js executing to find them. Each block carries
  // data-spot-page-shared-static so the runtime renderer (spot-page-shared.js)
  // knows to leave it alone instead of re-inserting an equivalent element -
  // that is what stops these from appearing twice. Body/photos/map/timeline
  // stay JS-rendered as before; only the link graph is affected.
  const staticNavHTML = siteHeaderHTML(
    lang,
    prefix,
    lang === "ja" ? `${spot.id}.html` : `../../spots/${spot.id}.html`,
    lang === "ja" ? `../en/spots/${spot.id}.html` : `${spot.id}.html`,
    { tag: "div", staticMarker: "topbar" },
  );
  const staticContentRailHTML = contentRailHTML(lang, prefix, { staticMarker: "content-rail" });
  const staticRelatedInner = routeRelatedHTML(spot, lang);
  const staticRelatedHTML = staticRelatedInner
    ? `<div class="spot-page-static-related" data-spot-page-shared-static="related" style="max-width:820px;margin:0 auto;padding:0 20px;">
    ${staticRelatedInner}
  </div>`
    : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": title,
        "description": desc,
        "inLanguage": lang,
        "isPartOf": { "@type": "WebSite", "name": ui.brand, "url": pageUrl(lang) },
      },
      {
        "@type": "TouristAttraction",
        "@id": `${url}#spot`,
        "name": data.name,
        "alternateName": localized(spot[otherLang], "name") || spot[otherLang]?.name || spot.ja.name,
        "description": desc,
        "image": spotOgImageUrl(spot),
        "touristType": "Railway window view",
      },
    ],
  };
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${embeddedHeadHTML(prefix)}
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <title>${text(title)}</title>
  <meta name="description" content="${text(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="ja" href="${pageUrl("ja", spot.id)}">
  <link rel="alternate" hreflang="en" href="${pageUrl("en", spot.id)}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl("en", spot.id)}">
  <script src="${prefix}language-router.js?v=${assetVersion("language-router.js")}"></script>
  <link rel="stylesheet" href="${prefix}style.css?v=${assetVersion("style.css")}">
  <link rel="stylesheet" href="${prefix}spot-media-gallery.css?v=${assetVersion("spot-media-gallery.css")}">
  <meta property="og:title" content="${text(title)}">
  <meta property="og:description" content="${text(desc)}">
  <meta property="og:image" content="${spotOgImageUrl(spot)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${spotOgImageUrl(spot)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  ${analyticsSnippet()}
</head>
<body class="spot-page" data-spot-page-shared-lang="${escapeHTML(lang)}" data-spot-page-shared-id="${escapeHTML(spot.id)}" data-spot-page-shared-root="${escapeHTML(prefix)}" data-spot-page-shared-mode="page">
  ${staticNavHTML}
  <div data-spot-page-shared-module="page"></div>
  ${staticRelatedHTML}${staticContentRailHTML}
  <script src="${prefix}spot-page-shared-data.js?v=${assetVersion("spot-page-shared-data.js")}"></script>
  <script src="${prefix}spot-page-shared.js?v=${assetVersion("spot-page-shared.js")}"></script>
  <script src="${prefix}spot-media-gallery.js?v=${assetVersion("spot-media-gallery.js")}"></script>
  <script src="${prefix}spot-map.js?v=${assetVersion("spot-map.js")}"></script>
</body>
</html>
`;
}

function spotPageHTML(spot, lang) {
  return thinSpotPageHTML(spot, lang);
  const ui = UI[lang];
  const sharedSpotPage = SHARED_SPOT_LANGUAGES.has(lang);
  const data = spot[lang] || spot.ja || {};
  const otherLang = lang === "ja" ? "en" : "ja";
  const title = localized(spot.pageTitle, lang) || (lang === "ja"
    ? `${data.name}はいつ見える？座席側は？ ${data.area}${ui.titleSuffix}`
    : `When can you see ${data.name} from the Shinkansen? ${data.area} | Shinkansen Window`);
  const desc = localized(spot.metaDescription, lang) || description(spot, lang);
  const url = pageUrl(lang, spot.id);
  const prefix = lang === "ja" ? "../" : "../../";
  const appUrl = appHref(lang, spot.id, prefix);
  const photos = photoItems(spot, lang);
  // 本文へ差し込む写真はギャラリーから外す。件数はギャラリー基準で表示する
  const galleryPhotos = galleryItems(spot, lang);
  const photoCount = photos.length;
  const heroSrc = photos[0]?.src || spot.image || "images/og-shinkansen-window.png";
  const heroFigcaption = heroFigcaptionHTML(spot, lang);
  const ibukiMediaPilot = lang === "ja" && spot.id === "ibuki";
  const ibukiShowcasePilot = lang === "ja" && spot.id === "ibuki";
  const heroMedia = ibukiMediaPilot
    ? spotHeroGalleryHTML(spot, lang, prefix)
    : `<figure class="spot-page-figure">
        <img src="${prefix}${escapeHTML(thumbnailSrc(heroSrc))}" alt="${escapeHTML(ui.photoAlt(data.name))}" decoding="async" fetchpriority="high">
        ${heroFigcaption}
      </figure>`;
  const gallerySection = ibukiMediaPilot
    ? ibukiVideoHTML()
    : photoGalleryHTML(spot, lang, prefix, galleryPhotos);
  const mediaPilotStyles = ibukiMediaPilot
    ? `\n  <link rel="stylesheet" href="${prefix}spot-media-gallery.css?v=${assetVersion("spot-media-gallery.css")}">`
    : "";
  const mediaPilotScripts = ibukiMediaPilot
    ? `  <script src="${prefix}spot-media-gallery.js?v=${assetVersion("spot-media-gallery.js")}"></script>\n  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>\n`
    : "";
  const inlineFigures = inlineFigureHTML(spot, lang, prefix);
  const railHTML = sharedSpotPage
    ? `<div data-spot-page-shared-module="rail"></div>`
    : `${spotRailHTML(spot, lang, prefix, {
      includeAffiliate: true,
      affiliatePlacement: `${lang}_spot_rail_after_route`,
      affiliateContext: "spot",
    })}`;
  const headerHTML = sharedSpotPage
    ? `  <div data-spot-page-shared-module="topbar"></div>`
    : `  ${siteHeaderHTML(
      lang,
      prefix,
      lang === "ja" ? `${spot.id}.html` : `../../spots/${spot.id}.html`,
      lang === "ja" ? `../en/spots/${spot.id}.html` : `${spot.id}.html`,
    )}`;
  const contentRailBlock = sharedSpotPage
    ? `    <div data-spot-page-shared-module="content-rail"></div>`
    : `    ${contentRailHTML(lang, prefix)}`;
  const sharedContext = sharedSpotPage
    ? ` data-spot-page-shared-lang="${escapeHTML(lang)}" data-spot-page-shared-id="${escapeHTML(spot.id)}" data-spot-page-shared-root="${escapeHTML(prefix)}"`
    : "";
  const sharedScripts = sharedSpotPage
    ? `  <script src="${prefix}spot-page-shared-data.js?v=${assetVersion("spot-page-shared-data.js")}"></script>\n  <script src="${prefix}spot-page-shared.js?v=${assetVersion("spot-page-shared.js")}"></script>\n`
    : "";
  const mobileAffiliate = mobileAffiliateHTML(lang);
  const mobileAffiliateBlock = mobileAffiliate ? `      ${mobileAffiliate}\n` : "";
  const lightbox = lightboxHTML(lang);
  const lightboxJs = lightboxScript();
  const routeNote = localized(spot.routeNote, lang) || ui.routeNote(data.area, sideLabel(spot, lang));
  const FUJI_FAMILY = new Set(["fuji", "ota-fuji", "sagami-fuji", "left-fuji", "hamanako-fuji"]);
  const fujiGuideLink = spot.id === "fuji"
    ? (lang === "ja"
      ? `<p>このページは三島〜新富士の写真と景色に集中しています。座席の取り方、東京・京都・新大阪からの時刻、曇りの日、左富士は、<a href="../guide.html">富士山FAQ・乗車前ガイド</a>で確認できます。</p>`
      : `<p>This page focuses on the photographs and scenery between Mishima and Shin-Fuji. For seat booking, timing from Tokyo, Kyoto or Osaka, cloudy-day advice, and Left Fuji, see the <a href="../guide.html">Mt. Fuji FAQ and pre-trip guide</a>.</p>`)
    : FUJI_FAMILY.has(spot.id)
    ? (lang === "ja"
      ? `<p>富士山が見える座席側や、東京・京都・新大阪からの時刻、曇りの日の見え方、他の富士山ビュースポットとの違いは、<a href="../guide.html">富士山FAQ・乗車前ガイド</a>にまとめています。</p>`
      : `<p>Seat side for Mt. Fuji, timing from Tokyo / Kyoto / Osaka, cloudy-day advice, and how this view compares with the other Fuji viewpoints are gathered in the <a href="../guide.html">Mt. Fuji FAQ and pre-trip guide</a>.</p>`)
    : "";
  const fujiGuideBlock = fujiGuideLink ? `        ${fujiGuideLink}\n` : "";
  const heroCredit = creditText(photos[0]?.credit, lang) || creditText(spot.photoCredit, lang) || ui.fallbackCredit;
  const refs = referencesHTML(spot, lang);
  const bodyLinks = bodyLinksHTML(spot, lang);
  const miniMap = miniMapDetailsHTML(spot, lang);
  const pageStory = localized(spot.pageStory, lang) || data.story || "";
  const explainerData = spot.explainer;
  const explainerParas = explainerData ? (explainerData[lang] || explainerData.ja || []) : [];
  const explainerFigure = explainerFigureHTML(spot, lang, prefix);
  const explainerFigureAfterIndex = Number.isInteger(spot.explainerFigure?.afterParagraph)
    ? Math.min(explainerParas.length - 1, Math.max(0, spot.explainerFigure.afterParagraph))
    : 0;
  const explainer = explainerData && explainerParas.length
    ? `<section class="spot-page-section">
        <h2>${escapeHTML(localized(explainerData.heading, lang))}</h2>
        ${explainerParas.map((p, index) => {
          const paragraph = `<p>${escapeHTML(p)}</p>`;
          if (explainerFigure && index === explainerFigureAfterIndex) {
            return `${paragraph}\n        ${explainerFigure}`;
          }
          return paragraph;
        }).join("\n        ")}
      </section>`
    : "";
  const sharedGuide = sharedGuideHTML(spot, lang);
  const sharedGuideNotice = sharedGuideNoticeHTML(spot, lang);
  const articleImage = articleImageHTML(spot, lang, prefix);
  const sharedGuideNoticeBlock = sharedGuideNotice ? `      ${sharedGuideNotice}\n` : "";
  // Keep the legacy whitespace-only separator when no explainer exists so
  // regenerating one spot does not create unrelated diffs in all static pages.
  const explainerBlock = explainer ? `      ${explainer}\n` : ibukiMediaPilot ? "" : "      \n";
  const articleImageBlock = articleImage ? `      ${articleImage}\n` : "";
  const sharedGuideBlock = sharedGuide ? `      ${sharedGuide}\n` : "";
  const relatedBlock = ibukiShowcasePilot ? "" : routeRelatedHTML(spot, lang);
  const showcaseHostBlock = ibukiShowcasePilot
    ? '    <div data-spot-page-shared-module="showcase"></div>\n'
    : "";
  const liveMapCta = lang === "ja" ? "乗車中はライブガイドで見る" : "Use Live Guide while riding";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": title,
        "description": desc,
        "inLanguage": lang,
        "isPartOf": { "@type": "WebSite", "name": ui.brand, "url": pageUrl(lang) },
      },
      {
        "@type": "TouristAttraction",
        "@id": `${url}#spot`,
        "name": data.name,
        "alternateName": localized(spot[otherLang], "name") || spot[otherLang]?.name || spot.ja.name,
        "description": desc,
        "image": spotOgImageUrl(spot),
        "touristType": "Railway window view",
      },
    ],
  };

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <title>${text(title)}</title>
  <meta name="description" content="${text(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="ja" href="${pageUrl("ja", spot.id)}">
  <link rel="alternate" hreflang="en" href="${pageUrl("en", spot.id)}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl("en", spot.id)}">
  <script src="${prefix}language-router.js?v=${assetVersion("language-router.js")}"></script>
  <link rel="stylesheet" href="${prefix}style.css?v=${assetVersion("style.css")}">${mediaPilotStyles}
  <meta property="og:title" content="${text(title)}">
  <meta property="og:description" content="${text(desc)}">
  <meta property="og:image" content="${spotOgImageUrl(spot)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${spotOgImageUrl(spot)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  ${analyticsSnippet()}
</head>
<body class="spot-page"${sharedContext}>
${headerHTML}
  <main>
    <header class="spot-page-article spot-page-hero">
      <p class="eyebrow">${escapeHTML(ui.eyebrow)}</p>
      <h1>${pageHeadingHTML(spot, lang, ui.titleQuestion(data.name))}</h1>
      <p class="spot-page-lead">${escapeHTML(data.hook || "")}</p>
    </header>
    <div class="spot-page-shell">
      ${railHTML}
      <article class="spot-page-article">
      ${heroMedia}
      <dl class="spot-page-facts">
        <div><dt>${escapeHTML(ui.facts[0])}</dt><dd>${escapeHTML(data.area || "")}</dd></div>
        <div><dt>${escapeHTML(ui.facts[1])}</dt><dd>${escapeHTML(sideLabel(spot, lang))}</dd></div>
        <div><dt>${escapeHTML(ui.facts[2])}</dt><dd>${escapeHTML(ui.minutes(spot.minutesFromTokyo))}</dd></div>
        <div><dt>${escapeHTML(ui.facts[3])}</dt><dd>${photoCount} ${escapeHTML(ui.photoUnit)}</dd></div>
      </dl>
${photoTipHTML(spot, lang)}${sharedGuideNoticeBlock}      <section class="spot-page-section">
        <h2>${escapeHTML(localized(spot.sectionHeading, lang) || ui.sectionHow(data.name))}</h2>
        <p>${escapeHTML(pageStory)}</p>
${bodyLinks ? `        ${bodyLinks}
` : ""}        <p>${escapeHTML(routeNote)}</p>
${fujiGuideBlock.trimEnd()}
        <p><a href="${liveHref(lang, prefix)}">${escapeHTML(liveMapCta)}</a></p>
      </section>
${inlineFigures.first ? `      ${inlineFigures.first}\n` : ""}${explainerBlock}${inlineFigures.second ? `      ${inlineFigures.second}\n` : ""}${articleImageBlock}${sharedGuideBlock}      ${miniMap}
      ${spotGuideDepthHTML(spot, lang)}
      ${gallerySection}
      ${refs}
${relatedBlock ? `      ${relatedBlock}\n` : ""}${mobileAffiliateBlock}      </article>
    </div>
${showcaseHostBlock}${contentRailBlock}
  </main>
  ${lightbox}
${sharedScripts}${mediaPilotScripts}  <script src="${prefix}spot-map.js?v=${assetVersion("spot-map.js")}"></script>
  ${lightboxJs}
  ${affiliateTrackingScript(lang)}
</body>
</html>
`;
}

function englishIndexHTML() {
  const featured = ["fuji", "hamanako", "solar-ark", "torikai-train-depot"].map((id) => {
    const spot = SPOTS.find((item) => item.id === id);
    const data = spot.en || spot.ja;
    return `<a class="guide-visual-card" href="spots/${spot.id}.html">
          <img src="../${escapeHTML(thumbnailSrc(spot.image))}" alt="${escapeHTML(data.name)} from the Shinkansen window" loading="lazy" decoding="async">
          <span>${escapeHTML(data.area)}</span>
          <strong>${escapeHTML(data.name)}</strong>
          <em>${escapeHTML(data.hook)}</em>
        </a>`;
  }).join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteRoot}/en/#website`,
    "name": "Shinkansen Window",
    "url": `${siteRoot}/en/`,
    "inLanguage": "en",
    "description": UI.en.homeLead,
    "isPartOf": {
      "@type": "WebSite",
      "name": "新幹線の窓",
      "url": siteRoot,
    },
  };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(UI.en.homeTitle)}</title>
  <meta name="description" content="${escapeHTML(UI.en.homeLead)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${siteRoot}/en/">
  <link rel="alternate" hreflang="ja" href="${siteRoot}/">
  <link rel="alternate" hreflang="en" href="${siteRoot}/en/">
  <link rel="alternate" hreflang="x-default" href="${siteRoot}/">
  <link rel="stylesheet" href="../style.css?v=${assetVersion("style.css")}">
  <meta property="og:title" content="${escapeHTML(UI.en.homeTitle)}">
  <meta property="og:description" content="${escapeHTML(UI.en.homeLead)}">
  <meta property="og:image" content="${defaultOgImageUrl()}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${siteRoot}/en/">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(UI.en.homeTitle)}">
  <meta name="twitter:description" content="${escapeHTML(UI.en.homeLead)}">
  <meta name="twitter:image" content="${defaultOgImageUrl()}">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  ${analyticsSnippet()}
</head>
<body class="spot-page">
  ${siteHeaderHTML("en", "../", "../", "./")}
  <main>
    <article class="spot-page-article">
      <p class="eyebrow">TOKAIDO SHINKANSEN WINDOW GUIDE</p>
      <h1>Do not miss the view from your Shinkansen window.</h1>
      <p class="spot-page-lead">${escapeHTML(UI.en.homeLead)}</p>
      <div class="spot-page-actions spot-page-actions-top">
        <a class="btn btn-primary" href="./#journey">Find your train</a>
        <a class="btn btn-ghost" href="zukan.html">Browse the field guide</a>
      </div>
      <section class="spot-page-section guide-answer-panel" aria-label="Quick Shinkansen window guide">
        <div class="guide-answer-copy">
          <h2>Start with Seat E for Mt. Fuji.</h2>
          <p>On the Tokaido Shinkansen, the classic Mt. Fuji view is on the E-seat side. Shinkansen Window also helps you notice short views of lakes, castles, signs, train depots, and Kyoto landmarks.</p>
        </div>
        <dl class="guide-fact-grid">
          <div><dt>Best-known view</dt><dd>Mt. Fuji</dd><p>Watch around Mishima to Shin-Fuji.</p></div>
          <div><dt>Also along the route</dt><dd>${SPOT_COUNT} views</dd><p>From Tokyo to Shin-Osaka.</p></div>
          <div><dt>Best use</dt><dd>Before boarding</dd><p>Pick a train and keep the timeline ready.</p></div>
        </dl>
      </section>
      <section class="spot-page-section guide-featured-panel">
        <div class="guide-section-head">
          <h2>Views worth looking up for</h2>
          <p>These views last only seconds or minutes. That is why the timing matters.</p>
        </div>
        <div class="guide-visual-grid">${featured}</div>
      </section>
      <section class="spot-page-section guide-beyond-panel">
        <h2>Plan the window side before you ride</h2>
        <p>Use the train search to build a timed window guide, or open the Live Guide while riding.</p>
        <div class="spot-page-actions">
          <a class="btn btn-primary" href="./#journey">Build my timed guide</a>
          <a class="btn btn-ghost" href="live/">Open Live Guide</a>
          <a class="btn btn-ghost" href="guide.html">Read the Mt. Fuji FAQ</a>
        </div>
      </section>
    </article>
  </main>
</body>
</html>
`;
}

function replaceSpotCountClaims(html) {
  const replacements = [
    ["37景", `${SPOT_COUNT}景`],
    ["37の車窓", `${SPOT_COUNT}の車窓`],
    ["全37景", `全${SPOT_COUNT}景`],
    ["37 views", `${SPOT_COUNT} views`],
    ["37 curated window views", `${SPOT_COUNT} curated window views`],
    ["37-view", `${SPOT_COUNT}-view`],
    ["37 recommended", `${SPOT_COUNT} recommended`],
    ["37 Tokaido", `${SPOT_COUNT} Tokaido`],
    ["37個景色", `${SPOT_COUNT}個景色`],
    ["37個車窗景色", `${SPOT_COUNT}個車窗景色`],
    ["37個の景色", `${SPOT_COUNT}個の景色`],
    ["37个景色", `${SPOT_COUNT}个景色`],
    ["37个精选车窗景色", `${SPOT_COUNT}个精选车窗景色`],
    ["37个车窗景色", `${SPOT_COUNT}个车窗景色`],
    ["37개 풍경", `${SPOT_COUNT}개 풍경`],
    ["37개의", `${SPOT_COUNT}개의`],
    ["36個車窗景色", `${SPOT_COUNT - 1}個車窗景色`],
    ["36个车窗景色", `${SPOT_COUNT - 1}个车窗景色`],
    ["36개의 차창 풍경", `${SPOT_COUNT - 1}개의 차창 풍경`],
    ["37 vues", `${SPOT_COUNT} vues`],
    ["37 paysages", `${SPOT_COUNT} paysages`],
    ["36 autres paysages", `${SPOT_COUNT - 1} autres paysages`],
    ["37 Day and Night Views", `${SPOT_COUNT} Day and Night Views`],
    ["plus 36 more views", `plus ${SPOT_COUNT - 1} more views`],
    ["37 مشهدًا", `${SPOT_COUNT} مشهدًا`],
    ["الـ37", `الـ${SPOT_COUNT}`],
  ];
  return replacements.reduce((result, [from, to]) => result.replaceAll(from, to), html);
}

function englishAppIndexHTML() {
  const railCopy = [
    ["次に見る案内", "Recommended next steps"],
    ["ディズニー新幹線", "Disney special train"],
    ["運転日と、車窓で出会う目安を確認。", "Check operating dates and window-side estimates."],
    ["Android版の先行アクセス", "Help us test the Android app"],
    ["公開前アプリのテスターを募集中。", "We are looking for testers for the pre-release app."],
    ["車窓メダル帖", "Window Medal Book"],
    ["新幹線の窓とは？", "About Shinkansen Window"],
    ["車窓をもっと楽しむ", "More ways to enjoy the window"],
    ["富士山FAQ", "Mt. Fuji FAQ"],
    ["見える時刻、座席側、曇りの日の答えを確認。", "Check the timing, seat side, and what to expect on cloudy days."],
    ["見える予報β", "Visibility β"],
    ["今日の富士山 見える予報", "Today's Mt. Fuji Visibility Forecast"],
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
  const railRoutes = ["guide", "mieru", "sumie", "somato", "journal", "lp", "references", "contact", "privacy", "hanabi", "yakei"];
  let html = fs.readFileSync(path.join(appDir, "index.html"), "utf8")
    .replace('<html lang="ja">', '<html lang="en">')
    .replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n  <base href="../">'
    )
    .replace(/<title>[^<]*<\/title>/, '<title>Tokaido Shinkansen (Bullet Train) Window Views | Times and Seat Side</title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Riding the Tokaido Shinkansen bullet train between Tokyo and Shin-Osaka? Pick your train to see when you pass Mt. Fuji and 37 other window views, and which side to sit on.">')
    .replace('<link rel="canonical" href="https://www.michikusa-travel.com/">', '<link rel="canonical" href="https://www.michikusa-travel.com/en/">')
    .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Shinkansen Window | Never miss the view">')
    .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Find the time and seat side for Mt. Fuji and 37 views from the Tokaido Shinkansen bullet train.">')
    .replace('<meta property="og:url" content="https://www.michikusa-travel.com/">', '<meta property="og:url" content="https://www.michikusa-travel.com/en/">')
    .replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="Shinkansen Window | Never miss the view">')
    .replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="Find the time and seat side for Mt. Fuji and 37 Tokaido Shinkansen bullet train window views.">')
    .replace(/<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="Shinkansen Window — another journey beyond the glass.">')
    .replaceAll('"inLanguage": "ja"', '"inLanguage": "en"')
    .replace('<body>', '<body>\n  <script>try { localStorage.setItem("mado-lang", "en"); } catch (error) {}</script>');
  html = html.replace(/\s*<!-- ===== Seasonal entry point ===== -->\s*<aside class="seasonal-entry"[\s\S]*?<\/aside>\s*/, "\n\n  ");
  html = html.replace(/\s*<a class="top-promo-card top-promo-card-727"[\s\S]*?data-cta-id="top_(?:journey|footer)_727"[\s\S]*?<\/a>/g, "");
  railCopy.forEach(([ja, en]) => { html = html.replaceAll(ja, en); });
  railRoutes.forEach((route) => {
    html = html
    .replaceAll('href="sparkling-dreams.html"', 'href="en/sparkling-dreams.html"')
    .replaceAll('href="early-access.html?src=top-promo"', 'href="en/early-access.html?src=top-promo"').replaceAll(`href="${route}.html"`, `href="en/${route}.html"`);
  });
  html = html
    .replaceAll('href="guide.html#', 'href="en/guide.html#')
    .replaceAll('href="zukan.html?filter=', 'href="en/zukan.html?filter=');
  const headEnd = html.indexOf("</head>");
  if (headEnd < 0) return replaceSpotCountClaims(html);
  return `${html.slice(0, headEnd + "</head>".length)}${replaceSpotCountClaims(html.slice(headEnd + "</head>".length))}`;
}

function guideHTML(lang) {
  const ui = UI[lang];
  const prefix = lang === "ja" ? "" : "../";
  const guideUrl = lang === "ja" ? `${siteRoot}/guide.html` : `${siteRoot}/en/guide.html`;
  const appUrl = lang === "ja" ? "index.html#journey" : "./#journey";
  const otherUrl = lang === "ja" ? "en/guide.html" : "../guide.html";
  const questions = ui.guideQuestions.map((item) => {
    const href = lang === "ja"
      ? item.link
      : (item.link.startsWith("index") ? `./#gallery` : `../${item.link}`);
    return `<article class="faq-card">
        <h2>${escapeHTML(item.q)}</h2>
        <p>${escapeHTML(item.a)} <a href="${escapeHTML(href)}">${escapeHTML(item.linkText)}</a></p>
      </article>`;
  }).join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${guideUrl}#webpage`,
    "url": guideUrl,
    "name": ui.guideTitle,
    "description": ui.guideLead,
    "inLanguage": lang,
  };
  const quickFacts = lang === "en" ? `
      <section class="spot-page-section guide-answer-panel" aria-label="Mt. Fuji quick answer">
        <div class="guide-answer-copy">
          <h2>${escapeHTML(ui.guidePracticalTitle)}</h2>
          <p>${escapeHTML(ui.guidePracticalBody)}</p>
        </div>
        <dl class="guide-fact-grid">
          ${ui.guideQuickFacts.map((fact) => `<div>
            <dt>${escapeHTML(fact.label)}</dt>
            <dd>${escapeHTML(fact.value)}</dd>
            <p>${escapeHTML(fact.detail)}</p>
          </div>`).join("")}
        </dl>
      </section>
      <section class="spot-page-section guide-featured-panel">
        <div class="guide-section-head">
          <h2>${escapeHTML(ui.guideFeaturedTitle)}</h2>
          <p>${escapeHTML(ui.guideFeaturedLead)}</p>
        </div>
        <div class="guide-visual-grid">
          ${["fuji", "hamanako", "toji"].map((id) => {
            const spot = SPOTS.find((item) => item.id === id);
            const data = spot.en || spot.ja;
            return `<a class="guide-visual-card" href="../spots/${spot.id}.html">
              <img src="../${escapeHTML(thumbnailSrc(spot.image))}" alt="${escapeHTML(data.name)}" loading="lazy" decoding="async">
              <span>${escapeHTML(data.area)}</span>
              <strong>${escapeHTML(data.name)}</strong>
              <em>${escapeHTML(data.hook)}</em>
            </a>`;
          }).join("")}
        </div>
      </section>
      <section class="spot-page-section guide-beyond-panel">
        <h2>${escapeHTML(ui.guideBeyondTitle)}</h2>
        <p>${escapeHTML(ui.guideBeyondBody)}</p>
        <div class="spot-page-actions">
          <a class="btn btn-primary" href="./#gallery">Browse timed window views</a>
          <a class="btn btn-ghost" href="./#journey">Find your train</a>
        </div>
      </section>
` : "";
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(ui.guideTitle)}</title>
  <meta name="description" content="${escapeHTML(ui.guideLead)}">
  <link rel="canonical" href="${guideUrl}">
  <link rel="alternate" hreflang="ja" href="${siteRoot}/guide.html">
  <link rel="alternate" hreflang="en" href="${siteRoot}/en/guide.html">
  <link rel="alternate" hreflang="zh-Hant-TW" href="${siteRoot}/zh-Hant/guide.html">
  <link rel="alternate" hreflang="zh-Hans-CN" href="${siteRoot}/zh-Hans/guide.html">
  <link rel="alternate" hreflang="ko" href="${siteRoot}/ko/guide.html">
  <link rel="alternate" hreflang="fr" href="${siteRoot}/fr/guide.html">
  <link rel="alternate" hreflang="x-default" href="${siteRoot}/en/guide.html">
  <link rel="stylesheet" href="${prefix}style.css?v=${assetVersion("style.css")}">
  <meta property="og:title" content="${escapeHTML(ui.guideTitle)}">
  <meta property="og:description" content="${escapeHTML(ui.guideLead)}">
  <meta property="og:image" content="${defaultOgImageUrl()}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${guideUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(ui.guideTitle)}">
  <meta name="twitter:description" content="${escapeHTML(ui.guideLead)}">
  <meta name="twitter:image" content="${defaultOgImageUrl()}">
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  ${analyticsSnippet()}
</head>
<body class="spot-page">
  ${siteHeaderHTML(lang, prefix, lang === "ja" ? "guide.html" : "../guide.html", lang === "ja" ? "en/guide.html" : "guide.html")}
  <main>
    <article class="spot-page-article">
      <p class="eyebrow">${escapeHTML(ui.eyebrow)}</p>
      <h1>${escapeHTML(ui.guideHeading)}</h1>
      <p class="spot-page-lead">${escapeHTML(ui.guideLead)}</p>
      <div class="spot-page-actions spot-page-actions-top">
        <a class="btn btn-primary" href="${appUrl}">${escapeHTML(ui.guideBack)}</a>
        <a class="btn btn-ghost" href="${lang === "ja" ? "spots/fuji.html" : "../spots/fuji.html"}">${escapeHTML(ui.guideQuestions[1].linkText)}</a>
      </div>${quickFacts}
      <section class="spot-page-section">
        <div class="faq-grid">${questions}</div>
      </section>
    </article>
  </main>
</body>
</html>
`;
}

function sitemapXML() {
  const baseUrls = [
    { loc: pageUrl("ja"), priority: "1.0", changefreq: "weekly", lastmod: "2026-07-29" },
    { loc: pageUrl("en"), priority: "0.9", changefreq: "weekly", lastmod: "2026-07-29" },
    { loc: `${siteRoot}/zukan.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-07-29" },
    { loc: `${siteRoot}/en/zukan.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-07-29" },
    { loc: `${siteRoot}/journal.html`, priority: "0.7", changefreq: "weekly", lastmod: "2026-08-09" },
    { loc: `${siteRoot}/727-collection.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-15" },
    { loc: `${siteRoot}/live/`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-16" },
    { loc: `${siteRoot}/en/live/`, priority: "0.6", changefreq: "monthly", lastmod: "2026-08-16" },
    { loc: `${siteRoot}/en/journal.html`, priority: "0.7", changefreq: "weekly", lastmod: "2026-08-09" },
    { loc: `${siteRoot}/mieru.html`, priority: "0.8", changefreq: "daily", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/en/mieru.html`, priority: "0.8", changefreq: "daily", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/sumie.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/en/sumie.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/somato.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/en/somato.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/en/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/yakei.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-14" },
    { loc: `${siteRoot}/en/yakei.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-14" },
    { loc: `${siteRoot}/hanabi.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-13" },
    { loc: `${siteRoot}/sparkling-dreams.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-08-11" },
    { loc: `${siteRoot}/en/hanabi.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-13" },
    { loc: `${siteRoot}/en/sparkling-dreams.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-08-11" },
    { loc: `${siteRoot}/zh-Hant/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/ko/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/zh-Hans/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/fr/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/ar/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-08-04" },
    { loc: `${siteRoot}/references.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/en/references.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/contact.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/en/contact.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/privacy.html`, priority: "0.3", changefreq: "yearly" },
    { loc: `${siteRoot}/en/privacy.html`, priority: "0.3", changefreq: "yearly" },
  ];
  // 個別に更新したスポットだけ日付を上書きする。全件を一斉に書き換えないための例外表。
  const spotLastmodOverrides = { "727-board": "2026-08-15" };
  const spotUrls = SPOTS.flatMap((spot) => ["ja", "en"].map((lang) => ({
    loc: pageUrl(lang, spot.id),
    priority: featuredIds.includes(spot.id) ? "0.8" : "0.6",
    changefreq: "monthly",
    lastmod: spotLastmodOverrides[spot.id] || "2026-08-02",
  })));
  const urls = [...baseUrls, ...spotUrls].map((item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod || DEFAULT_LASTMOD}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function comparableSpotHead(html) {
  const head = html.match(/<head>[\s\S]*?<\/head>/i)?.[0] || "";
  return head.replace(/\s*<link rel="stylesheet" href="[^"]*spot-media-gallery\.css[^"]*">/g, "").replace(/\s+/g, " ").trim();
}

function planSpotPage(spotOrId, lang, { requireExisting = false, preserveHead = false } = {}) {
  const spot = typeof spotOrId === "string" ? SPOTS.find((item) => item.id === spotOrId) : spotOrId;
  if (!spot || !SHARED_SPOT_LANGUAGES.has(lang)) throw new Error("Unknown shared spot page: " + spotOrId + "/" + lang);
  const dir = lang === "ja" ? path.join(appDir, "spots") : path.join(appDir, "en", "spots");
  const outputPath = path.join(dir, spot.id + ".html");
  if (requireExisting && !fs.existsSync(outputPath)) throw new Error("Spot page output is missing: " + outputPath);
  const generatedHTML = spotPageHTML(spot, lang);
  if (preserveHead && fs.existsSync(outputPath)) {
    const currentHTML = fs.readFileSync(outputPath, "utf8");
    if (comparableSpotHead(currentHTML) !== comparableSpotHead(generatedHTML)) throw new Error("Spot page head changed unexpectedly: " + outputPath);
  }
  return { outputPath, generatedHTML };
}

function writeFileIfChanged(outputPath, content) {
  if (fs.existsSync(outputPath) && fs.readFileSync(outputPath, "utf8") === content) return false;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");
  return true;
}

function writeSpotPagePlan({ outputPath, generatedHTML }) {
  writeFileIfChanged(outputPath, generatedHTML);
  return outputPath;
}

function isSpotPagePlanChanged({ outputPath, generatedHTML }) {
  return !fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== generatedHTML;
}

function writeChangedSpotPagePlans(plans, writer = writeSpotPagePlan) {
  const changed = plans.filter(isSpotPagePlanChanged);
  changed.forEach(writer);
  return changed;
}

function reportSpotPagePlan(plans) {
  const changed = plans.filter(isSpotPagePlanChanged);
  const unchangedCount = plans.length - changed.length;
  console.log(`${CHECK_ONLY ? "Spot page preflight" : "Spot page write plan"}: ${changed.length} changed, ${unchangedCount} unchanged.`);
  if (changed.length) {
    const preview = changed.slice(0, 20).map(({ outputPath }) => path.relative(appDir, outputPath));
    console.log(`  ${preview.join(", ")}${changed.length > preview.length ? `, ... +${changed.length - preview.length} more` : ""}`);
  }
  return changed;
}

function generateSpotPage(spotOrId, lang, options = {}) {
  const plan = planSpotPage(spotOrId, lang, options);
  reportSpotPagePlan([plan]);
  if (!CHECK_ONLY) writeChangedSpotPagePlans([plan]);
  return plan.outputPath;
}

function generateSpotPages({ requireExisting = false, preserveHead = false } = {}) {
  const plans = [];
  for (const lang of ["ja", "en"]) for (const spot of SPOTS) plans.push(planSpotPage(spot, lang, { requireExisting, preserveHead }));
  reportSpotPagePlan(plans);
  if (!CHECK_ONLY) writeChangedSpotPagePlans(plans);
  return plans.map(({ outputPath }) => outputPath);
}

export { SHARED_SPOT_LANGUAGES, SPOTS, generateSpotPage, generateSpotPages, isSpotPagePlanChanged, planSpotPage, spotPageHTML, writeChangedSpotPagePlans };

if (isMain) {
const requestedSpotIds = process.argv.slice(2).filter((arg) => arg !== "--check");
if (requestedSpotIds.length) {
  requestedSpotIds.forEach((id) => generateSpotPage(id, "ja", { requireExisting: true, preserveHead: true }));
  console.log(`${CHECK_ONLY ? "Preflighted" : "Generated"} ${requestedSpotIds.length} requested Japanese spot pages`);
  process.exit(0);
}
generateSpotPages();
if (CHECK_ONLY) {
  console.log("Spot page preflight completed without writing files.");
  process.exit(0);
}

fs.mkdirSync(path.join(appDir, "en"), { recursive: true });
writeFileIfChanged(path.join(appDir, "en", "index.html"), englishAppIndexHTML());
await import("./generate-language-mirrors.mjs");
for (const relativePath of ["en/journal.html", "ar/guide.html"]) {
  const absolutePath = path.join(appDir, relativePath);
  if (fs.existsSync(absolutePath)) {
    writeFileIfChanged(absolutePath, replaceSpotCountClaims(fs.readFileSync(absolutePath, "utf8")));
  }
}
// Guide pages are hand-edited SEO answer pages.
// Keep only their shared route rail generated from the same source as spot pages.
const guideRailSpot = SPOTS.find((spot) => spot.id === "fuji");
const guideRailConfigs = [
  {
    lang: "ja", path: "guide.html", prefix: "", spotHrefPrefix: "spots/",
    ctaHref: "index.html#journey", footHref: "zukan.html", includeAffiliate: true,
  },
  {
    lang: "en", path: path.join("en", "guide.html"), prefix: "../", spotHrefPrefix: "spots/",
    ctaHref: "./#journey", footHref: "zukan.html", includeAffiliate: true,
  },
  {
    lang: "zh-Hant", path: path.join("zh-Hant", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
  {
    lang: "ko", path: path.join("ko", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
  {
    lang: "zh-Hans", path: path.join("zh-Hans", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
  {
    lang: "fr", path: path.join("fr", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
];
for (const config of guideRailConfigs) {
  const lang = config.lang;
  const guidePath = path.join(appDir, config.path);
  const guideHTML = fs.readFileSync(guidePath, "utf8");
  const railLocalization = GUIDE_RAIL_LOCALIZATION[lang] || {};
  const rail = spotRailHTML(guideRailSpot, lang, config.prefix, {
    asideClass: "spot-page-rail guide-page-rail",
    spotHrefPrefix: config.spotHrefPrefix,
    ctaHref: config.ctaHref,
    ctaAttributes: 'data-guide-cta="rail_exact_time"',
    bottomCtaAttributes: 'data-guide-cta="rail_exact_time_bottom"',
    showGuideLead: true,
    showBottomCta: true,
    footHref: config.footHref,
    includeAffiliate: config.includeAffiliate,
    affiliatePlacement: `${lang}_guide_rail_after_route`,
    affiliateContext: "guide",
    absoluteAffiliateUrls: true,
    spotNames: railLocalization.spots,
    stationNames: railLocalization.stations,
    trackSpotClicks: config.trackSpotClicks,
    railPlacement: `${lang}_guide_rail`,
  });
  const start = "<!-- GUIDE_RAIL_START -->";
  const end = "<!-- GUIDE_RAIL_END -->";
  if (!guideHTML.includes(start) || !guideHTML.includes(end)) {
    throw new Error(`Guide rail markers missing: ${guidePath}`);
  }
  let syncedGuideHTML = guideHTML.replace(
    new RegExp(`${start}[\\s\\S]*?${end}`),
    `${start}\n      ${rail}\n      ${end}`,
  );
  const mobileStart = "<!-- GUIDE_MOBILE_SPOTS_START -->";
  const mobileEnd = "<!-- GUIDE_MOBILE_SPOTS_END -->";
  if (!syncedGuideHTML.includes(mobileStart) || !syncedGuideHTML.includes(mobileEnd)) {
    throw new Error(`Guide mobile spot markers missing: ${guidePath}`);
  }
  const mobileSpots = guideMobileSpotStripHTML(lang, config.prefix, config.spotHrefPrefix);
  syncedGuideHTML = syncedGuideHTML.replace(
    new RegExp(`${mobileStart}[\\s\\S]*?${mobileEnd}`),
    `${mobileStart}\n        ${mobileSpots}\n        ${mobileEnd}`,
  );
  writeFileIfChanged(guidePath, replaceSpotCountClaims(syncedGuideHTML));
}
writeFileIfChanged(path.join(appDir, "sitemap.xml"), sitemapXML());

await import("./generate-content-manifest.mjs");

console.log(`Generated ${SPOTS.length} Japanese spot pages, ${SPOTS.length} English spot pages, /en/, sitemap.xml, and content-manifest.json`);
}
