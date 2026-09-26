/* A six-second night chapter inserted at 32.5s; the 43-second source is intact. */
(function(){
  'use strict';
  const base=window.PV_FILM, cinema=window.PV_CINEMA, en=base.lang==='en', c=base.copy;
  const title=en?'And when the sun goes down.':'夜にも、見たい景色がある。';
  const names=en?['Tokyo Tower','Kiyosu Castle','Chikyu']:['東京タワー','清洲城','ちきゅう'];
  const markup=`<p class="night-kicker">AFTER DARK / WINDOW FIELD GUIDE</p><h2 class="night-heading">${title}</h2><div class="night-gallery">${['tower-night-alt','castle-night','chikyu-night'].map((name,i)=>`<figure><div class="night-photo"><img src="assets/photos/${name}.webp" alt=""></div><figcaption>${names[i]}</figcaption></figure>`).join('')}</div><p class="night-credit">${en?'Photos: michikusa':'写真：michikusa'}</p>`;
  const overlay=document.createElement('section'); overlay.id='nightCut';overlay.innerHTML=markup;document.getElementById('stage').append(overlay);
  const map=t=>t<32.5?t:t<38.5?32.5:t-6;
  function render(f){
    const t=f/30,mapped=map(t);base.render(mapped*30);cinema.render(mapped);
    const active=t>=32.5&&t<38.5,p=Math.max(0,Math.min(1,(t-32.5)/.45)),out=Math.max(0,Math.min(1,(38.5-t)/.3));
    overlay.style.visibility=active?'visible':'hidden';overlay.style.opacity=String(active?Math.min(p,out):0);
    overlay.querySelector('.night-gallery').style.transform=`translateY(${(1-PV.ease.reveal(p))*35}px)`;
  }
  const nightScene={id:'S6b-night',start:32.5,end:38.5,ja:['夜にも、見たい景色がある。','東京タワー','清洲城','ちきゅう','写真：michikusa'],en:['And when the sun goes down.','Tokyo Tower','Kiyosu Castle','Chikyu','Photos: michikusa']};
  window.PV_SCENES=[...window.PV_SCENES.slice(0,6),nightScene,...window.PV_SCENES.slice(6).map(s=>({...s,start:s.start+6,end:s.end+6}))];
  const row=window.PV_ASSET_DATA[base.lang],time=/\d\d:\d\d/.exec(row.rect.text)[0];
  const timed=time+(en?' approx. ':'頃 ')+row.row+' · '+c.seatE+'　'+c.caveat;
  async function audio(){
    const old=await base.audio(0,43), sr=old.sampleRate,cut=Math.round(32.5*sr),insert=6*sr;
    const night=await PV.renderAudio(0,6,async(api)=>{
      for(const hz of [110,164.81,220]) api.tone(.1,hz,{db:-28,attack:.6,decay:2.4,dur:5.8});
    },{peakDb:-15,reverbWet:.15});
    const data=old.data.map((channel,i)=>{const out=new Float32Array(49*sr);out.set(channel.subarray(0,cut));out.set(night.data[i],cut);out.set(channel.subarray(cut),cut+insert);for(let k=0;k<sr/20;k++){out[cut-1-k]*=k/(sr/20);out[cut+insert+k]*=k/(sr/20);}return out;});
    return {sampleRate:sr,data};
  }
  const ready=Promise.all([base.ready,...[...overlay.querySelectorAll('img')].map(im=>im.decode())]).then(()=>render(0));
  window.PV_CINEMA=null;
  window.PV_FILM={...base,ready,render,audio,duration:49,nightMarkup:markup,presentation:{
    edition:'cinema',ctaAt:44.9,staticKeys:[0,1,2,3,4,5,9,6,7],
    note:en?'CINEMA — From daylight into the night. 49 seconds.':'CINEMA — 昼から夜へ。夜景を6秒加えた49秒。',
    chapters:['WINDOW TIME','SHINKANSEN WINDOW','BEFORE THE RIDE','ON THE TRAIN','LOOK UP','WINDOW FIELD GUIDE','AFTER DARK','AFTER THE RIDE','YOUR NEXT JOURNEY'],
    titles:[[...c.s1l1,...c.s1l2],c.s2def,c.s3h,c.s4h,c.s5h,c.s6h,[title],c.s7h,c.s8h],
    details:[c.s1eb,'50+ '+c.countUnit+' · '+c.s2label,timed,c.s4sub.join(en?' ':'')+' '+c.s4pill,timed,c.s6sub,names.join(' · '),en?'Mt. Fuji · Fuji River Bridge · Mt. Ibuki':'富士山・富士川橋梁・伊吹山',c.wordmark]
  }};
})();
