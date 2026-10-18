/* Date-aware light and encounter events for the Japanese train-search timeline. */
(()=>{
  'use strict';
  const M=window.MADO_NIGHT_JOURNEY_MODEL,S=window.SPARKLING_DREAMS_CALCULATOR;
  const byId=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const q=new URLSearchParams(location.search),seed=M.jstParts();
  let rideDate=q.get('rideDate')||seed.date,ready=false,cache=null,view={status:'unselected'};
  const solarNames={sunrise:['☀↑','日の出'],sunset:['☀↓','日の入り']};
  const table=window.SHINKANSEN_TIMETABLE;
  const options=()=>({date:rideDate,journey:typeof journey==='undefined'?null:journey,track:window.MADO_TRACK,trainSelect:window.MADO_TRAIN_SELECT,sparkling:S,timetable:table});
  function model(){
    const o=options(),j=o.journey,key=JSON.stringify([rideDate,j?.preview,j?.direction,j?.boardId,j?.train?.type,j?.train?.number,j?.depMin,j?.stops]);
    if(cache?.key===key)return cache.value;
    const context=M.context(rideDate,table),actual=!!(j?.train&&j.mode==='train'&&!j.preview);
    const solar=actual&&context.status==='reference'?M.movingSolar(o):{status:'unselected',events:[],segments:[],at:()=>null};
    const disney=M.disney(o);cache={key,value:{context,actual,solar,disney}};return cache.value;
  }
  function place(point){
    const s=point?.segment;if(!s)return '沿線';
    const name=x=>x?.ja||(typeof stationLabel==='function'?stationLabel(x?.id):x?.id)||'';
    return s.at?name(s.at)+'付近':name(s.from)+'〜'+name(s.to)+'付近';
  }
  function datedLink(page){return page;}
  function dateNote(){
    const ctx=M.context(rideDate,table),time=byId('departTime')?.value||'';
    const noNext=time>='23:00'?' 翌日の便は自動で足しません。必要なら日付を進めてください。':'';
    byId('nd-date-note').textContent='日本時間（JST）。'+ctx.message+noNext;
    byId('nd-date-note').dataset.status=ctx.status;
    byId('nd-date-note').classList.toggle('nd-warning',ctx.status!=='reference'||ctx.relation!=='today'||!ctx.monthMatch);
  }
  function saveDate(){
    try{const u=new URL(location.href);u.searchParams.set('rideDate',rideDate);history.replaceState(history.state,'',u);}catch{}
  }
  function updateDate(){
    rideDate=byId('nd-date').value;cache=null;saveDate();dateNote();
    if(typeof renderTimeline==='function'&&typeof journey!=='undefined'&&journey)renderTimeline();else enrich();
  }
  function disneyEventId(minute){
    const train=typeof journey==='undefined'?null:journey?.train;
    return ['nd-encounter',rideDate,train?.type,train?.number,Math.round(minute*60)].join('-').replace(/[^a-zA-Z0-9-]/g,'');
  }
  function disneyHTML(r){
    if(r.status!=='encounter')return '';
    return r.matches.map(x=>'<p><a href="#'+disneyEventId(x.time)+'" data-nd-event-target><span class="copy-chunk">'+escape(M.clockLabel(rideDate,x.time))+'頃、</span><span class="copy-chunk">ディズニー新幹線と</span><span class="copy-chunk">すれ違う見込み。</span></a></p>').join('');
  }
  function jumpToEncounter(event){
    const anchor=event.target.closest('a[data-nd-event-target]');if(!anchor)return;
    // Preserve normal modified-click behavior and the existing article link on the target card.
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const target=byId(anchor.hash.slice(1)),link=target?.querySelector('.nd-event-link');
    if(!target||!link)return;
    event.preventDefault();
    const header=document.querySelector('.topbar'),style=header&&getComputedStyle(header);
    const offset=header&&['fixed','sticky'].includes(style.position)?header.getBoundingClientRect().height+Math.max(0,parseFloat(style.top)||0)+16:16;
    target.style.scrollMarginTop=offset+'px';link.classList.add('nd-jump-target');link.focus({preventScroll:true});
    target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function prepareName(li){
    const name=li.querySelector('.tl-name');
    const nameChunks={'浜名湖越しの富士山':[['浜名湖越しの'],['富士山']],'豊橋〜蒲郡のビニールハウス':[['豊橋〜蒲郡の'],['ビニールハウス']],'洛西浄化センターの卵形タンク':[['洛西浄化センターの'],['卵形タンク']],'大塚製薬のポカリスエット工場':[['大塚製薬の'],['ポカリスエット工場']]};
    li.classList.toggle('nd-wide-title',!!name&&[...name.textContent].length>=9);
    const chunks=name&&nameChunks[name.textContent];
    if(chunks)name.innerHTML=chunks.map(part=>'<span class="copy-chunk nd-name-chunk">'+part.map(escape).join('<wbr>')+'</span>').join('');
  }
  function cardLight(li,clock,solar){
    const point=solar.at(clock);if(!point||!Number.isFinite(point.altitude))return;
    const a=point.altitude,next=solar.at(Math.min(clock+1,solar.end));
    const rising=next?next.altitude>point.altitude:false;
    const period=a>=3?'day':a>=-6?(rising?'dawn':'evening'):'night';
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    const cool=smooth((-a-.833)/(6-.833)),warm=Math.exp(-(((a+.833)/3.7)**2))*.8;
    const mix=(x,y,t)=>x.map((v,i)=>v+(y[i]-v)*t),rgb=x=>x.map(Math.round).join(' ');
    const tint=mix(mix([255,255,253],[255,242,224],warm),[231,238,248],cool);
    const face=mix(mix([255,255,255],[255,251,246],warm),[246,249,253],cool);
    const edge=mix(mix([222,219,213],[215,177,136],warm),[137,155,183],cool);
    li.classList.add('nd-ambient');li.dataset.light=period;li.dataset.solarAltitude=a;
    li.style.setProperty('--nd-tint',rgb(tint));li.style.setProperty('--nd-edge',rgb(edge));li.style.setProperty('--nd-face',rgb(face));
    const time=li.querySelector('.tl-time-big');
    if(time){const row=document.createElement('span');row.className='nd-time-row';time.before(row);row.append(time);}
  }
  function insertEvent(event){
    const li=document.createElement('li');li.className='nd-event nd-event-'+event.kind;li.dataset.event=event.kind;li.dataset.clock=event.minute;
    const disney=event.kind==='disney',copy=disney?['✦','ディズニー新幹線とすれ違い',event.detail]:solarNames[event.kind];
    const clock=M.clockLabel(rideDate,event.minute)+'頃'+(disney?'の見込み':'');
    const title=disney?'<span class="copy-chunk">ディズニー新幹線と</span><span class="copy-chunk">すれ違い</span>':escape(copy[1]);
    const detail=disney?event.detail.split(' · ').map(x=>'<span class="copy-chunk">'+escape(x)+'</span>').join(' '):escape(place(event.point));
    const time='<time class="tl-time tl-time-big"><span>'+escape(M.clockLabel(rideDate,event.minute))+'</span><span class="tl-time-suffix">頃</span></time>';
    const content='<span class="nd-event-icon" aria-hidden="true">'+copy[0]+'</span><div class="nd-event-copy"><div class="nd-event-heading tl-top-left"><span class="nd-event-time">'+time+(disney?'<span class="nd-event-estimate">見込み</span>':'')+'</span><strong>'+title+'</strong></div><p>'+detail+'</p></div>';
    if(disney){
      li.id=disneyEventId(event.minute);
      // Existing sparkling-dreams.html; its canonical URL is https://www.michikusa-travel.com/sparkling-dreams.html.
      const link=document.createElement('a');link.className='nd-event-link';link.href=datedLink('sparkling-dreams.html');
      link.setAttribute('aria-label',clock+'、ディズニー新幹線とすれ違い。ディズニー新幹線のページを見る');
      link.innerHTML=content+'<span class="nd-event-go" aria-hidden="true">↗</span>';li.append(link);
    }else li.innerHTML=content;
    const list=byId('timeline');const before=[...list.children].find(x=>Number(x.dataset.ndClock)>event.minute);list.insertBefore(li,before||null);
  }
  function enrich(){
    if(!ready||!byId('timelineSection'))return;
    const v=model();view=v;dateNote();const box=byId('nd-trip'),disney=byId('nd-disney');
    box.dataset.state=v.actual?'selected':'sample';disney.dataset.status=v.disney.status;disney.innerHTML=disneyHTML(v.disney);disney.hidden=v.disney.status!=='encounter';
    document.querySelectorAll('.nd-event,.nd-light-label,.nd-card-light').forEach(e=>e.remove());
    document.querySelectorAll('.nd-time-row').forEach(e=>e.replaceWith(...e.childNodes));
    document.querySelectorAll('.nd-ambient').forEach(e=>{e.classList.remove('nd-ambient');delete e.dataset.light;delete e.dataset.solarAltitude;e.style.removeProperty('--nd-tint');e.style.removeProperty('--nd-edge');e.style.removeProperty('--nd-face');});
    document.querySelectorAll('#timeline .tl-item').forEach(prepareName);
    const actual=v.actual&&v.context.status==='reference';
    byId('nd-trip-date').textContent=actual?rideDate.replaceAll('-','/')+' · '+M.clockLabel(rideDate,journey.depMin)+' '+stationLabel(journey.boardId)+'発（JST）':v.actual?'乗車日を確認してください（JST）':'まだ列車は未選択です';
    box.hidden=!actual;
    if(!actual)return;
    const spots=typeof currentTimelineSpotCandidates==='function'?currentTimelineSpotCandidates():journey.spots;
    const clocks=new Map(spots.map(x=>[x.sp.id,x.clock]));
    [...byId('timeline').children].forEach(li=>{
      const text=li.querySelector('.tl-time')?.textContent||'',m=/([0-2]?\d):([0-5]\d)/.exec(text),clock=li.dataset.spot?clocks.get(li.dataset.spot):m?Number(m[1])*60+Number(m[2]):NaN;
      li.dataset.ndClock=clock;
      if(li.dataset.spot&&Number.isFinite(clock)&&v.solar.status==='calculated')cardLight(li,clock,v.solar);
    });
    const events=v.solar.events.filter(e=>solarNames[e.kind]);
    if(v.disney.status==='encounter')for(const match of v.disney.matches)events.push({kind:'disney',minute:match.time,detail:match.segment.from+'〜'+match.segment.to+'付近 · '+(journey.direction==='west'?'E席側':'A席側')+'（前後約5分）'});
    events.sort((a,b)=>a.minute-b.minute).forEach(insertEvent);
  }
  const originalDark=isClearlyDark;
  isClearlyDark=function(clock,date){
    const v=model();if(v.actual&&v.context.status==='reference'&&v.solar.status==='calculated')return v.solar.at(clock)?.phase==='night';
    return originalDark(clock,date);
  };
  const originalRender=renderTimeline;
  renderTimeline=function(...args){const value=originalRender(...args);enrich();return value;};
  function init(){
    const time=byId('departTime'),now=byId('nowBtn');if(!time||!now)return;
    const row=time.closest('.setup-row');row.classList.add('nd-date-row');
    const label=row.querySelector('label');label.textContent='乗車日・出発時刻';label.htmlFor='nd-date';label.removeAttribute('data-picker-text');
    const group=row.querySelector('.depart-wrap');group.classList.add('nd-date-time');
    const input=document.createElement('input');input.type='date';input.id='nd-date';input.setAttribute('aria-label','乗車日（日本時間）');input.min='1901-01-01';input.max='2099-12-31';input.value=rideDate;group.prepend(input);time.setAttribute('aria-label','出発時刻（日本時間）');
    // Replace the old node so its browser-local nowClock handler cannot override JST.
    const current=document.createElement('button');current.type='button';current.id='nd-now';current.className='chip-btn';current.textContent='現在';current.setAttribute('aria-label','日付と時刻を現在の日本時間へ戻す');now.replaceWith(current);
    if(!(typeof journey!=='undefined'&&journey?.mode==='train'&&!journey.preview))time.value=seed.time;
    const note=document.createElement('p');note.id='nd-date-note';note.className='nd-date-note';note.setAttribute('aria-live','polite');row.after(note);
    const panel=document.createElement('section');panel.id='nd-trip';panel.className='nd-trip';panel.setAttribute('aria-label','乗車日の光とすれ違い');panel.innerHTML='<p id="nd-trip-date" class="nd-trip-date"></p>';
    const target=byId('timelineSection').querySelector('.section-head');target.after(panel);
    const encounter=document.createElement('aside');encounter.id='nd-disney';encounter.className='nd-disney';encounter.setAttribute('aria-live','polite');byId('timelineFilterbar').after(encounter);encounter.addEventListener('click',jumpToEncounter);
    const details=document.createElement('details');details.className='nd-basis';details.innerHTML='<summary>日時と日の出・日の入りについて</summary><p>日時は日本時間（JST）。日付と便を選ぶまで実時刻の太陽・すれ違いイベントは表示しません。23時台以降に候補がない場合、翌日の便を自動表示しません。</p><p>時刻表は2026-10-10確認の10月固定データ。全列車の運転日・臨時便・遅延は未収録です。過去日と未来日、その月以外の計算は同じダイヤで走ると仮定した参考です。</p><p>太陽は各時刻の列車位置を線路形状へ対応させて計算。日の出・日の入りは太陽中心高度−0.833°の目安です。山・トンネル・建物・標高・雲は反映せず、実際に太陽が見える時刻を保証しません。</p><p><a href="https://gml.noaa.gov/grad/solcalc/calcdetails.html" target="_blank" rel="noopener">太陽計算の根拠（NOAA/Meeus）</a> · <a href="https://aa.usno.navy.mil/faq/RST_defs" target="_blank" rel="noopener">日の出・日の入りの定義（USNO）</a></p><p>独立試作です。本番のSEO・多言語ページ・Android同梱は変更していません。</p>';
    byId('timeline-calculation-note').after(details);
    input.addEventListener('change',updateDate);input.addEventListener('input',()=>{rideDate=input.value;cache=null;dateNote();});
    current.addEventListener('click',()=>{const p=M.jstParts();input.value=p.date;time.value=p.time;time.dispatchEvent(new Event('input',{bubbles:true}));rideDate=p.date;updateDate();});
    time.addEventListener('input',()=>{cache=null;enrich();});time.addEventListener('change',()=>{cache=null;enrich();});byId('findTrainsBtn').addEventListener('click',()=>{cache=null;enrich();});
    ready=true;saveDate();enrich();if(typeof journey!=='undefined'&&journey&&!journey.preview)renderTimeline();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.MADO_JOURNEY_LIGHT_EVENTS={getState:()=>({date:rideDate,context:view.context,actual:view.actual,solarStatus:view.solar?.status,solarEvents:view.solar?.events?.map(e=>({kind:e.kind,minute:e.minute,lat:e.point.lat,lng:e.point.lng,place:place(e.point)})),segments:view.solar?.segments,disneyStatus:view.disney?.status,disneyMatches:view.disney?.matches?.map(x=>({minute:x.time,clock:x.clock}))}),refresh:()=>{cache=null;renderTimeline();}};
})();
