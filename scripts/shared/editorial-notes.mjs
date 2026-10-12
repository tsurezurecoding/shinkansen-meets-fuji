// Explicit editorial additions are independent of source translation dictionaries.
import fs from 'node:fs';
import { translated, castles, supported } from './locales.mjs';
export const editorial = JSON.parse(fs.readFileSync(new URL('../locales/editorial-notes.json', import.meta.url), 'utf8'));
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
  const note = editorial.notes[lang]?.[spotId];
  if (!note) return '';
  const labels = editorial.labels[lang];
  const sourceIds = [...new Set(note.paragraphs.flatMap(item => item.sources))];
  const dates = [...new Set(sourceIds.map(id => editorial.sources[id].checkedOn))];
  const heading = article ? 'h2' : 'h3';
  return `<section class="locale-note" id="locale-note-${escape(note.id)}" data-editorial-note="${escape(note.id)}" lang="${escape(lang)}"><${heading}>${escape(note.heading)}</${heading}>${note.paragraphs.map(item => `<p data-editorial-kind="${item.kind}">${escape(item.text)}</p>`).join('')}<p class="locale-note-sources"><span>${escape(labels.sources)} · ${escape(labels.checked)} ${dates.map(escape).join(', ')}</span>: ${sourceIds.map(id => { const source = editorial.sources[id]; return `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)}</a>`; }).join(' · ')}</p></section>`;
}
export function utilityEditorialNotes(lang, spotIds) {
  const notes = Object.entries(editorial.notes[lang] || {}).filter(([, note]) => note.modal);
  for (const [id] of notes) if (!spotIds.includes(id)) throw Error('Unknown utility editorial spot: ' + id);
  return Object.fromEntries(notes.map(([id]) => [id, renderEditorialNote(lang, id)]));
}
export function appendArticleEditorialNote(doc, lang, route) {
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
