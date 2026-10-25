import fs from 'node:fs';
import {assetVersion} from './asset-version.mjs';
const templates=Object.fromEntries(['ja','en'].map(lang=>[lang,fs.readFileSync(new URL('../../data/home-entry/'+lang+'.html',import.meta.url),'utf8')]));
export function withHomeEntry(html,lang){
 if(!templates[lang])throw Error('Unknown home entry language: '+lang);
 const block='<!-- HOME_ENTRY_START -->'+templates[lang]+'<!-- HOME_ENTRY_END -->';
 if(html.includes('<!-- HOME_ENTRY_START -->'))html=html.replace(/<!-- HOME_ENTRY_START -->[\s\S]*?<!-- HOME_ENTRY_END -->/,block);
 else html=html.replace(/<section class="scenery scenery-under-hero"[\s\S]*?<\/section>/,block);
 html=html.replace(/<section class="select(?: ride-compact ride-audio)?"[^>]*>[\s\S]*?<\/section>/g,'').replace(/<section class="(?:manifesto|for-you)"[^>]*>[\s\S]*?<\/section>/g,'');
 html=html.replace(/<script src="home-scenery.js[^"]*" defer><\/script>/,'');
 if(!html.includes('class="top-redesign'))html=html.replace(/<main\b([^>]*)>/,'<main$1 class="top-redesign">');
 if(!html.includes('href="home-entry.css'))html=html.replace('</head>','<link rel="stylesheet" href="home-entry.css?v='+assetVersion('home-entry.css')+'">\n</head>');
 return html.replace(/[ \t]+$/gm,'');
}
