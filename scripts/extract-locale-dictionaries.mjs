// Refresh required keys after English source edits. Missing translations remain empty.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translated, castles } from './shared/locales.mjs';
import { collectEnglish } from './shared/utility-localization.mjs';
import { collectSparklingEnglish } from './shared/sparkling-localization.mjs';
import { englishSnapshot, textNodes, TRANSLATABLE_ATTRIBUTES } from './shared/castle-localization.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const castleKeys = new Set();
const add = value => { if (typeof value === 'string' && value.trim()) castleKeys.add(value.trim()); };
for (const route of castles) {
  const dom = englishSnapshot(root, route), doc = dom.window.document;
  for (const node of textNodes(doc)) if (!node.parentElement.closest('.show-credit,figcaption a:not([data-gallery-source-output])')) add(node.textContent);
  for (const el of doc.querySelectorAll('*')) for (const attr of TRANSLATABLE_ATTRIBUTES) add(el.getAttribute(attr));
  add(doc.title);
  for (const el of doc.querySelectorAll('meta')) if (/(?:description|title|image:alt)$/.test(el.name || el.getAttribute('property') || '')) add(el.content);
  dom.window.close();
}
const required = { utility: collectEnglish(root), castle: [...castleKeys], sparkling: collectSparklingEnglish(root) };
for (const lang of translated) {
  const existing = {};
  for (const group of Object.keys(required)) {
    const file = path.join(root, 'scripts/locales', `${group}-${lang}.json`);
    existing[group] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  }
  const shared = Object.assign({}, existing.castle, existing.sparkling, existing.utility);
  for (const [group, keys] of Object.entries(required)) {
    // Retain approved supplemental/recursive-title keys; never silently discard translations.
    const dictionary = Object.fromEntries([...new Set([...Object.keys(existing[group]), ...keys])].sort().map(key => [key, existing[group][key] || shared[key] || '']));
    if (check && keys.some(key => !dictionary[key])) throw Error(`${lang}/${group}: source changes require reviewed translations`);
    if (!check) fs.writeFileSync(path.join(root, 'scripts/locales', `${group}-${lang}.json`), JSON.stringify(dictionary, null, 2) + '\n');
    console.log(`${lang}/${group}: ${keys.length} source keys, ${Object.values(dictionary).filter(value => !value).length} missing translations`);
  }
}
