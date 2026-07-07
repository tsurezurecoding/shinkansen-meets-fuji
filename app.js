/* =========================================================
 * 新幹線の窓 — 見逃さない車窓手帖 / Shinkansen Window
 * app.js — UIロジック（依存ライブラリなし・バックエンドなし）
 * ========================================================= */

/* ---------- i18n ---------- */
const MSG = {
  ja: {
    brandName: "新幹線の窓",
    brandSub: "旅の瞬間を見逃さない",
    heroKicker: "TOKAIDO SHINKANSEN · TOKYO ⇄ SHIN-OSAKA",
    heroTitle: "窓のむこうに、<br>もうひとつの旅がある。",
    heroLead: "富士山も、城も、湖も海も。<br>新幹線で「いつ・どちら側を見るか」がわかる車窓手帖です。",
    heroCtaStart: "旅をはじめる",
    heroCtaBrowse: "車窓図鑑を見る",
    ctaStart: "旅をはじめる", ctaBrowse: "車窓をながめる", ctaMedals: "メダルを見る", ctaQuick: "新幹線の窓とは？",
    navQuick: "TOP", navStart: "列車選択", navLive: "ライブ地図", navBrowse: "車窓図鑑", navFaq: "FAQ", navMedals: "獲得メダル",
    quickModalTitle: "新幹線の窓とは？",
    quickModalClose: "閉じる",
    setupEyebrow: "YOUR JOURNEY", setupTitle: "きょうの旅を教えてください",
    setupSub: "時刻表に合わせて、富士山も湖も城も見逃さない。方向・乗車駅・出発時刻から、あなたの列車の車窓タイムラインをつくります。",
    labelDirection: "方向", labelDeparture: "出発時刻",
    dirWest: "西へ（大阪方面）", dirEast: "東へ（東京方面）",
    btnNow: "これから乗る",
    btnBuild: "目安タイムラインを見る",
    labelBoard: "乗車駅",
    btnFind: "この時間の列車をさがす",
    trainPrev: "前のページ",
    trainNext: "次のページ",
    trainNone: "この条件の列車が見つかりませんでした。時刻を変えるか、目安タイムラインをどうぞ。",
    trainPickNote: "乗る列車をえらんでください（実ダイヤ基準）",
    showEyebrow: "WHAT YOU'LL SEE", showTitle: "たとえば、こんな景色",
    readGuide: "ガイドを読む",
    estimateTag: "目安時間", estimateNote: "列車を選ぶと実ダイヤに切替", trainTag: "実ダイヤ",
    dep: "発", arr: "着",
    seatTipNote: "席側は各カードに表示します。山側も海側も、気になる景色はまとめて見られます。",
    nextupLabel: "つぎの車窓",
    tlEyebrow: "WINDOW TIMELINE",
    tlSub: "時刻はのぞみ基準の目安です。すこし前から窓の外を意識してみてください。",
    tlTitleWest: "東京 → 新大阪の車窓タイムライン", tlTitleEast: "新大阪 → 東京の車窓タイムライン",
    previewBannerTitle: "サンプル",
    previewBannerBody: "列車を選ぶと、あなた用に切り替わります。",
    memEyebrow: "YOUR JOURNAL", memTitle: "車窓メダル帖",
    memSub: "「見えた!」を押すと、旅のメダルが育ちます。",
    journalGuideTitle: "メダルは進捗、スタンプは記録",
    journalGuideBody: "見つけた景色が下のスタンプに残り、その集まりでメダルが育ちます。",
    stampHeading: "スタンプ",
    medalEyebrow: "MEDALS",
    medalSummary: "集めた景色の進み具合",
    medalOverall: "車窓の達人",
    medalOverallDesc: "見つけた車窓ぜんぶの進捗。",
    medalCastle: "城ハンター",
    medalCastleDesc: "新幹線から見える城を集める。",
    medalFuji: "富士五景",
    medalFujiDesc: "場所ごとに違う富士山を集める。",
    medalClassic: "定番めぐり",
    medalClassicDesc: "まず見てほしい定番車窓を集める。",
    medalBronze: "銅",
    medalSilver: "銀",
    medalGold: "金",
    medalNoMedal: "未獲得",
    medalProgress: (n, total) => `${n} / ${total}`,
    medalNext: (label, remain) => `次は${label}まであと${remain}`,
    medalComplete: "金メダル達成",
    medalTargets: "対象スポット",
    btnReset: "スタンプをリセット",
    galEyebrow: "FIELD GUIDE", galTitle: "車窓図鑑 — ぜんぶの見どころ",
    galSub: "37の車窓スポットを一覧できます。見つけた景色は「見えた!」で記録できます。",
    morePhotos: "ほかの写真も見る",
    fAll: "すべて", fSeatA: "A席", fSeatE: "E席", fDay: "昼間", fDayShort: "昼", fDayPhoto: "昼の見どころ", fNight: "夜景", fNightPhoto: "夜の見どころ", fClassic: "定番", fNature: "自然", fHistory: "歴史", fIndustry: "工業", fSign: "看板", fCity: "街並",
    footerNote: "時刻はのぞみ基準の目安で、列車・天候・座席位置により見え方は変わります。少し早めに窓の外を見てください。",
    footerGuide: "富士山の見方",
    footerReferences: "車窓リンク集",
    footerCredit: "道草 / Michikusa — 急がない旅と、偶然の発見を。",
    faqEyebrow: "TRAVEL FAQ",
    faqTitle: "新幹線から富士山を見るには？",
    faqSub: "はじめて東海道新幹線に乗る人が、窓の外を見逃さないための短い案内です。",
    faqQSide: "新幹線から富士山はどちら側に見えますか？",
    faqASide: "東海道新幹線では、東京から新大阪へ向かう場合も、新大阪から東京へ向かう場合も、富士山は主にE席側に見えます。ただし新富士から静岡付近では、短い時間だけA席側に見える「左富士」もあります。",
    faqLinkLeftFuji: "左富士を見る",
    faqQWhen: "新幹線から富士山はいつ見えますか？",
    faqAWhen: "いちばん大きく見えるのは三島から新富士付近です。天気がよければ品川から新横浜のあたりや、浜名湖付近など、離れた場所から見えることもあります。",
    faqLinkFuji: "富士山の見どころを見る",
    faqQViews: "東海道新幹線の車窓では富士山以外に何が見えますか？",
    faqAViews: "新幹線の窓では、相模湾、熱海、浜名湖、城、東寺、山、工場、看板などが次々に現れます。このアプリは富士山だけでなく、東海道新幹線の移動そのものを楽しむための車窓ガイドです。",
    faqLinkGallery: "車窓図鑑を見る",
    faqQEnglish: "英語でも使えますか？",
    faqAEnglish: "ページ上部のENボタンで英語表示に切り替えられます。海外から来た人にも、富士山の見える席側やタイミングが伝わるようにしています。",
    seatE: "E席・山側", seatA: "A席・海側",
    confCheck: "裏取り中",
    nightPhotoAvailable: "夜景あり",
    lowLightLimited: "夜は見えにくい",
    spotted: "見えた!", spotBtn: "見えた!", spotBtnDone: "スタンプ済 ✓",
    more: "くわしく", less: "とじる", mapLink: "地図をひらく", liveMapLink: "乗車中はライブ地図で見る", miniMapSummary: "位置の目安", miniMapNote: "航空写真で周辺の目印を確認できます。", miniMapFallbackNote: "この地点は地図表示の座標調整中です。外部地図で位置を確認できます。", journeyLiveBanner: "乗車中は GPSライブ地図へ。現在地から次の車窓をカウントダウンで案内します。",
    inMinutes: (m) => `あと${m}分`, soon: "まもなく!", passed: "通過",
    anytime: "全区間",
    departed: (t) => `${t} 出発`,
    confirmReset: "スタンプをぜんぶ消しますか?",
    emptyCard: "まだスタンプがありません。タイムラインで「見えた!」を押してみてください。",
  },
  en: {
    brandName: "Shinkansen Window",
    brandSub: "Never miss a moment of the journey.",
    heroKicker: "TOKAIDO SHINKANSEN · TOKYO ⇄ SHIN-OSAKA",
    heroTitle: "There's another journey<br>outside your window.",
    heroLead: "Fuji, castles, lakes and sea. Know when to look, and which side to watch from your Shinkansen seat.",
    heroCtaStart: "Start your journey",
    heroCtaBrowse: "Open field guide",
    ctaStart: "Start your journey", ctaBrowse: "Browse the views", ctaMedals: "See medals", ctaQuick: "What is it?",
    navQuick: "Home", navStart: "Train Search", navLive: "Live Map", navBrowse: "Field Guide", navFaq: "FAQ", navMedals: "Medals",
    quickModalTitle: "What is Shinkansen Window?",
    quickModalClose: "Close",
    setupEyebrow: "YOUR JOURNEY", setupTitle: "Tell us about today's ride",
    setupSub: "Use the timetable to catch Fuji, lakes, castles, and more. Add direction, boarding station, and departure time to build your train's window timeline.",
    labelDirection: "Direction", labelDeparture: "Departure",
    dirWest: "Westbound (for Osaka)", dirEast: "Eastbound (for Tokyo)",
    btnNow: "Boarding soon",
    btnBuild: "Show sample timeline",
    labelBoard: "Boarding at",
    btnFind: "Find my train",
    trainPrev: "Previous",
    trainNext: "Next",
    trainNone: "No trains found for this time. Try another time, or use the estimate timeline.",
    trainPickNote: "Pick your train (real timetable)",
    showEyebrow: "WHAT YOU'LL SEE", showTitle: "Views like these",
    readGuide: "Read guide",
    estimateTag: "Estimate times", estimateNote: "Pick a train for real timetable", trainTag: "Real timetable",
    dep: "dep", arr: "arr",
    seatTipNote: "Seat side appears on each card. You can browse mountain-side and sea-side views together.",
    nextupLabel: "NEXT VIEW",
    tlEyebrow: "WINDOW TIMELINE",
    tlSub: "Times are estimates based on Nozomi trains. Start watching a little early.",
    tlTitleWest: "Tokyo → Shin-Osaka window timeline", tlTitleEast: "Shin-Osaka → Tokyo window timeline",
    previewBannerTitle: "Sample",
    previewBannerBody: "Pick your train to make it yours.",
    memEyebrow: "YOUR JOURNAL", memTitle: "Window Medal Book",
    memSub: "Tap “Spotted!” and your travel medals grow.",
    journalGuideTitle: "Medals show progress. Stamps keep the record.",
    journalGuideBody: "Each spotted view becomes a stamp, and those stamps grow your medals.",
    stampHeading: "Stamps",
    medalEyebrow: "MEDALS",
    medalSummary: "Your collected view progress",
    medalOverall: "Window Master",
    medalOverallDesc: "Progress across every window view.",
    medalCastle: "Castle Hunter",
    medalCastleDesc: "Collect castles seen from the Shinkansen.",
    medalFuji: "Fuji Five",
    medalFujiDesc: "Collect Mt. Fuji from five places.",
    medalClassic: "Classic Tour",
    medalClassicDesc: "Collect the essential window views first.",
    medalBronze: "Bronze",
    medalSilver: "Silver",
    medalGold: "Gold",
    medalNoMedal: "Not yet",
    medalProgress: (n, total) => `${n} / ${total}`,
    medalNext: (label, remain) => `${remain} more to ${label}`,
    medalComplete: "Gold medal complete",
    medalTargets: "Included views",
    btnReset: "Reset stamps",
    galEyebrow: "FIELD GUIDE", galTitle: "Field Guide — every view",
    galSub: "Browse all 37 window views. Tap “Spotted!” to record what you saw.",
    morePhotos: "More photos",
    fAll: "All", fSeatA: "Seat A", fSeatE: "Seat E", fDay: "Day", fDayShort: "Day", fDayPhoto: "Day views", fNight: "Night", fNightPhoto: "Night views", fClassic: "Classic", fNature: "Nature", fHistory: "History", fIndustry: "Industry", fSign: "Signs", fCity: "City",
    footerNote: "Times are Nozomi-based estimates; visibility varies by train, weather and seat. Start watching a little early.",
    footerGuide: "How to see Mt. Fuji",
    footerReferences: "Window links",
    footerCredit: "Michikusa — unhurried journeys and chance discoveries.",
    faqEyebrow: "TRAVEL FAQ",
    faqTitle: "How do you see Mt. Fuji from the Shinkansen?",
    faqSub: "A short guide for travelers who want to notice what is outside the window.",
    faqQSide: "Which side of the Shinkansen is Mt. Fuji on?",
    faqASide: "On the Tokaido Shinkansen, Mt. Fuji is mainly on the E-seat side in both directions. There is also a brief Left-Side Fuji moment near Shin-Fuji to Shizuoka, when Fuji can appear on the A-seat side.",
    faqLinkLeftFuji: "See Left-Side Fuji",
    faqQWhen: "When can you see Mt. Fuji from the Shinkansen?",
    faqAWhen: "The biggest view is around Mishima to Shin-Fuji. On clear days, you may also glimpse Fuji closer to Tokyo, around Shinagawa to Shin-Yokohama, or even from farther west near Lake Hamana.",
    faqLinkFuji: "See the Mt. Fuji view",
    faqQViews: "What else can you see from the Tokaido Shinkansen window?",
    faqAViews: "This is the heart of the app: Sagami Bay, Atami, Lake Hamana, castles, Toji Temple, mountains, factories, signs, and other short-lived views that make the ride itself part of the journey.",
    faqLinkGallery: "Browse the field guide",
    faqQEnglish: "Can I use it in English?",
    faqAEnglish: "Yes. Use the EN button at the top of the page to switch the app to English.",
    seatE: "Seat E", seatA: "Seat A",
    confCheck: "verifying",
    nightPhotoAvailable: "Night view",
    lowLightLimited: "Hard to see at night",
    spotted: "Spotted!", spotBtn: "Spotted!", spotBtnDone: "Stamped ✓",
    more: "More", less: "Close", mapLink: "Open map", liveMapLink: "Use Live Map while riding", miniMapSummary: "Location at a glance", miniMapNote: "Satellite imagery helps you recognize nearby landmarks.", miniMapFallbackNote: "Inline coordinates are still being tuned for this spot. You can check the location in an external map.", journeyLiveBanner: "While riding, switch to the GPS Live Map for a countdown to the next view.",
    inMinutes: (m) => `in ${m} min`, soon: "Coming up!", passed: "Passed",
    anytime: "Anywhere en route",
    departed: (t) => `Departed ${t}`,
    confirmReset: "Clear all stamps?",
    emptyCard: "No stamps yet — tap “Spotted!” on the timeline first.",
  },
};

