export const CASTLE_LOCALE_LANGS = ['zh-Hant', 'fr'];
export const CASTLE_LOCALE_IDS = ['edo-castle-fujimi-yagura','odawara-castle','kakegawa','kiyosu','gifu-castle','hikone-castle','sawayama-castle','kannonji-castle','himeji-castle','okayama-castle','fukuyama-castle','odawara','nagoya-station-skyline','toji','hamanako'];
export const CASTLE_LOCALE_ROUTES = ['castles.html', ...CASTLE_LOCALE_IDS.map(id => `spots/${id}.html`)];
export function localeRoute(file) { const route = file.replace(/^(en|zh-Hant|fr)\//, ''); return CASTLE_LOCALE_ROUTES.includes(route) ? route : null; }
export function withArticleLocales(head, file, version) {
  const route = localeRoute(file);
  if (!route) return head;
  const prefix = file.split('/').length === 3 ? '../../' : file.split('/').length === 2 ? '../' : '';
  head = head.replace(/\s*<link\b[^>]*rel="alternate"[^>]*hreflang="(?:zh-Hant|fr)"[^>]*>/g, '');
  const links = CASTLE_LOCALE_LANGS.map(lang => `  <link rel="alternate" hreflang="${lang}" href="https://www.michikusa-travel.com/${lang}/${route}">`).join('\n');
  if (!head.includes('article-locales.js')) head = head.replace('</head>', `  <script defer src="${prefix}article-locales.js?v=${version}"></script>\n</head>`);
  return head.replace('</head>', `${links}\n</head>`);
}
