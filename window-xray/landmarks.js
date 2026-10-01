// Curated content for the 品川→東京 E-seat (west-facing) ride.
// Coordinates are approximate building centres (OSM / public maps), not entrances.
// h = height above ground (m). Facts here were limited to widely published ones; see 制作メモ.md.
export const LANDMARKS = [
  { id: 'tokyo-tower', name: '東京タワー', short: '東京タワー', lat: 35.65858, lon: 139.74543, h: 333, osm: ['大展望台'],
    hook: '夕暮れに灯る、333m。', text: '1958年に完成した電波塔。浜松町から新橋へ向かう間、ビルのすき間に一瞬だけ顔を出します。', url: 'https://www.tokyotower.co.jp/' },
  { id: 'azabudai', name: '麻布台ヒルズ森JPタワー', short: '麻布台ヒルズ', lat: 35.66085, lon: 139.74065, h: 325, osm: ['麻布台ヒルズ森JPタワー'],
    hook: '日本でいちばん高いビル。', text: '2023年に完成した高さ約330mの超高層ビル。東京タワーの北側に建っています。', url: 'https://www.azabudai-hills.com/' },
  { id: 'toranomon', name: '虎ノ門ヒルズ森タワー', short: '虎ノ門ヒルズ', lat: 35.66683, lon: 139.74915, h: 247, osm: ['虎ノ門ヒルズ森タワー'],
    hook: 'ビルの下を、道路がくぐる。', text: '新橋から延びる新虎通りの先に立つタワー。環状2号線がビルの下を通り抜けています。', url: 'https://www.toranomonhills.com/' },
  { id: 'wtc', name: '世界貿易センタービルディング南館', short: '世界貿易センター', lat: 35.65475, lon: 139.75627, h: 197, osm: ['世界貿易センタービルディング南館'],
    hook: '浜松町の新しい顔。', text: '浜松町駅前で進む大規模な建て替えの一棟。線路のすぐ西側にそびえます。', url: 'https://www.wtcbldg.co.jp/' },
  { id: 'midtown-hibiya', name: '東京ミッドタウン日比谷', short: 'ミッドタウン日比谷', lat: 35.67363, lon: 139.75912, h: 192, osm: ['日比谷三井タワー'],
    hook: '日比谷公園を見下ろす庭。', text: '2018年開業。6階の「パークビューガーデン」から日比谷公園を見渡せます。', url: 'https://www.hibiya.tokyo-midtown.com/' },
  { id: 'imperial', name: '帝国ホテル', short: '帝国ホテル', lat: 35.67233, lon: 139.75828, h: 64, osm: ['帝国ホテル本館', '帝国ホテルタワー'],
    hook: '1890年からのホテル。', text: '日比谷で1890年に開業したホテル。線路沿いに本館とタワーが並びます。', url: 'https://www.imperialhotel.co.jp/j/tokyo/' },
  { id: 'kitte', name: 'JPタワー・KITTE', short: 'KITTE', lat: 35.67979, lon: 139.76483, h: 200, osm: ['JPタワー'],
    hook: '郵便局のあとに、屋上の庭。', text: '旧東京中央郵便局舎の一部を残した商業施設KITTE。屋上庭園から東京駅の丸の内駅舎を見下ろせます。', url: 'https://marunouchi.jp-kitte.jp/' },
  { id: 'marunouchi-park', name: '丸の内パークビルディング', short: '丸の内パーク', lat: 35.67902, lon: 139.76309, h: 170, osm: ['丸の内パークビルディング'],
    hook: '足元に、赤れんが。', text: '足元には、1894年のオフィス建築を復元した三菱一号館（美術館）があります。', url: 'https://mimt.jp/' },
];

// District cards for taps on buildings without a name in the data.
export const AREAS = [
  { from: 5250, to: 7000, name: '高輪ゲートウェイ付近', card: '高輪ゲートウェイシティ', text: '2025年3月にまちびらきした新しい街。もとは車両基地があった場所です。できたばかりの高層ビルは、まだ模型にありません。', newTown: true },
  { from: 4500, to: 5250, name: '田町付近', card: '田町・三田', text: '線路の西側は三田の街。坂の上に大学やオフィスが並びます。' },
  { from: 3500, to: 4500, name: '芝浦・芝付近', card: '芝の街', text: '田町と浜松町のあいだ。低いビルと住宅の向こうに、芝の街が広がります。' },
  { from: 2750, to: 3500, name: '浜松町付近', card: '浜松町', text: '駅前では大きな建て替えが進みます。ビルのすき間の奥に、東京タワー。' },
  { from: 1700, to: 2750, name: '新橋付近', card: '新橋', text: 'ガード下と路地の街。線路ぎわまでビルが迫り、窓のすぐ前を看板が流れます。' },
  { from: 950, to: 1700, name: '日比谷・有楽町付近', card: '日比谷・有楽町', text: '線路の西は日比谷。大通りの先に日比谷公園と官庁街があります。' },
  { from: 0, to: 950, name: '丸の内付近', card: '丸の内', text: '東京駅の西側、丸の内のオフィス街。赤れんがの駅舎が近づきます。' },
];

// Yamanote-line stations along the ride (approximate platform centres) for the map and emaki.
export const PLACES = [
  { name: '品川', lat: 35.6285, lon: 139.7388 },
  { name: '高輪ゲートウェイ', lat: 35.6355, lon: 139.7405 },
  { name: '田町', lat: 35.6457, lon: 139.7476 },
  { name: '浜松町', lat: 35.6555, lon: 139.7570 },
  { name: '新橋', lat: 35.6663, lon: 139.7583 },
  { name: '有楽町', lat: 35.6750, lon: 139.7630 },
  { name: '東京', lat: 35.6812, lon: 139.7671 },
];

export const CHAPTERS = [
  { t: 38, name: '高輪ゲートウェイ' },
  { t: 118, name: '田町' },
  { t: 186, name: '浜松町・東京タワー' },
  { t: 226, name: '新橋' },
  { t: 283, name: '日比谷・有楽町' },
  { t: 356, name: '丸の内・東京駅' },
];

// "見逃さない" challenges. Times are video seconds; the landmark was confirmed in the footage.
export const CHALLENGES = [
  { id: 'tower', landmark: 'tokyo-tower', announce: 184, from: 191, to: 216, best: 212.5, radius: 0.1,
    ask: 'まもなく<b>東京タワー</b>。見えたら、窓をタップ！', miss: '見逃した？ 一瞬だけ見えていました。', hintLeft: 'もう少し左', hintRight: 'もう少し右' },
];
