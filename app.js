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
    heroLead: "富士山の3分間も、線路ぎわの城も、湖も海も。新幹線で「いつ・どちら側を見ればいいか」がわかり、見つけた景色が旅の思い出になる手帖です。",
    ctaStart: "旅をはじめる", ctaBrowse: "車窓をながめる", ctaQuick: "新幹線の窓とは？",
    quickModalTitle: "新幹線の窓とは？",
    quickModalClose: "閉じる",
    setupEyebrow: "YOUR JOURNEY", setupTitle: "きょうの旅を教えてください",
    setupSub: "時刻表に合わせて、富士山も湖も城も見逃さない。方向・乗車駅・出発時刻から、あなたの列車の車窓タイムラインをつくります。",
    labelDirection: "方向", labelDeparture: "出発時刻", labelSeat: "座席",
    dirWest: "西へ（大阪方面）", dirEast: "東へ（東京方面）",
    btnNow: "これから乗る", seatFuji: "富士山側", seatSea: "海側", seatBoth: "両方みる",
    btnBuild: "列車を選ばず、目安タイムラインだけつくる",
    labelBoard: "乗車駅",
    btnFind: "この時間の列車をさがす",
    trainNone: "この条件の列車が見つかりませんでした。時刻を変えるか、目安タイムラインをどうぞ。",
    trainPickNote: "乗る列車をえらんでください（実ダイヤ基準）",
    heroPhotoCredit: "photo: 新幹線の車窓から撮影（E席・三島→新富士）",
    showEyebrow: "WHAT YOU'LL SEE", showTitle: "たとえば、こんな景色",
    showNote: "実写つき17スポットを収録。次は、あなたの列車で「何時に・どちら側に見えるか」を出します。",
    estimateTag: "目安モード", trainTag: "実ダイヤ",
    dep: "発", arr: "着",
    seatTipNote: "ヒント: 富士山はどちら向きでも E席。海はA席、浜名湖はE席写真を採用しています。",
    nextupLabel: "つぎの車窓",
    tlEyebrow: "WINDOW TIMELINE",
    tlSub: "時刻はのぞみ基準の目安です。すこし前から窓の外を意識してみてください。",
    tlTitleWest: "東京 → 新大阪の車窓タイムライン", tlTitleEast: "新大阪 → 東京の車窓タイムライン",
    memEyebrow: "YOUR JOURNAL", memTitle: "車窓スタンプ帖",
    memSub: "「見えた!」を押すと、ここにスタンプがたまります。旅のおわりに、思い出カードをどうぞ。",
    btnCard: "思い出カードをつくる", btnReset: "スタンプをリセット", btnDownload: "カードを保存する",
    galEyebrow: "FIELD GUIDE", galTitle: "車窓図鑑 — ぜんぶの見どころ",
    galSub: "定番と穴場。気になるカードを開いてみてください。",
    morePhotos: "ほかの写真も見る",
    fAll: "すべて", fClassic: "定番", fHidden: "穴場",
    footerNote: "時刻はのぞみ基準の目安で、列車・天候・座席位置により見え方は変わります。少し早めに窓の外を見てください。",
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
    seatE: "E席・富士山側", seatA: "A席・海側",
    catClassic: "定番", catHidden: "穴場",
    confCheck: "裏取り中",
    spotted: "見えた!", spotBtn: "見えた!", spotBtnDone: "スタンプ済 ✓",
    more: "くわしく", less: "とじる", mapLink: "地図で見る",
    oppositeSide: "反対側の車窓",
    inMinutes: (m) => `あと${m}分`, soon: "まもなく!", passed: "通過",
    anytime: "全区間",
    departed: (t) => `${t} 出発`,
    cardTitle: "車窓のたび",
    cardFooter: "道草 / Michikusa — 新幹線の窓",
    cardCount: (n, total) => `みつけた車窓  ${n} / ${total}`,
    cardRouteWest: "東京 → 新大阪", cardRouteEast: "新大阪 → 東京",
    confirmReset: "スタンプをぜんぶ消しますか?",
    emptyCard: "まだスタンプがありません。タイムラインで「見えた!」を押してみてください。",
  },
  en: {
    brandName: "Shinkansen Window",
    brandSub: "Never miss a moment of the journey.",
    heroKicker: "TOKAIDO SHINKANSEN · TOKYO ⇄ SHIN-OSAKA",
    heroTitle: "There's another journey<br>outside your window.",
    heroLead: "Fuji's famous three minutes, castles beside the tracks, lake and sea. Shinkansen Window shows when and where to look, turning a Shinkansen ride into a journey to remember.",
    ctaStart: "Start your journey", ctaBrowse: "Browse the views", ctaQuick: "What is it?",
    quickModalTitle: "What is Shinkansen Window?",
    quickModalClose: "Close",
    setupEyebrow: "YOUR JOURNEY", setupTitle: "Tell us about today's ride",
    setupSub: "Use the timetable to catch Fuji, lakes, castles, and more. Add direction, boarding station, and departure time to build your train's window timeline.",
    labelDirection: "Direction", labelDeparture: "Departure", labelSeat: "Your seat",
    dirWest: "Westbound (for Osaka)", dirEast: "Eastbound (for Tokyo)",
    btnNow: "Boarding soon", seatFuji: "Fuji side", seatSea: "Sea side", seatBoth: "Show both",
    btnBuild: "Skip train pick — estimate-only timeline",
    labelBoard: "Boarding at",
    btnFind: "Find my train",
    trainNone: "No trains found for this time. Try another time, or use the estimate timeline.",
    trainPickNote: "Pick your train (real timetable)",
    heroPhotoCredit: "photo: shot from the train window (Seat E, Mishima → Shin-Fuji)",
    showEyebrow: "WHAT YOU'LL SEE", showTitle: "Views like these",
    showNote: "17 real-photo spots included. Next, see when and which side they appear from your train.",
    estimateTag: "Estimate", trainTag: "Real timetable",
    dep: "dep", arr: "arr",
    seatTipNote: "Tip: Seat E faces Mt. Fuji in both directions. Seat A gets the sea; Lake Hamana uses an E-seat photo.",
    nextupLabel: "NEXT VIEW",
    tlEyebrow: "WINDOW TIMELINE",
    tlSub: "Times are estimates based on Nozomi trains. Start watching a little early.",
    tlTitleWest: "Tokyo → Shin-Osaka window timeline", tlTitleEast: "Shin-Osaka → Tokyo window timeline",
    memEyebrow: "YOUR JOURNAL", memTitle: "Window Stamp Book",
    memSub: "Tap “Spotted!” on a view and it lands here. Make a memory card at the end of your ride.",
    btnCard: "Create my memory card", btnReset: "Reset stamps", btnDownload: "Save the card",
    galEyebrow: "FIELD GUIDE", galTitle: "Field Guide — every view",
    galSub: "Classics and hidden gems. Open any card that catches your eye.",
    morePhotos: "More photos",
    fAll: "All", fClassic: "Classic", fHidden: "Hidden gems",
    footerNote: "Times are Nozomi-based estimates; visibility varies by train, weather and seat. Start watching a little early.",
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
    seatE: "Seat E · Fuji side", seatA: "Seat A · Sea side",
    catClassic: "Classic", catHidden: "Hidden gem",
    confCheck: "verifying",
    spotted: "Spotted!", spotBtn: "Spotted!", spotBtnDone: "Stamped ✓",
    more: "More", less: "Close", mapLink: "Open map",
    oppositeSide: "Other-side view",
    inMinutes: (m) => `in ${m} min`, soon: "Coming up!", passed: "Passed",
    anytime: "Anywhere en route",
    departed: (t) => `Departed ${t}`,
    cardTitle: "My Window Journey",
    cardFooter: "Michikusa — Shinkansen Window",
    cardCount: (n, total) => `Views spotted  ${n} / ${total}`,
    cardRouteWest: "Tokyo → Shin-Osaka", cardRouteEast: "Shin-Osaka → Tokyo",
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
let seat = "E";
let boardId = "Tokyo";        // 乗車駅
let journey = null;           // 生成済みタイムライン {mode, train, stops, spots}
let stamps = JSON.parse(localStorage.getItem("mado-stamps") || "{}");
let liveTimer = null;
let activeSpotModal = null;
let activeQuickModal = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const t = (key, ...args) => {
  const v = MSG[lang][key];
  return typeof v === "function" ? v(...args) : (v ?? key);
};
function track(eventName, params = {}) {
  if (typeof gtag === "function") gtag("event", eventName, params);
}
function eventSafeId(id) {
  return String(id || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function spotEventName(prefix, spotId) {
  return `${prefix}_${eventSafeId(spotId)}`.slice(0, 40);
}

/* ---------- helpers ---------- */
const REF = Object.fromEntries(ROUTE.refStations.map((s) => [s.id, s.min]));
const STATION = Object.fromEntries(ROUTE.refStations.map((s) => [s.id, s]));

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

/* 列車検索: 方向・乗車駅・時刻に合う列車（出発時刻順に最大5本） */
function findTrains(depMin) {
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
    .filter((x) => x.dep >= depMin && x.dep <= depMin + 120)
    .sort((a, b) => a.dep - b.dep)
    // データセット内の重複列車（同番号・同時刻）を除去
    .filter((x, i, arr) => i === arr.findIndex((y) => y.tr.type === x.tr.type && y.tr.number === x.tr.number && y.dep === x.dep))
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
function seatBadge(spot) {
  if (!spot.side) return "";
  const cls = spot.side === "E" ? "badge-seat-E" : "badge-seat-A";
  const label = spot.sideLabel?.[lang] || (spot.side === "E" ? t("seatE") : t("seatA"));
  return `<span class="badge ${cls}">${label}</span>`;
}
function catBadge(spot) {
  return `<span class="badge badge-${spot.category}">${t(spot.category === "classic" ? "catClassic" : "catHidden")}</span>`;
}
function confBadge(spot) {
  return spot.confidence === "needs-check" ? `<span class="badge badge-check">${t("confCheck")}</span>` : "";
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
function compactCreditLabel(label) {
  const handle = String(label || "").match(/@[\w_]+/);
  return handle ? handle[0] : label;
}
function photoCreditHTML(spot) {
  if (!spot.photoCredit) return "";
  const label = spot.photoCredit[lang] || spot.photoCredit.ja || spot.photoCredit.en;
  const isMichikusa = String(label).toLowerCase() === "michikusa";
  const text = isMichikusa ? spot.photoCredit.date : compactCreditLabel(label);
  if (!text) return "";
  return spot.photoCredit.url
    ? `<figcaption class="photo-credit"><a href="${spot.photoCredit.url}" target="_blank" rel="noopener noreferrer">${text}</a></figcaption>`
    : `<figcaption class="photo-credit">${text}</figcaption>`;
}
function photoMetaHTML(photo) {
  if (!photo) return "";
  const credit = photo.credit?.[lang] || photo.credit?.ja || photo.credit?.en || "";
  const isMichikusa = String(credit).toLowerCase() === "michikusa";
  const creditText = isMichikusa ? photo.date : (credit ? compactCreditLabel(credit) : "");
  const source = photo.sourceUrl
    ? `<a href="${photo.sourceUrl}" target="_blank" rel="noopener noreferrer">${creditText}</a>`
    : creditText;
  return creditText ? `<figcaption class="photo-credit">${source}</figcaption>` : "";
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
function spotImageHTML(spot, label, className = "spot-photo") {
  if (!spot.image) return "";
  return `<figure class="photo-figure"><img class="${className}" loading="lazy" src="${spot.image}" alt="${label}">${photoCreditHTML(spot)}</figure>`;
}
function photoGalleryHTML(spot) {
  if (!spot.photos?.length) return "";
  return `<div class="photo-gallery"><p class="photo-gallery-title">${t("morePhotos")}</p>${spot.photos.map((photo) => {
    const alt = photo.alt?.[lang] || photo.alt?.ja || photo.alt?.en || spot[lang].name;
    return `<figure class="photo-figure"><img class="spot-photo" loading="lazy" src="${photo.src}" alt="${alt}">${photoMetaHTML(photo)}</figure>`;
  }).join("")}</div>`;
}
function spotDetailModalHTML(spot) {
  const L = spot[lang];
  const heroMedia = spot.image
    ? `<div class="spot-modal-main-media">${spotImageHTML(spot, L.name)}</div>`
    : `<div class="spot-modal-main-media"><div class="scene">${sceneSVG(spot.scene)}</div></div>`;
  return `
    <div class="spot-modal-backdrop" data-modal-close></div>
    <section class="spot-modal-panel" role="dialog" aria-modal="true" aria-labelledby="spot-modal-title" tabindex="-1">
      <button type="button" class="spot-modal-close" data-modal-close aria-label="Close">×</button>
      <div class="spot-modal-head">
        <span class="spot-modal-icon">${spot.icon}</span>
        <div class="spot-modal-titleblock">
          <p class="spot-modal-area">${L.area}</p>
          <h2 id="spot-modal-title">${L.name}</h2>
          <div class="tl-meta">${seatBadge(spot)}${catBadge(spot)}${confBadge(spot)}</div>
        </div>
        ${mapLinkHTML(spot, "spot-modal-map")}
      </div>
      <p class="spot-modal-hook">${L.hook}</p>
      ${heroMedia}
      <p class="spot-modal-story">${L.story}</p>
      ${photoGalleryHTML(spot)}
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
  renderStampboard();
  renderGallery();
  renderShowcase();
  renderBoardSelect();
  const tl = $("#timelineSection");
  if (tl && !tl.hidden) renderTimeline();
  const tr = $("#trainResults");
  if (tr && !tr.hidden) showTrainResults();
}

/* ---------- showcase（まず何が見えるかを見せる） ---------- */
function renderShowcase() {
  const rail = $("#showcaseRail");
  if (!rail) return;
  const picks = ["fuji", "toji", "hamanako", "ibuki", "sawayama-castle", "hikone-castle", "kannonji-castle", "omi-fuji", "putiputi-sign", "mikawa-oshima", "odawara", "odawara-castle", "kiyosu", "hinataoka", "left-fuji", "kakegawa", "solar-ark"];
  rail.innerHTML = picks.map((id) => {
    const sp = SPOTS.find((s) => s.id === id);
    if (!sp) return "";
    const L = sp[lang];
    const media = sp.image
      ? `<img loading="lazy" src="${sp.image}" alt="${L.name}">`
      : sceneSVG(sp.scene);
    return `<button type="button" class="show-card" data-show-spot="${sp.id}" aria-label="${t("more")}: ${L.name}">
      <div class="show-media">${media}</div>
      <span class="show-caption"><strong>${sp.icon} ${L.name}</strong>${showCreditHTML(sp)}<span>${L.hook}</span><em>${t("more")}</em></span>
    </button>`;
  }).join("");
  rail.querySelectorAll("[data-show-spot]").forEach((card) => {
    card.addEventListener("click", () => openSpotModal(card.dataset.showSpot, "showcase"));
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
  const destSt = STATION[tr.destination];
  const dest = destSt ? destSt[lang] : tr.destination;
  return `${name}${tr.number}`;
}

function showTrainResults() {
  const depMin = $("#departTime").value ? toMin($("#departTime").value) : nowMin();
  const found = findTrains(depMin);
  const box = $("#trainResults");
  box.hidden = false;
  if (!found.length) {
    box.innerHTML = `<p class="train-none">${t("trainNone")}</p>`;
    return;
  }
  box.innerHTML = `<p class="train-pick-note">${t("trainPickNote")}</p>` + found.map(({ tr, dep }, i) => {
    const destSt = STATION[tr.destination];
    const dest = destSt ? destSt[lang] : tr.destination;
    return `<button type="button" class="train-chip" data-train="${i}">
      <strong>${trainLabel(tr)}</strong>
      <span>${minToClock(dep)} ${t("dep")} → ${dest}</span>
    </button>`;
  }).join("");
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
function buildTimeline(train = null, depMin = null) {
  if (depMin == null) depMin = $("#departTime").value ? toMin($("#departTime").value) : nowMin();
  journey = computeJourney(train, depMin);
  track("timeline_built", {
    mode: train ? "train" : "estimate",
    direction,
    board_station: boardId,
    spot_count: journey.spots.length,
  });
  $("#timelineSection").hidden = false;
  renderTimeline();
  startLive();
  $("#timelineSection").scrollIntoView({ behavior: "smooth" });
}

function renderTimeline() {
  if (!journey) return;
  const base = t(direction === "west" ? "tlTitleWest" : "tlTitleEast");
  const tag = journey.mode === "train"
    ? `${trainLabel(journey.train)} · ${t("trainTag")}`
    : t("estimateTag");
  $("#tlTitle").textContent = `${base} — ${tag}`;
  const items = [];
  journey.stops.forEach((s) => items.push({ kind: "station", clock: s.clock, st: s }));
  journey.spots.forEach((x) => items.push({ kind: "spot", clock: x.clock, sp: x.sp }));
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

function spotItemHTML(sp, clock) {
  const L = sp[lang];
  const time = clock == null ? `<span class="tl-time-big">✦</span>` : `<span class="tl-time-big">${minToClock(clock)}</span>`;
  const opp = seat !== "both" && sp.side && sp.side !== seat ? `<span class="badge badge-check">${t("oppositeSide")}</span>` : "";
  const stamped = stamps[sp.id];
  const thumb = sp.image
    ? `<button type="button" class="tl-thumb" data-more aria-label="${t("more")}: ${L.name}"><img loading="lazy" src="${sp.image}" alt=""></button>`
    : "";
  return `
  <li class="tl-item" data-spot="${sp.id}">
    <div class="tl-card">
      <div class="tl-card-main">
        <div class="tl-copy">
          <div class="tl-top">${time}<span class="tl-icon">${sp.icon}</span><span class="tl-name">${L.name}</span></div>
          <div class="tl-meta">${seatBadge(sp)}${catBadge(sp)}${confBadge(sp)}${opp}${clock == null ? `<span class="badge badge-lucky">${t("anytime")}</span>` : ""}</div>
          <p class="tl-hook">${L.hook}</p>
          <div class="tl-actions">
            <button type="button" class="spot-btn${stamped ? " stamped" : ""}" data-stamp="${sp.id}">${stamped ? t("spotBtnDone") : t("spotBtn")}</button>
            <button type="button" class="more-btn" data-more>${t("more")}</button>
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
function openSpotModal(spotId, source = "unknown") {
  const spot = findSpotById(spotId);
  if (!spot) return;
  closeSpotModal("replace");
  const modal = document.createElement("div");
  modal.className = "spot-modal";
  modal.innerHTML = spotDetailModalHTML(spot);
  document.body.appendChild(modal);
  document.body.classList.add("modal-open");
  activeSpotModal = { element: modal, spotId, source };
  track("spot_detail_open", { spot_id: spotId, source });
  track(spotEventName("spot_open", spotId), { spot_id: spotId, source });
  modal.querySelector(".spot-modal-panel")?.focus();
  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", () => closeSpotModal("button"));
  });
  modal.querySelectorAll("[data-map]").forEach((link) => {
    link.addEventListener("click", () => track("map_opened", { spot_id: link.dataset.map, source: "spot_modal" }));
  });
}
function closeSpotModal(reason = "close") {
  if (!activeSpotModal) return;
  const { element, spotId, source } = activeSpotModal;
  element.remove();
  document.body.classList.remove("modal-open");
  activeSpotModal = null;
  if (reason !== "replace") track("spot_detail_close", { spot_id: spotId, source, reason });
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
    btn.addEventListener("click", () => toggleStamp(btn.dataset.stamp));
  });
  root.querySelectorAll("[data-more]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".tl-item, .gal-card");
      const source = item?.classList.contains("gal-card") ? "gallery" : "timeline";
      openSpotModal(item?.dataset.spot, source);
    });
  });
  root.querySelectorAll("[data-map]").forEach((link) => {
    link.addEventListener("click", () => track("map_opened", { spot_id: link.dataset.map }));
  });
}

