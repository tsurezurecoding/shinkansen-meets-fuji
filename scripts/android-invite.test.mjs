import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { withAndroidInvite } from './shared/android-invite.mjs';

const code = fs.readFileSync(new URL('./shared/android-invite-runtime.js', import.meta.url), 'utf8');
const key = 'mado-android-invite-v1';
const android = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36';
function run(options = {}) {
  const classes = new Set(), listeners = {}, events = [], values = new Map(options.values || []);
  const card = { style: {}, inert: false, setAttribute() {}, classList: { add() {} },
    querySelector(selector) { return { addEventListener(name, callback) { listeners[selector] = callback; } }; } };
  const document = { documentElement: { lang: 'ja', classList: { add: x => classes.add(x), remove: x => classes.delete(x) } },
    addEventListener(name, fn) { listeners[name] = fn; }, querySelector(selector) { return selector === '.android-invite' ? card : { focus() {} }; } };
  const localStorage = { getItem(k) { if (options.readFailure) throw Error('denied'); return values.get(k) || null; },
    setItem(k, value) { if (options.writeFailure) throw Error('quota'); values.set(k, value); } };
  const window = { matchMedia: () => ({ matches: !options.standalone, addEventListener() {} }),
    addEventListener(name, fn) { listeners[name] = fn; }, MADO_ANALYTICS_DISABLED: options.analytics !== true,
    gtag(...args) { events.push(args); }, ...options.window };
  window.self = window; window.top = options.frame ? {} : window;
  class Observer {
    constructor(fn) { listeners.intersection = fn; }
    observe() {}
    disconnect() { listeners.disconnected = true; }
  }
  if (options.observer) window.IntersectionObserver = Observer;
  const context = { window, document, navigator: { userAgent: options.ua || android },
    location: { search: options.search || '', pathname: '/guide.html' }, localStorage, URLSearchParams, Date, Math,
    ...(options.observer ? { IntersectionObserver: Observer } : {}) };
  vm.runInNewContext(code, context);
  listeners.DOMContentLoaded?.();
  return { classes, card, listeners, values, events };
}
test('Android regular browsers allowed; UA / native / PWA / embedded exclusions fail closed', () => {
  for (const ua of [android, android.replace('Chrome/140.0.0.0', 'Firefox/140.0'), android + ' SamsungBrowser/28.0', android + ' EdgA/140.0']) {
    assert(run({ ua }).classes.has('android-invite-eligible'));
  }
  for (const options of [{ ua: 'iPhone Safari/18' }, { ua: 'Windows Chrome/140.0' }, { ua: 'Googlebot' },
    { ua: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    { ua: android + ' wv' }, { ua: android + ' Version/4.0' }, { ua: android + ' Instagram' }, { ua: android + ' Line/15' },
    { ua: android + ' FBAV/1' }, { ua: android + ' GSA/1' }, { standalone: true }, { frame: true },
    { search: '?from=android-app' }, { window: { Capacitor: {} } }, { window: { MADO_NATIVE_APP: true } }, { window: { MADO_EMBEDDED_WEB: true } }]) {
    assert.equal(run(options).classes.size, 0, JSON.stringify(options));
  }
});
test('storage refusal, quota and corrupt state never show the invitation', () => {
  for (const options of [{ readFailure: true }, { writeFailure: true }, { values: [[key, '{broken']] },
    { values: [[key, '{}']] }, { values: [[key, 'false']] }]) assert.equal(run(options).classes.size, 0);
});
test('cooldown across pages and tabs; expiry allows a new invitation', () => {
  const first = run(); assert(first.classes.size);
  assert.equal(run({ values: first.values }).classes.size, 0);
  assert(run({ values: [[key, JSON.stringify({ until: Date.now() - 1 })]] }).classes.size);
});
test('dismiss stays hidden, preserves footprint, suppresses later pages; analytics optout is honoured', () => {
  const first = run(); first.listeners.button();
  assert.equal(first.card.style.visibility, 'hidden'); assert(first.card.inert);
  assert.equal(first.events.length, 0);
  assert.equal(run({ values: first.values }).classes.size, 0);
  const tracked = run({ analytics: true }); tracked.listeners.button();
  assert.equal(tracked.events[0][1], 'android_app_invite_dismiss');
});
test('Play click is a click only; BFCache / other-tab stop hides without shifting', () => {
  const first = run({ analytics: true }); first.listeners.a();
  assert.equal(first.events[0][1], 'android_install_click');
  first.listeners.pageshow(); assert.equal(first.card.style.visibility, 'hidden');
  const second = run(); second.values.set(key, JSON.stringify({ stop: true }));
  second.listeners.storage({ key }); assert(second.card.inert);
});
test('generated blocks are deterministic and localized; metadata and original main survive', () => {
  const base = '<html><head><title>Keep me</title></head><body><main>Keep body</main></body></html>';
  for (const lang of ['ja', 'en']) {
    const html = withAndroidInvite(base, lang);
    assert.equal(withAndroidInvite(html, lang), html);
    assert(html.includes('<title>Keep me</title>')); assert(html.includes('<main>Keep body</main>'));
    assert(html.includes(lang === 'en' ? '>Google Play</a>' : 'Google Playで見る'));
    const href = html.match(/<a href="([^"]+)"/)[1].replaceAll('&amp;', '&');
    const url = new URL(href);
    assert.equal(url.origin, 'https://play.google.com');
    assert.deepEqual([...url.searchParams], [['id','com.michikusatravel.shinkansenwindow'],
      ['utm_source','shinkansen_window_web'], ['utm_medium','android_browser_inline'], ['utm_campaign','android_app_invite']]);
  }
});
test('view counts only at 50% visibility; small initial intersection keeps observing', () => {
  const first = run({ observer: true, analytics: true });
  first.listeners.intersection([{ isIntersecting: true, intersectionRatio: 0.01 }]);
  assert.equal(first.events.length, 0); assert.equal(first.listeners.disconnected, undefined);
  first.listeners.intersection([{ isIntersecting: true, intersectionRatio: 0.49 }]);
  assert.equal(first.events.length, 0);
  first.listeners.intersection([{ isIntersecting: true, intersectionRatio: 0.5 }]);
  assert.equal(first.events[0][1], 'android_app_invite_view'); assert.equal(first.listeners.disconnected, true);
  const optedOut = run({ observer: true });
  optedOut.listeners.intersection([{ isIntersecting: true, intersectionRatio: 1 }]);
  assert.equal(optedOut.events.length, 0);
});
