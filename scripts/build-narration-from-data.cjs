/* =========================================================
 * Build AI window guide narration entries from data.js.
 *
 * Keeps existing hand-written entries when present, then fills any missing
 * SPOTS with compact direction/language-specific narration drafts.
 * ========================================================= */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..", "..");
const dataPath = path.join(repoRoot, "app", "data.js");
const narrationPath = path.join(repoRoot, "app", "live", "narration.js");

function loadGlobal(file, trailer, key) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, "utf8") + "\n" + trailer, ctx, { filename: file });
  return ctx.window[key];
}

function firstSentences(text, count) {
  const value = String(text || "").trim();
  if (!value) return "";
  const parts = value.match(/[^。.!?！？]+[。.!?！？]?/g) || [value];
  return parts.slice(0, count).join("").trim();
}

function seatFor(side, dir, lang) {
  if (side === "A/E") return lang === "ja" ? "A席とE席" : "Seats A and E";
  const actual = dir === "up"
    ? side === "E" ? "A" : "E"
    : side;
  return lang === "ja" ? `${actual}席側` : `the Seat ${actual} side`;
}

function jaDraft(spot, dir) {
  const side = seatFor(spot.side, dir, "ja");
  const name = spot.ja.name;
  const hook = spot.ja.hook || "";
  const story = firstSentences(spot.ja.story, 2);
  if (dir === "up") {
    return `東京方面へ向かうこのあたりでは、${side}に${name}が見えてきます。${hook} ${story}`;
  }
  return `まもなく${name}です。${side}、${spot.ja.area}で見えてきます。${hook} ${story}`;
}

function enDraft(spot, dir) {
  const side = seatFor(spot.side, dir, "en");
  const name = spot.en.name;
  const hook = spot.en.hook || "";
  const story = firstSentences(spot.en.story, 2);
  if (dir === "up") {
    return `Heading toward Tokyo, ${name} appears on ${side}. ${hook} ${story}`;
  }
  return `${name} is coming up on ${side}, around ${spot.en.area}. ${hook} ${story}`;
}

function durationSec(text, lang) {
  const value = String(text || "");
  if (lang === "ja") return Math.max(12, Math.min(55, Math.ceil(value.length / 8)));
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(12, Math.min(55, Math.ceil(words / 2.2)));
}

function withDuration(item, id, dir, lang) {
  const text = item.text || "";
  const speechText = item.speechText || text;
  const next = Object.assign({}, item, {
    durationSec: item.durationSec || durationSec(speechText, lang),
  });
  if (next.audio && /\.wav$/i.test(next.audio)) delete next.audio;
  return next;
}

function hinataokaOverride() {
  return {
    down: {
      ja: {
        text: "相模平野越しの富士山が見え始めるころ、E席側の丘にそろった三角屋根も見えてきます。日向岡の街並みです。観光名所というより、知っている人だけが窓を見る車窓。富士山を意識しながら、その手前の丘にも目を向けてください。",
        speechText: "相模平野越しの富士山が見え始めるころ、E席側の丘にそろった三角屋根も見えてきます。ひなたおかの街並みです。観光名所というより、知っている人だけが窓を見る車窓。富士山を意識しながら、その手前の丘にも目を向けてください。",
      },
      en: {
        text: "As Mt. Fuji starts to appear beyond the Sagami Plain, watch the Seat E side for rows of matching triangular roofs on the hillside. This is Hinataoka: not a famous landmark, but exactly the kind of small window discovery this guide is made for. Keep Fuji in mind, but let your eyes catch the hillside in front of it too.",
      },
    },
    up: {
      ja: {
        text: "小田原から新横浜へ向かう途中、A席側の丘にそろった三角屋根がならびます。日向岡の街並みです。大きな名所ではありませんが、相模平野越しの富士山を見ている流れで、手前の丘にも気づけると少し得をした気分になる景色です。",
        speechText: "小田原から新横浜へ向かう途中、A席側の丘にそろった三角屋根がならびます。ひなたおかの街並みです。大きな名所ではありませんが、相模平野越しの富士山を見ている流れで、手前の丘にも気づけると少し得をした気分になる景色です。",
      },
      en: {
        text: "Between Odawara and Shin-Yokohama, look to Seat A for a hillside of matching triangular roofs. This is Hinataoka: a small, satisfying discovery rather than a headline landmark. If you are already watching Mt. Fuji beyond the Sagami Plain, notice the nearer hillside too.",
      },
    },
  };
}

