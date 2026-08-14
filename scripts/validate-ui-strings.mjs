// Pins the UI strings that are duplicated ACROSS files.
//
// app.js (MSG), spot-page-shared.js (UI) and generate-spot-pages.mjs (UI) are three
// separate tables because they run in three different places: the app shell, the
// shared spot-page renderer, and the build-time generator. They are mostly disjoint
// -- only the site chrome (nav labels, brand, seat side, rail copy) genuinely
// overlaps. There is no shared module to merge them into without adding a <script>
// tag to every page, so instead this validator asserts that the overlapping strings
// stay in agreement, and that the keys it depends on still exist.
//
// When a label legitimately differs between tables (a compact badge vs a full
// label, say), narrow the group's `langs` instead of deleting the group, and say
// why in `note`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SOURCES = {
  "app.js": { file: "app.js", anchor: /const MSG\s*=/ },
  "spot-page-shared.js": { file: "spot-page-shared.js", anchor: /var UI\s*=/ },
  "generate-spot-pages.mjs": { file: path.join("scripts", "generate-spot-pages.mjs"), anchor: /const UI\s*=/ },
};

// Every group below holds strings that must stay identical across files.
const LINKED = [
  { note: "site name", langs: ["ja", "en"], keys: [["app.js", "brandName"], ["spot-page-shared.js", "brand"], ["generate-spot-pages.mjs", "brand"], ["generate-spot-pages.mjs", "fallbackCredit"]] },
  { note: "site tagline", langs: ["ja", "en"], keys: [["app.js", "brandSub"], ["spot-page-shared.js", "brandSub"]] },
  { note: "nav: train picker", langs: ["ja", "en"], keys: [["app.js", "navStart"], ["spot-page-shared.js", "train"]] },
  { note: "nav: live guide", langs: ["ja", "en"], keys: [["app.js", "navLive"], ["spot-page-shared.js", "live"]] },
  { note: "nav: field guide", langs: ["ja", "en"], keys: [["app.js", "navBrowse"], ["spot-page-shared.js", "fieldGuide"]] },
  { note: "nav: FAQ", langs: ["ja", "en"], keys: [["app.js", "navFaq"], ["spot-page-shared.js", "faq"]] },
  { note: "nav: medal book", langs: ["ja", "en"], keys: [["app.js", "navMedals"], ["spot-page-shared.js", "journal"]] },
  { note: "nav: more", langs: ["ja", "en"], keys: [["app.js", "navMore"], ["spot-page-shared.js", "more"]] },
  { note: "nav: about", langs: ["ja", "en"], keys: [["app.js", "navLp"], ["spot-page-shared.js", "about"]] },
  { note: "nav: visibility forecast", langs: ["ja", "en"], keys: [["app.js", "navMieru"], ["spot-page-shared.js", "forecast"]] },
  { note: "nav: ink-wash", langs: ["ja", "en"], keys: [["app.js", "navSumie"], ["spot-page-shared.js", "sumie"]] },
  { note: "nav: window revue", langs: ["ja", "en"], keys: [["app.js", "navSomato"], ["spot-page-shared.js", "somato"]] },
  { note: "nav: links", langs: ["ja", "en"], keys: [["app.js", "navRefs"], ["spot-page-shared.js", "links"]] },
  { note: "nav: contact", langs: ["ja", "en"], keys: [["app.js", "navContact"], ["spot-page-shared.js", "contact"]] },
  { note: "nav: privacy", langs: ["ja", "en"], keys: [["app.js", "navPrivacy"], ["spot-page-shared.js", "privacy"]] },
  { note: "close button", langs: ["ja", "en"], keys: [["app.js", "quickModalClose"], ["generate-spot-pages.mjs", "lightboxClose"]] },
  { note: "rail: eyebrow", langs: ["ja", "en"], keys: [["spot-page-shared.js", "railEyebrow"], ["generate-spot-pages.mjs", "railEyebrow"]] },
  { note: "rail: title", langs: ["ja", "en"], keys: [["spot-page-shared.js", "railTitle"], ["generate-spot-pages.mjs", "railTitle"]] },
  { note: "rail: count suffix", langs: ["ja", "en"], keys: [["spot-page-shared.js", "railCountSuffix"], ["generate-spot-pages.mjs", "railCountSuffix"]] },
  { note: "rail: CTA", langs: ["ja", "en"], keys: [["spot-page-shared.js", "railCta"], ["generate-spot-pages.mjs", "railCta"]] },
  { note: "rail: footer link", langs: ["ja", "en"], keys: [["spot-page-shared.js", "railFoot"], ["generate-spot-pages.mjs", "railFoot"]] },
  { note: "seat side: both", langs: ["ja", "en"], keys: [["spot-page-shared.js", "sideBoth"], ["generate-spot-pages.mjs", "sideBoth"]] },
  { note: "seat side: Hamanako", langs: ["ja", "en"], keys: [["spot-page-shared.js", "hamanakoSide"], ["generate-spot-pages.mjs", "hamanakoSide"]] },
  { note: "seat side A, full label", langs: ["ja", "en"], keys: [["spot-page-shared.js", "sideA"], ["generate-spot-pages.mjs", "sideA"]] },
  { note: "seat side E, full label", langs: ["ja", "en"], keys: [["spot-page-shared.js", "sideE"], ["generate-spot-pages.mjs", "sideE"]] },
  // ja only: English deliberately splits these into a compact and a long form.
  { note: "seat side A: app.js is the compact badge (EN 'Seat A' vs 'Seat A · sea side')", langs: ["ja"], keys: [["app.js", "seatA"], ["spot-page-shared.js", "sideA"]] },
  { note: "seat side E: app.js is the compact badge (EN 'Seat E' vs 'Seat E · mountain side')", langs: ["ja"], keys: [["app.js", "seatE"], ["spot-page-shared.js", "sideE"]] },
  { note: "read-the-guide action (EN 'Read guide' vs 'Read the guide')", langs: ["ja"], keys: [["app.js", "readGuide"], ["generate-spot-pages.mjs", "mobileSpotAction"]] },
];

