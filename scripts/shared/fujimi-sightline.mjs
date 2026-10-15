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
    <p class="eyebrow spot-reading-eyebrow" lang="en">IN 3D</p>
    <h2 id="fujimi-sightline-title"><span class="copy-chunk">街の奥行きを</span><span class="copy-chunk">3Dで見る</span></h2>
    <p>推定撮影位置から富士見櫓まで、西北西へ約${FUJIMI_SCENE.distanceKm}km。街を動かして、ビルのすきまと櫓の位置関係を確かめてみましょう。</p>
    <div id="fujimi-sightline-model">
      <div class="fujimi-sightline-tools" role="group" aria-label="3Dの操作">
        <button class="btn btn-ghost" type="button" data-fujimi-reset disabled>初期位置へ</button>
        <button class="btn btn-ghost" type="button" data-fujimi-zoom="in" aria-label="3Dを拡大" disabled>＋</button>
        <button class="btn btn-ghost" type="button" data-fujimi-zoom="out" aria-label="3Dを縮小" disabled>−</button>
        <button class="btn btn-primary" type="button" data-fujimi-open hidden>3Dを読み込む</button>
      </div>
      <p class="fujimi-sightline-help" id="fujimi-sightline-help"><span class="copy-chunk">ドラッグで移動、右ドラッグで回転。</span><span class="copy-chunk">スマホは2本指で拡大・回転。</span><span class="copy-chunk">Ctrl＋ホイールでも拡大できます。</span></p>
      <div class="fujimi-sightline-stage" data-fujimi-stage data-placeholder="ここまで読み進めると3Dを表示します" tabindex="0" role="group" aria-label="自由に操作できる、撮影位置と富士見櫓の3D模型" aria-describedby="fujimi-sightline-help"></div>
      <p class="fujimi-sightline-key"><span>● 推定撮影位置</span><span>● 富士見櫓</span><span>オレンジの線：両地点の方向</span></p>
    </div>
    <p class="fujimi-sightline-status" data-fujimi-status role="status" aria-live="polite">この章に近づくと3Dを読み込みます。通信が必要です。</p>
    <p class="fujimi-sightline-note">撮影位置は推定です。GPSとの差約390mと高さの精密校正は未解決で、線の高さは模式的です。</p>
    <details class="fujimi-sightline-sources"><summary>模型のデータについて</summary>
    <p>撮影位置は写真の通りの抜けと地図上の線路から推定しています。建物模型（LOD1）は屋根や細かなすきまを省略しています。</p>
    <p class="fujimi-sightline-sources">建物：<a href="https://www.mlit.go.jp/plateau/" target="_blank" rel="noopener">国土交通省 PLATEAU（千代田区・LOD1）</a> ／ 地図：<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a> ／ 櫓：<a href="https://sankan.kunaicho.go.jp/multilingual/koukyo/place03.html" target="_blank" rel="noopener">宮内庁</a>。3D表示：CesiumJS。通信できない場合も写真と記事を読めます。</p>
    </details>
  </section>
  <script defer src="${prefix}fujimi-sightline.js?v=${assetVersion('fujimi-sightline.js')}"></script>`;
}
