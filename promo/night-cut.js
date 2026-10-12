/* A six-second night chapter inserted at 32.5s; the 43-second source is intact. */
(function(){
  'use strict';
  const base=window.PV_FILM, cinema=window.PV_CINEMA, en=base.lang!=='ja', c=base.copy;
  const NIGHT={ja:['夜にも、見たい景色がある。',['東京タワー','清洲城','ちきゅう'],'写真：michikusa'],en:['And when the sun goes down.',['Tokyo Tower','Kiyosu Castle','Chikyu'],'Photos: michikusa'],fr:['Et quand le soleil se couche.',['Tour de Tokyo','Château de Kiyosu','Chikyu'],'Photos : michikusa'],'zh-Hant':['入夜之後，也有想看的景色。',['東京鐵塔','清洲城','地球號'],'照片：michikusa'],de:['Auch nachts gibt es etwas zu sehen.',['Tokyo Tower','Burg Kiyosu','Chikyu'],'Fotos: michikusa'],es:['También hay vistas al caer la noche.',['Torre de Tokio','Castillo de Kiyosu','Chikyu'],'Fotos: michikusa'],'zh-Hans':['入夜之后，也有想看的景色。',['东京塔','清洲城','地球号'],'照片：michikusa'],ko:['밤에도 보고 싶은 풍경이 있어요.',['도쿄 타워','기요스성','지큐'],'사진: michikusa']}[base.lang];
  const title=NIGHT[0];
  const names=NIGHT[1];
  const kicker={de:'NACHT / AUSBLICKE',es:'DE NOCHE / GUÍA DE VISTAS','zh-Hans':'入夜以后 / 车窗图鉴',ko:'밤에도 / 차창 도감'}[base.lang]||'AFTER DARK / WINDOW FIELD GUIDE';
  const markup=`<p class="night-kicker">${kicker}</p><h2 class="night-heading">${title}</h2><div class="night-gallery">${['tower-night-alt','castle-night','chikyu-night'].map((name,i)=>`<figure><div class="night-photo"><img src="assets/photos/${name}.webp" alt=""></div><figcaption>${names[i]}</figcaption></figure>`).join('')}</div><p class="night-credit">${NIGHT[2]}</p>`;
  const overlay=document.createElement('section'); overlay.id='nightCut';overlay.innerHTML=base.progressive?markup.replaceAll('<img src=', '<img data-src='):markup;document.getElementById('stage').append(overlay);
  const map=t=>t<32.5?t:t<38.5?32.5:t-6;
  function render(f){
    const t=f/30,mapped=map(t);base.render(mapped*30);cinema.render(mapped);
    const active=t>=32.5&&t<38.5,p=Math.max(0,Math.min(1,(t-32.5)/.45)),out=Math.max(0,Math.min(1,(38.5-t)/.3));
    overlay.style.visibility=active?'visible':'hidden';overlay.style.opacity=String(active?Math.min(p,out):0);
    overlay.querySelector('.night-gallery').style.transform=`translateY(${(1-PV.ease.reveal(p))*35}px)`;
  }
  const nightScene={id:'S6b-night',start:32.5,end:38.5,ja:['夜にも、見たい景色がある。','東京タワー','清洲城','ちきゅう','写真：michikusa'],en:['And when the sun goes down.','Tokyo Tower','Kiyosu Castle','Chikyu','Photos: michikusa']};
  window.PV_SCENES=[...window.PV_SCENES.slice(0,6),nightScene,...window.PV_SCENES.slice(6).map(s=>({...s,start:s.start+6,end:s.end+6}))];
  const row=window.PV_ASSET_DATA[base.lang==='ja'?'ja':'en'],time=/\d\d:\d\d/.exec(row.rect.text)[0];
  const timed=time+' '+c.suffix+' '+(c.fuji||row.row)+' · '+c.seatE+'　'+c.caveat;
  async function audio(){
    return base.audio(0,49,{night:true});
  }
  function prepare(t,ahead=0){
    const jobs=[];
    if(t<32.5||t+ahead>=38.5)jobs.push(base.prepare(map(t),ahead));
    if(t+ahead>=32.5&&t<38.5)jobs.push(base.prepareImages([...overlay.querySelectorAll('img')]));
    return Promise.all(jobs);
  }
  const ready=Promise.all([base.ready,...(base.progressive?[]:[...overlay.querySelectorAll('img')].map(im=>im.decode()))]).then(()=>render(0));
  window.PV_CINEMA=null;
  window.PV_FILM={...base,ready,prepare,render,audio,duration:49,nightMarkup:markup,presentation:{
    edition:'cinema',ctaAt:44.9,staticKeys:[0,1,2,3,4,5,9,6,7],
    note:en?'CINEMA — From daylight into the night. 49 seconds.':'CINEMA — 昼から夜へ。夜景を6秒加えた49秒。',
    chapters:['WINDOW TIME','SHINKANSEN WINDOW','BEFORE THE RIDE','ON THE TRAIN','LOOK UP','WINDOW FIELD GUIDE','AFTER DARK','AFTER THE RIDE','YOUR NEXT JOURNEY'],
    titles:[[...c.s1l1,...c.s1l2],c.s2def,c.s3h,c.s4h,c.s5h,c.s6h,[title],c.s7h,c.s8h],
    details:[c.s1eb,'50+ '+c.countUnit+' · '+c.s2label,timed,c.s4sub.join(en?' ':'')+' '+c.s4pill,timed,c.s6sub,names.join(' · '),en?'Mt. Fuji · Fuji River Bridge · Mt. Ibuki':'富士山・富士川橋梁・伊吹山',c.wordmark]
  }};
})();
