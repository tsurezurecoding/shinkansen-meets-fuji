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
      forecast: "見える予報β",
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
      railStationSuffix: "分",
      contentEyebrow: "MORE TO TRY",
      contentTitle: "車窓をもっと楽しむ",
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
      railStationSuffix: " min",
      contentEyebrow: "MORE TO TRY",
      contentTitle: "More ways to enjoy the window",
      mobileAffiliate: "AFFILIATE LINKS",
      mobileAffiliateNote: "Michikusa may earn a commission at no extra cost to you.",
      sideA: "Seat A · sea side",
      sideE: "Seat E · mountain side",
      sideBoth: "Both sides",
      hamanakoSide: "Seat A · sea side / Seat E · mountain side",
      languageJa: "日本語",
      languageEn: "EN"
    }
  };

  var CONTENT_ITEMS = {
    ja: [
      { label: "FAQ", title: "富士山FAQ", desc: "見える時刻、座席側、曇りの日の答えを確認。", href: "guide.html", img: "images/thumbs/content-faq.webp" },
      { label: "FORECAST", title: "見える予報β", desc: "今日の空で富士山が見えそうかを確認。", href: "mieru.html", img: "images/thumbs/content-mieru.webp" },
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
    if (!data || data.version !== 1 || !Array.isArray(data.stations) || !data.stations.length || !Array.isArray(data.spots) || !data.spots.length) {
      throw new Error("shared data is missing its version, stations, or spots");
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
    if (!spotIds[currentId]) throw new Error("current spot is not in shared data");
  }

  function href(rootPath, relativePath) {
    return rootPath + relativePath;
  }

  function basePath(rootPath, lang) {
    return lang === "en" ? rootPath + "en/" : rootPath;
  }

  function siteHeaderHTML(rootPath, lang, currentId) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    var homeHref = lang === "en" ? href(base, "") : href(base, "index.html");
    var trainHref = lang === "en" ? href(base, "#journey") : href(base, "index.html#journey");
    var jaHref = lang === "ja" ? currentId + ".html" : href(rootPath, "spots/" + currentId + ".html") + "?lang=ja";
    var enHref = lang === "en" ? currentId + ".html" : href(rootPath, "en/spots/" + currentId + ".html");
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
      "<div class=\"lang-switch\" role=\"group\" aria-label=\"" + escapeHTML(ui.language) + "\">" +
        "<a class=\"" + jaClass + "\" href=\"" + escapeHTML(jaHref) + "\">" + escapeHTML(ui.languageJa) + "</a>" +
        "<a class=\"" + enClass + "\" href=\"" + escapeHTML(enHref) + "\">" + escapeHTML(ui.languageEn) + "</a>" +
      "</div>" +
    "</header>";
  }

  function railAffiliateHTML(rootPath, lang) {
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

  function railHTML(data, rootPath, lang, currentId) {
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
      return "<li class=\"spot-page-rail-row spot-page-rail-spot" + (isCurrent ? " is-current" : "") + "\"><a class=\"spot-page-rail-link\" href=\"" + escapeHTML(row.id + ".html") + "\"" + (isCurrent ? " aria-current=\"page\"" : "") + ">" + thumbnail + "<span class=\"spot-page-rail-min\">" + escapeHTML(row.minutes) + "</span><span class=\"spot-page-rail-name\">" + escapeHTML(row.name) + "</span>" + seats + "</a></li>";
    }).join("");
    var current = data.spots.filter(function (spot) { return spot.id === currentId; })[0];
    var now = current ? ui.railNow(escapeHTML(localized(current.name, lang)), escapeHTML(Number(current.minutes)), escapeHTML(sideLabel(current, lang))) : "";
    return "<aside class=\"spot-page-rail\" aria-label=\"" + escapeHTML(ui.railTitle) + "\"><div class=\"spot-page-rail-head\"><p class=\"spot-page-rail-eyebrow\">" + escapeHTML(ui.railEyebrow) + "</p><p class=\"spot-page-rail-title\">" + escapeHTML(ui.railTitle) + "</p><p class=\"spot-page-rail-count\"><strong>" + escapeHTML(data.spots.length) + "</strong>" + escapeHTML(ui.railCountSuffix) + "</p>" + (now ? "<p class=\"spot-page-rail-now\">" + now + "</p>" : "") + "<a class=\"spot-page-rail-cta\" href=\"" + escapeHTML(trainHref) + "\">" + escapeHTML(ui.railCta) + "</a></div><div class=\"spot-page-rail-list-wrap\"><ol class=\"spot-page-rail-list\">" + items + "</ol></div><div class=\"spot-page-rail-foot\"><a href=\"" + escapeHTML(href(base, "zukan.html")) + "\">" + escapeHTML(ui.railFoot) + "</a></div>" + railAffiliateHTML(rootPath, lang) + "</aside>";
  }

  function contentRailHTML(rootPath, lang) {
    var ui = UI[lang];
    var base = basePath(rootPath, lang);
    var cards = CONTENT_ITEMS[lang].map(function (item) {
      return "<a class=\"content-rail-card\" href=\"" + escapeHTML(href(base, item.href)) + "\"><img src=\"" + escapeHTML(href(rootPath, item.img)) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\"><span class=\"content-rail-card-body\"><small>" + escapeHTML(item.label) + "</small><strong>" + escapeHTML(item.title) + "</strong><span>" + escapeHTML(item.desc) + "</span></span></a>";
    }).join("");
    return "<section class=\"content-rail-section\" aria-labelledby=\"contentRailTitle\"><div class=\"section-head\"><p class=\"eyebrow\">" + escapeHTML(ui.contentEyebrow) + "</p><h2 id=\"contentRailTitle\">" + escapeHTML(ui.contentTitle) + "</h2></div><div class=\"content-rail\">" + cards + "</div></section>";
  }

  function findHost(name) {
    var hosts = document.querySelectorAll("[" + HOST_ATTRIBUTE + '=\"' + name + "\"]");
    if (hosts.length !== 1) throw new Error(name + " host count is " + hosts.length);
    return hosts[0];
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
      hosts = [findHost("topbar"), findHost("rail"), findHost("content-rail")];
      var lang = document.body.getAttribute("data-spot-page-shared-lang") || "";
      var currentId = document.body.getAttribute("data-spot-page-shared-id") || "";
      var rootPath = normalizeRoot(document.body.getAttribute("data-spot-page-shared-root"));
      if (!SUPPORTED_LANGUAGES[lang] || !safeSpotId(currentId)) throw new Error("language or current spot context is malformed");
      var data = root[DATA_KEY];
      validateData(data, currentId, lang);
      hosts[0].outerHTML = siteHeaderHTML(rootPath, lang, currentId);
      hosts[1].outerHTML = railHTML(data, rootPath, lang, currentId);
      hosts[2].outerHTML = contentRailHTML(rootPath, lang);
    } catch (error) {
      fail(hosts, error);
    }
  }

  render();
}(typeof window !== "undefined" ? window : globalThis));
