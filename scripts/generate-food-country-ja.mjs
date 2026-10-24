// Japanese editions reuse the approved article structure and existing Japanese chrome.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {englishSnapshot,textNodes,TRANSLATABLE_ATTRIBUTES} from './shared/castle-localization.mjs';
import {supported,stripEdition} from './shared/locales.mjs';
import {assetVersion} from './shared/asset-version.mjs';
import {enhanceContentHead} from './shared/content-metadata.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.michikusa-travel.com';
const planned=new Set(['foods.html','countryside.html']);
const check=process.argv.includes('--check');
const chrome=new JSDOM(fs.readFileSync(path.join(root,'castles.html'),'utf8'),{url:origin+'/castles.html',runScripts:'outside-only'});
for(const file of ['spot-page-shared-data.js','spot-page-shared.js'])chrome.window.eval(fs.readFileSync(path.join(root,file),'utf8'));
// Resolve the spot page's ../ paths before moving its shared modules to a root page.
for(const host of chrome.window.document.querySelectorAll('header,.spot-page-rail,footer'))for(const el of host.querySelectorAll('[href],[src]'))for(const attr of ['href','src'])if(el.hasAttribute(attr))el.setAttribute(attr,new URL(el.getAttribute(attr),chrome.window.location.href).href);

for(const name of ['foods','countryside']){
  const file=name+'.html',jaFile=path.join(root,`scripts/shared/${name}-ja.json`);
  const copy=fs.existsSync(jaFile)?JSON.parse(fs.readFileSync(jaFile,'utf8')):JSON.parse(fs.readFileSync(path.join(root,`scripts/shared/${name}-locales.json`),'utf8')).ja;
  if(!copy)throw Error('Missing Japanese dictionary: '+name);
  const dom=englishSnapshot(root,file),doc=dom.window.document,missing=new Set();
  for(const selector of ['header.topbar','.spot-page-rail','footer']){
    const source=chrome.window.document.querySelector(selector),target=doc.querySelector(selector);
    if(source&&target)target.replaceWith(doc.importNode(source,true));
  }
  doc.querySelectorAll('header [aria-current],.spot-page-rail [aria-current]').forEach(el=>el.removeAttribute('aria-current'));
  const tr=s=>{const key=s.trim();if(!key)return s;if(typeof copy[key]!=='string'){missing.add(key);return s;}return s.replace(key,()=>copy[key]);};
  for(const node of textNodes(doc))if(!node.parentElement.closest('header.topbar,.spot-page-rail,footer,.brand-mark,.show-credit,figcaption a:not([data-gallery-source-output])'))node.textContent=tr(node.textContent);
  for(const el of doc.querySelectorAll('*'))if(!el.closest('header.topbar,.spot-page-rail,footer'))for(const attr of TRANSLATABLE_ATTRIBUTES)if(el.hasAttribute(attr)&&el.getAttribute(attr).trim())el.setAttribute(attr,tr(el.getAttribute(attr)));
  if(name==='foods'){
    // Translate complete sentences whose English emphasis splits the Japanese predicate.
    doc.querySelector('#nikuman .japanese-name').nextElementSibling.innerHTML='豚肉の具をふっくらした生地で包んだ蒸しまんです。関西では「<em>豚まん</em>」という名前もよく見かけます。';
    doc.querySelector('#taiyaki .japanese-name').nextElementSibling.innerHTML='魚の形をしたお菓子です。中には「<em>あんこ</em>」と呼ばれる甘い小豆あんが入っていることが多くあります。カスタードなど、メニューを眺める楽しみが広がる具もあります。';
    for(const el of doc.querySelectorAll('noscript'))el.innerHTML='<p>ツナマヨ：ツナをまろやかなマヨネーズで和えた具。梅：酸味のある梅干し。</p>';
  }
  doc.title=tr(doc.title);
  for(const el of doc.querySelectorAll('meta[name],meta[property]')){
    const key=el.getAttribute('name')||el.getAttribute('property');
    if(/(?:description|title|image:alt)$/.test(key))el.content=tr(el.content);
    if(key==='og:locale')el.content='ja_JP';
    if(key==='og:url')el.content=origin+'/'+file;
  }
  doc.querySelector('link[rel="canonical"]').href=origin+'/'+file;
  doc.documentElement.lang='ja';doc.body.setAttribute('data-spot-page-shared-lang','ja');
  doc.body.setAttribute('data-spot-page-shared-root','');doc.body.setAttribute('data-article-localized','');
  doc.querySelectorAll('[data-spot-page-shared-module]').forEach(el=>el.removeAttribute('data-spot-page-shared-module'));
  doc.querySelectorAll('script[src*="spot-page-shared-data"]').forEach(el=>el.remove());
  for(const el of doc.querySelectorAll('script:not([src])'))if(el.type==='application/ld+json'){
    const rewrite=(value,key='')=>{
      if(Array.isArray(value))return value.map(v=>rewrite(v));
      if(value&&typeof value==='object'){
        if(value['@type']==='Organization')return {...value,name:'新幹線の窓'};
        return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v,k)]));
      }
      if(key==='inLanguage')return 'ja';
      if(typeof value!=='string')return value;
      if(value.startsWith(origin+'/en/'+file))return value.replace('/en/'+file,'/'+file);
      return ['name','headline','description','caption'].includes(key)&&copy[value]?copy[value]:value;
    };
    el.textContent=JSON.stringify(rewrite(JSON.parse(el.textContent)),null,2);
  }
  for(const el of doc.querySelectorAll('[href],[src],[poster]'))for(const attr of ['href','src','poster']){
    if(!el.hasAttribute(attr))continue;
    if(el.tagName==='LINK'&&['canonical','alternate'].includes(el.rel))continue;
    const raw=el.getAttribute(attr);if(raw.startsWith('#')||/^(?:mailto:|tel:|data:|javascript:)/.test(raw))continue;
    const url=new URL(raw,origin+'/en/'+file);if(url.origin!==origin)continue;
    let target=url.pathname.slice(1);
    if(attr==='href'&&(target.endsWith('.html')||target.endsWith('/'))){
      const route=stripEdition(target)||'index.html';
      if(supported(route).includes('ja')&&(planned.has(route)||fs.existsSync(path.join(root,route)))){
        target=route;url.searchParams.delete('lang');
      }else if(target.startsWith('en/')){
        el.setAttribute('hreflang','en');
        if(!el.closest('.lang-switch')&&!el.querySelector('.article-language-note')){
          const note=doc.createElement('small');note.className='article-language-note';note.textContent='（英語）';el.append(' ',note);
        }
      }
    }
    if(/\.(?:js|css)$/.test(target))url.search='?v='+assetVersion(target);
    el.setAttribute(attr,target+url.search+url.hash);
  }
  // Source responsive images keep their root-relative assets after moving out of /en/.
  for(const el of doc.querySelectorAll('[srcset]'))el.setAttribute('srcset',el.getAttribute('srcset').replace(/\.\.\//g,''));
  doc.querySelectorAll('[lang="en"]').forEach(el=>{if(!el.closest('[hreflang="en"]'))el.lang='ja';});
  if(missing.size)throw Error(name+' untranslated Japanese copy: '+JSON.stringify([...missing]));
  const html=enhanceContentHead(dom.serialize(),file,root,{lang:'ja'});
  const target=path.join(root,file);
  if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==html)throw Error('Japanese article stale: '+file);}
  else fs.writeFileSync(target,html);
  dom.window.close();
}
chrome.window.close();
console.log('Japanese foods and countryside: 2 editions, existing Japanese common modules retained.');
