import { readSiteSource, finalizeSiteChrome } from './shared/site-chrome.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ANALYTICS} from './shared/feature-page.mjs';
import {enhanceContentHead} from './shared/content-metadata.mjs';
import {assetVersion} from './shared/asset-version.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages=JSON.parse(fs.readFileSync(path.join(root,'data/sudoori/pages.json'),'utf8'));
const guide=readSiteSource(root, 'zukan.html');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let changed=0;
const routeFile=path.join(root,'sudoori/assets/route.js');
const routeSource='window.ROUTE='+JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'data/sudoori/route.json'),'utf8')))+';\n';
if(fs.readFileSync(routeFile,'utf8')!==routeSource){if(process.argv.includes('--check'))throw Error('Stale sudoori route');fs.writeFileSync(routeFile,routeSource);changed++;}
for(const p of pages){
 const prefix='../'.repeat(p.route.split('/').length-1);
 const local=s=>s.replace(/(href|src)="([^"#][^"]*)"/g,(all,key,v)=>/^(https?:|mailto:)/.test(v)?all:`${key}="${prefix}${v}"`);
 let header=guide.match(/<header class="topbar">[\s\S]*?<\/header>/)[0];
 header=header.replace(/<div class="lang-switch"[\s\S]*?<\/div>/,'<div class="lang-switch"><span class="active">日本語</span></div>').replace(' aria-current="page"','');
 const footer=guide.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0];
 const url='https://www.michikusa-travel.com/'+p.route;
 let html=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}"><link rel="canonical" href="${url}"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.michikusa-travel.com/images/og-shinkansen-window.png"><meta property="og:image:alt" content="新幹線の窓 — 沿線の町を知る旅"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${prefix}favicon.ico">${p.styles.map(h=>`<link rel="stylesheet" href="${h}?v=${assetVersion(path.posix.normalize(path.posix.join(path.posix.dirname(p.route),h)))}">`).join('')}${ANALYTICS.withEmbeddedGuard}</head><body class="${p.bodyClass}"><a class="skip" href="#main">本文へ</a>${local(header)}${p.main}${local(footer)}${p.scripts.map(h=>`<script src="${h}?v=${assetVersion(path.posix.normalize(path.posix.join(path.posix.dirname(p.route),h)))}"></script>`).join('')}</body></html>\n`;
 html=finalizeSiteChrome(enhanceContentHead(html,p.route,root),p.route,root);
 const target=path.join(root,p.route),old=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';
 if(old!==html){if(process.argv.includes('--check'))throw Error('Stale '+p.route);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html);changed++;}
}
console.log(`Sudoori: ${pages.length} Japanese pages, ${changed} changed.`);