/* ---------- live next-up ---------- */
function startLive() {
  clearInterval(liveTimer);
  updateLive();
  liveTimer = setInterval(updateLive, 20000);
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

/* ---------- stamps ---------- */
function toggleStamp(id) {
  const removed = !!stamps[id];
  if (removed) delete stamps[id];
  else stamps[id] = Date.now();
  track(removed ? "stamp_removed" : "stamp_added", { spot_id: id });
  localStorage.setItem("mado-stamps", JSON.stringify(stamps));
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

/* ---------- memory card ---------- */
function drawMemoryCard() {
  const got = SPOTS.filter((sp) => stamps[sp.id]);
  if (!got.length) { alert(t("emptyCard")); return; }
  track("memory_card_created", { stamp_count: got.length, spot_total: SPOTS.length });
  const cv = $("#memCanvas"), ctx = cv.getContext("2d");
  const Wc = cv.width, Hc = cv.height;
  // 背景: 夕暮れグラデーション
  const g = ctx.createLinearGradient(0, 0, 0, Hc);
  g.addColorStop(0, "#101c2c"); g.addColorStop(0.5, "#27405e");
  g.addColorStop(0.78, "#b96a4e"); g.addColorStop(1, "#e8a06a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, Wc, Hc);
  // 富士山シルエット
  ctx.fillStyle = "rgba(125,155,192,0.55)";
  ctx.beginPath();
  ctx.moveTo(120, Hc - 240); ctx.lineTo(Wc / 2 - 40, Hc - 560); ctx.lineTo(Wc / 2 + 5, Hc - 510);
  ctx.lineTo(Wc / 2 + 50, Hc - 555); ctx.lineTo(Wc - 110, Hc - 240); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(243,246,250,0.9)";
  ctx.beginPath();
  ctx.moveTo(Wc / 2 - 78, Hc - 522); ctx.lineTo(Wc / 2 - 40, Hc - 560); ctx.lineTo(Wc / 2 + 5, Hc - 510);
  ctx.lineTo(Wc / 2 + 50, Hc - 555); ctx.lineTo(Wc / 2 + 80, Hc - 524); ctx.lineTo(Wc / 2 + 62, Hc - 482);
  ctx.quadraticCurveTo(Wc / 2 + 20, Hc - 505, Wc / 2 - 10, Hc - 480);
  ctx.quadraticCurveTo(Wc / 2 - 40, Hc - 502, Wc / 2 - 64, Hc - 486); ctx.closePath(); ctx.fill();
  // 地面
  ctx.fillStyle = "#16263a"; ctx.fillRect(0, Hc - 220, Wc, 220);
  // タイトル
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.font = "700 30px Georgia, 'Hiragino Mincho ProN', serif";
  ctx.fillText(t("brandName"), Wc / 2, 96);
  ctx.font = "700 56px Georgia, 'Hiragino Mincho ProN', serif";
  ctx.fillText(t("cardTitle"), Wc / 2, 172);
  const d = new Date();
  const dateStr = lang === "ja"
    ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  ctx.font = "26px Georgia, serif"; ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`${dateStr} · ${t(direction === "west" ? "cardRouteWest" : "cardRouteEast")}`, Wc / 2, 218);
  // スタンプ
  const cols = 3, cell = 250, startY = 320;
  got.slice(0, 9).forEach((sp, i) => {
    const cx = Wc / 2 + (i % cols - 1) * cell;
    const cy = startY + Math.floor(i / cols) * 215;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate((i % 2 ? 1 : -1) * 0.05);
    ctx.beginPath(); ctx.arc(0, 0, 86, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,247,242,0.96)"; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = "#e8704a"; ctx.stroke();
    ctx.font = "64px serif"; ctx.fillText(sp.icon, 0, 18);
    ctx.restore();
    ctx.font = "700 22px 'Hiragino Kaku Gothic ProN', sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(sp[lang].name, cx, cy + 124);
  });
  // カウント + フッター
  ctx.font = "700 34px Georgia, 'Hiragino Mincho ProN', serif";
  ctx.fillStyle = "#f5c9a8";
  ctx.fillText(t("cardCount", got.length, SPOTS.length), Wc / 2, Hc - 130);
  ctx.font = "22px Georgia, serif"; ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(t("cardFooter"), Wc / 2, Hc - 72);
  // 出力
  $("#memcardWrap").hidden = false;
  $("#dlBtn").href = cv.toDataURL("image/png");
  $("#memcardWrap").scrollIntoView({ behavior: "smooth" });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("sw.js").catch(() => {
    // The app works without offline support; stale-cache cleanup should not block the UI.
  });
}

/* ---------- gallery ---------- */
let galFilter = "all";
function renderGallery() {
  const grid = $("#galleryGrid");
  if (!grid) return;
  grid.innerHTML = SPOTS
    .filter((sp) => galFilter === "all" || sp.category === galFilter)
    .map((sp) => {
      const L = sp[lang];
      const media = sp.image
        ? spotImageHTML(sp, L.name, "gal-photo")
        : sceneSVG(sp.scene);
      return `
      <div class="gal-card" id="spot-${sp.id}" data-spot="${sp.id}">
        ${media}
        <div class="gal-body">
          <div class="gal-top"><span class="tl-icon">${sp.icon}</span><span class="gal-name">${L.name}</span></div>
          <p class="gal-area">${L.area}</p>
          <div class="tl-meta">${seatBadge(sp)}${catBadge(sp)}${confBadge(sp)}</div>
          <p class="gal-hook">${L.hook}</p>
          <div class="tl-actions">
            <button type="button" class="spot-btn${stamps[sp.id] ? " stamped" : ""}" data-stamp="${sp.id}">${stamps[sp.id] ? t("spotBtnDone") : t("spotBtn")}</button>
            <button type="button" class="more-btn" data-more>${t("more")}</button>
          </div>
        </div>
      </div>`;
    }).join("");
  bindSpotEvents(grid);
}

/* ---------- init ---------- */
function init() {
  if ($("#heroSky")) renderHero();
  $$(".lang-switch button").forEach((b) => b.addEventListener("click", () => {
    lang = b.dataset.lang; localStorage.setItem("mado-lang", lang); track("language_changed", { language: lang }); applyLang();
  }));
  // ここから先はアプリ画面（index.html）専用の初期化
  if (!$("#departTime")) { applyLang(); return; }
  // 出発時刻の初期値 = 現在
  $("#departTime").value = fmtClock(new Date());
  $("#nowBtn").addEventListener("click", () => { $("#departTime").value = fmtClock(new Date()); });
  $$("[data-dir]").forEach((b) => b.addEventListener("click", () => {
    direction = b.dataset.dir;
    boardId = direction === "west" ? "Tokyo" : "Shin-Osaka";
    renderBoardSelect();
    $("#trainResults").hidden = true;
    $$("[data-dir]").forEach((x) => x.classList.toggle("active", x === b));
  }));
  $("#boardStation").addEventListener("change", (e) => { boardId = e.target.value; $("#trainResults").hidden = true; });
  $$("[data-seat]").forEach((b) => b.addEventListener("click", () => {
    seat = b.dataset.seat;
    $$("[data-seat]").forEach((x) => x.classList.toggle("active", x === b));
    if (journey) renderTimeline();
  }));
  $("#findTrainsBtn").addEventListener("click", () => {
    track("train_search", { direction, board_station: boardId });
    showTrainResults();
  });
  $("#quickPreviewBtn")?.addEventListener("click", () => openQuickModal("hero"));
  $("#buildBtn").addEventListener("click", () => buildTimeline(null));
  $("#filterbar")?.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("button[data-filter]");
    if (!button) return;
    galFilter = button.dataset.filter;
    $$("#filterbar button").forEach((b) => b.classList.toggle("active", b === button));
    track("gallery_filtered", { filter: galFilter });
    renderGallery();
  });
  $("#cardBtn").addEventListener("click", drawMemoryCard);
  $("#resetBtn").addEventListener("click", () => {
    if (confirm(t("confirmReset"))) {
      stamps = {}; localStorage.setItem("mado-stamps", "{}");
      renderStampboard(); renderGallery();
      const tl = $("#timelineSection");
      if (tl && !tl.hidden) renderTimeline();
      $("#memcardWrap").hidden = true;
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSpotModal("escape");
      closeQuickModal("escape");
    }
  });
  applyLang();
  const params = new URLSearchParams(location.search);
  if (params.get("intro") === "1" || location.hash === "#quick-intro") {
    openQuickModal("url");
  }
  registerServiceWorker();
}
document.addEventListener("DOMContentLoaded", init);
