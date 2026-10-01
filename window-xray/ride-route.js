// Extracted unchanged from app/track.js Tokyo to Shinagawa anchors on 2026-09-26.
// WGS84 [latitude, longitude]; no surveyed rail elevation is supplied.
export const ROUTE_POINTS = [
  [35.68120, 139.76710],
  [35.67942, 139.76712],
  [35.67784, 139.76611],
  [35.67633, 139.76496],
  [35.67241, 139.76057],
  [35.66918, 139.75871],
  [35.66745, 139.75836],
  [35.66213, 139.75881],
  [35.66036, 139.75859],
  [35.65166, 139.75626],
  [35.65005, 139.75534],
  [35.64868, 139.75395],
  [35.64392, 139.74473],
  [35.64242, 139.74359],
  [35.63889, 139.74321],
  [35.63542, 139.74225],
  [35.63029, 139.74045],
  [35.62850, 139.73880],
];

export const ROUTE_SOURCE = 'app/track.js：実走GPX 4便から2026-09-06に再生成した線路形状の東京〜品川18点。高架高・窓位置は未計測。';

export const ROUTE_STOPS = [
  { name: '東京', progress: 0 },
  { name: '品川', progress: 1 },
];