/* ---------- state ---------- */
function normalizeLang(value) {
  return String(value || "").toLowerCase().startsWith("ja") ? "ja" : "en";
}
function getInitialLang() {
  const urlLang = new URLSearchParams(location.search).get("lang");
  if (urlLang === "ja" || urlLang === "en") {
    localStorage.setItem("mado-lang", urlLang);
    return urlLang;
  }
  return normalizeLang(localStorage.getItem("mado-lang") || navigator.language || "ja");
}
let lang = getInitialLang();
let direction = "west";
let boardId = "Tokyo";        // 乗車駅
let journey = null;           // 生成済みタイムライン {mode, train, stops, spots}
const PREVIEW_DEP_MIN = 0;
function loadStamps() {
  try {
    const parsed = JSON.parse(localStorage.getItem("mado-stamps") || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
let stamps = loadStamps();
let liveTimer = null;
let activeSpotModal = null;
let activeQuickModal = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const APP_SELF = location.pathname.endsWith("/zukan.html")
  ? "zukan.html"
  : "index.html";
const GOOGLE_MAPS_EMBED_API_KEY = "AIzaSyDE3UdN_9m9cK5sLTlfuc7KElsfceYNwrs";
function liveMapHref(targetLang = lang) {
  return `live/index.html${targetLang === "en" ? "?lang=en" : ""}`;
}
const t = (key, ...args) => {
  const v = MSG[lang][key];
  return typeof v === "function" ? v(...args) : (v ?? key);
};
function track(eventName, params = {}) {
  if (window.MADO_ANALYTICS_DISABLED) return;
  const payload = {
    language: lang,
    page_context: document.body?.dataset?.page || "home",
    ...params,
  };
  if (typeof window.gtag === "function") window.gtag("event", eventName, payload);
}
function eventSafeId(id) {
  return String(id || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function spotEventName(prefix, spotId) {
  return `${prefix}_${eventSafeId(spotId)}`.slice(0, 40);
}
function spotAnalyticsParams(spot, source, extra = {}) {
  if (!spot) return { source, ...extra };
  return {
    spot_id: spot.id,
    spot_name_ja: spot.ja?.name || spot.id,
    spot_name_en: spot.en?.name || spot.id,
    spot_category: spot.category || "unknown",
    spot_side: spot.side || "unknown",
    spot_area_ja: spot.ja?.area || "",
    spot_area_en: spot.en?.area || "",
    source,
    ...extra,
  };
}

/* ---------- helpers ---------- */
const REF = Object.fromEntries(ROUTE.refStations.map((s) => [s.id, s.min]));
const STATION = Object.fromEntries(ROUTE.refStations.map((s) => [s.id, s]));
const TIMETABLE_STATION = Object.fromEntries((window.SHINKANSEN_TIMETABLE?.stations || []).map((s) => [s.id, s]));

function toMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function minToClock(m) {
  m = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function fmtClock(date) { return date.toTimeString().slice(0, 5); }
function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }

/* 列車の東海道区間の停車駅（時刻順） */
function tokaidoStops(train) {
  return ROUTE.refStations
    .filter((s) => train.times[s.id])
    .map((s) => ({ id: s.id, ja: s.ja, en: s.en, ref: s.min, clock: toMin(train.times[s.id]) }))
    .sort((a, b) => a.clock - b.clock);
}

/* 実ダイヤ補間: スポットの基準分数を、前後の停車駅時刻で線形補間する */
function interpolateSpot(spotRef, stops) {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    const lo = Math.min(a.ref, b.ref), hi = Math.max(a.ref, b.ref);
    if (spotRef >= lo && spotRef <= hi && a.ref !== b.ref) {
      const f = Math.abs(spotRef - a.ref) / Math.abs(b.ref - a.ref);
      return Math.round(a.clock + f * (b.clock - a.clock));
    }
  }
  return null;
}

/* 列車検索: 方向・乗車駅に合う列車を出発時刻順に並べる */
function trainCandidates() {
  const TT = window.SHINKANSEN_TIMETABLE;
  if (!TT) return [];
  return TT.trains
    .filter((tr) => {
      if (tr.direction !== direction || !tr.times[boardId]) return false;
      // 乗車駅より先に東海道区間の停車駅があること
      const stops = tokaidoStops(tr);
      const idx = stops.findIndex((s) => s.id === boardId);
      return idx >= 0 && idx < stops.length - 1;
    })
    .map((tr) => ({ tr, dep: toMin(tr.times[boardId]) }))
    .sort((a, b) => a.dep - b.dep)
    // データセット内の重複列車（同番号・同時刻）を除去
    .filter((x, i, arr) => i === arr.findIndex((y) => y.tr.type === x.tr.type && y.tr.number === x.tr.number && y.dep === x.dep));
}

/* 列車検索: 指定時刻以降の列車（出発時刻順に最大5本） */
function findTrains(depMin) {
  return trainCandidates()
    .filter((x) => x.dep >= depMin)
    .slice(0, 5);
}

/* タイムライン計算（train=nullなら目安モード） */
function computeJourney(train, depMin) {
  const boardRef = REF[boardId];
  const dirSign = direction === "west" ? 1 : -1;
  let stops, spotClock;
  if (train) {
    const all = tokaidoStops(train);
    const bi = all.findIndex((s) => s.id === boardId);
    stops = all.slice(bi);
    spotClock = (ref) => interpolateSpot(ref, stops);
  } else {
    stops = ROUTE.refStations
      .filter((s) => s.major && (s.min - boardRef) * dirSign >= 0)
      .map((s) => ({ id: s.id, ja: s.ja, en: s.en, ref: s.min, clock: depMin + Math.abs(s.min - boardRef) }))
      .sort((a, b) => a.clock - b.clock);
    spotClock = (ref) => ((ref - boardRef) * dirSign < 0 ? null : depMin + Math.abs(ref - boardRef));
  }
  const spots = SPOTS
    .filter((sp) => sp.minutesFromTokyo != null)
    .map((sp) => ({ sp, clock: spotClock(sp.minutesFromTokyo) }))
    .filter((x) => x.clock != null)
    .sort((a, b) => a.clock - b.clock);
  return { mode: train ? "train" : "estimate", train, depMin, stops, spots };
}
function seatTags(spot) {
  const tags = new Set();
  const labelJa = spot.sideLabel?.ja || "";
  const labelEn = spot.sideLabel?.en || "";
  const isBoth = /A席・E席|左右|両側/.test(labelJa) || /Seats A and E|Both sides/i.test(labelEn);
  if (spot.side === "A" || /A席/.test(labelJa) || /Seat A/i.test(labelEn) || isBoth) tags.add("seat-a");
  if (spot.side === "E" || /E席/.test(labelJa) || /Seat E/i.test(labelEn) || isBoth) tags.add("seat-e");
  return tags;
}
function seatBadge(spot) {
  if (!spot.side) return "";
  const tags = seatTags(spot);
  const cls = tags.has("seat-a") && tags.has("seat-e")
    ? "badge-seat-both"
    : (spot.side === "E" ? "badge-seat-E" : "badge-seat-A");
  const label = spot.sideLabel?.[lang] || (spot.side === "E" ? t("seatE") : t("seatA"));
  return `<span class="badge ${cls}">${label}</span>`;
}
function catBadge(spot) {
  return timelineThemeTagBadgesHTML(spot);
}
function confBadge(spot) {
  return spot.confidence === "needs-check" ? `<span class="badge badge-check">${t("confCheck")}</span>` : "";
}
function stationLabel(id) {
  const station = STATION[id] || TIMETABLE_STATION[id];
  if (!station) return id;
  return lang === "ja" ? station.ja || station.en || id : station.en || station.ja || id;
}
function mapHref(spot) {
  if (!spot.map) return "";
  if (spot.map.lat != null && spot.map.lng != null) return `https://www.google.com/maps/search/?api=1&query=${spot.map.lat},${spot.map.lng}`;
  const query = spot.map[lang] || spot.map.ja || spot.map.en;
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}
function mapLinkHTML(spot, className = "") {
  const href = mapHref(spot);
  const classes = ["map-link", className].filter(Boolean).join(" ");
  return href ? `<a class="${classes}" href="${href}" target="_blank" rel="noopener noreferrer" data-map="${spot.id}"><span class="map-link-icon" aria-hidden="true">↗</span><span>${t("mapLink")}</span></a>` : "";
}
function hasMiniMapCoordinates(spot) {
  return !!(spot?.map && typeof spot.map.lat === "number" && typeof spot.map.lng === "number" && typeof spot.minutesFromTokyo === "number");
}
function googleMapsEmbedHref(spot) {
  if (!hasMiniMapCoordinates(spot)) return "";
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY,
    q: `${spot.map.lat},${spot.map.lng}`,
    center: `${spot.map.lat},${spot.map.lng}`,
    zoom: "17",
    maptype: "satellite",
    language: lang === "ja" ? "ja" : "en",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}
function miniMapDetailsHTML(spot, options = {}) {
  const hasCoordinates = hasMiniMapCoordinates(spot);
  const fallbackLink = mapLinkHTML(spot, "spot-mini-map-link");
  if (!hasCoordinates && !fallbackLink) return "";
  const title = options.summary || t("miniMapSummary");
  const liveHref = lang === "ja" ? "live/index.html" : "live/index.html";
  const liveLabel = lang === "ja" ? "乗車中はライブ地図で見る" : "Use Live Map while riding";
  if (!hasCoordinates) {
    return `<section class="spot-static-map">
    <div class="spot-static-map-head">
      <h3>${title}</h3>
    </div>
    <div class="spot-mini-map-fallback">
      <p>${t("miniMapFallbackNote")}</p>
      ${fallbackLink}
    </div>
  </section>`;
  }
  const name = spot[lang]?.name || spot.ja?.name || spot.en?.name || spot.id;
  const embedHref = googleMapsEmbedHref(spot);
  const openMapLabel = lang === "ja" ? `${name}をGoogle Mapsで開く` : `Open ${name} in Google Maps`;
  return `<section class="spot-static-map">
    <div class="spot-static-map-head">
      <h3>${title}</h3>
      ${fallbackLink}
    </div>
    <iframe class="spot-google-map-frame" src="${escapeAttr(embedHref)}" title="${escapeAttr(openMapLabel)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
    <p class="spot-mini-map-note">${t("miniMapNote")} <a href="${liveHref}">${liveLabel}</a></p>
  </section>`;
}
function compactCreditLabel(label) {
  const handle = String(label || "").match(/@[\w_]+/);
  return handle ? handle[0] : label;
}
function escapeAttr(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function photoCreditHTML(spot, options = {}) {
  if (!spot.photoCredit) return "";
  const showNote = options.showNote !== false;
  const label = spot.photoCredit[lang] || spot.photoCredit.ja || spot.photoCredit.en;
  const isMichikusa = String(label).toLowerCase() === "michikusa";
  const text = isMichikusa ? spot.photoCredit.date : compactCreditLabel(label);
  const note = showNote ? spot.photoCredit.note?.[lang] || spot.photoCredit.note?.ja || spot.photoCredit.note?.en || "" : "";
  if (!text) return "";
  const source = spot.photoCredit.url
    ? `<a href="${spot.photoCredit.url}" target="_blank" rel="noopener noreferrer">${text}</a>`
    : text;
  const noteHTML = note ? `<span class="photo-note">${escapeAttr(note)}</span>` : "";
  return `<figcaption class="photo-credit"><span class="photo-credit-source">${source}</span>${noteHTML}</figcaption>`;
}
function photoMetaHTML(photo) {
  if (!photo) return "";
  // Date-only gallery photos are Michikusa-owned; third-party photos must keep credit/sourceUrl.
  const credit = photo.credit?.[lang] || photo.credit?.ja || photo.credit?.en || "";
  const isMichikusa = String(credit).toLowerCase() === "michikusa";
  const creditText = isMichikusa || (!credit && photo.date) ? photo.date : (credit ? compactCreditLabel(credit) : "");
  const note = photo.note?.[lang] || photo.note?.ja || photo.note?.en || "";
  const source = photo.sourceUrl
    ? `<a href="${photo.sourceUrl}" target="_blank" rel="noopener noreferrer">${creditText}</a>`
    : creditText;
  const creditHTML = source ? `<span class="photo-credit-source">${source}</span>` : "";
  const noteHTML = note ? `<span class="photo-note">${escapeAttr(note)}</span>` : "";
  return creditHTML || noteHTML ? `<figcaption class="photo-credit">${creditHTML}${noteHTML}</figcaption>` : "";
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function spotReferencesHTML(spot) {
  const refs = spot.references || [];
  if (!refs.length) return "";
  const title = lang === "ja" ? "もっと知る" : "Learn more";
  const links = refs.map((ref) => {
    const url = typeof ref.url === "object" ? (ref.url?.[lang] || ref.url?.ja || ref.url?.en) : ref.url;
    const label = ref.label?.[lang] || ref.label?.ja || ref.label?.en || url;
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeAttr(label)}</a>`;
  }).join("");
  return `<div class="spot-modal-refs"><span>${title}</span>${links}</div>`;
}
function spotRelatedHTML(spot) {
  const related = (spot.relatedSpotIds || []).map(findSpotById).filter(Boolean);
  if (!related.length) return "";
  const title = lang === "ja" ? "関連" : "Related";
  const links = related.map((item) => {
    const label = item[lang]?.name || item.ja?.name || item.en?.name || item.id;
    return `<a href="${APP_SELF}${spotHash(item.id)}">${escapeAttr(label)}</a>`;
  }).join("");
  return `<div class="spot-modal-refs spot-modal-related"><span>${title}</span>${links}</div>`;
}
function showCreditHTML(spot) {
  if (!spot.photoCredit) return "";
  const label = spot.photoCredit[lang] || spot.photoCredit.ja || spot.photoCredit.en;
  const isMichikusa = String(label).toLowerCase() === "michikusa";
  const text = isMichikusa ? spot.photoCredit.date : compactCreditLabel(label);
  if (!text) return "";
  const body = spot.photoCredit.url
    ? `<a href="${spot.photoCredit.url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${text}</a>`
    : text;
  return `<small class="show-credit">${body}</small>`;
}
function spotImageHTML(spot, label, className = "spot-photo", figureAttrs = "", options = {}) {
  if (!spot.image) return "";
  return `<figure class="photo-figure" ${figureAttrs}><img class="${className}" loading="lazy" src="${spot.image}" alt="${escapeAttr(label)}">${photoCreditHTML(spot, options)}</figure>`;
}
function spotMediaFigureHTML(item, className = "spot-photo") {
  if (!item?.src) return "";
  return `<figure class="photo-figure"><img class="${className}" loading="lazy" src="${item.src}" alt="${escapeAttr(item.alt)}">${item.creditHTML}</figure>`;
}
function spotMediaItems(spot) {
  const L = spot[lang];
  const items = [];
  if (spot.image) {
    items.push({ src: spot.image, alt: L.name, creditHTML: photoCreditHTML(spot), timeOfDay: spot.timeOfDay || "day" });
  }
  (spot.photos || []).forEach((photo) => {
    const alt = photo.alt?.[lang] || photo.alt?.ja || photo.alt?.en || spot[lang].name;
    items.push({ src: photo.src, alt, creditHTML: photoMetaHTML(photo), timeOfDay: photo.timeOfDay || "day" });
  });
  return items;
}
function activeTimeOfDayFilter() {
  if (activeGalleryFilters.has("night")) return "night";
  if (activeGalleryFilters.has("day")) return "day";
  return "";
}
function spotHasTimeOfDay(spot, timeOfDay) {
  if (!timeOfDay) return true;
  return spotMediaItems(spot).some((item) => item.timeOfDay === timeOfDay);
}
function preferredSpotMedia(spot, timeOfDay = "") {
  const items = spotMediaItems(spot);
  if (!items.length) return null;
  const index = timeOfDay ? items.findIndex((item) => item.timeOfDay === timeOfDay) : -1;
  const resolvedIndex = index >= 0 ? index : 0;
  return { ...items[resolvedIndex], index: resolvedIndex };
}
function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}
function seasonalDaylightWindow(date = new Date()) {
  const season = Math.cos(((dayOfYear(date) - 172) * 2 * Math.PI) / 365);
  return {
    sunrise: 342 - 72 * season,
    sunset: 1075 + 95 * season,
  };
}
function isClearlyDark(clock, date = new Date()) {
  if (!Number.isFinite(clock)) return false;
  const daylight = seasonalDaylightWindow(date);
  return clock < daylight.sunrise - 25 || clock > daylight.sunset + 25;
}
function spotModalMediaHTML(spot) {
  const items = spotMediaItems(spot);
  if (!items.length) return `<div class="spot-modal-main-media"><div class="scene">${sceneSVG(spot.scene)}</div></div>`;
  const first = items[0];
  const thumbs = items.length > 1
    ? `<div class="spot-photo-thumbs" aria-label="${t("morePhotos")}">${items.map((item, index) => `
        <button type="button" class="spot-photo-thumb${index === 0 ? " active" : ""}" data-photo-index="${index}" aria-label="${escapeAttr(item.alt)}">
          <img src="${item.src}" alt="" loading="lazy">
        </button>`).join("")}</div>`
    : "";
  return `<div class="spot-modal-main-media">
    ${thumbs}
    <figure class="photo-figure spot-modal-active-figure">
      <img class="spot-photo spot-modal-active-photo" src="${first.src}" alt="${escapeAttr(first.alt)}">
      <div class="spot-modal-active-credit">${first.creditHTML}</div>
    </figure>
  </div>`;
}
function stampBadgeHTML(sp, size, fallbackCls) {
  const inked = !!stamps[sp.id];
  return `<span class="stamp-badge">` +
    `<img class="stamp-badge-image${inked ? "" : " is-uncollected"}" src="images/stamps/stamp_${sp.id}.svg" alt="" width="${size}" height="${size}" loading="lazy" ` +
    `onerror="this.hidden=true;this.nextElementSibling.hidden=false">` +
    `<span class="${fallbackCls}" hidden>${sp.icon}</span></span>`;
}
function spotDetailModalHTML(spot) {
  const L = spot[lang];
  const heroMedia = spotModalMediaHTML(spot);
  return `
    <div class="spot-modal-backdrop" data-modal-close></div>
    <section class="spot-modal-panel" role="dialog" aria-modal="true" aria-labelledby="spot-modal-title" tabindex="-1">
      <button type="button" class="spot-modal-close" data-modal-close aria-label="Close">×</button>
      <div class="spot-modal-head">
        ${stampBadgeHTML(spot, 64, "spot-modal-icon")}
        <div class="spot-modal-titleblock">
          <p class="spot-modal-area">${L.area}</p>
          <h2 id="spot-modal-title">${L.name}</h2>
          <div class="tl-meta">${seatBadge(spot)}${catBadge(spot)}${confBadge(spot)}</div>
        </div>
      </div>
      <div class="spot-modal-content">
        ${heroMedia}
        <div class="spot-modal-copy">
          <p class="spot-modal-hook">${L.hook}</p>
          <p class="spot-modal-story">${L.story}</p>
          <div class="spot-modal-actions">
            <button type="button" class="spot-btn spot-modal-stamp" data-stamp="${spot.id}">${stamps[spot.id] ? t("spotBtnDone") : t("spotBtn")}</button>
          </div>
          ${miniMapDetailsHTML(spot)}
          ${spotRelatedHTML(spot)}
          ${spotReferencesHTML(spot)}
        </div>
      </div>
    </section>`;
}

/* ---------- i18n apply ---------- */
function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach((el) => {
    const v = MSG[lang][el.dataset.i18n];
    if (typeof v === "string") el.innerHTML = v;
  });
  $$(".lang-switch button").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  $$("[data-live-nav]").forEach((link) => link.setAttribute("href", liveMapHref()));
  $$("[data-live-nav-link]").forEach((link) => link.setAttribute("href", liveMapHref()));
  renderMedalBoard();
  renderStampboard();
  renderGallery();
  updateGalleryFilterButtons();
  updateTimelineFilterButtons();
  renderShowcase();
  renderBoardSelect();
  const tl = $("#timelineSection");
  if (tl && !tl.hidden) renderTimeline();
  const tr = $("#trainResults");
  if (tr && !tr.hidden) showTrainResults();
}

/* ---------- showcase（まず何が見えるかを見せる） ---------- */
const showcaseSpotIds = [
  "fuji",
  "hamanako",
  "odawara",
  "toji",
  "nagoya-station-skyline",
  "kirin-beer-factory",
  "kiyosu",
  "solar-ark",
];

function renderShowcase() {
  const rail = $("#showcaseRail");
  if (!rail) return;
  const spots = showcaseSpotIds
    .map((id) => SPOTS.find((sp) => sp.id === id))
    .filter(Boolean);
  rail.innerHTML = spots.map((sp) => {
    const L = sp[lang];
    const media = sp.image
      ? `<img loading="lazy" src="${sp.image}" alt="${L.name}">`
      : sceneSVG(sp.scene);
    return `<div class="show-card" data-show-spot="${sp.id}" role="button" tabindex="0" aria-label="${t("more")}: ${L.name}">
        <div class="show-media">${media}</div>
        <span class="show-caption"><strong>${sp.icon} ${L.name}</strong>${showCreditHTML(sp)}<span>${L.hook}</span><a class="show-guide-link" href="spots/${sp.id}.html">${t("readGuide")}</a></span>
      </div>`;
  }).join("");
  const ctaLabel = lang === "ja" ? "もっと見る" : "More";
  const ctaSub = lang === "ja" ? "この区間の景色を一覧で見る" : "Browse every view in this stretch";
  const remaining = Math.max(0, SPOTS.length - showcaseSpotIds.length);
  rail.insertAdjacentHTML("beforeend", `
    <a class="show-card show-card-cta" href="zukan.html" aria-label="${ctaLabel}: ${t("galTitle")}">
      <div class="show-media show-media-cta" aria-hidden="true">
        <div class="show-cta-badge">
          <span class="show-cta-arrow">→</span>
        </div>
        <span class="show-cta-count">+${remaining} spots</span>
      </div>
      <span class="show-caption">
        <strong>${ctaLabel}</strong>
        <span>${ctaSub}</span>
      </span>
    </a>`);
  rail.querySelectorAll("[data-show-spot]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      if (event.target.closest("[data-stamp]")) return;
      openSpotModal(card.dataset.showSpot, "showcase");
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openSpotModal(card.dataset.showSpot, "showcase");
    });
  });
}

/* ---------- 乗車駅セレクト ---------- */
function renderBoardSelect() {
  const sel = $("#boardStation");
  if (!sel) return;
  const list = direction === "west" ? ROUTE.refStations.slice(0, -1) : ROUTE.refStations.slice(1).reverse();
  sel.innerHTML = list.map((s) => `<option value="${s.id}"${s.id === boardId ? " selected" : ""}>${s[lang]}</option>`).join("");
}

/* ---------- hero sky ---------- */
function renderHero() {
  $("#heroSky").innerHTML = `
  <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#101c2c"/><stop offset="0.55" stop-color="#27405e"/>
        <stop offset="0.8" stop-color="#b96a4e"/><stop offset="1" stop-color="#e8a06a"/>
      </linearGradient>
      <linearGradient id="fujig" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8aa6c8"/><stop offset="1" stop-color="#3d5878"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="560" fill="url(#sky)"/>
    <circle cx="880" cy="330" r="46" fill="#f7d9a0" opacity="0.9"/>
    <g class="cloud" style="animation-duration:80s" opacity="0.5">
      <ellipse cx="300" cy="120" rx="120" ry="22" fill="#fff" opacity="0.18"/>
      <ellipse cx="900" cy="180" rx="160" ry="26" fill="#fff" opacity="0.14"/>
      <ellipse cx="1500" cy="110" rx="120" ry="22" fill="#fff" opacity="0.18"/>
      <ellipse cx="2100" cy="180" rx="160" ry="26" fill="#fff" opacity="0.14"/>
    </g>
    <path d="M380 470 L600 240 L660 300 L700 260 L920 470 Z" fill="url(#fujig)"/>
    <path d="M563 280 L600 240 L660 300 L686 274 L668 318 Q640 300 612 320 Q590 300 575 312 Z" fill="#f3f6fa"/>
    <path d="M0 470 Q200 430 420 462 Q700 500 1200 455 L1200 560 L0 560 Z" fill="#16263a"/>
    <rect x="0" y="492" width="1200" height="6" fill="#0c1622"/>
    <g class="train-move">
      <g>
        <path d="M0 460 q10 -28 56 -28 h300 a12 12 0 0 1 12 12 v22 a8 8 0 0 1 -8 8 h-352 q-10 0 -8 -14 z" fill="#eef3f7"/>
        <path d="M0 460 q10 -28 56 -28 h300 a12 12 0 0 1 12 12 v6 h-372 z" fill="#eef3f7"/>
        <rect x="30" y="441" width="330" height="7" rx="3" fill="#1b6bb0"/>
        <g fill="#27405e"><rect x="80" y="452" width="26" height="11" rx="3"/><rect x="120" y="452" width="26" height="11" rx="3"/><rect x="160" y="452" width="26" height="11" rx="3"/><rect x="200" y="452" width="26" height="11" rx="3"/><rect x="240" y="452" width="26" height="11" rx="3"/><rect x="280" y="452" width="26" height="11" rx="3"/></g>
      </g>
    </g>
  </svg>`;
}

/* ---------- scene illustrations (license-free inline SVG) ---------- */
function sceneSVG(type) {
  const W = `viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" role="img"`;
  const sky = (a, b) => `<defs><linearGradient id="g${type}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="600" height="300" fill="url(#g${type})"/>`;
  // 手前の防音壁 + 流れる景色のスピード線で「車窓から見ている」感を出す
  const frame = `
    <g stroke="#ffffff" stroke-linecap="round" opacity="0.5">
      <line x1="8" y1="84" x2="86" y2="82" stroke-width="3" opacity="0.5"/>
      <line x1="-4" y1="150" x2="60" y2="149" stroke-width="2.4" opacity="0.35"/>
      <line x1="540" y1="110" x2="608" y2="108" stroke-width="3" opacity="0.45"/>
      <line x1="500" y1="200" x2="604" y2="198" stroke-width="2" opacity="0.3"/>
    </g>
    <rect x="0" y="250" width="600" height="14" fill="#223346" opacity="0.65"/>
    <rect x="0" y="262" width="600" height="38" fill="#16263a"/>`;
  switch (type) {
    case "fuji": return `<svg ${W}>${sky("#bcd4ec", "#f4e3cd")}<path d="M110 262 L300 70 L335 110 L370 75 L490 262 Z" fill="#5a7ca3"/><path d="M268 103 L300 70 L335 110 L355 89 L342 132 Q318 116 296 134 Q278 118 262 128 Z" fill="#fff"/><circle cx="480" cy="70" r="26" fill="#f0b04e"/>${frame}</svg>`;
    case "leftfuji": return `<svg ${W}>${sky("#cfdeee", "#f2e2cf")}<path d="M60 262 L210 110 L245 145 L272 118 L390 262 Z" fill="#7d96b5"/><path d="M186 134 L210 110 L245 145 L259 131 L249 162 Q229 148 211 162 Q198 150 186 158 Z" fill="#fff"/><g stroke="#e8704a" stroke-width="5" fill="none"><path d="M430 120 a60 60 0 0 1 0 120" /><path d="M450 140 a40 40 0 0 1 0 80" /></g><text x="436" y="190" font-size="30">↺</text>${frame}</svg>`;
    case "hills": return `<svg ${W}>${sky("#cfe3ef", "#efe6d4")}<path d="M0 262 Q150 150 360 200 Q500 230 600 200 L600 262 Z" fill="#94ab84"/><g fill="#f4efe4" stroke="#c9694a" stroke-width="3">${[0,1,2,3,4,5,6,7].map(i=>`<g transform="translate(${100+i*55} ${188-i*7})"><rect x="0" y="10" width="34" height="22"/><path d="M-4 12 L17 -6 L38 12 Z" fill="#c9694a"/></g>`).join("")}</g>${frame}</svg>`;
    case "bay": return `<svg ${W}>${sky("#bfd9ea", "#f6e8d2")}<rect y="170" width="600" height="92" fill="#5f8fae"/><path d="M0 170 Q120 160 220 170 T600 170 L600 178 Q420 188 220 178 Q100 174 0 178 Z" fill="#fff" opacity="0.5"/><g transform="translate(80 92)"><rect x="18" y="36" width="44" height="42" fill="#f4efe4" stroke="#5a6c7e" stroke-width="3"/><path d="M8 40 L40 12 L72 40 Z" fill="#5a6c7e"/><rect x="30" y="20" width="20" height="16" fill="#f4efe4" stroke="#5a6c7e" stroke-width="3"/></g>${frame}</svg>`;
    case "castle": return `<svg ${W}>${sky("#cddcec", "#f4e9d6")}<g transform="translate(210 60)" stroke="#3e4c5c" stroke-width="4" fill="#f7f3e8"><rect x="40" y="120" width="100" height="60"/><path d="M28 122 L90 96 L152 122 Z" fill="#3e4c5c"/><rect x="55" y="64" width="70" height="40"/><path d="M44 66 L90 42 L136 66 Z" fill="#3e4c5c"/><rect x="68" y="16" width="44" height="32"/><path d="M58 18 L90 -4 L122 18 Z" fill="#3e4c5c"/><path d="M86 -10 q4 -8 8 0" stroke="#d9a440" fill="none"/></g><path d="M0 262 Q300 236 600 262 Z" fill="#8fa783"/>${frame}</svg>`;
    case "lake": return `<svg ${W}>${sky("#c3dcec", "#f7e9d0")}<rect y="160" width="600" height="102" fill="#6f9cba"/><ellipse cx="300" cy="160" rx="320" ry="14" fill="#9cc0d6"/><g stroke="#7c6a4f" stroke-width="4">${[0,1,2].map(i=>`<g transform="translate(${150+i*130} 190)"><line x1="0" y1="0" x2="60" y2="0"/><line x1="10" y1="0" x2="10" y2="-12"/><line x1="50" y1="0" x2="50" y2="-12"/></g>`).join("")}</g><circle cx="500" cy="66" r="24" fill="#f0b04e"/>${frame}</svg>`;
    case "mountain": return `<svg ${W}>${sky("#c8d8e8", "#f1e7d6")}<path d="M40 262 L240 80 L330 180 L420 120 L580 262 Z" fill="#62788f"/><path d="M205 112 L240 80 L286 132 L266 138 L252 124 L236 136 Z" fill="#fff"/><path d="M0 262 Q300 244 600 262 Z" fill="#a8b193"/>${frame}</svg>`;
    case "pagoda": return `<svg ${W}>${sky("#d8d2e2", "#f6e3cd")}<g transform="translate(225 26)" stroke="#3e4c5c" stroke-width="4" fill="#f7f3e8">${[0,1,2,3,4].map(i=>`<g transform="translate(0 ${i*42})"><rect x="${28+i*4}" y="22" width="${94-i*8}" height="22"/><path d="M${10+i*5} 24 L75 ${2-i*0} L${140-i*5} 24 Z" fill="#5c4a3a"/></g>`).join("")}<line x1="75" y1="-18" x2="75" y2="2" stroke="#d9a440" stroke-width="5"/></g><path d="M0 262 Q300 248 600 262 Z" fill="#9aa78b"/>${frame}</svg>`;
    case "solar": return `<svg ${W}>${sky("#c4dced", "#f4ecd6")}<path d="M0 262 Q300 236 600 262 Z" fill="#91a56c"/><g transform="translate(92 96)"><path d="M0 86 Q205 0 416 86" stroke="#2e4050" stroke-width="34" fill="none" stroke-linecap="round"/><path d="M8 88 Q205 18 408 88" stroke="#6f8294" stroke-width="3" fill="none" opacity="0.8"/><g stroke="#9fb3c0" stroke-width="2" opacity="0.55">${[0,1,2,3,4,5,6,7].map(i=>`<line x1="${30+i*50}" y1="${80-Math.sin(i/7*Math.PI)*40}" x2="${54+i*50}" y2="${88-Math.sin(i/7*Math.PI)*44}"/>`).join("")}</g></g><circle cx="500" cy="58" r="22" fill="#f0b04e"/>${frame}</svg>`;
    default: return `<svg ${W}>${sky("#cdd9e6", "#f2e8d6")}${frame}</svg>`;
  }
}

/* ---------- train picker ---------- */
const TRAIN_NAMES = { Nozomi: { ja: "のぞみ", en: "Nozomi" }, Hikari: { ja: "ひかり", en: "Hikari" }, Kodama: { ja: "こだま", en: "Kodama" } };

function trainLabel(tr) {
  const name = (TRAIN_NAMES[tr.type] || { ja: tr.type, en: tr.type })[lang];
  return `${name}${tr.number}`;
}

function previousTrainPageStart(firstDep) {
  const previous = trainCandidates().filter((x) => x.dep < firstDep).slice(-5);
  return previous.length ? previous[0].dep : null;
}

function nextTrainPageStart(lastDep) {
  const next = trainCandidates().find((x) => x.dep > lastDep);
  return next ? next.dep : null;
}

function showTrainPage(pageStartMin) {
  $("#departTime").value = minToClock(pageStartMin);
  track("train_results_page", { direction, board_station: boardId, page_start: minToClock(pageStartMin) });
  showTrainResults();
}

function showTrainResults() {
  const depMin = $("#departTime").value ? toMin($("#departTime").value) : nowMin();
  const found = findTrains(depMin);
  const box = $("#trainResults");
  box.hidden = false;
  const firstDep = found[0]?.dep ?? depMin;
  const lastDep = found[found.length - 1]?.dep ?? depMin;
  const prevStart = previousTrainPageStart(firstDep);
  const nextStart = nextTrainPageStart(lastDep);
  const controls = `
    <div class="train-shift" role="group" aria-label="${escapeAttr(t("labelDeparture"))}">
      <button type="button" data-page-start="${prevStart ?? ""}"${prevStart == null ? " disabled" : ""}>‹ ${escapeHTML(t("trainPrev"))}</button>
      <span>${found.length ? `${escapeHTML(minToClock(firstDep))} - ${escapeHTML(minToClock(lastDep))}` : escapeHTML(minToClock(depMin))}</span>
      <button type="button" data-page-start="${nextStart ?? ""}"${nextStart == null ? " disabled" : ""}>${escapeHTML(t("trainNext"))} ›</button>
    </div>`;
    if (!found.length) {
      box.innerHTML = `${controls}<p class="train-none">${t("trainNone")}</p>`;
      box.querySelectorAll("[data-page-start]").forEach((btn) => {
        btn.addEventListener("click", () => showTrainPage(Number(btn.dataset.pageStart)));
      });
      return;
    }
    box.innerHTML = `${controls}<p class="train-pick-note">${t("trainPickNote")}</p>` + found.map(({ tr, dep }, i) => {
      return `<button type="button" class="train-chip" data-train="${i}">
        <strong>${trainLabel(tr)}</strong>
        <span>${minToClock(dep)} ${t("dep")} → ${stationLabel(tr.destination)}</span>
      </button>`;
    }).join("");
  box.querySelectorAll("[data-page-start]").forEach((btn) => {
    btn.addEventListener("click", () => showTrainPage(Number(btn.dataset.pageStart)));
  });
  box.querySelectorAll("[data-train]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { tr, dep } = found[Number(btn.dataset.train)];
      box.querySelectorAll(".train-chip").forEach((c) => c.classList.toggle("active", c === btn));
      track("train_selected", { direction, board_station: boardId, train_type: tr.type, train_number: tr.number });
      buildTimeline(tr, dep);
    });
  });
}

