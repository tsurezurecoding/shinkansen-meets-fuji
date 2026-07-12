/* =========================================================
 * AI車窓実況 回帰テスト（方向対応スキーマ down/up × ja/en）
 *
 * 使い方:
 *   npm install jsdom --silent   (初回のみ)
 *   node app/scripts/test-narration.cjs [appディレクトリの絶対パス]
 *
 * 実データ（data.js / track.js / live/narration.js / live/live.js）を読み込み:
 *  A. データ検証 — SPOTSに存在するID / down・up各方向にja・en台本 /
 *     audio明示時の命名規約 / 台本長の目安
 *  B. 動作検証 — GPSを模擬し、下り・上り両方向で各実況スポットの
 *     ETA90秒圏に入った時に実況バーが表示され台本が一致するか。
 *     言語切替・×クローズ・一時停止・停止リセットも確認
 *  同一km地点に複数の実況スポットがある場合（例: hamanako と
 *  hamanako-fuji）は next になれる方だけが実況される仕様のため、
 *  「同位置グループのいずれかの台本」が出ていればPASSとする。
 * ALL_PASS 以外はリリース不可。
 * ========================================================= */

"use strict";

const fs = require("fs");
const path = require("path");

const appDir = path.resolve(process.argv[2] || path.join(__dirname, ".."));

let JSDOM;
try {
  ({ JSDOM } = require("jsdom"));
} catch (e) {
  console.error("jsdom が必要です: npm install jsdom --silent");
  process.exit(2);
}

function src(p) { return fs.readFileSync(path.join(appDir, p), "utf8"); }

const html = `<!doctype html><html><head></head><body>
<button id="btn-lang">EN</button>
<strong id="live-title"></strong><span id="tb-status"></span>
<span id="tb-speed"></span><button id="btn-dir"></button><button id="btn-pause" class="hidden"></button>
<button id="btn-narr-toggle"></button><button id="btn-settings"></button>
<div id="live-map-controls" class="hidden"><button id="map-narr-toggle"></button><button id="map-pause"></button><button id="map-stop"></button></div>
<div id="map"></div><div id="segband" class="hidden"></div>
<div id="alertbar" class="hidden"><div id="al-icon"></div><div id="al-count"></div><span id="al-name"></span><span id="al-side"></span><button id="al-close"></button></div>
<div id="narrbar" class="hidden"><span id="nr-tag"></span><span id="nr-name"></span><button id="nr-close"></button><p id="nr-text"></p></div>
<div id="next-card" class="hidden"><span id="nc-label"></span><span id="nc-eta"></span><div id="nc-icon"></div><div id="nc-name"></div><div id="nc-hook"></div><span id="nc-side"></span><span id="nc-dist"></span><span id="nc-dur"></span><img id="nc-photo" class="hidden"></div>
<div id="upcoming"></div>
<details id="passed-wrap" class="hidden"><summary id="passed-summary"></summary><div id="passed"></div></details>
<div id="idle-panel"><h2 id="idle-title"></h2><p id="idle-desc"></p><button id="btn-start"></button><button id="btn-demo"></button></div>
<div id="settings" class="modal hidden"><h3 id="set-title"></h3>
<input type="checkbox" id="set-vib"><span id="set-vib-l"></span>
<input type="checkbox" id="set-wake"><span id="set-wake-l"></span>
<input type="checkbox" id="set-follow"><span id="set-follow-l"></span>
<span id="set-narr-mode-l"></span>
<select id="set-narr-mode"><option value="featured"></option><option value="all"></option><option value="off"></option></select>
<span id="set-dir-l"></span>
<select id="set-dir"><option value="auto"></option><option value="down"></option><option value="up"></option></select>
<button id="btn-stop"></button><button id="btn-close-settings"></button><p id="set-note"></p></div>
<div id="demo-panel" class="modal hidden"><h3 id="demo-title"></h3><p id="demo-desc"></p>
<span id="demo-from-l"></span><select id="demo-from"><option value="down"></option><option value="up"></option></select>
<span id="demo-speed-l"></span><select id="demo-mult"><option value="1"></option><option value="20" selected></option></select>
<button id="btn-demo-cancel"></button><button id="btn-demo-start"></button></div>
</body></html>`;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
}

