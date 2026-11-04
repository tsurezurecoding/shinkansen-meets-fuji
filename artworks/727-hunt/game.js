(() => {
  'use strict';
  const $ = id => document.getElementById(id), video = $('film'), stage = $('stage');
  const targets = window.TARGETS || [], debugInitially = false;
  let state='loading', score=0, combo=0, maxCombo=0, misses=0, results={}, presentedTime=0;
  let slowRemaining=3, slowUntil=-1, rate=.85, lastAttempt=-Infinity, feedbackTimer, markerUntil=-1, markerTarget=null;
  let point={x:.5,y:.5}, started=false, loadTimer;
  const marker=$('marker'), reticle=$('reticle');
  let debug=debugInitially, practiceUsed=false, tapUntil=-1;
  const hitbox=$('hitbox');
  const active=()=>state==='playing'&&!video.paused&&!video.seeking&&video.readyState>=2;
  function rect(){const r=stage.getBoundingClientRect(),s=Math.min(r.width/(video.videoWidth||1280),r.height/(video.videoHeight||720)),w=(video.videoWidth||1280)*s,h=(video.videoHeight||720)*s;return {x:r.left+(r.width-w)/2,y:r.top+(r.height-h)/2,w,h,stage:r};}
  function boxAt(target,t,includeOccluded=false){
    if(t<target.start||t>target.end||(!includeOccluded&&(target.occluded||[]).some(([a,b])=>t>=a&&t<=b)))return null;
    const frames=target.track;if(!frames?.length)return null;
    let i=0;while(i<frames.length-2&&frames[i+1][0]<t)i++;
    const a=frames[i],b=frames[Math.min(i+1,frames.length-1)],f=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0]||1)));
    return a.slice(1,5).map((v,j)=>v+(b[j+1]-v)*f);
  }
  function hitArea(b){const r=rect(),w=Math.max(b[2],48/r.w),h=Math.max(b[3],48/r.h);return [b[0]+(b[2]-w)/2,b[1]+(b[3]-h)/2,w,h];}
  function drawHitbox(){
    hitbox.hidden=true;
    if(!debug){$('hitbox-state').textContent='枠は非表示です。';return;}
    if(active())practiceUsed=true;
    const target=targets.find(t=>boxAt(t,presentedTime,true));
    if(!target){$('hitbox-state').textContent=state==='intro'?'出発すると枠が動きます。':'いまは判定範囲の外です。';return;}
    const b=boxAt(target,presentedTime),found=results[target.id]?.found;
    hitbox.hidden=false;place(hitbox,hitArea(boxAt(target,presentedTime,true)));
    hitbox.dataset.kind=!b?'blocked':found?'found':'active';
    $('hitbox-state').textContent=`${target.label}：${!b?'遮られているため判定なし':found?'発見済み':active()?'枠内で当たり':'停止中（判定なし）'}`;
  }
  function tapTrace(x,y,kind,b){
    if(!debug)return;tapUntil=presentedTime+.8;
    const r=rect(),p=$('tap-point'),outline=$('tap-box');p.hidden=false;p.dataset.kind=kind;
    p.style.left=`${r.x-r.stage.left+x*r.w}px`;p.style.top=`${r.y-r.stage.top+y*r.h}px`;
    outline.hidden=!b;if(b){place(outline,hitArea(b));outline.dataset.kind=kind;}
    $('tap-result').textContent=`${presentedTime.toFixed(2)}秒のタップ：${kind==='hit'?'当たり':kind==='found'?'発見済み':'はずれ'}（印と細い枠は押した瞬間）`;
  }
  function place(el,b){const r=rect();Object.assign(el.style,{left:`${r.x-r.stage.left+b[0]*r.w}px`,top:`${r.y-r.stage.top+b[1]*r.h}px`,width:`${b[2]*r.w}px`,height:`${b[3]*r.h}px`});}
  function announce(text){$('feedback').textContent=text;$('feedback').classList.add('show');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('feedback').classList.remove('show'),1300);}
  function updateCollection(){
    $('score').textContent=score;
    $('count').textContent=`${Object.values(results).filter(r=>r.found).length} / ${targets.length}`;
    for(const t of targets){const el=$(`stamp-${t.id}`),r=results[t.id];el.className=r?(r.found?'found':'missed'):'';el.textContent=r?(r.found?'727':'—'):String(targets.indexOf(t)+1).padStart(2,'0');el.setAttribute('aria-label',`${t.label}：${r?(r.found?'発見':'見逃し'):'まだ'}`);}
    $('combo').textContent=combo>1?`${combo}枚連続！ 次も見つけよう`:combo===1?'いいね、その調子。':'次の727を探そう';
  }
  function controls(){const play=state==='playing';$('pause').disabled=!['playing','buffering'].includes(state);$('slow').disabled=!play||slowRemaining<=0||slowUntil>=0;$('pace').disabled=started;$('slow').innerHTML=`ゆっくり <small>${slowRemaining>0?'あと'+slowRemaining+'回':'使用済み'}</small>`;}
  function overlay(kicker,title,text,button){$('overlay-kicker').textContent=kicker;$('overlay-title').textContent=title;$('overlay-text').textContent=text;$('start').textContent=button;$('start').disabled=false;$('overlay').hidden=false;}
  function pause(reason='ゆっくり、ひと休み。'){
    if(!['playing','buffering'].includes(state))return;state='paused';video.pause();clearTimeout(loadTimer);marker.hidden=true;
    overlay('PAUSE','景色を、ひと休み。',reason,'続きを見る');$('status').textContent='一時停止中。看板は逃げません。';controls();drawHitbox();
  }
  function error(){if(state==='complete')return;state='error';video.pause();clearTimeout(loadTimer);overlay('映像を読み込めませんでした','もう一度、準備します。','通信状態を確認して、もう一度お試しください。','映像を再読み込み');$('status').textContent='読み込みエラー。再読み込みすると今回の旅は最初から始まります。';controls();}
  function ready(){clearTimeout(loadTimer);if(state!=='loading')return;state='intro';overlay('赤い数字を、いくつ拾える？','727、どこまでも。',`${targets.length}枚の727が続けて登場。見つけた場所をタップ。`,'727を探しに出発');$('status').textContent='発見しても映像は続きます。';$('remaining').textContent=`約${Math.ceil(video.duration/rate)}秒`;controls();}
  async function play(){
    if(!['intro','paused'].includes(state))return;
    started=true;if(debug)practiceUsed=true;state='buffering';$('overlay').hidden=true;$('status').textContent='出発の準備中…';controls();
    try{video.playbackRate=presentedTime<slowUntil ? .4 : rate;await video.play();if(state==='buffering'&&!video.paused){state='playing';controls();}if(state==='playing')stage.focus({preventScroll:true});}catch(e){if(state==='paused')return;state='paused';overlay('再生が止まりました','タップして、出発。','ブラウザが再生を止めました。もう一度お試しください。','続きを見る');controls();}
  }
  function attempt(clientX,clientY){
    if(!active()||performance.now()-lastAttempt<350)return;
    const r=rect(),x=(clientX-r.x)/r.w,y=(clientY-r.y)/r.h;
    if(x<0||x>1||y<0||y>1)return;
    lastAttempt=performance.now();
    for(const t of targets){const b=boxAt(t,presentedTime);if(!b)continue;
      const area=hitArea(b);
      if(x>=area[0]&&x<=area[0]+area[2]&&y>=area[1]&&y<=area[1]+area[3]){
        if(results[t.id]?.found){tapTrace(x,y,'found',b);announce('この727は、もう発見済み。');return;}
        if(results[t.id])return;
        tapTrace(x,y,'hit',b);
        combo++;maxCombo=Math.max(maxCombo,combo);const gain=100+(combo-1)*20;score+=gain;results[t.id]={found:true,score:gain,time:presentedTime};
        markerTarget=t;markerUntil=presentedTime+.75;marker.hidden=false;place(marker,b);announce(`${combo>1?combo+'枚連続！ ':''}727発見 +${gain}`);updateCollection();return;
      }
    }
    tapTrace(x,y,'miss',targets.map(t=>boxAt(t,presentedTime)).find(Boolean));
    misses++;combo=0;score=Math.max(0,score-10);announce('そこじゃないみたい −10');updateCollection();
  }
  function finish(){
    if(state==='complete')return;
    state='complete';video.pause();clearTimeout(loadTimer);marker.hidden=true;reticle.hidden=true;$('overlay').hidden=true;$('slow-tag').hidden=true;
    for(const t of targets)if(!results[t.id])results[t.id]={found:false,score:0};updateCollection();controls();
    $('progress').style.width='100%';$('status').textContent='終点です。下の切符で今日の発見を見てみよう。';$('remaining').textContent='到着';
    const found=Object.values(results).filter(r=>r.found).length;$('final-score').textContent=score;
    $('summary').textContent=`${targets.length}枚中${found}枚を発見。最高${maxCombo}枚連続。${found===targets.length?'全部つかまえた！':found?'次は、もう1枚見つかるかも。':'次の旅は「ゆっくり」も使ってみよう。'}`;
    $('souvenirs').replaceChildren();for(const t of targets){const fig=document.createElement('figure');fig.className='souvenir';const photo=document.createElement('div');photo.className='photo';const img=document.createElement('img');img.src=t.poster;img.loading="lazy";img.alt=`${t.label}の727の答え`;photo.append(img);
      if(t.posterBox){const a=document.createElement('span');a.className='answer';const b=t.posterBox;Object.assign(a.style,{left:b[0]*100+'%',top:b[1]*100+'%',width:b[2]*100+'%',height:b[3]*100+'%'});photo.append(a);}
      const cap=document.createElement('figcaption'),b=document.createElement('b');b.textContent=results[t.id].found?`発見 +${results[t.id].score}`:'次は、ここを見てみよう';cap.append(b,document.createTextNode(t.label));fig.append(photo,cap);$('souvenirs').append(fig);}
    let best=score,saved=true;try{const key=`727-hunt-v1-${practiceUsed?'practice':'normal'}-${rate}`;best=Math.max(score,Number(localStorage.getItem(key))||0);localStorage.setItem(key,String(best));}catch{saved=false;}
    $('best').textContent=saved?`${practiceUsed?'練習':'通常'}・${rate===.85?'のんびり':'特急'}の最高記録 ${best}点`:'ブラウザ保存は使えません。今回の切符はここで楽しめます。';
    $('ticket').hidden=false;$('ticket').focus({preventScroll:true});$('ticket').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
  function frame(t){
    presentedTime=t;
    if(t>tapUntil){$('tap-point').hidden=true;$('tap-box').hidden=true;}
    if(active()){
      for(const target of targets)if(t>target.end&&!results[target.id]){results[target.id]={found:false,score:0};combo=0;updateCollection();}
      if(slowUntil>=0&&t>=slowUntil){slowUntil=-1;video.playbackRate=rate;$('slow-tag').hidden=true;controls();}
      $('progress').style.width=`${100*t/(video.duration||1)}%`;$('remaining').textContent=`あと${Math.max(0,Math.ceil((video.duration-t)/rate))}秒`;
      $('status').textContent='727を見つけたら、その場所をタップ。';
      const current=targets.find(target=>t>=target.sceneStart&&t<target.sceneEnd);$('route-label').textContent=current?current.label:'次の景色へ';if(current?.hint)$('status').textContent=current.hint+(slowRemaining>0?'。スローも使えます。':'。見つけた場所をタップ。');
    }
    const b=markerTarget&&boxAt(markerTarget,t);if(b&&t<markerUntil&&active()){marker.hidden=false;place(marker,b);}else marker.hidden=true;
    drawHitbox();
  }
  function reset(){practiceUsed=false;$('tap-point').hidden=true;$('tap-box').hidden=true;$('tap-result').textContent='タップした位置と枠を、少しの間残します。';state='loading';video.pause();clearTimeout(loadTimer);score=combo=maxCombo=misses=0;results={};presentedTime=0;slowRemaining=3;slowUntil=-1;started=false;lastAttempt=-Infinity;markerTarget=null;marker.hidden=true;reticle.hidden=true;rate=Number($('pace').value);video.playbackRate=rate;video.currentTime=0;$('ticket').hidden=true;document.querySelector('.answer-book').open=false;$('slow-tag').hidden=true;$('feedback').classList.remove('show');clearTimeout(feedbackTimer);$('progress').style.width='0%';updateCollection();controls();if(video.readyState>=1)ready();else{overlay('準備中','車窓を準備しています。','少しお待ちください。','映像を準備中…');$('start').disabled=true;loadTimer=setTimeout(error,15000);}}
  $('start').addEventListener('click',()=>{if(state==='error'){reset();video.load();}else play();});
  $('pause').addEventListener('click',()=>pause());
  $('slow').addEventListener('click',()=>{if(!active()||slowRemaining<=0||slowUntil>=0)return;slowRemaining--;slowUntil=presentedTime+3;video.playbackRate=.4;$('slow-tag').hidden=false;announce('3秒ぶん、ゆっくり。');controls();});
  $('pace').addEventListener('change',()=>{rate=Number($('pace').value);if(state==='intro')readyEstimate();});
  function readyEstimate(){$('remaining').textContent=`約${Math.ceil(video.duration/rate)}秒`;}
  $('replay').addEventListener('click',()=>{reset();stage.scrollIntoView({block:'center'});$('start').focus({preventScroll:true});});
  $('show-hitbox').addEventListener('change',e=>{debug=e.target.checked;$('practice-details').hidden=!debug;if(debug&&started&&state!=='complete')practiceUsed=true;$('hitbox-legend').hidden=!debug;$('tap-point').hidden=true;$('tap-box').hidden=true;drawHitbox();});
  window.addEventListener('resize',()=>{$('tap-point').hidden=true;$('tap-box').hidden=true;drawHitbox();});
  stage.addEventListener('pointerup',e=>{if(e.target.closest('button'))return;attempt(e.clientX,e.clientY);});
  stage.addEventListener('keydown',e=>{if(e.target!==stage||!active())return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')point.x-=.035;if(e.key==='ArrowRight')point.x+=.035;if(e.key==='ArrowUp')point.y-=.035;if(e.key==='ArrowDown')point.y+=.035;point.x=Math.max(.01,Math.min(.99,point.x));point.y=Math.max(.01,Math.min(.99,point.y));const r=rect();reticle.hidden=false;reticle.style.left=`${r.x-r.stage.left+point.x*r.w}px`;reticle.style.top=`${r.y-r.stage.top+point.y*r.h}px`;if(e.key===' '||e.key==='Enter')attempt(r.x+point.x*r.w,r.y+point.y*r.h);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('画面を離れたので、一時停止しました。');});window.addEventListener('blur',()=>pause('画面を離れたので、一時停止しました。'));window.addEventListener('pagehide',()=>pause());
  video.addEventListener('loadedmetadata',ready);video.addEventListener('canplay',ready);video.addEventListener('error',error);video.addEventListener('ended',finish);
  video.addEventListener('waiting',()=>{if(state==='playing'){state='buffering';$('status').textContent='映像を読み込み中…';controls();loadTimer=setTimeout(()=>pause('読み込みに時間がかかっています。続きから再開できます。'),10000);}});
  video.addEventListener('playing',()=>{clearTimeout(loadTimer);if(state==='paused'){video.pause();return;}if(state==='buffering'){state='playing';controls();}});
  video.addEventListener('pause',()=>{if(state==='playing')pause();});
  if('requestVideoFrameCallback' in video){const tick=(_,m)=>{frame(m.mediaTime);video.requestVideoFrameCallback(tick);};video.requestVideoFrameCallback(tick);}else{const tick=()=>{frame(video.currentTime);requestAnimationFrame(tick);};requestAnimationFrame(tick);}
  for(const t of targets){const li=document.createElement('li');li.id=`stamp-${t.id}`;$('stamps').append(li);}
  window.Hunt727={inspect:()=>({state,score,combo,maxCombo,misses,debug,practiceUsed,slowUsed:slowRemaining<3,slowRemaining,presentedTime,results:JSON.parse(JSON.stringify(results)),targets:targets.map(t=>({id:t.id,box:boxAt(t,presentedTime)}))})};
  if(targets.length){video.poster=targets[0].poster;reset();}else error();
})();
