import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {STORY_LANGUAGES,STORY_SLUGS,STORY_SPOTS,storyFile,storyCopy} from './shared/story-window.mjs';
import {supported} from './shared/locales.mjs';
import {expandDeliveredSiteChromeHTML} from './shared/site-runtime-validation.mjs';
import {planSpotPage,isSpotPagePlanChanged} from './generate-spot-pages.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),origin='https://www.michikusa-travel.com/';
const requested=process.argv.includes('--lang')?process.argv[process.argv.indexOf('--lang')+1]:null;
const langs=requested?[requested]:STORY_LANGUAGES;
const connections=!process.argv.includes('--pages-only');
const zukanOnly=process.argv.includes('--zukan-only');
const errors=[];let pages=0,links=0;
const expect=(ok,message)=>{if(!ok)errors.push(message);};
const shape=value=>typeof value==='object'&&value!==null?Object.fromEntries(Object.entries(value).map(([key,v])=>[key,Array.isArray(v)?v.map(shape):shape(v)])):typeof value;
const reference=shape(storyCopy(root,'en'));
for(const lang of langs){
 const copy=storyCopy(root,lang);
 try{assert.deepEqual(shape(copy),reference);}catch{errors.push(lang+': UI/metadata dictionary keys differ from English contract');}
 for(const key of ['readStory','articleLabel'])expect(copy.ui[key].includes('{name}'),lang+': missing {name} in '+key);
 expect(copy.map.stops.length===3,lang+': map must identify three stops');
 for(const slug of zukanOnly?[]:['index',...STORY_SLUGS]){
  const file=storyFile(lang,slug),raw=fs.readFileSync(path.join(root,file),'utf8');
  const html=expandDeliveredSiteChromeHTML({appDir:root,html:raw,relative:file}),dom=new JSDOM(html,{url:origin+file}),doc=dom.window.document;
  expect(doc.documentElement.lang===lang,file+': html language');
  expect(doc.querySelector('link[rel="canonical"]')?.href===origin+file,file+': canonical');
  expect(doc.querySelectorAll('h1').length===1,file+': one H1');
  if(slug!=='index'){
    expect(doc.title.includes(copy.stories[slug].searchTitle),file+': descriptive search title');
    expect(doc.querySelector('meta[name="description"]')?.content===copy.stories[slug].searchDescription,file+': search description');
  }
  expect(!doc.querySelector('h1')?.textContent.includes('|'),file+': title separator must not appear as reader-facing text');
  expect(!/noindex|draft-label|Local prototype/.test(html),file+': preview-only markup');
  expect(!!doc.querySelector('.topbar')&&!!doc.querySelector('.footer'),file+': shared chrome');
  expect(doc.querySelectorAll('.guide-lang-options a').length===10,file+': ten language links');
  for(const alternate of [...STORY_LANGUAGES,'x-default']){
   const target=storyFile(alternate==='x-default'?'en':alternate,slug);
   expect(doc.querySelector(`link[rel="alternate"][hreflang="${alternate}"]`)?.href===origin+target,file+': hreflang '+alternate);
  }
  const ids=new Set();for(const el of doc.querySelectorAll('[id]')){expect(!ids.has(el.id),file+': duplicate id '+el.id);ids.add(el.id);}
  for(const el of doc.querySelectorAll('a[href],img[src],script[src],link[href],svg image[href]')){
   const value=el.getAttribute(el.hasAttribute('src')?'src':'href');if(!value||/^(?:data:|mailto:|tel:)/.test(value))continue;
   const url=new URL(value,doc.baseURI);if(url.origin!==new URL(origin).origin)continue;
   let target=decodeURI(url.pathname.slice(1));if(!target||target.endsWith('/'))target+='index.html';
   if(!requested||!target.includes('/stories/')&&!target.startsWith('stories/')||target===file)expect(fs.existsSync(path.join(root,target)),file+': missing target '+value);
   if(url.pathname===new URL(origin+file).pathname&&url.hash)expect(ids.has(decodeURIComponent(url.hash.slice(1))),file+': missing anchor '+url.hash);
   links++;
  }
  for(const image of doc.querySelectorAll('img[srcset]'))for(const candidate of image.getAttribute('srcset').split(',')){
    const url=new URL(candidate.trim().split(/\s+/)[0],doc.baseURI);
    if(url.origin===new URL(origin).origin)expect(fs.existsSync(path.join(root,decodeURI(url.pathname.slice(1)))),file+': missing responsive image '+url.pathname);
    expect(+image.getAttribute('width')>0&&+image.getAttribute('height')>0,file+': responsive image reserves dimensions');
  }
  if(slug==='index')expect(doc.querySelectorAll('.story-card').length===STORY_SLUGS.length,file+': article cards must match the story inventory');
  else{
   expect(!!doc.querySelector('.feature-story'),file+': article body');
   for(const section of doc.querySelectorAll('.feature-story section'))if(section.querySelector('h2'))expect(!!section.id,file+': chapter id');
   expect(doc.querySelectorAll('.picker-list a').length===5,file+': five photo navigation links');
   expect(doc.querySelectorAll('.photo-stories .story-card').length===4,file+': four related photo cards');
   if(lang!=='ja')expect(!doc.querySelector('.copy-chunk'),file+': Japanese wrapping marker');
   if(slug==='shinkalion'){
    const frames=[...doc.querySelectorAll('.trailer-player iframe')];
    expect(frames.length===2,file+': two approved official videos');
    for(const id of ['DZn2SFhCsRc','OWXJC2-Ar0Q'])expect(frames.some(frame=>frame.src.startsWith('https://www.youtube-nocookie.com/embed/'+id+'?')&&frame.getAttribute('referrerpolicy')==='strict-origin-when-cross-origin'&&frame.title),file+': approved video/referrer/title '+id);
   }else {
    const expected=slug==='shogun'?['VQfAzBXL1JY']:slug==='godzilla'?['F_1FnUxXk8E']:[];
    const frames=[...doc.querySelectorAll('.trailer-player iframe')];
    expect(frames.length===expected.length,file+': discoverable official videos');
    for(const id of expected)expect(frames.some(frame=>frame.src.startsWith('https://www.youtube-nocookie.com/embed/'+id+'?')&&frame.getAttribute('referrerpolicy')==='strict-origin-when-cross-origin'&&frame.title),file+': approved video/referrer/title '+id);
   }
   if(slug==='yurucamp'){expect(doc.querySelectorAll('.story-map-visual circle').length===3,file+': map markers');expect(doc.querySelector('.story-map-visual').textContent.includes(copy.map.stops[0].name),file+': map label language');}
   if(slug==='godzilla'&&!['ja','en'].includes(lang)){const a=doc.querySelector('a[href*="'+lang+'/spots/maruko-bridge.html"]');expect(!!a,file+': localized bridge connection');}
  }
  pages++;dom.window.close();
 }
 if(connections){
  const prefix=lang==='ja'?'':lang+'/';
  const zukan=fs.readFileSync(path.join(root,prefix+'zukan.html'),'utf8');expect((zukan.match(/data-cta-id="story_window"/g)||[]).length===1,lang+': one field-guide card');
  const cardDOM=new JSDOM(zukan,{url:origin+prefix+'zukan.html'}),card=cardDOM.window.document.querySelector('a.journey-intent-card[data-cta-id="story_window"]');
  expect(card?.href===origin+storyFile(lang),lang+': field-guide card must target its own story edition');
  expect(card?.querySelector('strong')?.textContent.trim()===copy.zukan.title,lang+': field-guide title differs from its story dictionary');
  expect(card?.querySelector('.journey-intent-copy > span')?.textContent.trim()===copy.zukan.description,lang+': field-guide description differs from its story dictionary');
  cardDOM.window.close();
  if(!zukanOnly)for(const [spot,slug] of Object.entries(STORY_SPOTS)){if(!supported('spots/'+spot+'.html').includes(lang))continue;const file=prefix+'spots/'+spot+'.html',html=fs.readFileSync(path.join(root,file),'utf8');expect((html.match(new RegExp('data-cta-id="'+slug+'"','g'))||[]).length===1,file+': one story link');}
 }
}
if(errors.length)throw Error(errors.join('\n'));
if(connections&&!zukanOnly)for(const lang of ['ja','en'])for(const id of Object.keys(STORY_SPOTS))assert(!isSpotPagePlanChanged(planSpotPage(id,lang)),lang+'/spots/'+id+': generated host is stale');
console.log(zukanOnly?`Story window: ${langs.length} field-guide cards have matching localized destinations, titles and descriptions.`:`Story window: ${pages} pages, ${links} local references, language/metadata/map/media contracts${connections?' and host links':''} passed.`);