/* ---------- timeline ---------- */
function buildTimeline(train = null, depMin = null, options = {}) {
  if (depMin == null) depMin = $("#departTime").value ? toMin($("#departTime").value) : nowMin();
  journey = computeJourney(train, depMin);
  if (!options.preview) {
    track("timeline_built", {
      mode: train ? "train" : "estimate",
      direction,
      board_station: boardId,
      spot_count: journey.spots.length,
    });
  }
  const timelineSection = $("#timelineSection");
  timelineSection.hidden = false;
  timelineSection.classList.toggle("timeline-preview", !!options.preview);
  timelineSection.classList.toggle("timeline-estimate", journey.mode === "estimate");
  timelineSection.classList.toggle("timeline-train", journey.mode === "train");
  renderTimeline();
  if (options.preview) {
    stopLive();
  } else {
    startLive();
    timelineSection.scrollIntoView({ behavior: "smooth" });
  }
}

function renderInitialTimelinePreview() {
  const currentBoardId = boardId;
  boardId = direction === "west" ? "Tokyo" : "Shin-Osaka";
  buildTimeline(null, PREVIEW_DEP_MIN, { preview: true });
  boardId = currentBoardId;
}

function renderTimeline() {
  if (!journey) return;
  const base = t(direction === "west" ? "tlTitleWest" : "tlTitleEast");
  const tag = journey.mode === "train"
    ? timelineTrainTagHTML(journey.train)
    : `<span class="tl-title-estimate"><span>${escapeHTML(t("estimateTag"))}</span><small>${escapeHTML(t("estimateNote"))}</small></span>`;
  $("#tlTitle").innerHTML = `
    <span class="tl-title-line">
      <span class="tl-title-base">${escapeHTML(base)}</span>
      <span class="tl-title-divider" aria-hidden="true">—</span>
    </span>
    ${tag}`;
  const items = [];
  journey.stops.forEach((s) => items.push({ kind: "station", clock: s.clock, st: s }));
  journey.spots
    .filter((x) => matchesTimelineFilters(x.sp))
    .forEach((x) => items.push({ kind: "spot", clock: x.clock, sp: x.sp }));
  items.sort((a, b) => a.clock - b.clock || (a.kind === "station" ? -1 : 1));
  const html = [];
  items.forEach((it, i) => {
    if (it.kind === "station") {
      html.push(`<li class="tl-station"><span class="tl-time">${minToClock(it.clock)}</span>${it.st[lang]}</li>`);
    } else {
      html.push(spotItemHTML(it.sp, it.clock));
    }
  });
  $("#timeline").innerHTML = html.join("");
  bindSpotEvents($("#timeline"));
}

