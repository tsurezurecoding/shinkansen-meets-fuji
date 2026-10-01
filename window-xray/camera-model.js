// Video time → window camera pose.
// sync  : data/ride-sync.json (GPS-derived train position per 0.25 s of video time)
// calib : data/calibration.json (global lens/height/offsets + per-time yaw/pitch/roll keys)
const rad = d => d * Math.PI / 180;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const M_PER_DEG_LAT = 111195;

export class RideSync {
  constructor(json) {
    this.clip = json.clip; this.step = json.step; this.samples = json.samples; this.routeLength = json.routeLength;
    this.duration = json.clip.duration;
  }
  at(t) {
    const S = this.samples, f = clamp(t / this.step, 0, S.length - 1), i = Math.min(Math.floor(f), S.length - 2), u = f - i, a = S[i], b = S[i + 1];
    let dh = b[4] - a[4]; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
    return { t, s: a[1] + (b[1] - a[1]) * u, lat: a[2] + (b[2] - a[2]) * u, lon: a[3] + (b[3] - a[3]) * u, travelHeading: (a[4] + dh * u + 360) % 360, speed: a[5] + (b[5] - a[5]) * u, alt: a[6] == null ? null : a[6] + (b[6] - a[6]) * u };
  }
  // s decreases monotonically with t for this (inbound) clip.
  timeAtS(s) {
    const S = this.samples;
    if (s >= S[0][1]) return 0;
    if (s <= S.at(-1)[1]) return S.at(-1)[0];
    let lo = 0, hi = S.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m][1] > s) lo = m; else hi = m; }
    const a = S[lo], b = S[hi], u = (a[1] - s) / Math.max(1e-6, a[1] - b[1]);
    return a[0] + (b[0] - a[0]) * u;
  }
}

export const DEFAULT_CALIB = { global: { fov: 64, height: 52, lateral: 0, dt: 0, side: 'left' }, keys: [] };

function keyAt(keys, t) {
  if (!keys?.length) return { yaw: 0, pitch: -2, roll: 0 };
  if (t <= keys[0].t) return keys[0];
  if (t >= keys.at(-1).t) return keys.at(-1);
  let i = 1; while (keys[i].t < t) i++;
  const a = keys[i - 1], b = keys[i], u = (t - a.t) / (b.t - a.t), e = u * u * (3 - 2 * u);
  return { yaw: a.yaw + (b.yaw - a.yaw) * e, pitch: a.pitch + (b.pitch - a.pitch) * e, roll: (a.roll || 0) + ((b.roll || 0) - (a.roll || 0)) * e };
}

// Pose in degrees / metres. heading: 0 = north, clockwise. pitch: 0 = level, negative = down.
export function cameraPose(sync, calib, t) {
  const g = { ...DEFAULT_CALIB.global, ...(calib?.global || {}) }, k = keyAt(calib?.keys, t);
  const p = sync.at(clamp(t + g.dt, 0, sync.duration));
  const facing = p.travelHeading + (g.side === 'left' ? -90 : 90);
  const lat = p.lat + g.lateral * Math.cos(rad(facing)) / M_PER_DEG_LAT;
  const lon = p.lon + g.lateral * Math.sin(rad(facing)) / (M_PER_DEG_LAT * Math.cos(rad(p.lat)));
  // eye height: the multi-ride GPS altitude profile (ellipsoidal) plus an offset, or a fixed value
  const height = g.heightMode === 'track' && p.alt != null ? p.alt + (g.heightOffset || 0) : g.height;
  return { t, lat, lon, height, heading: (facing + k.yaw + 360) % 360, pitch: k.pitch, roll: k.roll || 0, fov: g.fov, s: p.s, speed: p.speed, travelHeading: p.travelHeading, facing };
}

// Apply a pose to a Cesium camera (fov is horizontal for a landscape canvas).
export function applyPose(C, camera, pose) {
  camera.frustum.fov = rad(pose.fov);
  camera.setView({ destination: C.Cartesian3.fromDegrees(pose.lon, pose.lat, pose.height), orientation: { heading: rad(pose.heading), pitch: rad(pose.pitch), roll: rad(pose.roll) } });
}

// Where a world point lands on the video frame (0..1), or null if behind the camera.
export function projectToFrame(pose, lat, lon, h, aspect = 16 / 9) {
  const north = (lat - pose.lat) * M_PER_DEG_LAT, east = (lon - pose.lon) * M_PER_DEG_LAT * Math.cos(rad(pose.lat)), up = h - pose.height;
  const hd = rad(pose.heading), pt = rad(pose.pitch), rl = rad(pose.roll);
  // camera basis (ENU): forward, right, up
  const f = [Math.sin(hd) * Math.cos(pt), Math.cos(hd) * Math.cos(pt), Math.sin(pt)];
  const r0 = [Math.cos(hd), -Math.sin(hd), 0];
  const u0 = [r0[1] * f[2] - r0[2] * f[1], r0[2] * f[0] - r0[0] * f[2], r0[0] * f[1] - r0[1] * f[0]]; // right × forward = up
  const r = r0.map((v, i) => v * Math.cos(rl) + u0[i] * Math.sin(rl)), u = u0.map((v, i) => v * Math.cos(rl) - r0[i] * Math.sin(rl));
  const v = [east, north, up], z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
  if (z < 1) return null;
  const x = v[0] * r[0] + v[1] * r[1] + v[2] * r[2], y = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
  const tx = Math.tan(rad(pose.fov) / 2), ty = tx / aspect;
  return { x: 0.5 + x / z / tx / 2, y: 0.5 - y / z / ty / 2, depth: z, dist: Math.hypot(east, north) };
}
