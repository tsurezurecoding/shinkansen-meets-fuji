import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const dataPath = path.join(appDir, "data.js");
const outputPath = path.join(appDir, "spot-page-shared-data.js");
const dataContext = {};
const dataCode = fs.readFileSync(dataPath, "utf8");

vm.runInNewContext(`${dataCode}\nglobalThis.__SPOT_PAGE_SHARED_SOURCE = { SPOTS, ROUTE };`, dataContext, { filename: dataPath });

const source = dataContext.__SPOT_PAGE_SHARED_SOURCE;
if (!source || !Array.isArray(source.SPOTS) || !source.ROUTE || !Array.isArray(source.ROUTE.refStations)) {
  throw new Error("Could not read SPOTS and ROUTE.refStations from data.js");
}

const SIDE_LABELS = {
  ja: { A: "A席・海側", E: "E席・山側", both: "左右両側", hamanako: "A席・海側 / E席・山側" },
  en: { A: "Seat A · sea side", E: "Seat E · mountain side", both: "Both sides", hamanako: "Seat A · sea side / Seat E · mountain side" },
};

function localized(value, lang) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[lang] || value.ja || value.en || "";
}

function thumbnailSrc(src) {
  return String(src || "").replace(/^images\/(.+)\.(jpe?g|png)$/i, "images/thumbs/$1.webp");
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

if (spots.some((spot) => !spot.id || !Number.isFinite(spot.minutes))) {
  throw new Error("Every spot in data.js must have an id and minutesFromTokyo for the shared rail");
}

const payload = { version: 1, stations, spots };
const output = `/* Generated from data.js. Do not edit this artifact by hand. */\n(function (root) {\n  root.MADO_SPOT_PAGE_SHARED_DATA = ${JSON.stringify(payload)};\n}(typeof window !== "undefined" ? window : globalThis));\n`;
fs.writeFileSync(outputPath, output, "utf8");
console.log(`Generated shared spot chrome data for ${spots.length} spots and ${stations.length} stations.`);