function timelineTrainTagHTML(train) {
  const type = (TRAIN_NAMES[train?.type] || { ja: train?.type || "", en: train?.type || "" })[lang];
  const number = escapeHTML(train?.number || "");
  return `
    <span class="tl-title-train">
      <span class="tl-title-train-main">
        <span class="tl-title-train-kind">${escapeHTML(type)}</span>
        <span class="tl-title-train-number">${number}</span>
      </span>
      <small class="tl-title-train-mode">${escapeHTML(t("trainTag"))}</small>
    </span>`;
}

function spotItemHTML(sp, clock) {
  const L = sp[lang];
  const lowLight = journey?.mode !== "estimate" && isClearlyDark(clock);
  const timeMode = lowLight ? "night" : "day";
  const featuredMedia = preferredSpotMedia(sp, timeMode);
  const hasNightMedia = spotHasTimeOfDay(sp, "night");
  const lowLightLimited = lowLight && !hasNightMedia;
  const lowLightBadge = lowLight
    ? `<span class="badge ${hasNightMedia ? "badge-night" : "badge-lowlight"}">${escapeHTML(t(hasNightMedia ? "nightPhotoAvailable" : "lowLightLimited"))}</span>`
    : "";
  const time = clock == null
    ? `<span class="tl-time-big">✦</span>`
    : `<span class="tl-time-big">${minToClock(clock)}<span class="tl-time-suffix">頃</span></span>`;
  const thumb = featuredMedia
    ? `<div class="tl-thumb${lowLightLimited ? " tl-thumb-muted" : ""}" aria-hidden="true"><img loading="lazy" src="${featuredMedia.src}" alt=""></div>`
    : "";
  return `
      <li class="tl-item${lowLightLimited ? " low-light-limited" : ""}" data-spot="${sp.id}" data-gallery-photo-index="${featuredMedia?.index ?? 0}">
        <div class="tl-card tl-card-button" role="button" tabindex="0" data-more aria-label="${escapeHTML(t("more"))}: ${escapeHTML(L.name)}">
          <div class="tl-card-main">
            <div class="tl-copy">
              <div class="tl-top">
                <div class="tl-top-left">${time}<span class="tl-icon">${sp.icon}</span><span class="tl-name">${L.name}</span></div>
              </div>
              <div class="spot-card-footer">
                <div class="tl-meta">${seatBadge(sp)}${catBadge(sp)}${lowLightBadge}${clock == null ? `<span class="badge badge-lucky">${t("anytime")}</span>` : ""}</div>
                <button type="button" class="spot-btn spot-card-stamp${stamps[sp.id] ? " stamped" : ""}" data-stamp="${sp.id}">${stamps[sp.id] ? t("spotBtnDone") : t("spotBtn")}</button>
              </div>
            </div>
            ${thumb}
          </div>
        </div>
      </li>`;
}

