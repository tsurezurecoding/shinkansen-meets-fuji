import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const ORIGIN = 'https://www.michikusa-travel.com';
const KINDS = Object.freeze({ header: '.topbar', footer: '.footer', content: '.content-rail-section', rail: '.spot-page-rail', showcase: '.spot-page-showcase', tools: '.tools-grid', collection: '.spot-reading-related' });
export const COMMON_UI_SELECTOR = `${Object.values(KINDS).join(',')},.spot-compact-guide`;
const sourceCache = new Map();
function source(appDir, file) {
  const target = path.join(appDir, file);
  if (!sourceCache.has(target)) sourceCache.set(target, fs.readFileSync(target, 'utf8'));
  return sourceCache.get(target);
}

function chromeConfig(document) {
  const nodes = document.querySelectorAll('#mado-shared-ui-config');
  if (nodes.length > 1) throw new Error('shared UI config must occur once');
  if (!nodes.length) return null;
  if (nodes[0].getAttribute('type') !== 'application/json') throw new Error('shared UI config must be application/json');
  return JSON.parse(nodes[0].textContent);
}

function sourceKinds(appDir, relative) {
  const target = path.join(appDir, 'scripts/templates/site-source', `${relative}.tpl`);
  if (!fs.existsSync(target)) return [];
  const dom = new JSDOM(fs.readFileSync(target, 'utf8'));
  try { return (chromeConfig(dom.window.document)?.mounts || []).map(mount => mount.kind).sort(); }
  finally { dom.window.close(); }
}

