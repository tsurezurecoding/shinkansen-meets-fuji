import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withLocaleRegistry, supported } from './shared/locales.mjs';
import { assetVersion } from './shared/asset-version.mjs';
import { englishSnapshot } from './shared/castle-localization.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const langs=['zh-Hant','fr','de','es','zh-Hans','ko'];
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'scripts/shared/'+name+'.json'),'utf8'));
const attrs=read('drinks-attributes');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
// Proper names, romanised Japanese label readings and original attribution/file names stay intact.
const retained={drinks:[27,30,33,43,50,53,55,57,63,66,70,80,91,92,99,104,121,123,136,147,151,155,159,162,164,179,184,191,198,200,204,209,217,224,226,228,248,251,252,253,254,273],beer:[38,47,53,59,65,88,89,90,99,154,155,177]};
const englishNote={'zh-Hant':'英文',fr:'anglais',de:'Englisch',es:'inglés','zh-Hans':'英文',ko:'영어'};
const descriptions={
 'zh-Hant':['認識日本瓶裝茶、罐裝咖啡與清涼飲品，辨識日本標籤，連結茶田與車窗工廠。','認識日本常見拉格、閱讀啤酒標籤，搭配便當並尋找沿線釀酒廠。'],
 fr:['Découvrez thés, cafés et sodas japonais, leurs étiquettes et leurs liens avec le paysage du train.','Découvrez les lagers japonaises, leurs étiquettes, le bento et les brasseries près du Shinkansen.'],
 de:['Japanische Tees, Fertigkaffees und Limonaden kennenlernen, Etiketten lesen und ihre Verbindung zum Fensterblick entdecken.','Japanische Lager kennenlernen, Bieretiketten lesen und Brauereien am Shinkansen entdecken.'],
 es:['Conoce tés, cafés y refrescos japoneses, lee sus etiquetas y descubre su conexión con el paisaje del tren.','Conoce las lager japonesas, sus etiquetas, el bento y las fábricas junto al Shinkansen.'],
 'zh-Hans':['认识日本瓶装茶、罐装咖啡与清凉饮品，辨识日本标签，连结茶田与车窗工厂。','认识日本常见拉格、阅读啤酒标签，搭配便当并寻找沿线酿酒厂。'],
 ko:['일본 차·캔커피·청량음료의 라벨을 읽고 차밭과 차창의 공장으로 이야기를 이어 보세요.','일본 라거와 맥주 라벨을 알아보고 도시락과 선로 옆 양조장을 만나 보세요.']
};
function dictionary(data,lang,name){
 return new Map(data.source.map((s,i)=>{const t=data.translations[lang][i];if(t===undefined&&!retained[name].includes(i))throw Error(`Missing ${name} ${lang} ${i}: ${s}`);return[s,t===undefined?s:t];}));
}
function targetRoute(route,lang){
 if(['drinks.html','beer-on-shinkansen.html','spots/yamazaki-distillery.html'].includes(route))return `${lang}/${route}`;
 return supported(route).includes(lang)&&fs.existsSync(path.join(root,lang,route))?`${lang}/${route}`:`en/${route}`;
}
export function generateDrinkLocales(){
 const changes=[];
 for(const [slug,name]of [['drinks','drinks'],['beer-on-shinkansen','beer']]){
  const dom=englishSnapshot(root,slug+'.html');
  dom.window.document.body.setAttribute('data-article-localized','');
  dom.window.document.querySelectorAll('[data-spot-page-shared-module]').forEach(el=>el.removeAttribute('data-spot-page-shared-module'));
  dom.window.document.querySelectorAll('script[src*="spot-page-shared-data"]').forEach(el=>el.remove());
  const source=dom.serialize();dom.window.close();const data=read(name+'-translations');
  for(const lang of langs){
   const common=JSON.parse(fs.readFileSync(path.join(root,`scripts/locales/utility-${lang}.json`),'utf8'));
   const map=dictionary(data,lang,name);for(const [key,value]of [...map])map.set(escape(decode(key)),value);const translate=s=>{if(common[decode(s)]&&!map.has(s))return escape(common[decode(s)]);if(map.has(s))return map.get(s);if(attrs[s]?.[lang])return attrs[s][lang];if(/[A-Za-z]{3}/.test(s)&&!s.startsWith("'+"))throw Error('New untranslated copy: '+s);return s;};
   let html=source.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/g).map(part=>/^<(?:script|style)\b/i.test(part)?part:part.replace(/>([^<>]+)</g,(whole,text)=>'>'+text.replace(/\S[\s\S]*\S|\S/,s=>translate(s))+'<')).join('');
   html=html.replace(/\b(alt|aria-label|title)="([^"]*)"/g,(whole,key,value)=>{
    if(value.startsWith("'+"))return whole;
    if(value.startsWith('Image credit for '))value=data.source[189];
    const t=translate(value);
    return key+'="'+escape(decode(t))+'"';
   });
   html=html.replace(/<meta\b[^>]*(?:property|name)="(?:og|twitter):image:alt"[^>]*>/g,whole=>whole.replace(/content="([^"]*)"/,(m,v)=>'content="'+escape(translate(v))+'"'));
   html=html.replace(/(<html\b[^>]*\blang=)"en"/,`$1"${lang}"`).replace('data-spot-page-shared-lang="en"',`data-spot-page-shared-lang="${lang}"`);
   const title=decode(map.get(data.source[0]));const description=descriptions[lang][name==='drinks'?0:1];
   html=html.replace(/<meta\b([^>]*(?:name="description"|property="og:description")[^>]*)>/g,whole=>whole.replace(/content="[^"]*"/,`content="${escape(description)}"`))
    .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${escape(title)}">`)
    .replace(/https:\/\/www\.michikusa-travel\.com\/en\/(drinks|beer-on-shinkansen)\.html/g,`https://www.michikusa-travel.com/${lang}/$1.html`)
    .replace(/<link\b[^>]*rel="alternate"[^>]*>/g,'');
   html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(whole,json)=>{const d=JSON.parse(json);function walk(x){if(!x||typeof x!=='object'||x['@type']==='Organization')return;for(const k of Object.keys(x)){if(k==='inLanguage')x[k]=lang;else if(['headline','name'].includes(k)&&x[k]===decode(data.source[0]))x[k]=title;else if(k==='description')x[k]=description;else if(k==='caption'&&attrs[x[k]]?.[lang])x[k]=attrs[x[k]][lang];else if(typeof x[k]==='string'&&map.has(x[k]))x[k]=decode(map.get(x[k]));else if(typeof x[k]==='object')walk(x[k]);}}walk(d);return '<script type="application/ld+json">'+JSON.stringify(d)+'</script>';});
   const alternates=['en',...langs].map(l=>`<link rel="alternate" hreflang="${l}" href="https://www.michikusa-travel.com/${l}/${slug}.html">`).join('\n');
   html=html.replace('</head>',alternates+`\n<link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/${slug}.html">\n</head>`);
   html=html.replace(/<a\b([^>]*?)href="([^"#][^"]*)"([^>]*)>([\s\S]*?)<\/a>/g,(whole,before,href,after,body)=>{
    if(/^(?:https?:|mailto:|tel:|javascript:)/.test(href))return whole;
    const url=new URL(href,`https://local/en/${slug}.html`);let route=url.pathname.replace(/^\/en\//,'')||'index.html';if(route.endsWith('/'))route+='index.html';
    if(!route.endsWith('.html'))return whole;
    const target=targetRoute(route,lang);const rel=path.posix.relative(lang,path.posix.dirname(target))+'/'+path.posix.basename(target);const dest=(rel.startsWith('/')?'.'+rel:rel)+url.search+url.hash;
    const fallback=target.startsWith('en/');
    return `<a${before}href="${dest}"${after}${fallback?' hreflang="en"':''}>${body}${fallback?' <small class="article-language-note">('+englishNote[lang]+')</small>':''}</a>`;
   });
   const labels={'zh-Hant':'繁體中文',fr:'Français',de:'Deutsch',es:'Español','zh-Hans':'简体中文',ko:'한국어',en:'English'};
   const menu=`<details class="guide-lang-menu article-lang-menu"><summary>${labels[lang]}</summary><div class="guide-lang-options">${['en',...langs].map(l=>`<a href="../${l}/${slug}.html?lang=${l}" lang="${l}"${l===lang?' aria-current="page"':''}>${labels[l]}</a>`).join('')}</div></details>`;
   html=html.replace('</nav></header>',`</nav>${menu}</header>`);
   if(name==='beer'){
    const t=i=>decode(data.translations[lang][i]||data.source[i]);
    const answers={nama:[t(91),`生 — ${t(93)}`],dry:[t(94),t(95)],black:[t(96),t(97)]};
    html=html.replace(/<script src="\.\.\/beer\.js[^>]*><\/script>/,`<script type="application/json" id="beer-label-copy">${JSON.stringify(answers).replace(/</g,'\\u003c')}</script><script src="../beer.js?v=${assetVersion('beer.js')}"></script>`);
   }
   html=html.replace('</head>',`<link rel="stylesheet" href="../article-locales.css?v=${assetVersion('article-locales.css')}"><script defer src="../article-locales.js?v=${assetVersion('article-locales.js')}"></script></head>`);
   html=withLocaleRegistry(html,'../');
   const relative=`${lang}/${slug}.html`;const output=path.join(root,relative);
   if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==html){changes.push(relative);if(!process.argv.includes('--check')){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);}}
  }
 }
 if(process.argv.includes('--check')&&changes.length)throw Error('Drink locales stale: '+changes.join(', '));
 console.log(`Drink locales: ${changes.length} changed, 12 editions; English sources retained.`);
}
generateDrinkLocales();
