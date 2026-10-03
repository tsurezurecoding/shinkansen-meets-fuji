// 山陽の城の正本。東海道のSPOTS・時刻表・件数には追加しない。
export const SANYO_CASTLES = [
 {
  id: 'himeji-castle',
  side: 'E',
  name: { ja: '姫路城', en: 'Himeji Castle' },
  station: { ja: '姫路駅の前後', en: 'Around Himeji Station' },
  photo: 'images/20260916_himeji_castle_wakaba.jpg',
  alt: { ja: '新幹線の車窓から見た姫路城の白い天守', en: 'The white keep of Himeji Castle seen from the Shinkansen window' },
  credit: { ja: '@wakaba70127479', en: '@wakaba70127479' },
  sourceUrl: 'https://x.com/wakaba70127479/status/2100095130896408840',
  hook: { ja: '街並みの上に、白い層', en: 'White tiers above the rooftops' },
  about: {
   ja: '池田輝政が1609年に完成させた天守がそのまま残る城です。白漆喰の壁から白鷺城とも呼ばれ、1951年に国宝、1993年には日本で最初の世界文化遺産のひとつになりました。大天守と3つの小天守を渡櫓でつなぐ連立式天守で、層が重なって見えるのはそのためです。',
   en: 'Himeji keeps the tower Ikeda Terumasa completed in 1609, never lost to fire or war. Its white plaster walls earned it the name White Heron Castle; it became a National Treasure in 1951 and one of Japan\'s first World Heritage sites in 1993. The main keep is linked to three smaller keeps by covered bridges, which is why it reads as layers rather than a single tower.'
  },
  body: {
   ja: '線路は城の南側を通ります。北側の窓を見ていると、街並みの向こうに白い天守が現れます。手前の建物に隠れる時間が長いので、駅に近づく前から探しておくと間に合います。',
   en: 'The line passes south of the castle, so the keep appears through the north-facing windows, beyond the rooftops. Buildings hide it for much of the approach: start watching before the train reaches the station.'
  }
 },
 {
  id: 'fukuyama-castle',
  side: 'E',
  name: { ja: '福山城', en: 'Fukuyama Castle' },
  station: { ja: '福山駅のすぐ北', en: 'Right beside Fukuyama Station' },
  photo: 'images/20260919_fukuyama_castle_wakaba.jpg',
  alt: { ja: '新幹線の車窓から見た福山城の天守と石垣', en: 'The keep and stone walls of Fukuyama Castle seen from the Shinkansen window' },
  credit: { ja: '@wakaba70127479', en: '@wakaba70127479' },
  sourceUrl: 'https://x.com/wakaba70127479/status/2101193484564926710',
  hook: { ja: '線路のすぐ隣に、天守', en: 'A keep right next to the tracks' },
  about: {
   ja: '1622年に水野勝成が築いた城です。天守は1945年の福山空襲で焼け、1966年に再建されました。2022年の築城400年に合わせた改修で、天守北側の鉄板張りが復元されています。車窓から見えるのは白い南面で、鉄板張りは反対側です。本丸の南側に建つ伏見櫓は、伏見城から移された当時のままの建物とされています。',
   en: 'Mizuno Katsunari built Fukuyama in 1622. The keep burned in an air raid in 1945 and was rebuilt in 1966; work for the castle\'s 400th anniversary in 2022 restored the iron plating on its north wall, said to be the only keep in Japan armoured that way. From the train you see the white south face, with the iron side turned away. The Fushimi Turret beside it is an original building, moved here from Fushimi Castle in Kyoto.'
  },
  body: {
   ja: '天守は福山駅のすぐ北に建っていて、線路との距離がとても近い城です。石垣の上の天守が木立の向こうから一気に近づき、そのぶん通り過ぎるのも速い車窓です。',
   en: 'The keep stands just north of Fukuyama Station, unusually close to the line. It comes up fast from behind the trees, on top of its stone wall, and passes just as fast.'
  }
 }
];

