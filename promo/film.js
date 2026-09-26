(function () {
  'use strict';
  const { ease, clamp, lerp, $, style, renderAudio } = PV;
  const q = new URLSearchParams(location.search);
  const LANG = q.get('film') === 'en' ? 'en' : 'ja';
  const RENDER = false;
  document.querySelectorAll('img[data-src]').forEach(im => { im.src = LANG === 'en' ? im.dataset.en : im.dataset.src; });
  const FPS = 30, FRAMES = 1290, DURATION = FRAMES / FPS;
  document.documentElement.lang = LANG;
  document.body.classList.toggle('lang-en', LANG === 'en');
  if (RENDER) document.body.classList.add('render');

  // ---------- copy ----------
  const COPY = {
    ja: {
      s1eb: 'LOOK UP FROM YOUR SCREEN', s1l1: ['スマホを見る時間を、'], s1l2: ['窓を見る時間へ。'], credit: '写真：michikusa',
      mark: '窓', wordmark: '新幹線の窓', s2def: ['東海道新幹線の', '車窓ガイド'], countUnit: '景', s2label: '東京 ⇄ 新大阪',
      s3eb: '01　乗る前', s3h: ['乗る列車を選ぶと、', '時刻が決まる。'], caveat: '※時刻はのぞみ基準の目安です', suffix: '頃', seatE: 'E席',
      s4eb: '02　乗車中', s4h: ['次の景色を、', '地図と音声で知る。'], audio: '音声ガイド α', s4sub: ['E席側に富士山が', '大きく迫ります。'], s4pill: 'E席・山側', s4cdl: 'つぎの車窓　富士山',
      s5h: ['スマホより先に、', 'まず窓を。'],
      s6eb: '車窓図鑑', s6h: ['富士山だけで、終わらせない。'], s6sub: '写真と解説から、見たい景色を探す。',
      tiles: [['富士山', 'E席', 'e'], ['静岡の茶畑', 'A席・E席', 'ae'], ['東寺 五重塔', 'A席', 'a']], railA: '東京', railB: '新大阪',
      s7eb: '03　降りたあと', s7h: ['見つけた景色を、', '旅の記録に。'],
      s8eb: 'YOUR NEXT WINDOW JOURNEY', s8h: ['次の新幹線は、', '窓から始めよう。'], url: 'michikusa-travel.com →',
      foot: '写真：michikusa ｜ 地図：© OpenStreetMap contributors ｜ 時刻はのぞみ基準の目安です',
    },
    en: {
      s1eb: 'LOOK UP FROM YOUR SCREEN', s1l1: ['Turn screen time'], s1l2: ['into window time.'], credit: 'Photo: michikusa',
      mark: 'W', wordmark: 'Shinkansen Window', s2def: ['Tokaido Shinkansen', 'window-view guide'], countUnit: 'views', s2label: 'Tokyo ⇄ Shin-Osaka',
      s3eb: '01  BEFORE THE RIDE', s3h: ['Choose your train,', 'and the timing follows.'], caveat: '*Times are Nozomi-based estimates', suffix: 'approx.', seatE: 'Seat E',
      s4eb: '02  ON THE TRAIN', s4h: ['Know the next view', 'with a map and audio.'], audio: 'Audio Guide α', s4sub: ['Fuji rises large', 'on the Seat E side.'], s4pill: 'Seat E · Mountain', s4cdl: 'NEXT VIEW  Mt. Fuji',
      s5h: ['Window first,', 'camera second.'],
      s6eb: 'WINDOW FIELD GUIDE', s6h: ['Mt. Fuji is only the beginning.'], s6sub: 'Find the views you want to see.',
      tiles: [['Mt. Fuji', 'Seat E', 'e'], ['Shizuoka Tea Fields', 'Seats A and E', 'ae'], ['To-ji Pagoda', 'Seat A', 'a']], railA: 'Tokyo', railB: 'Shin-Osaka',
      s7eb: '03  AFTER THE RIDE', s7h: ['Turn the views you spot', 'into a travel record.'],
      s8eb: 'YOUR NEXT WINDOW JOURNEY', s8h: ['Your next Shinkansen ride', 'starts with the window.'], url: 'michikusa-travel.com →',
      foot: 'Photos: michikusa | Map: © OpenStreetMap contributors | Times are Nozomi-based estimates',
    },
  }[LANG];
  const EN = LANG === 'en';

  const setLines = (id, lines) => { $('#' + id).innerHTML = lines.map((l) => `<span class="ln"><span>${l}</span></span>`).join(''); };
  const text = (id, s) => { $('#' + id).textContent = s; };
  ['s1l1', 's1l2', 's2def', 's3h', 's4h', 's4sub', 's5h', 's6h', 's7h', 's8h'].forEach((k) => setLines(k, COPY[k]));
  ['s1eb', 'credit', 'wordmark', 'countUnit', 's2label', 's3eb', 's4eb', 's4pill', 's4cdl', 's6eb', 's6sub', 'railA', 'railB', 's7eb', 's8eb', 's8foot'].forEach((k) => text(k, COPY[k === 's8foot' ? 'foot' : k]));
  text('markTile', COPY.mark); text('sealTile', COPY.mark); text('s8word', COPY.wordmark);
  text('audioLabel', COPY.audio); text('urlPill', COPY.url);
  text('caveat3', COPY.caveat); text('s5cav', COPY.caveat);
  if (EN) {
    $('#wordmark').style.fontSize = '72px';
    ['s2def', 's8h'].forEach((id) => { $('#' + id).style.fontSize = '80px'; });
    ['s3h', 's4h', 's4sub', 's6h', 's7h'].forEach((id) => { $('#' + id).style.fontSize = '72px'; });
    $('#s8word').style.fontSize = '64px';
    $('#countUnit').style.fontSize = '64px';
    document.querySelectorAll('img[data-en]').forEach((im) => { im.src = im.dataset.en; });
  }
  const suffixHTML = EN ? '<span style="font:600 30px var(--sans);margin-left:10px">approx.</span>' : '<span class="hd" style="font-size:36px;color:#54616c;margin-left:4px">頃</span>';
  $('#tagSuffix').innerHTML = suffixHTML;
  $('#capSuffix').innerHTML = EN ? '<span style="font:600 24px var(--sans);margin-left:8px">approx.</span>' : '<span class="hd" style="font-size:28px;margin-left:4px">頃</span>';
  // tiles captions
  COPY.tiles.forEach(([name, seat, kind], i) => {
    const pill = kind === 'e' ? 'background:#faf6ef;color:#16202e'
      : kind === 'a' ? 'box-shadow:inset 0 0 0 2px rgba(255,255,255,.85);color:#fff'
      : 'background:linear-gradient(90deg,transparent 0 50%,#faf6ef 50%);box-shadow:inset 0 0 0 2px rgba(255,255,255,.85);color:#16202e';
    $('#tc' + (i + 1)).innerHTML = `<div class="hd" style="font-size:${EN ? 48 : 56}px;color:#faf6ef;line-height:1.2">${name}</div>` +
      `<div class="pill2" style="margin-top:18px;height:56px;padding:0 24px;font-size:36px;${pill}">${kind === 'ae' ? `<span style="color:#fff">${seat.split(/・| and /)[0]}</span><span style="margin:0 .15em;color:#fff">${EN ? '&nbsp;and&nbsp;' : '・'}</span><span>${seat.split(/・| and /)[1]}</span>` : seat}</div>`;
  });
  // audio bars
  const BAR_H = [16, 32, 22, 44, 22, 32, 16];
  $('#bars').innerHTML = BAR_H.map((h, i) => `<span style="left:${i * 16}px;height:${h}px"></span>`).join('');
  // rail dots at minutesFromTokyo / 147 (data.js): Fuji 44.5, tea fields 62, To-ji 131
  const DOTS = [[44.5, 898], [62, 902], [131, 906]];
  $('#railDots').innerHTML = DOTS.map(([m], i) => `<div id="rd${i}" style="position:absolute;left:${120 + 1680 * m / 147 - 7}px;top:874px;width:14px;height:14px;border-radius:50%;background:#e8704a;box-shadow:0 0 0 6px rgba(232,112,74,.25)"></div>`).join('');

  // live frames (real in-app countdown, one capture per real second)
  const LIVE = [[480, 8], [495, 7], [525, 6], [555, 5], [585, 4], [615, 3], [645, 2], [675, 1], [705, 0]];
  $('#liveBox').innerHTML = LIVE.map(([, n]) => `<img data-eta="${n}" src="assets/ui/${LANG}-live-fuji-eta0${n}.webp" alt="">`).join('');

  // ---------- geometry ----------
  const R = {
    PHONE: [1088, 124, 384, 832, 44],
    WL: [96, 54, 1728, 972, 64],
    WR: [920, 230, 880, 495, 36],
    FULL: [0, 0, 1920, 1080, 0],
    T1: [120, 330, 520, 292, 28], T2: [700, 330, 520, 292, 28], T3: [1280, 330, 520, 292, 28],
  };
  const F = (n) => n; // frames
  const lerpRect = (a, b, p, pr) => [0, 1, 2, 3].map((i) => lerp(a[i], b[i], p)).concat(lerp(a[4], b[4], pr));
  const MORPHS = [ // [start, from, to, kind: open|close|move]
    [36, 'PHONE', 'WL', 'open'], [150, 'WL', 'WR', 'move'], [300, 'WR', 'PHONE', 'close'],
    [705, 'PHONE', 'FULL', 'open'], [840, 'FULL', 'T1', 'move'], [975, 'T3', 'PHONE', 'close'], [1095, 'PHONE', 'FULL', 'open'],
  ];
  function mainRect(f) {
    // returns [x,y,w,h,r,bezel]
    let rect = R.PHONE, bezel = 14;
    if (f < 36) { rect = R.PHONE; bezel = 14; }
    for (const [s, a, b, kind] of MORPHS) {
      if (f >= s && f < s + 36) {
        const p = ease.reveal(clamp((f - s) / 36)), pr = clamp((f - s) / 36);
        rect = lerpRect(R[a], R[b], p, pr);
        bezel = kind === 'open' ? 14 * (1 - clamp((f - s) / 12)) : kind === 'close' ? 14 * clamp((f - s - 24) / 12) : 0;
        return [...rect, bezel];
      }
      if (f >= s + 36) { rect = R[b]; bezel = b === 'PHONE' ? 14 : 0; }
    }
    return [...rect, bezel];
  }
  const clipStr = (r) => `inset(${r[1]}px ${1920 - r[0] - r[2]}px ${1080 - r[1] - r[3]}px ${r[0]}px round ${r[4]}px)`;
  const place = (el, r) => style(el, { left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px' });
  const op = (el, v) => style(el, { opacity: String(clamp(v)), visibility: v > 0.001 ? 'visible' : 'hidden' });
  const fade = (f, a, b) => clamp((f - a) / (b - a)); // linear 0..1
  const inOut = (f, a, b, c, d) => Math.min(fade(f, a, b), 1 - fade(f, c, d)); // in a..b, out c..d

  // photo cover with focal point and scale (object-position = focal, transform-origin = focal)
  function photo(img, r, fx, fy, scale, dx = 0) {
    place(img, r);
    style(img, { objectPosition: `${fx * 100}% ${fy * 100}%`, transformOrigin: `${fx * r[2]}px ${fy * r[3]}px`, transform: `translateX(${dx}px) scale(${scale})` });
  }
  // capture image inside a phone-shaped box (384 wide), cropY in capture px, offsetY in video px
  const CAP_S = 384 / 1170;
  function capture(box, img, r, cropY = 0, dy = 0) {
    place(box, r);
    style(img, { top: (-cropY * CAP_S + dy) + 'px' });
  }

  const els = {};
  ['bg', 'vignette', 'phoneShadow', 'bezel', 'cam', 'scrimL', 'scrimB', 'cHome', 'homeBox', 'c0913', 'p0913', 'cForm', 'formBox', 'formImg', 'cRow', 'rowBox', 'rowImg', 'cLive', 'liveBox', 'c0211', 'p0211', 'cToji', 'pToji', 'cStamps', 'stampsBox', 'cCoral',
    'tile2', 'tea', 'bar2', 'tile3', 'toji3', 'bar3', 'rowRing', 'tag', 'tap', 'dotRing', 'bars', 'cdDigits', 'stampRing', 'st1', 'st2', 'st3', 'water', 'sealTile', 'rail', 'count']
    .forEach((id) => { els[id] = document.getElementById(id); });
  const liveImgs = [...els.liveBox.querySelectorAll('img')];
  liveImgs.forEach((im) => style(im, { left: '0px', top: '0px', width: '384px' }));

  const mix = (c1, c2, p) => { const a = c1.match(/\w\w/g).map((h) => parseInt(h, 16)), b = c2.match(/\w\w/g).map((h) => parseInt(h, 16)); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], p))).join(',')})`; };
  const NIGHT = '101c2c', PAPER = 'f6f2e9', CORAL = 'e8704a';
  function bgColor(f) {
    if (f < 300) return '#' + NIGHT;
    if (f < 470) return mix(NIGHT, PAPER, ease.inOut(fade(f, 300, 330)));
    if (f < 975) return mix(PAPER, NIGHT, ease.inOut(fade(f, 476, 492)));
    if (f < 1095) return mix(NIGHT, PAPER, ease.inOut(fade(f, 975, 1005)));
    return mix(PAPER, CORAL, ease.inOut(fade(f, 1095, 1125)));
  }

  // text reveal helper in frames: lines rise from fIn with stagger frames, out over [fOut-9, fOut]
  function lines(id, f, fIn, stagger, fOut, outLen = 9) {
    PV.revealLines($('#' + id), f / FPS, fIn / FPS, { stagger: stagger / FPS, dur: 21 / FPS, tOut: fOut / FPS, outDur: outLen / FPS });
  }
  // simple rise-in element (non-line): translateY + opacity
  function rise(id, f, fIn, fOut, len = 18, outLen = 9) {
    const el = typeof id === 'string' ? $('#' + id) : id;
    const p = ease.reveal(fade(f, fIn, fIn + len));
    const o = Math.min(p, 1 - fade(f, fOut - outLen, fOut));
    style(el, { transform: `translateY(${(1 - p) * 24}px)` });
    op(el, o);
  }
  function press(el, f, s, rot = 0) { // 8-frame press: 0 op0 scale1.35 blur3 → 4 scale.97 op1 → 8 scale1
    const k = f - s;
    if (k < 0) { op(el, 0); return; }
    let sc, o, bl;
    if (k < 4) { const p = ease.out(k / 4); sc = lerp(1.35, 0.97, p); o = p; bl = lerp(3, 0, p); }
    else { const p = ease.out(clamp((k - 4) / 4)); sc = lerp(0.97, 1, p); o = 1; bl = 0; }
    style(el, { transform: `rotate(${rot}deg) scale(${sc})`, filter: bl > 0.01 ? `blur(${bl}px)` : 'none' });
    op(el, o);
    return o;
  }
  function ring(el, f, s, cx, cy, r0, r1, len = 12, o0 = 0.9) {
    const k = (f - s) / len;
    if (k < 0 || k > 1) { op(el, 0); return; }
    const r = lerp(r0, r1, ease.out(k));
    style(el, { left: cx - r + 'px', top: cy - r + 'px', width: 2 * r + 'px', height: 2 * r + 'px' });
    op(el, o0 * (1 - k));
  }

  // ---------- frame ----------
  function render(f) {
    const t = f / FPS;
    style(els.bg, { background: bgColor(f) });
    op(els.vignette, f < 300 ? 1 : 1 - fade(f, 300, 320));

    // main morph rect
    const m = mainRect(f);
    const rect = m.slice(0, 5), bez = m[5];
    let enterY = 0, enterO = 1;
    if (f < 24) { enterY = 24 * (1 - ease.reveal(f / 24)); enterO = fade(f, 0, 8); }
    const r = [rect[0], rect[1] + enterY, rect[2], rect[3], rect[4]];
    const isPhoneish = bez > 0.01 || (f >= 300 && f < 705) || (f >= 975 && f < 1095);
    style(els.bezel, { left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px', borderRadius: r[4] + 'px', boxShadow: `0 0 0 ${bez}px #081521, 0 0 0 ${bez + 1}px rgba(255,255,255,${bez > 0 ? 0.08 : 0})` });
    op(els.bezel, enterO * (bez > 0.01 ? 1 : 0));
    style(els.phoneShadow, { left: r[0] - bez + 'px', top: r[1] - bez + 'px', width: r[2] + 2 * bez + 'px', height: r[3] + 2 * bez + 'px', borderRadius: r[4] + bez + 'px', boxShadow: '0 32px 90px rgba(1,9,16,.36)' });
    op(els.phoneShadow, enterO * clamp(bez / 14) * (f >= 1095 ? 0 : 1));
    style(els.cam, { left: r[0] + r[2] / 2 + 'px', top: r[1] - 7 + 'px' });
    op(els.cam, enterO * clamp((bez - 10) / 4));
    const clip = clipStr(r);
    for (const id of ['cHome', 'c0913', 'cForm', 'cRow', 'cLive', 'c0211', 'cToji', 'cStamps', 'cCoral']) style(els[id], { clipPath: clip });

    // contents
    const PH = [...R.PHONE.slice(0, 2).map((v, i) => v + (i === 1 ? enterY : 0)), 384, 832];
    // S1 home capture
    capture(els.homeBox, null && 0, PH);
    op(els.cHome, enterO * (1 - fade(f, 36, 54)));
    // 20230913: WL until 150, moving 150-186, WR after; fade in 42-60, out 300-318
    {
      let lay = R.WL;
      if (f >= 150 && f < 186) lay = rect; else if (f >= 186) lay = R.WR;
      const kb = lerp(1.06, 1.0, ease.out(fade(f, 36, 285)));
      photo(els.p0913, lay, 0.5, 0.47, kb, 12 * fade(f, 36, 285) * (lay[2] / 1728));
      op(els.c0913, inOut(f, 42, 60, 300, 318));
    }
    // S3 form + row captures (slide at 354-372)
    {
      const s = ease.inOut(fade(f, 354, 372));
      capture(els.formBox, null, R.PHONE);
      style(els.formImg, { top: (-210 * CAP_S - 832 * s) + 'px' });
      op(els.cForm, inOut(f, 306, 324, 372, 373));
      capture(els.rowBox, null, R.PHONE);
      style(els.rowImg, { top: (832 * (1 - s)) + 'px' });
      op(els.cRow, f >= 354 ? inOut(f, 354, 355, 480, 490) : 0);
    }
    // S4 live frames
    {
      place(els.liveBox, R.PHONE);
      let idx = 0;
      for (let i = 0; i < LIVE.length; i++) if (f >= LIVE[i][0]) idx = i;
      liveImgs.forEach((im, i) => op(im, i === idx ? 1 : 0));
      op(els.cLive, inOut(f, 480, 490, 705, 723));
    }
    // 20240211 full → T1 (Ken Burns about summit 63.4%/44.4%)
    {
      let lay = R.FULL;
      if (f >= 840 && f < 876) lay = rect; else if (f >= 876) lay = R.T1;
      const kb = lerp(1.46, 1.40, ease.out(fade(f, 705, 840)));
      photo(els.p0211, lay, 1217 / 1920, 480 / 1080, kb);
      op(els.c0211, inOut(f, 711, 729, 963, 975));
    }
    // To-ji continues in main rect from 975 (fade out 975-993)
    photo(els.pToji, R.T3, 0.5, 0.45, 1.04, -10);
    op(els.cToji, f >= 975 ? 1 - fade(f, 975, 993) : 0);
    // stamps capture
    capture(els.stampsBox, null, R.PHONE);
    op(els.cStamps, inOut(f, 981, 999, 1095, 1113));
    // coral
    op(els.cCoral, f >= 1095 ? fade(f, 1101, 1119) : 0);

    // scrims (only over full / window photos)
    style(els.scrimL, { left: '0px', top: '0px', width: '1100px', height: '1080px', background: 'linear-gradient(90deg, rgba(8,21,33,.62), rgba(8,21,33,0))' });
    op(els.scrimL, Math.max(inOut(f, 48, 66, 141, 160) * 0.9, inOut(f, 720, 740, 828, 840)));
    style(els.scrimB, { left: '0px', top: '760px', width: '1920px', height: '320px', background: 'linear-gradient(0deg, rgba(8,21,33,.7), rgba(8,21,33,0))' });
    op(els.scrimB, inOut(f, 711, 729, 840, 860));

    // ---- S1 ----
    rise('s1eb', f, 0, 150, 20);
    lines('s1l1', f, 6, 8, 150);
    lines('s1l2', f, 54, 8, 150);
    // credit positions per scene
    {
      const c = $('#credit');
      if (f < 150) { style(c, { left: 'auto', right: '120px', top: '982px', color: 'rgba(255,255,255,.75)' }); op(c, inOut(f, 60, 72, 145, 150)); }
      else if (f < 300) { style(c, { right: '120px', top: '740px', color: 'rgba(255,255,255,.6)' }); op(c, inOut(f, 186, 200, 288, 297)); }
      else if (f >= 730 && f < 840) { style(c, { right: '120px', top: '1012px', color: 'rgba(255,255,255,.75)' }); op(c, inOut(f, 730, 748, 830, 840)); }
      else if (f >= 870 && f < 975) { style(c, { right: '120px', top: '1016px', color: 'rgba(255,255,255,.6)' }); op(c, inOut(f, 870, 888, 963, 975)); }
      else op(c, 0);
    }

    // ---- S2 ----
    lines('s2lock', f, 168, 8, 297);
    style(els.sealTile, {});
    style($('#markTile'), { transform: `scale(${lerp(0.92, 1, ease.reveal(fade(f, 168, 189)))})` });
    lines('s2def', f, 178, 8, 297);
    {
      const p = ease.out(fade(f, 208, 238));
      els.count.textContent = String(Math.round(50 * p))+'+';
      rise('s2count', f, 208, 297, 12);
      rise('s2label', f, 214, 297, 21);
    }

    // ---- S3 ----
    rise('s3eb', f, 312, 480, 21);
    lines('s3h', f, 318, 8, 480);
    // tap ring at the find button
    {
      const k = (f - 348) / 12;
      if (k >= 0 && k <= 1) { const s = lerp(0.6, 1, ease.out(k)); style(els.tap, { left: '1280px', top: (124 + (2113 - 210) * CAP_S) + 'px', transform: `scale(${s})`, background: 'rgba(232,112,74,.18)', boxShadow: '0 0 0 2px #e8704a', width: '56px', height: '56px', margin: '-28px 0 0 -28px' }); op(els.tap, 1 - k); }
      else op(els.tap, 0);
    }
    // row pulse and tag flip
    const ROW = window.__row || { x: 70, y: 300, w: 280, h: 136.5 };
    const rowV = [1088 + ROW.x * 0.98462, 124 + ROW.y * 0.98462, ROW.w * 0.98462, ROW.h * 0.98462];
    {
      const k = (f - 372) / 12;
      if (k >= 0 && k <= 1) {
        const s = lerp(1, 1.04, k);
        style(els.rowRing, { left: rowV[0] + 'px', top: rowV[1] + 'px', width: rowV[2] + 'px', height: rowV[3] + 'px', borderRadius: '14px', transform: `scale(${s})` });
        op(els.rowRing, 0.9 * (1 - k));
      } else op(els.rowRing, 0);
    }
    {
      const p = ease.reveal(fade(f, 378, 396));
      const tr = [120, 520, 860, 200];
      const x = lerp(rowV[0], tr[0], p), y = lerp(rowV[1], tr[1], p), w = lerp(rowV[2], tr[2], p), h = lerp(rowV[3], tr[3], p);
      style(els.tag, { transform: `translate(${x - tr[0]}px, ${y - tr[1]}px) scale(${w / tr[2]}, ${h / tr[3]})`, transformOrigin: '0 0' });
      op(els.tag, f >= 378 ? inOut(f, 378, 384, 471, 480) : 0);
    }
    rise('caveat3', f, 390, 480, 18);

    // ---- S4 ----
    rise('s4eb', f, 492, 705, 21);
    lines('s4h', f, 498, 8, 594);
    {
      const o = inOut(f, 588, 606, 705, 714);
      op($('#s4audio'), o);
      const spans = els.bars.children;
      for (let i = 0; i < spans.length; i++) {
        const a = 0.6 + 0.4 * Math.sin(2 * Math.PI * t / 0.5 + i * 0.7);
        style(spans[i], { height: BAR_H[i] * a + 'px', bottom: (44 - BAR_H[i]) / 2 + 'px' });
      }
    }
    lines('s4sub', f, 594, 8, 714);
    rise('s4pill', f, 615, 714, 18);
    rise('s4cdl', f, 606, 726, 18);
    {
      const el = $('#s4cd');
      const o = inOut(f, 606, 615, 717, 726);
      op(el, o);
      let n = 3, s0 = 615;
      if (f >= 705) { n = 0; s0 = 705; } else if (f >= 675) { n = 1; s0 = 675; } else if (f >= 645) { n = 2; s0 = 645; }
      els.cdDigits.textContent = '00:0' + n;
      const p = ease.out(fade(f, s0, s0 + 6));
      style(els.cdDigits, { transform: `translateY(${(1 - p) * 16}px)`, opacity: String(f < 615 ? 1 : Math.max(0.2, p)) });
    }
    // pulse on the live map train marker every 30 frames from 520
    if (f >= 520 && f < 705) { const s = 520 + Math.floor((f - 520) / 30) * 30; ring(els.dotRing, f, s, 1277, 354, 8, 22, 30, 0.6); } else op(els.dotRing, 0);

    // ---- S5 ----
    lines('s5h', f, 714, 8, 837);
    {
      const o = inOut(f, 730, 748, 840, 852);
      op($('#s5cap'), o); op($('#s5cav'), o);
    }

    // ---- S6 ----
    rise('s6eb', f, 852, 975, 18, 12);
    lines('s6h', f, 858, 8, 975, 12);
    rise('s6sub', f, 866, 975, 18, 12);
    function tile(tileEl, imgEl, barEl, T, s, dir, drift) {
      place(tileEl, T);
      style(tileEl, { borderRadius: T[4] + 'px' });
      const p = ease.inOut(fade(f, s, s + 11));
      const bx = dir > 0 ? lerp(T[0] - 40, T[0] + T[2], p) : lerp(T[0] + T[2], T[0] - 40, p);
      // reveal behind trailing edge
      const visL = dir > 0 ? 0 : Math.max(0, bx + 40 - T[0]);
      const visR = dir > 0 ? Math.max(0, T[0] + T[2] - bx) : 0;
      style(tileEl, { clipPath: `inset(0 ${dir > 0 ? visR : 0}px 0 ${dir > 0 ? 0 : visL}px round ${T[4]}px)` });
      const kb = lerp(1.0, 1.04, fade(f, s, 975));
      style(imgEl, { transform: `translateX(${drift * fade(f, s, 975)}px) scale(${kb})` });
      const o = f >= s ? 1 : 0;
      op(tileEl, o * (tileEl === els.tile2 ? 1 - fade(f, 963, 975) : (f < 975 ? 1 : 0)));
      place(barEl, [bx, T[1], 40, T[3]]);
      op(barEl, f >= s && f <= s + 11 ? 1 : 0);
    }
    tile(els.tile2, els.tea, els.bar2, R.T2, 862, 1, 10);
    tile(els.tile3, els.toji3, els.bar3, R.T3, 868, -1, -10);
    style(els.toji3, { objectPosition: '50% 45%' });
    rise('tc1', f, 870, 975, 18, 12);
    rise('tc2', f, 868, 975, 18, 12);
    rise('tc3', f, 874, 975, 18, 12);
    {
      const p = ease.reveal(fade(f, 890, 914));
      style(els.rail, { width: 1680 * p + 'px' });
      const o = 1 - fade(f, 963, 975);
      op(els.rail, f >= 890 ? o : 0);
      rise('railA', f, 890, 975, 18, 12); rise('railB', f, 896, 975, 18, 12);
      DOTS.forEach(([, s], i) => { const d = $('#rd' + i); const pp = ease.out(fade(f, s, s + 8)); style(d, { transform: `scale(${pp})` }); op(d, f >= s ? o : 0); });
    }

    // ---- S7 ----
    rise('s7eb', f, 984, 1095, 21);
    lines('s7h', f, 990, 8, 1095);
    [[els.st1, 1022, -7, 120], [els.st2, 1032, 4, 356], [els.st3, 1042, -3, 592]].forEach(([el, s, rot, x]) => {
      style(el, { left: x + 'px', top: '520px' });
      const o = press(el, f, s, rot);
      if (f >= 1095) op(el, (o || 1) * (1 - fade(f, 1095, 1104)));
    });
    ring(els.stampRing, f, 1026, 1236, 542, 35, 40, 12, 0.8);

    // ---- S8 ----
    {
      const p = ease.out(fade(f, 1113, 1143));
      style(els.water, { right: '-51px', bottom: '-256px', transform: `scale(${lerp(1.04, 1, p)})`, transformOrigin: '100% 100%' });
      op(els.water, f >= 1113 ? p : 0);
    }
    rise('s8eb', f, 1113, 99999, 21);
    lines('s8h', f, 1119, 8, 99999);
    {
      const o = press(els.sealTile, f, 1139, 0);
      op($('#s8lock'), f >= 1139 ? 1 : 0);
      op(els.sealTile, o || 0);
      const w = $('#s8word');
      const p = ease.reveal(fade(f, 1145, 1163));
      style(w, { transform: `translateY(${(1 - p) * 20}px)` }); op(w, f >= 1145 ? p : 0);
    }
    rise('s8url', f, 1145, 99999, 21);
    rise('s8foot', f, 1160, 99999, 18);
  }

  // ---------- soundtrack (synthesized, see storyboard/final.json "audio") ----------
  async function audio(from, to, { night = false } = {}) {
    return renderAudio(from, to, async (sourceApi, sourceRev) => {
      // Schedule one continuous score. Only scene cues move for the night chapter;
      // the noise bed and oscillator phases never stop or restart at its edges.
      const shift = t => night && t >= 32.5 ? t + 6 : t;
      const retime = source => {
        const target = { ...source, T: t => source.T(shift(t)) };
        for (const name of ['tone', 'whoosh', 'tick', 'thump'])
          target[name] = (t, ...args) => source[name](shift(t), ...args);
        return target;
      };
      const api = retime(sourceApi), rev = retime(sourceRev);
      const scoreDuration = DURATION + (night ? 6 : 0);
      const { ctx, T } = api;
      const dur = to - from;
      // BED: brown noise → HP 35 → LP (morph-linked) → level
      const src = api.noise('brown', 0, scoreDuration, 21);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 35;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
      const g = ctx.createGain();
      src.connect(hp).connect(lp).connect(g).connect(api.out);
      const LP = [[0, 180], [1.2, 180], [2.4, 1400], [10.0, 1400], [11.2, 180], [23.5, 180], [24.7, 2400], [28.0, 2400], [29.2, 1200], [32.5, 1200], [33.7, 180], [36.5, 180], [37.7, 800]];
      lp.frequency.setValueAtTime(LP[0][1], T(0));
      LP.forEach(([tt, v]) => lp.frequency.linearRampToValueAtTime(v, T(tt)));
      const db = (d) => Math.pow(10, d / 20);
      // level: phone scenes quieter, window scenes louder; duck at climax; fades
      const LV = [[0, -60], [1.5, -30], [2.4, -24], [10.0, -24], [11.2, -30], [16, -27], [23.5, -27], [24.0, -34], [27.8, -34], [29.2, -25], [32.5, -25], [33.7, -30], [38.0, -30], [41.0, -70]];
      g.gain.setValueAtTime(db(LV[0][1]), T(0));
      LV.forEach(([tt, v]) => g.gain.linearRampToValueAtTime(db(v) * 4, T(tt)));
      // low rumble sines
      [[48, -36], [96, -42]].forEach(([fr, d]) => {
        const o = ctx.createOscillator(); o.frequency.value = fr;
        const og = ctx.createGain(); og.gain.setValueAtTime(0, T(0)); og.gain.linearRampToValueAtTime(db(d), T(1.5)); og.gain.setValueAtTime(db(d), T(38)); og.gain.linearRampToValueAtTime(0, T(41));
        o.connect(og).connect(api.out); o.start(T(0)); o.stop(T(DURATION));
      });
      // whooshes
      api.whoosh(1.2, 0.9, 500, 1800, { db: -28 });
      api.whoosh(5.0, 0.9, 700, 1100, { db: -34 });
      api.whoosh(10.0, 0.9, 1800, 500, { db: -28 });
      api.whoosh(16.0, 0.5, 900, 1400, { db: -36 });
      api.whoosh(23.5, 1.1, 500, 2400, { db: -24 });
      api.whoosh(28.0, 0.9, 1800, 700, { db: -30 });
      api.whoosh(28.73, 0.14, 2500, 6000, { db: -34, panFrom: -0.6, panTo: 0.6, kind: 'white', q: 0.7 });
      api.whoosh(28.93, 0.14, 2500, 6000, { db: -34, panFrom: 0.6, panTo: -0.6, kind: 'white', q: 0.7 });
      api.whoosh(32.5, 0.9, 1800, 500, { db: -28 });
      api.whoosh(36.5, 0.9, 500, 1500, { db: -30 });
      api.whoosh(11.8, 0.25, 3000, 5000, { db: -36, kind: 'white' });
      // count-up ticks
      for (let i = 0; i < 8; i++) api.tick(6.93 + i * 4 / 30, { freq: 2000, db: -32 });
      // UI tap and tag pop
      api.tone(11.6, 2200, { db: -26, attack: 0.001, decay: 0.02, dur: 0.1 });
      api.tone(12.6, 660, { db: -30, attack: 0.004, decay: 0.05, dur: 0.2, freqEnd: 880, glide: 0.06 });
      // audio-guide chime: A5 then E5 (original two-note motif), with reverb send
      const partials = [[1, 1], [2, 0.35], [3, 0.12]];
      for (const [tt, fr] of [[19.6, 880], [19.82, 659.25]]) {
        api.tone(tt, fr, { db: -14, attack: 0.006, decay: 0.55, dur: 3.5, partials });
        rev.tone(tt, fr, { db: -14, attack: 0.006, decay: 0.55, dur: 3.5, partials });
      }
      // countdown ticks 3,2,1
      for (const tt of [20.5, 21.5, 22.5]) api.tone(tt, 1200, { type: 'triangle', db: -30, attack: 0.001, decay: 0.03, dur: 0.15 });
      // Fuji pad
      [[220, 0], [329.63, 3], [554.37, -3]].forEach(([fr, cents]) => {
        const o = ctx.createOscillator(); o.frequency.value = fr; o.detune.setValueAtTime(-cents, T(23.5)); o.detune.linearRampToValueAtTime(cents, T(28.7));
        const og = ctx.createGain(); og.gain.setValueAtTime(0, T(23.5)); og.gain.linearRampToValueAtTime(db(-26), T(24.3)); og.gain.setValueAtTime(db(-26), T(27.5)); og.gain.linearRampToValueAtTime(0, T(28.7));
        o.connect(og).connect(api.out); o.start(T(23.5)); o.stop(T(28.8));
        const r2 = ctx.createGain(); r2.gain.value = 0.5; og.connect(r2).connect(rev.out);
      });
      // stamp thumps with slight variation
      [[34.2, 1.0, 0], [34.53, 0.96, -2], [34.87, 1.04, 1]].forEach(([tt, k, d], i) => api.thump(tt, { db: -14 + d, f0: 90 * k, f1: 60 * k, seed: 40 + i }));
      // seal thump
      api.thump(38.17, { db: -12, f0: 75, f1: 45, seed: 77 });
      // closing pad D3 A3 F#4
      [[146.83, 0], [220, 3], [369.99, -3]].forEach(([fr, cents]) => {
        const o = ctx.createOscillator(); o.frequency.value = fr; o.detune.setValueAtTime(-cents, T(38.2)); o.detune.linearRampToValueAtTime(cents, T(42.8));
        const og = ctx.createGain(); og.gain.setValueAtTime(0, T(38.2)); og.gain.linearRampToValueAtTime(db(-22), T(39.4)); og.gain.setValueAtTime(db(-22), T(40.4)); og.gain.linearRampToValueAtTime(0, T(42.8));
        o.connect(og).connect(api.out); o.start(T(38.2)); o.stop(T(42.9));
        const r2 = ctx.createGain(); r2.gain.value = 0.4; og.connect(r2).connect(rev.out);
      });
      void dur;
    }, { peakDb: -1.5, reverbWet: 0.25 });
  }

  // File-safe metadata from the captured DOM; no fetch / server is needed.
  const ready = (async () => {
    const j = window.PV_ASSET_DATA[LANG];
    if (!j?.rect?.text) throw new Error('Missing captured timetable metadata');
    window.__row = j.rect;
    const m = /(\d\d:\d\d)/.exec(j.rect.text);
    if (!m) throw new Error('Missing captured timetable time');
    text('tagTime', m[1]); text('capTime', m[1]);
    text('tagName', j.row); text('capName', j.row);
    const seat = /(E席|Seat E|A席|Seat A)/.exec(j.rect.text);
    text('tagSeat', seat ? seat[1] : COPY.seatE); text('capSeat', seat ? seat[1] : COPY.seatE);
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('#stage img')].map(im => im.decode()));
    render(0);
  })();
  window.PV_FILM = { ready, render, audio, copy: COPY, lang: LANG, fps: FPS, duration: DURATION };
})();
