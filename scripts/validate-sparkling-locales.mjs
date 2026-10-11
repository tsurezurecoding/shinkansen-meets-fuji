import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';
import { collectSparklingEnglish, sparklingSnapshot, SPARKLING_ROUTE, SPARKLING_LOCALES, SPARKLING_ATTRS, SPARKLING_EXCLUDE } from './shared/sparkling-localization.mjs';
import { textNodes } from './shared/castle-localization.mjs';
import { UTILITY_ROUTES } from './shared/utility-locales.mjs';
import { CASTLE_LOCALE_ROUTES } from './shared/castle-locales.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),origin='https://www.michikusa-travel.com';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const errors=[],assert=(ok,label,detail)=>{if(!ok)errors.push(`${label}: ${detail}`);},normal=value=>String(value).replace(/\s+/g,' ').trim();
const compare=(a,b,label,detail)=>assert(JSON.stringify(a)===JSON.stringify(b),label,detail);
const tokens=text=>(String(text).match(/\{\d+\}/g)||[]).sort().join('|');
const dataScript=()=>read('data-runtime.js')+'\nObject.assign(window,{SPOTS,ROUTE,BOARD_COLLECTION,WHEEL_COLLECTION});';
const keys=collectSparklingEnglish(root),editions=['ja','en',...SPARKLING_LOCALES],known=[SPARKLING_ROUTE,...UTILITY_ROUTES,...CASTLE_LOCALE_ROUTES,'guide.html'];
const counts={pages:0,calculations:0,renderStates:0,media:0};
const missing=[...SPARKLING_LOCALES.flatMap(lang=>[`${lang}/${SPARKLING_ROUTE}`,`${lang}/sparkling-data.js`,`scripts/locales/sparkling-${lang}.json`]),'sparkling-locale-runtime.js'].filter(file=>!fs.existsSync(path.join(root,file)));
if(missing.length){console.error('Disney locales: missing outputs: '+missing.join(', '));process.exit(1);}
function domFor(lang){const file=(lang==='ja'?'':lang+'/')+SPARKLING_ROUTE;const console=new VirtualConsole();console.on('jsdomError',error=>errors.push(`${file}: runtime ${error.message}`));return new JSDOM(read(file),{url:`${origin}/${file}`,runScripts:'outside-only',virtualConsole:console});}
function calculator(source){const context={};context.window=context;vm.createContext(context);vm.runInContext(read('data/timetable.js'),context);vm.runInContext(dataScript(),context);vm.runInContext(read('train-select.js'),context);vm.runInContext(source,context);return context.SPARKLING_DREAMS_CALCULATOR;}
const baseline=calculator(execFileSync('git',['show','HEAD:sparkling-dreams.js'],{cwd:root,encoding:'utf8'}));
const current=calculator(read('sparkling-dreams.js'));
const representativeDates=[...Object.entries(current.DATE_PATTERNS).filter(([,pattern])=>pattern).reduce((map,[date,pattern])=>map.has(pattern)?map:map.set(pattern,date),new Map()).values(),'2026-12-01','2026-06-01','2027-03-16','invalid'];
const samples=[{type:'Nozomi',number:1,direction:'west'},{type:'Hikari',number:636,direction:'east'},{type:'Kodama',number:815,direction:'west'},{type:'Nozomi',number:328,direction:'east'}];
const renderedResults=new Map();
for(const date of representativeDates)for(const service of samples){const args=[date,service.direction,current.serviceKey(service)];const actual=current.calculate(...args),expected=baseline.calculate(...args);compare(actual,expected,'calculator',`English baseline differs ${args.join('/')}`);renderedResults.set(actual.status,actual);counts.calculations++;}
// Include both crossing directions and every render state from actual timetable results.
for(const date of representativeDates.filter(value=>/^2026-(10|11)/.test(value)))for(const service of samples){const result=current.calculate(date,service.direction,current.serviceKey(service));renderedResults.set(result.status,result);}
for(const status of ['self-match','encounter','no-encounter'])if(!renderedResults.has(status)){
 const date=representativeDates[0];const direction=status==='self-match'?'east':'west';
 const timetableContext={window:{}};vm.runInNewContext(read('data/timetable.js'),timetableContext);
 for(const train of timetableContext.window.SHINKANSEN_TIMETABLE.trains.filter(train=>train.direction===direction)){const result=current.calculate(date,direction,current.serviceKey(train));if(result.status===status){renderedResults.set(status,result);break;}}
}
const source=sparklingSnapshot(root),sourceDoc=source.window.document;
const sources=doc=>[...doc.querySelectorAll('img[src],iframe[src],video[src],source[src]')].map(el=>[el.tagName,new URL(el.getAttribute('src'),doc.baseURI).href,el.tagName==='IFRAME'?el.title:'']);
const credits=doc=>[...doc.querySelectorAll('.sd-post-credit,figcaption,.show-credit,blockquote')].map(el=>[normal(el.textContent),[...el.querySelectorAll('a[href]')].map(a=>a.href)]);
for(const lang of editions){
 const dom=domFor(lang),doc=dom.window.document,label=(lang==='ja'?'':lang+'/')+SPARKLING_ROUTE;
 assert(doc.documentElement.lang===lang,label,'html lang differs');
 assert(doc.querySelector('link[rel=canonical]')?.href===`${origin}/${label}`,label,'canonical differs');
 for(const edition of [...editions,'x-default']){const links=doc.querySelectorAll(`link[rel=alternate][hreflang="${edition}"]`),file=(edition==='ja'?'':(edition==='x-default'?'en':edition)+'/')+SPARKLING_ROUTE;assert(links.length===1&&links[0].href===`${origin}/${file}`,label,`hreflang ${edition} differs`);}
 if(!doc.querySelector('header .lang-switch,header .utility-lang-menu')){dom.window.eval(read('spot-page-shared-data.js'));dom.window.eval(read('spot-page-shared.js'));}
 dom.window.eval(read('utility-locales.js'));doc.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
 const menu=doc.querySelector('details.guide-lang-menu.utility-lang-menu');assert(Boolean(menu)&&menu.querySelectorAll('a').length===4&&!doc.querySelector('.lang-switch'),label,'guide-style four-language dropdown missing');
 for(const a of menu?.querySelectorAll('a')||[])assert(new URL(a.href).pathname===`/${(a.lang==='ja'?'':a.lang+'/')+SPARKLING_ROUTE}`,label,'language dropdown destination differs');
 if(SPARKLING_LOCALES.includes(lang)){
  const dictionary=JSON.parse(read(`scripts/locales/sparkling-${lang}.json`)),tr=value=>dictionary[value.trim()]?value.replace(value.trim(),()=>dictionary[value.trim()]):value;
  const noScriptDom=new JSDOM(read(label));
  const fallback=noScriptDom.window.document.querySelector('noscript p.sd-noscript');
  assert(Boolean(fallback)&&!fallback.textContent.includes('<p'),label,'noscript fallback must be real paragraph markup');
  assert(fallback?.textContent===dictionary['Enable JavaScript to use the calculator. The A/B/C patterns and official links below are still available without it.'],label,'noscript fallback translation differs');
  noScriptDom.window.close();
  for(const key of keys){assert(Boolean(dictionary[key]),label,'missing translation '+key.slice(0,65));assert(tokens(key)===tokens(dictionary[key]),label,'placeholder mismatch '+key.slice(0,65));}
  const texts=document=>textNodes(document).filter(node=>!node.parentElement.closest(SPARKLING_EXCLUDE+',.utility-lang-menu')).map(node=>normal(node.textContent));
  compare(texts(doc),texts(sourceDoc).map(text=>normal(tr(text))),label,'static text differs from translated English source');
  const attributes=document=>[...document.querySelectorAll('*')].filter(el=>!el.closest(SPARKLING_EXCLUDE+',.utility-lang-menu')).flatMap(el=>SPARKLING_ATTRS.filter(attr=>el.hasAttribute(attr)).map(attr=>[el.tagName,attr,el.getAttribute(attr)]));
  compare(attributes(doc),attributes(sourceDoc).map(([tag,attr,value])=>[tag,attr,tr(value)]),label,'translated accessibility/media attributes differ');
  compare(sources(doc),sources(sourceDoc),label,'English PV/media URLs or original video titles changed');
  compare(credits(doc),credits(sourceDoc),label,'embedded post/byline/credit changed');counts.media+=sources(doc).length;
  assert(doc.querySelector('noscript')?.innerHTML.includes(dictionary['Enable JavaScript to use the calculator. The A/B/C patterns and official links below are still available without it.']),label,'noscript fallback untranslated');
  for(const a of doc.querySelectorAll('a[href]')){if(a.closest('blockquote,.utility-lang-menu')||/^(?:#|mailto:|tel:)/.test(a.getAttribute('href')))continue;const url=new URL(a.href);if(url.origin!==origin)continue;const route=url.pathname.slice(1).replace(/^(?:en|fr|zh-Hant)\//,'').replace(/^live\/$/,'live/index.html');assert(url.pathname.startsWith(`/${known.includes(route)?lang:'en'}/`),label,'internal route leaves expected language '+url.pathname);}
  assert(!/\(anglais\)|（英文）|\(English\)/i.test(doc.querySelector('header')?.textContent||''),label,'visible English fallback badge');
  const allowed=new Set(['data/timetable.js','data-runtime.js','train-select.js','train-picker.js','sparkling-dreams.js','utility-locale-runtime.js',`${lang}/utility-data.js`,`${lang}/sparkling-data.js`,'sparkling-locale-runtime.js']);
  for(const script of doc.querySelectorAll('script[src]')){const file=new URL(script.src).pathname.slice(1);if(!allowed.has(file))continue;let code=file==='data-runtime.js'?dataScript():read(file);if(file==='sparkling-dreams.js')code=code.replace('  initEmbedLoading();','  root.__testSparklingRender = renderResult;\n  initEmbedLoading();');dom.window.eval(code);}
  doc.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  assert(doc.querySelector('[data-picker-text=btnFind]')?.textContent===dom.window.MADO_UTILITY_LOCALE.tables.picker.btnFind,label,'picker does not retain language');
  for(const [status,result]of renderedResults){dom.window.__testSparklingRender(result);assert(doc.querySelector('#sdResult h3')?.textContent.trim(),label,'render state missing '+status);assert(!/That date is outside|The pattern for this|Please choose a date|Your selected train|No likely passing|Likely passing estimate/.test(doc.querySelector('#sdResult h3')?.textContent||''),label,'result state is English '+status);counts.renderStates++;}
 }
 for(const el of doc.querySelectorAll('a[href],link[href],script[src],img[src]')){const value=el.getAttribute('href')||el.getAttribute('src');if(!value||/^(?:#|mailto:|tel:|data:)/.test(value))continue;const url=new URL(value,doc.baseURI);if(url.origin!==origin)continue;const file=url.pathname.slice(1)+(url.pathname.endsWith('/')?'index.html':'');assert(fs.existsSync(path.join(root,file)),label,'missing local asset/link '+file);}
 dom.window.close();counts.pages++;
}
source.window.close();
const stale=spawnSync(process.execPath,['scripts/generate-sparkling-locales.mjs','--check'],{cwd:root,encoding:'utf8'});assert(stale.status===0,'generated outputs',(stale.stderr||stale.stdout).trim().slice(0,400));
if(errors.length){console.error(`Disney locales: FAIL (${errors.length})\n${errors.slice(0,40).join('\n')}`);process.exit(1);}
console.log(`Disney locales: PASS (${counts.pages} pages, ${counts.calculations} unchanged calculations, ${counts.renderStates} translated result states, ${counts.media} preserved media assets).`);