function normalizeEntry(id, entry) {
  const next = {};
  for (const dir of ["down", "up"]) {
    next[dir] = {};
    for (const lang of ["ja", "en"]) {
      const item = entry?.[dir]?.[lang];
      if (item && item.text) next[dir][lang] = withDuration(item, id, dir, lang);
    }
  }
  return next;
}

function applyNarrationGroups(entries) {
  if (entries.hamanako) {
    entries.hamanako.group = "hamanako-lake-fuji";
    entries.hamanako.down.ja.text = "浜名湖の区間に入ります。ここはE席だけでなく、A席にも水辺と橋が広がる、両側で楽しい車窓です。列車が湖の上を走っているように感じる数分間。空気が澄んでいれば、E席側の湖と空のさらに奥に、小さく富士山も探せます。";
    entries.hamanako.down.en.text = "We are entering the Lake Hamana stretch. This is a rare view that works on both sides: water, bridges, and open sky spread beyond Seats A and E. For a few minutes the train feels as if it is running over the lake. In clear air, look from Seat E for a tiny Mt. Fuji far beyond the water.";
    entries.hamanako.up.ja.text = "浜名湖を渡ります。東京方面へ向かう場合も、A席とE席の両方に水辺の景色があります。湖面、橋、養殖いかだが次々に流れる区間です。晴れて空気が澄んだ日は、E席側に浜名湖越しの富士山が見えることもあります。";
    entries.hamanako.up.en.text = "The train is crossing Lake Hamana. Toward Tokyo, both Seat A and Seat E can get water views: lake surface, bridges, and eel-farming rafts sliding past the window. On especially clear days, Seat E may also catch the rare Mt. Fuji view beyond the lake.";
  }
  if (entries["hamanako-fuji"]) {
    entries["hamanako-fuji"].group = "hamanako-lake-fuji";
    entries["hamanako-fuji"].up.ja.text = "浜名湖越しの富士山を探すなら、東京方面でもE席側です。湖の向こう、かなり遠くに小さく見えることがあります。冬の晴れた日など、空気が澄んだときだけのごほうびです。";
    entries["hamanako-fuji"].up.en.text = "Toward Tokyo, the Lake Hamana Fuji view is still on the Seat E side. Look far beyond the lake for a very small Mt. Fuji. It is a reward for crisp, clear days, especially in winter.";
  }
}

function setNarrationText(entries, id, dir, lang, text) {
  const item = entries[id]?.[dir]?.[lang];
  if (!item) return;
  item.text = text;
  item.durationSec = durationSec(item.speechText || item.text, lang);
}

function setSpeechText(entries, id, dir, text) {
  const item = entries[id]?.[dir]?.ja;
  if (!item) return;
  item.speechText = text;
  item.durationSec = durationSec(text, "ja");
}

