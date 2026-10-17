import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

for (const edition of ['', 'en/']) {
  const source = fs.readFileSync(new URL(`../${edition}early-access.html`, import.meta.url), 'utf8');
  const document = new JSDOM(source).window.document;
  test(`${edition || 'ja/'}legacy redirect keeps language, query and fragment`, () => {
    const script = document.querySelector('script').textContent;
    for (const suffix of ['', '?src=top-promo&lang=ja#ga-test', '?ga=off&src=contact#eaRideTitle']) {
      const current = new URL(`https://www.michikusa-travel.com/${edition}early-access.html${suffix}`);
      let destination;
      vm.runInNewContext(script, { window: { location: {
        search: current.search, hash: current.hash, replace(value) { destination = new URL(value, current); }
      } } });
      assert.equal(destination.pathname, `/${edition}android-app.html`);
      assert.equal(destination.search, current.search);
      assert.equal(destination.hash, current.hash);
    }
  });
  test(`${edition || 'ja/'}legacy redirect works without JavaScript`, () => {
    assert.equal(document.querySelector('meta[http-equiv="refresh"]').content, '0; url=android-app.html');
    assert.equal(document.querySelector('a').getAttribute('href'), 'android-app.html');
    assert.equal(document.querySelector('link[rel="canonical"]').href, `https://www.michikusa-travel.com/${edition}android-app.html`);
    assert(!/noindex/.test(source));
  });
}
