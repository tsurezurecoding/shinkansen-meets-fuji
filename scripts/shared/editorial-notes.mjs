// Explicit editorial additions are independent of source translation dictionaries.
import fs from 'node:fs';
import { translated, castles, supported } from './locales.mjs';
export const editorial = JSON.parse(fs.readFileSync(new URL('../locales/editorial-notes.json', import.meta.url), 'utf8'));
export const articleConnections = JSON.parse(fs.readFileSync(new URL('../locales/article-connections.json', import.meta.url), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
for (const [lang, notes] of Object.entries(editorial.notes)) {
  if (!translated.includes(lang) || !editorial.labels[lang]) throw Error('Unknown editorial edition: ' + lang);
  for (const [spot, note] of Object.entries(notes)) {
    if (!note.id || !note.theme || !note.heading?.trim() || !note.paragraphs?.length || (!note.article && !note.modal)) throw Error('Incomplete editorial note: ' + lang + '/' + spot);
    if (note.article && !supported(note.article).includes(lang)) throw Error('Editorial article is outside the active route contract: ' + note.article);
    for (const paragraph of note.paragraphs) {
      if (!['fact','inference'].includes(paragraph.kind) || !paragraph.text?.trim() || !Array.isArray(paragraph.sources) || paragraph.kind === 'fact' && !paragraph.sources.length) throw Error('Unclassified or unsourced editorial paragraph: ' + note.id);
      for (const id of paragraph.sources) {
        const source = editorial.sources[id];
        if (!source?.label || !source.evidence || !/^\d{4}-\d{2}-\d{2}$/.test(source.checkedOn) || !source.url?.startsWith('https://')) throw Error('Invalid editorial source: ' + id);
      }
    }
  }
}
export function renderEditorialNote(lang, spotId, article = false) {
  if (article && ['fujitec-big-wing','pocari-fukuroi'].includes(spotId)) return renderArticleConnections(lang, spotId);
  const note = editorial.notes[lang]?.[spotId];
  if (!note) return '';
  const labels = editorial.labels[lang];
  const sourceIds = [...new Set(note.paragraphs.flatMap(item => item.sources))];
  const dates = [...new Set(sourceIds.map(id => editorial.sources[id].checkedOn))];
  const heading = article ? 'h2' : 'h3';
  return `<section class="locale-note" id="locale-note-${escape(note.id)}" data-editorial-note="${escape(note.id)}" lang="${escape(lang)}"><${heading}>${escape(note.heading)}</${heading}>${note.paragraphs.map(item => `<p data-editorial-kind="${item.kind}">${escape(item.text)}</p>`).join('')}<p class="locale-note-sources"><span>${escape(labels.sources)} · ${escape(labels.checked)} ${dates.map(escape).join(', ')}</span>: ${sourceIds.map(id => { const source = editorial.sources[id]; return `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)}</a>`; }).join(' · ')}</p></section>`;
}
export function renderArticleConnections(lang, spotId) {
  const copy = articleConnections[lang];
  if (!copy) return '';
  const key = spotId === 'fujitec-big-wing' ? 'fujitec' : spotId === 'pocari-fukuroi' ? 'pocari' : null;
  if (!key) return '';
  const texts = copy[key];
  const ids = key === 'fujitec' ? ['fujitec-reichstag','fujitec-big-wing','fujitec-wangjing'] : ['donga-otsuka','otsuka-production'];
  const sourceLinks = ids.map(id => { const s = editorial.sources[id]; return `<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.label)}</a>`; }).join(' · ');
  const body = key === 'fujitec' ? `<h3>${escape(texts[1])}</h3><p data-editorial-kind="fact">${escape(texts[2])}</p><h3>${escape(texts[3])}</h3><p data-editorial-kind="fact">${escape(texts[4])}</p>` : `<p data-editorial-kind="fact">${escape(texts[1])}</p><p data-editorial-kind="inference">${escape(texts[2])}</p>`;
  return `<section class="locale-note" id="locale-note-${spotId}-connections" data-article-connections="${spotId}" lang="${lang}"><h2>${escape(texts[0])}</h2>${body}<p class="locale-note-sources">${escape(copy.sources)} · ${escape(copy.checked)} 2026-10-12: ${sourceLinks}</p></section>`;
}
export function utilityEditorialNotes(lang, spotIds) {
  const notes = Object.entries(editorial.notes[lang] || {}).filter(([, note]) => note.modal);
  for (const [id] of notes) if (!spotIds.includes(id)) throw Error('Unknown utility editorial spot: ' + id);
  return Object.fromEntries(notes.map(([id]) => [id, renderEditorialNote(lang, id)]));
}
export function appendArticleEditorialNote(doc, lang, route) {
  const spotId = route.match(/^spots\/(fujitec-big-wing|pocari-fukuroi)\.html$/)?.[1];
  if (spotId) {
    const article = doc.querySelector('article.spot-page-article');
    if (!article) throw Error('Article connection host missing: ' + route);
    article.querySelectorAll('[data-article-connections], [data-editorial-note]').forEach(el => el.remove());
    const template = doc.createElement('template'); template.innerHTML = renderArticleConnections(lang, spotId);
    const anchor = article.querySelector('.spot-page-section');
    if (anchor) anchor.after(template.content); else article.append(template.content);
    return;
  }
  for (const [id, note] of Object.entries(editorial.notes[lang] || {})) {
    if (note.article !== route) continue;
    const article = doc.querySelector('article.spot-page-article');
    if (!article) throw Error('Editorial article host missing: ' + lang + '/' + route);
    article.querySelectorAll('[data-editorial-note]').forEach(el => el.remove());
    const template = doc.createElement('template'); template.innerHTML = renderEditorialNote(lang, id, true);
    const anchor = article.querySelector('.spot-page-section');
    if (anchor) anchor.after(template.content);
    else article.append(template.content);
  }
}
