import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {kyotoWindowArticle} from './shared/window-articles.mjs';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(app,file),'utf8');
const scope={};
for(const file of ['spot-page-shared-data.js','spot-page-shared.js'])vm.runInNewContext(read(file),{window:scope});
const render=page=>new JSDOM(scope.MADO_SPOT_PAGE_COMPONENTS.pageHTML(scope.MADO_SPOT_PAGE_SHARED_DATA,page,'',page.lang,page.id));
const payload=(id,lang)=>{const c={};vm.runInNewContext(read(`data/spot-pages/${id}.${lang}.js`),c);return c.MADO_SPOT_PAGE_DATA;};
const ids=['tamaruya-wasabi-sign','kizakura-otsukaresama-sign'];

test('six editions retain the article, clean photo copy and owned opening photographs',()=>{
  for(const lang of ['ja','en'])for(const id of [...ids,'kyoto-station-views']){
    const page=id==='kyoto-station-views'?kyotoWindowArticle(lang):payload(id,lang);
    assert.equal(page.chapters.length,5,`${id}/${lang}`);
    assert.ok(page.gallery.every(photo=>photo.credit==='michikusa'));
    for(const photo of [...page.gallery,...page.chapters.flatMap(ch=>ch.photos)]){
      assert.equal(photo.date,'');assert.ok(photo.alt);
      assert.ok(fs.existsSync(path.join(app,photo.src)),photo.src);
      assert.doesNotMatch(photo.note||'',/動画から|切り出|自前|元写真|cropped|extracted|frame from|own photo/i);
      if(lang==='en')assert.doesNotMatch(photo.alt+photo.note,/[ぁ-ゖァ-ヺ]/);
    }
    const dom=render(page),doc=dom.window.document;
    assert.equal(doc.querySelectorAll('h1').length,1);
    assert.equal(doc.querySelectorAll('iframe[src*="youtube-nocookie"]').length,id==='kizakura-otsukaresama-sign'?1:0);
    for(const link of doc.querySelectorAll('a[href]'))assert.doesNotMatch(link.getAttribute('href'),/undefined|\.\.\/https:/);
    if(lang==='en')assert.equal(doc.querySelector('h1 .copy-chunk'),null);
    dom.window.close();
  }
});

test('English food, sake and Kyoto architecture routes connect in both directions',()=>{
  for(const [id,route,anchor,chapter]of [
    [ids[0],'en/foods.html','wasabi','wasabi-zuke'],
    [ids[1],'en/drinks.html','sake','last-window'],
    ['kyoto-station-views','en/tokyo-kyoto-stations.html','look-around','change-viewpoint']
  ]){
    const page=id==='kyoto-station-views'?kyotoWindowArticle('en'):payload(id,'en');
    assert.equal(page.chapters.find(ch=>ch.id===chapter).link.route,`${route}#${anchor}`);
    const dom=new JSDOM(read(route));
    assert.ok(dom.window.document.getElementById(anchor));
    assert.ok(dom.window.document.querySelector(`a[href="${id==='kyoto-station-views'?'':'spots/'}${id}.html"]`));
    dom.window.close();
  }
  const page=kyotoWindowArticle('en');assert.equal(page.minutes,null);assert.equal(page.map,null);assert.equal(page.guide,null);
});

test('the standalone Kyoto editions have usable chrome, credits and local assets',()=>{
  for(const lang of ['ja','en']){
    const file=(lang==='ja'?'':'en/')+'kyoto-station-views.html',html=read(file);
    assert.doesNotMatch(html,/\[object Object\]|undefined/);
    const dom=new JSDOM(html),doc=dom.window.document;assert.equal(doc.documentElement.lang,lang);assert.equal(doc.querySelectorAll('h1').length,1);
    assert.ok(doc.querySelector('[data-spot-page-shared-route="kyoto-station-views.html"]'));
    assert.equal(doc.querySelectorAll('a[href*="creativecommons.org/licenses/"]').length,3);
    assert.ok(doc.querySelector('a[href="spots/toji.html"]'));
    for(const el of doc.querySelectorAll('img[src],script[src],link[rel="stylesheet"][href]')){const asset=el.getAttribute('src')||el.getAttribute('href');if(/^https?:/.test(asset))continue;assert.ok(fs.existsSync(path.resolve(app,path.dirname(file),asset.split('?')[0])),asset);}
    dom.window.close();
  }
});

test('Kyoto photo selection and keyboard enlargement preserve clean localized captions',()=>{
  for(const lang of ['ja','en']){
    const file=(lang==='ja'?'':'en/')+'kyoto-station-views.html';
    const dom=new JSDOM(read(file),{runScripts:'outside-only',url:`https://www.michikusa-travel.com/${file}`});
    const doc=dom.window.document;
    for(const script of ['spot-page-shared-data.js','spot-page-shared.js','spot-media-gallery.js','window-articles.js'])dom.window.eval(read(script));
    assert.equal(doc.querySelector('[data-spot-page-shared-module],.spot-page-shared-error'),null);
    doc.querySelectorAll('[data-gallery-thumb]')[1].click();
    const photo=doc.querySelector('[data-gallery-image]');
    assert.match(photo.dataset.photoOriginalSrc,/20260816_kyoto-tower/);
    assert.equal(doc.querySelector('[data-gallery-date-output]').textContent,'');
    assert.doesNotMatch(doc.querySelector('[data-gallery-note-output]').textContent,/動画|切り出|frame|cropped/i);
    const trigger=doc.querySelector('[data-gallery-image-link]');
    assert.equal(trigger.tabIndex,0);
    assert.equal(trigger.getAttribute('aria-hidden'),null);
    assert.equal(dom.window.location.hash,'#spot-kyoto-station-views/photo-2');
    trigger.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    assert.equal(doc.getElementById('spotPageLightbox').hidden,false);
    doc.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal(doc.getElementById('spotPageLightbox').hidden,true);
    assert.equal(doc.activeElement,trigger);
    const restored=new JSDOM(read(file),{runScripts:'outside-only',url:dom.window.location.href});
    for(const script of ['spot-media-gallery.js','window-articles.js'])restored.window.eval(read(script));
    assert.match(restored.window.document.querySelector('[data-gallery-image]').dataset.photoOriginalSrc,/20260816_kyoto-tower/);
    restored.window.close();
    dom.window.close();
  }
});
