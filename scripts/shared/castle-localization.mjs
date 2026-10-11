// Localized articles use the rendered English edition as their structural source.
// Render only the existing first-party shared module; never execute remote scripts.
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
export { CASTLE_LOCALE_LANGS, CASTLE_LOCALE_IDS, CASTLE_LOCALE_ROUTES } from './castle-locales.mjs';
export const TRANSLATABLE_ATTRIBUTES = ['alt','title','aria-label','data-gallery-alt','data-gallery-note'];
export function englishSnapshot(root, route) {
  const source = fs.readFileSync(path.join(root, 'en', route), 'utf8');
  const dom = new JSDOM(source, { url: `https://www.michikusa-travel.com/en/${route}`, runScripts: 'outside-only' });
  const { window } = dom;
  window.eval(fs.readFileSync(path.join(root, 'spot-page-shared-data.js'), 'utf8'));
  const id = route.match(/^spots\/(.+)\.html$/)?.[1];
  if (id && fs.existsSync(path.join(root, 'data/spot-pages', `${id}.en.js`))) window.eval(fs.readFileSync(path.join(root, 'data/spot-pages', `${id}.en.js`), 'utf8'));
  window.eval(fs.readFileSync(path.join(root, 'spot-page-shared.js'), 'utf8'));
  const error = window.document.querySelector('.spot-page-shared-error');
  if (error) throw Error(`English source render failed: ${route}: ${error.textContent}`);
  window.document.getElementById('spot-page-boot-style')?.remove();
  window.document.querySelectorAll('[data-spot-page-shared-static]').forEach(el => el.removeAttribute('data-spot-page-shared-static'));
  return dom;
}
export function textNodes(document, scope = document.body) {
  const walker = document.createTreeWalker(scope, 4);
  const result = [];
  for (let node; (node = walker.nextNode());) {
    if (!node.parentElement?.closest('script,style,noscript') && node.textContent.trim()) result.push(node);
  }
  return result;
}
