import { assetVersion } from './asset-version.mjs';

// Japanese article supplement only. Other editions keep their existing article.
export function fujimiSightlineHead(spot, lang, prefix) {
  return spot.id === 'edo-castle-fujimi-yagura' && lang === 'ja'
    ? `\n  <link rel="stylesheet" href="${prefix}fujimi-sightline.css?v=${assetVersion('fujimi-sightline.css')}">` : '';
}

export function fujimiSightlineHTML(spot, lang, prefix) {
  if (spot.id !== 'edo-castle-fujimi-yagura' || lang !== 'ja') return '';
  return `\n  <section class="spot-page-section fujimi-sightline" id="fujimi-sightline" aria-labelledby="fujimi-sightline-title" data-fujimi-sightline data-engine="${prefix}fujimi-sightline-stage.js?v=${assetVersion('fujimi-sightline-stage.js')}">
    <p class="eyebrow">FROM THE WINDOW</p>
    <h2 id="fujimi-sightline-title"><span class="copy-chunk">櫓は街の</span><span class="copy-chunk">どの奥にある？</span></h2>
    <p>東京駅へ向かう列車の左側。ビルのすきまに見える白い櫓は、列車から北西へ約1.1km、皇居の中にあります。写真の一瞬を止めて、街の奥行きを確かめてみましょう。</p>
    <figure class="fujimi-sightline-photo">
      <img src="${prefix}images/20260924_edo-castle-fujimi-yagura_3705_michikusa.jpg" alt="東京着直前の車窓。通りの奥、木々の上に白い富士見櫓が見える" width="1920" height="1080" loading="lazy" decoding="async">
      <figcaption>2026年9月24日、東京着直前。動画開始から3.705秒の同定済み場面。撮影：michikusa</figcaption>
    </figure>
    <div class="fujimi-sightline-facts"><span><b>列車 → 富士見櫓</b> 約1.1km</span><span><b>方角</b> 北西（約311°）</span></div>
    <div class="fujimi-sightline-actions">
      <button class="btn btn-primary" type="button" data-fujimi-open aria-expanded="false" aria-controls="fujimi-sightline-model">位置関係を3Dで見る</button>
      <button class="btn btn-ghost" type="button" data-fujimi-close hidden>写真に戻る</button>
    </div>
    <p class="fujimi-sightline-status" data-fujimi-status role="status" aria-live="polite">3Dはボタンを押すと読み込みます。通信が必要です。</p>
    <div id="fujimi-sightline-model" hidden>
      <div class="fujimi-sightline-views" role="group" aria-label="模型の見方">
        <button class="btn btn-ghost" type="button" data-fujimi-view="oblique" aria-pressed="true" disabled>斜め上から</button>
        <button class="btn btn-ghost" type="button" data-fujimi-view="top" aria-pressed="false" disabled>真上から</button>
      </div>
      <div class="fujimi-sightline-stage" data-fujimi-stage role="img" aria-label="止めた列車位置と富士見櫓をオレンジの線で結ぶ3D位置関係図"></div>
      <p class="fujimi-sightline-key"><span>● 列車位置</span><span>● 富士見櫓</span><span>オレンジの線：両地点の位置関係</span></p>
    </div>
    <details data-fujimi-film><summary>この一瞬を12秒の動画で見る</summary>
      <video controls playsinline preload="none" poster="${prefix}images/20260924_edo-castle-fujimi-yagura_3705_michikusa.jpg" data-src="${prefix}media/fujimi-sightline-film.mp4" aria-label="東京着直前、富士見櫓が見える12秒の車窓動画"></video>
      <p>撮影：michikusa。音声なし。最初の停止位置は3.705秒。再生すると櫓はビルの陰へ移ります。</p>
    </details>
    <p class="fujimi-sightline-note">列車位置は同じ乗車の1秒間隔GPSから補間した推定です。線は位置関係の説明で、建物・樹木・高架を含む精密な可視判定ではありません。カメラの高さ・画角・遮蔽物は未較正です。LOD1の建物模型は櫓の三重屋根を再現するものではありません。</p>
    <p class="fujimi-sightline-sources">建物：<a href="https://www.mlit.go.jp/plateau/" target="_blank" rel="noopener">国土交通省 PLATEAU（千代田区・LOD1）</a> ／ 地図：<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a> ／ 櫓：<a href="https://sankan.kunaicho.go.jp/multilingual/koukyo/place03.html" target="_blank" rel="noopener">宮内庁</a>。3D表示：CesiumJS。通信できない場合も写真と記事を読めます。</p>
  </section>
  <script defer src="${prefix}fujimi-sightline.js?v=${assetVersion('fujimi-sightline.js')}"></script>`;
}
