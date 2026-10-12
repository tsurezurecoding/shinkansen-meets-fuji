import locales from '../../locales.js';
import { assetVersion } from './asset-version.mjs';
export default locales;
export const { episodes, editions, languages, translated, utility, castleIds, castles, extra, routes, pattern, normalize, stripEdition, canonicalRoute, supported } = locales;
// Synchronous routing must see the edition contract before evaluating a saved language.
// Keep a base element ahead of the registry so relative assets resolve identically.
export function withLocaleRegistry(html, prefix = '') {
  html = html.replace(/\s*<script\b[^>]*src="(?:\.\.\/)*locales\.js(?:\?[^" ]*)?"[^>]*>\s*<\/script>/g, '');
  const element = `\n  <script src="${prefix}locales.js?v=${assetVersion('locales.js')}"></script>`;
  const anchor = /<base\b[^>]*>/i.test(html) ? /<base\b[^>]*>/i : /<meta\b[^>]*charset[^>]*>/i.test(html) ? /<meta\b[^>]*charset[^>]*>/i : /<head\b[^>]*>/i;
  return html.replace(anchor, match => match + element);
}
