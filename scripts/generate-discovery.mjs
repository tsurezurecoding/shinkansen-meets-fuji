import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { languages } from './shared/locales.mjs';
import { newsBaseline, newsFor, withContentNews } from './shared/content-news.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.michikusa-travel.com';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function output(file, text, check) {
  const target = path.join(root, file);
  if (fs.existsSync(target) && read(file) === text) return;
  if (check) throw Error('Stale discovery output: ' + file);
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, text);
}

function sitePath(href, source) {
  const url = new URL(href);
  if (url.origin !== origin || url.search || !fs.statSync(path.join(root, decodeURIComponent(url.pathname)), {throwIfNoEntry:false})?.isFile()) {
    throw Error(source + ': invalid local destination ' + href);
  }
  return url.pathname + url.hash;
}

function featuresFor(file) {
  const dom = new JSDOM(read(file), {url:origin + '/' + file});
  try {
    const grid = dom.window.document.querySelector('.journey-intent-grid');
    const cards = grid?.querySelectorAll('a.journey-intent-card');
    if (!cards?.length) throw Error('Missing catalogue cards in ' + file);
    const ids = new Set();
    return Array.from(cards, card => {
      const id = card.dataset.ctaId;
      const copy = card.querySelector('.journey-intent-copy');
      const text = selector => copy?.querySelector(selector)?.textContent.trim();
      const title = text('strong');
      const description = text(':scope > span');
      if (!id || ids.has(id) || !title || !description) throw Error('Invalid catalogue card in ' + file + ': ' + id);
      ids.add(id);
      const image = card.querySelector('img');
      const label = text('small');
      return {id, title, description, path:sitePath(card.href, file), ...(image ? {image:sitePath(image.src, file)} : {}), ...(label ? {label} : {})};
    });
  } finally { dom.window.close(); }
}

export function generateDiscovery({editions = languages, check = false} = {}) {
  const assets = new Set();
  const localNews = Object.fromEntries(languages.map(language => [language, newsFor(language)]));
  output('data/discovery/local-news.js', 'window.MADO_LOCAL_NEWS = ' + JSON.stringify({newsBaseline, editions:localNews}).replace(/</g, '\\u003c') + ';\n', check);
  assets.add('data/discovery/local-news.js');
  for (const language of editions) {
    if (!languages.includes(language)) throw Error('Unknown discovery edition: ' + language);
    const prefix = language === 'ja' ? '' : language + '/';
    const guide = prefix + 'zukan.html';
    const news = newsFor(language);
    for (const item of news) sitePath(origin + item.path, item.id);
    const payload = {schema:1, language, features:featuresFor(guide), news, newsBaseline};
    const feed = 'data/discovery/' + language + '.json';
    output(feed, JSON.stringify(payload, null, 2) + '\n', check);
    assets.add(feed);
    for (const item of [...payload.features, ...news]) {
      for (const value of [item.path, item.image].filter(Boolean)) assets.add(decodeURIComponent(new URL(value, origin).pathname.slice(1)));
    }
    for (const file of [prefix + 'index.html', guide]) {
      output(file, withContentNews(read(file), file), check);
      assets.add(file);
    }
  }
  return assets;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const langArg = process.argv.indexOf('--lang');
  const editions = langArg < 0 ? languages : [process.argv[langArg + 1]];
  const check = process.argv.includes('--check');
  generateDiscovery({editions, check});
  console.log('Discovery ' + (check ? 'checked' : 'generated') + ': ' + editions.join(', '));
}
