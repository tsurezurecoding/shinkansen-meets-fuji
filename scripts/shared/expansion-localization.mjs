import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const EXPANSION_ROUTES = ['everyday-japan.html','arenani.html','727-collection.html','spots/727-board.html','ferris-wheels.html','spots/hirakata-park-wheel.html','tokyo-kyoto-stations.html','spots/kirin-beer-factory.html','spots/sapporo-shizuoka-factory.html','spots/lotte-shiga.html','spots/nichiban-anjo.html','spots/shizuoka-tea-fields.html',"spots/tokyo-tower.html","spots/ota-fuji.html","spots/solar-ark.html","spots/shimizu-port-chikyu.html","spots/torikai-train-depot.html","spots/maibara-test-trains.html","jr-pass-fuji.html","hanabi.html","spots/seta-karahashi.html","spots/musashi-kosugi-towers.html"];
export const BOARD_TEMPLATE_ARGUMENTS = {points:['n'],records:['n'],groupRecords:['n'],progress:['found','total'],stageBody:['n'],fromTokyo:['n'],fromOsaka:['n'],summaryTime:['n'],mapAria:['name'],minutes:['n'],minutesRange:['a','b'],segmentTimeRange:['range'],mapStatusAll:['n']};
let boardSource;
function boardEnglish(root) {
  if (boardSource) return boardSource;
  const code=fs.readFileSync(path.join(root,'727-collection.js'),'utf8');
  const text=vm.runInNewContext('('+code.slice(code.indexOf('var TEXT = ')+11,code.indexOf('\n  };',code.indexOf('var TEXT = '))+4).replace(/;\s*$/,'')+')').en;
  const data=vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8')+'\n;({points:BOARD_COLLECTION,stations:ROUTE.refStations})');
  const templates=Object.fromEntries(Object.entries(text).map(([key,value])=>[key,typeof value==='function'?value(...BOARD_TEMPLATE_ARGUMENTS[key].map(name=>'{'+name+'}')):value]));
  templates.photoLabel='Photographs';
  boardSource={...data,templates};return boardSource;
}
function wheelConfig(doc) {
  const script=[...doc.querySelectorAll('script:not([src])')].find(el=>el.textContent.includes('window.FERRIS_WHEEL_COLLECTION ='));
  if(!script)throw Error('Missing wheel config');
  const context={window:{}};vm.runInNewContext(script.textContent,context);return {script,config:context.window.FERRIS_WHEEL_COLLECTION};
}
export function expansionRuntimeStrings(root,route,doc) {
  if(route==='hanabi.html')return [...new Set([...doc.querySelectorAll('[data-placeholder]')].map(el=>el.getAttribute('data-placeholder')))];
  if(route==='tokyo-kyoto-stations.html')return ['Show the dome in this photo','Hide the dome marker'];
  if(route==='727-collection.html'){
    const data=boardEnglish(root),keys=new Set(Object.values(data.templates));
    for(const station of data.stations)keys.add(station.en);
    for(const point of data.points){keys.add(typeof point.en==='object'?point.en.name:point.en);if(point.collectionNoteEn)keys.add(point.collectionNoteEn);for(const photo of [point.photo,...(point.collectionPhotos||[])].filter(Boolean))if(photo.noteEn)keys.add(photo.noteEn);}
    return [...keys].filter(Boolean);
  }
  if(route==='ferris-wheels.html'){const {config}=wheelConfig(doc);return [...Object.values(config.text),...config.stages.flatMap(stage=>[stage.title,stage.body])];}
  return [];
}
export function localizeExpansionRuntime(root,route,doc,lang,tr){
  if(route==='hanabi.html')for(const el of doc.querySelectorAll('[data-placeholder]'))el.setAttribute('data-placeholder',tr(el.getAttribute('data-placeholder')));
  if(route==='jr-pass-fuji.html')for(const script of doc.querySelectorAll('script:not([src]):not([type])')){
    if(script.textContent.includes('jrpass_cta_click'))script.textContent=script.textContent.replace(/language:\s*"en"/, 'language: '+JSON.stringify(lang));
  }
  if(route==='tokyo-kyoto-stations.html'){const button=doc.querySelector('.clue-toggle');button.dataset.showLabel=tr('Show the dome in this photo');button.dataset.hideLabel=tr('Hide the dome marker');for(const photo of doc.querySelectorAll('[data-alt]'))photo.dataset.alt=tr(photo.dataset.alt);}
  if(route==='727-collection.html'){
    const data=boardEnglish(root);
    const config={lang,text:Object.fromEntries(Object.entries(data.templates).map(([k,v])=>[k,tr(v)])),arguments:BOARD_TEMPLATE_ARGUMENTS,stations:Object.fromEntries(data.stations.map(s=>[s.ja,tr(s.en)])),points:Object.fromEntries(data.points.map(point=>[point.id,{name:tr(typeof point.en==='object'?point.en.name:point.en),note:point.collectionNoteEn?tr(point.collectionNoteEn):'',photos:[point.photo,...(point.collectionPhotos||[])].filter(Boolean).map(p=>({alt:tr(typeof point.en==='object'?point.en.name:point.en),note:p.noteEn?tr(p.noteEn):p.note||'michikusa'}))}]))};
    const script=doc.createElement('script');script.textContent='window.MADO_727_LOCALE = '+JSON.stringify(config).replaceAll('<','\\u003c')+';';
    const runtime=doc.querySelector('script[src*="727-collection.js"]');if(!runtime)throw Error('Missing 727 runtime');runtime.before(script);
  }
  if(route==='ferris-wheels.html'){const {script,config}=wheelConfig(doc);config.lang=lang;for(const key of Object.keys(config.text))config.text[key]=tr(config.text[key]);for(const stage of config.stages){stage.title=tr(stage.title);stage.body=tr(stage.body);}script.textContent='window.FERRIS_WHEEL_COLLECTION = '+JSON.stringify(config).replaceAll('<','\\u003c')+';';}
}
