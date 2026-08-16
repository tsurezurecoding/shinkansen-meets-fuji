import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SPOTS as GENERATED_SPOTS, spotPageHTML } from "./generate-spot-pages.mjs";

async function runThinValidator() {
  const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dataPath = path.join(appDir, "spot-page-shared-data.js");
  const rendererPath = path.join(appDir, "spot-page-shared.js");
  const stylesheetPath = path.join(appDir, "style.css");
  const sharedDataCode = fs.readFileSync(dataPath, "utf8");
  const rendererCode = fs.readFileSync(rendererPath, "utf8");
  const stylesheetCode = fs.readFileSync(stylesheetPath, "utf8");
  const sourceContext = {};
  vm.runInNewContext(`${fs.readFileSync(path.join(appDir, "data.js"), "utf8")}\nglobalThis.__SOURCE = { SPOTS, ROUTE };`, sourceContext, { filename: path.join(appDir, "data.js") });
  const source = sourceContext.__SOURCE;
  const dataContext = {};
  vm.runInNewContext(sharedDataCode, dataContext, { filename: dataPath });
  const payload = dataContext.MADO_SPOT_PAGE_SHARED_DATA;
  const errors = [];
  const fail = (message) => errors.push(message);

  function parseArgs(args) {
    if (!args.length) return null;
    if (args.length === 2 && args[0] === "--baseline" && args[1] && !args[1].startsWith("-")) return args[1];
    throw new Error("Usage: node scripts/validate-spot-page-shared.mjs [--baseline <git-ref>]");
  }

  function assertCLIContract() {
    if (parseArgs([]) !== null) throw new Error("CLI contract: default mode selected a baseline");
    for (const args of [["--unknown"], ["--baseline"], ["--baseline", "a", "b"], ["--baseline", "-HEAD"]]) {
      let rejected = false;
      try { parseArgs(args); } catch { rejected = true; }
      if (!rejected) throw new Error(`CLI contract: malformed args were accepted: ${args.join(" ")}`);
    }
  }

  assertCLIContract();

  const baselineSelector = parseArgs(process.argv.slice(2));
  let baselineCommit = null;
  if (baselineSelector) baselineCommit = execFileSync("git", ["rev-parse", "--verify", `${baselineSelector}^{commit}`], { cwd: appDir, encoding: "utf8" }).trim();

  function localizedValue(value, lang) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    return value[lang] || value.ja || value.en || "";
  }

  function escape(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function count(value, pattern) {
    return value.match(pattern)?.length || 0;
  }

  function safeAsset(value) {
    return typeof value === "string" && value.startsWith("images/") && !value.includes("..") && !value.includes("\\") && !/[?#]/.test(value);
  }

  function strictHostHTML(lang, id, rootPath) {
    return `<body class="spot-page" data-spot-page-shared-lang="${lang}" data-spot-page-shared-id="${id}" data-spot-page-shared-root="${rootPath}" data-spot-page-shared-mode="page">`;
  }

  function makeHost() {
    let rendered = "";
    const attrs = {};
    const host = {
      className: "",
      textContent: "",
      classList: { contains: (name) => host.className.split(/\s+/).includes(name) },
      setAttribute(name, value) { attrs[name] = String(value); },
      getAttribute(name) { return attrs[name] || null; },
    };
    Object.defineProperty(host, "outerHTML", { get: () => rendered, set: (value) => { rendered = String(value); } });
    return host;
  }

  function renderPage(lang, rootPath, currentId, mutateData, embedded = false) {
    const host = makeHost();
    const createdScripts = [];
    const bodyClasses = new Set(["spot-page"]);
    const lightboxImage = { src: "" };
    const lightbox = {
      hidden: true,
      __madoBound: false,
      querySelector(selector) { return selector === "img" ? lightboxImage : { textContent: "" }; },
      addEventListener() {},
    };
    const body = {
      classList: {
        contains: (name) => bodyClasses.has(name),
        add: (name) => bodyClasses.add(name),
      },
      getAttribute(name) {
        return { "data-spot-page-shared-lang": lang, "data-spot-page-shared-id": currentId, "data-spot-page-shared-root": rootPath, "data-spot-page-shared-mode": "page" }[name] || null;
      },
    };
    const document = {
      body,
      documentElement: { style: {} },
      head: { appendChild(script) { createdScripts.push(script); } },
      createElement() { return { async: false, src: "", charset: "" }; },
      getElementById(id) { return id === "spotPageLightbox" ? lightbox : null; },
      addEventListener() {},
      querySelectorAll(selector) {
        if (selector.includes('data-spot-page-shared-module="page"')) return [host];
        return [];
      },
    };
    const console = { error(message) { errors.push(String(message)); } };
    const context = { document, console, MADO_EMBEDDED_WEB: embedded };
    context.window = context;
    vm.runInNewContext(sharedDataCode, context, { filename: dataPath });
    if (mutateData) mutateData(context.MADO_SPOT_PAGE_SHARED_DATA);
    vm.runInNewContext(rendererCode, context, { filename: rendererPath });
    return { html: host.outerHTML, host, createdScripts, errors: errors.splice(0) };
  }

  function assertSpotPageShellMarkup(html, expectedClass, label) {
    const expected = `<div class="${expectedClass}">`;
    const pattern = expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (count(html, new RegExp(pattern, "g")) !== 1) fail(`${label} must contain exactly one ${expected}`);
    if (html.includes('<div class="spot-page-shell>')) fail(`${label} contains the malformed unclosed spot-page-shell class`);
  }

  function renderUtility(lang, rootPath, route) {
    const hosts = {
      topbar: makeHost(),
      rail: makeHost(),
      "content-rail": makeHost(),
      "mobile-promos": makeHost(),
    };
    const body = {
      classList: { contains: (name) => name === "spot-page" },
      getAttribute(name) {
        return {
          "data-spot-page-shared-context": "utility",
          "data-spot-page-shared-lang": lang,
          "data-spot-page-shared-root": rootPath,
          "data-spot-page-shared-route": route,
        }[name] || null;
      },
    };
    const document = {
      body,
      querySelectorAll(selector) {
        const match = selector.match(/data-spot-page-shared-module="([^"]+)"/);
        return match && hosts[match[1]] ? [hosts[match[1]]] : [];
      },
    };
    const utilityErrors = [];
    const console = { error(message) { utilityErrors.push(String(message)); } };
    const context = { document, console };
    context.window = context;
    vm.runInNewContext(sharedDataCode, context, { filename: dataPath });
    vm.runInNewContext(rendererCode, context, { filename: rendererPath });
    return { hosts, errors: utilityErrors };
  }

  function assertPageSafety(page, spot, lang) {
    if (!page || page.id !== spot.id || page.lang !== lang || !page.hero || !Array.isArray(page.gallery) || !page.gallery.length || typeof page.photoHeadingCustom !== "boolean") fail(`payload page missing for ${spot.id}/${lang}`);
    if (!page.stamp || !safeAsset(page.stamp.src)) fail(`${spot.id}/${lang} stamp path is unsafe`);
    for (const photo of [...(page.photos || []), ...(page.gallery || []), ...(page.inline || [])]) {
      if (!safeAsset(photo.src) || !safeAsset(photo.thumb) || (photo.sourceUrl && !/^https?:\/\/[^\s<>"']+$/i.test(photo.sourceUrl))) fail(`${spot.id}/${lang} photo path/source is unsafe`);
    }
    for (const link of [...(page.bodyLinks || []), ...(page.references || [])]) if (!/^https?:\/\/[^\s<>"']+$/i.test(link.href)) fail(`${spot.id}/${lang} external link is unsafe`);
    if (page.media) for (const video of page.media.videos) {
      if (video.kind === "x" && !/^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+(?:\/video\/\d+)?$/.test(video.url)) fail(`${spot.id}/${lang} X URL shape is unsafe`);
      if (video.kind === "youtube" && (!/^[A-Za-z0-9_-]{11}$/.test(video.id) || !/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(video.url))) fail(`${spot.id}/${lang} YouTube URL/id is unsafe`);
    }
  }

  if (!source || !Array.isArray(source.SPOTS) || !payload || payload.version !== 2 || payload.affiliatesEnabled !== false) fail("shared payload version/source/affiliate flag is invalid");
  const sourceIds = source.SPOTS.map((spot) => spot.id);
  const payloadIds = Object.keys(payload.pages || {});
  const expectedSpotCount = sourceIds.length;
  const expectedStationCount = Array.isArray(source.ROUTE?.refStations) ? source.ROUTE.refStations.length : 0;
  const expectedPageCount = expectedSpotCount * 2;
  if (GENERATED_SPOTS.length !== expectedSpotCount || JSON.stringify(GENERATED_SPOTS.map((spot) => spot.id)) !== JSON.stringify(sourceIds)) fail("generator/source spot ids are out of alignment");
  if (payloadIds.length !== expectedSpotCount || JSON.stringify(payloadIds) !== JSON.stringify(sourceIds)) fail(`payload/source spot count or order mismatch: source=${expectedSpotCount}, pages=${payloadIds.length}`);
  if (!Array.isArray(payload.stations) || payload.stations.length !== expectedStationCount) fail(`payload station count does not match data.js: source=${expectedStationCount}, payload=${payload.stations?.length || 0}`);
  // Video presence is editorial data in data.js. Keep this validator focused on
  // source-to-projection-to-HTML alignment instead of duplicating every URL here.
  const videoSpots = source.SPOTS.filter((spot) => Array.isArray(spot.media?.videos) && spot.media.videos.length);
  const videoSpotIds = new Set(videoSpots.map((spot) => spot.id));
  const expectedVideoPageCount = videoSpots.length * 2;
  let renderedVideoPageCount = 0;
  for (const spot of source.SPOTS) {
    if (!payload.pages[spot.id] || !payload.pages[spot.id].ja || !payload.pages[spot.id].en) fail(`${spot.id} does not have both page languages`);
    for (const lang of ["ja", "en"]) {
      const page = payload.pages[spot.id][lang];
      assertPageSafety(page, spot, lang);
      const expectedGalleryCount = page.photos.length - (spot.id === "ibuki" && lang === "ja" ? 0 : page.inline.length);
      if (page.gallery.length !== expectedGalleryCount || expectedGalleryCount < 1) fail(`${spot.id}/${lang} gallery count is not derived from the structured photo source`);
      const inlineSources = new Set((page.inline || []).map((photo) => photo.src));
      const referenceSources = new Set((spot.photos || []).filter((photo) => photo.role === "reference").map((photo) => photo.src));
      if (spot.id !== "ibuki" && page.gallery.some((photo) => inlineSources.has(photo.src))) fail(`${spot.id}/${lang} inline article photo was duplicated in the hero gallery`);
      if (page.gallery.some((photo) => referenceSources.has(photo.src))) fail(`${spot.id}/${lang} reference photo was duplicated in the hero gallery`);
      if (page.media && !videoSpotIds.has(spot.id)) fail(`${spot.id}/${lang} unexpectedly has a video section`);
      if (page.media) renderedVideoPageCount += 1;
      if (!page.media && videoSpotIds.has(spot.id)) fail(`${spot.id}/${lang} is missing its structured video section`);
      const sourceVideos = Array.isArray(spot.media?.videos) ? spot.media.videos : [];
      const projectedVideos = page.media?.videos || [];
      if (projectedVideos.length !== sourceVideos.length) fail(`${spot.id}/${lang} video count does not match the structured source contract`);
      sourceVideos.forEach((sourceVideo, index) => {
        const projectedVideo = projectedVideos[index];
        if (!projectedVideo || projectedVideo.kind !== sourceVideo.kind || projectedVideo.url !== sourceVideo.url || (sourceVideo.handle && projectedVideo.handle !== sourceVideo.handle) || (sourceVideo.id && projectedVideo.id !== sourceVideo.id)) {
          fail(`${spot.id}/${lang} video source record ${index + 1} is not projected without drift`);
        }
      });
      const stampPath = path.join(appDir, page.stamp.src);
      if (!fs.existsSync(stampPath)) fail(`${spot.id}/${lang} stamp file is missing`);
      const stampCode = fs.readFileSync(stampPath, "utf8");
      if (!stampCode.includes('id="stampInk"') || !stampCode.includes('filter="url(#stampInk)"')) fail(`${spot.id}/${lang} stamp is missing the shared distressed-ink filter`);
      for (const photo of [...page.photos, ...page.gallery, ...(page.inline || [])]) {
        if (!fs.existsSync(path.join(appDir, photo.src))) fail(`${spot.id}/${lang} gallery image is missing: ${photo.src}`);
        if (!fs.existsSync(path.join(appDir, photo.thumb))) fail(`${spot.id}/${lang} gallery thumbnail is missing: ${photo.thumb}`);
      }
    }
  }
  if (!stylesheetCode.includes(".spot-page-video-grid") || !stylesheetCode.includes("grid-template-columns: repeat(2") || !stylesheetCode.includes("grid-template-columns: 1fr") || !stylesheetCode.includes(".spot-page-heading-row") || !stylesheetCode.includes(".spot-page-stamp") || !stylesheetCode.includes("position: absolute") || !stylesheetCode.includes("mix-blend-mode: multiply") || !stylesheetCode.includes("[data-affiliate-module]") || !stylesheetCode.includes(".spot-page-rail-affiliate-group") || !stylesheetCode.includes(".spot-page-mobile-affiliate-note")) fail("shared gallery/video/stamp/affiliate CSS contract is incomplete");
  if (!rendererCode.includes("function pageGalleryHTML") || !rendererCode.includes("function pageMediaHTML") || !rendererCode.includes("ensureXWidgetsScript")) fail("shared renderer is missing the common gallery/video/X contract");

  const expectedPages = [];
  const currentPages = [];
  for (const lang of ["ja", "en"]) {
    for (const spot of GENERATED_SPOTS) {
      const relativeFile = `${lang === "ja" ? "spots" : "en/spots"}/${spot.id}.html`;
      const absoluteFile = path.join(appDir, relativeFile);
      if (!fs.existsSync(absoluteFile)) { fail(`${relativeFile} is missing`); continue; }
      const onDisk = fs.readFileSync(absoluteFile, "utf8");
      const generatedHTML = spotPageHTML(spot, lang);
      expectedPages.push(relativeFile);
      currentPages.push(relativeFile);
      if (onDisk !== generatedHTML) fail(`${relativeFile} does not match in-memory thin generation`);
      const bodyTag = onDisk.match(/<body[^>]*>/)?.[0] || "";
      const prefix = lang === "ja" ? "../" : "../../";
      if (bodyTag !== strictHostHTML(lang, spot.id, prefix)) fail(`${relativeFile} body context/mode is incorrect`);
      if (count(onDisk, /data-spot-page-shared-module=/g) !== 1 || count(onDisk, /<div data-spot-page-shared-module="page"><\/div>/g) !== 1) fail(`${relativeFile} must have exactly one strict thin page host`);
      const body = onDisk.slice(onDisk.indexOf("<body"));
      if (/<header|<main|<article|<aside|<iframe|<blockquote|<figure|data-affiliate-module|spot-page-mobile-affiliate|spotPageLightbox|affiliate\.klook|valuecommerce|amazon\.co\.jp|ad\.jp\.ap|ck\.jp\.ap|<script>/.test(body)) fail(`${relativeFile} contains legacy body markup/runtime or affiliate residue`);
      const scripts = [
        `<script src="${prefix}spot-page-shared-data.js?v=20260812-shared-data-video"></script>`,
        `<script src="${prefix}spot-page-shared.js"></script>`,
        `<script src="${prefix}spot-media-gallery.js?v=20260811-ibuki-pilot"></script>`,
        `<script src="${prefix}spot-map.js?v=20260707-map-mode-switch"></script>`,
      ];
      let previous = -1;
      for (const script of scripts) {
        const index = onDisk.indexOf(script);
        if (count(onDisk, new RegExp(script.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) !== 1 || index <= previous) fail(`${relativeFile} shared script order/path is invalid`);
        previous = index;
      }
      const page = payload.pages[spot.id][lang];
      const normalizedHead = (html) => (html.match(/<head>[\s\S]*?<\/head>/i)?.[0] || "").replace(/\s*<link rel="stylesheet" href="[^"]*spot-media-gallery\.css[^"]*">/g, "").replace(/\s+/g, " ").trim();
      if (baselineCommit) {
        const baselineHTML = execFileSync("git", ["show", `${baselineCommit}:${relativeFile}`], { cwd: appDir, encoding: "utf8" });
        if (normalizedHead(onDisk) !== normalizedHead(baselineHTML)) fail(`${relativeFile} static SEO/head changed from explicit baseline ${baselineSelector} (${baselineCommit})`);
      }
      const rendered = renderPage(lang, prefix, spot.id);
      if (rendered.errors.length) fail(`${relativeFile} renderer failed: ${rendered.errors.join(" | ")}`);
      const output = rendered.html;
      assertSpotPageShellMarkup(output, "spot-page-shell", `${relativeFile} normal renderer`);
      const embeddedRendered = renderPage(lang, prefix, spot.id, undefined, true);
      if (embeddedRendered.errors.length) fail(`${relativeFile} embedded renderer failed: ${embeddedRendered.errors.join(" | ")}`);
      assertSpotPageShellMarkup(embeddedRendered.html, "spot-page-shell mado-embedded-shell", `${relativeFile} embedded renderer`);
      const desktopRailStart = output.indexOf('<aside class="spot-page-rail"');
      const desktopRailEnd = desktopRailStart >= 0 ? output.indexOf("</aside>", desktopRailStart) : -1;
      const desktopRail = desktopRailStart >= 0 && desktopRailEnd > desktopRailStart ? output.slice(desktopRailStart, desktopRailEnd + "</aside>".length) : "";
      if (!desktopRail) fail(`${relativeFile} shared desktop rail is missing`);
      if (lang === "ja") {
        const expected727Card = `<div class="spot-page-rail-disney spot-page-rail-727"><a href="${prefix}727-collection.html" data-cta-track="727_collection_entry_click" data-cta-id="spot_rail_727"><img src="${prefix}images/stamps/stamp_727-board.svg" alt="" width="42" height="30" loading="lazy" decoding="async"><span class="spot-page-rail-disney-copy"><strong>727看板コレクション</strong><small>東京〜新大阪の沿線で727看板を集める</small></span><span class="spot-page-rail-disney-arrow" aria-hidden="true">›</span></a></div>`;
        if (count(desktopRail, /data-cta-id="spot_rail_727"/g) !== 1 || !desktopRail.includes(expected727Card)) fail(`${relativeFile} Japanese shared rail must contain exactly one complete 727 Collection card`);
      } else if (count(desktopRail, /data-cta-id="spot_rail_727"/g) !== 0 || output.includes("727看板コレクション")) {
        fail(`${relativeFile} English shared rail must not contain a 727 Collection card`);
      }
      if (count(output, /<h1\b/g) !== 1 || count(output, /class="spot-page-stamp"/g) !== 1 || !output.includes(`href="${lang === "ja" ? prefix + "journal.html#stampboard" : prefix + "en/journal.html#stampboard"}"`) || !output.includes(`src="${prefix}${page.stamp.src}"`)) fail(`${relativeFile} H1/stamp contract is invalid`);
      if (count(output, /data-spot-media-gallery/g) !== 1 || count(output, /data-gallery-thumb/g) !== page.gallery.length || count(output, /data-gallery-image/g) !== 1) fail(`${relativeFile} common selectable gallery count is invalid`);
      if (page.inline.length && count(output, /spot-page-inline-figure/g) !== page.inline.length) fail(`${relativeFile} inline photo module count is invalid`);
      if (page.photoHeadingCustom && !output.includes(escape(page.photoHeading))) fail(`${relativeFile} custom photo heading is missing from the shared gallery`);
      if (page.referenceImage && !output.includes("spot-page-reference-section")) fail(`${relativeFile} reference image module is missing`);
      if (page.explainer?.figure && !output.includes("spot-page-explainer-figure")) fail(`${relativeFile} explainer figure module is missing`);
      if (page.photoTip && !output.includes("spot-page-phototip")) fail(`${relativeFile} photo tip module is missing`);
      if (page.sharedGuide.length && !output.includes(page.sharedGuide[0].id)) fail(`${relativeFile} shared guide module is missing`);
      if (page.guideNotice && !output.includes("guide-answer-panel")) fail(`${relativeFile} guide alias notice is missing`);
      if (count(output, /spot-page-showcase/g) !== 1 || !output.includes("spotPageShowcaseTitle")) fail(`${relativeFile} shared full-width showcase composition is missing`);
      if (output.includes("spot-page-related") || output.includes("近くの車窓も見る") || output.includes("Nearby window views")) fail(`${relativeFile} rendered the retired in-article related section`);
      if (page.media) {
        if (count(output, /spot-page-video-section/g) !== 1 || count(output, /spot-page-video-card/g) !== page.media.videos.length || count(output, /spot-page-video-platform-note/g) !== 1) fail(`${relativeFile} shared video-card/footnote contract is invalid`);
        for (const video of page.media.videos) {
          if (!output.includes(`href="${video.url}"`) || (video.kind === "x" && !output.includes(escape(video.handle))) || (video.kind === "youtube" && !output.includes(`youtube-nocookie.com/embed/${video.id}`))) fail(`${relativeFile} video source/embed is incomplete`);
        }
        if (rendered.createdScripts.filter((script) => script.src === "https://platform.twitter.com/widgets.js").length !== (page.media.videos.some((video) => video.kind === "x") ? 1 : 0)) fail(`${relativeFile} X widgets script count is invalid`);
      } else if (["spot-page-video-section", "spot-page-video-platform-note", "spot-page-video-grid", "spot-page-video-card", "spotVideoTitle-"].some((needle) => output.includes(needle))) {
        fail(`${relativeFile} rendered a video heading, footnote, container, or card without structured videos`);
      }
      const affiliateNeedles = ["data-affiliate-module", "spot-page-mobile-affiliate", "AFFILIATE LINKS", "アフィリエイトリンク", "affiliate.klook", "valuecommerce", "amazon.co.jp", "ad.jp.ap", "ck.jp.ap", "class=\"affiliate-card\"", "spot-page-rail-affiliate"];
      if (affiliateNeedles.some((needle) => output.includes(needle))) fail(`${relativeFile} rendered affiliate residue while disabled`);
    }
  }
  if (expectedPages.length !== expectedPageCount || currentPages.length !== expectedPageCount) fail(`expected exactly ${expectedPageCount} spot pages, found ${currentPages.length}`);
  if (renderedVideoPageCount !== expectedVideoPageCount) fail(`expected ${expectedVideoPageCount} video pages from the structured source, found ${renderedVideoPageCount}`);

  for (const route of ["mieru.html", "sparkling-dreams.html", "hanabi.html", "yakei.html", "727-collection.html"]) {
    const japaneseUtility = renderUtility("ja", "./", route);
    if (japaneseUtility.errors.length) fail(`Japanese utility ${route} renderer failed: ${japaneseUtility.errors.join(" | ")}`);
    const expectedUtility727Card = '<div class="spot-page-rail-disney spot-page-rail-727"><a href="./727-collection.html" data-cta-track="727_collection_entry_click" data-cta-id="spot_rail_727"><img src="./images/stamps/stamp_727-board.svg" alt="" width="42" height="30" loading="lazy" decoding="async"><span class="spot-page-rail-disney-copy"><strong>727看板コレクション</strong><small>東京〜新大阪の沿線で727看板を集める</small></span><span class="spot-page-rail-disney-arrow" aria-hidden="true">›</span></a></div>';
    // 727コレクション自身のページには自分へのカードを出さない。
    const expected727Count = route === "727-collection.html" ? 0 : 1;
    const has727Card = (host) => count(host.outerHTML, /data-cta-id="spot_rail_727"/g) === expected727Count && (expected727Count === 0 || host.outerHTML.includes(expectedUtility727Card));
    if (!has727Card(japaneseUtility.hosts.rail) || !has727Card(japaneseUtility.hosts["mobile-promos"])) fail(`Japanese utility ${route} rail and mobile promos must each contain ${expected727Count} complete 727 Collection card(s)`);

    const englishUtility = renderUtility("en", "../", route);
    if (englishUtility.errors.length) fail(`English utility ${route} renderer failed: ${englishUtility.errors.join(" | ")}`);
    if (englishUtility.hosts.rail.outerHTML.includes('data-cta-id="spot_rail_727"') || englishUtility.hosts.rail.outerHTML.includes("727看板コレクション") || englishUtility.hosts["mobile-promos"].outerHTML.includes('data-cta-id="spot_rail_727"') || englishUtility.hosts["mobile-promos"].outerHTML.includes("727看板コレクション")) fail(`English utility ${route} rail or mobile promos must not contain the 727 Collection card`);
  }

  const reps = [
    ["ibuki", "ja"], ["hamanako", "ja"], ["kiyosu", "ja"], ["nagoya-station-skyline", "ja"], ["gifu-castle", "ja"], ["fuji", "ja"], ["odawara-castle", "ja"], ["hamanako", "en"],
  ];
  for (const [id, lang] of reps) {
    const prefix = lang === "ja" ? "../" : "../../";
    const result = renderPage(lang, prefix, id);
    const page = payload.pages[id][lang];
    if (!result.html || result.errors.length) fail(`representative ${id}/${lang} renderer failed`);
    if (id === "ibuki" && (page.gallery.length !== 3 || page.media.videos.length !== 3 || count(result.html, /class="twitter-tweet"/g) !== 1 || count(result.html, /youtube-nocookie.com\/embed\//g) !== 2)) fail("Ibuki representative content/video contract failed");
    if (id === "hamanako" && (!page.sharedGuide.length || !page.photoHeading.includes("浜名湖") || !result.html.includes("hamanako-fuji"))) fail("Hamanako representative composition failed");
    if (id === "kiyosu" && (!page.photoTip || !result.html.includes("spot-page-phototip"))) fail("Kiyosu photoTip representative failed");
    if (id === "nagoya-station-skyline" && (!page.explainer?.figure || !result.html.includes("spot-page-explainer-figure"))) fail("Nagoya explainer-figure representative failed");
    if (id === "gifu-castle" && (!page.referenceImage || !result.html.includes("spot-page-reference-section"))) fail("Gifu reference-image representative failed");
    if (id === "fuji" && (!page.fujiGuide || !result.html.includes("guide.html"))) fail("Fuji FAQ representative failed");
    if (id === "odawara-castle" && (!page.map.viewpoint || !page.map.viewpointUrl)) fail("Odawara Castle viewpoint fallback representative failed");
  }
  if (payload.pages.hamanako.ja.sideLabel !== "A席・海側 / E席・山側" || payload.pages["727-board"].ja.sideLabel !== "A席・E席") fail("A+E side projection is missing");

  const safety = renderPage("ja", "../", "fuji", (data) => { data.pages.fuji.ja.hero.src = "images/../escape.png"; });
  if (!safety.errors.some((message) => message.includes("shared page asset path is malformed")) || safety.host.className !== "spot-page-shared-error") fail("malformed asset path fixture did not fail closed");
  const rootSafety = renderPage("ja", "https://evil.example/", "fuji");
  if (!rootSafety.errors.some((message) => message.includes("relative root is required"))) fail("malformed root fixture did not fail closed");
  const idSafety = renderPage("ja", "../", "../fuji");
  if (!idSafety.errors.some((message) => message.includes("language or current spot context is malformed"))) fail("malformed current ID fixture did not fail closed");
  const payloadSafety = renderPage("ja", "../", "fuji", (data) => { data.pages.fuji.ja.name = `<img src=x onerror=alert(1)>`; data.pages.fuji.ja.sideLabel = `\" onmouseover=alert(1) x=\"`; });
  if (payloadSafety.html.includes("<img src=x onerror=alert(1)>") || payloadSafety.html.includes("onmouseover=alert(1)")) fail("page text payload was not escaped");

  if (errors.length) throw new Error(`Thin shared spot-page validation failed:\n- ${errors.join("\n- ")}`);
  console.log(`Thin shared validator passed: ${expectedSpotCount} source spots × 2 languages = ${expectedPageCount} pages, exactly one page host each, 0 legacy body/affiliate residue.`);
  console.log(`Payload schema v${payload.version} covers ${payloadIds.length} ids × ja/en and ${expectedStationCount} stations; generated artifact bytes: ${Buffer.byteLength(sharedDataCode, "utf8")}.`);
  console.log(`Gallery contract passed for all ${expectedPageCount} pages; no-video pages omit the entire video chapter, and ${renderedVideoPageCount} structured video pages passed the shared 2-column/1-column CSS contract.`);
  console.log(`All ${expectedPageCount} pages render the shared full-width showcase, retire the in-article related block, and use one of ${expectedSpotCount} distressed-ink stamp SVGs behind an unshifted H1.`);
  console.log(baselineCommit ? `Explicit baseline audit passed against ${baselineSelector} (${baselineCommit}); default mode performs no git baseline reads.` : "Baseline audit skipped: default mode performs no git baseline resolution or reads.");
}

await runThinValidator();
