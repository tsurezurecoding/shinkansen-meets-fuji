import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const plan=JSON.parse(fs.readFileSync(path.join(root,'data/window-trip-photo-plan.json'),'utf8'));
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8')+';globalThis.spots=SPOTS;globalThis.boards=BOARD_COLLECTION;globalThis.route=ROUTE;',ctx);
vm.runInContext(fs.readFileSync(path.join(root,'track.js'),'utf8'),ctx);
const track=ctx.window.MADO_TRACK,source=Array.from(ctx.spots),text=v=>typeof v==='string'?v:v?.ja||'',photos=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
function record(item,p,light){
 assert.equal(text(p.credit),'michikusa',item.id+' must use registered owner photography');
 assert(/^images\/[a-zA-Z0-9_.-]+$/.test(p.src),item.id+' photo path');
 const bytes=fs.readFileSync(path.join(root,p.src)),date=p.date||p.credit?.date||p.src.slice(7,15).replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3');
 const note=text(p.note||p.credit?.note),alt=text(p.alt)||item.ja+'の車窓';
 if(light==='day')assert(!/夕暮れ|夕焼け|薄暮|朝焼け|night|dusk|sunset/i.test(note+' '+alt)&&p.timeOfDay!=='night',item.id+' is not a day photograph');
 const photo={src:p.src,credit:'michikusa',date,note,alt,light};
 photos.push({stopId:item.id,kind:item.kind,...photo,sha256:sha(bytes),bytes:bytes.length,lightEvidence:p.src.startsWith('images/20261018_')?'2026-10-18 owner night photograph and GPX review':'2026-10-12 source annotation and original photograph review'});return photo;
}
const scenery=plan.day.map(([id,file,category])=>{
 const s=source.find(s=>s.id===id);assert(s,'Unknown spot '+id);const p=s.viewpoint||s.map;assert(p,'Missing position '+id);
 const item={id,ja:s.ja.name,en:s.en.name,side:s.side,lat:p.lat,lng:p.lng,km:track.projectToTrack(p.lat,p.lng).km,kind:'scenery',category,recommended:plan.recommended.includes(id),boardRecommended:false,segment:s.ja.area||'',description:s.ja.hook||'',coordinateApproximate:!s.viewpoint,coordinateNote:s.viewpoint?'':'通過位置は施設座標から投影した目安です。',coordinateSource:s.viewpoint?'SPOTS.viewpoint':'SPOTS.map',photosByLight:{},focus:{x:.5,y:.5},sourceLink:'spots/'+id+'.html'};
 assert(['A','E'].includes(item.side));
 const options=[{src:s.image,credit:s.photoCredit,date:s.photoCredit?.date,note:s.photoCredit?.note},...Array.from(s.photos||[])];
 for(const [light,name]of [['day',file],['night',plan.night[id]]])if(name){const photo=options.find(p=>p.src==='images/'+name);assert(photo,id+' selected photo is not registered: '+name);item.photosByLight[light]=record(item,photo,light);}
 assert(Object.keys(item.photosByLight).length,id+' has no playable photo');item.photo=item.photosByLight.day||item.photosByLight.night;return item;
});
const boardExclusions=[22,25,34,42];
const boards=Array.from(ctx.boards).filter(b=>b.photo&&!boardExclusions.includes(b.sourceNo)&&!['removed','not-found'].includes(b.siteStatus)).map(b=>{
 const item={id:b.id,sourceNo:b.sourceNo,ja:b.collectionJaName||b.ja?.name||b.ja,en:b.en?.name||b.en,side:b.side,lat:b.lat,lng:b.lng,km:track.projectToTrack(b.lat,b.lng).km,kind:'727',category:'727',recommended:false,boardRecommended:plan.boardRecommended.includes(b.sourceNo),segment:b.segment||'',coordinateApproximate:false,photosByLight:{},focus:{x:.5,y:.6},sourceLink:'727-collection.html'};
 assert(['A','E'].includes(item.side));item.photosByLight.day=record(item,{...b.photo,credit:b.photo.credit||'michikusa'},'day');item.photo=item.photosByLight.day;return item;
});
const coverage=source.map(s=>{const included=scenery.find(x=>x.id===s.id),alias=plan.aliases.find(x=>x.id===s.id),excluded=plan.excluded.find(x=>x.id===s.id);assert(included||alias||excluded,'Inventory decision needed for new spot '+s.id);return{id:s.id,state:included?'included':alias?'alias':'excluded',representativeIds:included?[s.id]:alias?.representativeIds||[],reason:excluded?.reason||''};});
const refs=new Map(Array.from(ctx.route.refStations,s=>[s.id,s]));
const stops=[...scenery,...boards].sort((a,b)=>a.km-b.km);assert.equal(new Set(stops.map(s=>s.id)).size,stops.length);
const counts={scenery:scenery.length,boards:boards.length,dayScenery:scenery.filter(s=>s.photosByLight.day).length,nightScenery:scenery.filter(s=>s.photosByLight.night).length};
const data={points:Array.from(track.points,({lat,lng,km})=>({lat,lng,km})),stations:Array.from(track.points).filter(p=>p.st).map(p=>({id:p.st,ja:refs.get(p.st)?.ja||p.st,lat:p.lat,lng:p.lng,km:p.km})),stops,totalKm:track.totalKm,trainSprite:'window-trip-assets/train.png',counts,sourceRegistryCoverage:{total:source.length,includedScenery:scenery.length,items:coverage},exclusions:plan.excluded};
const outputs={'window-trip-data.js':'// Generated from registered owner photos and current route positions.\nwindow.FLIGHT_DATA = '+JSON.stringify(data)+';\n','data/window-trip-photo-sources.json':JSON.stringify({reviewed:plan.reviewed,counts,coverage,photos,mapCredit:'地理院タイル（淡色地図を加工）',sourceHashes:Object.fromEntries(['data.js','track.js'].map(p=>[p,sha(fs.readFileSync(path.join(root,p)))]))},null,2)+'\n'};
for(const [file,content]of Object.entries(outputs)){const target=path.join(root,file),old=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';if(old===content)continue;if(process.argv.includes('--check'))throw Error(file+' is stale');fs.writeFileSync(target,content);}
console.log('Window trip data: '+JSON.stringify(counts)+'; source inventory '+coverage.length+'; reviewed photos '+photos.length);
