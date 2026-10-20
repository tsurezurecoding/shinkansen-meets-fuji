import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('./yamazaki-translations.json',import.meta.url),'utf8'));
export const YAMAZAKI_LANGS=Object.keys(data.translations);
export const YAMAZAKI_TRANSLATIONS=Object.fromEntries(YAMAZAKI_LANGS.map(lang=>[lang,Object.fromEntries(data.source.map((s,i)=>[s,data.translations[lang][i]]))]));
// Can be applied to an English payload or a snapshot object without changing coordinates, credit or source URLs.
export function localizeYamazakiPayload(payload,lang){
 const copy=YAMAZAKI_TRANSLATIONS[lang];if(!copy)return structuredClone(payload);
 function visit(value){if(typeof value==='string')return copy[value]??value;if(Array.isArray(value))return value.map(visit);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v)]));return value;}
 const result=visit(payload);
 if(result.id==='yamazaki-distillery'&&result.lang){result.lang=lang;if(result.guide?.href)result.guide.href=`../../${lang}/start.html#journey`;for(const ch of result.chapters||[])if(ch.link?.route==='en/beer-on-shinkansen.html')ch.link.route=`${lang}/beer-on-shinkansen.html`;if(result.map){result.map.name=copy[payload.map.name]??result.map.name;for(const key of ['embedUrl','viewpointUrl'])if(result.map[key])result.map[key]=result.map[key].replace(/language=en/,`language=${lang==='zh-Hant'?'zh-TW':lang==='zh-Hans'?'zh-CN':lang}`);}}
 return result;
}