function findSpotById(id) {
  return SPOTS.find((sp) => sp.id === id);
}
function spotHash(spotId, photoIndex = 0) {
  const index = Number(photoIndex);
  const photoSuffix = Number.isInteger(index) && index > 0 ? `/photo-${index + 1}` : "";
  return `#spot-${spotId}${photoSuffix}`;
}
function spotHashState(hash = location.hash) {
  const match = String(hash || "").match(/^#spot-([^/]+)(?:\/photo-(\d+))?$/);
  if (!match) return { spotId: "", photoIndex: 0 };
  const photoNumber = Number(match[2] || 1);
  const photoIndex = Number.isInteger(photoNumber) && photoNumber > 0 ? photoNumber - 1 : 0;
  return { spotId: match[1], photoIndex };
}
function spotIdFromHash(hash = location.hash) {
  return spotHashState(hash).spotId;
}
function setSpotHash(spotId, { photoIndex = 0, replace = false } = {}) {
  if (!spotId) return;
  const nextHash = spotHash(spotId, photoIndex);
  if (location.hash === nextHash) return;
  const url = new URL(location.href);
  url.hash = nextHash;
  history[replace ? "replaceState" : "pushState"]({ spotId, photoIndex }, "", url);
}
function clearSpotHash({ replace = true } = {}) {
  if (!spotIdFromHash()) return;
  const url = new URL(location.href);
  url.hash = "";
  history[replace ? "replaceState" : "pushState"](null, "", url);
}
function openSpotModal(spotId, source = "unknown", options = {}) {
  const spot = findSpotById(spotId);
  if (!spot) return;
  const updateUrl = options.updateUrl !== false;
  const photoIndex = Math.max(0, Number(options.photoIndex) || 0);
  if (updateUrl) setSpotHash(spotId, { photoIndex, replace: !!options.replaceUrl });
  closeQuickModal("replace");
  closeSpotModal("replace", { updateUrl: false });
  const modal = document.createElement("div");
  modal.className = "spot-modal";
  modal.innerHTML = spotDetailModalHTML(spot);
  document.body.appendChild(modal);
  document.body.classList.add("modal-open");
  activeSpotModal = { element: modal, spotId, source };
  track("spot_detail_open", spotAnalyticsParams(spot, source));
  track(spotEventName("spot_open", spotId), spotAnalyticsParams(spot, source));
  modal.querySelector(".spot-modal-panel")?.focus();
  bindSpotEvents(modal);
  if (window.MADO_MINI_MAP?.bindMiniMapDetails) window.MADO_MINI_MAP.bindMiniMapDetails(modal, { lang });
  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", () => closeSpotModal("button"));
  });
  bindSpotModalGallery(modal, spot, { initialPhotoIndex: photoIndex, updateUrl });
}
function bindSpotModalGallery(modal, spot, options = {}) {
  const items = spotMediaItems(spot);
  if (!items.length) return;
  const image = modal.querySelector(".spot-modal-active-photo");
  const credit = modal.querySelector(".spot-modal-active-credit");
  const selectPhoto = (index, { trackSelection = true, updateUrl = true, replaceUrl = false } = {}) => {
    const item = items[index];
    if (!item || !image || !credit) return false;
    image.src = item.src;
    image.alt = item.alt;
    credit.innerHTML = item.creditHTML;
    modal.querySelectorAll("[data-photo-index]").forEach((thumb) => {
      thumb.classList.toggle("active", Number(thumb.dataset.photoIndex) === index);
    });
    if (updateUrl) setSpotHash(spot.id, { photoIndex: index, replace: replaceUrl });
    if (trackSelection) track("spot_photo_selected", spotAnalyticsParams(spot, "spot_modal", { photo_index: index }));
    return true;
  };
  const initialPhotoIndex = Math.max(0, Number(options.initialPhotoIndex) || 0);
  if (initialPhotoIndex > 0) selectPhoto(initialPhotoIndex, { trackSelection: false, updateUrl: false });
  if (items.length <= 1) return;
  modal.querySelectorAll("[data-photo-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.photoIndex);
      selectPhoto(index);
    });
  });
}
function closeSpotModal(reason = "close", options = {}) {
  if (!activeSpotModal) return;
  const { element, spotId, source } = activeSpotModal;
  const spot = findSpotById(spotId);
  element.remove();
  document.body.classList.remove("modal-open");
  activeSpotModal = null;
  if (options.updateUrl !== false && spotIdFromHash() === spotId) clearSpotHash({ replace: true });
  if (reason !== "replace") track("spot_detail_close", spotAnalyticsParams(spot, source, { reason }));
}

