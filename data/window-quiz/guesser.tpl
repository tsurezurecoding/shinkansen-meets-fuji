<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>この車窓、どこ？ — 車窓を行ったり来たり</title>
<link rel="icon" href="favicon.ico"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="chrome.css"><link rel="stylesheet" href="vendor/leaflet/leaflet.css"><link rel="stylesheet" href="quiz/game.css"><link rel="stylesheet" href="quiz/guesser.css">
<script src="vendor/leaflet/leaflet.js" defer></script><script src="track.js" defer></script><script src="quiz/guesser-data.js" defer></script><script src="quiz/guesser.js" defer></script>
</head>
<body>
<a class="skip" href="#main">ゲームへ移動</a>
<!-- COMMON_HEADER -->
<main id="main" class="game-shell">
<p class="quiz-return"><a href="window-quiz.html">← 車窓クイズの入口へ</a></p>
<div class="intro"><div><p class="eyebrow">WINDOW GUESS <span>車窓を、行ったり来たり。</span></p><h1><span class="copy-chunk">この車窓、</span><span class="copy-chunk">どこ？</span></h1><p class="intro-copy"><span class="copy-chunk">建物のすき間を戻って見ると、</span><span class="copy-chunk">旅の場所が見えてくる。</span></p></div><button id="how-button" class="text-button" type="button">遊び方 ↗</button></div>
<div class="journey-bar"><p id="question-progress" class="video-brief" aria-live="polite">車窓 1 / 18 · 東海道新幹線</p><nav id="question-nav" class="question-nav" aria-label="車窓を選ぶ"></nav></div>
<div id="play-grid" class="play-grid observing">
<section class="window-card" aria-labelledby="scene-title">
<div class="window-heading"><h2 id="scene-title">見覚えのない景色から、始めよう。</h2><span class="media-type">FILM</span></div>
<div id="scene" class="scene"><video id="film" src="quiz/media/1-video.mp4" poster="quiz/media/1-poster.jpg" muted playsinline preload="auto" aria-label="出題中の車窓動画。下の操作で前後に動かせます。"></video><span id="bookmark-badge" class="bookmark-badge">▮ お題の瞬間</span><p id="loading" class="media-loading">車窓を準備しています…</p><div id="media-error" class="media-error" hidden><p>動画を読み込めませんでした。</p><button id="retry-media" class="retry-button">もう一度読み込む</button></div></div>
<div class="video-tools">
<div class="timeline-top"><label for="scrub">つまみを動かして、前後へ</label><strong id="time-label">お題の瞬間</strong></div>
<div class="scrub-track"><img class="filmstrip" src="quiz/media/1-filmstrip.jpg" alt="動画の前後に続く景色の一覧"><span class="bookmark-line" aria-hidden="true"></span><input id="scrub" type="range" min="0" max="43.6" value="22" step="0.1" aria-label="車窓動画の再生位置" disabled></div>
<div class="timeline-labels"><span>少し前</span><button id="bookmark-label" type="button" disabled>▮ お題</button><span>少し先</span></div>
<div class="transport" aria-label="動画の操作"><button id="play" type="button" disabled>▶ 再生</button><span class="speed-label">再生速度</span><select id="speed" aria-label="再生速度" disabled><option value="1">通常</option><option value="0.5">ゆっくり</option></select><button type="button" data-step="-5" disabled>−5秒</button><button type="button" data-step="-1" disabled>−1秒</button><button type="button" data-step="1" disabled>＋1秒</button><button type="button" data-step="5" disabled>＋5秒</button><button id="home-frame" type="button" disabled>▮ お題に戻る</button></div>
<p class="video-rule"><b>当てるのは「お題の瞬間」の場所。</b><br>前後に動かしても、お題は変わりません。時間制限はありません。</p>
</div>
<div class="observation-hint"><p>建物の向こうを、少し長く眺めてみよう。</p><button id="hint-button" type="button" class="hint-button" aria-expanded="false" aria-controls="hint">見るヒント</button></div><p id="hint" class="tip-copy" hidden>近くの屋根や電線より、遠くの輪郭に注目。前後に動かすと、建物に隠れていたものが見えてきます。</p>
<p class="credit">動画：michikusa（運営者撮影） · 2026年8〜9月 · 音声なし</p>
</section>
<aside id="observe-card" class="observe-card"><p class="eyebrow">FOLLOW THE SCENERY</p><p class="observe-number" aria-hidden="true">↔</p><h2><span class="copy-chunk">戻って見たら、</span><span class="copy-chunk">気づくかも。</span></h2><p>屋根の向こう。山のかたち。<br>手がかりは、ひとつとは限りません。</p><button id="choose-place" type="button" class="primary-button">場所を選ぶ →</button><p class="observe-note">地図を開いてからも、<br>映像は自由に見直せます。</p></aside>
<section id="answer-card" class="answer-card" hidden aria-labelledby="answer-heading">
<div class="answer-heading"><div><p class="eyebrow">YOUR GUESS</p><h2 id="answer-heading">お題は、どのあたり？</h2></div><span class="pin-symbol" aria-hidden="true">⌖</span></div><p id="map-instruction" class="map-instruction">路線の近くをタップして、ピンを置こう。</p>
<div class="map-wrap"><div id="map" aria-label="東海道新幹線の回答地図"></div><div id="route-map" hidden><svg id="route-svg" viewBox="0 0 680 310" role="img" aria-label="東海道新幹線の路線図。駅区間選択でも回答できます。"></svg></div><button id="fit-map" type="button" class="fit-map">全区間</button></div>
<div class="map-switch-row"><button id="map-toggle" type="button" class="text-button">路線図に切り替え</button><span class="route-key"><i></i> 東海道新幹線</span></div><p id="tile-status" class="tile-status" hidden>地図の背景を読み込めません。路線図でも回答できます。</p>
<div id="guess-controls" class="guess-controls"><label for="station-select">駅の間から選ぶ</label><select id="station-select"><option value="">区間を選択</option></select><div id="fine-control" hidden><label for="position-range">区間内の位置を調整 <span id="position-label"></span></label><input id="position-range" type="range" min="0" max="100" value="50" step="1"></div></div>
<p id="guess-label" class="guess-label" aria-live="polite">まだピンが置かれていません</p><button id="submit" type="button" class="primary-button" disabled>ここだと思う →</button><button id="follow-clip" type="button" class="primary-button" hidden>映像と地図を見比べる</button><p class="answer-note">当てるのは、お題を撮った時の列車の位置。</p>
</section>
</div>
<section id="round-result" class="round-result" hidden tabindex="-1" aria-labelledby="result-title"><div class="result-top"><div><p class="eyebrow">ANSWER · お題の瞬間</p><h2 id="result-title">街の向こうに、三河湾。</h2><p id="result-location">愛知県蒲郡市 · 三河安城〜豊橋の間</p></div><div class="result-numbers"><p><small>撮影地点から</small><strong id="distance"></strong></p><p><small>旅のスコア</small><strong id="round-score"></strong></p></div></div><div class="result-bottom"><p id="result-story">ここは蒲郡の街並みを見下ろすあたり。屋根や建物の間から、三河湾の水面や島の輪郭がのぞきます。一枚では隠れていた景色も、少し時間を戻すとつながって見えてきます。</p></div><div class="evidence-jumps"><button data-time="5" type="button">① 屋根の向こうを眺める</button><button data-time="22" type="button">② お題の瞬間を見直す</button><button data-time="37" type="button">③ 水面が開けるところへ</button></div><p class="evidence-note">答え合わせの後は、映像を動かすと地図の紫の点も動きます。緑の「お題」は同じ場所に残ります。</p><div class="result-actions"><p><span class="legend-guess">●</span> あなたの回答　<span class="legend-answer">●</span> お題　<span class="sync-key">●</span> 再生位置</p><div class="journey-actions"><button id="restart" type="button" class="text-button">この車窓をもう一度 ↻</button><button id="next-question" type="button" class="primary-button">次の車窓へ →</button></div></div></section>
<section id="journey-result" class="journey-result" hidden tabindex="-1"><p class="eyebrow">WINDOW JOURNEY</p><h2>18の車窓を、旅しました。</h2><p id="journey-total"></p><p>気になった景色は、上の番号から何度でも。</p><ol id="journey-scores"></ol></section>
<p class="prototype-note"><span>18問の試作</span> 撮影時刻と同じ乗車のGPSを対応づけています。距離は線路に沿った目安で、GPS誤差を含みます。</p>
<noscript>この試作にはJavaScriptが必要です。</noscript>
</main>
<!-- COMMON_CONTENT_RAIL -->
<footer class="footer"><p class="footer-brand">新幹線の窓 <span>旅の瞬間を見逃さない</span></p><p class="footer-links"><a href="guide.html">富士山の見方</a> · <a href="references.html">車窓リンク集</a> · <a href="contact.html">お問い合わせ</a> · <a href="privacy.html">プライバシーポリシー</a></p><p class="footer-credit">道草 / Michikusa — 急がない旅と、偶然の発見を。</p></footer>
<dialog id="how-dialog"><button class="dialog-close" id="close-how" aria-label="遊び方を閉じる">×</button><p class="eyebrow">HOW TO PLAY</p><h2>ひと続きの景色を、読む。</h2><ol><li>最初に止まっている映像が、お題の瞬間です。</li><li>つまみを動かし、前後の景色から手がかりを探します。「お題に戻る」で元の瞬間へ戻れます。</li><li>地図にピンを置いて、撮影された場所を当てます。映像を動かしても正解地点は固定です。</li></ol><p>全18問、時間制限なし。番号から好きな車窓を選べます。再生・巻き戻し・ヒントの減点はありません。撮影地点から線路に沿って1km以内なら5,000点、離れるほど点数が下がります。</p><p>スライダーは左右キーでも動かせます。動画は音声なしです。</p></dialog>
</body></html>
