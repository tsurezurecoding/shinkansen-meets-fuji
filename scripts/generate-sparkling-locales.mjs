// English traveler-facing Disney page is the structural/content source.
import fs from 'node:fs';
import { finalizeSiteChrome } from './shared/site-chrome.mjs';
import {withPageAndroidAppInvite} from './shared/android-app-invite.mjs';
import { supported, editions, languages, stripEdition } from './shared/locales.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSparklingEnglish, sparklingSnapshot, SPARKLING_ROUTE, SPARKLING_LOCALES, SPARKLING_ATTRS, SPARKLING_EXCLUDE } from './shared/sparkling-localization.mjs';
import { withSparklingLocales } from './shared/sparkling-locales.mjs';
import { UTILITY_ROUTES } from './shared/utility-locales.mjs';
import { CASTLE_LOCALE_ROUTES } from './shared/castle-locales.mjs';
import { textNodes } from './shared/castle-localization.mjs';
import { assetVersion } from './shared/asset-version.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.michikusa-travel.com';
const check=process.argv.includes('--check');
const known=[SPARKLING_ROUTE,...UTILITY_ROUTES,...CASTLE_LOCALE_ROUTES,'guide.html'];
const keys=collectSparklingEnglish(root);
function write(file,text){text=finalizeSiteChrome(withPageAndroidAppInvite(text,file),file,root);const target=path.join(root,file);if(fs.existsSync(target)&&fs.readFileSync(target,'utf8')===text)return;if(check)throw Error('Stale Disney locale output: '+file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);}
const requestedLang=process.argv.includes('--lang')?process.argv[process.argv.indexOf('--lang')+1]:null;
if(requestedLang&&!SPARKLING_LOCALES.includes(requestedLang))throw Error('Unknown Disney locale: '+requestedLang);
for(const lang of requestedLang?[requestedLang]:SPARKLING_LOCALES){
 const dictionary=JSON.parse(fs.readFileSync(path.join(root,'scripts/locales',`sparkling-${lang}.json`),'utf8'));
 const missing=keys.filter(key=>!dictionary[key]);if(missing.length)throw Error(`${lang}: ${missing.length} Disney translations missing: ${missing.slice(0,5).join(' / ')}`);
 const tr=value=>typeof value==='string'&&dictionary[value.trim()]?value.replace(value.trim(),()=>dictionary[value.trim()]):value;
 const dom=sparklingSnapshot(root),doc=dom.window.document;
 const file=`${lang}/${SPARKLING_ROUTE}`;
 doc.documentElement.lang=lang;doc.body.setAttribute('data-article-localized','');doc.body.setAttribute('data-utility-localized','');doc.body.setAttribute('data-spot-page-shared-lang',lang);
 doc.querySelectorAll('[data-spot-page-shared-module]').forEach(el=>el.removeAttribute('data-spot-page-shared-module'));
 for(const node of textNodes(doc))if(!node.parentElement.closest(SPARKLING_EXCLUDE))node.textContent=tr(node.textContent);
 // Avoid noscript.innerHTML's special parsing mode by translating real nodes separately.
 for(const el of doc.querySelectorAll('noscript')){
  const fallback=doc.createElement('div');fallback.innerHTML=el.innerHTML;
  for(const node of textNodes(doc,fallback))node.textContent=tr(node.textContent);
  el.replaceChildren(...fallback.childNodes);
 }
 for(const el of doc.querySelectorAll('*'))if(!el.closest(SPARKLING_EXCLUDE))for(const attr of SPARKLING_ATTRS)if(el.hasAttribute(attr))el.setAttribute(attr,tr(el.getAttribute(attr)));
 doc.title=tr(doc.title);
 for(const meta of doc.querySelectorAll('meta')){const key=meta.name||meta.getAttribute('property')||'';if(/(?:description|title|image:alt)$/.test(key))meta.content=tr(meta.content);if(key==='og:url')meta.content=`${origin}/${file}`;if(key==='og:locale')meta.content=editions[lang].og;}
 doc.querySelector('link[rel=canonical]').href=`${origin}/${file}`;
 for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){
  const walk=value=>{if(Array.isArray(value))return value.map(walk);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='inLanguage'?lang:walk(item)]));return typeof value==='string'?tr(value.replace(`${origin}/en/${SPARKLING_ROUTE}`,`${origin}/${file}`)):value;};
  script.textContent='\n'+JSON.stringify(walk(JSON.parse(script.textContent)),null,2)+'\n';
 }
 for(const a of doc.querySelectorAll('a[href]')){
  if(a.closest(SPARKLING_EXCLUDE))continue;const href=a.getAttribute('href');if(!href||/^(?:https?:|\/\/|mailto:|tel:|#)/.test(href))continue;
  const url=new URL(href,doc.baseURI);if(url.origin!==origin)continue;
  const route=url.pathname.slice(1).replace(/^en\//,'').replace(/^live\/$/,'live/index.html').replace(/^$/,'index.html');
  a.setAttribute('href','../'+(supported(route).includes(lang)?lang:'en')+'/'+(route==='index.html'?'':route)+url.search+url.hash);
 }
 for(const host of doc.querySelectorAll('.lang-switch')){
  const menu=doc.createElement('details');menu.className='guide-lang-menu utility-lang-menu';const summary=doc.createElement('summary');summary.textContent=editions[lang].label;summary.setAttribute('aria-label',editions[lang].prompt);const options=doc.createElement('div');options.className='guide-lang-options';
  for(const [edition,label] of supported(SPARKLING_ROUTE).map(edition => [edition, editions[edition].label])){const a=doc.createElement('a');a.textContent=label;a.lang=edition;a.href='../'+(edition==='ja'?'':edition+'/')+SPARKLING_ROUTE+(edition==='ja'?'?lang=ja':'');if(edition===lang)a.setAttribute('aria-current','page');options.append(a);}menu.append(summary,options);host.replaceWith(menu);
 }
 for(const script of doc.querySelectorAll('script:not([src]):not([type])'))script.textContent=script.textContent.replace('localStorage.setItem("mado-lang", "en")',`localStorage.setItem("mado-lang", "${lang}")`);
 const payload={lang,translations:dictionary};write(`${lang}/sparkling-data.js`,'/* Generated from English Disney content. */\nwindow.MADO_SPARKLING_PAYLOAD='+JSON.stringify(payload)+';\n');
 const scripts=[`${lang}/utility-data.js`,'utility-locale-runtime.js',`${lang}/sparkling-data.js`,'sparkling-locale-runtime.js'].map(file=>{const script=doc.createElement('script');script.src='../'+file+'?v='+assetVersion(file);return script;});
 // Hash after writing the current payload.
 scripts[2].src='../'+`${lang}/sparkling-data.js`+'?v='+assetVersion(`${lang}/sparkling-data.js`);
 doc.querySelector('script[src*="data-runtime.js"]').after(...scripts);
 for(const el of doc.querySelectorAll('script[src],link[rel=stylesheet]')){const attr=el.tagName==='SCRIPT'?'src':'href',value=el.getAttribute(attr);if(/^(?:https?:|\/\/)/.test(value)||!/\.(?:js|css)\?v=/.test(value))continue;const asset=new URL(value,doc.baseURI).pathname.slice(1);el.setAttribute(attr,value.replace(/\?v=[^&#]+/,`?v=${assetVersion(asset)}`));}
 write(file,withSparklingLocales(dom.serialize(),file));dom.window.close();
}
console.log(`Disney locales: ${SPARKLING_LOCALES.length} translated calculators with preserved media attribution.`);
