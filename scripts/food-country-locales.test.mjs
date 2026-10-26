import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderSiteRuntimeForValidation} from './shared/site-runtime-validation.mjs';
import {supported} from './shared/locales.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const page=relative=>renderSiteRuntimeForValidation({appDir:root,html:read(relative),relative}).dom;
const languages=['ja','en','zh-Hant','fr','de','es','zh-Hans','ko'];
const routes=['foods.html','countryside.html','spots/gamagori-greenhouses.html'];
const origin='https://www.michikusa-travel.com/';

test('food and landscape editions have all eight real reciprocal destinations',async()=>{
  const sitemap=read('sitemap.xml');
  for(const route of routes){
    assert.deepEqual(supported(route),languages);
    for(const lang of languages){
      const file=(lang==='ja'?'':lang+'/')+route;
      const dom=page(file),doc=dom.window.document;
      assert.equal(doc.documentElement.lang,lang);
      assert.equal(doc.querySelector('link[rel="canonical"]').href,origin+file);
      for(const target of languages){
        const links=doc.querySelectorAll(`head link[rel="alternate"][hreflang="${target}"]`);
        assert.equal(links.length,1,file+' '+target);
        assert.equal(links[0].href,origin+(target==='ja'?'':target+'/')+route);
      }
      assert.equal(doc.querySelectorAll('head link[hreflang="x-default"]').length,1,file);
      assert(sitemap.includes(origin+file+'</loc>'),file+' sitemap');
      dom.window.close();await new Promise(setImmediate);
    }
  }
});

test('Japanese feature snapshots preserve article photographs and original licence destinations',()=>{
  for(const route of ['foods.html','countryside.html']){
    const en=page('en/'+route),ja=page(route);
    const images=doc=>[...doc.querySelectorAll('article img,.countryside-hero img,.food-hero img')].map(el=>({src:new URL(el.getAttribute('src'),doc.URL).pathname,width:el.getAttribute('width'),height:el.getAttribute('height')}));
    assert.deepEqual(images(ja.window.document),images(en.window.document),route);
    const rights=doc=>[...doc.querySelectorAll('a[href]')].filter(a=>/https:\/\/(?:commons\.wikimedia\.org|creativecommons\.org)\//.test(a.href)).map(a=>a.href).sort();
    assert.deepEqual(rights(ja.window.document),rights(en.window.document));
    assert(ja.window.document.querySelector('header').textContent.includes('新幹線の窓'));
    ja.window.eval(read('locales.js'));ja.window.eval(read('article-locales.js'));ja.window.document.dispatchEvent(new ja.window.Event('DOMContentLoaded'));
    const menu=ja.window.document.querySelector('.article-lang-menu');assert(menu);
    assert.deepEqual([...menu.querySelectorAll('a')].map(a=>a.lang),languages);
    assert(menu.querySelector('a[lang="ja"]').href.includes('lang=ja'));
    for(const a of ja.window.document.querySelectorAll('a[hreflang="en"]'))if(!a.closest('.article-lang-menu'))assert(a.textContent.includes('英語'),a.outerHTML);
    ja.window.close();en.window.close();
  }
});

test('new dictionaries cover their bounded source copy without empty translations',()=>{
  for(const name of ['foods','countryside','greenhouses']){
    const dict=JSON.parse(read('scripts/shared/'+name+'-locales.json'));
    for(const lang of languages.slice(2)){
      assert(dict[lang]);
      assert(Object.keys(dict[lang]).length>100);
      assert(Object.values(dict[lang]).every(value=>typeof value==='string'&&value.trim()));
    }
  }
});

test('all three filling buttons retain the selected edition after interaction',()=>{
  for(const lang of languages){
    const file=(lang==='ja'?'':lang+'/')+'foods.html';
    const dom=page(file),doc=dom.window.document;
    dom.window.eval(read('foods.js'));
    doc.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    for(const button of doc.querySelectorAll('[data-filling]')){
      const description=button.getAttribute('data-filling-description');
      assert(description?.trim(),file+' '+button.dataset.filling);
      if(lang!=='en')assert(!/^(?:Salmon: savoury|Tuna mayo: tuna|Ume: pickled)/.test(description),file+' untranslated runtime');
      button.click();
      assert.equal(doc.getElementById('filling-description').textContent,description);
      assert.equal(button.getAttribute('aria-pressed'),'true');
      assert.equal(doc.querySelectorAll('[data-filling][aria-pressed="true"]').length,1);
    }
    dom.window.close();
  }
});
