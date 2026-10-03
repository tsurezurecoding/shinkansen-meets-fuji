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
 heading: { ja: ['姫路城——', '世界遺産の白鷺城'], en: 'Himeji Castle — the World Heritage White Heron Castle' },
 title: { ja: '姫路城は新幹線から見える？席側・場所と車窓写真', en: 'Himeji Castle from the Shinkansen: Seat Side & Window Photos' },
 castle: { lat: 34.83933, lng: 134.69402 }, viewpoint: { lat: 34.82632, lng: 134.69169 },
 description: {
  ja: '世界遺産・姫路城（白鷺城）を新幹線の車窓から探す案内。姫路駅の前後、北側の窓に見える天守の目印を写真と地図で紹介します。16両はE席、8両は座席配列によりD席またはE席。進行方向ごとの見つけ方も確認できます。',
  en: 'Spot Himeji Castle, the World Heritage White Heron Castle, from the Shinkansen. Find the north-side seats, where to look near Himeji Station, window photos and a map.'
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
 heading: { ja: ['岡山城——', '黒い天守の烏城'], en: 'Okayama Castle — the dark-walled Crow Castle' },
 title: { ja: '岡山城は新幹線から見える？A席側・場所と車窓写真', en: 'Okayama Castle from the Shinkansen: Seat A & Window Photos' },
 castle: { lat: 34.66520, lng: 133.93605 }, viewpoint: { lat: 34.67023, lng: 133.92054 },
 description: {
  ja: '岡山城（烏城）は新幹線のA席側、岡山駅の東側で探します。西へ向かう列車は到着前、東へ向かう列車は出発後。建物の向こうに見え隠れする黒い天守を、車窓写真・探す目印・城と線路の地図で紹介します。',
  en: 'Look for Okayama Castle, the dark-walled Crow Castle, from Seat A on the Shinkansen. Find where to watch east of Okayama Station, window photos and a map.'
 },
 seat: { ja: 'A席側', en: 'Seat A side' },
 seatNote: { ja: '16両・8両共通。', en: 'Seat A on both 16- and 8-car trains.' },
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
// 独立ページは一覧より詳しく、歴史・車窓・撮影の順に読む。
himeji.detail.storyHeading = { ja: '秀吉から、世界遺産へ', en: 'From Hideyoshi to World Heritage' };
himeji.detail.story = {
 ja: [
  '白い天守を見ていると、最初からこの姿で建っていたように思えます。けれど姫路城は、城主が代わるたびに役割も姿も変えてきた城です。いま車窓に現れる輪郭には、戦国の拠点づくりから江戸時代の暮らし、近代の保存までが重なっています。',
  '1580年、黒田官兵衛として知られる黒田孝高は、姫路城を羽柴秀吉に献じました。中国地方の毛利氏を攻める秀吉は、ここを拠点に城を整え、翌年には3重の天守を築きます。のちに天下を統一する秀吉が、西へ勢力を広げていた時代の城でした。ただし、いま見える白い大天守は、この秀吉の天守とは別の建物です。',
  '現在の天守を築いたのは、関ヶ原の戦いの後に播磨を与えられた池田輝政です。1601年から大改築を進め、1609年に大天守が完成しました。大天守と3つの小天守を渡櫓でつなぐ構成は、城の中心を一つのまとまりとして守るもの。街の上に浮かぶ白い屋根は、400年以上前に建てられた天守群の屋根です。',
  '1617年には本多忠政が城主となり、その息子・忠刻と妻の千姫も姫路へ移りました。徳川秀忠の娘である千姫は、大坂の陣で最初の夫・豊臣秀頼を失い、忠刻と再婚していました。夫妻のために西の丸が整えられたことは、城が戦いに備える場所であると同時に、人が暮らす場所でもあったと教えてくれます。',
  '江戸時代の建物が残るのは、建てた人だけでなく、守り続けた人たちがいたからです。1956年から8年に及んだ昭和の大修理では、天守を解体して修理し、再び組み上げました。さらに2009年からの平成の保存修理を経て、2015年に大天守の公開が再開。昔の姿を保つために、手をかけ続けてきた城です。',
  '1993年、姫路城は法隆寺とともに、日本で初めて世界文化遺産に登録されました。評価されたのは美しい天守だけではありません。櫓や門、土塀、石垣、堀までが良好に残り、17世紀初頭の日本の城と防御の仕組みを伝えていることも大きな理由です。新幹線から見えるのはその一部ですが、白い屋根の向こうには、城全体を受け継いできた長い時間があります。'
 ],
 en: [
  'Himeji’s white keep can look timeless, yet the castle changed as its rulers and their needs changed. The silhouette through your window carries a story of military ambition, family life and generations of conservation.',
  'In 1580, Kuroda Yoshitaka, also known as Kanbei, handed Himeji Castle to Hashiba Hideyoshi, later known as Toyotomi Hideyoshi. Hideyoshi used it as a base for his campaign against the Mori clan in western Japan and built a three-tiered keep the following year. The white main keep you see today is a different building.',
  'After the Battle of Sekigahara, Ikeda Terumasa received the province of Harima. He began rebuilding Himeji in 1601 and completed the main keep in 1609. Covered passages connect it to three smaller keeps, forming a defended group. Those white roofs above the modern city belong to buildings more than 400 years old.',
  'Honda Tadamasa became lord in 1617. His son Tadatoki and Tadatoki’s wife, Princess Sen, came to Himeji too. A daughter of shogun Tokugawa Hidetada, Sen had lost her first husband, Toyotomi Hideyori, in the siege of Osaka before remarrying. The west bailey was prepared for the couple: this fortress was also a place to build a new life.',
  'Keeping these buildings standing has taken sustained work. An eight-year restoration beginning in 1956 dismantled, repaired and reassembled the keep. Another major conservation project began in 2009, and the main keep reopened in 2015. Its historic appearance survives through careful intervention.',
  'In 1993, Himeji Castle and Horyu-ji became Japan’s first World Cultural Heritage sites. Recognition went beyond the beautiful keep: the surviving turrets, gates, walls, stonework and moats preserve the architecture and defences of an early 17th-century Japanese castle. The train offers a glimpse of that larger inheritance.'
 ]
};
himeji.detail.photoTip = {
 heading: { ja: '街並みと天守を、一緒に見る', en: 'Use the skyline before zooming in' },
 paragraphs: {
  ja: ['まず街並みを広く見て、建物の上に白い屋根のまとまりを探します。城だけを大きく写した写真は形を覚えるのに役立ちますが、実際の窓ではずっと小さく見えます。広い写真と望遠の写真を切り替えると、街の中での大きさと天守の形を確かめられます。', '撮るときは、城を見つけてから大きくズームするより、少し広い画角で待つと追いやすくなります。手前の建物に隠れても、進行方向へ目を向け続けてください。窓に映る室内の反射にも気をつけ、席から無理なく眺めましょう。'],
  en: ['Start with a wide view of the rooftops and look for a cluster of white roofs above them. Switch between the wider photograph and the telephoto close-up to learn both the scale of the castle in the city and the shape of its keep.', 'For a photograph, waiting with a moderately wide frame can make the castle easier to follow than zooming in tightly as soon as you spot it. Keep watching as foreground buildings interrupt the view, and check for reflections in the glass while remaining comfortably in your seat.']
 }
};
himeji.detail.references.unshift(
 { ja: '姫路市：姫路城の歴史', en: 'Himeji City: Castle history (Japanese)', url: 'https://www.city.himeji.lg.jp/castle/0000007750.html' },
 { ja: '兵庫県立歴史博物館：姫路城年表', en: 'Hyogo Prefectural Museum of History: Himeji chronology (Japanese)', url: 'https://rekihaku.pref.hyogo.lg.jp/castle/himeji-chronology/' },
 { ja: '姫路市：世界文化遺産に評価された理由', en: 'Himeji City: Why the castle became World Heritage (Japanese)', url: 'https://www.city.himeji.lg.jp/castle/0000007744.html' }
);
okayama.detail.storyHeading = { ja: '白鷺城と対照的な、黒い烏城', en: 'The dark walls of the Crow Castle' };
okayama.detail.story = {
 ja: ['白い姫路城に対して、岡山城の目印は黒い天守。外壁を黒塗りの下見板で覆っていることから、カラスを意味する「烏」の字を使って烏城（うじょう）と呼ばれます。新幹線の車窓でも、街の建物の間に現れる黒い壁と重なる屋根が探す手がかりです。', '現在につながる岡山城を築いたのは、豊臣秀吉のもとで活躍した宇喜多秀家です。当時の金箔瓦が発掘されており、黒い外壁だけでなく金色の瓦も特徴でした。「金烏城」という別名には、その華やかな姿が表れています。', '天守の土台と1階は不等辺五角形。岡山という丘の地盤に合わせた形といわれています。車窓の一瞬では平面の形までは見えませんが、写真で天守を見つけたあとに知ると、左右対称に見えるお城の印象が少し変わります。', '旧天守は戦災で焼失し、現在の天守は1966年に再建されたものです。姫路城の現存天守とは成り立ちが異なりますが、黒い外観を受け継ぎ、街のランドマークとして立っています。'],
 en: ['In contrast with white-walled Himeji, Okayama Castle has dark clapboard walls. These gave it the nickname Ujo, or Crow Castle. From the train, its dark walls and stacked roofs help distinguish the keep from the surrounding buildings.', 'Ukita Hideie, a powerful lord under Toyotomi Hideyoshi, built the castle that shaped modern Okayama. Excavated gold-leaf tiles reveal that its original appearance paired black walls with golden roof tiles, hence another name: Golden Crow Castle.', 'The foundation and first floor form an irregular pentagon, thought to follow the ground of the hill called Okayama. You will not see that plan in a passing window view, but it gives the building an unusual shape.', 'The old keep was destroyed during the war. The tower you see today was reconstructed in 1966, carrying the distinctive dark exterior into the modern city.']
};
okayama.detail.photoTip = {
 heading: { ja: '黒い天守を、街の中から探す', en: 'Finding the dark keep among the buildings' },
 paragraphs: {
  ja: ['遠い城を探すときは、写真の中の大きさをそのまま窓に当てはめないのがコツです。広い写真では周囲のビルや山並みとの位置関係を、近い写真では黒い壁と屋根の形を見ておくと、実際の車窓で探しやすくなります。', '岡山駅の東側で、A席側の窓を早めに見ておきます。西行きは到着前、東行きは発車後が目安。列車の種類や走行速度、手前の建物で見える時間は変わるため、秒数に合わせて構えるより、区間の景色を眺めながら待ってください。'],
  en: ['Do not expect the keep to look as large through the window as it does in a telephoto picture. Use the wider photo to place it among the buildings and hills, then the closer photo to learn the dark walls and roof shape.', 'Watch through the Seat A side east of Okayama Station: before arrival westbound and after departure eastbound. Train speed and foreground buildings change the viewing window, so follow the city skyline through this stretch instead of relying on a fixed number of seconds.']
 }
};
export const SANYO_DETAIL_CASTLES = SANYO_CASTLES.filter(castle => castle.detail);