/* ---------- セットアップ: 実ファイルをjsdomに読み込み ---------- */

const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.com/live/index.html", pretendToBeVisual: true });
const w = dom.window;

// jsdomは isSecureContext を実装しないため明示的に与える（無いとstartGpsが拒否する）
try { Object.defineProperty(w, "isSecureContext", { value: true }); } catch (e) { w.isSecureContext = true; }

// GPS模擬: watchPositionのコールバックを捕まえて任意の位置を注入できるようにする
let gpsCb = null;
w.navigator.geolocation = {
  watchPosition: function (ok) { gpsCb = ok; return 1; },
  clearWatch: function () { gpsCb = null; },
};

// 注意: w.eval は呼び出しごとに字句スコープが分かれ、data.js の const SPOTS が
// live.js から見えなくなる（ブラウザの<script>連結と挙動が違う）。必ず連結して単一evalする。
w.eval(
  src("data.js") + "\n" +
  src("track.js") + "\n" +
  src("live/narration.js") + "\n" +
  "window.__TEST_SPOTS = SPOTS;\n" +
  src("live/live.js")
);

const d = w.document;
const T = w.MADO_TRACK;
const NARR = w.NARRATIONS || {};
const spotsById = {};
w.__TEST_SPOTS.forEach(function (s) { spotsById[s.id] = s; });

const ids = Object.keys(NARR);
if (!ids.length) { console.error("NARRATIONS が空です"); process.exit(1); }
console.log("実況エントリ: " + ids.length + "件 [" + ids.join(", ") + "]");

function kmOf(id) { return T.minToKm(spotsById[id].minutesFromTokyo); }

// 同位置（±0.05km）に実況スポットが複数ある場合、next になるのは1つだけ。
// あるIDの検証時は「同位置グループの誰かの台本が出ていればよい」とする。
function coLocated(id) {
  const km = kmOf(id);
  return ids.filter(function (o) { return spotsById[o] && Math.abs(kmOf(o) - km) < 0.05; });
}

/* ---------- A. データ検証 ---------- */

console.log("\n== A. データ検証 ==");
ids.forEach(function (id) {
  const n = NARR[id];
  const sp = spotsById[id];
  check(id + ": SPOTSに存在", !!sp);
  if (!sp) return;
  const dirs = ["down", "up"].filter(function (k) { return n[k]; });
  check(id + ": down/upの少なくとも一方あり", dirs.length > 0);
  dirs.forEach(function (dir) {
    const e = n[dir];
    check(id + "/" + dir + ": ja/en台本あり", !!(e.ja && e.ja.text && e.en && e.en.text));
    ["ja", "en"].forEach(function (lang) {
      const item = e[lang];
      if (!item) return;
      if (item.audio && item.audio !== false) {
        check(id + "/" + dir + "/" + lang + ": 音声パス命名",
          item.audio === "audio/" + id + "_" + dir + "_" + lang + ".mp3", item.audio);
      }
      if (lang === "ja" && item.text) {
        check(id + "/" + dir + ": ja台本長 45〜320字", item.text.length >= 45 && item.text.length <= 320, item.text.length + "字");
      }
      if (lang === "en" && item.text) {
        const words = item.text.trim().split(/\s+/).length;
        check(id + "/" + dir + ": en台本長 18〜150語", words >= 18 && words <= 150, words + "語");
      }
    });
  });
});

/* ---------- B. 動作検証（GPS模擬・下り／上り） ---------- */

console.log("\n== B. 動作検証 ==");

