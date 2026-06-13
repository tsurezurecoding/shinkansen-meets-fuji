const langMessages = {
  ja: {
    pageTitle: "東海道新幹線の車窓図鑑 | Shinkansen Meets Fuji",
    metaDescription: "東海道新幹線の車窓から見える富士山、城、湖、茶畑、道草ビューを写真で紹介。乗る列車で見どころ時刻を調べるアプリへつながる車窓ガイド。",
    navApp: "列車で探す",
    heroKicker: "Tokaido Shinkansen window guide",
    heroTitle: "窓の外に、旅がもうひとつある。",
    heroLead: "富士山、掛川城、浜名湖、左富士、日向岡住宅。東海道新幹線の数分を、発見の時間に変える車窓図鑑。",
    heroClassic: "定番ビューを見る",
    heroHidden: "道草ビューを見る",
    openingKicker: "First impression",
    openingTitle: "写真にたどり着く前に、離脱させない。",
    openingBody: "このページは、アプリの説明ではなく車窓の編集ページです。まず写真で惹きつけ、定番ビューと道草ビューを分けて見せ、最後に「自分の列車ではいつ見えるか」へつなげます。",
    statViews: "掲載候補",
    statHidden: "道草ビュー",
    statSeats: "席側の目安",
    indexKicker: "Choose your mood",
    indexTitle: "定番と道草、どちらから見る？",
    classicLabel: "定番コンテンツ",
    classicTitle: "誰でも見たい、旅の主役。",
    classicBody: "富士山、浜名湖、伊吹山、東寺。写真で伝わりやすく、初めての乗客にも価値がすぐ分かる車窓。",
    hiddenLabel: "道草コンテンツ",
    hiddenTitle: "知っていると、窓を見たくなる。",
    hiddenBody: "掛川城、左富士、日向岡住宅、清須城、米原のトトロ。新幹線に何度も乗る人ほど面白い発見。",
    classicKicker: "Classic views",
    classicHeading: "定番コンテンツ",
    classicLead: "最初のLPでは、写真で一瞬で伝わるものを前に出す。富士山だけではなく、湖、山、寺、城まで見せる。",
    hiddenKicker: "Michikusa views",
    hiddenHeading: "道草コンテンツ",
    hiddenLead: "本に載っているネタをなぞらない。会長写真、公開素材、実地確認を重ね、独自の車窓ガイドとして育てる。",
    routeKicker: "Window route",
    routeTitle: "東京から新大阪へ、景色は順番に現れる。",
    collabKicker: "For future collaboration",
    collabTitle: "書籍と競合せず、書籍を列車時刻へ接続する。",
    collabBody: "著者の表現や写真を無断で使わない。こちらは、独自に確認した車窓とアプリの時刻機能を組み合わせ、将来的には監修・写真許諾・おすすめコースとして正式に相談する。",
    collabCta: "自分の列車で見どころを探す",
    classicTag: "定番ビュー",
    hiddenTag: "道草ビュー",
    photoNeeded: "会長写真で精度更新予定",
  },
  en: {
    pageTitle: "Tokaido Shinkansen Window View Guide | Shinkansen Meets Fuji",
    metaDescription: "A photo-first guide to classic views and hidden gems from the Tokaido Shinkansen, connected to an app that shows when to look from your train.",
    navApp: "Find by train",
    heroKicker: "Tokaido Shinkansen window guide",
    heroTitle: "There is another journey outside the window.",
    heroLead: "Mt. Fuji, Kakegawa Castle, Lake Hamana, left-side Fuji, and Hinataoka homes. A photo-first guide to turn a few Shinkansen minutes into discoveries.",
    heroClassic: "See classic views",
    heroHidden: "See hidden gems",
    openingKicker: "First impression",
    openingTitle: "Show the photos before people leave.",
    openingBody: "This is not an app manual. It is an editorial window-view page: lead with images, split classic views from hidden gems, then send people to check when those views appear on their own train.",
    statViews: "view candidates",
    statHidden: "hidden gems",
    statSeats: "seat-side hints",
    indexKicker: "Choose your mood",
    indexTitle: "Classic views or hidden gems?",
    classicLabel: "Classic content",
    classicTitle: "The views everyone hopes to see.",
    classicBody: "Mt. Fuji, Lake Hamana, Mt. Ibuki, To-ji. These are visually clear and easy for first-time riders to understand.",
    hiddenLabel: "Michikusa content",
    hiddenTitle: "The views that make you look twice.",
    hiddenBody: "Kakegawa Castle, left-side Fuji, Hinataoka homes, Kiyosu Castle, and Maibara Totoro. The more you ride, the more fun these become.",
    classicKicker: "Classic views",
    classicHeading: "Classic content",
    classicLead: "The first landing page should put instantly understandable photos first: not only Fuji, but lakes, mountains, temples, and castles.",
    hiddenKicker: "Michikusa views",
    hiddenHeading: "Michikusa content",
    hiddenLead: "We do not copy book content. We build an original guide from owner photos, public materials, and field verification.",
    routeKicker: "Window route",
    routeTitle: "From Tokyo to Shin-Osaka, the views appear in order.",
    collabKicker: "For future collaboration",
    collabTitle: "Do not compete with books. Connect books to train time.",
    collabBody: "We will not reuse an author's wording or photos without permission. Our value is combining independently verified window views with train-specific timing, then approaching authors for supervision, photo permission, or recommended routes.",
    collabCta: "Find views for your train",
    classicTag: "Classic view",
    hiddenTag: "Hidden gem",
    photoNeeded: "Owner photo planned",
  },
};

