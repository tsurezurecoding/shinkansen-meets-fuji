import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assetVersion} from './shared/asset-version.mjs';
import {ANALYTICS} from './shared/feature-page.mjs';
import {enhanceContentHead} from './shared/content-metadata.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const v=(name,tag)=>tag==='css'?`<link rel="stylesheet" href="${name}?v=${assetVersion(name)}">`:`<script src="${name}?v=${assetVersion(name)}"></script>`;
const url='https://www.michikusa-travel.com/window-trip.html',title='車窓を、つないで。｜写真と地図でめぐる新幹線の旅',description='好きな車窓写真を選び、東京から新大阪までを地図と一緒に眺める旅。昼と夜、山と海と街。席側と景色の名前も分かります。';
const body=fs.readFileSync(path.join(root,'scripts/templates/window-trip.html.template'),'utf8').replace(/\r\n/g,'\n');
let html=`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#163d43"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${url}"><link rel="icon" href="favicon.ico"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.michikusa-travel.com/images/og-window-trip.png"><meta name="twitter:card" content="summary_large_image">${['style.css','window-trip-base.css','window-trip.css'].map(p=>v(p,'css')).join('')}${v('language-router.js')}${ANALYTICS.withEmbeddedGuard}</head>
<body class="spot-page spot-page-utility flight-page trip-page" data-spot-page-shared-context="utility" data-spot-page-shared-layout="wide" data-spot-page-shared-lang="ja" data-spot-page-shared-root="./" data-spot-page-shared-route="window-trip.html"><a class="flight-skip" href="#experience">車窓の旅へ</a><div data-spot-page-shared-module="topbar"></div>${body}<section data-spot-page-shared-module="content-rail"></section><footer class="footer"><p class="footer-brand">新幹線の窓</p><p class="footer-links"><a href="index.html">ホーム</a> · <a href="window-artworks.html">車窓の作品集</a> · <a href="zukan.html">車窓図鑑</a> · <a href="contact.html">お問い合わせ</a> · <a href="privacy.html">プライバシー</a></p></footer>${['spot-page-shared-data.js','spot-page-shared.js','window-trip-data.js','window-trip-map.js','window-trip-stage.js','window-trip.js'].map(p=>v(p)).join('')}</body></html>
`;
html=html.replace('<meta name="twitter:card"', '<meta property="og:image:alt" content="富士山の車窓写真と地図を一緒に眺める「車窓を、つないで。」の画面"><meta name="twitter:card"');
html=enhanceContentHead(html,'window-trip.html',root);
const target=path.join(root,'window-trip.html'),old=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';if(old!==html){if(process.argv.includes('--check'))throw Error('window-trip.html is stale');fs.writeFileSync(target,html);}
console.log('Window trip page: generated with shared site header and footer.');
