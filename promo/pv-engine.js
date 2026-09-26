/* PV engine — deterministic, seekable animation + synthesized soundtrack.
 *
 * Every visual value is a pure function of time t (seconds). There are no CSS
 * transitions, CSS animations or timers in the film itself, so tools/render.mjs
 * can seek any frame and capture it exactly.
 *
 * Page contract used by tools/render.mjs:
 *   window.__pv = { duration, ready: Promise, seek(t), audio(from, to) }
 */
(function () {
  'use strict';

  // ---------- easing ----------
  function cubicBezier(x1, y1, x2, y2) {
    // Newton-Raphson + bisection solve for x -> t, as browsers do.
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) return sy(t);
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0, hi = 1; t = x;
      for (let i = 0; i < 30; i++) {
        const v = sx(t);
        if (Math.abs(v - x) < 1e-6) break;
        if (x > v) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }
  const ease = {
    linear: (x) => x,
    reveal: cubicBezier(0.2, 0.75, 0.2, 1),   // the site's .reveal curve
    travel: cubicBezier(0.65, 0, 0.35, 1),
    whip: cubicBezier(0.7, 0, 0.3, 1),
    inOut: cubicBezier(0.45, 0, 0.55, 1),
    out: cubicBezier(0.22, 1, 0.36, 1),
    in: cubicBezier(0.55, 0, 1, 0.45),
  };

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  // progress of t through [a, b], eased
  const prog = (t, a, b, e = ease.linear) => e(clamp((t - a) / (b - a)));
  // a value that fades in over [a, a+inDur] and out over [b-outDur, b]
  const window01 = (t, a, b, inDur, outDur, eIn = ease.reveal, eOut = ease.inOut) =>
    Math.min(prog(t, a, a + inDur, eIn), 1 - prog(t, b - outDur, b, eOut));

  // ---------- DOM helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  function style(el, props) {
    if (!el) return;
    for (const k in props) {
      const v = props[k];
      if (el.__pvStyle && el.__pvStyle[k] === v) continue;
      (el.__pvStyle || (el.__pvStyle = {}))[k] = v;
      if (k.startsWith('--')) el.style.setProperty(k, v); else el.style[k] = v;
    }
  }
  const show = (el, on) => style(el, { visibility: on ? 'visible' : 'hidden' });

  /* Masked line reveal. Markup: <div class="lines"><span class="ln"><span>text</span></span>...</div>
   * Each .ln is overflow:hidden; its inner span rises from 105% to 0.
   * tIn: first line start; stagger: seconds between lines; dur: rise duration;
   * tOut/outDur: fade out (opacity only, small upward drift). */
  function revealLines(container, t, tIn, opts = {}) {
    if (!container) return;
    const { stagger = 8 / 30, dur = 21 / 30, tOut = Infinity, outDur = 10 / 30, drift = 0 } = opts;
    const lines = container.__pvLines || (container.__pvLines = $$('.ln > span', container));
    const outP = prog(t, tOut - outDur, tOut, ease.inOut);
    lines.forEach((sp, i) => {
      const p = prog(t, tIn + i * stagger, tIn + i * stagger + dur, ease.reveal);
      style(sp, { transform: `translate3d(0, ${(1 - p) * 105}%, 0)`, opacity: String(p) });
    });
    style(container, {
      opacity: String(1 - outP),
      transform: drift ? `translate3d(0, ${-drift * outP}px, 0)` : 'none',
      visibility: t >= tIn - 0.001 && outP < 1 ? 'visible' : 'hidden',
    });
  }

  // ---------- deterministic randomness ----------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- audio synthesis (OfflineAudioContext) ----------
  const SR = 48000;
  function noiseBuffer(ctx, seconds, kind = 'white', seed = 1) {
    const n = Math.max(1, Math.round(seconds * ctx.sampleRate));
    const buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const rnd = mulberry32(seed * 7 + c * 1013);
      const d = buf.getChannelData(c);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < n; i++) {
        const w = rnd() * 2 - 1;
        if (kind === 'white') d[i] = w;
        else if (kind === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else { // brown
          last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5;
        }
      }
    }
    return buf;
  }
  const dbToGain = (db) => Math.pow(10, db / 20);

  // Build helpers bound to one OfflineAudioContext; `off` shifts all times
  // (used when rendering a sub-range of the film).
  function synth(ctx, off = 0, master) {
    const out = master || ctx.destination;
    const T = (t) => Math.max(0, t - off);
    const api = {
      ctx, out, T,
      noise(kind, t0, dur, seed) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer(ctx, dur + 0.05, kind, seed);
        src.start(T(t0)); src.stop(T(t0 + dur + 0.05));
        return src;
      },
      // sine/triangle voice with exponential decay
      tone(t0, freq, { type = 'sine', db = -18, attack = 0.006, decay = 0.5, dur, partials = [[1, 1]], pan = 0, freqEnd, glide } = {}) {
        const d = dur || decay * 6;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, T(t0));
        g.gain.linearRampToValueAtTime(dbToGain(db), T(t0 + attack));
        g.gain.setTargetAtTime(0, T(t0 + attack), decay);
        const p = ctx.createStereoPanner(); p.pan.value = pan;
        g.connect(p).connect(out);
        partials.forEach(([mult, amp]) => {
          const o = ctx.createOscillator(); o.type = type;
          o.frequency.setValueAtTime(freq * mult, T(t0));
          if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd * mult, T(t0 + (glide || 0.08)));
          const a = ctx.createGain(); a.gain.value = amp;
          o.connect(a).connect(g); o.start(T(t0)); o.stop(T(t0 + d));
        });
        return g;
      },
      // band-passed noise sweep (whoosh). pan may move from panFrom to panTo.
      whoosh(t0, dur, f0, f1, { db = -26, q = 1.2, panFrom = 0, panTo = 0, kind = 'pink', seed = 3, peakAt = 0.5 } = {}) {
        const src = api.noise(kind, t0, dur, seed);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
        bp.frequency.setValueAtTime(f0, T(t0));
        bp.frequency.exponentialRampToValueAtTime(f1, T(t0 + dur));
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, T(t0));
        g.gain.exponentialRampToValueAtTime(dbToGain(db), T(t0 + dur * peakAt));
        g.gain.exponentialRampToValueAtTime(0.0001, T(t0 + dur));
        const p = ctx.createStereoPanner();
        p.pan.setValueAtTime(panFrom, T(t0)); p.pan.linearRampToValueAtTime(panTo, T(t0 + dur));
        src.connect(bp).connect(g).connect(p).connect(out);
      },
      // soft click/tick
      tick(t0, { freq = 2000, db = -30, decay = 0.012 } = {}) {
        api.tone(t0, freq, { db, attack: 0.001, decay, dur: 0.08 });
      },
      // rubber-stamp thump: pitch-drop sine + short paper click
      thump(t0, { db = -14, f0 = 90, f1 = 58, seed = 5 } = {}) {
        api.tone(t0, f0, { db, attack: 0.002, decay: 0.07, dur: 0.35, freqEnd: f1, glide: 0.07 });
        const src = api.noise('white', t0, 0.03, seed);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
        const g = ctx.createGain();
        g.gain.setValueAtTime(dbToGain(db - 8), T(t0)); g.gain.setTargetAtTime(0, T(t0 + 0.004), 0.008);
        src.connect(lp).connect(g).connect(out);
      },
    };
    return api;
  }

  // Simple feedback-free reverb send made from a decaying noise impulse.
  function makeReverb(ctx, seconds = 1.6, seed = 11) {
    const n = Math.round(seconds * ctx.sampleRate);
    const ir = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const rnd = mulberry32(seed + c * 31);
      const d = ir.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, 3.2);
    }
    const conv = ctx.createConvolver(); conv.buffer = ir; conv.normalize = true;
    return conv;
  }

  // Render a soundtrack for [from, to) seconds. build(api, reverbIn) schedules
  // events in film time. Output is peak-normalized to peakDb.
  async function renderAudio(from, to, build, { peakDb = -1.5, reverbWet = 0.25 } = {}) {
    const n = Math.max(1, Math.round((to - from) * SR));
    const ctx = new OfflineAudioContext(2, n, SR);
    const bus = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
    bus.connect(comp).connect(ctx.destination);
    const rev = makeReverb(ctx);
    const wet = ctx.createGain(); wet.gain.value = reverbWet;
    rev.connect(wet).connect(bus);
    const api = synth(ctx, from, bus);
    const revApi = synth(ctx, from, rev);
    await build(api, revApi);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const gain = peak > 0 ? dbToGain(peakDb) / peak : 1;
    for (let i = 0; i < n; i++) { L[i] *= gain; R[i] *= gain; }
    return { sampleRate: SR, data: [L, R], peak, gain };
  }

  // ---------- preview player (only when not rendering) ----------
  function mountPlayer({ duration, seek, audio, fps = 30 }) {
    const bar = document.createElement('div');
    bar.id = 'pv-player';
    bar.innerHTML = `
      <button type="button" data-act="play" aria-label="再生">▶</button>
      <input type="range" min="0" max="${duration}" step="${1 / fps}" value="0" aria-label="時間">
      <output>0.00 / ${duration.toFixed(2)}</output>
      <button type="button" data-act="sound" aria-pressed="true">音あり</button>`;
    document.body.appendChild(bar);
    const btn = bar.querySelector('[data-act=play]');
    const snd = bar.querySelector('[data-act=sound]');
    const range = bar.querySelector('input');
    const outEl = bar.querySelector('output');
    let playing = false, t = 0, startWall = 0, startT = 0, raf = 0, actx = null, srcNode = null, buffer = null, soundOn = true;
    const setT = (v) => { t = clamp(v, 0, duration); seek(t); range.value = t; outEl.textContent = `${t.toFixed(2)} / ${duration.toFixed(2)}`; };
    async function ensureBuffer() {
      if (buffer || !audio) return;
      const r = await audio(0, duration);
      actx = actx || new AudioContext({ sampleRate: r.sampleRate });
      buffer = actx.createBuffer(2, r.data[0].length, r.sampleRate);
      buffer.copyToChannel(r.data[0], 0); buffer.copyToChannel(r.data[1], 1);
    }
    function stopAudio() { if (srcNode) { try { srcNode.stop(); } catch (e) {} srcNode = null; } }
    function loop() {
      const now = performance.now() / 1000;
      setT(startT + (now - startWall));
      if (t >= duration) { pause(); return; }
      raf = requestAnimationFrame(loop);
    }
    async function play() {
      if (t >= duration - 0.01) setT(0);
      playing = true; btn.textContent = '❚❚'; btn.setAttribute('aria-label', '一時停止');
      if (soundOn && audio) {
        btn.disabled = true; await ensureBuffer(); btn.disabled = false;
        if (actx.state === 'suspended') await actx.resume();
        stopAudio(); srcNode = actx.createBufferSource(); srcNode.buffer = buffer; srcNode.connect(actx.destination); srcNode.start(0, t);
      }
      startWall = performance.now() / 1000; startT = t; loop();
    }
    function pause() { playing = false; btn.textContent = '▶'; btn.setAttribute('aria-label', '再生'); cancelAnimationFrame(raf); stopAudio(); }
    btn.addEventListener('click', () => (playing ? pause() : play()));
    snd.addEventListener('click', () => { soundOn = !soundOn; snd.setAttribute('aria-pressed', String(soundOn)); snd.textContent = soundOn ? '音あり' : '音なし'; if (!soundOn) stopAudio(); else if (playing) { pause(); play(); } });
    range.addEventListener('input', () => { const was = playing; if (was) pause(); setT(Number(range.value)); });
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
      if (e.key === 'ArrowRight') { pause(); setT(t + (e.shiftKey ? 1 : 1 / fps)); }
      if (e.key === 'ArrowLeft') { pause(); setT(t - (e.shiftKey ? 1 : 1 / fps)); }
    });
    const q = new URLSearchParams(location.search);
    setT(Number(q.get('t') || 0));
    return { setT, play, pause };
  }

  // Fit the fixed 1920x1080 stage into the preview window.
  function fitStage(stage) {
    const fit = () => {
      const s = Math.min(innerWidth / 1920, (innerHeight - 56) / 1080);
      stage.style.transform = `scale(${s})`;
      stage.style.transformOrigin = '0 0';
      stage.parentElement.style.width = 1920 * s + 'px';
      stage.parentElement.style.height = 1080 * s + 'px';
    };
    addEventListener('resize', fit); fit();
  }

  function waitImages(root = document) {
    return Promise.all($$('img', root).map((im) => (im.complete && im.naturalWidth ? im.decode().catch(() => {}) : new Promise((res) => {
      im.addEventListener('load', () => im.decode().then(res, res), { once: true });
      im.addEventListener('error', () => { console.error('image failed: ' + im.src); res(); }, { once: true });
    }))));
  }

  window.PV = { cubicBezier, ease, clamp, lerp, prog, window01, $, $$, style, show, revealLines, mulberry32, dbToGain, renderAudio, mountPlayer, fitStage, waitImages, SR };
})();
