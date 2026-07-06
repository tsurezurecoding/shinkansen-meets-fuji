import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const dataPath = path.join(appDir, "data.js");
const trackPath = path.join(appDir, "track.js");
const outDir = path.join(appDir, "images", "maps");

const dataCode = fs.readFileSync(dataPath, "utf8");
const { SPOTS, ROUTE } = vm.runInNewContext(`${dataCode}\n;({ SPOTS, ROUTE });`, {}, { filename: dataPath });
const trackCode = fs.readFileSync(trackPath, "utf8");
const trackMatch = trackCode.match(/var TRACK_POINTS = (\[[\s\S]*?\n  \]);/);
if (!trackMatch) throw new Error("TRACK_POINTS not found in track.js");
const TRACK_POINTS = vm.runInNewContext(trackMatch[1], {}, { filename: trackPath });

const WIDTH = 720;
const HEIGHT = 360;
const PAD = 44;
const R = 6371.0088;

function toRad(d) { return (d * Math.PI) / 180; }
function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}
function withKm(points) {
  const pts = points.map((p) => ({ lat: p[0], lng: p[1], st: p[2] || null, km: 0 }));
  for (let i = 1; i < pts.length; i += 1) {
    pts[i].km = pts[i - 1].km + haversineKm(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
  }
  return pts;
}

const trackPts = withKm(TRACK_POINTS);
const totalKm = trackPts.at(-1).km;
const stationMinutes = new Map(ROUTE.refStations.map((s) => [s.id, s.min]));
const anchors = trackPts
  .filter((p) => p.st && stationMinutes.has(p.st))
  .map((p) => ({ ...p, min: stationMinutes.get(p.st) }));

function minToKm(min) {
  if (!Number.isFinite(Number(min))) return 0;
  const m = Number(min);
  if (m <= anchors[0].min) return anchors[0].km;
  if (m >= anchors.at(-1).min) return anchors.at(-1).km;
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (m >= a.min && m <= b.min) {
      const t = (m - a.min) / (b.min - a.min);
      return a.km + t * (b.km - a.km);
    }
  }
  return 0;
}

function latLngAtKm(km) {
  if (km <= 0) return { lat: trackPts[0].lat, lng: trackPts[0].lng };
  if (km >= totalKm) return { lat: trackPts.at(-1).lat, lng: trackPts.at(-1).lng };
  for (let i = 0; i < trackPts.length - 1; i += 1) {
    const a = trackPts[i];
    const b = trackPts[i + 1];
    if (km >= a.km && km <= b.km) {
      const t = (km - a.km) / (b.km - a.km);
      return { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) };
    }
  }
  return { lat: trackPts[0].lat, lng: trackPts[0].lng };
}

function sliceTrack(centerKm, radiusKm) {
  const start = Math.max(0, centerKm - radiusKm);
  const end = Math.min(totalKm, centerKm + radiusKm);
  const points = [latLngAtKm(start)];
  trackPts.forEach((p) => {
    if (p.km > start && p.km < end) points.push({ lat: p.lat, lng: p.lng });
  });
  points.push(latLngAtKm(end));
  return points;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function projectFactory(points) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  const growLat = latSpan * 0.2;
  const growLng = lngSpan * 0.2;
  minLat -= growLat;
  maxLat += growLat;
  minLng -= growLng;
  maxLng += growLng;
  return (p) => ({
    x: PAD + ((p.lng - minLng) / (maxLng - minLng)) * (WIDTH - PAD * 2),
    y: HEIGHT - PAD - ((p.lat - minLat) / (maxLat - minLat)) * (HEIGHT - PAD * 2),
  });
}

function svgForSpot(spot) {
  const km = minToKm(spot.minutesFromTokyo);
  const viewpoint = latLngAtKm(km);
  const landmark = { lat: spot.map.lat, lng: spot.map.lng };
  const line = sliceTrack(km, 20);
  const project = projectFactory([...line, viewpoint, landmark]);
  const pathData = line.map((p, index) => {
    const pt = project(p);
    return `${index === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }).join(" ");
  const view = project(viewpoint);
  const mark = project(landmark);
  const name = spot.ja?.name || spot.en?.name || spot.id;
  const mapName = spot.map.ja || spot.map.en || name;
  const dash = `M${view.x.toFixed(1)} ${view.y.toFixed(1)} L${mark.x.toFixed(1)} ${mark.y.toFixed(1)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHTML(name)}の静的ミニ地図</title>
  <desc id="desc">東海道新幹線の線路上の視点位置と、${escapeHTML(mapName)}の位置関係を示す簡易図です。</desc>
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f7fbff"/>
      <stop offset="1" stop-color="#fff7ed"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#17324a" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="28" fill="url(#bg)"/>
  <path d="M30 72 C168 24 257 89 388 54 S604 17 690 88" fill="none" stroke="#dce8f2" stroke-width="22" stroke-linecap="round" opacity="0.55"/>
  <path d="M26 286 C145 247 271 330 399 292 S593 242 694 292" fill="none" stroke="#f0dec3" stroke-width="26" stroke-linecap="round" opacity="0.48"/>
  <path d="${pathData}" fill="none" stroke="#17324a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#soft-shadow)"/>
  <path d="${pathData}" fill="none" stroke="#f7fbff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <path d="${dash}" fill="none" stroke="#c76d1d" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 9"/>
  <g transform="translate(${view.x.toFixed(1)} ${view.y.toFixed(1)})">
    <circle r="17" fill="#17324a" stroke="#fff" stroke-width="5"/>
    <circle r="5" fill="#fff"/>
  </g>
  <g transform="translate(${mark.x.toFixed(1)} ${mark.y.toFixed(1)})">
    <circle r="18" fill="#ffcf8a" stroke="#a94f12" stroke-width="5"/>
    <circle r="5" fill="#a94f12"/>
  </g>
  <g font-family="Yu Gothic, Meiryo, sans-serif" font-weight="700">
    <text x="28" y="42" font-size="22" fill="#0b1b2b">${escapeHTML(name)}</text>
    <text x="28" y="70" font-size="13" fill="#53677a">線路上の視点と対象物の位置関係</text>
    <rect x="28" y="${HEIGHT - 58}" width="15" height="15" rx="7.5" fill="#17324a"/>
    <text x="52" y="${HEIGHT - 45}" font-size="13" fill="#31465a">線路上の視点</text>
    <rect x="176" y="${HEIGHT - 58}" width="15" height="15" rx="7.5" fill="#ffcf8a" stroke="#a94f12" stroke-width="3"/>
    <text x="202" y="${HEIGHT - 45}" font-size="13" fill="#31465a">対象物</text>
  </g>
</svg>
`;
}

fs.mkdirSync(outDir, { recursive: true });
let count = 0;
for (const spot of SPOTS) {
  if (!(spot?.map && typeof spot.map.lat === "number" && typeof spot.map.lng === "number" && typeof spot.minutesFromTokyo === "number")) continue;
  fs.writeFileSync(path.join(outDir, `${spot.id}.svg`), svgForSpot(spot), "utf8");
  count += 1;
}
console.log(`Generated ${count} static mini maps in ${path.relative(appDir, outDir)}`);
