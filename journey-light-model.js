/* Moving-train solar position and date-aware encounter model. */
(function(root){
  'use strict';
  const DAY=86400000, RAD=Math.PI/180;
  const norm=(x,n)=>((x%n)+n)%n;
  const pad=x=>String(x).padStart(2,'0');
  function dateEpoch(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return null;
    const year=Number(date.slice(0,4));
    if(year<1901||year>2099)return null;
    const t=Date.parse(date+'T00:00:00+09:00');
    return Number.isFinite(t)&&new Date(t+9*3600000).toISOString().slice(0,10)===date?t:null;
  }
  function jstParts(now=Date.now()){
    const d=new Date(Number(now)+9*3600000);
    return {date:d.toISOString().slice(0,10),time:pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())};
  }
  function clockLabel(date,minute){
    const t=dateEpoch(date);if(t==null||!Number.isFinite(minute))return '—';
    const rounded=Math.round(minute),offset=Math.floor(rounded/1440),clock=norm(rounded,1440);
    const day=offset===0?'':offset===1?'翌日 ':offset===-1?'前日 ':new Date(t+offset*DAY+9*3600000).toISOString().slice(5,10)+' ';
    return day+pad(Math.floor(clock/60))+':'+pad(clock%60);
  }
  /* NOAA/Meeus solar position: https://gml.noaa.gov/grad/solcalc/calcdetails.html
     Geometric solar-center altitude; -0.833° standard rise/set, -6° civil twilight.
     Terrain, tunnels, altitude and weather are deliberately not modeled. */
  function solarAltitude(epoch,lat,lng){
    if(![epoch,lat,lng].every(Number.isFinite)||Math.abs(lat)>90||Math.abs(lng)>180)return NaN;
    const T=(epoch/DAY+2440587.5-2451545)/36525;
    const L=norm(280.46646+T*(36000.76983+0.0003032*T),360)*RAD;
    const M=(357.52911+T*(35999.05029-0.0001537*T))*RAD;
    const e=0.016708634-T*(0.000042037+0.0000001267*T);
    const C=Math.sin(M)*(1.914602-T*(0.004817+0.000014*T))+Math.sin(2*M)*(0.019993-0.000101*T)+Math.sin(3*M)*0.000289;
    const omega=(125.04-1934.136*T)*RAD;
    const lambda=L+C*RAD-0.00569*RAD-0.00478*RAD*Math.sin(omega);
    const obliq=(23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60+0.00256*Math.cos(omega))*RAD;
    const decl=Math.asin(Math.sin(obliq)*Math.sin(lambda)),y=Math.tan(obliq/2)**2;
    const eq=4/RAD*(y*Math.sin(2*L)-2*e*Math.sin(M)+4*e*y*Math.sin(M)*Math.cos(2*L)-0.5*y*y*Math.sin(4*L)-1.25*e*e*Math.sin(2*M));
    const utcMinute=norm(epoch,DAY)/60000;
    const hourAngle=(norm(utcMinute+eq+4*lng,1440)/4-180)*RAD;
    const sine=Math.sin(lat*RAD)*Math.sin(decl)+Math.cos(lat*RAD)*Math.cos(decl)*Math.cos(hourAngle);
    return Math.asin(Math.max(-1,Math.min(1,sine)))/RAD;
  }
  function phase(alt){return !Number.isFinite(alt)?'unknown':alt>=-0.833?'day':alt>=-6?'twilight':'night';}
  function context(date,timetable,now=Date.now()){
    const epoch=dateEpoch(date),today=jstParts(now).date;
    if(epoch==null)return {status:'invalid',message:'乗車日を正しく選んでください。太陽計算の範囲は1901〜2099年です。'};
    if(date<timetable.validFrom)return {status:'before-dataset',message:'時刻表データの対象開始日より前です。この日の便とすれ違いは判定できません。'};
    const monthMatch=/october-2026/.test(timetable.datasetId||'')&&date.startsWith('2026-10');
    const relation=date<today?'past':date>today?'future':'today';
    const caution=relation==='past'?'過去日です。当時のダイヤは未照合。':relation==='future'?'未来日です。その日の便の運行は未確認。':'今日の運行変更・遅延は未反映。';
    return {status:'reference',relation,monthMatch,message:caution+(monthMatch?'':'10月固定ダイヤで走ると仮定した参考です。')};
  }
  function movingSolar({journey,date,track,trainSelect}){
    const epoch=dateEpoch(date),stops=journey?.stops;
    if(epoch==null||!stops?.length||stops.length<2||!track||!trainSelect)return {status:'unavailable',events:[],segments:[],at:()=>null};
    const start=journey.depMin,end=stops.at(-1).arr??stops.at(-1).clock;
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>1440||stops.some((s,i)=>!Number.isFinite(s.clock)||(i&&s.clock<stops[i-1].clock)))return {status:'unsupported-journey',events:[],segments:[],at:()=>null};
    const at=minute=>{
      const ref=trainSelect.positionAt(stops,minute);if(ref==null)return null;
      const km=track.minToKm(ref),pos=track.latLngAtKm(km);if(!Number.isFinite(km)||!pos)return null;
      const altitude=solarAltitude(epoch+minute*60000,pos.lat,pos.lng),segment=track.segmentAtKm(km);
      return {minute,ref,km,...pos,altitude,phase:phase(altitude),segment};
    };
    const first=at(start);if(!first||!Number.isFinite(first.altitude))return {status:'unavailable',events:[],segments:[],at};
    const events=[];
    for(const threshold of [-6,-0.833]){
      let a=start,prev=at(a);
      for(let b=Math.min(a+1,end);a<end;b=Math.min(b+1,end)){
        const next=at(b);
        if(prev&&next&&((prev.altitude<threshold&&next.altitude>=threshold)||(prev.altitude>=threshold&&next.altitude<threshold))){
          let lo=a,hi=b,loValue=prev.altitude-threshold;
          for(let i=0;i<16&&hi-lo>1/120;i++){
            const mid=(lo+hi)/2,v=at(mid);if(!v)break;
            if((v.altitude-threshold)*loValue<=0)hi=mid;else{lo=mid;loValue=v.altitude-threshold;}
          }
          const minute=(lo+hi)/2,point=at(minute),rising=next.altitude>prev.altitude;
          const kind=threshold===-0.833?(rising?'sunrise':'sunset'):(rising?'civil-dawn':'civil-dusk');
          events.push({kind,minute,point,threshold,rising});
        }
        a=b;prev=next;
      }
    }
    events.sort((a,b)=>a.minute-b.minute);
    const cuts=[start,...events.map(e=>e.minute),end],segments=[];
    for(let i=0;i<cuts.length-1;i++)segments.push({start:cuts[i],end:cuts[i+1],phase:at((cuts[i]+cuts[i+1])/2)?.phase||'unknown'});
    return {status:'calculated',start,end,events,segments,at};
  }
  function disney({date,journey,sparkling,timetable,now}){
    const ctx=context(date,timetable,now);
    if(ctx.status!=='reference')return {status:ctx.status};
    if(!journey?.train||journey.preview||journey.mode!=='train')return {status:'unselected'};
    if(!sparkling?.calculate||!sparkling.getScheduleState)return {status:'data-missing'};
    const end=journey.stops?.at(-1);if(end&&Math.max(end.clock,end.arr??0)>=1440)return {status:'cross-day-unknown'};
    const schedule=sparkling.getScheduleState(date);
    if(schedule.status!=='known')return schedule;
    const services=sparkling.PATTERN_SERVICES[schedule.pattern];
    if(!services||services.some(s=>!sparkling.findTrain(s)))return {...schedule,status:'data-missing'};
    const result=sparkling.calculate(date,journey.direction,sparkling.serviceKey(journey.train),journey.boardId);
    if(result.selectedTrain&&JSON.stringify(result.selectedTrain.times)!==JSON.stringify(journey.train.times))return {...schedule,status:'variant-unknown'};
    if(!['encounter','no-encounter','self-match'].includes(result.status))return result;
    return {...result,referenceOnly:ctx.relation==='past'||!ctx.monthMatch};
  }
  const api={dateEpoch,jstParts,clockLabel,solarAltitude,phase,context,movingSolar,disney};
  root.MADO_NIGHT_JOURNEY_MODEL=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
