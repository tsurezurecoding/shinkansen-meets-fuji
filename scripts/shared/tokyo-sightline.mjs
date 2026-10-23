import { assetVersion } from './asset-version.mjs';

// Photo-time GPS estimates; Tower alone is projected onto the existing railway.
// Heights and destination representative points are schematic.
export const TOKYO_SCENES = [
  {id:'tower',label:'東京タワー',photo:'20261010_tokyo-tower_155558_michikusa.jpg',alt:'車窓のビルの間に見える赤い東京タワー',date:'2026年10月10日',seat:'E席側',train:[139.7574288,35.6560242,64],target:[139.74543,35.65858,370],heading:283,distanceKm:1.1,district:'13103',range:2100,note:'手前のビルの向こうに、赤い塔。線の先が東京タワーの位置です。'},
  {id:'bridge',label:'レインボーブリッジ',photo:'20260924_rainbow-bridge_21057_michikusa.jpg',alt:'建物と倉庫の向こうに見えるレインボーブリッジの白い主塔',date:'2026年9月24日',seat:'A席側',train:[139.74263081,35.63631611,64],target:[139.7634,35.6366,140],heading:89,distanceKm:1.9,district:'13103',range:3000,note:'倉庫の屋根の向こうに白い主塔。線は橋の中央付近を示します。橋の主塔・ケーブルの形は模型に含まれません。'},
  {id:'station',label:'東京駅',photo:'20260924_tokyo-station_19505_michikusa.jpg',alt:'線路とホームの向こうに見える東京駅丸の内駅舎のドーム',date:'2026年9月24日',seat:'E席側',train:[139.76714909,35.67930879,64],target:[139.7653,35.6805,54],heading:308,distanceKm:0.2,district:'13101',range:1000,note:'ホームの向こう、丸の内駅舎のドーム。線の先は駅舎南側の代表点です。'},
  {id:'toranomon',label:'虎ノ門ヒルズ森タワー',photo:'20261010_toranomon-hills-mori-tower_126000_michikusa.jpg',alt:'新橋の街路の奥に、斜めの頂部を見せる虎ノ門ヒルズ森タワー',date:'2026年10月10日',seat:'E席側の景色',train:[139.75874142535,35.6629714458,64],target:[139.74915,35.66683,284],heading:296.1,distanceKm:1.0,district:'13103',range:1950,clip:'videos/20261010_toranomon-hills-mori-tower_124-128_michikusa.mp4',note:'新橋の街路の奥に、斜めの頂部を持つ森タワー。手前の建物のすきまを通して、塔の姿が現れます。'},
  {id:'takanawa',label:'高輪ツインタワー',markerLabel:'高輪ツインタワー（位置）',photo:'20261010_takanawa-linkpillar-1_275000_michikusa.jpg',alt:'高輪ゲートウェイ駅の屋根の向こうに並ぶTHE LINKPILLAR 1の2棟。右がNORTH、左がSOUTH',date:'2026年10月10日',seat:'E席側の景色',train:[139.74261111,35.63627215,64],target:[139.7401,35.6359,38],heading:260,distanceKm:0.23,district:'13103',range:1100,note:'駅の屋根の向こうに、THE LINKPILLAR 1の2棟。写真右がNORTH、左のJW MARRIOTTの表示がある棟がSOUTHです。現在の模型には新しい2棟が含まれないため、金色の点は敷地付近を示します。'},
  {id:'mon',label:'MoN Takanawa',markerLabel:'MoN Takanawa（位置）',photo:'20261010_mon-takanawa_257000_michikusa.jpg',alt:'停車中のサンライズエクスプレスの向こうに見える、木の帯と植栽が層状に重なるMoN Takanawa',date:'2026年10月10日',seat:'E席側の景色',train:[139.74317747,35.63900936,64],target:[139.74183,35.63969,38],heading:302,distanceKm:0.14,district:'13103',range:900,note:'木の帯と緑が重なる、低い建物がMoN Takanawa。手前にはサンライズエクスプレスも見えます。現在の模型にはMoNの形が含まれないため、金色の点で施設付近の位置を案内します。'},
  {id:'shiodome',label:'汐留シティセンター',photo:'20260911_shiodome-city-center_74500_michikusa.jpg',alt:'A席側の夜景の中央に見える、緑色の曲面ガラスを持つ汐留シティセンター',date:'2026年9月11日',seat:'A席側の景色',train:[139.75868299,35.66527731,64],target:[139.761,35.665371,240],heading:87,distanceKm:0.21,district:'13103',range:1300,note:'夜景の中央、緑色のガラスが丸くカーブする棟が汐留シティセンターです。頂部は写真の外ですが、曲面の輪郭が目印。模型で、線路のすぐ東側に立つ位置を確かめられます。'}
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
 <details class="tokyo-sightline-clip" data-tokyo-clip hidden><summary><span class="copy-chunk">この瞬間を動画で見る</span><span class="copy-chunk">（4秒・約3MB）</span></summary><video data-tokyo-video controls playsinline preload="none" aria-label="虎ノ門ヒルズ森タワーが見える、無音の4秒の車窓動画"></video><p class="tokyo-sightline-note">2026年10月10日・撮影：道草。無音／再生ボタンで開始します。</p></details>
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
 <details class="tokyo-sightline-sources"><summary>写真と模型について</summary><p>写真の推定時刻に近いGPSを参考にした位置図です。撮影位置・高さ・画角は精密校正していません。線は遮蔽物を通る場合があり、実際に見える範囲の判定ではありません。</p><p>建物は<a href="https://www.mlit.go.jp/plateau/" target="_blank" rel="noopener">国土交通省 PLATEAU</a>の港区・千代田区（LOD1）。写真と模型では時期が異なります。高輪の新しいツインタワーとMoNは位置のみを示します。屋根や細いすきま、橋・塔などの構造物の形は省略される場合があります。3D表示：CesiumJS。写真：道草。通信できないときも写真と記事を読めます。</p><p>建物の紹介：<a href="https://www.nihonsekkei.co.jp/projects/22481/" target="_blank" rel="noopener">THE LINKPILLAR 1</a>／<a href="https://montakanawa.jp/en/about/design/" target="_blank" rel="noopener">MoN Takanawa</a>／<a href="https://www.nihonsekkei.co.jp/projects/22285/" target="_blank" rel="noopener">汐留シティセンター</a></p></details>
 </section><script defer src="${prefix}tokyo-sightline.js?v=${assetVersion('tokyo-sightline.js')}"></script>`;
}
