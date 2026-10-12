// Guide prose remains hand authored; shared edition navigation is generated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { episodes, supported, editions, languages, translated, stripEdition, routes, withLocaleRegistry } from './shared/locales.mjs';
import { assetVersion } from './shared/asset-version.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.michikusa-travel.com';
const check = process.argv.includes('--check');
for (const lang of languages) {
  const file = (lang === 'ja' ? '' : lang + '/') + 'guide.html';
  let html = fs.readFileSync(path.join(root, file), 'utf8');
  const dom = new JSDOM(html, { url: origin + '/' + file });
  const prefix = dom.window.document.querySelector('base') ? '' : lang === 'ja' ? '' : '../';
  const menus = [];
  html = html.replace(/<details\b[^>]*class="[^"]*guide-lang-menu[^\"]*"[^>]*>[\s\S]*?<\/details>/g, menu => {
    const options = supported('guide.html').map(edition => {
      const href = prefix + (edition === 'ja' ? '' : edition + '/') + 'guide.html' + (edition === 'ja' ? '?lang=ja' : '');
      return `<a href="${href}"${edition === lang ? ' aria-current="page"' : ''}>${editions[edition].label}</a>`;
    }).join('');
    menus.push(menu.replace(/(<div class="guide-lang-options">)[\s\S]*?(<\/div>)/, `$1\n        ${options}\n      $2`));
    return '<!-- MADO_GUIDE_MENU_' + (menus.length - 1) + ' -->';
  });
  // Preserve the hand-authored markup, tracked rail attributes and original credits.
  html = html.replace(/<a\b[^>]*href="([^"]+)"[^>]*>/g, (tag, href) => {
    if (/^(?:https?:|\/\/|mailto:|tel:|#)/.test(href) || /\blang=/.test(tag)) return tag;
    const url = new URL(href, dom.window.document.baseURI);
    const route = stripEdition(url.pathname.slice(1)).replace(/^live\/$/, 'live/index.html') || 'index.html';
    if (!supported(route).includes(lang)) return tag;
    tag = tag.replace(/\s+hreflang="en"/, '');
    if (tag.includes('data-guide-cta="hero_exact_time"')) url.searchParams.set('focus', 'fuji');
    if (['ja', 'en'].includes(lang) && /data-guide-cta="(?:rail_exact_time(?:_bottom)?|train_times_picker)"/.test(tag)) url.searchParams.set('focus', 'fuji');
    if (translated.includes(lang) && tag.includes('data-guide-cta="rail_exact_time')) url.searchParams.delete('focus');
    const target = (lang === 'en' ? '' : prefix + (lang === 'ja' ? '' : lang + '/')) + (route === 'index.html' ? (lang === 'en' ? './' : '') : route) + url.search + url.hash;
    return tag.replace('href="' + href + '"', 'href="' + target + '"');
  });
  const dictionaryFile = path.join(root, 'scripts/locales', `utility-${lang}.json`);
  if (translated.includes(lang) && fs.existsSync(dictionaryFile)) {
    const dictionary = JSON.parse(fs.readFileSync(dictionaryFile, 'utf8'));
    html = html.replace(/<(header|footer)\b[^>]*>[\s\S]*?<\/\1>/g, block => block.replace(/>([^<>]+)</g, (whole, text) => {
      const key = text.trim(), value = dictionary[key];
      if (!value || /[<>]/.test(value)) return whole;
      return '>' + text.replace(key, () => value.replaceAll('&', '&amp;')) + '<';
    }));
  }
  html = html.replace(/<!-- MADO_GUIDE_MENU_(\d+) -->/g, (_, index) => menus[+index]);
  html = withLocaleRegistry(html, prefix);
  for (const [tag, asset] of [['script', 'utility-locales.js'], ['link', 'utility-locales.css']]) {
    if (!html.includes((tag === 'script' ? 'src="' : 'href="') + prefix + asset)) {
      const element = tag === 'script' ? `<script ${asset === 'locales.js' ? '' : 'defer '}src="${prefix}${asset}?v=${assetVersion(asset)}"></script>` : `<link rel="stylesheet" href="${prefix}${asset}?v=${assetVersion(asset)}">`;
      html = html.replace('</head>', '  ' + element + '\n</head>');
    }
  }
  if (check && html !== fs.readFileSync(path.join(root, file), 'utf8')) throw Error('Guide edition routes stale: ' + file);
  if (!check) fs.writeFileSync(path.join(root, file), html);
  dom.window.close();
}
console.log('Shared guide routes: 8 editions, existing article fallback and Fuji selection preserved.');
