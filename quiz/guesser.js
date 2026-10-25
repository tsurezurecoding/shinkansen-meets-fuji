(() => {
'use strict';
const $=id=>document.getElementById(id), questions=window.CLIP_QUESTIONS, current=()=>q;
let questionIndex=0,q=questions[0];
const results=questions.map(()=>null);
const points=MADO_TRACK.points.map(p=>[p.lat,p.lng,p.km]);
const names=['東京','品川','新横浜','小田原','熱海','三島','新富士','静岡','掛川','浜松','豊橋','三河安城','名古屋','岐阜羽島','米原','京都','新大阪'];
const stations=MADO_TRACK.points.filter(p=>p.st).map((p,i)=>({...p,name:names[i]}));
const fmt=n=>n.toLocaleString('ja-JP');
let guess=null, answered=false, map,tiles,guessMarker,answerMarker,answerLine,liveMarker,clipLine,livePosition=null,routeMode=!window.L,tileCount=0,tileErrors=0;
  function positionAt(km) {
    const clamped = Math.max(0, Math.min(points.at(-1)[2], km));
    let i = 0;
    while (i < points.length - 2 && points[i + 1][2] < clamped) i++;
    const a = points[i], b = points[i + 1], t = (clamped - a[2]) / (b[2] - a[2] || 1);
    return {lat:a[0] + (b[0] - a[0]) * t, lng:a[1] + (b[1] - a[1]) * t, km:clamped};
  }
  function nearest(lat, lng) {
    let best = {d:Infinity};
    const cos = Math.cos(lat * Math.PI / 180);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const dx = (b[1] - a[1]) * cos, dy = b[0] - a[0];
      const t = Math.max(0, Math.min(1, (((lng - a[1]) * cos * dx) + (lat - a[0]) * dy) / (dx * dx + dy * dy || 1)));
      const x = a[1] + (b[1] - a[1]) * t, y = a[0] + (b[0] - a[0]) * t;
      const d = ((lng - x) * cos) ** 2 + (lat - y) ** 2;
      if (d < best.d) best = {d, lat:y, lng:x, km:a[2] + (b[2] - a[2]) * t};
    }
    return best;
  }
  const segment = km => Math.min(stations.length - 2, Math.max(0, stations.findIndex((s,i) => i < stations.length - 1 && km >= s.km && km <= stations[i + 1].km)));
  const segmentName = i => `${stations[i].name} 〜 ${stations[i + 1].name}`;
  const distanceText = km => km < 1 ? '1km以内' : `約${fmt(Math.round(km))}km`;
  const scoreFor = km => Math.round(5000 * Math.exp(-Math.max(0, km - 1) / 85));
  function ll(p) { return [p.lat, p.lng]; }
  function icon(correct) { return L.divIcon({className:correct ? 'answer-icon' : 'guess-icon',iconSize:[19,19],iconAnchor:[9.5,9.5]}); }

  function initMap() {
    if (map || !window.L) return;
    map = L.map('map',{scrollWheelZoom:false,zoomControl:true,attributionControl:true});
    tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'});
    tiles.on('tileload',() => {tileCount++; $('tile-status').hidden = true;});
    tiles.on('tileerror',() => {tileErrors++; if(tileErrors >= 3 && !tileCount) fallback();});
    tiles.addTo(map);
    L.polyline(points.map(p => [p[0],p[1]]),{color:'#ffffff',weight:7,opacity:.9,interactive:false}).addTo(map);
    L.polyline(points.map(p => [p[0],p[1]]),{color:'#3b7a8b',weight:3,opacity:.95,interactive:false}).addTo(map);
    stations.forEach((s,i) => {
      const marker = L.circleMarker([s.lat,s.lng],{radius:3,color:'#fff',weight:1,fillColor:'#284d61',fillOpacity:1}).addTo(map);
      marker.bindTooltip(s.name,{direction:'top'});
      marker.on('click',e => {L.DomEvent.stopPropagation(e); if(!answered) setGuess(positionAt(s.km));});
      if ([0,2,6,9,12,15,16].includes(i)) marker.openTooltip();
    });
    map.on('click',e => {if(!answered) setGuess(nearest(e.latlng.lat,e.latlng.lng));});
    fitMap();
    setTimeout(() => {if(!tileCount && map && !routeMode) fallback();},8000);
  }
  function fallback() {
    $('tile-status').hidden = false;
    if(!routeMode) setMapMode(true);
  }
  function fitMap() {
    if(!map) return;
    map.invalidateSize();
    if(answered && guess) {
      const target = nearest(...current().position);
      map.fitBounds([ll(guess),ll(target)],{padding:[35,35],maxZoom:12,animate:false});
    } else map.fitBounds(points.map(p => [p[0],p[1]]),{padding:[20,22],animate:false});
  }
  function setMapMode(route) {
    routeMode = route || !window.L;
    $('map').hidden = routeMode; $('route-map').hidden = !routeMode;
    $('fit-map').hidden = routeMode;
    $('map-toggle').textContent = routeMode ? '地図に切り替え' : '路線図に切り替え';
    $('map-toggle').disabled = !window.L;
    if(!routeMode) {initMap(); requestAnimationFrame(fitMap);}
    renderRoute();
  }
  // The offline diagram uses the actual track shape, without invented coastlines.
  function xy(lat,lng) { return [40 + (lng - 135.45) / 4.42 * 600, 275 - (lat - 34.6) / 1.12 * 235]; }
  function renderRoute() {
    const svg = $('route-svg'), ns = 'http://www.w3.org/2000/svg';
    svg.replaceChildren();
    function el(tag,attrs,txt) {const node=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));if(txt)node.textContent=txt;svg.append(node);return node;}
    el('text',{x:25,y:29,fill:'#57675f','font-size':22},'東京 ⇄ 新大阪');
    el('path',{d:points.map((p,i)=>`${i?'L':'M'}${xy(p[0],p[1]).join(',')}`).join(' '),fill:'none',stroke:'#3b7a8b','stroke-width':4,'stroke-linecap':'round'});
    const labels = {0:[-5,-17,'end'],6:[0,-17,'middle'],7:[20,18,'start'],9:[0,32,'middle'],12:[-13,-8,'end'],16:[8,34,'start']};
    stations.forEach((s,i)=>{const [cx,cy]=xy(s.lat,s.lng);el('circle',{cx,cy,r:3.5,fill:'#fff',stroke:'#3b7a8b','stroke-width':1.5});if(labels[i]){const [dx,dy,anchor]=labels[i];el('text',{x:cx+dx,y:cy+dy,fill:'#3b514e','font-size':25,'text-anchor':anchor},s.name);}});
    if(answered&&guess) {
      const target=nearest(...current().position),a=xy(guess.lat,guess.lng),b=xy(target.lat,target.lng);
      el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#74917c','stroke-width':2,'stroke-dasharray':'5 4'});
      el('circle',{cx:b[0],cy:b[1],r:9,fill:'#3a7668',stroke:'#fff','stroke-width':3});
    }
    if(answered && livePosition){const [cx,cy]=xy(livePosition.lat,livePosition.lng);el('circle',{cx,cy,r:4,fill:'#7059a0',stroke:'#fff','stroke-width':1.5});}
    if(guess){const [cx,cy]=xy(guess.lat,guess.lng);el('circle',{cx,cy,r:7,fill:'#e8704a',stroke:'#fff','stroke-width':2});}
    el('text',{x:25,y:308,fill:'#697c72','font-size':17},'実際の線路の形をもとにした路線図');
  }
  function setGuess(value) {
    if(answered) return;
    guess = value;
    const i = segment(guess.km), percent = Math.round((guess.km - stations[i].km) / (stations[i+1].km - stations[i].km) * 100);
    $('station-select').value = String(i); $('position-range').value = percent;
    $('fine-control').hidden = false; $('position-label').textContent = `${stations[i].name}寄り ← ${percent}% → ${stations[i+1].name}寄り`;
    $('guess-label').textContent = `${segmentName(i)} にピンを置きました`;
    $('submit').disabled = false;
    if(map){if(guessMarker)guessMarker.setLatLng(ll(guess));else guessMarker=L.marker(ll(guess),{icon:icon(false)}).addTo(map);}
    renderRoute();
  }
  function chooseFromControls() {
    if($('station-select').value === '') {guess=null;$('fine-control').hidden=true;$('submit').disabled=true;$('guess-label').textContent='まだピンが置かれていません';if(guessMarker){guessMarker.remove();guessMarker=null;}renderRoute();return;}
    const i=Number($('station-select').value), p=Number($('position-range').value)/100;
    setGuess(positionAt(stations[i].km+(stations[i+1].km-stations[i].km)*p));
  }

