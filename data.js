/* =========================================================
 * 新幹線の窓 — 旅の瞬間を見逃さない / Shinkansen Window
 * data.js — 車窓スポットデータ（バイリンガル）
 *
 * minutesFromTokyo: のぞみ基準の東京発からの目安分数（東京→新大阪 約147分）
 * side: "E" = 富士山側（北側・E席） / "A" = 海側（南側・A席）
 *       東海道新幹線はどちら向きでもE席が富士山側になる
 * category: "classic"（定番） / "hidden"（穴場）
 * confidence: "verified"（実見・写真あり） / "source-backed"（出典あり） / "needs-check"（裏取り中）
 * ========================================================= */

const ROUTE = {
  totalMinutes: 147, // のぞみ 東京→新大阪 目安
  // 全駅の「東京からの通過目安分数」(のぞみ速度基準・距離按分)。
  // 実ダイヤ接続時はこの値を使い、選択列車の停車駅時刻のあいだを線形補間する。
  refStations: [
    { id: "Tokyo", ja: "東京", en: "Tokyo", min: 0, major: true },
    { id: "Shinagawa", ja: "品川", en: "Shinagawa", min: 7, major: true },
    { id: "Shin-Yokohama", ja: "新横浜", en: "Shin-Yokohama", min: 18, major: true },
    { id: "Odawara", ja: "小田原", en: "Odawara", min: 31 },
    { id: "Atami", ja: "熱海", en: "Atami", min: 36 },
    { id: "Mishima", ja: "三島", en: "Mishima", min: 40 },
    { id: "Shin-Fuji", ja: "新富士", en: "Shin-Fuji", min: 45 },
    { id: "Shizuoka", ja: "静岡", en: "Shizuoka", min: 53 },
    { id: "Kakegawa", ja: "掛川", en: "Kakegawa", min: 64 },
    { id: "Hamamatsu", ja: "浜松", en: "Hamamatsu", min: 70 },
    { id: "Toyohashi", ja: "豊橋", en: "Toyohashi", min: 79 },
    { id: "Mikawa-Anjo", ja: "三河安城", en: "Mikawa-Anjo", min: 88 },
    { id: "Nagoya", ja: "名古屋", en: "Nagoya", min: 95, major: true },
    { id: "Gifu-Hashima", ja: "岐阜羽島", en: "Gifu-Hashima", min: 102 },
    { id: "Maibara", ja: "米原", en: "Maibara", min: 114 },
    { id: "Kyoto", ja: "京都", en: "Kyoto", min: 130, major: true },
    { id: "Shin-Osaka", ja: "新大阪", en: "Shin-Osaka", min: 147, major: true },
  ],
  get stations() { return this.refStations.filter((s) => s.major); },
};