function objectLiteralAt(source, anchor) {
  const m = source.match(anchor);
  if (!m) return null;
  const start = source.indexOf("{", m.index);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(source, i);
      continue;
    }
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

function skipString(source, start) {
  const quote = source[start];
  for (let i = start + 1; i < source.length; i += 1) {
    if (source[i] === "\\") { i += 1; continue; }
    if (source[i] === quote) return i;
  }
  return source.length;
}

// Only `key: "value"` pairs sitting directly inside this object (depth 1).
// Nested objects and function values are skipped rather than flattened.
function topLevelStrings(literal) {
  const out = new Map();
  let depth = 0;
  for (let i = 0; i < literal.length; i += 1) {
    const c = literal[i];
    if (c === "{" || c === "[" || c === "(") { depth += 1; continue; }
    if (c === "}" || c === "]" || c === ")") { depth -= 1; continue; }
    if (c === "'" || c === "`") { i = skipString(literal, i); continue; }
    if (c === '"') { i = skipString(literal, i); continue; }
    if (depth !== 1) continue;
    const rest = literal.slice(i);
    const m = rest.match(/^([A-Za-z_$][\w$]*)\s*:\s*"/);
    if (!m) continue;
    const valueStart = i + m[0].length - 1;
    const valueEnd = skipString(literal, valueStart);
    out.set(m[1], literal.slice(valueStart + 1, valueEnd));
    i = valueEnd;
  }
  return out;
}

function readTable(name) {
  const spec = SOURCES[name];
  const source = fs.readFileSync(path.join(appDir, spec.file), "utf8");
  const literal = objectLiteralAt(source, spec.anchor);
  if (!literal) throw new Error(`${name}: could not locate the UI table (anchor ${spec.anchor})`);
  const table = {};
  for (const lang of ["ja", "en"]) {
    const langLiteral = objectLiteralAt(literal, new RegExp(`\\b${lang}\\s*:\\s*\\{`));
    if (!langLiteral) throw new Error(`${name}: could not locate the "${lang}" block`);
    table[lang] = topLevelStrings(langLiteral);
  }
  return table;
}

const tables = Object.fromEntries(Object.keys(SOURCES).map((name) => [name, readTable(name)]));
const failures = [];
let checked = 0;

for (const group of LINKED) {
  for (const lang of group.langs) {
    const seen = [];
    for (const [file, key] of group.keys) {
      const value = tables[file][lang].get(key);
      if (value === undefined) {
        failures.push(`${file} [${lang}] is missing key "${key}" (group: ${group.note}) — was it renamed or removed?`);
        continue;
      }
      seen.push({ file, key, value });
    }
    if (seen.length < 2) continue;
    const [first, ...rest] = seen;
    const off = rest.filter((entry) => entry.value !== first.value);
    if (off.length) {
      failures.push(
        `${group.note} [${lang}] disagree:\n` +
        [first, ...off].map((e) => `      ${e.file}:${e.key} = "${e.value}"`).join("\n") +
        `\n      If this difference is intentional, narrow "langs" for this group in scripts/validate-ui-strings.mjs.`
      );
    }
    checked += seen.length;
  }
}

if (failures.length) {
  throw new Error(`UI string validation failed:\n- ${failures.join("\n- ")}`);
}

const counts = Object.entries(tables).map(([name, t]) => `${name} ${t.ja.size}/${t.en.size}`).join(", ");
console.log(`UI strings consistent: ${LINKED.length} linked groups, ${checked} cross-file values agree (tables ja/en: ${counts}).`);
