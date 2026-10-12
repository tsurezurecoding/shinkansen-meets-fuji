import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { MIERU_CONTENT } from './shared/mieru-content.mjs';
import { MIERU_COPY } from './shared/mieru-copy.mjs';
import { assetVersion } from './shared/asset-version.mjs';
import { withUtilityLocales } from './shared/utility-locales.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const check=process.argv.includes('--check');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function write(file,text){const dest=path.join(root,file),old=fs.existsSync(dest)?fs.readFileSync(dest,'utf8'):'';if(old===text)return;if(check)throw Error('Stale forecast output: '+file);fs.writeFileSync(dest,text);}
function dimensions(file){const b=fs.readFileSync(path.join(root,file));for(let i=2;i<b.length;){if(b[i++]!==255)continue;let type=b[i++];while(type===255)type=b[i++];if(type===0xd8||type===0xd9)continue;const n=b.readUInt16BE(i);if([0xc0,0xc1,0xc2].includes(type))return {width:b.readUInt16BE(i+5),height:b.readUInt16BE(i+3)};i+=n;}throw Error('JPEG dimensions missing: '+file);}
const runtime='/* Generated from scripts/shared/mieru-runtime.js and mieru-copy.mjs. */\nvar MADO_MIERU_COPY='+JSON.stringify(MIERU_COPY)+';\n'+fs.readFileSync(path.join(root,'scripts/shared/mieru-runtime.js'),'utf8').replace('__TIMETABLE_VERSION__',assetVersion('data/timetable.js'));
write('mieru.js',runtime);
for(const lang of ['ja','en']){
 const file=(lang==='ja'?'':'en/')+'mieru.html',prefix=lang==='ja'?'':'../',copy=MIERU_CONTENT[lang];
 const facts=copy.facts.map((fact,i)=>{const photo=MIERU_CONTENT.photos[i],size=dimensions(photo.src),href='spots/'+(photo.id==='hamanako-fuji'?'hamanako.html#hamanako-fuji':photo.id+'.html');return `<article class="mieru-fact" data-viewpoint="${photo.id}">
  <figure class="mieru-fact-photo"><a href="${href}" aria-label="${esc(copy.more+': '+fact.title)}"><img src="${prefix+photo.src}" alt="${esc(photo.alt[lang])}" width="${size.width}" height="${size.height}" loading="lazy" decoding="async"></a>${photo.credit?`<figcaption class="show-credit"><a href="${esc(photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(photo.credit)}</a></figcaption>`:''}</figure>
  <div class="mieru-fact-copy"><h3>${esc(fact.title)} <span>${esc(fact.area)}</span></h3>
  <p class="mieru-fact-meta">${esc(fact.meta)}</p><p class="mieru-fact-body">${esc(fact.body)}</p>
  <a class="mieru-fact-more" href="${href}">${esc(copy.more)} →</a></div>
</article>`;}).join('\n');
 let html=fs.readFileSync(path.join(root,'scripts/templates/mieru-'+lang+'.html.tpl'),'utf8');
 for(const [key,value]of Object.entries({CSS:`<link rel="stylesheet" href="${prefix}mieru.css?v=${assetVersion('mieru.css')}">`,RUNTIME:`<script src="${prefix}mieru.js?v=${assetVersion('mieru.js')}"></script>`,ANSWER:`<section class="mieru-answer">${copy.answer}</section>`,FACTS:`<section class="mieru-factset"><h2>${esc(copy.heading)}</h2><p>${esc(copy.intro)}</p><div class="mieru-factlist">${facts}</div></section>`})){
  const marker=`<!--MIERU:${key}-->`;if(!html.includes(marker))throw Error('Forecast template marker missing: '+marker);html=html.replace(marker,value);
 }
 const dom=new JSDOM(html,{url:'https://www.michikusa-travel.com/'+file});
 for(const el of dom.window.document.querySelectorAll('script[src],link[rel="stylesheet"]')){const attr=el.tagName==='SCRIPT'?'src':'href',value=el.getAttribute(attr);if(/^(https?:|\/\/)/.test(value))continue;const asset=new URL(value,dom.window.document.URL).pathname.slice(1);el.setAttribute(attr,value.split('?')[0]+'?v='+assetVersion(asset));}
 write(file,withUtilityLocales(dom.serialize(),file));
}
console.log('Forecast: Japanese/English sources, five photo explanations and one shared calculation runtime.');
