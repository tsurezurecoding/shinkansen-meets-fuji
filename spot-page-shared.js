(function (root) {
  "use strict";

  var DATA_KEY = "MADO_SPOT_PAGE_SHARED_DATA";
  var HOST_ATTRIBUTE = "data-spot-page-shared-module";
  var SUPPORTED_LANGUAGES = { ja: true, en: true };
  var UI = {
    ja: {
      brand: "新幹線の窓",
      brandSub: "旅の瞬間を見逃さない",
      train: "列車選択",
      live: "ライブガイド",
      fieldGuide: "車窓図鑑",
      faq: "FAQ",
      journal: "メダル帖",
      more: "もっと見る",
      about: "新幹線の窓とは",
      forecast: "富士山 見える予報",
      sumie: "墨絵車窓",
      somato: "車窓走馬灯",
      links: "リンク集",
      contact: "お問い合わせ",
      privacy: "プライバシーポリシー",
      language: "Language",
      railEyebrow: "Tokaido Shinkansen",
      railTitle: "東京 → 新大阪の車窓",
      railCountSuffix: " の見どころ",
      railNow: function (name, minutes, side) { return "<b>" + name + "</b>東京から約" + minutes + "分 ・ " + side; },
      railPreviewTiming: function (minutes) { return "東京から約" + minutes + "分"; },
      railCta: "乗る列車でガイドを作る",
      railFoot: "車窓図鑑で写真から探す →",
      railAppTitle: "Androidアプリ版（早期アクセス）",
      railAppBody: "テスト参加者を募集中",
      railDisneyTitle: "ディズニー新幹線",
      railDisneyBody: "Sparkling Dreams Shinkansen｜運転日と車窓の目安を見る",
      railHanabiTitle: "新幹線から見える花火",
      railHanabiBody: "沿線の花火大会と、車窓から見えた記録を集める",
      railYakeiTitle: "新幹線の夜景",
      railYakeiBody: "どこから暗くなるかを調べて、夜だけの車窓を探す",
      rail727Title: "727看板コレクション",
      rail727Body: function (count) { return "東京〜新大阪の沿線、全" + count + "地点を集める"; },
      railStationSuffix: "分",
      contentEyebrow: "MORE TO TRY",
      contentTitle: "車窓をもっと楽しむ",
      showcaseEyebrow: "MORE TO SEE",
      showcaseTitle: "ほかにも、こんな車窓",
      showcaseAction: "詳しく見る",
      showcaseCta: "もっと見る",
      showcaseCtaSub: "この区間の景色を一覧で見る",
      mobileAffiliate: "広告",
      mobileAffiliateNote: "アフィリエイトリンクを含みます。",
      sideA: "A席・海側",
      sideE: "E席・山側",
      sideBoth: "左右両側",
      hamanakoSide: "A席・海側 / E席・山側",
      languageJa: "日本語",
      languageEn: "EN"
    },
    en: {
      brand: "Shinkansen Window",
      brandSub: "Never miss a moment of the journey.",
      train: "Train Search",
      live: "Live Guide",
      fieldGuide: "Field Guide",
      faq: "FAQ",
      journal: "Journal",
      more: "More",
      about: "About this app",
      forecast: "Visibility β",
      sumie: "Sumie Window",
      somato: "Window Journey",
      links: "Links",
      contact: "Contact",
      privacy: "Privacy Policy",
      language: "Language",
      railEyebrow: "Tokaido Shinkansen",
      railTitle: "Tokyo → Shin-Osaka window",
      railCountSuffix: " views",
      railNow: function (name, minutes, side) { return "<b>" + name + "</b>About " + minutes + " min from Tokyo · " + side; },
      railPreviewTiming: function (minutes) { return "About " + minutes + " min from Tokyo"; },
      railCta: "Build my guide by train",
      railFoot: "Browse by photo →",
      railAppTitle: "Android app (early access)",
      railAppBody: "Looking for testers",
      railDisneyTitle: "Disney Shinkansen",
      railDisneyBody: "Sparkling Dreams Shinkansen · operating dates and window-side estimates",
      railHanabiTitle: "Fireworks from the window",
      railHanabiBody: "Festivals along the line, and posts from people who saw them",
      railYakeiTitle: "Night views from the window",
      railYakeiBody: "Find where your train goes dark, and what only shows after it",
      railStationSuffix: " min",
      contentEyebrow: "MORE TO TRY",
      contentTitle: "More ways to enjoy the window",
      showcaseEyebrow: "MORE TO SEE",
      showcaseTitle: "More window views",
      showcaseAction: "Read the guide",
      showcaseCta: "More",
      showcaseCtaSub: "Browse every view in this stretch",
      mobileAffiliate: "AFFILIATE LINKS",
      mobileAffiliateNote: "Michikusa may earn a commission at no extra cost to you.",
      sideA: "Seat A · left side toward Kyoto",
      sideE: "Seat E · right side toward Kyoto",
      sideBoth: "Both sides",
      hamanakoSide: "Seat A · left / Seat E · right (toward Kyoto)",
      languageJa: "日本語",
      languageEn: "EN"
    }
  };

  var CONTENT_ITEMS = {
    ja: [
      { label: "FAQ", title: "富士山FAQ", desc: "見える時刻、座席側、曇りの日の答えを確認。", href: "guide.html", img: "images/thumbs/content-faq.webp" },
      { label: "FORECAST", title: "今日の富士山 見える予報", desc: "今日の空で富士山が見えそうかを確認。", href: "mieru.html", img: "images/thumbs/content-mieru.webp" },
      { label: "EXTRA", title: "墨絵車窓", desc: "東海道新幹線の車窓を、静かな墨絵で。", href: "sumie.html", img: "images/thumbs/content-sumie.webp" },
      { label: "EXTRA", title: "車窓走馬灯", desc: "実際の車窓写真で、旅を短くめぐる。", href: "somato.html", img: "images/thumbs/content-somato.webp" },
      { label: "JOURNAL", title: "メダル帖", desc: "見つけた景色をスタンプとメダルで記録。", href: "journal.html", img: "images/stamps/stamp_fuji.svg" },
      { label: "GUIDE", title: "新幹線の窓とは", desc: "使い方と楽しみ方を30秒で紹介。", href: "lp.html", img: "images/thumbs/og-shinkansen-window.webp" },
      { label: "LINKS", title: "車窓リンク集", desc: "出典や参考記事をまとめて読む。", href: "references.html", img: "images/thumbs/20260616_fuji_sttraveler.webp" },
      { label: "CONTACT", title: "お問い合わせ", desc: "写真提供、情報の訂正、ご感想はこちら。", href: "contact.html", img: "images/thumbs/content-contact.webp" }
    ],
    en: [
      { label: "FAQ", title: "Mt. Fuji FAQ", desc: "Check the timing, seat side and cloudy-day answers.", href: "guide.html", img: "images/thumbs/content-faq.webp" },
      { label: "FORECAST", title: "Visibility β", desc: "Check whether Mt. Fuji is likely to show today.", href: "mieru.html", img: "images/thumbs/content-mieru.webp" },
      { label: "EXTRA", title: "Sumie Window", desc: "Ride the route as a quiet ink-painting window.", href: "sumie.html", img: "images/thumbs/content-sumie.webp" },
      { label: "EXTRA", title: "Window Journey", desc: "Let real window photos flow past like a short trip.", href: "somato.html", img: "images/thumbs/content-somato.webp" },
      { label: "JOURNAL", title: "Stamps and medals", desc: "Keep the views you found during the ride.", href: "journal.html", img: "images/stamps/stamp_fuji.svg" },
      { label: "GUIDE", title: "About this app", desc: "See how to use and enjoy it in 30 seconds.", href: "?intro=1", img: "images/thumbs/og-shinkansen-window.webp" },
      { label: "LINKS", title: "Window links", desc: "Sources and reading for deeper window-view trips.", href: "references.html", img: "images/thumbs/20260616_fuji_sttraveler.webp" },
      { label: "CONTACT", title: "Contact", desc: "Send photo suggestions, corrections or feedback.", href: "contact.html", img: "images/thumbs/content-contact.webp" }
    ]
  };

  var AMAZON_URL = "https://www.amazon.co.jp/dp/B0FMHZ3KVP?pd_rd_i=B0FMHZ3KVP&amp;pd_rd_w=lU1VV&amp;content-id=amzn1.sym.69e074f9-f3fe-40fa-8127-0a0a78871637&amp;pf_rd_p=69e074f9-f3fe-40fa-8127-0a0a78871637&amp;pf_rd_r=QVE14HXSSSPKSWKTJC8W&amp;pd_rd_wg=TPiT3&amp;pd_rd_r=ee7d1a5c-feca-4385-b43b-9b771d1e485f&amp;sp_csd=d2lkZ2V0TmFtZT1zcF9kZXRhaWxfdGhlbWF0aWM&amp;th=1&amp;linkCode=ll2&amp;tag=programmasavo-22&amp;linkId=e7f7b946499962102ba2f0d6d30ffd9a&amp;ref_=as_li_ss_tl";

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function localized(value, lang) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    return value[lang] || value.ja || value.en || "";
  }

  function normalizeRoot(value) {
    if (typeof value !== "string" || !value || value.charAt(0) === "/" || /^[a-z][a-z\d+.-]*:/i.test(value) || value.indexOf("\\") !== -1) {
      throw new Error("relative root is required");
    }
    return value.charAt(value.length - 1) === "/" ? value : value + "/";
  }

  function safeAssetPath(value) {
    return typeof value === "string" && value.indexOf("images/") === 0 && value.indexOf("..") === -1 && value.indexOf("\\") === -1 && !/[?#]/.test(value);
  }

  function safeSpotId(value) {
    return typeof value === "string" && /^[a-z0-9-]+$/.test(value);
  }

  function safeRouteId(value) {
    return typeof value === "string" && /^[A-Za-z0-9-]+$/.test(value);
  }

  function sideLabel(spot, lang) {
    var ui = UI[lang];
    return localized(spot.sideLabel, lang) || (spot.side === "A" ? ui.sideA : spot.side === "E" ? ui.sideE : ui.sideBoth);
  }

  function seatLabels(spot) {
    return Array.isArray(spot.seats) ? spot.seats.filter(function (seat) { return seat === "A" || seat === "E"; }) : [];
  }

  function validateData(data, currentId, lang) {
    if (!data || data.version !== 2 || !Array.isArray(data.stations) || !data.stations.length || !Array.isArray(data.spots) || !data.spots.length || !data.pages || typeof data.pages !== "object") {
      throw new Error("shared data is missing its version, stations, or spots");
    }
    if (typeof data.affiliatesEnabled !== "boolean" || !Array.isArray(data.showcase) || !data.showcase.length) {
      throw new Error("shared presentation data is missing its feature flags or showcase");
    }
    var stationIds = {};
    data.stations.forEach(function (station) {
      if (!station || !safeRouteId(station.id) || stationIds[station.id] || !station.name || !Number.isFinite(Number(station.minutes))) {
        throw new Error("shared station data is malformed");
      }
      stationIds[station.id] = true;
      if (!localized(station.name, lang)) throw new Error("shared station name is missing");
    });
    var spotIds = {};
    data.spots.forEach(function (spot) {
      if (!spot || !safeSpotId(spot.id) || spotIds[spot.id] || !spot.name || !Number.isFinite(Number(spot.minutes))) {
        throw new Error("shared spot data is malformed");
      }
      if (!localized(spot.name, lang) || !safeAssetPath(spot.thumb)) {
        throw new Error("shared spot name or thumbnail is malformed");
      }
      if (!seatLabels(spot).length) throw new Error("shared spot seats are malformed");
      spotIds[spot.id] = true;
    });
    var showcaseIds = {};
    data.showcase.forEach(function (item) {
      if (!item || !safeSpotId(item.id) || showcaseIds[item.id] || !localized(item.name, lang) || !localized(item.hook, lang) || !safeAssetPath(item.thumb) || (item.creditUrl && !/^https?:\/\//i.test(item.creditUrl))) {
        throw new Error("shared showcase data is malformed");
      }
      showcaseIds[item.id] = true;
    });
    if (!spotIds[currentId] || !data.pages[currentId] || !data.pages[currentId][lang]) throw new Error("current spot is not in shared data");
  }

  function href(rootPath, relativePath) {
    return rootPath + relativePath;
  }

  function basePath(rootPath, lang) {
    return lang === "en" ? rootPath + "en/" : rootPath;
  }

  // ユーティリティ（スポット以外）で共通chromeを使うページ。en: 英語版が存在するか
  var UTILITY_ROUTES = {
    "mieru.html": { en: true },
    "sparkling-dreams.html": { en: true },
    "hanabi.html": { en: true },
    "yakei.html": { en: true },
    // 英語専用。JR Passはインバウンド固有の文脈で日本語版を作る理由がないため、
    // en:false で言語スイッチャーごと隠す（対応する日本語URLが存在しない）。
    "jr-pass-fuji.html": { en: false },
    "besides-fuji.html": { en: false },
    // 英語版が同名ミラーではなく既存の解説ページにあるため、パスを文字列で指定する。
    "727-collection.html": { en: "en/spots/727-board.html" }
  };

  function siteHeaderHTML(rootPath, lang, currentId, utilityRoute, utilityHasAlternate) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    var homeHref = lang === "en" ? href(base, "") : href(base, "index.html");
    var trainHref = lang === "en" ? href(base, "#journey") : href(base, "index.html#journey");
    // 英語ページから日本語へ戻すリンクには必ず ?lang=ja を付ける。
    // language-router.js は localStorage の mado-lang が "en" のとき日本語URLを英語版へ
    // 差し替えるため、これが無いと「日本語」を押しても英語ページへ戻される（2026-08-13発覚）。
    // ?lang=ja は router 側で保存値を "ja" へ上書きしてリダイレクトを止める入口になっている。
    var jaHref = utilityRoute
      ? (lang === "ja" ? utilityRoute : href(rootPath, utilityRoute) + "?lang=ja")
      : (lang === "ja" ? currentId + ".html" : href(rootPath, "spots/" + currentId + ".html") + "?lang=ja");
    var enHref = utilityRoute ? (lang === "en" ? utilityRoute : href(rootPath, typeof utilityHasAlternate === "string" ? utilityHasAlternate : "en/" + utilityRoute)) : (lang === "en" ? currentId + ".html" : href(rootPath, "en/spots/" + currentId + ".html"));
    var jaClass = lang === "ja" ? "active" : "";
    var enClass = lang === "en" ? "active" : "";
    return "<header class=\"topbar\">" +
      "<a class=\"brand\" href=\"" + escapeHTML(homeHref) + "\">" +
        "<span class=\"brand-mark\">窓</span>" +
        "<span class=\"brand-text\">" +
          "<span class=\"brand-name\">" + escapeHTML(ui.brand) + "</span>" +
          "<small class=\"brand-sub\">" + escapeHTML(ui.brandSub) + "</small>" +
        "</span>" +
      "</a>" +
      "<nav class=\"top-nav\" aria-label=\"Primary\">" +
        "<a href=\"" + escapeHTML(trainHref) + "\">" + escapeHTML(ui.train) + "</a>" +
        "<a href=\"" + escapeHTML(href(base, "live/")) + "\">" + escapeHTML(ui.live) + "</a>" +
        "<a href=\"" + escapeHTML(href(base, "zukan.html")) + "\">" + escapeHTML(ui.fieldGuide) + "</a>" +
        "<a class=\"top-nav-overflow\" href=\"" + escapeHTML(href(base, "guide.html")) + "\">" + escapeHTML(ui.faq) + "</a>" +
        "<a href=\"" + escapeHTML(href(base, "journal.html")) + "\">" + escapeHTML(ui.journal) + "</a>" +
        "<details class=\"top-nav-more\">" +
          "<summary>" + escapeHTML(ui.more) + "</summary>" +
          "<div class=\"top-nav-menu\">" +
            "<a class=\"top-nav-menu-compact\" href=\"" + escapeHTML(href(base, "guide.html")) + "\">" + escapeHTML(ui.faq) + "</a>" +
            "<a href=\"" + escapeHTML(href(base, "lp.html")) + "\">" + escapeHTML(ui.about) + "</a>" +
            "<a href=\"" + escapeHTML(href(base, "mieru.html")) + "\">" + escapeHTML(ui.forecast) + "</a>" +
            "<a href=\"" + escapeHTML(href(base, "sumie.html")) + "\">" + escapeHTML(ui.sumie) + "</a>" +
            "<a href=\"" + escapeHTML(href(base, "somato.html")) + "\">" + escapeHTML(ui.somato) + "</a>" +
            "<a href=\"" + escapeHTML(href(base, "references.html")) + "\">" + escapeHTML(ui.links) + "</a>" +
            "<a href=\"" + escapeHTML(href(base, "contact.html")) + "\">" + escapeHTML(ui.contact) + "</a>" +
            "<a href=\"" + escapeHTML(href(base, "privacy.html")) + "\">" + escapeHTML(ui.privacy) + "</a>" +
          "</div>" +
        "</details>" +
      "</nav>" +
      (utilityRoute && utilityHasAlternate === false ? "" :
        "<div class=\"lang-switch\" role=\"group\" aria-label=\"" + escapeHTML(ui.language) + "\">" +
          "<a class=\"" + jaClass + "\" href=\"" + escapeHTML(jaHref) + "\">" + escapeHTML(ui.languageJa) + "</a>" +
          "<a class=\"" + enClass + "\" href=\"" + escapeHTML(enHref) + "\">" + escapeHTML(ui.languageEn) + "</a>" +
        "</div>") +
    "</header>";
  }

  function railAffiliateHTML(data, rootPath, lang) {
    // The reusable affiliate markup stays intact, but the generated shared-data
    // flag keeps presentation off until it is deliberately re-enabled.
    if (data.affiliatesEnabled !== true) return "";
    if (lang === "ja") {
      return "<div class=\"spot-page-rail-affiliate-group\" id=\"spotRailAffiliate\">" +
        "<p class=\"spot-page-rail-affiliate-label\">広告</p>" +
        "<div class=\"spot-page-rail-affiliate\" data-affiliate-module data-affiliate-partner=\"valuecommerce\" data-affiliate-offer=\"nta_shinkansen_hotel\" data-affiliate-placement=\"ja_spot_rail_after_route_primary\" data-affiliate-language=\"ja\" data-affiliate-context=\"spot\">" +
          "<div class=\"spot-page-rail-affiliate-banner\">" +
            "<a href=\"//ck.jp.ap.valuecommerce.com/servlet/referral?sid=2833638&amp;pid=892671040\" target=\"_blank\" rel=\"sponsored nofollow noopener\"><img src=\"//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=2833638&amp;pid=892671040\" alt=\"日本旅行 JR・新幹線とホテルのセットプラン\" loading=\"lazy\" decoding=\"async\" fetchpriority=\"low\" width=\"200\" height=\"200\"></a>" +
            "<noscript><a href=\"//ck.jp.ap.valuecommerce.com/servlet/referral?sid=2833638&amp;pid=892671040\" rel=\"sponsored nofollow noopener\"><img src=\"//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=2833638&amp;pid=892671040\" alt=\"日本旅行 JR・新幹線とホテルのセットプラン\" width=\"200\" height=\"200\"></a></noscript>" +
          "</div>" +
        "</div>" +
        "<div class=\"spot-page-rail-affiliate\" data-affiliate-module data-affiliate-partner=\"amazon\" data-affiliate-offer=\"philips_power_bank_b0fmhz3kvp\" data-affiliate-placement=\"ja_spot_rail_after_route_tertiary\" data-affiliate-language=\"ja\" data-affiliate-context=\"spot\">" +
          "<a class=\"spot-page-rail-amazon\" href=\"" + AMAZON_URL + "\" target=\"_blank\" rel=\"sponsored nofollow noopener\">" +
            "<img src=\"" + escapeHTML(href(rootPath, "images/affiliate/amazon-philips-power-bank.jpg")) + "\" alt=\"Philipsのケーブル一体型モバイルバッテリー\" loading=\"lazy\" decoding=\"async\" width=\"200\" height=\"116\">" +
            "<span class=\"spot-page-rail-amazon-body\"><small>Amazon.co.jp</small><strong>旅先の充電を1台に</strong><span>ケーブル・コンセント一体型 15000mAh</span><b>Amazonで見る <span aria-hidden=\"true\">↗</span></b></span>" +
          "</a>" +
        "</div>" +
        "<p class=\"spot-page-rail-affiliate-note\">この欄にはアフィリエイトリンクが含まれます。</p>" +
      "</div>";
    }
    return "<div class=\"spot-page-rail-klook\" id=\"spotRailAffiliate\" data-affiliate-module data-affiliate-partner=\"klook\" data-affiliate-placement=\"en_spot_rail_after_route\" data-affiliate-language=\"en\" data-affiliate-context=\"spot\">" +
      "<div class=\"spot-page-rail-klook-heading\" data-affiliate-view-target><p class=\"spot-page-rail-affiliate-label\">AFFILIATE LINKS</p><p class=\"spot-page-rail-klook-title\">Plan beyond the window</p><p class=\"spot-page-rail-klook-note\">Michikusa may earn a commission at no extra cost to you.</p></div>" +
      "<div class=\"affiliate-card-grid\">" +
        "<a class=\"affiliate-card\" href=\"https://affiliate.klook.com/redirect?aid=129377&amp;aff_adid=1363987&amp;k_site=https%3A%2F%2Fwww.klook.com%2Fen-US%2Factivity%2F1420-7-day-whole-japan-rail-pass-jr-pass\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-affiliate-partner=\"klook\" data-affiliate-offer=\"jr_pass\"><img src=\"" + escapeHTML(href(rootPath, "images/affiliate/klook-japan-rail-pass.png")) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\" width=\"300\" height=\"250\"><span class=\"affiliate-card-body\"><small>RAIL TRAVEL</small><strong>Whole Japan Rail Pass</strong><span>For travel beyond the Tokaido route.</span><span class=\"affiliate-card-action\">View on Klook <span aria-hidden=\"true\">↗</span></span></span></a>" +
        "<a class=\"affiliate-card\" href=\"https://affiliate.klook.com/redirect?aid=129377&amp;aff_adid=1363993&amp;k_site=https%3A%2F%2Fwww.klook.com%2Fen-US%2Factivity%2F75806-fuji-hakone-day-tour\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-affiliate-partner=\"klook\" data-affiliate-offer=\"fuji_hakone\"><img src=\"" + escapeHTML(href(rootPath, "images/affiliate/klook-fuji-hakone-tour.png")) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\" width=\"300\" height=\"250\"><span class=\"affiliate-card-body\"><small>FROM TOKYO</small><strong>Mt. Fuji &amp; Hakone Day Tour</strong><span>For a closer Fuji experience.</span><span class=\"affiliate-card-action\">View on Klook <span aria-hidden=\"true\">↗</span></span></span></a>" +
        "<a class=\"affiliate-card\" href=\"https://affiliate.klook.com/redirect?aid=129377&amp;aff_adid=1363992&amp;k_site=https%3A%2F%2Fwww.klook.com%2Fen-US%2Factivity%2F110001-kyoto-nara-deer-arashiyama-train-cherry-blossom-one-day-tour\" target=\"_blank\" rel=\"sponsored nofollow noopener\" data-affiliate-partner=\"klook\" data-affiliate-offer=\"kyoto_nara\"><img src=\"" + escapeHTML(href(rootPath, "images/affiliate/klook-kyoto-nara-tour.png")) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\" width=\"300\" height=\"250\"><span class=\"affiliate-card-body\"><small>FROM KYOTO</small><strong>Kyoto &amp; Nara Day Tour</strong><span>Continue the trip beyond Kyoto.</span><span class=\"affiliate-card-action\">View on Klook <span aria-hidden=\"true\">↗</span></span></span></a>" +
      "</div>" +
    "</div>";
  }

  function railHTML(data, rootPath, lang, currentId, spotHrefPrefix, currentRoute) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    var trainHref = lang === "en" ? href(base, "#journey") : href(base, "index.html#journey");
    var rows = [];
    data.stations.forEach(function (station) {
      rows.push({ kind: "station", id: station.id, minutes: Number(station.minutes), major: !!station.major, name: localized(station.name, lang) });
    });
    data.spots.forEach(function (spot) {
      if (!Number.isFinite(Number(spot.minutes))) return;
      rows.push({ kind: "spot", id: spot.id, minutes: Number(spot.minutes), name: localized(spot.name, lang), seats: seatLabels(spot), thumb: spot.thumb || "", sideLabel: sideLabel(spot, lang) });
    });
    rows.sort(function (a, b) {
      return a.minutes - b.minutes || (a.kind === "station" ? -1 : 1);
    });

    var items = rows.map(function (row) {
      if (row.kind === "station") {
        return "<li class=\"spot-page-rail-row spot-page-rail-station" + (row.major ? " is-major" : "") + "\"><span class=\"spot-page-rail-station-name\">" + escapeHTML(row.name) + "</span><span class=\"spot-page-rail-station-min\">" + escapeHTML(row.minutes) + escapeHTML(ui.railStationSuffix) + "</span></li>";
      }
      var isCurrent = row.id === currentId;
      var seats = "<span class=\"spot-page-shared-seat-group\" aria-label=\"" + escapeHTML(row.sideLabel) + "\">" + row.seats.map(function (seat) {
        return "<span class=\"spot-page-shared-seat is-" + escapeHTML(seat.toLowerCase()) + "\">" + escapeHTML(seat) + "</span>";
      }).join("") + "</span>";
      var thumbnail = "<span class=\"spot-page-rail-thumb-wrap\"><img class=\"spot-page-rail-thumb\" src=\"" + escapeHTML(href(rootPath, row.thumb)) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\" width=\"38\" height=\"38\"><span class=\"spot-page-shared-preview\" aria-hidden=\"true\"><img src=\"" + escapeHTML(href(rootPath, row.thumb)) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\"><span class=\"spot-page-shared-preview-copy\"><strong>" + escapeHTML(row.name) + "</strong><span>" + escapeHTML(ui.railPreviewTiming(row.minutes)) + " ・ " + escapeHTML(row.sideLabel) + "</span></span></span></span>";
      return "<li class=\"spot-page-rail-row spot-page-rail-spot" + (isCurrent ? " is-current" : "") + "\"><a class=\"spot-page-rail-link\" href=\"" + escapeHTML((spotHrefPrefix || "") + row.id + ".html") + "\"" + (isCurrent ? " aria-current=\"page\"" : "") + ">" + thumbnail + "<span class=\"spot-page-rail-min\">" + escapeHTML(row.minutes) + "</span><span class=\"spot-page-rail-name\">" + escapeHTML(row.name) + "</span>" + seats + "</a></li>";
    }).join("");
    var current = data.spots.filter(function (spot) { return spot.id === currentId; })[0];
    var now = current ? ui.railNow(escapeHTML(localized(current.name, lang)), escapeHTML(Number(current.minutes)), escapeHTML(sideLabel(current, lang))) : "";
    return "<aside class=\"spot-page-rail\" aria-label=\"" + escapeHTML(ui.railTitle) + "\"><div class=\"spot-page-rail-head\"><p class=\"spot-page-rail-eyebrow\">" + escapeHTML(ui.railEyebrow) + "</p><p class=\"spot-page-rail-title\">" + escapeHTML(ui.railTitle) + "</p><p class=\"spot-page-rail-count\"><strong>" + escapeHTML(data.spots.length) + "</strong>" + escapeHTML(ui.railCountSuffix) + "</p>" + (now ? "<p class=\"spot-page-rail-now\">" + now + "</p>" : "") + "<a class=\"spot-page-rail-cta\" href=\"" + escapeHTML(trainHref) + "\">" + escapeHTML(ui.railCta) + "</a></div><div class=\"spot-page-rail-list-wrap\"><ol class=\"spot-page-rail-list\">" + items + "</ol></div><div class=\"spot-page-rail-foot\"><a href=\"" + escapeHTML(href(base, "zukan.html")) + "\">" + escapeHTML(ui.railFoot) + "</a></div>" + railPromosHTML(rootPath, lang, currentRoute, collection727Count(data)) + railAffiliateHTML(data, rootPath, lang) + "</aside>";
  }

  // currentRoute は utility 文脈のときだけ渡る。自分自身へのカードは出さない。
  // 地点数は生成データを唯一の出所にする。文言側に数字を直接書かない。
  function collection727Count(data) {
    return data && typeof data.collection727Count === "number" ? data.collection727Count : 0;
  }

  function railPromosHTML(rootPath, lang, currentRoute, count727) {
    var out = railAppHTML(rootPath, lang);
    if (currentRoute !== "sparkling-dreams.html") out += railDisneyHTML(rootPath, lang);
    if (currentRoute !== "hanabi.html") out += railHanabiHTML(rootPath, lang);
    if (currentRoute !== "yakei.html") out += railYakeiHTML(rootPath, lang);
    if (lang === "ja" && currentRoute !== "727-collection.html") out += rail727HTML(rootPath, count727);
    return out;
  }

  function mobilePromosHTML(rootPath, lang, currentRoute, count727) {
    return "<section class=\"spot-page-mobile-promos\" aria-label=\"" + escapeHTML(UI[lang].contentTitle) + "\">" + railPromosHTML(rootPath, lang, currentRoute, count727) + "</section>";
  }

  function railAppHTML(rootPath, lang) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    return "<div class=\"spot-page-rail-app hide-in-app\"><a href=\"" + escapeHTML(href(base, "early-access.html?src=spot")) + "\" data-cta-track=\"early_access_click\" data-cta-id=\"spot_rail_android\"><img src=\"" + escapeHTML(href(rootPath, "images/android/app-icon-192.webp")) + "\" alt=\"\" width=\"36\" height=\"36\" loading=\"lazy\" decoding=\"async\"><span class=\"spot-page-rail-app-copy\"><strong>" + escapeHTML(ui.railAppTitle) + "</strong><small>" + escapeHTML(ui.railAppBody) + "</small></span><span class=\"spot-page-rail-app-arrow\" aria-hidden=\"true\">›</span></a></div>";
  }

  function railDisneyHTML(rootPath, lang) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    return "<div class=\"spot-page-rail-disney\"><a href=\"" + escapeHTML(href(base, "sparkling-dreams.html")) + "\" data-cta-track=\"sparkling_dreams_entry_click\" data-cta-id=\"spot_rail_disney\"><img src=\"" + escapeHTML(href(rootPath, "images/sparkling-dreams-window.svg")) + "\" alt=\"\" width=\"42\" height=\"30\" loading=\"lazy\" decoding=\"async\"><span class=\"spot-page-rail-disney-copy\"><strong>" + escapeHTML(ui.railDisneyTitle) + "</strong><small>" + escapeHTML(ui.railDisneyBody) + "</small></span><span class=\"spot-page-rail-disney-arrow\" aria-hidden=\"true\">›</span></a></div>";
  }
  // レイアウトは Disney カードと同一のため .spot-page-rail-disney を土台に使い、
  // 見分け用の modifier だけ足している（style.css は未変更）。
  function railHanabiHTML(rootPath, lang) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    return "<div class=\"spot-page-rail-disney spot-page-rail-hanabi\"><a href=\"" + escapeHTML(href(base, "hanabi.html")) + "\" data-cta-track=\"hanabi_entry_click\" data-cta-id=\"spot_rail_hanabi\"><img src=\"" + escapeHTML(href(rootPath, "images/hanabi-window.svg")) + "\" alt=\"\" width=\"42\" height=\"30\" loading=\"lazy\" decoding=\"async\"><span class=\"spot-page-rail-disney-copy\"><strong>" + escapeHTML(ui.railHanabiTitle) + "</strong><small>" + escapeHTML(ui.railHanabiBody) + "</small></span><span class=\"spot-page-rail-disney-arrow\" aria-hidden=\"true\">›</span></a></div>";
  }

  function railYakeiHTML(rootPath, lang) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    return "<div class=\"spot-page-rail-disney spot-page-rail-yakei\"><a href=\"" + escapeHTML(href(base, "yakei.html")) + "\" data-cta-track=\"yakei_entry_click\" data-cta-id=\"spot_rail_yakei\"><img src=\"" + escapeHTML(href(rootPath, "images/yakei-window.svg")) + "\" alt=\"\" width=\"42\" height=\"30\" loading=\"lazy\" decoding=\"async\"><span class=\"spot-page-rail-disney-copy\"><strong>" + escapeHTML(ui.railYakeiTitle) + "</strong><small>" + escapeHTML(ui.railYakeiBody) + "</small></span><span class=\"spot-page-rail-disney-arrow\" aria-hidden=\"true\">›</span></a></div>";
  }

  function rail727HTML(rootPath, count) {
    var ui = UI.ja;
    return "<div class=\"spot-page-rail-disney spot-page-rail-727\"><a href=\"" + escapeHTML(href(rootPath, "727-collection.html")) + "\" data-cta-track=\"727_collection_entry_click\" data-cta-id=\"spot_rail_727\"><img src=\"" + escapeHTML(href(rootPath, "images/stamps/stamp_727-board.svg")) + "\" alt=\"\" width=\"42\" height=\"30\" loading=\"lazy\" decoding=\"async\"><span class=\"spot-page-rail-disney-copy\"><strong>" + escapeHTML(ui.rail727Title) + "</strong><small>" + escapeHTML(ui.rail727Body(count)) + "</small></span><span class=\"spot-page-rail-disney-arrow\" aria-hidden=\"true\">›</span></a></div>";
  }

  function contentRailHTML(rootPath, lang) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    var cards = CONTENT_ITEMS[lang].map(function (item) {
      return "<a class=\"content-rail-card\" href=\"" + escapeHTML(href(base, item.href)) + "\"><img src=\"" + escapeHTML(href(rootPath, item.img)) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\"><span class=\"content-rail-card-body\"><small>" + escapeHTML(item.label) + "</small><strong>" + escapeHTML(item.title) + "</strong><span>" + escapeHTML(item.desc) + "</span></span></a>";
    }).join("");
    return "<section class=\"content-rail-section\" aria-labelledby=\"contentRailTitle\"><div class=\"section-head\"><p class=\"eyebrow\">" + escapeHTML(ui.contentEyebrow) + "</p><h2 id=\"contentRailTitle\">" + escapeHTML(ui.contentTitle) + "</h2></div><div class=\"content-rail\">" + cards + "</div></section>";
  }

  function showcaseCreditHTML(item, lang) {
    var label = localized(item.credit, lang);
    var text = String(label).toLowerCase() === "michikusa" ? (item.creditDate || label) : label;
    if (!text) return "";
    // The whole showcase card is already a link; keep the photo credit visible
    // as text so the card never creates an invalid nested anchor.
    return "<small class=\"show-credit\">" + escapeHTML(text) + "</small>";
  }

  function showcaseHTML(data, rootPath, lang) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    var cards = data.showcase.map(function (item) {
      var name = localized(item.name, lang);
      var hook = localized(item.hook, lang);
      var guideHref = href(base, "spots/" + item.id + ".html");
      return "<a class=\"show-card\" href=\"" + escapeHTML(guideHref) + "\" aria-label=\"" + escapeHTML(name + ": " + ui.showcaseAction) + "\">" +
        "<div class=\"show-media\"><img src=\"" + escapeHTML(href(rootPath, item.thumb)) + "\" alt=\"" + escapeHTML(name) + "\" loading=\"lazy\" decoding=\"async\"></div>" +
        "<span class=\"show-caption\"><strong>" + escapeHTML((item.icon || "") + " " + name).trim() + "</strong>" + showcaseCreditHTML(item, lang) + "<span class=\"show-hook\">" + escapeHTML(hook) + "</span><span class=\"show-guide-link\">" + escapeHTML(ui.showcaseAction) + "</span></span>" +
        "</a>";
    }).join("");
    var remaining = Math.max(0, data.spots.length - data.showcase.length);
    var cta = "<a class=\"show-card show-card-cta\" href=\"" + escapeHTML(href(base, "zukan.html")) + "\" aria-label=\"" + escapeHTML(ui.showcaseCta + ": " + ui.fieldGuide) + "\">" +
      "<div class=\"show-media show-media-cta\" aria-hidden=\"true\"><div class=\"show-cta-badge\"><span class=\"show-cta-arrow\">→</span></div><span class=\"show-cta-count\">+" + escapeHTML(remaining) + " spots</span></div>" +
      "<span class=\"show-caption\"><strong>" + escapeHTML(ui.showcaseCta) + "</strong><span>" + escapeHTML(ui.showcaseCtaSub) + "</span><span class=\"show-guide-link\">" + escapeHTML(ui.showcaseAction) + "</span></span>" +
      "</a>";
    return "<section class=\"showcase spot-page-showcase\" aria-labelledby=\"spotPageShowcaseTitle\"><div class=\"section-head\"><p class=\"eyebrow\">" + escapeHTML(ui.showcaseEyebrow) + "</p><h2 id=\"spotPageShowcaseTitle\">" + escapeHTML(ui.showcaseTitle) + "</h2></div><div class=\"showcase-rail\">" + cards + cta + "</div></section>";
  }

  var PAGE_UI = {
    ja: {
      eyebrow: "TOKAIDO SHINKANSEN WINDOW VIEW",
      live: "乗車中はライブガイドで見る",
      more: "もっと見る:",
      mapSummary: "位置の目安",
      mapNote: "スポット位置と、新幹線から見る位置を切り替えられます。",
      mapFallback: "この地点は簡易地図の座標調整中です。外部地図で位置を確認できます。",
      mapOpen: function (name) { return name + "をGoogle Mapsで開く"; },
      mapLink: "地図をひらく",
      mapSpot: "スポット",
      mapViewpoint: "新幹線視点",
      guideLead: "乗る列車が決まっているなら、列車選択で実際のダイヤに合わせた見える時刻を調べられます。",
      guideCta: "列車を選んで、見える時刻を調べる",
      stamp: "車窓スタンプ",
      related: "近くの車窓も見る",
      source: "出典：",
      original: "元投稿を見る",
      videoLabel: function (name) { return name + "の投稿動画"; },
      photoChoose: function (name) { return name + "の写真を選ぶ"; },
      photoSource: "元の投稿を見る",
      videoLoading: "投稿動画を読み込んでいます…",
      lightboxClose: "閉じる",
    },
    en: {
      eyebrow: "TOKAIDO SHINKANSEN WINDOW VIEW",
      live: "Use Live Guide while riding",
      more: "More:",
      mapSummary: "Location at a glance",
      mapNote: "Switch between the spot and the Shinkansen viewpoint.",
      mapFallback: "Inline coordinates are still being tuned for this spot. You can check the location in an external map.",
      mapOpen: function (name) { return "Open " + name + " in Google Maps"; },
      mapLink: "Open map",
      mapSpot: "Spot",
      mapViewpoint: "Train viewpoint",
      guideLead: "Know your train? Select it to see this view's estimated time on the actual timetable.",
      guideCta: "Select my train and check the time",
      stamp: "Window stamp",
      related: "Nearby window views",
      source: "Source: ",
      original: "View original post",
      videoLabel: function (name) { return name + " videos"; },
      photoChoose: function (name) { return "Choose a photo of " + name; },
      photoSource: "View original post",
      videoLoading: "Loading posted videos…",
      lightboxClose: "Close",
    }
  };

  function safeHttpUrl(value) {
    return typeof value === "string" && /^https?:\/\/[^\s<>"']+$/i.test(value);
  }

  function safeRelativeHref(value) {
    return typeof value === "string" && value && value.charAt(0) !== "/" && value.indexOf("\\") === -1 && !/^[a-z][a-z\d+.-]*:/i.test(value);
  }

  function validatePageData(page, currentId, lang) {
    if (!page || page.id !== currentId || page.lang !== lang || !page.name || !page.hero || !Array.isArray(page.photos) || !page.photos.length || !Array.isArray(page.gallery) || !page.gallery.length) throw new Error("shared page data is malformed");
    if (!safeAssetPath(page.stamp && page.stamp.src) || !safeAssetPath(page.hero.src) || !safeAssetPath(page.hero.thumb)) throw new Error("shared page asset path is malformed");
    ["gallery", "inline"].forEach(function (key) {
      (page[key] || []).forEach(function (photo) {
        if (!photo || !safeAssetPath(photo.src) || !safeAssetPath(photo.thumb) || (photo.sourceUrl && !safeHttpUrl(photo.sourceUrl))) throw new Error("shared page photo data is malformed");
      });
    });
    (page.bodyLinks || []).concat(page.references || []).forEach(function (item) {
      if (!item || !item.label || !safeHttpUrl(item.href)) throw new Error("shared page reference data is malformed");
    });
    if (page.fujiGuide && (!safeRelativeHref(page.fujiGuide.href) || !page.fujiGuide.label)) throw new Error("shared Fuji guide link is malformed");
    if (page.guide && !safeRelativeHref(page.guide.href)) throw new Error("shared timing guide link is malformed");
    if (page.guideNotice && !safeRelativeHref(page.guideNotice.href)) throw new Error("shared guide notice link is malformed");
    if (page.map) {
      ["externalUrl", "embedUrl", "viewpointUrl"].forEach(function (key) {
        if (page.map[key] && !safeHttpUrl(page.map[key])) throw new Error("shared map URL is malformed");
      });
    }
    if (page.referenceImage && (!safeAssetPath(page.referenceImage.src) || !safeAssetPath(page.referenceImage.thumb) || (page.referenceImage.sourceUrl && !safeHttpUrl(page.referenceImage.sourceUrl)))) throw new Error("shared reference image is malformed");
    if (page.media) {
      if (!Array.isArray(page.media.videos) || !page.media.videos.length) throw new Error("shared media list is malformed");
      page.media.videos.forEach(function (video) {
        if (!video || !["x", "youtube"].includes(video.kind) || !video.url || !video.accessibleTitle && video.kind === "x") throw new Error("shared video record is malformed");
        if (video.orientation && video.orientation !== "portrait") throw new Error("shared video orientation is malformed");
        if (video.kind === "x" && (!/^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+(?:\/video\/\d+)?$/.test(video.url) || (video.mediaUrl && !/^https:\/\/t\.co\/[A-Za-z0-9]+$/.test(video.mediaUrl)) || !/^@[A-Za-z0-9_]+$/.test(video.handle) || !video.fallbackText)) throw new Error("shared X video record is malformed");
        if (video.kind === "youtube" && (!/^[A-Za-z0-9_-]{11}$/.test(video.id) || !/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(video.url) || !video.title)) throw new Error("shared YouTube video record is malformed");
      });
    }
  }

  function pageCreditHTML(photo) {
    var credit = escapeHTML(photo.credit || "");
    return photo.sourceUrl ? "<a href=\"" + escapeHTML(photo.sourceUrl) + "\" rel=\"noopener\" target=\"_blank\">" + credit + "</a>" : credit;
  }

  function pageGalleryHTML(page, rootPath, lang) {
    var ui = PAGE_UI[lang];
    var items = page.gallery;
    var first = items[0];
    var heading = page.photoHeadingCustom && page.photoHeading ? "<h2 class=\"spot-page-media-gallery-heading\">" + escapeHTML(page.photoHeading) + "</h2>" : "";
    var thumbs = items.map(function (item, index) {
      var note = item.note || item.alt;
      return "<button type=\"button\" class=\"spot-photo-thumb" + (index === 0 ? " active" : "") + "\" data-gallery-thumb data-gallery-src=\"" + escapeHTML(href(rootPath, item.src)) + "\" data-gallery-alt=\"" + escapeHTML(item.alt) + "\" data-gallery-note=\"" + escapeHTML(note) + "\" data-gallery-credit=\"" + escapeHTML(item.credit || "") + "\" data-gallery-credit-href=\"" + escapeHTML(item.sourceUrl || "") + "\" data-gallery-date=\"" + escapeHTML(item.date || "") + "\" aria-label=\"" + escapeHTML(lang === "ja" ? note + "を表示" : "Show " + note) + "\" aria-pressed=\"" + (index === 0 ? "true" : "false") + "\"><img src=\"" + escapeHTML(href(rootPath, item.thumb)) + "\" alt=\"\" loading=\"" + (index === 0 ? "eager" : "lazy") + "\" decoding=\"async\"></button>";
    }).join("");
    var sourceLink = first.sourceUrl ? "<a data-gallery-source-output class=\"spot-page-gallery-source\" href=\"" + escapeHTML(first.sourceUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHTML(ui.photoSource) + "</a>" : "<a data-gallery-source-output class=\"spot-page-gallery-source\" hidden></a>";
    var imageLink = first.sourceUrl ? "<a data-gallery-image-link class=\"spot-page-gallery-image-link\" href=\"" + escapeHTML(first.sourceUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"" + escapeHTML(ui.photoSource) + "\">" : "<a data-gallery-image-link class=\"spot-page-gallery-image-link\" aria-hidden=\"true\" tabindex=\"-1\">";
    imageLink += "<img data-gallery-image src=\"" + escapeHTML(href(rootPath, first.src)) + "\" alt=\"" + escapeHTML(first.alt) + "\" decoding=\"async\" fetchpriority=\"high\"></a>";
    var caption = "<figcaption aria-live=\"polite\"><strong data-gallery-note-output>" + escapeHTML(first.note || first.alt) + "</strong><span data-gallery-credit-output>" + pageCreditHTML(first) + "</span><span data-gallery-date-output>" + escapeHTML(first.date || "") + "</span>" + sourceLink + "</figcaption>";
    return "<div class=\"spot-page-media-gallery" + (items.length === 1 ? " is-single" : "") + "\" data-spot-media-gallery>" + heading + "<div class=\"spot-photo-thumbs\" role=\"group\" aria-label=\"" + escapeHTML(ui.photoChoose(page.name)) + "\">" + thumbs + "</div><figure class=\"spot-page-figure spot-page-media-gallery-active\">" + imageLink + caption + "</figure></div>";
  }

  function pageFactsHTML(page, lang) {
    return "<dl class=\"spot-page-facts\"><div><dt>" + escapeHTML(page.facts.labels[0]) + "</dt><dd>" + escapeHTML(page.area) + "</dd></div><div><dt>" + escapeHTML(page.facts.labels[1]) + "</dt><dd>" + escapeHTML(page.sideLabel) + "</dd></div><div><dt>" + escapeHTML(page.facts.labels[2]) + "</dt><dd>" + escapeHTML(page.facts.timing) + "</dd></div><div><dt>" + escapeHTML(page.facts.labels[3]) + "</dt><dd>" + escapeHTML(page.photos.length + " " + page.facts.photoUnit) + "</dd></div></dl>";
  }

  function pageInlineFigureHTML(photo, rootPath, lang) {
    var ui = UI[lang];
    var note = photo.note || photo.alt;
    var credit = pageCreditHTML(photo);
    var date = photo.date ? "<span>" + escapeHTML(photo.date) + "</span>" : "";
    return "<figure class=\"spot-page-inline-figure\"><button type=\"button\" class=\"spot-page-inline-zoom\" data-zoom-src=\"" + escapeHTML(href(rootPath, photo.src)) + "\" aria-label=\"" + escapeHTML(note) + "を表示\"><img loading=\"lazy\" decoding=\"async\" src=\"" + escapeHTML(href(rootPath, photo.thumb)) + "\" alt=\"" + escapeHTML(photo.alt) + "\"></button><figcaption>" + (note ? "<strong>" + escapeHTML(note) + "</strong>" : "") + "<span>" + credit + "</span>" + date + "<span class=\"spot-page-zoom-hint\">" + escapeHTML(ui.zoomHint || (lang === "ja" ? "クリックで拡大" : "click to enlarge")) + "</span></figcaption></figure>";
  }

  function pageExplainerFigureHTML(figure, rootPath) {
    if (!figure) return "";
    var credit = figure.credit ? (figure.sourceUrl ? "<a href=\"" + escapeHTML(figure.sourceUrl) + "\" rel=\"noopener\" target=\"_blank\">" + escapeHTML(figure.credit) + "</a>" : escapeHTML(figure.credit)) : "";
    var caption = [figure.caption ? "<strong>" + escapeHTML(figure.caption) + "</strong>" : "", credit ? "<span>" + credit + "</span>" : "", figure.date ? "<span>" + escapeHTML(figure.date) + "</span>" : ""].filter(Boolean).join(" ");
    return "<figure class=\"spot-page-explainer-figure\"><img loading=\"lazy\" decoding=\"async\" src=\"" + escapeHTML(href(rootPath, figure.thumb)) + "\" alt=\"" + escapeHTML(figure.alt || "") + "\">" + (caption ? "<figcaption>" + caption + "</figcaption>" : "") + "</figure>";
  }

  function pageReferenceImageHTML(image, rootPath) {
    if (!image) return "";
    var credit = image.sourceUrl ? "<a href=\"" + escapeHTML(image.sourceUrl) + "\" rel=\"noopener\" target=\"_blank\">" + escapeHTML(image.credit || "") + "</a>" : escapeHTML(image.credit || "");
    var date = image.date ? "<span>" + escapeHTML(image.date) + "</span>" : "";
    var imageHref = image.sourceUrl || href(rootPath, image.src);
    return "<section class=\"spot-page-section spot-page-reference-section\"><h2>" + escapeHTML(image.heading || "") + "</h2><p>" + escapeHTML(image.intro || "") + "</p><figure class=\"spot-page-reference-figure\"><a href=\"" + escapeHTML(imageHref) + "\"" + (image.sourceUrl ? " rel=\"noopener\" target=\"_blank\"" : "") + "><img loading=\"lazy\" decoding=\"async\" src=\"" + escapeHTML(href(rootPath, image.thumb)) + "\" alt=\"" + escapeHTML(image.alt || "") + "\"></a><figcaption><strong>" + escapeHTML(image.caption || "") + "</strong><span>" + credit + "</span>" + date + "</figcaption></figure></section>";
  }

  function pageMapHTML(page, rootPath, lang) {
    var ui = PAGE_UI[lang];
    var map = page.map;
    if (!map || (!map.hasCoordinates && !map.externalUrl)) return "";
    var fallbackLink = map.externalUrl ? "<a class=\"map-link spot-mini-map-link\" href=\"" + escapeHTML(map.externalUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\" data-map=\"" + escapeHTML(page.id) + "\"><span class=\"map-link-icon\" aria-hidden=\"true\">↗</span><span>" + escapeHTML(ui.mapLink) + "</span></a>" : "";
    if (!map.hasCoordinates) return "<section class=\"spot-static-map\"><div class=\"spot-static-map-head\"><h2>" + escapeHTML(ui.mapSummary) + "</h2></div><div class=\"spot-mini-map-fallback\"><p>" + escapeHTML(ui.mapFallback) + "</p>" + fallbackLink + "</div></section>";
    var modebar = map.viewpointUrl ? "<div class=\"spot-map-modebar\" role=\"group\" aria-label=\"" + escapeHTML(ui.mapSummary) + "\"><button type=\"button\" class=\"spot-map-mode is-active\" data-mini-map-mode=\"spot\" data-map-src=\"" + escapeHTML(map.embedUrl) + "\" aria-pressed=\"true\">" + escapeHTML(ui.mapSpot) + "</button><button type=\"button\" class=\"spot-map-mode\" data-mini-map-mode=\"viewpoint\" data-map-src=\"" + escapeHTML(map.viewpointUrl) + "\" aria-pressed=\"false\">" + escapeHTML(ui.mapViewpoint) + "</button></div>" : "";
    return "<section class=\"spot-static-map\"><div class=\"spot-static-map-head\"><h2>" + escapeHTML(ui.mapSummary) + "</h2>" + fallbackLink + "</div>" + modebar + "<iframe class=\"spot-google-map-frame\" src=\"" + escapeHTML(map.embedUrl) + "\" title=\"" + escapeHTML(ui.mapOpen(map.name)) + "\" loading=\"lazy\" allowfullscreen referrerpolicy=\"no-referrer-when-downgrade\"></iframe><p class=\"spot-mini-map-note\">" + escapeHTML(ui.mapNote) + "</p></section>";
  }

  function pageGuideHTML(page, rootPath, lang) {
    var guide = page.guide;
    return "<section class=\"spot-page-section\"><h2>" + escapeHTML(guide.title) + "</h2><h3>" + escapeHTML(lang === "ja" ? "1. 先に見る方向を決める" : "1. Choose the window first") + "</h3><p>" + escapeHTML(guide.intro) + "</p><p>" + escapeHTML(guide.duration) + "</p><aside class=\"spot-page-timing-cta\"><p>" + escapeHTML(guide.timingLead) + "</p><a class=\"btn btn-primary\" href=\"" + escapeHTML(guide.href) + "\" data-cta-track=\"cta_train_search_click\" data-cta-id=\"spot_guide_timing\">" + escapeHTML(guide.cta) + "</a></aside><h3>" + escapeHTML(lang === "ja" ? "2. 見どころ" : "2. Highlights") + "</h3><p>" + escapeHTML(guide.highlight) + "</p></section>";
  }

  function pageMediaHTML(page, rootPath, lang) {
    if (!page.media) return "";
    var ui = PAGE_UI[lang];
    var hasX = page.media.videos.some(function (video) { return video.kind === "x"; });
    var cards = page.media.videos.map(function (video) {
      if (video.kind === "x") {
        var xText = escapeHTML(video.fallbackText).replace(/\n/g, "<br>");
        var sourceLabel = video.accountName ? video.accountName + "（" + video.handle + "）／" + ui.original : video.handle + " / " + ui.original;
        var frameClass = " spot-page-video-frame-x" + (video.orientation === "portrait" ? " is-portrait" : "");
        return "<article class=\"spot-page-video-card\" aria-label=\"" + escapeHTML(video.accessibleTitle) + "\"><div class=\"spot-page-video-frame" + frameClass + "\" data-video-platform=\"x\" data-video-loading-label=\"" + escapeHTML(ui.videoLoading) + "\"><blockquote class=\"twitter-tweet\" data-dnt=\"true\" data-media-max-width=\"560\"><p lang=\"" + escapeHTML(lang) + "\" dir=\"ltr\">" + xText + "</p>&mdash; " + escapeHTML(video.handle) + " <a href=\"" + escapeHTML(video.url) + "\">" + escapeHTML(ui.original) + "</a></blockquote></div><p class=\"spot-page-video-source\">" + escapeHTML(ui.source) + "<a href=\"" + escapeHTML(video.url) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHTML(sourceLabel) + "</a></p></article>";
      }
      return "<article class=\"spot-page-video-card\" aria-label=\"" + escapeHTML(video.title) + "\"><div class=\"spot-page-video-frame\"><iframe src=\"https://www.youtube-nocookie.com/embed/" + escapeHTML(video.id) + "\" title=\"" + escapeHTML(video.title) + "\" loading=\"lazy\" referrerpolicy=\"strict-origin-when-cross-origin\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen></iframe></div><p class=\"spot-page-video-source\">" + escapeHTML(ui.source) + "<a href=\"" + escapeHTML(video.url) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHTML(video.url) + "</a></p></article>";
    }).join("");
    return "<section class=\"spot-page-section spot-page-video-section\" data-video-loading-label=\"" + escapeHTML(ui.videoLoading) + "\" aria-labelledby=\"spotVideoTitle-" + escapeHTML(page.id) + "\"><h2 id=\"spotVideoTitle-" + escapeHTML(page.id) + "\">" + escapeHTML(page.media.heading) + "</h2><p>" + escapeHTML(page.media.description || "") + "</p><div class=\"spot-page-video-grid\" aria-label=\"" + escapeHTML(ui.videoLabel(page.name)) + "\">" + cards + "</div><p class=\"spot-page-video-platform-note\">" + escapeHTML(page.media.platformNote) + "</p></section>";
  }

  function pageLightboxHTML(lang) {
    return "<div class=\"spot-page-lightbox\" id=\"spotPageLightbox\" hidden><button type=\"button\" class=\"spot-page-lightbox-close\" aria-label=\"" + escapeHTML(PAGE_UI[lang].lightboxClose) + "\">&times;</button><figure><img alt=\"\"><figcaption></figcaption></figure></div>";
  }

  function collectionLinkHTML(rootPath, lang, count) {
    if (lang !== "ja") return "";
    return "<a class=\"spot-page-727-collection-link\" href=\"" + escapeHTML(href(rootPath, "727-collection.html")) + "\"><span><strong>727看板コレクション</strong><small>設置場所の全" + escapeHTML(count) + "地点を見る</small></span><b aria-hidden=\"true\">→</b></a>";
  }

  function pageHTML(data, rootPath, lang, currentId) {
    var page = data.pages[currentId][lang];
    var ui = PAGE_UI[lang];
    var embedded = !!root.MADO_EMBEDDED_WEB;
    var bodyLinks = page.bodyLinks && page.bodyLinks.length ? "<p class=\"spot-page-body-links\"><span>" + escapeHTML(ui.more) + "</span> " + page.bodyLinks.map(function (item, index) { return (index ? "<span aria-hidden=\"true\"> / </span>" : "") + "<a href=\"" + escapeHTML(item.href) + "\" rel=\"noopener\" target=\"_blank\">" + escapeHTML(item.label) + "</a>"; }).join("") + "</p>" : "";
    var fujiGuide = page.fujiGuide ? (function () { var text = escapeHTML(page.fujiGuide.text); return "<p>" + text.replace(escapeHTML(page.fujiGuide.label), "<a href=\"" + escapeHTML(page.fujiGuide.href) + "\">" + escapeHTML(page.fujiGuide.label) + "</a>") + "</p>"; }()) : "";
    var intro = "<section class=\"spot-page-section\"><h2>" + escapeHTML(page.sectionHeading) + "</h2><p>" + escapeHTML(page.story) + "</p>" + bodyLinks + "<p>" + escapeHTML(page.routeNote) + "</p>" + fujiGuide + "<p><a href=\"" + escapeHTML(lang === "ja" ? href(rootPath, "live/") : href(rootPath, "en/live/")) + "\">" + escapeHTML(ui.live) + "</a></p></section>";
    var inline = (page.inline || []).map(function (photo) { return pageInlineFigureHTML(photo, rootPath, lang); }).join("");
    var explainer = page.explainer ? "<section class=\"spot-page-section\"><h2>" + escapeHTML(page.explainer.heading) + "</h2>" + page.explainer.paragraphs.map(function (paragraph, index) { var result = "<p>" + escapeHTML(paragraph) + "</p>"; if (page.explainer.figure && index === Math.min(page.explainer.paragraphs.length - 1, Math.max(0, page.explainer.figure.afterParagraph))) result += pageExplainerFigureHTML(page.explainer.figure, rootPath); return result; }).join("") + "</section>" : "";
    var guideNotice = page.guideNotice ? "<section class=\"spot-page-section guide-answer-panel\"><div class=\"guide-answer-copy\"><h2>" + escapeHTML(page.guideNotice.heading) + "</h2><p>" + escapeHTML(page.guideNotice.body) + "</p><p><a class=\"inline-cta\" href=\"" + escapeHTML(page.guideNotice.href) + "\">" + escapeHTML(page.guideNotice.label) + "</a></p></div></section>" : "";
    var sharedGuide = (page.sharedGuide || []).map(function (chapter) { return "<section class=\"spot-page-section\" id=\"" + escapeHTML(chapter.id) + "\"><h2>" + escapeHTML(chapter.heading) + "</h2><p><strong>" + escapeHTML(chapter.hook) + "</strong></p>" + chapter.paragraphs.map(function (paragraph) { return "<p>" + escapeHTML(paragraph) + "</p>"; }).join("") + "</section>"; }).join("");
    var stampHref = lang === "ja" ? href(rootPath, "journal.html#stampboard") : href(rootPath, "en/journal.html#stampboard");
    var stamp = "<a class=\"spot-page-stamp\" href=\"" + escapeHTML(stampHref) + "\" aria-label=\"" + escapeHTML(page.stamp.alt) + "\"><img src=\"" + escapeHTML(href(rootPath, page.stamp.src)) + "\" alt=\"\"><span>" + escapeHTML(ui.stamp) + "</span></a>";
    var showcase = embedded ? "" : showcaseHTML(data, rootPath, lang);
    var rail = embedded ? "" : railHTML(data, rootPath, lang, currentId);
    var mobilePromos = embedded ? "" : mobilePromosHTML(rootPath, lang, "", collection727Count(data));
    // topbar nav and the bottom content rail are baked as static HTML by the
    // generator (see generate-spot-pages.mjs thinSpotPageHTML). Rendering them
    // again here would duplicate the nav/content-rail on screen, so this
    // renderer no longer produces them for spot pages.
    return "<main><header class=\"spot-page-article spot-page-hero\"><p class=\"eyebrow\">" + escapeHTML(ui.eyebrow) + "</p><div class=\"spot-page-heading-row\"><h1>" + (page.headingChunks.length ? page.headingChunks.map(function (chunk) { return "<span class=\"copy-chunk\">" + escapeHTML(chunk) + "</span>"; }).join(lang === "en" ? " " : "") : escapeHTML(page.heading)) + "</h1>" + stamp + "</div><p class=\"spot-page-lead\">" + escapeHTML(page.hook) + "</p></header><div class=\"spot-page-shell" + (embedded ? " mado-embedded-shell" : "") + "\">" + rail + "<article class=\"spot-page-article\">" + pageGalleryHTML(page, rootPath, lang) + pageFactsHTML(page, lang) + (page.photoTip ? "<section class=\"spot-page-section spot-page-phototip\"><h2>" + escapeHTML(page.photoTip.heading) + "</h2>" + page.photoTip.paragraphs.map(function (paragraph) { return "<p>" + escapeHTML(paragraph) + "</p>"; }).join("") + "</section>" : "") + guideNotice + intro + ((currentId === "727-board" || currentId === "putiputi-sign") ? collectionLinkHTML(rootPath, lang, collection727Count(data)) : "") + inline + explainer + pageReferenceImageHTML(page.referenceImage, rootPath) + sharedGuide + pageMapHTML(page, rootPath, lang) + pageGuideHTML(page, rootPath, lang) + pageMediaHTML(page, rootPath, lang) + "<section class=\"spot-page-section spot-page-refs\"><h2>" + escapeHTML(UI[lang].sectionRefs || (lang === "ja" ? "参考リンク" : "References")) + "</h2><ul>" + (page.references || []).map(function (item) { return "<li><a href=\"" + escapeHTML(item.href) + "\" rel=\"noopener\" target=\"_blank\">" + escapeHTML(item.label) + "</a></li>"; }).join("") + "</ul></section></article></div>" + mobilePromos + showcase + "</main>" + pageLightboxHTML(lang);
  }

  function bindPageLightbox() {
    var box = document.getElementById("spotPageLightbox");
    if (!box || box.__madoBound) return;
    box.__madoBound = true;
    var image = box.querySelector("img");
    var caption = box.querySelector("figcaption");
    function close() { box.hidden = true; image.src = ""; document.documentElement.style.overflow = ""; }
    box.addEventListener("click", function (event) { if (event.target === box || event.target.classList.contains("spot-page-lightbox-close")) close(); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !box.hidden) close(); });
    document.querySelectorAll(".spot-page-inline-zoom").forEach(function (button) {
      button.addEventListener("click", function () {
        var thumb = button.querySelector("img");
        var figureCaption = button.parentElement.querySelector("figcaption");
        image.src = button.getAttribute("data-zoom-src") || (thumb && thumb.getAttribute("src")) || "";
        caption.textContent = figureCaption ? figureCaption.textContent.replace(/\s+/g, " ").replace(/(?:クリックで拡大|click to enlarge)\s*$/, "").trim() : "";
        box.hidden = false;
        document.documentElement.style.overflow = "hidden";
      });
    });
  }

  function ensureXWidgetsScript(page) {
    if (!page.media || !page.media.videos.some(function (video) { return video.kind === "x"; }) || root.__MADO_X_WIDGETS_LOADED) return;
    var sections = typeof document.querySelectorAll === "function" ? document.querySelectorAll(".spot-page-video-section") : [];
    var section = sections && sections[0];
    var reveal = function () {
      if (section && section.classList && typeof section.classList.remove === "function") section.classList.remove("is-video-pending");
      if (section && typeof section.setAttribute === "function") section.setAttribute("aria-busy", "false");
    };
    var load = function () {
      if (root.__MADO_X_WIDGETS_LOADED) {
        reveal();
        return;
      }
      root.__MADO_X_WIDGETS_LOADED = true;
      var script = document.createElement("script");
      script.async = true;
      script.src = "https://platform.twitter.com/widgets.js";
      script.charset = "utf-8";
      script.onload = function () {
        var widgets = root.twttr && root.twttr.widgets;
        if (widgets && typeof widgets.load === "function") widgets.load(section || document.body);
        reveal();
      };
      script.onerror = reveal;
      document.head.appendChild(script);
    };
    if (!section || typeof root.IntersectionObserver !== "function") {
      load();
      return;
    }
    if (section.classList && typeof section.classList.add === "function") section.classList.add("is-video-pending");
    if (typeof section.setAttribute === "function") section.setAttribute("aria-busy", "true");
    var observer = new root.IntersectionObserver(function (entries) {
      for (var index = 0; index < entries.length; index += 1) {
        if (entries[index].isIntersecting || entries[index].intersectionRatio > 0) {
          observer.disconnect();
          load();
          break;
        }
      }
    }, { rootMargin: "640px 0px" });
    observer.observe(section);
  }

  function findHost(name) {
    var hosts = document.querySelectorAll("[" + HOST_ATTRIBUTE + '=\"' + name + "\"]");
    if (hosts.length !== 1) throw new Error(name + " host count is " + hosts.length);
    return hosts[0];
  }

  function findOptionalHost(name) {
    var hosts = document.querySelectorAll("[" + HOST_ATTRIBUTE + "=\"" + name + "\"]");
    if (hosts.length > 1) throw new Error(name + " host count is " + hosts.length);
    return hosts.length ? hosts[0] : null;
  }

  function fail(hosts, error) {
    var message = "車窓案内を読み込めませんでした。";
    if (root.console && typeof root.console.error === "function") root.console.error("[spot-page-shared] " + (error && error.message ? error.message : error));
    hosts.forEach(function (host) {
      if (!host) return;
      host.className = "spot-page-shared-error";
      host.setAttribute("role", "alert");
      host.textContent = message;
    });
  }

  function render() {
    var hosts = [];
    try {
      if (!document.body || !document.body.classList.contains("spot-page")) throw new Error("spot-page body context is required");
      if (root.MADO_EMBEDDED_WEB) document.body.classList.add("mado-embedded-body");
      var pageHost = findOptionalHost("page");
      if (pageHost) {
        hosts = [pageHost];
        if (document.querySelectorAll("[" + HOST_ATTRIBUTE + "]").length !== 1) throw new Error("thin spot page must have exactly one shared host");
        var pageLang = document.body.getAttribute("data-spot-page-shared-lang") || "";
        var pageId = document.body.getAttribute("data-spot-page-shared-id") || "";
        var pageRoot = normalizeRoot(document.body.getAttribute("data-spot-page-shared-root"));
        if (!SUPPORTED_LANGUAGES[pageLang] || !safeSpotId(pageId)) throw new Error("language or current spot context is malformed");
        var pageData = root[DATA_KEY];
        validateData(pageData, pageId, pageLang);
        validatePageData(pageData.pages[pageId][pageLang], pageId, pageLang);
        pageHost.outerHTML = pageHTML(pageData, pageRoot, pageLang, pageId);
        if (root.MADO_EMBEDDED_WEB) {
          var staticHosts = document.querySelectorAll("[data-spot-page-shared-static]");
          for (var staticIndex = 0; staticIndex < staticHosts.length; staticIndex += 1) {
            var staticEl = staticHosts[staticIndex];
            if (staticEl && staticEl.parentNode) staticEl.parentNode.removeChild(staticEl);
          }
        }
        bindPageLightbox();
        ensureXWidgetsScript(pageData.pages[pageId][pageLang]);
        return;
      }
      if (document.body.getAttribute("data-spot-page-shared-context") === "utility") {
        hosts = [findHost("topbar"), findHost("rail"), findHost("content-rail")];
        var mobilePromosHost = findOptionalHost("mobile-promos");
        if (mobilePromosHost) hosts.push(mobilePromosHost);
        var utilityShowcaseHost = findOptionalHost("showcase");
        if (utilityShowcaseHost) hosts.push(utilityShowcaseHost);
        var utilityLang = document.body.getAttribute("data-spot-page-shared-lang") || "";
        var utilityRoot = normalizeRoot(document.body.getAttribute("data-spot-page-shared-root"));
        var utilityRoute = document.body.getAttribute("data-spot-page-shared-route") || "";
        if (!SUPPORTED_LANGUAGES[utilityLang] || !UTILITY_ROUTES[utilityRoute]) throw new Error("utility page context is malformed");
        var utilityData = root[DATA_KEY];
        validateData(utilityData, utilityData && utilityData.spots && utilityData.spots[0] && utilityData.spots[0].id, utilityLang);
        if (root.MADO_EMBEDDED_WEB) {
          hosts.forEach(function (host) { if (host && host.parentNode) host.parentNode.removeChild(host); });
          document.body.classList.add("mado-embedded-body");
          return;
        }
        hosts[0].outerHTML = siteHeaderHTML(utilityRoot, utilityLang, "", utilityRoute, UTILITY_ROUTES[utilityRoute].en);
        hosts[1].outerHTML = railHTML(utilityData, utilityRoot, utilityLang, "", basePath(utilityRoot, utilityLang) + "spots/", utilityRoute);
        hosts[2].outerHTML = contentRailHTML(utilityRoot, utilityLang);
        if (mobilePromosHost) mobilePromosHost.outerHTML = mobilePromosHTML(utilityRoot, utilityLang, utilityRoute, collection727Count(utilityData));
        if (utilityShowcaseHost) utilityShowcaseHost.outerHTML = showcaseHTML(utilityData, utilityRoot, utilityLang);
        return;
      }
      hosts = [findHost("topbar"), findHost("rail"), findHost("content-rail")];
      var showcaseHost = findOptionalHost("showcase");
      if (showcaseHost) hosts.push(showcaseHost);
      var isNativeApp = !!(root.Capacitor && ((typeof root.Capacitor.isNativePlatform === "function" && root.Capacitor.isNativePlatform()) || (typeof root.Capacitor.getPlatform === "function" && root.Capacitor.getPlatform() !== "web")));
      if (isNativeApp) document.documentElement.className += " is-native-app";
      var lang = document.body.getAttribute("data-spot-page-shared-lang") || "";
      var currentId = document.body.getAttribute("data-spot-page-shared-id") || "";
      var rootPath = normalizeRoot(document.body.getAttribute("data-spot-page-shared-root"));
      if (!SUPPORTED_LANGUAGES[lang] || !safeSpotId(currentId)) throw new Error("language or current spot context is malformed");
      var data = root[DATA_KEY];
      validateData(data, currentId, lang);
      hosts[0].outerHTML = siteHeaderHTML(rootPath, lang, currentId);
      hosts[1].outerHTML = railHTML(data, rootPath, lang, currentId);
      hosts[2].outerHTML = contentRailHTML(rootPath, lang);
      if (showcaseHost) showcaseHost.outerHTML = showcaseHTML(data, rootPath, lang);
    } catch (error) {
      fail(hosts, error);
    }
  }

  render();
}(typeof window !== "undefined" ? window : globalThis));
