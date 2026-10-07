// Explicit editorial metadata. Neither the clock, mtime nor Git timestamps are inputs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://www.michikusa-travel.com';
export const CONTENT_METADATA = JSON.parse(fs.readFileSync(new URL('../content-metadata.json', import.meta.url), 'utf8'));
const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sizeCache = new Map();
const esc = value => String(value).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const unesc = value => String(value).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function validContentDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function metadataProblems(registry = CONTENT_METADATA) {
  const problems = [];
  for (const [file, meta] of Object.entries(registry)) {
    for (const field of ['published', 'modified']) {
      if (meta[field] != null && !validContentDate(meta[field])) problems.push(`${file}: invalid ${field}`);
      if (meta[field] != null && !meta[`${field}Evidence`]) problems.push(`${file}: missing ${field} evidence`);
    }
    if (meta.published && meta.modified && meta.published > meta.modified) problems.push(`${file}: published after modified`);
    if (meta.article && (meta.kind !== 'editorial article' || !meta.published || !meta.modified)) problems.push(`${file}: Article requires an editorial decision and verified dates`);
    if (meta.image && (meta.imageRights !== 'own' || !meta.imageEvidence || !meta.imageAlt)) problems.push(`${file}: curated image needs ownership evidence and alt`);
  }
  return problems;
}
const metadataErrors = metadataProblems();
if (metadataErrors.length) throw Error(metadataErrors.join('\n'));

export function imageDimensions(src, root = defaultRoot) {
  if (!/^images\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)$/i.test(src) || src.split('/').includes('..')) throw Error(`Unsafe OG image path: ${src}`);
  const file = path.join(root, src);
  if (sizeCache.has(file)) return sizeCache.get(file);
  const data = fs.readFileSync(file);
  let size;
  if (data.length >= 24 && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    size = { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  } else if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset < data.length) {
      if (data[offset++] !== 0xff) throw Error(`Invalid JPEG: ${src}`);
      while (data[offset] === 0xff) offset++;
      const marker = data[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = data.readUInt16BE(offset);
      if (length < 2 || offset + length > data.length) throw Error(`Invalid JPEG segment: ${src}`);
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        size = { width: data.readUInt16BE(offset + 5), height: data.readUInt16BE(offset + 3) }; break;
      }
      offset += length;
    }
  } else if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    const type = data.toString('ascii', 12, 16);
    if (type === 'VP8X') size = { width: 1 + data.readUIntLE(24, 3), height: 1 + data.readUIntLE(27, 3) };
    else if (type === 'VP8 ') size = { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
    else if (type === 'VP8L') { const bits = data.readUInt32LE(21); size = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }; }
  }
  if (!size?.width || !size?.height) throw Error(`Unsupported or invalid OG image: ${src}`);
  sizeCache.set(file, size);
  return size;
}

const localText = (value, lang) => typeof value === 'string' ? value : value?.[lang] || value?.ja || value?.en || '';
const ownCredit = credit => ['michikusa','新幹線の窓','Shinkansen Window'].includes(localText(credit, 'ja'));
function spotPhoto(spot, src) {
  return (spot.photos || []).find(photo => photo.src === src) || (src === spot.image ? { src, credit: spot.photoCredit } : null);
}
export function selectSpotOgImage(spot, root = defaultRoot, lang = 'ja') {
  let src;
  // An explicit OG override stays first, but cannot silently extend a third party's licence.
  if (spot.ogImage) {
    if (!ownCredit(spotPhoto(spot, spot.ogImage)?.credit)) throw Error(`Explicit OG image needs ownership/OG permission evidence: ${spot.id}`);
    src = spot.ogImage;
  } else {
    const own = photo => ownCredit(photo.credit) && /michikusa/i.test(photo.src);
    const candidates = [{ src: spot.image, credit: spot.photoCredit }, ...(spot.photos || [])].filter(photo => photo.src && own(photo));
    const large = candidates.find(photo => { const size = imageDimensions(photo.src, root); return size.width >= 1200 && size.width > size.height; });
    src = (large || candidates[0])?.src || 'images/og-shinkansen-window.png';
  }
  const photo = spotPhoto(spot, src);
  const alt = localText(photo?.alt, lang) || (src === 'images/og-shinkansen-window.png'
    ? (lang === 'ja' ? '新幹線の窓 — 東海道新幹線の車窓案内' : 'Shinkansen Window — Tokaido window views')
    : (lang === 'ja' ? `${spot.ja.name}の新幹線車窓写真` : `${spot.en?.name || spot.ja.name} from the Shinkansen window`));
  return { src, url: `${SITE}/${src}`, alt, ...imageDimensions(src, root) };
}

