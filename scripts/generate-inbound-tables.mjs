import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

// Fills the Mt. Fuji timing table on en/jr-pass-fuji.html from data/timetable.js.
//
// Why this page needs its own table: the "Mt. Fuji is about 43 minutes after Tokyo"
// figure quoted everywhere — including our own fujiOffsetsMinutes — is a Nozomi figure.
// A Japan Rail Pass covers Nozomi only with a separate special ticket, so pass holders normally ride
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

const { SPOTS, ROUTE } = vm.runInNewContext(
  `${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\n;({ SPOTS, ROUTE });`,
  {},
  { filename: "data.js" },
);

const TOKAIDO_STATION_IDS = new Set(ROUTE.refStations.map((station) => station.id));

// Through-services may originate outside the Tokaido section (Hakata, Hiroshima,
// Okayama, etc.). The train picker only accepts Tokaido stations, so links must open
// at the first Tokaido stop in the train's direction rather than at originStation.
function routeBoardId(train) {
  const served = ROUTE.refStations.filter((station) => train.times[station.id]);
  const station = train.direction === "east" ? served.at(-1) : served[0];
  if (!station || !TOKAIDO_STATION_IDS.has(station.id)) {
    throw new Error(`No Tokaido boarding station for ${train.type} ${train.number} (${train.direction})`);
  }
  return station.id;
}

// The five points where the mountain itself is the view. They are the ones a grey
// sky takes away, so the "what else is out there" table lists everything but these.
const FUJI_VIEWPOINTS = new Set(["fuji", "ota-fuji", "sagami-fuji", "left-fuji", "hamanako-fuji"]);

// 繁体字のスポット名は既に generate-spot-pages.mjs の GUIDE_RAIL_LOCALIZATION が持っている。
// 40件中38件あり、フジパイプとフジテックの2件は社名なので日本語表記のまま残す（レールと同じ挙動）。
// ここで訳し直すと2箇所で別の表記になるので、必ずそちらから読む。
const RAIL_LOCALIZATION = (() => {
  const source = fs.readFileSync(path.join(appDir, "scripts", "generate-spot-pages.mjs"), "utf8");
  const block = source.match(/const GUIDE_RAIL_LOCALIZATION = \{[\s\S]*?\n\};/);
  if (!block) throw new Error("GUIDE_RAIL_LOCALIZATION not found in generate-spot-pages.mjs");
  return vm.runInNewContext(`${block[0].replace("const GUIDE_RAIL_LOCALIZATION", "var T")}\n;T;`, {});
})();

const LANGS = {
  en: {
    dir: "en",
    spotName: (spot) => (spot.en && spot.en.name) || spot.id,
    hook: (spot) => (spot.en && spot.en.hook) || "",
    minutes: (n) => `${n} min`,
    head: ["From Tokyo", "Side", "Spotting", "What it is", ""],
    level: { easy: "Easy", moderate: "Medium", hard: "Hard" },
  },
  "zh-Hant": {
    dir: "zh-Hant",
    // 繁体字のスポットページは無いので、詳細は英語版へ送る（ガイドの既存挙動と同じ）。
    spotHrefPrefix: "../en/spots/",
    spotName: (spot) =>
      RAIL_LOCALIZATION["zh-Hant"].spots[spot.id] || (spot.ja && spot.ja.name) || spot.id,
    // 一言説明の列は出さない。繁体字の hook は40件中6件しか無く、
    // 残りを英語で埋めると中国語のページに英語の列が1本立つだけになる。
    hook: null,
    minutes: (n) => `東京起 ${n} 分`,
    head: ["時間", "座位側", "難易度", "看到的是什麼"],
    level: { easy: "容易", moderate: "普通", hard: "困難" },
  },
};

const SPOTTING_LABEL = LANGS.en.level;

