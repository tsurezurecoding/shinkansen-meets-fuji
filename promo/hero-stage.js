/* Runs inside hero-stage.html (an iframe on the TOP). Renders the approved
 * CINEMA film with its own engine (PV_FILM.render) — no redesign — and adds:
 * a hero frame (scene 0) that the film starts from and returns to, chapter
 * navigation driven by the parent page, swipe / horizontal wheel, and the
 * rule that any manual move stops the automatic advance. Silent. */
(() => {
  'use strict';
  const film = window.PV_FILM;
  const FPS = 30;
  const stage = document.getElementById('stage');
  const frame = document.getElementById('frame');
  const q = new URLSearchParams(location.search);
  const en = film.lang === 'en';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let restricted = motion.matches || !!navigator.connection?.saveData;
  const HERO_SEC = 4.6, HERO_FADE = 0.9;

  // chapters of the film, without the closing URL card (the TOP itself is the call to action)
  const scenes = window.PV_SCENES.filter((s) => s.id !== 'S8-end-card');
  const LAST = scenes[scenes.length - 1].end;

  // fit the 1920x1080 stage into the iframe (the parent keeps the iframe 16:9)
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `scale(${s})`;
    stage.style.transformOrigin = '0 0';
    Object.assign(frame.style, { width: 1920 * s + 'px', height: 1080 * s + 'px', position: 'absolute', left: (innerWidth - 1920 * s) / 2 + 'px', top: (innerHeight - 1080 * s) / 2 + 'px', margin: '0' });
  }
  addEventListener('resize', fit); fit();
  const bgEl = document.getElementById('bg');
  let lastBand = '';
  function band() {
    // letterbox bands take the colour of the current scene background
    // the night chapter draws its own #081521 panel over the stage
    const cut = document.getElementById('nightCut');
    const nightOn = cut && cut.style.visibility === 'visible' && Number(cut.style.opacity || 0) > 0.5;
    const c = heroOn > 0.5 || nightOn ? '#081521' : (getComputedStyle(bgEl).backgroundColor || '#081521');
    if (c !== lastBand) { document.body.style.background = c; document.documentElement.style.background = c; lastBand = c; }
  }

  // night chapter (inserted at 32.5-38.5 s): stagger the three views and push in slowly
  const NIGHT = [32.5, 38.5];
  let night = null;
  function nightFx() {
    const cut = document.getElementById('nightCut');
    if (!cut) return;
    if (!night) {
      const h = cut.querySelector('.night-heading');
      h.innerHTML = '<span>' + h.textContent + '</span>';
      const glow = document.createElement('div'); glow.className = 'night-glow'; cut.prepend(glow);
      night = { head: h.firstChild, kick: cut.querySelector('.night-kicker'), figs: [...cut.querySelectorAll('.night-gallery figure')], imgs: [...cut.querySelectorAll('.night-photo img')], gallery: cut.querySelector('.night-gallery') };
    }
    const k = t - NIGHT[0];
    if (k < -0.1 || k > 6.1) return;
    const e = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
    night.gallery.style.transform = 'none';
    night.kick.style.opacity = String(e((k - 0.05) / 0.5));
    night.head.style.transform = 'translateY(' + (1 - e((k - 0.1) / 0.7)) * 105 + '%)';
    night.figs.forEach((f, i) => {
      const p = e((k - 0.45 - i * 0.28) / 0.8);
      f.style.opacity = String(p);
      f.style.transform = 'translateY(' + (1 - p) * 40 + 'px)';
    });
    night.imgs.forEach((im, i) => { im.style.transform = 'scale(' + (1.14 - 0.1 * Math.min(1, Math.max(0, (k - 0.45 - i * 0.28) / 5.2))) + ')'; });
  }

  // hero frame (scene 0): the hero photo with the site's own gradient; the
  // parent overlays the real hero heading and buttons on top of it
  const hero = document.createElement('div');
  hero.id = 'heroFrame';
  hero.innerHTML = '<img src="assets/photos/fuji-snow.webp" alt="">';
  document.body.append(hero);

  // transition veil used only for manual chapter jumps
  const veil = document.createElement('div');
  veil.id = 'heroVeil';
  stage.append(veil);


  const origin=location.protocol==='file:'?'*':location.origin;
  const trusted=e=>location.protocol==='file:'?['null','file://'].includes(e.origin):e.origin===location.origin;
  const post=msg=>parent.postMessage({type:'hero-film',...msg},origin);
  let t=0,heroOn=1,mode='hero',auto=!restricted,chapter=-1,chapterEnd=0,last=0,heroTimer=0,jumpAt=-1,jumpDir=1;
  let visible=false,ready=false,raf=0,pausedMode=null,finished=false,lastHero=null;
  const PHONE_AT=1,PHONE_HOLD=1.6;let holdLeft=PHONE_HOLD;
  const playing=()=>!pausedMode&&((mode==='hero'&&auto)||['auto','chapter','return'].includes(mode));
  const state=()=>post({action:'state',playing:playing(),auto,finished});
  function advance(dt){
    if(t<PHONE_AT&&t+dt>=PHONE_AT){t=PHONE_AT;return;}
    if(t===PHONE_AT&&holdLeft>0){holdLeft=Math.max(0,holdLeft-dt);return;}
    t+=dt;
  }
  const drawn={f:-1};
  function draw(){
    const f=Math.round(t*FPS);if(f!==drawn.f){film.render(f);drawn.f=f;nightFx();}
    band();hero.style.opacity=String(heroOn);hero.style.visibility=heroOn>.001?'visible':'hidden';
    hero.querySelector('img').style.transform='scale('+ (1.22+.04*heroOn)+')';
    let ch=-1;if(heroOn<.5)scenes.forEach((s,i)=>{if(t>=s.start-.001)ch=i;});
    if(ch!==chapter){chapter=ch;post({action:'chapter',chapter});}
    const shown=heroOn>=.5;if(shown!==lastHero){lastHero=shown;post({action:'hero',value:shown?1:0});}
  }
  function wake(){cancelAnimationFrame(raf);raf=0;last=0;if(ready&&visible&&!document.hidden&&(playing()||jumpAt>=0))raf=requestAnimationFrame(loop);}
  function go(i,input='rail'){
    if(!Number.isInteger(i)||i< -1||i>=scenes.length)return;
    auto=false;finished=false;pausedMode=null;post({action:'manual',chapter:i,input});
    if(i<0){if(restricted){heroOn=1;mode='hero';draw();}else mode='return';state();wake();return;}
    const s=scenes[i];jumpDir=i>=chapter?1:-1;jumpAt=restricted?-1:performance.now();
    t=s.start;holdLeft=PHONE_HOLD;chapterEnd=s.end-.45;mode=restricted?'hold':'chapter';
    if(restricted)t=Math.max(s.start,chapterEnd-.2);heroOn=0;draw();state();wake();
  }
  function step(d,input){if(d!==1&&d!==-1)return;const n=(heroOn>.5?-1:chapter)+d;if(n< -1)return;go(n>=scenes.length?-1:n,input);}
  function loop(now){
    raf=0;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
    if(!visible||document.hidden)return;
    if(!pausedMode){
      if(mode==='hero'&&auto){heroTimer+=dt;if(heroTimer>=HERO_SEC){mode='auto';t=0;holdLeft=PHONE_HOLD;}}
      else if(mode==='auto'){heroOn=Math.max(0,heroOn-dt/HERO_FADE);advance(dt);if(t>=LAST-.45){t=LAST-.45;mode='return';}}
      else if(mode==='chapter'){advance(dt);t=Math.min(chapterEnd,t);if(t>=chapterEnd){mode='hold';state();}}
      else if(mode==='return'){heroOn=Math.min(1,heroOn+dt/HERO_FADE);if(heroOn>=1){mode='hero';heroTimer=0;if(auto){auto=false;finished=true;post({action:'complete'});}state();}}
    }
    if(jumpAt>=0){const k=Math.min(1,(now-jumpAt)/420),e=1-Math.pow(1-k,3);veil.style.opacity=String(1-e);stage.style.translate=((1-e)*36*jumpDir)+'px 0';if(k>=1){jumpAt=-1;stage.style.translate='0 0';}}
    draw();if(playing()||jumpAt>=0)raf=requestAnimationFrame(loop);
  }
  let sx=0,sy=0,down=false;
  addEventListener('pointerdown',e=>{down=true;sx=e.clientX;sy=e.clientY;});
  addEventListener('pointercancel',()=>{down=false;});
  addEventListener('pointerup',e=>{if(!down)return;down=false;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)step(dx<0?1:-1,'swipe');});
  let wheelLock=0;
  addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||Math.abs(e.deltaX)<12)return;e.preventDefault();const now=performance.now();if(now<wheelLock)return;wheelLock=now+700;step(e.deltaX>0?1:-1,'wheel');},{passive:false});
  addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1,'key');}});
  function preferences(value){restricted=value;if(restricted){auto=false;pausedMode=null;mode='hold';jumpAt=-1;veil.style.opacity='0';stage.style.translate='0 0';draw();state();}wake();}
  addEventListener('message',e=>{
    if(e.source!==parent||!trusted(e)||e.data?.type!=='hero-film'||!ready)return;
    const d=e.data;
    if(d.action==='go')go(d.chapter,d.input);
    else if(d.action==='step')step(d.dir,d.input);
    else if(d.action==='visibility'){visible=!!d.visible;wake();}
    else if(d.action==='preferences')preferences(!!d.restricted||motion.matches);
    else if(d.action==='pause'){if(playing()){pausedMode=mode;auto=false;}state();wake();}
    else if(d.action==='play'){
      if(restricted){go(chapter<0?0:chapter,'play');return;}
      finished=false;auto=true;if(pausedMode){mode=pausedMode;pausedMode=null;}else if(mode==='hold'||mode==='chapter')mode='auto';
      if(mode==='hero')heroTimer=HERO_SEC;state();wake();
    }
  });
  document.addEventListener('visibilitychange',wake);motion.addEventListener('change',()=>preferences(motion.matches||!!navigator.connection?.saveData));
  addEventListener('pagehide',()=>cancelAnimationFrame(raf));addEventListener('pageshow',wake);
  Promise.all([film.ready,hero.querySelector('img').decode()]).then(()=>{ready=true;fit();draw();post({action:'ready',playing:playing(),auto});wake();},()=>post({action:'error'}));
  // Read-only playback diagnostics, also useful for deterministic integration checks.
  window.HERO_STAGE={get state(){return {time:t,mode,auto,chapter,heroOn,playing:playing(),finished,visible,restricted,holdLeft};}};
})();
