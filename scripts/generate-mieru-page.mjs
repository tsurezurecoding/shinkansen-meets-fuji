import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { MIERU_CONTENT } from './shared/mieru-content.mjs';
import { MIERU_COPY } from './shared/mieru-copy.mjs';
import { assetVersion } from './shared/asset-version.mjs';
import { withUtilityLocales } from './shared/utility-locales.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const check=process.argv.includes('--check');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const HERO_PHOTO = 'images/thumbs/display/20240211_fuji_michikusa-ece7c5cc-640.webp';
const UI = {
  ja: {
    near: '新富士付近の見え方', focus: '三島〜新富士・E席・富士山まで約24km', date: '予報の対象日',
    hourly: '時間別に見る', photo: '新富士の車窓', ride: '自分の列車の予報を見る',
    rideHint: '列車を選ぶ・出発時刻から調べる', mode: '出発の指定方法',
    train: '列車を選ぶ', time: '時刻を入力', camera: '今の富士山をカメラで見る',
    cameraCredit: '富士市役所からの眺めです。撮影時刻はリンク先で確認できます。',
    hours: '6時〜19時の見える確率（日本時間）', loading: '気象データ取得中…',
  },
  en: {
    near: 'Visibility near Shin-Fuji', focus: 'Mishima to Shin-Fuji · Seat E · About 24 km to Mt. Fuji', date: 'Forecast date',
    hourly: 'See hourly forecast', photo: 'View from the train near Shin-Fuji', ride: 'See the forecast for your train',
    rideHint: 'Choose a train or enter a departure time', mode: 'Choose how to set your departure',
    train: 'Choose a train', time: 'Enter a time', camera: 'See Mt. Fuji on the live camera',
    cameraCredit: 'View from Fuji City Hall. Check when the image was taken on the linked page (Japanese).',
    hours: 'Visibility chance, 06:00–19:00 Japan time', loading: 'Loading weather data...',
  },
};

function dateButtons(ui) {
  return `<div class="forecast-days" role="group" aria-label="${esc(ui.date)}" hidden><button type="button" data-day="0" aria-pressed="true"></button><button type="button" data-day="1" aria-pressed="false"></button></div>`;
}

function forecastUI(lang, prefix) {
  const ui = UI[lang];
  const hour = h => lang === 'ja' ? h + '時' : String(h).padStart(2, '0') + ':00';
  return `<section class="weather-focus" aria-labelledby="focus-title">
  <div class="weather-focus-head"><h2 id="focus-title">${esc(ui.near)}</h2><p>${esc(ui.focus)}</p>${dateButtons(ui)}</div>
  <div class="weather-feature"><div class="weather-reading">
    <p id="mieruStatus" role="status">${esc(ui.loading)}</p>
    <div id="mieruForecastContext" aria-live="polite" hidden>
      <p class="weather-date" id="mieruForecastDate"></p>
      <dl id="weather-periods" class="weather-periods">${[8,12,16].map(h => `<div><dt>${hour(h)}</dt><dd><strong data-hour="${h}"></strong>%</dd></div>`).join('')}</dl>
    </div>
    <a class="weather-hours-link" href="#hour-fuji">${esc(ui.hourly)} <span aria-hidden="true">↓</span></a>
  </div>
  <figure class="weather-photo"><img src="${prefix+HERO_PHOTO}" alt="${esc(MIERU_CONTENT.photos[2].alt[lang])}" width="640" height="360" fetchpriority="high"><figcaption>${esc(ui.photo)}</figcaption></figure></div>
  <p id="mieruRetrievedAt" class="weather-stamp" hidden></p>
</section>
<details class="ride-panel" id="ride"><summary><span><strong>${esc(ui.ride)}</strong><small>${esc(ui.rideHint)}</small></span><span class="disclosure-mark" aria-hidden="true"></span></summary>
  <div class="ride-content"><div class="ride-modes" role="group" aria-label="${esc(ui.mode)}"><button type="button" id="mieruModeTrain" aria-pressed="true">${esc(ui.train)}</button><button type="button" id="mieruModeTime" aria-pressed="false">${esc(ui.time)}</button></div>
  <div id="forecast-picker" class="setup-card"></div><p id="picker-status" role="status"></p><div id="mieruRide" aria-live="polite"></div></div>
</details>
<aside class="camera-note"><a href="https://www.city.fuji.shizuoka.jp/1005330000/p007780.html" target="_blank" rel="noopener noreferrer">${esc(ui.camera)} <span aria-hidden="true">↗</span></a><p>${esc(ui.cameraCredit)}</p></aside>`;
}
function write(file,text){const dest=path.join(root,file),old=fs.existsSync(dest)?fs.readFileSync(dest,'utf8'):'';if(old===text)return;if(check)throw Error('Stale forecast output: '+file);fs.writeFileSync(dest,text);}
function dimensions(file){const b=fs.readFileSync(path.join(root,file));for(let i=2;i<b.length;){if(b[i++]!==255)continue;let type=b[i++];while(type===255)type=b[i++];if(type===0xd8||type===0xd9)continue;const n=b.readUInt16BE(i);if([0xc0,0xc1,0xc2].includes(type))return {width:b.readUInt16BE(i+5),height:b.readUInt16BE(i+3)};i+=n;}throw Error('JPEG dimensions missing: '+file);}
const runtime='/* Generated from scripts/shared/mieru-runtime.js and mieru-copy.mjs. */\nvar MADO_MIERU_COPY='+JSON.stringify(MIERU_COPY)+';\n'+fs.readFileSync(path.join(root,'scripts/shared/mieru-runtime.js'),'utf8')
  .replace('__TIMETABLE_VERSION__',assetVersion('data/timetable.js')).replace('__PICKER_VERSION__',assetVersion('train-picker.js'));
