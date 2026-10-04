import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('bilingual TOP and hero frame use the same responsive first photo', () => {
  for (const lang of ['', 'en/']) {
    const html=fs.readFileSync(new URL(`../${lang}index.html`, import.meta.url),'utf8');
    const poster=html.match(/<div class="hv-poster"[^>]*><img [^>]+>/)?.[0];
    assert.ok(poster?.includes('images/thumbs/20240211_Mt.Fuji.webp 960w'));
    assert.ok(poster.includes('promo/assets/photos/fuji-snow.webp 1920w'));
    assert.ok(poster.includes('sizes="(max-width: 1680px) 100vw, 1680px"'));
    assert.ok(poster.includes('fetchpriority="high"'));
    assert.ok(!poster.includes('loading="lazy"'));
    assert.ok(poster.includes('width="1920" height="1080"'));
  }
  const stage=fs.readFileSync(new URL('../promo/hero-stage.js',import.meta.url),'utf8');
  assert.ok(stage.includes('../images/thumbs/20240211_Mt.Fuji.webp 960w, assets/photos/fuji-snow.webp 1920w'));
  assert.ok(stage.includes('sizes="(max-width: 1680px) 100vw, 1680px"'));
  for (const file of ['images/thumbs/20240211_Mt.Fuji.webp','promo/assets/photos/fuji-snow.webp']) {
    assert.ok(fs.existsSync(new URL('../'+file, import.meta.url)));
  }
});
