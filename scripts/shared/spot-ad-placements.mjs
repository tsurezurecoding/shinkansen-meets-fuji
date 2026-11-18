import {assetVersion} from './asset-version.mjs';
// Opt-in only. Moving a spot's slot does not require a second browser implementation.
export const SPOT_AD_PLACEMENTS = Object.freeze({
  'ja/kakegawa': Object.freeze({position: 'before-map', slot: '6439684093'}),
});
export function withSpotAdvertising(html, spot, lang) {
  const placement = SPOT_AD_PLACEMENTS[lang + '/' + spot];
  if (!placement) return html;
  const config = {version: 1, spot, lang, client: 'ca-pub-5756673901202661', ...placement};
  const prefix = lang === 'ja' ? '../' : '../../';
  const block = '<!-- SPOT_ADSENSE_START -->\n<script id="mado-spot-ad-config" type="application/json">' + JSON.stringify(config) + '</script>\n<script src="' + prefix + 'spot-adsense.js?v=' + assetVersion('spot-adsense.js') + '" defer></script>\n<!-- SPOT_ADSENSE_END -->';
  const clean = html.replace(/<!-- SPOT_ADSENSE_START -->[\s\S]*?<!-- SPOT_ADSENSE_END -->\n?/, '');
  // The Android invitation finalizer keeps the shared loader at the end of the body.
  const anchor = /<script\b[^>]*\ssrc\s*=\s*(["'])(?:\.\/)?(?:\.\.\/)*site-runtime-loader\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script\s*>|<\/body\s*>/i;
  return clean.replace(anchor, tag => block + '\n' + tag);
}
