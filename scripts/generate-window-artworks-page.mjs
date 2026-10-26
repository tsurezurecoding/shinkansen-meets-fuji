import fs from 'node:fs';
import {enhanceContentHead} from './shared/content-metadata.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assetVersion} from './shared/asset-version.mjs';
import {ANALYTICS} from './shared/feature-page.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/window-artworks.json'),'utf8'));
const works=catalog.works.filter(w=>w.status==='published');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const origin='https://www.michikusa-travel.com/';
const copy={
 ja:{title:'車窓の作品集',description:'写真と地図で旅をつないだり、走馬灯や墨絵を眺めたり。新幹線の車窓から生まれた作品を集めました。',lead:'流れていく景色を、別のかたちで。',intro:'地図と写真で旅をつないだり、墨絵の線を眺めたり。車窓から生まれた作品を集めました。',open:'作品を見る',skip:'作品一覧へ',note:'乗車中の案内とは別に、車窓の表現を楽しむためのページです。'},
 en:{title:'Window Artworks',description:'Explore Shinkansen window views as a short film, in photographs and in ink wash, and enjoy a different expression of the journey.',lead:'A different way to watch the passing scenery.',intro:'Watch the window as an 80-second film, take a short trip through photographs, or watch a landscape drawn in ink wash. Each work begins with the view from a train window.',open:'Explore the work',skip:'Skip to the artworks',note:'These works are for enjoying the scenery as art, rather than guiding you during a train ride.'}
};
let changed=0;
for(const lang of ['ja','en']){
 const c=copy[lang],prefix=lang==='en'?'../':'',route=(lang==='en'?'en/':'')+'window-artworks.html',url=origin+route;
 const visibleWorks=works.filter(w=>!w.languages||w.languages.includes(lang));
 const cards=visibleWorks.map(w=>{if(!/^(?:[a-z-]+\/)*[a-z-]+\.html$/.test(w.route)||!fs.existsSync(path.join(root,w.route)))throw Error('Invalid published route');const t=w[lang];if(w.id==='window-film'||w.webOnly) {
 // The film is Web-only. A bundled catalog must never load its absent image or local route.
 const publicUrl=origin+(lang==='en'?'en/':'')+w.route;
 const online=lang==='ja'?'オンラインで鑑賞（通信が必要です）':'Watch online (internet connection required)';
 return `<article class="artwork-card" data-artwork="${esc(w.id)}"><a hidden href="${publicUrl}" tabindex="-1" aria-hidden="true"><img data-film-image="${prefix}${esc(w.image)}" alt="" width="1200" height="630" loading="lazy"></a><div class="artwork-copy"><p class="artwork-medium">${esc(t.medium)}</p><h2>${esc(t.title)}</h2><p>${esc(t.description)}</p><a class="artwork-open" href="${publicUrl}">${online}<span class="sr-only"> — ${esc(t.title)}</span></a></div></article><script>
(function () {
 var card=document.currentScript.previousElementSibling;
 var native=!!(window.Capacitor && ((typeof window.Capacitor.isNativePlatform==='function' && window.Capacitor.isNativePlatform()) || (typeof window.Capacitor.getPlatform==='function' && window.Capacitor.getPlatform()!=='web')));
 // A local browser preview also uses file: or localhost; only native bundle
 // signals justify suppressing an image that is absent from the Android bundle.
 var bundled=native || location.protocol==='capacitor:' || (location.protocol==='file:' && /^\\/android_asset(?:\\/|$)/.test(location.pathname));
 if(bundled) { card.querySelector('a[hidden]').remove(); return; }
 var image=card.querySelector('img'); image.src=image.dataset.filmImage;
 var cover=image.parentElement; cover.hidden=false; cover.setAttribute('href',${JSON.stringify(w.route)});
 var open=card.querySelector('.artwork-open'); open.setAttribute('href',${JSON.stringify(w.route)});
 open.firstChild.textContent=${JSON.stringify(c.open+' →')};
})();
</script>`;
}return `<article class="artwork-card" data-artwork="${esc(w.id)}"><a href="${esc(w.route)}" tabindex="-1" aria-hidden="true"><img src="${prefix}${esc(w.image)}" alt="" width="1200" height="630" loading="lazy"></a><div class="artwork-copy"><p class="artwork-medium">${esc(t.medium)}</p><h2>${esc(t.title)}</h2><p>${esc(t.description)}</p><a class="artwork-open" href="${esc(w.route)}">${esc(c.open)} <span aria-hidden="true">→</span><span class="sr-only"> — ${esc(t.title)}</span></a></div></article>`;}).join('\n');
 let html=`<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(c.title)} | ${lang==='ja'?'新幹線の窓':'Shinkansen Window'}</title><meta name="description" content="${esc(c.description)}"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="ja" href="${origin}window-artworks.html"><link rel="alternate" hreflang="en" href="${origin}en/window-artworks.html"><link rel="alternate" hreflang="x-default" href="${origin}en/window-artworks.html"><meta property="og:type" content="website"><meta property="og:title" content="${esc(c.title)}"><meta property="og:description" content="${esc(c.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}images/og-somato-window.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${origin}images/og-somato-window.jpg"><link rel="stylesheet" href="${prefix}style.css?v=${assetVersion('style.css')}"><link rel="stylesheet" href="${prefix}window-artworks.css?v=${assetVersion('window-artworks.css')}"><script src="${prefix}language-router.js?v=${assetVersion('language-router.js')}"></script>${ANALYTICS.withEmbeddedGuard}</head>
<body id="top" class="spot-page spot-page-utility" data-spot-page-shared-context="utility" data-spot-page-shared-lang="${lang}" data-spot-page-shared-root="${prefix||'./'}" data-spot-page-shared-route="window-artworks.html"><a class="skip-link" href="#artworks">${esc(c.skip)}</a><div data-spot-page-shared-module="topbar"></div><main class="artworks-main"><header class="artworks-heading"><p class="eyebrow">WINDOW ARTWORKS</p><h1>${esc(c.title)}</h1><p><strong>${esc(c.lead)}</strong></p><p>${esc(c.intro)}</p></header><div class="spot-page-shell"><aside data-spot-page-shared-module="rail"></aside><div class="spot-page-article"><section class="artworks-grid" id="artworks" aria-label="${esc(c.title)}">${cards}</section><p class="artworks-note">${esc(c.note)}</p></div></div></main><section data-spot-page-shared-module="content-rail"></section><footer class="footer"><p class="footer-brand">${lang==='ja'?'新幹線の窓':'Shinkansen Window'}</p><p class="footer-links"><a href="${lang==='en'?'./':'index.html'}">${lang==='ja'?'ホーム':'Home'}</a> · <a href="zukan.html">${lang==='ja'?'車窓図鑑':'Window field guide'}</a> · <a href="contact.html">${lang==='ja'?'お問い合わせ':'Contact'}</a> · <a href="privacy.html">${lang==='ja'?'プライバシー':'Privacy'}</a></p></footer><script src="${prefix}spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script><script src="${prefix}spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script></body></html>
`;
 html=enhanceContentHead(html,route,root);
 const target=path.join(root,route),old=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';
 if(old!==html){if(process.argv.includes('--check'))throw Error(`${route} is stale`);fs.writeFileSync(target,html);changed++;}
}
console.log(`Window artworks pages: ${changed} changed; ${works.length} published works.`);
