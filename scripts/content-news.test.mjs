import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { languages } from './shared/locales.mjs';
import { withContentNews } from './shared/content-news.mjs';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const origin = 'https://www.michikusa-travel.com/';
const script = read('content-news.js');
const inventory = JSON.parse(read('content-manifest.json'));
const distributed = new Set([...inventory.files, ...inventory.thumbnails.items].map(item => '/' + item.path));
function page(file) {
  return new JSDOM(read(file), {url:origin + file, runScripts:'outside-only'});
}

for (const language of languages) {
  test(language + ': discovery matches the live edition’s field guide, news links and ride entry', () => {
    const feed = JSON.parse(read('data/discovery/' + language + '.json'));
    const prefix = language === 'ja' ? '' : language + '/';
    for (const asset of ['/data/discovery/' + language + '.json', '/' + prefix + 'index.html', '/' + prefix + 'zukan.html', '/content-news.js', '/content-news.css']) {
      assert.ok(distributed.has(asset), asset);
    }
    for (const item of [...feed.features, ...feed.news]) {
      assert.ok(distributed.has(new URL(item.path, origin).pathname), item.path);
      if (item.image) assert.ok(distributed.has(item.image), item.image);
    }
    assert.equal(feed.schema, 1);
    assert.equal(feed.language, language);
    assert.equal(new Set(feed.news.map(item => item.id)).size, feed.news.length);
    assert.ok(feed.news.every(item => feed.newsBaseline.includes(item.id)));
    assert.ok(!feed.newsBaseline.includes('spot-video-selection'));
    assert.ok(!feed.newsBaseline.includes('solar-ark-section-correction'));
    assert.deepEqual(feed.news.slice(0, 3).map(item => item.id), language === 'ja'
      ? ['eki-stamp-guide', 'fuji-hourly-forecast', 'rivers-four-crossings']
      : ['eki-stamp-guide', 'nagoya-platform-kishimen', 'omikuji-goshuin-guide']);
    assert.equal(feed.news.some(item => item.id === 'donburi-guide'), language !== 'ja');
    assert.deepEqual(feed.news.map(item => item.date), feed.news.map(item => item.date).sort().reverse());
    for (const route of ['zukan.html', 'index.html']) {
      const file = prefix + route;
      const dom = page(file);
      try {
        const doc = dom.window.document;
        const guide = route === 'zukan.html';
        assert.equal(doc.querySelectorAll('#content-news').length, guide ? 0 : 1);
        const section = doc.querySelector('#content-news');
        const rows = [...doc.querySelectorAll('#content-news a[data-news-id]')];
        assert.deepEqual(rows.map(link => link.dataset.newsId), guide ? [] : feed.news.map(item => item.id));
        for (const [i, link] of rows.entries()) {
          assert.equal(link.href, origin + feed.news[i].path.slice(1));
          assert.equal(link.querySelector('time').dateTime, feed.news[i].date);
          assert.equal(fs.existsSync(new URL(feed.news[i].path.slice(1), root)), true);
          const title = link.querySelector('.content-news-text').cloneNode(true);
          title.querySelector('small').remove();
          assert.equal(title.textContent.trim(), feed.news[i].title);
        }
        assert.equal(withContentNews(read(file), file), read(file));
        assert.ok(doc.querySelector('a[href="' + prefix + 'start.html"]'));
        if (guide) {
          const cards = [...doc.querySelectorAll('.journey-intent-grid .journey-intent-card')];
          assert.equal(doc.querySelector('[data-cta-id="story_window"]').hreflang, language);
          assert.ok(cards.length > 0);
          assert.deepEqual(cards.map(card => card.dataset.ctaId), feed.features.map(item => item.id));
          cards.forEach((card, index) => {
            const item = feed.features[index];
            assert.equal(new URL(card.href).pathname, item.path);
            assert.equal(new URL(card.querySelector('img').src).pathname, item.image);
            const copy = card.querySelector('.journey-intent-copy');
            assert.equal(copy.querySelector('strong').textContent.trim(), item.title);
            assert.equal(copy.querySelector(':scope > span').textContent.trim(), item.description);
          });
        } else {
          assert.ok(doc.querySelector('.home-purpose').compareDocumentPosition(section) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
        }
      } finally { dom.window.close(); }
    }
  });
}

test('first visit, later publication, activation and reopening share stable IDs between routes and languages', () => {
  const home = page('index.html');
  const guide = page('en/index.html');
  const back = page('en/index.html');
  try {
    const baselineKey = 'mado-content-news.baseline.v1';
    const selector = '[data-news-unread]:not([hidden])';
    home.window.eval(script);
    assert.equal(home.window.document.querySelectorAll(selector).length, 0);
    const current = JSON.parse(home.window.localStorage.getItem(baselineKey));
    const id = guide.window.document.querySelector('[data-news-id]').dataset.newsId;
    // Model a browser whose first visit preceded the most recent announcement.
    guide.window.localStorage.setItem(baselineKey, JSON.stringify(current.filter(value => value !== id)));
    guide.window.eval(script);
    const badge = guide.window.document.querySelector(selector);
    assert.equal(badge.closest('a').dataset.newsId, id);
    assert.equal(guide.window.document.querySelectorAll(selector).length, 1);
    guide.window.document.addEventListener('click', event => event.preventDefault());
    badge.closest('a').click();
    assert.equal(guide.window.document.querySelectorAll(selector).length, 0);
    for (const key of Object.keys(guide.window.localStorage)) back.window.localStorage.setItem(key, guide.window.localStorage.getItem(key));
    back.window.eval(script);
    assert.equal(back.window.document.querySelectorAll(selector).length, 0);
  } finally { home.window.close(); guide.window.close(); back.window.close(); }
});

test('the header shows a dated, categorized inbox and only opening an item changes its count', async () => {
  const dom = page('index.html');
  try {
    const {window} = dom;
    const document = window.document;
    const feed = JSON.parse(read('data/discovery/ja.json'));
    Object.defineProperty(document, 'currentScript', {value: {src: origin + 'content-news.js'}});
    window.fetch = async () => ({ok: true, json: async () => feed});
    const prototype = window.HTMLDialogElement.prototype;
    prototype.showModal = function () { this.open = true; };
    prototype.close = function () { this.open = false; this.dispatchEvent(new window.Event('close')); };
    window.localStorage.setItem('mado-content-news.baseline.v1', JSON.stringify(feed.newsBaseline.filter(id => id !== 'eki-stamp-guide' && id !== 'fuji-hourly-forecast')));
    window.eval(script);
    await new Promise(resolve => setTimeout(resolve, 0));
    const bell = document.querySelector('.news-bell');
    const badge = bell.querySelector('.news-count');
    assert.equal(badge.textContent, '2');
    bell.click();
    const dialog = document.querySelector('#header-news-drawer');
    assert.ok(dialog.open);
    assert.equal(badge.textContent, '2');
    assert.deepEqual([...dialog.querySelectorAll('time')].map(date => date.dateTime), ['2026-11-26', '2026-11-21', '2026-11-19', '2026-11-14']);
    assert.deepEqual([...dialog.querySelectorAll('.news-kind')].map(kind => kind.textContent), ['特集','機能','特集','特集','新スポット']);
    dialog.querySelector('.news-item').addEventListener('click', event => event.preventDefault());
    dialog.querySelector('.news-item').click();
    assert.equal(badge.textContent, '1');
    assert.equal(dialog.open, false);
    assert.equal(dialog.querySelector('.news-more').href, origin + 'index.html#content-news');
  } finally { dom.window.close(); }
});

test('the Android shell owns its mount and storage, and blocked Web storage leaves headlines readable', () => {
  const native = page('index.html');
  const web = page('index.html');
  try {
    native.window.MADO_NATIVE_APP = true;
    native.window.eval(script);
    assert.equal(native.window.localStorage.length, 0);
    assert.ok(native.window.document.getElementById('content-news').hidden);
    Object.defineProperty(web.window, 'localStorage', {get() { throw Error('Storage disabled'); }});
    web.window.eval(script);
    assert.equal(web.window.document.getElementById('content-news').hidden, false);
    assert.equal(web.window.document.querySelectorAll('[data-news-unread]:not([hidden])').length, 0);
  } finally { native.window.close(); web.window.close(); }
});