const viewData = [
  {
    id: "fuji",
    type: "classic",
    large: true,
    image: "images/20240211_Mt.Fuji.jpg",
    ja: { title: "富士山", body: "三島〜新富士の主役。見える時間は短いから、列車ごとの目安時刻が価値になる。", area: "三島〜新富士 / E席側" },
    en: { title: "Mt. Fuji", body: "The signature view around Mishima to Shin-Fuji. The window is short, so train-specific timing matters.", area: "Mishima to Shin-Fuji / Seat E" },
  },
  {
    id: "hamanako",
    type: "classic",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lake_Hamana.JPG?width=900",
    ja: { title: "浜名湖", body: "浜松〜豊橋で水面が開ける。晴れた日は光の反射で車窓の空気が変わる。", area: "浜松〜豊橋 / A席側" },
    en: { title: "Lake Hamana", body: "Between Hamamatsu and Toyohashi, the water opens wide and changes the mood of the ride.", area: "Hamamatsu to Toyohashi / Seat A" },
  },
  {
    id: "ibuki",
    type: "classic",
    image: "images/20240114_ibukiyama.png",
    ja: { title: "伊吹山", body: "関ヶ原を越えるあたりで見える山の存在感。冬の雪化粧は強い。", area: "岐阜羽島〜米原 / E席側" },
    en: { title: "Mt. Ibuki", body: "A strong mountain view around the Sekigahara area, especially memorable in winter.", area: "Gifu-Hashima to Maibara / Seat E" },
  },
  {
    id: "toji",
    type: "classic",
    image: "images/20260510_toji.png",
    ja: { title: "東寺 五重塔", body: "京都駅の前後で一瞬見える、京都らしさの象徴。", area: "京都駅前後 / A席側" },
    en: { title: "To-ji Pagoda", body: "A brief Kyoto landmark around Kyoto Station.", area: "Around Kyoto / Seat A" },
  },
  {
    id: "kakegawa",
    type: "hidden",
    large: true,
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Kakegawa_Castle_from_Tokaido_Shinkansen_window_view.jpg?width=900",
    ja: { title: "掛川城", body: "掛川駅の前後で探したい、静岡区間の小さな歴史ランドマーク。", area: "掛川駅前後 / E席側仮説" },
    en: { title: "Kakegawa Castle", body: "A small historical landmark to watch for around Kakegawa Station.", area: "Around Kakegawa / Seat E hypothesis" },
  },
  {
    id: "left-fuji",
    type: "hidden",
    ja: { title: "左富士", body: "A席側から一瞬だけ富士山が見えることがある。見えたら嬉しい、短い発見。", area: "新富士〜静岡 / A席側" },
    en: { title: "Left-side Fuji", body: "A brief chance to see Fuji from Seat A. A lucky, blink-and-you-miss-it discovery.", area: "Shin-Fuji to Shizuoka / Seat A" },
  },
  {
    id: "hinataoka",
    type: "hidden",
    ja: { title: "日向岡住宅", body: "丘の斜面に整然と並ぶ住宅地。名所ではないが、車窓を知っている人には忘れにくい。", area: "新横浜〜小田原 / E席側仮説" },
    en: { title: "Hinataoka homes", body: "A planned hillside neighborhood that becomes memorable once you know to look for it.", area: "Shin-Yokohama to Odawara / Seat E hypothesis" },
  },
  {
    id: "kiyosu",
    type: "hidden",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Kiyosu%20Castle%20view%20from%20T%C5%8Dkaid%C5%8D%20Shinkansen.jpg?width=900",
    ja: { title: "清須城", body: "名古屋を出てすぐ、歴史の文脈が一瞬だけ車窓に入る。", area: "名古屋〜岐阜羽島 / E席側" },
    en: { title: "Kiyosu Castle", body: "Just outside Nagoya, a quick historical layer appears near the line.", area: "Nagoya to Gifu-Hashima / Seat E" },
  },
];

