import locales from '../../locales.js';
import { assetVersion } from './asset-version.mjs';
import { withPageAndroidAppInvite } from './android-app-invite.mjs';
export default locales;
export const { enOnly, episodes, editions, languages, translated, utility, castleIds, castles, extra, routes, pattern, normalize, stripEdition, canonicalRoute, supported } = locales;
// Synchronous routing must see the edition contract before evaluating a saved language.
// Keep a base element ahead of the registry so relative assets resolve identically.
export function withLocaleRegistry(html, prefix = '') {
  html = html.replace(/\s*<script\b[^>]*src="(?:\.\.\/)*locales\.js(?:\?[^" ]*)?"[^>]*>\s*<\/script>/g, '');
  const element = `\n  <script src="${prefix}locales.js?v=${assetVersion('locales.js')}"></script>`;
  const anchor = /<base\b[^>]*>/i.test(html) ? /<base\b[^>]*>/i : /<meta\b[^>]*charset[^>]*>/i.test(html) ? /<meta\b[^>]*charset[^>]*>/i : /<head\b[^>]*>/i;
  html = html.replace(anchor, match => match + element);
  // Full visitor-article snapshots pass through this shared route boundary.
  // Normalize their existing invitation here as well as in the site-wide pass,
  // so dedicated generators and their --check output stay deterministic.
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
  if (html.includes('<body') && canonical) {
    const file = new URL(canonical).pathname.slice(1);
    const route = canonicalRoute(file);
    if (enOnly.includes(route)) {
      // Dedicated snapshots can inherit the English edition's alternate links.
      // Keep exactly one real destination per edition at the shared boundary.
      html = html.replace(/\s*<link\b(?=[^>]*\brel="alternate")[^>]*>/g, '');
      const links = supported(route).map(edition => `<link rel="alternate" hreflang="${edition}" href="https://www.michikusa-travel.com/${edition}/${route}">`).join('\n');
      html = html.replace('</head>', links + `\n<link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/${route}">\n</head>`);
      const lang = file.split('/')[0];
      html = html.replace(/(<meta\b[^>]*property="og:locale"[^>]*content=")[^"]*(")/, `$1${editions[lang].og}$2`);
      html = withPageAndroidAppInvite(html, file);
    }
  }
  return html;
}