// 許諾済み写真の追加（2026-10-01の投稿への返信、会長確認）。一覧は1城1枚を維持。
const okayama = {
 id: 'okayama-castle', side: 'A',
 name: { ja: '岡山城', en: 'Okayama Castle' },
 station: { ja: '岡山駅の東側', en: 'East of Okayama Station' },
 photo: 'images/20261001_okayama_castle_summer_dvfkfy3nnzdn3vj.jpg',
 alt: { ja: '街の建物越しに見える岡山城の黒い天守', en: 'The dark keep of Okayama Castle beyond modern buildings' },
 credit: { ja: '@DVfkFY3nnZdn3VJ', en: '@DVfkFY3nnZdn3VJ' },
 sourceUrl: 'https://x.com/DVfkFY3nnZdn3VJ/status/2105536604333088797',
 hook: { ja: '街の向こうに、黒い天守', en: 'A dark keep beyond the city' },
 about: {
  ja: '黒い板張りの外壁から「烏城」と呼ばれる城です。戦災で失われた天守は1966年に再建されました。車窓では街の建物の向こうに、黒い壁と重なる屋根を探します。',
  en: 'The dark clapboard walls gave Okayama Castle its nickname Ujo, or Crow Castle. Its keep was lost during the Second World War and reconstructed in 1966. From the train, look beyond the city buildings for dark walls and stacked roofs.'
 },
 body: {
  ja: '新大阪から西へ向かう列車では岡山駅に着く前、A席側です。東京方面へ向かう列車では、岡山駅を出た後の同じ席側。旭川を渡るあたりから窓を見ておきましょう。建物で見え隠れする遠景です。',
  en: 'On a westbound train, watch Seat A before arrival at Okayama. Heading toward Shin-Osaka, watch the same seat side after departure. Start looking around the Asahi River crossing: the keep is a distant view, interrupted by buildings.'
 },
};
SANYO_CASTLES.splice(1, 0, okayama);

