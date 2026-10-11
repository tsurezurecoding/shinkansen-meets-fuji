import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { englishSnapshot, textNodes, TRANSLATABLE_ATTRIBUTES } from './castle-localization.mjs';
import { UTILITY_ROUTES } from './utility-locales.mjs';
import { SPOT_COUNT } from './spot-count.mjs';
import { FORECAST_COPY } from './mieru-copy.mjs';
export { FORECAST_COPY } from './mieru-copy.mjs';
export { UTILITY_ROUTES, LOCALES } from './utility-locales.mjs';
export const ATTRS = [...TRANSLATABLE_ATTRIBUTES, 'placeholder'];
export const EXTRA_COPY = ['Open {name} in Google Maps', '{name}. {hook} Look around {area}.', 'YOUR TRAIN', 'Mt. Fuji', 'Seats A/E', 'Use Audio Guide while riding', 'More:', 'More', 'Browse every view in this stretch', 'Learn more', 'Related'];
export function englishTables(root) {
  function table(file, indent) {
    const src = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    const block = src.match(new RegExp(`\\n {${indent}}en: \\{\\n([\\s\\S]*?)\\n {${indent}}\\},`));
    if (!block) throw Error(`Missing English table: ${file}`);
    return vm.runInNewContext(`({${block[1]}})`, { MADO_SPOT_COUNT: SPOT_COUNT });
  }
  return { app: table('app.js', 2), live: table('live/live.js', 4), picker: table('train-picker.js', 4) };
}
export function valueTemplate(value) {
  if (typeof value !== 'function') return { text: value };
  const args = Array.from({ length: value.length }, (_, i) => `{${i}}`);
  return { text: value(...args), args: args.length };
}
export function englishRuntimeData(root) {
  return vm.runInNewContext(fs.readFileSync(path.join(root, 'data-runtime.js'), 'utf8') + ';({SPOTS,ROUTE,BOARD_COLLECTION,WHEEL_COLLECTION})');
}
export function englishNarrations(root) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'live/narration.js'), 'utf8'), context);
  return context.window.MADO_NARRATIONS || context.NARRATIONS;
}
export function utilitySnapshot(root, route) {
  if (route === 'mieru.html') return englishSnapshot(root, route);
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'en', route), 'utf8'), {
    url: `https://www.michikusa-travel.com/en/${route}`, runScripts: 'outside-only',
  });
  if (route === 'live/index.html') {
    const copy = englishTables(root).live;
    dom.window.document.querySelector('#btn-settings')?.setAttribute('title', copy.settings);
    dom.window.document.querySelector('#btn-dir')?.setAttribute('title', copy.dirL);
  }
  return dom;
}
export function translatable(value) {
  return typeof value === 'string' && value.trim() && /[A-Za-z]/.test(value) && !/^(?:https?:|mailto:|@|support@|audio\/|en\/|images\/|michikusa(?:\s|$))/.test(value);
}
export function translationKey(value) {
  const text = value.trim();
  const numbered = /^(Nozomi|Hikari|Kodama) \d+$/.exec(text);
  const timed = /^([A-Za-z][A-Za-z-]+(?: [A-Za-z-]+)*) \d{2}:\d{2}$/.exec(text);
  return numbered?.[1] || timed?.[1] || text;
}
export function collectEnglish(root) {
  const keys = new Set();
  const add = value => { if (translatable(value)) keys.add(translationKey(value)); };
  for (const route of UTILITY_ROUTES) {
    const doc = utilitySnapshot(root, route).window.document;
    for (const node of textNodes(doc)) if (!node.parentElement.closest('.lang-switch,.show-credit')) add(node.textContent);
    for (const el of doc.querySelectorAll('*')) for (const attr of ATTRS) add(el.getAttribute(attr));
    add(doc.title);
    for (const el of doc.querySelectorAll('meta')) if (/(?:description|title|image:alt)$/.test(el.name || el.getAttribute('property') || '')) add(el.content);
  }
  for (const table of Object.values(englishTables(root))) for (const value of Object.values(table)) add(valueTemplate(value).text);
  const scan = value => {
    if (!value || typeof value !== 'object') return;
    if (value.en) {
      const strings = item => {
        if (typeof item === 'string') add(item);
        else if (Array.isArray(item)) item.forEach(strings);
        else if (item && typeof item === 'object') Object.values(item).forEach(strings);
      };
      strings(value.en);
    }
    Object.values(value).forEach(scan);
  };
  scan(englishRuntimeData(root));
  scan(englishNarrations(root));
  Object.values(FORECAST_COPY).forEach(add);
  EXTRA_COPY.forEach(add);
  return [...keys].sort();
}
