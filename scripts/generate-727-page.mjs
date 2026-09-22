import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetVersion } from './shared/asset-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = 'https://www.michikusa-travel.com';

// 727コレクションの日英ページを1つの雛形から出す。2026-09-22までは手書きの2ファイルで、
// 同じCSSとマークアップが両方に重複していた（FEATURE-GEN-0922）。
//
// **COPY は日英で別々に持つ。片方を訳してもう片方にしない。**
// 文章を直すときは、直す言語の側だけを直す。対で並べ直すと、次の修正で片方が訳へ戻る。
const COPY = {
 "ja": {
  "line": "<title>727看板の設置場所一覧｜東海道新幹線から見える24地点 | 新幹線の窓</title>",
  "line2": "<meta name=\"description\" content=\"東海道新幹線から見える727看板の設置場所を、24地点の一覧と地図で。葛原（藤沢市）から新大阪まで8区間に分けて、地名・区間・座席側つき。見つけた地点は車窓スタンプとして記録できます。\">",
  "line3": "<link rel=\"icon\" href=\"favicon.ico\" sizes=\"any\">\n  <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"favicon-32x32.png\">\n  <link rel=\"apple-touch-icon\" href=\"apple-touch-icon.png\">\n  <meta property=\"og:title\" content=\"727看板の設置場所一覧｜東海道新幹線から見える24地点\">\n  <meta property=\"og:description\" content=\"東海道新幹線から見える727看板の設置場所を、24地点の一覧と地図で。地名・区間・座席側つき。\">",
  "line4": "<meta property=\"og:image:alt\" content=\"車窓に写る727看板の写真タイルと「沿線の727看板を探す」の見出し\">",
  "line5": "<meta name=\"twitter:title\" content=\"727看板の設置場所一覧｜東海道新幹線から見える24地点\">",
  "line6": "<meta name=\"twitter:description\" content=\"東海道新幹線から見える727看板の設置場所を、24地点の一覧と地図で。地名・区間・座席側つき。\">",
  "collection_727_page": "<body class=\"collection-727-page spot-page spot-page-utility\" data-page=\"727-collection\" data-spot-page-shared-context=\"utility\" data-spot-page-shared-lang=\"ja\" data-spot-page-shared-root=\"./\" data-spot-page-shared-route=\"727-collection.html\">",
  "collectionHeroTitle": "<h1 id=\"collectionHeroTitle\">沿線の727看板を探す</h1>",
  "collection_hero_lead": "<p class=\"collection-hero-lead\"><span class=\"copy-chunk\">新幹線の車窓でよく見かける「727」は、</span><span class=\"copy-chunk\">大阪の化粧品メーカー・</span><span class=\"copy-chunk\">セブンツーセブン</span><span class=\"copy-chunk\">（727 COSMETICS）の看板です。</span></p>",
  "collection_hero_note": "<p class=\"collection-hero-note\"><span class=\"copy-chunk\">全24地点、A席・E席の両側にあるので、</span><span class=\"copy-chunk\">一回ですべて見つけるのは至難の業。</span><span class=\"copy-chunk\">出張で往復する人は、移動時間の楽しみとして</span><span class=\"copy-chunk\">ぜひコンプリートに挑戦してみてください。</span></p>",
  "btn": "<a class=\"btn btn-primary\" href=\"#collectionListTitle\">設置場所リストを見る</a>",
  "btn2": "<a class=\"btn btn-ghost\" href=\"start.html\">列車のタイムラインで見る</a>",
  "btn3": "<a class=\"btn btn-ghost\" href=\"#about727Title\">727看板とは？</a>",
  "about727Title": "<h2 id=\"about727Title\">727看板とは？ 何の広告？</h2>",
  "line7": "<p>727は、大阪の化粧品メーカー「セブンツーセブン」の看板です。公式沿革では1945年7月27日に創業。いちばんの特徴は「サロン専売」であることです。店頭やドラッグストアでは買えず、登録された美容室でのカウンセリングを通して販売されます。商品そのものを街で見かける機会は少ないのに、看板は新幹線沿線で何度も目に入る——この不思議さが、727が語り草になる理由です。</p>",
  "line8": "<p>看板のデザインも意図的です。大きく「727」、その下に小さく「COSMETICS」。高速で流れる車窓でも一瞬で「あの看板だ」と分かるようにするための見せ方です。線路や道路沿いの土地に単独で立てられるこうした広告板は、広告業界では野立て看板と呼ばれます。東海道新幹線の沿線だけでも数多く点在し、乗るたびに同じ看板に出会います。富士山のような主役ではないけれど、日本の新幹線ユーザーには“おなじみの光景”。初めて乗る人にとっては、「727って何？」と気になる最初の謎かもしれません。</p>",
  "line9": "<p>葛原（藤沢市）付近では、白い727看板の隣に黄色い「248」看板が並びます。こちらは西八王子の「きぬた歯科」の広告で、詳しくは<a href=\"spots/727-board.html\">きぬた歯科の248看板のページ</a>で解説しています。</p>",
  "collectionProgressTitle": "<h2 id=\"collectionProgressTitle\">727看板コレクション</h2>",
  "section_sub": "<p class=\"section-sub\">見つけた地点を記録すると、段階メダルが育ちます。</p>",
  "collectionMedals": "<div id=\"collectionMedals\" class=\"collection-stage-grid\" aria-label=\"727看板の段階メダル\"></div>",
  "collectionListTitle": "<h2 id=\"collectionListTitle\">727看板の設置場所リスト（24地点）</h2>",
  "section_sub2": "<p class=\"section-sub\"><span class=\"copy-chunk\">東京からの時間順に、駅と駅のあいだでまとめました。</span><span class=\"copy-chunk\">地名・座席側・通過の目安を見ながら、</span><span class=\"copy-chunk\">気になる地点を開くと写真や地図を確認できます。</span></p>",
  "line10": "<span>東京〜新大阪 · 収集対象 全24地点</span>",
  "collectionMap": "<div id=\"collectionMap\" class=\"collection-map\" data-collection-map role=\"application\" aria-label=\"727看板の地点地図\"></div>",
  "collectionMapStatus": "<p id=\"collectionMapStatus\" class=\"collection-map-status\" role=\"status\" aria-live=\"polite\">地図を読み込んでいます。</p>",
  "line11": "<strong>地図を読み込めない場合</strong>",
  "line12": "<p>地点名から地図サービスを開けます。</p>",
  "line13": "<strong>東京 → 新大阪</strong>",
  "line14": "<span>下り・のぞみ基準 約147分の目安</span>",
  "collection_filter_group": "<div class=\"collection-filter-group\" role=\"group\" aria-label=\"地点リストの絞り込み\">",
  "collection_filter_label": "<span class=\"collection-filter-label\">絞り込み</span>",
  "collection_filter_button": "<button type=\"button\" class=\"collection-filter-button is-active\" data-collection-filter=\"all\" aria-pressed=\"true\">すべて</button>",
  "collection_filter_button2": "<button type=\"button\" class=\"collection-filter-button\" data-collection-filter=\"seat-a\" aria-pressed=\"false\">A席側</button>",
  "collection_filter_button3": "<button type=\"button\" class=\"collection-filter-button\" data-collection-filter=\"seat-e\" aria-pressed=\"false\">E席側</button>",
  "collection_filter_button4": "<button type=\"button\" class=\"collection-filter-button\" data-collection-filter=\"found\" aria-pressed=\"false\">記録済み</button>",
  "collection_filter_button5": "<button type=\"button\" class=\"collection-filter-button\" data-collection-filter=\"unfound\" aria-pressed=\"false\">未記録</button>",
  "collectionNotesTitle": "<h2 id=\"collectionNotesTitle\">調査地点について</h2>",
  "line15": "<p>727看板のように線路沿いの土地へ単独で立てられた広告板は、野立て看板と呼ばれます。地点の基準は、をっつん氏による2023年の個人調査・地図を参照して、東海道新幹線の車窓で使える形に整理したものです。看板は移設・撤去されたり、建物や天候で見えにくくなるため、現在の確認を続けています。</p>",
  "line16": "<p>24地点すべてに、道草が車窓から撮った写真があります。見え方が変わっていたらお知らせください。</p>",
  "line17": "<p>このほかに3地点は、基準にした2023年の調査から状況が変わっていました。栗東市出庭は2026年8月16日の車窓では確認できず（周辺が道路工事中）、一宮市萩原町築込は跡地に建物が建っており、豊川市御津町下佐脇は別の広告に入れ替わっていました。いずれもリストには記録として残していますが、収集の対象からは外しています。</p>",
  "line18": "<p>実際に乗車するときに確認するようにしていますが、新しい727看板や、撤去・移設された地点についての情報、車窓から撮影した写真のご提供も歓迎しています。<a href=\"contact.html\">お問い合わせ</a>からお知らせください。</p>",
  "line19": "<p><a href=\"https://note.com/wotuntun/n/n3d2eceae1689\" target=\"_blank\" rel=\"noopener noreferrer\">をっつん「新幹線から見える『727看板』の設置場所はどこか」</a></p>",
  "footer_brand": "<p class=\"footer-brand\">新幹線の窓 <span>旅の瞬間を見逃さない</span></p>",
  "line20": "<p>時刻はのぞみ基準の目安で、列車・天候・座席位置により見え方は変わります。少し早めに窓の外を見てください。</p>",
  "footer_links": "<p class=\"footer-links\"><a href=\"guide.html\">富士山の見方</a> · <a href=\"references.html\">車窓リンク集</a> · <a href=\"contact.html\">お問い合わせ</a> · <a href=\"privacy.html\">プライバシーポリシー</a></p>",
  "footer_credit": "<p class=\"footer-credit\">道草 / Michikusa — 急がない旅と、偶然の発見を。</p>"
 },
 "en": {
  "line": "<title>What Are the 727 Signs Along the Shinkansen? | All 24 Locations | Shinkansen Window</title>",
  "line2": "<meta name=\"description\" content=\"The white 727 signs you keep passing on the Tokaido Shinkansen are billboards for an Osaka cosmetics company. Here are all 24 locations between Tokyo and Shin-Osaka, with the seat side, the section of the route and roughly when each one passes.\">",
  "line3": "<link rel=\"icon\" href=\"../favicon.ico\" sizes=\"any\">\n  <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"../favicon-32x32.png\">\n  <link rel=\"apple-touch-icon\" href=\"../apple-touch-icon.png\">\n  <meta property=\"og:site_name\" content=\"Shinkansen Window\">\n  <meta property=\"og:locale\" content=\"en_US\">\n  <meta property=\"og:title\" content=\"What Are the 727 Signs Along the Shinkansen? All 24 Locations\">\n  <meta property=\"og:description\" content=\"All 24 locations of the mysterious 727 billboards on the Tokaido Shinkansen, with seat sides and passing times.\">",
  "line4": "<meta property=\"og:image:alt\" content=\"Window photographs of the 727 signs behind the heading of this collection\">",
  "line5": "<meta name=\"twitter:title\" content=\"What Are the 727 Signs Along the Shinkansen? All 24 Locations\">",
  "line6": "<meta name=\"twitter:description\" content=\"All 24 locations of the mysterious 727 billboards on the Tokaido Shinkansen, with seat sides and passing times.\">",
  "collection_727_page": "<body class=\"collection-727-page spot-page spot-page-utility\" data-page=\"727-collection\" data-spot-page-shared-context=\"utility\" data-spot-page-shared-lang=\"en\" data-spot-page-shared-root=\"../\" data-spot-page-shared-route=\"727-collection.html\">",
  "collectionHeroTitle": "<h1 id=\"collectionHeroTitle\">The 727 signs along the line</h1>",
  "collection_hero_lead": "<p class=\"collection-hero-lead\">If you have ridden the Tokaido Shinkansen, you have seen them: plain white boards reading 727, standing alone in fields beside the track. They are billboards for 727 Cosmetics, a company in Osaka.</p>",
  "collection_hero_note": "<p class=\"collection-hero-note\">There are 24 of them between Tokyo and Shin-Osaka, on both sides of the train, so nobody catches them all in one ride. Take the window seat you have and see how many you can find.</p>",
  "btn": "<a class=\"btn btn-primary\" href=\"#collectionListTitle\">See every location</a>",
  "btn2": "<a class=\"btn btn-ghost\" href=\"start.html\">See them on your train</a>",
  "btn3": "<a class=\"btn btn-ghost\" href=\"#about727Title\">What is 727?</a>",
  "about727Title": "<h2 id=\"about727Title\">What are the 727 signs advertising?</h2>",
  "line7": "<p>727 is a cosmetics company based in Osaka, founded, by its own account, on 27 July 1945 — which is where the number comes from. What makes the signs strange is the business behind them: 727 sells only through hair salons. You cannot buy the products in a shop or a drugstore; they reach customers through a consultation at a registered salon. So the brand is advertised relentlessly to millions of train passengers who will almost certainly never encounter the product. That gap is why the signs are talked about at all.</p>",
  "line8": "<p>The design is deliberate too: a huge 727, with COSMETICS small underneath. At 280 km/h you have about two seconds, which is enough to register three digits and nothing else. Freestanding boards like these, put up on rented land beside a railway or a road, are called nodate kanban in Japanese — roughly, open-air signs. Regular travellers stop noticing them the way you stop noticing a familiar bridge. First-time passengers usually notice nothing else, and spend the rest of the journey wondering what 727 means.</p>",
  "line9": "<p>Near Kuzuhara in Fujisawa, a yellow board reading 248 stands right next to a white 727. That one advertises a dental clinic in Tokyo, and it is a small legend of its own; there is more about it on the <a href=\"spots/727-board.html\">248 sign page</a>.</p>",
  "collectionProgressTitle": "<h2 id=\"collectionProgressTitle\">Your 727 collection</h2>",
  "section_sub": "<p class=\"section-sub\">Mark the ones you spot and the medals fill in as you go.</p>",
  "collectionMedals": "<div id=\"collectionMedals\" class=\"collection-stage-grid\" aria-label=\"727 sign medals\"></div>",
  "collectionListTitle": "<h2 id=\"collectionListTitle\">Every 727 location (24 in total)</h2>",
  "section_sub2": "<p class=\"section-sub\">Ordered by how long after Tokyo they pass, and grouped by the section of the route. Open any location for a window photograph and a map.</p>",
  "line10": "<span>Tokyo to Shin-Osaka · 24 collectable locations</span>",
  "collectionMap": "<div id=\"collectionMap\" class=\"collection-map\" data-collection-map role=\"application\" aria-label=\"Map of the 727 sign locations\"></div>",
  "collectionMapStatus": "<p id=\"collectionMapStatus\" class=\"collection-map-status\" role=\"status\" aria-live=\"polite\">Loading the map.</p>",
  "line11": "<strong>If the map does not load</strong>",
  "line12": "<p>You can open each location in a map service by name.</p>",
  "line13": "<strong>Tokyo → Shin-Osaka</strong>",
  "line14": "<span>Westbound, about 147 minutes on a Nozomi</span>",
  "collection_filter_group": "<div class=\"collection-filter-group\" role=\"group\" aria-label=\"Filter the list\">",
  "collection_filter_label": "<span class=\"collection-filter-label\">Filter</span>",
  "collection_filter_button": "<button type=\"button\" class=\"collection-filter-button is-active\" data-collection-filter=\"all\" aria-pressed=\"true\">All</button>",
  "collection_filter_button2": "<button type=\"button\" class=\"collection-filter-button\" data-collection-filter=\"seat-a\" aria-pressed=\"false\">Seat A</button>",
  "collection_filter_button3": "<button type=\"button\" class=\"collection-filter-button\" data-collection-filter=\"seat-e\" aria-pressed=\"false\">Seat E</button>",
  "collection_filter_button4": "<button type=\"button\" class=\"collection-filter-button\" data-collection-filter=\"found\" aria-pressed=\"false\">Recorded</button>",
  "collection_filter_button5": "<button type=\"button\" class=\"collection-filter-button\" data-collection-filter=\"unfound\" aria-pressed=\"false\">Not recorded</button>",
  "collectionNotesTitle": "<h2 id=\"collectionNotesTitle\">About this list</h2>",
  "line15": "<p>The locations here start from a personal survey published in 2023 by a Japanese writer, Wotuntun, who mapped the signs; we reorganised that work around what you can actually see from a train window. Signs get moved or taken down, and buildings and weather hide them, so we keep checking.</p>",
  "line16": "<p>All 24 locations carry a photograph we took from the window ourselves. If one of them looks different now, please tell us.</p>",
  "line17": "<p>Three further locations from the 2023 survey have changed. At Deba in Ritto we could not find the sign on 16 August 2026, with roadworks under way around it; at Hagiwara in Ichinomiya a building now stands on the site; and at Mito in Toyokawa the board carries a different advertisement. All three stay on the list as records, but they do not count towards the collection.</p>",
  "line18": "<p>We check the signs when we ride. If you know of a 727 sign that is missing here, one that has gone, or you have a window photograph of your own, we would be glad to hear from you through the <a href=\"contact.html\">contact page</a>.</p>",
  "line19": "<p><a href=\"https://note.com/wotuntun/n/n3d2eceae1689\" target=\"_blank\" rel=\"noopener noreferrer\">Wotuntun, “Where are the 727 signs you can see from the Shinkansen?” (Japanese)</a></p>",
  "footer_brand": "<p class=\"footer-brand\">Shinkansen Window <span>Catch the moment from your seat</span></p>",
  "line20": "<p>Times are estimates based on a Nozomi service. Your train, the weather and where you sit all change what you see, so start watching a little early.</p>",
  "footer_links": "<p class=\"footer-links\"><a href=\"guide.html\">Seeing Mount Fuji</a> · <a href=\"references.html\">Window links</a> · <a href=\"contact.html\">Contact</a> · <a href=\"privacy.html\">Privacy</a></p>",
  "footer_credit": "<p class=\"footer-credit\">Michikusa — unhurried travel, and the things you find by chance.</p>"
 }
};

