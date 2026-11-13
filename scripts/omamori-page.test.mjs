import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {supported} from './shared/locales.mjs';
import {englishSnapshot} from './shared/castle-localization.mjs';
import {CONTENT_METADATA,metadataProblems} from './shared/content-metadata.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const site='https://www.michikusa-travel.com/';
const editions=['omamori.html','en/omamori.html'];
for(const [i,file] of editions.entries())test(`${file}: complete article, two real editions, licensed images and no-JS meanings`,()=>{
  const dom=new JSDOM(read(file),{url:site+file}),doc=dom.window.document;
  assert.equal(doc.documentElement.lang,i?'en':'ja');
  assert.equal(doc.querySelector('link[rel=canonical]').href,site+file);
  assert.deepEqual([...doc.querySelectorAll('link[rel=alternate]')].map(x=>[x.hreflang,x.href]).sort(),[['ja',site+'omamori.html'],['en',site+'en/omamori.html'],['x-default',site+'en/omamori.html']].sort());
  assert.ok(doc.body.getAttribute('data-spot-page-shared-root'),'Legacy utility renderer requires a nonempty relative root');
  assert.equal(doc.querySelectorAll('.food-section').length,5);
  assert.equal(doc.querySelectorAll('[data-omamori-word]').length,6);
  assert.equal(doc.querySelectorAll('[data-omamori-word][aria-pressed=true]').length,1);
  assert.equal(doc.querySelectorAll('.om-faq details').length,4);
  assert.equal(doc.querySelectorAll('noscript dd').length,5);
  for(const el of doc.querySelectorAll('.om-photo img')){
    assert.ok(el.alt.length>10);assert.ok(fs.existsSync(path.join(root,new URL(el.src).pathname.slice(1))));
  }
  for(const button of doc.querySelectorAll('[data-omamori-word]'))assert.ok(button.dataset.title&&button.dataset.description);
  assert.match(doc.querySelector('#credit-various').textContent,/Leongboy1/);
  assert.match(doc.querySelector('#credit-meiji').textContent,/Pocsywe/);
  assert.match(doc.querySelector('#credit-meiji').textContent,/2018/);
  assert.match(doc.querySelector('#credit-various').textContent,/2008/);
  assert.ok(doc.querySelector('link[href*="foods.css"]'));
  assert.equal(CONTENT_METADATA[file].published,undefined,'Unpublished article must not claim a publication date');
  dom.window.close();
});
test('available languages and series entry points match the delivered pages',()=>{
  assert.deepEqual(supported('omamori.html'),['ja','en']);
  for(const file of ['foods.html','en/foods.html','en/drinks.html','en/everyday-japan.html']){
    const dom=new JSDOM(read(file),{url:site+file});
    assert.ok([...dom.window.document.querySelectorAll('a')].some(a=>a.href===site+(file.startsWith('en/')?'en/':'')+'omamori.html'),file+' is missing the article entry');
    dom.window.close();
  }
  assert.deepEqual(metadataProblems(),[]);
});
test('English-only entries do not become untranslated content in existing language snapshots',()=>{
  for(const route of ['foods.html','drinks.html','everyday-japan.html']){
    const dom=englishSnapshot(root,route);
    assert.equal(dom.window.document.querySelectorAll('[data-edition-only]').length,0);
    assert.ok(!dom.window.document.querySelector('a[href="omamori.html"]'),route);
    assert.ok(dom.window.document.querySelector('h1')?.textContent.trim());
    dom.window.close();
    for(const lang of ['zh-Hant','fr','de','es','zh-Hans','ko','it','th']){
      const file=`${lang}/${route}`;
      if(!fs.existsSync(path.join(root,file)))continue;
      const translated=new JSDOM(read(file));
      assert.equal(translated.window.document.querySelectorAll('a[href*="omamori.html"],img[src*="images/omamori/"],[data-edition-only]').length,0,file);
      translated.window.close();
    }
  }
});
test('sitemap and Web distribution include both editions and their resources',()=>{
  const manifest=read('content-manifest.json');
  for(const asset of [...editions,'omamori.css','omamori.js','images/omamori/omamori-various.jpg','images/omamori/omamori-meiji.jpg'])assert.ok(manifest.includes('"'+asset+'"'),asset);
  const sitemap=read('sitemap.xml');for(const file of editions)assert.ok(sitemap.includes('<loc>'+site+file+'</loc>'));
});
