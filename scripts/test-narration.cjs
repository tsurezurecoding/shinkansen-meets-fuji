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
<p id="set-narr-help"></p>
<span id="set-dir-l"></span>
<select id="set-dir"><option value="auto"></option><option value="down"></option><option value="up"></option></select>
<button id="btn-stop"></button><button id="btn-close-settings"></button><p id="set-note"></p></div>
<div id="demo-panel" class="modal hidden"><h3 id="demo-title"></h3><p id="demo-desc"></p>
<span id="demo-from-l"></span><select id="demo-from"><option value="down"></option><option value="up"></option></select>
<span id="demo-speed-l"></span><select id="demo-mult"><option value="1"></option><option value="20" selected></option></select>
<button id="btn-demo-cancel"></button><button id="btn-demo-start"></button></div>
</body></html>`;

for (const e of require("./guide-copy-overrides.json").entries) {
  const bytes=fs.readFileSync(path.join(appDir,"live/audio",e.file));
  if(require("node:crypto").createHash("sha256").update(bytes).digest("hex")!==e.sha256) throw Error("Approved voice differs: "+e.file);
}
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
}

/* ---------- セットアップ: 実ファイルをjsdomに読み込み ---------- */

function createHarness(lang, options) {
  options = options || {};
  const query = lang === "en" ? "?lang=en" : "";
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url: "https://example.com" + (options.pathname || "/live/index.html") + query,
    pretendToBeVisual: true,
  });
  const w = dom.window;
  let gpsCb = null;
  let now = options.now || Date.now();
  const intervals = [];
  if (options.captureTimers) {
    w.Date.now = function () { return now; };
    w.setInterval = function (callback, delay) { intervals.push({ callback, delay }); return intervals.length; };
    w.clearInterval = function () {};
  }
  if (options.blockStorage) {
    w.Storage.prototype.setItem = function () { throw new w.DOMException("Storage blocked", "SecurityError"); };
  }

  // jsdomは安全なコンテキストとメディア再生を実装しない。ここでブラウザ契約だけを模擬し、
  // "Not implemented" の大量出力が検証結果を埋めないようにする。
  try { Object.defineProperty(w, "isSecureContext", { value: true }); } catch (e) { w.isSecureContext = true; }
  // feedApproachは同期的に時刻を進める。再生完了も同期で通知して、手前のスポットが
  // 再生中のまま後続ケースの観測を塞ぐというテスト環境だけの滞留を避ける。
  w.HTMLMediaElement.prototype.play = function () {
    if (typeof this.onended === "function") this.onended();
    return Promise.resolve();
  };
  w.HTMLMediaElement.prototype.pause = function () {};
  w.HTMLMediaElement.prototype.load = function () {};
  w.navigator.geolocation = {
    watchPosition: function (ok) { gpsCb = ok; return 1; },
    clearWatch: function () { gpsCb = null; },
  };

  // 注意: w.eval は呼び出しごとに字句スコープが分かれるため、必ず連結して単一evalする。
  w.eval(
    src("data.js") + "\n" +
    src("track.js") + "\n" +
    (options.omitNarration ? "" : src("live/narration.js")) + "\n" +
    "window.__TEST_SPOTS = SPOTS;\n" +
    (options.captureTimers ? "var originalSegmentAtKm = window.MADO_TRACK.segmentAtKm; window.MADO_TRACK.segmentAtKm = function(km) { window.__TEST_RENDER_KM = km; return originalSegmentAtKm(km); };\n" : "") +
    src("live/live.js")
  );
  return {
    dom: dom,
    w: w,
    d: w.document,
    T: w.MADO_TRACK,
    NARR: w.NARRATIONS || {},
    gps: function () { return gpsCb; },
    now: function () { return now; },
    tick: function (elapsed) { now += elapsed; intervals.filter(function (timer) { return timer.delay === 1000; }).forEach(function (timer) { timer.callback(); }); },
    renderKm: function () { return w.__TEST_RENDER_KM; },
  };
}

const base = createHarness("ja");
const w = base.w;
const T = base.T;
const NARR = base.NARR;
const spotsById = {};
w.__TEST_SPOTS.forEach(function (s) { spotsById[s.id] = s; });

const ids = Object.keys(NARR);
if (!ids.length) { console.error("NARRATIONS が空です"); process.exit(1); }
console.log("実況エントリ: " + ids.length + "件 [" + ids.join(", ") + "]");

function kmOf(id) {
  const sp = spotsById[id];
  // live.jsと同じく、手動補正済みviewpointを優先する。minutesFromTokyoだけを使うと
  // 現行データでは数kmずれる箇所があり、別スポットを検証してしまう。
  return sp.viewpoint && typeof sp.viewpoint.lat === "number" && typeof sp.viewpoint.lng === "number"
    ? T.projectToTrack(sp.viewpoint.lat, sp.viewpoint.lng).km
    : T.minToKm(sp.minutesFromTokyo);
}

// 同位置（±0.05km）に実況スポットが複数ある場合、next になるのは1つだけ。
// あるIDの検証時は「同位置グループの誰かの台本が出ていればよい」とする。
function coLocated(id) {
  const km = kmOf(id);
  return ids.filter(function (o) { return spotsById[o] && Math.abs(kmOf(o) - km) < 0.05; });
}

/* ---------- A. データ検証 ---------- */

console.log("\n== A. データ検証 ==");
const { firstSentences, seatFor } = require("./build-narration-from-data.cjs");
check("文分割: Mt. Fujiを文末にしない", firstSentences("Look for Mt. Fuji. Watch the window. Then stop.", 2) === "Look for Mt. Fuji. Watch the window.");
check("文分割: 小数を文末にしない", firstSentences("The view is 1.5 km away. Watch Mt. Kinsho. Then stop.", 2) === "The view is 1.5 km away. Watch Mt. Kinsho.");
check("文分割: 日本語の文末", firstSentences("まもなく茶畑です。両側に見えます。次は城です。", 2) === "まもなく茶畑です。両側に見えます。");
for (const dir of ["down", "up"]) {
  check("両側台本/" + dir, seatFor(spotsById["shizuoka-tea-fields"], dir, "en") === "Seats A and E");
  check("席記号固定/" + dir, seatFor(spotsById["tokyo-tower"], dir, "ja") === "E席側");
}
check("録音台本の対象37件を維持", ids.length === 37);
for (const id of ["left-fuji", "shimizu-port-chikyu", "shizuoka-tea-fields", "kinshozan"]) {
  for (const dir of ["down", "up"]) {
    check(id + "/" + dir + ": 英語台本がMt.で途切れない", !/\bMt\.$/.test(NARR[id][dir].en.text));
  }
}
for (const dir of ["down", "up"]) {
  const tea = NARR["shizuoka-tea-fields"][dir];
  check("茶畑/" + dir + ": 日英表示と読み上げが両側", /A席とE席/.test(tea.ja.text) && /A席とE席/.test(tea.ja.speechText) && /Seats A and E/.test(tea.en.text));
}
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

function feedApproach(h, targetKm, dir) {
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
    from = Math.min(targetKm + 8, h.T.totalKm - 0.1);
    to = Math.min(targetKm + 2.0, from - 0.01);
    if (from - to < 1.5) from = Math.min(to + 3.5, h.T.totalKm - 0.1);
  }
  const step = dir === "down" ? 0.35 : -0.35;
  let t = Date.now();
  for (let km = from; dir === "down" ? km <= to : km >= to; km += step) {
    t += 5000; // 5秒間隔 × 0.35km = 252km/h
    const p = h.T.latLngAtKm(km);
    h.gps()({ coords: { latitude: p.lat, longitude: p.lng, accuracy: 10, speed: 70 }, timestamp: t });
  }
}

function feedTriggerPoint(h, targetKm, dir) {
  // 対象の直前から新しい走行セッションを開始する。これにより、密集区間でも手前の別スポットの
  // 音声キューに検証対象が隠れず、「ETA 90秒以内なら対象がキュー候補になる」を直接検証できる。
  const km = dir === "down"
    ? Math.max(targetKm - 0.15, 0.01)
    : Math.min(targetKm + 0.15, h.T.totalKm - 0.01);
  const p = h.T.latLngAtKm(km);
  h.gps()({
    coords: { latitude: p.lat, longitude: p.lng, accuracy: 10, speed: 70 },
    timestamp: Date.now(),
  });
}

function runCase(id, dir) {
  // 実運用ではstopで走行状態はリセットされるが、音声キューの非同期完了まで同一DOMで
  // 次ケースへ進むと前ケースの台本を観測し得る。各ケースを新しいページとして独立させる。
  const h = createHarness("ja");
  const doc = h.d;
  const targetKm = kmOf(id);
  // 全NARRATIONSエントリを対象にするため「すべて」モードへ切り替える。
  // 主要モードのままではcategory=curiousが出ないのが正しい製品仕様。
  doc.getElementById("btn-narr-toggle").click();
  if (dir === "down") {
    doc.getElementById("btn-dir").click();
  } else {
    doc.getElementById("btn-dir").click();
    doc.getElementById("btn-dir").click();
  }
  doc.getElementById("btn-start").click();
  feedTriggerPoint(h, targetKm, dir);

  const visible = doc.getElementById("narrbar").className.indexOf("hidden") === -1;
  check(id + "/" + dir + ": 実況バー表示", visible);
  if (!visible) { h.dom.window.close(); return; }
  const lang = doc.documentElement.lang === "en" ? "en" : "ja";
  const candidates = coLocated(id)
    .map(function (o) { return NARR[o][dir] && NARR[o][dir][lang] && NARR[o][dir][lang].text; })
    .filter(Boolean);
  const txt = doc.getElementById("nr-text").textContent;
  check(id + "/" + dir + ": 台本一致（同位置グループ内）", candidates.indexOf(txt) !== -1, txt);
  h.dom.window.close();
}

ids.forEach(function (id) {
  if (!spotsById[id]) return;
  if (NARR[id].down) runCase(id, "down");
  if (NARR[id].up) runCase(id, "up");
});

/* ---------- C. UI操作（代表スポットで1回ずつ） ---------- */

console.log("\n== C. UI操作 ==");
function gapHarness(hidden) {
  const h = createHarness("ja", { captureTimers: true, now: 1800000000000 });
  h.d.getElementById("btn-dir").click();
  h.d.getElementById("btn-start").click();
  const p = h.T.latLngAtKm(100);
  h.gps()({ coords: { latitude: p.lat, longitude: p.lng, accuracy: 10, speed: 250 / 3.6 }, timestamp: h.now() });
  if (hidden) Object.defineProperty(h.d, "visibilityState", { configurable: true, value: "hidden" });
  return h;
}
const visibleGap = gapHarness(false);
const delayedGap = gapHarness(true);
const hiddenGap = gapHarness(true);
const startGapKm = visibleGap.renderKm();
for (let sec = 0; sec < 30; sec += 1) { visibleGap.tick(1000); hiddenGap.tick(1000); }
delayedGap.tick(15000);
delayedGap.tick(15000);
// 表示間引き中にも更新済みの位置を、表示復帰後のcallbackで観測する。
Object.defineProperty(hiddenGap.d, "visibilityState", { configurable: true, value: "visible" });
hiddenGap.tick(0);
check("15秒へ間引かれたtimerでも実時間30秒の距離を補完", Math.abs(delayedGap.renderKm() - startGapKm - 100 * 30 / 3600) < 0.001);
check("可視/非表示/遅延timerが同じ補完位置", Math.abs(visibleGap.renderKm() - delayedGap.renderKm()) < 0.001 && Math.abs(hiddenGap.renderKm() - delayedGap.renderKm()) < 0.001);

const pausedKm = visibleGap.renderKm();
visibleGap.d.getElementById("btn-pause").click();
visibleGap.tick(20000);
visibleGap.d.getElementById("btn-pause").click();
visibleGap.tick(1000);
check("一時停止中の20秒を補完距離へ加えない", Math.abs(visibleGap.renderKm() - pausedKm - 100 / 3600) < 0.001);

const boundedGap = gapHarness(false);
boundedGap.tick(70000);
const limitKm = boundedGap.renderKm();
boundedGap.tick(2000);
check("実測から72秒の既存上限で補完を止める", boundedGap.renderKm() === limitKm);
const fresh = boundedGap.T.latLngAtKm(102);
boundedGap.gps()({ coords: { latitude: fresh.lat, longitude: fresh.lng, accuracy: 10, speed: 250 / 3.6 }, timestamp: boundedGap.now() });
const freshKm = boundedGap.renderKm();
boundedGap.tick(15000);
check("実GPS復帰で補完基準を戻し過去の欠測を再加算しない", boundedGap.renderKm() > freshKm && boundedGap.renderKm() - freshKm < 1);
for (const h of [visibleGap, delayedGap, hiddenGap, boundedGap]) h.dom.window.close();

check("主要音声数は実台本の27件", /27/.test(base.d.getElementById("set-narr-help").textContent) && !/36/.test(base.d.getElementById("set-narr-help").textContent));
for (const locale of ["ja", "en"]) {
  const blocked = createHarness(locale, { blockStorage: true });
  check("保存禁止でもライブ起動/" + locale, blocked.d.documentElement.lang === locale && blocked.d.getElementById("idle-title").textContent.length > 0);
  const appSource = src("app.js");
  blocked.w.eval(appSource.slice(appSource.indexOf("function getInitialLang()"), appSource.indexOf("let lang = getInitialLang();")) + "\nwindow.__APP_LANG = getInitialLang();");
  check("保存禁止でもタイムライン初期言語/" + locale, blocked.w.__APP_LANG === locale);
  blocked.d.getElementById("btn-dir").click();
  blocked.d.getElementById("btn-start").click();
  const p = blocked.T.latLngAtKm(100);
  blocked.gps()({ coords: { latitude: p.lat, longitude: p.lng, accuracy: 10, speed: 70 }, timestamp: Date.now() });
  blocked.d.getElementById("btn-settings").click();
  blocked.d.getElementById("set-follow").checked = false;
  blocked.d.getElementById("set-narr-mode").value = "off";
  blocked.d.getElementById("btn-close-settings").click();
  check("保存禁止でも変更した設定modalを閉じる/" + locale, blocked.d.getElementById("settings").classList.contains("hidden"));
  check("保存禁止でも現在の設定とGPS案内を継続/" + locale, /OFF/.test(blocked.d.getElementById("btn-narr-toggle").textContent) && typeof blocked.gps() === "function" && !blocked.d.getElementById("btn-pause").classList.contains("hidden"));
  blocked.d.getElementById("btn-settings").click();
  check("保存禁止でもセッション内の設定を保持/" + locale, !blocked.d.getElementById("set-follow").checked && blocked.d.getElementById("set-narr-mode").value === "off");
  blocked.dom.window.close();
}
const blockedEnPath = createHarness("ja", { blockStorage: true, pathname: "/en/live/" });
check("保存禁止でも英語パスのライブ起動", blockedEnPath.d.documentElement.lang === "en");
blockedEnPath.dom.window.close();
const loadingNarration = createHarness("ja", { omitNarration: true });
check("台本未ロード時に主要36件と誤表示しない", !/36/.test(loadingNarration.d.getElementById("set-narr-help").textContent) && /音声のある/.test(loadingNarration.d.getElementById("set-narr-help").textContent));
loadingNarration.dom.window.close();

// 誤った上り設定では将来の伊吹山が過去欄に入る。下りへ戻す2入口の双方で消えること。
for (const viaSettings of [false, true]) {
  const dirUi = createHarness("ja");
  dirUi.d.getElementById("btn-dir").click();
  dirUi.d.getElementById("btn-start").click();
  const p = dirUi.T.latLngAtKm(100);
  dirUi.gps()({ coords: { latitude: p.lat, longitude: p.lng, accuracy: 10, speed: 70 }, timestamp: Date.now() });
  const futureName = spotsById.ibuki.ja.name;
  dirUi.d.getElementById("btn-dir").click();
  check("方向を誤った時の履歴を再現/" + viaSettings, dirUi.d.getElementById("passed").textContent.includes(futureName));
  if (viaSettings) {
    dirUi.d.getElementById("set-dir").value = "down";
    dirUi.d.getElementById("btn-close-settings").click();
  } else {
    dirUi.d.getElementById("btn-dir").click();
    dirUi.d.getElementById("btn-dir").click();
  }
  check("方向を戻した時に未来のスポットを過去欄から除去/" + viaSettings, !dirUi.d.getElementById("passed").textContent.includes(futureName));
  dirUi.dom.window.close();
}
const rep = ids[0];
const ui = createHarness("ja");
const ud = ui.d;
ud.getElementById("btn-dir").click();
ud.getElementById("btn-start").click();
feedApproach(ui, kmOf(rep), "down");

// 現行UIの言語切替は別URLへの遷移なので、英語URLを独立起動して英語台本を検証する。
const en = createHarness("en");
en.d.getElementById("btn-dir").click();
en.d.getElementById("btn-start").click();
feedApproach(en, kmOf(rep), "down");
const cand2 = coLocated(rep).map(function (o) { return NARR[o].down && NARR[o].down.en && NARR[o].down.en.text; }).filter(Boolean);
check("英語URLで英語台本表示", en.d.documentElement.lang === "en" && cand2.indexOf(en.d.getElementById("nr-text").textContent) !== -1);
en.dom.window.close();

// 一時停止で実況が消える
ud.getElementById("btn-pause").click();
check("一時停止で実況バー非表示", ud.getElementById("narrbar").className.indexOf("hidden") !== -1);
ud.getElementById("btn-pause").click(); // 再開

// ×で閉じる（再表示させてから）
ud.getElementById("btn-stop").click();
ud.getElementById("btn-start").click();
feedApproach(ui, kmOf(rep), "down");
ud.getElementById("nr-close").click();
check("×で閉じる", ud.getElementById("narrbar").className.indexOf("hidden") !== -1);

// 実況トグルOFFで出ない（主要 -> すべて -> OFF）
ud.getElementById("btn-narr-toggle").click();
ud.getElementById("btn-narr-toggle").click();
ud.getElementById("btn-stop").click();
ud.getElementById("btn-start").click();
feedApproach(ui, kmOf(rep), "down");
check("実況OFFで表示されない", ud.getElementById("narrbar").className.indexOf("hidden") !== -1);
ud.getElementById("btn-narr-toggle").click(); // 主要に戻す

// 停止でリセット
ud.getElementById("btn-stop").click();
check("停止でアイドルに戻る", ud.getElementById("idle-panel").className.indexOf("hidden") === -1);
check("停止後は実況バー非表示", ud.getElementById("narrbar").className.indexOf("hidden") !== -1);
ui.dom.window.close();
base.dom.window.close();

console.log("");
if (fail === 0) {
  console.log("ALL_PASS (" + pass + "項目)");
  process.exit(0);
} else {
  console.log("FAILURES: " + fail + " / PASS: " + pass);
  process.exit(1);
}