const film=$('film'),scrub=$('scrub');
let ready=false,seekFrame=0,wantedTime=q.targetSeconds;
const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
function scrollTo(el){el.scrollIntoView({behavior:motion(),block:'start'});}
const hasPosition=s=>s&&Number.isFinite(s[1])&&Number.isFinite(s[2]);
function positionInClip(t){
  if(t<q.samples[0][0]||t>q.samples.at(-1)[0])return null;
  let i=0;while(i<q.samples.length-2&&q.samples[i+1][0]<t)i++;
  const a=q.samples[i],b=q.samples[i+1];
  if(t===a[0]&&hasPosition(a))return {lat:a[1],lng:a[2]};
  if(t===b[0]&&hasPosition(b))return {lat:b[1],lng:b[2]};
  if(!hasPosition(a)||!hasPosition(b)||b[0]<=a[0]||b[0]-a[0]>10)return null;
  const f=(t-a[0])/(b[0]-a[0]);
  return {lat:a[1]+(b[1]-a[1])*f,lng:a[2]+(b[2]-a[2])*f};
}
function clipPaths(){
  const paths=[];let path=[],lastTime=null;
  for(const s of q.samples){
    if(!hasPosition(s)||(lastTime!==null&&s[0]-lastTime>10)){if(path.length>1)paths.push(path);path=[];}
    if(hasPosition(s))path.push([s[1],s[2]]);
    lastTime=s[0];
  }
  if(path.length>1)paths.push(path);
  return paths;
}
function syncFilm(){
  const t=film.currentTime,offset=t-q.targetSeconds,atHome=Math.abs(offset)<.16;
  scrub.value=t;
  $('time-label').textContent=atHome?'お題の瞬間':`お題から ${offset<0?'−':'＋'}${Math.abs(offset).toFixed(1)}秒`;
  scrub.setAttribute('aria-valuetext',$('time-label').textContent);
  $('bookmark-badge').textContent=atHome?'▮ お題の瞬間':'↔ 前後の手がかり';
  $('bookmark-badge').classList.toggle('away',!atHome);
  document.querySelector('[data-step="-5"]').disabled=!ready||t<.05;
  document.querySelector('[data-step="-1"]').disabled=!ready||t<.05;
  document.querySelector('[data-step="1"]').disabled=!ready||t>=film.duration-.05;
  document.querySelector('[data-step="5"]').disabled=!ready||t>=film.duration-.05;
  if(answered){
    livePosition=positionInClip(t);
    document.querySelector('.evidence-note').textContent=livePosition?'映像を動かすと紫の点も動きます。緑の「お題」は同じ場所に残ります。':'この区間は位置の記録がないため、紫の点を隠しています。緑の「お題」は同じ場所に残ります。';
    if(map){
      if(!livePosition){liveMarker?.remove();liveMarker=null;}
      else if(liveMarker)liveMarker.setLatLng(ll(livePosition));
      else liveMarker=L.circleMarker(ll(livePosition),{radius:5,color:'#fff',weight:1.5,fillColor:'#7059a0',fillOpacity:1}).addTo(map);
    }
    if(routeMode)renderRoute();
  }
}
function seekTo(t){
  if(!ready)return;
  film.pause();wantedTime=Math.max(0,Math.min(film.duration-.04,t));
  cancelAnimationFrame(seekFrame);
  seekFrame=requestAnimationFrame(()=>{film.currentTime=wantedTime;syncFilm();});
}
function setReady(value){
  ready=value;
  document.querySelectorAll('.transport button,.transport select,#scrub,#bookmark-label').forEach(el=>el.disabled=!value);
  $('loading').hidden=value;
}
film.addEventListener('loadedmetadata',()=>{
  scrub.max=film.duration;film.currentTime=q.targetSeconds;
  const offset=`${q.targetSeconds/film.duration*100}%`;
  document.querySelector('.bookmark-line').style.left=offset;$('bookmark-label').style.left=offset;
});
film.addEventListener('seeked',()=>{if(!ready&&film.readyState>=2)setReady(true);syncFilm();});
film.addEventListener('loadeddata',()=>{if(Math.abs(film.currentTime-q.targetSeconds)<.2){setReady(true);syncFilm();}});
film.addEventListener('timeupdate',syncFilm);
film.addEventListener('play',()=>{$('play').textContent='Ⅱ 停止';$('play').setAttribute('aria-label','動画を一時停止');});
film.addEventListener('pause',()=>{$('play').textContent='▶ 再生';$('play').setAttribute('aria-label','動画を再生');});
film.addEventListener('ended',()=>{$('play').textContent='↻ 再生';});
film.addEventListener('error',()=>{setReady(false);$('loading').hidden=true;$('media-error').hidden=false;});
$('retry-media').addEventListener('click',()=>{$('media-error').hidden=true;$('loading').hidden=false;film.load();});
scrub.addEventListener('pointerdown',()=>film.pause());scrub.addEventListener('input',()=>seekTo(Number(scrub.value)));
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>seekTo(film.currentTime+Number(b.dataset.step))));
[$('bookmark-label'),$('home-frame')].forEach(b=>b.addEventListener('click',()=>seekTo(q.targetSeconds)));
$('speed').addEventListener('change',()=>{film.playbackRate=Number($('speed').value);});
$('play').addEventListener('click',async()=>{if(!ready)return;if(!film.paused){film.pause();return;}if(film.ended||film.currentTime>=film.duration-.1)film.currentTime=0;try{await film.play();}catch{$('play').textContent='▶ 再生';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)film.pause();});

