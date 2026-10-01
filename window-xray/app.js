import { RideSync, cameraPose, applyPose, projectToFrame } from './camera-model.js';
import { LANDMARKS, AREAS, PLACES, CHAPTERS, CHALLENGES } from './landmarks.js';
import { ROUTE_POINTS } from './ride-route.js';

const $ = id => document.getElementById(id);
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const M = 111195;
const GROUND = 40; // approx. ellipsoidal height of street level in central Tokyo (m)
const TOWNS = ['xray', 'tags', 'ghost', 'side'];
const body = document.body, video = $('video'), stage = $('stage');

const state = { mode: 'ghost', wipe: 0.5, t: 184, view: 'window', answer: null, found: [], overview: false, started: false, resumeAfterFly: false, lastRender: -1, frames: null, challenge: {}, tagsAt: 0, occlAt: 0, lastError: '' };
let sync, calib, names = [], allNames = [], emaki = null;
let trainRibbon = null;
let C, viewer, tilesets = [], highlighted = null, trainCars = [], routeEntity, targetEntity, flyLoop = 0, cesiumState = 'idle';

// ---------- boot ----------
function onVideoError() { state.lastError = 'video'; state.videoFailed = true; setStatus('車窓動画を読み込めませんでした。模型だけで操作できます。', true); $('bigPlay').hidden = true; }
video.addEventListener('error', onVideoError);
boot().catch(err => { console.error(err); setStatus('準備に失敗しました：' + err.message, true); });
async function boot() {
  const [syncJson, calibJson, namesJson] = await Promise.all([
    fetch('data/ride-sync.json').then(r => r.json()),
    fetch('data/calibration.json').then(r => r.json()),
    fetch('data/names-corridor.json').then(r => r.json()),
  ]);
  sync = new RideSync(syncJson); calib = calibJson;
  try { const r = await fetch('data/track-refined.json'); if (r.ok) { const tr = await r.json(); REFINED = tr.upPoints; ALT = tr.upAlt; } } catch {}
  allNames = namesJson.names.map(n => ({ ...n, kind: 'osm' }));
  // Landmarks replace their OSM duplicates and carry the curated text.
  const osmOf = new Set(LANDMARKS.flatMap(l => l.osm || []));
  names = [...allNames.filter(n => !osmOf.has(n.name)), ...LANDMARKS.map(l => ({ name: l.name, short: l.short, lat: l.lat, lon: l.lon, height: l.h, kind: 'landmark', landmark: l, s: projectS(l.lat, l.lon).s, lateral: projectS(l.lat, l.lon).lateral }))];
  for (const p of PLACES) Object.assign(p, projectS(p.lat, p.lon));
  $('seek').max = sync.duration.toFixed(1);
  restoreFound();
  setupUI(); setMode(new URLSearchParams(location.search).get('mode') || 'ghost', true); layout(); renderChapters(); drawMap(); setupEmaki();
  if (video.readyState >= 1) onMeta(); else video.addEventListener('loadedmetadata', onMeta, { once: true });
  if (video.error) onVideoError();
  start3d();
}
function onMeta() { seek(state.t, false); renderAt(state.t); }

// ---------- geometry helpers ----------
function projectS(lat, lon) {
  // nearest point on the route polyline (local metres), returns along-track s from Tokyo and signed lateral (+ = west / E side)
  const lat0 = 35.655, kx = M * Math.cos(rad(lat0)), P = ROUTE_POINTS.map(([a, b]) => [(b - 139.75) * kx, (a - lat0) * M]);
  const x = (lon - 139.75) * kx, y = (lat - lat0) * M; let best = { d: Infinity }, acc = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, ay] = P[i], dx = P[i + 1][0] - ax, dy = P[i + 1][1] - ay, ll = dx * dx + dy * dy, len = Math.sqrt(ll);
    const u = clamp(((x - ax) * dx + (y - ay) * dy) / ll, 0, 1), px = ax + u * dx, py = ay + u * dy, d = Math.hypot(x - px, y - py);
    if (d < best.d) best = { d, s: acc + u * len, lateral: -Math.sign(dx * (y - ay) - dy * (x - ax)) * d };
    acc += len;
  }
  return best;
}
// Refined up-track (all inbound rides, window-side GPS bias removed) and its altitude profile.
let REFINED = null, ALT = null;
function altAt(s) { if (!ALT) return calib.global.height || 50; const step = ALT[1].s - ALT[0].s, d = clamp(s, 0, ALT.at(-1).s), i = Math.min(ALT.length - 2, Math.floor(d / step)), u = (d - ALT[i].s) / step; return ALT[i].alt + (ALT[i + 1].alt - ALT[i].alt) * u + (calib.global.heightOffset || 0); }
function refinedAt(s) { const step = REFINED[1][0] - REFINED[0][0], d = clamp(s, REFINED[0][0], REFINED.at(-1)[0]), i = Math.min(REFINED.length - 2, Math.floor((d - REFINED[0][0]) / step)), u = (d - REFINED[i][0]) / step; return [REFINED[i][1] + (REFINED[i + 1][1] - REFINED[i][1]) * u, REFINED[i][2] + (REFINED[i + 1][2] - REFINED[i][2]) * u]; }
const routeLine = () => REFINED ? REFINED.map(p => [p[1], p[2]]) : ROUTE_POINTS;
const ROUTE_CUM = (() => { const c = [0]; for (let i = 1; i < ROUTE_POINTS.length; i++) c.push(c[i - 1] + dist(ROUTE_POINTS[i - 1], ROUTE_POINTS[i])); return c; })();
function dist(a, b) { const x = rad(b[1] - a[1]) * Math.cos(rad((a[0] + b[0]) / 2)), y = rad(b[0] - a[0]); return Math.hypot(x, y) * 6371000; }
function routeAt(s) {
  if (REFINED) { const [lat, lon] = refinedAt(s), f = refinedAt(s - 40), g = refinedAt(s + 40); return { lat, lon, outbound: (deg(Math.atan2((g[1] - f[1]) * Math.cos(rad(lat)), g[0] - f[0])) + 360) % 360 }; }
  const L = ROUTE_CUM.at(-1), d = clamp(s, 0, L); let i = 1; while (i < ROUTE_CUM.length - 1 && ROUTE_CUM[i] < d) i++;
  const u = (d - ROUTE_CUM[i - 1]) / (ROUTE_CUM[i] - ROUTE_CUM[i - 1]), a = ROUTE_POINTS[i - 1], b = ROUTE_POINTS[i];
  const lat = a[0] + (b[0] - a[0]) * u, lon = a[1] + (b[1] - a[1]) * u;
  const p = (q) => { const dd = clamp(q, 0, L); let j = 1; while (j < ROUTE_CUM.length - 1 && ROUTE_CUM[j] < dd) j++; const w = (dd - ROUTE_CUM[j - 1]) / (ROUTE_CUM[j] - ROUTE_CUM[j - 1]); return [ROUTE_POINTS[j - 1][0] + (ROUTE_POINTS[j][0] - ROUTE_POINTS[j - 1][0]) * w, ROUTE_POINTS[j - 1][1] + (ROUTE_POINTS[j][1] - ROUTE_POINTS[j - 1][1]) * w]; };
  const f = p(s - 40), g = p(s + 40); // heading toward increasing s (Tokyo→Shinagawa)
  return { lat, lon, outbound: (deg(Math.atan2((g[1] - f[1]) * Math.cos(rad(lat)), g[0] - f[0])) + 360) % 360 };
}
const poseAt = t => cameraPose(sync, calib, t);
function areaAt(s) { return AREAS.find(a => s >= a.from && s < a.to) || AREAS.at(-1); }