const SPOTS = [
  {
    id: "hinataoka",
    icon: "🏘️",
    ja: { name: "日向岡の丘の家なみ", area: "新横浜 → 小田原", hook: "斜面いっぱいに、おなじ屋根がならぶ。", story: "相模川を渡ってしばらくすると、丘の斜面にそろって並ぶ住宅地が一瞬あらわれます。名所ではありません。でも、知っている人だけが「あ、来た」と窓の外を見る——そういう車窓です。" },
    en: { name: "Hinataoka Hillside Homes", area: "Shin-Yokohama → Odawara", hook: "A hillside of matching rooftops, gone in seconds.", story: "Shortly after crossing the Sagami River, a planned neighborhood of identical homes climbs the hillside for just a moment. Not a landmark — but the kind of view that makes those in the know glance up from their phone." },
    minutesFromTokyo: 27, side: "E", category: "hidden", confidence: "verified", durationSec: 20, scene: "hills",
    image: "images/20260530_hinataoka.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-30" },
    map: { lat: 35.333, lng: 139.304, ja: "日向岡 住宅地 平塚", en: "Hinataoka Hiratsuka" },
  },
  {
    id: "odawara",
    icon: "🌊",
    ja: { name: "熱海と相模湾", area: "小田原 → 熱海", hook: "街の景色が、海の旅に切りかわる合図。", story: "小田原を過ぎ、熱海が近づくころ、車窓は相模湾へ大きくひらきます。山肌の街、海、岬が一枚の絵になって、東京の街なみが「旅の景色」に変わる瞬間です。海側のA席をどうぞ。" },
    en: { name: "Atami & Sagami Bay", area: "Odawara → Atami", hook: "Where the city ends and the sea begins.", story: "After Odawara, as Atami approaches, the window opens wide toward Sagami Bay. Hillside town, sea and headlands fold into one view: the moment the ride stops being a commute and starts being a journey. Look from Seat A." },
    minutesFromTokyo: 36, side: "A", category: "classic", confidence: "verified", durationSec: 120, scene: "bay",
    image: "images/20260515_atami_sagami_bay.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-15" },
    map: { lat: 35.0864250, lng: 139.0786972, ja: "熱海城", en: "Atami Castle" },
  },
  {
    id: "odawara-castle",
    icon: "🏯",
    ja: { name: "小田原城", area: "小田原駅付近", hook: "のぞみでは、まばたきする間の城。", story: "小田原駅の前後、A席側に小田原城が一瞬だけ見えることがあります。停車しない列車では本当に短い出会い。見えたら、それだけで旅の序章に小さな印がつきます。" },
    en: { name: "Odawara Castle", area: "Around Odawara Sta.", hook: "A castle you can miss in a blink.", story: "Around Odawara Station, Odawara Castle can appear briefly on the Seat A side. On Nozomi services that pass through without stopping, the moment is astonishingly short: a small mark at the beginning of the journey." },
    minutesFromTokyo: 31, side: "A", category: "hidden", confidence: "verified", durationSec: 8, scene: "castle",
    image: "images/20251112_odawara_castle_castle_traveler.jpg",
    photoCredit: { ja: "@Castle_Traveler", en: "@Castle_Traveler", url: "https://x.com/Castle_Traveler/status/1992009734854218106" },
    map: { lat: 35.2509722, lng: 139.1535778, ja: "小田原城", en: "Odawara Castle" },
  },
  {
    id: "fuji",
    icon: "🗻",
    ja: { name: "富士山", area: "三島 → 新富士", hook: "日本でいちばん有名な3分間。", story: "三島から新富士のあいだ、富士山が車窓いっぱいに迫ります。見えている時間はおよそ3〜4分。トンネルを抜けるたびに大きくなる富士山は、何度乗っても声が出ます。E席側、少し前から窓の外を。" },
    en: { name: "Mt. Fuji", area: "Mishima → Shin-Fuji", hook: "The most famous three minutes in Japan.", story: "Between Mishima and Shin-Fuji, Mt. Fuji fills the window — for roughly three to four minutes. It grows bigger after each tunnel, and it gets a gasp out of people every single time. Seat E side; be ready a little early." },
    minutesFromTokyo: 43, side: "E", category: "classic", confidence: "verified", durationSec: 210, scene: "fuji",
    image: "images/20240211_fuji_michikusa.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2024-02-11" },
    photos: [
      {
        src: "images/20230913_fuji_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える富士山", en: "Mt. Fuji from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2023-09-13",
      },
      {
        src: "images/20260516_fuji_michikusa.jpg",
        alt: { ja: "新幹線のE席側から見える富士山", en: "Mt. Fuji from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-16",
      },
    ],
    map: { lat: 35.360625, lng: 138.727363, ja: "富士山", en: "Mt. Fuji" },
  },
  {
    id: "left-fuji",
    icon: "🔭",
    ja: { name: "左富士", area: "新富士 → 静岡", hook: "海側のA席に、28秒だけ富士山が来る。", story: "ふつう富士山はE席のもの。でも線路がカーブするこの区間だけ、反対のA席側に富士山があらわれると言われています。見えるのはほんの数十秒。A席のあなたにも、ちゃんと出番があります。" },
    en: { name: "Left-Side Fuji", area: "Shin-Fuji → Shizuoka", hook: "For 28 seconds, Fuji switches sides.", story: "Mt. Fuji normally belongs to Seat E. But where the track curves in this section, Fuji is said to appear briefly on the opposite A side — for mere seconds. Seat A gets its moment too." },
    minutesFromTokyo: 54, side: "A", category: "hidden", confidence: "verified", durationSec: 28, scene: "leftfuji",
    image: "images/20240410_left_fuji_earlyretiremile.jpg",
    photoCredit: { ja: "@earlyretiremile", en: "@earlyretiremile", url: "https://x.com/earlyretiremile/status/1777853629682405657" },
    photos: [
      {
        src: "images/20260513_left_fuji.jpg",
        alt: { ja: "新幹線のA席側から見える左富士", en: "Left-side Fuji from Seat A" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-13",
      },
      {
        src: "images/20241212_left_fuji_kawasan3.jpg",
        alt: { ja: "新幹線のA席側から見える冬の左富士", en: "Winter Left-Side Fuji from Seat A" },
        credit: { ja: "@kawasan3", en: "@kawasan3" },
        sourceUrl: "https://x.com/kawasan3/status/1866984276581028088",
      },
    ],
    map: { lat: 35.360625, lng: 138.727363, ja: "富士山", en: "Mt. Fuji" },
  },
  {
    id: "kakegawa",
    icon: "🏯",
    ja: { name: "掛川城", area: "掛川駅 前後", hook: "駅のすぐそばに、木造復元の天守。", story: "掛川駅の北側、車窓から探せる距離に掛川城の天守があります。日本初の木造復元天守。見えるのは一瞬ですが、静岡の車窓に歴史の一行が足されます。" },
    en: { name: "Kakegawa Castle", area: "Around Kakegawa Sta.", hook: "A castle keep, right by the tracks.", story: "Just north of Kakegawa Station stands Kakegawa Castle — Japan's first wooden-reconstructed keep. It appears only briefly, but it adds a line of history to the Shizuoka stretch." },
    minutesFromTokyo: 62, side: "E", category: "hidden", confidence: "verified", durationSec: 15, scene: "castle",
    image: "images/20260530_kakegawa_castle.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-30" },
    map: { lat: 34.775417, lng: 138.0147333, ja: "掛川城", en: "Kakegawa Castle" },
  },
  {
    id: "hamanako",
    icon: "🚤",
    ja: { name: "浜名湖", area: "浜松 → 豊橋", hook: "列車が、湖の上をはしる。", story: "浜松を出てしばらくすると、車窓の両側に浜名湖の水面がひろがります。晴れた日の光の反射は、この路線でいちばん「旅をしている」と感じる瞬間のひとつ。うなぎの養殖いかだも探してみてください。" },
    en: { name: "Lake Hamana", area: "Hamamatsu → Toyohashi", hook: "The train runs over the water.", story: "After Hamamatsu, Lake Hamana spreads out on both sides of the train. On a sunny day, the light off the water is one of the most journey-like moments on the line. Look for the eel-farming rafts." },
    minutesFromTokyo: 73, side: "E", category: "classic", confidence: "verified", durationSec: 150, scene: "lake",
    image: "images/20260505_hamanako_design_photosy.jpg",
    photoCredit: { ja: "@Design_photoSY", en: "@Design_photoSY", url: "https://x.com/Design_photoSY/status/2051484905377521740" },
    photos: [
      {
        src: "images/20260530_hamanako.jpg",
        alt: { ja: "新幹線のE席側から見える浜名湖", en: "Lake Hamana from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
      },
    ],
    map: { lat: 34.741111, lng: 137.569722, ja: "浜名湖", en: "Lake Hamana" },
  },
  {
    id: "kiyosu",
    icon: "🏯",
    ja: { name: "清洲城", area: "名古屋 → 岐阜羽島", hook: "信長の城が、線路のすぐ横に。", story: "名古屋を出て数分、線路のすぐ近くに清洲城があらわれます。織田信長が天下取りを始めた城、そして「清洲会議」の舞台。新幹線がいちばん城に近づく瞬間かもしれません。" },
    en: { name: "Kiyosu Castle", area: "Nagoya → Gifu-Hashima", hook: "Nobunaga's castle, right beside the tracks.", story: "A few minutes out of Nagoya, Kiyosu Castle appears startlingly close to the line. This is where warlord Oda Nobunaga began his rise to power. It may be the closest the Shinkansen ever gets to a castle." },
    minutesFromTokyo: 99, side: "E", category: "hidden", confidence: "verified", durationSec: 12, scene: "castle",
    image: "images/20260530_kiyosu_castle.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-30" },
    map: { lat: 35.2165750, lng: 136.8435972, ja: "清洲城", en: "Kiyosu Castle" },
  },
  {
    id: "solar-ark",
    icon: "☀️",
    ja: { name: "ソーラーアーク", area: "名古屋 → 岐阜羽島", hook: "突然、巨大な太陽の船。", story: "名古屋を出て清洲城を過ぎたあと、車窓に巨大な弧を描くソーラーアークがあらわれます。名所案内には出てきにくいけれど、見つけると忘れにくい沿線の異物感。晴れた日は、黒いパネルが空にくっきり浮かびます。" },
    en: { name: "Solar Ark", area: "Nagoya → Gifu-Hashima", hook: "A giant solar ship, out of nowhere.", story: "After Nagoya and Kiyosu Castle, the Solar Ark suddenly sweeps into view: a huge dark arc beside the line. It is not the usual guidebook landmark, but it is exactly the kind of strange window-seat find that sticks in memory." },
    minutesFromTokyo: 103, side: "E", category: "hidden", confidence: "verified", durationSec: 20, scene: "solar",
    image: "images/20260530_solar_ark.jpg",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-30" },
    map: { lat: 35.3176417, lng: 136.6832861, ja: "ソーラーアーク", en: "Solar Ark" },
  },
  {
    id: "ibuki",
    icon: "⛰️",
    ja: { name: "伊吹山", area: "岐阜羽島 → 米原", hook: "冬は雪をかぶる、関ヶ原の主。", story: "米原の手前、車窓の右手にどっしりと構えるのが伊吹山。古事記にも登場する近江の名山で、冬の雪化粧はみごとです。このあたりは関ヶ原——日本の歴史が動いた土地を、いま時速285kmで駆け抜けています。" },
    en: { name: "Mt. Ibuki", area: "Gifu-Hashima → Maibara", hook: "The mountain that guards Sekigahara.", story: "Before Maibara, Mt. Ibuki rises on the Fuji side — a storied peak that appears in Japan's oldest chronicles, magnificent under winter snow. You're crossing Sekigahara, where the decisive battle of 1600 changed Japanese history. At 285 km/h." },
    minutesFromTokyo: 110, side: "E", category: "classic", confidence: "verified", durationSec: 180, scene: "mountain",
    image: "images/20240114_ibukiyama.png",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2024-01-14" },
    photos: [
      {
        src: "images/20260530_ibukiyama.jpg",
        alt: { ja: "新幹線のE席側から見える伊吹山", en: "Mt. Ibuki from Seat E" },
        credit: { ja: "michikusa", en: "michikusa" },
        date: "2026-05-30",
      },
    ],
    map: { lat: 35.41778, lng: 136.40611, ja: "伊吹山", en: "Mt. Ibuki" },
  },
  {
    id: "omi-fuji",
    icon: "⛰️",
    ja: { name: "近江富士", area: "米原 → 京都", hook: "琵琶湖の手前、もうひとつの富士。", story: "米原を出てしばらくすると、A席側に三角の美しい山が見えてきます。三上山、別名・近江富士。水田に映れば、車窓だけの逆さ富士です。時刻と席側は位置からの推定なので、少し余裕を持って探してみてください。" },
    en: { name: "Omi Fuji", area: "Maibara → Kyoto", hook: "Another Fuji, before Kyoto.", story: "After Maibara, look from Seat A for Mt. Mikami, nicknamed Omi Fuji for its clean triangular shape. When the fields are wet, it becomes a window-seat reflection: a tiny upside-down Fuji. Timing and seat side are estimated from location, so start looking a little early." },
    minutesFromTokyo: 123, side: "A", sideLabel: { ja: "A席側", en: "Seat A side" }, category: "hidden", confidence: "needs-check", durationSec: 90, scene: "mountain",
    image: "images/20250523_omi_fuji_kawasan3.jpg",
    photoCredit: { ja: "かわさん @kawasan3", en: "Kawasan @kawasan3", url: "https://x.com/kawasan3/status/1925668108024320321" },
    map: { lat: 35.0479, lng: 136.0450, ja: "三上山 近江富士", en: "Mt. Mikami Omi Fuji" },
  },
  {
    id: "toji",
    icon: "⛩️",
    ja: { name: "東寺 五重塔", area: "京都駅 前後", hook: "「京都に来た」が、一瞬でわかる。", story: "京都駅の南側、東寺の五重塔は日本でいちばん高い木造の塔です。1200年前からこの街を見おろしてきた塔が、新幹線の窓から見える——京都の到着を告げる、最高の合図です。" },
    en: { name: "To-ji Pagoda", area: "Around Kyoto Sta.", hook: "One glance, and you know it's Kyoto.", story: "South of Kyoto Station rises the five-story pagoda of To-ji — the tallest wooden tower in Japan, watching over the city for 1,200 years. Catching it from the train window is the perfect announcement: you have arrived in Kyoto." },
    minutesFromTokyo: 131, side: "A", category: "classic", confidence: "verified", durationSec: 40, scene: "pagoda",
    image: "images/20260510_toji.png",
    photoCredit: { ja: "michikusa", en: "michikusa", date: "2026-05-10" },
    map: { lat: 34.980361, lng: 135.747694, ja: "東寺 五重塔", en: "To-ji Pagoda Kyoto" },
  },
];