const routeData = {
  ja: [
    ["新横浜〜小田原", "日向岡住宅、小田原城、相模湾"],
    ["三島〜新富士", "富士山"],
    ["新富士〜静岡", "左富士、茶畑"],
    ["掛川駅前後", "掛川城"],
    ["浜松〜豊橋", "浜名湖"],
    ["名古屋〜米原", "清須城、伊吹山、米原のトトロ"],
    ["京都駅前後", "東寺 五重塔"],
  ],
  en: [
    ["Shin-Yokohama to Odawara", "Hinataoka homes, Odawara Castle, Sagami Bay"],
    ["Mishima to Shin-Fuji", "Mt. Fuji"],
    ["Shin-Fuji to Shizuoka", "Left-side Fuji, tea fields"],
    ["Around Kakegawa", "Kakegawa Castle"],
    ["Hamamatsu to Toyohashi", "Lake Hamana"],
    ["Nagoya to Maibara", "Kiyosu Castle, Mt. Ibuki, Maibara Totoro"],
    ["Around Kyoto", "To-ji Pagoda"],
  ],
};

const params = new URLSearchParams(window.location.search);
let currentLang = normalizeLang(params.get("lang") || safeStorageGet("smf-lp-lang") || navigator.language);

function normalizeLang(value) {
  return String(value || "").toLowerCase().startsWith("ja") ? "ja" : "en";
}

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // file:// previews may not allow storage; language still updates in the DOM.
  }
}

function t(key) {
  return langMessages[currentLang][key] || langMessages.ja[key] || key;
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.title = t("pageTitle");
  const description = document.querySelector("meta[name='description']");
  if (description) {
    description.content = t("metaDescription");
  }
  document.querySelectorAll("a[href='index.html']").forEach((link) => {
    link.href = `index.html?lang=${currentLang}`;
  });
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    button.classList.toggle("active", button.dataset.langOption === currentLang);
  });
  renderGallery();
  renderRoute();
}

function bindLanguageSwitch() {
  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    button.addEventListener("click", () => {
      currentLang = button.dataset.langOption;
      safeStorageSet("smf-lp-lang", currentLang);
      applyLanguage();
    });
  });
}

function renderGallery() {
  renderCards("classic-gallery", "classic");
  renderCards("hidden-gallery", "hidden");
}

function renderCards(containerId, type) {
  const container = document.querySelector(`#${containerId}`);
  if (!container) {
    return;
  }
  container.innerHTML = viewData
    .filter((item) => item.type === type)
    .map((item) => createCard(item))
    .join("");
}

function createCard(item) {
  const text = item[currentLang];
  const tag = item.type === "classic" ? t("classicTag") : t("hiddenTag");
  const image = item.image
    ? `<img src="${item.image}" alt="${text.title}">`
    : "";
  return `
    <article class="photo-card ${item.large ? "large" : ""} ${item.image ? "" : "no-photo"}" id="${item.id}">
      ${image}
      <div class="photo-card-body">
        <span class="tag ${item.type}">${tag}</span>
        <h3>${text.title}</h3>
        <p>${text.body}</p>
        <span class="meta">${text.area}${item.image ? "" : ` / ${t("photoNeeded")}`}</span>
      </div>
    </article>
  `;
}

function renderRoute() {
  const route = document.querySelector("#route-line");
  if (!route) {
    return;
  }
  route.innerHTML = routeData[currentLang]
    .map(([area, views]) => `<li><span>${area}</span><strong>${views}</strong></li>`)
    .join("");
}

bindLanguageSwitch();
applyLanguage();