const himeji = SANYO_CASTLES.find(castle => castle.id === 'himeji-castle');
const contributor = '@DVfkFY3nnZdn3VJ';
const himejiPost = 'https://x.com/DVfkFY3nnZdn3VJ/status/2105552015036440734';
// 地図の視点は線路上の代表位置。各写真の撮影位置を意味しない（OSM照合、2026-10-03）。
himeji.detail = {
 castle: { lat: 34.83933, lng: 134.69402 }, viewpoint: { lat: 34.82632, lng: 134.69169 },
 description: {
  ja: '姫路城は新幹線の北側の窓から。姫路駅の前後に見える白い天守を、車窓写真と地図で紹介。16両はE席、8両は座席配列でD席またはE席です。',
  en: 'See Himeji Castle from the Shinkansen: watch the north-facing windows around Himeji Station. Window photos, seat letters for 8- and 16-car trains, and a map.'
 },
 seat: { ja: '北側の窓', en: 'North-facing windows' },
 seatNote: { ja: '16両はE席。8両は2+2ならD席、3+2ならE席。', en: 'Seat E on 16-car trains. On 8-car trains: Seat D in 2+2 rows, Seat E in 3+2 rows.' },
 looking: {
  ja: ['姫路駅の前後、街の建物の上に白い天守が現れます。新大阪から西へ向かうなら右側、東へ向かうなら左側。屋根が何段も重なる白い輪郭を探してください。', '線路と城の間には約1.5kmの市街地があります。建物に隠れることも多く、写真の大写しがそのまま裸眼の見え方ではありません。街並みの写真で位置をつかみ、駅に近づく前から窓を見ておくと探しやすくなります。'],
  en: ['Watch the north side around Himeji Station: the right-hand windows heading west, the left-hand windows heading east. Look for a white silhouette with several overlapping roofs above the city.', 'About 1.5 km of city lies between the track and the keep. Buildings interrupt the view, and the close-up photograph makes the castle look much larger than it does to the eye. Use the wider view to find its place among the rooftops, and start watching before the station.']
 },
 photos: [
  { src: himeji.photo, alt: himeji.alt, credit: himeji.credit.ja, sourceUrl: himeji.sourceUrl, caption: { ja: '街並みの向こうに、白い天守。', en: 'The white keep beyond the rooftops.' } },
  { src: 'images/20261001_himeji_castle_town_dvfkfy3nnzdn3vj.jpg', alt: { ja: '車窓の建物の間から顔を出す姫路城', en: 'Himeji Castle appearing between buildings from the train' }, credit: contributor, sourceUrl: himejiPost, caption: { ja: '手前の街と比べると、城までの距離がわかります。', en: 'The buildings in front show how distant the castle is.' } },
  { src: 'images/20261001_himeji_castle_keep_dvfkfy3nnzdn3vj.jpg', alt: { ja: '望遠で捉えた姫路城の天守と重なる屋根', en: 'A telephoto view of Himeji Castle and its layered roofs' }, credit: contributor, sourceUrl: himejiPost, caption: { ja: '望遠で捉えた天守。肉眼ではもっと小さく見えます。', en: 'A telephoto close-up. The keep is much smaller to the naked eye.' } }
 ],
 references: [
  { ja: '姫路城公式サイト', en: 'Himeji Castle official site (Japanese)', url: 'https://www.city.himeji.lg.jp/castle/' },
  { ja: '姫路市観光案内（英語）', en: 'Himeji City tourist guide (English)', url: 'https://www.city.himeji.lg.jp/kanko/cmsfiles/contents/0000005/5252/HIMEJI_tourist_guide_map_ENG.pdf' }
 ]
};
okayama.detail = {
 castle: { lat: 34.66520, lng: 133.93605 }, viewpoint: { lat: 34.67023, lng: 133.92054 },
 description: {
  ja: '新幹線から岡山城を探すならA席側。岡山駅の東側で見え隠れする黒い天守を、許諾済みの車窓写真と城・線路の地図で紹介します。',
  en: 'See Okayama Castle from the Shinkansen on the Seat A side, east of Okayama Station. Window photographs of the dark Crow Castle, where to look, and a map.'
 },
 seat: { ja: 'A席側', en: 'Seat A side' },
 seatNote: { ja: '16両・8両ともA席側。', en: 'Seat A on both 16- and 8-car trains.' },
 looking: {
  ja: ['岡山駅の東側で、街の向こうにある黒い天守を探します。新大阪から西へ向かう列車では到着前の左側、東へ向かう列車では発車後の右側です。駅付近の線路は曲がるので、「南側」よりA席側を目印にしてください。', '城は線路から約1.5〜1.8km離れています。旭川を渡るあたりから駅に近づく間が探す目安ですが、ビルで見え隠れします。望遠写真は屋根や壁を確かめるための一枚。裸眼では、街並みの中の小さな城です。'],
  en: ['Look for the dark keep east of Okayama Station. It is on your left before arrival when travelling west, and on your right after departure when travelling east. The tracks curve here, so use the Seat A label rather than a compass direction.', 'The keep is roughly 1.5–1.8 km from the track. Watch around the Asahi River crossing and the approach to the station; modern buildings interrupt the view. These telephoto photographs help identify the roof and walls. To the eye, it is a small castle among the city buildings.']
 },
 photos: [
  { src: 'images/20261001_okayama_castle_autumn_dvfkfy3nnzdn3vj.jpg', alt: { ja: '街の建物と山並みの間に見える岡山城', en: 'Okayama Castle between city buildings and the hills beyond' }, credit: contributor, sourceUrl: okayama.sourceUrl, caption: { ja: '街の建物越しに見える、岡山城の黒い姿。', en: 'The dark silhouette of Okayama Castle beyond the buildings.' } },
  { src: okayama.photo, alt: okayama.alt, credit: contributor, sourceUrl: okayama.sourceUrl, caption: { ja: '望遠で見ると、黒い壁と重なる屋根が目印に。', en: 'In the closer view, look for dark walls and stacked roofs.' } }
 ],
 references: [
  { ja: '岡山城公式：天守閣の案内', en: 'Okayama Castle: About the Tenshukaku', url: { ja: 'https://okayama-castle.jp/gather-introduction/', en: 'https://okayama-castle.jp/gather-introduction-en/' } }
 ]
};
export const SANYO_DETAIL_CASTLES = SANYO_CASTLES.filter(castle => castle.detail);
