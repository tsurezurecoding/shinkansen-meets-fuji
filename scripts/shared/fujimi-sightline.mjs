import { assetVersion } from './asset-version.mjs';

// Photo/map estimate: the opening between Marunouchi's blocks, projected back
// to the Shinkansen side of Tokyo Station. This is not a corrected GPX sample.
// Keep the recorded point for audit; never silently retime or rewrite the GPX.
export const FUJIMI_SCENE = Object.freeze({
  train: [139.768, 35.6806, 64],
  tower: [139.7566, 35.68419, 54],
  gpsObservation: [139.76588175, 35.67758694],
  heading: 291.19,
  distanceKm: 1.1,
});

// Japanese article supplement only. Other editions keep their existing article.
export function fujimiSightlineHead(spot, lang, prefix) {
  return spot.id === 'edo-castle-fujimi-yagura' && lang === 'ja'
    ? `\n  <link rel="stylesheet" href="${prefix}fujimi-sightline.css?v=${assetVersion('fujimi-sightline.css')}">` : '';
}

export function fujimiSightlineHTML(spot, lang, prefix) {
  if (spot.id !== 'edo-castle-fujimi-yagura' || lang !== 'ja') return '';
  return `\n  <section class="spot-page-section fujimi-sightline" id="fujimi-sightline" aria-labelledby="fujimi-sightline-title" data-fujimi-sightline data-scene="${JSON.stringify(FUJIMI_SCENE).replaceAll('"', '&quot;')}" data-engine="${prefix}fujimi-sightline-stage.js?v=${assetVersion('fujimi-sightline-stage.js')}">
    <p class="eyebrow">FROM THE WINDOW</p>
    <h2 id="fujimi-sightline-title"><span class="copy-chunk">櫓は街の</span><span class="copy-chunk">どの奥にある？</span></h2>
    <p>東京駅へ向かう列車の左側。ビルのすきまに見える白い櫓は、皇居の中にあります。写真から推定した撮影位置を使い、街の奥行きを確かめてみましょう。</p>
    <figure class="fujimi-sightline-photo">
      <img src="${prefix}images/20260924_edo-castle-fujimi-yagura_3705_michikusa.jpg" alt="東京着直前の車窓。通りの奥、木々の上に白い富士見櫓が見える" width="1920" height="1080" loading="lazy" decoding="async">
      <figcaption>2026年9月24日、東京着直前。動画開始から約3.7秒の場面。撮影：michikusa</figcaption>
    </figure>
    <div class="fujimi-sightline-facts"><span><b>推定撮影位置 → 富士見櫓</b> 約${FUJIMI_SCENE.distanceKm}km</span><span><b>方角</b> 西北西（約${Math.round(FUJIMI_SCENE.heading)}°）</span></div>
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
      <div class="fujimi-sightline-stage" data-fujimi-stage role="img" aria-label="写真から推定した撮影位置と富士見櫓を結ぶ3D位置関係図"></div>
      <p class="fujimi-sightline-key"><span>● 推定撮影位置</span><span>● 富士見櫓</span><span>オレンジの線：両地点の方向</span></p>
    </div>
    <p><a href="#spotVideoTitle-edo-castle-fujimi-yagura">YouTube動画でこの一瞬を見る →</a></p>
    <p class="fujimi-sightline-note">撮影位置は、写真の通りの抜けと地図上の線路からの推定です。同時刻のGPS補間点とは約390mの差があり、位置・時刻の誤差は確定していません。線の高さは模式的な設定で、窓から屋根への精密な視線ではありません。建物模型（LOD1）は屋根や細かなすきまを省略しています。</p>
    <p class="fujimi-sightline-sources">建物：<a href="https://www.mlit.go.jp/plateau/" target="_blank" rel="noopener">国土交通省 PLATEAU（千代田区・LOD1）</a> ／ 地図：<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a> ／ 櫓：<a href="https://sankan.kunaicho.go.jp/multilingual/koukyo/place03.html" target="_blank" rel="noopener">宮内庁</a>。3D表示：CesiumJS。通信できない場合も写真と記事を読めます。</p>
  </section>
  <script defer src="${prefix}fujimi-sightline.js?v=${assetVersion('fujimi-sightline.js')}"></script>`;
}
