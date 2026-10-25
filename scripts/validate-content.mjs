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
      'href="start.html#journey" data-lp-cta="purpose-plan"',
      'https://www.googletagmanager.com/gtag/js?id=',
      'if (window.MADO_EMBEDDED_WEB) return;',
      'window.gtag("event", `lp_${valuePath}_click`, payload);',
      '<footer class="footer">',
      'href="android-app.html?src=lp-footer">Androidアプリ</a>',
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
      '<meta name="robots" content="index,follow,max-image-preview:large">',
      'id="journey"',
      '<section class="content-rail-section content-rail-discovery"',
      'href="https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow"',
      'data-cta-track="android_app_guide_click" data-cta-id="discovery_android"',
      'href="zukan.html"',
      'data-cta-track="727_collection_entry_click" data-cta-id="discovery_727"',
      'href="castles.html"',
      'href="sudoori/index.html#stories"',
      'href="window-quiz.html"',
      'href="contact.html"',
      'https://www.googletagmanager.com/gtag/js?id=',
      'if (window.MADO_EMBEDDED_WEB) return;',
    ],
    forbidden: ['class="seasonal-entry"', 'window.MADO_ANALYTICS_DISABLED=true', 'early_access_click'],
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
      'https://www.googletagmanager.com/gtag/js?id=',
      'if (window.MADO_EMBEDDED_WEB) return;',
      'window.gtag("event", `lp_${valuePath}_click`, payload);',
      '<footer class="footer">',
      'href="en/android-app.html?src=lp-footer">Android app</a>',
    ],
    forbidden: ['class="seasonal-entry"'],
  },
  {
    file: "en/start.html",
    required: [
      '<html lang="en"',
      '<meta name="robots" content="index,follow,max-image-preview:large">',
      'id="journey"',
      '<section class="content-rail-section content-rail-discovery"',
      'href="https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow"',
      'data-cta-track="android_app_guide_click" data-cta-id="discovery_android"',
      'href="en/zukan.html"',
      'data-cta-track="arenani_entry_click" data-cta-id="discovery_arenani"',
      'href="en/castles.html"',
      'href="en/everyday-japan.html"',
      'href="en/yakei.html"',
      'href="en/contact.html"',
      'https://www.googletagmanager.com/gtag/js?id=',
      'if (window.MADO_EMBEDDED_WEB) return;',
    ],
    forbidden: [ 'window.MADO_ANALYTICS_DISABLED=true', 'early_access_click'],
  },
  {
    file: "app.js",
    required: [
      // Counts belong to the catalog, not the editorial introduction.
      'zukanAllEyebrow: "ALL WINDOW VIEWS"',
      'APP_SELF.endsWith("start.html") ? "train_selector"',
      'APP_SELF.endsWith("zukan.html") ? "field_guide"',
      'APP_SELF.endsWith("journal.html") ? "journal"',
      'track("journal_item_opened"',
    ],
  },
  {
    file: "android-app.html",
    required: [
      'Google Playで公開中',
      'eaRideTitle',
      '正確な位置情報と通知',
      'data-android-install',
      'android_app_guide_view',
      'android_install_click',
      'com.michikusatravel.shinkansenwindow',
    ],
    forbidden: ['noindex', 'groups.google.com', '/apps/testing/', 'early_access_step', '12人以上', '14日間'],
  },
  {
    file: "en/android-app.html",
    required: [
      'Available on Google Play',
      'eaRideTitle',
      'Allow location and notifications',
      'data-android-install',
      'android_app_guide_view',
      'android_install_click',
      'com.michikusatravel.shinkansenwindow',
    ],
    forbidden: ['noindex', 'groups.google.com', '/apps/testing/', 'early_access_step', '12 people', '14 days'],
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

function validateDiscoveryRail(text, file) {
  const section = text.match(/<section class="content-rail-section content-rail-discovery"[\s\S]*?<\/section>/)?.[0] || "";
  if (!section) {
    failures.push(`${file}: discovery content rail is missing`);
    return;
  }
  const cards = [...section.matchAll(/<a\b[^>]*class="content-rail-card[^\"]*"[^>]*>/g)].map((match) => match[0]);
  const hrefs = cards.map((card) => card.match(/\bhref="([^"]+)"/)?.[1] || "");
  const english = file === "en/start.html";
  const expected = english
    ? [
        "https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow",
        "en/zukan.html", "en/arenani.html", "en/castles.html",
        "en/everyday-japan.html", "en/yakei.html",
        "en/guide.html", "en/mieru.html", "en/jr-pass-fuji.html", "en/window-artworks.html",
        "en/journal.html", "en/?intro=1", "en/references.html", "en/contact.html",
      ]
    : [
        "https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow",
        "zukan.html", "727-collection.html", "castles.html", "sudoori/index.html#stories", "window-quiz.html",
        "guide.html", "mieru.html", "window-artworks.html", "journal.html", "references.html", "contact.html",
      ];
  if (cards.length !== expected.length || hrefs.some((href, index) => href !== expected[index])) {
    failures.push(`${file}: expected ${expected.length} discovery cards with the six new entries first and the existing cards retained`);
  }
  const discoveryCards = cards.slice(0, 6);
  if (discoveryCards.some((card) => !/data-cta-track="[^"]+"/.test(card) || !/data-cta-id="discovery_[^"]+"/.test(card))) {
    failures.push(`${file}: each of the six discovery cards must retain its CTA tracking identifiers`);
  }
  if (new Set(discoveryCards.map((card) => card.match(/data-cta-id="([^"]+)"/)?.[1] || "")).size !== 6) {
    failures.push(`${file}: discovery CTA identifiers must be unique`);
  }
  if (!discoveryCards[0]?.includes('target="_blank"') || !discoveryCards[0]?.includes('rel="noopener noreferrer"') || !discoveryCards[0]?.includes('data-cta-track="android_app_guide_click" data-cta-id="discovery_android"')) {
    failures.push(`${file}: the first discovery card must be the direct, safely opened Google Play link`);
  }
  if (!discoveryCards[2]?.includes(english ? 'data-cta-track="arenani_entry_click" data-cta-id="discovery_arenani"' : 'data-cta-track="727_collection_entry_click" data-cta-id="discovery_727"')) {
    failures.push(`${file}: the third discovery card must track its language-specific feature`);
  }
  if (/<section class="top-promo-stack\b/.test(text) || text.includes('data-cta-id="top_footer_disney"') || text.includes('data-cta-id="top_footer_727"')) {
    failures.push(`${file}: obsolete standalone footer promotions remain in the train selector`);
  }
}

const failures = [];

const appCode = await readFile(new URL("app.js", root), "utf8");
const appSelfSource = appCode.match(/function appSelfForPath\(pathname\) \{[\s\S]*?\n\}/)?.[0];
if (!appSelfSource) {
  failures.push("app.js: appSelfForPath() is missing");
} else {
  const locales = (await import('./shared/locales.mjs')).default;
  const routeContext = { window: { MADO_LOCALES: locales } };
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
    ...['de','es','zh-Hans','zh-Hant','fr','ko'].flatMap(lang => [[`/${lang}/start.html`, `${lang}/start.html`], [`/preview/${lang}/journal.html`, `${lang}/journal.html`]]),
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
  if (!/<meta name="robots" content="index,follow,max-image-preview:large">/.test(text)) {
    failures.push(`${file}: train search must be indexable`);
  }
  if (!text.includes(`<link rel="canonical" href="https://www.michikusa-travel.com/${file}">`) || !text.includes('hreflang="x-default"')) {
    failures.push(`${file}: train search must publish canonical and language alternates`);
  }
  validateDiscoveryRail(text, file);
}

for (const file of ["index.html", "start.html", "en/index.html", "en/start.html"]) {
  const text = await readFile(new URL(file, root), "utf8");
  const loaderCount = (text.match(/googletagmanager\.com\/gtag\/js\?id=/g) || []).length;
  if (loaderCount !== 1) failures.push(`${file}: expected exactly one GA4 loader, found ${loaderCount}`);
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
