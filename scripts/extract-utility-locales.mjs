import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectEnglish, LOCALES } from './shared/utility-localization.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keys = collectEnglish(root);
for (const lang of LOCALES) {
  const file = path.join(root, 'scripts/locales', `utility-${lang}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const seed = JSON.parse(fs.readFileSync(path.join(root, 'scripts/locales', `castle-${lang}.json`), 'utf8'));
  const dictionary = Object.fromEntries(keys.map(key => [key, existing[key] || seed[key] || '']));
  fs.writeFileSync(file, JSON.stringify(dictionary, null, 2) + '\n');
  console.log(`${lang}: ${keys.length} keys, ${Object.values(dictionary).filter(v => !v).length} to translate`);
}
