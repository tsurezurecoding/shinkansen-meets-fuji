import { assetVersion } from './asset-version.mjs';

// Photo-time GPS estimates; Tower alone is projected onto the existing railway.
// Heights and destination representative points are schematic.
export const TOKYO_SCENES = [
  {id:'tower',label:'東京タワー',photo:'20261010_tokyo-tower_155558_michikusa.jpg',alt:'車窓のビルの間に見える赤い東京タワー',date:'2026年10月10日',seat:'E席側',train:[139.7574288,35.6560242,64],target:[139.74543,35.65858,370],heading:283,distanceKm:1.1,district:'13103',range:2100,note:'手前のビルの向こうに、赤い塔。線の先が東京タワーの位置です。'},
  {id:'bridge',label:'レインボーブリッジ',photo:'20260924_rainbow-bridge_21057_michikusa.jpg',alt:'建物と倉庫の向こうに見えるレインボーブリッジの白い主塔',date:'2026年9月24日',seat:'A席側',train:[139.74263081,35.63631611,64],target:[139.7634,35.6366,140],heading:89,distanceKm:1.9,district:'13103',range:3000,note:'倉庫の屋根の向こうに白い主塔。線は橋の中央付近を示します。橋の主塔・ケーブルの形は模型に含まれません。'},
  {id:'station',label:'東京駅',photo:'20260924_tokyo-station_19505_michikusa.jpg',alt:'線路とホームの向こうに見える東京駅丸の内駅舎のドーム',date:'2026年9月24日',seat:'E席側',train:[139.76714909,35.67930879,64],target:[139.7653,35.6805,54],heading:308,distanceKm:0.2,district:'13101',range:1000,note:'ホームの向こう、丸の内駅舎のドーム。線の先は駅舎南側の代表点です。'}
];
const enabled=(spot,lang)=>spot.id==='tokyo-tower'&&lang==='ja';
export function tokyoSightlineHead(spot,lang,prefix){return enabled(spot,lang)?'\n  <link rel="stylesheet" href="'+prefix+'tokyo-sightline.css?v='+assetVersion('tokyo-sightline.css')+'">':'';}
export function tokyoSightlineHTML(spot,lang,prefix){
 if(!enabled(spot,lang))return '';
 const s=TOKYO_SCENES[0];
 return `<section class="spot-page-section tokyo-sightline" id="tokyo-sightline" aria-labelledby="tokyo-sightline-title" data-tokyo-sightline data-scenes="${JSON.stringify(TOKYO_SCENES).replaceAll('"','&quot;')}" data-engine="${prefix}tokyo-sightline-stage.js?v=${assetVersion('tokyo-sightline-stage.js')}">
 <p class="eyebrow spot-reading-eyebrow" lang="en">BEYOND THE WINDOW</p>
 <h2 id="tokyo-sightline-title"><span class="copy-chunk">あの景色は、</span><span class="copy-chunk">街のどこ？</span></h2>
 <p>車窓に見えたものと撮影位置を、一本の線でつなぎます。写真を選び、街を回して奥行きを探してみましょう。</p>
 <div class="tokyo-sightline-scenes" role="group" aria-label="写真を選ぶ">${TOKYO_SCENES.map((scene,i)=>'<button type="button" class="btn btn-ghost" data-tokyo-scene="'+i+'" aria-pressed="'+(i===0)+'">'+scene.label+'</button>').join('')}</div>
 <figure class="tokyo-sightline-photo"><img data-tokyo-photo src="${prefix}images/${s.photo}" alt="${s.alt}" loading="lazy" width="1920" height="1080"><figcaption><span data-tokyo-caption>${s.date}・${s.seat}／撮影：道草</span></figcaption></figure>
 <p data-tokyo-note>${s.note}</p>
 <p class="tokyo-sightline-meta" data-tokyo-distance>推定撮影位置から約${s.distanceKm}km</p>
 <p class="tokyo-sightline-note" id="tokyo-sightline-traffic">3Dは数十MB以上の通信が発生する場合があります。場面の切り替えや操作でも追加通信が発生します。</p>
 <button class="btn btn-primary" type="button" data-tokyo-open aria-expanded="false" aria-controls="tokyo-sightline-model" aria-describedby="tokyo-sightline-traffic">3Dで位置を見る</button>
 <div id="tokyo-sightline-model" hidden>
 <div class="tokyo-sightline-tools" role="group" aria-label="3Dの操作"><button class="btn btn-ghost" type="button" data-tokyo-reset disabled>初期位置へ</button><button class="btn btn-ghost" type="button" data-tokyo-zoom="in" aria-label="3Dを拡大" disabled>＋</button><button class="btn btn-ghost" type="button" data-tokyo-zoom="out" aria-label="3Dを縮小" disabled>−</button></div>
 <p class="tokyo-sightline-help" id="tokyo-sightline-help">PC：左ドラッグで移動、右ドラッグで角度変更。スマホ：2本指で拡大縮小、2本指をそろえて上下に動かすと角度変更。矢印キーでも操作できます。</p>
 <div class="tokyo-sightline-stage" data-tokyo-stage tabindex="0" role="group" aria-label="撮影位置と景色をつなぐ3D模型" aria-describedby="tokyo-sightline-help"></div>
 <p class="tokyo-sightline-key"><span>● 推定撮影位置</span><span>● 写真に写るものの位置</span><span>金色の線：両地点の方向</span></p></div>
 <p class="tokyo-sightline-status" data-tokyo-status role="status" aria-live="polite">ボタンを押すと3Dを読み込みます。</p>
 <details class="tokyo-sightline-sources"><summary>写真と模型について</summary><p>写真の推定時刻に近いGPSを参考にした位置図です。撮影位置・高さ・画角は精密校正していません。線は遮蔽物を通る場合があり、実際に見える範囲の判定ではありません。</p><p>建物は<a href="https://www.mlit.go.jp/plateau/" target="_blank" rel="noopener">国土交通省 PLATEAU</a>の港区・千代田区（LOD1）。屋根や細いすきま、橋・塔などの構造物の形は省略される場合があります。3D表示：CesiumJS。写真：道草。通信できないときも写真と記事を読めます。</p></details>
 </section><script defer src="${prefix}tokyo-sightline.js?v=${assetVersion('tokyo-sightline.js')}"></script>`;
}
