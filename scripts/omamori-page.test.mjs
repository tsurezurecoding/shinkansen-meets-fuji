import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {supported,languages} from './shared/locales.mjs';
import {englishSnapshot} from './shared/castle-localization.mjs';
import {CONTENT_METADATA,metadataProblems} from './shared/content-metadata.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const site='https://www.michikusa-travel.com/';
const editions=languages.map(lang=>`${lang==='ja'?'':lang+'/'}omamori.html`);
for(const [i,file] of editions.entries())test(`${file}: complete localized article, ten editions, licensed images and no-JS meanings`,()=>{
  const dom=new JSDOM(read(file),{url:site+file}),doc=dom.window.document;
  const copy=JSON.parse(read(`data/omamori/${languages[i]}.json`));
  assert.equal(doc.documentElement.lang,languages[i]);
  assert.equal(doc.querySelector('link[rel=canonical]').href,site+file);
  assert.deepEqual([...doc.querySelectorAll('link[rel=alternate]')].map(x=>[x.hreflang,x.href]).sort(),[...languages.map((lang,i)=>[lang,site+editions[i]]),['x-default',site+'en/omamori.html']].sort());
  assert.ok(doc.body.getAttribute('data-spot-page-shared-root'),'Legacy utility renderer requires a nonempty relative root');
  assert.equal(doc.querySelectorAll('.food-section').length,5);
  assert.equal(doc.querySelectorAll('[data-omamori-word]').length,6);
  assert.equal(doc.querySelectorAll('[data-omamori-word][aria-pressed=true]').length,1);
  assert.equal(doc.querySelectorAll('.om-faq details').length,4);
  assert.equal(doc.querySelectorAll('noscript dd').length,5);
  for(const el of doc.querySelectorAll('.om-photo img')){
    assert.ok(el.alt.length>10);assert.ok(fs.existsSync(path.join(root,new URL(el.src).pathname.slice(1))));
  }
  for(const button of doc.querySelectorAll('[data-omamori-word]')){
    const word=copy.words.find(word=>word.id===button.dataset.omamoriWord);
    assert.equal(button.dataset.title,word.title);assert.equal(button.dataset.description,word.text);
  }
  assert.match(doc.querySelector('#credit-various').textContent,/Leongboy1/);
  assert.match(doc.querySelector('#credit-meiji').textContent,/Pocsywe/);
  assert.match(doc.querySelector('#credit-meiji').textContent,/2018/);
  assert.equal(doc.querySelector('#omamori-title').textContent,copy.title.replaceAll('|',''));
  assert.ok(!read(file).includes('Original files are used without visual retouching'));
  assert.ok(doc.querySelector('link[href*="foods.css"]'));
  assert.equal(CONTENT_METADATA[file].published,undefined,'Unpublished article must not claim a publication date');
  dom.window.close();
});
test('available languages and series entry points match the delivered pages',()=>{
  assert.deepEqual(supported('omamori.html'),languages);
  assert.ok(!new JSDOM(read('foods.html')).window.document.querySelector('a[href*="omamori.html"]'),'Japanese food page must not promote the Japanese article');
  for(const lang of languages.filter(lang=>lang!=='ja'))for(const route of ['foods.html','drinks.html','everyday-japan.html']){
    const file=`${lang}/${route}`;
    const dom=new JSDOM(read(file),{url:site+file});
    const card=[...dom.window.document.querySelectorAll('a')].find(a=>a.href===site+lang+'/omamori.html');
    assert.ok(card,file+' is missing the article entry');
    const copy=JSON.parse(read(`data/omamori/${lang}.json`));
    assert.ok(card.textContent.includes(copy.entry.title),file+' must use its translated entry');
    dom.window.close();
  }
  assert.deepEqual(metadataProblems(),[]);
});
test('English entries are removed before the existing translation dictionaries run',()=>{
  for(const route of ['foods.html','drinks.html','everyday-japan.html']){
    const dom=englishSnapshot(root,route);
    assert.equal(dom.window.document.querySelectorAll('[data-edition-only]').length,0);
    assert.ok(!dom.window.document.querySelector('a[href="omamori.html"]'),route);
    assert.ok(dom.window.document.querySelector('h1')?.textContent.trim());
    dom.window.close();
  }
});
test('sitemap and Web distribution include all ten editions and their resources',()=>{
  const manifest=read('content-manifest.json');
  for(const asset of [...editions,'omamori.css','omamori.js','images/omamori/omamori-various.jpg','images/omamori/omamori-meiji.jpg'])assert.ok(manifest.includes('"'+asset+'"'),asset);
  const sitemap=read('sitemap.xml');for(const file of editions)assert.ok(sitemap.includes('<loc>'+site+file+'</loc>'));
});
