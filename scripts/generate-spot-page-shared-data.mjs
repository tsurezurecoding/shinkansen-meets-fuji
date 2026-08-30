import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { thumbnailSrc, miniMapViewpoint, mercatorPoint, miniMapZoomForViewpoint } from "./shared/geo.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const dataPath = path.join(appDir, "data.js");
const outputPath = path.join(appDir, "spot-page-shared-data.js");
const CHECK_ONLY = process.argv.includes("--check");
// Presentation is intentionally off for now. Re-enable this flag together with
// the explicit global CSS kill switch in style.css when affiliate modules return.
const AFFILIATE_PRESENTATION_ENABLED = false;
const SHOWCASE_SPOT_IDS = [
  "fuji",
  "hamanako",
  "odawara",
  "toji",
  "nagoya-station-skyline",
  "kirin-beer-factory",
  "kiyosu",
  "solar-ark",
  "727-board",
];
const dataContext = {};
const dataCode = fs.readFileSync(dataPath, "utf8");

vm.runInNewContext(`${dataCode}\nglobalThis.__SPOT_PAGE_SHARED_SOURCE = { SPOTS, ROUTE, BOARD_COLLECTION };`, dataContext, { filename: dataPath });

const source = dataContext.__SPOT_PAGE_SHARED_SOURCE;
if (!source || !Array.isArray(source.SPOTS) || !source.ROUTE || !Array.isArray(source.ROUTE.refStations)) {
  throw new Error("Could not read SPOTS and ROUTE.refStations from data.js");
}

const trackContext = { window: { ROUTE: source.ROUTE }, ROUTE: source.ROUTE };
vm.runInNewContext(fs.readFileSync(path.join(appDir, "track.js"), "utf8"), trackContext, { filename: path.join(appDir, "track.js") });
const TRACK = trackContext.window.MADO_TRACK;
const SITE_ROOT = "https://www.michikusa-travel.com";
const GOOGLE_MAPS_EMBED_API_KEY = "AIzaSyDE3UdN_9m9cK5sLTlfuc7KElsfceYNwrs";
const INLINE_PHOTO_CATEGORIES = new Set(["classic", "notable"]);
const CURATED_ANGLE_PHOTOS = { hamanako: ["hamanako_torii_letus10"] };
const FUJI_FAMILY = new Set(["fuji", "ota-fuji", "sagami-fuji", "left-fuji", "hamanako-fuji"]);
const UI = {
  ja: {
    sectionHow: (name) => `${name}の見つけ方`, sectionPhotos: (name) => `写真で見る${name}`, sectionRefs: "参考リンク", sectionRelated: "近くの車窓も見る",
    facts: ["見える区間", "座席側", "タイミング", "写真"], photoUnit: "枚",
    routeNote: (area, side) => `東京から新大阪方面へ向かう場合は、${area || "この区間"}が近づいたら${side}の窓を少し早めに見てください。新大阪から東京方面へ向かう場合は、通過順が逆になります。`,
    sideA: "A席・海側", sideE: "E席・山側", sideBoth: "左右両側", hamanakoSide: "A席・海側 / E席・山側",
    minutes: (m) => Number.isFinite(Number(m)) ? `東京発のぞみ基準で約${Math.round(m)}分後` : "通過時刻は列車により変わります", relatedCategory: "関連", fallbackCredit: "新幹線の窓",
    photoAlt: (name) => `${name}の新幹線車窓写真`, photoFallback: (name, index) => `${name}の車窓写真 ${index + 1}`,
  },
  en: {
    sectionHow: (name) => `How to find ${name}`, sectionPhotos: (name) => `${name} in photos`, sectionRefs: "References", sectionRelated: "Nearby window views",
    facts: ["Section", "Seat side", "Timing", "Photos"], photoUnit: "photos",
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
    sideA: "Seat A · left side toward Kyoto", sideE: "Seat E · right side toward Kyoto", sideBoth: "Both sides", hamanakoSide: "Seat A · left / Seat E · right (toward Kyoto)",
    minutes: (m) => Number.isFinite(Number(m)) ? `About ${Math.round(m)} minutes after leaving Tokyo on a Nozomi train` : "Timing varies by train", relatedCategory: "Related", fallbackCredit: "Shinkansen Window",
    photoAlt: (name) => `${name} from the Shinkansen window`, photoFallback: (name, index) => `${name} window photo ${index + 1}`,
  },
};

