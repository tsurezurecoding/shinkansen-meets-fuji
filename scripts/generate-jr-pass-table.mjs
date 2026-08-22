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
const PAGE = path.join(appDir, "en", "jr-pass-fuji.html");
const START = "<!-- JRPASS_TABLE_START -->";
const END = "<!-- JRPASS_TABLE_END -->";

const timetableWindow = {};
vm.runInNewContext(fs.readFileSync(path.join(appDir, "data", "timetable.js"), "utf8"), {
  window: timetableWindow,
});
const TIMETABLE = timetableWindow.SHINKANSEN_TIMETABLE;
const STATION_EN = Object.fromEntries(TIMETABLE.stations.map((s) => [s.id, s.en || s.id]));

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

const html = fs.readFileSync(PAGE, "utf8");
if (!html.includes(START) || !html.includes(END)) {
  throw new Error(`JR Pass table markers missing in ${PAGE}`);
}
const next = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), generated);
const summary =
  `${west.length} westbound + ${east.length} eastbound Kodama with a real Shin-Fuji stop; ` +
  `${tokyoRange} min from Tokyo`;

if (CHECK_ONLY) {
  if (next !== html) {
    console.error("JR Pass table is stale. Run: node scripts/generate-jr-pass-table.mjs");
    process.exit(1);
  }
  console.log(`JR Pass table current: ${summary}.`);
} else {
  if (next !== html) fs.writeFileSync(PAGE, next, "utf8");
  console.log(`JR Pass table written: ${summary}.`);
}
