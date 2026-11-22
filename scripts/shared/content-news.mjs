import fs from 'node:fs';
import { assetVersion } from './asset-version.mjs';
import { languages } from './locales.mjs';
import { escapeHTML } from './story-window.mjs';

const records = JSON.parse(fs.readFileSync(new URL('../content-news.json', import.meta.url), 'utf8'));
const ids = new Set();
const kinds = ['feature', 'spot', 'spot-update', 'function', 'story', 'artwork'];
for (const { id, date, kind, route, titles } of records) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id)) throw Error('Invalid or duplicate news ID: ' + id);
  ids.add(id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date).toISOString().slice(0, 10) !== date) throw Error('Invalid publication date: ' + id);
  if (!kinds.includes(kind)) throw Error('Invalid news category: ' + id);
  if (!/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/.test(route)) throw Error('Invalid news route: ' + route);
  if (!Object.keys(titles).length || Object.entries(titles).some(([lang, title]) =>
    !languages.includes(lang) || !(Array.isArray(title) ? lang === 'ja' && title.length && title.every(part => typeof part === 'string' && part.trim()) : typeof title === 'string' && title.trim())
  )) throw Error('Missing or invalid news title: ' + id);
}
const newestFirst = [...records].sort((a, b) => b.date.localeCompare(a.date));
export const newsBaseline = [...ids];
const ui = {
  ja: ['新着', '未読'],
  en: ['What’s new', 'Unread'],
  'zh-Hant': ['最新內容', '未讀'],
  fr: ['Nouveautés', 'Non lu'],
  de: ['Neu hinzugekommen', 'Ungelesen'],
  es: ['Novedades', 'Sin leer'],
  'zh-Hans': ['最新内容', '未读'],
  ko: ['새 소식', '읽지 않음'],
  it: ['Novità', 'Da leggere'],
  th: ['มาใหม่', 'ยังไม่ได้อ่าน'],
};

const edition = language => language === 'ja' ? '' : language + '/';
export function newsFor(language) {
  return newestFirst.filter(record => record.titles[language]).map(({id, date, kind, route, titles, descriptions}) => {
    const text = titles[language];
    const title = Array.isArray(text) ? text.join('') : text;
    const description = descriptions?.[language];
    return {id, date, kind, title, ...(description ? {description} : {}), path: '/' + edition(language) + route};
  });
}

// The utility translator starts from the English page. Its separate dictionaries
// should never need to contain headlines or UI from this section.
export function stripContentNews(html) {
  return html.replace(/<!-- CONTENT-NEWS:START -->[\s\S]*?<!-- CONTENT-NEWS:END -->/g, '');
}

export function withContentNews(html, file) {
  const match = /^(?:([^/]+)\/)?(index|zukan)\.html$/.exec(file);
  if (!match || !languages.includes(match[1] || 'ja')) return html;
  const language = match[1] || 'ja';
  const clean = stripContentNews(html);
  if (match[2] === 'zukan') return clean;
  const anchor = '<section class="scenery scenery-editorial"';
  const at = clean.indexOf(anchor);
  if (at < 0) throw Error('Missing news position in ' + file);
  const prefix = /<base\b/.test(html) || language === 'ja' ? '' : '../';
  const [heading, unread] = ui[language];
  const formatter = new Intl.DateTimeFormat(language, {year:'numeric', month:'short', day:'numeric', timeZone:'UTC'});
  const news = newsFor(language);
  const rows = news.map(item => {
    const chunks = records.find(record => record.id === item.id).titles[language];
    const title = Array.isArray(chunks) ? chunks.map(part => '<span class="copy-chunk">' + escapeHTML(part) + '</span>').join('') : escapeHTML(item.title);
    return '<li><a data-news-id="' + item.id + '" data-news-kind="' + item.kind + '" hreflang="' + language + '" href="' + prefix + item.path.slice(1) + '"><time datetime="' + item.date + '">' +
      escapeHTML(formatter.format(new Date(item.date))) + '</time><span class="content-news-text">' + title + ' <small data-news-unread hidden>' + unread +
      '</small></span><span class="content-news-arrow" aria-hidden="true">→</span></a></li>';
  }).join('\n');
  const block = '<!-- CONTENT-NEWS:START --><link rel="stylesheet" data-mado-news-asset="content-news.css" href="' + prefix + 'content-news.css?v=' + assetVersion('content-news.css') + '">' +
    '<section id="content-news" class="content-news" aria-labelledby="content-news-title" data-news-baseline="' + newsBaseline.join(' ') + '">' +
    '<div class="content-news-inner"><div class="content-news-head"><h2 id="content-news-title">' + heading + '</h2></div>' +
    '<ul>' + rows + '</ul></div></section><script defer data-mado-news-asset="content-news.js" src="' + prefix + 'content-news.js?v=' + assetVersion('content-news.js') + '"></script><!-- CONTENT-NEWS:END -->';
  return clean.slice(0, at) + block + clean.slice(at);
}
