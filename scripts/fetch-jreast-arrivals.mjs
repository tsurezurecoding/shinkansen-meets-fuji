#!/usr/bin/env node
/*
 * fetch-jreast-arrivals.mjs — 公式時刻表から途中停車駅の「着」時刻を取り込む。
 *
 * data/timetable.js の times は各駅の発時刻（終着だけ着時刻）しか持たない。
 * こだま・ひかりは途中駅で1〜6分停車するため、発時刻だけで駅間を補間すると
 * 通過予測が最大5分遅れる（2026-09-15の実走7便の分析）。そこで列車ごとに
 * arrivals（途中停車駅の着時刻）を追加し、train-select.js が前駅発→次駅着で補間する。
 *
 * 取得元: JR東日本の時刻表（英語版）。品川駅の東海道新幹線 上下×平日/土休日の
 * 駅時刻表から列車ページをたどる。東海道新幹線は全列車が品川に停車するので漏れない。
 * 列車ページは Arr./Dep. を別々に載せる。版（URLの4桁）が変わると列車ページのIDが
 * 振り直されるため、既存の sourceUrl は使わず毎回駅時刻表からたどる。
 *
 * 既存の発時刻は書き換えない。公式の発時刻が全停車駅でデータと一致した列車にだけ
 * arrivals を入れ、食い違う列車は報告して触らない（ダイヤ改正の混入を防ぐ）。
 *
 * 使い方:
 *   node scripts/fetch-jreast-arrivals.mjs            # 取得して差分を報告（書き込まない）
 *   node scripts/fetch-jreast-arrivals.mjs --write    # data/timetable.js へ書き込む
 *   --cache <dir>  取得したHTMLを保存・再利用する（再実行時にサイトへ負荷をかけない）
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const BASE = "https://timetables.jreast.co.jp/en";
const SHINAGAWA = "0788";
const STATION_PAGES = ["010", "011", "020", "021"]; // 下り平日/土休日、上り平日/土休日
const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const cacheIdx = args.indexOf("--cache");
const CACHE = cacheIdx >= 0 ? args[cacheIdx + 1] : null;
const timetablePath = new URL("../data/timetable.js", import.meta.url);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const cacheFile = CACHE ? path.join(CACHE, url.replace(/^https?:\/\//, "").replace(/[^\w.-]+/g, "_")) : null;
  if (cacheFile && existsSync(cacheFile)) return readFile(cacheFile, "utf8");
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "michikusa-timetable-sync (+https://michikusa-travel.com)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      const text = await res.text();
      if (cacheFile) await writeFile(cacheFile, text);
      await sleep(250); // 公開サイトへの配慮
      return text;
    } catch (error) {
      if (attempt >= 3) throw error;
      await sleep(1500 * attempt);
    }
  }
}

const toText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

async function detectEdition() {
  const html = await get(`${BASE}/timetable/list${SHINAGAWA}.html`);
  const m = html.match(/\.\.\/(\d{4})\/timetable\/tt0788\//);
  if (!m) throw new Error("Could not detect the timetable edition from the Shinagawa station page");
  return m[1];
}

async function collectTrainUrls(edition) {
  const urls = new Set();
  for (const page of STATION_PAGES) {
    const html = await get(`${BASE}/${edition}/timetable/tt${SHINAGAWA}/${SHINAGAWA}${page}.html`);
    for (const m of html.matchAll(/href="\.\.\/\.\.\/train\/(\d+\/\d+\.html)"/g)) {
      urls.add(`${BASE}/${edition}/train/${m[1]}`);
    }
  }
  return [...urls];
}

function parseTrainPage(html, stationNames) {
  const text = toText(html);
  const name = text.match(/Train name (Nozomi|Hikari|Kodama) (\d+)/);
  if (!name) return null;
  const start = text.indexOf("Station name Time Track");
  const end = text.indexOf("Remarks", start);
  if (start < 0) return null;
  const body = text.slice(start + "Station name Time Track".length, end < 0 ? undefined : end);
  // 駅名を長い順に試して、「駅名 HH:MM Arr. HH:MM Dep.」などを読む
  const alt = [...stationNames].sort((a, b) => b.length - a.length).map((s) => s.replace(/[-.]/g, "\\$&")).join("|");
  // 番線の無い駅（掛川など）は「Dep.」の直後に次の駅名が来るので、区切りの空白は消費しない
  const re = new RegExp(`(?:^|\\s)(${alt}) (\\d{1,2}:\\d{2} (?:Arr|Dep)\\.(?: \\d{1,2}:\\d{2} (?:Arr|Dep)\\.)*)`, "g");
  const stops = {};
  for (const m of body.matchAll(re)) {
    const entry = {};
    for (const t of m[2].matchAll(/(\d{1,2}):(\d{2}) (Arr|Dep)\./g)) {
      entry[t[3] === "Arr" ? "arr" : "dep"] = `${t[1].padStart(2, "0")}:${t[2]}`;
    }
    stops[m[1]] = entry;
  }
  return { type: name[1], number: Number(name[2]), stops };
}

const src = await readFile(timetablePath, "utf8");
const ctx = { window: {} };
vm.runInNewContext(src, ctx);
const timetable = ctx.window.SHINKANSEN_TIMETABLE;
const enToId = new Map(timetable.stations.map((s) => [s.en, s.id]));

if (CACHE) await mkdir(CACHE, { recursive: true });
const edition = await detectEdition();
const trainUrls = await collectTrainUrls(edition);
console.log(`Edition ${edition}: ${trainUrls.length} train pages from Shinagawa`);

const official = [];
for (const [i, url] of trainUrls.entries()) {
  const parsed = parseTrainPage(await get(url), enToId.keys());
  if (parsed) official.push({ ...parsed, url });
  if ((i + 1) % 100 === 0) console.log(`  fetched ${i + 1}/${trainUrls.length}`);
}

// 公式の発時刻（始発は発、途中は発、終着は着）を times と同じ形にそろえる
function officialTimes(o) {
  const times = {};
  for (const [en, e] of Object.entries(o.stops)) times[enToId.get(en)] = e.dep || e.arr;
  return times;
}

const report = { matched: 0, added: 0, noOfficial: [], timeMismatch: [] };
for (const train of timetable.trains) {
  const candidates = official.filter((o) => o.type === train.type && o.number === train.number);
  const exact = candidates.find((o) => {
    const ot = officialTimes(o);
    return Object.entries(train.times).every(([id, t]) => ot[id] === t);
  });
  if (!exact) {
    if (!candidates.length) report.noOfficial.push(`${train.type} ${train.number}`);
    else {
      const ot = officialTimes(candidates[0]);
      const diff = Object.entries(train.times).filter(([id, t]) => ot[id] !== t).map(([id, t]) => `${id} ${t}→${ot[id] ?? "なし"}`);
      report.timeMismatch.push(`${train.type} ${train.number}: ${diff.join(", ")}`);
    }
    continue;
  }
  report.matched++;
  const arrivals = {};
  for (const [en, e] of Object.entries(exact.stops)) {
    const id = enToId.get(en);
    // 途中停車駅だけ（始発は着なし、終着の着は times が既に持つ）
    // times に載っている駅だけ（データが山陽区間の一部駅を持たない列車がある）
    if (e.arr && e.dep && train.times[id] && id !== train.originStation && id !== train.destination) arrivals[id] = e.arr;
  }
  if (!Object.keys(arrivals).length) continue;
  // キー順を保つ: times の直後に arrivals を置く
  const rebuilt = {};
  for (const [k, v] of Object.entries(train)) {
    if (k === "arrivals") continue;
    rebuilt[k] = v;
    if (k === "times") rebuilt.arrivals = arrivals;
  }
  for (const k of Object.keys(train)) delete train[k];
  Object.assign(train, rebuilt);
  report.added++;
}

console.log(`Matched ${report.matched}/${timetable.trains.length} trains exactly; arrivals added to ${report.added}.`);
if (report.noOfficial.length) console.log(`No official page (${report.noOfficial.length}): ${report.noOfficial.join(", ")}`);
if (report.timeMismatch.length) {
  console.log(`Departure times differ from the ${edition} edition (${report.timeMismatch.length}), arrivals not added:`);
  for (const line of report.timeMismatch) console.log(`  ${line}`);
}

if (WRITE) {
  timetable.arrivalsSource = {
    name: "JR East timetable (English), train pages reached from the Shinagawa Tokaido Shinkansen station timetables",
    url: `${BASE}/timetable/list${SHINAGAWA}.html`,
    edition,
    fetchedAt: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), // JST
  };
  await writeFile(timetablePath, `window.SHINKANSEN_TIMETABLE = ${JSON.stringify(timetable, null, 2)};\n`);
  console.log("Wrote data/timetable.js");
}
