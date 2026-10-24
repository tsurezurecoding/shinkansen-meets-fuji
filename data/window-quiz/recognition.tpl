<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <title>車窓クイズ｜新幹線の窓</title>
  <link rel="icon" href="favicon.ico">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="quiz/recognition.css">
  <script src="quiz/recognition-data.js" defer></script>
  <script src="quiz/recognition.js" defer></script>
</head>
<body class="quiz-page">
<a class="quiz-skip" href="#quiz-main">クイズへ進む</a>
<!-- COMMON_HEADER -->
<main id="quiz-main" class="quiz-main">
  <section id="welcome" class="quiz-cover" aria-labelledby="welcome-title">
    <div class="cover-heading">
      <p class="eyebrow">新幹線の窓から、小さな発見</p>
      <h1 id="welcome-title" tabindex="-1">車窓クイズ</h1>
      <p class="cover-lead"><span class="copy-chunk">あれ、何だろう。</span><span class="copy-chunk">ここ、どこだろう。</span></p>
      <p class="cover-note"><span class="copy-chunk">見慣れた車窓に、</span><span class="copy-chunk">まだ知らない日本がある。</span></p>
    </div>
    <div class="question-tiles" aria-label="車窓に見つかる、いろいろな問い">
      <button class="question-tile tile-castle" type="button" data-start-question="kakegawa" disabled><img src="images/20261013_kakegawa_castle_morning_michikusa.jpg" alt="街の向こう、小高い丘に見えるお城"><span class="tile-caption"><small>01 — お城</small><span>あれ、何城？</span></span></button>
      <button class="question-tile tile-bridge" type="button" data-start-question="maruko-bridge" disabled><img src="images/20260704_maruko_bridge_1_michikusa.jpg" alt="川を渡るアーチ形の橋"><span class="tile-caption"><small>02 — 橋</small><span>この橋、どこ？</span></span></button>
      <button class="question-tile tile-shape" type="button" data-start-question="rakusai-egg-tanks" disabled><img src="images/20260924_rakusai-egg-tanks_8885_michikusa.jpg" alt="夕空の下に並ぶ、たまご形の構造物"><span class="tile-caption"><small>03 — ふしぎな形</small><span>あの形、何だろう？</span></span></button>
      <a class="question-tile tile-place" href="window-guesser.html?question=4"><img src="quiz/media/original-4-poster.jpg" alt="新幹線から眺める街の風景"><span class="tile-caption"><small>04 — 街並み</small><span>ここ、どこ？</span></span></a>
    </div>
    <div class="cover-starts" aria-label="クイズを選んで始める">
      <button id="start" class="cover-start" type="button" disabled><span class="start-kicker">写真で3択 · 10問</span><span class="start-title">何の車窓？ <span aria-hidden="true">→</span></span><span class="start-detail">名前当てを始める</span></button>
      <a id="start-guesser" class="cover-start" href="window-guesser.html"><span class="start-kicker">動画で場所当て · 18問</span><span class="start-title">どこの車窓？ <span aria-hidden="true">→</span></span><span class="start-detail">車窓Guesserを始める</span></a>
    </div>
    <p class="cover-caption"><span>時間制限なし。気ままにどうぞ。</span><span>写真：michikusa</span></p>
  </section>
  <section id="play" hidden aria-labelledby="question-title">
    <button type="button" class="quiz-text back-to-hub">← クイズを選び直す</button>
    <div class="round-top"><span class="eyebrow">この車窓、なに？</span><span id="counter" aria-live="polite"></span></div>
    <div id="progress" class="progress" role="progressbar" aria-label="回答済みの問題" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0"><span></span></div>
    <div class="question-grid">
      <figure class="question-picture">
        <button id="zoom" type="button" aria-label="写真を大きく見る"><img id="photo" alt=""><span class="zoom-label">写真を大きく ↗</span></button>
        <figcaption id="credit"></figcaption>
        <p id="image-error" role="alert" hidden>写真を読み込めませんでした。「答えを見る」で先へ進めます。</p>
      </figure>
      <div class="question-content">
        <p id="question-kind" class="small-label"></p>
        <h2 id="question-title" tabindex="-1"></h2>
        <div id="choices" class="choices" role="group" aria-labelledby="question-title"></div>
        <button id="skip" type="button" class="quiz-text">わからないので、答えを見る</button>
        <section id="feedback" class="feedback" hidden aria-labelledby="answer-title">
          <p id="verdict" role="status"></p>
          <h3 id="answer-title" tabindex="-1"></h3>
          <p id="explanation"></p>
          <p id="location" class="location"></p>
          <div class="answer-actions"><a id="article" target="_blank" rel="noopener">この景色をもっと知る ↗</a></div>
          <button id="next" class="quiz-primary" type="button">次の写真へ →</button>
        </section>
      </div>
    </div>
    <p class="seat-note">区間と席側は撮影した景色の案内です。A・Eは普通車の窓側席。見え方は天気や列車によって変わります。</p>
  </section>
  <section id="result" hidden aria-labelledby="result-title">
    <div class="result-heading">
      <p class="eyebrow">10枚の車窓、おつかれさまでした</p>
      <h1 id="result-title" tabindex="-1"><span class="copy-chunk">次の車窓が、</span><span class="copy-chunk">少し楽しみに。</span></h1>
      <p id="score" class="score"></p>
      <p id="result-note"></p>
      <button id="restart" class="quiz-primary" type="button">別の10問でもう一度 <span aria-hidden="true">↻</span></button>
    </div>
    <p class="hub-return"><button type="button" class="quiz-text back-to-hub">← クイズを選び直す</button></p>
    <h2 class="review-title">出会った景色を、もう一度。</h2>
    <div id="review" class="review-grid"></div>
    <p class="result-bottom"><a href="zukan.html">車窓図鑑でもっと探す →</a></p>
  </section>
  <noscript><p class="noscript">クイズを遊ぶにはJavaScriptを有効にしてください。<a href="zukan.html">車窓図鑑を見る</a></p></noscript>
</main>
<!-- COMMON_CONTENT_RAIL -->
<footer class="footer">
  <p class="footer-brand">新幹線の窓 <span>旅の瞬間を見逃さない</span></p>
  <p class="footer-links"><a href="index.html">TOP</a> · <a href="guide.html">富士山の見方</a> · <a href="zukan.html">車窓図鑑</a> · <a href="contact.html">お問い合わせ</a> · <a href="privacy.html">プライバシーポリシー</a></p>
  <p class="footer-credit">道草 / Michikusa — 急がない旅と、偶然の発見を。</p>
</footer>
<dialog id="photo-dialog" aria-label="車窓写真を大きく見る"><button id="close-photo" type="button" aria-label="拡大写真を閉じる">閉じる ×</button><img id="large-photo" alt=""><p id="large-credit"></p></dialog>
</body>
</html>
