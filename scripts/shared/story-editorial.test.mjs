import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {resolveStoryMarkup} from './story-editorial.mjs';

test('responsive display images keep a separate full-size photo destination at language depth',()=>{
  const html=resolveStoryMarkup('<a class="photo-open" href="assets/images/story-window/original.jpg"><img src="assets/display/view-480.webp" srcset="assets/display/view-160.webp 160w, assets/display/view-960.webp 960w"></a>','fr','../../');
  const doc=new JSDOM(html).window.document;
  assert.equal(doc.querySelector('a').getAttribute('href'),'../../images/story-window/original.jpg');
  assert.equal(doc.querySelector('img').getAttribute('src'),'../../images/story-window/display/view-480.webp');
  assert.equal(doc.querySelector('img').getAttribute('srcset'),'../../images/story-window/display/view-160.webp 160w, ../../images/story-window/display/view-960.webp 960w');
});
test('product links select the reader language and preserve section and query state',()=>{
  const html=resolveStoryMarkup('<a href="https://www.michikusa-travel.com/stories/godzilla.html?mode=read#maruko">Read</a><a href="#history">History</a>','ko','../../');
  const doc=new JSDOM(html).window.document;
  assert.equal(doc.querySelector('a').getAttribute('href'),'../../ko/stories/godzilla.html?mode=read#maruko');
  assert.equal(doc.querySelectorAll('a')[1].getAttribute('href'),'#history');
});
test('official video frames remain discoverable before any click',()=>{
  const html=resolveStoryMarkup('<iframe src="https://www.youtube-nocookie.com/embed/VQfAzBXL1JY?rel=0" title="Official trailer" referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe>','en','../../');
  const frame=new JSDOM(html).window.document.querySelector('iframe');
  assert.equal(frame.getAttribute('src'),'https://www.youtube-nocookie.com/embed/VQfAzBXL1JY?rel=0');
  assert.equal(frame.getAttribute('referrerpolicy'),'strict-origin-when-cross-origin');
});
