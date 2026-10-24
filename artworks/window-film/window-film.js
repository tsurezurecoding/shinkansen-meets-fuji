/* 車窓の映画『147分』: one clock drives paused Web Animations, procedural layers and a live-synthesized score.
 * Data: window-film-data.js (generated). Pages: window-film.html, en/window-film.html (generated). */
(() => {
  'use strict';

  const T = 80;
  const POSTER = 3.45;
  const DATA = window.WINDOW_FILM_DATA || { cast: [], stamps: [] };
  const CAST = DATA.cast;
  const STAMP_SVG = Object.fromEntries(DATA.stamps.map((s) => [s.id, s.svg]));
  const BY = Object.fromEntries(CAST.map((r) => [r.id, r]));
  const ROOT = document.body.dataset.filmRoot || './';
  const PH = ROOT + 'images/window-film/';
  const EASE = 'cubic-bezier(.2,.75,.2,1)';
  const EASE_IO = 'cubic-bezier(.65,0,.35,1)';
  const EASE_IN = 'cubic-bezier(.6,0,.9,.4)';

  const COPY = {
    ja: {
      stageLabel: '新幹線の窓の紹介映像『147分』。東海道新幹線の車窓を、一時停止も巻き戻しもできない147分の映画に見立てた80秒の映像。台本はページ下部にあります。',
      play: '再生', pause: '一時停止', soundOn: '音を消す', soundOff: '音を出す', full: '全画面', seek: '再生位置',
      ovKick: '本日上映', ovLine: '巻き戻せない、147分の映画。',
      tkBrand: '車窓劇場', tkBrandEn: 'WINDOW CINEMA', tkKind: '入場券',
      tkRows: [['作品', '東京 → 新大阪'], ['上映時間', '147分'], ['スクリーン', 'あなたの窓'], ['座席', 'E席（山側）']],
      tkNote: '※上映時間は のぞみ基準の目安', tkSerial: 'No.000147　のぞみ1号　東京 6:00 発',
      tkStub: '半券', tkStubUnit: '分',
      ledSoon: 'まもなく上映開始', ledFixed: 'のぞみ1号', ledLate: '夜の部', sep: '　',
      sideE: 'E席側', sideA: 'A席側', plateE: '山側', plateA: '海側',
      titleKick: '本日の上映', titleMain: '『東京 → 新大阪』', titleSub: '上映時間 147分',
      noPause: 'この映画は、一時停止できない。', noRewind: '巻き戻しも、できない。', nowShowing: '上映中',
      dur: (n) => typeof n === 'number' && Number.isFinite(n) && n > 0 ? `出番 約${n}秒` : '出番 未計測',
      starRole: '主演', starLine: '出番は、約3分半。',
      noTimes: ['なのに、上映時刻は', 'どこにも貼られていない。'],
      spoilAlert: 'ネタバレ注意', spoil: ['だから、', 'ネタバレしよう。'],
      boardTitle: '本日の上映', boardSub: 'のぞみ1号　東京 6:00 発', boardCols: ['時刻', '作品', '席'],
      brand: '新幹線の窓', brandEn: 'SHINKANSEN WINDOW',
      brLine: '車窓の、<br>ネタバレガイド。',
      brP: ['50以上の景色に、通過時刻と座席側を。', '乗る列車を選べば、あなたの上映時刻表に。'],
      chCo: ['共演', '富士山だけじゃない。'],
      chCameo: ['特別出演', '名脇役も、ぞろぞろ。'],
      chLate: ['夜の部', '夜の部も、上映中。'],
      sbTitle: '車窓スタンプ帖', sbCount: '8 / 50+',
      sbLine: '観た景色は、スタンプ帖に。', sbSub: '旅の半券みたいに、残しておける。',
      crHead: '出演', crHeadSub: '登場順', crNote: 'のぞみ1号（東京 6:00 発）の通過時刻の目安',
      staff: [['主演', '富士山'], ['撮影', 'michikusa'], ['時刻', 'のぞみ基準の目安'], ['上映館', '東海道新幹線 東京―新大阪'], ['製作', '新幹線の窓']],
      endLine: ['次の上映は、', 'あなたの次の乗車で。'],
      endSmall: '写真はすべて michikusa 撮影　／　時刻はのぞみ基準の目安',
      bonusLabel: 'おまけ', bonusLine: '上りでも下りでも、富士山はE席側。',
      bonusSea: '海側', bonusMtn: '山側', bonusWest: '新大阪', bonusEast: '東京', bonusEither: 'どちら向きに走っても、E席は山側',
      chapters: ['入場', '開幕', '一度きり', 'ネタバレ', '出演', 'スタンプ', 'エンドロール', 'おまけ'],
      seat: (s) => s + '席',
    },
    en: {
      stageLabel: 'Shinkansen Window’s 80-second film “147 Minutes”: the Tokaido Shinkansen window as a film you can’t pause or rewind. The full script is below the player.',
      play: 'Play', pause: 'Pause', soundOn: 'Mute', soundOff: 'Unmute', full: 'Full screen', seek: 'Playback position',
      ovKick: 'NOW SHOWING', ovLine: 'A 147-minute film you can’t rewind.',
      tkBrand: 'WINDOW CINEMA', tkBrandEn: '車窓劇場', tkKind: 'ADMIT ONE',
      tkRows: [['FEATURE', 'Tokyo → Shin-Osaka'], ['RUNTIME', '147 min'], ['SCREEN', 'Your window'], ['SEAT', 'E · mountain side']],
      tkNote: '*Runtime is a Nozomi-based estimate', tkSerial: 'No.000147  Nozomi 1  dep. Tokyo 6:00',
      tkStub: 'STUB', tkStubUnit: 'min',
      ledSoon: 'Feature starts shortly', ledFixed: 'NOZOMI 1', ledLate: 'LATE SHOW', sep: '  ',
      sideE: 'Seat E side', sideA: 'Seat A side', plateE: 'Mountain', plateA: 'Sea',
      titleKick: 'NOW SHOWING', titleMain: 'Tokyo → Shin-Osaka', titleSub: 'Runtime 147 min',
      noPause: 'This film can’t be paused.', noRewind: 'It can’t be rewound, either.', nowShowing: 'NOW SHOWING',
      dur: (n) => typeof n === 'number' && Number.isFinite(n) && n > 0 ? `on screen ~${n} sec` : 'Viewing window not measured',
      starRole: 'STARRING', starLine: 'Screen time: about 3½ minutes.',
      noTimes: ['Yet nobody posts', 'the showtimes.'],
      spoilAlert: 'SPOILER ALERT', spoil: ['So let’s', 'spoil it.'],
      boardTitle: 'Today’s showings', boardSub: 'Nozomi 1 · dep. Tokyo 6:00', boardCols: ['TIME', 'FEATURE', 'SEAT'],
      brand: 'Shinkansen Window', brandEn: '新幹線の窓',
      brLine: 'The spoiler guide to your window.',
      brP: ['50+ views, each with a time and a seat side.', 'Pick your train and get your own showtimes.'],
      chCo: ['CO-STARRING', 'Fuji isn’t the only star.'],
      chCameo: ['SPECIAL APPEARANCES', 'Plus a cast of scene-stealers.'],
      chLate: ['LATE SHOW', 'Late shows, too.'],
      sbTitle: 'Window Stamp Book', sbCount: '8 / 50+',
      sbLine: 'Stamp the views you catch.', sbSub: 'Keep them like ticket stubs from the trip.',
      crHead: 'CAST', crHeadSub: 'in order of appearance', crNote: 'Estimated passing times on Nozomi 1, dep. Tokyo 6:00',
      staff: [['STARRING', 'Mt. Fuji'], ['PHOTOGRAPHY', 'michikusa'], ['TIMES', 'Nozomi-based estimates'], ['THEATER', 'Tokaido Shinkansen, Tokyo–Shin-Osaka'], ['PRODUCED BY', 'Shinkansen Window']],
      endLine: ['Now showing', 'on your next ride.'],
      endSmall: 'All photos by michikusa  /  Times are Nozomi-based estimates',
      bonusLabel: 'AFTER THE CREDITS', bonusLine: 'Either direction, Mt. Fuji is on the Seat E side.',
      bonusSea: 'Sea side', bonusMtn: 'Mountain side', bonusWest: 'Shin-Osaka', bonusEast: 'Tokyo', bonusEither: 'Whichever way the train runs, Seat E faces the mountains',
      chapters: ['Admission', 'Curtain up', 'One showing', 'Spoilers', 'The cast', 'Stamps', 'End credits', 'After credits'],
      seat: (s) => 'Seat ' + s,
    },
  };

  // Shots seen through the window. E-side scenery drifts left→right on screen, A-side right→left,
  // which is how each side really moves on a Tokyo→Shin-Osaka run.
  const SHOTS = [
    { img: 'tokyo', spot: 'tokyo-tower', side: 'E', t0: 5.2, first: true, time: true, pan: 2.4 },
    { img: 'maruko', spot: 'maruko-bridge', side: 'E', t0: 10.5, tag: 'dur', time: true },
    { img: 'kosugi', spot: 'musashi-kosugi-towers', side: 'E', t0: 11.9, tag: 'dur', time: true },
    { img: 's727', spot: '727-sign', side: 'A', t0: 13.2, tag: 'dur', time: true },
    { img: 'odawara-castle', spot: 'odawara-castle', side: 'A', t0: 14.5, tag: 'dur', time: true },
    { img: 'fuji', spot: 'fuji', side: 'E', t0: 15.6, tag: 'star', time: true, pan: 1.3, zoom: [1.07, 1.17] },
    { img: 'fuji-field', spot: 'fuji', side: 'E', t0: 20.4, end: 22.6, time: true, pan: 1.6 },
    { img: 'tea', spot: 'shizuoka-tea-fields', side: 'E', t0: 35.0, first: true, tag: 'co', time: true },
    { img: 'hamanako', spot: 'hamanako', side: 'E', t0: 36.8, tag: 'co', time: true },
    { img: 'ibuki', spot: 'ibuki', side: 'E', t0: 38.6, tag: 'co', time: true },
    { img: 'toji', spot: 'toji', side: 'A', t0: 40.4, tag: 'co', time: true },
    { img: 'whoami', spot: 'putiputi-sign', side: 'A', t0: 42.2, tag: 'cameo' },
    { img: 'chikyu', spot: 'shimizu-port-chikyu', side: 'A', t0: 43.4, tag: 'cameo' },
    { img: 'solar', spot: 'solar-ark', side: 'E', t0: 44.6, tag: 'cameo' },
    { img: 'egg', spot: 'rakusai-egg-tanks', side: 'A', t0: 45.8, tag: 'cameo' },
    { img: 'tower-night', spot: 'tokyo-tower', side: 'E', t0: 47.6, tag: 'cameo', night: true, pan: 2.2 },
    { img: 'kiyosu-night', spot: 'kiyosu', side: 'E', t0: 49.4, tag: 'cameo', night: true, pan: 2.2 },
    { img: 'toji-night', spot: 'toji', side: 'A', t0: 51.2, tag: 'cameo', night: true, pan: 2.2 },
    { img: 'wheel-night', spot: 'hirakata-park-wheel', side: 'A', t0: 53.0, end: 55.0, tag: 'cameo', night: true, pan: 2.2 },
  ];
  SHOTS.forEach((s, i) => {
    const next = SHOTS[i + 1];
    s.t1 = s.end != null ? s.end : next.t0;
    s.hide = s.end != null ? s.end + 0.6 : next.t0 + 0.6;
  });

  const SHORT = {
    'musashi-kosugi-towers': { ja: '武蔵小杉', en: 'Musashi-Kosugi' },
    '727-sign': { ja: '727の看板', en: 'The 727 Sign' },
    'putiputi-sign': { ja: 'プチプチの看板', en: 'Who am I? Sign' },
    'shimizu-port-chikyu': { ja: '清水港のちきゅう', en: 'CHIKYU, Shimizu' },
    'rakusai-egg-tanks': { ja: '洛西の卵形タンク', en: 'Rakusai Egg Tanks' },
    'hirakata-park-wheel': { ja: 'ひらパーの観覧車', en: 'Hirakata Wheel' },
    'shizuoka-tea-fields': { ja: '静岡の茶畑', en: 'Tea Fields' },
    'nagoya-station-skyline': { ja: '名古屋駅前', en: 'Nagoya Skyline' },
    'toji': { ja: '東寺 五重塔', en: 'To-ji Pagoda' },
  };
  const BOARD = ['tokyo-tower', '727-sign', 'fuji', 'shizuoka-tea-fields', 'hamanako', 'nagoya-station-skyline', 'ibuki', 'toji'];
  const BOARD_T0 = 25.5, BOARD_STEP = 0.42;
  const STAMPS = DATA.stamps.map((s) => s.id);
  const STAMP_T0 = 55.9, STAMP_STEP = 0.4, STAMP_ROT = [-8, 5, -3, 7, -6, 4, -2, 6];
  const ROUTE_ST = [['Tokyo', 0, 1, '東京', 'Tokyo'], ['Shin-Yokohama', 18], ['Shizuoka', 53], ['Hamamatsu', 70], ['Nagoya', 95, 1, '名古屋', 'Nagoya'], ['Maibara', 112], ['Kyoto', 130, 1, '京都', 'Kyoto'], ['Shin-Osaka', 147, 1, '新大阪', 'Shin-Osaka']];
  const CHAPTERS = [0, 5.2, 10.5, 22.6, 35.0, 55.0, 61.0, 75.4];

  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const box = $('stageBox');
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const mmss = (x) => Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0');
  const rand = (n) => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const nameOf = (id, short) => { const r = BY[id]; if (!r) return id; return (short && SHORT[id] && SHORT[id][L]) || r[L]; };
  const hookOf = (id) => { const r = BY[id]; return r ? (L === 'ja' ? r.hj : r.he) : ''; };

  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage is optional */ } },
  };

  const L = document.documentElement.lang === 'en' ? 'en' : 'ja';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let M = reduce.matches ? 0 : 1;
  let port = false;
  let anims = [];
  let procs = [];
  let t = POSTER;
  let playing = false, started = false, ended = false;
  let wall0 = 0, clock0 = 0, raf = 0;
  let soundOn = store.get('mado-window-film-sound') !== 'off';

  /* ── timeline engine: every visual is a paused Web Animation driven by one clock ── */
  function track(el, prop, frames) {
    if (!el || !frames.length) return;
    const kf = [];
    const push = (time, value, easing) => {
      const k = { offset: clamp01(time / T) };
      k[prop] = value;
      if (easing) k.easing = easing;
      kf.push(k);
    };
    if (frames[0][0] > 0) push(0, frames[0][1]);
    frames.forEach(([time, value, easing]) => push(time, value, easing));
    if (frames[frames.length - 1][0] < T) push(T, frames[frames.length - 1][1]);
    const a = el.animate(kf, { duration: T * 1000, fill: 'both' });
    a.pause();
    anims.push(a);
  }
  function vis(el, a, b, fi = 0.4, fo = 0.4, peak = 1) {
    const f = [];
    if (fi > 0) f.push([a, 0, 'ease-out'], [a + fi, peak]); else f.push([a, 0], [a, peak]);
    if (b != null) { if (fo > 0) f.push([b - fo, peak, 'ease-in'], [b, 0]); else f.push([b, peak], [b, 0]); }
    track(el, 'opacity', f);
  }
  function rise(el, a, d = 0.7, dist = 2) {
    track(el, 'transform', [[a, `translateY(${dist * M}cqmin)`, EASE], [a + d, 'translateY(0cqmin)']]);
  }

  /* ── stage markup ── */
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zm6.4 0H17v14h-3.6z"/></svg>';
  const ICON_REW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.5 6v12L3 12zm9 0v12L12 12z"/></svg>';
  const LOGO = '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="4" y="4" width="56" height="34" rx="9" fill="none" stroke="currentColor" stroke-width="3"/><path d="M14 33 L28 18 L32 21.5 L36 18 L50 33" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><rect x="4" y="42" width="56" height="3.4" rx="1.7" fill="#2f6fd6"/></svg>';

  function shotHTML(c, s, i) {
    const r = BY[s.spot];
    const seat = `<span class="s-${s.side}">${c.seat(s.side)}</span>`;
    let tag = '';
    if (r && s.tag === 'dur') {
      tag = `<div class="tag"><b>${esc(nameOf(s.spot, true))}</b><span class="meta">${c.dur(r.d)} · ${seat}</span></div>`;
    } else if (r && s.tag === 'star') {
      tag = `<div class="tag star"><span class="role">${c.starRole}</span><b>${esc(r[L])}</b><span class="meta">${hhmm(r.c)} · ${seat}</span><span class="line">${c.starLine}</span></div>`;
    } else if (r && s.tag) {
      const meta = s.tag === 'co' ? `${hhmm(r.c)} · ${seat}` : seat;
      tag = `<div class="tag"><b>${esc(nameOf(s.spot, true))}</b><span class="hook">${esc(hookOf(s.spot))}</span><span class="meta">${meta}</span></div>`;
    }
    return `<div class="shot${tag ? ' has-tag' : ''}${s.night ? ' night' : ''}" id="shot${i}"><img src="${PH}${s.img}.webp" alt="" decoding="async" draggable="false">${tag}</div>`;
  }

  function stampHTML(id, i) {
    const svg = (STAMP_SVG[id] || '').replace(/stampInk/g, 'stampInk' + i);
    const r = BY[id];
    return `<div class="slot"><div class="stamp" id="stamp${i}">${svg}</div><span class="slot-l">${r ? hhmm(r.c) : ''}</span></div>`;
  }

  function creditsHTML(c) {
    const rows = CAST.map((r) => `<div class="cr"><span class="l">${hhmm(r.c)}<span class="seat-l s-${r.s}">${r.s}</span></span><span class="r">${esc(r[L])}</span></div>`).join('');
    const staff = c.staff.map(([k, v]) => `<div class="cr staff"><span class="l">${esc(k)}</span><span class="r">${esc(v)}</span></div>`).join('');
    return `<p class="cr-head">${c.crHead}<small>${c.crHeadSub}</small></p><p class="cr-note">${c.crNote}</p>${rows}<div class="cr-gap"></div>${staff}`;
  }

  function bonusSVG(c) {
    const seats = [['E', 92, 'hot'], ['D', 112, ''], ['C', 150, ''], ['B', 170, ''], ['A', 190, 'sea']];
    return `<svg class="bn-svg" viewBox="0 0 640 300" aria-hidden="true">
      <path class="draw" id="bnFuji" pathLength="1" d="M262 70 L320 16 L378 70"/>
      <path class="draw" id="bnSnow" pathLength="1" d="M300 34 L310 41 L320 33 L330 41 L340 34"/>
      <text class="t-mtn" x="396" y="54">${esc(c.bonusMtn)} · E</text>
      <rect class="draw" id="bnCar" pathLength="1" x="104" y="84" width="432" height="132" rx="58"/>
      ${seats.map(([k, y, cl]) => `<rect class="seat-r ${cl}" x="296" y="${y}" width="44" height="16" rx="4"/><text class="t-seat ${k === 'E' ? 't-mtn' : (k === 'A' ? 't-sea' : '')}" x="352" y="${y + 13}">${k}</text>`).join('')}
      <path class="draw" id="bnSea" pathLength="1" d="M236 250 q15 -10 30 0 t30 0 t30 0 t30 0 t30 0 t30 0"/>
      <text class="t-sea" x="430" y="256">${esc(c.bonusSea)} · A</text>
      <path class="draw" id="bnW" pathLength="1" d="M94 150 H34 M46 140 L34 150 L46 160"/>
      <path class="draw" id="bnE" pathLength="1" d="M546 150 H606 M594 140 L606 150 L594 160"/>
      <text x="2" y="190">${esc(c.bonusWest)}</text>
      <text x="638" y="190" text-anchor="end">${esc(c.bonusEast)}</text>
      <text class="t-dot" x="320" y="292" text-anchor="middle">${esc(c.bonusEither)}</text>
    </svg>`;
  }

  function stageHTML(c) {
    const routeSt = ROUTE_ST.map(([, m, mj, ja, en]) => `<i class="route-st${mj ? ' mj' : ''}" style="left:${(m / 147 * 100).toFixed(2)}%">${mj ? `<span>${L === 'ja' ? ja : en}</span>` : ''}</i>`).join('');
    const board = BOARD.map((id, i) => `<div class="bd-row" id="bdr${i}"><span class="cell c-time" id="bdc${i}_0"></span><span class="cell c-title" id="bdc${i}_1"></span><span class="cell c-seat s-${BY[id] ? BY[id].s : 'E'}" id="bdc${i}_2"></span>${id === 'fuji' ? '<i class="bd-glow" id="bdGlow"></i>' : ''}</div>`).join('');
    const spoil = `<p class="v" id="spoilText">${c.spoil[0]}<br>${c.spoil[1]}</p>`;
    return `
      <div class="house"></div>
      <div class="beam" id="beam"><i id="beamFlick"></i></div>
      <canvas class="dust" id="dust" aria-hidden="true"></canvas>
      <div class="tk-wrap" id="tkWrap">
        <div class="ticket" id="ticket">
          <div class="tk-main" id="tkMain">
            <div class="tk-head"><span class="tk-brand">${c.tkBrand}</span><span class="tk-brand-en">${c.tkBrandEn}</span><span class="tk-kind">${c.tkKind}</span></div>
            <div class="tk-rows">${c.tkRows.map((r, i) => `<div class="tk-row" id="tkr${i}"><span class="tk-k">${r[0]}</span><span class="tk-v${i === 0 ? ' tk-title' : ''}">${r[1]}</span></div>`).join('')}</div>
            <div class="tk-foot" id="tkFoot"><span>${c.tkNote}</span><span>${c.tkSerial}</span></div>
            <i class="tk-punch" id="tkPunch"></i>
          </div>
          <div class="tk-stub" id="tkStub"><span class="st-l">${c.tkStub}</span><b>147</b><span class="st-u">${c.tkStubUnit}</span><em>E</em></div>
        </div>
      </div>
      <div class="cabin" id="cabin">
        <div class="wall" id="wall"></div>
        <div class="led" id="led"><span class="led-fixed">${c.ledFixed}</span><span class="led-msg" id="ledMsg">${c.ledSoon}</span></div>
        <div class="plate is-E" id="plate"><b id="plateSeat">E</b><span id="plateSide">${c.plateE}</span></div>
        <div class="win" id="win">
          ${SHOTS.map((s, i) => shotHTML(c, s, i)).join('')}
          <div class="scrim" id="scrim"></div>
          <div class="nightref" id="nightRef"></div>
          <div class="glass" id="glass"></div>
          <div class="shade" id="shade"><i></i></div>
          <div class="leak" id="leak"></div>
        </div>
        <div class="route" id="route" aria-hidden="true"><i class="route-line"></i>${routeSt}<b class="route-dot" id="routeDot"></b></div>
      </div>
      <div class="cap" id="capTitle"><div><p class="kick">${c.titleKick}</p><p class="big title">${c.titleMain}</p><p class="sub">${c.titleSub}</p></div></div>
      <div class="cap" id="capPlayer"><div>
        <div class="swap"><p class="big" id="capL1">${c.noPause}</p><p class="big" id="capL2">${c.noRewind}</p></div>
        <div class="player"><span class="pb no" id="pbRew">${ICON_REW}</span><span class="pb no" id="pbPause">${ICON_PAUSE}</span><span class="pb on">${ICON_PLAY}<em>${c.nowShowing}</em></span></div>
      </div></div>
      <div class="cap" id="capNoTimes"><div><p class="big">${c.noTimes[0]}<br>${c.noTimes[1]}</p></div></div>
      <div class="cap chapter" id="chCo"><div><p class="kick">${c.chCo[0]}</p><p class="big">${c.chCo[1]}</p></div></div>
      <div class="cap chapter" id="chCameo"><div><p class="kick">${c.chCameo[0]}</p><p class="big">${c.chCameo[1]}</p></div></div>
      <div class="cap chapter" id="chLate"><div><p class="kick">${c.chLate[0]}</p><p class="big">${c.chLate[1]}</p></div></div>
      <div class="spoil${L === 'ja' ? '' : ' h'}" id="spoil"><p class="alert" id="spoilAlert">${c.spoilAlert}</p>${spoil}</div>
      <div class="board-wrap" id="boardWrap"><div class="board" id="board">
        <div class="bd-head"><span class="bd-title">${c.boardTitle}</span><span class="bd-sub">${c.boardSub}</span></div>
        <div class="bd-cols"><span>${c.boardCols[0]}</span><span>${c.boardCols[1]}</span><span>${c.boardCols[2]}</span></div>
        ${board}
      </div></div>
      <div class="brandrev" id="brandRev">
        <div class="logo" id="brLogo">${LOGO}<span class="logo-ja">${c.brand}</span></div>
        <p class="logo-en" id="brEn">${c.brandEn}</p>
        <p class="br-line" id="brLine">${c.brLine}</p>
        <p class="br-p" id="brP0">${c.brP[0]}</p>
        <p class="br-p" id="brP1">${c.brP[1]}</p>
      </div>
      <div class="sb-wrap" id="sbWrap"><div class="stampbook" id="stampbook">
        <p class="sb-title">${c.sbTitle}<small>${c.sbCount}</small></p>
        <div class="sb-grid">${STAMPS.map(stampHTML).join('')}</div>
      </div></div>
      <div class="sb-cap" id="sbCap"><p class="big">${c.sbLine}</p><p class="sub">${c.sbSub}</p></div>
      <div class="credits" id="credits"><div class="roll" id="roll">${creditsHTML(c)}</div></div>
      <div class="endcard" id="endcard">
        <p class="end-line" id="endL1">${c.endLine[0]}</p>
        <p class="end-line" id="endL2">${c.endLine[1]}</p>
        <div class="logo" id="endLogo">${LOGO}<span class="logo-ja">${c.brand}</span></div>
        <p class="end-url" id="endUrl">michikusa-travel.com</p>
        <p class="end-small" id="endSmall">${c.endSmall}</p>
      </div>
      <div class="bonus" id="bonus">
        <p class="bn-label" id="bnLabel">${c.bonusLabel}</p>
        ${bonusSVG(c)}
        <p class="bn-line" id="bnLine">${c.bonusLine}</p>
        <p class="bn-brand" id="bnBrand">${LOGO}${c.brand} · michikusa-travel.com</p>
      </div>
      <div class="grain"></div>
      <div class="vignette"></div>`;
  }

  /* ── the cut: every timing of the film lives here ── */
  function timeline(c) {
    const q = (id) => $(id);

    // 0:00 admission — projector, ticket, punch, tear
    vis(q('beam'), 0, 5.9, 0.8, 0.6);
    const tk = q('ticket');
    vis(tk, 0.5, null, 0.6);
    const base = 'translate(0cqmin,0cqmin) rotate(-2.5deg) scale(1)';
    track(tk, 'transform', [
      [0.5, `translate(0cqmin,${14 * M}cqmin) rotate(${-7 * M}deg) scale(.96)`, EASE],
      [1.7, base],
      [3.58, base, 'ease-out'],
      [3.64, `translate(0cqmin,${0.7 * M}cqmin) rotate(${-3.6 * M - 2.5 * (1 - M)}deg) scale(1)`, 'ease-out'],
      [3.82, base],
    ]);
    ['tkr0', 'tkr1', 'tkr2', 'tkr3', 'tkFoot'].forEach((id, i) => {
      const a = 1.5 + i * 0.36;
      track(q(id), 'clipPath', [[a, 'inset(0% 100% 0% 0%)', 'steps(9, end)'], [a + 0.34, 'inset(0% 0% 0% 0%)']]);
    });
    vis(q('tkPunch'), 3.6, null, 0.02);
    track(q('tkPunch'), 'transform', [[3.6, 'scale(1.8)', EASE], [3.72, 'scale(1)']]);
    track(q('tkMain'), 'transform', [[4.45, 'translate(0cqmin,0cqmin) rotate(0deg)', EASE_IN], [5.5, `translate(${-10 * M}cqmin,${-6 * M}cqmin) rotate(${-4 * M}deg)`]]);
    vis(q('tkMain'), 0, 5.5, 0, 0.9);
    track(q('tkStub'), 'transform', [[4.45, 'translate(0cqmin,0cqmin) rotate(0deg)', EASE_IN], [5.6, `translate(${12 * M}cqmin,${16 * M}cqmin) rotate(${16 * M}deg)`]]);
    vis(q('tkStub'), 0, 5.6, 0, 0.9);

    // cabin on/off: day run, hard cut to black, then the cast run
    track(q('cabin'), 'opacity', [[5.0, 0, 'ease-out'], [5.8, 1], [22.58, 1], [22.6, 0], [34.7, 0, 'ease-out'], [35.25, 1], [54.7, 1, 'ease-in'], [55.3, 0]]);
    if (M) track(q('shade'), 'transform', [[6.0, 'translateY(0%)', EASE_IO], [7.7, 'translateY(-101%)']]);
    else track(q('shade'), 'opacity', [[6.0, 1, 'ease-in-out'], [7.2, 0]]);
    track(q('leak'), 'opacity', [[5.4, 0], [5.9, 1], [6.3, 1, 'ease-in'], [7.2, 0]]);
    track(q('glass'), 'transform', [[5.2, `translateX(${-18 * M}%)`], [55, `translateX(${18 * M}%)`]]);
    track(q('glass'), 'opacity', [[47.2, 0.7], [48.2, 1]]);
    track(q('nightRef'), 'opacity', [[47.2, 0], [48.2, 1]]);
    track(q('wall'), 'filter', [[47.2, 'brightness(1)'], [48.2, 'brightness(.52)']]);
    track(q('scrim'), 'opacity', [[7.1, 0], [7.6, 1], [9.9, 1], [10.4, 0], [10.7, 0], [11.1, .9], [15.2, .9], [15.6, 0], [20.6, 0], [21.0, 1], [22.6, 1]]);

    SHOTS.forEach((s, i) => {
      const el = q('shot' + i);
      const img = el.querySelector('img');
      if (s.first) {
        track(el, 'opacity', [[s.t0 - 0.01, 0], [s.t0, 1], [s.hide, 1], [s.hide + 0.01, 0]]);
      } else if (M) {
        track(el, 'opacity', [[s.t0 - 0.01, 0], [s.t0, 1], [s.hide, 1], [s.hide + 0.01, 0]]);
        const from = s.side === 'E' ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)';
        track(el, 'clipPath', [[s.t0, from, EASE], [s.t0 + 0.55, 'inset(0% 0% 0% 0%)']]);
      } else {
        track(el, 'opacity', [[s.t0, 0], [s.t0 + 0.4, 1], [s.hide, 1], [s.hide + 0.01, 0]]);
      }
      const p = (s.pan || 3.4) * M * (s.side === 'E' ? 1 : -1);
      const z = s.zoom || [1.12, 1.12];
      track(img, 'transform', [[s.t0, `translateX(${-p}%) scale(${z[0]})`], [s.hide, `translateX(${p}%) scale(${z[1]})`]]);
      const tag = el.querySelector('.tag');
      if (tag) {
        const a = s.t0 + (s.tag === 'dur' ? 0.25 : 0.35);
        vis(tag, a, s.t1 + 0.1, 0.35, 0.25);
        rise(tag, a, 0.6, 1.6);
      }
    });

    // route dot follows the minute of whatever is on screen
    const pos = (s) => ((BY[s.spot] ? BY[s.spot].m : 0) / 147 * 100).toFixed(2) + '%';
    const dot = [];
    SHOTS.forEach((s, i) => {
      if (i === 0 || s.first) dot.push([s.t0, pos(s)]);
      else dot.push([s.t0, pos(SHOTS[i - 1]), EASE], [s.t0 + 0.6, pos(s)]);
    });
    track(q('routeDot'), 'left', dot);

    // captions over the window
    vis(q('capTitle'), 7.3, 10.3, 0.7, 0.5);
    rise(q('capTitle'), 7.3, 1.1, 1.4);
    vis(q('capPlayer'), 10.8, 15.55, 0.4, 0.35);
    track(q('capL1'), 'opacity', [[13.28, 1], [13.45, 0]]);
    track(q('capL2'), 'opacity', [[13.38, 0], [13.6, 1]]);
    const shake = (el, at) => {
      if (!M) return;
      track(el, 'transform', [[at, 'translateX(0cqmin)'], [at + 0.07, 'translateX(-1.1cqmin)'], [at + 0.14, 'translateX(1cqmin)'], [at + 0.21, 'translateX(-.7cqmin)'], [at + 0.28, 'translateX(.4cqmin)'], [at + 0.35, 'translateX(0cqmin)']]);
    };
    shake(q('pbPause'), 11.6);
    shake(q('pbRew'), 13.65);
    vis(q('capNoTimes'), 20.7, 22.6, 0.5, 0);
    rise(q('capNoTimes'), 20.7, 0.9, 1.2);
    vis(q('chCo'), 35.4, 42.05, 0.5, 0.3);
    vis(q('chCameo'), 42.4, 47.4, 0.45, 0.3);
    vis(q('chLate'), 47.9, 54.8, 0.6, 0.4);
    [['chCo', 35.4], ['chCameo', 42.4], ['chLate', 47.9]].forEach(([id, a]) => rise(q(id), a, 0.8, 1.4));

    // 0:22 the turn
    vis(q('spoil'), 22.6, 25.0, 0, 0.25);
    track(q('spoilAlert'), 'opacity', [[22.7, 0], [22.72, 1], [22.95, 1], [22.97, .15], [23.15, .15], [23.17, 1]]);
    const sp = q('spoilText');
    if (L === 'ja') track(sp, 'clipPath', [[23.0, 'inset(0% 0% 100% 0%)', EASE], [24.1, 'inset(0% 0% 0% 0%)']]);
    else track(sp, 'clipPath', [[23.0, 'inset(0% 100% 0% 0%)', EASE], [24.0, 'inset(0% 0% 0% 0%)']]);

    // 0:25 showtime board + brand
    vis(q('boardWrap'), 25.0, 34.8, 0.45, 0.4);
    const bx = port ? 0 : 16.5 * M;
    track(q('board'), 'transform', [[25.0, `translate(${bx}cqw, ${3 * M}cqmin)`, EASE], [25.8, `translate(${bx}cqw, 0cqmin)`], [29.55, `translate(${bx}cqw, 0cqmin)`, EASE_IO], [30.35, 'translate(0cqw, 0cqmin)']]);
    track(q('bdGlow'), 'opacity', [[29.0, 0], [29.08, 1], [29.35, .25], [29.55, 1], [29.8, .25], [30.0, 1]]);
    vis(q('brandRev'), 29.8, 34.8, 0.5, 0.4);
    ['brLogo', 'brEn', 'brLine', 'brP0', 'brP1'].forEach((id, i) => {
      const a = 29.9 + i * 0.32;
      vis(q(id), a, null, 0.5);
      rise(q(id), a, 0.7, 1.6);
    });

    // 0:55 stamp book
    vis(q('sbWrap'), 55.0, 61.0, 0.5, 0.4);
    const sbFrames = [[55.0, `translateY(${4 * M}cqi) rotate(-1deg)`, EASE], [55.7, 'translateY(0cqi) rotate(-1deg)']];
    STAMPS.forEach((id, i) => {
      const ts = STAMP_T0 + i * STAMP_STEP;
      const el = q('stamp' + i);
      vis(el, ts, null, 0.02);
      track(el, 'transform', [[ts, `scale(${1 + 0.5 * M}) rotate(${STAMP_ROT[i]}deg)`, EASE_IN], [ts + 0.12, `scale(1) rotate(${STAMP_ROT[i]}deg)`]]);
      if (M) sbFrames.push([ts + 0.11, 'translateY(0cqi) rotate(-1deg)'], [ts + 0.15, 'translateY(.7cqi) rotate(-1deg)'], [ts + 0.24, 'translateY(0cqi) rotate(-1deg)']);
    });
    track(q('stampbook'), 'transform', sbFrames);
    vis(q('sbCap'), 56.3, 61.0, 0.6, 0.4);
    rise(q('sbCap'), 56.3, 0.9, 1.6);

    // 1:01 end credits (in pixels: depends on the rendered roll height)
    vis(q('credits'), 60.95, 70.6, 0.35, 0.35);
    const H = stage.clientHeight || 540;
    const R = q('roll').offsetHeight || H * 2;
    if (M) {
      track(q('roll'), 'transform', [[61.0, `translateY(${H}px)`], [70.4, `translateY(${Math.round(H * 0.45 - R)}px)`]]);
    } else {
      // Reduced motion: the roll turns over in still pages with a fade instead of scrolling.
      const span = H * 0.8, pages = Math.max(1, Math.ceil((R - span) / span) + 1), step = 9.4 / pages;
      const tf = [], of = [];
      for (let k = 0; k < pages; k++) {
        const s0 = 61.0 + k * step, y = `translateY(${Math.round(H * 0.1 - k * span)}px)`;
        tf.push([s0, y], [s0 + step - 0.01, y]);
        of.push([s0, 0, 'ease-out'], [s0 + 0.3, 1], [s0 + step - 0.3, 1, 'ease-in'], [s0 + step - 0.01, 0]);
      }
      track(q('roll'), 'transform', tf);
      track(q('roll'), 'opacity', of);
    }

    // 1:10 end card
    vis(q('endcard'), 70.6, 75.1, 0.5, 0.45);
    ['endL1', 'endL2', 'endLogo', 'endUrl', 'endSmall'].forEach((id, i) => {
      const a = 70.8 + i * 0.38;
      vis(q(id), a, null, 0.6);
      rise(q(id), a, 0.9, 1.4);
    });

    // 1:15 after the credits
    vis(q('bonus'), 75.4, null, 0.5);
    vis(q('bnLabel'), 75.6, null, 0.3);
    [['bnCar', 75.9], ['bnFuji', 76.3], ['bnSnow', 76.7], ['bnSea', 76.5], ['bnW', 76.9], ['bnE', 76.9]].forEach(([id, a]) => {
      track(q(id), 'strokeDashoffset', [[a, '1', EASE], [a + 0.9, '0']]);
    });
    vis(q('bnLine'), 77.4, null, 0.6);
    rise(q('bnLine'), 77.4, 0.9, 1.4);
    vis(q('bnBrand'), 78.2, null, 0.6);

    /* procedural layers */
    const ledMsg = q('ledMsg'), plate = q('plate'), plateSeat = q('plateSeat'), plateSide = q('plateSide');
    let ledLast = '', sideLast = 'E';
    procs.push((x) => {
      const s = shotAt(x);
      let msg = c.ledSoon;
      if (s && x >= 7.6) {
        const r = BY[s.spot];
        const head = s.time && r ? hhmm(r.c) + c.sep : (s.night ? c.ledLate + c.sep : '');
        msg = head + nameOf(s.spot, true) + c.sep + (s.side === 'E' ? c.sideE : c.sideA);
      }
      if (msg !== ledLast) { ledMsg.textContent = msg; ledLast = msg; }
      const side = s ? s.side : 'E';
      if (side !== sideLast) {
        plate.className = 'plate is-' + side;
        plateSeat.textContent = side;
        plateSide.textContent = side === 'E' ? c.plateE : c.plateA;
        sideLast = side;
      }
    });

    const pool = L === 'ja' ? 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ東京富士山湖城塔寺茶0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const cells = BOARD.map((id, i) => {
      const r = BY[id];
      const txt = r ? [hhmm(r.c), nameOf(id, true), r.s] : ['--:--', id, '-'];
      return txt.map((v, j) => ({ el: q(`bdc${i}_${j}`), v, a: BOARD_T0 + i * BOARD_STEP + j * 0.05, b: BOARD_T0 + i * BOARD_STEP + 0.3 + j * 0.08, seed: i * 3 + j }));
    }).flat();
    procs.push((x) => {
      for (const cell of cells) {
        let v = '';
        if (x >= cell.b) v = cell.v;
        else if (x >= cell.a) {
          const k = Math.floor(x * 26);
          v = Array.from(cell.v).map((ch, j) => (ch === ' ' ? ' ' : pool[Math.floor(rand(k * 7 + j * 13 + cell.seed * 31) * pool.length)])).join('');
        }
        if (cell.el._v !== v) { cell.el.textContent = v; cell.el._v = v; }
      }
    });

    const flick = q('beamFlick');
    procs.push((x) => { if (x < 6.2) flick.style.opacity = String(0.8 + 0.2 * rand(Math.floor(x * 18))); });

    const dust = q('dust');
    const dctx = dust.getContext('2d');
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const W = dust.width = Math.round(stage.clientWidth * dpr);
    const Hd = dust.height = Math.round(stage.clientHeight * dpr);
    const parts = Array.from({ length: 80 }, (_, i) => ({ x: rand(i * 3 + 1), y: rand(i * 3 + 2), r: 0.5 + rand(i * 3 + 3) * 1.6, s: 0.15 + rand(i * 5 + 7) * 0.5, ph: rand(i * 11) * 6.28 }));
    let dustClear = false;
    procs.push((x) => {
      if (x > 6.3) { if (!dustClear) { dctx.clearRect(0, 0, W, Hd); dustClear = true; } return; }
      dustClear = false;
      const k = clamp01(x / 0.9) * (1 - clamp01((x - 5.2) / 0.7));
      dctx.clearRect(0, 0, W, Hd);
      const apexY = -0.34 * Hd, tan = Math.tan(17 * Math.PI / 180);
      for (const p of parts) {
        const px = (p.x + Math.sin(x * p.s * M + p.ph) * 0.03) * W;
        const py = ((p.y + x * p.s * 0.025 * M) % 1) * Hd;
        const half = (py - apexY) * tan * (W / Hd) * 0.9;
        const cone = Math.max(0, 1 - Math.abs(px - W / 2) / half);
        if (cone <= 0) continue;
        dctx.globalAlpha = k * cone * 0.55;
        dctx.fillStyle = '#fff1d6';
        dctx.beginPath();
        dctx.arc(px, py, p.r * dpr, 0, Math.PI * 2);
        dctx.fill();
      }
      dctx.globalAlpha = 1;
    });
  }

  function shotAt(x) {
    let hit = null;
    for (const s of SHOTS) { if (s.t0 <= x && x < s.hide) hit = s; }
    return hit;
  }

  /* ── build & size ── */
  function sizeStage() {
    const fs = document.fullscreenElement === box;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const wasPort = port;
    port = vw / vh < 0.82;
    const ar = port ? 9 / 16 : 16 / 9;
    if (fs) {
      let w = window.innerWidth, h = w / ar;
      if (h > window.innerHeight) { h = window.innerHeight; w = h * ar; }
      box.style.setProperty('--fw', Math.floor(w) + 'px');
      box.style.setProperty('--fh', Math.floor(h) + 'px');
    }
    const availW = Math.min(vw - 32, 1440);
    const availH = Math.max(vh - (port ? 168 : 178), port ? 420 : 230);
    let w = availW, h = w / ar;
    if (h > availH) { h = availH; w = h * ar; }
    if (w > availW) { w = availW; h = w / ar; }
    document.documentElement.style.setProperty('--sw', Math.floor(w) + 'px');
    document.documentElement.style.setProperty('--sh', Math.floor(h) + 'px');
    return wasPort !== port;
  }

  function build() {
    anims.forEach((a) => a.cancel());
    anims = [];
    procs = [];
    const c = COPY[L];
    stage.className = (port ? 'port' : 'land') + ' lang-' + L + (playing ? ' playing' : '');
    stage.innerHTML = stageHTML(c);
    stage.setAttribute('aria-label', c.stageLabel);
    timeline(c);
    render(t);
  }

  function render(x) {
    const ms = x * 1000;
    for (const a of anims) a.currentTime = ms;
    for (const p of procs) p(x);
    ui(x);
  }

  /* ── transport ── */
  const scrub = $('scrub');
  let lastTime = '', lastChapter = -1;
  function ui(x) {
    const s = mmss(x) + ' / ' + mmss(T);
    if (s !== lastTime) { $('time').textContent = s; lastTime = s; }
    if (document.activeElement !== scrub || playing) scrub.value = String(x);
    scrub.style.setProperty('--p', (x / T * 100).toFixed(2) + '%');
    let ch = 0;
    CHAPTERS.forEach((ct, i) => { if (x >= ct) ch = i; });
    if (ch !== lastChapter) {
      lastChapter = ch;
      document.querySelectorAll('#chapters button').forEach((b, i) => b.setAttribute('aria-current', String(i === ch && started)));
    }
  }

  function setOverlay(which) {
    $('overlay').hidden = !which;
    $('ovStart').hidden = which !== 'start';
    $('ovEnd').hidden = which !== 'end';
  }

  function updateButtons() {
    const c = COPY[L];
    $('icoPlay').hidden = playing;
    $('icoPause').hidden = !playing;
    $('btnPlay').setAttribute('aria-label', playing ? c.pause : c.play);
    $('icoSnd').hidden = !soundOn;
    $('icoMute').hidden = soundOn;
    $('btnSound').setAttribute('aria-pressed', String(soundOn));
    $('btnSound').setAttribute('aria-label', soundOn ? c.soundOn : c.soundOff);
  }

  function play() {
    if (!started) { started = true; t = 0; lastChapter = -1; }
    if (t >= T - 0.05) t = 0;
    const tw = $('tkWrap');
    if (tw) tw.style.transform = '';
    playing = true;
    ended = false;
    wall0 = performance.now();
    clock0 = t;
    stage.classList.add('playing');
    setOverlay(null);
    audioStart(t);
    updateButtons();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    stage.classList.remove('playing');
    audioStop();
    updateButtons();
  }
  function loop() {
    if (!playing) return;
    const x = clock0 + (performance.now() - wall0) / 1000;
    if (x >= T) {
      t = T;
      render(T);
      pause();
      ended = true;
      setOverlay('end');
      report('window_film_complete');
      return;
    }
    t = x;
    render(x);
    raf = requestAnimationFrame(loop);
  }
  function seek(x) {
    t = Math.max(0, Math.min(T, x));
    if (!started) { started = true; lastChapter = -1; setOverlay(null); }
    if (ended && t < T) { ended = false; setOverlay(null); }
    if (playing) { wall0 = performance.now(); clock0 = t; audioStop(); audioStart(t); }
    render(t);
  }
  function toggle() { if (playing) pause(); else play(); }

  /* ── score: original, synthesized live; no station melodies ── */
  const A = { ctx: null, out: null, rev: null, noise: null, dry: null, wet: null, live: new Set(), base: 0, ptr: 0, timer: 0 };
  const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function audioInit() {
    if (A.ctx) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try { A.ctx = new Ctx(); } catch (e) { return false; }
    const ctx = A.ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
    A.out = ctx.createGain(); A.out.gain.value = 1.8;
    A.out.connect(comp); comp.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 2.8), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    A.rev = ctx.createConvolver(); A.rev.buffer = ir;
    const rg = ctx.createGain(); rg.gain.value = 0.3; A.rev.connect(rg); rg.connect(A.out);
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    A.noise = nb;
    return true;
  }
  const voice = (src) => { A.live.add(src); src.onended = () => A.live.delete(src); return src; };
  function sendOut(node, wet) {
    node.connect(A.dry);
    if (wet) { const s = A.ctx.createGain(); s.gain.value = wet; node.connect(s); s.connect(A.wet); }
  }
  function env(g, at, a, peak, d) {
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
  }
  function osc(type, f, at, end, dest, det) {
    const o = A.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, at);
    if (det) o.detune.value = det;
    o.connect(dest); o.start(at); o.stop(end);
    return voice(o);
  }
  function noiseSrc(at, dur, dest) {
    const s = A.ctx.createBufferSource();
    s.buffer = A.noise; s.loop = true; s.connect(dest);
    s.start(at, Math.random() * 0.5); s.stop(at + dur);
    return voice(s);
  }
  function filt(type, f, q) { const b = A.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; }
  function gain() { return A.ctx.createGain(); }

  function pad(at, dur, notes, vol) {
    if (dur <= 0.08) return;
    const lp = filt('lowpass', 1150, 0.4), g = gain();
    lp.connect(g); sendOut(g, 0.7);
    const peak = vol * 2 / Math.sqrt(notes.length * 2);
    const a = Math.min(0.9, dur * 0.35), r = Math.min(1.3, dur * 0.45);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + a);
    g.gain.setValueAtTime(peak, Math.max(at + a, at + dur - r));
    g.gain.linearRampToValueAtTime(0, at + dur);
    notes.forEach((n) => { const f = mtof(n); osc('sawtooth', f, at, at + dur + 0.05, lp, -7); osc('sawtooth', f, at, at + dur + 0.05, lp, 7); });
  }
  function bell(at, n, vol, dec = 2.4) {
    const f = mtof(n);
    [[1, 1, dec], [2.76, 0.22, dec * 0.45], [5.4, 0.07, dec * 0.22]].forEach(([m, k, d]) => {
      const g = gain(); sendOut(g, 0.9); env(g, at, 0.004, vol * k, d);
      osc('sine', f * m, at, at + d + 0.05, g);
    });
  }
  function pluck(at, n, vol, dec = 0.7) {
    const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3800, at); lp.frequency.exponentialRampToValueAtTime(650, at + dec);
    const g = gain(); lp.connect(g); sendOut(g, 0.45); env(g, at, 0.006, vol, dec);
    const f = mtof(n);
    osc('triangle', f, at, at + dec + 0.05, lp);
    const g2 = gain(); g2.gain.value = 0.3; g2.connect(lp); osc('sine', f * 2, at, at + dec + 0.05, g2);
  }
  function click(at, vol, f) {
    const bp = filt('bandpass', f, 1.2), g = gain();
    bp.connect(g); sendOut(g, 0.05); env(g, at, 0.002, vol, 0.03);
    noiseSrc(at, 0.05, bp);
  }
  function hum(at, dur, vol) {
    if (dur <= 0.1) return;
    const lp = filt('lowpass', 170, 0.7), g = gain();
    lp.connect(g); sendOut(g, 0);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + 0.4); g.gain.setValueAtTime(vol, at + Math.max(0.4, dur - 0.6)); g.gain.linearRampToValueAtTime(0, at + dur);
    osc('sawtooth', 48, at, at + dur + 0.05, lp);
  }
  function drone(at, dur, n, vol) {
    if (dur <= 0.1) return;
    const g = gain(); sendOut(g, 0.5);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + 1.2); g.gain.setValueAtTime(vol, at + Math.max(1.2, dur - 1.2)); g.gain.linearRampToValueAtTime(0, at + dur);
    osc('sine', mtof(n), at, at + dur + 0.05, g); osc('sine', mtof(n + 12), at, at + dur + 0.05, g, 4);
  }
  function printer(at, dur) {
    const bp = filt('bandpass', 4200, 2), g = gain();
    bp.connect(g); sendOut(g, 0.05);
    g.gain.setValueAtTime(0, at);
    for (let x = 0; x < dur; x += 0.024) { g.gain.setValueAtTime(0.05, at + x); g.gain.setValueAtTime(0.004, at + x + 0.012); }
    g.gain.setValueAtTime(0, at + dur);
    noiseSrc(at, dur + 0.02, bp);
  }
  function whoosh(at, dur, vol, f0, f1, q) {
    const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
    bp.frequency.setValueAtTime(f0, at); bp.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = gain(); bp.connect(g); sendOut(g, 0.3);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + dur * 0.45); g.gain.linearRampToValueAtTime(0, at + dur);
    noiseSrc(at, dur + 0.02, bp);
  }
  function tick(at, vol) { const g = gain(); sendOut(g, 0.1); env(g, at, 0.002, vol, 0.03); osc('sine', 2600, at, at + 0.05, g); }
  function thump(at, vol, f = 90) {
    const g = gain(); sendOut(g, 0.08); env(g, at, 0.004, vol, 0.26);
    const o = osc('sine', f * 1.7, at, at + 0.32, g); o.frequency.exponentialRampToValueAtTime(f * 0.55, at + 0.2);
  }
  function stampHit(at) { thump(at, 0.24, 80); click(at, 0.09, 900); }
  function boom(at, vol) {
    const g = gain(); sendOut(g, 0.5); env(g, at, 0.01, vol, 2.2);
    const o = osc('sine', 72, at, at + 2.4, g); o.frequency.exponentialRampToValueAtTime(30, at + 1.8);
    const lp = filt('lowpass', 320, 0.5), g2 = gain(); lp.connect(g2); sendOut(g2, 0.4); env(g2, at, 0.02, vol * 0.35, 1.0);
    noiseSrc(at, 1.2, lp);
  }
  function denied(at) { pluck(at, 45, 0.08, 0.18); pluck(at + 0.13, 44, 0.08, 0.24); }

  const EV = (() => {
    const ev = [];
    const add = (time, f, d) => ev.push({ t: time, d, f });
    const chord = (time, d, notes, vol) => add(time, (at, off) => pad(at, d - off, notes, vol), d);
    const bells = (list, vol, dec) => list.forEach(([time, n]) => add(time, (at) => bell(at, n, vol, dec)));
    const arp = (segs, step, vol, oct = 0) => segs.forEach(([a, b, notes]) => {
      const pat = [0, 1, 2, 3, 2, 1];
      for (let x = a, k = 0; x < b - 0.01; x += step, k++) {
        const n = notes[pat[k % pat.length] % notes.length] + oct;
        add(x, (at) => pluck(at, n, vol, 0.55));
      }
    });

    // admission: projector, printing, punch, tear
    for (let x = 0.25; x < 5.4; x += 1 / 18) { const v = 0.014 + 0.012 * rand(x * 100); add(x, (at) => click(at, v, 2400)); }
    add(0.2, (at, off) => hum(at, 5.3 - off, 0.02), 5.3);
    [1.5, 1.86, 2.22, 2.58, 2.94].forEach((x) => add(x, (at) => printer(at, 0.32)));
    add(3.6, (at) => { click(at, 0.32, 3400); bell(at, 96, 0.012, 0.25); });
    add(4.45, (at) => whoosh(at, 0.55, 0.07, 1600, 5200, 2));
    // curtain up
    add(5.4, (at, off) => drone(at, 5.2 - off, 38, 0.04), 5.2);
    add(6.0, (at) => whoosh(at, 1.7, 0.09, 300, 2600, 0.8));
    chord(6.4, 4.2, [50, 57, 61, 64, 69], 0.045);
    bells([[7.3, 81], [7.9, 78], [8.5, 76], [9.2, 74]], 0.035);
    // one showing only: clock, heartbeat, passing trains
    for (let x = 10.5; x < 15.5; x += 0.25) { const v = (Math.round(x * 4) % 4 === 0) ? 0.045 : 0.025; add(x, (at) => tick(at, v)); }
    for (let x = 10.5; x < 15.5; x += 0.5) add(x, (at) => thump(at, 0.07, 70));
    chord(10.5, 2.7, [47, 54, 57, 62], 0.035);
    chord(13.1, 2.6, [43, 50, 55, 59], 0.035);
    [10.5, 11.9, 13.2, 14.5].forEach((x) => add(x - 0.12, (at) => whoosh(at, 0.55, 0.05, 600, 3000, 1.2)));
    add(11.6, denied); add(13.65, denied);
    // Fuji
    add(15.45, (at) => whoosh(at, 1.2, 0.05, 200, 1200, 0.6));
    chord(15.6, 2.5, [43, 55, 59, 62, 66], 0.055);
    chord(18.0, 2.5, [42, 54, 57, 62, 66], 0.055);
    bells([[16.0, 86], [16.6, 81], [17.2, 83], [18.0, 78], [18.8, 76], [19.6, 74]], 0.04);
    chord(20.4, 2.18, [40, 52, 55, 59, 62], 0.04);
    for (let x = 20.5; x < 22.5; x += 0.5) add(x, (at) => tick(at, 0.022));
    // the turn
    add(23.0, (at) => boom(at, 0.36));
    [74, 78, 81, 86].forEach((n) => add(23.02, (at) => bell(at, n, 0.032, 3.2)));
    // board
    chord(25.0, 10.0, [50, 57, 62, 66], 0.025);
    arp([[25.4, 27.9, [62, 66, 69, 74]], [27.9, 30.4, [61, 64, 69, 73]], [30.4, 32.9, [59, 62, 66, 71]], [32.9, 34.8, [59, 62, 67, 71]]], 0.25, 0.045);
    BOARD.forEach((_, i) => { const a = BOARD_T0 + i * BOARD_STEP; for (let j = 0; j < 7; j++) add(a + j * 0.05, (at) => click(at, 0.03, 3000)); });
    add(29.0, (at) => bell(at, 81, 0.04));
    // the cast
    chord(35.0, 1.8, [43, 50, 55, 59, 62], 0.04);
    chord(36.8, 1.8, [45, 52, 57, 61, 64], 0.04);
    chord(38.6, 1.8, [42, 49, 54, 57, 61], 0.04);
    chord(40.4, 1.8, [47, 54, 59, 62, 66], 0.04);
    chord(42.2, 2.4, [50, 57, 62, 66], 0.04);
    chord(44.6, 1.2, [45, 52, 57, 61], 0.04);
    chord(45.8, 1.8, [43, 50, 55, 59], 0.04);
    arp([[35.0, 36.8, [67, 71, 74, 79]], [36.8, 38.6, [69, 73, 76, 81]], [38.6, 40.4, [66, 69, 73, 78]], [40.4, 42.2, [66, 71, 74, 78]],
      [42.2, 44.6, [66, 69, 74, 78]], [44.6, 45.8, [64, 69, 73, 76]], [45.8, 47.6, [67, 71, 74, 79]]], 0.225, 0.04);
    for (let x = 35.0; x < 47.5; x += 0.45) add(x, (at) => thump(at, 0.06, 85));
    for (let x = 35.225; x < 47.5; x += 0.45) add(x, (at) => click(at, 0.012, 7000));
    bells([[35.0, 83], [36.8, 81], [38.6, 78], [40.4, 86]], 0.035);
    [[42.2, 86, 90], [43.4, 83, 88], [44.6, 86, 93], [45.8, 81, 86]].forEach(([x, a, b]) => { add(x, (at) => pluck(at, a, 0.07, 0.25)); add(x + 0.11, (at) => pluck(at, b, 0.07, 0.3)); });
    // late show
    chord(47.6, 3.7, [47, 54, 59, 62, 66], 0.035);
    chord(51.3, 3.8, [43, 55, 59, 62, 67], 0.035);
    arp([[47.8, 51.2, [59, 62, 66, 71]], [51.3, 54.8, [55, 59, 62, 67]]], 0.45, 0.03);
    bells([[47.6, 78], [49.4, 74], [51.2, 71], [53.0, 81]], 0.035, 3.0);
    // stamps
    chord(55.2, 5.7, [50, 57, 62, 66, 69], 0.035);
    STAMPS.forEach((_, i) => add(STAMP_T0 + i * STAMP_STEP, stampHit));
    add(59.5, (at) => bell(at, 86, 0.035));
    // end credits
    chord(61.0, 2.5, [50, 57, 62, 66], 0.035);
    chord(63.4, 2.5, [49, 57, 61, 64], 0.035);
    chord(65.8, 2.5, [47, 54, 59, 62], 0.035);
    chord(68.2, 2.5, [43, 55, 59, 62], 0.035);
    [[61.4, 78], [62.2, 76], [63.0, 74], [63.8, 76], [64.6, 69], [65.8, 71], [66.6, 74], [67.4, 78], [68.2, 79], [69.0, 78], [69.8, 76]].forEach(([x, n]) => add(x, (at) => pluck(at, n, 0.055, 1.1)));
    // end card
    chord(70.6, 4.6, [50, 57, 61, 64, 69], 0.045);
    [74, 78, 81, 88].forEach((n, i) => add(71.0 + i * 0.09, (at) => bell(at, n, 0.026, 3)));
    // after the credits
    chord(75.6, 4.4, [50, 57, 62], 0.025);
    add(75.9, (at) => pluck(at, 79, 0.07, 0.3));
    add(76.15, (at) => pluck(at, 86, 0.07, 0.4));
    add(77.4, (at) => bell(at, 81, 0.03));
    add(78.3, (at) => { bell(at, 86, 0.022); bell(at + 0.14, 93, 0.016); });

    return ev.sort((a, b) => a.t - b.t);
  })();

  function pump() {
    if (!A.dry) return;
    const now = A.ctx.currentTime;
    const horizon = now - A.base + 0.35;
    while (A.ptr < EV.length && EV[A.ptr].t <= horizon) {
      const e = EV[A.ptr++];
      const at = A.base + e.t;
      if (at < now - 0.05) continue;
      e.f(Math.max(at, now), 0);
    }
  }
  function audioStart(from) {
    if (!soundOn || !audioInit()) return;
    const ctx = A.ctx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    A.dry = gain(); A.dry.connect(A.out);
    A.wet = gain(); A.wet.connect(A.rev);
    A.base = ctx.currentTime + 0.08 - from;
    A.ptr = 0;
    while (A.ptr < EV.length && EV[A.ptr].t < from - 0.01) {
      const e = EV[A.ptr++];
      if (e.d && e.t + e.d > from + 0.15) e.f(ctx.currentTime + 0.05, from - e.t);
    }
    pump();
    clearInterval(A.timer);
    A.timer = setInterval(pump, 50);
  }
  function audioStop() {
    clearInterval(A.timer);
    A.timer = 0;
    if (!A.ctx || !A.dry) return;
    const now = A.ctx.currentTime, d = A.dry, w = A.wet, nodes = [...A.live];
    A.live.clear();
    [d, w].forEach((g) => { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + 0.12); });
    setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } }); try { d.disconnect(); w.disconnect(); } catch (e) { /* gone */ } }, 220);
    A.dry = A.wet = null;
  }

  /* ── page chrome ── */
  function renderPage() {
    const c = COPY[L];
    $('ovKick').textContent = c.ovKick;
    $('ovLine').textContent = c.ovLine;
    $('btnFull').setAttribute('aria-label', c.full);
    scrub.setAttribute('aria-label', c.seek);
    $('chapters').innerHTML = CHAPTERS.map((ct, i) => `<button type="button" data-t="${ct}" data-i="${i}"><span>${mmss(ct)}</span>${c.chapters[i]}</button>`).join('');
    $('ticks').innerHTML = CHAPTERS.slice(1).map((ct) => `<i style="left:${(ct / T * 100).toFixed(2)}%"></i>`).join('');
    lastChapter = -1;
    $('scriptList').innerHTML = script(c).map(([x, line]) => `<li><span>${mmss(x)}</span><div>${esc(line)}</div></li>`).join('');
    updateButtons();
  }

  function script(c) {
    const names = (ids) => ids.map((id) => nameOf(id, true)).join(L === 'ja' ? '、' : ', ');
    const sep = L === 'ja' ? '　' : '  ';
    const board = BOARD.map((id) => BY[id] ? `${hhmm(BY[id].c)} ${nameOf(id, true)} ${BY[id].s}` : '').join(' / ');
    return [
      [0, `${c.tkBrand} ${c.tkKind}${sep}${c.tkRows.map((r) => r.join(' ')).join(' / ')}${sep}${c.tkNote}`],
      [6, `${c.titleKick}${sep}${c.titleMain}${sep}${c.titleSub}`],
      [10.5, `${c.noPause}${sep}(${SHOTS.slice(1, 3).map((s) => nameOf(s.spot, true) + ' ' + c.dur(BY[s.spot] ? BY[s.spot].d : '')).join(' / ')})`],
      [13.5, `${c.noRewind}${sep}(${SHOTS.slice(3, 5).map((s) => nameOf(s.spot, true) + ' ' + c.dur(BY[s.spot] ? BY[s.spot].d : '')).join(' / ')})`],
      [15.6, `${c.starRole} ${nameOf('fuji')}${sep}${c.starLine}`],
      [20.7, c.noTimes.join(L === 'ja' ? '' : ' ')],
      [22.6, `${c.spoilAlert}${sep}${c.spoil.join(L === 'ja' ? '' : ' ')}`],
      [25.0, `${c.boardTitle} (${c.boardSub})${sep}${board}`],
      [29.8, `${c.brand}${sep}${c.brLine.replace('<br>', '')}${sep}${c.brP.join(sep)}`],
      [35.0, `${c.chCo[0]}: ${names(['shizuoka-tea-fields', 'hamanako', 'ibuki', 'toji'])}${sep}${c.chCo[1]}`],
      [42.2, `${c.chCameo[0]}: ${names(['putiputi-sign', 'shimizu-port-chikyu', 'solar-ark', 'rakusai-egg-tanks'])}${sep}${c.chCameo[1]}`],
      [47.6, `${c.chLate[0]}: ${names(['tokyo-tower', 'kiyosu', 'toji', 'hirakata-park-wheel'])}${sep}${c.chLate[1]}`],
      [55.0, `${c.sbTitle}${sep}${c.sbLine}${sep}${c.sbSub}`],
      [61.0, `${c.crHead} (${c.crHeadSub})${sep}${CAST.length}${L === 'ja' ? '景' : ' views'}${sep}${c.staff.map((r) => r.join(' ')).join(' / ')}`],
      [70.6, `${c.endLine.join(L === 'ja' ? '' : ' ')}${sep}${c.brand}${sep}michikusa-travel.com`],
      [75.4, `${c.bonusLabel}${sep}${c.bonusLine}`],
    ];
  }

  let filter = 'all';
  function applyFilter() {
    document.querySelectorAll('#chips button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === filter)));
    document.querySelectorAll('#castList li').forEach((li) => { li.hidden = filter !== 'all' && li.dataset.side !== filter; });
  }

  // Uses the page's consent-aware gtag only when it exists (absent on local previews, opt-out and in the app).
  function report(name, params) {
    if (typeof window.gtag !== 'function' || window.MADO_ANALYTICS_DISABLED) return;
    try { window.gtag('event', name, Object.assign({ film_lang: L }, params || {})); } catch (e) { /* analytics is optional */ }
  }

  /* ── events ── */
  $('btnStart').addEventListener('click', () => { soundOn = true; store.set('mado-window-film-sound', 'on'); report('window_film_start', { sound: 'on' }); play(); });
  $('btnStartMute').addEventListener('click', () => { soundOn = false; store.set('mado-window-film-sound', 'off'); report('window_film_start', { sound: 'off' }); play(); });
  $('btnReplay').addEventListener('click', () => { t = 0; report('window_film_replay'); play(); });
  $('btnPlay').addEventListener('click', toggle);
  $('btnSound').addEventListener('click', () => {
    soundOn = !soundOn;
    store.set('mado-window-film-sound', soundOn ? 'on' : 'off');
    if (playing) { if (soundOn) audioStart(t); else audioStop(); }
    updateButtons();
  });
  $('btnFull').addEventListener('click', () => {
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (box.requestFullscreen) box.requestFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => { sizeStage(); build(); });
  stage.addEventListener('click', () => { if (!started || ended) return; toggle(); });
  $('chapters').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-t]');
    if (!b) return;
    const wasPlaying = playing || !started;
    report('window_film_chapter', { chapter: Number(b.dataset.i) });
    seek(Number(b.dataset.t));
    if (wasPlaying && !playing) play();
  });
  $('castList').addEventListener('click', (e) => {
    const a = e.target.closest('a[data-spot]');
    if (a) report('window_film_cast_click', { spot_id: a.dataset.spot });
  });
  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    filter = b.dataset.f;
    applyFilter();
  });
  let resumeAfterScrub = false;
  scrub.addEventListener('input', () => {
    if (playing) { resumeAfterScrub = true; pause(); }
    seek(Number(scrub.value));
  });
  scrub.addEventListener('change', () => { if (resumeAfterScrub) { resumeAfterScrub = false; play(); } });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select, summary, a, button') && e.key !== 'k') {
      if (!(e.key === ' ' && e.target === document.body)) return;
    }
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') { seek(t + 5); }
    else if (e.key === 'ArrowLeft') { seek(t - 5); }
    else if (e.key === 'm') { $('btnSound').click(); }
    else if (e.key === 'f') { $('btnFull').click(); }
  });
  stage.addEventListener('pointermove', (e) => {
    if (started || M === 0) return;
    const r = stage.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
    const tw = $('tkWrap');
    if (tw) tw.style.transform = `rotateY(${dx * 7}deg) rotateX(${-dy * 6}deg)`;
  });
  stage.addEventListener('pointerleave', () => { const tw = $('tkWrap'); if (tw && !started) tw.style.transform = ''; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });
  reduce.addEventListener('change', () => { M = reduce.matches ? 0 : 1; build(); });
  let rz = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { sizeStage(); build(); }, 140);
  });

  // film grain texture, generated once
  (() => {
    const n = document.createElement('canvas');
    n.width = n.height = 160;
    const g = n.getContext('2d'), img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    stage.style.setProperty('--noise', `url(${n.toDataURL()})`);
  })();

  // warm the photo cache so cuts never land on an empty frame
  SHOTS.forEach((s) => { const im = new Image(); im.decoding = 'async'; im.src = PH + s.img + '.webp'; });

  sizeStage();
  renderPage();
  build();
  setOverlay('start');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => build());
  if (location.hash === '#autoplay') { soundOn = false; play(); }
})();
