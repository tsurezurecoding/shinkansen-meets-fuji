import { assetVersion } from './asset-version.mjs';
import { translated, stripEdition, withLocaleRegistry } from './locales.mjs';
export const SPARKLING_ROUTE = 'sparkling-dreams.html';
export const SPARKLING_LOCALES = translated;
export function withSparklingLocales(html,file){
 const prefix=stripEdition(file)!==file?'../':'';
 html=html.replace(new RegExp('\\s*<link\\b[^>]*rel="alternate"[^>]*hreflang="(?:'+translated.join('|')+')"[^>]*>','g'),'');
 html=withLocaleRegistry(html,prefix);
 if(!html.includes('utility-locales.js'))html=html.replace('</head>',`  <script defer src="${prefix}utility-locales.js?v=${assetVersion('utility-locales.js')}"></script>\n</head>`);
 if(!html.includes('utility-locales.css'))html=html.replace('</head>',`  <link rel="stylesheet" href="${prefix}utility-locales.css?v=${assetVersion('utility-locales.css')}">\n</head>`);
 return html.replace('</head>',SPARKLING_LOCALES.map(lang=>`  <link rel="alternate" hreflang="${lang}" href="https://www.michikusa-travel.com/${lang}/${SPARKLING_ROUTE}">`).join('\n')+'\n</head>');
}