function applyAudioCopyOverrides(entries) {
  setNarrationText(entries, "727-board", "down", "ja", "まもなく727看板と248看板です。藤沢市葛原付近ではE席側に、727 COSMETICSの白い看板と黄色い248看板が並びます。727はここ以外にも、A席側やE席側で何度か見かける沿線の定番です。乗り慣れている人ほど、あの数字は何だろうと気になっているかもしれません。");
  setNarrationText(entries, "727-board", "up", "ja", "東京方面へ向かうこのあたりでは、A席側やE席側に727 COSMETICSの看板がいくつか見えてきます。藤沢市葛原付近では、727の隣に黄色い248看板も並びます。何度も新幹線に乗っている人ほど、あの数字の看板が気になっているかもしれません。");
  setNarrationText(entries, "727-board", "down", "en", "The 727 and 248 signs are coming up. Around Kuzuhara in Fujisawa, look to Seat E for a white 727 COSMETICS sign beside a yellow 248 sign. 727 signs appear at several points along the Tokaido Shinkansen, on different sides depending on the location, so regular riders may have wondered about them for years.");
  setNarrationText(entries, "727-board", "up", "en", "Around this stretch toward Tokyo, you may see several 727 COSMETICS signs from Seats A or E depending on the exact point. Near Kuzuhara in Fujisawa, a yellow 248 sign appears beside one of them. If you ride the Shinkansen often, those repeated numbers may already feel familiar.");

  setNarrationText(entries, "mikawa-oshima", "down", "ja", "まもなく三河大島です。豊橋を過ぎたあと、A席側に三河湾と小さな島影が見えることがあります。大きな観光名所というより、海の向こうにぽつんと浮かぶ発見型の車窓です。見通しがよい日に、海側の窓を探してみてください。");
  setNarrationText(entries, "mikawa-oshima", "up", "ja", "東京方面へ向かうこのあたりでは、E席側に三河湾と三河大島が見えることがあります。窓の外に一瞬だけ現れる小さな島影です。浜名湖のあとにも、海側にはまだ見つける楽しみがあります。");

  setNarrationText(entries, "nichiban-anjo", "down", "ja", "まもなくセロテープの壁看板です。三河安城の少し手前で、E席側にニチバン安城工場の大きな壁看板が見えてきます。赤、白、青のセロテープ広告が工場の壁いっぱいに現れる、東海道新幹線らしい沿線の発見です。");
  setNarrationText(entries, "nichiban-anjo", "up", "ja", "東京方面へ向かう場合は、三河安城を出てすぐ、A席側にセロテープの壁看板が見えてきます。ニチバン安城工場の壁いっぱいに、赤、白、青の広告が大きく現れます。ただの広告なのに、妙に記憶に残る車窓です。");

  setNarrationText(entries, "nagoya-station-skyline", "down", "ja", "まもなく名古屋駅前です。E席側の車窓が、高層ビル、駅前の密度、線路の重なりへ一気に切り替わります。山や城とは違いますが、名古屋に着くことを知らせる大事な都市の車窓です。");
  setNarrationText(entries, "nagoya-station-skyline", "up", "ja", "東京方面へ向かうこのあたりでは、A席側に名古屋駅前の高層ビル群が見えてきます。駅前の密度と線路の重なりが、名古屋の大きさを短い時間で見せてくれます。");

  setNarrationText(entries, "solar-ark", "down", "ja", "まもなくソーラーアークです。名古屋を出て清洲城を過ぎ、岐阜羽島へ近づくころ、E席側に巨大な弧を描く建物が現れます。かつて三洋電機、現在のパナソニックによって建てられた太陽光発電モニュメントです。");
  setNarrationText(entries, "solar-ark", "up", "ja", "東京方面へ向かうこのあたりでは、A席側にソーラーアークが見えてきます。巨大な弧を描く建物で、かつて太陽光発電の象徴として建てられたモニュメントです。名所案内には出にくいですが、一度見つけると忘れにくい車窓です。");
}

