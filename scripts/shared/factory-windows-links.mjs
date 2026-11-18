import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'parse5';
import {languages, stripEdition} from './locales.mjs';

const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Keep this reviewed copy out of the host page's utility translation pass.
export function stripFactoryWindowLinks(html) {
  return html.replace(/<!-- FACTORY-WINDOWS:START -->[\s\S]*?<!-- FACTORY-WINDOWS:END -->/g, '');
}

export function withFactoryWindowLinks(html, file, root) {
  if (stripEdition(file) !== 'zukan.html') return html;
  const lang = languages.find(value => value !== 'ja' && file.startsWith(value + '/')) || 'ja';
  const dictionary = path.join(root, 'scripts/locales/factory-windows', lang + '.json');
  if (!fs.existsSync(dictionary)) return html;
  const {ui} = JSON.parse(fs.readFileSync(dictionary, 'utf8'));
  if (!ui?.title || !ui?.entry) throw Error(`Factory catalogue copy missing: ${lang}`);
  html = stripFactoryWindowLinks(html);
  const base = html.match(/<base\b[^>]*href=(["'])(.*?)\1/i)?.[2] || '.';
  const depth = new URL(base, 'https://www.michikusa-travel.com/' + file).pathname.split('/').filter(Boolean).length;
  const prefix = '../'.repeat(depth);
  const route = `${lang === 'ja' ? '' : lang + '/'}factories.html`;
  // app.js preserves links with an explicit destination language. This card has
  // its own dictionary and must not fall back through older utility payloads.
  const card = `<!-- FACTORY-WINDOWS:START --><a class="journey-intent-card journey-intent-family" href="${prefix}${route}" hreflang="${lang}" data-cta-track="zukan_theme_click" data-cta-id="factories"><img src="${prefix}images/factories/kirin-640.webp" alt="" loading="lazy" decoding="async"><span class="journey-intent-copy"><small>FACTORIES</small><strong>${escapeHTML(ui.title)}</strong><span>${escapeHTML(ui.entry)}</span></span></a><!-- FACTORY-WINDOWS:END -->`;
  const document = parse(html, {sourceCodeLocationInfo: true});
  const findGrid = node => node.attrs?.some(a => a.name === 'class' && a.value.split(/\s+/).includes('journey-intent-grid')) ? node : (node.childNodes || []).map(findGrid).find(Boolean);
  const offset = findGrid(document)?.sourceCodeLocation?.endTag?.startOffset;
  if (offset === undefined) throw Error(`Factory catalogue grid missing: ${file}`);
  return html.slice(0, offset) + card + html.slice(offset);
}
