/* =========================================================
 * 新幹線の窓 — 旅の瞬間を見逃さない / Shinkansen Window
 * data.js — 車窓スポットデータ（バイリンガル）
 *
 * minutesFromTokyo: のぞみ基準の東京発からの目安分数（東京→新大阪 約147分）
 * side: "E" = 富士山側（北側・E席） / "A" = 海側（南側・A席）
 *       東海道新幹線はどちら向きでもE席が富士山側になる
 * category: "classic"（定番） / "hidden"（穴場） / "lucky"（珍景）
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
    map: { lat: 35.333, lng: 139.304, ja: "日向岡 住宅地 平塚", en: "Hinataoka Hiratsuka" },
  },
  {
    id: "odawara",
    icon: "🌊",
    ja: { name: "熱海と相模湾", area: "小田原 → 熱海", hook: "街の景色が、海の旅に切りかわる合図。", story: "小田原を過ぎ、熱海が近づくころ、車窓は相模湾へ大きくひらきます。山肌の街、海、岬が一枚の絵になって、東京の街なみが「旅の景色」に変わる瞬間です。海側のA席をどうぞ。" },
    en: { name: "Atami & Sagami Bay", area: "Odawara → Atami", hook: "Where the city ends and the sea begins.", story: "After Odawara, as Atami approaches, the window opens wide toward Sagami Bay. Hillside town, sea and headlands fold into one view: the moment the ride stops being a commute and starts being a journey. Look from Seat A." },
    minutesFromTokyo: 36, side: "A", category: "classic", confidence: "verified", durationSec: 120, scene: "bay",
    image: "images/20260515_atami_sagami_bay.jpg",
    map: { lat: 35.0864250, lng: 139.0786972, ja: "熱海城", en: "Atami Castle" },
  },
  {
    id: "fuji",
    icon: "🗻",
    ja: { name: "富士山", area: "三島 → 新富士", hook: "日本でいちばん有名な3分間。", story: "三島から新富士のあいだ、富士山が車窓いっぱいに迫ります。見えている時間はおよそ3〜4分。トンネルを抜けるたびに大きくなる富士山は、何度乗っても声が出ます。E席側、少し前から窓の外を。" },
    en: { name: "Mt. Fuji", area: "Mishima → Shin-Fuji", hook: "The most famous three minutes in Japan.", story: "Between Mishima and Shin-Fuji, Mt. Fuji fills the window — for roughly three to four minutes. It grows bigger after each tunnel, and it gets a gasp out of people every single time. Seat E side; be ready a little early." },
    minutesFromTokyo: 43, side: "E", category: "classic", confidence: "verified", durationSec: 210, scene: "fuji",
    image: "images/20240211_Mt.Fuji.jpg",
    map: { lat: 35.360625, lng: 138.727363, ja: "富士山", en: "Mt. Fuji" },
  },
  {
    id: "left-fuji",
    icon: "🔭",
    ja: { name: "左富士", area: "新富士 → 静岡", hook: "海側のA席に、28秒だけ富士山が来る。", story: "ふつう富士山はE席のもの。でも線路がカーブするこの区間だけ、反対のA席側に富士山があらわれると言われています。見えるのはほんの数十秒。A席のあなたにも、ちゃんと出番があります。" },
    en: { name: "Left-Side Fuji", area: "Shin-Fuji → Shizuoka", hook: "For 28 seconds, Fuji switches sides.", story: "Mt. Fuji normally belongs to Seat E. But where the track curves in this section, Fuji is said to appear briefly on the opposite A side — for mere seconds. Seat A gets its moment too." },
    minutesFromTokyo: 54, side: "A", category: "hidden", confidence: "verified", durationSec: 28, scene: "leftfuji",
    image: "images/20260513_left_fuji.jpg",
    map: { lat: 35.360625, lng: 138.727363, ja: "富士山", en: "Mt. Fuji" },
  },
  {
    id: "kakegawa",
    icon: "🏯",
    ja: { name: "掛川城", area: "掛川駅 前後", hook: "駅のすぐそばに、木造復元の天守。", story: "掛川駅の北側、車窓から探せる距離に掛川城の天守があります。日本初の木造復元天守。見えるのは一瞬ですが、静岡の車窓に歴史の一行が足されます。" },
    en: { name: "Kakegawa Castle", area: "Around Kakegawa Sta.", hook: "A castle keep, right by the tracks.", story: "Just north of Kakegawa Station stands Kakegawa Castle — Japan's first wooden-reconstructed keep. It appears only briefly, but it adds a line of history to the Shizuoka stretch." },
    minutesFromTokyo: 62, side: "E", category: "hidden", confidence: "verified", durationSec: 15, scene: "castle",
    image: "images/20260530_kakegawa_castle.jpg",
    map: { lat: 34.775417, lng: 138.0147333, ja: "掛川城", en: "Kakegawa Castle" },
  },
  {
    id: "hamanako",
    icon: "🚤",
    ja: { name: "浜名湖", area: "浜松 → 豊橋", hook: "列車が、湖の上をはしる。", story: "浜松を出てしばらくすると、車窓の両側に浜名湖の水面がひろがります。晴れた日の光の反射は、この路線でいちばん「旅をしている」と感じる瞬間のひとつ。うなぎの養殖いかだも探してみてください。" },
    en: { name: "Lake Hamana", area: "Hamamatsu → Toyohashi", hook: "The train runs over the water.", story: "After Hamamatsu, Lake Hamana spreads out on both sides of the train. On a sunny day, the light off the water is one of the most journey-like moments on the line. Look for the eel-farming rafts." },
    minutesFromTokyo: 73, side: "E", category: "classic", confidence: "verified", durationSec: 150, scene: "lake",
    image: "images/20260530_hamanako.jpg",
    map: { lat: 34.741111, lng: 137.569722, ja: "浜名湖", en: "Lake Hamana" },
  },
  {
    id: "kiyosu",
    icon: "🏯",
    ja: { name: "清洲城", area: "名古屋 → 岐阜羽島", hook: "信長の城が、線路のすぐ横に。", story: "名古屋を出て数分、線路のすぐ近くに清洲城があらわれます。織田信長が天下取りを始めた城、そして「清洲会議」の舞台。新幹線がいちばん城に近づく瞬間かもしれません。" },
    en: { name: "Kiyosu Castle", area: "Nagoya → Gifu-Hashima", hook: "Nobunaga's castle, right beside the tracks.", story: "A few minutes out of Nagoya, Kiyosu Castle appears startlingly close to the line. This is where warlord Oda Nobunaga began his rise to power. It may be the closest the Shinkansen ever gets to a castle." },
    minutesFromTokyo: 99, side: "E", category: "hidden", confidence: "verified", durationSec: 12, scene: "castle",
    image: "images/20260530_kiyosu_castle.jpg",
    map: { lat: 35.2165750, lng: 136.8435972, ja: "清洲城", en: "Kiyosu Castle" },
  },
  {
    id: "solar-ark",
    icon: "☀️",
    ja: { name: "ソーラーアーク", area: "名古屋 → 岐阜羽島", hook: "突然、巨大な太陽の船。", story: "名古屋を出て清洲城を過ぎたあと、車窓に巨大な弧を描くソーラーアークがあらわれます。名所案内には出てきにくいけれど、見つけると忘れにくい沿線の異物感。晴れた日は、黒いパネルが空にくっきり浮かびます。" },
    en: { name: "Solar Ark", area: "Nagoya → Gifu-Hashima", hook: "A giant solar ship, out of nowhere.", story: "After Nagoya and Kiyosu Castle, the Solar Ark suddenly sweeps into view: a huge dark arc beside the line. It is not the usual guidebook landmark, but it is exactly the kind of strange window-seat find that sticks in memory." },
    minutesFromTokyo: 103, side: "E", category: "lucky", confidence: "verified", durationSec: 20, scene: "solar",
    image: "images/20260530_solar_ark.jpg",
    map: { lat: 35.3176417, lng: 136.6832861, ja: "ソーラーアーク", en: "Solar Ark" },
  },
  {
    id: "ibuki",
    icon: "⛰️",
    ja: { name: "伊吹山", area: "岐阜羽島 → 米原", hook: "冬は雪をかぶる、関ヶ原の主。", story: "米原の手前、車窓の右手にどっしりと構えるのが伊吹山。古事記にも登場する近江の名山で、冬の雪化粧はみごとです。このあたりは関ヶ原——日本の歴史が動いた土地を、いま時速285kmで駆け抜けています。" },
    en: { name: "Mt. Ibuki", area: "Gifu-Hashima → Maibara", hook: "The mountain that guards Sekigahara.", story: "Before Maibara, Mt. Ibuki rises on the Fuji side — a storied peak that appears in Japan's oldest chronicles, magnificent under winter snow. You're crossing Sekigahara, where the decisive battle of 1600 changed Japanese history. At 285 km/h." },
    minutesFromTokyo: 110, side: "E", category: "classic", confidence: "verified", durationSec: 180, scene: "mountain",
    image: "images/20240114_ibukiyama.png",
    map: { lat: 35.41778, lng: 136.40611, ja: "伊吹山", en: "Mt. Ibuki" },
  },
  {
    id: "toji",
    icon: "⛩️",
    ja: { name: "東寺 五重塔", area: "京都駅 前後", hook: "「京都に来た」が、一瞬でわかる。", story: "京都駅の南側、東寺の五重塔は日本でいちばん高い木造の塔です。1200年前からこの街を見おろしてきた塔が、新幹線の窓から見える——京都の到着を告げる、最高の合図です。" },
    en: { name: "To-ji Pagoda", area: "Around Kyoto Sta.", hook: "One glance, and you know it's Kyoto.", story: "South of Kyoto Station rises the five-story pagoda of To-ji — the tallest wooden tower in Japan, watching over the city for 1,200 years. Catching it from the train window is the perfect announcement: you have arrived in Kyoto." },
    minutesFromTokyo: 131, side: "A", category: "classic", confidence: "verified", durationSec: 40, scene: "pagoda",
    image: "images/20260510_toji.png",
    map: { lat: 34.980361, lng: 135.747694, ja: "東寺 五重塔", en: "To-ji Pagoda Kyoto" },
  },
];