function openQuickModal(source = "hero") {
  closeQuickModal("replace");
  const modal = document.createElement("div");
  modal.className = "quick-modal";
  const promoSrc = `promo.html?lang=${encodeURIComponent(lang)}`;
  modal.innerHTML = `
    <div class="quick-modal-backdrop" data-quick-close></div>
    <section class="quick-modal-panel" role="dialog" aria-modal="true" aria-labelledby="quick-modal-title" tabindex="-1">
      <div class="quick-modal-head">
        <h2 id="quick-modal-title">${t("quickModalTitle")}</h2>
        <button type="button" class="quick-modal-close" data-quick-close aria-label="${t("quickModalClose")}">×</button>
      </div>
      <div class="quick-modal-frame">
        <iframe src="${promoSrc}" title="${t("quickModalTitle")}" loading="eager" allow="autoplay"></iframe>
      </div>
    </section>`;
  document.body.appendChild(modal);
  document.body.classList.add("modal-open");
  const timers = [
    setTimeout(() => track("quick_intro_10s", { source, language: lang, duration_sec: 10 }), 10000),
    setTimeout(() => track("quick_intro_complete", { source, language: lang, duration_sec: 30 }), 30000),
  ];
  activeQuickModal = { element: modal, source, timers };
  track("quick_intro_open", { source, language: lang });
  modal.querySelector(".quick-modal-panel")?.focus();
  modal.querySelectorAll("[data-quick-close]").forEach((el) => {
    el.addEventListener("click", () => closeQuickModal("button"));
  });
}
function closeQuickModal(reason = "close") {
  if (!activeQuickModal) return;
  const { element, source, timers = [] } = activeQuickModal;
  timers.forEach((timer) => clearTimeout(timer));
  element.remove();
  document.body.classList.remove("modal-open");
  activeQuickModal = null;
  if (reason !== "replace") track("quick_intro_close", { source, reason });
}

