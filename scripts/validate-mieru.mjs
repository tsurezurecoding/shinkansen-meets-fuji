import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { MIERU_CONTENT } from './shared/mieru-content.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
import { languages as langs, translated } from './shared/locales.mjs';
const ids=MIERU_CONTENT.photos.map(p=>p.id);
const fixture=i=>({hourly:Object.fromEntries(['cloud_cover_low','cloud_cover_mid','cloud_cover_high','visibility','relative_humidity_2m','precipitation'].map(k=>[k,Array.from({length:48},(_,h)=>k==='visibility'?8000+(h+i)%9*5000:k==='relative_humidity_2m'?40+(h+i)%40:k==='precipitation'?((h+i)%13===0?.4:0):(h*7+i*11)%100)]))});
async function page(lang,query=''){
 const route=(lang==='ja'?'':lang+'/')+'mieru.html',dom=new JSDOM(read(route),{url:'https://www.michikusa-travel.com/'+route+query,runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.eval(read('data-runtime.js')+';Object.assign(window,{SPOTS,ROUTE});');w.eval(read('train-select.js'));
 if(translated.includes(lang)){w.eval(read(lang+'/utility-data.js'));w.eval(read('utility-locale-runtime.js'));}
 w.fetch=async()=>({ok:true,json:async()=>Array.from({length:6},(_,i)=>fixture(i))});
 const append=d.head.appendChild.bind(d.head);let loads=0;
 d.head.appendChild=function(el){if(el.tagName==='SCRIPT'&&el.src.includes('/data/timetable.js')){loads++;queueMicrotask(()=>{w.eval(read('data/timetable.js'));el.onload();});return el;}return append(el);};
 w.eval(read('mieru.js'));await new Promise(r=>setImmediate(r));
 return {dom,w,d,loads:()=>loads};
}
let scenarios=0;
const pages=await Promise.all(langs.map(lang=>page(lang)));
for(let li=0;li<langs.length;li++){
 const lang=langs[li],{d,w,loads}=pages[li];
 const cards=[...d.querySelectorAll('.mieru-fact')];assert(cards.length===5,lang+': five static explanations missing');
 assert(cards.map(x=>x.dataset.viewpoint).join('|')===ids.join('|'),lang+': viewpoint order differs');
 cards.forEach((card,i)=>{const photo=MIERU_CONTENT.photos[i],img=card.querySelector('img'),url=new URL(img.src);assert(url.pathname==='/'+photo.src,lang+': photo differs '+photo.id);assert(img.alt.trim()&&img.width>0&&img.height>0,lang+': photo alt/dimensions missing');assert(card.querySelector('.mieru-fact-body')?.textContent.length>50,lang+': explanation missing');if(photo.credit){const credit=card.querySelector('figcaption a');assert(credit?.textContent===photo.credit&&credit.href===photo.sourceUrl,lang+': attribution changed '+photo.id);}assert(fs.existsSync(path.join(root,new URL(card.querySelector('.mieru-fact-more').href).pathname.slice(1))),lang+': article destination missing');});
 assert(loads()===0,lang+': timetable must stay lazy before train search');
 assert(d.querySelector('script[src*="train-select.js"]')&&d.querySelector('script[src*="mieru.js"]'),lang+': shared runtimes missing');
 assert(w.__mieru.state.board==='Tokyo'&&w.__mieru.state.dir==='west',lang+': default journey differs');
}
function snapshots(){return pages.map(({w})=>JSON.parse(JSON.stringify(w.__mieru.results)));}
function compare(msg,expectedCount){const rows=snapshots();assert(Object.keys(rows[0]).length===expectedCount,msg+': expected nonempty calculated viewpoints');for(let i=1;i<rows.length;i++)assert(JSON.stringify(rows[i])===JSON.stringify(rows[0]),msg+': '+langs[i]+' numeric values differ from Japanese');scenarios++;}
for(const [day,time,board,dir,count]of [[0,'09:25','Tokyo','west',5],[1,'12:05','Tokyo','west',5],[0,'08:00','Nagoya','east',5],[1,'10:10','Shizuoka','west',2],[0,'07:35','Odawara','east',2]]){
 for(const {d}of pages){d.getElementById('mieruModeTime').click();d.getElementById('mieruBoard').value=board;d.getElementById('mieruBoard').dispatchEvent(new d.defaultView.Event('change'));d.getElementById('mieruDir').value=dir;d.getElementById('mieruDir').dispatchEvent(new d.defaultView.Event('change'));d.getElementById('mieruDay').value=day;d.getElementById('mieruDay').dispatchEvent(new d.defaultView.Event('change'));d.getElementById('mieruDep').value=time;d.getElementById('mieruDep').dispatchEvent(new d.defaultView.Event('input'));}
 compare('manual '+board+'/'+dir+'/'+day,count);
}
for(const [board,dir]of [['Tokyo','west'],['Nagoya','east']]){
 for(const {d,w}of pages){d.getElementById('mieruBoard').value=board;d.getElementById('mieruBoard').dispatchEvent(new w.Event('change'));d.getElementById('mieruDir').value=dir;d.getElementById('mieruDir').dispatchEvent(new w.Event('change'));d.getElementById('mieruModeTrain').click();d.getElementById('mieruTrainSearchBtn').click();await new Promise(r=>setImmediate(r));const chip=d.querySelector('#mieruTrainResults button[data-i]');assert(chip,board+': no train candidates');chip.click();assert(d.querySelector('#mieruRide b'),board+': selected train forecast missing');}
 compare('train '+board+'/'+dir,5);
}
for(let i=0;i<pages.length;i++){
 const p=pages[i],href=p.w.madoMieruPageHref(langs[(i+1)%langs.length]),url=new URL(href);
 assert(url.searchParams.get('board')==='Nagoya'&&url.searchParams.get('dir')==='east'&&url.searchParams.get('train'),langs[i]+': selected train lost on language switch');
 const restored=await page(langs[(i+1)%langs.length],url.search);assert(restored.w.__mieru.state.selectedTrain?.tr.type===p.w.__mieru.state.selectedTrain.tr.type&&restored.w.__mieru.state.selectedTrain?.tr.number===p.w.__mieru.state.selectedTrain.tr.number,'train restoration changed');
 assert(JSON.stringify(restored.w.__mieru.results)===JSON.stringify(p.w.__mieru.results),'restored train forecast differs');restored.dom.window.close();
 p.d.getElementById('mieruBoard').value='Tokyo';p.d.getElementById('mieruBoard').dispatchEvent(new p.w.Event('change'));p.d.getElementById('mieruDir').value='east';p.d.getElementById('mieruDir').dispatchEvent(new p.w.Event('change'));
 assert(!Object.keys(p.w.__mieru.results).length,'stale forecast remains for no viewpoints');p.dom.window.close();
}
console.log(`Forecast PASS: 4 languages, 20 static photo explanations/credits, ${scenarios} nonempty calculation scenarios, 4 train language restorations, lazy timetable and stale-result clearing.`);
