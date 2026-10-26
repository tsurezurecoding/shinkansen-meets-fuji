import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonTargetFailures, expandDeliveredSiteChromeHTML, renderSiteRuntimeForValidation } from './site-runtime-validation.mjs';

const appDir = fileURLToPath(new URL('../../', import.meta.url));
const actualRenderer = await fs.readFile(path.join(appDir, 'site-chrome.js'), 'utf8');
async function fixture(t) {
  const directory = path.join(appDir, '.codex-local/site-runtime-fixtures');
  await fs.mkdir(directory, { recursive: true });
  const root = await fs.mkdtemp(path.join(directory, 'case-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const write = async (file, data) => { await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true }); await fs.writeFile(path.join(root, file), data); };
  const components = {
    header: '<header class="topbar"><nav class="top-nav"><a href="__MADO_ROOT__en/start.html">Train</a><a href="__MADO_ROOT__en/zukan.html">Views</a></nav><!--SITE_CHROME_MENU--></header>',
    footer: '<footer class="footer"><a href="__MADO_ROOT__en/guide.html">Guide</a></footer>',
    content: '<section class="content-rail-section"><a href="__MADO_ROOT__en/zukan.html"><img src="__MADO_ROOT__images/test.svg" alt="View">Views</a></section>',
    rail: '<aside class="spot-page-rail"><a href="__MADO_ROOT__en/start.html">Train</a></aside>',
    showcase: '<section class="spot-page-showcase"><a href="__MADO_ROOT__en/zukan.html">Views</a></section>',
    tools: '<div class="tools-grid"><a href="__MADO_ROOT__en/live/">GPS</a></div>',
    collection: '<aside class="spot-reading-related"><a href="__MADO_ROOT__en/zukan.html">Collection</a></aside>',
  };
  const assets = ['shared-ui/en.shell.js', 'shared-ui/en.rail-guide.js', 'shared-ui/en.cards.js'];
  const groups = [['header', 'footer', 'content'], ['rail'], ['showcase', 'tools', 'collection']];
  for (const [index, asset] of assets.entries()) {
    const payload = { version: 1, components: Object.fromEntries(groups[index].map(kind => [kind, components[kind]])), menus: index === 0 ? { language: '<div class="lang-switch"><a href="__MADO_ROOT____MADO_MENU_ROUTE__?lang=ja">日本語</a></div>' } : {} };
    await write(asset, `window.MADO_SHARED_UI ||= {version:1,components:{},menus:{}}; Object.assign(window.MADO_SHARED_UI.components, ${JSON.stringify(payload.components)}); Object.assign(window.MADO_SHARED_UI.menus, ${JSON.stringify(payload.menus)});`);
  }
  const config = { assets, root: '../', route: 'guide.html', lang: 'en', mounts: Object.keys(components).map((kind, index) => ({ host: `chrome-${index}`, component: kind, kind, ...(kind === 'header' ? { menu: 'language', menuRoute: 'guide.html' } : {}) })) };
  const page = () => `<html lang="en"><head></head><body>${config.mounts.map(mount => `<div data-site-chrome-host="${mount.host}"><nav data-site-chrome-fallback>fallback</nav></div>`).join('')}<script id="mado-shared-ui-config" type="application/json">${JSON.stringify(config)}</script><script src="../site-runtime-loader.js" defer></script></body></html>`;
  await write('site-chrome.js', actualRenderer);
  for (const target of ['en/start.html', 'en/guide.html', 'en/zukan.html', 'en/live/index.html', 'guide.html', 'images/test.svg']) await write(target, 'fixture');
  const render = options => renderSiteRuntimeForValidation({ appDir: root, relative: 'en/guide.html', html: page(), ...options });
  return { root, config, page, write, render };
}

test('all three actual payloads merge and every configured common component renders', async t => {
  const f = await fixture(t);
  const result = f.render();
  try {
    assert.equal(result.dom.window.MADO_SHARED_UI_RENDERED, true);
    assert.equal(result.document.querySelectorAll('[data-site-chrome-host]').length, 0);
    assert.equal(result.document.querySelectorAll('.topbar .top-nav').length, 1);
    assert.equal(result.events.length, 1);
    assert.deepEqual(commonTargetFailures(result.document, { appDir: f.root, relative: 'en/guide.html' }), []);
  } finally { result.dom.window.close(); }
});

test('per-page header link parameters apply before the route language menu is inserted', async t => {
  const f = await fixture(t);
  f.config.mounts[0].mainLinks = [{ index: 0, href: '__MADO_ROOT__en/guide.html?from=header' }, { index: 1, text: 'Window views' }];
  const result = f.render();
  try {
    assert.equal(result.document.querySelector('.top-nav a').href, 'https://www.michikusa-travel.com/en/guide.html?from=header');
    assert.equal(result.document.querySelectorAll('.top-nav a')[1].textContent, 'Window views');
    assert.equal(result.document.querySelector('.lang-switch a').href, 'https://www.michikusa-travel.com/guide.html?lang=ja');
  } finally { result.dom.window.close(); }
});

for (const [name, change, expected] of [
  ['no assets', f => { f.config.assets = []; }, /one to three/],
  ['duplicate assets', f => { f.config.assets[1] = f.config.assets[0]; }, /distinct/],
  ['foreign asset', f => { f.config.assets[0] = '../evil.js'; }, /invalid.*asset path/],
  ['wrong language', f => { f.config.assets[0] = 'shared-ui/ja.shell.js'; }, /language/],
  ['missing asset', f => { f.config.assets[1] = 'shared-ui/en.rail-absent.js'; }, /asset is missing/],
  ['wrong order', f => { f.config.assets.reverse(); }, /payload order/],
  ['wrong root', f => { f.config.root = ''; }, /root/],
  ['wrong route', f => { f.config.route = 'start.html'; }, /route/],
  ['duplicate host', f => { f.config.mounts[1].host = f.config.mounts[0].host; }, /host|duplicate/],
  ['unknown component', f => { f.config.mounts[0].component = 'absent'; }, /component.*missing/],
]) {
  test(`rejects ${name} instead of silently skipping navigation`, async t => {
    const f = await fixture(t);
    change(f);
    assert.throws(() => f.render(), expected);
  });
}

test('hosts without configuration and configuration without hosts both fail', async t => {
  const f = await fixture(t);
  assert.throws(() => f.render({ html: f.page().replace(/<script id="mado-shared-ui-config"[\s\S]*?<\/script>/, '') }), /hosts have no config/);
  assert.throws(() => f.render({ html: f.page().replace(/<div data-site-chrome-host="chrome-0">[\s\S]*?<\/div>/, '') }), /one-to-one/);
});

test('source template detects removal of both configuration and all shared hosts', async t => {
  const f = await fixture(t);
  await f.write('scripts/templates/site-source/en/guide.html.tpl', f.page());
  assert.throws(() => f.render({ html: '<html lang="en"><body><main>article only</main></body></html>' }), /source template/);
});

test('one link lost by the renderer fails even if the header and other links remain', async t => {
  const f = await fixture(t);
  await f.write('site-chrome.js', `${actualRenderer}\ndocument.querySelector('.topbar a').remove();`);
  assert.throws(() => f.render(), /lost or changed a template link\/image/);
});

test('rendered common links and images must exist on disk', async t => {
  const f = await fixture(t);
  await fs.rm(path.join(f.root, 'en/zukan.html'));
  await fs.rm(path.join(f.root, 'images/test.svg'));
  const result = f.render();
  try {
    const failures = commonTargetFailures(result.document, { appDir: f.root, relative: 'en/guide.html' });
    assert.ok(failures.some(message => message.includes('/en/zukan.html')));
    assert.ok(failures.some(message => message.includes('/images/test.svg')));
  } finally { result.dom.window.close(); }
});

test('embedded mode removes common chrome while retaining the article collection', async t => {
  const f = await fixture(t);
  const result = f.render({ embedded: true });
  try {
    assert.equal(result.document.querySelector('.topbar,.footer,.content-rail-section,.spot-page-rail,.spot-page-showcase,.tools-grid'), null);
    assert.equal(result.document.querySelectorAll('.spot-reading-related').length, 1);
    assert.equal(result.dom.window.MADO_SHARED_UI_RENDERED, true);
  } finally { result.dom.window.close(); }
});

test('standalone content without a common UI contract does not acquire a header requirement', async t => {
  const f = await fixture(t);
  const result = f.render({ html: '<html lang="en"><body data-article-localized><main>Standalone content</main></body></html>' });
  try {
    assert.equal(result.config, null);
    assert.equal(result.document.querySelector('.topbar'), null);
    assert.equal(result.events.length, 0);
  } finally { result.dom.window.close(); }
});

test('string validators inspect the delivered footer while retaining original metadata and script bytes', async t => {
  const f = await fixture(t);
  const head = '<head><meta X-KEEP=\'literal\'><script>const untouched = "<a href=x>";</script></head>';
  const html = f.page().replace('<head></head>', head);
  const result = expandDeliveredSiteChromeHTML({ appDir: f.root, relative: 'en/guide.html', html });
  assert.ok(result.includes(head));
  assert.ok(result.includes('<footer class="footer"><a href="../en/guide.html">Guide</a></footer>'));
  assert.ok(!result.includes('data-site-chrome-host='));
  assert.ok(result.includes('id="mado-shared-ui-config"'), 'the actual static configuration is retained');
});
