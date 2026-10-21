import { enOnly, episodes, supported, translated, castleIds, castles, stripEdition, withLocaleRegistry } from './locales.mjs';
import { assetVersion } from './asset-version.mjs';
export const CASTLE_LOCALE_LANGS = translated;
export const CASTLE_LOCALE_IDS = castleIds;
export const CASTLE_LOCALE_ROUTES = castles;
export function localeRoute(file) { const route = stripEdition(file); return CASTLE_LOCALE_ROUTES.includes(route) || episodes[route] ? route : null; }
export function withArticleLocales(head, file, version) {
  const fileRoute = localeRoute(file);
  if (!fileRoute) return head;
  const canonical = head.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
  // Companion landing pages can deliberately canonicalize to the full article.
  const route = localeRoute(canonical ? new URL(canonical).pathname.slice(1) : file) || fileRoute;
  if (!route) return head;
  const prefix = file.split('/').length === 3 ? '../../' : file.split('/').length === 2 ? '../' : '';
  head = head.replace(new RegExp('\\s*<link\\b[^>]*rel="alternate"[^>]*hreflang="(?:' + translated.join('|') + ')"[^>]*>', 'g'), '');
  if (enOnly.includes(route)) head = head.replace(/\s*<link\b[^>]*rel="alternate"[^>]*>/g, '');
  const links = supported(route).filter(lang => enOnly.includes(route) || translated.includes(lang)).map(lang => `  <link rel="alternate" hreflang="${lang}" href="https://www.michikusa-travel.com/${lang}/${route}">`).join('\n') + (enOnly.includes(route) ? `\n  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/${route}">` : '');
  if (!head.includes('article-locales.js')) head = head.replace('</head>', `  <script defer src="${prefix}article-locales.js?v=${version}"></script>\n</head>`);
  if (enOnly.includes(route) && !head.includes('article-locales.css')) head = head.replace('</head>', `  <link rel="stylesheet" href="${prefix}article-locales.css?v=${assetVersion('article-locales.css')}">\n</head>`);
  head = withLocaleRegistry(head, prefix);
  return head.replace('</head>', `${links}\n</head>`);
}
