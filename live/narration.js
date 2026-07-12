/* =========================================================
 * 新幹線の窓 — AI車窓実況
 * 台本は data.js の図鑑データを素材に生成し、主要スポットは手書きで調整。
 * 音声は edge-tts で事前生成し audio/ に配置する（app/scripts/generate-narration-audio.ps1 参照）。
 * 位置情報とは無関係の静的データ。座標は持たない（track.js/data.js が単一ソース）。
 * ========================================================= */

var NARRATIONS = {
  "tokyo-tower": {
    "down": {
      "ja": {
        "text": "まもなく東京タワーです。E席側、東京 → 品川で見えてきます。東京の空に、赤い塔。 東京駅を出て品川へ向かう数分のあいだ、E席側のビルの間に東京タワーが見えます。旅の序盤、都市の景色の中に赤い塔がちらりと立つ。",
        "durationSec": 12,
        "speechText": "まもなく東京タワーです。東京駅を出て品川へ向かう数分のあいだ、E席側のビルの間に赤い塔が見えることがあります。旅の序盤に、東京らしい都市の景色を知らせる合図です。"
      },
      "en": {
        "text": "Tokyo Tower is coming up on the Seat E side, around Tokyo → Shinagawa. A red tower in the Tokyo skyline. In the first few minutes after leaving Tokyo Station for Shinagawa, Tokyo Tower slips between the buildings on the Seat E side. It is a quick urban opening shot: the red tower appears, and the Tokaido Shinkansen window story begins.",
        "durationSec": 28
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に東京タワーが見えてきます。東京の空に、赤い塔。 東京駅を出て品川へ向かう数分のあいだ、E席側のビルの間に東京タワーが見えます。旅の序盤、都市の景色の中に赤い塔がちらりと立つ。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側のビルの間に東京タワーが見えることがあります。旅の終わりに東京の街へ戻ってきたことを知らせる合図です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Tokyo Tower appears on the Seat A side. A red tower in the Tokyo skyline. In the first few minutes after leaving Tokyo Station for Shinagawa, Tokyo Tower slips between the buildings on the Seat E side. It is a quick urban opening shot: the red tower appears, and the Tokaido Shinkansen window story begins.",
        "durationSec": 27
      }
    }
  },
  "hinataoka": {
    "down": {
      "ja": {
        "text": "相模平野越しの富士山が見え始めるころ、E席側の丘にそろった三角屋根も見えてきます。日向岡の街並みです。観光名所というより、知っている人だけが窓を見る車窓。富士山を意識しながら、その手前の丘にも目を向けてください。",
        "speechText": "相模平野越しの富士山が見え始めるころ、E席側の丘にそろった三角屋根も見えてきます。ひなたおかの街並みです。観光名所というより、知っている人だけが窓を見る車窓です。富士山を意識しながら、その手前の丘にも目を向けてください。",
        "durationSec": 14
      },
      "en": {
        "text": "As Mt. Fuji starts to appear beyond the Sagami Plain, watch the Seat E side for rows of matching triangular roofs on the hillside. This is Hinataoka: not a famous landmark, but exactly the kind of small window discovery this guide is made for. Keep Fuji in mind, but let your eyes catch the hillside in front of it too.",
        "durationSec": 28
      }
    },
    "up": {
      "ja": {
        "text": "小田原から新横浜へ向かう途中、A席側の丘にそろった三角屋根がならびます。日向岡の街並みです。大きな名所ではありませんが、相模平野越しの富士山を見ている流れで、手前の丘にも気づけると少し得をした気分になる景色です。",
        "speechText": "小田原から新横浜へ向かう途中、A席側の丘にそろった三角屋根がならびます。ひなたおかの街並みです。大きな名所ではありませんが、相模平野越しの富士山を見ている流れで、手前の丘にも気づけると少し得をした気分になる景色です。",
        "durationSec": 14
      },
      "en": {
        "text": "Between Odawara and Shin-Yokohama, look to Seat A for a hillside of matching triangular roofs. This is Hinataoka: a small, satisfying discovery rather than a headline landmark. If you are already watching Mt. Fuji beyond the Sagami Plain, notice the nearer hillside too.",
        "durationSec": 20
      }
    }
  },
  "ota-fuji": {
    "down": {
      "ja": {
        "text": "まもなく都内からの富士山です。E席側、品川 → 新横浜（大田区付近）で見えてきます。東京を出て、最初の富士。 品川を過ぎて新横浜へ向かう途中、空気が澄んだ日には大田区付近から富士山が見えることがあります。新富士の大きな富士山とは違う、都市の向こうに小さく浮かぶ早い合図。",
        "durationSec": 13,
        "speechText": "まもなく都内からの富士山です。品川を過ぎて新横浜へ向かう途中、空気が澄んだ日にはE席側に小さく富士山が見えることがあります。新富士の大きな富士山とは違う、都市の向こうに小さく浮かぶ早い合図です。"
      },
      "en": {
        "text": "Mt. Fuji from Ota is coming up on the Seat E side, around Shinagawa → Shin-Yokohama. The first Fuji after Tokyo. After Shinagawa, on the way toward Shin-Yokohama, Mt. Fuji can appear from around Ota on especially clear days.",
        "durationSec": 18
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に都内からの富士山が見えてきます。東京を出て、最初の富士。 品川を過ぎて新横浜へ向かう途中、空気が澄んだ日には大田区付近から富士山が見えることがあります。新富士の大きな富士山とは違う、都市の向こうに小さく浮かぶ早い合図。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に都内からの富士山が見えることがあります。新富士付近の主役とは違う、都市の向こうに小さく浮かぶ控えめな富士山です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Mt. Fuji from Ota appears on the Seat A side. The first Fuji after Tokyo. After Shinagawa, on the way toward Shin-Yokohama, Mt. Fuji can appear from around Ota on especially clear days.",
        "durationSec": 17
      }
    }
  },
  "maruko-bridge": {
    "down": {
      "ja": {
        "text": "まもなく多摩川を渡ります。E席側に見える青いアーチが丸子橋。初代は昭和9年、「丸子の渡し」と呼ばれた渡し舟に代わって架けられた橋です。映画「シン・ゴジラ」では、この多摩川一帯が防衛線の舞台になりました。橋の奥の緑は、古代の首長が眠る亀甲山古墳の森。ビル街から川の景色へ、旅の序盤の小さな見せ場です。",
        "durationSec": 16,
        "speechText": "まもなく多摩川を渡ります。E席側に見える青いアーチが丸子橋です。初代は昭和9年、「丸子の渡し」と呼ばれた渡し舟に代わって架けられた橋です。橋の奥の緑は、古代の首長が眠る亀甲山古墳の森です。ビル街から川の景色へ変わる、旅の序盤の小さな見せ場です。"
      },
      "en": {
        "text": "We're about to cross the Tama River. On the Seat E side, look for the blue arch of Maruko Bridge. The first bridge here opened in 1934, replacing an old ferry crossing known as the Maruko Ferry. Film fans may recognize this stretch of the river as the defense line in Shin Godzilla. The wooded rise beyond the bridge hides Kamenokoyama Kofun, an ancient burial mound. From city blocks to open water — the journey's first little scene change.",
        "durationSec": 36
      }
    },
    "up": {
      "ja": {
        "text": "まもなく多摩川を渡ります。A席側の窓に見える青いアーチが丸子橋。初代は昭和9年、「丸子の渡し」と呼ばれた渡し舟に代わって架けられた橋です。映画「シン・ゴジラ」では、この多摩川一帯が防衛線の舞台になりました。新横浜を出て、東京の街へ近づく手前の小さな見せ場です。",
        "durationSec": 13,
        "speechText": "まもなく多摩川を渡ります。A席側の窓に見える青いアーチが丸子橋です。初代は昭和9年、「丸子の渡し」と呼ばれた渡し舟に代わって架けられた橋です。新横浜を出て、東京の街へ近づく手前の小さな見せ場です。"
      },
      "en": {
        "text": "We're about to cross the Tama River. On the Seat A side, look for the blue arch of Maruko Bridge. The first bridge opened in 1934, replacing the old Maruko Ferry. This stretch of the river also appears as the defense line in Shin Godzilla. After Shin-Yokohama, it is a small scene change before the train slips back toward Tokyo.",
        "durationSec": 28
      }
    }
  },
  "musashi-kosugi-towers": {
    "down": {
      "ja": {
        "text": "まもなく武蔵小杉のタワマン群です。E席側、品川 → 新横浜（武蔵小杉付近）で見えてきます。川を越えた、塔の街。 東京から新大阪へ向かうと、丸子橋を過ぎてすぐ、E席側に武蔵小杉のタワマン群が迫ります。多摩川の開けた景色から、縦に伸びる街へ一気に切り替わる瞬間。",
        "durationSec": 12,
        "speechText": "まもなく武蔵小杉のタワマン群です。丸子橋を過ぎてすぐ、E席側に高層ビル群が迫ります。多摩川の開けた景色から、縦に伸びる街へ一気に切り替わる瞬間です。"
      },
      "en": {
        "text": "Musashi-Kosugi Towers is coming up on the Seat E side, around Shinagawa → Shin-Yokohama, around Musashi-Kosugi. A wall of towers after the river. Heading from Tokyo toward Shin-Osaka, just after Maruko Bridge, the Musashi-Kosugi high-rise towers appear on the Seat E side. The view shifts suddenly from the open Tama River to a dense vertical city.",
        "durationSec": 26
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に武蔵小杉のタワマン群が見えてきます。川を越えた、塔の街。 東京から新大阪へ向かうと、丸子橋を過ぎてすぐ、E席側に武蔵小杉のタワマン群が迫ります。多摩川の開けた景色から、縦に伸びる街へ一気に切り替わる瞬間。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に武蔵小杉のタワマン群が見えてきます。多摩川へ近づく手前で、縦に伸びる街の密度が窓いっぱいに広がる瞬間です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Musashi-Kosugi Towers appears on the Seat A side. A wall of towers after the river. Heading from Tokyo toward Shin-Osaka, just after Maruko Bridge, the Musashi-Kosugi high-rise towers appear on the Seat E side. The view shifts suddenly from the open Tama River to a dense vertical city.",
        "durationSec": 24
      }
    }
  },
  "putiputi-sign": {
    "down": {
      "ja": {
        "text": "まもなく私は誰でしょう看板です。A席側、新横浜 → 小田原（藤沢市付近）で見えてきます。私は誰でしょう？ 新横浜から小田原へ向かう途中、A席側に「私は誰でしょう」と問いかける謎の看板が見えます。右上にはQRコードもありますが、新幹線の速度では読み取るのはかなり困難。",
        "durationSec": 13,
        "speechText": "まもなく私は誰でしょう看板です。新横浜から小田原へ向かう途中、A席側に「私は誰でしょう」と問いかける謎の看板が見えます。右上にはQRコードもありますが、新幹線の速度では読み取るのはかなり困難です。"
      },
      "en": {
        "text": "Who am I? Sign is coming up on the Seat A side, around Shin-Yokohama → Odawara, around Fujisawa. Who am I? Between Shin-Yokohama and Odawara, a small mystery sign on the Seat A side asks, 'Who am I?' There is also a QR code in the upper-right corner, but reading it from a Shinkansen window is realistically difficult.",
        "durationSec": 27
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に私は誰でしょう看板が見えてきます。私は誰でしょう？ 新横浜から小田原へ向かう途中、A席側に「私は誰でしょう」と問いかける謎の看板が見えます。右上にはQRコードもありますが、新幹線の速度では読み取るのはかなり困難。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、E席側に私は誰でしょう看板が見えてきます。「私は誰でしょう」と問いかける謎の看板で、右上にはQRコードもありますが、新幹線の速度では読み取るのはかなり困難です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Who am I? Sign appears on the Seat E side. Who am I? Between Shin-Yokohama and Odawara, a small mystery sign on the Seat A side asks, 'Who am I?' There is also a QR code in the upper-right corner, but reading it from a Shinkansen window is realistically difficult.",
        "durationSec": 25
      }
    }
  },
  "727-board": {
    "down": {
      "ja": {
        "text": "まもなく727看板と248看板です。藤沢市葛原付近ではE席側に、727 COSMETICSの白い看板と黄色い248看板が並びます。727はここ以外にも、A席側やE席側で何度か見かける沿線の定番です。乗り慣れている人ほど、あの数字は何だろうと気になっているかもしれません。",
        "durationSec": 17
      },
      "en": {
        "text": "The 727 and 248 signs are coming up. Around Kuzuhara in Fujisawa, look to Seat E for a white 727 COSMETICS sign beside a yellow 248 sign. 727 signs appear at several points along the Tokaido Shinkansen, on different sides depending on the location, so regular riders may have wondered about them for years.",
        "durationSec": 25
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側やE席側に727 COSMETICSの看板がいくつか見えてきます。藤沢市葛原付近では、727の隣に黄色い248看板も並びます。何度も新幹線に乗っている人ほど、あの数字の看板が気になっているかもしれません。",
        "durationSec": 16
      },
      "en": {
        "text": "Around this stretch toward Tokyo, you may see several 727 COSMETICS signs from Seats A or E depending on the exact point. Near Kuzuhara in Fujisawa, a yellow 248 sign appears beside one of them. If you ride the Shinkansen often, those repeated numbers may already feel familiar.",
        "durationSec": 22
      }
    }
  },
  "sagami-fuji": {
    "down": {
      "ja": {
        "text": "東京を出て最初に探したい富士山が、相模平野越しの富士山です。E席側、丹沢と箱根の山なみのあいだに、小さく見えることがあります。新富士付近の主役とは違う、遠くに見つける富士山です。",
        "durationSec": 12
      },
      "en": {
        "text": "This is the first Fuji view worth searching for after leaving Tokyo. On the Seat E side, Mt. Fuji can appear small and distant beyond the Sagami Plain, framed by the Tanzawa and Hakone mountains. It is quieter than the main Fuji view near Shin-Fuji, but the discovery is part of the pleasure.",
        "durationSec": 25
      }
    },
    "up": {
      "ja": {
        "text": "東京へ近づく前に、相模平野越しの富士山をもう一度探してみてください。A席側、丹沢と箱根の山なみの向こうに小さく見えることがあります。旅の終わりに見つける、控えめな富士山です。",
        "durationSec": 12
      },
      "en": {
        "text": "Before the train gets closer to Tokyo, try one more look for Mt. Fuji over the Sagami Plain. On the Seat A side, it can appear small beyond the Tanzawa and Hakone mountains. It is a modest, distant Fuji: a quiet closing view rather than the big main event.",
        "durationSec": 23
      }
    }
  },
  "odawara": {
    "down": {
      "ja": {
        "text": "まもなく熱海と相模湾です。A席側、小田原 → 熱海で見えてきます。街の景色が、海の旅に切りかわる合図。 小田原を過ぎ、熱海が近づくころ、車窓は相模湾へ大きくひらきます。山肌の街、海、岬が一枚の絵になって、東京の街なみが「旅の景色」に変わる瞬間です。",
        "durationSec": 12,
        "speechText": "まもなく熱海と相模湾です。小田原を過ぎ、熱海が近づくころ、A席側の車窓は相模湾へ大きくひらきます。街の景色が、海の旅に切りかわる合図です。"
      },
      "en": {
        "text": "Atami & Sagami Bay is coming up on the Seat A side, around Odawara → Atami. Where the sea begins. After Odawara, as Atami approaches, the window opens wide toward Sagami Bay. Hillside town, sea and headlands fold into one view: the moment the ride stops being a commute and starts being a journey.",
        "durationSec": 25
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に熱海と相模湾が見えてきます。街の景色が、海の旅に切りかわる合図。 小田原を過ぎ、熱海が近づくころ、車窓は相模湾へ大きくひらきます。山肌の街、海、岬が一枚の絵になって、東京の街なみが「旅の景色」に変わる瞬間です。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、E席側に熱海と相模湾が見えてきます。山肌の街、海、岬が一枚の絵のように重なる、海の旅の名残を感じる区間です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Atami & Sagami Bay appears on the Seat E side. Where the sea begins. After Odawara, as Atami approaches, the window opens wide toward Sagami Bay. Hillside town, sea and headlands fold into one view: the moment the ride stops being a commute and starts being a journey.",
        "durationSec": 24
      }
    }
  },
  "odawara-castle": {
    "down": {
      "ja": {
        "text": "まもなく小田原城です。A席側、小田原駅付近で見えてきます。のぞみでは、まばたきする間の城。 小田原駅の前後、A席側に小田原城が一瞬だけ見えます。停車しない列車では本当に短い出会い。",
        "durationSec": 12,
        "speechText": "まもなく小田原城です。小田原駅の前後、A席側に小田原城が一瞬だけ見えます。停車しない列車では本当に短い出会いです。"
      },
      "en": {
        "text": "Odawara Castle is coming up on the Seat A side, around Around Odawara Sta.. A castle in a blink. Around Odawara Station, Odawara Castle flashes by on the Seat A side. On Nozomi services that pass through without stopping, the moment is astonishingly short: a small mark at the beginning of the journey.",
        "durationSec": 25
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に小田原城が見えてきます。のぞみでは、まばたきする間の城。 小田原駅の前後、A席側に小田原城が一瞬だけ見えます。停車しない列車では本当に短い出会い。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、E席側に小田原城が一瞬だけ見えます。停車しない列車では、まばたきする間の短い出会いです。"
      },
      "en": {
        "text": "Heading toward Tokyo, Odawara Castle appears on the Seat E side. A castle in a blink. Around Odawara Station, Odawara Castle flashes by on the Seat A side. On Nozomi services that pass through without stopping, the moment is astonishingly short: a small mark at the beginning of the journey.",
        "durationSec": 23
      }
    }
  },
  "gyoran-kannon": {
    "down": {
      "ja": {
        "text": "まもなく魚籃観音像です。A席側、小田原 → 熱海（早川付近）で見えてきます。一瞬だけ、白い観音様。 小田原を過ぎ、早川駅の近くでA席側を見ていると、白い観音像がほんの一瞬あらわれます。車窓に突然立つ姿は、見逃すと「あれは何だったんだろう」となる発見型スポット。",
        "durationSec": 12,
        "speechText": "まもなく魚籃観音像です。小田原を過ぎ、早川駅の近くでA席側を見ていると、白い観音像がほんの一瞬あらわれます。見逃すと、あれは何だったんだろうとなる発見型スポットです。"
      },
      "en": {
        "text": "Gyoran Kannon Statue is coming up on the Seat A side, around Odawara → Atami, near Hayakawa. A white Kannon, for a heartbeat. Just after Odawara, near Hayakawa Station, a white Kannon statue appears for only a moment on the Seat A side. It is the kind of sudden window-seat sight that leaves you wondering what you just saw.",
        "durationSec": 27
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に魚籃観音像が見えてきます。一瞬だけ、白い観音様。 小田原を過ぎ、早川駅の近くでA席側を見ていると、白い観音像がほんの一瞬あらわれます。車窓に突然立つ姿は、見逃すと「あれは何だったんだろう」となる発見型スポット。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、E席側に魚籃観音像がほんの一瞬あらわれます。白い姿が突然窓に入る、見つけるとうれしい発見型スポットです。"
      },
      "en": {
        "text": "Heading toward Tokyo, Gyoran Kannon Statue appears on the Seat E side. A white Kannon, for a heartbeat. Just after Odawara, near Hayakawa Station, a white Kannon statue appears for only a moment on the Seat A side. It is the kind of sudden window-seat sight that leaves you wondering what you just saw.",
        "durationSec": 25
      }
    }
  },
  "fuji": {
    "down": {
      "ja": {
        "text": "まもなく富士山の主役区間です。三島から新富士にかけて、E席側に富士山が大きく迫ります。見える時間は長くありません。トンネルを抜けるたびに姿が変わるので、スマホより先に、まず窓を見てください。",
        "durationSec": 12
      },
      "en": {
        "text": "The main Mt. Fuji window is coming up. Between Mishima and Shin-Fuji, Fuji rises large on the Seat E side, but the best view does not last long. Its shape changes after each tunnel, so look out the window first and reach for the camera second.",
        "durationSec": 21
      }
    },
    "up": {
      "ja": {
        "text": "新富士から三島へ向かうこの区間は、富士山を大きく見られる主役区間です。東京方面へ向かう場合も、A席側に注意してください。近くで見る富士山は一瞬ごとに形が変わります。雲があっても、切れ間を待つ価値があります。",
        "durationSec": 13
      },
      "en": {
        "text": "Between Shin-Fuji and Mishima, this is the main close-up Mt. Fuji stretch. Toward Tokyo, keep an eye on the Seat A side. From this distance, the mountain changes with every moment and every cloud break, so even an imperfect sky is worth watching.",
        "durationSec": 20
      }
    }
  },
  "left-fuji": {
    "down": {
      "ja": {
        "text": "まもなく左富士です。A席側、静岡駅を過ぎ、安倍川を渡ってまもなくで見えてきます。海側A席に、28秒だけ富士山。 東京から新大阪方面へ向かうなら、静岡駅を過ぎ、安倍川を渡ってまもなく。ふつう富士山はE席のものですが、この短い区間だけ反対のA席側にあらわれます。",
        "durationSec": 12,
        "speechText": "まもなく左富士です。東京から新大阪方面へ向かうなら、静岡駅を過ぎ、安倍川を渡ってまもなく、A席側に富士山が現れます。ふつう富士山はE席側ですが、この短い区間だけ反対側に見える特別な車窓です。"
      },
      "en": {
        "text": "Left-Side Fuji is coming up on the Seat A side, around Just after Shizuoka Sta. and the Abe River. For 28 seconds, Fuji switches sides. Heading from Tokyo toward Shin-Osaka, start looking just after Shizuoka Station, soon after crossing the Abe River. Mt.",
        "durationSec": 20
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に左富士が見えてきます。海側A席に、28秒だけ富士山。 東京から新大阪方面へ向かうなら、静岡駅を過ぎ、安倍川を渡ってまもなく。ふつう富士山はE席のものですが、この短い区間だけ反対のA席側にあらわれます。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、E席側に左富士の区間が来ます。静岡駅の近くで、いつもとは反対側に富士山が見える短い特別区間です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Left-Side Fuji appears on the Seat E side. For 28 seconds, Fuji switches sides. Heading from Tokyo toward Shin-Osaka, start looking just after Shizuoka Station, soon after crossing the Abe River. Mt.",
        "durationSec": 16
      }
    }
  },
  "shimizu-port-chikyu": {
    "down": {
      "ja": {
        "text": "まもなく清水港とちきゅうです。A席側、新富士 → 静岡で見えてきます。港のクレーンと、ちきゅう。 新富士から静岡へ向かう途中、A席側に清水港のクレーン群が見えてきます。停泊していれば、地球深部探査船「ちきゅう」も窓に入ります。",
        "durationSec": 12,
        "speechText": "まもなく清水港とちきゅうです。新富士から静岡へ向かう途中、A席側に清水港のクレーン群が見えてきます。停泊していれば、地球深部探査船ちきゅうも窓に入ります。"
      },
      "en": {
        "text": "Shimizu Port and CHIKYU is coming up on the Seat A side, around Shin-Fuji → Shizuoka. Cranes and CHIKYU. Between Shin-Fuji and Shizuoka, look from Seat A for Shimizu Port: gantry cranes, and sometimes the deep-sea drilling vessel CHIKYU. After Mt.",
        "durationSec": 19
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に清水港とちきゅうが見えてきます。港のクレーンと、ちきゅう。 新富士から静岡へ向かう途中、A席側に清水港のクレーン群が見えてきます。停泊していれば、地球深部探査船「ちきゅう」も窓に入ります。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、E席側に清水港のクレーン群が見えてきます。停泊していれば、地球深部探査船ちきゅうも窓に入る区間です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Shimizu Port and CHIKYU appears on the Seat E side. Cranes and CHIKYU. Between Shin-Fuji and Shizuoka, look from Seat A for Shimizu Port: gantry cranes, and sometimes the deep-sea drilling vessel CHIKYU. After Mt.",
        "durationSec": 18
      }
    }
  },
  "shizuoka-tea-fields": {
    "down": {
      "ja": {
        "text": "まもなく静岡の茶畑です。E席側、静岡 → 掛川で見えてきます。緑の畝が、車窓を走る。 掛川城の少し手前、車窓に茶畑の緑が流れる区間があります。富士山や城ほど大きな目印ではありません。",
        "durationSec": 12,
        "speechText": "まもなく静岡の茶畑です。掛川城の少し手前、E席側の車窓に茶畑の緑が流れる区間があります。富士山や城ほど大きな目印ではありませんが、静岡らしい景色です。"
      },
      "en": {
        "text": "Shizuoka Tea Fields is coming up on the Seat E side, around Shizuoka → Kakegawa. Rows of green tea from the window. A little before Kakegawa Castle, rows of tea fields can slide past the window. It is not as obvious as Mt.",
        "durationSec": 20
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に静岡の茶畑が見えてきます。緑の畝が、車窓を走る。 掛川城の少し手前、車窓に茶畑の緑が流れる区間があります。富士山や城ほど大きな目印ではありません。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に静岡の茶畑が見えてきます。緑の畝が車窓を流れる、静岡らしい短い区間です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Shizuoka Tea Fields appears on the Seat A side. Rows of green tea from the window. A little before Kakegawa Castle, rows of tea fields can slide past the window. It is not as obvious as Mt.",
        "durationSec": 19
      }
    }
  },
  "kakegawa": {
    "down": {
      "ja": {
        "text": "まもなく掛川城です。E席側、掛川駅 前後で見えてきます。駅のすぐそばに、木造復元の天守。 掛川駅の北側、車窓から探せる距離に掛川城の天守があります。日本初の木造復元天守。",
        "durationSec": 12,
        "speechText": "まもなく掛川城です。掛川駅の北側、E席側の車窓から探せる距離に掛川城の天守があります。日本初の木造復元天守です。"
      },
      "en": {
        "text": "Kakegawa Castle is coming up on the Seat E side, around Around Kakegawa Sta.. A castle keep, right by the tracks. Just north of Kakegawa Station stands Kakegawa Castle — Japan's first wooden-reconstructed keep. It appears only briefly, but it adds a line of history to the Shizuoka stretch.",
        "durationSec": 23
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に掛川城が見えてきます。駅のすぐそばに、木造復元の天守。 掛川駅の北側、車窓から探せる距離に掛川城の天守があります。日本初の木造復元天守。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に掛川城が見えてきます。駅のすぐそばにある、日本初の木造復元天守です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Kakegawa Castle appears on the Seat A side. A castle keep, right by the tracks. Just north of Kakegawa Station stands Kakegawa Castle — Japan's first wooden-reconstructed keep. It appears only briefly, but it adds a line of history to the Shizuoka stretch.",
        "durationSec": 21
      }
    }
  },
  "genki-sign": {
    "down": {
      "ja": {
        "text": "まもなくしっぺいの応援看板です。E席側、掛川 → 浜松（磐田付近）で見えてきます。元気が出る三連看板。 掛川を過ぎて浜松へ向かう途中、ハウス食品静岡工場を過ぎて少ししたあたりのE席側に、磐田市のキャラクター・しっぺいが描かれた三連続の応援看板が並びます。「いつも 応援してるよ」「みんな ありがとう」「必ず 明日があるからね」。",
        "durationSec": 15,
        "speechText": "まもなくしっぺいの応援看板です。掛川を過ぎて浜松へ向かう途中、E席側に磐田市のキャラクター、しっぺいが描かれた三連続の応援看板が並びます。いつも応援してるよ、みんなありがとう、必ず明日があるからね、という短いメッセージが続きます。"
      },
      "en": {
        "text": "Shippei Cheer-up Signs is coming up on the Seat E side, around Kakegawa → Hamamatsu, near Iwata. Three signs that lift the ride. After Kakegawa, heading toward Hamamatsu, three small roadside signs appear on the Seat E side shortly after the House Foods Shizuoka Factory area. They feature Shippei, Iwata City's white dog character.",
        "durationSec": 25
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側にしっぺいの応援看板が見えてきます。元気が出る三連看板。 掛川を過ぎて浜松へ向かう途中、ハウス食品静岡工場を過ぎて少ししたあたりのE席側に、磐田市のキャラクター・しっぺいが描かれた三連続の応援看板が並びます。「いつも 応援してるよ」「みんな ありがとう」「必ず 明日があるからね」。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側にしっぺいの応援看板が見えてきます。三連続の看板に、いつも応援してるよ、みんなありがとう、必ず明日があるからね、という短いメッセージが続きます。"
      },
      "en": {
        "text": "Heading toward Tokyo, Shippei Cheer-up Signs appears on the Seat A side. Three signs that lift the ride. After Kakegawa, heading toward Hamamatsu, three small roadside signs appear on the Seat E side shortly after the House Foods Shizuoka Factory area. They feature Shippei, Iwata City's white dog character.",
        "durationSec": 23
      }
    }
  },
  "hamanako": {
    "down": {
      "ja": {
        "text": "浜名湖の区間に入ります。ここはE席だけでなく、A席にも水辺と橋が広がる、両側で楽しい車窓です。列車が湖の上を走っているように感じる数分間。空気が澄んでいれば、E席側の湖と空のさらに奥に、小さく富士山も探せます。",
        "durationSec": 14,
        "speechText": "浜名湖の区間に入ります。ここはE席だけでなく、A席にも水辺と橋が広がる、両側で楽しい車窓です。列車が湖の上を走っているように感じる数分間です。空気が澄んでいれば、E席側の湖と空のさらに奥に、小さく富士山も探せます。"
      },
      "en": {
        "text": "We are entering the Lake Hamana stretch. This is a rare view that works on both sides: water, bridges, and open sky spread beyond Seats A and E. For a few minutes the train feels as if it is running over the lake. In clear air, look from Seat E for a tiny Mt. Fuji far beyond the water.",
        "durationSec": 27
      }
    },
    "up": {
      "ja": {
        "text": "浜名湖を渡ります。東京方面へ向かう場合も、A席とE席の両方に水辺の景色があります。湖面、橋、養殖いかだが次々に流れる区間です。晴れて空気が澄んだ日は、E席側に浜名湖越しの富士山が見えることもあります。",
        "durationSec": 13,
        "speechText": "浜名湖を渡ります。東京方面へ向かう場合も、A席とE席の両方に水辺の景色があります。湖面、橋、養殖いかだが次々に流れる区間です。晴れて空気が澄んだ日は、E席側に浜名湖越しの富士山が見えることもあります。"
      },
      "en": {
        "text": "The train is crossing Lake Hamana. Toward Tokyo, both Seat A and Seat E can get water views: lake surface, bridges, and eel-farming rafts sliding past the window. On especially clear days, Seat E may also catch the rare Mt. Fuji view beyond the lake.",
        "durationSec": 21
      }
    },
    "group": "hamanako-lake-fuji"
  },
  "hamanako-fuji": {
    "down": {
      "ja": {
        "text": "浜名湖越しの富士山は、見えたらかなり幸運な車窓です。E席側、湖と空のさらに奥に、小さく富士山が出ることがあります。新富士の迫力とは逆で、遠くにあるものを探し当てる楽しさです。",
        "durationSec": 12,
        "speechText": "浜名湖越しの富士山は、見えたらかなり幸運な車窓です。E席側、湖と空のさらに奥に、小さく富士山が出ることがあります。新富士の迫力とは逆で、遠くにあるものを探し当てる楽しさです。"
      },
      "en": {
        "text": "Mt. Fuji beyond Lake Hamana is a lucky-window view. On the Seat E side, look far past the lake and sky for a small Fuji. This is the opposite of the dramatic Shin-Fuji view: the joy is in finding something distant and quiet.",
        "durationSec": 20
      }
    },
    "up": {
      "ja": {
        "text": "浜名湖越しの富士山を探すなら、東京方面でもE席側です。湖の向こう、かなり遠くに小さく見えることがあります。冬の晴れた日など、空気が澄んだときだけのごほうびです。",
        "durationSec": 12,
        "speechText": "浜名湖越しの富士山を探すなら、東京方面でもE席側です。湖の向こう、かなり遠くに小さく見えることがあります。冬の晴れた日など、空気が澄んだときだけのごほうびです。"
      },
      "en": {
        "text": "Toward Tokyo, the Lake Hamana Fuji view is still on the Seat E side. Look far beyond the lake for a very small Mt. Fuji. It is a reward for crisp, clear days, especially in winter.",
        "durationSec": 16
      }
    },
    "group": "hamanako-lake-fuji"
  },
  "toyohashi-tateiwa": {
    "down": {
      "ja": {
        "text": "まもなく豊橋の立岩です。E席側、浜松 → 豊橋で見えてきます。浜名湖のあと、岩が立つ。 東京から大阪方面へ向かう新幹線で、浜名湖を過ぎて少しすると、丘の上に岩が突き出した景色が見えてきます。豊橋の立岩。",
        "durationSec": 12,
        "speechText": "まもなく豊橋の立岩です。浜名湖を過ぎて少しすると、E席側の丘の上に岩が突き出した景色が見えてきます。大きな観光名所ではありませんが、見つけると印象に残る地形です。"
      },
      "en": {
        "text": "Toyohashi Tateiwa Rock is coming up on the Seat E side, around Hamamatsu → Toyohashi. A standing rock after Lake Hamana. On a Shinkansen heading from Tokyo toward Osaka, shortly after Lake Hamana, a rock jutting up from a hill comes into view on the mountain side. This is Toyohashi Tateiwa.",
        "durationSec": 24
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に豊橋の立岩が見えてきます。浜名湖のあと、岩が立つ。 東京から大阪方面へ向かう新幹線で、浜名湖を過ぎて少しすると、丘の上に岩が突き出した景色が見えてきます。豊橋の立岩。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に豊橋の立岩が見えてきます。丘の上に岩が突き出した、短い時間だけ探せる地形の車窓です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Toyohashi Tateiwa Rock appears on the Seat A side. A standing rock after Lake Hamana. On a Shinkansen heading from Tokyo toward Osaka, shortly after Lake Hamana, a rock jutting up from a hill comes into view on the mountain side. This is Toyohashi Tateiwa.",
        "durationSec": 22
      }
    }
  },
  "mikawa-oshima": {
    "down": {
      "ja": {
        "text": "まもなく三河大島です。豊橋を過ぎたあと、A席側に三河湾と小さな島影が見えることがあります。大きな観光名所というより、海の向こうにぽつんと浮かぶ発見型の車窓です。見通しがよい日に、海側の窓を探してみてください。",
        "durationSec": 13
      },
      "en": {
        "text": "Mikawa Oshima is coming up on the Seat A side, around Toyohashi → Mikawa-Anjo. A small island beyond the bay. After Toyohashi, Mikawa Bay and Mikawa Oshima may appear on the Seat A side. It is less a famous landmark than a small island silhouette that quietly rewards a window-seat glance.",
        "durationSec": 24
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に三河湾と三河大島が見えることがあります。窓の外に一瞬だけ現れる小さな島影です。浜名湖のあとにも、海側にはまだ見つける楽しみがあります。",
        "durationSec": 12
      },
      "en": {
        "text": "Heading toward Tokyo, Mikawa Oshima appears on the Seat E side. A small island beyond the bay. After Toyohashi, Mikawa Bay and Mikawa Oshima may appear on the Seat A side. It is less a famous landmark than a small island silhouette that quietly rewards a window-seat glance.",
        "durationSec": 22
      }
    }
  },
  "nichiban-anjo": {
    "down": {
      "ja": {
        "text": "まもなくセロテープの壁看板です。三河安城の少し手前で、E席側にニチバン安城工場の大きな壁看板が見えてきます。赤、白、青のセロテープ広告が工場の壁いっぱいに現れる、東海道新幹線らしい沿線の発見です。",
        "durationSec": 13
      },
      "en": {
        "text": "CELLOTAPE Wall Sign is coming up on the Seat E side, around Around Mikawa-Anjo. A giant tape sign. On trains from Tokyo toward Nagoya, the large CELLOTAPE wall sign at the Nichiban Anjo Factory appears on the Seat E side shortly before Mikawa-Anjo. In the opposite direction, look just after Mikawa-Anjo.",
        "durationSec": 24
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かう場合は、三河安城を出てすぐ、A席側にセロテープの壁看板が見えてきます。ニチバン安城工場の壁いっぱいに、赤、白、青の広告が大きく現れます。ただの広告なのに、妙に記憶に残る車窓です。",
        "durationSec": 13
      },
      "en": {
        "text": "Heading toward Tokyo, CELLOTAPE Wall Sign appears on the Seat A side. A giant tape sign. On trains from Tokyo toward Nagoya, the large CELLOTAPE wall sign at the Nichiban Anjo Factory appears on the Seat E side shortly before Mikawa-Anjo. In the opposite direction, look just after Mikawa-Anjo.",
        "durationSec": 23
      }
    }
  },
  "nagoya-station-skyline": {
    "down": {
      "ja": {
        "text": "まもなく名古屋駅前です。E席側の車窓が、高層ビル、駅前の密度、線路の重なりへ一気に切り替わります。山や城とは違いますが、名古屋に着くことを知らせる大事な都市の車窓です。",
        "durationSec": 12
      },
      "en": {
        "text": "Nagoya Station Skyline is coming up on the Seat E side, around Just before Nagoya. The train cuts through the city. On trains from Tokyo toward Shin-Osaka, the window suddenly turns urban just before arriving at Nagoya: high-rise buildings, dense station-front blocks, and layers of tracks. It is not a mountain or a castle, but it is an essential view that signals Nagoya is coming.",
        "durationSec": 30
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に名古屋駅前の高層ビル群が見えてきます。駅前の密度と線路の重なりが、名古屋の大きさを短い時間で見せてくれます。",
        "durationSec": 12
      },
      "en": {
        "text": "Heading toward Tokyo, Nagoya Station Skyline appears on the Seat A side. The train cuts through the city. On trains from Tokyo toward Shin-Osaka, the window suddenly turns urban just before arriving at Nagoya: high-rise buildings, dense station-front blocks, and layers of tracks. It is not a mountain or a castle, but it is an essential view that signals Nagoya is coming.",
        "durationSec": 29
      }
    }
  },
  "kirin-beer-factory": {
    "down": {
      "ja": {
        "text": "名古屋を出てしばらくすると、E席側にキリンビール名古屋工場のタンクが並びます。遠目には巨大な生ビールが並んでいるようにも見えます。このすぐ先には清洲城も近づくので、工場のあとも窓から目を離さないでください。",
        "durationSec": 13
      },
      "en": {
        "text": "After leaving Nagoya, look to Seat E for the Kirin Beer Nagoya Factory. Its storage tanks can look like giant glasses of draft beer lined up beside the tracks. Keep watching after the factory too: Kiyosu Castle comes up very close soon after.",
        "durationSec": 20
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、清洲城のあとにキリンビール名古屋工場のタンクが見えてきます。A席側、線路沿いに巨大な生ビールのようなタンクが並ぶ、少し楽しい産業風景です。",
        "durationSec": 12
      },
      "en": {
        "text": "Toward Tokyo, the Kirin Beer Nagoya Factory appears after Kiyosu Castle. On the Seat A side, its storage tanks line up beside the tracks like oversized draft beers: a playful little industrial scene from the window.",
        "durationSec": 17
      }
    }
  },
  "kiyosu": {
    "down": {
      "ja": {
        "text": "キリンビール工場を過ぎたら、次は清洲城です。E席側、線路のすぐ近くに城があらわれます。織田信長が天下取りを始めた場所で、清洲会議の舞台でもあります。新幹線が城にここまで近づく瞬間は、そう多くありません。",
        "durationSec": 13
      },
      "en": {
        "text": "After the Kirin Beer Factory, watch for Kiyosu Castle on the Seat E side, surprisingly close to the line. This is where Oda Nobunaga began his rise to power, and later the stage of the Kiyosu Conference. The Shinkansen rarely gets this close to a castle.",
        "durationSec": 21
      }
    },
    "up": {
      "ja": {
        "text": "名古屋へ入る少し前、A席側に清洲城が近づきます。織田信長が天下取りを始めた城で、清洲会議の舞台でもあります。このあとキリンビール工場のタンクも続くので、この区間は短い見どころが連続します。",
        "durationSec": 12
      },
      "en": {
        "text": "Shortly before Nagoya, Kiyosu Castle appears close on the Seat A side. It is tied to Oda Nobunaga's rise and the famous Kiyosu Conference. The Kirin Beer Factory follows soon after, so this stretch packs several quick window discoveries together.",
        "durationSec": 19
      }
    }
  },
  "solar-ark": {
    "down": {
      "ja": {
        "text": "まもなくソーラーアークです。名古屋を出て清洲城を過ぎ、岐阜羽島へ近づくころ、E席側に巨大な弧を描く建物が現れます。かつて三洋電機、現在のパナソニックによって建てられた太陽光発電モニュメントです。",
        "durationSec": 13
      },
      "en": {
        "text": "Solar Ark is coming up on the Seat E side, around Nagoya → Gifu-Hashima. A giant solar ship, out of nowhere. After Nagoya and Kiyosu Castle, as the train approaches Gifu-Hashima, the Solar Ark sweeps into view on the Seat E side: a huge dark arc beside the line. Built in Anpachi, Gifu by Sanyo Electric, now part of Panasonic, it is a 315-meter-long, 37-meter-tall solar power monument.",
        "durationSec": 31
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側にソーラーアークが見えてきます。巨大な弧を描く建物で、かつて太陽光発電の象徴として建てられたモニュメントです。名所案内には出にくいですが、一度見つけると忘れにくい車窓です。",
        "durationSec": 14
      },
      "en": {
        "text": "Heading toward Tokyo, Solar Ark appears on the Seat A side. A giant solar ship, out of nowhere. After Nagoya and Kiyosu Castle, as the train approaches Gifu-Hashima, the Solar Ark sweeps into view on the Seat E side: a huge dark arc beside the line. Built in Anpachi, Gifu by Sanyo Electric, now part of Panasonic, it is a 315-meter-long, 37-meter-tall solar power monument.",
        "durationSec": 30
      }
    }
  },
  "gifu-castle": {
    "down": {
      "ja": {
        "text": "まもなく岐阜城です。E席側、岐阜羽島 → 米原で見えてきます。山の上に、小さな城。 岐阜羽島を過ぎ、木曽三川を渡る前後で、E席側の遠くに金華山が見えることがあります。その山頂にあるのが岐阜城。",
        "durationSec": 13,
        "speechText": "まもなく岐阜城です。岐阜羽島を過ぎ、木曽三川を渡る前後で、E席側の遠くに金華山が見えることがあります。その山頂にあるのが岐阜城です。線路からは離れているので、晴れた日に少し集中して探してみてください。"
      },
      "en": {
        "text": "Gifu Castle is coming up on the Seat E side, around Gifu-Hashima → Maibara. A tiny castle on a mountain. After Gifu-Hashima, around the Kiso Three Rivers, Mt. Kinka may be visible far away on the Seat E side.",
        "durationSec": 18
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に岐阜城が見えてきます。山の上に、小さな城。 岐阜羽島を過ぎ、木曽三川を渡る前後で、E席側の遠くに金華山が見えることがあります。その山頂にあるのが岐阜城。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側の遠くに金華山が見えることがあります。その山頂にあるのが岐阜城です。線路からは離れているので、晴れた日に少し集中して探してみてください。"
      },
      "en": {
        "text": "Heading toward Tokyo, Gifu Castle appears on the Seat A side. A tiny castle on a mountain. After Gifu-Hashima, around the Kiso Three Rivers, Mt. Kinka may be visible far away on the Seat E side.",
        "durationSec": 17
      }
    }
  },
  "kinshozan": {
    "down": {
      "ja": {
        "text": "まもなく金生山です。E席側、岐阜羽島 → 米原（大垣付近）で見えてきます。消えた岐阜のピラミッド。 岐阜羽島を過ぎて大垣へ向かうあたり、E席側に白く削られた山肌が見えます。金生山は石灰岩の山で、かつては「岐阜のピラミッド」と呼ばれた四角錐の山頂部分が車窓から見えました。",
        "durationSec": 12,
        "speechText": "まもなく金生山です。岐阜羽島を過ぎて大垣へ向かうあたり、E席側に白く削られた山肌が見えます。金生山は石灰岩の山で、かつて消えた岐阜のピラミッドとも呼ばれた山です。"
      },
      "en": {
        "text": "Mt. Kinsho is coming up on the Seat E side, around Gifu-Hashima → Maibara, near Ogaki. The vanished Gifu pyramid. After Gifu-Hashima, near Ogaki, a pale quarried mountainside appears on the Seat E side. Mt.",
        "durationSec": 16
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に金生山が見えてきます。消えた岐阜のピラミッド。 岐阜羽島を過ぎて大垣へ向かうあたり、E席側に白く削られた山肌が見えます。金生山は石灰岩の山で、かつては「岐阜のピラミッド」と呼ばれた四角錐の山頂部分が車窓から見えました。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に金生山が見えてきます。白く削られた山肌が特徴の石灰岩の山で、かつて消えた岐阜のピラミッドとも呼ばれました。"
      },
      "en": {
        "text": "Heading toward Tokyo, Mt. Kinsho appears on the Seat A side. The vanished Gifu pyramid. After Gifu-Hashima, near Ogaki, a pale quarried mountainside appears on the Seat E side. Mt.",
        "durationSec": 14
      }
    }
  },
  "ibuki": {
    "down": {
      "ja": {
        "text": "岐阜羽島から米原へ向かうと、E席側に伊吹山が大きく構えます。古事記にも登場する近江の名山で、冬の雪化粧はとくに見事です。このあたりは関ヶ原。歴史が動いた土地を、いま新幹線で一気に抜けています。",
        "durationSec": 12
      },
      "en": {
        "text": "Between Gifu-Hashima and Maibara, Mt. Ibuki rises on the Seat E side. It is a storied mountain of Omi, appearing in Japan's oldest chronicles, and it is especially striking under winter snow. This is Sekigahara country: historic ground passing by at Shinkansen speed.",
        "durationSec": 20
      }
    },
    "up": {
      "ja": {
        "text": "米原から岐阜羽島へ向かうこの区間では、A席側に伊吹山が大きく見えます。冬は雪をかぶり、関ヶ原の地形を見守るように立つ山です。東京方面へ戻る旅でも、ここは少し窓を見る価値があります。",
        "durationSec": 12
      },
      "en": {
        "text": "Between Maibara and Gifu-Hashima, Mt. Ibuki stands large on the Seat A side. In winter it often wears snow, watching over the Sekigahara landscape. Even on the way back toward Tokyo, this is a stretch worth looking up for.",
        "durationSec": 18
      }
    }
  },
  "nangu-taisha": {
    "down": {
      "ja": {
        "text": "まもなく南宮大社です。A席側、岐阜羽島 → 米原で見えてきます。田園の向こうに、大鳥居。 東京から新大阪方面へ向かう列車では、岐阜羽島を出て関ヶ原へ向かう途中、A席側の田園の向こうに南宮大社の大鳥居が見えます。新大阪から東京方面へ向かう場合は、米原を出て関ヶ原を越えたあと、岐阜羽島へ向かう途中のA席側です。",
        "durationSec": 12,
        "speechText": "まもなく南宮大社です。岐阜羽島を出て関ヶ原へ向かう途中、A席側の田園の向こうに南宮大社の大鳥居が見えます。田園の中に赤い鳥居を探す車窓です。"
      },
      "en": {
        "text": "Nangu Taisha Shrine is coming up on the Seat A side, around Gifu-Hashima → Maibara. A torii beyond the fields. From Tokyo toward Shin-Osaka, look from Seat A after Gifu-Hashima as the train heads toward Sekigahara. From Shin-Osaka toward Tokyo, look from Seat A after Maibara and Sekigahara, before Gifu-Hashima.",
        "durationSec": 23
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に南宮大社が見えてきます。田園の向こうに、大鳥居。 東京から新大阪方面へ向かう列車では、岐阜羽島を出て関ヶ原へ向かう途中、A席側の田園の向こうに南宮大社の大鳥居が見えます。新大阪から東京方面へ向かう場合は、米原を出て関ヶ原を越えたあと、岐阜羽島へ向かう途中のA席側です。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、E席側に南宮大社の大鳥居が見えてきます。田園の向こうに赤い鳥居を探す、関ヶ原近くの短い車窓です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Nangu Taisha Shrine appears on the Seat E side. A torii beyond the fields. From Tokyo toward Shin-Osaka, look from Seat A after Gifu-Hashima as the train heads toward Sekigahara. From Shin-Osaka toward Tokyo, look from Seat A after Maibara and Sekigahara, before Gifu-Hashima.",
        "durationSec": 22
      }
    }
  },
  "sawayama-castle": {
    "down": {
      "ja": {
        "text": "まもなく佐和山城跡です。E席側、米原 → 京都で見えてきます。石田三成の城跡を、田んぼ越しに。 米原を過ぎて少し、E席側に佐和山城跡の山と看板が見えることがあります。佐和山城は、関ヶ原の戦いで敗れた石田三成の居城。",
        "durationSec": 12,
        "speechText": "まもなく佐和山城跡です。米原を過ぎて少し、E席側に佐和山城跡の山と看板が見えることがあります。佐和山城は、関ヶ原の戦いで敗れた石田三成の居城です。"
      },
      "en": {
        "text": "Sawayama Castle Ruins is coming up on the Seat E side, around Maibara → Kyoto. Mitsunari's hill beyond the fields. Soon after Maibara, the hill and sign for Sawayama Castle may appear on the Seat E side. This was the castle of Ishida Mitsunari, defeated at Sekigahara.",
        "durationSec": 22
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に佐和山城跡が見えてきます。石田三成の城跡を、田んぼ越しに。 米原を過ぎて少し、E席側に佐和山城跡の山と看板が見えることがあります。佐和山城は、関ヶ原の戦いで敗れた石田三成の居城。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に佐和山城跡が見えてきます。石田三成の居城だった山城跡を、田んぼ越しに探す車窓です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Sawayama Castle Ruins appears on the Seat A side. Mitsunari's hill beyond the fields. Soon after Maibara, the hill and sign for Sawayama Castle may appear on the Seat E side. This was the castle of Ishida Mitsunari, defeated at Sekigahara.",
        "durationSec": 20
      }
    }
  },
  "hikone-castle": {
    "down": {
      "ja": {
        "text": "まもなく彦根城です。E席側、米原 → 京都で見えてきます。国宝の天守を、街の向こうに。 米原を出たあと、E席側の街並みの向こうに彦根城の天守が小さく見えることがあります。大きくはありません。",
        "durationSec": 12,
        "speechText": "まもなく彦根城です。米原を出たあと、E席側の街並みの向こうに彦根城の天守が小さく見えることがあります。国宝の天守が、街の向こうに少しだけ現れる区間です。"
      },
      "en": {
        "text": "Hikone Castle is coming up on the Seat E side, around Maibara → Kyoto. A tiny National Treasure keep. After Maibara, Hikone Castle's keep may appear small beyond the town on the Seat E side. It is not a big, obvious view; that is what makes spotting it satisfying.",
        "durationSec": 23
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に彦根城が見えてきます。国宝の天守を、街の向こうに。 米原を出たあと、E席側の街並みの向こうに彦根城の天守が小さく見えることがあります。大きくはありません。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に彦根城が見えてきます。国宝の天守が街の向こうに小さく見えることがあります。"
      },
      "en": {
        "text": "Heading toward Tokyo, Hikone Castle appears on the Seat A side. A tiny National Treasure keep. After Maibara, Hikone Castle's keep may appear small beyond the town on the Seat E side. It is not a big, obvious view; that is what makes spotting it satisfying.",
        "durationSec": 21
      }
    }
  },
  "kannonji-castle": {
    "down": {
      "ja": {
        "text": "まもなく観音寺城跡です。E席側、米原 → 京都で見えてきます。山の稜線に、六角氏の城跡を探す。 安土の近く、E席側の山並みに観音寺城跡が見えることがあります。天守を見るスポットではなく、山城のあった稜線を探す車窓です。",
        "durationSec": 12,
        "speechText": "まもなく観音寺城跡です。安土の近く、E席側の山並みに観音寺城跡が見えることがあります。天守ではなく、山城のあった稜線を探す車窓です。"
      },
      "en": {
        "text": "Kannonji Castle Ruins is coming up on the Seat E side, around Maibara → Kyoto. A castle ridge in the mountains. Near Azuchi, the ridge of Kannonji Castle may be visible on the Seat E side. This is not a keep-spotting view; it is about reading the mountain where a Sengoku-period castle once stood.",
        "durationSec": 25
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に観音寺城跡が見えてきます。山の稜線に、六角氏の城跡を探す。 安土の近く、E席側の山並みに観音寺城跡が見えることがあります。天守を見るスポットではなく、山城のあった稜線を探す車窓です。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に観音寺城跡が見えてきます。六角氏の城跡があった山の稜線を探す車窓です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Kannonji Castle Ruins appears on the Seat A side. A castle ridge in the mountains. Near Azuchi, the ridge of Kannonji Castle may be visible on the Seat E side. This is not a keep-spotting view; it is about reading the mountain where a Sengoku-period castle once stood.",
        "durationSec": 24
      }
    }
  },
  "omi-fuji": {
    "down": {
      "ja": {
        "text": "まもなく近江富士です。A席側、米原 → 京都で見えてきます。琵琶湖の手前、もうひとつの富士。 米原を出てしばらくすると、A席側に三角の美しい山が見えてきます。三上山、別名・近江富士。",
        "durationSec": 12,
        "speechText": "まもなく近江富士です。米原を出てしばらくすると、A席側に三角の美しい山が見えてきます。三上山、別名、近江富士です。"
      },
      "en": {
        "text": "Omi Fuji is coming up on the Seat A side, around Maibara → Kyoto. Another Fuji, before Kyoto. After Maibara, look from Seat A for Mt. Mikami, nicknamed Omi Fuji for its clean triangular shape.",
        "durationSec": 16
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、E席側に近江富士が見えてきます。琵琶湖の手前、もうひとつの富士。 米原を出てしばらくすると、A席側に三角の美しい山が見えてきます。三上山、別名・近江富士。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、E席側に近江富士が見えてきます。琵琶湖の手前で見える三角の美しい山、三上山です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Omi Fuji appears on the Seat E side. Another Fuji, before Kyoto. After Maibara, look from Seat A for Mt. Mikami, nicknamed Omi Fuji for its clean triangular shape.",
        "durationSec": 15
      }
    }
  },
  "seta-karahashi": {
    "down": {
      "ja": {
        "text": "まもなく瀬田の唐橋です。E席側、米原 → 京都で見えてきます。川に架かる、京の手前の橋。 京都へ近づく少し前、E席側に瀬田川と瀬田の唐橋が見えてきます。日本書紀にも登場する交通の要衝で、古くから「唐橋を制するものは天下を制する」と言われた橋。",
        "durationSec": 12,
        "speechText": "まもなく瀬田の唐橋です。京都へ近づく少し前、E席側に瀬田川と瀬田の唐橋が見えてきます。日本書紀にも登場する交通の要衝で、古くから知られる橋です。"
      },
      "en": {
        "text": "Seta no Karahashi Bridge is coming up on the Seat E side, around Maibara → Kyoto. A bridge before Kyoto. A little before Kyoto, Seat E may open onto the Seta River and Seta no Karahashi Bridge. It is an old strategic crossing, even appearing in early Japanese chronicles, and is linked to the idea behind the proverb 'more haste, less speed.",
        "durationSec": 29
      }
    },
    "up": {
      "ja": {
        "text": "東京方面へ向かうこのあたりでは、A席側に瀬田の唐橋が見えてきます。川に架かる、京の手前の橋。 京都へ近づく少し前、E席側に瀬田川と瀬田の唐橋が見えてきます。日本書紀にも登場する交通の要衝で、古くから「唐橋を制するものは天下を制する」と言われた橋。",
        "durationSec": 12,
        "speechText": "東京方面へ向かうこのあたりでは、A席側に瀬田の唐橋が見えてきます。瀬田川に架かる、京都の手前で探したい歴史ある橋です。"
      },
      "en": {
        "text": "Heading toward Tokyo, Seta no Karahashi Bridge appears on the Seat A side. A bridge before Kyoto. A little before Kyoto, Seat E may open onto the Seta River and Seta no Karahashi Bridge. It is an old strategic crossing, even appearing in early Japanese chronicles, and is linked to the idea behind the proverb 'more haste, less speed.",
        "durationSec": 27
      }
    }
  },
  "toji": {
    "down": {
      "ja": {
        "text": "京都駅の前後で、A席側に東寺の五重塔が見えます。日本でいちばん高い木造の塔で、1200年近く京都を見おろしてきました。新大阪へ向かう人にとっては、京都を通り過ぎる一瞬の合図です。",
        "durationSec": 12
      },
      "en": {
        "text": "Around Kyoto Station, look to Seat A for the five-story pagoda of To-ji. It is Japan's tallest wooden tower and has watched over Kyoto for nearly 1,200 years. If you are heading toward Shin-Osaka, it is a brief, beautiful signal that you are passing through Kyoto.",
        "durationSec": 21
      }
    },
    "up": {
      "ja": {
        "text": "京都駅に近づくころ、E席側に東寺の五重塔が見えてきます。日本でいちばん高い木造の塔です。東京方面へ向かう人にとっては、京都の余韻を最後にもう一度見せてくれる景色です。",
        "durationSec": 12
      },
      "en": {
        "text": "As you approach Kyoto Station toward Tokyo, look to Seat E for To-ji's five-story pagoda, the tallest wooden tower in Japan. It is a final glimpse of Kyoto's depth before the train moves on.",
        "durationSec": 16
      }
    }
  },
  "torikai-train-depot": {
    "down": {
      "ja": {
        "text": "新大阪に近づくころ、E席側に鳥飼車両基地が広がります。白い新幹線が何本も並ぶ、旅を支える舞台裏です。名所というより現場ですが、広く見えるので見ごたえがあります。",
        "durationSec": 12
      },
      "en": {
        "text": "As Shin-Osaka gets closer, the Torikai Train Depot opens up on the Seat E side. Rows of white Shinkansen trains rest beside the line: the backstage of the journey. It is more workplace than landmark, but the scale makes it worth watching.",
        "durationSec": 20
      }
    },
    "up": {
      "ja": {
        "text": "新大阪を出てしばらくすると、A席側に鳥飼車両基地が見えてきます。これから走る列車、走り終えた列車が待つ場所です。旅の表舞台ではありませんが、新幹線を支える大きな現場が一瞬ひらけます。",
        "durationSec": 12
      },
      "en": {
        "text": "After leaving Shin-Osaka, the Torikai Train Depot appears on the Seat A side. This is where Shinkansen trains wait before or after their runs. It is not the front stage of travel, but for a moment the system behind the journey opens up beside the tracks.",
        "durationSec": 21
      }
    }
  }
};