const SIDE_LABELS = {
  ja: { A: "A席・海側", E: "E席・山側", both: "左右両側", hamanako: "A席・海側 / E席・山側" },
  en: { A: "Seat A · left side toward Kyoto", E: "Seat E · right side toward Kyoto", both: "Both sides", hamanako: "Seat A · left / Seat E · right (toward Kyoto)" },
};

function localized(value, lang) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[lang] || value.ja || value.en || "";
}

function sideLabel(spot, lang) {
  if (spot.id === "hamanako") return SIDE_LABELS[lang].hamanako;
  return localized(spot.sideLabel, lang) || SIDE_LABELS[lang][spot.side] || SIDE_LABELS[lang].both;
}

function seats(spot) {
  const japaneseSide = sideLabel(spot, "ja");
  if (japaneseSide.includes("A席") && japaneseSide.includes("E席")) return ["A", "E"];
  if (spot.side === "A" || spot.side === "E") return [spot.side];
  throw new Error(`Spot ${spot.id} has no canonical A/E seat`);
}

function creditText(value, lang) {
  return localized(value, lang);
}

function safeAssetPath(value) {
  return typeof value === "string" && value.startsWith("images/") && !value.includes("..") && !value.includes("\\") && !/[?#]/.test(value);
}

function safeId(value) {
  return typeof value === "string" && /^[a-z0-9-]+$/.test(value);
}

function safeHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\/[^\s<>"']+$/i.test(value);
}

function jaAreaPhrase(area) {
  if (!area) return "この区間";
  return /付近|前後|あたり|区間/.test(area) ? area : `${area}付近`;
}

function enApproachArea(area) {
  if (!area) return "this section";
  return area.replace(/^(Around|Just before|Just after)\s+/i, "");
}

function sceneGuideText(spot, lang, name) {
  const scene = spot.scene || "";
  if (lang === "ja") {
    if (spot.category === "curious") return `${name}は、富士山や大きな城のような主役級ではなく、知っている人だけが拾えるタイプの車窓です。見つけること自体が楽しいので、旅慣れた人ほど小さな発見として効いてきます。`;
    if (scene === "fuji" || scene === "leftfuji") return "富士山は区間によって大きさ、角度、手前の街並みが変わります。同じ富士山でも、どこで見るかで印象が変わるのが東海道新幹線らしい面白さです。";
    if (scene === "bay" || scene === "lake") return "水辺の車窓は、建物が詰まった区間から急に視界が開けるのが魅力です。晴天だけでなく、夕方や曇天でも水面の明るさで景色の変化に気づけます。";
    if (scene === "castle" || scene === "pagoda") return "歴史ある建物は、街の中に一瞬だけ差し込む目印として現れます。大きく眺めるというより、線路と街との距離感を味わうスポットです。";
    if (scene === "solar") return "工場や看板の車窓は、観光名所とは違う東海道らしさがあります。移動中にしか気づきにくい沿線のランドマークとして見ると面白いタイプです。";
    if (scene === "mountain" || scene === "hills") return "山や丘の車窓は、遠景の輪郭と手前の街並みが重なって見えます。季節や天候で印象が変わりやすく、同じ列車でも毎回少し違って見えるスポットです。";
    return "この車窓は、駅間の短い時間をただの移動ではなく観察の時間に変えてくれます。座席側とタイミングを知っているだけで、景色の拾い方が大きく変わります。";
  }
  if (spot.category === "curious") return "This is not a headline landmark like Mt. Fuji or a major castle. It is the kind of small window view that feels rewarding precisely because you know where to look.";
  if (scene === "fuji" || scene === "leftfuji") return "Mt. Fuji changes by section: size, angle, foreground, and distance all shift along the Tokaido Shinkansen. That variety is part of the fun.";
  if (scene === "bay" || scene === "lake") return "Water views are satisfying because the scenery suddenly opens up after dense urban sections. The surface can make the change noticeable even on cloudy days.";
  if (scene === "castle" || scene === "pagoda") return "Historic buildings appear as brief markers inside the cityscape. The pleasure is less about a long panorama and more about catching the train's relationship with the town.";
  if (scene === "solar") return "Factories and signs are a different kind of Tokaido landmark: not classic sightseeing, but very much part of the view from the line.";
  if (scene === "mountain" || scene === "hills") return "Hills and mountains layer the distant outline with the towns in front of them. Weather and season change the impression from ride to ride.";
  return "This view turns a short stretch between stations into something to watch. Knowing the seat side and timing changes how much of the journey you notice.";
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

function projectPhoto(item, spot, lang, index = 0) {
  const data = spot[lang] || spot.ja || {};
  const alt = localized(item.alt, lang) || (index === 0 ? UI[lang].photoAlt(data.name) : UI[lang].photoFallback(data.name, index));
  const credit = creditText(item.credit, lang) || creditText(spot.photoCredit, lang) || UI[lang].fallbackCredit;
  return {
    src: String(item.src || ""),
    thumb: thumbnailSrc(item.src),
    alt,
    note: localized(item.note, lang),
    credit,
    sourceUrl: item.sourceUrl || item.url || "",
    date: typeof item.date === "string" ? item.date : "",
    heading: localized(item.heading, lang),
    intro: localized(item.intro, lang),
    caption: localized(item.caption, lang),
  };
}

function ownPhotoItems(spot) {
  const data = spot.ja || {};
  const main = spot.image
    ? [{
        src: spot.image,
        alt: { ja: `${data.name}の新幹線車窓写真`, en: `${spot.en?.name || data.name} from the Shinkansen window` },
        credit: spot.photoCredit,
        sourceUrl: spot.photoCredit?.url,
        date: spot.photoCredit?.date,
        note: spot.photoCredit?.note,
      }]
    : [];
  const seen = new Set();
  return [...main, ...(spot.photos || []).filter((item) => item.role !== "reference")]
    .filter((item) => item?.src && !seen.has(item.src) && seen.add(item.src));
}

// このページに間借りしている景色を、従属側の guidePageId から引く。
// 以前はホスト側にも sharedGuideSpotIds / pagePhotoSpotIds を手書きしていたため、
// 片側だけ更新すると静かに壊れた。関係は従属側の1箇所だけが持つ。
// BOARD_COLLECTION の 727 地点も guidePageId を持つが、あちらは SPOTS の外なので混ざらない。
function spotsSharingPageWith(spot) {
  return source.SPOTS.filter((item) => item.guidePageId === spot.id && item.id !== spot.id);
}

function photoItems(spot) {
  const items = [...ownPhotoItems(spot)];
  for (const linked of spotsSharingPageWith(spot)) {
    items.push(...ownPhotoItems(linked));
  }
  const seen = new Set();
  return items.filter((item) => {
    if (!item.src || seen.has(item.src) || item.illustration) return false;
    seen.add(item.src);
    return true;
  });
}

function inlinePhotoIndices(spot) {
  if (!INLINE_PHOTO_CATEGORIES.has(spot.category)) return [];
  const photos = spot.photos || [];
  const picks = new Set();
  for (const needle of CURATED_ANGLE_PHOTOS[spot.id] || []) {
    const index = photos.findIndex((photo) => String(photo?.src || "").includes(needle));
    if (index >= 0) picks.add(index);
  }
  return [...picks].slice(0, 2);
}

function referenceUrl(ref, lang) {
  return localized(ref?.url, lang) || localized(ref?.url, "ja") || ref?.url || "";
}

function projectBodyLinks(spot, lang) {
  const sourceLinks = [...(spot.bodyLinks || []), ...(spot.references || [])];
  const seen = new Set();
  const links = [];
  for (const item of sourceLinks) {
    const ref = item.ref || item;
    const href = item.url ? (localized(item.url, lang) || localized(item.url, "ja")) : referenceUrl(ref, lang);
    const label = localized(item.label, lang) || localized(ref.label, lang);
    if (!href || !label || seen.has(href)) continue;
    seen.add(href);
    links.push({ label, href });
  }
  return links;
}

function projectReferences(spot, lang) {
  return (spot.references || []).map((ref) => ({ label: localized(ref?.label, lang), href: referenceUrl(ref, lang) })).filter((item) => item.label && item.href);
}

function projectExplainer(spot, lang) {
  if (!spot.explainer) return null;
  const paragraphs = spot.explainer[lang] || spot.explainer.ja || [];
  if (!paragraphs.length) return null;
  const figure = spot.explainerFigure;
  return {
    heading: localized(spot.explainer.heading, lang),
    paragraphs,
    figure: figure?.src ? {
      src: figure.src,
      thumb: thumbnailSrc(figure.src),
      alt: localized(figure.alt, lang),
      caption: localized(figure.caption, lang),
      credit: creditText(figure.credit, lang),
      sourceUrl: figure.sourceUrl || "",
      date: figure.date || "",
      afterParagraph: Number.isInteger(figure.afterParagraph) ? figure.afterParagraph : 0,
    } : null,
  };
}

function projectArticleImage(spot, lang) {
  const image = spot.articleImage || (spot.photos || []).find((item) => item.role === "reference");
  if (!image?.src) return null;
  return {
    src: image.src,
    thumb: thumbnailSrc(image.src),
    alt: localized(image.alt, lang),
    heading: localized(image.heading, lang),
    intro: localized(image.intro, lang),
    caption: localized(image.caption, lang),
    credit: creditText(image.credit, lang),
    sourceUrl: image.sourceUrl || "",
    date: image.date || "",
  };
}

function routeNote(spot, lang, data) {
  return localized(spot.routeNote, lang) || UI[lang].routeNote(data.area, sideLabel(spot, lang));
}

function mapEmbedUrl(spot, lang, viewpoint) {
  if (!spot.map || typeof spot.map.lat !== "number" || typeof spot.map.lng !== "number") return "";
  const distanceKm = viewpoint && TRACK ? TRACK.haversineKm(viewpoint.lat, viewpoint.lng, spot.map.lat, spot.map.lng) : NaN;
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY,
    q: `${spot.map.lat},${spot.map.lng}`,
    center: `${spot.map.lat},${spot.map.lng}`,
    zoom: String(miniMapZoomForViewpoint(spot, viewpoint, distanceKm)),
    maptype: "satellite",
    language: lang === "ja" ? "ja" : "en",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function mapViewpointUrl(spot, lang, viewpoint) {
  if (!viewpoint || !spot.map || typeof spot.map.lat !== "number" || typeof spot.map.lng !== "number") return "";
  const distanceKm = TRACK ? TRACK.haversineKm(viewpoint.lat, viewpoint.lng, spot.map.lat, spot.map.lng) : NaN;
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY,
    q: `${viewpoint.lat},${viewpoint.lng}`,
    center: `${spot.map.lat},${spot.map.lng}`,
    zoom: String(miniMapZoomForViewpoint(spot, viewpoint, distanceKm)),
    maptype: "satellite",
    language: lang === "ja" ? "ja" : "en",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function projectMap(spot, lang) {
  const hasCoordinates = !!(spot.map && typeof spot.map.lat === "number" && typeof spot.map.lng === "number" && typeof spot.minutesFromTokyo === "number");
  const viewpoint = hasCoordinates ? miniMapViewpoint(spot, TRACK) : null;
  const data = spot[lang] || spot.ja || {};
  const externalUrl = spot.map && typeof spot.map.lat === "number" && typeof spot.map.lng === "number"
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.map.lat},${spot.map.lng}`)}`
    : "";
  return {
    hasCoordinates,
    lat: hasCoordinates ? spot.map.lat : null,
    lng: hasCoordinates ? spot.map.lng : null,
    name: localized(spot.map, lang) || data.name || spot.id,
    externalUrl,
    embedUrl: hasCoordinates ? mapEmbedUrl(spot, lang, viewpoint) : "",
    viewpointUrl: hasCoordinates ? mapViewpointUrl(spot, lang, viewpoint) : "",
    viewpoint: viewpoint ? { lat: viewpoint.lat, lng: viewpoint.lng } : null,
  };
}

function projectSharedGuide(spot, lang) {
  return spotsSharingPageWith(spot).map((chapter) => {
    const data = chapter[lang] || chapter.ja || {};
    const paragraphs = localized(chapter.sharedGuideStory, lang);
    return {
      id: chapter.guideAnchor || chapter.id,
      heading: localized(chapter.sharedGuideHeading, lang) || data.name,
      hook: data.hook || "",
      paragraphs: Array.isArray(paragraphs) && paragraphs.length ? paragraphs : [data.story || ""],
    };
  });
}

// 案内文はスポットの guideNotice が持つ。以前はここに浜名湖の文言が直書きされていて、
// 2件目のページ共有スポットを作ると誰にでも浜名湖の案内が出る状態だった。
function projectGuideNotice(spot, lang) {
  if (!spot.guidePageId || spot.guidePageId === spot.id) return null;
  const notice = spot.guideNotice;
  if (!notice) throw new Error(`guideNotice missing for shared-page spot: ${spot.id}`);
  return {
    heading: localized(notice.heading, lang),
    body: localized(notice.body, lang),
    href: `${spot.guidePageId}.html${spot.guideAnchor ? `#${spot.guideAnchor}` : ""}`,
    label: localized(notice.label, lang),
  };
}

function spotGuideHref(spot) {
  return `${spot.guidePageId || spot.id}.html${spot.guideAnchor ? `#${spot.guideAnchor}` : ""}`;
}

function projectRelated(spot, lang) {
  const routeSpots = [...source.SPOTS].sort((a, b) => Number(a.minutesFromTokyo || 0) - Number(b.minutesFromTokyo || 0));
  const explicitIds = new Set(spot.relatedSpotIds || []);
  const unique = [];
  for (const id of explicitIds) {
    const item = routeSpots.find((entry) => entry.id === id);
    if (item) unique.push({ label: UI[lang].relatedCategory, spot: item });
  }
  const scored = routeSpots.filter((item) => item.id !== spot.id && !explicitIds.has(item.id)).map((item) => {
    const minutesDiff = Math.abs(Number(item.minutesFromTokyo || 0) - Number(spot.minutesFromTokyo || 0));
    const score = (item.category === spot.category ? 12 : 0) + (item.side === spot.side ? 3 : 0) + Math.max(0, 8 - minutesDiff / 6);
    const label = item.category === spot.category ? UI[lang].relatedCategory : (lang === "ja" ? "近い時間" : "Nearby");
    return { label, spot: item, score };
  }).sort((a, b) => b.score - a.score);
  for (const item of scored) {
    if (unique.length >= 3) break;
    if (!unique.some((entry) => entry.spot.id === item.spot.id)) unique.push(item);
  }
  return unique.slice(0, 3).map(({ label, spot: item }) => {
    const data = item[lang] || item.ja || {};
    return { id: item.id, href: spotGuideHref(item), thumb: thumbnailSrc(item.image || item.photos?.[0]?.src || "images/og-shinkansen-window.png"), label, name: data.name || item.id, hook: data.hook || data.area || "" };
  });
}

function projectFujiGuide(spot, lang) {
  if (!FUJI_FAMILY.has(spot.id)) return null;
  const text = spot.id === "fuji"
    ? (lang === "ja"
      ? "このページは三島〜新富士の写真と景色に集中しています。座席の取り方、東京・京都・新大阪からの時刻、曇りの日、左富士は、富士山FAQ・乗車前ガイドで確認できます。"
      : "This page focuses on the photographs and scenery between Mishima and Shin-Fuji. For seat booking, timing from Tokyo, Kyoto or Osaka, cloudy-day advice, and Left Fuji, see the Mt. Fuji FAQ and pre-trip guide.")
    : (lang === "ja"
      ? "富士山が見える座席側や、東京・京都・新大阪からの時刻、曇りの日の見え方、他の富士山ビュースポットとの違いは、富士山FAQ・乗車前ガイドにまとめています。"
      : "Seat side for Mt. Fuji, timing from Tokyo / Kyoto / Osaka, cloudy-day advice, and how this view compares with the other Fuji viewpoints are gathered in the Mt. Fuji FAQ and pre-trip guide.");
  return { text, href: "../guide.html", label: lang === "ja" ? "富士山FAQ・乗車前ガイド" : "Mt. Fuji FAQ and pre-trip guide" };
}

function projectMedia(spot, lang) {
  if (!spot.media || !Array.isArray(spot.media.videos) || !spot.media.videos.length) return null;
  return {
    heading: localized(spot.media.heading, lang) || (lang === "ja" ? `動画で見る${spot[lang]?.name || spot.ja?.name || spot.id}` : `${spot[lang]?.name || spot.en?.name || spot.id} in motion`),
    description: localized(spot.media.description, lang),
    videos: spot.media.videos.map((video) => ({
      kind: String(video.kind || ""),
      orientation: video.orientation === "portrait" ? "portrait" : "",
      url: String(video.url || ""),
      mediaUrl: String(video.mediaUrl || ""),
      handle: String(video.handle || ""),
      accountName: localized(video.accountName, lang),
      accessibleTitle: localized(video.accessibleTitle, lang),
      fallbackText: localized(video.fallbackText, lang),
      comment: localized(video.comment, lang),
      date: String(video.date || ""),
      id: String(video.id || ""),
      title: localized(video.title, lang),
    })),
    platformNote: localized(spot.media.platformNote, lang) || (lang === "ja" ? "動画はX・YouTubeの公式埋め込みを利用しています。" : "These videos use official X and YouTube embeds."),
  };
}

function projectPage(spot, lang) {
  const data = spot[lang] || spot.ja || {};
  const allPhotos = photoItems(spot);
  const inlineIndices = inlinePhotoIndices(spot);
  const inlineSrcs = new Set(inlineIndices.map((index) => spot.photos?.[index]?.src).filter(Boolean));
  const projectedPhotos = allPhotos.map((item, index) => projectPhoto(item, spot, lang, index));
  const gallery = projectedPhotos.filter((item) => spot.id === "ibuki" && lang === "ja" ? true : !inlineSrcs.has(item.src));
  const inline = inlineIndices.map((index) => spot.photos?.[index]).filter(Boolean).map((item, index) => projectPhoto(item, spot, lang, index));
  const headingChunks = localized(spot.pageHeadingChunks, lang);
  const pageHeading = localized(spot.pageHeading, lang) || (lang === "ja" ? `${data.name}はいつ見える？座席側は？` : `When can you see ${data.name} from the Shinkansen?`);
  const explainer = projectExplainer(spot, lang);
  const map = projectMap(spot, lang);
  const guideHighlight = localized(spot.guideHighlight, lang) || sceneGuideText(spot, lang, data.name);
  return {
    id: String(spot.id),
    lang,
    name: String(data.name || spot.id),
    area: String(data.area || ""),
    hook: String(data.hook || ""),
    headingChunks: Array.isArray(headingChunks) ? headingChunks.map(String) : [],
    heading: pageHeading,
    sectionHeading: localized(spot.sectionHeading, lang) || UI[lang].sectionHow(data.name),
    story: localized(spot.pageStory, lang) || data.story || "",
    minutes: Number(spot.minutesFromTokyo),
    side: String(spot.side || ""),
    sideLabel: sideLabel(spot, lang),
    // 見やすさ。未評価は載せない（推測値と実車観察を混ぜないため）。
    spotting: spot.spotting || null,
    facts: { labels: UI[lang].facts, timing: UI[lang].minutes(spot.minutesFromTokyo), photoUnit: UI[lang].photoUnit },
    photos: projectedPhotos,
    hero: projectedPhotos[0] || null,
    gallery,
    photoHeading: localized(spot.photoSectionHeading, lang) || UI[lang].sectionPhotos(data.name),
    photoHeadingCustom: Boolean(spot.photoSectionHeading),
    inline,
    photoTip: spot.photoTip ? { heading: localized(spot.photoTip.heading, lang), paragraphs: spot.photoTip[lang] || spot.photoTip.ja || [] } : null,
    bodyLinks: projectBodyLinks(spot, lang),
    routeNote: routeNote(spot, lang, data),
    fujiGuide: projectFujiGuide(spot, lang),
    explainer,
    referenceImage: projectArticleImage(spot, lang),
    sharedGuide: projectSharedGuide(spot, lang),
    guideNotice: projectGuideNotice(spot, lang),
    map,
    guide: {
      title: lang === "ja" ? `${data.name}を見逃さないコツ` : `How to catch ${data.name}`,
      intro: lang === "ja"
        ? `${data.area || "この区間"}が近づいたら、${sideLabel(spot, lang)}の窓を先に意識してください。現在地から追う場合はライブガイド、事前に確認する場合はこのページの地図が役立ちます。`
        : `As you approach ${enApproachArea(data.area)}, start watching from ${sideLabel(spot, lang)}. Use Live Guide while riding, or the map on this page before you board.`,
      duration: durationGuideText(spot, lang),
      timingLead: lang === "ja" ? "乗る列車が決まっているなら、列車選択で実際のダイヤに合わせた見える時刻を調べられます。" : "Know your train? Select it to see this view's estimated time on the actual timetable.",
      cta: lang === "ja" ? "列車を選んで、見える時刻を調べる" : "Select my train and check the time",
      href: lang === "ja" ? "../start.html#journey" : "../../en/start.html#journey",
      highlight: guideHighlight,
    },
    references: projectReferences(spot, lang),
    related: projectRelated(spot, lang),
    media: projectMedia(spot, lang),
    showcase: spot.id === "ibuki" && lang === "ja",
    stamp: { src: `images/stamps/stamp_${spot.id}.svg`, label: lang === "ja" ? "車窓スタンプ" : "Window stamp", alt: lang === "ja" ? `${data.name}の車窓スタンプ` : `${data.name} window stamp` },
  };
}

const stations = source.ROUTE.refStations.map((station) => ({
  id: String(station.id),
  name: { ja: String(station.ja || station.en || station.id), en: String(station.en || station.ja || station.id) },
  minutes: Number(station.min),
  major: !!station.major,
}));

const spots = source.SPOTS.map((spot) => ({
  id: String(spot.id),
  name: { ja: String(spot.ja?.name || spot.en?.name || spot.id), en: String(spot.en?.name || spot.ja?.name || spot.id) },
  minutes: Number.isFinite(Number(spot.minutesFromTokyo)) ? Number(spot.minutesFromTokyo) : null,
  side: typeof spot.side === "string" ? spot.side : "",
  sideLabel: { ja: sideLabel(spot, "ja"), en: sideLabel(spot, "en") },
  seats: seats(spot),
  thumb: spot.image ? thumbnailSrc(spot.image) : "",
}));

const pages = {};
for (const spot of source.SPOTS) {
  pages[spot.id] = {};
  for (const lang of ["ja", "en"]) pages[spot.id][lang] = projectPage(spot, lang);
}

const showcase = SHOWCASE_SPOT_IDS.map((id) => {
  const spot = source.SPOTS.find((item) => item.id === id);
  if (!spot || !spot.image || !spot.ja?.hook || !spot.en?.hook) throw new Error(`Showcase spot ${id} is missing image or localized hook data`);
  const credit = spot.photoCredit || {};
  return {
    id: String(spot.id), icon: String(spot.icon || ""),
    name: { ja: String(spot.ja?.name || spot.en?.name || spot.id), en: String(spot.en?.name || spot.ja?.name || spot.id) },
    hook: { ja: String(spot.ja.hook), en: String(spot.en.hook) }, thumb: thumbnailSrc(spot.image),
    credit: { ja: String(credit.ja || credit.en || ""), en: String(credit.en || credit.ja || "") },
    creditUrl: typeof credit.url === "string" ? credit.url : "", creditDate: typeof credit.date === "string" ? credit.date : "",
  };
});

function validatePage(page, spot) {
  if (!page || page.id !== spot.id || !["ja", "en"].includes(page.lang) || !page.name || !page.hero || !Array.isArray(page.photos) || !page.photos.length || !Array.isArray(page.gallery) || !page.gallery.length || !Array.isArray(page.references)) throw new Error(`Page projection is incomplete for ${spot.id}/${page?.lang}`);
  if (!safeAssetPath(page.stamp.src) || !safeAssetPath(page.hero.src) || !safeAssetPath(page.hero.thumb)) throw new Error(`Page asset path is unsafe for ${spot.id}/${page.lang}`);
  for (const photo of [...page.photos, ...page.gallery, ...page.inline]) if (!safeAssetPath(photo.src) || !safeAssetPath(photo.thumb) || (photo.sourceUrl && !safeHttpUrl(photo.sourceUrl))) throw new Error(`Page photo is unsafe for ${spot.id}/${page.lang}`);
  for (const item of [...page.bodyLinks, ...page.references]) if (!safeHttpUrl(item.href)) throw new Error(`Page reference URL is unsafe for ${spot.id}/${page.lang}`);
  if (page.map.externalUrl && !safeHttpUrl(page.map.externalUrl)) throw new Error(`Page map URL is unsafe for ${spot.id}/${page.lang}`);
  if (page.map.embedUrl && !/^https:\/\/www\.google\.com\/maps\/embed\//.test(page.map.embedUrl)) throw new Error(`Page map embed URL is unsafe for ${spot.id}/${page.lang}`);
  if (page.map.viewpointUrl && !/^https:\/\/www\.google\.com\/maps\/embed\//.test(page.map.viewpointUrl)) throw new Error(`Page viewpoint URL is unsafe for ${spot.id}/${page.lang}`);
  if (page.referenceImage && (!safeAssetPath(page.referenceImage.src) || (page.referenceImage.sourceUrl && !safeHttpUrl(page.referenceImage.sourceUrl)))) throw new Error(`Reference image is unsafe for ${spot.id}/${page.lang}`);
  if (page.media) {
    if (!Array.isArray(page.media.videos) || !page.media.videos.length) throw new Error(`Video projection is empty for ${spot.id}/${page.lang}`);
    for (const video of page.media.videos) {
      if (video.comment && (video.comment.length > 140 || /[\r\n]/.test(video.comment))) throw new Error(`Video comment must be a single line of 140 characters or fewer for ${spot.id}`);
      if (video.kind === "x") {
        if (video.orientation && video.orientation !== "portrait") throw new Error(`Video orientation is unsupported for ${spot.id}`);
        if (!/^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+(?:\/video\/\d+)?$/.test(video.url) || (video.mediaUrl && !/^https:\/\/t\.co\/[A-Za-z0-9]+$/.test(video.mediaUrl)) || !/^@[A-Za-z0-9_]+$/.test(video.handle) || !video.accessibleTitle || !video.fallbackText) throw new Error(`X video projection is malformed for ${spot.id}`);
      } else if (video.kind === "youtube") {
        if (!/^[A-Za-z0-9_-]{11}$/.test(video.id) || !/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(video.url) || !video.title) throw new Error(`YouTube video projection is malformed for ${spot.id}`);
      } else throw new Error(`Unknown video kind for ${spot.id}`);
    }
  }
}

for (const spot of source.SPOTS) {
  if (!spot.id || !safeId(spot.id) || !spot.image || !safeAssetPath(spot.image) || !fs.existsSync(path.join(appDir, spot.image))) throw new Error(`Spot id/image is missing or unsafe: ${spot.id}`);
  if (!fs.existsSync(path.join(appDir, `images/stamps/stamp_${spot.id}.svg`))) throw new Error(`Spot stamp is missing: ${spot.id}`);
  validatePage(pages[spot.id].ja, spot);
  validatePage(pages[spot.id].en, spot);
}
if (spots.some((spot) => !spot.id || !Number.isFinite(spot.minutes))) throw new Error("Every spot in data.js must have an id and minutesFromTokyo for the shared rail");

const collection727Count = source.BOARD_COLLECTION.length;
const payload = { version: 2, affiliatesEnabled: AFFILIATE_PRESENTATION_ENABLED, collection727Count, stations, spots, showcase, pages };
const output = `/* Generated from data.js. Do not edit this artifact by hand. */\n(function (root) {\n  root.MADO_SPOT_PAGE_SHARED_DATA = ${JSON.stringify(payload)};\n}(typeof window !== "undefined" ? window : globalThis));\n`;
const currentOutput = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
const changed = currentOutput !== output;
if (!CHECK_ONLY) fs.writeFileSync(outputPath, output, "utf8");
console.log(`${CHECK_ONLY ? "Preflight" : "Generated"} shared spot page data: ${changed ? (CHECK_ONLY ? "would change" : "written") : "unchanged"} (${spots.length} spots × 2 languages, ${stations.length} stations, ${Buffer.byteLength(output, "utf8")} bytes).`);
