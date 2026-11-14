import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {assetVersion} from './shared/asset-version.mjs';
import {enhanceContentHead} from './shared/content-metadata.mjs';
import {readSiteSource} from './shared/site-chrome.mjs';
import {withLocaleRegistry,languages,editions} from './shared/locales.mjs';
import {ANALYTICS} from './shared/feature-page.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.michikusa-travel.com';
const photos=JSON.parse(fs.readFileSync(path.join(root,'data/omamori-photo-sources.json'),'utf8'));
const check=process.argv.includes('--check');
const requestedLang=process.argv.includes('--lang')?process.argv[process.argv.indexOf('--lang')+1]:null;
if(requestedLang&&!languages.includes(requestedLang))throw Error('Unknown omamori language: '+requestedLang);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceUrls={
  jnto:'https://www.japan.travel/en/sg/guide/family-protection-health-and-more-visit-these-special-temples-an/',
  jinja:'https://www.jinjahoncho.or.jp/omairi/omamori/',
  seimei:'https://www.seimeijinja.jp/ch/omamori/',
  sugiyama:'https://www.sugiyamajinja.or.jp/news/31793',
  pamphlet:'https://www.jinjahoncho.or.jp/en/assets/pdf/pamphlet/jinja_ZH-TW.pdf'
};

