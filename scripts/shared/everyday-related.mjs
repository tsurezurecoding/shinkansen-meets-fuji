import path from 'node:path';
import { assetVersion } from './asset-version.mjs';

const stories = [
  { id: 'foods', route: 'foods.html', title: 'Small foods for your journey', note: 'Rice balls, warm buns and sweet stops.', group: 'taste' },
  { id: 'drinks', route: 'drinks.html', title: 'Japanese drinks', note: 'Tea, coffee and a new name on the shelf.', group: 'taste' },
  { id: 'beer', route: 'beer-on-shinkansen.html', title: 'Japanese beer', note: 'Meet the lagers and breweries along the railway.', group: 'taste' },
  { id: 'countryside', route: 'countryside.html', title: 'Japan’s countryside', note: 'Rice fields, tea gardens and the landscape between cities.', group: 'landscape' },
  { id: 'greenhouses', route: 'spots/gamagori-greenhouses.html', title: 'Greenhouses beside the railway', note: 'Look closer at the pale roofs around Gamagori.', group: 'landscape' },
];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function everydayRelatedHTML(id, englishRoot = '') {
  const current = stories.find(story => story.id === id);
  if (!current) throw Error('Unknown Everyday Japan story: ' + id);
  const related = stories.filter(story => story.id !== id).sort((a, b) => Number(b.group === current.group) - Number(a.group === current.group));
  return `<section class="everyday-related" aria-labelledby="everydayRelatedTitle"><div class="section-head"><p class="eyebrow">EVERYDAY JAPAN</p><h2 id="everydayRelatedTitle">Another small discovery.</h2><p><a href="${englishRoot}everyday-japan.html">All Everyday Japan stories →</a></p></div><nav class="everyday-related-grid" aria-label="More Everyday Japan stories">${related.map(story => `<a class="spot-page-next-card" href="${englishRoot}${story.route}" data-cta-track="everyday_related_click" data-cta-id="${id}_to_${story.id}"><strong>${escape(story.title)}</strong><span>${escape(story.note)}</span></a>`).join('')}</nav></section>`;
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
