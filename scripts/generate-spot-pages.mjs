import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { thumbnailSrc, hasMiniMapCoordinates, miniMapViewpoint, mercatorPoint, miniMapZoomForViewpoint } from "./shared/geo.mjs";
import { assetVersion } from "./shared/asset-version.mjs";
import { SPOT_COUNT as SHARED_SPOT_COUNT, syncSpotCountClaims } from "./shared/spot-count.mjs";

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

const dataCode = fs.readFileSync(dataPath, "utf8");
const { SPOTS, ROUTE } = vm.runInNewContext(`${dataCode}\n;({ SPOTS, ROUTE });`, {}, { filename: dataPath });
const SPOT_COUNT = SPOTS.length;
if (SPOT_COUNT !== SHARED_SPOT_COUNT) {
  throw new Error(`spot count mismatch: generator ${SPOT_COUNT} vs shared/spot-count.mjs ${SHARED_SPOT_COUNT}`);
}
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
    facts: ["Section", "Seat side", "Timing", "Photos"],
    photoUnit: "photos",
    routeNote: (area, side) => {
      // 両側から見えるスポット(浜名湖など)のラベルは "Seat A · left / Seat E · right ..." と
      // 連結されている。先頭一致だけで判定すると A席専用と誤読するので、連結を先に弾く。
      const both = side.indexOf(" / ") >= 0 || side.indexOf("Both") === 0;
      const seatE = !both && side.indexOf("Seat E") === 0;
      const seatA = !both && side.indexOf("Seat A") === 0;
      const window = seatE ? "right-hand window (Seat E)" : seatA ? "left-hand window (Seat A)" : "window on either side";
      const flip = seatE
        ? " and the same Seat E is on your left"
        : seatA
          ? " and the same Seat A is on your right"
          : "";
      return `If you are traveling from Tokyo toward Shin-Osaka, start watching the ${window} as you approach ${enApproachArea(area)}. If you are traveling toward Tokyo, the order is reversed${flip}.`;
    },
    pointText: (name) => `${name} is one of the window views that make the Tokaido Shinkansen more than a transfer. The train moves fast, so visibility depends on weather, seat position, and timing.`,
    sideA: "Seat A · left side toward Kyoto",
    sideE: "Seat E · right side toward Kyoto",
    sideBoth: "Both sides",
    hamanakoSide: "Seat A · left / Seat E · right (toward Kyoto)",
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
  de: {
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "Ausblicke Tokio → Shin-Osaka",
    railCountSuffix: " Ausblicke",
    railNowLabel: (name, min, seat) => `<b>${name}</b> Etwa ${min} Min. ab Tokio · ${seat}`,
    railCta: "Reiseplan für meinen Zug erstellen",
    railLead: `Wählen Sie Ihren Zug, um die voraussichtliche Vorbeifahrtszeit für alle ${SPOT_COUNT} Ausblicke zu sehen.`,
    railBottomCta: `Alle ${SPOT_COUNT} Ausblicke passend zu meinem Zug anzeigen`,
    railFoot: `Alle ${SPOT_COUNT} Ausblicke in Fotos ansehen →`,
    railStationSuffix: " Min.",
    mobileSpotRailLabel: "Empfohlene Ausblicke zwischen Tokio und Shin-Osaka",
    mobileSpotMeta: (min, seat) => `Etwa ${min} Min. · Sitz ${seat}`,
    mobileSpotAction: "Guide lesen",
    sideA: "Sitz A · Meerseite",
    sideE: "Sitz E · Bergseite",
    sideBoth: "Auf beiden Seiten",
    hamanakoSide: "Sitz A · Meerseite / Sitz E · Bergseite",
  },
  es: {
    railEyebrow: "Tokaido Shinkansen",
    railTitle: "Vistas Tokio → Shin-Osaka",
    railCountSuffix: " vistas",
    railNowLabel: (name, min, seat) => `<b>${name}</b> A unos ${min} min de Tokio · ${seat}`,
    railCta: "Crear la guía de mi tren",
    railLead: `Elige tu tren para ver la hora estimada de paso por cada una de las ${SPOT_COUNT} vistas.`,
    railBottomCta: `Ver las ${SPOT_COUNT} vistas a la hora de mi tren`,
    railFoot: `Explorar las ${SPOT_COUNT} vistas en fotos →`,
    railStationSuffix: " min",
    mobileSpotRailLabel: "Vistas destacadas entre Tokio y Shin-Osaka",
    mobileSpotMeta: (min, seat) => `A unos ${min} min · asiento ${seat}`,
    mobileSpotAction: "Leer la guía",
    sideA: "Asiento A · lado del mar",
    sideE: "Asiento E · lado de la montaña",
    sideBoth: "A ambos lados",
    hamanakoSide: "Asiento A · lado del mar / asiento E · lado de la montaña",
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
      fuji: "富士山", "fuji-bus-sales": "富士巴士銷售展示場", "shimizu-port-chikyu": "清水港與CHIKYU深海探查船", granship: "格蘭希普", "left-fuji": "左富士",
      "sapporo-shizuoka-factory": "札幌啤酒靜岡工廠", "shizuoka-tea-fields": "靜岡茶園", kakegawa: "掛川城", "genki-sign": "悉平加油看板",
      hamanako: "濱名湖", "hamanako-fuji": "濱名湖遠眺富士山", "toyohashi-tateiwa": "豐橋立岩巨石",
      "mikawa-oshima": "三河大島", "nichiban-anjo": "CELLOTAPE牆面看板",
      "nagoya-station-skyline": "名古屋站前天際線", "kirin-beer-factory": "麒麟啤酒工廠",
      kiyosu: "清洲城", "solar-ark": "Solar Ark太陽能設施", "gifu-castle": "岐阜城",
      kinshozan: "金生山", "nangu-taisha": "南宮大社大鳥居", ibuki: "伊吹山",
      "sawayama-castle": "佐和山城跡", "hikone-castle": "彦根城", "kannonji-castle": "觀音寺城跡",
      "omi-fuji": "近江富士", "seta-karahashi": "瀨田唐橋", toji: "東寺五重塔", "rakusai-egg-tanks": "洛西淨化中心蛋形消化槽",
      "torikai-train-depot": "鳥飼新幹線車輛基地",
      "727-sign": "727 COSMETICS看板", "mishima-catapult": "三島車輛所的彈射台", "fuji-pipe-sign": "Fujipipe屋頂看板", "fuji-paper-mills": "富士的造紙工廠", "fujikawa-bridge": "富士川鐵橋與水管橋", "gifu-hashima-mahalo": "岐阜羽島的Mahalo看板", "sennenq-sign": "千年灸看板", "fujitec-big-wing": "FUJITEC Big Wing", "lotte-shiga": "樂天滋賀工廠的零食看板", "hirakata-park-wheel": "枚方公園摩天輪",
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
      fuji: "富士山", "fuji-bus-sales": "富士巴士销售展示场", "shimizu-port-chikyu": "清水港与CHIKYU深海钻探船", granship: "格兰希普", "left-fuji": "左富士",
      "sapporo-shizuoka-factory": "札幌啤酒静冈工厂", "shizuoka-tea-fields": "静冈茶园", kakegawa: "挂川城", "genki-sign": "悉平加油广告牌",
      hamanako: "滨名湖", "hamanako-fuji": "滨名湖远眺富士山", "toyohashi-tateiwa": "丰桥立岩巨石",
      "mikawa-oshima": "三河大岛", "nichiban-anjo": "CELLOTAPE墙面广告",
      "nagoya-station-skyline": "名古屋站前天际线", "kirin-beer-factory": "麒麟啤酒工厂",
      kiyosu: "清洲城", "solar-ark": "Solar Ark太阳能设施", "gifu-castle": "岐阜城",
      kinshozan: "金生山", "nangu-taisha": "南宫大社大鸟居", ibuki: "伊吹山",
      "sawayama-castle": "佐和山城遗址", "hikone-castle": "彦根城", "kannonji-castle": "观音寺城遗址",
      "omi-fuji": "近江富士", "seta-karahashi": "濑田唐桥", toji: "东寺五重塔", "rakusai-egg-tanks": "洛西净化中心蛋形消化罐",
      "torikai-train-depot": "鸟饲新干线车辆基地",
      "727-sign": "727 COSMETICS广告牌", "mishima-catapult": "三岛车辆所的弹射台", "fuji-pipe-sign": "Fujipipe屋顶广告牌", "fuji-paper-mills": "富士的造纸厂", "fujikawa-bridge": "富士川铁桥与水管桥", "gifu-hashima-mahalo": "岐阜羽岛的Mahalo广告牌", "sennenq-sign": "千年灸广告牌", "fujitec-big-wing": "FUJITEC Big Wing", "lotte-shiga": "乐天滋贺工厂的零食广告牌", "hirakata-park-wheel": "枚方公园摩天轮",
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
      fuji: "후지산", "fuji-bus-sales": "후지버스판매 전시장", "shimizu-port-chikyu": "시미즈항과 CHIKYU 심해 시추선", granship: "그랜십", "left-fuji": "왼쪽 후지산",
      "sapporo-shizuoka-factory": "삿포로 맥주 시즈오카 공장", "shizuoka-tea-fields": "시즈오카 차밭", kakegawa: "가케가와성", "genki-sign": "싯페이 응원 간판",
      hamanako: "하마나호", "hamanako-fuji": "하마나호 너머의 후지산", "toyohashi-tateiwa": "도요하시 다테이와 바위",
      "mikawa-oshima": "미카와오시마", "nichiban-anjo": "CELLOTAPE 벽 간판",
      "nagoya-station-skyline": "나고야역 스카이라인", "kirin-beer-factory": "기린 맥주 공장",
      kiyosu: "기요스성", "solar-ark": "솔라 아크 태양광 시설", "gifu-castle": "기후성",
      kinshozan: "긴쇼산", "nangu-taisha": "난구 다이샤 대도리이", ibuki: "이부키산",
      "sawayama-castle": "사와야마성 유적", "hikone-castle": "히코네성", "kannonji-castle": "간논지성 유적",
      "omi-fuji": "오미후지", "seta-karahashi": "세타노 가라하시", toji: "도지 오층탑", "rakusai-egg-tanks": "라쿠사이 하수처리장 달걀형 탱크",
      "torikai-train-depot": "도리카이 신칸센 차량기지",
      "727-sign": "727 COSMETICS 간판", "mishima-catapult": "미시마 차량소 캐터펄트", "fuji-pipe-sign": "후지파이프 옥상 간판", "fuji-paper-mills": "후지의 제지 공장", "fujikawa-bridge": "후지강 철교와 수도관교", "gifu-hashima-mahalo": "기후하시마 마할로 간판", "sennenq-sign": "센넨큐 간판", "fujitec-big-wing": "FUJITEC Big Wing", "lotte-shiga": "롯데 시가 공장 과자 간판", "hirakata-park-wheel": "히라카타 파크 관람차",
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
      fuji: "Mont Fuji", "fuji-bus-sales": "Parc de bus Fuji Bus Sales", "shimizu-port-chikyu": "Port de Shimizu et navire CHIKYU", granship: "Granship", "left-fuji": "Fuji côté gauche",
      "sapporo-shizuoka-factory": "Brasserie Sapporo de Shizuoka", "shizuoka-tea-fields": "Champs de thé de Shizuoka", kakegawa: "Château de Kakegawa", "genki-sign": "Panneau d'encouragement Shippei",
      hamanako: "Lac Hamana", "hamanako-fuji": "Mont Fuji depuis le lac Hamana", "toyohashi-tateiwa": "Rocher Tateiwa de Toyohashi",
      "mikawa-oshima": "Île de Mikawa-Oshima", "nichiban-anjo": "Façade CELLOTAPE",
      "nagoya-station-skyline": "Panorama de la gare de Nagoya", "kirin-beer-factory": "Brasserie Kirin",
      kiyosu: "Château de Kiyosu", "solar-ark": "Centrale solaire Solar Ark", "gifu-castle": "Château de Gifu",
      kinshozan: "Mont Kinshozan", "nangu-taisha": "Grand torii de Nangu Taisha", ibuki: "Mont Ibuki",
      "sawayama-castle": "Ruines du château de Sawayama", "hikone-castle": "Château de Hikone", "kannonji-castle": "Ruines du château de Kannonji",
      "omi-fuji": "Omi Fuji", "seta-karahashi": "Pont Seta no Karahashi", toji: "Pagode à cinq étages de To-ji", "rakusai-egg-tanks": "Cuves ovoïdes de Rakusai",
      "torikai-train-depot": "Dépôt Shinkansen de Torikai",
      "727-sign": "Panneau 727 COSMETICS", "mishima-catapult": "Catapulte Shinkansen de Mishima", "fuji-pipe-sign": "Panneau Fujipipe sur le toit", "fuji-paper-mills": "Papeteries de Fuji", "fujikawa-bridge": "Pont de la Fuji et pont-conduite", "gifu-hashima-mahalo": "Panneau Mahalo à Gifu-Hashima", "sennenq-sign": "Panneau Sennen Kyū", "fujitec-big-wing": "FUJITEC Big Wing", "lotte-shiga": "Panneaux de confiserie de Lotte Shiga", "hirakata-park-wheel": "Grande roue de Hirakata Park",
    },
  },
  de: {
    stations: {
      Tokyo: "Tokio", Shinagawa: "Shinagawa", "Shin-Yokohama": "Shin-Yokohama", Odawara: "Odawara",
      Atami: "Atami", Mishima: "Mishima", "Shin-Fuji": "Shin-Fuji", Shizuoka: "Shizuoka",
      Kakegawa: "Kakegawa", Hamamatsu: "Hamamatsu", Toyohashi: "Toyohashi", "Mikawa-Anjo": "Mikawa-Anjo",
      Nagoya: "Nagoya", "Gifu-Hashima": "Gifu-Hashima", Maibara: "Maibara", Kyoto: "Kyoto", "Shin-Osaka": "Shin-Osaka",
    },
    spots: {
      "tokyo-tower": "Tokyo Tower", "ota-fuji": "Fuji vom Stadtbezirk Ota", "maruko-bridge": "Maruko-Brücke",
      "musashi-kosugi-towers": "Hochhäuser von Musashi-Kosugi", "sagami-fuji": "Fuji über der Sagami-Ebene",
      "727-board": "Schilder 727 und 248", hinataoka: "Häuser am Hang von Hinataoka", "putiputi-sign": "„Wer bin ich?“-Schild",
      "odawara-castle": "Burg Odawara", "gyoran-kannon": "Große Gyoran-Kannon-Statue", odawara: "Atami und Sagami-Bucht",
      "fuji-pipe-sign": "Fuji-Pipe-Schild", fuji: "Fuji", "fuji-bus-sales": "Busgelände von Fuji Bus Sales", "shimizu-port-chikyu": "Hafen Shimizu und Forschungsschiff CHIKYU", granship: "Granship", "left-fuji": "Fuji auf der linken Seite",
      "sapporo-shizuoka-factory": "Sapporo-Brauerei Shizuoka", "shizuoka-tea-fields": "Teefelder von Shizuoka", kakegawa: "Burg Kakegawa", "genki-sign": "Shippei-Aufmunterungsschild",
      hamanako: "Hamana-See", "hamanako-fuji": "Fuji vom Hamana-See", "toyohashi-tateiwa": "Tateiwa-Felsen in Toyohashi",
      "mikawa-oshima": "Insel Mikawa-Oshima", "nichiban-anjo": "CELLOTAPE-Fassade",
      "nagoya-station-skyline": "Skyline am Bahnhof Nagoya", "kirin-beer-factory": "Kirin-Brauerei",
      kiyosu: "Burg Kiyosu", "solar-ark": "Solaranlage Solar Ark", "gifu-castle": "Burg Gifu",
      kinshozan: "Berg Kinshozan", "nangu-taisha": "Großes Torii des Nangu Taisha", ibuki: "Berg Ibuki", "fujitec-big-wing": "Fujitec Big Wing",
      "sawayama-castle": "Ruinen der Burg Sawayama", "hikone-castle": "Burg Hikone", "kannonji-castle": "Ruinen der Burg Kannonji",
      "omi-fuji": "Omi-Fuji", "seta-karahashi": "Seta-no-Karahashi-Brücke", toji: "Fünfstöckige Pagode des To-ji", "rakusai-egg-tanks": "Eiförmige Tanks in Rakusai",
      "torikai-train-depot": "Shinkansen-Betriebswerk Torikai",
      "727-sign": "727-COSMETICS-Schild", "mishima-catapult": "Shinkansen-Katapult in Mishima", "fuji-paper-mills": "Papierfabriken von Fuji", "fujikawa-bridge": "Fujikawa-Brücke und Wasserrohrbrücke", "gifu-hashima-mahalo": "Mahalo-Schild in Gifu-Hashima", "sennenq-sign": "Sennen-Kyū-Schild", "lotte-shiga": "Süßwarenschilder von Lotte Shiga", "hirakata-park-wheel": "Riesenrad im Hirakata Park",
    },
  },
  es: {
    stations: {
      Tokyo: "Tokio", Shinagawa: "Shinagawa", "Shin-Yokohama": "Shin-Yokohama", Odawara: "Odawara",
      Atami: "Atami", Mishima: "Mishima", "Shin-Fuji": "Shin-Fuji", Shizuoka: "Shizuoka",
      Kakegawa: "Kakegawa", Hamamatsu: "Hamamatsu", Toyohashi: "Toyohashi", "Mikawa-Anjo": "Mikawa-Anjo",
      Nagoya: "Nagoya", "Gifu-Hashima": "Gifu-Hashima", Maibara: "Maibara", Kyoto: "Kioto", "Shin-Osaka": "Shin-Osaka",
    },
    spots: {
      "tokyo-tower": "Torre de Tokio", "ota-fuji": "Monte Fuji desde Ota", "maruko-bridge": "Puente Maruko",
      "musashi-kosugi-towers": "Torres de Musashi-Kosugi", "sagami-fuji": "Monte Fuji sobre la llanura de Sagami",
      "727-board": "Carteles 727 y 248", hinataoka: "Casas en la colina de Hinataoka", "putiputi-sign": "Cartel «¿Quién soy?»",
      "odawara-castle": "Castillo de Odawara", "gyoran-kannon": "Gran estatua de Gyoran Kannon", odawara: "Atami y bahía de Sagami",
      "fuji-pipe-sign": "Cartel Fuji Pipe", fuji: "Monte Fuji", "fuji-bus-sales": "Explanada de buses Fuji Bus Sales", "shimizu-port-chikyu": "Puerto de Shimizu y buque CHIKYU", granship: "Granship", "left-fuji": "Fuji por el lado izquierdo",
      "sapporo-shizuoka-factory": "Cervecería Sapporo de Shizuoka", "shizuoka-tea-fields": "Campos de té de Shizuoka", kakegawa: "Castillo de Kakegawa", "genki-sign": "Cartel de ánimo de Shippei",
      hamanako: "Lago Hamana", "hamanako-fuji": "Monte Fuji desde el lago Hamana", "toyohashi-tateiwa": "Roca Tateiwa de Toyohashi",
      "mikawa-oshima": "Isla Mikawa-Oshima", "nichiban-anjo": "Fachada de CELLOTAPE",
      "nagoya-station-skyline": "Panorama de la estación de Nagoya", "kirin-beer-factory": "Fábrica de cerveza Kirin",
      kiyosu: "Castillo de Kiyosu", "solar-ark": "Instalación solar Solar Ark", "gifu-castle": "Castillo de Gifu",
      kinshozan: "Monte Kinshozan", "nangu-taisha": "Gran torii de Nangu Taisha", ibuki: "Monte Ibuki", "fujitec-big-wing": "Fujitec Big Wing",
      "sawayama-castle": "Ruinas del castillo de Sawayama", "hikone-castle": "Castillo de Hikone", "kannonji-castle": "Ruinas del castillo de Kannonji",
      "omi-fuji": "Omi Fuji", "seta-karahashi": "Puente Seta no Karahashi", toji: "Pagoda de cinco pisos de To-ji", "rakusai-egg-tanks": "Tanques ovalados de Rakusai",
      "torikai-train-depot": "Depósito de Shinkansen de Torikai",
      "727-sign": "Cartel de 727 COSMETICS", "mishima-catapult": "Catapulta Shinkansen de Mishima", "fuji-paper-mills": "Papeleras de Fuji", "fujikawa-bridge": "Puente del río Fuji y puente acueducto", "gifu-hashima-mahalo": "Cartel Mahalo en Gifu-Hashima", "sennenq-sign": "Cartel de Sennen Kyū", "lotte-shiga": "Carteles de dulces de Lotte Shiga", "hirakata-park-wheel": "Noria de Hirakata Park",
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
  de: {
    "tokyo-tower": "Tokyo Tower", odawara: "Atami und Sagami-Bucht", fuji: "Fuji",
    hamanako: "Hamana-See", "solar-ark": "Solar Ark", toji: "To-ji-Pagode",
  },
  es: {
    "tokyo-tower": "Torre de Tokio", odawara: "Atami y bahía de Sagami", fuji: "Monte Fuji",
    hamanako: "Lago Hamana", "solar-ark": "Solar Ark", toji: "Pagoda de To-ji",
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
  de: {
    "tokyo-tower": "Der rote Turm über Tokio.", odawara: "Zwischen den Tunneln öffnet sich der Blick aufs Meer.", fuji: "Die berühmtesten drei Minuten Japans.",
    hamanako: "Der Zug scheint über den See zu gleiten.", "solar-ark": "Das Sonnenschiff, das bald verschwindet.", toji: "Ein Blick genügt: Sie sind in Kyoto.",
  },
  es: {
    "tokyo-tower": "La torre roja en el cielo de Tokio.", odawara: "Entre túneles se abre la vista al mar.", fuji: "Los tres minutos más famosos de Japón.",
    hamanako: "El tren parece deslizarse sobre el lago.", "solar-ark": "La nave solar que pronto desaparecerá.", toji: "Basta una mirada: has llegado a Kioto.",
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
  return lang === "en" ? `${prefix}en/start.html${hash}` : `${prefix}start.html${hash}`;
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
        <small class="brand-sub">${lang === "ja" ? "旅の瞬間を見逃さない" : "Discover more through the train window."}</small>
      </span>
    </a>
    <nav class="top-nav" aria-label="Primary">
      <a href="${lang === "en" ? `${prefix}en/start.html` : `${prefix}start.html`}">${lang === "ja" ? "列車選択" : "Train Search"}</a>
      <a href="${liveHref(lang, prefix)}">${lang === "ja" ? "音声ガイド" : "Audio Guide"}</a>
      <a href="${lang === "en" ? `${prefix}en/zukan.html` : `${prefix}zukan.html`}" data-cta-track="header_nav_click" data-cta-id="nav_features">${lang === "ja" ? "特集" : "Features"}</a>
      <a class="top-nav-overflow" href="${lang === "en" ? `${prefix}en/zukan.html` : `${prefix}zukan.html`}#gallery" data-cta-track="header_nav_click" data-cta-id="nav_all_views">${lang === "ja" ? "車窓一覧" : "All views"}</a>
      <a href="${lang === "en" ? `${prefix}en/journal.html` : `${prefix}journal.html`}">${lang === "ja" ? "スタンプ帖" : "Journal"}</a>
      <details class="top-nav-more">
        <summary>${lang === "ja" ? "もっと見る" : "More"}</summary>
        <div class="top-nav-menu">
          <a class="top-nav-menu-compact" href="${lang === "en" ? `${prefix}en/zukan.html` : `${prefix}zukan.html`}#gallery" data-cta-track="header_nav_click" data-cta-id="nav_all_views">${lang === "ja" ? "車窓一覧" : "All views"}</a>
          <a href="${prefix}${lang === "en" ? "en/" : ""}guide.html">${lang === "ja" ? "富士山を見る" : "See Mt. Fuji"}</a>
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
    { href: `${prefix}en/guide.html`, img: "images/thumbs/content-faq.webp", label: "MT. FUJI", title: "See Mt. Fuji", desc: "Check the timing, seat side and cloudy-day answers." },
    { href: `${prefix}en/mieru.html`, img: "images/thumbs/content-mieru.webp", label: "FORECAST", title: "Visibility β", desc: "Check whether Mt. Fuji is likely to show today." },
    { href: `${prefix}en/jr-pass-fuji.html`, img: "images/thumbs/content-faq.webp", label: "JAPAN RAIL PASS", title: "Pass-covered trains", desc: "Mt. Fuji times for Hikari and Kodama, which are not the Nozomi ones." },
    { href: `${prefix}en/sumie.html`, img: "images/thumbs/content-sumie.webp", label: "EXTRA", title: "Sumie Window", desc: "Ride the route as a quiet ink-painting window." },
    { href: `${prefix}en/somato.html`, img: "images/thumbs/content-somato.webp", label: "EXTRA", title: "Window Journey", desc: "Let real window photos flow past like a short trip." },
    { href: `${prefix}en/journal.html`, img: "images/stamps/stamp_fuji.svg", label: "JOURNAL", title: "Stamps and medals", desc: "Keep the views you found during the ride." },
    { href: guideHref, img: "images/thumbs/og-shinkansen-window.webp", label: "GUIDE", title: "About this app", desc: "See how to use and enjoy it in 30 seconds." },
    { href: `${prefix}en/references.html`, img: "images/thumbs/20260616_fuji_sttraveler.webp", label: "LINKS", title: "Window links", desc: "Sources and reading for deeper window-view trips." },
    { href: `${prefix}en/contact.html`, img: "images/thumbs/content-contact.webp", label: "CONTACT", title: "Contact", desc: "Send photo suggestions, corrections or feedback." },
  ] : [
    { href: `${prefix}guide.html`, img: "images/thumbs/content-faq.webp", label: "MT. FUJI", title: "富士山を見る", desc: "5つの区間、座席側、曇りの日の見え方を確認。" },
    { href: `${prefix}mieru.html`, img: "images/thumbs/content-mieru.webp", label: "FORECAST", title: "今日の富士山 見える予報", desc: "今日の空で富士山が見えそうかを確認。" },
    { href: `${prefix}sumie.html`, img: "images/thumbs/content-sumie.webp", label: "EXTRA", title: "墨絵車窓", desc: "東海道新幹線の車窓を、静かな墨絵で。" },
    { href: `${prefix}somato.html`, img: "images/thumbs/content-somato.webp", label: "EXTRA", title: "車窓走馬灯", desc: "実際の車窓写真で、旅を短くめぐる。" },
    { href: `${prefix}journal.html`, img: "images/stamps/stamp_fuji.svg", label: "JOURNAL", title: "スタンプ帖", desc: "見つけた景色をスタンプとメダルで記録。" },
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

// 構造化データに、このサイトにしか無い事実を載せる。
// 名前と説明だけなら誰でも書けるが、席側・東京からの分・見えている秒数・見つけやすさ・
// 座標をひとまとまりで持っているのはここだけで、回答エンジンが引く価値はそこにある。
// 数値がのぞみ基準の目安であることは、property名の側で明示する（断定しない）。
const SPOT_FACT_LABELS = {
  ja: {
    side: "座席側",
    sideE: "E席（京都方面へ向かって右）",
    sideA: "A席（京都方面へ向かって左）",
    minutes: "東京発からの目安（のぞみ基準・分）",
    duration: "見えている時間の目安（秒）",
    spotting: "見つけやすさ",
    levels: { easy: "やさしい", moderate: "ふつう", hard: "むずかしい" },
    cloudy: "曇りでも見えるか",
    cloudyYes: "見える",
  },
  en: {
    side: "Seat side",
    sideE: "Seat E (right-hand side heading to Kyoto)",
    sideA: "Seat A (left-hand side heading to Kyoto)",
    minutes: "Minutes after leaving Tokyo (Nozomi estimate)",
    duration: "Typical time in view (seconds)",
    spotting: "How hard it is to spot",
    levels: { easy: "Easy", moderate: "Medium", hard: "Hard" },
    cloudy: "Visible on a cloudy day",
    cloudyYes: "Yes",
  },
};

function spotAttractionJsonLd(spot, lang, url, data, desc, otherLang) {
  const L = SPOT_FACT_LABELS[lang] || SPOT_FACT_LABELS.en;
  const properties = [
    { name: L.side, value: sideLabel(spot, lang) },
    { name: L.minutes, value: spot.minutesFromTokyo },
    { name: L.duration, value: spot.durationSec },
  ];
  if (spot.spotting) properties.push({ name: L.spotting, value: L.levels[spot.spotting] });
  // 曇天可否は true のときだけ載せる。未記載を「見えない」と読ませない。
  if (spot.visibleWhenCloudy) properties.push({ name: L.cloudy, value: L.cloudyYes });
  const attraction = {
    "@type": "TouristAttraction",
    "@id": `${url}#spot`,
    "name": data.name,
    "alternateName": localized(spot[otherLang], "name") || spot[otherLang]?.name || spot.ja.name,
    "description": desc,
    "image": spotOgImageUrl(spot),
    "touristType": "Railway window view",
    "additionalProperty": properties.map((property) => ({
      "@type": "PropertyValue",
      "name": property.name,
      "value": property.value,
    })),
  };
  if (spot.map && Number.isFinite(spot.map.lat) && Number.isFinite(spot.map.lng)) {
    attraction.geo = { "@type": "GeoCoordinates", latitude: spot.map.lat, longitude: spot.map.lng };
  }
  return attraction;
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

/* ===== 左ペイン =====
 *
 * PCでスポットページに着地したユーザーに、東海道新幹線の見どころ全体を
 * 意識させて列車検索・他スポットへの回遊を促す。
 * モバイルではレールを隠し、記事末尾の CTA に任せる。 */

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
    const guideHref = spot.guideRoute?.[lang] || spot.guideRoute?.en;
    const cardHref = guideHref ? `${prefix}${guideHref}` : `${spotHrefPrefix}${item.id}.html`;
    return `<a class="show-card guide-mobile-spot-card" href="${escapeHTML(cardHref)}" data-guide-mobile-spot="${escapeHTML(item.id)}" aria-label="${escapeHTML(ariaLabel)}">
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
      thumb: sp.image ? sp.image : "",
      guide: spotGuideHref(sp),
      guideRoute: sp.guideRoute?.[lang] || sp.guideRoute?.en || "",
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
      const href = r.guideRoute ? `${prefix}${r.guideRoute}` : `${spotHrefPrefix}${r.guide || `${r.id}.html`}`;
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

function spotGuideHref(spot) {
  const pageId = spot.guidePageId || spot.id;
  return `${pageId}.html${spot.guideAnchor ? `#${spot.guideAnchor}` : ""}`;
}

// 本文をホスト側ページの章として持つスポット。個別URLは残すが、検索上の代表は
// ホスト1本へ寄せて、同じクエリで自社2ページが順位を分け合う状態を作らない。
function isSubordinateSpot(spot) {
  return Boolean(spot.guidePageId && spot.guidePageId !== spot.id);
}

function hasGeneratedSpotPage(spot) {
  return !spot.guideRoute;
}

function canonicalSpotId(spot) {
  return isSubordinateSpot(spot) ? spot.guidePageId : spot.id;
}

// スポット本文の配信物パス。generate-spot-page-shared-data.mjs と同じ規則。
function spotPagePayloadPath(id, lang) {
  return `data/spot-pages/${id}.${lang}.js`;
}

function thinSpotPageHTML(spot, lang) {
  const ui = UI[lang];
  const data = spot[lang] || spot.ja || {};
  const otherLang = lang === "ja" ? "en" : "ja";
  const title = localized(spot.pageTitle, lang) || (lang === "ja"
    ? `${data.name}はいつ見える？座席側は？ ${data.area}${ui.titleSuffix}`
    : `When can you see ${data.name} from the Shinkansen? ${data.area} | Shinkansen Window`);
  const desc = localized(spot.metaDescription, lang) || description(spot, lang);
  // canonical・og:url・JSON-LD をすべて代表ページの URL で揃える。
  // 従属スポットの個別URLは残るが、自分自身を代表として主張しない。
  const url = pageUrl(lang, canonicalSpotId(spot));
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
      spotAttractionJsonLd(spot, lang, url, data, desc, otherLang),
    ],
  };
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style id="spot-page-boot-style">html { background:#faf6ef; } [data-spot-page-shared-static] { visibility:hidden; }</style>
  <noscript><style>[data-spot-page-shared-static] { visibility:visible; }</style></noscript>
  ${embeddedHeadHTML(prefix)}
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <title>${text(title)}</title>
  <meta name="description" content="${text(desc)}">
  <link rel="canonical" href="${pageUrl(lang, canonicalSpotId(spot))}">
  <link rel="alternate" hreflang="ja" href="${pageUrl("ja", canonicalSpotId(spot))}">
  <link rel="alternate" hreflang="en" href="${pageUrl("en", canonicalSpotId(spot))}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl("en", canonicalSpotId(spot))}">
  <script src="${prefix}language-router.js?v=${assetVersion("language-router.js")}"></script>
  <meta property="og:title" content="${text(title)}">
  <meta property="og:description" content="${text(desc)}">
  <meta property="og:image" content="${spotOgImageUrl(spot)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${spotOgImageUrl(spot)}">${isSubordinateSpot(spot) ? "" : `
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`}
  ${analyticsSnippet()}
</head>
<body class="spot-page" data-spot-page-shared-lang="${escapeHTML(lang)}" data-spot-page-shared-id="${escapeHTML(spot.id)}" data-spot-page-shared-root="${escapeHTML(prefix)}" data-spot-page-shared-mode="page">
  ${staticNavHTML}
  <div data-spot-page-shared-module="page"></div>
  ${staticContentRailHTML}
  <script src="${prefix}spot-page-shared-data.js?v=${assetVersion("spot-page-shared-data.js")}"></script>
  <script src="${prefix}${spotPagePayloadPath(spot.id, lang)}?v=${assetVersion(spotPagePayloadPath(spot.id, lang))}"></script>
  <script src="${prefix}spot-page-loader.js?v=${assetVersion("spot-page-loader.js")}"></script>
</body>
</html>
`;
}

function spotPageHTML(spot, lang) {
  return thinSpotPageHTML(spot, lang);
}

function englishGuideIndexHTML() {
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
        <a class="btn btn-primary" href="./start.html#journey">Find your train</a>
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
        <p>Use the train search to build a timed window guide, or open the Audio Guide while riding.</p>
        <div class="spot-page-actions">
          <a class="btn btn-primary" href="./start.html#journey">Build my timed guide</a>
          <a class="btn btn-ghost" href="live/">Open Audio Guide</a>
          <a class="btn btn-ghost" href="guide.html">Read the Mt. Fuji guide</a>
        </div>
      </section>
    </article>
  </main>
</body>
</html>
`;
}

function localizeEnglishInternalLinks(html) {
  const directRoutes = [
    ["href=\"727-collection.html\"", "href=\"en/727-collection.html\""],
    ["href=\"index.html\"", "href=\"en/\""],
    ["href=\"start.html#journey\"", "href=\"en/start.html#journey\""],
    ["href=\"start.html\"", "href=\"en/start.html\""],
    ["href=\"live/index.html\"", "href=\"en/live/\""],
    ["href=\"live/\"", "href=\"en/live/\""],
    ["href=\"spots/", "href=\"en/spots/"],
  ];
  for (const [from, to] of directRoutes) html = html.replaceAll(from, to);
  for (const route of ["ferris-wheels", "castles", "guide", "zukan", "journal", "mieru", "sumie", "somato", "references", "contact", "privacy", "lp", "sparkling-dreams", "hanabi", "yakei", "window-moments"]) {
    html = html
      .replaceAll(`href=\"${route}.html#`, `href=\"en/${route}.html#`)
      .replaceAll(`href=\"${route}.html\"`, `href=\"en/${route}.html\"`);
  }
  html = html.replaceAll('href="early-access.html?src=top-promo"', 'href="en/early-access.html?src=top-promo"');
  html = html.replaceAll('href="early-access.html?src=lp-footer"', 'href="en/early-access.html?src=lp-footer"');
  return html;
}

function englishLandingHTML() {
  const title = "Enjoy the Tokaido Shinkansen Window Views | Shinkansen Window";
  const description = `Make more of your Tokaido Shinkansen journey. Explore photos and stories of Mt. Fuji, castles and curious signs, with timing and seat-side guides for your ride.`;
  const handoff = '<script>(function(){var p=location.pathname.replace(/\\/+$/,"/"),h=location.hash,j=(p==="/en/"||p==="/en/index.html")&&(h==="#journey"||h.indexOf("#spot-")===0);if(j){var q=new URLSearchParams(location.search),r=q.get("lang"),s;try{s=localStorage.getItem("mado-lang")}catch(e){}var t="../en/start.html";if(r==="ja"){try{localStorage.setItem("mado-lang","ja")}catch(e){}t="../start.html"}else if(r==="en"||s==="en"){try{localStorage.setItem("mado-lang","en")}catch(e){}}var u=new URL(t,location.href);u.search=location.search;u.hash=location.hash;location.replace(u.href);return}})();</script>';
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [{
      "@type": "WebApplication",
      "@id": `${siteRoot}/en/#app`,
      "name": "Shinkansen Window",
      "alternateName": "新幹線の窓",
      "url": `${siteRoot}/en/`,
      "applicationCategory": "TravelApplication",
      "operatingSystem": "Any",
      "inLanguage": "en",
      "description": description,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
    }],
  };
  const copy = [
    ["フッターナビゲーション", "Footer navigation"],
    ["新幹線の窓 トップへ", "Shinkansen Window home"],
    ["掲載写真 撮影：michikusa", "Photos: michikusa"],
    ["248看板と並んで立つ727 COSMETICSの看板", "727 COSMETICS sign beside the 248 sign"],
    ["新幹線のE席側から見える掛川城", "Kakegawa Castle from the Shinkansen's Seat E side"],
    ["新幹線のE席側から見える伊吹山", "Mt. Ibuki from the Shinkansen's Seat E side"],
    ["新幹線のA席側から見える東寺の五重塔", "To-ji Pagoda from the Shinkansen's Seat A side"],
    ["新幹線のE席側に広がる浜名湖", "Lake Hamana from the Shinkansen's Seat E side"],
    ["浜名湖の車窓ガイドを見る", "See the Lake Hamana window guide"],
    ["掛川城の車窓ガイドを見る", "See the Kakegawa Castle window guide"],
    ["伊吹山の車窓ガイドを見る", "See the Mt. Ibuki window guide"],
    ["東寺 五重塔の車窓ガイドを見る", "See the To-ji Pagoda window guide"],
    ["727看板と248看板の車窓ガイドを見る", "See the 727 and 248 sign window guide"],
    ["見つけた景色が、旅の手帖になる", "The views you find become part of your travel journal"],
    ["いつ・どちら側に見えるかで案内します。", "with the best time and seat side for your train."],
    ["窓のむこうに、", "There’s another journey"],
    ["もうひとつの旅がある。", "outside your window."],
    ["富士山も、城も、湖も、", "Mt. Fuji, castles, lakes,"],
    ["ふしぎな看板も。", "and unexpected signs."],
    ["地図と音声で次を知らせる", "Map and audio for the next view"],
    ["いつ・どちら側かを調べる", "Check when and which side to watch"],
    ["見つけた景色を記録する", "Record the views you spot"],
    ["車窓図鑑を見る", "Open the field guide"],
    ["デモ走行で試す（α版）", "Try the demo ride (alpha)"],
    ["車窓スタンプを見る", "Open Window Stamps"],
    ["まもなく、浜名湖", "Lake Hamana next"],
    ["A席側の窓をご覧ください", "Watch the Seat A side"],
    ["富士山だけで、", "Mt. Fuji is only"],
    ["終わらせない。", "the beginning."],
    ["相模湾、茶畑、浜名湖、城、", "Sagami Bay, tea fields, Lake Hamana, castles,"],
    ["建築、線路ぎわの看板。", "architecture, and trackside signs."],
    ["いつもの移動に、", "On one familiar ride,"],
    ["方向・出発駅・列車の3つを選ぶだけ。", "Pick a direction, departure station, and train."],
    ["あとは、その列車のダイヤに合わせて動きます。", "The guide follows that service's timetable."],
    ["東京 → 新大阪", "Tokyo → Shin-Osaka"],
    ["新大阪 → 東京", "Shin-Osaka → Tokyo"],
    ["出発駅", "Boarding at"],
    ["乗る便を選択", "Choose your service"],
    ["実際のダイヤから、見えるころと座席側が並びます。", "Each view includes its estimated time and seat side."],
    ["その時刻に知らせる", "Get a nudge at the right time"],
    ["近づくと、地図とカウントダウンで知らせます。", "A map and countdown tell you when to look."],
    ["方向・出発駅・列車の3つだけです。", "Just three choices: direction, station, and train."],
    ["列車", "Train"],
    ["東京", "Tokyo"],
    ["スマホを見る時間を、", "Turn screen time"],
    ["窓を見る時間へ。", "into window time."],
    ["見えるころがわかれば、", "Once you know when to look,"],
    ["ずっと画面を見張らなくていい。", "you do not have to watch the screen."],
    ["このガイドの役目は、", "This guide exists"],
    ["あなたの視線を窓へ戻すことです。", "to send your eyes back to the window."],
    ["撮影：michikusa", "Photo: michikusa"],
    ["同じ路線でも、", "The same route,"],
    ["旅は毎回ちがう。", "a different journey every time."],
    ["乗る目的が変われば、", "Change the reason you ride,"],
    ["窓の外に探すものも変わります。", "and the view you look for changes too."],
    ["はじめての一本は、", "For a first ride,"],
    ["やっぱり富士山。", "start with Mt. Fuji."],
    ["どちら側の席に座るか、", "Which side to sit on,"],
    ["東京から何分ごろ見えるか。", "and when it should appear from Tokyo."],
    ["乗る前に、ここだけ確認しておけば十分です。", "Those are the only details you need before boarding."],
    ["富士山ガイドへ", "Open the Mt. Fuji guide"],
    ["子どもと乗るなら、", "Riding with children?"],
    ["車窓を探すゲームに。", "Turn the window into a game."],
    ["富士山、城、湖、ふしぎな看板。", "Mt. Fuji, castles, lakes, and curious signs."],
    ["次は何が見えるか一緒に探せば、", "Look together for what comes next,"],
    ["移動時間そのものが旅になります。", "and the ride itself becomes part of the journey."],
    ["親子で探せる車窓を見る", "Find views together"],
    ["何度も乗るなら、", "Ride often?"],
    ["車窓スタンプを集める。", "Collect Window Stamps."],
    ["富士山も、城も、湖も、看板も。", "Mt. Fuji, castles, lakes, and signs."],
    ["いつもの出張で見つけた景色を残せば、", "Save what you spot on familiar business trips,"],
    ["同じ区間にも次の楽しみができます。", "and the same route gives you something new to look forward to."],
    ["スタンプ帖へ", "Open Window Stamps"],
    ["その日だけの、", "Some views only happen"],
    ["車窓。", "at certain times."],
    ["花火の夜、街の灯り、期間限定の車両、", "Fireworks, city lights, limited-run trains,"],
    ["その日にしか出会えない空。", "and skies that appear only once."],
    ["同じ路線が別の景色になります。", "with the season and the time of day."],
    ["車窓図鑑でテーマから探す", "Browse by theme"],
    ["夜空にひらく花火", "Fireworks opening in the night sky"],
    ["車窓の花火", "Window fireworks"],
    ["沿線の花火が、窓から見える夜。", "Fireworks along the route, seen from the window."],
    ["夜の車窓に見える丸子橋あたりの灯り", "Lights around Maruko Bridge after dark"],
    ["新幹線の夜景", "Tokaido Shinkansen at night"],
    ["暗くなる区間を、出発時刻から。", "See where night begins from your departure time."],
    ["ラッピング車両が走る東海道新幹線の車窓", "A wrapped train on the Tokaido Shinkansen route"],
    ["ディズニー新幹線", "Disney Shinkansen"],
    ["すれ違えるかを、時刻から計算。", "Check whether you can catch it from the timetable."],
    ["雪に覆われた田畑と集落を東海道新幹線の車窓から見る", "Snow-covered fields and homes seen from the Tokaido Shinkansen"],
    ["一度きりの車窓", "Weather from the window"],
    ["虹、雪、雲、雷。その日にだけ出会う空。", "Rainbows, snow, Mt. Fuji's clouds, and lightning—views unique to that day."],
    ["WEATHER", "WEATHER · FOUR VIEWS"],
    ["旅の情報だから、", "Travel information,"],
    ["わかることだけを", "with clear limits,"],
    ["丁寧に。", "carefully kept."],
    ["実車で確認", "Checked from the train"],
    ["見えるころと座席側を、乗って確かめています", "We ride the route to check the timing and seat side."],
    ["通過時刻の目安", "Estimated passing times"],
    ["列車と停車駅の実ダイヤから計算", "Calculated from train and station timetables."],
    ["写真と出典", "Photos and sources"],
    ["提供写真はクレジット、未確認はそう明記", "Contributed photos are credited; unconfirmed details are marked."],
    ["時刻や見え方は、運行状況・天候・座席位置により前後します。少し早めに窓の外を見てください。", "Times and visibility vary with service conditions, weather, and your seat. Start watching a little early."],
    ["次の新幹線は、", "Your next Shinkansen ride"],
    ["窓から始めよう。", "starts with the window."],
    ["列車をひとつ選ぶだけ。", "Choose one train."],
    ["見えるころと座席側を、", "We will show the timing and seat side"],
    ["あなたの旅に合わせて案内します。", "for your journey."],
    ["まず40景を見てみる", `Browse all ${SPOT_COUNT} views`],
    ["時刻はのぞみ基準の目安で、列車・天候・座席位置により見え方は変わります。少し早めに窓の外を見てください。", "Times are Nozomi-based estimates; visibility varies by train, weather, and seat. Start watching a little early."],
    ["道草 / Michikusa — 急がない旅と、偶然の発見を。", "Michikusa — Slow travel and unexpected discoveries."],
    ["富士山の見方", "How to See Mt. Fuji"],
    ["車窓リンク集", "Window View Links"],
    ["Androidアプリ", "Android app"],
    ["よくある質問", "FAQ"],
    ["参考リンク", "References"],
    ["プライバシー", "Privacy"],
    ["旅の途中の景色を、少し早めに。", "Start noticing the views a little early."],
    ["このページは公開前のLP案です。", "A guide to the views along your journey."],
    ["新幹線の窓とは", "About Shinkansen Window"],
    ["見える予報β", "Visibility β"],
    ["墨絵車窓", "Ink-wash Window"],
    ["車窓走馬灯", "Window Revue"],
    ["リンク集", "Links"],
    ["お問い合わせ", "Contact"],
    ["プライバシーポリシー", "Privacy Policy"],
    ["車窓スタンプ", "Window Stamps"],
    ["車窓図鑑をひらく", "Open the field guide"],
    ["乗る列車を選ぶと、", "Choose your train,"],
    ["時刻が決まる。", "and the timing follows."],
    ["乗る前から、", "Before, during,"],
    ["降りたあとまで。", "and after your ride."],
    ["乗る前に見どころを探し、", "Find views before you board,"],
    ["車内で出会い、", "enjoy them along the way,"],
    ["降りたあとに思い出を残す。", "and keep the memories"],
    ["車窓の楽しみは、", "after you"],
    ["移動の前からあとまで続きます。", "arrive."],
    ["車窓の見どころを知る。", "Discover the window highlights."],
    ["40の車窓から、見たい景色を探す。", "Pick a view from 40 sights."],
    ["眺めるだけでも、旅が始まります。", "The journey starts as you browse."],
    ["次の景色を、", "Know the next view"],
    ["地図と音声で知る。", "with a map and audio."],
    ["ライブ音声ガイド", "Live Audio Guide"],
    ["GPSで現在地から次の車窓を案内", "GPS calls the next view, with map and audio"],
    ["乗車プレビューで試す", "Try a preview ride"],
    ["地図と音声で、次の車窓をお知らせ。", "Maps and audio cue the next view."],
    ["見逃さず、窓の外を楽しめます。", "Look up and enjoy the ride."],
    ["見つけた景色を、", "Turn the views you spot"],
    ["旅の記録に。", "into a travel record."],
    ["見つけた景色を、スタンプに。", "Save each view as a stamp."],
    ["旅の思い出をあとから振り返れます。", "Revisit the journey afterward."],
    ["富士山を見る", "See Mt. Fuji"],
    ["富士山", "Mt. Fuji"],
    ["掛川城", "Kakegawa Castle"],
    ["浜名湖", "Lake Hamana"],
    ["伊吹山", "Mt. Ibuki"],
    ["東寺 五重塔", "To-ji Pagoda"],
    ["727と248の看板", "727 and 248 signs"],
    ["E席・43分", "Seat E · 43 min"],
    ["E席・62分", "Seat E · 62 min"],
    ["E席・73分", "Seat E · 73 min"],
    ["A席側の窓をご覧ください", "Watch the Seat A side"],
    ["A席", "Seat A"],
    ["E席", "Seat E"],
    ["7大会", "7 events"],
    ["11か所", "11 night scenes"],
    ["新幹線から見える花火", "Fireworks visible from the Shinkansen"],
    ["同じ路線が別の景色になります。", "with the season and the time of day."],
    ["窓の外に探すものも変わります。", "and the view you look for changes too."],
    ["このページは公開前のLP案です。", "A guide to the views along your journey."],
    ["車窓図鑑", "Field guide"],
    ["スタンプ帖", "Window Stamps"],
    ["音声ガイド", "Audio Guide"],
    ["もっと見る", "More"],
    ["乗る列車を選ぶ", "Choose your train"],
    ["新幹線の窓", "Shinkansen Window"],
    ["旅の瞬間を見逃さない", "Discover more through the train window."],
    ["本文へ移動", "Skip to content"],
  ];
  let html = fs.readFileSync(path.join(appDir, "index.html"), "utf8")
    .replace(/<script>\(function\(\)\{var p=location\.pathname[\s\S]*?<\/script>/, handoff)
    .replace('<html lang="ja">', '<html lang="en" class="english-lp">')
    .replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n  <base href="../">',
    );

  html = html.replace('promo/player.html?film=ja', 'promo/player.html?film=en')
    .replace('<span class="copy-chunk">1分でわかる、</span><span class="copy-chunk">新幹線の窓</span>', 'Discover Shinkansen Window in a minute')
    .replaceAll('50以上の景色の時刻が並ぶ', '50+ views in a timed list')
    .replaceAll('50以上の景色を見てみる', 'Explore 50+ views');
  // Keep the Japanese TOP editorial changes out of the English edition in this batch.
  html = html.replaceAll("<span class=\"copy-chunk\">降りたあとに調べ、</span><span class=\"copy-chunk\">思い出を残す。</span>", "<span class=\"copy-chunk\">降りたあとに思い出を残す。</span>");
  html = html.replaceAll("<span class=\"copy-chunk\">あの看板、</span><span class=\"copy-chunk\">何だろう。</span>", "<span class=\"copy-chunk\">何度も乗るなら、</span><span class=\"copy-chunk\">車窓スタンプを集める。</span>");
  html = html.replaceAll("<span class=\"copy-chunk\">いつも見かける看板や工場。</span><span class=\"copy-chunk\">何だろうと調べてみると、</span><span class=\"copy-chunk\">次に窓を見る楽しみに。</span><span class=\"copy-chunk\">見つけた景色は、スタンプにも。</span>", "<span class=\"copy-chunk\">富士山も、城も、湖も、看板も。</span><span class=\"copy-chunk\">いつもの出張で見つけた景色を残せば、</span><span class=\"copy-chunk\">同じ区間にも次の楽しみができます。</span>");
  html = html.replaceAll('<a class="button button-primary audience-card-action" href="zukan.html" data-lp-cta="audience-repeat-browse">気になる景色を探す</a>', '<a class="button button-primary audience-card-action" href="journal.html" data-lp-cta="audience-repeat">スタンプ帖へ</a>');
  html = html.replace(/^[ \t]*<a class="card-secondary-link" href="journal.html" data-lp-cta="audience-repeat">スタンプ帖へ<\/a>\r?\n/gm, "");
  html = html.replaceAll("<span class=\"copy-chunk\">気になった景色は、</span><span class=\"copy-chunk\">降りたあとに図鑑で探せます。</span>", "");
  html = html.replace(/^[ \t]*<a class="card-secondary-link" href="zukan.html" data-lp-cta="step-after-browse">車窓図鑑で調べる<\/a>\r?\n/gm, "");
  html = html.replaceAll('<span class="copy-chunk">727と248の</span><span class="copy-chunk">看板</span>', '727と248の看板');
  html = html.replaceAll('<span class="photo-question"><span class="copy-chunk">この数字、</span><span class="copy-chunk">何の看板？</span></span>', '');
  html = html.replaceAll("<span class=\"copy-chunk\">いつもの車窓を、</span><span class=\"copy-chunk\">再発見。</span>", "Rediscover the view from your window.");
  html = html.replaceAll("<span class=\"copy-chunk\">知ると、いつもの車窓が</span><span class=\"copy-chunk\">変わって見える。</span>", '<span class="copy-chunk">Get to know the sights, and see more through your train window.</span>');
  html = html.replaceAll("<span class=\"copy-chunk\">写真と解説で楽しみ、</span><span class=\"copy-chunk\">いつ・どちら側に見えるかも</span><span class=\"copy-chunk\">調べられます。</span>", '<span class="copy-chunk">Explore photos and stories, and find when and which side to look.</span>');
  html = html.replaceAll("写真から、気になる景色を探す", "Find a view that catches your eye");
  html = html.replaceAll("写真と解説から、見たい景色を探す。", "Explore photos and stories to find the views you want to see.");
  html = html.replaceAll("<span class=\"copy-chunk\">知ってから見ると、</span><span class=\"copy-chunk\">気づくものが増えていきます。</span>", '<span class="copy-chunk">Get to know the sights, and discover more to notice.</span>');
  html = html.replaceAll("特集", "Features");
  html = html.replaceAll("車窓一覧", "All views");
  html = html
    .replace(/東海道新幹線の\d+の車窓を、/g, `Find ${SPOT_COUNT} views from the Tokaido Shinkansen,`)
    .replace(/\d+の車窓から、見たい景色を探す。/g, `Browse ${SPOT_COUNT} window views and find your favorites.`)
    .replace(/\d+景を写真から探す/g, `Browse ${SPOT_COUNT} views by photo`)
    .replace(/写真から\d+景を見て、/g, `Browse ${SPOT_COUNT} views by photo.`)
    .replace(/\d+の見どころがあります。/g, `${SPOT_COUNT} views are waiting.`)
    .replace(/\d+景の時刻が並ぶ/g, `${SPOT_COUNT} views in a timed list`)
    .replace(/WINDOW CATALOG · \d+/g, `WINDOW CATALOG · ${SPOT_COUNT}`)
    .replace(/まず\d+景を見てみる/g, `Browse all ${SPOT_COUNT} views`);
  copy.sort((a, b) => b[0].length - a[0].length).forEach(([from, to]) => { html = html.replaceAll(from, to); });
  // English word boundaries belong in the HTML, not CSS-generated whitespace.
  // Unwrap only plain-text copy chunks; preserve all other markup and spacing.
  html = html.replace(/<span class="copy-chunk">[^<]*<\/span>(?:\s*<span class="copy-chunk">[^<]*<\/span>)*/g,
    (run) => [...run.matchAll(/<span class="copy-chunk">([^<]*)<\/span>/g)]
      .map((match) => match[1].trim()).join(" "));
  html = html.replaceAll(">窓</span>", ">W</span>");
  html = localizeEnglishInternalLinks(html)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHTML(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHTML(description)}">`)
    .replace('<link rel="canonical" href="https://www.michikusa-travel.com/">', `<link rel="canonical" href="${siteRoot}/en/">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHTML(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHTML(description)}">`)
    .replace('<meta property="og:url" content="https://www.michikusa-travel.com/">', `<meta property="og:url" content="${siteRoot}/en/">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHTML(title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHTML(description)}">`)
    .replace(/<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="Mt. Fuji and window views from the Tokaido Shinkansen">')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n  </script>`)
    .replace('<body>', '<body data-language-route="en">')
    .replace('<button type="button" class="active" data-lang="ja" aria-pressed="true">日本語</button>', '<button type="button" data-lang="ja" aria-pressed="false">日本語</button>')
    .replace('<button type="button" data-lang="en" aria-pressed="false">EN</button>', '<button type="button" class="active" data-lang="en" aria-pressed="true">EN</button>');
  return syncSpotCountClaims(html);
}

function englishAppIndexHTML() {
  const title = "Choose Your Tokaido Shinkansen Train | Shinkansen Window";
  const description = `Choose a Tokaido Shinkansen train between Tokyo and Shin-Osaka to see ${SPOT_COUNT} window views in timetable order, with the time and seat side for each view.`;
  const selectorCopy = [
    ["フッターナビゲーション", "Footer navigation"],
    ["新幹線の窓 トップへ", "Shinkansen Window home"],
    ["方向・乗車駅・出発時刻から、", "Choose a direction, station, and departure time."],
    ["見どころの時刻と座席側を調べます。", "Check when and which side to watch."],
    ["次に見る案内", "Recommended next steps"],
    ["運転日と、車窓で出会う目安を確認。", "Check operating dates and window-side estimates."],
    ["長岡・淀川・熱海など沿線7大会の目撃記録。", "Sightings from 7 fireworks events along the route, including Nagaoka, Yodogawa, and Atami."],
    ["どこから暗くなるか、夜だけの車窓11景。", "11 nighttime scenes showing where darkness begins."],
    ["東京〜新大阪の沿線で727看板を集める", "Collect 727 signs along the Tokyo–Shin-Osaka route."],
    ["無料・登録不要。Google Playで公開中。", "Free, no registration. Available on Google Play."],
    ["ディズニー新幹線", "Disney Shinkansen"],
    ["新幹線から見える花火", "Fireworks visible from the Shinkansen"],
    ["新幹線の夜景", "Tokaido Shinkansen at night"],
    ["727看板コレクション", "727 sign collection"],
    ["Androidアプリ版", "Android app"],
    ["東京〜新大阪", "Tokyo–Shin-Osaka"],
    ["リンク集", "Links"],
    [
      '<span class="copy-chunk">きょうの旅を</span><span class="copy-chunk">教えてください</span>',
      "Tell us about today's ride"
    ],
    ["東京 → 新大阪", "Tokyo → Shin-Osaka"],
    ["新大阪 → 東京", "Shin-Osaka → Tokyo"],
    ["方向", "Direction"],
    ["乗車駅", "Boarding station"],
    ["出発時刻", "Departure time"],
    ["これから乗る", "Boarding soon"],
    ["この時間の列車をさがす", "Find trains for this time"],
    ["これはサンプルです", "This is a sample"],
    ["左のフォームで列車を選ぶと、あなたの列車に合わせたタイムラインに切り替わります。", "Choose a train on the left to see its timed window guide."],
    ["時刻はのぞみ基準の目安です。すこし前から窓の外を意識してみてください。", "Times are estimates based on Nozomi trains. Start watching a little early."],
    ["タイムラインフィルタ", "Timeline filters"],
    ["お気に入り・座席側", "Favorites and seat side"],
    ["時間帯", "Time of day"],
    ["カテゴリ", "Category"],
    ["お気に入り", "Favorites"],
    ["すべて", "All"],
    ["昼景", "Day views"],
    ["夜景", "Night views"],
    ["定番", "Classic"],
    ["自然", "Nature"],
    ["歴史", "History"],
    ["工業", "Industry"],
    ["看板", "Signs"],
    ["街並", "Cityscape"],
    ["A席", "Seat A"],
    ["E席", "Seat E"],
    ["727看板を分けて表示", "Show 727 signs separately"],
    ["つぎの車窓", "Next view"],
    ["富士山を見る", "See Mt. Fuji"],
    ["見える時刻、座席側、曇りの日の答えを確認。", "Check the timing, seat side, and what to expect on cloudy days."],
    ["今日の富士山 見える予報", "Today's Mt. Fuji Visibility Forecast"],
    ["今日の空で富士山が見えそうかを確認。", "Check how likely Mt. Fuji is to appear in today's sky."],
    ["東海道新幹線の車窓を、静かな墨絵で。", "See the Tokaido Shinkansen window as a quiet ink-wash journey."],
    ["実際の車窓写真で、旅を短くめぐる。", "Take a short journey through real window photographs."],
    ["見つけた景色をスタンプとメダルで記録。", "Record each view with Window Stamps and medals."],
    ["使い方と楽しみ方を30秒で紹介。", "See how the guide works in 30 seconds."],
    ["出典や参考記事をまとめて読む。", "Browse sources and useful articles about the route."],
    ["写真提供、情報の訂正、ご感想はこちら。", "Send a photo, suggest a correction, or share feedback."],
    ["時刻はのぞみ基準の目安で、列車・天候・座席位置により見え方は変わります。少し早めに窓の外を見てください。", "Times are Nozomi-based estimates; visibility varies by train, weather, and seat. Start watching a little early."],
    ["富士山の見方", "How to See Mt. Fuji"],
    ["新幹線の窓とは？", "About Shinkansen Window"],
    ["車窓をもっと楽しむ", "More ways to enjoy the window"],
    ["見える予報β", "Visibility β"],
    ["墨絵車窓", "Ink-wash Window"],
    ["車窓走馬灯", "Window Revue"],
    ["スタンプ帖", "Window Stamps"],
    ["車窓リンク集", "Window View Links"],
    ["お問い合わせ", "Contact"],
    ["プライバシーポリシー", "Privacy Policy"],
    ["新幹線の窓とは", "About Shinkansen Window"],
    ["道草 / Michikusa — 急がない旅と、偶然の発見を。", "Michikusa — Slow travel and unexpected discoveries."],
    ["旅の途中の景色を、少し早めに。", "Start noticing the views a little early."],
    ["列車選択", "Train search"],
    ["音声ガイド", "Audio Guide"],
    ["車窓図鑑", "Field guide"],
    ["もっと見る", "More"],
    ["新幹線の窓", "Shinkansen Window"],
    ["旅の瞬間を見逃さない", "Discover more through the train window."],
    ["本文へ移動", "Skip to content"],
  ];
  let html = fs.readFileSync(path.join(appDir, "start.html"), "utf8")
    .replace('<html lang="ja">', '<html lang="en">')
    .replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n  <base href="../">',
    )
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHTML(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHTML(description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHTML(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHTML(description)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHTML(title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHTML(description)}">`)
    .replace(/<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="Tokaido Shinkansen window views, including Mt. Fuji">')
    .replace('<body>', '<body data-language-route="en">\n  <script>try { localStorage.setItem("mado-lang", "en"); } catch (error) {}</script>');
  selectorCopy.sort((a, b) => b[0].length - a[0].length).forEach(([from, to]) => { html = html.replaceAll(from, to); });
  html = html.replaceAll(">窓</span>", ">W</span>");
  html = localizeEnglishInternalLinks(html);
  return syncSpotCountClaims(html);
}

function guideHTML(lang) {
  const ui = UI[lang];
  const prefix = lang === "ja" ? "" : "../";
  const guideUrl = lang === "ja" ? `${siteRoot}/guide.html` : `${siteRoot}/en/guide.html`;
  const appUrl = lang === "ja" ? "start.html#journey" : "./start.html#journey";
  const otherUrl = lang === "ja" ? "en/guide.html" : "../guide.html";
  const questions = ui.guideQuestions.map((item) => {
    const href = lang === "ja"
      ? item.link
      : (item.link.startsWith("index") ? `./#scenery` : `../${item.link}`);
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
          <a class="btn btn-primary" href="./#scenery">Browse timed window views</a>
          <a class="btn btn-ghost" href="./start.html#journey">Find your train</a>
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
  <link rel="alternate" hreflang="de" href="${siteRoot}/de/guide.html">
  <link rel="alternate" hreflang="es" href="${siteRoot}/es/guide.html">
  <link rel="alternate" hreflang="ar" href="${siteRoot}/ar/guide.html">
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
    { loc: `${siteRoot}/ferris-wheels.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-23" },
    { loc: `${siteRoot}/en/ferris-wheels.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-23" },
    { loc: `${siteRoot}/castles.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-12" },
    { loc: `${siteRoot}/en/castles.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-12" },
    { loc: `${siteRoot}/arenani.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-21" },
    { loc: `${siteRoot}/en/arenani.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-21" },
    { loc: `${siteRoot}/zukan.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-09-23" },
    { loc: `${siteRoot}/en/zukan.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-09-23" },
    { loc: `${siteRoot}/journal.html`, priority: "0.7", changefreq: "weekly", lastmod: "2026-09-23" },
    { loc: `${siteRoot}/727-collection.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-18" },
    { loc: `${siteRoot}/en/727-collection.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-09-18" },
    { loc: `${siteRoot}/window-moments.html`, priority: "0.6", changefreq: "monthly", lastmod: "2026-09-01" },
    { loc: `${siteRoot}/en/window-moments.html`, priority: "0.6", changefreq: "monthly", lastmod: "2026-09-01" },
    { loc: `${siteRoot}/live/`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-16" },
    { loc: `${siteRoot}/en/live/`, priority: "0.6", changefreq: "monthly", lastmod: "2026-08-16" },
    { loc: `${siteRoot}/en/journal.html`, priority: "0.7", changefreq: "weekly", lastmod: "2026-09-23" },
    { loc: `${siteRoot}/mieru.html`, priority: "0.8", changefreq: "daily", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/en/mieru.html`, priority: "0.8", changefreq: "daily", lastmod: "2026-08-02" },
    { loc: `${siteRoot}/sumie.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/en/sumie.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/somato.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/en/somato.html`, priority: "0.5", changefreq: "monthly" },
    { loc: `${siteRoot}/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/en/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/yakei.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-14" },
    { loc: `${siteRoot}/en/yakei.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-14" },
    { loc: `${siteRoot}/en/jr-pass-fuji.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-22" },
    { loc: `${siteRoot}/hanabi.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-13" },
    { loc: `${siteRoot}/sparkling-dreams.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-08-11" },
    { loc: `${siteRoot}/en/hanabi.html`, priority: "0.7", changefreq: "monthly", lastmod: "2026-08-13" },
    { loc: `${siteRoot}/en/sparkling-dreams.html`, priority: "0.8", changefreq: "weekly", lastmod: "2026-08-11" },
    { loc: `${siteRoot}/zh-Hant/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/ko/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/zh-Hans/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/fr/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/de/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/es/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/ar/guide.html`, priority: "0.8", changefreq: "monthly", lastmod: "2026-09-13" },
    { loc: `${siteRoot}/references.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/en/references.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/contact.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/en/contact.html`, priority: "0.4", changefreq: "monthly" },
    { loc: `${siteRoot}/privacy.html`, priority: "0.3", changefreq: "yearly" },
    { loc: `${siteRoot}/en/privacy.html`, priority: "0.3", changefreq: "yearly" },
  ];
  // 個別に更新したスポットだけ日付を上書きする。全件を一斉に書き換えないための例外表。
  const spotLastmodOverrides = {
    "727-board": "2026-08-15",
    "solar-ark": "2026-09-25",
    "ota-fuji": "2026-09-23",
    "fuji-bus-sales": "2026-09-23",
    "sapporo-shizuoka-factory": "2026-09-23",
    "rakusai-egg-tanks": "2026-09-23",
  };
  const spotUrls = SPOTS.filter((spot) => hasGeneratedSpotPage(spot) && !isSubordinateSpot(spot)).flatMap((spot) => ["ja", "en"].map((lang) => ({
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
  for (const lang of ["ja", "en"]) for (const spot of SPOTS.filter(hasGeneratedSpotPage)) plans.push(planSpotPage(spot, lang, { requireExisting, preserveHead }));
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
  const generatedEntryPages = [
    [path.join(appDir, "en", "index.html"), englishLandingHTML()],
    [path.join(appDir, "en", "start.html"), englishAppIndexHTML()],
  ];
  for (const [outputPath, generatedHTML] of generatedEntryPages) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== generatedHTML) {
      throw new Error(`Generated English entry page is out of date: ${outputPath}`);
    }
  }
  console.log("Spot page preflight completed without writing files.");
  process.exit(0);
}

fs.mkdirSync(path.join(appDir, "en"), { recursive: true });
// The Japanese root is now an LP; en/index.html is the English explanatory LP; en/start.html is the train selector.
// Keep the English selector in en/start.html and generate both English entry pages together.
await import("./generate-language-mirrors.mjs");
writeFileIfChanged(path.join(appDir, "en", "index.html"), englishLandingHTML());
writeFileIfChanged(path.join(appDir, "en", "start.html"), englishAppIndexHTML());
for (const relativePath of ["en/journal.html", "ar/guide.html"]) {
  const absolutePath = path.join(appDir, relativePath);
  if (fs.existsSync(absolutePath)) {
    writeFileIfChanged(absolutePath, syncSpotCountClaims(fs.readFileSync(absolutePath, "utf8")));
  }
}
// Guide pages are hand-edited SEO answer pages.
// Keep only their shared route rail generated from the same source as spot pages.
const guideRailSpot = SPOTS.find((spot) => spot.id === "fuji");
const guideRailConfigs = [
  {
    lang: "ja", path: "guide.html", prefix: "", spotHrefPrefix: "spots/",
    ctaHref: "start.html#journey", footHref: "zukan.html", includeAffiliate: true,
  },
  {
    lang: "en", path: path.join("en", "guide.html"), prefix: "../", spotHrefPrefix: "spots/",
    ctaHref: "./start.html#journey", footHref: "zukan.html", includeAffiliate: true,
  },
  {
    lang: "zh-Hant", path: path.join("zh-Hant", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/start.html#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
  {
    lang: "ko", path: path.join("ko", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/start.html#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
  {
    lang: "zh-Hans", path: path.join("zh-Hans", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/start.html#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
  {
    lang: "fr", path: path.join("fr", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/start.html#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
  {
    lang: "de", path: path.join("de", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/start.html#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
  {
    lang: "es", path: path.join("es", "guide.html"), prefix: "../", spotHrefPrefix: "../en/spots/",
    ctaHref: "../en/start.html#journey", footHref: "../en/zukan.html", includeAffiliate: false, trackSpotClicks: true,
  },
];
for (const config of guideRailConfigs) {
  const lang = config.lang;
  const guidePath = path.join(appDir, config.path);
  const guideHTML = fs.readFileSync(guidePath, "utf8");
  const railLocalization = GUIDE_RAIL_LOCALIZATION[lang] || {};
  // A spot added to data.js without a localized rail name used to fall back to Japanese silently
  // (2026-09-13: ten recent spots showed Japanese in every localized guide). Fail the build instead.
  if (railLocalization.spots) {
    const missingNames = SPOTS.map((spot) => spot.id).filter((id) => !railLocalization.spots[id]);
    if (missingNames.length) {
      throw new Error(`GUIDE_RAIL_LOCALIZATION["${lang}"].spots is missing: ${missingNames.join(", ")}`);
    }
  }
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
  writeFileIfChanged(guidePath, syncSpotCountClaims(syncedGuideHTML));
}
writeFileIfChanged(path.join(appDir, "sitemap.xml"), sitemapXML());

await import("./generate-content-manifest.mjs");

const generatedSpotCount = SPOTS.filter(hasGeneratedSpotPage).length;
console.log(`Generated ${generatedSpotCount} Japanese spot pages, ${generatedSpotCount} English spot pages, /en/, sitemap.xml, and content-manifest.json`);
}
