(() => {
 const D=window.ROUTE,$=id=>document.getElementById(id),towns=Object.fromEntries(D.towns.map(x=>[x.key,x]));
 let active=false,last=-1,lastMascot='';
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mascot(tw){if(lastMascot===tw.key)return;lastMascot=tw.key;const m=tw.mascot;
  if(!m){$('mascot-card').innerHTML='<p class="eyebrow">'+esc(tw.name)+'の地域キャラクター</p><h3>町の顔を、探してみる。</h3><p>この町を知る手がかりを、公式の観光案内で探してみよう。</p>';return;}
  const image=m.image?'<img class="mascot-image" src="'+esc(m.image)+'" alt="'+esc(m.name)+'">':'<div class="mascot-nameplate" aria-hidden="true">'+esc(Array.from(m.name)[0])+'</div>';
  const status={'municipal-official':'自治体公式','tourism-association':'観光協会','other-official-body':'地域の団体','unofficial':'地域キャラクター'}[m.status]||'地域キャラクター';
  $('mascot-card').innerHTML='<p class="eyebrow">'+esc(tw.name)+'の地域キャラクター</p>'+image+'<h3>'+esc(m.name)+'</h3><p class="mascot-role">'+status+'</p><p>'+esc(m.description||m.owner)+'</p>'+(m.sourceUrl?'<a href="'+esc(m.sourceUrl)+'" target="_blank" rel="noopener">公式の紹介を見る ↗</a>':'')+(m.image?'<p class="mascot-credit">'+esc(m.credit)+' · <a href="'+esc(m.rulesUrl)+'" target="_blank" rel="noopener">利用条件</a></p>':'<p class="mascot-note">名札で紹介しています。姿は公式ページで。</p>');
 }
 const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
 const duration=s=>s<60?s.toFixed(1)+'秒':Math.floor(s/60)+'分'+(s%60).toFixed(1)+'秒';
 const current=()=>{const i=D.runs.findIndex(r=>+$('progress').value<r.sb);return i<0?D.runs.length-1:i};
 function show(){const i=current(),t=+$('progress').value,r=D.runs[i],tw=towns[r.key];
  $('time-town').value=r.key;$('slice-duration').textContent=duration(r.sb-r.sa);$('slice-left').textContent=duration(Math.max(0,r.sb-t));
  $('slice-context').textContent=tw.pref+' '+tw.name+' ／ 東京から '+fmt(r.sa)+'〜'+fmt(r.sb)+' ／ '+(r.b-r.a).toFixed(2)+'km';
  $('town-total').textContent='同じ町の全区間合計：'+duration(tw.sec)+'（'+tw.km.toFixed(2)+'km）';
  mascot(tw);
  $('slice-prev').disabled=i===0;$('slice-next').disabled=i===D.runs.length-1;$('slice-cursor').style.left=t*2+'px';
  if(i!==last){document.querySelectorAll('[data-slice]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.slice===i)));if(active)$('slice-scroll').scrollLeft=Math.max(0,t*2-$('slice-scroll').clientWidth/3);last=i;}
 }
 function seek(i){if(!D.runs[i])return;document.dispatchEvent(new CustomEvent('time-seek',{detail:{index:i}}));show()}
 function toggle(on){active=on;$('time-panel').hidden=!on;$('time-toggle').setAttribute('aria-expanded',String(on));$('time-toggle').textContent=on?'通過時間を閉じる ↑':'町ごとの通過時間を見る ↗';const url=new URL(location.href);if(on)url.searchParams.set('view','time');else url.searchParams.delete('view');history.replaceState(null,'',url);document.dispatchEvent(new CustomEvent('time-mode',{detail:{active:on}}));last=-1;show()}
 $('time-town').innerHTML=D.towns.map(tw=>'<option value="'+tw.key+'">'+tw.pref+' '+tw.name+' · '+duration(tw.sec)+'</option>').join('');
 $('slice-track').style.width=D.totalSec*2+'px';
 for(const [i,r] of D.runs.entries()){const tw=towns[r.key],b=document.createElement('button');b.type='button';b.className='time-slice '+(tw.nozomi?'has-nozomi':tw.stations.length?'has-station':'no-station');b.dataset.slice=i;b.style.left=r.sa*2+'px';b.style.width=(r.sb-r.sa)*2+'px';b.textContent=tw.name+' '+duration(r.sb-r.sa);b.title=tw.pref+' '+b.textContent;b.setAttribute('aria-label',b.title);b.onclick=()=>seek(i);$('slice-track').appendChild(b)}
 $('time-toggle').onclick=()=>toggle(!active);$('time-town').onchange=()=>seek(D.runs.findIndex(r=>r.key===$('time-town').value));$('slice-prev').onclick=()=>seek(current()-1);$('slice-next').onclick=()=>seek(current()+1);
 document.addEventListener('route-update',show);show();if(new URLSearchParams(location.search).get('view')==='time')toggle(true);
})();