function feedApproach(targetKm, dir) {
  // 目標の約8km手前から250km/h相当で、目標の2km手前まで接近する。
  // 2km手前=ETA約29秒で、直前の隣接スポット（例: キリン→清洲は3.4km差）を
  // 通過し終えて目標自身が next になった状態で実況が発火する。
  // 路線端に近い場合はレンジを自動調整する。
  let from, to;
  if (dir === "down") {
    from = Math.max(targetKm - 8, 0.1);
    to = Math.max(targetKm - 2.0, from + 0.01);
    if (to - from < 1.5) from = Math.max(to - 3.5, 0.1);
  } else {
    from = Math.min(targetKm + 8, T.totalKm - 0.1);
    to = Math.min(targetKm + 2.0, from - 0.01);
    if (from - to < 1.5) from = Math.min(to + 3.5, T.totalKm - 0.1);
  }
  const step = dir === "down" ? 0.35 : -0.35;
  let t = Date.now();
  for (let km = from; dir === "down" ? km <= to : km >= to; km += step) {
    t += 5000; // 5秒間隔 × 0.35km = 252km/h
    const p = T.latLngAtKm(km);
    gpsCb({ coords: { latitude: p.lat, longitude: p.lng, accuracy: 10, speed: 70 }, timestamp: t });
  }
}

function runCase(id, dir) {
  const targetKm = kmOf(id);
  d.getElementById("btn-stop").click();
  d.getElementById("btn-start").click();
  feedApproach(targetKm, dir);

  const visible = d.getElementById("narrbar").className.indexOf("hidden") === -1;
  check(id + "/" + dir + ": 実況バー表示", visible);
  if (!visible) return;
  const lang = d.documentElement.lang === "en" ? "en" : "ja";
  const candidates = coLocated(id)
    .map(function (o) { return NARR[o][dir] && NARR[o][dir][lang] && NARR[o][dir][lang].text; })
    .filter(Boolean);
  const txt = d.getElementById("nr-text").textContent;
  check(id + "/" + dir + ": 台本一致（同位置グループ内）", candidates.indexOf(txt) !== -1);
}

ids.forEach(function (id) {
  if (!spotsById[id]) return;
  if (NARR[id].down) runCase(id, "down");
  if (NARR[id].up) runCase(id, "up");
});

/* ---------- C. UI操作（代表スポットで1回ずつ） ---------- */

console.log("\n== C. UI操作 ==");
const rep = ids[0];
d.getElementById("btn-stop").click();
d.getElementById("btn-start").click();
feedApproach(kmOf(rep), "down");

// 言語切替で台本が切り替わる
d.getElementById("btn-lang").click();
const lang2 = d.documentElement.lang === "en" ? "en" : "ja";
const cand2 = coLocated(rep).map(function (o) { return NARR[o].down && NARR[o].down[lang2] && NARR[o].down[lang2].text; }).filter(Boolean);
check("言語切替で台本切替", cand2.indexOf(d.getElementById("nr-text").textContent) !== -1);
d.getElementById("btn-lang").click();

// 一時停止で実況が消える
d.getElementById("btn-pause").click();
check("一時停止で実況バー非表示", d.getElementById("narrbar").className.indexOf("hidden") !== -1);
d.getElementById("btn-pause").click(); // 再開

// ×で閉じる（再表示させてから）
d.getElementById("btn-stop").click();
d.getElementById("btn-start").click();
feedApproach(kmOf(rep), "down");
d.getElementById("nr-close").click();
check("×で閉じる", d.getElementById("narrbar").className.indexOf("hidden") !== -1);

// 実況トグルOFFで出ない（主要 -> すべて -> OFF）
d.getElementById("btn-narr-toggle").click();
d.getElementById("btn-narr-toggle").click();
d.getElementById("btn-stop").click();
d.getElementById("btn-start").click();
feedApproach(kmOf(rep), "down");
check("実況OFFで表示されない", d.getElementById("narrbar").className.indexOf("hidden") !== -1);
d.getElementById("btn-narr-toggle").click(); // 主要に戻す

// 停止でリセット
d.getElementById("btn-stop").click();
check("停止でアイドルに戻る", d.getElementById("idle-panel").className.indexOf("hidden") === -1);
check("停止後は実況バー非表示", d.getElementById("narrbar").className.indexOf("hidden") !== -1);

console.log("");
if (fail === 0) {
  console.log("ALL_PASS (" + pass + "項目)");
  process.exit(0);
} else {
  console.log("FAILURES: " + fail + " / PASS: " + pass);
  process.exit(1);
}
