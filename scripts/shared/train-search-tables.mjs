import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// Shared by the Japanese inbound-table build and the English page generator.
// Importing this module only reads the source data; it never writes any pages.
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const timetableWindow = {};
vm.runInNewContext(fs.readFileSync(path.join(appDir, "data/timetable.js"), "utf8"), { window: timetableWindow });
const TIMETABLE = timetableWindow.SHINKANSEN_TIMETABLE;
const { SPOTS, ROUTE } = vm.runInNewContext(
  `${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\n;({ SPOTS, ROUTE });`, {}, { filename: "data.js" },
);
const runtimeContext = { window: { ROUTE }, ROUTE };
for (const file of ["train-select.js", "track.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(appDir, file), "utf8"), runtimeContext, { filename: file });
}
const MTS = runtimeContext.window.MADO_TRAIN_SELECT;
const TRACK = runtimeContext.window.MADO_TRACK;
const STATION_EN = Object.fromEntries(TIMETABLE.stations.map((station) => [station.id, station.en || station.id]));
const STATION_JA = Object.fromEntries(TIMETABLE.stations.map((station) => [station.id, station.ja || station.id]));
const TYPE_JA = { Nozomi: "のぞみ", Hikari: "ひかり", Kodama: "こだま" };
const escapeHTML = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Use the same arrival-aware implementation as app.js/computeJourney. A separate
// departure-to-departure interpolation incorrectly spreads station dwell time
// across the preceding segment and can disagree with the selected-train result.
function fujiMinutes(train, spot) {
  const stops = MTS.tokaidoStops(ROUTE, train);
  const boardIndex = stops.findIndex((station) => station.id === routeBoardId(train));
  const side = MTS.spotStationSide(spot, ROUTE, TRACK);
  return MTS.interpolateSpot(spot.minutesFromTokyo, stops.slice(boardIndex), side);
}

function routeBoardId(train) {
  const served = ROUTE.refStations.filter((station) => train.times[station.id]);
  const station = train.direction === "east" ? served.at(-1) : served[0];
  if (!station) throw new Error(`No Tokaido boarding station for ${train.type} ${train.number}`);
  return station.id;
}

function clock(minutes) {
  const value = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function trainSearchTablesHTML(lang = "ja") {
  if (lang !== "ja" && lang !== "en") throw new Error(`Unsupported train-index language: ${lang}`);
  const english = lang === "en";
  const fuji = SPOTS.find((spot) => spot.id === "fuji");
  if (!fuji) throw new Error("Mt. Fuji spot missing from the train index source");
  const groups = [];
  for (const type of ["Nozomi", "Hikari", "Kodama"]) {
    for (const direction of ["west", "east"]) {
      const seen = new Set();
      const rows = TIMETABLE.trains
        .filter((train) => train.type === type && train.direction === direction)
        .map((train) => ({ train, at: fujiMinutes(train, fuji) }))
        .filter((row) => row.at !== null)
        .filter((row) => {
          if (seen.has(row.train.number)) return false;
          seen.add(row.train.number);
          return true;
        })
        .sort((a, b) => a.train.number - b.train.number)
        .map(({ train, at }) => {
          const label = english ? `${type} ${train.number}` : `${TYPE_JA[type]}${train.number}号`;
          const station = (english ? STATION_EN : STATION_JA)[train.originStation] || train.originStation;
          const href = `start.html?train=${type}-${train.number}&amp;board=${encodeURIComponent(routeBoardId(train))}&amp;dir=${direction}&amp;focus=fuji#journey`;
          return `<tr data-fuji-min="${at % 1440}"><td><a href="${href}">${label}</a></td><td>${escapeHTML(station)} ${escapeHTML(train.times[train.originStation] || "—")}</td><td><b>${clock(at)}</b></td></tr>`;
        });
      if (!rows.length) continue;
      const directionLabel = english ? (direction === "west" ? "toward Kyoto / Shin-Osaka" : "toward Tokyo") : (direction === "west" ? "下り" : "上り");
      const summary = english ? `${type} · ${directionLabel} (${rows.length} trains)` : `${TYPE_JA[type]}・${directionLabel}（${rows.length}本）`;
      groups.push(`          <details class="ja-train-list">
            <summary>${summary}</summary>
            <div class="jp-table-wrap"><table class="jp-table ja-train-table">
              <thead><tr>${english ? "<th>Train</th><th>Origin / departure</th><th>Mt. Fuji (est.)</th>" : "<th>列車</th><th>始発・発車時刻</th><th>富士山（推定）</th>"}</tr></thead>
              <tbody>
              ${rows.join("\n              ")}
              </tbody>
            </table></div>
          </details>`);
    }
  }
  const source = TIMETABLE.sources.find((entry) => entry.name === "JR Central Shinkansen Timetable") || TIMETABLE.sources[0];
  const note = english
    ? `Choose a listed train to open its Mt. Fuji estimate and window-view timeline. Times are estimated from each service's scheduled stops. Timetable data updated ${escapeHTML(TIMETABLE.updatedAt)}; operating dates, temporary services and delays are not reflected.`
    : `収録列車を選ぶと、富士山の推定通過時刻と車窓タイムラインが開きます。時刻は各列車の停車時刻からの推定です。ダイヤデータ更新：${escapeHTML(TIMETABLE.updatedAt)}。運転日・臨時列車・遅延には対応していません。`;
  return `        <p class="train-search-note">${note} <a href="${escapeHTML(source.url)}" target="_blank" rel="noopener">${english ? "Official timetable" : "公式時刻表"}</a></p>
        <div class="ja-train-grid">
${groups.join("\n")}
        </div>`;
}
