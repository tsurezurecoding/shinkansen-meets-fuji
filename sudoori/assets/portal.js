(() => {
 'use strict';
 const D=window.ROUTE,$=id=>document.getElementById(id);
 const stories=[
 {id:'tanna',key:'静岡県函南町',name:'函南町',pref:'静岡県',hook:['トンネルの上は、','牛乳の里。'],intro:'暗いトンネルの上に、牛が暮らす盆地がある。丹那牛乳と、鉄道が変えた暮らしの話。',context:'熱海〜三島／新丹那トンネルで町を通過。丹那盆地は地上にあります。',source:'Tanna_Basin_01.jpg',author:'Batholith',license:'Public Domain',licenseUrl:'https://commons.wikimedia.org/wiki/File:Tanna_Basin_01.jpg'},
 {id:'nishio',key:'愛知県西尾市',name:'西尾市',pref:'愛知県',hook:['抹茶の緑は、','日陰で育つ。'],intro:'鮮やかな抹茶の色を生むのは、茶畑を覆う黒い布。見慣れた一杯の、知らなかった始まり。',context:'豊橋〜三河安城／西尾市の北部を通過。写真は市内の茶園です。',source:'Nishio_Tea_plantation1.JPG',author:'At by At',license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/'},
 {id:'sekigahara',key:'岐阜県関ケ原町',name:'関ケ原町',pref:'岐阜県',hook:['天下分け目は、','通り道。'],intro:'なぜ、ここが歴史の舞台になったのか。新幹線も街道も集まる、山あいの地形から考える。',context:'岐阜羽島〜米原／関ケ原の町を通過。写真は石田三成陣跡からの眺めです。',source:'Battlefield_of_Sekigahara_viewed_from_site_of_Ishida_Mitsunari.jpg',author:'Saigen Jiro',license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/'},
 {id:'shimamoto',key:'大阪府島本町',name:'島本町',pref:'大阪府',hook:['名酒を育てる、','山と川。'],intro:'「山崎」という名前の向こうにある、水と地形。ウイスキーがこの土地で生まれた理由をたどる。',context:'京都〜新大阪／島本町を通過。蒸溜所の位置と地図の通過目印は異なります。'}
 ];
 const towns=Object.fromEntries(D.towns.map(t=>[t.key,t]));
 const firstStory=stories.find(s=>s.id==='shimamoto');stories.splice(stories.indexOf(firstStory),1);stories.unshift(firstStory);
 Object.assign(firstStory,{context:'京都〜新大阪／E席側。山裾の蒸溜所は、屋根や電線の向こうに一瞬見えます。',image:'../images/20260924_yamazaki-distillery_6867_michikusa.jpg',ownerCredit:'車窓写真：michikusa（2026年9月撮影）'});
 let selected=stories[0],t=0,playing=false,last=0,follow=false,map,train,activeLine=-1,lastPan=0,lastTown='',animation;
 const lines=[],pins={};
 const fmt=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
 function ll(km){const p=D.points;let i=1;while(i<p.length-1&&p[i][2]<km)i++;let a=p[i-1],b=p[i],f=Math.max(0,Math.min(1,(km-a[2])/(b[2]-a[2]||1)));return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]}
 function km(sec){for(let i=1;i<D.stations.length;i++){const a=D.stations[i-1],b=D.stations[i];if(sec<=b.sec)return a.km+(b.km-a.km)*(sec-a.sec)/(b.sec-a.sec)}return D.totalKm}
 function runIndex(){const i=D.runs.findIndex(r=>t<r.sb);return i<0?D.runs.length-1:i}
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function overview(tw){selected={key:tw.key};$('story-preview').classList.add('is-overview');$('story-preview').innerHTML=`<div class="preview-copy"><p class="eyebrow">${esc(tw.pref)} ${esc(tw.name)} · 町の横顔</p><h3>${esc(tw.name)}</h3><p>${esc(tw.intro||'新幹線が通り抜ける町。地図と通過時間から、この町との距離を感じてみよう。')}</p><p class="preview-context">${tw.stations.length?'新幹線の駅：'+esc(tw.stations.join('・')):'新幹線の駅がない町'} ／ 通過する距離 ${tw.km.toFixed(2)}km</p></div>`;Object.entries(pins).forEach(([id,p])=>p.setIcon(icon(stories.findIndex(x=>x.id===id)+1,false)));}
 function save(){try{sessionStorage.setItem('sudoori-portal-v2',JSON.stringify({t,id:selected.id,key:towns[D.runs[runIndex()].key].key}))}catch{}}
 function stop(){playing=false;cancelAnimationFrame(animation);$('play').textContent=t>=D.totalSec?'↻ 最初から通る':'▶ 地図の旅を始める';$('play').setAttribute('aria-pressed','false');save()}
 function update(){const i=runIndex(),r=D.runs[i],tw=towns[r.key];$('progress').value=t;$('clock').textContent=fmt(t)+' / 147:00';$('now-pref').textContent=tw.pref;$('now-town').textContent=tw.name;$('now-hint').textContent=tw.stations.length?'新幹線の駅：'+tw.stations.join('・'):'新幹線の駅がない町';if(lastTown!==tw.key){$('focus-pref').textContent=tw.pref;$('focus-name').textContent=tw.name;$('focus-intro').textContent=tw.intro||'地図から、この町の通り道を眺めてみよう。';lastTown=tw.key;const story=stories.find(s=>s.key===tw.key);if(story)choose(story,false);else overview(tw);const url=new URL(location.href);url.searchParams.set('town',story?story.id:tw.key);history.replaceState(null,'',url);}document.dispatchEvent(new Event('route-update'));if(!map)return;train.setLatLng(ll(km(t)));if(i!==activeLine){if(lines[activeLine])lines[activeLine].setStyle({weight:4,opacity:.65});lines[i].setStyle({weight:8,opacity:1});activeLine=i}if(follow&&performance.now()-lastPan>180){map.panTo(ll(km(t)),{animate:false});lastPan=performance.now()}}
 function choose(s,move=true){if(move)stop();selected=s;const num=stories.indexOf(s)+1;const credit=s.ownerCredit|| (s.sourceUrl?`車窓写真：<a href="${s.sourceUrl}">${s.author}</a> · トリミング表示`:`写真：<a href="https://commons.wikimedia.org/wiki/File:${s.source}">${s.author}</a> / <a href="${s.licenseUrl}">${s.license}</a> · トリミング表示`);
 $('story-preview').classList.remove('is-overview');$('story-preview').innerHTML=`<div class="preview-picture"><img src="${s.image||'../images/sudoori/'+s.id+'.jpg'}" alt="${s.name}の風景"><span class="preview-number">STORY 0${num}</span></div><div class="preview-copy"><p class="eyebrow">${s.pref} ${s.name}</p><h3>${s.hook.map(x=>'<span class="copy-chunk">'+x+'</span>').join('')}</h3><p>${s.intro}</p><p class="preview-context">${s.context}</p><a class="preview-go" href="stories/${s.id}.html">この町の話を読む <span aria-hidden="true">→</span></a><p class="preview-credit">${credit}</p></div>`;
 Object.entries(pins).forEach(([id,p])=>{p.setIcon(icon(stories.findIndex(x=>x.id===id)+1,id===s.id))});
 if(move){const r=D.runs.find(x=>x.key===s.key);t=r.sa+.1;follow=false;$('follow').setAttribute('aria-pressed','false');update();if(map)map.setView(ll((r.a+r.b)/2),10,{animate:false})}save();
 }
 function icon(n,on){return L.divIcon({className:'story-pin'+(on?' is-selected':''),html:'<span>'+n+'</span>',iconSize:[32,32],iconAnchor:[16,16]})}
 try{if(!window.L)throw Error('map library unavailable');map=L.map('map',{scrollWheelZoom:false,zoomControl:false});L.control.zoom({position:'topright'}).addTo(map);L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',{maxZoom:16,minZoom:5,attribution:'<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>'}).on('tileerror',()=>$('map-fallback').hidden=false).addTo(map);
 for(const r of D.runs){const pts=[ll(r.a),...D.points.filter(p=>p[2]>r.a&&p[2]<r.b).map(p=>p.slice(0,2)),ll(r.b)];lines.push(L.polyline(pts,{color:stories.some(s=>s.key===r.key)?'#a5482f':'#526a64',weight:4,opacity:.65}).bindTooltip(towns[r.key].pref+' '+towns[r.key].name,{sticky:true}).on('click',()=>{stop();t=r.sa+.1;const s=stories.find(s=>s.key===r.key);if(s)choose(s);else update()}).addTo(map))}
 for(const st of D.stations.filter(x=>['東京','新横浜','名古屋','京都','新大阪'].includes(x.ja))){L.circleMarker(ll(st.km),{radius:3,color:'#243e38',fillColor:'#fff',fillOpacity:1,weight:2}).bindTooltip(st.ja,{permanent:true,direction:'right',className:'station-label'}).addTo(map)}
 for(const [i,s] of stories.entries()){const r=D.runs.find(x=>x.key===s.key);pins[s.id]=L.marker(ll((r.a+r.b)/2),{icon:icon(i+1,s.id===selected.id),title:s.name+'の話を読む',alt:s.name+'の読み物',keyboard:true}).bindTooltip(s.name,{direction:'top',offset:[0,-15]}).on('click',()=>choose(s)).addTo(map)}
 train=L.marker(ll(0),{icon:L.divIcon({className:'train-dot',iconSize:[17,17],iconAnchor:[8,8]}),interactive:false,keyboard:false}).addTo(map);
 map.fitBounds(D.points.map(p=>p.slice(0,2)),{padding:[28,40]});map.on('dragstart',()=>{follow=false;$('follow').setAttribute('aria-pressed','false')});
 }catch(e){$('map-fallback').hidden=false}
 $('fit').onclick=()=>{follow=false;$('follow').setAttribute('aria-pressed','false');if(map)map.fitBounds(D.points.map(p=>p.slice(0,2)),{padding:[28,40]})};
 $('follow').onclick=()=>{follow=!follow;$('follow').setAttribute('aria-pressed',String(follow));if(follow&&map)map.setView(ll(km(t)),10,{animate:false})};
 $('progress').oninput=()=>{stop();t=+$('progress').value;update();save()};
 function frame(now){if(!playing)return;t=Math.min(D.totalSec,t+(now-last)/1000*+$('speed').value);last=now;update();if(t>=D.totalSec){stop();return}animation=requestAnimationFrame(frame)}
 $('play').onclick=()=>{if(playing){stop();return}if(t>=D.totalSec)t=0;follow=true;$('follow').setAttribute('aria-pressed','true');if(map)map.setView(ll(km(t)),11,{animate:false});playing=true;last=performance.now();$('play').textContent='Ⅱ ここで止まる';$('play').setAttribute('aria-pressed','true');update();animation=requestAnimationFrame(frame)};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',save);document.querySelectorAll('a[href^="stories/"]').forEach(a=>a.addEventListener('click',save));$('story-preview').addEventListener('click',e=>{if(e.target.closest('a'))save()});
 document.addEventListener('time-seek',e=>{const r=D.runs[e.detail.index];if(!r)return;stop();t=r.sa+.01;const s=stories.find(x=>x.key===r.key);if(s)choose(s,false);follow=true;$('follow').setAttribute('aria-pressed','true');if(map)map.setView(ll(km(t)),11,{animate:false});update();save();});
 const param=new URLSearchParams(location.search).get('town');let stored;try{stored=JSON.parse(sessionStorage.getItem('sudoori-portal-v2'))}catch{}
 const initial=stories.find(s=>s.id===param||s.key===param)||stories.find(s=>s.id===stored?.id)||stories[0];const requestedTown=towns[param]||towns[initial.key];choose(initial,false);
 if(stored&&Number.isFinite(stored.t)&&stored.t>=0&&stored.t<=D.totalSec&&(!param||param===stored.id||param===stored.key)){t=stored.t;update();}else{const r=D.runs.find(x=>x.key===requestedTown.key);t=r.sa+.1;}
 update();
})();
