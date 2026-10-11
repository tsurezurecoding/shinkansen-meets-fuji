import { assetVersion } from './asset-version.mjs';
export const UTILITY_ROUTES = ['start.html', 'live/index.html', 'zukan.html', 'contact.html', 'mieru.html'];
export const LOCALES = ['zh-Hant', 'fr'];
export function withUtilityLocales(html, file) {
  const route = file.replace(/^(en|zh-Hant|fr)\//, '');
  if (!UTILITY_ROUTES.includes(route)) return html;
  const prefix = /<base\b/.test(html) ? '' : '../'.repeat(file.split('/').length - 1);
  html = html.replace(/\s*<link\b[^>]*rel="alternate"[^>]*hreflang="(?:zh-Hant|fr)"[^>]*>/g, '');
  if (!html.includes('utility-locales.js')) html = html.replace('</head>', `  <script defer src="${prefix}utility-locales.js?v=${assetVersion('utility-locales.js')}"></script>\n</head>`);
  if (!html.includes('utility-locales.css')) html = html.replace('</head>', `  <link rel="stylesheet" href="${prefix}utility-locales.css?v=${assetVersion('utility-locales.css')}">\n</head>`);
  return html.replace('</head>', LOCALES.map(lang => `  <link rel="alternate" hreflang="${lang}" href="https://www.michikusa-travel.com/${lang}/${route.replace('live/index.html', 'live/')}">`).join('\n') + '\n</head>');
}
