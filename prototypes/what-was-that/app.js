"use strict";

const mysteries = [
  {
    id: "tire-park",
    category: "local",
    route: "JR京浜東北線",
    question: "車窓から見える、タイヤだらけの公園は何？",
    answer: "大田区の西六郷公園。古タイヤを使った遊具が並び、「タイヤ公園」として親しまれています。",
    location: "川崎〜蒲田付近。線路の西側に見えます。車窓条件は今後、実車で確かめます。",
    why: "遊具もモニュメントも黒いタイヤでできていて、住宅街の中に突然あらわれるから。",
    statuses: ["正体確認済み", "車窓情報確認済み", "実車確認待ち"],
    pending: true,
    symbol: "○",
    color: "#cfd8d2"
  },
  {
    id: "727-board",
    category: "shinkansen",
    route: "東海道新幹線",
    question: "田んぼに並ぶ「727」と「248」、何の数字？",
    answer: "727は美容室向け化粧品メーカー、セブンツーセブン。248は西八王子のきぬた歯科。どちらも沿線に立つ広告看板です。",
    location: "新横浜〜小田原の藤沢市付近をはじめ、東海道新幹線の沿線に複数あります。",
    why: "会社名も商品名もほとんど読めず、数字だけが田んぼに並ぶから。727は旅の途中で何度も現れます。",
    statuses: ["正体確認済み", "車窓情報確認済み", "実車確認済み"],
    image: "../../images/thumbs/20260704_727_board_kuzuhara_2_michikusa.webp",
    imageAlt: "東海道新幹線の車窓から見える727看板",
    credit: "写真: michikusa"
  },
  {
    id: "who-am-i-sign",
    category: "shinkansen",
    route: "東海道新幹線",
    question: "「私は誰でしょう」、結局誰なの？",
    answer: "正体はまだ調査中。藤沢市付近に立つQRコード付きの看板で、以前はプチプチで知られる川上産業の広告が出ていた場所です。",
    location: "新横浜〜小田原の藤沢市付近。東京から新大阪へ向かう場合はA席側に見えます。",
    why: "看板そのものが問いかけてくるのに、新幹線の速さではQRコードを読み取る前に通り過ぎてしまうから。",
    statuses: ["現地写真確認済み", "車窓情報確認済み", "広告主調査中"],
    pending: true,
    image: "../../images/thumbs/20260704_putiputi_sign_2_michikusa.webp",
    imageAlt: "東海道新幹線の車窓から見える私は誰でしょう看板",
    credit: "写真: michikusa"
  },
  {
    id: "gold-kannon",
    category: "local",
    route: "近鉄大阪線",
    question: "近鉄特急の窓から見える、あの金色の観音像は何？",
    answer: "榊原温泉口駅近くの大観音寺にある、高さ33mの純金大観音です。",
    location: "榊原温泉口付近。近鉄大阪線の車窓から見えます。見える側や時間は実車確認前です。",
    why: "山あいの景色から、大きな金色の像が突然のぞくから。遠くからでも輪郭が強く残ります。",
    statuses: ["正体確認済み", "車窓情報確認済み", "実車確認待ち"],
    pending: true,
    symbol: "33m",
    color: "#ddc673"
  },
  {
    id: "louvre-sculpture-museum",
    category: "local",
    route: "近鉄大阪線",
    question: "近鉄の窓から見える、巨大な彫刻が並ぶ建物は何？",
    answer: "榊原温泉口駅前にあるルーブル彫刻美術館。パリのルーブル美術館が所蔵する彫刻の復刻作品など、約1,300点を展示しています。",
    location: "榊原温泉口付近。駅のホームからも大きな立像が見えます。走行中に見える側や時間は実車確認前です。",
    why: "山あいの駅のすぐそばに大きな彫刻が立ち、何の施設なのか車窓からは一瞬で分からないから。",
    statuses: ["正体確認済み", "車窓情報確認済み", "実車確認待ち"],
    pending: true,
    symbol: "像",
    color: "#9db6bd"
  },
  {
    id: "suzakumon",
    category: "local",
    route: "近鉄奈良線",
    question: "野原の向こうに突然見える、朱色の門は何？",
    answer: "平城宮跡に復原された朱雀門です。",
    location: "大和西大寺〜新大宮付近。見える位置や方向は現在調査中です。",
    why: "線路のすぐ先に広い史跡がひらけ、現代の電車の窓に奈良時代の景観が割り込むから。",
    statuses: ["正体確認済み", "車窓条件調査中", "写真準備中"],
    pending: true,
    symbol: "門",
    color: "#d9937e"
  }
];

const grid = document.querySelector("#card-grid");
const resultCount = document.querySelector("#result-count");
const empty = document.querySelector("#empty");
const dialog = document.querySelector("#detail-dialog");
const closeButton = dialog.querySelector(".dialog-close");
let lastTrigger = null;

function visualMarkup(item, large = false) {
  if (item.image) {
    return `<img src="${item.image}" alt="${item.imageAlt}"${large ? "" : ' loading="lazy"'}><span class="image-credit">${item.credit}</span>`;
  }
  return `<div class="placeholder" style="--placeholder:${item.color}" data-symbol="${item.symbol}"><span class="placeholder-label">仮写真 / 写真準備中</span></div>`;
}

function renderCards() {
  grid.innerHTML = mysteries.map((item) => `
    <button class="question-card" type="button" data-id="${item.id}" data-category="${item.category}" aria-haspopup="dialog">
      <div class="card-visual">${visualMarkup(item)}</div>
      <div class="card-copy">
        <div class="route-row">
          <span class="route">${item.route}</span>
          <span class="verification${item.pending ? " pending" : ""}">${item.pending ? "確認中を含む" : "実車確認済み"}</span>
        </div>
        <h3>${item.question}</h3>
        <span class="open-label">正体を見る →</span>
      </div>
    </button>
  `).join("");
  resultCount.textContent = `${mysteries.length}件`;
}

function openDetail(item, trigger) {
  lastTrigger = trigger;
  document.querySelector("#dialog-visual").innerHTML = visualMarkup(item, true);
  document.querySelector("#dialog-route").textContent = item.route;
  document.querySelector("#dialog-question").textContent = item.question;
  document.querySelector("#dialog-answer").textContent = item.answer;
  document.querySelector("#dialog-location").textContent = item.location;
  document.querySelector("#dialog-why").textContent = item.why;
  document.querySelector("#dialog-status").innerHTML = item.statuses.map((status) => {
    const pending = /待ち|調査中|準備中/.test(status);
    return `<span class="status-chip${pending ? " pending" : ""}">${status}</span>`;
  }).join("");
  document.body.classList.add("dialog-open");
  dialog.showModal();
  closeButton.focus();
}

function closeDetail() {
  if (dialog.open) dialog.close();
}

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".question-card");
  if (!card) return;
  const item = mysteries.find((entry) => entry.id === card.dataset.id);
  if (item) openDetail(item, card);
});

document.querySelector(".filters").addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) return;
  const filter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach((candidate) => {
    const active = candidate === button;
    candidate.classList.toggle("is-active", active);
    candidate.setAttribute("aria-pressed", String(active));
  });
  let visible = 0;
  document.querySelectorAll(".question-card").forEach((card) => {
    const show = filter === "all" || card.dataset.category === filter;
    card.hidden = !show;
    if (show) visible += 1;
  });
  resultCount.textContent = `${visible}件`;
  empty.hidden = visible !== 0;
});

closeButton.addEventListener("click", closeDetail);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDetail();
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  if (lastTrigger) lastTrigger.focus();
});

renderCards();