function bindSpotEvents(root) {
  root.querySelectorAll("[data-stamp]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleStamp(btn.dataset.stamp);
    });
  });
  root.querySelectorAll("[data-more]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      if (event.target.closest("[data-stamp]")) return;
      const item = btn.closest(".tl-item, .gal-card");
      const source = item?.classList.contains("gal-card") ? "gallery" : "timeline";
      const photoIndex = item?.dataset.galleryPhotoIndex;
      openSpotModal(item?.dataset.spot, source, { photoIndex });
    });
    btn.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest("[data-stamp]")) return;
      event.preventDefault();
      const item = btn.closest(".tl-item, .gal-card");
      const source = item?.classList.contains("gal-card") ? "gallery" : "timeline";
      const photoIndex = item?.dataset.galleryPhotoIndex;
      openSpotModal(item?.dataset.spot, source, { photoIndex });
    });
  });
  root.querySelectorAll("[data-map]").forEach((link) => {
    link.addEventListener("click", () => track("map_opened", spotAnalyticsParams(findSpotById(link.dataset.map), "inline_map")));
  });
  root.querySelectorAll(".tl-card-button:not([data-more])").forEach((card) => {
    card.addEventListener("click", () => openSpotModal(card.closest(".tl-item")?.dataset.spot, "timeline"));
  });
}

/* ---------- live next-up ---------- */
function startLive() {
  clearInterval(liveTimer);
  updateLive();
  liveTimer = setInterval(updateLive, 20000);
}
function stopLive() {
  clearInterval(liveTimer);
  liveTimer = null;
  const banner = $("#nextup");
  if (banner) banner.hidden = true;
}
function updateLive() {
  const banner = $("#nextup");
  if (!journey || !journey.spots.length) { banner.hidden = true; return; }
  const now = nowMin();
  const end = journey.stops.length ? journey.stops[journey.stops.length - 1].clock : journey.depMin;
  if (now < journey.depMin - 30 || now > end + 15) { banner.hidden = true; return; }
  const upcoming = journey.spots.find((x) => x.clock >= now - 1);
  if (!upcoming) { banner.hidden = true; return; }
  const remain = upcoming.clock - now;
  banner.hidden = false;
  $("#nextupName").textContent = `${upcoming.sp.icon} ${upcoming.sp[lang].name}`;
  $("#nextupCount").textContent = remain <= 1 ? t("soon") : t("inMinutes", remain);
}

/* ---------- medals ---------- */
const CASTLE_MEDAL_IDS = [
  "odawara-castle",
  "kakegawa",
  "kiyosu",
  "gifu-castle",
  "sawayama-castle",
  "hikone-castle",
  "kannonji-castle",
];
const FUJI_MEDAL_IDS = [
  "ota-fuji",
  "sagami-fuji",
  "fuji",
  "left-fuji",
  "hamanako-fuji",
];
const MEDAL_SETS = [
  {
    id: "overall",
    icon: "◎",
    titleKey: "medalOverall",
    spots: () => SPOTS,
  },
  {
    id: "castle",
    icon: "🏯",
    titleKey: "medalCastle",
    spots: () => CASTLE_MEDAL_IDS.map(findSpotById).filter(Boolean),
  },
  {
    id: "fuji",
    icon: "🗻",
    titleKey: "medalFuji",
    spots: () => FUJI_MEDAL_IDS.map(findSpotById).filter(Boolean),
  },
  {
    id: "classic",
    icon: "★",
    titleKey: "medalClassic",
    spots: () => SPOTS.filter((sp) => sp.category === "classic"),
  },
];
const MEDAL_LEVELS = [
  { key: "gold", labelKey: "medalGold", rank: 3 },
  { key: "silver", labelKey: "medalSilver", rank: 2 },
  { key: "bronze", labelKey: "medalBronze", rank: 1 },
];

function medalThresholds(total) {
  return {
    bronze: total > 0 ? 1 : 0,
    silver: Math.max(1, Math.ceil(total / 2)),
    gold: total,
  };
}
function medalProgress(set) {
  const targets = set.spots();
  const total = targets.length;
  const got = targets.filter((sp) => stamps[sp.id]).length;
  const thresholds = medalThresholds(total);
  const level = MEDAL_LEVELS.find((candidate) => got >= thresholds[candidate.key]) || null;
  const next = [...MEDAL_LEVELS].reverse().find((candidate) => got < thresholds[candidate.key]);
  return { targets, total, got, thresholds, level, next };
}
function medalLevelLabel(level) {
  return level ? t(level.labelKey) : t("medalNoMedal");
}
function renderMedalBoard() {
  const board = $("#medalBoard");
  if (!board) return;
  board.innerHTML = `
    <div class="medal-grid">
      ${MEDAL_SETS.map((set) => {
        const progress = medalProgress(set);
        const levelClass = progress.level ? `medal-${progress.level.key}` : "medal-none";
        const percent = progress.total ? Math.round((progress.got / progress.total) * 100) : 0;
        const label = `${t(set.titleKey)} ${t("medalProgress", progress.got, progress.total)} ${medalLevelLabel(progress.level)}`;
        return `
          <div class="medal-card ${levelClass}" style="--medal-progress: ${percent}%;" role="img" aria-label="${escapeAttr(label)}">
            <span class="medal-title">${escapeHTML(t(set.titleKey))}</span>
            <span class="medal-icon" aria-hidden="true">${set.icon}</span>
            <span class="medal-count">${escapeHTML(t("medalProgress", progress.got, progress.total))}</span>
          </div>`;
      }).join("")}
    </div>`;
}

/* ---------- stamps ---------- */
function toggleStamp(id) {
  const removed = !!stamps[id];
  if (removed) delete stamps[id];
  else stamps[id] = Date.now();
  track(removed ? "stamp_removed" : "stamp_added", { spot_id: id });
  localStorage.setItem("mado-stamps", JSON.stringify(stamps));
  renderMedalBoard();
  renderStampboard();
  $$(`[data-stamp="${id}"]`).forEach((btn) => {
    const got = !!stamps[id];
    btn.classList.toggle("stamped", got);
    btn.textContent = got ? t("spotBtnDone") : t("spotBtn");
  });
}
function renderStampboard() {
  if (!$("#stampboard")) return;
  $("#stampboard").innerHTML = SPOTS.map((sp) => `
    <div class="stamp${stamps[sp.id] ? " got" : ""}">
      <span class="s-icon">${sp.icon}</span>
      <span class="s-name">${sp[lang].name}</span>
    </div>`).join("");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("sw.js").catch(() => {
    // The app works without offline support; stale-cache cleanup should not block the UI.
  });
}

