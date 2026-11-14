import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {kyotoWindowArticle} from './shared/window-articles.mjs';
import {assetVersion} from './shared/asset-version.mjs';
import {enhanceContentHead} from './shared/content-metadata.mjs';
import {ANALYTICS} from './shared/feature-page.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = {};
for (const file of ['spot-page-shared-data.js', 'spot-page-shared.js']) vm.runInNewContext(fs.readFileSync(path.join(app,file),'utf8'),{window:root});
const components = root.MADO_SPOT_PAGE_COMPONENTS;
const esc = text => String(text).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));

for (const lang of ['ja','en']) {
  const page = kyotoWindowArticle(lang), prefix = lang === 'ja' ? './' : '../';
  const route = `${lang === 'ja' ? '' : 'en/'}kyoto-station-views.html`;
  const dom = new JSDOM(components.pageHTML(root.MADO_SPOT_PAGE_SHARED_DATA,page,prefix,lang,''));
  const doc=dom.window.document;
  doc.querySelector('.spot-page-stamp')?.remove();
  doc.querySelector('.spot-compact-guide')?.remove();
  // The station reading article has no new timed guide point.
  doc.querySelector('.spot-page-rail')?.remove();
  const article=doc.querySelector('.spot-page-shell > article');
  const toc=doc.createElement('nav');toc.className='spot-article-toc';toc.setAttribute('aria-label',lang==='ja'?'この記事の見どころ':'In this article');
  toc.innerHTML=page.chapters.map(ch=>`<a href="#${ch.id}">${esc(ch.heading.replaceAll('｜',''))}</a>`).join('');article.prepend(toc);
  const related=doc.createElement('section');related.className='spot-page-section';
  related.innerHTML=lang==='ja'?`<h2>反対側の窓には、東寺</h2><p>東寺の五重塔は、京都駅の西側・A席側の見どころ。見える位置と写真は、東寺の記事で紹介しています。</p><a class="spot-article-related" href="spots/toji.html">東寺の五重塔 →</a>`:`<h2>On the other side: To-ji</h2><p>West of Kyoto Station, To-ji’s five-storey pagoda is a Seat A view. Find photographs and spotting tips in the separate article.</p><a class="spot-article-related" href="spots/toji.html">Look for To-ji’s pagoda →</a>`;
  article.querySelector('.spot-reading-sources').before(related);
  doc.querySelectorAll('img[data-photo-original-src]').forEach(img=>{if(!img.getAttribute('src'))img.src=img.dataset.photoDisplaySrc||img.dataset.photoOriginalSrc;img.removeAttribute('data-photo-deferred');});
  doc.querySelectorAll('.spot-page-inline-figure figcaption a').forEach(credit=>{
    const match=credit.textContent.match(/^(.*?) \/ (CC BY(?:-SA)? 4\.0)$/);if(!match)return;
    credit.textContent=match[1];const licence=doc.createElement('a');licence.href=`https://creativecommons.org/licenses/${match[2].includes('-SA')?'by-sa':'by'}/4.0/`;licence.textContent=match[2];licence.target='_blank';licence.rel='noopener noreferrer';credit.after(doc.createTextNode(' / '),licence,doc.createTextNode(lang==='ja'?'（縮小）':' (resized)'));
  });
  // Share the normal utility-page chrome and its language switch.
  const main=doc.querySelector('main');const shell=main.querySelector('.spot-page-shell');shell.insertAdjacentHTML('afterbegin','<aside data-spot-page-shared-module="rail"></aside>');
  const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.heading)} | ${lang==='ja'?'新幹線の窓':'Shinkansen Window'}</title><meta property="og:title" content="${esc(page.heading)}"><meta name="twitter:card" content="summary_large_image"><meta name="description" content="${esc(lang==='ja'?'京都タワーと京都駅の大きな屋根。車窓と駅前の写真から、京都の入口にある建築の形と歴史をたどります。':'Explore Kyoto Tower and the station’s great roof through window views, architecture and a short walk on the north side.')}"/><link rel="canonical" href="https://www.michikusa-travel.com/${route}"><link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/kyoto-station-views.html"><link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/kyoto-station-views.html"><link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/kyoto-station-views.html">${['style.css','spot-media-gallery.css','window-articles.css'].map(file=>`<link rel="stylesheet" href="${prefix}${file}?v=${assetVersion(file)}">`).join('')}${ANALYTICS.withEmbeddedGuard}`;
  let html=`<!doctype html><html lang="${lang}"><head>${head}</head><body class="spot-page spot-page-utility" data-spot-page-shared-context="utility" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${prefix}" data-spot-page-shared-route="kyoto-station-views.html"><div data-spot-page-shared-module="topbar"></div>${doc.body.innerHTML}<section data-spot-page-shared-module="content-rail"></section><footer class="footer"><p class="footer-brand">${lang==='ja'?'新幹線の窓':'Shinkansen Window'}</p><a href="${prefix}${lang==='ja'?'':'en/'}zukan.html">${lang==='ja'?'車窓一覧':'All window views'}</a></footer>${['spot-page-shared-data.js','spot-page-shared.js','spot-media-gallery.js','window-articles.js'].map(file=>`<script src="${prefix}${file}?v=${assetVersion(file)}"></script>`).join('')}</body></html>\n`;
  html=enhanceContentHead(html,route,app);
  const target=path.join(app,route);
  if(process.argv.includes('--check')){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==html)throw Error(`Kyoto article out of date: ${route}`);}else fs.writeFileSync(target,html);
  dom.window.close();
}
console.log('Kyoto station reading article: Japanese and English.');