function validateConfig(document, config, relative, appDir, nodeLocation) {
  const hosts = [...document.querySelectorAll('[data-site-chrome-host]')];
  if (!config && hosts.length) throw new Error('shared UI hosts have no config');
  const expectedKinds = sourceKinds(appDir, relative);
  const actualKinds = (config?.mounts || []).map(mount => mount.kind).sort();
  if (expectedKinds.length && JSON.stringify(expectedKinds) !== JSON.stringify(actualKinds)) throw new Error('shared UI mount kinds differ from the source template');
  if (!config) return [];
  if (!Array.isArray(config.assets) || !config.assets.length || config.assets.length > 3 || new Set(config.assets).size !== config.assets.length) throw new Error('shared UI assets must contain one to three distinct payloads');
  const language = document.documentElement.lang.toLowerCase();
  const profiles = config.assets.map(asset => {
    const match = typeof asset === 'string' && asset.match(/^shared-ui\/([a-z][a-z0-9-]*)\.(shell|rail-[a-z0-9-]+|cards)\.js$/);
    if (!match) throw new Error('invalid shared UI asset path');
    if (match[1] !== language || config.lang !== document.documentElement.lang) throw new Error('shared UI language does not match the document');
    if (!fs.existsSync(path.join(appDir, asset))) throw new Error(`shared UI asset is missing: ${asset}`);
    return match[2] === 'shell' ? 0 : match[2].startsWith('rail-') ? 1 : 2;
  });
  if (profiles.some((profile, index) => index > 0 && profile <= profiles[index - 1])) throw new Error('shared UI payload order must be shell, one rail profile, then cards');
  if (typeof config.root !== 'string' || !/^(?:\.\/)?(?:\.\.\/)*$/.test(config.root) || new URL(config.root || '.', document.baseURI).href !== `${ORIGIN}/`) throw new Error('shared UI root does not resolve to the app root');
  const route = relative.replace(/^(?:en|fr|de|es|ko|zh-Hant|zh-Hans|it|th|ar)\//, '');
  if (config.route !== route) throw new Error('shared UI route does not match the document');
  if (!Array.isArray(config.mounts) || !config.mounts.length || config.mounts.length !== hosts.length) throw new Error('shared UI config and hosts must be one-to-one');
  const names = new Set();
  return config.mounts.map(mount => {
    if (!Object.hasOwn(KINDS, mount.kind) || !/^chrome-\d+$/.test(mount.host || '') || names.has(mount.host)) throw new Error('invalid or duplicate shared UI mount');
    names.add(mount.host);
    const matches = hosts.filter(host => host.getAttribute('data-site-chrome-host') === mount.host);
    if (matches.length !== 1) throw new Error(`shared UI host must occur once: ${mount.host}`);
    const start = document.createComment(`validation-${mount.host}-start`);
    const end = document.createComment(`validation-${mount.host}-end`);
    matches[0].before(start);
    matches[0].after(end);
    return { mount, start, end, sourceRange: nodeLocation(matches[0]) };
  });
}

function targetSignature(node, baseURI) {
  return [...node.querySelectorAll('a[href],img[src]')].map(element => {
    const attribute = element.tagName === 'A' ? 'href' : 'src';
    return [element.tagName, new URL(element.getAttribute(attribute), baseURI).href];
  });
}

function expectedTargets(payload, config, mount, baseURI) {
  const template = payload?.components?.[mount.component];
  const menu = mount.menu ? payload?.menus?.[mount.menu] : '';
  if (typeof template !== 'string' || (mount.menu && typeof menu !== 'string')) throw new Error('shared UI component or menu is missing');
  // Navigation identity is independent of the renderer's tracking/current-row
  // logic. Every link and image from the delivered template must survive it.
  const shell = JSDOM.fragment(template.replace('<!--SITE_CHROME_CURRENT-->', mount.currentHTML || ''));
  const anchors = [...shell.querySelectorAll('a')];
  const indices = new Set();
  for (const delta of mount.mainLinks || []) {
    if (mount.kind !== 'header' || !Number.isInteger(delta.index) || !anchors[delta.index] || indices.has(delta.index)) throw new Error('invalid shared UI main link parameter');
    indices.add(delta.index);
    if (delta.href !== undefined) anchors[delta.index].setAttribute('href', delta.href);
    if (delta.text !== undefined) anchors[delta.index].textContent = delta.text;
  }
  const container = shell.ownerDocument.createElement('div');
  container.appendChild(shell);
  const fragment = JSDOM.fragment(container.innerHTML.replace('<!--SITE_CHROME_MENU-->', menu || '')
    .split('__MADO_MENU_ROUTE__').join(mount.menuRoute || config.route || '')
    .split('__MADO_ROOT__').join(config.root || ''));
  return targetSignature(fragment, baseURI);
}

// Runs only the actual page payload/catalog/renderers. Network loaders and page
// analytics stay inert; loader behavior has its own browser-contract tests.
export function renderSiteRuntimeForValidation({ appDir, html, relative, embedded = false }) {
  const dom = new JSDOM(html, { url: new URL(relative, `${ORIGIN}/`).href, runScripts: 'outside-only', includeNodeLocations: true });
  try {
    const { window } = dom;
    const document = window.document;
    const errors = [];
    const events = [];
    window.console.error = (...args) => errors.push(args.join(' '));
    document.addEventListener('mado:shared-ui-ready', () => events.push('mado:shared-ui-ready'));
    window.MADO_EMBEDDED_WEB = embedded;
    const thin = document.body.getAttribute('data-spot-page-shared-mode') === 'page' && !document.body.hasAttribute('data-article-localized');
    const legacySpot = !thin && Boolean(document.querySelector('[data-spot-page-shared-module]'));
    const config = chromeConfig(document);
    const mounts = validateConfig(document, config, relative, appDir, node => dom.nodeLocation(node));
    const chromeReplacements = [];
    if (thin || config) {
      const loaders = [...document.querySelectorAll('script[src]')].filter(script => new URL(script.src).pathname === '/site-runtime-loader.js');
      if (loaders.length !== 1) throw new Error('shared page must load site-runtime-loader.js exactly once from the app root');
    }
    if (thin) {
      const id = document.body.getAttribute('data-spot-page-shared-id');
      const lang = document.body.getAttribute('data-spot-page-shared-lang');
      if (!/^[a-z0-9-]+$/.test(id || '') || !['ja', 'en'].includes(lang)) throw new Error('invalid thin spot context');
      const payload = `data/spot-pages/${id}.${lang}.js`;
      const scripts = [...document.querySelectorAll('script[src]')].filter(script => new URL(script.src).pathname === `/${payload}`);
      if (scripts.length !== 1) throw new Error('thin spot must load its own page payload exactly once');
      window.eval(source(appDir, 'spot-page-shared-data.js'));
      window.eval(source(appDir, payload));
      window.eval(source(appDir, 'spot-page-shared.js'));
      if (window.MADO_SPOT_PAGE_RENDERED !== true || document.querySelector('[data-spot-page-shared-module="page"], [data-spot-page-fallback]')) throw new Error('thin spot runtime did not replace the fallback');
    }
    if (legacySpot) {
      for (const asset of ['spot-page-shared-data.js', 'spot-page-shared.js']) {
        const scripts = [...document.querySelectorAll('script[src]')].filter(script => new URL(script.src).pathname === `/${asset}`);
        if (scripts.length !== 1) throw new Error(`existing shared spot hosts must load ${asset} exactly once`);
        window.eval(source(appDir, asset));
      }
      if (document.querySelector('[data-spot-page-shared-module]')) throw new Error('existing shared spot runtime left an unrendered host');
    }
    if (config) {
      for (const asset of config.assets) window.eval(source(appDir, asset));
      const targets = mounts.map(({ mount }) => expectedTargets(window.MADO_SHARED_UI, config, mount, document.baseURI));
      window.eval(source(appDir, 'site-chrome.js'));
      if (window.MADO_SHARED_UI_RENDERED !== true || document.querySelector('[data-site-chrome-host]')) throw new Error(`shared UI rendering failed${errors.length ? `: ${errors.join(' | ')}` : ''}`);
      for (const [index, { mount, start, end, sourceRange }] of mounts.entries()) {
        const elements = [];
        for (let node = start.nextSibling; node && node !== end; node = node.nextSibling) if (node.nodeType === 1) elements.push(node);
        const hidden = embedded && mount.kind !== 'collection';
        if (hidden ? elements.length !== 0 : elements.length !== 1 || !elements[0].matches(KINDS[mount.kind])) throw new Error(`shared UI ${mount.host} did not render its ${mount.kind} component`);
        if (!hidden && !elements[0].querySelector('a[href]')) throw new Error(`shared UI ${mount.kind} lost all navigation links`);
        if (!hidden && JSON.stringify(targetSignature(elements[0], document.baseURI)) !== JSON.stringify(targets[index])) throw new Error(`shared UI ${mount.kind} lost or changed a template link/image`);
        if (!sourceRange) throw new Error('shared UI host has no source location');
        chromeReplacements.push({ start: sourceRange.startOffset, end: sourceRange.endOffset, html: elements.map(element => element.outerHTML).join('') });
        start.remove();
        end.remove();
      }
    }
    if (errors.length) throw new Error(`shared runtime reported: ${errors.join(' | ')}`);
    const requiresHeader = thin || legacySpot || config?.mounts.some(mount => mount.kind === 'header');
    if (!embedded && requiresHeader && document.querySelectorAll('.topbar .top-nav').length !== 1) throw new Error('rendered page must expose exactly one shared header navigation');
    if (events.length !== Number(thin) + Number(Boolean(config))) throw new Error('shared runtime ready event count is incorrect');
    return { dom, document, thin, legacySpot, config, events, chromeReplacements };
  } catch (error) {
    dom.window.close();
    throw new Error(`${relative}: ${error.message}`, { cause: error });
  }
}

// For established string/metadata validators, replace only delivered chrome
// hosts. Preserve every original head, script and article byte outside them.
export function expandDeliveredSiteChromeHTML({ appDir, html, relative }) {
  if (!/mado-shared-ui-config|data-site-chrome-host/.test(html)) return html;
  const rendered = renderSiteRuntimeForValidation({ appDir, html, relative });
  try {
    for (const change of [...rendered.chromeReplacements].sort((a, b) => b.start - a.start)) html = html.slice(0, change.start) + change.html + html.slice(change.end);
    return html;
  } finally { rendered.dom.window.close(); }
}

export function commonTargetFailures(document, { appDir, relative }) {
  const failures = [];
  const elements = new Set([...document.querySelectorAll(COMMON_UI_SELECTOR)].flatMap(root => [...root.querySelectorAll('a[href],img[src]')]));
  for (const element of elements) {
    const url = new URL(element.getAttribute(element.tagName === 'A' ? 'href' : 'src'), document.baseURI);
    if (url.origin !== ORIGIN) continue;
    const target = decodeURIComponent(url.pathname).replace(/^\//, '') + (url.pathname.endsWith('/') ? 'index.html' : '');
    const absolute = path.resolve(appDir, target);
    if (!absolute.startsWith(`${path.resolve(appDir)}${path.sep}`) || !fs.existsSync(absolute)) failures.push(`${relative}: rendered common UI target is missing: ${url.pathname}`);
    if (document.documentElement.lang === 'en' && !url.pathname.startsWith('/en/') && element.tagName === 'A' && url.searchParams.get('lang') !== 'ja' && fs.existsSync(path.join(appDir, 'en', target))) failures.push(`${relative}: rendered English link leaves its existing English edition: ${url.pathname}`);
  }
  return failures;
}
