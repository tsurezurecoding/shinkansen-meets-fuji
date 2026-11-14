import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'parse5';
import {languages, routes, stripEdition, canonicalRoute, supported} from './locales.mjs';
import {assetVersion} from './asset-version.mjs';
export const STORY_ROUTES = routes.filter(route=>route.startsWith('stories/'));
export const STORY_SLUGS = STORY_ROUTES.filter(route=>route!=='stories/index.html').map(route=>route.slice('stories/'.length,-'.html'.length));
export const STORY_LANGUAGES = languages;
// Pick the requested edition when present, otherwise English if available,
// then the route's first available edition. Preserve query strings/fragments.
export function localizedStoryRoute(route,lang){
  const value=String(route),match=value.match(/^([^?#]*)([?#][\s\S]*)?$/),clean=canonicalRoute(match?.[1]||value),suffix=match?.[2]||'',available=supported(clean);
  const edition=available.includes(lang)?lang:available.includes('en')?'en':available[0];
  return `${edition==='ja'?'':`${edition}/`}${clean}${suffix}`;
}
export const STORY_MEDIA = {
  godzilla:{image:'shinjuku-street-kakidai.jpg',creditUrl:'https://commons.wikimedia.org/wiki/File:Shinjuku_Toho_Building_from_Godzilla_Street.jpg'},
  shogun:{image:'20261103_sekigahara-landscape_michikusa_45599.jpg'},
  yurucamp:{image:'yuru-benten-sunset-aimaimyi.jpg',creditUrl:'https://commons.wikimedia.org/wiki/File:Bentenjinja_Hamamatsu_-03.jpg'},
  shinkalion:{image:'20260712_n700a_michikusa.jpg'},
  dragonball:{image:'db-bird-studio-2025.jpg',creditUrl:'https://commons.wikimedia.org/wiki/File:BIRD_STUDIO_2025-11_ac.jpg',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'}
};
export const STORY_SPOTS={'kiyosu':'dragonball','sekigahara-battlefield':'shogun','hamanako':'yurucamp','maruko-bridge':'godzilla'};
export const storyFile=(lang,slug='index')=>`${lang==='ja'?'':lang+'/'}stories/${slug}.html`;
export const storyAsset=name=>name.startsWith('20261103_sekigahara-')?`images/${name}`:`images/story-window/${name}`;
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function storyCopy(root,lang){return JSON.parse(fs.readFileSync(path.join(root,'data/story-window',lang,'ui.json'),'utf8'));}
export function storyLanguage(file){return STORY_LANGUAGES.find(lang=>lang!=='ja'&&file.startsWith(lang+'/'))||'ja';}
export function stripStoryWindowLinks(html){return html.replace(/<!-- STORY-WINDOW:START -->[\s\S]*?<!-- STORY-WINDOW:END -->/g,'<!-- STORY_WINDOW_CARD -->');}
// Called after the host page's existing translation pass. Story copy has its own
// reviewed dictionary, so it must not enter the unrelated utility dictionaries.
export function withStoryWindowLinks(html,file,root){
  const route=stripEdition(file),lang=storyLanguage(file),base=html.match(/<base\b[^>]*href="([^"]+)"/)?.[1]||'.',prefix='../'.repeat(new URL(base,'https://www.michikusa-travel.com/'+file).pathname.split('/').filter(Boolean).length);
  const slug=STORY_SPOTS[route.match(/^spots\/(.+)\.html$/)?.[1]];
  if(route!=='zukan.html'&&!slug)return html;
  const source=path.join(root,'data/story-window',lang,'ui.json');
  if(!fs.existsSync(source))return html;
  const copy=storyCopy(root,lang),e=escapeHTML;
  html=stripStoryWindowLinks(html);
  if(route==='zukan.html'){
    const card=`<!-- STORY-WINDOW:START --><a class="journey-intent-card journey-intent-family" href="${prefix}${storyFile(lang)}" data-cta-track="zukan_theme_click" data-cta-id="story_window"><img src="${prefix}${storyAsset('20261103_sekigahara-landscape_michikusa_45599.jpg')}" alt="" loading="lazy" decoding="async"><span class="journey-intent-copy"><small>STORIES</small><strong>${e(copy.zukan.title)}</strong><span>${e(copy.zukan.description)}</span></span></a><!-- STORY-WINDOW:END -->`;
    html=html.replaceAll('<!-- STORY_WINDOW_CARD -->','');
    const document=parse(html,{sourceCodeLocationInfo:true});
    const findGrid=node=>node.attrs?.some(a=>a.name==='class'&&a.value.split(/\s+/).includes('journey-intent-grid'))?node:(node.childNodes||[]).map(findGrid).find(Boolean);
    const offset=findGrid(document)?.sourceCodeLocation?.endTag?.startOffset;
    if(offset===undefined)throw Error(`Story card catalogue grid missing: ${file}`);
    return html.slice(0,offset)+card+html.slice(offset);
  }
  if(!html.includes('story-window-links.css'))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}story-window-links.css?v=${assetVersion('story-window-links.css')}"></head>`);
  const item=copy.stories[slug];
  const card=`<!-- STORY-WINDOW:START --><section class="spot-page-section story-window-connection" aria-label="${e(copy.series.name)}"><p class="eyebrow">${e(copy.series.name)}</p><h2>${e(item.title.replaceAll('|',''))}</h2><p>${e(item.deck)}</p><p><a class="btn btn-ghost" href="${prefix}${storyFile(lang,slug)}" data-cta-track="story_window_spot_click" data-cta-id="${slug}">${e(item.spotLink)} →</a></p></section><!-- STORY-WINDOW:END -->`;
  if(html.includes('<!-- STORY_WINDOW_CARD -->'))return html.replace('<!-- STORY_WINDOW_CARD -->',card);
  if(html.includes('data-spot-page-shared-module="page"'))return html.replace('<div data-spot-page-shared-module="content-rail">',card+'<div data-spot-page-shared-module="content-rail">');
  // Shared-body hosts are mounted by the existing runtime. Keep the new link
  // adjacent to that host so it survives hydration and remains usable without JS.
  return html.replace('</main>',card+'\n</main>');
}