function render(lang) {
  const en = lang === 'en';
  const p = en ? '../' : '';
  const t = COPY[lang];
  const pageUrl = en ? `${site}/en/727-collection.html` : `${site}/727-collection.html`;
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="${p}app-embedded.js?v=${assetVersion('app-embedded.js')}"></script>
  <link rel="stylesheet" href="${p}app-embedded.css?v=${assetVersion('app-embedded.css')}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  ${t.line}
  ${t.line2}
  <meta name="theme-color" content="#101c2c">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ja" href="https://www.michikusa-travel.com/727-collection.html">
  <link rel="alternate" hreflang="en" href="https://www.michikusa-travel.com/en/727-collection.html">
  <link rel="alternate" hreflang="x-default" href="https://www.michikusa-travel.com/en/727-collection.html">
  ${t.line3}
  <meta property="og:image" content="https://www.michikusa-travel.com/images/og-727-collection.jpg">
  ${t.line4}
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  ${t.line5}
  ${t.line6}
  <meta name="twitter:image" content="https://www.michikusa-travel.com/images/og-727-collection.jpg">
  <link rel="stylesheet" href="${p}style.css?v=${assetVersion('style.css')}">
  <link rel="stylesheet" href="${p}727-collection.css?v=${assetVersion('727-collection.css')}">
  <script>
    (function () {
      if (window.MADO_EMBEDDED_WEB) return;
      var measurementId = "G-C2ESB694FV";
      var optoutKey = "mado-ga-optout";
      var params = new URLSearchParams(window.location.search);
      var host = window.location.hostname;
      var isNativeApp = !!(window.Capacitor && ((typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) || (typeof window.Capacitor.getPlatform === "function" && window.Capacitor.getPlatform() !== "web")));
      var isLocalPreview = !isNativeApp && (window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1");
      var storageOptedOut = false;
      try {
        if (params.get("ga") === "off" || params.get("ga_optout") === "1") localStorage.setItem(optoutKey, "1");
        if (params.get("ga") === "on" || params.get("ga_optout") === "0") localStorage.removeItem(optoutKey);
        storageOptedOut = localStorage.getItem(optoutKey) === "1";
      } catch (error) {
        storageOptedOut = false;
      }
      window.MADO_ANALYTICS_DISABLED = isLocalPreview || storageOptedOut;
      window["ga-disable-" + measurementId] = window.MADO_ANALYTICS_DISABLED;
      if (window.MADO_ANALYTICS_DISABLED) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      var script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", measurementId);
    })();
  </script>
</head>
${t.collection_727_page}
  <div data-spot-page-shared-module="topbar"></div>

  <main>
    <section class="collection-hero" id="top" aria-labelledby="collectionHeroTitle">
      <div class="collection-hero-tiles" aria-hidden="true">
        <img src="${p}images/20260704_727_board_kuzuhara_1_michikusa.jpg" alt="">
        <img src="${p}images/20260629_727_board_2_2x_michikusa.jpg" alt="">
        <img src="${p}images/20260629_727_board_1_4x_michikusa.jpg" alt="">
        <img src="${p}images/20260704_putiputi_sign_1_michikusa.jpg" alt="">
        <img src="${p}images/20260704_727_board_haracho_michikusa.jpg" alt="">
        <img src="${p}images/20260704_727_board_osawa_michikusa.jpg" alt="">
        <img src="${p}images/20260704_727_board_miyashiro_a_michikusa.jpg" alt="">
        <img src="${p}images/20260704_727_board_fuse_michikusa.jpg" alt="">
        <img src="${p}images/20260803_727_board_karasakiminami_michikusa.jpg" alt="">
        <img src="${p}images/20260803_727_board_torikaihachicho_michikusa.jpg" alt="">
      </div>
      <div class="collection-hero-inner">
        <p class="eyebrow">727 COLLECTION</p>
        ${t.collectionHeroTitle}
        ${t.collection_hero_lead}
        ${t.collection_hero_note}
        <div class="collection-hero-actions">
          ${t.btn}
          ${t.btn2}
          ${t.btn3}
        </div>
      </div>
    </section>

    <div class="spot-page-shell collection-shell">
      <aside data-spot-page-shared-module="rail"></aside>
      <article class="spot-page-article collection-article">

    <section class="section collection-about-section" aria-labelledby="about727Title">
      <div class="section-head">
        <p class="eyebrow">ABOUT 727</p>
        ${t.about727Title}
      </div>
      ${t.line7}
      ${t.line8}
      ${t.line9}
    </section>

    <section class="section collection-progress-section" aria-labelledby="collectionProgressTitle">
      <div class="section-head">
        <p class="eyebrow">WINDOW STAMP JOURNAL</p>
        ${t.collectionProgressTitle}
        ${t.section_sub}
      </div>
      <div id="collectionProgress" class="collection-progress" aria-live="polite"></div>
      ${t.collectionMedals}
    </section>

    <section class="section collection-list-section" aria-labelledby="collectionListTitle">
      <div class="section-head">
        <p class="eyebrow">SPOT LIST</p>
        ${t.collectionListTitle}
        ${t.section_sub2}
      </div>
      <div class="collection-map-layout">
        <div class="collection-map-shell">
          <div class="collection-map-toolbar">
            ${t.line10}
          </div>
          ${t.collectionMap}
          ${t.collectionMapStatus}
        </div>
        <aside id="collectionMapFallback" class="collection-map-fallback" hidden>
          ${t.line11}
          ${t.line12}
          <div id="collectionMapFallbackLinks"></div>
        </aside>
      </div>
      <div class="collection-route-intro">
        ${t.line13}
        ${t.line14}
      </div>
      <div class="collection-list-tools">
        ${t.collection_filter_group}
          ${t.collection_filter_label}
          ${t.collection_filter_button}
          ${t.collection_filter_button2}
          ${t.collection_filter_button3}
          ${t.collection_filter_button4}
          ${t.collection_filter_button5}
        </div>
        <span id="collectionListCount" class="collection-list-count" aria-live="polite"></span>
      </div>
      <div id="collectionList" class="collection-point-list"></div>
    </section>

    <section class="section collection-notes-section" aria-labelledby="collectionNotesTitle">
      <div class="collection-note-card">
        <p class="eyebrow">ABOUT THIS LIST</p>
        ${t.collectionNotesTitle}
        ${t.line15}
        ${t.line16}
        ${t.line17}
        ${t.line18}
        ${t.line19}
      </div>
    </section>
      </article>
    </div>

    <section data-spot-page-shared-module="mobile-promos"></section>
    <section data-spot-page-shared-module="showcase"></section>
    <section data-spot-page-shared-module="content-rail"></section>
  </main>

  <footer class="footer">
    ${t.footer_brand}
    ${t.line20}
    ${t.footer_links}
    ${t.footer_credit}
  </footer>

  <script src="${p}spot-page-shared-data.js?v=${assetVersion('spot-page-shared-data.js')}"></script>
  <script src="${p}spot-page-shared.js?v=${assetVersion('spot-page-shared.js')}"></script>
  <script src="${p}data-runtime.js?v=${assetVersion('data-runtime.js')}"></script>
  <script src="${p}spot-map.js?v=${assetVersion('spot-map.js')}"></script>
  <script src="${p}727-collection.js?v=${assetVersion('727-collection.js')}"></script>
</body>
</html>
`;
}

for (const lang of ['ja', 'en']) {
  const dest = path.join(root, lang === 'ja' ? '727-collection.html' : 'en/727-collection.html');
  const html = render(lang);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== html) throw Error('727 collection page out of date: ' + dest);
  } else {
    fs.writeFileSync(dest, html);
  }
}
console.log('727 collection pages: ja + en from one template.');
