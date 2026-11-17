import fs from 'node:fs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ramenStoryCard(lang='en',root='../',hub=false){
  if(lang==='ja')throw Error('Japanese ramen is reached through the language menu.');
  const copy=JSON.parse(fs.readFileSync(new URL(`../../data/ramen/${lang}.json`,import.meta.url),'utf8')).entry,e=escape;
  const image=`<img src="${root}images/ramen/jiro.webp" alt="" width="1440" height="810" loading="lazy" decoding="async">`;
  if(hub)return `<a class="journey-intent-card journey-intent-cloudy everyday-card" href="ramen.html" data-article="ramen" data-edition-only="${lang}">${image}<span class="journey-intent-copy"><small>${e(copy.label)}</small><strong>${e(copy.title)}</strong><span>${e(copy.note)}</span><b class="everyday-read">${e(copy.read)} <span aria-hidden="true">→</span></b></span></a>`;
  return `<a class="everyday-story-card" href="${root}${lang}/ramen.html" data-edition-only="${lang}" data-cta-track="everyday_related_click" data-cta-id="ramen"><span class="everyday-story-photo">${image}</span><span class="everyday-story-copy"><small>${e(copy.label)}</small><strong>${e(copy.title)}</strong><span>${e(copy.note)}</span><b>${e(copy.read)} <span aria-hidden="true">→</span></b></span></a>`;
}
export function addRamenHubCard(html,lang='en'){
  const anchor=/(<a\b[^>]*data-article="donburi"[\s\S]*?<\/a>)/;
  if(!anchor.test(html))throw Error('Missing Everyday Japan donburi card: '+lang);
  return html.replace(anchor,match=>match+ramenStoryCard(lang,'../',true));
}
