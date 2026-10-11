import { assetVersion } from './asset-version.mjs';
export const SPARKLING_ROUTE = 'sparkling-dreams.html';
export const SPARKLING_LOCALES = ['zh-Hant','fr'];
export function withSparklingLocales(html,file){
 const prefix=file.startsWith('en/')||file.startsWith('fr/')||file.startsWith('zh-Hant/')?'../':'';
 html=html.replace(/\s*<link\b[^>]*rel="alternate"[^>]*hreflang="(?:zh-Hant|fr)"[^>]*>/g,'');
 if(!html.includes('utility-locales.js'))html=html.replace('</head>',`  <script defer src="${prefix}utility-locales.js?v=${assetVersion('utility-locales.js')}"></script>\n</head>`);
 if(!html.includes('utility-locales.css'))html=html.replace('</head>',`  <link rel="stylesheet" href="${prefix}utility-locales.css?v=${assetVersion('utility-locales.css')}">\n</head>`);
 return html.replace('</head>',SPARKLING_LOCALES.map(lang=>`  <link rel="alternate" hreflang="${lang}" href="https://www.michikusa-travel.com/${lang}/${SPARKLING_ROUTE}">`).join('\n')+'\n</head>');
}
