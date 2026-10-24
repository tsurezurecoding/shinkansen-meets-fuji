/* WINDOW TRIP — north-up geographic film; isolated Canvas 2D prototype. */
(function () {
  'use strict';
  const PI = Math.PI, R = 6371;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const vec = (x, y, z) => ({ x, y, z });
  const sub = (a, b) => vec(a.x - b.x, a.y - b.y, a.z - b.z);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const unit = v => { const n = Math.hypot(v.x, v.y, v.z) || 1; return vec(v.x / n, v.y / n, v.z / n); };
  const vMix = (a, b, t) => vec(mix(a.x, b.x, t), mix(a.y, b.y, t), mix(a.z, b.z, t));
  const merc = (lat, lng) => vec(Number(lng) * PI / 180 * R, 0, Math.log(Math.tan(PI / 4 + Number(lat) * PI / 360)) * R);
  // Decoded local assets survive queue changes. Stages only read these records;
  // destroying one stage must not cancel an image used by another stage.
  const imageCache = new Map();
  let imageCacheHits = 0, imageRequestCount = 0;
  const missingImage = Object.freeze({ image: null, status: 'error' });
  function sharedImage(src) {
    if (!src) return missingImage;
    let url;
    try { url = new URL(src, document.baseURI).href; } catch (_) { return missingImage; }
    if (imageCache.has(url)) { imageCacheHits++; return imageCache.get(url); }
    const image = new Image();
    imageRequestCount++;
    let status = 'loading';
    const asset = Object.freeze({ image, get status() { return status; } });
    imageCache.set(url, asset);
    image.onload = () => { status = image.naturalWidth > 0 ? 'ready' : 'error'; };
    image.onerror = () => { status = 'error'; };
    image.src = url;
    return asset;
  }
  function imageItem(item) {
    const record = { ...item, asset: null };
    Object.defineProperties(record, {
      image: { get() { return this.asset ? this.asset.image : null; } },
      status: { get() { return this.asset ? this.asset.status : 'idle'; } }
    });
    return record;
  }

  window.createFlightStage = function createFlightStage(canvas, data) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('This preview needs Canvas 2D.');
    const source = Array.isArray(data.points) ? data.points : [];
    const stops = Array.isArray(data.stops) ? data.stops : [];
    const first = source[0] || stops[0] || { lat: 35, lng: 136 };
    const origin = merc(first.lat, first.lng);
    const world = item => sub(merc(item.lat, item.lng), origin);
    const route = source.map(p => ({ ...world(p), km: Number(p.km) })).filter(p => Number.isFinite(p.km) && Number.isFinite(p.x) && Number.isFinite(p.z)).sort((a, b) => a.km - b.km);
    if (route.length < 2) {
      route.length = 0;
      route.push({ x: 0, y: 0, z: 0, km: 0 }, { x: 0, y: 0, z: 100, km: 100 });
    }
    const minKm = route[0].km, maxKm = route[route.length - 1].km;
    function at(km) {
      km = clamp(Number(km) || 0, minKm, maxKm);
      let lo = 0, hi = route.length - 1;
      while (lo + 1 < hi) { const m = (lo + hi) >> 1; if (route[m].km <= km) lo = m; else hi = m; }
      const a = route[lo], b = route[hi];
      return vMix(a, b, clamp((km - a.km) / (b.km - a.km || 1), 0, 1));
    }
    const sites = stops.map((s, i) => imageItem({ ...s, km: Number(s.km), anchor: world(s), index: i }));
    const markerLabel = site => site.kind === '727' ? '727' : String(site.mapLabel || site.ja || '車窓').slice(0, 13);
    const stations = (data.stations || []).map(s => ({ ...s, km: Number(s.km), pos: at(Number(s.km)) }));
    let width = 1, height = 1, dpr = 1, focal = 1, destroyed = false;
    let projectionX = .36, projectionY = .65, camera, forward, up;
    let lastState = { index: 0, progress: .6, km: sites[0] ? sites[0].km : 0, time: 0, playing: false, light: 'day', motionMode: 'scenic' };
    let renderedKm = lastState.km;
    const tileSource = window.FLIGHT_MAP && Array.isArray(window.FLIGHT_MAP.tiles) ? window.FLIGHT_MAP.tiles : [];
    const tiles = tileSource.map(t => imageItem(t)).sort((a, b) => a.z - b.z);
    const trainAsset = sharedImage(data.trainSprite || 'assets/train.png');

    function loadPhoto(index) {
      const site = sites[index];
      if (!site || site.status !== 'idle') return;
      site.asset = sharedImage(site.photo && site.photo.src);
    }
    function loadMap() {
      for (const tile of tiles) {
        tile.asset = sharedImage(tile.src);
        const n = Math.pow(2, tile.z), span = 2 * PI * R / n;
        tile.left = tile.x * span - PI * R - origin.x;
        tile.north = PI * R - tile.y * span - origin.z;
        tile.span = span;
        const cols = tile.z <= 7 ? 18 : tile.z === 9 ? 7 : Math.max(2, Math.ceil(span / 12));
        const vertices = [], cells = [];
        for (let y = 0; y <= cols; y++) for (let x = 0; x <= cols; x++) vertices.push(vec(tile.left + x / cols * span, 0, tile.north - y / cols * span));
        for (let y = 0; y < cols; y++) for (let x = 0; x < cols; x++) {
          const top = y * (cols + 1) + x, bottom = (y + 1) * (cols + 1) + x;
          cells.push({ indices: [top, top + 1, bottom + 1, bottom], uv: [{ x: x / cols, y: y / cols }, { x: (x + 1) / cols, y: y / cols }, { x: (x + 1) / cols, y: (y + 1) / cols }, { x: x / cols, y: (y + 1) / cols }] });
        }
        tile.mesh = { vertices, cells };
      }
    }
    function resize() {
      if (destroyed) return;
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width || canvas.clientWidth || 800);
      height = Math.max(1, bounds.height || canvas.clientHeight || 520);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      focal = width * .80;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function project(point) {
      const relative = sub(point, camera), depth = dot(relative, forward);
      if (depth < .15) return null;
      return { x: width * projectionX + relative.x * focal / depth, y: height * projectionY - dot(relative, up) * focal / depth, depth };
    }
    function path(points, close) {
      let begun = false;
      ctx.beginPath();
      for (const p of points) {
        if (!p) { begun = false; continue; }
        if (!begun) { ctx.moveTo(p.x, p.y); begun = true; } else ctx.lineTo(p.x, p.y);
      }
      if (close) ctx.closePath();
    }
    function inFrame(points, margin) {
      return !points.every(p => p.x < -margin) && !points.every(p => p.x > width + margin) && !points.every(p => p.y < -margin) && !points.every(p => p.y > height + margin);
    }
    function triangle(image, sourcePoints, dest) {
      const a = sourcePoints[0], b = sourcePoints[1], c = sourcePoints[2], p = dest[0], q = dest[1], r = dest[2];
      const den = a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y);
      if (Math.abs(den) < .00001) return;
      const aa = (p.x * (b.y - c.y) + q.x * (c.y - a.y) + r.x * (a.y - b.y)) / den;
      const bb = (p.y * (b.y - c.y) + q.y * (c.y - a.y) + r.y * (a.y - b.y)) / den;
      const cc = (p.x * (c.x - b.x) + q.x * (a.x - c.x) + r.x * (b.x - a.x)) / den;
      const dd = (p.y * (c.x - b.x) + q.y * (a.x - c.x) + r.y * (b.x - a.x)) / den;
      const ee = (p.x * (b.x * c.y - c.x * b.y) + q.x * (c.x * a.y - a.x * c.y) + r.x * (a.x * b.y - b.x * a.y)) / den;
      const ff = (p.y * (b.x * c.y - c.x * b.y) + q.y * (c.x * a.y - a.x * c.y) + r.y * (a.x * b.y - b.x * a.y)) / den;
      const winding = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x) >= 0 ? 1 : -1;
      const normals = dest.map((v, i) => {
        const next = dest[(i + 1) % 3], dx = next.x - v.x, dy = next.y - v.y, length = Math.hypot(dx, dy) || 1;
        return { x: dy / length * winding, y: -dx / length * winding };
      });
      const expanded = dest.map((v, i) => {
        const before = normals[(i + 2) % 3], after = normals[i];
        const miter = 1.05 / Math.max(.12, 1 + before.x * after.x + before.y * after.y);
        return { x: v.x + (before.x + after.x) * miter, y: v.y + (before.y + after.y) * miter };
      });
      ctx.save(); path(expanded, true); ctx.clip(); ctx.transform(aa, bb, cc, dd, ee, ff); ctx.drawImage(image, 0, 0); ctx.restore();
    }

    function drawMap(focus, night) {
      ctx.fillStyle = night ? '#183044' : '#8ab3bf'; ctx.fillRect(0, 0, width, height);
      // Tiles and GPS geometry share the same Mercator plane. The camera never yaws.
      for (const tile of tiles) {
        if (tile.status !== 'ready') continue;
        if (tile.left > focus.x + 140 || tile.left + tile.span < focus.x - 140 || tile.north < focus.z - 180 || tile.north - tile.span > focus.z + 210) continue;
        const iw = tile.image.naturalWidth, ih = tile.image.naturalHeight;
        // Neighboring cells share projected corners instead of projecting each
        // corner four times. Geometry is static until this stage is recreated.
        const projected = tile.mesh.vertices.map(project);
        for (const cell of tile.mesh.cells) {
          const p = cell.indices.map(index => projected[index]);
          if (p.some(s => !s) || !inFrame(p, 6)) continue;
          const s = cell.uv.map(uv => ({ x: uv.x * iw, y: uv.y * ih }));
          triangle(tile.image, [s[0], s[1], s[2]], [p[0], p[1], p[2]]);
          triangle(tile.image, [s[0], s[2], s[3]], [p[0], p[2], p[3]]);
        }
      }
      if (night) {
        // This pass ends before route, labels and photographs are painted.
        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#52728c'; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(4,15,35,.50)'; ctx.fillRect(0, 0, width, height);
        ctx.restore();
      } else { ctx.fillStyle = 'rgba(28,57,66,.11)'; ctx.fillRect(0, 0, width, height); }
      const shade = ctx.createLinearGradient(0, 0, 0, height);
      shade.addColorStop(0, 'rgba(12,32,46,.66)'); shade.addColorStop(.19, 'rgba(20,42,52,.10)'); shade.addColorStop(.57, 'rgba(14,37,48,.035)'); shade.addColorStop(1, 'rgba(8,25,39,.76)');
      ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
    }
    function routeSegment(start, end) {
      const points = [];
      for (let km = Math.max(minKm, start); km <= Math.min(maxKm, end); km += .35) {
        const p = at(km); p.y = .04; points.push(project(p));
      }
      const final = at(Math.min(maxKm, end)); final.y = .04; points.push(project(final)); return points;
    }
    function drawRoute(focusKm, time, state) {
      const start = Math.max(minKm, focusKm - 140), end = Math.min(maxKm, focusKm + 180);
      const points = routeSegment(start, end);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      path(points); ctx.lineWidth = 8.5; ctx.strokeStyle = 'rgba(17,46,62,.28)'; ctx.stroke();
      path(points); ctx.lineWidth = 4.4; ctx.strokeStyle = '#fff5d9'; ctx.stroke();
      path(points); ctx.lineWidth = 2.2; ctx.strokeStyle = '#486778'; ctx.stroke();
      const trail = routeSegment(start, focusKm);
      path(trail); ctx.lineWidth = 4.2; ctx.strokeStyle = '#fff0c8'; ctx.stroke();
      path(trail); ctx.lineWidth = 2.6; ctx.strokeStyle = '#d99039'; ctx.stroke();
      for (let i = 0; i < 14; i++) {
        const travel = state.reducedMotion ? i / 14 : ((time * .023 + i / 14) % 1);
        const p = at(mix(start, end, travel)); p.y = .06; const s = project(p);
        if (!s || s.x < -20 || s.x > width + 20 || s.y < 0 || s.y > height + 20) continue;
        ctx.fillStyle = '#fff5d5'; ctx.beginPath(); ctx.arc(s.x, s.y, 1.35, 0, PI * 2); ctx.fill();
      }
      const point = at(focusKm); point.y = .09;
      const p = project(point);
      if (p) {
        ctx.fillStyle = '#efb450'; ctx.strokeStyle = '#fff7dd'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6.7, 0, PI * 2); ctx.fill(); ctx.stroke();
        if (trainAsset.status === 'ready') {
          const nose = project(at(Math.min(maxKm, focusKm + .7)));
          if (nose) {
            const heading = Math.atan2(nose.y - p.y, nose.x - p.x);
            const spriteW = width < 600 ? 47 : 68, spriteH = spriteW * .654;
            ctx.save(); ctx.translate(p.x, p.y - 4); ctx.rotate(heading - .49);
            ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
            ctx.drawImage(trainAsset.image, 57, 119, 389, 255, -spriteW * .53, -spriteH * .51, spriteW, spriteH); ctx.restore();
          }
        }
      }
      ctx.lineCap = 'butt';
    }
    function drawPlaces(focusKm, currentIndex, night) {
      const labels = [];
      for (const station of stations) {
        if (Math.abs(station.km - focusKm) > 140) continue;
        const p = project(station.pos);
        if (!p || p.x < 24 || p.x > width - 52 || p.y < 65 || p.y > height - 60) continue;
        if (labels.some(q => Math.abs(q.x - p.x) < 88 && Math.abs(q.y - p.y) < 26)) continue;
        labels.push(p);
        ctx.fillStyle = night ? '#dce6e9' : '#1c4052'; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.font = '600 10px system-ui, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.lineWidth = 3; ctx.strokeStyle = night ? '#152b3a' : 'rgba(251,247,231,.86)'; ctx.strokeText(station.ja || '', p.x + 8, p.y);
        ctx.fillStyle = night ? '#e3ebef' : '#203d4e'; ctx.fillText(station.ja || '', p.x + 8, p.y);
      }
      for (const site of sites) {
        if (Math.abs(site.km - focusKm) > 90) continue;
        const p = project(site.anchor);
        if (!p || p.x < -15 || p.x > width + 15 || p.y < 35 || p.y > height + 15) continue;
        const active = site.index === currentIndex, size = active ? 6 : 3.4, board = site.kind === '727';
        ctx.fillStyle = active ? (board ? '#ed794c' : '#398e85') : '#fff1d6'; ctx.strokeStyle = active ? '#fff8e9' : (board ? '#ba7645' : '#438579'); ctx.lineWidth = active ? 1.8 : 1.2;
        ctx.beginPath();
        if (board) { ctx.moveTo(p.x, p.y - size); ctx.lineTo(p.x + size, p.y); ctx.lineTo(p.x, p.y + size); ctx.lineTo(p.x - size, p.y); ctx.closePath(); }
        else ctx.arc(p.x, p.y, size, 0, PI * 2);
        ctx.fill(); ctx.stroke();
      }
      ctx.textBaseline = 'alphabetic';
    }

    function imageInQuad(site, screen) {
      if (site.status !== 'ready') {
        path(screen, true); ctx.fillStyle = '#eadfc8'; ctx.fill();
        const x = screen.reduce((n, p) => n + p.x, 0) / 4, y = screen.reduce((n, p) => n + p.y, 0) / 4;
        const w = Math.hypot(screen[1].x - screen[0].x, screen[1].y - screen[0].y);
        ctx.save(); path(screen, true); ctx.clip(); ctx.textAlign = 'center'; ctx.fillStyle = site.kind === '727' ? '#e8704a' : '#3c8076'; ctx.font = '700 ' + clamp(w * .105, 15, 45) + 'px system-ui, sans-serif'; ctx.fillText(markerLabel(site), x, y);
        if (w > 150) { ctx.font = '500 11px system-ui, sans-serif'; ctx.fillStyle = '#3d4851'; ctx.fillText(site.status === 'error' ? '写真を読み込めませんでした' : '写真を読み込み中', x, y + 27); }
        ctx.restore(); return;
      }
      const image = site.image, cols = 3, rows = 2;
      const q = (u, v) => ({ x: mix(mix(screen[0].x, screen[1].x, u), mix(screen[3].x, screen[2].x, u), v), y: mix(mix(screen[0].y, screen[1].y, u), mix(screen[3].y, screen[2].y, u), v) });
      ctx.save(); path(screen, true); ctx.clip();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const u0 = x / cols, u1 = (x + 1) / cols, v0 = y / rows, v1 = (y + 1) / rows;
        const p = [q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)];
        const s = [{ x: u0 * image.naturalWidth, y: v0 * image.naturalHeight }, { x: u1 * image.naturalWidth, y: v0 * image.naturalHeight }, { x: u1 * image.naturalWidth, y: v1 * image.naturalHeight }, { x: u0 * image.naturalWidth, y: v1 * image.naturalHeight }];
        triangle(image, [s[0], s[1], s[2]], [p[0], p[1], p[2]]);
        triangle(image, [s[0], s[2], s[3]], [p[0], p[2], p[3]]);
      }
      ctx.restore();
    }
    function drawPhoto(site, phase, alpha, state, intro) {
      if (!site || alpha <= .002) return;
      const mobile = width <= 600;
      const ratio = site.status === 'ready' ? site.image.naturalWidth / site.image.naturalHeight : 1.5;
      const scale = state.reducedMotion ? 1 : .96 + phase * .065;
      const maxW = width * (intro ? (mobile ? .80 : .45) : (mobile ? .86 : .55));
      const mobileTop = 127, mobileBottom = Math.max(265, height - 280);
      const maxH = mobile ? (intro ? Math.min(140, height * .21) : mobileBottom - mobileTop - 14) : height * (intro ? .57 : .64);
      const w = Math.min(maxW, maxH * ratio) * scale, h = w / ratio;
      const cx = width * (intro ? (mobile ? .50 : .70) : (mobile ? .515 - phase * .025 : .685 - phase * .06));
      const cy = mobile ? (intro ? 127 + maxH / 2 : (mobileTop + mobileBottom) / 2 - (phase - .5) * 7) : height * (intro ? .43 : .414 - phase * .017);
      const tilt = intro ? -.016 : -.011 + phase * .01;
      const skew = w * (intro ? .018 : .009);
      const screen = [
        { x: cx - w / 2 - skew, y: cy - h / 2 - w * tilt / 2 },
        { x: cx + w / 2 + skew, y: cy - h / 2 + w * tilt / 2 },
        { x: cx + w / 2 - skew, y: cy + h / 2 + w * tilt / 2 },
        { x: cx - w / 2 + skew, y: cy + h / 2 - w * tilt / 2 }
      ];
      ctx.save(); ctx.globalAlpha = alpha;
      const anchor = project(site.anchor);
      const attach = { x: cx - w * .28, y: cy + h / 2 + 4 };
      if (anchor && inFrame([anchor], 80)) {
        const elbow = { x: attach.x, y: Math.max(attach.y + 15, mix(attach.y, anchor.y, .56)) };
        ctx.lineWidth = 3.6; ctx.strokeStyle = 'rgba(16,43,56,.3)'; path([attach, elbow, anchor]); ctx.stroke();
        ctx.lineWidth = 1.4; ctx.strokeStyle = '#fff0c4'; path([attach, elbow, anchor]); ctx.stroke();
        ctx.fillStyle = site.kind === '727' ? '#f19a5f' : '#58a99a'; ctx.strokeStyle = '#fff4dc'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(anchor.x, anchor.y, 5.5, 0, PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = '700 9px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff4df'; ctx.strokeStyle = '#294252'; ctx.lineWidth = 3;
        ctx.strokeText(markerLabel(site), anchor.x, anchor.y - 11); ctx.fillText(markerLabel(site), anchor.x, anchor.y - 11);
      }
      ctx.shadowColor = 'rgba(12,33,42,.43)'; ctx.shadowBlur = 27; ctx.shadowOffsetY = 16;
      path(screen, true); ctx.fillStyle = '#f8efdc'; ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      imageInQuad(site, screen);
      path(screen, true); ctx.lineWidth = mobile ? 3 : 4; ctx.strokeStyle = '#fcf4e2'; ctx.stroke();
      path([screen[3], screen[2]]); ctx.lineWidth = 2; ctx.strokeStyle = '#d69b48'; ctx.stroke();
      ctx.restore();
    }
    function render(state) {
      if (destroyed) return;
      state = { ...lastState, ...state }; lastState = state;
      const index = clamp(Math.floor(Number(state.index) || 0), 0, Math.max(0, sites.length - 1));
      const current = sites[index];
      const nextIndex = Number.isFinite(state.nextIndex) ? state.nextIndex : index + 1;
      const next = sites[nextIndex];
      loadPhoto(index); loadPhoto(nextIndex); loadPhoto(index - 1);
      const phase = state.reducedMotion ? .5 : clamp(Number(state.progress) || 0, 0, 1);
      const time = state.reducedMotion ? 0 : Number(state.time) || 0;
      const stopKm = current ? current.km : minKm;
      const focusKm = state.reducedMotion ? stopKm : clamp(Number.isFinite(Number(state.km)) ? Number(state.km) : stopKm, minKm, maxKm);
      renderedKm = focusKm;
      const intro = state.started === false, mobile = width <= 600, focus = at(focusKm);
      projectionX = intro ? (mobile ? .50 : .37) : (mobile ? .47 : .32);
      projectionY = intro ? (mobile ? .55 : .68) : (mobile ? .60 : .68);
      // Constant pose relative to the moving ground point: fixed north, fixed altitude.
      camera = vec(focus.x, 48, focus.z - 23);
      forward = unit(vec(0, -48, 23)); up = unit(vec(0, 23, 48));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const night = state.light === 'night';
      drawMap(focus, night); drawRoute(focusKm, time, state); drawPlaces(focusKm, index, night);
      if (!state.overview) {
        const blend = !state.reducedMotion && !intro;
        if (blend && phase < .15 && index > 0) {
          const alpha = .5 + .5 * ease(phase / .15);
          drawPhoto(sites[index - 1], phase + 1, 1 - alpha, state, false);
          drawPhoto(current, phase, alpha, state, false);
        } else {
          const transition = blend && next && nextIndex > index ? .5 * ease((phase - .85) / .15) : 0;
          drawPhoto(current, phase, 1 - transition, state, intro);
          if (transition > 0) drawPhoto(next, phase - 1, transition, state, false);
        }
      }
      if (intro && !mobile) {
        const shade = ctx.createLinearGradient(0, 0, width * .59, 0);
        shade.addColorStop(0, 'rgba(12,31,44,.72)'); shade.addColorStop(.66, 'rgba(12,31,44,.43)'); shade.addColorStop(1, 'rgba(12,31,44,0)');
        ctx.fillStyle = shade; ctx.fillRect(0, 0, width * .59, height);
      }
    }
    function getState() {
      const current = sites[clamp(Number(lastState.index) || 0, 0, Math.max(0, sites.length - 1))];
      const center = camera ? at(renderedKm) : null;
      const centerScreen = center ? project(center) : null;
      const northScreen = center ? project(vec(center.x, center.y, center.z + 1)) : null;
      return {
        width, height, dpr, ready: sites.filter(s => s.status === 'ready').length, total: sites.length,
        failed: sites.filter(s => s.status === 'error').map(s => s.id),
        currentId: current ? current.id : null, currentPhotoStatus: current ? current.status : 'empty',
        currentPhotoSrc: current && current.photo ? current.photo.src || null : null,
        currentKind: current ? current.kind || 'scenery' : null, currentMarkerLabel: current ? markerLabel(current) : null,
        light: lastState.light === 'night' ? 'night' : 'day', mapTheme: lastState.light === 'night' ? 'night-blue' : 'day-pale',
        motionMode: lastState.motionMode === 'constant' ? 'constant' : 'scenic',
        imageCache: { entries: imageCache.size, hits: imageCacheHits, requests: imageRequestCount },
        cacheTotal: imageCache.size, requestCount: imageRequestCount,
        bearing: 0, focusKm: renderedKm, camera: camera ? { ...camera } : null,
        northScreenDelta: centerScreen && northScreen ? { x: northScreen.x - centerScreen.x, y: northScreen.y - centerScreen.y } : null,
        mapReady: tiles.filter(t => t.status === 'ready').length, mapTotal: tiles.length,
        mapFailed: tiles.filter(t => t.status === 'error').map(t => t.z + '/' + t.x + '/' + t.y)
      };
    }
    function destroy() {
      destroyed = true;
    }
    resize(); loadMap(); loadPhoto(0); loadPhoto(1);
    return { render, resize, destroy, getState };
  };
})();
