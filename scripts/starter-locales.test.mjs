import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import locales from '../locales.js';
import { expandDeliveredSiteChromeHTML } from './shared/site-runtime-validation.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.michikusa-travel.com';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const deliveredPage = relative => expandDeliveredSiteChromeHTML({ appDir:root, html:read(relative), relative });
const starterLanguages = ['it', 'th'];
const starterRoutes = ['index.html', 'guide.html', 'start.html', 'spots/fuji.html'];
const timelineLanguages = ['ja', 'en', 'fr', 'de', 'es', 'ko', 'zh-Hant', 'zh-Hans', 'it', 'th'];

function publicPath(language, route) {
  return `/${language}/${route === 'index.html' ? '' : route}`;
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
    if (!parent || parent.closest('script, style, template, .brand-mark, .show-credit, .utility-lang-menu')) continue;
    if (japanese.test((node.nodeValue || '').replaceAll('・', ''))) remaining.push(node.nodeValue.trim());
  }
  assert.deepEqual(remaining, [], `${label}: visible Japanese text remains: ${remaining.slice(0, 5).join(' / ')}`);
}

test('Italian and Thai starter editions contain only the four contracted routes', () => {
  for (const route of starterRoutes) {
    const supported = locales.supported(route);
    assert.ok(starterLanguages.every(language => supported.includes(language)), route);
  }
  for (const route of ['live/index.html', 'zukan.html', 'mieru.html', '727-collection.html']) {
    const supported = locales.supported(route);
    assert.ok(starterLanguages.every(language => !supported.includes(language)), `${route} must not expose starter editions`);
  }

  for (const language of starterLanguages) for (const route of starterRoutes) {
    const label = `${language}/${route}`;
    const html = deliveredPage(label);
    const url = origin + publicPath(language, route);
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;
    assert.equal(document.documentElement.lang, language, label);
    assert.equal(document.querySelector('link[rel="canonical"]')?.href, url, `${label}: canonical`);

    const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')];
    for (const edition of starterLanguages) {
      const alternate = alternates.find(element => element.hreflang === edition);
      assert.equal(alternate?.href, origin + publicPath(edition, route), `${label}: ${edition} alternate`);
    }
    assert.equal(alternates.find(element => element.hreflang === 'x-default')?.href, origin + publicPath('en', route), `${label}: English x-default alternate`);

    const menu = document.querySelector('details.utility-lang-menu');
    assert.ok(menu, `${label}: language menu`);
    for (const edition of starterLanguages) {
      const option = menu.querySelector(`a[lang="${edition}"]`);
      assert.equal(option?.href, `${origin}/${edition}/${route}`, `${label}: ${edition} menu link`);
    }
    assert.equal(menu.querySelector(`a[lang="${language}"]`)?.getAttribute('aria-current'), 'page', `${label}: current menu choice`);

    const fallbackNotes = document.querySelectorAll('a[hreflang="en"] .discovery-language');
    assert.ok(fallbackNotes.length > 0, `${label}: English fallback annotation`);
    assert.ok([...fallbackNotes].every(note => note.textContent.trim().startsWith('(')), `${label}: fallback annotation format`);
    assertLocalReferences(document, label);
    assertNoJapaneseVisibleText(document, label);
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

test('Italian and Thai restore one localized English fallback note after repeated applyLang calls', async () => {
  for (const language of ['it', 'th']) {
    const fixture = await timelineFixture(language);
    try {
      fixture.run('applyLang(); applyLang()');
      const document = fixture.window.document;
      const liveLink = document.querySelector('a[hreflang="en"][href*="live/index.html"]');
      assert.ok(liveLink, `${language}: English live link`);
      const notes = liveLink.querySelectorAll('.discovery-language');
      assert.equal(notes.length, 1, `${language}: one live fallback note`);
      const expectedNote = fixture.run('MADO_UTILITY_PAYLOAD.translations["English — audio also in English"]');
      assert.equal(notes[0].textContent.trim(), `(${expectedNote})`, `${language}: localized live fallback note`);

      const localGuideLink = document.querySelector('a[data-guide-nav]');
      assert.ok(localGuideLink, `${language}: local guide link`);
      assert.equal(localGuideLink.hasAttribute('hreflang'), false, `${language}: local guide has no English annotation`);
      assert.equal(localGuideLink.querySelectorAll('.discovery-language').length, 0, `${language}: local guide has no fallback note`);
    } finally { fixture.dom.window.close(); }
  }
});
