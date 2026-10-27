import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { responsivePhotoPlan } from './shared/responsive-photos.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
test('responsive plan uses content-verified dimensions without Python, avoids upscaling and rejects stale cache', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mado-photo-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'images/thumbs/display'), { recursive: true });
  const source = 'images/photo.jpg', thumb = 'images/thumbs/photo.webp';
  fs.writeFileSync(path.join(root, source), 'original');
  fs.writeFileSync(path.join(root, thumb), 'preview');
  const entry = { sha256: hash('original'), width: 4032, height: 2268, thumb, thumbSha256: hash('preview'), thumbWidth: 960, thumbHeight: 540 };
  const index = () => fs.writeFileSync(path.join(root, 'images/thumbs/display/index.json'), JSON.stringify({ sources: { [source]: entry } }));
  index();
  const previous = process.env.MADO_PYTHON;
  process.env.MADO_PYTHON = path.join(root, 'python-must-not-be-called');
  try {
    const plan = responsivePhotoPlan(root, [{ src: source, thumb }]);
    assert.deepEqual(plan.sources[source].map(row => row.slice(1)), [[640, 360], [960, 540], [1920, 1080]]);
    assert.equal(plan.derivatives.length, 2);
    assert.equal(plan.sources[source][1][0], thumb);
    assert.ok(plan.derivatives.every(item => item.target.includes(hash('original').slice(0, 8))));
    entry.width = 1280; entry.height = 720; index();
    const smallOriginal = responsivePhotoPlan(root, [{ src: source, thumb }]);
    assert.deepEqual(smallOriginal.sources[source].at(-1), [source, 1280, 720]);
    assert.equal(smallOriginal.derivatives.length, 1);
    entry.width = 480; entry.height = 270; entry.thumbWidth = 480; entry.thumbHeight = 270; index();
    assert.deepEqual(responsivePhotoPlan(root, [{ src: source, thumb }]).sources[source], [[thumb, 480, 270]]);
    fs.writeFileSync(path.join(root, source), 'changed source');
    assert.throws(() => responsivePhotoPlan(root, [{ src: source, thumb }]), /New photo dimensions require Pillow/);
  } finally { if (previous === undefined) delete process.env.MADO_PYTHON; else process.env.MADO_PYTHON = previous; }
});

test('localized static photo candidates work without a page payload or IntersectionObserver', () => {
  const dom = new JSDOM('<body data-spot-page-shared-root="../../"><img data-photo-deferred data-photo-original-src="../../images/photo.jpg" data-photo-display-src="../../images/thumbs/photo.webp" data-photo-srcset="../../images/thumbs/photo.webp 960w"></body>', { url: 'https://example.test/fr/spots/demo.html' });
  try {
    const w = dom.window, context = { window: w, URL: w.URL };
    vm.runInNewContext(fs.readFileSync(new URL('../spot-page-shared.js', import.meta.url), 'utf8'), context);
    context.document = w.document;
    w.MADO_SPOT_PHOTOS.observe(w.document);
    const image = w.document.querySelector('img');
    assert.equal(image.loading, 'lazy');
    assert.equal(image.getAttribute('src'), '../../images/thumbs/photo.webp');
    assert.match(image.srcset, /960w/);
    w.MADO_SPOT_PHOTOS.apply(image, '../../images/another.jpg');
    assert.equal(image.getAttribute('src'), '../../images/another.jpg');
    assert.equal(image.srcset, '');
  } finally { dom.window.close(); }
});

test('deferred photos wait for intersection and use responsive candidates on HTTP and file URLs', () => {
  for (const url of ['https://example.test/spots/demo.html', 'file:///C:/site/spots/demo.html']) {
    const dom = new JSDOM('<body data-spot-page-shared-root="../"><img data-photo-deferred data-photo-original-src="../images/photo.jpg"></body>', { url });
    try {
      const w = dom.window, observed = new Set(); let callback;
      w.IntersectionObserver = class { constructor(fn) { callback = fn; } observe(node) { observed.add(node); } unobserve(node) { observed.delete(node); } };
      w.MADO_SPOT_PAGE_DATA = { imageSources: { 'images/photo.jpg': [['images/thumbs/photo.webp', 960, 540], ['images/thumbs/display/photo.webp', 1920, 1080]] } };
      const context = { window: w, URL: w.URL };
      vm.runInNewContext(fs.readFileSync(new URL('../spot-page-shared.js', import.meta.url), 'utf8'), context);
      context.document = w.document;
      const image = w.document.querySelector('img');
      w.MADO_SPOT_PHOTOS.observe(w.document);
      w.MADO_SPOT_PHOTOS.observe(w.document);
      assert.equal(observed.size, 1);
      assert.equal(image.hasAttribute('src'), false);
      callback([{ target: image, isIntersecting: false }]);
      assert.equal(image.hasAttribute('src'), false);
      callback([{ target: image, isIntersecting: true }]);
      assert.equal(observed.size, 0);
      assert.equal(image.getAttribute('src'), '../images/thumbs/photo.webp');
      assert.match(image.srcset, /960w.*1920w/);
      assert.match(image.sizes, /892px/);
    } finally { dom.window.close(); }
  }
});

test('gallery selection keeps originals for explicit actions without requesting them as display src', () => {
  const dom = new JSDOM('<body data-spot-page-shared-id="demo"><div data-spot-media-gallery><img data-gallery-image><span data-gallery-note-output></span><span data-gallery-credit-output></span><span data-gallery-date-output></span><button data-gallery-thumb data-gallery-src="../images/a.jpg" data-gallery-display-src="../images/thumbs/a.webp" data-gallery-srcset="../images/thumbs/a.webp 960w" data-gallery-alt="First"></button><button data-gallery-thumb data-gallery-src="../images/b.jpg" data-gallery-display-src="../images/thumbs/b.webp" data-gallery-srcset="../images/thumbs/b.webp 960w, ../images/thumbs/display/b.webp 1920w" data-gallery-sizes="400px" data-gallery-alt="Second"></button></div></body>', { url: 'https://example.test/spots/demo.html', runScripts: 'outside-only' });
  try {
    const w = dom.window, image = w.document.querySelector('img'), assignments = [];
    const descriptor = Object.getOwnPropertyDescriptor(w.HTMLImageElement.prototype, 'src');
    Object.defineProperty(image, 'src', { get() { return descriptor.get.call(this); }, set(value) { assignments.push({ src: value, srcset: this.srcset }); descriptor.set.call(this, value); } });
    w.eval(fs.readFileSync(new URL('../spot-media-gallery.js', import.meta.url), 'utf8'));
    w.document.querySelectorAll('button')[1].click();
    assert.equal(image.getAttribute('src'), '../images/thumbs/b.webp');
    assert.equal(image.getAttribute('data-photo-original-src'), '../images/b.jpg');
    assert.match(assignments[0].srcset, /1920w/);
    assert.ok(assignments.every(item => !item.src.endsWith('.jpg')));
    assert.equal(w.location.hash, '#spot-demo/photo-2');
    w.location.hash = '#spot-demo'; w.dispatchEvent(new w.HashChangeEvent('hashchange'));
    assert.equal(image.alt, 'First');
    assert.equal(image.getAttribute('src'), '../images/thumbs/a.webp');
  } finally { dom.window.close(); }
});
