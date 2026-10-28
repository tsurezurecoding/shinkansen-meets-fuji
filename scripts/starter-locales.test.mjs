import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import locales from '../locales.js';
import { expandDeliveredSiteChromeHTML } from './shared/site-runtime-validation.mjs';
import { englishNarrations } from './shared/utility-localization.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.michikusa-travel.com';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const deliveredPage = relative => expandDeliveredSiteChromeHTML({ appDir:root, html:read(relative), relative });
const starterLanguages = ['it', 'th'];
const starterRoutes = ['index.html', 'guide.html', 'start.html', 'spots/fuji.html', 'zukan.html', 'live/index.html'];
const timelineLanguages = ['ja', 'en', 'fr', 'de', 'es', 'ko', 'zh-Hant', 'zh-Hans', 'it', 'th'];

function publicPath(language, route) {
  return `/${language}/${route === 'index.html' ? '' : route.replace('live/index.html', 'live/')}`;
}

function assertLocalReferences(document, label) {
  for (const element of document.querySelectorAll('[href], [src]')) {
    const raw = element.getAttribute('href') ?? element.getAttribute('src');
    if (!raw) continue;
    const url = new URL(raw, document.baseURI);
    if (url.origin !== origin) continue;
    let target = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
    const relative = path.relative(root, target);
    assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative), `${label}: local reference escapes product root: ${raw}`);
    assert.ok(fs.existsSync(target), `${label}: missing local target for ${raw} (${relative})`);
  }
}

function assertNoJapaneseVisibleText(document, label) {
  const japanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;
  const walker = document.createTreeWalker(document.body, document.defaultView.NodeFilter.SHOW_TEXT);
  const remaining = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || parent.closest('script, style, template, .brand-mark, .show-credit, .utility-lang-menu, .article-lang-menu, figcaption a')) continue;
    if (japanese.test((node.nodeValue || '').replaceAll('・', ''))) remaining.push(node.nodeValue.trim());
  }
  assert.deepEqual(remaining, [], `${label}: visible Japanese text remains: ${remaining.slice(0, 5).join(' / ')}`);
}

