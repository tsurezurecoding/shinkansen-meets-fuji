import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import { CONTENT_METADATA, SITE, imageDimensions, metadataProblems, selectSpotOgImage, enhanceContentHead, contentLastmod } from './shared/content-metadata.mjs';
import { auditContentMetadata } from './shared/content-metadata-audit.mjs';

test('editorial metadata: curated candidates and generated spot contracts pass the site gate', () => {
  const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const spots = vm.runInNewContext(fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8') + ';SPOTS');
  const audit = auditContentMetadata(root, spots);
  assert.deepEqual(audit.problems, []);
  assert.equal(Object.keys(CONTENT_METADATA).length, 25);
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
  assert.equal(contentLastmod(SITE + '/yakei.html', '2026-08-14'), '2026-09-20');
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

test("English Fuji train table is static, matches Japanese times and selects real services", () => {
  const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const en = new JSDOM(read("en/guide.html"), { url: "https://www.michikusa-travel.com/en/guide.html", runScripts: "outside-only" });
  const ja = new JSDOM(read("guide.html")).window.document;
  const doc = en.window.document;
  const rows = [...doc.querySelectorAll("#trainTimes tbody tr")];
  const jaRows = [...ja.querySelectorAll("#trainTimes tbody tr")];
  assert.ok(rows.length > 500, "all train types and directions must be present without JS");
  assert.equal(rows.length, jaRows.length);
  assert.equal(doc.querySelectorAll("#trainTimes details").length, 6);
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
  assert.equal(start.querySelector('meta[name="robots"]').content, "noindex,follow");
  assert.equal(start.querySelector('link[rel="canonical"]'), null);
  en.window.eval(read("sun-window.js"));
  const sunScript = [...doc.scripts].find((script) => script.textContent.includes("var sun = window.MADO_SUN"));
  en.window.eval(sunScript.textContent);
  assert.ok(doc.querySelector('#trainTimes td[aria-label*="estimated"]'), "daylight labels must work in English");
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