// ---------- layout ----------
function layout() {
  const r = stage.getBoundingClientRect(), W = r.width, H = r.height; if (!W || !H) return;
  let v, m;
  if (state.mode === 'side' && state.view === 'window') {
    if (W / H >= 1.6) { const fw = Math.min(W / 2, H * 16 / 9), fh = fw * 9 / 16, y = (H - fh) / 2, gap = (W - 2 * fw) / 2; v = { x: gap, y, w: fw, h: fh }; m = { x: gap + fw, y, w: fw, h: fh }; }
    else { const fw = Math.min(W, H / 2 * 16 / 9), fh = fw * 9 / 16, x = (W - fw) / 2, gap = (H - 2 * fh) / 2; v = { x, y: gap, w: fw, h: fh }; m = { x, y: gap + fh, w: fw, h: fh }; }
  } else {
    let fw = W, fh = W * 9 / 16; if (fh < H) { fh = H; fw = H * 16 / 9; }
    v = { x: (W - fw) / 2, y: (H - fh) / 2, w: fw, h: fh }; m = { ...v };
  }
  state.frames = { v, m, W, H };
  for (const [el, f] of [[$('frameVideo'), v], [$('frameModel'), m]]) { el.style.setProperty('--fx', f.x + 'px'); el.style.setProperty('--fy', f.y + 'px'); el.style.setProperty('--fw', f.w + 'px'); el.style.setProperty('--fh', f.h + 'px'); }
  const tags = $('tags'); Object.assign(tags.style, { left: m.x + 'px', top: m.y + 'px', width: m.w + 'px', height: m.h + 'px', right: 'auto', bottom: 'auto' });
  applyWipe(); if (viewer) { viewer.resize(); renderAt(state.t, true); }
}
function applyWipe() {
  const f = state.frames; if (!f) return;
  const X = state.wipe * f.W; $('wipe').style.setProperty('--wipe', X + 'px'); $('wipe').style.left = X + 'px';
  $('wipe').setAttribute('aria-valuenow', Math.round(state.wipe * 100));
  const vid = $('frameVideo'), tags = $('tags');
  if (state.mode === 'xray' && state.view === 'window') {
    vid.style.clipPath = `inset(0 0 0 ${clamp(X - f.v.x, 0, f.v.w)}px)`;
    tags.style.clipPath = `inset(0 ${clamp(f.m.w - (X - f.m.x), 0, f.m.w)}px 0 0)`;
  } else { vid.style.clipPath = ''; tags.style.clipPath = ''; }
}
new ResizeObserver(() => layout()).observe(stage);

