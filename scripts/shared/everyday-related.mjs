import path from 'node:path';
import { assetVersion } from './asset-version.mjs';

const stories = [
  { id: 'foods', route: 'foods.html', title: 'Small foods for your journey', note: 'Rice balls, warm buns and sweet stops.', group: 'taste' },
  { id: 'drinks', route: 'drinks.html', title: 'Japanese drinks', note: 'Tea, coffee and a new name on the shelf.', group: 'taste' },
  { id: 'beer', route: 'beer-on-shinkansen.html', title: 'Japanese beer', note: 'Meet the lagers and breweries along the railway.', group: 'taste' },
  { id: 'countryside', route: 'countryside.html', title: 'Japan’s countryside', note: 'Rice fields, tea gardens and the landscape between cities.', group: 'landscape' },
  { id: 'greenhouses', route: 'spots/gamagori-greenhouses.html', title: 'Greenhouses beside the railway', note: 'Look closer at the pale roofs around Gamagori.', group: 'landscape' },
];
const photos = {
  foods: ['foods/onigiri.webp', 'Rice balls wrapped in nori', 'A FIRST BITE', '50% 50%'],
  drinks: ['drinks/20261004-tea-shelf-michikusa.webp', 'Japanese bottled teas on a shop shelf', 'SOMETHING TO SIP', '50% 50%'],
  beer: ['beer/20261004-beer-hero-michikusa.webp', 'Japanese beer cans on a shop shelf', 'MEET THE BREWERS', '50% 35%'],
  countryside: ['20260629_omi_fuji_michikusa.jpg', 'Rice fields below Mount Mikami', 'FROM YOUR WINDOW', '40% 65%'],
  greenhouses: ['20260924_gamagori-greenhouses_19169_michikusa.jpg', 'Greenhouse roofs and a Gamagori mandarin sign', 'LOOK A LITTLE CLOSER', '45% 65%'],
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function everydayRelatedHTML(id, englishRoot = '') {
  const current = stories.find(story => story.id === id);
  if (!current) throw Error('Unknown Everyday Japan story: ' + id);
  const related = stories.filter(story => story.id !== id).sort((a, b) => Number(b.group === current.group) - Number(a.group === current.group));
  const cards = related.map(story => {
    const [src, alt, label, position] = photos[story.id];
    return `<a class="everyday-story-card" href="${englishRoot}${story.route}" data-cta-track="everyday_related_click" data-cta-id="${id}_to_${story.id}"><span class="everyday-story-photo"><img src="${englishRoot}../images/${src}" alt="${escape(alt)}" width="640" height="480" loading="lazy" decoding="async" style="object-position:${position}"></span><span class="everyday-story-copy"><small>${label}</small><strong>${escape(story.title)}</strong><span>${escape(story.note)}</span><b>Read the story <span aria-hidden="true">→</span></b></span></a>`;
  }).join('');
  const credits = id === 'foods' ? 'Photographs: Michikusa.' : 'Photographs: Michikusa. Onigiri: <a href="https://commons.wikimedia.org/wiki/File:Onigiri_001.jpg">Ocdp</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.en">CC0</a> (resized, WebP, responsive crop).';
  return `<section class="everyday-related" aria-labelledby="everydayRelatedTitle"><div class="section-head"><div><p class="eyebrow">EVERYDAY JAPAN</p><h2 id="everydayRelatedTitle">Another small discovery.</h2></div><a class="everyday-all-stories" href="${englishRoot}everyday-japan.html">All stories <span aria-hidden="true">→</span></a></div><nav class="everyday-related-grid" aria-label="More Everyday Japan stories">${cards}</nav><p class="everyday-related-credits">${credits}</p></section>`;
}

export function addEverydayRelated(html, id, file) {
  const root = path.posix.relative(path.posix.dirname(file), 'en');
  const englishRoot = root ? root + '/' : '';
  const cssRoot = path.posix.relative(path.posix.dirname(file), '.') + '/';
  const stylesheet = `<link rel="stylesheet" href="${cssRoot}everyday-related.css?v=${assetVersion('everyday-related.css')}">`;
  const marker = '<section data-spot-page-shared-module="content-rail"></section>';
  if (!html.includes(marker)) throw Error('Missing related-story insertion point: ' + file);
  return html.replace('</head>', stylesheet + '\n</head>').replace(marker, everydayRelatedHTML(id, englishRoot) + '\n' + marker);
}
