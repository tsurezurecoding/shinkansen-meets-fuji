import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { withFeatureMedia } from './shared/feature-media.mjs';
import { xVideoRatio, xVideoThumbnail } from './shared/x-video-thumbnails.mjs';

const features = [
  ['sparkling-dreams', 12, 2], ['hanabi', 22, 4], ['window-moments', 6, 10], ['arenani', 4, 0],
  ['reflections', 0, 4], ['stories/shinkalion', 0, 2], ['stories/shogun', 0, 1],
  ['stories/godzilla', 0, 1], ['727-collection', 0, 1], ['yakei', 0, 1],
];
test('an X post can link to another post in its text', () => {
  const html = '<div class="wm-x" data-placeholder="X"><template><blockquote class="twitter-tweet">' +
    '<p><a href="https://x.com/quoted/status/11">引用</a></p>' +
    '<a href="https://x.com/author/status/22">元投稿</a></blockquote></template></div>';
  const page = JSDOM.fragment(withFeatureMedia(html, 'arenani.html'));
  assert.equal(page.querySelector('.feature-post-open').href, 'https://x.com/author/status/22');
});
test('Japanese feature controls keep the credited sources and official embed destinations', () => {
  for (const [route, posts, videos] of features) {
    const file = route + '.html';
    const html = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.equal(withFeatureMedia(html, file), html, file + ' must be stable across repeated builds');
    const dom = new JSDOM(html);
    try {
      const doc = dom.window.document;
      const links = [...doc.querySelectorAll('a.feature-post-open')];
      assert.equal(links.length, posts, route);
      assert.equal(doc.querySelectorAll('blockquote.twitter-tweet').length, 0);
      assert.equal(doc.querySelectorAll('script[src*="feature-media.js"]').length, 1);
      for (const link of links) {
        const poster = link.querySelector('img[loading="lazy"]');
        assert.ok(poster, link.href);
        assert.equal(poster.src, xVideoThumbnail(link.href));
        assert.equal(new URL(poster.src).hostname, 'pbs.twimg.com');
        const ratio = xVideoRatio(link.href);
        assert.equal(link.parentElement.hasAttribute('data-feature-x-video'), Boolean(ratio));
        if (ratio) assert.equal(link.parentElement.style.getPropertyValue('--feature-clip-ratio'), ratio);
        const source = link.parentElement.querySelector('template').content.querySelector('blockquote.twitter-tweet');
        assert.ok([...source.querySelectorAll('a')].some(a => a.href.startsWith(link.href)), link.href);
        assert.ok([...doc.links].some(a => a !== link && a.href.startsWith(link.href)), 'visible credit ' + link.href);
      }
      const frames = [...doc.querySelectorAll('iframe[src*="youtube-nocookie.com/embed/"]')];
      assert.equal(frames.length + doc.querySelectorAll('.hb-facade,.wm-facade button').length, videos, route);
      for (const button of doc.querySelectorAll('.hb-facade,.wm-facade button')) {
        const poster = button.parentElement.querySelector('img[loading="lazy"]');
        assert.ok(poster?.src.includes('/vi/' + button.closest('[data-video-id]').dataset.videoId + '/'), route);
      }
      for (const frame of frames) {
        assert.ok(frame.title);
        const preview = JSDOM.fragment(frame.srcdoc);
        const link = preview.querySelector('a[href]');
        assert.equal(new URL(link.href).pathname, new URL(frame.src).pathname, route);
        assert.equal(new URL(link.href).searchParams.get('autoplay'), '1');
        assert.equal(preview.querySelector('img[loading="lazy"]')?.src,
          'https://i.ytimg.com/vi/' + new URL(frame.src).pathname.split('/').at(-1) + '/mqdefault.jpg');
        assert.equal(preview.querySelector('iframe,script'), null);
      }
    } finally { dom.window.close(); }
    const english = fs.readFileSync(new URL('../en/' + file, import.meta.url), 'utf8');
    assert.equal(withFeatureMedia(english, 'en/' + file), english);
    if (english.includes('feature-post-open') || english.includes(' srcdoc=')) {
      assert.match(english, /"loading":"Loading…"/, 'English ' + route);
    }
  }
});
