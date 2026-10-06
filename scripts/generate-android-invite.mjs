import fs from 'node:fs';
import { withAndroidInvite } from './shared/android-invite.mjs';

for (const [file, lang] of [['index.html','ja'], ['guide.html','ja'], ['en/guide.html','en']]) {
  const url = new URL('../' + file, import.meta.url);
  const before = fs.readFileSync(url, 'utf8');
  const after = withAndroidInvite(before, lang);
  if (before === after) continue;
  if (process.argv.includes('--check')) throw new Error(`Android invitation stale: ${file}`);
  fs.writeFileSync(url, after);
}
