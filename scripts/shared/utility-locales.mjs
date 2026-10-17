import {withPageAndroidAppInvite} from './android-app-invite.mjs';
import { assetVersion } from './asset-version.mjs';
import { utility, translated, stripEdition, languages, withLocaleRegistry } from './locales.mjs';
export const UTILITY_ROUTES = utility;
export const LOCALES = translated;
// public URL path of a route: the TOP is the folder itself, live/ drops index.html
export const publicPath = route => route === 'index.html' ? '' : route.replace('live/index.html', 'live/');
export function withUtilityLocales(html, file) {
  const route = stripEdition(file);
  if (!UTILITY_ROUTES.includes(route)) return html;
  html = withPageAndroidAppInvite(html,file);
  html = html.replaceAll('["ja","en","fr","zh-Hant"]', JSON.stringify(languages));
  const prefix = /<base\b/.test(html) ? '' : '../'.repeat(file.split('/').length - 1);
  html = html.replace(new RegExp('\\s*<link\\b[^>]*rel="alternate"[^>]*hreflang="(?:' + translated.join('|') + ')"[^>]*>', 'g'), '');
  html = withLocaleRegistry(html, prefix);
  if (!html.includes('utility-locales.js')) html = html.replace('</head>', `  <script defer src="${prefix}utility-locales.js?v=${assetVersion('utility-locales.js')}"></script>\n</head>`);
  if (!html.includes('utility-locales.css')) html = html.replace('</head>', `  <link rel="stylesheet" href="${prefix}utility-locales.css?v=${assetVersion('utility-locales.css')}">\n</head>`);
  return html.replace('</head>', LOCALES.map(lang => `  <link rel="alternate" hreflang="${lang}" href="https://www.michikusa-travel.com/${lang}/${publicPath(route)}">`).join('\n') + '\n</head>');
}
