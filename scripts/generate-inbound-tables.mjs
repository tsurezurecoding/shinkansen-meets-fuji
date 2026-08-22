import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// Fills the Mt. Fuji timing table on en/jr-pass-fuji.html from data/timetable.js.
//
// Why this page needs its own table: the "Mt. Fuji is about 43 minutes after Tokyo"
// figure quoted everywhere — including our own fujiOffsetsMinutes — is a Nozomi figure.
// A Japan Rail Pass does not cover Nozomi without a surcharge, so pass holders ride
// Hikari and Kodama. A Kodama takes 59-71 minutes from Tokyo to reach the same view.
//
// ONLY trains with a real Shin-Fuji stop time are listed. An earlier version
// interpolated a time for trains that pass through, using fujiOffsetsMinutes as a
// distance scale, and produced Hikari arriving 42 minutes after Tokyo — faster than a
// Nozomi, which is impossible. Those offsets are an MVP approximation and are not
// mutually consistent as a time axis (they imply a Shin-Yokohama-Toyohashi run that
// some Hikari beat by five minutes). Riders of non-stopping trains are sent to the
// train picker instead of being handed an invented number.

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_ONLY = process.argv.includes("--check");
const JRPASS_PAGE = path.join(appDir, "en", "jr-pass-fuji.html");
const BESIDES_PAGE = path.join(appDir, "en", "besides-fuji.html");
const START = "<!-- JRPASS_TABLE_START -->";
const END = "<!-- JRPASS_TABLE_END -->";
const BESIDES_START = "<!-- BESIDES_TABLE_START -->";
const BESIDES_END = "<!-- BESIDES_TABLE_END -->";

const timetableWindow = {};
vm.runInNewContext(fs.readFileSync(path.join(appDir, "data", "timetable.js"), "utf8"), {
  window: timetableWindow,
});
const TIMETABLE = timetableWindow.SHINKANSEN_TIMETABLE;
const STATION_EN = Object.fromEntries(TIMETABLE.stations.map((s) => [s.id, s.en || s.id]));

const { SPOTS } = vm.runInNewContext(
  `${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\n;({ SPOTS });`,
  {},
  { filename: "data.js" },
);

// The five points where the mountain itself is the view. They are the ones a grey
// sky takes away, so the "what else is out there" table lists everything but these.
const FUJI_VIEWPOINTS = new Set(["fuji", "ota-fuji", "sagami-fuji", "left-fuji", "hamanako-fuji"]);

const escapeHTML = (value) =>
  String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function rowsFor(direction) {
  return TIMETABLE.trains
    .filter((train) => train.direction === direction)
    .filter((train) => train.type === "Hikari" || train.type === "Kodama")
    .filter((train) => train.times["Shin-Fuji"])
    .map((train) => {
      const origin = train.originStation;
      const departure = train.times[origin];
      if (!departure) return null;
      const fujiAt = train.times["Shin-Fuji"];
      const after = toMinutes(fujiAt) - toMinutes(departure);
      return {
        type: train.type,
        number: train.number,
        origin: STATION_EN[origin] || origin,
        departure,
        fujiAt,
        after: after > 0 ? after : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => toMinutes(a.fujiAt) - toMinutes(b.fujiAt));
}

function tableHTML(caption, seatNote, rows) {
  const body = rows
    .map(
      (row) =>
        `<tr><td>${row.type} ${row.number}</td><td>${row.origin}</td><td>${row.departure}</td>` +
        `<td><b>${row.fujiAt}</b></td><td>${row.after === null ? "—" : `${row.after} min`}</td></tr>`,
    )
    .join("\n            ");
  return (
    `        <h3>${caption}</h3>\n` +
    `        <p class="jp-table-note">${seatNote}</p>\n` +
    `        <div class="jp-table-wrap">\n` +
    `          <table class="jp-table">\n` +
    `            <thead><tr><th>Train</th><th>From</th><th>Departs</th><th>At Shin-Fuji</th><th>Journey so far</th></tr></thead>\n` +
    `            <tbody>\n            ${body}\n            </tbody>\n` +
    `          </table>\n` +
    `        </div>`
  );
}

const west = rowsFor("west");
const east = rowsFor("east");

const fromTokyo = west.filter((row) => row.origin === "Tokyo" && row.after !== null).map((row) => row.after);
const tokyoRange = fromTokyo.length
  ? `${Math.min(...fromTokyo)}–${Math.max(...fromTokyo)}`
  : "n/a";

const generated =
  `${START}\n` +
  tableHTML(
    "Toward Kyoto and Shin-Osaka",
    "Mt. Fuji is on your <b>right</b>, in <b>Seat E</b>. Every train here stops at Shin-Fuji, so the mountain is beside you while the train is standing still.",
    west,
  ) +
  "\n\n" +
  tableHTML(
    "Toward Tokyo",
    "Mt. Fuji is on your <b>left</b>, in the same <b>Seat E</b>.",
    east,
  ) +
  `\n      ${END}`;

// --- "Mt. Fuji is hidden" page: everything that does not need a clear horizon ---

function besidesTableHTML() {
  const rows = SPOTS.filter((spot) => !FUJI_VIEWPOINTS.has(spot.id))
    .slice()
    .sort((a, b) => a.minutesFromTokyo - b.minutesFromTokyo)
    .map((spot) => {
      const name = (spot.en && spot.en.name) || spot.id;
      const hook = (spot.en && spot.en.hook) || "";
      const href = `spots/${spot.id}.html`;
      return (
        `<tr><td>${spot.minutesFromTokyo} min</td>` +
        `<td><span class="bf-seat">${escapeHTML(spot.side)}</span></td>` +
        `<td><a href="${escapeHTML(href)}">${escapeHTML(name)}</a></td>` +
        `<td>${escapeHTML(hook)}</td></tr>`
      );
    });
  return (
    `${BESIDES_START}\n` +
    `      <div class="bf-table-wrap">\n` +
    `        <table class="bf-table">\n` +
    `          <thead><tr><th>From Tokyo</th><th>Side</th><th>What it is</th><th></th></tr></thead>\n` +
    `          <tbody>\n            ${rows.join("\n            ")}\n          </tbody>\n` +
    `        </table>\n` +
    `      </div>\n      ${BESIDES_END}`
  );
}

function applyTo(pageFile, startMarker, endMarker, replacement, label) {
  const html = fs.readFileSync(pageFile, "utf8");
  if (!html.includes(startMarker) || !html.includes(endMarker)) {
    throw new Error(`${label} markers missing in ${pageFile}`);
  }
  const next = html.replace(new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`), replacement);
  if (CHECK_ONLY) {
    if (next !== html) {
      console.error(`${label} is stale. Run: node scripts/generate-inbound-tables.mjs`);
      process.exit(1);
    }
    return false;
  }
  if (next !== html) {
    fs.writeFileSync(pageFile, next, "utf8");
    return true;
  }
  return false;
}

applyTo(JRPASS_PAGE, START, END, generated, "JR Pass table");
applyTo(BESIDES_PAGE, BESIDES_START, BESIDES_END, besidesTableHTML(), "Besides-Fuji table");

const besidesCount = SPOTS.filter((spot) => !FUJI_VIEWPOINTS.has(spot.id)).length;
const summary =
  `JR Pass ${west.length} westbound + ${east.length} eastbound Kodama with a real Shin-Fuji stop ` +
  `(${tokyoRange} min from Tokyo); Besides-Fuji ${besidesCount} of ${SPOTS.length} views`;
console.log(`Inbound tables ${CHECK_ONLY ? "current" : "written"}: ${summary}.`);
