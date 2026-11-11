import {JSDOM} from 'jsdom';
import {STORY_SLUGS, storyAsset, localizedStoryRoute, escapeHTML as e} from './story-window.mjs';
import {supported, stripEdition} from './locales.mjs';

// Data fragments retain their original images and full-size links. Resolve them
// once for both article bodies and cards at the page's actual language depth.
export function resolveStoryMarkup(markup,lang,prefix) {
  const dom=new JSDOM('<body>'+markup+'</body>');const doc=dom.window.document;
  const reference=value=>{
    if(value.startsWith('assets/')){const relative=value.slice(7);return prefix+(relative.startsWith('images/')?relative:storyAsset(relative));}
    if(!/^https?:\/\/(?:www\.)?michikusa-travel\.com\//.test(value))return value;
    const url=new URL(value),route=stripEdition(url.pathname.slice(1));
    if(route.startsWith('images/'))return prefix+route;
    return prefix+(supported(route).length?localizedStoryRoute(route+url.search+url.hash,lang):route+url.search+url.hash);
  };
  for(const node of doc.querySelectorAll('[src],[href],[srcset]'))for(const attr of ['src','href','srcset']){
    const value=node.getAttribute(attr);if(!value||value.startsWith('#'))continue;
    node.setAttribute(attr,attr==='srcset'?value.split(',').map(part=>{const [src,size]=part.trim().split(/\s+/);return reference(src)+' '+size;}).join(', '):reference(value));
    if(attr==='href'&&node.tagName==='A'&&/^https?:\/\/(?:www\.)?michikusa-travel\.com\//.test(value)){
      const route=stripEdition(new URL(value).pathname.slice(1));if(route.startsWith('images/'))continue;
      const available=supported(route),target=available.includes(lang)?lang:available.includes('en')?'en':available[0]||'ja';
      if(target!==lang){node.setAttribute('hreflang',target);if(!/\((?:English|Japanese|EN|JA)\)/.test(node.textContent))node.append(target==='en'?' (English)':target==='ja'?' (Japanese)':` (${target})`);}
    }
  }
  const html=doc.body.innerHTML;dom.window.close();return html;
}

const thumb={godzilla:'display/hibiya-square-20250912-160.webp',shogun:'display/20261103_sekigahara-landscape_michikusa_45599-160.webp',yurucamp:'display/yuru-benten-sunset-aimaimyi-160.webp',dragonball:'db-title-logo.svg',shinkalion:'display/20260712_n700a_michikusa-160.webp'};
export function editorialPicker(copy,slug,prefix){
  return `<nav class="story-picker feature-shell" aria-label="${e(copy.ui.seriesNav)}"><div class="picker-heading"><p>${e(copy.series.name)}</p><a href="index.html">${e(copy.ui.allStories)} →</a></div><ol class="picker-list">${STORY_SLUGS.map(id=>`<li><a href="${id}.html"${id===slug?' aria-current="page"':''}><img class="picker-thumb${id==='dragonball'?' picker-thumb-logo':''}" src="${prefix}${storyAsset(thumb[id])}" width="40" height="38" alt="" decoding="async"><span><strong class="picker-name">${e(copy.stories[id].label)}</strong><small class="picker-place">${e(copy.stories[id].place)}</small></span></a></li>`).join('')}</ol><p class="picker-hint">${e(copy.ui.swipeHint)} →</p></nav>`;
}
export function editorialContents(copy,chapters){return `<nav class="feature-contents feature-shell contents-simple" aria-label="${e(copy.ui.onThisPage)}"><div class="contents-group"><p>${e(copy.ui.onThisPage)}</p><ol>${chapters.map((chapter,i)=>`<li><a href="#${chapter.id}"><span aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${e(chapter.title)}</a></li>`).join('')}</ol></div></nav>`;}
export function editorialRelated(copy,slug,lang,prefix){
  return `<section class="more-stories photo-stories" aria-labelledby="more-title"><div class="more-heading"><h2 id="more-title">${e(copy.ui.moreTitle)}</h2><a href="index.html">${e(copy.ui.exploreAll)} →</a></div><ul class="more-grid">${STORY_SLUGS.filter(id=>id!==slug).map(id=>resolveStoryMarkup(copy.stories[id].cardMarkup,lang,prefix)).join('')}</ul></section>`;
}
