(function () {
  'use strict';
  const film = window.PV_FILM;
  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const en = film.lang === 'en', cinema = document.body.classList.contains('cinema');
  const c = film.copy;
  const presentation = film.presentation || {};
  const edition = presentation.edition || (cinema ? 'cinema' : 'original');
  const ctaAt = presentation.ctaAt ?? 38.9;
  const labels = en ? {
    play:'Play', pause:'Pause', replay:'Replay', sound:'Sound on', muted:'Enable sound', loading:'Preparing your window journey…', error:'The film could not load. Please reload this page.', audioError:'Sound unavailable. The film can still play muted.', title:'Turn screen time into window time.', transcript:'Choose a scene · Read the film', visit:'Explore the views ↗', keys:'Space Play / Pause · ← → Skip 5 seconds', motion:'Playing still cards with reduced motion.',
  } : {
    play:'再生', pause:'一時停止', replay:'もう一度', sound:'音あり', muted:'音を入れる', loading:'旅の準備をしています…', error:'素材を読み込めませんでした。ページを再読み込みしてください。', audioError:'音を再生できません。映像は音なしで再生できます。', title:'窓を見る時間へ。', transcript:'シーンを選ぶ・文言を読む', visit:'車窓図鑑を見る ↗', keys:'Space 再生・停止 / ← → 5秒移動', motion:'動きを抑えた静止カードで再生しています。',
  };
  labels.title = presentation.title || labels.title;
  $('seek').max = String(film.duration);
  document.title = (cinema ? 'CINEMA — ' : '') + labels.title + ' | ' + c.wordmark;
  $('loading-text').textContent = labels.loading;
  $('transcript-title').textContent = labels.transcript;
  $('visit').textContent = labels.visit;
  $('motion-note').textContent = labels.motion;
  $('credits').textContent = c.foot;
  const site = new URL('../'+(en ? 'en/' : '')+'zukan.html',location.href).href;
  for (const id of ['visit','end-link']) { $(id).href = site; $(id).target='_top'; $(id).setAttribute('aria-label',labels.visit); }
  $('seek').setAttribute('aria-label',en ? 'Playback position in seconds' : '再生位置（秒）');
  document.querySelector('.player').setAttribute('aria-label',en ? 'Introduction film' : '紹介PV');
  document.querySelector('.caption').setAttribute('aria-label',en ? 'Current scene transcript' : 'シーンの文言');
  const chapters = presentation.chapters || ['WINDOW TIME','SHINKANSEN WINDOW','BEFORE THE RIDE','ON THE TRAIN','LOOK UP','WINDOW FIELD GUIDE','AFTER THE RIDE','YOUR NEXT JOURNEY'];
  const titles = presentation.titles || [[...c.s1l1,...c.s1l2],c.s2def,c.s3h,c.s4h,c.s5h,c.s6h,c.s7h,c.s8h];
  const details = presentation.details || [c.s1eb, '50+ '+c.countUnit+' · '+c.s2label, '', c.s4sub.join(en ? ' ' : '')+' '+c.s4pill, '',c.s6sub, en ? 'Mt. Fuji · Fuji River Bridge · Mt. Ibuki' : '富士山・富士川橋梁・伊吹山', c.wordmark];
  const sceneFor = value => {
    let scene = 0;
    window.PV_SCENES.forEach((s,i) => { if (value >= s.start) scene=i; });
    return scene;
  };
  const chunks = (el, lines) => {
    el.replaceChildren();
    if (en) { el.textContent=lines.join(' '); return; }
    for (const line of lines) { const span=document.createElement('span'); span.className='copy-chunk'; span.textContent=line; el.append(span); }
  };
  const format = n => '00:'+String(Math.floor(n)).padStart(2,'0');
  window.PV_SCENES.forEach((scene,i) => {
    const li=document.createElement('li'), button=document.createElement('button'), text=document.createElement('p');
    button.type='button'; button.textContent=format(scene.start)+'　'+titles[i].join(en ? ' ' : '');
    button.addEventListener('click',() => seek(scene.start));
    text.textContent=scene[film.lang].join(en ? ' ' : '　');
    li.append(button,text); $('scene-list').append(li);
  });
  let time=0, playing=false, anchorTime=0, anchorWall=0, raf=0, initialized=false, resumeHidden=false;
  let sceneIndex=-1, staticIndex=-1, staticNode=null, soundOn=false, audioContext=null, audioSource=null, audioBuffer=null, audioPromise=null;
  let audioEpoch=0, lastFrame=0, renderCalls=0;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=value => Math.max(0,Math.min(film.duration,Number.isFinite(value) ? value : 0));
  const now=() => playing ? clamp(anchorTime+(performance.now()-anchorWall)/1000) : time;
  function fit() {
    const scale=document.querySelector('.screen').clientWidth/1920;
    $('stage').style.transform=`scale(${scale})`;
    $('static-stage').style.transform=`scale(${scale})`;
    if (initialized) placeEndLink();
  }
  new ResizeObserver(fit).observe(document.querySelector('.screen'));
  fit();
  function controls() {
    $('play').textContent=playing ? labels.pause : labels.play;
    $('play').setAttribute('aria-label',$('play').textContent);
    $('sound').textContent=soundOn ? labels.sound : labels.muted;
    $('sound').setAttribute('aria-pressed',String(soundOn));
    $('replay').textContent=labels.replay;
  }
  function placeEndLink() {
    const target=presentation.endTarget ? $(presentation.endTarget) : motion.matches ? $('static-stage').querySelector('.ending .still-description') : $('urlPill');
    if (!target || time<ctaAt) return;
    const box=target.getBoundingClientRect(), screen=document.querySelector('.screen').getBoundingClientRect();
    Object.assign($('end-link').style,{left:(box.left-screen.left)+'px',top:(box.top-screen.top)+'px',width:box.width+'px',height:box.height+'px'});
  }
  function still(t, scene) {
    if (film.stillRender) { film.stillRender(t,scene); return; }
    const mapped=presentation.staticKeys ? presentation.staticKeys[scene] : scene;
    const key=mapped===3 && t>=19.6 ? 8 : mapped;
    if (key===staticIndex) return;
    staticIndex=key;
    const card=document.createElement('div');
    const paths=['photos/fuji-window','photos/fuji-window',`ui/${film.lang}-timeline-fuji`,`ui/${film.lang}-live-fuji-eta08`,'photos/fuji-snow','photos/tea-fields',`ui/${film.lang}-stamps`,null,`ui/${film.lang}-live-fuji-eta03`];
    card.className='still-card'+([2,3,6,8].includes(key) ? ' ui' : '')+(key===4 ? ' snow' : '')+(key===7 ? ' ending' : '');
    const kicker=document.createElement('p'); kicker.className='still-kicker'; kicker.textContent=chapters[scene]; card.append(kicker);
    if (paths[key]) { const box=document.createElement('div'); box.className='still-photo'; const img=new Image(); img.src='assets/'+paths[key]+'.webp'; img.alt=''; box.append(img); card.append(box); }
    const heading=document.createElement('h2'); chunks(heading,key===8 ? c.s4sub : titles[scene]); card.append(heading);
    const description=document.createElement('p'); description.className='still-description'; description.textContent=key===8 ? c.s4pill+' · 00:03' : key===7 ? 'michikusa-travel.com →' : details[scene]; card.append(description);
    const credit=document.createElement('p'); credit.className='still-credit'; credit.textContent=c.foot; card.append(credit);
    if (key===9) { card.classList.add('night-static'); card.innerHTML=film.nightMarkup; }
    const old=staticNode; card.style.opacity='0'; $('static-stage').append(card); staticNode=card;
    void card.offsetWidth; card.style.opacity='1';
    if (old) { old.style.opacity='0'; old.addEventListener('transitionend',() => old.remove(),{once:true}); setTimeout(() => old.remove(),500); }
  }
  function draw(value) {
    time=clamp(value); lastFrame=time*film.fps;
    const scene=sceneFor(time);
    if (motion.matches) still(time,scene);
    else { film.render(lastFrame); window.PV_CINEMA?.render(time); renderCalls++; }
    $('seek').value=String(time); $('time').textContent=format(time)+' / '+format(film.duration);
    $('seek').setAttribute('aria-valuetext',en ? `${time.toFixed(1)} of ${film.duration} seconds` : `${film.duration}秒中${time.toFixed(1)}秒`);
    if (scene!==sceneIndex) {
      sceneIndex=scene; $('scene-no').textContent=String(scene+1).padStart(2,'0')+' / '+String(titles.length).padStart(2,'0'); $('scene-label').textContent=chapters[scene];
      chunks($('caption-title'),titles[scene]); $('caption-detail').textContent=details[scene];
      [...$('scene-list').querySelectorAll('button')].forEach((b,i) => i===scene ? b.setAttribute('aria-current','step') : b.removeAttribute('aria-current'));
    }
    $('visit').hidden=time<ctaAt;
    $('end-link').hidden=time<ctaAt;
    if (time>=ctaAt) placeEndLink();
  }
  function stopAudio() {
    audioEpoch++;
    if (audioSource) { try { audioSource.stop(); } catch {} audioSource.disconnect(); audioSource=null; }
  }
  async function prepareAudio() {
    if (audioBuffer) return audioBuffer;
    if (!audioPromise) audioPromise=film.audio(0,film.duration).then(result => {
      audioBuffer=audioContext.createBuffer(2,result.data[0].length,result.sampleRate);
      result.data.forEach((channel,i) => audioBuffer.copyToChannel(channel,i));
      return audioBuffer;
    }).catch(error => { audioPromise=null; throw error; });
    return audioPromise;
  }
  async function startAudio() {
    stopAudio();
    if (!playing || !soundOn || !audioContext || document.hidden) return;
    const epoch=audioEpoch;
    try {
      const buffer=await prepareAudio();
      if (epoch!==audioEpoch || !playing || !soundOn || document.hidden) return;
      await audioContext.resume();
      if (epoch!==audioEpoch || !playing || !soundOn || document.hidden) return;
      const offset=now(); if (offset>=film.duration) return;
      audioSource=audioContext.createBufferSource(); audioSource.buffer=buffer; audioSource.connect(audioContext.destination); audioSource.start(0,offset);
    } catch(error) { soundOn=false; controls(); $('sound').title=labels.audioError; console.error(error); }
  }
  function loop() {
    if (!playing) return;
    // rAF timestamps can precede this callback after a busy rendering task.
    // Sample the elapsed clock here; never accumulate frame-count drift.
    draw(now());
    if (time>=film.duration) { pause(); return; }
    raf=requestAnimationFrame(loop);
  }
  function play() {
    if (!initialized) return;
    if (document.hidden) { resumeHidden=true; return; }
    if (playing) return;
    if (time>=film.duration) draw(0);
    playing=true; anchorTime=time; anchorWall=performance.now(); controls();
    raf=requestAnimationFrame(loop); startAudio();
  }
  function pause() {
    if (playing) draw(now());
    playing=false; cancelAnimationFrame(raf); stopAudio(); controls();
  }
  function seek(value) {
    if (!initialized) return;
    const wasPlaying=playing; pause(); draw(value);
    if (wasPlaying && time<film.duration) play();
  }
  $('play').addEventListener('click',() => { resumeHidden=false; playing ? pause() : play(); });
  $('replay').addEventListener('click',() => { pause(); draw(0); play(); });
  $('seek').addEventListener('input',() => seek(Number($('seek').value)));
  $('sound').addEventListener('click',async () => {
    soundOn=!soundOn; controls();
    if (!soundOn) { stopAudio(); return; }
    try {
      // Resume synchronously from the gesture, before offline synthesis.
      if (!audioContext || audioContext.state==='closed') audioContext=new AudioContext({sampleRate:48000});
      await audioContext.resume();
      if (soundOn) { if (playing) startAudio(); else await prepareAudio(); }
    } catch(error) { soundOn=false; controls(); $('sound').title=labels.audioError; console.error(error); }
  });
  document.addEventListener('keydown',event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.target.closest('button,a,input,select,textarea,summary,[contenteditable]')) return;
    if (event.code==='Space') { event.preventDefault(); playing ? pause() : play(); }
    if (event.key==='ArrowRight' || event.key==='ArrowLeft') { event.preventDefault(); seek(now()+(event.key==='ArrowRight' ? 5 : -5)); }
  });
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) { resumeHidden=playing; pause(); }
    else if (resumeHidden) { resumeHidden=false; play(); }
  });
  addEventListener('pagehide',event => { pause(); if (event.persisted) audioContext?.suspend(); else audioContext?.close(); });
  function applyMotion() {
    document.body.classList.toggle('reduced-motion',motion.matches); $('motion-note').hidden=!motion.matches; staticIndex=-1;
    if (initialized) draw(now());
  }
  motion.addEventListener('change',applyMotion); applyMotion(); controls();
  const ready=film.ready.then(() => {
    if (!presentation.details) {
      const timed=$('tagTime').textContent+(en ? ' approx. ' : '頃 ')+$('tagName').textContent+' · '+$('tagSeat').textContent;
      details[2]=timed+'　'+c.caveat; details[4]=timed+'　'+c.caveat;
    }
    initialized=true;
    draw(q.has('t') ? Number(q.get('t')) : 0);
    $('loading').hidden=true; document.querySelector('.player').setAttribute('aria-busy','false');
    ['play','sound','replay','seek'].forEach(id => $(id).disabled=false);
    if ((!q.has('t') || q.get('play')==='1') && q.get('play')!=='0') play();
  }).catch(error => { $('loading-text').textContent=labels.error; document.querySelector('.player').setAttribute('aria-busy','false'); console.error(error); throw error; });
  // Read-only diagnostics and the same actions as the visible controls, for QA.
  window.PV_PLAYER={ready,play,pause,seek,get state(){return {time:now(),renderedTime:time,frame:lastFrame,playing,soundOn,audioState:audioContext?.state||'not-created',audioReady:!!audioBuffer,audioPlaying:!!audioSource,reducedMotion:motion.matches,scene:sceneIndex,renderCalls};}};
})();
