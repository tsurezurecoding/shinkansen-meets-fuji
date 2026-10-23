import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import { CONTENT_METADATA, SITE, imageDimensions, metadataProblems, selectSpotOgImage, enhanceContentHead, contentLastmod } from './shared/content-metadata.mjs';
import { auditContentMetadata } from './shared/content-metadata-audit.mjs';
import { findUnregisteredCountClaims } from './shared/spot-count.mjs';

test('spot counts ignore image dimensions while still checking nearby prose', () => {
  assert.deepEqual(findUnregisteredCountClaims('<img width="1200" height="630" alt="現在地と次の景色">'), []);
  assert.equal(findUnregisteredCountClaims('<img height="630" alt="景色"><p>999 amazing views</p>').length, 1);
});

test('unmeasured viewing windows stay unknown in both page facts and structured data', () => {
  const spots = vm.runInNewContext(fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8') + ';SPOTS');
  assert.equal(spots.find(spot => spot.id === 'yamazaki-distillery').durationSec, null);
  for (const lang of ['ja', 'en']) {
    const context = {}; context.window = context;
    vm.runInNewContext(fs.readFileSync(new URL('../data/spot-pages/yamazaki-distillery.' + lang + '.js', import.meta.url), 'utf8'), context);
    assert.equal(context.MADO_SPOT_PAGE_DATA.readingLayout.visibility.value, lang === 'ja' ? '未計測' : 'Not measured');
    const durationName = lang === 'ja' ? '見えている時間の目安（秒）' : 'Typical time in view (seconds)';
    const prefix = lang === 'en' ? 'en/' : '';
    const properties = id => {
      const doc = new JSDOM(fs.readFileSync(new URL('../' + prefix + 'spots/' + id + '.html', import.meta.url), 'utf8')).window.document;
      const nodes = [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(node => { const value = JSON.parse(node.textContent); return value['@graph'] || [value]; });
      return nodes.find(node => node['@type'] === 'TouristAttraction').additionalProperty;
    };
    assert.equal(properties('yamazaki-distillery').some(property => property.name === durationName), false);
    assert.equal(properties('fuji').find(property => property.name === durationName).value, spots.find(spot => spot.id === 'fuji').durationSec);
  }
});

test('editorial metadata: curated candidates and generated spot contracts pass the site gate', () => {
  const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const spots = vm.runInNewContext(fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8') + ';SPOTS');
  const audit = auditContentMetadata(root, spots);
  assert.deepEqual(audit.problems, []);
  assert.equal(Object.keys(CONTENT_METADATA).length, 124);
  for (const file of ['zh-Hant/spots/fuji.html','es/spots/fuji.html','de/yakei.html','fr/yakei.html','zh-Hant/yakei.html']) {
    assert.equal(CONTENT_METADATA[file].modified, '2026-10-20');
    assert.equal(CONTENT_METADATA[file].published, undefined, 'local translation dates must not assert publication');
    assert.match(CONTENT_METADATA[file].modifiedEvidence, /unpublished branch/);
  }
  assert.equal(CONTENT_METADATA['en/foods.html'].article, true);
  assert.equal(CONTENT_METADATA['en/everyday-japan.html'].kind, 'collection');
  assert.equal(CONTENT_METADATA['en/everyday-japan.html'].article, false);
  assert.equal(CONTENT_METADATA['en/countryside.html'].article, true);
  assert.equal(CONTENT_METADATA['en/countryside.html'].published, '2026-10-11');
  for (const prefix of ['', 'en/']) for (const id of ['shiraitogawa-bridge', 'maibara-test-trains']) {
    const meta = CONTENT_METADATA[prefix + 'spots/' + id + '.html'];
    assert.equal(meta.published, '2026-10-11');
    assert.equal(meta.modified, '2026-10-11');
  }
  for (const file of ['spots/toyohashi-tateiwa.html', 'en/spots/toyohashi-tateiwa.html']) {
    assert.equal(CONTENT_METADATA[file].article, false);
    assert.equal(CONTENT_METADATA[file].modified, '2026-10-08');
  }
  const tateiwa = spots.find(spot => spot.id === 'toyohashi-tateiwa');
  assert.equal(selectSpotOgImage(tateiwa).src, 'images/20260816_toyohashi-tateiwa_64500_michikusa.jpg');
  for (const file of ['arenani.html', '727-collection.html', 'castles.html', 'en/castles.html','hanabi.html','en/hanabi.html']) assert.equal(CONTENT_METADATA[file].article, false);
  for (const file of ['guide.html','spots/left-fuji.html','spots/gyoran-kannon.html','spots/fujitec-big-wing.html','spots/727-board.html']) assert.equal(CONTENT_METADATA[file].article, true);
});

test('editorial articles can omit unknown dates without fabricating a publication history', () => {
  const file = 'spots/mishima-catapult.html';
  const saved = CONTENT_METADATA[file];
  try {
    CONTENT_METADATA[file] = { kind: 'editorial article', article: true, published: null, modified: null };
    assert.deepEqual(metadataProblems({ [file]: CONTENT_METADATA[file] }), []);
    const html = enhanceContentHead(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), file);
    const doc = new JSDOM(html).window.document;
    const nodes = [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(s => { const j = JSON.parse(s.textContent); return j['@graph'] || [j]; });
    const article = nodes.find(node => node['@type'] === 'Article');
    assert.ok(article.headline && article.image && article.author);
    assert.equal('datePublished' in article, false);
    assert.equal('dateModified' in article, false);
  } finally { CONTENT_METADATA[file] = saved; }
});

test('OG selection never promotes a third-party photo, even if its filename looks owned', () => {
  const foreign = { id: 'fixture', image: 'images/unapproved_michikusa.jpg', photoCredit: { ja: '@someone' }, photos: [{ src: 'images/20240211_fuji_michikusa.jpg', credit: { ja: '@someone' } }], ja: { name: 'Fixture' } };
  assert.equal(selectSpotOgImage(foreign).url, SITE + '/images/og-shinkansen-window.png');
  assert.throws(() => selectSpotOgImage({ ...foreign, ogImage: foreign.image }), /permission evidence/);
  const own = { ...foreign, photos: [{ src: 'images/20240211_fuji_michikusa.jpg', credit: { ja: 'michikusa' } }] };
  assert.equal(selectSpotOgImage(own).src, own.photos[0].src);
  assert.ok(imageDimensions(own.photos[0].src).width >= 1200);
});

test('invalid dates and unsupported Article decisions are rejected; builds do not change lastmod', () => {
  for (const date of ['2026-02-30','2026-13-01','2026-1-01','not-a-date']) assert.ok(metadataProblems({ 'test.html': { modified: date, modifiedEvidence: 'fixture' } }).length);
  assert.ok(metadataProblems({ 'test.html': { published: '2026-10-08', modified: '2026-10-07', publishedEvidence: 'fixture', modifiedEvidence: 'fixture' } }).length);
  assert.ok(metadataProblems({ 'test.html': { kind: 'collection', article: true } }).length);
  assert.equal(contentLastmod(SITE + '/index.html', '2026-07-29'), '2026-07-29');
  assert.equal(contentLastmod(SITE + '/spots/left-fuji.html', '2026-08-02'), '2026-08-23');
  assert.ok(metadataProblems({ 'test.html': { publishedAccuracy: 'estimated-day', published: '2026-07-01', publishedEvidence: 'fixture' } }).length);
  assert.equal(contentLastmod(SITE + '/yakei.html', '2026-08-14'), '2026-10-12');
});

test('metadata enrichment is idempotent and does not change body content or internal links', () => {
  for (const file of Object.keys(CONTENT_METADATA)) {
    const html = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    const next = enhanceContentHead(html, file);
    assert.equal(next, html, file);
    assert.equal(next.slice(next.indexOf('<body')), html.slice(html.indexOf('<body')), file);
  }
});
test('standalone castle Articles retain their identity and use only explicitly permitted covers', () => {
  for (const lang of ['', 'en/']) for (const id of ['himeji-castle','okayama-castle','fukuyama-castle']) {
    const file = lang + 'spots/' + id + '.html';
    const original = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    const doc = new JSDOM(enhanceContentHead(original, file)).window.document;
    const nodes = [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(s => { const j = JSON.parse(s.textContent); return j['@graph'] || [j]; });
    assert.equal(nodes.length, 1);
    const article = nodes[0];
    assert.equal(article['@type'], 'Article');
    assert.equal(article.image.url, SITE + '/' + CONTENT_METADATA[file].image);
    assert.equal(article.image.creditText, CONTENT_METADATA[file].imageCredit);
    assert.equal(article.author.url, SITE + '/');
    assert.equal(article.mainEntityOfPage['@id'], SITE + '/' + file);
    assert.equal(doc.querySelector('meta[property="og:image"]').content, SITE + '/' + CONTENT_METADATA[file].image);
    assert.ok(doc.querySelector('[data-gallery-source-output]').href.startsWith('https://'));
    assert.equal(enhanceContentHead(original, file).slice(enhanceContentHead(original, file).indexOf('<body')), original.slice(original.indexOf('<body')));
  }
});

test('drinks Article can be created from a schema-free head without changing editorial text', () => {
  const file = 'en/drinks.html';
  const original = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '').replace(/<meta name="robots"[^>]*>/g, '');
  const enhanced = enhanceContentHead(original, file);
  const doc = new JSDOM(enhanced).window.document;
  const nodes = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
  assert.deepEqual(nodes.map(n => n['@type']), ['WebPage','Article']);
  assert.equal(nodes[1].headline, doc.querySelector('meta[property="og:title"]').content);
  assert.equal(nodes[1].author.name, 'Shinkansen Window');
  assert.equal(nodes[1].image.width, 1280);
  assert.ok(doc.querySelector('meta[name="robots"]').content.includes('max-image-preview:large'));
  assert.equal(enhanced.slice(enhanced.indexOf('<body')), original.slice(original.indexOf('<body')));
  assert.equal(enhanceContentHead(enhanced, file), enhanced);
});

test('third-party covers need an exact asset, representative-image permission and attribution', () => {
  const allowed = CONTENT_METADATA['spots/himeji-castle.html'];
  assert.deepEqual(metadataProblems({ 'test.html': allowed }), []);
  assert.ok(metadataProblems({ 'test.html': { ...allowed, imagePermissions: ['page'] } }).length);
  assert.ok(metadataProblems({ 'test.html': { ...allowed, imagePermissionEvidence: null } }).length);
  assert.ok(metadataProblems({ 'test.html': { ...allowed, imageCredit: null } }).length);
  const file = 'test-unapproved.html';
  try {
    CONTENT_METADATA[file] = { kind: 'editorial article', article: true, representativeImage: false, imageReview: 'No OG permission', published: null, modified: null, imageAlt: 'Shared banner' };
    const html = '<head><meta property="og:image" content="' + SITE + '/images/og-shinkansen-window.png"><script type="application/ld+json">{"@type":"Article","headline":"Test article","description":"Editorial reading","image":"unapproved.jpg"}</script></head><body></body>';
    const doc = new JSDOM(enhanceContentHead(html, file)).window.document;
    const article = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal('image' in article, false);
  } finally { delete CONTENT_METADATA[file]; }
});

test('fireworks stays a collection and Disney stays a utility page, rather than becoming Articles', () => {
  for (const file of ['hanabi.html','en/hanabi.html','sparkling-dreams.html','en/sparkling-dreams.html']) {
    const doc = new JSDOM(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8')).window.document;
    const nodes = [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(s => { const j = JSON.parse(s.textContent); return j['@graph'] || [j]; });
    assert.deepEqual(nodes.map(n => n['@type']), [file.includes('hanabi') ? 'CollectionPage' : 'WebPage']);
    if (file.includes('sparkling')) assert.equal('dateModified' in nodes[0], false);
  }
});

import {
  generateSpotPage,
  planSpotPage,
  writeChangedSpotPagePlans,
} from "./generate-spot-pages.mjs";

test("Train search is indexable with a bilingual static train index and valid service links", () => {
  const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const en = new JSDOM(read("en/start.html"), { url: "https://www.michikusa-travel.com/en/start.html", runScripts: "outside-only" });
  const ja = new JSDOM(read("start.html")).window.document;
  const doc = en.window.document;
  const rows = [...doc.querySelectorAll("#trainTimes tbody tr")];
  const jaRows = [...ja.querySelectorAll("#trainTimes tbody tr")];
  assert.ok(rows.length > 500, "all train types and directions must be present without JS");
  assert.equal(rows.length, jaRows.length);
  assert.equal(doc.querySelectorAll("#trainTimes .ja-train-list").length, 6);
  assert.equal(doc.querySelector('link[rel="canonical"]').href, doc.URL);
  assert.ok(!doc.querySelector('meta[name="robots"]')?.content.includes("noindex"));
  assert.ok(!/[\u3040-\u30ff\u3400-\u9fff]/.test(doc.querySelector("#trainTimes").textContent));
  const context = { window: {} };
  vm.runInNewContext(read("data/timetable.js"), context);
  vm.runInNewContext(read("train-select.js"), context);
  const { ROUTE } = vm.runInNewContext(read("data.js") + "\n;({ROUTE});", {});
  const table = context.window.SHINKANSEN_TIMETABLE;
  const selection = context.window.MADO_TRAIN_SELECT;
  const keys = new Set();
  rows.forEach((row, index) => {
    const link = row.querySelector("a");
    const url = new URL(link.href);
    assert.equal(url.pathname, "/en/start.html");
    assert.equal(url.search, new URL(jaRows[index].querySelector("a").getAttribute("href"), doc.URL).search);
    assert.equal(row.dataset.fujiMin, jaRows[index].dataset.fujiMin);
    assert.equal(row.lastElementChild.textContent, jaRows[index].lastElementChild.textContent);
    const [type, number] = url.searchParams.get("train").split("-");
    const direction = url.searchParams.get("dir");
    const candidates = selection.trainCandidates(table, ROUTE, direction, url.searchParams.get("board"));
    assert.ok(candidates.some(({ tr }) => tr.type === type && String(tr.number) === number), link.textContent);
    const key = `${type}-${number}-${direction}`;
    assert.ok(!keys.has(key), `duplicate service ${key}`);
    keys.add(key);
    assert.equal(link.textContent, `${type} ${number}`);
  });
  const start = new JSDOM(read("en/start.html")).window.document;
  assert.equal(start.documentElement.lang, "en");
  assert.ok(!start.querySelector('meta[name="robots"]').content.includes("noindex"));
  assert.equal(start.querySelector('link[rel="canonical"]').href, "https://www.michikusa-travel.com/en/start.html");
  for (const file of ["guide.html", "en/guide.html"]) {
    const guide = new JSDOM(read(file)).window.document;
    assert.equal(guide.querySelectorAll("#trainTimes tbody tr").length, 0);
    assert.ok(guide.querySelector('#trainTimes a[href*="focus=fuji"]'));
  }
  en.window.close();
});

test("unchanged spot page plans do not invoke the writer", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const writes = [];

  const changed = writeChangedSpotPagePlans([plan], (writtenPlan) => writes.push(writtenPlan));

  assert.deepEqual(changed, []);
  assert.deepEqual(writes, []);
});

test("generateSpotPage leaves an unchanged output timestamp untouched", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const before = fs.statSync(plan.outputPath).mtimeNs;

  const outputPath = generateSpotPage("tokyo-tower", "ja", { requireExisting: true });

  assert.equal(outputPath, plan.outputPath);
  assert.equal(fs.statSync(plan.outputPath).mtimeNs, before);
});

test("changed spot page plans still invoke the writer", () => {
  const plan = planSpotPage("tokyo-tower", "ja", { requireExisting: true });
  const writes = [];
  const changedPlan = { ...plan, generatedHTML: `${plan.generatedHTML}\n` };

  const changed = writeChangedSpotPagePlans([changedPlan], (writtenPlan) => writes.push(writtenPlan));

  assert.equal(changed.length, 1);
  assert.deepEqual(writes, [changedPlan]);
});

function renderedArticle(id, lang, embedded = false) {
  const plan = planSpotPage(id, lang);
  const dom = new JSDOM(plan.generatedHTML, { runScripts: "outside-only", url: `https://example.test/${lang === "en" ? "en/" : ""}spots/${id}.html` });
  dom.window.MADO_EMBEDDED_WEB = embedded;
  for (const relative of ["spot-page-shared-data.js", `data/spot-pages/${id}.${lang}.js`, "spot-page-shared.js"]) {
    dom.window.eval(fs.readFileSync(new URL(`../${relative}`, import.meta.url), "utf8"));
  }
  return dom;
}

test('Fujikawa background notes use editorial headings and a safe static comparison; device advice is English-only', () => {
  for (const lang of ['ja', 'en']) for (const embedded of [false, true]) {
    const dom = renderedArticle('fujikawa-bridge', lang, embedded);
    const doc = dom.window.document;
    const frequency = doc.querySelector('#frequency-divide');
    const charging = doc.querySelector('#charging-in-japan');
    assert.ok(frequency, `${lang}: frequency note is present`);
    assert.ok(frequency.querySelector(':scope > h2'));
    assert.equal(frequency.querySelector(':scope > .spot-reading-eyebrow').textContent, 'BEYOND THE VIEW');
    assert.equal(Boolean(charging), lang === 'en', `${lang}: charging advice is English-only`);
    if (charging) {
      assert.ok(frequency.compareDocumentPosition(charging) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      assert.ok(charging.querySelector(':scope > h2'));
      assert.equal(charging.querySelector(':scope > .spot-reading-eyebrow').textContent, 'TRAVEL NOTES');
    }
    assert.ok((charging || frequency).compareDocumentPosition(doc.querySelector('.spot-static-map')) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING, `${lang}: notes precede the map`);
    const viewingAdvice = [...doc.querySelectorAll('h2')].find(heading => heading.textContent === (lang === 'ja' ? '十数秒をどう使うか' : 'How to spend the dozen seconds'));
    assert.ok(viewingAdvice, `${lang}: original viewing advice remains`);
    assert.ok(viewingAdvice.compareDocumentPosition(frequency) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING, `${lang}: background follows the scenic advice`);
    assert.ok(doc.querySelector('[data-gallery-src$="20260530_fujikawa_bridge_2_michikusa.jpg"]'), `${lang}: original scenery photo remains`);
    assert.match(frequency.textContent, /50\s?Hz/);
    assert.match(frequency.textContent, /60\s?Hz/);
    const diagram = frequency.querySelector('.spot-frequency-diagram');
    assert.ok(diagram && diagram.getAttribute('aria-label'));
    assert.equal(diagram.querySelectorAll('svg[role="img"] title').length, 2);
    assert.equal(diagram.querySelectorAll('svg[role="img"] desc').length, 2);
    assert.deepEqual([...diagram.querySelectorAll('[data-frequency-layer="regional"] .spot-frequency-values strong')].map(el => el.textContent), ['60 Hz', '50 Hz']);
    assert.deepEqual([...diagram.querySelectorAll('[data-frequency-layer="rail"] .spot-frequency-values strong')].map(el => el.textContent), ['60 Hz', '60 Hz']);
    assert.equal(diagram.querySelectorAll('animate,animateTransform,iframe,button').length, 0);
    assert.match(diagram.textContent, lang === 'ja' ? /走行用電力/ : /traction power/);
    assert.match(diagram.querySelector('figcaption').textContent, lang === 'ja' ? /厳密な地理境界ではありません/ : /not an exact geographic boundary/);
    assert.match(diagram.querySelector('figcaption').textContent, lang === 'ja' ? /車内コンセントの仕様は示していません/ : /does not show a switch at the bridge or specify passenger sockets/);
    if (charging) {
      assert.match(charging.textContent, /100–240\s?V/);
      assert.match(charging.textContent, /110–240\s?V/);
      assert.match(charging.textContent, /50\/60\s?Hz/);
    }
    assert.ok(doc.querySelector('.spot-reading-guide[data-app-redundant]'), `${lang}: an editorial note does not expose duplicate ride prompts`);
    assert.equal(doc.querySelector('.spot-reading-guide > p:not(.spot-reading-eyebrow)'), null, `${lang}: no repeated viewing highlight`);
    const sources = doc.querySelector('.spot-reading-sources');
    const deviceSources = ['https://www.japan.travel/en/plan/plug-and-electricity/', 'https://support.apple.com/en-gb/120548', 'https://epaper.brennenstuhl.com/Stromverteilung_2024-2025/125/'];
    for (const destination of ['https://www.chuden.co.jp/energy/ene_about/electric/chishiki/mame_area/', 'https://jr-central.co.jp/news/release/_pdf/000042735.pdf#page=1', ...(lang === 'en' ? deviceSources : [])]) {
      assert.ok([...sources.querySelectorAll('a')].some(a => a.href === destination), `${lang}: primary source ${destination}`);
    }
    if (lang === 'ja') assert.ok(deviceSources.every(url => ![...sources.querySelectorAll('a')].some(a => a.href === url)));
    dom.window.close();
  }
  for (const lang of ['ja', 'en']) {
    const dom = renderedArticle('tokyo-tower', lang, true);
    assert.equal(dom.window.document.querySelector('.spot-frequency-diagram'), null);
    assert.ok(dom.window.document.querySelector('#tokyo-station > h3'), `${lang}: existing landmark headings retain h3`);
    assert.ok(dom.window.document.querySelector('.spot-reading-guide:not([data-app-redundant]) > p:not(.spot-reading-eyebrow)'), `${lang}: landmark chapters retain their boarding context`);
    dom.window.close();
  }
});

test('embedded articles hide duplicate ride prompts but retain facts, stamps and sources', () => {
  const css = fs.readFileSync(new URL('../app-embedded.css', import.meta.url), 'utf8');
  for (const lang of ['ja', 'en']) for (const id of ['kiyosu', 'fuji', 'pocari-fukuroi']) {
    for (const embedded of [false, true]) {
      const dom = renderedArticle(id, lang, embedded);
      const doc = dom.window.document;
      const style = doc.createElement('style'); style.textContent = css; doc.head.append(style);
      if (embedded) doc.documentElement.classList.add('mado-embedded-web');
      const hidden = el => { for (; el; el = el.parentElement) if (dom.window.getComputedStyle(el).display === 'none') return true; return false; };
      const ctas = [...doc.querySelectorAll('[data-cta-id="spot_next_train"], [data-cta-id="spot_next_live"], [data-cta-id="spot_guide_timing"]')];
      assert.ok(ctas.length, `${lang}/${id}: ride prompts remain available on the Web`);
      for (const cta of ctas) assert.equal(hidden(cta), embedded, `${lang}/${id}: ${cta.dataset.ctaId}`);
      assert.equal(hidden(doc.querySelector('.spot-page-stamp')), false);
      assert.equal(hidden(doc.querySelector('.spot-page-refs, .spot-reading-sources')), false);
      const reading = doc.querySelector('.spot-reading-guide');
      if (reading) assert.equal(hidden(reading), embedded && ![...reading.children].some(el => el.tagName === 'P' && !el.classList.contains('spot-reading-eyebrow')), `${lang}/${id}: factual guide visibility`);
      dom.window.close();
    }
  }
});

test('translated article snapshots preserve app-only suppression and collection/stamp routes', () => {
  const css = fs.readFileSync(new URL('../app-embedded.css', import.meta.url), 'utf8');
  for (const lang of ['', 'en/', 'zh-Hant/', 'fr/', 'de/', 'es/', 'zh-Hans/', 'ko/']) {
    const dom = new JSDOM(fs.readFileSync(new URL(`../${lang}castles.html`, import.meta.url), 'utf8'));
    const doc = dom.window.document;
    const prompts = [...doc.querySelectorAll('.cs-hero-actions a[href*="start.html"], .cs-card-actions a[href*="start.html"]')];
    assert.equal(prompts.length, 2);
    for (const prompt of prompts) assert.ok(prompt.hasAttribute('data-app-redundant'), lang);
    assert.ok(doc.querySelector('.cs-next p [data-app-redundant]'), lang);
    assert.ok(doc.querySelector('.cs-card-actions a[href*="journal.html"]:not([data-app-redundant])'), lang);
    const style = doc.createElement('style'); style.textContent = css; doc.head.append(style);
    assert.notEqual(dom.window.getComputedStyle(prompts[0]).display, 'none');
    doc.documentElement.classList.add('mado-embedded-web');
    assert.equal(dom.window.getComputedStyle(prompts[0]).display, 'none');
    dom.window.close();
  }
});

test("English article additions stay out of Japanese pages", () => {
  for (const id of ["pocari-fukuroi", "shizuoka-tea-fields"]) {
    const dom = renderedArticle(id, "ja");
    assert.equal(dom.window.document.querySelector(".spot-page-story-figure"), null);
    assert.equal(dom.window.document.querySelector(".spot-page-story-link"), null);
    assert.equal(dom.window.document.querySelector('a[href="https://www.otsuka.co.jp/en/nutraceutical/products/pocarisweat/"]'), null);
    dom.window.close();
  }
});

test("Pocari story answers the drink question before the factory and uses an uncredited owner photo", () => {
  for (const embedded of [false, true]) {
    const dom = renderedArticle("pocari-fukuroi", "en", embedded);
    const document = dom.window.document;
    const story = document.querySelector(".spot-page-story-lead").closest("section");
    assert.equal(story.querySelector("h2").textContent, "What is Pocari Sweat?");
    assert.match(story.querySelector(".spot-page-story-lead > p").textContent, /^Pocari Sweat is a Japanese sports drink/);
    const figure = story.querySelector("figure");
    assert.equal(figure.dataset.photoOwner, "michikusa");
    assert.equal(figure.querySelector("img").getAttribute("src"), "../../images/drinks/20261004-pocari-michikusa.webp");
    assert.doesNotMatch(figure.textContent, /michikusa|Credit/);
    assert.equal(story.querySelector(".spot-page-story-link a").getAttribute("href"), "../../en/drinks.html#brand-pocari");
    dom.window.close();
  }
});

test("English tea fields link reaches the tea section of the drink guide", () => {
  const dom = renderedArticle("shizuoka-tea-fields", "en");
  assert.equal(dom.window.document.querySelector(".spot-page-story-link a").getAttribute("href"), "../../en/drinks.html#tea");
  dom.window.close();
});


test('remaining editorial rollout preserves optional dates, language-specific updates and collections', () => {
  for (const prefix of ['', 'en/']) {
    for (const id of ['gamagori-greenhouses','pocari-fukuroi','rakusai-egg-tanks','kaguya-no-akari','kinshozan','putiputi-sign','lotte-shiga','hinataoka','fuji-bus-sales','fuji-pipe-sign','kiyosu','tokyo-tower','fuji-paper-mills','edo-castle-fujimi-yagura']) {
      const meta = CONTENT_METADATA[prefix + 'spots/' + id + '.html'];
      assert.equal(meta.article, true);
      assert.equal(meta.published, undefined);
      assert.ok(meta.dateReview && meta.editorialEvidence);
    }
  }
  assert.equal(CONTENT_METADATA['spots/pocari-fukuroi.html'].modified, '2026-10-11');
  assert.equal(CONTENT_METADATA['en/spots/pocari-fukuroi.html'].modified, '2026-10-11');
  assert.equal(contentLastmod(SITE + '/spots/pocari-fukuroi.html', '2026-10-03'), '2026-10-11');
  for (const file of ['en/arenani.html','en/727-collection.html','reflections.html','en/reflections.html','ferris-wheels.html','en/ferris-wheels.html','window-artworks.html','en/window-artworks.html']) {
    assert.equal(CONTENT_METADATA[file].kind, 'collection');
    assert.equal(CONTENT_METADATA[file].article, false);
  }
  assert.equal(CONTENT_METADATA['en/guide.html'].imageRights, 'own');
});


test('station article entry is English-only and preserves the existing Japanese chapter', () => {
  const payload = lang => { const context = {}; context.window = context; vm.runInNewContext(fs.readFileSync(new URL('../data/spot-pages/tokyo-tower.' + lang + '.js', import.meta.url), 'utf8'), context); return context.MADO_SPOT_PAGE_DATA; };
  const en = payload('en').chapters.find(c => c.id === 'tokyo-station');
  const ja = payload('ja').chapters.find(c => c.id === 'tokyo-station');
  assert.equal(en.link.route, 'en/tokyo-kyoto-stations.html#look-up');
  assert.ok(!ja.link);
  assert.equal(en.photos[0].src, ja.photos[0].src);
  assert.ok(!fs.readFileSync(new URL('../en/zukan.html', import.meta.url), 'utf8').includes('tokyo-kyoto-stations.html'));
});