function applyJapaneseSpeechTextPolish(entries) {
  setSpeechText(entries, "tokyo-tower", "down", "まもなく東京タワーです。東京駅を出て品川へ向かう数分のあいだ、E席側のビルの間に赤い塔が見えることがあります。旅の序盤に、東京らしい都市の景色を知らせる合図です。");
  setSpeechText(entries, "tokyo-tower", "up", "東京方面へ向かうこのあたりでは、A席側のビルの間に東京タワーが見えることがあります。旅の終わりに東京の街へ戻ってきたことを知らせる合図です。");

  setSpeechText(entries, "hinataoka", "down", "相模平野越しの富士山が見え始めるころ、E席側の丘にそろった三角屋根も見えてきます。ひなたおかの街並みです。観光名所というより、知っている人だけが窓を見る車窓です。富士山を意識しながら、その手前の丘にも目を向けてください。");
  setSpeechText(entries, "hinataoka", "up", "小田原から新横浜へ向かう途中、A席側の丘にそろった三角屋根がならびます。ひなたおかの街並みです。大きな名所ではありませんが、相模平野越しの富士山を見ている流れで、手前の丘にも気づけると少し得をした気分になる景色です。");

  setSpeechText(entries, "ota-fuji", "down", "まもなく都内からの富士山です。品川を過ぎて新横浜へ向かう途中、空気が澄んだ日にはE席側に小さく富士山が見えることがあります。新富士の大きな富士山とは違う、都市の向こうに小さく浮かぶ早い合図です。");
  setSpeechText(entries, "ota-fuji", "up", "東京方面へ向かうこのあたりでは、A席側に都内からの富士山が見えることがあります。新富士付近の主役とは違う、都市の向こうに小さく浮かぶ控えめな富士山です。");

  setSpeechText(entries, "maruko-bridge", "down", "まもなく多摩川を渡ります。E席側に見える青いアーチが丸子橋です。初代は昭和9年、「丸子の渡し」と呼ばれた渡し舟に代わって架けられた橋です。橋の奥の緑は、古代の首長が眠る亀甲山古墳の森です。ビル街から川の景色へ変わる、旅の序盤の小さな見せ場です。");
  setSpeechText(entries, "maruko-bridge", "up", "まもなく多摩川を渡ります。A席側の窓に見える青いアーチが丸子橋です。初代は昭和9年、「丸子の渡し」と呼ばれた渡し舟に代わって架けられた橋です。新横浜を出て、東京の街へ近づく手前の小さな見せ場です。");

  setSpeechText(entries, "musashi-kosugi-towers", "down", "まもなく武蔵小杉のタワマン群です。丸子橋を過ぎてすぐ、E席側に高層ビル群が迫ります。多摩川の開けた景色から、縦に伸びる街へ一気に切り替わる瞬間です。");
  setSpeechText(entries, "musashi-kosugi-towers", "up", "東京方面へ向かうこのあたりでは、A席側に武蔵小杉のタワマン群が見えてきます。多摩川へ近づく手前で、縦に伸びる街の密度が窓いっぱいに広がる瞬間です。");

  setSpeechText(entries, "putiputi-sign", "down", "まもなく私は誰でしょう看板です。新横浜から小田原へ向かう途中、A席側に「私は誰でしょう」と問いかける謎の看板が見えます。右上にはQRコードもありますが、新幹線の速度では読み取るのはかなり困難です。");
  setSpeechText(entries, "putiputi-sign", "up", "東京方面へ向かうこのあたりでは、E席側に私は誰でしょう看板が見えてきます。「私は誰でしょう」と問いかける謎の看板で、右上にはQRコードもありますが、新幹線の速度では読み取るのはかなり困難です。");

  setSpeechText(entries, "odawara", "down", "まもなく熱海と相模湾です。小田原を過ぎ、熱海が近づくころ、A席側の車窓は相模湾へ大きくひらきます。街の景色が、海の旅に切りかわる合図です。");
  setSpeechText(entries, "odawara", "up", "東京方面へ向かうこのあたりでは、E席側に熱海と相模湾が見えてきます。山肌の街、海、岬が一枚の絵のように重なる、海の旅の名残を感じる区間です。");

  setSpeechText(entries, "odawara-castle", "down", "まもなく小田原城です。小田原駅の前後、A席側に小田原城が一瞬だけ見えます。停車しない列車では本当に短い出会いです。");
  setSpeechText(entries, "odawara-castle", "up", "東京方面へ向かうこのあたりでは、E席側に小田原城が一瞬だけ見えます。停車しない列車では、まばたきする間の短い出会いです。");

  setSpeechText(entries, "gyoran-kannon", "down", "まもなく魚籃観音像です。小田原を過ぎ、早川駅の近くでA席側を見ていると、白い観音像がほんの一瞬あらわれます。見逃すと、あれは何だったんだろうとなる発見型スポットです。");
  setSpeechText(entries, "gyoran-kannon", "up", "東京方面へ向かうこのあたりでは、E席側に魚籃観音像がほんの一瞬あらわれます。白い姿が突然窓に入る、見つけるとうれしい発見型スポットです。");

  setSpeechText(entries, "left-fuji", "down", "まもなく左富士です。東京から新大阪方面へ向かうなら、静岡駅を過ぎ、安倍川を渡ってまもなく、A席側に富士山が現れます。ふつう富士山はE席側ですが、この短い区間だけ反対側に見える特別な車窓です。");
  setSpeechText(entries, "left-fuji", "up", "東京方面へ向かうこのあたりでは、E席側に左富士の区間が来ます。静岡駅の近くで、いつもとは反対側に富士山が見える短い特別区間です。");

  setSpeechText(entries, "shimizu-port-chikyu", "down", "まもなく清水港とちきゅうです。新富士から静岡へ向かう途中、A席側に清水港のクレーン群が見えてきます。停泊していれば、地球深部探査船ちきゅうも窓に入ります。");
  setSpeechText(entries, "shimizu-port-chikyu", "up", "東京方面へ向かうこのあたりでは、E席側に清水港のクレーン群が見えてきます。停泊していれば、地球深部探査船ちきゅうも窓に入る区間です。");

  setSpeechText(entries, "shizuoka-tea-fields", "down", "まもなく静岡の茶畑です。掛川城の少し手前、E席側の車窓に茶畑の緑が流れる区間があります。富士山や城ほど大きな目印ではありませんが、静岡らしい景色です。");
  setSpeechText(entries, "shizuoka-tea-fields", "up", "東京方面へ向かうこのあたりでは、A席側に静岡の茶畑が見えてきます。緑の畝が車窓を流れる、静岡らしい短い区間です。");

  setSpeechText(entries, "kakegawa", "down", "まもなく掛川城です。掛川駅の北側、E席側の車窓から探せる距離に掛川城の天守があります。日本初の木造復元天守です。");
  setSpeechText(entries, "kakegawa", "up", "東京方面へ向かうこのあたりでは、A席側に掛川城が見えてきます。駅のすぐそばにある、日本初の木造復元天守です。");

  setSpeechText(entries, "genki-sign", "down", "まもなくしっぺいの応援看板です。掛川を過ぎて浜松へ向かう途中、E席側に磐田市のキャラクター、しっぺいが描かれた三連続の応援看板が並びます。いつも応援してるよ、みんなありがとう、必ず明日があるからね、という短いメッセージが続きます。");
  setSpeechText(entries, "genki-sign", "up", "東京方面へ向かうこのあたりでは、A席側にしっぺいの応援看板が見えてきます。三連続の看板に、いつも応援してるよ、みんなありがとう、必ず明日があるからね、という短いメッセージが続きます。");

  setSpeechText(entries, "hamanako", "down", "浜名湖の区間に入ります。ここはE席だけでなく、A席にも水辺と橋が広がる、両側で楽しい車窓です。列車が湖の上を走っているように感じる数分間です。空気が澄んでいれば、E席側の湖と空のさらに奥に、小さく富士山も探せます。");
  setSpeechText(entries, "hamanako", "up", "浜名湖を渡ります。東京方面へ向かう場合も、A席とE席の両方に水辺の景色があります。湖面、橋、養殖いかだが次々に流れる区間です。晴れて空気が澄んだ日は、E席側に浜名湖越しの富士山が見えることもあります。");
  setSpeechText(entries, "hamanako-fuji", "down", "浜名湖越しの富士山は、見えたらかなり幸運な車窓です。E席側、湖と空のさらに奥に、小さく富士山が出ることがあります。新富士の迫力とは逆で、遠くにあるものを探し当てる楽しさです。");
  setSpeechText(entries, "hamanako-fuji", "up", "浜名湖越しの富士山を探すなら、東京方面でもE席側です。湖の向こう、かなり遠くに小さく見えることがあります。冬の晴れた日など、空気が澄んだときだけのごほうびです。");

  setSpeechText(entries, "toyohashi-tateiwa", "down", "まもなく豊橋の立岩です。浜名湖を過ぎて少しすると、E席側の丘の上に岩が突き出した景色が見えてきます。大きな観光名所ではありませんが、見つけると印象に残る地形です。");
  setSpeechText(entries, "toyohashi-tateiwa", "up", "東京方面へ向かうこのあたりでは、A席側に豊橋の立岩が見えてきます。丘の上に岩が突き出した、短い時間だけ探せる地形の車窓です。");

  setSpeechText(entries, "gifu-castle", "down", "まもなく岐阜城です。岐阜羽島を過ぎ、木曽三川を渡る前後で、E席側の遠くに金華山が見えることがあります。その山頂にあるのが岐阜城です。線路からは離れているので、晴れた日に少し集中して探してみてください。");
  setSpeechText(entries, "gifu-castle", "up", "東京方面へ向かうこのあたりでは、A席側の遠くに金華山が見えることがあります。その山頂にあるのが岐阜城です。線路からは離れているので、晴れた日に少し集中して探してみてください。");

  setSpeechText(entries, "kinshozan", "down", "まもなく金生山です。岐阜羽島を過ぎて大垣へ向かうあたり、E席側に白く削られた山肌が見えます。金生山は石灰岩の山で、かつて消えた岐阜のピラミッドとも呼ばれた山です。");
  setSpeechText(entries, "kinshozan", "up", "東京方面へ向かうこのあたりでは、A席側に金生山が見えてきます。白く削られた山肌が特徴の石灰岩の山で、かつて消えた岐阜のピラミッドとも呼ばれました。");

  setSpeechText(entries, "nangu-taisha", "down", "まもなく南宮大社です。岐阜羽島を出て関ヶ原へ向かう途中、A席側の田園の向こうに南宮大社の大鳥居が見えます。田園の中に赤い鳥居を探す車窓です。");
  setSpeechText(entries, "nangu-taisha", "up", "東京方面へ向かうこのあたりでは、E席側に南宮大社の大鳥居が見えてきます。田園の向こうに赤い鳥居を探す、関ヶ原近くの短い車窓です。");

  setSpeechText(entries, "sawayama-castle", "down", "まもなく佐和山城跡です。米原を過ぎて少し、E席側に佐和山城跡の山と看板が見えることがあります。佐和山城は、関ヶ原の戦いで敗れた石田三成の居城です。");
  setSpeechText(entries, "sawayama-castle", "up", "東京方面へ向かうこのあたりでは、A席側に佐和山城跡が見えてきます。石田三成の居城だった山城跡を、田んぼ越しに探す車窓です。");

  setSpeechText(entries, "hikone-castle", "down", "まもなく彦根城です。米原を出たあと、E席側の街並みの向こうに彦根城の天守が小さく見えることがあります。国宝の天守が、街の向こうに少しだけ現れる区間です。");
  setSpeechText(entries, "hikone-castle", "up", "東京方面へ向かうこのあたりでは、A席側に彦根城が見えてきます。国宝の天守が街の向こうに小さく見えることがあります。");

  setSpeechText(entries, "kannonji-castle", "down", "まもなく観音寺城跡です。安土の近く、E席側の山並みに観音寺城跡が見えることがあります。天守ではなく、山城のあった稜線を探す車窓です。");
  setSpeechText(entries, "kannonji-castle", "up", "東京方面へ向かうこのあたりでは、A席側に観音寺城跡が見えてきます。六角氏の城跡があった山の稜線を探す車窓です。");

  setSpeechText(entries, "omi-fuji", "down", "まもなく近江富士です。米原を出てしばらくすると、A席側に三角の美しい山が見えてきます。三上山、別名、近江富士です。");
  setSpeechText(entries, "omi-fuji", "up", "東京方面へ向かうこのあたりでは、E席側に近江富士が見えてきます。琵琶湖の手前で見える三角の美しい山、三上山です。");

  setSpeechText(entries, "seta-karahashi", "down", "まもなく瀬田の唐橋です。京都へ近づく少し前、E席側に瀬田川と瀬田の唐橋が見えてきます。日本書紀にも登場する交通の要衝で、古くから知られる橋です。");
  setSpeechText(entries, "seta-karahashi", "up", "東京方面へ向かうこのあたりでは、A席側に瀬田の唐橋が見えてきます。瀬田川に架かる、京都の手前で探したい歴史ある橋です。");
}