test('Italian and Thai retain their original six entry pages after full-edition promotion', () => {
  for (const route of starterRoutes) {
    const supported = locales.supported(route);
    assert.ok(starterLanguages.every(language => supported.includes(language)), route);
  }
  for (const route of ['references.html']) {
    const supported = locales.supported(route);
    assert.ok(starterLanguages.every(language => !supported.includes(language)), `${route} must not invent additional editions`);
  }

  for (const language of starterLanguages) for (const route of starterRoutes) {
    const label = `${language}/${route}`;
    const html = deliveredPage(label);
    const url = origin + publicPath(language, route);
    const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
    dom.window.eval(read('locales.js'));
    dom.window.eval(read(route.startsWith('spots/') ? 'article-locales.js' : 'utility-locales.js'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    const document = dom.window.document;
    assert.equal(document.documentElement.lang, language, label);
    assert.equal(document.querySelector('link[rel="canonical"]')?.href, url, `${label}: canonical`);

    const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')];
    for (const edition of starterLanguages) {
      const alternate = alternates.find(element => element.hreflang === edition);
      assert.equal(alternate?.href, origin + publicPath(edition, route), `${label}: ${edition} alternate`);
    }
    assert.equal(alternates.find(element => element.hreflang === 'x-default')?.href, origin + publicPath('en', route), `${label}: English x-default alternate`);

    const menu = document.querySelector('details.utility-lang-menu,details.article-lang-menu');
    assert.ok(menu, `${label}: language menu`);
    for (const edition of starterLanguages) {
      const option = menu.querySelector(`a[lang="${edition}"]`);
      assert.equal(new URL(option.href).pathname.replace(/\/index\.html$/, '/'), publicPath(edition, route), `${label}: ${edition} menu link`);
    }
    assert.equal(menu.querySelector(`a[lang="${language}"]`)?.getAttribute('aria-current'), 'page', `${label}: current menu choice`);

    const fallbackNotes = document.querySelectorAll('a[hreflang="en"] .discovery-language');
    assert.ok([...fallbackNotes].every(note => note.textContent.trim()), `${label}: nonempty English fallback annotation`);
    assertLocalReferences(document, label);
    assertNoJapaneseVisibleText(document, label);
    if (['zukan.html', 'live/index.html'].includes(route)) {
      for (const element of document.querySelectorAll('[aria-label]')) {
        if (element.closest('.utility-lang-menu,.article-lang-menu')) continue;
        assert.ok(!/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(element.getAttribute('aria-label')), `${label}: Japanese accessibility label remains`);
      }
      const manifest = JSON.parse(read('content-manifest.json'));
      assert.ok(manifest.files.some(item => item.path === label), `${label}: distribution manifest`);
    }
    if (route === 'spots/fuji.html') {
      assert.equal(document.querySelector('[data-spot-page-shared-module]'), null, `${label}: no unrendered shared module`);
    }
    dom.window.close();
  }
});

async function timelineFixture(language) {
  const route = language === 'ja' ? 'start.html' : `${language}/start.html`;
  const dom = new JSDOM(deliveredPage(route), {
    url: `${origin}/${route}`,
    runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const window = dom.window;
  await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.localStorage.setItem('mado-timeline-filters-v1', '[]');
  const context = dom.getInternalVMContext();
  const files = ['locales.js', 'data/timetable.js', 'data-runtime.js'];
  if (!['ja', 'en'].includes(language)) files.push(`${language}/utility-data.js`, 'utility-locale-runtime.js');
  files.push('track.js', 'train-select.js', 'app.js');
  for (const file of files) vm.runInContext(read(file), context, { filename: file });
  const run = code => vm.runInContext(code, context);
  run('bindTimelineControls(); renderInitialTimelinePreview(); updateTimelineFilterButtons()');
  return {
    dom, window, run,
    click: filter => window.document.querySelector(`[data-timeline-filter="${filter}"]`).click(),
    ids: () => [...window.document.querySelectorAll('#timeline .tl-item')].map(item => item.dataset.spot),
  };
}

test('timeline recommendations render localized labels and keep seat filtering available in all ten editions', async () => {
  for (const language of timelineLanguages) {
    const fixture = await timelineFixture(language);
    try {
      const { window, run } = fixture;
      const classic = window.document.querySelector('[data-timeline-filter="recommended"]');
      const badge = window.document.querySelector('.tl-recommended-badge');
      const summary = window.document.querySelector('#timelineRecommendationSummary');
      const moreButton = window.document.querySelector('#timelineRecommendationMore button');
      assert.equal(run('hasTimelineRecommendations()'), true, language);
      assert.equal(fixture.ids().length, 17, `${language}: classic default`);
      assert.equal(window.document.querySelectorAll('#timeline .tl-recommended-badge').length, 17, `${language}: classic cards`);
      assert.ok(classic?.textContent.trim(), `${language}: localized classic filter`);
      assert.ok(badge?.textContent.trim(), `${language}: localized classic badge`);
      assert.equal(badge.textContent.trim(), classic.textContent.trim(), `${language}: filter and card label`);
      assert.ok(summary.textContent.includes(classic.textContent.trim()), `${language}: localized filter summary`);
      assert.ok(moreButton?.textContent.trim(), `${language}: localized discovery action`);
      if (language !== 'en') assert.notEqual(classic.textContent.trim(), 'Classics', `${language}: classic label fell back to English`);

      fixture.click('all');
      const allCount = fixture.ids().length;
      assert.ok(allCount > 17, `${language}: all views`);
      assert.ok(summary.textContent.trim(), `${language}: all-views summary`);
      fixture.click('seat-a');
      assert.ok(fixture.ids().length > 0 && fixture.ids().length < allCount, `${language}: seat filter changes the results`);
      assert.equal(window.document.querySelector('[data-timeline-filter="seat-a"]').getAttribute('aria-pressed'), 'true', `${language}: seat filter state`);
    } finally { fixture.dom.window.close(); }
  }
});

test('Italian and Thai retain local live/gallery links after repeated language application', async () => {
  for (const language of ['it', 'th']) {
    const fixture = await timelineFixture(language);
    try {
      fixture.run('applyLang(); applyLang()');
      const document = fixture.window.document;
      for (const target of ['live/', 'zukan.html']) {
        const links = [...document.querySelectorAll('a[href]')].filter(a => new URL(a.href).pathname.includes(`/${language}/${target}`));
        assert.ok(links.length, `${language}: local ${target} links`);
        for (const link of links) {
          assert.notEqual(link.hreflang, 'en', `${language}: local link must not claim English`);
          assert.equal(link.querySelectorAll('.discovery-language').length, 0, `${language}: no obsolete English fallback note`);
        }
      }

      const localGuideLink = document.querySelector('a[data-guide-nav]');
      assert.ok(localGuideLink, `${language}: local guide link`);
      assert.equal(localGuideLink.hasAttribute('hreflang'), false, `${language}: local guide has no English annotation`);
      assert.equal(localGuideLink.querySelectorAll('.discovery-language').length, 0, `${language}: local guide has no fallback note`);

      // Promotion expands the route set but still leaves some articles in English.
      fixture.run('document.body.insertAdjacentHTML("beforeend", spotDetailModalHTML(SPOTS.find(spot => spot.id === "solar-ark"))); applyLang(); applyLang()');
      const fallback = [...document.querySelectorAll('a.spot-modal-guide-cta')].find(a => new URL(a.href).pathname === '/en/spots/solar-ark.html');
      assert.ok(fallback, `${language}: unlocalized article keeps its real English destination`);
      assert.equal(fallback.hreflang, 'en', `${language}: English article is identified`);
      assert.equal(fallback.querySelectorAll('.discovery-language').length, 1, `${language}: exactly one English fallback note after repeated application`);
      assert.ok(fallback.querySelector('.discovery-language').textContent.trim(), `${language}: visible language-change cue`);
    } finally { fixture.dom.window.close(); }
  }
});

test('Italian and Thai article video placeholders display localized loading text', () => {
  for (const language of starterLanguages) {
    const dictionary = JSON.parse(read(`scripts/locales/castle-${language}.json`));
    const dom = new JSDOM(deliveredPage(`${language}/spots/fujitec-big-wing.html`));
    try {
      const frames = [...dom.window.document.querySelectorAll('[data-video-platform="x"][data-video-loading-label]')];
      assert.ok(frames.length, `${language}: X embeds expose pending-state copy`);
      for (const frame of frames) {
        assert.equal(frame.getAttribute('data-video-loading-label'), dictionary['Loading posted videos…'], `${language}: localized pending label`);
        assert.notEqual(frame.getAttribute('data-video-loading-label'), 'Loading posted videos…', `${language}: pending state must not fall back to English`);
      }
    } finally { dom.window.close(); }
  }
});

test('Italian and Thai live subtitles are localized while preserving English recordings and playback metadata', () => {
  const original = englishNarrations(root);
  for (const language of starterLanguages) {
    const context = { window: {} };
    vm.runInNewContext(read(`${language}/utility-data.js`), context);
    const payload = context.window.MADO_UTILITY_PAYLOAD;
    assert.ok(payload.tables.live, `${language}: live controls`);
    for (const [id, directions] of Object.entries(original)) for (const [direction, variants] of Object.entries(directions)) {
      if (!variants.en) continue;
      const localized = payload.narrations[id]?.[direction];
      assert.ok(localized?.text, `${language}/${id}/${direction}: subtitle`);
      assert.notEqual(localized.text, variants.en.text, `${language}/${id}/${direction}: subtitle must not remain English`);
      const expectedAudio = variants.en.audio === false ? false : variants.en.audio || `audio/${id}_${direction}_en.mp3`;
      assert.equal(localized.audio, expectedAudio, `${language}/${id}/${direction}: recording`);
      for (const [key, value] of Object.entries(variants.en)) if (!['text', 'audio'].includes(key)) assert.equal(localized[key], value, `${language}/${id}/${direction}: ${key}`);
    }
    const doc = new JSDOM(deliveredPage(`${language}/live/index.html`)).window.document;
    assert.equal(doc.querySelector('.utility-audio-note')?.textContent, payload.translations['Audio is currently available in English.']);
    for (const route of ['zukan.html', 'live/']) assert.ok(read('sitemap.xml').includes(`${origin}/${language}/${route}</loc>`), `${language}/${route}: sitemap`);
  }
});


test('full Italian and Thai route inventory stays distributed with canonical sitemap entries', () => {
  const routes = [...new Set([...locales.routes, ...Object.keys(locales.episodes)])];
  const manifest = new Set(JSON.parse(read('content-manifest.json')).files.map(item => item.path));
  const sitemap = new JSDOM(read('sitemap.xml'), {contentType: 'application/xml'});
  const urls = [...sitemap.window.document.querySelectorAll('url > loc')].map(node => node.textContent);
  for (const language of ['it', 'th']) for (const route of routes) {
    const file = language + '/' + route;
    assert.ok(fs.existsSync(path.join(root, file)), file);
    assert.ok(manifest.has(file), file + ': manifest');
    const url = origin + publicPath(language, route);
    assert.equal(urls.filter(value => value === url).length, route === 'spots/ibuki-seat-a.html' ? 0 : 1, file + ': sitemap');
  }
  sitemap.window.close();
});
