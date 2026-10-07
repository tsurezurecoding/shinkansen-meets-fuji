// Integrated into audit:site; no additional competing release entry point.
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_METADATA, SITE, imageDimensions, metadataProblems, selectSpotOgImage, validContentDate } from './content-metadata.mjs';

export function auditContentMetadata(root, spots) {
  const problems = metadataProblems();
  const candidates = Object.keys(CONTENT_METADATA);
  const files = [...new Set([...candidates, ...spots.flatMap(s => ['spots/'+s.id+'.html', 'en/spots/'+s.id+'.html']).filter(f => fs.existsSync(path.join(root, f)))])];
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const lastmods = new Map([...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => [m[1].match(/<loc>([^<]+)<\/loc>/)?.[1], m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]]));
  for (const [url, date] of lastmods) if (date && !validContentDate(date)) problems.push(`${url}: invalid sitemap lastmod`);
  for (const file of files) {
    try {
      const html = fs.readFileSync(path.join(root, file), 'utf8');
      const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] || '';
      const get = key => (head.match(/<meta\b[^>]*>/g) || []).find(t => t.includes(`="${key}"`))?.match(/content="([^"]*)"/)?.[1];
      const expect = (ok, detail) => { if (!ok) problems.push(`${file}: ${detail}`); };
      const meta = CONTENT_METADATA[file];
      const spot = spots.find(s => file.endsWith('/'+s.id+'.html'));
      expect(/<link rel="canonical" href="https:\/\/www\.michikusa-travel\.com\//.test(head), 'missing canonical');
      expect(get('robots')?.includes('max-image-preview:large'), 'missing large image preview');
      const image = get('og:image');
      expect(image?.startsWith(`${SITE}/images/`), 'missing local OG image');
      if (!image?.startsWith(`${SITE}/images/`)) continue;
      const src = image.slice(SITE.length + 1);
      const size = imageDimensions(src, root);
      expect(Number(get('og:image:width')) === size.width && Number(get('og:image:height')) === size.height, 'OG dimensions disagree with asset');
      expect(!!get('og:image:alt') && get('og:image:alt') === get('twitter:image:alt'), 'missing/inconsistent alt');
      expect(get('twitter:image') === image && get('twitter:card') === 'summary_large_image', 'twitter image/card inconsistent');
      if (meta) expect(size.width >= 1200 && size.width > size.height, 'candidate needs a large landscape image');
      if (spot) expect(image === selectSpotOgImage(spot, root, file.startsWith('en/') ? 'en' : 'ja').url, 'image does not follow owned-photo selection');
      const nodes = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => { const j = JSON.parse(m[1]); return j['@graph'] || [j]; });
      for (const node of nodes) {
        for (const field of ['datePublished','dateModified']) if (node[field]) expect(validContentDate(node[field]), `invalid ${field}`);
        if (node.datePublished && node.dateModified) expect(node.datePublished <= node.dateModified, 'published after modified');
        if (node.image?.['@type'] === 'ImageObject') expect(node.image.url === image && node.image.width === size.width && node.image.height === size.height, 'schema image inconsistent');
        if (['Article','NewsArticle','BlogPosting'].includes(node['@type'])) {
          expect(!!meta?.article, 'Article lacks explicit editorial decision');
          for (const field of ['headline','description','image','mainEntityOfPage','datePublished','dateModified','author','publisher']) expect(!!node[field], `Article missing ${field}`);
          expect(node.author?.name && node.author?.url && node.publisher?.name && node.publisher?.url, 'Article organization incomplete');
        }
        if (meta && ['WebPage','CollectionPage','Article'].includes(node['@type'])) {
          expect((node.datePublished || null) === meta.published && (node.dateModified || null) === meta.modified, 'dates disagree with source');
        }
      }
      if (meta?.article) expect(nodes.some(n => n['@type'] === 'Article'), 'missing opted-in Article');
      if (meta?.modified) expect(lastmods.get(`${SITE}/${file}`) === meta.modified, 'sitemap/source modified mismatch');
      if (meta?.kind === 'collection') expect(nodes.some(n => n['@type'] === 'CollectionPage') && !nodes.some(n => n['@type'] === 'Article'), 'collection was Article-ized');
    } catch (error) { problems.push(`${file}: ${error.message}`); }
  }
  return { files: files.length, problems };
}