const escapeHTML = (value) =>
  String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function rowsFor(direction) {
  const rows = TIMETABLE.trains
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
        boardId: routeBoardId(train),
        direction: train.direction,
        origin: STATION_EN[origin] || origin,
        departure,
        fujiAt,
        after: after > 0 ? after : null,
      };
    })
    .filter(Boolean);

  // JR East exposes some through-services from more than one boarding-station page.
  // The train number and Shin-Fuji time identify the same physical service; keep the
  // earliest listed origin so riders see the complete run only once.
  const unique = new Map();
  for (const row of rows) {
    const key = `${row.type}|${row.number}|${row.fujiAt}`;
    const current = unique.get(key);
    if (!current || toMinutes(row.departure) < toMinutes(current.departure)) unique.set(key, row);
  }
  return [...unique.values()].sort((a, b) => toMinutes(a.fujiAt) - toMinutes(b.fujiAt));
}

function tableHTML(caption, seatNote, rows) {
  const body = rows
    .map(
      (row) =>
        `<tr><td><a href="start.html?train=${row.type}-${row.number}&amp;board=${encodeURIComponent(row.boardId)}&amp;dir=${row.direction}">${row.type} ${row.number}</a></td>` +
        `<td>${row.origin}</td><td>${row.departure}</td>` +
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

/* ひかりは新富士に停まらないため、駅の実時刻が存在しない。距離按分での補間は
   過去に「ひかりが東京から42分（のぞみより速い）」という不可能な値を出して撤去済み。
   そこで時刻は一切書かず、列車ピッカーへのリンクだけを出す。通過時刻はタイムライン側の
   interpolateSpot が、その列車自身の停車時刻から算出する。 */
function hikariLinksHTML() {
  const byDirection = { west: [], east: [] };
  for (const train of TIMETABLE.trains) {
    if (train.type !== "Hikari") continue;
    if (!train.originStation || !train.direction) continue;
    if (!byDirection[train.direction]) continue;
    byDirection[train.direction].push(train);
  }
  const listFor = (direction) => {
    const seen = new Set();
    return byDirection[direction]
      .filter((train) => {
        const key = train.number;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.number - b.number)
      .map(
        (train) =>
          `<li><a href="start.html?train=Hikari-${train.number}&amp;board=${encodeURIComponent(routeBoardId(train))}&amp;dir=${train.direction}">Hikari ${train.number}</a> <span class="jp-hikari-from">from ${escapeHTML(train.originStation)}</span></li>`,
      )
      .join("\n              ");
  };
  const west = listFor("west");
  const east = listFor("east");
  if (!west && !east) return "";
  return (
    `        <details class="jp-hikari">\n` +
    `          <summary>Riding a Hikari? Open your train's timeline</summary>\n` +
    `          <p class="jp-table-note">Hikari passes Mt. Fuji without stopping, so there is no station time to quote and we will not invent one. Open a train and the guide works the passing time out from that train's own schedule.</p>\n` +
    `          <h4>Toward Kyoto and Shin-Osaka</h4>\n          <ul class="jp-hikari-list">\n              ${west}\n          </ul>\n` +
    `          <h4>Toward Tokyo</h4>\n          <ul class="jp-hikari-list">\n              ${east}\n          </ul>\n` +
    `        </details>`
  );
}

/* 日本語 guide.html 向けの列車別 富士山通過時刻。
   のぞみ・ひかりは新富士に停まらないので駅の実時刻がない。距離按分（fujiOffsetsMinutes）は
   「ひかりがのぞみより速い」という不可能値を出したため使わない。ここでは app.js のタイムラインと
   同じ方法、すなわち "その列車自身の停車時刻" の間を線形補間する。のぞみ45分 < ひかり48分 <
   こだま64分 と順序が保たれることを確認済み。

   明暗は季節で変わるため、年間を通じて断定できる帯だけに印を付ける。
   新富士の日の入りは約16:35〜19:00、日の出は約04:25〜06:50。その外側だけ「夜」と言い切り、
   薄明帯は「朝夕」として読者の判断に委ねる。 */
const JA_EARLIEST_SUNRISE = 4 * 60 + 25;
const JA_LATEST_SUNRISE = 6 * 60 + 50;
const JA_EARLIEST_SUNSET = 16 * 60 + 35;
const JA_LATEST_SUNSET = 19 * 60;

function jaToMin(hhmm) {
  const p = String(hhmm).split(":");
  return Number(p[0]) * 60 + Number(p[1]);
}
function jaStops(train) {
  return ROUTE.refStations
    .filter((s) => train.times[s.id])
    .map((s) => ({ ref: s.min, clock: jaToMin(train.times[s.id]) }))
    .sort((a, b) => a.clock - b.clock);
}
function jaInterpolate(spotRef, stops) {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const lo = Math.min(a.ref, b.ref);
    const hi = Math.max(a.ref, b.ref);
    if (spotRef >= lo && spotRef <= hi && a.ref !== b.ref) {
      const f = Math.abs(spotRef - a.ref) / Math.abs(b.ref - a.ref);
      return Math.round(a.clock + f * (b.clock - a.clock));
    }
  }
  return null;
}
function jaClock(min) {
  const m = ((min % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}
const JA_TYPE_LABEL = { Nozomi: "のぞみ", Hikari: "ひかり", Kodama: "こだま" };
const JA_STATION2 = Object.fromEntries((ROUTE?.refStations || []).map((st) => [st.id, st.ja || st.id]));

/* 明暗は文字で書かず、閲覧時の日付から sun-window.js が色で表す。
   ここでは判定に必要な通過時刻（0時からの分）だけ data 属性で渡す。
   季節で変わるものを静的HTMLに焼き込まないための分担。 */
function jaTrainTablesHTML() {
  const fuji = SPOTS.find((spot) => spot.id === "fuji");
  if (!fuji || !ROUTE || !ROUTE.refStations) return "";

  const build = (type, direction) => {
    const seen = new Set();
    const rows = TIMETABLE.trains
      .filter((train) => train.type === type && train.direction === direction)
      .map((train) => ({ train, at: jaInterpolate(fuji.minutesFromTokyo, jaStops(train)) }))
      .filter((row) => row.at !== null)
      .filter((row) => {
        if (seen.has(row.train.number)) return false;
        seen.add(row.train.number);
        return true;
      })
      .sort((a, b) => a.train.number - b.train.number)
      .map((row) => {
        const label = JA_TYPE_LABEL[type] + row.train.number + "号";
        const dep = row.train.times[row.train.originStation] || "—";
        const href = "start.html?train=" + type + "-" + row.train.number
          + "&amp;board=" + encodeURIComponent(routeBoardId(row.train))
          + "&amp;dir=" + direction;
        const station = escapeHTML(JA_STATION2[row.train.originStation] || row.train.originStation);
        return "<tr data-fuji-min=\"" + (row.at % 1440) + "\">"
          + "<td><a href=\"" + href + "\">" + label + "</a></td>"
          + "<td>" + station + " " + dep + "</td>"
          + "<td><b>" + jaClock(row.at) + "</b></td></tr>";
      });
    if (!rows.length) return "";
    const dirLabel = direction === "west" ? "下り" : "上り";
    return "          <details class=\"ja-train-list\">\n"
      + "            <summary>" + JA_TYPE_LABEL[type] + "・" + dirLabel + "（" + rows.length + "本）</summary>\n"
      + "            <div class=\"jp-table-wrap\"><table class=\"jp-table ja-train-table\">\n"
      + "              <thead><tr><th>列車</th><th>始発</th><th>富士山</th></tr></thead>\n"
      + "              <tbody>\n              " + rows.join("\n              ") + "\n              </tbody>\n"
      + "            </table></div>\n"
      + "          </details>";
  };

  const cells = [];
  for (const type of ["Nozomi", "Hikari", "Kodama"]) {
    for (const direction of ["west", "east"]) {
      const html = build(type, direction);
      if (html) cells.push(html);
    }
  }
  if (!cells.length) return "";
  return "        <div class=\"ja-train-grid\">\n" + cells.join("\n") + "\n        </div>";
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
  "\n\n" +
  hikariLinksHTML() +
  `\n      ${END}`;

// --- 日本語 guide.html: 列車ごとの富士山通過時刻 ---

const JA_START = "<!-- JA_TRAIN_TABLES_START -->";
const JA_END = "<!-- JA_TRAIN_TABLES_END -->";
const JA_GUIDE_PAGE = path.join(appDir, "guide.html");
{
  const generatedJa = `${JA_START}
` + jaTrainTablesHTML() + `
        ${JA_END}`;
  const current = fs.readFileSync(JA_GUIDE_PAGE, "utf8");
  const startIdx = current.indexOf(JA_START);
  const endIdx = current.indexOf(JA_END);
  if (startIdx === -1 || endIdx === -1) throw new Error("guide.html: JA_TRAIN_TABLES markers missing");
  const next = current.slice(0, startIdx) + generatedJa + current.slice(endIdx + JA_END.length);
  if (CHECK_ONLY) {
    if (next !== current) throw new Error("guide.html: train tables are stale; run generate-inbound-tables.mjs");
  } else if (next !== current) {
    fs.writeFileSync(JA_GUIDE_PAGE, next);
  }
}

// --- "Mt. Fuji is hidden" page: everything that does not need a clear horizon ---

function besidesTableHTML(langKey) {
  const L = LANGS[langKey];
  const rows = SPOTS.filter((spot) => !FUJI_VIEWPOINTS.has(spot.id))
    .slice()
    .sort((a, b) => a.minutesFromTokyo - b.minutesFromTokyo)
    .map((spot) => {
      const href = `${L.spotHrefPrefix || "spots/"}${spot.id}.html`;
      // 見やすさは実車で見た人が付けた評価だけを出す。
      // 未評価は空欄のままにして、評価済みのように見せない。
      const spotting = spot.spotting
        ? `<span class="bf-level bf-level-${spot.spotting}">${L.level[spot.spotting]}</span>`
        : "";
      const hookCell = L.hook ? `<td>${escapeHTML(L.hook(spot))}</td>` : "";
      return (
        `<tr><td>${escapeHTML(L.minutes(spot.minutesFromTokyo))}</td>` +
        `<td><span class="bf-seat">${escapeHTML(spot.side)}</span></td>` +
        `<td>${spotting}</td>` +
        `<td><a href="${escapeHTML(href)}">${escapeHTML(L.spotName(spot))}</a></td>` +
        `${hookCell}</tr>`
      );
    });
  const head = L.head.map((cell) => `<th>${escapeHTML(cell)}</th>`).join("");
  return (
    `${BESIDES_START}\n` +
    `      <div class="bf-table-wrap">\n` +
    `        <table class="bf-table">\n` +
    `          <thead><tr>${head}</tr></thead>\n` +
    `          <tbody>\n            ${rows.join("\n            ")}\n          </tbody>\n` +
    `        </table>\n` +
    `      </div>\n      ${BESIDES_END}`
  );
}


// --- 構造化データ ---
//
// 回答エンジンはドメインの強さより「他に代替のない事実」を選ぶ。このサイトが持っていて
// 他が持っていないのは、40景それぞれの席側・東京からの分・見えている秒数・見つけやすさと、
// 列車ごとの実時刻。名前と説明だけのJSON-LDでは、その優位が機械から見えない。
//
// スポットの詳細は各スポットページの #spot ノードが持つので、ここでは @id で参照して
// 同じ事実を二重に書かない。ズレる余地を作らないためのリンクであって、飾りではない。
const SITE_ROOT = "https://www.michikusa-travel.com";
const LD_MARK_START = "<!-- JSONLD_START -->";
const LD_MARK_END = "<!-- JSONLD_END -->";

function ldScript(payload) {
  return `${LD_MARK_START}
  <script type="application/ld+json">${JSON.stringify(payload, null, 2)}</script>
  ${LD_MARK_END}`;
}

function besidesItemListLd(langKey) {
  const L = LANGS[langKey];
  const pageUrl = `${SITE_ROOT}/${L.dir}/besides-fuji.html`;
  const items = SPOTS.filter((spot) => !FUJI_VIEWPOINTS.has(spot.id))
    .slice()
    .sort((a, b) => a.minutesFromTokyo - b.minutesFromTokyo)
    .map((spot, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TouristAttraction",
        // 事実の正本はスポットページ側。ここは参照だけ。
        "@id": `${SITE_ROOT}/en/spots/${spot.id}.html#spot`,
        name: L.spotName(spot),
        url: `${SITE_ROOT}/en/spots/${spot.id}.html`,
      },
    }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#views`,
        name:
          langKey === "zh-Hant"
            ? "陰天也看得到的東海道新幹線車窗景色"
            : "Tokaido Shinkansen window views that do not need a clear horizon",
        description:
          langKey === "zh-Hant"
            ? `富士山以外的${items.length}個車窗景色，依東京起算的通過順序排列。`
            : `The ${items.length} window views other than Mt. Fuji itself, in the order they pass.`,
        numberOfItems: items.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: items,
      },
    ],
  };
}

function jrPassFaqLd(tokyoRange, kodamaCount) {
  const pageUrl = `${SITE_ROOT}/en/jr-pass-fuji.html`;
  const qa = [
    [
      "Does the Japan Rail Pass cover the Shinkansen to Mt. Fuji?",
      "It covers Hikari and Kodama on the Tokaido Shinkansen. Nozomi requires a separate special ticket for pass holders. All three run on the same track, so the view of Mt. Fuji is identical; only the timing differs.",
    ],
    [
      "How long after leaving Tokyo does Mt. Fuji appear on a Japan Rail Pass train?",
      `On a Kodama it is ${tokyoRange} minutes after Tokyo, not the 40 to 45 minutes usually quoted, which is a Nozomi figure. Kodama also stops at Shin-Fuji, so the mountain is beside the train while it is standing still.`,
    ],
    [
      "Which side of the Shinkansen is Mt. Fuji on?",
      "Heading from Tokyo toward Kyoto and Shin-Osaka it is on the right, in Seat E. Coming back toward Tokyo it is on the left, and the seat letter is still E, because Mt. Fuji sits north of the track and seat letters do not change with direction. In the Green Car the equivalent window seat is Seat D.",
    ],
    [
      "Is the slower train worse for sightseeing?",
      `No. Several window views sit beside stations that only Kodama serves. Kakegawa Castle is the clearest case: ${kodamaCount} Kodama call at Kakegawa and no Hikari or Nozomi stop there at all.`,
    ],
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: qa.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
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

function requireFragment(html, fragment, label) {
  if (!html.includes(fragment)) throw new Error(`${label} is missing`);
}

function validateInboundPageContracts() {
  const jrPass = fs.readFileSync(JRPASS_PAGE, "utf8");
  const besidesEn = fs.readFileSync(BESIDES_PAGE, "utf8");
  const besidesZhPath = path.join(appDir, "zh-Hant", "besides-fuji.html");
  const besidesZh = fs.readFileSync(besidesZhPath, "utf8");
  const pages = [
    [jrPass, "JR Pass page", "data-jrpass-cta", "jrpass_cta_click"],
    [besidesEn, "English Besides-Fuji page", "data-besides-cta", "besides_fuji_cta_click"],
    [besidesZh, "Traditional Chinese Besides-Fuji page", "data-besides-cta", "besides_fuji_cta_click"],
  ];

  for (const [html, label, ctaAttribute, eventName] of pages) {
    requireFragment(html, "if (window.MADO_EMBEDDED_WEB) return;", `${label}: embedded analytics guard`);
    requireFragment(html, "https://www.googletagmanager.com/gtag/js?id=", `${label}: normal-web analytics loader`);
    requireFragment(html, ctaAttribute, `${label}: CTA marker`);
    requireFragment(html, eventName, `${label}: CTA analytics event`);
  }

  const obsoleteFareClaims = ["reserved seats carry a fee", "reservations carry a fee"];
  const guide = fs.readFileSync(path.join(appDir, "en", "guide.html"), "utf8");
  for (const claim of obsoleteFareClaims) {
    if (jrPass.toLowerCase().includes(claim) || guide.toLowerCase().includes(claim)) {
      throw new Error(`Obsolete JR Pass fare claim remains: ${claim}`);
    }
  }
  if (/Nozomi[^.]{0,120}surcharge|surcharge[^.]{0,120}Nozomi/i.test(jrPass) || /Nozomi[^.]{0,120}surcharge|surcharge[^.]{0,120}Nozomi/i.test(guide)) {
    throw new Error("Obsolete Nozomi surcharge wording remains; use the official separate-special-ticket wording");
  }
  requireFragment(jrPass, "includes seat reservations on eligible Hikari and Kodama services at no additional charge", "JR Pass reservation terms");
  const serviceKeys = [...jrPass.matchAll(/<tr><td><a href="start\.html\?train=(?:Hikari|Kodama)-\d+[^"]*">(Hikari|Kodama) (\d+)<\/a><\/td><td>[^<]+<\/td><td>[^<]+<\/td><td><b>(\d{2}:\d{2})<\/b>/g)]
    .map((match) => `${match[1]}|${match[2]}|${match[3]}`);
  if (new Set(serviceKeys).size !== serviceKeys.length) {
    throw new Error("JR Pass table lists the same train number and Shin-Fuji time more than once");
  }

  const enUrl = "https://www.michikusa-travel.com/en/besides-fuji.html";
  const zhUrl = "https://www.michikusa-travel.com/zh-Hant/besides-fuji.html";
  requireFragment(besidesEn, `hreflang="zh-Hant-TW" href="${zhUrl}"`, "English Besides-Fuji zh-Hant alternate");
  requireFragment(besidesZh, `hreflang="en" href="${enUrl}"`, "Traditional Chinese Besides-Fuji English alternate");
  requireFragment(besidesZh, `hreflang="x-default" href="${enUrl}"`, "Traditional Chinese Besides-Fuji x-default alternate");
}

const KAKEGAWA_KODAMA = TIMETABLE.trains.filter(
  (train) => train.type === "Kodama" && train.times.Kakegawa,
).length;

applyTo(JRPASS_PAGE, START, END, generated, "JR Pass table");
applyTo(JRPASS_PAGE, LD_MARK_START, LD_MARK_END, ldScript(jrPassFaqLd(tokyoRange, KAKEGAWA_KODAMA)), "JR Pass structured data");
for (const langKey of Object.keys(LANGS)) {
  const page = path.join(appDir, LANGS[langKey].dir, "besides-fuji.html");
  if (!fs.existsSync(page)) continue;
  applyTo(page, BESIDES_START, BESIDES_END, besidesTableHTML(langKey), `Besides-Fuji table (${langKey})`);
  applyTo(page, LD_MARK_START, LD_MARK_END, ldScript(besidesItemListLd(langKey)), `Besides-Fuji structured data (${langKey})`);
}
validateInboundPageContracts();

const besidesCount = SPOTS.filter((spot) => !FUJI_VIEWPOINTS.has(spot.id)).length;
const summary =
  `JR Pass ${west.length} westbound + ${east.length} eastbound Kodama with a real Shin-Fuji stop ` +
  `(${tokyoRange} min from Tokyo); Besides-Fuji ${besidesCount} of ${SPOTS.length} views`;
console.log(`Inbound tables ${CHECK_ONLY ? "current" : "written"}: ${summary}.`);