write('mieru.js',runtime);
for(const lang of ['ja','en']){
 const file=(lang==='ja'?'':'en/')+'mieru.html',prefix=lang==='ja'?'':'../',copy=MIERU_CONTENT[lang];
 const facts=copy.facts.map((fact,i)=>{const photo=MIERU_CONTENT.photos[i],size=dimensions(photo.src),href='spots/'+(photo.id==='hamanako-fuji'?'hamanako.html#hamanako-fuji':photo.id+'.html');return `<article class="mieru-fact" data-viewpoint="${photo.id}" id="hour-${photo.id}" aria-labelledby="view-${photo.id}">
  <header class="region-card-heading"><h3 id="view-${photo.id}">${esc(fact.title)} <span>${esc(fact.area)}</span></h3>
  <p class="mieru-fact-meta">${esc(fact.meta)}</p></header>
  <p class="region-chart-date" hidden></p><dl class="region-hours"></dl>
  <figure class="mieru-fact-photo"><a href="${href}" aria-label="${esc(copy.more+': '+fact.title)}"><img src="${prefix+photo.src}" alt="${esc(photo.alt[lang])}" width="${size.width}" height="${size.height}" loading="lazy" decoding="async"></a>${photo.credit?`<figcaption class="show-credit"><a href="${esc(photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(photo.credit)}</a></figcaption>`:''}</figure>
  <div class="mieru-fact-copy"><p class="mieru-fact-body">${esc(fact.body)}</p>
  <a class="mieru-fact-more" href="${href}">${esc(copy.more)} →</a></div>
</article>`;}).join('\n');
 let html=fs.readFileSync(path.join(root,'scripts/templates/mieru-'+lang+'.html.tpl'),'utf8');
 for(const [key,value]of Object.entries({CSS:`<link rel="stylesheet" href="${prefix}mieru.css?v=${assetVersion('mieru.css')}">`,RUNTIME:`<script src="${prefix}mieru.js?v=${assetVersion('mieru.js')}"></script>`,UI:forecastUI(lang,prefix),ANSWER:`<section class="mieru-answer">${copy.answer}</section>`,FACTS:`<section class="mieru-factset" aria-labelledby="region-title"><h2 id="region-title">${esc(copy.heading)}</h2><div class="region-controls">${dateButtons(UI[lang])}</div><p class="region-note">${esc(UI[lang].hours)}</p><div class="mieru-factlist">${facts}</div><p>${esc(copy.intro)}</p></section>`})){
  const marker=`<!--MIERU:${key}-->`;if(!html.includes(marker))throw Error('Forecast template marker missing: '+marker);html=html.replace(marker,value);
 }
 const dom=new JSDOM(html,{url:'https://www.michikusa-travel.com/'+file});
 for(const el of dom.window.document.querySelectorAll('script[src],link[rel="stylesheet"]')){const attr=el.tagName==='SCRIPT'?'src':'href',value=el.getAttribute(attr);if(/^(https?:|\/\/)/.test(value))continue;const asset=new URL(value,dom.window.document.URL).pathname.slice(1);el.setAttribute(attr,value.split('?')[0]+'?v='+assetVersion(asset));}
 write(file,withUtilityLocales(dom.serialize(),file));
}
console.log('Forecast: Japanese/English sources, five photo explanations and one shared calculation runtime.');