$('station-select').addEventListener('change',()=>{$('position-range').value=50;chooseFromControls();});
$('position-range').addEventListener('input',chooseFromControls);
$('map-toggle').addEventListener('click',()=>setMapMode(!routeMode));$('fit-map').addEventListener('click',fitMap);
$('route-svg').addEventListener('click',e=>{if(answered)return;const point=$('route-svg').createSVGPoint();point.x=e.clientX;point.y=e.clientY;const p=point.matrixTransform($('route-svg').getScreenCTM().inverse());setGuess(nearest(34.6+(275-p.y)/235*1.12,135.45+(p.x-40)/600*4.42));});
$('hint-button').addEventListener('click',()=>{const open=$('hint').hidden;$('hint').hidden=!open;$('hint-button').setAttribute('aria-expanded',String(open));$('hint-button').textContent=open?'ヒントを閉じる':'見るヒント';});
$('submit').addEventListener('click',()=>{
  if(!guess||answered)return;answered=true;film.pause();
  const target=nearest(...q.position),distance=Math.abs(target.km-guess.km),score=scoreFor(distance);
  $('submit').disabled=true;$('submit').hidden=true;$('follow-clip').hidden=false;$('guess-controls').hidden=true;
  const outcome=distance<=1?'correct':distance<=10?'close':distance<=50?'near':'far';
  $('round-result').dataset.outcome=outcome;
  $('guess-verdict').textContent={correct:'◎ 正解！',close:'○ おしい！',near:'△ もう少し！',far:'↔ 遠かった！'}[outcome];
  $('map-panel').hidden=false;$('result-more').hidden=false;$('answer-card').classList.add('answered');
  $('distance').textContent=distanceText(distance);$('round-score').innerHTML=`${fmt(score)}<span>pt</span>`;
  $('map-instruction').textContent='緑は固定のお題、紫は映像の再生位置。';$('fit-map').textContent='回答を比較';
  $('scene-title').textContent=q.sceneTitle;
  results[questionIndex]={score,distance};renderJourney();
  if(map){
    answerMarker=L.marker(ll(target),{icon:icon(true)}).addTo(map).bindTooltip('お題の瞬間',{permanent:true,direction:'top',className:'map-pin-label'});
    answerLine=L.polyline([ll(guess),ll(target)],{color:'#3a7668',weight:2,dashArray:'5 6',interactive:false}).addTo(map).bindTooltip(distanceText(distance)+'（線路沿い）',{permanent:true,direction:'center',className:'distance-label'});
    guessMarker?.bindTooltip('あなたの回答',{permanent:true,direction:'bottom',className:'map-pin-label'});
    clipLine=L.polyline(clipPaths(),{color:'#7059a0',weight:5,opacity:.75,interactive:false}).addTo(map);
    fitMap();
  }
  syncFilm();renderRoute();$('round-result').hidden=false;requestAnimationFrame(fitMap);$('round-result').focus({preventScroll:true});
  if(innerWidth<701)scrollTo($('round-result'));else window.scrollTo({top:0,behavior:'instant'});
});
function followClip(){if(map&&!routeMode){map.invalidateSize();map.fitBounds(q.samples.filter(hasPosition).map(s=>[s[1],s[2]]),{padding:[35,35],maxZoom:14,animate:false});}}
$('follow-clip').addEventListener('click',()=>{followClip();scrollTo($('scene'));});
document.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>{seekTo(Number(b.dataset.time));followClip();scrollTo($('scene'));$('play').focus({preventScroll:true});}));
function resetQuestion(){
  film.pause();cancelAnimationFrame(seekFrame);
  answered=false;guess=null;livePosition=null;
  $('result-more').hidden=true;$('answer-card').classList.remove('answered');
  $('map-panel').hidden=false;document.querySelector('.answer-story').open=false;
  [guessMarker,answerMarker,answerLine,liveMarker,clipLine].forEach(m=>m?.remove());guessMarker=answerMarker=answerLine=liveMarker=clipLine=null;
  $('answer-card').hidden=false;$('round-result').hidden=true;
  $('submit').hidden=false;$('submit').disabled=true;$('follow-clip').hidden=true;$('guess-controls').hidden=false;$('fine-control').hidden=true;$('station-select').value='';$('position-range').value=50;
  $('guess-label').textContent='まだピンが置かれていません';$('map-instruction').textContent='路線の近くをタップして、ピンを置こう。';$('fit-map').textContent='全区間';
  $('hint').hidden=true;$('hint-button').textContent='見るヒント';$('hint-button').setAttribute('aria-expanded','false');$('scene-title').textContent='見覚えのない景色から、始めよう。';
  film.playbackRate=1;$('speed').value='1';renderRoute();
}
$('restart').addEventListener('click',()=>{resetQuestion();seekTo(q.targetSeconds);scrollTo($('scene'));$('play').focus({preventScroll:true});});
$('how-button').addEventListener('click',()=>$('how-dialog').showModal());$('close-how').addEventListener('click',()=>$('how-dialog').close());
stations.slice(0,-1).forEach((s,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=segmentName(i);$('station-select').append(o);});
function renderJourney(){
  const count=results.filter(Boolean).length;
  $('question-progress').textContent=`車窓 ${questionIndex+1} / ${questions.length} · ${count}問を旅しました`;
  [...$('question-nav').children].forEach((b,i)=>{b.textContent=results[i]?`${i+1} ✓`:String(i+1);b.setAttribute('aria-current',i===questionIndex?'step':'false');b.setAttribute('aria-label',`車窓${i+1}${results[i]?' 回答済み':''}`);});
  const nav=$('question-nav'),active=nav.children[questionIndex];
  nav.scrollLeft=active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2;
  $('next-question').textContent=questionIndex<questions.length-1?'次の車窓へ →':count===questions.length?'旅を振り返る →':'まだ見ていない車窓へ →';
  $('journey-result').hidden=count!==questions.length;
  if(count===questions.length){
    $('journey-total').textContent=`旅のスコア ${fmt(results.reduce((sum,r)=>sum+r.score,0))} / ${fmt(questions.length*5000)} pt`;
    $('journey-scores').replaceChildren(...results.map((r,i)=>{const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=`${questions[i].resultTitle}　${fmt(r.score)} pt`;b.addEventListener('click',()=>loadQuestion(i));li.append(b);return li;}));
  }
}
function loadQuestion(index){
  resetQuestion();questionIndex=index;q=questions[index];setReady(false);
  $('media-error').hidden=true;$('loading').hidden=false;
  $('result-title').replaceChildren(...q.resultTitle.split(/(?<=、)/).map(text=>{const span=document.createElement('span');span.className='copy-chunk';span.textContent=text;return span;}));
  $('result-location').textContent=q.location+' · '+segmentName(segment(nearest(...q.position).km))+'の間';
  $('result-story').textContent=q.story;$('hint').textContent=q.hint;
  document.querySelector('.observation-hint>p').textContent=q.prompt;
  document.querySelector('.filmstrip').src=q.filmstrip;
  document.querySelectorAll('[data-time]').forEach((b,i)=>{b.dataset.time=q.cues[i][0];b.textContent=`${['①','②','③'][i]} ${q.cues[i][1]}`;});
  film.poster=q.poster;film.src=q.video;scrub.value=q.targetSeconds;scrub.max=q.duration;
  renderJourney();film.load();setMapMode(routeMode);requestAnimationFrame(fitMap);
  if(index>0){if(innerWidth<701)scrollTo($('scene'));else window.scrollTo({top:0,behavior:'instant'});}
}
questions.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.addEventListener('click',()=>loadQuestion(i));$('question-nav').append(b);});
$('next-question').addEventListener('click',()=>{
  if(questionIndex<questions.length-1)loadQuestion(questionIndex+1);
  else {const unseen=results.findIndex(r=>!r);if(unseen>=0)loadQuestion(unseen);else{scrollTo($('journey-result'));$('journey-result').focus({preventScroll:true});}}
});
const requestedQuestion=new URLSearchParams(window.location.search).get('question');
const startQuestion=/^\d+$/.test(requestedQuestion||'')?Number(requestedQuestion):0;
loadQuestion(Number.isInteger(startQuestion)&&startQuestion>=1&&startQuestion<=questions.length?startQuestion-1:0);
})();
