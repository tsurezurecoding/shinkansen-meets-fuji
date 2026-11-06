import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {readSiteSource,finalizeSiteChrome} from './shared/site-chrome.mjs';
import {assetVersion} from './shared/asset-version.mjs';
import {ANALYTICS} from './shared/feature-page.mjs';
import {enhanceContentHead} from './shared/content-metadata.mjs';
import {withUtilityLocales} from './shared/utility-locales.mjs';
import {supported,editions,stripEdition,withLocaleRegistry} from './shared/locales.mjs';
import {STORY_SLUGS,STORY_ROUTES,STORY_LANGUAGES,STORY_MEDIA,storyFile,storyAsset,storyCopy,localizedStoryRoute,escapeHTML as e,withStoryWindowLinks} from './shared/story-window.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.michikusa-travel.com/';
const check=process.argv.includes('--check');
const requested=process.argv.includes('--lang')?process.argv[process.argv.indexOf('--lang')+1]:null;
if(requested&&!STORY_LANGUAGES.includes(requested))throw Error('Unknown story language '+requested);
const langs=requested?[requested]:STORY_LANGUAGES;
let changed=0;
function write(file,text){const dest=path.join(root,file);if(fs.existsSync(dest)&&fs.readFileSync(dest,'utf8')===text)return;if(check)throw Error('Story output stale: '+file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text);changed++;}
const names={ja:'日本語',en:'English','zh-Hant':'繁體中文',fr:'Français',de:'Deutsch',es:'Español','zh-Hans':'简体中文',ko:'한국어',it:'Italiano',th:'ไทย'};
const text=value=>e(value).replaceAll('\n','<br>');
const fill=(value,name)=>e(value.replaceAll('{name}',name));
function title(value,lang){if(lang!=='ja')return e(value).replace(/(?:搖曳露營|摇曳露营)△|โทริยามะ/g,word=>`<span class="story-work-title">${word}</span>`);const chunks={'鳥山明が暮らした清須':['鳥山明が','暮らした清須'],'世界の冒険を描いた日常':['世界の冒険を','描いた日常'],'ゆるキャン△と浜名湖':['ゆるキャン△と','浜名湖'],'車窓からつながる物語':['車窓から','つながる物語']};return value.split('|').map(line=>`<span class="title-line">${(chunks[line]||[line]).map(s=>`<span class="copy-chunk">${e(s)}</span>`).join('')}</span>`).join('');}
function chrome(lang,route,prefix){
  const sourceFile=(lang==='ja'?'':lang+'/')+'zukan.html';
  const dom=new JSDOM(readSiteSource(root,sourceFile),{url:origin+sourceFile}),doc=dom.window.document;
  const header=doc.querySelector('header.topbar'),footer=doc.querySelector('footer.footer');
  if(!header||!footer)throw Error('Missing established chrome for '+lang);
  const oldMenu=header.querySelector('.lang-switch,.guide-lang-menu');
  const menuLabel=oldMenu?.querySelector('summary')?.getAttribute('aria-label')||(lang==='ja'?'言語を選ぶ':'Choose language');
  oldMenu?.remove();
  for(const el of [header,footer])for(const a of el.querySelectorAll('a[href]')){const url=new URL(a.getAttribute('href'),doc.baseURI);if(url.origin===new URL(origin).origin)a.setAttribute('href',prefix+url.pathname.slice(1)+url.search+url.hash);a.removeAttribute('aria-current');}
  header.insertAdjacentHTML('beforeend',`<details class="guide-lang-menu utility-lang-menu"><summary aria-label="${e(menuLabel)}">${names[lang]}</summary><div class="guide-lang-options">${STORY_LANGUAGES.filter(l=>supported(route).includes(l)).map(l=>`<a lang="${l}" hreflang="${l}" href="${prefix}${localizedStoryRoute(route,l)}${l==='ja'?'?lang=ja':''}"${l===lang?' aria-current="page"':''}>${names[l]}</a>`).join('')}</div></details>`);
  const value={header:header.outerHTML,footer:footer.outerHTML};dom.window.close();return value;
}
function mapMarkup(copy,prefix){
 const points=[[487.9233,682.1618,517.9233,617.1618],[474.774,197.5795,506.774,127.5795],[540.2701,330.8844,574.2701,335.8844]];
 const label=(value,x,y,width,size,weight='normal')=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}"${value.length>width/size*1.85?` textLength="${width}" lengthAdjust="spacingAndGlyphs"`:''}>${e(value)}</text>`;
 return `<svg class="story-map-visual" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1113 822" role="img" aria-label="${e(copy.map.title)}"><image href="${prefix}images/story-window/yuru-map-base.png" width="1113" height="822"/><g font-family="system-ui,sans-serif" fill="#16283a"><rect x="18" y="18" width="780" height="54" rx="9" fill="#fffdf8" fill-opacity=".94"/>${label(copy.map.title,35,54,746,28,'bold')}${points.map(([x,y,bx,by],i)=>`<path d="M${x} ${y} L${bx} ${by+30}" stroke="#933d22" stroke-width="3"/><rect x="${bx}" y="${by}" width="410" height="72" rx="9" fill="#fffdf8" fill-opacity=".96" stroke="#b5775c" stroke-width="1.5"/>${label(copy.map.stops[i].name,bx+15,by+29,380,22,'bold')}${label(copy.map.stops[i].detail,bx+15,by+55,380,16)}<circle cx="${x}" cy="${y}" r="28" fill="#a83c20" stroke="#fff" stroke-width="4"/><text x="${x}" y="${y+12}" text-anchor="middle" font-size="38" fill="#fff" font-weight="bold">${i+1}</text>`).join('')}<rect x="18" y="770" width="1077" height="36" rx="5" fill="#fffdf8" fill-opacity=".95"/>${label(copy.map.footer+' · © OpenStreetMap contributors',30,794,1050,16)}</g></svg>`;
}
function bodyHTML(lang,slug,copy,prefix){
 const src=fs.readFileSync(path.join(root,'data/story-window',lang,slug+'.html'),'utf8');
 const match=src.match(/<article class="spot-page-article">([\s\S]*?)<\/article>/);if(!match)throw Error('Missing article '+lang+'/'+slug);
 let body=match[1].replace(/<details class="chapter-menu">[\s\S]*?<\/details>/g,'');
 if(lang!=='ja'&&/copy-chunk/.test(body))throw Error('Japanese wrapping in '+lang+'/'+slug);
 const dom=new JSDOM('<body>'+body+'</body>',{url:origin+storyFile(lang,slug)}),doc=dom.window.document;
 for(const el of doc.querySelectorAll('[src],[href]'))for(const attr of ['src','href']){let value=el.getAttribute(attr);if(!value||value.startsWith('#'))continue;if(/^assets\//.test(value)){el.setAttribute(attr,prefix+storyAsset(value.slice(7)));continue;}if(!/^https?:\/\/(?:www\.)?michikusa-travel\.com\//.test(value))continue;const url=new URL(value);const route=stripEdition(url.pathname.slice(1)),available=supported(route),targetLang=available.includes(lang)?lang:available.includes('en')?'en':available[0],target=localizedStoryRoute(route+url.search+url.hash,lang);if(fs.existsSync(path.join(root,target.split(/[?#]/)[0]))){el.setAttribute(attr,prefix+target);if(targetLang!==lang){el.setAttribute('hreflang',targetLang);if(!/\((?:English|Japanese|EN|JA)\)/.test(el.textContent))el.append(targetLang==='en'?' (English)':targetLang==='ja'?' (Japanese)':` (${targetLang})`);}}}
 if(slug==='yurucamp'){const link=doc.querySelector('.article-map-static a');if(!link)throw Error('Map missing');link.setAttribute('data-story-map','');link.setAttribute('href',prefix+'images/story-window/yuru-map-base.png');link.innerHTML=mapMarkup(copy,prefix);}
 const chapters=[...doc.querySelectorAll('section')].filter(s=>s.querySelector('h2')).map(s=>{if(!s.id)throw Error('Chapter ID missing');return {id:s.id,title:s.querySelector('h2').textContent.trim()};});
 body=doc.body.innerHTML;dom.window.close();return {body,chapters};
}
for(const lang of langs){
 const copy=storyCopy(root,lang);for(const slug of STORY_SLUGS)if(!copy.stories[slug])throw Error('Story copy missing '+lang+'/'+slug);
 for(const slug of ['index',...STORY_SLUGS]){
  const file=storyFile(lang,slug),route='stories/'+slug+'.html',prefix='../'.repeat(file.split('/').length-1),s=copy.stories[slug],pageTitle=slug==='index'?copy.series.name:s.title.replaceAll('|',''),description=slug==='index'?copy.series.description:s.deck;
  const {header,footer}=chrome(lang,route,prefix);
  const nav=`<nav class="series-nav" aria-label="${e(copy.ui.seriesNav)}"><a href="index.html"${slug==='index'?' aria-current="page"':''}>${e(copy.ui.allStories)}</a>${STORY_SLUGS.map(id=>`<a href="${id}.html"${id===slug?' aria-current="page"':''}>${e(copy.stories[id].label)}</a>`).join('')}</nav>`;
  let main='';
  if(slug==='index'){
   const cards=STORY_SLUGS.map(id=>{const item=copy.stories[id],media=STORY_MEDIA[id];return `<article class="story-card" id="${id}"><a class="card-image card-image-${id}" href="${id}.html" aria-label="${fill(copy.ui.readStory,item.label)}"><img src="${prefix}${storyAsset(media.image)}" alt="${e(item.alt)}" loading="lazy"></a><div class="card-copy"><p class="card-category">${e(item.relation)}</p><h2><a href="${id}.html">${title(item.title,lang)}</a></h2><p>${e(item.deck)}</p><p class="card-route">${e(item.route)}</p><a class="card-read" href="${id}.html">${fill(copy.ui.readStory,item.label)} <span aria-hidden="true">→</span></a><small class="card-credit">${media.creditUrl?`<a href="${media.creditUrl}">${e(item.credit)}</a>`:e(item.credit)}${media.licenseUrl?` · <a href="${media.licenseUrl}">CC BY-SA 4.0</a>`:''}</small></div></article>`;}).join('');
   main=`<header class="story-hero series-hero"><p class="story-kicker">${e(copy.series.kicker)}</p><h1>${title(copy.series.name,lang)}</h1><p class="story-hook">${e(copy.series.hook)}</p><p class="series-lead">${text(copy.series.lead)}</p></header><div class="series-content"><nav class="journey-order" aria-label="${e(copy.series.routeLabel)}"><span>${e(copy.series.routeLabel)}</span>${['godzilla','yurucamp','dragonball','shogun'].map((id,i)=>(i?'<i aria-hidden="true">→</i>':'')+`<a href="#${id}">${e(copy.stories[id].place)}</a>`).join('')}</nav><div class="story-grid">${cards}</div><section class="series-afterword"><p class="eyebrow">${e(copy.series.afterwordEyebrow)}</p><h2>${e(copy.series.afterwordTitle)}</h2><p>${text(copy.series.afterwordBody)}</p><a class="series-zukan" href="${prefix}${lang==='ja'?'':lang+'/'}zukan.html">${e(copy.series.zukanLink)} →</a></section></div>`;
  }else{
   const {body,chapters}=bodyHTML(lang,slug,copy,prefix),toc=`<ol>${chapters.map(c=>`<li><a href="#${c.id}">${e(c.title)}</a></li>`).join('')}</ol>`;
   const related=`<section class="more-stories" aria-labelledby="more-title"><div class="more-heading"><h2 id="more-title">${e(copy.ui.moreTitle)}</h2><a href="index.html">${e(copy.ui.exploreAll)} →</a></div><div class="more-grid">${STORY_SLUGS.filter(id=>id!==slug).map(id=>{const item=copy.stories[id];return `<a href="${id}.html"><small>${e(item.place)} · ${e(item.relation)}</small><strong>${e(item.label)}</strong><span>${e(item.deck)}</span><b>${fill(copy.ui.readStory,item.label)} →</b></a>`;}).join('')}</div></section>`;
   main=`<header class="story-hero"><p class="story-kicker">${e(s.label)} <span>×</span> ${e(s.place)}</p><h1>${title(s.title,lang)}</h1><p class="story-hook">${e(s.hook)}</p><p class="story-category">${e(s.relation)}</p></header><div class="story-layout"><aside class="story-sidebar"><p class="sidebar-label">${e(copy.ui.placesTitle)}</p><p class="sidebar-place">${e(s.place)}</p><p class="sidebar-relation">${e(s.relation)}</p><nav aria-label="${e(copy.ui.onThisPage)}">${toc}</nav><a class="sidebar-return" href="index.html">← ${e(copy.ui.returnAll)}</a></aside><article class="spot-page-article story-body" aria-label="${fill(copy.ui.articleLabel,s.label)}"><details class="chapter-menu"><summary>${e(copy.ui.onThisPage)}</summary>${toc}</details>${body}</article></div>${related}`;
  }
  const styles=['style.css','chrome.css','article-locales.css','utility-locales.css','story-window-article.css',...(slug==='shogun'?['story-window-shogun.css']:[]),...(slug==='yurucamp'?['story-window-map.css']:[]),'story-window.css',...(lang!=='ja'?['story-window-international.css']:[])];
  const canonical=origin+file,og=origin+'images/og-shinkansen-window.png';
  const ld={'@context':'https://schema.org','@type':slug==='index'?'CollectionPage':'Article',headline:pageTitle,description,inLanguage:lang,url:canonical,mainEntityOfPage:canonical,publisher:{'@type':'Organization',name:'Michikusa',url:origin}};
  let html=`<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(pageTitle)} | ${e(slug==='index'?(lang==='ja'?'新幹線の窓':'Shinkansen Window'):copy.series.name)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${canonical}">${supported(route).map(l=>`<link rel="alternate" hreflang="${l}" href="${origin}${localizedStoryRoute(route,l)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${origin}${localizedStoryRoute(route,'en')}"><meta property="og:type" content="${slug==='index'?'website':'article'}"><meta property="og:locale" content="${editions[lang].og}"><meta property="og:title" content="${e(pageTitle)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${og}"><meta property="og:image:alt" content="${e(copy.series.name)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${prefix}favicon.ico">${styles.map(file=>`<link rel="stylesheet" href="${prefix}${file}?v=${assetVersion(file)}">`).join('')}<script type="application/ld+json">${JSON.stringify(ld).replaceAll('<','\\u003c')}</script>${ANALYTICS.withEmbeddedGuard}</head><body class="spot-page spot-reading-layout ${slug==='index'?'series-page':'story-page story-'+slug}${lang!=='ja'?' story-international':''}"><a class="skip-link" href="#main-content">${e(copy.ui.skip)}</a>${header}<main id="main-content">${nav}${main}</main>${footer}${slug!=='index'?`<dialog id="photo-dialog" aria-label="${e(copy.ui.photoDialog)}"><button type="button" class="close-photo">${e(copy.ui.closePhoto)} ×</button><div class="photo-dialog-content"><img alt=""></div><p></p></dialog><script src="${prefix}story-window.js?v=${assetVersion('story-window.js')}" data-photo-label="${e(copy.ui.photoDialog)}" data-trailer-label="${e(copy.ui.officialTrailer)}"></script>`:''}<script src="${prefix}language-router.js?v=${assetVersion('language-router.js')}"></script></body></html>\n`;
  html=withLocaleRegistry(html,prefix);write(file,enhanceContentHead(html,file,root));
 }
}
// Japanese catalogue has a hand-maintained source template, while the other
// nine editions are generated by their existing language pipelines.
if(langs.includes('ja'))write('zukan.html',withUtilityLocales(withStoryWindowLinks(readSiteSource(root,'zukan.html'),'zukan.html',root),'zukan.html'));
console.log(`Story window: ${langs.length*5} pages; ${changed} outputs changed.`);