// ---------- UI ----------
function setupUI() {
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('bigPlay').addEventListener('click', e => { e.stopPropagation(); play(); });
  $('playBtn').addEventListener('click', () => video.paused ? play() : pause());
  $('soundBtn')?.addEventListener('click', () => { video.muted = !video.muted; $('soundBtn').setAttribute('aria-pressed', String(!video.muted)); $('soundBtn').firstElementChild.textContent = video.muted ? '🔇' : '🔊'; });
  $('rate').addEventListener('change', () => { video.playbackRate = Number($('rate').value); });
  $('seek').addEventListener('input', () => { seek(Number($('seek').value)); });
  $('flyBack').addEventListener('click', flyBack);
  $('mapZoom').addEventListener('click', () => { state.overview = !state.overview; $('mapZoom').setAttribute('aria-pressed', String(state.overview)); drawMap(); updateMap(poseAt(state.t)); });
  $('miniMap').addEventListener('click', onMapClick);
  $('foundList').addEventListener('click', e => { const b = e.target.closest('[data-found]'); if (!b) return; const f = state.found.find(x => x.key === b.dataset.found); if (f) { pause(); seek(f.t); const n = names.find(x => x.name === f.key) || (f.place?.lat != null ? f.place : null); if (n) showAnswer(answerFromName(n), { replay: true }); } });
  $('answer').addEventListener('click', e => {
    if (e.target.closest('[data-fly]')) flyUp();
    if (e.target.closest('[data-resume]')) play();
    const alt = e.target.closest('[data-alt]'); if (alt) { const n = names.find(x => x.name === alt.dataset.alt); if (n) showAnswer(answerFromName(n, state.answer?.hit), { alt: true }); }
  });
  $('caption').addEventListener('click', e => {
    if (e.target.closest('[data-fly]')) flyUp();
    if (e.target.closest('[data-more]')) $('answer').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    if (e.target.closest('[data-close]')) $('caption').hidden = true;
  });
  $('toast').addEventListener('click', e => { const b = e.target.closest('[data-rewind]'); if (b) revealChallenge(CHALLENGES.find(c => c.id === b.dataset.rewind)); });
  // stage: tap to identify, drag the wipe
  let drag = null;
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button,a,input,select,.win-toast,.win-flybar,.win-caption')) return;
    const onWipe = e.target.closest('#wipe') || (state.mode === 'xray' && state.view === 'window' && Math.abs(e.clientX - stage.getBoundingClientRect().left - state.wipe * state.frames.W) < 26);
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, wipe: onWipe, moved: false, heading: null };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 6) drag.moved = true;
    if (drag.wipe) { const r = stage.getBoundingClientRect(); state.wipe = clamp((e.clientX - r.left) / r.width, 0, 1); applyWipe(); scheduleTags(); }
    else if (state.view === 'aerial' && drag.moved && viewer) { orbit(e.movementX, e.movementY); }
  });
  const end = e => {
    if (!drag || drag.id !== e.pointerId) return; const d = drag; drag = null;
    if (!d.wipe && !d.moved && state.view === 'window') { const r = stage.getBoundingClientRect(); onStageTap(e.clientX - r.left, e.clientY - r.top); }
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', () => { drag = null; });
  stage.addEventListener('keydown', e => {
    if (e.target !== stage) return;
    if (e.key === ' ') { e.preventDefault(); video.paused ? play() : pause(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); seek(state.t + (e.key === 'ArrowLeft' ? -5 : 5)); }
  });
  $('wipe').addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); state.wipe = clamp(state.wipe + (e.key === 'ArrowLeft' ? -.05 : .05), 0, 1); applyWipe(); } });
  $('tags').addEventListener('click', e => { const pin = e.target.closest('[data-name]'); if (!pin) return; e.stopPropagation(); const n = names.find(x => x.name === pin.dataset.name); if (n) { pause(); showAnswer(answerFromName(n)); } });
  $('tags').addEventListener('pointerdown', e => { if (e.target.closest('[data-name]')) e.stopPropagation(); });
  video.addEventListener('play', syncButtons); video.addEventListener('pause', syncButtons);
  video.addEventListener('seeked', () => renderAt(video.currentTime, true));
  video.addEventListener('ended', () => { pause(); toast('東京に到着。絵巻や地図から、好きな場所へ戻れます。', 4200); });
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) { const cb = (now, meta) => { if (state.view === 'window') renderAt(meta.mediaTime); video.requestVideoFrameCallback(cb); }; video.requestVideoFrameCallback(cb); }
  else { const loop = () => { if (!video.paused && state.view === 'window') renderAt(video.currentTime); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('pagehide', () => pause());
}
function setMode(mode, initial = false) {
  if (!TOWNS.includes(mode)) return;
  if (state.view !== 'window' && !initial) flyBack(true);
  state.mode = mode; for (const m of TOWNS) body.classList.toggle('mode-' + m, m === mode);
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  applyStyle(); layout(); scheduleTags(true);
  if (mode === 'xray' && !initial && state.view === 'window') { state.wipe = 0.06; applyWipe(); animateWipe(0.5); }
  const hints = { xray: '白い境目をドラッグすると、模型と名前がすけて見えます。', tags: '実写に名前を重ねています。手前の建物に隠れる名前は出しません。', ghost: '同じ向きの模型を、光る線として重ねています。', side: '同じ瞬間の実写と模型を並べています。' };
  if (!initial) setStatus(hints[mode]);
}
function syncButtons() {
  const playing = !video.paused;
  $('playBtn').firstElementChild.textContent = playing ? '❚❚' : '▶'; $('playBtn').setAttribute('aria-label', playing ? '一時停止' : '再生');
  if (playing) $('bigPlay').hidden = true;
}
function play() {
  if (state.view !== 'window') { state.resumeAfterFly = true; flyBack(); return; }
  clearAnswerMarks();
  if (!state.started) { state.started = true; $('bigPlay').hidden = true; if (state.mode === 'xray') sweepWipe(); }
  const p = video.play(); if (p?.catch) p.catch(() => setStatus('再生を開始できませんでした。もう一度押してください。', true));
}
function pause() { if (!video.paused) video.pause(); }
function seek(t, render = true) {
  t = clamp(t, 0, sync.duration - 0.05); state.t = t;
  if (Math.abs(video.currentTime - t) > 0.03) video.currentTime = t;
  if (render) renderAt(t, true);
}
function sweepWipe() {
  if (reduced) { state.wipe = 0.5; applyWipe(); return; }
  const from = state.wipe, to = 0.5, t0 = performance.now();
  const step = now => { const u = clamp((now - t0) / 1400, 0, 1), e = 1 - (1 - u) ** 3; state.wipe = from + (to - from) * e; applyWipe(); scheduleTags(); if (u < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function setStatus(text, error = false) {
  if (state.videoFailed && !error) return; /* keep the missing-video explanation visible */ const el = $('stageStatus'); el.textContent = text; el.classList.toggle('error', error); }
let toastTimer = 0;
function toast(html, ms = 0) { const el = $('toast'); el.innerHTML = html; el.hidden = false; clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => { el.hidden = true; }, ms); }
function hideToast() { $('toast').hidden = true; $('toast').dataset.live = ''; }

// ---------- per-frame ----------
let renderPending = false;
let streamTimer = 0;
// Tiles only stream while frames render; keep rendering (paused) until every ward reports loaded.
function streamTiles() {
  if (!viewer || streamTimer) return;
  const tick = () => { streamTimer = 0; if (!viewer || state.view !== 'window' || !video.paused) return; viewer.render(); if (tilesets.some(t => !t.tilesLoaded)) streamTimer = setTimeout(tick, 120); else { state.occlAt = 0; updateTags(poseAt(state.t), true); } };
  streamTimer = setTimeout(tick, 60);
}
function scheduleRender() { if (renderPending) return; renderPending = true; requestAnimationFrame(() => { renderPending = false; if (state.view === 'window' && video.paused) renderAt(state.t, true); }); }
function renderAt(t, force = false) {
  if (!sync) return;
  state.t = t; const pose = poseAt(t);
  if (viewer && state.view === 'window') {
    const now = performance.now();
    if (force || video.paused || !state.slow || now - (state.lastModelAt || 0) > 60) {
      const t0 = performance.now(); applyPose(C, viewer.camera, pose); viewer.render(); const dt = performance.now() - t0;
      state.renderMs = state.renderMs ? state.renderMs * 0.9 + dt * 0.1 : dt; state.slow = state.renderMs > 22; state.lastModelAt = now;
    }
    if (video.paused) streamTiles();
  }
  if (force || Math.abs(t - state.lastRender) > 0.02) { updateHUD(t, pose); updateTransport(t); updateMap(pose); updateEmaki(pose); checkChallenges(t); }
  state.lastRender = t;
  updateTags(pose, force);
}
function updateHUD(t, pose) {
  $('hudPlace').textContent = areaAt(pose.s).name;
  $('hudSpeed').textContent = `時速 ${Math.round(pose.speed * 3.6)}km`;
  const d = new Date(Date.parse(sync.clip.startUtc) + t * 1000 + 9 * 3600e3);
  $('hudClock').textContent = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
}
function updateTransport(t) {
  const s = $('seek'); if (document.activeElement !== s) s.value = t.toFixed(1);
  s.setAttribute('aria-valuetext', `${fmt(t)}、${areaAt(sync.at(t).s).name}`);
  const text = `${fmt(t)} / ${fmt(sync.duration)}`; if ($('timeOut').textContent !== text) $('timeOut').textContent = text;
  const cur = [...CHAPTERS].reverse().find(c => t >= c.t - 1);
  document.querySelectorAll('[data-chapter]').forEach(b => b.setAttribute('aria-current', String(cur && Number(b.dataset.chapter) === cur.t)));
}
function renderChapters() {
  $('chapters').innerHTML = CHAPTERS.map(c => `<button type="button" data-chapter="${c.t}">${esc(c.name)}<small>${fmt(c.t)}</small></button>`).join('');
  $('chapters').addEventListener('click', e => { const b = e.target.closest('[data-chapter]'); if (b) { seek(Number(b.dataset.chapter)); } });
  $('chapterMarks').innerHTML = CHAPTERS.map(c => `<i style="left:${(c.t / sync.duration * 100).toFixed(2)}%"></i>`).join('');
}

// ---------- name tags ----------
let tagEls = new Map(), occluded = new Map(), tagsPending = false;
function scheduleTags(force) { if (force) state.tagsAt = 0; if (!tagsPending) { tagsPending = true; requestAnimationFrame(() => { tagsPending = false; updateTags(poseAt(state.t), true); }); } }
function visibleCandidates(pose) {
  const f = state.frames; if (!f) return [];
  const out = [];
  for (const n of names) {
    const top = GROUND + n.height * 0.78, p = projectToFrame(pose, n.lat, n.lon, top);
    if (!p || p.x < -0.02 || p.x > 1.02 || p.y < 0.02 || p.y > 1 || p.dist > 3200 || p.dist < 60) continue;
    out.push({ n, p, score: (n.kind === 'landmark' ? 2.2 : 1) * Math.min(n.height, 340) / Math.sqrt(p.dist) });
  }
  return out.sort((a, b) => b.score - a.score);
}
function updateTags(pose, force = false) {
  const show = state.view === 'aerial' || state.mode !== 'side' || true;
  const now = performance.now(); if (!force && now - state.tagsAt < 90) return; state.tagsAt = now;
  const f = state.frames; if (!f || !show) return;
  const layer = $('tags'), mw = f.m.w, mh = f.m.h, narrow = f.W < 560;
  if (state.view === 'returning') { for (const el of tagEls.values()) el.classList.add('hidden'); return; }
  let list = state.view === 'aerial' ? aerialCandidates() : visibleCandidates(pose);
  // never give away the answer of a running challenge
  const hideIds = CHALLENGES.filter(c => state.t >= c.announce && state.t <= c.to + 1 && !['won', 'revealed'].includes(state.challenge[c.id])).map(c => c.landmark);
  if (hideIds.length) list = list.filter(c => !hideIds.includes(c.n.landmark?.id));
  if (state.view === 'window' && state.mode === 'xray') list = list.filter(c => c.p.x * mw + f.m.x < state.wipe * f.W - 8);
  const max = state.view === 'aerial' ? 9 : narrow ? 3 : 5;
  if (state.view === 'window') list = list.filter(c => c.n.kind === 'landmark' ? c.p.dist < 3200 : c.p.dist < 1900 && c.n.height >= 70);
  // occlusion (needs the model's depth); refreshed ~4×/s
  if (viewer && state.view === 'window' && now - state.occlAt > 240) { state.occlAt = now; for (const c of list.slice(0, max + 6)) occluded.set(c.n.name, isOccluded(c, pose)); }
  const chosen = [], boxes = [];
  for (const c of list) {
    if (chosen.length >= max) break;
    if (state.view === 'window' && occluded.get(c.n.name)) continue;
    const x = c.p.x * mw, y = c.p.y * mh; const w = tagLabel(c.n).length * 11 + 48, h = 24;
    let placed = null;
    // above the anchor first; flip below when the top edge (or the HUD corner) leaves no room
    const hudW = 230 - f.m.x, hudH = (state.view === 'aerial' ? 72 : 52) - f.m.y;
    for (const lift of [28, 56, 84, -18, -44]) {
      const bx = x - w / 2, by = lift > 0 ? y - lift - h : y - lift;
      if (by < 4 || by + h > mh - 4 || (bx < hudW && by < hudH)) continue;
      if (!boxes.some(b => bx < b.x + b.w && bx + w > b.x && by < b.y + b.h && by + h > b.y)) { placed = { x: bx, y: by, w, h, lift }; break; }
    }
    if (!placed) continue; boxes.push(placed); chosen.push({ ...c, lift: placed.lift, x, y });
  }
  const keep = new Set();
  for (const c of chosen) {
    let el = tagEls.get(c.n.name);
    if (!el) { el = document.createElement('div'); el.className = 'win-tag-pin'; el.dataset.name = c.n.name; el.innerHTML = `<span class="pill">${esc(tagLabel(c.n))}<small></small></span><span class="stem"></span><span class="dot"></span>`; layer.append(el); tagEls.set(c.n.name, el); }
    el.classList.toggle('landmark', c.n.kind === 'landmark'); el.classList.toggle('answer', state.answer?.name === c.n.name); el.classList.remove('hidden');
    el.querySelector('small').textContent = c.p.dist >= 1000 ? (c.p.dist / 1000).toFixed(1) + 'km' : Math.round(c.p.dist / 10) * 10 + 'm';
    el.classList.toggle('below', c.lift < 0);
    el.style.setProperty('--stem', (Math.abs(c.lift) - 4) + 'px');
    el.style.transform = `translate(${Math.round(c.x)}px,${Math.round(c.y)}px) translate(-50%,${c.lift < 0 ? '0' : '-100%'})`;
    keep.add(c.n.name);
  }
  for (const [k, el] of tagEls) if (!keep.has(k)) { el.classList.add('hidden'); }
  state.tagCount = keep.size;
}
function tagLabel(n) { const t = n.short || n.name; return t.length > 11 ? t.slice(0, 10) + '…' : t; }
function isOccluded(c, pose) {
  try {
    const f = state.frames, win = new C.Cartesian2(c.p.x * f.m.w, c.p.y * f.m.h);
    const hit = viewer.scene.pickPosition(win); if (!hit) return false;
    const cam = viewer.camera.positionWC, d = C.Cartesian3.distance(cam, hit);
    return d < c.p.depth * 0.82 - 50;
  } catch { return false; }
}
function aerialCandidates() {
  if (!viewer) return [];
  const f = state.frames, out = [], cam = viewer.camera.positionCartographic;
  for (const n of names) {
    const w = C.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, C.Cartesian3.fromDegrees(n.lon, n.lat, GROUND + n.height));
    if (!w || w.x < 0 || w.y < 30 || w.x > f.m.w || w.y > f.m.h) continue;
    const d = dist([deg(cam.latitude), deg(cam.longitude)], [n.lat, n.lon]);
    out.push({ n, p: { x: w.x / f.m.w, y: w.y / f.m.h, dist: d, depth: d }, score: (n.kind === 'landmark' ? 3 : 1) * n.height / Math.sqrt(d) + (state.answer?.name === n.name ? 99 : 0) });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ---------- tap to identify ----------
function onStageTap(sx, sy) {
  const f = state.frames; if (!f) return;
  // map the tap to model-canvas pixels (side mode: either pane)
  let u, v;
  const inRect = (r) => sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h;
  if (state.mode === 'side') { const r = inRect(f.m) ? f.m : inRect(f.v) ? f.v : null; if (!r) return; u = (sx - r.x) / r.w; v = (sy - r.y) / r.h; }
  else { u = (sx - f.m.x) / f.m.w; v = (sy - f.m.y) / f.m.h; }
  if (u < 0 || u > 1 || v < 0 || v > 1) return;
  const t = video.currentTime; state.t = t; state.started = true; $('bigPlay').hidden = true;
  // challenge first
  const ch = activeChallenge(t); if (ch && tryChallenge(ch, u, v, sx, sy)) return;
  pause();
  const hit = { u, v, sx, sy, t };
  showAnswer(identify(u, v, hit));
}
function identify(u, v, hit) {
  const pose = poseAt(hit.t), f = state.frames;
  let world = null, props = null;
  if (viewer) {
    applyPose(C, viewer.camera, pose); viewer.render();
    const win = new C.Cartesian2(u * f.m.w, v * f.m.h);
    try { const picked = viewer.scene.pick(win); if (picked instanceof C.Cesium3DTileFeature) { props = readProps(picked); highlight(picked); } else highlight(null); } catch { highlight(null); }
    try { const p = viewer.scene.pickPosition(win); if (p) { const c = C.Cartographic.fromCartesian(p); world = { lat: deg(c.latitude), lon: deg(c.longitude), h: c.height }; } } catch {}
  }
  // candidates: names near the picked point, else names near the tap on screen
  const cands = names.map(n => {
    const pr = projectToFrame(pose, n.lat, n.lon, GROUND + n.height * 0.6);
    const screen = pr ? Math.hypot((pr.x - u) * 16, (pr.y - v) * 9) / 16 : 9;
    const ground = world ? dist([world.lat, world.lon], [n.lat, n.lon]) : Infinity;
    return { n, screen, ground, pr };
  }).filter(c => c.pr && c.pr.depth > 0);
  let ranked;
  const bb = props?.bbox, inBox = (n, m) => bb && n.lon >= bb[0] - m && n.lon <= bb[2] + m && n.lat >= bb[1] - m && n.lat <= bb[3] + m;
  if (bb) { const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2; ranked = cands.filter(c => inBox(c.n, 0.00015)).sort((a, b) => dist([cy, cx], [a.n.lat, a.n.lon]) - dist([cy, cx], [b.n.lat, b.n.lon])); }
  else if (world) ranked = cands.filter(c => c.ground < 70).sort((a, b) => a.ground - b.ground);
  else ranked = cands.filter(c => c.screen < 0.07).sort((a, b) => a.screen - b.screen);
  const nearbyAlt = cands.filter(c => c.screen < 0.12).sort((a, b) => a.screen - b.screen).slice(0, 4).map(c => c.n);
  const distance = world ? dist([pose.lat, pose.lon], [world.lat, world.lon]) : null;
  const best = ranked[0]?.n || null;
  return { name: best?.name || null, n: best, props, world, distance, pose, hit, alt: nearbyAlt.filter(n => n !== best).map(n => n.name), area: areaAt(pose.s), noModel: !world };
}
function answerFromName(n, hit) {
  const pose = poseAt(state.t);
  return { name: n.name, n, props: null, world: { lat: n.lat, lon: n.lon, h: GROUND + n.height / 2 }, distance: dist([pose.lat, pose.lon], [n.lat, n.lon]), pose, hit: hit || null, alt: [], area: areaAt(pose.s), fromName: true };
}
function readProps(feature) {
  const out = {}; let ids = [];
  try { ids = feature.getPropertyIds(); } catch {}
  state.propertyIds = ids;
  const get = re => { const id = ids.find(k => re.test(k)); if (!id) return null; const v = feature.getProperty(id); return v === undefined || v === null || v === '' ? null : v; };
  out.height = Number(get(/measuredHeight|計測高さ/)) || null;
  out.storeys = Number(get(/storeysAboveGround|地上階数/)) || null;
  out.usage = get(/^(bldg:)?usage$|用途$/);
  out.name = get(/^(gml:)?name$|名称/);
  out.year = get(/yearOfConstruction|建築年/);
  const bb = ['_xmin', '_ymin', '_xmax', '_ymax'].map(k => { const v = ids.includes(k) ? feature.getProperty(k) : null; return v === null || v === undefined ? NaN : Number(v); });
  out.bbox = bb.every(Number.isFinite) && bb[2] > bb[0] ? bb : null;
  return out;
}
function highlight(feature) {
  if (highlighted && highlighted !== feature) { try { highlighted.color = C.Color.WHITE; } catch {} for (const t of tilesets) t.makeStyleDirty(); }
  highlighted = feature;
  if (feature) try { feature.color = C.Color.fromCssColorString(state.mode === 'ghost' && state.view === 'window' ? '#c8552f' : '#e8704a'); } catch {}
}
function showAnswer(a, opts = {}) {
  state.answer = a; const panel = $('answer'); const n = a.n, lm = n?.landmark;
  const title = n ? (lm ? lm.name : n.name) : !viewer ? 'この辺りの名前は未収録' : a.noModel ? '模型では、ここは空' : (a.props?.name || '名前のない建物');
  const hook = lm?.hook || (n ? '' : a.area.card);
  const height = a.props?.height || (n ? n.height : null);
  const facts = [];
  if (height) facts.push(['高さ', `約${Math.round(height)}m`]);
  if (a.props?.storeys) facts.push(['地上', `${a.props.storeys}階`]);
  if (a.distance) facts.push(['窓から', a.distance >= 1000 ? `${(a.distance / 1000).toFixed(1)}km` : `${Math.round(a.distance / 10) * 10}m`]);
  if (facts.length < 3 && a.world) facts.push(['方角', compass(bearingTo(a.pose, a.world))]);
  let text;
  if (lm) text = lm.text;
  else if (n) text = `${a.area.card}の街にある建物です。${a.props?.usage ? `模型の用途は「${esc(a.props.usage)}」。` : ''}`;
  else if (!viewer) text = `${a.area.card}の街。3D模型を読み込めなかったため、位置と向きから名前の候補を探しました。`;
  else if (a.noModel) text = a.area.newTown ? a.area.text : 'ここに模型の建物はありません。できたばかりのビル、看板、となりの列車など、模型にないものかもしれません。';
  else text = `${a.area.text}${a.props?.usage ? `（模型の用途：${esc(a.props.usage)}）` : ''}`;
  if (!n && a.props?.name) { a.n = { name: a.props.name, short: a.props.name, lat: a.world?.lat, lon: a.world?.lon, height: a.props.height || 0, kind: 'plateau' }; return showAnswer(a, opts); }
  const found = n ? addFound(a) : false;
  panel.innerHTML = `<p class="win-eyebrow">${n ? (found === 'new' ? '見つけた！' : '答え合わせ') : '答え合わせ'}</p>
    <h2 class="win-answer-title">${esc(title)}</h2>${hook ? `<p class="win-answer-sub">${esc(hook)}</p>` : ''}
    ${facts.length ? `<dl class="win-facts">${facts.slice(0, 3).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    <p class="win-answer-text">${text}</p>
    <div class="win-answer-actions">${aerialReady() && (a.world || n) ? '<button type="button" class="primary" data-fly>空から見る ↗</button>' : ''}<button type="button" data-resume>車窓のつづき</button>${n ? `<a href="${lm?.url ? esc(lm.url) : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(n.name)}" target="_blank" rel="noopener noreferrer">${lm?.url ? '公式の案内 ↗' : '地図で見る ↗'}</a>` : ''}</div>
    ${a.alt?.length ? `<p class="win-answer-note">近くに見えている候補</p><ul class="win-answer-alt">${a.alt.map(x => `<li><button type="button" data-alt="${esc(x)}">${esc(x)}</button></li>`).join('')}</ul>` : ''}
    <p class="win-answer-note">${n?.kind === 'plateau' ? '名前・高さ・階数は模型（PLATEAU）の属性です。' : n && n.kind !== 'landmark' ? (a.props?.bbox ? '押した建物の敷地にある、OpenStreetMapの収録名です。' : '名前はOpenStreetMapの収録名から、位置の近さで選んだ候補です。') : lm ? '' : '高さ・階数は模型（PLATEAU）の値です。'}</p>`;
  showCaption(a, title, facts);
  panel.classList.remove('flash'); void panel.offsetWidth; panel.classList.add('flash');
  if (!opts.replay && a.hit) drawRing(a.hit.sx, a.hit.sy, n ? 'hit' : 'miss');
  if (n && viewer && !a.props) highlightByName(n);
  if (state.mode === 'xray' && a.hit && state.view === 'window') { // slide the wipe so the answer is on the model side
    const x = a.hit.sx / state.frames.W; if (x > state.wipe - 0.04) animateWipe(clamp(x + 0.16, 0.2, 0.95));
  }

  scheduleTags(true);
}
function showCaption(a, title, facts) {
  const el = $('caption'); if (!el) return;
  const bits = facts.slice(0, 2).map(([k, v]) => `<span>${esc(k)} ${esc(v)}</span>`).join('');
  el.innerHTML = `<b>${esc(title)}</b>${bits}<span class="win-caption-actions">${aerialReady() && (a.world || a.n) ? '<button type="button" data-fly>空から ↗</button>' : ''}<button type="button" data-more>くわしく</button><button type="button" data-close aria-label="閉じる">×</button></span>`;
  el.hidden = false;
}
function highlightByName(n) {
  // pick the model feature at the building's projected facade point
  try {
    const f = state.frames, pr = projectToFrame(poseAt(state.t), n.lat, n.lon, GROUND + n.height * 0.5); if (!pr) return;
    const picked = viewer.scene.pick(new C.Cartesian2(pr.x * f.m.w, pr.y * f.m.h)); if (picked instanceof C.Cesium3DTileFeature) { highlight(picked); viewer.render(); }
  } catch {}
}
function animateWipe(to) { const from = state.wipe, t0 = performance.now(); const step = now => { const u = clamp((now - t0) / 500, 0, 1), e = 1 - (1 - u) ** 3; state.wipe = from + (to - from) * e; applyWipe(); scheduleTags(); if (u < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function bearingTo(pose, w) { return (deg(Math.atan2((w.lon - pose.lon) * Math.cos(rad(pose.lat)), w.lat - pose.lat)) + 360) % 360; }
function compass(b) { return ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'][Math.round(b / 22.5) % 16]; }
function drawRing(x, y, kind) {
  const fx = $('fx'); fx.setAttribute('viewBox', `0 0 ${state.frames.W} ${state.frames.H}`);
  fx.innerHTML = `<circle class="ring ${kind}" cx="${x}" cy="${y}" r="10"><animate attributeName="r" from="6" to="24" dur="0.6s" fill="freeze"/></circle>`;
}
function clearAnswerMarks() { $('fx').innerHTML = ''; const c = $('caption'); if (c) c.hidden = true; }

// ---------- found collection ----------
function restoreFound() { try { const v = JSON.parse(localStorage.getItem('window-xray-found-v1') || '[]'); if (Array.isArray(v)) state.found = v.filter(x => x && x.key).slice(0, 60); } catch {} renderFound(); }
function addFound(a) {
  const key = a.n.name; const exists = state.found.find(x => x.key === key);
  if (exists) return 'again';
  state.found.push({ key, name: a.n.short || a.n.name, t: +state.t.toFixed(1), landmark: a.n.kind === 'landmark', answer: { name: a.n.name }, place: a.n.kind === 'plateau' ? { name: a.n.name, short: a.n.short, lat: a.n.lat, lon: a.n.lon, height: a.n.height, kind: 'plateau' } : null });
  try { localStorage.setItem('window-xray-found-v1', JSON.stringify(state.found)); } catch {}
  renderFound(); return 'new';
}
function renderFound() {
  const total = LANDMARKS.length;
  const lmCount = state.found.filter(f => f.landmark).length;
  $('foundCount').textContent = `${state.found.length}棟 · 名所 ${lmCount}/${total}`;
  $('foundList').innerHTML = state.found.length ? state.found.map(f => `<li><button type="button" data-found="${esc(f.key)}">${f.landmark ? '★ ' : ''}${esc(f.name)}</button></li>`).join('') : '<li class="empty">まだありません。窓のビルを押してみよう。</li>';
}
// replaying from the list re-resolves the name
const _showAnswer = showAnswer;

// ---------- challenges ----------
function activeChallenge(t) { return CHALLENGES.find(c => t >= c.from && t <= c.to && !['won', 'revealed'].includes(state.challenge[c.id])); }
let wipeBeforeChallenge = null;
function openWindowForChallenge(on) {
  if (state.mode !== 'xray') return;
  if (on && wipeBeforeChallenge === null) { wipeBeforeChallenge = state.wipe; animateWipe(0.02); }
  if (!on && wipeBeforeChallenge !== null) { const w = wipeBeforeChallenge; wipeBeforeChallenge = null; animateWipe(Math.max(w, 0.5)); }
}
function checkChallenges(t) {
  for (const c of CHALLENGES) {
    const st = state.challenge[c.id];
    if (st === 'won' || st === 'revealed') { continue; }
    const lm = LANDMARKS.find(l => l.id === c.landmark);
    if (t >= c.announce && t < c.from && (!video.paused || st === 'announced')) {
      if (st !== 'announced') { state.challenge[c.id] = 'announced'; openWindowForChallenge(true); }
      toast(`<span>${esc(lm.name)}まで、あと<b>${Math.max(1, Math.ceil(c.from - t))}秒</b>。見えたら窓をタップ！</span>`, 0);
    }
    if (t >= c.from && t <= c.to && st !== 'missed') { if (st !== 'announced') { state.challenge[c.id] = 'announced'; openWindowForChallenge(true); } const el = $('toast'); if (el.hidden || !el.dataset.live) { toast(`<span>${c.ask}</span>`, 0); el.dataset.live = '1'; } }
    if (t < c.announce && st === 'announced') { state.challenge[c.id] = undefined; hideToast(); openWindowForChallenge(false); }
    if (t > c.to && st === 'announced' && !video.paused) { state.challenge[c.id] = 'missed'; $('toast').dataset.live = ''; openWindowForChallenge(false); toast(`<span>${esc(c.miss)}</span><button type="button" data-rewind="${c.id}">巻き戻して見る</button>`, 9000); }
    if (t < c.announce - 2 && st === 'missed') state.challenge[c.id] = undefined;
  }
}
function tryChallenge(c, u, v, sx, sy) {
  const lm = LANDMARKS.find(l => l.id === c.landmark), pose = poseAt(state.t);
  const pts = [0.95, 0.75, 0.55].map(k => projectToFrame(pose, lm.lat, lm.lon, 55 + lm.h * k)).filter(Boolean);
  if (!pts.length) return false;
  const d = Math.min(...pts.map(p => Math.hypot((p.x - u) * 16 / 9, p.y - v)));
  if (d < c.radius * 1.9) {
    state.challenge[c.id] = 'won'; pause(); hideToast(); openWindowForChallenge(false);
    drawRing(sx, sy, 'hit');
    toast(`<span><b>見つけた！</b> 旅の瞬間を、見逃さなかった。</span>`, 4200);
    const n = names.find(x => x.landmark?.id === lm.id); showAnswer({ ...answerFromName(n), hit: { sx, sy, u, v, t: state.t } }, { replay: true });
    return true;
  }
  const dir = pts[0].x < u ? c.hintLeft : c.hintRight;
  drawRing(sx, sy, 'miss'); toast(`<span>おしい！ ${esc(dir)}。まだ間に合う。</span>`, 1800);
  return true;
}
function revealChallenge(c) {
  if (!c) return; state.challenge[c.id] = 'revealed'; hideToast(); seek(c.best); pause(); openWindowForChallenge(false);
  const lm = LANDMARKS.find(l => l.id === c.landmark);
  setTimeout(() => {
    const pose = poseAt(c.best), p = projectToFrame(pose, lm.lat, lm.lon, 55 + lm.h * 0.8), f = state.frames;
    if (p) { const x = f.v.x + p.x * f.v.w, y = f.v.y + p.y * f.v.h; $('fx').setAttribute('viewBox', `0 0 ${f.W} ${f.H}`); $('fx').innerHTML = `<circle class="ping" cx="${x}" cy="${y}" r="16"><animate attributeName="r" values="12;30;12" dur="1.6s" repeatCount="indefinite"/></circle>`; }
    const n = names.find(x => x.landmark?.id === lm.id); showAnswer(answerFromName(n), { replay: true });
  }, 350);
}

// ---------- 3D model ----------
function loadScript(url) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.async = true; const to = setTimeout(() => { s.remove(); rej(new Error('timeout')); }, 20000); s.onload = () => { clearTimeout(to); res(); }; s.onerror = () => { clearTimeout(to); rej(new Error('script')); }; document.head.append(s); }); }
async function start3d() {
  cesiumState = 'loading'; setStatus('街の模型を準備しています…');
  try {
    if (!window.Cesium) {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/Widgets/widgets.css'; document.head.append(css);
      await loadScript('https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/Cesium.js');
    }
    C = window.Cesium; C.Ion.defaultAccessToken = '';
    viewer = new C.Viewer('model', { animation: false, timeline: false, baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false, infoBox: false, selectionIndicator: false, baseLayer: false, useDefaultRenderLoop: false, contextOptions: { webgl: { alpha: true, antialias: true, preserveDrawingBuffer: false } } });
    viewer.resolutionScale = Math.min(1, 1.5 / devicePixelRatio);
    const sc = viewer.scene; sc.screenSpaceCameraController.enableInputs = false;
    sc.skyBox.show = false; sc.skyAtmosphere.show = false; sc.sun.show = false; sc.moon.show = false; sc.fog.enabled = false;
    sc.backgroundColor = C.Color.TRANSPARENT; sc.globe.baseColor = C.Color.fromCssColorString('#2f3641'); sc.globe.showGroundAtmosphere = false;
    sc.light = new C.DirectionalLight({ direction: new C.Cartesian3(0.35, 0.55, -0.76), intensity: 2.2 });
    const ground = viewer.imageryLayers.addImageryProvider(new C.UrlTemplateImageryProvider({ url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', maximumLevel: 18, credit: '地理院タイル' }));
    ground.alpha = 0.22; ground.brightness = 0.55; ground.saturation = 0;
    viewer.renderError?.addEventListener?.(() => modelFailed());
    sc.renderError.addEventListener(() => modelFailed());
    const ids = [['13103', '港区'], ['13101', '千代田区'], ['13102', '中央区'], ['13109', '品川区']];
    const results = await Promise.allSettled(ids.map(async ([code, label]) => {
      const ts = await C.Cesium3DTileset.fromUrl(`https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/${code}-bldg-lod1-latest/tileset.json`, { maximumScreenSpaceError: 10, cacheBytes: 96 * 1024 * 1024, maximumCacheOverflowBytes: 48 * 1024 * 1024, dynamicScreenSpaceError: false, skipLevelOfDetail: false, preferLeaves: false, preloadWhenHidden: true });
      ts.wardLabel = label; sc.primitives.add(ts); tilesets.push(ts);
      ts.tileFailed.addEventListener(() => { state.lastError = label + 'の一部'; });
      ts.allTilesLoaded.addEventListener(() => scheduleRender());
      return ts;
    }));
    if (!tilesets.length) throw new Error('tilesets');
    const failed = results.map((r, i) => r.status === 'rejected' ? ids[i][1] : null).filter(Boolean);
    applyStyle(); setupTrain();
    cesiumState = 'ready'; layout();
    // keep rendering a little while tiles stream in
    renderAt(state.t, true);
    setStatus(failed.length ? `模型の一部（${failed.join('・')}）を読み込めませんでした。` : '窓の建物をタップすると、答え合わせ。', !!failed.length);
  } catch (e) { modelFailed(e); }
}
function modelFailed(e) {
  cesiumState = 'failed'; state.lastError = e?.message || 'render';
  body.classList.add('model-off'); if (state.mode !== 'tags') setMode('tags');
  document.querySelectorAll('[data-mode]').forEach(b => { if (b.dataset.mode !== 'tags') b.disabled = true; });
  setStatus('この端末では3D模型を表示できませんでした。実写と名札で楽しめます。', true);
}
// Model looks: 'blueprint' (dark faces + glowing edges) for the window, 'ghost' (edges only, screen-blended
// over the video) and 'aerial' (lighter faces). Edges come from a depth-buffer post-process.
const LOOKS = {
  blueprint: { fill: '#1d2c47', edge: [0.62, 0.93, 1.0, 0.95], near: 70, globe: true, ground: '#121a26' },
  ghost: { fill: '#000000', edge: [0.55, 0.92, 1.0, 1.0], near: 150, globe: false, ground: '#000000' },
  aerial: { fill: '#3a5276', edge: [0.8, 0.96, 1.0, 0.85], near: 0, globe: true, ground: '#16202d' },
};
let edgeStage = null, look = LOOKS.blueprint;
const EDGE_FS = `
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform vec4 u_edge;
uniform float u_near;
in vec2 v_textureCoordinates;
uniform float u_debug;
float eyeDepthAt(vec2 off) {
  vec2 uv = v_textureCoordinates + off / czm_viewport.zw;
  float d = czm_readDepth(depthTexture, uv);
  if (d >= 1.0) return 60000.0;
  vec4 p = czm_inverseProjection * vec4(uv * 2.0 - 1.0, d, 1.0);
  p /= p.w;
  float z = -p.z;
  if (!(z > 0.0) || z > 60000.0) return 60000.0;
  return z;
}
void main() {
  vec4 col = texture(colorTexture, v_textureCoordinates);
  float c = eyeDepthAt(vec2(0.0));
  float l = eyeDepthAt(vec2(-1.0, 0.0)), r = eyeDepthAt(vec2(1.0, 0.0));
  float dn = eyeDepthAt(vec2(0.0, -1.0)), up = eyeDepthAt(vec2(0.0, 1.0));
  float nearest = min(min(c, l), min(r, min(up, dn)));
  float lap = abs(l + r - 2.0 * c) + abs(up + dn - 2.0 * c);
  float jump = max(max(abs(l - c), abs(r - c)), max(abs(up - c), abs(dn - c)));
  float e = max(smoothstep(0.004, 0.02, lap / nearest), smoothstep(0.03, 0.10, jump / nearest));
  e *= smoothstep(u_near * 0.6, u_near + 1.0, nearest);
  e *= 1.0 - smoothstep(2600.0, 4500.0, nearest);
  if (nearest > 50000.0) e = 0.0;
  e *= u_edge.a;
  if (u_debug > 0.5) { out_FragColor = vec4(vec3(fract(c / 100.0)), 1.0); return; }
  out_FragColor = vec4(mix(col.rgb, u_edge.rgb, e), max(col.a, e));
}`;
function lookName() { return state.view !== 'window' ? 'aerial' : state.mode === 'ghost' ? 'ghost' : 'blueprint'; }
function applyStyle() {
  if (!tilesets.length) return;
  look = LOOKS[lookName()];
  const style = new C.Cesium3DTileStyle({ color: `color('${look.fill}')` });
  for (const t of tilesets) t.style = style;
  const sc = viewer.scene; sc.globe.show = look.globe; sc.globe.baseColor = C.Color.fromCssColorString(look.ground);
  if (!edgeStage) {
    try { edgeStage = sc.postProcessStages.add(new C.PostProcessStage({ name: 'win_edges', fragmentShader: EDGE_FS, uniforms: { u_edge: () => new C.Cartesian4(...look.edge), u_near: () => look.near, u_debug: () => window.__edgeDebug ? 1 : 0 } })); }
    catch (e) { state.lastError = 'edges:' + e.message; }
  }
  if (highlighted) highlight(highlighted);
  renderAt(state.t, true);
}

// ---------- aerial view (空から見る) ----------
function setupTrain() {
  routeEntity = viewer.entities.add({ show: false, polyline: { positions: (REFINED || ROUTE_POINTS.map(([a, b], i) => [ROUTE_CUM[i], a, b])).map(([sv, la, lo]) => C.Cartesian3.fromDegrees(lo, la, altAt(sv) - 2.4)), width: 4, material: new C.PolylineGlowMaterialProperty({ glowPower: 0.25, color: C.Color.fromCssColorString('#e8704a') }) } });
  targetEntity = viewer.entities.add({ show: false, position: C.Cartesian3.fromDegrees(139.75, 35.66, 60), point: { pixelSize: 12, color: C.Color.fromCssColorString('#e8704a'), outlineColor: C.Color.WHITE, outlineWidth: 3, disableDepthTestDistance: Infinity } });
  trainRibbon = viewer.entities.add({ show: false, polyline: { positions: [], width: 9, distanceDisplayCondition: new C.DistanceDisplayCondition(450, 1e7), material: new C.PolylineOutlineMaterialProperty({ color: C.Color.WHITE, outlineColor: C.Color.fromCssColorString('#e8704a'), outlineWidth: 2.5 }), depthFailMaterial: new C.PolylineOutlineMaterialProperty({ color: C.Color.WHITE.withAlpha(0.55), outlineColor: C.Color.fromCssColorString('#e8704a').withAlpha(0.55), outlineWidth: 2 }) } });
  for (let k = 1; k <= 16; k++) {
    const end = k === 1 || k === 16;
    trainCars.push(viewer.entities.add({ show: false, position: C.Cartesian3.fromDegrees(139.75, 35.66, 50), model: { uri: end ? 'media/n700s-lead.glb' : 'media/n700s-mid.glb', minimumPixelSize: 0, scale: 1, shadows: C.ShadowMode.DISABLED } }));
  }
}
function placeTrain(t) {
  const pose = poseAt(t), sCam = pose.s;
  // camera sits in car 7; car 1 leads toward Tokyo (smaller s)
  const offsets = [], len = k => (k === 1 || k === 16 ? 27.35 : 25);
  let s = sCam - 12.5 - 25 * 5 - 27.35 / 2 + 12.5; // centre of car 1 (approx.)
  s = sCam - (25 * 5 + 12.5 + 27.35 / 2);
  for (let k = 1; k <= 16; k++) { offsets.push(s); s += len(k) / 2 + len(k + 1) / 2; }
  if (trainRibbon) { const pts = []; for (let d = offsets[0] - 13; d <= offsets[15] + 13; d += 20) { const r = routeAt(d); pts.push(C.Cartesian3.fromDegrees(r.lon, r.lat, altAt(d) + 2)); } trainRibbon.polyline.positions = pts; }
  trainCars.forEach((e, i) => {
    const r = routeAt(offsets[i]), heading = i === 15 ? r.outbound : (r.outbound + 180) % 360; // nose direction
    const pos = C.Cartesian3.fromDegrees(r.lon, r.lat, altAt(offsets[i]) - 2.6);
    e.position = pos; e.orientation = C.Transforms.headingPitchRollQuaternion(pos, new C.HeadingPitchRoll(rad(heading), 0, 0));
  });
}
function showAerialThings(on) { routeEntity.show = on; targetEntity.show = on && !!(state.answer?.world || state.answer?.n); trainCars.forEach(e => e.show = on); if (coneEntity) coneEntity.show = on; if (trainRibbon) trainRibbon.show = on; }
let coneEntity = null;
function setCone(pose, R) {
  const pts = [pose.lon, pose.lat];
  for (let a = -pose.fov / 2; a <= pose.fov / 2 + 0.01; a += pose.fov / 12) { const h = rad(pose.heading + a); pts.push(pose.lon + Math.sin(h) * R / (M * Math.cos(rad(pose.lat))), pose.lat + Math.cos(h) * R / M); }
  const hierarchy = new C.PolygonHierarchy(C.Cartesian3.fromDegreesArray(pts));
  if (!coneEntity) coneEntity = viewer.entities.add({ show: false, polygon: { hierarchy, height: GROUND + 2, material: C.Color.fromCssColorString('#8fd8e8').withAlpha(0.16), outline: false } });
  else coneEntity.polygon.hierarchy = hierarchy;
}
let orbitState = null;
const aerialReady = () => !!(viewer && targetEntity && routeEntity);
function flyUp() {
  if (!aerialReady() || !state.answer) return;
  const a = state.answer, w = a.world || (a.n && { lat: a.n.lat, lon: a.n.lon, h: GROUND + a.n.height / 2 }); if (!w) return;
  state.resumeAfterFly = !video.paused; pause();
  state.view = 'aerial'; body.classList.add('flying'); layout(); applyWipe(); applyStyle(); placeTrain(state.t);
  targetEntity.position = C.Cartesian3.fromDegrees(w.lon, w.lat, Math.max(w.h, GROUND + 20)); showAerialThings(true);
  $('flyBar').hidden = false; $('flyTitle').textContent = `${a.n?.short || a.n?.name || '選んだ建物'}を、空から`;
  const pose = poseAt(state.t), d = a.distance || dist([pose.lat, pose.lon], [w.lat, w.lon]);
  // frame the train and the building together: look from behind the train, along the window's direction
  const target = C.Cartesian3.fromDegrees(pose.lon + (w.lon - pose.lon) * 0.45, pose.lat + (w.lat - pose.lat) * 0.45, GROUND);
  const range = clamp(d * 1.5 + 650, 800, 3600);
  orbitState = { target, heading: rad(pose.heading), pitch: rad(-56), range };
  setCone(pose, Math.max(d * 1.15, 400));
  viewer.camera.flyToBoundingSphere(new C.BoundingSphere(target, 120), { offset: new C.HeadingPitchRange(orbitState.heading, orbitState.pitch, range), duration: reduced ? 0 : 2.6, easingFunction: C.EasingFunction.CUBIC_IN_OUT, maximumHeight: range * 0.9 });
  runFlyLoop();
  setStatus('ドラッグで回して、街と線路の位置関係を見てみよう。');
}
function flyBack(instant = false) {
  if (state.view === 'window') return;
  const pose = poseAt(state.t);
  let done = false;
  const finish = () => { if (done) return; done = true; setTimeout(finishNow, 0); };
  const finishNow = () => { cancelAnimationFrame(flyLoop); state.view = 'window'; body.classList.remove('flying'); $('flyBar').hidden = true; showAerialThings(false); layout(); applyStyle(); applyWipe(); renderAt(state.t, true); if (state.resumeAfterFly) { state.resumeAfterFly = false; play(); } };
  if (instant === true || reduced) { done = true; viewer.camera.cancelFlight?.(); finishNow(); return; }
  state.view = 'returning';
  viewer.camera.flyTo({ destination: C.Cartesian3.fromDegrees(pose.lon, pose.lat, pose.height), orientation: { heading: rad(pose.heading), pitch: rad(pose.pitch), roll: rad(pose.roll) }, duration: 2.0, easingFunction: C.EasingFunction.CUBIC_IN_OUT, complete: finish, cancel: finish });
  runFlyLoop();
}
function runFlyLoop() {
  cancelAnimationFrame(flyLoop);
  const loop = () => { if (state.view === 'window') return; try { viewer.render(); updateTags(poseAt(state.t), false); } catch (e) { state.lastError = 'fly:' + e.message; } flyLoop = requestAnimationFrame(loop); };
  flyLoop = requestAnimationFrame(loop);
}
function orbit(dx, dy) {
  if (!orbitState || viewer.camera._currentFlight) return;
  orbitState.heading += dx * 0.006; orbitState.pitch = clamp(orbitState.pitch + dy * 0.004, rad(-85), rad(-12));
  viewer.camera.lookAt(orbitState.target, new C.HeadingPitchRange(orbitState.heading, orbitState.pitch, orbitState.range));
  viewer.camera.lookAtTransform(C.Matrix4.IDENTITY);
}

// ---------- mini map ----------
const MAP = { lat0: 35.655, lon0: 139.752 };
const mx = lon => (lon - MAP.lon0) * M * Math.cos(rad(MAP.lat0)), my = lat => -(lat - MAP.lat0) * M;
function drawMap() {
  const svg = $('miniMap');
  const route = routeLine().map(([la, lo]) => `${mx(lo).toFixed(0)},${my(la).toFixed(0)}`).join(' ');
  const side = names.filter(n => n.lateral > 0 && n.lateral < 1900);
  svg.innerHTML = `<g id="mapWorld">
    <polyline points="${route}" fill="none" stroke="#3b4d66" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${route}" fill="none" stroke="#8ea3bd" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path id="mapCone" fill="#8fd8e833" stroke="#8fd8e899" stroke-width="5"/>
    ${side.map(n => `<circle cx="${mx(n.lon).toFixed(0)}" cy="${my(n.lat).toFixed(0)}" r="${n.kind === 'landmark' ? 34 : 12 + n.height / 25}" fill="${n.kind === 'landmark' ? '#f0c060' : '#c9a55a'}" opacity="${n.kind === 'landmark' ? 1 : .55}" data-map-name="${esc(n.name)}"/>`).join('')}
    ${PLACES.map(p => `<g transform="translate(${mx(p.lon).toFixed(0)},${my(p.lat).toFixed(0)})"><circle r="22" fill="#0b1320" stroke="#e9eef4" stroke-width="7"/><text x="-50" y="12" text-anchor="end" font-size="96" fill="#e9eef4" font-weight="700">${esc(p.name)}</text></g>`).join('')}
    <polyline id="mapTrain" fill="none" stroke="#e8704a" stroke-width="30" stroke-linecap="round"/>
    <circle id="mapCam" r="30" fill="#fff" stroke="#e8704a" stroke-width="12"/>
    <circle id="mapAnswer" r="60" fill="none" stroke="#e8704a" stroke-width="14" opacity="0"/>
  </g>`;
}
function updateMap(pose) {
  const svg = $('miniMap'); if (!svg.firstElementChild) return;
  const cx = mx(pose.lon), cy = my(pose.lat), R = 1500, a0 = rad(pose.heading - pose.fov / 2), a1 = rad(pose.heading + pose.fov / 2);
  const pt = a => `${(cx + Math.sin(a) * R).toFixed(0)},${(cy - Math.cos(a) * R).toFixed(0)}`;
  $('mapCone').setAttribute('d', `M${cx.toFixed(0)},${cy.toFixed(0)} L${pt(a0)} A${R},${R} 0 0 1 ${pt(a1)} Z`);
  $('mapCam').setAttribute('cx', cx.toFixed(0)); $('mapCam').setAttribute('cy', cy.toFixed(0));
  const cars = []; for (let d = -170; d <= 235; d += 45) { const r = routeAt(pose.s + d); cars.push(`${mx(r.lon).toFixed(0)},${my(r.lat).toFixed(0)}`); }
  $('mapTrain').setAttribute('points', cars.join(' '));
  const ans = $('mapAnswer'); const w = state.answer?.world || (state.answer?.n && { lat: state.answer.n.lat, lon: state.answer.n.lon });
  if (w) { ans.setAttribute('cx', mx(w.lon).toFixed(0)); ans.setAttribute('cy', my(w.lat).toFixed(0)); ans.setAttribute('opacity', 1); } else ans.setAttribute('opacity', 0);
  const r = svg.getBoundingClientRect(), aspect = r.width / Math.max(1, r.height);
  if (state.overview) { const xs = ROUTE_POINTS.map(p => mx(p[1])), ys = ROUTE_POINTS.map(p => my(p[0])); const minx = Math.min(...xs) - 1400, maxx = Math.max(...xs) + 600, miny = Math.min(...ys) - 300, maxy = Math.max(...ys) + 300; let w2 = maxx - minx, h2 = maxy - miny; if (w2 / h2 < aspect) { const nw = h2 * aspect; svg.setAttribute('viewBox', `${minx - (nw - w2) / 2} ${miny} ${nw} ${h2}`); } else { const nh = w2 / aspect; svg.setAttribute('viewBox', `${minx} ${miny - (nh - h2) / 2} ${w2} ${nh}`); } }
  else { const H2 = 2600, W2 = H2 * aspect; svg.setAttribute('viewBox', `${(cx - W2 * 0.62).toFixed(0)} ${(cy - H2 / 2).toFixed(0)} ${W2.toFixed(0)} ${H2}`); }
}
function onMapClick(e) {
  const svg = $('miniMap'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  const lat = MAP.lat0 - p.y / M, lon = MAP.lon0 + p.x / (M * Math.cos(rad(MAP.lat0)));
  const pr = projectS(lat, lon); if (pr.d > 700) return;
  seek(sync.timeAtS(pr.s));
}

// ---------- emaki (slit-scan scroll) ----------
async function setupEmaki() {
  const status = $('emakiStatus');
  try {
    const r = await fetch('media/emaki-real.json', { cache: 'no-store' }); if (!r.ok) throw new Error('no emaki');
    const meta = await r.json();
    // phones get the half-size strip; both are split into GPU-friendly tiles
    const small = innerWidth < 760 && meta.small?.tiles?.length;
    emaki = small ? { ...meta, width: meta.small.width, height: meta.small.height, metersPerPx: meta.small.metersPerPx, tiles: meta.small.tiles } : meta;
  } catch { status.textContent = '絵巻の画像はまだ用意されていません。'; return; }
  const strip = $('emaki'), imgBox = $('emakiImg');
  const tiles = emaki.tiles?.length ? emaki.tiles : [{ file: emaki.file, width: emaki.width }];
  imgBox.innerHTML = tiles.map(t => `<img src="media/${esc(t.file)}" alt="" width="${t.width}" height="${emaki.height}" decoding="async" loading="eager">`).join('');
  const layoutEmaki = () => {
    const H = imgBox.clientHeight || 112; emaki.scale = H / emaki.height; emaki.trackW = emaki.width * emaki.scale;
    imgBox.querySelectorAll('img').forEach((im, i) => { im.style.width = (tiles[i].width * emaki.scale) + 'px'; });
    $('emakiTrack').style.width = emaki.trackW + 'px';
    renderEmakiLabels(); updateEmaki(poseAt(state.t));
  };
  new ResizeObserver(layoutEmaki).observe(strip); layoutEmaki();
  status.textContent = '';
  let drag = null;
  strip.addEventListener('pointerdown', e => { drag = { x: e.clientX, s: poseAt(state.t).s, moved: false, id: e.pointerId }; strip.setPointerCapture(e.pointerId); });
  strip.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; if (drag.moved) { const s = drag.s + dx / emaki.scale * emaki.metersPerPx; pause(); seek(sync.timeAtS(s)); } });
  strip.addEventListener('pointerup', e => { if (!drag) return; if (!drag.moved) { const r = strip.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2); pause(); seek(sync.timeAtS(drag.s - dx / emaki.scale * emaki.metersPerPx)); } drag = null; });
  strip.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); seek(state.t + (e.key === 'ArrowLeft' ? -3 : 3)); } });
}
function emakiX(s) { return (emaki.sStart - s) / emaki.metersPerPx * emaki.scale; }
function renderEmakiLabels() {
  if (!emaki) return;
  const yawShift = Math.tan(rad(Math.abs(calib.keys?.[1]?.yaw ?? 4)));
  const list = names.filter(n => n.lateral > 0 && n.lateral < 1600 && (n.kind === 'landmark' || n.height >= 110)).map(n => ({ n, x: emakiX(n.s - n.lateral * yawShift) })).filter(o => o.x > 0 && o.x < emaki.trackW).sort((a, b) => a.x - b.x);
  let lastX = [-1e9, -1e9]; const html = [];
  for (const o of list) { const w = (o.n.short || o.n.name).length * 10 + 10; let row = o.x - lastX[0] > w ? 0 : o.x - lastX[1] > w ? 1 : -1; if (row < 0) continue; lastX[row] = o.x; html.push(`<span class="win-emaki-name ${o.n.kind === 'landmark' ? 'landmark' : ''} ${row ? 'row1' : ''}" style="left:${o.x.toFixed(0)}px">${esc(o.n.short || o.n.name)}<i></i></span>`); }
  $('emakiNames').innerHTML = html.join('');
  $('emakiPlaces').innerHTML = PLACES.map(p => { const x = emakiX(p.s); return x > 0 && x < emaki.trackW ? `<span class="win-emaki-place" style="left:${x.toFixed(0)}px">${esc(p.name)}</span>` : ''; }).join('');
}
function updateEmaki(pose) {
  if (!emaki?.scale) return;
  const strip = $('emaki'), W = strip.clientWidth, x = emakiX(pose.s);
  $('emakiTrack').style.transform = `translateX(${(W / 2 - x).toFixed(1)}px)`;
  strip.setAttribute('aria-valuenow', Math.round((emaki.sStart - pose.s) / (emaki.sStart - emaki.sEnd) * 100));
}

// ---------- diagnostics ----------
window.windowDiagnostics = () => ({
  t: +state.t.toFixed(2), videoTime: +video.currentTime.toFixed(2), paused: video.paused, readyState: video.readyState, mode: state.mode, view: state.view, wipe: +state.wipe.toFixed(3),
  cesium: cesiumState, tiles: tilesets.map(t => ({ ward: t.wardLabel, loaded: t.tilesLoaded, ready: t.statistics?.numberOfTilesWithContentReady || 0 })),
  answer: state.answer ? { name: state.answer.name, world: state.answer.world, props: state.answer.props, distance: state.answer.distance && Math.round(state.answer.distance), noModel: state.answer.noModel } : null,
  frames: state.frames, tagCount: state.tagCount || 0, found: state.found.length, challenge: { ...state.challenge }, emaki: emaki ? { width: emaki.width, scale: emaki.scale } : null, propertyIds: state.propertyIds || null, lastError: state.lastError,
  pose: poseAt(state.t),
});
window.windowDebug = { project: (lat, lon, h) => projectToFrame(poseAt(state.t), lat, lon, h), landmark: id => LANDMARKS.find(l => l.id === id), state, lookTrain: (range = 180, headingDeg = 30, pitchDeg = -30, ds = 0) => { const p = poseAt(state.t); placeTrain(state.t); showAerialThings(true); state.view = 'aerial'; body.classList.add('flying'); applyStyle(); const q = routeAt(p.s + ds), tgt = C.Cartesian3.fromDegrees(q.lon, q.lat, 50); viewer.camera.lookAt(tgt, new C.HeadingPitchRange(rad(headingDeg), rad(pitchDeg), range)); viewer.camera.lookAtTransform(C.Matrix4.IDENTITY); viewer.render(); return p; }, identifyAt: (u, v) => { const f = state.frames; onStageTap(f.m.x + u * f.m.w, f.m.y + v * f.m.h); return window.windowDiagnostics().answer; }, seek, setMode, flyUp, flyBack, play, pause, get calib() { return calib; }, set calib(v) { calib = v; renderAt(state.t, true); } };