/* ---------- gallery ---------- */
const activeGalleryFilters = new Set(["day"]);
const activeTimelineFilters = new Set();
const discoveryCategoryRank = { classic: 0, notable: 1, curious: 2, hidden: 1 };
const discoverySpotPriority = {
  fuji: 0,
  "sagami-fuji": 1,
  hamanako: 2,
  ibuki: 3,
  toji: 4,
};
function discoverySpotOrder(a, b) {
  const rankA = discoveryCategoryRank[a.category] ?? 9;
  const rankB = discoveryCategoryRank[b.category] ?? 9;
  const priorityA = discoverySpotPriority[a.id] ?? 99;
  const priorityB = discoverySpotPriority[b.id] ?? 99;
  return rankA - rankB || priorityA - priorityB || a.minutesFromTokyo - b.minutesFromTokyo;
}
const galleryTagGroups = {
  nature: new Set(["ota-fuji", "sagami-fuji", "fuji", "left-fuji", "odawara", "hamanako", "hamanako-fuji", "toyohashi-tateiwa", "mikawa-oshima", "shizuoka-tea-fields", "ibuki", "omi-fuji"]),
  history: new Set(["odawara-castle", "gyoran-kannon", "kakegawa", "kiyosu", "gifu-castle", "sawayama-castle", "hikone-castle", "kannonji-castle", "seta-karahashi", "toji"]),
  industry: new Set(["shimizu-port-chikyu", "kirin-beer-factory", "solar-ark", "torikai-train-depot", "kinshozan"]),
  sign: new Set(["putiputi-sign", "727-board", "genki-sign", "nichiban-anjo"]),
  city: new Set(["tokyo-tower", "maruko-bridge", "musashi-kosugi-towers", "hinataoka", "nagoya-station-skyline"]),
};
const galleryTagOrder = ["seat-a", "seat-e", "day", "night", "classic", "nature", "history", "industry", "sign", "city"];
const galleryTagLabelKeys = {
  "seat-a": "fSeatA",
  "seat-e": "fSeatE",
  day: "fDay",
  night: "fNight",
  classic: "fClassic",
  nature: "fNature",
  history: "fHistory",
  industry: "fIndustry",
  sign: "fSign",
  city: "fCity",
};
function galleryTags(spot) {
  const tags = new Set();
  seatTags(spot).forEach((tag) => tags.add(tag));
  if (spotHasTimeOfDay(spot, "day")) tags.add("day");
  if (spotHasTimeOfDay(spot, "night")) tags.add("night");
  if (spot.category === "classic") tags.add("classic");
  Object.entries(galleryTagGroups).forEach(([tag, ids]) => {
    if (ids.has(spot.id)) tags.add(tag);
  });
  return tags;
}
function galleryTagBadgesHTML(spot) {
  const tags = galleryTags(spot);
  return galleryTagOrder
    .filter((tag) => tags.has(tag) && tag !== "day" && tag !== "night")
    .map((tag) => `<span class="badge gal-tag gal-tag-${tag}">${escapeHTML(t(galleryTagLabelKeys[tag]))}</span>`)
    .join("");
}
function timelineThemeTagBadgesHTML(spot) {
  const tags = galleryTags(spot);
  return galleryTagOrder
    .filter((tag) => tags.has(tag) && !["seat-a", "seat-e", "day", "night"].includes(tag))
    .map((tag) => `<span class="badge gal-tag gal-tag-${tag}">${escapeHTML(t(galleryTagLabelKeys[tag]))}</span>`)
    .join("");
}
function matchesGalleryFilters(spot) {
  if (!activeGalleryFilters.size) return true;
  const tags = galleryTags(spot);
  const selectedSeats = [...activeGalleryFilters].filter((filter) => filter === "seat-a" || filter === "seat-e");
  const selectedTimes = [...activeGalleryFilters].filter((filter) => filter === "day" || filter === "night");
  const selectedThemes = [...activeGalleryFilters].filter((filter) => !["seat-a", "seat-e", "day", "night"].includes(filter));
  const seatMatch = !selectedSeats.length || selectedSeats.some((filter) => tags.has(filter));
  const timeMatch = !selectedTimes.length || selectedTimes.some((filter) => tags.has(filter));
  const themeMatch = !selectedThemes.length || selectedThemes.some((filter) => tags.has(filter));
  return seatMatch && timeMatch && themeMatch;
}
function matchesTimelineFilters(spot) {
  if (!activeTimelineFilters.size) return true;
  const tags = galleryTags(spot);
  const selectedSeats = [...activeTimelineFilters].filter((filter) => filter === "seat-a" || filter === "seat-e");
  const selectedThemes = [...activeTimelineFilters].filter((filter) => !["seat-a", "seat-e"].includes(filter));
  const seatMatch = !selectedSeats.length || selectedSeats.some((filter) => tags.has(filter));
  const themeMatch = !selectedThemes.length || selectedThemes.some((filter) => tags.has(filter));
  return seatMatch && themeMatch;
}
function updateGalleryFilterButtons() {
  const hasTagFilters = [...activeGalleryFilters].some((filter) => filter !== "day" && filter !== "night");
  $$("#filterbar button[data-filter], #galleryModebar button[data-filter]").forEach((button) => {
    const filter = button.dataset.filter;
    const active = filter === "all" ? !hasTagFilters : activeGalleryFilters.has(filter);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
function updateTimelineFilterButtons() {
  const hasFilters = activeTimelineFilters.size > 0;
  $$("#timelineFilterbar button[data-timeline-filter]").forEach((button) => {
    const filter = button.dataset.timelineFilter;
    const active = filter === "all" ? !hasFilters : activeTimelineFilters.has(filter);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderGallery() {
  const grid = $("#galleryGrid");
  if (!grid) return;
  grid.innerHTML = SPOTS
      .filter(matchesGalleryFilters)
      .slice()
      .sort(discoverySpotOrder)
      .map((sp) => {
        const L = sp[lang];
        const featuredMedia = preferredSpotMedia(sp, activeTimeOfDayFilter());
        const media = featuredMedia
          ? spotMediaFigureHTML({ ...featuredMedia, creditHTML: featuredMedia.creditHTML.replace(/<span class="photo-note">.*?<\/span>/g, "") }, "gal-photo")
          : sceneSVG(sp.scene);
        return `
          <div class="gal-card" id="spot-${sp.id}" data-spot="${sp.id}" data-gallery-photo-index="${featuredMedia?.index ?? 0}" data-more role="button" tabindex="0" aria-label="${escapeHTML(t("more"))}: ${escapeHTML(L.name)}">
            <div class="gal-media-wrap">
              ${media}
            </div>
            <div class="gal-body">
              <div class="gal-top">
                <div class="gal-top-left">${stampBadgeHTML(sp, 38, "tl-icon")}<span class="gal-name">${L.name}</span></div>
                <button type="button" class="spot-btn spot-card-stamp gal-stamp${stamps[sp.id] ? " stamped" : ""}" data-stamp="${sp.id}">${stamps[sp.id] ? t("spotBtnDone") : t("spotBtn")}</button>
              </div>
              <p class="gal-area">${L.area}</p>
              <div class="spot-card-footer">
                <div class="tl-meta gal-tags">${galleryTagBadgesHTML(sp)}</div>
              </div>
            </div>
          </div>`;
      }).join("");
  bindSpotEvents(grid);
}
function openSpotFromHash(source = "hash") {
  const { spotId, photoIndex } = spotHashState();
  if (!findSpotById(spotId)) return false;
  openSpotModal(spotId, source, { updateUrl: false, photoIndex });
  return true;
}
function syncModalWithLocation(source = "url") {
  if (location.hash === "#quick-intro") {
    closeSpotModal("replace", { updateUrl: false });
    openQuickModal(source);
    return;
  }
  const { spotId, photoIndex } = spotHashState();
  if (spotId) {
    if (findSpotById(spotId)) openSpotModal(spotId, source, { updateUrl: false, photoIndex });
    return;
  }
  if (activeSpotModal) closeSpotModal(source, { updateUrl: false });
}

function bindGalleryControls() {
  $("#filterbar")?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("button[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;
    if (filter === "all") {
      const timeMode = activeTimeOfDayFilter();
      activeGalleryFilters.clear();
      if (timeMode) activeGalleryFilters.add(timeMode);
    } else if (activeGalleryFilters.has(filter)) {
      activeGalleryFilters.delete(filter);
    } else {
      activeGalleryFilters.add(filter);
    }
    updateGalleryFilterButtons();
    track("gallery_filtered", { filters: [...activeGalleryFilters].join(",") || "all" });
    renderGallery();
  });
  $("#galleryModebar")?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("button[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;
    if (activeGalleryFilters.has(filter)) {
      activeGalleryFilters.delete(filter);
    } else {
      activeGalleryFilters.delete("day");
      activeGalleryFilters.delete("night");
      activeGalleryFilters.add(filter);
    }
    updateGalleryFilterButtons();
    track("gallery_time_mode_changed", { mode: activeTimeOfDayFilter() || "all" });
    renderGallery();
  });
}

function bindTimelineControls() {
  $("#timelineFilterbar")?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("button[data-timeline-filter]");
    if (!button) return;
    const filter = button.dataset.timelineFilter;
    if (filter === "all") {
      activeTimelineFilters.clear();
    } else if (activeTimelineFilters.has(filter)) {
      activeTimelineFilters.delete(filter);
    } else {
      activeTimelineFilters.add(filter);
    }
    updateTimelineFilterButtons();
    track("timeline_filtered", { filters: [...activeTimelineFilters].join(",") || "all" });
    renderTimeline();
  });
}

/* ---------- init ---------- */
function init() {
  if ($("#heroSky")) renderHero();
  $$(".lang-switch button").forEach((b) => b.addEventListener("click", () => {
    lang = b.dataset.lang; localStorage.setItem("mado-lang", lang); track("language_changed", { language: lang }); applyLang();
  }));
  bindGalleryControls();
  bindTimelineControls();
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSpotModal("escape");
      closeQuickModal("escape");
    }
  });
  // ここから先はアプリ画面（index.html）専用の初期化
  if (!$("#departTime")) {
    applyLang();
    window.addEventListener("hashchange", () => syncModalWithLocation("hashchange"));
    window.addEventListener("popstate", () => syncModalWithLocation("popstate"));
    syncModalWithLocation("url");
    registerServiceWorker();
    return;
  }
  // 出発時刻の初期値 = 現在
  $("#departTime").value = fmtClock(new Date());
  $("#nowBtn").addEventListener("click", () => { $("#departTime").value = fmtClock(new Date()); });
  $$("[data-dir]").forEach((b) => b.addEventListener("click", () => {
    direction = b.dataset.dir;
    boardId = direction === "west" ? "Tokyo" : "Shin-Osaka";
    renderBoardSelect();
    $("#trainResults").hidden = true;
    $$("[data-dir]").forEach((x) => x.classList.toggle("active", x === b));
    if ($("#timelineSection")?.classList.contains("timeline-preview")) renderInitialTimelinePreview();
  }));
  $("#boardStation").addEventListener("change", (e) => { boardId = e.target.value; $("#trainResults").hidden = true; });
  $("#findTrainsBtn").addEventListener("click", () => {
    track("train_search", { direction, board_station: boardId });
    showTrainResults();
  });
  $("#buildBtn")?.addEventListener("click", () => buildTimeline(null));
  $("#resetBtn").addEventListener("click", () => {
    if (confirm(t("confirmReset"))) {
      stamps = {}; localStorage.setItem("mado-stamps", "{}");
      renderMedalBoard(); renderStampboard(); renderGallery();
      const tl = $("#timelineSection");
      if (tl && !tl.hidden) renderTimeline();
    }
  });
  applyLang();
  renderInitialTimelinePreview();
  window.addEventListener("hashchange", () => syncModalWithLocation("hashchange"));
  window.addEventListener("popstate", () => syncModalWithLocation("popstate"));
  const params = new URLSearchParams(location.search);
  if (params.get("intro") === "1" && location.hash !== "#quick-intro") {
    openQuickModal("url");
  } else {
    syncModalWithLocation("url");
  }
  registerServiceWorker();
}
document.addEventListener("DOMContentLoaded", init);
