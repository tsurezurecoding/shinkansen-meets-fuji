import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';

const root=fileURLToPath(new URL('../',import.meta.url));
const origin='https://www.michikusa-travel.com/';
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/window-artworks.json'),'utf8'));
function page(lang,url,capacitor){
  const relative=(lang==='en'?'en/':'')+'window-artworks.html';
  const dom=new JSDOM(fs.readFileSync(path.join(root,relative),'utf8'),{url,runScripts:'outside-only'});
  if(capacitor)dom.window.Capacitor=capacitor;
  for(const card of dom.window.document.querySelectorAll('[data-artwork]')){
    const script=card.nextElementSibling;
    if(script?.tagName!=='SCRIPT')continue;
    Object.defineProperty(dom.window.document,'currentScript',{configurable:true,value:script});
    dom.window.eval(script.textContent);
    delete dom.window.document.currentScript;
  }
  return dom;
}

for(const lang of ['ja','en'])test(`${lang}: artwork thumbnails and original calls to action survive Web and local previews`,()=>{
  const relative=(lang==='en'?'en/':'')+'window-artworks.html';
  for(const url of [new URL(relative,origin).href,new URL(relative,'http://localhost:4173/').href,new URL(relative,'http://127.0.0.1:4173/').href,pathToFileURL(path.join(root,relative)).href]){
    const dom=page(lang,url,{isNativePlatform:()=>false,getPlatform:()=>'web'});
    try{for(const work of catalog.works.filter(w=>w.status==='published'&&(!w.languages||w.languages.includes(lang)))){
      const card=dom.window.document.querySelector(`[data-artwork="${work.id}"]`),image=card.querySelector('img'),open=card.querySelector('.artwork-open');
      assert.ok(image,`${url}: ${work.id} thumbnail`);assert.equal(image.parentElement.hidden,false);
      assert.equal(image.getAttribute('src'),(lang==='en'?'../':'')+work.image);
      assert.equal(image.width,1200);assert.equal(image.height,630);
      assert.equal(image.parentElement.getAttribute('href'),work.route);assert.equal(open.getAttribute('href'),work.route);
      assert.match(open.textContent,lang==='ja'?/^作品を見る\s*→/:/^Explore the work\s*→/);
      if(url.startsWith('file:'))assert.ok(fs.existsSync(fileURLToPath(image.src)),image.src);
    }}finally{dom.window.close();}
  }
});

test('native bundles retain the online-only film contract without requesting excluded thumbnails',()=>{
  for(const lang of ['ja','en'])for(const scenario of [
    {origin:'https://localhost/',bridge:{isNativePlatform:()=>true}},
    {origin:'https://custom-native-host/',bridge:{getPlatform:()=>'android'}},
    {origin:'capacitor://localhost/'},
    {origin:'file:///android_asset/www/'}
  ]){
    const relative=(lang==='en'?'en/':'')+'window-artworks.html',dom=page(lang,new URL(relative,scenario.origin).href,scenario.bridge);
    try{for(const work of catalog.works.filter(w=>(w.id==='window-film'||w.webOnly)&&(!w.languages||w.languages.includes(lang)))){
      const card=dom.window.document.querySelector(`[data-artwork="${work.id}"]`),open=card.querySelector('.artwork-open');
      assert.equal(card.querySelector('img'),null);assert.equal(open.href,origin+(lang==='en'?'en/':'')+work.route);
      assert.match(open.textContent,lang==='ja'?/^オンラインで鑑賞（通信が必要です）/:/^Watch online \(internet connection required\)/);
    }}finally{dom.window.close();}
  }
});