const spots = loadGlobal(dataPath, "window.__SPOTS = SPOTS;", "__SPOTS") || [];
const current = loadGlobal(narrationPath, "window.__NARRATIONS = NARRATIONS;", "__NARRATIONS") || {};
const next = {};

for (const spot of spots) {
  const existing = current[spot.id] ? normalizeEntry(spot.id, current[spot.id]) : null;
  const generated = {
    down: {
      ja: { text: jaDraft(spot, "down") },
      en: { text: enDraft(spot, "down") },
    },
    up: {
      ja: { text: jaDraft(spot, "up") },
      en: { text: enDraft(spot, "up") },
    },
  };
  next[spot.id] = normalizeEntry(spot.id, existing || generated);
}

next.hinataoka = normalizeEntry("hinataoka", hinataokaOverride());
applyNarrationGroups(next);
applyAudioCopyOverrides(next);
applyJapaneseSpeechTextPolish(next);

const header = `/* =========================================================
 * 新幹線の窓 — AI車窓実況
 * 台本は data.js の図鑑データを素材に生成し、主要スポットは手書きで調整。
 * 音声は edge-tts で事前生成し audio/ に配置する（app/scripts/generate-narration-audio.ps1 参照）。
 * 位置情報とは無関係の静的データ。座標は持たない（track.js/data.js が単一ソース）。
 * ========================================================= */

`;

fs.writeFileSync(
  narrationPath,
  `${header}var NARRATIONS = ${JSON.stringify(next, null, 2)};\n`,
  "utf8"
);

console.log(`Narration spots: ${Object.keys(next).length}`);
console.log(`Narration entries: ${Object.values(next).reduce((sum, entry) => sum + ["down", "up"].reduce((dSum, dir) => dSum + ["ja", "en"].filter((lang) => entry[dir]?.[lang]?.text).length, 0), 0)}`);
