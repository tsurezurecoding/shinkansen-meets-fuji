import fs from 'node:fs';
import { createHash } from 'node:crypto';

// Only the small, stable entry point is recorded in page HTML. Module hashes
// belong to site-runtime.json, so editing a shared module does not rewrite pages.
export function withSiteRuntimeLoader(html, rootPath = '') {
  if (typeof html !== 'string' || !/<\/body\s*>/i.test(html)) throw new Error('Site runtime requires an HTML body');
  if (typeof rootPath !== 'string' || !/^(?:\.\/)?(?:\.\.\/)*$/.test(rootPath)) throw new Error('Site runtime root must be a relative asset prefix');
  const bytes = fs.readFileSync(new URL('../../site-runtime-loader.js', import.meta.url));
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
  const tag = `<script src="${rootPath}site-runtime-loader.js?v=${hash}" defer></script>`;
  const previous = /\s*<script\b[^>]*\bsrc\s*=\s*(["'])(?:\.\/)?(?:\.\.\/)*site-runtime-loader\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script\s*>/gi;
  return html.replace(previous, '').replace(/\s*<\/body\s*>/i, `\n${tag}\n</body>`);
}