function metaValue(head, key) {
  const tag = (head.match(/<meta\b[^>]*>/gi) || []).find(tag => new RegExp(`(?:name|property)="${key}"`).test(tag));
  return tag ? unesc(tag.match(/content="([^"]*)"/)?.[1] || '') : '';
}
function setMeta(head, key, value, name = false) {
  const line = `<meta ${name ? 'name' : 'property'}="${key}" content="${esc(value)}">`;
  const expression = new RegExp(`<meta\\b[^>]*(?:name|property)="${key}"[^>]*>`, 'g');
  return expression.test(head) ? head.replace(expression, line) : head.replace('</head>', `  ${line}\n</head>`);
}
export function enhanceContentHead(html, file, root = defaultRoot, options = {}) {
  const meta = CONTENT_METADATA[file];
  return html.replace(/<head[\s\S]*?<\/head>/i, head => {
    const lang = file.startsWith('en/') ? 'en' : 'ja';
    const selected = options.spot ? selectSpotOgImage(options.spot, root, lang) : null;
    const src = meta?.image || selected?.src || metaValue(head, 'og:image').replace(`${SITE}/`, '');
    const size = imageDimensions(src, root);
    const url = `${SITE}/${src}`;
    const alt = meta?.imageAlt || selected?.alt || metaValue(head, 'og:image:alt');
    if (!alt) throw Error(`Missing representative image alt: ${file}`);
    const contentUrl = `${SITE}/${file}`;
    const image = { '@type': 'ImageObject', '@id': `${contentUrl}#primaryimage`, url, contentUrl: url, width: size.width, height: size.height, caption: alt };
    head = setMeta(head, 'og:image', url);
    head = setMeta(head, 'og:image:width', size.width);
    head = setMeta(head, 'og:image:height', size.height);
    head = setMeta(head, 'og:image:alt', alt);
    head = setMeta(head, 'twitter:image', url, true);
    head = setMeta(head, 'twitter:image:alt', alt, true);
    if (options.spot || meta) head = setMeta(head, 'og:type', meta?.kind === 'editorial article' ? 'article' : 'website');
    head = head.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (original, source) => {
      const json = JSON.parse(source);
      const graph = json['@graph'] || [json];
      const page = graph.find(node => ['WebPage','CollectionPage'].includes(node['@type']));
      if (!page) return original;
      page.image = image;
      page.primaryImageOfPage = { '@id': image['@id'] };
      // Curated entries own their dates. Unknown dates are omitted, never invented.
      if (meta) {
        if (meta.published) page.datePublished = meta.published; else delete page.datePublished;
        if (meta.modified) page.dateModified = meta.modified; else delete page.dateModified;
      }
      if (meta?.article) {
        const organization = { '@type': 'Organization', name: '新幹線の窓', url: `${SITE}/` };
        const attraction = graph.find(node => node['@type'] === 'TouristAttraction');
        const article = {
          '@type': 'Article', '@id': `${contentUrl}#article`, headline: page.name,
          description: page.description, image, mainEntityOfPage: { '@id': page['@id'] || contentUrl },
          datePublished: meta.published, dateModified: meta.modified,
          author: organization, publisher: organization, inLanguage: lang,
          ...(attraction ? { about: { '@id': attraction['@id'] } } : {})
        };
        page.mainEntity = { '@id': article['@id'] };
        const previous = graph.findIndex(node => node['@id'] === article['@id']);
        if (previous >= 0) graph[previous] = article; else graph.push(article);
        return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}</script>`;
      }
      return `<script type="application/ld+json">${JSON.stringify(json, null, 2)}</script>`;
    });
    return head;
  });
}

export function contentLastmod(url, legacy) {
  const file = new URL(url).pathname.slice(1);
  return CONTENT_METADATA[file]?.modified || legacy;
}
