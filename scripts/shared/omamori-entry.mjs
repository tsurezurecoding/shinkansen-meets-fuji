import fs from 'node:fs';
const copies=new Map();
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function copy(lang){
  if(lang==='ja')throw Error('Japanese omamori is reached through the language menu, not a series entry.');
  if(!copies.has(lang))copies.set(lang,JSON.parse(fs.readFileSync(new URL(`../../data/omamori/${lang}.json`,import.meta.url),'utf8')));
  return copies.get(lang);
}
export function omamoriStoryCard(lang='en',root='../'){
  const c=copy(lang).entry,e=escape;
  return `<a class="everyday-story-card" href="omamori.html" data-edition-only="${lang}" data-cta-track="everyday_related_click" data-cta-id="omamori"><span class="everyday-story-photo"><img src="${root}images/omamori/omamori-various.jpg" alt="" width="640" height="480" loading="lazy" decoding="async"></span><span class="everyday-story-copy"><small>${e(c.label)}</small><strong>${e(c.title)}</strong><span>${e(c.note)}</span><b>${e(c.read)} <span aria-hidden="true">→</span></b></span></a>`;
}
export function omamoriPhotoCredit(lang='en'){
  const c=copy(lang).entry,e=escape;
  return `<p class="everyday-related-credits" data-edition-only="${lang}">${e(c.creditLabel)}: <a href="https://commons.wikimedia.org/wiki/File:Variousomamori.jpg">Leongboy1</a> · Public domain. ${e(c.creditNote)}</p>`;
}
export function omamoriEverydaySection(lang='en'){
  const d=copy(lang),c=d.entry,e=escape;
  return `<section class="everyday-section" id="small-wishes" aria-labelledby="small-wishes-title" data-edition-only="${lang}"><p class="eyebrow">${e(c.sectionKicker)}</p><h2 id="small-wishes-title">${e(c.sectionTitle)}</h2><p class="everyday-section-lead">${e(c.sectionLead)}</p><div class="everyday-grid country-grid"><a class="journey-intent-card journey-intent-cloudy everyday-card" href="omamori.html" data-article="omamori"><img src="../images/omamori/omamori-various.jpg" alt="${e(d.photos.various.alt)}" width="960" height="640" loading="lazy" decoding="async"><span class="journey-intent-copy"><small>${e(c.label)}</small><strong>${e(c.title)}</strong><span>${e(c.note)}</span><b class="everyday-read">${e(c.read)} <span aria-hidden="true">→</span></b></span></a></div>${omamoriPhotoCredit(lang)}</section>`;
}
