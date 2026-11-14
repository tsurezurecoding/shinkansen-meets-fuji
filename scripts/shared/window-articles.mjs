import fs from 'node:fs';

const copy = Object.fromEntries(['ja', 'en'].map(lang => [lang,
  JSON.parse(fs.readFileSync(new URL(`../data/window-articles.${lang}.json`, import.meta.url), 'utf8'))
]));

// Editorial copy is kept out of the on-board runtime catalogue.
export function withWindowArticle(page, lang) {
  const article = copy[lang]?.[page.id];
  if (!article) return page;
  const original = copy.ja[page.id];
  const localizedPhoto = photo => {
    const text = article.photoCopy?.[photo.src];
    return { ...photo, ...(text || {}), date: '', caption: text?.note || photo.note || photo.caption || '' };
  };
  const { photoCopy, ...editorial } = article;
  const result = { ...page, ...editorial, lang, chapters: article.chapters.map(chapter => {
    const source = original.chapters.find(item => item.id === chapter.id);
    return { ...chapter, kind: 'background', photos: (source?.photos || []).map(localizedPhoto),
      ...(source?.media ? { media: lang === 'ja' ? source.media : { ...source.media,
        heading: 'See the earlier portrait sign in a 2018 report',
        description: 'An official Asahi Shimbun video, recorded before the current kappa design.' } } : {}) };
  }) };
  for (const key of ['photos', 'gallery', 'inline']) result[key] = (result[key] || []).map(localizedPhoto);
  result.hero = result.photos[0];
  result.explainer = null;
  result.routeNote = '';
  return result;
}

export function kyotoWindowArticle(lang) {
  return withWindowArticle(structuredClone(copy.ja['kyoto-station-views']), lang);
}
