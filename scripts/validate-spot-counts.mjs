import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SPOT_COUNT,
  SPOT_COUNT_BESIDES_FUJI,
  SPOT_COUNT_PAGES,
  scanSpotCountClaims,
  findSpotCountDrift,
  findUnregisteredCountClaims,
  syncSpotCountClaims,
} from "./shared/spot-count.mjs";

// Keeps every "how many window views" claim in the static HTML equal to SPOTS.length.
//
// Run with --fix to rewrite them. Without --fix this only reports, and exits 1 on any
// disagreement so `npm run check` fails instead of shipping a page that says 37 while
// data.js says 40.

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIX = process.argv.includes("--fix");

let drifted = 0;
let unregistered = 0;
let fixedFiles = 0;
let totalClaims = 0;

for (const relativePath of SPOT_COUNT_PAGES) {
  const absolutePath = path.join(appDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`missing page: ${relativePath}`);
    process.exitCode = 1;
    continue;
  }
  const html = fs.readFileSync(absolutePath, "utf8");
  totalClaims += scanSpotCountClaims(html).length;

  const stray = findUnregisteredCountClaims(html);
  for (const item of stray) {
    unregistered += 1;
    console.error(
      `${relativePath}: unregistered spot-count claim "${item.actual}" — …${item.context}…\n` +
        `  Add the phrase to BESIDES_FUJI_CLAIMS or NOT_A_CLAIM in scripts/shared/spot-count.mjs.`,
    );
  }

  const drift = findSpotCountDrift(html);
  if (drift.length === 0) continue;

  if (FIX) {
    fs.writeFileSync(absolutePath, syncSpotCountClaims(html), "utf8");
    fixedFiles += 1;
    console.log(`fixed ${relativePath}: ${drift.length} claim(s)`);
    continue;
  }

  drifted += drift.length;
  for (const claim of drift) {
    console.error(
      `${relativePath}: says ${claim.actual} but should say ${claim.expected} ` +
        `(${claim.kind === "besidesFuji" ? "besides Mt. Fuji" : "full set"}) near "${claim.raw}"`,
    );
  }
}

if (unregistered > 0) {
  console.error(`\n${unregistered} unregistered count claim(s). Register them, then re-run.`);
  process.exit(1);
}

if (FIX) {
  console.log(
    `Spot counts synced: ${fixedFiles} file(s) rewritten, ${totalClaims} claims across ` +
      `${SPOT_COUNT_PAGES.length} pages (full set ${SPOT_COUNT}, besides Fuji ${SPOT_COUNT_BESIDES_FUJI}).`,
  );
  process.exit(0);
}

if (drifted > 0) {
  console.error(
    `\n${drifted} spot-count claim(s) disagree with data.js (SPOTS.length = ${SPOT_COUNT}). ` +
      `Run "npm run fix:spot-counts".`,
  );
  process.exit(1);
}

console.log(
  `Spot counts consistent: ${totalClaims} claims across ${SPOT_COUNT_PAGES.length} pages ` +
    `all agree with data.js (full set ${SPOT_COUNT}, besides Fuji ${SPOT_COUNT_BESIDES_FUJI}).`,
);