for(const lang of requestedLang?[requestedLang]:languages){
  const copy=JSON.parse(fs.readFileSync(path.join(root,`data/omamori/${lang}.json`),'utf8'));
  const prefix=lang==='ja'?'':'../',file=lang==='ja'?'omamori.html':`${lang}/omamori.html`;
  const localized=!['ja','en'].includes(lang);
  const credit=photo=>`${copy.photoCreditLabel}: ${photo.author} · ${photo.license}`;
  const e=escape,heading=value=>lang==='ja'?value.split('|').map(part=>`<span class="copy-chunk">${e(part)}</span>`).join(''):e(value.replaceAll('|',' '));
  const sourceLine=keys=>`<p class="om-source">${keys.map(key=>`<a href="${sourceUrls[key]}" target="_blank" rel="noopener">${e(copy.sourceLabels[key])} ↗</a>`).join(' · ')}</p>`;
  const picture=(id,hero=false)=>{
    const p=photos.find(photo=>photo.id===id),c=copy.photos[id];
    return `<figure class="om-photo" data-photo-id="${p.candidateId}"><button type="button" class="om-photo-button" data-photo="${prefix+p.filename}" data-caption="${e(c.fullCaption+' '+credit(p))}" aria-label="${e(c.openLabel)}"><img src="${prefix+p.filename}" width="${p.width}" height="${p.height}" alt="${e(c.alt)}" ${hero?'fetchpriority="high"':'loading="lazy"'} decoding="async"><span>${e(copy.photoZoom)} ↗</span></button><figcaption>${e(c.caption)} <a href="#credit-${id}" data-credit="${id}">${e(credit(p))}</a></figcaption></figure>`;
  };
  const chapterHead=c=>`<header class="chapter-heading"><p class="eyebrow">${e(c.kicker)}</p><h2 id="${c.id}-title">${heading(c.title)}</h2>${c.intro?`<p>${e(c.intro)}</p>`:''}</header>`;
  const paragraphs=c=>c.paragraphs.map(text=>`<p>${e(text)}</p>`).join('');
  const parts=copy.chapters.map(c=>{
    let body='';
    if(c.id==='about')body=`<div class="om-reading">${paragraphs(c)}${sourceLine(['jnto','jinja'])}</div><div class="om-compare" aria-label="${e(copy.compareLabel)}">${copy.comparisons.map(item=>`<article><p class="om-kanji" lang="ja">${e(item.kanji)}</p><small>${e(item.romaji)}</small><h3>${e(item.title)}</h3><p>${e(item.text)}</p></article>`).join('')}</div>`;
    if(c.id==='receive')body=`<div class="om-receive">${picture('meiji')}<div class="om-receive-body">${paragraphs(c)}<ol class="om-steps">${copy.receiveSteps.map(item=>`<li><h3>${e(item.title)}</h3><p>${e(item.text)}</p></li>`).join('')}</ol><p class="om-note">${e(copy.receiveNote)}</p></div></div>`;
    if(c.id==='choose'){
      const first=copy.words[0];
      body=`<div class="om-reading">${paragraphs(c)}</div><div class="om-word-picker"><p>${e(copy.wordPrompt)}</p><div class="om-word-grid" role="group" aria-label="${e(copy.wordGroupLabel)}">${copy.words.map((word,i)=>`<button type="button" data-omamori-word="${word.id}" data-kanji="${e(word.kanji)}" data-title="${e(word.title)}" data-description="${e(word.text)}" aria-pressed="${i===0}" aria-controls="word-result"><strong lang="ja">${e(word.kanji)}</strong><span>${e(word.reading)}</span></button>`).join('')}</div><div class="om-word-result" id="word-result" role="region" aria-label="${e(copy.wordResultLabel)}" aria-live="polite" aria-atomic="true"><p class="om-word-label" lang="ja">${e(first.kanji)}</p><h3>${e(first.title)}</h3><p class="om-word-description">${e(first.text)}</p></div><noscript><dl>${copy.words.slice(1).map(word=>`<dt lang="ja">${e(word.kanji)}</dt><dd>${e(word.text)}</dd>`).join('')}</dl></noscript></div><p class="om-note om-word-note">${e(copy.wordNote)}</p>`;
    }
    if(c.id==='carry')body=`<div class="om-reading">${paragraphs(c)}<aside class="om-note-card"><h3>${e(copy.carryGift.title)}</h3><p>${e(copy.carryGift.text)}</p></aside>${sourceLine(['pamphlet'])}</div>`;
    if(c.id==='after')body=`<div class="om-reading">${paragraphs(c)}<aside class="om-note-card"><p class="eyebrow">${e(copy.afterHighlight.label)}</p><h3>${heading(copy.afterHighlight.title)}</h3><p>${e(copy.afterHighlight.text)}</p></aside><div class="om-faq">${copy.faqs.map(faq=>`<details><summary>${e(faq.question)}</summary><p>${e(faq.answer)}</p></details>`).join('')}</div>${sourceLine(['jinja','seimei','sugiyama'])}</div>`;
    return `<section id="${c.id}" class="food-section" aria-labelledby="${c.id}-title">${chapterHead(c)}${body}</section>`;
  }).join('\n');
  const related=copy.relatedStories.map(({route,image,label,title,note})=>[route,image,label,title,note]);
  const relatedHTML=`<section class="everyday-related" aria-labelledby="everydayRelatedTitle"><div class="section-head"><div><p class="eyebrow">EVERYDAY JAPAN</p><h2 id="everydayRelatedTitle">${e(copy.relatedTitle)}</h2></div></div><nav class="everyday-related-grid" aria-label="${e(copy.relatedTitle)}">${related.map(([route,img,label,title,note])=>`<a class="everyday-story-card" href="${route}" data-cta-track="everyday_related_click" data-cta-id="omamori_to_${route.split('.')[0]}"><span class="everyday-story-photo"><img src="${prefix}images/${img}" alt="" width="640" height="480" loading="lazy" decoding="async"></span><span class="everyday-story-copy"><small>${e(label)}</small><strong>${e(title)}</strong><span>${e(note)}</span><b>${e(copy.relatedRead)} →</b></span></a>`).join('')}</nav><p class="everyday-related-credits">${e(copy.relatedPhotoLabel)}: Michikusa. Onigiri: <a href="https://commons.wikimedia.org/wiki/File:Onigiri_001.jpg">Ocdp</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>.</p></section>`;
  const footerDom=new JSDOM(readSiteSource(root,lang==='ja'?'castles.html':`${lang}/foods.html`));
  const shellDoc=footerDom.window.document;
  if(localized){
    const oldMenu=shellDoc.querySelector('.article-lang-menu');
    const menu=shellDoc.createElement('div');menu.className='lang-switch';
    menu.innerHTML=languages.map(code=>`<a lang="${code}" href="${prefix}${code==='ja'?'':code+'/'}omamori.html?lang=${code}"${code===lang?' aria-current="page"':''}>${editions[code].label}</a>`).join('');
    oldMenu.replaceWith(menu);
  }
  const shell=Object.fromEntries(['.topbar','.spot-page-rail','.content-rail-section','footer'].map(selector=>[selector,shellDoc.querySelector(selector)?.outerHTML]));
  const footer=shell.footer;footerDom.window.close();
  const alternates=[...languages.map(code=>[code,`${code==='ja'?'':code+'/'}omamori.html`]),['x-default','en/omamori.html']].map(([code,route])=>`<link rel="alternate" hreflang="${code}" href="${origin}/${route}">`).join('\n');
  const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><title>${e(copy.metaTitle)}</title><meta name="description" content="${e(copy.description)}"><link rel="canonical" href="${origin}/${file}">${alternates}<meta property="og:title" content="${e(copy.metaTitle)}"><meta property="og:description" content="${e(copy.description)}"><meta property="og:url" content="${origin}/${file}"><meta property="og:locale" content="${lang==='ja'?'ja_JP':'en_US'}"><meta property="og:image" content="${origin}/${photos[0].filename}"><meta property="og:image:alt" content="${e(copy.photos.various.alt)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${prefix}favicon.ico">${['style.css','castles.css','foods.css','everyday-related.css','omamori.css'].map(asset=>`<link rel="stylesheet" href="${prefix+asset}?v=${assetVersion(asset)}">`).join('')}${lang==='ja'?`<script src="language-router.js?v=${assetVersion('language-router.js')}"></script>`:''}${ANALYTICS.withEmbeddedGuard}`;
  let html=`<!doctype html>\n<html lang="${lang}"><head>${head}</head><body id="top" class="spot-page spot-page-utility foods-page omamori-page" data-spot-page-shared-context="utility" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${prefix || './'}" data-spot-page-shared-route="omamori.html"><a class="skip-link" href="#omamori-content">${e(copy.skipLink)}</a><div data-spot-page-shared-module="topbar"></div><main>
<section class="food-hero" aria-labelledby="omamori-title"><div class="food-hero-inner"><div class="food-hero-copy"><p class="eyebrow">${e(copy.eyebrow)}</p><h1 id="omamori-title">${heading(copy.title)}</h1><p class="hero-lead"><strong>${e(copy.definition)}</strong></p><p class="om-hero-story">${e(copy.lead)}</p><a class="btn btn-primary" href="#about">${e(copy.cta)} <span aria-hidden="true">↓</span></a><p class="hero-footnote"><a href="#after">${e(copy.skipAfter)}</a></p></div><div class="food-hero-pictures">${picture('various',true)}</div></div></section>
<div class="spot-page-shell"><aside data-spot-page-shared-module="rail"></aside><article class="spot-page-article food-article" id="omamori-content"><div class="food-intro"><p class="food-hub-back"><a href="${lang==='ja'?'zukan.html':'everyday-japan.html'}">← ${e(copy.hubLabel)}</a></p></div><nav class="food-chapters" aria-label="${e(copy.skipLink)}">${copy.chapters.map((c,i)=>`<a href="#${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${e(c.label)}</a>`).join('')}</nav>${parts}
<section class="om-ending"><p class="eyebrow">${e(copy.ending.kicker)}</p><h2>${heading(copy.ending.title)}</h2><p>${e(copy.ending.text)}</p><a href="#choose">${e(copy.ending.link)} ↑</a></section>
<section id="sources" class="om-sources"><details id="source-details"><summary>${e(copy.sourcesTitle)}</summary><p>${e(copy.sourcesIntro)}</p><ul>${Object.entries(sourceUrls).map(([key,url])=>`<li><a href="${url}" target="_blank" rel="noopener">${e(copy.sourceLabels[key])}</a></li>`).join('')}</ul><h3>${e(copy.photoCredits)}</h3><ul>${photos.map(photo=>`<li id="credit-${photo.id}"><strong>${e(credit(photo))}</strong> · <a href="${photo.sourceUrl}">${e(copy.photoOriginal)}</a> · <a href="${photo.licenseUrl}">${e(photo.license)}</a><p>${e(copy.photos[photo.id].fullCaption)}</p></li>`).join('')}</ul></details></section><p class="back-top"><a href="#top">${e(copy.backTop)} ↑</a></p></article></div>${relatedHTML}<section data-spot-page-shared-module="content-rail"></section></main>${footer}
<dialog class="om-lightbox" aria-label="${e(copy.photoZoom)}" aria-describedby="photo-caption"><button class="om-close" type="button" aria-label="${e(copy.photoClose)}">×</button><img alt=""><p id="photo-caption"></p></dialog>
<script src="${prefix}spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script><script src="${prefix}spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script><script src="${prefix}foods.js?v=${assetVersion('foods.js')}"></script><script src="${prefix}omamori.js?v=${assetVersion('omamori.js')}"></script></body></html>\n`;
  html=html.replace(/<meta property="og:locale" content="[^"]*">/,`<meta property="og:locale" content="${editions[lang].og}">`);
  html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}article-locales.css?v=${assetVersion('article-locales.css')}"><script defer src="${prefix}article-locales.js?v=${assetVersion('article-locales.js')}"></script></head>`);
  if(localized){
    html=html.replace('<div data-spot-page-shared-module="topbar"></div>',shell['.topbar']).replace('<aside data-spot-page-shared-module="rail"></aside>',shell['.spot-page-rail']).replace('<section data-spot-page-shared-module="content-rail"></section>',shell['.content-rail-section']);
    html=html.replace('<body ','<body data-article-localized="" ').replace(/<script src="[^\"]*spot-page-shared(?:-data)?\.js[^\"]*"><\/script>/g,'');
  }
  html=enhanceContentHead(withLocaleRegistry(html,prefix),file,root,{lang});
  const target=path.join(root,file);
  if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==html)throw Error('Omamori edition stale: '+file);}
  else fs.writeFileSync(target,html);
}
console.log(`Omamori: ${check?'checked':'generated'} ${requestedLang||languages.join(', ')}.`);
