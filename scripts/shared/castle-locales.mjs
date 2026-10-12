import { translated, castleIds, castles, stripEdition, withLocaleRegistry } from './locales.mjs';
import { assetVersion } from './asset-version.mjs';
export const CASTLE_LOCALE_LANGS = translated;
export const CASTLE_LOCALE_IDS = castleIds;
export const CASTLE_LOCALE_ROUTES = castles;
export function localeRoute(file) { const route = stripEdition(file); return CASTLE_LOCALE_ROUTES.includes(route) ? route : null; }
export function withArticleLocales(head, file, version) {
  const route = localeRoute(file);
  if (!route) return head;
  const prefix = file.split('/').length === 3 ? '../../' : file.split('/').length === 2 ? '../' : '';
  head = head.replace(new RegExp('\\s*<link\\b[^>]*rel="alternate"[^>]*hreflang="(?:' + translated.join('|') + ')"[^>]*>', 'g'), '');
  const links = CASTLE_LOCALE_LANGS.map(lang => `  <link rel="alternate" hreflang="${lang}" href="https://www.michikusa-travel.com/${lang}/${route}">`).join('\n');
  if (!head.includes('article-locales.js')) head = head.replace('</head>', `  <script defer src="${prefix}article-locales.js?v=${version}"></script>\n</head>`);
  head = withLocaleRegistry(head, prefix);
  return head.replace('</head>', `${links}\n</head>`);
}
