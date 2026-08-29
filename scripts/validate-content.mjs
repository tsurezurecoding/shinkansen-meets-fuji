import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const dataPath = new URL("data.js", root);
const dataCode = await readFile(dataPath, "utf8");
const context = {};

vm.runInNewContext(`${dataCode}\nglobalThis.__SPOTS = SPOTS;`, context);

const spotCount = context.__SPOTS?.length;
if (!Number.isInteger(spotCount) || spotCount <= 0) {
  throw new Error("Could not read SPOTS from data.js");
}

const maxJapaneseHookLength = 18;
const maxEnglishHookLength = 38;
const allowedSideLabels = {
  ja: new Set(["A席・E席", "A席側", "E席側", "A席・海側", "E席・山側", "左右両側", "両側"]),
  en: new Set(["Seats A and E", "Seat A side", "Seat E side", "Seat A · sea side", "Seat E · mountain side", "Both sides"]),
};

const checks = [
  {
    file: "index.html",
    required: [
      '<link rel="canonical" href="https://www.michikusa-travel.com/">',
      'id="quick-intro"',
      'href="start.html#journey" data-lp-cta="hero-primary"',
      'data-lp-cta="footer-train"',
      'h==="#journey"',
      // 旧 /#spot-<id> の共有リンク・ブックマークが LP で行き止まりにならないこと
      'h.indexOf("#spot-")===0',
      'x.src="language-router.js?v=',
    ],
    forbidden: ['class="seasonal-entry"'],
  },
  {
    file: "start.html",
    required: [
      '<meta name="robots" content="noindex,follow">',
      'id="journey"',
      'data-cta-id="top_journey_disney"',
      'data-cta-id="top_footer_disney"',
      'href="sparkling-dreams.html"',
      'data-cta-id="top_journey_727"',
      'data-cta-id="top_footer_727"',
      'href="727-collection.html"',
    ],
    forbidden: ['class="seasonal-entry"'],
  },
  {
    file: "en/index.html",
    required: [
      '<html lang="en"',
      '<link rel="canonical" href="https://www.michikusa-travel.com/en/">',
      'Tokaido Shinkansen Window Views',
      'Choose your train',
      'href="en/start.html#journey"',
      'data-lp-cta="special-disney"',
      'href="en/sparkling-dreams.html"',
    ],
    forbidden: ['class="seasonal-entry"'],
  },
  {
    file: "en/start.html",
    required: [
      '<html lang="en"',
      '<meta name="robots" content="noindex,follow">',
      'id="journey"',
      'data-cta-id="top_journey_disney"',
      'data-cta-id="top_footer_disney"',
      'href="en/sparkling-dreams.html"',
      'data-cta-id="top_journey_727"',
      'data-cta-id="top_footer_727"',
      'href="en/zukan.html?filter=sign#gallery"',
    ],
    forbidden: ['<link rel="canonical"', 'hreflang=', 'application/ld+json'],
  },
  {
    file: "app.js",
    required: ["${MADO_SPOT_COUNT}の車窓スポット", "Browse all ${MADO_SPOT_COUNT} window views"],
  },
  {
    file: "references.html",
    required: ["車窓リンク集", "新幹線の車窓から"],
  },
  {
    file: "zukan.html",
    required: ["掲載写真は、撮影者または権利者の許可を得て紹介しています"],
  },
];

const stalePatterns = [
  /\b10\s*\/\s*10\b/,
  /10スポット/,
  /10件/,
  /10個/,
  /10の車窓スポット/,
  /実写10/,
  /車窓スポット10/,
];

const failures = [];

const appCode = await readFile(new URL("app.js", root), "utf8");
const appSelfSource = appCode.match(/function appSelfForPath\(pathname\) \{[\s\S]*?\n\}/)?.[0];
if (!appSelfSource) {
  failures.push("app.js: appSelfForPath() is missing");
} else {
  const routeContext = {};
  vm.runInNewContext(appSelfSource + "\nglobalThis.__appSelfForPath = appSelfForPath;", routeContext);
  const routeFixtures = [
    ["/start.html", "start.html"],
    ["/preview/start.html", "start.html"],
    ["/zukan.html", "zukan.html"],
    ["/journal.html", "journal.html"],
    ["/en/", "en/"],
    ["/en/index.html", "en/index.html"],
    ["/en/start.html", "en/start.html"],
    ["/en/journal.html", "en/journal.html"],
    ["/preview/en/start.html", "en/start.html"],
    ["/index.html", "index.html"],
  ];
  for (const [pathname, expected] of routeFixtures) {
    const actual = routeContext.__appSelfForPath(pathname);
    if (actual !== expected) failures.push("app.js: appSelfForPath(" + pathname + ") returned " + actual + "; expected " + expected);
  }
  if (!appCode.includes("$" + "{APP_SELF}$" + "{spotHash(item.id)}")) {
    failures.push("app.js: related spot links must use APP_SELF and spotHash()");
  }
}

for (const file of ["start.html", "en/start.html"]) {
  const text = await readFile(new URL(file, root), "utf8");
  if (!/<meta name="robots" content="noindex,follow">/.test(text)) {
    failures.push(`${file}: train selector must be noindex,follow`);
  }
  if (/<link\s+rel="canonical"|hreflang=|application\/ld\+json/.test(text)) {
    failures.push(`${file}: train selector must not publish canonical, hreflang, or JSON-LD metadata`);
  }
}

for (const check of checks) {
  const text = await readFile(new URL(check.file, root), "utf8");
  for (const phrase of check.required) {
    if (!text.includes(phrase)) {
      failures.push(`${check.file}: missing "${phrase}"`);
    }
  }
  for (const phrase of check.forbidden || []) {
    if (text.includes(phrase)) {
      failures.push(`${check.file}: forbidden "${phrase}" is present`);
    }
  }
  for (const pattern of stalePatterns) {
    const match = text.match(pattern);
    if (match) {
      failures.push(`${check.file}: stale count "${match[0]}"`);
    }
  }
}

for (const spot of context.__SPOTS) {
  const jaHook = spot.ja?.hook ?? "";
  if (jaHook.length > maxJapaneseHookLength) {
    failures.push(`data.js: ${spot.id} ja.hook is ${jaHook.length} chars; keep gallery card hooks <= ${maxJapaneseHookLength} chars`);
  }
  const enHook = spot.en?.hook ?? "";
  if (enHook.length > maxEnglishHookLength) {
    failures.push(`data.js: ${spot.id} en.hook is ${enHook.length} chars; keep English gallery card hooks <= ${maxEnglishHookLength} chars`);
  }
  for (const locale of ["ja", "en"]) {
    const label = spot.sideLabel?.[locale];
    if (label && !allowedSideLabels[locale].has(label)) {
      failures.push(`data.js: ${spot.id} sideLabel.${locale}="${label}" mixes seat labels with non-seat context; keep timing/area text in area/story, not sideLabel`);
    }
  }
}

if (failures.length) {
  throw new Error(`Content validation failed for ${spotCount} spots:\n- ${failures.join("\n- ")}`);
}

console.log(`Validated content copy for ${spotCount} spots.`);
