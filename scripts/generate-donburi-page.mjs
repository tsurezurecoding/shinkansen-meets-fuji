import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {assetVersion} from './shared/asset-version.mjs';
import {enhanceContentHead} from './shared/content-metadata.mjs';
import {readSiteSource} from './shared/site-chrome.mjs';
import {withLocaleRegistry,languages,editions} from './shared/locales.mjs';
import {ANALYTICS} from './shared/feature-page.mjs';
import {donburiRelatedHTML} from './shared/everyday-related.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.michikusa-travel.com';
const check=process.argv.includes('--check');
const selected=process.argv.includes('--lang')?process.argv[process.argv.indexOf('--lang')+1]:null;
if(selected&&!languages.includes(selected))throw Error('Unknown donburi language: '+selected);
const e=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const lang of selected?[selected]:languages){
  const copy=JSON.parse(fs.readFileSync(path.join(root,`data/donburi/${lang}.json`),'utf8'));
  const prefix=lang==='ja'?'':'../',file=lang==='ja'?'donburi.html':`${lang}/donburi.html`;
  const dom=new JSDOM(`<main>${copy.main}</main>`),doc=dom.window.document;
  const main=doc.querySelector('main'),article=main.querySelector('article');
  for(const el of main.querySelectorAll('[src],[data-photo],a[href]')){
    for(const attr of ['src','data-photo'])if(el.hasAttribute(attr))el.setAttribute(attr,el.getAttribute(attr).replace(/^assets\//,prefix+'images/donburi/'));
    if(el.matches('a[href]')){
      const href=el.getAttribute('href');
      if(href.startsWith(origin+'/')){
        const url=new URL(href),route=url.pathname.replace(/^\/(?:en|fr|de|es|it|th|ko|zh-Hant|zh-Hans)\//,'/').slice(1);
        if(route==='foods.html')el.setAttribute('href','foods.html');
      }
    }
  }
  if(lang!=='ja')for(const span of main.querySelectorAll('.copy-chunk'))span.replaceWith(...span.childNodes);
  const hero=main.querySelector('.don-hero');
  const heroAlt=hero.querySelector('img').alt;
  hero.className='food-hero';
  const heroInner=doc.createElement('div');heroInner.className='food-hero-inner';
  heroInner.append(...hero.childNodes);hero.append(heroInner);
  hero.querySelector('.don-hero-copy').classList.add('food-hero-copy');
  hero.querySelector('.don-primary').classList.add('btn','btn-primary');
  const back=doc.createElement('p');back.className='food-hub-back';
  back.innerHTML=`<a href="${lang==='ja'?'en/':''}everyday-japan.html${lang==='ja'?'?lang=en':''}">← ${e(copy.backLabel)}</a>`;
  hero.querySelector('.food-hero-copy').prepend(back);
  hero.remove();
  article.classList.add('spot-page-article','food-article','don-article');article.id='donburi-content';
  const toc=article.querySelector('.don-toc');toc.classList.add('food-chapters');
  for(const section of article.querySelectorAll('.don-section'))section.classList.add('food-section');
  for(const heading of article.querySelectorAll('.don-section-heading'))heading.classList.add('chapter-heading');
  const market=doc.createElement('aside');market.className='don-aside don-market';market.id='familiar-name';
  if(copy.marketNote.html){market.innerHTML=`<h3>${e(copy.marketNote.title)}</h3>${copy.marketNote.html}`;article.querySelector('.don-signs').after(market);}
  article.querySelector('.don-related')?.remove();
  const relatedHTML=donburiRelatedHTML(lang);
  const bodyMain=article.outerHTML;dom.window.close();

  const shellFile=lang==='ja'?'castles.html':`${lang}/foods.html`;
  const shellDom=new JSDOM(readSiteSource(root,shellFile),{url:origin+'/'+shellFile,runScripts:'outside-only'});
  const shell=shellDom.window.document;
  if(!shell.querySelector('.topbar')){
    shellDom.window.eval(fs.readFileSync(path.join(root,'spot-page-shared-data.js'),'utf8'));
    shellDom.window.eval(fs.readFileSync(path.join(root,'spot-page-shared.js'),'utf8'));
  }
  const menu=shell.createElement('div');menu.className='lang-switch';
  menu.innerHTML=languages.map(code=>`<a lang="${code}" href="${prefix}${code==='ja'?'':code+'/'}donburi.html?lang=${code}"${code===lang?' aria-current="page"':''}>${editions[code].label}</a>`).join('');
  const oldMenu=shell.querySelector('.article-lang-menu,.lang-switch,.guide-lang-menu');
  if(oldMenu)oldMenu.replaceWith(menu);else shell.querySelector('.topbar').append(menu);
  const parts=Object.fromEntries(['.topbar','.spot-page-rail','.content-rail-section','footer'].map(selector=>[selector,shell.querySelector(selector)?.outerHTML||'']));
  shellDom.window.close();
  const alternates=[...languages.map(code=>[code,`${code==='ja'?'':code+'/'}donburi.html`]),['x-default','en/donburi.html']].map(([code,route])=>`<link rel="alternate" hreflang="${code}" href="${origin}/${route}">`).join('\n');
  const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="${lang==='ja'?'noindex,follow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"><title>${e(copy.metaTitle)}</title><meta name="description" content="${e(copy.description)}"><link rel="canonical" href="${origin}/${file}">${alternates}<meta property="og:title" content="${e(copy.metaTitle)}"><meta property="og:description" content="${e(copy.description)}"><meta property="og:url" content="${origin}/${file}"><meta property="og:locale" content="${editions[lang].og}"><meta property="og:image" content="${origin}/images/donburi/gyudon-basic.webp"><meta property="og:image:alt" content="${e(heroAlt)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${prefix}favicon.ico">${['style.css','castles.css','foods.css','everyday-related.css','donburi.css','article-locales.css'].map(asset=>`<link rel="stylesheet" href="${prefix+asset}?v=${assetVersion(asset)}">`).join('')}${lang==='ja'?`<script src="language-router.js?v=${assetVersion('language-router.js')}"></script>`:''}${ANALYTICS.withEmbeddedGuard}`;
  let html=`<!doctype html>\n<html lang="${lang}"><head>${head}</head><body id="top" class="spot-page spot-page-utility foods-page don-page don-product${lang==='ja'?'':' don-en'}" data-article-localized="" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${prefix||'./'}" data-spot-page-shared-route="donburi.html"><a class="skip-link" href="#donburi-content">${e(copy.skipLink)}</a>${parts['.topbar']}<main>${hero.outerHTML}<div class="spot-page-shell">${parts['.spot-page-rail']}${bodyMain}</div>${relatedHTML}${parts['.content-rail-section']}</main>${parts.footer}<dialog class="don-lightbox" aria-labelledby="don-photo-caption"><button class="don-close" type="button" aria-label="${e(copy.closePhoto)}">×</button><img alt=""><p id="don-photo-caption"></p></dialog><script defer src="${prefix}article-locales.js?v=${assetVersion('article-locales.js')}"></script><script src="${prefix}donburi.js?v=${assetVersion('donburi.js')}"></script></body></html>\n`;
  html=enhanceContentHead(withLocaleRegistry(html,prefix),file,root,{lang}).replace(/^[\t ]+$/gm,'');
  const target=path.join(root,file);
  if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==html)throw Error('Donburi edition stale: '+file);}
  else fs.writeFileSync(target,html);
}
console.log(`Donburi: ${check?'checked':'generated'} ${selected||languages.join(', ')}.`);
