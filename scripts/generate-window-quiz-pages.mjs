import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {enhanceContentHead} from './shared/content-metadata.mjs';
import {assetVersion} from './shared/asset-version.mjs';
import {ANALYTICS} from './shared/feature-page.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const chrome={};vm.createContext(chrome);
vm.runInContext(read('spot-page-shared.js'),chrome);
function write(file,text){if(fs.existsSync(path.join(root,file))&&read(file)===text)return;if(process.argv.includes('--check'))throw Error('Stale '+file);fs.writeFileSync(path.join(root,file),text);}
for(const [kind,route,title,description] of [
 ['recognition','window-quiz.html','車窓クイズ｜新幹線の窓','新幹線の写真で名前を当てる10問と、動画から場所を探す車窓Guesser。城や橋、ふしぎな形を見つけて遊ぼう。'],
 ['guesser','window-guesser.html','この車窓、どこ？｜車窓Guesser','動画を前後に動かし、景色の手がかりから撮影場所を当てる全18問。地図や駅の区間で答えてみよう。']]){
 const global=kind==='recognition'?'QUIZ_QUESTIONS':'CLIP_QUESTIONS';write('quiz/'+kind+'-data.js','window.'+global+' = '+JSON.stringify(JSON.parse(read('data/window-quiz/'+kind+'.json')))+';\n');
 let html=read('data/window-quiz/'+kind+'.tpl').replace('<!-- COMMON_HEADER -->',chrome.MADO_SPOT_PAGE_COMPONENTS.siteHeaderHTML('','ja','',route,false)).replace('<!-- COMMON_CONTENT_RAIL -->',chrome.MADO_SPOT_PAGE_COMPONENTS.contentRailHTML('','ja'));
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+title+'</title>').replace('</head>','<meta name="description" content="'+description+'"><link rel="canonical" href="https://www.michikusa-travel.com/'+route+'"><meta property="og:title" content="'+title+'"><meta property="og:description" content="'+description+'"><meta property="og:url" content="https://www.michikusa-travel.com/'+route+'"><meta name="twitter:card" content="summary_large_image">'+ANALYTICS.withEmbeddedGuard+'</head>');
 html=html.replace(/(href|src)="([^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g,(_,key,file)=>`${key}="${file}?v=${assetVersion(file)}"`);
 write(route,enhanceContentHead(html,route,root));
}
